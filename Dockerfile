FROM node:24-alpine

WORKDIR /app

# Install backend dependencies only
COPY Regaarder-Project-main/Regaarder-4.0-main/backend/package.json Regaarder-Project-main/Regaarder-4.0-main/backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY Regaarder-Project-main/Regaarder-4.0-main/backend ./backend

WORKDIR /app/backend
ENV NODE_ENV=production

# Railway injects PORT dynamically; fallback to 8080 locally
ENV PORT=${PORT:-8080}
EXPOSE ${PORT}

CMD ["node", "server.js"]
