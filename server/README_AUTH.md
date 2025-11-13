# NaviDocs Authentication & Authorization System
## Complete Documentation Package

---

## What is This?

This is a comprehensive technical design for a **multi-tenancy authentication and authorization system** for NaviDocs, a cross-vertical document management platform.

**Problem Solved:** Agencies need to manage multiple entities (boats, aircraft, properties) with granular user access control.

**Solution:** JWT-based authentication + RBAC with entity-level permissions, supporting all verticals with a single, unified system.

---

## Documentation Structure

### 🚀 Start Here

**New to the Project?** → [AUTH_QUICK_START.md](./AUTH_QUICK_START.md)
- 5-minute developer guide
- Code examples
- Common patterns
- Quick reference tables

### 📋 Executive Summary

**For Stakeholders** → [AUTH_SYSTEM_SUMMARY.md](./AUTH_SYSTEM_SUMMARY.md)
- Problem statement
- Solution overview
- Implementation roadmap (5 weeks, 16 PRs)
- Success criteria
- Risk assessment
- Cost analysis

### 🏗️ Technical Design

**For Architects** → [DESIGN_AUTH_MULTITENANCY.md](./DESIGN_AUTH_MULTITENANCY.md)
- 3 architectural approaches analyzed
- Recommended solution (JWT + RBAC)
- Database schema changes (4 new tables)
- Authentication & authorization flows
- Security considerations
- Performance optimizations
- Migration strategy
- Pros/cons comparison

### 📐 Architecture Diagrams

**For Visual Learners** → [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)
- High-level system architecture
- Authentication flow diagrams
- Authorization resolution flow
- Permission hierarchy
- Multi-tenancy model
- Security layers
- Scalability considerations

### ✅ Implementation Tasks

**For Developers** → [IMPLEMENTATION_TASKS.md](./IMPLEMENTATION_TASKS.md)
- 16 PRs broken down by phase
- Detailed acceptance criteria
- Code interfaces and contracts
- Testing requirements
- File structure
- Estimated effort per task

---

## Quick Facts

| Aspect | Details |
|--------|---------|
| **Auth Type** | JWT (JSON Web Tokens) - Stateless |
| **Authorization** | RBAC (Role-Based Access Control) with entity-level granularity |
| **Database** | SQLite (designed for PostgreSQL migration) |
| **Password Security** | bcrypt with cost factor 12 |
| **Token Expiry** | Access: 15 minutes, Refresh: 7 days |
| **Permission Levels** | Viewer, Editor, Manager, Admin |
| **Organization Roles** | Viewer, Member, Manager, Admin |
| **Cache** | LRU cache, 5-minute TTL, 10,000 entries |
| **Implementation Time** | 5 weeks, 16 PRs |
| **Test Coverage Target** | >90% |

---

## Key Features

✅ **User Authentication**
- Registration with email verification
- Login with email/password
- JWT access tokens (15min)
- Refresh tokens (7 days, revocable)
- Password reset flow
- Account suspension

✅ **Multi-Tenancy**
- Organizations contain multiple entities
- Users belong to multiple organizations
- Cross-vertical support (boats, aircraft, marinas, etc.)
- Granular entity-level permissions

✅ **Authorization**
- 3-tier hierarchy: Organization → Entity → Resource
- 4 permission levels with inheritance
- Explicit grant model (secure by default)
- Permission caching for performance

✅ **Security**
- bcrypt password hashing
- JWT signature verification
- Rate limiting on auth endpoints
- Audit logging for all events
- CSRF and XSS protection
- Session revocation

✅ **Scalability**
- Stateless JWT (horizontal scaling)
- LRU cache (10x faster permission checks)
- Database indexes for common queries
- Designed for 10,000+ users

---

## Example Use Case

**Scenario:** Coastal Marine Services manages 3 boats

**Users:**
- Alice (Organization Admin)
- Bob (Organization Manager)
- Carol (Organization Member)
- Dave (Organization Viewer)

