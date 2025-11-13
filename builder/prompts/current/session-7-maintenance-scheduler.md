# Cloud Session Prompt: Maintenance Scheduler

**Feature:** Recurring Maintenance Scheduling and Task Management
**Duration:** 90-120 minutes
**Priority:** P1 (Core Feature)
**Branch:** `feature/maintenance-scheduler`

---

## Your Mission

Build a maintenance scheduling system that tracks recurring tasks (oil changes, inspections, filter replacements) with automatic reminders and completion tracking. This integrates with the existing inventory system to link maintenance tasks to specific equipment.

**What you're building:**
- Maintenance task list with status indicators
- Recurring task scheduling (days, hours, miles-based)
- Task completion workflow with cost tracking
- Dashboard alerts for due/overdue tasks
- Maintenance history per task
- Integration with equipment inventory

---

## Quick Start

```bash
cd /home/setup/navidocs
git checkout navidocs-cloud-coordination
git pull origin navidocs-cloud-coordination
git checkout -b feature/maintenance-scheduler
```

---

## Step 1: Read the Spec (5 min)

**Read this file:** `/home/setup/navidocs/FEATURE_SPEC_MAINTENANCE_SCHEDULER.md`

This spec contains:
- Complete database schema (2 tables)
- All 8 API endpoints with request/response examples
- Frontend component designs
- Status calculation logic (pending, due, overdue)
- Recurrence logic (one-time, days, hours, miles)
- Demo data (10-15 sample tasks)

---

## Step 2: Database Migration (15 min)

**Create:** `server/migrations/012_maintenance_scheduler.sql`

**Tables to create:**
1. `maintenance_tasks` - Task definitions with recurrence patterns
2. `maintenance_completions` - History of completed tasks

**Copy schema from:** FEATURE_SPEC_MAINTENANCE_SCHEDULER.md (lines 31-60)

**Run migration:**
```bash
cd server
node run-migration.js 012_maintenance_scheduler.sql
```

**Verify:**
```bash
sqlite3 db/navidocs.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'maintenance%';"
```

---

## Step 3: Backend Service (30 min)

**Create:** `server/services/maintenance-service.js`

**Key functions to implement:**

```javascript
// Task CRUD
async function createTask(orgId, taskData)
async function getTaskList(orgId, filters)
async function getTaskById(taskId)
async function updateTask(taskId, updates)
async function deleteTask(taskId)

// Completion workflow
async function completeTask(taskId, completionData) {
  // 1. Create completion record
  // 2. Update task.last_completed_date
  // 3. Calculate next_due_date based on recurrence_type
  // 4. Update task.status
  // 5. Log to activity timeline
}

// Status calculation
function calculateMaintenanceStatus(task) {
  const now = Date.now();
  const daysUntilDue = Math.floor((task.next_due_date - now) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= task.alert_days_before) return 'due';
  return 'pending';
}

// Recurrence calculation
function calculateNextDueDate(task, completion) {
  switch (task.recurrence_type) {
    case 'one_time':
      return null;
    case 'recurring_days':
      return completion.completed_date + (task.recurrence_interval * 24 * 60 * 60 * 1000);
    case 'recurring_hours':
      // Based on meter reading
      return completion.completed_date + (task.recurrence_interval * 60 * 60 * 1000);
    case 'recurring_miles':
      // Based on meter reading
      return completion.completed_date + (task.recurrence_interval * 60 * 60 * 1000);
  }
}

// Alerts
async function getMaintenanceAlerts(orgId) {
  // Get tasks where status = 'overdue' OR 'due'
  // Return with alert_level: 'overdue', 'urgent', 'warning'
}
```

---

## Step 4: Backend Routes (20 min)

**Create:** `server/routes/maintenance.js`

**Routes to implement:**

```javascript
const express = require('express');
const router = express.Router({ mergeParams: true });
const maintenanceService = require('../services/maintenance-service');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/organizations/:orgId/maintenance/tasks
router.get('/tasks', async (req, res) => {
  const { orgId } = req.params;
  const { status, equipment_id, category } = req.query;
  // Call maintenanceService.getTaskList()
});

// POST /api/organizations/:orgId/maintenance/tasks
router.post('/tasks', async (req, res) => {
  // Create new task
});

// GET /api/organizations/:orgId/maintenance/tasks/:taskId
router.get('/tasks/:taskId', async (req, res) => {
  // Get task details + completion history
});

// PUT /api/organizations/:orgId/maintenance/tasks/:taskId
router.put('/tasks/:taskId', async (req, res) => {
  // Update task
});

// DELETE /api/organizations/:orgId/maintenance/tasks/:taskId
router.delete('/tasks/:taskId', async (req, res) => {
  // Delete task
});

// POST /api/organizations/:orgId/maintenance/tasks/:taskId/complete
router.post('/tasks/:taskId/complete', async (req, res) => {
  // Mark task as complete
  // Auto-calculate next due date
  // Return updated task
});

// GET /api/organizations/:orgId/maintenance/alerts
router.get('/alerts', async (req, res) => {
  // Get overdue/due tasks
});

// GET /api/organizations/:orgId/maintenance/calendar
router.get('/calendar', async (req, res) => {
  const { start_date, end_date } = req.query;
  // Get tasks within date range
});

module.exports = router;
```

