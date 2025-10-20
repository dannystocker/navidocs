/**
 * TOC Route - Table of Contents API
 * GET /api/documents/:documentId/toc - Get TOC for document
 * POST /api/documents/:documentId/toc/extract - Trigger TOC extraction
 */

import express from 'express';
import { LRUCache } from 'lru-cache';
import { getDocumentToc, buildTocTree, extractTocFromDocument } from '../services/toc-extractor.js';

const router = express.Router();

// LRU cache for TOC results
const tocCache = new LRUCache({
  max: 200,
  ttl: 1000 * 60 * 30 // 30 minutes
});

/**
 * GET /api/documents/:documentId/toc
 * Get Table of Contents for a document
 *
 * @param {string} documentId - Document UUID
 * @query {string} format - "flat" (default) or "tree"
 * @returns {Object} { entries: Array, format: string }
 */
router.get('/documents/:documentId/toc', async (req, res) => {
  try {
    const { documentId } = req.params;
    const format = req.query.format || 'flat';

    const cacheKey = `toc:${documentId}:${format}`;
    let entries = tocCache.get(cacheKey);
    if (!entries) {
      entries = getDocumentToc(documentId);
      tocCache.set(cacheKey, entries);
    }

    if (format === 'tree') {
      const tree = buildTocTree(entries);
      return res.json({ entries: tree, format: 'tree', count: entries.length });
    }

    res.json({ entries, format: 'flat', count: entries.length });

  } catch (error) {
    console.error('TOC fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch TOC',
      message: error.message
    });
  }
});

/**
 * POST /api/documents/:documentId/toc/extract
 * Trigger TOC extraction for a document
 *
 * @param {string} documentId - Document UUID
 * @returns {Object} { success: boolean, entriesCount: number, pages: number[] }
 */
router.post('/documents/:documentId/toc/extract', async (req, res) => {
  try {
    const { documentId } = req.params;

    const result = await extractTocFromDocument(documentId);

    if (!result.success) {
      return res.status(400).json({
        error: 'TOC extraction failed',
        message: result.error || result.message
      });
    }

    // Invalidate cache after extraction
    tocCache.delete(`toc:${documentId}:flat`);
    tocCache.delete(`toc:${documentId}:tree`);

    res.json({
      success: true,
      entriesCount: result.entriesCount,
      tocPages: result.pages,
      message: result.entriesCount > 0
        ? `Extracted ${result.entriesCount} TOC entries from ${result.pages.length} page(s)`
        : 'No TOC detected in document'
    });

  } catch (error) {
    console.error('TOC extraction error:', error);
    res.status(500).json({
      error: 'TOC extraction failed',
      message: error.message
    });
  }
});

export default router;
