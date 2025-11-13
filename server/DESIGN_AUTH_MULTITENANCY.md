# NaviDocs Multi-Tenancy Authentication & Authorization System
## Technical Design Document

**Version:** 1.0
**Date:** 2025-10-21
**Author:** Tech Lead
**Status:** Design Review

---

## Executive Summary

This document presents a comprehensive design for implementing multi-tenancy authentication and authorization in NaviDocs, a cross-vertical document management system. The solution addresses the core requirement: agencies managing multiple entities (boats, aircraft, properties) with granular user access control.

**Key Requirements:**
- Full authentication system (registration, login, password reset)
- Multi-tenancy: Agencies manage multiple entities across verticals
- Granular permissions: Users access specific entities within agencies
- Role-based access control (RBAC) with permission levels
- Cross-vertical compatibility (boating, aviation, marine, property management)

---

## Current State Analysis

### Existing Infrastructure
- **Database:** SQLite with schema v1.0 (designed for PostgreSQL migration)
- **Tables:** users, organizations, user_organizations, entities, documents, permissions
- **Auth Middleware:** Basic JWT placeholder (`middleware/auth.js`)
- **Dependencies:** bcrypt, jsonwebtoken already installed
- **Authorization:** Placeholder checks in documents route, not enforced

### Critical Gaps
1. No user registration/login endpoints
2. No password reset workflow
3. No session management or token refresh
4. No granular entity-level permissions enforcement
5. No audit logging for security events
6. Auth middleware not applied to routes

---

## Architectural Approaches

### Approach 1: JWT + RBAC with Entity-Level Permissions (RECOMMENDED)

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│                    Client Application                    │
└─────────────────────┬───────────────────────────────────┘
                      │ JWT in Authorization Header
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Express Middleware Chain                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Rate Limiter │→│ JWT Validator│→│ Permission   │  │
│  └──────────────┘  └──────────────┘  │ Checker      │  │
│                                       └──────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  Business Logic Layer                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Permission Resolution Engine                     │  │
│  │  1. Check user_organizations (org-level)          │  │
│  │  2. Check entity_permissions (entity-level)       │  │
│  │  3. Check permissions table (resource-level)      │  │
│  │  4. Apply hierarchical inheritance                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   Data Access Layer                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐   │
│  │ Users      │  │ Orgs       │  │ Entities        │   │
│  │ Sessions   │  │ User-Orgs  │  │ Entity-Perms    │   │
│  └────────────┘  └────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Database Schema Changes:**

```sql
-- NEW TABLE: Entity-level permissions (fine-grained access)
CREATE TABLE entity_permissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  permission_level TEXT NOT NULL,  -- viewer, editor, manager, admin
  granted_by TEXT NOT NULL,
  granted_at INTEGER NOT NULL,
  expires_at INTEGER,              -- NULL = never expires
  UNIQUE(user_id, entity_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_entity_perms_user ON entity_permissions(user_id);
CREATE INDEX idx_entity_perms_entity ON entity_permissions(entity_id);

-- NEW TABLE: Refresh tokens for session management
CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,  -- bcrypt hash of refresh token
  device_info TEXT,                  -- User agent, IP (JSON)
  expires_at INTEGER NOT NULL,
  revoked BOOLEAN DEFAULT 0,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- NEW TABLE: Password reset tokens
CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,  -- bcrypt hash
  expires_at INTEGER NOT NULL,
  used BOOLEAN DEFAULT 0,
  used_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_expires ON password_reset_tokens(expires_at);

-- NEW TABLE: Audit log for security events
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,                     -- NULL for anonymous events
  event_type TEXT NOT NULL,         -- login, logout, password_reset, permission_grant, etc
  resource_type TEXT,               -- entity, document, organization
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL,             -- success, failure, denied
  metadata TEXT,                    -- JSON with additional context
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_event ON audit_log(event_type);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- MODIFY: Add email verification to users table
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verification_token TEXT;
ALTER TABLE users ADD COLUMN email_verification_expires INTEGER;

-- MODIFY: Add account status to users
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';  -- active, suspended, deleted
ALTER TABLE users ADD COLUMN suspended_at INTEGER;
ALTER TABLE users ADD COLUMN suspended_reason TEXT;
```

