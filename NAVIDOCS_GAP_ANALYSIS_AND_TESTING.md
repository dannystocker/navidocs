# NaviDocs - Gap Analysis & Testing Protocol

**Generated:** 2025-11-14
**Purpose:** Comprehensive audit of cloud session build + testing requirements

---

## 🔍 Gap Analysis: What Was Built vs What's Needed

### ✅ EXISTING (Pre-Cloud Session)

**Database Tables (13 existing):**
- `users` - Authentication
- `organizations` - Multi-tenancy
- `user_organizations` - Membership
- `entities` - Boats/properties
- `sub_entities` - Systems/docks
- `components` - Engines/appliances
- `documents` - Document metadata
- `document_pages` - OCR results
- `ocr_jobs` - Background queue
- `permissions` - Access control
- `document_shares` - Sharing
- `bookmarks` - Quick access
- `document_toc` - Table of contents (migration 002)

**Backend Routes (13 existing):**
- `auth.routes.js` - Login/signup/JWT
- `documents.js` - CRUD for documents
- `images.js` - Image extraction
- `jobs.js` - OCR job status
- `organization.routes.js` - Org management
- `permission.routes.js` - Access control
- `quick-ocr.js` - Fast OCR endpoint
- `search.js` - Meilisearch integration
- `settings.routes.js` - System settings
- `stats.js` - Dashboard metrics
- `timeline.js` - Activity log
- `toc.js` - Table of contents
- `upload.js` - Multi-format file upload

**Frontend Components (12 existing):**
- `CompactNav.vue` - Navigation
- `ConfirmDialog.vue` - Modal confirmations
- `FigureZoom.vue` - Image zoom
- `ImageOverlay.vue` - Image viewer
- `LanguageSwitcher.vue` - i18n
- `SearchResultsSidebar.vue` - Search UI
- `SearchSuggestions.vue` - Autocomplete
- `SkipLinks.vue` - Accessibility
- `ToastContainer.vue` - Notifications
- `TocEntry.vue` - TOC item
- `TocSidebar.vue` - TOC sidebar
- `UploadModal.vue` - File upload

**Frontend Views (10 existing):**
- `AccountView.vue` - User profile
- `AuthView.vue` - Login/signup
- `DocumentView.vue` - Document reader
- `HomeView.vue` - Dashboard
- `JobsView.vue` - OCR job monitor
- `LibraryView.vue` - Document library
- `SearchView.vue` - Search results
- `StatsView.vue` - Analytics
- `Timeline.vue` - Activity timeline

---

## ❌ MISSING: What Cloud Session Should Build

### Phase 1: Database (H-01)

**16 NEW Tables Needed:**
1. `inventory_items` - Equipment catalog
2. `inventory_photos` - Multiple photos per item
3. `inventory_depreciation` - Value tracking over time
4. `maintenance_records` - Service history
5. `maintenance_reminders` - Upcoming service alerts
6. `maintenance_providers` - Mechanic/vendor directory
7. `camera_feeds` - Home Assistant integration
8. `camera_events` - Motion alerts, snapshots
9. `contacts` - Marina/mechanic/vendor contacts
10. `contact_categories` - Contact grouping
11. `expenses` - Receipt tracking
12. `expense_approvals` - Multi-user approval workflow
13. `expense_splits` - Shared ownership expense splitting
14. `warranties` - Warranty expiration tracking
15. `notifications` - WhatsApp/email notification queue
16. `notification_preferences` - User notification settings

**Missing Indexes:**
- `idx_inventory_boat` on `inventory_items(entity_id)`
- `idx_maintenance_boat` on `maintenance_records(entity_id)`
- `idx_maintenance_due` on `maintenance_reminders(due_date)`
- `idx_camera_boat` on `camera_feeds(entity_id)`
- `idx_contacts_boat` on `contacts(entity_id)`
- `idx_expenses_boat` on `expenses(entity_id)`
- `idx_expenses_approval` on `expense_approvals(status)`

### Phase 2: Backend APIs (H-02-06)

**5 NEW Route Files Needed:**

