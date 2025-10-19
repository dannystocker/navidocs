/**
 * Images Route - API endpoints for image retrieval
 * Handles serving extracted images from documents
 */

import express from 'express';
import { getDb } from '../db/db.js';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter for image endpoints (more permissive than general API)
const imageLimiter = rateLimit({
  windowMs: parseInt(process.env.IMAGE_RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.IMAGE_RATE_LIMIT_MAX_REQUESTS || '200'),
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many image requests, please try again later'
});

/**
 * Verify document access helper function
 * Checks if user has permission to access the document
 */
async function verifyDocumentAccess(documentId, userId, db) {
  const document = db.prepare('SELECT id, organization_id FROM documents WHERE id = ?').get(documentId);

  if (!document) {
    return { hasAccess: false, error: 'Document not found', status: 404 };
  }

  const hasAccess = db.prepare(`
    SELECT 1 FROM user_organizations WHERE user_id = ? AND organization_id = ?
    UNION SELECT 1 FROM documents WHERE id = ? AND uploaded_by = ?
    UNION SELECT 1 FROM document_shares WHERE document_id = ? AND shared_with = ?
  `).get(userId, document.organization_id, documentId, userId, documentId, userId);

  if (!hasAccess) {
    return { hasAccess: false, error: 'Access denied', status: 403 };
  }

  return { hasAccess: true, document };
}

/**
 * GET /api/documents/:id/images
 * Get all images for a specific document
 *
 * @param {string} id - Document UUID
 * @returns {Object} Array of image metadata
 */
router.get('/documents/:id/images', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid document ID format' });
    }

    // TODO: Authentication middleware should provide req.user
    const userId = req.user?.id || 'test-user-id';
    const db = getDb();

    // Verify document access
    const accessCheck = await verifyDocumentAccess(id, userId, db);
    if (!accessCheck.hasAccess) {
      return res.status(accessCheck.status).json({ error: accessCheck.error });
    }

    // Get all images for the document
    const images = db.prepare(`
      SELECT
        id,
        documentId,
        pageNumber,
        imageIndex,
        imagePath,
        imageFormat,
        width,
        height,
        position,
        extractedText,
        textConfidence,
        anchorTextBefore,
        anchorTextAfter,
        createdAt
      FROM document_images
      WHERE documentId = ?
      ORDER BY pageNumber ASC, imageIndex ASC
    `).all(id);

    // Parse position JSON
    const formattedImages = images.map(img => ({
      id: img.id,
      documentId: img.documentId,
      pageNumber: img.pageNumber,
      imageIndex: img.imageIndex,
      imageFormat: img.imageFormat,
      width: img.width,
      height: img.height,
      position: img.position ? JSON.parse(img.position) : null,
      extractedText: img.extractedText,
      textConfidence: img.textConfidence,
      anchorTextBefore: img.anchorTextBefore,
      anchorTextAfter: img.anchorTextAfter,
      createdAt: img.createdAt,
      imageUrl: `/api/images/${img.id}`
    }));

    console.log(`Retrieved ${formattedImages.length} images for document ${id}`);

    res.json({
      documentId: id,
      imageCount: formattedImages.length,
      images: formattedImages
    });

  } catch (error) {
    console.error('Get document images error:', error);
    res.status(500).json({
      error: 'Failed to retrieve images',
      message: error.message
    });
  }
});

/**
 * GET /api/documents/:id/pages/:pageNum/images
 * Get images for a specific page of a document
 *
 * @param {string} id - Document UUID
 * @param {number} pageNum - Page number (1-based)
 * @returns {Object} Array of image metadata for the page
 */
