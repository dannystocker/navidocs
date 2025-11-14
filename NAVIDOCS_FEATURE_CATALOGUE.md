# NaviDocs Feature Catalogue

Professional boat manual management platform with OCR, intelligent search, and a production-grade backend.

---

## 1. Product at a Glance

- **Who it's for**
  - Single boat owners (today)
  - Yacht / fleet managers (near-term roadmap)
  - Marinas, property managers, other waterfront verticals (longer-term roadmap)

- **Core value**
  - Turn messy PDFs and warranty docs into a **searchable, structured knowledge base**
  - Make it easy to **prove work**, recover **warranty value**, and **reduce operational friction**

---

## 2. Current Product Features (Single-Tenant v1.x)

### 2.1 Document Ingestion & Management

- **PDF Upload**
  - Drag-and-drop upload from browser
  - Validates file type (PDF-only) and size
  - Captures title and document type at upload

- **Metadata Capture**
  - Fields for:
    - Title
    - Document type (owner manual, component manual, technical spec, etc.)
    - Organization ID
    - Optional entity / sub-entity / component linkage

- **OCR Job Queueing**
  - Upload immediately queues **OCR processing** job
  - Job IDs returned so the UI can poll for progress
  - Job tracking API: status, progress %, error state

- **Document Storage & Indexing**
  - PDFs stored in a predictable filesystem layout
  - Pages extracted and stored with:
    - Page number
    - Text content
    - Confidence scores
  - Linked to search index (Meilisearch) for full-text search

---

### 2.2 OCR & Content Extraction

- **Smart OCR Processing**
  - Uses **Tesseract.js** for text extraction
  - Runs as a **background worker** (non-blocking for user)
  - Handles multi-page PDFs
  - Tracks progress per job (e.g. "page 10/120")

- **Error Handling & Retry**
  - OCR worker reports:
    - Success / failure
    - Error messages
  - Failed jobs can be retried after configuration fixes

- **Text + Layout Preservation**
  - Extracted text stored per page (for search + inline viewer)
  - Designed to support:
    - Highlighted search matches
    - Quick navigation between hits

---

### 2.3 Search & Discovery

- **Search Engine**
  - Backed by **Meilisearch**
  - Typo-tolerant queries
  - Searches across all documents simultaneously

- **Intelligent Search Experience**
  - Supports marine-specific terminology and synonyms
  - Designed for **<50ms** search latency
  - Search result cards show:
    - Document title
    - Snippet with highlighted match
    - Page number
    - Diagram / image badges

- **Scoped Search Tokens**
  - Backend endpoint generates **Meilisearch tenant tokens**
  - Tokens are:
    - Time-limited
    - Scoped to organization(s)
  - Frontend can perform **secure client-side search** with those tokens

- **Server-Side Search API**
  - REST endpoint for:
    - Full-text search queries
    - Pagination of results
    - Future filters (boat, document type, etc.)

---

### 2.4 Document Viewing & Navigation

- **PDF Viewer**
  - Built on **PDF.js**
  - Multi-page viewer with:
    - Page navigation
    - Zoom controls
    - Text selection

- **Page-Level Context**
  - Search results link directly to the relevant page
  - Designed to support:
    - "Open document at page X where the hit occurs"
    - Fast back-and-forth between results and pages

- **Streaming / Download**
  - API endpoints for:
    - Streaming PDF content
    - Downloading original PDF

---

### 2.5 Images, Diagrams & Visuals

- **Diagram Detection**
  - Background worker to extract images from PDFs
  - Stores images with:
    - Document ID
    - Page number
    - Basic metadata

- **Search + UI Integration**
  - Search results display **thumbnail previews** for diagram-heavy pages
  - "Diagram" badges visually distinguish technical drawings and schematics
  - Full-size image viewer for extracted diagrams

---

### 2.6 Security, Tenancy & API Surface

- **Tenant-Aware Data Model**
  - Database schema separates:
    - Organizations
    - Entities (boats / properties)
    - Sub-entities and components
  - Documents link to organization + entity for future multi-tenant support

- **File Safety & Validation**
  - Server-side file validation service:
    - Ensures PDF extension
    - (Design includes optional qpdf / ClamAV hooks for hardened production)

- **API Feature Set**
  - **Authentication (design/initial implementation)**
    - JWT-based login / registration (v1.0 scope)
    - Tenant tokens for search
  - **Document endpoints**
    - Upload PDF (`POST /api/upload`)
    - Get document metadata + pages (`GET /api/documents/:id`)
    - List documents (`GET /api/documents`)
    - Delete document (`DELETE /api/documents/:id`)
    - Stream PDF content
  - **Search endpoints**
    - Generate search token (`POST /api/search/token`)
    - Server-side search (`POST /api/search`)
    - Search health check
  - **Jobs endpoints**
    - Get job status (`GET /api/jobs/:id`)
    - List jobs (`GET /api/jobs`)
  - **General**
    - Health check endpoint for uptime monitoring

---

### 2.7 UX, UI & Offline Experience

- **Modern Web UI**
  - Vue 3 + Tailwind-based interface
  - Meilisearch-style layout and visual language
  - Dark theme with pink→purple gradients for a polished feel

- **Responsive Design**
  - Layout adapts to:
    - Desktop (full navigation + filters)
    - Tablet (pilothouse-friendly)
    - Mobile (time-on-dock usage)

- **PWA / Offline-First**
  - Service worker + caching strategy
  - Designed for:
    - Poor / intermittent marina Wi-Fi
    - Boat use cases where connection drops

- **Notifications & Feedback**
  - Toasts and status messages for:
    - Upload started / completed
    - OCR in progress / finished / failed
  - Clear state transitions in UI (loading, success, error)

