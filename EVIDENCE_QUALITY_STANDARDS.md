# Evidence Quality Standards (IF.TTT Compliance)
## NaviDocs Cloud Sessions - Citation & Verification Requirements

**Agent:** S5-H0A (Evidence Quality Standards)
**Session:** Session 5 - Quality Assurance Partner
**For:** All Sessions 1-4 (Market Research, Technical, Sales, Implementation)
**Version:** 1.0
**Generated:** 2025-11-13

---

## CRITICAL: Read This Before Creating Any Claims

**ALL claims in your session outputs MUST follow these standards.**

Session 5 (Guardian Council) will **reject your handoff** if evidence quality is below threshold.

**Target:** >85% verified claims, average credibility ≥7.5/10

---

## IF.TTT Framework: Two-Source Verification

**Core Principle:** All claims require ≥2 independent sources

### Evidence Status Ladder

```
VERIFIED ✅         →  ≥2 credible sources (credibility ≥5), no contradictions
PROVISIONAL ⚠️      →  1 credible source (credibility ≥8), needs 2nd confirmation
UNVERIFIED ❌       →  0 credible sources or <5 credibility, flagged for review
DISPUTED 🔴        →  Contradictory sources, requires investigation
REVOKED ⛔         →  Proven false, removed from dossier
```

**Your goal:** All claims should be VERIFIED ✅ before handoff

---

## Citation Schema (Required Format)

### Example Citation

```json
{
  "citation_id": "if://citation/navidocs-warranty-savings-2025-11-13",
  "claim": "NaviDocs prevents €8K-€33K warranty losses per yacht",
  "evidence_type": "market_research",
  "sources": [
    {
      "type": "file",
      "path": "/mnt/c/users/setup/downloads/NaviDocs-Medium-Articles.md",
      "line_range": "45-67",
      "git_commit": "abc123def456",
      "quality": "primary",
      "credibility": 9,
      "excerpt": "Yacht owners who track warranties save €8K-€33K per vessel..."
    },
    {
      "type": "file",
      "path": "/home/setup/navidocs/docs/debates/02-yacht-management-features.md",
      "line_range": "120-145",
      "git_commit": "def456ghi789",
      "quality": "primary",
      "credibility": 9,
      "excerpt": "Warranty expiration tracking prevents €15K-€50K forgotten value..."
    }
  ],
  "status": "verified",
  "verification_date": "2025-11-13T12:00:00Z",
  "verified_by": "if://agent/session-1/haiku-3",
  "confidence_score": 0.95,
  "dependencies": [],
  "created_by": "if://agent/session-1/haiku-3",
  "created_at": "2025-11-13T10:00:00Z",
  "updated_at": "2025-11-13T12:00:00Z",
  "tags": ["warranty-tracking", "roi", "yacht-sales"]
}
```

### Required Fields

**Every citation MUST include:**
- `citation_id` (unique identifier)
- `claim` (the specific statement being verified)
- `sources` (array of ≥2 sources for VERIFIED status)
  - Each source MUST have: `type`, `quality`, `credibility` (0-10)
  - File sources: `path`, `line_range`, `git_commit`
  - Web sources: `url`, `accessed`, `hash` (SHA-256)
- `status` (verified/provisional/unverified/disputed/revoked)
- `confidence_score` (0.0-1.0)
- `created_by` (your agent ID: S1-H03, S2-H05, etc.)

---

## Source Quality Tiers

### Primary Sources (Credibility: 8-10) ⭐⭐⭐

**Use these whenever possible:**

1. **Codebase Analysis (Credibility: 9-10)**
   - File: `server/db/schema.sql` (line 45-67)
   - File: `server/routes/boats.js` (line 120-145)
   - Git commit: `abc123def456`
   - **Why primary:** Direct observation of actual code

2. **Local Documentation (Credibility: 8-9)**
   - File: `/mnt/c/users/setup/downloads/NaviDocs-Medium-Articles.md`
   - File: `/home/setup/navidocs/docs/debates/02-yacht-management-features.md`
   - **Why primary:** Created by NaviDocs team, first-hand knowledge

