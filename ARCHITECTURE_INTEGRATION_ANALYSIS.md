# NaviDocs Architecture Analysis & Integration Points

**Analysis Date:** 2025-11-13  
**Project:** NaviDocs - Multi-vertical Document Management System  
**Scope:** Yacht Sales & Marine Asset Documentation

---

## EXECUTIVE SUMMARY

NaviDocs is a **production-ready document management platform** designed for multi-entity scenarios (boats, marinas, properties). The architecture supports:

- **Multi-tenancy** with organization/entity hierarchies
- **Background processing** for OCR and indexing
- **Search-first design** using Meilisearch
- **Offline-capable** PWA client (Vue 3)
- **Granular access control** with role-based permissions
- **Extensible metadata** for custom integrations

**Gap Analysis:** Currently NO external integrations (Home Assistant, MQTT, webhooks). Foundation exists for adding them.

---

## 1. DATABASE SCHEMA ANALYSIS

### Location
- `/home/setup/navidocs/server/db/schema.sql` (primary)
- Migrations: `/home/setup/navidocs/server/db/migrations/`

### Core Tables (13 total)

#### A. Tenant Structure
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User authentication | id (UUID), email, password_hash, created_at |
| `organizations` | Multi-entity container | id, name, type (personal/commercial/hoa), metadata (JSON) |
| `user_organizations` | Membership + roles | user_id, organization_id, role (admin/manager/member/viewer) |

#### B. Asset Hierarchy
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `entities` | Boats, marinas, condos | id, organization_id, entity_type, name, **boat-specific** (hull_id, vessel_type, length_feet, make, model, year) |
| `sub_entities` | Systems, docks, units | id, entity_id, name, type, metadata |
| `components` | Engines, panels, appliances | id, sub_entity_id/entity_id, name, manufacturer, model_number, serial_number, install_date, warranty_expires |

**YACHT SALES RELEVANCE:**
- Vessel specs: hull_id (HIN), vessel_type, length, make, model, year
- Component tracking: engines, electrical systems, HVAC by serial number
- Perfect for "as-built" documentation transfer at closing

#### C. Document Management
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `documents` | File metadata | id, organization_id, entity_id (boat link!), sub_entity_id, component_id, title, **document_type** (owner-manual, component-manual, service-record, etc), status (processing/indexed/failed), file_hash (SHA256 for dedup) |
| `document_pages` | OCR results per page | id, document_id, page_number, ocr_text, ocr_confidence, ocr_language, meilisearch_id, metadata |
| `ocr_jobs` | Background processing queue | id, document_id, status (pending/processing/completed/failed), progress (0-100), error, timestamps |

#### D. Access Control
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `permissions` | Granular resource access | resource_type (document/entity/organization), resource_id, user_id, permission (read/write/share/delete/admin), granted_at, expires_at |
| `document_shares` | Simplified sharing | document_id, shared_by, shared_with, permission (read/write) |

#### E. User Experience
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `bookmarks` | Quick access pins | user_id, document_id, page_id, label, quick_access (bool) |

### Schema Design Strengths for Yacht Sales

1. **Deduplication by Hash**: SHA256 file hash prevents duplicate owner manuals when same boat model has same manual
2. **Metadata Extensibility**: JSON fields on entities, components, documents for custom data (broker notes, sale status, etc)
3. **Temporal Tracking**: `created_at`, `updated_at`, `warranty_expires`, `install_date` for compliance/history
4. **Soft Deletes**: `status` field + `replaced_by` support version history without losing data

### Migration History
- `002_add_document_toc.sql` - Table of Contents support
- `008_add_organizations_metadata.sql` - Custom metadata column
- `009_permission_templates_and_invitations.sql` - Invite workflow

---

## 2. API ENDPOINTS & CAPABILITIES

### Location: `/home/setup/navidocs/server/routes/`

