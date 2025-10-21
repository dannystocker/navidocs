/**
 * Permission Routes
 *
 * POST /api/permissions/entities/:entityId - Grant entity permission
 * DELETE /api/permissions/entities/:entityId/users/:userId - Revoke entity permission
 * GET /api/permissions/entities/:entityId - List entity permissions
 * GET /api/permissions/users/:userId/entities - List user's entity permissions
 * GET /api/permissions/check/entities/:entityId - Check user's permission for entity
 */

import express from 'express';
import * as authzService from '../services/authorization.service.js';
import { authenticateToken, requireEntityPermission } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Grant entity permission to user
 */
router.post('/entities/:entityId', authenticateToken, requireEntityPermission('manager'), async (req, res) => {
  try {
    const { userId, permissionLevel, expiresAt } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (!permissionLevel) {
      return res.status(400).json({
        success: false,
        error: 'Permission level is required (viewer, editor, manager, admin)'
      });
    }

    const permission = await authzService.grantEntityPermission({
      userId,
      entityId: req.params.entityId,
      permissionLevel,
      grantedBy: req.user.userId,
      expiresAt: expiresAt || null
    });

    res.json({
      success: true,
      permission
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Revoke entity permission from user
 */
router.delete('/entities/:entityId/users/:userId', authenticateToken, requireEntityPermission('manager'), async (req, res) => {
  try {
    const result = await authzService.revokeEntityPermission({
      userId: req.params.userId,
      entityId: req.params.entityId,
      revokedBy: req.user.userId
    });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List all permissions for an entity
 */
router.get('/entities/:entityId', authenticateToken, requireEntityPermission('viewer'), async (req, res) => {
  try {
    const includeExpired = req.query.includeExpired === 'true';

    const permissions = authzService.getEntityPermissions(req.params.entityId, {
      includeExpired
    });

    res.json({
      success: true,
      permissions
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List user's entity permissions
 */
router.get('/users/:userId/entities', authenticateToken, async (req, res) => {
  try {
    // Users can only view their own permissions unless they're querying as admin
    if (req.params.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own permissions'
      });
    }

    const includeExpired = req.query.includeExpired === 'true';

    const permissions = authzService.getUserEntityPermissions(req.params.userId, {
      includeExpired
    });

    res.json({
      success: true,
      permissions
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Check if current user has permission for entity
 */
router.get('/check/entities/:entityId', authenticateToken, async (req, res) => {
  try {
    const minimumPermission = req.query.level || 'viewer';

    const check = await authzService.checkEntityPermission(
      req.user.userId,
      req.params.entityId,
      minimumPermission
    );

    res.json({
      success: true,
      ...check
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
