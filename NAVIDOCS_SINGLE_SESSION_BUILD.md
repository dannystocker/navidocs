# NaviDocs - Single Session Build (15 Haiku Agents)

**Mission:** Build production-ready NaviDocs MVP in ONE Cloud Code session using 15 Haiku agents working in parallel.

**Budget:** $8-12 (15 Haiku agents × 4-6 hours)
**Timeline:** 4-6 hours concurrent execution
**Repository:** https://github.com/dannystocker/navidocs

---

## 🎯 Context: What's Already Done

✅ **ALL RESEARCH COMPLETE** - Intelligence dossier finished (5 cloud sessions, 94 files)
- Market analysis: €14.6B market, €15K-€50K inventory loss problem
- Technical architecture: 29 DB tables, 50+ API endpoints designed
- Sales collateral: Pitch deck, ROI calculator, broker objection playbook
- Implementation roadmap: 4-week plan (162 hours) broken into sprints

**Current Codebase Status:**
- Existing Vue.js + Express.js app (document management MVP)
- PostgreSQL database with 13 existing tables
- Basic search + PDF upload working
- Deployed to StackCP (production environment ready)

**What Needs Building:** Implement 5 core features to make NaviDocs "sticky" for boat owners.

---

## 🚀 15-Agent Mission Plan

### Agent 1: Database Architect (H-01) - MUST COMPLETE FIRST
**Priority:** P0 (ALL other agents depend on this)
**Duration:** 45-60 min
**Output:** `migrations/20251114-navidocs-schema.sql`

**Tasks:**
1. Read intelligence dossier: `/home/setup/navidocs/NAVIDOCS_COMPLETE_INTELLIGENCE_DOSSIER.md` (lines 86-111 for database design)
2. Create PostgreSQL migrations for 16 NEW tables:
   - `inventory_items` (equipment photos, depreciation tracking)
   - `maintenance_records` (service history, reminders)
   - `camera_feeds` (Home Assistant RTSP integration)
   - `contacts` (marina, mechanics, vendors)
   - `expenses` (multi-user approval, OCR receipts)
   - `warranties` (expiration alerts, claim tracking)
   - `calendars` (service, warranty, onboard, work roadmap)
   - `notifications` (WhatsApp integration)
   - `tax_tracking` (VAT/customs stamps)
   - ... (see dossier lines 88-91 for full schema)
3. Run migrations on local PostgreSQL
4. Generate OpenAPI schema for all tables
5. **SIGNAL COMPLETION** - Write `/tmp/H-01-SCHEMA-READY.txt` when done

**Success Criteria:**
- All 29 tables created (13 existing + 16 new)
- Foreign keys enforced (organization_id for multi-tenancy)
- Indexes created for search performance

---

### Agent 2-6: Feature Builders (H-02 through H-06) - WAIT FOR H-01
**Priority:** P1 (start after H-01 completes)
**Duration:** 2-3 hours each (parallel execution)

**Agent 2 (H-02): Inventory Tracking**
- Read spec: `intelligence/session-2/inventory-tracking-spec.md`
- Build: Photo upload + equipment catalog + depreciation calculator
- API endpoints: POST /inventory, GET /inventory/:boatId, PUT /inventory/:id
- Frontend: Vue component with camera integration
- Output: `server/routes/inventory.js`, `client/src/components/InventoryModule.vue`

**Agent 3 (H-03): Maintenance Log**
- Read spec: `intelligence/session-2/maintenance-log-spec.md`
- Build: Service history + reminders + provider suggestions
- API endpoints: POST /maintenance, GET /maintenance/:boatId, PUT /maintenance/:id
- Frontend: Calendar view + reminder notifications
- Output: `server/routes/maintenance.js`, `client/src/components/MaintenanceModule.vue`