#### A. Authentication & Multi-Tenancy
**Route:** `/api/auth`
- `POST /register` - User signup with email verification
- `POST /login` - JWT + refresh token generation
- `POST /refresh` - Refresh access token
- `POST /logout` - Session revocation
- `GET /me` - Current user profile
- `POST /password/reset-request` - Email-based reset
- `POST /password/reset` - Reset with token
- `POST /email/verify` - Email verification

**Auth Service:** `/server/services/auth.service.js`
- bcrypt password hashing
- JWT token management (default: 7-day expiry)
- Audit logging on all auth events
- Device tracking (user-agent, IP, login timestamps)

#### B. Organization Management
**Route:** `/api/organizations`
- `POST /` - Create organization (with owner as member)
- `GET /` - List user's organizations
- `GET /:id` - Organization details (members, stats)
- `PUT /:id` - Update organization (name, metadata)
- `DELETE /:id` - Delete org (soft delete with audit trail)
- `GET /:id/members` - List organization members
- `POST /:id/members` - Invite user to org
- `DELETE /:id/members/:userId` - Remove user
- `GET /:id/stats` - Document count, storage usage

**Authorization Checks:**
- Organization admin role required for member management
- User membership verified before access
- Organization metadata supports custom fields

#### C. Document Management
**Route:** `/api/documents`
- `GET /:id` - Document metadata (with ownership check)
- `GET ?organizationId=X&limit=50` - List documents with pagination
- `DELETE /:id` - Soft delete with file cleanup

**Ownership Verification:**
```sql
-- Access granted if:
1. User is in document's organization, OR
2. User uploaded the document, OR
3. Document was shared with user
```

#### D. File Upload & OCR Pipeline
**Route:** `/api/upload`
- `POST /` - Upload PDF (multipart/form-data)
  - Parameters: file, title, documentType, organizationId, entityId (optional), componentId (optional)
  - Response: { jobId, documentId, message }
  - File validation: .pdf only, magic bytes check, max 50MB
  - File safety: sanitized filename, SHA256 hash, no null bytes

**Quick OCR Route:** `/api/upload/quick-ocr`
- Fast OCR for preview/validation

**Deduplication:** SHA256 hash checks prevent uploading same file twice

#### E. Background Jobs
**Route:** `/api/jobs`
- `GET /:id` - Job status and progress (0-100%)
- `GET ?status=completed&limit=50` - List jobs with filtering
- Response includes: documentId, status (pending/processing/completed/failed), progress, error message

**Queue System:** BullMQ with Redis backend
- 3 retry attempts with exponential backoff
- Job persistence for 24 hours (completed) / 7 days (failed)
- Progress updates via WebSocket-ready design

#### F. Search & Indexing
**Route:** `/api/search`
- `POST /token` - Generate Meilisearch tenant token (1-hour TTL, user-scoped)
- `POST /` - Server-side search (optional, for SSR)
  - Filters: documentType, entityId, language, custom fields
  - Response: hits, estimatedTotalHits, processingTimeMs
- `GET /health` - Meilisearch connectivity check

**Security:**
- Tenant tokens scoped to user + their organizations
- Row-level filtering injected at token generation
- Master key never exposed to client
- Fallback to search-only API key

#### G. Permissions Management
**Route:** `/api/permissions`
- Grant/revoke read/write/share/admin access
- Resource-level granularity (document, entity, organization)
- Time-bound permissions with expiration
- Audit trail of who granted what when

#### H. System Settings
**Route:** `/api/admin/settings` (admin-only)
- `GET /public/app` - Public app name (no auth)
- Settings management: OCR language, email config, feature flags
- Categories: app, email, ocr, security, integrations

#### I. Table of Contents
**Route:** `/api/documents/:id/toc`
- Extract and display document structure
- PDF heading hierarchy
- Section-based navigation

#### J. Images & Media
**Route:** `/api/images`
- Extract images from PDF pages
- Image search within documents
- Figure/diagram zoom capability

#### K. Statistics
**Route:** `/api/stats`
- Organization document count
- Storage usage
- OCR processing metrics
- User activity trends

---

## 3. FRONTEND ARCHITECTURE

