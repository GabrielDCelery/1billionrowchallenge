const fs = require('node:fs');
const { Transform } = require('node:stream');
const { finished } = require('node:stream/promises');
const { workerData, parentPort } = require('node:worker_threads');
const constants = require('./constants');
const transforms = require('./transforms');

const run = async (workerData) => {
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

    const groupedTemperatureData = {};

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
                c = chunk[i];

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

    await finished(readStream);

    return groupedTemperatureData;
};

(async () => {
    const result = await run(workerData);
    parentPort.postMessage(result);
})();
