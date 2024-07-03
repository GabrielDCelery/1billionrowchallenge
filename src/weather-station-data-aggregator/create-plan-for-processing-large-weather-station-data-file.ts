import os from 'node:os';
import fs from 'node:fs';
import util from 'node:util';
import { createLogger } from '../logging';
import * as constants from '../constants';
import * as types from './types';

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

type Data = {
    weatherStationDataFilePath: string;
};

export const createPlanForProcessingLargeWeatherStationDataFile = async (
    connectors: Connectors,
    data: Data
): Promise<types.ThreadConfiguration[]> => {
    const threadConfigurations: types.ThreadConfiguration[] = [];

    const cpuCoreCount = os.cpus().length;
    const fileSizeInBytes = fs.statSync(data.weatherStationDataFilePath).size;

    const numberOfWorkerThreadsToUse = Math.floor(cpuCoreCount * 0.8);

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
        data.weatherStationDataFilePath,
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
