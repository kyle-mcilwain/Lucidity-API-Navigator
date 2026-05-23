function escape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderValue(value) {
  if (value === null) return `<span class="json-null">null</span>`;
  const t = typeof value;
  if (t === 'string') return `<span class="json-string">"${escape(value)}"</span>`;
  if (t === 'number') return `<span class="json-number">${value}</span>`;
  if (t === 'boolean') return `<span class="json-bool">${value}</span>`;
  if (Array.isArray(value)) return renderArray(value);
  if (t === 'object') return renderObject(value);
  return escape(String(value));
}

function renderArray(arr) {
  if (arr.length === 0) return `<span class="json-punct">[]</span>`;
  const items = arr
    .map(
      (v) =>
        `<div style="margin-left:1em">${renderValue(v)}<span class="json-punct">,</span></div>`,
    )
    .join('');
  return (
    `<details open><summary><span class="json-punct">[</span><span style="color:#94a3b8"> ${arr.length} items </span><span class="json-punct">]</span></summary>` +
    items +
    `</details>`
  );
}

function renderObject(obj) {
  const keys = Object.keys(obj);
  if (keys.length === 0) return `<span class="json-punct">{}</span>`;
  const rows = keys
    .map(
      (k) =>
        `<div style="margin-left:1em"><span class="json-key">"${escape(k)}"</span><span class="json-punct">: </span>${renderValue(obj[k])}<span class="json-punct">,</span></div>`,
    )
    .join('');
  return (
    `<details open><summary><span class="json-punct">{</span><span style="color:#94a3b8"> ${keys.length} keys </span><span class="json-punct">}</span></summary>` +
    rows +
    `</details>`
  );
}

export function renderJsonTree(value) {
  const root = document.createElement('div');
  root.className = 'json-tree';
  root.innerHTML = renderValue(value);
  return root;
}
