# Cloud Session 5: Deployment & Documentation

**Session ID:** session-5
**Role:** DevOps Engineer + Technical Writer
**Priority:** P0 (Launch readiness)
**Estimated Time:** 90 minutes
**Dependencies:** Sessions 1-4 must be complete and merged

---

## Your Mission

Prepare NaviDocs v1.0 for production deployment: create deployment scripts, write documentation, verify all systems, and push to StackCP hosting.

**Current State:**
- All features implemented and tested (Sessions 1-4)
- Running locally on ports 8001 (backend) and 8081 (frontend)
- Database: SQLite (local)
- Search: Meilisearch (local)

**Expected Outcome:**
- Production-ready deployment to StackCP
- Complete documentation for users and developers
- Automated backup and monitoring
- Version tagged as v1.0-production

---

## Implementation Steps

### Phase 1: Deployment Preparation (30 min)

#### Step 1.1: Create Production Environment File (10 min)

**File:** `server/.env.production` (NEW)

```env
# NaviDocs Production Environment
NODE_ENV=production
PORT=8001

# Database
DATABASE_PATH=./navidocs.production.db

# Security
JWT_SECRET=[GENERATE_STRONG_SECRET]
SESSION_SECRET=[GENERATE_STRONG_SECRET]

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=[PRODUCTION_KEY]

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=[PRODUCTION_PASSWORD]

# OCR
OCR_LANGUAGE=eng
OCR_MIN_TEXT_THRESHOLD=50
FORCE_OCR_ALL_PAGES=false

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/navidocs.log

# CORS (update with actual domain)
CORS_ORIGIN=https://navidocs.yourdomain.com
```

**Generate secrets:**
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Meilisearch key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 1.2: Create Deployment Script (10 min)

**File:** `deploy-stackcp.sh` (NEW)

```bash
#!/bin/bash
# NaviDocs StackCP Deployment Script

set -e  # Exit on error

echo "🚀 NaviDocs Deployment Starting..."

# Configuration
STACKCP_HOST="your-stackcp-host.com"
STACKCP_USER="your-username"
DEPLOY_PATH="/path/to/navidocs"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Color

# Step 1: Build Frontend
echo "${YELLOW}📦 Building frontend...${NC}"
cd client
npm run build
cd ..

# Step 2: Create deployment package
echo "${YELLOW}📦 Creating deployment package...${NC}"
tar -czf navidocs-deploy.tar.gz \
  server/ \
  client/dist/ \
  .env.production \
  package.json \
  start-all.sh \
  --exclude=node_modules \
  --exclude=*.log

# Step 3: Upload to StackCP
echo "${YELLOW}📤 Uploading to StackCP...${NC}"
scp navidocs-deploy.tar.gz ${STACKCP_USER}@${STACKCP_HOST}:${DEPLOY_PATH}/

# Step 4: Deploy on StackCP
echo "${YELLOW}🔧 Deploying on server...${NC}"
ssh ${STACKCP_USER}@${STACKCP_HOST} << 'ENDSSH'
cd /path/to/navidocs

# Backup current version
if [ -d "server" ]; then
  echo "Creating backup..."
  tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz server/ client/ uploads/ navidocs.db
fi

# Extract new version
tar -xzf navidocs-deploy.tar.gz

# Install dependencies
cd server
npm install --production

# Run migrations
npm run migrate

# Restart services
pm2 restart navidocs-api || pm2 start server/index.js --name navidocs-api
pm2 restart meilisearch || pm2 start meilisearch --name meilisearch -- --db-path ./meili_data

pm2 save

echo "✅ Deployment complete!"
ENDSSH

echo "${GREEN}✅ NaviDocs deployed successfully!${NC}"
echo "Visit: https://navidocs.yourdomain.com"

# Cleanup
rm navidocs-deploy.tar.gz
```

```bash
chmod +x deploy-stackcp.sh
```

#### Step 1.3: Create Database Backup Script (10 min)

**File:** `scripts/backup-database.sh` (NEW)

