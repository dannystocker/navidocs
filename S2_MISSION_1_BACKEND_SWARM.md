# S² Mission 1: Backend Development Swarm
**Session ID:** NAVIDOCS-S2-BACKEND
**Swarm Size:** 10 Haiku agents
**Coordinator:** S2-PLANNER (Sonnet)
**Estimated Duration:** 6-8 hours
**Integration:** InfraFabric S² API expansion (ongoing)

---

## 🎯 Mission Objective

Implement all backend APIs, database migrations, and business logic for NaviDocs owner dashboard features based on Session 2 intelligence dossier specifications.

**Success Criteria:**
- 50+ API endpoints implemented with OpenAPI 3.0 specs
- 29 database tables migrated (13 existing + 16 new)
- All features testable via API (no UI required this session)
- IF.TTT audit trails for all data mutations
- Multi-tenant isolation enforced across all tables

---

## 🔗 Integration with InfraFabric S²

**Current InfraFabric State:**
- S² expansion underway: API reach growing across hosting/cloud/SIP/billing
- MCP bridge tested with philosophy-embodied-in-code (92% compliance)
- Multi-agent swarm patterns validated (20+ agents in production)

**NaviDocs Integration Points:**
1. **Shared MCP Bridge:** Use same message bus for agent coordination
2. **IF.TTT Compliance:** Apply same audit trail patterns from bridge patches
3. **Agent Coordination:** Backend swarm reports to S2-PLANNER (Sonnet)
4. **Git Workflow:** Create feature branch `navidocs/s2-backend-apis`

---

## 👥 Agent Assignments

### Agent B-01: Database Migrations & Schema
**Identity:** S2-BACKEND-H01
**Task:** Create all 16 new database tables with migrations

**Deliverables:**
1. `server/db/migrations/` - Add migration files:
   - `001_owner_dashboard_tables.sql` - inventory, maintenance_logs, expenses
   - `002_camera_integration.sql` - camera_feeds, snapshot_history
   - `003_warranty_tracking.sql` - warranties, warranty_alerts
   - `004_vat_tax_tracking.sql` - eu_exit_log, customs_stamps
   - `005_whatsapp_integration.sql` - whatsapp_notifications, delivery_status

2. Schema Features:
   - organization_id foreign key on ALL tables (multi-tenant isolation)
   - created_at, updated_at timestamps
   - IF.TTT audit columns: created_by_user_id, modified_by_user_id
   - Indexes on frequently queried columns

3. Test migrations:
   - Run on clean database
   - Verify foreign key constraints
   - Test rollback scripts

**Dependencies:** None (start immediately)
**Context:** `intelligence/session-2/session-2-architecture.md` (DB schema section)

---

### Agent B-02: Inventory Tracking API
**Identity:** S2-BACKEND-H02
**Task:** Photo-based equipment catalog + depreciation calculator

**Deliverables:**
1. `server/routes/inventory.js` - RESTful endpoints:
   - `POST /api/inventory` - Add equipment with photo upload
   - `GET /api/inventory/:boat_id` - List all equipment for boat
   - `PUT /api/inventory/:id` - Update equipment details
   - `DELETE /api/inventory/:id` - Soft delete (mark as sold/removed)
   - `GET /api/inventory/:id/depreciation` - Calculate current value

2. Business Logic:
   - Photo upload to object storage (S3-compatible)
   - Depreciation calculation (straight-line method)
   - Track €15K-€50K inventory value recovery metric
   - OCR integration placeholder (will be implemented in Mission 2)

3. Validation:
   - Required: equipment_name, purchase_date, purchase_price
   - Optional: serial_number, warranty_end_date, notes

**Dependencies:** B-01 (migrations must run first)
**Context:** `intelligence/session-2/inventory-tracking-spec.md`

---

### Agent B-03: Maintenance Log & Calendar API
**Identity:** S2-BACKEND-H03
**Task:** Service history + multi-calendar system

**Deliverables:**
1. `server/routes/maintenance.js` - Service tracking:
   - `POST /api/maintenance` - Log service event
   - `GET /api/maintenance/:boat_id` - Service history
   - `PUT /api/maintenance/:id` - Update service record
   - `GET /api/maintenance/reminders` - Upcoming service due

2. `server/routes/calendar.js` - Multi-calendar system:
   - `GET /api/calendar/service/:boat_id` - Service calendar
   - `GET /api/calendar/warranty/:boat_id` - Warranty expiration dates
   - `GET /api/calendar/onboard/:boat_id` - Owner onboard calendar
   - `GET /api/calendar/work/:boat_id` - Maintenance roadmap
   - `GET /api/calendar/combined/:boat_id` - All calendars merged

