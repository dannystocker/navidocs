# Feature Spec: Compliance & Certification Tracker

**Created:** 2025-11-13
**Priority:** P1 (Core Feature)
**Estimated Time:** 75-90 minutes
**Assignee:** Cloud Session 9

---

## Executive Summary

Add compliance and certification tracking to NaviDocs for managing regulatory requirements, safety inspections, licenses, registrations, and certifications. Marine vessels require numerous time-sensitive certifications to remain legal and insured.

**Value Proposition:**
- Never miss certification renewal deadlines
- Avoid fines and legal issues
- Track all compliance requirements in one place
- Automated renewal alerts
- Document attachment for certificates
- Audit trail for inspections
- Insurance requirement tracking

---

## User Story

**As a** boat owner/operator
**I want to** track all certifications, licenses, and compliance requirements
**So that** I stay legal, insured, and avoid costly fines

**Acceptance Criteria:**
1. ✅ Track certifications with expiration dates
2. ✅ Get alerts for upcoming renewals
3. ✅ Categorize by type (vessel, safety, crew, insurance)
4. ✅ Attach certificate documents
5. ✅ Track renewal history
6. ✅ Visual status indicators (valid, expiring soon, expired)
7. ✅ Dashboard compliance overview

---

## Database Schema

### Table: `compliance_items`

```sql
CREATE TABLE compliance_items (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  item_type TEXT NOT NULL, -- 'vessel_registration', 'safety_inspection', 'crew_certification', 'insurance', 'equipment_certification', 'environmental', 'other'
  item_name TEXT NOT NULL,
  description TEXT,
  issuing_authority TEXT, -- "U.S. Coast Guard", "State DMV", "Insurance Company"
  certificate_number TEXT,
  issue_date INTEGER,
  expiration_date INTEGER NOT NULL,
  renewal_frequency_days INTEGER, -- e.g., 365 for annual, 730 for biennial
  status TEXT NOT NULL, -- 'valid', 'expiring_soon', 'expired', 'pending_renewal'
  is_mandatory BOOLEAN DEFAULT 1,
  alert_days_before INTEGER DEFAULT 30,
  cost REAL,
  renewal_process TEXT, -- Steps required to renew
  contact_for_renewal TEXT, -- Contact info for renewal agency
  notes TEXT,
  last_alert_sent INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_compliance_org ON compliance_items(organization_id);
CREATE INDEX idx_compliance_type ON compliance_items(item_type);
CREATE INDEX idx_compliance_expiration ON compliance_items(expiration_date);
CREATE INDEX idx_compliance_status ON compliance_items(status);
```

### Table: `compliance_renewals`

```sql
CREATE TABLE compliance_renewals (
  id TEXT PRIMARY KEY,
  compliance_item_id TEXT NOT NULL,
  renewal_date INTEGER NOT NULL,
  new_expiration_date INTEGER NOT NULL,
  new_certificate_number TEXT,
  cost REAL,
  renewed_by_user_id TEXT,
  document_id TEXT, -- Link to uploaded certificate
  notes TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (compliance_item_id) REFERENCES compliance_items(id) ON DELETE CASCADE,
  FOREIGN KEY (renewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
);

CREATE INDEX idx_renewals_compliance ON compliance_renewals(compliance_item_id);
CREATE INDEX idx_renewals_date ON compliance_renewals(renewal_date);
```

### Table: `compliance_documents`

```sql
CREATE TABLE compliance_documents (
  id TEXT PRIMARY KEY,
  compliance_item_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'certificate', 'application', 'receipt', 'inspection_report'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (compliance_item_id) REFERENCES compliance_items(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_compliance_docs_compliance ON compliance_documents(compliance_item_id);
CREATE INDEX idx_compliance_docs_document ON compliance_documents(document_id);
```

---

## Compliance Categories

