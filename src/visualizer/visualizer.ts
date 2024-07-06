import { AggregatedWeatherStationData } from './types';

const defaultStyle = ({
    aggregatedWeatherStationDataItems,
}: {
    aggregatedWeatherStationDataItems: AggregatedWeatherStationData[];
}): string => {
    return `{${aggregatedWeatherStationDataItems
        .sort((a, b) => a.stationName.localeCompare(b.stationName))
        .map((stationData) => {
            const { stationName, min, max, mean } = stationData;
            return `${stationName}=${min}/${mean.toFixed(1)}/${max}`;
        })
        .join(', ')}}`;
};

export const visualizeAggregatedWeatherStationDataItems = ({
    style,
    aggregatedWeatherStationDataItems,
}: {
    style: 'default';
    aggregatedWeatherStationDataItems: AggregatedWeatherStationData[];
}): string => {
    switch (style) {
        case 'default': {
            return defaultStyle({ aggregatedWeatherStationDataItems });
        }
        default: {
            return defaultStyle({ aggregatedWeatherStationDataItems });
        }
    }
};