**Permission Levels & Hierarchy:**

```javascript
// Permission inheritance chain (higher level includes all lower permissions)
const PERMISSION_HIERARCHY = {
  viewer: ['view'],
  editor: ['view', 'edit', 'create'],
  manager: ['view', 'edit', 'create', 'delete', 'share'],
  admin: ['view', 'edit', 'create', 'delete', 'share', 'manage_users', 'manage_permissions']
};

// Organization-level roles (user_organizations.role)
const ORG_ROLES = {
  viewer: ['view_all_entities'],     // Read-only access to all org entities
  member: ['view_assigned_entities', 'edit_assigned_entities'],
  manager: ['view_all_entities', 'edit_all_entities', 'create_entities', 'manage_entity_permissions'],
  admin: ['full_access', 'manage_users', 'manage_org']
};
```

**Authentication Flow:**

1. **Registration:**
   ```
   POST /api/auth/register
   → Validate email uniqueness
   → Hash password (bcrypt, cost=12)
   → Create user record (status=active, email_verified=false)
   → Generate email verification token
   → Send verification email (future: email service)
   → Return user object (no token until email verified)
   ```

2. **Login:**
   ```
   POST /api/auth/login
   → Validate email/password
   → Check account status (active/suspended)
   → Generate JWT access token (15min expiry)
   → Generate refresh token (7 days expiry)
   → Store refresh token hash in DB
   → Log audit event
   → Return { accessToken, refreshToken, user }
   ```

3. **Token Refresh:**
   ```
   POST /api/auth/refresh
   → Validate refresh token
   → Check if revoked or expired
   → Generate new access token
   → Optionally rotate refresh token
   → Return { accessToken }
   ```

4. **Password Reset:**
   ```
   POST /api/auth/forgot-password
   → Validate email exists
   → Generate reset token (UUID)
   → Hash and store token
   → Send reset email
   → Return success (don't reveal if email exists)

   POST /api/auth/reset-password
   → Validate reset token
   → Check expiry and usage
   → Hash new password
   → Update user record
   → Invalidate reset token
   → Log audit event
   ```

**Authorization Resolution Logic:**

```javascript
async function checkEntityPermission(userId, entityId, requiredPermission) {
  // Step 1: Get user's organization memberships
  const orgMemberships = await db.prepare(`
    SELECT uo.organization_id, uo.role, e.id as entity_id
    FROM user_organizations uo
    INNER JOIN entities e ON e.organization_id = uo.organization_id
    WHERE uo.user_id = ? AND e.id = ?
  `).all(userId, entityId);

  // Step 2: Check org-level admin/manager roles
  for (const membership of orgMemberships) {
    if (membership.role === 'admin') return true;
    if (membership.role === 'manager' && ['view', 'edit', 'create'].includes(requiredPermission)) {
      return true;
    }
  }

  // Step 3: Check entity-level permissions
  const entityPerm = await db.prepare(`
    SELECT permission_level
    FROM entity_permissions
    WHERE user_id = ? AND entity_id = ?
      AND (expires_at IS NULL OR expires_at > ?)
  `).get(userId, entityId, Date.now());

  if (entityPerm) {
    const allowedPerms = PERMISSION_HIERARCHY[entityPerm.permission_level];
    return allowedPerms.includes(requiredPermission);
  }

  // Step 4: Check document-level permissions (for backward compatibility)
  const resourcePerm = await db.prepare(`
    SELECT permission
    FROM permissions
    WHERE user_id = ? AND resource_type = 'entity' AND resource_id = ?
      AND (expires_at IS NULL OR expires_at > ?)
  `).get(userId, entityId, Date.now());

  if (resourcePerm) {
    return resourcePerm.permission === requiredPermission ||
           resourcePerm.permission === 'admin';
  }

  return false;
}
```

**API Endpoints:**

