const API_KEY_STORAGE = 'pinStatusMap.googleMapsApiKey';
const PLACE_STORAGE = 'pinStatusMap.places.v1';
const DEFAULT_STATUS = 'unvisited';
const SHARED_SYNC_INTERVAL_MS = 15000;

const statuses = {
  unvisited: { label: '未訪問', color: '#64748b', className: 'status-unvisited' },
  appointment: { label: 'アポ', color: '#16a34a', className: 'status-appointment' },
  initialKick: { label: 'インキ', color: '#2563eb', className: 'status-initialKick' },
  doorKick: { label: 'ドアキ', color: '#7c3aed', className: 'status-doorKick' },
  application: { label: 'アプ', color: '#eab308', className: 'status-application' },
  revisit: { label: '再訪', color: '#f97316', className: 'status-revisit' },
  excluded: { label: '対象外', color: '#111827', className: 'status-excluded' },
  away: { label: '留守', color: '#dc2626', className: 'status-away' },
  banned: { label: '禁止', color: '#6b7280', className: 'status-banned' }
};

const statusAliases = {
  new: DEFAULT_STATUS,
  kick: 'initialKick',
  nichou: 'initialKick',
  existing: 'application',
  follow: 'revisit',
  won: 'appointment',
  lost: 'away',
  未訪問: DEFAULT_STATUS,
  再訪問: 'revisit',
  成約: 'application',
  見送り: 'away',
  キック: 'initialKick',
  日調: 'initialKick',
  既設: 'application',
  アポ成立: 'appointment',
  アポ: 'appointment',
  インキ: 'initialKick',
  ドアキ: 'doorKick',
  アプ: 'application',
  再訪: 'revisit',
  対象外: 'excluded',
  留守: 'away',
  禁止: 'banned'
};

const setupPanel = document.querySelector('#setupPanel');
const authPanel = document.querySelector('#authPanel');
const authForm = document.querySelector('#authForm');
const sharePasswordInput = document.querySelector('#sharePassword');
const authError = document.querySelector('#authError');
const keyForm = document.querySelector('#keyForm');
const apiKeyInput = document.querySelector('#apiKey');
const importFile = document.querySelector('#importFile');
const exportButton = document.querySelector('#exportButton');
const menuButton = document.querySelector('#menuButton');
const addPinButton = document.querySelector('#addPinButton');
const centerPinButton = document.querySelector('#centerPinButton');
const selectedDeleteButton = document.querySelector('#selectedDeleteButton');
const mapTypeButton = document.querySelector('#mapTypeButton');
const locationSearchForm = document.querySelector('#locationSearchForm');
const locationSearchText = document.querySelector('#locationSearchText');
const locationSearchButton = document.querySelector('#locationSearchButton');
const locateButton = document.querySelector('#locateButton');
const closeDrawer = document.querySelector('#closeDrawer');
const drawer = document.querySelector('#drawer');
const placeList = document.querySelector('#placeList');
const searchText = document.querySelector('#searchText');
const totalCount = document.querySelector('#totalCount');
const pinPanel = document.querySelector('#pinPanel');
const pinName = document.querySelector('#pinName');
const pinAddress = document.querySelector('#pinAddress');
const pinAssignee = document.querySelector('#pinAssignee');
const pinNote = document.querySelector('#pinNote');
const statusToggleButton = document.querySelector('#statusToggleButton');
const statusButtons = document.querySelector('#statusButtons');
const renamePinButton = document.querySelector('#renamePinButton');
const deletePinButton = document.querySelector('#deletePinButton');

let map;
let bounds;
let geocoder;
let selectedPlaceId = '';
let filter = 'all';
let places = loadPlaces();
let currentLocationMarker;
let searchResultMarker;
let addingPin = false;
let loadingSharedPlaces = false;
let saveTimer;
let sessionInfo = { authRequired: false, authenticated: true, mapsApiKey: '' };
const markers = new Map();

registerServiceWorker();
bootstrap();

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await login();
});

keyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const key = apiKeyInput.value.trim();
  localStorage.setItem(API_KEY_STORAGE, key);
  await loadGoogleMaps(key);
});

