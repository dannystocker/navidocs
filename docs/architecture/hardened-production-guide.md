# Hardened Tech Stack - Production-Ready Improvements

## 🚨 Critical Fixes Applied

Based on expert panel review, these are the **must-fix** items before launch.

---

## 1. Background Processing Architecture

### **Problem:**
OCR/PDF processing will spike CPU/RAM on shared hosting and murder request latency.

### **Solution: Job Queue System**

**Option A: BullMQ + Redis (Recommended)**
```javascript
// server/queue/index.js
const Queue = require('bullmq').Queue;
const Worker = require('bullmq').Worker;
const Redis = require('ioredis');

const connection = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null
});

// Create queue
const ocrQueue = new Queue('ocr-processing', { connection });

// Add job (from upload endpoint)
async function queueOCR(fileData) {
  const job = await ocrQueue.add('process-pdf', {
    filePath: fileData.path,
    docId: fileData.id,
    boatId: fileData.boatId
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
  return job.id;
}

// Worker (separate process)
const worker = new Worker('ocr-processing', async job => {
  const { filePath, docId, boatId } = job.data;
  
  // Update job progress
  await job.updateProgress(10);
  
  // Extract text with OCR
  const text = await extractTextWithOCR(filePath);
  await job.updateProgress(50);
  
  // Index in Meilisearch
  await indexDocument({ docId, boatId, text });
  await job.updateProgress(100);
  
  return { docId, pages: text.length };
}, { connection });

worker.on('completed', job => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

module.exports = { queueOCR, ocrQueue };
```

**Option B: SQLite Queue (No Redis dependency)**
```javascript
// server/queue/sqlite-queue.js
const Database = require('better-sqlite3');
const db = new Database('./data/queue.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  )
`);

class SQLiteQueue {
  enqueue(type, payload) {
    const stmt = db.prepare(`
      INSERT INTO jobs (type, payload) VALUES (?, ?)
    `);
    const result = stmt.run(type, JSON.stringify(payload));
    return result.lastInsertRowid;
  }
  
  dequeue() {
    const job = db.prepare(`
      SELECT * FROM jobs 
      WHERE status = 'pending' AND attempts < max_attempts
      ORDER BY created_at ASC LIMIT 1
    `).get();
    
    if (!job) return null;
    
    db.prepare(`
      UPDATE jobs SET status = 'processing', attempts = attempts + 1
      WHERE id = ?
    `).run(job.id);
    
    return {
      ...job,
      payload: JSON.parse(job.payload)
    };
  }
  
  complete(jobId) {
    db.prepare(`UPDATE jobs SET status = 'completed' WHERE id = ?`).run(jobId);
  }
  
  fail(jobId, error) {
    db.prepare(`
      UPDATE jobs SET status = 'failed', error = ? WHERE id = ?
    `).run(error, jobId);
  }
}

module.exports = new SQLiteQueue();
```

**Worker Process (systemd service)**
```ini
# ~/.config/systemd/user/ocr-worker.service
[Unit]
Description=OCR Worker for Boat Docs

[Service]
WorkingDirectory=%h/apps/boat-docs
ExecStart=/usr/bin/node server/workers/ocr-worker.js
Environment=NODE_ENV=production
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
```

---

## 2. File Safety Pipeline

### **Problem:**
Malicious PDFs, zip bombs, broken encodings will wreck your day.

### **Solution: Multi-Layer Validation**

```javascript
// server/middleware/file-safety.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FILE_LIMITS = {
  maxSize: 128 * 1024 * 1024, // 128MB
  maxPages: 1000,
  allowedMimeTypes: ['application/pdf'],
  allowedExtensions: ['.pdf']
};

