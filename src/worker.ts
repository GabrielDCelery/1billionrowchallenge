import fs from 'node:fs';
import { Transform, finished } from 'node:stream';
import { workerData, parentPort } from 'node:worker_threads';
import util from 'node:util';
import * as constants from './constants';

type CityData = {
    min: number;
    max: number;
    sum: number;
    count: number;
};

type WorkerData = {
    weatherStationDataFilePath: string;
    threadConfiguration: {
        threadId: number;
        firstCharIdx: number;
        lastCharIdx: number;
    };
};

const streamFinishedAsync = util.promisify(finished);

const run = async (workerData: WorkerData) => {
    const highWaterMark = Math.pow(2, 20);

    let writeIntoCityBuffer = true;
    let cityBufferPointer = 0;
    const cityBuffer = Buffer.alloc(
        constants.STATION_NAME_MAX_SIZE_IN_BYTES,
        0
    );

    let writeIntoTemperatureBuffer = false;
    let temperatureBufferPointer = 0;
    const temperatureBuffer = Buffer.alloc(
        constants.TEMPERATURE_MAX_SIZE_IN_BYTES,
        0
    );

    const groupedTemperatureData: { [index: string]: CityData } = {};

    const readStream = fs.createReadStream(
        workerData.weatherStationDataFilePath,
        {
            highWaterMark: highWaterMark,
            start: workerData.threadConfiguration.firstCharIdx,
            end: workerData.threadConfiguration.lastCharIdx,
        }
    );

    const transformStream = new Transform({
        transform: (chunk, encoding, callback) => {
            for (let i = 0, iMax = chunk.length; i < iMax; i++) {
                const c = chunk[i];

                if (c === constants.CHAR_SEMICOLON) {
                    writeIntoCityBuffer = false;
                    writeIntoTemperatureBuffer = true;
                    continue;
                }

                if (c === constants.CHAR_NEWLINE) {
                    const cityName = cityBuffer
                        .subarray(0, cityBufferPointer)
                        .toString();

                    const temperature = Number.parseFloat(
                        temperatureBuffer
                            .subarray(0, temperatureBufferPointer)
                            .toString()
                    );

                    const cityData = groupedTemperatureData[cityName] || {
                        min: 0,
                        max: 0,
                        sum: 0,
                        count: 0,
                    };

                    groupedTemperatureData[cityName] = {
                        min: Math.min(cityData.min, temperature),
                        max: Math.max(cityData.max, temperature),
                        sum: cityData.sum + temperature,
                        count: cityData.count + 1,
                    };

                    writeIntoCityBuffer = true;
                    writeIntoTemperatureBuffer = false;
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

    return groupedTemperatureData;
};

(async () => {
    if (!parentPort) {
        throw new Error(`No message port`);
    }
    const result = await run(workerData);
    parentPort.postMessage(result);
})();