```bash
#!/bin/bash
# NaviDocs Database Backup Script

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DB_FILE="./navidocs.db"
UPLOAD_DIR="./uploads"

mkdir -p $BACKUP_DIR

echo "🔐 Starting backup..."

# Backup database
sqlite3 $DB_FILE ".backup '$BACKUP_DIR/navidocs-db-$TIMESTAMP.db'"

# Backup uploads folder
tar -czf "$BACKUP_DIR/navidocs-uploads-$TIMESTAMP.tar.gz" $UPLOAD_DIR

echo "✅ Backup complete:"
echo "  - Database: $BACKUP_DIR/navidocs-db-$TIMESTAMP.db"
echo "  - Uploads: $BACKUP_DIR/navidocs-uploads-$TIMESTAMP.tar.gz"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "navidocs-db-*.db" -mtime +7 -delete
find $BACKUP_DIR -name "navidocs-uploads-*.tar.gz" -mtime +7 -delete

echo "🗑️  Old backups cleaned up (kept last 7 days)"
```

```bash
chmod +x scripts/backup-database.sh
```

**Add to crontab for daily backups:**
```bash
# Run at 2 AM daily
0 2 * * * /path/to/navidocs/scripts/backup-database.sh
```

---

### Phase 2: Documentation (30 min)

#### Step 2.1: User Documentation (15 min)

**File:** `docs/USER_GUIDE.md` (NEW)

```markdown
# NaviDocs User Guide

**Version:** 1.0
**Last Updated:** 2025-11-13

---

## Getting Started

### 1. Login

Navigate to https://navidocs.yourdomain.com and login with your credentials:

- Email: your-email@example.com
- Password: [provided by admin]

### 2. Dashboard Overview

The dashboard shows:
- Total documents uploaded
- Recent activity
- Storage usage
- Quick actions

---

## Uploading Documents

### Supported File Types

NaviDocs accepts:
- **PDFs:** Owner manuals, service records, warranties
- **Images:** JPG, PNG, WebP (boat photos, diagrams)
- **Word Documents:** DOCX (service reports)
- **Excel Spreadsheets:** XLSX (inventory, maintenance logs)
- **Text Files:** TXT, MD (notes)

### How to Upload

1. Click **"Upload"** in navigation
2. Select file (max 50MB)
3. Enter document title
4. Choose document type (manual, warranty, service, etc.)
5. Click **"Upload Document"**

**Smart Processing:**
- PDFs with native text: Processed in ~5 seconds
- Scanned documents: OCR applied automatically
- Images: Optical character recognition for searchability
- Word/Excel: Text extracted instantly

---

## Searching Documents

### Quick Search

Use the search bar at top:

```
Example searches:
- "bilge pump"
- "engine oil"
- "warranty expiration"
- "service 2024"
```

Results show:
- Document title
- Relevant excerpt with highlights
- Document type
- Upload date

### Advanced Search

Filter by:
- **Document Type:** Manual, Warranty, Service, Insurance
- **Date Range:** Last week, month, year, custom
- **File Format:** PDF, Image, Word, Excel

---

## Timeline

View all organization activity chronologically:

1. Click **"Timeline"** in navigation
2. See events grouped by date:
   - Today
   - Yesterday
   - This Week
   - This Month
   - Older

### Event Types

- 📄 Document uploads
- 🔧 Maintenance records (future)
- ⚠️ Warranty claims (future)

### Filtering Timeline

Use dropdown to filter by:
- All events
- Document uploads only
- Maintenance logs only

---

## Best Practices

### Organize Documents

**Use descriptive titles:**
- ✅ "Azimut 55S Owner Manual 2020"
- ❌ "manual.pdf"

**Choose correct document type:**
- Owner manuals → "Manual"
- Service receipts → "Service Record"
- Insurance policies → "Insurance"
- Warranties → "Warranty"

### Regular Uploads

- Upload documents as you receive them
- Don't wait for "spring cleaning"
- Keep photos organized with descriptive names

### Search Tips

- Use specific terms: "bilge pump maintenance" vs "pump"
- Search by brand names: "Volvo Penta"
- Use date keywords: "2024" or "January"

---

## Troubleshooting

### Upload Failed

**"File too large"**
→ Compress PDF or split into smaller files (max 50MB)

**"Unsupported file type"**
→ Convert to PDF, JPG, or DOCX

**"Upload timeout"**
→ Check internet connection, try again

### Search Not Working

**No results for recent upload:**
→ Wait 30 seconds for indexing to complete

**Search returns wrong documents:**
→ Use more specific search terms

### General Issues

**Can't login:**
→ Reset password or contact admin

**Page not loading:**
→ Clear browser cache, try incognito mode

---

## Support

Need help? Contact:
- Email: support@navidocs.com
- Phone: [support number]

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search |
| `Ctrl+U` | Open upload form |
| `Esc` | Close modal |

---

**Happy sailing! ⛵**
```

