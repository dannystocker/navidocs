# Cloud Session 2: Technical Integration Architecture
## NaviDocs Yacht Sales Enhancement Roadmap

**Session Type:** Technical Integration Specialist
**Lead Agent:** Sonnet (architecture + development)
**Swarm Size:** 10 Haiku agents
**Token Budget:** $20 (10K Sonnet + 60K Haiku)
**Output:** Feature specs + integration architecture + sprint plan

---

## Mission Statement

Design technical architecture for **sticky daily-use features** (inventory tracking, cameras, maintenance logs, contacts, accounting) that make NaviDocs indispensable to recreational boat owners. Documentation features are secondary to engagement.

---

## Context (Read First)

**Prerequisites:**
1. Read `intelligence/session-1/session-1-market-analysis.md` (once Session 1 completes)
2. Read `intelligence/session-1/session-1-handoff.md` (once Session 1 completes)
3. Read `ARCHITECTURE_INTEGRATION_ANALYSIS.md` (in repo root)

**Current NaviDocs Tech Stack:**
- Frontend: Vue 3 + Vite
- Backend: Express.js + SQLite
- Background: BullMQ + Redis
- Search: Meilisearch
- OCR: Tesseract + Google Vision
- Auth: JWT + bcrypt

**Critical Feature Gaps (from Session 1):**
- **No document tracking/versioning** (core value prop: warranties, manuals, service records with IF.TTT traceability)
- **No WhatsApp group integration** (boat-specific chat with owner, after-sales, captain + AI agent)
- **No inventory tracking** (€15K-€50K forgotten value at resale)
- **No camera/monitoring integration** (owners want "is my boat OK?" reassurance)
- **No maintenance log** (when was last engine service? upcoming work alerts?)
- **No contact management** (crew, marina, mechanics, cleaners)
- **No expense tracking** (how much am I spending on this boat?)
- **No impeccable search** (avoid long lists, structured faceted results)
- **No VAT/tax tracking** (non-VAT boats must leave EU for stamp; different regs ES/FR/IT/global jurisdictions)
- **No calendar system** (service dates, warranty tracking, owner onboard dates, work roadmaps with budget signoff)

---

## PHASE 1: Helper Agents (START IMMEDIATELY - ASSIST SESSIONS 1 & 3)

**Mission:** While waiting for Session 1 market research and Session 3 UX/sales work, provide active technical assistance to accelerate their completion.

**NO DEPENDENCIES:** All Phase 1 agents can start immediately (no need to wait for other sessions).

---

### Agent 0A: Technical Validation Assistant (CRITICAL)
**AGENT ID:** S2-H0A
**START:** Immediately (no dependencies)

**Assist Session 1 (Market Research):**
- **Verify competitor tech stacks:** When Session 1 identifies competitors (YachtWorld, Boat Trader, etc.), validate their API documentation
- **Check API availability:** Research if competitor APIs are public, require auth, or need partner agreements
- **Document API contracts:** Create structured summaries of competitor API capabilities for Session 1 citations

**Assist Session 3 (UX/Sales):**
- **Technical feasibility checks:** When Session 3 proposes UI features, confirm if NaviDocs tech stack supports them
- **Performance estimates:** Provide load time estimates for proposed features (based on NaviDocs current architecture)
- **Mobile compatibility:** Validate if proposed UX patterns work on mobile (Vue 3 + PWA constraints)

**Deliverable:** `intelligence/session-2/helper-technical-validations.md` (updated in real-time as Sessions 1 & 3 work)

---

### Agent 0B: Citation Automation (SHA-256 Hash Generation)
**AGENT ID:** S2-H0B
**START:** Immediately (no dependencies)

**Assist Session 1 (Market Research):**
- **Generate SHA-256 hashes:** When Session 1 cites web URLs, automatically fetch and hash content
- **Verify URL accessibility:** Check if cited URLs return 200 OK (flag broken links immediately)
- **Extract structured data:** Parse web pages for key data points (pricing, features, market stats)
- **Create citation JSON:** Auto-generate IF.TTT-compliant citation entries with hashes

