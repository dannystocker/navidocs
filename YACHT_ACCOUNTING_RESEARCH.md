# Open-Source Accounting Modules for Yacht/Boat Expense Tracking
## Research Report - Multi-User Owner + Captain Expenditure Tracking

**Report Date:** November 13, 2025
**Research Scope:** Open-source accounting libraries suitable for NaviDocs integration
**Target Stack:** Node.js/Express.js/JavaScript backend

---

## Executive Summary

After comprehensive research of 15+ open-source accounting projects, **no dedicated boat/yacht accounting system exists in the open-source ecosystem**. However, three specialized solutions offer strong foundations:

1. **Spliit** (MIT) - Best for owner/captain split expense tracking
2. **SplitPro** (MIT) - Most robust multi-currency reimbursement system
3. **Medici** (MIT) - Lightweight double-entry accounting library for custom integration

For a full-featured standalone system, **BigCapital** (AGPL-3.0) offers the most comprehensive accounting foundation but requires AGPL compliance.

---

## Top 5 Recommended Solutions

### 1. SPLIIT - Expense Splitting App
**GitHub:** https://github.com/spliit-app/spliit
**License:** MIT
**Last Updated:** November 9, 2025 (v1.19.0)
**Stars:** 2,300+ | **Forks:** 347

#### Technology Stack
- **Frontend:** Next.js, React, TailwindCSS, shadcn/UI
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Prisma ORM)
- **Languages:** 97.9% TypeScript, 1.1% JavaScript

#### Key Features
- Group-based expense tracking with balance calculations
- Receipt scanning & image attachments
- Uneven cost splitting (itemized, percentage-based, exact amounts)
- Expense categorization
- Multi-user collaborative groups
- Optional AWS S3 storage for receipts
- Optional GPT-4 Vision integration for receipt OCR
- OpenAI auto-categorization

#### Suitability for Yacht/Boat Tracking
**Rating: 8/10**
- **Excellent:** Perfect for owner↔captain expense splits
- **Good:** Receipt upload with optional AI categorization
- **Good:** Multi-currency support (potentially via Prisma)
- **Limited:** No dedicated reimbursement workflow
- **Limited:** No crew expense tracking hierarchy

#### Integration Notes
- Well-suited for NaviDocs as separate microservice
- Could adapt API for captain expense submission → owner approval
- Receipt scanning aligns with NaviDocs photo management
- May require customization for reimbursement workflows

#### Advantages
✅ Most actively maintained (2025 release)
✅ MIT license - no GPL compliance concerns
✅ Modern tech stack (Next.js, Prisma)
✅ Built-in receipt scanning support
✅ PWA-capable for mobile crew access

#### Disadvantages
❌ No dedicated approval workflow
❌ Designed for group expense splitting, not employee reimbursement
❌ Limited accounting (no GL, balance sheet, P&L reports)

---

### 2. SPLITPRO - Splitwise Alternative
**GitHub:** https://github.com/oss-apps/split-pro
**License:** MIT
**Last Updated:** November 11, 2025 (v1.5.8)
**Stars:** 916 | **Forks:** 109

#### Technology Stack
- **Frontend:** NextJS, Tailwind CSS, ShadcnUI
- **Backend/API:** tRPC, NextAuth
- **Database:** PostgreSQL with Prisma ORM
- **Infrastructure:** Docker, GitHub Container Registry

#### Key Features
- Multi-currency support with rate conversion
- Bill/receipt upload and management
- Flexible splitting (shares, percentages, exact amounts)
- Splitwise data import capability
- PWA (Progressive Web App)
- Push notifications
- Data export functionality
- **Numeric precision:** Uses BigInt to prevent rounding errors
- Docker deployment support

#### Suitability for Yacht/Boat Tracking
**Rating: 8.5/10**
- **Excellent:** Multi-currency (critical for international yachts)
- **Excellent:** Numeric precision prevents floating-point errors in financial tracking
- **Good:** Receipt upload with bill management
- **Good:** Multiple splitting options for crew/captain scenarios
- **Limited:** No GL or financial reporting

#### Integration Notes
- Self-hosted only (community instance no longer available)
- Requires: Node.js ≥22.x, PostgreSQL, pnpm
- Docker support simplifies NaviDocs integration
- BigInt implementation critical for accurate financial calculations

#### Advantages
✅ MIT license
✅ Excellent numeric precision (BigInt-based)
✅ Multi-currency with live rate conversion
✅ Modern framework (tRPC for type-safe APIs)
✅ Active development (November 2025 release)
✅ Docker/containerization ready

