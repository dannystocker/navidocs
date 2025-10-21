/**
 * System Settings Routes
 *
 * POST /api/admin/settings - Create new setting (admin only)
 * GET /api/admin/settings - Get all settings (admin only)
 * GET /api/admin/settings/categories - Get all categories (admin only)
 * GET /api/admin/settings/category/:category - Get settings by category (admin only)
 * GET /api/admin/settings/:key - Get specific setting (admin only)
 * PUT /api/admin/settings/:key - Update setting (admin only)
 * DELETE /api/admin/settings/:key - Delete setting (admin only)
 * POST /api/admin/settings/test-email - Test email configuration (admin only)
 */

import express from 'express';
import * as settingsService from '../services/settings.service.js';
import { authenticateToken, requireSystemAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// All settings routes require system admin privileges
router.use(authenticateToken, requireSystemAdmin);

/**
 * Get all settings
 */
router.get('/', async (req, res) => {
  try {
    const includeEncrypted = req.query.includeEncrypted === 'true';
    const settings = settingsService.getAllSettings({ includeEncrypted });

    res.json({
      success: true,
      settings,
      count: settings.length
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = settingsService.getCategories();

    res.json({
      success: true,
      categories
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get settings by category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const includeEncrypted = req.query.includeEncrypted === 'true';
    const settings = settingsService.getSettingsByCategory(req.params.category, {
      includeEncrypted
    });

    res.json({
      success: true,
      category: req.params.category,
      settings,
      count: settings.length
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get specific setting
 */
router.get('/:key', async (req, res) => {
  try {
    const setting = settingsService.getSetting(req.params.key);

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found'
      });
    }

    res.json({
      success: true,
      setting
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create new setting
 */
router.post('/', async (req, res) => {
  try {
    const { key, value, encrypted, category, description } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Setting key is required'
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Category is required'
      });
    }

    const setting = await settingsService.setSetting({
      key,
      value,
      encrypted: encrypted || false,
      category,
      description,
      updatedBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      setting
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update setting
 */
router.put('/:key', async (req, res) => {
  try {
    const { value, description } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        error: 'Setting value is required'
      });
    }

    // Get existing setting to preserve encryption flag and category
    const existingSetting = settingsService.getSetting(req.params.key);

    if (!existingSetting) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found'
      });
    }

    const setting = await settingsService.setSetting({
      key: req.params.key,
      value,
      encrypted: existingSetting.encrypted,
      category: existingSetting.category,
      description: description || existingSetting.description,
      updatedBy: req.user.userId
    });

    res.json({
      success: true,
      setting
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete setting
 */
router.delete('/:key', async (req, res) => {
  try {
    const result = await settingsService.deleteSetting(
      req.params.key,
      req.user.userId
    );

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
 * Test email configuration
 */
router.post('/test-email', async (req, res) => {
  try {
    const result = await settingsService.testEmailConfiguration();

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

export default router;
