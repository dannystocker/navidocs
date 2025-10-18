# NaviDocs OCR Pipeline - Complete Setup Guide

## Overview

The OCR pipeline has been successfully implemented with three core components:

1. **OCR Service** (`server/services/ocr.js`) - PDF to text extraction using Tesseract.js
2. **Search Service** (`server/services/search.js`) - Meilisearch indexing with full metadata
3. **OCR Worker** (`server/workers/ocr-worker.js`) - BullMQ background job processor

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Upload    │─────▶│  Create Job  │─────▶│   BullMQ    │
│   PDF File  │      │  (Database)  │      │    Queue    │
└─────────────┘      └──────────────┘      └─────────────┘
                                                   │
                                                   ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│ Meilisearch │◀─────│   Index      │◀─────│ OCR Worker  │
│   Search    │      │   Pages      │      │  (Process)  │
└─────────────┘      └──────────────┘      └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Database   │
                    │ (doc_pages)  │
                    └──────────────┘
```

## Quick Start

### 1. Install System Dependencies

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
  poppler-utils \
  imagemagick \
  tesseract-ocr \
  tesseract-ocr-eng

# macOS
brew install poppler imagemagick tesseract

# Verify installation
pdftoppm -v
convert -version
tesseract --version
```

### 2. Start Required Services

```bash
# Redis (for BullMQ)
docker run -d --name navidocs-redis \
  -p 6379:6379 \
  redis:alpine

# Meilisearch
docker run -d --name navidocs-meilisearch \
  -p 7700:7700 \
  -e MEILI_MASTER_KEY=masterKey \
  -v $(pwd)/data.ms:/data.ms \
  getmeili/meilisearch:latest

# Verify services
redis-cli ping  # Should return: PONG
curl http://localhost:7700/health  # Should return: {"status":"available"}
```

### 3. Configure Environment

Create `.env` file in `server/` directory:

```bash
# Database
DATABASE_PATH=/home/setup/navidocs/server/db/navidocs.db

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_MASTER_KEY=masterKey
MEILISEARCH_INDEX_NAME=navidocs-pages

# Worker Configuration
OCR_CONCURRENCY=2
```

### 4. Initialize Database

```bash
cd /home/setup/navidocs/server
node db/init.js
```

### 5. Start OCR Worker

```bash
# Direct execution
node workers/ocr-worker.js

# Or with PM2 (recommended for production)
npm install -g pm2
pm2 start workers/ocr-worker.js --name ocr-worker
pm2 save
```

### 6. Test the Pipeline

```bash
# Run system check
node scripts/test-ocr.js

# Run integration examples
node examples/ocr-integration.js
```

## File Structure

```
server/
├── services/
│   ├── ocr.js           ✓ OCR text extraction service
│   ├── search.js        ✓ Meilisearch indexing service
│   ├── queue.js         ✓ BullMQ queue management (existing)
│   └── README.md        ✓ Services documentation
│
├── workers/
│   ├── ocr-worker.js    ✓ Background OCR processor
│   └── README.md        ✓ Worker documentation
│
├── examples/
│   └── ocr-integration.js ✓ Complete workflow examples
│
└── scripts/
    └── test-ocr.js      ✓ System verification script
```

## API Usage

### Creating an OCR Job

```javascript
import { v4 as uuidv4 } from 'uuid';
import { addOcrJob } from './services/queue.js';
import { getDb } from './config/db.js';

// 1. Create document record
const documentId = uuidv4();
const db = getDb();

db.prepare(`
  INSERT INTO documents (
    id, organization_id, entity_id, uploaded_by,
    title, file_path, status, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, 'processing', ?, ?)
`).run(
  documentId,
  organizationId,
  boatId,
  userId,
  'Boat Manual',
  '/uploads/manual.pdf',
  Date.now() / 1000,
  Date.now() / 1000
);

// 2. Create OCR job
const jobId = uuidv4();
db.prepare(`
  INSERT INTO ocr_jobs (id, document_id, status, created_at)
  VALUES (?, ?, 'pending', ?)
`).run(jobId, documentId, Date.now() / 1000);

// 3. Queue for processing
await addOcrJob(documentId, jobId, {
  filePath: '/uploads/manual.pdf'
});

console.log(`Job ${jobId} queued for document ${documentId}`);
```

