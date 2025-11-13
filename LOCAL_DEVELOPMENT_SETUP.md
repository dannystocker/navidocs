# Local Development Setup - Same Config as Production

**Purpose:** Run NaviDocs locally with identical configuration to production (StackCP)
**Use Case:** Development, testing, offline demos, customer installations

---

## Quick Start (5 minutes)

```bash
cd /home/setup/navidocs
cp server/.env.production server/.env.local
./start-all.sh
```

**Access:**
- Frontend: http://localhost:8081
- Backend API: http://localhost:8001
- Meilisearch: http://localhost:7700

---

## Prerequisites

**Required:**
- Node.js v20+ (installed: v20.19.5)
- npm v10+ (installed: v10.8.2)
- SQLite3
- Tesseract OCR

**Optional:**
- Redis (for background jobs)
- Meilisearch binary (for search)

**Check installations:**
```bash
node --version  # v20.19.5
npm --version   # v10.8.2
sqlite3 --version  # 3.x
tesseract --version  # 5.x
```

---

## Step 1: Clone and Install (2 minutes)

```bash
cd /home/setup/navidocs

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

cd ..
```

**Expected packages:**
- Server: 292 packages
- Client: 167 packages

---

## Step 2: Environment Configuration (3 minutes)

### Option A: Copy from Production

```bash
cp server/.env.production server/.env.local
```

### Option B: Create Fresh

Create `server/.env.local`:

```bash
# Server
NODE_ENV=development
PORT=8001
HOST=localhost

# Database
DATABASE_PATH=./db/navidocs.db

# JWT & Security (SAME AS PRODUCTION)
JWT_SECRET=your_production_jwt_secret_here
SESSION_SECRET=your_production_session_secret_here

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=524288000

# OCR Worker
OCR_CONCURRENCY=2
OCR_TIMEOUT=300000

# Meilisearch (Local)
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=your_local_meilisearch_key

# Redis (Optional - for background jobs)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Client URL
CLIENT_URL=http://localhost:8081
```

**Important:** Use SAME JWT_SECRET and SESSION_SECRET as production so tokens work across environments!

---

## Step 3: Database Setup (1 minute)

```bash
cd server

# Initialize database
node init-database.js

# Run all migrations
for migration in migrations/*.sql; do
  node run-migration.js $(basename $migration)
done

# Verify tables created
sqlite3 db/navidocs.db ".tables"
```

**Expected tables:**
```
activity_log                  equipment_inventory
compliance_certifications     equipment_service_history
contacts                      equipment_documents
documents                     fuel_logs
document_images               expenses
document_text                 maintenance_tasks
organizations                 users
```

---

## Step 4: Start Services (2 minutes)

### Option A: All-in-One Script

```bash
./start-all.sh
```

This starts:
- Meilisearch (port 7700)
- Redis (port 6379)
- Backend server (port 8001)
- Frontend dev server (port 8081)

### Option B: Manual Start (separate terminals)

**Terminal 1 - Meilisearch:**
```bash
./meilisearch --master-key=your_local_key --http-addr=localhost:7700
```

**Terminal 2 - Redis (optional):**
```bash
redis-server --port 6379
```

**Terminal 3 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 4 - Frontend:**
```bash
cd client
npm run dev
```

---

## Step 5: Verify Installation (2 minutes)

### Health Checks

```bash
# Backend API
curl http://localhost:8001/health
# Expected: {"status":"ok","database":"connected","timestamp":...}

# Frontend
curl -I http://localhost:8081
# Expected: 200 OK

# Meilisearch
curl http://localhost:7700/health
# Expected: {"status":"available"}
```

### Test Account

**Create test user:**
```bash
cd server
node scripts/create-test-user.js
```

**Login:**
- Email: test@navidocs.local
- Password: TestPassword123
- Organization: Test Organization

---

## Step 6: Load Demo Data (5 minutes)

