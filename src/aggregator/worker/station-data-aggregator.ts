import fs from 'node:fs';
import util from 'node:util';
import { Transform, finished } from 'node:stream';
import { AggregatedWeatherStationData, SummarizedStationData } from '../types';
import transforms from './transforms';
import constants from '../../constants';

const streamFinishedAsync = util.promisify(finished);

const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

class StationDataAggregator {
    private keys: number[];
    private map: Map<number, SummarizedStationData[]>;

    constructor() {
        this.keys = [];
        this.map = new Map<number, SummarizedStationData[]>();
    }

    async run({
        request,
    }: {
        request: {
            firstCharIdx: number;
            lastCharIdx: number;
            weatherStationDataFilePath: string;
        };
    }): Promise<AggregatedWeatherStationData[]> {
        const highWaterMark = Math.pow(2, 20);

        let writeIntoStationBuffer = true;
        let stationNameLengthInBytes = 0;
        const stationNameBuffer = Buffer.alloc(
            constants.STATION_NAME_MAX_SIZE_IN_BYTES,
            0
        );

        let temperatureLengthInBytes = 0;
        const temperatureBuffer = Buffer.alloc(
            constants.TEMPERATURE_MAX_SIZE_IN_BYTES,
            0
        );

        const readStream = fs.createReadStream(
            request.weatherStationDataFilePath,
            {
                highWaterMark: highWaterMark,
                start: request.firstCharIdx,
                end: request.lastCharIdx,
            }
        );

        const transformStream = new Transform({
            transform: (chunk, encoding, callback) => {
                for (let i = 0, iMax = chunk.length; i < iMax; i++) {
                    const c = chunk[i];

                    if (c === constants.CHAR_SEMICOLON) {
                        writeIntoStationBuffer = false;

                        continue;
                    }

                    if (c === constants.CHAR_NEWLINE) {
                        const temperature =
                            transforms.transformTemperatureBufferToTemperature(
                                temperatureBuffer
                            );

                        this.appendTemperature({
                            stationNameBuffer,
                            stationNameLengthInBytes,
                            temperature,
                        });

                        writeIntoStationBuffer = true;
                        stationNameLengthInBytes = 0;
                        temperatureLengthInBytes = 0;
                        continue;
                    }

                    if (writeIntoStationBuffer) {
                        stationNameBuffer[stationNameLengthInBytes] = c;
                        stationNameLengthInBytes++;
                        continue;
                    }

                    temperatureBuffer[temperatureLengthInBytes] = c;
                    temperatureLengthInBytes++;
                }

                callback(null);
            },
            highWaterMark: highWaterMark,
        });

        readStream.pipe(transformStream);

        await streamFinishedAsync(readStream);

        return this.getAggregaredWeatherStationDataItems();
    }

    appendTemperature({
        stationNameBuffer,
        stationNameLengthInBytes,
        temperature,
    }: {
        stationNameBuffer: Buffer;
        stationNameLengthInBytes: number;
        temperature: number;
    }): void {
        const key = this.hash(stationNameBuffer, stationNameLengthInBytes);
        if (!this.map.has(key)) {
            this.map.set(key, []);
            this.keys.push(key);
        }
        const existingDataItems = this.map.get(key);
        if (existingDataItems === undefined) {
            throw new Error(
                `Expected to find data items at ${key}, but returned undefined`
            );
        }
        for (let i = 0, iMax = existingDataItems.length; i < iMax; i++) {
            const existingDataItem = existingDataItems[i];
            if (
                existingDataItems.length === 1 ||
                this.areDataItemsTheSame(existingDataItem, {
                    stationNameBuffer,
                    stationNameLengthInBytes,
                })
            ) {
                existingDataItem.min = Math.min(
                    existingDataItem.min,
                    temperature
                );
                existingDataItem.max = Math.max(
                    existingDataItem.max,
                    temperature
                );
                existingDataItem.sum = existingDataItem.sum + temperature;
                existingDataItem.count = existingDataItem.count + 1;
                return;
            }
        }
        existingDataItems.push({
            stationNameLengthInBytes,
            stationNameBuffer: Buffer.from(
                stationNameBuffer,
                0,
                stationNameLengthInBytes
            ),
            min: temperature,
            max: temperature,
            sum: temperature,
            count: 1,
        });
    }

    getAggregaredWeatherStationDataItems(): AggregatedWeatherStationData[] {
        const final: AggregatedWeatherStationData[] = [];
        for (let i = 0, iMax = this.keys.length; i < iMax; i++) {
            const key = this.keys[i];
            const summarizedStationDataItems = this.map.get(key);
            if (!summarizedStationDataItems) {
                throw new Error(
                    `Expected to find data items at ${key}, but returned undefined`
                );
            }
            for (
                let k = 0, kMax = summarizedStationDataItems.length;
                k < kMax;
                k++
            ) {
                const summarizedStationData = summarizedStationDataItems[k];
                final.push({
                    stationName: summarizedStationData.stationNameBuffer
                        .subarray(
                            0,
                            summarizedStationData.stationNameLengthInBytes
                        )
                        .toString(),
                    min: summarizedStationData.min / 10,
                    max: summarizedStationData.max / 10,
                    mean:
                        summarizedStationData.sum /
                        summarizedStationData.count /
                        10,
                });
            }
        }
        return final;
    }

    hash(stationNameBuffer: Buffer, stationNameLengthInBytes: number): number {
        let hash = FNV_OFFSET;
        for (let i = 0; i < stationNameLengthInBytes; i++) {
            hash = hash * FNV_PRIME;
            hash = (hash ^ stationNameBuffer[i]) >>> 0;
        }
        return hash;
    }

    private areDataItemsTheSame(
        d1: { stationNameBuffer: Buffer; stationNameLengthInBytes: number },
        d2: { stationNameBuffer: Buffer; stationNameLengthInBytes: number }
    ): boolean {
        if (d1.stationNameLengthInBytes !== d2.stationNameLengthInBytes) {
            return false;
        }
        for (let i = 0; i < d1.stationNameLengthInBytes; i++) {
            if (d1.stationNameBuffer[i] !== d2.stationNameBuffer[i]) {
                return false;
            }
        }
        return true;
    }
}

export { StationDataAggregator };
