import { Router } from 'express';
import { readCredentials, writeCredentials, credentialsPath } from '../lib/credentialsStore.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const creds = await readCredentials();
    res.json({ credentials: creds, path: credentialsPath() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { user, apiKey } = req.body ?? {};
  try {
    const { path } = await writeCredentials({ user, apiKey });
    res.json({ ok: true, path });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
