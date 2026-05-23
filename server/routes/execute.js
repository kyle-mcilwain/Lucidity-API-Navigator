import { Router } from 'express';
import { proxyRequest } from '../lib/httpProxy.js';

const router = Router();

router.post('/', async (req, res) => {
  const { method, url, headers, query, body } = req.body ?? {};
  if (!method || !url) {
    return res.status(400).json({ error: 'method and url are required.' });
  }
  try {
    const result = await proxyRequest({ method, url, headers, query, body });
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
