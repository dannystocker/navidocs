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