**Example Workflow:**
```bash
# Session 1 Agent 3 cites: "YachtWorld pricing: €25/month"
# Agent 0B immediately:
1. Fetches https://yachtworld.com/pricing
2. Generates SHA-256: a1b2c3d4e5f6...
3. Extracts pricing table
4. Creates citation JSON:
{
  "citation_id": "if://citation/yachtworld-pricing-nov2025",
  "claim": "YachtWorld charges €25/month for yacht management",
  "sources": [{
    "type": "web",
    "url": "https://yachtworld.com/pricing",
    "sha256": "a1b2c3d4e5f6...",
    "accessed": "2025-11-13",
    "quality": "primary",
    "credibility": 9
  }],
  "status": "verified",
  "confidence_score": 0.95
}
```

**Deliverable:** `intelligence/session-2/auto-citations.json` (append as Session 1 works)

---

### Agent 0C: Web Scraping Assistant (Structured Data Extraction)
**AGENT ID:** S2-H0C
**START:** Immediately (no dependencies)

**Assist Session 1 (Market Research):**
- **Extract competitor feature lists:** Scrape competitor websites for feature comparisons
- **Pricing table extraction:** Parse pricing pages into structured JSON
- **Market report parsing:** Extract key stats from industry reports (PDFs, web pages)
- **Automated data validation:** Cross-check data across multiple sources (detect conflicts)

**Example:**
```yaml
# Session 1 Agent 5 researching competitors
# Agent 0C scrapes:
- YachtWorld: Features (inventory, CRM, MLS integration)
- Boat Trader: Pricing (€15/month basic, €45/month pro)
- Dockwa: User counts (50K+ marinas, 250K+ boaters)

# Output: intelligence/session-2/competitor-data.json
{
  "yachtworld": {
    "features": ["inventory", "crm", "mls_integration"],
    "pricing": {"basic": 25, "pro": 75},
    "users": "unknown"
  },
  "boat_trader": {
    "features": ["listings", "leads", "analytics"],
    "pricing": {"basic": 15, "pro": 45},
    "users": "unknown"
  }
}
```

**Deliverable:** `intelligence/session-2/competitor-data.json` (structured data for Session 1 & 3 use)

---

### Agent 0D: ROI Calculator Backend (Build Before Session 1 Data Arrives)
**AGENT ID:** S2-H0D
**START:** Immediately (no dependencies)

**Build Generic ROI Calculator Framework:**
- **Formula engine:** Create generic calculator that accepts variables (warranty_savings, time_saved, resale_value_increase)
- **Input validation:** Define valid ranges for each variable (prevent unrealistic claims)
- **Visualization logic:** Prepare chart generation code (bar charts, pie charts for ROI breakdown)
- **Export functionality:** Generate PDF/Excel exports of ROI calculations

**Example Structure:**
```javascript
// server/services/roi-calculator.service.js
class ROICalculator {
  calculate(inputs) {
    // inputs: { warranty_savings, time_saved_hours, resale_value_increase }
    const warranty_roi = inputs.warranty_savings * 12; // Annual savings
    const time_roi = inputs.time_saved_hours * 50; // €50/hour labor cost
    const resale_roi = inputs.resale_value_increase;

    return {
      total_annual_roi: warranty_roi + time_roi,
      resale_value_lift: resale_roi,
      payback_period_months: this.calculatePayback(inputs),
      confidence: this.calculateConfidence(inputs)
    };
  }
}
```

**When Session 1 Data Arrives:**
- Agent 0D plugs in Session 1 findings (€8K-€33K warranty savings, etc.)
- Generates final ROI report for Session 3 pitch deck
- Creates interactive calculator UI for demos

**Deliverable:** `intelligence/session-2/roi-calculator-framework.js` (ready for Session 1 data integration)

---


## Agent Identity & Check-In Protocol

**YOU ARE:** Sonnet coordinator for Session 2 (Technical Architecture)

**YOUR HAIKU SWARM:** You have 10 Haiku agents available. Use as many as needed (not required to use all 10).

