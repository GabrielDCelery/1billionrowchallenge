import { getProcessEnv } from './env';
import { getAggregatedWeatherStationDataList } from './weather-station-data-aggregator';
import { visualizeAggregatedWeatherStationDataList } from './weather-station-data-visualizer';
import { createLogger } from './logging';

(async () => {
    const processEnv = getProcessEnv();

    const logger = createLogger({ logLevel: processEnv.LOG_LEVEL });

    const start = new Date().getTime();

    const aggregatedWeatherStationDataList =
        await getAggregatedWeatherStationDataList({
            logLevel: processEnv.LOG_LEVEL,
            weatherStationDataFolderPath:
                processEnv.WEATHER_STATION_DATA_FOLDER_PATH,
            weatherStationDataFileName:
                processEnv.WEATHER_STATION_DATA_FILE_NAME,
        });

    const result = visualizeAggregatedWeatherStationDataList({
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