1. **`server/routes/inventory.js`** (H-02)
   - POST `/api/inventory` - Add equipment with photos
   - GET `/api/inventory/:boatId` - List all equipment
   - GET `/api/inventory/:id` - Get single item details
   - PUT `/api/inventory/:id` - Update item
   - DELETE `/api/inventory/:id` - Remove item
   - POST `/api/inventory/:id/photos` - Add additional photos
   - GET `/api/inventory/:id/depreciation` - Calculate current value
   - GET `/api/inventory/:boatId/total-value` - Sum all equipment

2. **`server/routes/maintenance.js`** (H-03)
   - POST `/api/maintenance` - Log service record
   - GET `/api/maintenance/:boatId` - Service history
   - GET `/api/maintenance/:id` - Get single record
   - PUT `/api/maintenance/:id` - Update record
   - DELETE `/api/maintenance/:id` - Remove record
   - POST `/api/maintenance/reminders` - Set reminder
   - GET `/api/maintenance/reminders/:boatId` - Upcoming reminders
   - PUT `/api/maintenance/reminders/:id/complete` - Mark done
   - GET `/api/maintenance/providers` - Suggested mechanics (location-based)

3. **`server/routes/cameras.js`** (H-04)
   - POST `/api/cameras` - Register camera feed
   - GET `/api/cameras/:boatId` - List cameras
   - GET `/api/cameras/:id/stream` - Get HLS/RTSP URL
   - POST `/api/cameras/webhook` - Home Assistant webhook receiver
   - GET `/api/cameras/:boatId/events` - Motion alerts history
   - PUT `/api/cameras/:id` - Update camera settings
   - DELETE `/api/cameras/:id` - Remove camera

4. **`server/routes/contacts.js`** (H-05)
   - POST `/api/contacts` - Add contact
   - GET `/api/contacts/:boatId` - List contacts
   - GET `/api/contacts/:id` - Get single contact
   - PUT `/api/contacts/:id` - Update contact
   - DELETE `/api/contacts/:id` - Remove contact
   - GET `/api/contacts/:boatId/categories` - Group by type (marina/mechanic/vendor)
   - POST `/api/contacts/:id/call-log` - Log phone call
   - GET `/api/contacts/:id/vcard` - Export vCard

5. **`server/routes/expenses.js`** (H-06)
   - POST `/api/expenses` - Upload receipt (OCR)
   - GET `/api/expenses/:boatId` - List expenses
   - GET `/api/expenses/:id` - Get single expense
   - PUT `/api/expenses/:id` - Update expense
   - DELETE `/api/expenses/:id` - Remove expense
   - POST `/api/expenses/:id/approve` - Approve (multi-user)
   - POST `/api/expenses/:id/reject` - Reject
   - GET `/api/expenses/:boatId/total` - Annual spend
   - GET `/api/expenses/:boatId/by-category` - Category breakdown
   - POST `/api/expenses/:id/split` - Shared ownership split

### Phase 2.5: Frontend Components (H-16-20)

**5 NEW Vue Components Needed:**

1. **`client/src/components/InventoryModule.vue`** (H-16)
   - Photo upload grid (drag-drop, multi-file)
   - Equipment catalog table with filters
   - Depreciation calculator display
   - Total inventory value widget
   - Quick add modal
   - Search/filter by category

2. **`client/src/components/MaintenanceModule.vue`** (H-17)
   - Service history timeline
   - Calendar view for upcoming maintenance
   - Reminder notification badges
   - Quick log service modal
   - Provider suggestions (location-aware)
   - Mark as complete workflow

3. **`client/src/components/CameraModule.vue`** (H-18)
   - Camera grid layout (2x2 or 3x3)
   - Live stream viewer (HLS.js or video.js)
   - Motion alerts panel
   - Daily check workflow ("Boat looks OK? ✓")
   - Camera settings modal
   - Snapshot history

4. **`client/src/components/ContactsModule.vue`** (H-19)
   - Contact cards with avatars
   - One-tap call: `<a href="tel:+33612345678">`
   - One-tap email: `<a href="mailto:marina@example.com">`
   - Category tabs (marina/mechanic/vendor)
   - Search/filter
   - Export vCard
   - Call log history

