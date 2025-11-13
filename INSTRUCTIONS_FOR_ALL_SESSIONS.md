# Instructions for All Cloud Sessions - READ THIS FIRST

**Last Updated:** 2025-11-13 16:00 UTC
**GitHub URL:** https://github.com/dannystocker/navidocs/blob/navidocs-cloud-coordination/INSTRUCTIONS_FOR_ALL_SESSIONS.md

---

## 🎯 Current Status

**✅ DEPLOYED TO STACKCP (3 Features Live):**
1. Smart OCR (33x speedup) - LIVE & WORKING
2. Multi-format uploads (JPG, PNG, DOCX, XLSX, TXT, MD) - LIVE & WORKING
3. Timeline (activity history) - LIVE & WORKING

**🆕 NEW FEATURE NEEDED:**
4. Inventory & Warranty Tracking - NEEDS TO BE BUILT

---

## 📋 What You Need To Do

### Step 1: Identify Yourself

Run this command to see your branch:
```bash
cd /home/setup/navidocs
git branch --show-current
```

### Step 2: Find Your Assignment

| Your Branch Contains | Your Task |
|---------------------|-----------|
| `feature-smart-ocr` | ✅ DONE! Pick Sessions 6-10 or QC/Testing |
| `feature-timeline` | ✅ DONE! Pick Sessions 6-10 or QC/Testing |
| `multiformat` | ✅ DONE! Pick Sessions 6-10 or QC/Testing |
| `feature-polish-testing` | ✅ DONE! Pick Sessions 6-10 or QC/Testing |
| `deployment-prep` | ✅ DONE! Pick Sessions 6-10 or QC/Testing |
| `feature/inventory-warranty` | ✅ Session 6 DONE! Pick Sessions 7-10 or QC/Testing |
| `feature/maintenance-scheduler` | ✅ Session 7 DONE! Pick Sessions 8-10 or QC/Testing |
| `feature/crew-contacts` | ✅ Session 8 DONE! Pick Sessions 9-10 or QC/Testing |
| `feature/compliance-certification` | ✅ Session 9 DONE! Pick Session 10 or QC/Testing |
| `feature/fuel-expense-tracker` | ✅ Session 10 DONE! Do QC/Testing |
| **ANY OTHER BRANCH** | 🚀 **Pick next available session (6-10)** |

**Available Features to Build:**

| Session | Feature | Time | Status |
|---------|---------|------|--------|
| Session 6 | Inventory & Warranty Tracking | 90-120 min | Check if feature/inventory-warranty branch exists |
| Session 7 | Maintenance Scheduler | 90-120 min | Check if feature/maintenance-scheduler branch exists |
| Session 8 | Crew & Contact Management | 60-90 min | Check if feature/crew-contacts branch exists |
| Session 9 | Compliance & Certification Tracker | 75-90 min | Check if feature/compliance-certification branch exists |
| Session 10 | Fuel Log & Expense Tracker | 90-120 min | Check if feature/fuel-expense-tracker branch exists |

**To check what's available:**
```bash
git fetch origin && git branch -r | grep feature/
```

---

## 🚀 SESSION 6: Build Inventory & Warranty Tracking (90-120 min)

**Check if this is already done before starting!**

### Quick Start

```bash
cd /home/setup/navidocs
git fetch origin
git checkout navidocs-cloud-coordination
git pull origin navidocs-cloud-coordination
git checkout -b feature/inventory-warranty
```

### Read the Prompt

**Complete instructions here:**
https://github.com/dannystocker/navidocs/blob/navidocs-cloud-coordination/builder/prompts/current/session-6-inventory-warranty.md

**Feature spec here:**
https://github.com/dannystocker/navidocs/blob/navidocs-cloud-coordination/FEATURE_SPEC_INVENTORY_WARRANTY.md

### What You're Building

**Equipment inventory management system with:**
- Equipment list with warranty status (🟢 active, 🟡 expiring soon, 🔴 expired)
- Add/edit/delete equipment
- Attach documents to equipment
- Service history tracking
- Dashboard alerts for expiring warranties
- Demo data: 10 sample equipment items

### Implementation Steps

