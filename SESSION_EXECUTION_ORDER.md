# Session Execution Order Guide

**CRITICAL:** Sessions MUST run sequentially, not in parallel. Each session depends on outputs from previous sessions.

---

## Execution Flow Overview

### Session 1: Market Research (Foundational)
**Duration:** 30-45 minutes
**Dependencies:** None (First session)
**Outputs Location:** `intelligence/session-1/`

**Key Activities:**
- Market analysis and competitive landscape
- Customer personas and use cases
- Market trends and opportunities
- Stakeholder analysis
- Success metrics definition

**Verification Steps:**
```bash
# After Session 1 completion, verify:
ls -la intelligence/session-1/
# Should contain: market_analysis.md, competitive_landscape.md, personas.md, metrics.md
```

---

### Session 2: Technical Architecture (Dependent on Session 1)
**Duration:** 45-60 minutes
**Prerequisites:** Session 1 MUST be complete
**Depends On:** Session 1 outputs (market insights, requirements)
**Outputs Location:** `intelligence/session-2/`

**Key Activities:**
- Technical architecture design (reads Session 1 market insights)
- System integration planning
- Technology stack recommendations
- Infrastructure requirements
- API specifications

**Pre-Launch Checklist:**
- [ ] Session 1 complete
- [ ] All Session 1 outputs verified in `intelligence/session-1/`
- [ ] Session 1 market research reviewed for technical implications

**Verification Steps:**
```bash
# Before launching Session 2:
ls -la intelligence/session-1/ | wc -l
# Should show multiple output files

# After Session 2 completion, verify:
ls -la intelligence/session-2/
# Should contain: architecture.md, api_spec.md, tech_stack.md, infrastructure.md
```

---

### Session 3: UX/Sales Enablement (Dependent on Sessions 1 & 2)
**Duration:** 30-45 minutes
**Prerequisites:** Sessions 1 AND 2 MUST be complete
**Depends On:** Session 1 (market/personas) + Session 2 (technical architecture)
**Outputs Location:** `intelligence/session-3/`

**Key Activities:**
- User experience design (informed by Session 1 personas)
- Sales enablement strategy (informed by market insights)
- Pricing strategy
- Go-to-market plan
- Customer journey mapping

**Pre-Launch Checklist:**
- [ ] Session 1 complete and verified
- [ ] Session 2 complete and verified
- [ ] Session 1 personas and market data accessible
- [ ] Session 2 technical specifications accessible

**Verification Steps:**
```bash
# Before launching Session 3:
ls -la intelligence/session-1/ | grep personas
ls -la intelligence/session-2/ | grep architecture

# After Session 3 completion, verify:
ls -la intelligence/session-3/
# Should contain: ux_design.md, sales_strategy.md, gtm_plan.md, pricing.md
```

---

### Session 4: Implementation Planning (Dependent on Sessions 1, 2, & 3)
**Duration:** 45-60 minutes
**Prerequisites:** Sessions 1, 2, AND 3 MUST be complete
**Depends On:** All previous sessions (market, tech, UX/sales)
**Outputs Location:** `intelligence/session-4/`

**Key Activities:**
- Detailed implementation roadmap
- Sprint planning (informed by market priorities from Session 1)
- Technical implementation details (based on Session 2 architecture)
- Resource allocation (informed by Session 3 sales priorities)
- Risk management and mitigation strategies
- Timeline and milestone planning

**Pre-Launch Checklist:**
- [ ] Session 1 complete and verified
- [ ] Session 2 complete and verified
- [ ] Session 3 complete and verified
- [ ] All previous session outputs integrated and reviewed
- [ ] Cross-session dependencies identified

**Verification Steps:**
```bash
# Before launching Session 4:
for i in 1 2 3; do
  echo "Session $i outputs:"
  ls -la intelligence/session-$i/ 2>/dev/null | wc -l
done
# Each should have multiple files

# After Session 4 completion, verify:
ls -la intelligence/session-4/
# Should contain: roadmap.md, sprints.md, implementation.md, risks.md, timeline.md
```

---

### Session 5: Guardian Validation (Final - Dependent on ALL Previous Sessions)
**Duration:** 60-90 minutes
**Prerequisites:** Sessions 1, 2, 3, AND 4 MUST be complete
**Depends On:** ALL previous sessions
**Outputs Location:** `intelligence/session-5/`

**Key Activities:**
- Comprehensive validation across all sessions
- Cross-session consistency verification
- Quality assurance and compliance checks
- Final recommendations and refinements
- Executive summary and approval recommendations
- Success criteria confirmation

**Pre-Launch Checklist:**
- [ ] Session 1 complete and verified
- [ ] Session 2 complete and verified
- [ ] Session 3 complete and verified
- [ ] Session 4 complete and verified
- [ ] ALL outputs integrated and available
- [ ] Full cross-session dependency chain confirmed

**Verification Steps:**
```bash
# Before launching Session 5:
for i in 1 2 3 4; do
  echo "Session $i outputs:"
  ls -la intelligence/session-$i/ 2>/dev/null | wc -l
done
# Each should have multiple files

# After Session 5 completion, verify:
ls -la intelligence/session-5/
# Should contain: validation_report.md, recommendations.md, executive_summary.md, approval.md
```

---

## Session Dependencies Diagram