async function validateUpload(file) {
  const errors = [];
  
  // 1. Extension check
  const ext = path.extname(file.originalname).toLowerCase();
  if (!FILE_LIMITS.allowedExtensions.includes(ext)) {
    errors.push(`Invalid extension: ${ext}`);
  }
  
  // 2. MIME type check
  if (!FILE_LIMITS.allowedMimeTypes.includes(file.mimetype)) {
    errors.push(`Invalid MIME type: ${file.mimetype}`);
  }
  
  // 3. File size
  if (file.size > FILE_LIMITS.maxSize) {
    errors.push(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }
  
  // 4. Magic byte check
  const buffer = fs.readFileSync(file.path);
  if (!buffer.toString('utf8', 0, 4).includes('%PDF')) {
    errors.push('Not a valid PDF (magic bytes)');
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
  
  return true;
}

async function sanitizePDF(inputPath, outputPath) {
  try {
    // Use qpdf to linearize and sanitize
    execSync(`qpdf --linearize --newline-before-endstream "${inputPath}" "${outputPath}"`, {
      timeout: 30000 // 30 second timeout
    });
    
    // Check page count
    const info = execSync(`qpdf --show-npages "${outputPath}"`).toString().trim();
    const pageCount = parseInt(info);
    
    if (pageCount > FILE_LIMITS.maxPages) {
      throw new Error(`Too many pages: ${pageCount}`);
    }
    
    return { sanitized: true, pages: pageCount };
  } catch (err) {
    throw new Error(`PDF sanitization failed: ${err.message}`);
  }
}

async function scanForMalware(filePath) {
  try {
    // ClamAV scan
    execSync(`clamscan --no-summary "${filePath}"`, {
      timeout: 60000 // 1 minute timeout
    });
    return { clean: true };
  } catch (err) {
    if (err.status === 1) {
      throw new Error('Malware detected');
    }
    // ClamAV not installed - log warning but don't fail
    console.warn('ClamAV not available, skipping virus scan');
    return { clean: true, skipped: true };
  }
}

async function safetyPipeline(file) {
  // Step 1: Basic validation
  await validateUpload(file);
  
  // Step 2: Sanitize with qpdf
  const sanitizedPath = `${file.path}.sanitized.pdf`;
  const { pages } = await sanitizePDF(file.path, sanitizedPath);
  
  // Step 3: Malware scan
  await scanForMalware(sanitizedPath);
  
  // Step 4: Replace original with sanitized version
  fs.unlinkSync(file.path);
  fs.renameSync(sanitizedPath, file.path);
  
  return { safe: true, pages };
}

module.exports = { safetyPipeline, validateUpload };
```

**Express route with safety**
```javascript
const multer = require('multer');
const { safetyPipeline } = require('./middleware/file-safety');
const { queueOCR } = require('./queue');

const upload = multer({ dest: './uploads/temp/' });

app.post('/api/upload', upload.single('manual'), async (req, res) => {
  try {
    // Safety pipeline
    const { pages } = await safetyPipeline(req.file);
    
    // Move to permanent storage
    const docId = generateId();
    const finalPath = `./data/boat-manuals/${docId}.pdf`;
    fs.renameSync(req.file.path, finalPath);
    
    // Queue for OCR processing
    const jobId = await queueOCR({
      filePath: finalPath,
      docId,
      boatId: req.body.boatId,
      pages
    });
    
    res.json({ 
      docId, 
      jobId, 
      status: 'processing',
      pages 
    });
  } catch (err) {
    // Clean up on failure
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ error: err.message });
  }
});

// Job status endpoint
app.get('/api/jobs/:jobId', async (req, res) => {
  const job = await ocrQueue.getJob(req.params.jobId);
  res.json({
    id: job.id,
    progress: job.progress,
    state: await job.getState(),
    result: job.returnvalue
  });
});
```

---

## 3. Meilisearch Security

### **Problem:**
Port 7700 exposed = public data. Master key in client code = disaster.

### **Solution: Tenant Tokens**

```javascript
// server/services/search.js
const { MeiliSearch } = require('meilisearch');

const client = new MeiliSearch({
  host: 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_MASTER_KEY // NEVER send to client!
});

// Generate tenant token (short-lived, scoped)
function generateTenantToken(userId, boatIds) {
  const searchRules = {
    'boat-manuals': {
      filter: `boatId IN [${boatIds.map(id => `"${id}"`).join(', ')}]`
    }
  };
  
  const token = client.generateTenantToken(searchRules, {
    apiKey: process.env.MEILISEARCH_MASTER_KEY,
    expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour
  });
  
  return token;
}

// API endpoint to get search token
app.get('/api/search/token', requireAuth, async (req, res) => {
  const userBoats = await getUserBoats(req.user.id);
  const token = generateTenantToken(req.user.id, userBoats);
  
  res.json({ 
    token,
    host: 'https://digital-lab.ca', // Through reverse proxy
    expiresIn: 3600
  });
});

module.exports = { client, generateTenantToken };
```

**Frontend usage (safe)**
```javascript
// client/src/services/search.js
let searchClient = null;