1. **Database** (15 min) - Create 3 tables via migration
2. **Backend Service** (25 min) - equipment-service.js
3. **Backend Routes** (20 min) - routes/equipment.js (8 endpoints)
4. **Frontend View** (30 min) - views/Inventory.vue
5. **Add Equipment Modal** (20 min) - components/AddEquipmentModal.vue
6. **Navigation** (10 min) - Add "Inventory" to menu
7. **Demo Data** (10 min) - Seed 10 equipment items
8. **Testing** (15 min) - Test all features

### When Done

```bash
git add .
git commit -m "[SESSION-6] Add inventory & warranty tracking"
git push origin feature/inventory-warranty
```

Create `SESSION-6-COMPLETE.md` with summary of what you built.

---

## 🚀 SESSION 7: Build Maintenance Scheduler (90-120 min)

**Check if this is already done before starting!**

### Quick Start

```bash
cd /home/setup/navidocs
git fetch origin
git checkout navidocs-cloud-coordination
git pull origin navidocs-cloud-coordination
git checkout -b feature/maintenance-scheduler
```

### Read the Prompt

**Complete instructions:** `/home/setup/navidocs/builder/prompts/current/session-7-maintenance-scheduler.md`
**Feature spec:** `/home/setup/navidocs/FEATURE_SPEC_MAINTENANCE_SCHEDULER.md`

### What You're Building

**Recurring maintenance scheduling and task management:**
- Maintenance task list with status indicators (pending, due, overdue)
- Recurring task scheduling (days, hours, miles-based)
- Task completion workflow with auto-calculated next due dates
- Dashboard alerts for due/overdue tasks
- Maintenance history per task
- Integration with equipment inventory
- Demo data: 10-15 sample tasks

### When Done

```bash
git add .
git commit -m "[SESSION-7] Add maintenance scheduler"
git push origin feature/maintenance-scheduler
```

Create `SESSION-7-COMPLETE.md`

---

## 🚀 SESSION 8: Build Crew & Contact Management (60-90 min)

**Check if this is already done before starting!**

### Quick Start

```bash
cd /home/setup/navidocs
git fetch origin
git checkout navidocs-cloud-coordination
git pull origin navidocs-cloud-coordination
git checkout -b feature/crew-contacts
```

### Read the Prompt

**Complete instructions:** `/home/setup/navidocs/builder/prompts/current/session-8-crew-contacts.md`
**Feature spec:** `/home/setup/navidocs/FEATURE_SPEC_CREW_CONTACTS.md`

### What You're Building

**Contact directory for marine operations:**
- Contact directory with type categorization (Crew, Service Provider, Marina, Emergency, Broker)
- Crew certification and availability tracking
- Service provider ratings and service history
- Marina details with amenities
- Emergency contact quick access widget
- Contact search and filtering
- Integration with maintenance tasks
- Demo data: 20-25 sample contacts

### When Done

```bash
git add .
git commit -m "[SESSION-8] Add crew & contact management"
git push origin feature/crew-contacts
```

Create `SESSION-8-COMPLETE.md`

---

## 🚀 SESSION 9: Build Compliance & Certification Tracker (75-90 min)

**Check if this is already done before starting!**

### Quick Start

```bash
cd /home/setup/navidocs
git fetch origin
git checkout navidocs-cloud-coordination
git pull origin navidocs-cloud-coordination
git checkout -b feature/compliance-certification
```

### Read the Prompt

**Complete instructions:** `/home/setup/navidocs/builder/prompts/current/session-9-compliance-certification.md`
**Feature spec:** `/home/setup/navidocs/FEATURE_SPEC_COMPLIANCE_CERTIFICATION.md`

### What You're Building

**Regulatory compliance and certification tracking:**
- Compliance item tracking with expiration dates
- Automated renewal alerts (especially for mandatory items)
- Compliance dashboard with status overview (valid, expiring soon, expired)
- Document attachment for certificates
- Renewal history tracking
- Visual status indicators and critical alerts
- Categories: Vessel registration, safety inspections, crew certifications, insurance, equipment certifications, environmental compliance
- Demo data: 12-15 compliance items

### When Done

```bash
git add .
git commit -m "[SESSION-9] Add compliance & certification tracker"
git push origin feature/compliance-certification
```

