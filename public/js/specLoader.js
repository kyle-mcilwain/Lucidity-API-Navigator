import { setSpec } from './state.js';
import { showToast } from './toast.js';

const formEl = document.getElementById('spec-form');
const urlEl = document.getElementById('spec-url');
const fileEl = document.getElementById('spec-file');
const loadBtn = document.getElementById('load-url-btn');

async function loadFromUrl(url) {
  loadBtn.disabled = true;
  loadBtn.textContent = 'Loading…';
  try {
    const res = await fetch('/api/spec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(`Spec load failed: ${data.error || res.statusText}`, { error: true, duration: 8000 });
      return;
    }
    setSpec(data.spec);
    showToast(`Loaded ${data.spec.info?.title || 'spec'} (${Object.keys(data.spec.paths || {}).length} paths)`);
  } catch (e) {
    showToast(`Spec load failed: ${e.message}`, { error: true });
  } finally {
    loadBtn.disabled = false;
    loadBtn.textContent = 'Load URL';
  }
}

async function loadFromRaw(raw) {
  try {
    const res = await fetch('/api/spec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(`Spec parse failed: ${data.error || res.statusText}`, { error: true, duration: 8000 });
      return;
    }
    setSpec(data.spec);
    showToast(`Loaded ${data.spec.info?.title || 'spec'}`);
  } catch (e) {
    showToast(`Spec parse failed: ${e.message}`, { error: true });
  }
}

formEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const url = urlEl.value.trim();
  if (!url) {
    showToast('Enter a spec URL.', { error: true });
    return;
  }
  loadFromUrl(url);
});

fileEl.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  await loadFromRaw(text);
  fileEl.value = '';
});
