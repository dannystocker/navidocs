# Disappearing Documents Bug Report
**Date:** 2025-10-23
**Priority:** HIGH
**Status:** Investigation Complete

---

## Executive Summary

After thorough investigation of the NaviDocs backend codebase, **NO CRITICAL BUGS** were found that would cause documents to systematically disappear. However, several potential issues and areas of concern were identified that could lead to data loss under specific circumstances.

---

## Investigation Findings

### 1. Database Configuration - LOW RISK
**Location:** `/home/setup/navidocs/server/db/db.js` and `/home/setup/navidocs/server/config/db.js`

**Finding:** Database is correctly configured with:
- WAL mode enabled (`journal_mode = WAL`) - Good for concurrency
- Foreign keys enabled (`foreign_keys = ON`)
- Proper CASCADE and SET NULL rules on foreign keys

**Status:** ✅ NO ISSUES FOUND

---

### 2. Document Status Transitions - MEDIUM RISK
**Locations:**
- `/home/setup/navidocs/server/routes/upload.js` (Line 140)
- `/home/setup/navidocs/server/workers/ocr-worker.js` (Lines 332-391)

**Issue Found:** Documents can get stuck in "processing" or "failed" state

**Flow:**
1. Document uploaded → status set to `'processing'` (upload.js:140)
2. OCR job processes document → status should become `'indexed'` (ocr-worker.js:334)
3. **IF OCR FAILS** → status becomes `'failed'` (ocr-worker.js:388)

**Problem Scenarios:**
- If the OCR worker crashes mid-processing, documents remain in "processing" state forever
- Failed documents (status='failed') are not retried automatically
- No timeout mechanism to mark hung jobs as failed
- Users may think documents with status='failed' are "missing" when they're actually just failed

**Code Evidence:**
```javascript
// upload.js:140 - Initial status
status: 'processing'

// ocr-worker.js:385-391 - Failure handling
db.prepare(`
  UPDATE documents
  SET status = 'failed',
      updated_at = ?
  WHERE id = ?
`).run(now, documentId);
```

**Risk Level:** MEDIUM - Documents don't disappear but become invisible if queries filter by status

---

### 3. Hard Delete Endpoint - HIGH RISK
**Location:** `/home/setup/navidocs/server/routes/documents.js` (Lines 350-414)

**Issue Found:** DELETE endpoint performs hard deletion (no soft delete)

**What It Does:**
1. Deletes from Meilisearch index (line 375)
2. Deletes from database with CASCADE (line 383-384)
3. Deletes entire document folder from filesystem (line 392)

**Code:**
```javascript
router.delete('/:id', async (req, res) => {
  // ... authentication checks ...

  // Delete from Meilisearch
  await index.deleteDocuments({ filter });

  // Delete from database (CASCADE deletes pages, jobs, etc)
  db.prepare('DELETE FROM documents WHERE id = ?').run(id);

  // Delete from filesystem
  await rm(docFolder, { recursive: true, force: true });
});
```

**Concerns:**
1. **No authentication/authorization checks** - Anyone with the endpoint can delete (TODO comment on line 352: "simplified permissions")
2. **No soft delete** - No recovery possible after deletion
3. **No confirmation required** - Single API call deletes everything
4. **Continues on Meilisearch failure** - Comment on line 379: "Continue with deletion even if search cleanup fails"

**Risk Level:** HIGH - If endpoint is called (intentionally or accidentally), documents are permanently deleted

---

### 4. Cleanup Scripts - CRITICAL RISK
**Locations:**
- `/home/setup/navidocs/server/scripts/clean-duplicates.js`
- `/home/setup/navidocs/server/scripts/keep-last-n.js`

**Issue Found:** Manual cleanup scripts exist that delete documents in bulk

**clean-duplicates.js:**
- Finds documents with duplicate titles
- Keeps newest, deletes older ones
- No confirmation prompt before deletion
- Deletes from DB, filesystem, and Meilisearch

**keep-last-n.js:**
- Keeps only N most recent documents (default N=2)
- Deletes ALL others
- Takes command line argument: `node keep-last-n.js 5`

