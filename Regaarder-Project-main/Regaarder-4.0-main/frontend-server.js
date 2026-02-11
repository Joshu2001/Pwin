import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 4173;
const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.VITE_BACKEND_URL ||
  'https://pwin.onrender.com';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

app.get('/share/*', async (req, res) => {
  try {
    const targetUrl = `${BACKEND_URL}${req.originalUrl}`;
    const resp = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.headers['user-agent'] || 'RegaarderShareProxy'
      }
    });

    res.status(resp.status);
    resp.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'transfer-encoding') return;
      res.setHeader(key, value);
    });

    const body = Buffer.from(await resp.arrayBuffer());
    return res.send(body);
  } catch (err) {
    return res.status(502).send('Share proxy error');
  }
});

app.use(express.static(distDir));

app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Regaarder frontend server running on ${PORT}`);
});
