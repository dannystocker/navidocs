# NaviDocs Backend - Multi-stage Docker build
# Stage 1: Builder
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install system dependencies including wkhtmltopdf and tesseract-ocr
RUN apk add --no-cache \
    sqlite3 \
    wkhtmltopdf \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY server ./

# Create upload directory
RUN mkdir -p ./uploads ./db

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "index.js"]
