import path from 'node:path';
import worker_threads from 'node:worker_threads';
import {
    AggregatedWeatherStationData,
    ThreadConfiguration,
    WorkerThreadInput,
} from './types';
import { createPlanForProcessingLargeWeatherStationDataFile } from './create-plan-for-processing-large-weather-station-data-file';
import { createLogger } from '../logging';
import { combineAggregatedWeatherDataLists } from './combine-aggregated-weather-station-data-lists';

const aggregateWeatherStationDataChunkOnWorkerThread = async ({
    logLevel,
    weatherStationDataFilePath,
    threadConfiguration,
}: {
    logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    weatherStationDataFilePath: string;
    threadConfiguration: ThreadConfiguration;
}): Promise<AggregatedWeatherStationData[]> => {
    return new Promise((resolve, reject) => {
        const workerData: WorkerThreadInput = {
            logLevel,
            weatherStationDataFilePath,
            threadConfiguration,
        };

        const worker = new worker_threads.Worker(
            path.join(__dirname, './worker.js'),
            { workerData }
        );
        worker.once('message', (data) => resolve(data));
        worker.once('error', (error) => reject(error));
    });
};

type GetAggregatedWeatherStationDataListData = {
    logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    weatherStationDataFolderPath: string;
    weatherStationDataFileName: string;
};

export const getAggregatedWeatherStationDataList = async (
    data: GetAggregatedWeatherStationDataListData
): Promise<AggregatedWeatherStationData[]> => {
    const {
        logLevel,
        weatherStationDataFolderPath,
        weatherStationDataFileName,
    } = data;

    const logger = createLogger({ logLevel });

    const weatherStationDataFilePath = path.join(
        weatherStationDataFolderPath,
        weatherStationDataFileName
    );

    const threadConfigurations =
        await createPlanForProcessingLargeWeatherStationDataFile(
            { logger },
            { weatherStationDataFilePath }
        );

    const aggregatedWeatherStationDataLists = await Promise.all(
        threadConfigurations.map((threadConfiguration) => {
            return aggregateWeatherStationDataChunkOnWorkerThread({
                weatherStationDataFilePath,
                threadConfiguration,
                logLevel,
            });
        })
    );

    const aggregatedWeatherData = combineAggregatedWeatherDataLists({
        aggregatedWeatherStationDataLists,
    });

    return aggregatedWeatherData;
};
