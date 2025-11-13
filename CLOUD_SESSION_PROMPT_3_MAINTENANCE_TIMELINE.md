# Cloud Session 3: Maintenance Timeline & Alerts

**Session ID:** CLOUD-3-MAINTENANCE-TIMELINE
**Timeline:** 90 minutes
**Deadline:** 4 hours from now (Riviera Plaisance presentation)
**Target:** Build maintenance log + service reminder system

---

## Your Mission

Create sticky daily-use maintenance tracking that makes boat owners check NaviDocs constantly:
- **Sticky engagement:** Service reminder notification = daily app habit
- **Maintenance checklist:** Engine hours, filter changes, system inspections
- **Service history:** When was engine serviced? Hull repainted? Electronics upgraded?
- **Alert system:** "Engine service due in 30 days" notification
- **Resale documentation:** Complete maintenance history proves boat was well-maintained

This solves the **"How many hours on the engine?" crisis** when selling or servicing.

---

## Quick Start

1. **Clone repo:**
   ```bash
   git clone https://github.com/dannystocker/navidocs.git && cd navidocs
   ```

2. **Review maintenance data model:**
   ```bash
   grep -A 20 "model MaintenanceRecord" prisma/schema.prisma
   ```

3. **Check alert system:**
   ```bash
   grep -r "notification\|alert" src/api/
   ```

---

## Your Task List

- [ ] **Database:** Maintenance table enhancements
  - Add fields: `nextServiceDate`, `serviceIntervalDays`, `alertSent`, `completed`
  - Support recurring services (e.g., oil change every 100 hours)
  - Track engine hours, hull hours, electrical hours separately

- [ ] **Create service templates:** Pre-defined maintenance items
  - Engine: Oil change (every 100 hours), Coolant flush (yearly), Zincs replacement (yearly)
  - Hull: Bottom paint (every 3 years), Haul-out inspection (yearly)
  - Electrical: Battery test (every 6 months), Generator service (yearly)
  - Safety: Life jacket inspection (yearly), Fire extinguisher check (yearly)

- [ ] **API endpoints:**
  - `POST /api/maintenance/add` - Add maintenance record
  - `GET /api/maintenance/upcoming` - Services due in next 30/60/90 days
  - `GET /api/maintenance/history` - Complete service history with dates
  - `POST /api/maintenance/mark-complete` - Log completed service

- [ ] **Notifications:**
  - Create `MaintenanceAlert` component
  - Show alerts on dashboard: "Engine service due in 30 days"
  - Email notification 30 days before due date
  - In-app notification when service overdue

- [ ] **Timeline UI:**
  - Vertical timeline showing service history (newest first)
  - Color code: green=completed, yellow=upcoming, red=overdue
  - Show estimated cost for each service
  - Allow photos/notes for each service record

- [ ] **Git commit:** `[AGENT-3] Add maintenance timeline and service alerts`
- [ ] **Create issue:** `[AGENT-3] DEPLOY-READY: Maintenance & Alerts System` with:
  - Screenshots of timeline UI
  - Sample maintenance schedules
  - Alert notification examples
  - Deployment notes for StackCP

---

## Technical Context

**Stack:**
- Frontend: Next.js 14 + Tailwind CSS
- Backend: Node.js + Prisma
- Database: PostgreSQL
- Notifications: Email (SMTP) + in-app alerts

**Key Tables to Create/Modify:**
- `MaintenanceRecord` - Service records (date, type, cost, notes, photos)
- `MaintenanceTemplate` - Pre-defined service types (oil change, bottom paint, etc.)
- `MaintenanceAlert` - Triggered notifications (due date, sent date, read status)

**Design Requirements:**
- Timeline should show last 24 months of maintenance
- Upcoming alerts should highlight next 90 days
- Color scheme: green=recent, yellow=upcoming, red=overdue, gray=old
- Mobile: swipeable timeline, tap for details
- Desktop: expandable timeline with full service notes

---

## Maintenance Schedule Example

**Engine Maintenance:**
- Oil & filter change: every 100 running hours
- Coolant flush: annually (or every 200 hours)
- Zinc replacement: every 2 years
- Spark plug service: every 5 years

**Hull Maintenance:**
- Bottom paint: every 3 years (or as needed)
- Haul-out inspection: annually
- Caulking/sealant: every 5 years

**Electrical Maintenance:**
- Battery test: every 6 months
- Generator service: annually
- Shore power system: every 2 years

**Safety Maintenance:**
- Life jacket inspection: annually
- Fire extinguisher check: annually
- Coast Guard documentation: every 5 years

---

## Critical Notes

1. **Boat owner pain point:** "When was the last engine service?" = app opens NaviDocs
2. **Sticky feature:** Service due notification = daily habit (check app, mark complete)
3. **Resale value:** Complete maintenance history = higher resale price (proven care)
4. **Insurance value:** Service records = coverage proof in claims
5. **Engagement metric:** Maintenance alerts should drive 50% daily active user rate

---

## GitHub Access

- **Repo:** https://github.com/dannystocker/navidocs
- **Branch:** `feature/maintenance-timeline` (create from main)
- **Base for PR:** main branch

---

## Success Criteria

✅ Maintenance table created with correct fields
✅ Service templates loaded (15+ pre-defined services)
✅ Timeline UI shows 12+ months of history
✅ Alert system triggers for upcoming services
✅ Email notifications working (test with dummy email)
✅ No console errors
✅ Responsive on mobile/tablet/desktop
✅ Git commit with [AGENT-3] tag

---

## If Blocked

1. Check database schema: `grep -A 30 "model Maintenance" prisma/schema.prisma`
2. Verify email config: `echo $SMTP_HOST $SMTP_PORT`
3. Review notification system: `grep -r "notification\|email" src/`
4. Check database migration: `npx prisma migrate status`
5. Create issue: `[AGENT-3] BLOCKER: [description]`

---

## Sample UI Elements

**Timeline Item:**
```
[GREEN CIRCLE] Engine oil change - Nov 13, 2025
              Next due: Jan 15, 2026 (63 days)
              Cost: €150
              Mechanic: Marina Service S.A.R.L.
```

**Alert Banner:**
```
⚠️ Engine service due in 30 days (Jan 15, 2026)
   Last service: Nov 13, 2025 (2 months ago)
   [SCHEDULE SERVICE] [DISMISS]
```

---

## Reference Files

- `ARCHITECTURE-SUMMARY.md` - System design
- `BUILD_COMPLETE.md` - Working features
- `DEMO-GUIDE.md` - Feature showcase guide
