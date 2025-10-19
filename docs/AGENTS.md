# Instructions for AI Agents (Claude Code, Copilot, etc.)

**Purpose:** Critical instructions to prevent bugs from reaching production.

**Last Updated:** 2025-10-19

---

## ⚠️ CRITICAL RULE: Always Test the UI, Not Just the API

### The Problem

**What usually happens:**
1. ✅ Agent tests API with curl → Test passes
2. ❌ Agent assumes feature works → Marks complete
3. 🐛 User finds bug in UI → Feature actually broken

**Real examples from this project:**
- Upload API worked perfectly via curl ✅
- Upload UI had wrong field name ('pdf' instead of 'file') ❌
- Result: 100% upload failure rate for users

### The Solution

> **"If you didn't test it in a real browser with DevTools open, you didn't test it."**

---

## Mandatory Testing Protocol

### For EVERY Feature/PR:

#### Phase 1: Code Review (BEFORE testing)
```bash
# Verify field names match between frontend and backend
grep -A 5 "formData.append" client/src/components/*.vue
grep "upload.single\|upload.array" server/routes/*.js
# Field names MUST match exactly

# Check for external dependencies (CDNs)
grep -r "cdnjs\|unpkg\|cdn.jsdelivr" client/src/
# Replace CDNs with local files from node_modules
```

#### Phase 2: API Testing
```bash
# Test with curl using EXACT field names from source code
curl -X POST http://localhost:8001/api/upload \
  -F "file=@test.pdf" \
  -F "title=Test" \
  -F "organizationId=test-org-123"

# Verify: 201 Created (not 400/500)
```

#### Phase 3: Browser Testing (REQUIRED)
```
1. Open browser: http://172.29.75.55:8080 (Windows)
                  http://localhost:8080 (WSL2)

2. Press F12 to open DevTools

3. Clear Console (important!)

4. Complete the user workflow:
   - Click buttons
   - Fill forms
   - Submit data
   - Navigate between pages

5. Check DevTools Console tab:
   ✅ No red errors
   ✅ No "Failed to fetch" messages
   ✅ No CDN loading failures

6. Check DevTools Network tab:
   ✅ Status codes: 200/201 (not 400/500)
   ✅ Field names match backend expectations
   ✅ All resources load successfully

7. Verify UI shows correct feedback:
   ✅ Success messages appear
   ✅ Progress bars work
   ✅ Data displays correctly
```

#### Phase 4: Full Workflow Testing
```
Test complete user journeys, not isolated endpoints:

Upload Workflow:
1. Click "Upload Document"
2. Select PDF file
3. Fill metadata form
4. Submit
5. Watch progress bar
6. See success message
7. Verify document appears in search

Search & View Workflow:
1. Search for a term
2. Click on a result
3. PDF viewer loads
4. Page navigation works
5. No errors in console
```

---

## Specific Test Requirements by Feature

### Upload Feature

**❌ WRONG:**
```bash
curl -X POST /api/upload -F "file=@test.pdf"  # ✅ API works
# ⚠️ But did you test the UI? Upload button could be broken!
```

**✅ CORRECT:**
```bash
# 1. API test
curl -X POST /api/upload -F "file=@test.pdf"

# 2. Code verification
grep "formData.append.*file" client/src/components/UploadModal.vue
# Verify field name is 'file' not 'pdf'

# 3. Browser test
# Open http://172.29.75.55:8080
# Click "Upload Document"
# Complete workflow
# Check DevTools Console and Network

# 4. Only mark complete if ALL tests pass
```

### Document Viewer

**❌ WRONG:**
```bash
curl /api/documents/:id/pdf  # ✅ API works
# ⚠️ But PDF.js worker could fail to load in browser!
```

**✅ CORRECT:**
```bash
# 1. API test
curl /api/documents/:id/pdf

# 2. Code verification
grep "workerSrc" client/src/views/DocumentView.vue
# Verify NOT using CDN (use local worker file)

# 3. Browser test
# Upload a multi-page PDF (5+ pages)
# Click on the document to open viewer
# Page 1 should render

# Test page navigation:
# - Click "Next" → Page 2 displays
# - Click "Next" → Page 3 displays
# - Click "Previous" → Page 2 displays
# - Type page number and click "Go" → That page displays
# - Rapid click Next/Previous (test render task cancellation)

# Check Console for errors:
# - No worker errors
# - No CDN failures
# - No "Failed to render page" errors

# 4. Only mark complete if:
# - PDF displays correctly
# - All page navigation works
# - No console errors
```

### Search Feature

**❌ WRONG:**
```bash
curl -X POST /api/search -d '{"q":"test"}'  # ✅ API works
# ⚠️ But search bar could send wrong query format!
```

**✅ CORRECT:**
```bash
# 1. API test
curl -X POST /api/search -d '{"q":"test","limit":10}'

# 2. Code verification
grep -A 10 "fetch.*search" client/src/composables/useSearch.js
# Verify request body format matches API

# 3. Browser test
# Type in search bar
# Press Enter
# Results should appear
# Check Console and Network

# 4. Only mark complete if search works in UI
```

---

## Common Mistakes That Let Bugs Through

### Mistake 1: Testing with correct values, UI sends wrong values
```bash
# Agent tests with correct field name:
curl -F "file=@test.pdf"  # ✅ Works

# But UI code has:
formData.append('pdf', file)  # ❌ Wrong field name

# Bug slips through because UI wasn't tested
```

