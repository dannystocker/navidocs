/**
 * OCR Worker - BullMQ background job processor for document OCR
 *
 * Features:
 * - Process OCR jobs from 'ocr-jobs' queue
 * - Update job progress in real-time (0-100%)
 * - Extract text from each PDF page
 * - Save OCR results to document_pages table
 * - Index pages in Meilisearch
 * - Update document status to 'indexed' when complete
 * - Handle failures and update job status
 */

import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/db.js';
import { extractTextFromPDF, cleanOCRText } from '../services/ocr.js';
import { indexDocumentPage } from '../services/search.js';

// Redis connection for BullMQ
const connection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null
});

/**
 * Process an OCR job
 *
 * @param {Object} job - BullMQ job object
 * @param {Object} job.data - Job data
 * @param {string} job.data.documentId - Document ID to process
 * @param {string} job.data.jobId - OCR job ID in database
 * @param {string} job.data.filePath - Path to PDF file
 * @returns {Promise<Object>} - Processing result
 */
async function processOCRJob(job) {
  const { documentId, jobId, filePath } = job.data;
  const db = getDb();

  console.log(`[OCR Worker] Starting job ${jobId} for document ${documentId}`);

  try {
    // Update job status to processing
    db.prepare(`
      UPDATE ocr_jobs
      SET status = 'processing',
          started_at = ?,
          progress = 0
      WHERE id = ?
    `).run(Math.floor(Date.now() / 1000), jobId);

    // Get document info
    const document = db.prepare(`
      SELECT * FROM documents WHERE id = ?
    `).get(documentId);

    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const totalPages = document.page_count || 0;

    // Progress tracking
    let currentProgress = 0;

    const updateProgress = (pageNum, total) => {
      currentProgress = Math.floor((pageNum / total) * 100);

      // Update database progress
      db.prepare(`
        UPDATE ocr_jobs
        SET progress = ?
        WHERE id = ?
      `).run(currentProgress, jobId);

      // Update BullMQ job progress
      job.updateProgress(currentProgress);

      console.log(`[OCR Worker] Progress: ${currentProgress}% (page ${pageNum}/${total})`);
    };

    // Extract text from PDF using OCR service
    console.log(`[OCR Worker] Extracting text from ${filePath}`);

    const ocrResults = await extractTextFromPDF(filePath, {
      language: document.language || 'eng',
      onProgress: updateProgress
    });

    console.log(`[OCR Worker] OCR extraction complete: ${ocrResults.length} pages processed`);

    // Process each page result
    const now = Math.floor(Date.now() / 1000);

    for (const pageResult of ocrResults) {
      const { pageNumber, text, confidence, error } = pageResult;

      try {
        // Generate page ID
        const pageId = `page_${documentId}_${pageNumber}`;

        // Clean OCR text
        const cleanedText = text ? cleanOCRText(text) : '';

        // Check if page already exists
        const existingPage = db.prepare(`
          SELECT id FROM document_pages
          WHERE document_id = ? AND page_number = ?
        `).get(documentId, pageNumber);

        if (existingPage) {
          // Update existing page
          db.prepare(`
            UPDATE document_pages
            SET ocr_text = ?,
                ocr_confidence = ?,
                ocr_language = ?,
                ocr_completed_at = ?,
                metadata = ?
            WHERE document_id = ? AND page_number = ?
          `).run(
            cleanedText,
            confidence,
            document.language || 'en',
            now,
            JSON.stringify({ error: error || null }),
            documentId,
            pageNumber
          );

          console.log(`[OCR Worker] Updated page ${pageNumber} (confidence: ${confidence.toFixed(2)})`);
        } else {
          // Insert new page
          db.prepare(`
            INSERT INTO document_pages (
              id, document_id, page_number,
              ocr_text, ocr_confidence, ocr_language, ocr_completed_at,
              metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            pageId,
            documentId,
            pageNumber,
            cleanedText,
            confidence,
            document.language || 'en',
            now,
            JSON.stringify({ error: error || null }),
            now
          );

          console.log(`[OCR Worker] Created page ${pageNumber} (confidence: ${confidence.toFixed(2)})`);
        }

        // Index page in Meilisearch (only if text was successfully extracted)
        if (cleanedText && !error) {
          try {
            await indexDocumentPage({
              pageId: pageId,
              documentId: documentId,
              pageNumber: pageNumber,
              text: cleanedText,
              confidence: confidence
            });

            console.log(`[OCR Worker] Indexed page ${pageNumber} in Meilisearch`);
          } catch (indexError) {
            console.error(`[OCR Worker] Failed to index page ${pageNumber}:`, indexError.message);
            // Continue processing other pages even if indexing fails
          }
        }
      } catch (pageError) {
        console.error(`[OCR Worker] Error processing page ${pageNumber}:`, pageError.message);
        // Continue processing other pages
      }
    }

    // Update document status to indexed
    db.prepare(`
      UPDATE documents
      SET status = 'indexed',
          updated_at = ?
      WHERE id = ?
    `).run(now, documentId);

    // Mark job as completed
    db.prepare(`
      UPDATE ocr_jobs
      SET status = 'completed',
          progress = 100,
          completed_at = ?
      WHERE id = ?
    `).run(now, jobId);

    console.log(`[OCR Worker] Job ${jobId} completed successfully`);

    return {
      success: true,
      documentId: documentId,
      pagesProcessed: ocrResults.length
    };
  } catch (error) {
    console.error(`[OCR Worker] Job ${jobId} failed:`, error);

    // Update job status to failed
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`
      UPDATE ocr_jobs
      SET status = 'failed',
          error = ?,
          completed_at = ?
      WHERE id = ?
    `).run(error.message, now, jobId);

    // Update document status to failed
    db.prepare(`
      UPDATE documents
      SET status = 'failed',
          updated_at = ?
      WHERE id = ?
    `).run(now, documentId);

    throw error; // Re-throw to mark BullMQ job as failed
  }
}

/**
 * Create and start the OCR worker
 */
export function createOCRWorker() {
  const worker = new Worker('ocr-processing', processOCRJob, {
    connection,
    concurrency: parseInt(process.env.OCR_CONCURRENCY || '2'), // Process 2 documents at a time
    limiter: {
      max: 5, // Max 5 jobs
      duration: 60000 // Per minute (to avoid overloading Tesseract)
    }
  });

  // Worker event handlers
  worker.on('completed', (job, result) => {
    console.log(`[OCR Worker] Job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, error) => {
    console.error(`[OCR Worker] Job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('[OCR Worker] Worker error:', error);
  });

  worker.on('ready', () => {
    console.log('[OCR Worker] Worker is ready and waiting for jobs');
  });

  console.log('[OCR Worker] Worker started');

  return worker;
}

/**
 * Graceful shutdown handler
 */
export async function shutdownWorker(worker) {
  console.log('[OCR Worker] Shutting down...');

  await worker.close();
  await connection.quit();

  console.log('[OCR Worker] Shutdown complete');
}

// Start worker if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = createOCRWorker();

  // Handle shutdown signals
  process.on('SIGTERM', async () => {
    await shutdownWorker(worker);
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await shutdownWorker(worker);
    process.exit(0);
  });
}
