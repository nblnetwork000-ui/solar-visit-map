import crypto from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { InputError, parseSearchInput } from './validation.js';
import { searchYahooLocal } from './yahooLocalSearch.js';
import { appendItemsToSheet, appendLeverConsultation, createSheetsClient } from './sheets.js';
import { handleLineWebhook, verifyLineSignature } from './lineMessaging.js';

const config = loadConfig();
const csrfToken = crypto.randomBytes(32).toString('hex');
let sheets;
const publicDir = fileURLToPath(new URL('../public', import.meta.url));
const dataDir = config.DATA_DIR || fileURLToPath(new URL('../data', import.meta.url));
const pinStatusFile = join(dataDir, 'pin-status-places.json');
const rateLimiter = createRateLimiter(config.REQUESTS_PER_15_MIN, 15 * 60 * 1000);

const server = createServer(async (req, res) => {
  try {
    setSecurityHeaders(res);

    if (!isAllowedHost(req.headers.host)) {
      sendJson(res, 403, { error: 'このホスト名からは利用できません。' });
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/api/lever-consultation') {
      setCorsHeaders(req, res);
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
    }
    if (isRateLimitedRequest(url, req) && !rateLimiter(req.socket.remoteAddress || 'local')) {
      sendJson(res, 429, { error: 'リクエスト数が多すぎます。少し待ってから再実行してください。' });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/healthz') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/webhook/line') {
      await handleLineCallback(req, res);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/session') {
      sendJson(res, 200, {
        authRequired: isAuthRequired(),
        authenticated: isAuthenticated(req),
        mapsApiKey: config.GOOGLE_MAPS_BROWSER_KEY
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/session') {
      await handleLogin(req, res);
      return;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/session') {
      clearSessionCookie(req, res);
      sendJson(res, 200, { authenticated: false });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/config') {
      if (!requireAuth(req, res)) {
        return;
      }
      sendJson(res, 200, {
        csrfToken,
        maxResultsPerRun: Math.min(config.MAX_RESULTS_PER_RUN, 100),
        skipDuplicates: config.SKIP_DUPLICATES,
        sheetName: config.GOOGLE_SHEET_NAME
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/pin-status') {
      if (!requireAuth(req, res)) {
        return;
      }
      sendJson(res, 200, { places: await readPinStatusPlaces() });
      return;
    }

    if (req.method === 'PUT' && url.pathname === '/api/pin-status') {
      if (!requireAuth(req, res)) {
        return;
      }
      const body = await readJsonBody(req, 2 * 1024 * 1024);
      const places = normalizePinStatusPlaces(body.places);
      await writePinStatusPlaces(places);
      sendJson(res, 200, { places, count: places.length });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/search-and-append') {
      await handleSearchAndAppend(req, res);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/lever-consultation') {
      await handleLeverConsultation(req, res);
      return;
    }

    if (req.method === 'GET') {
      await serveStatic(url.pathname, res);
      return;
    }

    sendJson(res, 405, { error: '許可されていないメソッドです。' });
  } catch (error) {
    handleError(error, res);
  }
});

server.listen(config.PORT, config.HOST, () => {
  console.log(`Local server listening at http://${config.HOST}:${config.PORT}`);
});

async function handleSearchAndAppend(req, res) {
  if (!requireAuth(req, res)) {
    return;
  }
  if (req.headers['x-csrf-token'] !== csrfToken) {
    sendJson(res, 403, { error: '不正なリクエストです。画面を再読み込みしてください。' });
    return;
  }

  const body = await readJsonBody(req, 20 * 1024);
  const input = parseSearchInput(body, Math.min(config.MAX_RESULTS_PER_RUN, 100));
  if (!config.YAHOO_CLIENT_ID) {
    throw new Error('環境変数 YAHOO_CLIENT_ID を設定してください。');
  }
  if (!config.GOOGLE_SHEET_ID) {
    throw new Error('環境変数 GOOGLE_SHEET_ID を設定してください。');
  }
  if (!config.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 && !config.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 または GOOGLE_APPLICATION_CREDENTIALS のどちらかを設定してください。');
  }
  sheets ||= await createSheetsClient(config);
  const result = await searchYahooLocal({
    clientId: config.YAHOO_CLIENT_ID,
    keyword: input.keyword,
    area: input.area,
    results: input.results,
    start: input.start,
    sort: input.sort
  });

  const sheetResult = input.append
    ? await appendItemsToSheet({
        sheets,
        spreadsheetId: config.GOOGLE_SHEET_ID,
        sheetName: config.GOOGLE_SHEET_NAME,
        items: result.items,
        skipDuplicates: config.SKIP_DUPLICATES
      })
    : { appended: 0, skipped: 0 };

  sendJson(res, 200, {
    query: { keyword: input.keyword, area: input.area },
    total: result.total,
    count: result.count,
    appended: sheetResult.appended,
    skipped: sheetResult.skipped,
    items: result.items
  });
}

async function handleLeverConsultation(req, res) {
  const body = await readJsonBody(req, 32 * 1024);
  const input = normalizeLeverConsultation(body, req);
  if (!config.GOOGLE_SHEET_ID) {
    throw new Error('環境変数 GOOGLE_SHEET_ID を設定してください。');
  }
  if (!config.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 && !config.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 または GOOGLE_APPLICATION_CREDENTIALS のどちらかを設定してください。');
  }
  sheets ||= await createSheetsClient(config);
  await appendLeverConsultation({
    sheets,
    spreadsheetId: config.GOOGLE_SHEET_ID,
    input,
    receivedAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  });
  sendJson(res, 200, { ok: true, message: '送信しました。' });
}

function normalizeLeverConsultation(body, req) {
  const input = {
    company: cleanText(body.company, 160),
    name: cleanText(body.name, 100),
    email: cleanText(body.email, 180),
    tel: cleanText(body.tel, 60),
    majorIndustry: cleanText(body.major_industry || body.majorIndustry, 120),
    minorIndustry: cleanText(body.minor_industry || body.minorIndustry, 120),
    message: cleanText(body.message, 1200),
    source: cleanText(body.source, 80) || 'HPフォーム',
    pageUrl: cleanText(body.page_url || body.pageUrl, 500),
    userAgent: cleanText(req.headers['user-agent'], 300)
  };

  if (!input.company) throw new InputError('会社名を入力してください。');
  if (!input.name) throw new InputError('担当者名を入力してください。');
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    throw new InputError('メールアドレスを正しく入力してください。');
  }
  if (!input.majorIndustry) throw new InputError('大業種を選択してください。');
  return input;
}

async function handleLineCallback(req, res) {
  if (!config.LINE_CHANNEL_SECRET || !config.LINE_CHANNEL_ACCESS_TOKEN) {
    sendJson(res, 503, { error: 'LINE Messaging API is not configured.' });
    return;
  }
  const rawBody = await readRawBody(req, 1024 * 1024);
  const signature = String(req.headers['x-line-signature'] || '');
  if (!verifyLineSignature(rawBody, signature, config.LINE_CHANNEL_SECRET)) {
    sendJson(res, 401, { error: 'Invalid LINE signature.' });
    return;
  }
  let body;
  try {
    body = JSON.parse(rawBody.toString('utf8'));
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON.' });
    return;
  }
  await handleLineWebhook(body, config);
  sendJson(res, 200, { ok: true });
}

function readRawBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new InputError('リクエストが大きすぎます。'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function readJsonBody(req, limit) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw) > limit) {
        reject(new InputError('リクエストが大きすぎます。'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new InputError('JSONの形式が不正です。'));
      }
    });
    req.on('error', reject);
  });
}

