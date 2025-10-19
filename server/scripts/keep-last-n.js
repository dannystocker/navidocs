/**
 * Keep only the last N documents (by upload date)
 * Removes all others from database, filesystem, and Meilisearch
 */

import { getDb } from '../db/db.js';
import { getMeilisearchClient } from '../config/meilisearch.js';
import { rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '../../uploads');

// Meilisearch config
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';
const INDEX_NAME = process.env.MEILISEARCH_INDEX_NAME || 'navidocs-pages';

const KEEP_COUNT = parseInt(process.argv[2]) || 2;

async function keepLastN() {
  console.log(`\nKeeping only the last ${KEEP_COUNT} uploaded documents...\n`);

  const db = getDb();
  const searchClient = getMeilisearchClient();

  // Get all documents ordered by created_at descending (newest first)
  const allDocs = db.prepare(`
    SELECT id, title, created_at, file_path
    FROM documents
    ORDER BY created_at DESC
  `).all();

  console.log(`Total documents in database: ${allDocs.length}\n`);

  if (allDocs.length <= KEEP_COUNT) {
    console.log(`Only ${allDocs.length} document(s) exist. Nothing to delete.`);
    return;
  }

  // Split into keep and delete
  const toKeep = allDocs.slice(0, KEEP_COUNT);
  const toDelete = allDocs.slice(KEEP_COUNT);

  console.log('Documents to KEEP:');
  toKeep.forEach((doc, i) => {
    console.log(`  ${i + 1}. ${doc.title} (${doc.id}) - ${new Date(doc.created_at).toISOString()}`);
  });

  console.log(`\nDocuments to DELETE (${toDelete.length}):`);
  toDelete.forEach((doc, i) => {
    console.log(`  ${i + 1}. ${doc.title} (${doc.id}) - ${new Date(doc.created_at).toISOString()}`);
  });

  console.log(`\n=== Starting deletion ===\n`);

  const docIdsToDelete = toDelete.map(d => d.id);

  // Delete from Meilisearch index
  console.log('Cleaning Meilisearch index...');
  try {
    const index = await searchClient.getIndex(INDEX_NAME);

    for (const doc of toDelete) {
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

  deleteMany(docIdsToDelete);
  console.log(`  Deleted ${docIdsToDelete.length} documents from database`);

  // Delete from filesystem
  console.log('\nDeleting files from filesystem...');
  let filesDeleted = 0;
  let filesFailed = 0;

  for (const doc of toDelete) {
    try {
      // Delete the entire document folder (includes PDF and images)
      const docFolder = join(UPLOADS_DIR, doc.id);

      if (existsSync(docFolder)) {
        await rm(docFolder, { recursive: true, force: true });
        console.log(`  Deleted folder: ${doc.id}/`);
        filesDeleted++;
      } else {
        console.log(`  Folder not found: ${doc.id}/`);
      }
    } catch (err) {
      console.error(`  Failed to delete folder ${doc.id}:`, err.message);
      filesFailed++;
    }
  }

  console.log('\n=== Cleanup Summary ===');
  console.log(`Documents kept: ${toKeep.length}`);
  console.log(`Documents removed from database: ${docIdsToDelete.length}`);
  console.log(`Folders deleted from filesystem: ${filesDeleted}`);
  console.log(`Folders failed to delete: ${filesFailed}`);
  console.log('\nCleanup complete!');
}

// Run cleanup
keepLastN()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
  });
