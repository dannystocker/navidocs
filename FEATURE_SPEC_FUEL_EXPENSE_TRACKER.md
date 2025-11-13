# Feature Spec: Fuel Log & Expense Tracker

**Created:** 2025-11-13
**Priority:** P1 (Core Feature)
**Estimated Time:** 90-120 minutes
**Assignee:** Cloud Session 10

---

## Executive Summary

Add fuel consumption tracking and expense management to NaviDocs. Boat owners need to monitor fuel usage, calculate efficiency, track all operating expenses, and generate financial reports for tax purposes or ownership cost analysis.

**Value Proposition:**
- Track fuel purchases and consumption
- Calculate fuel efficiency (MPG or L/hr)
- Monitor all boat expenses by category
- Generate expense reports and charts
- Trip cost analysis
- Tax preparation support
- Budget tracking and forecasting

---

## User Story

**As a** boat owner
**I want to** track fuel consumption and all boat expenses
**So that** I can monitor operating costs, improve efficiency, and prepare financial reports

**Acceptance Criteria:**
1. ✅ Log fuel purchases (gallons, cost, location, odometer/hours)
2. ✅ Calculate fuel efficiency automatically
3. ✅ Track all expenses by category
4. ✅ Attach receipts to expense entries
5. ✅ View expense summary and trends
6. ✅ Generate expense reports by date range
7. ✅ Export data for tax purposes
8. ✅ View fuel efficiency charts

---

## Database Schema

### Table: `fuel_logs`

```sql
CREATE TABLE fuel_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  log_date INTEGER NOT NULL,
  location TEXT, -- Marina, fuel dock, or city
  fuel_type TEXT NOT NULL, -- 'diesel', 'gasoline', 'premium'
  quantity_gallons REAL NOT NULL,
  price_per_gallon REAL NOT NULL,
  total_cost REAL NOT NULL,
  odometer_reading INTEGER, -- Engine hours or nautical miles
  tank_filled BOOLEAN DEFAULT 0, -- Full tank or partial fill
  fuel_dock TEXT,
  receipt_document_id TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (receipt_document_id) REFERENCES documents(id) ON DELETE SET NULL
);

CREATE INDEX idx_fuel_org ON fuel_logs(organization_id);
CREATE INDEX idx_fuel_date ON fuel_logs(log_date);
CREATE INDEX idx_fuel_odometer ON fuel_logs(odometer_reading);
```

### Table: `expenses`

```sql
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  expense_date INTEGER NOT NULL,
  category TEXT NOT NULL, -- 'fuel', 'maintenance', 'insurance', 'dockage', 'storage', 'equipment', 'supplies', 'crew', 'food', 'repairs', 'upgrades', 'other'
  subcategory TEXT,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT, -- 'cash', 'credit_card', 'check', 'bank_transfer'
  vendor TEXT,
  is_tax_deductible BOOLEAN DEFAULT 0,
  receipt_document_id TEXT,
  equipment_id TEXT, -- Link to equipment if equipment-related expense
  maintenance_task_id TEXT, -- Link to maintenance task if applicable
  contact_id TEXT, -- Link to service provider or vendor
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (receipt_document_id) REFERENCES documents(id) ON DELETE SET NULL,
  FOREIGN KEY (equipment_id) REFERENCES equipment_inventory(id) ON DELETE SET NULL,
  FOREIGN KEY (maintenance_task_id) REFERENCES maintenance_tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE INDEX idx_expenses_org ON expenses(organization_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_tax_deductible ON expenses(is_tax_deductible);
```

### Table: `expense_budgets`

```sql
CREATE TABLE expense_budgets (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  budget_year INTEGER NOT NULL,
  budget_month INTEGER, -- NULL for annual budgets, 1-12 for monthly
  category TEXT NOT NULL,
  budget_amount REAL NOT NULL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_budgets_org ON expense_budgets(organization_id);
CREATE INDEX idx_budgets_year_month ON expense_budgets(budget_year, budget_month);
CREATE INDEX idx_budgets_category ON expense_budgets(category);
```

---

## Expense Categories

**Predefined Categories:**
- Fuel & Oil
- Maintenance & Repairs
- Insurance
- Dockage & Mooring
- Winter Storage
- Equipment Purchases
- Parts & Supplies
- Crew Wages
- Food & Provisions
- Cleaning & Detailing
- Upgrades & Improvements
- Registration & Licenses
- Survey & Inspection
- Electronics
- Safety Equipment
- Entertainment & Charter
- Other