async function serveStatic(pathname, res) {
  const requested = pathname === '/'
    ? '/pin-status-map.html'
    : pathname === '/lever-lp'
      ? '/lever-lp/'
      : pathname === '/profit-affiliate'
        ? '/profit-affiliate/'
        : pathname;
  const normalized = normalize(decodeURIComponent(requested)).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(publicDir, normalized.endsWith('/') ? join(normalized, 'index.html') : normalized);
  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { error: '不正なパスです。' });
    return;
  }

  try {
    await readFile(filePath);
  } catch {
    sendJson(res, 404, { error: '見つかりません。' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': contentType(filePath),
    'Cache-Control': filePath.endsWith('.html') ? 'no-cache' : 'private, max-age=3600'
  });
  createReadStream(filePath).pipe(res);
}

function handleError(error, res) {
  console.error(error);
  if (error instanceof InputError) {
    sendJson(res, 400, { error: error.message });
    return;
  }
  sendJson(res, 500, { error: error.message || 'サーバーエラーが発生しました。' });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function handleLogin(req, res) {
  if (!isAuthRequired()) {
    sendJson(res, 200, { authenticated: true, authRequired: false });
    return;
  }
  const body = await readJsonBody(req, 4 * 1024);
  if (!timingSafeEqualText(String(body.password || ''), config.SHARE_PASSWORD)) {
    sendJson(res, 401, { error: 'パスワードが違います。' });
    return;
  }
  setSessionCookie(req, res);
  sendJson(res, 200, { authenticated: true, authRequired: true });
}

function requireAuth(req, res) {
  if (isAuthenticated(req)) {
    return true;
  }
  sendJson(res, 401, { error: 'ログインしてください。' });
  return false;
}

function isAuthRequired() {
  return Boolean(config.SHARE_PASSWORD);
}

function isAuthenticated(req) {
  if (!isAuthRequired()) {
    return true;
  }
  return parseCookies(req.headers.cookie || '').visit_map_session === sessionToken();
}

function setSessionCookie(req, res) {
  const secure = isHttpsRequest(req) ? '; Secure' : '';
  res.setHeader('Set-Cookie', `visit_map_session=${sessionToken()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure}`);
}

function clearSessionCookie(req, res) {
  const secure = isHttpsRequest(req) ? '; Secure' : '';
  res.setHeader('Set-Cookie', `visit_map_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}

function sessionToken() {
  const secret = config.SESSION_SECRET || config.SHARE_PASSWORD;
  return crypto.createHmac('sha256', secret).update('visit-map-session').digest('hex');
}

function parseCookies(cookieHeader) {
  return Object.fromEntries(cookieHeader.split(';').map((cookie) => {
    const [name = '', ...value] = cookie.trim().split('=');
    return [name, decodeURIComponent(value.join('='))];
  }).filter(([name]) => name));
}

function timingSafeEqualText(actual, expected) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function isHttpsRequest(req) {
  return req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted;
}

async function readPinStatusPlaces() {
  try {
    const raw = await readFile(pinStatusFile, 'utf8');
    const parsed = JSON.parse(raw);
    return normalizePinStatusPlaces(parsed.places ?? parsed);
  } catch {
    return [];
  }
}

async function writePinStatusPlaces(places) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(pinStatusFile, JSON.stringify({ places, savedAt: new Date().toISOString() }, null, 2));
}

function normalizePinStatusPlaces(value) {
  if (!Array.isArray(value)) {
    throw new InputError('ピン情報の形式が不正です。');
  }
  if (value.length > 10000) {
    throw new InputError('ピン情報が多すぎます。');
  }
  return value.map((place) => ({
    id: cleanText(place.id, 120) || crypto.randomUUID(),
    name: cleanText(place.name, 120) || '名称未設定',
    address: cleanText(place.address, 240),
    status: cleanText(place.status, 40) || 'unvisited',
    lat: toCoordinate(place.lat, '緯度'),
    lng: toCoordinate(place.lng, '経度'),
    assignee: cleanText(place.assignee, 40),
    note: cleanText(place.note, 160),
    updatedAt: cleanText(place.updatedAt, 80) || new Date().toISOString()
  }));
}

function cleanText(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function toCoordinate(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new InputError(`${label}が不正です。`);
  }
  return number;
}

function setSecurityHeaders(res) {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://maps.gstatic.com https://maps.googleapis.com; connect-src 'self' https://maps.googleapis.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

function isAllowedHost(hostHeader = '') {
  let host = hostHeader;
  if (host.startsWith('[')) {
    host = host.slice(1, host.indexOf(']'));
  } else {
    host = host.split(':')[0];
  }
  if (['127.0.0.1', 'localhost', '::1'].includes(host)) {
    return true;
  }
  if (!config.ALLOW_REMOTE_ACCESS) {
    return false;
  }
  if (config.ALLOWED_HOSTS.length === 0) {
    return true;
  }
  return config.ALLOWED_HOSTS.includes(hostHeader) || config.ALLOWED_HOSTS.includes(host);
}

function isRateLimitedRequest(url, req) {
  if (!url.pathname.startsWith('/api/')) {
    return false;
  }
  return req.method !== 'GET' || url.pathname === '/api/pin-status';
}

function contentType(filePath) {
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp'
  };
  return types[extname(filePath)] || 'application/octet-stream';
}

function createRateLimiter(limit, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const record = hits.get(key);
    if (!record || now > record.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    record.count += 1;
    return record.count <= limit;
  };
}
