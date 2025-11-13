# NaviDocs Session 4: Dependency Graph & Critical Path Analysis

**Agent:** S4-H07 (Dependency Mapper)
**Created:** 2025-11-13
**Sprint Duration:** 4 weeks (Nov 13 - Dec 10)
**Team:** 1 solo developer (6-8 hours/day)
**Total Available Hours:** 160-200 hours/month

---

## Executive Summary

This dependency graph identifies the critical path for the 4-week NaviDocs sprint, highlighting task sequencing, parallel work opportunities, and risk mitigation strategies. The **critical path** spans 24 calendar days (actual work: ~18-19 days) and is bottlenecked by foundation tasks (DB migrations, Event Bus) that block all downstream work.

**Key Findings:**
- **Critical Path:** DB Migrations → Event Bus → Background Jobs → Warranty APIs → E2E Testing → Deployment
- **Parallel Opportunities:** 3 major zones where work can be parallelized (requires process changes)
- **Risk Areas:** 5 identified blockers with mitigation strategies
- **Total Slack Time:** 3-5 days available for handling blockers/unknowns

---

## Detailed Task Dependencies (Mermaid Gantt)

```mermaid
gantt
    title NaviDocs 4-Week Sprint: Full Dependency Graph
    dateFormat  YYYY-MM-DD

    section Week 1: Foundation
    DB Migrations (warranty_tracking, webhooks, sale_workflows) :crit, w1_db, 2025-11-13, 1d
    Event Bus Implementation (IF.bus service + webhooks service) :crit, w1_eb, after w1_db, 1d
    Security Fixes (DELETE auth, stats isolation, endpoint protection) :w1_sec, 2025-11-14, 1d
    Notification Templates (DB seeding + service setup) :w1_notif, 2025-11-15, 1d
    Background Jobs (warranty expiration worker + registration) :crit, w1_jobs, after w1_notif, 1d
    Week 1 Testing & Validation :w1_test, after w1_jobs, 1d

    section Week 2: Core APIs & Integration
    Warranty CRUD APIs (POST, GET, PUT, DELETE endpoints) :crit, w2_warranty, after w1_eb, 2d
    Warranty Expiring Endpoint (GET /warranties/expiring with filtering) :crit, w2_expiring, after w2_warranty, 1d
    Home Assistant Webhook Setup (integration registration + validation) :w2_ha_setup, after w2_warranty, 1d
    Home Assistant Event Forwarding (webhook delivery + retry logic) :w2_ha_fwd, after w2_ha_setup, 2d
    MQTT Integration (optional stretch goal) :crit_optional, w2_mqtt, after w2_ha_fwd, 1d
    Camera Integration (optional stretch goal) :crit_optional, w2_camera, after w2_mqtt, 1d
    Week 2 Integration Testing :w2_test, after w2_expiring, 4d

    section Week 3: Automation & UX
    Sale Workflow Service (initiate, generate package, transfer) :crit, w3_sale, after w2_warranty, 2d
    As-Built Package Generator (ZIP creation, folder organization) :crit, w3_package, after w3_sale, 1d
    Email Service Setup (Nodemailer + templates) :w3_email, 2025-11-29, 1d
    SMS Gateway Integration (Twilio research + implementation) :w3_sms, after w3_email, 1d
    In-App Notification Center (DB table + API endpoints) :w3_inapp, after w3_sms, 1d
    Push Notifications (Service worker + Web Push API) :w3_push, after w3_inapp, 1d
    Offline Mode & Caching (service worker + IndexedDB) :w3_offline, 2025-12-01, 1d
    Week 3 E2E Testing :w3_test, after w3_package, 3d

    section Week 4: Polish & Deploy
    MLS Integration - YachtWorld (API research + client setup) :w4_mls1, 2025-12-04, 1d
    MLS Integration - Boat Trader (API integration + abstraction layer) :w4_mls2, after w4_mls1, 1d
    MLS Sync Background Job (daily sync scheduling) :w4_mls_job, after w4_mls2, 1d
    E2E Test Suite - Critical Flows (Playwright setup) :crit, w4_e2e, after w3_test, 1d
    Security Audit (OWASP + auth/authz review) :crit, w4_audit, after w4_e2e, 1d
    Pre-Deployment Checklist (backups, env vars, SSL) :crit, w4_precheck, after w4_audit, 1d
    Production Deployment (migrations, code deploy, restart) :crit, w4_deploy, after w4_precheck, 1d
    Post-Deployment Validation (smoke tests + monitoring) :crit, w4_smoke, after w4_deploy, 1d
    Riviera Pilot Setup (demo account, training, HA config) :w4_pilot, after w4_smoke, 2d
```

