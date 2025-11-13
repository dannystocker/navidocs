# NaviDocs Cloud Session Prompts

**Created:** 2025-11-13
**Purpose:** Centralized prompt library for cloud-based development sessions
**Access:** https://github.com/dannystocker/navidocs/tree/navidocs-cloud-coordination/builder/prompts

---

## Directory Structure

```
builder/prompts/
├── README.md (this file)
├── current/          # Active feature development (PRIORITY)
├── implementation/   # MVP feature builds
└── research/         # Strategy and planning sessions
```

---

## 🚀 Current Sessions (Start Here!)

**Location:** `builder/prompts/current/`

These are the **ACTIVE** sessions for the v0.5 → v1.0 feature roadmap:

### Session 1: Smart OCR Optimization
**File:** `current/session-1-smart-ocr.md`
**Branch:** `feature/smart-ocr`
**Duration:** 60 minutes
**Priority:** P0 (36x performance improvement)

**Goal:** Extract native PDF text first, only OCR scanned pages
**Performance:** 180s → 5s for text-heavy PDFs
**Dependencies:** `npm install pdfjs-dist`

**Quick Start:**
```bash
git checkout -b feature/smart-ocr
# Follow prompt instructions
```

---

### Session 2: Multi-Format Upload
**File:** `current/session-2-multiformat.md`
**Branch:** `feature/multiformat`
**Duration:** 90 minutes
**Priority:** P1 (Feature expansion)

**Goal:** Support JPG, PNG, DOCX, XLSX, TXT, MD uploads
**Dependencies:** `npm install mammoth xlsx`

**Quick Start:**
```bash
git checkout -b feature/multiformat
# Follow prompt instructions
```

---

### Session 3: Timeline Feature (TBD)
**File:** `current/session-3-timeline.md`
**Branch:** `feature/timeline`
**Duration:** 2 hours (backend + frontend)
**Priority:** P1 (Core demo feature)

**Goal:** Organization activity timeline (uploads, maintenance, events)
**Spec:** `/home/setup/navidocs/FEATURE_SPEC_TIMELINE.md`

---

## 📦 Implementation Sessions

**Location:** `builder/prompts/implementation/`

These prompts build **MVP features** for the Riviera Plaisance demo:

1. **Photo Inventory** - Boat photo upload with tag filtering
2. **Document Search** - Smart classifier + ranking
3. **Maintenance Timeline** - Service alerts + history
4. **Demo Polish** - UI/UX optimization
5. **Integration Testing** - Quality gate + sign-off

**Use Case:** Sequential deployment for demo readiness (7.5 hours total)

**Index File:** See `CLOUD_PROMPTS_INDEX.md` for full details

---

## 🔬 Research Sessions

**Location:** `builder/prompts/research/`

These prompts perform **deep analysis** and **strategic planning**:

1. **Market Research** - Competitive intelligence + TAM/SAM
2. **Technical Integration** - Architecture + API design
3. **UX + Sales Enablement** - Pitch deck + ROI calculator
4. **Implementation Planning** - 4-week sprint breakdown
5. **Synthesis + Validation** - Guardian review + dossier

**Use Case:** Strategic planning before feature builds

---

## 🔄 Polling for Updates

Cloud sessions should poll this directory for updated instructions:

```bash
# Check for new prompts or updates every 15 minutes
git fetch origin
git diff origin/navidocs-cloud-coordination -- builder/prompts/
```

**Update Notifications:**
- New files indicate new sessions available
- Modified files indicate updated instructions
- Check `README.md` for announcements

---

## 📋 Session Launch Protocol

### For Cloud Session Operators:

1. **Read the prompt file** - Understand mission + success criteria
2. **Create feature branch** - Use naming convention: `feature/[name]`
3. **Follow implementation steps** - Code, test, document
4. **Commit with tag** - Use `[SESSION-N]` prefix
5. **Report completion** - Create `SESSION-N-COMPLETE.md` summary
6. **Push to GitHub** - `git push origin feature/[name]`

### Communication:
- Progress updates every 30 minutes
- Blockers escalated within 15 minutes
- Completion report required before next session

---

## 🎯 Success Criteria

Each prompt includes specific success criteria. General requirements:

- ✅ All code committed to feature branch
- ✅ Tests passing (if applicable)
- ✅ No regressions in existing functionality
- ✅ Documentation updated
- ✅ Session completion report created

---

## 🚨 If Blocked

**Check these resources:**
1. `/home/setup/navidocs/SESSION_DEBUG_BLOCKERS.md` - Known issues
2. `/home/setup/navidocs/ARCHITECTURE-SUMMARY.md` - System overview
3. GitHub Issues - Open issue with `[BLOCKER]` tag

**Escalation Path:**
1. Try 2 workarounds first (15 min max)
2. Document blocker clearly
3. Signal for help via GitHub Issue or session report

---

## 📊 Status Dashboard

| Session | Status | Branch | Completion |
|---------|--------|--------|------------|
| Session 1: Smart OCR | ⏳ Ready | `feature/smart-ocr` | 0% |
| Session 2: Multi-format | ⏳ Ready | `feature/multiformat` | 0% |
| Session 3: Timeline | 📝 Planning | `feature/timeline` | 0% |
| Session 4: TBD | 💤 Pending | - | 0% |
| Session 5: TBD | 💤 Pending | - | 0% |

**Last Updated:** 2025-11-13 13:05 UTC
**Next Review:** After Session 1 completion

---

## 🔗 Key Links

- **GitHub Repo:** https://github.com/dannystocker/navidocs
- **Working Branch:** `navidocs-cloud-coordination`
- **Demo Tag:** `v0.5-demo-ready`
- **Local Dev:** `/home/setup/navidocs`

**API Endpoints:**
- Backend: http://localhost:8001
- Frontend: http://localhost:8081
- Meilisearch: http://localhost:7700

**Test Credentials:**
- User: test2@navidocs.test
- Pass: TestPassword123
- Org ID: 6ce0dfc7-f754-4122-afde-85154bc4d0ae

---

## 📝 Version History

| Date | Change | Commit |
|------|--------|--------|
| 2025-11-13 | Initial prompts directory created | TBD |
| 2025-11-13 | Added current/ implementation/ research/ structure | TBD |

---

**Welcome to NaviDocs builder system! 🚢**

Start with `current/session-1-smart-ocr.md` for immediate impact.
