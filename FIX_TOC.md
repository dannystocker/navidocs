# CRITICAL FIX: TOC Extractor

**Problem:** Only extracts 1 corrupted entry. Code tries OCR first (broken), then PDF outline (works but never reached).

**Solution:** In `/home/setup/navidocs/server/services/toc-extractor.js` line ~346:

REPLACE lines 346-390 with:

```javascript
// PRIORITY: Use PDF outline FIRST (Adobe approach)
const doc = db.prepare('SELECT file_path FROM documents WHERE id = ?').get(documentId);
if (doc?.file_path) {
  const outlineEntries = await extractPdfOutline(doc.file_path, documentId);
  if (outlineEntries?.length > 0) {
    db.prepare('DELETE FROM document_toc WHERE document_id = ?').run(documentId);
    const insert = db.prepare('INSERT INTO document_toc (id, document_id, title, section_key, page_start, level, parent_id, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const entry of outlineEntries) {
      insert.run(entry.id, documentId, entry.title, entry.sectionKey || null, entry.pageStart, entry.level, entry.parentId || null, entry.orderIndex);
    }
    return { success: true, entriesCount: outlineEntries.length, pages: [], message: `Extracted ${outlineEntries.length} entries from PDF outline` };
  }
}
// If no outline, fall back to OCR (existing code continues...)
```

Then restart server and run: `curl -X POST http://localhost:8001/api/documents/efb25a15-7d84-4bc3-b070-6bd7dec8d59a/toc/extract`

**Test URL:** http://172.29.75.55:8080/document/efb25a15-7d84-4bc3-b070-6bd7dec8d59a
