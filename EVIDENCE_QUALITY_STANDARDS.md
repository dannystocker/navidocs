# Evidence Quality Standards for NaviDocs Intelligence Sessions
**For:** Sessions 1, 2, 3, 4 (reference this document while working)
**Created by:** Session 5 Agent 0A
**Last Updated:** 2025-11-13
**Status:** ACTIVE - All sessions must follow these standards

---

## 🎯 Purpose

Ensure all market research, technical claims, and business intelligence meet medical-grade evidence standards (IF.TTT: Traceable, Transparent, Trustworthy).

**Why This Matters:**
- Guardian Council requires >90% consensus (18/20 votes)
- 100% consensus requires empirical validation + testable predictions
- Poor evidence quality = rework at validation stage (expensive)
- High-quality citations = faster Guardian approval = faster launch

---

## 📋 Citation Format (IF.TTT Compliant)

### **Template:**

```json
{
  "citation_id": "if://citation/[unique-identifier]",
  "claim": "[The specific claim being made]",
  "sources": [
    {
      "type": "web",
      "url": "https://example.com/research",
      "sha256": "a1b2c3d4e5f6...",
      "accessed": "2025-11-13",
      "quality": "primary",
      "credibility": 9,
      "excerpt": "[Relevant quote from source]"
    },
    {
      "type": "file",
      "path": "intelligence/session-1/market-analysis.md",
      "line_range": "45-67",
      "quality": "primary",
      "credibility": 9
    }
  ],
  "status": "verified",
  "confidence_score": 0.95,
  "verified_by": "S1-H02",
  "verification_date": "2025-11-13"
}
```

### **Required Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `citation_id` | ✅ YES | Unique ID following `if://citation/[identifier]` format |
| `claim` | ✅ YES | Exact claim being cited (1-2 sentences) |
| `sources` | ✅ YES | Array of ≥2 sources for high-confidence claims |
| `status` | ✅ YES | `unverified`, `verified`, `disputed`, or `revoked` |
| `confidence_score` | ✅ YES | 0.0-1.0 (justify based on source quality) |
| `verified_by` | ✅ YES | Agent ID (e.g., `S1-H02`) |
| `verification_date` | ✅ YES | ISO 8601 format |

---

## 🔍 Evidence Quality Scoring

### **Primary Sources (9-10 credibility):**
- Official government statistics (e.g., DGCCRF yacht registration data)
- Original research studies (peer-reviewed journals)
- Industry association reports (ECPY, Nautical Statistics)
- Codebase analysis (file:line references in NaviDocs repo)
- Direct interviews with verified experts (transcripts available)

**Examples:**
- ✅ "YachtWorld 2024 Ownership Cost Report (PDF, 47 pages)"
- ✅ "NaviDocs codebase: `server/db/schema.sql:45-67`"
- ✅ "Boat International Annual Market Report 2024"

### **Secondary Sources (7-8 credibility):**
- Industry news articles (Boat International, YachtWorld)
- Competitor websites (pricing pages, feature lists)
- Trade show presentations (documented with photos/slides)
- Expert blog posts (verified industry professionals)
- LinkedIn profiles (for market sizing claims)

**Examples:**
- ✅ "Northrop & Johnson website pricing (screenshot + SHA-256 hash)"
- ✅ "Camper & Nicholsons feature comparison table"

### **Tertiary Sources (5-6 credibility):**
- Forum discussions (YachtForums, The Hull Truth)
- Reddit threads (r/sailing, r/yachts)
- Anecdotal evidence ("broker told me...")
- Marketing materials (press releases, brochures)

**Examples:**
- ⚠️ "YachtForums thread: 'What do yacht owners really need?'"
- ⚠️ Use only if ≥2 primary sources unavailable

