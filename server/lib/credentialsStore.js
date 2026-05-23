import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CONFIG_DIR = path.join(os.homedir(), '.lucidity-navigator');
const CREDS_FILE = path.join(CONFIG_DIR, 'credentials.json');

export async function readCredentials() {
  try {
    const text = await fs.readFile(CREDS_FILE, 'utf8');
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      return {
        user: typeof parsed.user === 'string' ? parsed.user : '',
        apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      };
    }
    return null;
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function writeCredentials({ user, apiKey }) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  const payload = JSON.stringify({ user: user ?? '', apiKey: apiKey ?? '' }, null, 2);
  await fs.writeFile(CREDS_FILE, payload, { mode: 0o600 });
  return { path: CREDS_FILE };
}

export function credentialsPath() {
  return CREDS_FILE;
}