menuButton.addEventListener('click', () => drawer.dataset.open = 'true');
addPinButton.addEventListener('click', toggleAddPinMode);
centerPinButton.addEventListener('click', addPlaceAtCenter);
selectedDeleteButton.addEventListener('click', deleteSelectedPin);
mapTypeButton.addEventListener('click', toggleMapType);
locationSearchForm.addEventListener('submit', searchLocation);
locateButton.addEventListener('click', locateUser);
closeDrawer.addEventListener('click', () => drawer.dataset.open = 'false');
searchText.addEventListener('input', renderList);
pinAssignee.addEventListener('change', updateSelectedDetails);
pinNote.addEventListener('change', updateSelectedDetails);
statusToggleButton.addEventListener('click', toggleStatusButtons);

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    renderList();
  });
});

document.querySelectorAll('[data-status]').forEach((button) => {
  button.addEventListener('click', () => {
    updateSelectedStatus(button.dataset.status);
    setStatusButtonsOpen(false);
  });
});

renamePinButton.addEventListener('click', renameSelectedPin);
deletePinButton.addEventListener('click', deleteSelectedPin);

placeList.addEventListener('click', (event) => {
  const item = event.target.closest('li[data-id]');
  if (!item) {
    return;
  }
  selectPlace(item.dataset.id, true);
  drawer.dataset.open = 'false';
});

async function bootstrap() {
  sessionInfo = await loadSession();
  if (sessionInfo.authRequired && !sessionInfo.authenticated) {
    showAuthPanel();
    return;
  }
  hideAuthPanel();
  const serverKey = sessionInfo.mapsApiKey || '';
  const savedKey = serverKey || localStorage.getItem(API_KEY_STORAGE) || '';
  apiKeyInput.value = savedKey;
  if (serverKey) {
    setupPanel.dataset.ready = 'true';
  }
  if (savedKey) {
    loadGoogleMaps(savedKey).catch(() => setupPanel.dataset.ready = 'false');
  }
}

