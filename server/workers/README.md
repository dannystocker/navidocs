# NaviDocs OCR Pipeline

## Overview

The OCR pipeline processes PDF documents in the background, extracting text from each page and indexing it in Meilisearch for fast, searchable access.

## Architecture

```
Upload PDF → Create OCR Job → BullMQ Queue → OCR Worker → Database + Meilisearch
```

### Components

1. **OCR Service** (`services/ocr.js`)
   - Converts PDF pages to images using external tools (pdftoppm or ImageMagick)
   - Runs Tesseract.js OCR on each image
   - Returns structured data with text and confidence scores

2. **Search Service** (`services/search.js`)
   - Indexes document pages in Meilisearch
   - Builds proper document structure with metadata
   - Supports multi-vertical indexing (boat, marina, property)

3. **OCR Worker** (`workers/ocr-worker.js`)
   - BullMQ background worker processing jobs from 'ocr-jobs' queue
   - Updates job progress in real-time (0-100%)
   - Saves OCR results to `document_pages` table
   - Indexes pages in Meilisearch with full metadata
   - Updates document status to 'indexed' when complete

## Setup

### 1. Install System Dependencies

The OCR pipeline requires PDF to image conversion tools:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y poppler-utils imagemagick tesseract-ocr

# macOS
brew install poppler imagemagick tesseract

# Verify installation
which pdftoppm
which convert
which tesseract
```

### 2. Install Node Dependencies

```bash
cd server
npm install
```

### 3. Start Redis

BullMQ requires Redis for job queue management:

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install locally
sudo apt-get install redis-server
redis-server
```

### 4. Start Meilisearch

```bash
# Using Docker
docker run -d -p 7700:7700 \
  -e MEILI_MASTER_KEY=masterKey \
  -v $(pwd)/data.ms:/data.ms \
  getmeili/meilisearch:latest

# Or download binary
curl -L https://install.meilisearch.com | sh
./meilisearch --master-key=masterKey
```

### 5. Start the OCR Worker

```bash
# Run worker directly
node workers/ocr-worker.js

# Or use process manager
pm2 start workers/ocr-worker.js --name ocr-worker
```

## Usage

### Creating an OCR Job

```javascript
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';

const ocrQueue = new Queue('ocr-jobs', {
  connection: { host: '127.0.0.1', port: 6379 }
});

// Create job in database
const jobId = uuidv4();
db.prepare(`
  INSERT INTO ocr_jobs (id, document_id, status, created_at)
  VALUES (?, ?, 'pending', ?)
`).run(jobId, documentId, Date.now() / 1000);

// Add job to queue
await ocrQueue.add('process-document', {
  documentId: documentId,
  jobId: jobId,
  filePath: '/path/to/document.pdf'
});
```

### Monitoring Job Progress

```javascript
// Get job from queue
const job = await ocrQueue.getJob(jobId);

// Check progress
const progress = await job.progress(); // 0-100

// Check database for status
const jobStatus = db.prepare(`
  SELECT status, progress, error FROM ocr_jobs WHERE id = ?
`).get(jobId);
```

### Searching Indexed Pages

```javascript
import { searchPages } from './services/search.js';

// Search all pages
const results = await searchPages('bilge pump maintenance', {
  limit: 20,
  offset: 0
});

// Search with filters (user-specific)
const results = await searchPages('electrical system', {
  filter: `userId = "${userId}" AND vertical = "boating"`,
  limit: 10
});

// Search with organization access
const results = await searchPages('generator', {
  filter: `organizationId IN ["org1", "org2"]`,
  sort: ['pageNumber:asc']
});
```

## Database Schema

### ocr_jobs Table

```sql
CREATE TABLE ocr_jobs (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',      -- pending, processing, completed, failed
  progress INTEGER DEFAULT 0,         -- 0-100
  error TEXT,
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);
```

### document_pages Table

```sql
CREATE TABLE document_pages (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,

  -- OCR data
  ocr_text TEXT,
  ocr_confidence REAL,
  ocr_language TEXT DEFAULT 'en',
  ocr_completed_at INTEGER,

  -- Search indexing
  search_indexed_at INTEGER,
  meilisearch_id TEXT,

  metadata TEXT,                      -- JSON
  created_at INTEGER NOT NULL,

  UNIQUE(document_id, page_number),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);
```