3. **Official Industry Reports (Credibility: 8-9)**
   - ICOMIA Global Recreational Boating Market Report 2024
   - European Boating Industry Statistics (EBI)
   - **Why primary:** Commissioned research, rigorous methodology

4. **Direct Interviews/Surveys (Credibility: 8-9)**
   - Broker testimonials (first-hand pain points)
   - Owner interviews (actual usage patterns)
   - **Why primary:** Direct observation, real-world data

### Secondary Sources (Credibility: 5-7) ⭐⭐

**Acceptable, but need 2nd source:**

1. **Industry Association Websites (Credibility: 6-7)**
   - ICOMIA, European Boating Industry
   - Yacht Brokers Association
   - **Why secondary:** Aggregated data, not original research

2. **Competitor Websites (Credibility: 5-7)**
   - BoatVault pricing page
   - DeckDocs feature comparison
   - **Why secondary:** Marketing materials, may be biased

3. **Government Regulations (Credibility: 7-8)**
   - Flag registration requirements (9 jurisdictions)
   - VAT/tax regulations
   - **Why secondary (not primary):** Legal requirements, but implementation varies

4. **Academic Papers (Credibility: 6-8)**
   - Marine documentation studies
   - Yacht market analysis papers
   - **Why secondary:** Peer-reviewed, but may be outdated or theoretical

### Tertiary Sources (Credibility: 2-4) ⚠️

**Use ONLY if no primary/secondary available:**

1. **Blog Posts (Credibility: 3-4)**
   - Industry commentary
   - Yacht brokerage blogs
   - **Why tertiary:** Opinion-based, not verified

2. **Forum Discussions (Credibility: 2-4)**
   - YachtWorld forums
   - The Trader Online discussions
   - **Why tertiary:** Anecdotal, single data points

3. **News Articles (Credibility: 3-5)**
   - Yacht market trend coverage
   - Brokerage industry news
   - **Why tertiary:** Journalism, not original research

4. **Social Media (Credibility: 1-3)**
   - LinkedIn posts from brokers
   - Twitter industry discussions
   - **Why tertiary:** Highly anecdotal, low verification

### Unverified Claims (Credibility: 0-1) ❌

**Flag these - Guardian Council will reject:**

1. **Assumptions** - "We assume brokers will pay €299/month"
2. **Hypotheses** - "MLS integration should reduce listing time"
3. **Projections** - "Market will grow 15% annually"
4. **Guesses** - "Prestige 50 boats cost around €250K"

**Action required:** Find 2+ sources or mark as UNVERIFIED

---

## Multi-Source Verification Examples

### Example 1: Market Size Claim (VERIFIED ✅)

**Claim:** "Mediterranean yacht sales market is €2.3B annually"

**Source 1 (Primary):**
- Type: Industry report
- Path: `/home/setup/yacht-market-reports/2024-mediterranean-market-analysis.pdf`
- Page: 23
- Credibility: 8
- Excerpt: "Mediterranean yacht market valued at €2.3B in 2024"

**Source 2 (Secondary):**
- Type: Web
- URL: `https://icomia.org/statistics/european-market-2024`
- Accessed: 2025-11-13T10:00:00Z
- Hash: `sha256:a3b2c1d4e5f6...`
- Credibility: 7
- Excerpt: "Southern Europe yacht sales: €2.2-€2.4B range"

**Result:** VERIFIED ✅ (2 sources, credibility 8+7=15, confidence 0.90)

---

### Example 2: Warranty Savings Claim (VERIFIED ✅)

**Claim:** "Inventory tracking prevents €8K-€33K forgotten value at resale"

**Source 1 (Primary):**
- Type: File
- Path: `/mnt/c/users/setup/downloads/NaviDocs-Medium-Articles.md`
- Line: 45-67
- Credibility: 9
- Excerpt: "Yacht owners who track warranties save €8K-€33K per vessel"

