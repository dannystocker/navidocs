# NaviDocs Document Library Navigation & Organization - Multi-Stakeholder Debate

**Date:** 2025-10-23
**Reference Case:** Liliane1 Archive (29 files, 9 categories)
**Participants:** 6 stakeholder perspectives
**Duration:** 120 minutes (20 min per stakeholder + synthesis)
**Goal:** Define navigation, organization, and information architecture for document library

---

## Context: The Liliane1 Archive

**Real-World Dataset:**
- **Total Files:** 29 documents
- **File Types:** PDFs (manuals, contracts, invoices), Images (photos, scanned receipts), Spreadsheets (delivery logs, expense tracking)
- **Document Categories:** 9 distinct categories
  - Insurance & Registration (3 files - **essential**)
  - Owner's Manual (1 file - 400+ pages)
  - Systems Manuals (8 files - engine, electrical, navigation)
  - Service Records (6 files - maintenance logs, invoices)
  - Purchase Documents (4 files - contracts, delivery docs)
  - Safety Equipment (2 files - life raft, EPIRB)
  - Warranties & Receipts (3 files - component warranties)
  - Inspection Reports (1 file - survey report)
  - Photos & Media (1 file - boat condition photos)

**Current Pain Points:**
- No visual hierarchy - essential docs (insurance) buried among photos
- Search is the ONLY navigation method (no browsing by category)
- PDFs, images, and spreadsheets displayed identically
- No "quick access" for frequently needed docs (engine manual)
- Documents fit multiple categories (engine warranty = warranty + service + purchase)

---

## Debate Structure

Each stakeholder will present their ideal navigation model based on their mental model and access patterns. The goal is to synthesize a unified navigation system that serves all user types.

---

## Stakeholder 1: Boat Owner (Casual User)

**Profile:** Owns Liliane1, uses app 2-3 times per month, not tech-savvy, prioritizes simplicity

### Mental Model

"I think of my boat like a house. I have important papers (insurance, registration), manuals for stuff (engine, electronics), and receipts for things I bought. When something breaks, I need the manual FAST."

### Navigation Preferences

**1. Dashboard with "Essential Documents" Pinned**
```
┌─────────────────────────────────────┐
│ LILIANE1 - Document Library         │
├─────────────────────────────────────┤
│ 📌 ESSENTIAL DOCUMENTS              │
│ ├─ Insurance Policy (exp: 2025-12)  │
│ ├─ Registration (exp: 2026-03)      │
│ └─ Safety Certificate               │
├─────────────────────────────────────┤
│ 🔍 Search all documents...          │
├─────────────────────────────────────┤
│ 📂 Browse by Category               │
│ ├─ Manuals & Guides (9)             │
│ ├─ Service Records (6)              │
│ ├─ Warranties & Receipts (3)        │
│ ├─ Purchase Documents (4)           │
│ └─ Photos & Media (1)               │
└─────────────────────────────────────┘
```

**2. Category-Based Browsing (Not Folder Hierarchy)**
- "I don't want nested folders. Too confusing."
- "Categories should match how I think: Manuals, Receipts, Service History"
- "Don't make me remember if the engine manual is in 'Propulsion' or 'Maintenance' - just show me all manuals"

**3. Visual Indicators for Importance**
- Pin icon for essential docs
- Red badge for expiring docs (insurance expires in 30 days)
- Star icon for frequently accessed (engine manual)

**4. Role-Specific Dashboard**
- "When I open the app, show me what MATTERS TO ME:"
  - Expiring insurance/registration
  - Upcoming maintenance (from service logs)
  - Recently uploaded docs
- "Captain can have a different dashboard - he cares about manuals, I care about insurance"

### Pain Points with Current Systems

- "I uploaded 29 files. Now what? Just a big list?"
- "I searched for 'insurance' - got 3 results. Which one is the current policy?"
- "I need the engine manual. Do I search 'engine' or 'Volvo' or 'propulsion'? Too hard."
- "My wife asked for the purchase contract. I have no idea which file that is."

### Feature Requests

- [ ] **Essential docs section** at top of library (owner can pin 3-5 critical docs)
- [ ] **Visual badges** (Expiring soon, Frequently accessed, Recently added)
- [ ] **"Owner Dashboard"** showing status of essential docs
- [ ] **Category browsing** (flat categories, no nested folders)
- [ ] **Smart suggestions** ("Based on your search for 'engine', you might want: Engine Manual, Engine Warranty")

### Quote

> "I don't want to organize documents. I want the app to organize them for me. Show me what's important, and get out of my way."

---

## Stakeholder 2: Yacht Captain (Power User)

**Profile:** Uses app daily, needs instant access to manuals during emergencies, works offline 50% of the time

### Mental Model

"I organize by SYSTEM (electrical, plumbing, navigation) and by URGENCY (emergency procedures vs reference manuals). When a bilge alarm goes off at 2 AM, I need the bilge manual in 10 seconds, not 10 minutes."

### Navigation Preferences

**1. System-Based Navigation (Primary)**
```
┌─────────────────────────────────────┐
│ LILIANE1 - Captain View             │
├─────────────────────────────────────┤
│ ⚡ BY SYSTEM                         │
│ ├─ 🔌 Electrical (3 docs)           │
│ │  ├─ Shore Power Manual            │
│ │  ├─ Battery System Guide          │
│ │  └─ Generator Manual               │
│ ├─ 🚰 Plumbing (2 docs)             │
│ │  ├─ Fresh Water System            │
│ │  └─ Bilge Pump Manual              │
│ ├─ 🧭 Navigation (4 docs)           │
│ │  ├─ Chartplotter Manual           │
│ │  ├─ Radar Manual                   │
│ │  ├─ Autopilot Manual               │
│ │  └─ VHF Radio Manual               │
│ ├─ ⚙️ Propulsion (2 docs)           │
│ │  ├─ Volvo D4-300 Engine Manual    │
│ │  └─ Transmission Manual            │
│ └─ 🛡️ Safety (2 docs)              │
│    ├─ Life Raft Service Manual      │
│    └─ EPIRB Registration             │
├─────────────────────────────────────┤
│ 🚨 QUICK ACCESS (Offline Cached)    │
│ ├─ Emergency Procedures (Owner Man) │
│ ├─ Bilge Troubleshooting            │
│ └─ Engine Diagnostics                │
└─────────────────────────────────────┘
```

**2. Quick Access Patterns**
- "Bookmark critical pages within manuals (e.g., Owner's Manual page 87: Bilge Alarm)"
- "Pre-cache entire manuals for offline use (no cell signal at dock)"
- "Recently viewed docs at top (I looked at the engine manual yesterday, will probably need it again today)"

**3. Multi-Category Tagging**
- "Engine manual is BOTH Propulsion AND Maintenance. Don't make me choose."
- "Service invoice for bilge pump is Service Record AND Plumbing. Show it in both places."