```
START
  ↓
┌─────────────────────────────────────────┐
│  SESSION 1: Market Research             │
│  Duration: 30-45 min                    │
│  Status: FOUNDATIONAL - No dependencies │
│  Outputs: Market insights, personas     │
└────────────────┬────────────────────────┘
                 ↓ (MUST complete)
┌─────────────────────────────────────────┐
│  SESSION 2: Technical Architecture      │
│  Duration: 45-60 min                    │
│  Status: DEPENDENT on Session 1         │
│  Consumes: Market insights              │
│  Outputs: Architecture, API specs       │
└────────────────┬────────────────────────┘
                 ↓ (MUST complete)
┌─────────────────────────────────────────┐
│  SESSION 3: UX/Sales Enablement         │
│  Duration: 30-45 min                    │
│  Status: DEPENDENT on Sessions 1 + 2    │
│  Consumes: Personas, Tech specs         │
│  Outputs: UX design, Sales strategy     │
└────────────────┬────────────────────────┘
                 ↓ (MUST complete)
┌─────────────────────────────────────────┐
│  SESSION 4: Implementation Planning     │
│  Duration: 45-60 min                    │
│  Status: DEPENDENT on Sessions 1+2+3    │
│  Consumes: All previous outputs         │
│  Outputs: Roadmap, sprints, timeline    │
└────────────────┬────────────────────────┘
                 ↓ (MUST complete)
┌─────────────────────────────────────────┐
│  SESSION 5: Guardian Validation         │
│  Duration: 60-90 min                    │
│  Status: DEPENDENT on ALL sessions      │
│  Consumes: All session outputs          │
│  Outputs: Validation, recommendations   │
└────────────────┬────────────────────────┘
                 ↓
               END
```

---

## Total Estimated Timeline

| Component | Duration |
|-----------|----------|
| Session 1 (Market Research) | 30-45 min |
| Session 2 (Technical Architecture) | 45-60 min |
| Session 3 (UX/Sales) | 30-45 min |
| Session 4 (Implementation) | 45-60 min |
| Session 5 (Guardian Validation) | 60-90 min |
| **TOTAL DURATION** | **3-5 hours** |

---

## Launch Commands Reference

### Session 1 Launch
```bash
# Start Market Research Session
navidocs session launch session-1

# Monitor progress:
watch -n 5 "ls -la intelligence/session-1/"

# Verify completion:
ls -la intelligence/session-1/ | grep -E "\.md$"
```

### Session 2 Launch (After Session 1 Complete)
```bash
# Start Technical Architecture Session
navidocs session launch session-2

# Monitor progress:
watch -n 5 "ls -la intelligence/session-2/"

# Verify completion:
ls -la intelligence/session-2/ | grep -E "\.md$"
```

### Session 3 Launch (After Sessions 1 & 2 Complete)
```bash
# Start UX/Sales Enablement Session
navidocs session launch session-3

# Monitor progress:
watch -n 5 "ls -la intelligence/session-3/"

# Verify completion:
ls -la intelligence/session-3/ | grep -E "\.md$"
```

### Session 4 Launch (After Sessions 1, 2, & 3 Complete)
```bash
# Start Implementation Planning Session
navidocs session launch session-4

# Monitor progress:
watch -n 5 "ls -la intelligence/session-4/"

# Verify completion:
ls -la intelligence/session-4/ | grep -E "\.md$"
```

### Session 5 Launch (After ALL Previous Sessions Complete)
```bash
# Start Guardian Validation Session
navidocs session launch session-5

# Monitor progress:
watch -n 5 "ls -la intelligence/session-5/"

# Verify completion:
ls -la intelligence/session-5/ | grep -E "\.md$"
```

---

## Automated Sequential Launch Script

```bash
#!/bin/bash

echo "NaviDocs Sequential Session Launcher"
echo "===================================="
echo "Starting 5-session execution sequence..."
echo "Total estimated time: 3-5 hours"
echo ""

# Session 1
echo "[1/5] Launching Session 1: Market Research..."
navidocs session launch session-1
echo "Waiting for Session 1 to complete (30-45 min)..."
# Add completion detection logic here

# Session 2
echo "[2/5] Launching Session 2: Technical Architecture..."
navidocs session launch session-2
echo "Waiting for Session 2 to complete (45-60 min)..."

# Session 3
echo "[3/5] Launching Session 3: UX/Sales Enablement..."
navidocs session launch session-3
echo "Waiting for Session 3 to complete (30-45 min)..."

# Session 4
echo "[4/5] Launching Session 4: Implementation Planning..."
navidocs session launch session-4
echo "Waiting for Session 4 to complete (45-60 min)..."

# Session 5
echo "[5/5] Launching Session 5: Guardian Validation..."
navidocs session launch session-5
echo "Waiting for Session 5 to complete (60-90 min)..."

echo ""
echo "All sessions complete! Review outputs in intelligence/ directory."
```

---

## Critical Success Factors

1. **Sequential Execution**: Do NOT launch multiple sessions in parallel
2. **Output Verification**: Always verify outputs before launching next session
3. **Dependency Chain**: Each session requires ALL previous sessions' outputs
4. **Monitoring**: Watch for completion signals in respective intelligence/ directories
5. **Error Handling**: If a session fails, DO NOT proceed to next session until issue is resolved

---

## Troubleshooting

### Session Fails to Start
```bash
# Check system resources
free -h
df -h

# Verify dependencies
navidocs config validate
```

### Session Hangs or Takes Longer Than Expected
```bash
# Check session logs
tail -f navidocs.log

# Monitor system resources during execution
watch -n 1 "top -b | head -n 20"
```

### Missing Output Files
```bash
# Verify session output directory
ls -la intelligence/session-X/

# Check for error logs
find . -name "*.error" -o -name "*.log" | xargs tail -f
```

---

## Session Completion Criteria

Each session is considered **COMPLETE** when:
- All expected output files are present in `intelligence/session-X/`
- Files contain valid markdown content
- No error logs present
- Verification scripts return expected results

---

**Last Updated:** 2025-11-14
**Agent:** CF-06: Session Execution Order Guide
**Status:** PRODUCTION READY
