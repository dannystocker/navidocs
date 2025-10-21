/**
 * Organization Routes
 *
 * POST /api/organizations - Create organization
 * GET /api/organizations - List organizations
 * GET /api/organizations/:id - Get organization details
 * PUT /api/organizations/:id - Update organization
 * DELETE /api/organizations/:id - Delete organization
 * GET /api/organizations/:id/members - Get organization members
 * POST /api/organizations/:id/members - Add member to organization
 * DELETE /api/organizations/:id/members/:userId - Remove member from organization
 * GET /api/organizations/:id/stats - Get organization statistics
 */

import express from 'express';
import * as orgService from '../services/organization.service.js';
import * as authzService from '../services/authorization.service.js';
import { authenticateToken, requireOrganizationMember, requireOrganizationRole } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Create new organization
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, type, metadata } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Organization name is required'
      });
    }

    const organization = await orgService.createOrganization({
      name,
      type: type || 'business',
      metadata,
      createdBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      organization
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List organizations (user's organizations)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const organizations = authzService.getUserOrganizations(req.user.userId);

    res.json({
      success: true,
      organizations
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get organization by ID
 */
router.get('/:organizationId', authenticateToken, requireOrganizationMember, async (req, res) => {
  try {
    const organization = orgService.getOrganizationById(req.params.organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    res.json({
      success: true,
      organization: {
        ...organization,
        userRole: req.organizationRole
      }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update organization
 */
router.put('/:organizationId', authenticateToken, requireOrganizationMember, requireOrganizationRole('manager'), async (req, res) => {
  try {
    const { name, type, metadata } = req.body;

    const organization = await orgService.updateOrganization({
      organizationId: req.params.organizationId,
      name,
      type,
      metadata,
      updatedBy: req.user.userId
    });

    res.json({
      success: true,
      organization
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete organization
 */
router.delete('/:organizationId', authenticateToken, requireOrganizationMember, requireOrganizationRole('admin'), async (req, res) => {
  try {
    const result = await orgService.deleteOrganization({
      organizationId: req.params.organizationId,
      deletedBy: req.user.userId
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
 * Get organization members
 */
router.get('/:organizationId/members', authenticateToken, requireOrganizationMember, async (req, res) => {
  try {
    const members = authzService.getOrganizationMembers(req.params.organizationId);

    res.json({
      success: true,
      members
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Add member to organization
 */
router.post('/:organizationId/members', authenticateToken, requireOrganizationMember, requireOrganizationRole('manager'), async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const result = await authzService.addOrganizationMember({
      userId,
      organizationId: req.params.organizationId,
      role: role || 'member',
      addedBy: req.user.userId
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
 * Remove member from organization
 */
router.delete('/:organizationId/members/:userId', authenticateToken, requireOrganizationMember, requireOrganizationRole('manager'), async (req, res) => {
  try {
    const result = await authzService.removeOrganizationMember({
      userId: req.params.userId,
      organizationId: req.params.organizationId,
      removedBy: req.user.userId
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
 * Get organization statistics
 */
router.get('/:organizationId/stats', authenticateToken, requireOrganizationMember, async (req, res) => {
  try {
    const stats = orgService.getOrganizationStats(req.params.organizationId);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