**Register route in `server/index.js`:**
```javascript
app.use('/api/organizations/:orgId/maintenance', require('./routes/maintenance'));
```

---

## Step 5: Frontend - Maintenance Dashboard (30 min)

**Create:** `client/src/views/Maintenance.vue`

**Features:**
- Alert banner for overdue/due tasks
- Filter by status (All, Pending, Due, Overdue, Completed)
- Filter by category
- Filter by equipment
- Sortable table
- "Add Task" button
- Quick actions (Complete, View, Edit, Delete)

**Template structure:**

```vue
<template>
  <div class="maintenance-view">
    <!-- Alert Banner -->
    <div v-if="alerts.length > 0" class="alert-banner">
      <strong>⚠️ {{ overdueCount }} overdue | {{ dueSoonCount }} due within 7 days</strong>
      <div v-for="alert in alerts.slice(0, 3)" :key="alert.task_id">
        └─ {{ alert.task_name }}: {{ alert.days_until_due > 0 ? `Due in ${alert.days_until_due} days` : `${Math.abs(alert.days_until_due)} days overdue` }}
      </div>
    </div>

    <div class="header">
      <h1>Maintenance Schedule</h1>
      <button @click="showAddModal = true">+ Add Task</button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="filters.status">
        <option value="">All Tasks</option>
        <option value="pending">Pending</option>
        <option value="due">Due</option>
        <option value="overdue">Overdue</option>
        <option value="completed">Completed</option>
      </select>

      <select v-model="filters.category">
        <option value="">All Categories</option>
        <option>Engine Service</option>
        <option>Oil & Filters</option>
        <option>Electrical System</option>
        <!-- ... more categories -->
      </select>

      <select v-model="filters.equipment_id" v-if="equipment.length > 0">
        <option value="">All Equipment</option>
        <option v-for="eq in equipment" :key="eq.id" :value="eq.id">{{ eq.name }}</option>
      </select>
    </div>

    <!-- Task Table -->
    <table class="maintenance-table">
      <thead>
        <tr>
          <th>Task Name</th>
          <th>Equipment</th>
          <th>Category</th>
          <th>Next Due</th>
          <th>Days Until Due</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Est. Cost</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="task in filteredTasks" :key="task.id" :class="statusClass(task.status)">
          <td>{{ task.task_name }}</td>
          <td>{{ task.equipment?.name || '-' }}</td>
          <td>{{ task.task_category }}</td>
          <td>{{ formatDate(task.next_due_date) }}</td>
          <td>{{ task.days_until_due }}</td>
          <td>
            <span :class="statusBadge(task.status)">
              {{ task.status.toUpperCase() }}
            </span>
          </td>
          <td>{{ task.priority }}</td>
          <td>${{ task.estimated_cost?.toFixed(2) || '-' }}</td>
          <td>
            <button @click="completeTask(task)">Complete</button>
            <button @click="viewTask(task)">View</button>
            <button @click="editTask(task)">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>

    <AddMaintenanceTaskModal v-if="showAddModal" @close="showAddModal = false" @saved="loadTasks" />
    <CompleteMaintenanceTaskModal v-if="selectedTask" :task="selectedTask" @close="selectedTask = null" @completed="loadTasks" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      tasks: [],
      equipment: [],
      alerts: [],
      filters: {
        status: '',
        category: '',
        equipment_id: ''
      },
      showAddModal: false,
      selectedTask: null
    };
  },
  computed: {
    filteredTasks() {
      return this.tasks.filter(task => {
        if (this.filters.status && task.status !== this.filters.status) return false;
        if (this.filters.category && task.task_category !== this.filters.category) return false;
        if (this.filters.equipment_id && task.equipment_id !== this.filters.equipment_id) return false;
        return true;
      });
    },
    overdueCount() {
      return this.alerts.filter(a => a.days_until_due < 0).length;
    },
    dueSoonCount() {
      return this.alerts.filter(a => a.days_until_due >= 0 && a.days_until_due <= 7).length;
    }
  },
  async mounted() {
    await this.loadTasks();
    await this.loadEquipment();
    await this.loadAlerts();
  },
  methods: {
    async loadTasks() {
      const response = await fetch(`/api/organizations/${this.orgId}/maintenance/tasks`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await response.json();
      this.tasks = data.tasks;
    },
    async loadAlerts() {
      const response = await fetch(`/api/organizations/${this.orgId}/maintenance/alerts`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await response.json();
      this.alerts = data.alerts;
    },
    statusClass(status) {
      return `status-${status}`;
    },
    statusBadge(status) {
      return `badge badge-${status}`;
    },
    // ... other methods
  }
};
</script>

<style scoped>
.status-overdue { background-color: #ffe0e0; }
.status-due { background-color: #fff3cd; }
.badge-overdue { background: red; color: white; }
.badge-due { background: orange; color: white; }
.badge-pending { background: blue; color: white; }
</style>
```

