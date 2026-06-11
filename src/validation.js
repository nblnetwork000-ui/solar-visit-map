const ALLOWED_SORTS = new Set(['rating', 'score', 'hybrid', 'review', 'kana', 'price', 'dist', 'geo', 'match']);

export function parseSearchInput(input, maxResultsPerRun) {
  const parsed = {
    keyword: cleanText(input?.keyword, 'キーワード'),
    area: cleanText(input?.area, 'エリア'),
    results: cleanInteger(input?.results ?? 20, 1, 100, '件数'),
    start: cleanInteger(input?.start ?? 1, 1, 3000, '開始位置'),
    sort: cleanSort(input?.sort ?? 'hybrid'),
    append: input?.append !== false
  };

  return {
    ...parsed,
    results: Math.min(parsed.results, maxResultsPerRun)
  };
}

function cleanText(value, label) {
  if (typeof value !== 'string') {
    throw new InputError(`${label}を入力してください。`);
  }
  const text = value.trim();
  if (text.length < 1 || text.length > 80) {
    throw new InputError(`${label}は1文字以上80文字以内で入力してください。`);
  }
  return text;
}

function cleanInteger(value, min, max, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new InputError(`${label}は${min}から${max}の整数で入力してください。`);
  }
  return number;
}

function cleanSort(value) {
  if (typeof value !== 'string' || !ALLOWED_SORTS.has(value)) {
    throw new InputError('並び順の指定が不正です。');
  }
  return value;
}

export class InputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InputError';
  }
}
