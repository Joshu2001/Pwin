/* eslint-env node */
/* eslint-disable no-empty, no-unused-vars */
const express = require('express');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const cors = require('cors');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 8080;
const WEB_URL = process.env.WEB_URL || 'https://regaarder.com';
const PUBLIC_BACKEND_URL =
  process.env.PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  process.env.VITE_BACKEND_URL ||
  null;
const CLEANUP_TOKEN = process.env.CLEANUP_TOKEN || null;

const ensureAbsoluteHttpUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (/^[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/i.test(raw)) return `https://${raw}`;
  return raw;
};

const getPublicBackendBase = (req) => {
  const fallback = `${req.protocol}://${req.get('host')}`;
  return ensureAbsoluteHttpUrl(PUBLIC_BACKEND_URL || fallback).replace(/\/$/, '');
};

app.use(cors());
app.use(bodyParser.json());

const CURRENCY_CACHE_TTL_MS = 60 * 60 * 1000;
const GEO_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const FALLBACK_CURRENCY_RATES = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.53,
  NZD: 1.66,
  JPY: 149.50,
  KRW: 1312.00,
  TWD: 31.50,
  HKD: 7.81,
  SGD: 1.34,
  INR: 83.12,
  PHP: 55.50,
  VND: 24385.00,
  MXN: 16.95,
  BRL: 4.97,
  ARS: 835.50,
  CLP: 850.00,
  COP: 3985.00,
  ZAR: 18.50,
  CHF: 0.88,
  NOK: 10.50,
  SEK: 10.45,
  DKK: 6.87,
  PLN: 3.98,
  CZK: 23.45,
  HUF: 356.00,
  RON: 4.58,
  ILS: 3.68,
  TRY: 32.15,
  AED: 3.67,
  SAR: 3.75
};

const sanitizeCurrencyRates = (rates) => {
  const sanitized = { ...FALLBACK_CURRENCY_RATES };
  if (rates && typeof rates === 'object') {
    Object.keys(rates).forEach((key) => {
      const code = String(key || '').toUpperCase();
      const value = Number(rates[key]);
      if (!code || code === 'USD') return;
      if (Number.isFinite(value) && value > 0) {
        sanitized[code] = value;
      }
    });
  }
  sanitized.USD = 1;
  return sanitized;
};

const currencyRatesCache = { base: 'USD', rates: sanitizeCurrencyRates(FALLBACK_CURRENCY_RATES), updatedAt: 0 };
const geoCache = new Map();

const fetchJsonWithTimeout = async (url, options = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
};

const getClientIpAddress = (req) => {
  try {
    const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ip = xff || req.ip || req.connection?.remoteAddress || '';
    if (!ip) return '';
    if (ip === '::1') return '127.0.0.1';
    return ip.replace('::ffff:', '');
  } catch (e) {
    return '';
  }
};

const isPrivateIp = (ip) => {
  if (!ip) return true;
  return (
    ip === '127.0.0.1' ||
    ip === '0.0.0.0' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('fe80:')
  );
};

const DATABASE_URL = process.env.DATABASE_URL || null;
const DB_ENABLED = Boolean(DATABASE_URL);
const dbPool = DB_ENABLED
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : null;

const dbQuery = async (text, params = []) => {
  if (!DB_ENABLED || !dbPool) throw new Error('Database not configured');
  return dbPool.query(text, params);
};

const initDb = async () => {
  if (!DB_ENABLED) return;
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      email text UNIQUE NOT NULL,
      name text,
      password_hash text NOT NULL,
      token text,
      referral_code text,
      referrer_id text,
      referral_count integer DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      password_changed_at timestamptz,
      handle text,
      tag text,
      bio text,
      interests jsonb,
      image text,
      social jsonb,
      is_creator boolean DEFAULT false,
      creator_since timestamptz,
      intro_video text,
      document text,
      price numeric,
      tagline text,
      pricing_type text,
      categories jsonb,
      user_plan text,
      creator_plan text,
      creator_plan_upgraded_at timestamptz,
      streak integer,
      last_streak_date date,
      meta jsonb
    );
  `);

  await dbQuery(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS creator_plan text,
      ADD COLUMN IF NOT EXISTS creator_plan_upgraded_at timestamptz,
      ADD COLUMN IF NOT EXISTS streak integer,
      ADD COLUMN IF NOT EXISTS last_streak_date date,
      ADD COLUMN IF NOT EXISTS meta jsonb;
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS requests (
      id text PRIMARY KEY,
      title text NOT NULL,
      description text NOT NULL,
      likes integer DEFAULT 0,
      comments integer DEFAULT 0,
      boosts integer DEFAULT 0,
      amount numeric DEFAULT 0,
      funding numeric DEFAULT 0,
      is_trending boolean DEFAULT false,
      is_sponsored boolean DEFAULT false,
      company text,
      company_initial text,
      company_color text,
      image_url text,
      creator_id text,
      creator_name text,
      creator_email text,
      created_by text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz,
      current_step integer,
      claimed boolean DEFAULT false,
      claimed_by text,
      claimed_at timestamptz,
      meta jsonb
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS request_reactions (
      request_id text NOT NULL,
      user_id text NOT NULL,
      is_liked boolean DEFAULT false,
      is_disliked boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      PRIMARY KEY (request_id, user_id)
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS request_bookmarks (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      request_id text NOT NULL,
      title text,
      created_at timestamptz DEFAULT now()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS videos (
      id text PRIMARY KEY,
      payload jsonb NOT NULL,
      created_at timestamptz DEFAULT now()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS request_comments (
      id text PRIMARY KEY,
      request_id text,
      payload jsonb NOT NULL,
      created_at timestamptz DEFAULT now()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS watch_history (
      video_id text NOT NULL,
      user_id text NOT NULL,
      payload jsonb NOT NULL,
      updated_at timestamptz DEFAULT now(),
      PRIMARY KEY (video_id, user_id)
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS sponsors (
      id text PRIMARY KEY,
      owner_id text,
      payload jsonb NOT NULL,
      created_at timestamptz DEFAULT now()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id text PRIMARY KEY,
      payload jsonb NOT NULL,
      created_at timestamptz DEFAULT now()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS notifications (
      id text PRIMARY KEY,
      to_id text,
      from_id text,
      type text,
      read boolean DEFAULT false,
      payload jsonb NOT NULL,
      created_at timestamptz DEFAULT now()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS video_reactions (
      video_id text NOT NULL,
      user_id text NOT NULL,
      is_liked boolean DEFAULT false,
      is_disliked boolean DEFAULT false,
      updated_at timestamptz DEFAULT now(),
      PRIMARY KEY (video_id, user_id)
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS comment_reactions (
      comment_id text NOT NULL,
      user_id text NOT NULL,
      is_liked boolean DEFAULT false,
      is_disliked boolean DEFAULT false,
      updated_at timestamptz DEFAULT now(),
      PRIMARY KEY (comment_id, user_id)
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS staff_state (
      id text PRIMARY KEY,
      payload jsonb NOT NULL,
      updated_at timestamptz DEFAULT now()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS user_video_bookmarks (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      video_url text NOT NULL,
      title text,
      created_at timestamptz DEFAULT now()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS user_segment_bookmarks (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      video_url text NOT NULL,
      label text,
      start_time integer DEFAULT 0,
      end_time integer DEFAULT 0,
      created_at timestamptz DEFAULT now()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS products (
      id text PRIMARY KEY,
      payload jsonb NOT NULL,
      created_at timestamptz DEFAULT now()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS bottom_templates (
      id text PRIMARY KEY,
      payload jsonb NOT NULL,
      created_at timestamptz DEFAULT now()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS categories (
      name text PRIMARY KEY,
      created_at timestamptz DEFAULT now()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS onboarding_info (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      payload jsonb NOT NULL,
      updated_at timestamptz DEFAULT now()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS playback_positions (
      id text PRIMARY KEY,
      user_id text,
      anon_id text,
      video_id text NOT NULL,
      current_time numeric DEFAULT 0,
      updated_at timestamptz DEFAULT now()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS advertiser_campaigns (
      id text PRIMARY KEY,
      owner_id text NOT NULL,
      payload jsonb NOT NULL,
      created_at timestamptz DEFAULT now()
    );
  `);
};

let staffCache = null;
const DEFAULT_ADMIN_EMPLOYEE = {
  id: 1000,
  name: 'Admin',
  email: 'admin@regaarder.com',
  role: 'administrator',
  passwords: ['pass123', 'staff456', 'admin789'],
  createdAt: new Date('2026-01-18T00:00:00Z').toISOString(),
  status: 'active',
  permissions: {
    videos: true,
    requests: true,
    comments: true,
    reports: true,
    users: true,
    creators: true,
    shadowDeleted: true,
    approvals: true,
    promotions: true,
    templates: true,
    ads: true
  },
  approvalAuthority: true
};

const DEFAULT_STAFF_STATE = {
  employees: [DEFAULT_ADMIN_EMPLOYEE],
  pendingAccounts: [],
  reports: [],
  shadowDeleted: [],
  notifications: []
};

const ensureDefaultAdminEmployee = (state) => {
  const normalized = {
    ...(state && typeof state === 'object' ? state : {}),
    employees: Array.isArray(state?.employees) ? [...state.employees] : [],
    pendingAccounts: Array.isArray(state?.pendingAccounts) ? state.pendingAccounts : [],
    reports: Array.isArray(state?.reports) ? state.reports : [],
    shadowDeleted: Array.isArray(state?.shadowDeleted) ? state.shadowDeleted : [],
    notifications: Array.isArray(state?.notifications) ? state.notifications : []
  };

  const hasAdmin = normalized.employees.some((e) => Number(e?.id) === 1000);
  if (!hasAdmin) {
    normalized.employees.unshift({ ...DEFAULT_ADMIN_EMPLOYEE });
  }
  return normalized;
};

const loadStaffStateFromDb = async () => {
  if (!DB_ENABLED) return;
  try {
    const { rows } = await dbQuery('SELECT payload FROM staff_state WHERE id = $1 LIMIT 1', ['staff_state']);
    if (rows[0] && rows[0].payload) {
      staffCache = ensureDefaultAdminEmployee(rows[0].payload);
    } else {
      staffCache = ensureDefaultAdminEmployee(DEFAULT_STAFF_STATE);
    }

    await dbQuery(
      `INSERT INTO staff_state (id, payload, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()`,
      ['staff_state', staffCache]
    );

    try {
      fs.writeFileSync(path.join(__dirname, 'staff.json'), JSON.stringify(staffCache, null, 2), 'utf8');
    } catch (fileErr) {
      console.error('load staff state write file error', fileErr);
    }
  } catch (err) {
    console.error('load staff state db error', err);
  }
};

// Cleanup test/dummy users on startup
async function cleanupTestUsers() {
  try {
    if (DB_ENABLED) {
      // Remove users whose email matches test patterns
      const { rows: testUsers } = await dbQuery(
        `SELECT id, email, name FROM users
         WHERE LOWER(COALESCE(email, '')) LIKE '%@example.com%'
            OR LOWER(COALESCE(name, '')) LIKE '%img fix%'
            OR LOWER(COALESCE(name, '')) LIKE '%img test%'
            OR LOWER(COALESCE(name, '')) LIKE '%imgfix%'
            OR LOWER(COALESCE(name, '')) LIKE '%imgtest%'
            OR LOWER(COALESCE(email, '')) LIKE '%imgfix%'
            OR LOWER(COALESCE(email, '')) LIKE '%imgtest%'
            OR LOWER(COALESCE(handle, '')) LIKE '%imgfix%'
            OR LOWER(COALESCE(handle, '')) LIKE '%imgtest%'
            OR LOWER(COALESCE(tag, '')) LIKE '%imgfix%'
            OR LOWER(COALESCE(tag, '')) LIKE '%imgtest%'`
      );
      if (testUsers.length > 0) {
        const ids = testUsers.map(u => u.id);
        console.log(`[cleanup] Removing ${testUsers.length} test user(s):`, testUsers.map(u => `${u.name} <${u.email}>`));
        // Delete from users table
        await dbQuery(`DELETE FROM users WHERE id = ANY($1::text[])`, [ids]);
        // Delete their notifications
        await dbQuery(`DELETE FROM notifications WHERE to_id = ANY($1::text[]) OR from_id = ANY($1::text[])`, [ids]);
        // Delete their support tickets
        await dbQuery(`DELETE FROM support_tickets WHERE user_id = ANY($1::text[])`, [ids]);
        // Refresh cache
        await refreshUserCache();
        console.log('[cleanup] Test users removed successfully');
      }
    } else {
      // File-based: remove from users.json
      const users = readUsers();
      const testPattern = /(@example\.com|img\s*fix|img\s*test|imgfix|imgtest)/i;
      const cleaned = users.filter(u => {
        const email = String(u.email || '');
        const name = String(u.name || '');
        const handle = String(u.handle || '');
        const tag = String(u.tag || '');
        return !testPattern.test(email) && !testPattern.test(name) && !testPattern.test(handle) && !testPattern.test(tag);
      });
      if (cleaned.length < users.length) {
        console.log(`[cleanup] Removing ${users.length - cleaned.length} test user(s)`);
        writeUsers(cleaned);
      }
    }
    // Clean staff reports/support tickets that reference test data
    const staff = readStaff();
    let staffDirty = false;
    if (Array.isArray(staff.reports)) {
      const before = staff.reports.length;
      staff.reports = staff.reports.filter(r => {
        const email = String(r?.reportedBy || r?.email || '').toLowerCase();
        return !/@example\.com$/.test(email) && !/^imgfix/.test(email) && !/^imgtest/.test(email);
      });
      if (staff.reports.length < before) staffDirty = true;
    }
    if (staffDirty) {
      writeStaff(staff);
      console.log('[cleanup] Cleaned staff reports referencing test data');
    }
  } catch (err) {
    console.error('[cleanup] Error cleaning test users:', err);
  }
}

const isBogusTestUser = (u) => {
  const testPattern = /(@example\.com|img\s*fix|img\s*test|imgfix|imgtest)/i;
  const email = String(u?.email || '');
  const name = String(u?.name || '');
  const handle = String(u?.handle || '');
  const tag = String(u?.tag || '');
  return testPattern.test(email) || testPattern.test(name) || testPattern.test(handle) || testPattern.test(tag);
};

const resolveUserIdentifier = (value) => String(value || '').trim().toLowerCase();

const findUserIndexByIdentifier = (users, identifier) => {
  const needleRaw = String(identifier || '').trim();
  const needle = resolveUserIdentifier(identifier);
  if (!needleRaw || !needle) return -1;

  return users.findIndex((u) => {
    const id = String(u?.id || '').trim();
    const email = resolveUserIdentifier(u?.email);
    const name = resolveUserIdentifier(u?.name);
    const handle = resolveUserIdentifier(u?.handle || u?.tag);
    return id === needleRaw || email === needle || name === needle || handle === needle;
  });
};

initDb()
  .then(() => refreshUserCache())
  .then(() => refreshRequestCache())
  .then(() => loadStaffStateFromDb())
  .then(() => cleanupTestUsers())
  .catch((err) => {
    console.error('Database init error', err);
  });

const S3_BUCKET = process.env.S3_BUCKET || null;
const S3_REGION = process.env.S3_REGION || 'auto';
const S3_ENDPOINT = process.env.S3_ENDPOINT || null;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || null;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || null;
const S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL || null;
const S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE === 'true';
const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';

const S3_ENABLED = Boolean(S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY);
const s3Client = S3_ENABLED
  ? new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT || undefined,
      forcePathStyle: S3_FORCE_PATH_STYLE || Boolean(S3_ENDPOINT),
      credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY }
    })
  : null;

const buildS3PublicUrl = (key) => {
  if (S3_PUBLIC_BASE_URL) return `${S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  if (S3_ENDPOINT) return `${S3_ENDPOINT.replace(/\/$/, '')}/${S3_BUCKET}/${key}`;
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
};

const persistUploadedFile = async (req, file, prefix = 'uploads') => {
  if (!file) return null;
  if (S3_ENABLED && s3Client) {
    const ext = path.extname(file.originalname || file.filename || '') || '';
    const key = `${prefix}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const body = file.buffer ? file.buffer : fs.createReadStream(file.path);
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: file.mimetype || 'application/octet-stream'
    }));
    if (file.path) {
      fs.unlink(file.path, () => {});
    }
    return buildS3PublicUrl(key);
  }
  const publicBase = getPublicBackendBase(req);
  return `${publicBase}/uploads/${file.filename}`;
};

const normalizeMediaUrl = (rawUrl, req) => {
  if (!rawUrl || String(rawUrl).startsWith('blob:')) return null;
  try {
    const base = getPublicBackendBase(req);
    const u = new URL(String(rawUrl), base);
    const host = (u.hostname || '').toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      const baseUrl = new URL(base);
      u.protocol = baseUrl.protocol;
      u.hostname = baseUrl.hostname;
      u.port = baseUrl.port;
    }
    return u.toString();
  } catch {
    return rawUrl;
  }
};

// One-time cleanup: normalize stored video URLs to public absolute URLs
app.post('/admin/normalize-video-urls', async (req, res) => {
  try {
    const token = req.headers['x-cleanup-token'] || req.query.token || null;
    if (CLEANUP_TOKEN && token !== CLEANUP_TOKEN) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const videos = await loadVideos();
    let updated = 0;
    const normalized = videos.map((v) => {
      const next = { ...v };
      const nextVideoUrl = normalizeMediaUrl(v.videoUrl || v.url || v.src || v.videoLink || v.youtubeUrl || v.mediaUrl, req);
      const nextThumb = normalizeMediaUrl(v.imageUrl || v.thumbnail || v.image, req);
      if (nextVideoUrl && nextVideoUrl !== v.videoUrl) {
        next.videoUrl = nextVideoUrl;
        updated += 1;
      }
      if (nextThumb && nextThumb !== v.imageUrl) {
        next.imageUrl = nextThumb;
        updated += 1;
      }
      return next;
    });

    writeVideos(normalized);
    return res.json({ success: true, updated });
  } catch (err) {
    console.error('normalize-video-urls error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

const transcodeVideoToH264 = (inputPath, outputPath) => new Promise((resolve, reject) => {
  const args = [
    '-y',
    '-i', inputPath,
    '-c:v', 'libx264',
    '-profile:v', 'baseline',
    '-level', '3.0',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    outputPath
  ];
  const proc = spawn(FFMPEG_PATH, args, { stdio: 'ignore' });
  proc.on('error', reject);
  proc.on('close', (code) => {
    if (code === 0) resolve(outputPath);
    else reject(new Error(`ffmpeg failed with code ${code}`));
  });
});

const ensureH264Mp4 = async (file) => {
  try {
    if (!file || !file.path) return file;
    const mime = String(file.mimetype || '').toLowerCase();
    if (!mime.startsWith('video/')) return file;
    const dir = path.dirname(file.path);
    const base = path.basename(file.path, path.extname(file.path));
    const outputPath = path.join(dir, `${base}-h264.mp4`);
    await transcodeVideoToH264(file.path, outputPath);
    try { fs.unlink(file.path, () => {}); } catch {}
    return {
      ...file,
      path: outputPath,
      filename: path.basename(outputPath),
      mimetype: 'video/mp4',
      originalname: `${base}.mp4`
    };
  } catch (err) {
    console.warn('Video transcode skipped:', err && err.message ? err.message : err);
    return file;
  }
};

const toPublicUser = (user) => {
  if (!user) return null;
  const { password_hash, passwordHash, token, ...rest } = user;
  return rest;
};

// Convert DB date values to ISO strings (pg may return Date objects or non-standard objects)
const toISODate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return new Date(val).toISOString();
  // pg sometimes returns date objects that aren't instanceof Date
  if (typeof val.toISOString === 'function') return val.toISOString();
  if (typeof val.toString === 'function' && val.toString() !== '[object Object]') return val.toString();
  return null;
};

const mapUserRow = (row) => {
  if (!row) return null;
  const meta = (row.meta && typeof row.meta === 'object') ? row.meta : {};
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    // snake_case (DB convention)
    password_hash: row.password_hash,
    token: row.token,
    referral_code: row.referral_code,
    referrer_id: row.referrer_id,
    referral_count: row.referral_count,
    created_at: toISODate(row.created_at),
    password_changed_at: toISODate(row.password_changed_at),
    handle: row.handle,
    tag: row.tag,
    bio: row.bio,
    interests: row.interests,
    image: row.image,
    social: row.social,
    is_creator: row.is_creator,
    creator_since: toISODate(row.creator_since),
    introVideo: row.intro_video,
    document: row.document,
    price: row.price,
    tagline: row.tagline,
    pricingType: row.pricing_type,
    categories: row.categories,
    userPlan: row.user_plan,
    creatorPlan: row.creator_plan,
    creatorPlanUpgradedAt: toISODate(row.creator_plan_upgraded_at),
    streak: row.streak,
    lastStreakDate: toISODate(row.last_streak_date),
    meta: row.meta,
    // camelCase aliases (legacy JSON convention – many endpoints rely on these)
    passwordHash: row.password_hash,
    referralCode: row.referral_code,
    referrerId: row.referrer_id,
    referralCount: row.referral_count,
    createdAt: toISODate(row.created_at),
    passwordChangedAt: toISODate(row.password_changed_at),
    isCreator: row.is_creator,
    creatorSince: toISODate(row.creator_since),
    intro_video: row.intro_video,
    // Moderation fields (persisted in meta JSONB)
    status: meta.status || null,
    shadowBanned: meta.shadowBanned || false,
    shadowBannedAt: meta.shadowBannedAt || null,
    shadowBanReason: meta.shadowBanReason || null,
    bannedAt: meta.bannedAt || null,
    bannedReason: meta.bannedReason || null,
    banType: meta.banType || null,
    bannedUntil: meta.bannedUntil || null,
    warnings: meta.warnings || 0,
    lastWarning: meta.lastWarning || null
  };
};

const getUserFromAuthHeader = async (req) => {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7).trim();
    if (!token) return null;
    if (DB_ENABLED) {
      const { rows } = await dbQuery('SELECT * FROM users WHERE token = $1 LIMIT 1', [token]);
      return rows[0] ? mapUserRow(rows[0]) : null;
    }
    const users = readUsers();
    const user = users.find(u => u.token === token);
    return user || null;
  } catch {
    return null;
  }
};

