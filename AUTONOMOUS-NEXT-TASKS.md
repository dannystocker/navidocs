# Autonomous Next Tasks
**Local Machine → Cloud Agent Communication**

**Last Updated:** 2025-11-13 11:15 UTC
**Branch:** navidocs-cloud-coordination
**Coordinator:** Danny (Local) ↔ Cloud Sonnet Agents

---

## Overview

This file is how the **LOCAL machine** tells **CLOUD agents** what to do next. Cloud agents check this file every 5 minutes and poll for updates via GitHub.

**Check Frequency:** Every 5 minutes from cloud sessions
**Update Trigger:** Local commits to navidocs-cloud-coordination branch
**Communication Method:** Git polling + GitHub Issues

---

## Agent 1: Photo Inventory System

**Status:** ✅ DEPLOY-READY
**Last Update:** 2025-11-13 10:45 UTC
**Owner:** S2-H01 (Technical Implementation Agent)

### Current Tasks
- [x] Core inventory CRUD endpoints implemented
- [x] Cloud storage (GCS) integration complete
- [x] OCR receipt parsing functional
- [ ] Fix OCR receipt parsing bug (line breaks in total amount)
- [ ] Add depreciation calculator module
- [ ] Integrate with expense tracking

### Blockers
None

### Next Actions
1. Fix receipt parsing bug: `/home/setup/navidocs/server/services/ocrService.ts` line 156
2. Add linear depreciation calculator: `depreciationCalculator.ts` (new file)
3. Test with sample yacht photos
4. Deploy to staging.icantwait.ca

### Files Modified
```
server/services/ocrService.ts (updated 2025-11-13)
server/routes/inventory.ts (created 2025-11-12)
server/models/Inventory.ts (created 2025-11-12)
```

### Token Budget Used
- Allocation: 5,000 tokens
- Current: 3,200 tokens
- Remaining: 1,800 tokens

---

## Agent 2: Document Search & Indexing

**Status:** 🟡 IN-PROGRESS
**Last Update:** 2025-11-13 11:00 UTC
**Owner:** S2-H02 (Search Infrastructure Agent)

### Current Tasks
- [x] Meilisearch Docker image selected
- [ ] Optimize Meilisearch index for boat documents
- [ ] Implement synonym dictionary (cabin vs stateroom, port vs harbor)
- [ ] Test search performance with 1000+ documents
- [ ] Create search analytics dashboard

### Blockers
- **Waiting for:** StackCP to confirm Redis installation (requested 2025-11-13 09:30)
- **Alternative:** If Redis unavailable, use PostgreSQL for caching (slower but works)

### Next Actions
1. Assume Redis NOT available by 11:30 UTC
2. Implement PostgreSQL cache layer in `searchCache.ts`
3. Set cache TTL to 5 minutes
4. Deploy Meilisearch with simple keyword search (no ML ranking yet)
5. Test with document corpus

### Files Modified
```
server/services/meilisearchService.ts (created 2025-11-13)
server/routes/search.ts (updated 2025-11-13)
docker-compose.yml (updated 2025-11-13)
```

### Token Budget Used
- Allocation: 6,000 tokens
- Current: 4,100 tokens
- Remaining: 1,900 tokens

---

## Agent 3: Property Directory (Le Champlain, Aiolos, Bellissimo)

**Status:** 🟡 READY
**Last Update:** 2025-11-13 10:30 UTC
**Owner:** S3-H03 (Content & UX Agent)

### Current Tasks
- [ ] Create property detail pages for all 3 properties
- [ ] Implement photo gallery with lazy loading
- [ ] Add property specifications table
- [ ] Create comparison view (Le Champlain vs Aiolos vs Bellissimo)
- [ ] Integrate with reservation calendar

### Blockers
None

### Next Actions
1. Fetch property data from `CLOUD_SESSION_3_UX_SALES_ENABLEMENT.md` (findings ready)
2. Create React components: `PropertyDetail.tsx`, `PropertyGallery.tsx`, `PropertyComparison.tsx`
3. Add routing: `/properties/[propertyId]`
4. Implement image optimization (Next.js Image component)
5. Test on mobile (critical for yacht booking UX)

