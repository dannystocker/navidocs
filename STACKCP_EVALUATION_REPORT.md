# StackCP Hosting Evaluation Report

**Date**: 2025-10-19
**Server**: ssh-node-gb.lhr.stackcp.net
**User**: digital-lab.ca
**Provider**: 20i (StackCP Shared Hosting)

---

## Executive Summary

✅ **NaviDocs CAN run on this StackCP hosting!**

The key insight: **StackCP allows executables in `/tmp` directory** despite having `noexec` on home directories. This is the "shared hosting with executable directory" you mentioned.

---

## System Information

```
OS: Linux 5.14.0-570.52.1.el9_6.x86_64
Architecture: x86_64
Home Directory: /home/sites/7a/c/cb8112d0d1/
Sudo Access: NO
```

---

## What's Available

### ✅ Working Out of the Box:

| Component | Version | Status |
|-----------|---------|--------|
| **Node.js** | v20.19.5 | ✅ Running from `/tmp/node` |
| **npm** | Latest | ✅ Available |
| **Python3** | 3.9.21 | ✅ Available |
| **MySQL/MariaDB** | 10.6.23 | ✅ Available |
| **Git** | 2.47.3 | ✅ Available |
| **ImageMagick** | 7.1.1-43 | ✅ Available |
| **Meilisearch** | Running | ✅ Already running on port 7700! |

### ❌ Not Available (But We Can Fix):

| Component | Status | Solution |
|-----------|--------|----------|
| **SQLite3** | Missing | Use `better-sqlite3` npm package |
| **Redis** | Missing | Use Redis Cloud (free tier) |
| **Tesseract** | Missing | Use Google Cloud Vision API |
| **PM2/Screen** | Missing | Use StackCP's Node.js manager |

---

## The Key Discovery: `/tmp` is Executable!

### How StackCP Works:

1. **Home directory** (`/home/sites/...`) has `noexec` (security)
2. **`/tmp` directory** has execute permissions ✅
3. **Workaround**: Run binaries from `/tmp`, symlink from `~/bin`

### Current Setup (Already Working):
```
~/bin/node → /tmp/node (97MB, Node.js v20.19.5)
/tmp/meilisearch (120MB, running on port 7700)
```

### Directory Structure:
```
/home/sites/7a/c/cb8112d0d1/
├── public_html/          # Web root
├── bin/                  # Symlinks to /tmp executables
│   ├── node → /tmp/node
│   ├── npm → ...
│   └── sqlite3 → /tmp/sqlite3 (to be added)
├── .nvm/                 # Node Version Manager
├── .meilisearch_data/    # Meilisearch data
└── navidocs/             # NaviDocs application (to create)

/tmp/                     # EXECUTABLE DIRECTORY!
├── node                  # Node.js binary
├── meilisearch           # Meilisearch binary
└── sqlite3               # SQLite3 (to add)
```

---

## NaviDocs Deployment Strategy for StackCP

### Option 1: Full Stack (Recommended)

```bash
# 1. Use better-sqlite3 (npm package, no binary needed)
npm install better-sqlite3

# 2. Use Redis Cloud (free tier: 30MB)
# Sign up at: https://redis.com/try-free/
REDIS_HOST=your-instance.redis.cloud
REDIS_PORT=xxxxx
REDIS_PASSWORD=your-password

# 3. Use Google Cloud Vision API for OCR
# - No Tesseract binary needed
# - 1,000 pages/month FREE
# - Handwriting support
PREFERRED_OCR_ENGINE=google-vision

# 4. Meilisearch is already running!
# Just configure to use existing instance
MEILISEARCH_HOST=http://127.0.0.1:7700
```

### Option 2: Minimal (All Cloud)

```bash
# Use cloud services for everything except Node.js:
# - Redis Cloud (free tier)
# - Google Cloud Vision (free tier: 1000/month)
# - Meilisearch Cloud (free tier: 100K docs)

# Advantages:
# - No binary compatibility issues
# - Better performance
# - Auto-scaling
# - Managed backups
```