### **Unverified (0-4 credibility):**
- Claims without sources ("industry experts estimate...")
- Single-source claims (need ≥2 sources)
- Broken links (URL returns 404)
- Paywalled content (can't verify)

**Examples:**
- ❌ "Experts say warranty claims cost €10K-€50K" (who? which experts?)
- ❌ Single YachtWorld article without corroboration

---

## ✅ IF.TTT Compliance Checklist

**Before committing any citation, verify:**

- [ ] **≥2 independent sources** for high-confidence claims (confidence ≥0.9)
- [ ] **Web URLs include SHA-256 hash** (tamper detection via `sha256sum <file>`)
- [ ] **File references include line numbers** (`intelligence/session-1/market-analysis.md:45-67`)
- [ ] **Citation ID follows if:// URI scheme** (`if://citation/warranty-savings-8k-33k`)
- [ ] **Confidence score justified** (0.9+ requires ≥2 primary sources)
- [ ] **Status tracked** (unverified → verified → disputed → revoked)
- [ ] **Agent ID recorded** (who verified this claim?)
- [ ] **Verification date recorded** (when was this verified?)

---

## 📊 Multi-Source Verification Examples

### **Example 1: Market Sizing Claim**

**Claim:** "Mediterranean yacht brokerage market: 150-200 active brokers"

**Good Citation (≥2 sources):**
```json
{
  "citation_id": "if://citation/mediterranean-broker-count",
  "claim": "Mediterranean yacht brokerage market: 150-200 active brokers",
  "sources": [
    {
      "type": "web",
      "url": "https://yachtworld.com/research/mediterranean-brokers-2024",
      "sha256": "a1b2c3d4...",
      "quality": "primary",
      "credibility": 9,
      "excerpt": "Our database shows 178 active yacht brokers in Mediterranean region"
    },
    {
      "type": "web",
      "url": "https://boatinternational.com/market-analysis/2024",
      "sha256": "e5f6g7h8...",
      "quality": "primary",
      "credibility": 9,
      "excerpt": "Estimated 150-200 professional yacht brokers operating in Med"
    }
  ],
  "status": "verified",
  "confidence_score": 0.95
}
```

### **Example 2: Technical Claim**

**Claim:** "NaviDocs uses Express.js + SQLite for backend"

**Good Citation (codebase reference):**
```json
{
  "citation_id": "if://citation/navidocs-tech-stack",
  "claim": "NaviDocs uses Express.js + SQLite for backend",
  "sources": [
    {
      "type": "file",
      "path": "server/index.js",
      "line_range": "1-15",
      "quality": "primary",
      "credibility": 10,
      "excerpt": "const express = require('express'); const sqlite3 = require('sqlite3');"
    },
    {
      "type": "file",
      "path": "package.json",
      "line_range": "12-18",
      "quality": "primary",
      "credibility": 10,
      "excerpt": "dependencies: { express: ^4.18.0, sqlite3: ^5.1.0 }"
    }
  ],
  "status": "verified",
  "confidence_score": 1.0
}
```

### **Example 3: Competitive Claim**

**Claim:** "Competitor X charges €25/month for yacht management software"

**Good Citation (competitor website + screenshot):**
```json
{
  "citation_id": "if://citation/competitor-x-pricing",
  "claim": "Competitor X charges €25/month for yacht management software",
  "sources": [
    {
      "type": "web",
      "url": "https://competitorx.com/pricing",
      "sha256": "b2c3d4e5...",
      "accessed": "2025-11-13",
      "quality": "primary",
      "credibility": 9,
      "screenshot": "intelligence/session-1/screenshots/competitor-x-pricing.png"
    },
    {
      "type": "file",
      "path": "intelligence/session-1/competitive-analysis.md",
      "line_range": "120-125",
      "quality": "secondary",
      "credibility": 8,
      "excerpt": "Competitor X pricing confirmed via website analysis"
    }
  ],
  "status": "verified",
  "confidence_score": 0.90
}
```

---

## 🚨 Common Mistakes to Avoid

### **❌ Bad: Single Source**
```json
{
  "claim": "Warranty claims cost €8K-€33K per yacht",
  "sources": [
    {
      "type": "web",
      "url": "https://yachtworld.com/article",
      "quality": "primary"
    }
  ],
  "confidence_score": 0.95  // ❌ Can't claim 0.95 with single source!
}
```

### **✅ Good: Multiple Sources**
```json
{
  "claim": "Warranty claims cost €8K-€33K per yacht",
  "sources": [
    {
      "type": "web",
      "url": "https://yachtworld.com/warranty-costs-2024",
      "sha256": "a1b2...",
      "credibility": 9
    },
    {
      "type": "web",
      "url": "https://boatinternational.com/ownership-costs",
      "sha256": "c3d4...",
      "credibility": 9
    }
  ],
  "confidence_score": 0.95  // ✅ Justified with ≥2 primary sources
}
```

---

## 🔄 Real-Time Quality Feedback Loop

**Sessions 1-4: Check `QUALITY_FEEDBACK.md` every 5 minutes**

Session 5 Agent 0B monitors your commits and provides real-time feedback:

```markdown
## ⚠️ Session 2 (Needs Attention)
- Agent 3 maintenance log claim: Missing line number reference
  - Claim: "NaviDocs tracks maintenance via BullMQ workers"
  - Fix: Add file:line reference (e.g., `server/workers/maintenance.js:45-67`)

## 🔴 Session 1 (Action Required)
- Agent 5 ROI calculator: No source citations for €8K-€33K warranty claim
  - Fix: Add ≥2 sources (YachtWorld + Boat International reports)
```

**Action:** Read feedback → Fix issues → Commit → Continue working

---

## 📈 Confidence Score Guidelines

| Score | Sources Required | Quality Required | Use Case |
|-------|------------------|------------------|----------|
| 0.95-1.0 | ≥2 primary | Both 9-10 credibility | Market sizing, ROI calculations |
| 0.85-0.94 | ≥2 mixed | 1 primary + 1 secondary | Competitive analysis, feature claims |
| 0.70-0.84 | ≥1 primary | 7-10 credibility | Technical claims (if codebase verified) |
| 0.50-0.69 | ≥1 secondary | 5-8 credibility | Anecdotal evidence, forum discussions |
| <0.50 | Any | <5 credibility | Unverified claims (flag for review) |

---

## 🎯 Guardian Council Expectations

### **What Gets >90% Approval:**
- All high-confidence claims (≥0.9) have ≥2 primary sources
- Technical claims reference codebase with file:line
- Market sizing backed by official statistics or industry reports
- ROI calculations show work (formulas + source data visible)
- Implementation timeline realistic (validated against codebase complexity)

### **What Gets <80% Approval (ESCALATED):**
- >20% of claims lack proper citations
- Single-source claims for critical market data
- Broken URLs or inaccessible sources
- Confidence scores not justified by source quality
- Unverified claims in executive summary

---

## 📞 Need Help?

**Questions about citation format?**
- Check `schemas/citation/v1.0.schema.json` (JSON schema reference)
- Review Session 5 examples in `CLOUD_SESSION_5_SYNTHESIS_VALIDATION.md`

**Quality feedback unclear?**
- Check `QUALITY_FEEDBACK.md` (updated every 5 minutes by Agent 0B)
- ESCALATE to Sonnet coordinator if blocked

**Citation tool available:**
```bash
# Validate citation JSON against schema
python tools/citation_validate.py citations/session-1-citations.json
```

---

**Remember: High-quality evidence now = Faster Guardian approval later = Faster launch!**

🚀 Generated with [Claude Code](https://claude.com/claude-code)
