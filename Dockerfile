# ==============================================================================
# Production Dockerfile for E-Document Management (Lao Enterprise)
# ==============================================================================

FROM node:20-slim AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package manifests
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies (including devDependencies required for build)
RUN npm ci

# Copy source code and Prisma schema
COPY . .

# Generate Prisma Client with Linux and Debian binary targets
RUN npx prisma generate --schema=server/prisma/schema.prisma

# Build Client and Server
RUN npm run build

# ==============================================================================
# Runner Stage
# ==============================================================================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_URL="file:/app/server/prisma/dev.db"
ENV JWT_SECRET="edoc_super_secret_jwt_key_lao_pdr_2026_secure"
ENV UPLOAD_DIR="/app/server/uploads"

# Install openssl for Prisma runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy dependencies and build artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/client/package*.json ./client/
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma

# Create uploads storage folder
RUN mkdir -p /app/server/uploads /app/uploads

EXPOSE 5000

# Push database schema, seed initial data if empty, and start server
CMD ["sh", "-c", "npx prisma db push --schema=server/prisma/schema.prisma --accept-data-loss && node server/dist/database/seed.js && node server/dist/server.js"]

