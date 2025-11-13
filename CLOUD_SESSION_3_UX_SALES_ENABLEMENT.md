# Cloud Session 3: UX/Sales Enablement
## NaviDocs Riviera Plaisance Pitch Materials

**Session Type:** UX Designer + Sales Strategist
**Lead Agent:** Sonnet (design + persuasion)
**Swarm Size:** 10 Haiku agents
**Token Budget:** $15 (7.5K Sonnet + 50K Haiku)
**Output:** Pitch deck + demo script + ROI calculator

---

## Mission Statement

Create sales pitch demonstrating **NaviDocs as sticky daily-use app** (not passive doc vault) that owners actually use because it solves real problems: inventory tracking, camera monitoring, maintenance reminders, expense visibility.

---

## Context (Read First)

**Prerequisites:**
1. Read `intelligence/session-1/session-1-market-analysis.md`
2. Read `intelligence/session-2/session-2-architecture.md`
3. Read `intelligence/session-2/session-2-sprint-plan.md`

**Meeting Context:**
- Audience: Sylvain (Riviera Plaisance yacht sales agent)
- Goal: Include NaviDocs with every boat sale
- Time: 15-minute presentation + 5-minute demo
- Constraints: Technical audience (understands marine documentation)

**Key Value Propositions (Sticky Engagement Model):**
- **For Owners (daily use):** Camera check, maintenance reminders, expense tracking, crew contacts
- **For Owners (resale):** Inventory tracking prevents €15K-€50K forgotten value
- **For Brokers:** Sticky product = owners refer friends = more sales for Sylvain
- **Differentiation:** Only boat app with daily engagement + perfect documentation
- **Business model:** Included with every Riviera boat (Tesla app model)

---


## Agent Identity & Check-In Protocol

**YOU ARE:** Sonnet coordinator for Session 3 (UX/Sales)

**YOUR HAIKU SWARM:** You have 10 Haiku agents available. Use as many as needed (not required to use all 10).

**AGENT IDENTITY SYSTEM:**
When spawning a Haiku agent, assign it an identity: `S3-H01` through `S3-H10`
Each agent MUST:
1. **Check in** at start: "I am S3-H03, assigned to [task name]"
2. **Reference their task** by searching this document for "Agent 3:" (matching their number)
3. **Retain identity** throughout execution
4. **Report completion** with identity: "S3-H03 complete: [deliverable summary]"

**TASK DEPENDENCIES:**
- Most agents can run in parallel
- Agent 10 typically synthesizes results from Agents 1-9 (must wait for completion)

---

## Your Tasks (Spawn 10 Haiku Agents in Parallel)

### Agent 1: Pitch Deck Structure (Sticky Engagement Focus)
**AGENT ID:** S3-H01
**
**Design:**
- Slide 1: Problem - "Owners ignore passive doc vaults" (show app abandonment stats)
- Slide 2: Solution - "Daily-use app they actually open" (camera, maintenance, inventory)
- Slide 3: Sticky features demo - Camera check, maintenance reminder, expense tracking
- Slide 4: Resale value protection - €15K-€50K inventory tracking ROI
- Slide 5: Broker benefit - Sticky product = referrals = more Riviera sales
- Slide 6: Business model - Included with every boat (like Tesla app)
- Slide 7: 4-week timeline + pilot program

**Deliverable:** Pitch deck emphasizing daily engagement, NOT passive documentation

### Agent 2: Demo Script Writer (Daily Use Scenarios)
**AGENT ID:** S3-H02
**
**Create:**
- 5-minute demo showing DAILY engagement (not just sale-time docs)
- Screen 1: Camera check - "Is my boat OK?" (2 mins)
- Screen 2: Maintenance reminder - "Engine service due" (1 min)
- Screen 3: Inventory search - "Find tender warranty" with impeccable UX (1 min)
- Screen 4: Expense tracking - "I've spent €18K this year" (1 min)
- Key message: Owners open this app WEEKLY, not just at resale

**Deliverable:** Demo script showing sticky engagement, NOT passive vault

### Agent 3: ROI Calculator Designer (Inventory Focus)
**AGENT ID:** S3-H03
**
**Build:**
- Input fields: boat purchase price, annual upgrades (€5K-€20K typical)
- Inventory forgotten at resale: tender €15K, electronics €8K, blinds €3K
- Total forgotten value over 10-year ownership: €30K-€50K
- NaviDocs cost: €15/month × 120 months = €1,800
- ROI: €30K-€50K saved - €1.8K cost = €28K-€48K net benefit
- Comparison: With vs without inventory tracking

