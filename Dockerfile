# ─────────────────────────────────────────────
# Stage 1: Build the React Frontend
# ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Install dependencies first (layer cache)
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Production Backend Server
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend into backend's static serving path
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Generate Prisma Client for production
RUN cd backend && npx prisma generate

# Expose the backend port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Start the server
CMD ["node", "backend/server.js"]
