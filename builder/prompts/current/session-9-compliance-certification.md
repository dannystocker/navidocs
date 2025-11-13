# Cloud Session Prompt: Compliance & Certification Tracker

**Feature:** Regulatory Compliance and Certification Management with Expiration Alerts
**Duration:** 75-90 minutes
**Priority:** P1 (Core Feature)
**Branch:** `feature/compliance-certification`

---

## Your Mission

Build a compliance tracking system for managing regulatory requirements, safety inspections, licenses, registrations, and certifications. Marine vessels require numerous time-sensitive certifications to remain legal and insured.

**What you're building:**
- Compliance item tracking with expiration dates
- Automated renewal alerts
- Compliance dashboard with status overview
- Document attachment for certificates
- Renewal history tracking
- Visual status indicators (valid, expiring soon, expired)
- Critical alerts for mandatory expired items

---

## Quick Start

```bash
cd /home/setup/navidocs
git checkout navidocs-cloud-coordination
git pull origin navidocs-cloud-coordination
git checkout -b feature/compliance-certification
```

---

## Step 1: Read the Spec (5 min)

**Read this file:** `/home/setup/navidocs/FEATURE_SPEC_COMPLIANCE_CERTIFICATION.md`

This spec contains:
- Complete database schema (3 tables)
- All 8 API endpoints with request/response examples
- Frontend component designs
- Status calculation logic
- Compliance categories
- Demo data (12-15 compliance items)

---

## Step 2: Database Migration (12 min)

**Create:** `server/migrations/014_compliance_certification.sql`

**Tables to create:**
1. `compliance_items` - Certifications, licenses, inspections
2. `compliance_renewals` - Renewal history per item
3. `compliance_documents` - Linked certificates and receipts

**Copy schema from:** FEATURE_SPEC_COMPLIANCE_CERTIFICATION.md (lines 31-80)

**Run migration:**
```bash
cd server
node run-migration.js 014_compliance_certification.sql
```

**Verify:**
```bash
sqlite3 db/navidocs.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'compliance%';"
```

---

## Step 3: Backend Service (25 min)

**Create:** `server/services/compliance-service.js`

**Key functions:**

```javascript
// Compliance item CRUD
async function createComplianceItem(orgId, itemData)
async function getComplianceList(orgId, filters)
async function getComplianceById(itemId)
async function updateComplianceItem(itemId, updates)
async function deleteComplianceItem(itemId)

// Renewal workflow
async function renewComplianceItem(itemId, renewalData) {
  // 1. Create renewal record
  // 2. Update compliance_item.expiration_date = new_expiration_date
  // 3. Update compliance_item.status = 'valid'
  // 4. Update compliance_item.certificate_number (if changed)
  // 5. Link document if provided
  // 6. Log to activity timeline
}

// Status calculation
function calculateComplianceStatus(item) {
  const now = Date.now();
  const expirationDate = item.expiration_date;

  if (!expirationDate) return 'pending_renewal';

  const daysUntilExpiry = Math.floor((expirationDate - now) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= item.alert_days_before) return 'expiring_soon';
  return 'valid';
}

// Alert level calculation
function getAlertLevel(item) {
  const daysUntilExpiry = Math.floor((item.expiration_date - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0 && item.is_mandatory) return 'critical';
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 7) return 'urgent';
  if (daysUntilExpiry <= 30) return 'warning';
  return 'info';
}

// Alerts
async function getComplianceAlerts(orgId) {
  // Get items where status = 'expired' OR 'expiring_soon'
  // Prioritize: mandatory expired > expired > expiring soon
}

// Dashboard
async function getComplianceDashboard(orgId) {
  // Return stats: total, valid, expiring_soon, expired, mandatory_expired
  // Urgent items list
  // Upcoming renewals (next 90 days)
  // Total renewal cost (next 90 days)
}

// Documents
async function attachDocument(itemId, documentId, documentType)
```

---

