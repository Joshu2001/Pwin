const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');
const REQUESTS_FILE = path.join(__dirname, 'requests.json');
const BACKUP_FILE = path.join(__dirname, 'requests.json.bak');

function loadJson(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('Failed to parse', file, e.message);
    process.exit(1);
  }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function computeHandle(user) {
  if (!user) return null;
  if (user.handle) return user.handle;
  if (user.name) return '@' + String(user.name).toLowerCase().replace(/\s+/g, '');
  if (user.email) return '@' + String(user.email).split('@')[0].toLowerCase();
  return null;
}

const users = loadJson(USERS_FILE) || [];
const requests = loadJson(REQUESTS_FILE) || [];

if (!users.length) {
  console.warn('No users found in', USERS_FILE);
}
if (!requests.length) {
  console.warn('No requests found in', REQUESTS_FILE);
}

// Build a map from possible handle -> user
const handleMap = new Map();
for (const u of users) {
  const handle = computeHandle(u);
  if (handle) handleMap.set(handle, u);
  // also store lowercase name variant without @
  if (u.name) handleMap.set(String(u.name).toLowerCase(), u);
}

let updated = 0;
let matched = 0;

// Backup original requests file
if (fs.existsSync(REQUESTS_FILE)) {
  fs.copyFileSync(REQUESTS_FILE, BACKUP_FILE);
  console.log('Backup created at', BACKUP_FILE);
}

for (const req of requests) {
  if (!req) continue;
  const company = String(req.company || '').trim();
  if (!company) continue;

  // Try to match with handleMap
  const normalized = company.toLowerCase();
  const user = handleMap.get(normalized) || handleMap.get(company) || handleMap.get(company.replace(/^@/, ''));
  if (user) {
    matched++;
    // Add creator snapshot if missing or incomplete
    if (!req.creator || req.creator.id !== user.id) {
      req.creator = {
        id: user.id || null,
        name: user.name || (user.email ? user.email.split('@')[0] : ''),
        image: user.image || ''
      };
      // If request has no imageUrl but user has image, set imageUrl
      if ((!req.imageUrl || req.imageUrl === '') && user.image) {
        req.imageUrl = user.image;
      }
      updated++;
    }
  }
}

if (updated > 0) {
  saveJson(REQUESTS_FILE, requests);
  console.log(`Updated ${updated} request(s) and matched ${matched} request(s) to users.`);
} else {
  console.log(`No updates needed. Matched ${matched} request(s).`);
}

console.log('Backfill complete.');
