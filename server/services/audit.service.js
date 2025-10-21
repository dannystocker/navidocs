/**
 * Audit Logging Service
 *
 * Logs security and business events for compliance, debugging, and security monitoring
 * All timestamps are Unix epoch seconds
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/db.js';

/**
 * Log an audit event
 *
 * @param {Object} eventData - Event data
 * @param {string} eventData.userId - User ID (optional for anonymous events)
 * @param {string} eventData.eventType - Event type (e.g., 'user.login', 'entity.create')
 * @param {string} eventData.resourceType - Resource type (optional, e.g., 'entity', 'organization')
 * @param {string} eventData.resourceId - Resource ID (optional)
 * @param {string} eventData.ipAddress - IP address of the request
 * @param {string} eventData.userAgent - User agent string
 * @param {string} eventData.status - Event status: 'success', 'failure', or 'denied'
 * @param {string|Object} eventData.metadata - Additional metadata (will be JSON stringified if object)
 * @returns {Promise<Object>} Created audit log entry
 */
export async function logAuditEvent(eventData) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  const {
    userId = null,
    eventType,
    resourceType = null,
    resourceId = null,
    ipAddress = null,
    userAgent = null,
    status = 'success',
    metadata = null
  } = eventData;

  // Validate required fields
  if (!eventType) {
    throw new Error('eventType is required for audit logging');
  }

  if (!['success', 'failure', 'denied'].includes(status)) {
    throw new Error('status must be one of: success, failure, denied');
  }

  // Convert metadata to JSON string if it's an object
  const metadataString = metadata && typeof metadata === 'object'
    ? JSON.stringify(metadata)
    : metadata;

  const auditId = uuidv4();

  try {
    db.prepare(`
      INSERT INTO audit_log (
        id, user_id, event_type, resource_type, resource_id,
        ip_address, user_agent, status, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId,
      userId,
      eventType,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      status,
      metadataString,
      now
    );

    return {
      id: auditId,
      userId,
      eventType,
      resourceType,
      resourceId,
      status,
      createdAt: now
    };
  } catch (error) {
    // Log to console if database write fails (avoid losing audit trail)
    console.error('[Audit] Failed to log event:', error.message, eventData);
    throw error;
  }
}

/**
 * Get audit logs for a specific user
 *
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of records (default: 100)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @param {string} options.eventType - Filter by event type
 * @param {number} options.startDate - Filter by start date (Unix timestamp)
 * @param {number} options.endDate - Filter by end date (Unix timestamp)
 * @returns {Array} Audit log entries
 */
export function getAuditLogsByUser(userId, options = {}) {
  const db = getDb();
  const {
    limit = 100,
    offset = 0,
    eventType = null,
    startDate = null,
    endDate = null
  } = options;

  let query = `
    SELECT id, user_id, event_type, resource_type, resource_id,
           ip_address, user_agent, status, metadata, created_at
    FROM audit_log
    WHERE user_id = ?
  `;

  const params = [userId];

  if (eventType) {
    query += ' AND event_type = ?';
    params.push(eventType);
  }

  if (startDate) {
    query += ' AND created_at >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND created_at <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

/**
 * Get audit logs for a specific resource
 *
 * @param {string} resourceType - Resource type (e.g., 'entity', 'organization')
 * @param {string} resourceId - Resource ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of records (default: 100)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @returns {Array} Audit log entries
 */
export function getAuditLogsByResource(resourceType, resourceId, options = {}) {
  const db = getDb();
  const { limit = 100, offset = 0 } = options;

  return db.prepare(`
    SELECT id, user_id, event_type, resource_type, resource_id,
           ip_address, user_agent, status, metadata, created_at
    FROM audit_log
    WHERE resource_type = ? AND resource_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(resourceType, resourceId, limit, offset);
}

/**
 * Get recent audit logs (for admin dashboards)
 *
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of records (default: 100)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @param {string} options.status - Filter by status ('success', 'failure', 'denied')
 * @param {string} options.eventType - Filter by event type
 * @returns {Array} Audit log entries
 */
export function getRecentAuditLogs(options = {}) {
  const db = getDb();
  const {
    limit = 100,
    offset = 0,
    status = null,
    eventType = null
  } = options;

  let query = `
    SELECT id, user_id, event_type, resource_type, resource_id,
           ip_address, user_agent, status, metadata, created_at
    FROM audit_log
    WHERE 1=1
  `;

  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (eventType) {
    query += ' AND event_type = ?';
    params.push(eventType);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

/**
 * Get security alerts (failed logins, denied access attempts)
 *
 * @param {Object} options - Query options
 * @param {number} options.hours - Hours to look back (default: 24)
 * @param {number} options.limit - Maximum number of records (default: 100)
 * @returns {Array} Security alert entries
 */
export function getSecurityAlerts(options = {}) {
  const db = getDb();
  const { hours = 24, limit = 100 } = options;

  const now = Math.floor(Date.now() / 1000);
  const startTime = now - (hours * 60 * 60);

  return db.prepare(`
    SELECT id, user_id, event_type, resource_type, resource_id,
           ip_address, user_agent, status, metadata, created_at
    FROM audit_log
    WHERE status IN ('failure', 'denied')
      AND created_at >= ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(startTime, limit);
}

/**
 * Count events by type within a time period
 *
 * @param {Object} options - Query options
 * @param {number} options.startDate - Start date (Unix timestamp)
 * @param {number} options.endDate - End date (Unix timestamp)
 * @returns {Array} Event counts by type
 */
export function getEventStats(options = {}) {
  const db = getDb();
  const {
    startDate = Math.floor(Date.now() / 1000) - (24 * 60 * 60), // Last 24 hours
    endDate = Math.floor(Date.now() / 1000)
  } = options;

  return db.prepare(`
    SELECT event_type, status, COUNT(*) as count
    FROM audit_log
    WHERE created_at >= ? AND created_at <= ?
    GROUP BY event_type, status
    ORDER BY count DESC
  `).all(startDate, endDate);
}

/**
 * Clean up old audit logs (for data retention compliance)
 *
 * @param {number} retentionDays - Number of days to retain logs (default: 90)
 * @returns {Object} Deletion result
 */
export function cleanupOldAuditLogs(retentionDays = 90) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const cutoffDate = now - (retentionDays * 24 * 60 * 60);

  const result = db.prepare(`
    DELETE FROM audit_log
    WHERE created_at < ?
  `).run(cutoffDate);

  return {
    deleted: result.changes,
    cutoffDate,
    retentionDays
  };
}