---

## API Endpoints

### 1. List Fuel Logs

**GET** `/api/organizations/:orgId/fuel-logs`

**Query Params:**
- `start_date` (optional) - Unix timestamp
- `end_date` (optional) - Unix timestamp
- `fuel_type` (optional) - Filter by fuel type

**Response:**
```json
{
  "fuel_logs": [
    {
      "id": "fuel_123",
      "log_date": 1699920000000,
      "location": "Newport Harbor Marina",
      "fuel_type": "diesel",
      "quantity_gallons": 45.5,
      "price_per_gallon": 4.25,
      "total_cost": 193.38,
      "odometer_reading": 1250,
      "tank_filled": true,
      "fuel_dock": "Newport Fuel Dock"
    }
  ],
  "stats": {
    "total_fuel_logs": 24,
    "total_gallons": 1125.5,
    "total_cost": 4782.13,
    "avg_price_per_gallon": 4.25,
    "avg_fuel_efficiency_mpg": 2.8
  }
}
```

### 2. Add Fuel Log

**POST** `/api/organizations/:orgId/fuel-logs`

**Body:**
```json
{
  "log_date": 1699920000000,
  "location": "Newport Harbor Marina",
  "fuel_type": "diesel",
  "quantity_gallons": 45.5,
  "price_per_gallon": 4.25,
  "total_cost": 193.38,
  "odometer_reading": 1250,
  "tank_filled": true,
  "fuel_dock": "Newport Fuel Dock",
  "notes": "Full tank before offshore trip"
}
```

**Response:**
- Creates fuel log
- Auto-calculates fuel efficiency if previous log with odometer exists
- Creates corresponding expense entry in 'Fuel & Oil' category

### 3. Get Fuel Efficiency Report

**GET** `/api/organizations/:orgId/fuel-logs/efficiency`

**Query Params:**
- `start_date` (optional)
- `end_date` (optional)

**Response:**
```json
{
  "efficiency": {
    "total_gallons_consumed": 1125.5,
    "total_distance_miles": 3150,
    "avg_mpg": 2.8,
    "total_hours": 425,
    "gallons_per_hour": 2.65
  },
  "efficiency_by_month": [
    {
      "month": "2025-01",
      "gallons": 125.5,
      "distance_miles": 350,
      "mpg": 2.79
    }
  ]
}
```

### 4. List Expenses

**GET** `/api/organizations/:orgId/expenses`

**Query Params:**
- `start_date` (optional)
- `end_date` (optional)
- `category` (optional)
- `tax_deductible` (optional) - Boolean

**Response:**
```json
{
  "expenses": [
    {
      "id": "exp_123",
      "expense_date": 1699920000000,
      "category": "Maintenance & Repairs",
      "subcategory": "Engine Service",
      "description": "Engine oil change and filter replacement",
      "amount": 265.50,
      "vendor": "ABC Marine Services",
      "payment_method": "credit_card",
      "is_tax_deductible": true,
      "has_receipt": true
    }
  ],
  "stats": {
    "total_expenses": 156,
    "total_amount": 23456.78,
    "avg_expense": 150.36,
    "by_category": {
      "Fuel & Oil": 4782.13,
      "Maintenance & Repairs": 8945.67,
      "Insurance": 2500.00,
      "Dockage & Mooring": 5400.00,
      "Other": 1828.98
    }
  }
}
```

### 5. Add Expense

**POST** `/api/organizations/:orgId/expenses`

**Body:**
```json
{
  "expense_date": 1699920000000,
  "category": "Maintenance & Repairs",
  "subcategory": "Engine Service",
  "description": "Engine oil change and filter replacement",
  "amount": 265.50,
  "payment_method": "credit_card",
  "vendor": "ABC Marine Services",
  "is_tax_deductible": true,
  "contact_id": "cnt_123",
  "maintenance_task_id": "mt_456",
  "notes": "Annual service completed"
}
```

### 6. Get Expense Report

**GET** `/api/organizations/:orgId/expenses/report`

**Query Params:**
- `start_date` (required)
- `end_date` (required)
- `group_by` (optional) - 'category', 'month', 'vendor'

**Response:**
```json
{
  "report": {
    "period": {
      "start": 1699920000000,
      "end": 1735689600000
    },
    "total_expenses": 23456.78,
    "by_category": [
      {
        "category": "Maintenance & Repairs",
        "total": 8945.67,
        "count": 24,
        "percentage": 38.1
      }
    ],
    "by_month": [
      {
        "month": "2025-01",
        "total": 2845.67,
        "count": 18
      }
    ],
    "tax_deductible_total": 18234.56
  }
}
```

