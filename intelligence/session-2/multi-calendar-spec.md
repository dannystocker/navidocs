# Multi-Calendar System for Yacht Management (S2-H07A)
## Unified Calendar Design Specification

**Agent:** S2-H07A
**Domain:** Multi-Calendar System (CRITICAL)
**Status:** Complete
**Date:** 2025-11-13

---

## Executive Summary

The Multi-Calendar System provides a unified, color-coded dashboard for managing four critical calendar types across yacht ownership lifecycle:

1. **Service Calendar** - Maintenance appointments and service due dates (from S2-H03)
2. **Warranty Calendar** - Equipment warranty expirations (from S2-H02)
3. **Owner Onboard Calendar** - Owner arrival/departure tracking (manual entry)
4. **Work Roadmap Calendar** - Planned maintenance with budget tracking (from S2-H06)

The system provides mobile-first calendar views, intelligent conflict detection, smart notifications, and export capabilities (iCal/Google Calendar).

---

## 1. Database Schema

### Primary Table: `calendar_events`

Core calendar events table serving all four calendar types:

```sql
CREATE TABLE calendar_events (
  -- Primary Keys & Foreign Keys
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  boat_id BIGINT NOT NULL,
  event_type ENUM(
    'service_due',           -- Service Calendar: upcoming maintenance
    'service_completed',     -- Service Calendar: past maintenance
    'warranty_expires',      -- Warranty Calendar: warranty expiration
    'warranty_alert',        -- Warranty Calendar: 90/60/30 day alerts
    'owner_onboard',         -- Owner Onboard: owner arrival/departure
    'work_planned',          -- Work Roadmap: planned work item
    'work_scheduled',        -- Work Roadmap: scheduled for execution
    'work_in_progress',      -- Work Roadmap: currently executing
    'work_completed',        -- Work Roadmap: completed work
    'tax_exit_required',     -- Tax/Exit Calendar: tax exit requirement
    'maintenance_reminder'   -- System-generated reminder alerts
  ) NOT NULL,

  -- Event Identifiers & References
  source_id BIGINT NULL,            -- FK to source table (maintenance_log.id, boat_inventory.id, expense.id)
  source_type ENUM(
    'maintenance_log',
    'inventory_item',
    'work_order',
    'manual_entry'
  ) NOT NULL,

  -- Core Event Information
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),

  -- Date/Time Information
  start_date DATE NOT NULL,
  end_date DATE NULL,               -- For multi-day events (owner onboard, work projects)
  reminder_date DATE NULL,          -- When to show reminder (before actual event)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Status Tracking
  status ENUM(
    'pending',       -- Service: not yet due; Work: proposed
    'confirmed',     -- Service: upcoming; Work: approved
    'in_progress',   -- Actively happening
    'completed',     -- Finished
    'cancelled',     -- Cancelled/deleted
    'overdue'        -- Service is overdue
  ) DEFAULT 'pending',

  -- Service Calendar Fields
  service_type VARCHAR(50) NULL,    -- engine, electronics, hull, deck, etc.
  engine_hours_trigger INT NULL,    -- If due date based on engine hours
  maintenance_provider_id BIGINT NULL, -- FK to boat_contacts.id

  -- Warranty Calendar Fields
  warranty_expiration_date DATE NULL,
  inventory_item_id BIGINT NULL,    -- FK to boat_inventory.id
  warranty_status VARCHAR(20) NULL, -- active, expiring-soon, expired

  -- Owner Onboard Calendar Fields
  owner_id BIGINT NULL,             -- FK to boat_owners.id
  owner_name VARCHAR(255) NULL,
  expected_crew_count INT NULL,
  arrival_notes TEXT,               -- Special prep requirements

  -- Work Roadmap Calendar Fields
  budget_amount DECIMAL(12, 2) NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  actual_cost DECIMAL(12, 2) NULL,
  budget_status ENUM(
    'pending',          -- Awaiting owner approval
    'approved',         -- Owner approved
    'rejected',         -- Owner rejected
    'approved_partial'  -- Owner approved partial amount
  ) NULL,
  approved_by_user_id BIGINT NULL,  -- Owner who approved budget
  approved_at TIMESTAMP NULL,
  work_priority VARCHAR(20) NULL,   -- high, medium, low
  contractor_id BIGINT NULL,        -- FK to boat_contacts.id

  -- Conflict Detection & Relationships
  has_conflicts BOOLEAN DEFAULT FALSE,
  conflicting_event_ids TEXT NULL,  -- JSON array of conflicting event IDs

  -- Tax/Exit Fields
  tax_exit_due_date DATE NULL,
  tax_exit_jurisdiction VARCHAR(100) NULL,
  tax_exit_status VARCHAR(20) NULL, -- pending, completed, submitted

  -- Accessibility & UI Fields
  color_code VARCHAR(20) NOT NULL,  -- visual category for dashboard
  priority INT DEFAULT 0,           -- sort priority in view
  is_all_day BOOLEAN DEFAULT TRUE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(255) NULL, -- iCal RRULE format (for annual items)

  -- Export & Sync Fields
  ical_uid VARCHAR(255) UNIQUE,     -- Unique ID for iCal export
  last_synced_to_google TIMESTAMP NULL,
  last_synced_to_ical TIMESTAMP NULL,

  -- Audit & Access
  created_by_user_id BIGINT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,

  -- Indexing for Performance
  INDEX idx_boat_id (boat_id),
  INDEX idx_event_type (event_type),
  INDEX idx_status (status),
  INDEX idx_start_date (start_date),
  INDEX idx_source_id (source_id),
  INDEX idx_owner_id (owner_id),
  INDEX idx_has_conflicts (has_conflicts),
  INDEX idx_boat_event_date (boat_id, start_date),
  INDEX idx_warranty_expiration (warranty_expiration_date),
  INDEX idx_budget_status (budget_status),
  CONSTRAINT fk_boat_id FOREIGN KEY (boat_id) REFERENCES boats(id),
  CONSTRAINT fk_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_approved_by FOREIGN KEY (approved_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_maintenance_provider FOREIGN KEY (maintenance_provider_id) REFERENCES boat_contacts(id),
  CONSTRAINT fk_contractor FOREIGN KEY (contractor_id) REFERENCES boat_contacts(id)
);
```

### Supporting Table: `calendar_notification_rules`

Defines when and how notifications should be sent for each event type:

