# NaviDocs 4-Week Sprint Plan
## Session 2 Technical Implementation Roadmap

**Plan Date:** 2025-11-13
**Duration:** Weeks 1-4 (28 days)
**Team Capacity:** Estimated 2-3 engineers + 1 DevOps
**Success Criteria:** 11 feature modules + 50+ API endpoints ready for Session 3 UI integration

---

## Strategic Alignment

**Session 1 Pain Points → Session 2 Implementation:**

```
Pain Point Priority → Feature Module → Sprint Week

CRITICAL (Week 1):
€15K-€50K inventory loss → S2-H02 Inventory → Week 1 foundation
Doc chaos → S2-H09 Versioning → Week 1 foundation

HIGH (Week 2):
Maintenance cost tracking → S2-H03 Maintenance → Week 2
Expense chaos → S2-H06 Accounting → Week 2
VAT compliance risk → S2-H03A Tax tracking → Week 2

MEDIUM (Week 3):
80% monitoring anxiety → S2-H04 Cameras → Week 3
Finding providers → S2-H05 Contacts → Week 3
Calendar visibility → S2-H07A Multi-calendar → Week 3

INTEGRATION (Week 4):
Search impeccable UX → S2-H07 Search → Week 4
WhatsApp automation → S2-H08 WhatsApp → Week 4
E2E testing + hardening → All features → Week 4
```

---

## Week 1: Foundation (Database + Core APIs)

### Objective
Establish database foundation, core authentication, and critical data models. Enable all subsequent features to integrate.

### Daily Breakdown

#### Day 1 (Monday): Database Schema & Migration Planning
**Deliverable:** PostgreSQL schema creation scripts

```sql
-- Migration 001_create_core_tables.sql
-- Creates 29 total tables: 18 existing + 11 new

Work Tasks:
1. [ ] Create PostgreSQL database from provided schema (S2-H02 through S2-H09)
   Files: boat_inventory, receipt_ocr_cache, maintenance_log, etc.

2. [ ] Add columns to existing tables (documents, components, etc.)
   - Ed25519 signature fields
   - SHA-256 hash fields
   - IF.TTT citation_id fields

3. [ ] Create indexes for query performance
   - boat_id (all tables)
   - status, created_at (time-based queries)
   - citation_id (IF.TTT lookups)

4. [ ] Version control: commit schema to Git
   Schema file: /database/migrations/001_session2_schema.sql

5. [ ] Database admin setup
   - User roles: app (read/write), readonly (reports)
   - Connection pooling: max 20 connections
   - Backup strategy: daily snapshots

Acceptance Criteria:
✅ All 29 tables exist in PostgreSQL
✅ All indexes created (no missing performance keys)
✅ Foreign keys enforce referential integrity
✅ Migration scripts are idempotent (safe to run multiple times)
✅ Database size <100MB (should be much smaller initially)
```

#### Day 2 (Tuesday): Data Migration + Backup Strategy
**Deliverable:** Data migration from SQLite → PostgreSQL

```javascript
// scripts/migrate_sqlite_to_postgres.js
// Handles existing document data + structure preservation

Work Tasks:
1. [ ] Create migration script (Node.js)
   - Connect to both SQLite and PostgreSQL
   - Iterate through all existing tables
   - Transform data types (SQLite TEXT → PostgreSQL VARCHAR)
   - Handle NULL values and date formats

2. [ ] Backup strategy
   - Full backup: nightly at 2 AM UTC
   - Incremental: hourly for last 24 hours
   - Retention: 30 days of full backups
   - Test restore: verify 1 backup can be restored

3. [ ] Rollback procedure
   - Document reverting to SQLite if needed
   - Keep SQLite file for 1 week post-migration
   - Validate nothing lost in translation

4. [ ] Test data verification
   - Row count comparison (SQLite vs PostgreSQL)
   - Sample row spot-check (100 documents)
   - Checksum validation (should match)

Acceptance Criteria:
✅ All data migrated with zero loss
✅ Row counts match before/after
✅ Existing document links still work
✅ User sessions/auth tokens not affected
✅ Can rollback to SQLite within 1 hour
```

#### Day 3 (Wednesday): Authentication Update + Environment Setup
**Deliverable:** Updated auth service for PostgreSQL + JWT validation

```javascript
// server/services/auth.service.js (UPDATED for PostgreSQL)

Work Tasks:
1. [ ] Update auth.service.js for new database connection
   - Change connection string from SQLite to PostgreSQL
   - Use connection pooling (pg npm package)
   - Update query syntax (SQLite → PostgreSQL differences)

2. [ ] Environment configuration
   - Add DATABASE_URL to .env
   - Update .env.example with PostgreSQL template
   - Staging vs production configs documented

3. [ ] Test JWT token generation
   - Register new user → verify JWT works
   - Refresh token logic → still functional
   - Password reset flow → still sends emails

4. [ ] Session management
   - Move session storage from SQLite to PostgreSQL
   - Or use Redis for sessions (recommended)
   - Test logout on all devices works

5. [ ] Security hardening
   - Audit: no credentials in logs
   - Test: account lockout after 5 failed attempts
   - Test: password reset token expires after 24h

Acceptance Criteria:
✅ Users can register and login with PostgreSQL
✅ Existing users still logged in (session persists)
✅ Token refresh doesn't break with new DB
✅ All security checks still enforced
✅ Zero breaking changes to existing API
```

#### Day 4 (Thursday): Document Versioning Schema + Ed25519 Setup
**Deliverable:** Document versioning infrastructure + crypto keys

```typescript
// server/services/document-signature-manager.ts (NEW)

Work Tasks:
1. [ ] Implement document versioning tables
   - documents table (updated with version fields)
   - document_versions table (full history)
   - document_access_control table (ACL)
   - document_audit_log table (IF.TTT compliance)

2. [ ] Ed25519 keypair generation
   - User: generate keypair on first login
   - Store public key in users table
   - Private key: encrypted in secure storage (TBD Session 3)

3. [ ] Document signing implementation
   - Sign document on upload (payload = doc_id + version + hash + user + timestamp)
   - Verify signature on download
   - Fail if signature invalid (tampering detected)

4. [ ] SHA-256 hashing
   - Calculate hash on file upload
   - Store hash in documents table
   - Implement hash verification endpoint

5. [ ] IF.TTT citation generation
   - Create citation_id format: if://doc/navidocs/{boat_id}/{doc_id}-v{version}
   - Store in documents + document_versions tables
   - Display in UI (will be implemented in Session 3)

Acceptance Criteria:
✅ Document upload creates version record
✅ Ed25519 signature stored correctly
✅ SHA-256 hash matches file content
✅ Citation ID follows IF.TTT format
✅ Audit log captures upload metadata
✅ Signature verification prevents tampering
```

