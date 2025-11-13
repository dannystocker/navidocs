# Maintenance Log & Reminder System (S2-H03)

## System Overview

The Maintenance Log & Reminder System provides comprehensive tracking of marine vessel maintenance activities with intelligent reminder generation based on both calendar dates and engine hours. This system integrates with contact management (S2-H05) and calendar systems (S2-H07A) to provide a complete maintenance lifecycle management solution.

---

## 1. Database Schema

### Primary Table: `maintenance_log`

```sql
CREATE TABLE maintenance_log (
  -- Primary Keys & Foreign Keys
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  boat_id BIGINT NOT NULL,

  -- Service Information
  service_type ENUM(
    'engine',
    'electronics',
    'hull',
    'deck',
    'safety_equipment',
    'antifouling',
    'survey'
  ) NOT NULL,

  -- Date & Time Tracking
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Maintenance Details
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  provider VARCHAR(255) NOT NULL,
  notes TEXT,
  receipt_url VARCHAR(500),

  -- Engine Hours at Service
  engine_hours INT,

  -- Next Service Scheduling
  next_due_date DATE,
  next_due_engine_hours INT,

  -- Soft Delete for Audit Trail
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,

  -- Indexing for Performance
  INDEX idx_boat_id (boat_id),
  INDEX idx_service_type (service_type),
  INDEX idx_date (date),
  INDEX idx_next_due_date (next_due_date),
  INDEX idx_engine_hours (engine_hours),
  INDEX idx_boat_service_type (boat_id, service_type),
  CONSTRAINT fk_boat_id FOREIGN KEY (boat_id) REFERENCES boats(id)
);
```

### Supporting Table: `maintenance_service_intervals`

Defines standard service intervals for each service type:

```sql
CREATE TABLE maintenance_service_intervals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  service_type ENUM(
    'engine',
    'electronics',
    'hull',
    'deck',
    'safety_equipment',
    'antifouling',
    'survey'
  ) NOT NULL UNIQUE,

  -- Standard intervals
  months_interval INT,
  engine_hours_interval INT,
  description VARCHAR(500),

  -- Notification rules
  days_before_due INT DEFAULT 7,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_service_type (service_type)
);
```

**Sample Data:**
```sql
INSERT INTO maintenance_service_intervals VALUES
  (1, 'engine', 6, 100, 'Engine oil and filter change', 14),
  (2, 'engine', 12, 500, 'Impeller replacement', 14),
  (3, 'electronics', 12, NULL, 'Electronics systems check', 7),
  (4, 'hull', 24, NULL, 'Hull inspection and antifouling check', 30),
  (5, 'deck', 12, NULL, 'Deck hardware and fasteners inspection', 7),
  (6, 'safety_equipment', 12, NULL, 'Safety equipment certification', 30),
  (7, 'antifouling', 12, NULL, 'Haul-out and antifouling paint', 60),
  (8, 'survey', 60, NULL, 'Professional marine survey', 90);
```

### Supporting Table: `maintenance_reminders`

Tracks reminder notifications sent to users:

```sql
CREATE TABLE maintenance_reminders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  maintenance_log_id BIGINT NOT NULL,
  boat_id BIGINT NOT NULL,

  -- Reminder Configuration
  days_before_due INT NOT NULL,
  reminder_type ENUM('date_based', 'engine_hours_based', 'hybrid') NOT NULL,

  -- Notification Status
  notification_status ENUM('pending', 'sent', 'dismissed', 'snoozed') DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  dismissed_at TIMESTAMP NULL,
  snoozed_until TIMESTAMP NULL,

  -- Tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_boat_id (boat_id),
  INDEX idx_maintenance_log_id (maintenance_log_id),
  INDEX idx_notification_status (notification_status),
  INDEX idx_days_before_due (days_before_due),
  CONSTRAINT fk_maintenance_log FOREIGN KEY (maintenance_log_id) REFERENCES maintenance_log(id),
  CONSTRAINT fk_boat_id_reminders FOREIGN KEY (boat_id) REFERENCES boats(id)
);
```

### Supporting Table: `maintenance_service_history`

Audit log for historical service patterns per boat and service type:

