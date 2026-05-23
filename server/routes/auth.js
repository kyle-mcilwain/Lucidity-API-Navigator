import { Router } from 'express';

const router = Router();

router.post('/login', async (req, res) => {
  const { tenantBaseUrl, username, token } = req.body ?? {};
  if (!tenantBaseUrl || !username || !token) {
    return res.status(400).json({ error: 'tenantBaseUrl, username, and token are required.' });
  }
  const url = tenantBaseUrl.replace(/\/+$/, '') + '/authenticate';
  try {
    const started = performance.now();
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username, token }),
    });
    const durationMs = Math.round(performance.now() - started);
    const text = await upstream.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
    res.json({
      status: upstream.status,
      statusText: upstream.statusText,
      body: body ?? text,
      url,
      durationMs,
    });
  } catch (err) {
    res.status(502).json({ error: err.message, url });
  }
});

export default router;
