export const state = {
  spec: null,
  baseUrl: '',
  selectedKey: null,
  bearerToken: '',
  extraHeaders: [],
  lastResponse: null,
};

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify(key, value) {
  for (const fn of listeners) fn(key, value);
}

export function setSpec(spec) {
  state.spec = spec;
  state.selectedKey = null;
  const firstServer = spec?.servers?.[0]?.url ?? '';
  state.baseUrl = firstServer;
  notify('spec', spec);
}

export function setSelected(key) {
  state.selectedKey = key;
  notify('selected', key);
}

export function setBaseUrl(url) {
  state.baseUrl = url;
  notify('baseUrl', url);
}

export function setBearerToken(token) {
  state.bearerToken = token;
  notify('bearerToken', token);
}

export function setExtraHeaders(rows) {
  state.extraHeaders = rows;
  notify('extraHeaders', rows);
}

export function setLastResponse(response) {
  state.lastResponse = response;
  notify('lastResponse', response);
}