```sql
CREATE TABLE maintenance_service_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  boat_id BIGINT NOT NULL,
  service_type VARCHAR(50) NOT NULL,

  -- Historical Aggregates
  last_service_date DATE,
  last_service_engine_hours INT,
  total_services INT DEFAULT 0,
  average_cost DECIMAL(10, 2),
  total_cost DECIMAL(12, 2),

  -- Performance Metrics
  average_days_between_service INT,
  average_hours_between_service INT,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_boat_service (boat_id, service_type),
  INDEX idx_boat_id (boat_id),
  CONSTRAINT fk_boat_id_history FOREIGN KEY (boat_id) REFERENCES boats(id)
);
```

---

## 2. API Endpoints

### 2.1 Maintenance Log CRUD Operations

#### CREATE: Add New Maintenance Record
```
POST /api/v1/boats/{boatId}/maintenance
Content-Type: application/json

Request Body:
{
  "service_type": "engine",
  "date": "2024-11-13",
  "cost": 450.00,
  "provider": "West Marine",
  "notes": "Oil change and filter replacement",
  "receipt_url": "https://storage.example.com/receipt-123.pdf",
  "engine_hours": 2450,
  "next_due_date": "2025-05-13",
  "next_due_engine_hours": 2550
}

Response (201 Created):
{
  "id": 1001,
  "boat_id": 5,
  "service_type": "engine",
  "date": "2024-11-13",
  "cost": 450.00,
  "provider": "West Marine",
  "notes": "Oil change and filter replacement",
  "receipt_url": "https://storage.example.com/receipt-123.pdf",
  "engine_hours": 2450,
  "next_due_date": "2025-05-13",
  "next_due_engine_hours": 2550,
  "created_at": "2024-11-13T14:32:00Z",
  "reminders": [
    {
      "id": 5001,
      "days_before_due": 60,
      "reminder_type": "date_based",
      "notification_status": "pending"
    }
  ]
}
```

#### READ: Get Maintenance Records
```
GET /api/v1/boats/{boatId}/maintenance
Query Parameters:
  - service_type: Optional filter (engine, electronics, hull, deck, safety_equipment, antifouling, survey)
  - start_date: ISO 8601 date
  - end_date: ISO 8601 date
  - status: pending, completed, overdue
  - limit: 50 (default), max 500
  - offset: 0 (default)

Response (200 OK):
{
  "total": 47,
  "limit": 50,
  "offset": 0,
  "records": [
    {
      "id": 1001,
      "boat_id": 5,
      "service_type": "engine",
      "date": "2024-11-13",
      "cost": 450.00,
      "provider": "West Marine",
      "engine_hours": 2450,
      "next_due_date": "2025-05-13",
      "next_due_engine_hours": 2550,
      "created_at": "2024-11-13T14:32:00Z"
    }
  ]
}
```

#### UPDATE: Modify Maintenance Record
```
PATCH /api/v1/boats/{boatId}/maintenance/{maintenanceId}
Content-Type: application/json

Request Body:
{
  "cost": 475.00,
  "notes": "Oil change, filter replacement, coolant top-up"
}

Response (200 OK):
{
  "id": 1001,
  "boat_id": 5,
  "service_type": "engine",
  "date": "2024-11-13",
  "cost": 475.00,
  "provider": "West Marine",
  "notes": "Oil change, filter replacement, coolant top-up",
  "updated_at": "2024-11-13T15:45:00Z"
}
```

#### DELETE: Remove Maintenance Record
```
DELETE /api/v1/boats/{boatId}/maintenance/{maintenanceId}

Response (204 No Content)
```

### 2.2 Smart Reminder Endpoints

#### Get Upcoming Reminders
```
GET /api/v1/boats/{boatId}/maintenance/reminders/upcoming
Query Parameters:
  - days_window: 30 (default, look ahead 30 days)
  - include_engine_hours: true/false
  - sort_by: days_remaining, date, engine_hours

Response (200 OK):
{
  "total": 5,
  "upcoming_reminders": [
    {
      "id": 5001,
      "service_type": "engine",
      "last_service_date": "2024-11-13",
      "next_due_date": "2025-05-13",
      "next_due_engine_hours": 2550,
      "current_engine_hours": 2480,
      "days_until_due": 181,
      "hours_until_due": 70,
      "reminder_type": "hybrid",
      "due_trigger": "engine_hours",
      "provider": "West Marine",
      "estimated_cost": 450.00
    }
  ]
}
```

