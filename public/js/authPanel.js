import { state, setBearerToken, setExtraHeaders } from './state.js';

const panelEl = document.getElementById('auth-panel');
const toggleEl = document.getElementById('auth-toggle');
const tokenEl = document.getElementById('bearer-token');
const listEl = document.getElementById('extra-headers-list');
const addBtn = document.getElementById('add-header-btn');

toggleEl.addEventListener('click', () => {
  panelEl.hidden = !panelEl.hidden;
});

tokenEl.addEventListener('input', (e) => {
  setBearerToken(e.target.value.trim());
});

function renderRows() {
  listEl.innerHTML = '';
  state.extraHeaders.forEach((row, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'extra-header-row';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Header name';
    nameInput.value = row.name;
    nameInput.addEventListener('input', (e) => {
      const next = state.extraHeaders.slice();
      next[idx] = { ...next[idx], name: e.target.value };
      setExtraHeaders(next);
    });

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.placeholder = 'Value';
    valueInput.value = row.value;
    valueInput.addEventListener('input', (e) => {
      const next = state.extraHeaders.slice();
      next[idx] = { ...next[idx], value: e.target.value };
      setExtraHeaders(next);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      const next = state.extraHeaders.filter((_, i) => i !== idx);
      setExtraHeaders(next);
      renderRows();
    });

    wrap.append(nameInput, valueInput, removeBtn);
    listEl.append(wrap);
  });
}

addBtn.addEventListener('click', () => {
  setExtraHeaders([...state.extraHeaders, { name: '', value: '' }]);
  renderRows();
});

export function buildAuthHeaders() {
  const headers = {};
  for (const row of state.extraHeaders) {
    if (row.name && row.value) headers[row.name] = row.value;
  }
  if (state.bearerToken) {
    headers['Authorization'] = `Bearer ${state.bearerToken}`;
  }
  return headers;
}

renderRows();