**Prevention:** Grep the actual UI code before testing.

### Mistake 2: Assuming external resources work
```javascript
// Code uses CDN:
workerSrc = "//cdnjs.cloudflare.com/..."  # ✅ Works in test

// But CDN blocked in production:
// Browser: Failed to fetch  # ❌ Fails for user

// Bug slips through because browser wasn't tested
```

**Prevention:** Always test in actual browser, avoid CDNs.

### Mistake 3: Testing steps in isolation, not full workflow
```bash
# Test each endpoint separately:
curl /api/upload      # ✅
curl /api/search      # ✅
curl /api/documents   # ✅

# But full workflow broken:
# Upload → Search → View PDF  # ❌ Fails

// Bug slips through because full workflow wasn't tested
```

**Prevention:** Test complete user journeys end-to-end.

---

## Pre-Commit Checklist

Before marking ANY work as complete:

- [ ] Source code reviewed for integration issues
- [ ] Field names verified to match between frontend/backend
- [ ] External dependencies checked (no CDNs)
- [ ] API endpoints tested with curl
- [ ] **UI tested in actual browser** ← REQUIRED
- [ ] **DevTools Console checked (no errors)** ← REQUIRED
- [ ] **DevTools Network checked (no failures)** ← REQUIRED
- [ ] Full user workflow completed successfully
- [ ] Tested on target environment (WSL2 → Windows)

---

## Quick Reference Commands

### Verify Frontend/Backend Contract
```bash
# Check what frontend sends:
grep -r "formData.append\|body.*JSON.stringify" client/src/

# Check what backend expects:
grep -r "req.body\|req.file\|upload.single" server/routes/

# They MUST match!
```

### Find Integration Issues
```bash
# Find CDN dependencies:
grep -r "http.*cdn\|//cdn" client/src/

# Find hardcoded values:
grep -r "test-user-id\|test-org" client/src/

# Find potential mismatches:
diff <(grep -r "formData.append" client/src/ | cut -d'"' -f2 | sort) \
     <(grep -r "req.body\|req.file" server/routes/ | grep -oP '\w+(?=\s*[,)])')
```

### Test in Browser
```
1. Windows: http://172.29.75.55:8080
2. WSL2:    http://localhost:8080
3. Press F12 (DevTools)
4. Console + Network tabs
5. Perform action
6. Verify no errors
```

---

## Automation Requirements

### Unit Tests Must Verify Integration Points
```javascript
// ✅ Good test - verifies actual field name
test('upload uses correct field name', () => {
  const form = component.createFormData()
  expect(form.has('file')).toBe(true)  // Not 'pdf'
  expect(form.has('organizationId')).toBe(true)
})

// ❌ Bad test - mocks everything, misses integration bugs
test('upload works', () => {
  mockUpload.mockResolvedValue({ ok: true })
  // This passes even if field names are wrong!
})
```

### E2E Tests Required for Critical Paths
```javascript
// Cypress/Playwright tests for:
// 1. Upload workflow
// 2. Search workflow
// 3. Document viewer
// 4. Full user journey

test('user can upload and view document', async () => {
  await page.goto('http://localhost:8080')

  // Upload
  await page.click('[data-testid=upload-button]')
  await page.setInputFiles('input[type=file]', 'test.pdf')
  await page.fill('input[name=title]', 'Test')
  await page.click('[data-testid=submit]')
  await page.waitForSelector('.success-message')

  // Search
  await page.fill('input[placeholder*=Search]', 'Test')
  await page.press('input[placeholder*=Search]', 'Enter')

  // View
  await page.click('.search-result:first-child')
  await page.waitForSelector('canvas')  // PDF renders

  // Verify no console errors
  const errors = await page.evaluate(() => window.consoleErrors || [])
  expect(errors).toHaveLength(0)
})
```

---

## The One Rule

> **API tests are necessary but NOT sufficient.**
>
> **They catch backend bugs but miss frontend integration issues.**
>
> **If you didn't test it in a browser, you didn't test it.**

---

## Real Bug Examples from This Project

### Bug 1: Upload Field Name Mismatch
```
API Test: ✅ PASS
curl -F "file=@test.pdf" /api/upload

UI Code: ❌ WRONG
formData.append('pdf', file)  // Should be 'file'

Result: 100% upload failure for users
Fix: 1 line change, 5 minutes
Cost: Hours of debugging
```

### Bug 2: PDF.js CDN Failure
```
API Test: ✅ PASS
curl /api/documents/:id/pdf

UI Code: ❌ WRONG
workerSrc = "//cdnjs.cloudflare.com/..."  // CDN blocked

Result: PDF viewer broken for all users
Fix: 5 line change, 5 minutes
Cost: Complete feature failure
```

**Both bugs would have been caught by browser testing.**

---

## Summary for AI Agents

When tasked with implementing/testing a feature:

1. ✅ Implement the feature
2. ✅ Test API with curl
3. ✅ **ALSO test in browser** ← Don't skip this!
4. ✅ Check DevTools Console
5. ✅ Check DevTools Network
6. ✅ Verify full user workflow
7. ❌ Don't mark complete until browser test passes

**Remember:** Your API test passing does NOT mean the feature works for users.

---

**Full testing guide:** `/home/setup/navidocs/docs/testing/TESTING_REQUIREMENTS.md`