3. Business Logic:
   - Service reminder calculation (based on hours/months)
   - Warranty expiration alerts (30/60/90 days before)
   - iCal export support
   - Timezone handling (UTC storage, local display)

**Dependencies:** B-01 (migrations)
**Context:** `intelligence/session-2/maintenance-log-spec.md`, `multi-calendar-spec.md`

---

### Agent B-04: Camera Integration API
**Identity:** S2-BACKEND-H04
**Task:** Home Assistant RTSP/ONVIF camera feeds

**Deliverables:**
1. `server/routes/cameras.js` - Camera management:
   - `POST /api/cameras` - Register camera (RTSP URL, credentials)
   - `GET /api/cameras/:boat_id` - List cameras for boat
   - `PUT /api/cameras/:id` - Update camera settings
   - `DELETE /api/cameras/:id` - Remove camera
   - `GET /api/cameras/:id/snapshot` - Take snapshot (proxy to camera)
   - `GET /api/cameras/:id/stream` - WebSocket proxy for RTSP stream

2. Integration:
   - Home Assistant webhook support (motion detection alerts)
   - RTSP stream proxying (avoid exposing camera credentials to frontend)
   - Snapshot storage (daily automatic snapshots)
   - Motion detection event log

3. Security:
   - Encrypt camera credentials (AES-256)
   - Rate limit snapshot requests (prevent abuse)
   - Validate RTSP URLs (prevent SSRF attacks)

**Dependencies:** B-01 (migrations)
**Context:** `intelligence/session-2/camera-integration-spec.md`

---

### Agent B-05: Contact Management API
**Identity:** S2-BACKEND-H05
**Task:** Marina, mechanics, vendors directory

**Deliverables:**
1. `server/routes/contacts.js` - Contact directory:
   - `POST /api/contacts` - Add contact (marina/mechanic/vendor)
   - `GET /api/contacts/:boat_id` - List contacts for boat
   - `PUT /api/contacts/:id` - Update contact
   - `DELETE /api/contacts/:id` - Soft delete
   - `GET /api/contacts/search?type=marina&location=Nice` - Search contacts
   - `POST /api/contacts/:id/call` - Log one-tap call event

2. Features:
   - Contact types: marina, mechanic, electronics, canvas, insurance, broker
   - Geolocation support (latitude/longitude)
   - Star rating system (owner can rate providers)
   - Last contact date tracking
   - Integration with WhatsApp (send message via API)

3. Business Logic:
   - Suggest nearby providers based on GPS location
   - Track provider response time
   - Calculate average rating per provider

**Dependencies:** B-01 (migrations)
**Context:** `intelligence/session-2/contact-management-spec.md`

---

### Agent B-06: Expense Tracking & Accounting API
**Identity:** S2-BACKEND-H06
**Task:** Multi-user expense splitting + annual spend tracking

**Deliverables:**
1. `server/routes/expenses.js` - Expense management:
   - `POST /api/expenses` - Create expense (with receipt OCR)
   - `GET /api/expenses/:boat_id` - List expenses
   - `PUT /api/expenses/:id` - Update expense
   - `DELETE /api/expenses/:id` - Soft delete
   - `GET /api/expenses/:boat_id/summary` - Monthly/annual spend summary
   - `GET /api/expenses/:boat_id/export?format=csv` - Export for tax

2. Multi-User Splitting (Spliit fork integration):
   - `POST /api/expenses/:id/split` - Split expense among co-owners
   - `GET /api/expenses/:id/balances` - Who owes whom
   - `POST /api/expenses/:id/settle` - Mark split as settled

3. Business Logic:
   - OCR receipt processing (extract date, amount, vendor)
   - Categorization (fuel, maintenance, insurance, berthing, etc.)
   - Spend tracking vs budget alerts
   - Tax-deductible expense flagging

**Dependencies:** B-01 (migrations)
**Context:** `intelligence/session-2/accounting-integration-spec.md`

---

### Agent B-07: Search Infrastructure
**Identity:** S2-BACKEND-H07
**Task:** Meilisearch integration + structured results

**Deliverables:**
1. `server/routes/search.js` - Unified search:
   - `POST /api/search/index` - Index all boat documents
   - `GET /api/search?q=generator&filters=type:manual` - Search with facets
   - `GET /api/search/suggestions?q=gen` - Autocomplete
   - `POST /api/search/rebuild` - Rebuild search index

2. Meilisearch Configuration:
   - Searchable attributes: title, content, equipment_name, category
   - Facets: document_type, equipment_category, date_range
   - Ranking rules: exactness, words, typo tolerance
   - Stop words: common marine terms

3. Integration:
   - Index on document upload (webhook)
   - Index on equipment add (webhook)
   - Structured results (no long lists - organized by category)

