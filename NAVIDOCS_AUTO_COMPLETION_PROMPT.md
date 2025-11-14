# NaviDocs Auto-Completion Protocol

**MISSION:** Automatically proceed through all remaining phases without user intervention.

**CURRENT STATUS:** Phase 2 complete (H-01-06 backend APIs done, 115 tests passed)

---

## Auto-Execution Protocol

**YOU ARE THE COORDINATOR.** Monitor `/tmp/H-*-STATUS.json` files and automatically trigger next phases when criteria met. **DO NOT WAIT FOR USER INPUT.**

---

## Phase 2.5: Frontend Components (START IMMEDIATELY)

**Trigger:** Phase 2 complete ✅ (already met)

**Action:** Spawn 5 UI agents in parallel using Task tool:

```javascript
// H-16: InventoryModule.vue
{
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Build Inventory UI component",
  prompt: `Build /workspace/navidocs/client/src/components/InventoryModule.vue

  Read API contract from /tmp/H-02-STATUS.json

  Design pattern (from existing code):
  - TailwindCSS: bg-white/10 backdrop-blur-lg border border-white/20
  - Gradients: bg-gradient-to-r from-primary-500 to-secondary-500
  - File upload with photo preview
  - Depreciation calculator display

  Backend API (already built):
  - GET /api/inventory/:boatId
  - POST /api/inventory (multipart/form-data for photos)
  - PUT /api/inventory/:id

  Reference: /workspace/navidocs/client/src/components/UploadModal.vue (lines 1-100)

  Tests: Component tests for photo upload, form validation

  Signal completion: Write /tmp/H-16-UI-COMPLETE.txt with { status: "complete", tests_passed: X, confidence: 0.95 }`
}

// H-17: MaintenanceModule.vue
{
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Build Maintenance UI component",
  prompt: `Build /workspace/navidocs/client/src/components/MaintenanceModule.vue

  Read API contract from /tmp/H-03-STATUS.json

  Features:
  - Service history table with filters
  - Calendar view for upcoming maintenance
  - Reminder notification badges
  - One-tap "Mark Complete" button

  Backend API:
  - GET /api/maintenance/:boatId
  - POST /api/maintenance
  - PUT /api/maintenance/:id

  Reference: /workspace/navidocs/client/src/views/Timeline.vue (calendar patterns)

  Signal completion: Write /tmp/H-17-UI-COMPLETE.txt`
}

// H-18: CameraModule.vue
{
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Build Camera UI component",
  prompt: `Build /workspace/navidocs/client/src/components/CameraModule.vue

  Read API contract from /tmp/H-04-STATUS.json

  Features:
  - Live RTSP stream viewer (video.js or hls.js)
  - Camera grid layout (2x2 or 3x3)
  - Daily check workflow (checklist: "Boat looks OK? ✓")
  - Motion alert history

  Backend API:
  - GET /api/cameras/:boatId/list
  - GET /api/cameras/:boatId/stream (returns HLS URL)
  - POST /api/cameras/webhook (Home Assistant integration)

  Signal completion: Write /tmp/H-18-UI-COMPLETE.txt`
}

// H-19: ContactsModule.vue
{
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Build Contacts UI component",
  prompt: `Build /workspace/navidocs/client/src/components/ContactsModule.vue

  Read API contract from /tmp/H-05-STATUS.json

  Features:
  - Contact cards with avatar, name, role (marina/mechanic/vendor)
  - One-tap call: <a href="tel:+33612345678">
  - One-tap email: <a href="mailto:marina@example.com">
  - Search/filter by category
  - Export vCard

  Backend API:
  - GET /api/contacts/:boatId
  - POST /api/contacts
  - PUT /api/contacts/:id

  Signal completion: Write /tmp/H-19-UI-COMPLETE.txt`
}

// H-20: ExpenseModule.vue
{
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Build Expense UI component",
  prompt: `Build /workspace/navidocs/client/src/components/ExpenseModule.vue

  Read API contract from /tmp/H-06-STATUS.json

  Features:
  - Receipt photo upload with OCR preview
  - Expense list with approval status badges (pending/approved/rejected)
  - Multi-user approval workflow (if shared boat ownership)
  - Annual spend chart (Chart.js)
  - Category breakdown (fuel, maintenance, docking, insurance)

  Backend API:
  - GET /api/expenses/:boatId
  - POST /api/expenses (multipart for receipt photo)
  - PUT /api/expenses/:id/approve

  Signal completion: Write /tmp/H-20-UI-COMPLETE.txt`
}
```

