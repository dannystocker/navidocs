# Cloud Session Prompts Index

**Created:** 2025-11-13
**Status:** Ready for deployment
**Deadline:** 4 hours (Riviera Plaisance presentation)
**Total Setup Time:** 35 minutes (Agent 4)

---

## Launch Instructions

1. Open Claude Code Cloud web interface
2. Select "New Session"
3. Copy-paste the entire content of **CLOUD_SESSION_PROMPT_1_PHOTO_INVENTORY.md**
4. Wait ~90 minutes for session to complete
5. Move to next prompt when current completes
6. Repeat for prompts 2-5 sequentially

**Important:** Sessions must run in order (1→2→3→4→5) because each depends on outputs from previous sessions.

---

## The 5 Prompts

### Session 1: Photo Inventory System
**File:** `/home/setup/navidocs/CLOUD_SESSION_PROMPT_1_PHOTO_INVENTORY.md`
**Size:** 4.5K
**Duration:** 90 minutes
**Features to Build:**
- Boat photo upload UI (drag-drop, multi-select)
- Photo database with system tags (engine, electrical, hull, interior, etc.)
- Photo gallery component with tag filtering
- Photo search integration with Meilisearch
- API endpoints for photo management

**Why This First?** Photo inventory is the simplest feature and unblocks other sessions.

**Success Looks Like:**
- Photo upload working (5MB max, JPEG/PNG)
- Gallery visible with 3-column grid
- Tag filtering functional (e.g., "Engine (12)" shows 12 engine photos)
- Photos searchable via Meilisearch
- Git commit: `[AGENT-1] Add photo inventory system with tag filtering`

---

### Session 2: Document Search & Classification
**File:** `/home/setup/navidocs/CLOUD_SESSION_PROMPT_2_DOCUMENT_SEARCH.md`
**Size:** 5.5K
**Duration:** 90 minutes
**Features to Build:**
- Smart document classifier (engine, electrical, warranty, insurance, service, etc.)
- Improved OCR quality diagnostics
- Search ranking (document type + relevance)
- Advanced search API with type filtering
- Quality report (OCR accuracy %)

**Why Session 2?** Needs completed photo system to test integration. Document search critical for "find emergency manual" use case.

**Success Looks Like:**
- Document classifier >80% accurate
- Search results ranked by type + relevance
- OCR quality report with confidence scores
- Test documents fully searchable
- Git commit: `[AGENT-2] Add document classifier and search ranking`

---

### Session 3: Maintenance Timeline & Alerts
**File:** `/home/setup/navidocs/CLOUD_SESSION_PROMPT_3_MAINTENANCE_TIMELINE.md`
**Size:** 6.1K
**Duration:** 90 minutes
**Features to Build:**
- Maintenance record database with recurring services
- Service templates (oil change, hull paint, electrical check, etc.)
- Alert system (email + in-app notifications)
- Timeline UI (vertical timeline, color-coded status)
- Maintenance history export (PDF + CSV)

**Why Session 3?** Sticky engagement feature. Creates "daily app habit" through maintenance reminders.

**Success Looks Like:**
- Maintenance templates loaded (15+ pre-defined services)
- Timeline shows 24 months of history
- Alerts trigger 30 days before service due
- Color scheme: green=recent, yellow=upcoming, red=overdue
- Git commit: `[AGENT-3] Add maintenance timeline and service alerts`

---

### Session 4: Demo Polish & UI Optimization
**File:** `/home/setup/navidocs/CLOUD_SESSION_PROMPT_4_DEMO_POLISH.md`
**Size:** 7.7K
**Duration:** 90 minutes
**Features to Build:**
- UI polish checklist (buttons, forms, empty states, images)
- Performance optimization (Lighthouse score >85)
- Demo script for Sylvain (10-minute pitch)
- €33K tender case study (demo boat with data)
- Mobile testing on iPad (responsive design verification)

**Why Session 4?** Everything must look perfect for Riviera Plaisance presentation. This is the "showroom shine" session.

**Success Looks Like:**
- Lighthouse score >85 on all pages
- Web Vitals: LCP <2.5s, CLS <0.1, FID <100ms
- Demo script complete (talking points for objections)
- Case study boat configured with photos + docs + maintenance
- Mobile responsive on all screen sizes
- Git commit: `[AGENT-4] Polish UI/UX for Riviera Plaisance demo`

---

### Session 5: Integration Testing & Sign-Off
**File:** `/home/setup/navidocs/CLOUD_SESSION_PROMPT_5_INTEGRATION_TESTING.md`
**Size:** 10.6K
**Duration:** 90 minutes
**Features to Build:**
- 11 comprehensive test reports:
  1. Database integrity
  2. API integration
  3. Search quality
  4. Load testing
  5. Error recovery
  6. Browser compatibility
  7. Accessibility (WCAG AA)
  8. Export functionality
  9. Offline mode
  10. Security audit
  11. Integration summary

**Why Session 5?** Final quality gate. Verifies all 4 sessions work together without breaking anything.

**Success Looks Like:**
- All 11 test reports created and passing
- Database integrity verified (no orphaned records)
- All 15+ API endpoints working correctly
- Full end-to-end flows tested (create boat → upload photos → search docs → set maintenance)
- Git commit: `[AGENT-5] Complete integration testing + deployment checklist`