---

## Step 6: Add Task Modal (20 min)

**Create:** `client/src/components/AddMaintenanceTaskModal.vue`

**Form fields:**
- Task Name*
- Category* (dropdown)
- Equipment (dropdown - optional)
- Description
- Recurrence Type* (One-time, Every N days, Every N hours, Every N miles)
- Recurrence Interval (if recurring)
- Next Due Date*
- Estimated Cost
- Estimated Duration (minutes)
- Priority* (Low, Medium, High, Critical)
- Alert Days Before (default: 7)
- Notes

**Submit logic:**
```javascript
async submitForm() {
  const response = await fetch(`/api/organizations/${this.orgId}/maintenance/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify(this.formData)
  });

  if (response.ok) {
    this.$emit('saved');
    this.$emit('close');
  }
}
```

---

## Step 7: Complete Task Modal (15 min)

**Create:** `client/src/components/CompleteMaintenanceTaskModal.vue`

**Form fields:**
- Completion Date* (default: today)
- Actual Cost
- Actual Duration (minutes)
- Service Provider
- Meter Reading (hours or miles)
- Notes

**Submit logic:**
```javascript
async completeTask() {
  const response = await fetch(`/api/organizations/${this.orgId}/maintenance/tasks/${this.task.id}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    },
    body: JSON.stringify(this.completionData)
  });

  if (response.ok) {
    this.$emit('completed');
    this.$emit('close');
  }
}
```

---

## Step 8: Navigation & Router (10 min)

**Update:** `client/src/router.js`

```javascript
{
  path: '/maintenance',
  component: () => import('./views/Maintenance.vue'),
  meta: { requiresAuth: true }
}
```

**Update:** Main navigation component

Add "Maintenance" link between "Inventory" and "Timeline"

---

## Step 9: Dashboard Integration (10 min)

**Add alert banner to dashboard:**

Create `client/src/components/MaintenanceAlertBanner.vue` and add to HomeView.

---

## Step 10: Demo Data (10 min)

**Create:** `server/seed-maintenance-demo-data.js`

**Sample tasks:**
- 2 overdue tasks (Bilge Pump Inspection: 3 days overdue, Battery Water Check: 1 day overdue)
- 3 due within 7 days (Engine Oil Change: 5 days, Fuel Filter: today)
- 5 pending tasks (due 15-60 days)
- 5 completed tasks with history

**Run:**
```bash
node server/seed-maintenance-demo-data.js
```

---

## Step 11: Testing (15 min)

**Test checklist:**
- [ ] Can create task (one-time and recurring)
- [ ] Tasks appear in list
- [ ] Can filter by status, category, equipment
- [ ] Can complete task
- [ ] After completion, next_due_date auto-calculated (if recurring)
- [ ] Alert banner shows overdue/due tasks
- [ ] Status indicators correct (colors)
- [ ] Completion history tracked
- [ ] Activity timeline shows maintenance events

---

## Step 12: Completion (5 min)

```bash
git add .
git commit -m "[SESSION-7] Add maintenance scheduler

Features:
- Recurring maintenance task scheduling
- Task completion workflow with auto-calculated next due dates
- Recurrence patterns: days, hours, miles
- Alert system for overdue/due tasks
- Maintenance history per task
- Integration with equipment inventory
- Dashboard alerts for critical tasks

Database: 2 new tables (maintenance_tasks, maintenance_completions)
API: 8 new endpoints
Frontend: Maintenance view + 2 modals"

git push origin feature/maintenance-scheduler
```

**Create:** `SESSION-7-COMPLETE.md` documenting what you built

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

## Questions? Blockers?

- Spec: `/home/setup/navidocs/FEATURE_SPEC_MAINTENANCE_SCHEDULER.md`
- API patterns: Check existing `server/routes/equipment.js`
- Vue components: Check `client/src/views/Inventory.vue`
- Database: Use `server/db/database.js`

**Go build! 🚀**
