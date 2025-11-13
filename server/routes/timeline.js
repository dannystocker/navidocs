import express from 'express';
import { getDb } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/organizations/:orgId/timeline', authenticateToken, async (req, res) => {
  const { orgId } = req.params;
  const { limit = 50, offset = 0, eventType, entityId, startDate, endDate } = req.query;

  // Verify user belongs to organization
  if (req.user.organizationId !== orgId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const db = getDb();

  // Build query with filters
  let query = `
    SELECT
      a.*,
      u.name as user_name,
      u.email as user_email
    FROM activity_log a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.organization_id = ?
  `;

  const params = [orgId];

  if (eventType) {
    query += ` AND a.event_type = ?`;
    params.push(eventType);
  }

  if (entityId) {
    query += ` AND a.entity_id = ?`;
    params.push(entityId);
  }

  if (startDate) {
    query += ` AND a.created_at >= ?`;
    params.push(parseInt(startDate));
  }

  if (endDate) {
    query += ` AND a.created_at <= ?`;
    params.push(parseInt(endDate));
  }

  query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  try {
    const events = db.prepare(query).all(...params);

    // Get total count
    const countQuery = query.split('ORDER BY')[0].replace('SELECT a.*, u.name as user_name, u.email as user_email', 'SELECT COUNT(*) as total');
    const { total } = db.prepare(countQuery).get(...params.slice(0, -2));

    // Parse metadata
    const parsedEvents = events.map(event => ({
      ...event,
      metadata: event.metadata ? JSON.parse(event.metadata) : {},
      user: {
        id: event.user_id,
        name: event.user_name,
        email: event.user_email
      }
    }));

    res.json({
      events: parsedEvents,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + events.length < total
      }
    });
  } catch (error) {
    console.error('[Timeline] Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

export default router;
