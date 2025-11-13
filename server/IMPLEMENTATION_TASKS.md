# NaviDocs Auth System - Implementation Task Breakdown

## Overview
This document breaks down the multi-tenancy authentication and authorization system into granular, PR-sized tasks with clear acceptance criteria, module boundaries, and testing requirements.

---

## Phase 1: Foundation

### Task 1.1: Database Schema Migration
**Branch:** `feat/auth-schema-migration`
**Estimated Effort:** 4 hours
**Priority:** P0 (Blocker)

**Deliverables:**
1. Migration script: `/migrations/003_auth_tables.sql`
2. Rollback script: `/migrations/003_auth_tables_down.sql`
3. Migration runner updates

**Schema Changes:**

```sql
-- /migrations/003_auth_tables.sql

-- Entity-level permissions (granular access control)
CREATE TABLE entity_permissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  permission_level TEXT NOT NULL CHECK(permission_level IN ('viewer', 'editor', 'manager', 'admin')),
  granted_by TEXT NOT NULL,
  granted_at INTEGER NOT NULL,
  expires_at INTEGER,
  UNIQUE(user_id, entity_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_entity_perms_user ON entity_permissions(user_id);
CREATE INDEX idx_entity_perms_entity ON entity_permissions(entity_id);
CREATE INDEX idx_entity_perms_expires ON entity_permissions(expires_at);

-- Refresh tokens for secure session management
CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  device_info TEXT,
  ip_address TEXT,
  expires_at INTEGER NOT NULL,
  revoked BOOLEAN DEFAULT 0,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used BOOLEAN DEFAULT 0,
  used_at INTEGER,
  ip_address TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Audit log for security events
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL CHECK(status IN ('success', 'failure', 'denied')),
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_event ON audit_log(event_type);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_audit_status ON audit_log(status);

-- Add email verification to users table
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verification_token TEXT;
ALTER TABLE users ADD COLUMN email_verification_expires INTEGER;

-- Add account status to users
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'deleted'));
ALTER TABLE users ADD COLUMN suspended_at INTEGER;
ALTER TABLE users ADD COLUMN suspended_reason TEXT;

-- Add role constraint to user_organizations
-- SQLite doesn't support ALTER CHECK, so we document it here
-- In production PostgreSQL, add: CHECK(role IN ('admin', 'manager', 'member', 'viewer'))
```

**Acceptance Criteria:**
- [ ] Migration script runs without errors on clean database
- [ ] Migration script is idempotent (can run multiple times safely)
- [ ] Rollback script cleanly reverts all changes
- [ ] All foreign keys are enforced (test with invalid data)
- [ ] All indexes improve query performance (verify with EXPLAIN QUERY PLAN)
- [ ] CHECK constraints prevent invalid data
- [ ] Migration runner logs progress and errors

**Testing:**
```javascript
// /test/migrations/003_auth_tables.test.js
describe('Auth Tables Migration', () => {
  it('creates all tables', () => {
    // Verify tables exist
  });

  it('creates all indexes', () => {
    // Verify indexes exist
  });

  it('enforces foreign key constraints', () => {
    // Try to insert invalid foreign key
  });

  it('enforces check constraints', () => {
    // Try to insert invalid permission_level
  });

  it('rollback removes all tables', () => {
    // Run down migration and verify cleanup
  });
});
```

**Files Changed:**
- `/migrations/003_auth_tables.sql` (new)
- `/migrations/003_auth_tables_down.sql` (new)
- `/run-migration.js` (update to run new migration)
- `/test/migrations/003_auth_tables.test.js` (new)

---

### Task 1.2: Authentication Service Core
**Branch:** `feat/auth-service`
**Estimated Effort:** 8 hours
**Priority:** P0 (Blocker)
**Dependencies:** Task 1.1

**Module Interface:**

