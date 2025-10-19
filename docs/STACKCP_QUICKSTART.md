# NaviDocs on StackCP: Quick Start Guide

## Prerequisites

- StackCP shared hosting account with SSH access
- Redis Cloud free account (5 min setup)
- Google Cloud account with Vision API enabled (5 min setup)

## 1. One-Time Setup (10 minutes)

### SSH Access
```bash
# From your local machine
ssh your-username@ssh-node-gb.lhr.stackcp.net

# Load helpers
source ~/stackcp-setup.sh
```

### Redis Cloud (Free Tier)
```bash
# 1. Sign up: https://redis.com/try-free/
# 2. Create database (30MB free)
# 3. Save connection details:
REDIS_HOST=redis-xxxxx.c1.region.ec2.redis.cloud
REDIS_PORT=xxxxx
REDIS_PASSWORD=your-password
```

### Google Cloud Vision API
```bash
# 1. Go to: https://console.cloud.google.com
# 2. Create project → Enable Vision API
# 3. Create service account → Download JSON credentials
# 4. Upload credentials:
scp google-credentials.json stackcp:~/navidocs/google-credentials.json
```

## 2. Deploy NaviDocs (15 minutes)

```bash
# SSH into StackCP
ssh stackcp
source ~/stackcp-setup.sh

# Create directories
mkdir -p ~/navidocs/{uploads,db,logs}
mkdir -p /tmp/navidocs

# Clone repository (replace with your repo URL)
cd /tmp/navidocs
git clone https://github.com/yourusername/navidocs.git .

# Install dependencies (takes ~2 minutes)
cd server
/tmp/npm install --production

cd ../client
/tmp/npm install

# Configure environment
cat > /tmp/navidocs/server/.env << 'EOF'
NODE_ENV=production
PORT=3001

# Database
DATABASE_PATH=/home/sites/7a/c/cb8112d0d1/navidocs/db/navidocs.db

# Redis Cloud
REDIS_HOST=redis-xxxxx.redis.cloud
REDIS_PORT=xxxxx
REDIS_PASSWORD=your-password

# Meilisearch (already running locally!)
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_MASTER_KEY=find-existing-key
MEILISEARCH_INDEX_NAME=navidocs-pages

# OCR - Google Cloud Vision API
PREFERRED_OCR_ENGINE=google-vision
GOOGLE_APPLICATION_CREDENTIALS=/home/sites/7a/c/cb8112d0d1/navidocs/google-credentials.json

# File Upload
MAX_FILE_SIZE=50000000
UPLOAD_DIR=/home/sites/7a/c/cb8112d0d1/navidocs/uploads

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
EOF

# Initialize database
cd /tmp/navidocs/server
/tmp/node db/init.js

# Build frontend
cd /tmp/navidocs/client
/tmp/npm run build

# Copy to web root
cp -r dist/* ~/public_html/
```

## 3. Start Services (2 minutes)

### Option A: Quick Start (Testing)
```bash
source ~/stackcp-setup.sh
navidocs-start
navidocs-status
```

### Option B: Production (StackCP Manager)
```
1. Log into StackCP control panel
2. Go to: Advanced → Node.js Applications
3. Add Application:
   - Name: NaviDocs
   - Path: /tmp/navidocs/server
   - Startup: index.js
   - Node: 20.x
   - Port: 3001
4. Click "Start"
5. Configure reverse proxy:
   - Domain: yoursite.com
   - Target: http://127.0.0.1:3001
   - SSL: Enable (Let's Encrypt)
```

## 4. Test Upload (2 minutes)

```bash
# Create test user
curl -X POST http://127.0.0.1:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@navidocs.com",
    "password": "Test123!",
    "name": "Test User"
  }'

# Login
TOKEN=$(curl -X POST http://127.0.0.1:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@navidocs.com",
    "password": "Test123!"
  }' | jq -r '.token')

# Upload PDF
curl -X POST http://127.0.0.1:3001/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf" \
  -F "title=Test Manual" \
  -F "category=manuals"
```

## 5. Access Application

### Frontend
```
https://yoursite.com
```

### API
```
https://yoursite.com/api/health
```

## Management Commands

```bash
# Source helpers first
source ~/stackcp-setup.sh

# Start services
navidocs-start

# Stop services
navidocs-stop

# Check status
navidocs-status

# View logs
tail -f ~/navidocs/logs/server.log
tail -f ~/navidocs/logs/worker.log

# Restart after code changes
navidocs-stop
cd /tmp/navidocs
git pull
cd server && /tmp/npm install
cd ../client && /tmp/npm run build && cp -r dist/* ~/public_html/
navidocs-start
```

## Troubleshooting

### npm Permission Denied
```bash
# ❌ Don't do this:
~/bin/npm install

# ✅ Do this instead:
/tmp/npm install
```

### Native Module Build Fails
```bash
# Ensure you're in /tmp, not home directory:
cd /tmp/navidocs/server
/tmp/npm install better-sqlite3
```

### Services Won't Start
```bash
# Check logs
tail -100 ~/navidocs/logs/server.log

# Check ports
netstat -tln | grep -E "3001|7700|6379"

# Kill stuck processes
pkill -f "node index.js"
pkill -f "node workers/ocr-worker.js"
```

### Meilisearch Auth Error
```bash
# Find the master key from running process
ps aux | grep meilisearch

# Or restart Meilisearch with known key
pkill meilisearch
cd /tmp
./meilisearch --master-key="your-key-here" \
  --db-path=~/.meilisearch_data \
  --http-addr=127.0.0.1:7700 \
  --env=production > ~/navidocs/logs/meilisearch.log 2>&1 &
```

## Performance Tips

### 1. Use Cloud Services
- Redis Cloud (free 30MB) instead of local
- Google Vision (free 1K pages/month) instead of Tesseract
- Meilisearch Cloud if local instance is slow

### 2. Monitor Resource Usage
```bash
# Check disk space
df -h ~

# Check memory
free -h

# Check processes
ps aux | grep $(whoami)
```

### 3. Optimize Database
```bash
# Regular SQLite maintenance
cd /tmp/navidocs/server
/tmp/node -e "const db = require('better-sqlite3')('~/navidocs/db/navidocs.db'); db.pragma('optimize'); db.close();"
```

## Cost Summary

| Service | Cost | What You Get |
|---------|------|--------------|
| StackCP Hosting | $X/month | Everything (already paying) |
| Redis Cloud | $0 | 30MB free tier |
| Google Vision API | $0 | 1,000 pages/month free |
| **Total** | **$X/month** | Full NaviDocs deployment |

After free tier:
- Redis: $0.20/GB/month ($6/month for 30GB)
- Vision API: $1.50 per 1,000 pages

## Support

- **StackCP**: support@20i.com
- **NaviDocs**: Check GitHub issues
- **This Guide**: /home/setup/navidocs/docs/STACKCP_QUICKSTART.md

## Next Steps

1. **Configure Backups**: `~/navidocs/db/navidocs.db`
2. **Setup Monitoring**: Use StackCP's built-in monitoring
3. **Configure Domain**: Point your domain to StackCP
4. **SSL Certificate**: Enable Let's Encrypt in StackCP
5. **Test OCR**: Upload handwritten documents to verify Google Vision

---

**Deployment Time**: ~30 minutes total
**Difficulty**: 3/10 (straightforward with this guide)
**Performance**: Good for small-medium workloads
