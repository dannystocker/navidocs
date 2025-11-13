/**
 * Authentication Middleware
 *
 * Provides middleware functions for protecting routes and checking permissions
 */

import { verifyAccessToken } from '../services/auth.service.js';
import { logAuditEvent } from '../services/audit.service.js';
import { getDb } from '../config/db.js';

/**
 * Authenticate JWT token from Authorization header
 *
 * Extracts and verifies JWT from 'Authorization: Bearer <token>' header
 * Attaches user info to req.user if valid
 *
 * Usage:
 *   router.get('/protected', authenticateToken, (req, res) => {
 *     // req.user.userId, req.user.email, req.user.emailVerified available
 *   })
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token is required'
    });
  }

  const result = verifyAccessToken(token);

  if (!result.valid) {
    logAuditEvent({
      eventType: 'auth.token_invalid',
      status: 'failure',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: JSON.stringify({ error: result.error })
    }).catch(err => console.error('[Auth] Audit log failed:', err));

    return res.status(401).json({
      success: false,
      error: 'Invalid or expired access token'
    });
  }

  // Attach user info to request
  req.user = result.payload;
  next();
}

/**
 * Require email verification
 *
 * Must be used after authenticateToken
 * Ensures the user has verified their email address
 *
 * Usage:
 *   router.post('/create-entity', authenticateToken, requireEmailVerified, (req, res) => {
 *     // Only users with verified emails can access
 *   })
 */
