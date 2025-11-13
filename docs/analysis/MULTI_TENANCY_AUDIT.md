# NaviDocs Multi-Tenancy Security Audit Report

**Date:** October 23, 2025
**Auditor:** Claude Code
**Scope:** Document isolation and organizationId enforcement across all API endpoints

---

## Executive Summary

This audit evaluates the multi-tenancy implementation in NaviDocs to ensure documents are properly scoped to organizations and that single-boat tenants (like Liliane1) cannot access documents from other organizations.

**Overall Security Rating: 🔴 CRITICAL VULNERABILITIES FOUND**

### Critical Findings
- **DELETE endpoint has NO access control** - Any user can delete any document
- **STATS endpoint exposes ALL documents** - No organization filtering
- **No authentication middleware enforcement** - Routes use fallback test user IDs
- **Missing organizationId validation** in upload endpoint

---

## Authentication Architecture

### Current Implementation

NaviDocs has TWO authentication middleware files with different implementations:

1. **`/home/setup/navidocs/server/middleware/auth.js`** (Older, simpler)
   - Basic JWT verification
   - Exports: `authenticateToken`, `optionalAuth`
   - No organization-level checks

2. **`/home/setup/navidocs/server/middleware/auth.middleware.js`** (Newer, comprehensive)
   - Full JWT verification with audit logging
   - Exports: `authenticateToken`, `requireEmailVerified`, `requireActiveAccount`, `requireOrganizationMember`, `requireOrganizationRole`, `requireEntityPermission`, `requireSystemAdmin`, `optionalAuth`
   - Includes organization and entity permission checks

### Current Route Protection Status

**CRITICAL ISSUE:** Based on `/home/setup/navidocs/server/index.js`, **NONE of the document routes use authentication middleware**:

```javascript
// No authentication middleware on these routes:
app.use('/api/upload', uploadRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', imagesRoutes);
```

All routes fall back to:
```javascript
const userId = req.user?.id || 'test-user-id';
```

---

## Endpoint-by-Endpoint Analysis

### 1. Document Upload (POST /api/upload)

**File:** `/home/setup/navidocs/server/routes/upload.js`

#### Current Implementation
```javascript
// Line 50: organizationId is required in request body
const { title, documentType, organizationId, entityId, componentId, subEntityId } = req.body;

// Line 60: Validates required fields
if (!title || !documentType || !organizationId) {
  return res.status(400).json({
    error: 'Missing required fields: title, documentType, organizationId'
  });
}

// Lines 94-102: Auto-creates organization if it doesn't exist
const existingOrg = db.prepare('SELECT id FROM organizations WHERE id = ?').get(organizationId);
if (!existingOrg) {
  console.log(`Creating new organization: ${organizationId}`);
  db.prepare(`
    INSERT INTO organizations (id, name, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(organizationId, organizationId, Date.now(), Date.now());
}
```

#### Security Issues
| Issue | Severity | Description |
|-------|----------|-------------|
| No authentication | 🔴 CRITICAL | Anyone can upload without authentication |
| No organization membership check | 🔴 CRITICAL | User can upload to ANY organizationId they specify |
| Auto-creates organizations | 🔴 CRITICAL | Allows creation of arbitrary organizations |
| Client controls organizationId | 🔴 CRITICAL | Should be derived from authenticated user context |

#### Recommended Fixes
1. Add authentication middleware: `authenticateToken`
2. Add organization membership check: `requireOrganizationMember`
3. Remove auto-organization creation
4. Validate user belongs to specified organizationId
5. Consider deriving organizationId from user's active organization context

---

### 2. Document Listing (GET /api/documents)

**File:** `/home/setup/navidocs/server/routes/documents.js`

#### Current Implementation
```javascript
// Lines 240-257: PROPER tenant isolation with INNER JOIN
let query = `
  SELECT
    d.id,
    d.organization_id,
    d.entity_id,
    d.title,
    d.document_type,
    d.file_name,
    d.file_size,
    d.page_count,
    d.status,
    d.created_at,
    d.updated_at
  FROM documents d
  INNER JOIN user_organizations uo ON d.organization_id = uo.organization_id
  WHERE uo.user_id = ?
`;
```

#### Security Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| organizationId filtering | ✅ GOOD | Uses INNER JOIN on user_organizations |
| Query construction | ✅ GOOD | Filters by userId from user_organizations |
| Additional filters | ✅ GOOD | Optional organizationId, entityId, documentType, status |
| SQL injection protection | ✅ GOOD | Uses parameterized queries |

#### Security Issues
| Issue | Severity | Description |
|-------|----------|-------------|
| No authentication | 🟡 HIGH | Falls back to test-user-id |
| Optional organizationId filter | 🟢 LOW | User can query across all their orgs (acceptable) |

#### Recommendation
✅ **Implementation is CORRECT** - Once authentication middleware is added, this endpoint properly enforces tenant isolation.

---

### 3. Document Retrieval (GET /api/documents/:id)

**File:** `/home/setup/navidocs/server/routes/documents.js`

#### Current Implementation
```javascript
// Lines 41-63: Gets document without initial organizationId filter
const document = db.prepare(`
  SELECT
    d.id,
    d.organization_id,
    d.entity_id,
    ...
  FROM documents d
  WHERE d.id = ?
`).get(id);