```javascript
// /services/auth.js

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/db.js';
import { AuditService } from './audit.js';

const BCRYPT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthService {
  /**
   * Register a new user
   * @param {string} email - User email (unique)
   * @param {string} password - Plain text password (min 8 chars)
   * @param {string} name - User display name
   * @returns {Promise<{id: string, email: string, name: string}>}
   * @throws {Error} If email already exists or validation fails
   */
  async register(email, password, name) {
    // Validate inputs
    this._validateEmail(email);
    this._validatePassword(password);

    const db = getDb();

    // Check if email exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Generate email verification token
    const verificationToken = uuidv4();
    const verificationExpires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const userId = uuidv4();
    const now = Date.now();

    db.prepare(`
      INSERT INTO users (
        id, email, name, password_hash, status,
        email_verified, email_verification_token, email_verification_expires,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'active', 0, ?, ?, ?, ?)
    `).run(userId, email, name, passwordHash, verificationToken, verificationExpires, now, now);

    // Create personal organization
    const orgId = uuidv4();
    db.prepare(`
      INSERT INTO organizations (id, name, type, created_at, updated_at)
      VALUES (?, ?, 'personal', ?, ?)
    `).run(orgId, `${name}'s Organization`, now, now);

    // Add user to organization as admin
    db.prepare(`
      INSERT INTO user_organizations (user_id, organization_id, role, joined_at)
      VALUES (?, ?, 'admin', ?)
    `).run(userId, orgId, now);

    // Log audit event
    await AuditService.logEvent('user_registered', userId, null, null, 'success', {
      email,
      organization_id: orgId
    });

    return {
      id: userId,
      email,
      name,
      emailVerified: false,
      verificationToken // Return for testing; in production, send via email
    };
  }

  /**
   * Authenticate user and generate tokens
   * @param {string} email
   * @param {string} password
   * @param {Object} deviceInfo - { userAgent, ipAddress }
   * @returns {Promise<{accessToken: string, refreshToken: string, user: Object}>}
   * @throws {Error} If credentials invalid or account suspended
   */
  async login(email, password, deviceInfo = {}) {
    const db = getDb();

    // Get user
    const user = db.prepare(`
      SELECT id, email, name, password_hash, status, email_verified
      FROM users WHERE email = ?
    `).get(email);

    if (!user) {
      await AuditService.logEvent('login_failed', null, null, null, 'failure', {
        email,
        reason: 'user_not_found',
        ip_address: deviceInfo.ipAddress
      });
      throw new Error('Invalid credentials');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      await AuditService.logEvent('login_failed', user.id, null, null, 'failure', {
        email,
        reason: 'invalid_password',
        ip_address: deviceInfo.ipAddress
      });
      throw new Error('Invalid credentials');
    }

    // Check account status
    if (user.status === 'suspended') {
      await AuditService.logEvent('login_denied', user.id, null, null, 'denied', {
        reason: 'account_suspended',
        ip_address: deviceInfo.ipAddress
      });
      throw new Error('Account suspended');
    }

    if (user.status === 'deleted') {
      throw new Error('Account not found');
    }

    // Generate access token (JWT)
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified === 1
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'navidocs-api'
      }
    );

    // Generate refresh token
    const refreshToken = uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    const refreshTokenId = uuidv4();
    const expiresAt = Date.now() + REFRESH_TOKEN_EXPIRES_IN;

    db.prepare(`
      INSERT INTO refresh_tokens (
        id, user_id, token_hash, device_info, ip_address, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      refreshTokenId,
      user.id,
      refreshTokenHash,
      JSON.stringify(deviceInfo),
      deviceInfo.ipAddress,
      expiresAt,
      Date.now()
    );

    // Update last login
    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
      .run(Date.now(), user.id);

    // Log successful login
    await AuditService.logEvent('login_success', user.id, null, null, 'success', {
      ip_address: deviceInfo.ipAddress,
      user_agent: deviceInfo.userAgent
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified === 1
      }
    };
  }

  /**
   * Revoke refresh token (logout)
   * @param {string} refreshToken - Token to revoke
   * @returns {Promise<boolean>} True if revoked, false if not found
   */
  async logout(refreshToken) {
    const db = getDb();

    // Find and revoke token
    const tokens = db.prepare('SELECT id, token_hash, user_id FROM refresh_tokens WHERE revoked = 0').all();

    for (const record of tokens) {
      const matches = await bcrypt.compare(refreshToken, record.token_hash);
      if (matches) {
        db.prepare('UPDATE refresh_tokens SET revoked = 1, revoked_at = ? WHERE id = ?')
          .run(Date.now(), record.id);

        await AuditService.logEvent('logout', record.user_id, null, null, 'success', {});
        return true;
      }
    }

    return false;
  }

  /**
   * Generate new access token from refresh token
   * @param {string} refreshToken
   * @returns {Promise<{accessToken: string}>}
   * @throws {Error} If refresh token invalid, expired, or revoked
   */
  async refreshAccessToken(refreshToken) {
    const db = getDb();
    const now = Date.now();

    // Find valid refresh token
    const tokens = db.prepare(`
      SELECT id, token_hash, user_id, expires_at, revoked
      FROM refresh_tokens
      WHERE expires_at > ? AND revoked = 0
    `).all(now);

    let validToken = null;
    for (const record of tokens) {
      const matches = await bcrypt.compare(refreshToken, record.token_hash);
      if (matches) {
        validToken = record;
        break;
      }
    }

    if (!validToken) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user
    const user = db.prepare('SELECT id, email, name, email_verified, status FROM users WHERE id = ?')
      .get(validToken.user_id);

    if (!user || user.status !== 'active') {
      throw new Error('User account not active');
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified === 1
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'navidocs-api'
      }
    );

    return { accessToken };
  }

  /**
   * Initiate password reset flow
   * @param {string} email
   * @returns {Promise<{resetToken: string}>} Token to send via email
   */
  async forgotPassword(email) {
    const db = getDb();

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

    // Don't reveal if email exists (security)
    if (!user) {
      return { resetToken: null }; // Silently fail
    }

    // Generate reset token
    const resetToken = uuidv4();
    const tokenHash = await bcrypt.hash(resetToken, BCRYPT_ROUNDS);
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    const tokenId = uuidv4();
    db.prepare(`
      INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(tokenId, user.id, tokenHash, expiresAt, Date.now());

    await AuditService.logEvent('password_reset_requested', user.id, null, null, 'success', {});

    return { resetToken }; // In production, send via email and return { success: true }
  }

  /**
   * Complete password reset
   * @param {string} resetToken
   * @param {string} newPassword
   * @returns {Promise<boolean>}
   * @throws {Error} If token invalid, expired, or used
   */
  async resetPassword(resetToken, newPassword) {
    this._validatePassword(newPassword);

    const db = getDb();
    const now = Date.now();

    // Find valid reset token
    const tokens = db.prepare(`
      SELECT id, token_hash, user_id, expires_at, used
      FROM password_reset_tokens
      WHERE expires_at > ? AND used = 0
    `).all(now);

    let validToken = null;
    for (const record of tokens) {
      const matches = await bcrypt.compare(resetToken, record.token_hash);
      if (matches) {
        validToken = record;
        break;
      }
    }

    if (!validToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update password
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .run(passwordHash, now, validToken.user_id);

    // Mark token as used
    db.prepare('UPDATE password_reset_tokens SET used = 1, used_at = ? WHERE id = ?')
      .run(now, validToken.id);

    // Revoke all refresh tokens (force re-login)
    db.prepare('UPDATE refresh_tokens SET revoked = 1, revoked_at = ? WHERE user_id = ?')
      .run(now, validToken.user_id);

    await AuditService.logEvent('password_reset_completed', validToken.user_id, null, null, 'success', {});

    return true;
  }

  /**
   * Verify email address
   * @param {string} verificationToken
   * @returns {Promise<boolean>}
   * @throws {Error} If token invalid or expired
   */
  async verifyEmail(verificationToken) {
    const db = getDb();
    const now = Date.now();

    const user = db.prepare(`
      SELECT id FROM users
      WHERE email_verification_token = ? AND email_verification_expires > ?
    `).get(verificationToken, now);

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    db.prepare(`
      UPDATE users
      SET email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL
      WHERE id = ?
    `).run(user.id);

    await AuditService.logEvent('email_verified', user.id, null, null, 'success', {});

    return true;
  }

  // Private validation methods
  _validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  _validatePassword(password) {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Require at least one uppercase, one lowercase, one number
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      throw new Error('Password must contain uppercase, lowercase, and number');
    }
  }
}

