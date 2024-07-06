import { AggregatedWeatherStationData } from './types';

export const combineAggregatedWeatherDataLists = ({
    aggregatedWeatherStationDataLists,
}: {
    aggregatedWeatherStationDataLists: AggregatedWeatherStationData[][];
}): AggregatedWeatherStationData[] => {
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