#### Day 5 (Friday): API Integration + Testing
**Deliverable:** Core API endpoints working with PostgreSQL + auth

```javascript
// Tests: /api/documents, /api/upload (updated for PostgreSQL)

Work Tasks:
1. [ ] Test document upload endpoint
   - POST /api/upload (file, title, documentType)
   - Verify file stored with correct hash
   - Verify version record created
   - Verify ed25519_signature stored

2. [ ] Test document retrieval
   - GET /api/documents (list all)
   - GET /api/documents/:id (single with versions)
   - GET /api/documents/:id/pdf (stream PDF)
   - Verify signature validation on access

3. [ ] Test permission checks
   - User A uploads document
   - User B (same org) can read
   - User C (different org) cannot read
   - Audit log shows both access attempts

4. [ ] Performance baseline
   - Measure: document upload latency (<5sec)
   - Measure: list query latency (<500ms for 100 docs)
   - Measure: PDF stream latency (<2sec start)

5. [ ] Regression testing
   - All existing API endpoints still work
   - No breaking changes from SQLite → PostgreSQL
   - Backward compatibility verified

Acceptance Criteria:
✅ All authentication tests pass
✅ Document CRUD operations work
✅ Permission enforcement verified
✅ Audit log captures all actions
✅ Performance within targets
✅ Zero regressions in existing API
✅ Code coverage >80% for core services
```

### Week 1 Deliverables
```
✅ PostgreSQL database with 29 tables
✅ Data migration from SQLite (zero data loss)
✅ Document versioning + IF.TTT infrastructure
✅ Auth service updated for PostgreSQL
✅ Ed25519 signing + SHA-256 hashing implemented
✅ 10+ core API endpoints verified working
✅ Database migration scripts committed to Git
✅ Backup/restore strategy documented
```

---

## Week 2: Daily Engagement Features (Inventory + Maintenance + Expenses)

### Objective
Build the three features that drive daily user engagement: inventory tracking, maintenance reminders, and expense tracking. All support OCR integration.

### Daily Breakdown

#### Day 6 (Monday): Inventory Tracking API (S2-H02)
**Deliverable:** Full inventory CRUD + OCR receipt pipeline

```javascript
// server/routes/inventory.routes.js (NEW)
// server/services/inventory.service.js (NEW)

Work Tasks:
1. [ ] Database: verify boat_inventory table created
   - Fields: id, boat_id, item_name, category, zone, purchase_price, current_value, warranty_expiration, photos, serial_number, etc.
   - Indexes: boat_id, category, zone, warranty_status

2. [ ] API Endpoints - CRUD
   - POST /api/v1/boats/:boat_id/inventory
     Input: { item_name, category, zone, purchase_price, purchase_date, warranty_expiration, photo_urls, manufacturer, model_number, serial_number }
     Output: { id, ...fields, current_value (calculated from depreciation), created_at }

   - GET /api/v1/boats/:boat_id/inventory
     Filters: category, zone, warranty_status, value_min/max, search
     Output: { total, page, limit, items: [], aggregations: { by_category, by_zone, total_value, warranty_breakdown } }

   - GET /api/v1/boats/:boat_id/inventory/:item_id
     Output: { id, ...fields, depreciation_rate, condition, notes }

   - PATCH /api/v1/boats/:boat_id/inventory/:item_id
     Input: { current_value, condition, notes, photo_urls }
     Output: updated item

   - DELETE /api/v1/boats/:boat_id/inventory/:item_id
     Output: success message (soft delete)

3. [ ] Inventory service logic
   - calculateCurrentValue(purchase_price, purchase_date, depreciation_rate)
   - getInventorySummary(boat_id) → total value + by category
   - getWarrantyAlerts(boat_id) → items expiring <90 days

4. [ ] Meilisearch indexing
   - Index inventory items immediately on create/update
   - Searchable: item_name, manufacturer, model_number, serial_number, description, category, zone
   - Filterable: category, zone, warranty_status, value_range, boat_id

5. [ ] Error handling
   - Validate category/zone enums
   - Validate purchase_price > 0
   - Validate warranty_expiration > purchase_date
   - Prevent duplicate items (name + boat_id + manufacturer)

Acceptance Criteria:
✅ All inventory CRUD endpoints implemented
✅ Depreciation calculation correct (test with known values)
✅ Aggregations return correct counts + values
✅ Meilisearch index updated on create/update/delete
✅ Permission checks: can only access own boat's inventory
✅ Performance: list 500 items <200ms
✅ Error handling: proper HTTP status codes (400, 403, 404, 409)
```

#### Day 7 (Tuesday): Receipt OCR Pipeline (S2-H02)
**Deliverable:** Receipt upload + OCR extraction + category suggestion

```javascript
// server/routes/inventory.routes.js (EXTENDED)
// server/services/ocr-inventory.service.js (NEW)
// server/workers/receipt-ocr-worker.js (NEW)

Work Tasks:
1. [ ] Receipt upload endpoint
   - POST /api/v1/boats/:boat_id/inventory/receipt-upload
   - Input: file (image/jpeg, max 10MB), ocr_method (tesseract | google-vision)
   - Store image: /uploads/boat-:id/receipts/:filename
   - Generate SHA-256 hash of image
   - Queue OCR job via BullMQ

2. [ ] Hybrid OCR processing
   - Phase 1: Tesseract (local, fast)
     • Pre-process: deskew, denoise, contrast enhancement
     • Extract text + confidence scores
     • If confidence >= 0.85, use it; else fallback

   - Phase 2: Google Vision API (cloud, accurate)
     • Run if Tesseract confidence < 0.85
     • Extract structured fields: vendor, date, items, total, tax
     • Calculate combined confidence score

3. [ ] OCR data parsing
   - Extract: vendor name, date, line items, subtotal, tax, total, currency
   - Validate: date in reasonable range (last 5 years), amount > 0
   - Return extracted_data as JSON

4. [ ] Category suggestion logic
   - Match against CATEGORY_KEYWORDS (engine, electronics, fuel, safety, etc.)
   - Keyword matching: "Diesel" → Fuel, "Furuno" → Electronics
   - Confidence scoring: # matched keywords / total keywords
   - Return top 3 suggestions with confidence

5. [ ] Suggested inventory item creation
   - User reviews OCR extraction
   - User selects category/zone (pre-filled from suggestion)
   - User confirms or edits extracted data
   - POST /api/v1/boats/:boat_id/inventory (with receipt_url + ocr_data)

Acceptance Criteria:
✅ Receipt upload works (image stored, hash generated)
✅ Tesseract runs locally <30sec per image
✅ Google Vision API fallback works if Tesseract <85%
✅ Extracted data shows confidence scores
✅ Category suggestions appear (top 3)
✅ Suggested inventory item can be created from OCR
✅ OCR confidence > 85% for standard receipts (test with 10 real receipts)
✅ Cost: Tesseract free + Vision API <$10/month for typical usage
```

