# Cloud Session Prompt: Fuel Log & Expense Tracker

**Feature:** Fuel Consumption Tracking and Complete Expense Management System
**Duration:** 90-120 minutes
**Priority:** P1 (Core Feature)
**Branch:** `feature/fuel-expense-tracker`

---

## Your Mission

Build a comprehensive fuel logging and expense tracking system. Track fuel consumption with efficiency calculations, manage all boat expenses by category, generate financial reports, and provide budget tracking. This feature provides critical financial insights for boat owners.

**What you're building:**
- Fuel log with consumption tracking
- Fuel efficiency calculator (MPG or GPH)
- Expense management by category
- Budget vs actual comparison
- Expense reports and charts
- Receipt attachment
- Tax-deductible expense tracking
- CSV export for accounting

---

## Quick Start

```bash
cd /home/setup/navidocs
git checkout navidocs-cloud-coordination
git pull origin navidocs-cloud-coordination
git checkout -b feature/fuel-expense-tracker
```

---

## Step 1: Read the Spec (5 min)

**Read this file:** `/home/setup/navidocs/FEATURE_SPEC_FUEL_EXPENSE_TRACKER.md`

This spec contains:
- Complete database schema (3 tables)
- All 9 API endpoints with request/response examples
- Frontend component designs
- Fuel efficiency calculation logic
- Expense categories
- Demo data (20+ fuel logs, 40+ expenses)

---

## Step 2: Database Migration (15 min)

**Create:** `server/migrations/015_fuel_expense_tracker.sql`

**Tables to create:**
1. `fuel_logs` - Fuel purchase tracking with odometer readings
2. `expenses` - All boat expenses by category
3. `expense_budgets` - Annual/monthly budgets per category

**Copy schema from:** FEATURE_SPEC_FUEL_EXPENSE_TRACKER.md (lines 31-115)

**Run migration:**
```bash
cd server
node run-migration.js 015_fuel_expense_tracker.sql
```

**Verify:**
```bash
sqlite3 db/navidocs.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%fuel%' OR name LIKE '%expense%';"
```

---

## Step 3: Backend Service - Fuel (20 min)

**Create:** `server/services/fuel-service.js`

**Key functions:**

```javascript
// Fuel log CRUD
async function createFuelLog(orgId, fuelData) {
  // 1. Create fuel log entry
  // 2. Calculate fuel efficiency if previous log exists
  // 3. Auto-create expense entry in 'Fuel & Oil' category
  // 4. Log to activity timeline
}

async function getFuelLogs(orgId, filters)
async function getFuelLogById(logId)
async function updateFuelLog(logId, updates)
async function deleteFuelLog(logId)

// Fuel efficiency calculation
function calculateFuelEfficiency(currentLog, previousLog) {
  if (!previousLog || !previousLog.odometer_reading || !currentLog.odometer_reading) {
    return null; // Cannot calculate without odometer readings
  }

  const distanceTraveled = currentLog.odometer_reading - previousLog.odometer_reading;
  const fuelConsumed = currentLog.quantity_gallons;

  if (distanceTraveled <= 0 || fuelConsumed <= 0) {
    return null;
  }

  const mpg = distanceTraveled / fuelConsumed;

  return {
    distance_traveled: distanceTraveled,
    fuel_consumed: fuelConsumed,
    mpg: mpg.toFixed(2),
    gallons_per_hour: (fuelConsumed / (distanceTraveled / 7)).toFixed(2) // Assuming 7 mph avg
  };
}

// Fuel statistics
async function getFuelStatistics(orgId, dateRange) {
  // Calculate: total_gallons, total_cost, avg_price_per_gallon, avg_mpg
}

// Efficiency report
async function getFuelEfficiencyReport(orgId, dateRange) {
  // Return efficiency trends over time
}
```

---

## Step 4: Backend Service - Expenses (25 min)

**Create:** `server/services/expense-service.js`

**Key functions:**

```javascript
// Expense CRUD
async function createExpense(orgId, expenseData)
async function getExpenses(orgId, filters)
async function getExpenseById(expenseId)
async function updateExpense(expenseId, updates)
async function deleteExpense(expenseId)

// Reports
async function getExpenseReport(orgId, startDate, endDate, groupBy) {
  // Group by: category, month, vendor
  // Calculate totals per group
  // Calculate percentages
  // Return tax-deductible total
}

async function getExpensesByCategory(orgId, dateRange) {
  // For pie chart
}

async function getExpensesByMonth(orgId, year) {
  // For line chart
}

// Budget tracking
async function createOrUpdateBudget(orgId, budgetData)
async function getBudgetComparison(orgId, year, month) {
  // Compare budget vs actual per category
  // Return: budget, actual, difference, percentage_used, status (over/under budget)
}

// Export
async function exportExpenses(orgId, startDate, endDate, format) {
  // Export as CSV or JSON
  // Include all fields for tax/accounting
}

// Integration helpers
async function createExpenseFromFuel(fuelLog) {
  // Auto-create expense entry when fuel logged
}

async function createExpenseFromMaintenance(maintenanceCompletion) {
  // Auto-create expense entry when maintenance completed with cost
}
```