### Files to Create
```
app/properties/page.tsx (new)
app/properties/[propertyId]/page.tsx (new)
components/PropertyDetail.tsx (new)
components/PropertyGallery.tsx (new)
components/PropertyComparison.tsx (new)
public/properties/ (new directory for photos)
```

### Token Budget Used
- Allocation: 7,000 tokens
- Current: 0 tokens
- Remaining: 7,000 tokens

---

## Agent 4: Admin Panel & ProcessWire Integration

**Status:** 🟡 READY
**Last Update:** 2025-11-13 10:15 UTC
**Owner:** S4-H04 (Integration Agent)

### Current Tasks
- [ ] Verify ProcessWire admin access at icantwait.ca/nextspread-admin/
- [ ] Map ProcessWire data model to NaviDocs schema
- [ ] Create bi-directional sync protocol (ProcessWire ↔ Node.js API)
- [ ] Test user creation, property updates, reservation flows
- [ ] Document API endpoints for manual intervention

### Blockers
- **Waiting for:** Confirmation that ProcessWire user (icw-admin:@@Icantwait305$$) has API token generation permission

### Next Actions
1. Test ProcessWire API access (GET /api/properties)
2. If API unavailable, implement web scraper for ProcessWire HTML pages
3. Create reconciliation script to detect drift
4. Set up daily sync job (2am UTC)
5. Log all sync operations to `sync-audit.log`

### Files to Create
```
server/services/processwireSync.ts (new)
server/jobs/syncJob.ts (new)
server/models/ProcessWireMapping.ts (new)
```

### Token Budget Used
- Allocation: 5,000 tokens
- Current: 0 tokens
- Remaining: 5,000 tokens

---

## Agent 5: Authentication & Multi-Tenancy

**Status:** 🟡 READY
**Last Update:** 2025-11-13 09:45 UTC
**Owner:** S4-H05 (Security Agent)

### Current Tasks
- [ ] Verify NextAuth.js configuration for icantwait.ca domain
- [ ] Test OAuth2 callback URLs (localhost vs production)
- [ ] Implement role-based access control (RBAC) for admin, property manager, tenant
- [ ] Add session timeout (30 min idle timeout)
- [ ] Create audit log for auth events

### Blockers
None

### Next Actions
1. Test auth flow on staging: staging.icantwait.ca/api/auth/signin
2. Verify callback URL matches production domain
3. Create RBAC middleware in `auth-middleware.ts`
4. Test all three roles with sample users
5. Set up session garbage collection

### Files Modified
```
app/api/auth/[...nextauth].ts (updated 2025-11-12)
middleware.ts (updated 2025-11-13)
server/middleware/rbac.ts (created 2025-11-12)
```

### Token Budget Used
- Allocation: 4,000 tokens
- Current: 2,100 tokens
- Remaining: 1,900 tokens

---

## Agent 6: Contacts & Crew Management

**Status:** 🟡 READY
**Last Update:** 2025-11-13 10:00 UTC
**Owner:** S2-H06 (Data Model Agent)

### Current Tasks
- [ ] Create Contact data model (captain, crew, service providers)
- [ ] Implement contact CRUD endpoints
- [ ] Add contact groups (on-call crew, winter crew, service vendors)
- [ ] Create contact import from CSV
- [ ] Add notification preferences (email, SMS, push)

### Blockers
None

### Next Actions
1. Design Contact schema in Prisma
2. Create contacts table in PostgreSQL
3. Build CRUD API endpoints
4. Implement CSV importer with validation
5. Add bulk operations (tag, message, update)

### Files to Create
```
server/models/Contact.ts (new)
server/routes/contacts.ts (new)
server/services/contactService.ts (new)
server/utils/csvImporter.ts (new)
```

### Token Budget Used
- Allocation: 4,500 tokens
- Current: 0 tokens
- Remaining: 4,500 tokens

