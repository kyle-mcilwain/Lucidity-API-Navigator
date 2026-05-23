import { state, subscribe } from './state.js';
import { renderJsonTree } from './jsonTree.js';

const containerEl = document.getElementById('response-viewer');

function statusClass(status) {
  if (!status) return 'status-0';
  const first = Math.floor(status / 100);
  return `status-${first}`;
}

function renderHeadersTable(headers) {
  const table = document.createElement('table');
  table.className = 'headers-table';
  const head = document.createElement('thead');
  head.innerHTML = '<tr><th>Header</th><th>Value</th></tr>';
  const body = document.createElement('tbody');
  const entries = Object.entries(headers || {}).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [k, v] of entries) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.textContent = k;
    const td = document.createElement('td');
    td.textContent = v;
    tr.append(th, td);
    body.append(tr);
  }
  table.append(head, body);
  return table;
}

function renderResponse(response) {
  containerEl.innerHTML = '';

  const meta = document.createElement('div');
  meta.className = 'response-meta';

  if (response.networkError) {
    const pill = document.createElement('span');
    pill.className = 'status-pill status-0';
    pill.textContent = 'Network error';
    meta.append(pill);
    const err = document.createElement('span');
    err.textContent = response.error || 'Failed';
    meta.append(err);
    containerEl.append(meta);
    return;
  }

  const pill = document.createElement('span');
  pill.className = `status-pill ${statusClass(response.status)}`;
  pill.textContent = `${response.status} ${response.statusText || ''}`.trim();
  meta.append(pill);

  const dur = document.createElement('span');
  dur.style.color = 'var(--muted)';
  dur.style.fontSize = '12px';
  dur.textContent = `${response.durationMs} ms`;
  meta.append(dur);

  const reqUrl = document.createElement('code');
  reqUrl.style.fontSize = '11px';
  reqUrl.style.color = 'var(--muted)';
  reqUrl.style.wordBreak = 'break-all';
  reqUrl.textContent = `${response.requestMethod} ${response.requestUrl}`;
  meta.append(reqUrl);

  containerEl.append(meta);

  const tabs = document.createElement('div');
  tabs.className = 'tab-row';
  const tabBody = document.createElement('button');
  tabBody.type = 'button';
  tabBody.className = 'tab-btn active';
  tabBody.textContent = 'Body';
  const tabHeaders = document.createElement('button');
  tabHeaders.type = 'button';
  tabHeaders.className = 'tab-btn';
  tabHeaders.textContent = `Headers (${Object.keys(response.headers || {}).length})`;
  const tabRaw = document.createElement('button');
  tabRaw.type = 'button';
  tabRaw.className = 'tab-btn';
  tabRaw.textContent = 'Raw';
  tabs.append(tabBody, tabHeaders, tabRaw);
  containerEl.append(tabs);

  const slot = document.createElement('div');
  containerEl.append(slot);

  function showBody() {
    slot.innerHTML = '';
    if (response.parsedBody !== null && response.parsedBody !== undefined) {
      slot.append(renderJsonTree(response.parsedBody));
    } else if (response.body) {
      const pre = document.createElement('pre');
      pre.className = 'body-raw';
      pre.textContent = response.body;
      slot.append(pre);
    } else {
      const empty = document.createElement('p');
      empty.className = 'empty-hint';
      empty.textContent = '(empty response body)';
      slot.append(empty);
    }
  }
  function showHeaders() {
    slot.innerHTML = '';
    slot.append(renderHeadersTable(response.headers));
  }
  function showRaw() {
    slot.innerHTML = '';
    const pre = document.createElement('pre');
    pre.className = 'body-raw';
    pre.textContent = response.body || '(empty)';
    slot.append(pre);
  }

  function activate(btn, fn) {
    tabs.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    fn();
  }
  tabBody.addEventListener('click', () => activate(tabBody, showBody));
  tabHeaders.addEventListener('click', () => activate(tabHeaders, showHeaders));
  tabRaw.addEventListener('click', () => activate(tabRaw, showRaw));
  showBody();
}

export function render() {
  if (!state.lastResponse) {
    containerEl.innerHTML = '<p class="empty-hint">Responses appear here.</p>';
    return;
  }
  renderResponse(state.lastResponse);
}

subscribe((key) => {
  if (key === 'lastResponse') render();
});