5. **`client/src/components/ExpenseModule.vue`** (H-20)
   - Receipt photo upload with OCR preview
   - Expense list with approval badges (pending/approved/rejected)
   - Multi-user approval workflow (if shared ownership)
   - Annual spend chart (Chart.js)
   - Category breakdown donut chart
   - Expense splitting modal (Spliit-inspired)
   - Export to CSV

### Phase 3: Integration (H-07-10)

**4 Integration Tasks:**

1. **H-07: API Gateway** (LIKELY DONE - existing Express routes)
   - Unified routing
   - Rate limiting
   - CORS configuration
   - JWT middleware applied to all 5 new routes

2. **H-08: Search Integration**
   - Index inventory items in Meilisearch
   - Index maintenance records
   - Index contacts
   - Faceted search across all modules

3. **H-09: WhatsApp Notifications**
   - Twilio WhatsApp Business API setup
   - Reminder notifications
   - Expense approval notifications
   - Motion alert notifications

4. **H-10: Document Versioning**
   - Version history for all CRUD operations
   - Conflict resolution (if offline edits)

### Phase 4: Testing (H-11-13)

**CRITICAL: This is what your question addresses!**

---

## 🧪 Testing Protocol (Missing from Original Plan)

### H-11: Integration Testing (Playwright)

**User Flow Tests (5 critical paths):**

#### Test 1: Inventory Upload Flow
```javascript
// tests/e2e/inventory-flow.spec.js
test('User uploads equipment photo and sees depreciation', async ({ page }) => {
  // 1. Login
  await page.goto('http://localhost:5173')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/home/)

  // 2. Navigate to boat inventory
  await page.click('a[href="/boats/test-boat-123"]')
  await page.click('a[href="/boats/test-boat-123/inventory"]')
  await expect(page.locator('h1')).toContainText('Inventory')

  // 3. Upload equipment photo
  await page.click('[data-testid="add-equipment"]')
  await page.fill('[name="name"]', 'Garmin GPS Chartplotter')
  await page.fill('[name="category"]', 'electronics')
  await page.fill('[name="purchase_price"]', '2500')
  await page.fill('[name="purchase_date"]', '2020-01-15')
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/gps-photo.jpg')
  await page.click('button[type="submit"]')

  // 4. Verify appears in list
  await expect(page.locator('[data-testid="inventory-item"]')).toContainText('Garmin GPS')

  // 5. Check depreciation calculated
  await page.click('[data-testid="inventory-item"]:has-text("Garmin GPS")')
  await expect(page.locator('[data-testid="current-value"]')).toContainText('$2,100') // 4 years depreciation

  // 6. Verify appears in ROI dashboard
  await page.click('a[href="/boats/test-boat-123/roi"]')
  await expect(page.locator('[data-testid="total-inventory"]')).toContainText('$2,100')

  // 7. Verify persists after refresh
  await page.reload()
  await expect(page.locator('[data-testid="total-inventory"]')).toContainText('$2,100')
})
```

#### Test 2: Maintenance Reminder Flow
```javascript
// tests/e2e/maintenance-flow.spec.js
test('User logs service and sets reminder', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await loginAsTestUser(page)

  // 1. Log service record
  await page.goto('/boats/test-boat-123/maintenance')
  await page.click('[data-testid="log-service"]')
  await page.fill('[name="service_type"]', 'Oil Change')
  await page.fill('[name="cost"]', '250')
  await page.fill('[name="provider"]', 'Marine Services Inc')
  await page.fill('[name="service_date"]', '2025-11-14')
  await page.click('button[type="submit"]')

  // 2. Set reminder for 6 months
  await page.click('[data-testid="set-reminder"]')
  await page.fill('[name="reminder_date"]', '2026-05-14')
  await page.fill('[name="reminder_note"]', 'Schedule next oil change')
  await page.click('button:has-text("Save Reminder")')

  // 3. Verify reminder appears in calendar
  await page.click('[data-testid="calendar-view"]')
  await expect(page.locator('.calendar-event:has-text("Oil Change")')).toBeVisible()

  // 4. Verify notification queued (check database)
  const notificationCount = await page.evaluate(async () => {
    const response = await fetch('/api/notifications?type=reminder&boatId=test-boat-123')
    const data = await response.json()
    return data.length
  })
  expect(notificationCount).toBe(1)

  // 5. Mark as complete
  await page.click('.calendar-event:has-text("Oil Change")')
  await page.click('button:has-text("Mark Complete")')
  await expect(page.locator('[data-testid="completed-badge"]')).toBeVisible()
})
```

