/* eslint-env node */
/* eslint-disable no-empty, no-unused-vars */
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const crypto = require('crypto');
let nodemailer;
try { nodemailer = require('nodemailer'); } catch (e) { console.warn('nodemailer not installed – forgot-password emails disabled'); }

// ── Persistent data directory ──
// On Railway set DATA_DIR=/data and mount a volume there so JSON files + uploads
// survive redeploys. Locally this falls back to the backend dir itself.
const PERSIST_DIR = process.env.DATA_DIR || __dirname;
if (PERSIST_DIR !== __dirname && !fs.existsSync(PERSIST_DIR)) {
  fs.mkdirSync(PERSIST_DIR, { recursive: true });
}

const app = express();
app.set('trust proxy', true); // Railway / reverse-proxy: trust X-Forwarded-Proto
const PORT = process.env.PORT || 8080;
const WEB_URL = process.env.WEB_URL || 'https://regaarder.com';
const PUBLIC_BACKEND_URL =
  process.env.PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  process.env.VITE_BACKEND_URL ||
  'https://pwin-copy-production.up.railway.app';

app.use(cors());
app.use(bodyParser.json());

const isRewritableHost = (hostname) => {
  if (!hostname) return false;
  const h = hostname.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === 'pwin.onrender.com' || h === 'regaarder-pwin.onrender.com' || h === 'pwin-copy-production.up.railway.app';
};

