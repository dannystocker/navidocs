/**
 * Authorization Service
 *
 * Handles permission management for entities and organizations
 * Supports granular access control across multi-tenant architecture
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/db.js';
import { logAuditEvent } from './audit.service.js';

// Permission levels (ordered by hierarchy)
const PERMISSION_LEVELS = {
  viewer: 0,
  editor: 1,
  manager: 2,
  admin: 3
};

const ORGANIZATION_ROLES = {
  viewer: 0,
  member: 1,
  manager: 2,
  admin: 3
};

/**
 * Grant permission to access an entity
 *
 * @param {Object} params - Permission parameters
 * @param {string} params.userId - User receiving permission
 * @param {string} params.entityId - Entity being granted access to
 * @param {string} params.permissionLevel - Permission level (viewer, editor, manager, admin)
 * @param {string} params.grantedBy - User granting the permission
 * @param {number} params.expiresAt - Optional expiration timestamp
 * @returns {Promise<Object>} Created permission
 */
export async function grantEntityPermission({ userId, entityId, permissionLevel, grantedBy, expiresAt = null }) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  // Validate permission level
  if (!PERMISSION_LEVELS.hasOwnProperty(permissionLevel)) {
    throw new Error(`Invalid permission level: ${permissionLevel}. Must be one of: viewer, editor, manager, admin`);
  }

  // Check if entity exists
  const entity = db.prepare('SELECT id, organization_id FROM entities WHERE id = ?').get(entityId);
  if (!entity) {
    throw new Error('Entity not found');
  }

  // Check if user exists
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if permission already exists
  const existing = db.prepare(`
    SELECT id, permission_level FROM entity_permissions
    WHERE user_id = ? AND entity_id = ?
  `).get(userId, entityId);

  let permissionId;

  if (existing) {
    // Update existing permission
    permissionId = existing.id;
    db.prepare(`
      UPDATE entity_permissions
      SET permission_level = ?,
          granted_by = ?,
          granted_at = ?,
          expires_at = ?
      WHERE id = ?
    `).run(permissionLevel, grantedBy, now, expiresAt, permissionId);
  } else {
    // Create new permission
    permissionId = uuidv4();
    db.prepare(`
      INSERT INTO entity_permissions (
        id, user_id, entity_id, permission_level, granted_by, granted_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(permissionId, userId, entityId, permissionLevel, grantedBy, now, expiresAt);
  }

  await logAuditEvent({
    userId: grantedBy,
    eventType: 'permission.grant',
    resourceType: 'entity',
    resourceId: entityId,
    status: 'success',
    metadata: JSON.stringify({
      targetUserId: userId,
      permissionLevel,
      expiresAt,
      action: existing ? 'update' : 'create'
    })
  });

  return {
    id: permissionId,
    userId,
    entityId,
    permissionLevel,
    grantedBy,
    grantedAt: now,
    expiresAt
  };
}

/**
 * Revoke entity permission
 *
 * @param {Object} params - Revocation parameters
 * @param {string} params.userId - User whose permission is being revoked
 * @param {string} params.entityId - Entity to revoke access from
 * @param {string} params.revokedBy - User performing the revocation
 * @returns {Promise<Object>} Revocation result
 */
export async function revokeEntityPermission({ userId, entityId, revokedBy }) {
  const db = getDb();

  const permission = db.prepare(`
    SELECT id, permission_level FROM entity_permissions
    WHERE user_id = ? AND entity_id = ?
  `).get(userId, entityId);

  if (!permission) {
    throw new Error('Permission not found');
  }

  db.prepare('DELETE FROM entity_permissions WHERE id = ?').run(permission.id);

  await logAuditEvent({
    userId: revokedBy,
    eventType: 'permission.revoke',
    resourceType: 'entity',
    resourceId: entityId,
    status: 'success',
    metadata: JSON.stringify({
      targetUserId: userId,
      previousPermissionLevel: permission.permission_level
    })
  });

  return {
    success: true,
    userId,
    entityId,
    revokedPermissionLevel: permission.permission_level
  };
}

/**
 * Check if user has permission for entity
 *
 * @param {string} userId - User ID
 * @param {string} entityId - Entity ID
 * @param {string} minimumPermission - Minimum required permission level
 * @returns {Promise<Object>} Permission check result
 */
export async function checkEntityPermission(userId, entityId, minimumPermission = 'viewer') {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  const permission = db.prepare(`
    SELECT permission_level, expires_at
    FROM entity_permissions
    WHERE user_id = ? AND entity_id = ?
  `).get(userId, entityId);

  if (!permission) {
    return {
      hasPermission: false,
      reason: 'No permission found'
    };
  }

  // Check if permission is expired
  if (permission.expires_at && permission.expires_at < now) {
    return {
      hasPermission: false,
      reason: 'Permission expired'
    };
  }

  // Check if permission level is sufficient
  const userLevel = PERMISSION_LEVELS[permission.permission_level] ?? -1;
  const requiredLevel = PERMISSION_LEVELS[minimumPermission] ?? 999;

  if (userLevel < requiredLevel) {
    return {
      hasPermission: false,
      reason: 'Insufficient permission level',
      currentLevel: permission.permission_level,
      requiredLevel: minimumPermission
    };
  }

  return {
    hasPermission: true,
    permissionLevel: permission.permission_level,
    expiresAt: permission.expires_at
  };
}

/**
 * Get all entity permissions for a user
 *
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {boolean} options.includeExpired - Include expired permissions
 * @returns {Array} User's entity permissions
 */
export function getUserEntityPermissions(userId, options = {}) {
  const db = getDb();
  const { includeExpired = false } = options;
  const now = Math.floor(Date.now() / 1000);

  let query = `
    SELECT ep.*, e.name as entity_name, e.type as entity_type
    FROM entity_permissions ep
    JOIN entities e ON ep.entity_id = e.id
    WHERE ep.user_id = ?
  `;

  if (!includeExpired) {
    query += ` AND (ep.expires_at IS NULL OR ep.expires_at > ${now})`;
  }

  query += ' ORDER BY ep.granted_at DESC';

  return db.prepare(query).all(userId);
}

/**
 * Get all permissions for an entity
 *
 * @param {string} entityId - Entity ID
 * @param {Object} options - Query options
 * @param {boolean} options.includeExpired - Include expired permissions
 * @returns {Array} Entity permissions
 */
export function getEntityPermissions(entityId, options = {}) {
  const db = getDb();
  const { includeExpired = false } = options;
  const now = Math.floor(Date.now() / 1000);

  let query = `
    SELECT ep.*, u.email as user_email, u.name as user_name
    FROM entity_permissions ep
    JOIN users u ON ep.user_id = u.id
    WHERE ep.entity_id = ?
  `;

  if (!includeExpired) {
    query += ` AND (ep.expires_at IS NULL OR ep.expires_at > ${now})`;
  }

  query += ' ORDER BY ep.granted_at DESC';

  return db.prepare(query).all(entityId);
}

/**
 * Add user to organization
 *
 * @param {Object} params - Membership parameters
 * @param {string} params.userId - User to add
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.role - Organization role (viewer, member, manager, admin)
 * @param {string} params.addedBy - User performing the action
 * @returns {Promise<Object>} Membership result
 */
export async function addOrganizationMember({ userId, organizationId, role = 'member', addedBy }) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  // Validate role
  if (!ORGANIZATION_ROLES.hasOwnProperty(role)) {
    throw new Error(`Invalid role: ${role}. Must be one of: viewer, member, manager, admin`);
  }

  // Check if organization exists
  const org = db.prepare('SELECT id, name FROM organizations WHERE id = ?').get(organizationId);
  if (!org) {
    throw new Error('Organization not found');
  }

  // Check if user exists
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if already a member
  const existing = db.prepare(`
    SELECT role FROM user_organizations
    WHERE user_id = ? AND organization_id = ?
  `).get(userId, organizationId);

  if (existing) {
    // Update role
    db.prepare(`
      UPDATE user_organizations
      SET role = ?
      WHERE user_id = ? AND organization_id = ?
    `).run(role, userId, organizationId);
  } else {
    // Add as new member
    db.prepare(`
      INSERT INTO user_organizations (user_id, organization_id, role, joined_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, organizationId, role, now);
  }

  await logAuditEvent({
    userId: addedBy,
    eventType: 'organization.member_add',
    resourceType: 'organization',
    resourceId: organizationId,
    status: 'success',
    metadata: JSON.stringify({
      targetUserId: userId,
      targetUserEmail: user.email,
      role,
      action: existing ? 'update' : 'add'
    })
  });

  return {
    success: true,
    userId,
    organizationId,
    role,
    action: existing ? 'updated' : 'added'
  };
}