**Code Evidence:**
```javascript
// keep-last-n.js:20
const KEEP_COUNT = parseInt(process.argv[2]) || 2;

// keep-last-n.js:77
const deleteStmt = db.prepare(`DELETE FROM documents WHERE id = ?`);
```

**CRITICAL CONCERN:** If someone accidentally runs:
```bash
node scripts/keep-last-n.js
```
Without arguments, it will delete ALL documents except the 2 most recent!

**Risk Level:** CRITICAL - These scripts can delete all user documents

---

### 5. Meilisearch Sync Issues - LOW RISK
**Location:** `/home/setup/navidocs/server/workers/ocr-worker.js` (Lines 168-184)

**Issue Found:** Indexing failures are logged but don't fail the job

**Code:**
```javascript
// Line 180-183
catch (indexError) {
  console.error(`[OCR Worker] Failed to index page ${pageNumber}:`, indexError.message);
  // Continue processing other pages even if indexing fails
}
```

**Consequence:**
- Documents complete successfully but pages may be missing from search
- Users search and can't find documents that exist in the database
- Appears like documents are "missing" but they're just not indexed

**Risk Level:** LOW - Documents exist but aren't searchable

---

### 6. CASCADE Deletion Behavior - MEDIUM RISK
**Location:** `/home/setup/navidocs/server/db/schema.sql`

**Foreign Key Rules Found:**
```sql
-- Line 144: Organization deletion cascades to documents
FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE

-- Line 173: Document deletion cascades to pages
FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE

-- Line 193: Document deletion cascades to OCR jobs
FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
```

**Issue:** If an organization is deleted, ALL documents in that organization are deleted

**Code:**
```javascript
// services/organization.service.js:182
db.prepare('DELETE FROM organizations WHERE id = ?').run(organizationId);
```

**Risk Level:** MEDIUM - Single organization deletion cascades to all documents

---

### 7. Duplicate Detection Logic - LOW RISK
**Location:** `/home/setup/navidocs/server/routes/upload.js` (Lines 104-113)

**Finding:** Duplicate check exists but doesn't prevent upload

```javascript
// Lines 105-106
const duplicateCheck = db.prepare(
  'SELECT id, title, file_path FROM documents WHERE file_hash = ? AND organization_id = ? AND status != ?'
).get(fileHash, organizationId, 'deleted');

if (duplicateCheck) {
  // Lines 110-112
  console.log(`Duplicate file detected: ${duplicateCheck.id}, proceeding with new upload`);
}
```

**Issue:** Duplicates are detected but allowed. Note the exclusion of `status != 'deleted'`, suggesting soft delete was planned but not implemented.

**Risk Level:** LOW - Not a bug, but indicates incomplete feature

---

## Root Cause Analysis

### Most Likely Causes of "Disappearing Documents"

1. **Accidental Script Execution** (HIGH PROBABILITY)
   - User/admin runs `node scripts/keep-last-n.js` without arguments
   - Deletes all but 2 most recent documents
   - No undo available

2. **Status Filter Confusion** (MEDIUM PROBABILITY)
   - Documents in 'failed' or 'processing' state
   - UI filters only show 'indexed' documents
   - Users think documents are gone but they're just in wrong state

3. **Organization Deletion** (MEDIUM PROBABILITY)
   - Admin deletes organization
   - CASCADE deletes all documents
   - Users see their documents gone

4. **Manual DELETE API Call** (LOW PROBABILITY)
   - Someone with API access calls DELETE endpoint
   - No authorization checks prevent this
   - Documents permanently deleted

5. **Search Index Out of Sync** (LOW PROBABILITY)
   - Documents exist in database
   - Not indexed in Meilisearch due to indexing errors
   - Users can't find via search, think they're gone

---

## Recommended Fixes

### Priority 1: CRITICAL - Protect Against Bulk Deletion

