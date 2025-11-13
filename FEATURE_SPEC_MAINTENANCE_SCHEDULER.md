# Feature Spec: Maintenance Scheduler

**Created:** 2025-11-13
**Priority:** P1 (Core Feature)
**Estimated Time:** 90-120 minutes
**Assignee:** Cloud Session 7

---

## Executive Summary

Add recurring maintenance scheduling and task management to NaviDocs. Boat owners need to track preventive maintenance schedules (oil changes, inspections, filter replacements) with automatic reminders and completion tracking.

**Value Proposition:**
- Never miss critical maintenance tasks
- Track recurring maintenance schedules
- Get alerts for overdue tasks
- Log maintenance completion with costs
- View maintenance history per task or equipment
- Prevent expensive breakdowns through preventive maintenance

---

## User Story

**As a** boat owner
**I want to** schedule and track recurring maintenance tasks
**So that** I keep my boat in optimal condition and prevent costly repairs

**Acceptance Criteria:**
1. ✅ Create maintenance tasks (one-time or recurring)
2. ✅ Set recurrence patterns (days, hours, or miles)
3. ✅ Link tasks to specific equipment
4. ✅ Get alerts for due/overdue tasks
5. ✅ Mark tasks as complete with notes and costs
6. ✅ View maintenance calendar
7. ✅ Track maintenance history

---

## Database Schema

### Table: `maintenance_tasks`

```sql
CREATE TABLE maintenance_tasks (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  equipment_id TEXT,
  task_name TEXT NOT NULL,
  description TEXT,
  task_category TEXT NOT NULL,
  recurrence_type TEXT NOT NULL, -- 'one_time', 'recurring_days', 'recurring_hours', 'recurring_miles'
  recurrence_interval INTEGER, -- e.g., 30 for "every 30 days"
  last_completed_date INTEGER,
  next_due_date INTEGER,
  estimated_cost REAL,
  estimated_duration_minutes INTEGER,
  priority TEXT, -- 'low', 'medium', 'high', 'critical'
  status TEXT NOT NULL, -- 'pending', 'due', 'overdue', 'completed'
  alert_days_before INTEGER DEFAULT 7,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment_inventory(id) ON DELETE SET NULL
);

CREATE INDEX idx_maintenance_org ON maintenance_tasks(organization_id);
CREATE INDEX idx_maintenance_equipment ON maintenance_tasks(equipment_id);
CREATE INDEX idx_maintenance_next_due ON maintenance_tasks(next_due_date);
CREATE INDEX idx_maintenance_status ON maintenance_tasks(status);
```

### Table: `maintenance_completions`

```sql
CREATE TABLE maintenance_completions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  completed_date INTEGER NOT NULL,
  completed_by_user_id TEXT,
  actual_cost REAL,
  actual_duration_minutes INTEGER,
  service_provider TEXT,
  notes TEXT,
  meter_reading INTEGER, -- Hours or miles at completion
  created_at INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_completions_task ON maintenance_completions(task_id);
CREATE INDEX idx_completions_date ON maintenance_completions(completed_date);
```

---

## Task Categories

**Predefined Categories:**
- Engine Service
- Oil & Filters
- Electrical System
- Plumbing & Pumps
- Hull & Bottom
- Rigging & Sails
- Safety Equipment
- Electronics
- HVAC & Heating
- Winterization
- Annual Inspection
- Other

---

## API Endpoints

### 1. List Maintenance Tasks

**GET** `/api/organizations/:orgId/maintenance/tasks`

**Query Params:**
- `status` (optional) - 'pending', 'due', 'overdue', 'completed'
- `equipment_id` (optional) - Filter by equipment
- `category` (optional) - Filter by category
- `view` (optional) - 'calendar', 'list', 'upcoming'

**Response:**
```json
{
  "tasks": [
    {
      "id": "mt_123",
      "task_name": "Engine Oil Change",
      "description": "Replace engine oil and filter",
      "task_category": "Engine Service",
      "recurrence_type": "recurring_hours",
      "recurrence_interval": 100,
      "last_completed_date": 1699920000000,
      "next_due_date": 1735689600000,
      "days_until_due": 15,
      "status": "due",
      "priority": "high",
      "estimated_cost": 250.00,
      "equipment": {
        "id": "eq_123",
        "name": "Main Engine - Yanmar 4JH5E"
      },
      "completions_count": 5
    }
  ],
  "stats": {
    "total": 23,
    "due_soon": 5,
    "overdue": 2,
    "completed_this_month": 8
  }
}
```

### 2. Create Maintenance Task

**POST** `/api/organizations/:orgId/maintenance/tasks`

**Body:**
```json
{
  "equipment_id": "eq_123",
  "task_name": "Engine Oil Change",
  "description": "Replace engine oil and filter",
  "task_category": "Engine Service",
  "recurrence_type": "recurring_hours",
  "recurrence_interval": 100,
  "next_due_date": 1735689600000,
  "estimated_cost": 250.00,
  "estimated_duration_minutes": 60,
  "priority": "high",
  "alert_days_before": 7
}
```

