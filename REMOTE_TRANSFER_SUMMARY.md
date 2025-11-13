# NaviDocs - Remote Transfer Summary

**Date:** 2025-10-24
**Remote Server:** 192.168.1.41:4000
**Status:** ✅ Git repository pushed, ⏳ Additional files need transfer

---

## What Was Completed ✅

### 1. Git Repository Pushed to Remote Gitea

**Remote URL:** http://192.168.1.41:4000/ggq-admin/navidocs

**Branches Pushed:**
- `master` (main branch)
- `feature/single-tenant-features`
- `fix/pdf-canvas-loop`
- `fix/toc-polish`
- `image-extraction-api`
- `image-extraction-backend`
- `image-extraction-frontend`
- `ui-smoketest-20251019`

**What's Included:**
- ✅ All source code (client + server)
- ✅ All documentation (33+ markdown files)
- ✅ Test suite and security audits
- ✅ Configuration templates (.env.example)
- ✅ Git history (all commits)

**Access:**
- Web: http://192.168.1.41:4000/ggq-admin/navidocs
- Clone: `git clone http://192.168.1.41:4000/ggq-admin/navidocs.git`

---

## What's Still Missing ⚠️

Git only transfers files tracked by the repository. Several important files are excluded by `.gitignore`:

### Missing Files (155 MB total):