**4. Search with Context**
- "Search 'bilge' should prioritize troubleshooting sections, not warranty receipts"
- "Show me the PAGE NUMBER where the match is (Owner's Manual p. 87), not just the document"

### Pain Points with Current Systems

- "Search returned 8 results for 'battery'. I need the MANUAL, not the warranty receipt or purchase invoice. Why can't it guess?"
- "I bookmarked a page in the engine manual on my phone. Now I'm on my tablet - bookmark is gone."
- "No cell signal at the dock. App says 'Loading...' - useless."
- "I know the bilge alarm procedure is on page 87 of the owner's manual. Search doesn't show page numbers."

### Feature Requests

- [ ] **System-based category filters** (primary navigation for captains)
- [ ] **Offline mode** with manual pre-caching (entire docs, not just search index)
- [ ] **Bookmarks synced across devices** (bookmark page 87 on phone, see it on tablet)
- [ ] **Page-level search results** ("Owner's Manual, p. 87: Bilge Alarm Troubleshooting")
- [ ] **Recently viewed** section (last 5 docs, auto-sorted by timestamp)
- [ ] **Quick access sidebar** (drag any doc to sidebar for instant access)
- [ ] **Multi-category tagging** (one doc can appear in multiple category views)

### Quote

> "When the bilge alarm goes off, I don't have time to navigate folders. Give me a search bar, a system filter, and offline access. That's all I need."

---

## Stakeholder 3: UX Designer (User Advocate)

**Profile:** Expert in information architecture, accessibility, and cognitive load reduction

### Mental Model

"Users don't organize documents - they FIND documents. Navigation should match user intent: 'I need X because Y is happening.' The interface should predict intent and reduce clicks."

### Navigation Principles

