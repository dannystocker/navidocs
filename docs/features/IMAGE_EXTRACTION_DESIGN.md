# Image Extraction & OCR Design

**Purpose:** Extract images from PDFs, run OCR on them, and anchor to surrounding text

**Last Updated:** 2025-10-19

---

## Requirements

1. **Extract all images from PDF documents**
2. **Run OCR on extracted images** (images contain text)
3. **Anchor images to nearby document text**
4. **Store image positions and relationships**
5. **Display images in document viewer with text**

---

## Architecture

### 1. Image Extraction Pipeline

```
PDF Upload
    ↓
OCR Worker Processes PDF
    ↓
├─ Extract Page Text (existing)
├─ Extract Page Images (NEW)
│    ↓
│    ├─ Save images to: /uploads/{docId}/images/
│    ├─ Run Tesseract OCR on each image
│    └─ Store image metadata + text
└─ Build Image-Text Relationships
     ↓
Store in Database + Index in Meilisearch
```

### 2. Database Schema

```sql
-- New table for extracted images
CREATE TABLE document_images (
  id TEXT PRIMARY KEY,
  documentId TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  pageNumber INTEGER NOT NULL,
  imageIndex INTEGER NOT NULL,  -- 0, 1, 2 for multiple images per page
  imagePath TEXT NOT NULL,      -- /uploads/{docId}/images/page-{N}-img-{M}.png
  imageFormat TEXT DEFAULT 'png',
  width INTEGER,
  height INTEGER,
  position JSON,                -- {x, y, width, height} on page
  extractedText TEXT,           -- OCR text from the image
  textConfidence REAL,          -- Average OCR confidence
  anchorTextBefore TEXT,        -- Text snippet before image
  anchorTextAfter TEXT,         -- Text snippet after image
  createdAt INTEGER NOT NULL,
  UNIQUE(documentId, pageNumber, imageIndex)
);

CREATE INDEX idx_document_images_doc ON document_images(documentId);
CREATE INDEX idx_document_images_page ON document_images(documentId, pageNumber);
```

### 3. File Storage Structure

```
/uploads/
  {documentId}/
    document.pdf              -- Original PDF
    images/
      page-1-img-0.png       -- First image on page 1
      page-1-img-1.png       -- Second image on page 1
      page-2-img-0.png       -- First image on page 2
      ...
```

---

## Implementation Plan

### Phase 1: Backend Image Extraction

**File:** `server/workers/image-extractor.js`

```javascript
import { fromPath } from 'pdf2pic';
import Jimp from 'jimp';
import Tesseract from 'tesseract.js';

async function extractImagesFromPDF(pdfPath, documentId) {
  // 1. Convert PDF pages to images
  // 2. For each page, detect image regions
  // 3. Crop out images
  // 4. Run OCR on each image
  // 5. Save images + metadata
  // 6. Return array of image objects
}
```

**Dependencies needed:**
- `pdf2pic` - Convert PDF to images
- `jimp` - Image manipulation
- `pdfjs-dist` - More precise PDF parsing (optional)

### Phase 2: OCR Worker Integration

**File:** `server/workers/ocr-worker.js`

Add after page text extraction:

```javascript
// Extract images from this page
const pageImages = await extractImagesFromPage(pdfPath, pageNum, documentId);

// For each image
for (const img of pageImages) {
  // Run Tesseract OCR
  const ocrResult = await Tesseract.recognize(img.path);

  // Store in database
  await db.run(`
    INSERT INTO document_images (
      id, documentId, pageNumber, imageIndex,
      imagePath, extractedText, textConfidence,
      position, width, height
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    img.id, documentId, pageNum, img.index,
    img.path, ocrResult.data.text, ocrResult.data.confidence,
    JSON.stringify(img.position), img.width, img.height
  ]);

  // Index image text in Meilisearch
  await meilisearch.addDocuments([{
    id: img.id,
    type: 'image',
    documentId,
    pageNumber: pageNum,
    content: ocrResult.data.text,
    ...
  }]);
}
```

### Phase 3: Image-Text Anchoring

**Algorithm:**
```javascript
function findAnchorText(pageText, imagePosition, pageNumber) {
  // Parse page text with positions
  const textBlocks = parseTextWithPositions(pageText);

  // Find text blocks near image
  const beforeImage = textBlocks.filter(b =>
    b.position.y < imagePosition.y &&
    b.position.y > imagePosition.y - 100
  );

  const afterImage = textBlocks.filter(b =>
    b.position.y > imagePosition.y + imagePosition.height &&
    b.position.y < imagePosition.y + imagePosition.height + 100
  );

  return {
    before: beforeImage.map(b => b.text).join(' '),
    after: afterImage.map(b => b.text).join(' ')
  };
}
```

### Phase 4: API Endpoints

**New routes:**

```javascript
// Get all images for a document
GET /api/documents/:id/images
Response: [
  {
    id, pageNumber, imageIndex, imagePath,
    extractedText, position,
    anchorTextBefore, anchorTextAfter
  }
]

