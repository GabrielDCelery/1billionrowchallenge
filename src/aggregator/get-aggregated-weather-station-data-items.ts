import path from 'node:path';
import { Worker } from 'node:worker_threads';
import {
    AggregatedWeatherStationData,
    ThreadConfiguration,
    WorkerThreadInput,
} from './types';
import { combineAggregatedWeatherStationDataLists } from './combine-aggregated-weather-station-data-lists';

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

        const worker = new Worker(path.join(__dirname, './worker/run.js'), {
            workerData,
        });

        worker.once('message', (data) => resolve(data));
        worker.once('error', (error) => reject(error));
    });
};

type GetAggregatedWeatherStationDataItemsRequest = {
    logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    weatherStationDataFilePath: string;
    threadConfigurations: ThreadConfiguration[];
};

export const getAggregatedWeatherStationDataItems = async (
    data: GetAggregatedWeatherStationDataItemsRequest
): Promise<AggregatedWeatherStationData[]> => {
    const { logLevel, weatherStationDataFilePath, threadConfigurations } = data;

    const aggregatedWeatherStationDataLists = await Promise.all(
        threadConfigurations.map((threadConfiguration) => {
            return aggregateWeatherStationDataChunkOnWorkerThread({
                weatherStationDataFilePath,
                threadConfiguration,
                logLevel,
            });
        })
    );

    const aggregatedWeatherData = combineAggregatedWeatherStationDataLists({
        aggregatedWeatherStationDataLists,
    });

    return aggregatedWeatherData;
};
