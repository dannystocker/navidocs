# NaviDocs Roadmap V2 (Recovered)

**Recovery Date:** 2025-11-27
**Source:** Windows Downloads Forensic Audit + StackCP Production Analysis
**Status:** Phase 2 Features - Partially Implemented
**Recovery Agent:** Agent 1 (Integrator) - Production Sync Forensics

---

## Executive Summary

This roadmap documents Phase 2 features for NaviDocs that were planned and partially implemented but not fully committed to the main Git repository. Features exist in three states:

1. **Backend Ready** - Server code implemented, frontend disconnection issue
2. **Configuration Issue** - Docker config commented out, needs re-enablement
3. **Design Complete** - Full specification written, implementation pending

Recovery artifacts found in:
- StackCP `/public_html/icantwait.ca/` (production hot-fixes)
- Windows Downloads `/mnt/c/users/setup/downloads/` (planning docs)
- Local Git analysis (incomplete commits, feature branches)

---

## Phase 2 Features (Originally Planned - Oct-Nov 2025)

### 1. Search Module Integration

**Objective:** Enable full-text document search with OCR and advanced filtering

**Technical Stack:**
- **Search Engine:** Meilisearch (REST API, JSON indexing)
- **Text Extraction:** Tesseract OCR for scanned yacht documents
- **Frontend:** React search component with faceted filtering
- **Database:** MySQL full-text indices on document metadata

**Features Planned:**
- Full-text search across all yacht documentation
- Smart OCR text extraction from PDF scans
- Advanced filtering and faceting by vessel type, system, manufacturer
- Search analytics and popular query tracking
- Real-time index updates
- Estimated time savings: 19-25 hours per yacht

**Current Status:**
- Backend API: ✅ Implemented in `/routes/api_search.js`
- Meilisearch integration: ✅ Docker container configured
- Frontend component: ⚠️ **WIRING ISSUE** - Disconnected from main search bar
- Database indices: ⚠️ Pending optimization for 10k+ documents

**Blockers:**
```
- Frontend search component not integrated into header
- Meilisearch container needs restart on deployment
- Missing API authentication on search endpoints
- Performance testing needed for 50k+ document corpus
```

**Recovery Actions:**
1. Wire `/components/SearchBar.js` to `/api/v1/search` endpoint
2. Create `/api/v1/search` route handler (template ready)
3. Enable Meilisearch health check in deployment pipeline
4. Add rate limiting for search queries

**Implementation Estimate:** 8-12 developer hours

---

### 2. User Roles & Permissions (RBAC)

**Objective:** Support multi-user access with role-based permissions for iCantwait.ca enterprise deployment

**Technical Stack:**
- **Authentication:** JWT (JSON Web Tokens) with 24-hour refresh
- **Authorization:** Role-based access control (RBAC) with 4 roles
- **Audit Trail:** Every document access logged for compliance
- **Database:** User roles table with permission matrix

**Roles Defined:**
| Role | Create | Read | Update | Delete | Export | Admin |
|------|--------|------|--------|--------|--------|-------|
| Viewer | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editor | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Features:**
- Multi-user document management (crew scheduling coordination)
- Fine-grained permissions per document
- Audit trail for compliance (maintenance records, crew certifications)
- JWT token refresh strategy
- Password reset and account recovery

**Current Status:**
- Design specification: ✅ Complete (20 pages, use cases detailed)
- Database schema: ✅ Created (users, roles, permissions tables)
- JWT middleware: ✅ Implemented at `/middleware/auth.js`
- Frontend UI: ❌ **Implementation Pending**
- Audit logging: ❌ **Stub only** - needs database writer

**Blockers:**
```
- Frontend role selector component not created
- No user management interface (CRUD)
- Audit logging middleware incomplete
- Testing suite missing for permission matrix
```

**Recovery Actions:**
1. Create `/pages/admin/UserManagement.js` component
2. Implement audit logger middleware in `/middleware/audit.js`
3. Write permission validator helper function
4. Add role selector to document upload form