#### Trigger Reminder Notification
```
POST /api/v1/boats/{boatId}/maintenance/reminders/{reminderId}/send
Request Body: {}

Response (200 OK):
{
  "id": 5001,
  "notification_status": "sent",
  "sent_at": "2024-11-13T14:32:00Z",
  "notification_channels": ["push", "email", "sms"]
}
```

#### Update Reminder Status
```
PATCH /api/v1/boats/{boatId}/maintenance/reminders/{reminderId}
Content-Type: application/json

Request Body:
{
  "notification_status": "dismissed"
}

Response (200 OK):
{
  "id": 5001,
  "notification_status": "dismissed",
  "dismissed_at": "2024-11-13T15:00:00Z"
}
```

#### Snooze Reminder
```
POST /api/v1/boats/{boatId}/maintenance/reminders/{reminderId}/snooze
Content-Type: application/json

Request Body:
{
  "snooze_days": 7
}

Response (200 OK):
{
  "id": 5001,
  "notification_status": "snoozed",
  "snoozed_until": "2024-11-20T14:32:00Z"
}
```

### 2.3 Service Provider Auto-Suggest (S2-H05 Integration)

#### Get Provider Suggestions
```
GET /api/v1/boats/{boatId}/maintenance/providers/suggest
Query Parameters:
  - service_type: Required (engine, electronics, hull, deck, safety_equipment, antifouling, survey)
  - limit: 10 (default)

Response (200 OK):
{
  "service_type": "engine",
  "suggestions": [
    {
      "id": "provider_123",
      "name": "West Marine",
      "type": "marine_service",
      "contact_id": "contact_456",
      "phone": "+1-555-0100",
      "email": "service@westmarine.com",
      "address": "123 Harbor St, Marina City",
      "last_used": "2024-11-13",
      "times_used": 8,
      "average_cost": 450.00,
      "rating": 4.8
    },
    {
      "id": "provider_124",
      "name": "Marina Services Inc",
      "type": "marine_service",
      "contact_id": "contact_457",
      "phone": "+1-555-0101",
      "email": "info@marinaservices.com",
      "address": "456 Dock Ave, Marina City",
      "last_used": "2024-09-22",
      "times_used": 3,
      "average_cost": 500.00,
      "rating": 4.5
    }
  ]
}
```

### 2.4 Expense Rollup Endpoints

#### Year-to-Date Expenses
```
GET /api/v1/boats/{boatId}/maintenance/expenses/ytd
Query Parameters:
  - year: 2024 (optional, defaults to current year)

Response (200 OK):
{
  "year": 2024,
  "start_date": "2024-01-01",
  "end_date": "2024-11-13",
  "total_ytd": 8450.00,
  "by_service_type": {
    "engine": {
      "count": 4,
      "total": 1800.00,
      "average": 450.00
    },
    "electronics": {
      "count": 2,
      "total": 2100.00,
      "average": 1050.00
    },
    "hull": {
      "count": 1,
      "total": 3500.00,
      "average": 3500.00
    },
    "deck": {
      "count": 1,
      "total": 300.00,
      "average": 300.00
    },
    "safety_equipment": {
      "count": 0,
      "total": 0.00
    },
    "antifouling": {
      "count": 0,
      "total": 0.00
    },
    "survey": {
      "count": 0,
      "total": 0.00
    }
  },
  "by_provider": {
    "West Marine": 3500.00,
    "Marina Services Inc": 2450.00,
    "Electronics Pro": 2500.00
  }
}
```

#### Annual Budget Analysis
```
GET /api/v1/boats/{boatId}/maintenance/expenses/annual-analysis
Query Parameters:
  - year: 2024 (optional)

Response (200 OK):
{
  "year": 2024,
  "total_annual": 8450.00,
  "projected_annual": 11200.00,
  "budget_health": {
    "status": "on_track",
    "months_data": [
      {
        "month": "January",
        "month_number": 1,
        "total": 450.00,
        "vs_average": -42.50
      },
      {
        "month": "February",
        "month_number": 2,
        "total": 0.00,
        "vs_average": -492.50
      }
    ]
  }
}
```

#### All-Time Maintenance Summary
```
GET /api/v1/boats/{boatId}/maintenance/expenses/all-time
Response (200 OK):
{
  "boat_id": 5,
  "boat_name": "Sea Dream",
  "all_time_total": 42350.00,
  "record_count": 127,
  "first_service": "2018-03-15",
  "last_service": "2024-11-13",
  "average_annual_spend": 5293.75,
  "most_expensive_service": {
    "id": 950,
    "service_type": "survey",
    "date": "2022-06-10",
    "cost": 5500.00
  },
  "most_common_service": {
    "service_type": "engine",
    "count": 34,
    "total_cost": 15300.00,
    "average_cost": 450.00
  }
}
```

