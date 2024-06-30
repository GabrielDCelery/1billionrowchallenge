import path from 'node:path';
import worker_threads from 'node:worker_threads';
import {
    AggregatedWeatherStationData,
    SummarizedStationData,
    ThreadConfiguration,
} from './types';
import { createPlanForProcessingLargeWeatherStationDataFile } from './planner';

const collateWeatherStationDataChunkOnWorkerThread = async ({
    weatherStationDataFilePath,
    threadConfiguration,
}: {
    weatherStationDataFilePath: string;
    threadConfiguration: ThreadConfiguration;
}): Promise<{ [index: string]: SummarizedStationData }> => {
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

export const getAggregatedWeatherStationDataList = async ({
    weatherStationDataFilePath,
}: {
    logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    weatherStationDataFilePath: string;
}): Promise<AggregatedWeatherStationData[]> => {
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

    const finalDataSet: { [index: string]: SummarizedStationData } = {};

    for (
        let i = 0, iMax = collatedWeatherStationDataList.length;
        i < iMax;
        i++
    ) {
        const collatedWeatherStationData = collatedWeatherStationDataList[i];
        const cityNames = Object.keys(collatedWeatherStationData);
        for (let k = 0, kMax = cityNames.length; k < kMax; k++) {
            const stationName = cityNames[k];
            const stationData = collatedWeatherStationData[stationName];
            if (!finalDataSet[stationName]) {
                finalDataSet[stationName] = { ...stationData };
                continue;
            }
            finalDataSet[stationName] = {
                min: Math.min(stationData.min, finalDataSet[stationName].min),
                max: Math.max(stationData.max, finalDataSet[stationName].max),
                sum: stationData.sum + finalDataSet[stationName].sum,
                count: stationData.count + finalDataSet[stationName].count,
            };
        }
    }

    return Object.keys(finalDataSet).map((stationName) => {
        const { min, max, sum, count } = finalDataSet[stationName];
        const dataPoint: AggregatedWeatherStationData = {
            stationName: stationName,
            min,
            max,
            mean: sum / count,
        };
        return dataPoint;
    });
};