// Lines 70-79: Access check AFTER retrieving document
const hasAccess = db.prepare(`
  SELECT 1 FROM user_organizations
  WHERE user_id = ? AND organization_id = ?
  UNION
  SELECT 1 FROM documents
  WHERE id = ? AND uploaded_by = ?
  UNION
  SELECT 1 FROM document_shares
  WHERE document_id = ? AND shared_with = ?
`).get(userId, document.organization_id, id, userId, id, userId);
```

#### Security Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| organizationId check | ✅ GOOD | Verifies user belongs to document's organization |
| Document shares support | ✅ GOOD | Allows shared document access |
| Upload ownership check | ✅ GOOD | Document owner can always access |
| Access denied response | ✅ GOOD | Returns 403 if no access |

#### Security Issues
| Issue | Severity | Description |
|-------|----------|-------------|
| No authentication | 🟡 HIGH | Falls back to test-user-id |
| Information disclosure | 🟢 LOW | Returns 404 vs 403 for non-existent docs (acceptable) |
| Entity/Component queries | 🟡 MEDIUM | Lines 104-119 don't re-verify organization ownership |

#### Recommendations
1. Add authentication middleware
2. Consider verifying entity/component belong to same organization as document (defense in depth)

---

### 4. Document PDF Retrieval (GET /api/documents/:id/pdf)

**File:** `/home/setup/navidocs/server/routes/documents.js`

#### Current Implementation
```javascript
// Lines 191-195: Gets document
const doc = db.prepare(`
  SELECT id, organization_id, file_path, file_name
  FROM documents
  WHERE id = ?
`).get(id);