### Vessel Registration & Documentation
- Vessel Registration
- Coast Guard Documentation
- State Title
- HIN (Hull Identification Number) registration

### Safety Inspections & Equipment
- USCG Safety Inspection
- Fire Extinguisher Inspection
- Life Raft Certification
- EPIRB Registration
- Flare Expiration
- VHF Radio License

### Insurance
- Hull Insurance Policy
- Protection & Indemnity (P&I) Insurance
- Crew Insurance
- Liability Insurance

### Crew Certifications
- Captain's License
- STCW Certification
- First Aid/CPR Certification
- Radio Operator License
- Passport (crew members)

### Equipment Certifications
- Liferaft Certification
- EPIRB Battery
- Fire Suppression System Inspection
- Radar Calibration

### Environmental Compliance
- Sewage Treatment System Certification
- Oil Record Book
- Garbage Management Plan
- Ballast Water Management

---

## API Endpoints

### 1. List Compliance Items

**GET** `/api/organizations/:orgId/compliance`

**Query Params:**
- `type` (optional) - Filter by item_type
- `status` (optional) - Filter by status
- `mandatory_only` (optional) - Boolean

**Response:**
```json
{
  "items": [
    {
      "id": "cmp_123",
      "item_type": "vessel_registration",
      "item_name": "Vessel Registration",
      "issuing_authority": "Rhode Island DMV",
      "certificate_number": "RI-12345",
      "issue_date": 1672531200000,
      "expiration_date": 1735689600000,
      "status": "expiring_soon",
      "days_until_expiry": 25,
      "is_mandatory": true,
      "cost": 125.00,
      "attached_documents": 2
    }
  ],
  "stats": {
    "total": 18,
    "valid": 12,
    "expiring_soon": 4,
    "expired": 2,
    "mandatory_expired": 1
  }
}
```

### 2. Create Compliance Item

**POST** `/api/organizations/:orgId/compliance`

**Body:**
```json
{
  "item_type": "vessel_registration",
  "item_name": "Vessel Registration",
  "issuing_authority": "Rhode Island DMV",
  "certificate_number": "RI-12345",
  "issue_date": 1672531200000,
  "expiration_date": 1735689600000,
  "renewal_frequency_days": 365,
  "is_mandatory": true,
  "alert_days_before": 30,
  "cost": 125.00,
  "renewal_process": "Online renewal at dmv.ri.gov or in person",
  "contact_for_renewal": "RI DMV: 1-401-555-0123"
}
```

### 3. Get Compliance Item Details

**GET** `/api/organizations/:orgId/compliance/:itemId`

**Response:**
```json
{
  "item": {
    "id": "cmp_123",
    "item_type": "vessel_registration",
    "item_name": "Vessel Registration",
    "issuing_authority": "Rhode Island DMV",
    "certificate_number": "RI-12345",
    "issue_date": 1672531200000,
    "expiration_date": 1735689600000,
    "status": "expiring_soon",
    "days_until_expiry": 25,
    "is_mandatory": true,
    "cost": 125.00,
    "renewal_process": "Online renewal at dmv.ri.gov or in person",
    "contact_for_renewal": "RI DMV: 1-401-555-0123"
  },
  "renewal_history": [
    {
      "id": "ren_456",
      "renewal_date": 1672531200000,
      "new_expiration_date": 1735689600000,
      "cost": 125.00,
      "renewed_by": "John Doe"
    }
  ],
  "documents": [
    {
      "id": "doc_789",
      "document_type": "certificate",
      "title": "2024 Vessel Registration Certificate",
      "uploaded_at": 1672531200000
    }
  ]
}
```

### 4. Renew Compliance Item

**POST** `/api/organizations/:orgId/compliance/:itemId/renew`

**Body:**
```json
{
  "renewal_date": 1699920000000,
  "new_expiration_date": 1735689600000,
  "new_certificate_number": "RI-12345",
  "cost": 125.00,
  "document_id": "doc_789",
  "notes": "Renewed online"
}
```

