/**
 * OCR Integration Example
 *
 * This example demonstrates the complete OCR pipeline workflow:
 * 1. Upload a PDF document
 * 2. Create OCR job in database
 * 3. Queue job for background processing
 * 4. Monitor job progress
 * 5. Search indexed content
 *
 * Usage: node examples/ocr-integration.js
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/db.js';
import { addOcrJob, getJobStatus } from '../services/queue.js';
import { searchPages } from '../services/search.js';
import { createReadStream, statSync } from 'fs';
import { createHash } from 'crypto';

/**
 * Example 1: Complete document upload and OCR workflow
 */
async function uploadAndProcessDocument() {
  console.log('=== Example 1: Upload and Process Document ===\n');

  const db = getDb();

  // Simulate uploaded file
  const filePath = './uploads/boat-manual.pdf';
  const fileStats = statSync(filePath);
  const fileHash = createHash('sha256')
    .update(createReadStream(filePath))
    .digest('hex');

  // Create document record
  const documentId = uuidv4();
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO documents (
      id, organization_id, entity_id, uploaded_by,
      title, document_type, file_path, file_name,
      file_size, file_hash, page_count,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?, ?)
  `).run(
    documentId,
    'org_demo_123', // Organization ID
    'boat_demo_456', // Boat/Entity ID
    'user_demo_789', // User ID
    'Prestige F4.9 Owner Manual',
    'owner-manual',
    filePath,
    'boat-manual.pdf',
    fileStats.size,
    fileHash,
    50, // Page count (would be detected from PDF)
    now,
    now
  );

  console.log(`✓ Document created: ${documentId}`);

  // Create OCR job in database
  const jobId = uuidv4();

  db.prepare(`
    INSERT INTO ocr_jobs (id, document_id, status, progress, created_at)
    VALUES (?, ?, 'pending', 0, ?)
  `).run(jobId, documentId, now);

  console.log(`✓ OCR job created: ${jobId}`);

  // Add job to BullMQ queue
  await addOcrJob(documentId, jobId, {
    filePath: filePath
  });

  console.log(`✓ Job queued for background processing`);

  return { documentId, jobId };
}

/**
 * Example 2: Monitor job progress
 */
async function monitorJobProgress(jobId) {
  console.log('\n=== Example 2: Monitor Job Progress ===\n');

  const db = getDb();

  // Poll for progress every 2 seconds
  const checkProgress = setInterval(async () => {
    const job = db.prepare(`
      SELECT status, progress, error FROM ocr_jobs WHERE id = ?
    `).get(jobId);

    console.log(`Status: ${job.status} | Progress: ${job.progress}%`);

    if (job.status === 'completed') {
      console.log('✓ OCR processing completed!');
      clearInterval(checkProgress);
    } else if (job.status === 'failed') {
      console.error(`✗ Job failed: ${job.error}`);
      clearInterval(checkProgress);
    }
  }, 2000);

  // Also check BullMQ status
  const bullStatus = await getJobStatus(jobId);
  if (bullStatus) {
    console.log(`BullMQ State: ${bullStatus.state}`);
  }
}

/**
 * Example 3: Search indexed content
 */
async function searchDocumentContent(documentId) {
  console.log('\n=== Example 3: Search Document Content ===\n');

  // Wait for indexing to complete
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Search for specific content
  const queries = [
    'bilge pump',
    'electrical system',
    'maintenance schedule',
    'safety equipment'
  ];

  for (const query of queries) {
    console.log(`\nSearching for: "${query}"`);

    const results = await searchPages(query, {
      filter: `docId = "${documentId}"`,
      limit: 3
    });

    if (results.hits.length > 0) {
      console.log(`Found ${results.hits.length} matches:`);
      results.hits.forEach((hit, index) => {
        console.log(`  ${index + 1}. Page ${hit.pageNumber} (confidence: ${(hit.ocrConfidence * 100).toFixed(0)}%)`);
        console.log(`     "${hit.text.substring(0, 100)}..."`);
      });
    } else {
      console.log('  No matches found');
    }
  }
}

/**
 * Example 4: Get document pages with OCR data
 */
async function getDocumentPages(documentId) {
  console.log('\n=== Example 4: Get Document Pages ===\n');

  const db = getDb();

  const pages = db.prepare(`
    SELECT
      page_number,
      ocr_confidence,
      LENGTH(ocr_text) as text_length,
      ocr_completed_at,
      search_indexed_at
    FROM document_pages
    WHERE document_id = ?
    ORDER BY page_number
    LIMIT 10
  `).all(documentId);

  console.log(`Document has ${pages.length} pages indexed:\n`);

  pages.forEach(page => {
    console.log(`Page ${page.page_number}:`);
    console.log(`  OCR Confidence: ${(page.ocr_confidence * 100).toFixed(0)}%`);
    console.log(`  Text Length: ${page.text_length} characters`);
    console.log(`  Indexed: ${page.search_indexed_at ? '✓' : '✗'}`);
  });
}

/**
 * Example 5: Multi-vertical search
 */
async function multiVerticalSearch() {
  console.log('\n=== Example 5: Multi-Vertical Search ===\n');

  // Search across all boat documents
  const boatResults = await searchPages('engine maintenance', {
    filter: 'vertical = "boating"',
    limit: 5
  });

  console.log(`Boat documents: ${boatResults.hits.length} results`);

  // Search property/condo documents
  const propertyResults = await searchPages('HVAC system', {
    filter: 'vertical = "property"',
    limit: 5
  });

  console.log(`Property documents: ${propertyResults.hits.length} results`);

  // Search by organization
  const orgResults = await searchPages('safety', {
    filter: 'organizationId = "org_demo_123"',
    limit: 10
  });

  console.log(`Organization documents: ${orgResults.hits.length} results`);
}

/**
 * Example 6: Advanced filtering and sorting
 */
async function advancedSearch() {
  console.log('\n=== Example 6: Advanced Search ===\n');

  // Search with multiple filters
  const results = await searchPages('pump', {
    filter: [
      'vertical = "boating"',
      'systems IN ["plumbing", "waste-management"]',
      'ocrConfidence > 0.8'
    ].join(' AND '),
    sort: ['pageNumber:asc'],
    limit: 10
  });

  console.log(`Found ${results.hits.length} high-confidence plumbing pages`);

  // Search by boat make/model
  const prestigeResults = await searchPages('', {
    filter: 'boatMake = "Prestige" AND boatModel = "F4.9"',
    limit: 20
  });

  console.log(`Found ${prestigeResults.hits.length} Prestige F4.9 pages`);
}

/**
 * Run all examples
 */
async function runExamples() {
  try {
    console.log('NaviDocs OCR Integration Examples\n');
    console.log('===================================\n');

    // Example 1: Upload and process
    const { documentId, jobId } = await uploadAndProcessDocument();

    // Example 2: Monitor progress
    await monitorJobProgress(jobId);

    // Example 3: Search content
    await searchDocumentContent(documentId);

    // Example 4: Get pages
    await getDocumentPages(documentId);

    // Example 5: Multi-vertical search
    await multiVerticalSearch();

    // Example 6: Advanced search
    await advancedSearch();

    console.log('\n✅ All examples completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples();
}

// Export for use in other modules
export {
  uploadAndProcessDocument,
  monitorJobProgress,
  searchDocumentContent,
  getDocumentPages,
  multiVerticalSearch,
  advancedSearch
};
