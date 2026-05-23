import './sidebar.js';
import './requestBuilder.js';
import './responseViewer.js';
import { loadLocalCredentials } from './authPanel.js';
import { authenticate } from './authFlow.js';
import { loadFromUrl } from './specLoader.js';

const urlEl = document.getElementById('spec-url');

async function boot() {
  await loadLocalCredentials();
  await authenticate();
  const url = urlEl.value.trim();
  if (url) {
    await loadFromUrl(url, { silent: false });
  }
}

boot();
