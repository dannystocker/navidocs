# NaviDocs Codebase Architecture Map

**Analysis Date:** 2025-11-13
**Agent:** S2-H01
**Status:** Complete

---

## 1. Database Schema Summary

### Core Entities

The NaviDocs database uses SQLite (v3) with a schema designed for future PostgreSQL migration. All timestamps use Unix epoch (seconds).

#### User Management
```
- users (id: TEXT PRIMARY KEY)
  - id: UUID
  - email: TEXT UNIQUE
  - password_hash: TEXT (bcrypt)
  - name: TEXT
  - status: TEXT (active, suspended, deleted)
  - email_verified: BOOLEAN
  - created_at, updated_at: INTEGER
  - last_login_at: INTEGER
  - failed_login_attempts, locked_until: Security fields
```

#### Organization Structure (Multi-tenant)
```
- organizations (id: TEXT PRIMARY KEY)
  - id: UUID
  - name: TEXT
  - type: TEXT (personal, commercial, hoa)
  - created_at, updated_at: INTEGER

- user_organizations (user_id + organization_id PRIMARY KEY)
  - role: TEXT (admin, manager, member, viewer)
  - joined_at: INTEGER
```

#### Entity Management (Boats, Marinas, Properties)
```
- entities (id: TEXT PRIMARY KEY)
  - id: UUID
  - organization_id: FK
  - user_id: FK (primary owner)
  - entity_type: TEXT (boat, marina, condo, yacht-club)
  - name: TEXT

  Boat-specific:
  - make, model, year: TEXT/INTEGER
  - hull_id: TEXT
  - vessel_type: TEXT (powerboat, sailboat, catamaran, trawler)
  - length_feet: INTEGER

  Property-specific:
  - property_type: TEXT
  - address: TEXT
  - gps_lat, gps_lon: REAL

  - metadata: TEXT (JSON)
  - created_at, updated_at: INTEGER
```

#### Hierarchical Component Structure
```
- sub_entities (id: TEXT PRIMARY KEY)
  - id: UUID
  - entity_id: FK
  - name: TEXT (system, dock, unit, facility)
  - type: TEXT
  - metadata: TEXT (JSON)

- components (id: TEXT PRIMARY KEY)
  - id: UUID
  - sub_entity_id: FK (optional)
  - entity_id: FK (direct link)
  - name, manufacturer, model_number, serial_number: TEXT
  - install_date, warranty_expires: INTEGER
  - metadata: TEXT (JSON)
```

#### Document Management
```
- documents (id: TEXT PRIMARY KEY)
  - id: UUID
  - organization_id: FK
  - entity_id, sub_entity_id, component_id: FK (hierarchical linking)
  - uploaded_by: FK (user)
  - title, document_type: TEXT
  - file_path, file_name, file_size: TEXT/INTEGER
  - file_hash: TEXT (SHA256 for deduplication)
  - mime_type: TEXT (default: application/pdf)
  - page_count: INTEGER
  - language: TEXT (default: en)
  - status: TEXT (processing, indexed, failed, archived, deleted)
  - replaced_by: TEXT (document supersession)
  - is_shared: BOOLEAN
  - shared_component_id: TEXT (for shared manual library)
  - metadata: TEXT (JSON)
  - created_at, updated_at: INTEGER

- document_pages (id: TEXT PRIMARY KEY)
  - id: UUID (page_<doc_id>_<page_num>)
  - document_id: FK
  - page_number: INTEGER
  - ocr_text: TEXT
  - ocr_confidence: REAL (0-1)
  - ocr_language: TEXT (default: en)
  - ocr_completed_at: INTEGER
  - search_indexed_at: INTEGER
  - meilisearch_id: TEXT
  - section: TEXT (TOC section name)
  - section_key: TEXT (normalized key)
  - section_order: INTEGER
  - metadata: TEXT (JSON - bounding boxes, etc)

- document_images (extracted from PDFs)
  - id: UUID
  - documentId: FK
  - pageNumber: INTEGER
  - imageIndex: INTEGER
  - imagePath: TEXT
  - imageFormat: TEXT (png, jpeg)
  - width, height: INTEGER
  - position: TEXT (JSON)
  - extractedText: TEXT
  - textConfidence: REAL
  - anchorTextBefore, anchorTextAfter: TEXT
```

#### Background Jobs
```
- ocr_jobs (id: TEXT PRIMARY KEY)
  - id: UUID
  - document_id: FK
  - status: TEXT (pending, processing, completed, failed)
  - progress: INTEGER (0-100%)
  - error: TEXT
  - started_at, completed_at: INTEGER
  - created_at: INTEGER
```

#### Permissions & Sharing
```
- permissions (granular access control)
  - id: UUID
  - resource_type: TEXT (document, entity, organization)
  - resource_id: FK
  - user_id: FK
  - permission: TEXT (read, write, share, delete, admin)
  - granted_by, granted_at: FK + INTEGER
  - expires_at: INTEGER (optional)

- entity_permissions (entity-level access)
  - id: UUID
  - user_id, entity_id: FK
  - permission_level: TEXT (viewer, editor, manager, admin)
  - granted_by, granted_at: FK + INTEGER
  - expires_at: INTEGER

- document_shares (simplified document sharing)
  - id: UUID
  - document_id, shared_by, shared_with: FK
  - permission: TEXT (read, write)
  - created_at: INTEGER

- refresh_tokens (JWT session management)
  - id: UUID
  - user_id: FK
  - token_hash: TEXT (SHA256)
  - device_info, ip_address: TEXT
  - expires_at: INTEGER
  - revoked: BOOLEAN
  - created_at, revoked_at: INTEGER

- password_reset_tokens
  - id: UUID
  - user_id: FK
  - token_hash: TEXT (SHA256)
  - expires_at: INTEGER
  - used: BOOLEAN
  - ip_address: TEXT
  - used_at: INTEGER
```