```sql
CREATE TABLE calendar_notification_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_type VARCHAR(50) NOT NULL,
  boat_id BIGINT NULL,              -- NULL = global rule, boat_id = override for specific boat

  -- Notification Timing
  days_before_event INT NOT NULL,   -- e.g., 90, 60, 30, 14, 7, 3, 1
  notification_type ENUM(
    'email',
    'sms',
    'push',
    'in_app',
    'multi'               -- Send via multiple channels
  ) DEFAULT 'in_app',

  -- Notification Content
  subject_template VARCHAR(255),
  message_template TEXT,
  include_budget_details BOOLEAN DEFAULT FALSE,
  include_conflict_warnings BOOLEAN DEFAULT FALSE,

  -- Recipient Rules
  notify_owner BOOLEAN DEFAULT TRUE,
  notify_captain BOOLEAN DEFAULT FALSE,
  notify_service_provider BOOLEAN DEFAULT FALSE,

  -- Customization
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_event_type (event_type),
  INDEX idx_boat_id (boat_id),
  CONSTRAINT fk_boat_notification FOREIGN KEY (boat_id) REFERENCES boats(id)
);
```

### Supporting Table: `calendar_conflict_detection`

Tracks identified conflicts between calendar events:

```sql
CREATE TABLE calendar_conflict_detection (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  boat_id BIGINT NOT NULL,
  primary_event_id BIGINT NOT NULL,
  conflicting_event_id BIGINT NOT NULL,

  -- Conflict Type
  conflict_type ENUM(
    'date_overlap',            -- Events overlap in time
    'resource_conflict',       -- Same person/vendor scheduled twice
    'owner_availability',      -- Owner unavailable for approval
    'work_blocking',          -- One job blocks another
    'budget_excess'           -- Total budget exceeds allocation
  ) NOT NULL,

  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  description TEXT,
  resolution_notes TEXT,

  -- Status
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP NULL,
  resolved_by_user_id BIGINT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_boat_id (boat_id),
  INDEX idx_primary_event (primary_event_id),
  INDEX idx_conflicting_event (conflicting_event_id),
  INDEX idx_is_resolved (is_resolved),
  CONSTRAINT fk_conflict_boat FOREIGN KEY (boat_id) REFERENCES boats(id),
  CONSTRAINT fk_primary_event FOREIGN KEY (primary_event_id) REFERENCES calendar_events(id),
  CONSTRAINT fk_conflicting_event FOREIGN KEY (conflicting_event_id) REFERENCES calendar_events(id),
  CONSTRAINT fk_resolved_by FOREIGN KEY (resolved_by_user_id) REFERENCES users(id)
);
```

### Supporting Table: `calendar_exports`

Tracks sync status with external calendar systems:

```sql
CREATE TABLE calendar_exports (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  boat_id BIGINT NOT NULL,
  export_type ENUM('ical', 'google_calendar') NOT NULL,
  external_calendar_id VARCHAR(500),    -- Google Calendar ID or URL
  last_sync_time TIMESTAMP,
  sync_status ENUM('pending', 'in_progress', 'success', 'failed') DEFAULT 'pending',
  sync_error_message TEXT NULL,
  event_count_synced INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_boat_id (boat_id),
  INDEX idx_export_type (export_type),
  CONSTRAINT fk_export_boat FOREIGN KEY (boat_id) REFERENCES boats(id)
);
```

---

## 2. Calendar Type Specifications

### 2.1 Service Calendar

**Purpose:** Track yacht maintenance appointments and service due dates with intelligent reminders based on calendar dates or engine hours.

**Data Sources:**
- `maintenance_log` table (S2-H03)
- `maintenance_service_intervals` table (S2-H03)

**Event Types:**
- `service_due` - Service is upcoming (60, 30, 14, 7 days before)
- `service_completed` - Service has been completed
- `maintenance_reminder` - System-generated reminder alerts

**Trigger Logic:**
1. **Calendar-Based Due Date:** If `maintenance_log.next_due_date` exists, use that
2. **Engine Hours-Based Due Date:** If `maintenance_service_intervals.engine_hours_interval` exists:
   - Calculate next due date from engine hours: `last_service_hours + interval_hours`
   - Convert to calendar date based on average usage
   - Generate reminder at 60, 30, 14, 7 days before calculated date

**Reminder Schedule:**
- 60 days before: Soft reminder ("Service window opening")
- 30 days before: Planning reminder ("Schedule service")
- 14 days before: Firm reminder ("Service appointment due soon")
- 7 days before: Urgent reminder ("Service due in one week")
- 0 days: Overdue alert (status changes to `overdue`)