**Source 2 (Primary):**
- Type: File
- Path: `/home/setup/navidocs/docs/debates/02-yacht-management-features.md`
- Line: 120-145
- Credibility: 9
- Excerpt: "Warranty expiration tracking prevents €15K-€50K forgotten value"

**Note:** Range discrepancy (€8K-€33K vs €15K-€50K) - use conservative estimate €8K-€33K

**Result:** VERIFIED ✅ (2 primary sources, credibility 9+9=18, confidence 0.95)

---

### Example 3: Technical Claim (VERIFIED ✅)

**Claim:** "NaviDocs uses SQLite database with BullMQ job queue"

**Source 1 (Primary):**
- Type: File
- Path: `server/db/schema.sql`
- Line: 1-10
- Git commit: `abc123def456`
- Credibility: 10
- Excerpt: "-- SQLite schema for NaviDocs database"

**Source 2 (Primary):**
- Type: File
- Path: `server/services/queue.service.js`
- Line: 5-20
- Git commit: `abc123def456`
- Credibility: 10
- Excerpt: "import { Queue } from 'bullmq'; // Job queue for background tasks"

**Result:** VERIFIED ✅ (2 codebase sources, credibility 10+10=20, confidence 1.0)

---

### Example 4: Pricing Claim (PROVISIONAL ⚠️)

**Claim:** "Brokers willing to pay €99-€299/month for NaviDocs"

**Source 1 (Tertiary):**
- Type: Forum
- URL: `https://yachtworld.com/forums/thread-12345`
- Credibility: 3
- Excerpt: "I'd pay €150/month for warranty tracking software"

**Problem:** Only 1 source, credibility too low (3 < 5)

**Action required:**
- Find pricing survey data (primary source)
- OR competitor pricing analysis (secondary source)
- OR mark as PROVISIONAL ⚠️ and flag for follow-up

**Result:** PROVISIONAL ⚠️ (needs 2nd source before Session 5 handoff)

---

### Example 5: Timeline Claim (UNVERIFIED ❌)

**Claim:** "MLS integration can be completed in 2 weeks"

**Source 1:** None (assumption based on developer estimate)

**Problem:** No evidence, pure speculation

**Action required:**
- Search codebase for existing MLS integrations (time to implement)
- Find industry benchmarks for API integration timelines
- OR consult Session 4 sprint planning for realistic estimate
- OR mark as UNVERIFIED ❌ and remove from critical path

**Result:** UNVERIFIED ❌ (remove claim or find 2 sources)

---

## Confidence Scoring Formula

```
Confidence = (Source1_Credibility + Source2_Credibility) / 20

If ≥3 sources: Confidence = min(0.95, average_credibility / 10)
If 2 sources: Confidence = average_credibility / 10
If 1 source (credibility ≥8): Confidence = credibility / 15 (PROVISIONAL)
If 0 sources: Confidence = 0.0 (UNVERIFIED)
```

**Examples:**
- 2 primary sources (9+9=18): Confidence = 0.90
- 2 secondary sources (6+6=12): Confidence = 0.60
- 1 primary source (9): Confidence = 0.60 (PROVISIONAL)
- 3 primary sources (9+9+8=26): Confidence = 0.95 (capped)

---

## Evidence Quality Scorecard

**Target metrics for Session handoff:**

| Metric | Target | Guardian Rejection Threshold |
|--------|--------|------------------------------|
| Verified claims | >85% | <70% verified |
| Average credibility | ≥7.5/10 | <6.0/10 |
| Primary sources | >70% | <50% |
| Unverified claims | <10% | >20% |
| Confidence score | ≥0.75 | <0.60 |

**If you miss targets:** Guardian Council will ABSTAIN or REJECT your session handoff

---

## Citation File Format

**File:** `intelligence/session-X/session-X-citations.json`