#### Day 8 (Wednesday): Maintenance Log & Reminders (S2-H03)
**Deliverable:** Full maintenance tracking + smart reminder engine

```javascript
// server/routes/maintenance.routes.js (NEW)
// server/services/maintenance.service.js (NEW)
// server/workers/maintenance-reminders.js (NEW)

Work Tasks:
1. [ ] Maintenance log CRUD
   - POST /api/v1/boats/:boat_id/maintenance
     Input: { service_type, date, cost, provider, notes, receipt_url, engine_hours, next_due_date, next_due_engine_hours }
     Output: { id, ...fields, next_due_date (if not provided, calculate), reminders: [] }

   - GET /api/v1/boats/:boat_id/maintenance (with filters)
   - PATCH /api/v1/boats/:boat_id/maintenance/:id
   - DELETE /api/v1/boats/:boat_id/maintenance/:id

2. [ ] Service interval configuration
   - maintenance_service_intervals table: engine (6mo/100h), electronics (12mo), hull (24mo), etc.
   - Allow boat-specific overrides
   - Display recommended next service based on interval

3. [ ] Smart reminder calculation
   - Function: calculateReminderStatus(maintenance_record, current_engine_hours)
   - Logic:
     • If next_due_date exists: use date
     • If next_due_engine_hours exists: calculate date from engine hours (assume 25 h/day)
     • If both exist: remind on whichever comes first
     • Alert levels: 60d, 30d, 14d, 7d, overdue

4. [ ] Reminder generation
   - Cron job: daily at 9 AM UTC
   - Query: upcoming maintenance in next 60 days
   - Create maintenance_reminders records
   - Call notification service (email/SMS/push - TBD)

5. [ ] Expense integration
   - expense_rollup endpoints:
     • GET /api/v1/boats/:boat_id/maintenance/expenses/ytd
     • GET /api/v1/boats/:boat_id/maintenance/expenses/annual-analysis
     • GET /api/v1/boats/:boat_id/maintenance/expenses/all-time
   - Aggregate costs by service_type, by provider, by month

Acceptance Criteria:
✅ All maintenance CRUD endpoints work
✅ Next due date auto-calculated if not provided
✅ Reminder calculation correct (test with 5 scenarios)
✅ Cron job runs daily without errors
✅ Expense aggregation queries <500ms for 200 records
✅ Meilisearch indexing of maintenance logs
✅ Permission checks: can only modify own boat's maintenance
✅ Soft delete: maintenance records not removed, just marked deleted
```

#### Day 9 (Thursday): Expense Tracking & VAT (S2-H06 + S2-H03A)
**Deliverable:** Multi-user expense tracking + VAT compliance foundation

```javascript
// server/routes/expenses.routes.js (NEW)
// server/services/expense.service.js (NEW)
// server/routes/tax.routes.js (NEW)
// server/services/tax.service.js (NEW)

Work Tasks:
1. [ ] Expense CRUD (multi-user)
   - POST /api/expenses
     Input: { boat_id, amount, currency, vendor_name, category_id, purchase_date, payment_method, description, receipt_image_url }
     Output: { id, ...fields, reimbursement_status: pending, created_at }

   - GET /api/expenses (with filters)
   - PATCH /api/expenses/:id (edit amount, category, notes)
   - DELETE /api/expenses/:id (soft delete)

   - For captain/crew: submit for approval
     reimbursement_status: pending → owner_reviews → approved → paid

2. [ ] Category hierarchical structure
   - expense_categories table: Fuel > Diesel, Marina > Fees
   - Query: getCategories(boat_id) → tree structure
   - UI will allow drilling down (TBD Session 3)

3. [ ] Multi-currency support
   - Support: EUR, USD, GBP (default EUR)
   - exchange_rates table: daily rates from ECB/OER
   - Function: convertToBaseCurrency(amount, currency, date)
   - Display: amount in original currency + amount_in_primary_currency

4. [ ] VAT tracking foundation
   - Fields in expenses: vat_amount, vat_percentage, tax_deductible
   - boat_tax_status table: boat_id, vat_paid, ta_entry_date, ta_expiry_date, compliance_status
   - Fields: next_required_exit_date, days_until_exit, alert_level (NONE, YELLOW, ORANGE, RED, CRITICAL)

5. [ ] VAT compliance alerts
   - Cron job: daily check of VAT status
   - Query: boats with ta_expiry_date < today + 60 days
   - Generate compliance_alerts
   - Later: send WhatsApp/email notifications

6. [ ] Expense reporting
   - GET /api/expenses/summary → total by category, by month
   - GET /api/expenses/ytd → year-to-date breakdown
   - Support: export to CSV (TBD session 4)

Acceptance Criteria:
✅ Expense CRUD endpoints work
✅ Category hierarchy retrievable
✅ Currency conversion uses current exchange rates
✅ VAT fields stored correctly
✅ Compliance status calculated (COMPLIANT, AT_RISK, NON_COMPLIANT, OVERDUE)
✅ Alert generation triggers for boats <90 days from exit
✅ Permission checks: captain can only submit own expenses, owner can approve/reject
✅ Performance: list 1,000 expenses <200ms
✅ Meilisearch indexing of expenses
```

#### Day 10 (Friday): Integration Testing + Optimization
**Deliverable:** Week 2 features integrated + performance validated

