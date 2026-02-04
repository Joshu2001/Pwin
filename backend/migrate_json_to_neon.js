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

const upsertRequests = async (requests) => {
  if (!requests.length) return 0;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const req of requests) {
      if (!req || !req.id) continue;
      const createdAt = toDate(req.createdAt);
      const updatedAt = req.updatedAt ? toDate(req.updatedAt) : null;
      const creator = req.creator || {};
      const claimedBy = req.claimedBy || null;
      const claimedById = claimedBy && typeof claimedBy === 'object' ? claimedBy.id : claimedBy;

      await client.query(
        `INSERT INTO requests (
          id, title, description, likes, comments, boosts, amount, funding,
          is_trending, is_sponsored, company, company_initial, company_color,
          image_url, creator_id, creator_name, creator_email, created_by,
          created_at, updated_at, current_step, claimed, claimed_by, claimed_at, meta
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          likes = EXCLUDED.likes,
          comments = EXCLUDED.comments,
          boosts = EXCLUDED.boosts,
          amount = EXCLUDED.amount,
          funding = EXCLUDED.funding,
          is_trending = EXCLUDED.is_trending,
          is_sponsored = EXCLUDED.is_sponsored,
          company = EXCLUDED.company,
          company_initial = EXCLUDED.company_initial,
          company_color = EXCLUDED.company_color,
          image_url = EXCLUDED.image_url,
          creator_id = EXCLUDED.creator_id,
          creator_name = EXCLUDED.creator_name,
          creator_email = EXCLUDED.creator_email,
          created_by = EXCLUDED.created_by,
          created_at = EXCLUDED.created_at,
          updated_at = EXCLUDED.updated_at,
          current_step = EXCLUDED.current_step,
          claimed = EXCLUDED.claimed,
          claimed_by = EXCLUDED.claimed_by,
          claimed_at = EXCLUDED.claimed_at,
          meta = EXCLUDED.meta`,
        [
          String(req.id),
          req.title || '',
          req.description || '',
          Number(req.likes || 0),
          Number(req.comments || 0),
          Number(req.boosts || 0),
          Number(req.amount || 0),
          Number(req.funding || req.amount || 0),
          Boolean(req.isTrending || req.is_trending),
          Boolean(req.isSponsored || req.is_sponsored),
          req.company || creator.name || 'Community',
          req.companyInitial || (creator.name ? String(creator.name)[0] : 'C'),
          req.companyColor || 'bg-gray-400',
          req.imageUrl || req.image_url || '',
          req.creatorId || creator.id || null,
          creator.name || req.creatorName || null,
          creator.email || req.creatorEmail || null,
          req.createdBy || creator.id || null,
          createdAt,
          updatedAt,
          req.currentStep || null,
          Boolean(req.claimed),
          claimedById || null,
          req.claimedAt ? toDate(req.claimedAt) : null,
          req.meta || null
        ]
      );
    }
    await client.query('COMMIT');
    return requests.length;
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
  const requests = readJson(path.join(base, 'requests.json'), []);
  const history = readJson(path.join(base, 'watchhistory.json'), []);
  const sponsors = readJson(path.join(base, 'sponsors.json'), []);
  const tickets = readJson(path.join(base, 'support_tickets.json'), []);
  const notifications = readJson(path.join(base, 'suggestions.json'), []);
  const videoReactionsRaw = readJson(path.join(base, 'video_reactions.json'), { likes: {}, dislikes: {} });
  const commentReactionsRaw = readJson(path.join(base, 'comment_reactions.json'), { likes: {}, dislikes: {} });

  const results = {};
  results.videos = await upsertVideos(videos);
  results.comments = await upsertComments(comments);
  results.requests = await upsertRequests(requests);
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
