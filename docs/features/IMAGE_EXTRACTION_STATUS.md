# Image Extraction Feature - Implementation Status

**Date:** 2025-10-19
**Priority:** HIGH (Essential Feature)
**Status:** In Progress

---

## ✅ Completed (Foundation)

### 1. Architecture Design
- [x] Comprehensive design document created
- [x] Database schema designed
- [x] API endpoints planned
- [x] Frontend integration designed
- [x] Testing strategy defined

**Document:** `/docs/features/IMAGE_EXTRACTION_DESIGN.md`

### 2. Database Schema
- [x] `document_images` table created
- [x] Indexes added for performance
- [x] Foreign key relationships established
- [x] Migration script (`004_add_document_images.sql`) applied successfully

**Table Structure:**
```sql
document_images (
  id, documentId, pageNumber, imageIndex,
  imagePath, width, height, position,
  extractedText,  -- OCR from image
  textConfidence,
  anchorTextBefore,  -- Nearby text
  anchorTextAfter
)
```

---

## 🚧 Remaining Work (Estimated: 2-3 days)

### Phase 1: Backend Image Extraction (8-10 hours)

**Dependencies to install:**
```bash
npm install pdf-img-convert sharp
# or
npm install pdfjs-dist
```

**Files to create/modify:**

1. **`server/workers/image-extractor.js`** (NEW)
   - Extract images from each PDF page
   - Save to `/uploads/{docId}/images/`
   - Return image metadata (position, size)

2. **`server/workers/ocr-worker.js`** (MODIFY)
   - After extracting page text, extract images
   - Run Tesseract OCR on each image
   - Store in `document_images` table
   - Index image text in Meilisearch

**Key Implementation:**
```javascript
// Extract images from page
const pageImages = await extractImagesFromPage(pdfPath, pageNum, docId);

for (const img of pageImages) {
  // Run OCR on image
  const ocrResult = await Tesseract.recognize(img.path);

  // Save to database
  await db.run(`INSERT INTO document_images ...`);

  // Index in Meilisearch
  await meilisearch.addDocuments([{
    id: img.id,
    type: 'image',
    content: ocrResult.data.text,
    ...
  }]);
}
```

### Phase 2: Image-Text Anchoring (4-6 hours)

**Algorithm:**
- Parse page OCR results to get text positions
- For each image, find text within 100px above/below
- Store as `anchorTextBefore` and `anchorTextAfter`
- Helps users understand image context

### Phase 3: API Endpoints (3-4 hours)

**New routes to add:**

```javascript
// server/routes/images.js

// Get all images for a document
GET /api/documents/:id/images
Response: Array of image objects

// Get specific image file
GET /api/images/:imageId
Response: PNG/JPEG file (stream)

// Get images for specific page
GET /api/documents/:id/pages/:pageNum/images
Response: Array of images on that page
```

### Phase 4: Frontend Integration (6-8 hours)

**Files to modify:**

1. **`client/src/views/DocumentView.vue`**
   - Fetch images for current page
   - Overlay images on PDF canvas at correct positions
   - Show extracted text on hover
   - Click to view full-size

2. **`client/src/components/ImageOverlay.vue`** (NEW)
   - Display image at correct position
   - Show OCR text tooltip
   - Full-screen modal on click

**Example:**
```vue
<div class="pdf-page">
  <canvas ref="pdfCanvas"></canvas>

  <!-- Image overlays -->
  <div v-for="img in pageImages"
       class="image-overlay"
       :style="getImagePosition(img)"
       @click="showImageDetail(img)">
    <img :src="`/api/images/${img.id}`" />
    <div class="ocr-text-tooltip">{{ img.extractedText }}</div>
  </div>
</div>
```

### Phase 5: Testing (2-3 hours)

- Test with PDFs containing diagrams
- Test with PDFs containing charts/graphs
- Test with PDFs containing photos with text
- Test multi-image per page
- Verify OCR accuracy on images
- Test search includes image text
- Performance test with 100+ page PDFs

---

## Technical Challenges & Solutions

### Challenge 1: Image Extraction Quality

**Problem:** PDF images may be embedded at low resolution

**Solutions:**
1. Use high DPI conversion (300 DPI minimum)
2. Apply image enhancement before OCR
3. Use Sharp library for image processing

### Challenge 2: Positioning Accuracy

**Problem:** Mapping PDF coordinates to screen coordinates

**Solutions:**
1. Store positions as percentages
2. Scale based on viewport
3. Test with various zoom levels

