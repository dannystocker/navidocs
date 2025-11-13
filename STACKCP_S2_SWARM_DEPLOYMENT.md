# NaviDocs StackCP S2 Swarm Deployment Plan
**DEADLINE:** 5 hours to working demo
**STATUS:** ✅ READY TO EXECUTE
**STRATEGY:** Maximum velocity via parallel Claude Code CLI agents

---

## 🎯 Mission

Deploy fully functional NaviDocs on StackCP shared hosting using **5 parallel Claude Code CLI agents** working simultaneously, ready for Riviera Plaisance presentation in 5 hours.

---

## 🏗️ Architecture Overview

```
StackCP Server (ssh.gb.stackcp.com)
├── /tmp/navidocs/                    # Executable code location
│   ├── server/                       # Backend (Express.js + SQLite)
│   ├── client/                       # Frontend (Vue 3)
│   ├── uploads/                      # Temp file uploads
│   └── .env                          # Configuration
│
├── ~/navidocs-data/                  # Persistent data (noexec OK)
│   ├── db/navidocs.db                # SQLite database
│   ├── uploads/                      # Permanent uploads
│   └── logs/                         # Application logs
│
└── ~/public_html/digital-lab.ca/navidocs/  # Static frontend (served by Apache)
```

**External Services:**
- **Redis Cloud:** Free 30MB tier (job queue)
- **Meilisearch:** Running on localhost:7700 (already installed)
- **Google Vision API:** For OCR (handwriting + context understanding)
- **Claude Code CLI:** For intelligent document analysis

---

## 🤖 S2 Swarm: 5 Parallel Agents

### Agent 1: Backend Developer (S2-BACKEND)
**tmux session:** `backend-dev`
**Working directory:** `/tmp/navidocs/server`
**Claude session:** `/tmp/claude` → Backend development mode

**Tasks (Priority Order):**
1. **Database Setup** (10 min)
   - Deploy schema to ~/navidocs-data/db/navidocs.db
   - Run migrations (warranty_tracking, webhooks, sale_workflows)
   - Seed test data (1 organization, 3 boats, 10 documents)

2. **Core API Endpoints** (60 min)
   - Auth: /api/auth/register, /api/auth/login (JWT)
   - Documents: /api/documents/upload, /api/documents/list
   - Warranties: /api/warranties/list, /api/warranties/expiring
   - Search: /api/search (Meilisearch integration)

3. **Background Worker** (30 min)
   - OCR processing queue (BullMQ + Redis Cloud)
   - Warranty expiration checker
   - Document indexing to Meilisearch

4. **Testing** (15 min)
   - curl test all endpoints
   - Upload 3 test PDFs
   - Verify OCR processing

**Handoff to Agent 2:** API endpoints ready, database populated

---

### Agent 2: Frontend Developer (S2-FRONTEND)
**tmux session:** `frontend-dev`
**Working directory:** `/tmp/navidocs/client`
**Claude session:** `/tmp/claude` → Frontend development mode

**Tasks (Priority Order):**
1. **Core UI Components** (45 min)
   - Login/Register forms (using Session 3 design system)
   - Document upload interface
   - Document list with search
   - Warranty dashboard

2. **Navigation & Layout** (30 min)
   - Top nav (logo, search, user menu)
   - Sidebar (boats, documents, warranties, settings)
   - Responsive mobile layout