router.get('/documents/:id/pages/:pageNum/images', async (req, res) => {
  try {
    const { id, pageNum } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid document ID format' });
    }

    // Validate page number
    const pageNumber = parseInt(pageNum);
    if (isNaN(pageNumber) || pageNumber < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }

    // TODO: Authentication middleware should provide req.user
    const userId = req.user?.id || 'test-user-id';
    const db = getDb();

    // Verify document access
    const accessCheck = await verifyDocumentAccess(id, userId, db);
    if (!accessCheck.hasAccess) {
      return res.status(accessCheck.status).json({ error: accessCheck.error });
    }

    // Verify page exists
    const page = db.prepare(`
      SELECT id, page_number, document_id
      FROM document_pages
      WHERE document_id = ? AND page_number = ?
    `).get(id, pageNumber);

    if (!page) {
      return res.status(404).json({
        error: 'Page not found',
        message: `Page ${pageNumber} does not exist in this document`
      });
    }

    // Get images for the specific page
    const images = db.prepare(`
      SELECT
        id,
        documentId,
        pageNumber,
        imageIndex,
        imagePath,
        imageFormat,
        width,
        height,
        position,
        extractedText,
        textConfidence,
        anchorTextBefore,
        anchorTextAfter,
        createdAt
      FROM document_images
      WHERE documentId = ? AND pageNumber = ?
      ORDER BY imageIndex ASC
    `).all(id, pageNumber);

    // Format response
    const formattedImages = images.map(img => ({
      id: img.id,
      documentId: img.documentId,
      pageNumber: img.pageNumber,
      imageIndex: img.imageIndex,
      imageFormat: img.imageFormat,
      width: img.width,
      height: img.height,
      position: img.position ? JSON.parse(img.position) : null,
      extractedText: img.extractedText,
      textConfidence: img.textConfidence,
      anchorTextBefore: img.anchorTextBefore,
      anchorTextAfter: img.anchorTextAfter,
      createdAt: img.createdAt,
      imageUrl: `/api/images/${img.id}`
    }));

    console.log(`Retrieved ${formattedImages.length} images for document ${id} page ${pageNumber}`);

    res.json({
      documentId: id,
      pageNumber: pageNumber,
      imageCount: formattedImages.length,
      images: formattedImages
    });

  } catch (error) {
    console.error('Get page images error:', error);
    res.status(500).json({
      error: 'Failed to retrieve page images',
      message: error.message
    });
  }
});

/**
 * GET /api/images/:imageId
 * Serve image file as PNG/JPEG stream
 *
 * @param {string} imageId - Image UUID
 * @returns {Stream} Image file stream with proper Content-Type
 */
router.get('/images/:imageId', imageLimiter, async (req, res) => {
  try {
    const { imageId } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(imageId)) {
      return res.status(400).json({ error: 'Invalid image ID format' });
    }

    // TODO: Authentication middleware should provide req.user
    const userId = req.user?.id || 'test-user-id';
    const db = getDb();

    // Get image metadata
    const image = db.prepare(`
      SELECT
        id,
        documentId,
        imagePath,
        imageFormat
      FROM document_images
      WHERE id = ?
    `).get(imageId);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Verify document access
    const accessCheck = await verifyDocumentAccess(image.documentId, userId, db);
    if (!accessCheck.hasAccess) {
      return res.status(accessCheck.status).json({ error: accessCheck.error });
    }

    // Resolve absolute path and verify file exists
    const absPath = path.resolve(image.imagePath);

    if (!fs.existsSync(absPath)) {
      console.error(`Image file not found: ${absPath}`);
      return res.status(404).json({
        error: 'Image file not found',
        message: 'The image file is missing from storage'
      });
    }

    // Security check: ensure file is within expected directory
    // This prevents directory traversal attacks
    const uploadDir = process.env.UPLOAD_DIR || path.join(path.dirname(process.cwd()), 'uploads');
    const normalizedPath = path.normalize(absPath);
    const normalizedUploadDir = path.normalize(uploadDir);

    if (!normalizedPath.startsWith(normalizedUploadDir)) {
      console.error(`Security violation: Path traversal attempt - ${absPath}`);
      console.error(`Expected base directory: ${normalizedUploadDir}`);
      console.error(`Actual file path: ${normalizedPath}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Set Content-Type based on image format
    const contentType = image.imageFormat === 'jpeg' || image.imageFormat === 'jpg'
      ? 'image/jpeg'
      : 'image/png';

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Content-Disposition', `inline; filename="image-${imageId}.${image.imageFormat}"`);

    // Stream the file
    const fileStream = fs.createReadStream(absPath);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to stream image',
          message: error.message
        });
      }
    });

    fileStream.pipe(res);

    console.log(`Serving image ${imageId} (${contentType}) from ${absPath}`);

  } catch (error) {
    console.error('Serve image error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to serve image',
        message: error.message
      });
    }
  }
});

export default router;