Create `SESSION-9-COMPLETE.md`

---

## 🚀 SESSION 10: Build Fuel Log & Expense Tracker (90-120 min)

**Check if this is already done before starting!**

### Quick Start

```bash
cd /home/setup/navidocs
git fetch origin
git checkout navidocs-cloud-coordination
git pull origin navidocs-cloud-coordination
git checkout -b feature/fuel-expense-tracker
```

### Read the Prompt

**Complete instructions:** `/home/setup/navidocs/builder/prompts/current/session-10-fuel-expense-tracker.md`
**Feature spec:** `/home/setup/navidocs/FEATURE_SPEC_FUEL_EXPENSE_TRACKER.md`

### What You're Building

**Fuel consumption tracking and complete expense management:**
- Fuel log with consumption tracking and efficiency calculations (MPG/GPH)
- Expense management by category (15+ categories)
- Budget vs actual comparison
- Expense reports with charts (pie, line, bar)
- Receipt attachment
- Tax-deductible expense tracking
- CSV export for accounting
- Integration with maintenance costs and service providers
- Demo data: 20+ fuel logs, 40+ expenses

**Note:** This is the most complex feature! Take your time.

### When Done

```bash
git add .
git commit -m "[SESSION-10] Add fuel log & expense tracker"
git push origin feature/fuel-expense-tracker
```

Create `SESSION-10-COMPLETE.md`

---

## 🧪 QC & TESTING TASKS (For Completed Sessions)

**If your feature is done, do user testing on the live deployment:**

### Live Site

**URL:** https://digital-lab.ca/navidocs/ (frontend - static demo page currently)
**Backend API:** (Will be deployed after Session 6 completes)

### Testing Tasks

#### Task 1: Test Smart OCR (15 min)

1. Upload a text-heavy PDF (100+ pages if possible)
2. Time how long OCR takes
3. Verify text is searchable after upload
4. Expected: <10 seconds for text PDFs (vs 180s before)

**Report format:**
```
# Smart OCR Test Report
- PDF name: [filename]
- Pages: [number]
- Processing time: [seconds]
- Text extracted: [Yes/No]
- Searchable: [Yes/No]
- Issues: [list any problems]
```

#### Task 2: Test Multi-Format Uploads (20 min)

Upload one of each:
- JPG image
- PNG image
- DOCX document
- XLSX spreadsheet
- TXT text file
- MD markdown file

**Verify:**
- All upload successfully
- Text extracted from each
- All searchable in search box
- Correct icons display

**Report format:**
```
# Multi-Format Upload Test Report
| Format | Uploaded | Text Extracted | Searchable | Issues |
|--------|----------|----------------|------------|--------|
| JPG    | Yes/No   | Yes/No         | Yes/No     | ...    |
| PNG    | Yes/No   | Yes/No         | Yes/No     | ...    |
| DOCX   | Yes/No   | Yes/No         | Yes/No     | ...    |
| XLSX   | Yes/No   | Yes/No         | Yes/No     | ...    |
| TXT    | Yes/No   | Yes/No         | Yes/No     | ...    |
| MD     | Yes/No   | Yes/No         | Yes/No     | ...    |
```

#### Task 3: Test Timeline (15 min)

1. Upload 3-5 documents
2. Navigate to Timeline page
3. Verify all uploads appear in chronological order
4. Check timestamps are correct
5. Test filtering (if available)

**Report format:**
```
# Timeline Test Report
- Events showing: [Yes/No]
- Correct order: [Yes/No]
- Timestamps accurate: [Yes/No]
- All uploads tracked: [Yes/No]
- Issues: [list any problems]
```

#### Task 4: Integration Testing (20 min)

**Scenario: Upload a boat manual, search it, check timeline**

1. Upload a multi-page PDF boat manual
2. Wait for OCR to complete
3. Search for a specific term you know is in the manual
4. Verify search results show the document
5. Check timeline shows the upload event
6. Try uploading DOCX version of same manual
7. Verify both searchable

**Report format:**
```
# Integration Test Report
- All features working together: [Yes/No]
- Upload → OCR → Search: [Working/Broken]
- Upload → Timeline: [Working/Broken]
- Search accuracy: [Good/Fair/Poor]
- Issues: [list any problems]
```