---

## Step-by-Step Deployment Guide

### 1. Setup Environment Helpers

```bash
# SSH into StackCP
ssh stackcp

# Setup helper script (already uploaded during evaluation)
source ~/stackcp-setup.sh

# This provides convenient aliases:
# - node  → /tmp/node
# - npm   → /tmp/npm (helper script)
# - navidocs-start, navidocs-stop, navidocs-status (management functions)
```

### 2. Install Dependencies

```bash
# Create directories
mkdir -p ~/navidocs/{uploads,db,logs}
mkdir -p /tmp/navidocs

# Clone repository to /tmp (executable directory!)
cd /tmp/navidocs
git clone <your-repo-url> .

# Install dependencies
cd server
/tmp/npm install --production --no-audit --no-fund

cd ../client
/tmp/npm install --no-audit --no-fund
```

**Important**: Code MUST be in `/tmp/navidocs` because:
- Native modules (better-sqlite3) need compilation
- Home directory has `noexec` flag
- `/tmp` allows executables

### 3. Configure Environment

```bash
# server/.env
NODE_ENV=production
PORT=3001

# Database - using better-sqlite3
DATABASE_PATH=/home/sites/7a/c/cb8112d0d1/navidocs/server/db/navidocs.db

# Redis Cloud (free tier)
REDIS_HOST=redis-12345.redis.cloud
REDIS_PORT=12345
REDIS_PASSWORD=your-password

# Meilisearch (already running locally!)
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_MASTER_KEY=<check-running-instance>
MEILISEARCH_INDEX_NAME=navidocs-pages

# OCR - Google Cloud Vision API
PREFERRED_OCR_ENGINE=google-vision
GOOGLE_APPLICATION_CREDENTIALS=/home/sites/7a/c/cb8112d0d1/navidocs/server/config/google-credentials.json

# File Upload
MAX_FILE_SIZE=50000000
UPLOAD_DIR=/home/sites/7a/c/cb8112d0d1/navidocs/uploads

# JWT
JWT_SECRET=your-secure-random-string
JWT_EXPIRES_IN=7d
```

### 4. Update Database Code for better-sqlite3

The current code uses `Database` from `better-sqlite3`, so it should work!

Just verify in `server/config/db.js`:
```javascript
import Database from 'better-sqlite3';  // ✅ Already using this!
```

### 5. Initialize Database

```bash
cd /tmp/navidocs/server
/tmp/node db/init.js
```

### 6. Start Services

#### Option A: Using Helper Function (Easiest)
```bash
source ~/stackcp-setup.sh
navidocs-start
navidocs-status
```

#### Option B: Using StackCP Node.js Manager (Recommended for Production)
```
1. Log into StackCP control panel
2. Go to "Advanced" → "Node.js Applications"
3. Add Application:
   - Path: /tmp/navidocs/server (IMPORTANT: /tmp, not ~/!)
   - Startup file: index.js
   - Node version: 20.x
   - Port: 8001
4. Start application
5. Configure reverse proxy: yoursite.com → http://127.0.0.1:8001
```

#### Option C: Manual (Using nohup)
```bash
# Start API server
cd /tmp/navidocs/server
nohup /tmp/node index.js > ~/navidocs/logs/server.log 2>&1 &

# Start OCR worker
nohup /tmp/node workers/ocr-worker.js > ~/navidocs/logs/worker.log 2>&1 &
```

### 7. Build Frontend

```bash
cd /tmp/navidocs/client
/tmp/npm run build

# Serve via Apache/Nginx (StackCP manages this)
cp -r dist/* ~/public_html/
```

---

## Redis Cloud Setup (Free Tier)

```bash
# 1. Sign up: https://redis.com/try-free/
# 2. Create database (free tier: 30MB)
# 3. Get connection details
# 4. Update .env:

REDIS_HOST=redis-12345.c1.us-east-1-2.ec2.redis.cloud
REDIS_PORT=12345
REDIS_PASSWORD=your-password
```

