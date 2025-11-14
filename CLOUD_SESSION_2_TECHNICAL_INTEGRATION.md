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
1. Read `intelligence/session-1/session-1-market-analysis.md`
2. Read `intelligence/session-1/session-1-handoff.md`
3. Read `/home/setup/navidocs/ARCHITECTURE_INTEGRATION_ANALYSIS.md` (if accessible)

**Current NaviDocs Tech Stack:**
- Frontend: Vue 3 + Vite
- Backend: Express.js + SQLite
- Background: BullMQ + Redis
- Search: Meilisearch
- OCR: Tesseract + Google Vision
- Auth: JWT + bcrypt

**Critical Feature Gaps (from Session 1):**
- **No inventory tracking** (€15K-€50K forgotten value at resale)
- **No camera/monitoring integration** (owners want "is my boat OK?" reassurance)
- **No maintenance log** (when was last engine service? upcoming work alerts?)
- **No contact management** (crew, marina, mechanics, cleaners)
- **No expense tracking** (how much am I spending on this boat?)
- **No impeccable search** (avoid long lists, structured faceted results)

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
- **CRITICAL:** Agent 1 (Codebase Analysis) MUST complete FIRST
- Agents 2-9 run in parallel AFTER Agent 1 completes
- Agent 10 (synthesis) waits for Agents 2-9

**Execution Phases:**
1. **Phase 1 (Sequential):** Agent 1 - NaviDocs codebase analysis
   - Maps existing database schema, API patterns, business logic
   - Identifies integration points for feature designs
   - BLOCKS: All feature design agents until complete

2. **Phase 2 (Parallel):** Agents 2-9 - Feature design & architecture
   - Agent 2: Inventory Tracking System
   - Agent 3: Maintenance Log & Reminders
   - Agent 4: Camera & Remote Monitoring
   - Agent 5: Contact Management
   - Agent 6: Expense Tracking & Accounting
   - Agent 7: Impeccable Search UX
   - Agent 8: Notification System
   - Agent 9: Database Migration Plan
   - **Dependency:** All depend on Agent 1 codebase analysis
   - **Communication:** Agents use IF.bus to validate designs against Agent 1 findings

3. **Phase 3 (Final):** Agent 10 - Sprint planning & synthesis
   - Compiles results from Agents 2-9
   - Maps inter-feature dependencies
   - Creates integrated 4-week sprint plan
   - **Dependency:** Waits for Agents 2-9 completion

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

### Agent 6: Expense Tracking & Accounting
**AGENT ID:** S2-H06
**
**Design:**
- Database schema: expense tracking across inventory, maintenance, marina fees
- Expense categories (maintenance, upgrades, insurance, marina, fuel, crew)
- Annual/monthly rollups (how much is this boat costing me?)
- Budget alerts ("You've spent €15K this year, €3K over budget")
- Tax deduction report (for chartered boats)

**Deliverable:** Expense tracking spec with budget management

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

### Agent 8: Notification System Design
**AGENT ID:** S2-H08
**
**Design:**
- Email notification service
- SMS alerts (warranty expiration, document missing)
- In-app notification center
- Push notifications (PWA)

**Deliverable:** Notification architecture with templates

### Agent 9: Database Migration Plan
**AGENT ID:** S2-H09
**
**Create:**
- Migration scripts for warranty tracking
- Charter mode fields (flag, crew, safety)
- Expiration tracking tables
- Collaboration features schema

**Deliverable:** SQL migrations + rollback scripts

### Agent 10: Sprint Planning
**AGENT ID:** S2-H10
**
**Compile:**
- Week 1-4 task breakdown
- Dependencies mapped (e.g., DB migrations before API work)
- Acceptance criteria per feature
- Testing strategy (unit, integration, E2E)

**Deliverable:** 4-week sprint plan with Gantt chart

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
