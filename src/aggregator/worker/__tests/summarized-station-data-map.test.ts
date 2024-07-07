import assert from 'assert/strict';
import { describe, test } from 'node:test';
import { StationDataAggregator } from '../station-data-aggregator';

/*
Lake Havasu City
Kuopio
Hanga Roa
Abéché
*/

describe('StationDataAggregator', () => {
    describe('hash', () => {
        test('hashes station name correctly', (t) => {
            // Given
            const buff = Buffer.from('Alabama');
            const map = new StationDataAggregator();

            // When
            const hash = map.hash(buff, buff.length);

            // Then
            assert.strictEqual(hash, 903382349);
        });
    });
});
