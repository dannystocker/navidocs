# Welcome Cloud Session 1: Smart OCR Engineer

**Your Role:** OCR Optimization Specialist
**Your Machine:** Browser-based Claude Code Cloud (claude.ai)
**Session ID:** session-1
**Coordination:** Hub-and-spoke (report to local Sonnet orchestrator)
**Communication:** SSH file sync to StackCP server

---

## Quick Start (Copy-Paste This)

Hi Claude! You're **Session 1** in a 5-session cloud deployment for NaviDocs. Your job: **Implement smart OCR** that skips unnecessary Tesseract processing for PDFs with native text.

### Context

**Project:** NaviDocs - Boat documentation management system
**Tech Stack:** Node.js (Express) + Vue 3 + SQLite + Meilisearch
**Current Problem:** 100-page PDF with native text takes 3+ minutes to OCR (should be 5 seconds)
**Your Fix:** Add pdfjs-dist to extract native text first, only OCR scanned pages
**Performance Goal:** 36x speed improvement (180s → 5s)

**GitHub Repo:** https://github.com/dannystocker/navidocs
**Branch:** navidocs-cloud-coordination (v0.5-demo-ready tag)
**Your Feature Branch:** feature/smart-ocr

---

## Your Task Specification

### Files to Create/Modify

1. **server/services/pdf-text-extractor.js** (NEW)
   - Function: `extractNativeTextPerPage(pdfPath)`
   - Function: `hasNativeText(pdfPath, minChars = 100)`
   - Uses: `pdfjs-dist` library

2. **server/services/ocr.js** (MODIFY lines 36-96)
   - Add import: `pdf-text-extractor.js`
   - Add hybrid logic: Try native text first
   - If page has >50 chars native text, use it (confidence: 0.99)
   - If page has <50 chars, run Tesseract OCR
   - Add method field: `'native-extraction'` or `'tesseract-ocr'`

3. **server/.env** (ADD)
   ```env
   OCR_MIN_TEXT_THRESHOLD=50
   FORCE_OCR_ALL_PAGES=false
   ```

### Dependencies to Install
```bash
npm install pdfjs-dist
```

### Testing Strategy
```bash
# Test with reprocess script (should complete in ~5 seconds)
node server/scripts/reprocess-liliane.js

# Verify logs show:
# "[OCR Optimization] PDF has native text, extracting without OCR..."
# "[Native Text] Page 1/100 (2845 chars)"
```

---

## Code Example: pdf-text-extractor.js

```javascript
/**
 * Native PDF Text Extraction using pdfjs-dist
 * Extracts text directly from PDF without OCR
 */
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'fs';

export async function extractNativeTextPerPage(pdfPath) {
  const data = new Uint8Array(readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  const pageTexts = [];
  const pageCount = pdf.numPages;

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    pageTexts.push(pageText.trim());
  }

  return pageTexts;
}

export async function hasNativeText(pdfPath, minChars = 100) {
  try {
    const pageTexts = await extractNativeTextPerPage(pdfPath);
    const totalText = pageTexts.join('');
    return totalText.length >= minChars;
  } catch (error) {
    console.error('Error checking native text:', error);
    return false;
  }
}
```

---

## Communication Protocol

You're working **independently** but reporting to orchestrator via chat system.

**When you start work:**
```bash
# Signal you're active (use StackCP SSH access)
# Note: This is conceptual - actual implementation TBD based on your environment
echo "SESSION-1 STARTED: Smart OCR implementation" > status.txt
```

**Progress updates (every 30 min):**
- Report completion percentage
- Note any blockers
- Share preliminary test results

**When complete:**
```bash
# Report success
git commit -m "[Session 1] Smart OCR implemented - 36x performance gain"
git push origin feature/smart-ocr

# Create summary
cat > SESSION-1-COMPLETE.md <<EOF
✅ Smart OCR Implementation - COMPLETE

**Changes:**
- Created: server/services/pdf-text-extractor.js
- Modified: server/services/ocr.js (hybrid logic)
- Dependency: pdfjs-dist@4.0.379

**Test Results:**
- Liliane1 PDF (100 pages): 180s → 6s (30x faster)
- Scanned PDFs: Still work via Tesseract fallback
- Native text pages: 0.99 confidence
- OCR pages: 0.85 average confidence

**Commit:** [hash]
**Branch:** feature/smart-ocr
**Status:** Ready for merge
EOF
```

**If you hit blockers:**
- Document the issue clearly
- Try 2 workarounds before escalating
- If stuck >15 minutes, signal for help

---

## Success Criteria

- [ ] `pdfjs-dist` installed successfully
- [ ] `pdf-text-extractor.js` created with 2 functions
- [ ] `ocr.js` modified with hybrid logic
- [ ] Test document processes in <10 seconds (down from 180s)
- [ ] Scanned PDFs still work correctly
- [ ] Code committed to feature branch
- [ ] Unit tests pass (if applicable)
- [ ] No regressions in existing OCR functionality

---

## Environment Setup

**If you don't have NaviDocs cloned:**
```bash
git clone https://github.com/dannystocker/navidocs.git
cd navidocs
git checkout navidocs-cloud-coordination
git pull origin navidocs-cloud-coordination
git checkout -b feature/smart-ocr

# Install dependencies
cd server
npm install
npm install pdfjs-dist

# Set up environment
cp .env.example .env
```

**Test data location:**
- Liliane1 manual: `/home/setup/navidocs/uploads/efb25a15-7d84-4bc3-b070-6bd7dec8d59a.pdf`
- Test user: `test2@navidocs.test` / `TestPassword123`
- Organization: `6ce0dfc7-f754-4122-afde-85154bc4d0ae`

---

## Key Files to Read First

1. `server/services/ocr.js` (existing OCR logic)
2. `server/workers/ocr-worker.js` (how OCR is called)
3. `IMPROVEMENT_PLAN_OCR_AND_UPLOADS.md` (full spec)
4. `server/scripts/reprocess-liliane.js` (test script)

---

## Timeline

- **T+0 min:** Read this prompt, clone repo, read existing code
- **T+15 min:** Create pdf-text-extractor.js
- **T+30 min:** Modify ocr.js with hybrid logic
- **T+45 min:** Test with Liliane1 PDF
- **T+60 min:** Verify scanned PDFs still work, commit, report complete

---

## Dependencies on Other Sessions

**None - you can start immediately!**
Sessions 2-5 are working in parallel on different features.

---

## Questions?

Read the code first, then:
1. Check `IMPROVEMENT_PLAN_OCR_AND_UPLOADS.md` for detailed spec
2. Review existing `ocr.js` to understand current flow
3. Test incrementally (don't wait until the end)
4. Commit early, commit often

---

**You're autonomous! Start as soon as you're ready. Good luck, Session 1! 🚀**

**Claude Code URL:** https://claude.com/claude-code
**Repo:** https://github.com/dannystocker/navidocs
**Your Branch:** feature/smart-ocr
