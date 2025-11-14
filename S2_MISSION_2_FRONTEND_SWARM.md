# S² Mission 2: Frontend/UX Development Swarm
**Session ID:** NAVIDOCS-S2-FRONTEND
**Swarm Size:** 10 Haiku agents
**Coordinator:** S2-PLANNER (Sonnet)
**Estimated Duration:** 6-8 hours
**Dependencies:** Mission 1 (Backend) must complete first

---

## 🎯 Mission Objective

Implement owner dashboard UI components, integrate with backend APIs, and ensure all features from Session 3 intelligence dossier are production-ready with NaviDocs visual design system.

**Success Criteria:**
- Owner dashboard with 8 feature modules (inventory, cameras, maintenance, etc.)
- All UI components follow Session 3 design system (Ocean Deep, Wave Blue, Sand Beige)
- Mobile-first responsive design (80% of boat owners use mobile)
- Keyboard shortcuts + accessibility (WCAG 2.1 AA compliance)
- All features work offline (service workers for critical data)

---

## 🔗 Integration with Backend Swarm

**Prerequisites:**
- Mission 1 (Backend) MUST complete before this session starts
- All 50+ API endpoints must be functional and tested
- Database migrations applied successfully

**Coordination:**
- Frontend agents call Backend APIs (test integration as you build)
- Report any API bugs/issues to S2-PLANNER immediately
- No mocking - use real backend endpoints for realistic testing

---

## 👥 Agent Assignments

### Agent F-01: Owner Dashboard Layout & Navigation
**Identity:** S2-FRONTEND-H01
**Task:** Main dashboard shell + navigation system

**Deliverables:**
1. `client/src/pages/OwnerDashboard.vue` - Dashboard shell:
   - Top navigation with boat selector dropdown
   - Left sidebar with 8 feature modules:
     1. Cameras (📷 icon)
     2. Inventory (📦 icon)
     3. Maintenance (🔧 icon)
     4. Expenses (💰 icon)
     5. Calendar (📅 icon)
     6. Contacts (📞 icon)
     7. Documents (📄 icon - existing)
     8. Settings (⚙️ icon)
   - Quick stats cards (total spend this month, upcoming warranties, etc.)
   - Mobile hamburger menu (responsive design)

2. Design System Application:
   - Primary: Ocean Deep #003D5C (navbar, headings)
   - Accent: Wave Blue #0066CC (buttons, links)
   - Background: Sand Beige #F5F1E8
   - Typography: Montserrat (headings), Open Sans (body)

3. Keyboard Shortcuts:
   - `Ctrl+1` through `Ctrl+8` - Navigate between modules
   - `Ctrl+K` - Quick command palette
   - `Ctrl+S` - Save current form
   - `Esc` - Close modals

**Dependencies:** None (can start once Mission 1 complete)
**Context:** `intelligence/session-3/agent-9-visual-design-system.md`

---

### Agent F-02: Camera Monitoring Interface
**Identity:** S2-FRONTEND-H02
**Task:** Live camera feeds + snapshot gallery

**Deliverables:**
1. `client/src/components/CameraMonitoring.vue` - Camera dashboard:
   - Grid view of all cameras (2x2 on desktop, 1x1 on mobile)
   - Live RTSP stream preview (WebSocket connection)
   - Take snapshot button (calls Backend API)
   - Motion detection alerts (real-time via WebSocket)
   - Snapshot history gallery (daily automatic snapshots)

2. Features:
   - Click camera to view full-screen
   - Download snapshot to device
   - Share snapshot via WhatsApp
   - Motion detection timeline (last 7 days)
   - Camera offline detection (red indicator if stream fails)

3. Performance:
   - Lazy load camera streams (only load visible cameras)
   - Snapshot thumbnail caching
   - WebSocket reconnection logic (if connection drops)

**Dependencies:** Backend B-04 (Camera Integration API)
**Context:** `intelligence/session-2/camera-integration-spec.md`

---

