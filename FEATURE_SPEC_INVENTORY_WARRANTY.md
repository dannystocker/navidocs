# Feature Spec: Inventory & Warranty Tracking

**Created:** 2025-11-13 15:55 UTC
**Priority:** P0 (Demo requirement)
**Estimated Time:** 90-120 minutes
**Assignee:** Cloud Session (TBD)

---

## Executive Summary

Add equipment inventory management and warranty expiration tracking to NaviDocs for the marine demo. Boat owners need to track onboard equipment (engines, electronics, safety gear) with warranty dates and service history.

**Value Proposition:**
- Track all boat equipment in one place
- Never miss warranty expirations
- Attach manuals/documents to specific equipment
- View service history per item
- Alert when warranties expiring soon

---

## User Story

**As a** boat owner
**I want to** track my onboard equipment and warranty dates
**So that** I can maintain equipment properly and avoid expensive out-of-warranty repairs

**Acceptance Criteria:**
1. ✅ Add new equipment items with warranty dates
2. ✅ View all equipment in inventory list
3. ✅ See warranty status (active, expiring soon, expired)
4. ✅ Attach documents to specific equipment items
5. ✅ Track service history per item
6. ✅ Filter/search equipment by category or status
7. ✅ Get visual alerts for expiring warranties (< 30 days)

---

## Database Schema

### Table: `equipment_inventory`

```sql
CREATE TABLE equipment_inventory (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  manufacturer TEXT,
  model_number TEXT,
  serial_number TEXT,
  purchase_date INTEGER,
  purchase_price REAL,
  warranty_start_date INTEGER,
  warranty_end_date INTEGER,
  warranty_provider TEXT,
  installation_date INTEGER,
  location_on_boat TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_equipment_org ON equipment_inventory(organization_id);
CREATE INDEX idx_equipment_warranty_end ON equipment_inventory(warranty_end_date);
CREATE INDEX idx_equipment_category ON equipment_inventory(category);
```

### Table: `equipment_documents`

```sql
CREATE TABLE equipment_documents (
  id TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL, -- 'manual', 'warranty_card', 'invoice', 'service_record'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (equipment_id) REFERENCES equipment_inventory(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_equipment_docs_equipment ON equipment_documents(equipment_id);
CREATE INDEX idx_equipment_docs_document ON equipment_documents(document_id);
```

### Table: `equipment_service_history`

```sql
CREATE TABLE equipment_service_history (
  id TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL,
  service_date INTEGER NOT NULL,
  service_type TEXT NOT NULL, -- 'maintenance', 'repair', 'inspection', 'upgrade'
  description TEXT NOT NULL,
  cost REAL,
  service_provider TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (equipment_id) REFERENCES equipment_inventory(id) ON DELETE CASCADE
);

CREATE INDEX idx_service_history_equipment ON equipment_service_history(equipment_id);
CREATE INDEX idx_service_history_date ON equipment_service_history(service_date);
```

---

## Equipment Categories

**Predefined Categories:**
- Engine & Propulsion
- Electronics & Navigation
- Electrical Systems
- Plumbing & Water Systems
- HVAC & Heating
- Safety Equipment
- Deck & Hull Hardware
- Galley & Appliances
- Entertainment Systems
- Communication Equipment
- Other

---

## API Endpoints

### 1. List Equipment

**GET** `/api/organizations/:orgId/equipment`

**Query Params:**
- `category` (optional) - Filter by category
- `warranty_status` (optional) - 'active', 'expiring_soon', 'expired', 'none'
- `search` (optional) - Search by name, manufacturer, model

**Response:**
```json
{
  "equipment": [
    {
      "id": "eq_123",
      "name": "Main Engine - Yanmar 4JH5E",
      "category": "Engine & Propulsion",
      "manufacturer": "Yanmar",
      "model_number": "4JH5E",
      "serial_number": "12345",
      "warranty_status": "active", // or "expiring_soon", "expired", "none"
      "warranty_end_date": 1735689600000,
      "days_until_expiry": 45,
      "attached_documents": 3,
      "service_records": 5,
      "location_on_boat": "Engine room - starboard",
      "created_at": 1699920000000
    }
  ],
  "stats": {
    "total": 23,
    "warranties_active": 12,
    "warranties_expiring_soon": 3,
    "warranties_expired": 5,
    "no_warranty": 3
  }
}
```