**Response:**
- Updates compliance_item.expiration_date
- Updates compliance_item.status to 'valid'
- Creates renewal record in compliance_renewals
- Auto-calculates next renewal based on renewal_frequency_days

### 5. Get Compliance Alerts

**GET** `/api/organizations/:orgId/compliance/alerts`

**Response:**
```json
{
  "alerts": [
    {
      "item_id": "cmp_123",
      "item_name": "Vessel Registration",
      "item_type": "vessel_registration",
      "expiration_date": 1735689600000,
      "days_until_expiry": 15,
      "alert_level": "urgent",
      "is_mandatory": true
    }
  ]
}
```

### 6. Update Compliance Item

**PUT** `/api/organizations/:orgId/compliance/:itemId`

### 7. Delete Compliance Item

**DELETE** `/api/organizations/:orgId/compliance/:itemId`

### 8. Get Compliance Dashboard

**GET** `/api/organizations/:orgId/compliance/dashboard`

**Response:**
```json
{
  "overview": {
    "total_items": 18,
    "valid": 12,
    "expiring_soon": 4,
    "expired": 2,
    "mandatory_expired": 1
  },
  "urgent_items": [
    {
      "item_name": "Vessel Registration",
      "days_until_expiry": 5,
      "is_mandatory": true
    }
  ],
  "upcoming_renewals": [
    {
      "item_name": "Hull Insurance",
      "expiration_date": 1735689600000,
      "days_until_expiry": 45,
      "cost": 2500.00
    }
  ],
  "total_renewal_cost_90_days": 4250.00
}
```

---

## Frontend Components

### 1. Compliance Dashboard (`client/src/views/Compliance.vue`)

**Features:**
- Status overview cards (Valid, Expiring Soon, Expired)
- Alert banner for critical items
- Filterable table of all compliance items
- Visual status indicators (🟢 🟡 🔴)
- "Add Compliance Item" button
- Quick actions (Renew, View Details, Edit)

**Dashboard Cards:**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ ✅ 12 Valid     │  │ ⚠️ 4 Expiring  │  │ ❌ 2 Expired    │
│ All up to date  │  │ Within 30 days  │  │ Renew now       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Table Columns:**
- Item Name
- Category
- Issuing Authority
- Certificate #
- Expiration Date
- Days Until Expiry
- Status
- Cost
- Actions

### 2. Add Compliance Item Modal (`client/src/components/AddComplianceItemModal.vue`)

**Form Fields:**
- Item Type* (dropdown - categories above)
- Item Name* (e.g., "Vessel Registration")
- Description
- Issuing Authority
- Certificate Number
- Issue Date (date picker)
- Expiration Date* (date picker)
- Renewal Frequency (days)
- Is Mandatory (checkbox - default: true)
- Alert Days Before (number - default: 30)
- Cost
- Renewal Process (textarea)
- Contact for Renewal
- Notes

### 3. Renew Compliance Modal (`client/src/components/RenewComplianceModal.vue`)

**Form Fields:**
- Renewal Date* (date picker - default: today)
- New Expiration Date* (date picker)
- New Certificate Number
- Cost
- Upload Certificate Document
- Notes

**Auto-fill logic:**
- If renewal_frequency_days exists, auto-calculate new_expiration_date
- Pre-populate cost from previous renewal

### 4. Compliance Alert Banner (`client/src/components/ComplianceAlertBanner.vue`)

**Display at top of dashboard:**
```
🚨 URGENT: 1 mandatory certification expired | ⚠️ 4 items expiring within 30 days
└─ Vessel Registration: EXPIRED 3 days ago
└─ Hull Insurance: Expires in 5 days
[View All Compliance]
```

### 5. Compliance Calendar View (`client/src/components/ComplianceCalendar.vue`)

**Features:**
- Month view calendar
- Show expiration dates
- Color-coded by urgency
- Click to view/renew

