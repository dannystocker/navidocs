# NaviDocs Auth System - Quick Start Guide

## For Developers: Get Started in 5 Minutes

This guide helps you understand and work with the NaviDocs authentication and authorization system quickly.

---

## TL;DR

- **Auth Type:** JWT (stateless)
- **Permissions:** RBAC with entity-level granularity
- **Hierarchy:** Organization → Entity → Resource
- **Token Expiry:** Access 15min, Refresh 7 days
- **Password:** bcrypt (cost=12)
- **Cache:** LRU, 5min TTL

---

## Using Auth in Your Code

### 1. Protect a Route

```javascript
import { authenticateToken } from '../middleware/auth.js';
import { requireEntityAccess } from '../middleware/permissions.js';

// Require authentication only
router.get('/api/profile', authenticateToken, async (req, res) => {
  const userId = req.user.id; // User attached by middleware
  // ... your code
});

// Require authentication + entity permission
router.get('/api/entities/:entityId/details',
  authenticateToken,
  requireEntityAccess('view'),
  async (req, res) => {
    const entityId = req.params.entityId;
    // User already verified to have 'view' permission
    // ... your code
  }
);

// Require authentication + admin permission
router.delete('/api/entities/:entityId',
  authenticateToken,
  requireEntityAccess('delete'),
  async (req, res) => {
    // Only users with 'delete' permission can reach here
    // ... your code
  }
);
```

### 2. Check Permissions Manually

```javascript
import AuthorizationService from '../services/authorization.js';

// In your route handler:
const canEdit = await AuthorizationService.checkEntityPermission(
  userId,
  entityId,
  'edit'
);

if (!canEdit) {
  return res.status(403).json({ error: 'Access denied' });
}

// Continue with business logic
```

### 3. Get User's Accessible Entities

```javascript
import AuthorizationService from '../services/authorization.js';

router.get('/api/my-entities', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const entities = await AuthorizationService.getUserEntities(userId);

  // Returns: [{ entityId, name, entityType, effectivePermission, ... }]
  res.json({ entities });
});
```

### 4. Grant/Revoke Permissions

```javascript
import AuthorizationService from '../services/authorization.js';

// Grant permission
router.post('/api/entities/:entityId/permissions',
  authenticateToken,
  async (req, res) => {
    const { userId, permissionLevel } = req.body; // e.g., 'editor'
    const granterId = req.user.id;
    const entityId = req.params.entityId;

    try {
      const permId = await AuthorizationService.grantEntityPermission(
        granterId,
        userId,
        entityId,
        permissionLevel
      );

      res.json({ permissionId: permId, message: 'Permission granted' });
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  }
);

// Revoke permission
router.delete('/api/entities/:entityId/permissions/:userId',
  authenticateToken,
  async (req, res) => {
    const granterId = req.user.id;
    const { entityId, userId } = req.params;

    const revoked = await AuthorizationService.revokeEntityPermission(
      granterId,
      userId,
      entityId
    );

    res.json({ success: revoked });
  }
);
```

### 5. Log Audit Events

```javascript
import AuditService from '../services/audit.js';

// In your route handler:
await AuditService.logEvent(
  'document_downloaded',  // event_type
  req.user.id,            // user_id
  'document',             // resource_type
  documentId,             // resource_id
  'success',              // status
  {                       // metadata
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    file_name: document.file_name
  }
);
```

---

## Permission Levels Quick Reference

| Level | Can View | Can Edit | Can Create | Can Delete | Can Share | Can Manage Users |
|-------|----------|----------|------------|------------|-----------|------------------|
| **viewer** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **editor** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **manager** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Organization Roles Quick Reference

| Role | Entity Access | Can Grant Permissions | Can Manage Org |
|------|---------------|----------------------|----------------|
| **viewer** | Read-only on all entities | ❌ | ❌ |
| **member** | Only explicitly granted entities | ❌ | ❌ |
| **manager** | View/Edit all entities | ✅ (entity-level) | ❌ |
| **admin** | Full access to all entities | ✅ (all levels) | ✅ |

---

## Common Patterns

### Pattern 1: User Registration Flow

```javascript
import AuthService from '../services/auth.js';

router.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const result = await AuthService.register(email, password, name);

    // In production: Send verification email
    // await EmailService.sendVerificationEmail(result.email, result.verificationToken);

    res.status(201).json({
      user: {
        id: result.id,
        email: result.email,
        name: result.name
      },
      message: 'Registration successful. Please verify your email.'
    });

  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});
```