**1. Progressive Disclosure (Don't Overwhelm)**
```
Level 1: High-level categories (3-5 options max)
├─ Manuals & Guides
├─ Insurance & Compliance
└─ Service & Maintenance

Level 2: Sub-categories (within each top-level)
Manuals & Guides:
├─ Owner's Manual
├─ Systems (Electrical, Plumbing, etc.)
└─ Component Manuals (Engine, Generator, etc.)

Level 3: Individual documents
└─ Volvo D4-300 Engine Manual (PDF, 248 pages)
```

**2. Multiple Entry Points (Users Think Differently)**
- **By Category:** Insurance, Manuals, Service Records
- **By System:** Electrical, Plumbing, Navigation
- **By Date:** Recently added, Recently viewed, Oldest first
- **By Importance:** Essential, Frequently accessed, Archived
- **By File Type:** PDFs, Images, Spreadsheets

**3. Visual Hierarchy (Importance-Based Layout)**
```
┌──────────────────────────────────────────┐
│ 🟥 NEEDS ATTENTION                       │
│ ├─ Insurance expires in 15 days          │
│ └─ Engine service overdue (2 weeks)      │
├──────────────────────────────────────────┤
│ 📌 ESSENTIAL DOCUMENTS                   │
│ ├─ [PDF] Insurance Policy                │
│ ├─ [PDF] Registration                    │
│ └─ [PDF] Safety Certificate              │
├──────────────────────────────────────────┤
│ ⭐ FREQUENTLY ACCESSED                   │
│ ├─ [PDF] Engine Manual (opened 12x)      │
│ ├─ [PDF] Owner's Manual (opened 8x)      │
│ └─ [XLS] Expense Tracking                │
├──────────────────────────────────────────┤
│ 📁 ALL DOCUMENTS (29)                    │
│ ├─ View by Category                      │
│ ├─ View by System                        │
│ └─ View by Date                          │
└──────────────────────────────────────────┘
```

**4. File Type-Specific Display**
- **PDFs:** Thumbnail of first page + page count
- **Images:** Full thumbnail preview + dimensions
- **Spreadsheets:** Grid icon + row/column count
- **Multi-page PDFs:** Carousel preview (first 3 pages)

**5. Smart Filters (Not Manual Tags)**
- "Auto-detect document type from OCR content (invoice → Service Records)"
- "Auto-suggest system tags (mentions 'bilge' → Plumbing tag)"
- "Learn from user behavior (user always opens engine manual after searching 'Volvo' → suggest it first)"

### Pain Points with Generic File Browsers

- "Dropbox/Google Drive treat all files the same. A 400-page manual should not look like a 1-page receipt."
- "No visual hierarchy - important docs buried in chronological list"
- "Search is keyword-only. Users search with natural language: 'how do I fix the bilge' not 'bilge manual'"
- "No role-based views - boat owner sees same interface as captain (different mental models)"

### Feature Requests

- [ ] **Importance-based sorting** (essential → frequently accessed → recent → archived)
- [ ] **File type-specific previews** (PDFs show page 1 thumbnail, images show full preview)
- [ ] **Multiple view modes** (grid view for images, list view for PDFs, table view for service records)
- [ ] **Auto-categorization** (OCR-based, suggest categories during upload)
- [ ] **Smart search** (natural language: "how do I winterize" → finds Owner's Manual p. 287)
- [ ] **Adaptive interface** (learn user patterns, show relevant docs first)
- [ ] **Accessibility** (keyboard navigation, screen reader support, high contrast mode)

### Quote

> "Good navigation is invisible. Users shouldn't think about HOW to find documents - they should just find them."

---

## Stakeholder 4: Developer (Technical Feasibility)

**Profile:** Full-stack engineer, concerned with performance, scalability, and maintainability

### Mental Model

"Navigation is a query interface. Users construct filters (category + system + file type + date range), and the system returns sorted results. The UI is sugar on top of Meilisearch queries."

### Technical Architecture

**1. Meilisearch-Powered Navigation**
```javascript
// User selects: Category = "Manuals", System = "Electrical"
const results = await meilisearch.search('', {
  filter: [
    'categories = "Manuals"',
    'systems = "Electrical"'
  ],
  sort: ['priority:desc', 'accessCount:desc', 'createdAt:desc'],
  facets: ['categories', 'systems', 'fileType', 'priority']
});

// UI renders:
// - 3 results (manuals matching filters)
// - Facet counts (Plumbing: 2, Navigation: 4, etc.)
```

**2. Faceted Navigation (Filter Drill-Down)**
```
All Documents (29)
├─ Category: Manuals (9) ← User clicks
│  └─ System: Electrical (3) ← User clicks
│     └─ Results: 3 docs
│        ├─ Shore Power Manual
│        ├─ Battery System Guide
│        └─ Generator Manual
└─ Facet Summary:
   ├─ File Type: PDF (3)
   ├─ Priority: Normal (2), Critical (1)
   └─ Date Range: 2024 (3)
```

**3. Performance Considerations**
- **Infinite scroll vs Pagination:** Pagination (faster initial load, better UX for large libraries)
- **Thumbnail generation:** Lazy load thumbnails (generate on-demand, cache for 30 days)
- **Offline sync:** IndexedDB cache of metadata + selected full docs (user chooses which to cache)
- **Search latency:** < 50ms for faceted navigation (Meilisearch handles this easily)

**4. Multi-Category Tagging (Technical Solution)**
```javascript
// Document schema
{
  "id": "doc_engine_manual",
  "title": "Volvo D4-300 Engine Manual",
  "categories": ["Manuals", "Propulsion"], // Array, not string
  "systems": ["Propulsion", "Electrical"], // Multi-system tagging
  "priority": "frequently-accessed",
  "fileType": "pdf"
}

// Query: "Show me Propulsion docs"
// Returns: Engine manual (has "Propulsion" in both categories AND systems)
```

**5. Role-Based Views (Same Data, Different Filters)**
```javascript
// Owner view: Pre-filter to show essential docs first
const ownerQuery = {
  sort: ['priority:desc'],
  filter: 'priority IN ["essential", "frequently-accessed"]'
};

// Captain view: Pre-filter to show manuals, group by system
const captainQuery = {
  facets: ['systems'],
  filter: 'categories = "Manuals"'
};
```

### Pain Points with Over-Engineered Solutions

- "Nested folder hierarchies require recursive queries (slow)"
- "Manual tagging is labor-intensive and inconsistent"
- "Client-side filtering (filter 29 docs in JavaScript) doesn't scale to 1,000 docs"
- "Real-time collaboration (like Google Docs) is complex - out of scope for v1"

### Feature Requests

- [ ] **Faceted search with Meilisearch** (category + system + file type filters)
- [ ] **Lazy-loaded thumbnails** (generate on-demand, cache in CDN)
- [ ] **Offline sync with IndexedDB** (cache metadata + selected docs)
- [ ] **Pre-built query templates** (owner view, captain view, accountant view)
- [ ] **Auto-tagging with OCR** (extract "Volvo", "engine", "manual" → auto-suggest tags)
- [ ] **API-first design** (REST API for queries, enables mobile app + web app)

### Quote

> "Navigation is just filtered search with a pretty UI. Build the search layer first, then skin it with category buttons and filters."

---

## Stakeholder 5: Marina Manager (Fleet-Scale User)

**Profile:** Manages 200 boats, 2,000+ documents across multiple owners, needs bulk operations and delegation

### Mental Model

"I manage documents for 200 boats. I need to see ALL insurance policies expiring in the next 30 days, across all boats. I need to delegate tasks: 'Captain, update the engine manual for Boat 17.' I need audit trails: 'Who uploaded the new insurance policy for Boat 42?'"

### Navigation Preferences

**1. Fleet-Level Dashboard**
```
┌──────────────────────────────────────────┐
│ MARINA DASHBOARD - 200 Boats            │
├──────────────────────────────────────────┤
│ 🚨 ATTENTION NEEDED (37)                 │
│ ├─ Insurance expiring (12 boats)         │
│ ├─ Registration overdue (8 boats)        │
│ ├─ Service overdue (17 boats)            │
│ └─ Missing documents (23 boats)          │
├──────────────────────────────────────────┤
│ 📊 FLEET OVERVIEW                        │
│ ├─ Total Documents: 2,143                │
│ ├─ Uploaded this week: 47                │
│ ├─ Pending review: 12                    │
│ └─ Storage used: 23 GB / 100 GB          │
├──────────────────────────────────────────┤
│ 🔍 SEARCH ACROSS ALL BOATS               │
│ ├─ Filter by: Boat, Category, System     │
│ └─ Bulk actions: Download, Archive, Tag  │
├──────────────────────────────────────────┤
│ 📋 RECENT ACTIVITY (All Boats)           │
│ ├─ 2h ago: Boat 17 - Engine manual added │
│ ├─ 5h ago: Boat 42 - Insurance updated   │
│ └─ 1d ago: Boat 99 - Service log added   │
└──────────────────────────────────────────┘
```

**2. Bulk Operations**
- "Select all boats → filter 'insurance policies' → export to CSV"
- "Select 12 boats with expiring insurance → send reminder to owners"
- "Archive all service records older than 5 years (except compliance docs)"

**3. Delegation & Permissions**
- "Captain has access to Boat 17 manuals (not insurance or purchase docs)"
- "Owner can view ALL docs for their boat, but can't delete"
- "Accountant can view service invoices across all boats, but not manuals"

**4. Audit Trail**
- "Who uploaded the new insurance policy for Boat 42? (Answer: Owner, 2024-10-18 3:42 PM)"
- "When was the engine manual last updated? (Answer: Captain, 2024-09-12)"
- "Show me all changes to Boat 17 docs in the last 30 days"

### Pain Points with Single-Boat Systems

- "I manage 200 boats. I can't open 200 separate apps to check insurance expiration."
- "No way to compare boats: 'Which boats have Volvo D4 engines?' requires manual checking."
- "Can't delegate: 'Captain, update Boat 17 manuals' - he needs separate login, separate permissions."
- "No audit trail: Owner disputes we uploaded their insurance - no proof of who/when."

### Feature Requests

- [ ] **Fleet dashboard** (overview across all boats)
- [ ] **Cross-boat search** (find all boats with Volvo D4 engine manuals)
- [ ] **Bulk operations** (select multiple boats, download/archive/tag documents)
- [ ] **Role-based permissions** (captain, owner, accountant see different views)
- [ ] **Audit logs** (who uploaded/edited/deleted what, when)
- [ ] **Delegation workflow** (assign task: "Captain, upload engine manual for Boat 17")
- [ ] **Compliance dashboard** (all boats with expiring insurance, missing safety certs)

### Quote

> "Managing one boat is easy. Managing 200 boats requires automation, delegation, and visibility. Give me a fleet view, or I'll stick to spreadsheets."

---

## Stakeholder 6: Accountant (Compliance & Billing)

**Profile:** Handles expense tracking, warranty claims, tax compliance, needs structured data and export capabilities

### Mental Model

"Documents are DATA. I need to extract: purchase date, amount, vendor, warranty end date. Then I need to export to Excel/QuickBooks. I need to prove expenses for tax audits. I need to track warranty expirations to save clients money."

### Navigation Preferences

**1. Structured Data View (Table Format)**
```
┌─────────────────────────────────────────────────────────────┐
│ SERVICE RECORDS - Liliane1 (6 documents)                   │
├─────────┬────────────┬─────────┬─────────┬─────────────────┤
│ Date    │ Vendor     │ Amount  │ System  │ Document        │
├─────────┼────────────┼─────────┼─────────┼─────────────────┤
│ 2024-09 │ ABC Marine │ $2,400  │ Engine  │ Engine Service  │
│ 2024-08 │ XYZ Elect. │ $850    │ Elect.  │ Battery Replace │
│ 2024-07 │ DEF Repair │ $1,200  │ HVAC    │ AC Repair       │
│ 2024-06 │ ABC Marine │ $450    │ Plumb.  │ Bilge Pump Fix  │
│ 2024-05 │ GHI Parts  │ $320    │ Nav.    │ Chartplotter Up │
│ 2024-04 │ JKL Clean  │ $600    │ N/A     │ Detailing       │
├─────────┴────────────┴─────────┴─────────┴─────────────────┤
│ TOTAL: $5,820                            Export to Excel ↓│
└─────────────────────────────────────────────────────────────┘
```

**2. Warranty Expiration Tracking**
```
┌─────────────────────────────────────────────────────────────┐
│ WARRANTY TRACKER - Liliane1 (3 warranties)                 │
├─────────────┬───────────┬──────────────┬───────────────────┤
│ Equipment   │ Purchase  │ Warranty Exp │ Status            │
├─────────────┼───────────┼──────────────┼───────────────────┤
│ Volvo D4    │ 2022-03   │ 2025-03      │ ⚠️ 4 months left │
│ Generator   │ 2023-01   │ 2026-01      │ ✅ Active         │
│ Water Heater│ 2021-06   │ 2024-06      │ 🔴 EXPIRED       │
└─────────────┴───────────┴──────────────┴───────────────────┘
```

**3. Expense Categorization (Tax Compliance)**
- "Categorize service records: Maintenance (deductible), Capital Improvements (depreciate), Operating Expenses (fully deductible)"
- "Export year-end report: All expenses by category, for CPA"

**4. Receipt OCR & Auto-Extract**
- "Upload receipt photo → auto-extract: Date, Vendor, Amount, Item"
- "Link receipt to equipment: 'Battery receipt → Battery in Equipment DB'"

### Pain Points with Unstructured Documents

- "Client asks: 'How much did I spend on engine maintenance in 2024?' I have to open 12 PDFs, manually add up invoices."
- "Warranty claim denied because we couldn't find purchase receipt (it's in a PDF somewhere)."
- "Tax audit: IRS asks for proof of $15,000 in boat expenses. I have 47 PDFs in random order."
- "Can't export to QuickBooks - have to manually re-enter every invoice."

### Feature Requests

- [ ] **Table view for service records** (sortable by date, vendor, amount)
- [ ] **OCR-based data extraction** (invoice → date, vendor, amount, auto-populate table)
- [ ] **Warranty expiration alerts** (email 30 days before warranty ends)
- [ ] **Export to CSV/Excel** (all service records, all warranties, all expenses)
- [ ] **QuickBooks integration** (auto-sync service invoices to QuickBooks)
- [ ] **Tax category tagging** (Maintenance, Capital Improvement, Operating Expense)
- [ ] **Year-end expense report** (auto-generate PDF summary for CPA)

### Quote

> "Documents are just containers for data. If I can't extract, sort, and export that data, it's useless for accounting."

---

## SYNTHESIS: Unified Navigation Architecture

After hearing all 6 perspectives, here's the consensus navigation model that serves all stakeholders:

### Core Principles

1. **Multiple Navigation Paths** (users think differently)
   - Browse by Category (owner preference)
   - Browse by System (captain preference)
   - Browse by Importance (UX designer preference)
   - Browse by Date (all users)
   - Search (all users)

2. **Visual Hierarchy** (importance-based layout)
   - Essential documents (top)
   - Frequently accessed (middle)
   - All documents (bottom)

3. **File Type-Specific Display**
   - PDFs: Thumbnail + page count
   - Images: Full preview
   - Spreadsheets: Grid icon + row count

4. **Multi-Category Tagging** (one doc, multiple views)
   - Engine manual appears in: Manuals, Propulsion, Electrical

5. **Role-Based Dashboards** (same data, different views)
   - Owner: Insurance status, expense summary
   - Captain: System manuals, quick access
   - Manager: Fleet overview, delegation
   - Accountant: Table view, expense tracking

---

## Recommended Wireframes

### Wireframe 1: Owner Dashboard (Default View)

```
┌────────────────────────────────────────────────────────────┐
│ LILIANE1 - Document Library                               │
│ [Owner View ▼] [Search...]                    [+ Upload]  │
├────────────────────────────────────────────────────────────┤
│ 🚨 NEEDS ATTENTION (2)                                     │
│ ├─ [!] Insurance Policy expires in 45 days                 │
│ └─ [!] Engine service overdue by 2 weeks                   │
├────────────────────────────────────────────────────────────┤
│ 📌 ESSENTIAL DOCUMENTS (3)                                 │
│ ┌────────┐  ┌────────┐  ┌────────┐                        │
│ │  [📄]  │  │  [📄]  │  │  [📄]  │                        │
│ │Insurance│  │Registr.│  │ Safety │                        │
│ │Policy   │  │        │  │ Cert.  │                        │
│ │exp:12/25│  │exp:3/26│  │        │                        │
│ └────────┘  └────────┘  └────────┘                        │
├────────────────────────────────────────────────────────────┤
│ ⭐ FREQUENTLY ACCESSED (3)                                 │
│ ├─ [📖] Engine Manual (Volvo D4-300) - opened 12x          │
│ ├─ [📖] Owner's Manual (400 pages) - opened 8x             │
│ └─ [📊] Expense Tracker 2024 - opened 5x                   │
├────────────────────────────────────────────────────────────┤
│ 📁 BROWSE ALL DOCUMENTS (29)                               │
│ ├─ [By Category ▼] [By System] [By Date] [By File Type]   │
│ │                                                           │
│ │  Manuals & Guides (9)                                    │
│ │  ├─ [📖] Owner's Manual - 400 pages - Added Oct 2024     │
│ │  ├─ [📖] Engine Manual (Volvo D4-300) - 248 pages        │
│ │  └─ [📖] Chartplotter Manual - 156 pages                 │
│ │                                                           │
│ │  Service Records (6)                                     │
│ │  ├─ [📄] Engine Service Invoice - $2,400 - Sep 2024     │
│ │  ├─ [📄] Battery Replacement - $850 - Aug 2024          │
│ │  └─ [📄] AC Repair - $1,200 - Jul 2024                  │
│ │                                                           │
│ │  Warranties & Receipts (3)                               │
│ │  Purchase Documents (4)                                  │
│ │  Photos & Media (1)                                      │
│ └─                                                          │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Essential docs pinned at top with expiration dates
- Visual badges (!, ⭐, 📌) for priority
- Expandable categories (not nested folders)
- Thumbnail previews for visual scanning

---

### Wireframe 2: Captain Dashboard (System View)

```
┌────────────────────────────────────────────────────────────┐
│ LILIANE1 - Document Library                               │
│ [Captain View ▼] [Search manuals...]          [Offline ✓] │
├────────────────────────────────────────────────────────────┤
│ 🚨 QUICK ACCESS (Offline Cached)                           │
│ ├─ [📖] Emergency Procedures (Owner's Manual p. 12-18)     │
│ ├─ [📖] Bilge Troubleshooting (Owner's Manual p. 87)       │
│ └─ [📖] Engine Diagnostics (Volvo Manual p. 45-67)         │
├────────────────────────────────────────────────────────────┤
│ ⚙️ BROWSE BY SYSTEM                                       │
│                                                            │
│ 🔌 ELECTRICAL (3 manuals)                                  │
│ ├─ [📖] Shore Power System - 45 pages                      │
│ ├─ [📖] Battery System Guide - 32 pages                    │
│ └─ [📖] Generator Manual - 178 pages                       │
│                                                            │
│ 🚰 PLUMBING (2 manuals)                                    │
│ ├─ [📖] Fresh Water System - 28 pages                      │
│ └─ [📖] Bilge Pump Manual - 18 pages                       │
│                                                            │
│ 🧭 NAVIGATION (4 manuals)                                  │
│ ├─ [📖] Chartplotter Manual (Garmin) - 156 pages           │
│ ├─ [📖] Radar Manual (Furuno) - 89 pages                   │
│ ├─ [📖] Autopilot Manual (Simrad) - 67 pages               │
│ └─ [📖] VHF Radio Manual (Icom) - 45 pages                 │
│                                                            │
│ ⚙️ PROPULSION (2 manuals)                                 │
│ ├─ [📖] Volvo D4-300 Engine Manual - 248 pages             │
│ └─ [📖] Transmission Manual - 89 pages                     │
│                                                            │
│ 🛡️ SAFETY (2 manuals)                                     │
│ ├─ [📄] Life Raft Service Manual - 12 pages               │
│ └─ [📄] EPIRB Registration - 2 pages                       │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ 🕐 RECENTLY VIEWED                                         │
│ ├─ Engine Manual (2 hours ago)                            │
│ └─ Bilge Troubleshooting (yesterday)                      │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- System-based grouping (primary navigation for captains)
- Quick access to bookmarked sections (within manuals)
- Offline indicator (entire manuals cached locally)
- Recently viewed history

---

### Wireframe 3: Search Results (Page-Level Matches)

```
┌────────────────────────────────────────────────────────────┐
│ LILIANE1 - Search: "bilge pump"                           │
│ [🔍 bilge pump                                  ] [Search] │
├────────────────────────────────────────────────────────────┤
│ 8 results found                                            │
│                                                            │
│ FILTERS ▼                                                  │
│ ☑ Manuals (5)                                             │
│ ☑ Service Records (2)                                     │
│ ☐ Warranties (1)                                          │
│ ───────────────                                           │
│ ☑ Plumbing (6)                                            │
│ ☐ Electrical (2)                                          │
│ ───────────────                                           │
│ Sort by: [Relevance ▼]                                    │
├────────────────────────────────────────────────────────────┤
│ RESULTS:                                                   │
│                                                            │
│ 1. 📖 Owner's Manual - Page 87                             │
│    "8.4 Bilge Pump System - Troubleshooting"              │
│    ...alarm goes off, check the bilge pump circuit        │
│    breaker (panel C, position 12). If breaker is...       │
│    [View Page 87] [View Full Document]                    │
│                                                            │
│ 2. 📖 Bilge Pump Manual - Page 3                           │
│    "Installation and Wiring"                               │
│    ...the bilge pump is located in the aft compartment... │
│    [View Page 3] [View Full Document]                     │
│                                                            │
│ 3. 📄 Service Invoice - Bilge Pump Repair                  │
│    "ABC Marine - June 2024 - $450"                         │
│    Replaced bilge pump float switch, tested system...     │
│    [View Invoice]                                          │
│                                                            │
│ 4. 📖 Owner's Manual - Page 45                             │
│    "6.2 Daily Checks - Bilge Inspection"                  │
│    ...check the bilge for water accumulation daily...     │
│    [View Page 45]                                          │
│                                                            │
│ ... (4 more results)                                       │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Page-level search results (not just document-level)
- Faceted filters (by category, system)
- Snippet preview with highlighted keywords
- Direct link to specific page (not just document)

---

### Wireframe 4: Document Detail View (PDF with Multi-Category Tags)

```
┌────────────────────────────────────────────────────────────┐
│ ← Back to Library                                          │
├────────────────────────────────────────────────────────────┤
│ 📖 Volvo D4-300 Engine Manual                              │
│ 248 pages | PDF | 12.3 MB | Added: Oct 2024               │
│                                                            │
│ CATEGORIES: [Manuals] [Propulsion] [Maintenance]          │
│ SYSTEMS: [Propulsion] [Electrical] [Cooling]              │
│ TAGS: #engine #volvo #troubleshooting                      │
│                                                            │
│ ⭐ Frequently Accessed (opened 12 times)                   │
│ 📥 Cached for Offline Use                                  │
│ 📌 [Pin as Essential] [Remove from Quick Access]           │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ DOCUMENT PREVIEW:                                          │
│                                                            │
│ [Page 1 thumbnail] [Page 2 thumbnail] [Page 3 thumbnail]  │
│                                                            │
│ [PDF Viewer with navigation controls]                     │
│ Pages: [< 1 / 248 >]                                       │
│                                                            │
│ BOOKMARKS (3):                                             │
│ ├─ Page 45: Engine Start Procedure                        │
│ ├─ Page 67: Diagnostics & Troubleshooting                 │
│ └─ Page 203: Maintenance Schedule                         │
│                                                            │
│ RELATED DOCUMENTS:                                         │
│ ├─ Engine Service Invoice (Sep 2024)                      │
│ ├─ Engine Warranty (expires Mar 2025)                     │
│ └─ Transmission Manual (linked system)                    │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ METADATA:                                                  │
│ Manufacturer: Volvo Penta                                  │
│ Model: D4-300                                              │
│ Serial Number: VP-2024-12345                               │
│ Warranty: Expires Mar 2025 (4 months left)                │
│                                                            │
│ [Download PDF] [Share] [Print] [Edit Metadata]            │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Multi-category tags (visible, editable)
- Bookmarks (page-level, synced across devices)
- Related documents (auto-suggested based on system/category)
- Metadata sidebar (manufacturer, model, warranty status)

---

### Wireframe 5: Accountant View (Table Format for Service Records)

```
┌────────────────────────────────────────────────────────────┐
│ LILIANE1 - Service Records                                │
│ [Accountant View ▼] [Export to Excel ↓]                   │
├────────────────────────────────────────────────────────────┤
│ SERVICE RECORDS - 6 documents                              │
│                                                            │
│ Date Range: [Jan 2024 ▼] to [Oct 2024 ▼] [Filter]        │
│ Systems: [All ▼] | Categories: [All ▼]                    │
│                                                            │
├─────────┬─────────────┬─────────┬──────────┬──────────────┤
│ Date    │ Vendor      │ Amount  │ System   │ Category     │
├─────────┼─────────────┼─────────┼──────────┼──────────────┤
│ 2024-09 │ ABC Marine  │ $2,400  │ Engine   │ Maintenance  │
│ 🔗 View Invoice | 🏷️ Tax: Deductible                     │
│                                                            │
│ 2024-08 │ XYZ Electr. │ $850    │ Electr.  │ Repair       │
│ 🔗 View Invoice | 🏷️ Tax: Deductible                     │
│                                                            │
│ 2024-07 │ DEF Repair  │ $1,200  │ HVAC     │ Repair       │
│ 🔗 View Invoice | 🏷️ Tax: Deductible                     │
│                                                            │
│ 2024-06 │ ABC Marine  │ $450    │ Plumbing │ Repair       │
│ 🔗 View Invoice | 🏷️ Tax: Deductible                     │
│                                                            │
│ 2024-05 │ GHI Parts   │ $320    │ Navigat. │ Upgrade      │
│ 🔗 View Invoice | 🏷️ Tax: Capital Improvement             │
│                                                            │
│ 2024-04 │ JKL Clean   │ $600    │ N/A      │ Detailing    │
│ 🔗 View Invoice | 🏷️ Tax: Operating Expense               │
├─────────┴─────────────┴─────────┴──────────┴──────────────┤
│ TOTAL: $5,820                                             │
│ Deductible: $4,900 | Capital: $320 | Operating: $600      │
│                                                            │
│ [Export to CSV] [Export to QuickBooks] [Generate Report]  │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Table view (sortable by date, vendor, amount)
- Tax category tags (auto-suggested, editable)
- Totals and breakdowns (by category, by tax treatment)
- Export to CSV/QuickBooks

---

### Wireframe 6: Fleet Dashboard (Marina Manager View)

```
┌────────────────────────────────────────────────────────────┐
│ MARINA DASHBOARD - All Boats (200)                        │
│ [Fleet View ▼] [Search across all boats...]               │
├────────────────────────────────────────────────────────────┤
│ 🚨 ATTENTION NEEDED (37 boats)                             │
│                                                            │
│ Insurance Expiring (12 boats):                             │
│ ├─ Liliane1 - Insurance exp: 45 days                       │
│ ├─ Sea Breeze - Insurance exp: 30 days ⚠️                 │
│ ├─ ... (10 more)                                           │
│                                                            │
│ Registration Overdue (8 boats):                            │
│ ├─ Ocean Star - Registration exp: 15 days ago 🔴          │
│ ├─ ... (7 more)                                            │
│                                                            │
│ Service Overdue (17 boats):                                │
│ ├─ Liliane1 - Engine service overdue by 2 weeks           │
│ ├─ ... (16 more)                                           │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ 📊 FLEET OVERVIEW                                          │
│ ├─ Total Documents: 2,143                                 │
│ ├─ Uploaded this week: 47                                 │
│ ├─ Pending review: 12                                     │
│ └─ Storage used: 23 GB / 100 GB                           │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ 🔍 SEARCH ACROSS ALL BOATS                                 │
│ [Search: "Volvo D4 engine manual"             ] [Search]  │
│                                                            │
│ 23 results across 18 boats:                                │
│ ├─ Liliane1 - Volvo D4-300 Engine Manual                  │
│ ├─ Sea Breeze - Volvo D4-300 Engine Manual (same doc)     │
│ ├─ Ocean Star - Volvo D6-350 Engine Manual                │
│ └─ ... (20 more)                                           │
│                                                            │
│ [Bulk Actions: Download All | Archive | Tag]              │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ 📋 RECENT ACTIVITY (All Boats)                             │
│ ├─ 2h ago: Boat 17 - Engine manual added by Captain       │
│ ├─ 5h ago: Boat 42 - Insurance updated by Owner           │
│ └─ 1d ago: Boat 99 - Service log added by Manager         │
└────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Fleet-level overview (aggregate stats)
- Compliance dashboard (expiring/overdue across all boats)
- Cross-boat search (find all boats with X manual)
- Bulk operations (select multiple boats, download/tag/archive)
- Audit trail (who uploaded what, when)

---

## Priority Ranking of Features

### Phase 1: Core Navigation (v1.0 - MVP)

**Goal:** Enable basic browsing and search

- [ ] **Category-based navigation** (Manuals, Service Records, Warranties, etc.)
- [ ] **Search with filters** (by category, file type, date)
- [ ] **Essential docs section** (owner can pin 3-5 critical docs)
- [ ] **File type-specific previews** (PDF thumbnails, image previews, spreadsheet icons)
- [ ] **Document detail view** (metadata, preview, download)

**Estimated Dev Time:** 3-4 weeks
**Business Impact:** Enables basic library browsing (replaces Dropbox/Google Drive)

---

### Phase 2: Advanced Navigation (v1.1 - Q1 2026)

**Goal:** Multi-path navigation, role-based views

- [ ] **System-based navigation** (Electrical, Plumbing, Navigation, etc.)
- [ ] **Multi-category tagging** (one doc appears in multiple category views)
- [ ] **Role-based dashboards** (Owner view, Captain view, Accountant view)
- [ ] **Frequently accessed section** (auto-sort by access count)
- [ ] **Recently viewed history** (last 10 docs, across devices)
- [ ] **Page-level search results** (show page number, snippet, direct link)

**Estimated Dev Time:** 4-6 weeks
**Business Impact:** Improves findability, reduces search time by 50%

---

### Phase 3: Smart Navigation (v1.2 - Q2 2026)

**Goal:** Auto-categorization, smart suggestions

- [ ] **Auto-categorization with OCR** (suggest categories during upload)
- [ ] **Smart search suggestions** (based on user behavior)
- [ ] **Related documents** (auto-suggest based on system/category)
- [ ] **Bookmarks (page-level)** (synced across devices)
- [ ] **Offline mode** (cache selected docs for offline access)
- [ ] **Visual hierarchy** (importance-based sorting: essential → frequent → recent)

**Estimated Dev Time:** 6-8 weeks
**Business Impact:** Reduces manual tagging, improves discovery

---

### Phase 4: Fleet & Compliance (v1.3 - Q3 2026)

**Goal:** Multi-boat management, audit trails

- [ ] **Fleet dashboard** (cross-boat overview, compliance tracking)
- [ ] **Cross-boat search** (find all boats with X manual)
- [ ] **Bulk operations** (select multiple boats, download/tag/archive)
- [ ] **Role-based permissions** (captain, owner, accountant see different views)
- [ ] **Audit logs** (who uploaded/edited/deleted what, when)
- [ ] **Warranty expiration alerts** (email 30 days before expiry)

**Estimated Dev Time:** 6-8 weeks
**Business Impact:** Enables yacht management companies (Zen use case)

---

### Phase 5: Data Extraction & Export (v1.4 - Q4 2026)

**Goal:** Structured data, accounting integration

- [ ] **Table view for service records** (sortable by date, vendor, amount)
- [ ] **OCR-based data extraction** (invoice → auto-populate table)
- [ ] **Export to CSV/Excel** (all service records, warranties, expenses)
- [ ] **QuickBooks integration** (auto-sync service invoices)
- [ ] **Tax category tagging** (Maintenance, Capital Improvement, Operating)
- [ ] **Year-end expense report** (auto-generate PDF for CPA)

**Estimated Dev Time:** 8-10 weeks
**Business Impact:** Eliminates manual data entry, saves 10+ hours/month

---

## Information Architecture: Final Recommendations

### 1. Primary Navigation: Flat Categories (Not Nested Folders)

**Rationale:** Users don't think in strict hierarchies. Multi-category tagging allows one doc to appear in multiple places.

**Categories:**
```
📌 Essential Documents (user-defined, max 5)
⭐ Frequently Accessed (auto-sorted by access count)
📖 Manuals & Guides
   ├─ Owner's Manual
   ├─ Systems (Electrical, Plumbing, Navigation, Propulsion, HVAC, Safety)
   └─ Component Manuals (Engine, Generator, etc.)
📄 Insurance & Compliance
   ├─ Insurance Policies
   ├─ Registration
   ├─ Safety Certificates
   └─ Inspection Reports
🔧 Service & Maintenance
   ├─ Service Records (invoices, logs)
   ├─ Maintenance Schedules
   └─ Repair History
💰 Financial
   ├─ Purchase Documents (contracts, delivery docs)
   ├─ Warranties & Receipts
   └─ Expense Tracking
📸 Photos & Media
   ├─ Boat Photos
   ├─ Condition Reports (before/after)
   └─ Scanned Documents
```

---

### 2. Secondary Navigation: System-Based Filters (Captain View)

**Rationale:** Captains think in systems, not categories.

**Systems:**
```
🔌 Electrical
   ├─ Shore Power
   ├─ Battery Systems
   ├─ Generator
   ├─ Solar/Wind (if equipped)
   └─ Lighting

🚰 Plumbing
   ├─ Fresh Water
   ├─ Waste Water (Grey/Black)
   ├─ Bilge Pumps
   ├─ Water Heater
   └─ Desalination (if equipped)

🧭 Navigation
   ├─ Chartplotter
   ├─ Radar
   ├─ AIS
   ├─ VHF Radio
   └─ Autopilot

⚙️ Propulsion
   ├─ Engine
   ├─ Transmission
   ├─ Propeller
   ├─ Fuel System
   └─ Exhaust

❄️ HVAC
   ├─ Air Conditioning
   ├─ Heating
   └─ Ventilation

🛡️ Safety
   ├─ Life Raft
   ├─ EPIRB
   ├─ Fire Suppression
   └─ Emergency Equipment
```

---

### 3. Visual Hierarchy: Importance-Based Layout

**Rationale:** Not all documents are equal. Essential docs (insurance) should be more visible than reference docs (old photos).

**Hierarchy:**
```
Level 1: NEEDS ATTENTION (expiring, overdue, missing)
Level 2: ESSENTIAL (user-pinned, critical docs)
Level 3: FREQUENTLY ACCESSED (auto-sorted by usage)
Level 4: RECENT (uploaded in last 30 days)
Level 5: ALL DOCUMENTS (browse/search)
```

---

### 4. File Type-Specific Display

**Rationale:** PDFs, images, and spreadsheets have different use cases. Display should match.

**Display Modes:**

**PDFs (Manuals, Contracts):**
- Thumbnail of page 1
- Page count badge
- File size
- Preview carousel (first 3 pages)

**Images (Photos, Scanned Receipts):**
- Full thumbnail preview (larger than PDFs)
- Dimensions badge (1920x1080)
- Date taken (from EXIF data)

**Spreadsheets (Expense Tracking):**
- Grid icon (not thumbnail)
- Row/column count
- Last modified date
- Preview: First 5 rows visible

**Multi-Page PDFs (Owner's Manual):**
- Chapter navigation (if OCR detected headings)
- Bookmark list (user-created)
- Page jump (direct to page 87)

---

### 5. Multi-Organizational Schemes (Handle Overlapping Categories)

**Rationale:** A document can fit multiple categories (engine warranty = warranty + propulsion + financial).

**Solution: Multi-Category Tagging**

**Example: Engine Service Invoice**
```
Categories: [Service Records] [Financial]
Systems: [Propulsion] [Electrical]
Tags: #engine #volvo #maintenance #invoice
```

**User Experience:**
- Appears in "Service Records" category
- Appears in "Financial" category
- Appears in "Propulsion" system filter
- Appears in search for "engine", "Volvo", "maintenance", "invoice"

**Implementation:**
```javascript
// Meilisearch document
{
  "id": "doc_engine_invoice",
  "title": "Engine Service Invoice - $2,400",
  "categories": ["Service Records", "Financial"],
  "systems": ["Propulsion", "Electrical"],
  "tags": ["engine", "volvo", "maintenance", "invoice"]
}

// Query: "Show me Service Records"
filter: 'categories = "Service Records"'
// Result: Engine invoice appears

// Query: "Show me Propulsion docs"
filter: 'systems = "Propulsion"'
// Result: Engine invoice appears (same doc, different filter)
```

---

### 6. User Mental Models: Ethnographic Insights

**Boat Owners:**
- Think in "important papers" vs "manuals" vs "receipts"
- Expect essential docs to be visible immediately (no searching)
- Don't want to organize - want app to auto-organize
- Trust visual cues (badges, colors) over text labels

**Yacht Captains:**
- Think in systems (electrical, plumbing, etc.)
- Expect instant access to troubleshooting sections (page-level bookmarks)
- Need offline access (no cell signal at dock)
- Prioritize speed over aesthetics (plain list is fine if fast)

**Crew Members:**
- Need role-based access (captain sees everything, deckhand sees safety manuals only)
- Expect task-based navigation ("I'm cleaning the bilge, show me bilge docs")
- Don't care about insurance/financial docs (filter them out)

**Marina Managers:**
- Think in fleets (all boats, not one boat)
- Expect compliance dashboards (all expiring insurance, cross-boat)
- Need delegation (assign tasks to captains)
- Prioritize audit trails (who uploaded what, when)

**Accountants:**
- Think in structured data (tables, not documents)
- Expect export capabilities (CSV, QuickBooks)
- Need tax categorization (deductible, capital, operating)
- Prioritize warranty tracking (save clients money)

**UX Designers:**
- Think in user journeys (task flows, not features)
- Expect progressive disclosure (don't overwhelm)
- Need accessibility (keyboard nav, screen reader)
- Prioritize mobile-first (captain uses phone, not desktop)

---

## Concrete Recommendations

### Recommendation 1: Default to "Owner View" (Importance-Based)

**Why:** Most users are boat owners, not captains. Owners care about essential docs, not system manuals.

**Layout:**
```
1. Needs Attention (expiring/overdue)
2. Essential Documents (user-pinned)
3. Frequently Accessed (auto-sorted)
4. Browse All (by category, system, date)
```

---

### Recommendation 2: Offer "Captain View" (System-Based)

**Why:** Captains are power users. They need fast access to manuals, organized by system.

**Layout:**
```
1. Quick Access (offline-cached, bookmarked pages)
2. Browse by System (Electrical, Plumbing, etc.)
3. Recently Viewed
4. Search (page-level results)
```

---

### Recommendation 3: Auto-Categorize with OCR (Reduce Manual Tagging)

**Why:** Users won't tag documents correctly. OCR can extract keywords and suggest categories.

**Example:**
```
Upload: "Volvo_D4_Manual.pdf"
OCR detects: "Volvo", "D4-300", "Engine", "Installation", "Maintenance"
Auto-suggest:
  Categories: [Manuals]
  Systems: [Propulsion]
  Tags: [engine, volvo, maintenance]
User confirms or edits.
```

---

### Recommendation 4: Pin Essential Docs (User-Defined)

**Why:** Every boat owner needs quick access to 3-5 critical docs (insurance, registration, safety cert).

**Implementation:**
- Allow user to pin up to 5 docs
- Pinned docs appear at top of library (with badges)
- Expiration dates shown (if detected via OCR)

---

### Recommendation 5: Page-Level Search (Not Just Document-Level)

**Why:** Owner's Manual is 400 pages. Searching "bilge" should return page 87, not the entire manual.

**Implementation:**
- Meilisearch indexes each page as separate document
- Search results show page number + snippet
- Click result → jump directly to page 87

---

### Recommendation 6: Offline Mode (Captain Use Case)

**Why:** No cell signal at dock. Captain needs manuals at 9 PM during emergency.

**Implementation:**
- Allow user to select docs for offline caching
- PWA with service worker + IndexedDB
- Auto-cache frequently accessed docs
- Show "Offline ✓" badge for cached docs

---

### Recommendation 7: Multi-Category Tagging (Avoid Forced Choice)

**Why:** Documents fit multiple categories. Engine warranty is warranty + propulsion + financial.

**Implementation:**
- Allow multiple categories per doc (array, not string)
- Doc appears in all selected category views
- Search filters by any category match

---

### Recommendation 8: Role-Based Dashboards (Owner, Captain, Manager, Accountant)

**Why:** Different users have different mental models and priorities.

**Implementation:**
- Owner: Insurance status, expense summary
- Captain: System manuals, quick access
- Manager: Fleet overview, delegation
- Accountant: Table view, expense tracking

---

### Recommendation 9: Visual Badges (Priority, Access, Status)

**Why:** Users scan visually, not read text. Badges communicate status instantly.

**Badges:**
- 🚨 Needs Attention (expiring soon, overdue)
- 📌 Pinned (user-selected essential docs)
- ⭐ Frequently Accessed (opened 10+ times)
- 🆕 New (uploaded in last 7 days)
- 📥 Offline Cached (available without internet)

---

### Recommendation 10: Table View for Service Records (Accountant Use Case)

**Why:** Accountants need structured data (date, vendor, amount), not document previews.

**Implementation:**
- Separate "Table View" mode for Service Records
- Columns: Date, Vendor, Amount, System, Tax Category
- Sortable, filterable, exportable to CSV/Excel

---

## Success Metrics

### KPIs for Navigation Features

- **Time to find document:** < 10 seconds (avg from search/browse to view)
- **Search success rate:** > 90% (user finds what they need on first search)
- **Category accuracy:** > 85% (auto-categorized docs are correctly tagged)
- **Offline usage:** > 30% of captains enable offline mode
- **Pin usage:** > 70% of owners pin at least 1 essential doc
- **Multi-view adoption:** > 40% of users switch between Owner/Captain views

---

## Risks & Mitigations

### Risk 1: Auto-Categorization is Inaccurate

**Likelihood:** Medium (OCR errors, ambiguous docs)
**Impact:** High (users lose trust in auto-suggestions)
**Mitigation:**
- Always show suggestions, never auto-apply
- Allow manual override/editing
- Learn from user corrections (ML feedback loop)

---

### Risk 2: Too Many Navigation Options (Confusing)

**Likelihood:** High (6 stakeholders want different navigation)
**Impact:** Medium (choice paralysis, poor UX)
**Mitigation:**
- Default to simplest view (Owner view: pinned + categories)
- Hide advanced features behind "View Options" menu
- Progressive disclosure (show advanced features after 3+ uses)

---

### Risk 3: Offline Mode is Technically Complex

**Likelihood:** High (service workers, sync conflicts)
**Impact:** Medium (delayed feature, increased dev time)
**Mitigation:**
- Start with read-only offline (no editing)
- Cache metadata only (not full PDFs) for v1
- Full offline PDF caching in v1.2

---

## Debate Conclusion

### Unanimous Agreement

All 6 stakeholders agree NaviDocs should prioritize:

1. **Multiple navigation paths** (browse by category, system, importance, date)
2. **Visual hierarchy** (essential → frequent → recent → all)
3. **File type-specific display** (PDFs, images, spreadsheets displayed differently)
4. **Role-based dashboards** (owner, captain, manager, accountant views)
5. **Page-level search** (show page number, not just document)
6. **Multi-category tagging** (one doc, multiple views)

### Feature Roadmap Approved

- **Q1 2026:** Core navigation (categories, search, essential docs) - v1.0
- **Q2 2026:** Advanced navigation (systems, roles, multi-category) - v1.1
- **Q3 2026:** Smart navigation (auto-categorization, suggestions) - v1.2
- **Q4 2026:** Fleet & compliance (cross-boat, audit trails) - v1.3

### Next Steps

1. **User research:** Test wireframes with 5 boat owners + 3 captains
2. **Technical spike:** Test Meilisearch faceted search, page-level indexing
3. **Design mockups:** High-fidelity mockups of Owner/Captain dashboards
4. **Prototype:** Build interactive prototype (Figma or React) for user testing

---

**Debate Status:** ✅ Complete
**Features Validated:** 32 navigation features identified
**Wireframes:** 6 key screens designed
**Risk Level:** Medium (auto-categorization risk, mitigable)
**Recommendation:** Proceed to user research & prototyping

---

**Document Version:** 1.0
**Created:** 2025-10-23
**Reference Case:** Liliane1 Archive (29 files, 9 categories)
**Facilitator:** Claude Code
**Participants:** 6 stakeholder perspectives (Boat Owner, Yacht Captain, UX Designer, Developer, Marina Manager, Accountant)