#### Test 3: Camera Integration Flow
```javascript
// tests/e2e/camera-flow.spec.js
test('User connects Home Assistant camera and views stream', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await loginAsTestUser(page)

  // 1. Add camera
  await page.goto('/boats/test-boat-123/cameras')
  await page.click('[data-testid="add-camera"]')
  await page.fill('[name="camera_name"]', 'Stern Camera')
  await page.fill('[name="home_assistant_entity"]', 'camera.boat_stern')
  await page.fill('[name="rtsp_url"]', 'rtsp://192.168.1.100:554/stream')
  await page.click('button[type="submit"]')

  // 2. Verify webhook URL generated
  const webhookUrl = await page.locator('[data-testid="webhook-url"]').textContent()
  expect(webhookUrl).toContain('https://digital-lab.ca/navidocs/api/cameras/webhook')

  // 3. Simulate webhook from Home Assistant (motion detected)
  await page.evaluate(async (url) => {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'motion',
        camera_id: 'camera.boat_stern',
        timestamp: Date.now(),
        snapshot_url: 'https://example.com/snapshot.jpg'
      })
    })
  }, webhookUrl)

  // 4. Verify motion alert appears
  await page.reload()
  await expect(page.locator('[data-testid="motion-alert"]')).toContainText('Motion detected')

  // 5. Test live stream viewer
  await page.click('[data-testid="camera-tile"]:has-text("Stern Camera")')
  await page.click('button:has-text("View Live")')
  const videoPlayer = page.locator('video')
  await expect(videoPlayer).toBeVisible()
  await page.waitForTimeout(3000) // Wait for stream to load
  const isPlaying = await videoPlayer.evaluate((video) => !video.paused)
  expect(isPlaying).toBe(true)

  // 6. Daily check workflow
  await page.click('[data-testid="daily-check"]')
  await page.click('button:has-text("Boat looks OK ✓")')
  await expect(page.locator('[data-testid="last-checked"]')).toContainText('Today')
})
```

#### Test 4: Contact One-Tap Call Flow
```javascript
// tests/e2e/contacts-flow.spec.js
test('User adds marina contact and uses one-tap call', async ({ page, context }) => {
  await page.goto('http://localhost:5173')
  await loginAsTestUser(page)

  // 1. Add contact
  await page.goto('/boats/test-boat-123/contacts')
  await page.click('[data-testid="add-contact"]')
  await page.fill('[name="name"]', 'Port Pin Rolland Marina')
  await page.fill('[name="category"]', 'marina')
  await page.fill('[name="phone"]', '+33494563412')
  await page.fill('[name="email"]', 'contact@portpinrolland.com')
  await page.fill('[name="address"]', 'Saint-Tropez, France')
  await page.click('button[type="submit"]')

  // 2. Verify appears in contacts list
  await expect(page.locator('[data-testid="contact-card"]')).toContainText('Port Pin Rolland')

  // 3. Test one-tap call link
  const callLink = page.locator('a[href^="tel:"]')
  await expect(callLink).toHaveAttribute('href', 'tel:+33494563412')

  // 4. Test one-tap email link
  const emailLink = page.locator('a[href^="mailto:"]')
  await expect(emailLink).toHaveAttribute('href', 'mailto:contact@portpinrolland.com')

  // 5. Search contacts
  await page.fill('[data-testid="contact-search"]', 'marina')
  await expect(page.locator('[data-testid="contact-card"]')).toHaveCount(1)

  // 6. Export vCard
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Export vCard")')
  ])
  expect(download.suggestedFilename()).toBe('port-pin-rolland.vcf')

  // 7. Log call
  await page.click('[data-testid="contact-card"]:has-text("Port Pin Rolland")')
  await page.click('button:has-text("Log Call")')
  await page.fill('[name="call_notes"]', 'Confirmed berth reservation for summer')
  await page.click('button:has-text("Save")')
  await expect(page.locator('[data-testid="call-history"]')).toContainText('Confirmed berth')
})
```