```javascript
// tests/inventory.integration.test.js
// tests/maintenance.integration.test.js
// tests/expense.integration.test.js
// tests/tax.integration.test.js

Work Tasks:
1. [ ] Cross-feature integration tests
   - Upload inventory item → appears in search
   - Log maintenance → appears in calendar (TBD week 3)
   - Log maintenance → suggests provider (uses S2-H05 contacts)
   - Log expense linked to maintenance → aggregate shows in maintenance/expenses/ytd
   - Add equipment → warranty expires → VAT tracking (TBD)

2. [ ] End-to-end workflows
   - Captain uploads receipt → OCR extracts → creates inventory → admin approves → appears in inventory list
   - Owner logs maintenance → system calculates next due → generates reminder → captain gets notified (TBD)
   - Multiple currency expenses → convert to boat's primary → include in budget reports

3. [ ] Database query optimization
   - Verify indexes working (EXPLAIN ANALYZE)
   - Aggregate queries <500ms (ytd expenses, inventory summary)
   - Pagination: 100 items per page loads <200ms

4. [ ] Error scenarios
   - Invalid category → error 400 with message
   - Exceed upload file size → error 413
   - Non-existent boat_id → error 404
   - Permission denied (wrong org) → error 403
   - Duplicate item detection → error 409

5. [ ] Load testing
   - Simulate 100 concurrent users uploading receipts
   - Simulate 10,000 inventory items
   - Measure: peak latency, error rate, DB connection pool

6. [ ] Code quality
   - Lint: ESLint passes (no warnings)
   - Test coverage: >80% for service layer
   - Security: no hardcoded credentials, no SQL injection

Acceptance Criteria:
✅ All integration tests pass
✅ End-to-end workflows verified
✅ Database queries optimized (indexes working)
✅ Error handling comprehensive (all edge cases)
✅ Load test passes: 100 concurrent users, <2sec latency
✅ 10,000 inventory items queryable <200ms
✅ Code coverage >80%
✅ Lint: zero errors, zero warnings
✅ Security: OWASP Top 10 checks pass
```

### Week 2 Deliverables
```
✅ Inventory tracking API (CRUD + OCR + category suggestions)
✅ Maintenance log API (CRUD + smart reminders + expense rollup)
✅ Multi-user expense tracking (reimbursement workflow)
✅ Multi-currency support
✅ VAT/tax compliance tracking foundation
✅ Meilisearch indexing for all three features
✅ Integration tests passing
✅ Database performance optimized
✅ Error handling comprehensive
```

---

## Week 3: Monitoring & Advanced Features (Cameras + Contacts + Calendar)

### Objective
Add real-time monitoring (cameras), service provider network (contacts), and unified calendar view. Support proactive notifications.

### Daily Breakdown

#### Day 11 (Monday): Home Assistant Camera Integration (S2-H04)
**Deliverable:** HA webhook receiver + snapshot storage + security

```javascript
// server/routes/webhooks.routes.js (NEW)
// server/services/camera.service.js (NEW)
// server/services/ha-client.service.js (NEW)

Work Tasks:
1. [ ] Webhook receiver endpoint
   - POST /api/webhooks/events/home-assistant
   - Input: { object, entry: [ { changes: [ { value: { messaging_product, metadata, contacts, messages, status_update } } ] } ] }
   - Signature validation: HMAC-SHA256 of request body
   - Timestamp validation: within 5-minute window (replay prevention)
   - Rate limiting: 100 events/min per boat_id

2. [ ] Snapshot storage
   - camera_snapshots table: image_url, snapshot_timestamp, boat_id, camera_name, event_type, confidence_score
   - Store snapshots in S3 or local /uploads/boat-:id/snapshots/
   - Soft delete: retention policy 30 days (auto-delete older)
   - Generate thumbnail for gallery

3. [ ] Alert routing
   - Motion detected → evaluate priority
   - Battery low → CRITICAL alert
   - Door opened → evaluate context (expected? at night?)
   - Route to: WebSocket (real-time), push notification (TBD), email (TBD)

4. [ ] Computer vision placeholder
   - camera_cv_analysis table: snapshot_id, detected_objects, confidence_scores, processed_at
   - For now: store placeholder (TBD: YOLOv8 integration week 4)
   - Future: auto-detect missing equipment (responds to S2-H02)

5. [ ] Security hardening
   - Verify X-HA-Access token (bearer token)
   - Verify request comes from HA server IP (optional for dev)
   - Log all webhook calls for audit trail
   - Rate limit enforced: reject >100 events/min

Acceptance Criteria:
✅ Webhook receiver accepts HA events
✅ HMAC signature validation prevents spoofing
✅ Replay attack prevention (timestamp window)
✅ Rate limiting enforced
✅ Snapshots stored with correct metadata
✅ Soft delete: snapshots >30 days auto-deleted
✅ Permission check: event belongs to user's boat
✅ IF.TTT audit logging for camera events
✅ Load test: 10 events/sec from single boat handled
```

#### Day 12 (Tuesday): Contact Management (S2-H05)
**Deliverable:** Service provider directory + quick actions

```javascript
// server/routes/contacts.routes.js (NEW)
// server/services/contact.service.js (NEW)

Work Tasks:
1. [ ] Contact CRUD
   - POST /api/contacts
     Input: { boat_id, name, role (marina, mechanic, electrician, surveyor, etc.), phone, email, company, notes }
     Output: { id, ...fields, is_favorite, usage_count, last_used, created_at }

   - GET /api/contacts (with filters: boat_id, role, search, is_favorite)
   - GET /api/contacts/:id (with interaction history)
   - PATCH /api/contacts/:id (update info)
   - DELETE /api/contacts/:id (soft delete)

2. [ ] Favorite contacts
   - POST /api/contacts/:id/favorite
     Input: { is_favorite: true/false }
     Output: updated contact

   - GET /api/contacts/favorites
     Output: [ contact1 (starred), contact2 (starred), ... ]

3. [ ] Interaction tracking
   - contact_interactions table: boat_id, contact_id, interaction_type (call, email, sms, whatsapp, in_person), interaction_date
   - POST /api/contacts/:id/interact
     Input: { interaction_type, source_type, source_id }
     Output: updated contact with last_used, usage_count

4. [ ] Smart suggestions
   - GET /api/contacts/recommend
     Input: { boat_id, role, context: 'recent' | 'favorite' | 'most_used' }
     Output: { recommended: contact, alternatives: [contact2, contact3, ...], reason: "Used 2 days ago" }

   - Used by maintenance log: "Who should service this?"
   - Used by WhatsApp: quick provider links

5. [ ] Auto-suggestions from maintenance
   - contact_suggestions table: boat_id, maintenance_log_id, suggested_name, suggested_role, status (pending, accepted, rejected)
   - When maintenance logged with new provider → suggest contact creation
   - User can accept → create new contact, or reject

6. [ ] Mobile one-tap actions
   - tel: links for phone → clicks call
   - mailto: links for email → clicks email
   - whatsapp://send for WhatsApp
   - (TBD: will be rendered by Vue 3 in Session 3)

Acceptance Criteria:
✅ All contact CRUD endpoints work
✅ Favorite toggle works
✅ Interaction tracking logs calls/emails
✅ Suggest endpoint returns top provider
✅ Auto-suggestions generated from maintenance logs
✅ Permission checks: can only access own boat's contacts
✅ Search works (fuzzy match on name/company)
✅ Meilisearch indexing of contacts
✅ Performance: list 500 contacts <200ms
```