---

## Critical Path Analysis

### Primary Critical Path (24 days, ~18-19 work days)
```
Week 1:
  Day 1  → DB Migrations (1d)
  Day 2  → Event Bus (1d)
  Day 4  → Notification Templates (1d)
  Day 5  → Background Jobs (1d)
  Day 6  → Week 1 Testing (1d)

Week 2:
  Day 7-8   → Warranty APIs (2d)
  Day 9     → Warranty Expiring Endpoint (1d)
  Day 10-11 → HA Integration (2d basic, optional +1d MQTT, +1d Camera)
  Day 12-14 → Integration Testing (3d)

Week 3:
  Day 15-16 → Sale Workflow (2d)
  Day 17    → Package Generator (1d)
  Day 18    → Email Service (1d)
  Day 19-21 → Notification System (3d)
  Day 22    → Offline Mode (1d)

Week 4:
  Day 23    → E2E Test Suite (1d)
  Day 24    → Security Audit (1d)
  Day 25    → Pre-Deploy Checklist (1d)
  Day 26    → Production Deploy (1d)
  Day 27    → Post-Deploy Validation (1d)

TOTAL: 27 calendar days, ~19-20 work days
```

### Why This Is Critical
1. **DB Migrations** must complete first (blocks all APIs)
2. **Event Bus** must follow immediately (blocks async notifications)
3. **Background Jobs** depends on both (warranty expiration worker)
4. **Warranty APIs** depend on DB + Jobs (foundation for Week 2+)
5. **E2E Testing** depends on all feature implementation
6. **Deployment** depends on passing security audit + smoke tests

### Slack Analysis
- **Buffer Built In:** 6-8 working days available (assuming 6-8 hrs/day × 27 days)
- **Consumed by Critical Path:** ~19-20 days
- **Available Slack:** 3-5 days for blockers/unknowns
- **Weekly Buffer:** 1 day/week = 4 days total

---

## Parallel Work Opportunities

### Opportunity 1: Week 2 - Home Assistant + Optional Features (4-5 days)
**Window:** Days 8-14 (after Warranty APIs complete)

**Parallel Track A (Required):**
- Warranty APIs (CRUD) → 2 days
- Warranty Expiring Endpoint → 1 day
- Integration Tests → 2-3 days

**Parallel Track B (Can overlap with Track A from Day 9+):**
- Home Assistant Webhook Setup → 1 day
- Home Assistant Event Forwarding → 2 days
- *(Optional)* MQTT Integration → 1 day
- *(Optional)* Camera Integration → 1 day

**Recommendation:** Keep as sequential given solo developer constraint. If split into 2 developers:
- Dev 1: Warranty APIs + Testing
- Dev 2: HA Integration + Optional features (in parallel)

**Time Saved:** 1-2 days if parallelized

---

### Opportunity 2: Week 3 - Sale Workflow + Notification System (5-6 days)
**Window:** Days 15-22 (after Week 2 complete)

**Parallel Track A (Required):**
- Sale Workflow → 2 days
- Package Generator → 1 day
- Integration Testing → 2-3 days

**Parallel Track B (Can overlap from Day 18+):**
- Email Service → 1 day
- SMS Gateway → 1 day
- In-App Notifications → 1 day
- Push Notifications → 1 day

**Recommendation:** Sequential for solo developer. Potential parallelization:
- Dev 1: Sale Workflow + Package Generator + Testing
- Dev 2: Notification System (Email, SMS, In-App, Push)

**Time Saved:** 1-2 days if parallelized

---

### Opportunity 3: Week 4 - MLS Integration (Optional Deferral)
**Window:** Days 23-26 (first 2 days of Week 4)

