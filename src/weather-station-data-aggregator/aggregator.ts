import path from 'node:path';
import worker_threads from 'node:worker_threads';
import {
    AggregatedWeatherStationData,
    ThreadConfiguration,
    WorkerThreadInput,
} from './types';
import { createPlanForProcessingLargeWeatherStationDataFile } from './planner';
import { createLogger } from '../logging';

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

export const getAggregatedWeatherStationDataList = async ({
    logLevel,
    weatherStationDataFilePath,
}: {
    logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    weatherStationDataFilePath: string;
}): Promise<AggregatedWeatherStationData[]> => {
    const logger = createLogger({ logLevel });

    const threadConfigurations =
        await createPlanForProcessingLargeWeatherStationDataFile(
            { logger },
            { weatherStationDataFilePath }
        );

    const promises = threadConfigurations.map((threadConfiguration) => {
        return aggregateWeatherStationDataChunkOnWorkerThread({
            weatherStationDataFilePath,
            threadConfiguration,
            logLevel,
        });
    });

    const aggregatedWeatherStationDataLists = await Promise.all(promises);

    const finalDataSet: { [index: string]: AggregatedWeatherStationData } = {};

    for (
        let i = 0, iMax = aggregatedWeatherStationDataLists.length;
        i < iMax;
        i++
    ) {
        const aggregatedWeatherStationDataList =
            aggregatedWeatherStationDataLists[i];

        for (
            let k = 0, kMax = aggregatedWeatherStationDataList.length;
            k < kMax;
            k++
        ) {
            const aggregatedWeatherStationData =
                aggregatedWeatherStationDataList[k];
            if (!finalDataSet[aggregatedWeatherStationData.stationName]) {
                finalDataSet[aggregatedWeatherStationData.stationName] = {
                    ...aggregatedWeatherStationData,
                };
                continue;
            }
            finalDataSet[aggregatedWeatherStationData.stationName] = {
                stationName: aggregatedWeatherStationData.stationName,
                min: Math.min(
                    aggregatedWeatherStationData.min,
                    finalDataSet[aggregatedWeatherStationData.stationName].min
                ),
                max: Math.max(
                    aggregatedWeatherStationData.max,
                    finalDataSet[aggregatedWeatherStationData.stationName].max
                ),
                mean: aggregatedWeatherStationData.mean,
            };
        }
    }

    return Object.keys(finalDataSet).map((stationName) => {
        return finalDataSet[stationName];
    });
};
