let csrfToken = '';
let activeMode = 'shops';

const pageTitle = document.querySelector('#pageTitle');
const statusBox = document.querySelector('#status');
const rows = document.querySelector('#rows');
const summary = document.querySelector('#summary');
const sheetName = document.querySelector('#sheetName');
const tabButtons = document.querySelectorAll('.tabButton');
const forms = document.querySelectorAll('.searchForm');
const shopHead = document.querySelector('#shopHead');
const eventHead = document.querySelector('#eventHead');

const shopForm = document.querySelector('#shopForm');
const eventForm = document.querySelector('#eventForm');
const shopButton = document.querySelector('#submitButton');
const eventButton = document.querySelector('#eventSubmitButton');
const resultsInput = document.querySelector('#results');
const startInput = document.querySelector('#start');
const eventResultsInput = document.querySelector('#eventResults');
const eventStartInput = document.querySelector('#eventStart');

const configResponse = await fetch('/api/config');
const appConfig = await configResponse.json();
csrfToken = appConfig.csrfToken;
resultsInput.max = appConfig.maxResultsPerRun;
eventResultsInput.max = appConfig.maxResultsPerRun;
sheetName.textContent = `追記先: ${appConfig.sheetName}`;

for (const button of tabButtons) {
  button.addEventListener('click', () => setMode(button.dataset.mode));
}

shopForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(shopForm);
  const payload = {
    keyword: formData.get('keyword'),
    area: formData.get('area'),
    results: Number(formData.get('results')),
    start: Number(formData.get('start')),
    sort: formData.get('sort'),
    append: formData.get('append') === 'on'
  };
  await runSearch({
    endpoint: '/api/search-and-append',
    payload,
    button: shopButton,
    render: renderShopRows,
    afterSuccess: (data) => {
      summary.textContent = `${payload.start}件目から${data.count}件取得 / ${data.appended}件追記 / ${data.skipped}件スキップ`;
      startInput.value = String(payload.start + payload.results);
      setStatus(`完了しました。次は${startInput.value}件目から検索できます。`);
    }
  });
});

eventForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(eventForm);
  const payload = {
    keyword: formData.get('keyword'),
    area: formData.get('area'),
    source: formData.get('source'),
    results: Number(formData.get('results')),
    start: Number(formData.get('start')),
    futureOnly: formData.get('futureOnly') === 'on',
    append: formData.get('append') === 'on'
  };
  await runSearch({
    endpoint: '/api/events/search-and-append',
    payload,
    button: eventButton,
    render: renderEventRows,
    afterSuccess: (data) => {
      summary.textContent = `${payload.start}件目から${data.count}件取得 / ${data.appended}件追記 / ${data.skipped}件スキップ`;
      eventStartInput.value = String(payload.start + payload.results);
      setStatus(`完了しました。次は${eventStartInput.value}件目から検索できます。`);
    }
  });
});

function setMode(mode) {
  activeMode = mode;
  for (const button of tabButtons) {
    button.classList.toggle('is-active', button.dataset.mode === mode);
  }
  for (const form of forms) {
    form.classList.toggle('is-hidden', form.dataset.mode !== mode);
  }

  const isEvents = mode === 'events';
  pageTitle.textContent = isEvents ? 'イベント情報取得' : '店舗情報取得';
  sheetName.textContent = `追記先: ${isEvents ? appConfig.eventSheetName : appConfig.sheetName}`;
  shopHead.classList.toggle('is-hidden', isEvents);
  eventHead.classList.toggle('is-hidden', !isEvents);
  rows.replaceChildren();
  summary.textContent = '';
  setStatus('');
}

async function runSearch({ endpoint, payload, button, render, afterSuccess }) {
  setBusy(button, true);
  setStatus('検索中です...');
  rows.replaceChildren();
  summary.textContent = '';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '処理に失敗しました。');
    }

    render(data.items);
    afterSuccess(data);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setBusy(button, false);
  }
}

function renderShopRows(items) {
  const fragment = document.createDocumentFragment();
  for (const item of items) {
    fragment.append(rowFor([item.name, item.address, item.tel, item.nearestStation, item.genre]));
  }
  rows.replaceChildren(fragment);
}

function renderEventRows(items) {
  const fragment = document.createDocumentFragment();
  for (const item of items) {
    fragment.append(rowFor([item.title, formatDate(item.startedAt), item.place, item.address, `${item.accepted || 0}/${item.limit || '-'}`]));
  }
  rows.replaceChildren(fragment);
}

function rowFor(values) {
  const tr = document.createElement('tr');
  for (const value of values) {
    const td = document.createElement('td');
    td.textContent = value || '-';
    tr.append(td);
  }
  return tr;
}

function formatDate(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function setBusy(button, isBusy) {
  button.disabled = isBusy;
  button.textContent = isBusy
    ? '処理中...'
    : activeMode === 'events'
      ? 'イベント検索して追記'
      : '検索して追記';
}

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.dataset.state = isError ? 'error' : 'normal';
}
