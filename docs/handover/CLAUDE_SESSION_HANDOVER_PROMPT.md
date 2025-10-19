# NaviDocs - Claude Code Session Handover Prompt

**Copy everything below the line and paste into a new Claude Code session**

---

# NaviDocs Project Handover

I'm continuing work on **NaviDocs**, a marine documentation management platform with intelligent search and OCR. Here's the current state:

## Project Overview

**NaviDocs** is a professional document management system for the marine industry (boats, marinas, waterfront properties, commercial fleets). It enables users to organize, search, and access equipment manuals, maintenance records, and warranty documentation—even offline.

**Tech Stack:**
- Backend: Node.js 20 + Express 5, SQLite (better-sqlite3), Meilisearch, BullMQ + Redis
- Frontend: Vue 3 + Vite, Tailwind CSS
- OCR: Tesseract (local), Google Drive API, Google Cloud Vision API

**Repository:** `/home/setup/navidocs/` (Gitea: http://localhost:4000/ggq-admin/navidocs)

## Current Status (v1.0 MVP: 65% Complete)

✅ **Completed:**
- 13-table SQLite database schema (multi-tenant ready)
- OCR pipeline with 3 engines (Tesseract working at 85% confidence)
- Background job processing (BullMQ + Redis)
- File upload endpoint with safety pipeline
- Meilisearch integration (search engine)
- Backend API routes (upload, search, jobs, documents)
- Comprehensive documentation (33+ files)
- Repository reorganization (professional structure)
- Verticals & Horizontals strategy (4 verticals, 17 horizontals)
- Port audit and cleanup (port 5173 freed, no conflicts)

⏳ **In Progress / Next Steps:**
- Frontend UI (Vue components) - 20% complete
- JWT authentication implementation
- E2E testing
- Production deployment (StackCP or VPS)

## Port Allocation (CRITICAL)

**BEFORE using ANY port, check the system-wide registry in `/home/setup/navidocs/docs/development/DEVELOPMENT.md`**

**NaviDocs Ports:**
- Backend API: **8001**
- Frontend Dev: **8080**
- Redis: **6379**
- Meilisearch: **7700**

**Other Active Projects:**
- Gitea: **4000** (web), **2223** (SSH)
- FastFile: **3001** (backend), **5174** (frontend) - should migrate to 8002/8082

**❌ FORBIDDEN RANGE: 3000-5500** (reserved for other projects - DO NOT USE)

**✅ Safe Ranges:**
- Web services: 8000-8999
- Databases: 6000-6999
- Search/specialized: 7000-7999

## Repository Structure

```
/home/setup/navidocs/
├── client/                  # Vue 3 frontend (Vite, Tailwind)
├── server/                  # Express backend
│   ├── config/             # Database, Meilisearch config
│   ├── routes/             # API endpoints
│   ├── services/           # OCR, search, queue services
│   ├── workers/            # Background job processors
│   ├── db/                 # SQLite database files
│   └── index.js            # Application entry point
├── docs/                   # All documentation (well-organized)
│   ├── README.md           # Documentation index (start here!)
│   ├── architecture/       # System design, database schema
│   ├── deployment/         # StackCP and VPS guides
│   ├── guides/             # OCR, search feature guides
│   ├── development/        # Dev setup, PORT REGISTRY, testing
│   ├── handover/           # Session notes, project handover
│   ├── creative/           # Branding brief for designers
│   ├── debates/            # Feature debates (schema, yacht mgmt)
│   ├── roadmap/            # Product roadmap v1.0-v1.4
│   │   ├── MASTER_ROADMAP.md              # Complete roadmap
│   │   └── VERTICALS_AND_HORIZONTALS.md   # Platform strategy
│   └── analysis/           # Technical analysis
├── README.md               # Professional FANG-quality README
└── QUICKSTART.md          # Developer quick start guide
```

## Key Documentation Files (Read These First)

**Essential Reading:**
1. **`/home/setup/navidocs/README.md`** - Project overview, quick start, architecture
2. **`/home/setup/navidocs/docs/README.md`** - Complete documentation index
3. **`/home/setup/navidocs/docs/development/DEVELOPMENT.md`** - **CRITICAL: Port registry + dev guidelines**
4. **`/home/setup/navidocs/docs/roadmap/MASTER_ROADMAP.md`** - Complete product plan (v1.0-v1.4)
5. **`/home/setup/navidocs/docs/handover/NAVIDOCS_HANDOVER.md`** - Full project handover

**Platform Strategy:**
- **`/home/setup/navidocs/docs/roadmap/VERTICALS_AND_HORIZONTALS.md`** - 4 verticals, 17 horizontals, matrix table

**Recent Work:**
- **`/tmp/test-navidocs-clone/PORT_AUDIT_REPORT.md`** - Port audit completed 2025-10-19

## Recent Session Work (2025-10-19)

1. ✅ Created comprehensive branding brief for designers (542 lines)
2. ✅ Migrated all ports away from 3000-5500 range (8001/8080)
3. ✅ Created system-wide port registry in DEVELOPMENT.md
4. ✅ Reorganized repository (23 root files → organized docs/ structure)
5. ✅ Created professional FANG-quality README.md
6. ✅ Developed yacht management features roadmap (18 features, $89K ARR)
7. ✅ Created verticals & horizontals strategy (4 verticals, 17 horizontals)
8. ✅ Added quick reference matrix table (Verticals × Horizontals)
9. ✅ Completed port audit - killed python server on port 5173 (lilian1/frank-ai)
10. ✅ Verified no autostart mechanisms (systemd, PM2, cron, shell startup files)

## Development Guidelines

**Port Management:**
- ALWAYS check `/home/setup/navidocs/docs/development/DEVELOPMENT.md` BEFORE using any port
- NEVER use ports 3000-5500 (reserved for other projects)
- Use `ss -tulpn | grep LISTEN` to verify port availability
- Update port registry when adding new services

**Git Repository:**
- Gitea web UI: http://localhost:4000/ggq-admin/navidocs (may show 404 but git commands work)
- Use git commands directly: `cd /home/setup/navidocs && git status`
- 21 commits already pushed to Gitea

**Code Style:**
- ES Modules (import/export)
- Async/await (no callbacks)
- 2-space indentation
- Semicolons required

## Services and Configuration

**Start Services (Development):**
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Meilisearch
meilisearch --master-key=your_master_key_here

# Terminal 3: Backend (port 8001)
cd /home/setup/navidocs/server
node index.js

# Terminal 4: OCR Worker
cd /home/setup/navidocs/server
node workers/ocr-worker.js

# Terminal 5: Frontend (port 8080)
cd /home/setup/navidocs/client
npm run dev
```

**Environment Files:**
- `/home/setup/navidocs/server/.env` - Backend config (PORT=8001)
- `/home/setup/navidocs/server/.env.example` - Template
- `/home/setup/navidocs/client/vite.config.js` - Frontend config (port 8080, proxy to 8001)

## Database Schema

**13 tables (SQLite):**
- Multi-tenant: organizations, users, user_permissions
- Hierarchy: entities, sub_entities, components
- Documents: documents, ocr_results, search_sync_log
- Features: time_logs, tasks, warranties, vendors

**Schema File:** `/home/setup/navidocs/docs/architecture/database-schema.sql`

**Meilisearch Config:** `/home/setup/navidocs/docs/architecture/meilisearch-config.json`

## Roadmap Strategy (Important)

**4 Verticals:**
1. Boating & Yacht Management (v1.0-v1.4, 2025-2026)
2. Marina & Yacht Club Management (v2.0, 2027)
3. Waterfront Property & HOA Management (v2.5, 2027)
4. Commercial Fleet Management (v3.0, 2028)

**17 Horizontals (Build Once, Deploy Everywhere):**
- H1-H3: Document Management, OCR, Search (v1.0)
- H4-H7: Multi-Tenant, Time Tracking, Photos, Invoicing (v1.1)
- H8-H10: Equipment Tracking, Warranty, Vendor Management (v1.2)
- H11-H12: Task Assignment, Voice-to-Text (v1.3)
- H13-H15: Compliance, Insurance, Tax Reports (v1.4)
- H16-H17: Offline PWA, Mobile Apps

**Platform Strategy:** 80% code reuse across verticals, 20% UI customization

**See:** `/home/setup/navidocs/docs/roadmap/VERTICALS_AND_HORIZONTALS.md` (matrix table at top)

## Immediate Next Tasks (Priority Order)

### 1. Complete Frontend UI (2-4 hours with Claude multi-agent)
- Document upload component (drag & drop)
- Search interface with filters
- Document viewer (PDF.js)
- Job status dashboard
- Responsive layout (Tailwind)

### 2. Add JWT Authentication (1-2 hours with Claude multi-agent)
- User registration/login routes
- JWT token generation
- Protected route middleware
- Frontend auth state management

### 3. Fix Meilisearch Auth (5-10 minutes with Claude multi-agent)
- Issue: Currently running without auth (warning in logs)
- Solution: Generate master key, update server/.env, restart Meilisearch
- File: `docs/roadmap/MASTER_ROADMAP.md` has instructions

### 4. E2E Testing (2-3 hours with Claude multi-agent)
- Upload flow test
- OCR job processing test
- Search functionality test
- Document retrieval test

### 5. Production Deployment (1-2 hours with Claude multi-agent)
- Option A: StackCP shared hosting ($0/month) - See `docs/deployment/STACKCP_QUICKSTART.md`
- Option B: VPS ($6/month) - Recommended for production

## Known Issues / Gotchas

1. **Gitea Web UI Shows 404** - Repository exists on filesystem and git works, but web UI shows 404 due to ENABLE_PUSH_CREATE creating repo without database registration. Use git commands directly, web UI issue is non-blocking.

2. **Port 5173 Recently Freed** - Previously used by lilian1/frank-ai, now killed and available. No autostart configured.

3. **FastFile Port Conflict** - Currently using 3001/5174 (forbidden range). Should migrate to 8002/8082 (documented in PORT_AUDIT_REPORT.md).

4. **Meilisearch Master Key** - Not configured yet (running without auth). Generate key and update server/.env before production.

5. **Frontend 20% Complete** - Most backend work done, frontend needs significant work.

## Important Constraints

1. **NO ports 3000-5500** - Reserved for other projects (FastFile, croqu-pain, etc.)
2. **Multi-tenant from v1.0** - org_id columns present in schema (unused until v1.1)
3. **Platform approach** - Build horizontals for boating vertical, reuse for marina/property/fleet
4. **Offline-first PWA** - Critical feature for users 20 miles offshore (no cell signal)
5. **Security-first** - Helmet, rate limiting, JWT, tenant-scoped search tokens, file safety pipeline

## Verification Commands

**Check all project ports:**
```bash
ss -tulpn | grep -E "(4000|6379|7700|8001|8080)" | grep LISTEN
```

**Check for lilian1/frank-ai (should be none):**
```bash
ps aux | grep -E "lilian1|frank-ai" | grep -v grep
ss -tulpn | grep 5173
```

**Check git status:**
```bash
cd /home/setup/navidocs && git status
git log --oneline -5
```

**Check documentation:**
```bash
ls -la /home/setup/navidocs/docs/
cat /home/setup/navidocs/docs/README.md
```

## Questions to Ask Me

If you need clarification on any of the following, please ask:

1. Specific feature requirements or implementation details
2. Database schema questions (13 tables, relationships)
3. OCR pipeline usage (which engine for which scenario)
4. Deployment strategy (StackCP vs VPS decision)
5. Roadmap priorities (which features to build next)
6. Port allocation (if you need to add new services)
7. Multi-tenant implementation (when to activate org_id filtering)

## Success Metrics

**v1.0 MVP Definition of Done:**
- [ ] Frontend UI complete (upload, search, view documents)
- [ ] JWT authentication working
- [ ] E2E tests passing
- [ ] Deployed to StackCP or VPS
- [ ] 1 demo boat with 20+ manuals indexed
- [ ] Search working with <100ms response time
- [ ] OCR processing 100-page PDF in <3 minutes
- [ ] Offline PWA working (service worker caching)

## Contact & Resources

**Gitea Repository:** http://localhost:4000/ggq-admin/navidocs (git commands work, web UI shows 404)

**Local Filesystem:** `/home/setup/navidocs/`

**System User:** `setup:setup`

**Documentation Entry Point:** `/home/setup/navidocs/docs/README.md`

---

## Ready to Continue?

I've provided complete context. Please confirm you've understood the handover and let me know which task you'd like to start with:

1. Complete frontend UI
2. Add JWT authentication
3. Fix Meilisearch auth
4. E2E testing
5. Production deployment
6. Something else (specify)

Or ask any clarifying questions about the project, architecture, roadmap, or recent work.
