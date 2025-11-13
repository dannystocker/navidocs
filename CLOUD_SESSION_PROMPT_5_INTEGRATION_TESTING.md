# Cloud Session 5: Integration Testing & Readiness

**Session ID:** CLOUD-5-INTEGRATION-TESTING
**Timeline:** 90 minutes
**Deadline:** 4 hours from now (Riviera Plaisance presentation)
**Target:** Verify all features work together without breaking

---

## Your Mission

Test that all features integrated from Sessions 1-4 work together:
- Photo inventory (Session 1) + Document search (Session 2) work together
- Maintenance timeline (Session 3) integrates with notifications
- UI polish (Session 4) looks good on all pages
- No database errors, no API crashes
- Full end-to-end flow: Upload boat → Add photos → Upload docs → Set maintenance → View dashboard

This is the **final quality gate** before Riviera Plaisance demo.

---

## Quick Start

1. **Clone repo:**
   ```bash
   git clone https://github.com/dannystocker/navidocs.git && cd navidocs
   ```

2. **Verify all features:**
   ```bash
   git branch -a | grep feature/  # Check all feature branches merged
   npm run build              # Full build
   npm run dev                # Start server
   ```

3. **Check integration points:**
   ```bash
   grep -r "import.*Photo" src/app/dashboard/
   grep -r "import.*Document" src/app/search/
   grep -r "import.*Maintenance" src/app/maintenance/
   ```

---

## Your Task List

- [ ] **Database Integration Test:**
  - Create test boat with all data:
    - 5 photos (engine, cabin, exterior, safety, upgrade)
    - 3 documents (warranty, service record, insurance)
    - 10 maintenance records (past + upcoming)
  - Verify no foreign key conflicts
  - Check data consistency (orphaned records?)
  - Document findings in `DATABASE_INTEGRITY_REPORT.md`

- [ ] **API Integration Test:**
  - Test photo upload → verify Meilisearch indexed
  - Test document upload → verify OCR triggers → verify search works
  - Test maintenance record → verify notification scheduled
  - Test all 15+ API endpoints for errors
  - Document API flow in `API_INTEGRATION_REPORT.md`

- [ ] **UI Flow End-to-End Test:**
  - Create boat (Landing → Onboarding → Dashboard)
  - Upload photos (Dashboard → Photos → Upload → Verify in gallery)
  - Upload documents (Dashboard → Documents → Upload → Search for keyword)
  - Add maintenance (Dashboard → Maintenance → Add service → Check timeline)
  - Verify all pages render without errors
  - Check responsive design (mobile, tablet, desktop)

- [ ] **Search Integration Test:**
  - Add 20 documents with various text + OCR
  - Search for common boat terms: "engine", "warranty", "service", "electrical"
  - Verify results ranked correctly (title match > content match)
  - Verify photo tags appear in search results
  - Test pagination (10+ results)
  - Document search quality in `SEARCH_QUALITY_REPORT.md`

- [ ] **Performance Under Load Test:**
  - Upload 50 photos simultaneously
  - Index 100 documents
  - Query search with 10 concurrent requests
  - Check server logs for errors
  - Verify response times acceptable (<500ms)
  - Run: `npm run build && npm run start`
  - Document findings in `LOAD_TEST_REPORT.md`

- [ ] **Error Recovery Test:**
  - Simulate network failure during upload
  - Kill database connection mid-transaction
  - Interrupt file upload at 50%
  - Verify graceful error messages
  - Verify no data corruption
  - Document error scenarios in `ERROR_RECOVERY_REPORT.md`

- [ ] **Browser Compatibility Test:**
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)
  - Test on: Windows, macOS, iOS, Android
  - Document incompatibilities in `BROWSER_COMPAT_REPORT.md`

- [ ] **Accessibility Test:**
  - Tab navigation works everywhere
  - Screen reader friendly (ARIA labels)
  - Color contrast WCAG AA standard
  - Forms labeled correctly
  - Run: `npx axe-core` on key pages
  - Document findings in `ACCESSIBILITY_REPORT.md`

- [ ] **Data Export Test:**
  - Export maintenance history (PDF + CSV)
  - Export photo inventory (ZIP with metadata)
  - Export document collection (PDF bundle)
  - Verify exports complete without errors
  - Check file integrity (can open + view correctly)
  - Document in `EXPORT_FUNCTIONALITY_REPORT.md`

- [ ] **Offline Mode Test:**
  - Load app, download cache
  - Disable network
  - Verify cached photos visible
  - Verify cached documents searchable
  - Verify maintenance history accessible
  - Document offline capabilities in `OFFLINE_CAPABILITY_REPORT.md`

- [ ] **Security Test:**
  - Verify API requires authentication
  - Test CORS headers
  - Verify uploaded files scanned for malware
  - Check for SQL injection in search
  - Verify file upload size limits enforced
  - Document findings in `SECURITY_AUDIT_REPORT.md`

- [ ] **Git commit:** `[AGENT-5] Complete integration testing + deployment checklist`
- [ ] **Create issue:** `[AGENT-5] READY-FOR-DEMO: All integration tests passed` with:
  - Summary of all 11 reports
  - Pass/fail status for each test
  - Known issues (if any) with workarounds
  - Deployment sign-off checklist

---

## Test Scenarios

### Scenario 1: Complete Boat Setup (Sunny Path)
```
1. User creates boat (Sunseeker 40ft)
2. Uploads 5 photos (engine, cabin, exterior, tender, electronics)
3. Uploads 3 documents (warranty, service record, insurance)
4. System auto-classifies documents
5. System indexes photos + documents in Meilisearch
6. User searches "warranty" → finds document instantly
7. User searches "engine" → finds engine photo + maintenance record
8. User sets maintenance reminder (oil change every 100 hours)
9. Dashboard shows: 5 photos, 3 docs, 1 upcoming maintenance
```
**Expected Result:** All features work, no errors, <2s load times