// Get specific image file
GET /api/images/:imageId
Response: PNG file (stream)

// Get images for a specific page
GET /api/documents/:id/pages/:pageNum/images
Response: Array of images on that page
```

### Phase 5: Frontend Integration

**Document Viewer Updates:**

1. Fetch images for current page
2. Display images at correct positions
3. Show extracted text on hover
4. Link to anchor text

```vue
<template>
  <div class="pdf-page">
    <canvas ref="pdfCanvas"></canvas>

    <!-- Overlay images on canvas -->
    <div v-for="img in pageImages" :key="img.id"
         class="page-image-overlay"
         :style="{
           left: img.position.x + 'px',
           top: img.position.y + 'px',
           width: img.position.width + 'px',
           height: img.position.height + 'px'
         }">
      <img :src="`/api/images/${img.id}`"
           :alt="img.extractedText"
           @click="showImageDetail(img)" />
    </div>
  </div>
</template>
```

---

## Technical Challenges

### Challenge 1: Image Detection in PDF

**Problem:** PDFs can embed images in various ways
**Solutions:**
- Use `pdfjs-dist` to parse PDF structure and find image objects
- Alternative: Use `pdf2image` + image detection algorithms
- Fallback: User manual image selection

### Challenge 2: Image Quality for OCR

**Problem:** Extracted images may be low quality
**Solutions:**
- Use high DPI when converting PDF to images (300+ DPI)
- Apply image enhancement before OCR (contrast, sharpening)
- Use Tesseract preprocessing options

### Challenge 3: Positioning Accuracy

**Problem:** Mapping PDF coordinates to canvas coordinates
**Solutions:**
- Store positions as percentages, not absolute pixels
- Scale positions based on viewport
- Test with various PDF sizes

---

## Performance Considerations

### Storage
- **Images:** ~500KB per image (PNG)
- **100-page doc with 5 images/page:** ~250MB
- **Solution:** Store as JPEG with quality 85%, or use WebP

### Processing Time
- **Image extraction:** ~1s per page
- **OCR per image:** ~2-3s per image
- **100-page doc with 5 images/page:** ~15-20 minutes
- **Solution:** Process in background, show progress

### Meilisearch Indexing
- Index image text separately
- Tag with `type: 'image'` for filtering
- Include `documentId`, `pageNumber` for joining

---

## Testing Strategy

### Test Cases

1. **Single image per page**
   - Extract: ✓
   - OCR: ✓
   - Display: ✓

2. **Multiple images per page**
   - Extract all: ✓
   - Correct order: ✓
   - No duplicates: ✓

3. **Images with text**
   - OCR accuracy > 80%: ✓
   - Text searchable: ✓

4. **Large PDFs (100+ pages)**
   - Processing completes: ✓
   - Progress tracking: ✓
   - No memory leaks: ✓

5. **Edge cases**
   - No images: Handle gracefully
   - Corrupted images: Skip and log
   - Very large images: Resize before OCR

---

## Migration Path

### Step 1: Add Database Table
```bash
sqlite3 data/navidocs.db < migrations/add_document_images.sql
```

### Step 2: Install Dependencies
```bash
npm install pdf2pic jimp tesseract.js
```

### Step 3: Deploy OCR Worker Update
```bash
pm2 restart ocr-worker
```

### Step 4: Process Existing Documents
```bash
node scripts/reprocess-documents-with-images.js
```

---

## Future Enhancements

1. **Image Classification**
   - Diagrams vs photos vs charts
   - Use ML model for categorization

2. **Smart Cropping**
   - Detect diagram boundaries automatically
   - Remove whitespace

3. **Image Search**
   - Search by image content (visual similarity)
   - Search text within images

4. **Annotations**
   - Allow users to annotate images
   - Link annotations to text

---

## API Examples

### Get Document Images
```bash
curl http://localhost:8001/api/documents/{id}/images
```

Response:
```json
{
  "images": [
    {
      "id": "img-uuid-1",
      "documentId": "doc-123",
      "pageNumber": 1,
      "imageIndex": 0,
      "imagePath": "/uploads/doc-123/images/page-1-img-0.png",
      "extractedText": "Figure 1: System Architecture Diagram showing...",
      "textConfidence": 0.89,
      "position": { "x": 100, "y": 200, "width": 400, "height": 300 },
      "anchorTextBefore": "The following diagram illustrates",
      "anchorTextAfter": "As shown in the figure above"
    }
  ]
}
```

---

**Status:** Design Complete - Ready for Implementation
**Estimated Dev Time:** 2-3 days
**Priority:** HIGH (Essential feature)