---

## Step 5: Backend Routes (25 min)

**Create:** `server/routes/fuel-logs.js`

```javascript
const express = require('express');
const router = express.Router({ mergeParams: true });
const fuelService = require('../services/fuel-service');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/organizations/:orgId/fuel-logs
router.get('/', async (req, res) => {
  const { orgId } = req.params;
  const { start_date, end_date, fuel_type } = req.query;
  // Call fuelService.getFuelLogs()
});

// POST /api/organizations/:orgId/fuel-logs
router.post('/', async (req, res) => {
  // Create fuel log
  // Calculate efficiency
  // Create expense entry
});

// GET /api/organizations/:orgId/fuel-logs/efficiency
router.get('/efficiency', async (req, res) => {
  // Get efficiency report
});

module.exports = router;
```

**Create:** `server/routes/expenses.js`

```javascript
// GET /api/organizations/:orgId/expenses
router.get('/', async (req, res) => {
  const { start_date, end_date, category, tax_deductible } = req.query;
});

// POST /api/organizations/:orgId/expenses
router.post('/', async (req, res) => {});

// GET /api/organizations/:orgId/expenses/report
router.get('/report', async (req, res) => {
  const { start_date, end_date, group_by } = req.query;
});

// GET /api/organizations/:orgId/expenses/budget-comparison
router.get('/budget-comparison', async (req, res) => {
  const { year, month } = req.query;
});

// POST /api/organizations/:orgId/expenses/budgets
router.post('/budgets', async (req, res) => {});

// GET /api/organizations/:orgId/expenses/export
router.get('/export', async (req, res) => {
  const { start_date, end_date, format } = req.query;
  // Return CSV file download
});
```

**Register routes in `server/index.js`:**
```javascript
app.use('/api/organizations/:orgId/fuel-logs', require('./routes/fuel-logs'));
app.use('/api/organizations/:orgId/expenses', require('./routes/expenses'));
```

---

## Step 6: Frontend - Expense Dashboard (25 min)

**Create:** `client/src/views/Expenses.vue`

**Features:**
- Summary cards (Total Expenses, This Month, Budget Status)
- Category breakdown pie chart
- Monthly trend line chart
- Recent expenses list
- Quick add buttons

**Template structure:**

```vue
<template>
  <div class="expenses-view">
    <div class="header">
      <h1>Expenses</h1>
      <div class="actions">
        <button @click="showAddExpenseModal = true">+ Add Expense</button>
        <button @click="showAddFuelModal = true">⛽ Log Fuel</button>
        <button @click="showReportModal = true">📊 Generate Report</button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="card">
        <div class="value">${{ totalExpenses.toFixed(2) }}</div>
        <div class="label">Total Expenses (YTD)</div>
      </div>

      <div class="card">
        <div class="value">${{ thisMonthExpenses.toFixed(2) }}</div>
        <div class="label">This Month</div>
        <div class="sublabel">{{ monthVsLastMonth }}% vs last month</div>
      </div>

      <div class="card">
        <div class="value">{{ budgetUsedPercentage }}%</div>
        <div class="label">Budget Used</div>
        <div class="sublabel">{{ budgetStatus }}</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <div class="chart-container">
        <h3>Expenses by Category</h3>
        <PieChart :data="categoryChartData" />
      </div>

      <div class="chart-container">
        <h3>Monthly Trend</h3>
        <LineChart :data="monthlyTrendData" />
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input type="date" v-model="filters.start_date">
      <input type="date" v-model="filters.end_date">

      <select v-model="filters.category">
        <option value="">All Categories</option>
        <option>Fuel & Oil</option>
        <option>Maintenance & Repairs</option>
        <option>Insurance</option>
        <!-- ... more categories -->
      </select>

      <label>
        <input type="checkbox" v-model="filters.tax_deductible">
        Tax Deductible Only
      </label>
    </div>

    <!-- Expenses Table -->
    <table class="expenses-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Vendor</th>
          <th>Tax Ded.</th>
          <th>Receipt</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="expense in filteredExpenses" :key="expense.id">
          <td>{{ formatDate(expense.expense_date) }}</td>
          <td>{{ expense.category }}</td>
          <td>{{ expense.description }}</td>
          <td class="amount">${{ expense.amount.toFixed(2) }}</td>
          <td>{{ expense.vendor || '-' }}</td>
          <td>{{ expense.is_tax_deductible ? '✓' : '' }}</td>
          <td>{{ expense.receipt_document_id ? '📎' : '' }}</td>
          <td>
            <button @click="viewExpense(expense)">View</button>
            <button @click="editExpense(expense)">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>

    <AddExpenseModal v-if="showAddExpenseModal" @close="showAddExpenseModal = false" @saved="loadExpenses" />
    <AddFuelLogModal v-if="showAddFuelModal" @close="showAddFuelModal = false" @saved="loadExpenses" />
    <ExpenseReportModal v-if="showReportModal" @close="showReportModal = false" />
  </div>
</template>

<script>
import PieChart from '@/components/charts/PieChart.vue';
import LineChart from '@/components/charts/LineChart.vue';

export default {
  components: { PieChart, LineChart },
  data() {
    return {
      expenses: [],
      stats: {},
      filters: {
        start_date: null,
        end_date: null,
        category: '',
        tax_deductible: false
      },
      showAddExpenseModal: false,
      showAddFuelModal: false,
      showReportModal: false
    };
  },
  computed: {
    filteredExpenses() {
      return this.expenses.filter(expense => {
        // Apply filters
      });
    },
    totalExpenses() {
      return this.expenses.reduce((sum, e) => sum + e.amount, 0);
    },
    categoryChartData() {
      // Group expenses by category for pie chart
    },
    monthlyTrendData() {
      // Group expenses by month for line chart
    }
  },
  async mounted() {
    await this.loadExpenses();
  },
  methods: {
    async loadExpenses() {
      const response = await fetch(`/api/organizations/${this.orgId}/expenses`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await response.json();
      this.expenses = data.expenses;
      this.stats = data.stats;
    }
  }
};
</script>
```