**Status:** Non-critical path
- Can be deferred to Week 5/post-release
- Does NOT block deployment
- Adds 2-3 days to schedule if included
- Should only proceed if ahead of schedule

**Recommendation:** Mark as "nice-to-have" and defer if timeline slips

---

## Risk Areas & Blockers

### Risk 1: Home Assistant Webhook Validation Unknown (Medium Risk)
**Description:** HA webhook reachability check may fail or have undocumented requirements
**Impact:** 1-2 day delay if validation logic needs rework
**Mitigation:**
- Day 9 afternoon: Spike on HA webhook requirements (2-4 hours research)
- Set up test HA instance locally for validation
- Have fallback: skip validation if unreachable (defer to Week 4)
- **Contingency Time:** 0.5 day slack allocated

---

### Risk 2: Database Migration Edge Cases (Medium Risk)
**Description:** SQLite migration rollback may have issues with foreign keys/cascading deletes
**Impact:** 0.5-1 day delay if rollback testing reveals issues
**Mitigation:**
- Day 1 afternoon: Run test rollback on all 3 migrations
- Validate indexes created correctly
- Document any SQLite-specific gotchas
- **Contingency Time:** 0.5 day slack allocated

---

### Risk 3: OWASP Dependency Scan Failures (Medium Risk)
**Description:** npm audit may find critical vulnerabilities blocking deployment
**Impact:** 1-2 days delay for patching/workarounds
**Mitigation:**
- Run audit on Day 1 (get baseline)
- Schedule security audit for Day 24, not Day 27
- Update dependencies early (Week 1)
- Have rollback plan for breaking updates
- **Contingency Time:** 1 day slack allocated

---

### Risk 4: Playwright E2E Setup Complexity (Low Risk)
**Description:** E2E test framework setup may be more complex than estimated (2-4 hrs)
**Impact:** 0.5 day delay if setup takes longer
**Mitigation:**
- Use Playwright templates/examples
- Start E2E suite on Day 22 (not Day 23)
- Have pre-built critical flow test cases
- **Contingency Time:** 0.5 day slack allocated

---

### Risk 5: Production Deployment Issues (High Risk)
**Description:** Database migration in production may fail, or code may crash on startup
**Impact:** 2-4 hours delay + potential rollback (half day)
**Mitigation:**
- Test full migration → code deploy → restart flow on staging (Day 25)
- Automated smoke tests running before deployment
- Runbook with rollback steps prepared (Day 25)
- Keep developer available for 24 hours post-deploy (Dec 9)
- **Contingency Time:** Contingency is the post-deploy validation day

---

## Slack Time Distribution

### Total Available Time: 200 hours (6-8 hrs/day × 27 days)
### Critical Path Actual Work: ~150-160 hours

**Slack Allocation:**

| Week | Available | Critical | Slack | Risk Buffer |
|------|-----------|----------|-------|-------------|
| W1   | 40-50 hrs | 30-35 hrs | 5-10 hrs | DB/EB migrations |
| W2   | 40-50 hrs | 35-40 hrs | 0-5 hrs | HA spike, testing |
| W3   | 40-50 hrs | 35-40 hrs | 0-5 hrs | Notification overlap |
| W4   | 40-50 hrs | 20-25 hrs | 15-20 hrs | MLS optional, smoke tests |

**Weekly Slack Reserves:**
- Week 1: 1 full day for DB/migration issues
- Week 2: 0.5 day for HA validation spike
- Week 3: 0.5 day for testing overflow
- Week 4: 1.5 days (MLS is optional, smoke tests have buffer)

**Total Contingency Buffer:** 3.5 days (28 hours) = **18% buffer**

---

## Critical Task Dependencies (Dependency Matrix)