async function getSearchClient() {
  if (!searchClient) {
    // Fetch tenant token from backend
    const { token, host } = await fetch('/api/search/token').then(r => r.json());
    
    searchClient = new MeiliSearch({
      host,
      apiKey: token // Scoped, time-limited token
    });
  }
  return searchClient;
}

async function searchManuals(query) {
  const client = await getSearchClient();
  const index = client.index('boat-manuals');
  
  const results = await index.search(query, {
    filter: 'system = "electrical"', // Additional client-side filter
    attributesToHighlight: ['text', 'title']
  });
  
  return results;
}
```

**Nginx reverse proxy (for Meilisearch)**
```nginx
# /etc/nginx/sites-available/digital-lab.ca
location /search/ {
    proxy_pass http://localhost:7700/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    
    # Only allow POST (search), block admin endpoints
    limit_except POST {
        deny all;
    }
}
```

---

## 4. Backup Validation Script

### **Problem:**
Everyone has backups. Few have restores.

### **Solution: Automated Restore Testing**

```bash
#!/bin/bash
# ~/bin/validate-backups

set -e

BACKUP_DIR=~/backups
TEST_DIR=/tmp/restore-test-$(date +%s)
LOG_FILE=~/logs/backup-validation.log

echo "[$(date)] Starting backup validation" | tee -a "$LOG_FILE"

# Create test directory
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# 1. Restore SQLite databases
echo "Testing SQLite restore..." | tee -a "$LOG_FILE"
LATEST_DB=$(ls -t "$BACKUP_DIR"/gitea-backup-*.tar.gz | head -1)

tar -xzf "$LATEST_DB" gitea/data/gitea.db
sqlite3 gitea/data/gitea.db "PRAGMA integrity_check;" || {
  echo "ERROR: SQLite integrity check failed" | tee -a "$LOG_FILE"
  exit 1
}

echo "✓ SQLite database intact" | tee -a "$LOG_FILE"

# 2. Restore and test Meilisearch dump
echo "Testing Meilisearch restore..." | tee -a "$LOG_FILE"
LATEST_MEILI=$(ls -t "$BACKUP_DIR"/meilisearch-*.dump | head -1)

# Start temporary Meilisearch instance
/tmp/meilisearch --db-path "$TEST_DIR/meili-test" --import-dump "$LATEST_MEILI" --http-addr localhost:7777 &
MEILI_PID=$!
sleep 5

