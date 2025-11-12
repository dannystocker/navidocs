# Cloud Session 2: Technical Integration Architecture
## NaviDocs Yacht Sales Enhancement Roadmap

**Session Type:** Technical Integration Specialist
**Lead Agent:** Sonnet (architecture + development)
**Swarm Size:** 10 Haiku agents
**Token Budget:** $20 (10K Sonnet + 60K Haiku)
**Output:** Feature specs + integration architecture + sprint plan

---

## Mission Statement

Design comprehensive technical architecture for NaviDocs yacht sales features, leveraging InfraFabric's IF.bus and multi-agent patterns. Create 4-week implementation roadmap with acceptance criteria.

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

**Integration Gaps (from Session 1):**
- No MLS/listing platform integration
- No sale workflow automation
- No expiration tracking (surveys, warranties)
- Limited notifications (only password reset)
- No collaboration features (e-signatures)

---

## Your Tasks (Spawn 10 Haiku Agents in Parallel)

### Agent 1: NaviDocs Codebase Analysis
**Read Files:**
- `server/db/schema.sql` - Database structure
- `server/routes/*.js` - API endpoints
- `server/services/*.js` - Business logic
- `server/workers/*.js` - Background jobs

**Deliverable:** Architecture map with integration points

### Agent 2: Warranty Tracking System Design
**Design:**
- Database schema for warranties (expiration, claims, transfers)
- Expiration alert system (90, 30, 14 days)
- Auto claim package generator workflow
- Jurisdiction-aware document assembly

**Deliverable:** Warranty feature spec with DB migrations

### Agent 3: Sale Workflow Automation
**Design:**
- "As-built" document package generator
- Pre-sale documentation checklist
- Buyer handoff workflow (document transfer)
- Broker collaboration tools (comments, approvals)

**Deliverable:** Sale workflow spec with API endpoints

### Agent 4: Home Assistant Integration
**Research + Design:**
- Home Assistant webhook API
- MQTT integration for onboard sensors
- Camera system integration (security monitoring)
- Automation triggers (document expiration → alert)

**Deliverable:** Home Assistant integration architecture

### Agent 5: Offline Mode Enhancement
**Design:**
- Service worker caching strategy
- Critical manual pre-caching (engine, safety)
- Offline sync queue (upload when online)
- Conflict resolution (offline edits)

**Deliverable:** Offline-first PWA spec

### Agent 6: MLS/Listing Platform Integration
**Research + Design:**
- YachtWorld, Boat Trader APIs
- Broker CRM sync (Salesforce, HubSpot)
- Automated listing updates (documentation status)
- Document sharing with prospective buyers

**Deliverable:** MLS integration spec with API contracts

### Agent 7: Security & Compliance
**Audit:**
- Current security issues (5 vulnerabilities from handover doc)
- DELETE endpoint protection needed
- Auth enforcement gaps
- GDPR/data protection requirements (EU yachts)

**Deliverable:** Security remediation plan

### Agent 8: Notification System Design
**Design:**
- Email notification service
- SMS alerts (warranty expiration, document missing)
- In-app notification center
- Push notifications (PWA)

**Deliverable:** Notification architecture with templates

### Agent 9: Database Migration Plan
**Create:**
- Migration scripts for warranty tracking
- Charter mode fields (flag, crew, safety)
- Expiration tracking tables
- Collaboration features schema

**Deliverable:** SQL migrations + rollback scripts

### Agent 10: Sprint Planning
**Compile:**
- Week 1-4 task breakdown
- Dependencies mapped (e.g., DB migrations before API work)
- Acceptance criteria per feature
- Testing strategy (unit, integration, E2E)

**Deliverable:** 4-week sprint plan with Gantt chart

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
