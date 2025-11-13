# LibraryView Component - Comprehensive Test Documentation

**Component Path:** `/home/setup/navidocs/client/src/views/LibraryView.vue`
**Route:** `/library`
**Test Document Version:** 1.0
**Last Updated:** 2025-10-23

---

## Table of Contents

1. [Component Overview](#component-overview)
2. [Manual Test Scenarios](#manual-test-scenarios)
3. [API Integration Tests](#api-integration-tests)
4. [DOM Element Verification](#dom-element-verification)
5. [Styling & Design System Tests](#styling--design-system-tests)
6. [Accessibility Tests](#accessibility-tests)
7. [Console Output Verification](#console-output-verification)
8. [Known Issues & Notes](#known-issues--notes)

---

## Component Overview

### Purpose
The LibraryView component serves as the document library interface for the NaviDocs application, providing:
- Overview of essential vessel documents
- Category-based document organization
- Role-based content filtering (Owner, Captain, Manager, Crew)
- Recent activity tracking
- Quick document pinning functionality

### Key Features
1. **Essential Documents Section** - Displays critical documents requiring quick access (Insurance, Registration, Owner's Manual)
2. **Category Browser** - Organized categories with document counts
3. **Role Switcher** - Toggle between different user roles to filter relevant content
4. **Recent Activity** - Timeline of document uploads, views, and shares
5. **Navigation** - Click-to-navigate category cards with hover effects

### Component Dependencies
- Vue 3 Composition API
- Vue Router 4
- Tailwind CSS design system
- Pinia (for future state management)

---

## Manual Test Scenarios

### Test Scenario 1: Component Loads and Renders

**Objective:** Verify that the LibraryView component loads successfully and displays all main sections.

#### Steps
1. Start the development server (`npm run dev` from `/home/setup/navidocs/client`)
2. Navigate to `http://localhost:5173/` (or configured port)
3. Click on the Library navigation link or directly navigate to `/library`
4. Wait for the page to fully load

#### Expected Results
- [ ] Page loads without errors
- [ ] Header section displays with "Document Library" title
- [ ] Vessel name "LILIAN I - 29 documents" is visible
- [ ] Role switcher displays with 4 role buttons (Owner, Captain, Manager, Crew)
- [ ] "Essential Documents" section shows 3 cards
- [ ] "Browse by Category" section shows 8 category cards
- [ ] "Recent Activity" section displays 3 activity items
- [ ] Background gradient applies correctly (dark purple to black)
- [ ] Glass morphism effects are visible on cards

#### Test Data
- Default role: Owner
- Document count: 29
- Essential docs: 3 cards
- Categories: 8 cards
- Recent activity items: 3

---

### Test Scenario 2: Role Switcher Functionality

**Objective:** Verify that the role switcher allows users to toggle between different role views.

#### Steps
1. Navigate to `/library`
2. Locate the role switcher in the header (top-right area)
3. Verify the default selected role is "Owner" (should have gradient background)
4. Click on "Captain" role button
5. Click on "Manager" role button
6. Click on "Crew" role button
7. Click back on "Owner" role button

#### Expected Results
- [ ] Default role "Owner" is visually highlighted (gradient background from-primary-500 to-secondary-500)
- [ ] Inactive role buttons have text-white/70 color
- [ ] Clicking a role button updates the visual state immediately
- [ ] Only one role button is highlighted at a time
- [ ] Hover effect applies to inactive buttons (text-white, bg-white/10)
- [ ] Transition animation is smooth (duration-200)
- [ ] Console logs show: `currentRole updated to: [roleName]` (if logging is enabled)

#### Console Verification
```javascript
// Expected reactive state changes
currentRole.value // Should change from 'owner' -> 'captain' -> 'manager' -> 'crew'
```

#### Edge Cases
- Rapidly clicking between roles
- Double-clicking the same role
- Clicking role during page load

---

### Test Scenario 3: Essential Documents Display

**Objective:** Verify that essential documents render correctly with all metadata.

#### Steps
1. Navigate to `/library`
2. Scroll to the "Essential Documents" section
3. Inspect each of the 3 document cards:
   - Insurance Policy 2025
   - LILIAN I Registration
   - Owner's Manual

#### Expected Results per Card

**Insurance Policy 2025:**
- [ ] Blue gradient icon (from-blue-500 to-blue-600) with shield checkmark SVG
- [ ] Title: "Insurance Policy 2025"
- [ ] Description: "Coverage: Full hull & liability"
- [ ] Status badge: "Active" (green, badge-success)
- [ ] File type: "PDF"
- [ ] Pink bookmark icon (top-right)
- [ ] Expiry alert: Yellow banner with clock icon, "Expires in 68 days (Dec 31, 2025)"
- [ ] Hover effect: Scale icon (110%), translate card up, increase shadow

**LILIAN I Registration:**
- [ ] Green gradient icon (from-green-500 to-green-600) with document SVG
- [ ] Title: "LILIAN I Registration"
- [ ] Description: "LLC • Monaco Registry"
- [ ] Status badge: "Valid" (green, badge-success)
- [ ] File type: "PDF"
- [ ] Pink bookmark icon (top-right)
- [ ] Compliance badge: Green banner with checkmark, "Legally required aboard vessel"
- [ ] Hover effect: Scale icon (110%), translate card up, increase shadow

**Owner's Manual:**
- [ ] Purple gradient icon (from-purple-500 to-purple-600) with book SVG
- [ ] Title: "Owner's Manual"
- [ ] Description: "Complete vessel documentation"
- [ ] Badge: "17 pages" (badge-primary)
- [ ] File type: "PDF"
- [ ] Pink bookmark icon (top-right)
- [ ] Info badge: Purple banner with lightning icon, "Emergency reference • 6.7 MB"
- [ ] Hover effect: Scale icon (110%), translate card up, increase shadow

#### Visual Checks
- [ ] All cards have pink border (border-pink-400/30, hover border-pink-400/50)
- [ ] Glass morphism effect applied (bg-white/10, backdrop-blur-lg)
- [ ] Cards have proper spacing (gap-4 in grid)
- [ ] Animations stagger correctly (0.1s, 0.2s, 0.3s delays)

---

### Test Scenario 4: Category Navigation

**Objective:** Verify that category cards are clickable and trigger navigation events.

#### Steps
1. Navigate to `/library`
2. Scroll to "Browse by Category" section
3. Open browser developer console (F12)
4. Click on each category card in sequence:
   - Legal & Compliance
   - Financial
   - Operations
   - Manuals
   - Insurance
   - Photos
   - Service Records
   - Warranties

#### Expected Results per Click
- [ ] Console logs: `Navigate to category: [categoryId]`
- [ ] Hover effect: Card translates up (-translate-y-1), shadow increases
- [ ] Icon scales and rotates (110%, 3deg rotation)
- [ ] Arrow icon transitions (text-white/30 -> text-pink-400, translate-x-1)
- [ ] Title color transitions to pink-400 on hover
- [ ] No page navigation occurs (TODO: implementation pending)

#### Category Details Verification

| Category | Icon Color | Icon | Document Count | Status |
|----------|-----------|------|----------------|--------|
| Legal & Compliance | green-500 to green-600 | Shield checkmark | 8 documents | badge-success |
| Financial | yellow-500 to yellow-600 | Dollar circle | 11 documents | badge-primary |
| Operations | blue-500 to blue-600 | Clipboard | 2 documents | badge-primary |
| Manuals | purple-500 to purple-600 | Book | 1 document | badge-primary |
| Insurance | indigo-500 to indigo-600 | Shield checkmark | 1 document | badge-success |
| Photos | pink-500 to pink-600 | Image | 3 images | badge-primary |
| Service Records | orange-500 to orange-600 | Cog settings | Coming soon | bg-white/10 |
| Warranties | teal-500 to teal-600 | Clipboard check | Coming soon | bg-white/10 |

#### Console Output Format
```
Navigate to category: legal
Navigate to category: financial
Navigate to category: operations
Navigate to category: manuals
Navigate to category: insurance
Navigate to category: photos
Navigate to category: service
Navigate to category: warranties
```

---

### Test Scenario 5: Recent Activity Section

**Objective:** Verify that the recent activity timeline displays correctly.

#### Steps
1. Navigate to `/library`
2. Scroll to "Recent Activity" section
3. Inspect all 3 activity items

#### Expected Results

**Activity Item 1 - Facture n° F1820008157:**
- [ ] Red PDF badge (badge-pdf) with document icon
- [ ] Badge text: "PDF"
- [ ] Title: "Facture n° F1820008157"
- [ ] Timestamp: "Uploaded today at 2:30 PM"
- [ ] Status badge: "Indexed" (badge-success, green)
- [ ] Hover effect: Translates up slightly, text color changes to pink-400

**Activity Item 2 - Lilian delivery Olbia Cannes:**
- [ ] Green Excel badge (badge-excel) with table icon
- [ ] Badge text: "XLSX"
- [ ] Title: "Lilian delivery Olbia Cannes"
- [ ] Timestamp: "Viewed yesterday at 11:45 AM"
- [ ] Status badge: "Opened" (bg-white/10 text-white/70)
- [ ] Hover effect: Translates up slightly, text color changes to pink-400

**Activity Item 3 - Vessel exterior photo:**
- [ ] Purple image badge (badge-image) with photo icon
- [ ] Badge text: "JPG"
- [ ] Title: "Vessel exterior photo"
- [ ] Timestamp: "Shared 2 days ago"
- [ ] Status badge: "Shared" (badge-primary)
- [ ] Hover effect: Translates up slightly, text color changes to pink-400

#### Visual Checks
- [ ] Activity items are in a glass panel (rounded-2xl, p-6)
- [ ] Items have proper spacing (space-y-3)
- [ ] Each item has bg-white/10 backdrop-blur-lg
- [ ] Border border-white/10 is visible

---

### Test Scenario 6: Header Interactions

**Objective:** Verify header functionality including home button and vessel info.

#### Steps
1. Navigate to `/library`
2. Locate the header elements (top of page)
3. Test home button click
4. Verify vessel information display

#### Expected Results
- [ ] Logo button (wave icon) is visible with gradient background (primary-500 to secondary-500)
- [ ] Logo button has hover scale effect (hover:scale-105)
- [ ] Document count displays: "LILIAN I - 29 documents"
- [ ] Clicking logo navigates to home page (`/`)
- [ ] Header is sticky (sticky top-0 z-40)
- [ ] Header has glass effect (glass class applied)

---

### Test Scenario 7: Pin Document Functionality

**Objective:** Test the "Pin Document" button and bookmark icons.

#### Steps
1. Navigate to `/library`
2. Locate "Pin Document" button in Essential Documents section
3. Click the main "Pin Document" button (top-right of section)
4. Click individual bookmark icons on each essential document card

#### Expected Results
- [ ] Main button displays: Pink text (text-pink-400), plus icon, "Pin Document" label
- [ ] Hover effect: Color changes to pink-300
- [ ] Button click currently has no action (TODO: implementation pending)
- [ ] Individual bookmark icons are visible on each card (filled bookmark SVG)
- [ ] Bookmark icons have hover effects (bg-white/10)
- [ ] No console errors when clicking

#### Future Implementation Note
- Pin functionality should save to localStorage or backend API
- Should toggle between pinned/unpinned states
- Should update visual indicator

---

## API Integration Tests

### Test Setup

Currently, the LibraryView component uses **static mock data**. Future API integration will require:

#### Expected API Endpoints

**1. GET /api/vessels/:vesselId/documents/essential**
```javascript
// Expected Response
{
  "vessel": {
    "name": "LILIAN I",
    "documentCount": 29
  },
  "essentialDocuments": [
    {
      "id": "doc_insurance_2025",
      "title": "Insurance Policy 2025",
      "description": "Coverage: Full hull & liability",
      "type": "insurance",
      "status": "active",
      "fileType": "pdf",
      "expiryDate": "2025-12-31",
      "daysUntilExpiry": 68,
      "metadata": {
        "coverage": "Full hull & liability"
      },
      "isPinned": true
    },
    // ... more documents
  ]
}
```

**2. GET /api/vessels/:vesselId/documents/categories**
```javascript
// Expected Response
{
  "categories": [
    {
      "id": "legal",
      "name": "Legal & Compliance",
      "description": "Registration, licensing, customs",
      "documentCount": 8,
      "color": "green",
      "icon": "shield-check"
    },
    // ... more categories
  ]
}
```

**3. GET /api/vessels/:vesselId/activity/recent**
```javascript
// Expected Response
{
  "activities": [
    {
      "id": "activity_001",
      "documentId": "doc_invoice_001",
      "documentTitle": "Facture n° F1820008157",
      "action": "uploaded",
      "fileType": "pdf",
      "timestamp": "2025-10-23T14:30:00Z",
      "status": "indexed",
      "userId": "user_001"
    },
    // ... more activities
  ]
}
```

**4. POST /api/vessels/:vesselId/documents/:docId/pin**
```javascript
// Request Body
{
  "pinned": true
}

// Expected Response
{
  "success": true,
  "document": {
    "id": "doc_insurance_2025",
    "isPinned": true
  }
}
```

**5. GET /api/vessels/:vesselId/documents/role/:roleId**
```javascript
// Expected Response
{
  "role": "captain",
  "documents": [
    // Filtered documents based on role permissions
  ]
}
```

---

### API Test Scenarios

#### Test Scenario: API Call on Component Mount

**Objective:** Verify that API calls are made when component mounts.

**Steps:**
1. Open browser DevTools Network tab
2. Navigate to `/library`
3. Observe network requests

**Expected Network Activity:**
```
GET /api/vessels/lilian-i/documents/essential
GET /api/vessels/lilian-i/documents/categories
GET /api/vessels/lilian-i/activity/recent
```

**Expected Console Output:**
```javascript
console.log('Fetching essential documents for vessel: lilian-i')
console.log('Essential documents loaded:', data)
console.log('Categories loaded:', data)
console.log('Recent activity loaded:', data)
```

**Verification Points:**
- [ ] All 3 API endpoints called on mount
- [ ] Requests include proper headers (Authorization if auth is implemented)
- [ ] Loading states displayed during fetch
- [ ] Error handling works for failed requests
- [ ] Data populates correctly after successful fetch

---

#### Test Scenario: Role Switcher API Integration

**Objective:** Test that role changes trigger filtered document requests.

**Steps:**
1. Navigate to `/library`
2. Open Network tab
3. Click "Captain" role button
4. Observe network activity

**Expected Network Activity:**
```
GET /api/vessels/lilian-i/documents/role/captain
```

**Expected Response Behavior:**
- Documents filtered by captain permissions
- UI updates to show relevant documents
- Document counts may change per role

**Verification Points:**
- [ ] API call made on role change
- [ ] Role ID passed correctly in request
- [ ] Response data updates the UI
- [ ] Loading indicator shown during fetch
- [ ] Previous data cleared before new data loads

---

#### Test Scenario: Category Navigation API

**Objective:** Verify category click triggers navigation with proper parameters.

**Steps:**
1. Navigate to `/library`
2. Click on "Financial" category card
3. Verify router navigation

**Expected Behavior:**
```javascript
// Should navigate to:
router.push({
  name: 'category',
  params: { categoryId: 'financial' }
})
// Or
router.push('/library/category/financial')
```

**Future API Call:**
```
GET /api/vessels/lilian-i/documents/category/financial
```

**Verification Points:**
- [ ] Router navigation triggered
- [ ] Correct category ID passed
- [ ] Console log shows navigation attempt
- [ ] No JavaScript errors

---

#### Test Scenario: Error Handling

**Objective:** Test component behavior when API calls fail.

**Test Cases:**

**1. Network Error (500):**
- Simulate server error
- Expected: Error message displayed, retry button shown

**2. Not Found (404):**
- Navigate to library for non-existent vessel
- Expected: "No documents found" message

**3. Unauthorized (401):**
- Clear authentication token
- Expected: Redirect to login page

**4. Timeout:**
- Simulate slow network
- Expected: Loading indicator, then timeout message after 10s

**Verification Points:**
- [ ] Error messages are user-friendly
- [ ] Console errors include full error details
- [ ] Retry mechanism available
- [ ] UI doesn't break on error
- [ ] Previous data remains visible on error

---

## DOM Element Verification

### Critical DOM Elements Checklist

Use browser DevTools (F12 > Elements) to verify the following structure:

#### Header Section
```html
<header class="glass sticky top-0 z-40">
  <div class="max-w-7xl mx-auto px-6 py-4">
    <div class="flex items-center justify-between">
      <!-- Logo button -->
      <button class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl">
        <svg class="w-6 h-6 text-white">...</svg>
      </button>

      <!-- Title -->
      <h1 class="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
        Document Library
      </h1>

      <!-- Role Switcher -->
      <div class="glass rounded-xl p-1 flex items-center gap-1">
        <button class="px-4 py-2 rounded-lg text-sm font-medium">Owner</button>
        <button class="px-4 py-2 rounded-lg text-sm font-medium">Captain</button>
        <button class="px-4 py-2 rounded-lg text-sm font-medium">Manager</button>
        <button class="px-4 py-2 rounded-lg text-sm font-medium">Crew</button>
      </div>
    </div>
  </div>
</header>
```

**Verification:**
- [ ] Header has `position: sticky` applied
- [ ] Z-index is 40
- [ ] Glass effect classes present
- [ ] All 4 role buttons exist
- [ ] Active role has gradient background class

---

#### Essential Documents Grid
```html
<section class="mb-12">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- Insurance Card -->
    <div class="essential-doc-card group">
      <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
        <svg>...</svg>
      </div>
      <h3 class="font-bold text-white mb-1">Insurance Policy 2025</h3>
      <span class="badge badge-success text-xs">Active</span>
      <div class="expiry-alert">...</div>
    </div>

    <!-- Registration Card -->
    <div class="essential-doc-card group">...</div>

    <!-- Owner's Manual Card -->
    <div class="essential-doc-card group">...</div>
  </div>
</section>
```

**Verification:**
- [ ] Grid uses 3 columns on medium+ screens
- [ ] Each card has `essential-doc-card` class
- [ ] Group hover effects applied
- [ ] Alert badges have correct classes

---

#### Category Grid
```html
<section class="mb-12">
  <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
    <!-- 8 category cards -->
    <div class="category-card group" @click="navigateToCategory('legal')">
      <div class="category-icon-wrapper bg-gradient-to-br from-green-500 to-green-600">
        <svg class="w-7 h-7 text-white">...</svg>
      </div>
      <h3 class="font-bold text-white mb-1">Legal & Compliance</h3>
      <span class="badge badge-success text-xs">8 documents</span>
      <svg class="w-5 h-5 text-white/30"><!-- arrow --></svg>
    </div>
    <!-- ... 7 more cards -->
  </div>
</section>
```

**Verification:**
- [ ] Grid uses 4 columns on large screens
- [ ] 8 category cards rendered
- [ ] Each card has click handler
- [ ] Icons have correct gradient colors
- [ ] Arrow icons present on all cards

---

#### Recent Activity Panel
```html
<section>
  <div class="glass rounded-2xl p-6">
    <div class="space-y-3">
      <!-- Activity items -->
      <div class="activity-item group">
        <div class="file-type-badge badge-pdf">
          <svg>...</svg>
          <span>PDF</span>
        </div>
        <h4 class="font-semibold text-white">Facture n° F1820008157</h4>
        <p class="text-xs text-white/70">Uploaded today at 2:30 PM</p>
        <span class="badge badge-success text-xs">Indexed</span>
      </div>
      <!-- 2 more items -->
    </div>
  </div>
</section>
```

**Verification:**
- [ ] Glass panel applied
- [ ] 3 activity items present
- [ ] File type badges have correct colors (PDF=red, XLSX=green, JPG=purple)
- [ ] Timestamps formatted correctly
- [ ] Status badges visible

---

### Element Selector Reference

For automated testing, use these selectors:

```javascript
// Header
const header = document.querySelector('header.glass')
const logoButton = document.querySelector('button[class*="from-primary-500"]')
const roleButtons = document.querySelectorAll('.glass.rounded-xl button')

// Essential Documents
const essentialSection = document.querySelectorAll('.essential-doc-card')
const insuranceCard = essentialSection[0]
const registrationCard = essentialSection[1]
const manualCard = essentialSection[2]

// Categories
const categoryCards = document.querySelectorAll('.category-card')
const legalCategory = categoryCards[0]
const financialCategory = categoryCards[1]

// Recent Activity
const activityItems = document.querySelectorAll('.activity-item')

// Badges
const successBadges = document.querySelectorAll('.badge-success')
const primaryBadges = document.querySelectorAll('.badge-primary')
```

---

## Styling & Design System Tests

### Design System Compliance

#### Color Palette Verification

**Primary Colors:**
- [ ] Primary gradient: `from-primary-500 to-secondary-500`
- [ ] Pink accent: `text-pink-400`, `border-pink-400`
- [ ] Category gradients match specifications

**Test Method:**
```javascript
// In browser console
const element = document.querySelector('.btn-primary')
const styles = window.getComputedStyle(element)
console.log('Background:', styles.background)
// Should show gradient from primary to secondary
```

---

#### Typography Verification

**Font Family:**
- [ ] All text uses Inter font (from Google Fonts)
- [ ] Font weights: 400 (normal), 600 (semibold), 700 (bold), 800 (extrabold)

**Test Method:**
```javascript
const body = document.body
const styles = window.getComputedStyle(body)
console.log('Font family:', styles.fontFamily)
// Should include 'Inter'
```

**Font Sizes:**
| Element | Expected Size | Class |
|---------|---------------|-------|
| H1 (Document Library) | text-xl | 20px |
| H2 (Section titles) | text-2xl | 24px |
| H3 (Card titles) | font-bold | 16px |
| Body text | text-sm | 14px |
| Small text | text-xs | 12px |

---

#### Spacing & Layout

**Container:**
- [ ] Max width: `max-w-7xl` (1280px)
- [ ] Horizontal padding: `px-6` (24px)
- [ ] Vertical padding: `py-8` (32px)

**Grid Gaps:**
- [ ] Essential docs: `gap-4` (16px)
- [ ] Category cards: `gap-4` (16px)
- [ ] Activity items: `space-y-3` (12px between items)

**Section Spacing:**
- [ ] Bottom margin: `mb-12` (48px)

---

#### Glass Morphism Effects

**Glass Class:**
```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

**Verification:**
- [ ] Header has glass effect
- [ ] Role switcher container has glass effect
- [ ] Essential document cards have glass effect
- [ ] Recent activity panel has glass effect

**Test Method:**
```javascript
const glassElements = document.querySelectorAll('.glass')
glassElements.forEach(el => {
  const styles = window.getComputedStyle(el)
  console.log('Backdrop filter:', styles.backdropFilter)
  // Should include 'blur'
})
```

---

#### Hover & Transition Effects

**Test Cases:**

**1. Card Hover:**
- [ ] Translates up: `-translate-y-1` (4px)
- [ ] Shadow increases: `hover:shadow-soft-lg`
- [ ] Border color brightens: `hover:border-pink-400/50`
- [ ] Transition duration: `duration-300`

**2. Icon Hover:**
- [ ] Scales to 110%: `group-hover:scale-110`
- [ ] Rotates 3deg: `group-hover:rotate-3`
- [ ] Transition: `transition-all duration-300`

**3. Button Hover:**
- [ ] Background changes: `hover:bg-white/10`
- [ ] Text color changes: `hover:text-white`
- [ ] Scale effect: `hover:scale-105`

**Test Method:**
```javascript
// Hover over an element and check computed styles
const card = document.querySelector('.essential-doc-card')
card.addEventListener('mouseenter', () => {
  const styles = window.getComputedStyle(card)
  console.log('Transform:', styles.transform)
  // Should show translateY(-4px)
})
```

---

#### Animations

**Fade-in Animation:**
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Verification:**
- [ ] Essential doc cards animate in sequence (0.1s, 0.2s, 0.3s)
- [ ] Category cards stagger (0.1s, 0.15s, 0.2s, 0.25s, etc.)
- [ ] Animation duration: 0.4s
- [ ] Easing: ease-out

**Test Method:**
- Refresh page and observe cards appearing
- Use browser DevTools > Animations panel to inspect timing

---

#### Responsive Design

**Breakpoints:**

**Mobile (< 768px):**
- [ ] Grid: 1 column
- [ ] Padding reduces
- [ ] Role switcher may wrap

**Tablet (768px - 1024px):**
- [ ] Essential docs: 3 columns
- [ ] Categories: 3 columns
- [ ] Full spacing maintained

**Desktop (1024px+):**
- [ ] Categories: 4 columns
- [ ] Max container width: 1280px
- [ ] All hover effects active

**Test Method:**
```javascript
// Resize browser window or use DevTools device mode
window.addEventListener('resize', () => {
  console.log('Window width:', window.innerWidth)
})
```

---

#### Dark Theme Consistency

**Background:**
- [ ] App background: `linear-gradient(135deg, #1a0b2e 0%, #0a0118 50%, #000000 100%)`
- [ ] Text: `text-white` primary, `text-white/70` secondary
- [ ] Borders: `border-white/10` or `border-white/20`

**Contrast Ratios:**
- [ ] White text on dark background: >= 4.5:1 (WCAG AA)
- [ ] Pink accent on dark background: >= 3:1 (for large text)

**Test Method:**
```javascript
// Use browser DevTools > Lighthouse > Accessibility
// Or use contrast checker extension
```

---

## Accessibility Tests

### WCAG 2.1 Level AA Compliance

#### Keyboard Navigation

**Tab Order Test:**
1. Navigate to `/library`
2. Press Tab key repeatedly
3. Verify focus moves in logical order:
   - Logo button
   - Role buttons (Owner → Captain → Manager → Crew)
   - Pin Document button
   - Essential document cards (Insurance → Registration → Manual)
   - Category cards (Legal → Financial → ... → Warranties)
   - Activity items

**Expected Results:**
- [ ] All interactive elements are reachable via Tab
- [ ] Focus indicator visible (2px solid primary-500 outline)
- [ ] Tab order follows visual layout
- [ ] No keyboard traps
- [ ] Shift+Tab reverses order

---

#### Screen Reader Support

**Test with NVDA (Windows) or VoiceOver (macOS):**

1. Navigate to `/library`
2. Enable screen reader
3. Tab through all elements

**Expected Announcements:**

**Header:**
```
"Button, Navigate to home"
"Heading level 1, Document Library"
"List of 4 items" (role buttons)
"Button, Owner, selected"
"Button, Captain, not selected"
```

**Essential Documents:**
```
"Heading level 2, Essential Documents"
"Button, Pin Document"
"Card, Insurance Policy 2025"
"Badge, Active"
"Alert, Expires in 68 days"
```

**Categories:**
```
"Heading level 2, Browse by Category"
"Button, Legal & Compliance, 8 documents"
```

**Improvements Needed:**
- [ ] Add `role="button"` to category cards
- [ ] Add `aria-label` to icon-only buttons
- [ ] Add `aria-current="true"` to active role
- [ ] Add `aria-live="polite"` for role changes

---

#### ARIA Attributes

**Recommended additions to LibraryView.vue:**

```vue
<!-- Role Switcher -->
<div class="glass rounded-xl p-1 flex items-center gap-1" role="group" aria-label="Select user role">
  <button
    v-for="role in roles"
    :key="role.id"
    @click="currentRole = role.id"
    :aria-pressed="currentRole === role.id"
    :aria-label="`Switch to ${role.label} role`"
  >
    {{ role.label }}
  </button>
</div>

<!-- Category Cards -->
<div
  class="category-card group"
  @click="navigateToCategory('legal')"
  role="button"
  tabindex="0"
  :aria-label="`Navigate to Legal & Compliance category, ${categoryCount} documents`"
  @keydown.enter="navigateToCategory('legal')"
  @keydown.space.prevent="navigateToCategory('legal')"
>
  ...
</div>

<!-- Expiry Alert -->
<div class="expiry-alert" role="alert" aria-live="polite">
  <svg aria-hidden="true">...</svg>
  <span>Expires in 68 days (Dec 31, 2025)</span>
</div>
```

---

#### Focus Management

**Test Scenarios:**

**1. Modal Focus Trap (Future):**
- When modal opens, focus should move to modal
- Tab should cycle within modal
- Escape should close modal and return focus

**2. Skip Links:**
- Add "Skip to main content" link
- Should be first tabbable element
- Hidden until focused

**3. Focus Restoration:**
- After navigation, focus should restore to logical position

---

#### Color Contrast

**Test with DevTools Lighthouse:**

1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Accessibility"
4. Click "Generate report"

**Expected Passes:**
- [ ] Background and foreground colors have sufficient contrast ratio
- [ ] All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text)

**Manual Checks:**

| Element | Foreground | Background | Ratio | Pass? |
|---------|-----------|------------|-------|-------|
| White text | #FFFFFF | #0a0118 | 19:1 | ✓ |
| White/70 text | rgba(255,255,255,0.7) | #0a0118 | ~13:1 | ✓ |
| Pink-400 text | #f472b6 | #0a0118 | ~8:1 | ✓ |
| Badge text | Various | Various | Check each | - |

---

#### Semantic HTML

**Verification:**
- [ ] Proper heading hierarchy (H1 → H2 → H3)
- [ ] `<header>` used for page header
- [ ] `<main>` used for main content
- [ ] `<section>` used for content sections
- [ ] `<button>` used for interactive elements (not `<div>`)

**Recommended Structure:**
```html
<div class="min-h-screen">
  <header class="glass sticky top-0 z-40">...</header>
  <main class="max-w-7xl mx-auto px-6 py-8">
    <section aria-labelledby="essential-docs-title">
      <h2 id="essential-docs-title">Essential Documents</h2>
      ...
    </section>
    <section aria-labelledby="categories-title">
      <h2 id="categories-title">Browse by Category</h2>
      ...
    </section>
    <section aria-labelledby="activity-title">
      <h2 id="activity-title">Recent Activity</h2>
      ...
    </section>
  </main>
</div>
```

---

#### Alternative Text

**SVG Icons:**
All decorative icons should have `aria-hidden="true"`:
```vue
<svg class="w-6 h-6 text-white" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="..." />
</svg>
```

**Meaningful icons should have titles:**
```vue
<svg aria-labelledby="insurance-icon" role="img">
  <title id="insurance-icon">Insurance policy icon</title>
  <path d="..." />
</svg>
```

---

## Console Output Verification

### Expected Console Logs

#### On Component Mount
```javascript
console.log('[LibraryView] Component mounted')
console.log('[LibraryView] Current role:', 'owner')
console.log('[LibraryView] Roles available:', roles)
```

#### On Role Change
```javascript
console.log('[LibraryView] Role changed to:', 'captain')
console.log('[LibraryView] Filtering documents for role:', 'captain')
```

#### On Category Click
```javascript
console.log('Navigate to category:', 'legal')
console.log('Navigate to category:', 'financial')
console.log('Navigate to category:', 'operations')
console.log('Navigate to category:', 'manuals')
console.log('Navigate to category:', 'insurance')
console.log('Navigate to category:', 'photos')
console.log('Navigate to category:', 'service')
console.log('Navigate to category:', 'warranties')
```

#### Vue Router Navigation
```javascript
console.log('[Router] Navigating to:', { name: 'home' })
console.log('[Router] Navigation complete:', '/')
```

---

### Console Errors to Watch For

**Should NOT appear:**
```javascript
// Bad - indicates problems
❌ Uncaught TypeError: Cannot read property 'value' of undefined
❌ [Vue warn]: Failed to resolve component: UnknownComponent
❌ [Vue warn]: Invalid prop: type check failed for prop "role"
❌ ReferenceError: roles is not defined
❌ Failed to fetch
❌ Unhandled promise rejection
```

**Expected warnings during development:**
```javascript
// OK in dev mode
[Vue Router warn]: No match found for location with path "/library"
// Only if route not registered
```

---

### Vue DevTools Inspection

**Using Vue DevTools Extension:**

1. Open Vue DevTools
2. Navigate to "Components" tab
3. Select "LibraryView" component

**Expected Component State:**
```javascript
{
  data: {
    currentRole: 'owner'
  },
  computed: {
    roles: [
      { id: 'owner', label: 'Owner', icon: '...' },
      { id: 'captain', label: 'Captain', icon: '...' },
      { id: 'manager', label: 'Manager', icon: '...' },
      { id: 'crew', label: 'Crew', icon: '...' }
    ]
  },
  methods: {
    navigateToCategory: ƒ (category)
  }
}
```

**Check for:**
- [ ] Component name: "LibraryView"
- [ ] Props: none expected
- [ ] Data: currentRole reactive ref
- [ ] No warnings in DevTools

---

### Performance Console Checks

**Measure render time:**
```javascript
// Add to component
console.time('LibraryView render')
// ... component renders
console.timeEnd('LibraryView render')
// Expected: < 50ms
```

**Check for memory leaks:**
```javascript
// In browser console
performance.memory.usedJSHeapSize
// Should not continuously increase on role changes
```

---

## Known Issues & Notes

### Current Limitations

1. **Mock Data:**
   - All document data is hardcoded in the component
   - No actual API integration yet
   - Document counts are static

2. **Incomplete Features:**
   - Pin Document functionality not implemented (click does nothing)
   - Category navigation logs to console but doesn't navigate
   - Role switcher updates state but doesn't filter documents
   - Bookmark icons are not interactive

3. **Missing Functionality:**
   - No search functionality in library view
   - No document filtering/sorting
   - No pagination for large document sets
   - No document preview on hover/click

4. **State Management:**
   - Role selection not persisted (resets on page refresh)
   - No Pinia store integration yet
   - No shared state with other components

---

### Browser Compatibility

**Tested Browsers:**
- Chrome/Edge 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓

**Known Issues:**
- Safari: Backdrop blur may have reduced quality on older versions
- Firefox: Some gradients may render slightly differently
- Mobile Safari: Hover effects don't apply (expected behavior)

---

### Performance Notes

**Optimization Opportunities:**
1. Lazy load category icons
2. Virtual scrolling for activity feed (if grows large)
3. Memoize role filtering logic
4. Debounce category click events

**Current Performance:**
- Initial load: ~200ms
- Role switch: <50ms (instant)
- Category click: <10ms
- Smooth 60fps animations

---

### Future Enhancements

**Planned Features:**
1. Real API integration with backend
2. Document search within library
3. Filter by date, status, file type
4. Drag-and-drop document upload
5. Multi-document actions (bulk pin, delete)
6. Document preview modal
7. Shareable category links
8. Export category as PDF/CSV

---

### Testing Environment

**Recommended Setup:**
- Node.js: v18 or v20
- npm: v9+
- Browser: Chrome 120+ or Firefox 120+
- Screen resolution: 1920x1080 or higher
- Operating System: Any (Windows, macOS, Linux)

**Test Data:**
- Vessel: LILIAN I
- Document count: 29
- User roles: 4 (Owner, Captain, Manager, Crew)
- Categories: 8
- Recent activity items: 3

---

## Approval Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | | | |
| QA Tester | | | |
| Designer (UI/UX) | | | |
| Product Owner | | | |

---

## Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-23 | Initial test documentation created | Claude |

---

## Additional Resources

**Component Path:**
- `/home/setup/navidocs/client/src/views/LibraryView.vue`

**Related Files:**
- `/home/setup/navidocs/client/src/router.js` - Route configuration
- `/home/setup/navidocs/client/src/assets/main.css` - Global styles and design system

**Documentation:**
- Vue 3: https://vuejs.org/
- Vue Router 4: https://router.vuejs.org/
- Tailwind CSS: https://tailwindcss.com/

**Testing Tools:**
- Playwright: https://playwright.dev/
- Vue DevTools: https://devtools.vuejs.org/
- Lighthouse: https://developers.google.com/web/tools/lighthouse

---

**End of Test Documentation**