### Scenario 2: Search Integration (Edge Case)
```
1. User uploads warranty card (scanned image + OCR)
2. OCR extracts text: "Coverage: €50,000 engine protection"
3. Document classified as "warranty"
4. User searches "engine"
5. Results should show: warranty doc + engine photo + maintenance record
6. Results should be ranked: engine maintenance record first (exact match)
7. Warranty doc second (context match)
8. Engine photo third (tag match)
```
**Expected Result:** Smart ranking, document type tags, no missing results

### Scenario 3: Maintenance Workflow (Sticky Engagement)
```
1. User adds maintenance record: "Engine oil change - completed Nov 13"
2. System extracts cost from receipt: €150
3. System calculates next service due: Jan 15, 2026 (every 100 hours)
4. User gets notification: "Engine service due in 30 days"
5. User taps notification → marks service complete
6. Timeline updates immediately
7. Next notification scheduled for March 2026
```
**Expected Result:** Full lifecycle, notifications work, timeline accurate

---

## Technical Context

**Stack to Verify:**
- Frontend: Next.js 14 (all pages render correctly)
- API: Node.js + Prisma (all endpoints respond)
- Database: PostgreSQL (no integrity issues)
- Search: Meilisearch (documents indexed + searchable)
- Storage: Filesystem (photos + uploads)
- Notifications: Email + in-app (timely delivery)

**Critical Integration Points:**
1. Photo upload → Meilisearch index
2. Document upload → OCR processing → Classification → Meilisearch
3. Maintenance record → Notification scheduling
4. Dashboard aggregation (5 photos + 3 docs + 2 upcoming services)

---

## Test Data

Create complete test boat for realistic integration testing:

**Boat Profile:**
- Name: "Riviera Demo Boat"
- Brand: Sunseeker 40ft
- Year: 2020
- Value: €1.2M

**Photos:**
- Exterior (full boat shot)
- Engine room (clear engine photo)
- Cabin (showing interior condition)
- Tender on davits (€35K upgrade)
- Electronics console (GPS, radar, autopilot)

**Documents:**
- Warranty card (scanned + OCR)
- Service record from 2024
- Insurance policy document
- Original purchase documentation
- Electronics manual (PDF)

**Maintenance Records:**
- Oil change (Nov 2024)
- Hull inspection (Nov 2024)
- Electronics check (Oct 2024)
- Upcoming: Engine service (Jan 2026)
- Upcoming: Bottom paint (May 2026)

---

## Reports Required

Create these 11 markdown files:

1. `DATABASE_INTEGRITY_REPORT.md` - Data consistency check
2. `API_INTEGRATION_REPORT.md` - All endpoints tested
3. `SEARCH_QUALITY_REPORT.md` - Results quality + ranking
4. `LOAD_TEST_REPORT.md` - Performance under stress
5. `ERROR_RECOVERY_REPORT.md` - Failure scenarios
6. `BROWSER_COMPAT_REPORT.md` - Cross-browser testing
7. `ACCESSIBILITY_REPORT.md` - WCAG compliance
8. `EXPORT_FUNCTIONALITY_REPORT.md` - Data export verification
9. `OFFLINE_CAPABILITY_REPORT.md` - Offline mode testing
10. `SECURITY_AUDIT_REPORT.md` - Security verification
11. `INTEGRATION_SUMMARY.md` - Overall status + sign-off

---

## Success Criteria

✅ All 11 test reports created
✅ Database integrity verified (no orphaned records)
✅ All 15+ API endpoints returning correct data
✅ Photo upload → Search works end-to-end
✅ Document upload → Classification → Search works end-to-end
✅ Maintenance → Notifications works end-to-end
✅ Dashboard loads in <2 seconds
✅ Mobile responsive on all pages
✅ No console errors (warnings acceptable)
✅ All navigation flows work
✅ Error messages friendly + helpful
✅ Browser compatibility verified (4+ browsers)
✅ WCAG AA accessibility standards met
✅ Offline mode caches correctly
✅ Git commit with [AGENT-5] tag

---

## GitHub Access

- **Repo:** https://github.com/dannystocker/navidocs
- **Branch:** `feature/integration-testing` (create from main)
- **Base for PR:** main branch
- **Documentation:** All 11 reports in `intelligence/session-5/`

---

## If Blocked

1. Check database: `psql -c "SELECT COUNT(*) FROM Boat, Photo, Document, MaintenanceRecord;"`
2. Check API responses: `curl http://localhost:3000/api/boats`
3. Check Meilisearch: `curl http://localhost:7700/health`
4. Check build: `npm run build` (watch for errors)
5. Create blocker: `[AGENT-5] BLOCKER: [description]`

---

## Demo Day Readiness

**Before Showing Sylvain:**
- [ ] All 11 integration test reports green
- [ ] Database populated with demo boat + data
- [ ] Server running without errors
- [ ] Network stable (check ping to server)
- [ ] iPad loaded + ready (cached offline if needed)
- [ ] Demo script printed + reviewed
- [ ] Backup laptop ready (in case primary fails)
- [ ] Screenshot of each key feature (fallback if demo breaks)

---

## Reference Files

- `SMOKE_TEST_CHECKLIST.md` - Quick smoke tests
- `ARCHITECTURE-SUMMARY.md` - System architecture
- `BUILD_COMPLETE.md` - Feature status
- `DEMO-GUIDE.md` - Demo flow
