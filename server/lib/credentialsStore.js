import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HOME_CONFIG_DIR = path.join(os.homedir(), '.lucidity-navigator');
const HOME_CREDS = path.join(HOME_CONFIG_DIR, 'credentials.json');
const REPO_CREDS = path.resolve(__dirname, '..', '..', 'credentials.json');

async function readFromPath(p) {
  try {
    const text = await fs.readFile(p, 'utf8');
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      return {
        user: typeof parsed.user === 'string' ? parsed.user : '',
        apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      };
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return null;
}

export async function readCredentials() {
  for (const p of [HOME_CREDS, REPO_CREDS]) {
    const creds = await readFromPath(p);
    if (creds) return { credentials: creds, path: p };
  }
  return { credentials: null, path: HOME_CREDS };
}

export async function writeCredentials({ user, apiKey }) {
  await fs.mkdir(HOME_CONFIG_DIR, { recursive: true });
  const payload = JSON.stringify({ user: user ?? '', apiKey: apiKey ?? '' }, null, 2);
  await fs.writeFile(HOME_CREDS, payload, { mode: 0o600 });
  return { path: HOME_CREDS };
}

export function credentialsPath() {
  return HOME_CREDS;
}