### Location: `/home/setup/navidocs/client/src/`

#### A. Core Views
| View | Route | Purpose |
|------|-------|---------|
| **HomeView** | `/` | Dashboard, recent docs, quick access |
| **LibraryView** | `/library` | Document browser by entity/type |
| **SearchView** | `/search` | Full-text search with filters |
| **DocumentView** | `/document/:id` | PDF viewer with OCR results |
| **AuthView** | `/auth/login`, `/register` | Login/signup forms |
| **AccountView** | `/account` | User profile, organizations |
| **JobsView** | `/jobs` | Upload progress, OCR status |

#### B. Reusable Components
| Component | Purpose |
|-----------|---------|
| **UploadModal** | Drag-drop file upload interface |
| **TocSidebar** | Document TOC navigation |
| **TocEntry** | Individual TOC item renderer |
| **DocumentView** | PDF.js viewer with search overlay |
| **ImageOverlay** | Full-screen image viewer |
| **FigureZoom** | Figure/diagram magnifier |
| **ToastContainer** | Notification system |
| **ConfirmDialog** | Action confirmation UI |
| **CompactNav** | Mobile-friendly navigation |
| **LanguageSwitcher** | UI language selection |

#### C. Framework & Libraries
- **Vue 3** with Composition API
- **Vue Router** for SPA navigation
- **Tailwind CSS** for styling (Meilisearch-inspired design)
- **PDF.js** for document rendering
- **Meilisearch JS** for client-side search
- **IndexedDB** for offline storage (PWA)

#### D. PWA Capabilities
- Service worker for offline mode
- Offline-first architecture (works 20+ miles offshore per design docs)
- Cached critical manuals
- IndexedDB for local document metadata

---

## 4. BACKGROUND WORKERS & SERVICES

### Location: `/home/setup/navidocs/server/workers/` and `/server/services/`

#### A. OCR Worker
**File:** `ocr-worker.js`
**Function:** Background processing of document uploads
- BullMQ job processor (listens to Redis queue)
- PDF text extraction via Tesseract.js or Google Vision
- Page-by-page processing with progress updates (0-100%)
- Results saved to `document_pages` table
- Automatic indexing in Meilisearch upon completion
- Error handling: 3 retries, then marks job as failed

**Flow:**
```
1. User uploads PDF → Document stored, OCR job created
2. Worker picks up job from queue
3. Extract text per page (calls ocr-hybrid.js)
4. Save OCR results to document_pages
5. Index each page in Meilisearch (searchable_text)
6. Update document status: processing → indexed
```

#### B. Image Extractor
**File:** `image-extractor.js`
**Function:** Extract images from PDF pages
- Called during OCR processing
- Stores images separately for search/zoom
- Supports figure detection and metadata

#### C. OCR Service
**File:** `ocr.js`, `ocr-hybrid.js`
**Options:**
- Local: Tesseract.js (CPU-intensive, slow)
- Cloud: Google Vision API (fast, accurate, $$$)
- Hybrid: Local fallback if API fails
- Configuration via `OCR_LANGUAGE`, `OCR_CONFIDENCE_THRESHOLD`

#### D. File Safety Service
**File:** `file-safety.js`
**Validation:**
1. Extension check (.pdf only)
2. MIME type via magic bytes
3. File size limit (50MB)
4. Filename sanitization (no path traversal, null bytes, special chars)
5. Hash calculation for deduplication

#### E. Search Service
**File:** `search.js`
**Features:**
- Meilisearch index creation and configuration
- Tenant token generation with user scoping
- Row-level security filter injection
- Synonym mapping (boat terminology)
- Page-level indexing (each PDF page = searchable document)

**Meilisearch Index Schema:**
```json
{
  "indexName": "navidocs-pages",
  "primaryKey": "id",
  "searchableAttributes": ["title", "text", "systems", "categories", "tags"],
  "filterableAttributes": ["boatId", "userId", "make", "model", "year", "documentType"],
  "sortableAttributes": ["createdAt", "pageNumber"],
  "synonyms": {
    "bilge": ["sump pump", "bilge pump"],
    "engine": ["motor", "powerplant"],
    ...40+ boat terms...
  }
}
```

