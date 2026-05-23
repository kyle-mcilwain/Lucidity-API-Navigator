import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ ok: true, name: 'lucidity-api-navigator', node: process.version });
});

export default router;
