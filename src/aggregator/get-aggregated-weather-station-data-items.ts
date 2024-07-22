import path from 'node:path';
import { Worker } from 'node:worker_threads';
import {
    AggregatedWeatherStationData,
    ThreadConfiguration,
    WorkerThreadInput,
} from './types';
import { combineAggregatedWeatherStationDataLists } from './combine-aggregated-weather-station-data-lists';

type Connectors = {
    logger: {
        log: (
            logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace',
            message: string
        ) => void;
    };
};

type Request = {
    threadConfigurations: ThreadConfiguration[];
};

export const getAggregatedWeatherStationDataItems = async (
    connectors: Connectors,
    request: Request
): Promise<AggregatedWeatherStationData[]> => {
    const aggregatedWeatherStationDataLists = await Promise.all(
        request.threadConfigurations.map((threadConfiguration) => {
            return aggregateWeatherStationDataChunkOnWorkerThread(connectors, {
                threadConfiguration,
            });
        })
    );

    const aggregatedWeatherData = combineAggregatedWeatherStationDataLists({
        aggregatedWeatherStationDataLists,
    });

    return aggregatedWeatherData;
};

const aggregateWeatherStationDataChunkOnWorkerThread = async (
    connectors: Connectors,
    request: { threadConfiguration: ThreadConfiguration }
): Promise<AggregatedWeatherStationData[]> => {
    return new Promise((resolve, reject) => {
        connectors.logger.log(
            'debug',
            `Start CPU intensive task on thread ID ${request.threadConfiguration.threadId}, firstCharIdx ${request.threadConfiguration.firstCharIdx}, lastCharIdx ${request.threadConfiguration.lastCharIdx}`
        );

        const workerData: WorkerThreadInput = { ...request };

        const worker = new Worker(path.join(__dirname, './worker/run.js'), {
            workerData,
        });

        worker.once('message', (data) => resolve(data));
        worker.once('error', (error) => reject(error));
    });
};