async function loadSession() {
  if (!canUseSharedApi()) {
    return { authRequired: false, authenticated: true, mapsApiKey: '' };
  }
  try {
    const response = await fetch('./api/session', { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return { authRequired: false, authenticated: true, mapsApiKey: '' };
    }
    return await response.json();
  } catch {
    return { authRequired: false, authenticated: true, mapsApiKey: '' };
  }
}

async function login() {
  authError.textContent = '';
  const password = sharePasswordInput.value;
  try {
    const response = await fetch('./api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ password })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      authError.textContent = payload.error || 'ログインできませんでした。';
      return;
    }
    sessionInfo = await loadSession();
    hideAuthPanel();
    await bootstrap();
  } catch {
    authError.textContent = '通信できませんでした。';
  }
}

function showAuthPanel() {
  authPanel.hidden = false;
  setupPanel.hidden = true;
  sharePasswordInput.focus();
}

function hideAuthPanel() {
  authPanel.hidden = true;
  setupPanel.hidden = false;
}

importFile.addEventListener('change', async () => {
  const file = importFile.files?.[0];
  if (!file) {
    return;
  }
  const text = await file.text();
  const imported = file.name.toLowerCase().endsWith('.kml') ? parseKml(text) : parsePlaceCsv(text);
  const current = new Map(places.map((place) => [place.id, place]));
  for (const place of imported) {
    current.set(place.id, place);
  }
  places = [...current.values()];
  savePlaces();
  importFile.value = '';
  renderPlaces();
});

exportButton.addEventListener('click', () => {
  const blob = new Blob([toCsv(places)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pin-status-${formatDate(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

async function loadGoogleMaps(apiKey) {
  await appendScript(`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=ja&region=JP`);
  map = new google.maps.Map(document.querySelector('#map'), {
    center: { lat: 35.93948548956888, lng: 137.98219259999996 },
    zoom: 13,
    mapTypeId: 'hybrid',
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: false
  });
  geocoder = new google.maps.Geocoder();
  map.addListener('click', (event) => {
    if (addingPin && event.latLng) {
      addPlaceAt(event.latLng);
    }
  });
  bounds = new google.maps.LatLngBounds();
  setupPanel.dataset.ready = 'true';
  await loadSharedPlaces();
  window.setInterval(loadSharedPlaces, SHARED_SYNC_INTERVAL_MS);
  renderPlaces();
}

function renderPlaces() {
  if (!map) {
    return;
  }

  for (const marker of markers.values()) {
    marker.setMap(null);
  }
  markers.clear();
  bounds = new google.maps.LatLngBounds();

  for (const place of places) {
    const marker = new google.maps.Marker({
      map,
      position: { lat: place.lat, lng: place.lng },
      title: place.name,
      icon: markerIcon(place.status)
    });
    marker.addListener('click', () => selectPlace(place.id));
    markers.set(place.id, marker);
    bounds.extend(marker.getPosition());
  }

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, 48);
  }
  renderList();
  renderPinPanel();
}

function renderList() {
  totalCount.textContent = `${places.length}件`;
  const query = searchText.value.trim().toLowerCase();
  const visible = places.filter((place) => {
    const matchesFilter = filter === 'all' || place.status === filter;
    const text = `${place.name} ${place.address} ${place.assignee || ''} ${place.note || ''}`.toLowerCase();
    return matchesFilter && (!query || text.includes(query));
  });

  const fragment = document.createDocumentFragment();
  for (const place of visible) {
    const status = statuses[place.status] || statuses[DEFAULT_STATUS];
    const item = document.createElement('li');
    item.dataset.id = place.id;
    item.className = status.className;
    const meta = [place.address, place.assignee, place.note].filter(Boolean).join(' / ');
    item.innerHTML = `<span></span><div><strong>${escapeHtml(place.name)}</strong><small>${escapeHtml(meta)}</small></div>`;
    fragment.append(item);
  }
  placeList.replaceChildren(fragment);
}

function selectPlace(id, pan = false) {
  selectedPlaceId = id;
  const place = places.find((item) => item.id === id);
  if (place && pan) {
    map.panTo({ lat: place.lat, lng: place.lng });
    map.setZoom(Math.max(map.getZoom(), 16));
  }
  setStatusButtonsOpen(false);
  renderPinPanel();
}

function renderPinPanel() {
  const place = places.find((item) => item.id === selectedPlaceId);
  pinPanel.hidden = !place;
  selectedDeleteButton.disabled = !place;
  if (!place) {
    return;
  }
  pinName.textContent = place.name;
  pinAddress.textContent = place.address || `${place.lat}, ${place.lng}`;
  pinAssignee.value = place.assignee || '';
  pinNote.value = place.note || '';
}

function updateSelectedStatus(status) {
  if (!statuses[status]) {
    return;
  }
  const place = places.find((item) => item.id === selectedPlaceId);
  if (!place) {
    return;
  }
  place.status = status;
  place.updatedAt = new Date().toISOString();
  markers.get(place.id)?.setIcon(markerIcon(status));
  savePlaces();
  renderList();
}

function updateSelectedDetails() {
  const place = places.find((item) => item.id === selectedPlaceId);
  if (!place) {
    return;
  }
  place.assignee = pinAssignee.value.trim().slice(0, 40);
  place.note = pinNote.value.trim().slice(0, 160);
  place.updatedAt = new Date().toISOString();
  savePlaces();
  renderList();
}

function toggleStatusButtons() {
  setStatusButtonsOpen(statusButtons.classList.contains('is-collapsed'));
}

function setStatusButtonsOpen(open) {
  statusButtons.classList.toggle('is-collapsed', !open);
  statusToggleButton.setAttribute('aria-expanded', String(open));
  statusToggleButton.textContent = open ? '結果を閉じる' : '結果変更';
}

function toggleAddPinMode() {
  addingPin = !addingPin;
  addPinButton.setAttribute('aria-pressed', String(addingPin));
  addPinButton.dataset.active = String(addingPin);
}

function toggleMapType() {
  if (!map) {
    return;
  }
  const next = map.getMapTypeId() === 'hybrid' ? 'roadmap' : 'hybrid';
  map.setMapTypeId(next);
  mapTypeButton.textContent = next === 'hybrid' ? '通常地図' : '航空写真';
}

function searchLocation(event) {
  event.preventDefault();
  if (!map || !geocoder) {
    return;
  }
  const query = locationSearchText.value.trim();
  if (!query) {
    return;
  }
  locationSearchButton.disabled = true;
  locationSearchButton.textContent = '検索中';
  geocoder.geocode({ address: query, region: 'JP' }, (results, status) => {
    locationSearchButton.disabled = false;
    locationSearchButton.textContent = '検索';
    if (status !== 'OK' || !results?.[0]) {
      locationSearchText.setCustomValidity('見つかりませんでした');
      locationSearchText.reportValidity();
      locationSearchText.setCustomValidity('');
      return;
    }
    const result = results[0];
    const location = result.geometry.location;
    if (result.geometry.viewport) {
      map.fitBounds(result.geometry.viewport, 64);
    } else {
      map.panTo(location);
      map.setZoom(17);
    }
    if (!searchResultMarker) {
      searchResultMarker = new google.maps.Marker({
        map,
        title: '検索結果',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#ffffff',
          fillOpacity: 1,
          strokeColor: '#1f6fac',
          strokeWeight: 4,
          scale: 8
        },
        zIndex: 9998
      });
    }
    searchResultMarker.setPosition(location);
  });
}

function addPlaceAtCenter() {
  if (!map) {
    return;
  }
  addPlaceAt(map.getCenter());
}

function addPlaceAt(latLng) {
  const count = places.length + 1;
  const place = normalizePlace({
    id: crypto.randomUUID(),
    name: `太陽光あり ${String(count).padStart(3, '0')}`,
    address: '住所取得中',
    status: DEFAULT_STATUS,
    lat: latLng.lat(),
    lng: latLng.lng(),
    assignee: '',
    note: '',
    updatedAt: new Date().toISOString()
  });
  places = [...places, place];
  savePlaces();
  renderPlaces();
  selectPlace(place.id, true);
  reverseGeocode(place);
}

function reverseGeocode(place) {
  if (!geocoder) {
    return;
  }
  geocoder.geocode({ location: { lat: place.lat, lng: place.lng } }, (results, status) => {
    if (status !== 'OK' || !results?.[0]) {
      place.address = `${place.lat.toFixed(6)}, ${place.lng.toFixed(6)}`;
      savePlaces();
      renderPinPanel();
      renderList();
      return;
    }
    place.address = results[0].formatted_address.replace(/^日本、?/, '');
    place.updatedAt = new Date().toISOString();
    savePlaces();
    renderPinPanel();
    renderList();
  });
}

function renameSelectedPin() {
  const place = places.find((item) => item.id === selectedPlaceId);
  if (!place) {
    return;
  }
  const nextName = window.prompt('名称', place.name);
  if (!nextName?.trim()) {
    return;
  }
  place.name = nextName.trim().slice(0, 80);
  place.updatedAt = new Date().toISOString();
  markers.get(place.id)?.setTitle(place.name);
  savePlaces();
  renderPinPanel();
  renderList();
}

function deleteSelectedPin() {
  const place = places.find((item) => item.id === selectedPlaceId);
  if (!place || !window.confirm(`${place.name} を削除しますか？`)) {
    return;
  }
  markers.get(place.id)?.setMap(null);
  markers.delete(place.id);
  places = places.filter((item) => item.id !== place.id);
  selectedPlaceId = '';
  savePlaces();
  renderPlaces();
}

function locateUser() {
  if (!map || !navigator.geolocation) {
    return;
  }
  locateButton.disabled = true;
  locateButton.textContent = '取得中';
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      if (!currentLocationMarker) {
        currentLocationMarker = new google.maps.Marker({
          map,
          position: location,
          title: '現在地',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#1f6fac',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
            scale: 8
          },
          zIndex: 9999
        });
      } else {
        currentLocationMarker.setPosition(location);
      }
      map.panTo(location);
      map.setZoom(Math.max(map.getZoom(), 17));
      locateButton.disabled = false;
      locateButton.textContent = '現在地';
    },
    () => {
      locateButton.disabled = false;
      locateButton.textContent = '現在地';
    },
    {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 10000
    }
  );
}

function markerIcon(status) {
  const color = (statuses[status] || statuses[DEFAULT_STATUS]).color;
  return {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 1.45,
    anchor: new google.maps.Point(12, 22),
    labelOrigin: new google.maps.Point(12, 9)
  };
}

function parseKml(text) {
  const xml = new DOMParser().parseFromString(text, 'application/xml');
  return [...xml.querySelectorAll('Placemark')].map((node) => {
    const coords = node.querySelector('Point coordinates, coordinates')?.textContent?.trim().split(',') || [];
    const extended = Object.fromEntries([...node.querySelectorAll('Data')].map((data) => [
      data.getAttribute('name'),
      data.querySelector('value')?.textContent || ''
    ]));
    return normalizePlace({
      id: extended.ID || stableId(node.querySelector('name')?.textContent || '', coords.join(',')),
      name: node.querySelector('name')?.textContent || '名称未設定',
      address: extended['住所'] || extended.address || node.querySelector('description')?.textContent || '',
      status: labelToStatus(extended['訪問状況']),
      lng: Number(coords[0]),
      lat: Number(coords[1]),
      assignee: extended['担当者'] || extended.assignee || '',
      note: extended['メモ'] || extended.note || '',
      updatedAt: extended['更新日時'] || new Date().toISOString()
    });
  }).filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng));
}