---

## Agent 7: Maintenance Tracking

**Status:** 🟡 READY
**Last Update:** 2025-11-13 09:30 UTC
**Owner:** S2-H07 (Operational Agent)

### Current Tasks
- [ ] Create Maintenance request data model
- [ ] Implement work order system (create, assign, track, complete)
- [ ] Add maintenance history timeline
- [ ] Create notification reminders (15 days before scheduled maintenance)
- [ ] Generate maintenance reports by category (engine, hull, electronics)

### Blockers
None

### Next Actions
1. Design Maintenance schema with task dependencies
2. Create work order workflow (OPEN → ASSIGNED → IN_PROGRESS → COMPLETE)
3. Build timeline view showing all past/future maintenance
4. Implement reminder job (cron every 6 hours)
5. Create maintenance ROI calculator (cost avoidance)

### Files to Create
```
server/models/Maintenance.ts (new)
server/routes/maintenance.ts (new)
server/jobs/maintenanceReminder.ts (new)
components/MaintenanceTimeline.tsx (new)
```

### Token Budget Used
- Allocation: 5,000 tokens
- Current: 0 tokens
- Remaining: 5,000 tokens

---

## Agent 8: Expense Tracking & Reporting

**Status:** 🟡 READY
**Last Update:** 2025-11-13 09:15 UTC
**Owner:** S2-H08 (Analytics Agent)

### Current Tasks
- [ ] Create Expense data model with categories
- [ ] Implement receipt OCR integration (link expenses to receipts)
- [ ] Build expense dashboard with charts (spending trends, category breakdown)
- [ ] Create monthly/quarterly reports (PDF export)
- [ ] Add budget tracking and alerts (notify if category >80% of budget)

### Blockers
None

### Next Actions
1. Design expense categories (fuel, crew, repairs, docking, insurance, etc.)
2. Create expense CRUD with receipt attachment
3. Build aggregation queries (GROUP BY category, month)
4. Create charts using recharts library
5. Implement budget alerts job

### Files to Create
```
server/models/Expense.ts (new)
server/routes/expenses.ts (new)
server/jobs/budgetAlertJob.ts (new)
components/ExpenseDashboard.tsx (new)
components/ExpenseCharts.tsx (new)
```

### Token Budget Used
- Allocation: 6,000 tokens
- Current: 0 tokens
- Remaining: 6,000 tokens

---

## Agent 9: Reservation & Calendar System

**Status:** 🟡 READY
**Last Update:** 2025-11-13 08:45 UTC
**Owner:** S3-H09 (Booking Agent)

### Current Tasks
- [ ] Create Reservation data model (guest info, dates, rates, fees)
- [ ] Implement calendar UI showing availability
- [ ] Build reservation request → booking → confirmation flow
- [ ] Add payment integration (Stripe for deposits)
- [ ] Create guest communication templates (confirmation, check-in, check-out)

### Blockers
None

### Next Actions
1. Design Reservation schema with multi-tenant support
2. Create availability calendar view (13-month rolling window)
3. Build reservation form with smart pricing
4. Integrate Stripe Checkout Session
5. Set up email templates for booking lifecycle

### Files to Create
```
server/models/Reservation.ts (new)
server/routes/reservations.ts (new)
components/ReservationCalendar.tsx (new)
server/services/stripeService.ts (new)
server/templates/reservationEmails.ts (new)
```

### Token Budget Used
- Allocation: 7,500 tokens
- Current: 0 tokens
- Remaining: 7,500 tokens

---

## Agent 10: Synthesis & Cross-Component Integration

**Status:** 🟡 READY (after Agents 1-9 complete)
**Last Update:** 2025-11-13 08:00 UTC
**Owner:** S2-H10 (Integration Lead)

### Current Tasks
- [ ] Wait for all Agents 1-9 to complete and report
- [ ] Detect integration conflicts (shared state, API versioning, data consistency)
- [ ] Create comprehensive integration test suite
- [ ] Update API documentation with all endpoints
- [ ] Create deployment checklist

