import { AggregatedWeatherStationData } from './types';

const defaultStyle = ({
    aggregatedWeatherStationDataList,
}: {
    aggregatedWeatherStationDataList: AggregatedWeatherStationData[];
}): string => {
    return `{${aggregatedWeatherStationDataList
        .sort((a, b) => a.stationName.localeCompare(b.stationName))
        .map((stationData) => {
            const { stationName, min, max, mean } = stationData;
            return `${stationName}=${min}/${mean.toFixed(1)}/${max}`;
        })
        .join(', ')}}`;
};

export const visualizeAggregatedWeatherStationDataList = ({
    style,
    aggregatedWeatherStationDataList,
}: {
    style: 'default';
    aggregatedWeatherStationDataList: AggregatedWeatherStationData[];
}): string => {
    switch (style) {
        case 'default': {
            return defaultStyle({ aggregatedWeatherStationDataList });
        }
        default: {
            return defaultStyle({ aggregatedWeatherStationDataList });
        }
    }
};
