/* eslint-env node */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL. Set it in backend/.env before running this script.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const readJson = (filePath, fallback) => {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || JSON.stringify(fallback));
  } catch (err) {
    console.warn(`Failed to read ${filePath}:`, err.message);
    return fallback;
  }
};

const toDate = (value) => {
  try {
    return value ? new Date(value) : new Date();
  } catch {
    return new Date();
  }
};

const upsertVideos = async (videos) => {
  if (!videos.length) return 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const video of videos) {
      if (!video || !video.id) continue;
      await client.query(
        `INSERT INTO videos (id, payload, created_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
        [String(video.id), video, toDate(video.createdAt || video.timestamp)]
      );
    }
    await client.query('COMMIT');
    return videos.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const upsertComments = async (comments) => {
  if (!comments.length) return 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const comment of comments) {
      if (!comment || !comment.id) continue;
      await client.query(
        `INSERT INTO request_comments (id, request_id, payload, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET request_id = EXCLUDED.request_id, payload = EXCLUDED.payload`,
        [String(comment.id), comment.requestId || null, comment, toDate(comment.createdAt)]
      );
    }
    await client.query('COMMIT');
    return comments.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const upsertWatchHistory = async (history) => {
  if (!history.length) return 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const entry of history) {
      if (!entry || !entry.videoId) continue;
      const userId = entry.userId || 'anonymous';
      await client.query(
        `INSERT INTO watch_history (video_id, user_id, payload, updated_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (video_id, user_id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`,
        [String(entry.videoId), String(userId), entry, toDate(entry.timestamp)]
      );
    }
    await client.query('COMMIT');
    return history.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const upsertSponsors = async (sponsors) => {
  if (!sponsors.length) return 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const sponsor of sponsors) {
      if (!sponsor || !sponsor.id) continue;
      await client.query(
        `INSERT INTO sponsors (id, owner_id, payload, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET owner_id = EXCLUDED.owner_id, payload = EXCLUDED.payload`,
        [String(sponsor.id), sponsor.ownerId || null, sponsor, toDate(sponsor.createdAt)]
      );
    }
    await client.query('COMMIT');
    return sponsors.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const upsertSupportTickets = async (tickets) => {
  if (!tickets.length) return 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const ticket of tickets) {
      if (!ticket || !ticket.id) continue;
      await client.query(
        `INSERT INTO support_tickets (id, payload, created_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
        [String(ticket.id), ticket, toDate(ticket.createdAt)]
      );
    }
    await client.query('COMMIT');
    return tickets.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const upsertNotifications = async (notifications) => {
  if (!notifications.length) return 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const notif of notifications) {
      if (!notif || !notif.id) continue;
      const createdAt = toDate(notif.createdAt);
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
    await client.query('COMMIT');
    return notifications.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const toReactionRows = (reactions) => {
  const rows = new Map();
  const likes = reactions?.likes || {};
  const dislikes = reactions?.dislikes || {};

  Object.keys(likes).forEach((targetId) => {
    const users = likes[targetId] || {};
    Object.keys(users).forEach((userId) => {
      const key = `${targetId}::${userId}`;
      const row = rows.get(key) || { targetId, userId, liked: false, disliked: false };
      row.liked = true;
      rows.set(key, row);
    });
  });

  Object.keys(dislikes).forEach((targetId) => {
    const users = dislikes[targetId] || {};
    Object.keys(users).forEach((userId) => {
      const key = `${targetId}::${userId}`;
      const row = rows.get(key) || { targetId, userId, liked: false, disliked: false };
      row.disliked = true;
      rows.set(key, row);
    });
  });

  return Array.from(rows.values());
};

const upsertVideoReactions = async (rows) => {
  if (!rows.length) return 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const row of rows) {
      await client.query(
        `INSERT INTO video_reactions (video_id, user_id, is_liked, is_disliked, updated_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (video_id, user_id)
         DO UPDATE SET is_liked = EXCLUDED.is_liked, is_disliked = EXCLUDED.is_disliked, updated_at = now()`,
        [String(row.targetId), String(row.userId), Boolean(row.liked), Boolean(row.disliked)]
      );
    }
    await client.query('COMMIT');
    return rows.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const upsertCommentReactions = async (rows) => {
  if (!rows.length) return 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const row of rows) {
      await client.query(
        `INSERT INTO comment_reactions (comment_id, user_id, is_liked, is_disliked, updated_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (comment_id, user_id)
         DO UPDATE SET is_liked = EXCLUDED.is_liked, is_disliked = EXCLUDED.is_disliked, updated_at = now()`,
        [String(row.targetId), String(row.userId), Boolean(row.liked), Boolean(row.disliked)]
      );
    }
    await client.query('COMMIT');
    return rows.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const run = async () => {
  const base = __dirname;
  const videos = readJson(path.join(base, 'videos.json'), []);
  const comments = readJson(path.join(base, 'comments.json'), []);
  const history = readJson(path.join(base, 'watchhistory.json'), []);
  const sponsors = readJson(path.join(base, 'sponsors.json'), []);
  const tickets = readJson(path.join(base, 'support_tickets.json'), []);
  const notifications = readJson(path.join(base, 'suggestions.json'), []);
  const videoReactionsRaw = readJson(path.join(base, 'video_reactions.json'), { likes: {}, dislikes: {} });
  const commentReactionsRaw = readJson(path.join(base, 'comment_reactions.json'), { likes: {}, dislikes: {} });

  const results = {};
  results.videos = await upsertVideos(videos);
  results.comments = await upsertComments(comments);
  results.watchHistory = await upsertWatchHistory(history);
  results.sponsors = await upsertSponsors(sponsors);
  results.supportTickets = await upsertSupportTickets(tickets);
  results.notifications = await upsertNotifications(notifications);
  results.videoReactions = await upsertVideoReactions(toReactionRows(videoReactionsRaw));
  results.commentReactions = await upsertCommentReactions(toReactionRows(commentReactionsRaw));

  console.log('Migration complete:', results);
  await pool.end();
};

run().catch((err) => {
  console.error('Migration failed:', err);
  pool.end().catch(() => {});
  process.exit(1);
});
