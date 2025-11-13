# NaviDocs Improvement Plan: Smart OCR + Multi-Format Upload

**Status:** Ready for implementation
**Estimated Time:** 2-3 hours
**Priority:** P1 (Performance + Feature)

---

## Problem 1: Inefficient OCR Processing

### Current Behavior
- **ALL PDF pages** go through Tesseract OCR, even if they contain native text
- Liliane1 manual (100 pages, mostly text) took 3+ minutes to OCR
- CPU-intensive: ~1.5 seconds per page
- `pdf-parse` library is installed but only used for page count

### Solution: Hybrid Text Extraction

**File:** `server/services/ocr.js` (lines 36-96)

```javascript
export async function extractTextFromPDF(pdfPath, options = {}) {
  const { language = 'eng', onProgress, forceOCR = false } = options;

  try {
    const pdfBuffer = readFileSync(pdfPath);
    const pdfData = await pdf(pdfBuffer);
    const pageCount = pdfData.numpages;

    console.log(`OCR: Processing ${pageCount} pages from ${pdfPath}`);

    const results = [];

    // NEW: Try native text extraction first
    let nativeText = pdfData.text?.trim() || '';

    // If PDF has native text and we're not forcing OCR
    if (nativeText.length > 100 && !forceOCR) {
      console.log(`[OCR Optimization] PDF has native text (${nativeText.length} chars), extracting per-page...`);

      // Extract text page by page using pdf-lib or pdfjs-dist
      const pageTexts = await extractNativeTextPerPage(pdfPath, pageCount);

      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const pageText = pageTexts[pageNum - 1] || '';

        // If page has substantial native text (>50 chars), use it
        if (pageText.length > 50) {
          results.push({
            pageNumber: pageNum,
            text: pageText.trim(),
            confidence: 0.99, // Native text = high confidence
            method: 'native-extraction'
          });

          console.log(`OCR: Page ${pageNum}/${pageCount} native text (${pageText.length} chars, no OCR needed)`);
        } else {
          // Page has little/no text, run OCR (likely image/diagram)
          const imagePath = await convertPDFPageToImage(pdfPath, pageNum);
          const ocrResult = await runTesseractOCR(imagePath, language);

          results.push({
            pageNumber: pageNum,
            text: ocrResult.text.trim(),
            confidence: ocrResult.confidence,
            method: 'tesseract-ocr'
          });

          unlinkSync(imagePath);
          console.log(`OCR: Page ${pageNum}/${pageCount} OCR (confidence: ${ocrResult.confidence.toFixed(2)})`);
        }

        if (onProgress) onProgress(pageNum, pageCount);
      }

      return results;
    }

    // Fallback: Full OCR (scanned PDF or forced)
    console.log('[OCR] No native text found, running full Tesseract OCR...');

    // ... existing OCR code ...
  }
}

// NEW FUNCTION: Extract native text per page
async function extractNativeTextPerPage(pdfPath, pageCount) {
  // Use pdfjs-dist for robust per-page extraction
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const data = new Uint8Array(readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  const pageTexts = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    pageTexts.push(pageText);
  }

  return pageTexts;
}
```

**Dependencies to Install:**
```bash
npm install pdfjs-dist
```

**Expected Performance Gains:**
- Liliane1 (100 pages): **3 minutes → 5 seconds** (36x faster!)
- Text-heavy PDFs: ~99% reduction in processing time
- Scanned PDFs: No change (still needs OCR)

**Configuration Option:**
```env
# .env
FORCE_OCR_ALL_PAGES=false  # Set true to always OCR (for testing)
OCR_MIN_TEXT_THRESHOLD=50  # Minimum chars to consider "native text"
```

---

## Problem 2: PDF-Only Upload Limitation

### Current Behavior
- Only `.pdf` files accepted
- File validation: `server/services/file-safety.js` (lines 10-11)
- No support for JPG, MD, TXT, DOC, XLS

### Solution: Multi-Format Document Processing

**Step 1: Update File Validation**

**File:** `server/services/file-safety.js`

