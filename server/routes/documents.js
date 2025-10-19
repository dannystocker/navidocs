/**
 * Documents Route - GET /api/documents/:id
 * Query document metadata with ownership verification
 */

import express from 'express';
import { getDb } from '../db/db.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

/**
 * GET /api/documents/:id
 * Get document metadata and page information
 *
 * @param {string} id - Document UUID
 * @returns {Object} Document metadata with pages
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid document ID format' });
    }

    // TODO: Authentication middleware should provide req.user
    const userId = req.user?.id || 'test-user-id';

    const db = getDb();

    // Query document with ownership check
    const document = db.prepare(`
      SELECT
        d.id,
        d.organization_id,
        d.entity_id,
        d.sub_entity_id,
        d.component_id,
        d.uploaded_by,
        d.title,
        d.document_type,
        d.file_path,
        d.file_name,
        d.file_size,
        d.mime_type,
        d.page_count,
        d.language,
        d.status,
        d.created_at,
        d.updated_at,
        d.metadata
      FROM documents d
      WHERE d.id = ?
    `).get(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify ownership or organization membership
    const hasAccess = db.prepare(`
      SELECT 1 FROM user_organizations
      WHERE user_id = ? AND organization_id = ?
      UNION
      SELECT 1 FROM documents
      WHERE id = ? AND uploaded_by = ?
      UNION
      SELECT 1 FROM document_shares
      WHERE document_id = ? AND shared_with = ?
    `).get(userId, document.organization_id, id, userId, id, userId);

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this document'
      });
    }

    // Get page information
    const pages = db.prepare(`
      SELECT
        id,
        page_number,
        ocr_confidence,
        ocr_language,
        ocr_completed_at,
        search_indexed_at
      FROM document_pages
      WHERE document_id = ?
      ORDER BY page_number ASC
    `).all(id);

    // Get entity information if linked
    let entity = null;
    if (document.entity_id) {
      entity = db.prepare(`
        SELECT id, name, entity_type
        FROM entities
        WHERE id = ?
      `).get(document.entity_id);
    }

    // Get component information if linked
    let component = null;
    if (document.component_id) {
      component = db.prepare(`
        SELECT id, name, manufacturer, model_number
        FROM components
        WHERE id = ?
      `).get(document.component_id);
    }

    // Parse metadata JSON if exists
    let metadata = null;
    if (document.metadata) {
      try {
        metadata = JSON.parse(document.metadata);
      } catch (e) {
        console.error('Error parsing document metadata:', e);
      }
    }

    // Build response
    const response = {
      id: document.id,
      organizationId: document.organization_id,
      entityId: document.entity_id,
      subEntityId: document.sub_entity_id,
      componentId: document.component_id,
      uploadedBy: document.uploaded_by,
      title: document.title,
      documentType: document.document_type,
      fileName: document.file_name,
      fileSize: document.file_size,
      mimeType: document.mime_type,
      pageCount: document.page_count,
      language: document.language,
      status: document.status,
      createdAt: document.created_at,
      updatedAt: document.updated_at,
      metadata,
      filePath: document.file_path, // For PDF serving (should be restricted in production)
      pages: pages.map(page => ({
        id: page.id,
        pageNumber: page.page_number,
        ocrConfidence: page.ocr_confidence,
        ocrLanguage: page.ocr_language,
        ocrCompletedAt: page.ocr_completed_at,
        searchIndexedAt: page.search_indexed_at
      })),
      entity,
      component
    };

    res.json(response);

  } catch (error) {
    console.error('Document retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve document',
      message: error.message
    });
  }
});

/**
 * GET /api/documents/:id/pdf
 * Stream the original PDF file to the client (inline)
 */
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid document ID format' });
    }

    const userId = req.user?.id || 'test-user-id';
    const db = getDb();

    const doc = db.prepare(`
      SELECT id, organization_id, file_path, file_name
      FROM documents
      WHERE id = ?
    `).get(id);

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const hasAccess = db.prepare(`
      SELECT 1 FROM user_organizations WHERE user_id = ? AND organization_id = ?
      UNION SELECT 1 FROM documents WHERE id = ? AND uploaded_by = ?
      UNION SELECT 1 FROM document_shares WHERE document_id = ? AND shared_with = ?
    `).get(userId, doc.organization_id, id, userId, id, userId);

    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    const absPath = path.resolve(doc.file_path);
    if (!fs.existsSync(absPath)) return res.status(404).json({ error: 'PDF file not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(doc.file_name || absPath)}"`);
    fs.createReadStream(absPath).pipe(res);
  } catch (error) {
    console.error('Serve PDF error:', error);
    res.status(500).json({ error: 'Failed to serve PDF', message: error.message });
  }
});