#### F. Section Extractor
**File:** `section-extractor.js`
**Purpose:** Extract document structure (chapters, headings, sections)

#### G. Authorization Service
**File:** `authorization.service.js`
**Provides:**
- User organization list
- Entity-level permission checks
- Role validation (admin/manager/member/viewer)
- Hierarchical permission resolution

#### H. Queue Service
**File:** `queue.js`
**Implementation:** BullMQ with Redis
```javascript
// Job options:
- 3 retry attempts
- Exponential backoff (2s, 4s, 8s)
- Completed jobs kept for 24 hours
- Failed jobs kept for 7 days
- Job priority support
```

#### I. Audit Service
**File:** `audit.service.js`
**Tracks:**
- User login/logout
- Document uploads
- Permission changes
- Organization modifications
- Failed access attempts
- Data exports

#### J. Organization Service
**File:** `organization.service.js`
**Features:**
- Organization CRUD
- Member invitation workflows
- Permission template application
- Org statistics (doc count, storage)

#### K. Settings Service
**File:** `settings.service.js`
**Manages:**
- System configuration (app name, email settings, OCR options)
- Feature flags
- Integration credentials (for webhooks, etc.)
- Environment-specific overrides

---

## 5. INTEGRATION POINTS IDENTIFIED

### Current State: NO External Integrations
The system is **architecturally ready** for integrations but none are implemented.

### A. Existing Hooks & Extension Points

#### 1. Metadata Fields (JSON)
```sql
-- Organizations
metadata TEXT  -- Custom org-level data (e.g., {"broker_id": "123", "region": "SE"})

-- Entities (boats)
metadata TEXT  -- E.g., {"hull_cert_date": "2020-01-15", "survey_status": "valid"}

-- Components
metadata TEXT  -- E.g., {"last_service": "2024-06", "service_interval_months": 12}

-- Documents
metadata TEXT  -- E.g., {"sale_list_price": "450000", "condition_notes": "excellent"}

-- Document Pages
metadata TEXT  -- Bounding boxes, OCR confidence per region
```
**Use for yacht sales:** Store listing price, condition report status, broker notes, survey dates.

#### 2. Settings Table
```
system_settings (key TEXT, value TEXT, category, encrypted)
```
**Extensible for:** API keys, webhook URLs, integrations config
**Currently used for:** OCR language, email settings, feature flags

#### 3. Status Enum Fields
```sql
documents.status -- 'processing' | 'indexed' | 'failed' | 'archived' | 'deleted'
ocr_jobs.status  -- 'pending' | 'processing' | 'completed' | 'failed'
```
**Extensible with:** 'sold', 'transferred', 'archived_due_to_sale', 'under_inspection'

#### 4. Background Job System
**Existing:** BullMQ queue for OCR
**Extensible for:** Webhook delivery, MQTT publishing, external API calls

### B. Potential Integration Points for Yacht Sales

#### 1. **Home Assistant Integration**
**Where:** `/api/webhooks/home-assistant` (needs creation)
**Purpose:**
- Publish boat documentation availability to yacht's systems
- Trigger documentation reminders based on automation rules
- Log documentation access to home automation timeline

**Database Changes Needed:**
```sql
-- New table
CREATE TABLE webhooks (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  type TEXT ('homeassistant', 'mqtt', 'webhook_generic'),
  endpoint_url TEXT,
  auth_token TEXT (encrypted),
  events TEXT (JSON array: ['document.uploaded', 'document.indexed', 'ocr.completed']),
  active BOOLEAN,
  created_at INTEGER
);

-- Add to metadata
-- documents.metadata: {"ha_entity_id": "sensor.boat_name_docs_updated"}
-- entities.metadata: {"ha_boat_id": "yacht_123", "automations": [...]}
```

