const os = require('node:os');
const fs = require('node:fs');
const util = require('node:util');
const path = require('node:path');
const worker_threads = require('node:worker_threads');
const constants = require('./constants');

/*
Hamburg;12.0
Bulawayo;8.9
Palembang;38.8
St. John's;15.2
Cracow;12.6
Bridgetown;26.9
Istanbul;6.2
Roseau;34.4
Conakry;31.2
Istanbul;23.0
*/

const SEED_FOLDER = '../seed';
const MEASUREMENTS_FILE_NAME = 'measurements.txt';

const fsOpenAsync = util.promisify(fs.open);
const fsReadAsync = util.promisify(fs.read);
const fsCloseAsync = util.promisify(fs.close);

const createPlanForProcessingLargeWeatherStationDataFile = async ({
    weatherStationDataFilePath,
}) => {
    const threadConfigurations = [];

    const cpuCoreCount = os.cpus().length;
    const fileSizeInBytes = fs.statSync(weatherStationDataFilePath).size;

    const numberOfWorkerThreadsToUse = Math.floor(cpuCoreCount * 0.8);

    const estimateOfBytesAThreadWillNeedToProcess = Math.floor(
        fileSizeInBytes / numberOfWorkerThreadsToUse
    );

    const maxByteSizeOfASingleStationDataPoint =
        constants.STATION_NAME_MAX_SIZE_IN_BYTES + // maximum size of station in bytes
        1 + // character ;
        constants.TEMPERATURE_MAX_SIZE_IN_BYTES + // maximum size of temperature data in bytes
        1; // character \n

    const fileDescriptor = await fsOpenAsync(weatherStationDataFilePath);

    for (let threadId = 0; threadId < numberOfWorkerThreadsToUse; threadId++) {
        const prevThreadConfiguration = threadConfigurations[threadId - 1];
        const firstCharIdx = prevThreadConfiguration
            ? prevThreadConfiguration.lastCharIdx + 1
            : 0;

        const estimatedLastCharIdx =
            firstCharIdx + estimateOfBytesAThreadWillNeedToProcess;

        if (estimatedLastCharIdx > fileSizeInBytes) {
            const threadConfiguration = {
                threadId: threadId,
                firstCharIdx: firstCharIdx,
                lastCharIdx: fileSizeInBytes - 1,
            };
            threadConfigurations.push(threadConfiguration);
            break;
        }

        const lookAheadBuffer = Buffer.alloc(
            maxByteSizeOfASingleStationDataPoint,
            0
        );

        await fsReadAsync(
            fileDescriptor,
            lookAheadBuffer,
            0,
            maxByteSizeOfASingleStationDataPoint,
            estimatedLastCharIdx
        );

        const lastCharIdx =
            estimatedLastCharIdx + lookAheadBuffer.indexOf('\n');

        const threadConfiguration = {
            threadId: threadId,
            firstCharIdx: firstCharIdx,
            lastCharIdx: lastCharIdx,
        };

        threadConfigurations.push(threadConfiguration);
    }

    await fsCloseAsync(fileDescriptor);

    return threadConfigurations;
};

const collateWeatherStationDataChunkOnWorkerThread = async ({
    weatherStationDataFilePath,
    threadConfiguration,
}) => {
    return new Promise((resolve, reject) => {
        const worker = new worker_threads.Worker(
            path.join(__dirname, './worker.js'),
            {
                workerData: {
                    weatherStationDataFilePath,
                    threadConfiguration,
                },
            }
        );
        worker.once('message', (data) => resolve(data));
        worker.once('error', (error) => reject(error));
    });
};

(async () => {
    const start = new Date().getTime();

    const weatherStationDataFilePath = path.join(
        __dirname,
        SEED_FOLDER,
        MEASUREMENTS_FILE_NAME
    );

    const threadConfigurations =
        await createPlanForProcessingLargeWeatherStationDataFile({
            weatherStationDataFilePath,
        });

    const collatedWeatherStationDataList = await Promise.all(
        threadConfigurations.map((threadConfiguration) => {
            return collateWeatherStationDataChunkOnWorkerThread({
                weatherStationDataFilePath,
                threadConfiguration,
            });
        })
    );

    const finalDataSet = {};

    for (
        let i = 0, iMax = collatedWeatherStationDataList.length;
        i < iMax;
        i++
    ) {
        const collatedWeatherStationData = collatedWeatherStationDataList[i];
        const cityNames = Object.keys(collatedWeatherStationData);
        for (let k = 0, kMax = cityNames.length; k < kMax; k++) {
            const cityName = cityNames[k];
            const cityData = collatedWeatherStationData[cityName];
            if (!finalDataSet[cityName]) {
                finalDataSet[cityName] = { ...cityData };
                continue;
            }
            finalDataSet[cityName] = {
                min: Math.min(cityData.min, finalDataSet[cityName].min),
                max: Math.max(cityData.max, finalDataSet[cityName].max),
                sum: cityData.sum + finalDataSet[cityName].sum,
                count: cityData.count + finalDataSet[cityName].count,
            };
        }
    }

    const cityNames = Object.keys(finalDataSet).sort();

    const finalString = cityNames.reduce((accumulator, cityName) => {
        const { min, max, sum, count } = finalDataSet[cityName];
        return `${accumulator}${cityName}=${min}/${(sum / count).toFixed(1)}/${max}, `;
    }, '');

    console.log(`{${finalString}}`);

    const end = new Date().getTime();
    const durationInSeconds = Math.round((end - start) / 1000);

    // console.log(`Finished processing, took ${durationInSeconds} seconds`);
})();