**Dependencies:** B-01 (migrations), existing Meilisearch setup
**Context:** `intelligence/session-2/search-ux-spec.md`

---

### Agent B-08: WhatsApp Integration API
**Identity:** S2-BACKEND-H08
**Task:** Notification delivery via WhatsApp Business API

**Deliverables:**
1. `server/routes/whatsapp.js` - WhatsApp messaging:
   - `POST /api/whatsapp/send` - Send notification
   - `POST /api/whatsapp/webhook` - Receive delivery status
   - `GET /api/whatsapp/templates` - List message templates
   - `GET /api/whatsapp/delivery-status/:message_id` - Check delivery

2. Message Templates:
   - Warranty expiration: "Your {equipment} warranty expires in {days} days"
   - Service reminder: "Service due for {boat_name} - {service_type}"
   - Expense alert: "Monthly spend reached €{amount} ({budget}% of budget)"
   - Motion detection: "Motion detected on {camera_name} at {time}"

3. Integration:
   - WhatsApp Business API credentials
   - Rate limiting (avoid spam)
   - Delivery tracking (sent, delivered, read, failed)
   - Opt-out handling (GDPR compliance)

**Dependencies:** B-01 (migrations)
**Context:** `intelligence/session-2/whatsapp-integration-spec.md`

---

### Agent B-09: Document Versioning API
**Identity:** S2-BACKEND-H09
**Task:** Version history + conflict resolution

**Deliverables:**
1. `server/routes/documents.js` - Enhanced document management:
   - `POST /api/documents/:id/versions` - Create new version
   - `GET /api/documents/:id/versions` - List version history
   - `GET /api/documents/:id/versions/:version_id` - Download specific version
   - `POST /api/documents/:id/restore/:version_id` - Restore old version
   - `GET /api/documents/:id/diff?from=v1&to=v2` - Compare versions

2. Business Logic:
   - SHA-256 hash of document content (IF.TTT compliance)
   - Version number auto-increment
   - Track who modified what when
   - Conflict detection (concurrent edits)

3. Storage:
   - Version metadata in database
   - Version content in object storage (S3)
   - Retention policy (keep last 10 versions per document)

**Dependencies:** B-01 (migrations), existing document storage
**Context:** `intelligence/session-2/document-versioning-spec.md`

---

### Agent B-10: VAT/Tax Tracking API
**Identity:** S2-BACKEND-H10
**Task:** EU exit reminders + customs stamp tracking

**Deliverables:**
1. `server/routes/vat-tracking.js` - EU compliance:
   - `POST /api/vat/exit-log` - Log EU exit event (GPS-based)
   - `GET /api/vat/exit-log/:boat_id` - EU exit history
   - `POST /api/vat/customs-stamp` - Upload customs stamp photo
   - `GET /api/vat/reminders` - 18-month EU exit reminder
   - `GET /api/vat/compliance-report` - Generate compliance report

2. Business Logic:
   - 18-month timer (alert 30 days before VAT obligation)
   - GPS tracking integration (auto-detect EU exit/entry)
   - Customs stamp OCR (extract date, country, stamp number)
   - Risk calculation (€20K-€100K VAT penalty)

3. Integration:
   - GPS webhooks (boat tracking system)
   - WhatsApp notifications (30/60/90 days before 18-month deadline)
   - PDF report generation (for customs authorities)

**Dependencies:** B-01 (migrations)
**Context:** `intelligence/session-2/vat-tax-tracking-spec.md`

---

## 🔄 Agent Coordination Protocol

### Task Execution Order

**Phase 1: Foundation (Agent B-01 MUST complete first)**
```
B-01 (Migrations) → BLOCKS ALL OTHER AGENTS
    ↓
Phase 2: Parallel API Development
```

**Phase 2: Parallel API Development (Agents B-02 through B-10)**
```
B-02 (Inventory) ─┐
B-03 (Maintenance)├─┐
B-04 (Cameras)    │ │
B-05 (Contacts)   ├─┤→ All run in parallel after B-01 completes
B-06 (Expenses)   │ │
B-07 (Search)     │ │
B-08 (WhatsApp)   ├─┘
B-09 (Versioning) │
B-10 (VAT)       ─┘
```

### Check-In Protocol (Inherited from InfraFabric S²)

Each agent MUST announce at start:
```markdown
I am S2-BACKEND-H02, assigned to Inventory Tracking API.
Dependencies: B-01 (migrations) must complete first.
Status: Waiting for B-01 completion signal.
```

### MCP Bridge Communication

**IF.bus message format:**
```json
{
  "from": "S2-BACKEND-H02",
  "to": "S2-PLANNER",
  "type": "STATUS_UPDATE",
  "payload": {
    "task": "Inventory Tracking API",
    "status": "COMPLETE",
    "deliverables": ["server/routes/inventory.js", "tests/inventory.test.js"],
    "next_blocker": null
  }
}
```

