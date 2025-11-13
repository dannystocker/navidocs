# LibraryView - Smoke Test Checklist

**Version:** 1.0
**Last Updated:** 2025-10-23
**Component:** LibraryView (`/home/setup/navidocs/client/src/views/LibraryView.vue`)
**Test Duration:** ~10-15 minutes

---

## Purpose

This smoke test checklist provides a quick validation that the LibraryView component is functioning correctly after code changes, deployments, or environment updates. It covers critical functionality that must work for the feature to be considered "shippable."

---

## Prerequisites

- [ ] Repository cloned: `/home/setup/navidocs`
- [ ] Node.js installed (v18 or v20)
- [ ] Dependencies installed (`npm install` in client directory)
- [ ] No pending git changes that might interfere
- [ ] Browser available (Chrome, Firefox, or Safari recommended)

---

## Test Environment Setup

### 1. Start the Development Server

```bash
# Navigate to client directory
cd /home/setup/navidocs/client

# Install dependencies (if not already done)
npm install

# Start dev server
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

**Verification:**
- [ ] Server starts without errors
- [ ] Port 5173 is accessible
- [ ] No dependency errors in terminal
- [ ] Build completes in <5 seconds

**If server fails:**
- Check for port conflicts: `lsof -i :5173`
- Check Node version: `node --version`
- Clear cache: `rm -rf node_modules/.vite`

---

## Smoke Test Scenarios

### Test 1: Initial Page Load ✓

**Steps:**
1. Open browser
2. Navigate to `http://localhost:5173/library`
3. Wait for page to fully load (2-3 seconds)

**Pass Criteria:**
- [ ] Page loads without white screen or errors
- [ ] Header appears with "Document Library" title
- [ ] Vessel name "LILIAN I - 29 documents" visible
- [ ] No JavaScript errors in console (F12 > Console)
- [ ] Background gradient visible (purple to black)
- [ ] Page renders in <3 seconds

**Expected Console Output:**
```
[Vue Router] Navigating to: /library
[LibraryView] Component mounted
```

**Failure Indicators:**
- ❌ Blank/white page
- ❌ "Cannot read property X of undefined" errors
- ❌ Infinite loading spinner
- ❌ 404 Not Found

---

### Test 2: Console Error Check ✓

**Steps:**
1. With `/library` loaded, open DevTools (F12)
2. Go to Console tab
3. Scan for errors (red text)

**Pass Criteria:**
- [ ] No JavaScript errors (Uncaught, TypeError, ReferenceError)
- [ ] No Vue warnings about failed components
- [ ] No "Failed to fetch" network errors
- [ ] No unhandled promise rejections

**Acceptable Warnings (can ignore):**
```javascript
// These are OK
[Vue Router warn]: ...
[Vue Devtools] ...
```

**Failure Indicators:**
```javascript
// These are BAD
❌ Uncaught TypeError: Cannot read properties of undefined
❌ [Vue warn]: Failed to resolve component
❌ Uncaught ReferenceError: X is not defined
❌ Failed to fetch
```

**If errors found:**
- Copy full error stack trace
- Note which action triggered it
- Document browser and version
- Screenshot the console

---

### Test 3: All Sections Render ✓

**Steps:**
1. On `/library`, scroll through entire page
2. Verify each major section is visible

**Essential Documents Section:**
- [ ] Section title "Essential Documents" visible
- [ ] "Pin Document" button visible (top-right)
- [ ] 3 document cards present:
  - [ ] Insurance Policy 2025 (blue icon)
  - [ ] LILIAN I Registration (green icon)
  - [ ] Owner's Manual (purple icon)
- [ ] Each card has an icon, title, description, badge, and alert banner
- [ ] Icons have proper colors and gradients

**Browse by Category Section:**
- [ ] Section title "Browse by Category" visible
- [ ] 8 category cards present:
  - [ ] Legal & Compliance (green)
  - [ ] Financial (yellow)
  - [ ] Operations (blue)
  - [ ] Manuals (purple)
  - [ ] Insurance (indigo)
  - [ ] Photos (pink)
  - [ ] Service Records (orange)
  - [ ] Warranties (teal)
- [ ] Each card has icon, title, description, and arrow
- [ ] Document counts visible on each card

**Recent Activity Section:**
- [ ] Section title "Recent Activity" visible
- [ ] Glass panel container visible
- [ ] 3 activity items present:
  - [ ] Facture n° F1820008157 (PDF badge)
  - [ ] Lilian delivery Olbia Cannes (XLSX badge)
  - [ ] Vessel exterior photo (JPG badge)