**Color Code:** Blue (#4A90E2)

**Sample Events:**
```
Service Calendar Event 1:
  title: "Engine Oil Change - Due"
  start_date: 2025-12-15
  event_type: service_due
  service_type: engine
  engine_hours_trigger: 500
  source_id: <maintenance_log.id>
  status: confirmed
  color_code: blue

Service Calendar Event 2:
  title: "Engine Oil Change - Completed"
  start_date: 2025-12-20
  event_type: service_completed
  source_id: <maintenance_log.id>
  status: completed
  color_code: green
```

---

### 2.2 Warranty Calendar

**Purpose:** Track equipment warranty expirations with timely renewal reminders.

**Data Sources:**
- `boat_inventory` table (S2-H02)
- Warranty dates from equipment purchase records

**Event Types:**
- `warranty_expires` - Warranty expiration date
- `warranty_alert` - 90, 60, 30 day alerts before expiration

**Trigger Logic:**
1. Read `boat_inventory.warranty_expiration` date
2. Extract item name, manufacturer, serial number from inventory
3. Generate alerts at 90, 60, 30 days before expiration
4. Flag as `expiring-soon` in inventory system when < 90 days

**Reminder Schedule:**
- 90 days before: Alert ("Warranty renewal window opening")
- 60 days before: Reminder ("Contact manufacturer for renewal")
- 30 days before: Urgent reminder ("Warranty expires in one month")
- 0 days: Expired status (inventory system updates `warranty_status` to 'expired')

**Color Code:** Orange (#F5A623)

**Sample Events:**
```
Warranty Calendar Event 1:
  title: "Garmin Electronics Suite - Warranty Expires"
  start_date: 2025-09-30
  warranty_expiration_date: 2025-09-30
  inventory_item_id: <boat_inventory.id>
  event_type: warranty_expires
  status: confirmed
  color_code: orange

Warranty Calendar Event 2:
  title: "Garmin Electronics Suite - Warranty Renewal Reminder"
  start_date: 2025-07-01
  reminder_date: 2025-07-01
  event_type: warranty_alert
  status: pending
  color_code: orange
```

---

### 2.3 Owner Onboard Calendar

**Purpose:** Track owner arrival/departure patterns to coordinate service scheduling and crew availability.

**Data Sources:**
- Manual entry by owner or captain
- Owner availability from contact management (S2-H05)

**Event Types:**
- `owner_onboard` - Owner present on yacht

**Attributes:**
- Multi-day events (start_date to end_date)
- Owner ID, name, expected crew count
- Arrival/departure notes for crew preparation
- Connection to maintenance scheduling (don't schedule major work during owner visits)

**Manual Entry Form:**
- Owner name
- Arrival date/time
- Departure date/time
- Expected crew members
- Special requirements ("needs Wi-Fi dock", "needs fresh provisioning")
- Preferred work window (before/after owner presence)

**Integration Points:**
- Captain can see owner arrival and prepare boat
- Service calendar automatically checks for conflicts with planned maintenance
- Conflict detection: Flag if hull repaint scheduled during owner arrival

**Color Code:** Green (#7ED321)

**Sample Events:**
```
Owner Onboard Event 1:
  title: "Owner On Board: July 15-22, 2025"
  start_date: 2025-07-15
  end_date: 2025-07-22
  event_type: owner_onboard
  owner_id: <boat_owners.id>
  owner_name: "Mr. & Mrs. Johnsons"
  expected_crew_count: 3
  arrival_notes: "Preference for Italian coast. Provision for 2 guests. Need to book chef."
  status: confirmed
  color_code: green
  has_conflicts: true
  conflicting_event_ids: ["1247"]  -- Hull repaint event
```

---

### 2.4 Work Roadmap Calendar

**Purpose:** Plan and track major yacht maintenance/upgrades with budget approval workflow and actual cost tracking.

**Data Sources:**
- S2-H06 (Expense Tracking System)
- Manual work order creation

**Event Types:**
- `work_planned` - Work proposed, awaiting approval
- `work_scheduled` - Work approved, scheduled for execution
- `work_in_progress` - Work actively happening
- `work_completed` - Work finished

**Work Status Workflow:**

```
Proposed (pending)
    ↓ [Owner reviews budget]
Approved (confirmed) OR Rejected (cancelled)
    ↓ [Owner approved]
Scheduled (confirmed)
    ↓ [Work starts]
In Progress (in_progress)
    ↓ [Work completes]
Completed (completed)
    ↓ [Actual costs reconciled]
Final Status
```

**Budget Approval Workflow:**

1. **Proposal Stage:**
   - Technician/Captain creates work order with budget estimate
   - System calculates estimate based on S2-H06 expense categories
   - Email sent to owner: "New work proposal: [Title] - €[Amount]"
   - Owner has 7 days to approve/reject

2. **Approval Stage:**
   - Owner reviews work details, photos, rationale
   - Owner approves full amount, partial amount, or rejects
   - System records approval (approved_by_user_id, approved_at, budget_status)
   - Notification sent to captain/technician: "Work approved: [Title]"

3. **Execution Stage:**
   - Work moves to "Scheduled" status
   - Captain schedules work around owner onboard events
   - System tracks actual costs from S2-H06 as invoices submitted
   - Budget vs. Actual comparison shown in dashboard

4. **Completion Stage:**
   - Work marked complete with final actual cost
   - Variance report: Budget €15,000 vs. Actual €14,850 (€150 under budget)

**Conflict Detection for Work Roadmap:**
- Flag if owner is onboard during scheduled work
- Flag if multiple work items conflict (e.g., electrician and painter both needed, but only one crew available)
- Flag if total budget (all work in 12 months) exceeds owner's stated annual maintenance budget

**Color Code:** Purple (#9013FE)

**Sample Events:**
```
Work Roadmap Event 1:
  title: "Hull Repaint - Proposed"
  start_date: 2025-08-10
  end_date: 2025-08-20
  event_type: work_planned
  budget_amount: 15000.00
  currency: EUR
  budget_status: pending
  work_priority: high
  status: pending
  description: "Full hull repaint with new paint (5-year marine grade). Includes prep, primer, paint, sealing."
  color_code: purple
  has_conflicts: true
  conflicting_event_ids: ["1246"]  -- Owner onboard July 15-22

Work Roadmap Event 2:
  title: "Hull Repaint - Approved"
  start_date: 2025-08-10
  end_date: 2025-08-20
  event_type: work_scheduled
  budget_amount: 15000.00
  actual_cost: NULL
  budget_status: approved
  approved_by_user_id: <boat_owners.id>
  approved_at: 2025-06-01 14:30:00
  work_priority: high
  contractor_id: <boat_contacts.id>  -- Painting company
  status: confirmed
  color_code: purple

Work Roadmap Event 3:
  title: "Hull Repaint - In Progress"
  start_date: 2025-08-10
  end_date: 2025-08-20
  event_type: work_in_progress
  actual_cost: 8500.00  -- Updated as invoices received
  status: in_progress
  color_code: purple

Work Roadmap Event 4:
  title: "Hull Repaint - Completed"
  start_date: 2025-08-10
  end_date: 2025-08-20
  event_type: work_completed
  budget_amount: 15000.00
  actual_cost: 14850.00
  status: completed
  color_code: purple
```

---

### 2.5 Tax/Exit Calendar (Bonus Type)

**Purpose:** Track tax-related milestones for yacht ownership, particularly tax exit requirements from S2-H03A.

**Event Type:**
- `tax_exit_required` - Tax exit requirement date

**Attributes:**
- Tax exit date (e.g., "Day 183 in-country = tax trigger")
- Jurisdiction (EU, Monaco, Cayman Islands)
- Required actions (submit paperwork, register change of ownership)

**Sample Events:**
```
Tax Exit Event:
  title: "Tax Exit Due - EU Residency (Day 183)"
  start_date: 2025-12-31
  event_type: tax_exit_required
  tax_exit_jurisdiction: "EU"
  tax_exit_status: pending
  status: confirmed
  color_code: red
```

---

## 3. Unified Dashboard UI Wireframe

### 3.1 Main Calendar View

```
┌─────────────────────────────────────────────────────────────────┐
│ NAVIDOCS - Multi-Calendar Dashboard                    [≡] [⚙]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  < November 2025 >           🔄 [Today]                          │
│  [VIEW: Month] [Week] [Day] [List]                              │
│                                                                   │
│  Sun      Mon      Tue      Wed      Thu      Fri      Sat      │
│  ─────────────────────────────────────────────────────────────  │
│   2        3        4        5        6        7        8       │
│                                          🔵              🟠      │
│  ─────────────────────────────────────────────────────────────  │
│   9       10       11       12       13       14       15       │
│  🟣 ─────────────  🟡 ─────────────                             │
│  ─────────────────────────────────────────────────────────────  │
│  16       17       18       19       20       21       22       │
│  🟢 ─────────────────────────────────────────── 🟠             │
│  ─────────────────────────────────────────────────────────────  │
│  23       24       25       26       27       28       29       │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Legend:  🔵 Service  🟠 Warranty  🟢 Owner  🟣 Work  🟡 Tax  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Event Details Panel (Side Sheet)

```
┌────────────────────────────────────────────────────────────────┐
│ EVENT DETAILS                                             [×]    │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 🔵 Service Due: Engine Oil Change                    [Dec 15]   │
│                                                                  │
│ Provider: Bruno's Marine Services                              │
│ Service Type: Engine Maintenance                              │
│ Last Service: Oct 15, 2025 (500 engine hours)                │
│ Next Due: Dec 15, 2025 (at 600 engine hours)                 │
│                                                                  │
│ ⏰ Reminders:                                                   │
│   • 60 days before (Oct 16): Soft reminder              [✓ Sent] │
│   • 30 days before (Nov 15): Planning reminder         [⏳ Due] │
│   • 14 days before (Dec 1): Firm reminder              [Pending] │
│   • 7 days before (Dec 8): Urgent reminder             [Pending] │
│                                                                  │
│ 📌 Notes: Use synthetic oil. Check impeller. Replace water...  │
│                                                                  │
│ [Contact Provider] [Move to Calendar] [Mark Complete]          │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 Conflict Detection Panel

```
┌────────────────────────────────────────────────────────────────┐
│ ⚠️  SCHEDULING CONFLICTS DETECTED                               │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 🔴 HIGH PRIORITY:                                               │
│    Hull Repaint (Aug 10-20) overlaps with Owner Onboard       │
│    (Jul 15-22) - Time conflict in multi-day events            │
│    → Suggested: Reschedule repaint to Aug 25-Sep 5            │
│                                                                  │
│ 🟠 MEDIUM PRIORITY:                                             │
│    Total 2025 Maintenance Budget: €52,000 (Budget: €50,000)   │
│    → €2,000 over budget - Request owner approval for excess    │
│                                                                  │
│ 🟡 LOW PRIORITY:                                                │
│    Engine repair (Dec 10) requires electrician (booked Dec 8)  │
│    → Same contractor, different days - manageable              │
│                                                                  │
│                          [✓ Resolve] [⊘ Dismiss]              │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

### 3.4 Mobile-First Swipeable View (Smartphone)

```
┌──────────────────────────────────┐
│ 📅 NAVIDOCS Calendar    [≡] [⚙]  │
├──────────────────────────────────┤
│                                  │
│  November 2025                   │
│  < [●●●●●●●] >     [Today]      │
│                                  │
│  TODAY (Nov 13)                  │
│  ─────────────────────────────   │
│  🔵 Service Reminder (7 days)    │
│    Engine Oil Change             │
│    📞 Bruno's Marine - Nov 20    │
│                                  │
│  🟢 Owner Timeline                │
│    July 15-22 Visit               │
│    Mr. & Mrs. Johnsons           │
│                                  │
│  NEXT 7 DAYS                     │
│  ─────────────────────────────   │
│  Nov 15: Warranty Alert (30 d)  │
│  Nov 17: Work Approval Due      │
│  Nov 20: Service Appointment    │
│                                  │
│  [← Prev] [Month] [List] [+Add] │
│                                  │
└──────────────────────────────────┘
```

---

## 4. Smart Notification Logic

### 4.1 Notification Rules Engine

**Notification types by calendar:**

#### Service Calendar Notifications
```
Service Type: Engine Oil Change
Event: service_due

Timeline:
- 60 days before: Email + In-app
  "Service window opening: Engine oil change due in 60 days"
  [View Service Details] [Schedule Appointment]

- 30 days before: Email + SMS + In-app
  "Schedule required: Engine oil change due in 30 days"
  [Contact Bruno's Marine] [Block Time in Calendar]

- 14 days before: Email + SMS + Push + In-app
  "FIRM REMINDER: Engine oil change due in 14 days"
  [Schedule Now] [Reschedule] [Skip This Service]

- 7 days before: SMS + Push + In-app (multiple times)
  "ENGINE SERVICE DUE IN 7 DAYS"
  [Confirm Appointment] [Reschedule]

- 0 days (overdue): Push + SMS (daily)
  "ENGINE SERVICE OVERDUE - Schedule immediately"
  [Schedule] [Mark as Completed]
```

#### Warranty Calendar Notifications
```
Event: warranty_expires

Timeline:
- 90 days before: Email + In-app
  "Warranty window: Garmin electronics warranty expires in 90 days"
  [Renewal Options] [View Warranty]

- 60 days before: Email + SMS + In-app
  "Contact manufacturer: Renew warranty within 60 days"
  [Garmin Support] [Coverage Options]

- 30 days before: Email + SMS + Push + In-app
  "URGENT: Warranty expires in 30 days"
  [Renew Now] [Request Extension]

- 0 days: SMS + Push (once)
  "Warranty expired: Garmin Electronics"
  Inventory updated to warranty_status: 'expired'
```

#### Owner Onboard Notifications
```
Event: owner_onboard

Timeline:
- 30 days before: Email to captain
  "Owner arrival in 30 days: July 15-22"
  [Prep Checklist] [Schedule Crew]

- 14 days before: Email to captain
  "Owner arriving in 14 days - boat prep starting"
  [Provision Schedule] [Crew Availability]

- 7 days before: Email + SMS to captain
  "Owner arrives in 7 days - final prep phase"
  [Confirm Crew] [Check Fuel/Water] [Test Systems]

- 1 day before: SMS + Push to captain
  "Owner arrives tomorrow - final checks"
  [Daily Checklist] [Guest Arrival Procedures]

- 0 days: SMS to captain
  "Owner arriving today"
  Conflict detection runs: Any work scheduled during visit?
```

#### Work Roadmap Notifications
```
Event: work_planned (Budget awaiting approval)

Timeline:
- Immediate: Email to owner
  "Work proposal awaiting approval: Hull Repaint - €15,000"
  [View Proposal] [Approve] [Reject] [Ask Questions]

Approval Deadline: 7 days
- 3 days remaining: Email reminder to owner
  "Approval needed: Hull Repaint (€15,000)"
  [Approve] [Reject]

- 1 day remaining: Email + SMS to owner
  "Budget approval expiring: Hull Repaint €15,000"
  [Approve Now] [Reject] [Contact Captain]

- Overdue (no approval): SMS + Push to captain
  "Work approval overdue - contact owner"
```

```
Event: work_scheduled → work_in_progress

Timeline:
- 7 days before work start: Email to owner
  "Work starting in 7 days: Hull Repaint (July 15-22 window)"
  [Confirm Schedule] [View Budget] [Contact Contractor]
  ⚠️ CONFLICT: Owner arriving July 15-22 - Reschedule?

- 1 day before work start: Email + SMS to captain & contractor
  "Work starts tomorrow: Hull Repaint"
  [Materials Ready?] [Crew Scheduled] [Weather Check]

- 0 days (work starts): SMS + Push to all parties
  "Work in progress: Hull Repaint"
  Actual costs begin tracking from S2-H06

- Budget variance alerts: If actual cost exceeds 110% of budget
  SMS + Email to owner: "Hull Repaint 110% over budget (€16,500 vs €15,000)"
  [Approve Overage] [Stop Work] [Contact Contractor]
```

### 4.2 Conflict Detection Algorithm

**Conflict Types:**

1. **Date Overlap:**
   ```
   IF (event_1.start_date <= event_2.end_date
       AND event_2.start_date <= event_1.end_date)
   THEN Flag as 'date_overlap'

   Example: Work scheduled Aug 10-20, Owner onboard Jul 15-22
   Overlap: Jul 15-22 and Aug 10-20 = NO overlap (separate periods)

   Example: Work scheduled Jul 15-20, Owner onboard Jul 15-22
   Overlap: Jul 15-20 ⊂ Jul 15-22 = CONFLICT (5 days overlap)
   ```

2. **Resource Conflict:**
   ```
   IF (event_1.contractor_id == event_2.contractor_id
       AND event_1.start_date == event_2.start_date)
   THEN Flag as 'resource_conflict'

   Example: Painter scheduled for hull and deck on same day
   Resolution: Schedule deck work 1 week later
   ```

3. **Owner Availability Conflict:**
   ```
   IF (event_type == 'work_planned'
       AND budget_status == 'pending'
       AND owner_onboard event exists within next 7 days)
   THEN Flag as 'owner_availability'

   Reason: Owner won't be able to approve work before they arrive
   ```

4. **Work Blocking:**
   ```
   IF (event_1.requires_completion_before_event_2 == TRUE
       AND event_1.scheduled_date >= event_2.scheduled_date)
   THEN Flag as 'work_blocking'

   Example: "Electrical system upgrade must complete before
             engine test run" but engine test scheduled first
   ```

5. **Budget Excess:**
   ```
   SUM(all calendar_events.budget_amount
       WHERE status IN ('approved', 'scheduled', 'in_progress', 'completed')
       AND date BETWEEN Jan 1 AND Dec 31) > owner_annual_maintenance_budget

   THEN Flag as 'budget_excess'
   ```

**Conflict Resolution Workflow:**

```
Conflict Detected
    ↓
Severity Assessment (critical, high, medium, low)
    ↓
Notify affected parties (owner, captain, contractors)
    ↓
Suggested Resolutions generated
    ↓
Owner/Captain approves resolution OR custom negotiation
    ↓
Event rescheduled / budget adjusted / work cancelled
    ↓
Conflict marked as 'is_resolved = TRUE'
    ↓
All parties notified of final resolution
```

---

## 5. Budget Signoff Workflow (Work Roadmap)

### 5.1 Workflow States

```
┌─────────────────────────────────────────────────────────────┐
│                    WORK APPROVAL FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. PROPOSAL (pending) - Captain/Technician creates         │
│     ├─ Title: "Hull Repaint"                               │
│     ├─ Budget: €15,000                                     │
│     ├─ Scope: "Full hull prep, primer, paint, sealing"    │
│     ├─ Photos: [3 reference images]                       │
│     ├─ Rationale: "UV damage, salt corrosion"             │
│     └─ Deadline: 7 days for owner decision                │
│          ↓                                                  │
│     Owner receives email:                                  │
│     "Work Proposal: Hull Repaint (€15,000)"               │
│                                                              │
│  2. REVIEW (pending → approved/rejected/partial)           │
│     ├─ Owner reviews work scope                            │
│     ├─ Owner reviews photos & contractor                   │
│     ├─ Owner decides:                                      │
│     │   ├─ [APPROVE] Full amount: €15,000                 │
│     │   ├─ [PARTIAL] Approve: €12,000 (reduce scope)      │
│     │   └─ [REJECT] Don't approve                          │
│     └─ Owner submits approval                              │
│          ↓                                                  │
│     System records: approved_by, approved_at, budget_status │
│                                                              │
│  3. SCHEDULING (confirmed) - After approval               │
│     ├─ Captain schedules work with contractor              │
│     ├─ Conflict detection runs:                            │
│     │   └─ Check if owner onboard during work period       │
│     ├─ Work dates: Aug 10-20, 2025                         │
│     └─ Contractor confirmed & notified                     │
│          ↓                                                  │
│  4. EXECUTION (in_progress)                               │
│     ├─ Work starts on scheduled date                       │
│     ├─ Actual costs tracked from S2-H06:                  │
│     │   ├─ Invoices submitted: €2,500 (labor)             │
│     │   ├─ Invoices submitted: €5,200 (materials)         │
│     │   ├─ Running total: €7,700 / €15,000               │
│     │   └─ Projected final: €14,850 (under budget)        │
│     ├─ If actual > 110% of budget:                        │
│     │   └─ Alert owner: "Work exceeds budget"             │
│     └─ Daily progress updates                              │
│          ↓                                                  │
│  5. COMPLETION (completed)                                 │
│     ├─ Work marked complete                                │
│     ├─ Final invoice received                              │
│     ├─ Variance report:                                    │
│     │   └─ Budget: €15,000 vs Actual: €14,850 (-€150)    │
│     ├─ Owner signs off on completion                       │
│     └─ Work archived in historical view                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Budget Approval API

**Endpoint: `POST /api/calendar/work-roadmap/approve`**

```json
{
  "work_event_id": 1247,
  "action": "approve",
  "approved_amount": 15000,
  "approved_by_user_id": 501,
  "notes": "Approved - proceed with full scope. Use the gray paint color I discussed with Captain."
}
```

Response:
```json
{
  "success": true,
  "event_id": 1247,
  "status": "approved",
  "budget_status": "approved",
  "approved_at": "2025-06-01T14:30:00Z",
  "next_step": "Schedule work execution",
  "conflict_warnings": []
}
```

---

## 6. Export Functionality (iCal & Google Calendar)

### 6.1 iCal Export

**Endpoint: `GET /api/calendar/export/ical?boat_id=123&event_types=service_due,work_planned`**

**Response:** iCal file (`.ics` format)

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//NAVIDOCS//Yacht Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Boat #123 Maintenance Calendar
X-WR-TIMEZONE:UTC

BEGIN:VEVENT
UID:service-123-2025-12-15@navidocs.io
DTSTART:20251215
DTEND:20251216
SUMMARY:Engine Oil Change - Service Due
DESCRIPTION:Service Type: Engine Maintenance\nProvider: Bruno's Marine Services\nLast Service: Oct 15, 2025\nEngine Hours: 500\nNotes: Use synthetic oil, check impeller
LOCATION:Marina Service Yard
STATUS:CONFIRMED
PRIORITY:2
CATEGORIES:Service,Engine
COMMENT:Reminder scheduled for 7 days before: Dec 8, 2025
END:VEVENT

BEGIN:VEVENT
UID:work-1247-2025-08-10@navidocs.io
DTSTART:20250810
DTEND:20250820
SUMMARY:Hull Repaint - Scheduled
DESCRIPTION:Budget: EUR 15,000\nStatus: Approved\nScope: Full hull prep, primer, paint, sealing\nContractor: Marco's Painting Services
LOCATION:Marina Yard C
STATUS:CONFIRMED
PRIORITY:1
CATEGORIES:Work,Scheduled
ATTACH:https://navidocs.io/work/1247/photos
BEGIN:VALARM
TRIGGER:-P7D
ACTION:DISPLAY
DESCRIPTION:Hull Repaint starts in 7 days
END:VALARM
END:VEVENT

END:VCALENDAR
```

### 6.2 Google Calendar Sync

**Endpoint: `POST /api/calendar/export/google-calendar/sync`**

Request:
```json
{
  "boat_id": 123,
  "google_calendar_id": "user@gmail.com",
  "event_types": ["service_due", "warranty_expires", "owner_onboard", "work_planned"],
  "sync_mode": "full"
}
```

**Sync Process:**
1. Fetch all calendar_events for boat_id
2. Create Google Calendar events via Google Calendar API
3. Map calendar_events columns to Google Calendar format:
   - `title` → Event name
   - `start_date`, `end_date` → Event time
   - `description` → Event description
   - `location` → Event location
   - `color_code` → Google Calendar color
4. Set reminders based on `calendar_notification_rules`
5. For `work_planned` events with budget_status='pending', include approval deadline
6. Update `calendar_exports.last_sync_time` and `sync_status`

Response:
```json
{
  "success": true,
  "events_synced": 12,
  "calendar_url": "https://calendar.google.com/calendar/u/0?cid=user@gmail.com",
  "next_sync": "2025-11-14T08:00:00Z",
  "sync_errors": []
}
```

**Two-way Sync Considerations:**
- Read updates from Google Calendar back to NAVIDOCS
- Mark externally updated events as "synced"
- Flag conflicts if same event modified in both systems
- Owner updates in Google Calendar propagate to NAVIDOCS

---

## 7. API Endpoints

### 7.1 Calendar Event Management

**Create Event**
```
POST /api/calendar/events
Content-Type: application/json

{
  "boat_id": 123,
  "event_type": "service_due",
  "source_type": "maintenance_log",
  "source_id": 5001,
  "title": "Engine Oil Change",
  "start_date": "2025-12-15",
  "service_type": "engine",
  "status": "confirmed",
  "created_by_user_id": 101,
  "color_code": "blue"
}

Response:
{
  "success": true,
  "event_id": 1242,
  "ical_uid": "service-123-2025-12-15@navidocs.io"
}
```

**Get Events (Filtered)**
```
GET /api/calendar/events?boat_id=123&event_type=service_due&start_date=2025-11-01&end_date=2025-12-31

Response:
{
  "events": [
    {
      "id": 1242,
      "title": "Engine Oil Change",
      "start_date": "2025-12-15",
      "event_type": "service_due",
      "status": "confirmed",
      "color_code": "blue",
      "provider": "Bruno's Marine Services"
    },
    {
      "id": 1243,
      "title": "Hull Inspection",
      "start_date": "2025-11-20",
      "event_type": "service_due",
      "status": "confirmed",
      "color_code": "blue"
    }
  ],
  "total_count": 2
}
```

**Get Single Event Details**
```
GET /api/calendar/events/:event_id

Response:
{
  "event_id": 1242,
  "title": "Engine Oil Change",
  "event_type": "service_due",
  "start_date": "2025-12-15",
  "source_type": "maintenance_log",
  "source_id": 5001,
  "service_type": "engine",
  "maintenance_provider": "Bruno's Marine Services",
  "maintenance_provider_id": 201,
  "status": "confirmed",
  "color_code": "blue",
  "reminders": [
    {
      "days_before": 60,
      "type": "email",
      "status": "sent"
    },
    {
      "days_before": 30,
      "type": "email",
      "status": "sent"
    },
    {
      "days_before": 14,
      "type": "email,sms",
      "status": "pending"
    }
  ],
  "has_conflicts": false,
  "created_at": "2025-10-15T10:00:00Z"
}
```

**Update Event**
```
PATCH /api/calendar/events/:event_id

{
  "start_date": "2025-12-20",
  "status": "confirmed"
}

Response:
{
  "success": true,
  "event_id": 1242
}
```

**Delete Event**
```
DELETE /api/calendar/events/:event_id

Response:
{
  "success": true,
  "event_id": 1242,
  "is_deleted": true
}
```

### 7.2 Work Roadmap & Budget Approval

**Create Work Proposal**
```
POST /api/calendar/work-roadmap/propose

{
  "boat_id": 123,
  "title": "Hull Repaint",
  "budget_amount": 15000,
  "currency": "EUR",
  "scope": "Full hull prep, primer, paint, sealing",
  "photos": ["url1", "url2", "url3"],
  "rationale": "UV damage and salt corrosion observed",
  "contractor_id": 305,
  "estimated_duration_days": 10,
  "created_by_user_id": 102
}

Response:
{
  "success": true,
  "work_event_id": 1247,
  "status": "pending",
  "approval_deadline": "2025-06-08T23:59:59Z",
  "notification_sent_to_owner": true
}
```

**Approve Work Budget**
```
POST /api/calendar/work-roadmap/:work_event_id/approve

{
  "action": "approve",
  "approved_amount": 15000,
  "approved_by_user_id": 501,
  "notes": "Approved. Use the gray paint color discussed."
}

Response:
{
  "success": true,
  "work_event_id": 1247,
  "status": "approved",
  "budget_status": "approved",
  "approved_at": "2025-06-01T14:30:00Z"
}
```

**Reject Work Budget**
```
POST /api/calendar/work-roadmap/:work_event_id/approve

{
  "action": "reject",
  "rejection_reason": "Too expensive. Get competing quote.",
  "approved_by_user_id": 501
}

Response:
{
  "success": true,
  "work_event_id": 1247,
  "status": "rejected",
  "budget_status": null,
  "message": "Work proposal rejected. Captain notified."
}
```

**Approve Partial Budget**
```
POST /api/calendar/work-roadmap/:work_event_id/approve

{
  "action": "approve_partial",
  "approved_amount": 12000,
  "original_amount": 15000,
  "approved_by_user_id": 501,
  "notes": "Reduce scope - only hull, skip sealing for now"
}

Response:
{
  "success": true,
  "work_event_id": 1247,
  "budget_status": "approved_partial",
  "approved_amount": 12000,
  "budget_variance": 3000
}
```

**Update Work Status**
```
PATCH /api/calendar/work-roadmap/:work_event_id/status

{
  "status": "in_progress",
  "started_date": "2025-08-10"
}

Response:
{
  "success": true,
  "work_event_id": 1247,
  "status": "in_progress"
}
```

**Mark Work Complete**
```
POST /api/calendar/work-roadmap/:work_event_id/complete

{
  "actual_cost": 14850,
  "completion_notes": "Work completed on schedule, under budget",
  "photos_before_after": ["url1", "url2"]
}

Response:
{
  "success": true,
  "work_event_id": 1247,
  "status": "completed",
  "actual_cost": 14850,
  "budget_variance": -150,
  "variance_percentage": -1.0
}
```

### 7.3 Notification Management

**Get Notification Rules**
```
GET /api/calendar/notifications/rules?boat_id=123&event_type=service_due

Response:
{
  "rules": [
    {
      "id": 1,
      "event_type": "service_due",
      "days_before": 60,
      "notification_type": "email",
      "is_enabled": true
    },
    {
      "id": 2,
      "event_type": "service_due",
      "days_before": 30,
      "notification_type": "email",
      "is_enabled": true
    }
  ]
}
```

**Create Custom Notification Rule**
```
POST /api/calendar/notifications/rules

{
  "boat_id": 123,
  "event_type": "work_planned",
  "days_before": 3,
  "notification_type": "sms",
  "message_template": "Work approval due in 3 days: {{work_title}} - {{budget_amount}}",
  "notify_owner": true,
  "notify_captain": true
}

Response:
{
  "success": true,
  "rule_id": 24
}
```

### 7.4 Conflict Detection

**Get Conflicts**
```
GET /api/calendar/conflicts?boat_id=123&severity=high,critical

Response:
{
  "conflicts": [
    {
      "conflict_id": 567,
      "primary_event": {
        "id": 1247,
        "title": "Hull Repaint",
        "start_date": "2025-08-10",
        "end_date": "2025-08-20"
      },
      "conflicting_event": {
        "id": 1246,
        "title": "Owner Onboard",
        "start_date": "2025-07-15",
        "end_date": "2025-07-22"
      },
      "conflict_type": "date_overlap",
      "severity": "high",
      "suggested_resolution": "Reschedule hull repaint to Aug 25-Sep 5"
    }
  ],
  "total_count": 1
}
```

**Resolve Conflict**
```
POST /api/calendar/conflicts/:conflict_id/resolve

{
  "resolution": "reschedule",
  "event_id": 1247,
  "new_start_date": "2025-08-25",
  "new_end_date": "2025-09-05",
  "resolved_by_user_id": 501
}

Response:
{
  "success": true,
  "conflict_id": 567,
  "is_resolved": true,
  "affected_event_id": 1247,
  "new_dates": "2025-08-25 to 2025-09-05"
}
```

### 7.5 Calendar Export

**Export to iCal**
```
GET /api/calendar/export/ical?boat_id=123&event_types=service_due,warranty_expires

Response:
Content-Type: text/calendar
Content-Disposition: attachment; filename="boat123_calendar.ics"

BEGIN:VCALENDAR
VERSION:2.0
...
```

**Sync with Google Calendar**
```
POST /api/calendar/export/google-calendar/sync

{
  "boat_id": 123,
  "google_calendar_id": "user@gmail.com",
  "event_types": ["service_due", "warranty_expires", "owner_onboard", "work_planned"]
}

Response:
{
  "success": true,
  "events_synced": 12,
  "next_sync": "2025-11-14T08:00:00Z"
}
```

---

## 8. Data Feed Integrations

### 8.1 Integration with S2-H03 (Maintenance Log)

**Trigger:** New maintenance log entry created or updated

**Data Flow:**
```
S2-H03: maintenance_log
  ├─ id: 5001
  ├─ boat_id: 123
  ├─ service_type: 'engine'
  ├─ date: 2025-10-15
  ├─ provider: "Bruno's Marine Services"
  ├─ engine_hours: 500
  ├─ next_due_date: 2025-12-15
  ├─ next_due_engine_hours: 600

  ↓ [IF.bus: Post /api/calendar/events]

S2-H07A: calendar_events
  ├─ event_type: 'service_due'
  ├─ source_id: 5001
  ├─ source_type: 'maintenance_log'
  ├─ title: "Engine Oil Change"
  ├─ start_date: 2025-12-15
  ├─ service_type: 'engine'
  ├─ engine_hours_trigger: 600
  ├─ maintenance_provider_id: <boat_contacts.id>
  ├─ status: 'confirmed'

  ↓ [Scheduler runs daily]

Reminders generated:
  ├─ 60 days before (Oct 16): "Service window opening"
  ├─ 30 days before (Nov 15): "Schedule service"
  ├─ 14 days before (Dec 1): "Service due soon"
  └─ 7 days before (Dec 8): "Service due in 7 days"
```

**IF.bus Message Format:**
```json
{
  "performative": "inform",
  "sender": "if://agent/session-2/haiku-03",
  "receiver": "if://agent/session-2/haiku-07A",
  "timestamp": "2025-10-15T09:00:00Z",
  "content": {
    "event": "maintenance_log_created",
    "data": {
      "maintenance_id": 5001,
      "boat_id": 123,
      "service_type": "engine",
      "next_due_date": "2025-12-15",
      "next_due_engine_hours": 600,
      "provider_name": "Bruno's Marine Services"
    }
  }
}
```

### 8.2 Integration with S2-H02 (Inventory Tracking)

**Trigger:** Warranty expiration date detected (< 90 days)

**Data Flow:**
```
S2-H02: boat_inventory
  ├─ id: 8001
  ├─ boat_id: 123
  ├─ item_name: "Garmin Electronics Suite"
  ├─ warranty_expiration: 2025-09-30
  ├─ warranty_status: 'expiring-soon'

  ↓ [IF.bus: Post /api/calendar/events]

S2-H07A: calendar_events
  ├─ event_type: 'warranty_expires'
  ├─ source_id: 8001
  ├─ source_type: 'inventory_item'
  ├─ title: "Garmin Electronics Suite - Warranty Expires"
  ├─ start_date: 2025-09-30
  ├─ warranty_expiration_date: 2025-09-30
  ├─ inventory_item_id: 8001

  ↓ [Scheduler runs daily]

Warranty alerts triggered:
  ├─ 90 days before (Jul 1): "Warranty renewal window"
  ├─ 60 days before (Aug 29): "Contact manufacturer"
  └─ 30 days before (Sep 29): "Warranty expires in 1 month"
```

**IF.bus Message Format:**
```json
{
  "performative": "inform",
  "sender": "if://agent/session-2/haiku-02",
  "receiver": "if://agent/session-2/haiku-07A",
  "timestamp": "2025-06-01T10:00:00Z",
  "content": {
    "event": "inventory_warranty_expiring",
    "data": {
      "inventory_id": 8001,
      "boat_id": 123,
      "item_name": "Garmin Electronics Suite",
      "warranty_expiration": "2025-09-30",
      "days_until_expiration": 90
    }
  }
}
```

### 8.3 Integration with S2-H06 (Expense Tracking)

**Trigger:** Work invoice submitted or actual costs updated

**Data Flow:**
```
S2-H06: expenses (work-related)
  ├─ work_order_id: 1247
  ├─ boat_id: 123
  ├─ amount: 2500.00
  ├─ category: 'labor'
  ├─ description: "Hull repaint - labor (5 days)"

  ↓ [IF.bus: Update /api/calendar/work-roadmap/:event_id]

S2-H07A: calendar_events (for event 1247)
  ├─ actual_cost: 7700.00  (cumulative from multiple invoices)
  ├─ budget_amount: 15000.00
  ├─ status: 'in_progress'

  ↓ [Variance calculation]

If actual_cost > (budget_amount * 1.10):
  └─ Alert: "Work 110% over budget - €16,500 vs €15,000"
```

**IF.bus Message Format:**
```json
{
  "performative": "inform",
  "sender": "if://agent/session-2/haiku-06",
  "receiver": "if://agent/session-2/haiku-07A",
  "timestamp": "2025-08-15T14:00:00Z",
  "content": {
    "event": "work_expense_recorded",
    "data": {
      "work_event_id": 1247,
      "boat_id": 123,
      "invoice_amount": 2500.00,
      "invoice_type": "labor",
      "cumulative_actual_cost": 7700.00,
      "budget_amount": 15000.00
    }
  }
}
```

### 8.4 Integration with S2-H03A (Tax Exit Calendar)

**Trigger:** Tax exit requirement date calculated

**Data Flow:**
```
S2-H03A: tax_exit_requirements
  ├─ boat_id: 123
  ├─ requirement_type: 'day_183_in_country'
  ├─ due_date: 2025-12-31
  ├─ jurisdiction: 'EU'

  ↓ [IF.bus: Post /api/calendar/events]

S2-H07A: calendar_events
  ├─ event_type: 'tax_exit_required'
  ├─ source_type: 'tax_exit'
  ├─ title: "Tax Exit Due - EU Residency (Day 183)"
  ├─ start_date: 2025-12-31
  ├─ tax_exit_due_date: 2025-12-31
  ├─ tax_exit_jurisdiction: 'EU'
  ├─ tax_exit_status: 'pending'
```

---

## 9. Implementation Roadmap

### Phase 1: MVP (Weeks 1-2)
- [x] Database schema creation
- [x] Service Calendar integration with S2-H03
- [x] Warranty Calendar integration with S2-H02
- [x] Manual Owner Onboard calendar entry
- [x] Basic calendar view (month/week/day)
- [x] Notification rules engine
- [ ] Basic conflict detection

### Phase 2: Work Roadmap (Weeks 3-4)
- [ ] Work Roadmap calendar
- [ ] Budget approval workflow
- [ ] Integration with S2-H06 (expense tracking)
- [ ] Budget variance alerts

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Smart conflict detection algorithm
- [ ] iCal export
- [ ] Google Calendar sync
- [ ] Mobile-first responsive design

### Phase 4: Optimization (Week 7)
- [ ] Performance tuning
- [ ] Caching strategy
- [ ] Push notification system
- [ ] User acceptance testing

---

## 10. Testing Strategy

### Unit Tests
- Event creation and validation
- Reminder calculation logic
- Conflict detection algorithm
- Budget variance calculations

### Integration Tests
- S2-H03 data feed integration
- S2-H02 warranty sync
- S2-H06 expense updates
- IF.bus message handling

### E2E Tests
- Full workflow: Service due → reminder → completion
- Budget approval workflow: Proposal → approval → execution
- Conflict detection and resolution
- Google Calendar export and sync

### Acceptance Tests
- Mobile responsiveness (iOS, Android)
- Calendar view performance (1000+ events)
- Notification delivery (email, SMS, push)
- iCal compatibility (Outlook, Apple Calendar)

---

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Service reminders received | 95% | Delivery logs |
| Budget approval time | < 5 days | Audit trail |
| Conflict detection accuracy | > 99% | False positive rate |
| Mobile load time | < 2s | Performance monitoring |
| Notification opt-in rate | > 80% | User settings |
| Work completion on budget | > 85% | Variance reports |
| Calendar export success rate | 99.9% | Sync logs |

---

## 12. IF.bus Communication Summary

**Confirm integrations with S2-H03, S2-H02, S2-H03A, S2-H06:**

```json
{
  "performative": "confirm",
  "sender": "if://agent/session-2/haiku-07A",
  "receiver": [
    "if://agent/session-2/haiku-03",
    "if://agent/session-2/haiku-02",
    "if://agent/session-2/haiku-03A",
    "if://agent/session-2/haiku-06"
  ],
  "timestamp": "2025-11-13T12:00:00Z",
  "content": {
    "integration_status": "ready",
    "calendar_system": "Multi-Calendar (4 types)",
    "api_endpoint": "POST /api/calendar/events",
    "supported_message_types": [
      {
        "from": "S2-H03",
        "event": "maintenance_log_created",
        "maps_to": "service_due, service_completed"
      },
      {
        "from": "S2-H02",
        "event": "inventory_warranty_expiring",
        "maps_to": "warranty_expires, warranty_alert"
      },
      {
        "from": "S2-H06",
        "event": "work_expense_recorded",
        "maps_to": "work_in_progress, actual_cost_updated"
      },
      {
        "from": "S2-H03A",
        "event": "tax_exit_required",
        "maps_to": "tax_exit_required"
      }
    ],
    "expected_message_format": {
      "performative": "inform",
      "sender": "if://agent/session-2/haiku-XX",
      "receiver": "if://agent/session-2/haiku-07A",
      "content": {
        "event": "event_type",
        "data": {
          "boat_id": "number",
          "source_id": "number",
          "related_details": "object"
        }
      }
    }
  }
}
```

---

## Appendix: Color Code Reference

| Calendar Type | Color | Hex Code |
|---------------|-------|----------|
| Service | Blue | #4A90E2 |
| Warranty | Orange | #F5A623 |
| Owner Onboard | Green | #7ED321 |
| Work Roadmap | Purple | #9013FE |
| Tax/Exit | Red | #D0021B |
| Completed | Gray | #9B9B9B |

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-13 | Initial specification document |

---

**End of Multi-Calendar System Specification**