```
Authentication:
  POST   /api/auth/register              - Create new user account
  POST   /api/auth/login                 - Login with email/password
  POST   /api/auth/logout                - Revoke refresh token
  POST   /api/auth/refresh               - Get new access token
  POST   /api/auth/forgot-password       - Request password reset
  POST   /api/auth/reset-password        - Complete password reset
  GET    /api/auth/verify-email/:token   - Verify email address
  GET    /api/auth/me                    - Get current user profile

User Management:
  GET    /api/users/:id                  - Get user profile (admin only)
  PATCH  /api/users/:id                  - Update user profile
  DELETE /api/users/:id                  - Delete user account

Organization Management:
  GET    /api/organizations              - List user's organizations
  POST   /api/organizations              - Create organization
  GET    /api/organizations/:id          - Get organization details
  PATCH  /api/organizations/:id          - Update organization
  DELETE /api/organizations/:id          - Delete organization

  GET    /api/organizations/:id/members  - List organization members
  POST   /api/organizations/:id/members  - Add member to organization
  PATCH  /api/organizations/:id/members/:userId - Update member role
  DELETE /api/organizations/:id/members/:userId - Remove member

Entity Permissions:
  GET    /api/entities/:id/permissions   - List entity permissions
  POST   /api/entities/:id/permissions   - Grant user access to entity
  PATCH  /api/entities/:id/permissions/:userId - Update permission level
  DELETE /api/entities/:id/permissions/:userId - Revoke access

Audit:
  GET    /api/audit                      - Query audit logs (admin only)
```

**Middleware Structure:**

```javascript
// middleware/auth.js - Enhanced JWT validation
export async function authenticateToken(req, res, next) {
  // Extract token from Authorization header
  // Verify JWT signature and expiry
  // Attach user object to req.user
  // Log failed attempts
}

// middleware/permissions.js - NEW
export function requirePermission(resourceType, permission) {
  return async (req, res, next) => {
    // Extract resource ID from params
    // Check user permission using resolution logic
    // Log permission denied events
    // Return 403 if access denied
  };
}

// middleware/entityAccess.js - NEW
export function requireEntityAccess(permissionLevel) {
  return async (req, res, next) => {
    const entityId = req.params.entityId || req.body.entityId;
    const hasAccess = await checkEntityPermission(req.user.id, entityId, permissionLevel);
    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });
    next();
  };
}

// Usage in routes:
router.get('/api/entities/:entityId/documents',
  authenticateToken,
  requireEntityAccess('view'),
  async (req, res) => { /* ... */ }
);
```

**Pros:**
- Leverages existing schema (users, organizations, permissions tables)
- Minimal database changes (3 new tables + ALTER)
- Stateless JWT = horizontal scalability
- Flexible permission model (org + entity + resource levels)
- Cross-vertical compatible (entity-agnostic)
- Clear separation of concerns (auth vs authz)
- Industry standard (JWT + RBAC)

**Cons:**
- Cannot revoke JWTs before expiry (mitigated by short-lived tokens + refresh tokens)
- Complex permission resolution logic (3-level check)
- Need to manage refresh token rotation
- Audit log can grow large (needs archival strategy)

**Migration Strategy:**
1. Add new tables (entity_permissions, refresh_tokens, password_reset_tokens, audit_log)
2. Migrate existing data: set all existing user_organizations members to 'admin' role
3. Deploy auth routes and middleware
4. Update frontend to use new auth flow
5. Gradually apply authentication to protected routes
6. Add entity permission management UI

---

### Approach 2: Session-Based Auth + ABAC (Attribute-Based)

**Architecture:**
```
Client → Express Session Middleware → ABAC Policy Engine → Resource Access
         (Redis Session Store)       (Evaluate rules dynamically)
```

**Key Components:**
- **Sessions:** Express-session + Redis store
- **ABAC Policies:** JSON-based rules for dynamic permission evaluation
- **Attributes:** User attributes (role, department), Resource attributes (entity type, sensitivity), Context (time, IP)

**Database Schema:**

```sql
-- Session store handled by Redis (connect-redis)
-- No session table needed

-- ABAC Policies
CREATE TABLE access_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL,  -- entity, document, organization
  policy_rules TEXT NOT NULL,    -- JSON: { conditions: [...], effect: 'allow|deny' }
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- User attributes (for ABAC evaluation)
CREATE TABLE user_attributes (
  user_id TEXT NOT NULL,
  attribute_key TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  PRIMARY KEY (user_id, attribute_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Resource attributes (for ABAC evaluation)
CREATE TABLE resource_attributes (
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  attribute_key TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  PRIMARY KEY (resource_type, resource_id, attribute_key)
);
```