| Task | Depends On | Duration | Slack | Risk Level |
|------|-----------|----------|-------|-----------|
| DB Migrations | None | 1d | 0d | CRITICAL |
| Event Bus | DB Migrations | 1d | 0d | CRITICAL |
| Security Fixes | None | 1d | 0.5d | MEDIUM |
| Notification Templates | None | 1d | 0.5d | LOW |
| Background Jobs | Event Bus + Notification | 1d | 0d | CRITICAL |
| Week 1 Testing | All W1 tasks | 1d | 0d | CRITICAL |
| Warranty APIs | DB Migrations | 2d | 0.5d | CRITICAL |
| Warranty Expiring | Warranty APIs | 1d | 0.5d | MEDIUM |
| HA Webhook | Webhook table (DB) | 1d | 1d | MEDIUM (unknown spike risk) |
| HA Event Forward | HA Webhook | 2d | 0d | MEDIUM |
| Sale Workflow | DB (sale_workflows table) | 2d | 0.5d | CRITICAL |
| Package Generator | Sale Workflow | 1d | 0.5d | LOW |
| Notification System | Email Service | 3d | 1d | LOW |
| Offline Mode | Vue 3 + Service Worker | 1d | 1d | LOW |
| E2E Testing | All features | 1d | 0.5d | MEDIUM |
| Security Audit | All code | 1d | 0d | CRITICAL |
| Pre-Deploy | Security Audit pass | 1d | 0d | CRITICAL |
| Deployment | Pre-Deploy OK | 1d | 0d | CRITICAL |
| Post-Deploy | Deployment OK | 1d | 0d | CRITICAL |

---

## Risk Mitigation Strategies

### Strategy 1: Daily Risk Check-In (Lightweight)
**Every morning (10 min):**
- Check: Is DB/Event Bus/Background Jobs on track? (if no → escalate)
- Check: Any unknowns surfaced in optional features? (HA, MQTT, Camera)
- Check: Test failures blocking next day's work?
- Action: If blocked, pull from slack day or defer optional feature

**Responsible:** Developer + optionally S4-H10 (Deployment Checklist Creator)

---

### Strategy 2: Pre-Spike Research Days (Early Risk Reduction)
**Allocate "spike days" for unknowns before critical path:**

| Day | Spike Duration | Focus Area | Outcome |
|-----|---|---|---|
| Nov 13 PM (4 hrs) | Audit HA webhook API | Identify reachability check approach | Clear spec or fallback plan |
| Nov 14 PM (2 hrs) | OWASP scan baseline | Identify dependencies with issues | Remediation plan |
| Nov 21 PM (2 hrs) | Playwright setup test | Verify test config works | Confirmed setup approach |
| Nov 28 PM (2 hrs) | Email service selection | Nodemailer vs alternatives | Selected + configured |

**Impact:** 10 hours of research saves 2-3 days of debugging later

---

### Strategy 3: Optional Feature Deferral Plan
**If schedule slips, defer in this order:**

1. **Defer MQTT Integration** (Day 10) → +1 day slack
2. **Defer Camera Integration** (Day 10) → +1 day slack
3. **Defer MLS Integration** (Days 23-26) → +3 days slack
4. **Defer Riviera Pilot Training** (Days 28-29) → +1 day slack

**Contingency Capacity:** 6 days of deferrable work = can handle 2-3 day overrun

---

### Strategy 4: Test-Driven Fallback (Quality Gate)
**If Day 24 security audit fails critical vulnerabilities:**
1. Fix critical issues (max 1 day)
2. Re-run audit
3. If still failing → defer MLS integration → gain 2-3 days
4. Continue with deployment path

**Goal:** Avoid shipping known critical vulns

---

### Strategy 5: Database Rollback Drills
**Pre-Deploy (Day 25):**
- Practice full rollback sequence on staging
- Time rollback operation (target: <10 min)
- Verify all migrations rollback cleanly
- Document any manual steps needed

**Impact:** 2-3 hours investment saves hours of production firefighting

---

## Parallel Work Recommendations

### For Solo Developer (Current Plan)
- **Recommendation:** Keep as sequential
- **Reason:**
  - Context switching overhead 15-20% on solo developer
  - Feature dependencies are deep (DB → APIs → Features)
  - Testing/validation easier if focused on 1-2 features at a time
- **Flexibility:** Use slack days to parallelize if ahead of schedule

