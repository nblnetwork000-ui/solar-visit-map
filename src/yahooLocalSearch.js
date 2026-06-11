const ENDPOINT = 'https://map.yahooapis.jp/search/local/V1/localSearch';
const PHONEBOOK_CASSETTE_ID = 'd8a23e9e64a4c817227ab09858bc1330';

export async function searchYahooLocal({ clientId, keyword, area, results, start, sort }) {
  const params = new URLSearchParams({
    appid: clientId,
    output: 'json',
    cid: PHONEBOOK_CASSETTE_ID,
    query: `${area} ${keyword}`,
    results: String(results),
    start: String(start),
    sort,
    detail: 'full',
    group: 'gid'
  });

  const url = `${ENDPOINT}?${params.toString()}`;
  if (url.length > 2048) {
    throw new Error('検索条件が長すぎます。キーワードまたはエリアを短くしてください。');
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'yahoo-local-to-sheets/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Yahoo!ローカルサーチAPIでエラーが発生しました: HTTP ${response.status}`);
  }

  const data = await response.json();
  const status = data?.ResultInfo?.Status;
  if (status && Number(status) !== 200) {
    throw new Error(`Yahoo!ローカルサーチAPIでエラーが発生しました: status=${status}`);
  }

  return {
    total: Number(data?.ResultInfo?.Total ?? 0),
    count: Number(data?.ResultInfo?.Count ?? 0),
    start: Number(data?.ResultInfo?.Start ?? start),
    items: normalizeFeatures(data?.Feature)
  };
}

export function normalizeFeatures(features) {
  const list = Array.isArray(features) ? features : features ? [features] : [];
  return list.map((feature) => {
    const property = feature?.Property ?? {};
    const station = firstItem(property.Station);
    const genre = firstItem(property.Genre);
    const coordinates = parseCoordinates(feature?.Geometry?.Coordinates);

    return {
      uid: valueOrEmpty(property.Uid ?? feature?.Id),
      gid: valueOrEmpty(feature?.Gid),
      name: valueOrEmpty(feature?.Name),
      yomi: valueOrEmpty(property.Yomi),
      address: valueOrEmpty(property.Address),
      tel: valueOrEmpty(property.Tel1),
      nearestStation: valueOrEmpty(station?.Name),
      railway: valueOrEmpty(station?.Railway),
      stationExit: valueOrEmpty(station?.Exit),
      genre: valueOrEmpty(genre?.Name),
      genreCode: valueOrEmpty(genre?.Code),
      access: valueOrEmpty(property.Access1),
      url: valueOrEmpty(property.PcUrl1),
      latitude: coordinates.lat,
      longitude: coordinates.lon,
      source: 'Yahoo!ローカルサーチAPI',
      fetchedAt: new Date().toISOString()
    };
  });
}

function firstItem(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parseCoordinates(value) {
  if (typeof value !== 'string') {
    return { lat: '', lon: '' };
  }
  const [lon, lat] = value.split(',').map((part) => part.trim());
  return {
    lat: lat ?? '',
    lon: lon ?? ''
  };
}

function valueOrEmpty(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}