### Idle Task Assignment (When Blocked)

**While waiting for B-01:**
- Review Session 2 intelligence dossier for your assigned feature
- Write API documentation (OpenAPI 3.0 spec)
- Design test cases (unit tests, integration tests)
- Review InfraFabric MCP bridge code for patterns to reuse

**While helping blocked agents:**
- Code review for completed APIs
- Test other agents' endpoints
- Write integration tests across multiple APIs
- Debug migration issues if B-01 is blocked

---

## 📊 Success Metrics (IF.TTT Compliance)

### Traceable
- [ ] All API endpoints documented in OpenAPI 3.0 spec
- [ ] Git commit per feature (not one giant commit)
- [ ] IF.citation references in code comments
- [ ] Migration files versioned and tested

### Transparent
- [ ] Decision log: Why certain DB design choices made
- [ ] Token cost tracking (report Haiku usage per agent)
- [ ] Execution time per agent (measure performance)
- [ ] Blocker log (when agents wait, why they wait)

### Trustworthy
- [ ] All migrations tested with rollback
- [ ] API endpoints return proper HTTP status codes
- [ ] Error messages are actionable (not generic "500 error")
- [ ] Multi-tenant isolation verified (no data leakage across organizations)

---

## 🧪 Testing Requirements

Each agent MUST provide:

1. **Unit Tests** (Jest):
   - Test business logic functions
   - Mock database calls
   - Target: 80%+ code coverage

2. **Integration Tests**:
   - Test actual database operations
   - Test API endpoints with real requests
   - Test multi-tenant isolation

3. **API Documentation**:
   - OpenAPI 3.0 YAML file
   - Example requests/responses
   - Error code documentation

---

## 📁 Deliverables Structure

```
navidocs/
├── server/
│   ├── db/
│   │   └── migrations/
│   │       ├── 001_owner_dashboard_tables.sql
│   │       ├── 002_camera_integration.sql
│   │       ├── 003_warranty_tracking.sql
│   │       ├── 004_vat_tax_tracking.sql
│   │       └── 005_whatsapp_integration.sql
│   ├── routes/
│   │   ├── inventory.js
│   │   ├── maintenance.js
│   │   ├── cameras.js
│   │   ├── contacts.js
│   │   ├── expenses.js
│   │   ├── search.js
│   │   ├── whatsapp.js
│   │   ├── documents.js (enhanced)
│   │   ├── calendar.js
│   │   └── vat-tracking.js
│   └── tests/
│       └── backend/
│           ├── inventory.test.js
│           ├── maintenance.test.js
│           └── ... (one per feature)
└── intelligence/
    └── s2-backend/
        ├── agent-b01-migrations.md
        ├── agent-b02-inventory.md
        ├── ... (one per agent)
        ├── backend-swarm-summary.md
        └── backend-citations.json (IF.TTT compliance)
```

---

## 🚀 Launch Command (for S2-PLANNER)

```bash
# S2-PLANNER will spawn 10 Haiku agents in parallel
# Agent B-01 starts immediately
# Agents B-02 through B-10 wait for B-01 completion signal
# When blocked, agents perform idle tasks (documentation, test design)
```

**Estimated Cost:**
- 10 Haiku agents × 60K tokens average = 600K tokens
- ~$3-$5 total (Haiku pricing)

**Estimated Time:**
- Phase 1 (B-01 migrations): 30-45 minutes
- Phase 2 (B-02 to B-10 parallel): 3-4 hours
- Testing & integration: 2-3 hours
- **Total:** 6-8 hours

---

## 🔗 Context Links (GitHub URLs)

**Required Reading:**
- Session 2 Architecture: https://github.com/dannystocker/navidocs/blob/main/intelligence/session-2/session-2-architecture.md
- Session 2 Sprint Plan: https://github.com/dannystocker/navidocs/blob/main/intelligence/session-2/session-2-sprint-plan.md
- Complete Dossier: https://github.com/dannystocker/navidocs/blob/main/NAVIDOCS_COMPLETE_INTELLIGENCE_DOSSIER.md

**InfraFabric Integration:**
- MCP Bridge Code: https://github.com/dannystocker/infrafabric/blob/master/mcp-bridge/ (if exists)
- IF.TTT Standards: https://github.com/dannystocker/infrafabric/blob/master/docs/IF-TTT.md (if exists)

---

**Generated:** 2025-11-14
**By:** Claude Sonnet 4.5 (InfraFabric S² coordination framework)
**Citation:** if://mission/navidocs-s2-backend-swarm-2025-11-14