#### Day 13 (Wednesday): Multi-Calendar System (S2-H07A)
**Deliverable:** Unified 4-calendar view + conflict detection

```javascript
// server/routes/calendar.routes.js (NEW)
// server/services/calendar.service.js (NEW)
// server/workers/calendar-conflict-detector.js (NEW)

Work Tasks:
1. [ ] Calendar event CRUD
   - calendar_events table: covers 4 calendar types
     • service_due (from maintenance_log)
     • warranty_expires (from inventory)
     • owner_onboard (manual entry)
     • work_planned (from expenses/budget)

   - POST /api/calendar/events
     Input: { boat_id, event_type, title, start_date, end_date, description, ...type-specific fields }
     Output: { id, ...fields, has_conflicts: false, created_at }

   - GET /api/calendar/events
     Query: { boat_id, start_date, end_date, event_type (optional filter) }
     Output: [ { id, title, start_date, end_date, event_type, color_code }, ... ]

   - PATCH /api/calendar/events/:id
   - DELETE /api/calendar/events/:id

2. [ ] Calendar type integration
   - Service Calendar (from maintenance_log):
     • Auto-create: log maintenance → calendar event "Oil Change Due"
     • Auto-update: change next_due_date → update calendar event

   - Warranty Calendar (from inventory):
     • Auto-create: add inventory → create event "Radar Warranty Expires"
     • Auto-delete: warranty_expires in past → archive event

   - Owner Onboard Calendar (manual):
     • Owner enters dates: "Arriving Dec 15, departing Dec 22"
     • Manual entry only

   - Work Roadmap Calendar (from expenses):
     • Link approved work orders to calendar
     • Show budget + status

3. [ ] Conflict detection
   - calendar_conflict_detection table
   - Background job: daily check for conflicts
   - Types of conflicts:
     • date_overlap: two events on same day
     • resource_conflict: same service provider double-booked
     • owner_availability: work scheduled when owner not onboard
     • budget_excess: total work cost > approved budget

4. [ ] Color coding + sorting
   - Service: Blue (#4A90E2)
   - Warranty: Orange (#F5A623)
   - Owner: Green (#7ED321)
   - Work: Purple (#BD10E0)
   - Display order: by priority + start_date

5. [ ] Export to external calendars
   - /api/calendar/export/ical (iCal format)
   - /api/calendar/export/google (Google Calendar sync - TBD)
   - Includes: all events + descriptions + conflict warnings

Acceptance Criteria:
✅ All calendar CRUD endpoints work
✅ Service calendar auto-populated from maintenance logs
✅ Warranty calendar auto-populated from inventory
✅ Owner onboard dates manually enterable
✅ Work roadmap populated from approved expenses
✅ Conflict detection runs daily
✅ Conflicts marked on events (has_conflicts: true)
✅ Color coding correct for each type
✅ Export to iCal produces valid file
✅ Permission checks: only see own boat's calendar
✅ Performance: month view <200ms for 100+ events
```

#### Day 14 (Thursday): Integration Testing + Notification Infrastructure
**Deliverable:** Week 3 features integrated + notification routing

```javascript
// tests/camera.integration.test.js
// tests/contact.integration.test.js
// tests/calendar.integration.test.js
// server/services/notification.service.js (NEW)

Work Tasks:
1. [ ] Cross-feature integration
   - Maintenance logged → creates calendar event → suggests provider contact → user calls provider
   - Equipment warranty expiring → calendar alert → user updates inventory status
   - Work scheduled → conflict detected → user notified → moves to different date → conflict resolved
   - Camera detects motion → alert generated → user sees in mobile app (WebSocket)

2. [ ] Notification routing setup (foundation)
   - notification.service.js: send notifications via multiple channels
   - Channels: in-app (WebSocket), email (TBD), SMS (TBD), push (TBD), WhatsApp (Week 4)
   - For now: implement in-app only
   - Prepare database: notifications table (id, user_id, type, content, read, created_at)

3. [ ] WebSocket real-time updates
   - Socket.io connection: /socket.io/
   - On camera snapshot: emit event to all connected clients for that boat
   - On calendar conflict: emit alert to boat owner
   - On maintenance reminder: emit notification to boat owner + captain

4. [ ] Rate limiting for notifications
   - Max 1 notification/minute per user (burst tolerance)
   - Group similar events: don't send 10 motion alerts, send 1 "motion detected 10 times"
   - Quiet hours: no notifications 22:00-07:00 (configurable)

5. [ ] Audit trail for notifications
   - Log: what notification sent, to whom, when, via which channel
   - Enable: user can see notification history
   - Enable: debugging why notification didn't reach

Acceptance Criteria:
✅ Integration tests pass: maintenance → calendar → contact → notification
✅ Notification routing infrastructure supports 4+ channels
✅ WebSocket broadcasts work (test with 10 concurrent clients)
✅ Rate limiting enforced (max 1/min, grouping)
✅ Audit trail logged
✅ Quiet hours respected
✅ Performance: notification generated <100ms
```

#### Day 15 (Friday): Calendar Notifications + Performance Tuning
**Deliverable:** Calendar notification rules + week 3 optimization

