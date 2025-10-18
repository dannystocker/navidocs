# NaviDocs OCR Pipeline - Quick Start

## 1. Install Dependencies

```bash
# System dependencies
sudo apt-get install -y poppler-utils imagemagick tesseract-ocr tesseract-ocr-eng

# Node dependencies (already in package.json)
cd server && npm install
```

## 2. Start Services

```bash
# Redis
docker run -d -p 6379:6379 --name navidocs-redis redis:alpine

# Meilisearch
docker run -d -p 7700:7700 --name navidocs-meilisearch \
  -e MEILI_MASTER_KEY=masterKey \
  getmeili/meilisearch:latest
```

## 3. Configure Environment

```bash
cd server
cat > .env << EOF
DATABASE_PATH=./db/navidocs.db
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_MASTER_KEY=masterKey
OCR_CONCURRENCY=2
EOF
```

## 4. Initialize Database

```bash
node db/init.js
```

## 5. Start OCR Worker

```bash
# Terminal 1: Start worker
node workers/ocr-worker.js

# Terminal 2: Start API server
npm start
```

## 6. Test the Pipeline

```bash
# Verify setup
node scripts/test-ocr.js

# Run examples
node examples/ocr-integration.js
```

## Usage Example

```javascript
import { v4 as uuidv4 } from 'uuid';
import { addOcrJob } from './services/queue.js';
import { getDb } from './config/db.js';

// Create document
const documentId = uuidv4();
const jobId = uuidv4();
const db = getDb();

db.prepare(`
  INSERT INTO documents (id, organization_id, uploaded_by, title, file_path, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, 'processing', ?, ?)
`).run(documentId, 'org123', 'user456', 'Boat Manual', '/uploads/manual.pdf', Date.now()/1000, Date.now()/1000);

// Create OCR job
db.prepare(`
  INSERT INTO ocr_jobs (id, document_id, status, created_at)
  VALUES (?, ?, 'pending', ?)
`).run(jobId, documentId, Date.now()/1000);

// Queue for processing
await addOcrJob(documentId, jobId, { filePath: '/uploads/manual.pdf' });

// Monitor progress
setInterval(() => {
  const job = db.prepare('SELECT status, progress FROM ocr_jobs WHERE id = ?').get(jobId);
  console.log(`${job.status}: ${job.progress}%`);
}, 2000);
```

## Search Example

```javascript
import { searchPages } from './services/search.js';

const results = await searchPages('bilge pump maintenance', {
  filter: `userId = "user123"`,
  limit: 10
});

results.hits.forEach(hit => {
  console.log(`Page ${hit.pageNumber}: ${hit.title}`);
  console.log(`Confidence: ${(hit.ocrConfidence * 100).toFixed(0)}%`);
});
```

## File Locations

| File | Purpose |
|------|---------|
| `/home/setup/navidocs/server/services/ocr.js` | OCR text extraction |
| `/home/setup/navidocs/server/services/search.js` | Meilisearch indexing |
| `/home/setup/navidocs/server/workers/ocr-worker.js` | Background processor |
| `/home/setup/navidocs/OCR_PIPELINE_SETUP.md` | Complete documentation |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| PDF conversion fails | Install: `sudo apt-get install poppler-utils` |
| Redis connection error | Start: `docker run -d -p 6379:6379 redis:alpine` |
| Meilisearch not found | Start: `docker run -d -p 7700:7700 getmeili/meilisearch` |
| Worker not processing | Check: `pm2 logs ocr-worker` |

## Next Steps

1. Read full documentation: `OCR_PIPELINE_SETUP.md`
2. Review examples: `server/examples/ocr-integration.js`
3. Check service docs: `server/services/README.md`
4. Review worker docs: `server/workers/README.md`
