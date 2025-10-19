import Database from 'better-sqlite3';
const db = new Database('./db/navidocs.db');

const docs = db.prepare(`
  SELECT id, title, status, pageCount, imagesExtracted, imageCount, createdAt
  FROM documents
  ORDER BY createdAt DESC
  LIMIT 3
`).all();

console.log('\n=== Latest Documents ===\n');
docs.forEach(doc => {
  console.log(`ID: ${doc.id}`);
  console.log(`Title: ${doc.title}`);
  console.log(`Status: ${doc.status}`);
  console.log(`Pages: ${doc.pageCount}`);
  console.log(`Images: ${doc.imageCount} (extracted: ${doc.imagesExtracted})`);
  const date = new Date(doc.createdAt);
  console.log(`Created: ${date.toISOString()}`);
  console.log('---');
});

// Check the document that was processing
const doc = db.prepare(`
  SELECT * FROM documents WHERE id = '18f29f59-d2ca-4b01-95c8-004e8db3982e'
`).get();

if (doc) {
  console.log('\n=== Document 18f29f59 Status ===');
  console.log(`Status: ${doc.status}`);
  console.log(`Page Count: ${doc.pageCount}`);
  console.log(`Images Extracted: ${doc.imagesExtracted}`);
  console.log(`Image Count: ${doc.imageCount}`);

  // Count actual pages
  const pageCount = db.prepare(`
    SELECT COUNT(*) as count FROM document_pages WHERE document_id = ?
  `).get(doc.id);

  // Count actual images
  const imageCount = db.prepare(`
    SELECT COUNT(*) as count FROM document_images WHERE documentId = ?
  `).get(doc.id);

  console.log(`\nActual pages in DB: ${pageCount.count}`);
  console.log(`Actual images in DB: ${imageCount.count}`);

  // Update status if needed
  if (doc.status !== 'indexed' && pageCount.count === 100) {
    console.log('\n⚠️  Document is complete but status is not "indexed". Fixing...');
    db.prepare(`
      UPDATE documents
      SET status = 'indexed',
          imagesExtracted = 1,
          imageCount = ?
      WHERE id = ?
    `).run(imageCount.count, doc.id);
    console.log('✅ Status updated to "indexed"');
  }
}

db.close();