#### Test 5: Expense Approval Flow
```javascript
// tests/e2e/expense-flow.spec.js
test('User uploads receipt, OCR extracts data, co-owner approves', async ({ page, context }) => {
  // 1. Login as primary owner
  await page.goto('http://localhost:5173')
  await loginAsTestUser(page)

  // 2. Upload receipt
  await page.goto('/boats/test-boat-123/expenses')
  await page.click('[data-testid="upload-receipt"]')
  await page.setInputFiles('input[type="file"]', 'tests/fixtures/fuel-receipt.jpg')

  // Wait for OCR to extract amount
  await page.waitForSelector('[data-testid="ocr-result"]', { timeout: 10000 })
  const extractedAmount = await page.locator('[data-testid="ocr-amount"]').textContent()
  expect(extractedAmount).toBe('€450.00') // From fixture

  // 3. Assign to category
  await page.selectOption('[name="category"]', 'fuel')
  await page.fill('[name="vendor"]', 'Total Energies')
  await page.fill('[name="date"]', '2025-11-10')
  await page.click('button[type="submit"]')

  // 4. Verify appears in expense list
  await expect(page.locator('[data-testid="expense-item"]')).toContainText('€450.00')
  await expect(page.locator('[data-testid="approval-badge"]')).toContainText('Pending')

  // 5. Switch to co-owner account
  await page.click('[data-testid="user-menu"]')
  await page.click('button:has-text("Logout")')
  await page.fill('input[type="email"]', 'co-owner@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')

  // 6. Co-owner approves expense
  await page.goto('/boats/test-boat-123/expenses')
  await page.click('[data-testid="expense-item"]:has-text("€450.00")')
  await page.click('button:has-text("Approve")')
  await expect(page.locator('[data-testid="approval-badge"]')).toContainText('Approved')

  // 7. Verify annual spend updated
  await expect(page.locator('[data-testid="annual-total"]')).toContainText('€450.00')

  // 8. Verify appears in category breakdown
  await page.click('[data-testid="category-chart"]')
  const fuelSpend = await page.locator('[data-testid="category-fuel"]').textContent()
  expect(fuelSpend).toBe('€450.00')

  // 9. Export to CSV
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Export CSV")')
  ])
  expect(download.suggestedFilename()).toMatch(/expenses-\d{4}-\d{2}-\d{2}\.csv/)
})
```

### H-12: Performance Testing

**Lighthouse Audits:**
```bash
# Run for all key pages
lighthouse http://localhost:5173/ --output=json --output-path=/tmp/lighthouse-home.json
lighthouse http://localhost:5173/boats/test-boat-123/inventory --output=json
lighthouse http://localhost:5173/boats/test-boat-123/maintenance --output=json
lighthouse http://localhost:5173/boats/test-boat-123/cameras --output=json
lighthouse http://localhost:5173/boats/test-boat-123/contacts --output=json
lighthouse http://localhost:5173/boats/test-boat-123/expenses --output=json

# Target scores:
# Performance: >90
# Accessibility: >95
# Best Practices: >95
# SEO: >90
```

**API Latency Tests:**
```bash
# Test all 5 new modules (p95 latency target: <200ms)
for endpoint in inventory maintenance cameras contacts expenses; do
  echo "Testing /api/$endpoint/:boatId"
  ab -n 1000 -c 10 -H "Authorization: Bearer $JWT_TOKEN" \
    http://localhost:3000/api/$endpoint/test-boat-123 | grep "Time per request"
done
```

**Bundle Size Check:**
```bash
cd /home/setup/navidocs/client
npm run build
du -sh dist/assets/*.js  # Target: <500KB gzipped
gzip -c dist/assets/index.*.js | wc -c
```

### H-13: Security Testing

