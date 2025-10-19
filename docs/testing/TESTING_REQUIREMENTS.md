# Testing Requirements - Preventing Production Bugs

**Purpose:** Ensure all bugs are caught during testing, not discovered by users in production.

**Last Updated:** 2025-10-19

---

## Critical Rule: Test Like a User, Not Like a Developer

**❌ DON'T:**
- Test only via API with curl
- Assume API tests cover UI functionality
- Skip browser testing because "the API works"
- Test individual components in isolation
- Use hardcoded correct values that bypass validation

**✅ DO:**
- Test through the actual UI in a real browser
- Complete full user workflows start-to-finish
- Test in the target environment (Windows accessing WSL2)
- Open browser DevTools and check for errors
- Verify network requests match backend expectations

---

## Testing Levels Required

### Level 1: API Contract Testing (Baseline) ✅

**What to test:**
```bash
# Test all endpoints with curl
curl -X POST /api/upload -F "file=@test.pdf" -F "title=Test" ...
curl -X POST /api/search -d '{"q":"test"}'
curl -X GET /api/documents/:id
curl -X GET /api/documents/:id/pdf
```

**What this catches:**
- Backend logic errors
- Database constraints
- Authentication issues
- API response format

**What this DOESN'T catch:**
- UI field name mismatches (upload bug)
- Frontend integration issues (PDF.js CDN)
- User experience problems
- Browser compatibility issues

---

### Level 2: UI Integration Testing (REQUIRED) ✅

**Critical Instruction:**

> **For every feature, you must test the ACTUAL UI in a browser, not just the API.**

**Specific Requirements:**

#### 1. Browser Testing Checklist

**Before marking ANY feature complete:**

- [ ] Open http://172.29.75.55:8080 in Windows browser
- [ ] Open DevTools (F12) and check Console tab
- [ ] Open DevTools Network tab to see actual requests
- [ ] Complete the user workflow manually
- [ ] Verify no console errors (red messages)
- [ ] Verify network requests have correct field names
- [ ] Check that responses are 200/201, not 400/500

#### 2. Upload Feature Test Protocol

**WRONG way (only API):**
```bash
curl -X POST /api/upload -F "file=@test.pdf" ...  # ✅ Passes
# But UI sends 'pdf' not 'file' → User sees broken upload ❌
```

**RIGHT way (UI + API):**
```
1. Open browser → http://172.29.75.55:8080
2. Click "Upload Document" button
3. Select a PDF file (or drag & drop)
4. Fill in metadata form
5. Click "Upload and Process"
6. ✅ Watch DevTools Network tab:
   - Request should be multipart/form-data
   - Field name should be 'file' (not 'pdf')
   - Response should be 201 with jobId
7. ✅ Watch UI:
   - Progress modal should appear
   - Progress bar should move to 100%
   - Success message should show
8. ✅ Check console:
   - No red errors
   - No 400/500 responses
```

**What this would have caught:**
- ✅ Upload field name mismatch (would see 400 error in Network tab)
- ✅ Missing organizationId field
- ✅ Timeout issues
- ✅ Progress bar not updating

#### 3. Document Viewer Test Protocol

**WRONG way:**
```bash
curl http://localhost:8001/api/documents/:id  # ✅ Passes
curl http://localhost:8001/api/documents/:id/pdf  # ✅ Passes
# But PDF.js worker fails to load in browser ❌
```

**RIGHT way:**
```
1. Upload a multi-page PDF (5+ pages recommended)

2. Click on the uploaded document to open viewer

3. ✅ Test initial load:
   - PDF page 1 should render
   - No error messages
   - Page counter shows "Page 1 / N"

4. ✅ Test page navigation:
   - Click "Next" button → Page 2 should display
   - Click "Next" again → Page 3 should display
   - Click "Previous" → Page 2 should display
   - Enter page number and click "Go" → That page displays
   - Test rapid clicking (Next/Next/Next quickly)

5. ✅ Check DevTools Console:
   - No "Failed to fetch" errors
   - No "Failed to render page" errors
   - No CDN loading failures
   - Worker loads successfully
   - No RenderingCancelledException (or it's handled gracefully)

6. ✅ Check DevTools Network:
   - pdf.worker.min.mjs loads (not from CDN)
   - Status 200, not 404
   - PDF document loads (/api/documents/:id/pdf)
```

