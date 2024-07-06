import path from 'node:path';
import env from './env';
import visualizer from './visualizer';
import planner from './planner';
import aggregator from './aggregator';
import logging from './logging';

(async () => {
    const processEnv = env.getProcessEnv();

    const start = new Date().getTime();

    const logger = logging.createLogger({ logLevel: processEnv.LOG_LEVEL });

    const weatherStationDataFilePath = path.join(
        processEnv.WEATHER_STATION_DATA_FOLDER_PATH,
        processEnv.WEATHER_STATION_DATA_FILE_NAME
    );

    logger.log(
        'debug',
        `Start processing file at path ${weatherStationDataFilePath}`
    );

    const threadConfigurations =
        await planner.createPlanForProcessingLargeWeatherStationDataFile(
            { logger },
            { weatherStationDataFilePath }
        );

    const aggregatedWeatherStationDataList =
        await aggregator.getAggregatedWeatherStationDataList({
            logLevel: processEnv.LOG_LEVEL,
            threadConfigurations,
            weatherStationDataFilePath,
        });

    const result = visualizer.visualizeAggregatedWeatherStationDataList({
        style: processEnv.VISUALIZER,
        aggregatedWeatherStationDataList,
    });

    const end = new Date().getTime();

    console.log(result);

    logger.log(
        'debug',
        `Finished processing, took ${((end - start) / 1000).toFixed(2)} seconds to process`
    );
})();