### 2. Create Equipment

**POST** `/api/organizations/:orgId/equipment`

**Body:**
```json
{
  "name": "Main Engine - Yanmar 4JH5E",
  "category": "Engine & Propulsion",
  "manufacturer": "Yanmar",
  "model_number": "4JH5E",
  "serial_number": "12345",
  "purchase_date": 1699920000000,
  "purchase_price": 8500.00,
  "warranty_start_date": 1699920000000,
  "warranty_end_date": 1735689600000,
  "warranty_provider": "Yanmar Marine",
  "location_on_boat": "Engine room - starboard"
}
```

### 3. Get Equipment Details

**GET** `/api/organizations/:orgId/equipment/:equipmentId`

**Response:**
```json
{
  "equipment": {
    "id": "eq_123",
    "name": "Main Engine - Yanmar 4JH5E",
    "category": "Engine & Propulsion",
    "manufacturer": "Yanmar",
    "model_number": "4JH5E",
    "serial_number": "12345",
    "purchase_date": 1699920000000,
    "purchase_price": 8500.00,
    "warranty_start_date": 1699920000000,
    "warranty_end_date": 1735689600000,
    "warranty_provider": "Yanmar Marine",
    "location_on_boat": "Engine room - starboard",
    "notes": "Installed by ABC Marine Services",
    "created_at": 1699920000000,
    "updated_at": 1699920000000
  },
  "documents": [
    {
      "id": "doc_456",
      "title": "Yanmar 4JH5E Owner's Manual",
      "relationship_type": "manual",
      "attached_at": 1699920000000
    }
  ],
  "service_history": [
    {
      "id": "srv_789",
      "service_date": 1699920000000,
      "service_type": "maintenance",
      "description": "Oil change and filter replacement",
      "cost": 250.00,
      "service_provider": "ABC Marine Services"
    }
  ]
}
```

### 4. Update Equipment

**PUT** `/api/organizations/:orgId/equipment/:equipmentId`

### 5. Delete Equipment

**DELETE** `/api/organizations/:orgId/equipment/:equipmentId`

### 6. Add Service Record

**POST** `/api/organizations/:orgId/equipment/:equipmentId/service`

**Body:**
```json
{
  "service_date": 1699920000000,
  "service_type": "maintenance",
  "description": "Oil change and filter replacement",
  "cost": 250.00,
  "service_provider": "ABC Marine Services",
  "notes": "Used Yanmar genuine parts"
}
```

### 7. Attach Document to Equipment

**POST** `/api/organizations/:orgId/equipment/:equipmentId/documents`

**Body:**
```json
{
  "document_id": "doc_456",
  "relationship_type": "manual"
}
```

### 8. Get Warranty Alerts

**GET** `/api/organizations/:orgId/equipment/warranty-alerts`

**Response:**
```json
{
  "alerts": [
    {
      "equipment_id": "eq_123",
      "name": "Main Engine - Yanmar 4JH5E",
      "warranty_end_date": 1735689600000,
      "days_until_expiry": 15,
      "alert_level": "urgent" // or "warning", "info"
    }
  ]
}
```

---

## Frontend Components

### 1. Equipment List View (`client/src/views/Inventory.vue`)

**Features:**
- Table view with sortable columns
- Filter by category dropdown
- Filter by warranty status (active, expiring soon, expired)
- Search bar (name, manufacturer, model)
- "Add Equipment" button
- Visual indicators:
  - 🟢 Green = Warranty active (>30 days)
  - 🟡 Yellow = Expiring soon (<30 days)
  - 🔴 Red = Expired
  - ⚪ Gray = No warranty

**Columns:**
- Equipment Name
- Category
- Manufacturer/Model
- Warranty Status
- Days Until Expiry
- Documents Count
- Actions (View, Edit, Delete)

### 2. Equipment Detail Modal (`client/src/components/EquipmentDetailModal.vue`)

**Tabs:**
- **Overview** - All equipment info
- **Documents** (3) - Attached manuals, warranties, invoices
- **Service History** (5) - Chronological service records
- **Edit** - Form to update equipment info