### Pattern 2: Login Flow

```javascript
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    };

    const result = await AuthService.login(email, password, deviceInfo);

    // Returns: { accessToken, refreshToken, user }
    res.json(result);

  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});
```

### Pattern 3: Protected Resource Access

```javascript
router.get('/api/documents/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const documentId = req.params.id;
      const userId = req.user.id;

      // Get document
      const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check permission
      const canView = await AuthorizationService.checkDocumentPermission(
        userId,
        documentId,
        'view'
      );

      if (!canView) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Return document
      res.json({ document });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

### Pattern 4: Organization Member Management

```javascript
import OrganizationService from '../services/organizations.js';

// Add member to organization
router.post('/api/organizations/:orgId/members',
  authenticateToken,
  async (req, res) => {
    try {
      const { orgId } = req.params;
      const { userId, role } = req.body; // role: 'member', 'manager', 'admin'
      const addedBy = req.user.id;

      // Check if current user is admin of org
      const isAdmin = await AuthorizationService.checkOrganizationPermission(
        addedBy,
        orgId,
        'manage_users'
      );

      if (!isAdmin) {
        return res.status(403).json({ error: 'Only admins can add members' });
      }

      await OrganizationService.addMember(orgId, userId, role, addedBy);

      res.json({ success: true, message: 'Member added' });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

---

## Testing Your Auth Code

### Unit Test Example

```javascript
import { expect } from 'chai';
import AuthorizationService from '../services/authorization.js';
import { setupTestDb, teardownTestDb } from './helpers.js';

describe('AuthorizationService', () => {
  before(() => setupTestDb());
  after(() => teardownTestDb());

  it('grants entity permission', async () => {
    const userId = 'user-123';
    const entityId = 'entity-456';
    const granterId = 'admin-789';

    // Grant permission
    const permId = await AuthorizationService.grantEntityPermission(
      granterId,
      userId,
      entityId,
      'editor'
    );

    expect(permId).to.be.a('string');

    // Verify permission
    const canEdit = await AuthorizationService.checkEntityPermission(
      userId,
      entityId,
      'edit'
    );

    expect(canEdit).to.be.true;
  });
});
```

### Integration Test Example

```javascript
import request from 'supertest';
import app from '../index.js';

describe('Auth Routes', () => {
  let accessToken;

  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User'
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
  });

  it('logs in user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');

    accessToken = res.body.accessToken;
  });

  it('accesses protected route', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
  });
});
```

---

## Frontend Integration

### Storing Tokens

```javascript
// After login:
const { accessToken, refreshToken, user } = await response.json();

// Store in localStorage (or secure httpOnly cookie in production)
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
localStorage.setItem('user', JSON.stringify(user));
```

### Making Authenticated Requests

```javascript
// Utility function
async function authenticatedFetch(url, options = {}) {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  // If token expired, refresh and retry
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return authenticatedFetch(url, options); // Retry with new token
    } else {
      // Refresh failed, redirect to login
      window.location.href = '/login';
    }
  }

  return response;
}

// Usage:
const response = await authenticatedFetch('/api/documents');
const data = await response.json();
```

### Refreshing Access Token

```javascript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      // Refresh token invalid, logout
      localStorage.clear();
      return null;
    }

    const { accessToken } = await response.json();
    localStorage.setItem('accessToken', accessToken);

    return accessToken;

  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}
```

---

## Debugging

### Common Issues

**Issue: "Authentication required"**
- **Cause:** Missing or invalid JWT token
- **Fix:** Ensure `Authorization: Bearer <token>` header is present
- **Check:** Token not expired (use jwt.io to decode and inspect)

**Issue: "Access denied" (403)**
- **Cause:** User lacks required permission
- **Fix:** Grant user appropriate entity permission
- **Check:** Query `entity_permissions` table for user's permissions

**Issue: "Invalid or expired token"**
- **Cause:** JWT signature invalid or expired
- **Fix:** Refresh access token using refresh token
- **Check:** Ensure JWT_SECRET matches between client and server

**Issue: Permission changes not taking effect**
- **Cause:** LRU cache still has old value
- **Fix:** Cache auto-expires in 5 minutes
- **Dev:** Clear cache manually: `AuthorizationService.clearCache()`

### Debugging Queries

```sql
-- Check user's organizations
SELECT o.name, uo.role
FROM user_organizations uo
INNER JOIN organizations o ON o.id = uo.organization_id
WHERE uo.user_id = 'user-id-here';

-- Check user's entity permissions
SELECT e.name, ep.permission_level, ep.granted_at
FROM entity_permissions ep
INNER JOIN entities e ON e.id = ep.entity_id
WHERE ep.user_id = 'user-id-here';

-- Check audit log for user
SELECT event_type, status, created_at, metadata
FROM audit_log
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC
LIMIT 20;

-- Check active refresh tokens
SELECT id, device_info, created_at, expires_at
FROM refresh_tokens
WHERE user_id = 'user-id-here' AND revoked = 0;
```

---

## Environment Variables

Add to your `.env` file:

```bash
# Authentication
JWT_SECRET=your-secret-key-min-32-chars-change-in-production
JWT_EXPIRES_IN=15m

# Bcrypt (higher = more secure but slower)
BCRYPT_ROUNDS=12

# Token expiry (milliseconds)
REFRESH_TOKEN_EXPIRES=604800000  # 7 days
RESET_TOKEN_EXPIRES=3600000      # 1 hour
EMAIL_VERIFY_EXPIRES=86400000    # 24 hours

# Rate limiting
AUTH_RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Audit log retention (days)
AUDIT_LOG_RETENTION_DAYS=90
```

---

## CLI Commands

```bash
# Run database migration
npm run migrate:up -- 003_auth_tables

# Rollback migration
npm run migrate:down -- 003_auth_tables

# Clean up old audit logs
node scripts/cleanup-audit-logs.js --days 90

# Create admin user (for testing)
node scripts/create-admin-user.js --email admin@example.com --password SecurePass123

# Revoke all user sessions
node scripts/revoke-user-sessions.js --userId user-id-here

# Export audit logs
node scripts/export-audit-logs.js --startDate 2025-01-01 --endDate 2025-12-31 --format csv
```

---

## Best Practices

### ✅ DO:
- Always use `authenticateToken` middleware on protected routes
- Check specific permissions when dealing with entities/documents
- Log security events with `AuditService.logEvent()`
- Use refresh tokens for long-lived sessions
- Rotate JWT_SECRET periodically
- Hash all passwords with bcrypt
- Validate user input (email format, password strength)
- Use HTTPS in production
- Set short expiry on access tokens (15min)

### ❌ DON'T:
- Don't log passwords or tokens
- Don't store tokens in localStorage (use httpOnly cookies in production)
- Don't skip authentication checks ("I'll add it later")
- Don't grant higher permissions than you have
- Don't expose user existence in error messages
- Don't use weak JWT secrets
- Don't skip rate limiting on auth endpoints
- Don't trust client-side permission checks

---

## Performance Tips

1. **Use Permission Cache:** Cache is automatic, but you can pre-warm it:
   ```javascript
   await AuthorizationService.checkEntityPermission(userId, entityId, 'view');
   // Result is now cached for 5 minutes
   ```

2. **Batch Permission Checks:** When listing entities, fetch all at once:
   ```javascript
   const entities = await AuthorizationService.getUserEntities(userId);
   // Single query instead of N queries
   ```

3. **Avoid Nested Permission Checks:** Cache the result:
   ```javascript
   // Bad: Checking permission multiple times
   if (await checkPerm(...)) { /* ... */ }
   if (await checkPerm(...)) { /* ... */ }

   // Good: Check once, reuse result
   const canEdit = await checkPerm(...);
   if (canEdit) { /* ... */ }
   if (canEdit) { /* ... */ }
   ```

4. **Index Your Queries:** Ensure indexes exist on frequently queried fields

---

## Support

**Documentation:**
- Full Design: `/server/DESIGN_AUTH_MULTITENANCY.md`
- Implementation Tasks: `/server/IMPLEMENTATION_TASKS.md`
- Architecture Diagrams: `/server/ARCHITECTURE_DIAGRAM.md`
- Summary: `/server/AUTH_SYSTEM_SUMMARY.md`

**Code Examples:**
- See `/test/services/` for unit test examples
- See `/test/routes/` for integration test examples

**Questions?**
- Check existing tests for usage patterns
- Review service method JSDoc comments
- Consult design documents above

---

**Last Updated:** 2025-10-21
**Version:** 1.0
