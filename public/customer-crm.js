const STORAGE_KEY = 'doorSalesCrm.records.v1';

const statusMap = {
  new: { label: '未訪問', className: 'status-new' },
  follow: { label: '再訪問', className: 'status-follow' },
  won: { label: '成約', className: 'status-won' },
  lost: { label: '見送り', className: 'status-lost' }
};

const form = document.querySelector('#customerForm');
const customerId = document.querySelector('#customerId');
const recordCount = document.querySelector('#recordCount');
const rows = document.querySelector('#customerRows');
const emptyWrap = document.querySelector('.tableWrap');
const searchText = document.querySelector('#searchText');
const statusFilter = document.querySelector('#statusFilter');
const exportButton = document.querySelector('#exportButton');
const importFile = document.querySelector('#importFile');
const clearButton = document.querySelector('#clearButton');
const counters = {
  new: document.querySelector('#countNew'),
  follow: document.querySelector('#countFollow'),
  won: document.querySelector('#countWon'),
  lost: document.querySelector('#countLost')
};

let records = loadRecords();

render();

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const record = normalizeRecord({
    id: data.customerId || crypto.randomUUID(),
    name: data.name,
    address: data.address,
    phone: data.phone,
    status: data.status,
    nextVisit: data.nextVisit,
    memo: data.memo,
    updatedAt: new Date().toISOString()
  });

  const index = records.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.unshift(record);
  }
  saveRecords();
  resetForm();
  render();
});

clearButton.addEventListener('click', resetForm);
searchText.addEventListener('input', render);
statusFilter.addEventListener('change', render);

document.querySelectorAll('.summaryTile').forEach((button) => {
  button.addEventListener('click', () => {
    statusFilter.value = button.dataset.filter;
    render();
  });
});

rows.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const record = records.find((item) => item.id === button.dataset.id);
  if (!record) {
    return;
  }

  if (button.dataset.action === 'edit') {
    fillForm(record);
  }

  if (button.dataset.action === 'delete') {
    records = records.filter((item) => item.id !== record.id);
    saveRecords();
    render();
    if (customerId.value === record.id) {
      resetForm();
    }
  }
});

exportButton.addEventListener('click', () => {
  const csv = toCsv(records);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `visit-customers-${formatDate(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

importFile.addEventListener('change', async () => {
  const file = importFile.files?.[0];
  if (!file) {
    return;
  }

  const text = await file.text();
  const imported = fromCsv(text);
  const byKey = new Map(records.map((record) => [record.id, record]));
  for (const record of imported) {
    byKey.set(record.id, record);
  }
  records = [...byKey.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  saveRecords();
  importFile.value = '';
  render();
});

function render() {
  const filtered = getFilteredRecords();
  const fragment = document.createDocumentFragment();

  for (const record of filtered) {
    const tr = document.createElement('tr');
    const status = statusMap[record.status] ?? statusMap.new;
    tr.innerHTML = `
      <td><span class="statusCell ${status.className}"><span class="pin"></span>${escapeHtml(status.label)}</span></td>
      <td>${escapeHtml(record.name)}</td>
      <td class="addressCell">${escapeHtml(record.address)}</td>
      <td>${escapeHtml(record.phone || '-')}</td>
      <td>${escapeHtml(record.nextVisit || '-')}</td>
      <td class="memoCell">${escapeHtml(record.memo || '-')}</td>
      <td>
        <div class="rowActions">
          <button class="secondary" type="button" data-action="edit" data-id="${record.id}">編集</button>
          <button class="secondary" type="button" data-action="delete" data-id="${record.id}">削除</button>
        </div>
      </td>
    `;
    fragment.append(tr);
  }

  rows.replaceChildren(fragment);
  emptyWrap.dataset.empty = String(filtered.length === 0);
  recordCount.textContent = `${records.length}件`;
  renderCounters();
}

function renderCounters() {
  const counts = { new: 0, follow: 0, won: 0, lost: 0 };
  for (const record of records) {
    counts[record.status] = (counts[record.status] ?? 0) + 1;
  }
  for (const [status, element] of Object.entries(counters)) {
    element.textContent = String(counts[status] ?? 0);
  }
}

function getFilteredRecords() {
  const query = searchText.value.trim().toLowerCase();
  const filter = statusFilter.value;
  return records.filter((record) => {
    const matchesStatus = filter === 'all' || record.status === filter;
    const haystack = `${record.name} ${record.address} ${record.phone} ${record.memo}`.toLowerCase();
    return matchesStatus && (!query || haystack.includes(query));
  });
}

function fillForm(record) {
  customerId.value = record.id;
  form.elements.name.value = record.name;
  form.elements.address.value = record.address;
  form.elements.phone.value = record.phone;
  form.elements.nextVisit.value = record.nextVisit;
  form.elements.memo.value = record.memo;
  form.elements.status.value = record.status;
  form.elements.name.focus();
}

function resetForm() {
  form.reset();
  customerId.value = '';
  form.elements.status.value = 'new';
}

function loadRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(normalizeRecord).filter((record) => record.name && record.address) : [];
  } catch {
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function normalizeRecord(record) {
  const status = statusMap[record.status] ? record.status : 'new';
  return {
    id: String(record.id || crypto.randomUUID()),
    name: String(record.name || '').trim(),
    address: String(record.address || '').trim(),
    phone: String(record.phone || '').trim(),
    status,
    nextVisit: String(record.nextVisit || '').trim(),
    memo: String(record.memo || '').trim(),
    updatedAt: String(record.updatedAt || new Date().toISOString())
  };
}

function toCsv(items) {
  const headers = ['顧客名', '住所', '訪問状況', '電話番号', '次回訪問', 'メモ', 'ID', '更新日時'];
  const lines = [headers, ...items.map((record) => [
    record.name,
    record.address,
    statusMap[record.status]?.label || statusMap.new.label,
    record.phone,
    record.nextVisit,
    record.memo,
    record.id,
    record.updatedAt
  ])];
  return `\ufeff${lines.map((line) => line.map(csvCell).join(',')).join('\n')}`;
}

function fromCsv(text) {
  const rows = parseCsv(text.replace(/^\ufeff/, ''));
  const [header = [], ...body] = rows;
  const indexes = Object.fromEntries(header.map((name, index) => [name, index]));
  const labelToStatus = Object.fromEntries(Object.entries(statusMap).map(([key, value]) => [value.label, key]));

  return body
    .map((row) => normalizeRecord({
      id: row[indexes.ID] || crypto.randomUUID(),
      name: row[indexes['顧客名']],
      address: row[indexes['住所']],
      status: labelToStatus[row[indexes['訪問状況']]] || 'new',
      phone: row[indexes['電話番号']],
      nextVisit: row[indexes['次回訪問']],
      memo: row[indexes['メモ']],
      updatedAt: row[indexes['更新日時']] || new Date().toISOString()
    }))
    .filter((record) => record.name && record.address);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === '"' && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ',') {
      row.push(value);
      value = '';
    } else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

function csvCell(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
