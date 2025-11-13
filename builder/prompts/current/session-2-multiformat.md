# Cloud Session 2: Multi-Format Upload Support

**Session ID:** session-2
**Role:** File Processing Engineer
**Priority:** P1 (Feature expansion)
**Estimated Time:** 90 minutes
**Dependencies:** None (parallel with Session 1)

---

## Your Mission

Enable NaviDocs to accept JPG, PNG, DOCX, XLSX, TXT, MD files in addition to PDFs.

**Current Limitation:**
- Only `.pdf` files accepted
- `file-safety.js` hardcoded to PDF-only
- No image, Office, or text document support

**Expected Outcome:**
- Upload images directly (JPG, PNG, WebP)
- Upload Word documents (DOCX) with text extraction
- Upload Excel spreadsheets (XLSX) with data extraction
- Upload plain text/markdown (TXT, MD)

---

## Implementation Steps

### Step 1: Install Dependencies (5 min)
```bash
cd /home/setup/navidocs/server
npm install mammoth xlsx
```

### Step 2: Update File Validation (15 min)

**File:** `server/services/file-safety.js`

```javascript
const ALLOWED_EXTENSIONS = [
  // Documents
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.txt', '.md',
  // Images
  '.jpg', '.jpeg', '.png', '.webp'
];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
  'image/jpeg',
  'image/png',
  'image/webp'
];

export function getFileCategory(filename) {
  const ext = path.extname(filename).toLowerCase();

  if (['.pdf'].includes(ext)) return 'pdf';
  if (['.doc', '.docx'].includes(ext)) return 'word';
  if (['.xls', '.xlsx'].includes(ext)) return 'excel';
  if (['.txt', '.md'].includes(ext)) return 'text';
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'image';

  return 'unknown';
}
```

### Step 3: Create Document Processor Router (40 min)

**File:** `server/services/document-processor.js` (NEW)

```javascript
import { extractTextFromPDF } from './ocr.js';
import { extractTextFromImage } from './ocr.js';
import { getFileCategory } from './file-safety.js';
import { readFileSync } from 'fs';
import mammoth from 'mammoth';
import XLSX from 'xlsx';

export async function processDocument(filePath, options = {}) {
  const category = getFileCategory(filePath);

  console.log(`[Document Processor] Processing ${category}: ${filePath}`);

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
      throw new Error(`Unsupported file type: ${category}`);
  }
}

async function processImageFile(imagePath, options = {}) {
  const { language = 'eng' } = options;

  console.log('[Image Processor] Running OCR...');
  const ocrResult = await extractTextFromImage(imagePath, language);

  return [{
    pageNumber: 1,
    text: ocrResult.text,
    confidence: ocrResult.confidence,
    method: 'tesseract-ocr'
  }];
}

async function processWordDocument(docPath, options = {}) {
  console.log('[Word Processor] Extracting text from DOCX...');

  const result = await mammoth.extractRawText({ path: docPath });
  const text = result.value;

  return [{
    pageNumber: 1,
    text: text,
    confidence: 0.99,
    method: 'native-extraction'
  }];
}

async function processExcelDocument(xlsPath, options = {}) {
  console.log('[Excel Processor] Reading workbook...');

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

### Step 4: Update OCR Worker (10 min)

**File:** `server/workers/ocr-worker.js` (line 96)

```javascript
// OLD:
const ocrResults = await extractTextFromPDF(filePath, {
  language: document.language || 'eng',
  onProgress: updateProgress
});

// NEW:
import { processDocument } from '../services/document-processor.js';

const ocrResults = await processDocument(filePath, {
  language: document.language || 'eng',
  onProgress: updateProgress
});
```

### Step 5: Update Frontend Upload Form (20 min)

**File:** `client/src/components/UploadForm.vue`

```vue
<input
  type="file"
  accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.txt,.md"
  @change="handleFileSelect"
/>

<div class="file-types-info">
  Supported: PDF, Images (JPG/PNG), Word, Excel, Text/Markdown
</div>
```

### Step 6: Test Each File Type (20 min)

```bash
# Test image upload
curl -X POST http://localhost:8001/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-photo.jpg" \
  -F "title=Boat Engine Photo" \
  -F "documentType=photo" \
  -F "organizationId=$ORG_ID"

# Test Word document
curl -X POST http://localhost:8001/api/upload \
  -F "file=@service-report.docx" \
  -F "title=2024 Service Report" \
  -F "documentType=service-record" \
  -F "organizationId=$ORG_ID"

# Test Excel
curl -X POST http://localhost:8001/api/upload \
  -F "file=@parts-inventory.xlsx" \
  -F "title=Parts Inventory 2024" \
  -F "documentType=inventory" \
  -F "organizationId=$ORG_ID"

# Test text file
curl -X POST http://localhost:8001/api/upload \
  -F "file=@maintenance-notes.txt" \
  -F "title=Maintenance Notes" \
  -F "documentType=notes" \
  -F "organizationId=$ORG_ID"
```

---

## Success Criteria

- [ ] `mammoth` and `xlsx` installed
- [ ] `file-safety.js` updated with all file types
- [ ] `document-processor.js` created with routing logic
- [ ] `ocr-worker.js` updated to use processor
- [ ] Frontend accepts multiple file types
- [ ] All file types upload and index successfully
- [ ] Search works across all document types

---

## Reporting

```bash
/tmp/send-to-cloud.sh 2 "COMPLETE: Multi-Format Upload" "
✅ Multi-format upload implemented
- Supported: PDF, JPG, PNG, DOCX, XLSX, TXT, MD
- All processors tested and working
- Search indexes all file types
- Frontend updated
- 5 test uploads successful
"
```

---

**Start immediately - independent of Session 1.**