#### User Preferences
```
- bookmarks (quick access)
  - id: UUID
  - user_id, document_id: FK
  - page_id: FK (optional - specific page)
  - label: TEXT
  - quick_access: BOOLEAN (pin to homepage)
  - created_at: INTEGER
```

#### Audit Trail (Optional)
```
- audit_events (not shown in schema but referenced in code)
  - Logs all significant operations for compliance
  - user_id, event_type, resource_type, resource_id
  - status, ip_address, user_agent, metadata
```

#### Settings/Configuration
```
- settings (key-value store)
  - key: TEXT PRIMARY KEY
  - value: TEXT (JSON)
  - description: TEXT
  - category: TEXT
```

### Key Indexes
- `idx_entities_org`, `idx_entities_user`, `idx_entities_type`
- `idx_documents_org`, `idx_documents_entity`, `idx_documents_status`, `idx_documents_hash`, `idx_documents_shared`
- `idx_pages_document`, `idx_pages_indexed`
- `idx_jobs_status`, `idx_jobs_document`
- `idx_permissions_user`, `idx_permissions_resource`
- `idx_bookmarks_user`

---

## 2. API Endpoints (Grouped by Feature)

### Authentication Endpoints (`/api/auth`)
**File:** `server/routes/auth.routes.js`

```
POST /api/auth/register
  - Input: email, password, name
  - Output: userId, email, verificationToken
  - Logging: audit.service logs user.register

POST /api/auth/login
  - Input: email, password, deviceInfo, ipAddress
  - Output: accessToken (JWT), refreshToken, user object
  - Auth: None (initial login)
  - Side Effects: Updates failed_login_attempts, triggers account lock after 5 failures

POST /api/auth/refresh
  - Input: refreshToken
  - Output: new accessToken, user object
  - Auth: None (token-based)

POST /api/auth/logout
  - Input: refreshToken
  - Output: success message
  - Side Effects: Revokes refresh token

POST /api/auth/logout-all
  - Input: None (uses JWT)
  - Output: success message
  - Side Effects: Revokes all user tokens
  - Auth: JWT required

POST /api/auth/password/reset-request
  - Input: email
  - Output: generic success (doesn't reveal email exists)
  - Side Effects: Creates password_reset_tokens entry

POST /api/auth/password/reset
  - Input: token, newPassword
  - Output: success message
  - Side Effects: Updates password, revokes all refresh tokens

POST /api/auth/email/verify
  - Input: token
  - Output: email, success message
  - Side Effects: Sets email_verified = 1

GET /api/auth/me
  - Input: None (JWT)
  - Output: user object (id, email, name, status, emailVerified, createdAt, lastLoginAt)
  - Auth: JWT required
```

### Organization Management (`/api/organizations`)
**File:** `server/routes/organization.routes.js`

```
POST /api/organizations
  - Input: name, type (optional), metadata (optional)
  - Output: organization object
  - Auth: JWT required

GET /api/organizations
  - Input: None
  - Output: Array of user's organizations with role
  - Auth: JWT required

GET /api/organizations/:organizationId
  - Input: organizationId in params
  - Output: organization details with userRole
  - Auth: JWT + requireOrganizationMember

PUT /api/organizations/:organizationId
  - Input: name, type, metadata
  - Output: updated organization
  - Auth: JWT + requireOrganizationRole('manager')

DELETE /api/organizations/:organizationId
  - Input: organizationId
  - Output: success message with deleted count
  - Auth: JWT + requireOrganizationRole('admin')

GET /api/organizations/:organizationId/members
  - Input: organizationId
  - Output: Array of members with roles
  - Auth: JWT + requireOrganizationMember

POST /api/organizations/:organizationId/members
  - Input: userId, role (optional)
  - Output: success message
  - Auth: JWT + requireOrganizationRole('manager')
  - Side Effects: Adds or updates user role

DELETE /api/organizations/:organizationId/members/:userId
  - Input: organizationId, userId
  - Output: success message with removed role
  - Auth: JWT + requireOrganizationRole('manager')

GET /api/organizations/:organizationId/stats
  - Input: organizationId
  - Output: organization statistics (document count, member count, etc)
  - Auth: JWT + requireOrganizationMember
```

### Permission Management (`/api/permissions`)
**File:** `server/routes/permission.routes.js` (referenced but not fully reviewed)

```
Expected endpoints:
- POST /api/permissions/grant (grant permission to user)
- DELETE /api/permissions/revoke (revoke permission)
- GET /api/permissions/check (check permission)
```

### Document Management (`/api/documents`)
**File:** `server/routes/documents.js`

```
POST /api/upload
  - Input: file (PDF), title, documentType, organizationId, entityId (optional), componentId (optional), subEntityId (optional)
  - Output: jobId, documentId, message
  - Auth: None (TODO: should be JWT)
  - Side Effects:
    * Validates file safety (file-safety.service)
    * Generates SHA256 hash for deduplication
    * Creates documents and ocr_jobs records
    * Adds OCR job to BullMQ queue

GET /api/documents
  - Input: organizationId, entityId, documentType, status, limit, offset (query params)
  - Output: { documents: [], pagination: { total, limit, offset, hasMore } }
  - Auth: None (TODO: should verify organization membership)

GET /api/documents/:id
  - Input: documentId in params
  - Output: Full document metadata + pages array + entity + component info
  - Auth: Checks organization membership, document ownership, or share access
  - Side Effects: Parses metadata JSON

GET /api/documents/:id/pdf
  - Input: documentId
  - Output: PDF file stream (inline)
  - Auth: Same as GET /api/documents/:id
  - Security: Path traversal protection

DELETE /api/documents/:id
  - Input: documentId
  - Output: success message with document title
  - Auth: None (TODO: should verify ownership)
  - Side Effects:
    * Deletes from Meilisearch index
    * Deletes from database (CASCADE deletes document_pages, ocr_jobs)
    * Deletes file from filesystem
```