### 3. Add Equipment Modal (`client/src/components/AddEquipmentModal.vue`)

**Form Fields:**
- Equipment Name* (required)
- Category* (dropdown)
- Manufacturer
- Model Number
- Serial Number
- Purchase Date (date picker)
- Purchase Price
- Warranty Start Date (date picker)
- Warranty End Date (date picker)
- Warranty Provider
- Installation Date (date picker)
- Location on Boat
- Notes (textarea)

### 4. Warranty Alert Banner (`client/src/components/WarrantyAlertBanner.vue`)

**Display at top of dashboard if warranties expiring soon:**
```
⚠️ 3 warranties expiring soon
└─ Main Engine: 15 days remaining
└─ GPS Navigator: 22 days remaining
└─ VHF Radio: 28 days remaining
[View All]
```

---

## Implementation Steps

### Phase 1: Database (15 min)

1. Create migration: `server/migrations/011_equipment_inventory.sql`
2. Run migration locally: `node server/run-migration.js 011_equipment_inventory.sql`
3. Verify tables created

### Phase 2: Backend API (45 min)

1. Create service: `server/services/equipment-service.js`
   - CRUD operations for equipment
   - Warranty status calculation
   - Alert generation logic

2. Create routes: `server/routes/equipment.js`
   - Implement all 8 endpoints listed above
   - Auth middleware (JWT required)
   - Organization scope validation

3. Update `server/index.js`:
   ```javascript
   app.use('/api/organizations/:orgId/equipment', require('./routes/equipment'));
   ```

### Phase 3: Frontend (60 min)

1. Create views:
   - `client/src/views/Inventory.vue` (list)

2. Create components:
   - `client/src/components/EquipmentDetailModal.vue`
   - `client/src/components/AddEquipmentModal.vue`
   - `client/src/components/WarrantyAlertBanner.vue`

3. Update router:
   ```javascript
   {
     path: '/inventory',
     component: () => import('./views/Inventory.vue'),
     meta: { requiresAuth: true }
   }
   ```

4. Update navigation:
   - Add "Inventory" link to main menu
   - Add warranty alert banner to HomeView.vue

### Phase 4: Testing (15 min)

1. Create test data: 10-15 sample equipment items
2. Test all CRUD operations
3. Verify warranty calculations
4. Test document attachments
5. Test service history

---

## Warranty Status Logic

```javascript
function calculateWarrantyStatus(warranty_end_date) {
  if (!warranty_end_date) return 'none';

  const now = Date.now();
  const expiryDate = warranty_end_date;
  const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 30) return 'expiring_soon';
  return 'active';
}
```

---

## Demo Data

**Sample Equipment for Riviera Plaisance Demo:**

1. Main Engine - Yanmar 4JH5E (warranty expires in 45 days)
2. GPS Navigator - Garmin GPSMAP 1242xsv (warranty active)
3. VHF Radio - Standard Horizon GX2400 (warranty expired)
4. Watermaker - Spectra Ventura 200 (no warranty)
5. Battery Charger - Victron Multiplus 12/3000 (warranty expires in 15 days)
6. Windlass - Lewmar V5 (warranty active)
7. Autopilot - Raymarine EV-100 (warranty expires in 5 days)
8. Refrigerator - Isotherm CR65 (warranty active)
9. Air Conditioning - Dometic Turbo DTU16 (warranty expired)
10. Solar Panels - Solbian SP72 (warranty active)

---

## Success Criteria

✅ Can add new equipment with warranty info
✅ Can view all equipment in sortable table
✅ Can filter by category and warranty status
✅ Can attach documents to equipment
✅ Can add service records
✅ Warranty alerts show on dashboard
✅ Visual indicators for warranty status (colors)
✅ Can search equipment by name/manufacturer/model
✅ Can edit and delete equipment
✅ Activity timeline shows equipment events

---

## Next Steps After Completion

1. Push feature branch to GitHub
2. Create SESSION-INVENTORY-COMPLETE.md
3. Signal ready for integration
4. Test with real demo data

---

**Duration:** 90-120 minutes
**Dependencies:** None (standalone feature)
**Branch:** `feature/inventory-warranty`
