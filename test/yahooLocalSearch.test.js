import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFeatures } from '../src/yahooLocalSearch.js';

test('normalizes Yahoo Local Search features into sheet-friendly rows', () => {
  const rows = normalizeFeatures({
    Id: 'cassette-id',
    Gid: 'gid-1',
    Name: 'テスト店舗',
    Geometry: { Coordinates: '139.7000,35.6900' },
    Property: {
      Uid: 'uid-1',
      Yomi: 'てすとてんぽ',
      Address: '東京都新宿区',
      Tel1: '03-0000-0000',
      Station: [{ Name: '新宿', Railway: 'JR山手線', Exit: '東口' }],
      Genre: [{ Code: '01', Name: 'グルメ' }],
      Access1: '新宿駅から徒歩5分',
      PcUrl1: 'https://example.test'
    }
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'テスト店舗');
  assert.equal(rows[0].nearestStation, '新宿');
  assert.equal(rows[0].latitude, '35.6900');
  assert.equal(rows[0].longitude, '139.7000');
});
