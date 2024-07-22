import { workerData, parentPort } from 'node:worker_threads';
import { readFileSegmentIntoAggregatedWeatherStationDataItems } from './read-file-segment-into-aggregated-weather-station-items-list';

(async () => {
    if (!parentPort) {
        throw new Error(`No parent port for worker thread found`);
    }

    const aggregatedWeatherStationDataItems =
        await readFileSegmentIntoAggregatedWeatherStationDataItems(workerData);

    parentPort.postMessage(aggregatedWeatherStationDataItems);
})();
