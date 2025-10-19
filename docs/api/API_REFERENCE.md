# NaviDocs API Reference

Complete API documentation for the NaviDocs backend service.

**Base URL:** `http://localhost:3001` (development)

**API Version:** 1.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Document Management](#document-management)
   - [Upload Document](#upload-document)
   - [Get Document](#get-document)
   - [List Documents](#list-documents)
   - [Delete Document](#delete-document)
   - [Stream PDF](#stream-pdf)
3. [Search](#search)
   - [Generate Search Token](#generate-search-token)
   - [Server-Side Search](#server-side-search)
   - [Search Health Check](#search-health-check)
4. [Jobs](#jobs)
   - [Get Job Status](#get-job-status)
   - [List Jobs](#list-jobs)
5. [General](#general)
   - [Health Check](#health-check)

---

## Authentication

**Status:** Currently in development. The API uses a placeholder `test-user-id` for authentication.

**Planned Implementation:** JWT-based authentication will be added. Once implemented, all API requests will require an `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

**Access Control:**
- Documents are scoped to organizations
- Users must be members of an organization to access its documents
- Documents can be shared with specific users
- Delete operations require uploader or admin/manager role

---

## Document Management

### Upload Document

Upload a PDF file and queue it for OCR processing.

**Endpoint:** `POST /api/upload`

**Content-Type:** `multipart/form-data`

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | PDF file to upload (max 50MB) |
| `title` | string | Yes | Document title |
| `documentType` | string | Yes | Type of document (e.g., "owner-manual", "component-manual", "technical-specification") |
| `organizationId` | string | Yes | Organization UUID |
| `entityId` | string | No | Optional entity UUID to link the document |
| `subEntityId` | string | No | Optional sub-entity UUID |
| `componentId` | string | No | Optional component UUID to link the document |

**Request Example:**

```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@/path/to/document.pdf" \
  -F "title=HVAC System Manual" \
  -F "documentType=component-manual" \
  -F "organizationId=550e8400-e29b-41d4-a716-446655440000" \
  -F "entityId=660e8400-e29b-41d4-a716-446655440000" \
  -F "componentId=770e8400-e29b-41d4-a716-446655440000"
```

**Success Response (201 Created):**

```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "documentId": "234e5678-e89b-12d3-a456-426614174000",
  "message": "File uploaded successfully and queued for processing"
}
```

**Error Responses:**

**400 Bad Request** - Missing required fields:
```json
{
  "error": "Missing required fields: title, documentType, organizationId"
}
```

**400 Bad Request** - Invalid file:
```json
{
  "error": "Only PDF files are allowed"
}
```

**400 Bad Request** - No file uploaded:
```json
{
  "error": "No file uploaded"
}
```

**413 Payload Too Large** - File too large:
```json
{
  "error": "File too large"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Upload failed",
  "message": "Detailed error message"
}
```

**Notes:**
- Files are validated for PDF format and malicious content
- Filenames are sanitized for security
- SHA-256 hash is calculated for deduplication detection
- OCR processing begins automatically after upload
- Use the returned `jobId` to track processing status

---

### Get Document

Retrieve document metadata and page information.

**Endpoint:** `GET /api/documents/:id`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Document UUID |

**Request Example:**

```bash
curl -X GET http://localhost:3001/api/documents/234e5678-e89b-12d3-a456-426614174000
```

**Success Response (200 OK):**

```json
{
  "id": "234e5678-e89b-12d3-a456-426614174000",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "entityId": "660e8400-e29b-41d4-a716-446655440000",
  "subEntityId": null,
  "componentId": "770e8400-e29b-41d4-a716-446655440000",
  "uploadedBy": "test-user-id",
  "title": "HVAC System Manual",
  "documentType": "component-manual",
  "fileName": "hvac-manual.pdf",
  "fileSize": 2457600,
  "mimeType": "application/pdf",
  "pageCount": 45,
  "language": "eng",
  "status": "completed",
  "createdAt": 1729353600000,
  "updatedAt": 1729353945000,
  "metadata": {
    "custom_field": "value"
  },
  "filePath": "/path/to/uploads/234e5678-e89b-12d3-a456-426614174000.pdf",
  "pages": [
    {
      "id": "345e6789-e89b-12d3-a456-426614174000",
      "pageNumber": 1,
      "ocrConfidence": 95.5,
      "ocrLanguage": "eng",
      "ocrCompletedAt": 1729353800000,
      "searchIndexedAt": 1729353820000
    },
    {
      "id": "456e7890-e89b-12d3-a456-426614174000",
      "pageNumber": 2,
      "ocrConfidence": 97.2,
      "ocrLanguage": "eng",
      "ocrCompletedAt": 1729353805000,
      "searchIndexedAt": 1729353825000
    }
  ],
  "entity": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Building A",
    "entity_type": "building"
  },
  "component": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "Rooftop HVAC Unit #1",
    "manufacturer": "Carrier",
    "model_number": "48HCEDD12A2A6A0A0A0"
  }
}
```

**Error Responses:**

**400 Bad Request** - Invalid UUID format:
```json
{
  "error": "Invalid document ID format"
}
```

**403 Forbidden** - Access denied:
```json
{
  "error": "Access denied",
  "message": "You do not have permission to view this document"
}
```

**404 Not Found:**
```json
{
  "error": "Document not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to retrieve document",
  "message": "Detailed error message"
}
```

**Notes:**
- Requires user to be a member of the document's organization, the uploader, or have shared access
- Returns complete page information including OCR confidence scores
- Includes linked entity and component information if available
- `filePath` should be restricted in production environments

---

### List Documents

Retrieve a paginated list of documents with optional filtering.

**Endpoint:** `GET /api/documents`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `organizationId` | string | No | Filter by organization UUID |
| `entityId` | string | No | Filter by entity UUID |
| `documentType` | string | No | Filter by document type |
| `status` | string | No | Filter by status (processing, completed, failed, deleted) |
| `limit` | number | No | Number of results per page (default: 50) |
| `offset` | number | No | Pagination offset (default: 0) |

**Request Example:**

```bash
# Get all documents
curl -X GET http://localhost:3001/api/documents

# Get documents with filters
curl -X GET "http://localhost:3001/api/documents?organizationId=550e8400-e29b-41d4-a716-446655440000&documentType=component-manual&status=completed&limit=20&offset=0"
```

**Success Response (200 OK):**

```json
{
  "documents": [
    {
      "id": "234e5678-e89b-12d3-a456-426614174000",
      "organizationId": "550e8400-e29b-41d4-a716-446655440000",
      "entityId": "660e8400-e29b-41d4-a716-446655440000",
      "title": "HVAC System Manual",
      "documentType": "component-manual",
      "fileName": "hvac-manual.pdf",
      "fileSize": 2457600,
      "pageCount": 45,
      "status": "completed",
      "createdAt": 1729353600000,
      "updatedAt": 1729353945000
    },
    {
      "id": "345e6789-e89b-12d3-a456-426614174001",
      "organizationId": "550e8400-e29b-41d4-a716-446655440000",
      "entityId": "660e8400-e29b-41d4-a716-446655440000",
      "title": "Boiler Installation Guide",
      "documentType": "component-manual",
      "fileName": "boiler-guide.pdf",
      "fileSize": 1892352,
      "pageCount": 32,
      "status": "completed",
      "createdAt": 1729353500000,
      "updatedAt": 1729353845000
    }
  ],
  "pagination": {
    "total": 125,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Error Responses:**

**500 Internal Server Error:**
```json
{
  "error": "Failed to retrieve documents",
  "message": "Detailed error message"
}
```

**Notes:**
- Only returns documents from organizations the user is a member of
- Results are ordered by creation date (newest first)
- Use `offset` and `limit` for pagination
- `hasMore` indicates if there are additional pages available

---

### Delete Document

Soft delete a document (marks as deleted without removing the file).

**Endpoint:** `DELETE /api/documents/:id`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Document UUID |

**Request Example:**

```bash
curl -X DELETE http://localhost:3001/api/documents/234e5678-e89b-12d3-a456-426614174000
```

**Success Response (200 OK):**

```json
{
  "message": "Document deleted successfully",
  "documentId": "234e5678-e89b-12d3-a456-426614174000"
}
```

**Error Responses:**

**403 Forbidden** - Insufficient permissions:
```json
{
  "error": "Access denied",
  "message": "You do not have permission to delete this document"
}
```

**404 Not Found:**
```json
{
  "error": "Document not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to delete document",
  "message": "Detailed error message"
}
```

**Notes:**
- Requires user to be the uploader OR have admin/manager role in the organization
- Soft delete: document status is set to "deleted" but file is not removed
- Document will no longer appear in list/search results
- Operation cannot be undone through the API (requires database access)

---

### Stream PDF

Stream the original PDF file for viewing.

**Endpoint:** `GET /api/documents/:id/pdf`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Document UUID |

**Request Example:**

```bash
curl -X GET http://localhost:3001/api/documents/234e5678-e89b-12d3-a456-426614174000/pdf
```

**Success Response (200 OK):**

Returns the PDF file with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: inline; filename="hvac-manual.pdf"`

The PDF will be streamed directly to the client for inline viewing.

**Error Responses:**

**400 Bad Request** - Invalid UUID format:
```json
{
  "error": "Invalid document ID format"
}
```

**403 Forbidden** - Access denied:
```json
{
  "error": "Access denied"
}
```

**404 Not Found** - Document not found:
```json
{
  "error": "Document not found"
}
```

**404 Not Found** - PDF file not found on disk:
```json
{
  "error": "PDF file not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to serve PDF",
  "message": "Detailed error message"
}
```

**Notes:**
- Requires same access permissions as Get Document
- PDF is served with `Content-Disposition: inline` for browser viewing
- File is streamed from disk (not loaded into memory)
- Can be used directly in `<iframe>` or PDF viewer components

**Example HTML Usage:**

```html
<iframe
  src="http://localhost:3001/api/documents/234e5678-e89b-12d3-a456-426614174000/pdf"
  width="100%"
  height="600px">
</iframe>
```

---

## Search

### Generate Search Token

Generate a Meilisearch tenant token for client-side search with scoped access.

**Endpoint:** `POST /api/search/token`

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `expiresIn` | number | No | Token expiration in seconds (default: 3600, max: 86400) |

**Request Example:**

```bash
curl -X POST http://localhost:3001/api/search/token \
  -H "Content-Type: application/json" \
  -d '{"expiresIn": 7200}'
```

**Success Response (200 OK) - Tenant Token:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2024-10-20T12:00:00.000Z",
  "expiresIn": 7200,
  "indexName": "navidocs-pages",
  "searchUrl": "http://127.0.0.1:7700",
  "mode": "tenant"
}
```

**Success Response (200 OK) - Fallback Search Key:**

If tenant token generation fails, falls back to search API key:

```json
{
  "token": "meilisearch-search-api-key",
  "expiresAt": null,
  "expiresIn": null,
  "indexName": "navidocs-pages",
  "searchUrl": "http://127.0.0.1:7700",
  "mode": "search-key"
}
```

**Error Responses:**

**403 Forbidden** - No organizations:
```json
{
  "error": "No organizations found for user"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to generate search token",
  "message": "Detailed error message"
}
```

**Notes:**
- Tenant tokens are scoped to user's organizations (multi-tenant security)
- Tokens can be used directly with Meilisearch client-side SDK
- Maximum expiration is 24 hours (86400 seconds)
- Fallback to search key if tenant token generation fails
- `mode` field indicates which type of token was returned

**Client-Side Usage Example:**

```javascript
// Get search token
const response = await fetch('http://localhost:3001/api/search/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ expiresIn: 3600 })
});

const { token, searchUrl, indexName } = await response.json();

// Use with Meilisearch client
import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: searchUrl,
  apiKey: token
});

const results = await client.index(indexName).search('HVAC maintenance', {
  limit: 20,
  attributesToHighlight: ['text'],
  attributesToCrop: ['text'],
  cropLength: 200
});
```

---

### Server-Side Search

Perform server-side search with automatic access control filtering.

**Endpoint:** `POST /api/search`

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `filters` | object | No | Additional filters (documentType, entityId, language) |
| `limit` | number | No | Number of results (default: 20) |
| `offset` | number | No | Pagination offset (default: 0) |

**Request Example:**

```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "q": "HVAC maintenance schedule",
    "filters": {
      "documentType": "component-manual",
      "entityId": "660e8400-e29b-41d4-a716-446655440000"
    },
    "limit": 10,
    "offset": 0
  }'
```

**Success Response (200 OK):**

```json
{
  "hits": [
    {
      "id": "page-345e6789-e89b-12d3-a456-426614174000",
      "documentId": "234e5678-e89b-12d3-a456-426614174000",
      "pageNumber": 12,
      "text": "Annual HVAC maintenance schedule: Check refrigerant levels...",
      "documentTitle": "HVAC System Manual",
      "documentType": "component-manual",
      "organizationId": "550e8400-e29b-41d4-a716-446655440000",
      "entityId": "660e8400-e29b-41d4-a716-446655440000",
      "userId": "test-user-id",
      "language": "eng",
      "ocrConfidence": 95.5,
      "_formatted": {
        "text": "Annual <em>HVAC maintenance schedule</em>: Check refrigerant levels..."
      }
    },
    {
      "id": "page-456e7890-e89b-12d3-a456-426614174000",
      "documentId": "234e5678-e89b-12d3-a456-426614174000",
      "pageNumber": 13,
      "text": "Quarterly maintenance tasks include filter replacement...",
      "documentTitle": "HVAC System Manual",
      "documentType": "component-manual",
      "organizationId": "550e8400-e29b-41d4-a716-446655440000",
      "entityId": "660e8400-e29b-41d4-a716-446655440000",
      "userId": "test-user-id",
      "language": "eng",
      "ocrConfidence": 97.2,
      "_formatted": {
        "text": "Quarterly <em>maintenance</em> tasks include filter replacement..."
      }
    }
  ],
  "estimatedTotalHits": 24,
  "query": "HVAC maintenance schedule",
  "processingTimeMs": 12,
  "limit": 10,
  "offset": 0
}
```

**Error Responses:**

**400 Bad Request** - Missing query:
```json
{
  "error": "Query parameter \"q\" is required"
}
```

**403 Forbidden** - No organizations:
```json
{
  "error": "No organizations found for user"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Search failed",
  "message": "Detailed error message"
}
```

**Notes:**
- Automatically filters results by user's organizations
- Results include highlighted text with matched terms
- Text is cropped to 200 characters around matches
- Additional filters can be combined with boolean AND logic
- `_formatted` contains highlighted and cropped text for display

**Available Filters:**

| Filter | Type | Description |
|--------|------|-------------|
| `documentType` | string | Filter by document type |
| `entityId` | string | Filter by entity UUID |
| `language` | string | Filter by OCR language code |

---

### Search Health Check

Check Meilisearch service health status.

**Endpoint:** `GET /api/search/health`

**Request Example:**

```bash
curl -X GET http://localhost:3001/api/search/health
```

**Success Response (200 OK):**

```json
{
  "status": "ok",
  "meilisearch": {
    "status": "available"
  }
}
```

**Error Response (503 Service Unavailable):**

```json
{
  "status": "error",
  "error": "Meilisearch unavailable",
  "message": "Connection refused"
}
```

**Notes:**
- Use this endpoint to verify Meilisearch is running
- Returns 503 if Meilisearch is not accessible
- Can be included in system health monitoring

---

## Jobs

### Get Job Status

Retrieve the status and progress of an OCR processing job.

**Endpoint:** `GET /api/jobs/:id`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Job UUID |

**Request Example:**

```bash
curl -X GET http://localhost:3001/api/jobs/123e4567-e89b-12d3-a456-426614174000
```

**Success Response (200 OK) - Processing:**

```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "documentId": "234e5678-e89b-12d3-a456-426614174000",
  "status": "processing",
  "progress": 45,
  "error": null,
  "startedAt": 1729353650000,
  "completedAt": null,
  "createdAt": 1729353600000
}
```

**Success Response (200 OK) - Completed:**

```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "documentId": "234e5678-e89b-12d3-a456-426614174000",
  "status": "completed",
  "progress": 100,
  "error": null,
  "startedAt": 1729353650000,
  "completedAt": 1729353945000,
  "createdAt": 1729353600000,
  "document": {
    "id": "234e5678-e89b-12d3-a456-426614174000",
    "status": "completed",
    "pageCount": 45
  }
}
```

**Success Response (200 OK) - Failed:**

```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "documentId": "234e5678-e89b-12d3-a456-426614174000",
  "status": "failed",
  "progress": 12,
  "error": "OCR processing failed: Invalid PDF structure",
  "startedAt": 1729353650000,
  "completedAt": 1729353720000,
  "createdAt": 1729353600000
}
```

**Error Responses:**

**400 Bad Request** - Invalid UUID:
```json
{
  "error": "Invalid job ID format"
}
```

**404 Not Found:**
```json
{
  "error": "Job not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to retrieve job status",
  "message": "Detailed error message"
}
```

**Job Statuses:**

| Status | Description |
|--------|-------------|
| `pending` | Job is queued and waiting to start |
| `processing` | Job is currently being processed |
| `completed` | Job completed successfully |
| `failed` | Job failed with an error |

**Notes:**
- Poll this endpoint to track upload processing progress
- `progress` is a percentage (0-100)
- Completed jobs include document information
- Failed jobs include error details
- No authentication required (job ID acts as access token)

**Polling Example:**

```javascript
async function waitForJobCompletion(jobId) {
  while (true) {
    const response = await fetch(`http://localhost:3001/api/jobs/${jobId}`);
    const job = await response.json();

    if (job.status === 'completed') {
      console.log('Job completed!', job.document);
      return job;
    } else if (job.status === 'failed') {
      console.error('Job failed:', job.error);
      throw new Error(job.error);
    }

    console.log(`Progress: ${job.progress}%`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  }
}
```

---

### List Jobs

Retrieve a paginated list of OCR jobs for the current user.

**Endpoint:** `GET /api/jobs`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status (pending, processing, completed, failed) |
| `limit` | number | No | Number of results per page (default: 50) |
| `offset` | number | No | Pagination offset (default: 0) |

**Request Example:**

```bash
# Get all jobs
curl -X GET http://localhost:3001/api/jobs

# Get failed jobs only
curl -X GET "http://localhost:3001/api/jobs?status=failed&limit=20&offset=0"
```

**Success Response (200 OK):**

```json
{
  "jobs": [
    {
      "jobId": "123e4567-e89b-12d3-a456-426614174000",
      "documentId": "234e5678-e89b-12d3-a456-426614174000",
      "documentTitle": "HVAC System Manual",
      "documentType": "component-manual",
      "status": "completed",
      "progress": 100,
      "error": null,
      "startedAt": 1729353650000,
      "completedAt": 1729353945000,
      "createdAt": 1729353600000
    },
    {
      "jobId": "223e4567-e89b-12d3-a456-426614174001",
      "documentId": "334e5678-e89b-12d3-a456-426614174001",
      "documentTitle": "Boiler Manual",
      "documentType": "component-manual",
      "status": "processing",
      "progress": 67,
      "error": null,
      "startedAt": 1729353700000,
      "completedAt": null,
      "createdAt": 1729353680000
    },
    {
      "jobId": "323e4567-e89b-12d3-a456-426614174002",
      "documentId": "434e5678-e89b-12d3-a456-426614174002",
      "documentTitle": "Electrical Schematics",
      "documentType": "technical-specification",
      "status": "failed",
      "progress": 0,
      "error": "Invalid PDF file",
      "startedAt": 1729353500000,
      "completedAt": 1729353510000,
      "createdAt": 1729353490000
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0
  }
}
```

**Error Responses:**

**500 Internal Server Error:**
```json
{
  "error": "Failed to retrieve jobs",
  "message": "Detailed error message"
}
```

**Notes:**
- Only returns jobs for documents uploaded by the current user
- Jobs are ordered by creation date (newest first)
- Use status filter to find failed jobs for retry
- Includes document title and type for context

---

## General

### Health Check

Check the overall health of the API service.

**Endpoint:** `GET /health`

**Request Example:**

```bash
curl -X GET http://localhost:3001/health
```

**Success Response (200 OK):**

```json
{
  "status": "ok",
  "timestamp": 1729353600000,
  "uptime": 86400.5
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "status": "error",
  "error": "Database connection failed"
}
```

**Notes:**
- Use for service monitoring and availability checks
- `uptime` is in seconds
- Future versions will include database and Meilisearch health checks

---

## Rate Limiting

All `/api/*` endpoints are rate-limited to prevent abuse.

**Default Limits:**
- **Window:** 15 minutes (900,000 ms)
- **Max Requests:** 100 requests per window per IP

**Rate Limit Headers:**

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1729354500
```

**Rate Limit Exceeded (429 Too Many Requests):**

```json
{
  "message": "Too many requests, please try again later"
}
```

**Configuration:**

Rate limits can be configured via environment variables:
- `RATE_LIMIT_WINDOW_MS` - Time window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window

---

## Error Handling

All error responses follow a consistent format:

```json
{
  "error": "Brief error description",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input or missing required fields |
| 403 | Forbidden | Valid request but user lacks permissions |
| 404 | Not Found | Resource does not exist |
| 413 | Payload Too Large | File size exceeds limit |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error occurred |
| 503 | Service Unavailable | Dependent service (Meilisearch) unavailable |

**Development Mode:**

In development (`NODE_ENV=development`), error responses include stack traces:

```json
{
  "error": "Failed to process request",
  "message": "Detailed error message",
  "stack": "Error: Detailed error message\n    at Function.async (/path/to/file.js:123:45)"
}
```

---

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `MEILISEARCH_HOST` | Meilisearch server URL | `http://127.0.0.1:7700` |
| `MEILISEARCH_MASTER_KEY` | Meilisearch master API key | (none) |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `3001` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `MAX_FILE_SIZE` | Maximum upload size in bytes | `52428800` (50MB) |
| `UPLOAD_DIR` | Directory for uploaded files | `./uploads` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit time window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `*` (dev only) |
| `MEILISEARCH_INDEX_NAME` | Meilisearch index name | `navidocs-pages` |
| `MEILISEARCH_SEARCH_KEY` | Fallback search API key | (auto-detected) |

---

## Security Considerations

### Current Status (Development)

- Authentication is not yet implemented (using placeholder `test-user-id`)
- CORS is open in development mode (`origin: '*'`)
- File validation is active (PDF format, malicious content detection)
- Rate limiting is enabled
- Input sanitization is active (filenames, UUIDs)

### Production Recommendations

1. **Enable JWT Authentication**
   - Add authentication middleware to all routes
   - Verify user identity and permissions
   - Use secure token storage (httpOnly cookies)

2. **Restrict CORS**
   - Set `ALLOWED_ORIGINS` to specific domains
   - Enable credentials: `credentials: true`

3. **Secure File Access**
   - Remove `filePath` from API responses
   - Use signed URLs for PDF access
   - Implement time-limited download tokens

4. **Database Security**
   - Use parameterized queries (already implemented)
   - Regular backups
   - Encrypt sensitive fields

5. **API Security**
   - Enable HTTPS/TLS
   - Implement request signing
   - Add audit logging
   - Monitor for suspicious activity

6. **File Security**
   - Virus scanning for uploads
   - Strict MIME type validation
   - Secure file storage (encrypted at rest)
   - Regular cleanup of orphaned files

---

## Support & Resources

**Documentation:**
- [Architecture Overview](/home/setup/navidocs/docs/architecture/)
- [Development Guide](/home/setup/navidocs/docs/development/)
- [Deployment Guide](/home/setup/navidocs/docs/DEPLOYMENT_STACKCP.md)

**Source Code:**
- Backend: `/home/setup/navidocs/server/`
- Routes: `/home/setup/navidocs/server/routes/`

**Related Services:**
- [Meilisearch Documentation](https://docs.meilisearch.com)
- [Tesseract OCR Documentation](https://tesseract-ocr.github.io)

---

**API Version:** 1.0
**Last Updated:** October 19, 2024
**Status:** Development (Pre-release)