**Webhook Events:**
```json
{
  "event": "document.indexed",
  "timestamp": 1699868400,
  "document": {
    "id": "...",
    "title": "Engine Manual",
    "documentType": "component-manual",
    "component": { "name": "Volvo Penta D6-400", "serialNumber": "..." }
  },
  "entity": {
    "id": "...",
    "name": "35ft Yacht",
    "hull_id": "..."
  }
}
```

#### 2. **MQTT Broker Integration**
**Where:** New worker `/server/workers/mqtt-publisher.js`
**Purpose:**
- Publish document metadata to boat's IoT network
- Subscribe to maintenance triggers
- Real-time documentation sync to onboard displays

**Topic Schema:**
```
navidocs/organizations/{org_id}/entities/{boat_id}/documents/{type}/{component}
navidocs/organizations/{org_id}/entities/{boat_id}/maintenance/triggers
```

#### 3. **Broker CRM Integration** (e.g., Zillow, MLS)
**Where:** `/api/integrations/broker-crm`
**Purpose:**
- Auto-tag documents by boat listing
- Sync sale status (pending, sold, withdrawn)
- Pull boat specs from MLS into system

**Database Additions:**
```sql
ALTER TABLE entities ADD COLUMN mls_id TEXT;
ALTER TABLE documents ADD COLUMN crm_external_id TEXT;
-- Use metadata for broker-specific fields
-- entities.metadata: {"mls_id": "...", "listing_agent": "...", "sale_price": "..."}
```

#### 4. **Document Storage Integration** (S3, Backblaze)
**Where:** File path resolution in `/routes/documents.js`
**Current:** Files stored in `./uploads` directory
**Extensible to:** Cloud storage with signed URLs

**Implementation Pattern:**
```javascript
// Current
const filePath = path.join(UPLOAD_DIR, document.file_path);
fs.readFileSync(filePath);

// Future (with integration):
if (document.storage_type === 's3') {
  return await s3.getObject(document.file_path).promise();
} else if (document.storage_type === 'local') {
  return fs.readFileSync(filePath);
}
```

#### 5. **Survey & Inspection APIs**
**Where:** `/api/integrations/survey-provider`
**Purpose:**
- Link boat surveys from HagsEye, DNV, etc.
- Sync inspection status to document metadata
- Auto-generate compliance documents

**Data Model:**
```sql
-- Survey linking
ALTER TABLE entities ADD COLUMN survey_provider_id TEXT;
-- Status tracking
-- documents.status: could add 'survey-required', 'survey-pending', 'survey-complete'
-- metadata: {"survey_date": "2024-06-15", "surveyor": "...", "next_survey": "2025-06-15"}
```

#### 6. **Email/Notification Integration**
**Existing:** Partial (email reset links)
**Extensible to:** 
- Document ready notifications (OCR complete)
- Access granted notifications
- Document expiration warnings (warranty dates, inspection due)

**Table Already Exists:**
```sql
-- system_settings can store email provider config
-- documents.metadata: {"notify_on_expiry": true, "expiry_date": "2025-01-01"}
```

#### 7. **Audit & Compliance Export**
**Where:** `/api/integrations/compliance-export`
**Purpose:** Export document chain-of-custody for yacht sale closing

**Existing Foundation:**
```sql
-- audit_logs table tracks all document access
-- permissions table tracks who granted what access
-- documents track uploaded_by + creation date
```

#### 8. **Sync to Cloud Directory**
**Where:** `/api/integrations/cloud-directory`
**Purpose:** Mirror documents to client's cloud account (Google Drive, OneDrive)

**Services:**
- Google Drive API (already referenced in code: `ocr-google-drive.js`)
- OneDrive API
- Dropbox API

**Implementation Path:**
```javascript
// New worker
/server/workers/cloud-sync-worker.js
// On document indexed:
// 1. Convert to Google Drive folder structure
// 2. Upload PDF + OCR text file
// 3. Store sync metadata in documents table
```

### C. Current Integration Status

