# NaviDocs Documentation

Complete documentation for NaviDocs marine documentation management platform.

---

## Quick Links

- **New to NaviDocs?** → Start with [QUICKSTART.md](../QUICKSTART.md)
- **Deploying to production?** → See [deployment/](#deployment)
- **Want to contribute?** → Read [development/DEVELOPMENT.md](development/DEVELOPMENT.md)
- **Looking for roadmap?** → Check [roadmap/MASTER_ROADMAP.md](roadmap/MASTER_ROADMAP.md)

---

## Documentation Structure

### 📐 Architecture

System design, database schema, and architectural decisions.

- **[ARCHITECTURE-SUMMARY.md](architecture/ARCHITECTURE-SUMMARY.md)** - High-level architecture overview
- **[database-schema.sql](architecture/database-schema.sql)** - Complete SQL schema (13 tables)
- **[meilisearch-config.json](architecture/meilisearch-config.json)** - Search engine configuration
- **[hardened-production-guide.md](architecture/hardened-production-guide.md)** - Security hardening checklist

**Key Decisions:**
- Hybrid database strategy (SQLite + Meilisearch)
- Multi-vertical schema (boats → marinas → properties)
- Security-first design (tenant tokens, file safety pipeline)
- Offline-first PWA architecture

---

### 🚀 Deployment

Deployment guides for StackCP shared hosting and VPS.

- **[STACKCP_QUICKSTART.md](deployment/STACKCP_QUICKSTART.md)** - 30-minute StackCP deployment
- **[DEPLOYMENT_STACKCP.md](deployment/DEPLOYMENT_STACKCP.md)** - Detailed StackCP guide
- **[STACKCP_EVALUATION_REPORT.md](deployment/STACKCP_EVALUATION_REPORT.md)** - StackCP evaluation results
- **[STACKCP_VERIFICATION_SUMMARY.md](deployment/STACKCP_VERIFICATION_SUMMARY.md)** - Test results on StackCP
- **[STACKCP_ARCHITECTURE_ANALYSIS.md](deployment/STACKCP_ARCHITECTURE_ANALYSIS.md)** - Technical deep-dive
- **[STACKCP_DEBATE_BRIEF.md](deployment/STACKCP_DEBATE_BRIEF.md)** - Deployment decision framework
- **[STACKCP_QUICK_REFERENCE.md](deployment/STACKCP_QUICK_REFERENCE.md)** - Quick decision-making tool

**Deployment Options:**
1. **StackCP** ($0/month) - Existing shared hosting + cloud services
2. **VPS** ($6/month) - Full control, recommended for production

**Key Findings:**
- StackCP requires split code/data locations (`/tmp` for code, `~/` for data)
- Redis Cloud + Google Vision API recommended for StackCP
- VPS deployment is standard Node.js application

---

### 📚 Guides

Feature guides and how-tos for OCR, search, and other features.

- **[OCR_PIPELINE_SETUP.md](guides/OCR_PIPELINE_SETUP.md)** - Complete OCR pipeline guide
- **[OCR_FINAL_RECOMMENDATION.md](guides/OCR_FINAL_RECOMMENDATION.md)** - OCR strategy recommendation
- **[OCR_OPTIONS.md](guides/OCR_OPTIONS.md)** - Comparison of 3 OCR engines
- **[GOOGLE_DRIVE_OCR_QUICKSTART.md](guides/GOOGLE_DRIVE_OCR_QUICKSTART.md)** - Google Drive OCR setup
- **[GOOGLE_OCR_COMPARISON.md](guides/GOOGLE_OCR_COMPARISON.md)** - Drive API vs Vision API

**OCR Engine Options:**
1. **Tesseract** - Local, free, 85% confidence (working)
2. **Google Drive API** - Unlimited free, handwriting support
3. **Google Cloud Vision API** - 1K pages/month free, recommended for production

**Hybrid System:** Auto-selects best available engine with fallback

---

### 🔧 Development

Development setup, port allocation, testing, and build documentation.

- **[DEVELOPMENT.md](development/DEVELOPMENT.md)** - **CRITICAL:** System-wide port registry + dev guidelines
- **[PORT_ALLOCATION.md](development/PORT_ALLOCATION.md)** - Port allocation strategy
- **[PORT_MIGRATION_SUMMARY.md](development/PORT_MIGRATION_SUMMARY.md)** - Port migration documentation
- **[BUILD_COMPLETE.md](development/BUILD_COMPLETE.md)** - Build process documentation
- **[IMPLEMENTATION_COMPLETE.md](development/IMPLEMENTATION_COMPLETE.md)** - Implementation notes
- **[TEST_RESULTS.md](development/TEST_RESULTS.md)** - Testing documentation

**Important for Developers:**
- **ALWAYS check [DEVELOPMENT.md](development/DEVELOPMENT.md) before using any port**
- NaviDocs uses ports 8001, 8080, 6379, 7700
- Ports 3000-5500 are **FORBIDDEN** (reserved for other projects)
- Run `sudo lsof -i :PORT` to verify availability

**Development Workflow:**
```bash
# Read port registry first!
cat docs/development/DEVELOPMENT.md

# Start services
redis-server
meilisearch --master-key=yourkey
cd server && node index.js       # Port 8001
cd client && npm run dev          # Port 8080
```

---

### 📋 Handover

Session notes, project handover documents, and status updates.

- **[NAVIDOCS_HANDOVER.md](handover/NAVIDOCS_HANDOVER.md)** - Complete project handover (65% MVP)
- **[SESSION_STATUS.md](handover/SESSION_STATUS.md)** - Session status summary
- **[SERVICES_STATUS.md](handover/SERVICES_STATUS.md)** - Current service status
- **[GITEA_ACCESS.md](handover/GITEA_ACCESS.md)** - Gitea repository access notes
- **[ANALYSIS_INDEX.md](handover/ANALYSIS_INDEX.md)** - StackCP analysis overview

**Current Status (2025-10-19):**
- v1.0 MVP: 65% complete
- Database: 13 tables, initialized
- OCR: 3 engines implemented (Tesseract working at 85%)
- Backend: Core routes functional
- Frontend: 20% complete
- Deployment: Ready for StackCP or VPS

**Next Steps:**
1. Complete frontend UI (1-2 days)
2. Add authentication (1 day)
3. Deploy single boat demo (1 day)

---

### 🎨 Creative

Branding, design briefs, and visual identity documentation.

- **[BRANDING_CREATIVE_BRIEF.md](creative/BRANDING_CREATIVE_BRIEF.md)** - Comprehensive brand identity brief (542 lines)

**For Designers:**
- 5 logo concept options (compass, document+wave, search beacon, ND monogram, abstract boat)
- Color palette (navy blue, ocean blue, neutral grays)
- Typography suggestions (SF Pro, Inter, Roboto)
- Technical specifications (SVG, PNG, favicon formats)
- Success metrics (favicon test, squint test, B&W test)

**Brand Personality:**
- Professional (90%), Trustworthy (90%), Reliable (85%)
- Meilisearch-inspired aesthetic (clean, modern, spacious)
- "Expensive, grown-up" feel - enterprise software, not consumer app

---

### 💬 Debates

Feature debates and stakeholder analysis documents.

- **[01-schema-and-vertical-analysis.md](debates/01-schema-and-vertical-analysis.md)** - Database schema design debate
- **[02-yacht-management-features.md](debates/02-yacht-management-features.md)** - Yacht management stakeholder debate

**Debate Topics:**
1. **Schema Design** (47 minutes) - SQLite vs PostgreSQL, single vs multi-tenant
2. **Yacht Management** (90 minutes) - 6 stakeholders, 18 features identified

**Key Outcomes:**
- Hybrid SQLite + Meilisearch approach approved
- Multi-tenant schema from day 1 (future-proof)
- v1.1 yacht management features validated ($89K ARR potential)

---

### 🗺️ Roadmap

Product roadmap from v1.0 MVP through v1.4 and future verticals.

- **[MASTER_ROADMAP.md](roadmap/MASTER_ROADMAP.md)** - Complete roadmap (v1.0-v1.4 + verticals)
- **[v1.0-mvp.md](roadmap/v1.0-mvp.md)** - MVP features and timeline
- **[2-week-launch-plan.md](roadmap/2-week-launch-plan.md)** - Intensive 2-week launch plan

**Roadmap Summary:**

**v1.0 MVP** (2-4 weeks) - Single Boat Owner
- Document upload + OCR + search
- Offline PWA
- Basic auth
- **Status:** 65% complete

**v1.1 Yacht Management** (Q1 2026) - Multi-Tenant
- Time tracking with GPS
- Photo-required work logs
- Warranty database
- Automated invoicing
- **Revenue:** $89K ARR potential

**v1.2 Equipment Intelligence** (Q2 2026)
- Equipment database
- Warranty OCR + expiration alerts
- Service history tracking

**v1.3 Operational Efficiency** (Q3 2026)
- Task assignment system
- Voice-to-text logs
- Handoff notes

**v1.4 Compliance** (Q4 2026)
- Tamper-proof audit logs
- Safety equipment tracking
- Tax-ready reports

**Future:** Marina management, property management, commercial fleets

---

### 📊 Analysis

Technical analysis and evaluation documents.

- **[lilian1-extraction-plan.md](analysis/lilian1-extraction-plan.md)** - Plan for extracting code from legacy project

---

## Search This Documentation

### By Topic

**Getting Started:**
- [QUICKSTART.md](../QUICKSTART.md)
- [Architecture Overview](architecture/ARCHITECTURE-SUMMARY.md)
- [Deployment Options](deployment/)

**Development:**
- [Port Registry](development/DEVELOPMENT.md) ⚠️ Read this FIRST
- [Testing](development/TEST_RESULTS.md)
- [Build Process](development/BUILD_COMPLETE.md)

**Features:**
- [OCR Setup](guides/OCR_PIPELINE_SETUP.md)
- [Search Configuration](architecture/meilisearch-config.json)
- [Multi-Tenant Design](roadmap/MASTER_ROADMAP.md#multi-tenant-architecture-strategy)

**Deployment:**
- [StackCP Quick Start](deployment/STACKCP_QUICKSTART.md) (30 minutes)
- [StackCP Evaluation](deployment/STACKCP_EVALUATION_REPORT.md) (comprehensive)
- [VPS Deployment](deployment/) (coming soon)

### By Role

**For Developers:**
1. Read [DEVELOPMENT.md](development/DEVELOPMENT.md) - Port registry + guidelines
2. Read [QUICKSTART.md](../QUICKSTART.md) - Local setup
3. Read [Architecture](architecture/ARCHITECTURE-SUMMARY.md) - System design
4. Read [Roadmap](roadmap/MASTER_ROADMAP.md) - Feature plan

**For DevOps/Deployment:**
1. Read [StackCP Quick Start](deployment/STACKCP_QUICKSTART.md) - Fast deploy
2. Read [StackCP Evaluation](deployment/STACKCP_EVALUATION_REPORT.md) - Detailed analysis
3. Read [Architecture](architecture/hardened-production-guide.md) - Security hardening

**For Product/Business:**
1. Read [Roadmap](roadmap/MASTER_ROADMAP.md) - Complete product plan
2. Read [Yacht Management Debate](debates/02-yacht-management-features.md) - Feature validation
3. Read [Handover](handover/NAVIDOCS_HANDOVER.md) - Current status

**For Designers:**
1. Read [Branding Brief](creative/BRANDING_CREATIVE_BRIEF.md) - Complete design brief
2. Read [Architecture Summary](architecture/ARCHITECTURE-SUMMARY.md) - Design philosophy

---

## Documentation Standards

### File Naming

- `UPPERCASE_WITH_UNDERSCORES.md` - Project-level docs (root)
- `lowercase-with-dashes.md` - Feature-specific docs (subfolders)
- `01-descriptive-name.md` - Numbered series (debates)

### Folder Organization

```
docs/
├── architecture/        # System design (rarely changes)
├── deployment/          # Deployment guides (per platform)
├── guides/              # Feature guides (per feature)
├── development/         # Dev setup (changes with each port/setup change)
├── handover/            # Session notes (per session)
├── creative/            # Brand/design (rarely changes)
├── debates/             # Feature debates (one per major decision)
├── roadmap/             # Product roadmap (quarterly updates)
└── analysis/            # Technical analysis (per analysis)
```

### Markdown Style

- Use `#` for document title (only one per file)
- Use `##` for main sections
- Use `###` for subsections
- Use `---` for horizontal rules
- Use code blocks with language tags
- Use tables for comparison data
- Use checkboxes for task lists

---

## Contributing to Documentation

### Adding New Documentation

1. **Choose the right folder** (see folder organization above)
2. **Follow naming conventions** (see file naming above)
3. **Update this README** (add link in appropriate section)
4. **Add to git** (`git add docs/...`)
5. **Commit with clear message** (`docs: Add X guide`)

### Updating Existing Documentation

1. **Read the doc first** (understand current content)
2. **Make targeted changes** (don't rewrite unnecessarily)
3. **Update "Last Updated" date** (if present)
4. **Commit with clear message** (`docs: Update X with Y`)

### Documentation Quality Checklist

- [ ] Clear, concise title
- [ ] Table of contents (if >500 lines)
- [ ] Code examples with syntax highlighting
- [ ] Links to related docs
- [ ] Real-world examples
- [ ] Troubleshooting section (if applicable)
- [ ] Last updated date
- [ ] Spell check passed

---

## Quick Reference

### Most Important Docs (Read These First)

1. **[README.md](../README.md)** - Project overview
2. **[QUICKSTART.md](../QUICKSTART.md)** - Get started in 10 minutes
3. **[DEVELOPMENT.md](development/DEVELOPMENT.md)** - Port registry + dev guidelines
4. **[MASTER_ROADMAP.md](roadmap/MASTER_ROADMAP.md)** - Complete product plan
5. **[NAVIDOCS_HANDOVER.md](handover/NAVIDOCS_HANDOVER.md)** - Current status

### Most Referenced Docs

- **Port Registry:** [development/DEVELOPMENT.md](development/DEVELOPMENT.md)
- **Database Schema:** [architecture/database-schema.sql](architecture/database-schema.sql)
- **OCR Setup:** [guides/OCR_PIPELINE_SETUP.md](guides/OCR_PIPELINE_SETUP.md)
- **Deployment:** [deployment/STACKCP_QUICKSTART.md](deployment/STACKCP_QUICKSTART.md)

---

## Document Statistics

- **Total Documents:** 33 files
- **Root Files:** 2 (README.md, QUICKSTART.md)
- **Architecture Docs:** 4 files
- **Deployment Docs:** 7 files
- **Guide Docs:** 5 files
- **Development Docs:** 6 files
- **Handover Docs:** 5 files
- **Creative Docs:** 1 file
- **Debate Docs:** 2 files
- **Roadmap Docs:** 3 files
- **Analysis Docs:** 1 file

**Last Updated:** 2025-10-19
**Documentation Coverage:** 95%+ (only missing VPS deployment guide)

---

## Support

- **Questions?** Check [QUICKSTART.md](../QUICKSTART.md) or [DEVELOPMENT.md](development/DEVELOPMENT.md)
- **Issues?** See [handover/NAVIDOCS_HANDOVER.md](handover/NAVIDOCS_HANDOVER.md) known issues
- **Contributing?** Read [development/DEVELOPMENT.md](development/DEVELOPMENT.md) guidelines

---

**Happy documenting! 📚**