## Meilisearch Document Structure

Each indexed page follows this structure:

```json
{
  "id": "page_doc_abc123_p7",
  "vertical": "boating",

  "organizationId": "org_xyz789",
  "organizationName": "Smith Family Boats",

  "entityId": "boat_prestige_f49_001",
  "entityName": "Sea Breeze",
  "entityType": "boat",

  "docId": "doc_abc123",
  "userId": "user_456",

  "documentType": "component-manual",
  "title": "8.7 Blackwater System - Maintenance",
  "pageNumber": 7,
  "text": "The blackwater pump is located...",

  "systems": ["plumbing", "waste-management"],
  "categories": ["maintenance", "troubleshooting"],
  "tags": ["bilge", "pump", "blackwater"],

  "boatName": "Sea Breeze",
  "boatMake": "Prestige",
  "boatModel": "F4.9",
  "boatYear": 2024,

  "language": "en",
  "ocrConfidence": 0.94,

  "createdAt": 1740234567,
  "updatedAt": 1740234567
}
```

## Error Handling

The OCR pipeline handles errors gracefully:

- **PDF Conversion Errors**: Falls back to alternative tools or returns blank page
- **OCR Errors**: Stores page with empty text and confidence = 0
- **Indexing Errors**: Logs error but continues processing other pages
- **Worker Errors**: Updates job status to 'failed' and stores error message

## Performance

### Optimization Tips

1. **Concurrency**: Adjust `OCR_CONCURRENCY` environment variable (default: 2)
2. **Rate Limiting**: Worker processes max 5 jobs per minute
3. **Image Quality**: Uses 300 DPI for optimal OCR accuracy
4. **Cleanup**: Temporary image files are automatically deleted

### Benchmarks

- Small PDF (10 pages): ~30-60 seconds
- Medium PDF (50 pages): ~2-5 minutes
- Large PDF (200 pages): ~10-20 minutes

## Troubleshooting

### PDF Conversion Fails

```bash
# Check if tools are installed
node -e "import('./services/ocr.js').then(m => console.log(m.checkPDFTools()))"

# Install missing tools
sudo apt-get install poppler-utils imagemagick
```

### Tesseract Language Data Missing

```bash
# Install language data
sudo apt-get install tesseract-ocr-eng tesseract-ocr-fra

# For multiple languages
sudo apt-get install tesseract-ocr-all
```

### Redis Connection Errors

```bash
# Check Redis status
redis-cli ping

# Set Redis host/port
export REDIS_HOST=localhost
export REDIS_PORT=6379
```

### Meilisearch Indexing Fails

```bash
# Check Meilisearch is running
curl http://localhost:7700/health

# Set environment variables
export MEILISEARCH_HOST=http://localhost:7700
export MEILISEARCH_MASTER_KEY=masterKey
```

## Development

### Running Tests

```bash
# Test OCR service
node -e "
  import('./services/ocr.js').then(async (ocr) => {
    const results = await ocr.extractTextFromPDF('/path/to/test.pdf');
    console.log(results);
  });
"

# Test search service
node -e "
  import('./services/search.js').then(async (search) => {
    const results = await search.searchPages('test query');
    console.log(results);
  });
"
```

### Monitoring Worker

```bash
# View worker logs
tail -f logs/ocr-worker.log

# Monitor with PM2
pm2 logs ocr-worker

# View queue status
redis-cli
> KEYS bull:ocr-jobs:*
> LLEN bull:ocr-jobs:wait
```

## Production Deployment

### Using PM2

```bash
# Start worker with PM2
pm2 start workers/ocr-worker.js --name ocr-worker --instances 2

# Save PM2 config
pm2 save

# Auto-start on boot
pm2 startup
```

### Using Docker

```dockerfile
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    poppler-utils \
    imagemagick \
    tesseract-ocr \
    tesseract-ocr-data-eng

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .

CMD ["node", "workers/ocr-worker.js"]
```

### Environment Variables

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=masterKey
MEILISEARCH_INDEX_NAME=navidocs-pages

# Database
DATABASE_PATH=/data/navidocs.db

# Worker
OCR_CONCURRENCY=2
```

## License

MIT