```json
{
  "session_id": "if://conversation/navidocs-session-1-2025-11-13",
  "total_citations": 47,
  "verified_citations": 42,
  "provisional_citations": 3,
  "unverified_citations": 2,
  "average_credibility": 8.2,
  "average_confidence": 0.87,
  "citations": [
    {
      "citation_id": "if://citation/warranty-savings-8k-33k",
      "claim": "NaviDocs prevents €8K-€33K warranty losses per yacht",
      "sources": [ /* full source objects */ ],
      "status": "verified",
      "confidence_score": 0.95
    },
    {
      "citation_id": "if://citation/broker-pricing-willingness",
      "claim": "Brokers willing to pay €99-€299/month",
      "sources": [ /* only 1 source */ ],
      "status": "provisional",
      "confidence_score": 0.60
    }
  ]
}
```

---

## IF.bus Communication: Citing Sources

**When sending findings to Agent 10 (synthesis), include citations:**

```json
{
  "performative": "inform",
  "sender": "if://agent/session-1/haiku-3",
  "receiver": ["if://agent/session-1/haiku-10"],
  "content": {
    "claim": "Inventory tracking prevents €15K-€50K forgotten value",
    "evidence": [
      "file:/home/setup/navidocs/docs/debates/02-yacht-management-features.md:120-145",
      "file:/mnt/c/users/setup/downloads/NaviDocs-Medium-Articles.md:45-67"
    ],
    "confidence": 0.95,
    "cost_tokens": 1247
  },
  "citation_ids": ["if://citation/inventory-pain-point-2025-11-13"],
  "timestamp": "2025-11-13T10:00:00Z"
}
```

**Agent 10 validates:**
- Check citation_ids reference valid citations in `session-X-citations.json`
- Verify ≥2 sources (IF.TTT compliance)
- Confirm confidence ≥0.75

---

## Quality Assurance Checklist

**Before creating your session handoff, verify:**

- [ ] All claims have ≥2 sources (or marked PROVISIONAL/UNVERIFIED)
- [ ] Citations file (`session-X-citations.json`) exists
- [ ] Average credibility ≥7.5/10
- [ ] Verified claims >85%
- [ ] Primary sources >70%
- [ ] Unverified claims <10%
- [ ] All file references include: path, line_range, git_commit
- [ ] All web references include: url, accessed date, SHA-256 hash
- [ ] Confidence scores calculated correctly
- [ ] Status field populated (verified/provisional/unverified)

**Session 5 (Guardian Council) will review your handoff against this checklist.**

---

## ESCALATE Protocol: Evidence Conflicts

**If you detect conflicting evidence (>20% variance), ESCALATE:**

**Example:**
- Agent 1 claims: "Prestige 50 price range €250K-€480K"
- Agent 3 claims: "Owner has €1.5M Prestige 50 boat"
- Variance: (1.5M - 250K) / 250K = 500% ⚠️

**Action:**
```json
{
  "performative": "ESCALATE",
  "sender": "if://agent/session-1/haiku-10",
  "receiver": ["if://agent/session-1/coordinator"],
  "content": {
    "conflict_type": "Price range inconsistency",
    "agent_1_claim": "€250K-€480K (S1-H01)",
    "agent_3_claim": "€1.5M boat (S1-H03)",
    "variance": "500%",
    "requires_resolution": true,
    "recommendation": "Re-search YachtWorld for Prestige 50 ACTUAL sale prices"
  }
}
```

**Coordinator investigates, resolves, updates citation status.**

---

## Session-Specific Guidance

### Session 1 (Market Research)

**Focus:** Market sizing, competitive landscape, broker pain points

**Critical claims to verify:**
- Mediterranean yacht sales market size (€2.3B)
- Riviera brokerage count (120 active)
- Warranty savings (€8K-€33K)
- Documentation prep time (6 hours → 20 minutes)

**Best sources:**
- ICOMIA reports (primary)
- NaviDocs Medium articles (primary)
- Competitor websites (secondary)

### Session 2 (Technical Integration)

**Focus:** Architecture design, database migrations, API specifications