- **Accessibility & Polish**
  - Improved focus states and keyboard navigation
  - Badges, gradient borders, and subtle grid backgrounds
  - Clean typography for large manual pages

---

## 3. Single-Tenant Roadmap Features (v1.x → v2.0)

These are designed and scoped in the single-tenant feature roadmap; some may already be partially implemented.

### 3.1 Document Management Enhancements

- Delete documents with confirmation flow
- Edit metadata (inline or modal)
- Bulk operations (multi-select, bulk delete)
- Document versioning (track changes)
- Download original PDF from viewer and search results

### 3.2 Advanced Search & Discovery

- Filters:
  - Filter by boat
  - Filter by document type
  - Filter by tag/category
- Sort options:
  - Relevance
  - Date
  - Title
- Search refinements:
  - "Search within current document" mode
  - Recent searches (per device)
  - Saved searches for frequent workflows
- Export:
  - Export search results as CSV
  - Export as PDF report

### 3.3 Dashboard & Analytics

- Overview dashboard:
  - Total documents, pages, storage
  - Recent uploads and activity
  - Most frequent search terms
- Document health:
  - OCR status overview
  - Missing or low-quality metadata
  - Indexing status (synced vs pending)
- Usage insights:
  - Searches over time
  - Documents added over time

### 3.4 Settings & Preferences

- Organization settings:
  - Organization name
  - Default boat name
  - Branding hooks (logo, accent color)
- User preferences:
  - Default view (grid/list)
  - Default sort order
  - Theme selection (light/dark/system)

### 3.5 Reliability, Performance & Polish

- Image lazy loading in viewers and search results
- PDF page caching for faster re-navigation
- Search result caching for repeated queries
- Image compression for diagrams
- Background job queue for OCR and image extraction
- Enhanced logging / observability across backend and workers

---

## 4. Multi-Tenant & Fleet Management Roadmap (v1.1+)

These features are designed for yacht management and larger fleets; they extend the core single-tenant product.

### 4.1 Multi-Tenant Auth & Roles (v1.1)

- Organization / tenant model:
  - Organizations manage multiple boats/entities
  - Users belong to one or more organizations
- Role-based access control:
  - Roles: admin, manager, member, viewer (extendable)
  - Permissions at:
    - Organization level
    - Boat/entity level
- Login & account lifecycle:
  - Registration, login, password reset flows
  - Account deactivation
- Tenant-scoped search & access:
  - All document and search endpoints constrained by tenant
  - Audit logs for permission changes

### 4.2 Time Tracking & Proof-of-Work (v1.1)

- Mobile time clock:
  - GPS-verified clock in/out
  - Workers log hours from their phone
  - Photo required before clock-out
  - Manager approval workflow

- Work logs:
  - Before/after photo pairs
  - Linked to specific boat + task
  - Timestamped and GPS-tagged

- Boat-specific checklists:
  - Custom checklists per boat
  - Photo requirement per checklist item
  - Prevents "we forgot to do X" scenarios

- Owner dashboard (trust & transparency):
  - Real-time stream of work logs
  - Photos, locations, timestamps
  - Clear link from invoices → actual work done

### 4.3 Equipment & Warranty Intelligence (v1.2)

- Equipment database:
  - Make, model, serial number per boat
  - Purchase date, warranty end date
  - Vendor contacts and past service history

- Warranty upload + OCR:
  - Upload receipts and warranty docs
  - Auto-extract warranty dates and key fields
  - Highlight soon-expiring warranties

- "Should we replace this?" helpers:
  - Quickly see whether gear is still under warranty
  - Show previous repairs and costs
  - Suggest "file warranty claim vs buy new"

### 4.4 Operational Efficiency (v1.3)

- Task assignment system:
  - Assign tasks to workers or captains
  - Include rich context (previous issues, part numbers, last service date)
  - Push notifications to mobile

- Context-rich task cards:
  - Link tasks to:
    - Equipment history
    - Service logs
    - Related documents

- Voice notes & waiting time tracking:
  - Workers can log voice notes on time entries
  - Explicit tracking of "waiting for access" vs "working"

### 4.5 Compliance & Audit Trail (v1.4)

- Tamper-resistant audit logs:
  - Append-only, time-stamped logs
  - Designed for legal defensibility and insurance audits

- Safety equipment tracking:
  - Track service dates for life rafts, EPIRBs, fire systems, etc.
  - Alert before compliance deadlines

- Compliance dashboards:
  - Status of safety equipment per boat
  - Exportable reports for insurers / authorities

---

## 5. Extended Verticals (Longer-Term)

Beyond boats and marinas, the same engine can serve:

- **Property management**
  - Shared equipment manuals (HVAC, pool, elevator)
  - Contractor coordination and proof-of-work
  - Shared document access for residents / HOAs

- **Yacht clubs / marinas**
  - Member resources
  - Dock / facility documentation
  - Safety and compliance tracking

- **Commercial fleets**
  - Charter operators
  - Workboats / service fleets
  - Centralized manual + warranty management at scale

---

## 6. How to Present This to Clients

- Start with **their pain** (lost manuals, disputes, wasted time).
- Map to **Core v1 features**:
  - "Upload once, searchable forever."
  - "Find any diagram or page in seconds."
  - "Works on the dock, even with bad signal."
- Then show **Near-term upgrades**:
  - Single-tenant roadmap (better management, dashboard, preferences).
- Finish with **Fleet & multi-tenant path**:
  - Time tracking + proof-of-work
  - Warranty savings
  - Compliance and audit comfort

This keeps the story grounded in today's product, while making it clear there's a credible path to the larger platform they care about.