/**
 * Remove user from organization
 *
 * @param {Object} params - Removal parameters
 * @param {string} params.userId - User to remove
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.removedBy - User performing the action
 * @returns {Promise<Object>} Removal result
 */
export async function removeOrganizationMember({ userId, organizationId, removedBy }) {
  const db = getDb();

  const membership = db.prepare(`
    SELECT role FROM user_organizations
    WHERE user_id = ? AND organization_id = ?
  `).get(userId, organizationId);

  if (!membership) {
    throw new Error('User is not a member of this organization');
  }

  db.prepare(`
    DELETE FROM user_organizations
    WHERE user_id = ? AND organization_id = ?
  `).run(userId, organizationId);

  await logAuditEvent({
    userId: removedBy,
    eventType: 'organization.member_remove',
    resourceType: 'organization',
    resourceId: organizationId,
    status: 'success',
    metadata: JSON.stringify({
      targetUserId: userId,
      previousRole: membership.role
    })
  });

  return {
    success: true,
    userId,
    organizationId,
    removedRole: membership.role
  };
}

/**
 * Check if user is member of organization
 *
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @param {string} minimumRole - Minimum required role
 * @returns {Object} Membership check result
 */
export function checkOrganizationMembership(userId, organizationId, minimumRole = 'viewer') {
  const db = getDb();

  const membership = db.prepare(`
    SELECT role FROM user_organizations
    WHERE user_id = ? AND organization_id = ?
  `).get(userId, organizationId);

  if (!membership) {
    return {
      isMember: false,
      reason: 'Not a member'
    };
  }

  const userRoleLevel = ORGANIZATION_ROLES[membership.role] ?? -1;
  const requiredRoleLevel = ORGANIZATION_ROLES[minimumRole] ?? 999;

  if (userRoleLevel < requiredRoleLevel) {
    return {
      isMember: true,
      hasSufficientRole: false,
      currentRole: membership.role,
      requiredRole: minimumRole
    };
  }

  return {
    isMember: true,
    hasSufficientRole: true,
    role: membership.role
  };
}