/**
 * GET /api/documents
 * List documents with optional filtering
 * Query params: organizationId, entityId, documentType, status, limit, offset
 */
router.get('/', async (req, res) => {
  try {
    const {
      organizationId,
      entityId,
      documentType,
      status,
      limit = 50,
      offset = 0
    } = req.query;

    // TODO: Authentication middleware should provide req.user
    const userId = req.user?.id || 'test-user-id';

    const db = getDb();

    // Build query with filters
    let query = `
      SELECT
        d.id,
        d.organization_id,
        d.entity_id,
        d.title,
        d.document_type,
        d.file_name,
        d.file_size,
        d.page_count,
        d.status,
        d.created_at,
        d.updated_at
      FROM documents d
      INNER JOIN user_organizations uo ON d.organization_id = uo.organization_id
      WHERE uo.user_id = ?
    `;

    const params = [userId];

    if (organizationId) {
      query += ' AND d.organization_id = ?';
      params.push(organizationId);
    }

    if (entityId) {
      query += ' AND d.entity_id = ?';
      params.push(entityId);
    }

    if (documentType) {
      query += ' AND d.document_type = ?';
      params.push(documentType);
    }

    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }

    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const documents = db.prepare(query).all(...params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM documents d
      INNER JOIN user_organizations uo ON d.organization_id = uo.organization_id
      WHERE uo.user_id = ?
    `;

    const countParams = [userId];

    if (organizationId) {
      countQuery += ' AND d.organization_id = ?';
      countParams.push(organizationId);
    }

    if (entityId) {
      countQuery += ' AND d.entity_id = ?';
      countParams.push(entityId);
    }

    if (documentType) {
      countQuery += ' AND d.document_type = ?';
      countParams.push(documentType);
    }

    if (status) {
      countQuery += ' AND d.status = ?';
      countParams.push(status);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      documents: documents.map(doc => ({
        id: doc.id,
        organizationId: doc.organization_id,
        entityId: doc.entity_id,
        title: doc.title,
        documentType: doc.document_type,
        fileName: doc.file_name,
        fileSize: doc.file_size,
        pageCount: doc.page_count,
        status: doc.status,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + documents.length < total
      }
    });

  } catch (error) {
    console.error('Documents list error:', error);
    res.status(500).json({
      error: 'Failed to retrieve documents',
      message: error.message
    });
  }
});

/**
 * DELETE /api/documents/:id
 * Soft delete a document (mark as deleted)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Authentication middleware should provide req.user
    const userId = req.user?.id || 'test-user-id';

    const db = getDb();

    // Check ownership
    const document = db.prepare(`
      SELECT id, organization_id, uploaded_by
      FROM documents
      WHERE id = ?
    `).get(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify user has permission (must be uploader or org admin)
    const hasPermission = db.prepare(`
      SELECT 1 FROM user_organizations
      WHERE user_id = ? AND organization_id = ? AND role IN ('admin', 'manager')
      UNION
      SELECT 1 FROM documents
      WHERE id = ? AND uploaded_by = ?
    `).get(userId, document.organization_id, id, userId);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to delete this document'
      });
    }

    // Soft delete - update status
    const timestamp = Date.now();
    db.prepare(`
      UPDATE documents
      SET status = 'deleted', updated_at = ?
      WHERE id = ?
    `).run(timestamp, id);

    res.json({
      message: 'Document deleted successfully',
      documentId: id
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      message: error.message
    });
  }
});

export default router;
