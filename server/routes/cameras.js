/**
 * Cameras Route - Home Assistant RTSP/ONVIF camera integration
 * Handles camera feed registration, webhook tokens, and snapshot management
 */

import express from 'express';
import { getDb } from '../db/db.js';
import { randomBytes } from 'crypto';
import logger from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { addToIndex, updateIndex, removeFromIndex } from '../services/search-modules.service.js';

const router = express.Router();

/**
 * Utility: Generate unique webhook token
 */
function generateWebhookToken() {
  return randomBytes(32).toString('hex');
}

/**
 * Utility: Validate RTSP URL format
 */
function validateRtspUrl(url) {
  if (!url) return false;
  const rtspRegex = /^rtsp:\/\/([^@]+@)?([a-zA-Z0-9.-]+|\[[\da-fA-F:]+\])(:\d+)?\/[^\s]*$/i;
  const httpRegex = /^https?:\/\/([^@]+@)?([a-zA-Z0-9.-]+|\[[\da-fA-F:]+\])(:\d+)?\/[^\s]*$/i;
  return rtspRegex.test(url) || httpRegex.test(url);
}

/**
 * Utility: Verify boat access
 */
function verifyBoatAccess(boatId, userId, db) {
  try {
    // Check if user has access to this boat through organization
    const access = db.prepare(`
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = ?
      AND EXISTS (
        SELECT 1 FROM boats b
        WHERE b.id = ? AND b.organization_id = uo.organization_id
      )
    `).get(userId, boatId);

    return !!access;
  } catch (error) {
    logger.error('Error verifying boat access:', { boatId, userId, error: error.message });
    return false;
  }
}

/**
 * POST /api/cameras
 * Register new camera feed for a boat
 *
 * @body {Object} camera - Camera configuration
 * @body {number} boatId - Boat ID
 * @body {string} cameraName - Camera name/label
 * @body {string} rtspUrl - RTSP stream URL
 * @returns {Object} Created camera with webhook_token
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { boatId, cameraName, rtspUrl } = req.body;
    const userId = req.user?.id || 'test-user-id';

    // Validation
    if (!boatId) {
      return res.status(400).json({ error: 'boatId is required' });
    }
    if (!cameraName || cameraName.trim().length === 0) {
      return res.status(400).json({ error: 'cameraName is required' });
    }
    if (!rtspUrl || !validateRtspUrl(rtspUrl)) {
      return res.status(400).json({ error: 'Invalid RTSP URL format' });
    }

    const db = getDb();

    // Verify boat access
    if (!verifyBoatAccess(boatId, userId, db)) {
      return res.status(403).json({ error: 'Access denied to this boat' });
    }

    // Verify boat exists
    const boat = db.prepare('SELECT id FROM boats WHERE id = ?').get(boatId);
    if (!boat) {
      return res.status(404).json({ error: 'Boat not found' });
    }

    // Generate unique webhook token
    const webhookToken = generateWebhookToken();

    // Insert camera feed
    const result = db.prepare(`
      INSERT INTO camera_feeds (boat_id, camera_name, rtsp_url, webhook_token, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(boatId, cameraName, rtspUrl, webhookToken);

    // Fetch created camera
    const camera = db.prepare(`
      SELECT id, boat_id, camera_name, rtsp_url, last_snapshot_url, webhook_token, created_at, updated_at
      FROM camera_feeds
      WHERE id = ?
    `).get(result.lastInsertRowid);

    // Index in search service
    try {
      await addToIndex('camera_feeds', camera);
    } catch (indexError) {
      logger.error('Warning: Failed to index camera feed:', indexError.message);
      // Don't fail the request if indexing fails
    }

    res.status(201).json({
      success: true,
      camera: {
        id: camera.id,
        boatId: camera.boat_id,
        cameraName: camera.camera_name,
        rtspUrl: camera.rtsp_url,
        lastSnapshotUrl: camera.last_snapshot_url,
        webhookToken: camera.webhook_token,
        createdAt: camera.created_at,
        updatedAt: camera.updated_at
      }
    });
  } catch (error) {
    logger.error('Error creating camera:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/cameras/:boatId
 * List all cameras for a specific boat
 *
 * @param {number} boatId - Boat ID
 * @returns {Array} Array of cameras
 */