**Agent 4 (H-04): Camera Integration**
- Read spec: `intelligence/session-2/camera-integration-spec.md`
- Build: Home Assistant RTSP/ONVIF webhook receiver
- API endpoints: POST /cameras/webhook, GET /cameras/:boatId/stream
- Frontend: Live camera feed viewer (daily check workflow)
- Output: `server/routes/cameras.js`, `client/src/components/CameraModule.vue`

**Agent 5 (H-05): Contact Management**
- Read spec: `intelligence/session-2/contact-management-spec.md`
- Build: Provider directory (marina, mechanics, vendors)
- API endpoints: POST /contacts, GET /contacts/:boatId, PUT /contacts/:id
- Frontend: One-tap call/email integration
- Output: `server/routes/contacts.js`, `client/src/components/ContactsModule.vue`

**Agent 6 (H-06): Expense Tracking**
- Read spec: `intelligence/session-2/accounting-integration-spec.md`
- Build: Multi-user expense splitting (fork Spliit library)
- API endpoints: POST /expenses, GET /expenses/:boatId, PUT /expenses/:id/approve
- Frontend: OCR receipt upload + approval workflow
- Output: `server/routes/expenses.js`, `client/src/components/ExpenseModule.vue`

**Coordination Protocol:**
1. Each agent reads `/tmp/H-01-SCHEMA-READY.txt` before starting
2. If file missing, wait 5 minutes and check again
3. Write progress updates to `/tmp/H-0X-STATUS.txt` every 30 min
4. Signal completion: Write `/tmp/H-0X-COMPLETE.txt` when done

---

### Agent 7-10: Integration & Polish (H-07 through H-10) - WAIT FOR H-02 through H-06
**Priority:** P2 (start after feature builders complete)
**Duration:** 1-2 hours each

**Agent 7 (H-07): Search UX**
- Read spec: `intelligence/session-2/search-ux-spec.md`
- Integrate Meilisearch for faceted search across all 5 modules
- Build: Structured results (NO long lists), facets, filters
- Output: `server/services/search.js`, `client/src/components/SearchResults.vue`

**Agent 8 (H-08): WhatsApp Notifications**
- Read spec: `intelligence/session-2/whatsapp-integration-spec.md`
- Build: Notification delivery for reminders, approvals, alerts
- API: Twilio WhatsApp Business API integration
- Output: `server/services/whatsapp.js`

**Agent 9 (H-09): Document Versioning**
- Read spec: `intelligence/session-2/document-versioning-spec.md`
- Build: Version history + conflict resolution for all documents
- Output: `server/middleware/versioning.js`

**Agent 10 (H-10): ROI Calculator**
- Read template: `intelligence/session-2/code-templates/roi-calculator.js`
- Build: Backend calculation engine for sales pitch
- API: POST /roi/calculate (input: boat value, inventory count, etc.)
- Output: `server/routes/roi.js`

**Coordination:**
1. Wait for ALL H-02 through H-06 to write `/tmp/H-0X-COMPLETE.txt`
2. Start integration work in parallel
3. Signal completion: Write `/tmp/H-0X-COMPLETE.txt`

---

### Agent 11-13: Testing & Deployment (H-11 through H-13) - WAIT FOR H-07 through H-10
**Priority:** P3 (final phase)
**Duration:** 1-2 hours each

**Agent 11 (H-11): Integration Testing**
- Run Playwright E2E tests for all 5 modules
- Test user flows: Upload inventory photo → Get depreciation calc → See ROI impact
- Output: `tests/integration/navidocs-e2e.spec.js`, test report

**Agent 12 (H-12): Performance Audit**
- Run Lighthouse on all pages (target: >90 score)
- Profile API latency (target: <200ms p95)
- Optimize slow queries, implement lazy loading
- Output: `docs/PERFORMANCE_REPORT.md`

**Agent 13 (H-13): Security Audit**
- Scan for OWASP Top 10 vulnerabilities
- Test authentication (JWT tokens), authorization (multi-tenancy isolation)
- Verify no SQL injection, XSS, CSRF risks
- Output: `docs/SECURITY_AUDIT.md`