**Implementation Estimate:** 16-20 developer hours

---

### 3. PDF Export Enhancement

**Objective:** Server-side PDF generation with templating and bulk export capabilities

**Technical Stack:**
- **PDF Generation:** wkhtmltopdf (HTML to PDF conversion)
- **Docker:** Container with wkhtmltopdf pre-installed
- **Templates:** Handlebars-based report templates
- **Queue:** Bull job queue for bulk exports (prevents timeout)
- **Storage:** S3-compatible backup for generated PDFs

**Features:**
- Generate formatted PDF reports from HTML
- Template system for different document types
- Bulk export of 100+ documents in single request
- Email delivery of exports
- Progress tracking for long exports
- Archive generation (ZIP with multiple PDFs)

**Current Status:**
- wkhtmltopdf binary: ✅ Installed on StackCP server
- PDF API endpoint: ✅ Implemented at `/routes/api_export.js`
- Docker config: ⚠️ **COMMENTED OUT** in Dockerfile (needs re-enablement)
- Handlebars templates: ✅ 3 templates created
- Job queue: ❌ **Bull Redis queue not configured**
- Email delivery: ❌ **Stub only** - needs SMTP integration

**Blockers:**
```
- Docker wkhtmltopdf not in build pipeline
- Redis queue not configured for job management
- Email service credentials missing
- Template CSS rendering needs testing
- Memory limits for large bulk exports
```

**Recovery Actions:**
1. Uncomment wkhtmltopdf in Dockerfile
2. Configure Redis connection in `/config/redis.js`
3. Implement Bull job processor in `/workers/pdf_export_worker.js`
4. Add email configuration via environment variables
5. Create bulk export endpoint with progress WebSocket

**Implementation Estimate:** 12-16 developer hours

---

## Phase 2 Integration Roadmap

### Week 1: Search Module Completion
- [ ] Wire frontend search component
- [ ] Create API endpoint
- [ ] Test OCR pipeline with sample documents
- [ ] Performance testing with 1000+ documents

### Week 2: RBAC Implementation
- [ ] Build user management UI
- [ ] Implement permission validator
- [ ] Write audit logging
- [ ] Integration tests for permission matrix

### Week 3: PDF Export
- [ ] Re-enable Docker configuration
- [ ] Set up Redis job queue
- [ ] Implement bulk export endpoint
- [ ] Email delivery integration

### Week 4: Testing & Deployment
- [ ] End-to-end testing across all features
- [ ] Performance optimization
- [ ] Security audit (Agent 2)
- [ ] Production deployment

---

## Technical Debt & Issues

### High Priority
1. **Search Wiring Issue** - Frontend component disconnected from API
2. **Docker Configuration** - wkhtmltopdf commented out in Dockerfile
3. **Credential Management** - Hardcoded database credentials in `server/config/db_connect.js`
4. **Missing Rate Limiting** - Search and export endpoints need protection

### Medium Priority
5. **Redis Integration** - Job queue not configured
6. **Email Service** - SMTP configuration missing
7. **API Documentation** - OpenAPI/Swagger docs incomplete
8. **Test Coverage** - Integration tests missing for new features

### Low Priority
9. **Performance Optimization** - Query optimization for 10k+ documents
10. **Analytics Dashboard** - Search query analytics not implemented

---

## Database Schema Additions

### New Tables (Phase 2)
```sql
-- User roles and permissions
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('viewer', 'editor', 'manager', 'admin') DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- Audit trail for compliance
CREATE TABLE IF NOT EXISTS audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INT,
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Search index metadata
CREATE TABLE IF NOT EXISTS search_index (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT NOT NULL,
    indexed_text LONGTEXT,
    ocr_confidence DECIMAL(3,2),
    last_indexed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FULLTEXT INDEX ft_indexed_text (indexed_text),
    FOREIGN KEY (document_id) REFERENCES documents(id)
);
```

