/**
 * Re-index all document pages to Meilisearch
 */
import { getDb } from '../config/db.js';
import { indexDocumentPage } from '../services/search.js';

const db = getDb();

async function reindexAll() {
  try {
    console.log('Starting re-indexing of all document pages...');

    // Get all pages with OCR text
    const pages = db.prepare(`
      SELECT
        id as pageId,
        document_id as documentId,
        page_number as pageNumber,
        ocr_text as text,
        ocr_confidence as confidence
      FROM document_pages
      WHERE ocr_text IS NOT NULL AND ocr_text != ''
      ORDER BY document_id, page_number
    `).all();

    console.log(`Found ${pages.length} pages to index`);

    let indexed = 0;
    let failed = 0;

    for (const page of pages) {
      try {
        await indexDocumentPage(page);
        indexed++;
        if (indexed % 10 === 0) {
          console.log(`Progress: ${indexed}/${pages.length} pages indexed`);
        }
      } catch (error) {
        console.error(`Failed to index page ${page.pageId}:`, error.message);
        failed++;
      }
    }

    console.log('\n✅ Re-indexing complete!');
    console.log(`   Indexed: ${indexed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${pages.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during re-indexing:', error);
    process.exit(1);
  }
}

reindexAll();