3. **Build & Deploy** (15 min)
   - npm run build
   - Copy dist/* to ~/public_html/digital-lab.ca/navidocs/
   - Configure API proxy (Apache .htaccess)

4. **Testing** (15 min)
   - Test login flow
   - Upload document
   - Search functionality
   - Warranty list

**Handoff to Agent 3:** UI built, deployed, tested

---

### Agent 3: OCR Integration Specialist (S2-OCR)
**tmux session:** `ocr-dev`
**Working directory:** `/tmp/navidocs/server/services`
**Claude session:** `/tmp/claude` → OCR development mode

**Tasks (Priority Order):**
1. **Claude Code CLI OCR** (30 min)
   - Create `ocr-claude.js` using /tmp/claude CLI
   - Extract text + understand context (equipment names, dates, warranty periods)
   - Structured output: { text, equipment: [], warranties: [], dates: [] }

2. **Google Vision API Fallback** (20 min)
   - Install @google-cloud/vision (in /tmp/navidocs/server)
   - Create `ocr-google-vision.js`
   - Handle handwriting detection
   - Multi-page PDF processing

3. **Hybrid Strategy** (20 min)
   - Create `ocr-hybrid.js` orchestrator
   - Try Claude Code CLI first (faster, understands context)
   - Fallback to Google Vision if Claude fails
   - Log which engine was used

4. **Testing** (20 min)
   - Test with typed PDF (warranty certificate)
   - Test with handwritten receipt
   - Test with multi-page manual
   - Verify equipment extraction accuracy

**Handoff to Agent 4:** OCR working for all document types

---

### Agent 4: Infrastructure & DevOps (S2-INFRA)
**tmux session:** `infra`
**Working directory:** `/tmp/navidocs`
**Claude session:** `/tmp/claude` → Infrastructure mode

**Tasks (Priority Order):**
1. **Environment Configuration** (15 min)
   - Create `/tmp/navidocs/server/.env` with all config
   - Redis Cloud connection (get credentials)
   - Google Vision API credentials (copy from user)
   - Meilisearch localhost:7700 connection
   - JWT secrets generation

2. **Process Management** (20 min)
   - Create systemd-style service scripts (using screen/tmux)
   - Start scripts: navidocs-api, navidocs-worker, navidocs-search
   - Stop/restart scripts
   - Health check script

3. **Apache Reverse Proxy** (15 min)
   - Configure .htaccess for API proxy
   - /api/* → http://localhost:8001/api/*
   - Static files served from ~/public_html
   - Enable CORS for dev

4. **Monitoring & Logging** (15 min)
   - Centralized logging to ~/navidocs-data/logs/
   - Error tracking (capture stack traces)
   - Performance monitoring (response times)
   - Disk space alerts

**Handoff to Agent 5:** Infrastructure ready, services running

---

### Agent 5: QA & Integration Testing (S2-QA)
**tmux session:** `qa`
**Working directory:** `/tmp/navidocs/tests`
**Claude session:** `/tmp/claude` → QA mode

**Tasks (Priority Order):**
1. **End-to-End Test Suite** (45 min)
   - User registration → login → JWT token
   - Upload PDF → OCR processing → search
   - Warranty tracking → expiration alerts
   - Multi-boat organization setup
   - Camera integration mock

2. **Demo Data Preparation** (30 min)
   - Create "Riviera Plaisance" organization
   - 3 boats: Azimut 55S, Princess V50, Sunseeker Manhattan 66
   - 10-15 realistic documents per boat
   - 5 active warranties (2 expiring soon for demo)

3. **Performance Testing** (20 min)
   - Upload 50 documents (simulate broker workload)
   - Concurrent search queries (5 simultaneous users)
   - OCR processing queue handling
   - Database query optimization

4. **Bug Fixing** (30 min)
   - Review all agent outputs
   - Fix integration issues
   - Polish UI rough edges
   - Verify mobile responsiveness

**Final Deliverable:** Working demo ready for presentation

---

## 🚀 Deployment Sequence (Total: 3 hours)

### Phase 1: Initial Setup (t=0 to t=20min)

**All agents in parallel:**

```bash
# On StackCP server
ssh stackcp

# Agent 1: Clone & setup backend
tmux new -s backend-dev
cd /tmp
git clone https://github.com/dannystocker/navidocs.git navidocs
cd /tmp/navidocs/server
/tmp/npm install --production
# Launch Claude Code CLI
/tmp/claude

# Agent 2: Setup frontend
tmux new -s frontend-dev
cd /tmp/navidocs/client
/tmp/npm install
# Launch Claude Code CLI
/tmp/claude

# Agent 3: Setup OCR
tmux new -s ocr-dev
cd /tmp/navidocs/server/services
# Launch Claude Code CLI
/tmp/claude

# Agent 4: Infrastructure
tmux new -s infra
cd /tmp/navidocs
# Launch Claude Code CLI
/tmp/claude

# Agent 5: QA
tmux new -s qa
cd /tmp/navidocs
mkdir -p tests
# Launch Claude Code CLI
/tmp/claude
```

### Phase 2: Core Development (t=20min to t=120min)

**Agents work in parallel following task priorities above.**

**Coordinator (you):**
- Monitor tmux sessions every 15 minutes
- Check agent progress: `tmux ls` + attach to each session
- Resolve blockers immediately
- Coordinate handoffs between agents

### Phase 3: Integration (t=120min to t=180min)

**Agent 1 + Agent 2:** Wire frontend to backend APIs
**Agent 3:** Verify OCR working end-to-end
**Agent 4:** All services running, monitoring active
**Agent 5:** E2E tests passing, demo data loaded

### Phase 4: Polish (t=180min to t=240min)

**All agents:** Bug fixes, UI polish, performance optimization
**Agent 5:** Final QA pass, presentation rehearsal

### Phase 5: Presentation Prep (t=240min to t=300min)

**All agents:** Standby mode, ready to fix issues
**Coordinator:** Prepare talking points, demo script

---

## 📋 Agent Prompts (Copy-Paste into Claude Code CLI)

### Agent 1: Backend Developer Prompt

```markdown
You are Agent 1 (S2-BACKEND) for NaviDocs deployment on StackCP.

**Mission:** Build production-ready Express.js backend in 2 hours.

**Context:**
- Working dir: /tmp/navidocs/server
- Database: ~/navidocs-data/db/navidocs.db (SQLite)
- Architecture from: intelligence/session-2/session-2-architecture.md
- Sprint plan: intelligence/session-4/week-1-detailed-schedule.md

**Priority Tasks:**
1. Database setup + migrations (schema.sql already exists)
2. Core API endpoints:
   - POST /api/auth/register (email, password, name)
   - POST /api/auth/login (returns JWT)
   - POST /api/documents/upload (file upload + OCR queue)
   - GET /api/documents/list?boat_id=X
   - GET /api/warranties/expiring?days=30
3. Background worker: server/workers/ocr-worker.js
4. curl test all endpoints

**Constraints:**
- Code must run in /tmp (executable)
- Data must be in ~ (persistent)
- Use Redis Cloud for BullMQ (get creds from .env)
- Meilisearch at localhost:7700

**Output:** Working API on port 8001, database populated, worker running.

Start now!
```

### Agent 2: Frontend Developer Prompt

```markdown
You are Agent 2 (S2-FRONTEND) for NaviDocs deployment on StackCP.

**Mission:** Build production Vue 3 frontend in 2 hours.

**Context:**
- Working dir: /tmp/navidocs/client
- Design system: intelligence/session-3/agent-9-visual-design-system.md
- UI components needed:
  - Login/Register forms
  - Document upload interface
  - Document list with search
  - Warranty dashboard
  - Boat selector sidebar

**Priority Tasks:**
1. Core components (45 min):
   - Login.vue, Register.vue, DocumentUpload.vue, DocumentList.vue
2. Layout (30 min):
   - TopNav.vue, Sidebar.vue, MainLayout.vue
3. Build & deploy (15 min):
   - npm run build
   - cp -r dist/* ~/public_html/digital-lab.ca/navidocs/
4. Test UI flow (15 min)

**Design Guidelines:**
- Ocean Deep #003D5C (nav, headers)
- Wave Blue #0066CC (buttons, links)
- Sand Beige #F5F1E8 (backgrounds)
- Inter font family
- Mobile-first, responsive

**Output:** Working UI accessible at https://digital-lab.ca/navidocs

Start now!
```

### Agent 3: OCR Integration Specialist Prompt

```markdown
You are Agent 3 (S2-OCR) for NaviDocs deployment on StackCP.

**Mission:** Implement hybrid OCR system using Claude Code CLI + Google Vision API.

**Context:**
- Working dir: /tmp/navidocs/server/services
- Claude CLI: /tmp/claude (use for intelligent document analysis)
- Google Vision: @google-cloud/vision package

**Priority Tasks:**
1. Claude Code CLI OCR (30 min):
   - Create ocr-claude.js that uses /tmp/claude CLI
   - Extract: text + equipment names + dates + warranty periods
   - Structured output: { text, equipment: [], warranties: [], dates: [] }

2. Google Vision fallback (20 min):
   - Create ocr-google-vision.js for handwriting detection
   - Multi-page PDF processing

3. Hybrid orchestrator (20 min):
   - Create ocr-hybrid.js
   - Try Claude first (faster + context)
   - Fallback to Google Vision if needed

4. Test suite (20 min):
   - Typed PDF (warranty certificate)
   - Handwritten receipt
   - Multi-page manual

**Innovation:**
- Claude Code CLI can UNDERSTAND document context (not just OCR text)
- Extract equipment automatically: "Volvo Penta D6-370" from manual
- Detect warranty periods: "24 months from purchase date"

**Output:** OCR service that handles ALL document types with intelligence.

Start now!
```

### Agent 4: Infrastructure & DevOps Prompt

```markdown
You are Agent 4 (S2-INFRA) for NaviDocs deployment on StackCP.

**Mission:** Configure production infrastructure in 90 minutes.

**Context:**
- StackCP constraints: /tmp executable, ~ persistent
- Services needed: API server, OCR worker, Meilisearch indexer
- External: Redis Cloud, Google Vision API

**Priority Tasks:**
1. Environment config (15 min):
   - Create /tmp/navidocs/server/.env
   - Redis Cloud connection (free tier)
   - Google Vision API credentials
   - Meilisearch localhost:7700
   - JWT secret generation

2. Process management (20 min):
   - navidocs-api.sh (start Express on port 8001)
   - navidocs-worker.sh (start OCR worker)
   - Health check script (curl endpoints)

3. Apache reverse proxy (15 min):
   - ~/public_html/digital-lab.ca/navidocs/.htaccess
   - Proxy /api/* to http://localhost:8001/api/*
   - Serve static files from ~/public_html

4. Monitoring (15 min):
   - Centralized logging to ~/navidocs-data/logs/
   - Error tracking
   - Performance monitoring

**Output:** All services running, accessible at https://digital-lab.ca/navidocs

Start now!
```

### Agent 5: QA & Integration Testing Prompt

```markdown
You are Agent 5 (S2-QA) for NaviDocs deployment on StackCP.

**Mission:** End-to-end testing + demo data preparation in 2 hours.

**Context:**
- Working dir: /tmp/navidocs/tests
- Demo for: Riviera Plaisance (premium yacht broker)
- Presentation in 5 hours

**Priority Tasks:**
1. E2E test suite (45 min):
   - User flow: register → login → upload → search
   - Warranty tracking flow
   - Multi-boat organization
   - Mobile responsiveness

2. Demo data (30 min):
   - Organization: "Riviera Plaisance"
   - 3 boats: Azimut 55S, Princess V50, Sunseeker Manhattan 66
   - 10-15 documents per boat (manuals, warranties, receipts)
   - 5 warranties (2 expiring in 30 days for demo alert)

3. Performance testing (20 min):
   - Upload 50 documents
   - Concurrent searches (5 users)
   - OCR queue handling
   - Database query optimization

4. Bug fixing (30 min):
   - Review all agent outputs
   - Fix integration issues
   - Polish UI
   - Verify mobile

**Critical Success Factors:**
- €24K-€65K resale value recovery claim (works?)
- 19-25 hour time savings (visible in UI?)
- 98% documentation completeness (measure?)

**Output:** Flawless demo ready for Riviera meeting.

Start now!
```

---

## 🔧 Technical Stack (Final)

| Component | Technology | Location | Status |
|-----------|-----------|----------|--------|
| **Backend** | Express.js (Node.js 20.18.0) | /tmp/navidocs/server | Deploy |
| **Frontend** | Vue 3 + Vite | /tmp/navidocs/client → ~/public_html | Deploy |
| **Database** | SQLite (better-sqlite3) | ~/navidocs-data/db/navidocs.db | Create |
| **Search** | Meilisearch 1.6.2 | localhost:7700 | ✅ Running |
| **Queue** | BullMQ + Redis Cloud | redis-*.redis.cloud:port | Setup |
| **OCR Primary** | Claude Code CLI (/tmp/claude) | /tmp/navidocs/server/services | Build |
| **OCR Fallback** | Google Vision API | @google-cloud/vision | Setup |
| **Web Server** | Apache (StackCP managed) | ~/public_html | Configure |

---

## 📊 Success Metrics (5 Hours)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| **API Endpoints** | 10+ working | TBD | Pending |
| **Frontend Pages** | 5 core pages | TBD | Pending |
| **OCR Success Rate** | >90% | TBD | Pending |
| **Upload Speed** | <5 sec per doc | TBD | Pending |
| **Search Latency** | <200ms | TBD | Pending |
| **Demo Data** | 3 boats, 30+ docs | TBD | Pending |
| **Mobile Responsive** | 100% | TBD | Pending |
| **Zero Errors** | No console errors | TBD | Pending |

---

## 🚨 Risk Mitigation

### Risk 1: Redis Cloud Setup Delay
**Mitigation:** Use in-memory queue (fallback)
**Impact:** OCR processing slower but works

### Risk 2: Google Vision API Credentials Missing
**Mitigation:** Claude Code CLI only (primary OCR)
**Impact:** Handwriting detection reduced

### Risk 3: Agent Coordination Failure
**Mitigation:** Manual intervention every 15 min
**Impact:** Slower progress but still functional

### Risk 4: StackCP Resource Limits
**Mitigation:** Optimize heavy operations
**Impact:** Reduce concurrent uploads to 3

---

## 📞 Quick Commands (Coordinator)

### Monitor Agents
```bash
ssh stackcp
tmux ls                           # List all sessions
tmux attach -t backend-dev        # Check Agent 1
tmux attach -t frontend-dev       # Check Agent 2
tmux attach -t ocr-dev            # Check Agent 3
tmux attach -t infra              # Check Agent 4
tmux attach -t qa                 # Check Agent 5
```

### Check Services
```bash
# API server
curl http://localhost:8001/api/health

# Meilisearch
curl http://localhost:7700/health

# Database
sqlite3 ~/navidocs-data/db/navidocs.db "SELECT COUNT(*) FROM documents;"

# Logs
tail -f ~/navidocs-data/logs/server.log
tail -f ~/navidocs-data/logs/worker.log
```

### Emergency Restart
```bash
pkill -f "node server/index.js"
pkill -f "node workers/ocr-worker.js"
cd /tmp/navidocs/server
/tmp/node index.js > ~/navidocs-data/logs/server.log 2>&1 &
/tmp/node workers/ocr-worker.js > ~/navidocs-data/logs/worker.log 2>&1 &
```

---

## ✅ Final Checklist (Before Presentation)

- [ ] All 5 agents completed their tasks
- [ ] API responding on https://digital-lab.ca/navidocs/api/health
- [ ] Frontend accessible at https://digital-lab.ca/navidocs
- [ ] User can register → login → upload → search
- [ ] OCR processing working (test with 1 PDF)
- [ ] Warranty dashboard showing expiring items
- [ ] Demo data loaded (Riviera Plaisance + 3 boats)
- [ ] Mobile responsive (test on phone)
- [ ] No console errors in browser
- [ ] Presentation script reviewed

---

**READY TO LAUNCH:** Deploy in 3 hours, test in 1 hour, present in 1 hour.

**MAXIMUM VELOCITY MODE:** All agents start simultaneously, coordinator monitors every 15 min.

🚀 **LET'S GO!**