// Lines 199-203: Access check (same as retrieval endpoint)
const hasAccess = db.prepare(`
  SELECT 1 FROM user_organizations WHERE user_id = ? AND organization_id = ?
  UNION SELECT 1 FROM documents WHERE id = ? AND uploaded_by = ?
  UNION SELECT 1 FROM document_shares WHERE document_id = ? AND shared_with = ?
`).get(userId, doc.organization_id, id, userId, id, userId);
```

#### Security Assessment
✅ **GOOD** - Same access control as document retrieval endpoint

#### Security Issues
| Issue | Severity | Description |
|-------|----------|-------------|
| No authentication | 🟡 HIGH | Falls back to test-user-id |

---

### 5. Document Deletion (DELETE /api/documents/:id)

**File:** `/home/setup/navidocs/server/routes/documents.js`

#### Current Implementation
```javascript
// Lines 354-414: CRITICAL VULNERABILITY
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const db = getDb();
  const searchClient = getMeilisearchClient();

  // Get document info before deletion
  const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // ❌ NO ACCESS CONTROL CHECK ❌

  // Delete from Meilisearch index
  try {
    const index = await searchClient.getIndex(MEILISEARCH_INDEX_NAME);
    const filter = `docId = "${id}"`;
    await index.deleteDocuments({ filter });
  } catch (err) {
    logger.warn(`Meilisearch cleanup failed for ${id}:`, err);
  }

  // Delete from database
  const deleteStmt = db.prepare('DELETE FROM documents WHERE id = ?');
  deleteStmt.run(id);

  // Delete from filesystem
  const docFolder = path.join(uploadsDir, id);
  if (fs.existsSync(docFolder)) {
    await rm(docFolder, { recursive: true, force: true });
  }

  res.json({
    success: true,
    message: 'Document deleted successfully',
    documentId: id,
    title: document.title
  });
});
```

#### Security Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| organizationId check | 🔴 MISSING | NO ACCESS CONTROL AT ALL |
| User authentication | 🔴 MISSING | Not even checked |
| Organization membership | 🔴 MISSING | Not verified |

#### Security Issues
| Issue | Severity | Description |
|-------|----------|-------------|
| No access control | 🔴 CRITICAL | **ANY USER CAN DELETE ANY DOCUMENT** |
| No authentication | 🔴 CRITICAL | Endpoint is completely unprotected |
| No audit trail | 🟡 HIGH | Deletion not logged with user context |

#### Recommended Fix
```javascript
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const db = getDb();

  // Get document with organization
  const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // ✅ ADD ACCESS CONTROL CHECK
  const hasAccess = db.prepare(`
    SELECT 1 FROM user_organizations
    WHERE user_id = ? AND organization_id = ?
  `).get(userId, document.organization_id);

  if (!hasAccess) {
    logger.warn(`Unauthorized deletion attempt`, {
      userId,
      documentId: id,
      organizationId: document.organization_id
    });
    return res.status(403).json({
      error: 'Access denied',
      message: 'You do not have permission to delete this document'
    });
  }

  // ✅ ADD ROLE CHECK (only admins/managers should delete)
  const userRole = db.prepare(`
    SELECT role FROM user_organizations
    WHERE user_id = ? AND organization_id = ?
  `).get(userId, document.organization_id);

  if (!['admin', 'manager'].includes(userRole?.role)) {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Only admins and managers can delete documents'
    });
  }

  // Proceed with deletion...
});
```

---

### 6. Search Token Generation (POST /api/search/token)

**File:** `/home/setup/navidocs/server/routes/search.js`

#### Current Implementation
```javascript
// Lines 34-40: Gets user's organizations
const orgs = db.prepare(`
  SELECT organization_id
  FROM user_organizations
  WHERE user_id = ?
`).all(userId);

const organizationIds = orgs.map(org => org.organization_id);

if (organizationIds.length === 0) {
  return res.status(403).json({ error: 'No organizations found for user' });
}

// Lines 50-52: Generates tenant token with organization filter
const token = await generateTenantToken(userId, organizationIds, tokenExpiry);
```

**`/home/setup/navidocs/server/config/meilisearch.js`:**
```javascript
// Lines 101-106: Tenant token filter construction
export async function generateTenantToken(userId, organizationIds, expiresIn = 3600) {
  const orgList = (organizationIds || []).map((id) => `"${id}"`).join(', ');
  const filter = `userId = "${userId}" OR organizationId IN [${orgList}]`;

  const searchRules = {
    [INDEX_NAME]: { filter }
  };
  // ...
}
```

#### Security Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| organizationId filtering | ✅ EXCELLENT | Generates tenant-scoped token |
| Multi-organization support | ✅ GOOD | Supports users in multiple orgs |
| Token expiration | ✅ GOOD | Configurable with 24h max |
| Filter syntax | ✅ GOOD | Properly quotes string values |

#### Security Issues
| Issue | Severity | Description |
|-------|----------|-------------|
| No authentication | 🟡 HIGH | Falls back to test-user-id |
| userId filter redundancy | 🟢 LOW | `userId = "${userId}"` filter might be unnecessary |

#### Recommendation
✅ **Implementation is EXCELLENT** - Proper tenant token generation with organization scoping.

---

### 7. Server-Side Search (POST /api/search)

**File:** `/home/setup/navidocs/server/routes/search.js`

#### Current Implementation
```javascript
// Lines 98-104: Gets user's organizations
const orgs = db.prepare(`
  SELECT organization_id
  FROM user_organizations
  WHERE user_id = ?
`).all(userId);

