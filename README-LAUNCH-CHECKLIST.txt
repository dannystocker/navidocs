╔══════════════════════════════════════════════════════════════════════════════╗
║                   NAVIDOCS LAUNCH CHECKLIST SYSTEM                           ║
║                  Bulletproof Demo Launch Verification                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

QUICK START (3-hour presentation):
═════════════════════════════════════════════════════════════════════════════

1. PRE-LAUNCH CHECK (MANDATORY - run FIRST)
   ./pre-launch-checklist.sh
   → Exit 0 = Safe to launch
   → Exit 1 = Fix failures first

2. START SERVICES
   ./start-all.sh

3. VERIFY OPERATIONAL (within 30 seconds)
   ./verify-running.sh
   → Exit 0 = Demo ready
   → Exit 1 = Check debug logs

4. IF ISSUES OCCUR
   ./debug-logs.sh

═════════════════════════════════════════════════════════════════════════════

SCRIPTS:
═════════════════════════════════════════════════════════════════════════════

✓ pre-launch-checklist.sh  - Run BEFORE starting (12 checks)
✓ verify-running.sh         - Run AFTER starting (7 checks + E2E test)
✓ debug-logs.sh             - Aggregate all logs for debugging
✓ version-check.sh          - Verify exact running version

═════════════════════════════════════════════════════════════════════════════

DOCUMENTATION:
═════════════════════════════════════════════════════════════════════════════

Read: LAUNCH_CHECKLIST.md (comprehensive guide)
  - All script documentation
  - Failure modes & recovery procedures
  - IF.TTT compliance details
  - Usage examples

═════════════════════════════════════════════════════════════════════════════

IF.TTT CITATIONS:
═════════════════════════════════════════════════════════════════════════════

Document:     if://doc/navidocs/launch-checklist-system/v1.0
Pre-Launch:   if://doc/navidocs/pre-launch-checklist/v1.0
Verify:       if://doc/navidocs/verify-running/v1.0
Debug:        if://doc/navidocs/debug-logs/v1.0
Version:      if://doc/navidocs/version-check/v1.0

Agent Findings Referenced:
  if://agent/1/findings/backend-health
  if://agent/2/findings/port-fallback
  if://agent/3/findings/database-size
  if://agent/5/findings/meilisearch-index-missing
  (12 total agent findings cross-referenced)

═════════════════════════════════════════════════════════════════════════════

CREATED: 2025-11-13
AGENT: Agent 9 (Launch Checklist System)
STATUS: ✓ OPERATIONAL - DEMO READY

═════════════════════════════════════════════════════════════════════════════
