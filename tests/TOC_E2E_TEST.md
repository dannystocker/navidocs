# TOC Navigation - End-to-End Testing Guide

This document provides manual testing scenarios for the Table of Contents (TOC) navigation feature in NaviDocs.

## Prerequisites

- Application running locally or on test environment
- Test documents with TOC available (ensure at least one document has a multi-level TOC)
- Browser developer tools accessible (for inspecting localStorage and URL changes)

---

## Test Scenario 1: TOC Sidebar Display

### Objective
Verify that the TOC sidebar displays correctly when opening a document with table of contents.

### Steps
1. Navigate to the NaviDocs application
2. Select and open a document that contains a table of contents
3. Wait for the document to fully load

### Expected Results
- TOC sidebar appears on the left side of the screen
- TOC entries are displayed in a hierarchical/nested structure matching the document outline
- The current/active page entry is highlighted (typically with a different background color or text style)
- Entries show proper indentation for nested levels (H1, H2, H3, etc.)
- TOC sidebar does not overlap or obscure the PDF content area

### Verification Points
- [ ] Sidebar is visible on the left
- [ ] Hierarchical structure is preserved (parent/child relationships)
- [ ] Active page indicator is present and correct
- [ ] Visual styling is consistent and readable
- [ ] No layout issues or overlapping elements

---

## Test Scenario 2: Navigation

### Objective
Verify that clicking TOC entries correctly navigates the PDF viewer and updates related UI elements.

### Steps
1. Open a document with TOC
2. Note the current page number displayed
3. Click on a TOC entry that links to a different page
4. Observe the PDF viewer, URL bar, and TOC sidebar

### Expected Results
- PDF viewer immediately jumps to the correct page associated with the clicked TOC entry
- URL hash updates to reflect the new page (format: `#p=N` where N is the page number)
- The previously highlighted TOC entry is de-highlighted
- The newly selected TOC entry becomes highlighted/active
- Page number indicator in the viewer updates to match

### Verification Points
- [ ] PDF scrolls/jumps to the correct page
- [ ] URL contains correct hash parameter (e.g., `#p=5`)
- [ ] Only one TOC entry is highlighted at a time
- [ ] Highlighted entry corresponds to the current page
- [ ] Navigation is smooth without errors or flashing

### Additional Tests
- Click multiple different TOC entries in sequence
- Click the currently active TOC entry (should remain on same page)
- Test with both top-level and nested TOC entries

---

## Test Scenario 3: Deep Links

### Objective
Verify that direct URLs with page hash parameters correctly load the document at the specified page and highlight the appropriate TOC entry.

### Steps
1. Identify a document URL (e.g., `http://localhost:3000/document/sample.pdf`)
2. Append a page hash to the URL (e.g., `http://localhost:3000/document/sample.pdf#p=12`)
3. Open this URL in a new browser tab or window
4. Wait for the document to load

### Expected Results
- PDF viewer loads and displays page 12 (or the specified page number)
- TOC sidebar loads with the correct entry highlighted
- The highlighted TOC entry corresponds to page 12 or the section containing page 12
- URL hash remains intact after page load

### Verification Points
- [ ] PDF opens directly to the specified page (page 12)
- [ ] TOC entry for page 12 is highlighted
- [ ] URL hash parameter is preserved (`#p=12`)
- [ ] No initial flash of wrong page before jumping
- [ ] If TOC entry is nested, parent entries are expanded to show the active item

### Edge Cases to Test
- Invalid page number (e.g., `#p=999` for a 50-page document)
- Page number 1 (`#p=1`)
- Last page of document
- Negative or zero page numbers

---

## Test Scenario 4: Collapse/Expand

### Objective
Verify that the TOC sidebar can be collapsed/expanded and that the user's preference persists.

### Steps
1. Open a document with TOC
2. Locate the sidebar toggle button (typically an icon or button near the sidebar)
3. Click the toggle button to collapse the sidebar
4. Observe the UI change
5. Open browser developer tools (F12) and navigate to Application > Local Storage
6. Refresh the page
7. Observe the sidebar state after refresh
8. Click the toggle button again to expand the sidebar
9. Refresh the page again

### Expected Results

