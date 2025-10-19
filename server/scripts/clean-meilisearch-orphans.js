/**
 * Clean orphaned entries from Meilisearch index
 * Removes documents that no longer exist in the database
 */

import { getMeilisearchClient } from '../config/meilisearch.js';
import { getDb } from '../db/db.js';

const INDEX_NAME = process.env.MEILISEARCH_INDEX_NAME || 'navidocs-pages';

async function cleanOrphans() {
  console.log('Cleaning orphaned Meilisearch entries...\n');

  const db = getDb();
  const client = getMeilisearchClient();

  try {
    const index = await client.getIndex(INDEX_NAME);

    // Get all document IDs from database
    const validDocIds = db.prepare('SELECT id FROM documents').all().map(row => row.id);
    console.log(`Found ${validDocIds.length} valid documents in database\n`);

    // Get all documents from Meilisearch
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    const orphanedIds = [];

    console.log('Scanning Meilisearch index for orphaned entries...');

    while (hasMore) {
      const results = await index.getDocuments({ offset, limit });

      for (const doc of results.results) {
        // Extract docId from the Meilisearch document
        const docId = doc.docId;

        if (docId && !validDocIds.includes(docId)) {
          orphanedIds.push(doc.id); // Use the Meilisearch document ID
        }
      }

      offset += limit;
      hasMore = results.results.length === limit;
    }

    console.log(`Found ${orphanedIds.length} orphaned entries in Meilisearch\n`);

    if (orphanedIds.length === 0) {
      console.log('No orphaned entries found. Index is clean!');
      return;
    }

    console.log('Deleting orphaned entries...');

    // Delete in batches of 100
    const batchSize = 100;
    for (let i = 0; i < orphanedIds.length; i += batchSize) {
      const batch = orphanedIds.slice(i, i + batchSize);
      await index.deleteDocuments(batch);
      console.log(`  Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(orphanedIds.length / batchSize)} (${batch.length} entries)`);
    }

    console.log('\n=== Cleanup Summary ===');
    console.log(`Orphaned entries removed: ${orphanedIds.length}`);
    console.log('\nMeilisearch cleanup complete!');
  } catch (err) {
    console.error('Meilisearch cleanup failed:', err.message);
    throw err;
  }
}

// Run cleanup
cleanOrphans()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
  });