# Test search works
SEARCH_RESULT=$(curl -s http://localhost:7777/indexes/boat-manuals/search -d '{"q":"test"}')
if echo "$SEARCH_RESULT" | grep -q "hits"; then
  echo "✓ Meilisearch restore successful" | tee -a "$LOG_FILE"
else
  echo "ERROR: Meilisearch search failed" | tee -a "$LOG_FILE"
  kill $MEILI_PID
  exit 1
fi

kill $MEILI_PID

# 3. Verify file backups
echo "Testing file restore..." | tee -a "$LOG_FILE"
SAMPLE_FILES=$(find "$BACKUP_DIR/boat-manuals" -type f | head -10)
FILE_COUNT=$(echo "$SAMPLE_FILES" | wc -l)

if [ "$FILE_COUNT" -lt 1 ]; then
  echo "ERROR: No backup files found" | tee -a "$LOG_FILE"
  exit 1
fi

echo "✓ Found $FILE_COUNT sample files" | tee -a "$LOG_FILE"

# 4. Test rclone remote
echo "Testing off-box backup..." | tee -a "$LOG_FILE"
rclone ls b2:boatvault-backups/$(date +%Y-%m) | head -5 || {
  echo "ERROR: Off-box backup unreachable" | tee -a "$LOG_FILE"
  exit 1
}

echo "✓ Off-box backup accessible" | tee -a "$LOG_FILE"

# Cleanup
cd /
rm -rf "$TEST_DIR"

echo "[$(date)] ✅ All backup validation tests passed" | tee -a "$LOG_FILE"

# Send success notification (optional)
curl -X POST https://digital-lab.ca/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"type":"backup-validation","status":"success"}' || true
```

**Cron job for monthly validation**
```bash
# crontab -e
0 3 1 * * /home/user/bin/validate-backups
```

---

## 5. Systemd Health Checks

```javascript
// server/routes/health.js
const express = require('express');
const router = express.Router();
const { client: meilisearch } = require('../services/search');
const db = require('../services/database');

router.get('/health', async (req, res) => {
  const checks = {
    app: 'ok',
    database: 'unknown',
    search: 'unknown',
    queue: 'unknown'
  };
  
  let healthy = true;
  
  // Check database
  try {
    db.prepare('SELECT 1').get();
    checks.database = 'ok';
  } catch (err) {
    checks.database = 'error';
    healthy = false;
  }
  
  // Check Meilisearch
  try {
    await meilisearch.health();
    checks.search = 'ok';
  } catch (err) {
    checks.search = 'error';
    healthy = false;
  }
  
  // Check queue (if using Redis)
  try {
    const { Queue } = require('bullmq');
    const queue = new Queue('ocr-processing');
    await queue.isPaused();
    checks.queue = 'ok';
  } catch (err) {
    checks.queue = 'error';
    healthy = false;
  }
  
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
```

**Monitoring with systemd**
```ini
# ~/.config/systemd/user/boat-docs-healthcheck.service
[Unit]
Description=Boat Docs Health Check

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -f http://localhost:8080/health

# ~/.config/systemd/user/boat-docs-healthcheck.timer
[Unit]
Description=Run boat-docs health check every 5 minutes

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

---

## 6. Security Headers & Rate Limiting

```javascript
// server/middleware/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Helmet configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind might need this
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://digital-lab.ca"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Upload limit exceeded'
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: 'Search rate limit exceeded'
});

module.exports = {
  securityHeaders,
  apiLimiter,
  uploadLimiter,
  searchLimiter
};
```

**Apply in Express**
```javascript
const { securityHeaders, apiLimiter, uploadLimiter, searchLimiter } = require('./middleware/security');

// Global security
app.use(securityHeaders);

// Per-route rate limiting
app.use('/api/', apiLimiter);
app.post('/api/upload', uploadLimiter, uploadHandler);
app.post('/api/search', searchLimiter, searchHandler);
```

---

## 7. Gitea Upgrade Procedure

```bash
#!/bin/bash
# ~/bin/upgrade-gitea

set -e

GITEA_VERSION="1.24.0"
GITEA_BINARY="/tmp/gitea"
BACKUP_DIR=~/backups/gitea-pre-upgrade-$(date +%Y%m%d-%H%M%S)

echo "Upgrading Gitea to $GITEA_VERSION"

# 1. Stop Gitea
echo "Stopping Gitea..."
systemctl --user stop gitea.service || ssh stackcp "systemctl --user stop gitea.service"

# 2. Backup current version
echo "Creating backup..."
mkdir -p "$BACKUP_DIR"
cp -r ~/gitea "$BACKUP_DIR/"
cp "$GITEA_BINARY" "$BACKUP_DIR/gitea.old"

# 3. Download new version
echo "Downloading Gitea $GITEA_VERSION..."
curl -fsSL "https://dl.gitea.com/gitea/$GITEA_VERSION/gitea-$GITEA_VERSION-linux-amd64" -o "$GITEA_BINARY.new"
chmod 755 "$GITEA_BINARY.new"

# 4. Test new binary
echo "Testing new binary..."
"$GITEA_BINARY.new" --version

# 5. Replace binary
mv "$GITEA_BINARY" "$GITEA_BINARY.old"
mv "$GITEA_BINARY.new" "$GITEA_BINARY"

# 6. Start Gitea
echo "Starting Gitea..."
systemctl --user start gitea.service || ssh stackcp "systemctl --user start gitea.service"

# 7. Verify
sleep 5
if curl -f http://localhost:4000/ > /dev/null 2>&1; then
  echo "✅ Gitea upgrade successful to $GITEA_VERSION"
  "$GITEA_BINARY" --version
else
  echo "❌ Gitea failed to start, rolling back..."
  mv "$GITEA_BINARY.old" "$GITEA_BINARY"
  systemctl --user start gitea.service
  exit 1
fi
```

---

## Summary: Production Hardening Checklist

- [ ] Background queue for OCR (BullMQ or SQLite)
- [ ] File safety pipeline (qpdf, ClamAV, validation)
- [ ] Meilisearch tenant tokens (never expose master key)
- [ ] Backup validation script (monthly restore tests)
- [ ] Health check endpoints + monitoring
- [ ] Security headers (helmet, CSP, HSTS)
- [ ] Rate limiting (upload, search, API)
- [ ] Gitea 1.24.0 upgrade
- [ ] logrotate for application logs
- [ ] systemd Restart=on-failure for all services

**Deploy these before showing BoatVault to real users.**