### Upload Routes (`/api/upload`)
**File:** `server/routes/upload.js`

```
POST /api/upload (same as above but dedicated file)
  - Multer configuration: 50MB limit, memory storage
  - Creates document in processing state
  - Queues OCR job via queue.service
```

### Quick OCR Route (`/api/upload/quick-ocr`)
**File:** `server/routes/quick-ocr.js` (referenced but not fully reviewed)

```
Expected endpoint:
- POST /api/upload/quick-ocr (rapid OCR without document creation)
```

### Job Management (`/api/jobs`)
**File:** `server/routes/jobs.js`

```
GET /api/jobs/:id
  - Input: jobId
  - Output: { jobId, documentId, status, progress, error, startedAt, completedAt, createdAt, document? }
  - Auth: None (TODO)
  - Status values: pending, processing, completed, failed
  - Document info included only if status === completed

GET /api/jobs
  - Input: status (optional), limit (default 50), offset (default 0)
  - Output: { jobs: [], pagination: { limit, offset } }
  - Auth: Filters to current user's jobs
  - Status filtering: Only allows pending|processing|completed|failed
```

### Search (`/api/search`)
**File:** `server/routes/search.js`

```
POST /api/search/token
  - Input: expiresIn (seconds, default 3600, max 86400)
  - Output: { token, expiresAt, indexName, searchUrl, mode }
  - Auth: JWT (gets user's organizations)
  - Modes: 'tenant' (preferred) or 'search-key' (fallback)
  - Side Effects: Generates Meilisearch tenant token with organization filters

POST /api/search
  - Input: q (query string), filters? (documentType, entityId, language), limit, offset
  - Output: { hits, estimatedTotalHits, query, processingTimeMs, limit, offset }
  - Auth: JWT
  - Meilisearch filters: userId or organizationId membership
  - Additional filters: documentType, entityId, language

GET /api/search/health
  - Input: None
  - Output: { status, meilisearch: <health_response> }
  - Auth: None
```

### Image Management (`/api/images`)
**File:** `server/routes/images.js`

```
GET /api/documents/:id/images
  - Input: documentId
  - Output: { documentId, imageCount, images: [{ id, pageNumber, imageIndex, format, width, height, position, extractedText, confidence, imageUrl }] }
  - Auth: Verifies document access
  - Side Effects: Parses position JSON

GET /api/documents/:id/pages/:pageNum/images
  - Input: documentId, pageNumber
  - Output: { documentId, pageNumber, imageCount, images: [] }
  - Auth: Verifies document and page exist
  - Validation: pageNumber must be >= 1

GET /api/images/:imageId
  - Input: imageId (img_<uuid>_p<page>_<index>_<timestamp> or UUID)
  - Output: Image file stream (PNG or JPEG)
  - Auth: Verifies document access
  - Rate Limiting: 200 requests per minute (more permissive than API)
  - Security: Path traversal prevention (normalizes path, checks within /uploads)
```

### Table of Contents (`/api/documents/:documentId/toc`)
**File:** `server/routes/toc.js`

```
GET /api/documents/:documentId/toc
  - Input: documentId, format? (flat|tree, default flat)
  - Output: { entries: [], format, count }
  - Auth: None (TODO)
  - Caching: LRU cache (200 max, 30 min TTL)
  - Side Effects: Builds tree structure if format=tree

POST /api/documents/:documentId/toc/extract
  - Input: documentId
  - Output: { success, entriesCount, tocPages: [], message }
  - Auth: None (TODO)
  - Side Effects:
    * Calls extractTocFromDocument (section-extractor.service)
    * Invalidates LRU cache entries
```

### Statistics (`/api/stats`)
**File:** `server/routes/stats.js` (referenced but not fully reviewed)

```
Expected endpoints:
- GET /api/stats/organization/:organizationId
- GET /api/stats/documents
- GET /api/stats/search
```

### Settings (`/api/admin/settings`)
**File:** `server/routes/settings.routes.js` (referenced but not fully reviewed)

```
Expected endpoints:
- GET /api/admin/settings (get all settings)
- PUT /api/admin/settings/:key (update setting)
- GET /api/settings/public/app (public app settings - no auth)
```

### Health Check
```
GET /health
  - Output: { status, timestamp, uptime }
  - Auth: None
```

---

## 3. Service Layer Architecture

### Authentication Service
**File:** `server/services/auth.service.js`

**Key Functions:**
- `register(email, password, name)` - User registration with bcrypt hashing (12 rounds)
- `login(email, password, deviceInfo, ipAddress)` - JWT + refresh token generation
- `refreshAccessToken(refreshToken)` - Generate new JWT from refresh token
- `revokeRefreshToken(refreshToken)` - Revoke single token (logout)
- `revokeAllUserTokens(userId)` - Logout all devices
- `requestPasswordReset(email, ipAddress)` - Generate reset token
- `resetPassword(token, newPassword)` - Validate token and update password
- `verifyEmail(token)` - Mark email as verified
- `getUserById(userId)` - Fetch user details
- `verifyAccessToken(token)` - Validate JWT

**Token Management:**
- JWT Access Token: `expiresIn` from env (default 15m)
- Refresh Token: 7 days in seconds (604800)
- Both stored with bcrypt hashing (for refresh tokens)
- JWT Secret: `process.env.JWT_SECRET` (must change in production)

**Security Features:**
- Password minimum 8 characters
- Account lockout after 5 failed login attempts (15 min lock)
- Refresh token revocation on password reset
- Email verification token support

### Authorization Service
**File:** `server/services/authorization.service.js`