---

## 3. Reminder Calculation Algorithm

### 3.1 Core Algorithm: Dual-Trigger Reminder Logic

The reminder system calculates when maintenance is due based on **either** calendar date **or** engine hours, whichever comes first.

```javascript
/**
 * Calculate maintenance reminder status
 * @param {Object} maintenance - Maintenance record
 * @param {Date} referenceDate - Current date (default: today)
 * @param {number} currentEngineHours - Current engine hours on boat
 * @returns {Object} Reminder status and trigger information
 */
function calculateReminderStatus(maintenance, referenceDate = new Date(), currentEngineHours) {
  const nextDueDate = new Date(maintenance.next_due_date);
  const nextDueEngineHours = maintenance.next_due_engine_hours;

  // Calculate days until due
  const daysUntilDue = Math.floor((nextDueDate - referenceDate) / (1000 * 60 * 60 * 24));

  // Calculate hours until due
  const hoursUntilDue = nextDueEngineHours ? (nextDueEngineHours - currentEngineHours) : Infinity;

  // Determine which trigger fires first
  const isDateTriggered = daysUntilDue <= 0;
  const isHoursTriggered = hoursUntilDue <= 0;

  // Determine primary trigger when both exist
  let primaryTrigger = 'pending';
  let daysToAlert = daysUntilDue;

  if (isDateTriggered && isHoursTriggered) {
    primaryTrigger = daysUntilDue >= hoursUntilDue ? 'engine_hours' : 'date';
  } else if (isDateTriggered) {
    primaryTrigger = 'date';
  } else if (isHoursTriggered) {
    primaryTrigger = 'engine_hours';
  } else {
    // Calculate which will trigger first
    const daysToHours = hoursUntilDue / 25; // Assuming 25 hours per day average usage
    primaryTrigger = daysUntilDue <= daysToHours ? 'date' : 'engine_hours';
    daysToAlert = Math.min(daysUntilDue, Math.ceil(daysToHours));
  }

  // Determine alert status based on days remaining
  let alertStatus = 'on_schedule';
  if (daysUntilDue <= 0 || hoursUntilDue <= 0) {
    alertStatus = 'overdue';
  } else if (daysUntilDue <= 7) {
    alertStatus = 'critical';
  } else if (daysUntilDue <= 14) {
    alertStatus = 'urgent';
  } else if (daysUntilDue <= 30) {
    alertStatus = 'approaching';
  }

  return {
    maintenance_id: maintenance.id,
    service_type: maintenance.service_type,
    status: alertStatus,
    due_trigger: primaryTrigger,
    reminder_type: 'hybrid',
    next_due_date: nextDueDate.toISOString().split('T')[0],
    next_due_engine_hours: nextDueEngineHours,
    current_engine_hours: currentEngineHours,
    days_until_due: daysUntilDue,
    hours_until_due: hoursUntilDue,
    should_notify: alertStatus !== 'on_schedule'
  };
}

/**
 * Generate reminder records for upcoming maintenance
 * @param {Array} maintenanceRecords - Array of maintenance records
 * @param {number} currentEngineHours - Current engine hours
 * @param {Date} referenceDate - Current date
 * @returns {Array} Array of reminder records to persist
 */
function generateReminderRecords(maintenanceRecords, currentEngineHours, referenceDate = new Date()) {
  const reminders = [];
  const alertThresholds = [60, 30, 14, 7]; // Days before due

  maintenanceRecords.forEach(record => {
    const status = calculateReminderStatus(record, referenceDate, currentEngineHours);

    if (status.should_notify) {
      // Generate reminder for each threshold that applies
      alertThresholds.forEach(threshold => {
        if (status.days_until_due <= threshold && status.days_until_due > (threshold - 7)) {
          reminders.push({
            maintenance_log_id: record.id,
            boat_id: record.boat_id,
            days_before_due: threshold,
            reminder_type: status.due_trigger === 'engine_hours' ? 'engine_hours_based' : 'date_based',
            alert_status: status.status,
            due_trigger: status.due_trigger
          });
        }
      });
    }
  });

  return reminders;
}
```