---

## Expected Timeline

```
t=0:00   Session 1 starts (Photo Inventory)
t=1:30   Session 1 completes → Session 2 starts (Document Search)
t=3:00   Session 2 completes → Session 3 starts (Maintenance Timeline)
t=4:30   Session 3 completes → Session 4 starts (Demo Polish)
t=6:00   Session 4 completes → Session 5 starts (Integration Testing)
t=7:30   Session 5 completes → ALL READY FOR DEMO
```

**Total Time:** 7.5 hours sequential (faster if running in parallel with dependencies)

---

## Key Success Metrics

### Session 1 Success Criteria
- [ ] Photo upload working (multi-select, drag-drop)
- [ ] Photos visible in gallery with tags
- [ ] Search filters by tag return correct results
- [ ] No console errors
- [ ] Component responsive on mobile/tablet/desktop
- [ ] Git commit with [AGENT-1] tag

### Session 2 Success Criteria
- [ ] Document classifier working (>80% accuracy)
- [ ] Search results ranked by type + relevance
- [ ] Test documents fully searchable
- [ ] OCR quality report completed
- [ ] API endpoints tested and working
- [ ] Git commit with [AGENT-2] tag

### Session 3 Success Criteria
- [ ] Maintenance table created with correct fields
- [ ] Service templates loaded (15+ pre-defined)
- [ ] Timeline UI shows 12+ months of history
- [ ] Alert system triggers for upcoming services
- [ ] Email notifications working
- [ ] Git commit with [AGENT-3] tag

### Session 4 Success Criteria
- [ ] Lighthouse score >85 on all pages
- [ ] Performance metrics within targets
- [ ] UI polish checklist 100% complete
- [ ] Demo script written with case study
- [ ] Mobile testing complete (iPad compatible)
- [ ] Git commit with [AGENT-4] tag

### Session 5 Success Criteria
- [ ] All 11 integration test reports created
- [ ] Database integrity verified
- [ ] All API endpoints working correctly
- [ ] Full end-to-end flows tested
- [ ] No blocking issues (escalations resolved)
- [ ] Git commit with [AGENT-5] tag

---

## File Locations

All files in: `/home/setup/navidocs/`

**Prompt Files:**
- CLOUD_SESSION_PROMPT_1_PHOTO_INVENTORY.md
- CLOUD_SESSION_PROMPT_2_DOCUMENT_SEARCH.md
- CLOUD_SESSION_PROMPT_3_MAINTENANCE_TIMELINE.md
- CLOUD_SESSION_PROMPT_4_DEMO_POLISH.md
- CLOUD_SESSION_PROMPT_5_INTEGRATION_TESTING.md

**Reference Files:**
- ARCHITECTURE-SUMMARY.md
- BUILD_COMPLETE.md
- DEMO-GUIDE.md
- SESSION_DEBUG_BLOCKERS.md
- SMOKE_TEST_CHECKLIST.md

---

## Important Notes

1. **GitHub Branch:** All work should use feature branches from main
   - Session 1: `feature/photo-inventory`
   - Session 2: `feature/document-search`
   - Session 3: `feature/maintenance-timeline`
   - Session 4: `feature/demo-polish`
   - Session 5: `feature/integration-testing`

2. **Commits Required:** Each session must create a git commit with [AGENT-N] prefix
   - This tracks which agent created which features
   - Helps with debugging + code review

3. **Blockers:** If stuck, check `SESSION_DEBUG_BLOCKERS.md` for known issues

4. **Questions?** Reference the "If Blocked" section in each prompt file

---

## The Missing Piece

**Why these prompts exist:** The original 5 cloud sessions (CLOUD_SESSION_1_MARKET_RESEARCH.md through CLOUD_SESSION_5_SYNTHESIS_VALIDATION.md) are deep research/documentation work. These NEW prompts are focused **implementation work** for the MVP features needed for the Riviera Plaisance demo.

**Original Sessions (Research):**
- Session 1: Market intelligence gathering
- Session 2: Technical architecture design
- Session 3: Sales pitch + ROI calculator
- Session 4: Implementation planning (4-week sprints)
- Session 5: Guardian validation + dossier

**New Sessions (Implementation):**
- Session 1: Build photo inventory system
- Session 2: Build document search system
- Session 3: Build maintenance timeline system
- Session 4: Polish UI + demo script
- Session 5: Integration testing + sign-off

---

## Ready to Launch?

**Prerequisites:**
- [ ] Docker running (PostgreSQL, Meilisearch)
- [ ] Node.js 20.19.5 installed (`node --version`)
- [ ] npm dependencies installed (`npm install` in /home/setup/navidocs)
- [ ] GitHub access working (`git clone` test)
- [ ] 7-8 hours available for full execution
- [ ] StackCP deployment target ready

**If All Prerequisites Met:**

1. Copy entire content of `CLOUD_SESSION_PROMPT_1_PHOTO_INVENTORY.md`
2. Paste into Claude Code Cloud
3. Wait for first session to complete
4. Repeat for sessions 2-5

---

**Created:** 2025-11-13
**Time Budget Used:** 35 minutes (under 40-minute limit)
**Status:** Ready for immediate deployment
**Last Updated:** Session 5 completion script
