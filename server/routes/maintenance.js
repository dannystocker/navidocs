/**
 * Maintenance Routes
 *
 * POST /api/maintenance - Create maintenance record
 * GET /api/maintenance/:boatId - List all maintenance for boat
 * GET /api/maintenance/:boatId/upcoming - Get upcoming maintenance (next_due_date in future)
 * PUT /api/maintenance/:id - Update maintenance record
 * DELETE /api/maintenance/:id - Delete maintenance record
 */

import express from 'express';
import { getDb } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import logger from '../utils/logger.js';
import { addToIndex, updateIndex, removeFromIndex } from '../services/search-modules.service.js';

const router = express.Router();

/**
 * Helper: Validate boat ownership
 */
async function validateBoatOwnership(db, boatId, userId) {
  try {
    const boat = db.prepare(`
      SELECT id FROM boats WHERE id = ?
    `).get(boatId);

    if (!boat) {
      return { valid: false, error: 'Boat not found' };
    }

    // In a real implementation, verify user has access to this boat
    // through their organization or direct ownership
    return { valid: true };
  } catch (error) {
    logger.error('[Maintenance] Boat validation error:', error);
    return { valid: false, error: 'Internal server error' };
  }
}

/**
 * POST /api/maintenance
 * Create a new maintenance record
 *
 * @body {number} boatId - Boat ID
 * @body {string} service_type - Type of service (e.g., "Engine Oil Change", "Hull Inspection")
 * @body {string} date - Service date (YYYY-MM-DD)
 * @body {string} provider - Service provider name
 * @body {number} cost - Cost of service
 * @body {string} next_due_date - When next service is due (YYYY-MM-DD)
 * @body {string} notes - Additional notes
 *
 * @returns {Object} Created maintenance record
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { boatId, service_type, date, provider, cost, next_due_date, notes } = req.body;
    const userId = req.user?.id;

    // Validation
    if (!boatId || !service_type || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: boatId, service_type, date'
      });
    }

    // Validate boat ownership
    const db = getDb();
    const ownershipCheck = await validateBoatOwnership(db, boatId, userId);
    if (!ownershipCheck.valid) {
      return res.status(403).json({
        success: false,
        error: ownershipCheck.error
      });
    }

    // Validate dates
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    if (next_due_date && !dateRegex.test(next_due_date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid next_due_date format. Use YYYY-MM-DD'
      });
    }

    // Insert maintenance record
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO maintenance_records (
        boat_id,
        service_type,
        date,
        provider,
        cost,
        next_due_date,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      boatId,
      service_type,
      date,
      provider || null,
      cost || null,
      next_due_date || null,
      notes || null,
      now,
      now
    );

    // Retrieve and return the created record
    const record = db.prepare(`
      SELECT * FROM maintenance_records WHERE id = ?
    `).get(result.lastInsertRowid);

    logger.info(`[Maintenance] Created record ID ${record.id} for boat ${boatId}`, {
      userId,
      boatId,
      serviceType: service_type
    });

    // Index in search service
    try {
      await addToIndex('maintenance_records', record);
    } catch (indexError) {
      logger.error('Warning: Failed to index maintenance record:', indexError.message);
      // Don't fail the request if indexing fails
    }

    res.status(201).json({
      success: true,
      data: record
    });

  } catch (error) {
    logger.error('[Maintenance] POST error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create maintenance record',
      details: error.message
    });
  }
});

/**
 * GET /api/maintenance/:boatId
 * List all maintenance records for a specific boat
 * Supports pagination and filtering
 *
 * @param {number} boatId - Boat ID
 * @query {number} limit - Results per page (default: 50)
 * @query {number} offset - Pagination offset (default: 0)
 * @query {string} service_type - Filter by service type
 * @query {string} sortBy - Sort field: date, next_due_date, created_at (default: date)
 * @query {string} sortOrder - asc or desc (default: desc)
 *
 * @returns {Array} Array of maintenance records
 */
router.get('/:boatId', authenticateToken, async (req, res) => {
  try {
    const { boatId } = req.params;
    const userId = req.user?.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;
    const serviceTypeFilter = req.query.service_type;
    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Validate boat ownership
    const db = getDb();
    const ownershipCheck = await validateBoatOwnership(db, boatId, userId);
    if (!ownershipCheck.valid) {
      return res.status(403).json({
        success: false,
        error: ownershipCheck.error
      });
    }

    // Validate sort field
    const validSortFields = ['date', 'next_due_date', 'created_at', 'service_type', 'cost'];
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sortBy field'
      });
    }

    // Build query
    let query = 'SELECT * FROM maintenance_records WHERE boat_id = ?';
    const params = [boatId];

    if (serviceTypeFilter) {
      query += ' AND service_type = ?';
      params.push(serviceTypeFilter);
    }

    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const records = db.prepare(query).all(...params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM maintenance_records WHERE boat_id = ?';
    const countParams = [boatId];
    if (serviceTypeFilter) {
      countQuery += ' AND service_type = ?';
      countParams.push(serviceTypeFilter);
    }
    const countResult = db.prepare(countQuery).get(...countParams);

    logger.info(`[Maintenance] Retrieved ${records.length} records for boat ${boatId}`, {
      userId,
      boatId,
      limit,
      offset
    });

    res.json({
      success: true,
      data: records,
      pagination: {
        limit,
        offset,
        total: countResult.count,
        hasMore: offset + limit < countResult.count
      }
    });

  } catch (error) {
    logger.error('[Maintenance] GET all error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve maintenance records',
      details: error.message
    });
  }
});

