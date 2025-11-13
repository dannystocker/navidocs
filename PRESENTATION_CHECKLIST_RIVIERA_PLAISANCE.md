# NaviDocs Presentation Checklist - Riviera Plaisance

**Meeting Time:** <1 hour from now
**Date:** 2025-11-13 16:00 UTC
**Attendee:** Riviera Plaisance (Sylvain)
**Purpose:** Present NaviDocs features for inclusion with boat sales

---

## ✅ What's Ready

### 1. Feature Selector (PRIMARY TOOL)
**URL:** https://digital-lab.ca/navidocs/builder/riviera-meeting.html

**Features:**
- Interactive checklist for all 8 features
- YES/MAYBE/LATER voting buttons per feature
- Notes/feedback textarea per feature
- TTT compliance (source citations)
- Export options: JSON, Email, Print
- Auto-saves to localStorage

**How to Use:**
1. Open URL in browser
2. Go through each feature with client
3. Mark YES/MAYBE/LATER
4. Add notes for customization requests
5. Export at end of meeting (JSON preferred)

---

### 2. Intelligence Brief (BACKGROUND)
**URL:** https://digital-lab.ca/navidocs/brief/

**Content:**
- 94 intelligence files from 5 cloud sessions
- €14.6B market analysis
- 52 features analyzed
- Complete technical architecture
- Use for deep-dive questions

---

### 3. Demo Site (VISUAL)
**URL:** https://digital-lab.ca/navidocs/demo/
**Main Site:** https://digital-lab.ca/navidocs/

**Shows:**
- Smart OCR in action
- Multi-format uploads (JPG, DOCX, XLSX, etc.)
- Timeline activity feed

---

## 🎯 8 Features Overview

### **Phase 1: DEPLOYED** (Show these working)

**1. Smart OCR (36x speedup)**
- Extract text from PDFs in <10 seconds (was 180s)
- Uses pdfjs-dist for native text, Tesseract fallback
- **Demo:** Upload 100+ page PDF, show instant search

**2. Multi-Format Uploads**
- Support: PDF, JPG, PNG, DOCX, XLSX, TXT, MD
- Intelligent routing per file type
- **Demo:** Upload different formats, search across all

**3. Activity Timeline**
- Chronological event feed
- Date grouping, infinite scroll
- **Demo:** Show document upload history

### **Phase 2: READY TO BUILD** (Get client selection)

**4. Inventory & Warranty Tracking** (90-120 min)
- Equipment list with warranty status alerts
- Attach documents to equipment
- Service history tracking
- **Value:** Never miss warranty expirations, save €15K-€50K per boat

**5. Maintenance Scheduler** (90-120 min)
- Recurring task scheduling (days/hours/miles-based)
- Auto-calculated next due dates
- Dashboard alerts
- **Value:** Prevent €5K-€100K warranty penalties

**6. Crew & Contact Management** (60-90 min)
- Marine operations directory
- Crew certifications, service provider ratings
- Emergency contact quick access
- **Value:** Save €500-€5K per repair in delays

**7. Compliance & Certification** (75-90 min)
- Regulatory compliance tracking
- Automated renewal alerts
- Expiration date management
- **Value:** Avoid €20K-€100K VAT penalties

**8. Fuel Log & Expense Tracker** (90-120 min)
- Fuel consumption tracking (MPG/GPH)
- Expense management with 15+ categories
- Budget vs actual comparison, charts
- CSV export for accounting
- **Value:** Uncover €60K-€100K annual hidden costs

---

## 💼 Integration Options (If Client Asks)

**WhatsApp Business API**
- Document upload via WhatsApp
- Warranty/maintenance alerts
- Natural language search
- **Cost:** €3-88/month (fleet size dependent)
- **Spec:** INTEGRATION_WHATSAPP.md (1,178 lines)

**Claude CLI Chatbox**
- AI assistant with full document context
- Streaming responses
- "Search online" capability
- **Cost:** €0.30-4.50/month per user
- **Spec:** INTEGRATION_CLAUDE_CHATBOX.md (1,469 lines)

---

## 📋 Meeting Flow

### Opening (5 min)
1. Show feature selector URL
2. Explain purpose: "Select what you want, we'll build it"
3. Note: 3 features already working, 5 ready to build

### Feature Walkthrough (30 min)
**For each feature:**
1. Read feature description from selector
2. Ask: "Is this valuable for your customers?"
3. Mark YES/MAYBE/LATER
4. Capture notes in textarea
5. Discuss build time estimate

### Demo (10 min)
1. Show https://digital-lab.ca/navidocs/demo/
2. Upload sample document
3. Perform search
4. Show timeline

### Next Steps (5 min)
1. Export feature selection (JSON)
2. Discuss timeline: 90-120 min per feature
3. Pricing discussion (if applicable)
4. Pilot boat selection

### Closing (5 min)
1. Send exported JSON via email
2. Schedule follow-up
3. Thank you

---

## 🚀 After Meeting

**Immediate:**
1. Save exported JSON from feature selector
2. Review notes from meeting
3. Send thank you email with feature selector link

**Next 24 Hours:**
1. Launch cloud sessions for selected features (Sessions 6-10)
2. Each session: 90-120 minutes build time
3. Use INSTRUCTIONS_FOR_ALL_SESSIONS.md for coordination

**Files Created:**
- `/home/setup/navidocs/feature-selection-riviera-[DATE].json` (from export)
- `/home/setup/navidocs/MEETING_NOTES_RIVIERA_PLAISANCE.md` (create after meeting)

---

## ⚠️ Important Notes

**Technical Constraints:**
- StackCP has NO Node.js runtime (PHP/Python only)
- Backend requires external VPS deployment
- Meilisearch already running on StackCP (port 7700)

**Build Capacity:**
- 5+ cloud sessions can work in parallel
- Self-coordinating via GitHub master doc
- Total build time: ~450-600 minutes (7-10 hours) for all 5 features

**Pricing Positioning:**
- Position as "included with every boat sale"
- Creates sticky relationship with customers
- Reduces broker support calls
- Increases resale value documentation

---

## 📞 Contact for Questions

**During Meeting:**
- Feature selector has TTT citations (source files)
- Intelligence brief for technical deep-dive
- LOCAL_DEVELOPMENT_SETUP.md for "can we run this locally?"

**After Meeting:**
- GitHub: https://github.com/dannystocker/navidocs
- Branch: navidocs-cloud-coordination
- Latest commit: 60c73bb

---

**You're ready! All materials live and tested. Good luck with Riviera Plaisance! 🚀**