**Deliverable:** ROI calculator showing inventory tracking value (primary) + maintenance reminders (secondary)

### Agent 4: Objection Handling Playbook
**AGENT ID:** S3-H04
**
**Research:**
- Common broker objections (from Session 1 research)
- Responses with data backing
- Competitive differentiation points
- Risk mitigation talking points

**Deliverable:** Objection handling guide (Q&A format)

### Agent 5: Pricing Strategy Presentation
**AGENT ID:** S3-H05
**
**Design:**
- Per-yacht pricing model (€50-€200/yacht)
- Brokerage bulk pricing (10+ yachts)
- One-time setup fee vs recurring
- Free pilot program offer (Riviera Plaisance)

**Deliverable:** Pricing slide with 3 tiers

### Agent 6: Competitive Differentiation
**AGENT ID:** S3-H06
**
**Compile:**
- NaviDocs vs 5 top competitors (from Session 1)
- Feature comparison table
- Unique selling points (Home Assistant, multi-jurisdiction)
- Visual comparison matrix

**Deliverable:** Competitive matrix slide

### Agent 7: Technical Architecture Visualization
**AGENT ID:** S3-H07
**
**Create:**
- System architecture diagram (non-technical)
- Integration points (Home Assistant, cameras, offline)
- Data flow (document upload → OCR → warranty tracking → alerts)
- Security highlights (multi-tenant, encrypted)

**Deliverable:** Architecture diagram (Mermaid or visual)

### Agent 8: Case Study Writer
**AGENT ID:** S3-H08
**
**Draft:**
- Hypothetical yacht sale scenario
- Before NaviDocs: 6 hours documentation prep, €8K warranty miss
- After NaviDocs: 20-minute automated package, €33K warranty captured
- Buyer satisfaction increase

**Deliverable:** One-page case study

### Agent 9: Visual Design System
**AGENT ID:** S3-H09
**
**Define:**
- Color palette (nautical theme: blues, whites)
- Typography (readable, professional)
- Icon set (warranties, documents, alerts)
- Slide layout templates

**Deliverable:** Design system guide

### Agent 10: Sales Collateral Package
**AGENT ID:** S3-H10
**
**Compile:**
- One-pager (leave-behind document)
- Email follow-up template
- Pilot program agreement draft
- Next steps checklist

**Deliverable:** Sales collateral bundle

---

## Intra-Agent Communication Protocol (IF.bus)

**Based on:** InfraFabric S² multi-swarm coordination (3,563x faster than git polling)

### IFMessage Schema

Every agent-to-agent message follows this structure:

```json
{
  "performative": "inform",  // FIPA-ACL: inform, request, query-if, confirm, disconfirm, ESCALATE
  "sender": "if://agent/session-3/haiku-Y",
  "receiver": ["if://agent/session-3/haiku-Z"],
  "conversation_id": "if://conversation/navidocs-session-3-2025-11-13",
  "content": {
    "claim": "[Your pitch/objection finding]",
    "evidence": ["[Market data, competitor analysis, customer research]"],
    "confidence": 0.85,  // 0.0-1.0
    "cost_tokens": 1247
  },
  "citation_ids": ["if://citation/uuid"],
  "timestamp": "2025-11-13T10:00:00Z",
  "sequence_num": 1
}
```

### Speech Acts (Performatives)

**inform:** Share pitch content or objection research
- Example: "S3-H01 informs S3-H05: Pitch emphasizes €8K-€33K warranty savings"

**request:** Ask another agent for market validation
- Example: "S3-H03 requests S3-H05: Validate ROI assumptions with competitor pricing"

**disconfirm:** Challenge pitch claim with evidence
- Example: "S3-H05 disconfirms S3-H01: Warranty savings claim needs 2nd source (only €8K cited)"

**confirm:** Validate pitch claim with external evidence
- Example: "S3-H06 confirms S3-H03: ROI calculator inputs match Session 1 research"

**ESCALATE:** Flag critical objection that requires resolution
- Example: "S3-H05 ESCALATES: Broker pricing objection not addressed in pitch"

### Communication Flow (This Session)

```
S3-H01 (Pitch) ──→ S3-H05 (Objections) ──→ S3-H10 (adversarial testing)
S3-H03 (ROI) ────→ S3-H05 (Validate) ────→ S3-H10
S3-H04 (Demo) ───→ S3-H06 (Case Study) ──→ S3-H10
```