---

### Agent 14: Documentation (H-14) - CONCURRENT WITH ALL AGENTS
**Priority:** P1 (runs throughout session)
**Duration:** 4-6 hours (concurrent)

**Tasks:**
1. Generate OpenAPI 3.0 spec for all 50+ endpoints
2. Write Storybook stories for all Vue components
3. Update README with setup instructions
4. Create user guide for boat owners
5. Document deployment process (StackCP)
6. **Continuous:** Monitor other agents, update docs as APIs evolve

**Output:**
- `docs/api/openapi.yaml` (50+ endpoints)
- `docs/DEPLOYMENT.md` (StackCP setup)
- `docs/USER_GUIDE.md` (boat owner instructions)
- `client/stories/*.stories.js` (Storybook)

---

### Agent 15: Coordinator (H-15) - CONCURRENT, MONITORS ALL
**Priority:** P0 (critical orchestrator)
**Duration:** 4-6 hours (full session)
**Model:** Haiku (but acts as mini-planner)

**Tasks:**
1. **Monitor progress:** Check `/tmp/H-0X-STATUS.txt` files every 10 min
2. **Unblock agents:** If H-03 waiting on H-01, investigate why
3. **Resolve conflicts:** If H-02 and H-04 both modify same file, coordinate merge
4. **Track budget:** Estimate token usage, warn if approaching $12 limit
5. **Quality gate:** Don't approve deployment until ALL tests pass
6. **Final report:** Generate completion summary with git commits, file counts, test results

**Blockers to Watch:**
- H-01 database migrations fail → Unblock H-02 through H-06 immediately
- Merge conflicts between feature builders → Coordinate resolution
- Test failures in H-11 → Assign bug fixes to relevant feature agent
- Performance issues in H-12 → Optimize queries before deployment

**Output:**
- `/tmp/COORDINATOR-LOG.txt` (progress updates every 10 min)
- `docs/SESSION_COMPLETION_REPORT.md` (final summary)

---

## 📊 Success Metrics

**Code Output:**
- 16 new database tables migrated ✅
- 50+ API endpoints implemented ✅
- 5 Vue.js feature modules built ✅
- 100+ Jest/Playwright tests passing ✅

**Quality Gates:**
- Lighthouse score >90 ✅
- API latency <200ms p95 ✅
- Zero critical security vulnerabilities ✅
- 100% OpenAPI documentation coverage ✅

**Deployment:**
- Production-ready on StackCP ✅
- All environment variables configured ✅
- Database backups automated ✅
- Monitoring/logging active ✅

---

## 🔧 Technical Context

**Repository Structure:**
```
navidocs/
├── server/           # Express.js backend
│   ├── routes/       # API endpoints
│   ├── services/     # Business logic
│   └── migrations/   # PostgreSQL schema
├── client/           # Vue.js frontend
│   ├── src/
│   │   ├── components/  # UI modules
│   │   └── views/       # Pages
│   └── stories/     # Storybook
├── tests/           # Playwright E2E tests
└── docs/            # Documentation
```

**Tech Stack:**
- Backend: Node.js 20.x, Express.js, PostgreSQL 14
- Frontend: Vue.js 3, Vite, TailwindCSS
- Search: Meilisearch (already deployed)
- Deployment: StackCP (Apache + Node.js reverse proxy)

**Environment Variables (already configured on StackCP):**
```env
DATABASE_URL=postgresql://...
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
HOME_ASSISTANT_WEBHOOK_SECRET=...
```

---

## 🚨 Critical Rules

1. **Sequential dependencies MUST be respected:**
   - H-01 completes BEFORE H-02 through H-06 start
   - H-02 through H-06 complete BEFORE H-07 through H-10 start
   - H-07 through H-10 complete BEFORE H-11 through H-13 start