function parsePlaceCsv(text) {
  const rows = parseCsv(text.replace(/^\ufeff/, ''));
  const [header = [], ...body] = rows;
  const indexes = Object.fromEntries(header.map((name, index) => [name, index]));
  return body.map((row) => normalizePlace({
    id: row[indexes.ID] || stableId(row[indexes['顧客名']] || row[indexes.name] || '', `${row[indexes.lat] || row[indexes['緯度']]},${row[indexes.lng] || row[indexes['経度']]}`),
    name: row[indexes['顧客名']] || row[indexes.name],
    address: row[indexes['住所']] || row[indexes.address],
    status: labelToStatus(row[indexes['訪問状況']] || row[indexes.status]),
    lat: Number(row[indexes['緯度']] || row[indexes.lat]),
    lng: Number(row[indexes['経度']] || row[indexes.lng]),
    assignee: row[indexes['担当者']] || row[indexes.assignee] || '',
    note: row[indexes['メモ']] || row[indexes.note] || '',
    updatedAt: row[indexes['更新日時']] || row[indexes.updatedAt] || new Date().toISOString()
  })).filter((place) => place.name && Number.isFinite(place.lat) && Number.isFinite(place.lng));
}

function toCsv(items) {
  const headers = ['顧客名', '住所', '訪問状況', '緯度', '経度', '担当者', 'メモ', 'ID', '更新日時'];
  const lines = [headers, ...items.map((place) => [
    place.name,
    place.address,
    statuses[place.status]?.label || statuses[DEFAULT_STATUS].label,
    place.lat,
    place.lng,
    place.assignee || '',
    place.note || '',
    place.id,
    place.updatedAt
  ])];
  return `\ufeff${lines.map((line) => line.map(csvCell).join(',')).join('\n')}`;
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

function normalizePlace(place) {
  return {
    id: String(place.id || crypto.randomUUID()),
    name: String(place.name || '').trim(),
    address: String(place.address || '').trim(),
    status: labelToStatus(place.status),
    lat: Number(place.lat),
    lng: Number(place.lng),
    assignee: String(place.assignee || '').trim(),
    note: String(place.note || '').trim(),
    updatedAt: String(place.updatedAt || new Date().toISOString())
  };
}

function labelToStatus(label) {
  const key = String(label || '').trim();
  const found = Object.entries(statuses).find(([, value]) => value.label === key);
  return found?.[0] || statusAliases[key] || (statuses[key] ? key : DEFAULT_STATUS);
}

function loadPlaces() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PLACE_STORAGE) || '[]');
    return Array.isArray(parsed) ? parsed.map(normalizePlace).filter((place) => place.name) : [];
  } catch {
    return [];
  }
}