/**
 * Get all organization members
 *
 * @param {string} organizationId - Organization ID
 * @returns {Array} Organization members
 */
export function getOrganizationMembers(organizationId) {
  const db = getDb();

  return db.prepare(`
    SELECT uo.*, u.email, u.name, u.email_verified
    FROM user_organizations uo
    JOIN users u ON uo.user_id = u.id
    WHERE uo.organization_id = ?
    ORDER BY uo.joined_at DESC
  `).all(organizationId);
}

/**
 * Get user's organizations
 *
 * @param {string} userId - User ID
 * @returns {Array} User's organizations
 */
export function getUserOrganizations(userId) {
  const db = getDb();

  return db.prepare(`
    SELECT uo.role, uo.joined_at, o.*
    FROM user_organizations uo
    JOIN organizations o ON uo.organization_id = o.id
    WHERE uo.user_id = ?
    ORDER BY uo.joined_at DESC
  `).all(userId);
}

/**
 * Cleanup expired entity permissions
 *
 * @returns {Object} Cleanup result
 */
export function cleanupExpiredPermissions() {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  const result = db.prepare(`
    DELETE FROM entity_permissions
    WHERE expires_at IS NOT NULL AND expires_at < ?
  `).run(now);

  return {
    deleted: result.changes,
    timestamp: now
  };
}