**Key Functions:**
- `grantEntityPermission(userId, entityId, permissionLevel, grantedBy, expiresAt)` - Grant entity access
- `revokeEntityPermission(userId, entityId, revokedBy)` - Revoke entity access
- `checkEntityPermission(userId, entityId, minimumPermission)` - Check if user has permission
- `getUserEntityPermissions(userId, options)` - Get all user's entity permissions
- `getEntityPermissions(entityId, options)` - Get all entity's permissions
- `addOrganizationMember(userId, organizationId, role, addedBy)` - Add to organization
- `removeOrganizationMember(userId, organizationId, removedBy)` - Remove from organization
- `checkOrganizationMembership(userId, organizationId, minimumRole)` - Check membership
- `getOrganizationMembers(organizationId)` - List org members
- `getUserOrganizations(userId)` - Get user's organizations
- `cleanupExpiredPermissions()` - Cleanup task

**Permission Hierarchy:**
```
Entity Permissions: viewer (0) < editor (1) < manager (2) < admin (3)
Organization Roles: viewer (0) < member (1) < manager (2) < admin (3)
```

**Audit Integration:**
- All permission grants/revokes logged via `logAuditEvent()`

### Organization Service
**File:** `server/services/organization.service.js` (referenced but not fully reviewed)

**Expected Functions:**
- `createOrganization(name, type, metadata, createdBy)`
- `updateOrganization(organizationId, name, type, metadata, updatedBy)`
- `deleteOrganization(organizationId, deletedBy)`
- `getOrganizationById(organizationId)`
- `getOrganizationStats(organizationId)`

### Search Service (Meilisearch Integration)
**File:** `server/services/search.js`

**Key Functions:**
- `indexDocumentPage(pageId, documentId, pageNumber, text, confidence)` - Index page in Meilisearch
- `generateTenantToken(userId, organizationIds, expiresIn)` - Generate tenant-scoped token

**Meilisearch Index:**
- Index name: `navidocs-pages` (env configurable)
- Searchable attributes: ocr text, metadata
- Filtering: organizationId, userId, documentType, entityId, language
- Document structure:
  ```
  {
    id: string (unique page ID),
    docId: string (document UUID),
    pageNumber: integer,
    organizationId: string,
    userId: string,
    documentType: string,
    text: string (OCR content),
    language: string,
    ocrConfidence: number,
    createdAt: integer,
    updatedAt: integer
  }
  ```

**Tenant Token Support:**
- Scoped search to user's organizations
- Expiration support (max 24 hours)
- Fallback to search API key if tenant token fails

### Queue Service (BullMQ)
**File:** `server/services/queue.js`

**Key Functions:**
- `getOcrQueue()` - Get singleton queue instance
- `addOcrJob(documentId, jobId, data)` - Add OCR job to queue
- `getJobStatus(jobId)` - Get BullMQ job status
- `closeQueue()` - Graceful shutdown

**Queue Configuration:**
- Redis connection: `REDIS_HOST` (default 127.0.0.1), `REDIS_PORT` (default 6379)
- Queue name: `ocr-processing`
- Job retry: 3 attempts with exponential backoff (2s base)
- Cleanup: Complete jobs kept 24h, failed jobs kept 7 days
- Job options: priority support

**Job Data Structure:**
```
{
  documentId: string,
  jobId: string,
  filePath: string,
  fileName: string,
  organizationId: string,
  userId: string,
  priority: number (optional)
}
```

### OCR Service
**File:** `server/services/ocr.js` (referenced)

**Expected Functions:**
- `extractTextFromImage(imagePath, language)` - Tesseract.js OCR on images
- `cleanOCRText(text)` - Clean and normalize OCR output

### OCR Hybrid Service
**File:** `server/services/ocr-hybrid.js` (referenced)

**Expected Functions:**
- `extractTextFromPDF(filePath, options)` - Extract text from PDF with progress callback
- Returns: `[{ pageNumber, text, confidence, error }]`

### OCR Google Vision Service
**File:** `server/services/ocr-google-vision.js` (referenced)

**Expected Functions:**
- Alternative OCR provider (Google Cloud Vision)

### OCR Client Service
**File:** `server/services/ocr-client.js` (referenced)

**Expected Functions:**
- Client-side OCR coordination

### Section Extractor Service
**File:** `server/services/section-extractor.js` (referenced)

**Expected Functions:**
- `extractSections(filePath, ocrResults)` - Extract document sections/headings
- `mapPagesToSections(sections, totalPages)` - Map pages to TOC sections

### TOC Extractor Service
**File:** `server/services/toc-extractor.js` (referenced)

**Expected Functions:**
- `getDocumentToc(documentId)` - Fetch TOC from database
- `buildTocTree(entries)` - Build hierarchical tree from flat list
- `extractTocFromDocument(documentId)` - Extract TOC from PDF

### Audit Service
**File:** `server/services/audit.service.js` (referenced)

**Expected Functions:**
- `logAuditEvent(userId, eventType, status, ipAddress, userAgent, metadata, resourceType, resourceId)`
- Logs all security-relevant actions

### Settings Service
**File:** `server/services/settings.service.js` (referenced)

**Expected Functions:**
- `getSetting(key)` - Get setting by key
- `setSetting(key, value)` - Set/update setting
- `getAllSettings()` - Get all settings

### File Safety Service
**File:** `server/services/file-safety.js`

**Expected Functions:**
- `validateFile(file)` - Validate file type, size, etc.
- `sanitizeFilename(filename)` - Remove dangerous characters

---

## 4. Background Job Patterns (BullMQ Usage)

### OCR Worker
**File:** `server/workers/ocr-worker.js`

**Job Processing Pipeline:**

1. **Job Initialization**
   - Receives `{ documentId, jobId, filePath, fileName, organizationId, userId, priority }`
   - Updates ocr_jobs: status = 'processing', progress = 0, started_at = now

2. **PDF Text Extraction** (60-70% of job)
   - Calls `extractTextFromPDF()` with progress callback
   - Returns: `[{ pageNumber, text, confidence, error }]`
   - Concurrency: 2 documents at a time (env: OCR_CONCURRENCY)
   - Limiter: 5 jobs per minute (prevents Tesseract overload)