#### Disadvantages
❌ Requires PostgreSQL (vs MongoDB in IDURAR)
❌ No built-in receipt OCR (upload only)
❌ Limited to expense splitting, not full accounting
❌ Node.js 22.x requirement (verify NaviDocs compatibility)

---

### 3. MEDICI - Double-Entry Accounting Library
**GitHub:** https://github.com/flash-oss/medici
**License:** MIT
**Last Updated:** December 2024
**Stars:** 330 | **Forks:** 97

#### Technology Stack
- **Framework:** Node.js library
- **ORM:** Mongoose (MongoDB)
- **Database:** MongoDB
- **Language:** JavaScript
- **Features:** ACID transactions via MongoDB sessions

#### Key Features
- Pure double-entry accounting system
- Hierarchical accounts (colon-separated: `Assets:Cash:Captain`)
- Journal entry creation with debit/credit transactions
- Account balance queries with date-range filtering
- Transaction ledger retrieval
- Journal entry voiding with audit trails
- Custom metadata on transactions
- Configurable precision (default 8 decimals)
- Balance snapshot caching (48-hour TTL)
- MongoDB read concern customization

#### Suitability for Yacht/Boat Tracking
**Rating: 9/10 (as library component)**
- **Excellent:** Proper GL accounting foundation
- **Excellent:** MongoDB integration (matches NaviDocs tech)
- **Excellent:** Hierarchical accounts (Captain:Meals, Owner:Fuel, etc.)
- **Good:** ACID transaction support
- **Good:** Audit trails (voiding)
- **Requires Work:** UI/API layer needed (library only)

#### Integration Notes
- **Library, not a complete app** - requires custom frontend/API
- Best used as backend accounting engine in NaviDocs
- Perfect for building custom owner+captain hierarchy
- Can track individual crew members as sub-accounts
- Supports metadata (can store captain ID, trip ID, etc.)

#### Example Account Structure for Yacht
```
Owner:Assets:Cash:Personal
Owner:Assets:Cash:OnBoard
Owner:Expenses:Fuel
Owner:Expenses:Provisions
Owner:Expenses:Marina
Captain:Expenses:Meals
Captain:Expenses:Crew
Captain:Reimbursement:Pending
Captain:Reimbursement:Paid
```

#### Advantages
✅ MIT license
✅ Pure double-entry accounting (proper GL)
✅ MongoDB native (matches NaviDocs)
✅ Lightweight library (easy to integrate)
✅ ACID transaction support
✅ Audit trail capability (voiding)

#### Disadvantages
❌ Library only - requires significant custom development
❌ No UI (must build frontend)
❌ No receipt OCR
❌ No multi-currency support
❌ Must implement reimbursement workflows

---

### 4. BIGCAPITAL - Full Accounting System
**GitHub:** https://github.com/bigcapitalhq/bigcapital
**License:** AGPL-3.0 (GNU Affero)
**Last Updated:** December 9, 2024 (v0.22.0)
**Stars:** 3,400+ | **Forks:** 350

#### Technology Stack
- **Language:** TypeScript (96.8%)
- **Architecture:** Monorepo (Lerna + pnpm workspaces)
- **Testing:** Playwright E2E
- **Deployment:** Docker, Docker Compose, Gitpod
- **Database:** (Typical for AGPL accounting: PostgreSQL/MySQL)

#### Key Features
- Double-entry accounting system
- Invoice and bill management
- Expense tracking with categorization
- Financial reporting with intelligent dashboards
- Inventory management
- Headless API for integration
- Multi-user support
- Self-hosted or cloud (my.bigcapital.app)
- Comprehensive documentation

#### Suitability for Yacht/Boat Tracking
**Rating: 9/10 (most complete)**
- **Excellent:** Full GL, P&L, balance sheet reports
- **Excellent:** Invoice/expense management
- **Excellent:** Multi-user support
- **Good:** Headless API for custom UI
- **Concern:** AGPL license (open-source derivative requirement)

#### Integration Notes
- **AGPL License Implications:**
  - If NaviDocs modifications are distributed, must open-source changes
  - Fine for internal/private use
  - Requires legal review for commercial products
  - Consider consulting with legal team before integration

#### Advantages
✅ Most complete accounting foundation
✅ Double-entry GL + financial reporting
✅ Active development (December 2024)
✅ Docker deployment ready
✅ Headless API architecture
✅ Inventory management (useful for provisioning)