const organizationIds = orgs.map(org => org.organization_id);

// Lines 112-114: Builds organization filter
const filterParts = [
  `userId = "${userId}" OR organizationId IN [${organizationIds.map(id => `"${id}"`).join(', ')}]`
];
```

#### Security Assessment
✅ **GOOD** - Properly filters search results by user's organizations

#### Security Issues
| Issue | Severity | Description |
|-------|----------|-------------|
| No authentication | 🟡 HIGH | Falls back to test-user-id |

---

### 8. Image Retrieval Endpoints

**File:** `/home/setup/navidocs/server/routes/images.js`

#### Current Implementation
```javascript
// Lines 32-49: verifyDocumentAccess helper function
async function verifyDocumentAccess(documentId, userId, db) {
  const document = db.prepare('SELECT id, organization_id FROM documents WHERE id = ?').get(documentId);

  if (!document) {
    return { hasAccess: false, error: 'Document not found', status: 404 };
  }

  const hasAccess = db.prepare(`
    SELECT 1 FROM user_organizations WHERE user_id = ? AND organization_id = ?
    UNION SELECT 1 FROM documents WHERE id = ? AND uploaded_by = ?
    UNION SELECT 1 FROM document_shares WHERE document_id = ? AND shared_with = ?
  `).get(userId, document.organization_id, documentId, userId, documentId, userId);

  if (!hasAccess) {
    return { hasAccess: false, error: 'Access denied', status: 403 };
  }

  return { hasAccess: true, document };
}
```

All image endpoints (GET /api/documents/:id/images, GET /api/documents/:id/pages/:pageNum/images, GET /api/images/:imageId) use this helper.

#### Security Assessment
✅ **GOOD** - Consistent access control through helper function

#### Security Issues
| Issue | Severity | Description |
|-------|----------|-------------|
| No authentication | 🟡 HIGH | Falls back to test-user-id |
| Path traversal protection | ✅ GOOD | Lines 298-308 validate file path |

---

### 9. Statistics Endpoint (GET /api/stats)

**File:** `/home/setup/navidocs/server/routes/stats.js`

#### Current Implementation
```javascript
// Lines 18-81: NO organizationId filtering
router.get('/', async (req, res) => {
  try {
    const db = getDb();

    // ❌ EXPOSES ALL DOCUMENTS ❌
    const { totalDocuments } = db.prepare(`
      SELECT COUNT(*) as totalDocuments FROM documents
    `).get();

    const { totalPages } = db.prepare(`
      SELECT COUNT(*) as totalPages FROM document_pages
    `).get();

    const documentsByStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM documents
      GROUP BY status
    `).all();

    // Shows recent documents from ALL organizations
    const recentDocuments = db.prepare(`
      SELECT id, title, status, created_at, page_count
      FROM documents
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // ...
  }
});
```

#### Security Assessment
| Aspect | Status | Notes |
|--------|--------|-------|
| organizationId filtering | 🔴 MISSING | Shows stats across ALL organizations |
| User authentication | 🔴 MISSING | Not checked |
| Data exposure | 🔴 CRITICAL | Leaks document counts, titles, status |

#### Security Issues
| Issue | Severity | Description |
|-------|----------|-------------|
| No organization filtering | 🔴 CRITICAL | **EXPOSES DATA FROM ALL TENANTS** |
| No authentication | 🔴 CRITICAL | Anyone can view system-wide stats |
| Information disclosure | 🔴 CRITICAL | Reveals document titles, counts, storage usage |

#### Recommended Fix
```javascript
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const db = getDb();

    // ✅ Get user's organizations
    const orgs = db.prepare(`
      SELECT organization_id FROM user_organizations WHERE user_id = ?
    `).all(userId);

    const orgIds = orgs.map(o => o.organization_id);

    if (orgIds.length === 0) {
      return res.status(403).json({ error: 'No organizations found' });
    }

    // ✅ Filter by organization
    const placeholders = orgIds.map(() => '?').join(',');

    const { totalDocuments } = db.prepare(`
      SELECT COUNT(*) as totalDocuments
      FROM documents
      WHERE organization_id IN (${placeholders})
    `).get(...orgIds);

    // ... apply same filtering to all queries
  }
});
```

---

## Database Schema Analysis

**File:** `/home/setup/navidocs/server/db/schema.sql`

### Multi-Tenancy Design

```sql
-- Organizations table (Line 22-28)
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'personal',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- User-Organization membership (Line 31-39)
CREATE TABLE user_organizations (
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',             -- admin, manager, member, viewer
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, organization_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Documents table (Line 112-149)
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,          -- ✅ REQUIRED organizationId
  entity_id TEXT,
  sub_entity_id TEXT,
  component_id TEXT,
  uploaded_by TEXT NOT NULL,
  -- ...
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  -- ...
);

