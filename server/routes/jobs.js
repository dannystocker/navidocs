/**
 * Jobs Route - GET /api/jobs/:id
 * Query OCR job status and progress
 */

import express from 'express';
import { getDb } from '../db/db.js';

const router = express.Router();

/**
 * GET /api/jobs/:id
 * Get OCR job status by job ID
 *
 * @param {string} id - Job UUID
 * @returns {Object} { status, progress, error, documentId, startedAt, completedAt }
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }

    const db = getDb();

    // Query job status from database
    const job = db.prepare(`
      SELECT
        id,
        document_id,
        status,
        progress,
        error,
        started_at,
        completed_at,
        created_at
      FROM ocr_jobs
      WHERE id = ?
    `).get(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Map status values
    // Database: pending, processing, completed, failed
    // API response: pending, processing, completed, failed
    const response = {
      jobId: job.id,
      documentId: job.document_id,
      status: job.status,
      progress: job.progress || 0,
      error: job.error || null,
      startedAt: job.started_at || null,
      completedAt: job.completed_at || null,
      createdAt: job.created_at
    };

    // If completed, include document status
    if (job.status === 'completed') {
      const document = db.prepare(`
        SELECT id, status, page_count
        FROM documents
        WHERE id = ?
      `).get(job.document_id);

      if (document) {
        response.document = {
          id: document.id,
          status: document.status,
          pageCount: document.page_count
        };
      }
    }

    res.json(response);

  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({
      error: 'Failed to retrieve job status',
      message: error.message
    });
  }
});

/**
 * GET /api/jobs
 * List jobs with optional filtering
 * Query params: status, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    // TODO: Authentication middleware should provide req.user
    const userId = req.user?.id || 'test-user-id';

    const db = getDb();

    // Build query with optional status filter
    let query = `
      SELECT
        j.id,
        j.document_id,
        j.status,
        j.progress,
        j.error,
        j.started_at,
        j.completed_at,
        j.created_at,
        d.title as document_title,
        d.document_type
      FROM ocr_jobs j
      INNER JOIN documents d ON j.document_id = d.id
      WHERE d.uploaded_by = ?
    `;

    const params = [userId];

    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      query += ' AND j.status = ?';
      params.push(status);
    }

    query += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const jobs = db.prepare(query).all(...params);

    res.json({
      jobs: jobs.map(job => ({
        jobId: job.id,
        documentId: job.document_id,
        documentTitle: job.document_title,
        documentType: job.document_type,
        status: job.status,
        progress: job.progress || 0,
        error: job.error || null,
        startedAt: job.started_at || null,
        completedAt: job.completed_at || null,
        createdAt: job.created_at
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Jobs list error:', error);
    res.status(500).json({
      error: 'Failed to retrieve jobs',
      message: error.message
    });
  }
});

export default router;
