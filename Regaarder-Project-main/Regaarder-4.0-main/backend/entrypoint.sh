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
exec node server.js
