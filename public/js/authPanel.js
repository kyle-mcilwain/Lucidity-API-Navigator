import { state, setBearerToken, setExtraHeaders } from './state.js';
import { showToast } from './toast.js';

const panelEl = document.getElementById('auth-panel');
const toggleEl = document.getElementById('auth-toggle');
const tokenEl = document.getElementById('bearer-token');
const userEl = document.getElementById('api-user');
const listEl = document.getElementById('extra-headers-list');
const addBtn = document.getElementById('add-header-btn');
const saveBtn = document.getElementById('save-creds-btn');
const credsStatusEl = document.getElementById('creds-status');

let apiUser = '';

toggleEl.addEventListener('click', () => {
  panelEl.hidden = !panelEl.hidden;
});

tokenEl.addEventListener('input', (e) => {
  setBearerToken(e.target.value.trim());
});

userEl.addEventListener('input', (e) => {
  apiUser = e.target.value.trim();
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

saveBtn.addEventListener('click', async () => {
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';
  try {
    const res = await fetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: apiUser, apiKey: state.bearerToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(`Save failed: ${data.error || res.statusText}`, { error: true });
    } else {
      credsStatusEl.textContent = `Saved to ${data.path}`;
      showToast('Credentials saved locally.');
    }
  } catch (e) {
    showToast(`Save failed: ${e.message}`, { error: true });
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save locally';
  }
});

export function buildAuthHeaders() {
  const headers = {};
  for (const row of state.extraHeaders) {
    if (row.name && row.value) headers[row.name] = row.value;
  }
  if (state.bearerToken) {
    headers['Authorization'] = `Bearer ${state.bearerToken}`;
  }
  if (apiUser) {
    headers['X-API-User'] = apiUser;
  }
  return headers;
}

async function loadLocalCredentials() {
  try {
    const res = await fetch('/api/credentials');
    if (!res.ok) return;
    const data = await res.json();
    if (!data.credentials) {
      credsStatusEl.textContent = `No local credentials yet. Save to ${data.path} to persist.`;
      return;
    }
    const { user, apiKey } = data.credentials;
    if (apiKey) {
      tokenEl.value = apiKey;
      setBearerToken(apiKey);
    }
    if (user) {
      userEl.value = user;
      apiUser = user;
    }
    credsStatusEl.textContent = `Loaded credentials for ${user || '(no user)'} from ${data.path}`;
  } catch {
    // No-op: credentials are optional.
  }
}

renderRows();
loadLocalCredentials();