### Agent F-03: Inventory Tracking Interface
**Identity:** S2-FRONTEND-H03
**Task:** Photo-based equipment catalog + depreciation calculator

**Deliverables:**
1. `client/src/components/InventoryTracking.vue` - Equipment catalog:
   - Photo grid view of all equipment
   - Add equipment modal (name, photo, purchase date, price)
   - Edit equipment inline
   - Delete with confirmation
   - Filter by category (electronics, safety, comfort, entertainment)
   - Sort by value, purchase date, depreciation

2. Depreciation Calculator Widget:
   - Visual depreciation curve chart (Chart.js)
   - Current value vs purchase price
   - Total inventory value rollup
   - €15K-€50K resale value recovery metric (highlight in green if >€15K)

3. Photo Upload:
   - Drag-and-drop file upload
   - Camera capture on mobile (use device camera)
   - Image preview before submit
   - Max 5MB per photo (compress if larger)

**Dependencies:** Backend B-02 (Inventory Tracking API)
**Context:** `intelligence/session-2/inventory-tracking-spec.md`

---

### Agent F-04: Maintenance Log & Calendar
**Identity:** S2-FRONTEND-H04
**Task:** Service history + multi-calendar visualization

**Deliverables:**
1. `client/src/components/MaintenanceLog.vue` - Service tracking:
   - Timeline view of past services (sorted by date)
   - Add service modal (service type, provider, cost, notes)
   - Upcoming reminders list (next 30 days)
   - Service provider ratings (1-5 stars)
   - Export service history to PDF