**What this would have caught:**
- ✅ PDF.js CDN failure
- ✅ Worker loading errors
- ✅ CORS issues
- ✅ Page navigation render conflicts
- ✅ Concurrent render task failures

---

## Comprehensive Testing Checklist

### For Every PR/Feature:

#### Phase 1: Component Verification (5 min)
- [ ] Read component source code
- [ ] Verify field names match API expectations
- [ ] Check external dependencies (CDNs, etc.)
- [ ] Look for hardcoded values

#### Phase 2: API Testing (5 min)
```bash
# Test with actual values the UI would send
curl -X POST /api/upload \
  -F "file=@test.pdf" \
  -F "title=Test" \
  -F "documentType=owner-manual" \
  -F "organizationId=test-org-123"

# Verify response is 201, not 400
```

#### Phase 3: UI Browser Testing (10 min)
- [ ] Open Windows browser → http://172.29.75.55:8080
- [ ] Open DevTools (F12)
- [ ] Clear console
- [ ] Complete user workflow
- [ ] Check console for errors
- [ ] Check Network tab for failed requests
- [ ] Verify UI shows correct feedback

#### Phase 4: Edge Case Testing (5 min)
- [ ] Test with large file (near 50MB limit)
- [ ] Test with invalid file type
- [ ] Test with network disconnected (offline)
- [ ] Test with slow connection (throttling)

---

## Specific Instructions for AI/Automation

When testing a feature, follow this exact sequence:

### Step 1: Verify Source Code
```bash
# Check actual field names in form submission
grep -A 10 "FormData" client/src/components/*.vue
grep "append.*file\|append.*pdf" client/src/**/*.vue

# Check for CDN dependencies
grep -r "cdnjs\|unpkg\|cdn.jsdelivr" client/src/
```

### Step 2: API Contract Test
```bash
# Use exact field names from source code
curl -v -X POST /api/upload -F "file=@test.pdf" ...
# Look for: 201 Created (good) or 400 Bad Request (bad)
```

### Step 3: Browser Simulation Test
```javascript
// If you can't open a real browser, at least simulate it:
const formData = new FormData()
formData.append('file', selectedFile)  // Use EXACT field name from code
// Then verify backend expects 'file' not something else
```

### Step 4: Integration Verification
```bash
# After "successful" API test, verify UI actually works:
echo "⚠️ API test passed, but UI MUST be tested in browser"
echo "Open: http://172.29.75.55:8080"
echo "Test: Complete upload workflow manually"
echo "Check: DevTools Console and Network tabs"
```

---

## Common Testing Mistakes That Let Bugs Through

### Mistake 1: Testing API with correct values, UI sends wrong values
```bash
# Test uses correct field name:
curl -F "file=@test.pdf"  # ✅ Works

# But UI code has:
formData.append('pdf', file)  # ❌ Wrong field name

# Bug reaches user because test didn't use UI
```

**Fix:** Always grep the actual UI code for field names before testing.

### Mistake 2: Assuming local files work the same as CDN
```javascript
// Works in dev (CDN accessible):
workerSrc = "//cdnjs.cloudflare.com/..."  // ✅ Works

// Breaks in production (CDN blocked):
// Browser: Failed to fetch  // ❌ Fails

// Bug reaches user because test didn't check browser console
```

**Fix:** Always test in actual browser with DevTools open.

### Mistake 3: Testing one step at a time, not full workflow
```bash
# Test upload: ✅ Works
curl -X POST /api/upload ...

# Test document get: ✅ Works
curl /api/documents/:id

# Test PDF stream: ✅ Works
curl /api/documents/:id/pdf

# But full workflow in UI: ❌ Breaks
# Upload → Search → Click → View PDF → Worker fails

# Bug reaches user because full workflow wasn't tested
```