```javascript
// server/workers/calendar-notification-scheduler.js (NEW)
// tests/notifications.test.js

Work Tasks:
1. [ ] Calendar notification rules
   - calendar_notification_rules table
   - Define: when to notify, how many days before, via which channel
   - Examples:
     • Service due: notify 60d before (email), 14d before (push), 1d before (SMS)
     • Warranty expires: notify 90d before (email), 30d before (push)
     • Work scheduled: notify 7d before (email + push)

   - Cron job: daily at 9 AM UTC
   - Query: events with notification triggers
   - Generate notifications in notifications table
   - Call notification.service to send via channels

2. [ ] Notification templates
   - Email template: include document links if relevant
   - Push template: concise (<140 chars)
   - SMS template: ultra-concise (<160 chars)
   - WhatsApp template: formatted message with links

3. [ ] Performance optimization
   - Index: calendar_events (boat_id, start_date, event_type, status)
   - Query: all events for month <100ms (even with 10,000 boats)
   - Lazy load: conflict detection only for future events

4. [ ] Database cleanup
   - Archive: events >1 year old marked archived (not deleted)
   - Soft delete: no hard deletes, maintain audit trail
   - Prune: notification history >3 months old (optional)

5. [ ] Load testing week 3
   - Simulate 1,000 boats with calendars
   - Simulate 100,000 total calendar events
   - Conflict detection runs: <5 min for all boats
   - Month view queries: <200ms per boat

Acceptance Criteria:
✅ Calendar notification rules configured
✅ Cron job generates notifications daily
✅ Notification templates formatted correctly
✅ Performance: month view <200ms for 1,000 events
✅ Load test: 1,000 boats with calendars handled
✅ Archive/cleanup works without data loss
✅ All week 3 integration tests pass
```

### Week 3 Deliverables
```
✅ Home Assistant webhook receiver (camera integration)
✅ Snapshot storage + soft delete policy
✅ Contact management (provider directory)
✅ Multi-calendar system (4 types)
✅ Conflict detection + resolution
✅ Calendar notification rules
✅ WebSocket real-time updates
✅ Integration tests passing
✅ Performance optimized (1,000 events <200ms)
```

---

## Week 4: Search, WhatsApp, & Hardening

### Objective
Implement impeccable search UX, WhatsApp AI integration, and comprehensive testing/security hardening.

### Daily Breakdown

#### Day 16 (Monday): Meilisearch Full-Text Search (S2-H07)
**Deliverable:** 5-index Meilisearch setup + faceted search

```javascript
// server/services/search.service.js (EXTENDED)
// server/routes/search.routes.js (NEW)
// scripts/initialize-meilisearch-indexes.js (NEW)

Work Tasks:
1. [ ] Meilisearch instance setup
   - Install: Meilisearch 0.41.0 (Docker recommended)
   - Configure: MEILI_MASTER_KEY, MEILI_SEARCH_KEY
   - Environment: staging vs production (separate instances)
   - Backup: daily snapshots of Meilisearch data

2. [ ] Create 5 indexes
   a) navidocs-documents
      - searchable: title, text, documentType, manufacturer
      - filterable: documentType, category, status, ocrConfidence
      - sortable: createdAt, updatedAt, title

   b) navidocs-inventory
      - searchable: componentName, manufacturer, modelNumber, description
      - filterable: categoryName, zoneName, warrantyStatus, valueRange
      - sortable: value, lastServiceDate, componentName

   c) navidocs-maintenance
      - searchable: serviceName, description, providerName
      - filterable: serviceType, status, costRange
      - sortable: serviceDate, cost, serviceName

   d) navidocs-expenses
      - searchable: expenseName, vendorName, categoryName
      - filterable: categoryName, amountRange, paymentStatus
      - sortable: expenseDate, amount, expenseName

   e) navidocs-contacts
      - searchable: name, company, email, phone
      - filterable: role, isFavorite, lastUsed
      - sortable: usageCount, lastUsed, name

3. [ ] Tenant token generation
   - Meilisearch tenant tokens: scoped search by organization
   - Function: generateTenantToken(userId, organizationIds, expiresIn)
   - API: POST /api/search/token → returns { token, expiresAt, searchUrl, indexName }
   - Client uses token for direct Meilisearch queries (reduces API load)

4. [ ] Backend search API
   - POST /api/search
     Input: { q (query), filters?: { documentType, entityId, language }, limit, offset }
     Output: { hits, estimatedTotalHits, query, processingTimeMs }

   - Filtering: automatically scope to user's organizations
   - Multi-index search: search across all 5 indexes if no type specified

5. [ ] Index syncing
   - On create: immediately index document
   - On update: re-index
   - On delete: remove from index
   - BullMQ job for batch re-indexing (nightly)

Acceptance Criteria:
✅ All 5 indexes created with correct config
✅ Tenant token generation works
✅ Client search queries <200ms
✅ Faceted search returns aggregations
✅ Permission filtering works (can't see other org's data)
✅ Index syncing: creates/updates/deletes reflected in search
✅ Performance: 10,000 documents searchable <100ms
✅ Load test: 100 concurrent searches <500ms response time
```

#### Day 17 (Tuesday): WhatsApp AI Agent (S2-H08)
**Deliverable:** WhatsApp Business API integration + Claude API commands

```javascript
// server/routes/whatsapp.routes.js (NEW)
// server/services/whatsapp.service.js (NEW)
// server/services/whatsapp-ai-agent.service.js (NEW)
// server/workers/whatsapp-command-executor.js (NEW)

Work Tasks:
1. [ ] WhatsApp webhook receiver
   - POST /api/v1/tenants/:tenantId/whatsapp/webhooks/messages
   - Verify signature: X-Hub-Signature (SHA256 HMAC)
   - Validate: timestamp, phone_number_id, messaging_product
   - Rate limiting: 100 messages/min per boat

2. [ ] Message routing
   - Store raw message: whatsapp_groups, whatsapp_messages
   - Check: is this a command? (starts with @NaviDocs)
   - If command: parse and execute
   - If question: send to Claude API for RAG

3. [ ] Command parsing & execution
   - Commands:
     @NaviDocs log maintenance [service_type]
     @NaviDocs log expense [amount] [category]
     @NaviDocs add inventory [item_name] [category] [price]
     @NaviDocs list [type] [filters]
     @NaviDocs when's [item] warranty?
     @NaviDocs remind me [event] [date]

   - Execution: call respective service APIs (S2-H03, S2-H06, S2-H02, etc.)
   - Response: confirmation message with details

4. [ ] Claude API integration (RAG)
   - Non-command messages → send to Claude 3.5 Haiku
   - System prompt: includes boat context (boat_type, owner_name, inventory summary)
   - RAG: search documents + inventory + maintenance for context
   - Response: natural language answer with document links (if://doc/... citations)

5. [ ] Proactive alerts
   - Maintenance due: daily 9 AM check → send reminders to group
   - Warranty expiring: weekly check → send alerts
   - Expense approved: send notification to captain
   - Document uploaded: notify group of new manuals
   - Format: concise WhatsApp-friendly messages

6. [ ] IF.TTT compliance
   - Log all messages: message_id, content, sender, timestamp
   - Sign responses: Ed25519 signature of bot response
   - Citation IDs: if://chat/navidocs/boat-123/msg-456

Acceptance Criteria:
✅ Webhook receiver accepts WhatsApp events
✅ Message storage works (audit trail)
✅ Command parsing recognizes all commands
✅ Command execution integrates with service APIs
✅ Claude API responses appropriate for boat context
✅ Proactive alerts send on schedule
✅ Tenant isolation: messages only for authorized boat
✅ Signature validation: prevents spoofing
✅ Load test: 50 messages/sec handled
✅ IF.TTT logging: all messages signed + cited
```