export default new AuthService();
```

**Acceptance Criteria:**
- [ ] User can register with email/password/name
- [ ] Duplicate email registration fails with clear error
- [ ] Password is hashed with bcrypt (cost=12)
- [ ] Email verification token generated and stored
- [ ] Personal organization created for new user
- [ ] User can login with valid credentials
- [ ] Login returns JWT access token and refresh token
- [ ] Invalid credentials rejected with generic error message
- [ ] Suspended account login denied
- [ ] Refresh token can generate new access token
- [ ] Expired/revoked refresh tokens rejected
- [ ] Password reset token generated and validated
- [ ] Reset password updates hash and revokes all sessions
- [ ] Email verification marks user as verified
- [ ] All operations logged to audit table
- [ ] All passwords validated for strength
- [ ] Unit tests cover 95%+ of code paths

**Testing:**
```javascript
// /test/services/auth.test.js
describe('AuthService', () => {
  describe('register', () => {
    it('creates user with hashed password', async () => {});
    it('creates personal organization', async () => {});
    it('rejects duplicate email', async () => {});
    it('rejects weak password', async () => {});
    it('rejects invalid email', async () => {});
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {});
    it('rejects invalid password', async () => {});
    it('rejects non-existent user', async () => {});
    it('rejects suspended account', async () => {});
    it('updates last_login_at', async () => {});
  });

  describe('refreshAccessToken', () => {
    it('generates new access token', async () => {});
    it('rejects expired refresh token', async () => {});
    it('rejects revoked refresh token', async () => {});
  });

  describe('forgotPassword', () => {
    it('generates reset token', async () => {});
    it('does not reveal non-existent email', async () => {});
  });

  describe('resetPassword', () => {
    it('updates password hash', async () => {});
    it('revokes all refresh tokens', async () => {});
    it('rejects used token', async () => {});
    it('rejects expired token', async () => {});
  });

  describe('verifyEmail', () => {
    it('marks email as verified', async () => {});
    it('rejects invalid token', async () => {});
  });
});
```

**Files Changed:**
- `/services/auth.js` (new)
- `/test/services/auth.test.js` (new)

---

### Task 1.3: Audit Service
**Branch:** `feat/audit-service`
**Estimated Effort:** 3 hours
**Priority:** P0 (Blocker)
**Dependencies:** Task 1.1

**Module Interface:**

```javascript
// /services/audit.js

import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/db.js';

export class AuditService {
  /**
   * Log a security or business event
   * @param {string} eventType - Event category (login, logout, permission_grant, etc)
   * @param {string|null} userId - User who triggered event (null for anonymous)
   * @param {string|null} resourceType - Type of resource affected (entity, document, organization)
   * @param {string|null} resourceId - ID of affected resource
   * @param {string} status - Outcome: success, failure, denied
   * @param {Object} metadata - Additional context (ip_address, user_agent, details)
   * @returns {Promise<string>} Audit log entry ID
   */
  static async logEvent(eventType, userId, resourceType, resourceId, status, metadata = {}) {
    const db = getDb();

    const auditId = uuidv4();
    const now = Date.now();

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
      metadata.ip_address || null,
      metadata.user_agent || null,
      status,
      JSON.stringify(metadata),
      now
    );