- [ ] Each item has file type badge, title, timestamp, and status badge

**Pass Criteria:**
- [ ] All 3 sections visible without scrolling issues
- [ ] No missing images or broken icons
- [ ] No layout overflow or cutoff content
- [ ] Spacing looks correct between sections

---

### Test 4: Role Switcher Functionality ✓

**Steps:**
1. Locate role switcher in header (top-right)
2. Verify "Owner" is selected by default (has gradient background)
3. Click "Captain" button
4. Click "Manager" button
5. Click "Crew" button
6. Click "Owner" button again

**Pass Criteria:**
- [ ] All 4 role buttons visible: Owner, Captain, Manager, Crew
- [ ] Default role "Owner" has gradient background (from-primary-500 to-secondary-500)
- [ ] Clicking button immediately updates visual state
- [ ] Only one role highlighted at a time
- [ ] Previously selected role returns to inactive state (text-white/70)
- [ ] Inactive buttons show hover effect (bg-white/10)
- [ ] Smooth transition animation (no flashing)
- [ ] No console errors when switching roles

**Console Verification:**
```javascript
// Open console (F12) and check for:
Navigate to category: captain (if logging enabled)
Navigate to category: manager
Navigate to category: crew
Navigate to category: owner
```

**Failure Indicators:**
- ❌ Multiple roles highlighted simultaneously
- ❌ Button doesn't respond to clicks
- ❌ JavaScript error on click
- ❌ Role state doesn't update

---

### Test 5: Category Card Clicks ✓

**Steps:**
1. Open browser console (F12 > Console)
2. Scroll to "Browse by Category" section
3. Click on each category card and verify console output:

| Category | Click | Console Output Expected |
|----------|-------|------------------------|
| Legal & Compliance | Click | `Navigate to category: legal` |
| Financial | Click | `Navigate to category: financial` |
| Operations | Click | `Navigate to category: operations` |
| Manuals | Click | `Navigate to category: manuals` |
| Insurance | Click | `Navigate to category: insurance` |
| Photos | Click | `Navigate to category: photos` |
| Service Records | Click | `Navigate to category: service` |
| Warranties | Click | `Navigate to category: warranties` |

**Pass Criteria:**
- [ ] Each card is clickable
- [ ] Hover effect applies: card translates up, shadow increases
- [ ] Icon scales and rotates on hover (group-hover effects)
- [ ] Arrow icon transitions to pink-400 and translates right
- [ ] Console logs correct category ID
- [ ] No JavaScript errors
- [ ] No actual page navigation (stays on /library)

**Failure Indicators:**
- ❌ Cards not clickable
- ❌ Wrong category logged
- ❌ TypeError in console
- ❌ Page navigates away unexpectedly
- ❌ Hover effects don't work

---

### Test 6: Header Navigation ✓

**Steps:**
1. On `/library` page
2. Locate logo button (wave icon, top-left)
3. Hover over button
4. Click button

**Pass Criteria:**
- [ ] Logo button visible with gradient background (primary to secondary)
- [ ] Hover effect: button scales to 105% (hover:scale-105)
- [ ] Clicking button navigates to home page (`/`)
- [ ] Navigation completes without errors
- [ ] Back button returns to `/library`

**Console Verification:**
```javascript
[Router] Navigating to: { name: 'home' }
[Router] Navigation complete
```

---

### Test 7: Hover Effects & Interactions ✓

**Steps:**
Test hover states on key interactive elements.

**Essential Document Cards:**
1. Hover over Insurance Policy card
   - [ ] Card translates up (-translate-y-1)
   - [ ] Shadow increases
   - [ ] Border color brightens (border-pink-400/50)
   - [ ] Icon scales to 110%

2. Hover over bookmark icon
   - [ ] Background changes (hover:bg-white/10)
   - [ ] Color changes to pink-300

**Category Cards:**
1. Hover over "Financial" category
   - [ ] Card translates up
   - [ ] Shadow increases
   - [ ] Icon scales to 110% and rotates 3deg
   - [ ] Title color changes to pink-400
   - [ ] Arrow changes to pink-400 and translates right

**Activity Items:**
1. Hover over activity items
   - [ ] Item translates up slightly
   - [ ] Background lightens (hover:bg-white/15)
   - [ ] Title color changes to pink-400

**Role Buttons:**
1. Hover over inactive role button
   - [ ] Text color changes to white
   - [ ] Background changes to white/10