**Implemented:**
- ✅ Google Vision API (optional OCR)
- ✅ Google Drive API (referenced in services)
- ✅ Redis (BullMQ job queue)
- ✅ Meilisearch (search engine)

**Partially Implemented:**
- ⚠️ JWT auth (core system, but no 3rd-party OAuth)
- ⚠️ Email (password reset, not general notifications)

**Not Implemented (Gaps for Yacht Sales):**
- ❌ Home Assistant webhook
- ❌ MQTT publisher
- ❌ Broker CRM sync
- ❌ Cloud storage (S3, Backblaze)
- ❌ Survey provider APIs
- ❌ OAuth (Google, Microsoft, Apple sign-in)
- ❌ Notification system (beyond email)
- ❌ Document expiration alerts

---

## 6. OFFLINE-FIRST PWA CAPABILITIES

### Existing Infrastructure
**Design Document:** Architecture summary mentions offline-first PWA
- Service worker caching of critical manuals
- Works 20+ miles offshore (per design spec)
- IndexedDB for local state

### Not Yet Fully Implemented
- Service worker registration code not found in client/src/
- Manifest.json not created yet
- Offline mode for boat emergencies needs completion

### Enhancement Opportunity for Yacht Sales
**Scenario:** Buyer viewing yacht specs on boat during sea trial
```
1. Download critical manuals before leaving shore
2. Access offline on iPad while viewing systems
3. Sync back to server when WiFi available
4. Signature capture for inspection sign-off
```

---

## 7. SECURITY ARCHITECTURE

### Implemented
- ✅ **JWT Auth** (7-day expiry, refresh tokens)
- ✅ **Tenant Scoping** (Meilisearch tenant tokens, 1-hour TTL)
- ✅ **File Validation** (extension, magic bytes, size)
- ✅ **Role-Based Access Control** (admin/manager/member/viewer)
- ✅ **Permission Granularity** (document/entity/organization level)
- ✅ **Helmet Security Headers** (CSP, HSTS, etc.)
- ✅ **Rate Limiting** (100 req/15min default)
- ✅ **Password Hashing** (bcrypt)
- ✅ **Audit Logging** (all auth events, document access)
- ✅ **Prepared Statements** (SQL injection prevention)

### Not Yet Fully Implemented
- ⚠️ Email verification workflow (scaffolding exists)
- ⚠️ 2FA/MFA
- ⚠️ IP whitelisting for organizations
- ⚠️ API keys for machine-to-machine auth

---

## 8. CURRENT CAPABILITIES VS. YACHT SALES USE CASE

### Strengths
1. **Multi-entity Management** ✅
   - Multiple boats per broker/agency
   - Components tracked (engines, systems)
   - Hierarchical organization

2. **Document Search** ✅
   - Full-text OCR + Meilisearch
   - Synonym mapping (boat terms)
   - Metadata filtering (vessel type, make, model)

3. **Access Control** ✅
   - Share docs with buyers
   - Broker/agent team collaboration
   - Granular permissions

4. **Offline Access** ✅ (Design complete, implementation partial)
   - Critical manuals cached
   - Offline PWA mode

5. **Compliance Tracking** ✅
   - Document creation date + uploader
   - Warranty date tracking (components)
   - Survey/inspection metadata via JSON

6. **Multi-tenancy** ✅
   - Brokers manage multiple boats
   - Team member roles
   - Organization-level statistics

### Gaps for Yacht Sales
1. **No Listing Integration** ❌
   - Not linked to MLS/YachtWorld data
   - Broker CRM sync not implemented

2. **No Sale Workflow** ❌
   - No "as-built" package generation
   - No closing checklist
   - No transfer-of-ownership flow

3. **No Signature Capture** ❌
   - Buyers can't sign off on receipt
   - No e-signature integration

4. **Limited Notifications** ❌
   - No alerts for expiring surveys/certificates
   - No "buyer accessed doc" notifications
   - No OCR completion alerts to user

5. **No Media Support (Video)** ❌
   - System built for documents
   - No walkthrough video links
   - No marina tour videos