**Why Redis Cloud:**
- ✅ 30MB free tier (enough for thousands of jobs)
- ✅ No binary installation needed
- ✅ Managed, always available
- ✅ Better than shared hosting Redis

---

## Google Cloud Vision API Setup

```bash
# 1. Create Google Cloud project
# 2. Enable Cloud Vision API
# 3. Create service account
# 4. Download JSON credentials
# 5. Upload to server:

scp google-credentials.json stackcp:~/navidocs/server/config/

# 6. Update .env
PREFERRED_OCR_ENGINE=google-vision
GOOGLE_APPLICATION_CREDENTIALS=/home/sites/7a/c/cb8112d0d1/navidocs/server/config/google-credentials.json
```

---

## Resource Limits

```
File size limit: 52428800 blocks (~50GB)
Open files: 1024
Max processes: 31349
Disk space: 8.7TB (96% used - 361GB available)
Memory: 7.8GB total
```

**Recommendation**: Monitor disk usage, but plenty of resources for NaviDocs.

---

## What's Already Running

```bash
# Meilisearch is ALREADY running!
# Process: /tmp/meilisearch
# Port: 7700
# Data: ~/.meilisearch_data/

# To use it:
# 1. Find the master key (check startup logs or config)
# 2. Update .env with MEILISEARCH_MASTER_KEY
# 3. Test: curl http://127.0.0.1:7700/health
```

---

## Challenges & Solutions

### Challenge 1: No Executable Permissions in Home
✅ **Solution**: Use `/tmp` for binaries, symlink from `~/bin`

### Challenge 2: No SQLite3 Binary
✅ **Solution**: Use `better-sqlite3` npm package (already in use!)

### Challenge 3: No Redis
✅ **Solution**: Redis Cloud free tier (30MB)

### Challenge 4: No Tesseract
✅ **Solution**: Google Cloud Vision API (1000 pages/month free)

### Challenge 5: No PM2/Screen
✅ **Solution**: StackCP's Node.js Application Manager

### Challenge 6: Process Persistence
✅ **Solution**: StackCP auto-restarts Node.js apps

---

## Performance Considerations

### Pros:
- ✅ Meilisearch already running
- ✅ Node.js v20 (latest LTS)
- ✅ Good memory (7.8GB)
- ✅ SSD storage (fast)

### Cons:
- ⚠️  Shared environment (CPU limits)
- ⚠️  Network latency for cloud services
- ⚠️  No background job management (use StackCP manager)

---

## Cost Analysis

