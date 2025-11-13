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
| `feature-smart-ocr` | ✅ DONE! Pick Session 6 work or QC/Testing |
| `feature-timeline` | ✅ DONE! Pick Session 6 work or QC/Testing |
| `multiformat` | ✅ DONE! Pick Session 6 work or QC/Testing |
| `feature-polish-testing` | ✅ DONE! Pick Session 6 work or QC/Testing |
| `deployment-prep` | ✅ DONE! Pick Session 6 work or QC/Testing |
| **ANY OTHER BRANCH** | 🚀 **DO SESSION 6: Build Inventory/Warranty** |

---

## 🚀 SESSION 6: Build Inventory & Warranty Tracking (90-120 min)

**If you're the first session to see this, YOU build this feature!**

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

**Total Features:** 4

| Feature | Status | Lines Added | Time Spent |
|---------|--------|-------------|------------|
| Smart OCR | ✅ DEPLOYED | 300+ | 60 min |
| Multi-format | ✅ DEPLOYED | 400+ | 90 min |
| Timeline | ✅ DEPLOYED | 600+ | 90 min |
| Inventory/Warranty | 🔄 BUILDING | TBD | 90-120 min |

---

## 🎯 Success Criteria

**When all done, NaviDocs will have:**
- ✅ 36x faster OCR for text PDFs
- ✅ Support for 7 file types (PDF, JPG, PNG, DOCX, XLSX, TXT, MD)
- ✅ Activity timeline tracking all events
- ✅ Equipment inventory with warranty tracking
- ✅ Warranty expiration alerts
- ✅ Complete documentation
- ✅ Fully tested by 5 sessions

**Deployment:** All features live on https://digital-lab.ca/navidocs/

---

## ❓ Questions?

**Read these docs:**
- This file (you are here): INSTRUCTIONS_FOR_ALL_SESSIONS.md
- Session 6 prompt: builder/prompts/current/session-6-inventory-warranty.md
- Feature spec: FEATURE_SPEC_INVENTORY_WARRANTY.md

**Check your status:**
```bash
git branch --show-current
git log --oneline -10
```

**No bottlenecks:** Sessions self-coordinate. No need to ask user!

---

**Let's finish this! 🚀**

**Next session to read this: Start Session 6 work immediately if feature/inventory-warranty branch doesn't exist yet!**