3. **Page Processing** (per page)
   - Clean OCR text via `cleanOCRText()`
   - Insert/update document_pages
   - Index in Meilisearch via `indexDocumentPage()`
   - Store confidence scores and language

4. **Image Extraction** (per page)
   - Extract images via `extractImagesFromPage()`
   - Run Tesseract on each image
   - Store in document_images table
   - Index image text in Meilisearch with `documentType: 'image'`

5. **Section/TOC Extraction** (post-processing)
   - Call `extractSections()` and `mapPagesToSections()`
   - Update document_pages with section metadata (section, section_key, section_order)
   - Call `extractTocFromDocument()` for TOC entries

6. **Completion**
   - Update documents: status = 'indexed', imagesExtracted = 1
   - Update ocr_jobs: status = 'completed', progress = 100, completed_at = now
   - Return: `{ success: true, documentId, pagesProcessed }`

7. **Error Handling**
   - On failure: status = 'failed', error = error.message
   - Continues processing other pages on individual page failures
   - Re-throws to mark BullMQ job as failed
   - Retries up to 3 times with exponential backoff

**Event Handlers:**
```
worker.on('completed', (job, result) => { /* log */ })
worker.on('failed', (job, error) => { /* log error */ })
worker.on('error', (error) => { /* worker crash */ })
worker.on('ready', () => { /* worker ready */ })
```

**Graceful Shutdown:**
- `SIGTERM` / `SIGINT` handlers
- Calls `worker.close()` and `connection.quit()`

### Image Extractor Worker
**File:** `server/workers/image-extractor.js`

**Expected Functionality:**
- `extractImagesFromPage(filePath, pageNumber, documentId)` - Extract images from PDF page
- Returns: `[{ id, path, format, width, height, imageIndex, position }]`

---

## 5. Integration Points for New Features

### Inventory Management Feature

**Integration Points:**

1. **Database Schema:**
   - Extend `components` table with inventory fields:
     ```sql
     ALTER TABLE components ADD COLUMN (
       quantity_available INTEGER DEFAULT 0,
       reorder_level INTEGER,
       supplier_info TEXT,  -- JSON with supplier contacts
       last_purchased_date INTEGER,
       purchase_cost REAL,
       location_storage TEXT
     );
     ```
   - Create `inventory_transactions` table for audit trail

2. **API Endpoints:**
   - `POST /api/inventory/items` - Create inventory item (link to component)
   - `GET /api/inventory/items` - List inventory with filters
   - `PUT /api/inventory/items/:id` - Update quantity/location
   - `POST /api/inventory/items/:id/transactions` - Record transaction (purchase, use, transfer)
   - `GET /api/inventory/alerts` - Get low-stock alerts

3. **Service Layer:**
   - Create `server/services/inventory.service.js`:
     - `createInventoryItem(componentId, quantity, reorderLevel, supplier)`
     - `updateInventoryQuantity(itemId, change, reason, userId)`
     - `getInventoryAlerts(organizationId)`
     - `calculateReorderPoints()`

4. **Route File:**
   - Create `server/routes/inventory.routes.js`
   - Add to `server/index.js`: `app.use('/api/inventory', inventoryRoutes);`

5. **BullMQ Job (Optional):**
   - Create background job for inventory replenishment alerts
   - Queue in `server/workers/inventory-alerts.js`

### Maintenance Tracking Feature

**Integration Points:**

1. **Database Schema:**
   - Extend `components` table:
     ```sql
     ALTER TABLE components ADD COLUMN (
       maintenance_interval_days INTEGER,
       last_maintenance_date INTEGER,
       next_maintenance_date INTEGER
     );
     ```
   - Create `maintenance_logs` table:
     ```sql
     CREATE TABLE maintenance_logs (
       id TEXT PRIMARY KEY,
       component_id FK,
       entity_id FK,
       performed_by FK,
       maintenance_type TEXT (inspection, service, repair, replacement),
       description TEXT,
       cost REAL,
       duration_hours REAL,
       next_scheduled_date INTEGER,
       document_id FK (reference manual),
       created_at INTEGER
     );
     ```

2. **API Endpoints:**
   - `POST /api/maintenance/logs` - Log maintenance event
   - `GET /api/maintenance/logs` - List maintenance history
   - `GET /api/maintenance/schedule` - Get upcoming maintenance
   - `PUT /api/maintenance/logs/:id` - Update log
   - `DELETE /api/maintenance/logs/:id` - Remove log

3. **Service Layer:**
   - Create `server/services/maintenance.service.js`:
     - `logMaintenance(componentId, type, description, performedBy)`
     - `getMaintenanceHistory(componentId, limit)`
     - `getUpcomingMaintenance(organizationId)`
     - `calculateNextMaintenanceDate(componentId)`

4. **Route File:**
   - Create `server/routes/maintenance.routes.js`
   - Add to `server/index.js`: `app.use('/api/maintenance', maintenanceRoutes);`

5. **Background Job:**
   - Create `server/workers/maintenance-reminders.js`
   - BullMQ cron job to check and send alerts

6. **Search Integration:**
   - Index maintenance logs in Meilisearch for searchability

### Camera/Document Capture Feature

**Integration Points:**

1. **Database Schema:**
   - Extend `documents` table:
     ```sql
     ALTER TABLE documents ADD COLUMN (
       capture_method TEXT (upload, camera, screenshot, scan),
       camera_device_info TEXT,  -- JSON with device metadata
       capture_timestamp INTEGER
     );
     ```
   - Create `camera_sessions` table:
     ```sql
     CREATE TABLE camera_sessions (
       id TEXT PRIMARY KEY,
       user_id FK,
       organization_id FK,
       device_info TEXT,  -- JSON
       started_at INTEGER,
       ended_at INTEGER,
       capture_count INTEGER
     );
     ```

