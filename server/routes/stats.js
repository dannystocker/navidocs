/**
 * Statistics API
 * Provides system statistics and analytics
 */

import express from 'express';
import { getDb } from '../db/db.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/stats
 * Get system statistics
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();

    // Total documents
    const { totalDocuments } = db.prepare(`
      SELECT COUNT(*) as totalDocuments FROM documents
    `).get();

    // Total pages
    const { totalPages } = db.prepare(`
      SELECT COUNT(*) as totalPages FROM document_pages
    `).get();

    // Documents by status
    const documentsByStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM documents
      GROUP BY status
    `).all();

    // Storage used (calculate from uploads directory)
    let storageUsed = 0;
    try {
      const uploadsDir = join(process.cwd(), '../uploads');
      function calculateDirSize(dir) {
        let size = 0;
        const files = readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
          const filePath = join(dir, file.name);
          if (file.isDirectory()) {
            size += calculateDirSize(filePath);
          } else {
            try {
              size += statSync(filePath).size;
            } catch (e) {
              // Skip files that can't be read
            }
          }
        }
        return size;
      }
      storageUsed = calculateDirSize(uploadsDir);
    } catch (err) {
      logger.warn('Failed to calculate storage:', err);
    }

    // Recent uploads (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentUploads = db.prepare(`
      SELECT DATE(created_at / 1000, 'unixepoch') as date, COUNT(*) as count
      FROM documents
      WHERE created_at > ?
      GROUP BY DATE(created_at / 1000, 'unixepoch')
      ORDER BY date ASC
    `).all(sevenDaysAgo);

    // Recent documents
    const recentDocuments = db.prepare(`
      SELECT id, title, status, created_at, page_count
      FROM documents
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // Document health (issues)
    const { failedCount } = db.prepare(`
      SELECT COUNT(*) as failedCount
      FROM documents
      WHERE status = 'failed'
    `).get();

    const { processingCount } = db.prepare(`
      SELECT COUNT(*) as processingCount
      FROM documents
      WHERE status IN ('processing', 'pending', 'queued')
    `).get();

    res.json({
      overview: {
        totalDocuments,
        totalPages,
        storageUsed,
        storageUsedFormatted: formatBytes(storageUsed)
      },
      documentsByStatus: documentsByStatus.reduce((acc, { status, count }) => {
        acc[status] = count;
        return acc;
      }, {}),
      recentUploads,
      recentDocuments: recentDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        createdAt: doc.created_at,
        pageCount: doc.page_count
      })),
      health: {
        failedCount,
        processingCount,
        healthScore: totalDocuments > 0
          ? Math.round(((totalDocuments - failedCount) / totalDocuments) * 100)
          : 100
      }
    });

  } catch (error) {
    logger.error('Stats retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default router;