#### Task 5: UI/UX Review (15 min)

**Check:**
- Is upload button easy to find?
- Are file type restrictions clear?
- Does search work intuitively?
- Is timeline easy to navigate?
- Are error messages helpful?
- Is loading feedback clear?
- Mobile responsive?

**Report format:**
```
# UI/UX Review Report
- Overall usability: [Excellent/Good/Fair/Poor]
- Confusing elements: [list]
- Missing features: [list]
- Suggestions: [list]
```

### Where to Submit Test Reports

Create a file: `TEST-REPORT-[YOUR-BRANCH-NAME].md`

```bash
git add TEST-REPORT-*.md
git commit -m "[TESTING] User testing results"
git push origin [your-branch-name]
```

---

## 🔄 Coordination Protocol

**How sessions self-coordinate:**

1. **Check GitHub branches** to see what's done:
   ```bash
   git fetch origin && git branch -r | grep claude
   ```

2. **Read this file** for latest status:
   https://github.com/dannystocker/navidocs/blob/navidocs-cloud-coordination/INSTRUCTIONS_FOR_ALL_SESSIONS.md

3. **If inventory/warranty is done** (feature/inventory-warranty branch exists with SESSION-6-COMPLETE.md):
   - All remaining sessions do QC/Testing tasks above
   - Submit test reports

4. **If you're confused:**
   - Check your git log: `git log --oneline -10`
   - See what you've accomplished already
   - Pick a task from this doc

---

## 📊 Feature Summary

**Total Features:** 8 (3 deployed + 5 new features)

| Feature | Session | Status | Time Est. |
|---------|---------|--------|-----------|
| Smart OCR | 1-2 | ✅ DEPLOYED | 60 min |
| Multi-format | 3 | ✅ DEPLOYED | 90 min |
| Timeline | 4 | ✅ DEPLOYED | 90 min |
| Inventory/Warranty | 6 | 🔄 TO BUILD | 90-120 min |
| Maintenance Scheduler | 7 | 🔄 TO BUILD | 90-120 min |
| Crew & Contacts | 8 | 🔄 TO BUILD | 60-90 min |
| Compliance & Certification | 9 | 🔄 TO BUILD | 75-90 min |
| Fuel Log & Expense Tracker | 10 | 🔄 TO BUILD | 90-120 min |

**Total Build Time:** ~450-600 minutes across 5 sessions

---

## 🎯 Success Criteria

**When all done, NaviDocs will have:**

**Phase 1: Core Features (Deployed)**
- ✅ 36x faster OCR for text PDFs
- ✅ Support for 7 file types (PDF, JPG, PNG, DOCX, XLSX, TXT, MD)
- ✅ Activity timeline tracking all events

**Phase 2: Equipment & Operations (Sessions 6-8)**
- 🔄 Equipment inventory with warranty tracking
- 🔄 Recurring maintenance scheduler with alerts
- 🔄 Crew, service provider, and marina contacts
- 🔄 Service provider ratings and history
- 🔄 Emergency contact quick access

**Phase 3: Compliance & Financial (Sessions 9-10)**
- 🔄 Regulatory compliance tracking (certifications, licenses, inspections)
- 🔄 Fuel consumption tracking with efficiency calculations
- 🔄 Complete expense management system
- 🔄 Budget tracking and financial reports
- 🔄 Tax-deductible expense tracking

**Demo Value:**
- Professional marine document management platform
- Complete boat ownership cost tracking
- Regulatory compliance automation
- Maintenance prevention system
- Financial insights and reporting

**Deployment:** All features will be live on https://digital-lab.ca/navidocs/

---

## ❓ Questions?

**Read these docs:**
- This file (you are here): INSTRUCTIONS_FOR_ALL_SESSIONS.md
- Session prompts: builder/prompts/current/session-[6-10]-*.md
- Feature specs: FEATURE_SPEC_*.md

**Check your status:**
```bash
git branch --show-current
git log --oneline -10
git fetch origin && git branch -r | grep feature/
```

**No bottlenecks:** Sessions self-coordinate. No need to ask user!

---

**Let's finish this! 🚀**

**Next session to read this: Pick the first available session (6-10) that doesn't have a completed branch!**
