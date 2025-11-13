# NaviDocs Multi-Tenancy Architecture
## Visual System Design

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                              │
│                       (React Frontend - Port 3000)                       │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ Login/       │  │ Entity       │  │ Document     │                  │
│  │ Register     │  │ Management   │  │ Viewer       │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                           │
│              Sends: Authorization: Bearer <JWT>                          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY LAYER                                  │
│                    (Express.js - Port 8001)                              │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    MIDDLEWARE CHAIN                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │   │
│  │  │ Helmet   │→│ CORS     │→│ Rate     │→│ Request      │   │   │
│  │  │ (CSP)    │  │          │  │ Limiter  │  │ Logger       │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │   │
│  │                                                                  │   │
│  │  ┌──────────────────────┐  ┌──────────────────────────────┐   │   │
│  │  │ authenticateToken    │→│ requireEntityAccess          │   │   │
│  │  │ - Verify JWT         │  │ - Check entity permissions   │   │   │
│  │  │ - Load user          │  │ - Enforce access control     │   │   │
│  │  │ - Attach to req.user │  │                              │   │   │
│  │  └──────────────────────┘  └──────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         ROUTES                                   │   │
│  │                                                                  │   │
│  │  /api/auth/*              /api/entities/*      /api/documents/* │   │
│  │  ├─ register             ├─ GET /             ├─ GET /:id      │   │
│  │  ├─ login                ├─ POST /            ├─ GET /         │   │
│  │  ├─ logout               ├─ GET /:id          ├─ DELETE /:id   │   │
│  │  ├─ refresh              ├─ PATCH /:id        └─ GET /:id/pdf  │   │
│  │  ├─ forgot-password      ├─ DELETE /:id                         │   │
│  │  ├─ reset-password       └─ /:id/permissions                    │   │
│  │  └─ verify-email/:token                                         │   │
│  │                                                                  │   │
│  │  /api/organizations/*    /api/users/*         /api/search/*     │   │
│  │  ├─ GET /               ├─ GET /:id           ├─ POST /         │   │
│  │  ├─ POST /              ├─ PATCH /:id         └─ GET /suggest   │   │
│  │  ├─ GET /:id            └─ DELETE /:id                          │   │
│  │  ├─ PATCH /:id                                                  │   │
│  │  ├─ DELETE /:id                                                 │   │
│  │  ├─ GET /:id/members                                            │   │
│  │  ├─ POST /:id/members                                           │   │
│  │  ├─ PATCH /:id/members/:userId                                  │   │
│  │  └─ DELETE /:id/members/:userId                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                                     │
│                     (Business Logic Modules)                             │
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │ AuthService      │  │ AuthzService     │  │ UserService      │     │
│  │ ──────────────── │  │ ──────────────── │  │ ──────────────── │     │
│  │ • register()     │  │ • checkEntity    │  │ • getUser()      │     │
│  │ • login()        │  │   Permission()   │  │ • updateUser()   │     │
│  │ • logout()       │  │ • checkOrg       │  │ • deleteUser()   │     │
│  │ • refresh()      │  │   Permission()   │  │ • suspendUser()  │     │
│  │ • forgotPwd()    │  │ • grantEntity    │  │                  │     │
│  │ • resetPwd()     │  │   Permission()   │  │                  │     │
│  │ • verifyEmail()  │  │ • revokeEntity   │  │                  │     │
│  │                  │  │   Permission()   │  │                  │     │
│  │                  │  │ • getEntityUsers │  │                  │     │
│  │                  │  │ • getUserEntities│  │                  │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │ OrgService       │  │ AuditService     │  │ SearchService    │     │
│  │ ──────────────── │  │ ──────────────── │  │ ──────────────── │     │
│  │ • createOrg()    │  │ • logEvent()     │  │ • indexDoc()     │     │
│  │ • updateOrg()    │  │ • queryLogs()    │  │ • search()       │     │
│  │ • deleteOrg()    │  │ • getUserEvents()│  │                  │     │
│  │ • addMember()    │  │ • cleanupLogs()  │  │                  │     │
│  │ • removeMember() │  │                  │  │                  │     │
│  │ • updateRole()   │  │                  │  │                  │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │              LRU CACHE (Permission Resolution)                  │    │
│  │  Key: "entity:{userId}:{entityId}:{permission}"                │    │
│  │  TTL: 5 minutes                                                 │    │
│  │  Max Entries: 10,000                                            │    │
│  └────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                                   │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │                    SQLite Database                             │     │
│  │              (WAL mode, Foreign Keys enabled)                  │     │
│  │                                                                 │     │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │     │
│  │  │ users           │  │ organizations   │  │ entities     │  │     │
│  │  │ ─────────────── │  │ ─────────────── │  │ ────────────│  │     │
│  │  │ id              │  │ id              │  │ id          │  │     │
│  │  │ email (UNIQUE)  │  │ name            │  │ name        │  │     │
│  │  │ password_hash   │  │ type            │  │ entity_type │  │     │
│  │  │ status          │  │                 │  │ org_id (FK) │  │     │
│  │  │ email_verified  │  │                 │  │             │  │     │
│  │  └─────────────────┘  └─────────────────┘  └──────────────┘  │     │
│  │                                                                 │     │
│  │  ┌──────────────────────┐  ┌──────────────────────────────┐  │     │
│  │  │ user_organizations   │  │ entity_permissions           │  │     │
│  │  │ ──────────────────── │  │ ──────────────────────────── │  │     │
│  │  │ user_id (FK)         │  │ user_id (FK)                 │  │     │
│  │  │ organization_id (FK) │  │ entity_id (FK)               │  │     │
│  │  │ role (admin/...)     │  │ permission_level (viewer/...)│  │     │
│  │  │ joined_at            │  │ granted_by (FK)              │  │     │
│  │  │                      │  │ expires_at                   │  │     │
│  │  └──────────────────────┘  └──────────────────────────────┘  │     │
│  │                                                                 │     │
│  │  ┌──────────────────────┐  ┌──────────────────────────────┐  │     │
│  │  │ refresh_tokens       │  │ password_reset_tokens        │  │     │
│  │  │ ──────────────────── │  │ ──────────────────────────── │  │     │
│  │  │ user_id (FK)         │  │ user_id (FK)                 │  │     │
│  │  │ token_hash           │  │ token_hash                   │  │     │
│  │  │ device_info          │  │ expires_at                   │  │     │
│  │  │ revoked              │  │ used                         │  │     │
│  │  └──────────────────────┘  └──────────────────────────────┘  │     │
│  │                                                                 │     │
│  │  ┌──────────────────────┐  ┌──────────────────────────────┐  │     │
│  │  │ audit_log            │  │ documents                    │  │     │
│  │  │ ──────────────────── │  │ ──────────────────────────── │  │     │
│  │  │ user_id (FK)         │  │ organization_id (FK)         │  │     │
│  │  │ event_type           │  │ entity_id (FK)               │  │     │
│  │  │ resource_type        │  │ uploaded_by (FK)             │  │     │
│  │  │ status               │  │ title                        │  │     │
│  │  │ ip_address           │  │ file_path                    │  │     │
│  │  └──────────────────────┘  └──────────────────────────────┘  │     │
│  │                                                                 │     │
│  │  Indexes:                                                       │     │
│  │  • idx_entity_perms_user, idx_entity_perms_entity              │     │
│  │  • idx_audit_user, idx_audit_event, idx_audit_created          │     │
│  │  • idx_documents_org, idx_documents_entity                     │     │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              Meilisearch (Full-Text Search)                      │   │
│  │  Index: navidocs-pages                                          │   │
│  │  Documents: { docId, pageNumber, ocrText, ... }                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              Redis (BullMQ Job Queue)                            │   │
│  │  Queue: ocr-jobs                                                │   │
│  │  Workers: PDF extraction, OCR processing                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌─────────┐                                                    ┌─────────┐
│ Client  │                                                    │  Server │
└────┬────┘                                                    └────┬────┘
     │                                                              │
     │  1. POST /api/auth/register                                 │
     │     { email, password, name }                               │
     ├────────────────────────────────────────────────────────────>│
     │                                                              │
     │                                       2. Validate input      │
     │                                       3. Hash password       │
     │                                       4. Create user record  │
     │                                       5. Create personal org │
     │                                       6. Generate verify token│
     │                                                              │
     │  { user, message: "Verify email" }                          │
     │<────────────────────────────────────────────────────────────┤
     │                                                              │
     │  7. POST /api/auth/login                                    │
     │     { email, password }                                     │
     ├────────────────────────────────────────────────────────────>│
     │                                                              │
     │                                       8. Validate credentials│
     │                                       9. Check account status│
     │                                      10. Generate JWT (15min)│
     │                                      11. Generate refresh token│
     │                                      12. Store refresh hash  │
     │                                      13. Log audit event     │
     │                                                              │
     │  { accessToken, refreshToken, user }                        │
     │<────────────────────────────────────────────────────────────┤
     │                                                              │
     │  14. GET /api/documents                                     │
     │      Authorization: Bearer <JWT>                            │
     ├────────────────────────────────────────────────────────────>│
     │                                                              │
     │                                      15. Verify JWT signature│
     │                                      16. Check expiry        │
     │                                      17. Load user           │
     │                                      18. Check permissions   │
     │                                      19. Return documents    │
     │                                                              │
     │  { documents: [...] }                                       │
     │<────────────────────────────────────────────────────────────┤
     │                                                              │
     │  [15 minutes later]                                         │
     │                                                              │
     │  20. GET /api/documents                                     │
     │      Authorization: Bearer <expired JWT>                    │
     ├────────────────────────────────────────────────────────────>│
     │                                                              │
     │                                      21. Verify JWT → EXPIRED│
     │                                                              │
     │  { error: "Token expired" }                                 │
     │<────────────────────────────────────────────────────────────┤
     │                                                              │
     │  22. POST /api/auth/refresh                                 │
     │      { refreshToken }                                       │
     ├────────────────────────────────────────────────────────────>│
     │                                                              │
     │                                      23. Validate refresh token│
     │                                      24. Check revoked status│
     │                                      25. Generate new JWT   │
     │                                                              │
     │  { accessToken }                                            │
     │<────────────────────────────────────────────────────────────┤
     │                                                              │
     │  26. POST /api/auth/logout                                  │
     │      { refreshToken }                                       │
     ├────────────────────────────────────────────────────────────>│
     │                                                              │
     │                                      27. Revoke refresh token│
     │                                      28. Log audit event     │
     │                                                              │
     │  { success: true }                                          │
     │<────────────────────────────────────────────────────────────┤
     │                                                              │
```

---

## Authorization Resolution Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  User requests access to Entity (e.g., GET /api/entities/boat-123)  │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                                 ▼
         ┌─────────────────────────────────────────┐
         │  Check LRU Cache                         │
         │  Key: entity:userId:entityId:permission  │
         └────────────┬────────────────────────────┘
                      │
           ┌──────────┴──────────┐
           │                     │
         Cache                 Cache
         Hit                   Miss
           │                     │
           ▼                     ▼
    ┌──────────────┐    ┌──────────────────────────────────────┐
    │ Return       │    │  STEP 1: Check Organization Role     │
    │ Cached       │    │  ──────────────────────────────────── │
    │ Result       │    │  SELECT uo.role                       │
    └──────────────┘    │  FROM user_organizations uo           │
                        │  INNER JOIN entities e                │
                        │    ON e.organization_id = uo.org_id   │
                        │  WHERE uo.user_id = ? AND e.id = ?    │
                        └────────────┬─────────────────────────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
              Org Admin          Org Manager      Org Member/Viewer
                  │                  │                  │
                  ▼                  ▼                  ▼
           ┌────────────┐    ┌────────────┐    ┌─────────────────┐
           │ ALLOW ALL  │    │ Check perm │    │ STEP 2: Check   │
           │ PERMISSIONS│    │ in manager │    │ Entity Permission│
           └────────────┘    │ scope      │    │ ─────────────────│
                             └────────────┘    │ SELECT perm_level│
                                     │         │ FROM entity_perms│
                                     │         │ WHERE user_id=?  │
                                     │         │   AND entity_id=?│
                                     │         └─────────┬────────┘
                                     │                   │
                                     │         ┌─────────┴────────┐
                                     │         │                  │
                                     │    Found Perm         Not Found
                                     │         │                  │
                                     │         ▼                  ▼
                                     │  ┌──────────────┐  ┌──────────────┐
                                     │  │ Check if     │  │ STEP 3: Check│
                                     │  │ permission   │  │ Legacy Perms │
                                     │  │ in hierarchy │  │ (backward    │
                                     │  │ (viewer→     │  │ compat)      │
                                     │  │ editor→      │  │              │
                                     │  │ manager→     │  └──────┬───────┘
                                     │  │ admin)       │         │
                                     │  └──────┬───────┘         │
                                     │         │                 │
                                     ▼         ▼                 ▼
                             ┌───────────────────────────────────────┐
                             │        Permission Resolution          │
                             │  ────────────────────────────────────│
                             │  • Admin: All permissions             │
                             │  • Manager: view, edit, create,       │
                             │             delete, share             │
                             │  • Editor: view, edit, create         │
                             │  • Viewer: view only                  │
                             └─────────────┬─────────────────────────┘
                                           │
                              ┌────────────┴────────────┐
                              │                         │
                          ALLOW                       DENY
                              │                         │
                              ▼                         ▼
                    ┌──────────────────┐      ┌──────────────────┐
                    │ Cache result     │      │ Cache result     │
                    │ Return true      │      │ Return false     │
                    │ Proceed to       │      │ Return 403       │
                    │ business logic   │      │ Forbidden        │
                    └──────────────────┘      └──────────────────┘
```

---

## Permission Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PERMISSION LEVELS                                │
│                   (Higher includes all lower)                        │
└─────────────────────────────────────────────────────────────────────┘

    ┌───────────────┐
    │     ADMIN     │  Full control: view, edit, create, delete,
    │ ──────────────│  share, manage_users, manage_permissions
    └───────┬───────┘
            │ Includes ↓
    ┌───────┴───────┐
    │    MANAGER    │  Management: view, edit, create, delete, share
    │ ──────────────│
    └───────┬───────┘
            │ Includes ↓
    ┌───────┴───────┐
    │    EDITOR     │  Content: view, edit, create
    │ ──────────────│
    └───────┬───────┘
            │ Includes ↓
    ┌───────┴───────┐
    │    VIEWER     │  Read-only: view
    │ ──────────────│
    └───────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│              ORGANIZATION ROLES vs ENTITY PERMISSIONS                │
└─────────────────────────────────────────────────────────────────────┘

Organization Level                    Entity Level (Override)
(Broad Access)                        (Granular Access)

┌─────────────────────┐              ┌─────────────────────┐
│ Org Admin           │ ───────────> │ Full access to      │
│ • All entities      │              │ ALL entities        │
│ • User management   │              │ (Cannot be limited) │
└─────────────────────┘              └─────────────────────┘

┌─────────────────────┐              ┌─────────────────────┐
│ Org Manager         │ ───────────> │ View/Edit all       │
│ • All entities      │              │ entities by default │
│ • Limited user mgmt │              │ (Can be extended to │
└─────────────────────┘              │  admin on specific) │
                                     └─────────────────────┘

┌─────────────────────┐              ┌─────────────────────┐
│ Org Member          │ ───────────> │ Access based on     │
│ • No default access │              │ entity_permissions  │
│ • Requires explicit │              │ table (explicit     │
│   entity grants     │              │ grants required)    │
└─────────────────────┘              └─────────────────────┘

┌─────────────────────┐              ┌─────────────────────┐
│ Org Viewer          │ ───────────> │ Read-only access to │
│ • View all entities │              │ all entities        │
│ • No modifications  │              │ (Cannot be elevated │
└─────────────────────┘              │  without org role)  │
                                     └─────────────────────┘
```

---

## Multi-Tenancy Model

```
┌────────────────────────────────────────────────────────────────────┐
│                    MULTI-VERTICAL STRUCTURE                         │
│            (Organization → Entities → Documents)                    │
└────────────────────────────────────────────────────────────────────┘

Organization: "Coastal Marine Services"
│
├─ User Memberships:
│  ├─ Alice (admin)
│  ├─ Bob (manager)
│  ├─ Carol (member)
│  └─ Dave (viewer)
│
└─ Entities (Cross-Vertical):
   │
   ├─ Entity: Boat "Sea Breeze" (id: boat-001)
   │  │  Type: boat
   │  │  Organization: Coastal Marine Services
   │  │
   │  ├─ Entity Permissions:
   │  │  ├─ Alice: admin (from org role)
   │  │  ├─ Bob: manager (from org role)
   │  │  ├─ Carol: editor (explicit grant)
   │  │  └─ Dave: viewer (from org role)
   │  │
   │  └─ Documents:
   │     ├─ Owner's Manual.pdf
   │     ├─ Engine Service Record.pdf
   │     └─ Safety Certificate.pdf
   │
   ├─ Entity: Boat "Ocean Rider" (id: boat-002)
   │  │  Type: boat
   │  │
   │  ├─ Entity Permissions:
   │  │  ├─ Alice: admin (from org role)
   │  │  ├─ Bob: manager (from org role)
   │  │  ├─ Carol: NO ACCESS (not granted)
   │  │  └─ Dave: viewer (from org role)
   │  │
   │  └─ Documents:
   │     └─ Charter Contract.pdf
   │
   ├─ Entity: Marina "Harbor Bay" (id: marina-001)
   │  │  Type: marina (different vertical!)
   │  │
   │  ├─ Entity Permissions:
   │  │  ├─ Alice: admin
   │  │  ├─ Bob: admin (explicit grant)
   │  │  └─ Carol, Dave: NO ACCESS
   │  │
   │  └─ Documents:
   │     ├─ Dock Layout.pdf
   │     └─ Safety Procedures.pdf
   │
   └─ Entity: Aircraft "Cessna N12345" (id: aircraft-001)
      │  Type: aircraft (another vertical!)
      │
      ├─ Entity Permissions:
      │  └─ Alice: admin (only Alice has access)
      │
      └─ Documents:
         └─ Pilot Operating Handbook.pdf


VERTICAL AGNOSTIC DESIGN:
──────────────────────────
All verticals (boat, aircraft, marina, condo, etc) use the SAME:
• Database schema
• Permission model
• Authorization logic
• API endpoints

The "entity_type" field differentiates verticals, but logic is identical.
```

---

## Security Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                      DEFENSE IN DEPTH                             │
│              (Multiple layers of security)                        │
└──────────────────────────────────────────────────────────────────┘

Layer 1: Network Security
┌────────────────────────────────────────────────────────────────┐
│ • HTTPS/TLS encryption                                         │
│ • CORS policy (restrict origins)                              │
│ • Rate limiting (prevent DDoS)                                │
│ • IP-based blocking (optional)                                │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
Layer 2: Application Security
┌────────────────────────────────────────────────────────────────┐
│ • Helmet.js (CSP, XSS protection)                             │
│ • Input validation (sanitize all inputs)                      │
│ • SQL injection prevention (prepared statements)              │
│ • Error handling (don't leak system info)                     │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
Layer 3: Authentication
┌────────────────────────────────────────────────────────────────┐
│ • JWT signature verification                                  │
│ • Token expiry enforcement                                    │
│ • Refresh token rotation                                      │
│ • Account status checks (active/suspended)                    │
│ • Brute force protection (rate limiting)                      │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
Layer 4: Authorization
┌────────────────────────────────────────────────────────────────┐
│ • Organization membership validation                          │
│ • Entity-level permission checks                              │
│ • Resource ownership verification                             │
│ • Permission hierarchy enforcement                            │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
Layer 5: Data Security
┌────────────────────────────────────────────────────────────────┐
│ • Password hashing (bcrypt, cost=12)                          │
│ • Token hashing (refresh tokens, reset tokens)                │
│ • Sensitive data encryption (at rest)                         │
│ • Foreign key constraints (data integrity)                    │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
Layer 6: Audit & Monitoring
┌────────────────────────────────────────────────────────────────┐
│ • Security event logging (all auth events)                    │
│ • Failed login tracking                                       │
│ • Permission change logging                                   │
│ • Anomaly detection (future: ML-based)                        │
│ • Compliance reporting (GDPR, SOC2)                           │
└────────────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

```
┌────────────────────────────────────────────────────────────────┐
│                  HORIZONTAL SCALING STRATEGY                    │
└────────────────────────────────────────────────────────────────┘

Current (Single Server):
┌─────────────────┐
│  Express API    │
│  + SQLite DB    │ ──> Max: ~1000 concurrent users
└─────────────────┘

Phase 2 (Load Balanced):
┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┼────┐
    │    │    │
┌───▼┐ ┌─▼──┐ ┌▼───┐
│API │ │API │ │API │  (Stateless JWT = easy to scale)
└───┬┘ └─┬──┘ └┬───┘
    │    │    │
    └────┼────┘
         │
┌────────▼────────┐
│  PostgreSQL     │ ──> Max: ~10,000 concurrent users
│  (Master-Slave) │
└─────────────────┘

Phase 3 (Multi-Region):
┌──────────────────────────────────────────────────────────────┐
│  CDN / Global Load Balancer                                  │
└───────────────────┬──────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │                       │
┌───────▼────────┐     ┌────────▼───────┐
│  Region: US    │     │  Region: EU    │
│  ────────────  │     │  ────────────  │
│  API Servers   │     │  API Servers   │
│  Read Replicas │     │  Read Replicas │
└───────┬────────┘     └────────┬───────┘
        │                       │
        └───────────┬───────────┘
                    │
            ┌───────▼───────┐
            │ PostgreSQL    │ ──> Max: 100,000+ users
            │ Multi-Master  │
            │ Replication   │
            └───────────────┘


Permission Cache Strategy:
──────────────────────────
• LRU cache per API server (in-memory)
• TTL: 5 minutes
• Invalidation: On permission change
• Reduces DB queries by 80-90%
• Scales linearly with server count
```

---

## File Structure

```
navidocs/server/
│
├── config/
│   ├── db.js                     # Database connection config
│   └── meilisearch.js            # Search client config
│
├── db/
│   ├── db.js                     # Database instance (singleton)
│   ├── init.js                   # Database initialization
│   ├── schema.sql                # Base schema
│   └── navidocs.db               # SQLite database file
│
├── migrations/
│   ├── 001_initial.sql
│   ├── 002_entities.sql
│   └── 003_auth_tables.sql       # NEW: Auth tables migration
│
├── middleware/
│   ├── auth.js                   # JWT authentication middleware
│   └── permissions.js            # NEW: Permission enforcement middleware
│
├── routes/
│   ├── auth.js                   # NEW: Auth endpoints
│   ├── users.js                  # NEW: User management
│   ├── organizations.js          # NEW: Org management
│   ├── entities.js               # Entity CRUD (add permission checks)
│   ├── documents.js              # Document CRUD (add permission checks)
│   ├── upload.js                 # File upload
│   └── search.js                 # Search endpoints
│
├── services/
│   ├── auth.js                   # NEW: Authentication service
│   ├── authorization.js          # NEW: Authorization service
│   ├── audit.js                  # NEW: Audit logging service
│   ├── users.js                  # NEW: User management service
│   ├── organizations.js          # NEW: Organization service
│   ├── ocr.js                    # OCR processing
│   ├── search.js                 # Search indexing
│   └── queue.js                  # Job queue
│
├── test/
│   ├── services/
│   │   ├── auth.test.js          # NEW
│   │   ├── authorization.test.js # NEW
│   │   └── audit.test.js         # NEW
│   ├── routes/
│   │   ├── auth.test.js          # NEW
│   │   └── organizations.test.js # NEW
│   └── migrations/
│       └── 003_auth_tables.test.js # NEW
│
├── utils/
│   └── logger.js                 # Logging utility
│
├── index.js                      # Express app entry point
├── package.json
├── .env
├── DESIGN_AUTH_MULTITENANCY.md   # This design doc
├── IMPLEMENTATION_TASKS.md       # Task breakdown
└── ARCHITECTURE_DIAGRAM.md       # Architecture diagrams
```

---

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | Node.js 20+ | Runtime environment |
| **Framework** | Express 5.0 | Web framework |
| **Database** | SQLite (→ PostgreSQL) | Relational data storage |
| **Authentication** | JWT (jsonwebtoken) | Stateless auth tokens |
| **Password Hashing** | bcrypt | Secure password storage |
| **Search** | Meilisearch | Full-text search |
| **Job Queue** | BullMQ + Redis | Background OCR jobs |
| **Caching** | lru-cache | In-memory permission cache |
| **Security** | Helmet.js | HTTP security headers |
| **Rate Limiting** | express-rate-limit | DDoS protection |
| **Testing** | Mocha/Jest | Unit & integration tests |
| **Documentation** | OpenAPI/Swagger | API documentation |

---

## Key Design Decisions

1. **JWT over Sessions:** Stateless tokens enable horizontal scaling without shared session store.

2. **3-Tier Permissions:** Organization → Entity → Resource hierarchy provides flexibility without complexity.

3. **LRU Cache:** Dramatically improves performance (5ms vs 50ms per permission check) with acceptable staleness (5min TTL).

4. **Refresh Token Rotation:** Security best practice - short-lived access tokens + revocable refresh tokens.

5. **Audit-First Design:** All security events logged for compliance and forensics.

6. **Vertical Agnostic:** Entity type is a field, not a table - same code handles boats, aircraft, condos.

7. **SQLite → PostgreSQL:** Start simple, migrate when needed - schema designed for easy transition.

8. **bcrypt over SHA:** Industry standard for password hashing with adjustable cost factor.

9. **Explicit Grants:** Members don't inherit entity access - must be explicitly granted (more secure).

10. **Soft Deletes:** Users marked as 'deleted' status rather than removed (preserves audit trail).

---

## Next Steps

1. **Review & Approve** this design document
2. **Create GitHub Issues** for each PR in IMPLEMENTATION_TASKS.md
3. **Set up CI/CD** pipeline for automated testing
4. **Begin Phase 1** implementation (database migration)
5. **Schedule Code Reviews** for each PR
6. **Plan Frontend Integration** after backend completion

---

**Document Metadata:**
- Version: 1.0
- Date: 2025-10-21
- Author: Tech Lead
- Status: Ready for Review