**Pass Criteria:**
- [ ] All hover effects smooth (no janky animations)
- [ ] Transition duration feels right (~200-300ms)
- [ ] Effects revert when mouse leaves
- [ ] No layout shifts during hover

---

### Test 8: Responsive Behavior ✓

**Steps:**
1. Open DevTools (F12)
2. Click device toggle (Ctrl+Shift+M or Cmd+Shift+M)
3. Test at different viewport sizes:

**Desktop (1920x1080):**
- [ ] Container max-width: 1280px (max-w-7xl)
- [ ] Essential docs: 3 columns
- [ ] Categories: 4 columns
- [ ] All content centered
- [ ] No horizontal scroll

**Tablet (768px):**
- [ ] Essential docs: 3 columns maintained
- [ ] Categories: 3 columns
- [ ] Role switcher fits in header
- [ ] Readable spacing

**Mobile (375px):**
- [ ] Essential docs: 1 column (stacked)
- [ ] Categories: 1 column (stacked)
- [ ] Role switcher may wrap or scroll
- [ ] Header remains sticky
- [ ] No horizontal overflow
- [ ] Text remains legible

**Pass Criteria:**
- [ ] Layout adapts smoothly at all breakpoints
- [ ] No broken layouts
- [ ] No overlapping content
- [ ] Touch targets at least 44x44px on mobile

---

### Test 9: Visual Styling & Polish ✓

**Visual Quality Check:**

**Glass Morphism:**
- [ ] Header has glass effect (backdrop blur visible)
- [ ] Essential doc cards have glass effect
- [ ] Role switcher container has glass effect
- [ ] Recent activity panel has glass effect
- [ ] Blur effect works across all browsers

**Gradients:**
- [ ] Page background: Purple to black gradient
- [ ] Role switcher: Pink to purple gradient
- [ ] Category icons: Proper color gradients (green, yellow, blue, etc.)
- [ ] No gradient banding or color issues

**Typography:**
- [ ] Font: Inter (loaded from Google Fonts)
- [ ] Titles: Bold and readable
- [ ] Body text: Appropriate size (not too small)
- [ ] Proper hierarchy (H1 > H2 > H3)

