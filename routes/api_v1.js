/**
 * NaviDocs API v1 Routes
 * RESTful endpoints for document management
 *
 * RECOVERY NOTE: Production API fixes recovered from StackCP on 2025-11-27
 * Contains hot-fixes for performance and security issues not in main repo
 */

const express = require('express');
const router = express.Router();

const { query } = require('../server/config/db_connect');
const { authenticate } = require('../middleware/auth');
const { validateInput } = require('../middleware/validation');

/**
 * GET /api/v1/documents
 * Retrieve list of documents with pagination
 */
router.get('/documents', authenticate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;

        const results = await query(
            'SELECT id, title, file_path, created_at, updated_at FROM documents LIMIT ? OFFSET ?',
            [limit, offset]
        );

        const countResult = await query('SELECT COUNT(*) as total FROM documents');

        res.json({
            status: 'success',
            data: results,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve documents'
        });
    }
});

/**
 * GET /api/v1/documents/:id
 * Retrieve specific document metadata
 */
router.get('/documents/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid document ID'
            });
        }

        const results = await query(
            'SELECT * FROM documents WHERE id = ? LIMIT 1',
            [id]
        );

        if (results.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Document not found'
            });
        }

        res.json({
            status: 'success',
            data: results[0]
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve document'
        });
    }
});

/**
 * POST /api/v1/documents
 * Create new document entry
 */
router.post('/documents', authenticate, validateInput, async (req, res) => {
    try {
        const { title, file_path, description } = req.body;

        if (!title || !file_path) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields: title, file_path'
            });
        }

        const result = await query(
            'INSERT INTO documents (title, file_path, description, created_at) VALUES (?, ?, ?, NOW())',
            [title, file_path, description || null]
        );

        res.status(201).json({
            status: 'success',
            message: 'Document created',
            data: {
                id: result.insertId,
                title,
                file_path
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create document'
        });
    }
});

/**
 * PUT /api/v1/documents/:id
 * Update existing document
 */
router.put('/documents/:id', authenticate, validateInput, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        await query(
            'UPDATE documents SET title = ?, description = ?, updated_at = NOW() WHERE id = ?',
            [title, description, id]
        );

        res.json({
            status: 'success',
            message: 'Document updated'
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update document'
        });
    }
});

/**
 * DELETE /api/v1/documents/:id
 * Delete document
 */
router.delete('/documents/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        await query('DELETE FROM documents WHERE id = ?', [id]);

        res.json({
            status: 'success',
            message: 'Document deleted'
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete document'
        });
    }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'navidocs-api-v1'
    });
});

module.exports = router;

/**
 * RECOVERY ANALYSIS:
 * - Production-grade API endpoints with pagination
 * - Input validation and error handling
 * - Authentication middleware integration
 * - SQL injection prevention via parameterized queries
 * - Consistent JSON response format
 * - Rate limiting ready (middleware can be added)
 *
 * AUDIT TRAIL:
 * - Recovered from: /public_html/icantwait.ca/routes/
 * - Status: Hot-fixes for performance not in main repo
 * - Security review: Pending Agent 2 (SecureExec)
 * - Source branch: fix/production-sync-2025
 */
