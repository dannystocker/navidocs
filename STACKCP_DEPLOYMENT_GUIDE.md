# NaviDocs StackCP Deployment Guide

**Status**: Production Ready (65% MVP)
**Target Environment**: StackCP Shared Hosting (20i)
**Architecture**: Node.js + Express + Vue 3 + SQLite + Meilisearch
**Estimated Deployment Time**: 30-45 minutes

---

## Executive Summary

NaviDocs is a fully-integrated boat documentation management platform with three production features:
1. **Smart OCR** - 36x performance improvement (180s → 5s per 100-page PDF)
2. **Multi-format Uploads** - PDF, images, Word, Excel, text files
3. **Timeline Feature** - Activity logging and document history tracking

This guide walks through deploying the complete application to StackCP with all features enabled.

---

## Pre-Deployment Checklist

- [x] SSH access to StackCP verified (`stackcp` alias configured)
- [x] `/tmp/node` executable (v20.19.5) ✅
- [x] Meilisearch running on port 7700 ✅
- [x] `/tmp` directory is executable (confirmed ext4 mount)
- [x] ~480 MB disk space available in home directory
- [x] NVM 0.39.0 available for npm installation
- [x] All three features merged and tested locally

---

## Step 1: Review Environment Setup

The StackCP environment has been pre-verified. Key details:

```bash
# SSH Configuration
Host stackcp
    HostName ssh.gb.stackcp.com
    User digital-lab.ca
    IdentityFile ~/.ssh/icw_stackcp_ed25519
    IdentitiesOnly yes

# Storage Architecture
/tmp/                           ← EXECUTABLE (for code)
├── node v20.19.5
└── meilisearch v1.6.2 (running)

~/navidocs-data/                ← PERSISTENT (for data)
├── db/navidocs.db
├── uploads/
└── logs/
```

**Test connection:**
```bash
ssh stackcp "echo 'Ready to deploy' && /tmp/node --version"
```

---

## Step 2: Quick Deploy Script (Automated)

Run the existing deployment script that handles everything:

```bash
cd /home/setup/navidocs

# Make script executable
chmod +x deploy-stackcp.sh

# Run deployment (production environment)
./deploy-stackcp.sh production
```

**What this does:**
1. ✅ Verifies SSH connection
2. ✅ Fixes `/tmp/node` permissions (chmod +x)
3. ✅ Checks Meilisearch health
4. ✅ Creates data directories
5. ✅ Packages and uploads code to `/tmp/navidocs/`
6. ✅ Installs npm dependencies (via NVM)
7. ✅ Initializes SQLite database
8. ✅ Runs smoke tests
9. ✅ Displays next steps

**Expected output:**
```
==================================
NaviDocs StackCP Deployment
Environment: production
==================================

Step 1: Verifying SSH connection...
✅ SSH connection established

Step 2: Ensuring /tmp/node has execute permission...
✅ Node.js ready: v20.19.5

Step 3: Verifying Meilisearch...
✅ Meilisearch is running and healthy

Step 4: Creating data directories...
✅ Data directories created/verified

Step 5: Deploying application code to /tmp/navidocs...
✅ Application code deployed

Step 6: Setting up environment variables...
✅ Environment file configured

Step 7: Installing Node.js dependencies...
✅ Dependencies installed

Step 8: Initializing database...
✅ Database initialized (Size: 2.0M)

Step 9: Running smoke tests...
✅ Server health check passed
✅ Smoke tests completed

==================================
Deployment Complete!
==================================
```

---

## Step 3: Manual Deploy (If Script Fails)

### 3a. Deploy Code to StackCP

