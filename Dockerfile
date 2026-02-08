FROM node:24-alpine

WORKDIR /app

# Install backend dependencies only
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY backend ./backend

WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=8080

# Runtime sets PORT automatically
EXPOSE 8080

CMD ["node", "server.js"]