### 7. Get Budget vs Actual

**GET** `/api/organizations/:orgId/expenses/budget-comparison`

**Query Params:**
- `year` (required)
- `month` (optional)

**Response:**
```json
{
  "comparison": [
    {
      "category": "Fuel & Oil",
      "budget": 6000.00,
      "actual": 4782.13,
      "difference": 1217.87,
      "percentage_used": 79.7,
      "status": "under_budget"
    },
    {
      "category": "Maintenance & Repairs",
      "budget": 8000.00,
      "actual": 8945.67,
      "difference": -945.67,
      "percentage_used": 111.8,
      "status": "over_budget"
    }
  ],
  "totals": {
    "total_budget": 30000.00,
    "total_actual": 23456.78,
    "total_difference": 6543.22,
    "percentage_used": 78.2
  }
}
```

### 8. Create/Update Budget

**POST/PUT** `/api/organizations/:orgId/expenses/budgets`

**Body:**
```json
{
  "budget_year": 2025,
  "budget_month": null,
  "budgets": [
    {
      "category": "Fuel & Oil",
      "budget_amount": 6000.00
    },
    {
      "category": "Maintenance & Repairs",
      "budget_amount": 8000.00
    }
  ]
}
```

### 9. Export Expense Data

**GET** `/api/organizations/:orgId/expenses/export`

**Query Params:**
- `start_date` (required)
- `end_date` (required)
- `format` (optional) - 'csv', 'json' (default: 'csv')

**Response:**
- CSV or JSON file download
- Includes all expense fields for tax/accounting purposes

---

## Frontend Components

### 1. Expense Dashboard (`client/src/views/Expenses.vue`)

**Features:**
- Summary cards (Total Expenses, This Month, Budget Status)
- Category breakdown pie chart
- Expense trend line chart (monthly)
- Recent expenses list
- Quick add expense button
- Fuel log summary
- Export button

**Summary Cards:**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ $23,456.78      │  │ $2,845.67       │  │ 78.2%           │
│ Total Expenses  │  │ This Month      │  │ Budget Used     │
│ YTD             │  │ +15% vs last    │  │ Under budget    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2. Fuel Log View (`client/src/views/FuelLog.vue`)

**Features:**
- Table of fuel entries
- Fuel efficiency chart (MPG or GPH over time)
- Price trend chart
- "Add Fuel Entry" button
- Filter by date range
- Statistics panel (total fuel, avg price, avg efficiency)

**Fuel Efficiency Chart:**
- Line chart showing MPG or L/hr over time
- Highlight efficiency improvements
- Color-coded by fuel type

### 3. Add Fuel Log Modal (`client/src/components/AddFuelLogModal.vue`)

**Form Fields:**
- Date* (date picker - default: today)
- Location
- Fuel Type* (dropdown: Diesel, Gasoline, Premium)
- Quantity (gallons)*
- Price per Gallon*
- Total Cost* (auto-calculated)
- Odometer Reading (hours or miles)
- Tank Filled (checkbox)
- Fuel Dock/Station
- Upload Receipt (optional)
- Notes

### 4. Add Expense Modal (`client/src/components/AddExpenseModal.vue`)

**Form Fields:**
- Date* (date picker - default: today)
- Category* (dropdown)
- Subcategory
- Description*
- Amount*
- Payment Method (dropdown)
- Vendor/Service Provider
- Tax Deductible (checkbox)
- Upload Receipt (optional)
- Link to Equipment (optional dropdown)
- Link to Maintenance Task (optional dropdown)
- Notes

### 5. Expense Report Generator (`client/src/components/ExpenseReportModal.vue`)

**Features:**
- Date range picker
- Group by: Category, Month, Vendor
- Filter: Tax deductible only, Category
- Preview report
- Export as CSV or PDF
- Print report

### 6. Budget Planner (`client/src/components/BudgetPlannerModal.vue`)

**Form Fields:**
- Budget Year*
- Budget Period (Annual or Monthly)
- Per Category:
  - Category name
  - Budget amount
  - Notes

**Visual:**
- Show previous year actuals for reference
- Calculate recommended budget based on history
- Budget vs Actual comparison bars

### 7. Expense Charts Component (`client/src/components/ExpenseCharts.vue`)

