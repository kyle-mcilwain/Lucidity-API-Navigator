import { state, setLastResponse, subscribe } from './state.js';
import { buildAuthHeaders } from './authPanel.js';
import { showToast } from './toast.js';

const containerEl = document.getElementById('request-builder');

function findOperation(key) {
  if (!key) return null;
  return (state.operations || []).find((o) => o.key === key) || null;
}

function exampleFromSchema(schema, depth = 0) {
  if (!schema || depth > 6) return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  const type = schema.type || (schema.properties ? 'object' : schema.items ? 'array' : null);
  switch (type) {
    case 'string':
      if (schema.format === 'date-time') return new Date().toISOString();
      if (schema.format === 'date') return new Date().toISOString().slice(0, 10);
      if (schema.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
      return '';
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [exampleFromSchema(schema.items, depth + 1)].filter((v) => v !== null);
    case 'object': {
      const out = {};
      const props = schema.properties || {};
      for (const [name, sub] of Object.entries(props)) {
        out[name] = exampleFromSchema(sub, depth + 1);
      }
      return out;
    }
    default:
      return null;
  }
}

function schemaSummary(schema) {
  if (!schema) return '';
  if (schema.enum) return `enum: ${schema.enum.join(' | ')}`;
  if (schema.type === 'array' && schema.items?.type) return `array<${schema.items.type}>`;
  return schema.type || '';
}

function getRequestBody(op) {
  if (!op.requestBody?.content) return null;
  const content = op.requestBody.content;
  const jsonKey = Object.keys(content).find((k) => k.includes('json')) || Object.keys(content)[0];
  if (!jsonKey) return null;
  return { mediaType: jsonKey, schema: content[jsonKey]?.schema || null };
}

function paramField(param, paramValues) {
  const row = document.createElement('div');
  row.className = 'param-row';

  const label = document.createElement('label');
  const nameSpan = document.createElement('span');
  nameSpan.textContent = param.name;
  if (param.required) {
    const req = document.createElement('span');
    req.className = 'required-tag';
    req.textContent = ' *';
    nameSpan.append(req);
  }
  const meta = document.createElement('span');
  meta.className = 'param-meta';
  const desc = param.description ? ` — ${param.description}` : '';
  meta.textContent = `${schemaSummary(param.schema)}${desc}`;
  label.append(nameSpan, meta);

  let control;
  const schema = param.schema || {};
  if (Array.isArray(schema.enum) && schema.enum.length) {
    control = document.createElement('select');
    if (!param.required) {
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = '— not set —';
      control.append(blank);
    }
    for (const opt of schema.enum) {
      const o = document.createElement('option');
      o.value = String(opt);
      o.textContent = String(opt);
      control.append(o);
    }
  } else {
    control = document.createElement('input');
    control.type = schema.type === 'integer' || schema.type === 'number' ? 'number' : 'text';
    control.placeholder = schema.example !== undefined ? String(schema.example) : schema.type || '';
  }
  control.dataset.in = param.in;
  control.dataset.name = param.name;
  control.dataset.type = schema.type || 'string';
  const initial = paramValues[`${param.in}:${param.name}`];
  if (initial !== undefined) control.value = initial;

  row.append(label, control);
  return { row, control };
}

function coerceValue(raw, type) {
  if (raw === '' || raw === undefined || raw === null) return undefined;
  if (type === 'integer') {
    const n = Number(raw);
    return Number.isInteger(n) ? n : raw;
  }
  if (type === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : raw;
  }
  if (type === 'boolean') {
    if (raw === 'true') return true;
    if (raw === 'false') return false;
  }
  return raw;
}

function joinUrl(base, path) {
  if (!base) return path;
  const trimmedBase = base.replace(/\/+$/, '');
  const trimmedPath = path.startsWith('/') ? path : '/' + path;
  return trimmedBase + trimmedPath;
}

function substitutePath(path, pathParams) {
  return path.replace(/\{([^}]+)\}/g, (_, name) => {
    const v = pathParams[name];
    if (v === undefined || v === '') return `{${name}}`;
    return encodeURIComponent(v);
  });
}

