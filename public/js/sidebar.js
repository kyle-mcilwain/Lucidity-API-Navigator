import { state, setSelected, subscribe } from './state.js';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

const listEl = document.getElementById('endpoint-list');
const filterEl = document.getElementById('endpoint-filter');

function operationsFromSpec(spec) {
  const ops = [];
  const paths = spec?.paths ?? {};
  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (!op || typeof op !== 'object') continue;
      const tags = Array.isArray(op.tags) && op.tags.length ? op.tags : ['default'];
      ops.push({
        key: `${method.toUpperCase()} ${pathKey}`,
        method,
        path: pathKey,
        tag: tags[0],
        summary: op.summary ?? '',
        operationId: op.operationId ?? '',
        op,
      });
    }
  }
  return ops;
}

function groupByTag(ops) {
  const map = new Map();
  for (const op of ops) {
    if (!map.has(op.tag)) map.set(op.tag, []);
    map.get(op.tag).push(op);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function applyFilter(text) {
  const needle = text.trim().toLowerCase();
  const rows = listEl.querySelectorAll('.endpoint-row');
  const groups = listEl.querySelectorAll('.tag-group');
  if (!needle) {
    rows.forEach((r) => (r.hidden = false));
    groups.forEach((g) => (g.hidden = false));
    return;
  }
  for (const group of groups) {
    let visible = 0;
    const groupRows = group.querySelectorAll('.endpoint-row');
    groupRows.forEach((row) => {
      const hay = row.dataset.search || '';
      const show = hay.includes(needle);
      row.hidden = !show;
      if (show) visible++;
    });
    group.hidden = visible === 0;
    if (visible > 0) group.open = true;
  }
}

function renderRow(op) {
  const row = document.createElement('div');
  row.className = 'endpoint-row';
  row.dataset.key = op.key;
  row.dataset.search = `${op.method} ${op.path} ${op.summary} ${op.operationId}`.toLowerCase();

  const badge = document.createElement('span');
  badge.className = `method-badge method-${op.method}`;
  badge.textContent = op.method;

  const pathEl = document.createElement('div');
  pathEl.className = 'endpoint-path';
  pathEl.textContent = op.path;

  row.append(badge, pathEl);
  if (op.summary) {
    const summary = document.createElement('div');
    summary.className = 'endpoint-summary';
    summary.textContent = op.summary;
    row.append(summary);
  }

  row.addEventListener('click', () => {
    setSelected(op.key);
  });
  return row;
}

export function renderSidebar() {
  listEl.innerHTML = '';
  if (!state.spec) {
    listEl.innerHTML = '<p class="empty-hint">Load a spec to see endpoints.</p>';
    return;
  }
  const ops = operationsFromSpec(state.spec);
  if (ops.length === 0) {
    listEl.innerHTML = '<p class="empty-hint">No operations found in spec.</p>';
    return;
  }
  state.operations = ops;
  const grouped = groupByTag(ops);
  for (const [tag, list] of grouped) {
    const group = document.createElement('details');
    group.className = 'tag-group';
    group.open = true;
    const summary = document.createElement('summary');
    summary.textContent = `${tag} (${list.length})`;
    group.append(summary);
    for (const op of list) group.append(renderRow(op));
    listEl.append(group);
  }
  highlightSelected();
}

function highlightSelected() {
  const selected = state.selectedKey;
  listEl.querySelectorAll('.endpoint-row').forEach((row) => {
    row.classList.toggle('active', row.dataset.key === selected);
  });
}

filterEl.addEventListener('input', (e) => applyFilter(e.target.value));

subscribe((key) => {
  if (key === 'spec') renderSidebar();
  if (key === 'selected') highlightSelected();
});