const normalizeUrlString = (value, baseUrl) => {
  if (typeof value !== 'string') return value;
  if (!/^https?:\/\//i.test(value)) return value;
  try {
    const url = new URL(value);
    if (!isRewritableHost(url.hostname)) return value;
    const base = new URL(baseUrl);
    url.protocol = base.protocol;
    url.host = base.host;
    return url.toString();
  } catch {
    return value;
  }
};

const rewriteUrlsDeep = (input, baseUrl) => {
  if (!input || !baseUrl) return input;
  if (typeof input === 'string') return normalizeUrlString(input, baseUrl);
  if (Array.isArray(input)) return input.map((item) => rewriteUrlsDeep(item, baseUrl));
  if (typeof input === 'object') {
    const out = {};
    Object.keys(input).forEach((key) => {
      out[key] = rewriteUrlsDeep(input[key], baseUrl);
    });
    return out;
  }
  return input;
};

app.use((req, res, next) => {
  const baseUrl = PUBLIC_BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  const originalJson = res.json.bind(res);
  res.json = (payload) => originalJson(rewriteUrlsDeep(payload, baseUrl));
  next();
});

const escapeHtml = (value) => {
  try {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  } catch { return ''; }
};

const buildShareHtml = ({ title, description, image, url, redirectUrl, type = 'website' }, req) => {
  const safeTitle = escapeHtml(title || 'Regaarder');
  const safeDesc = escapeHtml(description || 'Watch on Regaarder');
  const safeUrl = escapeHtml(url || WEB_URL);
  const safeRedirect = escapeHtml(redirectUrl || WEB_URL);
  // Always show an image — use backend's own origin so WhatsApp/social crawlers can reach it
  const backendOrigin = PUBLIC_BACKEND_URL || (req ? `${req.protocol}://${req.get('host')}` : WEB_URL);
  const safeImage = escapeHtml(image || `${backendOrigin}/regaarder-og-banner.png`);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${safeUrl}" />
    <meta property="og:site_name" content="Regaarder" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${safeImage}" />
    <meta http-equiv="refresh" content="0; url=${safeRedirect}" />
    <link rel="icon" href="${WEB_URL}/favicon.ico" />
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0b0b; color: #fff; margin: 0; padding: 0;">
    <main style="max-width: 680px; margin: 40px auto; padding: 20px; text-align: center;">
      <img src="${safeImage}" alt="${safeTitle}" style="max-width: 100%; border-radius: 12px; margin-bottom: 16px;" />
      <h1 style="font-size: 22px; margin: 0 0 12px;">${safeTitle}</h1>
      <p style="font-size: 14px; opacity: 0.8;">${safeDesc}</p>
      <p style="font-size: 12px; opacity: 0.7; margin-top: 16px;">Opening Regaarder… If nothing happens, <a href="${safeRedirect}" style="color: #CB8A00;">tap here</a>.</p>
    </main>
  </body>
</html>`;
};

// DEBUG LOGGER
app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        // console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

const DATA_FILE = path.join(PERSIST_DIR, 'users.json');
const SPONSORS_FILE = path.join(PERSIST_DIR, 'sponsors.json');
const REQUESTS_FILE = path.join(PERSIST_DIR, 'requests.json');
const VIDEOS_FILE = path.join(PERSIST_DIR, 'videos.json');
const CATEGORIES_FILE = path.join(PERSIST_DIR, 'categories.json');
const ONBOARDING_FILE = path.join(PERSIST_DIR, 'onboarding.json');
const multer = require('multer');

// simple disk storage for demo: store uploads under ./uploads
const UPLOAD_DIR = path.join(PERSIST_DIR, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const id = `intro-${Date.now()}-${Math.round(Math.random()*1e6)}${path.extname(file.originalname)}`;
    cb(null, id);
  }
});
// Server-side upload limits and MIME whitelist
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB
// Allow common images, videos and document types (pdf, docx, pptx, txt)
const ALLOWED_MIMETYPES = new Set([
  // images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/jfif',
  'image/heic',
  'image/heif',
  'image/bmp',
  // videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  // documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/octet-stream' // allow generic streams for certain browsers
]);

function fileFilter(req, file, cb) {
  // Defensive logging to help debug client-side mime/extension mismatches
  const orig = file && file.originalname ? file.originalname : '<unknown name>';
  const mime = file && file.mimetype ? file.mimetype : '<no-mime>';
  console.debug(`fileFilter: originalname=${orig} mimetype=${mime}`);

  if (!file) return cb(new Error('Invalid file'));

  // Accept any image/* mime type (covers varied image mime labels)
  if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);

  // Accept explicit allowed mimetypes
  if (file.mimetype && ALLOWED_MIMETYPES.has(file.mimetype)) return cb(null, true);

  // Fallback to extension check for clients that don't provide accurate mimetypes
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.mp4', '.webm', '.mov', '.mkv', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.zip'];
  const extraExts = ['.jfif', '.heic', '.heif', '.bmp'];
  allowedExts.push(...extraExts);
  if (ext && allowedExts.includes(ext)) return cb(null, true);

  // As a last resort, if there is no mimetype but the filename has an extension, accept it
  if ((!file.mimetype || file.mimetype === '') && ext) {
    console.warn('fileFilter: accepting file with missing mimetype but valid extension', orig, ext);
    return cb(null, true);
  }

  console.warn('fileFilter: rejecting file', { originalname: orig, mimetype: mime, ext });
  return cb(new Error('Unsupported file type'));
}

const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD_BYTES }, fileFilter });

function normalizeUserFields(u) {
  if (!u || typeof u !== 'object') return u;
  return {
    ...u,
    isCreator: u.isCreator === true || u.is_creator === true || false,
    referralCode: u.referralCode || u.referral_code || null,
    createdAt: u.createdAt || u.created_at || null,
    passwordChangedAt: u.passwordChangedAt || u.password_changed_at || null,
    creatorSince: u.creatorSince || u.creator_since || null,
    referralCount: u.referralCount || u.referral_count || 0,
    referrerId: u.referrerId || u.referrer_id || null,
  };
}

function readUsers() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    let raw = fs.readFileSync(DATA_FILE, 'utf8');
    // Strip BOM if present
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    // Remove control characters (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F-0x9F) that break JSON.parse
    // Keep \t (0x09), \n (0x0A), \r (0x0D) which are valid in JSON whitespace
    raw = Array.from(raw)
      .filter((ch) => {
        const code = ch.charCodeAt(0);
        if (code === 0x09 || code === 0x0A || code === 0x0D) return true;
        if ((code >= 0x00 && code <= 0x08) || code === 0x0B || code === 0x0C) return false;
        if (code >= 0x0E && code <= 0x1F) return false;
        if (code >= 0x7F && code <= 0x9F) return false;
        return true;
      })
      .join('');
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) {
      console.error('readUsers: DATA_FILE is not an array, got', typeof parsed);
      return [];
    }
    // Normalize snake_case fields to camelCase for consistency
    return parsed.map(normalizeUserFields);
  } catch (err) {
    console.error('readUsers error', err);
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function readSponsors() {
  try {
    if (!fs.existsSync(SPONSORS_FILE)) return [];
    const raw = fs.readFileSync(SPONSORS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('readSponsors error', err);
    return [];
  }
}

function writeSponsors(sponsors) {
  fs.writeFileSync(SPONSORS_FILE, JSON.stringify(sponsors, null, 2), 'utf8');
}

function updateStreak(userId) {
  if (!userId || userId === 'anonymous') return;
  try {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return;

    const user = users[idx];
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    let streak = user.streak || 0;
    const lastDate = user.lastStreakDate || null;

    if (lastDate === today) {
      return; // Already counted today
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate === yesterdayStr) {
      streak += 1;
    } else {
      streak = 1; // Reset if missed a day or new
    }

    users[idx] = { ...user, streak, lastStreakDate: today };
    writeUsers(users);
    console.log(`Updated streak for user ${userId}: ${streak}`);
  } catch (err) {
    console.error('updateStreak error', err);
  }
}

function readRequests() {
  try {
    if (!fs.existsSync(REQUESTS_FILE)) return [];
    const raw = fs.readFileSync(REQUESTS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('readRequests error', err);
    return [];
  }
}

function writeRequests(requests) {
  try {
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf8');
  } catch (err) {
    console.error('writeRequests error', err);
  }
}

// Comments persistence
const COMMENTS_FILE = path.join(PERSIST_DIR, 'comments.json');
function readComments() {
  try {
    if (!fs.existsSync(COMMENTS_FILE)) return [];
    const raw = fs.readFileSync(COMMENTS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) { console.error('readComments error', err); return []; }
}
function writeComments(comments) {
  try { fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf8'); } catch (err) { console.error('writeComments error', err); }
}

function readVideos() {
  try {
    if (!fs.existsSync(VIDEOS_FILE)) return [];
    const raw = fs.readFileSync(VIDEOS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('readVideos error', err);
    return [];
  }
}

function writeVideos(videos) {
  try {
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2), 'utf8');
  } catch (err) {
    console.error('writeVideos error', err);
  }
}

const PRODUCTS_FILE = path.join(PERSIST_DIR, 'products.json');
function readProducts() {
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) return [];
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('readProducts error', err);
    return [];
  }
}

function writeProducts(products) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  } catch (err) {
    console.error('writeProducts error', err);
  }
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Regaarder backend running' });
});

// ── Startup data cleanup: deduplicate requests.json ──
// Remove duplicate IDs keeping the newest (by updatedAt/createdAt) version.
(function deduplicateRequests() {
  try {
    const requests = readRequests();
    const seen = new Map();
    for (const r of requests) {
      if (!r || !r.id) continue;
      if (seen.has(r.id)) {
        const existing = seen.get(r.id);
        const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        const newTime = new Date(r.updatedAt || r.createdAt || 0).getTime();
        if (newTime > existingTime) seen.set(r.id, r);
      } else {
        seen.set(r.id, r);
      }
    }
    const deduped = Array.from(seen.values());
    if (deduped.length < requests.length) {
      console.log(`[STARTUP] Deduplicated requests.json: ${requests.length} → ${deduped.length} (removed ${requests.length - deduped.length} duplicates)`);
      writeRequests(deduped);
    } else {
      console.log(`[STARTUP] requests.json clean: ${requests.length} entries, no duplicates`);
    }
  } catch (e) {
    console.error('[STARTUP] deduplicateRequests error', e);
  }
})();

// Also deduplicate videos.json at startup
(function deduplicateVideos() {
  try {
    const videos = readVideos();
    const seen = new Map();
    for (const v of videos) {
      if (!v || !v.id) continue;
      if (seen.has(v.id)) {
        const existing = seen.get(v.id);
        const existingTime = new Date(existing.updatedAt || existing.createdAt || existing.publishedAt || 0).getTime();
        const newTime = new Date(v.updatedAt || v.createdAt || v.publishedAt || 0).getTime();
        if (newTime > existingTime) seen.set(v.id, v);
      } else {
        seen.set(v.id, v);
      }
    }
    const deduped = Array.from(seen.values());
    if (deduped.length < videos.length) {
      console.log(`[STARTUP] Deduplicated videos.json: ${videos.length} → ${deduped.length} (removed ${videos.length - deduped.length} duplicates)`);
      writeVideos(deduped);
    }
  } catch (e) {
    console.error('[STARTUP] deduplicateVideos error', e);
  }
})();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', version: '2.0.0' });
});

// Keep /healthz for backwards compatibility (Render health checks)
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', version: '2.0.0' });
});

// Version endpoint to verify deployment
app.get('/version', (req, res) => {
  res.json({ version: '2.0.0', deployed: new Date().toISOString(), features: ['creators-endpoint', 'normalize-fields', 'user-id-lookup'] });
});

// Get all marketplace products
app.get('/products', (req, res) => {
  try {
    const products = readProducts();
    return res.json({ success: true, products });
  } catch (err) {
    console.error('get products error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Bottom ad templates persistence
const BOTTOM_TEMPLATES_FILE = path.join(PERSIST_DIR, 'bottom_ad_templates.json');
function readBottomTemplates() {
  try {
    if (!fs.existsSync(BOTTOM_TEMPLATES_FILE)) return [];
    const raw = fs.readFileSync(BOTTOM_TEMPLATES_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) { console.error('readBottomTemplates error', err); return []; }
}
function writeBottomTemplates(list) {
  try { fs.writeFileSync(BOTTOM_TEMPLATES_FILE, JSON.stringify(list, null, 2), 'utf8'); } catch (err) { console.error('writeBottomTemplates error', err); }
}

app.get('/templates/bottom', (req, res) => {
  try {
    const templates = readBottomTemplates();
    return res.json({ success: true, templates });
  } catch (err) {
    console.error('get bottom templates error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/templates/bottom', (req, res) => {
  try {
    const { name, avatar, text, link, assets } = req.body || {};
    if (!name || !text) return res.status(400).json({ error: 'Missing fields' });
    const list = readBottomTemplates();
    const id = Date.now();
    const tpl = { id, name, avatar: avatar || '', text: text || '', link: link || '', assets: assets || [] };
    list.unshift(tpl);
    writeBottomTemplates(list);
    return res.json({ success: true, template: tpl });
  } catch (err) {
    console.error('post bottom template error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.put('/templates/bottom/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const list = readBottomTemplates();
    const idx = list.findIndex(t => Number(t.id) === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const updated = { ...list[idx], ...body, id: list[idx].id };
    list[idx] = updated;
    writeBottomTemplates(list);
    return res.json({ success: true, template: updated });
  } catch (err) {
    console.error('put bottom template error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/templates/bottom/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const list = readBottomTemplates();
    const newList = list.filter(t => Number(t.id) !== id);
    writeBottomTemplates(newList);
    return res.json({ success: true });
  } catch (err) {
    console.error('delete bottom template error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add a new product to marketplace
app.post('/products', authMiddleware, (req, res) => {
  try {
    const body = req.body || {};
    const products = readProducts();
    const newProduct = {
      ...body,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      creatorId: req.user.id,
      creatorName: req.user.name || 'Anonymous'
    };
    products.unshift(newProduct);
    writeProducts(products);
    return res.json({ success: true, product: newProduct });
  } catch (err) {
    console.error('add product error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/signup', async (req, res) => {
  const { email, password, name, referralCode } = req.body || {};
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing email, password or name' });
  const emailLower = String(email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) return res.status(400).json({ error: 'Invalid email format' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const users = readUsers();
  if (users.find(u => u.email === emailLower)) return res.status(409).json({ error: 'Account already exists for this email' });

  // Validate referral code if provided
  let referrerUser = null;
  if (referralCode && referralCode.trim()) {
    const trimmedCode = referralCode.trim().toUpperCase();
    referrerUser = users.find(u => u.referralCode && u.referralCode.toUpperCase() === trimmedCode);
    if (!referrerUser) return res.status(400).json({ error: 'Invalid referral code' });
  }

  const hash = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(16).toString('hex');
  
  // Generate unique referral code for new user (8 characters alphanumeric)
  const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
  
  const user = { 
    id: `user-${Date.now()}`, 
    email: emailLower, 
    name, 
    passwordHash: hash, 
    referralCode: newReferralCode,
    referrerId: referrerUser ? referrerUser.id : null,
    referralCount: 0,
    createdAt: new Date().toISOString(), 
    passwordChangedAt: new Date().toISOString(), 
    token 
  };
  users.push(user);
  
  // If user came from a referral, increment referrer's count
  if (referrerUser) {
    const referrerIdx = users.findIndex(u => u.id === referrerUser.id);
    if (referrerIdx !== -1) {
      users[referrerIdx].referralCount = (users[referrerIdx].referralCount || 0) + 1;
    }
  }
  
  writeUsers(users);

  const { passwordHash: _ph, ...publicUser } = user;
  res.json({ user: publicUser, token });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const emailLower = String(email).toLowerCase();

  const users = readUsers();
  const user = users.find(u => u.email === emailLower);
  if (!user) return res.status(404).json({ error: 'No account found for this email' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Incorrect password' });

  // create/rotate token for the session
  const token = crypto.randomBytes(16).toString('hex');
  const updated = { ...user, token };
  const idx = users.findIndex(u => u.email === emailLower);
  if (idx !== -1) users[idx] = updated;
  writeUsers(users);

  const { passwordHash: _ph2, ...publicUser } = updated;
  res.json({ user: publicUser, token });
});

// Simple auth middleware that validates Bearer token against users.json
function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7).trim();
    const users = readUsers();
    const user = users.find(u => u.token === token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Playback persistence helpers (simple file-backed store)
const PLAYBACK_FILE = path.join(PERSIST_DIR, 'playback.json');
function readPlayback() {
  try {
    if (!fs.existsSync(PLAYBACK_FILE)) return {};
    const raw = fs.readFileSync(PLAYBACK_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) { console.error('readPlayback error', err); return {}; }
}
function writePlayback(data) {
  try { fs.writeFileSync(PLAYBACK_FILE, JSON.stringify(data, null, 2), 'utf8'); } catch (err) { console.error('writePlayback error', err); }
}

// Save playback position (authenticated preferred, anonymous fallback)
app.post('/api/playback', (req, res) => {
  try {
    const body = req.body || {};
    const { videoId, currentTime } = body;
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });

    const playback = readPlayback();
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // try to resolve user
      const token = req.headers.authorization.slice(7).trim();
      const users = readUsers();
      const user = users.find(u => u.token === token);
      if (user) {
        playback[user.id] = { videoId, currentTime: Number(currentTime) || 0, updatedAt: new Date().toISOString() };
        writePlayback(playback);
        return res.json({ ok: true });
      }
    }

    // anonymous: store under special key using a client-provided anonId if present, else 'anonymous'
    const anonKey = body.anonId || 'anonymous';
    playback[anonKey] = { videoId, currentTime: Number(currentTime) || 0, updatedAt: new Date().toISOString() };
    writePlayback(playback);
    return res.json({ ok: true });
  } catch (err) {
    console.error('playback post error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get playback position for current user/anon
app.get('/api/playback', (req, res) => {
  try {
    const playback = readPlayback();
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.slice(7).trim();
      const users = readUsers();
      const user = users.find(u => u.token === token);
      if (user && playback[user.id]) return res.json(playback[user.id]);
      return res.json({});
    }
    const anonKey = req.query.anonId || 'anonymous';
    return res.json(playback[anonKey] || {});
  } catch (err) {
    console.error('playback get error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Claim endpoint: requires authentication
app.post('/claim', authMiddleware, (req, res) => {
  const { requestId } = req.body || {};
  if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
  
  try {
    const requests = readRequests();
    const request = requests.find(r => r.id === requestId);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.claimed) {
      return res.status(400).json({ error: 'Request already claimed', claimedBy: request.claimedBy });
    }

    // Check daily claim limit for paid requests (amount > 0 or funding > 0)
    const requestAmount = Number(request.amount) || Number(request.funding) || 0;
    if (requestAmount > 0) {
      const users = readUsers();
      const user = users.find(u => u.id === req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Determine user's creator plan (default to Starter Creator if not set)
      const creatorPlan = user.creatorPlan || 'starter'; // 'starter' or 'pro'
      
      // Plan limits based on creator plan
      const planLimits = {
        'starter': {
          dailyClaimLimit: 3,           // Max 3 paid requests per day
          dailyEarningsCap: 175,        // Max $175 per day (midpoint of $150-$200)
          requestValueLimit: 150,       // Cannot claim requests > $150
          name: 'Starter Creator'
        },
        'pro': {
          dailyClaimLimit: 15,          // Max 15 paid requests per day
          dailyEarningsCap: null,       // No daily value cap
          requestValueLimit: null,      // No request value limit
          name: 'Pro Creator'
        }
      };

      const limits = planLimits[creatorPlan] || planLimits['starter'];

      // Check if request exceeds the value limit for their plan
      if (limits.requestValueLimit && requestAmount > limits.requestValueLimit) {
        return res.status(400).json({ 
          error: 'Request value exceeds plan limit',
          requestValueLimitExceeded: true,
          valueLimit: limits.requestValueLimit,
          requestValue: requestAmount,
          creatorPlan: creatorPlan,
          planName: limits.name
        });
      }

      // Get today's date in UTC
      const today = new Date().toISOString().split('T')[0];
      const lastClaimReset = user.lastClaimReset || null;
      
      // Reset count if it's a new day
      let dailyClaimCount = user.dailyClaimCount || 0;
      let dailyClaimEarnings = user.dailyClaimEarnings || 0;
      
      if (lastClaimReset !== today) {
        dailyClaimCount = 0;
        dailyClaimEarnings = 0;
        user.lastClaimReset = today;
      }

      // Check count limit
      if (dailyClaimCount >= limits.dailyClaimLimit) {
        return res.status(429).json({ 
          error: 'Daily claim limit reached',
          dailyClaimLimitReached: true,
          limitType: 'count',
          dailyLimit: limits.dailyClaimLimit,
          dailyClaims: dailyClaimCount,
          dailyEarningsCap: limits.dailyEarningsCap,
          dailyEarnings: dailyClaimEarnings,
          creatorPlan: creatorPlan,
          planName: limits.name
        });
      }

      // Check earnings cap (if applicable for this plan)
      if (limits.dailyEarningsCap) {
        const newTotalEarnings = dailyClaimEarnings + requestAmount;
        if (newTotalEarnings > limits.dailyEarningsCap) {
          return res.status(429).json({ 
            error: 'Daily earnings cap exceeded',
            dailyClaimLimitReached: true,
            limitType: 'earnings',
            dailyLimit: limits.dailyClaimLimit,
            dailyClaims: dailyClaimCount,
            dailyEarningsCap: limits.dailyEarningsCap,
            dailyEarnings: dailyClaimEarnings,
            requestAmount: requestAmount,
            wouldExceedBy: newTotalEarnings - limits.dailyEarningsCap,
            creatorPlan: creatorPlan,
            planName: limits.name
          });
        }
      }

      // Increment the count and earnings
      user.dailyClaimCount = dailyClaimCount + 1;
      user.dailyClaimEarnings = dailyClaimEarnings + requestAmount;
      user.lastClaimReset = today;
      writeUsers(users);
    }
    
    // Update request with claim info
    request.claimed = true;
    request.claimedBy = {
      id: req.user.id,
      name: req.user.name || req.user.email
    };
    request.claimedAt = new Date().toISOString();
    
    writeRequests(requests);
    
    return res.json({ 
      success: true, 
      requestId, 
      claimedBy: request.claimedBy,
      claimedAt: request.claimedAt
    });
  } catch (err) {
    console.error('claim error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update creator plan (subscription)
app.post('/creator-plan/upgrade', authMiddleware, (req, res) => {
  const { plan } = req.body || {};
  
  if (!plan || !['starter', 'pro'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan. Must be "starter" or "pro"' });
  }

  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update creator plan
    user.creatorPlan = plan;
    user.creatorPlanUpgradedAt = new Date().toISOString();

    writeUsers(users);

    return res.json({ 
      success: true, 
      message: `Successfully upgraded to ${plan} creator plan`,
      creatorPlan: plan,
      creatorPlanUpgradedAt: user.creatorPlanUpgradedAt
    });
  } catch (err) {
    console.error('creator-plan upgrade error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update user subscription plan (for user/consumer plans: starter, pro)
app.post('/subscription/upgrade', authMiddleware, (req, res) => {
  const { plan } = req.body || {};
  
  if (!plan || !['starter', 'pro'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan. Must be "starter" or "pro"' });
  }

  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user plan
    user.userPlan = plan;
    user.userPlanUpgradedAt = new Date().toISOString();

    writeUsers(users);

    return res.json({ 
      success: true, 
      message: `Successfully upgraded to ${plan} plan`,
      userPlan: plan,
      userPlanUpgradedAt: user.userPlanUpgradedAt
    });
  } catch (err) {
    console.error('subscription upgrade error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get creator plan and limits for current user
app.get('/creator-plan', authMiddleware, (req, res) => {
  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine user's creator plan (default to Starter Creator if not set)
    const creatorPlan = user.creatorPlan || 'starter';
    
    // Plan limits based on creator plan
    const planLimits = {
      'starter': {
        dailyClaimLimit: 3,
        dailyEarningsCap: 175,
        requestValueLimit: 150,
        name: 'Starter Creator',
        price: '$0/month'
      },
      'pro': {
        dailyClaimLimit: 15,
        dailyEarningsCap: null,
        requestValueLimit: null,
        name: 'Pro Creator',
        price: '$14.99/month'
      }
    };

    const limits = planLimits[creatorPlan] || planLimits['starter'];
    
    // Get today's date in UTC
    const today = new Date().toISOString().split('T')[0];
    const lastClaimReset = user.lastClaimReset || null;
    
    // Reset count if it's a new day
    let dailyClaimCount = user.dailyClaimCount || 0;
    let dailyClaimEarnings = user.dailyClaimEarnings || 0;
    
    const isNewDay = lastClaimReset !== today;
    if (isNewDay) {
      dailyClaimCount = 0;
      dailyClaimEarnings = 0;
    }

    return res.json({
      creatorPlan: creatorPlan,
      planName: limits.name,
      planPrice: limits.price,
      limits: {
        dailyClaimLimit: limits.dailyClaimLimit,
        dailyEarningsCap: limits.dailyEarningsCap,
        requestValueLimit: limits.requestValueLimit
      },
      today: {
        claimsRemaining: Math.max(0, limits.dailyClaimLimit - dailyClaimCount),
        dailyClaimCount: dailyClaimCount,
        dailyEarnings: dailyClaimEarnings,
        earningsRemaining: limits.dailyEarningsCap ? Math.max(0, limits.dailyEarningsCap - dailyClaimEarnings) : null
      }
    });
  } catch (err) {
    console.error('creator-plan error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Create sponsor profile (protected). Links sponsor to current user (1:Many)
app.post('/sponsors', authMiddleware, (req, res) => {
  try {
    const body = req.body || {};
    const { name, brief, assets } = body;
    if (!name) return res.status(400).json({ error: 'Missing sponsor name' });

    const sponsors = readSponsors();
    const id = `sponsor-${Date.now()}`;
    const sponsor = {
      id,
      ownerId: req.user.id,
      name,
      brief: brief || '',
      assets: assets || {},
      createdAt: new Date().toISOString()
    };
    sponsors.push(sponsor);
    writeSponsors(sponsors);

    return res.json({ success: true, sponsor });
  } catch (err) {
    console.error('create sponsor error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get sponsors for current authenticated user
app.get('/sponsors/me', authMiddleware, (req, res) => {
  try {
    const sponsors = readSponsors().filter(s => s.ownerId === req.user.id);
    return res.json({ sponsors });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Advertiser dashboard endpoint: only owner can access their dashboard data
app.get('/advertiser/dashboard', authMiddleware, (req, res) => {
  try {
    const sponsors = readSponsors().filter(s => s.ownerId === req.user.id);
    // For demo purposes, also include recent campaigns from local file if present
    let campaigns = [];
    const campaignsFile = path.join(PERSIST_DIR, 'advertiser_campaigns.json');
    if (fs.existsSync(campaignsFile)) {
      try { campaigns = JSON.parse(fs.readFileSync(campaignsFile, 'utf8') || '[]').filter(c => c.ownerId === req.user.id); } catch (e) { campaigns = []; }
    }
    return res.json({ sponsors, campaigns });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get a sponsor by id and ensure only owner can access
app.get('/sponsors/:id', authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const sponsors = readSponsors();
    const s = sponsors.find(x => x.id === id);
    if (!s) return res.status(404).json({ error: 'Sponsor not found' });
    if (s.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    return res.json({ sponsor: s });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Bookmark endpoint: requires authentication
app.post('/bookmark', authMiddleware, (req, res) => {
  try {
    const { requestId, action, title } = req.body || {};
    console.log('POST /bookmark - userId:', req.user.id, 'requestId:', requestId, 'action:', action);
    if (!requestId || !action) return res.status(400).json({ error: 'Missing requestId or action' });
    const all = readBookmarks();
    // add or remove request bookmark for current user
    if (action === 'add') {
      const exists = (all.requests || []).some(b => String(b.userId || 'anonymous') === String(req.user.id) && String(b.requestId) === String(requestId));
      if (!exists) {
        const b = { id: `req_${Date.now()}`, userId: req.user.id, requestId, title: title || '', createdAt: new Date().toISOString() };
        console.log('Saving bookmark:', b);
        all.requests.unshift(b);
        if (all.requests.length > 1000) all.requests.splice(1000);
        writeBookmarks(all);
      } else {
        console.log('Bookmark already exists');
      }
    } else if (action === 'remove') {
      all.requests = (all.requests || []).filter(b => !(String(b.userId || 'anonymous') === String(req.user.id) && String(b.requestId) === String(requestId)));
      writeBookmarks(all);
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
    return res.json({ success: true, requestId, action });
  } catch (err) {
    console.error('bookmark error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add request bookmark (auth optional; uses token if present, else anonymous)
app.post('/bookmarks/requests', (req, res) => {
  try {
    const userId = getUserIdOrAnon(req);
    const { requestId, title } = req.body || {};
    if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
    const all = readBookmarks();
    const exists = (all.requests || []).some(b => String(b.userId || 'anonymous') === String(userId) && String(b.requestId) === String(requestId));
    if (!exists) {
      const b = { id: `req_${Date.now()}`, userId, requestId, title: title || '', createdAt: new Date().toISOString() };
      all.requests.unshift(b);
      if (all.requests.length > 1000) all.requests.splice(1000);
      writeBookmarks(all);
    }
    return res.json({ success: true, requestId, action: 'add', userId });
  } catch (err) { console.error('POST /bookmarks/requests error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Remove request bookmark (auth optional; uses token if present, else anonymous)
app.delete('/bookmarks/requests', (req, res) => {
  try {
    const userId = getUserIdOrAnon(req);
    const { requestId } = req.body || {};
    if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
    const all = readBookmarks();
    const before = (all.requests || []).length;
    all.requests = (all.requests || []).filter(b => !(String(b.userId || 'anonymous') === String(userId) && String(b.requestId) === String(requestId)));
    writeBookmarks(all);
    return res.json({ success: true, removed: before - all.requests.length, requestId, userId });
  } catch (err) { console.error('DELETE /bookmarks/requests error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Suggestion endpoint: requires authentication (persisted for notifications)
    app.post('/suggestion', authMiddleware, (req, res) => {
      try {
        const { requestId, text, targetCreatorId, targetCreatorHandle, videoUrl, videoTitle, type, parentId } = req.body || {};
        if (!text) return res.status(400).json({ error: 'Missing text' });
    
        // Resolve target creator id: prefer explicit, else derive from requestId or handle/name
        let toId = targetCreatorId || null;
        try {
          if (!toId && requestId) {
            const reqs = readRequests();
            const r = reqs.find(x => String(x.id) === String(requestId));
            if (r && r.creator && r.creator.id) {
                // If the current user is the creator, send to the requester (if known)
                if (r.creator.id === req.user.id && r.createdBy) {
                    toId = r.createdBy;
                } else {
                    toId = r.creator.id;
                }
            }
          }
        } catch {}
        
        // If type is reply, we might want to ensure we reply to the 'from' of the parent or target specific user
        if (type === 'reply' && targetCreatorId) {
            toId = targetCreatorId;
        }
    
        try {
          if (!toId && targetCreatorHandle) {
            const users = readUsers();
            const h = String(targetCreatorHandle).trim().toLowerCase();
            const u = users.find(x => (x.handle && String(x.handle).toLowerCase() === h)
              || (x.tag && String(x.tag).toLowerCase() === h)
              || (x.name && String(x.name).toLowerCase() === h)
              || (x.email && String(x.email).split('@')[0].toLowerCase() === h));
            if (u) toId = u.id;
          }
        } catch {}
    
        const suggestion = {
          id: `s-${Date.now()}`,
          requestId: requestId || null,
          text,
          from: { id: req.user.id, name: req.user.name || req.user.email },
          to: toId ? { id: toId } : null,
          video: { url: videoUrl || null, title: videoTitle || null },
          type: type || 'suggestion',
          parentId: parentId || null,
          createdAt: new Date().toISOString()
        };
    
        // Persist to suggestions.json
        const SUG_FILE = path.join(PERSIST_DIR, 'suggestions.json');
        let arr = [];
        try { if (fs.existsSync(SUG_FILE)) arr = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); } catch {}
        arr.unshift(suggestion);
        try { fs.writeFileSync(SUG_FILE, JSON.stringify(arr, null, 2), 'utf8'); } catch {}
    
        return res.json({ success: true, suggestion });
      } catch (err) {
        console.error('suggestion error', err);
        return res.status(500).json({ error: 'Server error' });
      }
    });
    
    // Get suggestions for a specific request
    app.get('/requests/:id/suggestions', (req, res) => {
      try {
        const requestId = req.params.id;
        const SUG_FILE = path.join(PERSIST_DIR, 'suggestions.json');
        let arr = [];
        try { if (fs.existsSync(SUG_FILE)) arr = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); } catch {}
        
        // Filter suggestions for this request
        // Also map to match frontend expectation (userName, timestamp)
        const suggestions = arr
            .filter(s => String(s.requestId) === String(requestId))
            .map(s => ({
                id: s.id,
                text: s.text,
                userName: s.from ? s.from.name : 'Anonymous',
                timestamp: s.createdAt,
                userId: s.from ? s.from.id : null // helpful for UI to identify own suggestions
            }))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        return res.json({ success: true, suggestions });
      } catch (err) {
        console.error('get request suggestions error', err);
        return res.status(500).json({ error: 'Server error' });
      }
    });

    // Suggestions for current user (creator notifications)
    // Modified to return threaded conversations:
    // 1. Get all suggestions where user is sender OR receiver
    // 2. Client will group them
    app.get('/suggestions/me', authMiddleware, (req, res) => {
      try {
        const SUG_FILE = path.join(PERSIST_DIR, 'suggestions.json');
        let arr = [];
        try { if (fs.existsSync(SUG_FILE)) arr = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); } catch {}
        
        const mine = arr.filter(s => 
            (s.to && s.to.id === req.user.id) || 
            (s.from && s.from.id === req.user.id)
        );
        return res.json({ success: true, suggestions: mine, userId: req.user.id });
      } catch (err) {
        console.error('get suggestions error', err);
        return res.status(500).json({ error: 'Server error' });
      }
    });
    
    // Alias: notifications for current user (same logic)
    app.get('/notifications', authMiddleware, (req, res) => {
      try {
        const SUG_FILE = path.join(PERSIST_DIR, 'suggestions.json');
        let arr = [];
        try { if (fs.existsSync(SUG_FILE)) arr = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); } catch {}
        
        const mine = arr.filter(s => 
            (s.to && s.to.id === req.user.id) || 
            (s.from && s.from.id === req.user.id)
        );
        return res.json({ success: true, notifications: mine, userId: req.user.id });
      } catch (err) {
        return res.status(500).json({ error: 'Server error' });
      }
    });

    // Delete a notification (suggestion)
    app.delete('/notifications/:id', authMiddleware, (req, res) => {
      try {
        const id = req.params.id;
        const SUG_FILE = path.join(PERSIST_DIR, 'suggestions.json');
        let arr = [];
        try { if (fs.existsSync(SUG_FILE)) arr = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); } catch {}
        
        const before = arr.length;
        // Allow deleting if user is sender or receiver
        arr = arr.filter(s => {
            if (String(s.id) !== String(id)) return true;
            // Check ownership
            const isMine = (s.to && s.to.id === req.user.id) || (s.from && s.from.id === req.user.id);
            return !isMine; // Keep if not mine (i.e. remove if mine)
        });
        
        try { fs.writeFileSync(SUG_FILE, JSON.stringify(arr, null, 2), 'utf8'); } catch {}
        
        return res.json({ success: true, deleted: before - arr.length });
      } catch (e) {
        return res.status(500).json({ error: 'Server error' });
      }
    });

    // Mark notification as read
    app.post('/notifications/:id/read', authMiddleware, (req, res) => {
      try {
        const id = req.params.id;
        const SUG_FILE = path.join(PERSIST_DIR, 'suggestions.json');
        let arr = [];
        try { if (fs.existsSync(SUG_FILE)) arr = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); } catch {}
        
        // Find and mark notification as read
        let found = false;
        arr = arr.map(s => {
          if (String(s.id) === String(id)) {
            // Check ownership - only mark as read if recipient
            if (s.to && s.to.id === req.user.id) {
              s.read = true;
              found = true;
            }
          }
          return s;
        });
        
        if (found) {
          try { fs.writeFileSync(SUG_FILE, JSON.stringify(arr, null, 2), 'utf8'); } catch {}
        }
        
        return res.json({ success: true, marked: found });
      } catch (e) {
        return res.status(500).json({ error: 'Server error' });
      }
    });

// POST /staff/send-promotion - send promotion and create notifications for recipients
app.post('/staff/send-promotion', async (req, res) => {
  try {
    const body = req.body || {};
    const { employeeId, title, message, promotionType, recipientType, selectedUsers, ctaText, ctaIcon, ctaColor, ctaUrl } = body;

    // Simple staff check for demo
    if (parseInt(employeeId) !== 1000) return res.status(403).json({ error: 'Unauthorized' });

    const SUG_FILE = path.join(PERSIST_DIR, 'suggestions.json');
    let arr = [];
    try { if (fs.existsSync(SUG_FILE)) arr = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); } catch (e) { arr = []; }

    const users = readUsers();
    let targets = [];
    if (recipientType === 'all') {
      targets = users.map(u => u.id);
    } else if (recipientType === 'creators') {
      targets = users.filter(u => u.isCreator).map(u => u.id);
    } else if (recipientType === 'individual' && Array.isArray(selectedUsers)) {
      targets = selectedUsers;
    }

    const created = [];
    targets.forEach(tid => {
      const toUser = users.find(u => u.id === tid);
      const notif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
        to: toUser ? { id: toUser.id, name: toUser.name } : { id: tid },
        from: { id: 'staff', name: 'Moderation Team' },
        type: 'staff_action',
        action: 'promotion',
        title: title || 'Promotion',
        message: message || '',
        icon: 'gift',
        reason: '',
        createdAt: new Date().toISOString(),
        read: false,
        requiresAcknowledgment: true,
        meta: { promotionType, ctaText: ctaText || null, ctaIcon: ctaIcon || null, ctaColor: ctaColor || null, ctaUrl: ctaUrl || null },
        ctaText: ctaText || null,
        ctaIcon: ctaIcon || null,
        ctaColor: ctaColor || null,
        ctaUrl: ctaUrl || null
      };
      arr.unshift(notif);
      created.push(notif);
    });

    try { fs.writeFileSync(SUG_FILE, JSON.stringify(arr, null, 2), 'utf8'); } catch (e) { console.error('write promotion notifications error', e); }

    return res.json({ success: true, created: created.length, notifications: created });
  } catch (err) {
    console.error('send-promotion error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /staff/apply-overlay-ad - apply overlay ad to videos with timing
app.post('/staff/apply-overlay-ad', (req, res) => {
  try {
    const { employeeId, videoIds, ad } = req.body || {};
    console.log('Apply overlay request:', { employeeId, videoIds, adKeys: ad ? Object.keys(ad) : null });
    
    if (parseInt(employeeId) !== 1000) return res.status(403).json({ error: 'Unauthorized' });
    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ error: 'No videos selected' });
    }
    if (!ad) return res.status(400).json({ error: 'Ad data missing' });

    const videos = readVideos();
    const updated = [];

    videos.forEach((v) => {
      if (videoIds.includes(v.id)) {
        // Ensure ads is an object (not an array) with bottom and overlays arrays
        if (!v.ads || Array.isArray(v.ads)) {
          v.ads = { bottom: [], overlays: [] };
        }
        if (!Array.isArray(v.ads.overlays)) {
          v.ads.overlays = [];
        }
        if (!Array.isArray(v.ads.bottom)) {
          v.ads.bottom = v.ads.bottom || [];
        }
        v.ads.overlays.push({
          id: `overlay-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
          type: 'overlay',
          ...ad,
          appliedAt: new Date().toISOString(),
          appliedBy: employeeId
        });
        updated.push(v);
      }
    });

    try {
      fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2), 'utf8');
      console.log(`Successfully applied overlay to ${updated.length} videos`);
    } catch (e) {
      console.error('write videos error:', e);
      return res.status(500).json({ error: 'Failed to save' });
    }

    return res.json({ success: true, applied: updated.length, videos: updated });
  } catch (err) {
    console.error('apply-overlay-ad error', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /staff/apply-bottom-ad - apply bottom ad to videos with timing
app.post('/staff/apply-bottom-ad', (req, res) => {
  try {
    const { employeeId, videoIds, ad } = req.body || {};
    if (parseInt(employeeId) !== 1000) return res.status(403).json({ error: 'Unauthorized' });
    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ error: 'No videos selected' });
    }
    if (!ad) return res.status(400).json({ error: 'Ad data missing' });

    const videos = readVideos();
    const updated = [];

    videos.forEach((v) => {
      if (videoIds.includes(v.id)) {
        // Ensure ads is an object (not an array) with bottom and overlays arrays
        if (!v.ads || Array.isArray(v.ads)) {
          v.ads = { bottom: [], overlays: [] };
        }
        if (!Array.isArray(v.ads.bottom)) {
          v.ads.bottom = [];
        }
        v.ads.bottom.push({
          id: `bottom-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
          type: 'bottom',
          ...ad,
          appliedAt: new Date().toISOString(),
          appliedBy: employeeId
        });
        console.log(`Applied bottom ad to video ${v.id}:`, v.ads);
        updated.push(v);
      }
    });

    try {
      fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2), 'utf8');
    } catch (e) {
      console.error('write videos error:', e);
      return res.status(500).json({ error: 'Failed to save' });
    }

    return res.json({ success: true, applied: updated.length, videos: updated });
  } catch (err) {
    console.error('apply-bottom-ad error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /staff/apply-default2-ad - apply default2 (card-based) ad to videos
app.post('/staff/apply-default2-ad', (req, res) => {
  try {
    const { employeeId, videoIds, ad } = req.body || {};
    console.log('Apply default2 ad request:', { employeeId, videoIds, adKeys: ad ? Object.keys(ad) : null });

    if (parseInt(employeeId) !== 1000) return res.status(403).json({ error: 'Unauthorized' });
    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ error: 'No videos selected' });
    }
    if (!ad) return res.status(400).json({ error: 'Ad data missing' });

    const videos = readVideos();
    const updated = [];

    videos.forEach((v) => {
      if (videoIds.includes(v.id)) {
        if (!v.ads || Array.isArray(v.ads)) {
          v.ads = { bottom: [], overlays: [] };
        }
        if (!Array.isArray(v.ads.bottom)) {
          v.ads.bottom = [];
        }
        // Store with default2 prefix so the frontend can read them directly
        v.ads.bottom.push({
          id: `default2-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
          type: 'default2',
          default2Title: ad.title || '',
          default2Description: ad.description || '',
          default2Logo: ad.logo || '',
          default2Image: ad.image || ad.logo || '',
          default2Link: ad.link || '',
          default2BgColor: ad.bgColor || '#ffffff',
          default2TextColor: ad.textColor || '#111827',
          default2LineColor: ad.lineColor || '#d946ef',
          startTime: ad.startTime || 0,
          duration: ad.duration || 30,
          displayCount: ad.displayCount || 1,
          appliedAt: new Date().toISOString(),
          appliedBy: employeeId
        });
        console.log(`Applied default2 ad to video ${v.id}:`, v.ads);
        updated.push(v);
      }
    });

    try {
      fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2), 'utf8');
      console.log(`Successfully applied default2 ad to ${updated.length} videos`);
    } catch (e) {
      console.error('write videos error:', e);
      return res.status(500).json({ error: 'Failed to save' });
    }

    return res.json({ success: true, applied: updated.length, videos: updated });
  } catch (err) {
    console.error('apply-default2-ad error', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /staff/remove-ad-from-video - remove ads from a video
app.post('/staff/remove-ad-from-video', (req, res) => {
  try {
    const { employeeId, videoId, adType, adId } = req.body || {};
    if (parseInt(employeeId) !== 1000) return res.status(403).json({ error: 'Unauthorized' });
    if (!videoId || !adType) {
      return res.status(400).json({ error: 'videoId and adType are required' });
    }

    const videos = readVideos();
    const videoIdx = videos.findIndex(v => String(v.id) === String(videoId));
    
    if (videoIdx === -1) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const video = videos[videoIdx];
    let removed = 0;

    // Initialize ads object if needed
    if (!video.ads || Array.isArray(video.ads)) {
      video.ads = { bottom: [], overlays: [] };
    }

    // Remove specific ad by ID, or all ads of a type
    if (adType === 'bottom' && Array.isArray(video.ads.bottom)) {
      if (adId) {
        // Remove specific ad by ID
        const initialLength = video.ads.bottom.length;
        video.ads.bottom = video.ads.bottom.filter(ad => ad.id !== adId);
        removed = initialLength - video.ads.bottom.length;
        console.log(`Removed 1 bottom ad (${adId}) from video ${videoId}`);
      } else {
        // Remove all bottom ads
        removed = video.ads.bottom.length;
        video.ads.bottom = [];
        console.log(`Removed all ${removed} bottom ads from video ${videoId}`);
      }
    } else if (adType === 'overlay' && Array.isArray(video.ads.overlays)) {
      if (adId) {
        // Remove specific ad by ID
        const initialLength = video.ads.overlays.length;
        video.ads.overlays = video.ads.overlays.filter(ad => ad.id !== adId);
        removed = initialLength - video.ads.overlays.length;
        console.log(`Removed 1 overlay ad (${adId}) from video ${videoId}`);
      } else {
        // Remove all overlay ads
        removed = video.ads.overlays.length;
        video.ads.overlays = [];
        console.log(`Removed all ${removed} overlay ads from video ${videoId}`);
      }
    } else if (adType === 'all') {
      removed = (video.ads.bottom?.length || 0) + (video.ads.overlays?.length || 0);
      video.ads.bottom = [];
      video.ads.overlays = [];
      console.log(`Removed ${removed} total ads from video ${videoId}`);
    }

    try {
      fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2), 'utf8');
    } catch (e) {
      console.error('write videos error:', e);
      return res.status(500).json({ error: 'Failed to save' });
    }

    return res.json({ success: true, removed: removed, video: video });
  } catch (err) {
    console.error('remove-ad-from-video error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Boost endpoint: requires authentication
app.post('/boost', authMiddleware, (req, res) => {
  const { requestId, amount, provider } = req.body || {};
  if (!requestId || !amount) return res.status(400).json({ error: 'Missing requestId or amount' });
  // demo: accept boost and return success
  return res.json({ success: true, requestId, amount, provider: provider || 'unknown', creditedTo: req.user });
});

// Reliable creators endpoint: extracts from videos + users to guarantee results
app.get('/creators', (req, res) => {
  try {
    const videos = readVideos();
    const users = readUsers();
    const q = (req.query.query || req.query.q || '').trim().toLowerCase();

    // Build creator map from videos (guaranteed data source)
    const creatorMap = new Map();
    videos.forEach(v => {
      const authorId = v.authorId || v.creatorId || v.userId;
      const authorName = v.author || v.creator || v.channel;
      if (!authorId && !authorName) return;
      const key = (authorId || authorName || '').toLowerCase();
      if (!creatorMap.has(key)) {
        creatorMap.set(key, {
          id: authorId || null,
          name: authorName || 'Unknown',
          image: v.authorImage || v.creatorImage || null,
          handle: v.authorHandle || null,
          email: authorId && authorId.includes('@') ? authorId : null,
        });
      }
    });

    // Enrich with full user data and add users marked as creators
    const creators = [];
    const addedIds = new Set();

    creatorMap.forEach((creator) => {
      const user = users.find(u =>
        (creator.id && (u.id === creator.id || u.email === creator.id)) ||
        (creator.name && u.name && u.name.toLowerCase() === creator.name.toLowerCase())
      );
      if (user) {
        const { passwordHash, password_hash, token, ...pub } = user;
        const img = pub.image || pub.avatar || pub.profileImage || creator.image || null;
        const merged = {
          ...pub,
          isCreator: true,
          image: img,
          profileImage: img,
          name: pub.name || creator.name,
          id: pub.id || creator.id,
        };
        creators.push(merged);
        addedIds.add(pub.id);
        if (pub.email) addedIds.add(pub.email);
      } else {
        creators.push({ ...creator, isCreator: true, profileImage: creator.image || null });
        if (creator.id) addedIds.add(creator.id);
      }
    });

    // Also add any users marked as creator who don't have videos yet
    users.forEach(u => {
      if ((u.isCreator === true || u.is_creator === true) && !addedIds.has(u.id) && !addedIds.has(u.email)) {
        const { passwordHash, password_hash, token, ...pub } = u;
        creators.push({ ...pub, isCreator: true });
      }
    });

    // Filter by query if provided
    let results = creators;
    if (q) {
      results = results.filter(c => {
        const name = (c.name || '').toLowerCase();
        const handle = (c.handle || c.tag || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        return name.includes(q) || handle.includes(q) || email.includes(q);
      });
    }

    console.log(`[GET /creators] returning ${results.length} creators from ${videos.length} videos + ${users.length} users`);
    return res.json({ creators: results });
  } catch (err) {
    console.error('get creators error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/users', (req, res) => {
  try {
    const users = readUsers();
    console.log(`[GET /users] readUsers returned ${users.length} users`);
    const q = (req.query.query || req.query.q || '').trim().toLowerCase();
    const creatorsOnly = req.query.creatorsOnly === '1' || req.query.creatorsOnly === 'true';
    let results = users.map(({ passwordHash, password_hash, token, ...u }) => u);
    if (creatorsOnly) results = results.filter(u => u.isCreator === true || u.is_creator === true);
    if (q) {
      results = results.filter(u => {
        const name = (u.name || '').toLowerCase();
        const handle = (u.handle || u.tag || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || handle.includes(q) || email.includes(q);
      });
    }
    // Add profileImage alias for frontend compatibility
    results = results.map(u => ({ ...u, profileImage: u.image || u.avatar || u.profileImage || null }));
    console.log(`[GET /users] returning ${results.length} results (creatorsOnly=${creatorsOnly}, q=${q || 'none'})`);
    return res.json({ users: results });
  } catch (err) {
    console.error('get users error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get current authenticated user profile (full details)
app.get('/users/me', authMiddleware, (req, res) => {
  try {
    const users = readUsers();
    const idx = users.findIndex(x => x.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    
    const u = users[idx];
    
    // Generate referral code if missing (for existing users)
    if (!u.referralCode) {
      u.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
      writeUsers(users);
    }
    
    const { passwordHash, token, ...publicUser } = u;
    return res.json({ user: publicUser });
  } catch (err) {
    console.error('get me error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Generic user update (name, bio, handle, interests, etc.)
app.post('/users/update', authMiddleware, (req, res) => {
  try {
    const body = req.body || {};
    const allowed = ['name', 'handle', 'bio', 'interests', 'image', 'email', 'social'];
    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    
    const updated = { ...users[idx] };
    allowed.forEach(k => { if (typeof body[k] !== 'undefined') updated[k] = body[k]; });
    
    // Ensure handle/tag consistency if handle is updated
    if (body.handle) {
        updated.handle = body.handle;
        updated.tag = body.handle; // Keep tag in sync for legacy compatibility
    }

    users[idx] = updated;
    writeUsers(users);
    
    const { passwordHash, ...publicUser } = updated;
    return res.json({ success: true, user: publicUser });
  } catch (err) {
    console.error('user update error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get user by id (public view) - does not require auth
app.get('/users/:id', (req, res) => {
  try {
    const id = req.params.id;
    // Handle 'anonymous' special case gracefully
    if (id === 'anonymous') {
         return res.json({ user: { id: 'anonymous', name: 'Anonymous', isAnonymous: true } });
    }
    const users = readUsers();
    console.log(`[GET /users/:id] Looking for "${id}" among ${users.length} users`);
    // Also try to match by name roughly if ID is not found (for legacy test data compatibility)
    let u = users.find(x => x.id === id);
    if (!u) {
       // Fallback: is it a test user ID or name? Also try case-insensitive match
       u = users.find(x => x.name === id || x.email === id);
    }
    if (!u) {
       // Case-insensitive fallback for names
       const idLower = String(id).toLowerCase();
       u = users.find(x => 
         (x.name && x.name.toLowerCase() === idLower) ||
         (x.email && x.email.toLowerCase() === idLower) ||
         (x.handle && x.handle.toLowerCase() === idLower) ||
         (x.tag && x.tag.toLowerCase() === idLower)
       );
    }
    
    if (!u) {
         // Return a dummy placeholder instead of 404 to prevent UI crashes for missing users
         return res.json({ user: { id: id, name: 'Unknown User', isPlaceholder: true } });
    }
    
    const { passwordHash, password_hash, token, ...publicUser } = u;
    // Add profileImage alias for frontend compatibility
    publicUser.profileImage = publicUser.image || publicUser.avatar || publicUser.profileImage || null;
    return res.json({ user: publicUser });
  } catch (err) {
    console.error('get user by id error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get user by handle/tag (public view)
app.get('/users/handle/:handle', (req, res) => {
  try {
    let handle = String(req.params.handle || '').trim();
    if (handle.startsWith('@')) handle = handle.slice(1);
    if (!handle) return res.status(400).json({ error: 'Missing handle' });
    const users = readUsers();
    const u = users.find(x => (x.tag && String(x.tag).toLowerCase() === handle.toLowerCase()) || (x.handle && String(x.handle).toLowerCase() === handle.toLowerCase()) || (x.name && String(x.name).toLowerCase() === handle.toLowerCase()));
    if (!u) return res.status(404).json({ error: 'User not found' });
    const { passwordHash, token, ...publicUser } = u;
    return res.json({ user: publicUser });
  } catch (err) {
    console.error('get user by handle error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Requests endpoints: list and create

// --- Categories API ---
app.get('/categories', (req, res) => {
    try {
        if (!fs.existsSync(CATEGORIES_FILE)) {
            // Default if missing
            return res.json(['Travel', 'Education', 'Entertainment', 'Music', 'Sports']);
        }
        const data = fs.readFileSync(CATEGORIES_FILE, 'utf8');
        const categories = JSON.parse(data);
        res.json(categories);
    } catch (err) {
        console.error('Error reading categories:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

app.post('/categories', (req, res) => {
    try {
        // Simple auth check? (req.user shouldn't be here unless authMiddleware used)
        const { category } = req.body;
        if (!category || typeof category !== 'string' || !category.trim()) {
            return res.status(400).json({ error: 'Invalid category name' });
        }
        
        const catName = category.trim();
        let categories = [];
        
        if (fs.existsSync(CATEGORIES_FILE)) {
             categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
        } else {
             categories = ['Travel', 'Education', 'Entertainment', 'Music', 'Sports'];
        }

        // Case-insensitive duplicate check
        const exists = categories.some(c => c.toLowerCase() === catName.toLowerCase());
        if (!exists) {
            categories.push(catName); // Add in original case
            fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
        }

        res.json(categories);
    } catch (err) {
        console.error('Error saving category:', err);
        res.status(500).json({ error: 'Failed to save category' });
    }
});

app.get('/requests', (req, res) => {
  try {
    let requests = readRequests();
    console.log(`DEBUG /requests: Read ${requests.length} requests from file`);

    // Filter out hidden and deleted requests server-side
    requests = requests.filter(r => !r.hidden && !r.deleted);
    console.log(`DEBUG /requests: After hidden/deleted filter: ${requests.length}`);

    const users = readUsers();
    
    // Enrich first (needed for some scores)
    requests = requests.map(r => {
       try {
         const copy = { ...r };
         // Enrich creator object
         if (copy.creator && copy.creator.id) {
           const u = users.find(x => x.id === copy.creator.id);
           if (u) {
             copy.creator = { id: u.id, name: u.name || 'Anonymous', image: u.image || u.avatar || u.photoURL || '' };
             if ((!copy.imageUrl || copy.imageUrl === '') && (u.image || u.avatar || u.photoURL)) copy.imageUrl = u.image || u.avatar || u.photoURL;
           }
         } else {
            if (!copy.creator) copy.creator = { id: null, name: 'Anonymous', image: '' };
         }
         // Also enrich from createdBy user (the person who made the request)
         if (copy.createdBy && typeof copy.createdBy === 'string') {
           const requester = users.find(x => x.id === copy.createdBy);
           if (requester) {
             const reqImage = requester.image || requester.avatar || requester.photoURL || '';
             copy.requesterName = copy.requesterName || requester.name || 'Anonymous';
             copy.requesterAvatar = reqImage;
             // Also set creator image if creator IS the requester and has no image
             if (copy.creator && copy.creator.id === copy.createdBy && !copy.creator.image) {
               copy.creator.image = reqImage;
             }
             if ((!copy.imageUrl || copy.imageUrl === '') && reqImage) copy.imageUrl = reqImage;
           }
         }
         return copy;
       } catch (e) { return r; }
    });

    const feed = req.query.feed || 'recommended';
    
    // --- Algorithm Implementation ---
    const now = Date.now();
    
    // Helpers
    const getAgeHours = (r) => {
        if (!r.createdAt) return 0.1; // Default to very fresh if missing
        const ct = new Date(r.createdAt).getTime();
        if (isNaN(ct)) return 0.1; // Default to very fresh if invalid
        return Math.max(0.1, (now - ct) / (1000 * 60 * 60));
    };
    const isFresh = (r) => getAgeHours(r) < 48; // Less than 48 hours old

    if (feed === 'trending') {
        // Trending: Engagement Velocity
        // Score = (Likes + Comments*2 + Boosts*3) / Age^1.2
        requests = requests.map(r => {
            const likes = parseInt(r.likes || 0);
            const comments = parseInt(r.comments || 0);
            const boosts = parseInt(r.boosts || 0);
            const funding = parseInt(r.funding || r.amount || 0);
            
            // Funding also contributes slightly to "trending" as it indicates serious interest
            const engagement = likes + (comments * 2) + (boosts * 3) + (funding * 0.01);
            const score = engagement / Math.pow(getAgeHours(r) + 2, 1.2);
            return { ...r, score, isTrending: score > 10 }; // Set isTrending flag dynamically if desired
        }).sort((a, b) => b.score - a.score);
        
    } else if (feed === 'recommended' || feed === 'discovery') {
        // Recommended / Discovery: "Diamond in the rough" logic
        // Prioritize: High value (funding), Freshness, and Unclaimed status
        // Add Randomness to ensure discovery of new/low-engagement items
        
        requests = requests.map(r => {
            let score = 0;
            const funding = parseInt(r.funding || r.amount || 0);
            const likes = parseInt(r.likes || 0);
            
            // 1. Value Signal
            score += Math.log10(funding + 1) * 20; 
            
            // 2. Freshness Boost
            if (isFresh(r)) score += 50;
            
            // 3. Opportunity Signal (Unclaimed gets huge boost for creators)
            if (!r.claimed) score += 30;
            else score -= 20; // Downrank claimed requests in discovery feed
            
            // 4. Social Proof (diminishing returns)
            score += Math.min(likes, 100) * 0.5;
            
            // 5. Random Discovery Factor (Originality/Diversity)
            // Adds a random jitter to shuffle equivalent items
            score += Math.random() * 15;
            
            return { ...r, score };
        }).sort((a, b) => b.score - a.score);
        
    } else if (feed === 'fresh') {
        // Pure reverse chronological
        requests.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
        });
        
    } else if (feed === 'funded') {
        // Top Funded
        requests.sort((a, b) => (b.funding || b.amount || 0) - (a.funding || a.amount || 0));
        
    } else if (feed === 'completed') {
        // Completed: Only show requests where the video is published or marked complete
        // Steps: 1=Received, 2=Review, 3=Production, 4=Preview, 5=Published, 6=Completed
        requests = requests.filter(r => r.isCompleted === true || (r.currentStep && r.currentStep >= 5));
        requests.sort((a, b) => {
            const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return timeB - timeA;
        });
    }

    // Apply other filters if present
    if (req.query.category && req.query.category !== 'All') {
        requests = requests.filter(r => r.category === req.query.category);
    }

    console.log(`DEBUG /requests: Returning ${requests.length} requests (feed=${feed})`);
    return res.json({ requests });
  } catch (err) {
    console.error('get requests error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Comment reactions storage ---
const COMMENT_REACTIONS_FILE = path.join(PERSIST_DIR, 'comment_reactions.json');
function readCommentReactions() {
  try { if (!fs.existsSync(COMMENT_REACTIONS_FILE)) return { likes: {}, dislikes: {} }; const raw = fs.readFileSync(COMMENT_REACTIONS_FILE, 'utf8'); const j = JSON.parse(raw || '{}'); return { likes: j.likes || {}, dislikes: j.dislikes || {} }; } catch (e) { return { likes: {}, dislikes: {} }; }
}
function writeCommentReactions(data) {
  try { const safe = { likes: data.likes || {}, dislikes: data.dislikes || {} }; fs.writeFileSync(COMMENT_REACTIONS_FILE, JSON.stringify(safe, null, 2), 'utf8'); } catch (e) {}
}

// Persist comment reactions and aggregate counts
app.post('/comments/react', authMiddleware, (req, res) => {
  try {
    const { commentId, action, requestId } = req.body || {};
    if (!commentId || !action) return res.status(400).json({ error: 'Missing commentId or action' });
    
    const userId = req.user.id;
    const reactions = readCommentReactions();
    const comments = readComments();
    const idx = comments.findIndex(c => String(c.id) === String(commentId));
    
    if (idx === -1) return res.status(404).json({ error: 'Comment not found' });
    
    // Initialize maps
    reactions.likes[commentId] = reactions.likes[commentId] || {};
    reactions.dislikes[commentId] = reactions.dislikes[commentId] || {};
    
    let likesCount = Number(comments[idx].likesCount || 0);
    let dislikesCount = Number(comments[idx].dislikesCount || 0);
    
    if (action === 'like') {
      if (!reactions.likes[commentId][userId]) {
        reactions.likes[commentId][userId] = true;
        likesCount += 1;
      }
      if (reactions.dislikes[commentId][userId]) {
        delete reactions.dislikes[commentId][userId];
        dislikesCount = Math.max(0, dislikesCount - 1);
      }
    } else if (action === 'unlike') {
      if (reactions.likes[commentId][userId]) {
        delete reactions.likes[commentId][userId];
        likesCount = Math.max(0, likesCount - 1);
      }
    } else if (action === 'dislike') {
      if (!reactions.dislikes[commentId][userId]) {
        reactions.dislikes[commentId][userId] = true;
        dislikesCount += 1;
      }
      if (reactions.likes[commentId][userId]) {
        delete reactions.likes[commentId][userId];
        likesCount = Math.max(0, likesCount - 1);
      }
    } else if (action === 'undislike') {
       if (reactions.dislikes[commentId][userId]) {
         delete reactions.dislikes[commentId][userId];
         dislikesCount = Math.max(0, dislikesCount - 1);
       }
    }
    
    comments[idx].likesCount = likesCount;
    comments[idx].dislikesCount = dislikesCount;
    
    writeComments(comments);
    writeCommentReactions(reactions);
    
    return res.json({ success: true, likesCount, dislikesCount });
  } catch (err) {
    console.error('comment react error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update comments fetch to include reaction state for user
app.get('/requests/:id/comments', (req, res) => {
  try {
    const requestId = req.params.id;
    const all = readComments();
    let filtered = (all || []).filter(c => String(c.requestId) === String(requestId)).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // If user is authenticated, check their reaction status
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
       try {
         const token = req.headers.authorization.slice(7).trim();
         const users = readUsers();
         const user = users.find(u => u.token === token);
         if (user) {
            const reactions = readCommentReactions();
            filtered = filtered.map(c => ({
                ...c,
                likedByUser: !!(reactions.likes[c.id] && reactions.likes[c.id][user.id]),
                dislikedByUser: !!(reactions.dislikes[c.id] && reactions.dislikes[c.id][user.id])
            }));
         }
       } catch (e) {}
    }
    
    return res.json({ success: true, comments: filtered });
  } catch (err) { console.error('GET /requests/:id/comments error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.post('/requests/:id/comments', authMiddleware, (req, res) => {
  try {
    const requestId = req.params.id;
    const { text, parentId } = req.body || {};
    if (!text || String(text).trim() === '') return res.status(400).json({ error: 'Missing text' });

    const comment = {
      id: `c_${Date.now()}`,
      requestId,
      userId: req.user.id,
      userName: req.user.name || req.user.email,
      text: String(text).trim(),
      parentId: parentId || null,
      likesCount: 0,
      dislikesCount: 0,
      createdAt: new Date().toISOString()
    };

    const all = readComments();
    all.push(comment);
    writeComments(all);

    // increment comment counter on request if present
    try {
      const requests = readRequests();
      const idx = requests.findIndex(r => String(r.id) === String(requestId));
      if (idx !== -1) {
        requests[idx].comments = (Number(requests[idx].comments) || 0) + 1;
        writeRequests(requests);
      }
    } catch (e) {}

    // Also increment comment counter on video if present
    try {
      const videos = readVideos();
      const vidIdx = videos.findIndex(v => String(v.id) === String(requestId));
      if (vidIdx !== -1) {
        videos[vidIdx].comments = (Number(videos[vidIdx].comments) || 0) + 1;
        writeVideos(videos);
        
        // Also increment the creator's total comments in the user object
        const video = videos[vidIdx];
        if (video.authorId || video.author || video.authorEmail) {
          const users = readUsers();
          const creatorIdx = users.findIndex(u => 
            u.id === video.authorId || 
            u.email === video.authorEmail ||
            (u.name && u.name.toLowerCase() === (video.author || '').toLowerCase())
          );
          if (creatorIdx !== -1) {
            users[creatorIdx].comments = (users[creatorIdx].comments || 0) + 1;
            writeUsers(users);
          }
        }
      }
    } catch (e) {}

    return res.json({ success: true, comment });
  } catch (err) { console.error('POST /requests/:id/comments error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.put('/requests/:id/comments/:cid', authMiddleware, (req, res) => {
  try {
    const requestId = req.params.id;
    const cid = req.params.cid;
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const all = readComments();
    const idx = all.findIndex(c => String(c.id) === String(cid) && String(c.requestId) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Comment not found' });
    const comment = all[idx];
    if (String(comment.userId) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });

    comment.text = String(text).trim();
    comment.updatedAt = new Date().toISOString();
    all[idx] = comment;
    writeComments(all);
    return res.json({ success: true, comment });
  } catch (err) { console.error('PUT /requests/:id/comments/:cid error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.delete('/requests/:id/comments/:cid', authMiddleware, (req, res) => {
  try {
    const requestId = req.params.id;
    const cid = req.params.cid;
    const all = readComments();
    const idx = all.findIndex(c => String(c.id) === String(cid) && String(c.requestId) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Comment not found' });
    const comment = all[idx];
    if (String(comment.userId) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    all.splice(idx, 1);
    writeComments(all);

    // decrement comment counter on request if present
    try {
      const requests = readRequests();
      const ridx = requests.findIndex(r => String(r.id) === String(requestId));
      if (ridx !== -1) {
        requests[ridx].comments = Math.max(0, (Number(requests[ridx].comments) || 0) - 1);
        writeRequests(requests);
      }
    } catch (e) {}

    return res.json({ success: true });
  } catch (err) { console.error('DELETE /requests/:id/comments/:cid error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Get requests created by the logged-in user
app.get('/requests/my', authMiddleware, (req, res) => {
  try {
    const allRequests = readRequests();
    const userRequests = allRequests.filter(r => r.createdBy === req.user.id);
    return res.json({ requests: userRequests });
  } catch (err) {
    console.error('get my requests error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/requests', authMiddleware, (req, res) => {
  try {
    const body = req.body || {};
    if (!body.title || !body.description) return res.status(400).json({ error: 'Missing title or description' });
    const requests = readRequests();
    
    // Use client-provided ID if available (for optimistic UI consistency), else generate one
    const id = (body.id && String(body.id).startsWith('req_')) ? body.id : `req_${Date.now()}`;
    
    // CRITICAL: Check for duplicate ID to prevent re-submitting the same request
    const existingIdx = requests.findIndex(r => String(r.id) === String(id));
    if (existingIdx !== -1) {
      console.log('Request with this ID already exists, returning existing:', id);
      return res.json({ success: true, request: requests[existingIdx], duplicate: true });
    }
    
    const parsedAmount = (typeof body.amount === 'number') ? body.amount : (body.amount ? Number(body.amount) : 0);
    const newReq = {
      id,
      title: body.title,
      description: body.description,
      likes: 0,
      comments: 0,
      boosts: 0,
      // persist any provided amount/funding so requests show budgets
      amount: parsedAmount || 0,
      funding: (typeof body.funding === 'number' && body.funding > 0) ? body.funding : (parsedAmount || 0),
      isTrending: false,
      isSponsored: false,
      company: body.company || (body.creator && body.creator.name) || req.user.name || 'Community',
      companyInitial: (body.creator && body.creator.name ? String(body.creator.name)[0] : (req.user.name ? String(req.user.name)[0] : 'C')),
      companyColor: body.companyColor || 'bg-gray-400',
      imageUrl: body.imageUrl || '',
      // persist a reference to the creating user (logged-in user)
      creator: { 
        id: req.user.id,
        name: req.user.name,
        email: req.user.email 
      },
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      ...body.meta && { meta: body.meta }
    };
    requests.unshift(newReq);
    writeRequests(requests);
    updateStreak(req.user.id);
    return res.json({ success: true, request: newReq });
  } catch (err) {
    console.error('create request error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUBLIC (No Auth) Endpoint for Requests - Fallback/Parity
app.post('/requests/public', (req, res) => {
  console.log('Public Request Creation:', req.body.title);
  try {
    const body = req.body || {};
    if (!body.title || !body.description) return res.status(400).json({ error: 'Missing title or description' });
    const requests = readRequests();
    
    // Use client-provided ID or generate
    const id = (body.id && String(body.id).startsWith('req_')) ? body.id : `req_${Date.now()}`;
    
    // CRITICAL: Check for duplicate ID to prevent re-submitting the same request
    const existingIdx = requests.findIndex(r => String(r.id) === String(id));
    if (existingIdx !== -1) {
      console.log('Public Request with this ID already exists, returning existing:', id);
      return res.json({ success: true, request: requests[existingIdx], duplicate: true });
    }
    
    const parsedAmount = (typeof body.amount === 'number') ? body.amount : (body.amount ? Number(body.amount) : 0);
    
    // Construct request object manually since we don't have req.user from authMiddleware
    // We expect the client to provide creator details if available in body.creator
    const creator = body.creator || { id: 'anonymous', name: 'Anonymous' };
    
    const newReq = {
      id,
      title: body.title,
      description: body.description,
      likes: 0,
      comments: 0,
      boosts: 0,
      amount: parsedAmount || 0,
      funding: (typeof body.funding === 'number' && body.funding > 0) ? body.funding : (parsedAmount || 0),
      isTrending: false,
      isSponsored: false,
      company: body.company || creator.name || 'Community',
      companyInitial: (creator.name ? String(creator.name)[0] : 'C'),
      companyColor: body.companyColor || 'bg-gray-400',
      imageUrl: body.imageUrl || '',
      creator: creator,
      createdBy: creator.id || null, // Important: try to preserve the user ID if sent
      createdAt: new Date().toISOString(),
      ...body.meta && { meta: body.meta }
    };
    
    requests.unshift(newReq);
    writeRequests(requests);
    return res.json({ success: true, request: newReq });
  } catch (err) {
    console.error('create public request error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update an existing request (only the creator can edit, and only if not claimed)
app.put('/requests/:id', authMiddleware, (req, res) => {
  try {
    const requestId = req.params.id;
    const body = req.body || {};
    const requests = readRequests();
    const idx = requests.findIndex(r => String(r.id) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });

    const existing = requests[idx];
    // Only the creating user may edit
    if (!existing.createdBy || existing.createdBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    // Do not allow edits once claimed
    if (existing.claimed) return res.status(400).json({ error: 'Cannot edit a claimed request' });

    // Accept a small set of editable fields
    const allowed = ['title', 'description', 'imageUrl', 'funding', 'amount', 'company', 'meta'];
    allowed.forEach(k => {
      if (typeof body[k] !== 'undefined') requests[idx][k] = body[k];
    });
    requests[idx].updatedAt = new Date().toISOString();
    writeRequests(requests);
    return res.json({ success: true, request: requests[idx] });
  } catch (err) {
    console.error('update request error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/requests/:id', authMiddleware, (req, res) => {
  try {
    const requestId = req.params.id;
    const requests = readRequests();
    const idx = requests.findIndex(r => String(r.id) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });

    const existing = requests[idx];
    // Only the creating user may delete
    if (!existing.createdBy || existing.createdBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    
    // Constraint: Cannot delete if claimed/in-progress
    // We check both specific 'claimed' flag and if there is a 'creator' object that is not the requester themselves (which shouldn't happen for claimed requests usually, but just in case)
    // Actually, based on logic elsewhere: request.creator is populated with the profile of the person who fulfilled it OR the requester? 
    // Wait, let's look at requests.json again. 
    // "creator": { "id": "...", "name": "Paul" } seems to be the REQUESTER usually.
    // "claimedBy": { "id": "...", "name": "..." } ??
    // I need to check how "claimed" is stored.
    
    // In src/requests.jsx: 
    // isClaimed = request.claimedBy || (request.status === 'in-progress' || request.status === 'completed');
    
    const isClaimed = existing.claimedBy || existing.claimed || (existing.status && ['in-progress', 'completed', 'claimed'].includes(existing.status));

    if (isClaimed) {
         return res.status(400).json({ error: 'Request is in progress and cannot be deleted' });
    }

    // Proceed to delete
    requests.splice(idx, 1);
    writeRequests(requests);
    
    // Also remove any related comments/reactions if needed, but for now just the request
    return res.json({ success: true, message: 'Request deleted' });

  } catch (err) {
    console.error('delete request error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Serve uploaded static files
app.use('/uploads', express.static(UPLOAD_DIR));

// Serve OG branding banner for social share previews
app.get('/regaarder-og-banner.png', (req, res) => {
  const bannerPath = path.join(__dirname, 'regaarder-og-banner.png');
  if (fs.existsSync(bannerPath)) {
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=604800');
    return res.sendFile(bannerPath);
  }
  res.status(404).send('Not found');
});

// --- Share / Open Graph endpoints ---
app.get('/share/video/:id', (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const t = req.query.t ? String(req.query.t) : '';
    const videos = readVideos();
    const video = videos.find(v => String(v.id) === id) || null;
    const title = video?.title || 'Watch a video on Regaarder';
    const description = video?.requester ? `Requested by ${video.requester}` : 'Watch on Regaarder';
    const image = video?.imageUrl || video?.thumbnail || '';
    const redirectUrl = `${WEB_URL}/videoplayer?v=${encodeURIComponent(id)}${t ? `&t=${encodeURIComponent(t)}` : ''}`;
    const url = `${WEB_URL}/share/video/${encodeURIComponent(id)}${t ? `?t=${encodeURIComponent(t)}` : ''}`;
    res.set('Content-Type', 'text/html');
    return res.status(200).send(buildShareHtml({ title, description, image, url, redirectUrl, type: 'video.other' }, req));
  } catch (e) {
    res.set('Content-Type', 'text/html');
    return res.status(200).send(buildShareHtml({
      title: 'Regaarder',
      description: 'Watch on Regaarder',
      url: `${WEB_URL}/share/video`,
      redirectUrl: WEB_URL
    }, req));
  }
});

app.get('/share/request/:id', (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const requests = readRequests();
    const request = requests.find(r => String(r.id) === id) || null;
    const requesterName = request?.requesterName || (request?.creator && request.creator.name) || request?.company || '';
    const title = request?.title ? `${request.title} — Regaarder` : 'View this request on Regaarder';
    const rawDesc = request?.description || '';
    const description = rawDesc
      ? `${rawDesc.slice(0, 150)}${rawDesc.length > 150 ? '…' : ''}${requesterName ? ` — requested by ${requesterName}` : ''}`
      : `Support this request on Regaarder${requesterName ? ` by ${requesterName}` : ''}`;
    const image = request?.imageUrl || '';
    const redirectUrl = `${WEB_URL}/requests?id=${encodeURIComponent(id)}`;
    const url = `${WEB_URL}/share/request/${encodeURIComponent(id)}`;
    res.set('Content-Type', 'text/html');
    return res.status(200).send(buildShareHtml({ title, description, image, url, redirectUrl, type: 'website' }, req));
  } catch (e) {
    res.set('Content-Type', 'text/html');
    return res.status(200).send(buildShareHtml({
      title: 'Regaarder',
      description: 'Explore requests on Regaarder',
      url: `${WEB_URL}/share/request`,
      redirectUrl: `${WEB_URL}/requests`
    }, req));
  }
});

app.get('/share/profile/:key', (req, res) => {
  try {
    const key = String(req.params.key || '').trim();
    const users = readUsers();
    const lower = key.toLowerCase();
    const user = users.find(u =>
      String(u.id) === key ||
      (u.handle && String(u.handle).toLowerCase() === lower) ||
      (u.email && String(u.email).toLowerCase() === lower) ||
      (u.name && String(u.name).toLowerCase() === lower) ||
      (u.name && `@${String(u.name).toLowerCase()}` === lower)
    ) || null;

    const name = user?.name || 'Creator';
    const title = `${name} on Regaarder`;
    const description = user?.bio || user?.tagline || 'View this creator profile on Regaarder';
    const image = user?.image || '';
    const handle = user?.handle || key;
    const redirectUrl = `${WEB_URL}/@${encodeURIComponent(handle)}`;
    const url = `${WEB_URL}/share/profile/${encodeURIComponent(handle)}`;
    res.set('Content-Type', 'text/html');
    return res.status(200).send(buildShareHtml({ title, description, image, url, redirectUrl, type: 'profile' }, req));
  } catch (e) {
    res.set('Content-Type', 'text/html');
    return res.status(200).send(buildShareHtml({
      title: 'Regaarder',
      description: 'Discover creators on Regaarder',
      url: `${WEB_URL}/share/profile`,
      redirectUrl: WEB_URL
    }, req));
  }
});

// --- Share count increment ---
app.post('/videos/:id/share', (req, res) => {
  try {
    const videoId = String(req.params.id || '').trim();
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const videos = readVideos();
    const idx = videos.findIndex(v => String(v.id) === videoId);
    if (idx === -1) return res.status(404).json({ error: 'Video not found' });
    videos[idx].shares = String(Number(videos[idx].shares || 0) + 1);
    writeVideos(videos);
    return res.json({ success: true, shares: Number(videos[idx].shares) });
  } catch (err) {
    console.error('POST /videos/:id/share error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Upload overlay media (video/image/gif) - for staff dashboard
app.post('/staff/upload-overlay-media', (req, res) => {
  upload.single('media')(req, res, function (err) {
    if (err) {
      console.error('overlay media upload error', err && err.message ? err.message : err);
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 100MB)' });
      if (err.message === 'Unsupported file type') return res.status(415).json({ error: 'Unsupported file type. Use images, GIFs, or videos.' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }

    try {
      if (!req.file) return res.status(400).json({ error: 'Missing file' });
      const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      return res.json({ success: true, url, filename: req.file.filename });
    } catch (err2) {
      console.error('overlay media upload error', err2);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// Upload intro video for creator profile
app.post('/creator/intro-video', authMiddleware, (req, res) => {
  // Use the multer middleware instance manually so we can handle errors nicely
  upload.single('video')(req, res, function (err) {
    if (err) {
      console.error('upload error', err && err.message ? err.message : err);
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large' });
      if (err.message === 'Unsupported file type') return res.status(415).json({ error: 'Unsupported file type' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }

    try {
      if (!req.file) return res.status(400).json({ error: 'Missing file' });
      const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      // For demo, attach to user record
      const users = readUsers();
      const idx = users.findIndex(u => u.id === req.user.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], introVideo: url };
        writeUsers(users);
      }
      return res.json({ success: true, url });
    } catch (err2) {
      console.error('intro-video upload error', err2);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// Upload profile image for creator (optional)
app.post('/creator/photo', authMiddleware, (req, res) => {
  // Accept any file field name to be tolerant of client mismatches during debugging
  upload.any()(req, res, function (err) {
    if (err) {
      console.error('photo upload error', err && err.message ? err.message : err);
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large' });
      if (err.message === 'Unsupported file type') return res.status(415).json({ error: 'Unsupported file type' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    // Debug: log request metadata to help diagnose Bad Request issues
    try {
      // multer.any() stores files in req.files array
      const foundFile = (req.files && req.files[0]) || req.file || null;
      const fileInfo = foundFile ? { fieldname: foundFile.fieldname, originalname: foundFile.originalname, mimetype: foundFile.mimetype, filename: foundFile.filename, size: foundFile.size } : null;
      console.debug('creator/photo received', { file: fileInfo, auth: req.headers.authorization || null, contentType: req.headers['content-type'], bodyKeys: Object.keys(req.body || {}) });
    } catch (logErr) {
      console.warn('creator/photo debug log failed', logErr);
    }
    try {
      const uploaded = (req.files && req.files[0]) || req.file || null;
      if (!uploaded) return res.status(400).json({ error: 'Missing file' });
      const url = `${req.protocol}://${req.get('host')}/uploads/${uploaded.filename}`;
      const mimeType = uploaded.mimetype || '';
      const users = readUsers();
      const idx = users.findIndex(u => u.id === req.user.id);
      if (idx !== -1) {
        // If uploaded file is an image, store as `image` for avatar; otherwise store under `document`.
        if (mimeType.startsWith('image/')) {
          users[idx] = { ...users[idx], image: url };
        } else {
          users[idx] = { ...users[idx], document: url };
        }
        writeUsers(users);
      }
      return res.json({ success: true, url, mimeType, field: uploaded.fieldname });
    } catch (err2) {
      console.error('photo upload error', err2);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// Complete creator onboarding: save profile fields and mark user as creator
app.post('/creator/complete', authMiddleware, (req, res) => {
  try {
    const body = req.body || {};
    const allowed = ['name', 'bio', 'tag', 'introVideo', 'image', 'social', 'price', 'tagline', 'handle', 'pricingType', 'categories'];
    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    const updated = { ...users[idx] };
    allowed.forEach(k => { if (typeof body[k] !== 'undefined') updated[k] = body[k]; });
    updated.isCreator = true;
    updated.creatorSince = new Date().toISOString();
    users[idx] = updated;
    writeUsers(users);
    const { passwordHash, ...publicUser } = updated;
    return res.json({ success: true, user: publicUser });
  } catch (err) {
    console.error('creator complete error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all published videos
app.get('/videos', (req, res) => {
  try {
    let videos = readVideos();
    const feed = req.query.feed; // 'trending' | 'recommended' | undefined
    const category = req.query.category;
    const user = tryGetUser(req); // helper to get user from token if present

    console.log(`GET /videos feed=${feed} category=${category} user=${user ? user.id : 'anon'}`);

    // Filter out hidden and deleted videos server-side
    videos = videos.filter(v => !v.hidden && !v.deleted);
    // Filter by category if provided
    if (category && category !== 'All') {
        videos = videos.filter(v => v.category === category);
    }

    if (feed && (feed.toLowerCase() === 'trending' || feed.toLowerCase() === 'trending now')) {
        // Algorithm: Velocity-based trending (Views + Engagement) / Time Decay
        // Customization: Boost fulfilled requests (videos with a requester)
        const now = Date.now();
        videos = videos.map(v => {
            const views = parseInt(v.views || 0);
            const likes = parseInt(v.likes || 0);
            const shares = parseInt(v.shares || 0);
            const comments = parseInt(v.comments || 0);
            const isRequest = v.requester ? 1 : 0; // Boost demand-driven content

            const ageHours = Math.max(0.1, (now - (v.timestamp || now)) / (1000 * 60 * 60));
            
            // Score = (Engagement + Views/10) / Age^1.5
            // Heavy weight on shares and comments (virality)
            const score = ((likes * 2) + (shares * 5) + (comments * 3) + (views * 0.1) + (isRequest * 50)) / Math.pow(ageHours + 2, 1.5);
            return { ...v, score };
        }).sort((a, b) => b.score - a.score);

    } else if (feed && (feed.toLowerCase() === 'recommended')) {
        // Algorithm: Personalized Recommendation
        // 1. Filter out watched videos (optional, maybe just downrank)
        // 2. Boost based on User History (Category/Author affinity)
        // 3. Fallback to trending/fresh for cold start
        
        let watchedIds = new Set();
        let affinity = { authors: {}, categories: {} };

        if (user || req.query.userId) {
             const userId = user ? user.id : (req.query.userId || 'anonymous');
             const history = readWatchHistory().filter(h => String(h.userId) === String(userId));
             
             history.forEach(h => {
                 if (h.isComplete || h.duration > 30 || (h.lastWatchedTime / h.duration) > 0.5) {
                     watchedIds.add(h.videoId);
                 }
                 // Build affinity profile
                 const vid = videos.find(v => v.id === h.videoId || v.videoUrl === h.videoId);
                 if (vid) {
                     if (vid.authorId) affinity.authors[vid.authorId] = (affinity.authors[vid.authorId] || 0) + 1;
                     if (vid.category) affinity.categories[vid.category] = (affinity.categories[vid.category] || 0) + 1;
                 }
             });
        }

        videos = videos.map(v => {
            let score = 0;
            // Base score from popularity (log scale to dampen superstars)
            score += Math.log10(parseInt(v.views || 0) + 1);

            // Personalization boosts
            if (v.authorId && affinity.authors[v.authorId]) score += (affinity.authors[v.authorId] * 5);
            if (v.category && affinity.categories[v.category]) score += (affinity.categories[v.category] * 3);

            // Freshness boost
            const ageHours = Math.max(0, (Date.now() - (v.timestamp || Date.now())) / (1000 * 60 * 60));
            if (ageHours < 24) score += 10;
            else if (ageHours < 48) score += 5;

            // Penalty for already watched (but don't hide completely, just downrank)
            if (watchedIds.has(v.id) || watchedIds.has(v.videoUrl)) score -= 50; 

            return { ...v, score };
        }).sort((a, b) => b.score - a.score);
    }
    
    // Default / fallback: simple sort by date if no feed specified or unknown
    else {
        // Default to reverse chronological
        videos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    return res.json({ success: true, videos });
  } catch (err) {
    console.error('get videos error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get a single video by ID (including fresh ads data)
app.get('/videos/:id', (req, res) => {
  try {
    const videoId = req.params.id;
    console.log(`GET /videos/${videoId}`);
    
    const videos = readVideos();
    const video = videos.find(v => String(v.id) === String(videoId));
    
    if (!video) {
      console.log(`Video not found: ${videoId}`);
      return res.status(404).json({ error: 'Video not found' });
    }

    // Don't serve hidden/deleted videos via direct ID lookup
    if (video.hidden || video.deleted) {
      console.log(`Video ${videoId} is hidden/deleted`);
      return res.status(404).json({ error: 'Video not found' });
    }
    
    console.log(`Found video: ${video.title}, ads:`, video.ads);
    return res.json(video);
  } catch (err) {
    console.error('get video by id error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Publish a new video
app.post('/videos/publish', (req, res) => {
  try {
    console.log('POST /videos/publish received');
    console.log('Request body:', req.body);
    
    const { title, thumbnail, videoUrl, category, format, time, requester, overlays } = req.body;
    
    // Try to get authenticated user, otherwise use default
    let author = 'Anonymous';
    let authorId = 'anonymous';
    
    // Check if user is authenticated
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const users = readUsers();
      const user = users.find(u => u.token === token);
      if (user) {
        author = user.name || user.email;
        authorId = user.email;
        console.log('Authenticated user:', author);
      }
    }
    
    if (!title) {
      console.log('ERROR: Title is missing');
      return res.status(400).json({ error: 'Title is required' });
    }

    // Validate that URLs are not blob URLs (they won't work across sessions)
    // If blob URLs are provided, use placeholders instead
    let finalThumbnail = thumbnail;
    let finalVideoUrl = videoUrl;
    
    if (thumbnail && thumbnail.startsWith('blob:')) {
      console.log('WARNING: Blob URL provided for thumbnail, using placeholder');
      finalThumbnail = null; // Will use default placeholder in the video object
    }
    
    if (videoUrl && videoUrl.startsWith('blob:')) {
      console.log('WARNING: Blob URL provided for video, setting to null');
      finalVideoUrl = null;
    }

    const videos = readVideos();
    console.log('Current videos count:', videos.length);
    
    // Generate unique ID by combining timestamp with random string
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newVideo = {
      id: uniqueId,
      title,
      author: author,
      authorId: authorId,
      requester: requester || null,
      time: time || '0:00',
      imageUrl: finalThumbnail || 'https://placehold.co/600x400/333333/ffffff?text=Video',
      videoUrl: finalVideoUrl || null,
      date: 'Just now',
      category: category || 'General',
      format: format || 'one-time',
      appearance: 'public',  // Videos published are public by default
      pinned: false,
      pinnedDays: null,
      bookmarked: false,
      timestamp: Date.now(),
      // Initialize stats at zero
      likes: '0',
      dislikes: '0',
      views: '0',
      comments: '0',
      shares: '0',
      retentionRate: '0',
      retentionPercentage: '0%',
      // Add overlays if provided
      overlays: Array.isArray(overlays) && overlays.length > 0 ? overlays : []
    };

    videos.unshift(newVideo);
    console.log('Writing videos, new count:', videos.length);
    writeVideos(videos);
    
    // Update streak for the author if authenticated
    if (authorId && authorId !== 'anonymous') {
        const users = readUsers(); // Re-read to get ID if we only have email
        const user = users.find(u => u.email === authorId || u.id === authorId);
        if (user) updateStreak(user.id);
    }
    
    console.log('Video published successfully:', newVideo.title);

    return res.json({ success: true, video: newVideo });
  } catch (err) {
    console.error('publish video error', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// Delete a published video
app.delete('/videos/:id', authMiddleware, (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const user = req.user;
    const videos = readVideos();
    
    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Only allow the author to delete their own video
    if (videos[videoIndex].authorId !== user.email) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    videos.splice(videoIndex, 1);
    writeVideos(videos);

    return res.json({ success: true });
  } catch (err) {
    console.error('delete video error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Follow a creator
app.post('/follow', authMiddleware, (req, res) => {
  try {
    const { creatorId } = req.body;
    if (!creatorId) return res.status(400).json({ error: 'Missing creatorId' });

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    // Find creator by id, email, or name
    const creator = users.find(u => 
      u.id === creatorId || 
      u.email === creatorId || 
      u.name === creatorId
    );
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    // Initialize following array if it doesn't exist
    if (!users[userIndex].following) {
      users[userIndex].following = [];
    }

    // Check if already following (use creator's ID for consistency)
    if (users[userIndex].following.includes(creator.id)) {
      return res.status(400).json({ error: 'Already following this creator' });
    }

    // Add to following list (use creator's ID)
    users[userIndex].following.push(creator.id);
    
    // Increment creator's follower count
    const creatorIndex = users.findIndex(u => u.id === creator.id);
    if (creatorIndex !== -1) {
      if (!users[creatorIndex].followers) {
        users[creatorIndex].followers = 0;
      }
      users[creatorIndex].followers = (users[creatorIndex].followers || 0) + 1;
    }
    
    writeUsers(users);

    return res.json({ success: true, creatorId: creator.id });
  } catch (err) {
    console.error('follow error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Unfollow a creator
app.post('/unfollow', authMiddleware, (req, res) => {
  try {
    const { creatorId } = req.body;
    if (!creatorId) return res.status(400).json({ error: 'Missing creatorId' });

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    // Find creator by id, email, or name
    const creator = users.find(u => 
      u.id === creatorId || 
      u.email === creatorId || 
      u.name === creatorId
    );
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    // Initialize following array if it doesn't exist
    if (!users[userIndex].following) {
      users[userIndex].following = [];
    }

    // Remove from following list (use creator's ID)
    users[userIndex].following = users[userIndex].following.filter(id => id !== creator.id);
    
    // Decrement creator's follower count
    const creatorIndex = users.findIndex(u => u.id === creator.id);
    if (creatorIndex !== -1) {
      if (!users[creatorIndex].followers) {
        users[creatorIndex].followers = 0;
      }
      users[creatorIndex].followers = Math.max(0, (users[creatorIndex].followers || 0) - 1);
    }
    
    writeUsers(users);

    return res.json({ success: true, creatorId: creator.id });
  } catch (err) {
    console.error('unfollow error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get following list with full creator details
app.get('/following', authMiddleware, (req, res) => {
  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const following = user.following || [];
    const creators = following.map(creatorId => {
      const creator = users.find(u => u.id === creatorId);
      if (!creator) return null;
      
      // Count videos for this creator
      const videos = readVideos();
      const videoCount = videos.filter(v => v.authorId === creator.email || v.authorId === creator.id).length;

      return {
        id: creator.id,
        name: creator.name || 'Anonymous',
        handle: creator.handle || creator.tag || creator.email?.split('@')[0] || 'user',
        videos: videoCount,
        avatar: creator.image || `https://placehold.co/40x40/64748B/FFFFFF?text=${(creator.name || 'U')[0]}`
      };
    }).filter(c => c !== null);

    return res.json({ following: creators });
  } catch (err) {
    console.error('get following error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Check if following a creator
app.get('/following/:creatorId', authMiddleware, (req, res) => {
  try {
    const { creatorId } = req.params;
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const following = user.following || [];
    const isFollowing = following.includes(creatorId);

    return res.json({ isFollowing });
  } catch (err) {
    console.error('check following error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update email for authenticated user
app.post('/me/email', authMiddleware, async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body || {};
    if (!newEmail || !currentPassword) return res.status(400).json({ error: 'Missing newEmail or currentPassword' });
    const emailLower = String(newEmail).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) return res.status(400).json({ error: 'Invalid email format' });

    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    // Check password
    const ok = await bcrypt.compare(currentPassword, users[idx].passwordHash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password' });

    // Ensure email not taken
    if (users.find(u => u.email === emailLower && u.id !== req.user.id)) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    users[idx] = { ...users[idx], email: emailLower };
    writeUsers(users);
    const { passwordHash, ...publicUser } = users[idx];
    return res.json({ success: true, user: publicUser });
  } catch (err) {
    console.error('change email error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update password for authenticated user
app.post('/me/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing currentPassword or newPassword' });
    if (String(newPassword).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, users[idx].passwordHash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password' });

    const hash = await bcrypt.hash(newPassword, 10);
    users[idx] = { ...users[idx], passwordHash: hash, passwordChangedAt: new Date().toISOString() };
    writeUsers(users);
    const { passwordHash, ...publicUser } = users[idx];
    return res.json({ success: true, user: publicUser });
  } catch (err) {
    console.error('change password error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Forgot Password / Reset Password ---
// In-memory store for reset codes (cleared on restart — acceptable for small-scale app)
const resetCodes = new Map(); // email -> { code, expiresAt }

// Configure SMTP transporter from env vars
function getMailTransporter() {
  if (!nodemailer) return null;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_SECURE === 'true'),
    auth: { user, pass }
  });
}

// Step 1: Request a password reset code
app.post('/forgot-password', async (req, res) => {
  try {
    const { email: rawEmail } = req.body || {};
    if (!rawEmail) return res.status(400).json({ error: 'Email is required' });
    const emailLower = String(rawEmail).trim().toLowerCase();
    const users = readUsers();
    const user = users.find(u => String(u.email || '').toLowerCase() === emailLower);
    // Always respond success to prevent email enumeration
    if (!user) return res.json({ success: true, message: 'If an account exists, a code was sent' });

    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    resetCodes.set(emailLower, { code, expiresAt });

    const transporter = getMailTransporter();
    if (transporter) {
      const fromAddr = process.env.SMTP_FROM || process.env.SMTP_USER;
      await transporter.sendMail({
        from: `"Regaarder" <${fromAddr}>`,
        to: emailLower,
        subject: 'Your Regaarder Password Reset Code',
        text: `Your password reset code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`,
        html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
          <h2 style="color:#333">Password Reset</h2>
          <p>Your verification code is:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:20px;background:#f5f5f5;border-radius:12px;margin:16px 0">${code}</div>
          <p style="color:#666;font-size:14px">This code expires in 10 minutes.</p>
          <p style="color:#999;font-size:12px">If you didn't request this, ignore this email.</p>
        </div>`
      });
      console.log(`Reset code sent to ${emailLower}`);
    } else {
      // No email configured — log code to console (dev fallback)
      console.log(`[DEV] Reset code for ${emailLower}: ${code}`);
    }

    return res.json({ success: true, message: 'If an account exists, a code was sent' });
  } catch (err) {
    console.error('POST /forgot-password error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Step 2: Verify the reset code
app.post('/verify-reset-code', (req, res) => {
  try {
    const { email: rawEmail, code } = req.body || {};
    if (!rawEmail || !code) return res.status(400).json({ error: 'Email and code are required' });
    const emailLower = String(rawEmail).trim().toLowerCase();
    const stored = resetCodes.get(emailLower);
    if (!stored) return res.status(400).json({ error: 'No reset code found. Request a new one.' });
    if (Date.now() > stored.expiresAt) {
      resetCodes.delete(emailLower);
      return res.status(400).json({ error: 'Code expired. Request a new one.' });
    }
    if (String(stored.code) !== String(code).trim()) {
      return res.status(400).json({ error: 'Incorrect code' });
    }
    // Code is valid — generate a one-time reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    resetCodes.set(emailLower, { ...stored, resetToken, tokenExpiresAt: Date.now() + 5 * 60 * 1000 });
    return res.json({ success: true, resetToken });
  } catch (err) {
    console.error('POST /verify-reset-code error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Step 3: Set new password with reset token
app.post('/reset-password', async (req, res) => {
  try {
    const { email: rawEmail, resetToken, newPassword } = req.body || {};
    if (!rawEmail || !resetToken || !newPassword) return res.status(400).json({ error: 'Missing fields' });
    if (String(newPassword).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const emailLower = String(rawEmail).trim().toLowerCase();
    const stored = resetCodes.get(emailLower);
    if (!stored || stored.resetToken !== resetToken) return res.status(400).json({ error: 'Invalid or expired reset token' });
    if (Date.now() > (stored.tokenExpiresAt || 0)) {
      resetCodes.delete(emailLower);
      return res.status(400).json({ error: 'Reset token expired. Start over.' });
    }
    const users = readUsers();
    const idx = users.findIndex(u => String(u.email || '').toLowerCase() === emailLower);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    const hash = await bcrypt.hash(newPassword, 10);
    users[idx] = { ...users[idx], passwordHash: hash, passwordChangedAt: new Date().toISOString() };
    writeUsers(users);
    resetCodes.delete(emailLower);
    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('POST /reset-password error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Watch History storage ---
const WATCH_FILE = path.join(PERSIST_DIR, 'watchhistory.json');
function readWatchHistory() {
  try {
    if (!fs.existsSync(WATCH_FILE)) return [];
    const raw = fs.readFileSync(WATCH_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) { console.error('readWatchHistory error', err); return []; }
}
function writeWatchHistory(list) {
  try { fs.writeFileSync(WATCH_FILE, JSON.stringify(list, null, 2), 'utf8'); } catch (err) { console.error('writeWatchHistory error', err); }
}
function tryGetUser(req) {
  try {
    const auth = req.headers.authorization || '';
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.slice(7).trim();
      const users = readUsers();
      const user = users.find(u => u.token === token);
      if (user) return { id: user.id, email: user.email, name: user.name };
    }
  } catch {}
  return null;
}
// Upsert watch progress
app.post('/watch/history', (req, res) => {
  try {
    const { videoId, userId: bodyUserId, lastWatchedTime = 0, duration = 0, timestamp, isComplete = false } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const user = tryGetUser(req);
    const userId = user ? user.id : (bodyUserId || 'anonymous');
    const ts = timestamp ? (typeof timestamp === 'string' ? timestamp : new Date(timestamp).toISOString()) : new Date().toISOString();
    const list = readWatchHistory();
    const idx = list.findIndex(e => String(e.videoId) === String(videoId) && String(e.userId || 'anonymous') === String(userId));
    const entry = { videoId, userId, lastWatchedTime: Number(lastWatchedTime) || 0, duration: Number(duration) || 0, timestamp: ts, isComplete: Boolean(isComplete) };
    if (idx >= 0) list[idx] = { ...list[idx], ...entry }; else list.unshift(entry);
    if (list.length > 2000) list.splice(2000);
    writeWatchHistory(list);

    // Compute aggregate retention rate for this video
    try {
      const videoDur = Number(duration) || 0;
      if (videoDur > 0) {
        const allWatches = list.filter(e => String(e.videoId) === String(videoId) && Number(e.duration) > 0);
        if (allWatches.length > 0) {
          const totalWatched = allWatches.reduce((sum, e) => sum + (Number(e.lastWatchedTime) || 0), 0);
          const totalDuration = allWatches.reduce((sum, e) => sum + (Number(e.duration) || 0), 0);
          const retPct = totalDuration > 0 ? Math.min(100, Math.round((totalWatched / totalDuration) * 100)) : 0;
          const videos = readVideos();
          const vi = videos.findIndex(v => String(v.id) === String(videoId));
          if (vi !== -1) {
            videos[vi].retentionRate = String(retPct);
            videos[vi].retentionPercentage = `${retPct}%`;
            writeVideos(videos);
          }
        }
      }
    } catch (e) { console.warn('Retention rate calc error:', e); }
    
    if (user) updateStreak(user.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('POST /watch/history error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Increment view count every time a video is opened/clicked
app.post('/videos/:id/view', (req, res) => {
  try {
    const videoId = String(req.params.id || '').trim();
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const videos = readVideos();
    const idx = videos.findIndex(v => String(v.id) === videoId);
    if (idx === -1) return res.status(404).json({ error: 'Video not found' });
    videos[idx].views = String(Number(videos[idx].views || 0) + 1);
    writeVideos(videos);
    // Also increment creator's total views
    try {
      const video = videos[idx];
      if (video.authorId || video.author || video.authorEmail) {
        const users = readUsers();
        const ci = users.findIndex(u =>
          u.id === video.authorId ||
          u.email === video.authorEmail ||
          (u.name && u.name.toLowerCase() === (video.author || '').toLowerCase())
        );
        if (ci !== -1) {
          users[ci].views = (users[ci].views || 0) + 1;
          writeUsers(users);
        }
      }
    } catch (e) { console.warn('Creator view increment error:', e); }
    return res.json({ success: true, views: Number(videos[idx].views) });
  } catch (err) {
    console.error('POST /videos/:id/view error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
// Get watch history for current user (token optional; falls back to anonymous)
app.get('/watch/history', (req, res) => {
  try {
    const user = tryGetUser(req);
    const qUser = req.query.userId || null;
    const userId = user ? user.id : (qUser || 'anonymous');
    const list = readWatchHistory().filter(e => String(e.userId || 'anonymous') === String(userId));
    return res.json({ success: true, history: list });
  } catch (err) {
    console.error('GET /watch/history error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
// Delete single entry
app.delete('/watch/history/:videoId', (req, res) => {
  try {
    const user = tryGetUser(req);
    const userId = user ? user.id : 'anonymous';
    const vid = req.params.videoId;
    let list = readWatchHistory();
    const before = list.length;
    list = list.filter(e => !(String(e.videoId) === String(vid) && String(e.userId || 'anonymous') === String(userId)));
    writeWatchHistory(list);
    return res.json({ success: true, removed: before - list.length });
  } catch (err) {
    console.error('DELETE /watch/history/:videoId error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
// Clear all for user
app.delete('/watch/history', (req, res) => {
  try {
    const user = tryGetUser(req);
    const userId = user ? user.id : 'anonymous';
    let list = readWatchHistory();
    const before = list.length;
    list = list.filter(e => String(e.userId || 'anonymous') !== String(userId));
    writeWatchHistory(list);
    return res.json({ success: true, removed: before - list.length });
  } catch (err) {
    console.error('DELETE /watch/history error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Bookmarks storage (per-user) ---
const BOOKMARKS_FILE = path.join(PERSIST_DIR, 'bookmarks.json');
function readBookmarks() {
  try { if (!fs.existsSync(BOOKMARKS_FILE)) return { segments: [], videos: [], requests: [] }; const raw = fs.readFileSync(BOOKMARKS_FILE, 'utf8'); const j = JSON.parse(raw || '{}'); return { segments: j.segments || [], videos: j.videos || [], requests: j.requests || [] }; } catch (e) { return { segments: [], videos: [], requests: [] }; }
}
function writeBookmarks(data) {
  try { const safe = { segments: data.segments || [], videos: data.videos || [], requests: data.requests || [] }; fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(safe, null, 2), 'utf8'); } catch (e) {}
}

function getUserIdOrAnon(req) { const u = tryGetUser(req); return u ? u.id : 'anonymous'; }

// Aggregate bookmarks for current user
app.get('/bookmarks', (req, res) => {
  try {
    const userId = getUserIdOrAnon(req);
    console.log('GET /bookmarks - userId:', userId, 'hasAuth:', !!req.headers.authorization);
    const all = readBookmarks();
    console.log('Total bookmarks in file - segments:', all.segments?.length, 'videos:', all.videos?.length, 'requests:', all.requests?.length);
    const segments = (all.segments || []).filter(b => String(b.userId||'anonymous') === String(userId));
    const videos = (all.videos || []).filter(b => String(b.userId||'anonymous') === String(userId));
    const requests = (all.requests || []).filter(b => String(b.userId||'anonymous') === String(userId));
    console.log('Filtered for user', userId, '- segments:', segments.length, 'videos:', videos.length, 'requests:', requests.length);
    if (requests.length > 0) {
      console.log('Returning request bookmarks:', requests.map(r => ({ id: r.id, requestId: r.requestId, userId: r.userId })));
    }
    return res.json({ success: true, segments, videos, requests });
  } catch (err) { console.error('GET /bookmarks error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Save a timestamped segment bookmark
app.post('/bookmarks/segments', (req, res) => {
  try {
    const userId = getUserIdOrAnon(req);
    const { videoUrl, label, startTime, endTime } = req.body || {};
    if (!videoUrl) return res.status(400).json({ error: 'Missing videoUrl' });
    const s = readBookmarks();
    const b = { id: `seg_${Date.now()}`, userId, videoUrl, label: label || '', startTime: Math.max(0, Number(startTime||0)), endTime: Math.max(0, Number(endTime||0)), createdAt: new Date().toISOString() };
    s.segments.unshift(b);
    // cap to reasonable size
    if (s.segments.length > 1000) s.segments.splice(1000);
    writeBookmarks(s);
    return res.json({ success: true, segment: b });
  } catch (err) { console.error('POST /bookmarks/segments error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Save a normal video bookmark
app.post('/bookmarks/videos', (req, res) => {
  try {
    const userId = getUserIdOrAnon(req);
    const { videoUrl, title, label } = req.body || {};
    if (!videoUrl) return res.status(400).json({ error: 'Missing videoUrl' });
    const s = readBookmarks();
    const b = { id: `vid_${Date.now()}`, userId, videoUrl, title: title || label || '', createdAt: new Date().toISOString() };
    s.videos.unshift(b);
    if (s.videos.length > 1000) s.videos.splice(1000);
    writeBookmarks(s);
    return res.json({ success: true, video: b });
  } catch (err) { console.error('POST /bookmarks/videos error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Remove a normal video bookmark for the current user by videoUrl
app.delete('/bookmarks/videos', (req, res) => {
  try {
    const userId = getUserIdOrAnon(req);
    const { videoUrl } = req.body || {};
    if (!videoUrl) return res.status(400).json({ error: 'Missing videoUrl' });
    const s = readBookmarks();
    const before = (s.videos || []).length;
    s.videos = (s.videos || []).filter(b => !(String(b.userId || 'anonymous') === String(userId) && String(b.videoUrl) === String(videoUrl)));
    writeBookmarks(s);
    return res.json({ success: true, removed: Math.max(0, before - (s.videos || []).length) });
  } catch (err) { console.error('DELETE /bookmarks/videos error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Save a request bookmark
app.post('/bookmarks/requests', (req, res) => {
  try {
    const userId = getUserIdOrAnon(req);
    const { requestId, title } = req.body || {};
    if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
    const s = readBookmarks();
    const b = { id: `req_${Date.now()}`, userId, requestId, title: title || '', createdAt: new Date().toISOString() };
    s.requests.unshift(b);
    if (s.requests.length > 1000) s.requests.splice(1000);
    writeBookmarks(s);
    return res.json({ success: true, request: b });
  } catch (err) { console.error('POST /bookmarks/requests error', err); return res.status(500).json({ error: 'Server error' }); }
});

// --- Reactions storage (per-user per-request) ---
const REQUEST_REACTIONS_FILE = path.join(PERSIST_DIR, 'request_reactions.json');
function readRequestReactions() {
  try { if (!fs.existsSync(REQUEST_REACTIONS_FILE)) return { likes: {}, dislikes: {} }; const raw = fs.readFileSync(REQUEST_REACTIONS_FILE, 'utf8'); const j = JSON.parse(raw || '{}'); return { likes: j.likes || {}, dislikes: j.dislikes || {} }; } catch (e) { return { likes: {}, dislikes: {} }; }
}
function writeRequestReactions(data) {
  try { const safe = { likes: data.likes || {}, dislikes: data.dislikes || {} }; fs.writeFileSync(REQUEST_REACTIONS_FILE, JSON.stringify(safe, null, 2), 'utf8'); } catch (e) {}
}

// Persist request reactions and aggregate counts
app.post('/requests/react', (req, res) => {
  try {
    const { requestId, action } = req.body || {};
    if (!requestId || !action) return res.status(400).json({ error: 'Missing requestId or action' });
    const user = tryGetUser(req);
    const userId = user ? user.id : 'anonymous';
    const reactions = readRequestReactions();
    const requests = readRequests();
    const idx = requests.findIndex(r => String(r.id) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });

    // Initialize maps
    reactions.likes[requestId] = reactions.likes[requestId] || {};
    reactions.dislikes[requestId] = reactions.dislikes[requestId] || {};

    let likesCount = Number(requests[idx].likes || 0);

    if (action === 'like') {
      // If previously liked do nothing; if previously disliked, clear it
      if (!reactions.likes[requestId][userId]) {
        reactions.likes[requestId][userId] = true;
        likesCount += 1;
      }
      if (reactions.dislikes[requestId][userId]) {
        delete reactions.dislikes[requestId][userId];
      }
    } else if (action === 'unlike') {
      if (reactions.likes[requestId][userId]) {
        delete reactions.likes[requestId][userId];
        likesCount = Math.max(0, likesCount - 1);
      }
    } else if (action === 'dislike') {
      reactions.dislikes[requestId][userId] = true;
      // If previously liked, undo like
      if (reactions.likes[requestId][userId]) {
        delete reactions.likes[requestId][userId];
        likesCount = Math.max(0, likesCount - 1);
      }
    } else if (action === 'undislike') {
      if (reactions.dislikes[requestId][userId]) delete reactions.dislikes[requestId][userId];
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Update aggregate likes count on the request
    requests[idx].likes = likesCount;
    writeRequests(requests);
    writeRequestReactions(reactions);

    return res.json({ success: true, requestId, action, likes: likesCount });
  } catch (err) {
    console.error('requests react error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get current user's reactions map (requires auth)
app.get('/requests/react/me', authMiddleware, (req, res) => {
  try {
    const reactions = readRequestReactions();
    const userId = req.user.id;
    const map = {};
    // Build compact map per request
    Object.keys(reactions.likes || {}).forEach(reqId => {
      if (reactions.likes[reqId][userId]) {
        map[reqId] = map[reqId] || {};
        map[reqId].isLiked = true;
      }
    });
    Object.keys(reactions.dislikes || {}).forEach(reqId => {
      if (reactions.dislikes[reqId][userId]) {
        map[reqId] = map[reqId] || {};
        map[reqId].isDisliked = true;
      }
    });
    return res.json({ success: true, reactions: map });
  } catch (err) {
    console.error('get reactions error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Payment session stub: update boosts and return success. works for new request creation too (no existing request)
app.post('/pay/create-session', (req, res) => {
  try {
    const { requestId, amount, provider } = req.body || {};
    // Allow payment without requestId for new creation flows
    if (!amount) return res.status(400).json({ error: 'Missing amount' });
    
    // If requestId is present, treat as boost
    if (requestId) {
        const requests = readRequests();
        const idx = requests.findIndex(r => String(r.id) === String(requestId));
        if (idx !== -1) {
            const prev = Number(requests[idx].boosts || 0);
            requests[idx].boosts = prev + Number(amount);
            writeRequests(requests);
        }
    }
    
    // For zero-amount requests, return success without URL
    if (amount <= 0) {
        return res.json({ success: true, provider: provider || 'unknown' });
    }
    
    // For paid requests, return Stripe checkout URL
    // TODO: Integrate actual Stripe API to generate checkout session
    // For now, return a mock success response that redirects to the app
    // In production this would be the Stripe checkout URL
    const rawOrigin = req.get('origin') || req.headers.referer || WEB_URL;
    const sanitizeOrigin = (value) => {
      try {
        const str = String(value || '').trim();
        if (!str) return WEB_URL;
        if (/localhost|127\.0\.0\.1|pwin\.onrender\.com/i.test(str)) return WEB_URL;
        return str;
      } catch {
        return WEB_URL;
      }
    };
    // Clean origin of trailing slash and avoid localhost/render defaults
    const origin = sanitizeOrigin(rawOrigin);
    const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    
    const mockCheckoutUrl = `${cleanOrigin}/ideas?payment_success=true&session_id=mock_session_${Date.now()}`;
    return res.json({ success: true, url: mockCheckoutUrl, provider: provider || 'unknown' });
  } catch (err) {
    console.error('create-session error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update request status and notify requester
app.post('/requests/:id/status', authMiddleware, (req, res) => {
  try {
    const requestId = req.params.id;
    const { step, message } = req.body || {};
    
    const requests = readRequests();
    const idx = requests.findIndex(r => String(r.id) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });
    
    const request = requests[idx];
    
    // Check if claimed by current user
    if (!request.claimed || !request.claimedBy || request.claimedBy.id !== req.user.id) {
       return res.status(403).json({ error: 'Not authorized to update this request' });
    }
    
    // Update step
    if (step) request.currentStep = step;
    request.updatedAt = new Date().toISOString();
    writeRequests(requests);
    
    // Notify requester
    if (request.createdBy) {
        // Construct notification message
        // steps are 1-based index in dashboard logic
        const stepsLabels = ['Request Received', 'Under Review', 'In Production', 'Preview Ready', 'Published', 'Completed'];
        const stepLabel = (typeof step === 'number' && step > 0 && step <= stepsLabels.length) ? stepsLabels[step-1] : step;
        
        const notifText = `Update for "${request.title}": ${stepLabel} ${message ? ' - ' + message : ''}`;
        
        const suggestion = {
          id: `n-${Date.now()}`,
          requestId: request.id,
          text: notifText,
          from: { id: req.user.id, name: req.user.name || req.user.email },
          to: { id: request.createdBy }, // Requester ID
          createdAt: new Date().toISOString(),
          type: 'status_update',
          metadata: { step, message }
        };
        
        const SUG_FILE = path.join(PERSIST_DIR, 'suggestions.json');
        let arr = [];
        try { if (fs.existsSync(SUG_FILE)) arr = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); } catch {}
        arr.unshift(suggestion);
        try { fs.writeFileSync(SUG_FILE, JSON.stringify(arr, null, 2), 'utf8'); } catch {}
    }

    return res.json({ success: true, currentStep: request.currentStep });
  } catch (err) {
    console.error('update status error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Video reactions storage (likes/dislikes per video per user)
const VIDEO_REACTIONS_FILE = path.join(PERSIST_DIR, 'video_reactions.json');
function readVideoReactions() { try { if (!fs.existsSync(VIDEO_REACTIONS_FILE)) return { likes: {}, dislikes: {} }; const raw = fs.readFileSync(VIDEO_REACTIONS_FILE, 'utf8'); const j = JSON.parse(raw || '{}'); return { likes: j.likes || {}, dislikes: j.dislikes || {} }; } catch (e) { return { likes: {}, dislikes: {} }; } }
function writeVideoReactions(data) { try { const safe = { likes: data.likes || {}, dislikes: data.dislikes || {} }; fs.writeFileSync(VIDEO_REACTIONS_FILE, JSON.stringify(safe, null, 2), 'utf8'); } catch (e) {} }

// Helper: find video index by flexible id/url/title matching
function findVideoIndexById(videoId) {
  try {
    const videos = readVideos();
    return videos.findIndex(v => String(v.id) === String(videoId) || String(v.url) === String(videoId) || String(v.videoUrl) === String(videoId) || String(v.src) === String(videoId) || String(v.title) === String(videoId));
  } catch (e) { return -1; }
}

// GET like/dislike status for a given video (checks token if provided)
app.get('/likes/status', (req, res) => {
  try {
    const videoId = req.query.videoId || null;
    if (!videoId) return res.json({ liked: false, disliked: false });
    const reactions = readVideoReactions();
    let liked = false;
    let disliked = false;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.slice(7).trim();
      const users = readUsers();
      const user = users.find(u => u.token === token);
      if (user) {
        liked = !!(reactions.likes[videoId] && reactions.likes[videoId][user.id]);
        disliked = !!(reactions.dislikes[videoId] && reactions.dislikes[videoId][user.id]);
      }
    }
    return res.json({ liked, disliked });
  } catch (err) { console.error('GET /likes/status error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Like/unlike endpoints (require auth)

// GET /likes — Return all video IDs liked by the authenticated user
app.get('/likes', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const reactions = readVideoReactions();
    const videos = readVideos();
    const likedVideoIds = [];

    // Iterate over all video reaction entries and collect where this user has a like
    for (const [videoId, likers] of Object.entries(reactions.likes || {})) {
      if (likers && likers[userId]) {
        likedVideoIds.push(videoId);
      }
    }

    // Enrich with video metadata for the frontend to rebuild its liked videos list
    const likes = likedVideoIds.map(vid => {
      const v = videos.find(x => String(x.id) === String(vid));
      return {
        videoId: vid,
        url: v ? (v.videoUrl || v.url || null) : null,
        title: v ? (v.title || null) : null,
        creatorName: v ? (v.author || v.creatorName || null) : null,
        imageUrl: v ? (v.thumbnail || v.imageUrl || null) : null,
        likedAt: new Date().toISOString()
      };
    });

    return res.json({ success: true, likes });
  } catch (err) { console.error('GET /likes error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.post('/likes', authMiddleware, (req, res) => {
  try {
    const { videoId } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const userId = req.user.id;
    const reactions = readVideoReactions();
    const videos = readVideos();
    const vidx = findVideoIndexById(videoId);

    reactions.likes[videoId] = reactions.likes[videoId] || {};
    reactions.dislikes[videoId] = reactions.dislikes[videoId] || {};

    let likesCount = Number((vidx !== -1 ? (videos[vidx].likes || 0) : 0)) || 0;
    let dislikesCount = Number((vidx !== -1 ? (videos[vidx].dislikes || 0) : 0)) || 0;

    if (!reactions.likes[videoId][userId]) {
      reactions.likes[videoId][userId] = true;
      likesCount += 1;
    }
    if (reactions.dislikes[videoId][userId]) {
      delete reactions.dislikes[videoId][userId];
      dislikesCount = Math.max(0, dislikesCount - 1);
    }

    writeVideoReactions(reactions);
    if (vidx !== -1) {
      videos[vidx].likes = String(likesCount);
      videos[vidx].dislikes = String(dislikesCount);
      writeVideos(videos);
    }

    return res.json({ success: true, likes: likesCount, dislikes: dislikesCount });
  } catch (err) { console.error('POST /likes error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.delete('/likes', authMiddleware, (req, res) => {
  try {
    const { videoId } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const userId = req.user.id;
    const reactions = readVideoReactions();
    const videos = readVideos();
    const vidx = findVideoIndexById(videoId);

    reactions.likes[videoId] = reactions.likes[videoId] || {};

    let likesCount = Number((vidx !== -1 ? (videos[vidx].likes || 0) : 0)) || 0;

    if (reactions.likes[videoId][userId]) {
      delete reactions.likes[videoId][userId];
      likesCount = Math.max(0, likesCount - 1);
    }

    writeVideoReactions(reactions);
    if (vidx !== -1) {
      videos[vidx].likes = String(likesCount);
      writeVideos(videos);
    }

    return res.json({ success: true, likes: likesCount });
  } catch (err) { console.error('DELETE /likes error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Dislike/un-dislike endpoints (require auth)
app.post('/dislikes', authMiddleware, (req, res) => {
  try {
    const { videoId } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const userId = req.user.id;
    const reactions = readVideoReactions();
    const videos = readVideos();
    const vidx = findVideoIndexById(videoId);

    reactions.likes[videoId] = reactions.likes[videoId] || {};
    reactions.dislikes[videoId] = reactions.dislikes[videoId] || {};

    let likesCount = Number((vidx !== -1 ? (videos[vidx].likes || 0) : 0)) || 0;
    let dislikesCount = Number((vidx !== -1 ? (videos[vidx].dislikes || 0) : 0)) || 0;

    if (!reactions.dislikes[videoId][userId]) {
      reactions.dislikes[videoId][userId] = true;
      dislikesCount += 1;
    }
    if (reactions.likes[videoId][userId]) {
      delete reactions.likes[videoId][userId];
      likesCount = Math.max(0, likesCount - 1);
    }

    writeVideoReactions(reactions);
    if (vidx !== -1) {
      videos[vidx].likes = String(likesCount);
      videos[vidx].dislikes = String(dislikesCount);
      writeVideos(videos);
    }

    return res.json({ success: true, likes: likesCount, dislikes: dislikesCount });
  } catch (err) { console.error('POST /dislikes error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.delete('/dislikes', authMiddleware, (req, res) => {
  try {
    const { videoId } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const userId = req.user.id;
    const reactions = readVideoReactions();
    const videos = readVideos();
    const vidx = findVideoIndexById(videoId);

    reactions.dislikes[videoId] = reactions.dislikes[videoId] || {};

    let dislikesCount = Number((vidx !== -1 ? (videos[vidx].dislikes || 0) : 0)) || 0;

    if (reactions.dislikes[videoId][userId]) {
      delete reactions.dislikes[videoId][userId];
      dislikesCount = Math.max(0, dislikesCount - 1);
    }

    writeVideoReactions(reactions);
    if (vidx !== -1) {
      videos[vidx].dislikes = String(dislikesCount);
      writeVideos(videos);
    }

    return res.json({ success: true, dislikes: dislikesCount });
  } catch (err) { console.error('DELETE /dislikes error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Unclaim a request - remove creator's claim and revert request to claimable state
app.delete('/claims', authMiddleware, (req, res) => {
  try {
    const body = req.body || {};
    const requestId = body.requestId || body.title; // Try to match by ID first, then fall back to title
    const userId = req.user.id;

    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId or title' });
    }

    const requests = readRequests();
    let idx = -1;

    // Try to find by ID first (preferred method)
    if (body.requestId) {
      idx = requests.findIndex(r => String(r.id) === String(body.requestId));
    }
    
    // Fall back to title match if ID not found
    if (idx === -1 && body.title) {
      idx = requests.findIndex(r => r.title === body.title);
    }

    if (idx === -1) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requests[idx];

    // Verify the request is claimed by the current user
    if (!request.claimed || !request.claimedBy || request.claimedBy.id !== userId) {
      return res.status(403).json({ error: 'You have not claimed this request' });
    }

    // Remove the claim
    request.claimed = false;
    request.claimedBy = null;
    request.claimedAt = null;
    
    writeRequests(requests);
    console.log(`Request ${request.id} (${request.title}) unclaimed by user ${userId}`);

    return res.json({ success: true, request });
  } catch (err) {
    console.error('DELETE /claims error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ===== STAFF ADMIN ENDPOINTS =====
const STAFF_FILE = path.join(PERSIST_DIR, 'staff.json');

const readStaff = () => {
  try {
    const data = fs.readFileSync(STAFF_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading staff.json:', err);
    return { employees: [], pendingAccounts: [], reports: [], shadowDeleted: [], notifications: [] };
  }
};

const writeStaff = (data) => {
  try {
    fs.writeFileSync(STAFF_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing staff.json:', err);
  }
};

// Staff Login - verify 3 passwords
app.post('/staff/login', (req, res) => {
  try {
    const { employeeId, password1, password2, password3 } = req.body;
    
    if (!employeeId || !password1 || !password2 || !password3) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const staff = readStaff();
    const employee = staff.employees.find(e => e.id === parseInt(employeeId));

    if (!employee) {
      return res.status(401).json({ error: 'Employee not found' });
    }

    // Check if account is blocked
    if (employee.status === 'blocked') {
      return res.status(403).json({ 
        error: 'Account blocked',
        blocked: true,
        message: employee.blockMessage || 'Your account has been blocked by an administrator. Please contact support if you believe this is an error.'
      });
    }

    if (employee.status !== 'active' && employee.status !== 'approved') {
      return res.status(401).json({ error: 'Account inactive or pending approval' });
    }

    // Check all 3 passwords
    const pwd1Match = password1 === employee.passwords[0];
    const pwd2Match = password2 === employee.passwords[1];
    const pwd3Match = password3 === employee.passwords[2];

    if (!pwd1Match || !pwd2Match || !pwd3Match) {
      return res.status(401).json({ error: 'Incorrect credentials' });
    }

    return res.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        permissions: employee.permissions || {},
        isAdmin: employee.approvalAuthority || false
      }
    });
  } catch (err) {
    console.error('Staff login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Check account approval status
app.post('/staff/check-account-status', (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const staff = readStaff();
    
    // Check if account is already approved
    const approved = staff.employees.find(e => e.email === email);
    if (approved) {
      return res.json({ 
        status: 'approved',
        employeeId: approved.id,
        message: 'Account has been approved!'
      });
    }
    
    // Check if still pending
    const pending = staff.pendingAccounts.find(p => p.email === email);
    if (pending) {
      return res.json({ 
        status: 'pending',
        message: 'Account request is pending. Awaiting staff approval.'
      });
    }
    
    // Check notifications for denial
    if (staff.notifications) {
      const denial = staff.notifications.find(n => 
        n.metadata?.isDenial && 
        n.metadata?.denialEmail === email
      );
      if (denial) {
        return res.json({ 
          status: 'denied',
          message: denial.message
        });
      }
    }
    
    return res.json({ 
      status: 'not_found',
      message: 'Account not found.'
    });
  } catch (err) {
    console.error('Check account status error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Create staff account (requires approval)
// Get next available Employee ID (for new account signup)
app.get('/staff/next-employee-id', (req, res) => {
  try {
    const staff = readStaff();
    
    // Find the highest existing employee ID
    let maxId = 1000; // Start from 1000
    
    staff.employees.forEach(e => {
      if (e.id > maxId) maxId = e.id;
    });
    
    staff.pendingAccounts.forEach(p => {
      if (p.employeeId > maxId) maxId = p.employeeId;
    });
    
    const nextId = maxId + 1;
    return res.json({ nextEmployeeId: nextId });
  } catch (err) {
    console.error('Get next employee ID error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/staff/create-account', (req, res) => {
  try {
    const { password1, password2, password3, name, email } = req.body;

    if (!password1 || !password2 || !password3 || !name || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const staff = readStaff();

    // Auto-generate next employee ID
    let maxId = 1000; // Start from 1000
    
    staff.employees.forEach(e => {
      if (e.id > maxId) maxId = e.id;
    });
    
    staff.pendingAccounts.forEach(p => {
      if (p.employeeId > maxId) maxId = p.employeeId;
    });
    
    const newEmployeeId = maxId + 1;

    // Create pending account with auto-generated ID
    const newPending = {
      employeeId: newEmployeeId,
      name,
      email,
      passwords: [password1, password2, password3],
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    staff.pendingAccounts.push(newPending);
    writeStaff(staff);

    return res.json({ success: true, message: 'Account request submitted for approval', employeeId: newEmployeeId });
  } catch (err) {
    console.error('Create account error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get pending accounts (admin only - ID 1000)
app.get('/staff/pending-accounts', (req, res) => {
  try {
    const { employeeId } = req.query;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const staff = readStaff();
    return res.json({ pendingAccounts: staff.pendingAccounts });
  } catch (err) {
    console.error('Get pending accounts error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Approve/Deny account (admin/approval authority only)
app.post('/staff/approve-account', (req, res) => {
  try {
    const { employeeId, pendingId, approve, permissions = {}, grantAdminAccess = false, denialReason = '', approvalInstructions = '' } = req.body;

    const staff = readStaff();
    const approver = staff.employees.find(e => e.id === parseInt(employeeId));

    // Check authorization: must be admin (1000) or have approval permissions
    if (!approver || (!approver.approvalAuthority && parseInt(employeeId) !== 1000)) {
      return res.status(403).json({ error: 'Unauthorized: you do not have approval authority' });
    }

    const pendingIdx = staff.pendingAccounts.findIndex(p => p.employeeId === parseInt(pendingId));
    if (pendingIdx === -1) {
      return res.status(404).json({ error: 'Pending account not found' });
    }

    const pending = staff.pendingAccounts[pendingIdx];
    let assignedEmployeeId = pending.employeeId;

    if (approve) {
      // Assign sequential employee ID if admin or auto-assign enabled
      if (parseInt(employeeId) === 1000 || pending.autoAssignId) {
        assignedEmployeeId = Math.max(1000, ...staff.employees.map(e => e.id)) + 1;
      }

      // Create new employee with permissions
      const newEmployee = {
        id: assignedEmployeeId,
        name: pending.name,
        email: pending.email,
        role: grantAdminAccess ? 'administrator' : 'moderator',
        passwords: pending.passwords,
        createdAt: new Date().toISOString(),
        status: 'active',
        permissions: permissions || {
          videos: true,
          requests: true,
          comments: true,
          reports: true,
          users: true,
          creators: true,
          shadowDeleted: true,
          approvals: false,
          promotions: false,
          templates: true,
          ads: false
        },
        approvalAuthority: grantAdminAccess || false,
        approvedBy: parseInt(employeeId),
        approvedAt: new Date().toISOString()
      };

      staff.employees.push(newEmployee);

      // Create notification for the new employee with approval instructions
      const notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: assignedEmployeeId,
        type: 'staff_action',
        title: 'Account Approved',
        message: `Your account has been approved! Your Employee ID is ${assignedEmployeeId}.`,
        metadata: {
          approvedBy: approver.name,
          permissions: permissions,
          employeeId: assignedEmployeeId,
          instructions: approvalInstructions,
          isApprovalInstructions: true
        },
        read: false,
        createdAt: new Date().toISOString()
      };

      if (!staff.notifications) staff.notifications = [];
      staff.notifications.push(notification);
    } else {
      // Create denial notification with reason
      const notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: pending.employeeId,
        type: 'staff_action',
        title: 'Account Denied',
        message: denialReason || 'Your account request has been denied.',
        metadata: {
          deniedBy: approver.name,
          denialReason: denialReason,
          denialEmail: pending.email,
          isDenial: true
        },
        read: false,
        createdAt: new Date().toISOString()
      };

      if (!staff.notifications) staff.notifications = [];
      staff.notifications.push(notification);
    }

    // Remove from pending
    staff.pendingAccounts.splice(pendingIdx, 1);
    writeStaff(staff);

    return res.json({ 
      success: true, 
      message: approve ? 'Account approved' : 'Account denied',
      employeeId: assignedEmployeeId 
    });
  } catch (err) {
    console.error('Approve account error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update staff member permissions (admin only)
app.post('/staff/update-permissions', (req, res) => {
  try {
    const { employeeId, targetEmployeeId, permissions, grantAdminAccess, blocked } = req.body;

    if (!employeeId || !targetEmployeeId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const staff = readStaff();
    const admin = staff.employees.find(e => e.id === parseInt(employeeId));

    // Check authorization: must be admin (1000) or have approval authority
    if (!admin || (!admin.approvalAuthority && parseInt(employeeId) !== 1000)) {
      return res.status(403).json({ error: 'Unauthorized: you do not have permission to modify staff' });
    }

    const targetEmployee = staff.employees.find(e => e.id === parseInt(targetEmployeeId));
    if (!targetEmployee) {
      return res.status(404).json({ error: 'Target employee not found' });
    }

    // Update permissions
    if (permissions) {
      targetEmployee.permissions = permissions;
    }

    // Update admin access
    if (grantAdminAccess !== undefined) {
      targetEmployee.approvalAuthority = grantAdminAccess;
      if (grantAdminAccess) {
        targetEmployee.role = 'administrator';
      } else {
        targetEmployee.role = 'moderator';
      }
    }

    // Handle blocking/unblocking
    if (blocked !== undefined) {
      const wasBlocked = targetEmployee.status === 'blocked';
      targetEmployee.status = blocked ? 'blocked' : 'approved';
      
      // If blocking the user, add a notification/message they'll see on login attempt
      if (blocked && !wasBlocked) {
        targetEmployee.blockedAt = new Date().toISOString();
        targetEmployee.blockedBy = parseInt(employeeId);
        targetEmployee.blockMessage = 'Your account has been blocked by an administrator. Please contact support if you believe this is an error.';
      } else if (!blocked && wasBlocked) {
        // Unblocking - clear block info
        delete targetEmployee.blockedAt;
        delete targetEmployee.blockedBy;
        delete targetEmployee.blockMessage;
      }
    }

    // Add audit log
    targetEmployee.lastPermissionUpdate = {
      updatedBy: parseInt(employeeId),
      updatedAt: new Date().toISOString(),
      grantedAdminAccess: grantAdminAccess,
      permissions: permissions,
      blocked: blocked
    };

    writeStaff(staff);

    return res.json({ 
      success: true, 
      message: blocked ? 'Staff member has been blocked' : 'Staff permissions updated successfully',
      employee: targetEmployee 
    });
  } catch (err) {
    console.error('Update staff permissions error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get staff member permissions endpoint
app.get('/staff/member/:memberId', (req, res) => {
  try {
    const { employeeId } = req.query;
    const targetMemberId = req.params.memberId;

    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const staff = readStaff();
    const requester = staff.employees.find(e => e.id === parseInt(employeeId));

    if (!requester) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only allow admins or approval authority to view other members' details
    if (parseInt(employeeId) !== 1000 && !requester.approvalAuthority) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const targetMember = staff.employees.find(e => e.id === parseInt(targetMemberId));
    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found' });
    }

    return res.json({ 
      success: true,
      member: {
        id: targetMember.id,
        name: targetMember.name,
        email: targetMember.email,
        role: targetMember.role,
        permissions: targetMember.permissions,
        approvalAuthority: targetMember.approvalAuthority,
        status: targetMember.status,
        createdAt: targetMember.createdAt
      }
    });
  } catch (err) {
    console.error('Get staff member error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// List all staff members (admin only)
app.get('/staff/all', (req, res) => {
  try {
    const { employeeId } = req.query;

    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const staff = readStaff();
    const requester = staff.employees.find(e => e.id === parseInt(employeeId));

    if (!requester || (!requester.approvalAuthority && parseInt(employeeId) !== 1000)) {
      return res.status(403).json({ error: 'Forbidden: you do not have permission to view all staff' });
    }

    const members = staff.employees.map(e => ({
      id: e.id,
      name: e.name,
      email: e.email,
      role: e.role,
      permissions: e.permissions,
      approvalAuthority: e.approvalAuthority,
      status: e.status,
      createdAt: e.createdAt,
      approvedBy: e.approvedBy
    }));

    return res.json({ success: true, members });
  } catch (err) {
    console.error('List staff members error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update staff member's own profile
app.post('/staff/update-profile', (req, res) => {
  try {
    const { employeeId, name, email, passwords } = req.body;

    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const staff = readStaff();
    const employee = staff.employees.find(e => e.id === parseInt(employeeId));

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Update name if provided
    if (name && name.trim()) {
      employee.name = name.trim();
    }

    // Update email if provided
    if (email && email.trim()) {
      employee.email = email.trim();
    }

    // Update passwords if provided
    if (passwords && Array.isArray(passwords) && passwords.length > 0) {
      // Replace all passwords with new ones
      employee.passwords = passwords.filter(p => p && p.trim()).map(p => p.trim());
      employee.updatedPasswordAt = new Date().toISOString();
    }

    employee.lastUpdated = new Date().toISOString();
    writeStaff(staff);

    return res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        passwords: employee.passwords || [],
        permissions: employee.permissions,
        approvalAuthority: employee.approvalAuthority,
        status: employee.status
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get staff member's own profile
app.get('/staff/profile', (req, res) => {
  try {
    const { employeeId } = req.query;

    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const staff = readStaff();
    const employee = staff.employees.find(e => e.id === parseInt(employeeId));

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    return res.json({ 
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        permissions: employee.permissions,
        approvalAuthority: employee.approvalAuthority,
        status: employee.status,
        createdAt: employee.createdAt,
        passwordCount: (employee.passwords || []).length,
        lastUpdated: employee.lastUpdated,
        updatedPasswordAt: employee.updatedPasswordAt
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get report queue
app.get('/staff/reports', (req, res) => {
  try {
    const { employeeId } = req.query;
    
    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const staff = readStaff();
    const employee = staff.employees.find(e => e.id === parseInt(employeeId));

    if (!employee) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.json({ reports: staff.reports || [] });
  } catch (err) {
    console.error('Get reports error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Report video
app.post('/videos/:id/report', (req, res) => {
  try {
    const { videoId, reason, reportedBy } = req.body;
    const staff = readStaff();

    const report = {
      id: `report-${Date.now()}`,
      videoId: videoId || req.params.id,
      reason,
      reportedBy,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    if (!staff.reports) staff.reports = [];
    staff.reports.push(report);
    writeStaff(staff);

    return res.json({ success: true, report });
  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Shadow delete video (hides without permanent deletion)
app.post('/staff/shadow-delete/:videoId', (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const videoId = req.params.videoId;

    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
    const video = videos.find(v => v.id === videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Mark as shadow deleted
    video.shadowDeleted = true;
    video.shadowDeletedBy = parseInt(employeeId);
    video.shadowDeletedAt = new Date().toISOString();
    video.shadowDeleteReason = reason;

    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2));

    // Track in staff file
    const staff = readStaff();
    if (!staff.shadowDeleted) staff.shadowDeleted = [];
    staff.shadowDeleted.push({
      videoId,
      deletedBy: parseInt(employeeId),
      reason,
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    return res.json({ success: true, message: 'Video shadow deleted' });
  } catch (err) {
    console.error('Shadow delete error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get user history (how many times flagged)
app.get('/staff/user-history/:userId', (req, res) => {
  try {
    const { employeeId } = req.query;
    
    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const staff = readStaff();
    const userId = req.params.userId;
    
    const userReports = (staff.reports || []).filter(r => r.reportedBy === userId || r.videoId.includes(userId));
    const flagCount = userReports.length;

    return res.json({
      userId,
      flagCount,
      reports: userReports
    });
  } catch (err) {
    console.error('User history error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all videos (admin)
app.get('/staff/videos', (req, res) => {
  try {
    const { employeeId } = req.query;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
    const staff = readStaff();

    // Attach report counts to each video
    const videosWithReports = videos.map(video => {
      const videoReports = staff.reports ? staff.reports.filter(r => r.videoId === video.id) : [];
      return {
        ...video,
        reportCount: videoReports.length,
        reports: videoReports
      };
    });

    return res.json({ videos: videosWithReports });
  } catch (err) {
    console.error('Get videos error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (admin) 
app.get('/staff/users', (req, res) => {
  try {
    const { employeeId } = req.query;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete video (admin)
app.delete('/staff/delete-video/:videoId', (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const videoId = req.params.videoId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
    const videoIndex = videos.findIndex(v => v.id === videoId);

    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const deletedVideo = videos.splice(videoIndex, 1)[0];
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2));

    // Log deletion
    const staff = readStaff();
    if (!staff.deletionLog) staff.deletionLog = [];
    staff.deletionLog.push({
      type: 'video',
      id: videoId,
      reason,
      deletedBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    return res.json({ success: true, message: 'Video deleted' });
  } catch (err) {
    console.error('Delete video error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Hide video (admin)
app.post('/staff/hide-video/:videoId', (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const videoId = req.params.videoId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
    const video = videos.find(v => v.id === videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    video.hidden = true;
    video.hiddenReason = reason;
    video.hiddenBy = parseInt(employeeId);
    video.hiddenAt = new Date().toISOString();
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2));

    // Log hiding
    const staff = readStaff();
    if (!staff.hiddenLog) staff.hiddenLog = [];
    staff.hiddenLog.push({
      type: 'video',
      id: videoId,
      reason,
      hiddenBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    return res.json({ success: true, message: 'Video hidden' });
  } catch (err) {
    console.error('Hide video error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all requests (admin)
app.get('/staff/requests', (req, res) => {
  try {
    const { employeeId } = req.query;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
    return res.json({ requests });
  } catch (err) {
    console.error('Get requests error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete request (admin)
app.delete('/staff/delete-request/:requestId', (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const requestId = req.params.requestId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const deletedRequest = requests.splice(requestIndex, 1)[0];
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));

    // Log deletion
    const staff = readStaff();
    if (!staff.deletionLog) staff.deletionLog = [];
    staff.deletionLog.push({
      type: 'request',
      id: requestId,
      reason,
      deletedBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    return res.json({ success: true, message: 'Request deleted' });
  } catch (err) {
    console.error('Delete request error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Hide request (admin)
app.post('/staff/hide-request/:requestId', (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const requestId = req.params.requestId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
    const request = requests.find(r => r.id === requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.hidden = true;
    request.hiddenReason = reason;
    request.hiddenBy = parseInt(employeeId);
    request.hiddenAt = new Date().toISOString();
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));

    // Log hiding
    const staff = readStaff();
    if (!staff.hiddenLog) staff.hiddenLog = [];
    staff.hiddenLog.push({
      type: 'request',
      id: requestId,
      reason,
      hiddenBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    return res.json({ success: true, message: 'Request hidden' });
  } catch (err) {
    console.error('Hide request error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all comments (admin)
app.get('/staff/comments', (req, res) => {
  try {
    const { employeeId } = req.query;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const comments = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf8'));
    return res.json({ comments });
  } catch (err) {
    console.error('Get comments error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment (admin)
app.delete('/staff/delete-comment/:commentId', (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const commentId = req.params.commentId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let comments = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf8'));
    const commentIndex = comments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const deletedComment = comments.splice(commentIndex, 1)[0];
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));

    // Log deletion
    const staff = readStaff();
    if (!staff.deletionLog) staff.deletionLog = [];
    staff.deletionLog.push({
      type: 'comment',
      id: commentId,
      reason,
      deletedBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    return res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Hide comment (admin)
app.post('/staff/hide-comment/:commentId', (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const commentId = req.params.commentId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let comments = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf8'));
    const comment = comments.find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.hidden = true;
    comment.hiddenReason = reason;
    comment.hiddenBy = parseInt(employeeId);
    comment.hiddenAt = new Date().toISOString();
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));

    // Log hiding
    const staff = readStaff();
    if (!staff.hiddenLog) staff.hiddenLog = [];
    staff.hiddenLog.push({
      type: 'comment',
      id: commentId,
      reason,
      hiddenBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    return res.json({ success: true, message: 'Comment hidden' });
  } catch (err) {
    console.error('Hide comment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update video metadata (admin only)
app.put('/staff/videos/:videoId', (req, res) => {
  try {
    const { employeeId, title, description, tags, overlays } = req.body;
    
    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
    const video = videos.find(v => v.id === req.params.videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (title) video.title = title;
    if (description) video.description = description;
    if (tags) video.tags = tags;
    if (Array.isArray(overlays)) video.overlays = overlays;
    video.modifiedBy = parseInt(employeeId);
    video.modifiedAt = new Date().toISOString();

    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2));

    return res.json({ success: true, video });
  } catch (err) {
    console.error('Update video error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Apply user action (warn, ban, shadow ban, delete) - admin only
app.post('/staff/user-action/:userId', (req, res) => {
  try {
    const { employeeId, action, reason } = req.body;
    const userId = req.params.userId;

    console.log(`User action request: userId=${userId}, action=${action}, employeeId=${employeeId}`);

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[userIndex];

    // Apply action based on type
    switch(action) {
      case 'warn':
        user.warnings = (user.warnings || 0) + 1;
        user.lastWarning = new Date().toISOString();
        break;
      case 'ban':
        user.status = 'banned';
        user.bannedAt = new Date().toISOString();
        user.bannedReason = reason;
        break;
      case 'shadowban':
        user.shadowBanned = true;
        user.shadowBannedAt = new Date().toISOString();
        user.shadowBanReason = reason;
        break;
      case 'delete':
        // Mark for deletion instead of permanently deleting
        user.status = 'deleted';
        user.deletedAt = new Date().toISOString();
        user.deletedReason = reason;
        break;
      default:
        console.log(`Unknown action: ${action}`);
        return res.status(400).json({ error: 'Invalid action type' });
    }

    users[userIndex] = user;
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));

    // Log action
    const staff = readStaff();
    if (!staff.userActions) staff.userActions = [];
    staff.userActions.push({
      type: 'user',
      userId: userId,
      action: action,
      reason: reason,
      actionBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    // Create a notification for the user who received the action
    const SUG_FILE = path.join(PERSIST_DIR, 'suggestions.json');
    let notifications = [];
    try { 
      if (fs.existsSync(SUG_FILE)) {
        notifications = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); 
      }
    } catch (e) { 
      console.error('Error reading notifications:', e);
    }

    // Build notification message based on action type
    let notificationMessage = '';
    let notificationTitle = '';
    let notificationIcon = '';

    switch(action) {
      case 'warn':
        notificationTitle = 'Warning Notice';
        notificationMessage = `Your account has received a warning for violating community guidelines.\n\nReason: ${reason}`;
        notificationIcon = 'warn';
        break;
      case 'ban':
        notificationTitle = 'Account Banned';
        notificationMessage = `Your account has been permanently banned for violating community guidelines.\n\nReason: ${reason}`;
        notificationIcon = 'ban';
        break;
      case 'shadowban':
        notificationTitle = 'Shadow Ban Applied';
        notificationMessage = `Your account visibility has been restricted due to community guideline violations.\n\nReason: ${reason}`;
        notificationIcon = 'shadowban';
        break;
      case 'delete':
        notificationTitle = 'Account Deleted';
        notificationMessage = `Your account has been permanently deleted due to severe community guideline violations.\n\nReason: ${reason}`;
        notificationIcon = 'delete';
        break;
    }

    // Add notification
    notifications.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      to: { id: userId, name: user.name },
      from: { id: 'staff', name: 'Moderation Team' },
      type: 'staff_action',
      action: action,
      title: notificationTitle,
      message: notificationMessage,
      icon: notificationIcon,
      reason: reason,
      createdAt: new Date().toISOString(),
      read: false,
      requiresAcknowledgment: true
    });

    fs.writeFileSync(SUG_FILE, JSON.stringify(notifications, null, 2));

    console.log(`User action applied: ${action} on user ${userId}`);
    return res.json({ success: true, message: `User ${action} applied`, user });
  } catch (err) {
    console.error('User action error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /staff/undo-user-action/:userId - Undo a user action
app.post('/staff/undo-user-action/:userId', (req, res) => {
  try {
    const { employeeId, action } = req.body;
    const userId = req.params.userId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[userIndex];

    // Undo action based on type
    switch(action) {
      case 'warn':
        user.warnings = Math.max(0, (user.warnings || 0) - 1);
        if (user.warnings === 0) {
          user.lastWarning = null;
        }
        break;
      case 'ban':
        user.status = 'active';
        user.bannedAt = null;
        user.bannedReason = null;
        break;
      case 'shadowban':
        user.shadowBanned = false;
        user.shadowBannedAt = null;
        user.shadowBanReason = null;
        break;
      case 'delete':
        user.status = 'active';
        user.deletedAt = null;
        user.deletedReason = null;
        break;
    }

    users[userIndex] = user;
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));

    // Log undo action
    const staff = readStaff();
    if (!staff.userActions) staff.userActions = [];
    staff.userActions.push({
      type: 'user_undo',
      userId: userId,
      action: action,
      undoneBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    // Remove the notification for the user
    const SUG_FILE = path.join(PERSIST_DIR, 'suggestions.json');
    let notifications = [];
    try { 
      if (fs.existsSync(SUG_FILE)) {
        notifications = JSON.parse(fs.readFileSync(SUG_FILE, 'utf8') || '[]'); 
      }
    } catch (e) { 
      console.error('Error reading notifications:', e);
    }

    // Remove notifications for this user action
    notifications = notifications.filter(n => 
      !(n.to && n.to.id === userId && n.action === action && n.type === 'staff_action')
    );

    fs.writeFileSync(SUG_FILE, JSON.stringify(notifications, null, 2));

    return res.json({ success: true, message: `User ${action} undone`, user });
  } catch (err) {
    console.error('Undo user action error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /reports - Submit a video/content report with optional evidence files
app.post('/reports', (req, res) => {
  try {
    const multer = require('multer');
    const upload = multer({ 
      storage: multer.diskStorage({
        destination: 'uploads/evidence',
        filename: (file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`)
      }),
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
    });

    // Create uploads/evidence directory if it doesn't exist
    const evPath = 'uploads/evidence';
    if (!fs.existsSync(evPath)) {
      fs.mkdirSync(evPath, { recursive: true });
    }

    // Handle file upload
    upload.array('evidenceFiles', 5)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: 'File upload failed: ' + err.message });
      }

      const { videoId, title, reason, reporterId, reporterEmail, time } = req.body;
      
      if (!videoId || !reason) {
        return res.status(400).json({ error: 'Missing videoId or reason' });
      }

      try {
        // Read current reports
        const staff = readStaff();
        if (!staff.reports) staff.reports = [];

        // Create report entry with evidence files
        const report = {
          id: `report_${Date.now()}`,
          videoId: videoId,
          title: title || '',
          reason: reason,
          reporterId: reporterId || 'anonymous',
          reporterEmail: reporterEmail || null,
          createdAt: new Date().toISOString(),
          status: 'pending',
          evidenceFiles: (req.files || []).map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            path: file.path,
            uploadedAt: new Date().toISOString()
          }))
        };

        staff.reports.push(report);
        writeStaff(staff);

        return res.json({ success: true, report });
      } catch (innerErr) {
        console.error('Report submission error:', innerErr);
        return res.status(500).json({ error: 'Failed to save report' });
      }
    });
  } catch (err) {
    console.error('Reports endpoint error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Undo hide video
app.post('/staff/undo-hide-video/:videoId', (req, res) => {
  try {
    const { employeeId } = req.body;
    const videoId = req.params.videoId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
    const video = videos.find(v => v.id === videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    video.hidden = false;
    video.hiddenReason = null;
    video.hiddenBy = null;
    video.hiddenAt = null;
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2));

    // Log undo
    const staff = readStaff();
    if (!staff.undoLog) staff.undoLog = [];
    staff.undoLog.push({
      type: 'video_unhide',
      id: videoId,
      undoneBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    return res.json({ success: true, message: 'Video unhidden', video });
  } catch (err) {
    console.error('Undo hide video error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete video permanently
app.post('/staff/delete-video/:videoId', (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const videoId = req.params.videoId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
    const video = videos.find(v => v.id === videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    video.deleted = true;
    video.deletedReason = reason;
    video.deletedBy = parseInt(employeeId);
    video.deletedAt = new Date().toISOString();
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2));

    // Log deletion
    const staff = readStaff();
    if (!staff.deletionLog) staff.deletionLog = [];
    staff.deletionLog.push({
      type: 'video',
      id: videoId,
      reason,
      deletedBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    return res.json({ success: true, message: 'Video deleted' });
  } catch (err) {
    console.error('Delete video error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Undo delete video
app.post('/staff/undo-delete-video/:videoId', (req, res) => {
  try {
    const { employeeId } = req.body;
    const videoId = req.params.videoId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
    const video = videos.find(v => v.id === videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    video.deleted = false;
    video.deletedReason = null;
    video.deletedBy = null;
    video.deletedAt = null;
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2));

    // Log undo
    const staff = readStaff();
    if (!staff.undoLog) staff.undoLog = [];
    staff.undoLog.push({
      type: 'video_undelete',
      id: videoId,
      undoneBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    return res.json({ success: true, message: 'Video restored', video });
  } catch (err) {
    console.error('Undo delete video error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Undo hide request
app.post('/staff/undo-hide-request/:requestId', (req, res) => {
  try {
    const { employeeId } = req.body;
    const requestId = req.params.requestId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
    const request = requests.find(r => r.id === requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.hidden = false;
    request.hiddenReason = null;
    request.hiddenBy = null;
    request.hiddenAt = null;
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));

    // Log undo
    const staff = readStaff();
    if (!staff.undoLog) staff.undoLog = [];
    staff.undoLog.push({
      type: 'request_unhide',
      id: requestId,
      undoneBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    return res.json({ success: true, message: 'Request unhidden', request });
  } catch (err) {
    console.error('Undo hide request error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Undo delete request
app.post('/staff/undo-delete-request/:requestId', (req, res) => {
  try {
    const { employeeId } = req.body;
    const requestId = req.params.requestId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
    const request = requests.find(r => r.id === requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.deleted = false;
    request.deletedReason = null;
    request.deletedBy = null;
    request.deletedAt = null;
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));

    // Log undo
    const staff = readStaff();
    if (!staff.undoLog) staff.undoLog = [];
    staff.undoLog.push({
      type: 'request_undelete',
      id: requestId,
      undoneBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    return res.json({ success: true, message: 'Request restored', request });
  } catch (err) {
    console.error('Undo delete request error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Undo hide comment
app.post('/staff/undo-hide-comment/:commentId', (req, res) => {
  try {
    const { employeeId } = req.body;
    const commentId = req.params.commentId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let comments = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf8'));
    const comment = comments.find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.hidden = false;
    comment.hiddenReason = null;
    comment.hiddenBy = null;
    comment.hiddenAt = null;
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));

    // Log undo
    const staff = readStaff();
    if (!staff.undoLog) staff.undoLog = [];
    staff.undoLog.push({
      type: 'comment_unhide',
      id: commentId,
      undoneBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    return res.json({ success: true, message: 'Comment unhidden', comment });
  } catch (err) {
    console.error('Undo hide comment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Undo delete comment
app.post('/staff/undo-delete-comment/:commentId', (req, res) => {
  try {
    const { employeeId } = req.body;
    const commentId = req.params.commentId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let comments = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf8'));
    const comment = comments.find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.deleted = false;
    comment.deletedReason = null;
    comment.deletedBy = null;
    comment.deletedAt = null;
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));

    // Log undo
    const staff = readStaff();
    if (!staff.undoLog) staff.undoLog = [];
    staff.undoLog.push({
      type: 'comment_undelete',
      id: commentId,
      undoneBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staff);

    return res.json({ success: true, message: 'Comment restored', comment });
  } catch (err) {
    console.error('Undo delete comment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get user activity metrics for staff (for filtering and insights)
app.get('/staff/user-metrics', (req, res) => {
  try {
    const { employeeId } = req.query;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
    const videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));

    const userMetrics = users.map(user => {
      // Count requests created by user
      const createdRequests = requests.filter(r => r.createdBy === user.id).length;
      
      // Count requests claimed/fulfilled by user
      const fulfilledRequests = requests.filter(r => r.claimedBy?.id === user.id && r.currentStep === 6).length;
      
      // Count free requests (amount = 0)
      const freeRequests = requests.filter(r => r.createdBy === user.id && (r.amount === 0 || r.amount === '0')).length;
      
      // Check if user has an active subscription/plan
      const hasPlan = !!user.subscriptionPlan && user.subscriptionPlan !== 'none' && user.subscriptionPlan !== 'free';
      
      // Calculate days since account creation
      const createdDate = new Date(user.createdAt);
      const today = new Date();
      const daysSinceCreation = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
      
      // Count videos created
      const videosCreated = videos.filter(v => v.creatorId === user.id).length;
      
      // Count videos from profile views (estimate from engagement)
      const profileViews = user.profileViews || 0;
      
      // Last activity tracking (use lastClaimReset or other recent activity)
      const lastActivity = user.lastWarning || user.lastStreakDate || user.createdAt;
      const lastActivityDate = new Date(lastActivity);
      const daysSinceLastActivity = Math.floor((today - lastActivityDate) / (1000 * 60 * 60 * 24));

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isCreator: user.isCreator || false,
        createdRequestsCount: createdRequests,
        fulfilledRequestsCount: fulfilledRequests,
        freeRequestsCount: freeRequests,
        totalRequestsEngagement: createdRequests + fulfilledRequests,
        hasPlan,
        subscriptionPlan: user.subscriptionPlan || 'none',
        daysSinceCreation,
        daysSinceLastActivity,
        videosCreated,
        profileViews,
        streak: user.streak || 0,
        warnings: user.warnings || 0,
        isShadowBanned: user.shadowBanned || false
      };
    });

    return res.json({ metrics: userMetrics });
  } catch (err) {
    console.error('Get user metrics error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get staff notifications (for approval notifications and account updates)
app.get('/staff/notifications', (req, res) => {
  try {
    const { employeeId } = req.query;

    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const staff = readStaff();
    const employee = staff.employees.find(e => e.id === parseInt(employeeId));

    if (!employee) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get notifications for this employee
    const notifications = (staff.notifications || []).filter(n => n.userId === parseInt(employeeId));

    return res.json({ notifications, employee });
  } catch (err) {
    console.error('Get staff notifications error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Mark staff notification as read
app.post('/staff/notifications/:id/read', (req, res) => {
  try {
    const { employeeId } = req.body;
    const notificationId = req.params.id;

    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const staff = readStaff();
    const employee = staff.employees.find(e => e.id === parseInt(employeeId));

    if (!employee) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const notification = (staff.notifications || []).find(n => n.id === notificationId && n.userId === parseInt(employeeId));

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.read = true;
    writeStaff(staff);

    return res.json({ success: true });
  } catch (err) {
    console.error('Mark notification read error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete staff notification
app.delete('/staff/notifications/:id', (req, res) => {
  try {
    const { employeeId } = req.query;
    const notificationId = req.params.id;

    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const staff = readStaff();
    const employee = staff.employees.find(e => e.id === parseInt(employeeId));

    if (!employee) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    staff.notifications = (staff.notifications || []).filter(n => !(n.id === notificationId && n.userId === parseInt(employeeId)));
    writeStaff(staff);

    return res.json({ success: true });
  } catch (err) {
    console.error('Delete notification error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// =====================================================
// PAYMENT PROCESSING ENDPOINTS
// =====================================================

// Initialize payment session before redirecting to PayPal
app.post('/payment/init', authMiddleware, (req, res) => {
  const { amount, paymentType, subscriptionTier, paymentMode } = req.body || {};
  
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create payment session record
    const paymentSession = {
      id: `payment_${Date.now()}_${req.user.id}`,
      userId: req.user.id,
      amount: Number(amount),
      paymentType: paymentType || 'tip', // 'tip', 'subscription', 'boost', etc.
      subscriptionTier: subscriptionTier || null,
      paymentMode: paymentMode || 'one-time', // 'one-time' or 'monthly'
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString() // 15 minute window
    };

    // Store payment session in user record
    if (!user.paymentSessions) user.paymentSessions = [];
    user.paymentSessions.push(paymentSession);
    
    writeUsers(users);

    return res.json({ 
      success: true, 
      sessionId: paymentSession.id,
      message: 'Payment session initialized. Please proceed with PayPal payment.'
    });
  } catch (err) {
    console.error('Payment init error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Handle payment success callback (called when user returns from PayPal)
app.post('/payment/success', authMiddleware, (req, res) => {
  const { sessionId, transactionId } = req.body || {};
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing session ID' });
  }

  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find payment session
    const sessionIdx = (user.paymentSessions || []).findIndex(s => s.id === sessionId);
    if (sessionIdx === -1) {
      return res.status(404).json({ error: 'Payment session not found' });
    }

    const session = user.paymentSessions[sessionIdx];

    // Check if session is still valid
    if (session.status !== 'pending') {
      return res.status(400).json({ error: 'Payment session already processed' });
    }

    if (new Date(session.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Payment session expired' });
    }

    // Mark session as successful
    session.status = 'success';
    session.transactionId = transactionId || `manual_${Date.now()}`;
    session.completedAt = new Date().toISOString();

    // Process subscription if applicable
    if (session.paymentType === 'subscription' && session.subscriptionTier) {
      const tier = session.subscriptionTier.toLowerCase();
      
      // Update user subscription
      user.subscriptionTier = tier;
      user.subscriptionStartDate = new Date().toISOString();
      user.subscriptionActive = true;
      user.paymentMode = session.paymentMode;
      
      // Set subscription expiry (1 month from now for monthly, 1 year for yearly)
      const expiryDate = new Date();
      if (session.paymentMode === 'monthly') {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      }
      user.subscriptionExpiryDate = expiryDate.toISOString();
      
      // Grant subscription benefits
      user.subscriptionBenefits = getSubscriptionBenefits(tier);
    }

    // Track payment in payment history
    if (!user.paymentHistory) user.paymentHistory = [];
    user.paymentHistory.push({
      sessionId: session.id,
      amount: session.amount,
      type: session.paymentType,
      paymentMode: session.paymentMode,
      transactionId: session.transactionId,
      completedAt: session.completedAt
    });

    writeUsers(users);

    return res.json({ 
      success: true, 
      message: 'Payment processed successfully',
      subscription: user.subscriptionTier ? {
        tier: user.subscriptionTier,
        active: user.subscriptionActive,
        expiryDate: user.subscriptionExpiryDate,
        benefits: user.subscriptionBenefits
      } : null
    });
  } catch (err) {
    console.error('Payment success error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Handle payment failure
app.post('/payment/failure', authMiddleware, (req, res) => {
  const { sessionId, reason } = req.body || {};
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing session ID' });
  }

  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find payment session
    const sessionIdx = (user.paymentSessions || []).findIndex(s => s.id === sessionId);
    if (sessionIdx === -1) {
      return res.status(404).json({ error: 'Payment session not found' });
    }

    const session = user.paymentSessions[sessionIdx];

    // Mark session as failed
    session.status = 'failed';
    session.failureReason = reason || 'User cancelled';
    session.failedAt = new Date().toISOString();

    writeUsers(users);

    return res.json({ 
      success: true, 
      message: 'Payment failure recorded',
      sessionId: session.id
    });
  } catch (err) {
    console.error('Payment failure error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get user subscription status and benefits
app.get('/payment/subscription', authMiddleware, (req, res) => {
  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isSubscriptionActive = user.subscriptionActive && 
      (!user.subscriptionExpiryDate || new Date(user.subscriptionExpiryDate) > new Date());

    return res.json({ 
      success: true, 
      subscription: {
        active: isSubscriptionActive,
        tier: user.subscriptionTier || null,
        paymentMode: user.paymentMode || null,
        startDate: user.subscriptionStartDate || null,
        expiryDate: user.subscriptionExpiryDate || null,
        benefits: user.subscriptionBenefits || getSubscriptionBenefits(user.subscriptionTier)
      }
    });
  } catch (err) {
    console.error('Get subscription error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Cancel subscription
app.post('/payment/subscription/cancel', authMiddleware, (req, res) => {
  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mark subscription as cancelled
    user.subscriptionActive = false;
    user.subscriptionCancelledAt = new Date().toISOString();

    writeUsers(users);

    return res.json({ 
      success: true, 
      message: 'Subscription cancelled successfully'
    });
  } catch (err) {
    console.error('Cancel subscription error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Helper function: Get subscription benefits based on tier
function getSubscriptionBenefits(tier) {
  const benefits = {
    'support': [
      'Early access to videos',
      'Supporter badge',
      'Direct support access'
    ],
    'enthusiast': [
      'All Support perks',
      'Monthly Q&A access',
      'Name in credits',
      'Exclusive content'
    ],
    'patron': [
      'All Enthusiast perks',
      '1-on-1 consultation (quarterly)',
      'Custom video request priority',
      'VIP access to events'
    ]
  };

  return benefits[tier?.toLowerCase()] || [];
}

// ========== SUPPORT TICKETS SYSTEM ==========

const SUPPORT_TICKETS_FILE = path.join(PERSIST_DIR, 'support_tickets.json');

// Helper function to check if user is staff
function isUserStaff(userId) {
  try {
    const staff = readStaff();
    return staff.employees && staff.employees.some(emp => emp.id === parseInt(userId));
  } catch (e) {
    return false;
  }
}

function readSupportTickets() {
  try {
    if (fs.existsSync(SUPPORT_TICKETS_FILE)) {
      const data = fs.readFileSync(SUPPORT_TICKETS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading support tickets:', e);
  }
  return [];
}

function writeSupportTickets(tickets) {
  try {
    fs.writeFileSync(SUPPORT_TICKETS_FILE, JSON.stringify(tickets, null, 2));
  } catch (e) {
    console.error('Error writing support tickets:', e);
  }
}

// Submit a new support ticket (no auth required - customers can submit without logging in)
app.post('/support/ticket', upload.array('file_', 5), (req, res) => {
  try {
    const { title, description, userId, userEmail } = req.body;

    // Validation
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    if (title.length > 100 || description.length > 2000) {
      return res.status(400).json({ error: 'Title or description exceeds length limit' });
    }

    // Get user info (from request body or as anonymous)
    const users = readUsers();
    let userInfo = { id: userId || 'anonymous', email: userEmail || 'unknown@example.com' };
    
    // If user is authenticated, use their info instead
    if (req.user) {
      const user = users.find(u => u.id === req.user.id);
      if (user) {
        userInfo = { id: user.id, email: user.email };
      }
    }

    // Limit check: Check how many open tickets this user already has
    const tickets = readSupportTickets();
    const existingOpenTickets = tickets.filter(t => 
      t.userEmail === userInfo.email && 
      ['open', 'in-progress'].includes(t.status)
    );

    if (existingOpenTickets.length >= 5) {
      return res.status(400).json({ 
        error: 'You already have 5 open support tickets. Please resolve existing tickets before submitting a new one.' 
      });
    }

    // Create ticket with a better unique ID
    // Format: 'ticket_' + timestamp + '_' + random string
    const uniqueId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const users_list = readUsers();
    const user = users_list.find(u => u.id === userInfo.id);
    const ticket = {
      id: uniqueId,
      userId: userInfo.id,
      userName: user?.username || 'Unknown User',
      userEmail: userInfo.email,
      title: title.trim(),
      description: description.trim(),
      status: 'open', // open, in-progress, resolved, closed
      priority: 'normal',
      attachments: (req.files || []).map(f => ({
        filename: f.filename,
        originalName: f.originalname,
        size: f.size,
        path: `/uploads/${f.filename}`
      })),
      responses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to file
    const allTickets = readSupportTickets();
    allTickets.push(ticket);
    writeSupportTickets(allTickets);

    console.log(`Support ticket created: ${ticket.id} by ${userInfo.email}`);

    return res.json({ 
      success: true, 
      ticketId: ticket.id,
      message: 'Ticket submitted successfully'
    });
  } catch (err) {
    console.error('Error submitting support ticket:', err);
    return res.status(500).json({ error: 'Failed to submit ticket' });
  }
});

// Get all support tickets (staff only - uses employeeId query param)
app.get('/support/tickets', (req, res) => {
  try {
    const employeeId = req.query.employeeId;
    const userEmail = req.query.userEmail;
    
    // If employeeId is provided, serve staff view
    if (employeeId) {
      // Verify the employee exists in staff.json
      const staff = readStaff();
      const isStaff = staff.employees && staff.employees.some(emp => emp.id === parseInt(employeeId));

      console.log('Support tickets request - Employee ID:', employeeId, 'Is Staff:', isStaff);

      if (!isStaff) {
        console.log('Access denied - not a valid staff member');
        return res.status(403).json({ error: 'Unauthorized - staff access required' });
      }

      const tickets = readSupportTickets();
      console.log('Returning', tickets.length, 'support tickets');
      const sortedTickets = tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.json({ 
        success: true, 
        tickets: sortedTickets,
        count: sortedTickets.length
      });
    }
    
    // If userEmail is provided, serve customer view
    if (userEmail) {
      const tickets = readSupportTickets();
      const userTickets = tickets.filter(t => t.userEmail === userEmail).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return res.json({
        success: true,
        tickets: userTickets,
        count: userTickets.length
      });
    }

    return res.status(400).json({ error: 'employeeId or userEmail required' });
  } catch (err) {
    console.error('Error getting support tickets:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get single support ticket
app.get('/support/ticket/:id', (req, res) => {
  try {
    const ticketId = req.params.id;
    const employeeId = req.query.employeeId;
    const tickets = readSupportTickets();
    const ticket = tickets.find(t => t.id === ticketId || t.id === parseInt(ticketId));

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check permission - staff can view all
    if (employeeId) {
      const isStaff = isUserStaff(employeeId);
      if (!isStaff) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    return res.json({ success: true, ticket });
  } catch (err) {
    console.error('Error getting support ticket:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update ticket status (staff only)
app.put('/support/ticket/:id/status', (req, res) => {
  try {
    const ticketId = req.params.id;
    const { status, priority, employeeId } = req.body;

    // Check if user is staff
    if (!employeeId || !isUserStaff(employeeId)) {
      return res.status(403).json({ error: 'Unauthorized - staff access required' });
    }

    const tickets = readSupportTickets();
    const ticket = tickets.find(t => t.id === ticketId || t.id === parseInt(ticketId));

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Update status and/or priority
    if (status && ['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
      ticket.status = status;
    }
    if (priority && ['low', 'normal', 'high', 'urgent'].includes(priority)) {
      ticket.priority = priority;
    }

    ticket.updatedAt = new Date().toISOString();
    writeSupportTickets(tickets);

    return res.json({ success: true, ticket });
  } catch (err) {
    console.error('Error updating ticket status:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add response to ticket (staff only)
app.post('/support/ticket/:id/response', (req, res) => {
  try {
    const ticketId = req.params.id;
    const { message, employeeId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if user is staff
    if (!employeeId || !isUserStaff(employeeId)) {
      return res.status(403).json({ error: 'Unauthorized - staff access required' });
    }

    const tickets = readSupportTickets();
    const ticket = tickets.find(t => t.id === ticketId || t.id === parseInt(ticketId));

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get staff member info for response
    const staff = readStaff();
    const staffMember = staff.employees?.find(emp => emp.id === parseInt(employeeId));
    const staffName = staffMember?.name || 'Staff';

    // Add response
    const response = {
      id: Date.now(),
      staffId: employeeId,
      staffName: staffName,
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    if (!ticket.responses) {
      ticket.responses = [];
    }
    ticket.responses.push(response);
    ticket.updatedAt = new Date().toISOString();

    writeSupportTickets(tickets);

    // Create notification for customer
    try {
      const notifFile = path.join(PERSIST_DIR, 'notifications.json');
      let notifications = [];
      if (fs.existsSync(notifFile)) {
        const data = fs.readFileSync(notifFile, 'utf-8');
        notifications = JSON.parse(data);
      }

      const notification = {
        id: Date.now(),
        userId: ticket.userId || 'anonymous',
        userEmail: ticket.userEmail,
        type: 'support_response',
        title: 'Support Response Received',
        message: `Staff replied to your ticket: "${ticket.title}"`,
        ticketId: ticketId,
        read: false,
        createdAt: new Date().toISOString()
      };

      notifications.push(notification);
      fs.writeFileSync(notifFile, JSON.stringify(notifications, null, 2));
      console.log(`Notification created for ticket ${ticketId} to ${ticket.userEmail}`);
    } catch (notifErr) {
      console.warn('Could not create notification:', notifErr.message);
    }

    console.log(`Response added to ticket ${ticketId} by ${staffName}`);

    return res.json({ success: true, response, ticket });
  } catch (err) {
    console.error('Error adding ticket response:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add customer response to ticket
app.post('/support/ticket/:id/customer-response', (req, res) => {
  try {
    const ticketId = req.params.id;
    const { message, userEmail } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const tickets = readSupportTickets();
    const ticket = tickets.find(t => t.id === ticketId || t.id === parseInt(ticketId));

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Verify the email matches
    if (ticket.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Add customer response
    const customerResponse = {
      id: Date.now(),
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    if (!ticket.customerResponses) {
      ticket.customerResponses = [];
    }
    ticket.customerResponses.push(customerResponse);
    ticket.updatedAt = new Date().toISOString();

    writeSupportTickets(tickets);

    console.log(`Customer response added to ticket ${ticketId}`);

    return res.json({ success: true, response: customerResponse, ticket });
  } catch (err) {
    console.error('Error adding customer response:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Close ticket (staff only)
app.post('/support/ticket/:id/close', (req, res) => {
  try {
    const ticketId = req.params.id;
    const { resolution, employeeId } = req.body;

    // Check if user is staff
    if (!employeeId || !isUserStaff(employeeId)) {
      return res.status(403).json({ error: 'Unauthorized - staff access required' });
    }

    const tickets = readSupportTickets();
    const ticket = tickets.find(t => t.id === ticketId || t.id === parseInt(ticketId));

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Get staff member name
    const staff = readStaff();
    const staffMember = staff.employees?.find(emp => emp.id === parseInt(employeeId));
    const staffName = staffMember?.name || 'Staff';

    ticket.status = 'closed';
    ticket.closedBy = staffName;
    ticket.resolution = resolution || '';
    ticket.closedAt = new Date().toISOString();
    ticket.updatedAt = new Date().toISOString();

    writeSupportTickets(tickets);

    return res.json({ success: true, ticket });
  } catch (err) {
    console.error('Error closing ticket:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete ticket (staff only)
app.delete('/support/ticket/:id', (req, res) => {
  try {
    const ticketId = req.params.id;
    const employeeId = req.query.employeeId;

    // Check if user is staff
    if (!employeeId || !isUserStaff(employeeId)) {
      return res.status(403).json({ error: 'Unauthorized - staff access required' });
    }

    const tickets = readSupportTickets();
    const ticketIdx = tickets.findIndex(t => t.id === ticketId || t.id === parseInt(ticketId));

    if (ticketIdx === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Remove ticket
    const deletedTicket = tickets.splice(ticketIdx, 1)[0];
    writeSupportTickets(tickets);

    console.log(`Support ticket ${ticketId} deleted by employee ${employeeId}`);

    return res.json({ success: true, message: 'Ticket deleted', ticketId: deletedTicket.id });
  } catch (err) {
    console.error('Error deleting ticket:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Helper to read onboarding data
const readOnboardingData = () => {
  try {
    if (!fs.existsSync(ONBOARDING_FILE)) return [];
    return JSON.parse(fs.readFileSync(ONBOARDING_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading onboarding data:', err);
    return [];
  }
};

// Helper to write onboarding data
const writeOnboardingData = (data) => {
  try {
    fs.writeFileSync(ONBOARDING_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing onboarding data:', err);
  }
};

// POST: Save creator onboarding info
app.post('/staff/onboarding-info', (req, res) => {
  try {
    const { userId, userName, userEmail, creatorName, bio, introVideoUrl, socialMediaHandle, socialFollowers, completedAt, agreedTOS, agreedPrivacy } = req.body;

    if (!userId || !creatorName || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const onboardingData = readOnboardingData();
    
    // Check if this user already has an onboarding record
    const existingIndex = onboardingData.findIndex(o => o.userId === userId);
    
    const newRecord = {
      id: existingIndex >= 0 ? onboardingData[existingIndex].id : Date.now(),
      userId,
      userName,
      userEmail,
      creatorName,
      bio,
      introVideoUrl,
      socialMediaHandle,
      socialFollowers: parseInt(socialFollowers) || 0,
      completedAt: completedAt || new Date().toISOString(),
      agreedTOS: agreedTOS || false,
      agreedPrivacy: agreedPrivacy || false,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing record
      onboardingData[existingIndex] = newRecord;
    } else {
      // Add new record
      onboardingData.push(newRecord);
    }

    writeOnboardingData(onboardingData);
    console.log(`Onboarding info saved for user ${userId} (${creatorName})`);

    return res.json({ success: true, message: 'Onboarding info saved', record: newRecord });
  } catch (err) {
    console.error('Error saving onboarding info:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET: Retrieve all creator onboarding info (staff only)
app.get('/staff/onboarding-info', (req, res) => {
  try {
    const { employeeId } = req.query;

    if (!employeeId || parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const onboardingData = readOnboardingData();
    const sortedData = onboardingData.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    return res.json({ 
      success: true, 
      onboardingInfo: sortedData,
      count: sortedData.length
    });
  } catch (err) {
    console.error('Get onboarding info error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Regaarder backend listening on ${PORT}`));