**Example ABAC Policy:**

```json
{
  "name": "Agency Manager Entity Access",
  "resource_type": "entity",
  "policy_rules": {
    "effect": "allow",
    "conditions": [
      {
        "attribute": "user.role",
        "operator": "equals",
        "value": "manager"
      },
      {
        "attribute": "user.organization_id",
        "operator": "equals",
        "value": "resource.organization_id"
      },
      {
        "attribute": "context.time",
        "operator": "between",
        "value": ["09:00", "17:00"]
      }
    ]
  }
}
```

**Pros:**
- Extremely flexible permission model
- Can revoke sessions instantly (server-side control)
- Rich policy language (time-based, location-based, etc.)
- Easy to add new permission dimensions

**Cons:**
- Requires Redis for production (session store)
- More complex to implement and maintain
- Policy evaluation overhead on every request
- Harder to debug permission issues
- Overkill for current requirements
- Not stateless (harder to scale horizontally)

**Verdict:** Not recommended. ABAC is powerful but adds unnecessary complexity for NaviDocs' requirements. RBAC with entity-level granularity is sufficient.

---

### Approach 3: Hybrid - OAuth2 + External Identity Provider

**Architecture:**
```
Client → OAuth2 Flow → External IDP (Auth0/Cognito) → Verify Token → NaviDocs API
                        ↓
                      JWT with scopes
```

**Key Components:**
- **External IDP:** Auth0, AWS Cognito, or Okta handles authentication
- **NaviDocs:** Only handles authorization (permissions)
- **OAuth2 Scopes:** Map to NaviDocs permission levels

**Pros:**
- Offload authentication complexity (MFA, password policies, social login)
- Enterprise SSO support (SAML, OIDC)
- Compliance features (audit logs, breach detection)
- No need to manage password resets or email verification

**Cons:**
- Vendor lock-in and cost ($$$)
- External dependency (IDP outage = system down)
- Requires internet connectivity
- Overkill for MVP/single-tenant deployments
- Still need to build authorization layer

**Verdict:** Not recommended for initial implementation. Consider for future enterprise tier.

---

## Recommended Solution: Approach 1 (JWT + RBAC)

**Justification:**
1. **Fits Current Architecture:** Builds on existing schema with minimal changes
2. **Scalable:** Stateless JWT enables horizontal scaling
3. **Cross-Vertical:** Entity-agnostic permission model works for boats, aircraft, properties
4. **Granular Control:** 3-tier hierarchy (org → entity → resource) meets all requirements
5. **Industry Standard:** JWT + RBAC is well-understood and battle-tested
6. **Migration Path:** Clear upgrade path to OAuth2/ABAC if needed

---

## Module Boundaries & Interfaces

### Module 1: Authentication Service
**Responsibility:** User identity verification, token management

**Interface:**
```javascript
// services/auth.js
class AuthService {
  async register(email, password, name);
  async login(email, password, deviceInfo);
  async logout(refreshToken);
  async refreshAccessToken(refreshToken);
  async forgotPassword(email);
  async resetPassword(token, newPassword);
  async verifyEmail(token);
  async changePassword(userId, oldPassword, newPassword);
}
```

**Dependencies:** Database, bcrypt, jsonwebtoken, uuid

---

### Module 2: Authorization Service
**Responsibility:** Permission resolution and enforcement

**Interface:**
```javascript
// services/authorization.js
class AuthorizationService {
  async checkEntityPermission(userId, entityId, requiredPermission);
  async checkOrganizationPermission(userId, organizationId, requiredPermission);
  async checkDocumentPermission(userId, documentId, requiredPermission);
  async grantEntityPermission(granterId, userId, entityId, permissionLevel);
  async revokeEntityPermission(granterId, userId, entityId);
  async getUserEntityPermissions(userId);
  async getEntityUsers(entityId);
}
```

**Dependencies:** Database

---

### Module 3: Audit Service
**Responsibility:** Security event logging

**Interface:**
```javascript
// services/audit.js
class AuditService {
  async logEvent(eventType, userId, resourceType, resourceId, status, metadata);
  async queryLogs(filters, pagination);
  async exportLogs(startDate, endDate, format);
}
```

