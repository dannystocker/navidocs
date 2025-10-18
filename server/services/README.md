# NaviDocs Services

This directory contains core business logic services for NaviDocs.

## Services

### OCR Service (`ocr.js`)

Handles text extraction from PDF documents using Tesseract.js OCR.

**Key Functions:**

```javascript
import { extractTextFromPDF, extractTextFromImage, checkPDFTools } from './ocr.js';

// Extract text from PDF (all pages)
const results = await extractTextFromPDF('/path/to/document.pdf', {
  language: 'eng',
  onProgress: (pageNum, total) => {
    console.log(`Processing page ${pageNum}/${total}`);
  }
});

// Result format:
// [
//   { pageNumber: 1, text: "Page content...", confidence: 0.94 },
//   { pageNumber: 2, text: "More content...", confidence: 0.89 },
//   ...
// ]

// Extract from single image
const result = await extractTextFromImage('/path/to/image.png', 'eng');

// Check available PDF tools
const tools = checkPDFTools();
// { pdftoppm: true, imagemagick: true }
```

**Requirements:**
- Tesseract.js (installed via npm)
- PDF conversion tool: `poppler-utils` (pdftoppm) or `imagemagick`

**Features:**
- Converts PDF pages to high-quality images (300 DPI)
- Runs Tesseract OCR on each page
- Returns confidence scores for quality assessment
- Graceful error handling per page
- Progress callbacks for long documents

---

### Search Service (`search.js`)

Manages document indexing and search using Meilisearch.

**Key Functions:**

```javascript
import {
  indexDocumentPage,
  bulkIndexPages,
  removePageFromIndex,
  searchPages
} from './search.js';

// Index a single page
await indexDocumentPage({
  pageId: 'page_doc123_1',
  documentId: 'doc123',
  pageNumber: 1,
  text: 'Extracted OCR text...',
  confidence: 0.94
});

// Bulk index multiple pages
await bulkIndexPages([
  { pageId: '...', documentId: '...', pageNumber: 1, text: '...', confidence: 0.94 },
  { pageId: '...', documentId: '...', pageNumber: 2, text: '...', confidence: 0.91 }
]);

// Search with filters
const results = await searchPages('bilge pump maintenance', {
  filter: `userId = "user123" AND vertical = "boating"`,
  limit: 20,
  offset: 0
});

// Remove page from index
await removePageFromIndex('doc123', 5);
```

**Features:**
- Full metadata enrichment from database
- Multi-vertical support (boat, marina, property)
- Automatic entity/component linking
- Tenant isolation via filters
- Real-time indexing

**Document Structure:**

See `docs/architecture/meilisearch-config.json` for complete schema.

Key fields:
- `id`: Unique page identifier (`page_{docId}_p{pageNum}`)
- `vertical`: boating | marina | property
- `organizationId`, `entityId`, `userId`: Access control
- `text`: Full OCR text content
- `systems`, `categories`, `tags`: Metadata arrays
- Boat-specific: `boatMake`, `boatModel`, `boatYear`, `vesselType`
- OCR metadata: `ocrConfidence`, `language`

---

## Usage Examples

### Complete Document Upload Flow

```javascript
import { v4 as uuidv4 } from 'uuid';
import { Queue } from 'bullmq';

// 1. Upload file and create document record
const documentId = uuidv4();
const filePath = '/uploads/boat-manual.pdf';

db.prepare(`
  INSERT INTO documents (
    id, organization_id, entity_id, uploaded_by,
    title, document_type, file_path, file_name,
    file_size, file_hash, page_count, status, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?, ?)
`).run(
  documentId,
  orgId,
  boatId,
  userId,
  'Prestige F4.9 Owner Manual',
  'owner-manual',
  filePath,
  'boat-manual.pdf',
  fileSize,
  fileHash,
  pageCount,
  Date.now() / 1000,
  Date.now() / 1000
);

// 2. Create OCR job
const jobId = uuidv4();
db.prepare(`
  INSERT INTO ocr_jobs (id, document_id, status, created_at)
  VALUES (?, ?, 'pending', ?)