#### Day 18 (Wednesday): Security Hardening & OWASP Top 10
**Deliverable:** Security audit + vulnerability fixes

```javascript
// tests/security.test.js (NEW)
// scripts/security-audit.js (NEW)

Work Tasks:
1. [ ] OWASP Top 10 verification
   a) Injection: SQL injection tests (parameterized queries verify)
   b) Authentication: JWT expiry, token revocation, account lockout
   c) Sensitive data: no passwords in logs, encryption at rest
   d) XML External Entities: not applicable (no XML parsing)
   e) Broken access control: permission tests (can't access other org's data)
   f) Security misconfiguration: CORS, HTTPS only, headers (Helmet)
   g) XSS: input validation, output encoding (Vue.js handles)
   h) Insecure deserialization: validate all JSON payloads
   i) Using components with known vulnerabilities: npm audit, regular updates
   j) Insufficient logging: audit trail comprehensive, tamper detection

2. [ ] API security tests
   - Rate limiting: 100 req/15min enforced (mock exceeding)
   - CSRF: CORS tokens verified
   - CORS: whitelist only allowed origins
   - Headers: Helmet middleware applied
   - HTTPS: all endpoints require TLS

3. [ ] Data validation
   - Input: all user inputs validated + sanitized
   - Types: UUID format, date formats, enum values
   - Size limits: file uploads (50MB), request body (10MB)
   - Null/empty checks

4. [ ] Credential management
   - No secrets in code: all env variables
   - .env.example: template without values
   - Environment: staging uses different credentials than prod
   - Rotation: API keys rotatable without downtime

5. [ ] Encryption & hashing
   - Passwords: bcrypt 12 rounds
   - Tokens: SHA-256 hashed in DB
   - Ed25519: keypairs generated securely
   - File hashes: SHA-256 for tampering detection
   - TLS: 1.2+ only, strong ciphers

6. [ ] Dependency security
   - npm audit: zero critical vulnerabilities
   - npm outdated: review for security updates
   - Pinned versions: lock files committed
   - Regular updates: monthly security patches

7. [ ] Penetration testing scenarios
   - SQL injection: ' OR '1'='1 - should be blocked
   - XSS: <script>alert('xss')</script> - should be escaped
   - CSRF: POST without CSRF token - should fail
   - Privilege escalation: user A trying to delete user B's boat - should fail
   - Data exfiltration: user A querying user B's organization - should fail

Acceptance Criteria:
✅ Zero OWASP Top 10 vulnerabilities found
✅ Rate limiting enforced (test by exceeding)
✅ CORS properly configured
✅ All secrets in environment variables (not code)
✅ SQL injection tests pass (parameterized queries)
✅ XSS tests pass (output encoding)
✅ CSRF tests pass (token validation)
✅ Privilege escalation tests fail (as intended)
✅ Data isolation tests pass (can't access other org's data)
✅ npm audit: zero critical vulnerabilities
✅ TLS 1.2+ enforced
```

#### Day 19 (Thursday): Comprehensive Testing & Documentation
**Deliverable:** 100% API test coverage + deployment docs

```javascript
// tests/e2e.test.js (comprehensive end-to-end)
// docs/API.md (API reference)
// docs/DEPLOYMENT.md (deployment guide)
// docs/SECURITY.md (security architecture)

Work Tasks:
1. [ ] E2E workflow tests
   - Workflow 1: Owner creates boat → adds inventory → logs maintenance → sets calendar → schedules work
   - Workflow 2: Captain logs maintenance → system generates reminder → sends WhatsApp alert → owner approves → updates calendar
   - Workflow 3: Owner uploads receipt → OCR extracts → creates inventory → appears in search
   - Workflow 4: Camera detects motion → creates snapshot → alerts owner → owner sees in calendar
   - Workflow 5: Captain logs expense → owner reviews → approves → included in budget report

   Each workflow: verify all data persisted, all notifications sent, all indexes updated, permissions enforced

2. [ ] Performance benchmarks
   - Baseline: document upload <5sec
   - Baseline: inventory list (500 items) <200ms
   - Baseline: search (10K items) <200ms
   - Baseline: calendar month view (100 events) <200ms
   - Baseline: maintenance reminder generation (1000 boats) <5min

3. [ ] Database schema documentation
   - Database diagram: 29 tables + relationships
   - Each table documented: fields, indexes, foreign keys
   - SQL scripts: migration order, rollback procedure
   - Backup/restore: procedures documented

4. [ ] API documentation
   - Each endpoint: method, path, auth required, request/response examples
   - Error codes: what each error means, how to fix
   - Rate limits: documented
   - Deprecation warnings: if any
   - Example curl commands for all endpoints

5. [ ] Deployment guide
   - Prerequisites: Node.js, PostgreSQL, Redis, Meilisearch versions
   - Configuration: .env template with explanations
   - Database setup: migration scripts in order
   - Service startup: systemd unit files
   - Health checks: endpoints to monitor
   - Troubleshooting: common issues + fixes

6. [ ] Architecture documentation
   - Tech stack overview
   - Data flow diagrams
   - Integration points (which modules call which)
   - Scaling considerations
   - Backup/disaster recovery

Acceptance Criteria:
✅ E2E tests pass for all 5 workflows
✅ Performance baselines met (all <target latencies)
✅ Database schema fully documented
✅ API documentation complete (all 50+ endpoints)
✅ Deployment guide tested (can spin up new environment)
✅ Architecture documented
✅ Zero ambiguity: any new team member can deploy
```