**Dependencies:** Database

---

### Module 4: User Management Service
**Responsibility:** User profile and account operations

**Interface:**
```javascript
// services/users.js
class UserService {
  async getUser(userId);
  async updateUser(userId, updates);
  async deleteUser(userId);
  async suspendUser(userId, reason);
  async activateUser(userId);
  async getUserOrganizations(userId);
  async getUserEntities(userId);
}
```

**Dependencies:** Database, AuthorizationService

---

### Module 5: Organization Service
**Responsibility:** Multi-tenancy and organization management

**Interface:**
```javascript
// services/organizations.js
class OrganizationService {
  async createOrganization(name, type, creatorId);
  async getOrganization(organizationId);
  async updateOrganization(organizationId, updates);
  async deleteOrganization(organizationId);
  async addMember(organizationId, userId, role, addedBy);
  async removeMember(organizationId, userId);
  async updateMemberRole(organizationId, userId, newRole);
  async getMembers(organizationId);
}
```

**Dependencies:** Database, AuthorizationService, AuditService

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1) - 5 PRs

**PR1: Database Schema Migration**
- Add new tables: entity_permissions, refresh_tokens, password_reset_tokens, audit_log
- Add indexes
- Migration script with rollback support
- **Acceptance Criteria:**
  - Migration runs without errors
  - All foreign keys enforced
  - Indexes improve query performance (EXPLAIN QUERY PLAN)
  - Rollback script tested

**PR2: Authentication Service**
- Implement AuthService class (registration, login, logout, refresh)
- Password hashing with bcrypt (cost=12)
- JWT generation and validation
- Refresh token rotation
- Unit tests (>90% coverage)
- **Acceptance Criteria:**
  - User can register with email/password
  - User can login and receive JWT + refresh token
  - Access token expires in 15 minutes
  - Refresh token works for 7 days
  - Invalid credentials rejected
  - All edge cases tested

**PR3: Authentication Routes**
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- GET /api/auth/me
- Integration tests
- **Acceptance Criteria:**
  - All endpoints return correct status codes
  - Error messages are user-friendly
  - Rate limiting applied (5 req/min for auth endpoints)
  - Input validation (email format, password strength)
  - Integration tests pass

**PR4: Enhanced Auth Middleware**
- Update authenticateToken to verify JWT and load user
- Add token expiry validation
- Add blacklist check (optional)
- Error handling improvements
- **Acceptance Criteria:**
  - Valid JWT grants access
  - Expired JWT returns 401
  - Missing token returns 401
  - Invalid signature returns 403
  - User object attached to req.user

**PR5: Audit Logging**
- Implement AuditService
- Log authentication events (login, logout, failed attempts)
- POST /api/audit endpoint (admin only)
- Audit log retention policy (90 days)
- **Acceptance Criteria:**
  - All auth events logged
  - Audit logs queryable by date, user, event type
  - Admin can export logs
  - PII handling compliance

---

### Phase 2: Authorization (Week 2) - 4 PRs

**PR6: Authorization Service**
- Implement AuthorizationService
- Permission hierarchy logic
- Entity permission checks
- Organization permission checks
- Unit tests
- **Acceptance Criteria:**
  - Org admin has full access to all entities
  - Org manager can view/edit all entities
  - Org member sees only assigned entities
  - Entity-level permissions override org permissions
  - Permission expiry enforced

**PR7: Permission Middleware**
- requireEntityAccess middleware
- requireOrganizationAccess middleware
- requirePermission generic middleware
- **Acceptance Criteria:**
  - Middleware blocks unauthorized access (403)
  - Middleware allows authorized access
  - Works with entity, organization, document resources
  - Logs permission denied events

**PR8: Apply Auth to Existing Routes**
- Add authenticateToken to all protected routes
- Add entity permission checks to /api/documents
- Add entity permission checks to /api/entities
- Update route tests
- **Acceptance Criteria:**
  - Unauthenticated requests return 401
  - Unauthorized requests return 403
  - Authorized requests work as before
  - All existing tests updated and passing