**Fix 1.1: Add Safety to keep-last-n.js**
```javascript
// scripts/keep-last-n.js
const KEEP_COUNT = parseInt(process.argv[2]);

// Add validation
if (!KEEP_COUNT || KEEP_COUNT < 5) {
  console.error('ERROR: Must specify KEEP_COUNT >= 5');
  console.error('Usage: node keep-last-n.js <number>');
  console.error('Example: node keep-last-n.js 10');
  process.exit(1);
}

// Add confirmation prompt
if (toDelete.length > 0) {
  console.log(`\n⚠️  WARNING: About to delete ${toDelete.length} documents`);
  console.log('This action cannot be undone!');
  console.log('Type "DELETE" to confirm: ');

  // Add readline confirmation here
}
```

**Fix 1.2: Add Confirmation to clean-duplicates.js**
```javascript
// scripts/clean-duplicates.js
if (documentsToDelete.length > 0) {
  console.log(`\n⚠️  WARNING: About to delete ${documentsToDelete.length} documents`);
  console.log('Type "CONFIRM" to proceed: ');

  // Add readline confirmation
}
```

---

### Priority 2: HIGH - Implement Soft Delete

**Fix 2.1: Change DELETE endpoint to soft delete**

**Location:** `/home/setup/navidocs/server/routes/documents.js`

```javascript
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    logger.info(`Soft deleting document ${id}`);

    const db = getDb();

    // Get document info
    const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // ADD AUTHORIZATION CHECK HERE
    const userId = req.user?.id || 'test-user-id';
    // Verify user has permission to delete

    // Soft delete - just update status
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
      UPDATE documents
      SET status = 'deleted',
          updated_at = ?
      WHERE id = ?
    `).run(now, id);

    // Optionally remove from search index
    try {
      const searchClient = getMeilisearchClient();
      const index = await searchClient.getIndex(MEILISEARCH_INDEX_NAME);
      await index.deleteDocuments({ filter: `docId = "${id}"` });
    } catch (err) {
      logger.warn(`Search cleanup failed for ${id}:`, err);
    }

    logger.info(`Document ${id} soft deleted successfully`);

    res.json({
      success: true,
      message: 'Document deleted successfully',
      documentId: id,
      title: document.title
    });

  } catch (error) {
    logger.error(`Failed to delete document ${id}`, error);
    res.status(500).json({
      error: 'Failed to delete document',
      message: error.message
    });
  }
});
```

**Fix 2.2: Add hard delete endpoint for admins only**
```javascript
router.delete('/:id/permanent', requireAdmin, async (req, res) => {
  // Current hard delete logic here
  // Only accessible to system admins
});
```

---

### Priority 3: MEDIUM - Fix Status Transition Issues

**Fix 3.1: Add job timeout mechanism**

**Location:** `/home/setup/navidocs/server/workers/ocr-worker.js`

Add stale job detection:
```javascript
// New function to detect and mark stale jobs
export async function detectStaleJobs() {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const TIMEOUT = 30 * 60; // 30 minutes

  // Find jobs stuck in 'processing' for > 30 minutes
  const staleJobs = db.prepare(`
    SELECT id, document_id
    FROM ocr_jobs
    WHERE status = 'processing'
      AND started_at < ?
  `).all(now - TIMEOUT);

  for (const job of staleJobs) {
    // Mark job as failed
    db.prepare(`
      UPDATE ocr_jobs
      SET status = 'failed',
          error = 'Job timeout - exceeded 30 minutes',
          completed_at = ?
      WHERE id = ?
    `).run(now, job.id);

    // Mark document as failed
    db.prepare(`
      UPDATE documents
      SET status = 'failed',
          updated_at = ?
      WHERE id = ?
    `).run(now, job.document_id);

    console.log(`Marked stale job ${job.id} as failed`);
  }

  return staleJobs.length;
}

