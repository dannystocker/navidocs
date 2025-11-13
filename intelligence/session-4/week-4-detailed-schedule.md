# Week 4: Polish & Deploy - Detailed Schedule
## NaviDocs Yacht Sales Platform (Dec 4-10, 2025)

**Agent:** S4-H04
**Mission:** Final polish, MLS integration, comprehensive testing, and production deployment
**Status:** READY FOR EXECUTION
**Total Hours:** 35 hours across 7 days

---

## Table of Contents
1. [Day-by-Day Breakdown](#day-by-day-breakdown)
2. [MLS API Integration Specifications](#mls-api-integration-specifications)
3. [E2E Test Scenarios](#e2e-test-scenarios)
4. [Security Audit Checklist](#security-audit-checklist)
5. [Production Deployment Procedure](#production-deployment-procedure)
6. [Acceptance Criteria](#acceptance-criteria)

---

## Day-by-Day Breakdown

### Day 1 (Wednesday, Dec 4): MLS Integration - YachtWorld API

**Objectives:**
- Research and document YachtWorld API
- Create YachtWorld service abstraction
- Build boat-to-listing sync functionality

**Morning Session (4 hours)**

**Task 1.1: YachtWorld API Research & Documentation (2 hours)**
- **What:** Research YachtWorld API documentation
- **Where:** `server/docs/mls-integration/yachtworld-api-research.md`
- **Subtasks:**
  - [ ] Identify authentication method (API key vs OAuth2)
  - [ ] Document listing creation endpoint (request/response schema)
  - [ ] Document listing update endpoint (partial updates)
  - [ ] Document listing retrieval endpoint
  - [ ] Identify document attachment endpoints (warranty uploads)
  - [ ] Map error codes and rate limiting policies
  - [ ] Note any webhook delivery mechanisms
- **Acceptance Criteria:**
  - YachtWorld API endpoints fully documented with examples
  - Authentication requirements clearly specified
  - Rate limits and quotas documented
  - Sample curl requests provided for each endpoint

**Task 1.2: Create YachtWorld Service Module (2 hours)**
- **What:** Build YachtWorld API client with error handling
- **Where:** `server/services/mls/yachtworld.service.js`
- **Subtasks:**
  - [ ] Create YachtWorldClient class
  - [ ] Implement authentication (API key/OAuth)
  - [ ] Add request/response logging
  - [ ] Implement exponential backoff retry logic
  - [ ] Create error mapping (YachtWorld errors → NaviDocs errors)
  - [ ] Add request timeout handling (30s default)
- **Code Structure:**
  ```javascript
  class YachtWorldClient {
    constructor(apiKey, baseUrl = 'https://api.yachtworld.com')
    authenticate()
    createListing(boatData) // Returns { listing_id, url }
    updateListing(listingId, boatData)
    getListing(listingId)
    attachDocument(listingId, documentType, fileStream)
    deleteListing(listingId)
  }
  ```
- **Dependencies:**
  - axios (HTTP client)
  - dotenv (env var management)
  - morgan (request logging)
- **Acceptance Criteria:**
  - YachtWorldClient successfully authenticates
  - All CRUD operations tested with mock responses
  - Error handling covers network failures, auth failures, validation errors
  - Request/response logged to debug logs

**Afternoon Session (3 hours)**

**Task 1.3: Boat-to-YachtWorld Listing Sync (3 hours)**
- **What:** Implement sync logic to push boat data to YachtWorld
- **Where:** `server/services/mls/listing-sync.service.js`
- **Subtasks:**
  - [ ] Create ListingSyncService class
  - [ ] Implement boat → YachtWorld listing mapper
  - [ ] Handle new boat creation (POST to YachtWorld)
  - [ ] Handle boat updates (PUT to YachtWorld)
  - [ ] Implement document attachment (warranty, survey PDFs)
  - [ ] Add sync status tracking (in navidocs database)
  - [ ] Implement idempotent sync (handle duplicates)
- **Mapper Logic:**
  ```
  NaviDocs Boat → YachtWorld Listing
  - boat.name → listing.title
  - boat.year + boat.make + boat.model → listing.description_header
  - boat.length_ft → listing.length
  - boat.bedrooms → listing.cabins
  - boat.bathrooms → listing.heads
  - boat.engine_hours → listing.hours
  - boat.price → listing.price
  - boat.documents[] → listing.attachments[]
  ```
- **Database Table (New):**
  ```sql
  CREATE TABLE mls_sync_log (
    id TEXT PRIMARY KEY,
    boat_id TEXT NOT NULL,
    mls_platform TEXT ('yachtworld', 'boattrader'),
    action TEXT ('create', 'update', 'delete'),
    boat_listing_id TEXT,
    sync_status TEXT ('pending', 'synced', 'failed'),
    error_message TEXT,
    synced_at DATETIME,
    FOREIGN KEY (boat_id) REFERENCES boats(id)
  );
  ```
- **Acceptance Criteria:**
  - New boat marked "for_sale" → YachtWorld listing created within 5 minutes
  - Boat updates → YachtWorld listing updated within 5 minutes
  - Warranty documents → Attached to YachtWorld listing
  - Sync failures logged with retry mechanism
  - Manual sync endpoint: `POST /api/admin/mls/sync/:boat_id`

**End of Day 1:**
- YachtWorldClient fully implemented and tested
- Boat sync logic working against mock YachtWorld API
- Sync status tracking in database

---

### Day 2 (Thursday, Dec 5): MLS Integration - Boat Trader API & Unified Layer

**Objectives:**
- Research Boat Trader API
- Create unified MLS provider abstraction
- Implement background sync job

**Morning Session (4 hours)**

**Task 2.1: Boat Trader API Research & YachtWorld Completion (2 hours)**
- **What:** Research Boat Trader API and compare with YachtWorld
- **Where:** `server/docs/mls-integration/boattrader-api-research.md`
- **Subtasks:**
  - [ ] Document Boat Trader API endpoints (similar to YachtWorld)
  - [ ] Identify authentication differences
  - [ ] Document listing creation/update endpoints
  - [ ] Map field differences between YachtWorld and Boat Trader
  - [ ] Create comparison matrix (endpoints, auth, rate limits)
- **Acceptance Criteria:**
  - Boat Trader API documented
  - Comparison matrix shows all differences vs YachtWorld
  - Migration path clear if switching platforms

**Task 2.2: Create MLS Provider Interface (2 hours)**
- **What:** Build abstract interface for MLS providers
- **Where:** `server/services/mls/mls-provider.interface.js` (or base class)
- **Subtasks:**
  - [ ] Define IMLSProvider interface with standard methods
  - [ ] Create BoatTraderClient implementation
  - [ ] Create YachtWorldClient adapter (if needed)
  - [ ] Add provider factory for instantiation
  - [ ] Implement provider registry
- **Interface Definition:**
  ```javascript
  class MLSProvider {
    authenticate() // Returns boolean
    createListing(boatData) // Returns { listing_id, external_url }
    updateListing(listingId, boatData) // Returns boolean
    getListing(listingId) // Returns listing data
    deleteListing(listingId) // Returns boolean
    attachDocument(listingId, docType, fileStream) // Returns boolean
    validateListingData(boatData) // Returns { valid, errors[] }
  }
  ```
- **Factory Pattern:**
  ```javascript
  const provider = MLSProviderFactory.create('yachtworld', credentials);
  const provider = MLSProviderFactory.create('boattrader', credentials);
  ```
- **Acceptance Criteria:**
  - YachtWorld and Boat Trader implementations match interface
  - Provider factory correctly instantiates based on type
  - All methods work identically across providers

**Afternoon Session (3 hours)**

**Task 2.3: MLS Sync Background Job (3 hours)**
- **What:** Create daily background job to sync boats to configured MLS platforms
- **Where:** `server/workers/mls-sync.worker.js`
- **Subtasks:**
  - [ ] Create MLS sync worker job
  - [ ] Find all boats with `for_sale=true` and `mls_enabled=true`
  - [ ] Query configured MLS platforms per organization
  - [ ] Sync boat to each configured platform
  - [ ] Track sync status and errors
  - [ ] Implement retry logic for failed syncs
  - [ ] Add daily schedule (2am UTC)
  - [ ] Log sync metrics (boats synced, errors, duration)
- **Job Definition:**
  ```javascript
  // Runs daily at 2:00 AM UTC
  const job = {
    name: 'mls-sync-daily',
    cron: '0 2 * * *', // 2am daily
    handler: async () => {
      // Get all boats for_sale=true
      const boats = await BoatService.findForSale();
      for (const boat of boats) {
        await syncBoatToMLSPlatforms(boat);
      }
    }
  };
  ```
- **Update Routes:**
  - [ ] `POST /api/boats/:id/mls/sync` (manual trigger)
  - [ ] `GET /api/boats/:id/mls/status` (check sync status)
  - [ ] `GET /api/admin/mls/sync-log` (view recent syncs)
- **Acceptance Criteria:**
  - Daily sync job runs automatically
  - Manual sync endpoint works on demand
  - Failed syncs retry up to 3 times
  - Sync metrics logged and queryable

**End of Day 2:**
- Boat Trader API researched and documented
- Unified MLS provider interface implemented
- Both YachtWorld and Boat Trader clients working
- Background sync job scheduled and tested

---

### Day 3 (Friday, Dec 6): E2E Testing Suite

**Objectives:**
- Set up Playwright testing framework
- Implement critical E2E test scenarios
- Achieve 100% pass rate on all critical flows

**Morning Session (4 hours)**

**Task 3.1: Playwright Setup & Test Infrastructure (2 hours)**
- **What:** Configure Playwright for E2E testing
- **Where:** `playwright.config.ts`, `e2e/fixtures/`
- **Subtasks:**
  - [ ] Install Playwright (@playwright/test)
  - [ ] Create playwright.config.ts with:
    - baseURL: http://localhost:3000 (dev)
    - browsers: chromium, firefox, webkit
    - headless: true
    - timeout: 30s per test
    - retries: 1 (for flaky tests)
  - [ ] Create test fixtures:
    - authenticatedPage (logged-in user)
    - adminPage (admin user)
    - freshDatabase (clean state)
  - [ ] Create test utilities:
    - login(email, password)
    - createBoat(boatData)
    - createWarranty(boatId, warrantyData)
  - [ ] Set up test data cleanup (after each test)
  - [ ] Create GitHub Actions workflow for CI
- **File Structure:**
  ```
  e2e/
  ├── fixtures/
  │   ├── auth.fixture.ts
  │   ├── boat.fixture.ts
  │   └── test-db.fixture.ts
  ├── pages/
  │   ├── login.page.ts
  │   ├── boat-detail.page.ts
  │   └── warranty.page.ts
  ├── scenarios/
  │   ├── auth.spec.ts
  │   ├── warranty-tracking.spec.ts
  │   ├── sale-workflow.spec.ts
  │   └── integration.spec.ts
  └── playwright.config.ts
  ```
- **Acceptance Criteria:**
  - Playwright installed and configured
  - Test fixtures working (auth, boat creation)
  - CI workflow runs on every commit
  - All browsers tested (Chromium, Firefox, WebKit)

**Task 3.2: Authentication & Navigation E2E Tests (2 hours)**
- **What:** Test user authentication and basic navigation flows
- **Where:** `e2e/scenarios/auth.spec.ts`
- **Test Scenarios:**
  - [ ] TC-001: User Registration Flow
    ```gherkin
    Given user on login page
    When enters email "newuser@example.com"
    And enters password "SecurePassword123"
    And clicks "Register"
    Then user redirected to boat dashboard
    And welcome message displayed
    ```
  - [ ] TC-002: User Login Flow
    ```gherkin
    Given existing user with email "test@example.com"
    When enters credentials
    And clicks "Login"
    Then user logged in successfully
    And navigation bar shows user name
    ```
  - [ ] TC-003: Logout Flow
    ```gherkin
    Given authenticated user
    When clicks user menu
    And selects "Logout"
    Then user redirected to login page
    And session cleared
    ```
  - [ ] TC-004: Session Timeout
    ```gherkin
    Given authenticated user
    When session expires (no activity for 1 hour)
    Then user redirected to login
    And message "Session expired" displayed
    ```
- **Acceptance Criteria:**
  - All 4 auth scenarios pass
  - No flaky tests (run 3x successfully)
  - Assertions clear and maintainable

**Afternoon Session (3 hours)**

**Task 3.3: Warranty Tracking & Sale Workflow E2E Tests (3 hours)**
- **What:** Test critical warranty and sale features
- **Where:** `e2e/scenarios/warranty-tracking.spec.ts`, `e2e/scenarios/sale-workflow.spec.ts`
- **Warranty Tracking Tests:**
  - [ ] TC-005: Create Warranty
    ```gherkin
    Given authenticated user with boat "Azimut 55S"
    When navigates to Warranties tab
    And clicks "Add Warranty"
    And fills form:
      | Item Name | Engine |
      | Provider | Caterpillar |
      | Purchase Date | 2023-01-15 |
      | Warranty Period | 24 months |
      | Coverage | $50,000 |
    And submits form
    Then warranty appears in list
    And expiration date calculated (2025-01-15)
    ```
  - [ ] TC-006: Warranty Expiration Alert
    ```gherkin
    Given warranty expiring in 28 days
    When user logs in
    Then alert badge shows "28 days until expiration"
    And alert color is yellow
    ```
  - [ ] TC-007: Generate Claim Package
    ```gherkin
    Given warranty expiring in 14 days
    When clicks "Generate Claim Package"
    Then ZIP file downloads containing:
      | warranty_document.pdf |
      | purchase_invoice.pdf |
      | claim_form_[jurisdiction].pdf |
    ```
- **Sale Workflow Tests:**
  - [ ] TC-008: Initiate Sale
    ```gherkin
    Given boat "Azimut 55S" in dashboard
    When right-clicks boat
    And selects "Initiate Sale"
    And enters buyer email "buyer@example.com"
    Then sale initiated
    And status shows "In Progress"
    ```
  - [ ] TC-009: Generate As-Built Package
    ```gherkin
    Given active sale with 10 documents
    When clicks "Generate As-Built Package"
    Then ZIP generated with structure:
      | Registration/
      | Surveys/
      | Warranties/
      | Engine Manuals/
    And download link provided
    And generation time < 30 seconds
    ```
  - [ ] TC-010: Transfer to Buyer
    ```gherkin
    Given generated package
    When clicks "Transfer to Buyer"
    And confirms transfer
    Then buyer receives email
    And email contains download link
    And link expires in 30 days
    ```
- **Acceptance Criteria:**
  - All warranty and sale tests pass
  - No test flakiness (run suite 3x)
  - Test execution < 5 minutes per scenario
  - Screenshots captured on failures

**End of Day 3:**
- Playwright fully configured with 10+ E2E tests
- All critical user flows tested
- CI pipeline integrated
- Test suite runs in < 5 minutes

---

### Day 4 (Monday, Dec 7): Security Audit

**Objectives:**
- Conduct comprehensive security review
- Fix any vulnerabilities found
- Prepare for production deployment

**Morning Session (3 hours)**

**Task 4.1: Dependency & OWASP Security Scan (2 hours)**
- **What:** Scan for known vulnerabilities and compliance issues
- **Tools:** npm audit, OWASP Dependency-Check, snyk
- **Subtasks:**
  - [ ] Run `npm audit` to identify vulnerable packages
    ```bash
    npm audit --audit-level=moderate
    ```
  - [ ] Review critical/high severity issues
  - [ ] Update vulnerable packages (if available)
  - [ ] Document required security patches
  - [ ] Check for outdated Node.js version
  - [ ] Verify production build has no debug symbols
- **Expected Issues to Address:**
  - Axios version (any known MITM vulnerabilities)
  - Express.js version (patch security issues)
  - SQLite driver compatibility
  - BullMQ worker security
- **Deliverable:** `security-audit/dependency-scan.md`
- **Acceptance Criteria:**
  - No critical vulnerabilities
  - No high severity vulnerabilities (unless documented with mitigation)
  - All dependencies up to date
  - Build reproducible and verified

**Task 4.2: Code-Level Security Review (1 hour)**
- **What:** Manual review of authentication and authorization
- **Checklist:**
  - [ ] **JWT Security:**
    - [ ] Token expiration set to reasonable value (1 hour access, 7 days refresh)
    - [ ] Refresh tokens stored securely (HTTPOnly cookies)
    - [ ] Secret key not hardcoded, sourced from env vars
    - [ ] Token validation on every protected endpoint
  - [ ] **SQL Injection Prevention:**
    - [ ] All queries use parameterized statements
    - [ ] No string concatenation in SQL
    - [ ] Review `server/db/` for raw SQL
  - [ ] **XSS Prevention:**
    - [ ] User input sanitized (email, text fields)
    - [ ] HTML encoding on display
    - [ ] CSP headers configured
  - [ ] **CSRF Protection:**
    - [ ] CSRF tokens on forms
    - [ ] SameSite cookies set
    - [ ] Verify state in OAuth flows
- **Manual Testing:**
  - [ ] Attempt unauthorized DELETE on boat (should return 403)
  - [ ] Attempt to access other org's data (should return 403)
  - [ ] Test stats endpoint isolation (org_id filtering)
  - [ ] Verify webhooks signed with HMAC-SHA256
- **Deliverable:** `security-audit/code-review.md`

**Afternoon Session (4 hours)**

**Task 4.3: Authentication & Authorization Audit (2 hours)**
- **What:** Comprehensive auth system review
- **Scope:**
  - [ ] User registration validation
    - Weak password detection
    - Email validation and confirmation
    - Rate limiting on registration
  - [ ] Login security
    - Account lockout after N failed attempts
    - Password hashing algorithm (bcrypt with salt)
    - Login attempt logging
  - [ ] Session management
    - Session timeout (1 hour idle)
    - Concurrent session limits
    - Secure token storage
  - [ ] Tenant isolation
    - All queries filtered by org_id
    - No cross-org data leaks
    - Role-based access control
- **Test Cases:**
  - [ ] TC-SEC-001: Unauthorized DELETE fails
  - [ ] TC-SEC-002: Cross-org data access blocked
  - [ ] TC-SEC-003: Invalid JWT rejected
  - [ ] TC-SEC-004: Expired token refreshed
  - [ ] TC-SEC-005: Account lockout after 5 failures
- **Deliverable:** `security-audit/auth-audit.md`

**Task 4.4: Secrets & Environment Configuration (2 hours)**
- **What:** Verify no secrets in codebase
- **Checklist:**
  - [ ] Scan for hardcoded API keys/secrets
    ```bash
    grep -r "sk_live" server/
    grep -r "password" server/ --include="*.js"
    grep -r "secret" .env* --include="*.env"
    ```
  - [ ] `.env` file not in git (check .gitignore)
  - [ ] All secrets sourced from environment variables
  - [ ] Database password not in connection string logs
  - [ ] API keys rotated before deployment
  - [ ] Webhook secrets use HMAC-SHA256
  - [ ] SSL certificate private key not in repo
- **Pre-Deployment Checklist:**
  - [ ] `.env.production` configured with real values
  - [ ] `NODE_ENV=production` set
  - [ ] SSL certs loaded from secure location
  - [ ] Database connection uses connection pool
  - [ ] Redis password set (if applicable)
  - [ ] Webhook secrets generated and stored
- **Deliverable:** `security-audit/secrets-audit.md`

**End of Day 4:**
- All security vulnerabilities identified and fixed
- Authentication/authorization audit complete
- Secrets properly managed
- Security audit report generated
- Ready for production deployment

---

### Day 5-7 (Tue-Thu, Dec 8-10): Production Deployment & Pilot

**Objectives:**
- Deploy to production with zero-downtime strategy
- Validate all systems operational
- Set up Riviera Plaisance pilot account
- Complete post-deployment testing

#### Day 5 (Tuesday, Dec 8): Pre-Deployment & Deployment

**Morning Session (4 hours)**

**Task 5.1: Pre-Deployment Checklist & Preparation (2 hours)**
- **What:** Verify all prerequisites before production deployment
- **Checklist:**
  - [ ] All tests passing locally
    ```bash
    npm test # Unit tests
    npm run test:integration # Integration tests
    npm run test:e2e # E2E tests
    ```
  - [ ] Code review completed (if team available)
  - [ ] Database backup created
    ```bash
    cp navidocs.db backups/navidocs.db.$(date +%Y%m%d-%H%M%S)
    ```
  - [ ] Migration scripts tested on staging
    ```bash
    npm run migrate:up --stage staging
    npm run migrate:down --stage staging
    npm run migrate:up --stage staging
    ```
  - [ ] Environment variables configured in `.env.production`
    ```
    NODE_ENV=production
    DATABASE_URL=/var/www/navidocs/navidocs.db
    JWT_SECRET=[32+ char random string]
    YACHTWORLD_API_KEY=[from YachtWorld account]
    BOATTRADER_API_KEY=[from Boat Trader account]
    REDIS_URL=redis://localhost:6379
    SMTP_HOST=[email provider]
    SMTP_FROM=noreply@navidocs.app
    ```
  - [ ] SSL certificate valid (check expiration)
    ```bash
    openssl x509 -in /etc/ssl/navidocs.crt -text -noout | grep "Not After"
    ```
  - [ ] Dependencies updated and audited
    ```bash
    npm audit
    npm install --production
    ```
  - [ ] Build tested for production
    ```bash
    npm run build
    ```
  - [ ] No security vulnerabilities (0 high/critical)
  - [ ] Monitoring configured (error tracking, uptime alerts)
  - [ ] Rollback procedure documented and tested

**Task 5.2: Production Deployment (Execution) (2 hours)**
- **What:** Execute zero-downtime deployment to production
- **Deployment Steps:**
  1. **Stop Background Workers** (prevent job processing during migration)
     ```bash
     pm2 stop navidocs-worker
     ```
  2. **Database Backup**
     ```bash
     cp /var/www/navidocs/navidocs.db \
        /var/www/backups/navidocs.db.$(date +%Y%m%d-%H%M%S)
     ```
  3. **Pull Latest Code**
     ```bash
     cd /var/www/navidocs
     git fetch origin
     git checkout main # or specific commit
     git pull origin main
     ```
  4. **Install Dependencies**
     ```bash
     npm install --production --no-save
     npm run build
     ```
  5. **Run Database Migrations**
     ```bash
     npm run migrate:up
     ```
  6. **Health Check (pre-restart)**
     ```bash
     npm run test:smoke # Local validation
     ```
  7. **Restart Services**
     ```bash
     pm2 restart navidocs-api
     pm2 restart navidocs-worker
     pm2 save
     ```
  8. **Verify Running**
     ```bash
     pm2 status
     pm2 logs navidocs-api --lines 50
     ```
- **Duration:** ~15 minutes total
- **Rollback Trigger:** Any step fails → execute rollback immediately

**Afternoon Session (3 hours)**

**Task 5.3: Post-Deployment Validation (3 hours)**
- **What:** Verify production system is operational
- **Health Checks (Automated):**
  - [ ] Health endpoint responds: `GET /api/health` → 200
  - [ ] Database connectivity: Query boats table (should be empty or have seed data)
  - [ ] Background worker running: `pm2 status navidocs-worker` → online
  - [ ] Error logs clean: `pm2 logs navidocs-api` (no exceptions in first 100 lines)
  - [ ] Response times acceptable: Critical endpoints < 500ms
- **Critical Endpoints Validation:**
  - [ ] Login flow works: `POST /api/auth/login`
  - [ ] Boat creation works: `POST /api/boats`
  - [ ] Warranty creation works: `POST /api/warranties`
  - [ ] Sale workflow works: `POST /api/sales`
  - [ ] MLS sync triggered: Manual sync endpoint responds
  - [ ] WebhooksWork: Test webhook delivery via test.webhook.site
- **Load Testing (Light):**
  - [ ] 10 concurrent login requests succeed
  - [ ] Boat list endpoint handles 100 boats
  - [ ] Warranty list endpoint responsive
- **Smoke Test Script:**
  ```bash
  #!/bin/bash
  # Smoke tests for production
  set -e

  BASE_URL="https://api.navidocs.app"

  echo "Testing health endpoint..."
  curl -f $BASE_URL/api/health || exit 1

  echo "Testing auth endpoint..."
  curl -f -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' || exit 1

  echo "Testing boats endpoint..."
  curl -f -H "Authorization: Bearer $TOKEN" $BASE_URL/api/boats || exit 1

  echo "All smoke tests passed!"
  ```
- **Monitoring Activation:**
  - [ ] Error tracking enabled (Sentry/similar)
  - [ ] Uptime monitoring active
  - [ ] Log aggregation working
  - [ ] Alert thresholds configured
- **Success Criteria:**
  - All health checks pass
  - No errors in logs
  - Response times < 500ms
  - All critical endpoints functional

**End of Day 5:**
- Production deployment completed successfully
- Post-deployment validation passed
- All systems operational
- Ready for pilot rollout

---

#### Day 6 (Wednesday, Dec 9): Extended Validation & Monitoring

**Full Day (7 hours)**

**Task 6.1: 24-Hour Monitoring & Error Resolution (7 hours)**
- **What:** Monitor production for issues and resolve any problems
- **Hourly Checks:**
  - [ ] Review error logs (check for exceptions)
  - [ ] Monitor CPU/memory usage
  - [ ] Check database query performance
  - [ ] Verify background job execution
  - [ ] Monitor external API calls (YachtWorld, Boat Trader)
- **Key Metrics to Monitor:**
  - Request error rate (target: <1%)
  - Response time P95 (target: <500ms)
  - Database connection pool usage
  - Background job success rate (target: >99%)
  - Webhook delivery success rate (target: >95%)
- **Issue Resolution Process:**
  - [ ] If error rate > 5%, investigate immediately
  - [ ] If response time > 1s, check database queries
  - [ ] If jobs failing, check worker logs
  - [ ] If webhooks failing, check external API status
- **Performance Baseline Collection:**
  - Record initial metrics for comparison
  - Note any unusual patterns
  - Document any temporary issues
- **Support Preparation:**
  - [ ] Prepare incident response runbook
  - [ ] Document known issues and workarounds
  - [ ] Create troubleshooting guide for pilot users
- **Success Criteria:**
  - System stable for 24 hours
  - No critical issues requiring rollback
  - All metrics within acceptable range
  - Ready for pilot user access

---

#### Day 7 (Thursday, Dec 10): Riviera Plaisance Pilot Setup

**Full Day (7 hours)**

**Task 7.1: Pilot Account & Demo Data Setup (3 hours)**
- **What:** Create and configure Riviera Plaisance pilot account
- **Subtasks:**
  - [ ] Create organization account
    ```sql
    INSERT INTO organizations (name, owner_email, plan)
    VALUES ('Riviera Plaisance', 'sylvain@rivieraplaisance.com', 'premium');
    ```
  - [ ] Create admin user
    ```sql
    INSERT INTO users (email, name, role, organization_id)
    VALUES ('sylvain@rivieraplaisance.com', 'Sylvain', 'admin', 'org-xxx');
    ```
  - [ ] Set temporary password and send setup email
  - [ ] Import sample boat data (5-10 yachts)
    - Azimut 55S
    - Sunseeker Manhattan
    - Princess Y95
    - Benetti Custom
    - Lürssen Superyacht
  - [ ] Add sample warranties to each boat
  - [ ] Add sample documents (surveys, registrations)
  - [ ] Configure Home Assistant webhook (optional for demo)
    ```
    URL: https://ha.rivieraplaisance.com/api/webhook/navidocs
    Topics: ["WARRANTY_EXPIRING", "DOCUMENT_UPLOADED"]
    ```
  - [ ] Enable MLS sync for demo boats (optional)
- **Demo Data Structure:**
  ```
  Boat 1: Azimut 55S
  - Warranties: Engine (12mo), Generator (24mo)
  - Documents: Registration, Survey, Engine Manual
  - Status: For Sale

  Boat 2: Sunseeker Manhattan
  - Warranties: Engine (36mo), Warranty Package (60mo)
  - Documents: Builder Cert, Sea Trial Report
  - Status: Owned
  ```
- **Acceptance Criteria:**
  - 5+ sample boats with realistic data
  - Warranties configured for each boat
  - Documents attached to boats
  - Login successful with setup password
  - All features visible in UI

**Task 7.2: Training & Handoff Documentation (2 hours)**
- **What:** Create comprehensive training materials for pilot user
- **Deliverables:**
  - [ ] User guide: `docs/pilot-user-guide.md`
    - Login instructions
    - Dashboard overview
    - How to add boats
    - How to track warranties
    - How to generate as-built packages
    - How to initiate sales
  - [ ] Video tutorials (if resources allow)
    - 2-3 minute overview
    - Feature walkthroughs
  - [ ] Quick reference card (1-page PDF)
  - [ ] Support contact information
  - [ ] Known issues list (if any)
  - [ ] Feedback form link
- **Training Checklist:**
  - [ ] Sylvain can log in successfully
  - [ ] Sylvain can navigate to boats
  - [ ] Sylvain can view warranties
  - [ ] Sylvain can trigger manual MLS sync
  - [ ] Sylvain can access help documentation
- **Acceptance Criteria:**
  - All documentation complete and accessible
  - Pilot user trained on core features
  - Support process established
  - Feedback mechanism configured

**Task 7.3: Feedback Collection & Support (2 hours)**
- **What:** Set up feedback mechanism and prepare for pilot feedback
- **Setup:**
  - [ ] Email support alias: support@navidocs.app
  - [ ] Feedback form embedded in app
  - [ ] Google Form for formal feedback surveys
  - [ ] Slack channel for urgent issues (if applicable)
  - [ ] GitHub issues for feature requests
- **Support SLA for Pilot:**
  - Critical issues: 4-hour response
  - Standard issues: 24-hour response
  - Feature requests: weekly review
- **Feedback Categories:**
  - UX/Usability issues
  - Performance problems
  - Feature requests
  - Integration feedback
  - Missing documentation
- **Success Criteria:**
  - Feedback mechanism working
  - Support process established
  - Pilot user confident in reaching out
  - First issues documented

**End of Day 7 / Week 4 Complete:**
- Production deployment stable and validated
- Riviera Plaisance pilot account active
- Sample data loaded
- Pilot user trained
- Feedback mechanism established
- System ready for extended pilot phase

---

## MLS API Integration Specifications

### Overview

The MLS (Multiple Listing Service) integration allows NaviDocs to automatically sync yacht listings to external marketplaces (YachtWorld, Boat Trader) when boats are marked "for sale."

### Architecture

```
NaviDocs Boat Data
    ↓
ListingSyncService
    ↓
MLSProvider Interface (Abstract)
    ├── YachtWorldClient
    └── BoatTraderClient
    ↓
YachtWorld API / Boat Trader API
    ↓
External Marketplaces
```

### YachtWorld API Specification

**Base URL:** `https://api.yachtworld.com/v1`

**Authentication:**
- Type: API Key
- Header: `Authorization: Bearer {API_KEY}`
- Obtain: YachtWorld account management dashboard

**Endpoints:**

#### 1. Create Listing
```
POST /listings
Content-Type: application/json
Authorization: Bearer {API_KEY}

Request Body:
{
  "title": "Azimut 55S - 2020",
  "year": 2020,
  "make": "Azimut",
  "model": "55S",
  "length_ft": 55,
  "length_m": 16.7,
  "cabins": 3,
  "heads": 2,
  "hours": 1200,
  "fuel_type": "diesel",
  "price": 2500000,
  "currency": "USD",
  "description": "Immaculate condition, recent survey, full warranty...",
  "location": "Miami, FL",
  "condition": "excellent",
  "features": ["GPS", "AIS", "Autopilot", "Full Canvas"],
  "contact_email": "sales@rivieraplaisance.com",
  "contact_phone": "+33 4 92 97 XX XX"
}

Response (201 Created):
{
  "listing_id": "yw-12345678",
  "url": "https://www.yachtworld.com/yachts/azimut/55s-12345678",
  "created_at": "2025-12-04T10:30:00Z"
}
```

#### 2. Update Listing
```
PUT /listings/{listing_id}
Content-Type: application/json

Request Body: (same as create, partial updates allowed)

Response (200 OK):
{
  "listing_id": "yw-12345678",
  "updated_at": "2025-12-04T14:30:00Z",
  "changes": ["price", "hours"]
}
```

#### 3. Get Listing
```
GET /listings/{listing_id}

Response (200 OK):
{
  "listing_id": "yw-12345678",
  "title": "Azimut 55S - 2020",
  "price": 2500000,
  "status": "active",  // active, pending, sold
  "created_at": "2025-12-04T10:30:00Z",
  "updated_at": "2025-12-04T14:30:00Z"
}
```

#### 4. Delete Listing
```
DELETE /listings/{listing_id}

Response (204 No Content)
```

#### 5. Attach Document
```
POST /listings/{listing_id}/documents
Content-Type: multipart/form-data

Form Data:
- file: [PDF file]
- document_type: "warranty" | "survey" | "registration" | "engine_manual"
- description: "Engine Warranty - Caterpillar C32"

Response (201 Created):
{
  "document_id": "doc-87654321",
  "url": "https://cdn.yachtworld.com/docs/yw-12345678/doc-87654321.pdf"
}
```

### Boat Trader API Specification

**Base URL:** `https://api.boattrader.com/v2`

**Authentication:**
- Type: OAuth2
- Get token: `POST /auth/token` with client credentials
- Token lifetime: 1 hour
- Refresh: Request new token when expired

**Key Differences from YachtWorld:**
- Requires OAuth2 instead of simple API key
- Category field required: `saltwater` | `freshwater` | `other`
- Slightly different field names (e.g., `hull_material` vs YachtWorld's `hull_type`)
- Rate limit: 1000 requests/hour vs YachtWorld's 2000/hour

**Endpoints:** (similar structure to YachtWorld)

### Unified Interface (MLSProvider)

```javascript
class MLSProvider {
  // Authentication
  async authenticate() {
    // Implement provider-specific auth
    // Return: { valid: boolean, token?: string, error?: string }
  }

  // Listing Management
  async createListing(boatData) {
    // Map NaviDocs boat to provider listing format
    // POST to provider API
    // Return: { listing_id, external_url, success: boolean }
  }

  async updateListing(listingId, boatData) {
    // PUT to provider API
    // Return: { success: boolean, updated_at }
  }

  async getListing(listingId) {
    // GET from provider API
    // Return: { listing data }
  }

  async deleteListing(listingId) {
    // DELETE from provider API
    // Return: { success: boolean }
  }

  // Document Management
  async attachDocument(listingId, documentType, fileStream) {
    // Upload file to provider
    // Return: { document_id, url }
  }

  // Validation
  async validateListingData(boatData) {
    // Check required fields
    // Return: { valid: boolean, errors: [] }
  }
}
```

### Data Mapping: NaviDocs → YachtWorld

```
NaviDocs Field          →  YachtWorld Field
─────────────────────────────────────────
boat.name               →  listing.title
boat.year               →  listing.year
boat.make               →  listing.make
boat.model              →  listing.model
boat.length_ft          →  listing.length_ft
boat.length_m           →  listing.length_m
boat.bedrooms           →  listing.cabins
boat.bathrooms          →  listing.heads
boat.engine_hours       →  listing.hours
boat.fuel_type          →  listing.fuel_type
boat.price              →  listing.price
boat.location           →  listing.location
boat.condition          →  listing.condition
boat.features           →  listing.features
boat.description        →  listing.description
```

### Webhook Handling (Optional)

If YachtWorld/Boat Trader send webhook notifications for listing status changes:

```javascript
// POST /api/webhooks/mls/{provider}
{
  "listing_id": "yw-12345678",
  "event": "listing_status_changed",
  "status": "sold",  // or: pending, delisted, etc.
  "timestamp": "2025-12-10T15:30:00Z",
  "signature": "hmac-sha256-signature"
}

// Verify signature and update boat status in NaviDocs
```

### Error Handling

```javascript
class YachtWorldError extends Error {
  constructor(code, message, statusCode) {
    this.code = code;        // e.g., "INVALID_CREDENTIALS"
    this.message = message;  // e.g., "Invalid API key"
    this.statusCode = statusCode;  // HTTP status from YW
  }
}

// Handle specific errors:
- 401: Invalid credentials → Re-authenticate
- 403: Rate limit exceeded → Exponential backoff
- 409: Listing already exists → Update instead of create
- 422: Invalid data → Log validation errors, notify user
```

### Sync Strategy

**Trigger Points:**
1. User marks boat "for_sale" → Immediate sync
2. User updates boat details → Sync within 5 minutes (batched)
3. Daily sync job (2am UTC) → Sync all "for_sale" boats
4. Manual admin trigger → Immediate sync

**Idempotency:**
- Track `external_listing_id` in NaviDocs database
- If already synced, UPDATE instead of CREATE
- Use boat.id as idempotency key

**Retry Logic:**
- Failed sync → Retry in 5 minutes
- 3 failed attempts → Mark as "sync_failed", notify admin
- Daily retry job for failed syncs

---

## E2E Test Scenarios

### Test Environment Setup

**Browser:** Chromium (primary), Firefox, WebKit (if time allows)
**Test Framework:** Playwright
**Test Data:** Seeded SQLite database
**Cleanup:** Fresh database after each test

### Test Scenarios (10 Critical Flows)

#### TC-001: User Registration & Onboarding
```gherkin
Feature: User Registration Flow

Scenario: New user completes registration
  Given user on login page
  When user clicks "Create Account"
  And fills registration form:
    | Email | newuser@example.com |
    | Password | SecurePass123! |
    | Name | John Doe |
    | Organization | My Yachts Inc |
  And clicks "Register"
  Then user account created
  And user redirected to boat dashboard
  And welcome message displayed: "Welcome, John!"
  And email verification link sent

Scenario: Email verification required
  Given user registered but not verified
  When user tries to access boats page
  Then redirected to verification page
  And email verification link provided
  When user clicks email link
  Then account verified
  And full access granted
```

#### TC-002: Boat Creation & Management
```gherkin
Feature: Boat Creation

Scenario: User creates new boat listing
  Given authenticated user with permission to create boats
  When navigates to "My Boats" section
  And clicks "Add New Boat"
  And fills boat form:
    | Year | 2020 |
    | Make | Azimut |
    | Model | 55S |
    | Length | 55 feet |
    | Price | $2,500,000 |
    | Location | Miami, FL |
    | Description | Immaculate condition... |
  And uploads boat image
  And clicks "Save"
  Then boat created successfully
  And boat appears in list
  And user can edit boat details
```

#### TC-003: Warranty Tracking Creation
```gherkin
Feature: Warranty Creation & Tracking

Scenario: User creates warranty for boat
  Given authenticated user with boat "Azimut 55S"
  When navigates to boat detail page
  And clicks "Add Warranty"
  And fills warranty form:
    | Item | Engine |
    | Provider | Caterpillar |
    | Purchase Date | 2023-01-15 |
    | Warranty Period | 24 months |
    | Coverage Amount | $50,000 |
  And clicks "Save"
  Then warranty created
  And expiration date calculated: 2025-01-15
  And warranty appears in boat's warranty list

Scenario: Warranty expiration alert displayed
  Given warranty expiring in 28 days
  When user navigates to boat detail
  Then warranty alert badge displayed
  And alert shows "Expires in 28 days"
  And alert color is yellow (warning)
  When user clicks alert
  Then warranty details displayed
  And "Generate Claim Package" button available
```

#### TC-004: Warranty Claim Package Generation
```gherkin
Feature: Warranty Claim Package Generation

Scenario: User generates claim package for expiring warranty
  Given warranty expiring in 14 days
  When user clicks "Generate Claim Package"
  Then ZIP file generation begins
  And progress indicator shown
  When generation complete
  Then ZIP file contains:
    | warranty_document.pdf |
    | purchase_invoice.pdf |
    | claim_form_[jurisdiction].pdf |
  And download link provided
  And download link expires in 7 days
  And user receives download confirmation email
```

#### TC-005: Sale Workflow Initiation
```gherkin
Feature: Yacht Sale Workflow

Scenario: User initiates sale for boat
  Given authenticated user with boat "Azimut 55S"
  When right-clicks boat in dashboard
  And selects "Initiate Sale"
  And enters buyer email: "buyer@example.com"
  And confirms buyer contact
  Then sale initiated
  And sale status shows "In Progress"
  And "Generate Package" button appears
  And sale timeline displayed

Scenario: User marks boat as sold
  Given active sale
  When sale completed
  And user clicks "Mark as Sold"
  And confirms sale completion
  Then boat status changed to "Sold"
  And boat removed from active listings
  And sale archived with completion date
```

#### TC-006: As-Built Package Generation
```gherkin
Feature: As-Built Package Generation for Buyer

Scenario: Seller generates as-built package with all documents
  Given boat with 10 documents:
    | registration.pdf |
    | surveys.pdf |
    | engine_manual.pdf |
    | warranty_certificate.pdf |
    | service_logs.pdf |
    | ... (others) |
  When seller clicks "Generate As-Built Package"
  Then ZIP generated with structure:
    | Registration/
    | Surveys/
    | Warranties/
    | Engine Manuals/
    | Service Records/
    | Other Documents/
  And all documents included in correct folders
  And cover letter with boat details generated
  And package ready for download
  And generation time < 30 seconds
```

#### TC-007: Document Transfer to Buyer
```gherkin
Feature: Buyer Document Transfer

Scenario: Seller transfers documents to buyer
  Given seller with generated as-built package
  When seller clicks "Transfer to Buyer"
  And confirms transfer
  Then buyer receives email with:
    | Subject: "Your Yacht Documentation Package" |
    | Download link with unique token |
    | 30-day expiration notice |
    | Instructions for accessing documents |
  When buyer clicks email link
  Then buyer can download package
  And transfer logged in audit trail
  And seller notified of buyer download (optional)
  When 30 days pass
  Then download link expires
  And buyer receives notification: "Download expires in 1 day"
```

#### TC-008: Home Assistant Integration Webhook
```gherkin
Feature: Home Assistant Webhook Integration

Scenario: User registers Home Assistant webhook
  Given authenticated user with admin permissions
  When navigates to Integrations section
  And clicks "Connect Home Assistant"
  And enters Home Assistant URL: "https://ha.example.com"
  And selects event topics:
    | WARRANTY_EXPIRING |
    | DOCUMENT_UPLOADED |
  And clicks "Connect"
  Then webhook registered
  And reachability check performed
  And confirmation message: "Home Assistant connected successfully"
  And webhook appears in active integrations list

Scenario: Warranty expiration event delivered to Home Assistant
  Given Home Assistant webhook registered
  And warranty expires in 30 days
  When warranty expiration worker runs
  Then WARRANTY_EXPIRING event published
  And Home Assistant receives webhook POST:
    {
      "event": "WARRANTY_EXPIRING",
      "boat": "Azimut 55S",
      "warranty": "Engine",
      "days_until_expiration": 30,
      "notification_url": "..."
    }
  And HA automation triggered (user-configurable)
  And NaviDocs logs successful delivery
  And next retry not scheduled (delivery successful)
```

#### TC-009: MLS Listing Sync (YachtWorld)
```gherkin
Feature: MLS Integration - YachtWorld

Scenario: Boat marked for sale syncs to YachtWorld
  Given authenticated user with boat "Azimut 55S"
  And YachtWorld API credentials configured
  When user marks boat "For Sale"
  Then boat data synced to YachtWorld within 5 minutes
  And YachtWorld listing created
  And listing visible on YachtWorld.com
  And boat status shows "Synced to YachtWorld"
  And external listing link provided

Scenario: Boat details update syncs to YachtWorld
  Given boat synced to YachtWorld
  When user updates price: $2.4M → $2.3M
  Then update synced to YachtWorld
  And YachtWorld listing price updated
  And sync timestamp recorded
```

#### TC-010: Error Recovery & Rollback
```gherkin
Feature: Error Handling & Resilience

Scenario: Database error during sale initiation
  Given system in degraded state (DB slow)
  When user attempts to initiate sale
  Then system gracefully handles error
  And user sees "Please try again" message
  And error logged to monitoring system
  When user retries
  Then operation succeeds
  And sale created without duplication

Scenario: External API failure (YachtWorld down)
  Given YachtWorld API temporarily unavailable
  When user marks boat for sale
  Then sync failure logged
  And user notified: "Sync pending - will retry when YachtWorld available"
  When YachtWorld recovers
  Then automatic retry triggers
  And boat synced successfully
```

### Test Data Requirements

```yaml
Test Users:
  - demo@navidocs.app (password: demo123)
    role: boat_owner
    organization: Riviera Plaisance
  - admin@navidocs.app (password: admin123)
    role: admin

Test Boats:
  - Azimut 55S (3 warranties, 5 documents, for sale)
  - Sunseeker Manhattan (2 warranties, 3 documents, owned)
  - Princess Y95 (expired warranty, archived)

Test Warranties:
  - Engine: expires in 28 days (warning)
  - Generator: expires in 180 days (active)
  - Expired Warranty: expired 30 days ago
```

---

## Security Audit Checklist

### 1. Dependency Vulnerabilities

- [ ] Run `npm audit`
- [ ] Document all vulnerabilities found
- [ ] Categorize by severity: CRITICAL, HIGH, MODERATE, LOW
- [ ] For each CRITICAL/HIGH:
  - [ ] Is patch available? (npm update)
  - [ ] If no patch: Is vulnerability exploitable in our usage?
  - [ ] Document mitigation if no patch
- [ ] No unresolved CRITICAL vulnerabilities
- [ ] No unresolved HIGH vulnerabilities (unless documented)
- [ ] Update `SECURITY.md` with known issues and workarounds

**Expected Packages to Check:**
- axios (HTTP client - check for request forgery)
- express.js (web framework - patch security middleware)
- sqlite (database - integrity checks)
- bullmq (job queue - auth enforcement)
- jsonwebtoken (JWT - algorithm validation)

### 2. Authentication & Session Security

#### JWT Token Management
- [ ] Token expiration set to reasonable value
  - Access tokens: 1 hour
  - Refresh tokens: 7 days
- [ ] Refresh tokens:
  - [ ] Stored in HTTPOnly cookies (not localStorage)
  - [ ] SameSite=Strict attribute set
  - [ ] Secure flag set (HTTPS only)
- [ ] Token revocation on logout (add to blacklist or shorten lifetime)
- [ ] Secret key:
  - [ ] Generated from environment variable
  - [ ] At least 32 characters (256 bits)
  - [ ] Never hardcoded in source
  - [ ] Rotated regularly
- [ ] Token validation:
  - [ ] Signature verified
  - [ ] Expiration checked
  - [ ] Algorithm verified (not "none")
  - [ ] Issuer and audience validated

#### Login Security
- [ ] Password requirements enforced:
  - Minimum 8 characters
  - Mix of uppercase, lowercase, numbers, symbols
  - Not in common password list (check against HIBP)
- [ ] Password hashing:
  - [ ] Algorithm: bcrypt with salt rounds >= 12
  - [ ] Never store plaintext passwords
  - [ ] Never log passwords
- [ ] Account lockout:
  - [ ] After 5 failed login attempts: lock for 15 minutes
  - [ ] Lockout logged and monitored
  - [ ] Admin can manually unlock accounts
- [ ] Session management:
  - [ ] Session timeout: 1 hour idle
  - [ ] Concurrent session limit: 3 per user
  - [ ] Session invalidation on password change
  - [ ] Secure session cookie (HttpOnly, Secure, SameSite)

### 3. Authorization & Access Control

- [ ] Tenant isolation enforced:
  - [ ] Every query filtered by organization_id
  - [ ] User cannot access other organization's data
  - [ ] Sample tests:
    ```javascript
    // User from Org A should NOT see Org B's boats
    GET /api/boats?organization_id=org-b
    → Response: 403 Forbidden (or filtered to Org A only)
    ```
- [ ] Role-based access control:
  - [ ] Admin: full access
  - [ ] Boat Owner: access own boats only
  - [ ] Viewer: read-only access
  - [ ] Role enforcement on every endpoint
- [ ] DELETE endpoint protection:
  - [ ] Ownership verified (boat belongs to user's org)
  - [ ] Soft delete implemented (mark as deleted, don't remove)
  - [ ] Hard delete (if allowed) requires admin + confirmation
  - [ ] Deletion logged in audit trail

### 4. Input Validation & Injection Prevention

#### SQL Injection
- [ ] All queries use parameterized statements
  - [ ] No string concatenation in SQL
  - [ ] `?` placeholders or named parameters
  - [ ] Verify in all `server/db/` files
- [ ] Example of SECURE code:
  ```javascript
  // SECURE
  db.run('INSERT INTO boats (name, org_id) VALUES (?, ?)', [name, orgId]);

  // INSECURE (should not exist)
  db.run(`INSERT INTO boats (name) VALUES ('${name}')`);
  ```
- [ ] Automated check: grep for string interpolation in SQL

#### XSS (Cross-Site Scripting)
- [ ] All user input sanitized:
  - [ ] Email fields validated as email
  - [ ] Text fields: HTML entities escaped on display
  - [ ] URLs: protocol whitelist (http/https only)
- [ ] Content Security Policy (CSP) headers:
  ```
  Content-Security-Policy:
    default-src 'self';
    script-src 'self' 'unsafe-inline' (if needed);
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
  ```
- [ ] No dangerouslySetInnerHTML in React/Vue without sanitization
- [ ] File upload validation:
  - [ ] MIME type checked
  - [ ] File size limits enforced (< 100MB per file)
  - [ ] Filename sanitized (no path traversal)

#### CSRF (Cross-Site Request Forgery)
- [ ] CSRF tokens on all forms
- [ ] Token validation on state-changing requests (POST, PUT, DELETE)
- [ ] SameSite cookie attribute: `Strict` or `Lax`
- [ ] Verify in authentication endpoints

### 5. Secrets & Configuration Management

- [ ] No secrets in git:
  - [ ] `.env` files in `.gitignore`
  - [ ] No test credentials in code
  - [ ] API keys not in comments
  - [ ] Scan git history for accidental commits:
    ```bash
    git log --all --full-history -- .env
    git log --all -S 'sk_live' -- '*.js'
    ```
- [ ] Environment variable management:
  - [ ] All secrets loaded from `.env.production`
  - [ ] `.env.example` provides template (no real values)
  - [ ] Deployment script verifies all required env vars set
  - [ ] No env var logs (sanitize logs of sensitive data)
- [ ] API key rotation:
  - [ ] YachtWorld API key rotated before production
  - [ ] Boat Trader API key rotated before production
  - [ ] JWT secret rotated (or plan for rotation)
  - [ ] Database password strong (20+ random characters)
- [ ] Webhook secrets:
  - [ ] Generated using crypto.randomBytes(32)
  - [ ] HMAC-SHA256 signatures on all webhooks
  - [ ] Signature verified on receipt:
    ```javascript
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (signature !== request.headers['x-navidocs-signature']) {
      return 401;
    }
    ```

### 6. HTTPS & Transport Security

- [ ] SSL certificate:
  - [ ] Valid certificate installed
  - [ ] Not self-signed (for production)
  - [ ] Expiration checked: `openssl x509 -in cert.pem -dates`
  - [ ] Certificate refreshed before expiration (90 days)
- [ ] HTTPS enforced:
  - [ ] All traffic redirected to HTTPS
  - [ ] HSTS header: `Strict-Transport-Security: max-age=31536000`
  - [ ] Cookie secure flag set (HTTPS only)
- [ ] TLS configuration:
  - [ ] TLS 1.2+ required (no TLS 1.0 or 1.1)
  - [ ] Strong cipher suites only
  - [ ] Perfect Forward Secrecy (PFS) enabled

### 7. Data Protection

- [ ] Database encryption:
  - [ ] At rest: SQLite encrypted (SQLCipher) or disk-level encryption
  - [ ] In transit: HTTPS only
  - [ ] Backups encrypted
- [ ] Sensitive data handling:
  - [ ] Passwords: bcrypt hashed
  - [ ] API keys: encrypted at rest (or use separate secret store)
  - [ ] PII (email): encrypted at rest if possible
- [ ] Data access logging:
  - [ ] Log who accessed what data
  - [ ] Audit trail for sensitive operations
  - [ ] Retention: 90 days minimum

### 8. File Upload Security

- [ ] File upload validation:
  - [ ] MIME type verification (not just extension)
  - [ ] File size limits (< 100MB per file)
  - [ ] Filename sanitized (alphanumeric + dash/underscore)
  - [ ] Stored outside web root (not directly accessible)
- [ ] Malware scanning (optional):
  - [ ] Virus scan on upload (ClamAV or similar)
  - [ ] Quarantine suspicious files
- [ ] Access control:
  - [ ] Uploaded files accessible only to owner's organization
  - [ ] No direct URL exposure (use download endpoint with auth)

### 9. Error Handling & Logging

- [ ] Error messages:
  - [ ] Generic messages to users (not technical details)
  - [ ] Detailed errors logged server-side
  - [ ] No sensitive data in error messages (passwords, tokens)
- [ ] Logging:
  - [ ] All authentication attempts logged
  - [ ] All authorization failures logged
  - [ ] All data modifications logged
  - [ ] Logs not exposed publicly (access via admin only)
  - [ ] Log rotation: keep 30 days history

### 10. Third-Party Integrations

- [ ] Home Assistant integration:
  - [ ] Webhook URL validated before registration
  - [ ] HTTPS required for webhook URLs
  - [ ] Webhook secret generated and stored
  - [ ] Delivery failures retried with backoff
- [ ] YachtWorld integration:
  - [ ] API key stored securely
  - [ ] HTTPS used for API calls
  - [ ] Rate limiting respected
  - [ ] Failed syncs don't block user operations
- [ ] Boat Trader integration:
  - [ ] OAuth2 credentials stored securely
  - [ ] Token refresh handled automatically
  - [ ] Scope: minimal permissions requested

### 11. Security Testing

- [ ] Manual testing:
  - [ ] Attempt unauthorized DELETE → 403
  - [ ] Attempt cross-org data access → 403
  - [ ] Login with wrong password → account lockout after 5 attempts
  - [ ] Use expired token → 401 Unauthorized
  - [ ] Modify JWT claims → signature verification fails
- [ ] Automated testing:
  - [ ] Run Playwright E2E tests with security scenarios
  - [ ] npm audit for dependencies
  - [ ] OWASP ZAP scan (if available)

### 12. Compliance & Documentation

- [ ] Security policy documented:
  - [ ] `SECURITY.md` in repo root
  - [ ] Known vulnerabilities listed with workarounds
  - [ ] Incident response procedure
  - [ ] Security contact: security@navidocs.app
- [ ] Privacy policy:
  - [ ] Data collection disclosed
  - [ ] Data retention explained
  - [ ] Third-party sharing disclosed
  - [ ] User rights explained
- [ ] Terms of Service:
  - [ ] Acceptable use policy
  - [ ] Liability limitations
  - [ ] Warranty disclaimers

---

## Production Deployment Procedure

### Phase 1: Pre-Deployment (Day 5 Morning)

#### 1.1 Pre-Deployment Checklist
- [ ] All unit, integration, and E2E tests pass locally
- [ ] Code review completed (at least one other person)
- [ ] No console errors or warnings in build output
- [ ] Security audit passed (no CRITICAL/HIGH vulnerabilities)
- [ ] Database migrations tested on staging environment
- [ ] Performance benchmarks acceptable (page load < 2s)
- [ ] All environment variables documented and ready

#### 1.2 Backup Procedures
```bash
# Create database backup
cp /var/www/navidocs/navidocs.db \
   /var/www/navidocs/backups/navidocs.db.pre-deploy.$(date +%Y%m%d-%H%M%S)

# Verify backup integrity
sqlite3 /var/www/navidocs/backups/navidocs.db.* ".tables"
# Expected output: boats documents ... (list of all tables)
```

#### 1.3 Staging Validation
```bash
# Deploy to staging first (if available)
git checkout main
git pull origin main
npm install --production
npm run build
npm run migrate:up --stage staging

# Run smoke tests against staging
curl http://staging-api.navidocs.app/api/health
# Expected: 200 OK
```

### Phase 2: Deployment (Day 5 Afternoon)

#### 2.1 Pre-Deployment Safety Checks
```bash
# Ensure no local changes
git status
# Expected: "On branch main, working tree clean"

# Verify current version tag
git describe --tags
# Expected: v1.0.0 (or similar)

# Check production currently running
pm2 status
# Expected: navidocs-api online, navidocs-worker online
```

#### 2.2 Deployment Execution Steps

**Step 1: Stop Background Workers** (prevent job processing during migration)
```bash
pm2 stop navidocs-worker
sleep 5

# Verify stopped
pm2 status
# Expected: navidocs-worker stopped
```

**Step 2: Database Backup** (ensure we can rollback)
```bash
# Backup current database
cp /var/www/navidocs/navidocs.db \
   /var/www/navidocs/backups/navidocs.db.$(date +%Y%m%d-%H%M%S)

# Verify backup readable
sqlite3 /var/www/navidocs/backups/navidocs.db.* \
  "SELECT COUNT(*) FROM boats;" > /dev/null
# Should complete without error
```

**Step 3: Pull Latest Code**
```bash
cd /var/www/navidocs

# Save current commit for potential rollback
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "Rollback commit: $CURRENT_COMMIT" >> /var/log/navidocs-deploy.log

# Fetch and checkout latest
git fetch origin main
git checkout main
git pull origin main

# Verify we're on latest
git status
# Expected: "On branch main, Your branch is up to date..."
```

**Step 4: Install Dependencies**
```bash
npm install --production --no-save

# Clean obsolete packages
npm prune --production

# Verify critical packages present
npm list express sqlite3 bullmq
# Should list versions for each package
```

**Step 5: Build Application**
```bash
npm run build

# Check build output
if [ ! -d "dist" ]; then
  echo "Build failed - dist directory missing!"
  exit 1
fi

echo "Build completed successfully"
```

**Step 6: Test Application (Pre-Restart)**
```bash
# Perform local smoke tests
npm run test:smoke

# Expected output: "All smoke tests passed"
```

**Step 7: Run Database Migrations**
```bash
# List pending migrations
npm run migrate:status

# Apply migrations
npm run migrate:up

# Verify migrations applied
npm run migrate:status
# Expected: "All migrations up to date"

# Verify data integrity (sample query)
sqlite3 /var/www/navidocs/navidocs.db \
  "SELECT COUNT(*) as boat_count FROM boats;"
# Should return boat count (likely 0 in fresh DB)
```

**Step 8: Restart Services**
```bash
# Restart API server
pm2 restart navidocs-api
sleep 3

# Start worker
pm2 start navidocs-worker --name navidocs-worker
sleep 3

# Save PM2 process list
pm2 save

# Verify both running
pm2 status
# Expected:
#  navidocs-api       online
#  navidocs-worker    online
```

**Step 9: Verify Services Started**
```bash
# Check API logs for errors
pm2 logs navidocs-api --lines 30

# Check worker logs
pm2 logs navidocs-worker --lines 30

# Both should show "Server started on port 3000" (or similar)
# No ERROR or FATAL messages expected
```

### Phase 3: Post-Deployment Validation (Day 5 - Day 6)

#### 3.1 Immediate Validation (First 15 minutes)

**Health Checks:**
```bash
# Health endpoint
curl -v https://api.navidocs.app/api/health
# Expected: 200 OK, response: { "status": "ok", "timestamp": "..." }

# Database connectivity
curl -H "Authorization: Bearer $TOKEN" \
  https://api.navidocs.app/api/boats
# Expected: 200 OK, empty array (or existing boats)

# Worker running
pm2 status | grep navidocs-worker
# Expected: "navidocs-worker online"
```

**Log Inspection:**
```bash
# Check for errors in API logs
pm2 logs navidocs-api --lines 100 | grep -i "error\|fatal\|warning"
# Expected: No unexpected errors

# Check for errors in worker logs
pm2 logs navidocs-worker --lines 100 | grep -i "error\|fatal"
# Expected: No errors
```

#### 3.2 Critical Endpoint Validation

**Test Each Critical Endpoint:**

1. Authentication:
```bash
# Login endpoint
curl -X POST https://api.navidocs.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@navidocs.app","password":"demo123"}'
# Expected: 200 OK, returns { "token": "...", "user": {...} }
```

2. Boats:
```bash
# List boats
curl -H "Authorization: Bearer $TOKEN" \
  https://api.navidocs.app/api/boats
# Expected: 200 OK, returns array
```

3. Warranties:
```bash
# Create warranty (should fail without boat, but endpoint responds)
curl -X POST https://api.navidocs.app/api/warranties \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"boat_id":"test"}'
# Expected: 400 or 201, not 500
```

4. Sales:
```bash
# List sales
curl -H "Authorization: Bearer $TOKEN" \
  https://api.navidocs.app/api/sales
# Expected: 200 OK
```

5. MLS Sync:
```bash
# Manual sync endpoint
curl -X POST https://api.navidocs.app/api/admin/mls/sync/boat-123 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: 202 Accepted or 404 (boat not found)
```

#### 3.3 Response Time Monitoring

```bash
# Test response times (critical endpoints)
for i in {1..5}; do
  time curl -s https://api.navidocs.app/api/boats \
    -H "Authorization: Bearer $TOKEN" > /dev/null
done

# Expected: Each request < 500ms
# If > 1s, investigate database performance
```

#### 3.4 24-Hour Stability Monitoring

**Continuous Monitoring (Dec 9):**

- [ ] **Hourly Checks:**
  - API responding (health endpoint)
  - Worker processing jobs (check job queue)
  - Error rate acceptable (< 1%)
  - Database queries performing (< 100ms avg)

- [ ] **Key Metrics to Track:**
  ```
  - Request count per minute
  - Error rate (target: < 1%)
  - Response time P95 (target: < 500ms)
  - CPU usage (target: < 40%)
  - Memory usage (target: < 60%)
  - Database connection pool usage
  - Background job success rate (target: > 99%)
  ```

- [ ] **Monitoring Setup:**
  ```bash
  # Set up logs aggregation (if available)
  tail -f /var/log/navidocs/*.log

  # Monitor system resources
  htop

  # Check disk usage
  df -h /var/www/navidocs
  ```

- [ ] **Issue Escalation Criteria:**
  - If error rate > 5% → Investigate immediately
  - If response time > 1 second → Check database queries
  - If worker failing → Check queue logs
  - If webhooks failing → Check external API status

### Phase 4: Rollback Procedure (If Needed)

**IF ANY CRITICAL ISSUE DETECTED, EXECUTE ROLLBACK IMMEDIATELY:**

#### 4.1 Rollback Execution

**Step 1: Stop Services**
```bash
pm2 stop navidocs-api navidocs-worker
sleep 5
```

**Step 2: Restore Database**
```bash
# Identify backup to restore (most recent pre-deploy)
ls -lt /var/www/navidocs/backups/navidocs.db.* | head -1

# Restore from backup
BACKUP_FILE="/var/www/navidocs/backups/navidocs.db.pre-deploy.20251208-143022"
cp $BACKUP_FILE /var/www/navidocs/navidocs.db

# Verify restoration
sqlite3 /var/www/navidocs/navidocs.db "SELECT COUNT(*) FROM boats;"
```

**Step 3: Revert Code**
```bash
cd /var/www/navidocs

# Get previous commit (saved in deploy log)
PREVIOUS_COMMIT=$(grep "Rollback commit:" /var/log/navidocs-deploy.log | tail -1 | cut -d: -f2)

# Revert to previous version
git revert HEAD --no-edit
# OR
git checkout $PREVIOUS_COMMIT
git reset --hard $PREVIOUS_COMMIT

# Verify we're on correct commit
git log --oneline | head -1
```

**Step 4: Restart Services**
```bash
npm install --production
pm2 restart navidocs-api
pm2 restart navidocs-worker

# Verify running
pm2 status
```

**Step 5: Verify Rollback Successful**
```bash
# Test health endpoint
curl https://api.navidocs.app/api/health
# Should respond 200 OK

# Check error logs
pm2 logs navidocs-api --lines 30
# Should not show new errors
```

**Step 6: Incident Report**
- Document when rollback triggered
- What symptoms were observed
- When rollback completed
- Post-rollback verification results
- Send notification to team

---

## Acceptance Criteria

### MLS Integration (Dec 4-5)

**Criterion 1.1: YachtWorld API Connection**
```gherkin
Given YachtWorld API credentials configured
When system attempts to create listing
Then authentication succeeds
And listing created on YachtWorld within 5 minutes
```

**Criterion 1.2: Boat-to-Listing Mapping**
```gherkin
Given boat data: name=Azimut 55S, year=2020, price=$2.5M
When sync triggered
Then YachtWorld listing contains:
  | title | Azimut 55S - 2020 |
  | year | 2020 |
  | price | 2500000 |
  | currency | USD |
```

**Criterion 1.3: Document Attachment**
```gherkin
Given boat with warranty and survey documents
When boat synced to YachtWorld
Then documents attached to listing
And documents accessible via YachtWorld interface
```

**Criterion 1.4: Unified Provider Interface**
```gherkin
Given YachtWorld and Boat Trader providers implemented
When system calls provider.createListing()
Then both providers accept identical boat data format
And both return { listing_id, external_url }
```

**Criterion 1.5: Background Sync Job**
```gherkin
Given daily sync job configured for 2am UTC
When 2am UTC arrives
Then all boats marked for_sale=true synced to MLS
And sync status logged per boat
And failed syncs marked for retry
```

### E2E Testing (Dec 6)

**Criterion 2.1: Playwright Configuration**
```gherkin
Given Playwright installed
When npm run test:e2e
Then tests run in Chromium, Firefox, WebKit
And all tests complete in < 5 minutes
```

**Criterion 2.2: Authentication E2E Tests**
```gherkin
Given E2E test suite
When tests run
Then registration, login, logout tests all pass
And session timeout test passes
```

**Criterion 2.3: Warranty Tracking E2E Tests**
```gherkin
Given authenticated user
When warranty creation test runs
Then warranty created with correct expiration date
And warranty appears in boat detail page
And expiration alert displays correctly
```

**Criterion 2.4: Sale Workflow E2E Tests**
```gherkin
Given test boat with documents
When sale workflow tests run
Then sale initiation test passes
And package generation test passes
And document transfer to buyer test passes
```

**Criterion 2.5: MLS Integration E2E Tests**
```gherkin
Given test boat marked for sale
When MLS sync E2E test runs
Then listing created on test YachtWorld account
And status confirmed via YachtWorld API
And sync status displayed in NaviDocs UI
```

**Criterion 2.6: Test Reliability**
```gherkin
Given E2E test suite
When run 3 times consecutively
Then all tests pass all 3 times (0% flakiness)
And execution time consistent (within 10%)
```

### Security Audit (Dec 7)

**Criterion 3.1: Dependency Vulnerabilities**
```gherkin
Given npm audit results
Then no CRITICAL vulnerabilities present
And no HIGH vulnerabilities unaddressed
And all vulnerable packages either patched or documented
```

**Criterion 3.2: Authentication Security**
```gherkin
Given authentication system
When user attempts login with wrong password 5 times
Then account locked for 15 minutes
And lockout event logged
And admin can manually unlock
```

**Criterion 3.3: Authorization Isolation**
```gherkin
Given user from Org A
When attempts to access Org B's boats
Then returns 403 Forbidden
And no Org B data leaked
```

**Criterion 3.4: SQL Injection Prevention**
```gherkin
Given all database queries
When code reviewed
Then all queries use parameterized statements
And no string concatenation in SQL found
And security tests confirm injection prevented
```

**Criterion 3.5: Secrets Management**
```gherkin
Given production environment
Then no .env file in git repository
And all API keys stored in environment variables
And database password in .env.production only
And webhook secrets generated with crypto.randomBytes(32)
```

### Production Deployment (Dec 8-10)

**Criterion 4.1: Zero-Downtime Deployment**
```gherkin
Given production system receiving requests
When deployment executed
Then no requests dropped or failed
And users not aware deployment occurred
And health endpoint returns 200 throughout
```

**Criterion 4.2: Database Migration Success**
```gherkin
Given database migrations ready
When migrations run on production
Then all tables created/modified correctly
And rollback tested and verified
And data integrity maintained
```

**Criterion 4.3: Post-Deployment Validation**
```gherkin
Given deployed system
When smoke tests executed
Then health endpoint returns 200
And login flow functional
And critical API endpoints responding
And error logs clean (no new errors)
```

**Criterion 4.4: Performance Acceptable**
```gherkin
Given production system
When performance measured
Then response time P95 < 500ms
And database queries < 100ms average
And CPU usage < 50%
And memory usage < 60%
```

**Criterion 4.5: Pilot Account Setup**
```gherkin
Given Riviera Plaisance organization
When admin account created
Then user can log in
And sample boats visible
And all features accessible
And training documentation provided
```

**Criterion 4.6: 24-Hour Stability**
```gherkin
Given production deployment
When monitored for 24 hours
Then error rate < 1% throughout
And no manual intervention required
And all background jobs processing
And webhooks delivering successfully
```

---

## Critical Path & Dependencies

**Dependency Chain (Must Complete in Order):**
```
Week 1 DB Migrations (FOUNDATION)
    ↓
Week 2 Warranty APIs (BUILD ON MIGRATIONS)
    ↓
Week 3 Sale Workflow (DEPENDS ON WARRANTY SCHEMA)
    ↓
Week 4 MLS Integration (DEPENDS ON BOAT STATUS)
    ↓
Week 4 E2E Testing (DEPENDS ON FULL IMPLEMENTATION)
    ↓
Week 4 Security Audit (FINAL CHECK)
    ↓
Week 4 Production Deployment (FINAL STEP)
```

**Parallel Opportunities:**
- MLS (Day 1-2) can run while E2E tests written (if different person)
- Security audit (Day 4) can reference existing test results
- Deployment validation (Day 5-7) independent of new feature work

---

## Success Metrics

| Metric | Target | Definition |
|--------|--------|-----------|
| Test Pass Rate | 100% | All unit, integration, E2E tests pass |
| Security Vulnerabilities | 0 CRITICAL | npm audit shows no critical issues |
| Deployment Time | < 20 min | From start to full service restart |
| Rollback Time | < 10 min | Database restore + service restart |
| Error Rate | < 1% | % of requests returning error |
| Response Time P95 | < 500ms | 95% of requests < 500ms |
| E2E Test Flakiness | 0% | All tests pass 3x consecutively |
| Pilot Satisfaction | > 8/10 | Feedback score from Riviera user |

---

## Sign-Off

**Document Created:** 2025-11-13
**Status:** READY FOR EXECUTION
**Next Step:** Deploy Day 1 (Dec 4) - Start MLS Integration
**Assigned Agent:** S4-H04

**IF.bus Handoff:** When complete, send "inform" message to S4-H10 with delivery status and blockers.

