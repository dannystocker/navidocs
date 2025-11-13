# Cloud Session 1: Photo Inventory System

**Session ID:** CLOUD-1-PHOTO-INVENTORY
**Timeline:** 90 minutes
**Deadline:** 4 hours from now (Riviera Plaisance presentation)
**Target:** Build boat photo gallery + inventory tagging system

---

## Your Mission

Add sticky daily-use photo management to NaviDocs MVP. Boat owners should be able to:
- Upload boat photos (exterior, interior, systems)
- Tag photos by system (engine, electrical, hull, interior)
- Search photos by tag
- View inventory checklist with photo evidence
- Export photo inventory for insurance/resale documentation

This solves the **"€15K-€50K forgotten value" problem** - owners can't remember what upgrades they have until resale.

---

## Quick Start

1. **Clone repo:**
   ```bash
   git clone https://github.com/dannystocker/navidocs.git && cd navidocs
   ```

2. **Read your brief:**
   ```bash
   cat /home/setup/navidocs/CLOUD_SESSION_1_MARKET_RESEARCH.md | head -80
   ```

3. **Check current blockers:**
   ```bash
   cat /home/setup/navidocs/SESSION_DEBUG_BLOCKERS.md
   ```

4. **Review codebase structure:**
   - **Frontend:** `/src/app/` (Next.js 14 with App Router)
   - **API:** `/src/api/` (Prisma + Meilisearch)
   - **Database:** `schema.prisma` (13 tables, photos table ready)
   - **Components:** `/src/components/` (Tailwind + shadcn/ui)

---

## Your Task List

- [ ] **Design:** Photo upload UI component (drag-drop, multi-select)
- [ ] **Database:** Extend `PhotoInventory` table with tags (engine, electrical, hull, interior, etc.)
- [ ] **API:** Create 3 endpoints:
  - `POST /api/photos/upload` - Store with system tags
  - `GET /api/photos/by-tag/:tag` - Filter by system type
  - `GET /api/photos/inventory-list` - Full inventory with photo count
- [ ] **Frontend:** Photo gallery grid component with tag filtering
- [ ] **Search Integration:** Add photo metadata to Meilisearch index
- [ ] **Git commit:** `[AGENT-1] Add photo inventory system with tag filtering`
- [ ] **Create issue:** `[AGENT-1] DEPLOY-READY: Photo Inventory System` with:
  - Screenshots of photo upload & gallery
  - API test results
  - Estimated storage impact
  - Deployment steps for StackCP

---

## Technical Context

**Stack:**
- Frontend: Next.js 14 (App Router)
- API: Node.js + Prisma ORM
- Database: PostgreSQL (17 tables)
- Search: Meilisearch (already integrated)
- Storage: StackCP filesystem (`/public/uploads/photos/`)
- UI: Tailwind CSS + shadcn/ui components

**Key Files to Modify:**
- `prisma/schema.prisma` - Add photo tags
- `src/app/api/photos/route.ts` - Create upload endpoints
- `src/components/PhotoGallery.tsx` - Create gallery UI
- `src/app/inventory/photos/page.tsx` - Photo inventory page

**Design Specs:**
- Photo upload max: 5MB per image (JPEG/PNG)
- Supported tags: engine, electrical, hull, interior, deck, safety, upgrade, other
- Gallery: 3-column grid (desktop), 2-column (tablet), 1-column (mobile)
- Tag filter: Multi-select with counts (e.g., "Engine (12)")

---

## Critical Notes

1. **Demo Focus:** Owners see boat photos + auto-populated inventory list with photo evidence
2. **Sticky Engagement:** "Check boat photos while away" = daily app habit
3. **Insurance Value:** Photo timestamped inventory = proof of ownership/upgrades
4. **Resale Value:** Export photo manifest to potential buyers
5. **Must work offline:** Photos should load from cache for remote boats

---

## GitHub Access

- **Repo:** https://github.com/dannystocker/navidocs
- **Branch:** `feature/photo-inventory` (create from main)
- **Base for PR:** main branch
- **Code review:** Not required (direct commit to feature branch)

---

## Success Criteria

✅ Photo upload working (multi-select, drag-drop)
✅ Photos visible in gallery with tags
✅ Search filters by tag return correct results
✅ API endpoints return correct JSON
✅ No console errors in browser/server
✅ Component responsive on mobile/tablet/desktop
✅ Git commit with [AGENT-1] tag

---

## If Blocked

1. Check `/home/setup/navidocs/SESSION_DEBUG_BLOCKERS.md` for known issues
2. Verify PostgreSQL connection: `echo "SELECT version()" | psql`
3. Verify Meilisearch running: `curl http://localhost:7700/health`
4. Review existing photos API: `grep -r "POST /api/photos" src/`
5. Create issue: `[AGENT-1] BLOCKER: [description]`

---

## Questions?

Read these files for context:
- `ARCHITECTURE-SUMMARY.md` - System design
- `BUILD_COMPLETE.md` - What's already working
- `DEMO-GUIDE.md` - Feature showcase guide
