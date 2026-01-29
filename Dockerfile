# syntax=docker/dockerfile:1
# Build stage for frontend
FROM --platform=$BUILDPLATFORM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Install dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy server
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server source
COPY server/src ./src

# Copy built frontend
COPY --from=frontend-build /app/dist ../dist

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/data/sevr.db

EXPOSE 3001

# Run the server
CMD ["node", "src/index.js"]