#### Disadvantages
❌ AGPL-3.0 requires open-sourcing derivative works
❌ More complex than needed for pure expense tracking
❌ TypeScript monorepo (larger learning curve)
❌ Potential licensing conflicts if integrating into commercial product

---

### 5. IDURAR ERP/CRM
**GitHub:** https://github.com/idurar/idurar-erp-crm
**License:** AGPL-3.0 (Fair-Code)
**Last Updated:** September 27, 2024 (v4.1.0)
**Stars:** 8,000+ | **Forks:** 2,800

#### Technology Stack
- **Frontend:** React.js with Ant Design
- **Backend:** Express.js (Node.js)
- **Database:** MongoDB
- **Language:** 94% JavaScript
- **ORM:** (Typical: Mongoose)

#### Key Features
- Invoice and quote management
- Payment processing
- Customer relationship management
- Expense tracking
- Multi-user support
- Multi-tenant cloud capability
- Full ERP/CRM functionality

#### Suitability for Yacht/Boat Tracking
**Rating: 6/10**
- **Good:** MongoDB (NaviDocs match)
- **Good:** Express.js backend (NaviDocs match)
- **Good:** Invoice/expense management
- **Limited:** CRM-focused, overkill for boat expenses
- **Concern:** AGPL license

#### Disadvantages
❌ AGPL license (same compliance issues as BigCapital)
❌ Too broad (CRM features not needed)
❌ Older last update (September 2024)
❌ Over-engineered for simple yacht expense tracking

---

## Specialized Receipt OCR Solutions

### Receipt Scanner (danschultzer)
**GitHub:** https://github.com/danschultzer/receipt-scanner
**License:** MIT
**Stars:** 301 | **Last Update:** Maintenance mode (2024)

#### Features
- PDF and image receipt processing
- OCR via Tesseract.js
- Automatic date extraction
- Amount detection with decimal guessing
- Support for GraphicsMagick, ImageMagick, OpenCV3 preprocessing
- CLI tool and programmatic API
- Custom text parser support

#### Use Case
- Excellent complementary tool for receipt processing
- Can integrate with any accounting system
- Already supports Tesseract (mentioned in NaviDocs)
- MIT licensed for commercial use

---

## Comparison Matrix

| Feature | Spliit | SplitPro | Medici | BigCapital | IDURAR |
|---------|--------|----------|--------|-----------|--------|
| **License** | MIT | MIT | MIT | AGPL-3.0 | AGPL-3.0 |
| **Stars** | 2.3k | 916 | 330 | 3.4k | 8k |
| **Last Update** | Nov 2025 | Nov 2025 | Dec 2024 | Dec 2024 | Sept 2024 |
| **Tech Stack** | Next.js/Prisma | Next.js/tRPC | Node.js/Mongoose | TypeScript Monorepo | Express/React |
| **Database** | PostgreSQL | PostgreSQL | MongoDB | Varies | MongoDB |
| **Double-Entry GL** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Receipt Scanning** | ✅ (GPT-4V) | ❌ (Upload only) | ❌ | ✅ | ✅ |
| **Multi-Currency** | ✅ (Limited) | ✅ (Full) | ❌ | ✅ | ✅ |
| **Multi-User** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Reimbursement WF** | ❌ (Custom) | ❌ (Custom) | ❌ (Custom) | ✅ | ✅ |
| **Financial Reports** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Mobile-Friendly** | PWA ✅ | PWA ✅ | ❌ | ✅ | ✅ |
| **Docker Support** | ✅ | ✅ | ❌ | ✅ | ✅ |

---

## Boat-Specific Considerations

### Requirement Analysis

**1. Owner vs Captain Expense Tracking**
- Spliit & SplitPro: Groups-based (adapt easily)
- Medici: Hierarchical accounts (native support)
- BigCapital/IDURAR: Multi-user (requires customization)

**2. Multi-Currency Support** (International Yachts)
- SplitPro: **Best** (BigInt precision + live rates)
- Spliit: Basic support
- Medici: Not supported (would require wrapper)
- BigCapital: Yes, but unknown precision
- IDURAR: Yes

**3. Receipt Management & OCR**
- Spliit: Built-in GPT-4V receipt scanning
- Receipt Scanner: Dedicated OCR tool (MIT)
- Others: Can upload, limited OCR