    return auditId;
  }

  /**
   * Query audit logs with filters
   * @param {Object} filters - { userId, eventType, resourceType, startDate, endDate, status }
   * @param {Object} pagination - { limit, offset }
   * @returns {Promise<{logs: Array, total: number}>}
   */
  static async queryLogs(filters = {}, pagination = { limit: 100, offset: 0 }) {
    const db = getDb();

    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];

    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }

    if (filters.eventType) {
      query += ' AND event_type = ?';
      params.push(filters.eventType);
    }

    if (filters.resourceType) {
      query += ' AND resource_type = ?';
      params.push(filters.resourceType);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pagination.limit, pagination.offset);

    const logs = db.prepare(query).all(...params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM audit_log WHERE 1=1';
    const countParams = params.slice(0, -2); // Remove limit/offset

    if (filters.userId) countQuery += ' AND user_id = ?';
    if (filters.eventType) countQuery += ' AND event_type = ?';
    if (filters.resourceType) countQuery += ' AND resource_type = ?';
    if (filters.status) countQuery += ' AND status = ?';
    if (filters.startDate) countQuery += ' AND created_at >= ?';
    if (filters.endDate) countQuery += ' AND created_at <= ?';

    const { total } = db.prepare(countQuery).get(...countParams);

    return {
      logs: logs.map(log => ({
        ...log,
        metadata: JSON.parse(log.metadata || '{}')
      })),
      total
    };
  }

  /**
   * Get recent events for a user (for security dashboard)
   * @param {string} userId
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  static async getUserRecentEvents(userId, limit = 20) {
    const db = getDb();

    const logs = db.prepare(`
      SELECT * FROM audit_log
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);

    return logs.map(log => ({
      ...log,
      metadata: JSON.parse(log.metadata || '{}')
    }));
  }

  /**
   * Clean up old audit logs (retention policy)
   * @param {number} retentionDays - Delete logs older than this many days
   * @returns {Promise<number>} Number of deleted records
   */
  static async cleanupOldLogs(retentionDays = 90) {
    const db = getDb();

    const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

    const result = db.prepare('DELETE FROM audit_log WHERE created_at < ?').run(cutoffDate);

    return result.changes;
  }
}

export default AuditService;
```

**Acceptance Criteria:**
- [ ] Events logged with all required fields
- [ ] Metadata stored as JSON
- [ ] Query filters work correctly (user, event type, date range)
- [ ] Pagination works correctly
- [ ] Recent events for user retrieved
- [ ] Old logs cleaned up based on retention policy
- [ ] Unit tests cover all methods

**Testing:**
```javascript
// /test/services/audit.test.js
describe('AuditService', () => {
  it('logs event with metadata', async () => {});
  it('queries logs by user', async () => {});
  it('queries logs by event type', async () => {});
  it('queries logs by date range', async () => {});
  it('returns paginated results', async () => {});
  it('gets user recent events', async () => {});
  it('cleans up old logs', async () => {});
});
```

**Files Changed:**
- `/services/audit.js` (new)
- `/test/services/audit.test.js` (new)

---

### Task 1.4: Authentication Routes
**Branch:** `feat/auth-routes`
**Estimated Effort:** 6 hours
**Priority:** P0 (Blocker)
**Dependencies:** Task 1.2, Task 1.3

**API Endpoints:**

```javascript
// /routes/auth.js

import express from 'express';
import rateLimit from 'express-rate-limit';
import AuthService from '../services/auth.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Rate limiter for auth endpoints (stricter than general API)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later'
});