**Key Patterns:**
1. **Pitch → Objection:** Agent 5 challenges every pitch claim with real objections
2. **ROI → Validation:** Agent 5 verifies ROI assumptions with Session 1 market data
3. **Demo → Testing:** Agent 6 checks if demo matches real-world success stories
4. **Agent 10 Synthesis:** Ensures pitch is airtight before presentation

### Adversarial Testing Example

```yaml
# Agent 1 (Pitch Deck) proposes value proposition
S3-H01: "inform" → content:
  claim: "NaviDocs enables €8K-€33K warranty savings per yacht"
  evidence: ["Session 1 market analysis"]
  confidence: 0.85

# Agent 5 (Objections) challenges claim completeness
S3-H05: "disconfirm" → content:
  original_claim: "€8K-€33K warranty savings"
  objection: "Which brokers actually claim this? Need real testimonials, not estimates"
  requested_change: "Find 2 brokers who missed €8K+ warranties. Use as proof point."
  evidence: ["Broker interviews required"]

# Agent 1 strengthens claim
S3-H01: "confirm" → content:
  revised_claim: "NaviDocs prevents warranty losses (case study: Broker X missed €15K tender)"
  evidence: [
    "Broker interview transcript",
    "YachtWorld resale comparison (boat with/without tender)",
    "Session 1 pain point research"
  ]
  confidence: 0.95
```

### ROI Calculator Validation Example

```yaml
# Agent 3 (ROI Calculator) proposes model
S3-H03: "propose" → content:
  calculation: "ROI = (Warranty Savings + Time Savings) - NaviDocs Cost"
  inputs: {
    warranty_savings: "€8K-€33K per yacht",
    time_savings: "6 hours manual → 20 minutes automated",
    navidocs_cost: "€15/month × 120 months"
  }

# Agent 5 (Objections) validates assumptions
S3-H05: "query-if" → content:
  question: "Are time savings (6→20 mins) validated with actual brokers?"
  reasoning: "If brokers claim 8 hours, our 20-min estimate is unrealistic"
  request: "Get time commitment estimate from Sylvain or 2 other Riviera brokers"

# Agent 3 confirms with validation
S3-H03: "confirm" → content:
  validated_inputs: {
    time_savings: "Confirmed: Riviera broker spends 5.5 hours on doc prep (conservatively estimate 4 hours savings)"
  }
  revised_roi: "(Warranty €8K-€33K) + (Time €200-€600/sale) - €1800/year"
  confidence: 0.92
```

### Demo Script Credibility Example

```yaml
# Agent 4 (Demo Script) proposes key screens
S3-H04: "propose" → content:
  screens: ["Dashboard", "Warranty Detail", "Claim Package", "Home Assistant"]
  timing: "5 minutes total"

# Agent 6 (Case Study) challenges realism
S3-H06: "disconfirm" → content:
  concern: "Demo shows perfect claim package generation (15 mins), but real workflow?"
  challenge: "What if boat has missing docs? Demo assumes complete warranty archive."
  recommendation: "Add realistic scenario: Missing engine receipt, still generates partial claim"

# Agent 4 revises demo
S3-H04: "agree" → content:
  revised_demo: "Screen 1: Complete case (Azimut 55S) - best case, Screen 2: Sunseeker 40 with missing docs - realistic case"
  messaging: "NaviDocs works even with incomplete records, fills gaps intelligently"
```

### IF.TTT Compliance

Every message MUST include:
- **citation_ids:** Links to Session 1 research, competitor analysis
- **confidence:** Explicit score (0.0-1.0)
- **evidence:** Market data, broker interviews, case studies
- **cost_tokens:** Token consumption (IF.optimise tracking)

---

## Presentation Flow (15 Minutes)

### Opening (2 minutes)
- **Hook:** "How much is €33,000 worth to you on a single yacht sale?"
- **Problem:** Brokers lose 6 hours per sale to documentation, miss warranty claims
- **Credibility:** NaviDocs is production-ready, multi-tenant architecture

### Market Opportunity (3 minutes)
- **Market size:** [Session 1 findings]
- **Broker pain points:** Manual documentation, jurisdictional complexity
- **Buyer expectations:** Turnkey documentation packages increase sale value

### NaviDocs Solution (5 minutes)
- **Core features:** OCR, warranty tracking, expiration alerts, claim generation
- **Integration:** Home Assistant (remote monitoring), offline mode (onboard access)
- **Automation:** As-built package (6 hours → 20 minutes)