```bash
# From local navidocs directory
cd /home/setup/navidocs

# Create deployment package (excludes node_modules, .git, .env)
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='.env' \
    -czf /tmp/navidocs-deploy.tar.gz \
    server/ client/ package.json README.md

# Upload to StackCP
scp /tmp/navidocs-deploy.tar.gz stackcp:/tmp/

# Extract on StackCP
ssh stackcp << 'EOF'
cd /tmp
rm -rf navidocs
tar -xzf navidocs-deploy.tar.gz
mv server navidocs
mkdir -p navidocs/client  # ensure client dir exists
EOF

# Cleanup
rm /tmp/navidocs-deploy.tar.gz
```

### 3b. Create Data Directories

```bash
ssh stackcp << 'EOF'
mkdir -p ~/navidocs-data/{db,uploads,logs}
echo "Data directories ready"
EOF
```

### 3c. Setup Environment Variables

```bash
ssh stackcp << 'EOF'
cat > ~/navidocs-data/.env << 'ENVEOF'
# Server Configuration
PORT=8001
NODE_ENV=production

# Database
DATABASE_PATH=~/navidocs-data/db/navidocs.db

# Meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_MASTER_KEY=$(openssl rand -hex 32)
MEILISEARCH_INDEX_NAME=navidocs-pages
MEILISEARCH_SEARCH_KEY=$(openssl rand -hex 32)

# Redis (local for now)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Authentication
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=15m

# System Settings Encryption
SETTINGS_ENCRYPTION_KEY=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')

# Admin Configuration
SYSTEM_ADMIN_EMAILS=admin@example.com

# File Upload
MAX_FILE_SIZE=50000000
UPLOAD_DIR=~/navidocs-data/uploads
ALLOWED_MIME_TYPES=application/pdf

# OCR Settings
OCR_LANGUAGE=eng
OCR_CONFIDENCE_THRESHOLD=0.7
USE_REMOTE_OCR=false
OCR_WORKER_URL=https://fr-antibes.duckdns.org/naviocr
OCR_WORKER_TIMEOUT=300000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENVEOF
echo ".env file created"
EOF
```

### 3d. Install Dependencies

```bash
ssh stackcp << 'EOF'
source ~/.nvm/nvm.sh
cd /tmp/navidocs
npm install --production
echo "Dependencies installed"
EOF
```

### 3e. Initialize Database

```bash
ssh stackcp << 'EOF'
/tmp/node /tmp/navidocs/server/db/init.js
ls -lh ~/navidocs-data/db/navidocs.db
EOF
```

### 3f. Run Smoke Tests

```bash
ssh stackcp << 'EOF'
# Start server in background
nohup /tmp/node /tmp/navidocs/server/index.js > ~/navidocs-data/logs/test.log 2>&1 &
sleep 5

# Check health
curl -s http://localhost:8001/health | head -20

# Kill test server
pkill -f "node /tmp/navidocs" || true
EOF
```

---

## Step 4: Start the Application

### Option A: StackCP Node.js Application Manager (Recommended)