function renderOperation(opEntry) {
  containerEl.innerHTML = '';
  const op = opEntry.op;

  const header = document.createElement('div');
  header.className = 'op-header';
  const badge = document.createElement('span');
  badge.className = `method-badge method-${opEntry.method}`;
  badge.textContent = opEntry.method;
  const pathEl = document.createElement('span');
  pathEl.className = 'op-path';
  pathEl.textContent = opEntry.path;
  header.append(badge, pathEl);
  containerEl.append(header);

  if (op.summary) {
    const sum = document.createElement('p');
    sum.className = 'op-summary';
    sum.textContent = op.summary;
    containerEl.append(sum);
  }
  if (op.description) {
    const desc = document.createElement('div');
    desc.className = 'op-description';
    desc.textContent = op.description;
    containerEl.append(desc);
  }

  const baseRow = document.createElement('fieldset');
  baseRow.className = 'param-group';
  const baseLegend = document.createElement('legend');
  baseLegend.textContent = 'Server';
  baseRow.append(baseLegend);

  const baseLabel = document.createElement('label');
  baseLabel.style.display = 'block';
  baseLabel.style.fontSize = '12px';
  baseLabel.textContent = 'Base URL';
  const baseInput = document.createElement('input');
  baseInput.type = 'text';
  baseInput.style.width = '100%';
  baseInput.style.padding = '6px 8px';
  baseInput.style.border = '1px solid var(--border)';
  baseInput.style.borderRadius = '6px';
  baseInput.style.fontFamily = 'ui-monospace, monospace';
  baseInput.style.fontSize = '12px';
  baseInput.value = state.baseUrl || '';
  baseInput.placeholder = 'https://api.example.com';
  baseRow.append(baseLabel, baseInput);

  if (state.spec?.servers?.length > 1) {
    const select = document.createElement('select');
    select.style.marginTop = '6px';
    select.style.width = '100%';
    for (const s of state.spec.servers) {
      const o = document.createElement('option');
      o.value = s.url;
      o.textContent = s.description ? `${s.url} — ${s.description}` : s.url;
      select.append(o);
    }
    select.value = state.baseUrl || state.spec.servers[0].url;
    select.addEventListener('change', (e) => {
      baseInput.value = e.target.value;
      state.baseUrl = e.target.value;
      updatePreview();
    });
    baseRow.append(select);
  }
  baseInput.addEventListener('input', (e) => {
    state.baseUrl = e.target.value;
    updatePreview();
  });
  containerEl.append(baseRow);

  const params = Array.isArray(op.parameters) ? op.parameters : [];
  const grouped = { path: [], query: [], header: [] };
  for (const p of params) {
    if (grouped[p.in]) grouped[p.in].push(p);
  }

  const paramControls = [];
  for (const groupName of ['path', 'query', 'header']) {
    const items = grouped[groupName];
    if (items.length === 0) continue;
    const fs = document.createElement('fieldset');
    fs.className = 'param-group';
    const lg = document.createElement('legend');
    lg.textContent = `${groupName} parameters`;
    fs.append(lg);
    for (const p of items) {
      const { row, control } = paramField(p, {});
      fs.append(row);
      paramControls.push({ param: p, control });
      control.addEventListener('input', updatePreview);
      control.addEventListener('change', updatePreview);
    }
    containerEl.append(fs);
  }

  const requestBody = getRequestBody(op);
  let bodyTextarea = null;
  if (requestBody) {
    const fs = document.createElement('fieldset');
    fs.className = 'param-group body-editor';
    const lg = document.createElement('legend');
    lg.textContent = `request body (${requestBody.mediaType})`;
    fs.append(lg);
    bodyTextarea = document.createElement('textarea');
    bodyTextarea.spellcheck = false;
    const initial = exampleFromSchema(requestBody.schema);
    bodyTextarea.value = initial == null ? '' : JSON.stringify(initial, null, 2);
    fs.append(bodyTextarea);

    const actions = document.createElement('div');
    actions.className = 'body-actions';
    const formatBtn = document.createElement('button');
    formatBtn.type = 'button';
    formatBtn.textContent = 'Format JSON';
    formatBtn.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(bodyTextarea.value || 'null');
        bodyTextarea.value = parsed == null ? '' : JSON.stringify(parsed, null, 2);
      } catch (e) {
        showToast(`Invalid JSON: ${e.message}`, { error: true });
      }
    });
    const exampleBtn = document.createElement('button');
    exampleBtn.type = 'button';
    exampleBtn.textContent = 'Insert schema example';
    exampleBtn.addEventListener('click', () => {
      const sample = exampleFromSchema(requestBody.schema);
      bodyTextarea.value = sample == null ? '' : JSON.stringify(sample, null, 2);
    });
    actions.append(formatBtn, exampleBtn);
    fs.append(actions);
    containerEl.append(fs);
  }

  const sendRow = document.createElement('div');
  sendRow.className = 'send-row';
  const sendBtn = document.createElement('button');
  sendBtn.type = 'button';
  sendBtn.className = 'primary';
  sendBtn.textContent = 'Send';
  const previewEl = document.createElement('div');
  previewEl.className = 'preview-url';
  sendRow.append(sendBtn, previewEl);
  containerEl.append(sendRow);

  function gather() {
    const pathParams = {};
    const queryParams = {};
    const headerParams = {};
    for (const { param, control } of paramControls) {
      const value = coerceValue(control.value, control.dataset.type);
      if (value === undefined) continue;
      if (param.in === 'path') pathParams[param.name] = value;
      else if (param.in === 'query') queryParams[param.name] = value;
      else if (param.in === 'header') headerParams[param.name] = value;
    }
    const fullPath = substitutePath(opEntry.path, pathParams);
    const baseUrl = baseInput.value || state.baseUrl || '';
    const fullUrl = joinUrl(baseUrl, fullPath);
    return { pathParams, queryParams, headerParams, fullUrl };
  }

  function updatePreview() {
    const { fullUrl, queryParams } = gather();
    let preview = fullUrl;
    try {
      const u = new URL(fullUrl);
      for (const [k, v] of Object.entries(queryParams)) {
        u.searchParams.append(k, String(v));
      }
      preview = u.toString();
    } catch {
      // base URL might be empty or invalid; show as-is
    }
    previewEl.textContent = `${opEntry.method.toUpperCase()} ${preview}`;
  }
  updatePreview();

  sendBtn.addEventListener('click', async () => {
    const { fullUrl, queryParams, headerParams } = gather();
    let bodyValue;
    if (bodyTextarea && bodyTextarea.value.trim() !== '') {
      try {
        bodyValue = JSON.parse(bodyTextarea.value);
      } catch (e) {
        showToast(`Body is not valid JSON: ${e.message}`, { error: true });
        return;
      }
    }
    const headers = { ...buildAuthHeaders(), ...headerParams };

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: opEntry.method,
          url: fullUrl,
          headers,
          query: queryParams,
          body: bodyValue,
        }),
      });
      const data = await res.json();
      setLastResponse(data);
    } catch (e) {
      setLastResponse({ networkError: true, error: e.message, durationMs: 0 });
      showToast(`Request failed: ${e.message}`, { error: true });
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send';
    }
  });
}

export function render() {
  if (!state.spec) {
    containerEl.innerHTML = '<p class="empty-hint">Select an endpoint to build a request.</p>';
    return;
  }
  const op = findOperation(state.selectedKey);
  if (!op) {
    containerEl.innerHTML = '<p class="empty-hint">Select an endpoint from the sidebar.</p>';
    return;
  }
  renderOperation(op);
}

subscribe((key) => {
  if (key === 'spec' || key === 'selected') render();
});