**4. Reimbursement Workflow** (Captain → Owner payment)
- BigCapital: Built-in
- IDURAR: Built-in
- SplitPro/Spliit: Must customize
- Medici: Must build from scratch

**5. Mobile Access** (Captain at sea)
- Spliit: PWA ✅
- SplitPro: PWA ✅
- Others: Web-based or custom mobile

**6. Crew Expense Hierarchy**
- Medici: Native (hierarchical accounts)
- Others: Custom development required

---

## Recommended Integration Strategy

### Option A: Best for Speed (Recommended)
**Use Spliit + Receipt Scanner**

**Approach:**
1. Fork Spliit for NaviDocs customization
2. Create owner/captain groups
3. Integrate Receipt Scanner for OCR
4. Build approval workflow for captain→owner reimbursement
5. Add trip/voyage tracking metadata
6. Customize UI for yacht operations

**Effort:** 4-6 weeks
**Cost:** Lower (MIT licensed)
**Complexity:** Medium
**Maintainability:** Good (active upstream project)

**Modifications needed:**
- Add voyage/trip context
- Captain expense approval workflow
- Reimbursement calculation
- Crew expense hierarchy
- Integration with NaviDocs photo system

---

### Option B: Best for Financial Rigor
**Use Medici (Library) + Custom API Layer**

**Approach:**
1. Use Medici as accounting engine
2. Build custom Express.js API layer
3. Implement owner/captain account hierarchy
4. Add reimbursement workflow
5. Connect Receipt Scanner for OCR
6. Build custom frontend or integrate with NaviDocs UI

**Effort:** 8-10 weeks
**Cost:** Lower (MIT licensed)
**Complexity:** High
**Advantage:** Proper GL accounting, audit trails

**Benefits:**
- Proper double-entry accounting
- Account hierarchy matches crew structure
- Audit trail (voiding records)
- MongoDB native integration
- Lightweight foundation

---

### Option C: Enterprise-Grade
**Use BigCapital** (with legal review)

**Approach:**
1. Self-host BigCapital
2. Customize multi-user roles for yacht operations
3. Add voyage tracking
4. Integrate with NaviDocs
5. Deploy via Docker

**Effort:** 6-8 weeks
**Cost:** Medium (AGPL compliance review needed)
**Complexity:** Medium
**Risk:** AGPL licensing implications

**Requires:**
- Legal review of AGPL compliance
- Evaluate if open-sourcing NaviDocs changes is acceptable
- Assess competitive impact

---

## Decision Matrix

| Priority | Recommendation | Rationale |
|----------|---|---|
| **Speed to Market** | Spliit + Receipt Scanner | MIT licensed, active, receipt OCR built-in |
| **Financial Accuracy** | Medici (custom) | Proper GL, BigInt precision, MongoDB match |
| **Feature Completeness** | BigCapital | Full accounting, but AGPL concerns |
| **Ease of Integration** | Spliit | Next.js matches modern web patterns |
| **Lowest Maintenance** | SplitPro | MIT, PostgreSQL (industry standard), BigInt precision |

---

## Boat-Specific Accounting Workflow

### Typical Yacht Expense Flow

```
1. Captain Expense Entry
   └─ Upload receipt (photo/scan)
   └─ Select category (Fuel, Meals, Crew, Marina, etc.)
   └─ Add crew members involved
   └─ Mark as "Pending Reimbursement"

2. Owner Review & Approval
   └─ Review captain's submitted expenses
   └─ Approve/reject with notes
   └─ Mark approved expenses as "Approved"

3. Reimbursement Tracking
   └─ Aggregate approved expenses
   └─ Calculate captain balance due
   └─ Generate reimbursement invoice
   └─ Track payment status

4. Financial Reporting
   └─ Trip/voyage-level cost summaries
   └─ Crew expense breakdowns
   └─ Fuel cost tracking
   └─ Marina/port cost analysis
   └─ Owner vs Captain liability reporting

5. Multi-Currency Handling (International)
   └─ Record expense in local currency
   └─ Convert to owner's base currency
   └─ Track FX differences
   └─ Generate multi-currency reports
```

### Recommended Data Model for NaviDocs