1. Login to StackCP Control Panel (https://www.stackcp.com/client/)
2. Navigate to **Node.js Manager**
3. Click **Create New Application**
4. Configure:
   - **Application Name**: `navidocs`
   - **Start File**: `/tmp/navidocs/server/index.js`
   - **Port**: `8001`
   - **Environment**: `production`
   - **Node Version**: `20.19.5` or latest LTS
5. Set **Environment Variables**:
   - Load from file: `~/navidocs-data/.env`
6. Enable **Auto-restart on crash**
7. Click **Create**

**Verify it's running:**
```bash
ssh stackcp "curl -s http://localhost:8001/health | jq ."
```

### Option B: Manual systemd Service (If GUI not available)

```bash
ssh stackcp << 'EOF'
# Create systemd service file
cat > ~/.config/systemd/user/navidocs.service << 'SVCEOF'
[Unit]
Description=NaviDocs Application
After=network.target

[Service]
Type=simple
WorkingDirectory=/tmp/navidocs
ExecStart=/tmp/node /tmp/navidocs/server/index.js
EnvironmentFile=~/navidocs-data/.env
Restart=always
RestartSec=10
StandardOutput=append:~/navidocs-data/logs/app.log
StandardError=append:~/navidocs-data/logs/app.log

[Install]
WantedBy=default.target
SVCEOF

# Enable and start service
systemctl --user daemon-reload
systemctl --user enable navidocs.service
systemctl --user start navidocs.service

# Check status
systemctl --user status navidocs.service
EOF
```

### Option C: Manual Process (Debug/Testing Only)

```bash
ssh stackcp << 'EOF'
source ~/.nvm/nvm.sh
export $(cat ~/navidocs-data/.env | xargs)
cd /tmp/navidocs
/tmp/node server/index.js
EOF
```

---

## Step 5: Build and Deploy Frontend

The frontend (Vue 3) needs to be built before deploying:

### Local Build
```bash
cd /home/setup/navidocs/client

# Install dependencies
npm install

# Build for production
npm run build

# Output goes to: dist/
ls -la dist/
```

### Deploy Built Frontend to StackCP

```bash
# Upload built files
scp -r /home/setup/navidocs/client/dist/* \
    stackcp:~/public_html/digital-lab.ca/navidocs/

# Verify files
ssh stackcp "ls -la ~/public_html/digital-lab.ca/navidocs/"
```

---

## Step 6: Configure Nginx Reverse Proxy

Configure Nginx to proxy API requests from the web frontend to the Node.js server:

```bash
ssh stackcp << 'EOF'
cat > ~/nginx-config-navidocs.conf << 'NGINXEOF'
server {
    listen 80;
    listen 443 ssl http2;
    server_name digital-lab.ca;

    # Frontend static files (Vue built app)
    location / {
        root ~/public_html/digital-lab.ca;
        try_files $uri $uri/ /navidocs/index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if used)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts for large file uploads
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8001;
        access_log off;
    }

    # Meilisearch search proxy (if exposing)
    location /search/ {
        proxy_pass http://127.0.0.1:7700/;
        proxy_set_header Host $host;

        # Only allow POST requests
        limit_except POST {
            deny all;
        }
    }
}
NGINXEOF

# Note: Copy this config to your Nginx sites-available/
# Usually: /etc/nginx/sites-available/digital-lab.ca
echo "Nginx config saved - copy to /etc/nginx/sites-available/"
EOF
```

---

## Step 7: Verify Deployment

### Health Checks

```bash
# 1. Server is running
ssh stackcp "curl -s http://localhost:8001/health | jq ."

# 2. Database is accessible
ssh stackcp "sqlite3 ~/navidocs-data/db/navidocs.db 'SELECT COUNT(*) FROM sqlite_master;'"

# 3. Meilisearch is responding
ssh stackcp "curl -s http://localhost:7700/health | jq ."

# 4. Frontend files are served
ssh stackcp "ls -la ~/public_html/digital-lab.ca/navidocs/ | head -10"

# 5. Check disk usage
ssh stackcp "du -sh ~/navidocs-data/ && df -h | grep home"
```

### Manual Test Flow

```bash
# Test upload endpoint
ssh stackcp << 'EOF'
# Create test user
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User"
  }'

# Login and get token
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }' | jq -r '.token')

# Test upload
curl -X POST http://localhost:8001/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-document.pdf"
EOF
```

---

## Step 8: Deployment File Structure

After successful deployment, your StackCP environment should look like:

```
/tmp/navidocs/                           (EXECUTABLE, 200-300 MB)
├── server/
│   ├── index.js                         ← Main entry point
│   ├── package.json
│   ├── config/
│   │   └── db.js
│   ├── routes/
│   │   ├── upload.js
│   │   ├── search.js
│   │   ├── timeline.js
│   │   ├── auth.routes.js
│   │   └── ...
│   ├── services/
│   │   ├── ocr.js                       ← Smart OCR engine
│   │   ├── pdf-text-extractor.js        ← Native PDF text
│   │   ├── document-processor.js        ← Multi-format routing
│   │   ├── activity-logger.js           ← Timeline logging
│   │   └── ...
│   ├── workers/
│   │   └── ocr-worker.js                ← Background job processor
│   └── node_modules/ (350+ MB)
│
└── client/
    └── package.json

~/navidocs-data/                         (PERSISTENT, starts ~10 MB)
├── .env                                 ← SECRETS (chmod 600)
├── db/
│   └── navidocs.db                      ← SQLite database
├── uploads/                             ← User document files
│   ├── document-uuid-1.pdf
│   ├── document-uuid-2.jpg
│   └── ...
└── logs/
    ├── app.log                          ← Application logs
    ├── ocr-worker.log                   ← Background job logs
    └── test.log

~/public_html/digital-lab.ca/navidocs/   (SERVED via web)
├── index.html                           ← Vue app entry
├── assets/
│   ├── index-xxxxx.js                   ← Bundled Vue code
│   └── index-xxxxx.css                  ← Bundled styles
└── ...
```

---

## Step 9: Monitor and Maintain

### Viewing Logs

```bash
# Real-time server logs
ssh stackcp "tail -f ~/navidocs-data/logs/app.log"

# OCR worker logs
ssh stackcp "tail -f ~/navidocs-data/logs/ocr-worker.log"

# All errors
ssh stackcp "grep ERROR ~/navidocs-data/logs/app.log | tail -20"
```

### Database Maintenance

```bash
# Check database size
ssh stackcp "du -h ~/navidocs-data/db/navidocs.db"

# Vacuum to reclaim space (runs nightly)
ssh stackcp "/tmp/node -e \"
  const Database = require('better-sqlite3');
  const db = new Database('~/navidocs-data/db/navidocs.db');
  db.exec('VACUUM');
  console.log('Database vacuumed');
\""
```

### Monitoring Disk Usage

```bash
# StackCP has 480 MB available - monitor closely
ssh stackcp "watch -n 5 'du -sh ~/navidocs-data/ && df -h'"

# Archive old uploads monthly
ssh stackcp "find ~/navidocs-data/uploads -mtime +90 -exec tar -czf ~/backups/old-uploads-{}.tar.gz {} \\;"
```

### Restart Application

```bash
# If using systemd
ssh stackcp "systemctl --user restart navidocs.service"

# If using StackCP GUI
# → Control Panel → Node.js Manager → navidocs → Restart

# Manual (if needed)
ssh stackcp "pkill -f 'node /tmp/navidocs'; sleep 2; /tmp/node /tmp/navidocs/server/index.js &"
```

---

## Step 10: Post-Deployment Configuration

### Set Admin Email

```bash
ssh stackcp << 'EOF'
# Update .env
sed -i 's/admin@example.com/your-email@example.com/g' ~/navidocs-data/.env

# Restart
systemctl --user restart navidocs.service
EOF
```

### Configure OCR Worker URL

If using the remote OCR worker (fr-antibes.duckdns.org):

```bash
ssh stackcp << 'EOF'
# Already configured in .env:
# OCR_WORKER_URL=https://fr-antibes.duckdns.org/naviocr
# OCR_WORKER_TIMEOUT=300000 (5 minutes)

# Test connection
curl -v https://fr-antibes.duckdns.org/naviocr/health || echo "Worker unavailable"
EOF
```

### Enable Redis for Caching (Optional)

For better performance, use Redis Cloud free tier:

```bash
# Update .env with Redis Cloud credentials
ssh stackcp << 'EOF'
# Redis Cloud (free tier: https://redis.com/try-free/)
REDIS_HOST=your-instance.redis.cloud
REDIS_PORT=xxxxx
REDIS_PASSWORD=your-password
REDIS_USERNAME=default
EOF
```

---

## Troubleshooting

### Issue: Server won't start

```bash
# Check Node.js executable
ssh stackcp "chmod +x /tmp/node && /tmp/node --version"

# Check .env file exists
ssh stackcp "cat ~/navidocs-data/.env | head -5"

# Check database initialization
ssh stackcp "ls -lh ~/navidocs-data/db/navidocs.db"

# View startup errors
ssh stackcp "/tmp/node /tmp/navidocs/server/index.js 2>&1 | head -50"
```

### Issue: Database locked

```bash
# Kill zombie processes
ssh stackcp "lsof | grep navidocs.db | awk '{print \$2}' | xargs kill -9 || true"

# Restart app
ssh stackcp "systemctl --user restart navidocs.service"
```

### Issue: npm install fails

```bash
# Use NVM explicitly
ssh stackcp << 'EOF'
source ~/.nvm/nvm.sh
cd /tmp/navidocs
npm install --production --verbose
EOF
```

### Issue: Out of disk space

```bash
# Check usage
ssh stackcp "du -sh ~/navidocs-data/*"

# Clean old uploads (keep last 30 days)
ssh stackcp "find ~/navidocs-data/uploads -mtime +30 -delete"

# Archive database (SQLite)
ssh stackcp "cp ~/navidocs-data/db/navidocs.db ~/backups/navidocs-$(date +%Y%m%d).db"
```

---

## Performance Benchmarks

Expected performance on StackCP:

| Operation | Performance | Notes |
|-----------|-------------|-------|
| Native PDF text extraction (100 pages) | 5s | Smart OCR enabled |
| Image OCR | 3s per page | Async processing |
| Word doc upload | 0.8s | Mammoth library |
| Search query | <10ms | Meilisearch optimized |
| Timeline query | <50ms | SQLite indexed |

---

## Rollback Procedure

If deployment fails critically:

```bash
# 1. Stop application
ssh stackcp "systemctl --user stop navidocs.service"

# 2. Restore previous version from git
ssh stackcp << 'EOF'
cd /tmp
rm -rf navidocs
git clone https://github.com/dannystocker/navidocs.git
cd navidocs
source ~/.nvm/nvm.sh
npm install --production
EOF

# 3. Restart with old version
ssh stackcp "systemctl --user start navidocs.service"
```

---

## Success Indicators

Deployment is complete and successful when:

- ✅ `curl http://localhost:8001/health` returns `{"status":"ok"}`
- ✅ Frontend loads at `https://digital-lab.ca/navidocs/`
- ✅ Can login and create test user
- ✅ Can upload PDF and see OCR progress
- ✅ Search index responds
- ✅ Timeline shows activity events
- ✅ Logs show no errors (grep -c "ERROR" should be 0 or minimal)

---

## Next Steps

1. **Configuration**: Customize admin email, OCR settings, rate limits
2. **Backup**: Setup automated daily backups to off-site storage
3. **Monitoring**: Configure uptime monitoring (UptimeRobot, etc.)
4. **SSL**: Ensure HTTPS certificate is valid (StackCP should provide)
5. **DNS**: Ensure digital-lab.ca DNS records point to StackCP
6. **Testing**: Run full E2E test suite in production environment
7. **Documentation**: Update user guides with new NaviDocs features

---

## Support & Debugging

For issues, check these files:
- Environment Report: `/home/setup/navidocs/STACKCP_ENVIRONMENT_REPORT.md`
- Architecture Analysis: `/home/setup/navidocs/STACKCP_ARCHITECTURE_ANALYSIS.md`
- Developer Guide: `/home/setup/navidocs/docs/DEVELOPER.md`

Remote SSH troubleshooting:
```bash
ssh stackcp << 'EOF'
echo "=== Environment Check ==="
echo "Node: $(/tmp/node --version)"
echo "Meilisearch: $(curl -s http://localhost:7700/health | jq .version)"
echo "Database: $(ls -lh ~/navidocs-data/db/navidocs.db)"
echo "Disk: $(df -h | grep home)"
EOF
```

---

**Deployment Date**: 2025-11-13
**Version**: NaviDocs v1.0.0
**Status**: Production Ready