2. `client/src/components/MultiCalendar.vue` - 4 calendars in one:
   - Service Calendar (past/future services)
   - Warranty Calendar (expiration dates with color coding: green >90 days, yellow 30-90, red <30)
   - Onboard Calendar (owner's time on boat)
   - Work Calendar (maintenance roadmap)
   - Toggle view: All calendars, individual calendar
   - Month/week/day views

3. Integration:
   - iCal export button (download .ics file)
   - WhatsApp reminder setup (toggle notifications per event)
   - Color-coded events (service=blue, warranty=orange, onboard=green, work=purple)

**Dependencies:** Backend B-03 (Maintenance & Calendar API)
**Context:** `intelligence/session-2/maintenance-log-spec.md`, `multi-calendar-spec.md`

---

### Agent F-05: Expense Tracking Interface
**Identity:** S2-FRONTEND-H05
**Task:** Receipt scanning + spend visualization

**Deliverables:**
1. `client/src/components/ExpenseTracking.vue` - Expense manager:
   - Monthly spend chart (bar chart, last 12 months)
   - Add expense modal (photo receipt upload, OCR auto-fill)
   - Expense list (sorted by date, filterable by category)
   - Split expense modal (multi-user expense splitting)
   - Budget alerts (if monthly spend >80% of budget)

2. OCR Receipt Processing:
   - Take photo of receipt (mobile camera)
   - OCR extracts: date, amount, vendor, category
   - User confirms/edits extracted data
   - Save to database via Backend API

3. Spend Analytics:
   - Category breakdown (pie chart: fuel, maintenance, berthing, insurance, etc.)
   - Annual spend summary (compare to previous year)
   - Export to CSV for tax purposes
   - €60K-€100K/year metric (highlight if approaching budget)

**Dependencies:** Backend B-06 (Expense Tracking API)
**Context:** `intelligence/session-2/accounting-integration-spec.md`

---

### Agent F-06: Contact Directory Interface
**Identity:** S2-FRONTEND-H06
**Task:** Marina, mechanics, vendors directory

**Deliverables:**
1. `client/src/components/ContactDirectory.vue` - Provider directory:
   - List view of all contacts (sorted by last contact date)
   - Add contact modal (name, type, phone, email, location)
   - Edit contact inline
   - Delete with confirmation
   - Star rating per provider (1-5 stars)
   - One-tap call button (opens phone dialer on mobile)

2. Search & Filter:
   - Search by name, type, location
   - Filter by type: marina, mechanic, electronics, canvas, insurance, broker
   - Sort by rating, distance, last contact

3. Integration:
   - WhatsApp message button (opens WhatsApp chat)
   - Map view (show nearby providers on Google Maps)
   - Call tracking (log call duration when call ends)

**Dependencies:** Backend B-05 (Contact Management API)
**Context:** `intelligence/session-2/contact-management-spec.md`

---

### Agent F-07: Search UX Implementation
**Identity:** S2-FRONTEND-H07
**Task:** Impeccable search with structured results (NO long lists)

**Deliverables:**
1. `client/src/components/SmartSearch.vue` - Search interface:
   - Global search bar (top of dashboard, always visible)
   - Autocomplete suggestions (as you type)
   - Faceted search results (organized by category):
     - Documents (manuals, receipts, warranties)
     - Equipment (inventory items)
     - Contacts (providers)
     - Maintenance (service records)
   - Filter by date range, category, relevance
   - Result count per category (show "3 documents, 5 equipment")

2. No Long Lists:
   - Max 5 results per category on initial view
   - "Show more" button to expand category
   - Highlight search term in results (bold matching text)
   - Recent searches (remember last 10 searches)

3. Performance:
   - Search debounce (wait 300ms after typing stops)
   - Keyboard navigation (arrow keys to navigate results)
   - `Ctrl+K` shortcut to focus search

**Dependencies:** Backend B-07 (Search Infrastructure)
**Context:** `intelligence/session-2/search-ux-spec.md`

---

### Agent F-08: Warranty Expiration Dashboard
**Identity:** S2-FRONTEND-H08
**Task:** Upcoming warranties + alerts

**Deliverables:**
1. `client/src/components/WarrantyDashboard.vue` - Warranty tracker:
   - List of all equipment with warranties
   - Expiration countdown (days remaining)
   - Color coding: green >90 days, yellow 30-90, red <30
   - Alert setup (email/WhatsApp notifications at 30/60/90 days before expiration)
   - Upload warranty document link (from Documents module)

2. Features:
   - Add equipment from inventory (dropdown selector)
   - Manual warranty entry (if not in inventory)
   - Export warranty list to PDF
   - Calendar integration (show on Warranty Calendar)

3. Alerts:
   - Banner notification if warranty expires in <30 days
   - WhatsApp reminder (configurable days before expiration)
   - Email reminder fallback (if WhatsApp not configured)

**Dependencies:** Backend B-02 (Inventory), Backend B-03 (Calendar)
**Context:** `intelligence/session-2/session-2-architecture.md` (warranty tracking section)

---

### Agent F-09: WhatsApp Notification Settings
**Identity:** S2-FRONTEND-H09
**Task:** WhatsApp integration + notification preferences

**Deliverables:**
1. `client/src/components/WhatsAppSettings.vue` - Notification manager:
   - WhatsApp number input (phone number with country code)
   - Notification type toggles:
     - [ ] Warranty expiration alerts
     - [ ] Service reminders
     - [ ] Monthly spend summary
     - [ ] Motion detection (camera)
     - [ ] VAT/tax compliance reminders
   - Test notification button (send test message)
   - Delivery status history (last 10 notifications)

2. Features:
   - Verify WhatsApp number (send verification code)
   - Opt-out link (GDPR compliance)
   - Notification frequency (daily digest vs instant)
   - Quiet hours (no notifications between 10pm-8am)

3. Integration:
   - Backend B-08 (WhatsApp Integration API)
   - Visual feedback (green checkmark if delivery successful)

**Dependencies:** Backend B-08 (WhatsApp Integration API)
**Context:** `intelligence/session-2/whatsapp-integration-spec.md`

---

### Agent F-10: VAT/Tax Compliance Interface
**Identity:** S2-FRONTEND-H10
**Task:** EU exit tracking + customs stamp upload

**Deliverables:**
1. `client/src/components/VATCompliance.vue` - VAT tracker:
   - EU exit log (list of exit events with GPS coordinates)
   - 18-month countdown timer (days remaining until VAT obligation)
   - Add exit event manually (date, location, GPS coordinates)
   - Upload customs stamp photo (OCR extracts date, country, stamp number)
   - Compliance report download (PDF for customs authorities)

2. Alerts:
   - Red banner if <30 days until 18-month deadline
   - WhatsApp notification at 30/60/90 days before deadline
   - €20K-€100K risk indicator (estimated penalty if non-compliant)

3. GPS Integration:
   - Auto-detect EU exit/entry via GPS (if boat tracking enabled)
   - Manual override (if GPS fails)
   - Map view (show exit/entry points on Google Maps)

**Dependencies:** Backend B-10 (VAT/Tax Tracking API)
**Context:** `intelligence/session-2/vat-tax-tracking-spec.md`

---

## 🔄 Agent Coordination Protocol

### Task Execution Order

**All agents can run in parallel** (no strict dependencies within frontend swarm)

```
F-01 (Dashboard) ─┐
F-02 (Cameras)    │
F-03 (Inventory)  │
F-04 (Maintenance)├─→ All run in parallel after Mission 1 (Backend) completes
F-05 (Expenses)   │
F-06 (Contacts)   │
F-07 (Search)     │
F-08 (Warranty)   │
F-09 (WhatsApp)   │
F-10 (VAT)       ─┘
```

### Check-In Protocol

Each agent MUST announce at start:
```markdown
I am S2-FRONTEND-H03, assigned to Inventory Tracking Interface.
Dependencies: Mission 1 (Backend B-02) must be complete.
Status: Confirmed Backend API is live. Starting UI development.
```

### MCP Bridge Communication

**IF.bus message format:**
```json
{
  "from": "S2-FRONTEND-H03",
  "to": "S2-PLANNER",
  "type": "STATUS_UPDATE",
  "payload": {
    "task": "Inventory Tracking Interface",
    "status": "COMPLETE",
    "deliverables": ["client/src/components/InventoryTracking.vue"],
    "next_blocker": "Need Backend B-02 to fix photo upload 500 error"
  }
}
```

### Idle Task Assignment (While Waiting for Backend)

**If Backend API not ready:**
- Build UI components with mock data
- Write component tests (Jest + Vue Test Utils)
- Create Storybook stories for component showcase
- Review Session 3 design system for UI consistency

**If helping blocked agents:**
- Code review other UI components
- Test cross-component integration
- Write accessibility tests (keyboard nav, screen reader)
- Optimize performance (lazy loading, caching)

---

## 📊 Success Metrics (IF.TTT Compliance)

### Traceable
- [ ] All UI components documented in Storybook
- [ ] Git commit per feature (atomic commits)
- [ ] IF.citation references in code comments
- [ ] Design system adherence verified (all colors, fonts correct)

### Transparent
- [ ] Component decision log (why Vue 3 Composition API vs Options API)
- [ ] Token cost tracking (report Haiku usage per agent)
- [ ] Performance metrics (Lighthouse score >90)
- [ ] Accessibility audit (WCAG 2.1 AA compliance)

### Trustworthy
- [ ] All components tested (Jest unit tests + E2E with Playwright)
- [ ] Mobile-first responsive design verified on 3+ devices
- [ ] Keyboard shortcuts documented and tested
- [ ] Offline mode functional (service workers cache critical data)

---

## 🧪 Testing Requirements

Each agent MUST provide:

1. **Component Tests** (Jest + Vue Test Utils):
   - Test component rendering
   - Test user interactions (click, input, submit)
   - Test API integration (mock Backend responses)
   - Target: 80%+ code coverage

2. **E2E Tests** (Playwright):
   - Test complete user flows
   - Test cross-component interactions
   - Test mobile responsiveness

3. **Accessibility Tests**:
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast (WCAG AA compliance)

4. **Storybook Stories**:
   - Component showcase
   - All component variants
   - Interactive playground

---

## 📁 Deliverables Structure

```
navidocs/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   └── OwnerDashboard.vue
│   │   ├── components/
│   │   │   ├── CameraMonitoring.vue
│   │   │   ├── InventoryTracking.vue
│   │   │   ├── MaintenanceLog.vue
│   │   │   ├── MultiCalendar.vue
│   │   │   ├── ExpenseTracking.vue
│   │   │   ├── ContactDirectory.vue
│   │   │   ├── SmartSearch.vue
│   │   │   ├── WarrantyDashboard.vue
│   │   │   ├── WhatsAppSettings.vue
│   │   │   └── VATCompliance.vue
│   │   └── tests/
│   │       └── frontend/
│   │           ├── InventoryTracking.test.js
│   │           ├── CameraMonitoring.test.js
│   │           └── ... (one per component)
│   └── .storybook/
│       └── stories/
│           ├── InventoryTracking.stories.js
│           └── ... (one per component)
└── intelligence/
    └── s2-frontend/
        ├── agent-f01-dashboard.md
        ├── agent-f02-cameras.md
        ├── ... (one per agent)
        ├── frontend-swarm-summary.md
        └── frontend-citations.json (IF.TTT compliance)
```

---

## 🎨 Design System Compliance

**Mandatory Standards (from Session 3):**

**Colors:**
- Primary: Ocean Deep #003D5C (navbar, headings, high-priority alerts)
- Accent: Wave Blue #0066CC (buttons, links, interactive elements)
- Background: Sand Beige #F5F1E8 (page background, cards)
- Success: #4CAF50 (green for warranties >90 days, positive metrics)
- Warning: #FFA726 (yellow for warranties 30-90 days)
- Danger: #EF5350 (red for warranties <30 days, critical alerts)

**Typography:**
- Headings: Montserrat (600 weight for h1, 500 for h2-h6)
- Body: Open Sans (400 regular, 600 bold)
- Monospace: Roboto Mono (for serial numbers, GPS coordinates)

**Spacing:**
- Grid: 8px baseline (margins/padding in multiples of 8px)
- Card padding: 24px
- Button height: 40px
- Input height: 48px (larger for mobile)

**Accessibility:**
- Min contrast ratio: 4.5:1 (text on background)
- Focus indicators: 2px solid Wave Blue outline
- Touch targets: Min 44x44px (mobile-friendly)

---

## 🚀 Launch Command (for S2-PLANNER)

```bash
# S2-PLANNER will spawn 10 Haiku agents in parallel
# Prerequisites: Mission 1 (Backend) MUST be complete
# All agents start immediately (no dependencies within swarm)
# Frontend agents test Backend APIs as they build UI
```

**Estimated Cost:**
- 10 Haiku agents × 60K tokens average = 600K tokens
- ~$3-$5 total (Haiku pricing)

**Estimated Time:**
- Component development: 4-5 hours (parallel)
- Integration testing: 1-2 hours
- Accessibility audit: 1 hour
- **Total:** 6-8 hours

---

## 🔗 Context Links (GitHub URLs)

**Required Reading:**
- Session 3 Design System: https://github.com/dannystocker/navidocs/blob/main/intelligence/session-3/agent-9-visual-design-system.md
- Session 2 Architecture: https://github.com/dannystocker/navidocs/blob/main/intelligence/session-2/session-2-architecture.md
- Complete Dossier: https://github.com/dannystocker/navidocs/blob/main/NAVIDOCS_COMPLETE_INTELLIGENCE_DOSSIER.md

**Design Assets:**
- Logo & Branding: (if available on GitHub)
- Icon Library: (specify Lucide or Heroicons)

---

**Generated:** 2025-11-14
**By:** Claude Sonnet 4.5 (InfraFabric S² coordination framework)
**Citation:** if://mission/navidocs-s2-frontend-swarm-2025-11-14