### 3.2 Scheduling Algorithm: When to Send Notifications

```javascript
/**
 * Determine notification schedule for maintenance
 * @param {number} daysUntilDue - Days until maintenance is due
 * @returns {Object} Notification configuration
 */
function getNotificationSchedule(daysUntilDue) {
  const schedules = [
    { threshold: 60, interval: 'weekly', priority: 'low', message: 'Maintenance approaching' },
    { threshold: 30, interval: 'bi-weekly', priority: 'medium', message: 'Maintenance needed soon' },
    { threshold: 14, interval: 'weekly', priority: 'high', message: 'Maintenance due in 2 weeks' },
    { threshold: 7, interval: 'daily', priority: 'urgent', message: 'Maintenance due in 1 week' },
    { threshold: 0, interval: 'daily', priority: 'critical', message: 'OVERDUE: Maintenance required now' }
  ];

  return schedules.find(s => daysUntilDue <= s.threshold) || schedules[0];
}
```

---

## 4. Expense Rollup Queries

### 4.1 Year-to-Date Total by Service Type
```sql
SELECT
  ml.service_type,
  COUNT(*) as service_count,
  SUM(ml.cost) as total_cost,
  AVG(ml.cost) as average_cost,
  MIN(ml.cost) as min_cost,
  MAX(ml.cost) as max_cost
FROM maintenance_log ml
WHERE ml.boat_id = ?
  AND YEAR(ml.date) = YEAR(CURDATE())
  AND ml.is_deleted = FALSE
GROUP BY ml.service_type
ORDER BY total_cost DESC;
```

### 4.2 Monthly Breakdown
```sql
SELECT
  DATE_TRUNC('month', ml.date) as month,
  COUNT(*) as service_count,
  SUM(ml.cost) as total_cost,
  GROUP_CONCAT(DISTINCT ml.service_type) as service_types
FROM maintenance_log ml
WHERE ml.boat_id = ?
  AND ml.is_deleted = FALSE
GROUP BY DATE_TRUNC('month', ml.date)
ORDER BY month DESC;
```

### 4.3 Provider Expense Analysis
```sql
SELECT
  ml.provider,
  COUNT(*) as service_count,
  SUM(ml.cost) as total_cost,
  AVG(ml.cost) as average_cost,
  MAX(ml.date) as last_service_date,
  GROUP_CONCAT(DISTINCT ml.service_type) as service_types
FROM maintenance_log ml
WHERE ml.boat_id = ?
  AND ml.is_deleted = FALSE
GROUP BY ml.provider
ORDER BY total_cost DESC;
```

### 4.4 Projected Annual Maintenance Cost
```sql
SELECT
  YEAR(ml.date) as year,
  COUNT(*) as service_count,
  SUM(ml.cost) as annual_total,
  AVG(ml.cost) as average_service_cost,
  (SELECT AVG(annual_costs.yearly_total)
   FROM (
     SELECT SUM(ml2.cost) as yearly_total
     FROM maintenance_log ml2
     WHERE ml2.boat_id = ?
       AND ml2.is_deleted = FALSE
     GROUP BY YEAR(ml2.date)
   ) annual_costs) as historical_average
FROM maintenance_log ml
WHERE ml.boat_id = ?
  AND ml.is_deleted = FALSE
GROUP BY YEAR(ml.date)
ORDER BY year DESC;
```

### 4.5 Service Interval Performance
```sql
SELECT
  ml.service_type,
  COUNT(*) as total_services,
  AVG(DATEDIFF(ml.date, LAG(ml.date) OVER (PARTITION BY ml.service_type ORDER BY ml.date))) as avg_days_between_service,
  AVG(ml.engine_hours - LAG(ml.engine_hours) OVER (PARTITION BY ml.service_type ORDER BY ml.date)) as avg_hours_between_service,
  MAX(ml.date) as last_service,
  AVG(ml.cost) as average_cost
FROM maintenance_log ml
WHERE ml.boat_id = ?
  AND ml.is_deleted = FALSE
GROUP BY ml.service_type;
```

---

## 5. Integration Points

### 5.1 Integration with S2-H05 (Contact Management)

**Data Flow:** `maintenance_log.provider → contacts`

The Maintenance Log system pulls service provider contacts from S2-H05 to:
- Auto-suggest service providers based on past services
- Display provider contact information (phone, email, address)
- Track provider reliability and ratings
- Link maintenance records to specific provider contacts

