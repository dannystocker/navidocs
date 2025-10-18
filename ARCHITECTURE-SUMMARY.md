# NaviDocs Architecture Summary

**Status:** Design Complete ✅  
**Next Phase:** Implementation  
**Created:** 2025-01-19

---

## 📋 What We've Built

A **future-proof, multi-vertical document management platform** for boat owners, marinas, and property managers.

---

## 🎯 Core Architectural Decisions

### 1. **Hybrid Database Strategy**
- **SQLite** for transactional data (users, boats, documents)
- **Meilisearch** for search-optimized queries
- Migration path to PostgreSQL when scaling requires it

**Why:** Search-first architecture. Every query is a search query, not a SQL JOIN.

### 2. **Multi-Vertical Schema**
- Designed for boats (v1.0)
- Expandable to marinas, properties, HOAs (v1.1+)
- Unified hierarchy: Organization → Entity → Sub-Entity → Component → Document

**Why:** Patterns are identical across verticals. Build once, reuse everywhere.

### 3. **Security-First**
- Tenant tokens (NOT master keys in client)
- Background queue for CPU-intensive OCR
- File safety pipeline (qpdf + ClamAV + validation)
- Rate limiting on all endpoints

**Why:** Expert panel identified these as production killers if skipped.

### 4. **Offline-First PWA**
- Service worker caches critical manuals
- Works 20 miles offshore with no cell signal
- IndexedDB for local state

**Why:** Boat owners need manuals when engines fail at sea.

### 5. **Synonym-Rich Search**
- 40+ boat terminology synonyms ("bilge" → "sump pump")
- Typo tolerance (Meilisearch built-in)
- Future: semantic search with embeddings

**Why:** Boat owners don't know technical jargon.

---

## 📊 Schema Design

### SQLite Tables (13 tables)
```
Core: users, organizations, user_organizations
Entities: entities, sub_entities, components
Documents: documents, document_pages, ocr_jobs
Permissions: permissions, document_shares
UX: bookmarks
```

### Meilisearch Index
```
Index: navidocs-pages
Documents: One per PDF page
Searchable: title, text, systems, categories, tags
Filterable: boatId, userId, make, model, year, etc
Synonyms: 40+ boat terminology mappings
```

**Key Insight:** Each PDF page is a separate Meilisearch document. No JOINs needed.

---

## 🚀 Technology Stack

### Backend
- Node.js v20 (Express or Fastify)
- SQLite3 (better-sqlite3)
- Meilisearch v1.6.2
- BullMQ (or SQLite-based queue fallback)
- Tesseract.js (OCR)
- qpdf + ClamAV (file safety)

### Frontend
- Vue 3 + Vite
- Tailwind CSS
- PDF.js (document viewer)
- Meilisearch-inspired design (clean, professional, SVG icons)
- PWA (offline support)

### Security
- Helmet (CSP, HSTS headers)
- express-rate-limit
- JWT auth
- Tenant tokens (Meilisearch)

---

## 🎨 Design Philosophy

**Inspired by:** https://www.meilisearch.com/  
**Visual Language:**
- Clean, spacious layouts
- Professional SVG icons (no emojis)
- Muted color palette (grays, blues, whites)
- Typography: SF Pro / Inter / Roboto
- Expensive, grown-up aesthetic

**NOT:** Playful, colorful, emoji-heavy consumer apps

---

## 📈 Scaling Strategy

### Day 1 (MVP)
- SQLite (< 100k documents)
- Single Meilisearch instance
- Single-tenant (one user, multiple boats)

### Month 6 (Growth)
- Still SQLite (works up to 1M documents)
- Meilisearch cluster (if > 10k searches/day)
- Multi-tenant (organizations)

### Year 1 (Scale)
- Migrate to PostgreSQL
- Add pgvector for semantic search
- Cloudflare CDN for PDFs
- Separate OCR worker VPS

---

## 🔒 Security Hardening Checklist

- [ ] Never expose Meilisearch master key to client
- [ ] Use tenant tokens (1-hour TTL)
- [ ] Background queue for OCR (prevent CPU spikes)
- [ ] File safety: extension + magic byte + qpdf + ClamAV
- [ ] Rate limiting: 10 uploads/hour, 30 searches/minute
- [ ] Helmet security headers (CSP, HSTS)
- [ ] HTTPS only (no HTTP)
- [ ] Rotate API keys monthly

---

## 🧪 Testing Strategy

### Unit Tests (Jest/Vitest)
- Database models
- Search service
- OCR pipeline
- File validation

### Integration Tests
- Upload → OCR → Index → Search
- User auth flow
- Permission checks

### E2E Tests (Playwright)
- Upload PDF
- Search and view results
- Offline mode
- Mobile responsive

---

## 📦 Expert Panel Consensus

**47 minutes of debate:**
- Database Architect: "Future-proof for Postgres migration"
- Search Engineer: "Search-first, not relational-first"
- DevOps: "Append-only schema, no breaking changes"
- Data Scientist: "Embedding field from day 1 (even if null)"
- Backend Lead: "Hybrid approach wins"

**Result:** SQLite + Meilisearch hybrid, designed for Postgres migration.

**38 minutes with boating experts:**
- Marine Surveyor: "Emergency scenarios = offline required"
- Marina Manager: "Shared component library (10 boats, same Volvo engine)"
- Yacht Broker: "Resale value = complete documentation history"

**Result:** Offline PWA, shared manuals, service tracking.

**29 minutes with property/marina experts:**
- Multi-entity hierarchy (XYZ Corp → Marina A → Dock 1 → Slip 42)
- Compliance tracking (inspections, certifications)
- Geo-search for physical assets

**Result:** Schema supports vertical expansion.

---

## 📂 Repository Structure

```
navidocs/
├── docs/
│   ├── debates/
│   │   └── 01-schema-and-vertical-analysis.md
│   ├── architecture/
│   │   ├── database-schema.sql
│   │   ├── meilisearch-config.json
│   │   └── hardened-production-guide.md
│   └── roadmap/
│       ├── v1.0-mvp.md
│       └── 2-week-launch-plan.md
├── server/          (TBD: Extract from lilian1)
├── client/          (TBD: Build from scratch)
├── README.md
└── ARCHITECTURE-SUMMARY.md (this file)
```

---

## 🎯 Success Criteria (MVP Launch)

**Technical:**
- [ ] Upload PDF → searchable in < 5 minutes
- [ ] Search latency < 100ms
- [ ] Synonym search works ("bilge" finds "sump")
- [ ] All fields display correctly
- [ ] Offline mode functional

**Security:**
- [ ] Zero master keys in client code
- [ ] Tenant tokens expire after 1 hour
- [ ] All PDFs sanitized
- [ ] Rate limits prevent abuse

**User Experience:**
- [ ] Upload success rate > 95%
- [ ] Search relevance 4/5+ rating
- [ ] Mobile usable without zooming

---

## 🚦 Next Steps

1. **Analyze lilian1** - Extract clean code, identify Frank-AI junk
2. **Bootstrap NaviDocs** - Create server/ and client/ structure
3. **Implement core features** - Upload, OCR, Search
4. **Playwright tests** - E2E coverage
5. **Local deployment** - Test with real boat manuals
6. **Beta launch** - 5-10 boat owners

---

**The war council has spoken. Time to build.**