**Charts:**
1. **Category Breakdown** - Pie chart
2. **Monthly Trend** - Line chart
3. **Budget vs Actual** - Bar chart (per category)
4. **Fuel Efficiency** - Line chart over time
5. **Top Vendors** - Horizontal bar chart

---

## Fuel Efficiency Calculation

```javascript
function calculateFuelEfficiency(currentLog, previousLog) {
  if (!previousLog || !previousLog.odometer_reading || !currentLog.odometer_reading) {
    return null; // Cannot calculate without odometer readings
  }

  const distanceTraveled = currentLog.odometer_reading - previousLog.odometer_reading;
  const fuelConsumed = currentLog.quantity_gallons;

  if (distanceTraveled <= 0 || fuelConsumed <= 0) {
    return null;
  }

  // Miles per gallon
  const mpg = distanceTraveled / fuelConsumed;

  return {
    distance_traveled: distanceTraveled,
    fuel_consumed: fuelConsumed,
    mpg: mpg.toFixed(2),
    gallons_per_hour: currentLog.tank_filled ? (fuelConsumed / (distanceTraveled / 7)).toFixed(2) : null // Assuming 7 mph avg
  };
}
```

---

## Implementation Steps

### Phase 1: Database (15 min)

1. Create migration: `server/migrations/015_fuel_expense_tracker.sql`
2. Run migration
3. Verify 3 tables created

### Phase 2: Backend Service (35 min)

1. Create: `server/services/fuel-service.js`
   - Fuel log CRUD
   - Fuel efficiency calculations
   - Statistics aggregation

2. Create: `server/services/expense-service.js`
   - Expense CRUD
   - Report generation
   - Budget tracking
   - Export functionality

### Phase 3: Backend Routes (25 min)

1. Create: `server/routes/fuel-logs.js`
2. Create: `server/routes/expenses.js`
3. Implement all endpoints
4. Register routes

### Phase 4: Frontend Views (40 min)

1. Create `views/Expenses.vue` (dashboard)
2. Create `views/FuelLog.vue`
3. Update router: Add `/expenses` and `/fuel-log` routes
4. Update navigation: Add "Expenses" and "Fuel Log" links

### Phase 5: Frontend Components (30 min)

1. Create `components/AddFuelLogModal.vue`
2. Create `components/AddExpenseModal.vue`
3. Create `components/ExpenseCharts.vue` (use Chart.js or similar)
4. Create `components/ExpenseReportModal.vue`
5. Create `components/BudgetPlannerModal.vue`

### Phase 6: Integration (10 min)

1. Auto-create expense entries when fuel logged
2. Link maintenance costs to expenses
3. Link service provider payments to expenses
4. Add expense summary widget to dashboard

### Phase 7: Demo Data (15 min)

Create sample data:
- 20-25 fuel log entries (3-4 months of data)
- 40-50 expense entries across all categories
- 1 annual budget
- Ensure data shows trends and patterns

---

## Demo Data

**Sample Fuel Logs (Last 90 Days):**
- 12 diesel fuel purchases
- Odometer readings showing 850 nautical miles traveled
- Fuel efficiency: 2.5 - 3.2 MPG
- Price range: $4.15 - $4.85 per gallon
- Total fuel cost: $2,450

**Sample Expenses by Category:**
- Fuel & Oil: $2,450 (12 entries)
- Maintenance & Repairs: $3,850 (8 entries)
- Insurance: $2,500 (1 entry - annual)
- Dockage & Mooring: $1,800 (3 months × $600)
- Parts & Supplies: $875 (6 entries)
- Cleaning & Detailing: $450 (3 entries)
- Equipment Purchases: $1,250 (2 entries)
- Food & Provisions: $680 (8 entries)
- Other: $425 (5 entries)

**Total Demo Expenses:** $14,280 (over 90 days)

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
✅ Can attach receipts to expenses
✅ Dashboard shows expense summary
✅ Demo data loads successfully

---

## Integration Points

**With Maintenance:**
- Auto-create expense entry when maintenance completed with cost
- Link maintenance tasks to expenses
- Show maintenance costs in expense reports

**With Contacts:**
- Link service provider payments to contacts
- Track spending per vendor
- Show vendor payment history

**With Timeline:**
- Log fuel entries
- Log major expenses
- Show expense milestones

**With Dashboard:**
- Expense summary widget
- Budget status indicator
- Fuel efficiency trend

---

**Duration:** 90-120 minutes
**Dependencies:** Maintenance Scheduler (for expense linking), Contacts (for vendor linking)
**Branch:** `feature/fuel-expense-tracker`