```bash
cd server

# Seed demo equipment (10 items)
node seed-inventory-demo-data.js

# Seed demo contacts (20 items)
node seed-crew-contacts-demo.js

# Seed demo compliance (12 items)
node seed-compliance-demo.js

# Seed demo expenses (40 items)
node seed-fuel-expense-demo.js

# Upload sample documents
curl -X POST http://localhost:8001/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-manual.pdf" \
  -F "title=Sample Boat Manual"
```

---

## Production vs Local Differences

| Aspect | Production (StackCP) | Local Development |
|--------|---------------------|-------------------|
| **Frontend** | Static build (dist/) | Dev server (Vite) |
| **Backend** | PM2/systemd process | npm run dev |
| **Database** | ~/navidocs-data/db/navidocs.db | ./server/db/navidocs.db |
| **Uploads** | ~/navidocs-data/uploads/ | ./server/uploads/ |
| **Logs** | ~/navidocs-data/logs/ | ./server/logs/ |
| **Meilisearch** | External service | Local binary |
| **Redis** | External service (optional) | Local (optional) |
| **HTTPS** | Yes (Apache proxy) | No (HTTP only) |
| **Domain** | https://digital-lab.ca/navidocs/ | http://localhost:8081 |

---

## Syncing Local ↔ Production

### Export Production Data to Local

```bash
# Export database from production
ssh stackcp "sqlite3 ~/navidocs-data/db/navidocs.db .dump" > production-backup.sql

# Import to local
sqlite3 server/db/navidocs.db < production-backup.sql

# Download uploads
rsync -avz stackcp:~/navidocs-data/uploads/ server/uploads/
```

### Export Local Data to Production

```bash
# Backup production first!
ssh stackcp "sqlite3 ~/navidocs-data/db/navidocs.db .dump > ~/backups/navidocs-$(date +%Y%m%d).sql"

# Export local database
sqlite3 server/db/navidocs.db .dump > local-export.sql

# Import to production
scp local-export.sql stackcp:~/
ssh stackcp "sqlite3 ~/navidocs-data/db/navidocs.db < ~/local-export.sql"

# Upload files
rsync -avz server/uploads/ stackcp:~/navidocs-data/uploads/
```

---

## Development Workflow

### Making Changes

1. **Edit code** in `server/` or `client/`
2. **Changes auto-reload** (Vite HMR + nodemon)
3. **Test locally** at http://localhost:8081
4. **Commit to git:**
   ```bash
   git add .
   git commit -m "[FEATURE] Description"
   git push origin feature/my-feature
   ```

### Deploying to Production

1. **Merge to main:**
   ```bash
   git checkout navidocs-cloud-coordination
   git merge feature/my-feature
   git push origin navidocs-cloud-coordination
   ```

2. **Deploy to StackCP:**
   ```bash
   ./deploy-stackcp.sh production
   ```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :8001  # or :8081, :7700

# Kill process
kill -9 <PID>

# Or change port in .env.local
PORT=8002
```

### Database Locked

```bash
# Check for other SQLite connections
lsof | grep navidocs.db

# If stuck, restart services
./stop-all.sh
./start-all.sh
```

### Meilisearch Not Starting

```bash
# Check if binary exists
ls -la ./meilisearch

# Make executable
chmod +x ./meilisearch

# Check logs
tail -f server/logs/meilisearch.log
```

### Frontend Build Errors

```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Missing Uploads

```bash
# Verify upload directory exists
mkdir -p server/uploads

# Check permissions
chmod 755 server/uploads

# Check .env configuration
cat server/.env.local | grep UPLOAD_DIR
```

---

## Configuration Parity Checklist

Use this to ensure local matches production:

**Environment Variables:**
- [ ] JWT_SECRET matches production
- [ ] SESSION_SECRET matches production
- [ ] MEILI_MASTER_KEY configured
- [ ] DATABASE_PATH points to correct location
- [ ] UPLOAD_DIR exists and writable
- [ ] CLIENT_URL matches local URL

**Database:**
- [ ] All migrations run (check: `.tables` shows all tables)
- [ ] Test user created
- [ ] Demo data loaded (optional)

