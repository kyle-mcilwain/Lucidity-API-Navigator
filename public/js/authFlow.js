import { state, setBearerToken, setAuthStatus } from './state.js';

function extractToken(body) {
  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed.length > 20 ? trimmed.replace(/^"|"$/g, '') : null;
  }
  if (!body || typeof body !== 'object') return null;
  return (
    body.token ??
    body.accessToken ??
    body.access_token ??
    body.jwt ??
    body.bearer ??
    body.id_token ??
    null
  );
}

function summarise(body) {
  if (body == null) return '(empty body)';
  if (typeof body === 'string') return body.slice(0, 200);
  try {
    return JSON.stringify(body).slice(0, 200);
  } catch {
    return String(body);
  }
}

export async function authenticate() {
  const tenantBaseUrl = state.tenantBaseUrl;
  const username = state.apiUser;
  const token = state.apiKey;
  if (!tenantBaseUrl || !username || !token) {
    setAuthStatus('skipped', 'Need tenant URL, API user, and API key to authenticate.');
    return null;
  }
  setAuthStatus('pending', `Authenticating as ${username}…`);
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantBaseUrl, username, token }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAuthStatus('failed', `Login request failed: ${data.error || res.statusText}`);
      return null;
    }
    if (data.status >= 400) {
      setAuthStatus(
        'failed',
        `${data.status} ${data.statusText || ''} from ${data.url} — ${summarise(data.body)}`,
      );
      return null;
    }
    const jwt = extractToken(data.body);
    if (!jwt) {
      setAuthStatus(
        'unknown-shape',
        `Authenticate returned ${data.status} but no recognisable token field. Body: ${summarise(data.body)}`,
      );
      return null;
    }
    setBearerToken(jwt);
    setAuthStatus('authenticated', `Authenticated as ${username} (${data.durationMs} ms).`);
    return jwt;
  } catch (e) {
    setAuthStatus('failed', `Authenticate error: ${e.message}`);
    return null;
  }
}
