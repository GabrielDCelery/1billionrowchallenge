import assert from 'assert/strict';
import { describe, test } from 'node:test';
import { SummarizedStationDataMap } from '../summarized-station-data-map';

/*
Lake Havasu City
Kuopio
Hanga Roa
Abéché
*/

describe('SummarizedStationDataMap', () => {
    describe('hash', () => {
        test('hashes station name correctly', (t) => {
            // Given
            const buff = Buffer.from('Alabama');
            const map = new SummarizedStationDataMap();

            // When
            const hash = map.hash(buff, buff.length);

            // Then
            assert.strictEqual(hash, 903382349);
        });
    });
});
