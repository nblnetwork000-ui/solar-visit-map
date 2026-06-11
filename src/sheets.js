import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';

export const HEADERS = [
  '取得日時',
  '店舗名',
  '読み',
  '住所',
  '電話番号',
  '最寄り駅',
  '路線',
  '出口',
  'ジャンル',
  'ジャンルコード',
  'アクセス',
  'URL',
  '緯度',
  '経度',
  'Yahoo UID',
  'Yahoo GID',
  '取得元'
];

export const PIN_STATUS_HEADERS = ['顧客名', '住所', '訪問状況', '緯度', '経度', 'ID', '更新日時'];

export async function createSheetsClient(config) {
  const credentials = await loadServiceAccountCredentials(config);
  return new SheetsRestClient(credentials);
}

export async function readPinPlaces({ sheets, spreadsheetId, sheetName }) {
  await ensurePinStatusHeaderRow(sheets, spreadsheetId, sheetName);
  const response = await sheets.getValues(spreadsheetId, quoteSheetName(sheetName) + '!A2:G');
  const rows = response.values ?? [];
  return rows.map(pinStatusRowToPlace).filter((place) => place.name && Number.isFinite(place.lat) && Number.isFinite(place.lng));
}

export async function replacePinPlaces({ sheets, spreadsheetId, sheetName, places }) {
  await ensurePinStatusHeaderRow(sheets, spreadsheetId, sheetName);
  await sheets.clearValues({
    spreadsheetId,
    range: quoteSheetName(sheetName) + '!A2:G'
  });

  if (places.length === 0) {
    return { count: 0 };
  }

  await sheets.updateValues({
    spreadsheetId,
    range: quoteSheetName(sheetName) + '!A2:G',
    valueInputOption: 'RAW',
    values: places.map(placeToPinStatusRow)
  });
  return { count: places.length };
}

export async function updatePinPlaceStatus({ sheets, spreadsheetId, sheetName, id, status, updatedAt }) {
  await ensurePinStatusHeaderRow(sheets, spreadsheetId, sheetName);
  const range = quoteSheetName(sheetName) + '!A2:G';
  const response = await sheets.getValues(spreadsheetId, range);
  const rows = response.values ?? [];
  const index = rows.findIndex((row) => row[5] === id);
  if (index < 0) {
    return { updated: false };
  }

  const rowNumber = index + 2;
  const nextRow = [...rows[index]];
  nextRow[2] = status;
  nextRow[6] = updatedAt;
  await sheets.updateValues({
    spreadsheetId,
    range: quoteSheetName(sheetName) + `!A${rowNumber}:G${rowNumber}`,
    valueInputOption: 'RAW',
    values: [PIN_STATUS_HEADERS.map((_, columnIndex) => nextRow[columnIndex] ?? '')]
  });
  return { updated: true };
}

export async function ensureHeaderRow(sheets, spreadsheetId, sheetName) {
  const range = quoteSheetName(sheetName) + '!A1:Q1';
  const response = await sheets.getValues(spreadsheetId, range);
  const values = response.values ?? [];
  if (values.length === 0 || values[0].length === 0) {
    await sheets.updateValues({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      values: [HEADERS]
    });
  }
}

export async function ensurePinStatusHeaderRow(sheets, spreadsheetId, sheetName) {
  const range = quoteSheetName(sheetName) + '!A1:G1';
  const response = await sheets.getValues(spreadsheetId, range);
  const values = response.values ?? [];
  if (values.length === 0 || values[0].length === 0) {
    await sheets.updateValues({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      values: [PIN_STATUS_HEADERS]
    });
  }
}

export async function appendItemsToSheet({ sheets, spreadsheetId, sheetName, items, skipDuplicates }) {
  await ensureHeaderRow(sheets, spreadsheetId, sheetName);
  const existingKeys = skipDuplicates ? await readExistingKeys(sheets, spreadsheetId, sheetName) : new Set();
  const filtered = skipDuplicates ? items.filter((item) => !existingKeys.has(uniqueKey(item))) : items;

  if (filtered.length === 0) {
    return { appended: 0, skipped: items.length };
  }

  await sheets.appendValues({
    spreadsheetId,
    range: quoteSheetName(sheetName) + '!A:Q',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    values: filtered.map(itemToRow)
  });

  return { appended: filtered.length, skipped: items.length - filtered.length };
}