`).run(jobId, documentId, Date.now() / 1000);

// 3. Queue background processing
const ocrQueue = new Queue('ocr-jobs', {
  connection: { host: 'localhost', port: 6379 }
});

await ocrQueue.add('process-document', {
  documentId: documentId,
  jobId: jobId,
  filePath: filePath
});

console.log(`Document ${documentId} queued for OCR processing`);
```

### Search Integration

```javascript
// User searches for maintenance procedures
const query = 'blackwater pump maintenance';

const results = await searchPages(query, {
  // Only show user's documents
  filter: `userId = "${userId}"`,
  limit: 10
});

// Results include:
results.hits.forEach(hit => {
  console.log(`
    Document: ${hit.title}
    Page: ${hit.pageNumber}
    Boat: ${hit.boatName} (${hit.boatMake} ${hit.boatModel})
    Confidence: ${(hit.ocrConfidence * 100).toFixed(0)}%
    Snippet: ${hit._formatted.text.substring(0, 200)}...
  `);
});
```

### Monitoring OCR Progress

```javascript
// Poll job status
const jobStatus = db.prepare(`
  SELECT status, progress, error FROM ocr_jobs WHERE id = ?
`).get(jobId);

console.log(`Status: ${jobStatus.status}`);
console.log(`Progress: ${jobStatus.progress}%`);

if (jobStatus.status === 'failed') {
  console.error(`Error: ${jobStatus.error}`);
}

// Or use BullMQ events
const job = await ocrQueue.getJob(jobId);
job.on('progress', (progress) => {
  console.log(`Processing: ${progress}%`);
});
```

---

## Error Handling

All services use consistent error handling:

```javascript
try {
  await indexDocumentPage(pageData);
} catch (error) {
  if (error.message.includes('Document not found')) {
    // Handle missing document
  } else if (error.message.includes('Meilisearch')) {
    // Handle search service errors
  } else {
    // Generic error handling
  }
}
```

**Common Errors:**

- `OCR extraction failed`: PDF conversion tools missing or file corrupted
- `Failed to index page`: Meilisearch unavailable or configuration issue
- `Document not found`: Database record missing
- `Search failed`: Invalid query or filters

---

## Performance Considerations

### OCR Service

- **Speed**: ~3-6 seconds per page (depends on content density)
- **Quality**: 300 DPI provides optimal OCR accuracy
- **Memory**: ~50-100 MB per worker process
- **Temp Files**: Cleaned up automatically after processing

**Optimization:**
```javascript
// Process multiple documents in parallel (in worker)
OCR_CONCURRENCY=2  // Process 2 docs at once
```

### Search Service

- **Indexing**: ~10-50ms per page
- **Search**: <50ms for typical queries
- **Index Size**: ~1-2 KB per page

**Best Practices:**
- Use filters for tenant isolation
- Limit results with pagination
- Bulk index when possible
- Use specific search terms

---

## Testing

Run the test suite:

```bash
# Test OCR pipeline
node scripts/test-ocr.js

# Test individual service
node -e "
  import('./services/ocr.js').then(async (ocr) => {
    const tools = ocr.checkPDFTools();
    console.log('Available tools:', tools);
  });
"
```

---

## Configuration

Environment variables:

```bash
# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=masterKey
MEILISEARCH_INDEX_NAME=navidocs-pages

# Database
DATABASE_PATH=/data/navidocs.db

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Development

### Adding New Search Filters

Edit `search.js` and add to `buildSearchDocument()`:

```javascript
// Add custom metadata field
if (metadata.customField) {
  searchDoc.customField = metadata.customField;
}
```

Update Meilisearch config in `docs/architecture/meilisearch-config.json`:

```json
{
  "settings": {
    "filterableAttributes": [
      "customField"  // Add here
    ]
  }
}
```

### Supporting New Languages

```javascript
// Install Tesseract language data
sudo apt-get install tesseract-ocr-fra  // French
sudo apt-get install tesseract-ocr-spa  // Spanish

// Use in OCR
const results = await extractTextFromPDF(pdfPath, {
  language: 'fra'  // or 'spa', 'deu', etc.
});
```

---

## See Also

- **Worker Documentation**: `../workers/README.md`
- **Meilisearch Config**: `../../docs/architecture/meilisearch-config.json`
- **Database Schema**: `../../docs/architecture/database-schema.sql`
