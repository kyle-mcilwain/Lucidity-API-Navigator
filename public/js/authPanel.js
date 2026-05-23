import {
  state,
  setBearerToken,
  setExtraHeaders,
  setApiUser,
  setTenantBaseUrl,
  setSpecUrl,
} from './state.js';
import { showToast } from './toast.js';

const panelEl = document.getElementById('auth-panel');
const toggleEl = document.getElementById('auth-toggle');
const tokenEl = document.getElementById('bearer-token');
const userEl = document.getElementById('api-user');
const tenantEl = document.getElementById('tenant-base-url');
const listEl = document.getElementById('extra-headers-list');
const addBtn = document.getElementById('add-header-btn');
const saveBtn = document.getElementById('save-creds-btn');
const credsStatusEl = document.getElementById('creds-status');
const specUrlInput = document.getElementById('spec-url');

toggleEl.addEventListener('click', () => {
  panelEl.hidden = !panelEl.hidden;
});

tokenEl.addEventListener('input', (e) => {
  setBearerToken(e.target.value.trim());
});

userEl.addEventListener('input', (e) => {
  setApiUser(e.target.value.trim());
});

tenantEl.addEventListener('input', (e) => {
  setTenantBaseUrl(e.target.value.trim());
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
      body: JSON.stringify({
        user: state.apiUser,
        apiKey: state.bearerToken,
        tenantBaseUrl: state.tenantBaseUrl,
        specUrl: specUrlInput.value.trim(),
      }),
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
  if (state.apiUser) {
    headers['X-API-User'] = state.apiUser;
  }
  return headers;
}

export async function loadLocalCredentials() {
  try {
    const res = await fetch('/api/credentials');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.credentials) {
      credsStatusEl.textContent = `No saved credentials. Edit fields above and click Save locally.`;
      return null;
    }
    const { user, apiKey, tenantBaseUrl, specUrl } = data.credentials;
    if (apiKey) {
      tokenEl.value = apiKey;
      setBearerToken(apiKey);
    }
    if (user) {
      userEl.value = user;
      setApiUser(user);
    }
    if (tenantBaseUrl) {
      tenantEl.value = tenantBaseUrl;
      setTenantBaseUrl(tenantBaseUrl);
    }
    if (specUrl) {
      specUrlInput.value = specUrl;
      setSpecUrl(specUrl);
    }
    credsStatusEl.textContent = `Loaded credentials for ${user || '(no user)'} from ${data.path}`;
    return data.credentials;
  } catch {
    return null;
  }
}

renderRows();
