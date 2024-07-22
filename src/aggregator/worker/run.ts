import { workerData, parentPort } from 'node:worker_threads';
import { StationDataAggregator } from './station-data-aggregator';

(async () => {
    if (!parentPort) {
        throw new Error(`No parent port for worker thread found`);
    }

    const { threadConfiguration } = workerData;

    const stationDataAggregator = new StationDataAggregator();

    const aggregatedWeatherStationDataItems =
        await stationDataAggregator.run(threadConfiguration);

    parentPort.postMessage(aggregatedWeatherStationDataItems);
})();
