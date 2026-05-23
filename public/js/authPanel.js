import {
  state,
  setApiKey,
  setExtraHeaders,
  setApiUser,
  setTenantBaseUrl,
  setSpecUrl,
  subscribe,
} from './state.js';
import { showToast } from './toast.js';
import { authenticate } from './authFlow.js';

const panelEl = document.getElementById('auth-panel');
const toggleEl = document.getElementById('auth-toggle');
const apiKeyEl = document.getElementById('api-key');
const userEl = document.getElementById('api-user');
const tenantEl = document.getElementById('tenant-base-url');
const listEl = document.getElementById('extra-headers-list');
const addBtn = document.getElementById('add-header-btn');
const saveBtn = document.getElementById('save-creds-btn');
const authBtn = document.getElementById('authenticate-btn');
const authStatusEl = document.getElementById('auth-status');
const credsStatusEl = document.getElementById('creds-status');
const specUrlInput = document.getElementById('spec-url');

toggleEl.addEventListener('click', () => {
  panelEl.hidden = !panelEl.hidden;
});

apiKeyEl.addEventListener('input', (e) => {
  setApiKey(e.target.value.trim());
});

userEl.addEventListener('input', (e) => {
  setApiUser(e.target.value.trim());
});

tenantEl.addEventListener('input', (e) => {
  setTenantBaseUrl(e.target.value.trim());
});

authBtn.addEventListener('click', async () => {
  authBtn.disabled = true;
  authBtn.textContent = 'Authenticating…';
  try {
    const jwt = await authenticate();
    if (jwt) showToast('Authenticated.');
    else if (state.authMessage) showToast(state.authMessage, { error: true, duration: 10000 });
  } finally {
    authBtn.disabled = false;
    authBtn.textContent = 'Authenticate';
  }
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
        apiKey: state.apiKey,
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
  const credential = state.bearerToken || state.apiKey;
  if (credential) {
    headers['Authorization'] = `Bearer ${credential}`;
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
      apiKeyEl.value = apiKey;
      setApiKey(apiKey);
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

subscribe((key, value) => {
  if (key === 'authStatus' && authStatusEl) {
    const { status, message } = value;
    authStatusEl.textContent = message;
    authStatusEl.dataset.status = status;
  }
});

renderRows();