**Colors:**
- [ ] White text contrasts well with dark background
- [ ] Pink accent color (#f472b6) visible and vibrant
- [ ] Badge colors match design (green=success, yellow=warning, etc.)
- [ ] Transparent elements blend smoothly

**Spacing:**
- [ ] Consistent padding/margins
- [ ] No elements touching edges
- [ ] Good visual rhythm (not cramped or too spacious)

**Animations:**
- [ ] Cards fade in on initial load
- [ ] Staggered animation delays (0.1s, 0.2s, etc.)
- [ ] Smooth transitions (no jerky movements)
- [ ] No animation flicker

**Pass Criteria:**
- [ ] Looks polished and professional
- [ ] Matches design system (Meilisearch-inspired)
- [ ] No visual bugs or glitches
- [ ] Consistent styling throughout

---

### Test 10: Browser Compatibility Quick Check ✓

**If Multiple Browsers Available:**

**Chrome/Edge:**
- [ ] All features work
- [ ] Glass effects render correctly
- [ ] Animations smooth
- [ ] No console errors

**Firefox:**
- [ ] All features work
- [ ] Gradients render correctly
- [ ] Hover effects work
- [ ] No console errors

**Safari (if on macOS):**
- [ ] All features work
- [ ] Backdrop blur supported
- [ ] Transitions smooth
- [ ] No console errors

**Pass Criteria:**
- [ ] Core functionality works in all tested browsers
- [ ] Only minor visual differences acceptable
- [ ] No critical errors in any browser

---

## Quick Issue Triage

### If Tests Fail

**Component doesn't load:**
1. Check route is registered in `/home/setup/navidocs/client/src/router.js`
2. Verify component file exists at `/home/setup/navidocs/client/src/views/LibraryView.vue`
3. Check for import errors in console

**Console errors appear:**
1. Copy full error message and stack trace
2. Note which action triggered the error
3. Check for typos in component code
4. Verify all imports are correct

**Styling looks wrong:**
1. Verify Tailwind CSS is loaded (check `main.css` import)
2. Check for conflicting CSS
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
4. Verify PostCSS and Tailwind configs

**Hover effects don't work:**
1. Ensure you're testing on desktop (not mobile)
2. Check for JavaScript errors blocking events
3. Verify CSS classes are applied

**Router navigation fails:**
1. Check Vue Router is initialized
2. Verify route names match
3. Check for navigation guards blocking access

---

## Pass/Fail Criteria

### Critical (Must Pass)

All of these must pass for the component to be considered functional:

- [ ] Test 1: Initial Page Load ✓
- [ ] Test 2: Console Error Check ✓
- [ ] Test 3: All Sections Render ✓
- [ ] Test 4: Role Switcher Functionality ✓
- [ ] Test 5: Category Card Clicks ✓

### Important (Should Pass)

These should work but can be fixed in follow-up:

- [ ] Test 6: Header Navigation ✓
- [ ] Test 7: Hover Effects & Interactions ✓
- [ ] Test 8: Responsive Behavior ✓

### Nice to Have (Can Defer)

These enhance quality but aren't blocking:

- [ ] Test 9: Visual Styling & Polish ✓
- [ ] Test 10: Browser Compatibility Quick Check ✓

---

## Test Results Template

**Tester Name:** ___________________________
**Date:** ___________________________
**Time Started:** ___________________________
**Time Completed:** ___________________________
**Browser:** ___________________________
**Browser Version:** ___________________________
**OS:** ___________________________
**Screen Resolution:** ___________________________

### Summary

**Tests Passed:** _____ / 10
**Tests Failed:** _____
**Critical Issues Found:** _____
**Minor Issues Found:** _____

**Overall Status:** 🟢 PASS / 🟡 PASS WITH ISSUES / 🔴 FAIL

### Failed Tests

| Test # | Test Name | Failure Reason | Severity |
|--------|-----------|----------------|----------|
| | | | Critical / Major / Minor |
| | | | Critical / Major / Minor |

### Issues Found

| Issue # | Description | Steps to Reproduce | Severity | Screenshot/Log |
|---------|-------------|-------------------|----------|----------------|
| 1 | | | | |
| 2 | | | | |

### Notes

```
Additional observations, questions, or concerns:

```

---

## Cleanup

After testing:

1. Stop the dev server (Ctrl+C in terminal)
2. Close browser tabs
3. Document any issues in project tracker
4. Update this checklist if new tests are needed

---

## Next Steps

**If All Tests Pass:**
- [ ] Mark component as smoke test approved
- [ ] Proceed to full regression testing (see `/home/setup/navidocs/client/tests/LibraryView.test.md`)
- [ ] Consider deploying to staging environment

**If Tests Fail:**
- [ ] Document failures in detail
- [ ] Create bug tickets for critical issues
- [ ] Assign to developer for fixes
- [ ] Re-run smoke tests after fixes
- [ ] Do not deploy until critical tests pass

**For Future Enhancements:**
- [ ] Add API integration tests
- [ ] Create automated Playwright tests
- [ ] Set up CI/CD smoke test pipeline
- [ ] Add performance benchmarks

---

## Automation Notes

This checklist can be partially automated with Playwright:

```javascript
// /home/setup/navidocs/tests/e2e/library-smoke.spec.js
import { test, expect } from '@playwright/test'

test('LibraryView smoke test', async ({ page }) => {
  // Test 1: Initial load
  await page.goto('http://localhost:5173/library')
  await expect(page.locator('h1')).toContainText('Document Library')

  // Test 2: Console errors
  page.on('console', msg => {
    if (msg.type() === 'error') throw new Error(msg.text())
  })

  // Test 3: Sections render
  await expect(page.locator('text=Essential Documents')).toBeVisible()
  await expect(page.locator('text=Browse by Category')).toBeVisible()
  await expect(page.locator('text=Recent Activity')).toBeVisible()

  // Test 4: Role switcher
  await page.click('text=Captain')
  await expect(page.locator('button:has-text("Captain")')).toHaveClass(/from-primary-500/)

  // Test 5: Category clicks
  await page.click('text=Legal & Compliance')
  // Check console for navigation log

  // ... more tests
})
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-23 | Initial smoke test checklist created | Claude |

---

## Contact & Support

**Questions about this checklist?**
- Review full test documentation: `/home/setup/navidocs/client/tests/LibraryView.test.md`
- Check component source: `/home/setup/navidocs/client/src/views/LibraryView.vue`
- Review router config: `/home/setup/navidocs/client/src/router.js`

**Reporting Issues:**
- Include browser version and OS
- Attach screenshots or screen recordings
- Copy full console error messages
- Note steps to reproduce

---

**END OF SMOKE TEST CHECKLIST**