export function requireEmailVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!req.user.emailVerified) {
    logAuditEvent({
      userId: req.user.userId,
      eventType: 'auth.email_not_verified',
      status: 'denied',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(err => console.error('[Auth] Audit log failed:', err));

    return res.status(403).json({
      success: false,
      error: 'Email verification required. Please verify your email to continue.'
    });
  }

  next();
}

/**
 * Require account to be active
 *
 * Must be used after authenticateToken
 * Checks that user account is not suspended or deleted
 *
 * Usage:
 *   router.post('/action', authenticateToken, requireActiveAccount, (req, res) => {
 *     // Only active accounts can access
 *   })
 */
export function requireActiveAccount(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const db = getDb();
  const user = db.prepare('SELECT status FROM users WHERE id = ?')
    .get(req.user.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  if (user.status === 'suspended') {
    logAuditEvent({
      userId: req.user.userId,
      eventType: 'auth.account_suspended',
      status: 'denied',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(err => console.error('[Auth] Audit log failed:', err));

    return res.status(403).json({
      success: false,
      error: 'Account is suspended. Please contact support.'
    });
  }

  if (user.status === 'deleted') {
    return res.status(403).json({
      success: false,
      error: 'Account not found'
    });
  }

  next();
}

/**
 * Require organization membership
 *
 * Must be used after authenticateToken
 * Checks if user is a member of the specified organization
 *
 * The organization ID can come from:
 * - req.params.organizationId
 * - req.body.organizationId
 * - req.query.organizationId
 *
 * Usage:
 *   router.get('/organizations/:organizationId/entities', authenticateToken, requireOrganizationMember, (req, res) => {
 *     // Only organization members can access
 *   })
 */
export function requireOrganizationMember(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const organizationId = req.params.organizationId
    || req.body.organizationId
    || req.query.organizationId;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      error: 'Organization ID is required'
    });
  }

  const db = getDb();
  const membership = db.prepare(`
    SELECT role FROM user_organizations
    WHERE user_id = ? AND organization_id = ?
  `).get(req.user.userId, organizationId);

  if (!membership) {
    logAuditEvent({
      userId: req.user.userId,
      eventType: 'auth.org_access_denied',
      resourceType: 'organization',
      resourceId: organizationId,
      status: 'denied',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(err => console.error('[Auth] Audit log failed:', err));

    return res.status(403).json({
      success: false,
      error: 'You do not have access to this organization'
    });
  }

  // Attach organization role to request
  req.organizationRole = membership.role;
  next();
}

/**
 * Require organization role
 *
 * Must be used after authenticateToken and requireOrganizationMember
 * Checks if user has at least the specified role in the organization
 *
 * Role hierarchy (least to most privileged):
 * viewer < member < manager < admin
 *
 * Usage:
 *   router.post('/organizations/:organizationId/settings',
 *     authenticateToken,
 *     requireOrganizationMember,
 *     requireOrganizationRole('admin'),
 *     (req, res) => {
 *       // Only admins can access
 *     }
 *   )
 */
export function requireOrganizationRole(minimumRole) {
  const roleHierarchy = {
    viewer: 0,
    member: 1,
    manager: 2,
    admin: 3
  };

  return (req, res, next) => {
    if (!req.organizationRole) {
      return res.status(403).json({
        success: false,
        error: 'Organization membership required'
      });
    }

    const userRoleLevel = roleHierarchy[req.organizationRole] ?? -1;
    const requiredRoleLevel = roleHierarchy[minimumRole] ?? 999;

    if (userRoleLevel < requiredRoleLevel) {
      logAuditEvent({
        userId: req.user.userId,
        eventType: 'auth.insufficient_role',
        status: 'denied',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: JSON.stringify({
          userRole: req.organizationRole,
          requiredRole: minimumRole
        })
      }).catch(err => console.error('[Auth] Audit log failed:', err));

      return res.status(403).json({
        success: false,
        error: `Insufficient permissions. ${minimumRole} role required.`
      });
    }

    next();
  };
}

/**
 * Require entity permission
 *
 * Must be used after authenticateToken
 * Checks if user has at least the specified permission level for an entity
 *
 * The entity ID can come from:
 * - req.params.entityId
 * - req.body.entityId
 * - req.query.entityId
 *
 * Permission hierarchy (least to most privileged):
 * viewer < editor < manager < admin
 *
 * Usage:
 *   router.put('/entities/:entityId',
 *     authenticateToken,
 *     requireEntityPermission('editor'),
 *     (req, res) => {
 *       // Only users with editor+ permission can access
 *     }
 *   )
 */
export function requireEntityPermission(minimumPermission) {
  const permissionHierarchy = {
    viewer: 0,
    editor: 1,
    manager: 2,
    admin: 3
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const entityId = req.params.entityId
      || req.body.entityId
      || req.query.entityId;

    if (!entityId) {
      return res.status(400).json({
        success: false,
        error: 'Entity ID is required'
      });
    }

    const db = getDb();
    const now = Math.floor(Date.now() / 1000);

    // Check if user is system admin (bypass permission checks)
    const user = db.prepare('SELECT is_system_admin FROM users WHERE id = ?').get(req.user.userId);
    if (user && user.is_system_admin === 1) {
      req.entityPermission = 'admin';  // System admins have full access
      return next();
    }

    // Check entity_permissions table
    const permission = db.prepare(`
      SELECT permission_level, expires_at
      FROM entity_permissions
      WHERE user_id = ? AND entity_id = ?
    `).get(req.user.userId, entityId);

    // Check if permission exists and is not expired
    if (!permission || (permission.expires_at && permission.expires_at < now)) {
      logAuditEvent({
        userId: req.user.userId,
        eventType: 'auth.entity_access_denied',
        resourceType: 'entity',
        resourceId: entityId,
        status: 'denied',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: JSON.stringify({ requiredPermission: minimumPermission })
      }).catch(err => console.error('[Auth] Audit log failed:', err));

      return res.status(403).json({
        success: false,
        error: 'You do not have access to this entity'
      });
    }

    const userPermissionLevel = permissionHierarchy[permission.permission_level] ?? -1;
    const requiredPermissionLevel = permissionHierarchy[minimumPermission] ?? 999;

    if (userPermissionLevel < requiredPermissionLevel) {
      logAuditEvent({
        userId: req.user.userId,
        eventType: 'auth.insufficient_permission',
        resourceType: 'entity',
        resourceId: entityId,
        status: 'denied',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: JSON.stringify({
          userPermission: permission.permission_level,
          requiredPermission: minimumPermission
        })
      }).catch(err => console.error('[Auth] Audit log failed:', err));

      return res.status(403).json({
        success: false,
        error: `Insufficient permissions. ${minimumPermission} permission required.`
      });
    }

    // Attach entity permission to request
    req.entityPermission = permission.permission_level;
    next();
  };
}

/**
 * Optional authentication
 *
 * Attempts to authenticate but doesn't fail if token is missing
 * Useful for routes that have different behavior for authenticated users
 *
 * Usage:
 *   router.get('/public-data', optionalAuth, (req, res) => {
 *     if (req.user) {
 *       // Return personalized data
 *     } else {
 *       // Return public data
 *     }
 *   })
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    // No token provided, continue without user
    return next();
  }

  const result = verifyAccessToken(token);

  if (result.valid) {
    req.user = result.payload;
  }

  // Continue regardless of token validity
  next();
}

/**
 * Require system administrator privileges
 *
 * Must be used after authenticateToken
 * Checks if user is a system administrator
 *
 * System admins are defined by:
 * 1. SYSTEM_ADMIN_EMAILS environment variable (comma-separated list)
 * 2. is_system_admin flag in users table (future enhancement)
 *
 * Usage:
 *   router.put('/admin/settings/:key',
 *     authenticateToken,
 *     requireSystemAdmin,
 *     (req, res) => {
 *       // Only system admins can access
 *     }
 *   )
 */
export function requireSystemAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Check if user is in SYSTEM_ADMIN_EMAILS environment variable
  const adminEmails = process.env.SYSTEM_ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];

  if (adminEmails.includes(req.user.email)) {
    return next();
  }

  // Check if user has is_system_admin flag in database
  const db = getDb();
  const user = db.prepare('SELECT is_system_admin FROM users WHERE id = ?')
    .get(req.user.userId);

  if (user && user.is_system_admin === 1) {
    return next();
  }

  logAuditEvent({
    userId: req.user.userId,
    eventType: 'auth.system_admin_required',
    status: 'denied',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  }).catch(err => console.error('[Auth] Audit log failed:', err));

  return res.status(403).json({
    success: false,
    error: 'System administrator privileges required'
  });
}