### 3. Complete Maintenance Task

**POST** `/api/organizations/:orgId/maintenance/tasks/:taskId/complete`

**Body:**
```json
{
  "completed_date": 1699920000000,
  "actual_cost": 265.50,
  "actual_duration_minutes": 75,
  "service_provider": "ABC Marine Services",
  "notes": "Used synthetic oil. Replaced oil filter.",
  "meter_reading": 1250
}
```

**Response:**
```json
{
  "completion": {
    "id": "comp_456",
    "task_id": "mt_123",
    "completed_date": 1699920000000,
    "actual_cost": 265.50
  },
  "updated_task": {
    "id": "mt_123",
    "last_completed_date": 1699920000000,
    "next_due_date": 1735689600000,
    "status": "pending"
  }
}
```

### 4. Get Task Details & History

**GET** `/api/organizations/:orgId/maintenance/tasks/:taskId`

**Response:**
```json
{
  "task": {
    "id": "mt_123",
    "task_name": "Engine Oil Change",
    "description": "Replace engine oil and filter",
    "task_category": "Engine Service",
    "recurrence_type": "recurring_hours",
    "recurrence_interval": 100,
    "last_completed_date": 1699920000000,
    "next_due_date": 1735689600000,
    "status": "pending",
    "priority": "high",
    "equipment": {
      "id": "eq_123",
      "name": "Main Engine - Yanmar 4JH5E"
    }
  },
  "completion_history": [
    {
      "id": "comp_456",
      "completed_date": 1699920000000,
      "actual_cost": 265.50,
      "service_provider": "ABC Marine Services",
      "notes": "Used synthetic oil"
    }
  ],
  "stats": {
    "total_completions": 5,
    "total_cost": 1275.00,
    "avg_cost": 255.00,
    "avg_duration_minutes": 68
  }
}
```

### 5. Get Due/Overdue Alerts

**GET** `/api/organizations/:orgId/maintenance/alerts`

**Response:**
```json
{
  "alerts": [
    {
      "task_id": "mt_123",
      "task_name": "Engine Oil Change",
      "equipment_name": "Main Engine - Yanmar 4JH5E",
      "next_due_date": 1735689600000,
      "days_until_due": 5,
      "alert_level": "urgent", // 'overdue', 'urgent', 'warning', 'info'
      "priority": "high"
    }
  ]
}
```

### 6. Update Task

**PUT** `/api/organizations/:orgId/maintenance/tasks/:taskId`

### 7. Delete Task

**DELETE** `/api/organizations/:orgId/maintenance/tasks/:taskId`

### 8. Get Maintenance Calendar

**GET** `/api/organizations/:orgId/maintenance/calendar`

**Query Params:**
- `start_date` (required) - Unix timestamp
- `end_date` (required) - Unix timestamp

**Response:**
```json
{
  "events": [
    {
      "date": "2025-12-15",
      "tasks": [
        {
          "id": "mt_123",
          "task_name": "Engine Oil Change",
          "equipment_name": "Main Engine",
          "status": "due",
          "priority": "high"
        }
      ]
    }
  ]
}
```

---

## Frontend Components

### 1. Maintenance Dashboard (`client/src/views/Maintenance.vue`)

**Features:**
- Alert banner for overdue/due soon tasks
- Filter by status, category, equipment
- Sortable task list
- Quick actions (Mark Complete, View Details, Edit)
- Visual priority indicators (🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low)
- "Add Task" button

**Columns:**
- Task Name
- Equipment
- Category
- Next Due Date
- Days Until Due
- Status
- Priority
- Est. Cost
- Actions

### 2. Add Maintenance Task Modal (`client/src/components/AddMaintenanceTaskModal.vue`)

**Form Fields:**
- Task Name* (required)
- Category* (dropdown)
- Equipment (dropdown - optional)
- Description (textarea)
- Recurrence Type* (dropdown: One-time, Every N days, Every N hours, Every N miles)
- Recurrence Interval (number - if recurring)
- Next Due Date* (date picker)
- Estimated Cost
- Estimated Duration (minutes)
- Priority* (dropdown: Low, Medium, High, Critical)
- Alert Days Before (default: 7)
- Notes

### 3. Complete Task Modal (`client/src/components/CompleteMaintenanceTaskModal.vue`)

**Form Fields:**
- Completion Date* (date picker - default: today)
- Actual Cost
- Actual Duration (minutes)
- Service Provider
- Meter Reading (hours or miles)
- Notes (textarea)
- "Mark Complete" button

### 4. Maintenance Alert Banner (`client/src/components/MaintenanceAlertBanner.vue`)

