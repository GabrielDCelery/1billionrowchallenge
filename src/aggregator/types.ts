export type ThreadConfiguration = {
    threadId: number;
    firstCharIdx: number;
    lastCharIdx: number;
    weatherStationDataFilePath: string;
};

export type SummarizedStationData = {
    stationNameBuffer: Buffer;
    stationNameLengthInBytes: number;
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
    threadConfiguration: ThreadConfiguration;
};
