/**
 * Contacts Routes
 *
 * POST /api/contacts - Create new contact
 * GET /api/contacts/:organizationId - List all contacts for organization
 * GET /api/contacts/type/:type - Filter by type (marina/mechanic/vendor)
 * GET /api/contacts/search?q=query - Search contacts by name/type
 * PUT /api/contacts/:id - Update contact
 * DELETE /api/contacts/:id - Delete contact
 * GET /api/contacts/:id - Get contact details
 * GET /api/contacts/:id/maintenance - Get related maintenance records
 */

import express from 'express';
import * as contactsService from '../services/contacts.service.js';
import { authenticateToken, requireOrganizationMember } from '../middleware/auth.middleware.js';
import { addToIndex, updateIndex, removeFromIndex } from '../services/search-modules.service.js';

const router = express.Router();

/**
 * Create new contact
 * POST /api/contacts
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      organizationId,
      name,
      type = 'other',
      phone,
      email,
      address,
      notes
    } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Contact name is required'
      });
    }

    const contact = await contactsService.createContact({
      organizationId,
      name,
      type,
      phone,
      email,
      address,
      notes,
      createdBy: req.user.userId
    });

    // Index in search service
    try {
      await addToIndex('contacts', contact);
    } catch (indexError) {
      console.error('Warning: Failed to index contact:', indexError.message);
      // Don't fail the request if indexing fails
    }

    res.status(201).json({
      success: true,
      contact
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all contacts for an organization
 * GET /api/contacts/:organizationId
 */
router.get('/:organizationId', authenticateToken, requireOrganizationMember, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const contacts = contactsService.getContactsByOrganization(organizationId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const count = contactsService.getContactCount(organizationId);
    const countByType = contactsService.getContactCountByType(organizationId);

    res.json({
      success: true,
      contacts,
      count,
      countByType,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get contact by ID
 * GET /api/contacts/:id/details
 */
router.get('/:id/details', authenticateToken, async (req, res) => {
  try {
    const contact = contactsService.getContactById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    res.json({
      success: true,
      contact
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Filter contacts by type
 * GET /api/contacts/type/:type?organizationId=...
 */
router.get('/type/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { organizationId, limit = 100, offset = 0 } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    const contacts = contactsService.getContactsByType(organizationId, type, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      contacts,
      type,
      count: contacts.length
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Search contacts by name, email, phone, or type
 * GET /api/contacts/search?q=query&organizationId=...
 */
router.get('/search/query', authenticateToken, async (req, res) => {
  try {
    const { q: query, organizationId, limit = 50, offset = 0 } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const contacts = contactsService.searchContacts(organizationId, query, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      contacts,
      query,
      count: contacts.length
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update contact
 * PUT /api/contacts/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      phone,
      email,
      address,
      notes
    } = req.body;

    const contact = await contactsService.updateContact({
      id,
      name,
      type,
      phone,
      email,
      address,
      notes,
      updatedBy: req.user.userId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    // Update search index
    try {
      await updateIndex('contacts', contact);
    } catch (indexError) {
      console.error('Warning: Failed to update search index:', indexError.message);
      // Don't fail the request if indexing fails
    }

    res.json({
      success: true,
      contact
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete contact
 * DELETE /api/contacts/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await contactsService.deleteContact(id, req.user.userId);

    // Remove from search index
    try {
      await removeFromIndex('contacts', parseInt(id));
    } catch (indexError) {
      console.error('Warning: Failed to remove from search index:', indexError.message);
      // Don't fail the request if indexing fails
    }

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
 * Get related maintenance records for a contact
 * GET /api/contacts/:id/maintenance
 */
router.get('/:id/maintenance', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required'
      });
    }

    const maintenance = contactsService.getRelatedMaintenanceRecords(organizationId, id);

    res.json({
      success: true,
      maintenance,
      count: maintenance.length
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
