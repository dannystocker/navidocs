# NaviDocs API Routes

This directory contains the backend API route modules for NaviDocs server.

## Route Modules

### 1. Upload Route (`upload.js`)
**Endpoint:** `POST /api/upload`

Handles PDF file uploads with validation, storage, and OCR queue processing.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: PDF file (max 50MB)
  - `title`: Document title (string, required)
  - `documentType`: Document type (string, required)
    - Values: `owner-manual`, `component-manual`, `service-record`, etc.
  - `organizationId`: Organization UUID (string, required)
  - `entityId`: Entity UUID (string, optional)
  - `subEntityId`: Sub-entity UUID (string, optional)
  - `componentId`: Component UUID (string, optional)

**Response:**
```json
{
  "jobId": "uuid",
  "documentId": "uuid",
  "message": "File uploaded successfully and queued for processing"
}
```

**Status Codes:**
- `201`: Created - File uploaded successfully
- `400`: Bad Request - Invalid file or missing fields
- `401`: Unauthorized - Authentication required
- `500`: Internal Server Error

**Security:**
- File extension validation (.pdf only)
- MIME type verification (magic number detection)
- File size limit (50MB default)
- Filename sanitization
- SHA256 hash for deduplication

---

### 2. Jobs Route (`jobs.js`)
**Endpoints:**

#### Get Job Status
`GET /api/jobs/:id`

Query OCR job status and progress.

**Response:**
```json
{
  "jobId": "uuid",
  "documentId": "uuid",
  "status": "pending|processing|completed|failed",
  "progress": 0-100,
  "error": "error message or null",
  "startedAt": timestamp,
  "completedAt": timestamp,
  "createdAt": timestamp,
  "document": {
    "id": "uuid",
    "status": "processing|indexed|failed",
    "pageCount": 42
  }
}
```

#### List Jobs
`GET /api/jobs`

List jobs with optional filtering.

