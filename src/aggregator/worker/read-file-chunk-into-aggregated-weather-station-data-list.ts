import fs from 'node:fs';
import { Transform, finished } from 'node:stream';
import util from 'node:util';
import constants from '../../constants';
import { WorkerThreadInput } from '../types';
import logging from '../../logging';
import transforms from './transforms';
import { SummarizedStationDataMap } from './summarized-station-data-map';

const streamFinishedAsync = util.promisify(finished);

export const readFileChunkIntoAggregatedWeatherStationDataList = async (
    workerData: WorkerThreadInput
) => {
    const { weatherStationDataFilePath, threadConfiguration, logLevel } =
        workerData;

    const logger = logging.createLogger({ logLevel });

    logger.log(
        'debug',
        `Start CPU intensive task on thread ID ${threadConfiguration.threadId}, firstCharIdx ${threadConfiguration.firstCharIdx}, lastCharIdx ${threadConfiguration.lastCharIdx}`
    );

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

    const summarizedStationDataMap = new SummarizedStationDataMap();

    const readStream = fs.createReadStream(weatherStationDataFilePath, {
        highWaterMark: highWaterMark,
        start: threadConfiguration.firstCharIdx,
        end: threadConfiguration.lastCharIdx,
    });

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

                    summarizedStationDataMap.append({
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

    return summarizedStationDataMap.getAggregaredWeatherStationDataItems();
};