async function readExistingKeys(sheets, spreadsheetId, sheetName) {
  const range = quoteSheetName(sheetName) + '!O2:P';
  const response = await sheets.getValues(spreadsheetId, range);
  const rows = response.values ?? [];
  return new Set(rows.map(([uid = '', gid = '']) => `${uid}::${gid}`).filter((key) => key !== '::'));
}

function uniqueKey(item) {
  return `${item.uid}::${item.gid}`;
}

function itemToRow(item) {
  return [
    item.fetchedAt,
    item.name,
    item.yomi,
    item.address,
    item.tel,
    item.nearestStation,
    item.railway,
    item.stationExit,
    item.genre,
    item.genreCode,
    item.access,
    item.url,
    item.latitude,
    item.longitude,
    item.uid,
    item.gid,
    item.source
  ];
}

function pinStatusRowToPlace(row) {
  return {
    name: String(row[0] || '').trim(),
    address: String(row[1] || '').trim(),
    status: String(row[2] || '').trim(),
    lat: Number(row[3]),
    lng: Number(row[4]),
    id: String(row[5] || '').trim(),
    updatedAt: String(row[6] || '').trim()
  };
}

function placeToPinStatusRow(place) {
  return [
    place.name,
    place.address,
    place.status,
    place.lat,
    place.lng,
    place.id,
    place.updatedAt
  ];
}

function quoteSheetName(sheetName) {
  return `'${sheetName.replaceAll("'", "''")}'`;
}

async function loadServiceAccountCredentials(config) {
  if (config.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
    const raw = Buffer.from(config.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, 'base64').toString('utf8');
    return JSON.parse(raw);
  }

  const raw = await readFile(config.GOOGLE_APPLICATION_CREDENTIALS, 'utf8');
  return JSON.parse(raw);
}

class SheetsRestClient {
  constructor(credentials) {
    this.credentials = credentials;
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  async getValues(spreadsheetId, range) {
    const encodedRange = encodeURIComponent(range);
    return this.request(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodedRange}`
    );
  }

  async updateValues({ spreadsheetId, range, valueInputOption, values }) {
    const encodedRange = encodeURIComponent(range);
    const query = new URLSearchParams({ valueInputOption });
    return this.request(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodedRange}?${query}`,
      {
        method: 'PUT',
        body: JSON.stringify({ values })
      }
    );
  }

  async appendValues({ spreadsheetId, range, valueInputOption, insertDataOption, values }) {
    const encodedRange = encodeURIComponent(range);
    const query = new URLSearchParams({ valueInputOption, insertDataOption });
    return this.request(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodedRange}:append?${query}`,
      {
        method: 'POST',
        body: JSON.stringify({ values })
      }
    );
  }

  async clearValues({ spreadsheetId, range }) {
    const encodedRange = encodeURIComponent(range);
    return this.request(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodedRange}:clear`,
      {
        method: 'POST',
        body: JSON.stringify({})
      }
    );
  }

  async request(url, init = {}) {
    const token = await this.getAccessToken();
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init.headers ?? {})
      }
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      throw new Error(`Google Sheets APIでエラーが発生しました: HTTP ${response.status} ${data?.error?.message ?? ''}`);
    }
    return data;
  }

  async getAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (this.token && now < this.tokenExpiresAt - 60) {
      return this.token;
    }

    const assertion = createJwtAssertion(this.credentials, now);
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Google OAuth認証でエラーが発生しました: HTTP ${response.status} ${data?.error_description ?? ''}`);
    }
    this.token = data.access_token;
    this.tokenExpiresAt = now + Number(data.expires_in ?? 3600);
    return this.token;
  }
}

function createJwtAssertion(credentials, now) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(credentials.private_key);
  return `${unsigned}.${base64Url(signature)}`;
}

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}