/**
 * POST /api/auth/register
 * Create new user account
 *
 * Body: { email, password, name }
 * Returns: { user: { id, email, name, emailVerified } }
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'password', 'name']
      });
    }

    const result = await AuthService.register(email, password, name);

    // In production, send verification email here
    // await EmailService.sendVerificationEmail(result.email, result.verificationToken);

    res.status(201).json({
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        emailVerified: result.emailVerified
      },
      message: 'Registration successful. Please check your email to verify your account.'
    });

  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({ error: error.message });
    }

    if (error.message.includes('Password') || error.message.includes('email')) {
      return res.status(400).json({ error: error.message });
    }

    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user
 *
 * Body: { email, password }
 * Returns: { accessToken, refreshToken, user }
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['email', 'password']
      });
    }

    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    };

    const result = await AuthService.login(email, password, deviceInfo);

    res.json(result);

  } catch (error) {
    if (error.message === 'Invalid credentials' || error.message === 'Account suspended') {
      return res.status(401).json({ error: error.message });
    }

    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/logout
 * Revoke refresh token
 *
 * Body: { refreshToken }
 * Returns: { success: true }
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    await AuthService.logout(refreshToken);

    res.json({ success: true });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Get new access token
 *
 * Body: { refreshToken }
 * Returns: { accessToken }
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    const result = await AuthService.refreshAccessToken(refreshToken);

    res.json(result);

  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 *
 * Body: { email }
 * Returns: { success: true }
 */
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    await AuthService.forgotPassword(email);

    // Always return success (don't reveal if email exists)
    res.json({
      success: true,
      message: 'If that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

/**
 * POST /api/auth/reset-password
 * Complete password reset
 *
 * Body: { resetToken, newPassword }
 * Returns: { success: true }
 */
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['resetToken', 'newPassword']
      });
    }

    await AuthService.resetPassword(resetToken, newPassword);

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });

  } catch (error) {
    if (error.message.includes('token') || error.message.includes('Password')) {
      return res.status(400).json({ error: error.message });
    }

    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * GET /api/auth/verify-email/:token
 * Verify email address
 *
 * Params: { token }
 * Returns: { success: true }
 */
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    await AuthService.verifyEmail(token);

    res.json({
      success: true,
      message: 'Email verified successfully. You can now login.'
    });

  } catch (error) {
    return res.status(400).json({ error: 'Invalid or expired verification token' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 *
 * Headers: Authorization: Bearer <token>
 * Returns: { user }
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // User already attached to req.user by middleware
    res.json({
      user: {
        id: req.user.sub,
        email: req.user.email,
        name: req.user.name,
        emailVerified: req.user.emailVerified
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
```

**Acceptance Criteria:**
- [ ] All endpoints return correct status codes
- [ ] Input validation rejects missing fields
- [ ] Rate limiting enforced (5 req/15min for auth endpoints)
- [ ] Error messages are user-friendly (don't expose system details)
- [ ] Registration creates user and returns user object
- [ ] Login returns access + refresh tokens
- [ ] Logout revokes refresh token
- [ ] Refresh generates new access token
- [ ] Password reset flow works end-to-end
- [ ] Email verification marks user as verified
- [ ] /me endpoint returns current user
- [ ] Integration tests cover all endpoints
- [ ] API documentation generated (OpenAPI/Swagger)

**Testing:**
```javascript
// /test/routes/auth.test.js
describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('creates user', async () => {});
    it('rejects duplicate email', async () => {});
    it('rejects missing fields', async () => {});
    it('enforces rate limiting', async () => {});
  });

  describe('POST /api/auth/login', () => {
    it('returns tokens for valid credentials', async () => {});
    it('rejects invalid credentials', async () => {});
    it('enforces rate limiting', async () => {});
  });

  // ... more tests
});
```

**Files Changed:**
- `/routes/auth.js` (new)
- `/index.js` (add auth routes)
- `/test/routes/auth.test.js` (new)
- `/API_SUMMARY.md` (document new endpoints)

---

### Task 1.5: Enhanced Auth Middleware
**Branch:** `feat/auth-middleware-enhanced`
**Estimated Effort:** 3 hours
**Priority:** P0 (Blocker)
**Dependencies:** Task 1.2

**Middleware Updates:**

```javascript
// /middleware/auth.js (REPLACE EXISTING)

import jwt from 'jsonwebtoken';
import { getDb } from '../db/db.js';
import AuditService from '../services/audit.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production';

/**
 * Verify JWT token and attach user to request
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'No access token provided'
    });
  }

  try {
    // Verify JWT signature and expiry
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'navidocs-api'
    });

    // Check if user still exists and is active
    const db = getDb();
    const user = db.prepare('SELECT id, email, status FROM users WHERE id = ?').get(decoded.sub);

    if (!user) {
      await AuditService.logEvent('auth_failed', null, null, null, 'failure', {
        reason: 'user_not_found',
        token_sub: decoded.sub,
        ip_address: req.ip
      });

      return res.status(403).json({
        error: 'Invalid token',
        message: 'User account not found'
      });
    }

    if (user.status !== 'active') {
      await AuditService.logEvent('auth_denied', user.id, null, null, 'denied', {
        reason: 'account_not_active',
        status: user.status,
        ip_address: req.ip
      });

      return res.status(403).json({
        error: 'Account not active',
        message: 'Your account has been suspended or deleted'
      });
    }

    // Attach user to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      emailVerified: decoded.emailVerified
    };

    next();

  } catch (error) {
    // Log failed authentication attempts
    await AuditService.logEvent('auth_failed', null, null, null, 'failure', {
      reason: error.name, // TokenExpiredError, JsonWebTokenError, etc
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please refresh your access token'
      });
    }

    return res.status(403).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
}

/**
 * Optional authentication - attaches user if token present
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'navidocs-api'
      });

      const db = getDb();
      const user = db.prepare('SELECT id, email, status FROM users WHERE id = ?').get(decoded.sub);

      if (user && user.status === 'active') {
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          emailVerified: decoded.emailVerified
        };
      }
    } catch (error) {
      // Silently fail for optional auth
      console.log('Optional auth failed:', error.message);
    }
  }

  next();
}

export default {
  authenticateToken,
  optionalAuth
};
```

**Acceptance Criteria:**
- [ ] Valid JWT grants access
- [ ] Expired JWT returns 401 with clear message
- [ ] Invalid JWT returns 403
- [ ] Missing token returns 401
- [ ] Suspended user denied access
- [ ] Deleted user denied access
- [ ] Non-existent user denied access
- [ ] User object attached to req.user
- [ ] Failed attempts logged to audit
- [ ] optionalAuth doesn't fail on invalid token
- [ ] Unit tests cover all error cases

**Testing:**
```javascript
// /test/middleware/auth.test.js
describe('Auth Middleware', () => {
  describe('authenticateToken', () => {
    it('allows valid token', async () => {});
    it('rejects expired token', async () => {});
    it('rejects invalid signature', async () => {});
    it('rejects missing token', async () => {});
    it('rejects deleted user', async () => {});
    it('rejects suspended user', async () => {});
    it('logs failed attempts', async () => {});
  });

  describe('optionalAuth', () => {
    it('attaches user if valid token', async () => {});
    it('continues without user if invalid token', async () => {});
  });
});
```

**Files Changed:**
- `/middleware/auth.js` (replace)
- `/test/middleware/auth.test.js` (new)

---

## Phase 2: Authorization

### Task 2.1: Authorization Service
**Branch:** `feat/authorization-service`
**Estimated Effort:** 8 hours
**Priority:** P1
**Dependencies:** Task 1.1

**Module Interface:**

```javascript
// /services/authorization.js

import { getDb } from '../db/db.js';
import LRU from 'lru-cache';

// Permission hierarchy (higher level includes all lower permissions)
const PERMISSION_HIERARCHY = {
  viewer: ['view'],
  editor: ['view', 'edit', 'create'],
  manager: ['view', 'edit', 'create', 'delete', 'share'],
  admin: ['view', 'edit', 'create', 'delete', 'share', 'manage_users', 'manage_permissions']
};

// Organization role capabilities
const ORG_ROLE_PERMISSIONS = {
  viewer: ['view'], // Read-only access to all org entities
  member: ['view', 'edit'], // Edit assigned entities only
  manager: ['view', 'edit', 'create', 'delete'], // Manage all entities
  admin: ['view', 'edit', 'create', 'delete', 'manage_users', 'manage_permissions'] // Full control
};

// Permission cache (LRU)
const permissionCache = new LRU({
  max: 10000,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export class AuthorizationService {
  /**
   * Check if user has permission on an entity
   * Resolution order:
   * 1. Organization admin/manager roles (full access)
   * 2. Entity-level permissions (granular)
   * 3. Document-level permissions (legacy support)
   *
   * @param {string} userId
   * @param {string} entityId
   * @param {string} requiredPermission - view, edit, create, delete, etc
   * @returns {Promise<boolean>}
   */
  static async checkEntityPermission(userId, entityId, requiredPermission) {
    const cacheKey = `entity:${userId}:${entityId}:${requiredPermission}`;
    const cached = permissionCache.get(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const result = await this._checkEntityPermissionUncached(userId, entityId, requiredPermission);
    permissionCache.set(cacheKey, result);

    return result;
  }

  static async _checkEntityPermissionUncached(userId, entityId, requiredPermission) {
    const db = getDb();

    // Step 1: Check organization-level roles
    const orgMembership = db.prepare(`
      SELECT uo.role
      FROM user_organizations uo
      INNER JOIN entities e ON e.organization_id = uo.organization_id
      WHERE uo.user_id = ? AND e.id = ?
    `).get(userId, entityId);

    if (orgMembership) {
      // Org admin has full access
      if (orgMembership.role === 'admin') {
        return true;
      }

      // Org manager has all permissions except user management
      if (orgMembership.role === 'manager') {
        const allowedPerms = ORG_ROLE_PERMISSIONS.manager;
        if (allowedPerms.includes(requiredPermission)) {
          return true;
        }
      }

      // Org viewer has read-only access
      if (orgMembership.role === 'viewer') {
        return requiredPermission === 'view';
      }

      // Org member needs entity-level permission (check below)
    } else {
      // Not a member of the organization - deny
      return false;
    }

    // Step 2: Check entity-level permissions
    const entityPerm = db.prepare(`
      SELECT permission_level
      FROM entity_permissions
      WHERE user_id = ? AND entity_id = ?
        AND (expires_at IS NULL OR expires_at > ?)
    `).get(userId, entityId, Date.now());

    if (entityPerm) {
      const allowedPerms = PERMISSION_HIERARCHY[entityPerm.permission_level];
      return allowedPerms.includes(requiredPermission);
    }

    // Step 3: Check legacy permissions table (backward compatibility)
    const resourcePerm = db.prepare(`
      SELECT permission
      FROM permissions
      WHERE user_id = ? AND resource_type = 'entity' AND resource_id = ?
        AND (expires_at IS NULL OR expires_at > ?)
    `).get(userId, entityId, Date.now());

    if (resourcePerm) {
      if (resourcePerm.permission === 'admin') return true;
      return resourcePerm.permission === requiredPermission;
    }

    return false;
  }

  /**
   * Check organization permission
   * @param {string} userId
   * @param {string} organizationId
   * @param {string} requiredPermission
   * @returns {Promise<boolean>}
   */
  static async checkOrganizationPermission(userId, organizationId, requiredPermission) {
    const cacheKey = `org:${userId}:${organizationId}:${requiredPermission}`;
    const cached = permissionCache.get(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const db = getDb();

    const membership = db.prepare(`
      SELECT role FROM user_organizations
      WHERE user_id = ? AND organization_id = ?
    `).get(userId, organizationId);

    if (!membership) {
      permissionCache.set(cacheKey, false);
      return false;
    }

    const allowedPerms = ORG_ROLE_PERMISSIONS[membership.role];
    const result = allowedPerms.includes(requiredPermission);

    permissionCache.set(cacheKey, result);
    return result;
  }

  /**
   * Check document permission
   * @param {string} userId
   * @param {string} documentId
   * @param {string} requiredPermission
   * @returns {Promise<boolean>}
   */
  static async checkDocumentPermission(userId, documentId, requiredPermission) {
    const db = getDb();

    // Get document's entity
    const document = db.prepare(`
      SELECT entity_id, organization_id, uploaded_by
      FROM documents
      WHERE id = ?
    `).get(documentId);

    if (!document) {
      return false;
    }

    // Owner always has full access
    if (document.uploaded_by === userId) {
      return true;
    }

    // Check organization membership
    if (document.organization_id) {
      const hasOrgPerm = await this.checkOrganizationPermission(
        userId,
        document.organization_id,
        requiredPermission
      );
      if (hasOrgPerm) return true;
    }

    // Check entity permission
    if (document.entity_id) {
      const hasEntityPerm = await this.checkEntityPermission(
        userId,
        document.entity_id,
        requiredPermission
      );
      if (hasEntityPerm) return true;
    }

    // Check document shares
    const share = db.prepare(`
      SELECT permission FROM document_shares
      WHERE document_id = ? AND shared_with = ?
    `).get(documentId, userId);

    if (share) {
      if (share.permission === 'write') return true;
      if (share.permission === 'read' && requiredPermission === 'view') return true;
    }

    return false;
  }

  /**
   * Grant entity permission to user
   * @param {string} granterId - User granting permission (must have manage_permissions)
   * @param {string} userId - User receiving permission
   * @param {string} entityId
   * @param {string} permissionLevel - viewer, editor, manager, admin
   * @param {number|null} expiresAt - Unix timestamp or null for permanent
   * @returns {Promise<string>} Permission ID
   * @throws {Error} If granter lacks permission
   */
  static async grantEntityPermission(granterId, userId, entityId, permissionLevel, expiresAt = null) {
    // Validate permission level
    if (!PERMISSION_HIERARCHY[permissionLevel]) {
      throw new Error(`Invalid permission level: ${permissionLevel}`);
    }

    // Check if granter has permission to grant
    const canGrant = await this.checkEntityPermission(granterId, entityId, 'manage_permissions');
    if (!canGrant) {
      throw new Error('You do not have permission to grant access to this entity');
    }

    // Cannot grant higher permission than you have
    const granterPerm = await this._getEntityPermissionLevel(granterId, entityId);
    if (!this._canGrantPermission(granterPerm, permissionLevel)) {
      throw new Error('Cannot grant higher permission level than your own');
    }

    const db = getDb();
    const { v4: uuidv4 } = await import('uuid');

    const permId = uuidv4();
    const now = Date.now();

    // Upsert entity permission
    db.prepare(`
      INSERT INTO entity_permissions (id, user_id, entity_id, permission_level, granted_by, granted_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, entity_id) DO UPDATE SET
        permission_level = excluded.permission_level,
        granted_by = excluded.granted_by,
        granted_at = excluded.granted_at,
        expires_at = excluded.expires_at
    `).run(permId, userId, entityId, permissionLevel, granterId, now, expiresAt);

    // Invalidate cache
    this._invalidateEntityCache(userId, entityId);

    return permId;
  }

  /**
   * Revoke entity permission
   * @param {string} granterId - User revoking permission
   * @param {string} userId - User whose permission is being revoked
   * @param {string} entityId
   * @returns {Promise<boolean>} True if revoked, false if not found
   */
  static async revokeEntityPermission(granterId, userId, entityId) {
    const canRevoke = await this.checkEntityPermission(granterId, entityId, 'manage_permissions');
    if (!canRevoke) {
      throw new Error('You do not have permission to revoke access to this entity');
    }

    const db = getDb();

    const result = db.prepare(`
      DELETE FROM entity_permissions
      WHERE user_id = ? AND entity_id = ?
    `).run(userId, entityId);

    if (result.changes > 0) {
      this._invalidateEntityCache(userId, entityId);
      return true;
    }

    return false;
  }

  /**
   * Get all users with access to an entity
   * @param {string} entityId
   * @returns {Promise<Array>} List of users with permission levels
   */
  static async getEntityUsers(entityId) {
    const db = getDb();

    // Get entity's organization
    const entity = db.prepare('SELECT organization_id FROM entities WHERE id = ?').get(entityId);
    if (!entity) {
      throw new Error('Entity not found');
    }

    // Get org members
    const orgMembers = db.prepare(`
      SELECT u.id, u.email, u.name, uo.role as org_role
      FROM user_organizations uo
      INNER JOIN users u ON u.id = uo.user_id
      WHERE uo.organization_id = ?
    `).all(entity.organization_id);

    // Get entity-specific permissions
    const entityPerms = db.prepare(`
      SELECT ep.user_id, ep.permission_level, ep.granted_at, ep.expires_at
      FROM entity_permissions ep
      WHERE ep.entity_id = ?
    `).all(entityId);

    const entityPermsMap = {};
    entityPerms.forEach(perm => {
      entityPermsMap[perm.user_id] = perm;
    });

    return orgMembers.map(member => ({
      userId: member.id,
      email: member.email,
      name: member.name,
      organizationRole: member.org_role,
      entityPermission: entityPermsMap[member.id]?.permission_level || null,
      grantedAt: entityPermsMap[member.id]?.granted_at || null,
      expiresAt: entityPermsMap[member.id]?.expires_at || null
    }));
  }

  /**
   * Get all entities a user has access to
   * @param {string} userId
   * @returns {Promise<Array>} List of entities with permission levels
   */
  static async getUserEntities(userId) {
    const db = getDb();

    // Get all organizations user is member of
    const orgs = db.prepare(`
      SELECT organization_id, role
      FROM user_organizations
      WHERE user_id = ?
    `).all(userId);

    if (orgs.length === 0) {
      return [];
    }

    const orgIds = orgs.map(o => o.organization_id);
    const placeholders = orgIds.map(() => '?').join(',');

    // Get all entities in those organizations
    const entities = db.prepare(`
      SELECT e.id, e.name, e.entity_type, e.organization_id
      FROM entities e
      WHERE e.organization_id IN (${placeholders})
    `).all(...orgIds);

    // Get entity-specific permissions
    const entityPerms = db.prepare(`
      SELECT entity_id, permission_level
      FROM entity_permissions
      WHERE user_id = ?
    `).all(userId);

    const entityPermsMap = {};
    entityPerms.forEach(perm => {
      entityPermsMap[perm.entity_id] = perm.permission_level;
    });

    const orgRolesMap = {};
    orgs.forEach(org => {
      orgRolesMap[org.organization_id] = org.role;
    });

    return entities.map(entity => {
      const orgRole = orgRolesMap[entity.organization_id];
      const entityPerm = entityPermsMap[entity.id];

      // Determine effective permission
      let effectivePermission = null;
      if (orgRole === 'admin') {
        effectivePermission = 'admin';
      } else if (orgRole === 'manager') {
        effectivePermission = 'manager';
      } else if (entityPerm) {
        effectivePermission = entityPerm;
      } else if (orgRole === 'viewer') {
        effectivePermission = 'viewer';
      }

      return {
        entityId: entity.id,
        name: entity.name,
        entityType: entity.entity_type,
        organizationId: entity.organization_id,
        organizationRole: orgRole,
        entityPermission: entityPerm || null,
        effectivePermission
      };
    }).filter(e => e.effectivePermission !== null); // Only return entities user can access
  }

  // Private helper methods

  static async _getEntityPermissionLevel(userId, entityId) {
    const db = getDb();

    const orgMembership = db.prepare(`
      SELECT uo.role
      FROM user_organizations uo
      INNER JOIN entities e ON e.organization_id = uo.organization_id
      WHERE uo.user_id = ? AND e.id = ?
    `).get(userId, entityId);

    if (orgMembership && (orgMembership.role === 'admin' || orgMembership.role === 'manager')) {
      return orgMembership.role;
    }

    const entityPerm = db.prepare(`
      SELECT permission_level FROM entity_permissions
      WHERE user_id = ? AND entity_id = ?
    `).get(userId, entityId);

    return entityPerm?.permission_level || null;
  }

  static _canGrantPermission(granterLevel, targetLevel) {
    const levels = ['viewer', 'editor', 'manager', 'admin'];
    const granterIndex = levels.indexOf(granterLevel);
    const targetIndex = levels.indexOf(targetLevel);

    return granterIndex >= targetIndex;
  }

  static _invalidateEntityCache(userId, entityId) {
    // Invalidate all permission combinations for this user+entity
    const permissions = ['view', 'edit', 'create', 'delete', 'share', 'manage_users', 'manage_permissions'];
    permissions.forEach(perm => {
      permissionCache.delete(`entity:${userId}:${entityId}:${perm}`);
    });
  }

  /**
   * Clear permission cache (useful for testing or after bulk updates)
   */
  static clearCache() {
    permissionCache.clear();
  }
}

export default AuthorizationService;
```

**Acceptance Criteria:**
- [ ] Org admin has full access to all org entities
- [ ] Org manager can view/edit/create/delete all org entities
- [ ] Org member sees only entities with explicit permissions
- [ ] Org viewer has read-only access
- [ ] Entity-level permissions override org permissions (more granular)
- [ ] Permission hierarchy works (admin > manager > editor > viewer)
- [ ] Grant permission validates granter's authority
- [ ] Cannot grant higher permission than own level
- [ ] Revoke permission removes access immediately
- [ ] Get entity users returns all users with access
- [ ] Get user entities returns all accessible entities
- [ ] Permission cache improves performance (>10x faster on cache hit)
- [ ] Cache invalidated on permission changes
- [ ] Unit tests cover all methods (95%+ coverage)

**Testing:**
```javascript
// /test/services/authorization.test.js
describe('AuthorizationService', () => {
  describe('checkEntityPermission', () => {
    it('grants access to org admin', async () => {});
    it('grants access to org manager', async () => {});
    it('grants access to entity admin', async () => {});
    it('denies access to non-member', async () => {});
    it('respects permission hierarchy', async () => {});
    it('checks expiry date', async () => {});
  });

  describe('grantEntityPermission', () => {
    it('grants permission', async () => {});
    it('rejects if granter lacks permission', async () => {});
    it('rejects granting higher permission', async () => {});
    it('invalidates cache', async () => {});
  });

  // More tests...
});
```

**Files Changed:**
- `/services/authorization.js` (new)
- `/test/services/authorization.test.js` (new)

---

*[Continued in next section due to length...]*

---

## Summary

This implementation plan breaks down the multi-tenancy auth system into 16 granular PRs across 5 phases:

**Phase 1 (Week 1):** Foundation - Database schema, core auth services, routes, middleware
**Phase 2 (Week 2):** Authorization - Permission service, middleware, route protection
**Phase 3 (Week 3):** User & Org Management - CRUD operations, member management
**Phase 4 (Week 4):** Security - Rate limiting, brute force protection, testing
**Phase 5 (Week 5):** Documentation - API docs, migration scripts, deployment

Each task includes:
- Clear module boundaries and interfaces
- Comprehensive acceptance criteria
- Testing requirements
- Estimated effort
- File change list

This ensures a systematic, testable, and reviewable implementation process.