### Current StackCP Hosting:
- **Cost**: $X/month (whatever you're paying)
- **Includes**: Everything except Redis and OCR

### Additional Free Services:
- **Redis Cloud**: $0 (30MB free tier)
- **Google Vision API**: $0 (1,000 pages/month free)
- **Meilisearch**: $0 (already running locally)

### Estimated Monthly Costs:
```
StackCP Hosting:     $X (existing)
Redis Cloud:         $0 (free tier)
Google Vision:       $0-$6 (depends on volume)
------------------------
Total:               $X + $0-$6/month
```

### Compared to VPS Alternative:
```
DigitalOcean VPS:    $6/month
Setup complexity:    Higher
Control:             Full
```

**Verdict**: StackCP is cost-effective if you're already paying for it!

---

## Deployment Verification Tests (Completed!)

### ✅ Phase 1: Core Infrastructure Testing

**Tested on 2025-10-19 08:30 UTC**

| Test | Status | Details |
|------|--------|---------|
| Node.js execution from `/tmp` | ✅ PASS | v20.19.5 runs perfectly |
| npm package installation | ✅ PASS | Installed 38 packages in `/tmp` |
| better-sqlite3 native module | ✅ PASS | Compiled and works in `/tmp` |
| Express server | ✅ PASS | Listening on port 8333 |
| SQLite database operations | ✅ PASS | CREATE, INSERT, SELECT all work |
| Meilisearch connectivity | ✅ PASS | Health endpoint returns "available" |

### Test Results:

```bash
# Node.js execution test
/tmp/node --version
# ✅ v20.19.5

# npm test
/tmp/node .../npm-cli.js install better-sqlite3
# ✅ added 38 packages in 2s

# better-sqlite3 test
const db = new Database(':memory:');
db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
db.prepare('INSERT INTO test (name) VALUES (?)').run('StackCP Test');
# ✅ Works perfectly!

# Express + Meilisearch test server
GET http://127.0.0.1:8333/
# ✅ {"status":"ok","sqlite":[{"id":1,"name":"StackCP Test"}],"node":"v20.19.5","platform":"linux"}

GET http://127.0.0.1:8333/health
# ✅ {"meilisearch":{"status":"available"}}
```

### Key Findings:

1. **npm MUST be executed via `/tmp/node`** because home directory has `noexec`:
   ```bash
   # ❌ This fails:
   ~/bin/npm install package

   # ✅ This works:
   /tmp/node ~/local/nodejs/lib/node_modules/npm/bin/npm-cli.js install package
   ```

2. **Native npm modules MUST be installed in `/tmp`**:
   - Home directory: `noexec` prevents compilation
   - `/tmp` directory: Full executable permissions ✅

3. **Recommended deployment structure**:
   ```
   /tmp/navidocs/               # Application code + node_modules
   ~/navidocs/                  # Data directory (noexec is fine)
   ├── uploads/                 # File storage
   ├── db/                      # SQLite database
   ├── logs/                    # Application logs
   └── .env                     # Configuration
   ```

### ✅ Phase 2: Full NaviDocs Deployment (Ready!)

All prerequisites verified. Ready to deploy full application:

- [x] Upload binary to `/tmp` ✅ (Node.js already there)
- [x] Test executable runs ✅ (v20.19.5 confirmed)
- [x] Install better-sqlite3 ✅ (Tested and working)
- [ ] Configure Redis Cloud (5 minutes)
- [ ] Setup Google Cloud Vision (5 minutes)
- [ ] Clone NaviDocs repository to `/tmp/navidocs`
- [ ] Install dependencies in `/tmp/navidocs`
- [ ] Initialize database
- [ ] Start API server
- [ ] Start OCR worker
- [ ] Upload test PDF
- [ ] Verify OCR processing
- [ ] Test search functionality
- [ ] Build and deploy frontend

---

## Recommendation

**✅ YES - Deploy NaviDocs on this StackCP hosting!**

### Why:
1. Node.js v20 works perfectly via `/tmp`
2. Meilisearch already running
3. Cloud services solve missing components
4. Cost-effective (mostly free tiers)
5. Good performance for moderate traffic

### How:
1. Use `better-sqlite3` (npm package)
2. Use Redis Cloud (free tier)
3. Use Google Cloud Vision API (free tier)
4. Use StackCP's Node.js Manager for processes
5. Follow deployment guide above

---

## Next Steps

1. **Set up Redis Cloud** (5 minutes)
2. **Set up Google Cloud Vision** (5 minutes)
3. **Deploy NaviDocs code** (15 minutes)
4. **Initialize database** (2 minutes)
5. **Start services via StackCP** (5 minutes)
6. **Test upload & OCR** (5 minutes)

**Total deployment time: ~30 minutes**

---

## Support

If you encounter issues:
- **StackCP Support**: support@20i.com
- **Redis Cloud Support**: Free tier includes email support
- **Google Cloud**: Extensive documentation

---

## Conclusion

**StackCP shared hosting is suitable for NaviDocs!**

The `/tmp` executable directory is the key. Combined with cloud services for Redis and OCR, you have everything needed. Meilisearch is already running, which is a bonus!

**Deployment difficulty**: 3/10 (straightforward with this guide)
**Expected performance**: 7/10 (good for small-medium traffic)
**Cost effectiveness**: 9/10 (mostly free tiers)

**Proceed with deployment!** 🚀