**PR9: Entity Permission Management**
- POST /api/entities/:id/permissions (grant access)
- PATCH /api/entities/:id/permissions/:userId (update level)
- DELETE /api/entities/:id/permissions/:userId (revoke)
- GET /api/entities/:id/permissions (list)
- **Acceptance Criteria:**
  - Only org admin/manager can grant permissions
  - Cannot grant higher permission than own level
  - Revoke removes access immediately
  - List shows all users with access

---

### Phase 3: User & Organization Management (Week 3) - 3 PRs

**PR10: User Management**
- Implement UserService
- GET /api/users/:id
- PATCH /api/users/:id
- DELETE /api/users/:id (soft delete)
- **Acceptance Criteria:**
  - Users can view/update own profile
  - Admins can view/update any user
  - Delete user cascades to permissions
  - Email change triggers re-verification

**PR11: Organization Management**
- Implement OrganizationService
- CRUD endpoints for organizations
- Member management endpoints
- **Acceptance Criteria:**
  - Users can create organizations
  - Org admin can add/remove members
  - Org admin can change member roles
  - Deleting org cascades to entities/documents

**PR12: Email Verification & Password Reset**
- Email verification flow
- Password reset flow
- Token generation and validation
- Email templates (console.log for now, future: SendGrid)
- **Acceptance Criteria:**
  - Email verification token expires in 24h
  - Password reset token expires in 1h
  - Tokens are single-use
  - Email sent to user (logged to console)

---

### Phase 4: Security Hardening (Week 4) - 2 PRs

**PR13: Security Enhancements**
- Rate limiting on auth endpoints (5/min per IP)
- Brute force protection (lock account after 5 failed logins)
- Password strength validation (min 8 chars, uppercase, lowercase, number)
- CSRF protection for state-changing endpoints
- Helmet.js CSP updates
- **Acceptance Criteria:**
  - Rate limiter blocks excessive requests
  - Account locks after failed attempts
  - Weak passwords rejected
  - Security headers present

**PR14: Cross-Vertical Testing**
- Create test fixtures for boat, aircraft, marina verticals
- Integration tests for multi-entity scenarios
- Test permission inheritance across verticals
- Performance testing (1000 users, 10000 entities)
- **Acceptance Criteria:**
  - All verticals work identically
  - Permission checks complete in <50ms
  - No vertical-specific bugs
  - Load test passes

---

### Phase 5: Documentation & Migration (Week 5) - 2 PRs

**PR15: API Documentation**
- OpenAPI/Swagger spec for all auth endpoints
- Authentication flow diagrams
- Permission model documentation
- Example API calls (curl, JavaScript)
- **Acceptance Criteria:**
  - Swagger UI accessible at /api/docs
  - All endpoints documented
  - Examples are copy-pasteable
  - Response schemas defined

**PR16: Data Migration & Deployment**
- Migration script for existing users
- Default organization creation
- Admin user bootstrap
- Deployment guide
- Rollback procedures
- **Acceptance Criteria:**
  - Existing data migrated without loss
  - All users assigned to organizations
  - Admin user can access system
  - Rollback tested

---

## Data Migration Strategy

### Step 1: Analyze Existing Data
```sql
-- Check for existing users
SELECT COUNT(*) FROM users;

-- Check for orphaned entities
SELECT COUNT(*) FROM entities WHERE organization_id NOT IN (SELECT id FROM organizations);
```

### Step 2: Create Default Organizations
```javascript
// For each user without an organization, create a personal org
const usersWithoutOrg = db.prepare(`
  SELECT u.id, u.email, u.name
  FROM users u
  LEFT JOIN user_organizations uo ON u.id = uo.user_id
  WHERE uo.user_id IS NULL
`).all();

for (const user of usersWithoutOrg) {
  const orgId = generateUUID();
  db.prepare(`
    INSERT INTO organizations (id, name, type, created_at, updated_at)
    VALUES (?, ?, 'personal', ?, ?)
  `).run(orgId, `${user.name}'s Organization`, Date.now(), Date.now());

  db.prepare(`
    INSERT INTO user_organizations (user_id, organization_id, role, joined_at)
    VALUES (?, ?, 'admin', ?)
  `).run(user.id, orgId, Date.now());
}
```

### Step 3: Grant Entity Permissions
```javascript
// Grant admin permission to all existing entity owners
const entities = db.prepare('SELECT id, user_id FROM entities').all();

