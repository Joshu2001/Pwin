#!/bin/sh
# ── Railway volume seed script ──
# On first deploy the /data volume is empty. Copy the seed data (JSON files +
# uploads) shipped inside the image so the app has its initial dataset.
# On subsequent deploys the volume already contains live data, so we skip.

DATA_DIR="${DATA_DIR:-/data}"
SRC_DIR="/app/backend"

echo "[entrypoint] DATA_DIR=$DATA_DIR  SRC_DIR=$SRC_DIR"

# Create data dir if it doesn't exist
mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/uploads"

# Seed indicator file — only copy data if this is the first time
if [ ! -f "$DATA_DIR/.seeded" ]; then
  echo "[entrypoint] First run detected — seeding volume from image …"

  # Copy all JSON data files (but not package*.json or node_modules)
  for f in "$SRC_DIR"/*.json; do
    base=$(basename "$f")
    case "$base" in
      package.json|package-lock.json) continue ;;
    esac
    cp -v "$f" "$DATA_DIR/$base"
  done

  # Copy uploads if they exist in the image
  if [ -d "$SRC_DIR/uploads" ] && [ "$(ls -A "$SRC_DIR/uploads" 2>/dev/null)" ]; then
    cp -rv "$SRC_DIR/uploads/"* "$DATA_DIR/uploads/"
  fi

  # Mark as seeded
  date > "$DATA_DIR/.seeded"
  echo "[entrypoint] Volume seeded successfully."
else
  echo "[entrypoint] Volume already seeded ($(cat "$DATA_DIR/.seeded")). Skipping."
fi

echo "[entrypoint] Starting server …"

# ── One-time storage cleanup: delete upload files first (volume may be full), then trim JSON ──
CLEANUP_MARKER="$DATA_DIR/.cleaned-orphans"
if [ ! -f "$CLEANUP_MARKER" ]; then
  echo "[entrypoint] Running storage cleanup (volume may be near-full) …"
  UPLOADS="$DATA_DIR/uploads"
  VFILE="$DATA_DIR/videos.json"

  # Step 1: Determine which upload filenames to KEEP (from the 2 kept videos)
  # Do this read-only first — no writes yet
  KEEP_FILES=""
  if [ -f "$VFILE" ]; then
    KEEP_FILES=$(node -e "
      const fs = require('fs');
      const keep = new Set(['1768835100749-34tq5nn1u', '1767691092183-r9lm9nfgo']);
      try {
        const videos = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
        const kept = videos.filter(v => keep.has(String(v.id)));
        const data = JSON.stringify(kept);
        const matches = data.match(/\/uploads\/[^\"]+/g) || [];
        const names = [...new Set(matches.map(m => m.replace(/.*\/uploads\//, '')))];
        names.forEach(n => console.log(n));
      } catch(e) { console.error('[cleanup] Error reading videos:', e.message); }
    " "$VFILE")
  fi

  # Step 2: DELETE upload files not referenced by kept videos (frees disk space FIRST)
  if [ -d "$UPLOADS" ]; then
    DELETED_COUNT=0
    FREED_KB=0
    for f in "$UPLOADS"/*; do
      [ -f "$f" ] || continue
      BASENAME=$(basename "$f")
      if echo "$KEEP_FILES" | grep -qxF "$BASENAME"; then
        echo "[cleanup] KEEP: $BASENAME"
      else
        SIZE_KB=$(du -k "$f" | cut -f1)
        rm -f "$f"
        FREED_KB=$((FREED_KB + SIZE_KB))
        DELETED_COUNT=$((DELETED_COUNT + 1))
        echo "[cleanup] DELETED: $BASENAME (${SIZE_KB}KB)"
      fi
    done
    echo "[cleanup] Deleted $DELETED_COUNT files, freed ~${FREED_KB}KB"
  fi

  # Step 3: NOW that disk space is freed, trim videos.json to only kept IDs
  if [ -f "$VFILE" ]; then
    echo "[cleanup] Trimming videos.json …"
    node -e "
      const fs = require('fs');
      const keep = new Set(['1768835100749-34tq5nn1u', '1767691092183-r9lm9nfgo']);
      try {
        const videos = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
        const kept = videos.filter(v => keep.has(String(v.id)));
        fs.writeFileSync(process.argv[1], JSON.stringify(kept, null, 2));
        console.log('[cleanup] Kept ' + kept.length + ' of ' + videos.length + ' videos');
      } catch(e) { console.error('[cleanup] Error trimming videos:', e.message); }
    " "$VFILE"
  fi

  # Mark cleanup done (now safe to write, disk has space)
  date > "$CLEANUP_MARKER"
  echo "[entrypoint] Storage cleanup complete."
else
  echo "[entrypoint] Cleanup already done."
fi

exec node server.js