## Step 4: Backend Routes (18 min)

**Create:** `server/routes/compliance.js`

```javascript
const express = require('express');
const router = express.Router({ mergeParams: true });
const complianceService = require('../services/compliance-service');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/organizations/:orgId/compliance
router.get('/', async (req, res) => {
  const { orgId } = req.params;
  const { type, status, mandatory_only } = req.query;
  // Call complianceService.getComplianceList()
});

// POST /api/organizations/:orgId/compliance
router.post('/', async (req, res) => {
  // Create compliance item
});

// GET /api/organizations/:orgId/compliance/:itemId
router.get('/:itemId', async (req, res) => {
  // Get item details + renewal history + documents
});

// PUT /api/organizations/:orgId/compliance/:itemId
router.put('/:itemId', async (req, res) => {
  // Update item
});

// DELETE /api/organizations/:orgId/compliance/:itemId
router.delete('/:itemId', async (req, res) => {
  // Delete item
});

// POST /api/organizations/:orgId/compliance/:itemId/renew
router.post('/:itemId/renew', async (req, res) => {
  // Renew compliance item
  // Update expiration date, create renewal record
});

// GET /api/organizations/:orgId/compliance/alerts
router.get('/alerts', async (req, res) => {
  // Get expired/expiring items
});

// GET /api/organizations/:orgId/compliance/dashboard
router.get('/dashboard', async (req, res) => {
  // Get dashboard statistics
});

module.exports = router;
```

**Register route in `server/index.js`:**
```javascript
app.use('/api/organizations/:orgId/compliance', require('./routes/compliance'));
```

---

## Step 5: Frontend - Compliance Dashboard (30 min)

**Create:** `client/src/views/Compliance.vue`

**Features:**
- Status overview cards (Valid, Expiring Soon, Expired)
- Alert banner for critical items
- Filterable table
- "Add Compliance Item" button
- Quick actions (Renew, View, Edit)

**Template structure:**