1. **uploads/** directory - **153 MB**
   - 18+ PDF documents
   - UUID-named files (uploaded documents)
   - Required for document viewing

2. **server/db/navidocs.db** - **2 MB**
   - SQLite database with ALL document metadata
   - Contains user data, OCR results, search index mappings
   - **CRITICAL** - without this, the app won't know about uploaded documents

3. **.env** file
   - Environment variables and secrets
   - Database paths, API keys, Meilisearch keys
   - Should be created fresh on remote (use .env.example as template)

4. **node_modules/** directories
   - Not needed - reinstall with `npm install`

5. **data.ms/** - Meilisearch data
   - Can be rebuilt from database

---

## How to Transfer Missing Files

### Option 1: Use rsync Script (Recommended) ✅

I've created a script that transfers everything:

```bash
cd /home/setup/navidocs
./transfer-complete-to-remote.sh
```

**What it does:**
- Transfers uploads/ directory (153 MB)
- Transfers database file (2 MB)
- Transfers .env.example
- Excludes node_modules (save bandwidth)
- Shows progress bar
- Verifies transfer

**Requirements:**
- SSH access to 192.168.1.41 as ggq-admin (or claude)
- Password: Admin_GGQ-2025! (you'll be prompted)

### Option 2: Manual Transfer via SCP

```bash
# Transfer uploads directory
scp -r /home/setup/navidocs/uploads ggq-admin@192.168.1.41:/home/ggq-admin/navidocs/

# Transfer database
scp /home/setup/navidocs/server/db/navidocs.db ggq-admin@192.168.1.41:/home/ggq-admin/navidocs/server/db/

# Transfer .env (optional, better to create fresh)
scp /home/setup/navidocs/server/.env.example ggq-admin@192.168.1.41:/home/ggq-admin/navidocs/server/
```

### Option 3: Create Tarball and Transfer

```bash
# Create tarball of missing files
cd /home/setup/navidocs
tar -czf navidocs-data.tar.gz uploads/ server/db/navidocs.db

# Transfer tarball
scp navidocs-data.tar.gz ggq-admin@192.168.1.41:/home/ggq-admin/

# SSH into remote and extract
ssh ggq-admin@192.168.1.41
cd /home/ggq-admin/navidocs
tar -xzf ../navidocs-data.tar.gz
```

---

## Setup on Remote Server

Once all files are transferred:

### 1. SSH into Remote Server

```bash
ssh ggq-admin@192.168.1.41
# Password: Admin_GGQ-2025!
```

### 2. Navigate to Repository

```bash
cd /home/ggq-admin/navidocs
```

### 3. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 4. Configure Environment

```bash
# Copy example env file
cp server/.env.example server/.env

# Edit with production values
nano server/.env
```

**Important .env settings for production:**
```env
# Server
NODE_ENV=production
PORT=8001

# Database
DB_PATH=./db/navidocs.db

# Meilisearch
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=<generate-secure-key>

# Security
JWT_SECRET=<generate-secure-secret>
```

### 5. Start Services

```bash
# Terminal 1: Redis (if not already running)
redis-server

# Terminal 2: Meilisearch
meilisearch --master-key=<your-secure-key>

# Terminal 3: Backend
cd /home/ggq-admin/navidocs/server
node index.js

# Terminal 4: Frontend (dev mode)
cd /home/ggq-admin/navidocs/client
npm run dev

# OR build for production:
cd /home/ggq-admin/navidocs/client
npm run build
# Then serve with nginx or apache
```

### 6. Verify Everything Works

```bash
# Check backend is running
curl http://localhost:8001/api/health

# Check Meilisearch
curl http://localhost:7700/health

# Check uploaded documents
ls -lh /home/ggq-admin/navidocs/uploads/

# Check database
sqlite3 /home/ggq-admin/navidocs/server/db/navidocs.db ".tables"
```

---

## File Transfer Status

| Category | Status | Size | Method |
|----------|--------|------|--------|
| Git Repository | ✅ Complete | ~10 MB | `git push` |
| Source Code | ✅ Complete | Included in git | - |
| Documentation | ✅ Complete | Included in git | - |
| **Uploads/** | ⏳ Pending | **153 MB** | rsync/scp |
| **Database** | ⏳ Pending | **2 MB** | rsync/scp |
| .env file | ⏳ Manual | <1 KB | Create fresh |
| node_modules | ⏳ Reinstall | ~200 MB | `npm install` |

---

## Security Considerations

### Sensitive Files to Handle Carefully:

1. **.env file**
   - Contains API keys and secrets
   - **DO NOT** commit to git
   - Create fresh on remote with production values

2. **SQLite database**
   - Contains user data and document metadata
   - Encrypt during transfer (rsync over SSH does this)
   - Backup before major changes

3. **uploads/ directory**
   - Contains actual document PDFs
   - Some may contain sensitive information
   - Ensure proper file permissions on remote

### Recommended Permissions:

```bash
# On remote server
cd /home/ggq-admin/navidocs

# Secure .env file
chmod 600 server/.env

# Secure database
chmod 600 server/db/navidocs.db

# Secure uploads
chmod 700 uploads
chmod 600 uploads/*
```

---

## Quick Command Reference

### Transfer Complete Repository

```bash
# Run the automated script
cd /home/setup/navidocs
./transfer-complete-to-remote.sh
```

### Verify Transfer

```bash
ssh ggq-admin@192.168.1.41 "
    cd /home/ggq-admin/navidocs
    echo 'Total size:'
    du -sh .
    echo ''
    echo 'Uploads:'
    du -sh uploads
    echo ''
    echo 'Database:'
    ls -lh server/db/navidocs.db
    echo ''
    echo 'Upload count:'
    ls uploads | wc -l
"
```

### Clone Repository on Remote

```bash
ssh ggq-admin@192.168.1.41
cd /home/ggq-admin
git clone http://192.168.1.41:4000/ggq-admin/navidocs.git
cd navidocs
git status
```

---

## Troubleshooting

### Issue: "Connection refused" during transfer

**Solution:**
```bash
# Test SSH connection first
ssh ggq-admin@192.168.1.41 "echo 'Connection works'"

# If fails, check:
# 1. Remote server is running
# 2. SSH service is running on remote
# 3. Firewall allows port 22
```

### Issue: "Permission denied" during rsync

**Solution:**
```bash
# Ensure remote directory exists
ssh ggq-admin@192.168.1.41 "mkdir -p /home/ggq-admin/navidocs"

# Check permissions
ssh ggq-admin@192.168.1.41 "ls -ld /home/ggq-admin/navidocs"
```

### Issue: Database file not found after transfer

**Solution:**
```bash
# Verify database exists locally
ls -lh /home/setup/navidocs/server/db/navidocs.db

# Transfer manually if needed
scp /home/setup/navidocs/server/db/navidocs.db \\
    ggq-admin@192.168.1.41:/home/ggq-admin/navidocs/server/db/
```

---

## Verification Checklist

After completing transfer, verify:

- [ ] Git repository accessible at http://192.168.1.41:4000/ggq-admin/navidocs
- [ ] All 8 branches visible in Gitea web interface
- [ ] uploads/ directory present on remote (153 MB)
- [ ] navidocs.db present on remote (2 MB)
- [ ] node_modules installed on remote (`npm install` completed)
- [ ] .env configured with production values
- [ ] Redis running and accessible
- [ ] Meilisearch running and accessible
- [ ] Backend starts without errors (`node server/index.js`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Can access uploaded documents via API
- [ ] Search functionality works
- [ ] Database queries return expected data

---

## Summary

**Completed:**
- ✅ Git repository pushed (8 branches, all code and docs)
- ✅ Transfer scripts created and ready

**Remaining:**
- ⏳ Transfer uploads/ directory (153 MB) - Run `./transfer-complete-to-remote.sh`
- ⏳ Transfer database file (2 MB) - Included in transfer script
- ⏳ Configure .env on remote - Manual step after transfer
- ⏳ Install dependencies on remote - `npm install` after transfer

**Estimated Transfer Time:**
- rsync transfer: 5-10 minutes (depending on network speed)
- npm install: 3-5 minutes per directory (server + client)
- Configuration: 2-3 minutes

**Total Time:** ~15-20 minutes

---

**Created:** 2025-10-24
**Remote Server:** 192.168.1.41:4000
**Gitea User:** ggq-admin
**Repository:** http://192.168.1.41:4000/ggq-admin/navidocs
