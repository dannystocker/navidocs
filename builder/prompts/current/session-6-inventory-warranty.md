# Cloud Session Prompt: Inventory & Warranty Tracking

**Feature:** Equipment Inventory Management with Warranty Expiration Tracking
**Duration:** 90-120 minutes
**Priority:** P0 (Demo requirement)
**Branch:** `feature/inventory-warranty`

---

## Your Mission

Build a complete equipment inventory and warranty tracking system for NaviDocs. Boat owners need to track onboard equipment (engines, electronics, safety gear) with warranty dates, service history, and document attachments.

**What you're building:**
- Equipment inventory list with warranty status indicators
- Warranty expiration alerts
- Document attachments per equipment item
- Service history tracking
- Dashboard alerts for expiring warranties

---

## Quick Start

```bash
cd /home/setup/navidocs
git checkout navidocs-cloud-coordination
git pull origin navidocs-cloud-coordination
git checkout -b feature/inventory-warranty
```

---

## Step 1: Read the Spec (5 min)

**Read this file:** `/home/setup/navidocs/FEATURE_SPEC_INVENTORY_WARRANTY.md`

This spec contains:
- Complete database schema (3 tables)
- All 8 API endpoints with request/response examples
- Frontend component designs
- Warranty status calculation logic
- Demo data (10 sample equipment items)

---

## Step 2: Database Migration (15 min)

**Create:** `server/migrations/011_equipment_inventory.sql`

**Tables to create:**
1. `equipment_inventory` - Main equipment table
2. `equipment_documents` - Links equipment to documents
3. `equipment_service_history` - Service records per equipment

**Copy schema from:** FEATURE_SPEC_INVENTORY_WARRANTY.md (lines 50-120)

**Run migration:**
```bash
cd server
node run-migration.js 011_equipment_inventory.sql
```

**Verify:**
```bash
sqlite3 db/navidocs.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'equipment%';"
```

---

## Step 3: Backend Service (25 min)

**Create:** `server/services/equipment-service.js`

**Functions to implement:**
```javascript
// CRUD
async function createEquipment(orgId, equipmentData)
async function getEquipmentList(orgId, filters)
async function getEquipmentById(equipmentId)
async function updateEquipment(equipmentId, updates)
async function deleteEquipment(equipmentId)

// Service history
async function addServiceRecord(equipmentId, serviceData)
async function getServiceHistory(equipmentId)

// Documents
async function attachDocument(equipmentId, documentId, relationshipType)
async function getEquipmentDocuments(equipmentId)

// Warranty logic
function calculateWarrantyStatus(warranty_end_date) {
  if (!warranty_end_date) return 'none';
  const now = Date.now();
  const daysUntilExpiry = Math.floor((warranty_end_date - now) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring_soon';
  return 'active';
}

// Alerts
async function getWarrantyAlerts(orgId) {
  // Get equipment with warranty_end_date < now + 30 days
}
```

**Database connection:** Use existing `db/database.js` pattern