```vue
<template>
  <div class="compliance-view">
    <!-- Alert Banner -->
    <div v-if="criticalAlerts.length > 0" class="alert-banner critical">
      <strong>🚨 URGENT: {{ mandatoryExpiredCount }} mandatory certification expired</strong>
      <strong v-if="expiringCount > 0"> | ⚠️ {{ expiringCount }} items expiring within 30 days</strong>
      <div v-for="alert in criticalAlerts.slice(0, 3)" :key="alert.item_id">
        └─ {{ alert.item_name }}: {{ alert.days_until_expiry < 0 ? `EXPIRED ${Math.abs(alert.days_until_expiry)} days ago` : `Expires in ${alert.days_until_expiry} days` }}
      </div>
      <button @click="viewAlerts">View All Compliance</button>
    </div>

    <div class="header">
      <h1>Compliance & Certifications</h1>
      <button @click="showAddModal = true">+ Add Compliance Item</button>
    </div>

    <!-- Status Overview Cards -->
    <div class="status-cards">
      <div class="card valid">
        <div class="count">{{ stats.valid }}</div>
        <div class="label">✅ Valid</div>
        <div class="sublabel">All up to date</div>
      </div>

      <div class="card expiring">
        <div class="count">{{ stats.expiring_soon }}</div>
        <div class="label">⚠️ Expiring Soon</div>
        <div class="sublabel">Within 30 days</div>
      </div>

      <div class="card expired">
        <div class="count">{{ stats.expired }}</div>
        <div class="label">❌ Expired</div>
        <div class="sublabel">Renew now</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="filters.type">
        <option value="">All Types</option>
        <option value="vessel_registration">Vessel Registration</option>
        <option value="safety_inspection">Safety Inspection</option>
        <option value="crew_certification">Crew Certification</option>
        <option value="insurance">Insurance</option>
        <!-- ... more types -->
      </select>

      <select v-model="filters.status">
        <option value="">All Status</option>
        <option value="valid">Valid</option>
        <option value="expiring_soon">Expiring Soon</option>
        <option value="expired">Expired</option>
      </select>

      <label>
        <input type="checkbox" v-model="filters.mandatory_only">
        Mandatory Only
      </label>
    </div>

    <!-- Compliance Table -->
    <table class="compliance-table">
      <thead>
        <tr>
          <th>Item Name</th>
          <th>Category</th>
          <th>Issuing Authority</th>
          <th>Certificate #</th>
          <th>Expiration Date</th>
          <th>Days Until Expiry</th>
          <th>Status</th>
          <th>Cost</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredItems" :key="item.id" :class="statusRowClass(item.status, item.is_mandatory)">
          <td>
            {{ item.item_name }}
            <span v-if="item.is_mandatory" class="mandatory-badge">MANDATORY</span>
          </td>
          <td>{{ item.item_type }}</td>
          <td>{{ item.issuing_authority }}</td>
          <td>{{ item.certificate_number || '-' }}</td>
          <td>{{ formatDate(item.expiration_date) }}</td>
          <td :class="daysClass(item.days_until_expiry)">
            {{ item.days_until_expiry > 0 ? item.days_until_expiry : `${Math.abs(item.days_until_expiry)} ago` }}
          </td>
          <td>
            <span :class="statusBadge(item.status)">
              {{ item.status.toUpperCase() }}
            </span>
          </td>
          <td>{{ item.cost ? `$${item.cost.toFixed(2)}` : '-' }}</td>
          <td>
            <button @click="renewItem(item)" class="btn-renew">Renew</button>
            <button @click="viewItem(item)">View</button>
            <button @click="editItem(item)">Edit</button>
          </td>
        </tr>
      </tbody>
    </table>

    <AddComplianceItemModal v-if="showAddModal" @close="showAddModal = false" @saved="loadCompliance" />
    <RenewComplianceModal v-if="renewingItem" :item="renewingItem" @close="renewingItem = null" @renewed="loadCompliance" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [],
      stats: {},
      alerts: [],
      filters: {
        type: '',
        status: '',
        mandatory_only: false
      },
      showAddModal: false,
      renewingItem: null
    };
  },
  computed: {
    filteredItems() {
      return this.items.filter(item => {
        if (this.filters.type && item.item_type !== this.filters.type) return false;
        if (this.filters.status && item.status !== this.filters.status) return false;
        if (this.filters.mandatory_only && !item.is_mandatory) return false;
        return true;
      });
    },
    criticalAlerts() {
      return this.alerts.filter(a => a.alert_level === 'critical' || a.alert_level === 'urgent');
    },
    mandatoryExpiredCount() {
      return this.alerts.filter(a => a.alert_level === 'critical').length;
    },
    expiringCount() {
      return this.alerts.filter(a => a.days_until_expiry >= 0 && a.days_until_expiry <= 30).length;
    }
  },
  async mounted() {
    await this.loadCompliance();
    await this.loadAlerts();
  },
  methods: {
    async loadCompliance() {
      const response = await fetch(`/api/organizations/${this.orgId}/compliance`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await response.json();
      this.items = data.items;
      this.stats = data.stats;
    },
    async loadAlerts() {
      const response = await fetch(`/api/organizations/${this.orgId}/compliance/alerts`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await response.json();
      this.alerts = data.alerts;
    },
    statusRowClass(status, isMandatory) {
      if (status === 'expired' && isMandatory) return 'row-critical';
      if (status === 'expired') return 'row-expired';
      if (status === 'expiring_soon') return 'row-expiring';
      return '';
    },
    daysClass(days) {
      if (days < 0) return 'days-expired';
      if (days <= 7) return 'days-urgent';
      if (days <= 30) return 'days-warning';
      return '';
    },
    statusBadge(status) {
      return `badge badge-${status}`;
    },
    // ... other methods
  }
};
</script>

<style scoped>
.status-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin: 2rem 0;
}

.card {
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
}

.card.valid { background: #e8f5e9; }
.card.expiring { background: #fff3cd; }
.card.expired { background: #ffe0e0; }

.row-critical { background-color: #ffebee; font-weight: bold; }
.row-expired { background-color: #ffe0e0; }
.row-expiring { background-color: #fff3cd; }

.days-expired { color: red; font-weight: bold; }
.days-urgent { color: orange; font-weight: bold; }
.days-warning { color: #ff9800; }

.mandatory-badge {
  background: red;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-left: 8px;
}
</style>
```