### ROI Demonstration (3 minutes)
- **Warranty savings:** €8K-€33K per yacht (calculator demo)
- **Time savings:** 6 hours manual → 20 minutes automated
- **Value proposition:** Include NaviDocs with every sale = premium service

### Implementation Plan (2 minutes)
- **Timeline:** 4-week sprint (foundation → deploy)
- **Pilot program:** Free for Riviera Plaisance (first 5 yachts)
- **Support:** Onboarding, training, ongoing maintenance

---

## Demo Script (5 Minutes)

### Screen 1: Dashboard (30 seconds)
**Show:** Multi-yacht overview, warranty status indicators
**Say:** "Broker sees all yachts, warranty expiration alerts at a glance"

### Screen 2: Yacht Detail (1 minute)
**Show:** Single yacht, document library, warranty timeline
**Say:** "€400K-€800K in active warranties tracked, expiration alerts prevent €8K-€33K losses"

### Screen 3: Warranty Alert (1 minute)
**Show:** 30-day expiration warning, claim package generator
**Say:** "System alerts 90, 30, 14 days before expiration, auto-generates claim package"

### Screen 4: Claim Package (1 minute)
**Show:** PDF with warranty docs, invoice, jurisdiction-specific forms
**Say:** "6 hours manual work → 15 minutes automated, jurisdiction-aware (France, Italy, Spain, etc.)"

### Screen 5: Home Assistant Integration (1 minute)
**Show:** Webhook configuration, camera feed integration
**Say:** "Remote monitoring, onboard sensors, security cameras integrated"

### Screen 6: Offline Mode (30 seconds)
**Show:** Service worker, critical manual access
**Say:** "Works onboard without internet, syncs when online"

---

## ROI Calculator Specifications

### Input Fields
1. **Yacht Purchase Price** (€300K - €5M)
2. **Number of Active Warranties** (10-50 typical)
3. **Average Warranty Value** (€8K - €50K)
4. **Annual Warranty Claims Expected** (1-5)
5. **Broker Documentation Hours/Sale** (6 hours typical)
6. **Broker Hourly Rate** (€50-€150)

### Calculations
- **Warranty Savings (3 years):** Claims × Success Rate Increase × Avg Value
- **Time Savings (3 years):** Hours Saved × Hourly Rate × Sales/Year
- **Missed Claim Prevention:** (1 - NaviDocs) × Claim Value × 3 Years
- **Total ROI:** (Savings + Time) - NaviDocs Cost

### Output Display
- **3-Year Total Savings:** €XX,XXX
- **Break-Even Point:** X months
- **ROI Percentage:** XXX%
- **Comparison Chart:** Manual vs Automated

---

## Objection Handling Playbook

### Objection 1: "We already have a documentation system"
**Response:**
- "How does it handle warranty expiration alerts?"
- "Can it generate jurisdiction-specific claim packages?"
- NaviDocs integrates with existing CRM (Salesforce, HubSpot)

### Objection 2: "Too expensive for our brokerage"
**Response:**
- ROI calculator shows break-even in [X] months
- Free pilot program (first 5 yachts)
- Per-yacht pricing scales with your business

### Objection 3: "Brokers won't adopt new software"
**Response:**
- 5-minute demo proves ease of use
- Onboarding training included
- Time savings (6 hours → 20 minutes) drives adoption

### Objection 4: "What about data security?"
**Response:**
- Multi-tenant architecture (isolated databases)
- JWT authentication + bcrypt password hashing
- Audit logging for compliance (GDPR ready)

### Objection 5: "Implementation timeline too long"
**Response:**
- 4-week sprint to production-ready
- Pilot program starts Week 3 (warranty tracking live)
- Incremental rollout (core features first, integrations later)

---

## Pricing Strategy

### Tier 1: Solo Broker
- **Price:** €99/month
- **Included:** Up to 5 yachts, basic warranty tracking, email support
- **Target:** Individual yacht sales agents

### Tier 2: Brokerage
- **Price:** €299/month
- **Included:** Up to 25 yachts, Home Assistant integration, priority support
- **Target:** Small brokerages (Riviera Plaisance)

### Tier 3: Enterprise
- **Price:** Custom (€500+/month)
- **Included:** Unlimited yachts, MLS integration, white-label option, dedicated support
- **Target:** Large brokerages, charter fleets

### Pilot Program (Riviera Plaisance)
- **Offer:** Free Tier 2 for 3 months (first 5 yachts)
- **Commitment:** Feedback, case study participation
- **Conversion:** 50% discount first year if adopted

