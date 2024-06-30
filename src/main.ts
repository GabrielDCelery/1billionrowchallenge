import { getProcessEnv } from './env';
import { getAggregatedWeatherStationDataList } from './weather-station-data-aggregator';
import { visualizeAggregatedWeatherStationDataList } from './weather-station-data-visualizer';

(async () => {
    const processEnv = getProcessEnv();

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

    console.log(result);
})();