**OWASP Top 10 Automated Scan:**
```bash
# Use OWASP ZAP if available
zap-cli quick-scan http://localhost:5173

# Manual SQL injection tests
curl -X GET "http://localhost:3000/api/inventory/test-boat-123' OR '1'='1" \
  -H "Authorization: Bearer $JWT_TOKEN"
# Should return 400 Bad Request, not data leak

# XSS test
curl -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"name":"<script>alert(1)</script>","phone":"123"}' \
  -H "Content-Type: application/json"
# Should sanitize, not execute script

# CSRF test (missing JWT)
curl -X DELETE http://localhost:3000/api/inventory/test-item-123
# Should return 401 Unauthorized

# Multi-tenancy isolation test
curl -X GET http://localhost:3000/api/inventory/other-org-boat-456 \
  -H "Authorization: Bearer $JWT_TOKEN_ORG_123"
# Should return 403 Forbidden, not data leak
```

**Secrets Scan:**
```bash
cd /home/setup/navidocs
# Check no secrets in client bundle
grep -r "sk-\|api_key\|secret" client/dist/
# Should return nothing

# Check no secrets in git history
git log --all -- .env
# Should return nothing (if .env was committed, needs git-filter-repo)
```

---

## 🚨 Critical Gaps Found

### 1. **No E2E Tests Exist**
- Current repo has ZERO Playwright tests
- Cloud session H-11 agent MUST create tests from scratch
- Need fixtures: `tests/fixtures/gps-photo.jpg`, `tests/fixtures/fuel-receipt.jpg`

### 2. **No Test User Seeding**
- Need test accounts: `test@example.com`, `co-owner@example.com`
- Need test boat: `test-boat-123` with organization `test-org-123`
- Need migration: `012_seed_test_data.sql`

### 3. **No Performance Baselines**
- Unknown current Lighthouse scores
- Unknown API latency
- Unknown bundle size

### 4. **No Security Audit History**
- Unknown if SQL injection possible
- Unknown if XSS vulnerabilities exist
- Unknown if multi-tenancy isolation works

### 5. **Missing Test Infrastructure**
```bash
# Need to install Playwright
cd /home/setup/navidocs
npm install -D @playwright/test
npx playwright install chromium

# Need test fixtures directory
mkdir -p tests/fixtures
mkdir -p tests/e2e

# Need test database
cp navidocs.db navidocs-test.db
```

---

## 📋 Next Prompt: Comprehensive Testing

**After cloud session completes H-01 through H-15, paste this:**

```markdown
# NaviDocs - Comprehensive Testing & Quality Assurance

**Context:** H-01 through H-15 completed. Now need full test coverage before production deployment.

**Repository:** https://github.com/dannystocker/navidocs

**Test Environment:**
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- Test Database: navidocs-test.db (copy of navidocs.db)

---

## Mission: Full E2E Testing with Real User Simulation

**Spawn 6 Testing Agents:**

### T-01: Test Infrastructure Setup (MUST RUN FIRST)

**Task:** Install Playwright, create fixtures, seed test data

```bash
# Install Playwright
cd /workspace/navidocs
npm install -D @playwright/test
npx playwright install chromium

# Create test fixtures
mkdir -p tests/fixtures
mkdir -p tests/e2e

# Download test images (mock equipment photos)
curl -o tests/fixtures/gps-photo.jpg https://via.placeholder.com/800x600.jpg?text=GPS+Photo
curl -o tests/fixtures/fuel-receipt.jpg https://via.placeholder.com/600x800.jpg?text=Fuel+Receipt+€450

# Create test database
cp server/db/navidocs.db server/db/navidocs-test.db

# Seed test users
sqlite3 server/db/navidocs-test.db << EOF
INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
VALUES
  ('test-user-123', 'test@example.com', 'Test Owner', '$2b$10$...', $(date +%s), $(date +%s)),
  ('test-coowner-456', 'co-owner@example.com', 'Co-Owner', '$2b$10$...', $(date +%s), $(date +%s));

INSERT INTO organizations (id, name, type, created_at, updated_at)
VALUES ('test-org-123', 'Test Organization', 'personal', $(date +%s), $(date +%s));