---

## Output Format

### Deliverable 1: Pitch Deck
**File:** `session-3-pitch-deck.md` (Markdown with Mermaid diagrams)

**Structure:**
```markdown
# NaviDocs Yacht Sales Pitch Deck
## Riviera Plaisance Presentation

### Slide 1: The €33,000 Question
[Hook: warranty tracking ROI]

### Slide 2: Broker Documentation Pain
[Market research from Session 1]

### Slide 3: NaviDocs Solution Overview
[Feature highlights with icons]

### Slide 4: Warranty Tracking ROI
[Calculator demo, €8K-€33K savings]

### Slide 5: Technical Architecture
[Mermaid diagram: Home Assistant, offline mode]

### Slide 6: 4-Week Implementation Roadmap
[Gantt chart from Session 2]

### Slide 7: Pilot Program Offer
[Pricing, free trial, next steps]

**Appendix: Demo Screenshots**
[6 screens with annotations]
```

### Deliverable 2: Demo Script
**File:** `session-3-demo-script.md`

**Structure:**
```markdown
# NaviDocs Live Demo Script (5 Minutes)

## Setup Instructions
- Browser: Chrome/Firefox
- URL: https://demo.navidocs.app
- Login: demo@rivieraplaisance.com / DemoPass123
- Pre-loaded yacht: "Azimut 55S" (€800K, 15 warranties)

## Screen-by-Screen Walkthrough
### [0:00-0:30] Dashboard
**Action:** Show multi-yacht overview
**Say:** "Broker dashboard shows all yachts, warranty status at a glance..."
**Highlight:** Red badge on Azimut (warranty expiring in 28 days)

### [0:30-1:30] Yacht Detail
**Action:** Click Azimut 55S
**Say:** "€760K in active warranties tracked, system prevents €8K-€33K losses..."
**Highlight:** Warranty timeline, document library

[... continue for all 6 screens]
```

### Deliverable 3: ROI Calculator
**File:** `session-3-roi-calculator.html` (web app) or `.xlsx` (spreadsheet)

**Implementation:**
```html
<!DOCTYPE html>
<html>
<head><title>NaviDocs ROI Calculator</title></head>
<body>
  <h1>NaviDocs Yacht Sales ROI Calculator</h1>
  <form id="roi-form">
    <label>Yacht Price (€):</label>
    <input type="number" id="yacht-price" value="800000">

    <label>Active Warranties:</label>
    <input type="number" id="warranty-count" value="15">

    [... all input fields]

    <button onclick="calculateROI()">Calculate ROI</button>
  </form>

  <div id="results">
    <h2>3-Year Savings: €<span id="total-savings"></span></h2>
    <p>Break-Even: <span id="break-even"></span> months</p>
    <canvas id="roi-chart"></canvas>
  </div>

  <script>
    function calculateROI() {
      const yachtPrice = parseFloat(document.getElementById('yacht-price').value);
      const warrantyCount = parseInt(document.getElementById('warranty-count').value);
      // ... calculation logic
    }
  </script>
</body>
</html>
```

### Deliverable 4: Sales Collateral Package
**File:** `session-3-sales-collateral/`

**Files:**
- `one-pager.pdf` - Leave-behind document (1 page, visual)
- `email-follow-up-template.md` - Post-meeting email
- `pilot-agreement.md` - Free trial terms
- `objection-handling.md` - Q&A playbook

---

## IF.TTT Compliance Checklist

- [ ] All ROI calculations cite Session 1 market research
- [ ] Demo script references actual NaviDocs features (verify against codebase)
- [ ] Pricing strategy validated against competitor analysis (Session 1)
- [ ] Technical architecture diagram matches Session 2 specs
- [ ] Evidence artifacts stored in `/intelligence/session-3/`

---

## Success Criteria

**Minimum Viable Output:**
- 7-slide pitch deck (problem → solution → ROI → timeline → pricing)
- 5-minute demo script with screen annotations
- Working ROI calculator (web or spreadsheet)
- Objection handling playbook (5+ objections)

**Stretch Goals:**
- Video demo recording (screencast with voiceover)
- Interactive ROI calculator (embedded in pitch deck)
- Animated architecture diagram (Mermaid with transitions)
- Printed sales collateral (one-pager PDF)

---

**Start Command:** Deploy to Claude Code Cloud after Session 2 complete
**End Condition:** All deliverables committed to `dannystocker/navidocs` repo under `intelligence/session-3/`
