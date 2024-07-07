import fs from 'node:fs';
import { Transform, finished } from 'node:stream';
import util from 'node:util';
import constants from '../../constants';
import {
    AggregatedWeatherStationData,
    WorkerThreadInput,
    SummarizedStationData,
} from '../types';
import logging from '../../logging';
import transforms from './transforms';

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

    let writeIntoCityBuffer = true;
    let cityBufferPointer = 0;
    const cityBuffer = Buffer.alloc(
        constants.STATION_NAME_MAX_SIZE_IN_BYTES,
        0
    );

    let temperatureBufferPointer = 0;
    const temperatureBuffer = Buffer.alloc(
        constants.TEMPERATURE_MAX_SIZE_IN_BYTES,
        0
    );

    const summarizedStationDataMap: {
        [index: string]: SummarizedStationData;
    } = {};

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
                    writeIntoCityBuffer = false;

                    continue;
                }

                if (c === constants.CHAR_NEWLINE) {
                    const stationName = cityBuffer
                        .subarray(0, cityBufferPointer)
                        .toString();

                    const temperature =
                        transforms.transformTemperatureBufferToTemperature(
                            temperatureBuffer
                        );

                    const stationData = summarizedStationDataMap[
                        stationName
                    ] || {
                        min: 0,
                        max: 0,
                        sum: 0,
                        count: 0,
                    };

                    summarizedStationDataMap[stationName] = {
                        min: Math.min(stationData.min, temperature),
                        max: Math.max(stationData.max, temperature),
                        sum: stationData.sum + temperature,
                        count: stationData.count + 1,
                    };

                    writeIntoCityBuffer = true;

                    cityBufferPointer = 0;
                    temperatureBufferPointer = 0;
                    continue;
                }

                if (writeIntoCityBuffer) {
                    cityBuffer[cityBufferPointer] = c;
                    cityBufferPointer++;
                    continue;
                }

                temperatureBuffer[temperatureBufferPointer] = c;
                temperatureBufferPointer++;
            }

            callback(null);
        },
        highWaterMark: highWaterMark,
    });

    readStream.pipe(transformStream);

    await streamFinishedAsync(readStream);

    const aggregatedWeatherStationDataItems = Object.keys(
        summarizedStationDataMap
    ).map((stationName) => {
        const summarizedStationData = summarizedStationDataMap[stationName];
        const aggregatedWeatherStationData: AggregatedWeatherStationData = {
            stationName: stationName,
            min: summarizedStationData.min / 10,
            max: summarizedStationData.max / 10,
            mean: summarizedStationData.sum / summarizedStationData.count / 10,
        };
        return aggregatedWeatherStationData;
    });

    return aggregatedWeatherStationDataItems;
};
