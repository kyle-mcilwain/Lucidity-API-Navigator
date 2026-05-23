import { Router } from 'express';
import { loadSpec } from '../lib/specLoader.js';

const router = Router();

router.post('/', async (req, res) => {
  const { url, raw } = req.body ?? {};
  if (!url && !raw) {
    return res.status(400).json({ error: 'Provide either { url } or { raw } in the request body.' });
  }
  try {
    const spec = await loadSpec({ url, raw });
    res.json({ spec });
  } catch (err) {
    res.status(400).json({ error: err.message, details: err.details ?? null });
  }
});

export default router;
