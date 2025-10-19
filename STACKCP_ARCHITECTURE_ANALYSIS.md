# StackCP Deployment Architecture Analysis for NaviDocs

**Tech Lead Assessment**: FastFile/NaviDocs Autonomous Development Prompt Evaluation

**Date**: 2025-10-19
**Analyst**: Tech Lead
**Target Environment**: StackCP (20i) Shared Hosting with `/tmp` executable directory
**Status**: Critical architectural revisions required

---

## Executive Summary

The existing NaviDocs development roadmap assumes a **standard deployment environment** with normal filesystem permissions, local services, and standard CI/CD. The StackCP discovery of `/tmp` as the only executable directory fundamentally breaks multiple architectural assumptions.

**Verdict**: The current autonomous development prompt and mission statement are **NOT viable** for StackCP deployment without significant architectural rewrites.

---

## Critical Issues (Blockers)

### 1. Repository Structure Assumes Home Directory Execution

**Current Assumption** (from README.md, roadmap):
```
navidocs/
├── server/              # Code + node_modules in home directory
├── client/              # Build output in home directory
├── uploads/             # Data in home directory
└── db/                  # Database in home directory
```

**StackCP Reality**:
```
/tmp/navidocs/           # MUST be here (executable)
├── server/              # Code + native modules (better-sqlite3)
├── client/              # Build tools need execution
└── node_modules/        # Native binaries need exec

~/navidocs/              # Data only (noexec is fine)
├── uploads/             # File storage
├── db/                  # SQLite database
├── logs/                # Application logs
└── .env                 # Configuration (secrets)
```

**Impact**:
- Entire codebase deployment location changes
- Path references in code must support dual locations
- Build process must handle `/tmp` compilation
- Git workflows must account for `/tmp` volatility

**Required Changes**:
- All absolute paths in code must use environment variables
- Database path must be configurable to `~/navidocs/db/`
- Upload path must be configurable to `~/navidocs/uploads/`
- Log path must be configurable to `~/navidocs/logs/`

---

### 2. Native Module Compilation Strategy Broken

**Current Approach** (package.json dependencies):
```json
"dependencies": {
  "better-sqlite3": "^11.0.0",   // Native module
  "bcrypt": "^5.1.0",            // Native module
}
```

**StackCP Reality**:
- `npm install` in home directory: **FAILS** (noexec prevents compilation)
- `npm install` in `/tmp`: **WORKS** (executable permissions)
- Must use `/tmp/node /path/to/npm-cli.js` wrapper

**Impact**:
- Standard `npm install` commands fail
- CI/CD scripts must be rewritten
- Developer workflow documentation is incorrect
- Deployment scripts need custom npm wrapper

**Required Changes**:
- Document MUST specify npm execution method: `/tmp/npm`
- All package installation must happen in `/tmp/navidocs`
- Deployment scripts must check for `/tmp` vs home directory
- Add validation that node_modules are in executable location

---

### 3. Process Persistence and Management Assumptions

**Current Assumption** (2-week-launch-plan.md):
```bash
# Uses PM2, systemd, or screen
pm2 start server/workers/ocr-worker.js
systemctl --user enable navidocs
```