### If Extended to 2 Developers (Ideal)
```
Developer 1: Database + Event Bus + Warranty APIs
Developer 2: Security Fixes + Notifications + HA Integration (parallel from Day 7)

Week 2-3:
Developer 1: Sale Workflow + E2E Testing
Developer 2: Notification System + Offline Mode (parallel from Day 17)

Week 4:
Developer 1: Security Audit + Deployment
Developer 2: MLS Integration (optional)
```

**Time Saved:** 2-3 days with 2-person team

---

## Weekly Milestones & Go/No-Go Gates

### End of Week 1 (Nov 16, Friday EOD) - GATE 1
**Deliverables Required:**
- [ ] All 3 migrations (warranty_tracking, sale_workflows, webhooks) created + tested
- [ ] Event bus service implementation complete + passing unit tests
- [ ] Background jobs registered + warranty expiration worker passing integration tests
- [ ] Security fixes applied (3/5 prioritized)
- [ ] Week 1 acceptance criteria 90%+ passing

**Go Criteria:** All critical items complete, <1 day behind schedule
**No-Go Criteria:** DB migrations unstable OR Event Bus failing tests
**If No-Go:** Pause Week 2 work, fix blockers, escalate to S4-H10

---

### End of Week 2 (Nov 23, Friday EOD) - GATE 2
**Deliverables Required:**
- [ ] Warranty APIs complete (CRUD + expiring endpoint)
- [ ] Home Assistant integration basic version (webhook registration + event forwarding)
- [ ] Integration tests passing (80%+ coverage)
- [ ] Optional features (MQTT, Camera) deferred or 50%+ complete

**Go Criteria:** Warranty APIs stable, HA integration working
**No-Go Criteria:** Warranty APIs failing tests OR HA webhook unreachable
**If No-Go:** Defer optional features, focus on core APIs, escalate

---

### End of Week 3 (Nov 30, Friday EOD) - GATE 3
**Deliverables Required:**
- [ ] Sale workflow complete (initiate → generate → transfer)
- [ ] Notification system 90%+ complete (email + SMS + in-app + push)
- [ ] Offline mode working for critical manuals
- [ ] E2E test suite skeleton ready

**Go Criteria:** Sale workflow + notifications stable, offline mode working
**No-Go Criteria:** Sale workflow failing OR notification system unreliable
**If No-Go:** Defer Riviera pilot, focus on core features, extend Week 4

---

### End of Week 4 (Dec 10, Wednesday EOD) - GATE 4 (FINAL)
**Deliverables Required:**
- [ ] All features deployed to production
- [ ] E2E tests passing (10 critical flows)
- [ ] Security audit passed (no high/critical vulns)
- [ ] Post-deployment validation complete
- [ ] Riviera pilot account set up OR deferred to Week 5

**Go Criteria:** Production deployment successful, smoke tests passing
**No-Go Criteria:** Post-deploy validation failing OR critical issues found
**If No-Go:** Rollback to previous version, debug issues, re-deploy Dec 11-12

---

## Communication Protocol (IF.bus)

### Message Pattern: Dependency Updates
When a task completes, send dependency notification to downstream agents:

**Example (Day 1 EOD):**
```json
{
  "performative": "inform",
  "sender": "if://agent/session-4/S4-H01",
  "receiver": ["if://agent/session-4/S4-H02", "if://agent/session-4/S4-H07"],
  "content": {
    "claim": "DB migrations complete - warranty_tracking, webhooks, sale_workflows tables created",
    "evidence": ["3 migrations tested", "rollback scripts verified"],
    "confidence": 0.95,
    "unblocks": ["Warranty APIs", "Event Bus service", "Sale Workflow APIs"],
    "blockers": [],
    "ready_for_week_2": true
  }
}
```

### Gate Status Messages (Weekly)
**Every Friday EOD, send gate status to S4-H10:**
```
performative: "inform" or "disconfirm"
content:
  week: N
  gate_status: "GO" | "NO-GO"
  deliverables_complete: X/Y
  critical_blockers: []
  schedule_delta: "+1d" | "on-time" | "-1d"
  recommendation: "proceed" | "extend week N" | "defer optional feature X"
```

---

## Metrics & Tracking

### Tracked Metrics (Daily)
- Hours spent on critical path vs. actual time available
- Number of test failures by type (unit, integration, E2E)
- Blocker count (active issues blocking progress)
- Code coverage % for core services