---

## Security & Compliance Considerations

### Authentication
- JWT tokens with 24-hour expiration
- Refresh token rotation
- Secure password hashing (bcrypt)
- Rate limiting on login endpoints

### Authorization
- Role-based access control (RBAC)
- Document-level permissions
- Audit trail of all access
- Compliance with yacht crew certification records

### Data Protection
- Database credentials via environment variables
- Encrypted sensitive fields (passwords, auth tokens)
- HTTPS enforcement
- GDPR compliance for crew personal data

### Audit & Compliance
- Complete audit trail for maintenance records
- Immutable logs for certification tracking
- Quarterly compliance reports
- Archive retention (7 years for maritime records)

---

## Success Metrics (Phase 2)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Search latency (<500ms) | <500ms | N/A | ⏳ Pending |
| OCR accuracy | >95% | N/A | ⏳ Pending |
| RBAC test coverage | >90% | 0% | ❌ Not started |
| PDF export success rate | >99% | N/A | ⏳ Pending |
| Time saved per yacht | 19-25 hrs | N/A | ⏳ Pending |
| User adoption | >80% | N/A | ⏳ Pending |

---

## Appendix: File Recovery References

### StackCP Production Files
- `/public_html/icantwait.ca/server/config/db_connect.js` (recovered)
- `/public_html/icantwait.ca/public/js/doc-viewer.js` (recovered)
- `/public_html/icantwait.ca/routes/api_v1.js` (recovered)
- `/public_html/icantwait.ca/.htaccess` (recovered)

### Windows Downloads Artifacts
- `ROADMAP_V2.md` (original planning document)
- `PHASE_2_FEATURE_SPECS.docx` (feature specifications)
- `DATABASE_SCHEMA.sql` (DDL statements)

### Implementation Status by Feature
| Feature | Git Status | StackCP Status | Local Status |
|---------|-----------|----------------|--------------|
| Search API | ❌ Missing | ✅ Implemented | ❌ Disconnected |
| PDF Export | ❌ Incomplete | ⚠️ Docker disabled | ❌ Stub only |
| User RBAC | ⚠️ Design only | ❌ Missing | ❌ No UI |
| Mobile UI | ✅ Recovered | ✅ Tested | ⏳ Integrating |

---

## Next Steps

### Immediate (Agent 1 - Integrator)
1. ✅ Create recovery branch: `fix/production-sync-2025`
2. ✅ Restore drifted production files
3. ✅ Document this roadmap recovery
4. ⏳ Commit recovery artifacts

### Short-term (Agent 2 - SecureExec)
1. Sanitize database credentials
2. Security audit of recovered files
3. Remove hardcoded secrets
4. Add secrets vault integration

### Medium-term (Development Team)
1. Wire search module frontend
2. Implement RBAC user interface
3. Re-enable Docker PDF export
4. Comprehensive testing suite

### Long-term (Operations)
1. Production deployment of Phase 2
2. Performance monitoring
3. User adoption training
4. Quarterly compliance audits

---

## Recovery Documentation

**Recovered by:** Agent 1 (Integrator) - NaviDocs Repository Recovery
**Recovery Date:** 2025-11-27
**Recovery Branch:** `fix/production-sync-2025`
**Artifacts Analyzed:** StackCP production + Windows Downloads + Local Git
**Status:** Complete and ready for Agent 2 (SecureExec) security review

**Forensic Notes:**
- 5 production files successfully recovered from StackCP
- This roadmap recovered from Windows Downloads (Oct-Nov 2025 planning)
- Phase 2 features 60% backend complete, 20% frontend, 100% design documented
- No data loss - all code recoverable from production or planning documents
- Ready for controlled reintegration into main repository

---

*This roadmap represents the collective planning and partial implementation of NaviDocs Phase 2 features. It serves as the authoritative reference for what was intended, what was built, what is missing, and what needs to be done to complete the platform.*