-- Indexes (Line 253-261)
CREATE INDEX idx_documents_org ON documents(organization_id);  -- ✅ Indexed
```

### Assessment
✅ **Schema is well-designed for multi-tenancy:**
- `organization_id` is NOT NULL and indexed
- Foreign key cascade on organization deletion
- User-organization many-to-many relationship with roles
- Document shares table for cross-user document access

---

## Test Scenarios for Tenant Isolation

### Scenario 1: Cross-Organization Document Access
**Setup:**
- User A belongs to Organization "Liliane1"
- User B belongs to Organization "Yacht-Club-Marina"
- Document D1 uploaded to "Liliane1"

**Test Cases:**

| Test | Expected Result | Current Result |
|------|----------------|----------------|
| User B calls GET /api/documents/:D1 | 403 Forbidden | ✅ 403 (if authenticated) |
| User B calls GET /api/documents with no filter | Empty list | ✅ Empty (if authenticated) |
| User B calls GET /api/documents/:D1/pdf | 403 Forbidden | ✅ 403 (if authenticated) |
| User B calls DELETE /api/documents/:D1 | 403 Forbidden | 🔴 200 Success (VULNERABLE) |
| User B searches for D1 content | No results | ✅ No results (if authenticated) |

### Scenario 2: Malicious Upload to Another Organization
**Setup:**
- User A belongs to "Liliane1"
- User A attempts upload with organizationId="Yacht-Club-Marina"

**Test Cases:**

| Test | Expected Result | Current Result |
|------|----------------|----------------|
| Upload with wrong organizationId | 403 Forbidden | 🔴 200 Success (VULNERABLE) |
| Upload creates new organization | Should fail | 🔴 Creates org (VULNERABLE) |

### Scenario 3: Multi-Organization User
**Setup:**
- User C belongs to both "Liliane1" and "Yacht-Club-Marina"
- Documents exist in both organizations

**Test Cases:**

| Test | Expected Result | Current Result |
|------|----------------|----------------|
| GET /api/documents (no filter) | All docs from both orgs | ✅ Correct (if authenticated) |
| GET /api/documents?organizationId=Liliane1 | Only Liliane1 docs | ✅ Correct (if authenticated) |
| Search returns results | From both organizations | ✅ Correct (if authenticated) |
| Stats endpoint | Combined stats for both orgs | 🔴 Shows ALL orgs (VULNERABLE) |

### Scenario 4: Document Sharing
**Setup:**
- User A uploads document D1 to "Liliane1"
- User A shares D1 with User B (different organization)

**Test Cases:**

| Test | Expected Result | Current Result |
|------|----------------|----------------|
| User B accesses shared document | 200 Success | ✅ Correct (if authenticated) |
| User B appears in sharing check | Found via document_shares | ✅ Correct (if authenticated) |
| User B tries to delete shared doc | 403 Forbidden | 🔴 200 Success (VULNERABLE) |

---

## Critical Vulnerabilities Summary

### 🔴 Critical (Must Fix Immediately)

1. **No Authentication Enforcement**
   - **Impact:** Anyone can access all endpoints without authentication
   - **Location:** All routes use fallback `test-user-id`
   - **Fix:** Add `authenticateToken` middleware to all routes

2. **DELETE Endpoint Unprotected**
   - **Impact:** Any user can delete any document
   - **Location:** `/home/setup/navidocs/server/routes/documents.js:354-414`
   - **Fix:** Add organization membership and role checks

3. **STATS Endpoint Exposes All Data**
   - **Impact:** Leaks information across all tenants
   - **Location:** `/home/setup/navidocs/server/routes/stats.js:18-131`
   - **Fix:** Filter by user's organizations

4. **Upload Accepts Arbitrary organizationId**
   - **Impact:** Users can upload to any organization
   - **Location:** `/home/setup/navidocs/server/routes/upload.js:50-64`
   - **Fix:** Validate user belongs to specified organization

5. **Upload Auto-Creates Organizations**
   - **Impact:** Users can create arbitrary organizations
   - **Location:** `/home/setup/navidocs/server/routes/upload.js:94-102`
   - **Fix:** Remove auto-creation, require pre-existing organizations

### 🟡 High (Should Fix Soon)

6. **No Audit Logging**
   - **Impact:** Cannot track unauthorized access attempts
   - **Fix:** Add audit logging to sensitive operations

7. **Missing Rate Limiting on Image Endpoints**
   - **Impact:** Potential DoS via image requests
   - **Location:** Image endpoints have rate limiting but should be stricter
   - **Fix:** Review and tighten rate limits

### 🟢 Low (Recommended)

8. **Entity/Component Organization Consistency**
   - **Impact:** Could reference entities from other organizations
   - **Location:** Document retrieval endpoints
   - **Fix:** Add validation that entity/component belongs to same org as document

---

## Recommended Security Fixes

### Priority 1: Add Authentication Middleware

**File:** `/home/setup/navidocs/server/index.js`

```javascript
import { authenticateToken } from './middleware/auth.middleware.js';