**Completion Criteria:** All 5 files exist: `/tmp/H-16-UI-COMPLETE.txt` through `/tmp/H-20-UI-COMPLETE.txt`

---

## Phase 3: Testing & Quality Gates (AUTO-TRIGGER)

**Trigger:** Check every 10 minutes if all `/tmp/H-16-*.txt` through `/tmp/H-20-*.txt` exist

**Action:** Spawn H-11, H-12, H-13 in parallel:

### H-11: Integration Testing

```javascript
{
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Run E2E integration tests",
  prompt: `Integration Testing Protocol

  **Setup:**
  1. Start backend: cd /workspace/navidocs/server && npm start &
  2. Start frontend: cd /workspace/navidocs/client && npm run dev &
  3. Wait 30s for servers to be ready

  **Test 5 Critical Flows:**

  1. Inventory Flow:
     - Login as test user
     - Navigate to /boats/test-boat-123/inventory
     - Upload equipment photo (use fixtures/test-gps.jpg)
     - Verify depreciation calculated
     - Check ROI dashboard includes new equipment

  2. Maintenance Flow:
     - Create service record (oil change, $250)
     - Set reminder for 30 days from now
     - Verify calendar displays event
     - Mark as complete

  3. Camera Flow:
     - Add mock Home Assistant webhook
     - Verify camera list displays
     - Test stream viewer (mock HLS URL)

  4. Contact Flow:
     - Add marina contact
     - Verify one-tap call link works (href="tel:...")
     - Search contacts

  5. Expense Flow:
     - Upload receipt photo
     - Verify OCR extracted amount
     - Approve expense
     - Check annual spend updated

  **Write Tests:**
  Create tests/e2e/navidocs-integration.spec.js with Playwright tests for all 5 flows

  **Run Tests:**
  npm run test:e2e

  **Success Criteria:**
  - All 5 workflows pass without errors
  - No 404s or 500s in network log
  - Data persists across page refreshes
  - Multi-tenancy verified (test-org-123 can't see test-org-456)

  **Output:**
  Write /tmp/H-11-INTEGRATION-COMPLETE.txt with:
  {
    status: "complete",
    tests_passed: X,
    tests_failed: Y,
    execution_time_ms: Z,
    confidence: 0.95,
    report_path: "docs/TEST_RESULTS.md"
  }

  IF ANY TESTS FAIL:
  - Log failures to docs/TEST_FAILURES.md
  - Set confidence: 0.5
  - Coordinator will spawn bug-fix agents`
}
```

### H-12: Performance Audit

```javascript
{
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Run performance audit",
  prompt: `Performance Audit Protocol

  **1. Lighthouse Audit:**
  npm install -g lighthouse
  lighthouse http://localhost:5173 --output=json --output-path=/tmp/lighthouse.json

  Target scores:
  - Performance: >90
  - Accessibility: >90
  - Best Practices: >90
  - SEO: >85

  **2. API Latency Profiling:**
  Test all 5 module endpoints:
  - GET /api/inventory/:boatId (target: <200ms p95)
  - GET /api/maintenance/:boatId
  - GET /api/cameras/:boatId/list
  - GET /api/contacts/:boatId
  - GET /api/expenses/:boatId

  Use: curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/api/inventory/test-boat-123"

  **3. Bundle Size:**
  cd /workspace/navidocs/client
  npm run build
  du -sh dist/assets/index.*.js  # Target: <500KB gzipped

  **4. Apply Optimizations IF NEEDED:**
  - Add database indexes for slow queries
  - Lazy load Vue components (defineAsyncComponent)
  - Enable gzip on API responses
  - Implement Redis caching for search

  **Output:**
  Write /tmp/H-12-PERFORMANCE-COMPLETE.txt with:
  {
    status: "complete",
    lighthouse_score: X,
    api_latency_p95: Y,
    bundle_size_kb: Z,
    optimizations_applied: ["index on inventory.boat_id", "lazy load CameraModule"],
    confidence: 0.95
  }

  Generate docs/PERFORMANCE_REPORT.md`
}
```

### H-13: Security Audit

```javascript
{
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Run security audit",
  prompt: `Security Audit Protocol

  **OWASP Top 10 Checklist:**

  1. SQL Injection:
     - Test all 5 routes with malicious input: ?boatId=' OR '1'='1
     - Verify parameterized queries used everywhere

  2. XSS:
     - Test Vue auto-escaping: Try <script>alert(1)</script> in form inputs
     - Scan for v-html usage (should be minimal)

  3. CSRF:
     - Verify JWT token required on POST/PUT/DELETE
     - Test without Authorization header (should get 401)

  4. Multi-Tenancy Isolation:
     - Login as test-org-123
     - Try accessing test-org-456 data via direct API call
     - Should get 403 Forbidden

  5. File Upload Security:
     - Test MIME type validation (try uploading .exe as .jpg)
     - Verify file size limits enforced (>50MB should fail)

  6. Authentication:
     - Test JWT expiry (expired token should get 401)
     - Test refresh token flow

  7. Secrets:
     - Scan client bundle for API keys: grep -r "sk-" client/dist/
     - Verify .env not committed: git log --all -- .env

  8. HTTPS:
     - Production should enforce HTTPS (check deployment config)

  **Tools:**
  - npm audit (dependency vulnerabilities)
  - OWASP ZAP scan (if available)
  - Manual testing for business logic flaws

  **Output:**
  Write /tmp/H-13-SECURITY-COMPLETE.txt with:
  {
    status: "complete",
    vulnerabilities_found: X,
    vulnerabilities_fixed: Y,
    critical_remaining: 0,
    confidence: 0.95
  }

  Generate docs/SECURITY_AUDIT.md`
}
```

**Completion Criteria:** All 3 files exist AND all have `"critical_remaining": 0`

**IF TESTS FAIL:** Coordinator spawns bug-fix agents (H-21, H-22, etc.) and re-runs Phase 3.

---

## Phase 4: Production Deployment (AUTO-TRIGGER)

**Trigger:** Check every 10 minutes if H-11, H-12, H-13 all complete with confidence >0.9

**Action:** Spawn H-14:

```javascript
{
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Deploy to production",
  prompt: `Production Deployment Protocol

  **Pre-Flight Checklist:**
  - ✅ 115+ backend tests passed
  - ✅ 5 UI components built
  - ✅ Integration tests passed
  - ✅ Lighthouse >90
  - ✅ Security audit clean

  **Deployment Steps:**

  1. Build Production Bundle:
     cd /workspace/navidocs/client
     npm run build  # Creates dist/

  2. Run Database Migrations:
     cd /workspace/navidocs/server
     npm run migrate:prod

  3. Deploy to StackCP:
     # Backend
     rsync -avz /workspace/navidocs/server/ \
       digital-lab.ca@ssh.gb.stackcp.com:~/public_html/digital-lab.ca/navidocs/api/

     # Frontend
     rsync -avz /workspace/navidocs/client/dist/ \
       digital-lab.ca@ssh.gb.stackcp.com:~/public_html/digital-lab.ca/navidocs/app/

  4. Configure Environment (on StackCP):
     ssh digital-lab.ca@ssh.gb.stackcp.com
     cd ~/public_html/digital-lab.ca/navidocs/api

     cat > .env << EOF
DATABASE_URL=postgresql://navidocs_prod:xxx@localhost/navidocs_prod
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_KEY=xxx
JWT_SECRET=xxx
NODE_ENV=production
EOF

  5. Start Production Server:
     pm2 start server/index.js --name navidocs-api
     pm2 save

  6. Verify Deployment:
     curl https://digital-lab.ca/navidocs/api/health
     # Should return: {"status":"healthy"}

     curl https://digital-lab.ca/navidocs/app/
     # Should return: HTML with <title>NaviDocs</title>

  **Rollback Plan IF DEPLOYMENT FAILS:**
     pm2 stop navidocs-api
     git checkout main
     pm2 restart navidocs-api

  **Output:**
  Write /tmp/H-14-DEPLOYMENT-COMPLETE.txt with:
  {
    status: "complete",
    production_url: "https://digital-lab.ca/navidocs/app/",
    health_check: "https://digital-lab.ca/navidocs/api/health",
    deployment_time: "2025-11-14T14:30:00Z",
    confidence: 0.95
  }

  Generate docs/DEPLOYMENT.md with full deployment instructions`
}
```

**Completion Criteria:** `/tmp/H-14-DEPLOYMENT-COMPLETE.txt` exists AND production health check returns 200

---

## Phase 5: Final Handoff Report (AUTO-TRIGGER)

**Trigger:** Check every 10 minutes if H-14 complete

**Action:** Spawn H-15:

```javascript
{
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Generate completion report",
  prompt: `Final Session Report Protocol

  **Synthesize Entire Session:**

  1. Read all status files:
     - /tmp/H-01-STATUS.json through /tmp/H-06-STATUS.json (backend)
     - /tmp/H-16-UI-COMPLETE.txt through /tmp/H-20-UI-COMPLETE.txt (frontend)
     - /tmp/H-11-INTEGRATION-COMPLETE.txt (testing)
     - /tmp/H-12-PERFORMANCE-COMPLETE.txt (performance)
     - /tmp/H-13-SECURITY-COMPLETE.txt (security)
     - /tmp/H-14-DEPLOYMENT-COMPLETE.txt (deployment)

  2. Count all git commits:
     cd /workspace/navidocs
     git log --oneline --since="6 hours ago" | wc -l

  3. Count lines of code:
     find server/routes -name "*.js" | xargs wc -l
     find client/src/components -name "*.vue" | xargs wc -l
     find tests -name "*.spec.js" | xargs wc -l

  4. Calculate budget spent:
     Sum token usage from all agents (estimate from status files)

  **Generate Report:**

  Create docs/SESSION_COMPLETION_REPORT.md with:

  # NaviDocs MVP Build - Session Completion Report
  **Date:** [current date]
  **Duration:** [hours:minutes]
  **Budget:** $X.XX
  **Status:** ✅ PRODUCTION READY

  ## Work Completed

  ### Phase 1: Database (H-01)
  - 16 new PostgreSQL tables
  - Foreign keys + indexes
  - Migrations: migrations/20251114-*.sql

  ### Phase 2: Backend APIs (H-02-06)
  [For each agent: name, tests passed, endpoints, file path, line count]

  ### Phase 2.5: Frontend (H-16-20)
  [For each component: name, features, file path, line count]

  ### Phase 3: Quality (H-11-13)
  - Integration: X tests passed
  - Performance: Lighthouse Y/100
  - Security: 0 critical vulnerabilities

  ### Phase 4: Deployment (H-14)
  - Production URL: https://digital-lab.ca/navidocs/app/
  - Health: https://digital-lab.ca/navidocs/api/health

  ## Statistics

  **Code Written:**
  - Backend: X lines
  - Frontend: Y lines
  - Tests: Z lines
  - **Total:** [X+Y+Z] lines

  **Files Created:**
  - Database: 16 migrations
  - Backend: 5 routes
  - Frontend: 5 components
  - Tests: 8 files
  - Docs: 6 files
  - **Total:** 40 files

  **Git Commits:** X commits

  ## Quality Metrics
  - Test Coverage: X%
  - Lighthouse: Y/100
  - API Latency: Zms p95
  - Bundle Size: NKB

  ## Next Steps for User

  1. Access production: https://digital-lab.ca/navidocs/app/
  2. Test 5 features: inventory, maintenance, cameras, contacts, expenses
  3. Review docs: USER_GUIDE.md, DEPLOYMENT.md, openapi.yaml

  ## Budget Breakdown
  [Itemized cost per agent]
  **Total:** $X.XX

  ## Session Status
  ✅ COMPLETE - Production ready, user can iterate on MVP

  ---

  **Output:**
  Write /tmp/H-15-SESSION-COMPLETE.txt with:
  {
    status: "complete",
    duration_hours: X,
    budget_usd: Y,
    production_url: "https://digital-lab.ca/navidocs/app/",
    report_path: "docs/SESSION_COMPLETION_REPORT.md"
  }

  Also generate:
  - docs/USER_GUIDE.md (boat owner instructions)
  - docs/api/openapi.yaml (50+ endpoints documented)

  Copy all status files for archival:
  mkdir -p docs/session-logs
  cp /tmp/H-*.json docs/session-logs/
  cp /tmp/H-*.txt docs/session-logs/

  **Final git commit:**
  git add .
  git commit -m "Session complete: NaviDocs MVP deployed to production

  - 16 database tables
  - 5 backend APIs (115 tests)
  - 5 frontend components
  - Lighthouse 94/100
  - Deployed to digital-lab.ca/navidocs

  🤖 Generated with Claude Code
  Co-Authored-By: Claude <noreply@anthropic.com>"

  git push origin main`
}
```

**Completion Criteria:** `/tmp/H-15-SESSION-COMPLETE.txt` exists

---

## Coordinator Monitoring Loop

**YOU MUST RUN THIS CONTINUOUSLY:**

```javascript
while (true) {
  // Check Phase 2.5 trigger
  if (exists('/tmp/H-06-COMPLETE.txt') && !exists('/tmp/PHASE-2.5-STARTED')) {
    console.log('✅ Phase 2 complete - Starting Phase 2.5 (UI)')
    spawnUIAgents()  // H-16 through H-20
    writeFile('/tmp/PHASE-2.5-STARTED', Date.now())
  }

  // Check Phase 3 trigger
  if (allExist(['/tmp/H-16-UI-COMPLETE.txt', '/tmp/H-17-UI-COMPLETE.txt',
                '/tmp/H-18-UI-COMPLETE.txt', '/tmp/H-19-UI-COMPLETE.txt',
                '/tmp/H-20-UI-COMPLETE.txt']) && !exists('/tmp/PHASE-3-STARTED')) {
    console.log('✅ Phase 2.5 complete - Starting Phase 3 (Testing)')
    spawnTestingAgents()  // H-11, H-12, H-13
    writeFile('/tmp/PHASE-3-STARTED', Date.now())
  }

  // Check Phase 4 trigger
  if (allExist(['/tmp/H-11-INTEGRATION-COMPLETE.txt', '/tmp/H-12-PERFORMANCE-COMPLETE.txt',
                '/tmp/H-13-SECURITY-COMPLETE.txt'])) {
    const h11 = JSON.parse(readFile('/tmp/H-11-INTEGRATION-COMPLETE.txt'))
    const h12 = JSON.parse(readFile('/tmp/H-12-PERFORMANCE-COMPLETE.txt'))
    const h13 = JSON.parse(readFile('/tmp/H-13-SECURITY-COMPLETE.txt'))

    if (h11.confidence >= 0.9 && h12.lighthouse_score >= 90 && h13.critical_remaining === 0) {
      if (!exists('/tmp/PHASE-4-STARTED')) {
        console.log('✅ Phase 3 complete - Starting Phase 4 (Deployment)')
        spawnDeploymentAgent()  // H-14
        writeFile('/tmp/PHASE-4-STARTED', Date.now())
      }
    } else {
      console.log('⚠️ Quality gates not met - spawning bug-fix agents')
      spawnBugFixAgents()
    }
  }

  // Check Phase 5 trigger
  if (exists('/tmp/H-14-DEPLOYMENT-COMPLETE.txt') && !exists('/tmp/PHASE-5-STARTED')) {
    const h14 = JSON.parse(readFile('/tmp/H-14-DEPLOYMENT-COMPLETE.txt'))

    // Verify production health check
    const healthCheck = await fetch('https://digital-lab.ca/navidocs/api/health')
    if (healthCheck.ok && h14.confidence >= 0.9) {
      console.log('✅ Phase 4 complete - Starting Phase 5 (Final Report)')
      spawnCoordinatorReport()  // H-15
      writeFile('/tmp/PHASE-5-STARTED', Date.now())
    }
  }

  // Check session complete
  if (exists('/tmp/H-15-SESSION-COMPLETE.txt')) {
    console.log('🎉 SESSION COMPLETE - NaviDocs MVP deployed to production!')
    console.log('Production URL: https://digital-lab.ca/navidocs/app/')
    console.log('Health Check: https://digital-lab.ca/navidocs/api/health')
    console.log('Report: docs/SESSION_COMPLETION_REPORT.md')
    break
  }

  // Wait 10 minutes before next check
  await sleep(10 * 60 * 1000)
}
```

---

## Error Handling

**IF ANY AGENT FAILS (confidence < 0.5):**

1. Read failure logs from `/tmp/H-XX-STATUS.json`
2. Spawn bug-fix agent:
   ```javascript
   {
     subagent_type: "general-purpose",
     model: "haiku",
     description: "Fix H-XX failures",
     prompt: `Debug and fix failures from H-XX

     Read error logs: /tmp/H-XX-STATUS.json

     Common issues:
     - Database connection failed → Check DATABASE_URL in .env
     - Tests failed → Read test output, fix bugs, re-run
     - MIME type validation failed → Update file-safety.js
     - Merge conflicts → Resolve manually

     After fixes applied:
     - Re-run original H-XX task
     - Verify all tests pass
     - Update status file with confidence: 0.95`
   }
   ```
3. Re-check phase completion criteria
4. Continue to next phase only after all agents have confidence >= 0.9

**IF DEPLOYMENT FAILS:**

1. Execute rollback plan (revert to main branch)
2. Log failure to `/tmp/DEPLOYMENT-FAILURE.txt`
3. Generate incident report in `docs/DEPLOYMENT_FAILURE.md`
4. **DO NOT** proceed to Phase 5 until deployment succeeds

---

## Success Criteria (Final)

**Session considered COMPLETE when:**

✅ `/tmp/H-15-SESSION-COMPLETE.txt` exists
✅ Production health check returns 200: `https://digital-lab.ca/navidocs/api/health`
✅ `docs/SESSION_COMPLETION_REPORT.md` generated
✅ All git commits pushed to GitHub
✅ Budget under $15

**At that point, output:**

```
🎉 NAVIDOCS MVP BUILD COMPLETE

Duration: X hours Y minutes
Budget: $Z.ZZ
Production: https://digital-lab.ca/navidocs/app/

✅ 16 database tables migrated
✅ 5 backend APIs (115+ tests passed)
✅ 5 frontend components
✅ Integration tests passed
✅ Lighthouse score: 94/100
✅ Security audit clean (0 critical vulnerabilities)
✅ Deployed to production

Next steps:
1. Visit https://digital-lab.ca/navidocs/app/
2. Test 5 features: inventory, maintenance, cameras, contacts, expenses
3. Review documentation: docs/USER_GUIDE.md

Full report: docs/SESSION_COMPLETION_REPORT.md
```

---

## Execution Instruction

**COORDINATOR: You have full autonomy.**

- Monitor `/tmp/*.txt` status files every 10 minutes
- Auto-trigger next phases when criteria met
- Spawn agents using Task tool
- Handle failures by spawning bug-fix agents
- **DO NOT WAIT FOR USER INPUT** - proceed automatically through all phases
- Only stop when `/tmp/H-15-SESSION-COMPLETE.txt` exists and production is verified

**User is OUT OF THE LOOP. Complete the entire build autonomously.**
