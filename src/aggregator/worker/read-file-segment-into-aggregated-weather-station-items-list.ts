import fs from 'node:fs';
import { Transform, finished } from 'node:stream';
import util from 'node:util';
import constants from '../../constants';
import { AggregatedWeatherStationData, WorkerThreadInput } from '../types';
import transforms from './transforms';
import { StationDataAggregator } from './station-data-aggregator';

const streamFinishedAsync = util.promisify(finished);

export const readFileSegmentIntoAggregatedWeatherStationDataItems = async (
    workerData: WorkerThreadInput
): Promise<AggregatedWeatherStationData[]> => {
    const { threadConfiguration } = workerData;

    const highWaterMark = Math.pow(2, 20);

    let writeIntoStationBuffer = true;
    let stationNameLengthInBytes = 0;
    const stationNameBuffer = Buffer.alloc(
        constants.STATION_NAME_MAX_SIZE_IN_BYTES,
        0
    );

    let temperatureLengthInBytes = 0;
    const temperatureBuffer = Buffer.alloc(
        constants.TEMPERATURE_MAX_SIZE_IN_BYTES,
        0
    );

    const stationDataAggregator = new StationDataAggregator();

    const readStream = fs.createReadStream(
        threadConfiguration.weatherStationDataFilePath,
        {
            highWaterMark: highWaterMark,
            start: threadConfiguration.firstCharIdx,
            end: threadConfiguration.lastCharIdx,
        }
    );

    const transformStream = new Transform({
        transform: (chunk, encoding, callback) => {
            for (let i = 0, iMax = chunk.length; i < iMax; i++) {
                const c = chunk[i];

                if (c === constants.CHAR_SEMICOLON) {
                    writeIntoStationBuffer = false;

                    continue;
                }

                if (c === constants.CHAR_NEWLINE) {
                    const temperature =
                        transforms.transformTemperatureBufferToTemperature(
                            temperatureBuffer
                        );

                    stationDataAggregator.appendTemperature({
                        stationNameBuffer,
                        stationNameLengthInBytes,
                        temperature,
                    });

                    writeIntoStationBuffer = true;
                    stationNameLengthInBytes = 0;
                    temperatureLengthInBytes = 0;
                    continue;
                }

                if (writeIntoStationBuffer) {
                    stationNameBuffer[stationNameLengthInBytes] = c;
                    stationNameLengthInBytes++;
                    continue;
                }

                temperatureBuffer[temperatureLengthInBytes] = c;
                temperatureLengthInBytes++;
            }

            callback(null);
        },
        highWaterMark: highWaterMark,
    });

    readStream.pipe(transformStream);

    await streamFinishedAsync(readStream);

    return stationDataAggregator.getAggregaredWeatherStationDataItems();
};