```javascript
const ALLOWED_EXTENSIONS = [
  // Documents
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.txt', '.md',

  // Images
  '.jpg', '.jpeg', '.png', '.webp',

  // Optional: Presentations
  '.ppt', '.pptx'
];

const ALLOWED_MIME_TYPES = [
  // PDFs
  'application/pdf',

  // Microsoft Office
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  // Text
  'text/plain',
  'text/markdown',

  // Images
  'image/jpeg',
  'image/png',
  'image/webp'
];

// NEW: Detect file category
export function getFileCategory(filename) {
  const ext = path.extname(filename).toLowerCase();

  if (['.pdf'].includes(ext)) return 'pdf';
  if (['.doc', '.docx'].includes(ext)) return 'word';
  if (['.xls', '.xlsx'].includes(ext)) return 'excel';
  if (['.txt', '.md'].includes(ext)) return 'text';
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'image';
  if (['.ppt', '.pptx'].includes(ext)) return 'presentation';

  return 'unknown';
}
```

**Step 2: Create Processor Routing**

**File:** `server/services/document-processor.js` (NEW)

```javascript
/**
 * Route documents to appropriate processor based on file type
 */
import { extractTextFromPDF } from './ocr.js';
import { extractTextFromImage } from './ocr.js';
import { getFileCategory } from './file-safety.js';

export async function processDocument(filePath, options = {}) {
  const category = getFileCategory(filePath);

  console.log(`[Document Processor] Processing ${category} file: ${filePath}`);

  switch (category) {
    case 'pdf':
      return await extractTextFromPDF(filePath, options);

    case 'image':
      return await processImageFile(filePath, options);

    case 'word':
      return await processWordDocument(filePath, options);

    case 'excel':
      return await processExcelDocument(filePath, options);

    case 'text':
      return await processTextFile(filePath, options);

    default:
      throw new Error(`Unsupported file category: ${category}`);
  }
}

// Image files: Direct OCR
async function processImageFile(imagePath, options = {}) {
  const { language = 'eng' } = options;

  console.log('[Image Processor] Running OCR on image');
  const ocrResult = await extractTextFromImage(imagePath, language);

  return [{
    pageNumber: 1,
    text: ocrResult.text,
    confidence: ocrResult.confidence,
    method: 'tesseract-ocr'
  }];
}

// Word documents: Extract native text, then convert to PDF for images
async function processWordDocument(docPath, options = {}) {
  // Use mammoth.js to extract text from .docx
  const mammoth = await import('mammoth');

  const result = await mammoth.extractRawText({ path: docPath });
  const text = result.value;

  console.log(`[Word Processor] Extracted ${text.length} chars from DOCX`);

  return [{
    pageNumber: 1,
    text: text,
    confidence: 0.99,
    method: 'native-extraction'
  }];
}

// Excel: Extract text from cells
async function processExcelDocument(xlsPath, options = {}) {
  const XLSX = await import('xlsx');

  const workbook = XLSX.readFile(xlsPath);
  const sheets = [];

  workbook.SheetNames.forEach((sheetName, idx) => {
    const worksheet = workbook.Sheets[sheetName];
    const text = XLSX.utils.sheet_to_csv(worksheet);

    sheets.push({
      pageNumber: idx + 1,
      text: text,
      confidence: 0.99,
      method: 'native-extraction',
      sheetName: sheetName
    });
  });

  console.log(`[Excel Processor] Extracted ${sheets.length} sheets`);
  return sheets;
}

// Plain text / Markdown: Direct read
async function processTextFile(txtPath, options = {}) {
  const text = readFileSync(txtPath, 'utf-8');

  return [{
    pageNumber: 1,
    text: text,
    confidence: 1.0,
    method: 'native-extraction'
  }];
}
```

**Dependencies:**
```bash
npm install mammoth xlsx
```

**Step 3: Update OCR Worker**

**File:** `server/workers/ocr-worker.js` (line 96)