#### When Collapsing
- Sidebar smoothly animates closed (slides left or fades out)
- Toggle button icon changes to indicate "expand" action is available
- PDF content area expands to use the freed space
- localStorage contains a key indicating sidebar is collapsed (e.g., `tocSidebarCollapsed: true`)

#### When Expanding
- Sidebar smoothly animates open (slides right or fades in)
- Toggle button icon changes to indicate "collapse" action is available
- PDF content area contracts to accommodate sidebar
- localStorage updates to indicate sidebar is expanded (e.g., `tocSidebarCollapsed: false`)

#### Persistence After Refresh
- Sidebar state matches the last user action (collapsed stays collapsed, expanded stays expanded)
- No flashing or layout shift during page load

### Verification Points
- [ ] Toggle button is visible and clickable
- [ ] Collapse animation is smooth
- [ ] Expand animation is smooth
- [ ] localStorage key is set correctly
- [ ] Preference persists after page refresh
- [ ] PDF content area adjusts appropriately
- [ ] No JavaScript errors in console

### localStorage Check
In browser developer tools:
1. Go to Application tab > Local Storage > your domain
2. Look for a key like `tocSidebarCollapsed`, `sidebarState`, or similar
3. Verify the value changes when toggling (typically `true`/`false` or `"collapsed"`/`"expanded"`)

---

## Test Scenario 5: Search Integration

### Objective
Verify that search results integrate with TOC navigation and correctly navigate to the relevant page.

### Steps
1. Open a document with TOC
2. Locate the search functionality (search bar or search button)
3. Enter a search term that exists in the document (e.g., "introduction", "methodology")
4. Wait for search results to appear
5. Identify a search result that includes a "Jump to section" or similar navigation action
6. Click on the "Jump to section" link/button
7. Observe the PDF viewer, TOC sidebar, and URL

### Expected Results
- Search results display with relevant snippets/context
- Each result shows which page or section it appears in
- "Jump to section" or equivalent action is available for each result
- Clicking "Jump to section" navigates the PDF to the correct page
- TOC entry for that page becomes highlighted
- URL hash updates to reflect the new page (e.g., `#p=7`)
- Search term may be highlighted in the PDF viewer (depending on implementation)

### Verification Points
- [ ] Search functionality is accessible and working
- [ ] Results display with page/section information
- [ ] "Jump to section" action is clearly labeled
- [ ] Navigation occurs when clicking the action
- [ ] Correct page is displayed in PDF viewer
- [ ] TOC highlights the correct entry
- [ ] URL hash updates correctly
- [ ] Can navigate back to search results and select different result

### Additional Tests
- Test with multiple search results across different sections
- Test with search term appearing multiple times on same page
- Test with search term in a deeply nested TOC section
- Verify TOC expands parent sections if necessary to show highlighted entry

---

## Cross-Browser Testing

Perform all scenarios in the following browsers:
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, macOS only)
- [ ] Edge (latest)

---

## Mobile/Responsive Testing

For each scenario, test on:
- [ ] Mobile viewport (iOS Safari)
- [ ] Mobile viewport (Android Chrome)
- [ ] Tablet viewport (iPad Safari)

Additional mobile-specific checks:
- TOC sidebar may be hidden by default on mobile
- Toggle behavior may use a hamburger menu or overlay
- Touch interactions work smoothly
- No horizontal scrolling issues

---

## Regression Checklist

After any TOC-related code changes, verify:
- [ ] All 5 scenarios pass
- [ ] No console errors appear
- [ ] Performance is acceptable (no lag when clicking TOC entries)
- [ ] Accessibility: keyboard navigation works (Tab, Enter, Arrow keys)
- [ ] Accessibility: screen reader announces TOC entries and page changes
- [ ] Network tab shows no unnecessary re-fetching of PDF

---

## Known Issues / Notes

Document any known issues, limitations, or special notes here:

- _Example: Deep linking to pages beyond document length defaults to last page_
- _Example: TOC sidebar may take 1-2 seconds to populate for very large documents_

---

## Test Environment Information

When reporting issues, include:
- Browser name and version
- Operating system
- Application version/build number
- Document being tested
- Screenshot or video of issue

---

## Approval Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Tester | | | |
| Developer | | | |
| Product Owner | | | |

---

**Last Updated:** 2025-10-20
**Document Version:** 1.0