---

## Step 6: Add Compliance Item Modal (15 min)

**Create:** `client/src/components/AddComplianceItemModal.vue`

**Form fields:**
- Item Type* (dropdown)
- Item Name*
- Description
- Issuing Authority
- Certificate Number
- Issue Date
- Expiration Date*
- Renewal Frequency (days)
- Is Mandatory (checkbox - default: true)
- Alert Days Before (default: 30)
- Cost
- Renewal Process (textarea)
- Contact for Renewal
- Notes

---

## Step 7: Renew Compliance Modal (12 min)

**Create:** `client/src/components/RenewComplianceModal.vue`

**Form fields:**
- Renewal Date* (default: today)
- New Expiration Date*
- New Certificate Number
- Cost
- Upload Certificate Document
- Notes

**Auto-fill logic:**
```javascript
mounted() {
  // If item has renewal_frequency_days, auto-calculate new expiration
  if (this.item.renewal_frequency_days) {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + this.item.renewal_frequency_days);
    this.formData.new_expiration_date = newExpiry.getTime();
  }

  // Pre-fill cost from previous renewal
  this.formData.cost = this.item.cost;
}
```

---

## Step 8: Alert Banner Component (10 min)

**Create:** `client/src/components/ComplianceAlertBanner.vue`

Add to HomeView.vue dashboard

---

## Step 9: Navigation & Router (8 min)

**Update:** `client/src/router.js`

```javascript
{
  path: '/compliance',
  component: () => import('./views/Compliance.vue'),
  meta: { requiresAuth: true }
}
```

**Update navigation:** Add "Compliance" link

---

## Step 10: Demo Data (10 min)

**Create:** `server/seed-compliance-demo-data.js`

**Sample items:**
- 2 expired (1 mandatory: Vessel Registration)
- 3 expiring within 30 days (Hull Insurance: 5 days)
- 7 valid items
- Mix of categories

**Run:**
```bash
node server/seed-compliance-demo-data.js
```

---

## Step 11: Testing (12 min)

**Test checklist:**
- [ ] Can add compliance items
- [ ] Can renew items
- [ ] Status calculated correctly
- [ ] Alert banner shows critical items
- [ ] Dashboard cards show correct counts
- [ ] Can filter by type and status
- [ ] Mandatory badge displays
- [ ] Renewal history tracked

---

## Step 12: Completion (5 min)

```bash
git add .
git commit -m "[SESSION-9] Add compliance & certification tracker

Features:
- Compliance item tracking with expiration dates
- Automated renewal alerts
- Compliance dashboard with status overview
- Document attachment for certificates
- Renewal history tracking
- Visual status indicators (valid, expiring soon, expired)
- Critical alerts for mandatory expired items

Database: 3 new tables
API: 8 new endpoints
Frontend: Compliance view + 2 modals + alert banner"

git push origin feature/compliance-certification
```

**Create:** `SESSION-9-COMPLETE.md`

---

## Success Criteria

✅ Database migration creates 3 tables
✅ All 8 API endpoints working
✅ Can add compliance items
✅ Can renew items (updates expiration, creates renewal record)
✅ Status calculated correctly
✅ Alert banner shows urgent items
✅ Dashboard shows overview statistics
✅ Can filter by type and status
✅ Documents can be attached
✅ Demo data loads successfully

---

**Go build! 🚀**
