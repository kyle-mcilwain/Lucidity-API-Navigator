import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import health from './routes/health.js';
import spec from './routes/spec.js';
import execute from './routes/execute.js';
import credentials from './routes/credentials.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');

const app = express();
app.use(express.json({ limit: '25mb' }));

app.use('/api/health', health);
app.use('/api/spec', spec);
app.use('/api/execute', execute);
app.use('/api/credentials', credentials);

app.use(express.static(publicDir));
app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

const port = Number(process.env.PORT) || 3000;
app.listen(port, '127.0.0.1', () => {
  console.log(`Lucidity API Navigator running at http://localhost:${port}`);
});
