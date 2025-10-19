# NaviDocs

**Professional marine documentation management platform with intelligent search and OCR**

[![Status](https://img.shields.io/badge/status-alpha-orange)](https://github.com/yourusername/navidocs)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)

---

## Overview

NaviDocs is a production-ready documentation management system designed for the marine industry. It enables boat owners, marina managers, and yacht management companies to organize, search, and access critical equipment manuals, maintenance records, and warranty documentation—even offline.

**Key Features:**
- 🔍 **Intelligent Search** - Sub-100ms full-text search with marine terminology synonyms
- 📄 **OCR Processing** - Automatic text extraction from PDF manuals (3 engine options)
- 📴 **Offline-First** - PWA architecture works without cell signal
- 🔒 **Secure** - Row-level multi-tenancy, JWT auth, tenant-scoped search tokens
- ⚡ **Fast** - SQLite + Meilisearch for instant results
- 📊 **Multi-Tenant Ready** - Supports single boat owners to fleet management companies

---

## Quick Start

### Prerequisites

```bash
node >= 20.0.0
npm >= 10.0.0
```

### Installation

```bash
# Clone repository
git clone http://localhost:4000/ggq-admin/navidocs.git
cd navidocs

# Install dependencies
cd server && npm install
cd ../client && npm install

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your configuration

# Initialize database
npm run init-db
```

### Development

```bash
# Terminal 1: Start services
redis-server                           # Job queue
meilisearch --master-key=yourkey       # Search engine

# Terminal 2: Start backend (port 8001)
cd server
node index.js

# Terminal 3: Start OCR worker
cd server
node workers/ocr-worker.js

# Terminal 4: Start frontend (port 8080)
cd client
npm run dev
```

Visit `http://localhost:8080`

**📘 For detailed setup instructions, see [QUICKSTART.md](QUICKSTART.md)**

---

## Architecture

### Tech Stack

**Backend:**
- Node.js 20 + Express 5
- SQLite (better-sqlite3) with WAL mode
- Meilisearch v1.11+ for search
- BullMQ + Redis for job queuing
- Tesseract OCR (local) or Google Cloud Vision API

**Frontend:**
- Vue 3 (Composition API)
- Vite (dev + build)
- Tailwind CSS
- PDF.js for document viewing

**Infrastructure:**
- Ports: Backend 8001, Frontend 8080, Redis 6379, Meilisearch 7700
- Deployment: StackCP shared hosting ($0) or VPS ($6/mo)

### Database Schema

13-table normalized schema supporting:
- Multi-tenant organizations
- Hierarchical entities (boats → compartments → equipment)
- Document management with OCR
- Permission system
- Service history tracking

**📐 Schema details: [docs/architecture/database-schema.sql](docs/architecture/database-schema.sql)**

---

## Project Structure

```
navidocs/
├── client/               # Vue 3 frontend
│   ├── src/
│   └── vite.config.js
├── server/               # Express backend
│   ├── config/          # Database, Meilisearch config
│   ├── routes/          # API endpoints
│   ├── services/        # OCR, search, queue services
│   ├── workers/         # Background job processors
│   ├── db/              # SQLite database files
│   └── index.js         # Application entry point
├── docs/                # Documentation (see below)
├── scripts/             # Deployment and utility scripts
├── README.md            # This file
└── QUICKSTART.md        # Developer quick start guide
```

### Documentation Structure

```
docs/
├── architecture/        # System design and schema
├── deployment/          # StackCP and VPS deployment guides
├── guides/              # Feature guides (OCR, search, etc.)
├── development/         # Dev setup, port allocation, testing
├── handover/            # Session notes and project handover docs
├── creative/            # Branding and design briefs
├── debates/             # Feature debates and stakeholder analysis
├── roadmap/             # Product roadmap (v1.0-v1.4)
└── analysis/            # Technical analysis documents
```

**📚 Full documentation index: [docs/README.md](docs/README.md)**

---

## Roadmap

### v1.0 MVP - Single Boat Owner (Current: 65% complete)

**Target:** Individual boat owners managing their own manuals
**Timeline:** 2-4 weeks

- [x] SQLite database with 13 tables
- [x] OCR pipeline (Tesseract 85%, Google Drive, Google Vision)
- [x] Background job processing (BullMQ + Redis)
- [x] Upload endpoint with safety pipeline
- [x] Meilisearch integration
- [ ] Frontend UI (Vue components)
- [ ] JWT authentication
- [ ] E2E tests
- [ ] Production deployment

### v1.1 Yacht Management - Multi-Tenant (Q1 2026)

**Target:** Yacht management companies (e.g., Zen Yacht Management)
**Pricing:** $49-149/month based on fleet size

- [ ] Mobile time clock with GPS verification
- [ ] Photo-required work logs (before/after)
- [ ] Boat-specific checklists
- [ ] Real-time owner dashboard
- [ ] Automated invoice generation
- [ ] Warranty database with OCR

**Revenue Potential:** $89,400 ARR (50 companies @ $149/mo avg)

### v1.2+ - Equipment Intelligence, Operations, Compliance

**Detailed roadmap:** [docs/roadmap/MASTER_ROADMAP.md](docs/roadmap/MASTER_ROADMAP.md)

---

## API Overview

### Core Endpoints

```http
POST   /api/upload              # Upload PDF, queue OCR job
GET    /api/jobs/:id            # Job status and progress
POST   /api/search              # Full-text search with filters
GET    /api/documents/:id       # Retrieve document metadata
GET    /api/documents           # List documents (paginated)
POST   /api/search/token        # Generate tenant-scoped search token
GET    /health                  # System health check
```

**📡 Complete API reference: [server/API_SUMMARY.md](server/API_SUMMARY.md)**

---

## Development

### Port Allocation

**CRITICAL:** Before using any port, check the system-wide port registry.

| Service | Port | Notes |
|---------|------|-------|
| Backend API | 8001 | Express server |
| Frontend Dev | 8080 | Vite dev server |
| Redis | 6379 | Job queue |
| Meilisearch | 7700 | Search engine |
| Gitea | 4000 | Git hosting |

**❌ DO NOT use ports 3000-5500** (reserved for other projects)

**📋 Full port registry and development guidelines: [docs/development/DEVELOPMENT.md](docs/development/DEVELOPMENT.md)**

### Testing

```bash
# Run all tests (when implemented)
npm test

# Run E2E tests
npm run test:e2e

# Run specific test suite
npm test -- documents.test.js
```

### Code Style

- ES Modules (`import`/`export`)
- Async/await (no callbacks)
- Destructuring and modern JS features
- 2-space indentation
- Semicolons required

---

## Deployment

### Option A: StackCP Shared Hosting ($0/month)

- Existing hosting account
- Redis Cloud (free 30MB tier)
- Google Cloud Vision API (1K pages/month free)
- Deploy code to `/tmp/navidocs/`, data to `~/navidocs/`

**📦 StackCP deployment guide: [docs/deployment/STACKCP_QUICKSTART.md](docs/deployment/STACKCP_QUICKSTART.md)**

### Option B: VPS ($6/month)

- Full control, no restrictions
- DigitalOcean, Linode, Vultr, etc.
- Recommended for >5,000 documents/month

**🚀 VPS deployment guide: [docs/deployment/VPS_DEPLOYMENT.md](docs/deployment/VPS_DEPLOYMENT.md)** *(coming soon)*

---

## Contributing

We welcome contributions! Before submitting a PR:

1. **Check the port registry** before adding services with ports
2. **Run tests** (`npm test`)
3. **Follow code style** (ESLint + Prettier)
4. **Update documentation** for user-facing changes
5. **Add tests** for new features

**Development workflow:**
```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes, commit
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature
```

---

## Security

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Email: security@yourcompany.com (or create private security advisory)

### Security Features

- ✅ Helmet security headers (CSP, HSTS)
- ✅ Rate limiting (10 uploads/hour, 30 searches/minute)
- ✅ JWT authentication with secure tokens
- ✅ Tenant-scoped search tokens (1-hour TTL)
- ✅ File validation pipeline (extension, magic byte, qpdf, ClamAV)
- ✅ Row-level multi-tenancy (org_id filters)

**🔒 Security details: [docs/architecture/hardened-production-guide.md](docs/architecture/hardened-production-guide.md)**

---

## Performance

- **Search latency:** < 100ms (Meilisearch)
- **OCR processing:** 1-3 minutes per 100-page PDF (Tesseract)
- **Upload limit:** 50MB per file (configurable)
- **Concurrent OCR jobs:** 2 (configurable via `OCR_CONCURRENCY`)
- **Database:** SQLite handles millions of rows, migration path to PostgreSQL available

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Support

- **Documentation:** [docs/](docs/)
- **Quick Start:** [QUICKSTART.md](QUICKSTART.md)
- **Roadmap:** [docs/roadmap/MASTER_ROADMAP.md](docs/roadmap/MASTER_ROADMAP.md)
- **Issues:** [GitHub Issues](https://github.com/yourusername/navidocs/issues) (or Gitea)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/navidocs/discussions) (or forum)

---

## Acknowledgments

Built with:
- [Meilisearch](https://www.meilisearch.com/) - Lightning-fast search
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) - Open-source OCR engine
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [Express](https://expressjs.com/) - Web framework for Node.js
- [SQLite](https://www.sqlite.org/) - Embedded relational database

---

## Project Status

**Current Phase:** v1.0 MVP Development (65% complete)
**Last Updated:** 2025-10-19
**Active Development:** Yes
**Production Ready:** No (alpha)

**Next Milestones:**
1. Complete frontend UI (1-2 days)
2. Add authentication (1 day)
3. Deploy single boat demo (1 day)
4. Beta testing with 5-10 users (1 week)

---

<p align="center">
  <strong>Ship it. Learn from users. Iterate.</strong>
</p>

<p align="center">
  Made with ⚓ for the marine community
</p>