// Protect all document-related routes
app.use('/api/upload', authenticateToken, uploadRoutes);
app.use('/api/documents', authenticateToken, documentsRoutes);
app.use('/api/stats', authenticateToken, statsRoutes);
app.use('/api/search', authenticateToken, searchRoutes);
app.use('/api', authenticateToken, imagesRoutes);
app.use('/api', authenticateToken, tocRoutes);
app.use('/api/jobs', authenticateToken, jobsRoutes);
```

### Priority 2: Fix DELETE Endpoint

**File:** `/home/setup/navidocs/server/routes/documents.js`

Add the access control check from the "Recommended Fix" section above (lines 354-414).

### Priority 3: Fix STATS Endpoint

**File:** `/home/setup/navidocs/server/routes/stats.js`

Add organization filtering to all queries as shown in the "Recommended Fix" section.

### Priority 4: Fix Upload Validation

**File:** `/home/setup/navidocs/server/routes/upload.js`

```javascript
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  const { organizationId } = req.body;
  const userId = req.user.id; // No fallback after authentication middleware

  // ✅ Validate user belongs to organization
  const membership = db.prepare(`
    SELECT role FROM user_organizations
    WHERE user_id = ? AND organization_id = ?
  `).get(userId, organizationId);

  if (!membership) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You are not a member of this organization'
    });
  }

  // ✅ Remove auto-creation logic (lines 94-102)
  const existingOrg = db.prepare('SELECT id FROM organizations WHERE id = ?').get(organizationId);
  if (!existingOrg) {
    return res.status(400).json({
      error: 'Invalid organization',
      message: 'Organization does not exist'
    });
  }

  // Continue with upload...
});
```

### Priority 5: Add Audit Logging

Create audit log entries for:
- Document deletions
- Failed access attempts
- Organization membership changes
- Document sharing

### Priority 6: Remove Fallback Test User IDs

Search codebase and remove all instances of:
```javascript
const userId = req.user?.id || 'test-user-id';
```

Replace with:
```javascript
const userId = req.user.id; // Will exist after authenticateToken middleware
```

---

## Positive Findings

### ✅ Well-Implemented Security Features

1. **Document List Query (GET /api/documents)**
   - Excellent use of INNER JOIN on user_organizations
   - Properly scoped to user's organizations
   - Parameterized queries prevent SQL injection

2. **Search Token Generation**
   - Proper tenant token generation with organization scoping
   - Configurable expiration with sensible max (24h)
   - Fallback mechanism for compatibility

3. **Access Control Helper (images.js)**
   - Reusable verifyDocumentAccess function
   - Checks organization membership, ownership, and shares
   - Consistent across all image endpoints

4. **Path Traversal Protection (images.js)**
   - Validates file paths stay within upload directory
   - Uses path normalization for security
   - Logs security violations

5. **Database Schema Design**
   - organization_id is NOT NULL and properly indexed
   - Foreign key cascades for data integrity
   - User-organization many-to-many with roles
   - Document shares table for granular access

6. **SQL Injection Protection**
   - All queries use parameterized statements
   - No string concatenation in SQL queries

---

## Testing Checklist

Use this checklist to verify tenant isolation after fixes are applied:

### Authentication Tests
- [ ] Verify all endpoints reject requests without valid JWT
- [ ] Verify expired tokens are rejected
- [ ] Verify invalid tokens are rejected
- [ ] Verify test-user-id fallback is removed

### Document Upload Tests
- [ ] User can upload to their own organization
- [ ] User CANNOT upload to organization they don't belong to
- [ ] Upload with non-existent organizationId returns 400
- [ ] Upload does NOT auto-create organizations

### Document Access Tests
- [ ] User can list only documents from their organizations
- [ ] User CANNOT access documents from other organizations
- [ ] Multi-org user sees documents from all their organizations
- [ ] User can access shared documents
- [ ] User CANNOT access documents not shared with them

### Document Deletion Tests
- [ ] Admin can delete documents in their organization
- [ ] Manager can delete documents in their organization
- [ ] Member CANNOT delete documents
- [ ] User CANNOT delete documents from other organizations
- [ ] Deletion logs audit event with user context

### Search Tests
- [ ] Search results only include documents from user's organizations
- [ ] Tenant token filters correctly by organizationId
- [ ] Multi-org user gets results from all their organizations
- [ ] User CANNOT search documents from other organizations

### Stats Tests
- [ ] Stats show only data from user's organizations
- [ ] Multi-org user sees combined stats
- [ ] System admin sees system-wide stats (if applicable)

### Image Access Tests
- [ ] User can access images from their documents
- [ ] User CANNOT access images from other organization's documents
- [ ] Path traversal attempts are blocked and logged

---

## Conclusion

NaviDocs has a well-designed multi-tenancy database schema and several properly implemented endpoints (document listing, search token generation, image access control). However, **critical vulnerabilities exist** that allow unauthorized access and data manipulation:

1. **No authentication enforcement** on any routes
2. **DELETE endpoint completely unprotected**
3. **STATS endpoint exposes all tenant data**
4. **Upload endpoint accepts arbitrary organizationIds**

**Immediate Action Required:**
1. Deploy authentication middleware on all routes
2. Fix DELETE endpoint access control
3. Fix STATS endpoint organization filtering
4. Fix upload organizationId validation
5. Remove test-user-id fallbacks

Once these fixes are implemented, NaviDocs will have **strong multi-tenancy isolation** that ensures single-boat tenants like Liliane1 can only access their own documents.

---

## References

- Database Schema: `/home/setup/navidocs/server/db/schema.sql`
- Documents Routes: `/home/setup/navidocs/server/routes/documents.js`
- Upload Routes: `/home/setup/navidocs/server/routes/upload.js`
- Search Routes: `/home/setup/navidocs/server/routes/search.js`
- Images Routes: `/home/setup/navidocs/server/routes/images.js`
- Stats Routes: `/home/setup/navidocs/server/routes/stats.js`
- Auth Middleware: `/home/setup/navidocs/server/middleware/auth.middleware.js`
- Meilisearch Config: `/home/setup/navidocs/server/config/meilisearch.js`
- Server Entry: `/home/setup/navidocs/server/index.js`