2. **Use `/tmp/*.txt` files for coordination:**
   - H-01 writes `/tmp/H-01-SCHEMA-READY.txt` when migrations complete
   - Every agent writes `/tmp/H-0X-STATUS.txt` every 30 min
   - Every agent writes `/tmp/H-0X-COMPLETE.txt` when done
   - H-15 monitors these files to track progress

3. **IF.TTT compliance (Traceable, Transparent, Trustworthy):**
   - All API endpoints documented in OpenAPI spec
   - All git commits reference intelligence dossier citations
   - All decisions logged in coordinator report

4. **Budget discipline:**
   - Target: $8-12 total (15 Haiku agents × 4-6 hours)
   - H-15 monitors token usage, warns at $10 threshold
   - If approaching $12, prioritize P0/P1 tasks, defer P2/P3

5. **Quality over speed:**
   - Don't deploy until ALL tests pass
   - Don't merge PRs with merge conflicts
   - Don't skip security audit

---

## 📦 Deliverables

**Code (Git commits):**
- 16 migration files (database schema)
- 50+ API route files (Express.js)
- 5 Vue component files (feature modules)
- 100+ test files (Jest + Playwright)

**Documentation:**
- OpenAPI 3.0 spec (50+ endpoints)
- Storybook stories (all components)
- User guide (boat owner instructions)
- Deployment guide (StackCP setup)
- Session completion report (agent coordination summary)

**Production Deployment:**
- All code deployed to StackCP
- Database migrations applied
- Environment variables configured
- Monitoring/logging active

---

## 🎬 How to Launch This Session

1. **Open Claude Code Cloud:** https://claude.com/claude-code (web interface)
2. **Copy this ENTIRE file** (`NAVIDOCS_SINGLE_SESSION_BUILD.md`)
3. **Paste into new Cloud session**
4. **Verify repository access:** Session can clone https://github.com/dannystocker/navidocs
5. **Start execution** - H-15 Coordinator will spawn other agents automatically
6. **Monitor progress** - Check `/tmp/COORDINATOR-LOG.txt` for updates
7. **Wait 4-6 hours** - All agents work concurrently
8. **Review completion report** - `docs/SESSION_COMPLETION_REPORT.md`

---

## 📚 Reference Documents

**Intelligence Dossier (all research done):**
- `/home/setup/navidocs/NAVIDOCS_COMPLETE_INTELLIGENCE_DOSSIER.md` - Complete market analysis, architecture, roadmap

**Feature Specifications:**
- `intelligence/session-2/inventory-tracking-spec.md`
- `intelligence/session-2/maintenance-log-spec.md`
- `intelligence/session-2/camera-integration-spec.md`
- `intelligence/session-2/contact-management-spec.md`
- `intelligence/session-2/accounting-integration-spec.md`
- `intelligence/session-2/search-ux-spec.md`

**Code Templates:**
- `intelligence/session-2/code-templates/roi-calculator.js` - Working ROI backend

---

**Generated:** 2025-11-14
**Budget:** $8-12 (15 Haiku agents)
**Timeline:** 4-6 hours
**Status:** ✅ READY TO LAUNCH

---

## 💡 Why This Works

**Problem with S² plan:** Complex 4-mission architecture, 31 agents, manual coordination overhead

**This approach:** Simple 1-mission design, 15 Haiku agents, automatic coordination via `/tmp/*.txt` files

**Cost comparison:**
- S² plan: $12-18 (30 Haiku + 1 Sonnet coordinator)
- This plan: $8-12 (15 Haiku only, H-15 is Haiku coordinator)

**Time comparison:**
- S² plan: 16-22 hours (sequential missions)
- This plan: 4-6 hours (parallel execution)

**Key insight:** Research is DONE. Just need to BUILD. Haiku can build production code with clear specs.

---

**Next step:** Copy this file, paste into Claude Code Cloud, press Enter. That's it.
