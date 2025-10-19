# NaviDocs Troubleshooting Guide

**Last Updated:** 2025-10-19
**Version:** 1.0

This guide covers common issues, diagnosis steps, and solutions for NaviDocs deployment and operation.

---

## Table of Contents

1. [Common Issues](#1-common-issues)
2. [Service-Specific Troubleshooting](#2-service-specific-troubleshooting)
3. [Network & WSL2 Issues](#3-network--wsl2-issues)
4. [Performance Issues](#4-performance-issues)
5. [Data Issues](#5-data-issues)
6. [Quick Reference Commands](#6-quick-reference-commands)

---

## 1. Common Issues

### 1.1 Services Won't Start

#### Symptoms
- Start script exits with errors
- Services immediately crash after starting
- "Address already in use" errors
- Services start but become unresponsive

#### Diagnosis Steps

**Step 1: Check if ports are already in use**
```bash
# Check all NaviDocs ports
ss -tlnp | grep -E ":(6379|7700|8001|8080)"

# Or use lsof (more detailed)
lsof -i :6379  # Redis
lsof -i :7700  # Meilisearch
lsof -i :8001  # Backend API
lsof -i :8080  # Frontend
```

**Step 2: Check if services are running**
```bash
# Check all node processes
ps aux | grep node

# Check Docker containers
docker ps -a | grep meilisearch

# Check Redis
redis-cli ping
```

**Step 3: Review log files**
```bash
# Check recent backend logs
tail -50 /tmp/navidocs-backend.log

# Check OCR worker logs
tail -50 /tmp/navidocs-ocr-worker.log

# Check frontend logs
tail -50 /tmp/navidocs-frontend.log
```

#### Solutions

**Solution 1: Kill conflicting processes**
```bash
# Kill backend
pkill -f "navidocs.*index.js"

# Kill OCR worker
pkill -f "ocr-worker"

# Kill frontend
pkill -f "vite.*8080"

# Kill process on specific port
lsof -ti:8001 | xargs kill -9
```

**Solution 2: Clean restart**
```bash
# Stop everything
/home/setup/navidocs/stop-all.sh

# Wait 5 seconds
sleep 5

# Verify all processes stopped
ps aux | grep -E "navidocs|vite|ocr-worker"

# Start fresh
/home/setup/navidocs/start-all.sh
```

**Solution 3: Check environment variables**
```bash
# Verify .env file exists
cat /home/setup/navidocs/server/.env

# Verify critical variables are set
grep -E "PORT|MEILISEARCH|REDIS|DATABASE" /home/setup/navidocs/server/.env
```

**Solution 4: Check file permissions**
```bash
# Ensure upload directory exists and is writable
ls -ld /home/setup/navidocs/server/uploads
mkdir -p /home/setup/navidocs/server/uploads
chmod 755 /home/setup/navidocs/server/uploads

# Ensure database directory is writable
ls -ld /home/setup/navidocs/server/db
chmod 755 /home/setup/navidocs/server/db
```

#### Prevention Tips
- Always use `stop-all.sh` before starting services again
- Monitor disk space regularly
- Review logs after each startup
- Use `ss -tlnp` before starting to verify ports are free

#### Related Logs
- `/tmp/navidocs-backend.log` - Backend startup errors
- `/tmp/navidocs-ocr-worker.log` - Worker initialization errors
- `/tmp/navidocs-frontend.log` - Vite dev server errors

---

### 1.2 Port Conflicts

#### Symptoms
- Error: "EADDRINUSE: address already in use"
- Services fail to bind to ports
- Multiple instances running simultaneously

#### Diagnosis Steps

```bash
# Identify what's using the port
lsof -i :8001
netstat -tlnp | grep 8001

# Check all NaviDocs ports
ss -tlnp | grep -E ":(6379|7700|8001|8080)"
```

#### Solutions

**Solution 1: Kill the conflicting process**
```bash
# Find and kill by port
lsof -ti:8001 | xargs kill -9

# Or kill by process name
pkill -f "navidocs.*index.js"
```

**Solution 2: Change the port in .env**
```bash
# Edit the .env file
nano /home/setup/navidocs/server/.env

# Change PORT to a free port (e.g., 8002)
PORT=8002

# Update Vite proxy config
nano /home/setup/navidocs/client/vite.config.js
# Change target: 'http://localhost:8002'
```

**Solution 3: Stop all Node processes (nuclear option)**
```bash
# Warning: This will kill ALL Node.js processes on the system
pkill node

# Verify all stopped
ps aux | grep node

# Restart only NaviDocs
/home/setup/navidocs/start-all.sh
```

#### Prevention Tips
- Use consistent start/stop scripts
- Avoid Ctrl+C on start-all.sh (let it complete)
- Check ports before starting: `ss -tlnp | grep -E ":(6379|7700|8001|8080)"`

#### Related Logs
- `/tmp/navidocs-backend.log` - Look for "EADDRINUSE" errors
- `/tmp/navidocs-frontend.log` - Vite port binding errors

---

### 1.3 Database Locked

#### Symptoms
- "database is locked" errors
- Uploads fail with database errors
- Job status updates fail
- Long-running queries timeout

#### Diagnosis Steps

**Step 1: Check for active connections**
```bash
# Check if backend/worker are running
ps aux | grep -E "navidocs|ocr-worker"

# Check SQLite WAL files (indicates active writes)
ls -lh /home/setup/navidocs/server/db/*.wal
ls -lh /home/setup/navidocs/server/db/*.shm
```

**Step 2: Check database integrity**
```bash
# Open database and check
sqlite3 /home/setup/navidocs/server/db/navidocs.db "PRAGMA integrity_check;"

# Check for locks
sqlite3 /home/setup/navidocs/server/db/navidocs.db "PRAGMA locking_mode;"
```

**Step 3: Review error logs**
```bash
# Look for database errors
grep -i "database" /tmp/navidocs-backend.log
grep -i "locked" /tmp/navidocs-*.log
```

#### Solutions

**Solution 1: Close all connections and restart**
```bash
# Stop all services
/home/setup/navidocs/stop-all.sh

# Wait for connections to close
sleep 5

# Verify WAL files are gone or small
ls -lh /home/setup/navidocs/server/db/

# Restart services
/home/setup/navidocs/start-all.sh
```

**Solution 2: Checkpoint the WAL file**
```bash
# Stop services first
/home/setup/navidocs/stop-all.sh

# Checkpoint the WAL
sqlite3 /home/setup/navidocs/server/db/navidocs.db "PRAGMA wal_checkpoint(TRUNCATE);"

# Restart services
/home/setup/navidocs/start-all.sh
```

**Solution 3: Increase timeout (for long-running operations)**
```bash
# Edit db/db.js to increase busy timeout
# The default is usually 5000ms (5 seconds)

# Temporary workaround: reduce concurrent OCR jobs
nano /home/setup/navidocs/server/.env

# Add or modify:
OCR_CONCURRENCY=1

# Restart worker
pkill -f "ocr-worker"
cd /home/setup/navidocs/server
node workers/ocr-worker.js > /tmp/navidocs-ocr-worker.log 2>&1 &
```

**Solution 4: Recover from corrupted database (last resort)**
```bash
# Stop all services
/home/setup/navidocs/stop-all.sh

# Backup current database
cp /home/setup/navidocs/server/db/navidocs.db \
   /home/setup/navidocs/server/db/navidocs-backup-$(date +%Y%m%d-%H%M%S).db

# Try to repair
sqlite3 /home/setup/navidocs/server/db/navidocs.db ".recover" | \
  sqlite3 /home/setup/navidocs/server/db/navidocs-recovered.db

# If successful, replace
mv /home/setup/navidocs/server/db/navidocs.db \
   /home/setup/navidocs/server/db/navidocs-corrupted.db
mv /home/setup/navidocs/server/db/navidocs-recovered.db \
   /home/setup/navidocs/server/db/navidocs.db

# Restart services
/home/setup/navidocs/start-all.sh
```

#### Prevention Tips
- Don't run multiple backend instances
- Set `OCR_CONCURRENCY=2` or lower for large documents
- Enable WAL mode (should be default): `PRAGMA journal_mode=WAL;`
- Regular database backups
- Monitor database file size

#### Related Logs
- `/tmp/navidocs-backend.log` - Database lock errors during API calls
- `/tmp/navidocs-ocr-worker.log` - Database lock errors during OCR processing

---

### 1.4 Meilisearch Authentication Errors

#### Symptoms
- "Invalid API key" errors
- Search returns 401/403 errors
- Token generation fails
- Frontend can't connect to search

#### Diagnosis Steps

**Step 1: Verify Meilisearch is running**
```bash
# Check Docker container
docker ps | grep meilisearch

# Check health endpoint
curl http://localhost:7700/health
```

**Step 2: Test authentication**
```bash
# Test with master key from .env
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)

curl -H "Authorization: Bearer $MASTER_KEY" \
     http://localhost:7700/indexes
```

**Step 3: Check environment configuration**
```bash
# Verify master key matches in .env and Docker
grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env

# Check what key Docker container is using
docker inspect boat-manuals-meilisearch | grep MEILI_MASTER_KEY
```

#### Solutions

**Solution 1: Verify and sync keys**
```bash
# Get key from .env
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)

# Test it works
curl -H "Authorization: Bearer $MASTER_KEY" \
     http://localhost:7700/indexes

# If not, check Docker container environment
docker inspect boat-manuals-meilisearch | grep MEILI_MASTER_KEY
```

**Solution 2: Recreate Meilisearch container with correct key**
```bash
# Stop and remove existing container
docker stop boat-manuals-meilisearch
docker rm boat-manuals-meilisearch

# Get master key from .env
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)

# Create new container with correct key
docker run -d \
  --name boat-manuals-meilisearch \
  -p 7700:7700 \
  -e MEILI_MASTER_KEY="$MASTER_KEY" \
  -e MEILI_ENV=development \
  -e MEILI_NO_ANALYTICS=true \
  -v meilisearch_data:/meili_data \
  getmeili/meilisearch:v1.6

# Wait for it to start
sleep 3

# Restart backend to reinitialize index
pkill -f "navidocs.*index.js"
cd /home/setup/navidocs/server
node index.js > /tmp/navidocs-backend.log 2>&1 &
```

**Solution 3: Generate new master key and update everywhere**
```bash
# Generate new key
NEW_KEY=$(openssl rand -base64 32)

echo "New master key: $NEW_KEY"

# Update .env
nano /home/setup/navidocs/server/.env
# Change MEILISEARCH_MASTER_KEY=<new-key>

# Recreate container
docker stop boat-manuals-meilisearch
docker rm boat-manuals-meilisearch

docker run -d \
  --name boat-manuals-meilisearch \
  -p 7700:7700 \
  -e MEILI_MASTER_KEY="$NEW_KEY" \
  -e MEILI_ENV=development \
  -e MEILI_NO_ANALYTICS=true \
  -v meilisearch_data:/meili_data \
  getmeili/meilisearch:v1.6

# Restart backend
/home/setup/navidocs/stop-all.sh
/home/setup/navidocs/start-all.sh
```

**Solution 4: Check for tenant token generation issues**
```bash
# Test search token endpoint
curl -X POST http://localhost:8001/api/search/token \
  -H "Content-Type: application/json" \
  -d '{"expiresIn": 3600}'

# Check backend logs for token generation errors
grep -i "tenant.*token" /tmp/navidocs-backend.log
```

#### Prevention Tips
- Keep master key consistent between .env and Docker
- Never expose master key in client-side code
- Use tenant tokens for frontend search
- Regularly rotate keys in production
- Document key rotation procedure

#### Related Logs
- `/tmp/navidocs-backend.log` - Token generation errors, Meilisearch connection errors
- Docker logs: `docker logs boat-manuals-meilisearch`

---

### 1.5 Search Not Working

#### Symptoms
- Search returns no results
- Search returns 404 or 500 errors
- Index not found errors
- Results don't match expected documents

#### Diagnosis Steps

**Step 1: Verify Meilisearch is accessible**
```bash
# Check health
curl http://localhost:7700/health

# Check indexes exist
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)

curl -H "Authorization: Bearer $MASTER_KEY" \
     http://localhost:7700/indexes
```

**Step 2: Check if documents are indexed**
```bash
# Get document count in index
curl -H "Authorization: Bearer $MASTER_KEY" \
     http://localhost:7700/indexes/navidocs-pages/stats

# List some documents
curl -H "Authorization: Bearer $MASTER_KEY" \
     "http://localhost:7700/indexes/navidocs-pages/documents?limit=5"
```

**Step 3: Test search directly**
```bash
# Test search with master key
curl -X POST \
  -H "Authorization: Bearer $MASTER_KEY" \
  -H "Content-Type: application/json" \
  http://localhost:7700/indexes/navidocs-pages/search \
  -d '{"q":"test","limit":5}'
```

**Step 4: Check database for indexed pages**
```bash
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT COUNT(*) as indexed_pages FROM document_pages WHERE search_indexed_at IS NOT NULL;"

sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT COUNT(*) as total_pages FROM document_pages;"
```

#### Solutions

**Solution 1: Reindex all documents**
```bash
# This requires creating a reindexing script or doing it manually
# Check which documents are indexed
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT d.id, d.title, d.status, COUNT(p.id) as pages
   FROM documents d
   LEFT JOIN document_pages p ON d.id = p.document_id
   GROUP BY d.id;"

# If pages exist but aren't in Meilisearch, you may need to reprocess OCR jobs
# or trigger re-indexing via the API
```

**Solution 2: Recreate the index**
```bash
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)

# Delete existing index
curl -X DELETE \
  -H "Authorization: Bearer $MASTER_KEY" \
  http://localhost:7700/indexes/navidocs-pages

# Restart backend to auto-create and configure index
pkill -f "navidocs.*index.js"
cd /home/setup/navidocs/server
node index.js > /tmp/navidocs-backend.log 2>&1 &

# Wait for index creation
sleep 3

# Check logs
tail -20 /tmp/navidocs-backend.log
```

**Solution 3: Check index configuration**
```bash
# Get current settings
curl -H "Authorization: Bearer $MASTER_KEY" \
     http://localhost:7700/indexes/navidocs-pages/settings

# Verify searchable attributes include 'text', 'title'
# Verify filterable attributes include 'userId', 'organizationId'
```

**Solution 4: Test with backend API endpoint**
```bash
# Use the backend search endpoint (server-side)
curl -X POST http://localhost:8001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "q": "test",
    "limit": 10
  }'
```

#### Prevention Tips
- Monitor index stats after uploads
- Set up health checks for search endpoint
- Test search after each upload
- Keep Meilisearch version consistent
- Back up Meilisearch data volume

#### Related Logs
- `/tmp/navidocs-backend.log` - Search API errors
- `/tmp/navidocs-ocr-worker.log` - Indexing errors during OCR
- Docker logs: `docker logs boat-manuals-meilisearch`

---

### 1.6 Upload Failures

#### Symptoms
- File upload returns 400/500 errors
- Upload progress stalls
- Files uploaded but not processed
- "No file uploaded" error despite selecting file

#### Diagnosis Steps

**Step 1: Check file and request validity**
```bash
# Test upload with curl
curl -X POST http://localhost:8001/api/upload \
  -F "file=@/path/to/test.pdf" \
  -F "title=Test Document" \
  -F "documentType=owner-manual" \
  -F "organizationId=test-org-id"
```

**Step 2: Check upload directory**
```bash
# Verify directory exists and is writable
ls -ld /home/setup/navidocs/server/uploads
ls -lh /home/setup/navidocs/server/uploads

# Check disk space
df -h /home/setup/navidocs/server/uploads
```

**Step 3: Check file size limits**
```bash
# Check max file size in .env
grep MAX_FILE_SIZE /home/setup/navidocs/server/.env

# Check actual file size
ls -lh your-file.pdf
```

**Step 4: Review upload logs**
```bash
# Check backend logs for upload errors
grep -i "upload" /tmp/navidocs-backend.log | tail -20

# Look for specific error messages
grep -E "Upload error|file.*error|validation.*failed" /tmp/navidocs-backend.log
```

#### Solutions

**Solution 1: Fix upload directory permissions**
```bash
# Ensure directory exists
mkdir -p /home/setup/navidocs/server/uploads

# Set correct permissions
chmod 755 /home/setup/navidocs/server/uploads
chown -R $USER:$USER /home/setup/navidocs/server/uploads

# Verify
ls -ld /home/setup/navidocs/server/uploads
```

**Solution 2: Increase file size limit**
```bash
# Edit .env
nano /home/setup/navidocs/server/.env

# Change or add:
MAX_FILE_SIZE=104857600  # 100MB

# Also check Express body limit in index.js (default is 10mb)
# You may need to increase it for very large files

# Restart backend
pkill -f "navidocs.*index.js"
cd /home/setup/navidocs/server
node index.js > /tmp/navidocs-backend.log 2>&1 &
```

**Solution 3: Verify file type and validation**
```bash
# Check if file is actually a PDF
file your-document.pdf

# Should output: "PDF document, version X.X"

# If file is corrupted, try opening with PDF viewer first
# Valid file types in .env:
grep ALLOWED_MIME_TYPES /home/setup/navidocs/server/.env
```

**Solution 4: Check database connectivity**
```bash
# Ensure database is accessible
sqlite3 /home/setup/navidocs/server/db/navidocs.db "SELECT COUNT(*) FROM documents;"

# Check if database is locked
sqlite3 /home/setup/navidocs/server/db/navidocs.db "PRAGMA integrity_check;"
```

**Solution 5: Clear failed uploads**
```bash
# Remove orphaned files from uploads directory
cd /home/setup/navidocs/server/uploads

# List files
ls -lh

# Compare with database
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT file_name FROM documents WHERE status != 'deleted';"

# Remove orphaned files (manually review first!)
```

#### Prevention Tips
- Monitor disk space: `df -h`
- Set appropriate file size limits
- Validate files before upload (client-side)
- Test with small PDFs first
- Keep upload directory clean
- Monitor for failed uploads and clean up

#### Related Logs
- `/tmp/navidocs-backend.log` - Upload endpoint errors, validation failures
- Check line 165-180 of routes/upload.js for error handling

---

### 1.7 OCR Job Failures

#### Symptoms
- Jobs stuck in "processing" status
- Jobs marked as "failed" with errors
- OCR worker crashes
- No text extracted from PDFs

#### Diagnosis Steps

**Step 1: Check job status in database**
```bash
# List recent jobs
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT id, status, progress, error, created_at
   FROM ocr_jobs
   ORDER BY created_at DESC
   LIMIT 10;"

# Check specific job
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT * FROM ocr_jobs WHERE id='<job-id>';"
```

**Step 2: Check worker status**
```bash
# Check if worker is running
ps aux | grep ocr-worker

# Check worker logs
tail -50 /tmp/navidocs-ocr-worker.log
```

**Step 3: Check Redis queue**
```bash
# Connect to Redis
redis-cli

# Check queue length
LLEN bull:ocr-processing:wait

# Check failed jobs
LLEN bull:ocr-processing:failed

# Exit Redis
exit
```

**Step 4: Check if PDF files exist**
```bash
# Get file path from database
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT id, file_path, status FROM documents WHERE id='<document-id>';"

# Check if file exists
ls -lh /home/setup/navidocs/server/uploads/<document-id>.pdf
```

#### Solutions

**Solution 1: Restart OCR worker**
```bash
# Kill existing worker
pkill -f "ocr-worker"

# Start new worker
cd /home/setup/navidocs/server
node workers/ocr-worker.js > /tmp/navidocs-ocr-worker.log 2>&1 &

# Monitor logs
tail -f /tmp/navidocs-ocr-worker.log
```

**Solution 2: Clear stuck jobs from Redis**
```bash
redis-cli

# List failed jobs
LRANGE bull:ocr-processing:failed 0 -1

# Clear failed jobs (WARNING: This removes all failed jobs)
DEL bull:ocr-processing:failed

# Clear waiting jobs if stuck
DEL bull:ocr-processing:wait

exit
```

**Solution 3: Reset job status and retry**
```bash
# Update job status to pending
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "UPDATE ocr_jobs
   SET status='pending', progress=0, error=NULL, started_at=NULL
   WHERE id='<job-id>';"

# Update document status
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "UPDATE documents
   SET status='processing'
   WHERE id='<document-id>';"

# Restart worker to pick up pending jobs
pkill -f "ocr-worker"
cd /home/setup/navidocs/server
node workers/ocr-worker.js > /tmp/navidocs-ocr-worker.log 2>&1 &
```

**Solution 4: Check Tesseract installation (if using Tesseract OCR)**
```bash
# Check if Tesseract is installed
tesseract --version

# Check language data
tesseract --list-langs

# If English not listed, install:
# Ubuntu/Debian: sudo apt-get install tesseract-ocr-eng
# macOS: brew install tesseract-lang
```

**Solution 5: Reduce concurrency for problematic PDFs**
```bash
# Edit .env
nano /home/setup/navidocs/server/.env

# Set lower concurrency
OCR_CONCURRENCY=1

# Restart worker
pkill -f "ocr-worker"
cd /home/setup/navidocs/server
node workers/ocr-worker.js > /tmp/navidocs-ocr-worker.log 2>&1 &
```

**Solution 6: Manual job debugging**
```bash
# Get job details
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT j.id as job_id, j.status, j.error, d.id as doc_id, d.file_path, d.page_count
   FROM ocr_jobs j
   JOIN documents d ON j.document_id = d.id
   WHERE j.id='<job-id>';"

# Check if file is readable
file <file-path>

# Try to process manually (advanced)
# This would require running OCR extraction code directly
```

#### Prevention Tips
- Monitor worker health regularly
- Set reasonable concurrency limits
- Test with small PDFs first
- Monitor Redis queue depth
- Keep Tesseract/OCR dependencies updated
- Set job timeout limits
- Implement retry logic with exponential backoff

#### Related Logs
- `/tmp/navidocs-ocr-worker.log` - Worker processing errors, OCR failures
- Redis logs (if configured)
- Check worker code: `/home/setup/navidocs/server/workers/ocr-worker.js`

---

### 1.8 PDF Viewing Issues

#### Symptoms
- PDF viewer shows blank page
- "Failed to load PDF" error
- PDF downloads instead of viewing inline
- Viewer freezes or crashes

#### Diagnosis Steps

**Step 1: Verify PDF file exists and is accessible**
```bash
# Get document info
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT id, file_path, file_name, status FROM documents WHERE id='<document-id>';"

# Check if file exists
ls -lh <file-path>

# Verify it's a valid PDF
file <file-path>
```

**Step 2: Test PDF endpoint directly**
```bash
# Test PDF serving endpoint
curl -I http://localhost:8001/api/documents/<document-id>/pdf

# Should return 200 with Content-Type: application/pdf

# Download to test
curl http://localhost:8001/api/documents/<document-id>/pdf > test.pdf

# Try to open test.pdf
```

**Step 3: Check browser console**
```
# Open browser DevTools (F12)
# Look for:
# - CORS errors
# - 404/403 errors
# - PDF.js errors
# - Network errors
```

**Step 4: Check Content-Security-Policy**
```bash
# Check if CSP is blocking PDF
curl -I http://localhost:8001/api/documents/<document-id>/pdf

# Look for Content-Security-Policy header
```

#### Solutions

**Solution 1: Verify file path and permissions**
```bash
# Get file path from database
FILE_PATH=$(sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT file_path FROM documents WHERE id='<document-id>';" | tr -d '\n')

echo "File path: $FILE_PATH"

# Check if file exists and is readable
ls -lh "$FILE_PATH"

# Make readable if needed
chmod 644 "$FILE_PATH"
```

**Solution 2: Fix CORS for PDF serving**
```bash
# CORS should already be configured in index.js
# But verify frontend can access backend

# Test from browser console:
# fetch('http://localhost:8001/api/documents/<id>/pdf')
#   .then(r => console.log(r.status))
```

**Solution 3: Check PDF.js worker configuration**
```bash
# In frontend, verify PDF.js worker is loaded
# Check: client/src/components/DocumentViewer.vue or similar

# Worker should be configured like:
# import * as pdfjsLib from 'pdfjs-dist'
# pdfjsLib.GlobalWorkerOptions.workerSrc = ...
```

**Solution 4: Verify Content-Disposition header**
```bash
# Check that PDF is served inline, not as attachment
curl -I http://localhost:8001/api/documents/<document-id>/pdf | grep Content-Disposition

# Should show: Content-Disposition: inline; filename="..."
# NOT: Content-Disposition: attachment
```

**Solution 5: Test with simple PDF**
```bash
# Create a minimal test PDF
echo "Test" | ps2pdf - test.pdf

# Upload it and try viewing
# If this works, original PDF may be corrupted or too complex
```

**Solution 6: Clear browser cache**
```
# In browser:
# 1. Open DevTools (F12)
# 2. Right-click refresh button
# 3. Select "Empty Cache and Hard Reload"

# Or clear all cached data for localhost:8080
```

#### Prevention Tips
- Test PDFs in multiple browsers
- Validate PDFs before upload
- Monitor PDF file sizes
- Keep PDF.js library updated
- Test with various PDF versions (1.4, 1.5, 1.6, 1.7)
- Implement progressive loading for large PDFs

#### Related Logs
- `/tmp/navidocs-backend.log` - PDF serving errors
- Browser DevTools Console - Client-side rendering errors
- Browser DevTools Network tab - PDF loading issues

---

## 2. Service-Specific Troubleshooting

### 2.1 Redis Issues

#### Common Problems

**Problem 1: Redis not running**

**Symptoms:**
- "Error: connect ECONNREFUSED 127.0.0.1:6379"
- Job queue fails to initialize
- OCR worker won't start

**Diagnosis:**
```bash
# Check if Redis is running
redis-cli ping

# Check process
ps aux | grep redis

# Check if port 6379 is listening
ss -tlnp | grep 6379
```

**Solution:**
```bash
# Start Redis
redis-server --daemonize yes

# Or via systemctl (if installed as service)
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping
# Should return: PONG
```

---

**Problem 2: Redis memory issues**

**Symptoms:**
- "OOM command not allowed when used memory > 'maxmemory'"
- Jobs fail to queue
- Slow performance

**Diagnosis:**
```bash
# Check memory usage
redis-cli INFO memory

# Check max memory setting
redis-cli CONFIG GET maxmemory
```

**Solution:**
```bash
# Increase max memory (example: 256MB)
redis-cli CONFIG SET maxmemory 256mb

# Or clear all data (WARNING: Clears all queues!)
redis-cli FLUSHALL

# Set eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

**Problem 3: Too many pending jobs**

**Diagnosis:**
```bash
redis-cli

# Check queue lengths
LLEN bull:ocr-processing:wait
LLEN bull:ocr-processing:active
LLEN bull:ocr-processing:completed
LLEN bull:ocr-processing:failed

exit
```

**Solution:**
```bash
redis-cli

# Clear completed jobs
DEL bull:ocr-processing:completed

# Clear failed jobs (review first!)
DEL bull:ocr-processing:failed

# Clear waiting jobs (only if you want to cancel them!)
DEL bull:ocr-processing:wait

exit

# Restart worker
pkill -f "ocr-worker"
cd /home/setup/navidocs/server
node workers/ocr-worker.js > /tmp/navidocs-ocr-worker.log 2>&1 &
```

---

### 2.2 Meilisearch Issues

#### Common Problems

**Problem 1: Container won't start**

**Symptoms:**
- `docker start boat-manuals-meilisearch` fails
- Port 7700 not accessible
- Container exits immediately

**Diagnosis:**
```bash
# Check container status
docker ps -a | grep meilisearch

# Check container logs
docker logs boat-manuals-meilisearch

# Check if port is in use
lsof -i :7700
```

**Solution:**
```bash
# Stop and remove container
docker stop boat-manuals-meilisearch
docker rm boat-manuals-meilisearch

# Get master key
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)

# Recreate container
docker run -d \
  --name boat-manuals-meilisearch \
  -p 7700:7700 \
  -e MEILI_MASTER_KEY="$MASTER_KEY" \
  -e MEILI_ENV=development \
  -e MEILI_NO_ANALYTICS=true \
  -v meilisearch_data:/meili_data \
  getmeili/meilisearch:v1.6

# Wait and verify
sleep 3
curl http://localhost:7700/health
```

---

**Problem 2: Index configuration lost**

**Symptoms:**
- Search doesn't filter correctly
- Can't search on expected fields
- Wrong ranking results

**Diagnosis:**
```bash
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)

# Check current settings
curl -H "Authorization: Bearer $MASTER_KEY" \
     http://localhost:7700/indexes/navidocs-pages/settings
```

**Solution:**
```bash
# Restart backend to reconfigure index
pkill -f "navidocs.*index.js"
cd /home/setup/navidocs/server
node index.js > /tmp/navidocs-backend.log 2>&1 &

# Check logs for "Meilisearch index configured"
grep -i "meilisearch.*configured" /tmp/navidocs-backend.log

# Or manually apply configuration from
# /home/setup/navidocs/docs/architecture/meilisearch-config.json
```

---

**Problem 3: Data volume issues**

**Diagnosis:**
```bash
# Check Docker volumes
docker volume ls | grep meilisearch

# Inspect volume
docker volume inspect meilisearch_data
```

**Solution (Backup and reset):**
```bash
# Stop container
docker stop boat-manuals-meilisearch

# Backup volume
docker run --rm \
  -v meilisearch_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/meilisearch-backup-$(date +%Y%m%d).tar.gz /data

# Remove and recreate (if corrupted)
docker rm boat-manuals-meilisearch
docker volume rm meilisearch_data

# Start fresh
/home/setup/navidocs/start-all.sh
```

---

### 2.3 Backend API Issues

#### Common Problems

**Problem 1: API returns 500 errors**

**Diagnosis:**
```bash
# Check if backend is running
ps aux | grep "navidocs.*index.js"

# Check recent logs
tail -50 /tmp/navidocs-backend.log

# Test health endpoint
curl http://localhost:8001/health
```

**Solution:**
```bash
# Restart backend
pkill -f "navidocs.*index.js"
cd /home/setup/navidocs/server
node index.js > /tmp/navidocs-backend.log 2>&1 &

# Monitor startup
tail -f /tmp/navidocs-backend.log

# Verify health
curl http://localhost:8001/health
```

---

**Problem 2: CORS errors from frontend**

**Symptoms:**
- Browser console shows CORS errors
- API calls blocked by browser
- "Access-Control-Allow-Origin" errors

**Diagnosis:**
```bash
# Test CORS headers
curl -I -H "Origin: http://localhost:8080" \
  http://localhost:8001/health

# Look for Access-Control-Allow-Origin header
```

**Solution:**
```bash
# CORS is configured in server/index.js
# For development, it should allow all origins

# Verify .env has development mode
grep NODE_ENV /home/setup/navidocs/server/.env

# Should be: NODE_ENV=development

# If changed, restart backend
pkill -f "navidocs.*index.js"
cd /home/setup/navidocs/server
node index.js > /tmp/navidocs-backend.log 2>&1 &
```

---

**Problem 3: Rate limiting blocking requests**

**Symptoms:**
- "Too many requests" errors
- 429 status codes
- Legitimate requests blocked

**Diagnosis:**
```bash
# Check rate limit settings
grep RATE_LIMIT /home/setup/navidocs/server/.env
```

**Solution:**
```bash
# Temporarily increase limits (for development)
nano /home/setup/navidocs/server/.env

# Modify:
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=1000  # Increase from 100 to 1000

# Restart backend
pkill -f "navidocs.*index.js"
cd /home/setup/navidocs/server
node index.js > /tmp/navidocs-backend.log 2>&1 &
```

---

### 2.4 OCR Worker Issues

#### Common Problems

**Problem 1: Worker exits immediately**

**Diagnosis:**
```bash
# Check if worker process exists
ps aux | grep ocr-worker

# Check recent logs
tail -50 /tmp/navidocs-ocr-worker.log

# Look for initialization errors
grep -i error /tmp/navidocs-ocr-worker.log
```

**Solution:**
```bash
# Check Redis connection
redis-cli ping

# Restart worker with verbose logging
cd /home/setup/navidocs/server
node workers/ocr-worker.js > /tmp/navidocs-ocr-worker.log 2>&1 &

# Monitor logs
tail -f /tmp/navidocs-ocr-worker.log
```

---

**Problem 2: Worker processes jobs slowly**

**Diagnosis:**
```bash
# Check concurrency setting
grep OCR_CONCURRENCY /home/setup/navidocs/server/.env

# Monitor job progress
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT id, status, progress FROM ocr_jobs WHERE status='processing';"
```

**Solution:**
```bash
# Increase concurrency (if system has resources)
nano /home/setup/navidocs/server/.env

# Modify:
OCR_CONCURRENCY=4  # Increase from 2 to 4

# Restart worker
pkill -f "ocr-worker"
cd /home/setup/navidocs/server
node workers/ocr-worker.js > /tmp/navidocs-ocr-worker.log 2>&1 &
```

---

### 2.5 Frontend Issues

#### Common Problems

**Problem 1: Vite dev server won't start**

**Diagnosis:**
```bash
# Check if port 8080 is in use
lsof -i :8080

# Check logs
tail -50 /tmp/navidocs-frontend.log

# Try starting manually
cd /home/setup/navidocs/client
npm run dev
```

**Solution:**
```bash
# Kill existing process
pkill -f "vite.*8080"

# Clear node_modules cache (if needed)
cd /home/setup/navidocs/client
rm -rf node_modules/.vite

# Restart
npm run dev > /tmp/navidocs-frontend.log 2>&1 &
```

---

**Problem 2: Frontend can't connect to backend**

**Diagnosis:**
```bash
# Check Vite proxy configuration
cat /home/setup/navidocs/client/vite.config.js

# Test backend directly
curl http://localhost:8001/health

# Test from frontend
curl http://localhost:8080/api/health
```

**Solution:**
```bash
# Verify proxy is configured correctly in vite.config.js
# Should have:
#   proxy: {
#     '/api': {
#       target: 'http://localhost:8001',
#       changeOrigin: true
#     }
#   }

# If changed, restart frontend
pkill -f "vite.*8080"
cd /home/setup/navidocs/client
npm run dev > /tmp/navidocs-frontend.log 2>&1 &
```

---

**Problem 3: Hot module reload not working**

**Solution:**
```bash
# This is common in WSL2
# Check Vite is watching files properly

# Increase file watch limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Restart frontend
pkill -f "vite.*8080"
cd /home/setup/navidocs/client
npm run dev > /tmp/navidocs-frontend.log 2>&1 &
```

---

## 3. Network & WSL2 Issues

### 3.1 Can't Access from Windows

#### Symptoms
- Frontend/backend not accessible from Windows browser
- Connection refused errors
- Timeouts when accessing http://172.x.x.x:8080

#### Diagnosis Steps

**Step 1: Verify services are running on 0.0.0.0**
```bash
# Check what addresses services are bound to
ss -tlnp | grep -E ":(8001|8080|7700)"

# Should show 0.0.0.0:8001, NOT 127.0.0.1:8001
```

**Step 2: Get current WSL2 IP**
```bash
# Get WSL IP
hostname -I | awk '{print $1}'

# Or
ip addr show eth0 | grep "inet\b" | awk '{print $2}' | cut -d/ -f1
```

**Step 3: Test from Windows**
```powershell
# In Windows PowerShell
# Get WSL IP from Windows side
wsl hostname -I

# Test connectivity
Test-NetConnection -ComputerName <WSL-IP> -Port 8080
Test-NetConnection -ComputerName <WSL-IP> -Port 8001
```

#### Solutions

**Solution 1: Verify server binds to 0.0.0.0**
```bash
# Backend should bind to 0.0.0.0 (check server/index.js)
# It should use:
# app.listen(PORT, '0.0.0.0', ...)

# Frontend vite.config.js should have:
# server: { host: '0.0.0.0', port: 8080 }

# Restart services
/home/setup/navidocs/stop-all.sh
/home/setup/navidocs/start-all.sh
```

**Solution 2: Create port forwarding (if needed)**
```powershell
# In Windows PowerShell as Administrator
# Get WSL IP
$wslIp = (wsl hostname -I).Trim()

# Forward port
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=$wslIp
netsh interface portproxy add v4tov4 listenport=8001 listenaddress=0.0.0.0 connectport=8001 connectaddress=$wslIp

# Show current forwards
netsh interface portproxy show v4tov4
```

**Solution 3: Check Windows Firewall**
```powershell
# In Windows PowerShell as Administrator
# Allow incoming connections on ports
New-NetFirewallRule -DisplayName "NaviDocs Frontend" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "NaviDocs Backend" -Direction Inbound -LocalPort 8001 -Protocol TCP -Action Allow
```

**Solution 4: Access using localhost (Windows 11 22H2+)**
```
# In newer Windows 11, you can access WSL services via localhost directly
http://localhost:8080
http://localhost:8001/health

# If this doesn't work, use the WSL IP address
```

#### Prevention Tips
- Document current WSL IP in a visible place
- Always bind services to 0.0.0.0 in WSL
- Test from Windows after every restart
- Consider using .local DNS if available

---

### 3.2 Dynamic IP Changes

#### Symptoms
- Services accessible after WSL start, then stop working
- IP address changed after Windows restart
- Bookmarks with IP no longer work

#### Diagnosis
```bash
# Check current IP
hostname -I | awk '{print $1}'

# Compare with documented IP in PATHS_AND_CREDENTIALS.md
grep "Current IP" /home/setup/navidocs/docs/handover/PATHS_AND_CREDENTIALS.md
```

#### Solutions

**Solution 1: Update documentation**
```bash
# Get new IP
NEW_IP=$(hostname -I | awk '{print $1}')
echo "New WSL2 IP: $NEW_IP"

# Update PATHS_AND_CREDENTIALS.md manually
nano /home/setup/navidocs/docs/handover/PATHS_AND_CREDENTIALS.md
```

**Solution 2: Create IP monitoring script**
```bash
# Create script to show current access URLs
cat > /home/setup/navidocs/show-urls.sh << 'EOF'
#!/bin/bash
WSL_IP=$(hostname -I | awk '{print $1}')
echo "==================================="
echo "NaviDocs Access URLs"
echo "==================================="
echo ""
echo "Frontend (WSL):    http://localhost:8080"
echo "Frontend (Windows): http://$WSL_IP:8080"
echo ""
echo "Backend (WSL):     http://localhost:8001"
echo "Backend (Windows):  http://$WSL_IP:8001"
echo ""
echo "Meilisearch (WSL): http://localhost:7700"
echo "Meilisearch (Windows): http://$WSL_IP:7700"
echo "==================================="
EOF

chmod +x /home/setup/navidocs/show-urls.sh

# Run anytime
/home/setup/navidocs/show-urls.sh
```

**Solution 3: Use localhost on Windows 11 22H2+**
```
# Windows 11 22H2 and newer support accessing WSL via localhost
# No need to track IP changes!

http://localhost:8080  # Frontend
http://localhost:8001  # Backend
http://localhost:7700  # Meilisearch
```

**Solution 4: Set static IP for WSL (advanced)**
```bash
# Edit /etc/wsl.conf in WSL
sudo nano /etc/wsl.conf

# Add:
# [network]
# generateResolvConf = false

# In Windows, edit .wslconfig
# C:\Users\<YourUser>\.wslconfig
# [wsl2]
# networkingMode=bridged

# Note: This requires Windows restart and may have other implications
```

#### Prevention Tips
- Use `localhost` when possible (Windows 11 22H2+)
- Run `show-urls.sh` after Windows restart
- Document IP changes
- Test connectivity after Windows updates

---

### 3.3 Port Binding Issues

#### Symptoms
- "EADDRINUSE" errors
- Services can't bind to ports
- Port conflicts with other applications

#### Diagnosis
```bash
# Check what's using each port
lsof -i :6379  # Redis
lsof -i :7700  # Meilisearch
lsof -i :8001  # Backend
lsof -i :8080  # Frontend

# Or use netstat
netstat -tlnp | grep -E ":(6379|7700|8001|8080)"
```

#### Solutions

**Solution 1: Kill conflicting processes**
```bash
# Kill by port
lsof -ti:8001 | xargs kill -9

# Or kill all NaviDocs processes
/home/setup/navidocs/stop-all.sh
```

**Solution 2: Change ports**
```bash
# Backend port
nano /home/setup/navidocs/server/.env
# Change PORT=8002

# Frontend port
nano /home/setup/navidocs/client/vite.config.js
# Change port: 8081

# Also update proxy target if backend port changed

# Restart services
/home/setup/navidocs/stop-all.sh
/home/setup/navidocs/start-all.sh
```

**Solution 3: Find and stop other applications**
```bash
# Identify process
lsof -i :8080

# If it's another dev server, stop it
# If it's a system service, choose different port for NaviDocs
```

---

## 4. Performance Issues

### 4.1 Slow Uploads

#### Symptoms
- Upload takes minutes for small files
- Upload progress bar freezes
- Timeouts during upload

#### Diagnosis

```bash
# Check disk I/O
iostat -x 1 5

# Check available disk space
df -h /home/setup/navidocs/server/uploads

# Check if database is slow
time sqlite3 /home/setup/navidocs/server/db/navidocs.db "SELECT COUNT(*) FROM documents;"

# Monitor backend during upload
tail -f /tmp/navidocs-backend.log
```

#### Solutions

**Solution 1: Check disk space**
```bash
# Free up space
df -h

# Remove old logs
rm /tmp/navidocs-*.log

# Remove old backups
rm /home/setup/navidocs/server/db/*backup*.db
```

**Solution 2: Optimize database**
```bash
# Stop services
/home/setup/navidocs/stop-all.sh

# Vacuum database
sqlite3 /home/setup/navidocs/server/db/navidocs.db "VACUUM;"

# Restart
/home/setup/navidocs/start-all.sh
```

**Solution 3: Increase timeouts**
```bash
# Edit backend server if needed
# Check Express timeout settings in server/index.js

# For Vite, increase timeout in vite.config.js:
# server: {
#   proxy: {
#     '/api': {
#       timeout: 120000  // 2 minutes
#     }
#   }
# }
```

**Solution 4: Check network (for remote access)**
```bash
# If uploading from Windows browser to WSL backend
# Test network speed
# In WSL:
iperf3 -s

# In Windows:
# iperf3 -c <WSL-IP>
```

---

### 4.2 Slow Search

#### Symptoms
- Search takes several seconds
- Search results timeout
- Meilisearch uses high CPU

#### Diagnosis

```bash
# Check Meilisearch stats
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)

curl -H "Authorization: Bearer $MASTER_KEY" \
     http://localhost:7700/indexes/navidocs-pages/stats

# Check number of documents
# Large indexes (>100k documents) may be slower

# Check Docker container resources
docker stats boat-manuals-meilisearch

# Test search performance
time curl -X POST \
  -H "Authorization: Bearer $MASTER_KEY" \
  -H "Content-Type: application/json" \
  http://localhost:7700/indexes/navidocs-pages/search \
  -d '{"q":"test","limit":10}'
```

#### Solutions

**Solution 1: Optimize Meilisearch settings**
```bash
# Reduce crop length for faster results
# This is done in the search query:
# cropLength: 100  (instead of 200)

# Limit number of results
# limit: 10  (instead of 20 or more)
```

**Solution 2: Increase Docker container resources**
```bash
# Stop container
docker stop boat-manuals-meilisearch

# Remove container
docker rm boat-manuals-meilisearch

# Recreate with more resources
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)

docker run -d \
  --name boat-manuals-meilisearch \
  -p 7700:7700 \
  --memory="2g" \
  --cpus="2" \
  -e MEILI_MASTER_KEY="$MASTER_KEY" \
  -e MEILI_ENV=development \
  -e MEILI_NO_ANALYTICS=true \
  -v meilisearch_data:/meili_data \
  getmeili/meilisearch:v1.6
```

**Solution 3: Reduce index size**
```bash
# Remove deleted documents from index
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)

# Delete documents where status='deleted' from Meilisearch
# This would require a script to query database and delete from index

# Or recreate index from scratch (see Section 1.5)
```

---

### 4.3 High Memory Usage

#### Symptoms
- System becomes sluggish
- Services crash with "out of memory"
- Swap usage high

#### Diagnosis

```bash
# Check overall memory
free -h

# Check per-process memory
ps aux --sort=-%mem | head -10

# Check Docker memory
docker stats boat-manuals-meilisearch

# Check Node.js processes
ps aux | grep node
```

#### Solutions

**Solution 1: Limit Node.js memory**
```bash
# Edit start-all.sh to limit backend memory
node --max-old-space-size=512 index.js > /tmp/navidocs-backend.log 2>&1 &

# Limit OCR worker
node --max-old-space-size=512 workers/ocr-worker.js > /tmp/navidocs-ocr-worker.log 2>&1 &
```

**Solution 2: Reduce OCR concurrency**
```bash
nano /home/setup/navidocs/server/.env

# Set:
OCR_CONCURRENCY=1

# Restart worker
pkill -f "ocr-worker"
cd /home/setup/navidocs/server
node workers/ocr-worker.js > /tmp/navidocs-ocr-worker.log 2>&1 &
```

**Solution 3: Limit Docker container memory**
```bash
# See Solution 2 in Section 4.2 above
```

**Solution 4: Clear Redis memory**
```bash
# Clear completed jobs
redis-cli

DEL bull:ocr-processing:completed
DEL bull:ocr-processing:failed

exit
```

---

### 4.4 Disk Space Issues

#### Symptoms
- "No space left on device" errors
- Uploads fail
- Database writes fail

#### Diagnosis

```bash
# Check disk usage
df -h

# Check NaviDocs directories
du -sh /home/setup/navidocs/server/uploads
du -sh /home/setup/navidocs/server/db

# Check Docker volumes
docker system df

# Find large files
find /home/setup/navidocs -type f -size +100M -exec ls -lh {} \;
```

#### Solutions

**Solution 1: Clean up old files**
```bash
# Remove old logs
rm /tmp/navidocs-*.log

# Remove old database backups
rm /home/setup/navidocs/server/db/*backup*.db

# Clean up node_modules cache
cd /home/setup/navidocs/server
npm cache clean --force

cd /home/setup/navidocs/client
npm cache clean --force
```

**Solution 2: Remove deleted documents**
```bash
# Find deleted documents still on disk
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT file_path FROM documents WHERE status='deleted';"

# Manually remove these files (review first!)
```

**Solution 3: Clean Docker**
```bash
# Remove unused Docker images
docker image prune -a

# Remove unused volumes (CAREFUL!)
docker volume prune

# Check space saved
docker system df
```

**Solution 4: Implement file rotation**
```bash
# Set up log rotation for NaviDocs logs
sudo nano /etc/logrotate.d/navidocs

# Add:
# /tmp/navidocs-*.log {
#     daily
#     rotate 7
#     compress
#     missingok
#     notifempty
# }

# Test
sudo logrotate -f /etc/logrotate.d/navidocs
```

---

## 5. Data Issues

### 5.1 Documents Not Indexing

#### Symptoms
- Documents uploaded but not searchable
- OCR job completes but search returns no results
- `search_indexed_at` is NULL in database

#### Diagnosis

```bash
# Check if pages were created
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT COUNT(*) FROM document_pages WHERE document_id='<document-id>';"

# Check if indexed
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT page_number, search_indexed_at
   FROM document_pages
   WHERE document_id='<document-id>'
   ORDER BY page_number;"

# Check OCR worker logs
grep -i "index" /tmp/navidocs-ocr-worker.log | tail -20

# Check Meilisearch for document
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)

curl -H "Authorization: Bearer $MASTER_KEY" \
     "http://localhost:7700/indexes/navidocs-pages/documents?filter=documentId=<document-id>"
```

#### Solutions

**Solution 1: Check Meilisearch connectivity from worker**
```bash
# Test from worker context
cd /home/setup/navidocs/server

# Test Meilisearch connection
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY .env | cut -d'=' -f2)

curl -H "Authorization: Bearer $MASTER_KEY" \
     http://localhost:7700/health

# If this fails, Meilisearch is not accessible
# Restart Meilisearch
docker restart boat-manuals-meilisearch
```

**Solution 2: Re-run indexing for specific document**
```bash
# This would require a manual script or function
# You can trigger re-indexing by:

# 1. Update job status to pending
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "UPDATE ocr_jobs SET status='pending', progress=0 WHERE document_id='<document-id>';"

# 2. Update document status
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "UPDATE documents SET status='processing' WHERE id='<document-id>';"

# 3. Restart worker to pick up job
pkill -f "ocr-worker"
cd /home/setup/navidocs/server
node workers/ocr-worker.js > /tmp/navidocs-ocr-worker.log 2>&1 &

# Monitor
tail -f /tmp/navidocs-ocr-worker.log
```

**Solution 3: Check index configuration**
```bash
# Verify index exists and is configured
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)

curl -H "Authorization: Bearer $MASTER_KEY" \
     http://localhost:7700/indexes/navidocs-pages/settings

# Should have searchableAttributes including 'text'
# If not, restart backend to reconfigure
pkill -f "navidocs.*index.js"
cd /home/setup/navidocs/server
node index.js > /tmp/navidocs-backend.log 2>&1 &
```

---

### 5.2 Search Results Missing

#### Symptoms
- Some documents don't appear in search results
- Search finds some pages but not all
- Recent uploads not searchable

#### Diagnosis

```bash
# Check document status
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT id, title, status, page_count
   FROM documents
   WHERE title LIKE '%<search-term>%';"

# Check if pages are indexed
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT d.id, d.title, COUNT(p.id) as total_pages,
          SUM(CASE WHEN p.search_indexed_at IS NOT NULL THEN 1 ELSE 0 END) as indexed_pages
   FROM documents d
   LEFT JOIN document_pages p ON d.id = p.document_id
   GROUP BY d.id;"

# Check Meilisearch document count
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)

curl -H "Authorization: Bearer $MASTER_KEY" \
     http://localhost:7700/indexes/navidocs-pages/stats

# Compare counts
```

#### Solutions

**Solution 1: Check filter rules**
```bash
# Verify user has access to organization
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT * FROM user_organizations WHERE user_id='test-user-id';"

# Test search without filters
curl -X POST \
  -H "Authorization: Bearer $MASTER_KEY" \
  -H "Content-Type: application/json" \
  http://localhost:7700/indexes/navidocs-pages/search \
  -d '{"q":"<term>","limit":100}'
```

**Solution 2: Rebuild index from database**
```bash
# Export pages from database
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT
     'page_' || d.id || '_' || p.page_number as id,
     d.id as documentId,
     d.organization_id as organizationId,
     d.uploaded_by as userId,
     p.page_number as pageNumber,
     p.ocr_text as text,
     d.title,
     d.document_type as documentType,
     p.ocr_confidence as confidence
   FROM document_pages p
   JOIN documents d ON p.document_id = d.id
   WHERE p.search_indexed_at IS NOT NULL AND d.status != 'deleted';" \
  -json > pages_export.json

# This would need to be imported to Meilisearch
# (Requires custom script or manual import)
```

**Solution 3: Force reindex all documents**
```bash
# Reset all jobs to pending (CAUTION: This will reprocess everything)
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "UPDATE ocr_jobs
   SET status='pending', progress=0, error=NULL, started_at=NULL, completed_at=NULL
   WHERE status='completed';"

sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "UPDATE documents SET status='processing' WHERE status='indexed';"

# Restart worker
pkill -f "ocr-worker"
cd /home/setup/navidocs/server
node workers/ocr-worker.js > /tmp/navidocs-ocr-worker.log 2>&1 &
```

---

### 5.3 Corrupt Uploads

#### Symptoms
- PDF won't open
- OCR fails with "invalid PDF" errors
- File size is 0 or suspiciously small

#### Diagnosis

```bash
# Get file info from database
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT id, file_path, file_size, status FROM documents WHERE id='<document-id>';"

# Check actual file
FILE_PATH="<file-path-from-query>"
ls -lh "$FILE_PATH"
file "$FILE_PATH"

# Try to open with pdfinfo (if installed)
pdfinfo "$FILE_PATH"

# Check file hash
sha256sum "$FILE_PATH"
```

#### Solutions

**Solution 1: Mark as failed and remove**
```bash
# Update document status
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "UPDATE documents SET status='failed' WHERE id='<document-id>';"

# Remove corrupted file
rm "<file-path>"

# User can re-upload
```

**Solution 2: Attempt PDF repair (if recoverable)**
```bash
# Try using pdftk or gs to repair
# Install if needed: sudo apt-get install pdftk

pdftk "$FILE_PATH" output repaired.pdf

# Or use Ghostscript
gs -o repaired.pdf -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress "$FILE_PATH"

# If successful, replace
mv repaired.pdf "$FILE_PATH"

# Retry OCR
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "UPDATE ocr_jobs SET status='pending', progress=0 WHERE document_id='<document-id>';"

pkill -f "ocr-worker"
cd /home/setup/navidocs/server
node workers/ocr-worker.js > /tmp/navidocs-ocr-worker.log 2>&1 &
```

**Solution 3: Check upload validation**
```bash
# Review file validation in routes/upload.js
# Ensure magic number check is working

# Test upload with a known good PDF
curl -X POST http://localhost:8001/api/upload \
  -F "file=@/path/to/good-test.pdf" \
  -F "title=Test" \
  -F "documentType=owner-manual" \
  -F "organizationId=test-org-id"
```

---

## 6. Quick Reference Commands

### Health Checks

```bash
# Check all services
ss -tlnp | grep -E ":(6379|7700|8001|8080)"

# Backend health
curl http://localhost:8001/health

# Meilisearch health
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)
curl -H "Authorization: Bearer $MASTER_KEY" http://localhost:7700/health

# Redis ping
redis-cli ping

# Check processes
ps aux | grep -E "navidocs|ocr-worker|vite"
```

### Log Viewing

```bash
# Tail all logs
tail -f /tmp/navidocs-*.log

# Backend only
tail -f /tmp/navidocs-backend.log

# OCR worker only
tail -f /tmp/navidocs-ocr-worker.log

# Search for errors
grep -i error /tmp/navidocs-*.log

# Last 50 lines of all logs
tail -50 /tmp/navidocs-backend.log
tail -50 /tmp/navidocs-ocr-worker.log
tail -50 /tmp/navidocs-frontend.log
```

### Service Control

```bash
# Start all
/home/setup/navidocs/start-all.sh

# Stop all
/home/setup/navidocs/stop-all.sh

# Restart backend only
pkill -f "navidocs.*index.js"
cd /home/setup/navidocs/server
node index.js > /tmp/navidocs-backend.log 2>&1 &

# Restart OCR worker only
pkill -f "ocr-worker"
cd /home/setup/navidocs/server
node workers/ocr-worker.js > /tmp/navidocs-ocr-worker.log 2>&1 &

# Restart frontend only
pkill -f "vite.*8080"
cd /home/setup/navidocs/client
npm run dev > /tmp/navidocs-frontend.log 2>&1 &

# Restart Meilisearch
docker restart boat-manuals-meilisearch
```

### Database Queries

```bash
# Document count
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT COUNT(*) FROM documents WHERE status != 'deleted';"

# Job statuses
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT status, COUNT(*) FROM ocr_jobs GROUP BY status;"

# Recent uploads
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT id, title, status, created_at FROM documents ORDER BY created_at DESC LIMIT 10;"

# Pages indexed
sqlite3 /home/setup/navidocs/server/db/navidocs.db \
  "SELECT COUNT(*) FROM document_pages WHERE search_indexed_at IS NOT NULL;"

# Database size
ls -lh /home/setup/navidocs/server/db/navidocs.db
```

### Redis Commands

```bash
redis-cli

# Queue lengths
LLEN bull:ocr-processing:wait
LLEN bull:ocr-processing:active
LLEN bull:ocr-processing:completed
LLEN bull:ocr-processing:failed

# Memory usage
INFO memory

# Clear queues (CAREFUL!)
DEL bull:ocr-processing:completed
DEL bull:ocr-processing:failed

# Exit
exit
```

### Meilisearch Commands

```bash
MASTER_KEY=$(grep MEILISEARCH_MASTER_KEY /home/setup/navidocs/server/.env | cut -d'=' -f2)

# List indexes
curl -H "Authorization: Bearer $MASTER_KEY" \
     http://localhost:7700/indexes

# Index stats
curl -H "Authorization: Bearer $MASTER_KEY" \
     http://localhost:7700/indexes/navidocs-pages/stats

# Search test
curl -X POST \
  -H "Authorization: Bearer $MASTER_KEY" \
  -H "Content-Type: application/json" \
  http://localhost:7700/indexes/navidocs-pages/search \
  -d '{"q":"test","limit":5}'

# Get index settings
curl -H "Authorization: Bearer $MASTER_KEY" \
     http://localhost:7700/indexes/navidocs-pages/settings
```

### Network & WSL

```bash
# Get WSL IP
hostname -I | awk '{print $1}'

# Check port bindings
ss -tlnp | grep -E ":(6379|7700|8001|8080)"

# Show access URLs
cat << EOF
Frontend (WSL):    http://localhost:8080
Frontend (Windows): http://$(hostname -I | awk '{print $1}'):8080

Backend (WSL):     http://localhost:8001
Backend (Windows):  http://$(hostname -I | awk '{print $1}'):8001
EOF
```

### Cleanup & Maintenance

```bash
# Stop all services
/home/setup/navidocs/stop-all.sh

# Vacuum database
sqlite3 /home/setup/navidocs/server/db/navidocs.db "VACUUM;"

# Clear Redis completed jobs
redis-cli DEL bull:ocr-processing:completed

# Remove old logs
rm /tmp/navidocs-*.log

# Docker cleanup
docker system prune -f

# Restart everything
/home/setup/navidocs/start-all.sh
```

---

## Additional Resources

### Documentation
- Main README: `/home/setup/navidocs/README.md`
- Architecture Docs: `/home/setup/navidocs/docs/architecture/`
- Paths & Credentials: `/home/setup/navidocs/docs/handover/PATHS_AND_CREDENTIALS.md`
- Database Schema: `/home/setup/navidocs/server/db/schema.sql`

### External Documentation
- Meilisearch: https://docs.meilisearch.com/
- BullMQ: https://docs.bullmq.io/
- Vue 3: https://vuejs.org/
- Vite: https://vitejs.dev/
- SQLite: https://www.sqlite.org/docs.html
- Redis: https://redis.io/docs/

### Log Locations
- Backend: `/tmp/navidocs-backend.log`
- OCR Worker: `/tmp/navidocs-ocr-worker.log`
- Frontend: `/tmp/navidocs-frontend.log`
- Meilisearch: `docker logs boat-manuals-meilisearch`

---

## Troubleshooting Checklist

When encountering issues, work through this checklist:

1. **Verify all services are running**
   ```bash
   ss -tlnp | grep -E ":(6379|7700|8001|8080)"
   ps aux | grep -E "navidocs|ocr-worker|vite"
   docker ps | grep meilisearch
   ```

2. **Check logs for errors**
   ```bash
   tail -50 /tmp/navidocs-backend.log
   tail -50 /tmp/navidocs-ocr-worker.log
   grep -i error /tmp/navidocs-*.log
   ```

3. **Test connectivity**
   ```bash
   curl http://localhost:8001/health
   curl http://localhost:7700/health
   redis-cli ping
   ```

4. **Verify environment configuration**
   ```bash
   cat /home/setup/navidocs/server/.env
   ```

5. **Check disk space**
   ```bash
   df -h
   ```

6. **Try clean restart**
   ```bash
   /home/setup/navidocs/stop-all.sh
   sleep 5
   /home/setup/navidocs/start-all.sh
   ```

7. **Review recent changes**
   - Did you modify configuration files?
   - Did Windows restart?
   - Were there system updates?

---

## Getting Help

If issues persist after trying these troubleshooting steps:

1. **Gather diagnostic information**
   ```bash
   # Create diagnostic report
   echo "=== NaviDocs Diagnostic Report ===" > /tmp/navidocs-diagnostics.txt
   echo "Date: $(date)" >> /tmp/navidocs-diagnostics.txt
   echo "" >> /tmp/navidocs-diagnostics.txt

   echo "=== Port Status ===" >> /tmp/navidocs-diagnostics.txt
   ss -tlnp | grep -E ":(6379|7700|8001|8080)" >> /tmp/navidocs-diagnostics.txt
   echo "" >> /tmp/navidocs-diagnostics.txt

   echo "=== Process Status ===" >> /tmp/navidocs-diagnostics.txt
   ps aux | grep -E "navidocs|ocr-worker|vite" >> /tmp/navidocs-diagnostics.txt
   echo "" >> /tmp/navidocs-diagnostics.txt

   echo "=== Backend Logs (last 50 lines) ===" >> /tmp/navidocs-diagnostics.txt
   tail -50 /tmp/navidocs-backend.log >> /tmp/navidocs-diagnostics.txt
   echo "" >> /tmp/navidocs-diagnostics.txt

   echo "=== OCR Worker Logs (last 50 lines) ===" >> /tmp/navidocs-diagnostics.txt
   tail -50 /tmp/navidocs-ocr-worker.log >> /tmp/navidocs-diagnostics.txt

   cat /tmp/navidocs-diagnostics.txt
   ```

2. **Document the issue**
   - What were you trying to do?
   - What error messages did you see?
   - What troubleshooting steps did you already try?
   - Include relevant log snippets

3. **Check GitHub Issues** (if applicable)
   - Search for similar issues
   - Review closed issues for solutions

---

**Last Updated:** 2025-10-19
**Maintainer:** Project Administrator
**Next Review:** Before production deployment