**Access Control:**

```
┌──────────┬───────────┬────────────┬────────────┬────────────┐
│ User     │ Org Role  │ Boat 1     │ Boat 2     │ Boat 3     │
├──────────┼───────────┼────────────┼────────────┼────────────┤
│ Alice    │ Admin     │ Admin (org)│ Admin (org)│ Admin (org)│
│ Bob      │ Manager   │ Manager    │ Manager    │ Manager    │
│ Carol    │ Member    │ Editor*    │ No Access  │ Viewer*    │
│ Dave     │ Viewer    │ Viewer     │ Viewer     │ Viewer     │
└──────────┴───────────┴────────────┴────────────┴────────────┘
                         * = Explicit grant required
```

**Result:**
- Alice: Full control of all boats
- Bob: Can manage all boats, cannot change org settings
- Carol: Can edit Boat 1, view Boat 3, no access to Boat 2
- Dave: Can view all boats, cannot make changes

---

## API Endpoints (Summary)

### Authentication (8 endpoints)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/verify-email/:token
GET    /api/auth/me
```

### Organizations (8 endpoints)
```
GET    /api/organizations
POST   /api/organizations
GET    /api/organizations/:id
PATCH  /api/organizations/:id
DELETE /api/organizations/:id
GET    /api/organizations/:id/members
POST   /api/organizations/:id/members
DELETE /api/organizations/:id/members/:userId
```

### Entity Permissions (4 endpoints)
```
GET    /api/entities/:id/permissions
POST   /api/entities/:id/permissions
PATCH  /api/entities/:id/permissions/:userId
DELETE /api/entities/:id/permissions/:userId
```

**See full API documentation in individual files.**

---

## Database Schema Changes

### New Tables (4)

1. **entity_permissions**
   - Granular entity-level access control
   - Fields: user_id, entity_id, permission_level, granted_by, expires_at
   - Indexes: user_id, entity_id, expires_at

2. **refresh_tokens**
   - Secure session management
   - Fields: user_id, token_hash, device_info, expires_at, revoked
   - Indexes: user_id, expires_at, revoked

3. **password_reset_tokens**
   - Password recovery workflow
   - Fields: user_id, token_hash, expires_at, used
   - Indexes: user_id, expires_at

4. **audit_log**
   - Security event tracking
   - Fields: user_id, event_type, resource_type, status, ip_address, metadata
   - Indexes: user_id, event_type, created_at, status

### Modified Tables (1)

**users**
- Add: email_verified, email_verification_token, email_verification_expires
- Add: status (active/suspended/deleted), suspended_at, suspended_reason

**Total Impact:** 4 new tables, 5 new indexes, 1 table modification (backward compatible)

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- Database schema migration
- Authentication service (register, login, refresh)
- Authentication routes
- Enhanced auth middleware
- Audit logging

**Deliverables:** 5 PRs

### Phase 2: Authorization (Week 2)
- Authorization service (permission resolution)
- Permission middleware
- Apply auth to existing routes
- Entity permission management

**Deliverables:** 4 PRs

### Phase 3: User & Org Management (Week 3)
- User management endpoints
- Organization CRUD
- Member management
- Email verification & password reset

**Deliverables:** 3 PRs

### Phase 4: Security Hardening (Week 4)
- Rate limiting enhancements
- Brute force protection
- Password strength validation
- Cross-vertical testing

**Deliverables:** 2 PRs

### Phase 5: Documentation & Deployment (Week 5)
- API documentation (OpenAPI/Swagger)
- Migration scripts
- Deployment guide
- Rollback procedures

**Deliverables:** 2 PRs

**Total:** 5 weeks, 16 PRs

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js 20+ | JavaScript runtime |
| Framework | Express 5.0 | Web framework |
| Database | SQLite → PostgreSQL | Data storage |
| Auth | JWT (jsonwebtoken) | Stateless tokens |
| Password | bcrypt | Secure hashing |
| Search | Meilisearch | Full-text search |
| Queue | BullMQ + Redis | Background jobs |
| Cache | lru-cache | Permission cache |
| Security | Helmet.js | HTTP headers |
| Rate Limit | express-rate-limit | DDoS protection |

---

## Security Highlights

✅ Password hashing (bcrypt, cost=12)
✅ JWT signature verification
✅ Token expiry enforcement
✅ Refresh token rotation
✅ Rate limiting (5 req/15min for auth)
✅ Audit logging (all security events)
✅ Account suspension capability
✅ HTTPS required (production)
✅ CORS policy enforcement
✅ Input validation and sanitization
✅ SQL injection prevention (prepared statements)
✅ XSS protection (Helmet.js CSP)

---

## Performance Optimizations

1. **LRU Cache** - Permission checks cached (10x faster)
2. **Database Indexes** - Strategic indexes on hot queries
3. **Prepared Statements** - SQLite default (prevents SQL injection)
4. **Stateless JWT** - No database lookup per request
5. **Batch Queries** - Fetch all user entities at once

**Expected Performance:**
- Login: <100ms
- Permission check (cached): <5ms
- Permission check (uncached): <50ms
- Token refresh: <50ms

---

## Testing Strategy

### Unit Tests
- Target: >90% code coverage
- All service methods
- All middleware
- Edge cases and errors

### Integration Tests
- End-to-end auth flows
- Multi-user scenarios
- Cross-vertical compatibility
- Permission resolution

### Security Tests
- SQL injection attempts
- JWT tampering
- Brute force simulation
- CSRF attacks

### Performance Tests
- 1000 concurrent logins
- 10,000 permission checks/sec
- Database query benchmarks
- Cache hit rate

---

## Migration Strategy

### Zero Downtime Deployment

1. **Backup** existing database
2. **Run migration** (adds new tables, doesn't modify existing)
3. **Deploy backend** (new routes don't affect old ones)
4. **Test** auth endpoints
5. **Deploy frontend** (users start using new auth)
6. **Monitor** for 24 hours

**Rollback:** Migration includes down script to revert all changes

---

## Success Criteria

✅ User can register and login
✅ Access token expires and can be refreshed
✅ User can reset forgotten password
✅ User can verify email address
✅ Org admin can invite users
✅ Org admin can grant entity access
✅ Permission levels work correctly
✅ Unauthorized access returns 403
✅ All security events logged
✅ Works across all verticals
✅ Migration completes without data loss
✅ All tests pass (>90% coverage)
✅ API documentation complete
✅ Performance benchmarks met

---

## Comparison of Approaches

### ✅ Approach 1: JWT + RBAC (RECOMMENDED)
**Pros:** Stateless, scalable, industry standard, minimal DB changes
**Cons:** Cannot revoke JWTs (mitigated by refresh tokens)

### Approach 2: Session + ABAC
**Pros:** Instant revocation, very flexible policies
**Cons:** Requires Redis, complex, not stateless, overkill

### Approach 3: OAuth2 + External IDP
**Pros:** Offload auth, enterprise features
**Cons:** Vendor lock-in, cost, external dependency

**Decision:** Approach 1 provides the best balance for NaviDocs.

---

## Future Roadmap

### Short Term (3-6 months)
- Email service integration (SendGrid/SES)
- Two-factor authentication (TOTP)
- Social login (Google, Microsoft)
- Mobile app support (OAuth2 PKCE)

### Medium Term (6-12 months)
- SSO integration (SAML, OIDC)
- API key management
- Webhook security
- Advanced audit analytics

### Long Term (12+ months)
- ML-based anomaly detection
- Passwordless auth (WebAuthn)
- Zero-trust architecture
- Multi-region token replication

---

## FAQ

**Q: Why JWT instead of sessions?**
A: Stateless JWT enables horizontal scaling without shared session store. Short expiry + refresh tokens mitigate revocation issue.

**Q: Can users belong to multiple organizations?**
A: Yes. The `user_organizations` table is a many-to-many relationship.

**Q: How do I revoke a user's access immediately?**
A: Set user status to 'suspended' or revoke all their refresh tokens. Access tokens expire in 15 minutes.

**Q: How does this work across different verticals (boats, aircraft, etc.)?**
A: The system is vertical-agnostic. The `entity_type` field differentiates, but all logic is identical.

**Q: What happens to existing data during migration?**
A: Migration creates new tables without modifying existing ones. Existing users get personal organizations and admin permissions on their entities.

**Q: Can I skip email verification in development?**
A: Yes. Set `email_verified = 1` manually in the database for testing.

**Q: How do I test permission checks?**
A: Use the test database fixture in `/test/helpers.js` to set up users, orgs, and permissions.

**Q: What if I need time-based permissions (e.g., access expires)?**
A: Use the `expires_at` field in `entity_permissions`. Null = never expires.

---

## Getting Started

### For Stakeholders:
1. Read [AUTH_SYSTEM_SUMMARY.md](./AUTH_SYSTEM_SUMMARY.md) for overview
2. Review implementation roadmap (5 weeks, 16 PRs)
3. Approve design and allocate resources

### For Architects:
1. Read [DESIGN_AUTH_MULTITENANCY.md](./DESIGN_AUTH_MULTITENANCY.md) for technical details
2. Review [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) for visual reference
3. Validate against system requirements

### For Developers:
1. Read [AUTH_QUICK_START.md](./AUTH_QUICK_START.md) for code examples
2. Review [IMPLEMENTATION_TASKS.md](./IMPLEMENTATION_TASKS.md) for task breakdown
3. Start with Phase 1, PR 1 (database migration)

### For QA:
1. Review acceptance criteria in [IMPLEMENTATION_TASKS.md](./IMPLEMENTATION_TASKS.md)
2. Prepare test plans for each PR
3. Focus on security testing (SQL injection, JWT tampering, etc.)

---

## Document Index

| Document | Size | Audience | Purpose |
|----------|------|----------|---------|
| **README_AUTH.md** | 10 pages | Everyone | Entry point, overview |
| **AUTH_QUICK_START.md** | 15 pages | Developers | Code examples, patterns |
| **AUTH_SYSTEM_SUMMARY.md** | 20 pages | Stakeholders | Executive summary |
| **DESIGN_AUTH_MULTITENANCY.md** | 50 pages | Architects | Full technical design |
| **IMPLEMENTATION_TASKS.md** | 40 pages | Developers | Task breakdown, interfaces |
| **ARCHITECTURE_DIAGRAM.md** | 25 pages | Visual learners | Diagrams, flows |

**Total Documentation:** ~160 pages

---

## Support & Contact

**Documentation Issues:** Open a GitHub issue with label `documentation`
**Implementation Questions:** Consult [AUTH_QUICK_START.md](./AUTH_QUICK_START.md) first
**Design Clarifications:** Refer to [DESIGN_AUTH_MULTITENANCY.md](./DESIGN_AUTH_MULTITENANCY.md)
**Code Examples:** See `/test/` directory for comprehensive examples

---

## License

Same as NaviDocs main project.

---

## Acknowledgments

This design follows industry best practices from:
- OWASP Authentication Cheat Sheet
- NIST Digital Identity Guidelines
- OAuth 2.0 Security Best Current Practice
- JWT Best Practices (RFC 8725)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-21 | Initial design by Tech Lead |

---

## Status

**Current:** ⏳ Design Review
**Next:** ✅ Approval → 🚀 Implementation (Phase 1)

---

**Ready to start?** → Begin with [AUTH_QUICK_START.md](./AUTH_QUICK_START.md)

**Need the full picture?** → Read [DESIGN_AUTH_MULTITENANCY.md](./DESIGN_AUTH_MULTITENANCY.md)

**Want to see it visually?** → Check [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-21
**Maintained By:** Tech Lead
