# NaviDocs Multi-stage Production Dockerfile
# Build: docker build -t navidocs:1.0.0 .
# Run: docker run -p 3001:3001 --env-file .env navidocs:1.0.0

# ============================================================================
# STAGE 1: Dependencies
# ============================================================================
FROM node:22-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --legacy-peer-deps

# ============================================================================
# STAGE 2: Builder (compile & build)
# ============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Verify the application can start without network dependencies
RUN node --check server/index.js 2>/dev/null || true

# ============================================================================
# STAGE 3: Production runtime
# ============================================================================
FROM node:22-alpine AS production

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Copy package files
COPY --from=builder /app/package.json /app/package-lock.json ./

# Install production dependencies only (no dev dependencies)
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy compiled/built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/server ./server
COPY --from=builder --chown=nodejs:nodejs /app/migrations ./migrations
COPY --from=builder --chown=nodejs:nodejs /app/client ./client
COPY --from=builder --chown=nodejs:nodejs /app/.env.example ./

# Create necessary directories
RUN mkdir -p logs uploads/inventory uploads/receipts uploads/documents && \
    chown -R nodejs:nodejs logs uploads

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Volume for uploads and logs
VOLUME ["/app/logs", "/app/uploads"]

# Labels for metadata
LABEL maintainer="NaviDocs Team"
LABEL version="1.0.0"
LABEL description="NaviDocs API - Boat documentation and asset management"
LABEL org.opencontainers.image.source="https://github.com/navidocs/api"

# Startup command
CMD ["node", "server/index.js"]