```javascript
// OLD:
const ocrResults = await extractTextFromPDF(filePath, {
  language: document.language || 'eng',
  onProgress: updateProgress
});

// NEW:
const ocrResults = await processDocument(filePath, {
  language: document.language || 'eng',
  onProgress: updateProgress
});
```

---

## Implementation Checklist

### Phase 1: Smart OCR (1 hour)
- [ ] Install `pdfjs-dist`: `npm install pdfjs-dist`
- [ ] Add `extractNativeTextPerPage()` function to `ocr.js`
- [ ] Modify `extractTextFromPDF()` to try native extraction first
- [ ] Add `OCR_MIN_TEXT_THRESHOLD` env variable
- [ ] Test with Liliane1 manual (should be 36x faster)
- [ ] Verify scanned PDFs still work

### Phase 2: Multi-Format Upload (1.5 hours)
- [ ] Update `ALLOWED_EXTENSIONS` and `ALLOWED_MIME_TYPES` in `file-safety.js`
- [ ] Create `getFileCategory()` function
- [ ] Install processors: `npm install mammoth xlsx`
- [ ] Create `document-processor.js` with routing logic
- [ ] Implement `processImageFile()`, `processWordDocument()`, etc.
- [ ] Update `ocr-worker.js` to use `processDocument()`
- [ ] Test each file type: JPG, TXT, DOCX, XLSX

### Phase 3: Frontend Updates (30 min)
- [ ] Update upload form to accept multiple file types
- [ ] Add file type icons (PDF, Word, Excel, Image, Text)
- [ ] Show file type badge in document list
- [ ] Update upload instructions

---

## Testing Plan

### Smart OCR Testing
```bash
# Test native text extraction
node -e "
const { extractTextFromPDF } = require('./server/services/ocr.js');
const result = await extractTextFromPDF('/path/to/text-pdf.pdf');
console.log('Method:', result[0].method); // Should be 'native-extraction'
console.log('Time:', result.processingTime); // Should be <5s
"

# Test scanned PDF still works
# Upload a scanned document, verify OCR runs
```

### Multi-Format Testing
```bash
# Test each file type
curl -X POST http://localhost:8001/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.jpg" \
  -F "title=Test Image" \
  -F "documentType=photo" \
  -F "organizationId=$ORG_ID"

# Repeat for: .txt, .docx, .xlsx, .md
```

---

## Performance Comparison

| Document Type | Before | After | Improvement |
|---------------|--------|-------|-------------|
| Text PDF (100p) | 180s | 5s | **36x faster** |
| Scanned PDF (100p) | 180s | 180s | No change (needs OCR) |
| DOCX (50 pages) | N/A | 2s | New feature |
| JPG (1 image) | N/A | 1.5s | New feature |
| XLSX (10 sheets) | N/A | 0.5s | New feature |

---

## Security Considerations

1. **Office Documents:** Use `mammoth` (safe) instead of LibreOffice (shell exec)
2. **File Size Limits:** Increase for images (currently 50MB)
3. **MIME Type Validation:** Already enforced via `file-type` library
4. **Malware Scanning:** Consider ClamAV integration for Office files

---

## Configuration Options

```env
# .env additions

# OCR Optimization
FORCE_OCR_ALL_PAGES=false
OCR_MIN_TEXT_THRESHOLD=50  # Chars per page to skip OCR

# File Upload
MAX_FILE_SIZE=52428800  # 50MB (existing)
MAX_IMAGE_SIZE=10485760  # 10MB for single images
ALLOWED_FILE_CATEGORIES=pdf,image,word,excel,text  # Comma-separated

# Optional: Office conversion
ENABLE_OFFICE_CONVERSION=true
OFFICE_MAX_PAGES=200  # Prevent huge spreadsheets
```

---

## Rollback Plan

If issues arise:
1. Set `FORCE_OCR_ALL_PAGES=true` to revert to old behavior
2. Remove new file types from `ALLOWED_EXTENSIONS`
3. Restart worker: `pm2 restart navidocs-worker`

---

**Next Steps:** Deploy Phase 1 (Smart OCR) first to get immediate performance gains on existing PDFs, then Phase 2 (Multi-format) for new features.