**AGENT IDENTITY SYSTEM:**
When spawning a Haiku agent, assign it an identity: `S2-H01` through `S2-H10`
Each agent MUST:
1. **Check in** at start: "I am S2-H03, assigned to [task name]"
2. **Reference their task** by searching this document for "Agent 3:" (matching their number)
3. **Retain identity** throughout execution
4. **Report completion** with identity: "S2-H03 complete: [deliverable summary]"

**TASK DEPENDENCIES:**
- Most agents can run in parallel
- Agent 10 typically synthesizes results from Agents 1-9 (must wait for completion)

---

## Your Tasks (Spawn 10 Haiku Agents in Parallel)

### Agent 1: NaviDocs Codebase Analysis
**AGENT ID:** S2-H01
**
**Read Files:**
- `server/db/schema.sql` - Database structure
- `server/routes/*.js` - API endpoints
- `server/services/*.js` - Business logic
- `server/workers/*.js` - Background jobs

**Deliverable:** Architecture map with integration points

### Agent 2: Inventory Tracking System Design (CRITICAL)
**AGENT ID:** S2-H02
**
**Design:**
- Database schema: `boat_inventory` (item_name, category, zone, purchase_date, purchase_price, receipt_url, warranty_expiration, current_value)
- Categories: tender/zodiac, electronics, engine, deck, interior, safety
- Zones: salon, galley, helm, engine room, stern storage
- OCR receipt extraction (auto-populate item, price, date)
- Resale value calculator (total upgrades since purchase)
- Search facets (by category, zone, value range, warranty status)

**Deliverable:** Inventory tracking spec with impeccable search UX

### Agent 3: Maintenance Log & Reminder System
**AGENT ID:** S2-H03
**
**Design:**
- Database schema: `maintenance_log` (service_type, date, cost, provider, next_due_date, engine_hours)
- Service types: engine, electronics, hull, deck, safety equipment
- Reminder alerts (based on date OR engine hours)
- Service provider contacts (auto-suggest from past services)
- Expense rollup (total maintenance spend YTD, annual)

**Deliverable:** Maintenance tracking spec with smart reminders

### Agent 4: Camera & Remote Monitoring Integration (STICKY!)
**AGENT ID:** S2-H04
**
**Research + Design:**
- Home Assistant camera feed integration (Hikvision, Reolink, marine cameras)
- Webhook architecture (NaviDocs ← HA events: motion detected, battery low, bilge alert)
- Camera snapshot storage (link to boat, timestamp, auto-cleanup old images)
- Mobile-first UI (owners check from phone: "is my boat OK?")
- Use cases: security monitoring, dock check, weather damage assessment

**Deliverable:** Camera/HA integration architecture with peace-of-mind UX

### Agent 5: Contact Management System
**AGENT ID:** S2-H05
**
**Design:**
- Database schema: `boat_contacts` (name, role, phone, email, notes, last_used)
- Roles: marina, mechanic, cleaner, charter crew, electrician, surveyor
- One-tap call/email from mobile
- Auto-suggest from maintenance log (provider → contact)
- Quick actions: "Call my mechanic", "Email charter crew"

**Deliverable:** Contact management spec with mobile-first UX

### Agent 6: Receipt/Invoice Upload + Accounting Module Integration
**AGENT ID:** S2-H06
**
**Research + Design:**

**Open-Source Accounting Module Research:**
- Review `YACHT_ACCOUNTING_RESEARCH.md` (in repo root - Haiku research completed)
- **Recommended:** Spliit (MIT, 2.3K stars) - receipt scanning, expense splitting, PWA mobile
- **Alternative:** SplitPro (MIT, 916 stars) - BigInt precision, multi-currency
- **Foundation:** Medici (MIT, 330 stars) - double-entry GL, hierarchical accounts

**Multi-User Expense Tracking:**
- **Owner expenditure:**
  - Cash payments (€X for marina, €Y for fuel)
  - Card payments (auto-import from bank APIs if available)
  - Bank transfers (boat maintenance, insurance)
  - Categories: marina fees, insurance, major upgrades, professional services
