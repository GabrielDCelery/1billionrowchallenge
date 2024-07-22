import os from 'node:os';
import fs from 'node:fs';
import util from 'node:util';
import constants from '../constants';

const fsOpenAsync = util.promisify(fs.open);
const fsReadAsync = util.promisify(fs.read);
const fsCloseAsync = util.promisify(fs.close);

type Connectors = {
    logger: {
        log: (
            logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace',
            message: string
        ) => void;
    };
};

type Request = {
    weatherStationDataFilePath: string;
};

type ThreadConfiguration = {
    threadId: number;
    firstCharIdx: number;
    lastCharIdx: number;
    weatherStationDataFilePath: string;
};

export const createPlanForProcessingLargeWeatherStationDataFile = async ({
    connectors,
    request,
}: {
    connectors: Connectors;
    request: Request;
}): Promise<ThreadConfiguration[]> => {
    const threadConfigurations: ThreadConfiguration[] = [];

    const cpuCoreCount = os.cpus().length;
    const fileSizeInBytes = fs.statSync(
        request.weatherStationDataFilePath
    ).size;

    const numberOfWorkerThreadsToUse = Math.floor(cpuCoreCount * 1);

    connectors.logger.log(
        'debug',
        `Decided to use ${numberOfWorkerThreadsToUse} CPU cores out of ${cpuCoreCount}`
    );

    const estimateOfBytesAThreadWillNeedToProcess = Math.floor(
        fileSizeInBytes / numberOfWorkerThreadsToUse
    );

    const maxByteSizeOfASingleStationDataPoint =
        constants.STATION_NAME_MAX_SIZE_IN_BYTES + // maximum size of station in bytes
        1 + // character ;
        constants.TEMPERATURE_MAX_SIZE_IN_BYTES + // maximum size of temperature data in bytes
        1; // character \n

    const fileDescriptor = await fsOpenAsync(
        request.weatherStationDataFilePath,
        'r'
    );

    for (let threadId = 0; threadId < numberOfWorkerThreadsToUse; threadId++) {
        const prevThreadConfiguration = threadConfigurations[threadId - 1];
        const firstCharIdx = prevThreadConfiguration
            ? prevThreadConfiguration.lastCharIdx + 1
            : 0;

        const estimatedLastCharIdx =
            firstCharIdx + estimateOfBytesAThreadWillNeedToProcess;

        if (estimatedLastCharIdx > fileSizeInBytes) {
            const threadConfiguration: ThreadConfiguration = {
                threadId: threadId,
                firstCharIdx: firstCharIdx,
                lastCharIdx: fileSizeInBytes - 1,
                weatherStationDataFilePath: request.weatherStationDataFilePath,
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

        const threadConfiguration: ThreadConfiguration = {
            threadId: threadId,
            firstCharIdx: firstCharIdx,
            lastCharIdx: lastCharIdx,
            weatherStationDataFilePath: request.weatherStationDataFilePath,
        };

        threadConfigurations.push(threadConfiguration);
    }

    await fsCloseAsync(fileDescriptor);

    return threadConfigurations;
};