function savePlaces() {
  localStorage.setItem(PLACE_STORAGE, JSON.stringify(places));
  if (!loadingSharedPlaces) {
    queueSharedSave();
  }
}

async function loadSharedPlaces() {
  if (!canUseSharedApi()) {
    return;
  }
  try {
    loadingSharedPlaces = true;
    const response = await fetch('./api/pin-status', { headers: { Accept: 'application/json' } });
    if (response.status === 401) {
      showAuthPanel();
      return;
    }
    if (!response.ok) {
      throw new Error('共有データを読み込めませんでした。');
    }
    const payload = await response.json();
    places = Array.isArray(payload.places) ? payload.places.map(normalizePlace).filter((place) => place.name) : [];
    localStorage.setItem(PLACE_STORAGE, JSON.stringify(places));
    renderPlaces();
  } catch {
    // Network or hosting errors should not block field use; localStorage remains the fallback.
  } finally {
    loadingSharedPlaces = false;
  }
}

function queueSharedSave() {
  if (!canUseSharedApi()) {
    return;
  }
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveSharedPlaces, 350);
}

async function saveSharedPlaces() {
  try {
    const response = await fetch('./api/pin-status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ places })
    });
    if (response.status === 401) {
      showAuthPanel();
    }
  } catch {
    // Keep the local copy; the next edit will try again.
  }
}

function canUseSharedApi() {
  return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

function appendScript(src) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./pin-status-map-sw.js').catch(() => {});
  }
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

function stableId(name, seed) {
  return btoa(unescape(encodeURIComponent(`${name}:${seed}`))).replace(/[=+/]/g, '').slice(0, 24) || crypto.randomUUID();
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