- **Captain expenditure:**
  - Boat card (provisioning, fuel, minor repairs)
  - Boat cash (tips, small purchases)
  - Personal cash to reimburse (meals, supplies bought with personal funds)
  - Categories: provisions, fuel, minor repairs, supplies, crew meals
- **Reimbursement workflow:**
  - Captain submits expense with receipt photo
  - NaviDocs OCR extracts (amount, vendor, date, category)
  - Owner approves/rejects via WhatsApp or app
  - Mark as "paid" when reimbursed

**Receipt/Invoice Upload Integration:**
- Photo upload via mobile (camera + gallery)
- OCR processing (existing Tesseract + Google Vision pipeline)
- Auto-extraction: amount, vendor, date, VAT, category
- Link to maintenance log, inventory, or general expense
- Store original receipt image + extracted structured data
- IF.TTT compliance: SHA-256 hash, ed25519 signature, citation ID

**Accounting Module Architecture:**
- Fork Spliit or integrate as library (MIT license allows)
- Customize for boat workflows (owner vs captain vs crew)
- Multi-currency support (€, $, £ for international owners)
- Export to Excel/CSV for accountant (tax deduction reports)
- Integration with WhatsApp: "@NaviDocs log expense €45 fuel" → AI creates expense entry

**Deliverable:** Accounting module integration spec + receipt OCR workflow + multi-user expense tracking design

### Agent 7: Impeccable Search UX Design (CRITICAL)
**AGENT ID:** S2-H07
**
**Design:**
- Search architecture (Meilisearch faceted search)
- Structured results (NO long lists - Pinterest/Airbnb grid layout)
- Facets: category, zone, value range, warranty status, date range
- Mobile-first (owners search from phone)
- Voice search support ("Show me tender warranty")
- Quick filters: "Show expensive items", "Show expiring warranties"

**Deliverable:** Search UX spec with visual mockups (avoid long lists!)

### Agent 8: WhatsApp Group Integration (CRITICAL - NEW!)
**AGENT ID:** S2-H08
**
**Research + Design:**
- WhatsApp Business API integration (boat-specific group chat)
- Group membership: Owner, Riviera after-sales, captain, stakeholders + NaviDocs AI agent
- AI agent capabilities:
  - **Log all chats** (IF.TTT audit trail: who said what, when, with citations)
  - **Answer questions** ("Where's the tender warranty?" → NaviDocs searches, responds with doc link)
  - **Post updates** ("Maintenance service due in 2 weeks" → proactive reminders)
  - **Document versioning notifications** ("New manual uploaded for autopilot")
