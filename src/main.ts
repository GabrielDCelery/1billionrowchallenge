import path from 'node:path';
import env from './env';
import visualizer from './visualizer';
import planner from './planner';
import aggregator from './aggregator';
import logging from './logging';

(async () => {
    const processEnv = env.getProcessEnv();

    const start = new Date().getTime();

    const logger = logging.createLogger({ logLevel: processEnv.BRC_LOG_LEVEL });

    const weatherStationDataFilePath = processEnv.BRC_FILEPATH;

    logger.log(
        'debug',
        `Start processing file at path ${weatherStationDataFilePath}`
    );

    const threadConfigurations =
        await planner.createPlanForProcessingLargeWeatherStationDataFile({
            connectors: { logger },
            request: { weatherStationDataFilePath },
        });

    const aggregatedWeatherStationDataItems =
        await aggregator.getAggregatedWeatherStationDataItems({
            connectors: { logger },
            request: { threadConfigurations },
        });

    const result = visualizer.visualizeAggregatedWeatherStationDataItems({
        style: processEnv.VISUALIZER,
        aggregatedWeatherStationDataItems,
    });

    const end = new Date().getTime();

    console.log(result);

    logger.log(
        'debug',
        `Finished processing, took ${((end - start) / 1000).toFixed(2)} seconds to process`
    );
})();