**Services:**
- [ ] Meilisearch running (port 7700)
- [ ] Redis running (port 6379, optional)
- [ ] Backend API running (port 8001)
- [ ] Frontend dev server running (port 8081)

**Health Checks:**
- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend loads in browser
- [ ] Meilisearch health endpoint returns "available"
- [ ] Can create account and login
- [ ] Can upload document
- [ ] Can search uploaded document
- [ ] Timeline shows activity

---

## Production Deployment Checklist

When deploying tested local changes to production:

**Pre-Deployment:**
- [ ] All tests passing locally
- [ ] Database migrations tested
- [ ] Environment variables verified
- [ ] Backup production database
- [ ] Review PRE_DEPLOYMENT_CHECKLIST.md

**Deployment:**
- [ ] Run `./deploy-stackcp.sh production`
- [ ] Verify frontend build succeeded
- [ ] Verify backend started successfully
- [ ] Check PM2 process status: `ssh stackcp "pm2 list"`
- [ ] Verify health endpoint: `curl https://api.digital-lab.ca/navidocs/health`

**Post-Deployment:**
- [ ] Test all 3 core features (OCR, Multi-format, Timeline)
- [ ] Check error logs: `ssh stackcp "tail -50 ~/navidocs-data/logs/error.log"`
- [ ] Monitor for 30 minutes
- [ ] Update deployment notes

---

## Quick Commands

```bash
# Start everything
./start-all.sh

# Stop everything
./stop-all.sh

# Restart backend only
cd server && npm run dev

# Restart frontend only
cd client && npm run dev

# View logs
tail -f server/logs/app.log
tail -f server/logs/ocr-worker.log

# Check service status
curl http://localhost:8001/health
curl http://localhost:8081

# Database console
sqlite3 server/db/navidocs.db

# Clear all data (fresh start)
rm server/db/navidocs.db
rm -rf server/uploads/*
node server/init-database.js

# Build for production (test)
cd client && npm run build
cd ../server && NODE_ENV=production node index.js
```

---

## Docker Alternative (Optional)

For easier local setup, use Docker:

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./server
    ports:
      - "8001:8001"
    environment:
      - NODE_ENV=development
      - DATABASE_PATH=/data/navidocs.db
    volumes:
      - ./server:/app
      - ./data:/data

  frontend:
    build: ./client
    ports:
      - "8081:8081"
    environment:
      - VITE_API_URL=http://localhost:8001

  meilisearch:
    image: getmeili/meilisearch:v1.5
    ports:
      - "7700:7700"
    environment:
      - MEILI_MASTER_KEY=localkey123

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

**Run:**
```bash
docker-compose up -d
```

---

## Next Steps

1. **Customize for your use case:**
   - Update branding (logo, colors)
   - Add custom fields for your organization
   - Configure backup schedules

2. **Add features:**
   - Pick from Sessions 6-10 (Inventory, Maintenance, Crew, Compliance, Fuel/Expense)
   - Follow builder prompts in `builder/prompts/current/`

3. **Deploy to production:**
   - Test locally first
   - Use `./deploy-stackcp.sh production`
   - Monitor logs

4. **Scale up:**
   - Add more organizations
   - Enable multi-user collaboration
   - Set up automated backups

---

## Support

**Documentation:**
- Architecture: `/home/setup/navidocs/ARCHITECTURE-SUMMARY.md`
- API Reference: `/home/setup/navidocs/docs/DEVELOPER.md`
- User Guide: `/home/setup/navidocs/docs/USER_GUIDE.md`

**Troubleshooting:**
- Debug guide: `/home/setup/navidocs/SESSION_DEBUG_BLOCKERS.md`
- Deployment guide: `/home/setup/navidocs/STACKCP_DEPLOYMENT_GUIDE.md`

**Community:**
- GitHub: https://github.com/dannystocker/navidocs
- Issues: Report bugs on GitHub Issues

---

**You're ready! Local dev environment matches production. Start building! 🚀**
