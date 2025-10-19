# NaviDocs Master Roadmap

**Last Updated:** 2025-10-19
**Vision:** Professional marine documentation platform from single boat owners to yacht management fleets
**Strategy:** Plan ahead for multi-tenant, deploy single-boat now, iterate based on real usage

---

## Table of Contents

1. [Current Status](#current-status)
2. [v1.0 MVP - Single Boat Owner](#v10-mvp---single-boat-owner)
3. [v1.1 Yacht Management - Multi-Tenant](#v11-yacht-management---multi-tenant)
4. [v1.2 Equipment & Warranty Intelligence](#v12-equipment--warranty-intelligence)
5. [v1.3 Operational Efficiency](#v13-operational-efficiency)
6. [v1.4 Compliance & Audit Trail](#v14-compliance--audit-trail)
7. [Future Verticals](#future-verticals)
8. [Multi-Tenant Architecture Strategy](#multi-tenant-architecture-strategy)

---

## Current Status

**Date:** 2025-10-19
**Phase:** v1.0 MVP Development (65% complete)
**Port Migration:** ✅ Complete (8001/8080, avoiding 3000-5500 conflicts)
**Next Milestone:** Single boat demo working end-to-end

### What's Working ✅

- **Database:** 13 tables, fully initialized, production schema
- **Backend API:** Express server on port 8001, core routes implemented
- **OCR Pipeline:** 3 engines (Tesseract 85%, Google Drive, Google Vision)
- **Background Jobs:** BullMQ + Redis working
- **Upload Endpoint:** PDF upload → OCR → database pipeline functional
- **Search:** Meilisearch configured (auth issue ongoing, non-blocking)
- **Documentation:** 25+ docs, comprehensive handover package
- **Git:** 21+ commits, all code in Gitea

### What's Pending ⏳

- **Frontend:** Vue UI incomplete (20% done)
- **Authentication:** JWT infrastructure ready, not implemented
- **Meilisearch Auth:** API key mismatch (15 min fix)
- **Tests:** No E2E tests yet
- **Deployment:** Ready for StackCP or VPS, not deployed

### Known Issues ⚠️

1. **Meilisearch Auth** - API key mismatch blocks search indexing (non-blocking)
2. **Frontend Incomplete** - No web UI, API works via curl
3. **No Authentication** - Open endpoints (dev only, security risk for production)
4. **Port Conflicts Fixed** - Migrated to 8001/8080 to avoid FastFile/frank-ai conflicts

---

## v1.0 MVP - Single Boat Owner

**Target:** Individual boat owner managing their own manuals
**Timeline:** 2-4 weeks from today
**Status:** 65% complete

### Features (MVP Scope)

- [ ] **Upload PDFs** - Drag and drop boat manuals
- [ ] **OCR Processing** - Automatic text extraction
- [ ] **Intelligent Search** - Meilisearch with boat terminology synonyms
- [ ] **Offline-First PWA** - Works without cell signal
- [ ] **Document Viewer** - PDF.js integration
- [ ] **Basic Auth** - JWT login/register

### Technical Requirements

**Backend:**
- ✅ Node.js 20 + Express 5
- ✅ SQLite (better-sqlite3 with WAL mode)
- ✅ Meilisearch v1.11.3
- ✅ BullMQ (Redis job queue)
- ✅ Tesseract OCR (working at 85% confidence)
- ⏳ Helmet security headers
- ⏳ Rate limiting

**Frontend:**
- ⏳ Vue 3 + Vite
- ⏳ Tailwind CSS
- ⏳ PDF.js document viewer
- ⏳ Meilisearch-inspired design

**Database Schema (Single-Tenant Ready):**
```sql
users (id, email, name, password_hash, created_at)
organizations (id, name, type, created_at)
user_organizations (user_id, organization_id, role)
entities (id, org_id, type, name, make, model, year)  -- boats
sub_entities (id, entity_id, type, name)  -- decks, compartments
components (id, sub_entity_id, name, system)  -- equipment
documents (id, org_id, entity_id, title, category)
document_pages (id, document_id, page_number, text, confidence)
ocr_jobs (id, document_id, status, progress, result)
permissions (id, resource_type, resource_id, user_id, permission)
document_shares (id, document_id, shared_with, expires_at)
bookmarks (id, user_id, document_id, page_number, note)
```

**Note:** Schema already supports multi-tenant (org_id foreign keys), deploying for single user first.

### Success Criteria

- [ ] Upload PDF → searchable in < 5 minutes
- [ ] Search latency < 100ms
- [ ] Synonym search works ("bilge" finds "sump pump")
- [ ] Offline mode functional (PWA)
- [ ] Mobile responsive
- [ ] 5-10 beta users successfully using it

### Deployment Options

**Option A: StackCP** ($0 additional cost)
- Use existing shared hosting
- Redis Cloud (free 30MB)
- Google Cloud Vision API (free 1K pages/month)
- Deploy code to `/tmp/navidocs/`, data to `~/navidocs/`

**Option B: VPS** ($6/month)
- DigitalOcean/Linode droplet
- Full control, no restrictions
- Recommended for >5K docs/month

---

## v1.1 Yacht Management - Multi-Tenant

**Target:** Yacht management companies (like Zen Yacht Management)
**Timeline:** Q1 2026 (3-4 months from v1.0 launch)
**Business Model:** $49-149/month based on fleet size

### Use Case: Zen Yacht Management

**Profile:**
- Manages 6 yachts for absent owners
- Part-time captain + day workers + hourly cleaners
- Need time tracking, proof of work, warranty management
- Current pain: Manual invoicing, lost warranties, billing disputes

### Core Features (Phase 1 - Trust & Transparency)

- [ ] **Mobile Time Clock** (GPS-verified clock in/out)
  - Captain, day workers, cleaners log hours from phone
  - GPS location verification (prevent time theft)
  - Photo requirement before clock-out (proof of work)
  - Real-time hour approval workflow

- [ ] **Photo-Required Work Logs**
  - Before/after photo pairs (prove cleaning was done)
  - Timestamped + GPS-tagged
  - Linked to specific boat + task
  - Owner dashboard shows work in real-time

- [ ] **Boat-Specific Checklists**
  - Captain creates custom checklists per boat
  - Cleaners can't complete job without checking all items
  - Photo requirement per checklist item
  - Prevents "forgot to clean aft deck cushions" situations

- [ ] **Real-Time Owner Dashboard**
  - Owners see logged work as it happens
  - Timestamped photos, GPS locations
  - Transparency = trust = higher billing rates

- [ ] **Automated Invoice Generation**
  - Time logs → invoice line items automatically
  - Each charge links to work log + photos
  - Reduces billing disputes by 70-80%
  - Saves 10+ hours/month in admin reconciliation

### Database Schema Additions (v1.1)

```sql
-- Time tracking
time_logs (
  id, worker_id, boat_id,
  clock_in, clock_out,
  gps_lat, gps_lon,
  work_category, -- 'cleaning', 'maintenance', 'coordination', 'waiting'
  photos[], notes,
  approved_by, approved_at
)

-- Tasks
tasks (
  id, boat_id, assigned_to, created_by,
  title, description,
  due_date, priority, status,
  completion_photos[], completed_at
)

-- Multi-tenant support
-- Already in v1.0 schema via organizations table
-- No breaking changes needed!
```

### Multi-Tenant Strategy

**Database Design:**
- ✅ Schema already multi-tenant ready (org_id on all tables)
- Row-level security via org_id filters
- Each organization = one yacht management company
- Each entity = one boat under management

**Query Pattern:**
```javascript
// v1.0 (single boat)
const docs = db.prepare('SELECT * FROM documents WHERE entity_id = ?').all(boatId);

// v1.1 (multi-tenant safe)
const docs = db.prepare('SELECT * FROM documents WHERE org_id = ? AND entity_id = ?').all(orgId, boatId);
```

**Migration Plan:**
1. v1.0: Deploy with org_id columns (unused but present)
2. v1.1: Add org_id to all queries (no schema migration needed)
3. Existing single-boat users get auto-migrated to personal org

### Pricing Tiers (v1.1)

| Tier | Price | Boats | Features |
|------|-------|-------|----------|
| **Single Owner** | $0/mo | 1 | Document storage + OCR (existing v1.0) |
| **Management Starter** | $49/mo | 1-3 | Time tracking, photo logs, basic warranty DB |
| **Management Pro** | $149/mo | 4-10 | All Starter + automated invoicing, client portals |
| **Fleet Enterprise** | $499/mo | Unlimited | All Pro + API access, white-label branding |

**Revenue Projection Year 1:** $89,400 ARR (50 companies @ $149/mo avg)

### Success Metrics

- **30-day active users:** 100 workers (captains, cleaners, day workers)
- **Time logs per week:** 500+ (avg 5 per worker)
- **Photo upload rate:** 90%+ compliance
- **Billing dispute reduction:** 70%+
- **Admin time saved:** 10+ hours/month per company

---

## v1.2 Equipment & Warranty Intelligence

**Target:** Prevent unnecessary equipment purchases, recover warranty claims
**Timeline:** Q2 2026 (3 months from v1.1 launch)
**ROI:** Save $5,000-10,000/year per company in warranty recoveries

### Features

- [ ] **Equipment Database**
  - Make, model, serial number per boat
  - Purchase date, warranty end date
  - Vendor contact info, past service quotes
  - Searchable: "Show all batteries across fleet"

- [ ] **Warranty OCR Upload**
  - Snap photo of receipt → auto-extract:
    - Purchase date
    - Warranty period
    - Serial number
    - Price paid
  - Store in searchable database

- [ ] **Warranty Expiration Alerts**
  - "Battery warranty expires in 30 days"
  - Email captain + owner
  - Prevent "oops, warranty expired yesterday" situations

- [ ] **Service History per Equipment**
  - "Impeller last replaced 2023-04-15"
  - Link to work log + photos
  - Predict next service date

- [ ] **Vendor Contact Database**
  - Linked to equipment
  - Past quotes stored
  - "Who did the HVAC repair last year?"

### Database Schema (v1.2)

```sql
equipment (
  id, boat_id, equipment_type,
  make, model, serial_number,
  purchase_date, warranty_end_date,
  vendor_id, receipt_document_id,
  service_interval_days, last_service_date
)

vendors (
  id, name, phone, email,
  service_categories[], notes
)
```

### Use Cases

**Scenario 1: Battery Dies**
- Captain: "Battery is dead, needs replacement ($2,400)"
- System: "Battery purchased 2024-03-15, warranty until 2027-03-15"
- Action: File warranty claim instead of buying new
- **Saved:** $2,400

**Scenario 2: HVAC Repair**
- Captain: "HVAC broken, need vendor"
- System: "Last serviced by ABC Marine, 2023-06-12, $450, contact: 555-1234"
- Action: Call same vendor, reference past work
- **Saved:** 2 hours of research time

---

## v1.3 Operational Efficiency

**Target:** Reduce coordination overhead, improve worker handoffs
**Timeline:** Q3 2026 (3 months from v1.2 launch)

### Features

- [ ] **Task Assignment System**
  - Management assigns task to captain/worker
  - Task includes context: "Replace impeller, last replaced 2023-04-15, part# XYZ"
  - Push notification to worker's phone

- [ ] **Context-Rich Task Cards**
  - "Check bilge pump - owner reported alarm 2024-10-18"
  - Link to equipment history, past service logs
  - Worker arrives informed, not confused

- [ ] **Handoff Notes**
  - Captain → day worker notes visible in app
  - "I already diagnosed the issue, it's the fuel pump relay"
  - Prevents duplicate work

- [ ] **Voice-to-Text Work Logs**
  - Dictate notes while working (hands covered in oil)
  - App transcribes, auto-saves
  - Saves 80% of captain's documentation time

- [ ] **Waiting Time Tracking**
  - Cleaner: "Waiting for access" (separate clock-in category)
  - Billable time, prevents disputes
  - "I arrived at 9 AM, captain didn't unlock until 10:15 AM"

### Database Schema (v1.3)

```sql
-- Tasks table already in v1.1
-- Add voice_note_url to time_logs
ALTER TABLE time_logs ADD COLUMN voice_note_url TEXT;
ALTER TABLE time_logs ADD COLUMN waiting_category TEXT; -- NULL or 'waiting_access'
```

---

## v1.4 Compliance & Audit Trail

**Target:** Liability protection, tax compliance, insurance requirements
**Timeline:** Q4 2026 (3 months from v1.3 launch)

### Features

- [ ] **Tamper-Proof Audit Logs**
  - Blockchain-style timestamping
  - Can't modify past work logs (prevents fraud)
  - Lawyers can verify authenticity

- [ ] **Safety Equipment Tracking**
  - "Life raft service due 2025-06-01"
  - Insurance requirement compliance
  - Prevent lawsuits: "You didn't maintain safety equipment"

- [ ] **Insurance Documentation Vault**
  - Policy docs, claims history
  - Linked to boats, equipment
  - Searchable: "Show proof of insurance for engine fire"

- [ ] **Tax-Ready Reports**
  - Labor by boat, by month, exportable CSV
  - IRS audit-ready documentation
  - CPA loves you

- [ ] **Client Expense Allocation**
  - Track costs per owner, per boat
  - Automated billing allocation
  - "Owner A's 3 boats cost $X, Owner B's 2 boats cost $Y"

### Database Schema (v1.4)

```sql
audit_logs (
  id, event_type, resource_type, resource_id,
  user_id, timestamp, changes_json,
  blockchain_hash, previous_hash
)

safety_equipment (
  id, boat_id, equipment_type,
  last_service_date, next_service_due,
  certification_document_id, compliant BOOLEAN
)

insurance_policies (
  id, boat_id, policy_number, provider,
  coverage_type, start_date, end_date,
  document_id
)
```

---

## Future Verticals

### Marina Management (v2.0 - 2027)

**Use Case:** Marina managing 200 slips, shared equipment, compliance

**Features:**
- Slip assignment tracking
- Common area maintenance logs
- Electrical/water meter readings per slip
- Tenant communication portal
- Compliance tracking (fire extinguishers, dock inspections)

### Property Management (v2.5 - 2027)

**Use Case:** Waterfront HOA managing community docs

**Features:**
- Common area equipment manuals
- Contractor coordination
- Homeowner access to shared docs
- Compliance tracking (pool chem logs, elevator certs)

### Commercial Fleet (v3.0 - 2028)

**Use Case:** Charter company managing 20+ boats, 100+ crew

**Features:**
- Crew certifications tracking
- Pre-departure checklists
- Incident reporting
- Coast Guard compliance
- Multi-vessel scheduling

---

## Multi-Tenant Architecture Strategy

### Principle: Plan Ahead, Deploy for Now

**Design Philosophy:**
1. **v1.0 Schema:** Already multi-tenant ready (org_id on all tables)
2. **v1.0 Queries:** Single-tenant (simple, fast)
3. **v1.1 Migration:** Add org_id filters to queries (no schema change!)
4. **Zero Breaking Changes:** Existing single-boat users auto-migrate to personal org

### Query Evolution

**v1.0 (Single Boat):**
```javascript
// Simple, no org filtering
const docs = db.prepare('SELECT * FROM documents WHERE entity_id = ?').all(boatId);
```

**v1.1 (Multi-Tenant):**
```javascript
// Add org_id filter (schema unchanged!)
const docs = db.prepare(`
  SELECT * FROM documents
  WHERE org_id = ? AND entity_id = ?
`).all(orgId, boatId);
```

**Migration Script (v1.0 → v1.1):**
```javascript
// Auto-create personal org for existing single-boat users
db.transaction(() => {
  const users = db.prepare('SELECT id FROM users').all();

  users.forEach(user => {
    // Create personal org
    const orgId = uuidv4();
    db.prepare('INSERT INTO organizations (id, name, type) VALUES (?, ?, ?)').run(
      orgId, `${user.name}'s Boats`, 'personal'
    );

    // Link user to org
    db.prepare('INSERT INTO user_organizations (user_id, org_id, role) VALUES (?, ?, ?)').run(
      user.id, orgId, 'owner'
    );

    // Update all user's entities with org_id
    db.prepare('UPDATE entities SET org_id = ? WHERE user_id = ?').run(orgId, user.id);
    db.prepare('UPDATE documents SET org_id = ? WHERE user_id = ?').run(orgId, user.id);
  });
})();
```

### Security Model

**Row-Level Security:**
```javascript
// Middleware: Inject org_id into all queries
app.use((req, res, next) => {
  // Get user's org from JWT token
  const orgId = req.user.organizationId;

  // Attach to request
  req.orgId = orgId;

  next();
});

// All queries use req.orgId
app.get('/api/documents', (req, res) => {
  const docs = db.prepare(`
    SELECT * FROM documents
    WHERE org_id = ?
  `).all(req.orgId);  // Auto-filtered by org

  res.json(docs);
});
```

### Performance Considerations

**Indexes (v1.0):**
```sql
CREATE INDEX idx_documents_entity_id ON documents(entity_id);
CREATE INDEX idx_document_pages_document_id ON document_pages(document_id);
```

**Indexes (v1.1 - Multi-Tenant):**
```sql
-- Composite indexes for multi-tenant queries
CREATE INDEX idx_documents_org_entity ON documents(org_id, entity_id);
CREATE INDEX idx_time_logs_org_boat ON time_logs(org_id, boat_id);
CREATE INDEX idx_equipment_org_boat ON equipment(org_id, boat_id);
```

### Data Isolation Guarantees

**Defense in Depth:**
1. **Application Layer:** org_id filters on all queries
2. **Database Layer:** Foreign keys enforce referential integrity
3. **API Layer:** JWT tokens contain org_id, can't be spoofed
4. **Audit Layer:** All cross-org access attempts logged

**Test Coverage:**
```javascript
// v1.1 Security Test Suite
describe('Multi-Tenant Isolation', () => {
  it('User from Org A cannot see Org B documents', async () => {
    const orgA_user = { id: 'user1', orgId: 'orgA' };
    const orgB_doc = { id: 'doc1', orgId: 'orgB' };

    const result = await api.get('/api/documents/doc1', { user: orgA_user });

    expect(result.status).toBe(403); // Forbidden
  });
});
```

---

## Development Workflow

### Plan Ahead, Deploy for Now

**Phase:** v1.0 MVP Development
**Current Status:** 65% complete

**Immediate Next Steps (This Week):**

1. **Fix Meilisearch Auth** (15 minutes)
   - Restart Meilisearch with known key
   - Update .env
   - Verify search indexing works

2. **Complete Frontend MVP** (1-2 days)
   - Upload component (Vue)
   - Search interface
   - Document viewer (PDF.js)
   - Basic layout (Tailwind)

3. **Add JWT Authentication** (1 day)
   - Register/login endpoints
   - Password hashing (bcrypt)
   - JWT token generation
   - Protected routes middleware

4. **End-to-End Testing** (1 day)
   - Upload flow test
   - Search flow test
   - Auth flow test
   - Fix any bugs found

5. **Deploy to StackCP or VPS** (4 hours)
   - Choose deployment platform
   - Follow deployment guide
   - Test production environment
   - Set up monitoring

**Development Cycle:**
```
Plan Ahead → Deploy for Now → Debug → Develop → Debug → Deploy → Proof → Analysis → Debug → Deploy
```

**Weekly Sprint:**
- Monday: Plan week's features (based on roadmap)
- Tuesday-Thursday: Develop + debug
- Friday: Deploy to staging, test
- Weekend: Deploy to production if tests pass

**Monthly Review:**
- Review roadmap progress
- Gather user feedback
- Adjust priorities
- Plan next month's sprint

---

## Success Metrics by Version

### v1.0 MVP
- 10+ real boat manuals uploaded
- 100+ successful searches
- 5-10 beta users active
- Zero critical bugs
- Uptime > 99%

### v1.1 Yacht Management
- 50 management companies signed up
- 300 boats under management
- $89K ARR
- 10% churn rate
- 4.5★ app rating

### v1.2 Warranty Intelligence
- $5K-10K/year saved per company (warranty recoveries)
- 80% of equipment has warranty info
- Zero "lost warranty" incidents

### v1.3 Operational Efficiency
- 15% reduction in wasted time
- 90%+ worker satisfaction
- 50% reduction in coordination phone calls

### v1.4 Compliance
- Zero lawsuits (liability protection)
- 100% insurance compliance
- Tax audits passed with zero issues

---

## Budget & Timeline

### v1.0 MVP
- **Timeline:** 2-4 weeks from today
- **Cost:** $0 (StackCP) or $6/mo (VPS)
- **Dev Time:** 40-60 hours

### v1.1 Yacht Management
- **Timeline:** Q1 2026 (3-4 months)
- **Cost:** Same infrastructure
- **Dev Time:** 120-160 hours
- **Revenue:** $89K ARR potential

### v1.2-v1.4
- **Timeline:** 9 months (Q2-Q4 2026)
- **Dev Time:** 200-300 hours total
- **Revenue Growth:** 2x-3x (equipment tracking sticky, high value)

---

## Risk Mitigation

### Technical Risks

**Risk:** SQLite can't handle multi-tenant scale
**Likelihood:** Low (SQLite handles millions of rows fine)
**Mitigation:** Design allows migration to PostgreSQL with zero query changes (just swap db.prepare → pg.query)

**Risk:** Meilisearch costs explode at scale
**Likelihood:** Medium
**Mitigation:** Meilisearch Cloud has predictable pricing, can self-host on VPS

**Risk:** Photo storage costs explode
**Likelihood:** Medium
**Mitigation:** Aggressive compression (10MB → 500KB), auto-delete after 2 years, charge overage

### Business Risks

**Risk:** Captains resist new software
**Likelihood:** High (marine industry tech-averse)
**Mitigation:** Stupid-simple mobile app (3 taps), voice-to-text, phone training

**Risk:** Yacht management companies don't see value
**Likelihood:** Low (billing disputes are huge pain point)
**Mitigation:** Free trial, ROI calculator showing time saved

---

## Gitea Repository

**Repository URL:** `http://localhost:4000/ggq-admin/navidocs`

**Roadmap Files:**
- Master Roadmap (this file): `/docs/roadmap/MASTER_ROADMAP.md`
- v1.0 MVP Details: `/docs/roadmap/v1.0-mvp.md`
- 2-Week Launch Plan: `/docs/roadmap/2-week-launch-plan.md`
- Yacht Management Debate: `/docs/debates/02-yacht-management-features.md`

**Note:** Gitea web UI shows 404 due to database registration issue, but Git operations work perfectly. To view files:

```bash
# Clone repository
git clone http://localhost:4000/ggq-admin/navidocs.git

# Or browse locally
cd /home/setup/navidocs/docs/roadmap/
cat MASTER_ROADMAP.md
```

---

## Next Actions (Immediate)

**This Week:**
1. [ ] Fix Meilisearch auth (15 min)
2. [ ] Complete frontend MVP (1-2 days)
3. [ ] Add authentication (1 day)
4. [ ] End-to-end testing (1 day)
5. [ ] Deploy to staging (4 hours)

**This Month:**
1. [ ] 5-10 beta users testing single boat demo
2. [ ] Gather feedback on yacht management features
3. [ ] Validate pricing with potential customers
4. [ ] Plan v1.1 sprint schedule

**This Quarter:**
1. [ ] v1.0 MVP launched and stable
2. [ ] Begin v1.1 development
3. [ ] Sign first 5 yacht management customers
4. [ ] Build mobile app prototype

---

**Vision:** From single boat owners to professional yacht management fleets, NaviDocs is the marine industry's documentation platform.

**Strategy:** Plan ahead for scale, deploy for now with single users, iterate based on real feedback.

**Status:** 65% to v1.0 MVP launch, roadmap clear through v1.4 (2026)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Maintained By:** Development Team
**Review Schedule:** Monthly