2. **API Endpoints:**
   - `POST /api/capture/camera-session` - Start camera session
   - `POST /api/capture/upload-frame` - Upload single camera frame
   - `GET /api/capture/sessions` - List capture sessions
   - `POST /api/capture/batch-process` - Process batch of frames as single document

3. **Service Layer:**
   - Create `server/services/capture.service.js`:
     - `createCameraSession(userId, organizationId, deviceInfo)`
     - `uploadCaptureFrame(sessionId, imageBuffer, frameNumber)`
     - `processCaptureSession(sessionId)` - Convert frames to PDF
     - `getSessionCaptures(sessionId)`

4. **Route File:**
   - Create `server/routes/capture.routes.js`
   - Add to `server/index.js`: `app.use('/api/capture', captureRoutes);`

5. **Background Job:**
   - Extend OCR worker to handle batch-captured images
   - Create `server/workers/batch-processor.js` for frame-to-PDF conversion

6. **Client Integration:**
   - Camera API integration in Vue 3 frontend
   - WebRTC support for real-time preview

### New Feature Route Registration Pattern

**Standard Integration Checklist:**

```javascript
// 1. Create service file: server/services/[feature].service.js
// 2. Create route file: server/routes/[feature].routes.js
// 3. Add to server/index.js:
import [feature]Routes from './routes/[feature].routes.js';
app.use('/api/[feature]', [feature]Routes);

// 4. If background job needed:
// - Create server/workers/[feature]-worker.js
// - Extend queue.service.js with get[Feature]Queue()

// 5. If search needed:
// - Index documents via Meilisearch client in service layer

// 6. Database schema changes:
// - Add migration file or update schema.sql comments
// - Test with db/init.js
```

---

## 6. Tech Stack Validation

### Backend Stack

| Technology | Version | Purpose | Status |
|-----------|---------|---------|--------|
| **Node.js** | 18+ | Runtime | Running |
| **Express.js** | ^5.0.0 | Web framework | Active |
| **SQLite (better-sqlite3)** | ^11.0.0 | Database | Active |
| **PostgreSQL** | - | Planned migration target | Not yet |
| **Redis (ioredis)** | ^5.0.0 | Queue backend | Required |
| **BullMQ** | ^5.0.0 | Job queue | Active |
| **JWT (jsonwebtoken)** | ^9.0.2 | Authentication | Active |
| **Bcryptjs** | ^3.0.2 | Password hashing | Active |
| **Meilisearch** | ^0.41.0 | Full-text search | Active |
| **Tesseract.js** | ^5.0.0 | OCR engine | Active |
| **PDF processing** | - | - | - |
| ├─ pdf-parse | ^1.1.1 | PDF parsing | Active |
| ├─ pdf-img-convert | ^2.0.0 | PDF to image | Active |
| ├─ pdfjs-dist | ^4.0.0 | PDF viewer lib | Client |
| **Image processing** | - | - | - |
| ├─ sharp | ^0.34.4 | Image optimization | Active |
| **Multer** | ^1.4.5-lts.1 | File upload | Active |
| **file-type** | ^19.0.0 | File validation | Active |
| **Helmet** | ^7.0.0 | Security headers | Active |
| **CORS** | ^2.8.5 | Cross-origin | Active |
| **Rate-limit** | ^7.0.0 | Request limiting | Active |
| **LRU-Cache** | ^11.2.2 | TOC caching | Active |
| **UUID** | ^10.0.0 | ID generation | Active |
| **dotenv** | ^16.0.0 | Config management | Active |

### Frontend Stack

| Technology | Version | Purpose | Status |
|-----------|---------|---------|--------|
| **Vue.js** | ^3.5.0 | UI framework | Active |
| **Vue Router** | ^4.4.0 | Client routing | Active |
| **Pinia** | ^2.2.0 | State management | Active |
| **Vue i18n** | ^9.14.5 | Internationalization | Active |
| **Vite** | ^5.0.0 | Build tool | Active |
| **Tailwind CSS** | ^3.4.0 | Styling | Active |
| **PostCSS** | ^8.4.0 | CSS processing | Active |
| **Meilisearch SDK** | ^0.41.0 | Client search | Active |
| **PDF.js** | ^4.0.0 | PDF viewer | Active |
| **Playwright** | ^1.40.0 | Testing | Dev |

### Infrastructure Requirements