---

## Step 7: Frontend - Fuel Log View (20 min)

**Create:** `client/src/views/FuelLog.vue`

**Features:**
- Fuel log table
- Fuel efficiency chart (MPG over time)
- Price trend chart
- Statistics panel
- "Add Fuel Entry" button

---

## Step 8: Modals (30 min)

**Create:** `client/src/components/AddFuelLogModal.vue`
- Fields: Date, Location, Fuel Type, Quantity, Price per Gallon, Total Cost, Odometer Reading, Tank Filled, Notes

**Create:** `client/src/components/AddExpenseModal.vue`
- Fields: Date, Category, Description, Amount, Payment Method, Vendor, Tax Deductible, Upload Receipt, Notes

**Create:** `client/src/components/ExpenseReportModal.vue`
- Date range picker, Group by selector, Preview, Export CSV button

**Create:** `client/src/components/BudgetPlannerModal.vue`
- Budget year, per-category budget amounts, save button

---

## Step 9: Charts Component (15 min)

**Create:** `client/src/components/ExpenseCharts.vue`

**Use Chart.js or similar library:**

```bash
npm install chart.js vue-chartjs
```

**Implement:**
1. Pie chart for category breakdown
2. Line chart for monthly trend
3. Bar chart for budget vs actual

---

## Step 10: Navigation & Router (8 min)

**Update:** `client/src/router.js`

```javascript
{
  path: '/expenses',
  component: () => import('./views/Expenses.vue'),
  meta: { requiresAuth: true }
},
{
  path: '/fuel-log',
  component: () => import('./views/FuelLog.vue'),
  meta: { requiresAuth: true }
}
```

**Update navigation:** Add "Expenses" and "Fuel Log" links

---

## Step 11: Dashboard Integration (10 min)

**Add expense summary widget to HomeView.vue:**
- This month expenses
- Top category
- Budget status

---

## Step 12: Demo Data (15 min)

**Create:** `server/seed-fuel-expense-demo-data.js`

**Sample data:**
- 20-25 fuel log entries (3-4 months)
- 40-50 expense entries across all categories
- 1 annual budget with 8-10 category budgets
- Ensure realistic patterns and trends

**Run:**
```bash
node server/seed-fuel-expense-demo-data.js
```

---

## Step 13: Testing (15 min)

**Test checklist:**
- [ ] Can log fuel purchases
- [ ] Fuel efficiency auto-calculated
- [ ] Can add expenses
- [ ] Expense report generates correctly
- [ ] Charts display (pie, line, bar)
- [ ] Can export expenses as CSV
- [ ] Budget vs actual comparison works
- [ ] Can attach receipts
- [ ] Activity timeline shows fuel/expense events

---

## Step 14: Completion (5 min)

```bash
git add .
git commit -m "[SESSION-10] Add fuel log & expense tracker

Features:
- Fuel consumption tracking with efficiency calculations
- Complete expense management system
- Budget tracking and comparison
- Expense reports with category breakdown
- Financial charts (pie, line, bar)
- CSV export for accounting/tax purposes
- Receipt attachment
- Integration with maintenance costs
- Dashboard financial summary widget

Database: 3 new tables (fuel_logs, expenses, expense_budgets)
API: 9 new endpoints
Frontend: 2 views (Expenses, FuelLog) + 4 modals + charts"

git push origin feature/fuel-expense-tracker
```

**Create:** `SESSION-10-COMPLETE.md`

---

## Success Criteria

✅ Database migration creates 3 tables
✅ All 9 API endpoints working
✅ Can log fuel purchases
✅ Fuel efficiency auto-calculated
✅ Can add expenses with categorization
✅ Expense report generation works
✅ Budget vs actual comparison works
✅ Charts display correctly (pie, line, bar)
✅ Can export expense data as CSV
✅ Can attach receipts
✅ Dashboard shows expense summary
✅ Demo data loads successfully

---

## Notes

**This is the most complex feature!** It involves:
- 2 services (fuel, expenses)
- 2 routes files
- 2 main views
- 4+ modals
- Chart integration
- CSV export

Take your time and test thoroughly. This feature provides the most business value for boat owners tracking operating costs.

**Go build! 🚀**
