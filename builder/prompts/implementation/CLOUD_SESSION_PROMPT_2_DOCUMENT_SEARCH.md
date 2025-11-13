# Cloud Session 2: Advanced Document Search

**Session ID:** CLOUD-2-DOCUMENT-SEARCH
**Timeline:** 90 minutes
**Deadline:** 4 hours from now (Riviera Plaisance presentation)
**Target:** Ship OCR search + document classifier improvements

---

## Your Mission

Improve the document search experience so boat owners can find maintenance manuals, insurance papers, warranty docs instantly. Current system works but needs:
- **Sticky engagement:** "Where's my engine manual?" → answers in 2 seconds
- **OCR accuracy:** Text extraction from boat documents (technical manuals, warranty cards, insurance papers)
- **Smart grouping:** Show warranty + insurance + service history together
- **Auto-tagging:** Classify documents by type (engine, electrical, safety equipment, etc.)

This prevents **"Where's the engine manual?" crisis** during mechanical emergencies.

---

## Quick Start

1. **Clone repo:**
   ```bash
   git clone https://github.com/dannystocker/navidocs.git && cd navidocs
   ```

2. **Read context:**
   - `OCR_PIPELINE_SETUP.md` - Current OCR implementation (Tesseract + Google Vision)
   - `BUILD_COMPLETE.md` - What search features already work

3. **Check Meilisearch status:**
   ```bash
   curl http://localhost:7700/health
   ```

4. **Review OCR API:**
   ```bash
   grep -r "ocr\|vision" src/api/
   ```

---

## Your Task List

- [ ] **Diagnostic:** Review current OCR results quality
  - Upload 5 test documents (warranty card, engine manual, insurance doc)
  - Check extraction quality (confidence scores, missing text?)
  - Document findings in `SEARCH_QUALITY_REPORT.md`

- [ ] **Implement:** Smart document classifier
  - Add `documentType` field to Document table (engine, electrical, hull, interior, warranty, insurance, service, safety)
  - Create classifier endpoint: `POST /api/documents/classify` (reads OCR text → returns type)
  - Support manual override (user selects type if AI wrong)

- [ ] **Improve:** Search results ranking
  - Boost warranty + service docs to top
  - Show document type icon + confidence score
  - Group results by document type

- [ ] **Test:** Search UX with real documents
  - "engine manual" → Find service manuals
  - "warranty" → Find all warranty cards + service plans
  - "electrical" → Find electrical system diagrams + parts docs

- [ ] **API endpoints:**
  - `POST /api/documents/classify` - Auto-classify document type
  - `GET /api/documents/by-type/:type` - Filter by type
  - `GET /api/search/advanced` - Enhanced search with type + relevance ranking

- [ ] **Git commit:** `[AGENT-2] Add document classifier and search ranking`
- [ ] **Create issue:** `[AGENT-2] DEPLOY-READY: Document Search Improvements` with:
  - Test results (5 documents, accuracy %)
  - Search quality report
  - Performance metrics (search latency)
  - Deployment checklist

---

## Technical Context

**Current Stack:**
- OCR Pipeline: Tesseract (local) + Google Vision API (backup)
- Search Engine: Meilisearch (localhost:7700)
- Database: PostgreSQL - `Document` table with `content` field (OCR extracted text)
- Frontend: Next.js search UI component

**Key Files:**
- `src/api/ocr/route.ts` - Current OCR implementation
- `src/api/search/route.ts` - Search endpoint
- `src/components/DocumentSearch.tsx` - Search UI
- `prisma/schema.prisma` - Document model

**Design Specs:**
- Document types: engine, electrical, hull, interior, warranty, insurance, service, safety, other
- OCR text stored in `Document.content` (PostgreSQL)
- Meilisearch index includes: title, type, confidence, upload_date
- Search results show: document title, type badge, 2-line preview, relevance score

---

## Sample Test Documents

Create these for testing OCR quality:

1. **Engine Manual** - Technical specifications, maintenance schedule
2. **Warranty Card** - Registration, coverage terms, contact info
3. **Insurance Document** - Policy details, coverage limits
4. **Service Record** - Date, service performed, parts replaced
5. **Electrical Diagram** - System schematic with part numbers

**Quality Thresholds:**
- OCR confidence >85% = no review needed
- 70-85% = flag for manual review
- <70% = skip from search (mark as low-confidence)

---

## Critical Notes

1. **Boat owner pain point:** Mechanical emergency at 2am, need engine manual NOW
2. **Search must be fast:** <500ms response time (cached results)
3. **OCR accuracy matters:** Wrong document type = wrong answers
4. **Offline support:** Downloaded documents searchable without internet
5. **Mobile first:** Search on small screens must work perfectly

---

## GitHub Access

- **Repo:** https://github.com/dannystocker/navidocs
- **Branch:** `feature/document-search` (create from main)
- **Base for PR:** main branch

---

## Success Criteria

✅ Document classifier working (type detection >80% accurate)
✅ Search results ranked by type + relevance
✅ Test documents fully searchable
✅ OCR quality report completed
✅ API endpoints tested and working
✅ No console errors
✅ Git commit with [AGENT-2] tag

---

## If Blocked

1. Check Google Vision API credentials: `echo $GOOGLE_VISION_API_KEY`
2. Verify Tesseract installed: `tesseract --version`
3. Review current OCR: `cat OCR_PIPELINE_SETUP.md`
4. Check Meilisearch index: `curl http://localhost:7700/indexes/documents/stats`
5. Create blocker issue: `[AGENT-2] BLOCKER: [description]`

---

## Reference Files

- `OCR_PIPELINE_SETUP.md` - Complete OCR setup guide
- `ARCHITECTURE-SUMMARY.md` - System architecture
- `SMOKE_TEST_CHECKLIST.md` - Testing procedures