### Blockers
- **Waiting for:** Agents 1-9 completion (estimated 2-3 hours)

### Next Actions
1. Poll `intelligence/session-2/` every 5 minutes for Agent 1-9 reports
2. When all complete, run integration tests
3. Fix any conflicts (data model, API contract, state management)
4. Update OpenAPI spec with all endpoints
5. Create deployment sequence document

### Files to Create
```
tests/integration/agents-1-9.spec.ts (new)
docs/API-COMPLETE.md (new)
DEPLOYMENT-CHECKLIST.md (new)
```

### Token Budget Used
- Allocation: 8,000 tokens
- Current: 0 tokens
- Remaining: 8,000 tokens

---

## Session-Wide Blockers

**CRITICAL ISSUE:** Redis installation status on StackCP
- **Requested:** 2025-11-13 09:30 UTC
- **Deadline:** 2025-11-13 11:30 UTC (1 hour remaining)
- **Impact:** Blocks Agent 2 (Document Search) optimization
- **Fallback:** PostgreSQL caching (ready to deploy)
- **Action:** If no response by 11:30, proceed with PostgreSQL implementation

---

## Communication Channels

**GitHub Issues (Preferred):** Create issues using `.github/ISSUE_TEMPLATE/agent-ping.md` template

**Git Polling:** Check this file every 5 minutes
```bash
# Cloud agent polling command
git fetch origin navidocs-cloud-coordination
git show origin/navidocs-cloud-coordination:AUTONOMOUS-NEXT-TASKS.md
```

**Emergency Escalation:** Create file `intelligence/session-2/ESCALATION-[issue].md` with details

---

## Budget Tracking

| Agent | Allocation | Used | Remaining | Status |
|-------|-----------|------|-----------|--------|
| Agent 1 (Inventory) | 5,000 | 3,200 | 1,800 | 64% |
| Agent 2 (Search) | 6,000 | 4,100 | 1,900 | 68% |
| Agent 3 (Properties) | 7,000 | 0 | 7,000 | Ready |
| Agent 4 (Admin) | 5,000 | 0 | 5,000 | Ready |
| Agent 5 (Auth) | 4,000 | 2,100 | 1,900 | 53% |
| Agent 6 (Contacts) | 4,500 | 0 | 4,500 | Ready |
| Agent 7 (Maintenance) | 5,000 | 0 | 5,000 | Ready |
| Agent 8 (Expenses) | 6,000 | 0 | 6,000 | Ready |
| Agent 9 (Reservations) | 7,500 | 0 | 7,500 | Ready |
| Agent 10 (Synthesis) | 8,000 | 0 | 8,000 | Blocked |
| **TOTAL** | **58,000** | **9,400** | **48,600** | **16% used** |

---

## Polling Schedule for Cloud Agents

```bash
# Every 5 minutes from each cloud session:
*/5 * * * * cd /navidocs && git fetch origin navidocs-cloud-coordination && \
  git show origin/navidocs-cloud-coordination:AUTONOMOUS-NEXT-TASKS.md > /tmp/next-tasks-latest.md && \
  diff /tmp/next-tasks-current.md /tmp/next-tasks-latest.md && \
  echo "UPDATES DETECTED" || echo "No changes"
```

---

## Update Procedure

**When you (local Danny) need to update cloud agents:**

1. Edit this file with new task instructions
2. Commit and push:
   ```bash
   git add AUTONOMOUS-NEXT-TASKS.md
   git commit -m "[AGENT-SYNC] Update Agent X task status"
   git push origin navidocs-cloud-coordination
   ```
3. Cloud agents detect within 5 minutes
4. Cloud agents create GitHub issues using `agent-ping.md` template if blocking

---

**Last Updated:** 2025-11-13 11:15 UTC
**Branch:** navidocs-cloud-coordination
**Next Review:** 2025-11-13 11:20 UTC (every 5 minutes during active sessions)
