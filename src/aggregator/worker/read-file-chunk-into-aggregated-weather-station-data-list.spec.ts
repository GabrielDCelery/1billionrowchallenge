import assert from 'assert/strict';
import { describe, test } from 'node:test';
import { transformTemperatureBufferToTemperature } from './read-file-chunk-into-aggregated-weather-station-data-list';

describe('transformTemperatureBufferToTemperature', () => {
    const temperatures = ['0.0', '99.9', '-99.9', '23.1', '-1.5', '-33.0'];

    for (let i = 0, iMax = temperatures.length; i < iMax; i++) {
        ((temperature) => {
            const expected = Number.parseFloat(temperature) * 10;

            test(`correctly transforms buffer into ${expected}`, (t) => {
                // Given
                const buff = Buffer.alloc(5);
                buff.write(temperature, 0, temperature.length, 'utf8');

                // When
                const result = transformTemperatureBufferToTemperature(buff);

                // Then
                assert.strictEqual(result, expected);
            });
        })(temperatures[i]);
    }
});
