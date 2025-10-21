/**
 * Organization Service
 *
 * Handles organization CRUD operations and management
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/db.js';
import { logAuditEvent } from './audit.service.js';

/**
 * Create a new organization
 *
 * @param {Object} params - Organization parameters
 * @param {string} params.name - Organization name
 * @param {string} params.type - Organization type (business, personal, etc.)
 * @param {string} params.createdBy - User creating the organization
 * @param {Object} params.metadata - Optional metadata
 * @returns {Promise<Object>} Created organization
 */
export async function createOrganization({ name, type = 'business', createdBy, metadata = null }) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  if (!name || name.trim().length === 0) {
    throw new Error('Organization name is required');
  }

  const organizationId = uuidv4();

  const metadataString = metadata ? JSON.stringify(metadata) : null;

  db.prepare(`
    INSERT INTO organizations (id, name, type, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(organizationId, name.trim(), type, metadataString, now, now);

  // Add creator as admin
  db.prepare(`
    INSERT INTO user_organizations (user_id, organization_id, role, joined_at)
    VALUES (?, ?, 'admin', ?)
  `).run(createdBy, organizationId, now);

  await logAuditEvent({
    userId: createdBy,
    eventType: 'organization.create',
    resourceType: 'organization',
    resourceId: organizationId,
    status: 'success',
    metadata: JSON.stringify({ name, type })
  });

  return {
    id: organizationId,
    name: name.trim(),
    type,
    metadata,
    createdAt: now,
    updatedAt: now,
    role: 'admin' // Creator's role
  };
}

/**
 * Get organization by ID
 *
 * @param {string} organizationId - Organization ID
 * @returns {Object|null} Organization or null if not found
 */
export function getOrganizationById(organizationId) {
  const db = getDb();

  const org = db.prepare(`
    SELECT * FROM organizations WHERE id = ?
  `).get(organizationId);

  if (!org) {
    return null;
  }

  // Parse metadata if it exists
  if (org.metadata) {
    try {
      org.metadata = JSON.parse(org.metadata);
    } catch (e) {
      org.metadata = null;
    }
  }

  return org;
}

/**
 * Update organization
 *
 * @param {Object} params - Update parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.name - New name (optional)
 * @param {string} params.type - New type (optional)
 * @param {Object} params.metadata - New metadata (optional)
 * @param {string} params.updatedBy - User performing update
 * @returns {Promise<Object>} Updated organization
 */
export async function updateOrganization({ organizationId, name, type, metadata, updatedBy }) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  const org = getOrganizationById(organizationId);
  if (!org) {
    throw new Error('Organization not found');
  }

  const updates = [];
  const values = [];

  if (name !== undefined && name.trim().length > 0) {
    updates.push('name = ?');
    values.push(name.trim());
  }

  if (type !== undefined) {
    updates.push('type = ?');
    values.push(type);
  }

  if (metadata !== undefined) {
    updates.push('metadata = ?');
    values.push(metadata ? JSON.stringify(metadata) : null);
  }

  if (updates.length === 0) {
    throw new Error('No updates provided');
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(organizationId);

  db.prepare(`
    UPDATE organizations
    SET ${updates.join(', ')}
    WHERE id = ?
  `).run(...values);

  await logAuditEvent({
    userId: updatedBy,
    eventType: 'organization.update',
    resourceType: 'organization',
    resourceId: organizationId,
    status: 'success',
    metadata: JSON.stringify({ updates: updates.map((u, i) => ({ field: u, value: values[i] })) })
  });

  return getOrganizationById(organizationId);
}

/**
 * Delete organization
 *
 * @param {Object} params - Deletion parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.deletedBy - User performing deletion
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteOrganization({ organizationId, deletedBy }) {
  const db = getDb();

  const org = getOrganizationById(organizationId);
  if (!org) {
    throw new Error('Organization not found');
  }

  // Check if organization has entities
  const entityCount = db.prepare('SELECT COUNT(*) as count FROM entities WHERE organization_id = ?')
    .get(organizationId);

  if (entityCount.count > 0) {
    throw new Error(`Cannot delete organization with ${entityCount.count} entities. Please delete or reassign entities first.`);
  }

  // Delete organization (cascade will handle user_organizations)
  db.prepare('DELETE FROM organizations WHERE id = ?').run(organizationId);

  await logAuditEvent({
    userId: deletedBy,
    eventType: 'organization.delete',
    resourceType: 'organization',
    resourceId: organizationId,
    status: 'success',
    metadata: JSON.stringify({ name: org.name, type: org.type })
  });

  return {
    success: true,
    deletedOrganization: {
      id: organizationId,
      name: org.name
    }
  };
}

/**
 * List organizations with optional filtering
 *
 * @param {Object} options - Query options
 * @param {string} options.type - Filter by type
 * @param {number} options.limit - Maximum results
 * @param {number} options.offset - Results offset
 * @returns {Array} Organizations
 */
export function listOrganizations(options = {}) {
  const db = getDb();
  const { type, limit = 100, offset = 0 } = options;

  let query = 'SELECT * FROM organizations WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const orgs = db.prepare(query).all(...params);

  // Parse metadata for each org
  return orgs.map(org => {
    if (org.metadata) {
      try {
        org.metadata = JSON.parse(org.metadata);
      } catch (e) {
        org.metadata = null;
      }
    }
    return org;
  });
}

/**
 * Get organization statistics
 *
 * @param {string} organizationId - Organization ID
 * @returns {Object} Organization statistics
 */
export function getOrganizationStats(organizationId) {
  const db = getDb();

  const memberCount = db.prepare(`
    SELECT COUNT(*) as count FROM user_organizations
    WHERE organization_id = ?
  `).get(organizationId);

  const entityCount = db.prepare(`
    SELECT COUNT(*) as count FROM entities
    WHERE organization_id = ?
  `).get(organizationId);

  const roleBreakdown = db.prepare(`
    SELECT role, COUNT(*) as count
    FROM user_organizations
    WHERE organization_id = ?
    GROUP BY role
  `).all(organizationId);

  return {
    organizationId,
    memberCount: memberCount.count,
    entityCount: entityCount.count,
    roleBreakdown: roleBreakdown.reduce((acc, r) => {
      acc[r.role] = r.count;
      return acc;
    }, {})
  };
}
