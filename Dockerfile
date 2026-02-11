FROM node:24-alpine

WORKDIR /app

# Install backend dependencies only
COPY Regaarder-Project-main/Regaarder-4.0-main/backend/package.json Regaarder-Project-main/Regaarder-4.0-main/backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source (including seed JSON data + uploads for first-run seeding)
COPY Regaarder-Project-main/Regaarder-4.0-main/backend ./backend

WORKDIR /app/backend
ENV NODE_ENV=production

# Railway injects PORT dynamically; fallback to 8080 locally
ENV PORT=${PORT:-8080}
EXPOSE ${PORT}

# DATA_DIR points to the persistent volume mount.
# On Railway you add a volume mounted at /data and set DATA_DIR=/data.
ENV DATA_DIR=/data

# Entrypoint seeds the volume on first deploy, then starts server
RUN chmod +x entrypoint.sh
CMD ["sh", "entrypoint.sh"]