**StackCP Reality**:
- PM2 **may not work** (depends on StackCP's Node.js manager)
- systemd **user services uncertain** (shared hosting restrictions)
- `/tmp` contents **may be cleared on reboot**
- StackCP Node.js Manager is the **recommended** approach

**Impact**:
- Process management strategy must be completely rewritten
- Code persistence in `/tmp` is questionable
- Application restart procedures are different
- Monitoring and health checks need rethinking

**Required Changes**:
- Primary: Use StackCP Node.js Application Manager (GUI-based)
- Fallback: `nohup` scripts with manual management
- Add checkpoint/restore mechanism for `/tmp` code
- Document StackCP-specific process management
- Create health check that detects `/tmp` code loss

---

### 4. File Persistence and Backup Strategy

**Current Assumption** (2-week-launch-plan.md):
```bash
# Assumes everything is in one location
tar -czf ~/backups/navidocs-$(date +%Y%m%d).tar.gz ~/navidocs/
```

**StackCP Reality**:
- Application code: `/tmp/navidocs/` (may be volatile)
- Application data: `~/navidocs/` (persistent)
- Backups must handle split locations
- `/tmp` may be cleared without warning

**Impact**:
- Backup scripts must handle two locations
- Restore procedure is more complex
- Code must be re-deployable from Git, not backups
- Data-only backups for database/uploads

**Required Changes**:
- Separate code backups (Git) from data backups (SQLite, uploads)
- Backup script: Only backup `~/navidocs/` (data)
- Deployment script: Always deploy code fresh to `/tmp/navidocs/`
- Checkpoint script: Sync `/tmp/navidocs` to `~/navidocs/code-checkpoint/` daily
- Restore script: Clone from Git to `/tmp`, restore data from backup

---

### 5. Development Workflow Misalignment

**Current Assumption** (QUICKSTART.md):
```bash
cd ~/navidocs/server
npm install
npm run dev
```

**StackCP Reality**:
```bash
cd /tmp/navidocs/server
/tmp/npm install
/tmp/node index.js
```

**Impact**:
- Developer documentation is incorrect
- Local development doesn't match production
- Deployment instructions are wrong
- Testing procedures need revision

**Required Changes**:
- Rewrite QUICKSTART.md with StackCP-specific paths
- Add "Local Development" vs "StackCP Deployment" sections
- Document npm wrapper usage
- Provide helper script (`stackcp-setup.sh`) installation steps

---

## Major Revisions Needed

### Section 1: Mission Statement (ARCHITECTURE-SUMMARY.md)

**Current State**: No mention of deployment constraints

**Required Additions**:
```markdown
## Deployment Constraints

### StackCP Shared Hosting
NaviDocs is designed to run on StackCP (20i) shared hosting with the following constraints:

- **Executable code location**: `/tmp/navidocs/` (only location with exec permissions)
- **Data storage location**: `~/navidocs/` (database, uploads, logs, config)
- **Code persistence**: `/tmp` may be cleared on reboot - deploy from Git
- **Native modules**: Must be compiled in `/tmp` using `/tmp/npm`
- **Process management**: Use StackCP Node.js Application Manager (primary)
- **External services required**:
  - Redis Cloud (free tier: 30MB)
  - Google Cloud Vision API (free tier: 1K pages/month)
  - Meilisearch (already running on StackCP server)

### Path Configuration
All file paths must be configurable via environment variables:
- `CODE_PATH=/tmp/navidocs` (application code)
- `DATA_PATH=~/navidocs` (persistent data)
- `DATABASE_PATH=${DATA_PATH}/db/navidocs.db`
- `UPLOAD_DIR=${DATA_PATH}/uploads`
- `LOG_DIR=${DATA_PATH}/logs`
```

---

### Section 2: Technology Stack (ARCHITECTURE-SUMMARY.md)

**Current State**: Lists local dependencies (Redis, Tesseract)

**Required Revisions**:
```markdown
### Backend (StackCP Deployment)
- **Node.js 20** - Express 5 (via `/tmp/node`)
- **SQLite** - better-sqlite3 with WAL mode (compiled in `/tmp`)
- **Meilisearch** - Running on StackCP server (port 7700)
- **Redis Cloud** - External service (free 30MB tier)
- **Google Cloud Vision API** - OCR engine (free 1K pages/month)
- **BullMQ** - Background job processing (with Redis Cloud)

### StackCP-Specific Components
- **npm wrapper**: `/tmp/npm` (executes via `/tmp/node`)
- **Helper scripts**: `~/stackcp-setup.sh` (environment setup)
- **StackCP Node.js Manager**: Process supervision
- **Checkpoint script**: Daily sync `/tmp` → `~/navidocs/code-checkpoint/`
```

---

### Section 3: Deployment Strategy (docs/roadmap/v1.0-mvp.md)

**Current State**: Generic deployment steps

**Required Complete Rewrite**:
```markdown
## StackCP Deployment Strategy

### Prerequisites
1. StackCP account with SSH access
2. Redis Cloud account (free tier)
3. Google Cloud account with Vision API enabled
4. Git repository with NaviDocs code

### Phase 1: Environment Setup (30 minutes)
1. SSH into StackCP server
2. Install helper scripts (`stackcp-setup.sh`)
3. Create directory structure:
   - `/tmp/navidocs/` (code)
   - `~/navidocs/` (data)
4. Configure external services:
   - Redis Cloud connection
   - Google Vision API credentials
5. Verify Meilisearch is running

### Phase 2: Code Deployment (15 minutes)
1. Clone repository to `/tmp/navidocs`
2. Install dependencies using `/tmp/npm install`
3. Build client using `/tmp/npm run build`
4. Configure `.env` with StackCP paths
5. Initialize database in `~/navidocs/db/`

### Phase 3: Service Startup (10 minutes)
1. Use StackCP Node.js Application Manager:
   - Add application: `/tmp/navidocs/server`
   - Set startup file: `index.js`
   - Set Node version: 20.x
   - Set port: 3001
2. Start OCR worker (via nohup or screen)
3. Configure reverse proxy in StackCP
4. Copy client build to `~/public_html/`

### Phase 4: Operational Setup (15 minutes)
1. Create checkpoint script (daily `/tmp` → `~/code-checkpoint/`)
2. Create data backup script (daily `~/navidocs/` → `~/backups/`)
3. Set up health checks (monitor `/tmp` code presence)
4. Document restart procedure (code loss recovery)
```

---

### Section 4: Development Workflow (QUICKSTART.md)

**Current State**: Assumes standard environment

**Required Rewrite**:
```markdown
## Quick Start

### Local Development (Standard Environment)
```bash
# Clone repository
git clone <repo-url> ~/navidocs
cd ~/navidocs/server
npm install
npm run dev
```

### StackCP Deployment (Shared Hosting)
```bash
# SSH into StackCP
ssh stackcp

# Load StackCP helpers
source ~/stackcp-setup.sh

# Deploy to /tmp (executable location)
cd /tmp
git clone <repo-url> navidocs
cd navidocs/server
/tmp/npm install  # Must use wrapper

# Configure environment
cat > .env << 'EOF'
DATABASE_PATH=/home/sites/7a/c/cb8112d0d1/navidocs/db/navidocs.db
UPLOAD_DIR=/home/sites/7a/c/cb8112d0d1/navidocs/uploads
REDIS_HOST=redis-xxxxx.redis.cloud
# ... (Redis Cloud credentials)
EOF

# Initialize database (in persistent location)
/tmp/node db/init.js

# Start via StackCP Manager (GUI)
# OR use helper function:
navidocs-start
```

### Key Differences: Local vs StackCP
| Aspect | Local Dev | StackCP Deploy |
|--------|-----------|----------------|
| Code location | `~/navidocs/` | `/tmp/navidocs/` |
| npm command | `npm install` | `/tmp/npm install` |
| Node command | `node index.js` | `/tmp/node index.js` |
| Data location | `./db/`, `./uploads/` | `~/navidocs/db/`, `~/navidocs/uploads/` |
| Process manager | PM2 / nodemon | StackCP Node.js Manager |
| Redis | Local (redis-server) | Redis Cloud |
| OCR engine | Tesseract (local) | Google Cloud Vision API |
```

---

### Section 5: Backup and Recovery (2-week-launch-plan.md)

**Current State**: Single-location backup

**Required Revisions**:
```markdown
## Backup Strategy for StackCP

### What to Backup
1. **Data** (critical, daily):
   - SQLite database: `~/navidocs/db/navidocs.db`
   - Uploaded PDFs: `~/navidocs/uploads/`
   - Configuration: `~/navidocs/.env` (encrypted)
   - Logs (last 7 days): `~/navidocs/logs/`

2. **Code checkpoint** (daily):
   - `/tmp/navidocs/` → `~/navidocs/code-checkpoint/`
   - This is a snapshot, not the source of truth
   - Real source of truth: Git repository

### Backup Script (StackCP-specific)
```bash
#!/bin/bash
# ~/bin/backup-navidocs-data

BACKUP_DIR=~/backups/navidocs
DATE=$(date +%Y%m%d-%H%M%S)

# 1. Backup persistent data only
tar -czf ${BACKUP_DIR}/data-${DATE}.tar.gz \
  ~/navidocs/db \
  ~/navidocs/uploads \
  ~/navidocs/.env \
  ~/navidocs/logs

# 2. Checkpoint /tmp code (may be lost on reboot)
rsync -av --delete /tmp/navidocs/ ~/navidocs/code-checkpoint/

# 3. Verify backup integrity
tar -tzf ${BACKUP_DIR}/data-${DATE}.tar.gz > /dev/null

# 4. Rotate old backups (keep 30 days)
find ${BACKUP_DIR} -name "data-*.tar.gz" -mtime +30 -delete

echo "Backup complete: ${BACKUP_DIR}/data-${DATE}.tar.gz"
```

### Restore Procedure
```bash
#!/bin/bash
# ~/bin/restore-navidocs

# 1. Stop application
navidocs-stop

# 2. Deploy fresh code from Git (to /tmp)
cd /tmp
rm -rf navidocs
git clone <repo-url> navidocs
cd navidocs/server
/tmp/npm install

# 3. Restore data from backup
cd ~
tar -xzf backups/navidocs/data-YYYYMMDD-HHMMSS.tar.gz

# 4. Verify database integrity
/tmp/node -e "const db = require('better-sqlite3')('~/navidocs/db/navidocs.db'); console.log(db.pragma('integrity_check'));"

# 5. Restart application
navidocs-start
```

### Health Check for /tmp Code Loss
```bash
#!/bin/bash
# ~/bin/check-navidocs-code

if [ ! -f /tmp/navidocs/server/index.js ]; then
  echo "ERROR: Code missing from /tmp/navidocs"
  echo "Restoring from checkpoint..."

  # Restore from checkpoint
  cp -r ~/navidocs/code-checkpoint/* /tmp/navidocs/

  # Verify restoration
  if [ -f /tmp/navidocs/server/index.js ]; then
    echo "Code restored from checkpoint"
    navidocs-start
  else
    echo "CRITICAL: Code checkpoint also missing, deploy from Git"
    exit 1
  fi
fi
```

### Cron Jobs (StackCP-specific)
```cron
# Data backup (daily at 3am)
0 3 * * * ~/bin/backup-navidocs-data

# Code checkpoint (daily at 4am)
0 4 * * * rsync -av --delete /tmp/navidocs/ ~/navidocs/code-checkpoint/

# Health check for code loss (every 6 hours)
0 */6 * * * ~/bin/check-navidocs-code
```
```

---

## Minor Tweaks (Sections That Mostly Work)

### 1. Database Schema (docs/architecture/database-schema.sql)
**Status**: No changes needed
**Reason**: Schema is platform-agnostic, only paths change

### 2. Meilisearch Configuration (docs/architecture/meilisearch-config.json)
**Status**: Minor tweaks
**Changes**: Document that Meilisearch is already running on StackCP, just need master key

### 3. API Routes (server/routes/)
**Status**: Minor tweaks
**Changes**: Ensure all file paths use environment variables, no hardcoded paths

### 4. Frontend Code (client/)
**Status**: No changes needed
**Reason**: Frontend is platform-agnostic, just needs correct API base URL

### 5. Security Hardening Guide (docs/architecture/hardened-production-guide.md)
**Status**: Minor additions
**Changes**: Add StackCP-specific security notes (file permissions, StackCP Node.js Manager)

---

## Proposed Repository Structure

### Git Repository (Source of Truth)
```
navidocs/
├── .env.example                    # Template with StackCP paths
├── .env.stackcp.example            # StackCP-specific template
├── README.md                       # General overview
├── QUICKSTART.md                   # Local development
├── QUICKSTART-STACKCP.md           # StackCP deployment
├── ARCHITECTURE-SUMMARY.md         # Updated with constraints
├── server/
│   ├── index.js
│   ├── config/
│   │   └── paths.js               # Centralized path configuration
│   ├── db/
│   │   └── init.js
│   ├── routes/
│   ├── services/
│   └── workers/
├── client/
│   └── ...
├── scripts/
│   ├── stackcp/
│   │   ├── setup.sh               # One-time environment setup
│   │   ├── deploy.sh              # Deploy code to /tmp
│   │   ├── backup-data.sh         # Backup persistent data
│   │   ├── checkpoint-code.sh     # Checkpoint /tmp to ~
│   │   ├── restore.sh             # Restore from backup + Git
│   │   └── health-check.sh        # Detect /tmp code loss
│   └── local/
│       └── dev.sh                 # Local development setup
└── docs/
    ├── deployment/
    │   ├── local.md
    │   ├── stackcp.md             # Complete StackCP guide
    │   └── vps.md                 # Future: standard VPS
    └── architecture/
        └── ...
```

### StackCP Server Layout (Deployed)
```
/tmp/navidocs/                      # Application code (volatile)
├── server/
│   ├── index.js
│   ├── node_modules/               # Native modules compiled here
│   │   └── better-sqlite3/
│   ├── config/
│   ├── db/
│   ├── routes/
│   ├── services/
│   └── workers/
└── client/
    └── dist/

~/navidocs/                         # Application data (persistent)
├── db/
│   └── navidocs.db                # SQLite database
├── uploads/
│   └── *.pdf                      # Uploaded documents
├── logs/
│   ├── server.log
│   └── worker.log
├── .env                           # Configuration (secrets)
├── google-credentials.json        # Google Cloud Vision credentials
└── code-checkpoint/               # Daily snapshot of /tmp code
    └── (copy of /tmp/navidocs)

~/backups/navidocs/                 # Data backups
├── data-20251019-030000.tar.gz
└── ...

~/public_html/                      # Web root (frontend)
├── index.html
└── assets/

~/bin/                              # Helper scripts
├── backup-navidocs-data
├── checkpoint-navidocs-code
├── check-navidocs-code
└── restore-navidocs

~/stackcp-setup.sh                  # Environment helpers (source this)
```

---

## Revised Deployment Steps (StackCP-Specific)

### Step 1: Prerequisites (One-Time)
```bash
# 1. Sign up for external services
- Redis Cloud: https://redis.com/try-free/
- Google Cloud: Enable Vision API

# 2. SSH into StackCP
ssh your-username@ssh-node-gb.lhr.stackcp.net

# 3. Verify Node.js and Meilisearch
/tmp/node --version  # Should be v20.19.5
curl http://127.0.0.1:7700/health  # Should return "available"

# 4. Install helper scripts
cd ~
git clone <navidocs-repo> /tmp/navidocs-setup
cp /tmp/navidocs-setup/scripts/stackcp/setup.sh ~/stackcp-setup.sh
source ~/stackcp-setup.sh
```

### Step 2: Initial Deployment
```bash
# 1. Deploy code to /tmp
cd /tmp
git clone <navidocs-repo> navidocs
cd navidocs/server
/tmp/npm install --production

# 2. Build frontend
cd /tmp/navidocs/client
/tmp/npm install
/tmp/npm run build

# 3. Create data directories
mkdir -p ~/navidocs/{db,uploads,logs,code-checkpoint}
mkdir -p ~/backups/navidocs

# 4. Configure environment
cp /tmp/navidocs/.env.stackcp.example ~/navidocs/.env
# Edit ~/navidocs/.env with:
#   - Redis Cloud credentials
#   - Google Vision credentials path
#   - StackCP-specific paths

# Symlink .env to code location
ln -s ~/navidocs/.env /tmp/navidocs/server/.env

# 5. Upload Google credentials
# (From local machine)
scp google-credentials.json stackcp:~/navidocs/

# 6. Initialize database
cd /tmp/navidocs/server
/tmp/node db/init.js
```

### Step 3: Start Services
```bash
# Option A: StackCP Node.js Manager (Recommended)
# 1. Log into StackCP control panel
# 2. Advanced → Node.js Applications → Add Application
#    - Path: /tmp/navidocs/server
#    - Startup: index.js
#    - Node: 20.x
#    - Port: 3001
# 3. Start application
# 4. Configure reverse proxy: yoursite.com → http://127.0.0.1:3001

# Option B: Manual (for testing)
source ~/stackcp-setup.sh
navidocs-start
```

### Step 4: Operational Setup
```bash
# 1. Install backup scripts
cp /tmp/navidocs/scripts/stackcp/* ~/bin/
chmod +x ~/bin/backup-navidocs-data
chmod +x ~/bin/checkpoint-navidocs-code
chmod +x ~/bin/check-navidocs-code
chmod +x ~/bin/restore-navidocs

# 2. Set up cron jobs
crontab -e
# Add:
0 3 * * * ~/bin/backup-navidocs-data
0 4 * * * ~/bin/checkpoint-navidocs-code
0 */6 * * * ~/bin/check-navidocs-code

# 3. Test backup/restore
~/bin/backup-navidocs-data
~/bin/restore-navidocs
```

### Step 5: Updates and Maintenance
```bash
# Update code (from Git)
cd /tmp/navidocs
git pull
cd server && /tmp/npm install
cd ../client && /tmp/npm run build
cp -r dist/* ~/public_html/

# Restart services
navidocs-stop
navidocs-start

# Or use StackCP Manager:
# Advanced → Node.js Applications → NaviDocs → Restart
```

---

## Path Configuration Strategy

### Central Configuration File
**server/config/paths.js**:
```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect environment
const isStackCP = process.env.STACKCP_DEPLOYMENT === 'true';
const homeDir = process.env.HOME || '/home/sites/7a/c/cb8112d0d1';

// Base paths
export const CODE_PATH = isStackCP
  ? '/tmp/navidocs'
  : path.join(__dirname, '../..');

export const DATA_PATH = isStackCP
  ? path.join(homeDir, 'navidocs')
  : path.join(__dirname, '../..');

// Derived paths
export const DATABASE_PATH = process.env.DATABASE_PATH ||
  path.join(DATA_PATH, 'db', 'navidocs.db');

export const UPLOAD_DIR = process.env.UPLOAD_DIR ||
  path.join(DATA_PATH, 'uploads');

export const LOG_DIR = process.env.LOG_DIR ||
  path.join(DATA_PATH, 'logs');

export const CONFIG_DIR = process.env.CONFIG_DIR ||
  path.join(DATA_PATH, 'config');

// Validate paths exist (create if needed)
import fs from 'fs';
[DATA_PATH, path.dirname(DATABASE_PATH), UPLOAD_DIR, LOG_DIR, CONFIG_DIR]
  .forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
```

### Environment Variables (.env.stackcp.example)
```bash
# StackCP Deployment Configuration
STACKCP_DEPLOYMENT=true
NODE_ENV=production
PORT=3001

# Paths (StackCP-specific)
# Code is in /tmp/navidocs (executable)
# Data is in ~/navidocs (persistent)
HOME=/home/sites/7a/c/cb8112d0d1
DATA_PATH=${HOME}/navidocs
DATABASE_PATH=${DATA_PATH}/db/navidocs.db
UPLOAD_DIR=${DATA_PATH}/uploads
LOG_DIR=${DATA_PATH}/logs
CONFIG_DIR=${DATA_PATH}/config

# External Services
REDIS_HOST=redis-xxxxx.c1.us-east-1-2.ec2.redis.cloud
REDIS_PORT=12345
REDIS_PASSWORD=your-password-here

# Meilisearch (already running on StackCP)
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_MASTER_KEY=find-on-server
MEILISEARCH_INDEX_NAME=navidocs-pages

# OCR - Google Cloud Vision API
PREFERRED_OCR_ENGINE=google-vision
GOOGLE_APPLICATION_CREDENTIALS=${CONFIG_DIR}/google-credentials.json

# Security
JWT_SECRET=generate-with-openssl-rand-base64-32
JWT_EXPIRES_IN=7d
```

---

## Operational Concerns

### 1. /tmp Persistence Risk

**Problem**: `/tmp` may be cleared on reboot or system maintenance

**Mitigation**:
1. **Daily checkpoint**: `rsync /tmp/navidocs/ → ~/navidocs/code-checkpoint/`
2. **Health check**: Detect missing `/tmp/navidocs` and restore from checkpoint
3. **Automated recovery**: Script that detects loss and re-deploys from Git
4. **Monitoring**: Alert if `/tmp/navidocs` disappears

**Implementation**:
```bash
#!/bin/bash
# ~/bin/check-navidocs-code (runs every 6 hours)

CODE_DIR=/tmp/navidocs/server/index.js
CHECKPOINT_DIR=~/navidocs/code-checkpoint

if [ ! -f "$CODE_DIR" ]; then
  logger "NaviDocs code missing from /tmp, attempting recovery"

  # Try checkpoint first (faster)
  if [ -d "$CHECKPOINT_DIR" ]; then
    cp -r $CHECKPOINT_DIR /tmp/navidocs
    logger "NaviDocs code restored from checkpoint"
    navidocs-start
    exit 0
  fi

  # Checkpoint missing, deploy from Git
  cd /tmp
  git clone <repo-url> navidocs
  cd navidocs/server
  /tmp/npm install --production
  logger "NaviDocs code deployed from Git"
  navidocs-start
fi
```

### 2. Node Module Recompilation

**Problem**: Native modules must be recompiled on each deployment

**Mitigation**:
1. **Cache node_modules in checkpoint**: Include in daily checkpoint
2. **Verify after restore**: Run health check that validates better-sqlite3 works
3. **Document recompilation time**: ~2 minutes for full npm install

**Implementation**:
```bash
#!/bin/bash
# ~/bin/checkpoint-navidocs-code

rsync -av --delete /tmp/navidocs/ ~/navidocs/code-checkpoint/

# Verify native modules work
cd ~/navidocs/code-checkpoint/server
/tmp/node -e "require('better-sqlite3'); console.log('Native modules OK');"
```

### 3. StackCP Node.js Manager Integration

**Problem**: StackCP's GUI-based manager may conflict with manual process management

**Mitigation**:
1. **Choose one approach**: Either StackCP Manager OR manual (nohup/screen)
2. **Document clearly**: QUICKSTART must specify which to use
3. **Provide both**: Helper functions for manual, instructions for GUI

**Recommendation**: Use StackCP Manager for API server, manual for OCR worker

### 4. External Service Dependencies

**Problem**: Redis Cloud and Google Vision introduce network dependencies

**Mitigation**:
1. **Graceful degradation**: Queue fails → log error but don't crash
2. **Health checks**: Monitor external service connectivity
3. **Fallback options**: Document SQLite-based queue as fallback
4. **Rate limiting**: Respect free tier limits (1K Google Vision pages/month)

---

## Revised Mission Statement

**Original** (ARCHITECTURE-SUMMARY.md):
> "A future-proof, multi-vertical document management platform for boat owners, marinas, and property managers."

**Revised for StackCP Reality**:
> "A future-proof, multi-vertical document management platform for boat owners, marinas, and property managers, architected for constrained shared hosting environments with split executable/data directories."

**Key Additions to Mission**:
1. **Deployment flexibility**: Design for StackCP constraints while maintaining portability
2. **Path abstraction**: All file operations use configurable paths
3. **External service integration**: Cloud-first approach (Redis Cloud, Google Vision)
4. **Operational resilience**: Handle `/tmp` volatility with checkpoints and auto-recovery
5. **Developer experience**: Provide environment-specific tooling (helpers, wrappers)

---

## Sections Requiring Complete Rewrite

### 1. QUICKSTART.md
**Reason**: Assumes standard environment, all commands are wrong for StackCP
**Action**: Split into QUICKSTART-LOCAL.md and QUICKSTART-STACKCP.md

### 2. docs/roadmap/2-week-launch-plan.md
**Reason**: Deployment steps assume local services, PM2, systemd
**Action**: Rewrite deployment phase with StackCP-specific steps

### 3. server/.env.example
**Reason**: Uses relative paths, assumes local Redis/Tesseract
**Action**: Create .env.stackcp.example with absolute paths, cloud services

### 4. Any deployment scripts in scripts/
**Reason**: Assumes standard environment
**Action**: Create scripts/stackcp/ directory with StackCP-specific scripts

### 5. docs/DEPLOYMENT_STACKCP.md (existing)
**Reason**: Outdated, assumes VPS-like environment
**Action**: Complete rewrite based on verified StackCP constraints

---

## Sections Requiring Minor Revisions

### 1. README.md
**Changes**:
- Add "Deployment Options" section (Local, StackCP, VPS)
- Link to deployment-specific guides
- Update prerequisites with "OR" options (local Redis OR Redis Cloud)

### 2. ARCHITECTURE-SUMMARY.md
**Changes**:
- Add "Deployment Constraints" section
- Update "Technology Stack" with StackCP variants
- Add "Path Configuration Strategy"

### 3. server/package.json
**Changes**:
- Add scripts for StackCP: `"stackcp:install": "/tmp/npm install"`
- Document that native modules need executable directory

### 4. docs/architecture/hardened-production-guide.md
**Changes**:
- Add StackCP-specific security considerations
- Document StackCP Node.js Manager security model
- Note that `/tmp` code is readable by other StackCP users (security risk)

---

## Testing Strategy Additions

### 1. StackCP Environment Tests
```bash
# Verify deployment environment
test-stackcp-env() {
  # Check /tmp is executable
  touch /tmp/test-exec && chmod +x /tmp/test-exec
  /tmp/test-exec && echo "OK: /tmp is executable" || echo "FAIL: /tmp not executable"

  # Check home is noexec
  touch ~/test-exec && chmod +x ~/test-exec
  ~/test-exec && echo "FAIL: Home should be noexec" || echo "OK: Home is noexec"

  # Check npm wrapper works
  /tmp/npm --version || echo "FAIL: npm wrapper broken"

  # Check Meilisearch reachable
  curl -s http://127.0.0.1:7700/health | grep available || echo "FAIL: Meilisearch not running"
}
```

### 2. Path Configuration Tests
```javascript
// server/config/paths.test.js
import { DATABASE_PATH, UPLOAD_DIR, LOG_DIR } from './paths.js';
import fs from 'fs';

describe('Path Configuration', () => {
  test('DATABASE_PATH is in data directory (not /tmp)', () => {
    expect(DATABASE_PATH).not.toContain('/tmp/');
    expect(DATABASE_PATH).toContain('/navidocs/db/');
  });

  test('All data directories exist', () => {
    expect(fs.existsSync(path.dirname(DATABASE_PATH))).toBe(true);
    expect(fs.existsSync(UPLOAD_DIR)).toBe(true);
    expect(fs.existsSync(LOG_DIR)).toBe(true);
  });
});
```

### 3. Checkpoint/Restore Tests
```bash
# Test checkpoint and restore procedure
test-checkpoint-restore() {
  echo "Testing checkpoint/restore..."

  # 1. Backup current /tmp/navidocs
  mv /tmp/navidocs /tmp/navidocs-backup

  # 2. Restore from checkpoint
  ~/bin/check-navidocs-code

  # 3. Verify code is restored
  [ -f /tmp/navidocs/server/index.js ] || { echo "FAIL: Code not restored"; exit 1; }

  # 4. Verify native modules work
  /tmp/node -e "require('/tmp/navidocs/server/node_modules/better-sqlite3')" || {
    echo "FAIL: Native modules broken after restore"
    exit 1
  }

  # 5. Cleanup
  rm -rf /tmp/navidocs
  mv /tmp/navidocs-backup /tmp/navidocs

  echo "OK: Checkpoint/restore works"
}
```

---

## Recommended Implementation Priority

### Phase 1: Critical Path Fixes (Week 1)
1. Create `server/config/paths.js` (centralized path configuration)
2. Update all code to use path configuration (database, uploads, logs)
3. Create `.env.stackcp.example` with correct paths
4. Write StackCP deployment scripts (`scripts/stackcp/`)
5. Test deployment on StackCP server

### Phase 2: Operational Resilience (Week 2)
1. Write checkpoint script (`checkpoint-navidocs-code`)
2. Write health check script (`check-navidocs-code`)
3. Write backup/restore scripts (`backup-navidocs-data`, `restore-navidocs`)
4. Test recovery scenarios (/tmp loss, data corruption)
5. Set up cron jobs

### Phase 3: Documentation (Week 2)
1. Rewrite QUICKSTART-STACKCP.md
2. Update ARCHITECTURE-SUMMARY.md
3. Revise 2-week-launch-plan.md for StackCP
4. Create deployment runbook
5. Document troubleshooting procedures

### Phase 4: Developer Experience (Week 3)
1. Create `stackcp-setup.sh` helper script
2. Create npm wrapper (`/tmp/npm`)
3. Add management functions (navidocs-start, stop, status)
4. Test on fresh StackCP account
5. Gather feedback from beta deployment

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| `/tmp` cleared during production | **CRITICAL** | Medium | Daily checkpoint + auto-recovery script |
| Native module compilation fails | **HIGH** | Low | Document known-good Node version, keep checkpoint |
| Redis Cloud free tier exhausted | **MEDIUM** | Low | Monitor usage, implement SQLite queue fallback |
| Google Vision free tier exhausted | **MEDIUM** | Medium | Rate limit uploads, warn users, offer paid tier |
| StackCP restricts long-running processes | **HIGH** | Low | Use StackCP Manager, contact support if issues |
| `/tmp` code readable by other users | **MEDIUM** | High | Document security risk, recommend VPS for sensitive data |
| Data path misconfiguration | **CRITICAL** | Medium | Add startup validation, fail fast if paths wrong |
| Checkpoint script fails silently | **HIGH** | Medium | Add monitoring, alert on checkpoint failures |

---

## Conclusion

The existing NaviDocs development roadmap and documentation **requires substantial revisions** to accommodate StackCP's unique constraints. The discovery that only `/tmp` has executable permissions fundamentally changes:

1. **Repository structure**: Code vs data must be split
2. **Deployment process**: Custom npm wrappers, StackCP Manager
3. **Backup strategy**: Code from Git, data from backups
4. **Operational resilience**: Checkpoint scripts, auto-recovery
5. **Developer workflow**: Different commands for local vs StackCP

**Estimated effort to revise**:
- Code changes: 2-3 days (path configuration, testing)
- Documentation: 1-2 days (rewrites)
- Operational scripts: 1 day (backup, checkpoint, health checks)
- Testing: 1 day (deployment verification)

**Total**: 5-7 days of focused work to make NaviDocs production-ready for StackCP.

**Recommendation**: Treat this as a **StackCP-specific deployment variant**, not the primary development environment. Maintain standard local development workflow, add StackCP deployment as a supported option with its own documentation and tooling.

---

**Next Steps for Debate**:
1. Review this analysis with Security team (`.tmp` code readability risk)
2. Review with OCI team (container deployment alternative)
3. Decide: Proceed with StackCP adaptations OR migrate to VPS
4. If proceeding: Implement Phase 1 (Critical Path Fixes) first
5. Test on StackCP, validate assumptions, iterate

---

**Document Status**: Ready for technical review
**Prepared by**: Tech Lead
**Date**: 2025-10-19
**Version**: 1.0