#### Step 2.2: Developer Documentation (15 min)

**File:** `docs/DEVELOPER.md` (NEW)

```markdown
# NaviDocs Developer Guide

**Version:** 1.0
**Tech Stack:** Node.js + Express + Vue 3 + SQLite + Meilisearch

---

## Architecture

### Backend (Express.js)

```
server/
├── index.js              # Main server
├── config/
│   └── db.js             # SQLite connection
├── routes/
│   ├── upload.js         # File upload API
│   ├── search.js         # Search API
│   ├── timeline.js       # Timeline API
│   └── auth.js           # Authentication
├── services/
│   ├── ocr.js            # OCR processing
│   ├── pdf-text-extractor.js   # Native PDF text extraction
│   ├── document-processor.js   # Multi-format routing
│   ├── activity-logger.js      # Timeline logging
│   └── file-safety.js    # File validation
├── workers/
│   └── ocr-worker.js     # Background OCR jobs
└── migrations/
    └── 010_activity_timeline.sql
```

### Frontend (Vue 3 + Vite)

```
client/src/
├── views/
│   ├── Dashboard.vue
│   ├── Documents.vue
│   ├── Timeline.vue
│   └── Upload.vue
├── components/
│   ├── AppHeader.vue
│   ├── SearchBar.vue
│   └── UploadForm.vue
├── router/
│   └── index.js
└── utils/
    └── errorHandler.js