**Critical claims to verify:**
- NaviDocs uses SQLite + BullMQ (codebase analysis)
- Database schema changes (file references)
- API endpoint specifications (OpenAPI spec)
- Integration points (file:line citations)

**Best sources:**
- Codebase files (primary, credibility 10)
- Git commits (primary, credibility 10)
- Technical documentation (primary, credibility 8-9)

### Session 3 (Sales Enablement)

**Focus:** Pitch deck, ROI calculator, demo scripts

**Critical claims to verify:**
- ROI calculations cite Session 1 sources
- Pricing strategy aligns with competitor analysis
- Demo script matches NaviDocs actual features
- Objection handling backed by evidence

**Best sources:**
- Session 1 citations (cross-reference)
- Session 2 codebase validation (features exist)
- Competitor pricing pages (secondary)

### Session 4 (Implementation Planning)

**Focus:** Sprint planning, roadmap, acceptance criteria

**Critical claims to verify:**
- 4-week timeline realistic (codebase complexity)
- Dependencies correctly identified (file references)
- Acceptance criteria testable (Given/When/Then format)
- Migration scripts safe (rollback procedures)

**Best sources:**
- Session 2 architecture (cross-reference)
- Codebase file analysis (primary)
- Sprint planning best practices (secondary)

---

## Session 5 (Guardian Council) Will Check:

**Empirical Soundness (0-10):**
- Evidence quality (primary vs secondary vs tertiary)
- Source verification (all citations traceable)
- Multi-source compliance (≥2 sources per claim)

**Logical Coherence (0-10):**
- Cross-session consistency (Session 1 ↔ Session 3 alignment)
- Contradiction detection (conflicting claims flagged)
- Integration validation (all pieces fit together)

**Practical Viability (0-10):**
- Implementation feasibility (4-week timeline backed by codebase)
- ROI justification (€8K-€33K savings verified)
- Technical risks (migration scripts tested)

**Approval threshold:** Average ≥7.0 across all 3 dimensions

**If you fail:** Guardian Council will ABSTAIN (5.0-6.9) or REJECT (<5.0)

---

## Real-Time Quality Feedback

**Agent 0B (S5-H0B) monitors your work every 5 minutes:**

**Check:** `intelligence/session-X/QUALITY_FEEDBACK.md` (updated continuously)

**Example feedback:**
```markdown
# Session 1 Quality Feedback (2025-11-13 10:15 UTC)

## ✅ Good practices:
- Market size claim has 2 primary sources (ICOMIA + EBI)
- Citation format matches IF.TTT schema
- Confidence scores calculated correctly

## ⚠️ Warnings:
- Broker pricing claim (€99-€299/month) has only 1 tertiary source
  - Action: Find pricing survey or competitor analysis
  - Deadline: Before Session 1 handoff

## ❌ Errors:
- MLS integration timeline claim has 0 sources (UNVERIFIED)
  - Action: Remove claim OR find 2 sources
  - Risk: Guardian Council will reject if not fixed

## 📊 Current metrics:
- Verified: 38/42 (90%) ✅
- Average credibility: 8.1/10 ✅
- Primary sources: 30/42 (71%) ✅
- Confidence: 0.85 ✅

**Overall:** On track for Guardian approval
```

---

## Questions?

**If unclear:**
1. Check `QUALITY_FEEDBACK.md` (Agent 0B updates every 5 min)
2. ESCALATE to Session 5 coordinator
3. Create `intelligence/session-X/QUESTION-evidence-standards.md`

**Session 5 Contact:**
- Agent 0A (S5-H0A): Evidence standards
- Agent 0B (S5-H0B): Real-time QA feedback
- Coordinator: Final validation before Guardian vote

---

**Document Signature:**
```
if://doc/evidence-quality-standards-2025-11-13
Agent: S5-H0A (Evidence Quality Standards)
Version: 1.0
Status: READY - Sessions 1-4 read immediately
For Guardian Council Approval: >85% verified, credibility ≥7.5
```
