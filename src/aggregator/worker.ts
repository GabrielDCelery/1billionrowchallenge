import { workerData, parentPort } from 'node:worker_threads';
import { readFileChunkIntoAggregatedWeatherStationDataList } from './read-file-chunk-into-aggregated-weather-station-data-list';

(async () => {
    if (!parentPort) {
        throw new Error(`No message port`);
    }
    const aggregatedWeatherStationDataItems =
        await readFileChunkIntoAggregatedWeatherStationDataList(workerData);

    parentPort.postMessage(aggregatedWeatherStationDataItems);
})();
