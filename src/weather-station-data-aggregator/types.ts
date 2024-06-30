export type ThreadConfiguration = {
    threadId: number;
    firstCharIdx: number;
    lastCharIdx: number;
};

export type SummarizedStationData = {
    min: number;
    max: number;
    sum: number;
    count: number;
};

export type AggregatedWeatherStationData = {
    stationName: string;
    min: number;
    max: number;
    mean: number;
};

export type WorkerThreadInput = {
    weatherStationDataFilePath: string;
    threadConfiguration: ThreadConfiguration;
};