/**
 * GET /api/maintenance/:boatId/upcoming
 * Get upcoming maintenance (where next_due_date is in the future)
 *
 * @param {number} boatId - Boat ID
 * @query {number} daysAhead - Look ahead N days (default: 90)
 * @query {string} sortOrder - asc or desc (default: asc - soonest first)
 *
 * @returns {Array} Array of upcoming maintenance records
 */
router.get('/:boatId/upcoming', authenticateToken, async (req, res) => {
  try {
    const { boatId } = req.params;
    const userId = req.user?.id;
    const daysAhead = parseInt(req.query.daysAhead) || 90;
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    // Validate boat ownership
    const db = getDb();
    const ownershipCheck = await validateBoatOwnership(db, boatId, userId);
    if (!ownershipCheck.valid) {
      return res.status(403).json({
        success: false,
        error: ownershipCheck.error
      });
    }

    // Calculate date range
    const today = new Date();
    const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    // Get upcoming maintenance
    const records = db.prepare(`
      SELECT
        *,
        CAST((julianday(next_due_date) - julianday(?)) AS INTEGER) as days_until_due
      FROM maintenance_records
      WHERE boat_id = ?
        AND next_due_date IS NOT NULL
        AND next_due_date >= ?
        AND next_due_date <= ?
      ORDER BY next_due_date ${sortOrder}
    `).all(todayStr, boatId, todayStr, futureDateStr);

    // Add urgency levels
    const enrichedRecords = records.map(record => {
      const daysUntil = record.days_until_due;
      let urgency = 'normal';
      if (daysUntil <= 7) {
        urgency = 'urgent';
      } else if (daysUntil <= 30) {
        urgency = 'warning';
      }
      return { ...record, urgency };
    });

    logger.info(`[Maintenance] Retrieved ${enrichedRecords.length} upcoming records for boat ${boatId}`, {
      userId,
      boatId,
      daysAhead
    });

    res.json({
      success: true,
      data: enrichedRecords,
      summary: {
        total: enrichedRecords.length,
        urgent: enrichedRecords.filter(r => r.urgency === 'urgent').length,
        warning: enrichedRecords.filter(r => r.urgency === 'warning').length,
        daysAhead
      }
    });

  } catch (error) {
    logger.error('[Maintenance] GET upcoming error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve upcoming maintenance',
      details: error.message
    });
  }
});

/**
 * PUT /api/maintenance/:id
 * Update a maintenance record
 *
 * @param {number} id - Maintenance record ID
 * @body Partial update fields: service_type, date, provider, cost, next_due_date, notes
 *
 * @returns {Object} Updated maintenance record
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { service_type, date, provider, cost, next_due_date, notes } = req.body;

    const db = getDb();

    // Get existing record
    const record = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance record not found'
      });
    }

    // Validate boat ownership
    const ownershipCheck = await validateBoatOwnership(db, record.boat_id, userId);
    if (!ownershipCheck.valid) {
      return res.status(403).json({
        success: false,
        error: ownershipCheck.error
      });
    }

    // Validate dates if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (date && !dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    if (next_due_date && !dateRegex.test(next_due_date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid next_due_date format. Use YYYY-MM-DD'
      });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (service_type !== undefined) {
      updates.push('service_type = ?');
      params.push(service_type);
    }
    if (date !== undefined) {
      updates.push('date = ?');
      params.push(date);
    }
    if (provider !== undefined) {
      updates.push('provider = ?');
      params.push(provider);
    }
    if (cost !== undefined) {
      updates.push('cost = ?');
      params.push(cost);
    }
    if (next_due_date !== undefined) {
      updates.push('next_due_date = ?');
      params.push(next_due_date);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    // Add updated_at timestamp
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());

    // Add ID to params
    params.push(id);

    // Execute update
    db.prepare(`
      UPDATE maintenance_records
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params);

    // Retrieve updated record
    const updatedRecord = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);

    logger.info(`[Maintenance] Updated record ID ${id}`, {
      userId,
      boatId: record.boat_id,
      fieldsUpdated: Object.keys(req.body).length
    });

    // Update search index
    try {
      await updateIndex('maintenance_records', updatedRecord);
    } catch (indexError) {
      logger.error('Warning: Failed to update search index:', indexError.message);
      // Don't fail the request if indexing fails
    }

    res.json({
      success: true,
      data: updatedRecord
    });

  } catch (error) {
    logger.error('[Maintenance] PUT error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update maintenance record',
      details: error.message
    });
  }
});

/**
 * DELETE /api/maintenance/:id
 * Delete a maintenance record
 *
 * @param {number} id - Maintenance record ID
 *
 * @returns {Object} Success message
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const db = getDb();

    // Get existing record
    const record = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance record not found'
      });
    }

    // Validate boat ownership
    const ownershipCheck = await validateBoatOwnership(db, record.boat_id, userId);
    if (!ownershipCheck.valid) {
      return res.status(403).json({
        success: false,
        error: ownershipCheck.error
      });
    }

    // Delete record
    db.prepare('DELETE FROM maintenance_records WHERE id = ?').run(id);

    logger.info(`[Maintenance] Deleted record ID ${id}`, {
      userId,
      boatId: record.boat_id
    });

    // Remove from search index
    try {
      await removeFromIndex('maintenance_records', parseInt(id));
    } catch (indexError) {
      logger.error('Warning: Failed to remove from search index:', indexError.message);
      // Don't fail the request if indexing fails
    }

    res.json({
      success: true,
      message: 'Maintenance record deleted successfully'
    });

  } catch (error) {
    logger.error('[Maintenance] DELETE error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete maintenance record',
      details: error.message
    });
  }
});

export default router;
