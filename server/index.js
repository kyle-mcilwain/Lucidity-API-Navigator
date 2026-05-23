import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import health from './routes/health.js';
import spec from './routes/spec.js';
import execute from './routes/execute.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');

const app = express();
app.use(express.json({ limit: '25mb' }));

app.use('/api/health', health);
app.use('/api/spec', spec);
app.use('/api/execute', execute);

app.use(express.static(publicDir));
app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Lucidity API Navigator running at http://localhost:${port}`);
});
