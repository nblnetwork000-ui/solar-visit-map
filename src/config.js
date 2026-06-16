import { readFileSync } from 'node:fs';

loadDotEnv();

export function loadConfig() {
  const config = {
    YAHOO_CLIENT_ID: process.env.YAHOO_CLIENT_ID || '',
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID || '',
    GOOGLE_SHEET_NAME: process.env.GOOGLE_SHEET_NAME || '店舗リスト',
    GOOGLE_PIN_STATUS_SHEET_NAME: process.env.GOOGLE_PIN_STATUS_SHEET_NAME || 'ピン状況',
    GOOGLE_SERVICE_ACCOUNT_JSON_BASE64: process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    GOOGLE_MAPS_BROWSER_KEY: (process.env.GOOGLE_MAPS_BROWSER_KEY || '').trim(),
    LINE_CHANNEL_ID: (process.env.LINE_CHANNEL_ID || '').trim(),
    LINE_CHANNEL_SECRET: (process.env.LINE_CHANNEL_SECRET || '').trim(),
    LINE_CHANNEL_ACCESS_TOKEN: (process.env.LINE_CHANNEL_ACCESS_TOKEN || '').trim(),
    LINE_HOMEPAGE_URL: (process.env.LINE_HOMEPAGE_URL || '').trim(),
    LINE_DIAGNOSIS_URL: (process.env.LINE_DIAGNOSIS_URL || '').trim(),
    LINE_SERVICE_URL: (process.env.LINE_SERVICE_URL || '').trim(),
    LINE_EVIDENCE_URL: (process.env.LINE_EVIDENCE_URL || '').trim(),
    LINE_CONSULTATION_URL: (process.env.LINE_CONSULTATION_URL || '').trim(),
    LINE_SUPPLEMENT_URL: (process.env.LINE_SUPPLEMENT_URL || '').trim(),
    HOST: process.env.HOST || '127.0.0.1',
    ALLOW_REMOTE_ACCESS: (process.env.ALLOW_REMOTE_ACCESS || 'false') === 'true',
    ALLOWED_HOSTS: parseList(process.env.ALLOWED_HOSTS || ''),
    DATA_DIR: process.env.DATA_DIR || '',
    SHARE_PASSWORD: process.env.SHARE_PASSWORD || '',
    SESSION_SECRET: process.env.SESSION_SECRET || '',
    PORT: toInteger(process.env.PORT || '3000', 1024, 65535, 'PORT'),
    MAX_RESULTS_PER_RUN: toInteger(process.env.MAX_RESULTS_PER_RUN || '100', 1, 1000, 'MAX_RESULTS_PER_RUN'),
    REQUESTS_PER_15_MIN: toInteger(process.env.REQUESTS_PER_15_MIN || '60', 5, 1000, 'REQUESTS_PER_15_MIN'),
    SKIP_DUPLICATES: (process.env.SKIP_DUPLICATES || 'true') === 'true'
  };

  if (!config.ALLOW_REMOTE_ACCESS && !['127.0.0.1', 'localhost', '::1'].includes(config.HOST)) {
    throw new Error('外部公開する場合は ALLOW_REMOTE_ACCESS=true を設定してください。');
  }

  return config;
}

function loadDotEnv() {
  try {
    const raw = readFileSync('.env', 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match || process.env[match[1]] !== undefined) {
        continue;
      }
      process.env[match[1]] = unquote(match[2].trim());
    }
  } catch {
    // .env is optional; real environment variables can be used instead.
  }
}

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function parseList(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function toInteger(value, min, max, name) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${name} は ${min} から ${max} の整数で設定してください。`);
  }
  return number;
}