### Monitoring Progress

```javascript
import { getDb } from './config/db.js';

// Check database status
const job = db.prepare(`
  SELECT status, progress, error FROM ocr_jobs WHERE id = ?
`).get(jobId);

console.log(`Status: ${job.status}`);
console.log(`Progress: ${job.progress}%`);

// Poll for completion
const pollInterval = setInterval(() => {
  const updated = db.prepare(`
    SELECT status, progress FROM ocr_jobs WHERE id = ?
  `).get(jobId);

  if (updated.status === 'completed') {
    clearInterval(pollInterval);
    console.log('OCR complete!');
  } else if (updated.status === 'failed') {
    clearInterval(pollInterval);
    console.error('OCR failed:', updated.error);
  }
}, 2000);
```

### Searching Indexed Content

```javascript
import { searchPages } from './services/search.js';

// Basic search
const results = await searchPages('bilge pump maintenance', {
  limit: 20
});

// User-specific search
const userResults = await searchPages('electrical system', {
  filter: `userId = "${userId}"`,
  limit: 10
});

// Organization search
const orgResults = await searchPages('generator', {
  filter: `organizationId = "${orgId}"`,
  sort: ['pageNumber:asc']
});

// Advanced filtering
const filtered = await searchPages('pump', {
  filter: [
    'vertical = "boating"',
    'systems IN ["plumbing"]',
    'ocrConfidence > 0.8'
  ].join(' AND '),
  limit: 10
});

// Process results
results.hits.forEach(hit => {
  console.log(`Page ${hit.pageNumber}: ${hit.title}`);
  console.log(`Boat: ${hit.boatName} (${hit.boatMake} ${hit.boatModel})`);
  console.log(`Confidence: ${(hit.ocrConfidence * 100).toFixed(0)}%`);
  console.log(`Text: ${hit.text.substring(0, 200)}...`);
});
```

## Database Schema

### ocr_jobs Table

```sql
CREATE TABLE ocr_jobs (
  id TEXT PRIMARY KEY,              -- Job UUID
  document_id TEXT NOT NULL,        -- Reference to documents table
  status TEXT DEFAULT 'pending',    -- pending | processing | completed | failed
  progress INTEGER DEFAULT 0,       -- 0-100 percentage
  error TEXT,                       -- Error message if failed
  started_at INTEGER,               -- Unix timestamp
  completed_at INTEGER,             -- Unix timestamp
  created_at INTEGER NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);
```

### document_pages Table

```sql
CREATE TABLE document_pages (
  id TEXT PRIMARY KEY,              -- Page UUID
  document_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,

  -- OCR data
  ocr_text TEXT,                    -- Extracted text
  ocr_confidence REAL,              -- 0.0 to 1.0
  ocr_language TEXT DEFAULT 'en',
  ocr_completed_at INTEGER,

  -- Search indexing
  search_indexed_at INTEGER,
  meilisearch_id TEXT,              -- ID in Meilisearch

  metadata TEXT,                    -- JSON
  created_at INTEGER NOT NULL,

  UNIQUE(document_id, page_number),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);
```

## Meilisearch Document Structure

Each indexed page contains:

```json
{
  "id": "page_doc123_p7",
  "vertical": "boating",

  "organizationId": "org_xyz",
  "organizationName": "Smith Family Boats",

  "entityId": "boat_abc",
  "entityName": "Sea Breeze",
  "entityType": "boat",

  "docId": "doc123",
  "userId": "user456",

  "documentType": "component-manual",
  "title": "8.7 Blackwater System",
  "pageNumber": 7,
  "text": "The blackwater pump is located...",

  "systems": ["plumbing", "waste-management"],
  "categories": ["maintenance", "troubleshooting"],
  "tags": ["pump", "blackwater"],

  "boatName": "Sea Breeze",
  "boatMake": "Prestige",
  "boatModel": "F4.9",
  "boatYear": 2024,
  "vesselType": "powerboat",

  "language": "en",
  "ocrConfidence": 0.94,

  "createdAt": 1740234567,
  "updatedAt": 1740234567
}
```

## Worker Behavior

The OCR worker:

1. **Processes jobs from 'ocr-jobs' queue**
2. **Updates progress** in database (0-100%)
3. **For each page:**
   - Converts PDF page to image (300 DPI PNG)
   - Runs Tesseract OCR
   - Saves text to `document_pages` table
   - Indexes in Meilisearch with full metadata
4. **On completion:**
   - Updates document status to 'indexed'
   - Marks job as completed
5. **On failure:**
   - Updates job status to 'failed'
   - Stores error message
   - Updates document status to 'failed'

### Worker Configuration

```javascript
// In ocr-worker.js
const worker = new Worker('ocr-jobs', processOCRJob, {
  connection,
  concurrency: 2,        // Process 2 documents simultaneously
  limiter: {
    max: 5,              // Max 5 jobs
    duration: 60000      // Per minute
  }
});
```

## Performance Benchmarks

### Processing Times

- **Small PDF** (10 pages): 30-60 seconds
- **Medium PDF** (50 pages): 2-5 minutes
- **Large PDF** (200 pages): 10-20 minutes

### Resource Usage

- **Memory**: ~50-100 MB per worker
- **CPU**: Moderate (Tesseract OCR is CPU-intensive)
- **Disk**: Temporary images cleaned up automatically

### Search Performance

- **Indexing**: 10-50ms per page
- **Search**: <50ms for typical queries
- **Index Size**: ~1-2 KB per page

## Troubleshooting

### PDF Conversion Fails

```bash
# Check available tools
node -e "import('./services/ocr.js').then(m => console.log(m.checkPDFTools()))"

# Install missing tools
sudo apt-get install poppler-utils imagemagick
```

### Tesseract Not Found

```bash
# Install Tesseract
sudo apt-get install tesseract-ocr tesseract-ocr-eng

# For multiple languages
sudo apt-get install tesseract-ocr-fra tesseract-ocr-spa

# Verify
tesseract --list-langs
```

### Redis Connection Error

```bash
# Check Redis
redis-cli ping

# Start Redis if not running
docker run -d -p 6379:6379 redis:alpine

# Or install locally
sudo apt-get install redis-server
redis-server
```

### Meilisearch Issues

```bash
# Check health
curl http://localhost:7700/health

# View index
curl -H "Authorization: Bearer masterKey" \
  http://localhost:7700/indexes/navidocs-pages/stats

# Restart Meilisearch
docker restart navidocs-meilisearch
```

### Worker Not Processing Jobs

```bash
# Check worker is running
pm2 status

# View worker logs
pm2 logs ocr-worker

# Check queue status
redis-cli
> KEYS bull:ocr-jobs:*
> LLEN bull:ocr-jobs:wait
```

## Production Deployment

### Using Docker Compose

```yaml
version: '3.8'

services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  meilisearch:
    image: getmeili/meilisearch:latest
    ports:
      - "7700:7700"
    environment:
      MEILI_MASTER_KEY: ${MEILISEARCH_MASTER_KEY}
    volumes:
      - meilisearch-data:/data.ms

  ocr-worker:
    build: .
    command: node workers/ocr-worker.js
    environment:
      REDIS_HOST: redis
      MEILISEARCH_HOST: http://meilisearch:7700
      OCR_CONCURRENCY: 2
    depends_on:
      - redis
      - meilisearch
    volumes:
      - ./uploads:/app/uploads

volumes:
  redis-data:
  meilisearch-data:
```

### Environment Variables

```bash
# Required
DATABASE_PATH=/data/navidocs.db
REDIS_HOST=localhost
REDIS_PORT=6379
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=your-secure-key

# Optional
OCR_CONCURRENCY=2
MEILISEARCH_INDEX_NAME=navidocs-pages
```

## Next Steps

1. **Add REST API endpoints** for job creation and monitoring
2. **Implement WebSocket** for real-time progress updates
3. **Add thumbnail generation** for PDF pages
4. **Implement semantic search** with embeddings
5. **Add multi-language support** for OCR
6. **Create admin dashboard** for job monitoring

## Support

- **Documentation**: See `server/services/README.md` and `server/workers/README.md`
- **Examples**: Check `server/examples/ocr-integration.js`
- **Testing**: Run `node scripts/test-ocr.js`

## License

MIT