**Display at top of dashboard:**
```
⚠️ 2 overdue tasks | 3 due within 7 days
└─ Engine Oil Change: 5 days overdue
└─ Bilge Pump Inspection: Due today
[View All Maintenance]
```

### 5. Maintenance Calendar View (`client/src/components/MaintenanceCalendar.vue`)

**Features:**
- Month view calendar
- Tasks displayed on due dates
- Color-coded by priority
- Click task to view details
- Navigate months

---

## Status Logic

```javascript
function calculateMaintenanceStatus(task) {
  if (task.status === 'completed') return 'completed';

  const now = Date.now();
  const nextDue = task.next_due_date;

  if (!nextDue) return 'pending';

  const daysUntilDue = Math.floor((nextDue - now) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= task.alert_days_before) return 'due';
  return 'pending';
}

function calculateNextDueDate(task, completion) {
  const completedDate = completion.completed_date;

  switch (task.recurrence_type) {
    case 'one_time':
      return null; // Task doesn't repeat

    case 'recurring_days':
      return completedDate + (task.recurrence_interval * 24 * 60 * 60 * 1000);

    case 'recurring_hours':
      // Calculate based on meter reading
      const nextMeterReading = completion.meter_reading + task.recurrence_interval;
      // Estimate date based on average usage (would need usage tracking)
      return completedDate + (task.recurrence_interval * 60 * 60 * 1000); // Simplified

    case 'recurring_miles':
      // Similar to hours
      const nextMiles = completion.meter_reading + task.recurrence_interval;
      return completedDate + (task.recurrence_interval * 60 * 60 * 1000); // Simplified

    default:
      return null;
  }
}
```

---

## Implementation Steps

### Phase 1: Database (15 min)

1. Create migration: `server/migrations/012_maintenance_scheduler.sql`
2. Run migration: `node server/run-migration.js 012_maintenance_scheduler.sql`
3. Verify tables created

### Phase 2: Backend Service (30 min)

1. Create: `server/services/maintenance-service.js`
   - CRUD for tasks
   - Complete task logic (auto-calculate next due date)
   - Status calculation
   - Alert generation

2. Implement recurrence logic

### Phase 3: Backend Routes (20 min)

1. Create: `server/routes/maintenance.js`
2. Implement 8 endpoints
3. Register route in `server/index.js`

### Phase 4: Frontend (50 min)

1. Create `views/Maintenance.vue` (dashboard)
2. Create `components/AddMaintenanceTaskModal.vue`
3. Create `components/CompleteMaintenanceTaskModal.vue`
4. Create `components/MaintenanceAlertBanner.vue`
5. Update router: Add `/maintenance` route
6. Update navigation: Add "Maintenance" link

### Phase 5: Integration (15 min)

1. Add maintenance alert banner to HomeView
2. Link equipment to maintenance tasks
3. Log maintenance completions to activity timeline

### Phase 6: Demo Data (10 min)

Create 10-15 sample maintenance tasks:
- 2 overdue tasks
- 3 due within 7 days
- 5 pending tasks
- 5 completed tasks with history

---

## Demo Data

**Sample Tasks for Riviera Plaisance Demo:**

1. Engine Oil Change (recurring every 100 hours) - DUE IN 5 DAYS
2. Fuel Filter Replacement (recurring every 200 hours) - DUE TODAY
3. Bilge Pump Inspection (recurring every 30 days) - OVERDUE 3 DAYS
4. Battery Water Check (recurring every 14 days) - OVERDUE 1 DAY
5. Transmission Fluid Check (recurring every 150 hours) - Due in 15 days
6. Impeller Replacement (recurring every 2 years) - Due in 45 days
7. Zincs Replacement (recurring every 6 months) - Due in 30 days
8. Fire Extinguisher Inspection (recurring every 1 year) - Due in 60 days
9. Life Jacket Inspection (recurring every 1 year) - Due in 90 days
10. Hull Cleaning (recurring every 60 days) - Due in 20 days

---

## Success Criteria

✅ Database migration creates 2 tables
✅ All 8 API endpoints working
✅ Can create tasks (one-time and recurring)
✅ Can mark tasks complete
✅ Next due date auto-calculated for recurring tasks
✅ Alert banner shows overdue/due tasks
✅ Can filter by status, category, equipment
✅ Completion history tracked per task
✅ Activity timeline shows maintenance events
✅ Demo data loads successfully

---

## Integration Points

**With Inventory:**
- Link maintenance tasks to equipment
- Show maintenance schedule on equipment detail page
- Track service history per equipment

**With Timeline:**
- Log task creation events
- Log task completion events
- Show maintenance history in timeline

**With Dashboard:**
- Display maintenance alerts banner
- Show upcoming tasks widget
- Display monthly maintenance summary

---

**Duration:** 90-120 minutes
**Dependencies:** Equipment Inventory (for linking tasks to equipment)
**Branch:** `feature/maintenance-scheduler`