INSERT INTO entities (id, organization_id, user_id, entity_type, name, make, model, year, created_at, updated_at)
VALUES ('test-boat-123', 'test-org-123', 'test-user-123', 'boat', 'Test Yacht', 'Jeanneau', 'Prestige 520', 2020, $(date +%s), $(date +%s));
EOF
```

**Signal:** Write `/tmp/T-01-SETUP-COMPLETE.txt`

---

### T-02: Inventory Flow Test

**Task:** Playwright test for inventory upload → depreciation → ROI

Read the exact test from `/workspace/navidocs/NAVIDOCS_GAP_ANALYSIS_AND_TESTING.md` (Test 1: Inventory Upload Flow)

Implement in `tests/e2e/inventory-flow.spec.js`

Run: `npx playwright test tests/e2e/inventory-flow.spec.js`

**Success Criteria:**
- Test passes without errors
- Screenshots saved to `test-results/` on failure
- Video recording of test available

**Signal:** Write `/tmp/T-02-INVENTORY-TEST-COMPLETE.txt` with pass/fail status

---

### T-03: Maintenance Flow Test

**Task:** Playwright test for maintenance logging → reminder → completion

Read test from NAVIDOCS_GAP_ANALYSIS_AND_TESTING.md (Test 2: Maintenance Reminder Flow)

Implement in `tests/e2e/maintenance-flow.spec.js`

Run: `npx playwright test tests/e2e/maintenance-flow.spec.js`

**Signal:** Write `/tmp/T-03-MAINTENANCE-TEST-COMPLETE.txt`

---

### T-04: Camera Flow Test

**Task:** Playwright test for camera connection → webhook → live stream

Read test from NAVIDOCS_GAP_ANALYSIS_AND_TESTING.md (Test 3: Camera Integration Flow)

Implement in `tests/e2e/camera-flow.spec.js`

Run: `npx playwright test tests/e2e/camera-flow.spec.js`

**Signal:** Write `/tmp/T-04-CAMERA-TEST-COMPLETE.txt`

---

### T-05: Contact Flow Test

**Task:** Playwright test for contact add → one-tap call → vCard export

Read test from NAVIDOCS_GAP_ANALYSIS_AND_TESTING.md (Test 4: Contact One-Tap Call Flow)

Implement in `tests/e2e/contacts-flow.spec.js`

Run: `npx playwright test tests/e2e/contacts-flow.spec.js`

**Signal:** Write `/tmp/T-05-CONTACTS-TEST-COMPLETE.txt`

---

### T-06: Expense Flow Test

**Task:** Playwright test for receipt upload → OCR → multi-user approval

Read test from NAVIDOCS_GAP_ANALYSIS_AND_TESTING.md (Test 5: Expense Approval Flow)

Implement in `tests/e2e/expense-flow.spec.js`

Run: `npx playwright test tests/e2e/expense-flow.spec.js`

**Signal:** Write `/tmp/T-06-EXPENSE-TEST-COMPLETE.txt`

---

## Performance & Security Testing (Parallel)

### T-07: Lighthouse Audit

Run Lighthouse on all 6 pages, generate report

### T-08: API Latency Tests

Use Apache Bench (ab) or wrk for load testing

### T-09: OWASP Security Scan

Test SQL injection, XSS, CSRF, multi-tenancy isolation

---

## Success Criteria

**All tests must pass before production deployment:**
- ✅ 5 E2E tests pass (100% pass rate)
- ✅ Lighthouse scores >90 (all pages)
- ✅ API latency <200ms p95
- ✅ 0 critical security vulnerabilities
- ✅ Bundle size <500KB gzipped

**Coordinator:** Monitor all T-01 through T-09, generate test report in `docs/TEST_REPORT.md`

**Budget:** $5-8 (6-9 Haiku agents × 1-2 hours)
```

---

## 📊 Summary

**Existing Codebase:** 13 tables, 13 routes, 12 components (document management MVP)

**Cloud Session Building:** 16 tables, 5 routes, 5 components (boat management features)

**Critical Gap:** ZERO E2E tests exist. H-11 agent must create from scratch.

**Testing Requirements:**
- 5 Playwright E2E tests (user simulation)
- Lighthouse audits (6 pages)
- API load tests (5 modules)
- Security scans (OWASP Top 10)

**Next Prompt:** After H-15 completes, launch separate testing session with 6-9 Haiku agents for comprehensive QA.

**Total Budget:** Build ($12-15) + Testing ($5-8) = **$17-23 total**