// Run every 5 minutes
setInterval(detectStaleJobs, 5 * 60 * 1000);
```

**Fix 3.2: Add retry mechanism for failed jobs**
```javascript
// New endpoint to retry failed documents
router.post('/documents/:id/retry', async (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND status = ?')
    .get(id, 'failed');

  if (!doc) {
    return res.status(404).json({ error: 'No failed document found' });
  }

  // Create new OCR job
  const jobId = uuidv4();
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    INSERT INTO ocr_jobs (id, document_id, status, progress, created_at)
    VALUES (?, ?, 'pending', 0, ?)
  `).run(jobId, id, now);

  // Update document status
  db.prepare(`
    UPDATE documents
    SET status = 'processing', updated_at = ?
    WHERE id = ?
  `).run(now, id);

  // Queue job
  await addOcrJob(id, jobId, {
    filePath: doc.file_path,
    fileName: doc.file_name,
    organizationId: doc.organization_id,
    userId: doc.uploaded_by
  });

  res.json({ success: true, jobId, documentId: id });
});
```

---

### Priority 4: MEDIUM - Add Authorization to DELETE

**Fix 4: Implement proper authorization**

**Location:** `/home/setup/navidocs/server/routes/documents.js`

```javascript
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const db = getDb();
  const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Check authorization
  const isAuthorized = db.prepare(`
    SELECT 1 FROM user_organizations
    WHERE user_id = ? AND organization_id = ?
  `).get(userId, document.organization_id);

  const isUploader = document.uploaded_by === userId;

  if (!isAuthorized && !isUploader) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to delete this document'
    });
  }

  // Proceed with deletion
  // ...
});
```

---

### Priority 5: LOW - Improve Search Index Reliability

**Fix 5: Make indexing failures more visible**

**Location:** `/home/setup/navidocs/server/workers/ocr-worker.js`

```javascript
// Track indexing failures in document metadata
const indexingFailures = [];

for (const pageResult of ocrResults) {
  // ... page processing ...

  if (cleanedText && !error) {
    try {
      await indexDocumentPage({ ... });
    } catch (indexError) {
      console.error(`Failed to index page ${pageNumber}:`, indexError.message);
      indexingFailures.push({
        page: pageNumber,
        error: indexError.message
      });
    }
  }
}

// Update document with indexing status
if (indexingFailures.length > 0) {
  db.prepare(`
    UPDATE documents
    SET status = 'indexed_partial',
        metadata = ?
    WHERE id = ?
  `).run(JSON.stringify({ indexingFailures }), documentId);

  console.warn(`Document ${documentId} indexed with ${indexingFailures.length} failures`);
}
```

---

### Priority 6: LOW - Add Document Recovery

**Fix 6: Create recovery endpoint for soft-deleted documents**

```javascript
// New endpoint
router.post('/documents/:id/restore', requireAuth, async (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND status = ?')
    .get(id, 'deleted');

  if (!doc) {
    return res.status(404).json({ error: 'No deleted document found' });
  }

  // Check authorization
  // ...

  // Restore document
  const now = Math.floor(Date.now() / 1000);
  db.prepare(`
    UPDATE documents
    SET status = 'indexed', updated_at = ?
    WHERE id = ?
  `).run(now, id);

  // Re-index in Meilisearch
  // ...

  res.json({ success: true, documentId: id, message: 'Document restored' });
});
```

---

## Testing Scenarios

### Test 1: Verify Soft Delete
```bash
# Upload document
curl -X POST http://localhost:3001/api/upload \
  -F "file=@test.pdf" \
  -F "title=Test Document" \
  -F "documentType=manual" \
  -F "organizationId=test-org"

# Delete document
curl -X DELETE http://localhost:3001/api/documents/<doc-id>

# Verify status is 'deleted', not removed
sqlite3 db/navidocs.db "SELECT id, status FROM documents WHERE id = '<doc-id>'"
# Should return: <doc-id>|deleted

# Verify file still exists
ls uploads/<doc-id>/
# Should still exist
```

### Test 2: Verify Stale Job Detection
```bash
# Manually create stale job
sqlite3 db/navidocs.db "
  UPDATE ocr_jobs
  SET status = 'processing',
      started_at = strftime('%s', 'now') - 3600
  WHERE id = '<job-id>'
"

# Wait for stale job detector (5 minutes) or call manually
# Verify job marked as failed
sqlite3 db/navidocs.db "SELECT status FROM ocr_jobs WHERE id = '<job-id>'"
# Should return: failed
```

### Test 3: Verify Authorization
```bash
# Try to delete document without auth
curl -X DELETE http://localhost:3001/api/documents/<doc-id>
# Should return: 401 Unauthorized

# Try to delete document from different organization
curl -X DELETE http://localhost:3001/api/documents/<doc-id> \
  -H "Authorization: Bearer <wrong-user-token>"
# Should return: 403 Forbidden
```

### Test 4: Verify Script Safety
```bash
# Try to run keep-last-n without argument
node scripts/keep-last-n.js
# Should return: ERROR message and exit

# Try with small number
node scripts/keep-last-n.js 2
# Should return: ERROR: Must specify KEEP_COUNT >= 5
```

### Test 5: Verify Duplicate Handling
```bash
# Upload same file twice
curl -X POST http://localhost:3001/api/upload \
  -F "file=@test.pdf" \
  -F "title=Test Doc" \
  -F "documentType=manual" \
  -F "organizationId=test-org"

# Upload again
curl -X POST http://localhost:3001/api/upload \
  -F "file=@test.pdf" \
  -F "title=Test Doc 2" \
  -F "documentType=manual" \
  -F "organizationId=test-org"

# Verify both exist
sqlite3 db/navidocs.db "SELECT COUNT(*) FROM documents WHERE file_hash = '<hash>'"
# Should return: 2
```

---

## Monitoring Recommendations

### 1. Add Document Count Metrics
```javascript
// routes/stats.js - Add endpoint
router.get('/document-counts', async (req, res) => {
  const db = getDb();

  const counts = db.prepare(`
    SELECT
      status,
      COUNT(*) as count
    FROM documents
    GROUP BY status
  `).all();

  res.json({
    byStatus: counts,
    total: counts.reduce((sum, c) => sum + c.count, 0)
  });
});
```

### 2. Add Audit Logging for Deletions
```javascript
// Before deletion
await auditLog.log({
  action: 'document.delete',
  userId: req.user.id,
  resourceId: documentId,
  resourceType: 'document',
  metadata: {
    title: document.title,
    organizationId: document.organization_id
  }
});
```

### 3. Set Up Alerts
- Alert if document count drops by >10% in 1 hour
- Alert if >5 documents marked as 'failed' in 1 hour
- Alert if any cleanup script is run in production

---

## Prevention Checklist

- [ ] Implement soft delete (Priority 2)
- [ ] Add confirmation prompts to cleanup scripts (Priority 1)
- [ ] Add authorization checks to DELETE endpoint (Priority 4)
- [ ] Implement stale job detection (Priority 3)
- [ ] Add document restoration endpoint (Priority 6)
- [ ] Add audit logging for deletions
- [ ] Set up monitoring alerts
- [ ] Document recovery procedures
- [ ] Add integration tests for delete scenarios
- [ ] Create backup/restore documentation

---

## Conclusion

The "disappearing documents" bug is most likely caused by:
1. Accidental execution of cleanup scripts without proper safeguards
2. Documents getting stuck in 'failed' or 'processing' states and appearing missing
3. Lack of soft delete causing permanent data loss
4. Missing authorization checks allowing unauthorized deletions

The database configuration and CASCADE rules are working correctly. The primary issues are around operational safety, status management, and lack of recovery mechanisms.

**Immediate Actions:**
1. Add confirmation prompts to cleanup scripts
2. Implement soft delete
3. Add stale job detection
4. Add proper authorization to DELETE endpoint

**Next Steps:**
1. Review production logs for DELETE operations
2. Check for any scheduled cron jobs running cleanup scripts
3. Interview users to understand exact scenarios where documents disappeared
4. Implement monitoring and alerting

---

**Report Prepared By:** Claude Code
**Investigation Date:** 2025-10-23
**Files Analyzed:** 15+ source files
**Lines of Code Reviewed:** ~5,000+