### Challenge 3: Performance

**Problem:** Image extraction + OCR is slow

**Current Stats:**
- Image extraction: ~1s per page
- OCR per image: ~2-3s per image
- 100-page doc with 5 images/page = ~20 minutes

**Solutions:**
1. Process in background (already implemented via BullMQ)
2. Show progress updates
3. Allow partial results (show pages as they complete)
4. Cache OCR results

---

## Dependencies Needed

```json
{
  "pdf-img-convert": "^1.0.0",  // Convert PDF pages to images
  "sharp": "^0.33.0",            // Image processing & optimization
  "tesseract.js": "^5.0.0"       // Already installed for page OCR
}
```

Or alternative:
```json
{
  "pdfjs-dist": "^4.0.0",  // Already installed, can extract images directly
  "jimp": "^0.22.0"        // Alternative to Sharp
}
```

---

## Implementation Plan (Recommended Order)

### Week 1: Backend Implementation

**Day 1-2:**
- Install dependencies
- Implement image extraction
- Test with sample PDFs

**Day 2-3:**
- Add OCR on images
- Store in database
- Index in Meilisearch

### Week 2: Frontend & Testing

**Day 4-5:**
- Create API endpoints
- Test endpoints with curl/Postman

**Day 5-6:**
- Implement frontend image display
- Add image overlays to document viewer

**Day 7:**
- End-to-end testing
- Performance optimization
- Bug fixes

---

## Files Created So Far

```
docs/features/IMAGE_EXTRACTION_DESIGN.md
docs/features/IMAGE_EXTRACTION_STATUS.md  (this file)
server/migrations/004_add_document_images.sql
server/run-migration.js
```

## Files To Create

```
server/workers/image-extractor.js
server/routes/images.js
client/src/components/ImageOverlay.vue
client/src/composables/useDocumentImages.js
```

## Files To Modify

```
server/workers/ocr-worker.js  (add image extraction)
server/index.js  (add image routes)
client/src/views/DocumentView.vue  (display images)
```

---

## Current System State

### Services Running:
- ✅ Backend API (port 8001)
- ✅ Frontend (port 8080)
- ✅ OCR Worker (processing jobs)
- ✅ Meilisearch (port 7700)
- ✅ Redis (port 6379)

### Database:
- ✅ `document_images` table created
- ✅ Indexes added
- ✅ Ready for image data

### What Works Now:
- ✅ PDF upload
- ✅ Page text OCR
- ✅ Search text
- ✅ View PDFs
- ❌ Image extraction (not implemented yet)
- ❌ Image OCR (not implemented yet)
- ❌ Image display (not implemented yet)

---

## Next Steps

### Option A: Continue Implementation Now
I can continue implementing the remaining phases. This will take approximately **2-3 days** to complete fully.

### Option B: Implement in Stages
1. Start with Phase 1 (backend extraction) - **1 day**
2. Test with existing PDFs
3. Then add frontend display - **1 day**
4. Finally add OCR on images - **1 day**

### Option C: Minimal Viable Feature
1. Extract images only (no OCR yet) - **4 hours**
2. Display images in viewer - **4 hours**
3. Add OCR later as enhancement

**Recommendation:** Option B (staged approach) allows for testing and feedback at each phase.

---

## Questions to Decide

1. **Which PDF library?**
   - `pdf-img-convert` (simpler, good for extraction)
   - `pdfjs-dist` (already installed, more control)

2. **Image format?**
   - PNG (lossless, larger files ~500KB/image)
   - JPEG (smaller ~100KB/image, slight quality loss)
   - WebP (best compression, modern format)

3. **OCR on all images?**
   - Yes: More searchable content, slower processing
   - Selective: Only images that look like they contain text
   - User-triggered: Extract on demand

4. **Priority vs PDF Page Navigation Bug?**
   - Fix page navigation first (30 min)
   - Implement image extraction first (2-3 days)
   - Do both in parallel

---

## Summary

**Completed:**
- ✅ Architecture designed
- ✅ Database schema created
- ✅ Migration applied

**Remaining:**
- ⏳ Backend implementation (8-10 hours)
- ⏳ API endpoints (3-4 hours)
- ⏳ Frontend integration (6-8 hours)
- ⏳ Testing (2-3 hours)

**Total Estimated Time:** 20-25 hours (2.5-3 days)

---

**Ready to proceed with implementation?** Let me know which option you prefer and I'll start building!