### Tracked Metrics (Weekly)
- Critical path burn-down (% complete vs. planned)
- Slack time consumed vs. available
- Features deferred (if any)
- Risk status (new blockers surfaced)

### Rollup Reports (EOW)
**To:** S4-H10 (Deployment Checklist Creator)
**Format:**
```markdown
## Week N Status Report
- Planned Work: [list of tasks]
- Completed: X/Y tasks
- Critical Path Status: On-track | +1d | +2d+
- Blockers: [list of active issues]
- Next Week Readiness: [go/no-go]
```

---

## Summary: Timeline at a Glance

```
Week 1 (Nov 13-19)    Foundation    [████████░] 90% foundation ready
                      Migrations, Event Bus, Security, Background Jobs

Week 2 (Nov 20-26)    Core APIs     [████░░░░░] 70% APIs + integrations
                      Warranty APIs, HA Integration, Testing

Week 3 (Nov 27-Dec 3) Automation    [██████░░░] 60% features + notifications
                      Sale Workflow, Notifications, Offline

Week 4 (Dec 4-10)     Polish/Deploy [███████░░] 80% ready for production
                      E2E Tests, Security Audit, Deployment

CRITICAL PATH:        DB → EB → Jobs → APIs → E2E → Deploy (27 days)
SLACK BUFFER:         3-5 days available
RISK LEVEL:           MEDIUM (Home Assistant unknowns, security audit)
```

---

## Appendix: Dependency Graph (Visual Reference)

```
Week 1 (Foundation)
┌─────────────────────────────────────────┐
│ DB Migrations                           │ Day 1 (CRITICAL)
│ ↓                                       │
│ Event Bus Service                       │ Day 2 (CRITICAL)
│ ├─→ Background Jobs Worker              │ Day 5 (CRITICAL)
│ └─→ Webhook Service                     │
│ ↓                                       │
│ Security Fixes (parallel, Day 3)        │
│ Notification Templates (parallel, Day 4)│
│ ↓                                       │
│ Week 1 Testing                          │ Day 6 (GATE 1)
└─────────────────────────────────────────┘

Week 2 (APIs)
┌─────────────────────────────────────────┐
│ Warranty APIs (CRUD)                    │ Days 7-8 (CRITICAL)
│ ├─→ Warranty Expiring Endpoint          │ Day 9
│ ├─→ Home Assistant Setup                │ Day 9 (parallel)
│ │   ├─→ HA Event Forwarding             │ Days 10-11
│ │   ├─→ MQTT (optional)                 │ Day 11
│ │   └─→ Camera (optional)               │ Day 12
│ └─→ Integration Testing                 │ Days 12-14 (GATE 2)
└─────────────────────────────────────────┘

Week 3 (Features)
┌─────────────────────────────────────────┐
│ Sale Workflow                           │ Days 15-16 (CRITICAL)
│ ├─→ Package Generator                   │ Day 17
│ ├─→ Email Service                       │ Day 18 (parallel)
│ │   ├─→ SMS Gateway                     │ Day 19
│ │   ├─→ In-App Notifications            │ Day 20
│ │   └─→ Push Notifications              │ Day 21
│ ├─→ Offline Mode                        │ Day 22 (parallel)
│ └─→ E2E Testing                         │ Days 21-23 (GATE 3)
└─────────────────────────────────────────┘

Week 4 (Deploy)
┌─────────────────────────────────────────┐
│ Security Audit                          │ Day 24 (CRITICAL)
│ ├─→ Pre-Deploy Checklist                │ Day 25 (CRITICAL)
│ │   └─→ Production Deploy               │ Day 26 (CRITICAL)
│ │       └─→ Post-Deploy Validation      │ Day 27 (GATE 4)
│ └─→ MLS Integration (optional, Days 23-26)
│ Riviera Pilot (optional, Days 27-28)
└─────────────────────────────────────────┘
```

---

**Document Status:** Final
**Confidence Level:** 0.92 (high confidence given detailed task specs in planning doc)
**Next Step:** Share with S4-H10 via IF.bus "inform" message (critical path identified)