- Technical architecture:
  - Webhook from WhatsApp → NaviDocs tenant API
  - AI agent response generation (Claude API integration)
  - Message history storage (IF.TTT compliance: ed25519 signatures, SHA-256 hashes)
  - Multi-tenant isolation (each boat's chat stays separate)
- Use cases:
  - Owner: "When was last engine service?" → AI responds with maintenance log data
  - After-sales: "@NaviDocs upload warranty for new tender" → AI confirms, creates inventory entry
  - Captain: "Bilge pump alarm triggered" → AI logs incident, suggests mechanic contact

**Deliverable:** WhatsApp integration architecture with AI agent spec + IF.TTT compliance checklist

### Agent 9: Document Tracking & Versioning (CORE VALUE PROP)
**AGENT ID:** S2-H09
**
**Design:**
- Document versioning system (git-style: track changes, rollback, history)
- IF.TTT compliance: Every doc upload/edit gets:
  - Ed25519 signature (who uploaded)
  - SHA-256 content hash (tamper detection)
  - Timestamp (when)
  - Citation ID (if://doc/navidocs/boat-123/warranty-tender-v2)
- Document categories: warranties, manuals, service records, invoices, certificates, insurance
- Versioning metadata: version number, change description, changed_by, changed_at
- Search integration: Meilisearch indexes doc content (OCR text + metadata)
- Mobile-first: owners upload photos of receipts/manuals → OCR extraction → structured data

**Deliverable:** Document versioning spec with IF.TTT traceability architecture

### Agent 3A: VAT/Tax Jurisdiction Tracking & Compliance Reminders (CRITICAL)
**AGENT ID:** S2-H03A
**
**Research + Design:**
- **Non-VAT boat regulations:** Research requirements for tax-exempt yachts in major jurisdictions
  - **EU:** Must leave EU waters to get customs stamp (prevents VAT liability)
  - **France:** Check exit requirements, grace periods, penalties for non-compliance
  - **Spain:** Different exit requirements than France (research specific regs)
  - **Italy:** Different exit requirements (research specific regs)
  - **Global:** Check major yachting jurisdictions (Monaco, Gibraltar, Malta, Cayman Islands, US, Caribbean)
- **VAT-paid vs Non-VAT tracking:**
  - Database schema: `boat_tax_status` (vat_paid, home_jurisdiction, purchase_date, exemption_expiry, last_exit_date)
  - Track: VAT status, home port, last EU exit, next required exit
- **Compliance reminder system:**
  - Calculate: days until required EU exit (based on jurisdiction rules)
  - Alerts: 60/30/14/7 days before required exit
  - Dashboard widget: "EU Exit Required in 23 days (Spain regs)"
  - Integration with calendar system (scheduled exits on owner calendar)
- **Jurisdiction-specific rules engine:**
  - Store rules per jurisdiction (exit frequency, grace periods, documentation requirements)
  - Update mechanism (regulations change - need easy updates)
  - Multi-jurisdiction support (owner moves between FR/ES/IT marinas)

**Deliverable:** VAT/tax tracking spec with compliance reminders + jurisdiction rules engine + integration with calendar system

### Agent 7A: Multi-Calendar System (CRITICAL)
**AGENT ID:** S2-H07A
**
**Design:**
- **Calendar architecture** (4 separate calendar types, unified UI):
  1. **Service Calendar:**
     - Maintenance appointments (past + upcoming)
     - Service due dates (based on date OR engine hours)
     - Reminders: 60/30/14/7 days before service due
     - Integration: Maintenance log (Agent 3) feeds service dates
  2. **Warranty Calendar:**
     - Warranty expiration dates (equipment-specific)
     - Purchase anniversaries (for warranty tracking)
     - Reminders: 90/60/30 days before warranty expires
     - Integration: Inventory tracking (Agent 2) feeds warranty dates
  3. **Owner Onboard Calendar:**
     - Owner scheduled trips ("On boat: July 15-22, 2025")
     - Captain can see owner arrival dates (prep boat)
     - After-sales can see owner activity patterns (engagement tracking)
     - Integration: Stakeholder dashboard (Session 3) shows owner engagement
  4. **Work Roadmap Calendar:**
     - Planned work with budget estimates ("Hull repaint: €15K, scheduled Aug 2025")
     - Budget signoff workflow (owner approves/rejects planned work)
     - Status tracking: Proposed → Approved → Scheduled → In Progress → Complete
     - Integration: Expense tracking (Agent 6) for actual costs vs budget

**Calendar Features:**
- **Unified dashboard view:** All 4 calendars in one interface (color-coded)
- **Mobile-first:** Owners check calendars from phone
- **Smart notifications:** Context-aware (e.g., "Service due + Owner arriving in 3 days → notify captain to schedule service before arrival")
- **Export:** iCal/Google Calendar sync (owners add to personal calendar)
- **Conflict detection:** "Owner arriving July 15, but hull repaint scheduled July 10-20 → flag conflict"

**Database Schema:**
- `calendar_events` (event_type, date, boat_id, title, description, status, budget_amount, actual_cost, created_by, approved_by)
- Event types: service_due, warranty_expires, owner_onboard, work_planned, tax_exit_required
- Status: proposed, approved, scheduled, in_progress, completed, cancelled

**Deliverable:** Multi-calendar system spec with unified dashboard + smart notifications + conflict detection + budget signoff workflow

### Agent 10: Architecture Synthesis & Sprint Planning
**AGENT ID:** S2-H10
**
**Wait for:** Agents 1-9 + 3A + 7A to complete (11 agents total)

**Compile:**
- Integration architecture (all 11 features working together)
- Week 1-4 task breakdown with priorities:
  - **Week 1:** Document tracking/versioning + WhatsApp integration (core value props)
  - **Week 2:** Inventory tracking + maintenance log + VAT/tax tracking (Agent 3A)
  - **Week 3:** Camera integration + contact management + multi-calendar system (Agent 7A)
  - **Week 4:** Expense tracking + search UX + AI agent training + calendar integrations
- Dependencies mapped:
  - WhatsApp AI agent needs document search working first
  - Calendar system needs maintenance log + inventory tracking data feeds
  - VAT compliance alerts integrate with calendar system (exit reminders)
  - Work roadmap calendar integrates with expense tracking (budget vs actual)
- Acceptance criteria per feature
- Testing strategy (unit, integration, E2E + IF.TTT audit validation)
- IF.TTT dogfooding checklist (we're using our own traceability standards)

**Deliverable:** Complete architecture document + 4-week sprint plan with IF.TTT compliance + calendar/tax integration roadmap

---

## Intra-Agent Communication Protocol (IF.bus)

**Based on:** InfraFabric S² multi-swarm coordination (3,563x faster than git polling)

### IFMessage Schema

Every agent-to-agent message follows this structure:

```json
{
  "performative": "inform",  // FIPA-ACL: inform, request, query-if, confirm, disconfirm, propose, agree, ESCALATE
  "sender": "if://agent/session-2/haiku-Y",
  "receiver": ["if://agent/session-2/haiku-Z"],
  "conversation_id": "if://conversation/navidocs-session-2-2025-11-13",
  "content": {
    "claim": "[Your design proposal]",
    "evidence": ["[File references or codebase analysis]"],
    "confidence": 0.85,  // 0.0-1.0
    "cost_tokens": 1247
  },
  "citation_ids": ["if://citation/uuid"],
  "timestamp": "2025-11-13T10:00:00Z",
  "sequence_num": 1
}
```

### Speech Acts (Performatives)

**propose:** Agent suggests a design or approach
- Example: "S2-H02 proposes: Inventory tracking via manual entry forms"

**agree:** Agent validates another agent's proposal
- Example: "S2-H04 agrees with S2-H02: Manual entry compatible with camera feeds"

**disconfirm:** Agent challenges another agent's design
- Example: "S2-H04 challenges S2-H02: Camera feeds can auto-detect equipment (CV models available)"

**request:** Ask another agent for design input
- Example: "S2-H02 requests S2-H04: How do cameras integrate with inventory schema?"

**confirm:** Validate another agent's technical claim
- Example: "S2-H01 confirms S2-H03: Express.js patterns match existing routes"

**ESCALATE:** Flag critical integration conflicts
- Example: "S2-H10 ESCALATES: Inventory + cameras overlap, needs integration design"

### Communication Flow (This Session)

```
S2-H01 (Codebase) ──→ S2-H10
S2-H02 (Inventory) ──→ S2-H04 (Cameras) ─→ S2-H10 (peer review)
S2-H03 (Maintenance) → S2-H05 (Contacts) → S2-H10 (integration check)
S2-H06 (Expense) ────→ S2-H07 (Search UX)→ S2-H10
```

**Key Patterns:**
1. **Design Proposals:** Agents 2-7 propose features independently
2. **Peer Review:** Adjacent agents challenge/validate designs
3. **Integration Checks:** Agent 10 ensures no conflicts between subsystems
4. **Sonnet Approval:** Final architecture review & synthesis

### Cross-Domain Validation Example

```yaml
# Agent 2 (Inventory Tracking) proposes design
S2-H02: "propose" → content:
  feature: "Inventory tracking via manual entry forms"
  rationale: "Simple, no OCR complexity"

# Agent 4 (Cameras) challenges with technical capability
S2-H04: "disconfirm" → content:
  original_proposal: "Manual entry only"
  challenge: "Camera feeds can auto-detect equipment (tender, electronics) via CV"
  evidence: ["OpenCV boat equipment detection models"]
  alternative: "Hybrid: Manual + camera-assisted auto-detection"

# Agent 2 revises proposal
S2-H02: "agree" → content:
  revised_proposal: "Inventory tracking: Manual entry + camera-assisted CV detection"
  integration_point: "Use S2-H04's camera feed for equipment detection"
```

### API Integration Conflict Example

```yaml
# Agent 3 (Maintenance) proposes maintenance log API
S2-H03: "propose" → POST /api/maintenance/{boat_id}/logs

# Agent 7 (Search UX) challenges completeness
S2-H07: "query-if" → content:
  question: "Does maintenance API support date-range queries for yearly reporting?"
  reasoning: "Search UI needs to filter by date for expense rollups"

# Agent 3 confirms and extends API
S2-H03: "confirm" → content:
  api_extended: "GET /api/maintenance/{boat_id}/logs?start_date=&end_date=&category="
  integration: "Supports S2-H06 expense rollup queries"
```

### IF.TTT Compliance

Every message MUST include:
- **citation_ids:** Links to design docs, codebase references
- **confidence:** Explicit score (0.0-1.0)
- **evidence:** File:line references from NaviDocs codebase
- **cost_tokens:** Token consumption (IF.optimise tracking)

---

## IF.bus Integration Pattern

### Event Bus Design
```javascript
// server/services/event-bus.js
class EventBus {
  async publish(topic, event) {
    // Publish to Redis pub/sub
    // Trigger webhooks (Home Assistant)
    // Queue background jobs
    // Log to audit trail
  }

  async subscribe(topic, handler) {
    // Subscribe to Redis channel
    // Handle incoming events
  }
}

// Topics for NaviDocs
const TOPICS = {
  WARRANTY_EXPIRING: 'warranty.expiring',
  DOCUMENT_UPLOADED: 'document.uploaded',
  SALE_INITIATED: 'sale.initiated',
  BOAT_TRANSFERRED: 'boat.transferred'
};
```

### Webhook Framework
```javascript
// server/services/webhook.service.js
class WebhookService {
  async sendWebhook(url, event) {
    // POST event to external system
    // Retry on failure (exponential backoff)
    // Log delivery status
  }

  async registerWebhook(organizationId, url, topics) {
    // Store webhook subscription
    // Validate URL reachability
  }
}
```

---

## Output Format

### Deliverable 1: Technical Architecture Document
**File:** `session-2-architecture.md`

**Structure:**
```markdown
# NaviDocs Yacht Sales Technical Architecture

## System Overview
[High-level architecture diagram]

## Database Schema Changes
[Agent 9: Migration scripts]

## API Endpoints (New)
### Warranty Tracking
- POST /api/warranties
- GET /api/warranties/:id
- PUT /api/warranties/:id
- DELETE /api/warranties/:id
- GET /api/warranties/expiring

### Sale Workflow
- POST /api/sales
- GET /api/sales/:id/documents
- POST /api/sales/:id/transfer

### Webhooks
- POST /api/webhooks/register
- GET /api/webhooks
- DELETE /api/webhooks/:id

## Integration Architecture
### Home Assistant
[Agent 4: Webhook + MQTT design]

### MLS Platforms
[Agent 6: API contracts]

### Notification System
[Agent 8: Email/SMS/Push architecture]

## Security Remediation
[Agent 7: Security fixes]

## Offline Mode
[Agent 5: PWA caching strategy]

## 4-Week Sprint Plan
[Agent 10: Gantt chart + tasks]
```

### Deliverable 2: Implementation Tasks
**File:** `session-2-sprint-plan.md`

**Structure:**
```markdown
# 4-Week Implementation Sprint

## Week 1: Foundation (Nov 13-19)
### Day 1-2: Database Migrations
- [ ] Create warranty_tracking table
- [ ] Create sale_workflows table
- [ ] Create webhooks table
- [ ] Create notification_templates table

### Day 3-4: Event Bus
- [ ] Implement IF.bus service
- [ ] Create webhook delivery system
- [ ] Add Redis pub/sub

### Day 5: Security Fixes
- [ ] Protect DELETE endpoints
- [ ] Enforce auth on all routes
- [ ] Fix stats endpoint (tenant isolation)

## Week 2: Core Integrations (Nov 20-26)
### Day 1-2: Warranty Tracking
- [ ] Warranty CRUD APIs
- [ ] Expiration alert background job
- [ ] Claim package generator

### Day 3-5: Home Assistant
- [ ] Webhook receiver endpoint
- [ ] MQTT broker integration
- [ ] Camera system connector

## Week 3: Automation (Nov 27 - Dec 3)
### Day 1-2: Sale Workflow
- [ ] As-built package generator
- [ ] Document transfer API
- [ ] Buyer handoff workflow

### Day 3-4: Notifications
- [ ] Email service implementation
- [ ] SMS gateway integration
- [ ] In-app notification center

### Day 5: Offline Mode
- [ ] Service worker caching
- [ ] Offline sync queue

## Week 4: Polish & Deploy (Dec 4-10)
### Day 1-2: MLS Integration
- [ ] YachtWorld API connector
- [ ] Boat Trader sync

### Day 3: Testing
- [ ] E2E test suite
- [ ] Security audit
- [ ] Performance testing

### Day 4-5: Deployment
- [ ] Sales demo environment
- [ ] Production deployment
- [ ] Riviera Plaisance pilot
```

### Deliverable 3: Code Templates
**File:** `session-2-code-templates/`

**Files:**
- `warranty.model.js` - Warranty database model
- `warranty.routes.js` - API endpoints
- `warranty.service.js` - Business logic
- `webhook.service.js` - Webhook delivery
- `event-bus.service.js` - IF.bus implementation
- `notification.service.js` - Alert system

### Deliverable 4: Session Handoff
**File:** `session-2-handoff.md`

**Structure:**
```markdown
# Session 2 Handoff to Session 3

## Mission Accomplished
- [x] Architecture designed
- [x] Sprint plan created
- [x] Code templates generated
- [x] Security audit complete

## Key Findings for Session 3 (UX/Sales)
1. Warranty tracking saves €8K-€33K per yacht (ROI calculator input)
2. Home Assistant integration enables remote monitoring
3. 4-week implementation timeline (Week 1: Foundation, Week 4: Deploy)
4. Security fixes required before demo (DELETE endpoint, auth)

## Blockers for Next Session
- [ ] Need UI/UX mockups for warranty dashboard (Session 3)
- [ ] Sales pitch requires demo script (Session 3)

## Token Consumption
- Total: 62,800 tokens ($1.42)
- Sonnet: 9,500 tokens
- Haiku: 53,300 tokens
- Efficiency: 68% Haiku delegation ✅

## Evidence Quality
- Code templates: 6 files created
- API endpoints: 15 new routes documented
- Migrations: 4 SQL scripts ready
- All architecture verified against NaviDocs codebase

## Next Session Input
Read: session-2-architecture.md, session-2-sprint-plan.md
Focus: Sales pitch, demo script, ROI calculator, objection handling
```

---

## IF.TTT Compliance Checklist

- [ ] All code templates include file:line references
- [ ] API specs link to NaviDocs existing endpoints
- [ ] Database migrations tested (rollback verified)
- [ ] Security audit cites OWASP Top 10
- [ ] Sprint plan has acceptance criteria per task
- [ ] Evidence artifacts stored in `/intelligence/session-2/`

---

## Success Criteria

**Minimum Viable Output:**
- Database migrations for warranty tracking
- 4-week sprint plan with dependencies
- Home Assistant integration architecture
- Security remediation plan (5 vulnerabilities)
- Code templates for warranty + webhook systems

**Stretch Goals:**
- MLS integration specs (YachtWorld, Boat Trader)
- Offline mode PWA architecture
- Notification system design (email/SMS/push)

---

**Start Command:** Deploy to Claude Code Cloud after Session 1 complete
**End Condition:** All deliverables committed to `dannystocker/navidocs` repo under `intelligence/session-2/`