const isRewritableHost = (hostname) => {
  if (!hostname) return false;
  const h = hostname.toLowerCase();
  return h === 'localhost'
    || h === '127.0.0.1'
    || h === 'pwin.onrender.com'
    || h === 'regaarder-pwin.onrender.com';
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
  const baseUrl = getPublicBackendBase(req);
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

const buildShareHtml = ({ title, description, image, url, redirectUrl, type = 'website' }) => {
  const safeTitle = escapeHtml(title || 'Regaarder');
  const safeDesc = escapeHtml(description || 'Watch on Regaarder');
  const safeUrl = escapeHtml(url || WEB_URL);
  const safeRedirect = escapeHtml(redirectUrl || WEB_URL);
  const safeImage = image ? escapeHtml(image) : '';
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
    ${safeImage ? `<meta property="og:image" content="${safeImage}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    ${safeImage ? `<meta name="twitter:image" content="${safeImage}" />` : ''}
    <meta http-equiv="refresh" content="0; url=${safeRedirect}" />
  </head>
  <body style="font-family: Arial, sans-serif; background: #0b0b0b; color: #fff;">
    <main style="max-width: 680px; margin: 40px auto; padding: 20px; text-align: center;">
      <h1 style="font-size: 22px; margin: 0 0 12px;">${safeTitle}</h1>
      <p style="font-size: 14px; opacity: 0.8;">${safeDesc}</p>
      <p style="font-size: 12px; opacity: 0.7; margin-top: 16px;">Opening Regaarder… If nothing happens, <a href="${safeRedirect}" style="color: #8ab4ff;">tap here</a>.</p>
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

const DATA_FILE = path.join(__dirname, 'users.json');
const SPONSORS_FILE = path.join(__dirname, 'sponsors.json');
const REQUESTS_FILE = path.join(__dirname, 'requests.json');
const VIDEOS_FILE = path.join(__dirname, 'videos.json');
const CATEGORIES_FILE = path.join(__dirname, 'categories.json');
const ONBOARDING_FILE = path.join(__dirname, 'onboarding.json');

const crypto = require('crypto');
const multer = require('multer');

// simple disk storage for demo: store uploads under ./uploads
const UPLOAD_DIR = path.join(__dirname, 'uploads');
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

/* ── User DB cache ───────────────────────────────────────────────────────
 * When DB_ENABLED the authoritative copy of users lives in PostgreSQL.
 * Many legacy endpoints still call the synchronous readUsers()/writeUsers()
 * helpers.  Instead of rewriting every endpoint we keep an in-memory cache
 * that is loaded once at startup (refreshUserCache) and kept in sync:
 *   • readUsers()  → returns the cache when DB is active
 *   • writeUsers() → updates the cache AND queues an async DB upsert
 * Endpoints that already have their own if(DB_ENABLED) branches touch the
 * DB directly; after those writes we call refreshUserCache() to re-sync.
 * ───────────────────────────────────────────────────────────────────── */
let _userDbCache = [];
let _userDbCacheReady = false;
let _userDbWriteChain = Promise.resolve();  // serialise background writes

async function refreshUserCache() {
  if (!DB_ENABLED) return;
  try {
    const { rows } = await dbQuery('SELECT * FROM users');
    _userDbCache = rows.map(mapUserRow);
    _userDbCacheReady = true;
    console.log(`[user-cache] refreshed – ${_userDbCache.length} user(s)`);
  } catch (err) {
    console.error('[user-cache] refresh error:', err);
  }
}

/**
 * Reverse-map a user JS object (mapUserRow-format OR legacy camelCase) to
 * an array of DB column values, in the exact order the upsert SQL expects.
 */
function userToDbParams(u) {
  // Merge moderation fields into meta JSONB for DB persistence
  const baseMeta = (u.meta && typeof u.meta === 'object') ? { ...u.meta } : {};
  if (u.status) baseMeta.status = u.status;
  else delete baseMeta.status;
  baseMeta.shadowBanned = u.shadowBanned || false;
  if (u.shadowBannedAt) baseMeta.shadowBannedAt = u.shadowBannedAt;
  else delete baseMeta.shadowBannedAt;
  if (u.shadowBanReason) baseMeta.shadowBanReason = u.shadowBanReason;
  else delete baseMeta.shadowBanReason;
  if (u.bannedAt) baseMeta.bannedAt = u.bannedAt;
  else delete baseMeta.bannedAt;
  if (u.bannedReason) baseMeta.bannedReason = u.bannedReason;
  else delete baseMeta.bannedReason;
  if (u.banType) baseMeta.banType = u.banType;
  else delete baseMeta.banType;
  if (u.bannedUntil) baseMeta.bannedUntil = u.bannedUntil;
  else delete baseMeta.bannedUntil;
  baseMeta.warnings = u.warnings || 0;
  if (u.lastWarning) baseMeta.lastWarning = u.lastWarning;
  else delete baseMeta.lastWarning;
  const metaJson = Object.keys(baseMeta).length ? JSON.stringify(baseMeta) : null;

  return [
    u.id,
    u.email,
    u.name,
    u.password_hash || u.passwordHash || null,
    u.token || null,
    u.referral_code || u.referralCode || null,
    u.referrer_id || u.referrerId || null,
    Number(u.referral_count ?? u.referralCount ?? 0),
    u.created_at || u.createdAt || new Date().toISOString(),
    u.password_changed_at || u.passwordChangedAt || null,
    u.handle || null,
    u.tag || null,
    u.bio || null,
    u.interests ? (typeof u.interests === 'string' ? u.interests : JSON.stringify(u.interests)) : null,
    u.image || null,
    u.social ? (typeof u.social === 'string' ? u.social : JSON.stringify(u.social)) : null,
    typeof u.is_creator !== 'undefined' ? u.is_creator : (u.isCreator || false),
    u.creator_since || u.creatorSince || null,
    u.introVideo || u.intro_video || null,
    u.document || null,
    u.price != null ? Number(u.price) : null,
    u.tagline || null,
    u.pricingType || u.pricing_type || null,
    u.categories ? (typeof u.categories === 'string' ? u.categories : JSON.stringify(u.categories)) : null,
    u.userPlan || u.user_plan || null,
    u.creatorPlan || u.creator_plan || null,
    u.creatorPlanUpgradedAt || u.creator_plan_upgraded_at || null,
    u.streak != null ? Number(u.streak) : null,
    u.lastStreakDate || u.last_streak_date || null,
    metaJson
  ];
}

const UPSERT_USER_SQL = `
  INSERT INTO users
    (id,email,name,password_hash,token,referral_code,referrer_id,referral_count,
     created_at,password_changed_at,handle,tag,bio,interests,image,social,
     is_creator,creator_since,intro_video,document,price,tagline,pricing_type,
     categories,user_plan,creator_plan,creator_plan_upgraded_at,streak,
     last_streak_date,meta)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
  ON CONFLICT (id) DO UPDATE SET
    email=EXCLUDED.email, name=EXCLUDED.name, password_hash=EXCLUDED.password_hash,
    token=EXCLUDED.token, referral_code=EXCLUDED.referral_code,
    referrer_id=EXCLUDED.referrer_id, referral_count=EXCLUDED.referral_count,
    password_changed_at=EXCLUDED.password_changed_at, handle=EXCLUDED.handle,
    tag=EXCLUDED.tag, bio=EXCLUDED.bio, interests=EXCLUDED.interests,
    image=EXCLUDED.image, social=EXCLUDED.social, is_creator=EXCLUDED.is_creator,
    creator_since=EXCLUDED.creator_since, intro_video=EXCLUDED.intro_video,
    document=EXCLUDED.document, price=EXCLUDED.price, tagline=EXCLUDED.tagline,
    pricing_type=EXCLUDED.pricing_type, categories=EXCLUDED.categories,
    user_plan=EXCLUDED.user_plan, creator_plan=EXCLUDED.creator_plan,
    creator_plan_upgraded_at=EXCLUDED.creator_plan_upgraded_at,
    streak=EXCLUDED.streak, last_streak_date=EXCLUDED.last_streak_date,
    meta=EXCLUDED.meta`;

async function syncUsersToDb(users) {
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    const ids = [];
    for (const u of users) {
      if (!u || !u.id) continue;
      ids.push(u.id);
      await client.query(UPSERT_USER_SQL, userToDbParams(u));
    }
    // Remove users that were deleted from the array
    if (ids.length > 0) {
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
      await client.query(`DELETE FROM users WHERE id NOT IN (${placeholders})`, ids);
    } else {
      await client.query('DELETE FROM users');
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[user-cache] syncUsersToDb error:', err);
  } finally {
    client.release();
  }
}

function readUsers() {
  if (DB_ENABLED && _userDbCacheReady) return _userDbCache;
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('readUsers error', err);
    return [];
  }
}

function writeUsers(users) {
  if (DB_ENABLED) {
    // Update in-memory cache immediately (synchronous)
    _userDbCache = users;
    _userDbCacheReady = true;
    // Queue a serialised async DB sync (fire-and-forget)
    _userDbWriteChain = _userDbWriteChain
      .then(() => syncUsersToDb(users))
      .catch(err => console.error('[user-cache] bg write error:', err));
    return;
  }
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

const loadSponsors = async () => {
  if (!DB_ENABLED) return readSponsors();
  const { rows } = await dbQuery('SELECT payload FROM sponsors ORDER BY created_at DESC');
  return rows.map(row => row.payload);
};

const saveSponsors = async (sponsors) => {
  if (!DB_ENABLED) {
    writeSponsors(sponsors);
    return;
  }
  const client = await dbPool.connect();
  const ids = sponsors.map(s => String(s.id));
  try {
    await client.query('BEGIN');
    for (const sponsor of sponsors) {
      const createdAt = sponsor.createdAt ? new Date(sponsor.createdAt) : new Date();
      await client.query(
        `INSERT INTO sponsors (id, owner_id, payload, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET owner_id = EXCLUDED.owner_id, payload = EXCLUDED.payload`,
        [String(sponsor.id), sponsor.ownerId || null, sponsor, createdAt]
      );
    }
    if (ids.length > 0) {
      await client.query('DELETE FROM sponsors WHERE id NOT IN (' + ids.map((_, i) => `$${i + 1}`).join(',') + ')', ids);
    } else {
      await client.query('DELETE FROM sponsors');
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

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

/* ── Request DB cache ─────────────────────────────────────────────────
 * Mirrors the user cache approach.  When DB_ENABLED the authoritative
 * copy of requests lives in PostgreSQL.  Legacy endpoints call the
 * synchronous readRequests()/writeRequests().  We make those two
 * transparently DB-aware via an in-memory cache.
 * ─────────────────────────────────────────────────────────────────── */
let _requestDbCache = [];
let _requestDbCacheReady = false;
let _requestDbWriteChain = Promise.resolve();

function mapRequestRow(row) {
  if (!row) return null;
  const claimedBy = parseClaimedByValue(row.claimed_by);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    likes: Number(row.likes || 0),
    comments: Number(row.comments || 0),
    boosts: Number(row.boosts || 0),
    amount: row.amount != null ? Number(row.amount) : 0,
    funding: row.funding != null ? Number(row.funding) : 0,
    isTrending: Boolean(row.is_trending),
    isSponsored: Boolean(row.is_sponsored),
    company: row.company,
    companyInitial: row.company_initial,
    companyColor: row.company_color,
    imageUrl: row.image_url,
    creatorId: row.creator_id,
    creatorName: row.creator_name,
    creatorEmail: row.creator_email,
    creator: row.creator_id ? { id: row.creator_id, name: row.creator_name || 'Anonymous', email: row.creator_email || null } : null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    currentStep: row.current_step,
    claimed: row.claimed,
    claimedBy,
    claimedAt: row.claimed_at,
    meta: row.meta,
    // snake_case aliases for DB-path code that expects them
    is_trending: Boolean(row.is_trending),
    is_sponsored: Boolean(row.is_sponsored),
    company_initial: row.company_initial,
    company_color: row.company_color,
    image_url: row.image_url,
    creator_id: row.creator_id,
    creator_name: row.creator_name,
    creator_email: row.creator_email,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    current_step: row.current_step,
    claimed_by: claimedBy,
    claimed_at: row.claimed_at
  };
}

const parseClaimedByValue = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (e) { }
  return { id: raw };
};

const getClaimedByUserId = (requestLike) => {
  const parsed = parseClaimedByValue(requestLike?.claimedBy || requestLike?.claimed_by);
  return parsed && parsed.id != null ? String(parsed.id) : '';
};

const isRequestHiddenForPublicFeed = (requestLike) => {
  if (!requestLike || typeof requestLike !== 'object') return false;
  const meta = (requestLike.meta && typeof requestLike.meta === 'object') ? requestLike.meta : {};
  return Boolean(requestLike.hidden || meta.hidden);
};

async function refreshRequestCache() {
  if (!DB_ENABLED) return;
  try {
    const { rows } = await dbQuery('SELECT * FROM requests ORDER BY created_at DESC');
    _requestDbCache = rows.map(mapRequestRow);
    _requestDbCacheReady = true;
    console.log(`[request-cache] refreshed – ${_requestDbCache.length} request(s)`);
  } catch (err) {
    console.error('[request-cache] refresh error:', err);
  }
}

function requestToDbParams(r) {
  return [
    r.id,
    r.title,
    r.description || '',
    Number(r.likes || 0),
    Number(r.comments || 0),
    Number(r.boosts || 0),
    r.amount != null ? Number(r.amount) : 0,
    r.funding != null ? Number(r.funding) : 0,
    Boolean(r.isTrending || r.is_trending),
    Boolean(r.isSponsored || r.is_sponsored),
    r.company || null,
    r.companyInitial || r.company_initial || null,
    r.companyColor || r.company_color || null,
    r.imageUrl || r.image_url || null,
    r.creatorId || r.creator_id || (r.creator && r.creator.id) || null,
    r.creatorName || r.creator_name || (r.creator && r.creator.name) || null,
    r.creatorEmail || r.creator_email || (r.creator && r.creator.email) || null,
    r.createdBy || r.created_by || null,
    r.createdAt || r.created_at || new Date().toISOString(),
    r.updatedAt || r.updated_at || null,
    r.currentStep != null ? r.currentStep : (r.current_step != null ? r.current_step : null),
    Boolean(r.claimed),
    r.claimedBy || r.claimed_by ? (typeof (r.claimedBy || r.claimed_by) === 'string' ? (r.claimedBy || r.claimed_by) : JSON.stringify(r.claimedBy || r.claimed_by)) : null,
    r.claimedAt || r.claimed_at || null,
    r.meta ? (typeof r.meta === 'string' ? r.meta : JSON.stringify(r.meta)) : null
  ];
}

const UPSERT_REQUEST_SQL = `
  INSERT INTO requests
    (id,title,description,likes,comments,boosts,amount,funding,
     is_trending,is_sponsored,company,company_initial,company_color,image_url,
     creator_id,creator_name,creator_email,created_by,created_at,updated_at,
     current_step,claimed,claimed_by,claimed_at,meta)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
  ON CONFLICT (id) DO UPDATE SET
    title=EXCLUDED.title, description=EXCLUDED.description,
    likes=EXCLUDED.likes, comments=EXCLUDED.comments, boosts=EXCLUDED.boosts,
    amount=EXCLUDED.amount, funding=EXCLUDED.funding,
    is_trending=EXCLUDED.is_trending, is_sponsored=EXCLUDED.is_sponsored,
    company=EXCLUDED.company, company_initial=EXCLUDED.company_initial,
    company_color=EXCLUDED.company_color, image_url=EXCLUDED.image_url,
    creator_id=EXCLUDED.creator_id, creator_name=EXCLUDED.creator_name,
    creator_email=EXCLUDED.creator_email, created_by=EXCLUDED.created_by,
    updated_at=EXCLUDED.updated_at, current_step=EXCLUDED.current_step,
    claimed=EXCLUDED.claimed, claimed_by=EXCLUDED.claimed_by,
    claimed_at=EXCLUDED.claimed_at, meta=EXCLUDED.meta`;

async function syncRequestsToDb(requests) {
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    const ids = [];
    for (const r of requests) {
      if (!r || !r.id) continue;
      ids.push(r.id);
      await client.query(UPSERT_REQUEST_SQL, requestToDbParams(r));
    }
    if (ids.length > 0) {
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
      await client.query(`DELETE FROM requests WHERE id NOT IN (${placeholders})`, ids);
    } else {
      await client.query('DELETE FROM requests');
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[request-cache] syncRequestsToDb error:', err);
  } finally {
    client.release();
  }
}

function readRequests() {
  if (DB_ENABLED && _requestDbCacheReady) return _requestDbCache;
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
  if (DB_ENABLED) {
    _requestDbCache = requests;
    _requestDbCacheReady = true;
    _requestDbWriteChain = _requestDbWriteChain
      .then(() => syncRequestsToDb(requests))
      .catch(err => console.error('[request-cache] bg write error:', err));
    return;
  }
  try {
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf8');
  } catch (err) {
    console.error('writeRequests error', err);
  }
}

function toNonNegativeNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed < 0 ? 0 : parsed;
}

function getPaidAmountFromRequest(request) {
  const meta = (request && request.meta && typeof request.meta === 'object') ? request.meta : {};
  const explicitPaid = meta.paidAmount;
  if (Number.isFinite(Number(explicitPaid))) {
    return toNonNegativeNumber(explicitPaid, 0);
  }

  const funding = Number(request && request.funding);
  if (Number.isFinite(funding)) return toNonNegativeNumber(funding, 0);

  const amount = Number(request && request.amount);
  if (Number.isFinite(amount)) return toNonNegativeNumber(amount, 0);

  return 0;
}

function getEffectiveAmountFromRequest(request) {
  const meta = (request && request.meta && typeof request.meta === 'object') ? request.meta : {};
  const override = (meta.staffAmountOverride && typeof meta.staffAmountOverride === 'object')
    ? meta.staffAmountOverride
    : null;

  if (override && override.active && Number.isFinite(Number(override.amount))) {
    return toNonNegativeNumber(override.amount, 0);
  }

  return getPaidAmountFromRequest(request);
}

function applyRequestAmountPresentation(request) {
  if (!request || typeof request !== 'object') return request;
  const effectiveAmount = getEffectiveAmountFromRequest(request);
  return {
    ...request,
    amount: effectiveAmount,
    funding: effectiveAmount
  };
}

async function applyBoostPaymentToRequest(requestId, amountPaid) {
  const parsedPaid = toNonNegativeNumber(amountPaid, 0);
  if (!requestId || !Number.isFinite(parsedPaid) || parsedPaid <= 0) return null;

  if (DB_ENABLED) {
    const { rows } = await dbQuery('SELECT * FROM requests WHERE id = $1 LIMIT 1', [String(requestId)]);
    const row = rows[0];
    if (!row) return null;

    const current = mapRequestRow(row);
    const currentMeta = (current.meta && typeof current.meta === 'object') ? current.meta : {};
    const priorPaid = getPaidAmountFromRequest(current);
    const nextPaid = toNonNegativeNumber(priorPaid + parsedPaid, priorPaid);
    const currentBoosts = Number(currentMeta.syntheticBoosts || current.boosts || 0);
    const nextBoosts = toNonNegativeNumber(currentBoosts + parsedPaid, currentBoosts);
    const nextMeta = {
      ...currentMeta,
      paidAmount: nextPaid,
      lastPaidAmount: parsedPaid,
      lastPaidAt: new Date().toISOString(),
      syntheticBoosts: nextBoosts
    };

    await dbQuery(
      'UPDATE requests SET funding = $1, boosts = $2, meta = $3::jsonb, updated_at = NOW() WHERE id = $4',
      [nextPaid, nextBoosts, JSON.stringify(nextMeta), String(requestId)]
    );
    const updated = await dbQuery('SELECT * FROM requests WHERE id = $1 LIMIT 1', [String(requestId)]);
    refreshRequestCache().catch(() => {});
    return updated.rows[0] ? mapRequestRow(updated.rows[0]) : null;
  }

  const requests = readRequests();
  const idx = requests.findIndex(r => String(r.id) === String(requestId));
  if (idx === -1) return null;

  const reqItem = requests[idx] || {};
  const currentMeta = (reqItem.meta && typeof reqItem.meta === 'object') ? reqItem.meta : {};
  const priorPaid = getPaidAmountFromRequest(reqItem);
  const nextPaid = toNonNegativeNumber(priorPaid + parsedPaid, priorPaid);
  const prevBoosts = Number(reqItem.boosts || 0);
  const nextBoosts = toNonNegativeNumber(prevBoosts + parsedPaid, prevBoosts);

  const updatedRequest = {
    ...reqItem,
    boosts: nextBoosts,
    funding: nextPaid,
    meta: {
      ...currentMeta,
      paidAmount: nextPaid,
      lastPaidAmount: parsedPaid,
      lastPaidAt: new Date().toISOString(),
      syntheticBoosts: nextBoosts
    },
    updatedAt: new Date().toISOString()
  };

  requests[idx] = updatedRequest;
  writeRequests(requests);
  return updatedRequest;
}

// Comments persistence
const COMMENTS_FILE = path.join(__dirname, 'comments.json');
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

const loadComments = async () => {
  if (!DB_ENABLED) return readComments();
  const { rows } = await dbQuery('SELECT payload FROM request_comments ORDER BY created_at DESC');
  return rows.map(row => row.payload);
};

const saveComments = async (comments) => {
  if (!DB_ENABLED) {
    writeComments(comments);
    return;
  }
  const client = await dbPool.connect();
  const ids = comments.map(c => String(c.id));
  try {
    await client.query('BEGIN');
    for (const comment of comments) {
      const createdAt = comment.createdAt ? new Date(comment.createdAt) : new Date();
      await client.query(
        `INSERT INTO request_comments (id, request_id, payload, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET request_id = EXCLUDED.request_id, payload = EXCLUDED.payload`,
        [String(comment.id), comment.requestId || null, comment, createdAt]
      );
    }
    if (ids.length > 0) {
      await client.query('DELETE FROM request_comments WHERE id NOT IN (' + ids.map((_, i) => `$${i + 1}`).join(',') + ')', ids);
    } else {
      await client.query('DELETE FROM request_comments');
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

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

const loadVideos = async () => {
  if (!DB_ENABLED) return readVideos();
  const { rows } = await dbQuery('SELECT payload FROM videos ORDER BY created_at DESC');
  return rows.map(row => row.payload);
};

const saveVideos = async (videos) => {
  if (!DB_ENABLED) {
    writeVideos(videos);
    return;
  }
  const client = await dbPool.connect();
  const ids = videos.map(v => String(v.id));
  try {
    await client.query('BEGIN');
    for (const video of videos) {
      const createdAt = video.createdAt ? new Date(video.createdAt) : new Date();
      await client.query(
        `INSERT INTO videos (id, payload, created_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
        [String(video.id), video, createdAt]
      );
    }
    if (ids.length > 0) {
      await client.query('DELETE FROM videos WHERE id NOT IN (' + ids.map((_, i) => `$${i + 1}`).join(',') + ')', ids);
    } else {
      await client.query('DELETE FROM videos');
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const PRODUCTS_FILE = path.join(__dirname, 'products.json');
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

const loadProducts = async () => {
  if (!DB_ENABLED) return readProducts();
  const { rows } = await dbQuery('SELECT payload FROM products ORDER BY created_at DESC');
  return rows.map(row => row.payload);
};

const saveProducts = async (products) => {
  if (!DB_ENABLED) {
    writeProducts(products);
    return;
  }
  const client = await dbPool.connect();
  const ids = products.map(p => String(p.id || p.name || crypto.randomBytes(8).toString('hex')));
  try {
    await client.query('BEGIN');
    for (const product of products) {
      const id = String(product.id || product.name || crypto.randomBytes(8).toString('hex'));
      const createdAt = product.createdAt ? new Date(product.createdAt) : new Date();
      await client.query(
        `INSERT INTO products (id, payload, created_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
        [id, product, createdAt]
      );
    }
    if (ids.length > 0) {
      await client.query('DELETE FROM products WHERE id NOT IN (' + ids.map((_, i) => `$${i + 1}`).join(',') + ')', ids);
    } else {
      await client.query('DELETE FROM products');
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const NOTIFICATIONS_FILE = path.join(__dirname, 'suggestions.json');
const readNotifications = () => {
  try {
    if (!fs.existsSync(NOTIFICATIONS_FILE)) return [];
    const raw = fs.readFileSync(NOTIFICATIONS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('readNotifications error', err);
    return [];
  }
};

const writeNotifications = (list) => {
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('writeNotifications error', err);
  }
};

const loadNotifications = async () => {
  if (!DB_ENABLED) return readNotifications();
  const { rows } = await dbQuery('SELECT payload FROM notifications ORDER BY created_at DESC');
  return rows.map(row => row.payload);
};

const saveNotifications = async (list) => {
  if (!DB_ENABLED) {
    writeNotifications(list);
    return;
  }
  const client = await dbPool.connect();
  const ids = list.map(n => String(n.id));
  try {
    await client.query('BEGIN');
    for (const notif of list) {
      if (!notif || !notif.id) continue;
      const createdAt = notif.createdAt ? new Date(notif.createdAt) : new Date();
      const toId = notif.to?.id || notif.userId || null;
      const fromId = notif.from?.id || null;
      const type = notif.type || null;
      const isRead = Boolean(notif.read);
      await client.query(
        `INSERT INTO notifications (id, to_id, from_id, type, read, payload, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET to_id = EXCLUDED.to_id, from_id = EXCLUDED.from_id, type = EXCLUDED.type, read = EXCLUDED.read, payload = EXCLUDED.payload`,
        [String(notif.id), toId, fromId, type, isRead, notif, createdAt]
      );
    }
    if (ids.length > 0) {
      await client.query('DELETE FROM notifications WHERE id NOT IN (' + ids.map((_, i) => `$${i + 1}`).join(',') + ')', ids);
    } else {
      await client.query('DELETE FROM notifications');
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Regaarder backend running' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', version: '2026-03-04-dbcache', db: !!process.env.DATABASE_URL });
});

// Temporary diagnostic - shows DB table row counts and cache sizes
app.get('/debug/db-status', async (req, res) => {
  try {
    if (!DB_ENABLED) return res.json({ db: false, message: 'DB not enabled' });
    const tables = ['users', 'requests', 'videos'];
    const counts = {};
    for (const t of tables) {
      try {
        const { rows } = await dbQuery(`SELECT COUNT(*) as c FROM ${t}`);
        counts[t] = parseInt(rows[0].c);
      } catch (e) { counts[t] = 'error: ' + e.message; }
    }
    // Try refreshing caches and capture errors
    let userRefreshError = null;
    let requestRefreshError = null;
    try { await refreshUserCache(); } catch (e) { userRefreshError = e.message; }
    try { await refreshRequestCache(); } catch (e) { requestRefreshError = e.message; }
    // Also try a raw SELECT to see what columns exist
    let userColumns = [];
    try {
      const { rows } = await dbQuery("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position");
      userColumns = rows.map(r => r.column_name);
    } catch (e) { userColumns = ['error: ' + e.message]; }
    let sampleUser = null;
    try {
      const { rows } = await dbQuery('SELECT * FROM users LIMIT 1');
      if (rows[0]) sampleUser = Object.keys(rows[0]);
    } catch (e) { sampleUser = 'error: ' + e.message; }
    res.json({
      db: true,
      tableCounts: counts,
      userCacheSize: _userDbCache.length,
      userCacheReady: _userDbCacheReady,
      userRefreshError,
      requestCacheSize: typeof _requestDbCache !== 'undefined' ? _requestDbCache.length : 'N/A',
      requestCacheReady: typeof _requestDbCacheReady !== 'undefined' ? _requestDbCacheReady : 'N/A',
      requestRefreshError,
      userColumns,
      sampleUserKeys: sampleUser
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/currency/rates', async (req, res) => {
  const requestedBase = String(req.query.base || 'USD').toUpperCase();
  const base = requestedBase || 'USD';
  const now = Date.now();

  if (
    currencyRatesCache.base === base &&
    currencyRatesCache.updatedAt &&
    now - currencyRatesCache.updatedAt < CURRENCY_CACHE_TTL_MS
  ) {
    const cachedRates = sanitizeCurrencyRates(currencyRatesCache.rates);
    return res.json({
      base,
      rates: cachedRates,
      updatedAt: currencyRatesCache.updatedAt,
      cached: true
    });
  }

  try {
    const providerUrl = `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`;
    const payload = await fetchJsonWithTimeout(providerUrl, {}, 9000);
    if (!payload || payload.result !== 'success' || !payload.rates) {
      throw new Error('Unexpected exchange rate payload');
    }

    const safeRates = sanitizeCurrencyRates(payload.rates);

    currencyRatesCache.base = base;
    currencyRatesCache.rates = safeRates;
    currencyRatesCache.updatedAt = now;

    return res.json({
      base,
      rates: safeRates,
      updatedAt: now,
      cached: false
    });
  } catch (error) {
    if (currencyRatesCache.rates && Object.keys(currencyRatesCache.rates).length > 0) {
      const safeCachedRates = sanitizeCurrencyRates(currencyRatesCache.rates);
      return res.json({
        base: currencyRatesCache.base || 'USD',
        rates: safeCachedRates,
        updatedAt: currencyRatesCache.updatedAt || now,
        cached: true,
        fallback: true
      });
    }

    return res.json({
      base: 'USD',
      rates: sanitizeCurrencyRates(FALLBACK_CURRENCY_RATES),
      updatedAt: now,
      cached: false,
      fallback: true
    });
  }
});

app.get('/currency/locale', async (req, res) => {
  const ip = getClientIpAddress(req);
  const cacheKey = ip || 'unknown';
  const now = Date.now();
  const cachedGeo = geoCache.get(cacheKey);

  if (cachedGeo && now - cachedGeo.cachedAt < GEO_CACHE_TTL_MS) {
    return res.json({ ...cachedGeo.payload, cached: true });
  }

  const fallbackPayload = {
    ip: ip || null,
    countryCode: null,
    currencyCode: 'USD',
    source: 'fallback'
  };

  try {
    const isLocal = isPrivateIp(ip);
    const geoUrl = isLocal
      ? 'https://ipapi.co/json/'
      : `https://ipapi.co/${encodeURIComponent(ip)}/json/`;

    const payload = await fetchJsonWithTimeout(geoUrl, {}, 9000);
    const currencyCode = String(payload.currency || payload.currency_code || 'USD').toUpperCase();
    const countryCode = String(payload.country_code || payload.country || '').toUpperCase() || null;

    const responsePayload = {
      ip: ip || null,
      countryCode,
      currencyCode: currencyCode || 'USD',
      source: 'ipapi'
    };

    geoCache.set(cacheKey, { cachedAt: now, payload: responsePayload });
    return res.json({ ...responsePayload, cached: false });
  } catch (error) {
    geoCache.set(cacheKey, { cachedAt: now, payload: fallbackPayload });
    return res.json({ ...fallbackPayload, cached: false });
  }
});

// Get all marketplace products
app.get('/products', (req, res) => {
  try {
    return (async () => {
      const products = await loadProducts();
      return res.json({ success: true, products });
    })().catch((err) => {
      console.error('get products error', err);
      return res.status(500).json({ error: 'Server error' });
    });
  } catch (err) {
    console.error('get products error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Bottom ad templates persistence
const BOTTOM_TEMPLATES_FILE = path.join(__dirname, 'bottom_ad_templates.json');
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

const loadBottomTemplates = async () => {
  if (!DB_ENABLED) return readBottomTemplates();
  const { rows } = await dbQuery('SELECT payload FROM bottom_templates ORDER BY created_at DESC');
  return rows.map(row => row.payload);
};

const saveBottomTemplates = async (list) => {
  if (!DB_ENABLED) {
    writeBottomTemplates(list);
    return;
  }
  const client = await dbPool.connect();
  const ids = list.map(t => String(t.id));
  try {
    await client.query('BEGIN');
    for (const tpl of list) {
      const createdAt = tpl.createdAt ? new Date(tpl.createdAt) : new Date();
      await client.query(
        `INSERT INTO bottom_templates (id, payload, created_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
        [String(tpl.id), tpl, createdAt]
      );
    }
    if (ids.length > 0) {
      await client.query('DELETE FROM bottom_templates WHERE id NOT IN (' + ids.map((_, i) => `$${i + 1}`).join(',') + ')', ids);
    } else {
      await client.query('DELETE FROM bottom_templates');
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

app.get('/templates/bottom', (req, res) => {
  try {
    return (async () => {
      const templates = await loadBottomTemplates();
      return res.json({ success: true, templates });
    })().catch((err) => {
      console.error('get bottom templates error', err);
      return res.status(500).json({ error: 'Server error' });
    });
  } catch (err) {
    console.error('get bottom templates error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/templates/bottom', async (req, res) => {
  try {
    const { name, avatar, text, link, assets } = req.body || {};
    if (!name || !text) return res.status(400).json({ error: 'Missing fields' });
    const list = DB_ENABLED ? await loadBottomTemplates() : readBottomTemplates();
    const id = Date.now();
    const tpl = { id, name, avatar: avatar || '', text: text || '', link: link || '', assets: assets || [] };
    list.unshift(tpl);
    if (!DB_ENABLED) writeBottomTemplates(list);
    else await saveBottomTemplates(list);
    return res.json({ success: true, template: tpl });
  } catch (err) {
    console.error('post bottom template error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.put('/templates/bottom/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    if (DB_ENABLED) {
      const { rows } = await dbQuery('SELECT payload FROM bottom_templates WHERE id = $1 LIMIT 1', [String(id)]);
      if (!rows[0]) return res.status(404).json({ error: 'Template not found' });
      const existing = rows[0].payload || {};
      const updated = { ...existing, ...body, id: existing.id };
      await dbQuery(
        `INSERT INTO bottom_templates (id, payload, created_at)
         VALUES ($1, $2, COALESCE(($2->>'createdAt')::timestamptz, now()))
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
        [String(id), updated]
      );
      return res.json({ success: true, template: updated });
    }

    const list = readBottomTemplates();
    const idx = list.findIndex(t => Number(t.id) === id);
    if (idx === -1) return res.status(404).json({ error: 'Template not found' });
    const updated = { ...list[idx], ...body, id: list[idx].id };
    list[idx] = updated;
    writeBottomTemplates(list);
    return res.json({ success: true, template: updated });
  } catch (err) {
    console.error('update bottom template error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/signup', async (req, res) => {
  const { email, password, name, referralCode } = req.body || {};
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing email, password or name' });
  const emailLower = String(email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) return res.status(400).json({ error: 'Invalid email format' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  if (DB_ENABLED) {
    try {
      const existing = await dbQuery('SELECT id FROM users WHERE email = $1 LIMIT 1', [emailLower]);
      if (existing.rows.length) return res.status(409).json({ error: 'Account already exists for this email' });

      let referrerUser = null;
      if (referralCode && referralCode.trim()) {
        const trimmedCode = referralCode.trim().toUpperCase();
        const refRes = await dbQuery('SELECT id, referral_code FROM users WHERE UPPER(referral_code) = $1 LIMIT 1', [trimmedCode]);
        referrerUser = refRes.rows[0] || null;
        if (!referrerUser) return res.status(400).json({ error: 'Invalid referral code' });
      }

      const hash = await bcrypt.hash(password, 10);
      const token = crypto.randomBytes(16).toString('hex');
      const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
      const userId = `user-${Date.now()}`;
      const now = new Date().toISOString();

      await dbQuery(
        `INSERT INTO users
          (id, email, name, password_hash, referral_code, referrer_id, referral_count, created_at, password_changed_at, token)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [userId, emailLower, name, hash, newReferralCode, referrerUser ? referrerUser.id : null, 0, now, now, token]
      );

      if (referrerUser) {
        await dbQuery('UPDATE users SET referral_count = COALESCE(referral_count, 0) + 1 WHERE id = $1', [referrerUser.id]);
      }

      const { rows } = await dbQuery('SELECT * FROM users WHERE id = $1', [userId]);
      refreshUserCache().catch(() => {});  // keep cache in sync
      return res.json({ user: toPublicUser(mapUserRow(rows[0])), token });
    } catch (err) {
      console.error('signup db error', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

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

  if (DB_ENABLED) {
    try {
      const { rows } = await dbQuery('SELECT * FROM users WHERE email = $1 LIMIT 1', [emailLower]);
      const user = rows[0] ? mapUserRow(rows[0]) : null;
      if (!user) return res.status(404).json({ error: 'No account found for this email' });

      const ok = await bcrypt.compare(password, user.password_hash || user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Incorrect password' });

      const token = crypto.randomBytes(16).toString('hex');
      await dbQuery('UPDATE users SET token = $1 WHERE id = $2', [token, user.id]);
      const refreshed = await dbQuery('SELECT * FROM users WHERE id = $1', [user.id]);
      refreshUserCache().catch(() => {});  // keep cache in sync
      return res.json({ user: toPublicUser(mapUserRow(refreshed.rows[0])), token });
    } catch (err) {
      console.error('login db error', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

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

  const { passwordHash: _ph, ...publicUser } = updated;
  res.json({ user: publicUser, token });
});

// Simple auth middleware that validates Bearer token
async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7).trim();
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    if (DB_ENABLED) {
      const { rows } = await dbQuery('SELECT id, email, name FROM users WHERE token = $1 LIMIT 1', [token]);
      const user = rows[0];
      if (!user) return res.status(401).json({ error: 'Invalid token' });
      req.user = { id: user.id, email: user.email, name: user.name };
      return next();
    }

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
const PLAYBACK_FILE = path.join(__dirname, 'playback.json');
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

const playbackKeyFor = ({ userId, anonId }) => (userId ? `user:${userId}` : `anon:${anonId || 'anonymous'}`);

const savePlaybackDb = async ({ userId, anonId, videoId, currentTime }) => {
  const key = playbackKeyFor({ userId, anonId });
  await dbQuery(
    `INSERT INTO playback_positions (id, user_id, anon_id, video_id, current_time, updated_at)
     VALUES ($1,$2,$3,$4,$5,now())
     ON CONFLICT (id)
     DO UPDATE SET user_id = EXCLUDED.user_id, anon_id = EXCLUDED.anon_id, video_id = EXCLUDED.video_id, current_time = EXCLUDED.current_time, updated_at = now()`,
    [key, userId || null, anonId || null, String(videoId), Number(currentTime) || 0]
  );
};

const loadPlaybackDb = async ({ userId, anonId }) => {
  const key = playbackKeyFor({ userId, anonId });
  const { rows } = await dbQuery('SELECT video_id, current_time, updated_at FROM playback_positions WHERE id = $1 LIMIT 1', [key]);
  if (!rows[0]) return {};
  return {
    videoId: rows[0].video_id,
    currentTime: Number(rows[0].current_time || 0),
    updatedAt: rows[0].updated_at
  };
};

// Save playback position (authenticated preferred, anonymous fallback)
app.post('/api/playback', async (req, res) => {
  try {
    const body = req.body || {};
    const { videoId, currentTime } = body;
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });

    if (DB_ENABLED) {
      const user = await getUserFromAuthHeader(req);
      if (user) {
        await savePlaybackDb({ userId: user.id, videoId, currentTime });
        return res.json({ ok: true });
      }
      const anonKey = body.anonId || 'anonymous';
      await savePlaybackDb({ anonId: anonKey, videoId, currentTime });
      return res.json({ ok: true });
    }

    const playback = readPlayback();
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.slice(7).trim();
      const users = readUsers();
      const user = users.find(u => u.token === token);
      if (user) {
        playback[user.id] = { videoId, currentTime: Number(currentTime) || 0, updatedAt: new Date().toISOString() };
        writePlayback(playback);
        return res.json({ ok: true });
      }
    }

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
app.get('/api/playback', async (req, res) => {
  try {
    if (DB_ENABLED) {
      const user = await getUserFromAuthHeader(req);
      if (user) {
        const data = await loadPlaybackDb({ userId: user.id });
        return res.json(data || {});
      }
      const anonKey = req.query.anonId || 'anonymous';
      const data = await loadPlaybackDb({ anonId: anonKey });
      return res.json(data || {});
    }

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
    const requestAmount = getEffectiveAmountFromRequest(request);
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
app.post('/sponsors', authMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    const { name, brief, assets } = body;
    if (!name) return res.status(400).json({ error: 'Missing sponsor name' });

    const sponsors = await loadSponsors();
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
    await saveSponsors(sponsors);

    return res.json({ success: true, sponsor });
  } catch (err) {
    console.error('create sponsor error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get sponsors for current authenticated user
app.get('/sponsors/me', authMiddleware, async (req, res) => {
  try {
    const sponsors = (await loadSponsors()).filter(s => s.ownerId === req.user.id);
    return res.json({ sponsors });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Advertiser dashboard endpoint: only owner can access their dashboard data
app.get('/advertiser/dashboard', authMiddleware, async (req, res) => {
  try {
    const sponsors = (await loadSponsors()).filter(s => s.ownerId === req.user.id);
    // For demo purposes, also include recent campaigns from local file if present
    let campaigns = [];
    if (DB_ENABLED) {
      const { rows } = await dbQuery('SELECT payload FROM advertiser_campaigns WHERE owner_id = $1 ORDER BY created_at DESC', [req.user.id]);
      campaigns = rows.map(r => r.payload);
    } else {
      const campaignsFile = path.join(__dirname, 'advertiser_campaigns.json');
      if (fs.existsSync(campaignsFile)) {
        try { campaigns = JSON.parse(fs.readFileSync(campaignsFile, 'utf8') || '[]').filter(c => c.ownerId === req.user.id); } catch (e) { campaigns = []; }
      }
    }
    return res.json({ sponsors, campaigns });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get a sponsor by id and ensure only owner can access
app.get('/sponsors/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const sponsors = await loadSponsors();
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
    if (DB_ENABLED) {
      return (async () => {
        if (action === 'add') {
          const exists = await dbQuery(
            'SELECT id FROM request_bookmarks WHERE user_id = $1 AND request_id = $2 LIMIT 1',
            [req.user.id, requestId]
          );
          if (!exists.rows[0]) {
            const id = `req_${Date.now()}`;
            await dbQuery('INSERT INTO request_bookmarks (id, user_id, request_id, title) VALUES ($1,$2,$3,$4)', [id, req.user.id, requestId, title || '']);
          }
        } else if (action === 'remove') {
          await dbQuery('DELETE FROM request_bookmarks WHERE user_id = $1 AND request_id = $2', [req.user.id, requestId]);
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }
        return res.json({ success: true, requestId, action });
      })().catch((err) => {
        console.error('bookmark db error', err);
        return res.status(500).json({ error: 'Server error' });
      });
    }

    const all = readBookmarks();
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
app.post('/bookmarks/requests', async (req, res) => {
  try {
    const user = await getUserFromAuthHeader(req);
    const userId = user ? user.id : 'anonymous';
    const { requestId, title } = req.body || {};
    if (!requestId) return res.status(400).json({ error: 'Missing requestId' });

    if (DB_ENABLED) {
      const exists = await dbQuery(
        'SELECT id FROM request_bookmarks WHERE user_id = $1 AND request_id = $2 LIMIT 1',
        [userId, requestId]
      );
      if (!exists.rows.length) {
        const id = `req_${Date.now()}`;
        await dbQuery('INSERT INTO request_bookmarks (id, user_id, request_id, title) VALUES ($1,$2,$3,$4)', [id, userId, requestId, title || '']);
      }
      return res.json({ success: true, requestId, action: 'add', userId });
    }

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
app.delete('/bookmarks/requests', async (req, res) => {
  try {
    const user = await getUserFromAuthHeader(req);
    const userId = user ? user.id : 'anonymous';
    const { requestId } = req.body || {};
    if (!requestId) return res.status(400).json({ error: 'Missing requestId' });

    if (DB_ENABLED) {
      const { rowCount } = await dbQuery('DELETE FROM request_bookmarks WHERE user_id = $1 AND request_id = $2', [userId, requestId]);
      return res.json({ success: true, removed: rowCount, requestId, userId });
    }

    const all = readBookmarks();
    const before = (all.requests || []).length;
    all.requests = (all.requests || []).filter(b => !(String(b.userId || 'anonymous') === String(userId) && String(b.requestId) === String(requestId)));
    writeBookmarks(all);
    return res.json({ success: true, removed: before - all.requests.length, requestId, userId });
  } catch (err) { console.error('DELETE /bookmarks/requests error', err); return res.status(500).json({ error: 'Server error' }); }
});

const PAYPAL_API_BASE = (
  process.env.PAYPAL_API_BASE
  || (String(process.env.PAYPAL_ENV || '').toLowerCase() === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com')
).replace(/\/$/, '');

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || '';

const parseUsdAmount = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100) / 100;
};

const toUsdString = (value) => {
  const n = parseUsdAmount(value);
  if (!Number.isFinite(n)) return '';
  return n.toFixed(2);
};

const getPayPalAccessToken = async () => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    const err = new Error('PayPal credentials not configured');
    err.status = 500;
    err.details = { missing: ['PAYPAL_CLIENT_ID', 'PAYPAL_SECRET'] };
    throw err;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const resp = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.access_token) {
    const details = {
      error: data.error || null,
      error_description: data.error_description || null,
      status: resp.status
    };
    const err = new Error(data.error_description || data.error || 'PayPal auth failed');
    err.status = 502;
    err.details = details;
    throw err;
  }

  return data.access_token;
};

const getRequestByIdForSuggestion = async (requestId) => {
  if (!requestId) return null;

  if (DB_ENABLED) {
    try {
      const { rows } = await dbQuery('SELECT * FROM requests WHERE id = $1 LIMIT 1', [String(requestId)]);
      if (rows[0]) return mapRequestRow(rows[0]);
    } catch (e) {}
  }

  try {
    const reqs = readRequests();
    return reqs.find((x) => String(x.id) === String(requestId)) || null;
  } catch (e) {
    return null;
  }
};

const getCreatorIdFromRequest = ({ request, fromUserId }) => {
  if (!request) return null;

  const creatorId =
    request.targetCreatorId
    || request.creatorId
    || request.creator_id
    || (request.creator && request.creator.id)
    || null;

  const createdBy = request.createdBy || request.created_by || null;

  if (creatorId) {
    if (fromUserId && String(creatorId) === String(fromUserId) && createdBy) {
      return createdBy;
    }
    return creatorId;
  }

  return createdBy || null;
};

const resolveSuggestionTargetCreatorId = async ({ requestId, targetCreatorId, targetCreatorHandle, fromUserId, type }) => {
  let toId = targetCreatorId || null;

  try {
    if (!toId && requestId) {
      const found = await getRequestByIdForSuggestion(requestId);
      toId = getCreatorIdFromRequest({ request: found, fromUserId }) || null;
    }
  } catch (e) {}

  if (type === 'reply' && targetCreatorId) {
    toId = targetCreatorId;
  }

  try {
    if (!toId && targetCreatorHandle) {
      const h = String(targetCreatorHandle).trim().toLowerCase();
      if (DB_ENABLED) {
        const { rows } = await dbQuery(
          `SELECT id FROM users
           WHERE LOWER(COALESCE(handle, '')) = $1
              OR LOWER(COALESCE(tag, '')) = $1
              OR LOWER(COALESCE(name, '')) = $1
              OR LOWER(split_part(COALESCE(email, ''), '@', 1)) = $1
           LIMIT 1`,
          [h]
        );
        if (rows[0] && rows[0].id) toId = rows[0].id;
      }

      if (!toId) {
        const users = readUsers();
        const foundUser = users.find((x) =>
          (x.handle && String(x.handle).toLowerCase() === h)
          || (x.tag && String(x.tag).toLowerCase() === h)
          || (x.name && String(x.name).toLowerCase() === h)
          || (x.email && String(x.email).split('@')[0].toLowerCase() === h)
        );
        if (foundUser) toId = foundUser.id;
      }
    }
  } catch (e) {}

  return toId || null;
};

const buildSuggestionSortTimestamp = (s) => {
  const raw = s.fundedAt || s.createdAt;
  const d = new Date(raw || 0);
  return Number.isFinite(d.getTime()) ? d.getTime() : 0;
};

// Suggestion endpoint: requires authentication (persisted for notifications)
    app.post('/suggestion', authMiddleware, async (req, res) => {
      try {
        const { requestId, text, targetCreatorId, targetCreatorHandle, videoUrl, videoTitle, type, parentId } = req.body || {};
        if (!text) return res.status(400).json({ error: 'Missing text' });
    
        const toId = await resolveSuggestionTargetCreatorId({
          requestId,
          targetCreatorId,
          targetCreatorHandle,
          fromUserId: req.user.id,
          type
        });
    
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
    
        const arr = await loadNotifications();
        arr.unshift(suggestion);
        await saveNotifications(arr);
    
        return res.json({ success: true, suggestion });
      } catch (err) {
        console.error('suggestion error', err);
        return res.status(500).json({ error: 'Server error' });
      }
    });

    app.post('/suggestions/funded/paypal/create-order', authMiddleware, async (req, res) => {
      try {
        const { requestId, text, amount, targetCreatorId, targetCreatorHandle, returnBaseUrl } = req.body || {};
        const trimmedText = String(text || '').trim();
        const parsedAmount = parseUsdAmount(amount);

        if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
        if (!trimmedText) return res.status(400).json({ error: 'Missing text' });
        if (!Number.isFinite(parsedAmount) || parsedAmount < 2) {
          return res.status(400).json({ error: 'Minimum funded suggestion amount is $2.00' });
        }

        const toId = await resolveSuggestionTargetCreatorId({
          requestId,
          targetCreatorId,
          targetCreatorHandle,
          fromUserId: req.user.id,
          type: 'suggestion'
        });

        if (!toId) {
          const reqForDebug = await getRequestByIdForSuggestion(requestId);
          const debugCreatorId = reqForDebug ? getCreatorIdFromRequest({ request: reqForDebug, fromUserId: req.user.id }) : null;
          console.warn('[funded-suggestion] Could not resolve creator', {
            requestId,
            fromUserId: req.user.id,
            targetCreatorId: targetCreatorId || null,
            targetCreatorHandle: targetCreatorHandle || null,
            requestFound: Boolean(reqForDebug),
            requestCreatorId: debugCreatorId || null
          });
          return res.status(400).json({ error: 'Could not resolve creator for this suggestion' });
        }

        const nowIso = new Date().toISOString();
        const suggestionId = `s-funded-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const fallbackBase = (WEB_URL || '').replace(/\/$/, '') || 'https://regaarder.com';
        const requestedBase = String(returnBaseUrl || '').trim();
        const safeBase = /^https?:\/\//i.test(requestedBase) ? requestedBase.replace(/\/$/, '') : fallbackBase;
        const returnUrl = `${safeBase}/requests?suggestPay=1&requestId=${encodeURIComponent(String(requestId))}&suggestionId=${encodeURIComponent(suggestionId)}`;
        const cancelUrl = `${safeBase}/requests?suggestPay=cancel&requestId=${encodeURIComponent(String(requestId))}`;

        const token = await getPayPalAccessToken();
        const orderResp = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
              {
                reference_id: suggestionId,
                description: `Creative suggestion funding for request ${String(requestId)}`,
                amount: {
                  currency_code: 'USD',
                  value: toUsdString(parsedAmount)
                }
              }
            ],
            application_context: {
              user_action: 'PAY_NOW',
              return_url: returnUrl,
              cancel_url: cancelUrl
            }
          })
        });

        const orderData = await orderResp.json().catch(() => ({}));
        if (!orderResp.ok || !orderData.id) {
          return res.status(502).json({ error: 'Failed to create PayPal order', details: orderData });
        }

        const approveLink = Array.isArray(orderData.links)
          ? orderData.links.find((l) => l && l.rel === 'approve')
          : null;
        if (!approveLink || !approveLink.href) {
          return res.status(502).json({ error: 'PayPal approval link missing' });
        }

        const suggestion = {
          id: suggestionId,
          requestId: requestId || null,
          text: trimmedText,
          from: { id: req.user.id, name: req.user.name || req.user.email },
          to: toId ? { id: toId } : null,
          video: { url: null, title: null },
          type: 'funded_suggestion',
          parentId: null,
          createdAt: nowIso,
          fundedAmount: parsedAmount,
          fundedCurrency: 'USD',
          paymentStatus: 'pending',
          paymentProvider: 'paypal',
          paypalOrderId: orderData.id,
          visibleAfterFunding: true,
          rejectedByCreator: false,
          fundedAt: null
        };

        const arr = await loadNotifications();
        arr.unshift(suggestion);
        await saveNotifications(arr);

        return res.json({
          success: true,
          suggestionId,
          orderId: orderData.id,
          approveUrl: approveLink.href
        });
      } catch (err) {
        console.error('create funded suggestion order error', err);
        return res.status(err.status || 500).json({
          error: 'Unable to start PayPal payment',
          details: err.details || err.message || 'Server error'
        });
      }
    });

    app.post('/suggestions/funded/paypal/capture-order', authMiddleware, async (req, res) => {
      try {
        const { suggestionId, orderId } = req.body || {};
        if (!suggestionId || !orderId) {
          return res.status(400).json({ error: 'Missing suggestionId or orderId' });
        }

        const arr = await loadNotifications();
        const idx = arr.findIndex((s) => String(s.id) === String(suggestionId));
        if (idx === -1) return res.status(404).json({ error: 'Suggestion not found' });

        const suggestion = arr[idx];
        if (!suggestion || !suggestion.from || String(suggestion.from.id) !== String(req.user.id)) {
          return res.status(403).json({ error: 'Not allowed for this suggestion' });
        }
        if (suggestion.paymentStatus === 'paid') {
          return res.json({ success: true, suggestion, alreadyCaptured: true });
        }
        if (String(suggestion.paypalOrderId || '') !== String(orderId)) {
          return res.status(400).json({ error: 'Order mismatch' });
        }

        const token = await getPayPalAccessToken();
        const captureResp = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(String(orderId))}/capture`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const captureData = await captureResp.json().catch(() => ({}));

        if (!captureResp.ok) {
          return res.status(502).json({ error: 'PayPal capture failed', details: captureData });
        }

        const status = String(captureData.status || '').toUpperCase();
        const purchaseUnit = Array.isArray(captureData.purchase_units) ? captureData.purchase_units[0] : null;
        const capture = purchaseUnit && purchaseUnit.payments && Array.isArray(purchaseUnit.payments.captures)
          ? purchaseUnit.payments.captures[0]
          : null;
        const paidValue = parseUsdAmount(capture && capture.amount ? capture.amount.value : NaN);

        if (status !== 'COMPLETED' || !Number.isFinite(paidValue)) {
          return res.status(400).json({ error: 'Payment not completed' });
        }

        const expected = parseUsdAmount(suggestion.fundedAmount);
        if (!Number.isFinite(expected) || paidValue < expected) {
          suggestion.paymentStatus = 'amount_mismatch';
          suggestion.captureAttemptedAt = new Date().toISOString();
          arr[idx] = suggestion;
          await saveNotifications(arr);
          return res.status(400).json({ error: 'Captured amount does not match requested amount' });
        }

        suggestion.paymentStatus = 'paid';
        suggestion.fundedAmount = paidValue;
        suggestion.fundedCurrency = (capture && capture.amount && capture.amount.currency_code) || 'USD';
        suggestion.paymentCaptureId = capture && capture.id ? capture.id : null;
        suggestion.fundedAt = new Date().toISOString();
        suggestion.updatedAt = suggestion.fundedAt;
        suggestion.visibleAfterFunding = true;

        arr[idx] = suggestion;
        await saveNotifications(arr);

        return res.json({
          success: true,
          suggestion: {
            id: suggestion.id,
            requestId: suggestion.requestId,
            text: suggestion.text,
            fundedAmount: suggestion.fundedAmount,
            fundedCurrency: suggestion.fundedCurrency,
            fundedAt: suggestion.fundedAt,
            userName: suggestion.from ? suggestion.from.name : 'Anonymous'
          }
        });
      } catch (err) {
        console.error('capture funded suggestion order error', err);
        return res.status(err.status || 500).json({ error: err.message || 'Server error' });
      }
    });

    app.post('/boosts/paypal/create-order', authMiddleware, async (req, res) => {
      try {
        const { requestId, amount, returnBaseUrl, returnPath } = req.body || {};
        const parsedAmount = parseUsdAmount(amount);
        const allowedAmounts = new Set([10, 25, 50]);

        if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
        if (!Number.isFinite(parsedAmount) || !allowedAmounts.has(parsedAmount)) {
          return res.status(400).json({ error: 'Boost amount must be one of: 10, 25, 50' });
        }

        const foundRequest = await getRequestByIdForSuggestion(requestId);
        if (!foundRequest) return res.status(404).json({ error: 'Request not found' });

        const nowIso = new Date().toISOString();
        const boostPaymentId = `b-funded-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const fallbackBase = (WEB_URL || '').replace(/\/$/, '') || 'https://regaarder.com';
        const requestedBase = String(returnBaseUrl || '').trim();
        const safeBase = /^https?:\/\//i.test(requestedBase) ? requestedBase.replace(/\/$/, '') : fallbackBase;
        const requestedPath = String(returnPath || '').trim();
        const safePath = requestedPath.startsWith('/') ? requestedPath : '/requests';
        const returnUrl = `${safeBase}${safePath}?boostPay=1&requestId=${encodeURIComponent(String(requestId))}&boostPaymentId=${encodeURIComponent(boostPaymentId)}`;
        const cancelUrl = `${safeBase}${safePath}?boostPay=cancel&requestId=${encodeURIComponent(String(requestId))}`;

        const token = await getPayPalAccessToken();
        const orderResp = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
              {
                reference_id: boostPaymentId,
                description: `Request boost payment for request ${String(requestId)}`,
                amount: {
                  currency_code: 'USD',
                  value: toUsdString(parsedAmount)
                }
              }
            ],
            application_context: {
              user_action: 'PAY_NOW',
              return_url: returnUrl,
              cancel_url: cancelUrl
            }
          })
        });

        const orderData = await orderResp.json().catch(() => ({}));
        if (!orderResp.ok || !orderData.id) {
          return res.status(502).json({ error: 'Failed to create PayPal order', details: orderData });
        }

        const approveLink = Array.isArray(orderData.links)
          ? orderData.links.find((l) => l && l.rel === 'approve')
          : null;
        if (!approveLink || !approveLink.href) {
          return res.status(502).json({ error: 'PayPal approval link missing' });
        }

        const boostPayment = {
          id: boostPaymentId,
          type: 'funded_boost',
          requestId: requestId || null,
          from: { id: req.user.id, name: req.user.name || req.user.email },
          createdAt: nowIso,
          boostAmount: parsedAmount,
          fundedAmount: parsedAmount,
          fundedCurrency: 'USD',
          paymentStatus: 'pending',
          paymentProvider: 'paypal',
          paypalOrderId: orderData.id,
          fundedAt: null
        };

        const arr = await loadNotifications();
        arr.unshift(boostPayment);
        await saveNotifications(arr);

        return res.json({
          success: true,
          boostPaymentId,
          orderId: orderData.id,
          approveUrl: approveLink.href
        });
      } catch (err) {
        console.error('create boost PayPal order error', err);
        return res.status(err.status || 500).json({
          error: 'Unable to start boost PayPal payment',
          details: err.details || err.message || 'Server error'
        });
      }
    });

    app.post('/boosts/paypal/capture-order', authMiddleware, async (req, res) => {
      try {
        const { boostPaymentId, orderId } = req.body || {};
        if (!boostPaymentId || !orderId) {
          return res.status(400).json({ error: 'Missing boostPaymentId or orderId' });
        }

        const arr = await loadNotifications();
        const idx = arr.findIndex((s) => String(s.id) === String(boostPaymentId));
        if (idx === -1) return res.status(404).json({ error: 'Boost payment not found' });

        const boostPayment = arr[idx];
        if (String(boostPayment.type || '') !== 'funded_boost') {
          return res.status(400).json({ error: 'Invalid boost payment record' });
        }
        if (!boostPayment || !boostPayment.from || String(boostPayment.from.id) !== String(req.user.id)) {
          return res.status(403).json({ error: 'Not allowed for this boost payment' });
        }
        if (boostPayment.paymentStatus === 'captured') {
          return res.json({ success: true, boostPayment, alreadyCaptured: true });
        }
        if (String(boostPayment.paypalOrderId || '') !== String(orderId)) {
          return res.status(400).json({ error: 'Order mismatch' });
        }

        const token = await getPayPalAccessToken();
        const captureResp = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(String(orderId))}/capture`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const captureData = await captureResp.json().catch(() => ({}));

        if (!captureResp.ok) {
          return res.status(502).json({ error: 'PayPal capture failed', details: captureData });
        }

        const status = String(captureData.status || '').toUpperCase();
        const purchaseUnit = Array.isArray(captureData.purchase_units) ? captureData.purchase_units[0] : null;
        const capture = purchaseUnit && purchaseUnit.payments && Array.isArray(purchaseUnit.payments.captures)
          ? purchaseUnit.payments.captures[0]
          : null;
        const paidValue = parseUsdAmount(capture && capture.amount ? capture.amount.value : NaN);

        if (status !== 'COMPLETED' || !Number.isFinite(paidValue)) {
          return res.status(400).json({ error: 'Payment not completed' });
        }

        const expected = parseUsdAmount(boostPayment.boostAmount);
        if (!Number.isFinite(expected) || paidValue < expected) {
          boostPayment.paymentStatus = 'amount_mismatch';
          boostPayment.captureAttemptedAt = new Date().toISOString();
          arr[idx] = boostPayment;
          await saveNotifications(arr);
          return res.status(400).json({ error: 'Captured amount does not match requested amount' });
        }

        const updatedRequest = await applyBoostPaymentToRequest(boostPayment.requestId, paidValue);
        if (!updatedRequest) {
          return res.status(404).json({ error: 'Request not found for boost crediting' });
        }

        boostPayment.paymentStatus = 'captured';
        boostPayment.boostAmount = paidValue;
        boostPayment.fundedAmount = paidValue;
        boostPayment.fundedCurrency = (capture && capture.amount && capture.amount.currency_code) || 'USD';
        boostPayment.paymentCaptureId = capture && capture.id ? capture.id : null;
        boostPayment.fundedAt = new Date().toISOString();
        boostPayment.updatedAt = boostPayment.fundedAt;

        arr[idx] = boostPayment;
        await saveNotifications(arr);

        return res.json({
          success: true,
          boostPayment: {
            id: boostPayment.id,
            requestId: boostPayment.requestId,
            boostAmount: boostPayment.boostAmount,
            fundedCurrency: boostPayment.fundedCurrency,
            fundedAt: boostPayment.fundedAt,
            userName: boostPayment.from ? boostPayment.from.name : 'Anonymous'
          },
          request: updatedRequest
        });
      } catch (err) {
        console.error('capture boost PayPal order error', err);
        return res.status(err.status || 500).json({ error: err.message || 'Server error' });
      }
    });

    app.post('/ideas/paypal/create-order', authMiddleware, async (req, res) => {
      try {
        const {
          requestId,
          flow,
          amount,
          baseAmount,
          episodes,
          returnBaseUrl,
          returnPath
        } = req.body || {};

        const rawFlow = String(flow || '').trim().toLowerCase();
        const normalizedFlow = rawFlow === 'recurrent' ? 'recurring' : rawFlow;
        const parsedAmount = parseUsdAmount(amount);
        const parsedBaseAmount = parseUsdAmount(baseAmount);
        const parsedEpisodes = Number.parseInt(episodes, 10);

        if (!requestId) return res.status(400).json({ error: 'Missing requestId' });
        if (!['one-time', 'series', 'recurring', 'catalogue'].includes(normalizedFlow)) {
          return res.status(400).json({ error: 'Invalid flow type' });
        }
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
          return res.status(400).json({ error: 'Invalid amount' });
        }

        let requiredBaseAmount = 15;
        if (normalizedFlow === 'one-time') {
          requiredBaseAmount = 15;
        } else if (normalizedFlow === 'series') {
          if (!Number.isFinite(parsedEpisodes) || parsedEpisodes < 1) {
            return res.status(400).json({ error: 'Series flow requires episodes >= 1' });
          }
          requiredBaseAmount = parsedEpisodes * 12;
        } else if (normalizedFlow === 'recurring') {
          requiredBaseAmount = 8;
        } else if (normalizedFlow === 'catalogue') {
          requiredBaseAmount = 4;
        }

        if (Number.isFinite(parsedBaseAmount)) {
          if (parsedBaseAmount < requiredBaseAmount) {
            return res.status(400).json({ error: 'Base amount is below required minimum for selected flow' });
          }
        }

        if (parsedAmount < requiredBaseAmount) {
          return res.status(400).json({ error: 'Amount is below required minimum for selected flow' });
        }

        const foundRequest = await getRequestByIdForSuggestion(requestId);
        if (!foundRequest) return res.status(404).json({ error: 'Request not found' });

        const nowIso = new Date().toISOString();
        const ideaPaymentId = `idea-funded-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const fallbackBase = (WEB_URL || '').replace(/\/$/, '') || 'https://regaarder.com';
        const requestedBase = String(returnBaseUrl || '').trim();
        const safeBase = /^https?:\/\//i.test(requestedBase) ? requestedBase.replace(/\/$/, '') : fallbackBase;
        const requestedPath = String(returnPath || '').trim();
        const safePath = requestedPath.startsWith('/') ? requestedPath : '/ideas';
        const returnUrl = `${safeBase}${safePath}?ideasPay=1&requestId=${encodeURIComponent(String(requestId))}&ideaPaymentId=${encodeURIComponent(ideaPaymentId)}`;
        const cancelUrl = `${safeBase}${safePath}?ideasPay=cancel&requestId=${encodeURIComponent(String(requestId))}`;

        const token = await getPayPalAccessToken();
        const orderResp = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
              {
                reference_id: ideaPaymentId,
                description: `Ideas payment for request ${String(requestId)} (${normalizedFlow})`,
                amount: {
                  currency_code: 'USD',
                  value: toUsdString(parsedAmount)
                }
              }
            ],
            application_context: {
              user_action: 'PAY_NOW',
              return_url: returnUrl,
              cancel_url: cancelUrl
            }
          })
        });

        const orderData = await orderResp.json().catch(() => ({}));
        if (!orderResp.ok || !orderData.id) {
          return res.status(502).json({ error: 'Failed to create PayPal order', details: orderData });
        }

        const approveLink = Array.isArray(orderData.links)
          ? orderData.links.find((l) => l && l.rel === 'approve')
          : null;
        if (!approveLink || !approveLink.href) {
          return res.status(502).json({ error: 'PayPal approval link missing' });
        }

        const ideaPayment = {
          id: ideaPaymentId,
          type: 'funded_idea_payment',
          requestId: requestId || null,
          flow: normalizedFlow,
          episodes: Number.isFinite(parsedEpisodes) ? parsedEpisodes : null,
          from: { id: req.user.id, name: req.user.name || req.user.email },
          createdAt: nowIso,
          expectedAmount: parsedAmount,
          baseAmount: Number.isFinite(parsedBaseAmount) ? parsedBaseAmount : requiredBaseAmount,
          fundedAmount: parsedAmount,
          fundedCurrency: 'USD',
          paymentStatus: 'pending',
          paymentProvider: 'paypal',
          paypalOrderId: orderData.id,
          fundedAt: null
        };

        const arr = await loadNotifications();
        arr.unshift(ideaPayment);
        await saveNotifications(arr);

        return res.json({
          success: true,
          ideaPaymentId,
          orderId: orderData.id,
          approveUrl: approveLink.href
        });
      } catch (err) {
        console.error('create ideas PayPal order error', err);
        return res.status(err.status || 500).json({
          error: 'Unable to start ideas PayPal payment',
          details: err.details || err.message || 'Server error'
        });
      }
    });

    app.post('/ideas/paypal/capture-order', authMiddleware, async (req, res) => {
      try {
        const { ideaPaymentId, orderId } = req.body || {};
        if (!ideaPaymentId || !orderId) {
          return res.status(400).json({ error: 'Missing ideaPaymentId or orderId' });
        }

        const arr = await loadNotifications();
        const idx = arr.findIndex((s) => String(s.id) === String(ideaPaymentId));
        if (idx === -1) return res.status(404).json({ error: 'Ideas payment not found' });

        const ideaPayment = arr[idx];
        if (String(ideaPayment.type || '') !== 'funded_idea_payment') {
          return res.status(400).json({ error: 'Invalid ideas payment record' });
        }
        if (!ideaPayment || !ideaPayment.from || String(ideaPayment.from.id) !== String(req.user.id)) {
          return res.status(403).json({ error: 'Not allowed for this ideas payment' });
        }
        if (ideaPayment.paymentStatus === 'captured') {
          return res.json({ success: true, ideaPayment, alreadyCaptured: true });
        }
        if (String(ideaPayment.paypalOrderId || '') !== String(orderId)) {
          return res.status(400).json({ error: 'Order mismatch' });
        }

        const token = await getPayPalAccessToken();
        const captureResp = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(String(orderId))}/capture`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const captureData = await captureResp.json().catch(() => ({}));

        if (!captureResp.ok) {
          return res.status(502).json({ error: 'PayPal capture failed', details: captureData });
        }

        const status = String(captureData.status || '').toUpperCase();
        const purchaseUnit = Array.isArray(captureData.purchase_units) ? captureData.purchase_units[0] : null;
        const capture = purchaseUnit && purchaseUnit.payments && Array.isArray(purchaseUnit.payments.captures)
          ? purchaseUnit.payments.captures[0]
          : null;
        const paidValue = parseUsdAmount(capture && capture.amount ? capture.amount.value : NaN);

        if (status !== 'COMPLETED' || !Number.isFinite(paidValue)) {
          return res.status(400).json({ error: 'Payment not completed' });
        }

        const expected = parseUsdAmount(ideaPayment.expectedAmount || ideaPayment.fundedAmount);
        if (!Number.isFinite(expected) || paidValue < expected) {
          ideaPayment.paymentStatus = 'amount_mismatch';
          ideaPayment.captureAttemptedAt = new Date().toISOString();
          arr[idx] = ideaPayment;
          await saveNotifications(arr);
          return res.status(400).json({ error: 'Captured amount does not match requested amount' });
        }

        ideaPayment.paymentStatus = 'captured';
        ideaPayment.fundedAmount = paidValue;
        ideaPayment.fundedCurrency = (capture && capture.amount && capture.amount.currency_code) || 'USD';
        ideaPayment.paymentCaptureId = capture && capture.id ? capture.id : null;
        ideaPayment.fundedAt = new Date().toISOString();
        ideaPayment.updatedAt = ideaPayment.fundedAt;

        arr[idx] = ideaPayment;
        await saveNotifications(arr);

        return res.json({
          success: true,
          ideaPayment: {
            id: ideaPayment.id,
            requestId: ideaPayment.requestId,
            flow: ideaPayment.flow,
            fundedAmount: ideaPayment.fundedAmount,
            fundedCurrency: ideaPayment.fundedCurrency,
            fundedAt: ideaPayment.fundedAt,
            userName: ideaPayment.from ? ideaPayment.from.name : 'Anonymous'
          }
        });
      } catch (err) {
        console.error('capture ideas PayPal order error', err);
        return res.status(err.status || 500).json({ error: err.message || 'Server error' });
      }
    });

    app.post('/sponsorships/paypal/create-order', authMiddleware, async (req, res) => {
      try {
        const {
          amount,
          purchaseType,
          chargeMode,
          itemKey,
          itemTitle,
          planType,
          returnBaseUrl,
          returnPath
        } = req.body || {};

        const parsedAmount = parseUsdAmount(amount);
        const normalizedPurchaseType = String(purchaseType || '').trim().toLowerCase();
        const normalizedChargeMode = String(chargeMode || '').trim().toLowerCase();

        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
          return res.status(400).json({ error: 'Invalid amount' });
        }
        if (!['subscription', 'ala_carte'].includes(normalizedPurchaseType)) {
          return res.status(400).json({ error: 'Invalid purchaseType' });
        }
        if (!['monthly', 'one-time'].includes(normalizedChargeMode)) {
          return res.status(400).json({ error: 'Invalid chargeMode' });
        }
        if (normalizedPurchaseType === 'subscription' && normalizedChargeMode !== 'monthly') {
          return res.status(400).json({ error: 'Subscriptions must use monthly chargeMode' });
        }
        if (normalizedPurchaseType === 'ala_carte' && normalizedChargeMode !== 'one-time') {
          return res.status(400).json({ error: 'À la carte purchases must use one-time chargeMode' });
        }

        const nowIso = new Date().toISOString();
        const sponsorPaymentId = `sponsor-funded-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const fallbackBase = (WEB_URL || '').replace(/\/$/, '') || 'https://regaarder.com';
        const requestedBase = String(returnBaseUrl || '').trim();
        const safeBase = /^https?:\/\//i.test(requestedBase) ? requestedBase.replace(/\/$/, '') : fallbackBase;
        const requestedPath = String(returnPath || '').trim();
        const safePath = requestedPath.startsWith('/') ? requestedPath : '/sponsorship';
        const returnUrl = `${safeBase}${safePath}?sponsorPay=1&sponsorPaymentId=${encodeURIComponent(sponsorPaymentId)}`;
        const cancelUrl = `${safeBase}${safePath}?sponsorPay=cancel`;

        const token = await getPayPalAccessToken();
        const orderResp = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
              {
                reference_id: sponsorPaymentId,
                description: `Sponsorship payment (${normalizedPurchaseType}) ${String(itemTitle || itemKey || '').trim() || ''}`.trim(),
                amount: {
                  currency_code: 'USD',
                  value: toUsdString(parsedAmount)
                }
              }
            ],
            application_context: {
              user_action: 'PAY_NOW',
              return_url: returnUrl,
              cancel_url: cancelUrl
            }
          })
        });

        const orderData = await orderResp.json().catch(() => ({}));
        if (!orderResp.ok || !orderData.id) {
          return res.status(502).json({ error: 'Failed to create PayPal order', details: orderData });
        }

        const approveLink = Array.isArray(orderData.links)
          ? orderData.links.find((l) => l && l.rel === 'approve')
          : null;
        if (!approveLink || !approveLink.href) {
          return res.status(502).json({ error: 'PayPal approval link missing' });
        }

        const sponsorshipPayment = {
          id: sponsorPaymentId,
          type: 'funded_sponsorship_payment',
          purchaseType: normalizedPurchaseType,
          chargeMode: normalizedChargeMode,
          itemKey: itemKey || null,
          itemTitle: itemTitle || null,
          planType: planType || null,
          from: { id: req.user.id, name: req.user.name || req.user.email },
          createdAt: nowIso,
          expectedAmount: parsedAmount,
          fundedAmount: parsedAmount,
          fundedCurrency: 'USD',
          paymentStatus: 'pending',
          paymentProvider: 'paypal',
          paypalOrderId: orderData.id,
          fundedAt: null
        };

        const arr = await loadNotifications();
        arr.unshift(sponsorshipPayment);
        await saveNotifications(arr);

        return res.json({
          success: true,
          sponsorPaymentId,
          orderId: orderData.id,
          approveUrl: approveLink.href
        });
      } catch (err) {
        console.error('create sponsorship PayPal order error', err);
        return res.status(err.status || 500).json({
          error: 'Unable to start sponsorship PayPal payment',
          details: err.details || err.message || 'Server error'
        });
      }
    });

    app.post('/sponsorships/paypal/capture-order', authMiddleware, async (req, res) => {
      try {
        const { sponsorPaymentId, orderId } = req.body || {};
        if (!sponsorPaymentId || !orderId) {
          return res.status(400).json({ error: 'Missing sponsorPaymentId or orderId' });
        }

        const arr = await loadNotifications();
        const idx = arr.findIndex((s) => String(s.id) === String(sponsorPaymentId));
        if (idx === -1) return res.status(404).json({ error: 'Sponsorship payment not found' });

        const sponsorshipPayment = arr[idx];
        if (String(sponsorshipPayment.type || '') !== 'funded_sponsorship_payment') {
          return res.status(400).json({ error: 'Invalid sponsorship payment record' });
        }
        if (!sponsorshipPayment || !sponsorshipPayment.from || String(sponsorshipPayment.from.id) !== String(req.user.id)) {
          return res.status(403).json({ error: 'Not allowed for this sponsorship payment' });
        }
        if (sponsorshipPayment.paymentStatus === 'captured') {
          return res.json({ success: true, sponsorshipPayment, alreadyCaptured: true });
        }
        if (String(sponsorshipPayment.paypalOrderId || '') !== String(orderId)) {
          return res.status(400).json({ error: 'Order mismatch' });
        }

        const token = await getPayPalAccessToken();
        const captureResp = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(String(orderId))}/capture`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const captureData = await captureResp.json().catch(() => ({}));

        if (!captureResp.ok) {
          return res.status(502).json({ error: 'PayPal capture failed', details: captureData });
        }

        const status = String(captureData.status || '').toUpperCase();
        const purchaseUnit = Array.isArray(captureData.purchase_units) ? captureData.purchase_units[0] : null;
        const capture = purchaseUnit && purchaseUnit.payments && Array.isArray(purchaseUnit.payments.captures)
          ? purchaseUnit.payments.captures[0]
          : null;
        const paidValue = parseUsdAmount(capture && capture.amount ? capture.amount.value : NaN);

        if (status !== 'COMPLETED' || !Number.isFinite(paidValue)) {
          return res.status(400).json({ error: 'Payment not completed' });
        }

        const expected = parseUsdAmount(sponsorshipPayment.expectedAmount || sponsorshipPayment.fundedAmount);
        if (!Number.isFinite(expected) || paidValue < expected) {
          sponsorshipPayment.paymentStatus = 'amount_mismatch';
          sponsorshipPayment.captureAttemptedAt = new Date().toISOString();
          arr[idx] = sponsorshipPayment;
          await saveNotifications(arr);
          return res.status(400).json({ error: 'Captured amount does not match requested amount' });
        }

        sponsorshipPayment.paymentStatus = 'captured';
        sponsorshipPayment.fundedAmount = paidValue;
        sponsorshipPayment.fundedCurrency = (capture && capture.amount && capture.amount.currency_code) || 'USD';
        sponsorshipPayment.paymentCaptureId = capture && capture.id ? capture.id : null;
        sponsorshipPayment.fundedAt = new Date().toISOString();
        sponsorshipPayment.updatedAt = sponsorshipPayment.fundedAt;

        arr[idx] = sponsorshipPayment;
        await saveNotifications(arr);

        return res.json({
          success: true,
          sponsorshipPayment: {
            id: sponsorshipPayment.id,
            purchaseType: sponsorshipPayment.purchaseType,
            chargeMode: sponsorshipPayment.chargeMode,
            itemKey: sponsorshipPayment.itemKey,
            itemTitle: sponsorshipPayment.itemTitle,
            planType: sponsorshipPayment.planType,
            fundedAmount: sponsorshipPayment.fundedAmount,
            fundedCurrency: sponsorshipPayment.fundedCurrency,
            fundedAt: sponsorshipPayment.fundedAt,
            userName: sponsorshipPayment.from ? sponsorshipPayment.from.name : 'Anonymous'
          }
        });
      } catch (err) {
        console.error('capture sponsorship PayPal order error', err);
        return res.status(err.status || 500).json({ error: err.message || 'Server error' });
      }
    });
    
    // Get suggestions for a specific request
    app.get('/requests/:id/suggestions', async (req, res) => {
      try {
        const requestId = req.params.id;
        const arr = await loadNotifications();
        
        // Filter suggestions for this request
        // Also map to match frontend expectation (userName, timestamp)
        const suggestions = arr
            .filter(s => String(s.requestId) === String(requestId))
            .filter(s => String(s.paymentStatus || '') === 'paid')
            .filter(s => !s.rejectedByCreator)
            .map(s => ({
                id: s.id,
                text: s.text,
                userName: s.from ? s.from.name : 'Anonymous',
                timestamp: s.createdAt,
                userId: s.from ? s.from.id : null,
                fundedAmount: Number(s.fundedAmount || 0),
                fundedCurrency: s.fundedCurrency || 'USD',
                fundedAt: s.fundedAt || s.createdAt
            }))
            .sort((a, b) => {
              const amountDiff = Number(b.fundedAmount || 0) - Number(a.fundedAmount || 0);
              if (amountDiff !== 0) return amountDiff;
              return new Date(a.fundedAt || a.timestamp) - new Date(b.fundedAt || b.timestamp);
            });

        return res.json({ success: true, suggestions });
      } catch (err) {
        console.error('get request suggestions error', err);
        return res.status(500).json({ error: 'Server error' });
      }
    });

    app.get('/requests/:id/top-suggestions', authMiddleware, async (req, res) => {
      try {
        const requestId = req.params.id;
        const arr = await loadNotifications();

        const suggestions = arr
          .filter((s) => String(s.requestId) === String(requestId))
          .filter((s) => String(s.paymentStatus || '') === 'paid')
          .filter((s) => !s.rejectedByCreator)
          .filter((s) => s.to && String(s.to.id) === String(req.user.id))
          .map((s) => ({
            id: s.id,
            text: s.text,
            userName: s.from ? s.from.name : 'Anonymous',
            userId: s.from ? s.from.id : null,
            fundedAmount: Number(s.fundedAmount || 0),
            fundedCurrency: s.fundedCurrency || 'USD',
            fundedAt: s.fundedAt || s.createdAt,
            createdAt: s.createdAt
          }))
          .sort((a, b) => {
            const amountDiff = Number(b.fundedAmount || 0) - Number(a.fundedAmount || 0);
            if (amountDiff !== 0) return amountDiff;
            return buildSuggestionSortTimestamp(a) - buildSuggestionSortTimestamp(b);
          });

        return res.json({ success: true, suggestions });
      } catch (err) {
        console.error('get top suggestions error', err);
        return res.status(500).json({ error: 'Server error' });
      }
    });

    app.post('/suggestions/:id/reject', authMiddleware, async (req, res) => {
      try {
        const id = req.params.id;
        const { reason } = req.body || {};
        const arr = await loadNotifications();
        const idx = arr.findIndex((s) => String(s.id) === String(id));
        if (idx === -1) return res.status(404).json({ error: 'Suggestion not found' });

        const suggestion = arr[idx];
        if (!suggestion.to || String(suggestion.to.id) !== String(req.user.id)) {
          return res.status(403).json({ error: 'Only tagged creator can reject this suggestion' });
        }
        if (String(suggestion.paymentStatus || '') !== 'paid') {
          return res.status(400).json({ error: 'Only paid suggestions can be rejected' });
        }

        suggestion.rejectedByCreator = true;
        suggestion.rejectedAt = new Date().toISOString();
        suggestion.rejectedBy = req.user.id;
        suggestion.rejectionReason = String(reason || '').trim().slice(0, 280);
        suggestion.updatedAt = suggestion.rejectedAt;

        arr[idx] = suggestion;
        await saveNotifications(arr);

        return res.json({ success: true, suggestion });
      } catch (err) {
        console.error('reject suggestion error', err);
        return res.status(500).json({ error: 'Server error' });
      }
    });

    // Suggestions for current user (creator notifications)
    // Modified to return threaded conversations:
    // 1. Get all suggestions where user is sender OR receiver
    // 2. Client will group them
    app.get('/suggestions/me', authMiddleware, async (req, res) => {
      try {
        const arr = await loadNotifications();
        
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
    app.get('/notifications', authMiddleware, async (req, res) => {
      try {
        const arr = await loadNotifications();
        
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
    app.delete('/notifications/:id', authMiddleware, async (req, res) => {
      try {
        const id = req.params.id;
        let arr = await loadNotifications();
        
        const before = arr.length;
        // Allow deleting if user is sender or receiver
        arr = arr.filter(s => {
            if (String(s.id) !== String(id)) return true;
            // Check ownership
            const isMine = (s.to && String(s.to.id) === String(req.user.id)) || (s.from && String(s.from.id) === String(req.user.id));
            return !isMine; // Keep if not mine (i.e. remove if mine)
        });
        
        const deleted = before - arr.length;
        if (!deleted) {
          return res.status(404).json({ error: 'Notification not found or not owned by user', deleted: 0, id });
        }

        await saveNotifications(arr);

        return res.json({ success: true, deleted, id });
      } catch (e) {
        return res.status(500).json({ error: 'Server error' });
      }
    });

    // Mark notification as read
    app.post('/notifications/:id/read', authMiddleware, async (req, res) => {
      try {
        const id = req.params.id;
        let arr = await loadNotifications();
        
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
        
        if (found) await saveNotifications(arr);
        
        return res.json({ success: true, marked: found });
      } catch (e) {
        return res.status(500).json({ error: 'Server error' });
      }
    });

    // POST /notifications - create a new notification (used by creator tagging, etc.)
    app.post('/notifications', async (req, res) => {
      try {
        const body = req.body || {};
        const { recipientId, type, title, message, requestId, senderId, isRead, createdAt } = body;
        if (!recipientId) {
          return res.status(400).json({ error: 'recipientId is required' });
        }

        const notifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const notification = {
          id: notifId,
          to: { id: String(recipientId) },
          from: { id: String(senderId || 'system'), name: 'System' },
          type: type || 'general',
          title: title || 'New Notification',
          message: message || '',
          requestId: requestId || null,
          read: isRead === true,
          createdAt: createdAt || new Date().toISOString()
        };

        // Try to enrich from/to names from user data
        try {
          if (req.user) {
            notification.from.name = req.user.name || req.user.email || 'Someone';
            notification.from.id = req.user.id || senderId || 'system';
          }
        } catch {}

        const arr = await loadNotifications();
        arr.unshift(notification);
        await saveNotifications(arr);

        console.log('Notification created:', notifId, 'to:', recipientId, 'type:', type);
        return res.json({ success: true, notification });
      } catch (err) {
        console.error('POST /notifications error:', err);
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

    let arr = await loadNotifications();

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

    await saveNotifications(arr);

    return res.json({ success: true, created: created.length, notifications: created });
  } catch (err) {
    console.error('send-promotion error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /staff/apply-overlay-ad - apply overlay ad to videos with timing
app.post('/staff/apply-overlay-ad', async (req, res) => {
  try {
    const { employeeId, videoIds, ad } = req.body || {};
    console.log('Apply overlay request:', { employeeId, videoIds, adKeys: ad ? Object.keys(ad) : null });
    
    if (parseInt(employeeId) !== 1000) return res.status(403).json({ error: 'Unauthorized' });
    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ error: 'No videos selected' });
    }
    if (!ad) return res.status(400).json({ error: 'Ad data missing' });

    const videos = await loadVideos();
    const updated = [];

    videos.forEach((v) => {
      if (videoIds.includes(v.id)) {
        if (!v.ads) v.ads = {};
        if (!v.ads.overlays) v.ads.overlays = [];
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

    await saveVideos(videos);
    console.log(`Successfully applied overlay to ${updated.length} videos`);

    return res.json({ success: true, applied: updated.length, videos: updated });
  } catch (err) {
    console.error('apply-overlay-ad error', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// POST /staff/apply-bottom-ad - apply bottom ad to videos with timing
app.post('/staff/apply-bottom-ad', async (req, res) => {
  try {
    const { employeeId, videoIds, ad } = req.body || {};
    if (parseInt(employeeId) !== 1000) return res.status(403).json({ error: 'Unauthorized' });
    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ error: 'No videos selected' });
    }
    if (!ad) return res.status(400).json({ error: 'Ad data missing' });

    const videos = await loadVideos();
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

    await saveVideos(videos);

    return res.json({ success: true, applied: updated.length, videos: updated });
  } catch (err) {
    console.error('apply-bottom-ad error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /staff/remove-ad-from-video - remove ads from a video
app.post('/staff/remove-ad-from-video', async (req, res) => {
  try {
    const { employeeId, videoId, adType, adId } = req.body || {};
    if (parseInt(employeeId) !== 1000) return res.status(403).json({ error: 'Unauthorized' });
    if (!videoId || !adType) {
      return res.status(400).json({ error: 'videoId and adType are required' });
    }

    const videos = await loadVideos();
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

    await saveVideos(videos);

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

app.get('/users', async (req, res) => {
  try {
    let users = readUsers();
    // If cache returned empty but DB is available, query DB directly as fallback
    if ((!users || users.length === 0) && DB_ENABLED) {
      try {
        const { rows } = await dbQuery('SELECT * FROM users');
        users = rows.map(mapUserRow);
        // Also refresh the cache for subsequent requests
        refreshUserCache().catch(() => {});
      } catch (dbErr) {
        console.error('get users DB fallback error', dbErr);
      }
    }
    const q = (req.query.query || req.query.q || '').trim().toLowerCase();
    const creatorsOnly = req.query.creatorsOnly === '1' || req.query.creatorsOnly === 'true';
    let results = users.map(({ password_hash, passwordHash, token, ...u }) => u);
    if (creatorsOnly) results = results.filter(u => u.isCreator);
    if (q) {
      results = results.filter(u => {
        const name = (u.name || '').toLowerCase();
        const handle = (u.handle || u.tag || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || handle.includes(q) || email.includes(q);
      });
    }
    return res.json({ users: results });
  } catch (err) {
    console.error('get users error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Dedicated creators endpoint – always queries DB directly for reliability
app.get('/creators', async (req, res) => {
  try {
    let users = [];
    if (DB_ENABLED) {
      const { rows } = await dbQuery('SELECT * FROM users');
      users = rows.map(mapUserRow);
    } else {
      users = readUsers();
    }
    const q = (req.query.query || req.query.q || '').trim().toLowerCase();
    let creators = users
      .filter(u => u.isCreator === true || u.is_creator === true)
      .map(({ password_hash, passwordHash, token, ...u }) => u);
    // If nobody has the creator flag, return all users
    if (creators.length === 0) {
      creators = users.map(({ password_hash, passwordHash, token, ...u }) => u);
    }
    if (q) {
      creators = creators.filter(u => {
        const name = (u.name || '').toLowerCase();
        const handle = (u.handle || u.tag || '').toLowerCase();
        return name.includes(q) || handle.includes(q);
      });
    }
    return res.json({ creators });
  } catch (err) {
    console.error('get creators error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get current authenticated user profile (full details)
app.get('/users/me', authMiddleware, (req, res) => {
  try {
    if (DB_ENABLED) {
      return dbQuery('SELECT * FROM users WHERE id = $1 LIMIT 1', [req.user.id])
        .then(async ({ rows }) => {
          if (!rows[0]) return res.status(404).json({ error: 'User not found' });
          const u = mapUserRow(rows[0]);
          if (!u.referral_code && !u.referralCode) {
            const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
            await dbQuery('UPDATE users SET referral_code = $1 WHERE id = $2', [newReferralCode, u.id]);
            const refreshed = await dbQuery('SELECT * FROM users WHERE id = $1', [u.id]);
            refreshUserCache().catch(() => {});
            return res.json({ user: toPublicUser(mapUserRow(refreshed.rows[0])) });
          }
          return res.json({ user: toPublicUser(u) });
        })
        .catch((err) => {
          console.error('get me db error', err);
          return res.status(500).json({ error: 'Server error' });
        });
    }

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
    if (DB_ENABLED) {
      const fieldMap = {
        name: 'name',
        handle: 'handle',
        bio: 'bio',
        interests: 'interests',
        image: 'image',
        email: 'email',
        social: 'social'
      };

      const fields = [];
      const values = [];
      let i = 1;

      allowed.forEach((k) => {
        if (typeof body[k] !== 'undefined') {
          fields.push(`${fieldMap[k]} = $${i}`);
          values.push(body[k]);
          i += 1;
        }
      });

      if (body.handle) {
        fields.push(`tag = $${i}`);
        values.push(body.handle);
        i += 1;
      }

      if (!fields.length) {
        return dbQuery('SELECT * FROM users WHERE id = $1', [req.user.id])
          .then(({ rows }) => {
            if (!rows[0]) return res.status(404).json({ error: 'User not found' });
            return res.json({ success: true, user: toPublicUser(mapUserRow(rows[0])) });
          })
          .catch((err) => {
            console.error('user update db error', err);
            return res.status(500).json({ error: 'Server error' });
          });
      }

      values.push(req.user.id);
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;
      return dbQuery(sql, values)
        .then(({ rows }) => {
          if (!rows[0]) return res.status(404).json({ error: 'User not found' });
          refreshUserCache().catch(() => {});
          return res.json({ success: true, user: toPublicUser(mapUserRow(rows[0])) });
        })
        .catch((err) => {
          console.error('user update db error', err);
          return res.status(500).json({ error: 'Server error' });
        });
    }

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
    if (DB_ENABLED) {
      return dbQuery('SELECT * FROM users WHERE id = $1 LIMIT 1', [id])
        .then(async ({ rows }) => {
          let u = rows[0] ? mapUserRow(rows[0]) : null;
          if (!u) {
            const fallback = await dbQuery('SELECT * FROM users WHERE name = $1 OR email = $1 LIMIT 1', [id]);
            u = fallback.rows[0] ? mapUserRow(fallback.rows[0]) : null;
          }
          if (!u) {
            return res.json({ user: { id: id, name: 'Unknown User', isPlaceholder: true } });
          }
          return res.json({ user: toPublicUser(u) });
        })
        .catch((err) => {
          console.error('get user by id db error', err);
          return res.status(500).json({ error: 'Server error' });
        });
    }

    const users = readUsers();
    // Also try to match by name roughly if ID is not found (for legacy test data compatibility)
    let u = users.find(x => x.id === id);
    if (!u) {
       // Fallback: is it a test user ID or name?
       u = users.find(x => x.name === id || x.email === id);
    }
    
    if (!u) {
         // Return a dummy placeholder instead of 404 to prevent UI crashes for missing users
         // Only if strict validation is not required
         return res.json({ user: { id: id, name: 'Unknown User', isPlaceholder: true } });
    }
    
    const { passwordHash, token, ...publicUser } = u;
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
    if (DB_ENABLED) {
      return dbQuery(
        `SELECT * FROM users
         WHERE lower(tag) = lower($1)
            OR lower(handle) = lower($1)
            OR lower(name) = lower($1)
         LIMIT 1`,
        [handle]
      )
        .then(({ rows }) => {
          if (!rows[0]) return res.status(404).json({ error: 'User not found' });
          return res.json({ user: toPublicUser(mapUserRow(rows[0])) });
        })
        .catch((err) => {
          console.error('get user by handle db error', err);
          return res.status(500).json({ error: 'Server error' });
        });
    }

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
    const defaults = ['Travel', 'Education', 'Entertainment', 'Music', 'Sports'];
    if (DB_ENABLED) {
      return (async () => {
        const { rows } = await dbQuery('SELECT name FROM categories ORDER BY created_at ASC');
        const list = rows.map(r => r.name);
        return res.json(list.length ? list : defaults);
      })().catch((err) => {
        console.error('Error reading categories (db):', err);
        return res.status(500).json({ error: 'Failed to fetch categories' });
      });
    }

    if (!fs.existsSync(CATEGORIES_FILE)) {
      return res.json(defaults);
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
    if (DB_ENABLED) {
      return (async () => {
        const { rows } = await dbQuery('SELECT name FROM categories WHERE lower(name) = lower($1) LIMIT 1', [catName]);
        if (!rows[0]) {
          await dbQuery('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [catName]);
        }
        const list = await dbQuery('SELECT name FROM categories ORDER BY created_at ASC');
        res.json(list.rows.map(r => r.name));
      })().catch((err) => {
        console.error('Error saving category (db):', err);
        return res.status(500).json({ error: 'Failed to save category' });
      });
    }

    let categories = [];
    if (fs.existsSync(CATEGORIES_FILE)) {
       categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
    } else {
       categories = ['Travel', 'Education', 'Entertainment', 'Music', 'Sports'];
    }

    const exists = categories.some(c => c.toLowerCase() === catName.toLowerCase());
    if (!exists) {
      categories.push(catName);
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    }

    res.json(categories);
    } catch (err) {
        console.error('Error saving category:', err);
        res.status(500).json({ error: 'Failed to save category' });
    }
});

app.get('/requests', async (req, res) => {
  try {
    let requests = [];

    if (DB_ENABLED) {
      const { rows } = await dbQuery(
        `SELECT r.*, u.name AS creator_user_name, u.email AS creator_user_email, u.image AS creator_user_image
         FROM requests r
         LEFT JOIN users u ON u.id = r.creator_id`
      );
      requests = rows.map((row) => {
        const claimedBy = parseClaimedByValue(row.claimed_by);
        const base = {
          id: row.id,
          title: row.title,
          description: row.description,
          likes: Number(row.likes || 0),
          comments: Number(row.comments || 0),
          boosts: Number(row.boosts || 0),
          amount: row.amount != null ? Number(row.amount) : 0,
          funding: row.funding != null ? Number(row.funding) : 0,
          isTrending: Boolean(row.is_trending),
          isSponsored: Boolean(row.is_sponsored),
          company: row.company,
          companyInitial: row.company_initial,
          companyColor: row.company_color,
          imageUrl: row.image_url,
          creator: row.creator_id || row.creator_user_name
            ? {
                id: row.creator_id,
                name: row.creator_user_name || row.creator_name || 'Anonymous',
                email: row.creator_user_email || row.creator_email || null,
                image: row.creator_user_image || null
              }
            : null,
          creatorId: row.creator_id,
          createdBy: row.created_by,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          currentStep: row.current_step,
          claimed: row.claimed,
          claimedBy,
          claimedAt: row.claimed_at,
          meta: row.meta
        };
        if (base.creator && (!base.imageUrl || base.imageUrl === '') && base.creator.image) {
          base.imageUrl = base.creator.image;
        }
        return applyRequestAmountPresentation(base);
      });
      console.log(`DEBUG /requests: Read ${requests.length} requests from database`);
    } else {
      requests = readRequests();
      console.log(`DEBUG /requests: Read ${requests.length} requests from file`);
      const users = readUsers();
      
      // Enrich first (needed for some scores)
      requests = requests.map(r => {
         try {
           const copy = { ...r };
           if (copy.creator && copy.creator.id) {
             const u = users.find(x => x.id === copy.creator.id);
             if (u) {
               copy.creator = { id: u.id, name: u.name || 'Anonymous', image: u.image || '' };
               if ((!copy.imageUrl || copy.imageUrl === '') && u.image) copy.imageUrl = u.image;
             }
           } else {
              // Fallback enrichment
               if (!copy.creator) copy.creator = { id: null, name: 'Anonymous', image: '' };
           }
           return applyRequestAmountPresentation(copy);
         } catch (e) { return r; }
      });
    }

    // Public feed must hide requests hidden by staff moderation.
    requests = requests.filter((r) => !isRequestHiddenForPublicFeed(r));

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
const COMMENT_REACTIONS_FILE = path.join(__dirname, 'comment_reactions.json');
function readCommentReactions() {
  try { if (!fs.existsSync(COMMENT_REACTIONS_FILE)) return { likes: {}, dislikes: {} }; const raw = fs.readFileSync(COMMENT_REACTIONS_FILE, 'utf8'); const j = JSON.parse(raw || '{}'); return { likes: j.likes || {}, dislikes: j.dislikes || {} }; } catch (e) { return { likes: {}, dislikes: {} }; }
}
function writeCommentReactions(data) {
  try { const safe = { likes: data.likes || {}, dislikes: data.dislikes || {} }; fs.writeFileSync(COMMENT_REACTIONS_FILE, JSON.stringify(safe, null, 2), 'utf8'); } catch (e) {}
}

// Persist comment reactions and aggregate counts
app.post('/comments/react', authMiddleware, async (req, res) => {
  try {
    const { commentId, action, requestId } = req.body || {};
    if (!commentId || !action) return res.status(400).json({ error: 'Missing commentId or action' });
    
    const userId = req.user.id;
    const comments = await loadComments();
    const idx = comments.findIndex(c => String(c.id) === String(commentId));
    
    if (idx === -1) return res.status(404).json({ error: 'Comment not found' });

    if (DB_ENABLED) {
      const { rows } = await dbQuery(
        'SELECT is_liked, is_disliked FROM comment_reactions WHERE comment_id = $1 AND user_id = $2',
        [String(commentId), String(userId)]
      );
      const prevLiked = Boolean(rows[0]?.is_liked);
      const prevDisliked = Boolean(rows[0]?.is_disliked);

      let likesCount = Number(comments[idx].likesCount || 0);
      let dislikesCount = Number(comments[idx].dislikesCount || 0);
      let nextLiked = prevLiked;
      let nextDisliked = prevDisliked;

      if (action === 'like') {
        if (!prevLiked) {
          nextLiked = true;
          likesCount += 1;
        }
        if (prevDisliked) {
          nextDisliked = false;
          dislikesCount = Math.max(0, dislikesCount - 1);
        }
      } else if (action === 'unlike') {
        if (prevLiked) {
          nextLiked = false;
          likesCount = Math.max(0, likesCount - 1);
        }
      } else if (action === 'dislike') {
        if (!prevDisliked) {
          nextDisliked = true;
          dislikesCount += 1;
        }
        if (prevLiked) {
          nextLiked = false;
          likesCount = Math.max(0, likesCount - 1);
        }
      } else if (action === 'undislike') {
        if (prevDisliked) {
          nextDisliked = false;
          dislikesCount = Math.max(0, dislikesCount - 1);
        }
      } else {
        return res.status(400).json({ error: 'Invalid action' });
      }

      await dbQuery(
        `INSERT INTO comment_reactions (comment_id, user_id, is_liked, is_disliked, updated_at)
         VALUES ($1,$2,$3,$4,now())
         ON CONFLICT (comment_id, user_id)
         DO UPDATE SET is_liked = EXCLUDED.is_liked, is_disliked = EXCLUDED.is_disliked, updated_at = now()`,
        [String(commentId), String(userId), nextLiked, nextDisliked]
      );

      comments[idx].likesCount = likesCount;
      comments[idx].dislikesCount = dislikesCount;
      await saveComments(comments);

      return res.json({ success: true, likesCount, dislikesCount });
    }

    const reactions = readCommentReactions();
    
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
    
    await saveComments(comments);
    writeCommentReactions(reactions);
    
    return res.json({ success: true, likesCount, dislikesCount });
  } catch (err) {
    console.error('comment react error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update comments fetch to include reaction state for user
app.get('/requests/:id/comments', async (req, res) => {
  try {
    const requestId = req.params.id;
    const all = await loadComments();
    let filtered = (all || []).filter(c => String(c.requestId) === String(requestId)).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // If user is authenticated, check their reaction status
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
       try {
         const user = await getUserFromAuthHeader(req);
         if (user) {
            if (DB_ENABLED) {
              const ids = filtered.map(c => String(c.id));
              let map = {};
              if (ids.length > 0) {
                const { rows } = await dbQuery(
                  'SELECT comment_id, is_liked, is_disliked FROM comment_reactions WHERE user_id = $1 AND comment_id = ANY($2)',
                  [String(user.id), ids]
                );
                rows.forEach(r => {
                  map[String(r.comment_id)] = { liked: Boolean(r.is_liked), disliked: Boolean(r.is_disliked) };
                });
              }
              filtered = filtered.map(c => ({
                ...c,
                likedByUser: !!map[String(c.id)]?.liked,
                dislikedByUser: !!map[String(c.id)]?.disliked
              }));
            } else {
              const reactions = readCommentReactions();
              filtered = filtered.map(c => ({
                  ...c,
                  likedByUser: !!(reactions.likes[c.id] && reactions.likes[c.id][user.id]),
                  dislikedByUser: !!(reactions.dislikes[c.id] && reactions.dislikes[c.id][user.id])
              }));
            }
         }
       } catch (e) {}
    }
    
    return res.json({ success: true, comments: filtered });
  } catch (err) { console.error('GET /requests/:id/comments error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.post('/requests/:id/comments', authMiddleware, async (req, res) => {
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

    const all = await loadComments();
    all.push(comment);
    await saveComments(all);

    // increment comment counter on request if present
    try {
      if (DB_ENABLED) {
        await dbQuery('UPDATE requests SET comments = COALESCE(comments, 0) + 1 WHERE id = $1', [requestId]);
        refreshRequestCache().catch(() => {});
      } else {
        const requests = readRequests();
        const idx = requests.findIndex(r => String(r.id) === String(requestId));
        if (idx !== -1) {
          requests[idx].comments = (Number(requests[idx].comments) || 0) + 1;
          writeRequests(requests);
        }
      }
    } catch (e) {}

    // Also increment comment counter on video if present
    try {
      const videos = await loadVideos();
      const vidIdx = videos.findIndex(v => String(v.id) === String(requestId));
      if (vidIdx !== -1) {
        videos[vidIdx].comments = (Number(videos[vidIdx].comments) || 0) + 1;
        await saveVideos(videos);
        
        // Also increment the creator's total comments in the user object
        const video = videos[vidIdx];
        if (!DB_ENABLED && (video.authorId || video.author || video.authorEmail)) {
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

app.put('/requests/:id/comments/:cid', authMiddleware, async (req, res) => {
  try {
    const requestId = req.params.id;
    const cid = req.params.cid;
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const all = await loadComments();
    const idx = all.findIndex(c => String(c.id) === String(cid) && String(c.requestId) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Comment not found' });
    const comment = all[idx];
    if (String(comment.userId) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });

    comment.text = String(text).trim();
    comment.updatedAt = new Date().toISOString();
    all[idx] = comment;
    await saveComments(all);
    return res.json({ success: true, comment });
  } catch (err) { console.error('PUT /requests/:id/comments/:cid error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.delete('/requests/:id/comments/:cid', authMiddleware, async (req, res) => {
  try {
    const requestId = req.params.id;
    const cid = req.params.cid;
    const all = await loadComments();
    const idx = all.findIndex(c => String(c.id) === String(cid) && String(c.requestId) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Comment not found' });
    const comment = all[idx];
    if (String(comment.userId) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    all.splice(idx, 1);
    await saveComments(all);

    // decrement comment counter on request if present
    try {
      if (DB_ENABLED) {
        await dbQuery('UPDATE requests SET comments = GREATEST(COALESCE(comments, 0) - 1, 0) WHERE id = $1', [requestId]);
        refreshRequestCache().catch(() => {});
      } else {
        const requests = readRequests();
        const ridx = requests.findIndex(r => String(r.id) === String(requestId));
        if (ridx !== -1) {
          requests[ridx].comments = Math.max(0, (Number(requests[ridx].comments) || 0) - 1);
          writeRequests(requests);
        }
      }
    } catch (e) {}

    return res.json({ success: true });
  } catch (err) { console.error('DELETE /requests/:id/comments/:cid error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Get requests created by the logged-in user
app.get('/requests/my', authMiddleware, async (req, res) => {
  try {
    const includeClaimed = String(req.query.includeClaimed || '').toLowerCase() === '1' || String(req.query.includeClaimed || '').toLowerCase() === 'true';
    const uid = String(req.user.id);

    if (DB_ENABLED) {
      const sql = includeClaimed
        ? `SELECT *
          FROM requests
          WHERE created_by = $1
            OR claimed_by = $1
            OR claimed_by = ('{"id":"' || $1 || '"}')
          ORDER BY created_at DESC`
        : `SELECT *
           FROM requests
           WHERE created_by = $1
           ORDER BY created_at DESC`;
      const { rows } = await dbQuery(sql, [uid]);
      const mapped = rows.map((row) => applyRequestAmountPresentation({
        id: row.id,
        title: row.title,
        description: row.description,
        likes: Number(row.likes || 0),
        comments: Number(row.comments || 0),
        boosts: Number(row.boosts || 0),
        amount: row.amount != null ? Number(row.amount) : 0,
        funding: row.funding != null ? Number(row.funding) : 0,
        isTrending: Boolean(row.is_trending),
        isSponsored: Boolean(row.is_sponsored),
        company: row.company,
        companyInitial: row.company_initial,
        companyColor: row.company_color,
        imageUrl: row.image_url,
        creator: row.creator_id ? { id: row.creator_id, name: row.creator_name, email: row.creator_email } : null,
        creatorId: row.creator_id,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        currentStep: row.current_step,
        claimed: row.claimed,
        claimedBy: row.claimed_by,
        claimedAt: row.claimed_at,
        meta: row.meta
      }));
      return res.json({ requests: mapped });
    }

    const allRequests = readRequests();
    const userRequests = allRequests
      .filter((r) => {
        const createdBy = r.createdBy || r.created_by;
        const claimedById = getClaimedByUserId(r);
        if (includeClaimed) {
          return String(createdBy || '') === uid || String(claimedById || '') === uid;
        }
        return String(createdBy || '') === uid;
      })
      .map((request) => applyRequestAmountPresentation(request));
    return res.json({ requests: userRequests });
  } catch (err) {
    console.error('get my requests error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

const normalizeCategoryTokens = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((x) => String(x || '').trim().toLowerCase())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return [];
    try {
      if (raw.startsWith('[')) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return normalizeCategoryTokens(parsed);
      }
    } catch {}
    return raw
      .split(',')
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
};

const normalizeRequestTargeting = (body = {}) => {
  const fromMeta = (body.meta && typeof body.meta === 'object' && body.meta.targeting) || null;
  const source = (fromMeta && typeof fromMeta === 'object') ? fromMeta : ((body.targeting && typeof body.targeting === 'object') ? body.targeting : {});

  const modeRaw = String(source.mode || '').trim().toLowerCase();
  const creatorId = source.creatorId != null ? String(source.creatorId).trim() : (body.selectedCreator != null ? String(body.selectedCreator).trim() : '');
  const category = String(source.category || body.targetCategory || body.category || '').trim();

  if (creatorId && creatorId !== '@anycreators') {
    return { mode: 'specific', creatorId, category: null };
  }
  if (modeRaw === 'category' && category) {
    return { mode: 'category', creatorId: null, category };
  }
  if (category) {
    return { mode: 'category', creatorId: null, category };
  }
  if (modeRaw === 'specific' && creatorId && creatorId !== '@anycreators') {
    return { mode: 'specific', creatorId, category: null };
  }
  return { mode: 'anycreators', creatorId: null, category: null };
};

const loadCreatorsForTargeting = async () => {
  if (DB_ENABLED) {
    const { rows } = await dbQuery('SELECT id, name, email, is_creator, categories FROM users WHERE is_creator = true');
    return rows.map((row) => mapUserRow(row));
  }
  const users = readUsers();
  return users.filter((u) => u && (u.isCreator === true || u.is_creator === true));
};

const resolveTargetCreatorIds = async (targeting, requesterId) => {
  const t = targeting || { mode: 'anycreators', creatorId: null, category: null };
  if (t.mode === 'anycreators') {
    // Broadcast mode should not spam all creators with individual notifications.
    return [];
  }
  if (t.mode === 'specific' && t.creatorId && t.creatorId !== '@anycreators') {
    return [String(t.creatorId)];
  }

  const creators = await loadCreatorsForTargeting();
  let matches = creators;

  if (t.mode === 'category' && t.category) {
    const wanted = String(t.category).trim().toLowerCase();
    matches = creators.filter((creator) => {
      const tokens = normalizeCategoryTokens(creator?.categories);
      return tokens.includes(wanted);
    });
  }

  return Array.from(new Set(
    matches
      .map((creator) => (creator?.id != null ? String(creator.id) : null))
      .filter((id) => !!id && id !== String(requesterId || ''))
  ));
};

const normalizeRequestPricingType = (requestData = {}) => {
  const rawType = String(
    requestData?.meta?.selectedFormat
    || requestData?.meta?.format
    || requestData?.meta?.flow
    || requestData?.deliveryType
    || requestData?.flow
    || requestData?.delivery
    || requestData?.type
    || 'one-time'
  ).toLowerCase();

  if (rawType === 'recurrent') return 'recurring';
  if (rawType === 'catalogue') return 'one-time';
  if (rawType === 'recurring' || rawType === 'series') return rawType;
  return 'one-time';
};

const createRequestAssignedNotifications = async (targetCreatorIds, requestData, sender) => {
  try {
    if (!Array.isArray(targetCreatorIds) || targetCreatorIds.length === 0) return 0;

    const arr = await loadNotifications();
    const createdAt = new Date().toISOString();
    const created = [];
    const pricingType = normalizeRequestPricingType(requestData);
    const amountUsd = Number(
      (requestData && requestData.funding)
      || (requestData && requestData.amount)
      || 0
    );
    const requesterName = (sender && (sender.name || sender.email)) || 'Someone';
    const requesterMention = requesterName.startsWith('@')
      ? requesterName
      : `@${String(requesterName).trim().replace(/\s+/g, '_')}`;

    targetCreatorIds.forEach((recipientId) => {
      const notif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        to: { id: String(recipientId) },
        from: {
          id: String((sender && sender.id) || 'system'),
          name: (sender && (sender.name || sender.email)) || 'System'
        },
        type: 'request_assigned',
        title: `New Request Assigned: ${requestData.title}`,
        message: `${requesterMention} requested you a ${pricingType} request + $${amountUsd.toFixed(2)}`,
        requestId: requestData.id || null,
        metadata: {
          requestType: pricingType,
          amountUsd,
          requesterName,
          requesterMention
        },
        read: false,
        createdAt
      };
      created.push(notif);
    });

    arr.unshift(...created);
    await saveNotifications(arr);
    return created.length;
  } catch (err) {
    console.error('createRequestAssignedNotifications error', err);
    return 0;
  }
};

app.post('/requests', authMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.title || !body.description) return res.status(400).json({ error: 'Missing title or description' });

    const targeting = normalizeRequestTargeting(body);
    const metaPayload = {
      ...((body.meta && typeof body.meta === 'object') ? body.meta : {}),
      targeting
    };

    const parsedAmount = (typeof body.amount === 'number') ? body.amount : (body.amount ? Number(body.amount) : 0);
    const id = (body.id && String(body.id).startsWith('req_')) ? body.id : `req_${Date.now()}`;

    if (DB_ENABLED) {
      const existing = await dbQuery('SELECT * FROM requests WHERE id = $1', [id]);
      if (existing.rows.length) {
        return res.json({ success: true, request: existing.rows[0], duplicate: true });
      }

      const company = body.company || (body.creator && body.creator.name) || req.user.name || 'Community';
      const companyInitial = (body.creator && body.creator.name ? String(body.creator.name)[0] : (req.user.name ? String(req.user.name)[0] : 'C'));
      const funding = (typeof body.funding === 'number' && body.funding > 0) ? body.funding : (parsedAmount || 0);
      const createdAt = new Date().toISOString();

      await dbQuery(
        `INSERT INTO requests
          (id, title, description, likes, comments, boosts, amount, funding, is_trending, is_sponsored, company, company_initial, company_color, image_url, creator_id, creator_name, creator_email, created_by, created_at, meta)
         VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          id,
          body.title,
          body.description,
          0,
          0,
          0,
          parsedAmount || 0,
          funding,
          false,
          false,
          company,
          companyInitial,
          body.companyColor || 'bg-gray-400',
          body.imageUrl || '',
          req.user.id,
          req.user.name,
          req.user.email,
          req.user.id,
          createdAt,
          metaPayload
        ]
      );

      const { rows } = await dbQuery('SELECT * FROM requests WHERE id = $1', [id]);
      try {
        const targetCreatorIds = await resolveTargetCreatorIds(targeting, req.user?.id);
        await createRequestAssignedNotifications(targetCreatorIds, {
          id,
          title: body.title,
          description: body.description,
          amount: parsedAmount || 0,
          funding,
          delivery: body.delivery,
          deliveryType: body.deliveryType,
          meta: metaPayload
        }, req.user);
      } catch (notifyErr) {
        console.error('request notify error', notifyErr);
      }
      refreshRequestCache().catch(() => {});
      return res.json({ success: true, request: rows[0] });
    }

    const requests = readRequests();

    // Use client-provided ID if available (for optimistic UI consistency), else generate one
    // CRITICAL: Check for duplicate ID to prevent re-submitting the same request
    const existingIdx = requests.findIndex(r => String(r.id) === String(id));
    if (existingIdx !== -1) {
      console.log('Request with this ID already exists, returning existing:', id);
      return res.json({ success: true, request: requests[existingIdx], duplicate: true });
    }

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
      meta: metaPayload
    };
    requests.unshift(newReq);
    writeRequests(requests);
    try {
      const targetCreatorIds = await resolveTargetCreatorIds(targeting, req.user?.id);
      await createRequestAssignedNotifications(targetCreatorIds, newReq, req.user);
    } catch (notifyErr) {
      console.error('request notify error', notifyErr);
    }
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
    const targeting = normalizeRequestTargeting(body);
    const metaPayload = {
      ...((body.meta && typeof body.meta === 'object') ? body.meta : {}),
      targeting
    };
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
      createdBy: body.createdBy || creator.id || null,
      createdAt: new Date().toISOString(),
      meta: metaPayload
    };
    
    requests.unshift(newReq);
    writeRequests(requests);
    try {
      resolveTargetCreatorIds(targeting, creator.id || null)
        .then((targetCreatorIds) => createRequestAssignedNotifications(targetCreatorIds, newReq, creator))
        .catch((notifyErr) => console.error('public request notify error', notifyErr));
    } catch (notifyErr) {
      console.error('public request notify error', notifyErr);
    }
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
    // Only the creating user may edit.
    const requestOwnerId = existing.createdBy || existing.created_by || null;
    if (!requestOwnerId || String(requestOwnerId) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
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
    // Only the creating user may delete.
    const requestOwnerId = existing.createdBy || existing.created_by || null;
    if (!requestOwnerId || String(requestOwnerId) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    
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
app.use('/uploads', express.static(UPLOAD_DIR, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range,Content-Type,Accept');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// --- Share / Open Graph endpoints ---
app.get('/share/video/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const t = req.query.t ? String(req.query.t) : '';
    const videos = await loadVideos();
    const video = videos.find(v => String(v.id) === id) || null;
    const title = video?.title || 'Watch a video on Regaarder';
    const description = video?.requester ? `Requested by ${video.requester}` : 'Watch on Regaarder';
    const image = video?.imageUrl || video?.thumbnail || '';
    const redirectUrl = `${WEB_URL}/videoplayer?v=${encodeURIComponent(id)}${t ? `&t=${encodeURIComponent(t)}` : ''}`;
    const url = `${WEB_URL}/share/video/${encodeURIComponent(id)}${t ? `?t=${encodeURIComponent(t)}` : ''}`;
    res.set('Content-Type', 'text/html');
    return res.status(200).send(buildShareHtml({ title, description, image, url, redirectUrl, type: 'video.other' }));
  } catch (e) {
    res.set('Content-Type', 'text/html');
    return res.status(200).send(buildShareHtml({
      title: 'Regaarder',
      description: 'Watch on Regaarder',
      url: `${WEB_URL}/share/video`,
      redirectUrl: WEB_URL
    }));
  }
});

app.get('/share/request/:id', (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const requests = readRequests();
    const request = requests.find(r => String(r.id) === id) || null;
    const title = request?.title || 'View this request on Regaarder';
    const description = request?.description || 'Support this request on Regaarder';
    const image = request?.imageUrl || '';
    const redirectUrl = `${WEB_URL}/requests?id=${encodeURIComponent(id)}`;
    const url = `${WEB_URL}/share/request/${encodeURIComponent(id)}`;
    res.set('Content-Type', 'text/html');
    return res.status(200).send(buildShareHtml({ title, description, image, url, redirectUrl, type: 'website' }));
  } catch (e) {
    res.set('Content-Type', 'text/html');
    return res.status(200).send(buildShareHtml({
      title: 'Regaarder',
      description: 'Explore requests on Regaarder',
      url: `${WEB_URL}/share/request`,
      redirectUrl: `${WEB_URL}/requests`
    }));
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
    return res.status(200).send(buildShareHtml({ title, description, image, url, redirectUrl, type: 'profile' }));
  } catch (e) {
    res.set('Content-Type', 'text/html');
    return res.status(200).send(buildShareHtml({
      title: 'Regaarder',
      description: 'Discover creators on Regaarder',
      url: `${WEB_URL}/share/profile`,
      redirectUrl: WEB_URL
    }));
  }
});

// Upload overlay media (video/image/gif) - for staff dashboard
app.post('/staff/upload-overlay-media', (req, res) => {
  upload.single('media')(req, res, async function (err) {
    if (err) {
      console.error('overlay media upload error', err && err.message ? err.message : err);
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 100MB)' });
      if (err.message === 'Unsupported file type') return res.status(415).json({ error: 'Unsupported file type. Use images, GIFs, or videos.' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }

    try {
      if (!req.file) return res.status(400).json({ error: 'Missing file' });
      const processed = await ensureH264Mp4(req.file);
      const url = await persistUploadedFile(req, processed, 'overlays');
      return res.json({ success: true, url, filename: processed.filename || req.file.filename });
    } catch (err2) {
      console.error('overlay media upload error', err2);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// Upload intro video for creator profile
app.post('/creator/intro-video', authMiddleware, (req, res) => {
  // Use the multer middleware instance manually so we can handle errors nicely
  upload.single('video')(req, res, async function (err) {
    if (err) {
      console.error('upload error', err && err.message ? err.message : err);
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large' });
      if (err.message === 'Unsupported file type') return res.status(415).json({ error: 'Unsupported file type' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }

    try {
      if (!req.file) return res.status(400).json({ error: 'Missing file' });
      const processed = await ensureH264Mp4(req.file);
      const url = await persistUploadedFile(req, processed, 'intro-videos');
      // For demo, attach to user record
      if (DB_ENABLED) {
        await dbQuery('UPDATE users SET intro_video = $1 WHERE id = $2', [url, req.user.id]);
        refreshUserCache().catch(() => {});
      } else {
        const users = readUsers();
        const idx = users.findIndex(u => u.id === req.user.id);
        if (idx !== -1) {
          users[idx] = { ...users[idx], introVideo: url };
          writeUsers(users);
        }
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
  upload.any()(req, res, async function (err) {
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
      const url = await persistUploadedFile(req, uploaded, 'creator-uploads');
      const mimeType = uploaded.mimetype || '';
      if (DB_ENABLED) {
        if (mimeType.startsWith('image/')) {
          await dbQuery('UPDATE users SET image = $1 WHERE id = $2', [url, req.user.id]);
        } else {
          await dbQuery('UPDATE users SET document = $1 WHERE id = $2', [url, req.user.id]);
        }
        refreshUserCache().catch(() => {});
      } else {
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
    if (DB_ENABLED) {
      const fieldMap = {
        name: 'name',
        bio: 'bio',
        tag: 'tag',
        introVideo: 'intro_video',
        image: 'image',
        social: 'social',
        price: 'price',
        tagline: 'tagline',
        handle: 'handle',
        pricingType: 'pricing_type',
        categories: 'categories'
      };

      const fields = [];
      const values = [];
      let i = 1;

      allowed.forEach((k) => {
        if (typeof body[k] !== 'undefined') {
          fields.push(`${fieldMap[k]} = $${i}`);
          values.push(body[k]);
          i += 1;
        }
      });

      fields.push(`is_creator = true`);
      fields.push(`creator_since = now()`);

      values.push(req.user.id);
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;
      return dbQuery(sql, values)
        .then(({ rows }) => {
          if (!rows[0]) return res.status(404).json({ error: 'User not found' });
          refreshUserCache().catch(() => {});
          return res.json({ success: true, user: toPublicUser(mapUserRow(rows[0])) });
        })
        .catch((err) => {
          console.error('creator complete db error', err);
          return res.status(500).json({ error: 'Server error' });
        });
    }

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
// --- YouTube Duration Auto-Fill ---
// Extracts YouTube video ID from a URL
function getYouTubeIdFromUrl(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// Background: fill missing YouTube durations by scraping the video page for lengthSeconds
let _ytFillRunning = false;
async function fillYoutubeDurations() {
  if (_ytFillRunning) return;
  _ytFillRunning = true;
  try {
    const videos = await loadVideos();
    let updated = false;
    for (const v of videos) {
      if (v.time && v.time !== '0:00' && v.time !== '' && v.time !== '--:--') continue;
      const url = v.videoUrl || v.url;
      const ytId = getYouTubeIdFromUrl(url);
      if (!ytId) continue;
      try {
        const resp = await fetch(`https://www.youtube.com/watch?v=${ytId}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const html = await resp.text();
        const match = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
        if (match) {
          const secs = parseInt(match[1]);
          if (secs > 0) {
            const mins = Math.floor(secs / 60);
            const s = secs % 60;
            v.time = `${mins}:${String(s).padStart(2, '0')}`;
            updated = true;
            console.log(`[yt-fill] ${ytId} → ${v.time}`);
          }
        }
      } catch (e) { /* skip individual failures */ }
    }
    if (updated) await saveVideos(videos);
  } catch (err) { console.error('fillYoutubeDurations error:', err); }
  _ytFillRunning = false;
}

// Run once at startup (non-blocking)
setTimeout(() => fillYoutubeDurations(), 5000);

app.get('/videos', async (req, res) => {
  try {
    let videos = await loadVideos();
    const feed = req.query.feed; // 'trending' | 'recommended' | undefined
    const category = req.query.category;
    const user = await tryGetUser(req); // helper to get user from token if present

    console.log(`GET /videos feed=${feed} category=${category} user=${user ? user.id : 'anon'}`);

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
             const history = (await loadWatchHistory()).filter(h => String(h.userId) === String(userId));
             
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

    // Trigger background YouTube duration fill (non-blocking)
    fillYoutubeDurations();

    return res.json({ success: true, videos });
  } catch (err) {
    console.error('get videos error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get a single video by ID (including fresh ads data)
app.get('/videos/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    console.log(`GET /videos/${videoId}`);
    
    const videos = await loadVideos();
    const video = videos.find(v => String(v.id) === String(videoId));
    
    if (!video) {
      console.log(`Video not found: ${videoId}`);
      return res.status(404).json({ error: 'Video not found' });
    }
    
    console.log(`Found video: ${video.title}, ads:`, video.ads);
    return res.json(video);
  } catch (err) {
    console.error('get video by id error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /videos/:id/duration - update video duration when detected client-side
app.patch('/videos/:id/duration', async (req, res) => {
  try {
    const { time } = req.body || {};
    const videoId = req.params.id;
    if (!time || !videoId) return res.status(400).json({ error: 'Missing time or videoId' });

    const videos = await loadVideos();
    const video = videos.find(v => String(v.id) === String(videoId));
    if (!video) return res.status(404).json({ error: 'Video not found' });

    // Only update if current time is 0:00 or empty
    if (video.time && video.time !== '0:00' && video.time !== '') {
      return res.json({ success: true, message: 'Duration already set', time: video.time });
    }

    video.time = time;
    await saveVideos(videos);
    return res.json({ success: true, time });
  } catch (err) {
    console.error('PATCH video duration error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Publish a new video
app.post('/videos/publish', async (req, res) => {
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
      const user = await getUserFromAuthHeader(req);
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

    finalThumbnail = normalizeMediaUrl(finalThumbnail, req);
    finalVideoUrl = normalizeMediaUrl(finalVideoUrl, req);

    const videos = await loadVideos();
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
    await saveVideos(videos);
    
    // Update streak for the author if authenticated
    if (!DB_ENABLED && authorId && authorId !== 'anonymous') {
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
app.delete('/videos/:id', authMiddleware, async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const user = req.user;
    const videos = await loadVideos();
    
    const videoIndex = videos.findIndex(v => v.id === videoId);
    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Only allow the author to delete their own video
    if (videos[videoIndex].authorId !== user.email) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    videos.splice(videoIndex, 1);
    await saveVideos(videos);

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
app.get('/following', authMiddleware, async (req, res) => {
  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const following = user.following || [];
    const videos = await loadVideos();
    const creators = following.map(creatorId => {
      const creator = users.find(u => u.id === creatorId);
      if (!creator) return null;
      
      // Count videos for this creator
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

// --- Watch History storage ---
const WATCH_FILE = path.join(__dirname, 'watchhistory.json');
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
const loadWatchHistory = async () => {
  if (!DB_ENABLED) return readWatchHistory();
  const { rows } = await dbQuery('SELECT payload FROM watch_history ORDER BY updated_at DESC');
  return rows.map(row => row.payload);
};

const saveWatchHistory = async (list) => {
  if (!DB_ENABLED) {
    writeWatchHistory(list);
    return;
  }
  const client = await dbPool.connect();
  const ids = list.map(entry => `${entry.videoId}::${entry.userId || 'anonymous'}`);
  try {
    await client.query('BEGIN');
    for (const entry of list) {
      await client.query(
        `INSERT INTO watch_history (video_id, user_id, payload, updated_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (video_id, user_id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`,
        [String(entry.videoId), String(entry.userId || 'anonymous'), entry, new Date(entry.timestamp || Date.now())]
      );
    }
    if (ids.length > 0) {
      const params = ids.map((_, i) => `$${i + 1}`).join(',');
      await client.query(
        `DELETE FROM watch_history WHERE (video_id || '::' || user_id) NOT IN (${params})`,
        ids
      );
    } else {
      await client.query('DELETE FROM watch_history');
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const tryGetUser = async (req) => {
  try {
    const user = await getUserFromAuthHeader(req);
    if (user) return { id: user.id, email: user.email, name: user.name };
  } catch {}
  return null;
};
// Upsert watch progress
app.post('/watch/history', async (req, res) => {
  try {
    const { videoId, userId: bodyUserId, lastWatchedTime = 0, duration = 0, timestamp, isComplete = false } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const user = await tryGetUser(req);
    const userId = user ? user.id : (bodyUserId || 'anonymous');
    const ts = timestamp ? (typeof timestamp === 'string' ? timestamp : new Date(timestamp).toISOString()) : new Date().toISOString();
    const list = await loadWatchHistory();
    const idx = list.findIndex(e => String(e.videoId) === String(videoId) && String(e.userId || 'anonymous') === String(userId));
    const isNewWatch = idx < 0; // Track if this is a new watch entry
    const entry = { videoId, userId, lastWatchedTime: Number(lastWatchedTime) || 0, duration: Number(duration) || 0, timestamp: ts, isComplete: Boolean(isComplete) };
    if (idx >= 0) list[idx] = { ...list[idx], ...entry }; else list.unshift(entry);
    if (list.length > 2000) list.splice(2000);
    await saveWatchHistory(list);
    
    // Increment view count on video only if this is a new watch (not an update to existing watch)
    if (isNewWatch) {
      try {
        const videos = await loadVideos();
        const vidIdx = videos.findIndex(v => String(v.id) === String(videoId));
        if (vidIdx !== -1) {
          videos[vidIdx].views = String(Number(videos[vidIdx].views || 0) + 1);
          await saveVideos(videos);
          
          // Also increment the creator's total views in the user object
          const video = videos[vidIdx];
          if (!DB_ENABLED && (video.authorId || video.author || video.authorEmail)) {
            const users = readUsers();
            const creatorIdx = users.findIndex(u => 
              u.id === video.authorId || 
              u.email === video.authorEmail ||
              (u.name && u.name.toLowerCase() === (video.author || '').toLowerCase())
            );
            if (creatorIdx !== -1) {
              users[creatorIdx].views = (users[creatorIdx].views || 0) + 1;
              writeUsers(users);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to increment video views:', e);
      }
    }
    
    if (user && !DB_ENABLED) updateStreak(user.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('POST /watch/history error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
// Get watch history for current user (token optional; falls back to anonymous)
app.get('/watch/history', async (req, res) => {
  try {
    const user = await tryGetUser(req);
    const qUser = req.query.userId || null;
    const userId = user ? user.id : (qUser || 'anonymous');
    const list = (await loadWatchHistory()).filter(e => String(e.userId || 'anonymous') === String(userId));
    return res.json({ success: true, history: list });
  } catch (err) {
    console.error('GET /watch/history error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
// Delete single entry
app.delete('/watch/history/:videoId', async (req, res) => {
  try {
    const user = await tryGetUser(req);
    const userId = user ? user.id : 'anonymous';
    const vid = req.params.videoId;
    let list = await loadWatchHistory();
    const before = list.length;
    list = list.filter(e => !(String(e.videoId) === String(vid) && String(e.userId || 'anonymous') === String(userId)));
    await saveWatchHistory(list);
    return res.json({ success: true, removed: before - list.length });
  } catch (err) {
    console.error('DELETE /watch/history/:videoId error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
// Clear all for user
app.delete('/watch/history', async (req, res) => {
  try {
    const user = await tryGetUser(req);
    const userId = user ? user.id : 'anonymous';
    let list = await loadWatchHistory();
    const before = list.length;
    list = list.filter(e => String(e.userId || 'anonymous') !== String(userId));
    await saveWatchHistory(list);
    return res.json({ success: true, removed: before - list.length });
  } catch (err) {
    console.error('DELETE /watch/history error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// --- Bookmarks storage (per-user) ---
const BOOKMARKS_FILE = path.join(__dirname, 'bookmarks.json');
function readBookmarks() {
  try { if (!fs.existsSync(BOOKMARKS_FILE)) return { segments: [], videos: [], requests: [] }; const raw = fs.readFileSync(BOOKMARKS_FILE, 'utf8'); const j = JSON.parse(raw || '{}'); return { segments: j.segments || [], videos: j.videos || [], requests: j.requests || [] }; } catch (e) { return { segments: [], videos: [], requests: [] }; }
}
function writeBookmarks(data) {
  try { const safe = { segments: data.segments || [], videos: data.videos || [], requests: data.requests || [] }; fs.writeFileSync(BOOKMARKS_FILE, JSON.stringify(safe, null, 2), 'utf8'); } catch (e) {}
}

const loadVideoBookmarks = async (userId) => {
  if (!DB_ENABLED) {
    const all = readBookmarks();
    return (all.videos || []).filter(b => String(b.userId || 'anonymous') === String(userId));
  }
  const { rows } = await dbQuery(
    'SELECT id, user_id, video_url, title, created_at FROM user_video_bookmarks WHERE user_id = $1 ORDER BY created_at DESC',
    [String(userId)]
  );
  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    videoUrl: r.video_url,
    title: r.title || '',
    createdAt: r.created_at
  }));
};

const loadSegmentBookmarks = async (userId) => {
  if (!DB_ENABLED) {
    const all = readBookmarks();
    return (all.segments || []).filter(b => String(b.userId || 'anonymous') === String(userId));
  }
  const { rows } = await dbQuery(
    'SELECT id, user_id, video_url, label, start_time, end_time, created_at FROM user_segment_bookmarks WHERE user_id = $1 ORDER BY created_at DESC',
    [String(userId)]
  );
  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    videoUrl: r.video_url,
    label: r.label || '',
    startTime: Number(r.start_time || 0),
    endTime: Number(r.end_time || 0),
    createdAt: r.created_at
  }));
};

const saveVideoBookmark = async (bookmark) => {
  if (!DB_ENABLED) {
    const all = readBookmarks();
    all.videos.unshift(bookmark);
    if (all.videos.length > 1000) all.videos.splice(1000);
    writeBookmarks(all);
    return;
  }
  await dbQuery(
    `INSERT INTO user_video_bookmarks (id, user_id, video_url, title, created_at)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (id) DO UPDATE SET video_url = EXCLUDED.video_url, title = EXCLUDED.title`,
    [String(bookmark.id), String(bookmark.userId), String(bookmark.videoUrl), bookmark.title || '', bookmark.createdAt ? new Date(bookmark.createdAt) : new Date()]
  );
};

const saveSegmentBookmark = async (bookmark) => {
  if (!DB_ENABLED) {
    const all = readBookmarks();
    all.segments.unshift(bookmark);
    if (all.segments.length > 1000) all.segments.splice(1000);
    writeBookmarks(all);
    return;
  }
  await dbQuery(
    `INSERT INTO user_segment_bookmarks (id, user_id, video_url, label, start_time, end_time, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (id) DO UPDATE SET video_url = EXCLUDED.video_url, label = EXCLUDED.label, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time`,
    [String(bookmark.id), String(bookmark.userId), String(bookmark.videoUrl), bookmark.label || '', Number(bookmark.startTime || 0), Number(bookmark.endTime || 0), bookmark.createdAt ? new Date(bookmark.createdAt) : new Date()]
  );
};

const deleteVideoBookmark = async ({ userId, videoUrl }) => {
  if (!DB_ENABLED) {
    const all = readBookmarks();
    const before = (all.videos || []).length;
    all.videos = (all.videos || []).filter(b => !(String(b.userId || 'anonymous') === String(userId) && String(b.videoUrl) === String(videoUrl)));
    writeBookmarks(all);
    return Math.max(0, before - (all.videos || []).length);
  }
  const { rowCount } = await dbQuery(
    'DELETE FROM user_video_bookmarks WHERE user_id = $1 AND video_url = $2',
    [String(userId), String(videoUrl)]
  );
  return rowCount || 0;
};

async function getUserIdOrAnon(req) { const u = await tryGetUser(req); return u ? u.id : 'anonymous'; }

// Aggregate bookmarks for current user
app.get('/bookmarks', async (req, res) => {
  try {
    const user = await getUserFromAuthHeader(req);
    const userId = user ? user.id : 'anonymous';
    console.log('GET /bookmarks - userId:', userId, 'hasAuth:', !!req.headers.authorization);
    const segments = await loadSegmentBookmarks(userId);
    const videos = await loadVideoBookmarks(userId);

    if (DB_ENABLED) {
      const { rows } = await dbQuery('SELECT * FROM request_bookmarks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      const requests = rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        requestId: r.request_id,
        title: r.title || '',
        createdAt: r.created_at
      }));
      return res.json({ success: true, segments, videos, requests });
    }

    const all = readBookmarks();
    const requests = (all.requests || []).filter(b => String(b.userId||'anonymous') === String(userId));
    return res.json({ success: true, segments, videos, requests });
  } catch (err) { console.error('GET /bookmarks error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Save a timestamped segment bookmark
app.post('/bookmarks/segments', async (req, res) => {
  try {
    const userId = await getUserIdOrAnon(req);
    const { videoUrl, label, startTime, endTime } = req.body || {};
    if (!videoUrl) return res.status(400).json({ error: 'Missing videoUrl' });
    const b = { id: `seg_${Date.now()}`, userId, videoUrl, label: label || '', startTime: Math.max(0, Number(startTime||0)), endTime: Math.max(0, Number(endTime||0)), createdAt: new Date().toISOString() };
    await saveSegmentBookmark(b);
    return res.json({ success: true, segment: b });
  } catch (err) { console.error('POST /bookmarks/segments error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Save a normal video bookmark
app.post('/bookmarks/videos', async (req, res) => {
  try {
    const userId = await getUserIdOrAnon(req);
    const { videoUrl, title, label } = req.body || {};
    if (!videoUrl) return res.status(400).json({ error: 'Missing videoUrl' });
    const b = { id: `vid_${Date.now()}`, userId, videoUrl, title: title || label || '', createdAt: new Date().toISOString() };
    await saveVideoBookmark(b);
    return res.json({ success: true, video: b });
  } catch (err) { console.error('POST /bookmarks/videos error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Remove a normal video bookmark for the current user by videoUrl
app.delete('/bookmarks/videos', async (req, res) => {
  try {
    const userId = await getUserIdOrAnon(req);
    const { videoUrl } = req.body || {};
    if (!videoUrl) return res.status(400).json({ error: 'Missing videoUrl' });
    const removed = await deleteVideoBookmark({ userId, videoUrl });
    return res.json({ success: true, removed });
  } catch (err) { console.error('DELETE /bookmarks/videos error', err); return res.status(500).json({ error: 'Server error' }); }
});

// --- Reactions storage (per-user per-request) ---
const REQUEST_REACTIONS_FILE = path.join(__dirname, 'request_reactions.json');
function readRequestReactions() {
  try { if (!fs.existsSync(REQUEST_REACTIONS_FILE)) return { likes: {}, dislikes: {} }; const raw = fs.readFileSync(REQUEST_REACTIONS_FILE, 'utf8'); const j = JSON.parse(raw || '{}'); return { likes: j.likes || {}, dislikes: j.dislikes || {} }; } catch (e) { return { likes: {}, dislikes: {} }; }
}
function writeRequestReactions(data) {
  try { const safe = { likes: data.likes || {}, dislikes: data.dislikes || {} }; fs.writeFileSync(REQUEST_REACTIONS_FILE, JSON.stringify(safe, null, 2), 'utf8'); } catch (e) {}
}

// Persist request reactions and aggregate counts
app.post('/requests/react', async (req, res) => {
  try {
    const { requestId, action } = req.body || {};
    if (!requestId || !action) return res.status(400).json({ error: 'Missing requestId or action' });
    if (DB_ENABLED) {
      return (async () => {
        const user = await getUserFromAuthHeader(req);
        const userId = user ? user.id : 'anonymous';
        const reqRes = await dbQuery('SELECT id, likes FROM requests WHERE id = $1', [requestId]);
        if (!reqRes.rows[0]) return res.status(404).json({ error: 'Request not found' });

        const currentLikes = Number(reqRes.rows[0].likes || 0);
        const reactRes = await dbQuery(
          'SELECT is_liked, is_disliked FROM request_reactions WHERE request_id = $1 AND user_id = $2',
          [requestId, userId]
        );
        const current = reactRes.rows[0] || { is_liked: false, is_disliked: false };
        let likesCount = currentLikes;
        let nextLiked = current.is_liked;
        let nextDisliked = current.is_disliked;

        if (action === 'like') {
          if (!current.is_liked) likesCount += 1;
          nextLiked = true;
          nextDisliked = false;
        } else if (action === 'unlike') {
          if (current.is_liked) likesCount = Math.max(0, likesCount - 1);
          nextLiked = false;
        } else if (action === 'dislike') {
          if (current.is_liked) likesCount = Math.max(0, likesCount - 1);
          nextLiked = false;
          nextDisliked = true;
        } else if (action === 'undislike') {
          nextDisliked = false;
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

        await dbQuery('BEGIN');
        await dbQuery(
          `INSERT INTO request_reactions (request_id, user_id, is_liked, is_disliked, updated_at)
           VALUES ($1,$2,$3,$4,now())
           ON CONFLICT (request_id, user_id)
           DO UPDATE SET is_liked = EXCLUDED.is_liked, is_disliked = EXCLUDED.is_disliked, updated_at = now()`,
          [requestId, userId, nextLiked, nextDisliked]
        );
        await dbQuery('UPDATE requests SET likes = $1 WHERE id = $2', [likesCount, requestId]);
        await dbQuery('COMMIT');
        refreshRequestCache().catch(() => {});

        return res.json({ success: true, requestId, action, likes: likesCount });
      })().catch((err) => {
        console.error('requests react db error', err);
        return res.status(500).json({ error: 'Server error' });
      });
    }

    const user = await tryGetUser(req);
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
    if (DB_ENABLED) {
      return dbQuery(
        'SELECT request_id, is_liked, is_disliked FROM request_reactions WHERE user_id = $1',
        [req.user.id]
      )
        .then(({ rows }) => {
          const map = {};
          rows.forEach((row) => {
            map[row.request_id] = map[row.request_id] || {};
            if (row.is_liked) map[row.request_id].isLiked = true;
            if (row.is_disliked) map[row.request_id].isDisliked = true;
          });
          return res.json({ success: true, reactions: map });
        })
        .catch((err) => {
          console.error('get reactions db error', err);
          return res.status(500).json({ error: 'Server error' });
        });
    }

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
      if (DB_ENABLED) {
        dbQuery('SELECT amount, funding, meta FROM requests WHERE id = $1 LIMIT 1', [String(requestId)])
          .then(({ rows }) => {
            const row = rows[0];
            if (!row) return;
            const currentMeta = (row.meta && typeof row.meta === 'object') ? row.meta : {};
            const priorPaid = getPaidAmountFromRequest({ amount: row.amount, funding: row.funding, meta: currentMeta });
            const nextPaid = toNonNegativeNumber(priorPaid + Number(amount), priorPaid);
            const nextMeta = {
              ...currentMeta,
              paidAmount: nextPaid,
              lastPaidAmount: toNonNegativeNumber(amount, 0),
              lastPaidAt: new Date().toISOString()
            };
            const currentBoosts = Number(currentMeta.syntheticBoosts || 0);
            const nextBoosts = toNonNegativeNumber(currentBoosts + Number(amount), currentBoosts);
            dbQuery(
              'UPDATE requests SET funding = $1, boosts = $2, meta = $3::jsonb, updated_at = NOW() WHERE id = $4',
              [nextPaid, nextBoosts, JSON.stringify({ ...nextMeta, syntheticBoosts: nextBoosts }), String(requestId)]
            ).then(() => refreshRequestCache().catch(() => {}))
            .catch((err) => console.error('create-session db update error', err));
          })
          .catch((err) => console.error('create-session db read error', err));
      } else {
        const requests = readRequests();
        const idx = requests.findIndex(r => String(r.id) === String(requestId));
        if (idx !== -1) {
          const reqItem = requests[idx] || {};
          const currentMeta = (reqItem.meta && typeof reqItem.meta === 'object') ? reqItem.meta : {};
          const priorPaid = getPaidAmountFromRequest(reqItem);
          const nextPaid = toNonNegativeNumber(priorPaid + Number(amount), priorPaid);
          const prevBoosts = Number(reqItem.boosts || 0);
          requests[idx] = {
            ...reqItem,
            boosts: toNonNegativeNumber(prevBoosts + Number(amount), prevBoosts),
            funding: nextPaid,
            meta: {
              ...currentMeta,
              paidAmount: nextPaid,
              lastPaidAmount: toNonNegativeNumber(amount, 0),
              lastPaidAt: new Date().toISOString()
            },
            updatedAt: new Date().toISOString()
          };
          writeRequests(requests);
        }
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
app.post('/requests/:id/status', authMiddleware, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { step, message } = req.body || {};
    
    const requests = readRequests();
    const idx = requests.findIndex(r => String(r.id) === String(requestId));
    if (idx === -1) return res.status(404).json({ error: 'Request not found' });
    
    const request = requests[idx];
    
    // Check if claimed by current user
     const claimedById = getClaimedByUserId(request);
     if (!request.claimed || !claimedById || claimedById !== String(req.user.id)) {
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
        
        const arr = await loadNotifications();
        arr.unshift(suggestion);
        await saveNotifications(arr);
    }

    return res.json({ success: true, currentStep: request.currentStep });
  } catch (err) {
    console.error('update status error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Video reactions storage (likes/dislikes per video per user)
const VIDEO_REACTIONS_FILE = path.join(__dirname, 'video_reactions.json');
function readVideoReactions() { try { if (!fs.existsSync(VIDEO_REACTIONS_FILE)) return { likes: {}, dislikes: {} }; const raw = fs.readFileSync(VIDEO_REACTIONS_FILE, 'utf8'); const j = JSON.parse(raw || '{}'); return { likes: j.likes || {}, dislikes: j.dislikes || {} }; } catch (e) { return { likes: {}, dislikes: {} }; } }
function writeVideoReactions(data) { try { const safe = { likes: data.likes || {}, dislikes: data.dislikes || {} }; fs.writeFileSync(VIDEO_REACTIONS_FILE, JSON.stringify(safe, null, 2), 'utf8'); } catch (e) {} }

// Helper: find video index by flexible id/url/title matching
function findVideoIndexById(videos, videoId) {
  try {
    return videos.findIndex(v => String(v.id) === String(videoId) || String(v.url) === String(videoId) || String(v.videoUrl) === String(videoId) || String(v.src) === String(videoId) || String(v.title) === String(videoId));
  } catch (e) { return -1; }
}

// GET like/dislike status for a given video (checks token if provided)
app.get('/likes/status', async (req, res) => {
  try {
    const videoId = req.query.videoId || null;
    if (!videoId) return res.json({ liked: false, disliked: false });
    let liked = false;
    let disliked = false;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const user = await getUserFromAuthHeader(req);
      if (user) {
        if (DB_ENABLED) {
          const { rows } = await dbQuery(
            'SELECT is_liked, is_disliked FROM video_reactions WHERE video_id = $1 AND user_id = $2',
            [String(videoId), String(user.id)]
          );
          if (rows[0]) {
            liked = Boolean(rows[0].is_liked);
            disliked = Boolean(rows[0].is_disliked);
          }
        } else {
          const reactions = readVideoReactions();
          liked = !!(reactions.likes[videoId] && reactions.likes[videoId][user.id]);
          disliked = !!(reactions.dislikes[videoId] && reactions.dislikes[videoId][user.id]);
        }
      }
    }
    return res.json({ liked, disliked });
  } catch (err) { console.error('GET /likes/status error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Like/unlike endpoints (require auth)
app.post('/likes', authMiddleware, async (req, res) => {
  try {
    const { videoId } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const userId = req.user.id;
    const videos = await loadVideos();
    const vidx = findVideoIndexById(videos, videoId);
    if (DB_ENABLED) {
      let likesCount = Number((vidx !== -1 ? (videos[vidx].likes || 0) : 0)) || 0;
      let dislikesCount = Number((vidx !== -1 ? (videos[vidx].dislikes || 0) : 0)) || 0;
      const { rows } = await dbQuery(
        'SELECT is_liked, is_disliked FROM video_reactions WHERE video_id = $1 AND user_id = $2',
        [String(videoId), String(userId)]
      );
      const prevLiked = Boolean(rows[0]?.is_liked);
      const prevDisliked = Boolean(rows[0]?.is_disliked);
      let nextLiked = prevLiked;
      let nextDisliked = prevDisliked;

      if (!prevLiked) {
        nextLiked = true;
        likesCount += 1;
      }
      if (prevDisliked) {
        nextDisliked = false;
        dislikesCount = Math.max(0, dislikesCount - 1);
      }

      await dbQuery(
        `INSERT INTO video_reactions (video_id, user_id, is_liked, is_disliked, updated_at)
         VALUES ($1,$2,$3,$4,now())
         ON CONFLICT (video_id, user_id)
         DO UPDATE SET is_liked = EXCLUDED.is_liked, is_disliked = EXCLUDED.is_disliked, updated_at = now()`,
        [String(videoId), String(userId), nextLiked, nextDisliked]
      );

      if (vidx !== -1) {
        videos[vidx].likes = String(likesCount);
        videos[vidx].dislikes = String(dislikesCount);
        await saveVideos(videos);
      }

      return res.json({ success: true, likes: likesCount, dislikes: dislikesCount });
    }

    const reactions = readVideoReactions();

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
      await saveVideos(videos);
    }

    return res.json({ success: true, likes: likesCount, dislikes: dislikesCount });
  } catch (err) { console.error('POST /likes error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.delete('/likes', authMiddleware, async (req, res) => {
  try {
    const { videoId } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const userId = req.user.id;
    const videos = await loadVideos();
    const vidx = findVideoIndexById(videos, videoId);
    if (DB_ENABLED) {
      let likesCount = Number((vidx !== -1 ? (videos[vidx].likes || 0) : 0)) || 0;
      const { rows } = await dbQuery(
        'SELECT is_liked, is_disliked FROM video_reactions WHERE video_id = $1 AND user_id = $2',
        [String(videoId), String(userId)]
      );
      const prevLiked = Boolean(rows[0]?.is_liked);
      const prevDisliked = Boolean(rows[0]?.is_disliked);
      let nextLiked = prevLiked;

      if (prevLiked) {
        nextLiked = false;
        likesCount = Math.max(0, likesCount - 1);
      }

      await dbQuery(
        `INSERT INTO video_reactions (video_id, user_id, is_liked, is_disliked, updated_at)
         VALUES ($1,$2,$3,$4,now())
         ON CONFLICT (video_id, user_id)
         DO UPDATE SET is_liked = EXCLUDED.is_liked, is_disliked = EXCLUDED.is_disliked, updated_at = now()`,
        [String(videoId), String(userId), nextLiked, prevDisliked]
      );

      if (vidx !== -1) {
        videos[vidx].likes = String(likesCount);
        await saveVideos(videos);
      }

      return res.json({ success: true, likes: likesCount });
    }

    const reactions = readVideoReactions();

    reactions.likes[videoId] = reactions.likes[videoId] || {};

    let likesCount = Number((vidx !== -1 ? (videos[vidx].likes || 0) : 0)) || 0;

    if (reactions.likes[videoId][userId]) {
      delete reactions.likes[videoId][userId];
      likesCount = Math.max(0, likesCount - 1);
    }

    writeVideoReactions(reactions);
    if (vidx !== -1) {
      videos[vidx].likes = String(likesCount);
      await saveVideos(videos);
    }

    return res.json({ success: true, likes: likesCount });
  } catch (err) { console.error('DELETE /likes error', err); return res.status(500).json({ error: 'Server error' }); }
});

// Dislike/un-dislike endpoints (require auth)
app.post('/dislikes', authMiddleware, async (req, res) => {
  try {
    const { videoId } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const userId = req.user.id;
    const videos = await loadVideos();
    const vidx = findVideoIndexById(videos, videoId);
    if (DB_ENABLED) {
      let likesCount = Number((vidx !== -1 ? (videos[vidx].likes || 0) : 0)) || 0;
      let dislikesCount = Number((vidx !== -1 ? (videos[vidx].dislikes || 0) : 0)) || 0;
      const { rows } = await dbQuery(
        'SELECT is_liked, is_disliked FROM video_reactions WHERE video_id = $1 AND user_id = $2',
        [String(videoId), String(userId)]
      );
      const prevLiked = Boolean(rows[0]?.is_liked);
      const prevDisliked = Boolean(rows[0]?.is_disliked);
      let nextLiked = prevLiked;
      let nextDisliked = prevDisliked;

      if (!prevDisliked) {
        nextDisliked = true;
        dislikesCount += 1;
      }
      if (prevLiked) {
        nextLiked = false;
        likesCount = Math.max(0, likesCount - 1);
      }

      await dbQuery(
        `INSERT INTO video_reactions (video_id, user_id, is_liked, is_disliked, updated_at)
         VALUES ($1,$2,$3,$4,now())
         ON CONFLICT (video_id, user_id)
         DO UPDATE SET is_liked = EXCLUDED.is_liked, is_disliked = EXCLUDED.is_disliked, updated_at = now()`,
        [String(videoId), String(userId), nextLiked, nextDisliked]
      );

      if (vidx !== -1) {
        videos[vidx].likes = String(likesCount);
        videos[vidx].dislikes = String(dislikesCount);
        await saveVideos(videos);
      }

      return res.json({ success: true, likes: likesCount, dislikes: dislikesCount });
    }

    const reactions = readVideoReactions();

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
      await saveVideos(videos);
    }

    return res.json({ success: true, likes: likesCount, dislikes: dislikesCount });
  } catch (err) { console.error('POST /dislikes error', err); return res.status(500).json({ error: 'Server error' }); }
});

app.delete('/dislikes', authMiddleware, async (req, res) => {
  try {
    const { videoId } = req.body || {};
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    const userId = req.user.id;
    const videos = await loadVideos();
    const vidx = findVideoIndexById(videos, videoId);
    if (DB_ENABLED) {
      let dislikesCount = Number((vidx !== -1 ? (videos[vidx].dislikes || 0) : 0)) || 0;
      const { rows } = await dbQuery(
        'SELECT is_liked, is_disliked FROM video_reactions WHERE video_id = $1 AND user_id = $2',
        [String(videoId), String(userId)]
      );
      const prevLiked = Boolean(rows[0]?.is_liked);
      const prevDisliked = Boolean(rows[0]?.is_disliked);
      let nextDisliked = prevDisliked;

      if (prevDisliked) {
        nextDisliked = false;
        dislikesCount = Math.max(0, dislikesCount - 1);
      }

      await dbQuery(
        `INSERT INTO video_reactions (video_id, user_id, is_liked, is_disliked, updated_at)
         VALUES ($1,$2,$3,$4,now())
         ON CONFLICT (video_id, user_id)
         DO UPDATE SET is_liked = EXCLUDED.is_liked, is_disliked = EXCLUDED.is_disliked, updated_at = now()`,
        [String(videoId), String(userId), prevLiked, nextDisliked]
      );

      if (vidx !== -1) {
        videos[vidx].dislikes = String(dislikesCount);
        await saveVideos(videos);
      }

      return res.json({ success: true, dislikes: dislikesCount });
    }

    const reactions = readVideoReactions();

    reactions.dislikes[videoId] = reactions.dislikes[videoId] || {};

    let dislikesCount = Number((vidx !== -1 ? (videos[vidx].dislikes || 0) : 0)) || 0;

    if (reactions.dislikes[videoId][userId]) {
      delete reactions.dislikes[videoId][userId];
      dislikesCount = Math.max(0, dislikesCount - 1);
    }

    writeVideoReactions(reactions);
    if (vidx !== -1) {
      videos[vidx].dislikes = String(dislikesCount);
      await saveVideos(videos);
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
    const claimedById = getClaimedByUserId(request);
    if (!request.claimed || !claimedById || claimedById !== String(userId)) {
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
const STAFF_FILE = path.join(__dirname, 'staff.json');

const readStaff = () => {
  try {
    if (DB_ENABLED) {
      if (staffCache) return ensureDefaultAdminEmployee(staffCache);
      if (fs.existsSync(STAFF_FILE)) {
        const data = fs.readFileSync(STAFF_FILE, 'utf8');
        staffCache = ensureDefaultAdminEmployee(JSON.parse(data));
        return staffCache;
      }
      return ensureDefaultAdminEmployee(DEFAULT_STAFF_STATE);
    }
    const data = fs.readFileSync(STAFF_FILE, 'utf8');
    return ensureDefaultAdminEmployee(JSON.parse(data));
  } catch (err) {
    console.error('Error reading staff.json:', err);
    return ensureDefaultAdminEmployee(DEFAULT_STAFF_STATE);
  }
};

const writeStaff = (data) => {
  try {
    const normalized = ensureDefaultAdminEmployee(data);
    if (DB_ENABLED) {
      staffCache = normalized;
      dbQuery(
        `INSERT INTO staff_state (id, payload, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()`,
        ['staff_state', normalized]
      ).catch((err) => console.error('write staff state db error', err));
    }
    fs.writeFileSync(STAFF_FILE, JSON.stringify(normalized, null, 2));
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
    const adminFallback = { ...DEFAULT_ADMIN_EMPLOYEE };
    let employee = staff.employees.find(e => e.id === parseInt(employeeId));
    if (!employee && Number(employeeId) === 1000) {
      employee = adminFallback;
    }

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
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const adminEmail = String(DEFAULT_ADMIN_EMPLOYEE.email || '').trim().toLowerCase();
    
    // Check if account is already approved
    const approved = staff.employees.find(e => String(e.email || '').trim().toLowerCase() === normalizedEmail)
      || (normalizedEmail === adminEmail ? { ...DEFAULT_ADMIN_EMPLOYEE } : null);
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
app.post('/staff/shadow-delete/:videoId', async (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const videoId = req.params.videoId;

    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const videos = await loadVideos();
    const video = videos.find(v => v.id === videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Mark as shadow deleted
    video.shadowDeleted = true;
    video.shadowDeletedBy = parseInt(employeeId);
    video.shadowDeletedAt = new Date().toISOString();
    video.shadowDeleteReason = reason;

    await saveVideos(videos);

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
app.get('/staff/videos', async (req, res) => {
  try {
    const { employeeId } = req.query;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const videos = await loadVideos();
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
    if (DB_ENABLED) {
      return dbQuery('SELECT * FROM users ORDER BY created_at DESC')
        .then(({ rows }) => {
          const users = rows.map(mapUserRow).filter((u) => !isBogusTestUser(u));
          return res.json({ users });
        })
        .catch((err) => {
          console.error('Get users db error:', err);
          return res.status(500).json({ error: 'Server error' });
        });
    }

    const users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')).filter((u) => !isBogusTestUser(u));
    return res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete video (admin)
app.delete('/staff/delete-video/:videoId', async (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const videoId = req.params.videoId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let videos = await loadVideos();
    const videoIndex = videos.findIndex(v => v.id === videoId);

    if (videoIndex === -1) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const deletedVideo = videos.splice(videoIndex, 1)[0];
    await saveVideos(videos);

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
app.post('/staff/hide-video/:videoId', async (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const videoId = req.params.videoId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let videos = await loadVideos();
    const video = videos.find(v => v.id === videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    video.hidden = true;
    video.hiddenReason = reason;
    video.hiddenBy = parseInt(employeeId);
    video.hiddenAt = new Date().toISOString();
    await saveVideos(videos);

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
    if (DB_ENABLED) {
      return dbQuery('SELECT * FROM requests ORDER BY created_at DESC')
        .then(({ rows }) => {
          const requests = rows.map((row) => applyRequestAmountPresentation({
            id: row.id,
            title: row.title,
            description: row.description,
            likes: Number(row.likes || 0),
            comments: Number(row.comments || 0),
            boosts: Number(row.boosts || 0),
            amount: row.amount != null ? Number(row.amount) : 0,
            funding: row.funding != null ? Number(row.funding) : 0,
            isTrending: Boolean(row.is_trending),
            isSponsored: Boolean(row.is_sponsored),
            company: row.company,
            companyInitial: row.company_initial,
            companyColor: row.company_color,
            imageUrl: row.image_url,
            creatorId: row.creator_id,
            creatorName: row.creator_name,
            creatorEmail: row.creator_email,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            currentStep: row.current_step,
            claimed: row.claimed,
            claimedBy: row.claimed_by,
            claimedAt: row.claimed_at,
            meta: row.meta
          }));
          return res.json({ requests });
        })
        .catch((err) => {
          console.error('Get requests db error:', err);
          return res.status(500).json({ error: 'Server error' });
        });
    }

    const requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8')).map((request) => applyRequestAmountPresentation(request));
    return res.json({ requests });
  } catch (err) {
    console.error('Get requests error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Override request amount (admin)
app.post('/staff/requests/:requestId/override-amount', (req, res) => {
  try {
    const { employeeId, amount, reason, actorId } = req.body || {};
    const requestId = req.params.requestId;

    const numericEmployeeId = parseInt(employeeId ?? req.query?.employeeId, 10);
    if (!Number.isFinite(numericEmployeeId)) {
      console.error('Override amount: invalid employeeId', employeeId);
      return res.status(400).json({ error: 'Missing or invalid employeeId' });
    }

    const staff = readStaff();
    // Use loose comparison (==) so numeric vs string IDs both match
    const employee = staff.employees.find(e => Number(e.id) === numericEmployeeId);
    const normalizedRole = String(employee?.role || '').trim().toLowerCase();
    const isAuthorized =
      numericEmployeeId === 1000 ||
      !!employee?.approvalAuthority ||
      normalizedRole === 'administrator' ||
      normalizedRole === 'admin' ||
      normalizedRole === 'staff';

    if (!isAuthorized) {
      console.error('Override amount: unauthorized employee', numericEmployeeId, 'role:', normalizedRole, 'found:', !!employee);
      return res.status(403).json({ error: 'Unauthorized - employee not found or lacks permission' });
    }

    // Use actorId for audit trail if provided (actual staff who made the change)
    const auditEmployeeId = (actorId && Number.isFinite(parseInt(actorId, 10))) ? parseInt(actorId, 10) : numericEmployeeId;

    const nextAmount = Number(amount);
    if (!Number.isFinite(nextAmount) || nextAmount < 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (DB_ENABLED) {
      return dbQuery('SELECT amount, funding, meta FROM requests WHERE id = $1 LIMIT 1', [requestId])
        .then(({ rows }) => {
          const row = rows[0];
          if (!row) return res.status(404).json({ error: 'Request not found' });

          const currentMeta = row.meta || {};
          const paidAmount = getPaidAmountFromRequest({ amount: row.amount, funding: row.funding, meta: currentMeta });
          const originalAmount = Number(currentMeta.staffAmountOverrideOriginal ?? paidAmount) || 0;

          const nextMeta = {
            ...currentMeta,
            paidAmount,
            staffAmountOverrideOriginal: originalAmount,
            staffAmountOverride: {
              active: true,
              amount: nextAmount,
              reason: reason || '',
              overriddenBy: auditEmployeeId,
              overriddenAt: new Date().toISOString(),
              originalAmount
            }
          };

          return dbQuery(
            'UPDATE requests SET meta = $1::jsonb, updated_at = NOW() WHERE id = $2',
            [JSON.stringify(nextMeta), requestId]
          ).then(() => {
            refreshRequestCache().catch(() => {});
            return res.json({
              success: true,
              message: 'Request amount overridden',
              request: applyRequestAmountPresentation({
                id: requestId,
                amount: row.amount,
                funding: row.funding,
                meta: nextMeta
              })
            });
          });
        })
        .catch((err) => {
          console.error('Override request amount db error:', err);
          return res.status(500).json({ error: 'Database error: ' + (err.message || 'unknown') });
        });
    }

    const requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
    const request = requests.find(r => String(r.id) === String(requestId));
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const currentMeta = request.meta || {};
    const previousAmount = getPaidAmountFromRequest(request);
    const originalAmount = Number(currentMeta.staffAmountOverrideOriginal ?? previousAmount) || 0;
    const nextMeta = {
      ...currentMeta,
      paidAmount: previousAmount,
      staffAmountOverrideOriginal: originalAmount,
      staffAmountOverride: {
        active: true,
        amount: nextAmount,
        reason: reason || '',
        overriddenBy: auditEmployeeId,
        overriddenAt: new Date().toISOString(),
        originalAmount
      }
    };

    request.meta = nextMeta;
    request.updatedAt = new Date().toISOString();

    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));

    return res.json({
      success: true,
      message: 'Request amount overridden',
      request: applyRequestAmountPresentation(request)
    });
  } catch (err) {
    console.error('Override request amount error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Revert request amount override (admin)
app.post('/staff/requests/:requestId/revert-amount', (req, res) => {
  try {
    const { employeeId, reason, actorId } = req.body || {};
    const requestId = req.params.requestId;

    const numericEmployeeId = parseInt(employeeId ?? req.query?.employeeId, 10);
    if (!Number.isFinite(numericEmployeeId)) {
      return res.status(400).json({ error: 'Missing or invalid employeeId' });
    }

    const staff = readStaff();
    const employee = staff.employees.find(e => Number(e.id) === numericEmployeeId);
    const normalizedRole = String(employee?.role || '').trim().toLowerCase();
    const isAuthorized =
      numericEmployeeId === 1000 ||
      !!employee?.approvalAuthority ||
      normalizedRole === 'administrator' ||
      normalizedRole === 'admin' ||
      normalizedRole === 'staff';

    if (!isAuthorized) {
      console.error('Revert amount: unauthorized employee', numericEmployeeId, 'role:', normalizedRole);
      return res.status(403).json({ error: 'Unauthorized - employee not found or lacks permission' });
    }

    // Use actorId for audit trail if provided
    const auditEmployeeId = (actorId && Number.isFinite(parseInt(actorId, 10))) ? parseInt(actorId, 10) : numericEmployeeId;

    if (DB_ENABLED) {
      return dbQuery('SELECT amount, funding, meta FROM requests WHERE id = $1 LIMIT 1', [requestId])
        .then(({ rows }) => {
          const row = rows[0];
          if (!row) return res.status(404).json({ error: 'Request not found' });

          const currentMeta = row.meta || {};
          const overrideMeta = currentMeta.staffAmountOverride || {};
          const paidAmount = getPaidAmountFromRequest({ amount: row.amount, funding: row.funding, meta: currentMeta });
          const originalAmount = Number(currentMeta.staffAmountOverrideOriginal ?? overrideMeta.originalAmount ?? paidAmount);
          const safeOriginalAmount = Number.isFinite(originalAmount) && originalAmount >= 0 ? originalAmount : 0;

          const nextMeta = {
            ...currentMeta,
            paidAmount,
            staffAmountOverride: {
              ...overrideMeta,
              active: false,
              revertedBy: auditEmployeeId,
              revertedAt: new Date().toISOString(),
              revertReason: reason || ''
            }
          };

          return dbQuery(
            'UPDATE requests SET meta = $1::jsonb, updated_at = NOW() WHERE id = $2',
            [JSON.stringify(nextMeta), requestId]
          ).then(() => {
            refreshRequestCache().catch(() => {});
            return res.json({
              success: true,
              message: 'Request amount reverted',
              request: applyRequestAmountPresentation({
                id: requestId,
                amount: row.amount,
                funding: row.funding,
                meta: nextMeta
              })
            });
          });
        })
        .catch((err) => {
          console.error('Revert request amount db error:', err);
          return res.status(500).json({ error: 'Database error: ' + (err.message || 'unknown') });
        });
    }

    const requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
    const request = requests.find(r => String(r.id) === String(requestId));
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const currentMeta = request.meta || {};
    const overrideMeta = currentMeta.staffAmountOverride || {};
    const paidAmount = getPaidAmountFromRequest(request);
    const originalAmount = Number(currentMeta.staffAmountOverrideOriginal ?? overrideMeta.originalAmount ?? paidAmount);
    const safeOriginalAmount = Number.isFinite(originalAmount) && originalAmount >= 0 ? originalAmount : 0;

    request.meta = {
      ...currentMeta,
      paidAmount,
      staffAmountOverride: {
        ...overrideMeta,
        active: false,
        revertedBy: auditEmployeeId,
        revertedAt: new Date().toISOString(),
        revertReason: reason || ''
      }
    };
    request.updatedAt = new Date().toISOString();

    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));

    return res.json({
      success: true,
      message: 'Request amount reverted',
      request: applyRequestAmountPresentation(request)
    });
  } catch (err) {
    console.error('Revert request amount error:', err);
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

    if (DB_ENABLED) {
      return dbQuery('DELETE FROM requests WHERE id = $1', [requestId])
        .then(({ rowCount }) => {
          if (!rowCount) return res.status(404).json({ error: 'Request not found' });

          refreshRequestCache().catch(() => {});

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

          return res.json({ success: true, message: 'Request deleted', requestId });
        })
        .catch((err) => {
          console.error('Delete request db error:', err);
          return res.status(500).json({ error: 'Server error' });
        });
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

    return res.json({ success: true, message: 'Request deleted', requestId });
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

    if (DB_ENABLED) {
      return dbQuery('SELECT meta FROM requests WHERE id = $1', [requestId])
        .then(({ rows }) => {
          if (!rows[0]) return res.status(404).json({ error: 'Request not found' });
          const meta = rows[0].meta || {};
          const hiddenInfo = {
            hidden: true,
            hiddenReason: reason,
            hiddenBy: parseInt(employeeId),
            hiddenAt: new Date().toISOString()
          };
          return dbQuery(
            'UPDATE requests SET meta = $1 WHERE id = $2',
            [{ ...meta, ...hiddenInfo }, requestId]
          ).then(() => {
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
            refreshRequestCache().catch(() => {});
            return res.json({ success: true, message: 'Request hidden' });
          });
        })
        .catch((err) => {
          console.error('Hide request db error:', err);
          return res.status(500).json({ error: 'Server error' });
        });
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
app.get('/staff/comments', async (req, res) => {
  try {
    const { employeeId } = req.query;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const comments = await loadComments();
    return res.json({ comments });
  } catch (err) {
    console.error('Get comments error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment (admin)
app.delete('/staff/delete-comment/:commentId', async (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const commentId = req.params.commentId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let comments = await loadComments();
    const commentIndex = comments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const deletedComment = comments.splice(commentIndex, 1)[0];
    await saveComments(comments);

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
app.post('/staff/hide-comment/:commentId', async (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const commentId = req.params.commentId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let comments = await loadComments();
    const comment = comments.find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.hidden = true;
    comment.hiddenReason = reason;
    comment.hiddenBy = parseInt(employeeId);
    comment.hiddenAt = new Date().toISOString();
    await saveComments(comments);

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
app.put('/staff/videos/:videoId', async (req, res) => {
  try {
    const { employeeId, title, description, tags, overlays } = req.body;
    
    if (!employeeId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const videos = await loadVideos();
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

    await saveVideos(videos);

    return res.json({ success: true, video });
  } catch (err) {
    console.error('Update video error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Apply user action (warn, ban, shadow ban, delete) - admin only
app.post('/staff/user-action/:userId', async (req, res) => {
  try {
    const { employeeId, action, reason, banType, banDuration } = req.body;
    const userId = req.params.userId;

    console.log(`User action request: userId=${userId}, action=${action}, employeeId=${employeeId}`);

    const staff = readStaff();
    const actor = (staff.employees || []).find((e) => String(e.id) === String(employeeId));
    const isAdmin1000 = parseInt(employeeId) === 1000;
    const canModerateUsers = isAdmin1000 || (
      !!actor && actor.status !== 'blocked' && (
        !!actor.approvalAuthority ||
        !!(actor.permissions && actor.permissions.users)
      )
    );
    if (!canModerateUsers) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (DB_ENABLED) {
      await refreshUserCache();
    }
    let users = readUsers();
    let userIndex = findUserIndexByIdentifier(users, userId);

    if (userIndex === -1 && DB_ENABLED) {
      await refreshUserCache();
      users = readUsers();
      userIndex = findUserIndexByIdentifier(users, userId);
    }

    if (userIndex === -1) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[userIndex];

    // Apply action based on type
    switch (action) {
      case 'warn':
        user.warnings = (user.warnings || 0) + 1;
        user.lastWarning = new Date().toISOString();
        break;
      case 'unwarn':
        user.warnings = Math.max(0, (user.warnings || 0) - 1);
        if (user.warnings === 0) {
          user.lastWarning = null;
        }
        break;
      case 'ban':
        user.status = 'banned';
        user.bannedAt = new Date().toISOString();
        user.bannedReason = reason;
        user.banType = banType || 'permanent';
        if (banType === 'temporary' && banDuration && Number(banDuration.value) > 0) {
          const next = new Date();
          const value = Number(banDuration.value);
          const unit = String(banDuration.unit || 'days').toLowerCase();
          if (unit === 'hours') next.setHours(next.getHours() + value);
          else if (unit === 'weeks') next.setDate(next.getDate() + (value * 7));
          else if (unit === 'months') next.setMonth(next.getMonth() + value);
          else next.setDate(next.getDate() + value);
          user.bannedUntil = next.toISOString();
        } else {
          user.bannedUntil = null;
        }
        break;
      case 'shadowban':
        user.shadowBanned = true;
        user.shadowBannedAt = new Date().toISOString();
        user.shadowBanReason = reason;
        break;
      case 'delete':
        users.splice(userIndex, 1);

        // Also remove support tickets owned by the deleted user.
        {
          const allTickets = await loadSupportTickets();
          const nextTickets = allTickets.filter((t) => {
            const emailMatch = String(t?.userInfo?.email || '').toLowerCase() === String(user.email || '').toLowerCase();
            const idMatch = String(t?.userInfo?.id || '') === String(userId);
            return !(emailMatch || idMatch);
          });
          if (nextTickets.length !== allTickets.length) {
            await saveSupportTickets(nextTickets);
          }
        }
        break;
      default:
        console.log(`Unknown action: ${action}`);
        return res.status(400).json({ error: 'Invalid action type' });
    }

    if (action !== 'delete') {
      users[userIndex] = user;
    }
    writeUsers(users);

    // Log action
    const staffForLog = readStaff();
    if (!staffForLog.userActions) staffForLog.userActions = [];
    staffForLog.userActions.push({
      type: 'user',
      userId: userId,
      action: action,
      reason: reason,
      actionBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });

    if (action === 'delete') {
      if (Array.isArray(staffForLog.reports)) {
        const loweredEmail = String(user.email || '').toLowerCase();
        const loweredName = String(user.name || '').toLowerCase();
        staffForLog.reports = staffForLog.reports.filter((r) => {
          const reportUserId = r?.reporterId || r?.reportedBy;
          const reportedBy = String(r?.reportedBy || '').toLowerCase();
          const matchesId = String(reportUserId || '') === String(userId);
          const matchesEmail = loweredEmail && reportedBy === loweredEmail;
          const matchesName = loweredName && reportedBy === loweredName;
          return !(matchesId || matchesEmail || matchesName);
        });
      }
      if (Array.isArray(staffForLog.notifications)) {
        staffForLog.notifications = staffForLog.notifications.filter((n) => String(n?.userId || '') !== String(userId));
      }
    }
    writeStaff(staffForLog);

    // Create a notification for the user who received the action
    let notifications = await loadNotifications();

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
      case 'unwarn':
        notificationTitle = 'Warning Removed';
        notificationMessage = `A warning has been removed from your account.`;
        notificationIcon = 'check';
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

    if (action !== 'delete') {
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
      await saveNotifications(notifications);
    } else {
      notifications = notifications.filter((n) => {
        const toUserId = n?.to?.id;
        const fromUserId = n?.from?.id;
        return String(toUserId || '') !== String(userId) && String(fromUserId || '') !== String(userId);
      });
      await saveNotifications(notifications);
    }

    console.log(`User action applied: ${action} on user ${userId}`);
    return res.json({ success: true, message: `User ${action} applied`, user });
  } catch (err) {
    console.error('User action error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /staff/undo-user-action/:userId - Undo a user action
app.post('/staff/undo-user-action/:userId', async (req, res) => {
  try {
    const { employeeId, action } = req.body;
    const userId = req.params.userId;

    const staff = readStaff();
    const actor = (staff.employees || []).find((e) => String(e.id) === String(employeeId));
    const canModerateUsers = !!actor && actor.status !== 'blocked' && (
      parseInt(employeeId) === 1000 ||
      !!actor.approvalAuthority ||
      !!(actor.permissions && actor.permissions.users)
    );
    if (!canModerateUsers) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (DB_ENABLED) {
      await refreshUserCache();
    }
    let users = readUsers();
    let userIndex = findUserIndexByIdentifier(users, userId);

    if (userIndex === -1 && DB_ENABLED) {
      await refreshUserCache();
      users = readUsers();
      userIndex = findUserIndexByIdentifier(users, userId);
    }

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
        user.banType = null;
        user.bannedUntil = null;
        break;
      case 'shadowban':
        user.shadowBanned = false;
        user.shadowBannedAt = null;
        user.shadowBanReason = null;
        break;
      case 'delete':
        return res.status(409).json({ error: 'Delete action cannot be undone after hard-delete' });
    }

    users[userIndex] = user;
    writeUsers(users);

    // Log undo action
    const staffForLog = readStaff();
    if (!staffForLog.userActions) staffForLog.userActions = [];
    staffForLog.userActions.push({
      type: 'user_undo',
      userId: userId,
      action: action,
      undoneBy: parseInt(employeeId),
      createdAt: new Date().toISOString()
    });
    writeStaff(staffForLog);

    // Remove the notification for the user
    let notifications = await loadNotifications();

    // Remove notifications for this user action
    notifications = notifications.filter(n => 
      !(n.to && String(n.to.id) === String(userId) && n.action === action && n.type === 'staff_action')
    );

    await saveNotifications(notifications);

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
    upload.array('evidenceFiles', 5)(req, res, async (err) => {
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
        const evidenceFiles = await Promise.all((req.files || []).map(async (file) => {
          const url = await persistUploadedFile(req, file, 'evidence');
          return {
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            path: url,
            uploadedAt: new Date().toISOString()
          };
        }));

        const report = {
          id: `report_${Date.now()}`,
          videoId: videoId,
          title: title || '',
          reason: reason,
          reporterId: reporterId || 'anonymous',
          reporterEmail: reporterEmail || null,
          createdAt: new Date().toISOString(),
          status: 'pending',
          evidenceFiles
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
app.post('/staff/undo-hide-video/:videoId', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const videoId = req.params.videoId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let videos = await loadVideos();
    const video = videos.find(v => v.id === videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    video.hidden = false;
    video.hiddenReason = null;
    video.hiddenBy = null;
    video.hiddenAt = null;
    await saveVideos(videos);

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
app.post('/staff/delete-video/:videoId', async (req, res) => {
  try {
    const { employeeId, reason } = req.body;
    const videoId = req.params.videoId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let videos = await loadVideos();
    const video = videos.find(v => v.id === videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    video.deleted = true;
    video.deletedReason = reason;
    video.deletedBy = parseInt(employeeId);
    video.deletedAt = new Date().toISOString();
    await saveVideos(videos);

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
app.post('/staff/undo-delete-video/:videoId', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const videoId = req.params.videoId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let videos = await loadVideos();
    const video = videos.find(v => v.id === videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    video.deleted = false;
    video.deletedReason = null;
    video.deletedBy = null;
    video.deletedAt = null;
    await saveVideos(videos);

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
app.post('/staff/undo-hide-comment/:commentId', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const commentId = req.params.commentId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let comments = await loadComments();
    const comment = comments.find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.hidden = false;
    comment.hiddenReason = null;
    comment.hiddenBy = null;
    comment.hiddenAt = null;
    await saveComments(comments);

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
app.post('/staff/undo-delete-comment/:commentId', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const commentId = req.params.commentId;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let comments = await loadComments();
    const comment = comments.find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.deleted = false;
    comment.deletedReason = null;
    comment.deletedBy = null;
    comment.deletedAt = null;
    await saveComments(comments);

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
app.get('/staff/user-metrics', async (req, res) => {
  try {
    const { employeeId } = req.query;

    if (parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
    const videos = await loadVideos();

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

const SUPPORT_TICKETS_FILE = path.join(__dirname, 'support_tickets.json');

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

const loadSupportTickets = async () => {
  if (!DB_ENABLED) return readSupportTickets();
  const { rows } = await dbQuery('SELECT payload FROM support_tickets ORDER BY created_at DESC');
  return rows.map(row => row.payload);
};

const saveSupportTickets = async (tickets) => {
  if (!DB_ENABLED) {
    writeSupportTickets(tickets);
    return;
  }
  const client = await dbPool.connect();
  const ids = tickets.map(t => String(t.id));
  try {
    await client.query('BEGIN');
    for (const ticket of tickets) {
      const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
      await client.query(
        `INSERT INTO support_tickets (id, payload, created_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
        [String(ticket.id), ticket, createdAt]
      );
    }
    if (ids.length > 0) {
      await client.query('DELETE FROM support_tickets WHERE id NOT IN (' + ids.map((_, i) => `$${i + 1}`).join(',') + ')', ids);
    } else {
      await client.query('DELETE FROM support_tickets');
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Submit a new support ticket (no auth required - customers can submit without logging in)
app.post('/support/ticket', upload.array('file_', 5), async (req, res) => {
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
    const tickets = await loadSupportTickets();
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
    const attachments = await Promise.all((req.files || []).map(async (f) => {
      const url = await persistUploadedFile(req, f, 'support');
      return {
        filename: f.filename,
        originalName: f.originalname,
        size: f.size,
        path: url
      };
    }));

    const ticket = {
      id: uniqueId,
      userId: userInfo.id,
      userName: user?.username || 'Unknown User',
      userEmail: userInfo.email,
      title: title.trim(),
      description: description.trim(),
      status: 'open', // open, in-progress, resolved, closed
      priority: 'normal',
      attachments,
      responses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to file
    const allTickets = await loadSupportTickets();
    allTickets.push(ticket);
    await saveSupportTickets(allTickets);

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
app.get('/support/tickets', async (req, res) => {
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

      const tickets = await loadSupportTickets();
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
      const tickets = await loadSupportTickets();
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
app.get('/support/ticket/:id', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const employeeId = req.query.employeeId;
    const tickets = await loadSupportTickets();
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
app.put('/support/ticket/:id/status', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { status, priority, employeeId } = req.body;

    // Check if user is staff
    if (!employeeId || !isUserStaff(employeeId)) {
      return res.status(403).json({ error: 'Unauthorized - staff access required' });
    }

    const tickets = await loadSupportTickets();
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
    await saveSupportTickets(tickets);

    return res.json({ success: true, ticket });
  } catch (err) {
    console.error('Error updating ticket status:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add response to ticket (staff only)
app.post('/support/ticket/:id/response', async (req, res) => {
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

    const tickets = await loadSupportTickets();
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

    await saveSupportTickets(tickets);

    // Create notification for customer
    try {
      const notifFile = path.join(__dirname, 'notifications.json');
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
app.post('/support/ticket/:id/customer-response', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { message, userEmail } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const tickets = await loadSupportTickets();
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

    await saveSupportTickets(tickets);

    console.log(`Customer response added to ticket ${ticketId}`);

    return res.json({ success: true, response: customerResponse, ticket });
  } catch (err) {
    console.error('Error adding customer response:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Close ticket (staff only)
app.post('/support/ticket/:id/close', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { resolution, employeeId } = req.body;

    // Check if user is staff
    if (!employeeId || !isUserStaff(employeeId)) {
      return res.status(403).json({ error: 'Unauthorized - staff access required' });
    }

    const tickets = await loadSupportTickets();
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

    await saveSupportTickets(tickets);

    return res.json({ success: true, ticket });
  } catch (err) {
    console.error('Error closing ticket:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete ticket (staff only)
app.delete('/support/ticket/:id', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const employeeId = req.query.employeeId;

    // Check if user is staff
    if (!employeeId || !isUserStaff(employeeId)) {
      return res.status(403).json({ error: 'Unauthorized - staff access required' });
    }

    const tickets = await loadSupportTickets();
    const ticketIdx = tickets.findIndex(t => t.id === ticketId || t.id === parseInt(ticketId));

    if (ticketIdx === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Remove ticket
    const deletedTicket = tickets.splice(ticketIdx, 1)[0];
    await saveSupportTickets(tickets);

    console.log(`Support ticket ${ticketId} deleted by employee ${employeeId}`);

    return res.json({ success: true, message: 'Ticket deleted', ticketId: deletedTicket.id });
  } catch (err) {
    console.error('Error deleting ticket:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Helper to read onboarding data
const readOnboardingData = async () => {
  try {
    if (DB_ENABLED) {
      const { rows } = await dbQuery('SELECT payload FROM onboarding_info ORDER BY updated_at DESC');
      return rows.map(r => r.payload);
    }
    if (!fs.existsSync(ONBOARDING_FILE)) return [];
    return JSON.parse(fs.readFileSync(ONBOARDING_FILE, 'utf8'));
  } catch (err) {
    console.error('Error reading onboarding data:', err);
    return [];
  }
};

// Helper to write onboarding data
const writeOnboardingData = async (data) => {
  try {
    if (DB_ENABLED) {
      const client = await dbPool.connect();
      const ids = data.map(d => String(d.id));
      try {
        await client.query('BEGIN');
        for (const record of data) {
          await client.query(
            `INSERT INTO onboarding_info (id, user_id, payload, updated_at)
             VALUES ($1, $2, $3, now())
             ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()`,
            [String(record.id), String(record.userId), record]
          );
        }
        if (ids.length > 0) {
          await client.query('DELETE FROM onboarding_info WHERE id NOT IN (' + ids.map((_, i) => `$${i + 1}`).join(',') + ')', ids);
        } else {
          await client.query('DELETE FROM onboarding_info');
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      return;
    }
    fs.writeFileSync(ONBOARDING_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing onboarding data:', err);
  }
};

// POST: Save creator onboarding info
app.post('/staff/onboarding-info', async (req, res) => {
  try {
    const { userId, userName, userEmail, creatorName, bio, introVideoUrl, socialMediaHandle, socialFollowers, completedAt, agreedTOS, agreedPrivacy } = req.body;

    if (!userId || !creatorName || !userEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const onboardingData = await readOnboardingData();
    
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

    await writeOnboardingData(onboardingData);
    console.log(`Onboarding info saved for user ${userId} (${creatorName})`);

    return res.json({ success: true, message: 'Onboarding info saved', record: newRecord });
  } catch (err) {
    console.error('Error saving onboarding info:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET: Retrieve all creator onboarding info (staff only)
app.get('/staff/onboarding-info', async (req, res) => {
  try {
    const { employeeId } = req.query;

    if (!employeeId || parseInt(employeeId) !== 1000) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const onboardingData = await readOnboardingData();
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