6. **No Real-Time Collaboration** ❌
   - No commenting on specific pages
   - No annotation tools
   - No comment notifications

---

## 9. FILE STRUCTURE REFERENCE

```
/home/setup/navidocs/
├── server/
│   ├── db/
│   │   ├── schema.sql                    ← Database schema (13 tables)
│   │   ├── migrations/                   ← Schema evolution
│   │   └── db.js                         ← Connection singleton
│   │
│   ├── routes/                           ← API endpoints (12 route files)
│   │   ├── auth.routes.js                ← Login, register, password reset
│   │   ├── organization.routes.js        ← Multi-tenancy management
│   │   ├── permission.routes.js          ← Access control
│   │   ├── settings.routes.js            ← System configuration
│   │   ├── documents.js                  ← Document CRUD + ownership check
│   │   ├── upload.js                     ← File upload + OCR queue
│   │   ├── jobs.js                       ← OCR job status
│   │   ├── search.js                     ← Meilisearch tokens + search
│   │   ├── organization.routes.js        ← Org member management
│   │   ├── toc.js                        ← Table of contents
│   │   ├── images.js                     ← Image extraction from PDFs
│   │   ├── stats.js                      ← Usage statistics
│   │   └── quick-ocr.js                  ← Fast OCR endpoint
│   │
│   ├── services/
│   │   ├── auth.service.js               ← User registration, login, token refresh
│   │   ├── authorization.service.js      ← Permission checking
│   │   ├── organization.service.js       ← Org CRUD operations
│   │   ├── audit.service.js              ← Event logging
│   │   ├── settings.service.js           ← Config management
│   │   ├── queue.js                      ← BullMQ job queue
│   │   ├── search.js                     ← Meilisearch indexing
│   │   ├── file-safety.js                ← File validation
│   │   ├── ocr.js                        ← Tesseract OCR client
│   │   ├── ocr-google-vision.js          ← Google Vision API
│   │   ├── ocr-hybrid.js                 ← Fallback OCR strategy
│   │   ├── section-extractor.js          ← Document structure extraction
│   │   └── toc-extractor.js              ← TOC generation
│   │
│   ├── workers/
│   │   ├── ocr-worker.js                 ← Background OCR processor (Redis queue)
│   │   └── image-extractor.js            ← Image extraction from PDFs
│   │
│   ├── middleware/
│   │   └── auth.middleware.js            ← JWT validation + org checks
│   │
│   ├── config/
│   │   ├── db.js                         ← SQLite config
│   │   ├── meilisearch.js                ← Search engine config
│   │   └── redis.js                      ← Job queue config
│   │
│   ├── index.js                          ← Express server + route mounting
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── views/                        ← Page components
│   │   │   ├── HomeView.vue              ← Dashboard
│   │   │   ├── LibraryView.vue           ← Document browser
│   │   │   ├── SearchView.vue            ← Full-text search
│   │   │   ├── DocumentView.vue          ← PDF viewer
│   │   │   ├── AuthView.vue              ← Login/signup
│   │   │   ├── AccountView.vue           ← User profile
│   │   │   └── JobsView.vue              ← Upload progress
│   │   │
│   │   ├── components/                   ← Reusable UI components
│   │   │   ├── UploadModal.vue           ← Drag-drop upload
│   │   │   ├── DocumentView.vue          ← PDF.js viewer
│   │   │   ├── TocSidebar.vue            ← TOC navigation
│   │   │   ├── ImageOverlay.vue          ← Full-screen images
│   │   │   ├── ToastContainer.vue        ← Notifications
│   │   │   └── ... (8 more components)
│   │   │
│   │   ├── router.js                     ← Vue Router configuration
│   │   ├── App.vue                       ← Root component
│   │   └── main.js                       ← Entry point
│   │
│   └── package.json
│
└── docs/
    ├── ARCHITECTURE-SUMMARY.md           ← Design overview
    ├── DESIGN_AUTH_MULTITENANCY.md       ← Auth system spec
    ├── API_SUMMARY.md                    ← API documentation
    └── [39 other analysis/design docs]
```