**Query Parameters:**
- `status`: Filter by status (`pending`, `processing`, `completed`, `failed`)
- `limit`: Results per page (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "jobs": [
    {
      "jobId": "uuid",
      "documentId": "uuid",
      "documentTitle": "Owner Manual",
      "documentType": "owner-manual",
      "status": "completed",
      "progress": 100,
      "error": null,
      "startedAt": timestamp,
      "completedAt": timestamp,
      "createdAt": timestamp
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0
  }
}
```

**Status Codes:**
- `200`: OK
- `400`: Bad Request - Invalid job ID
- `401`: Unauthorized
- `404`: Not Found - Job not found

---

### 3. Search Route (`search.js`)
**Endpoints:**

#### Generate Tenant Token
`POST /api/search/token`

Generate Meilisearch tenant token for client-side search with 1-hour TTL.

**Request Body:**
```json
{
  "expiresIn": 3600
}
```

**Response:**
```json
{
  "token": "tenant-token-string",
  "expiresAt": "2025-10-19T12:00:00.000Z",
  "expiresIn": 3600,
  "indexName": "navidocs-pages",
  "searchUrl": "http://127.0.0.1:7700"
}
```

**Security:**
- Token scoped to user's organizations
- Row-level security via filters
- Maximum expiration: 24 hours
- Filters: `userId = X OR organizationId IN [Y, Z]`

#### Server-Side Search
`POST /api/search`

Perform server-side search (optional, for server-rendered results).

**Request Body:**
```json
{
  "q": "search query",
  "filters": {
    "documentType": "owner-manual",
    "entityId": "uuid",
    "language": "en"
  },
  "limit": 20,
  "offset": 0
}
```

**Response:**
```json
{
  "hits": [
    {
      "id": "page-uuid",
      "text": "highlighted text",
      "pageNumber": 42,
      "documentId": "uuid",
      "documentTitle": "Owner Manual"
    }
  ],
  "estimatedTotalHits": 150,
  "query": "search query",
  "processingTimeMs": 12,
  "limit": 20,
  "offset": 0
}
```

#### Health Check
`GET /api/search/health`

Check Meilisearch connectivity.

**Response:**
```json
{
  "status": "ok",
  "meilisearch": {
    "status": "available"
  }
}
```

---

### 4. Documents Route (`documents.js`)
**Endpoints:**

#### Get Document
`GET /api/documents/:id`

Query document metadata with ownership verification.

**Response:**
```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "entityId": "uuid",
  "subEntityId": "uuid",
  "componentId": "uuid",
  "uploadedBy": "user-uuid",
  "title": "Owner Manual",
  "documentType": "owner-manual",
  "fileName": "manual.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "pageCount": 42,
  "language": "en",
  "status": "indexed",
  "createdAt": timestamp,
  "updatedAt": timestamp,
  "metadata": {},
  "filePath": "/path/to/file.pdf",
  "pages": [
    {
      "id": "page-uuid",
      "pageNumber": 1,
      "ocrConfidence": 0.95,
      "ocrLanguage": "en",
      "ocrCompletedAt": timestamp,
      "searchIndexedAt": timestamp
    }
  ],
  "entity": {
    "id": "uuid",
    "name": "My Boat",
    "entityType": "boat"
  },
  "component": {
    "id": "uuid",
    "name": "Main Engine",
    "manufacturer": "Caterpillar",
    "modelNumber": "C7.1"
  }
}
```

**Status Codes:**
- `200`: OK
- `400`: Bad Request - Invalid document ID
- `401`: Unauthorized
- `403`: Forbidden - No access to document
- `404`: Not Found

**Security:**
- Ownership verification
- Organization membership check
- Document share permissions

#### List Documents
`GET /api/documents`

List documents with filtering.

**Query Parameters:**
- `organizationId`: Filter by organization
- `entityId`: Filter by entity
- `documentType`: Filter by document type
- `status`: Filter by status
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "organizationId": "uuid",
      "entityId": "uuid",
      "title": "Owner Manual",
      "documentType": "owner-manual",
      "fileName": "manual.pdf",
      "fileSize": 1024000,
      "pageCount": 42,
      "status": "indexed",
      "createdAt": timestamp,
      "updatedAt": timestamp
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Delete Document
`DELETE /api/documents/:id`

Soft delete a document (marks as deleted).

**Response:**
```json
{
  "message": "Document deleted successfully",
  "documentId": "uuid"
}
```

**Status Codes:**
- `200`: OK
- `401`: Unauthorized
- `403`: Forbidden - No permission to delete
- `404`: Not Found

**Permissions:**
- Document uploader
- Organization admin
- Organization manager

---

## Authentication

All routes require authentication via JWT token (except health checks).

**Header:**
```
Authorization: Bearer <jwt-token>
```

The authentication middleware attaches `req.user` with:
```javascript
{
  id: "user-uuid",
  email: "user@example.com",
  name: "User Name"
}
```

---

## Error Handling

All routes follow consistent error response format:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

**Common Status Codes:**
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server error

---

## Database Schema

Routes use the database schema defined in `/server/db/schema.sql`:

**Tables:**
- `documents` - Document metadata
- `document_pages` - OCR results per page
- `ocr_jobs` - Background job queue
- `users` - User accounts
- `organizations` - Organizations
- `user_organizations` - Membership
- `entities` - Boats, marinas, condos
- `components` - Engines, panels, appliances
- `document_shares` - Sharing permissions

---

## Dependencies

**Services:**
- `db/db.js` - SQLite database connection
- `services/file-safety.js` - File validation
- `services/queue.js` - BullMQ job queue
- `config/meilisearch.js` - Meilisearch client

**External:**
- Meilisearch - Search engine (port 7700)
- Redis - Job queue backend (port 6379)
- SQLite - Database storage

---

## Testing

### Upload Example
```bash
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@manual.pdf" \
  -F "title=Owner Manual" \
  -F "documentType=owner-manual" \
  -F "organizationId=<uuid>"
```

### Get Job Status
```bash
curl http://localhost:3001/api/jobs/<job-id> \
  -H "Authorization: Bearer <token>"
```

### Generate Search Token
```bash
curl -X POST http://localhost:3001/api/search/token \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"expiresIn": 3600}'
```

### Get Document
```bash
curl http://localhost:3001/api/documents/<doc-id> \
  -H "Authorization: Bearer <token>"
```

---

## Security Considerations

1. **File Validation**
   - Extension check (.pdf only)
   - MIME type verification (magic numbers)
   - File size limits (50MB default)
   - Filename sanitization

2. **Access Control**
   - JWT authentication required
   - Organization-based permissions
   - Row-level security in Meilisearch
   - Document sharing permissions

3. **Input Sanitization**
   - UUID format validation
   - SQL injection prevention (prepared statements)
   - XSS prevention (no user input in HTML)

4. **Rate Limiting**
   - 100 requests per 15 minutes per IP
   - Configurable via environment variables

---

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_PATH=./db/navidocs.db

# Meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_MASTER_KEY=your-master-key-here
MEILISEARCH_INDEX_NAME=navidocs-pages

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Authentication
JWT_SECRET=your-jwt-secret-here

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```