**Fix:** Test complete user journeys end-to-end.

---

## Automated Testing Requirements

### Unit Tests (Component Level)
```javascript
// ✅ Good test - checks actual field name
test('upload form uses correct field name', () => {
  const formData = component.createFormData()
  expect(formData.has('file')).toBe(true)  // Not 'pdf'
  expect(formData.has('organizationId')).toBe(true)
})
```

### Integration Tests (Cypress/Playwright)
```javascript
// ✅ Good test - uses real browser
cy.visit('http://localhost:8080')
cy.get('[data-testid=upload-button]').click()
cy.get('input[type=file]').selectFile('test.pdf')
cy.get('input[name=title]').type('Test Document')
cy.get('[data-testid=submit-upload]').click()

// Verify no console errors
cy.window().then((win) => {
  expect(win.console.error).not.to.be.called
})

// Verify network request has correct field name
cy.intercept('POST', '/api/upload').as('upload')
cy.wait('@upload').then((interception) => {
  expect(interception.request.body.get('file')).to.exist
})
```

### E2E Tests (Full User Workflow)
```javascript
// ✅ Complete workflow test
test('user can upload, search, and view document', async () => {
  // 1. Upload
  await page.goto('http://localhost:8080')
  await page.click('[data-testid=upload-button]')
  await page.setInputFiles('input[type=file]', 'test.pdf')
  await page.fill('input[name=title]', 'Test Doc')
  await page.click('[data-testid=submit]')
  await page.waitForSelector('[data-testid=success-message]')

  // 2. Search
  await page.fill('input[placeholder*=Search]', 'Test Doc')
  await page.press('input[placeholder*=Search]', 'Enter')
  await page.waitForSelector('.search-result')

  // 3. View
  await page.click('.search-result:first-child')
  await page.waitForSelector('canvas')  // PDF canvas

  // 4. Verify no errors
  const errors = await page.evaluate(() => window.consoleErrors || [])
  expect(errors).toHaveLength(0)
})
```

---

## Pre-Deployment Checklist

Before marking ANYTHING as "ready" or "tested":

- [ ] Source code reviewed for field name mismatches
- [ ] API endpoints tested with curl
- [ ] UI tested in actual Windows browser
- [ ] DevTools Console checked (no red errors)
- [ ] DevTools Network checked (no 400/500 errors)
- [ ] Full user workflow completed manually
- [ ] All external dependencies verified (no CDN failures)
- [ ] Tested on actual target environment (WSL2 → Windows)

---

## Quick Reference: Testing Commands

### Verify UI Field Names Match Backend
```bash
# Check what UI sends:
grep -r "formData.append" client/src/

# Check what backend expects:
grep -r "upload.single\|upload.array" server/routes/

# They MUST match!
```

### Test in Browser with DevTools
```
1. Open: http://172.29.75.55:8080
2. Press F12 (DevTools)
3. Click Console tab
4. Click Network tab
5. Perform user action
6. Check for red errors in Console
7. Check for 400/500 in Network
```

### Verify External Dependencies
```bash
# Find all CDN/external URLs:
grep -r "http.*cdn\|//cdn" client/src/

# For each one, verify it's necessary and accessible
# Better: Replace with local files from node_modules
```

---

## Summary: The One Rule to Remember

> **"If you didn't test it in a real browser with DevTools open, you didn't test it."**

API tests are necessary but NOT sufficient. They catch backend bugs but miss frontend integration issues.

**The bugs you found were caused by:**
1. ✅ API tested with curl (passed)
2. ❌ UI not tested in browser (bug slipped through)
3. ❌ DevTools not checked (errors not seen)
4. ❌ Network tab not inspected (field mismatch not caught)

**Prevent this by:**
1. ✅ Test API with curl
2. ✅ **ALSO test UI in browser** ← This was missing
3. ✅ Check DevTools Console
4. ✅ Check DevTools Network tab
5. ✅ Complete full user workflows

---

**Remember:** A passing API test does NOT mean the feature works. You must test the UI.
