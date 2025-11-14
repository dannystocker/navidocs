# NaviDocs Testing - Short Prompt for Cloud Session

**Paste this into a NEW Claude Code Cloud session after build session completes:**

---

Execute comprehensive E2E testing protocol for NaviDocs MVP.

**Repository:** https://github.com/dannystocker/navidocs
**Branch:** navidocs-cloud-coordination
**Instructions:** Read `/workspace/navidocs/NAVIDOCS_TESTING_SESSION.md` and execute all 9 testing agents

**Mission:**
1. Pull latest code: `git pull origin navidocs-cloud-coordination`
2. Read full protocol: `cat NAVIDOCS_TESTING_SESSION.md`
3. Spawn 9 Haiku testing agents using Task tool:
   - T-01: Test infrastructure setup (MUST complete first)
   - T-02-06: 5 Playwright E2E tests (parallel after T-01)
   - T-07-09: Performance + security audits (parallel after T-02-06)

**Testing Protocol:**
- Install Playwright, create fixtures, seed test data
- Run 5 E2E tests simulating real user workflows:
  - Inventory: Upload equipment → Calculate depreciation → ROI dashboard
  - Maintenance: Log service → Set reminder → Mark complete
  - Cameras: Connect Home Assistant → Motion alerts → Live stream
  - Contacts: Add contact → One-tap call → vCard export
  - Expenses: Upload receipt → OCR extract → Multi-user approval
- Lighthouse audits (target: >90 all pages)
- API load tests (target: <200ms p95)
- OWASP security scan (target: 0 critical vulnerabilities)

**Coordination:**
- Monitor `/tmp/T-*.json` status files
- T-01 must complete before T-02-06 start
- T-02-06 must complete before T-07-09 start
- Generate final test report: `docs/TEST_REPORT.md`

**Success Criteria:**
- ✅ 5/5 E2E tests pass (100%)
- ✅ Lighthouse >90 (all 6 pages)
- ✅ API p95 <200ms (all 5 endpoints)
- ✅ 0 critical security vulnerabilities
- ✅ Bundle size <500KB gzipped

**Budget:** $5-8 (9 Haiku agents × 2-3 hours)

**Output:** Generate completion report showing all test results, performance metrics, security scan results.

---

**You are autonomous.** Execute the full testing protocol from NAVIDOCS_TESTING_SESSION.md without waiting for user input. Stop when `/tmp/T-09-REPORT-COMPLETE.json` exists and all tests pass.