| Service | Configuration | Purpose |
|---------|--------------|---------|
| **Database** | SQLite file (or PostgreSQL) | Primary data store |
| **Redis** | `REDIS_HOST` (default 127.0.0.1:6379) | BullMQ backend |
| **Meilisearch** | `MEILISEARCH_HOST` (default http://127.0.0.1:7700) | Search service |
| **File Storage** | `/uploads` directory | PDF and image storage |

### Environment Variables (Key)

```
# Server
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173

# Database
DATABASE_PATH=./navidocs.db

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_MASTER_KEY=<key>
MEILISEARCH_SEARCH_KEY=<key>
MEILISEARCH_INDEX_NAME=navidocs-pages

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB

# OCR
OCR_CONCURRENCY=2

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
IMAGE_RATE_LIMIT_MAX_REQUESTS=200
```

### Validation Summary

**Confirmed Technologies:**
- Vue 3: ✓ Installed (^3.5.0)
- Express.js: ✓ Installed (^5.0.0)
- SQLite: ✓ Installed via better-sqlite3 (^11.0.0)
- Redis: ✓ Installed via ioredis (^5.0.0)
- Meilisearch: ✓ Installed (^0.41.0)
- Tesseract: ✓ Installed via tesseract.js (^5.0.0)

**Status:** All core tech stack components present and correctly configured.

---

## 7. Architecture Diagram (Text-based)

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Vue 3)                        │
├─────────────────────────────────────────────────────────────────┤
│ • Vue Router (SPA navigation)                                    │
│ • Pinia (state management)                                       │
│ • Meilisearch Client SDK (full-text search UI)                  │
│ • PDF.js (document viewer)                                       │
│ • Tailwind CSS (styling)                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS.JS API LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│ Routes: /api/auth, /api/documents, /api/search, /api/upload,    │
│         /api/organizations, /api/jobs, /api/maintenance, etc     │
│                                                                   │
│ Middleware: Authentication (JWT), Authorization, Rate Limiting   │
│             Request Logging, Security Headers (Helmet)           │
│                                                                   │
│ Response: JSON (documents, images, search results)               │
└─────────────────────────────────────────────────────────────────┘
                    ↓              ↓              ↓
        ┌─────────────────────────────────────────────────┐
        │   SERVICE LAYER (Business Logic)                │
        ├─────────────────────────────────────────────────┤
        │ • auth.service.js - JWT, password hashing       │
        │ • authorization.service.js - Permission checks  │
        │ • search.js - Meilisearch indexing              │
        │ • queue.js - BullMQ job management              │
        │ • ocr-hybrid.js - PDF text extraction           │
        │ • inventory.service.js - (new feature)          │
        │ • maintenance.service.js - (new feature)        │
        │ • capture.service.js - (new feature)            │
        └─────────────────────────────────────────────────┘
                    ↓              ↓              ↓
        ┌────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐
        │   SQLite DB        │  │   Redis Queue        │  │  Meilisearch    │
        ├────────────────────┤  ├──────────────────────┤  ├─────────────────┤
        │ • users            │  │ ocr-processing queue │  │ Full-text index │
        │ • organizations    │  │ job data + status    │  │ Page documents  │
        │ • documents        │  │ (in-memory)          │  │ Image text      │
        │ • entities         │  │                      │  │                 │
        │ • components       │  │                      │  │                 │
        │ • permissions      │  │                      │  │                 │
        │ • maintenance_logs │  │                      │  │                 │
        │ • inventory_items  │  │                      │  │                 │
        └────────────────────┘  └──────────────────────┘  └─────────────────┘
                    ↓
        ┌──────────────────────┐
        │  Background Workers  │
        ├──────────────────────┤
        │ • ocr-worker.js      │
        │   - PDF → text       │
        │   - Tesseract.js OCR │
        │   - Index to MS      │
        │   - Extract images   │
        │   - Extract TOC      │
        │                      │
        │ • inventory-alerts   │
        │ • maintenance-reminders
        │ • batch-processor    │
        └──────────────────────┘
                    ↓
        ┌──────────────────────┐
        │  File System         │
        ├──────────────────────┤
        │ /uploads/            │
        │ • PDF documents      │
        │ • Extracted images   │
        │ • Temporary files    │
        └──────────────────────┘
```

---

## 8. Data Flow Examples

### Document Upload & OCR Processing Flow

```
1. User uploads PDF via POST /api/upload
   ├─ Multer stores file in memory
   ├─ File validation (size, type)
   ├─ SHA256 hash for deduplication
   ├─ File saved to disk (/uploads/:docId.pdf)
   ├─ Document record created (status: processing)
   ├─ ocr_job record created (status: pending)
   └─ Response: { jobId, documentId }

2. API queues OCR job via queue.service.addOcrJob()
   └─ BullMQ adds to Redis 'ocr-processing' queue

3. OCR Worker picks up job
   ├─ extractTextFromPDF() using pdf-parse + Tesseract.js
   ├─ Per page:
   │  ├─ cleanOCRText()
   │  ├─ Insert document_page record
   │  ├─ Index in Meilisearch
   │  ├─ extractImagesFromPage()
   │  │  ├─ Convert page to image
   │  │  ├─ Extract embedded images
   │  │  └─ Run OCR on each image
   │  └─ Store image metadata
   ├─ extractSections() for TOC
   ├─ Update document status: indexed
   └─ Update ocr_job: completed

4. User polls GET /api/jobs/:jobId
   ├─ Checks database ocr_jobs record
   └─ Response: { status, progress, documentId }

5. Document now searchable
   ├─ GET /api/search/token → Meilisearch auth
   ├─ POST /api/search → Full-text search results
   └─ GET /api/documents/:id → Page list with OCR
```

### Search & Document Retrieval Flow

```
1. User requests search token
   POST /api/search/token
   ├─ Verifies user's organizations
   ├─ Generates Meilisearch tenant token (org-scoped)
   └─ Response: { token, expiresAt, searchUrl }

2. Client calls Meilisearch directly with token
   ├─ Client library: meilisearch.index().search(q)
   └─ Results filtered by organization

3. User clicks document result
   GET /api/documents/:id
   ├─ Verify ownership/access
   ├─ Fetch document + pages + entity/component
   └─ Response: Full metadata + page list

4. User views PDF
   GET /api/documents/:id/pdf
   ├─ Verify access
   ├─ Stream file from /uploads/:id.pdf
   └─ Response: PDF stream

5. User views document images
   GET /api/documents/:id/images
   ├─ Query document_images table
   └─ Response: Image metadata + URLs

6. Client fetches image
   GET /api/images/:imageId
   ├─ Verify access
   ├─ Rate limit (200/min)
   ├─ Path traversal check
   └─ Stream: /uploads/:docId/image_*.png
```

### Permission & Sharing Flow

```
1. Document Owner Shares Document
   POST /api/documents/:id/share
   ├─ Create document_shares record
   ├─ Audit log: document.share event
   └─ Response: { success, sharedWith }

2. Recipient Accesses Document
   GET /api/documents/:id
   ├─ Check access via:
   │  ├─ user_organizations (org membership)
   │  ├─ documents.uploaded_by (owner)
   │  └─ document_shares (shared with)
   ├─ Grant read/write permission
   └─ Return document + pages

3. Manager Grants Entity Permission
   POST /api/permissions/grant
   ├─ Create entity_permissions record
   ├─ Set permission_level (viewer|editor|manager|admin)
   ├─ Optional expiration
   ├─ Audit log
   └─ Response: Permission ID

