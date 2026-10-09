# ==============================================================================
# Production Dockerfile for E-Document Management (Lao Enterprise)
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npm run db:generate --workspace=server

# Build Frontend and Backend
RUN npm run build

# ==============================================================================
# Runner Stage
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Required by Prisma on Alpine Linux
RUN apk add --no-cache openssl

# Copy package manifests
COPY package*.json ./
COPY server/package*.json ./server/

# Install production dependencies only
RUN npm ci --omit=dev --workspace=server

# Copy compiled bundles and assets
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/server/node_modules/@prisma ./server/node_modules/@prisma
COPY --from=builder /app/server/node_modules/.prisma ./server/node_modules/.prisma

# Create uploads storage folder
RUN mkdir -p /app/server/uploads /app/uploads

EXPOSE 5000

CMD ["node", "server/dist/server.js"]