---

## 10. RECOMMENDED INTEGRATION ROADMAP

### Phase 1: Quick Wins (Week 1-2)
1. **Settings UI for Webhook Configuration**
   - Store Home Assistant webhook URL in system_settings
   - Enable/disable per organization
   - Test webhook delivery

2. **Metadata Templates for Yacht Sales**
   - Add "vessel_specs" template (HIN, survey date, condition notes)
   - Add "sale_info" template (list price, broker ID, showings)
   - Add "buyer_info" template (name, contact, purchase contingencies)

3. **Status Enhancements**
   - Extend document.status to include 'sale-package', 'transferred'
   - Add document.expiry_date for survey/inspection tracking

### Phase 2: Core Integrations (Week 3-4)
1. **Home Assistant Webhook Handler**
   - `/api/webhooks/home-assistant` endpoint
   - Publish document indexed/uploaded events
   - Subscribe to boat status changes

2. **Notification System**
   - Email notifications when docs ready
   - Expiration warnings (surveys, warranties)
   - Access notifications to seller/broker

3. **Cloud Storage Option**
   - S3/Backblaze as alternative to local disk
   - Signed URL generation for downloads

### Phase 3: Automation (Week 5-6)
1. **As-Built Package Generator**
   - Collect all boat documents
   - Generate PDF with index
   - Auto-upload to Google Drive for buyer

2. **Broker CRM Sync** (if connecting to external CRM)
   - Sync boat data from MLS
   - Tag documents by listing
   - Update sale status in NaviDocs

3. **MQTT Integration**
   - Publish doc metadata to boat's IoT network
   - Real-time sync for onboard displays

---

## 11. DATABASE MIGRATION PLAN

To support integrations without breaking changes:

```sql
-- New table for external integrations
CREATE TABLE integrations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'webhook', 'mqtt', 'crm', 'cloud_storage'
  name TEXT,
  config TEXT NOT NULL,  -- JSON: {url, auth, events_enabled, etc}
  active BOOLEAN DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Track integration events
CREATE TABLE integration_events (
  id TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL,
  event_type TEXT,  -- 'document.uploaded', 'document.indexed', etc
  document_id TEXT,
  payload TEXT,  -- JSON: full event data
  status TEXT,  -- 'pending', 'delivered', 'failed'
  retry_count INTEGER DEFAULT 0,
  created_at INTEGER,
  FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
);

-- Extend documents for sale workflow
ALTER TABLE documents ADD COLUMN sale_package_id TEXT;  -- Links related docs
ALTER TABLE documents ADD COLUMN requires_signature BOOLEAN DEFAULT 0;
ALTER TABLE documents ADD COLUMN signature_metadata TEXT;  -- {signer, timestamp, ip}
```

---

## 12. SUMMARY: READY FOR INTEGRATION

### ✅ Foundation Complete
- Multi-tenancy architecture solid
- API design extensible
- Service layer pattern established
- Background job system in place
- Metadata fields support custom data

### ⚠️ Needs Implementation
- Integration management UI
- Webhook delivery system
- Home Assistant/MQTT publishers
- Notification queue
- E-signature support
- Sale workflow automation

### 🎯 Yacht Sales Specific
**The schema is PERFECT for boat documentation because:**
1. Entities = individual boats with full specs
2. Components = engines, systems, equipment (trackable by serial #)
3. Document types support all manuals, service records, surveys
4. Metadata allows custom broker fields (price, condition, showings)
5. Multi-tenancy supports broker teams + multiple boats
6. Offline PWA supports sea trial scenarios
7. Access control handles buyer access management

**Next Steps:**
1. Add Home Assistant integration (highest ROI for smart yacht ecosystem)
2. Build yacht sales-specific metadata templates
3. Create "as-built package" generator for closing
4. Add notification system for time-sensitive docs (surveys, warranties)