**Required S2-H05 API Endpoints:**
```
GET /api/v1/boats/{boatId}/contacts/providers
  - Filter by service_type
  - Return contact details with contact_id

GET /api/v1/contacts/{contactId}
  - Return full contact information
  - Include communication preferences
  - Return provider ratings/history
```

**Maintenance Log Data Provided to S2-H05:**
```json
{
  "contact_id": "provider_123",
  "last_used": "2024-11-13",
  "times_used": 8,
  "average_cost": 450.00,
  "service_types_offered": ["engine", "electronics"]
}
```

### 5.2 Integration with S2-H07A (Calendar System)

**Data Flow:** `maintenance_log.next_due_date → calendar`

The Maintenance Log system exports service due dates to S2-H07A calendar to:
- Display scheduled maintenance on boat calendar
- Sync with mobile calendar applications
- Generate calendar notifications
- Track historical maintenance events

**Required S2-H07A API Endpoints:**
```
POST /api/v1/boats/{boatId}/calendar/events
  - Create maintenance event
  - Set event type: "maintenance"
  - Set due date and recurrence

DELETE /api/v1/boats/{boatId}/calendar/events/{eventId}
  - Remove maintenance event when complete

PATCH /api/v1/boats/{boatId}/calendar/events/{eventId}
  - Update event details when maintenance is rescheduled
```

**Calendar Event Payload:**
```json
{
  "title": "Oil Change Due",
  "description": "Engine oil and filter change - West Marine",
  "event_type": "maintenance",
  "service_type": "engine",
  "due_date": "2025-05-13",
  "due_engine_hours": 2550,
  "location": "West Marine, 123 Harbor St",
  "priority": "high",
  "alert_days": [7, 14, 30, 60],
  "provider_contact_id": "provider_123"
}
```

---

## 6. Mobile Notification Design

### 6.1 Notification Schedule

Notifications are triggered based on time-to-due thresholds:

| Days Before Due | Notification Type | Frequency | Priority | Message Template |
|---|---|---|---|---|
| 60+ | In-app badge | Weekly | Low | "{ServiceType} maintenance approaching" |
| 30-59 | Push + Email | Bi-weekly | Medium | "{ServiceType} service needed in {days} days" |
| 14-29 | Push + Email + SMS | Weekly | High | "Schedule {ServiceType} - due in {days} days" |
| 7-13 | Push + Email + SMS | Daily | Urgent | "URGENT: {ServiceType} due in {days} days" |
| <7 | Push + Email + SMS + In-App | Daily | Critical | "OVERDUE: {ServiceType} maintenance required" |

### 6.2 Push Notification Templates

#### 60-Day Reminder
```
Title: Maintenance Ahead
Body: Oil change coming up in 60 days (May 13)
Action: View Details → Maintenance Log Entry
```

#### 30-Day Reminder
```
Title: Schedule Maintenance
Body: Engine service needed in 30 days. Call West Marine to book.
Action: Call Provider | Snooze 7 Days | View Details
```

#### 14-Day Reminder
```
Title: Maintenance Due Soon
Body: Oil change due May 13 (14 days). Booked with West Marine?
Action: Confirm Scheduled | Reschedule | View Details
```

#### 7-Day Reminder (Urgent)
```
Title: URGENT - Maintenance Due
Body: Oil change is due in 7 days. Schedule immediately.
Action: Book Now | Contact Provider | View Details
```

#### Overdue
```
Title: OVERDUE MAINTENANCE
Body: Oil change is overdue as of May 13. Service immediately.
Action: Mark Complete | Acknowledge | View Details
```

### 6.3 Email Notification Template

```
Subject: Maintenance Reminder: {ServiceType} Due {DaysRemaining} Days

---

Hi {OwnerName},

This is a reminder that maintenance is coming up for {BoatName}:

SERVICE TYPE: {ServiceType}
DUE DATE: {DueDate} ({DaysRemaining} days from now)
NEXT DUE ENGINE HOURS: {EngineHours}
RECOMMENDED PROVIDER: {ProviderName}
ESTIMATED COST: ${EstimatedCost}

LAST SERVICE:
- Date: {LastServiceDate}
- Provider: {LastProviderName}
- Cost: ${LastCost}

PROVIDER CONTACT:
- Name: {ProviderName}
- Phone: {ProviderPhone}
- Email: {ProviderEmail}
- Address: {ProviderAddress}

ACTION REQUIRED:
1. Review maintenance details
2. Contact provider to schedule service
3. Confirm appointment in maintenance log

Questions? Reply to this email or visit the Maintenance Log in your NaviDocs app.

---
Sent by NaviDocs Maintenance Tracking System
```