#### Day 20 (Friday): Final Integration & Production Readiness
**Deliverable:** All 11 features fully integrated + ready for Session 3 UX

```javascript
// scripts/pre-deployment-checklist.js (NEW)
// tests/smoke.test.js (production readiness)

Work Tasks:
1. [ ] Final integration verification
   - All 11 feature modules working together
   - No race conditions or deadlocks
   - No memory leaks under load
   - No missing error handling

2. [ ] Cross-module data consistency
   - Inventory item created → searchable immediately
   - Maintenance logged → calendar event created, reminder generated, notification sent
   - Expense logged → expense summary updates, budget tracked
   - Contact added → available in maintenance suggestions
   - Camera snapshot → could be analyzed for CV (placeholder OK)
   - VAT status changes → compliance alerts generated

3. [ ] Smoke tests (quick deployment verification)
   - User can login
   - Can upload document
   - Can log inventory item
   - Can log maintenance
   - Can view calendar
   - Can search documents
   - Can message via WhatsApp

4. [ ] Performance under production load
   - Simulate 100 concurrent users (login, search, upload)
   - Simulate 10,000 inventory items
   - Simulate 1,000,000 maintenance records (archived data)
   - Measure: latency, CPU, memory, DB connections
   - All metrics within targets

5. [ ] Monitoring setup
   - Logging: all requests logged (JSON format)
   - Metrics: request latency, error rate, DB query time
   - Alerts: email/SMS if error rate >1%, latency >1sec, DB slow
   - Dashboard: Grafana or similar for visibility

6. [ ] Rollback plan
   - If deployment fails: revert to previous commit
   - If database migration fails: rollback scripts tested
   - If service fails: manual intervention procedures documented
   - Post-incident: postmortem procedures defined

7. [ ] Sign-off checklist
   - [ ] All tests passing (100+ tests)
   - [ ] Code review: all PRs approved
   - [ ] Security audit: zero vulnerabilities
   - [ ] Performance verified: all targets met
   - [ ] Documentation: API + deployment complete
   - [ ] Deployment procedures tested
   - [ ] Rollback procedures tested
   - [ ] Monitoring configured
   - [ ] Team trained on new features
   - [ ] Ready for Session 3 UX integration

Acceptance Criteria:
✅ All 50+ API endpoints tested
✅ All 11 features integrated + tested together
✅ 100+ integration tests passing
✅ Zero OWASP vulnerabilities
✅ Performance targets met (all latencies <target)
✅ Load test: 100 concurrent users handled
✅ Monitoring configured
✅ Rollback procedures tested
✅ API documentation complete
✅ Deployment guide complete
✅ Team ready for handoff to Session 3
```

### Week 4 Deliverables
```
✅ Meilisearch 5-index full-text search
✅ WhatsApp Business API + Claude AI agent
✅ Command parsing (@NaviDocs actions)
✅ Proactive alert scheduling
✅ Security hardening (OWASP Top 10)
✅ 100+ comprehensive tests
✅ Performance benchmarks verified
✅ API documentation complete
✅ Deployment guide tested
✅ All 11 features integrated + ready for UI
```

---

## Critical Path Dependencies

```
Week 1 Foundation blocks everything
  ├─ Database schema → all other tables
  ├─ Authentication → permission checks
  └─ Document versioning → IF.TTT compliance

Week 2 Core features can start in parallel
  ├─ Inventory (S2-H02) → Maintenance suggestions
  ├─ Maintenance (S2-H03) → Calendar + Reminders
  ├─ Expenses (S2-H06) → VAT tracking + Budget reports
  └─ All three integrate with Search

Week 3 Advanced features depend on Week 2
  ├─ Cameras (S2-H04) → needs snapshot storage, OK if CV deferred
  ├─ Contacts (S2-H05) → can start parallel to Week 2
  ├─ Calendar (S2-H07A) → needs Maintenance + Inventory data
  └─ All three integrate with Notifications

Week 4 Polish + Integration
  ├─ Search (S2-H07) → needs all data indexed from Week 1-3
  ├─ WhatsApp (S2-H08) → needs all CRUD APIs functional
  └─ Testing → all code must exist to test
```

---

## Success Metrics

### End of Week 1
- ✅ PostgreSQL database operational, zero data loss
- ✅ 10 core API endpoints tested
- ✅ Document versioning + IF.TTT infrastructure ready

### End of Week 2
- ✅ Inventory, Maintenance, Expense APIs fully functional
- ✅ 25+ API endpoints tested
- ✅ Meilisearch indexes populated for all 3 features
- ✅ Multi-user reimbursement workflow verified

### End of Week 3
- ✅ Home Assistant webhooks receiving events
- ✅ 40+ API endpoints tested
- ✅ Multi-calendar system with conflict detection
- ✅ Contact directory with quick actions
- ✅ Real-time notifications via WebSocket

### End of Week 4 (Final)
- ✅ 50+ API endpoints fully tested
- ✅ All 11 features integrated + verified
- ✅ Full-text search across 5 indexes
- ✅ WhatsApp AI agent operational
- ✅ Security hardening complete (OWASP Top 10)
- ✅ Performance targets met
- ✅ 100+ comprehensive tests passing
- ✅ API + deployment documentation complete
- ✅ Ready for Session 3 UX design

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| PostgreSQL migration fails | Medium | Critical | Test rollback on Day 2, keep SQLite backup |
| OCR accuracy <80% | Medium | High | Use both Tesseract + Google Vision, manual review option |
| WhatsApp API quality review fails | Low | Medium | Submit early (Day 1), have backup notification channel |
| HA integration too slow (RTSP) | Medium | Medium | Cache snapshots, don't stream live initially |
| Search indexes slow on 10K docs | Low | Medium | Pre-size Meilisearch, benchmark Day 16 |
| Scope creep (Session 1 pain points keep expanding) | High | High | **Lock feature scope by Friday Week 1**, defer extras to Session 5 |

---

## Token Budget

**Estimated Session 2 Build:**
- Week 1 (Foundation): ~40,000 tokens
- Week 2 (Core features): ~60,000 tokens
- Week 3 (Advanced): ~40,000 tokens
- Week 4 (Integration): ~30,000 tokens
- **Total: ~170,000 tokens**

**Budget:** $100 (250K Haiku allowance if 3-4 engineers, could use Sonnet for architecture decisions)
**Efficiency:** Aim for 70% Haiku delegation, 30% Sonnet (strategic)

---

**END OF SPRINT PLAN**

