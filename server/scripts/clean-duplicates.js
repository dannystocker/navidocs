/**
 * Clean up duplicate documents from database and filesystem
 * Keeps the newest version of each duplicate document
 */

import { getDb } from '../db/db.js';
import { MeiliSearch } from 'meilisearch';
import { unlink, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '../../uploads');

// Meilisearch config
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';
const MEILISEARCH_KEY = process.env.MEILISEARCH_MASTER_KEY || 'dev-master-key-navidocs-2025';
const INDEX_NAME = 'navidocs-pages';

async function cleanDuplicates() {
  console.log('Starting duplicate cleanup...\n');

  const db = getDb();
  const searchClient = new MeiliSearch({
    host: MEILISEARCH_HOST,
    apiKey: MEILISEARCH_KEY
  });

  // Find duplicates by title (keep newest)
  const duplicatesByTitle = db.prepare(`
    SELECT
      title,
      COUNT(*) as count,
      GROUP_CONCAT(id) as ids,
      GROUP_CONCAT(created_at) as created_ats
    FROM documents
    GROUP BY title
    HAVING COUNT(*) > 1
    ORDER BY title
  `).all();

  console.log(`Found ${duplicatesByTitle.length} sets of documents with duplicate titles\n`);

  let totalDeleted = 0;
  const documentsToDelete = [];

  for (const dup of duplicatesByTitle) {
    const ids = dup.ids.split(',');
    const createdAts = dup.created_ats.split(',').map(Number);

    // Sort by created_at descending (newest first)
    const sorted = ids.map((id, i) => ({ id, created_at: createdAts[i] }))
      .sort((a, b) => b.created_at - a.created_at);

    const keep = sorted[0];
    const remove = sorted.slice(1);

    console.log(`Title: "${dup.title}"`);
    console.log(`  Keeping: ${keep.id} (created: ${new Date(keep.created_at).toISOString()})`);
    console.log(`  Removing ${remove.length} duplicate(s):`);

    for (const doc of remove) {
      console.log(`    - ${doc.id} (created: ${new Date(doc.created_at).toISOString()})`);
      documentsToDelete.push(doc.id);
      totalDeleted++;
    }
    console.log('');
  }

  if (documentsToDelete.length === 0) {
    console.log('No duplicates found. Database is clean!');
    return;
  }

  console.log(`\nPreparing to delete ${documentsToDelete.length} duplicate documents...\n`);

  // Get full document info before deletion
  const docsToDelete = db.prepare(`
    SELECT id, file_path, title
    FROM documents
    WHERE id IN (${documentsToDelete.map(() => '?').join(',')})
  `).all(...documentsToDelete);

  // Delete from Meilisearch index
  console.log('Cleaning Meilisearch index...');
  try {
    const index = searchClient.index(INDEX_NAME);

    for (const doc of docsToDelete) {
      // Delete all pages and images for this document
      const filter = `docId = "${doc.id}"`;
      await index.deleteDocuments({ filter });
      console.log(`  Deleted search entries for: ${doc.title}`);
    }
  } catch (err) {
    console.warn('Warning: Meilisearch cleanup failed:', err.message);
  }

  // Delete from database (CASCADE will handle document_pages, ocr_jobs)
  console.log('\nDeleting from database...');
  const deleteStmt = db.prepare(`DELETE FROM documents WHERE id = ?`);
  const deleteMany = db.transaction((ids) => {
    for (const id of ids) {
      deleteStmt.run(id);
    }
  });

  deleteMany(documentsToDelete);
  console.log(`  Deleted ${documentsToDelete.length} documents from database`);

  // Delete from filesystem
  console.log('\nDeleting files from filesystem...');
  let filesDeleted = 0;
  let filesFailed = 0;

  for (const doc of docsToDelete) {
    try {
      // Delete the entire document folder (includes PDF and images)
      const docFolder = join(UPLOADS_DIR, doc.id);

      if (existsSync(docFolder)) {
        await rm(docFolder, { recursive: true, force: true });
        console.log(`  Deleted folder: ${doc.id}/`);
        filesDeleted++;
      } else {
        console.log(`  Folder not found (already deleted?): ${doc.id}/`);
      }
    } catch (err) {
      console.error(`  Failed to delete folder ${doc.id}:`, err.message);
      filesFailed++;
    }
  }

  console.log('\n=== Cleanup Summary ===');
  console.log(`Documents removed from database: ${documentsToDelete.length}`);
  console.log(`Folders deleted from filesystem: ${filesDeleted}`);
  console.log(`Folders failed to delete: ${filesFailed}`);
  console.log(`Search index cleaned: ${documentsToDelete.length} documents`);
  console.log('\nCleanup complete!');
}

// Run cleanup
cleanDuplicates()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
  });