router.get('/:boatId', authenticateToken, async (req, res) => {
  try {
    const { boatId } = req.params;
    const userId = req.user?.id || 'test-user-id';

    if (!boatId || isNaN(parseInt(boatId))) {
      return res.status(400).json({ error: 'Invalid boatId' });
    }

    const db = getDb();

    // Verify boat access
    if (!verifyBoatAccess(parseInt(boatId), userId, db)) {
      return res.status(403).json({ error: 'Access denied to this boat' });
    }

    // Fetch all cameras for boat
    const cameras = db.prepare(`
      SELECT id, boat_id, camera_name, rtsp_url, last_snapshot_url, webhook_token, created_at, updated_at
      FROM camera_feeds
      WHERE boat_id = ?
      ORDER BY created_at DESC
    `).all(parseInt(boatId));

    res.json({
      success: true,
      count: cameras.length,
      cameras: cameras.map(c => ({
        id: c.id,
        boatId: c.boat_id,
        cameraName: c.camera_name,
        rtspUrl: c.rtsp_url,
        lastSnapshotUrl: c.last_snapshot_url,
        webhookToken: c.webhook_token,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }))
    });
  } catch (error) {
    logger.error('Error fetching cameras:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/cameras/:boatId/stream
 * Get live stream URLs and configuration for boat cameras
 *
 * @param {number} boatId - Boat ID
 * @returns {Object} Stream URLs and proxy configuration
 */
router.get('/:boatId/stream', authenticateToken, async (req, res) => {
  try {
    const { boatId } = req.params;
    const userId = req.user?.id || 'test-user-id';

    if (!boatId || isNaN(parseInt(boatId))) {
      return res.status(400).json({ error: 'Invalid boatId' });
    }

    const db = getDb();

    // Verify boat access
    if (!verifyBoatAccess(parseInt(boatId), userId, db)) {
      return res.status(403).json({ error: 'Access denied to this boat' });
    }

    // Fetch all cameras for boat
    const cameras = db.prepare(`
      SELECT id, boat_id, camera_name, rtsp_url, last_snapshot_url, webhook_token, created_at
      FROM camera_feeds
      WHERE boat_id = ?
      ORDER BY created_at ASC
    `).all(parseInt(boatId));

    if (cameras.length === 0) {
      return res.status(404).json({ error: 'No cameras found for this boat' });
    }

    const streams = cameras.map(c => ({
      id: c.id,
      cameraName: c.camera_name,
      rtspUrl: c.rtsp_url,
      lastSnapshotUrl: c.last_snapshot_url,
      proxyPath: `/api/cameras/proxy/${c.id}`,
      webhookUrl: `${process.env.PUBLIC_API_URL || 'http://localhost:3001'}/api/cameras/webhook/${c.webhook_token}`,
      createdAt: c.created_at
    }));

    res.json({
      success: true,
      boatId: parseInt(boatId),
      cameraCount: cameras.length,
      streams
    });
  } catch (error) {
    logger.error('Error fetching stream URLs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cameras/webhook/:token
 * Receive Home Assistant motion/snapshot webhooks
 *
 * @param {string} token - Camera webhook token
 * @body {Object} payload - Home Assistant event data
 * @returns {Object} Acknowledgment
 */
router.post('/webhook/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const payload = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Webhook token is required' });
    }

    const db = getDb();

    // Find camera by webhook token
    const camera = db.prepare(`
      SELECT id, boat_id, camera_name FROM camera_feeds
      WHERE webhook_token = ?
    `).get(token);

    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    // Extract snapshot URL from Home Assistant payload
    let snapshotUrl = null;
    if (payload.snapshot_url) {
      snapshotUrl = payload.snapshot_url;
    } else if (payload.image_url) {
      snapshotUrl = payload.image_url;
    } else if (payload.data && payload.data.snapshot_url) {
      snapshotUrl = payload.data.snapshot_url;
    }

    // Update last snapshot URL if provided
    if (snapshotUrl) {
      db.prepare(`
        UPDATE camera_feeds
        SET last_snapshot_url = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(snapshotUrl, camera.id);

      logger.info('Camera snapshot updated', {
        cameraId: camera.id,
        cameraName: camera.camera_name,
        snapshotUrl: snapshotUrl.substring(0, 100) + '...'
      });
    }

    // Log webhook event
    const eventType = payload.type || payload.event_type || 'snapshot';
    logger.info('Camera webhook received', {
      cameraId: camera.id,
      boatId: camera.boat_id,
      eventType,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Webhook received',
      cameraId: camera.id,
      eventType,
      snapshotUpdated: !!snapshotUrl
    });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/cameras/:id
 * Update camera settings
 *
 * @param {number} id - Camera ID
 * @body {Object} updates - Fields to update (cameraName, rtspUrl)
 * @returns {Object} Updated camera
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { cameraName, rtspUrl } = req.body;
    const userId = req.user?.id || 'test-user-id';

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid camera ID' });
    }

    const db = getDb();

    // Find camera
    const camera = db.prepare('SELECT boat_id FROM camera_feeds WHERE id = ?').get(parseInt(id));
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    // Verify boat access
    if (!verifyBoatAccess(camera.boat_id, userId, db)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate updates
    if (cameraName && cameraName.trim().length === 0) {
      return res.status(400).json({ error: 'cameraName cannot be empty' });
    }
    if (rtspUrl && !validateRtspUrl(rtspUrl)) {
      return res.status(400).json({ error: 'Invalid RTSP URL format' });
    }

    // Build update statement
    const updates = [];
    const values = [];

    if (cameraName !== undefined) {
      updates.push('camera_name = ?');
      values.push(cameraName);
    }
    if (rtspUrl !== undefined) {
      updates.push('rtsp_url = ?');
      values.push(rtspUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = datetime("now")');
    values.push(parseInt(id));

    const sql = `UPDATE camera_feeds SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    // Fetch updated camera
    const updated = db.prepare(`
      SELECT id, boat_id, camera_name, rtsp_url, last_snapshot_url, webhook_token, created_at, updated_at
      FROM camera_feeds
      WHERE id = ?
    `).get(parseInt(id));

    // Update search index
    try {
      await updateIndex('camera_feeds', updated);
    } catch (indexError) {
      logger.error('Warning: Failed to update search index:', indexError.message);
      // Don't fail the request if indexing fails
    }

    res.json({
      success: true,
      camera: {
        id: updated.id,
        boatId: updated.boat_id,
        cameraName: updated.camera_name,
        rtspUrl: updated.rtsp_url,
        lastSnapshotUrl: updated.last_snapshot_url,
        webhookToken: updated.webhook_token,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      }
    });
  } catch (error) {
    logger.error('Error updating camera:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/cameras/:id
 * Remove camera from system
 *
 * @param {number} id - Camera ID
 * @returns {Object} Deletion confirmation
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'test-user-id';

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid camera ID' });
    }

    const db = getDb();

    // Find camera
    const camera = db.prepare('SELECT id, boat_id, camera_name FROM camera_feeds WHERE id = ?').get(parseInt(id));
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    // Verify boat access
    if (!verifyBoatAccess(camera.boat_id, userId, db)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete camera
    db.prepare('DELETE FROM camera_feeds WHERE id = ?').run(parseInt(id));

    logger.info('Camera deleted', {
      cameraId: camera.id,
      boatId: camera.boat_id,
      cameraName: camera.camera_name
    });

    // Remove from search index
    try {
      await removeFromIndex('camera_feeds', parseInt(id));
    } catch (indexError) {
      logger.error('Warning: Failed to remove from search index:', indexError.message);
      // Don't fail the request if indexing fails
    }

    res.json({
      success: true,
      message: 'Camera deleted successfully',
      cameraId: camera.id
    });
  } catch (error) {
    logger.error('Error deleting camera:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/cameras/proxy/:id
 * Proxy RTSP stream (for clients that cannot access RTSP directly)
 * Note: Actual streaming implementation depends on deployment architecture
 *
 * @param {number} id - Camera ID
 * @returns {Stream} Proxied stream or error
 */
router.get('/proxy/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'test-user-id';

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid camera ID' });
    }

    const db = getDb();

    // Find camera
    const camera = db.prepare('SELECT rtsp_url, boat_id FROM camera_feeds WHERE id = ?').get(parseInt(id));
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    // Verify boat access
    if (!verifyBoatAccess(camera.boat_id, userId, db)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Return stream info
    // Full streaming implementation would use ffmpeg or similar
    res.json({
      success: true,
      message: 'Stream proxy endpoint',
      note: 'Real-time streaming requires ffmpeg or HLS conversion',
      rtspUrl: camera.rtsp_url,
      recommendations: [
        'Use HLS conversion: ffmpeg -i rtsp_url -c:v libx264 -c:a aac -f hls stream.m3u8',
        'Or proxy with reverse proxy like nginx',
        'Or embed in MJPEG stream with motion package'
      ]
    });
  } catch (error) {
    logger.error('Error accessing proxy:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