for (const entity of entities) {
  db.prepare(`
    INSERT INTO entity_permissions (id, user_id, entity_id, permission_level, granted_by, granted_at)
    VALUES (?, ?, ?, 'admin', ?, ?)
  `).run(generateUUID(), entity.user_id, entity.id, entity.user_id, Date.now());
}
```

### Step 4: Verify Migration
```sql
-- All users should have at least one organization
SELECT COUNT(*) FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_organizations uo WHERE uo.user_id = u.id
);
-- Expected: 0

-- All entities should have at least one admin
SELECT COUNT(*) FROM entities e
WHERE NOT EXISTS (
  SELECT 1 FROM entity_permissions ep
  WHERE ep.entity_id = e.id AND ep.permission_level = 'admin'
);
-- Expected: 0
```

---

## Security Considerations

### 1. Password Security
- **Hashing:** bcrypt with cost factor 12 (balances security and performance)
- **Storage:** Never log or expose password hashes
- **Validation:** Minimum 8 characters, complexity requirements
- **Reset:** One-time tokens, 1-hour expiry

### 2. Token Security
- **Access Tokens:** Short-lived (15 min), stateless JWT
- **Refresh Tokens:** Long-lived (7 days), stored in DB, revocable
- **Signing:** Use strong secret (min 256 bits), rotate periodically
- **Storage:** Client stores in httpOnly cookies (future) or secure storage

### 3. Session Security
- **Fixation:** Regenerate session ID after login
- **Timeout:** Absolute timeout (24h), idle timeout (2h)
- **Concurrent Sessions:** Limit to 5 per user
- **Device Tracking:** Log device info for anomaly detection

### 4. API Security
- **Rate Limiting:** 5 req/min for auth, 100 req/15min for API
- **CORS:** Restrict origins to known domains
- **CSP:** Strict content security policy
- **Input Validation:** Sanitize all inputs, validate types

### 5. Audit & Monitoring
- **Log Events:** Login, logout, permission changes, failed attempts
- **Anomaly Detection:** Multiple failed logins, unusual access patterns
- **Retention:** 90 days minimum, 1 year for compliance
- **Alerting:** Notify on suspicious activity

---

## Performance Considerations

### 1. Permission Check Optimization
```javascript
// Cache user permissions in memory (LRU cache)
import LRU from 'lru-cache';

const permissionCache = new LRU({
  max: 10000,           // 10k entries
  ttl: 1000 * 60 * 5,   // 5 minutes
});

