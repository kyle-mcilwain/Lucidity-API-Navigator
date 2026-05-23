import './sidebar.js';
import './requestBuilder.js';
import './responseViewer.js';
import { loadLocalCredentials } from './authPanel.js';
import { loadFromUrl } from './specLoader.js';

const urlEl = document.getElementById('spec-url');

async function boot() {
  await loadLocalCredentials();
  const url = urlEl.value.trim();
  if (url) {
    await loadFromUrl(url, { silent: false });
  }
}

boot();