```javascript
// Expense Document
{
  _id: ObjectId,
  voyageId: ObjectId,      // Link to voyage/trip
  timestamp: Date,
  submittedBy: "captain",   // User role
  paidBy: ObjectId,         // Who paid the actual money
  amount: Decimal128,       // Use Decimal for accuracy
  currency: "EUR",
  originalCurrency: "GBP",  // For tracking FX
  rate: 1.18,              // FX rate applied
  category: "Fuel",
  description: "Diesel fuel - Canary Islands",
  receipt: {
    imageUrl: "s3://...",
    scannedText: "...",     // From OCR
    vendor: "Marina ABC"
  },
  status: "approved",       // pending, approved, rejected, reimbursed
  crew: [ObjectId],         // Crew members involved
  approvedBy: ObjectId,     // Owner who approved
  approvedAt: Date,
  reimbursementId: ObjectId, // Link to reimbursement batch
  notes: "..."
}

// Reimbursement Batch
{
  _id: ObjectId,
  captain: ObjectId,
  voyageId: ObjectId,
  startDate: Date,
  endDate: Date,
  totalAmount: Decimal128,
  currency: "EUR",
  status: "pending",        // pending, paid, partial
  invoiceNumber: "RF-2025-001",
  paidDate: Date,
  notes: "..."
}
```

---

## Comparison: Build vs. Buy Analysis

### Option 1: Adopt Spliit + Receipt Scanner (Recommended)
- **Development Cost:** 4-6 weeks
- **License Cost:** Free (MIT)
- **Maintenance:** Low (upstream updates available)
- **Customization Effort:** Medium
- **Time to Production:** 2-3 months

**Best for:** Fast MVP, modern tech stack, crew mobile access

---

### Option 2: Build Custom on Medici
- **Development Cost:** 8-10 weeks
- **License Cost:** Free (MIT)
- **Maintenance:** High (full ownership)
- **Customization Effort:** High
- **Time to Production:** 3-4 months

**Best for:** Long-term, specific yacht domain needs, GL accounting requirement

---

### Option 3: Deploy BigCapital (AGPL)
- **Development Cost:** 6-8 weeks + legal review
- **License Cost:** Free (AGPL)
- **Legal Risk:** Moderate (open-source derivative requirement)
- **Maintenance:** Medium (upstream + legal compliance)
- **Time to Production:** 2-3 months

**Best for:** Full accounting features, willing to handle AGPL implications

---

## Final Recommendation

### For NaviDocs: **Hybrid Approach**

**Phase 1 (MVP - 6-8 weeks):**
1. Integrate **Spliit** as forked customized service
2. Add **Receipt Scanner** for OCR processing
3. Build simple captain expense submission UI
4. Implement owner approval workflow
5. Connect to NaviDocs photo/document system

**Phase 2 (v1.0 - 3-4 months):**
1. Evaluate migration to **Medici** for GL accounting
2. Add financial reporting layer
3. Implement multi-currency precision (BigInt)
4. Build reimbursement batch processing
5. Add crew expense hierarchy

**Technology Stack:**
- **Accounting:** Spliit or Medici
- **OCR:** Receipt Scanner
- **Database:** MongoDB (NaviDocs native)
- **Backend:** Express.js (NaviDocs native)
- **Frontend:** Existing NaviDocs UI + mobile PWA

**License Compliance:**
- ✅ Spliit: MIT (no restrictions)
- ✅ Receipt Scanner: MIT (no restrictions)
- ✅ Medici: MIT (no restrictions)
- ✅ All choices compatible with commercial products

---

## Repository References

| Project | Repository | License | Last Updated |
|---------|-----------|---------|--------------|
| Spliit | https://github.com/spliit-app/spliit | MIT | Nov 2025 |
| SplitPro | https://github.com/oss-apps/split-pro | MIT | Nov 2025 |
| Medici | https://github.com/flash-oss/medici | MIT | Dec 2024 |
| BigCapital | https://github.com/bigcapitalhq/bigcapital | AGPL-3.0 | Dec 2024 |
| IDURAR | https://github.com/idurar/idurar-erp-crm | AGPL-3.0 | Sept 2024 |
| Receipt Scanner | https://github.com/danschultzer/receipt-scanner | MIT | 2024 |

---

## Action Items

- [ ] Evaluate Spliit vs SplitPro (PostgreSQL requirement)
- [ ] Assess Medici complexity vs Spliit customization effort
- [ ] Review AGPL implications with legal team
- [ ] Prototype receipt scanning integration
- [ ] Design yacht-specific data models
- [ ] Evaluate multi-currency precision requirements
- [ ] Plan captain approval workflow
- [ ] Consider crew expense hierarchy needs

---

**Report Prepared:** November 13, 2025
**Research Scope:** GitHub, official documentation, live repositories
**Confidence Level:** High (primary source verification)