async function checkEntityPermissionCached(userId, entityId, permission) {
  const cacheKey = `${userId}:${entityId}:${permission}`;
  const cached = permissionCache.get(cacheKey);

  if (cached !== undefined) return cached;

  const result = await checkEntityPermission(userId, entityId, permission);
  permissionCache.set(cacheKey, result);

  return result;
}
```

### 2. Database Query Optimization
- Use prepared statements (already done in better-sqlite3)
- Add covering indexes for common permission queries
- Batch permission checks when loading lists

### 3. JWT Payload Size
- Keep JWT payload minimal (<1KB)
- Include only essential claims: userId, email, role
- Don't embed permissions (resolve server-side)

---

## Testing Strategy

### 1. Unit Tests
- AuthService: registration, login, token generation
- AuthorizationService: permission resolution logic
- Middleware: token validation, permission checks
- **Coverage Target:** >90%

### 2. Integration Tests
- End-to-end auth flows (register → verify → login → refresh)
- Permission checks across different user roles
- Multi-entity, multi-user scenarios
- **Coverage Target:** All happy paths + critical edge cases

### 3. Security Tests
- SQL injection attempts
- JWT tampering
- Brute force simulation
- CSRF attacks
- **Tools:** OWASP ZAP, Burp Suite

### 4. Performance Tests
- 1000 concurrent logins
- 10000 permission checks per second
- Database query benchmarks
- **Tools:** Apache JMeter, k6

---

## Rollback Plan

### If Critical Issue Found After Deployment:

1. **Immediate:** Revert to previous version via git
   ```bash
   git revert <commit-hash>
   npm run deploy
   ```

2. **Database Rollback:**
   ```sql
   -- Drop new tables
   DROP TABLE IF EXISTS entity_permissions;
   DROP TABLE IF EXISTS refresh_tokens;
   DROP TABLE IF EXISTS password_reset_tokens;
   DROP TABLE IF EXISTS audit_log;

   -- Revert schema changes
   -- (Run down migration script)
   ```

3. **User Communication:**
   - Notify users of temporary service interruption
   - Explain impact (e.g., need to re-login)
   - Provide ETA for fix

4. **Post-Mortem:**
   - Document root cause
   - Add test coverage for missed scenario
   - Update deployment checklist

---

## Future Enhancements

### Short Term (3-6 months)
- Email service integration (SendGrid/SES)
- Two-factor authentication (TOTP)
- Social login (Google, Microsoft)
- Mobile app authentication (OAuth2 PKCE)

### Medium Term (6-12 months)
- Single Sign-On (SAML, OIDC)
- API key management for integrations
- Webhook security (HMAC signatures)
- Advanced audit analytics

### Long Term (12+ months)
- Machine learning anomaly detection
- Passwordless authentication (WebAuthn)
- Zero-trust architecture
- Multi-region token replication

---

## Acceptance Criteria Summary

**System is considered complete when:**

1. ✅ User can register with email/password
2. ✅ User can login and receive JWT access + refresh tokens
3. ✅ User can reset forgotten password via email link
4. ✅ User can verify email address
5. ✅ Organization admin can invite users to organization
6. ✅ Organization admin can grant entity access to specific users
7. ✅ Organization manager can view all entities, edit assigned entities
8. ✅ Organization member can only access explicitly granted entities
9. ✅ Permission levels (viewer, editor, manager, admin) work correctly
10. ✅ All auth endpoints are rate-limited and secured
11. ✅ All security events are logged to audit table
12. ✅ System works identically across all verticals (boat, aircraft, etc.)
13. ✅ Migration script successfully converts existing data
14. ✅ API documentation is complete and accurate
15. ✅ All tests pass (unit, integration, security, performance)

---

## Appendices

### A. JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "email": "user@example.com",
    "iat": 1634567890,
    "exp": 1634568790,
    "iss": "navidocs-api"
  },
  "signature": "..."
}
```

### B. Permission Matrix

| User Role (Org) | Entity Role | View | Edit | Create | Delete | Manage Permissions |
|----------------|-------------|------|------|--------|--------|-------------------|
| Admin          | -           | ✅   | ✅   | ✅     | ✅     | ✅                |
| Manager        | -           | ✅   | ✅   | ✅     | ✅     | ✅ (entity-level) |
| Member         | Admin       | ✅   | ✅   | ✅     | ✅     | ✅                |
| Member         | Manager     | ✅   | ✅   | ✅     | ✅     | ❌                |
| Member         | Editor      | ✅   | ✅   | ✅     | ❌     | ❌                |
| Member         | Viewer      | ✅   | ❌   | ❌     | ❌     | ❌                |
| Viewer         | -           | ✅   | ❌   | ❌     | ❌     | ❌                |

### C. Error Code Reference

| Code | Message | Scenario |
|------|---------|----------|
| 401  | Authentication required | No token provided |
| 401  | Invalid credentials | Wrong email/password |
| 401  | Token expired | Access token TTL exceeded |
| 403  | Access denied | Valid token, insufficient permissions |
| 403  | Account suspended | User account disabled |
| 409  | Email already exists | Registration with existing email |
| 429  | Too many requests | Rate limit exceeded |
| 500  | Internal server error | Unexpected error |

---

## Conclusion

This design provides a comprehensive, scalable, and secure multi-tenancy authentication and authorization system for NaviDocs. The recommended approach (JWT + RBAC with entity-level permissions) balances flexibility, performance, and maintainability while meeting all stated requirements.

The implementation is broken down into 16 PRs across 5 weeks, with clear acceptance criteria for each deliverable. The modular architecture ensures separation of concerns and enables future enhancements without major refactoring.

**Next Steps:**
1. Review and approve this design document
2. Create GitHub issues for each PR
3. Assign to development team
4. Begin Phase 1 implementation

---

**Document Version History:**
- v1.0 (2025-10-21): Initial design by Tech Lead