4. Check Permission
   checkEntityPermission(userId, entityId, minimumLevel)
   ├─ Query entity_permissions table
   ├─ Verify expiration
   ├─ Check permission hierarchy
   └─ Return: { hasPermission, level }
```

---

## 9. Security Implementation

### Authentication & Authorization

**JWT Strategy:**
- Access Token: 15 minutes (short-lived)
- Refresh Token: 7 days (stored in DB with hash)
- Tokens revoked on password reset
- Account lockout: 15 min after 5 failed attempts

**Password Security:**
- Bcrypt with 12 rounds
- Minimum 8 characters
- Hashing on register and reset

**Session Management:**
- Refresh tokens tracked in database
- Device info and IP logging
- Logout-all support

**Role-Based Access Control (RBAC):**
```
Organization Roles:
  • viewer: Read-only access
  • member: Can upload documents
  • manager: Can add members, update org
  • admin: Full org control + deletion

Entity Permissions:
  • viewer: Read-only
  • editor: Can modify/share
  • manager: All + member management
  • admin: Full control

Default Flow:
  User → Organization (role) → Entities (permissions)
```

### API Security

**Middleware Stack:**
1. **Helmet**: Security headers (CSP, X-Frame-Options, etc)
2. **CORS**: Whitelisted origins (production)
3. **Rate Limiting**: 100 req/15min per IP (configurable)
4. **Authentication**: JWT verification on protected routes
5. **Authorization**: Role/permission checks in handlers
6. **Input Validation**: UUID format, file type, size limits
7. **Path Traversal Prevention**: Normalized path checks for file serving

**File Upload Security:**
- Multer memory storage (prevents direct disk write)
- File type validation via file-type library
- Size limit: 50MB (configurable)
- SHA256 hash for deduplication
- Filename sanitization (remove dangerous chars)

### Data Protection

**In Transit:**
- HTTPS enforced (production)
- TLS/SSL certificates
- Secure cookies for JWT

**At Rest:**
- SQLite encryption (optional setup)
- Bcrypt password hashing
- No plaintext credentials in code

**Audit Trail:**
- All permission changes logged
- User actions tracked (audit_events)
- Login/logout recorded

---

## 10. Performance Considerations

### Database Optimization
- Indexes on common query columns (org, entity, status, hash)
- Prepared statements via better-sqlite3
- Connection pooling (single connection in current setup)

### Search Optimization
- Meilisearch for full-text indexing (not SQLite FTS)
- Async indexing in OCR worker
- Tenant tokens for client-side search
- 30-min LRU cache for TOC queries

### OCR Processing
- Concurrency: 2 documents (configurable via OCR_CONCURRENCY)
- Limiter: 5 jobs/minute (prevents Tesseract overload)
- Progress tracking (0-100%)
- Batch image processing

### Memory Management
- Streaming responses for large PDFs
- Image compression via sharp
- LRU cache cleanup (30 min TTL)
- Job cleanup: Complete (24h), Failed (7 days)

### Scalability Bottlenecks
- **Single SQLite connection**: Switch to PostgreSQL for concurrent writes
- **Local file storage**: Switch to S3/cloud storage
- **Tesseract CPU usage**: Distribute workers across machines
- **Meilisearch scale**: Deploy cluster for high traffic

---

## 11. Known Issues & TODOs

### Authentication
- [ ] Authentication middleware incomplete (req.user often hardcoded as 'test-user-id')
- [ ] Email verification not sent (template needed)
- [ ] Password reset email not sent (template needed)

### Authorization
- [ ] Some endpoints missing auth checks
- [ ] Entity-level permissions not fully integrated
- [ ] Document-level permissions incomplete

### Database
- [ ] Password reset tokens table missing from schema
- [ ] Refresh tokens table missing from schema
- [ ] Audit events table not defined
- [ ] Document images table not in schema.sql
- [ ] Document metadata handling inconsistent

### OCR Worker
- [ ] Image extraction may fail silently
- [ ] Section extraction error handling needs improvement
- [ ] TOC extraction timing makes it optional (should be robust)

### Frontend
- [ ] Client-side image upload/capture not implemented
- [ ] Multilingual search needs testing
- [ ] Rate limiting feedback incomplete

---

## 12. Integration Roadmap for New Features

### Phase 1: Inventory Management
**Dependencies:**
- Components schema (exists)
- Basic CRUD API patterns (exist)
- Database migrations (setup required)

**Estimated effort:** 3-4 days
**New files:** 3 (service, routes, worker)
**Database changes:** +2 tables

### Phase 2: Maintenance Tracking
**Dependencies:**
- Inventory feature (Phase 1)
- Meilisearch indexing (exists)
- Audit logging (partial)

**Estimated effort:** 2-3 days
**New files:** 3 (service, routes, worker)
**Database changes:** +1 table

### Phase 3: Camera/Capture Feature
**Dependencies:**
- Upload API (exists)
- PDF processing (exists)
- WebRTC/Camera API (client)

**Estimated effort:** 4-5 days
**New files:** 4 (service, routes, worker, batch-processor)
**Database changes:** +2 tables

### Phase 4: Enhanced Search & Analytics
**Dependencies:**
- Meilisearch integration (exists)
- Audit trail (Phase 2+)
- Statistics API (exists)

**Estimated effort:** 2-3 days
**New files:** 2 (service, routes)

---

## Conclusion

The NaviDocs codebase is well-structured with clear separation of concerns:
- **Database**: Comprehensive schema supporting multi-entity, multi-tenant architecture
- **API**: RESTful endpoints organized by feature with consistent patterns
- **Services**: Business logic isolated from routes with dependency injection
- **Workers**: Background OCR processing via BullMQ + Redis
- **Frontend**: Vue 3 SPA with Meilisearch client-side search

**Ready for integration of:**
- Inventory management
- Maintenance tracking
- Camera/document capture
- Enhanced analytics

All integration points identified and documented above.