---

## Status Logic

```javascript
function calculateComplianceStatus(item) {
  const now = Date.now();
  const expirationDate = item.expiration_date;

  if (!expirationDate) return 'pending_renewal';

  const daysUntilExpiry = Math.floor((expirationDate - now) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= item.alert_days_before) return 'expiring_soon';
  return 'valid';
}

function getAlertLevel(item) {
  const daysUntilExpiry = Math.floor((item.expiration_date - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0 && item.is_mandatory) return 'critical';
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 7) return 'urgent';
  if (daysUntilExpiry <= 30) return 'warning';
  return 'info';
}
```

---

## Implementation Steps

### Phase 1: Database (12 min)

1. Create migration: `server/migrations/014_compliance_certification.sql`
2. Run migration
3. Verify 3 tables created

### Phase 2: Backend Service (25 min)

1. Create: `server/services/compliance-service.js`
   - CRUD for compliance items
   - Renewal logic
   - Status calculation
   - Alert generation
   - Dashboard statistics

### Phase 3: Backend Routes (18 min)

1. Create: `server/routes/compliance.js`
2. Implement 8 endpoints
3. Register route

### Phase 4: Frontend (45 min)

1. Create `views/Compliance.vue` (dashboard + table)
2. Create `components/AddComplianceItemModal.vue`
3. Create `components/RenewComplianceModal.vue`
4. Create `components/ComplianceAlertBanner.vue`
5. Create `components/ComplianceCalendar.vue` (optional)
6. Update router: Add `/compliance` route
7. Update navigation: Add "Compliance" link

### Phase 5: Integration (10 min)

1. Add compliance alert banner to dashboard
2. Link documents to compliance items
3. Log compliance renewals to timeline

### Phase 6: Demo Data (10 min)

Create 12-15 compliance items:
- 2 expired (1 mandatory)
- 3 expiring within 30 days
- 7 valid
- Mix of categories

---

## Demo Data

**Sample Compliance Items for Riviera Plaisance Demo:**

**EXPIRED:**
1. Vessel Registration - EXPIRED 3 days ago (MANDATORY)
2. First Aid Kit Inspection - EXPIRED 10 days ago

**EXPIRING SOON:**
3. Hull Insurance - Expires in 5 days ($2,500)
4. Fire Extinguisher Inspection - Expires in 12 days
5. Captain's License - Expires in 28 days (crew: John Smith)

**VALID:**
6. Coast Guard Documentation - Valid for 18 months
7. VHF Radio License - Valid for 8 months
8. Liferaft Certification - Valid for 5 months
9. EPIRB Registration - Valid for 10 months
10. P&I Insurance - Valid for 3 months ($1,500 annual)
11. STCW Certification (crew) - Valid for 14 months
12. Sewage System Certification - Valid for 9 months

---

## Success Criteria

✅ Database migration creates 3 tables
✅ All 8 API endpoints working
✅ Can add compliance items
✅ Can renew items (updates expiration, creates renewal record)
✅ Status calculated correctly (valid, expiring_soon, expired)
✅ Alert banner shows urgent items
✅ Dashboard shows overview statistics
✅ Can filter by type and status
✅ Documents can be attached to items
✅ Renewal history tracked
✅ Demo data loads successfully

---

## Integration Points

**With Documents:**
- Attach certificates, receipts, inspection reports
- Auto-link uploaded certificates to compliance items

**With Timeline:**
- Log compliance item creation
- Log renewal events
- Log expiration alerts

**With Dashboard:**
- Compliance overview widget
- Alert banner for critical items
- Upcoming renewals summary

**With Contacts:**
- Link renewal contacts (DMV, Coast Guard, insurance agent)
- Quick access to renewal contact info

---

**Duration:** 75-90 minutes
**Dependencies:** None (standalone feature)
**Branch:** `feature/compliance-certification`