**Example from codebase:**
```javascript
const db = require('../db/database');

async function createEquipment(orgId, data) {
  const id = `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  await db.run(`
    INSERT INTO equipment_inventory (
      id, organization_id, name, category, manufacturer,
      model_number, serial_number, purchase_date, purchase_price,
      warranty_start_date, warranty_end_date, warranty_provider,
      location_on_boat, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, orgId, data.name, data.category, data.manufacturer, ...]);

  return await getEquipmentById(id);
}
```

---

## Step 4: Backend Routes (20 min)

**Create:** `server/routes/equipment.js`

**Routes to implement:**
```javascript
const express = require('express');
const router = express.Router({ mergeParams: true });
const equipmentService = require('../services/equipment-service');
const authMiddleware = require('../middleware/auth');

// Apply auth to all routes
router.use(authMiddleware);

// List equipment
router.get('/', async (req, res) => {
  const { orgId } = req.params;
  const { category, warranty_status, search } = req.query;
  // Validate orgId matches req.user.organization_id
  // Call equipmentService.getEquipmentList()
});

// Create equipment
router.post('/', async (req, res) => {
  const { orgId } = req.params;
  // Validate and create
});

// Get equipment details
router.get('/:equipmentId', async (req, res) => {
  // Get equipment + documents + service history
});

// Update equipment
router.put('/:equipmentId', async (req, res) => {
  // Update
});

// Delete equipment
router.delete('/:equipmentId', async (req, res) => {
  // Delete
});

// Add service record
router.post('/:equipmentId/service', async (req, res) => {
  // Add service record
});

// Attach document
router.post('/:equipmentId/documents', async (req, res) => {
  // Link equipment to document
});

// Get warranty alerts
router.get('/../warranty-alerts', async (req, res) => {
  // Get expiring warranties
});

module.exports = router;
```

**Register route in `server/index.js`:**
```javascript
app.use('/api/organizations/:orgId/equipment', require('./routes/equipment'));
```

---

## Step 5: Frontend - Inventory View (30 min)

**Create:** `client/src/views/Inventory.vue`

**Features:**
- Table showing all equipment
- Sortable columns
- Filter by category (dropdown)
- Filter by warranty status
- Search bar
- Visual warranty indicators (🟢 🟡 🔴 ⚪)
- "Add Equipment" button

**Template structure:**
```vue
<template>
  <div class="inventory-view">
    <div class="header">
      <h1>Equipment Inventory</h1>
      <button @click="showAddModal = true">+ Add Equipment</button>
    </div>

    <div class="filters">
      <select v-model="filters.category">
        <option value="">All Categories</option>
        <option>Engine & Propulsion</option>
        <option>Electronics & Navigation</option>
        <!-- ... -->
      </select>

      <select v-model="filters.warranty_status">
        <option value="">All Warranties</option>
        <option value="active">Active</option>
        <option value="expiring_soon">Expiring Soon</option>
        <option value="expired">Expired</option>
      </select>

      <input v-model="filters.search" placeholder="Search equipment...">
    </div>

    <table class="equipment-table">
      <thead>
        <tr>
          <th @click="sortBy('name')">Equipment Name</th>
          <th @click="sortBy('category')">Category</th>
          <th>Manufacturer/Model</th>
          <th>Warranty Status</th>
          <th>Days Until Expiry</th>
          <th>Documents</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredEquipment" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ item.category }}</td>
          <td>{{ item.manufacturer }} {{ item.model_number }}</td>
          <td>
            <span :class="warrantyClass(item.warranty_status)">
              {{ warrantyLabel(item.warranty_status) }}
            </span>
          </td>
          <td>{{ item.days_until_expiry || '-' }}</td>
          <td>{{ item.attached_documents }}</td>
          <td>
            <button @click="viewDetails(item)">View</button>
            <button @click="editEquipment(item)">Edit</button>
            <button @click="deleteEquipment(item)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <AddEquipmentModal v-if="showAddModal" @close="showAddModal = false" @saved="loadEquipment" />
    <EquipmentDetailModal v-if="selectedEquipment" :equipment="selectedEquipment" @close="selectedEquipment = null" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      equipment: [],
      filters: {
        category: '',
        warranty_status: '',
        search: ''
      },
      showAddModal: false,
      selectedEquipment: null
    };
  },
  computed: {
    filteredEquipment() {
      return this.equipment.filter(item => {
        if (this.filters.category && item.category !== this.filters.category) return false;
        if (this.filters.warranty_status && item.warranty_status !== this.filters.warranty_status) return false;
        if (this.filters.search) {
          const search = this.filters.search.toLowerCase();
          return item.name.toLowerCase().includes(search) ||
                 item.manufacturer?.toLowerCase().includes(search) ||
                 item.model_number?.toLowerCase().includes(search);
        }
        return true;
      });
    }
  },
  async mounted() {
    await this.loadEquipment();
  },
  methods: {
    async loadEquipment() {
      const response = await fetch(`/api/organizations/${this.orgId}/equipment`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await response.json();
      this.equipment = data.equipment;
    },
    warrantyClass(status) {
      return {
        'active': 'warranty-active',
        'expiring_soon': 'warranty-expiring',
        'expired': 'warranty-expired',
        'none': 'warranty-none'
      }[status];
    },
    // ... other methods
  }
};
</script>

<style scoped>
.warranty-active { color: green; }
.warranty-expiring { color: orange; }
.warranty-expired { color: red; }
.warranty-none { color: gray; }
</style>
```

---

## Step 6: Add Equipment Modal (20 min)

**Create:** `client/src/components/AddEquipmentModal.vue`

**Form fields:**
- Equipment Name* (required)
- Category* (dropdown - see categories in spec)
- Manufacturer
- Model Number
- Serial Number
- Purchase Date (date picker)
- Purchase Price
- Warranty Start Date
- Warranty End Date
- Warranty Provider
- Location on Boat
- Notes

**Submit handler:**
```javascript
async submitForm() {
  const response = await fetch(`/api/organizations/${this.orgId}/equipment`, {
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

## Step 7: Navigation & Router (10 min)

**Update:** `client/src/router.js`

```javascript
{
  path: '/inventory',
  component: () => import('./views/Inventory.vue'),
  meta: { requiresAuth: true }
}
```

**Update:** Main navigation component

Add "Inventory" link between "Timeline" and "Settings"

---

## Step 8: Demo Data (10 min)

**Create:** `server/seed-inventory-demo-data.js`

```javascript
const equipmentService = require('./services/equipment-service');

const demoEquipment = [
  {
    name: 'Main Engine - Yanmar 4JH5E',
    category: 'Engine & Propulsion',
    manufacturer: 'Yanmar',
    model_number: '4JH5E',
    serial_number: '12345',
    warranty_end_date: Date.now() + (45 * 24 * 60 * 60 * 1000), // 45 days
    location_on_boat: 'Engine room - starboard'
  },
  {
    name: 'GPS Navigator - Garmin GPSMAP 1242xsv',
    category: 'Electronics & Navigation',
    manufacturer: 'Garmin',
    model_number: 'GPSMAP 1242xsv',
    warranty_end_date: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
    location_on_boat: 'Helm'
  },
  {
    name: 'Autopilot - Raymarine EV-100',
    category: 'Electronics & Navigation',
    manufacturer: 'Raymarine',
    model_number: 'EV-100',
    warranty_end_date: Date.now() + (5 * 24 * 60 * 60 * 1000), // 5 days (URGENT!)
    location_on_boat: 'Helm'
  },
  // Add 7 more from spec...
];

async function seedDemoData(orgId) {
  for (const equipment of demoEquipment) {
    await equipmentService.createEquipment(orgId, equipment);
  }
  console.log('✅ Demo inventory data seeded');
}

module.exports = { seedDemoData };
```

**Run:**
```bash
node server/seed-inventory-demo-data.js
```

---

## Step 9: Testing (15 min)

**Test checklist:**
- [ ] Can add new equipment via modal
- [ ] Equipment appears in inventory list
- [ ] Can filter by category
- [ ] Can filter by warranty status
- [ ] Can search equipment
- [ ] Warranty colors display correctly (green, yellow, red, gray)
- [ ] Can view equipment details
- [ ] Can edit equipment
- [ ] Can delete equipment
- [ ] Activity timeline shows equipment events

---

## Step 10: Completion (5 min)

```bash
git add .
git commit -m "[SESSION-6] Add inventory & warranty tracking

Features:
- Equipment inventory management
- Warranty expiration tracking with visual alerts
- Service history per equipment
- Document attachments to equipment
- Dashboard alerts for expiring warranties
- 10 demo equipment items

Database: 3 new tables (equipment_inventory, equipment_documents, equipment_service_history)
API: 8 new endpoints
Frontend: Inventory view + 2 modals"

git push origin feature/inventory-warranty
```

**Create:** `SESSION-6-COMPLETE.md` documenting what you built

---

## Success Criteria

✅ Database migration creates 3 tables
✅ All 8 API endpoints working
✅ Can add/edit/delete equipment
✅ Inventory list shows warranty status with colors
✅ Can filter by category and warranty status
✅ Can search equipment
✅ Demo data loads successfully (10 items)
✅ Feature branch pushed to GitHub

---

## Questions? Blockers?

- Spec is in: `/home/setup/navidocs/FEATURE_SPEC_INVENTORY_WARRANTY.md`
- API examples: Check existing `server/routes/timeline.js` for patterns
- Vue components: Check `client/src/views/Timeline.vue` for structure
- Database: Use `server/db/database.js` (same as other features)

**Go build! 🚀**