### 6.4 SMS Notification Template

```
NaviDocs: {ServiceType} maintenance due {DaysRemaining} days ({DueDate}).
Provider: {ProviderName} {ProviderPhone}.
Confirm: [link-to-app]
```

### 6.5 In-App Notification Design

#### Approaching (60+ days)
```
┌─────────────────────────────────┐
│ 📋 Maintenance Approaching      │
├─────────────────────────────────┤
│ Oil Change                      │
│ Due: May 13, 2025 (60 days)    │
│                                 │
│ [View Details] [Dismiss]       │
└─────────────────────────────────┘
```

#### Urgent (7-14 days)
```
┌─────────────────────────────────┐
│ ⚠️  URGENT - Schedule Now       │
├─────────────────────────────────┤
│ Engine Service                  │
│ Due: May 13, 2025 (7 days)     │
│ Current Hours: 2480/2550        │
│                                 │
│ West Marine: (555) 0100        │
│ Est. Cost: $450                │
│                                 │
│ [Book Now] [Snooze] [Dismiss]  │
└─────────────────────────────────┘
```

#### Overdue (0 days or less)
```
┌─────────────────────────────────┐
│ 🚨 OVERDUE - Action Required   │
├─────────────────────────────────┤
│ Hull Inspection                 │
│ DUE: April 15, 2024 (213 DAYS)  │
│ Status: OVERDUE                 │
│                                 │
│ [Mark Complete] [Schedule Now]  │
│ [View History] [Dismiss]        │
└─────────────────────────────────┘
```

### 6.6 Notification Preferences API

```
GET /api/v1/users/{userId}/notification-preferences/maintenance

Response:
{
  "email_enabled": true,
  "sms_enabled": true,
  "push_enabled": true,
  "in_app_enabled": true,
  "alert_thresholds": {
    "60_days": { "enabled": true, "channels": ["in_app", "email"] },
    "30_days": { "enabled": true, "channels": ["in_app", "email"] },
    "14_days": { "enabled": true, "channels": ["push", "email"] },
    "7_days": { "enabled": true, "channels": ["push", "email", "sms"] },
    "overdue": { "enabled": true, "channels": ["push", "email", "sms"] }
  },
  "quiet_hours": {
    "enabled": true,
    "start": "22:00",
    "end": "07:00"
  }
}

PATCH /api/v1/users/{userId}/notification-preferences/maintenance
Content-Type: application/json

Request Body:
{
  "alert_thresholds": {
    "14_days": { "enabled": false }
  }
}
```

---

## 7. Implementation Notes

### 7.1 Engine Hours Tracking
- Engine hours must be manually entered at each service
- System stores cumulative engine hours (not hours since last service)
- Engine hours validation: must be >= previous record
- Estimated usage: 25 hours/day (customizable per boat)

### 7.2 Service Interval Customization
- Standard intervals defined in `maintenance_service_intervals` table
- Boat-specific intervals can be defined in `boat_maintenance_config` table
- Owners can override standard intervals based on usage patterns

### 7.3 Reminder Audit Trail
- All reminder actions logged for compliance
- Snoozed reminders re-queue automatically
- Dismissed reminders can be restored within 30 days
- Email/SMS delivery tracked via `notification_log` table

### 7.4 Data Retention
- Deleted maintenance records soft-deleted (retained for audit)
- Hard delete only after 7 years for compliance
- Expense reports include deleted records for historical accuracy

---

## 8. Security Considerations

- All maintenance records require boat ownership verification
- Receipt URLs stored with encryption at rest
- Provider contact data access controlled per user role
- Sensitive cost data masked for multi-user accounts
- All API endpoints require authentication and rate limiting

---

## 9. Success Metrics

- Reminder delivery rate: >95% within 24 hours of trigger
- API response time: <200ms for maintenance list queries
- Expense calculation accuracy: 100% (automated validation)
- User reminder completion: >75% services completed within 7 days of due date
- Provider contact accuracy: 98% phone/email validation rate