```

---

## Key Features

### 1. Smart OCR (Session 1)

**Problem:** 100-page PDFs took 3+ minutes with Tesseract

**Solution:** Hybrid approach
- Extract native PDF text first (pdfjs-dist)
- Only OCR pages with <50 characters
- Performance: 180s → 5s (36x speedup)

**Implementation:**
```javascript
// server/services/pdf-text-extractor.js
export async function extractNativeTextPerPage(pdfPath) {
  const data = new Uint8Array(readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  // Extract text from each page
}

// server/services/ocr.js
if (await hasNativeText(pdfPath)) {
  // Use native text
} else {
  // Fallback to OCR
}
```

### 2. Multi-Format Upload (Session 2)

**Supported Formats:**
- PDF: Native text + OCR fallback
- Images: Tesseract OCR
- Word (DOCX): Mammoth text extraction
- Excel (XLSX): Sheet-to-CSV conversion
- Text (TXT, MD): Direct read

**Implementation:**
```javascript
// server/services/document-processor.js
export async function processDocument(filePath, options) {
  const category = getFileCategory(filePath);

  switch (category) {
    case 'pdf': return await extractTextFromPDF(filePath, options);
    case 'image': return await processImageFile(filePath, options);
    case 'word': return await processWordDocument(filePath, options);
    case 'excel': return await processExcelDocument(filePath, options);
    case 'text': return await processTextFile(filePath, options);
  }
}
```

### 3. Timeline Feature (Session 3)

**Database Schema:**
```sql
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

**Auto-logging:**
```javascript
// After successful upload
await logActivity({
  organizationId: orgId,
  userId: req.user.id,
  eventType: 'document_upload',
  eventTitle: title,
  referenceId: documentId,
  referenceType: 'document'
});
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Documents
- `POST /api/upload` - Upload document (multipart/form-data)
- `GET /api/documents` - List documents
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document

### Search
- `POST /api/search` - Search documents (body: {q, limit, offset})

### Timeline
- `GET /api/organizations/:orgId/timeline` - Get activity timeline

---

## Environment Variables

```env
NODE_ENV=production
PORT=8001
DATABASE_PATH=./navidocs.db
JWT_SECRET=[64-char hex]
MEILISEARCH_HOST=http://localhost:7700
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
OCR_MIN_TEXT_THRESHOLD=50
```

---

## Development Setup

```bash
# Clone repo
git clone https://github.com/dannystocker/navidocs.git
cd navidocs

# Install dependencies
cd server && npm install
cd ../client && npm install

# Create .env
cp server/.env.example server/.env

# Run migrations
cd server && npm run migrate

# Start services
cd .. && ./start-all.sh

# Backend: http://localhost:8001
# Frontend: http://localhost:8081
```

---

## Testing

### Manual Testing
```bash
# Upload test
curl -X POST http://localhost:8001/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"

# Search test
curl -X POST http://localhost:8001/api/search \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"q":"bilge"}'
```

### E2E Testing
```bash
cd client
npm run test:e2e
```

---

## Deployment

### Production Checklist

- [ ] Update .env.production with secure secrets
- [ ] Build frontend: `cd client && npm run build`
- [ ] Run database migrations
- [ ] Configure SSL certificate
- [ ] Set up PM2 for process management
- [ ] Configure Nginx reverse proxy
- [ ] Set up daily backups (cron job)
- [ ] Configure monitoring (PM2 logs)

### Deploy to StackCP

```bash
./deploy-stackcp.sh
```

---

## Performance

### Benchmarks

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Native PDF (100 pages) | 180s | 5s | 36x |
| Image OCR | 3s | 3s | - |
| Word doc upload | N/A | 0.8s | New |
| Search query | <10ms | <10ms | - |

### Optimization Tips

- Use smart OCR for PDFs
- Index documents in background workers
- Cache search results in Redis
- Compress images before upload

---

## Troubleshooting

### OCR Worker Not Processing

```bash
# Check worker status
ps aux | grep ocr-worker

# View logs
tail -f /tmp/navidocs-ocr-worker.log

# Restart worker
pm2 restart navidocs-ocr-worker
```

### Meilisearch Not Responding

```bash
# Check status
curl http://localhost:7700/health

# Restart
pm2 restart meilisearch
```

### Database Locked

```bash
# Check for zombie processes
lsof | grep navidocs.db

# Kill zombie process
kill -9 [PID]
```

---

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes with tests
3. Commit: `git commit -m "[FEATURE] Your feature description"`
4. Push: `git push origin feature/your-feature`
5. Create Pull Request

---

## License

Proprietary - All rights reserved

---

**Questions? Contact the development team.**
```

---

### Phase 3: Final Verification & Deployment (30 min)

#### Step 3.1: Pre-Flight Checklist (10 min)

**File:** `PRE_DEPLOYMENT_CHECKLIST.md` (NEW)

```markdown
# Pre-Deployment Checklist

Run before deploying to production:

## Code Quality
- [ ] All feature branches merged to main
- [ ] No console.log() in production code
- [ ] No TODO/FIXME comments
- [ ] Code formatted consistently
- [ ] No unused imports

## Testing
- [ ] All API endpoints tested manually
- [ ] Upload flow works for all file types
- [ ] Search returns accurate results
- [ ] Timeline loads and paginates correctly
- [ ] Mobile responsive on 3 screen sizes
- [ ] No browser console errors

## Security
- [ ] JWT secrets are 64+ characters
- [ ] .env.production created with unique secrets
- [ ] No hardcoded credentials
- [ ] File upload size limits enforced
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified

## Performance
- [ ] Smart OCR working (<10s for text PDFs)
- [ ] Search response time <50ms
- [ ] Frontend build size <2MB
- [ ] Images optimized
- [ ] No memory leaks

## Database
- [ ] All migrations run successfully
- [ ] Indexes created on activity_log
- [ ] Foreign keys configured
- [ ] Backup script tested

## Documentation
- [ ] USER_GUIDE.md complete
- [ ] DEVELOPER.md complete
- [ ] API documented
- [ ] Environment variables documented

## Deployment
- [ ] deploy-stackcp.sh configured with correct host
- [ ] SSH access to StackCP verified
- [ ] PM2 configuration ready
- [ ] Backup strategy defined
- [ ] Rollback plan documented

## Post-Deployment
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Monitoring alerts configured
- [ ] First backup completed
- [ ] Version tagged in git
```

#### Step 3.2: Create Production Tag (5 min)

```bash
# Ensure all changes committed
git add .
git commit -m "[RELEASE] NaviDocs v1.0 - Production Ready

Features:
- Smart OCR (36x speedup)
- Multi-format uploads (PDF, JPG, DOCX, XLSX, TXT, MD)
- Organization timeline with activity feed
- Mobile responsive design
- Production deployment scripts
- Complete documentation

Sessions completed: 1-5
Status: Production ready"

# Tag release
git tag -a v1.0-production -m "NaviDocs v1.0 - Production Release

All features tested and ready for deployment:
- Smart OCR optimization
- Multi-format document processing
- Timeline feature
- UI polish and responsive design
- Deployment automation

Deployment target: StackCP
Last updated: 2025-11-13"

# Push tag
git push origin v1.0-production
git push origin navidocs-cloud-coordination
```

#### Step 3.3: Deploy to StackCP (15 min)

```bash
# Run deployment script
./deploy-stackcp.sh

# Verify deployment
ssh stackcp-user@stackcp-host

# On server:
cd /path/to/navidocs

# Check services
pm2 list

# Should show:
# ├─ navidocs-api (online)
# ├─ meilisearch (online)
# └─ navidocs-ocr-worker (online)

# Test API
curl http://localhost:8001/health

# View logs
pm2 logs navidocs-api --lines 50

# Exit server
exit
```

---

## Success Criteria

- [ ] Production .env file created with secure secrets
- [ ] Deployment script created and tested
- [ ] Backup script created and scheduled
- [ ] User guide complete (USER_GUIDE.md)
- [ ] Developer guide complete (DEVELOPER.md)
- [ ] Pre-deployment checklist 100% checked
- [ ] Version tagged as v1.0-production
- [ ] Deployed to StackCP successfully
- [ ] All services running (PM2)
- [ ] SSL certificate installed
- [ ] Domain accessible via HTTPS
- [ ] First backup completed
- [ ] Monitoring alerts configured

---

## Completion Report

```markdown
# Session 5: Deployment & Documentation - COMPLETE ✅

**Branch:** navidocs-cloud-coordination
**Tag:** v1.0-production
**Commit:** [hash]
**Duration:** [actual time]

## Deployment Artifacts Created:

### Scripts:
- ✅ deploy-stackcp.sh (automated deployment)
- ✅ backup-database.sh (daily backups via cron)
- ✅ .env.production (secure configuration)

### Documentation:
- ✅ USER_GUIDE.md (15-page user manual)
- ✅ DEVELOPER.md (API docs, architecture, troubleshooting)
- ✅ PRE_DEPLOYMENT_CHECKLIST.md (27-item checklist)

### Deployment Status:

**StackCP Deployment:**
- ✅ Files uploaded to server
- ✅ Dependencies installed (npm install --production)
- ✅ Database migrated
- ✅ PM2 processes started
- ✅ SSL certificate installed
- ✅ Domain DNS configured

**Services Running:**
- PM2 Process Manager: 3/3 online
  - navidocs-api (port 8001)
  - meilisearch (port 7700)
  - navidocs-ocr-worker (background)

**Access:**
- Production URL: https://navidocs.yourdomain.com
- API Health: https://navidocs.yourdomain.com/api/health (✅ 200 OK)
- Search Index: 47 documents indexed

**Performance Verification:**
- Smart OCR: 6.2s for 100-page PDF ✅
- Search latency: 12ms average ✅
- Upload throughput: 3 uploads/min ✅
- Timeline load: 89ms ✅

**Backup Status:**
- First backup completed: navidocs-db-20251113-140532.db
- Uploads backup: navidocs-uploads-20251113-140532.tar.gz
- Cron job scheduled: Daily at 2 AM

**Monitoring:**
- PM2 logs: /var/log/pm2/
- Application logs: ./logs/navidocs.log
- Error alerts: Configured via PM2 webhook

## Post-Deployment Verification:

✅ User login working
✅ Document upload (all formats)
✅ Search returning results
✅ Timeline showing activity
✅ Mobile responsive
✅ SSL certificate valid
✅ Performance within targets

**Status:** NaviDocs v1.0 is LIVE and production-ready! 🎉

**Next Steps:**
- Monitor logs for first 24 hours
- Onboard first users
- Gather feedback for v1.1
```

---

## Communication

```bash
git add .
git commit -m "[SESSION-5] Deployment and documentation complete

- Production environment configuration
- Automated deployment script (deploy-stackcp.sh)
- Database backup automation
- Complete user and developer documentation
- Pre-deployment checklist
- Deployed to StackCP successfully
- All services running with PM2
- SSL and DNS configured

NaviDocs v1.0 is LIVE! 🚀"

git push origin navidocs-cloud-coordination
```

Create `SESSION-5-COMPLETE.md` with completion report above.

---

**Ready to launch? Start with Phase 1 (Deployment Prep)! 🚀**

**Dependencies:** Sessions 1-4 must be complete and merged
**Estimated Completion:** 90 minutes from start
**Outcome:** NaviDocs v1.0 running in production!
