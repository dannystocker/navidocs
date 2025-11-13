# Feature Spec: Crew & Contact Management

**Created:** 2025-11-13
**Priority:** P1 (Core Feature)
**Estimated Time:** 60-90 minutes
**Assignee:** Cloud Session 8

---

## Executive Summary

Add contact management system to NaviDocs for tracking crew members, marina staff, service providers, brokers, and emergency contacts. Marine operations require quick access to key contacts with specialized information (certifications, rates, availability).

**Value Proposition:**
- Centralized contact directory for all marine operations
- Track crew certifications and availability
- Store service provider details with ratings and rates
- Emergency contacts with quick dial
- Marina contact information and slip details
- Integration with equipment service history

---

## User Story

**As a** boat owner/manager
**I want to** manage contacts for crew, service providers, and marinas
**So that** I can quickly find the right person for any situation

**Acceptance Criteria:**
1. ✅ Add contacts with categorization (Crew, Service Provider, Marina, Emergency, Broker, Other)
2. ✅ Store contact details (phone, email, address, notes)
3. ✅ Track crew certifications and availability
4. ✅ Rate and review service providers
5. ✅ Link service providers to equipment/maintenance
6. ✅ Quick access to emergency contacts
7. ✅ Search and filter contacts

---

## Database Schema

### Table: `contacts`

```sql
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  contact_type TEXT NOT NULL, -- 'crew', 'service_provider', 'marina', 'emergency', 'broker', 'other'
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  role_title TEXT,
  primary_phone TEXT,
  secondary_phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT 0,
  is_emergency_contact BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_contacts_type ON contacts(contact_type);
CREATE INDEX idx_contacts_favorite ON contacts(is_favorite);
CREATE INDEX idx_contacts_emergency ON contacts(is_emergency_contact);
```

### Table: `contact_crew_details`

```sql
CREATE TABLE contact_crew_details (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  certifications TEXT, -- JSON array: ["Captain's License", "STCW", "First Aid"]
  experience_years INTEGER,
  daily_rate REAL,
  availability_status TEXT, -- 'available', 'busy', 'seasonal'
  preferred_roles TEXT, -- JSON array: ["Captain", "First Mate", "Engineer"]
  languages TEXT, -- JSON array: ["English", "French", "Spanish"]
  passport_expiry INTEGER,
  medical_cert_expiry INTEGER,
  notes TEXT,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE INDEX idx_crew_contact ON contact_crew_details(contact_id);
```

### Table: `contact_service_provider_details`

```sql
CREATE TABLE contact_service_provider_details (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  service_categories TEXT NOT NULL, -- JSON array: ["Engine Repair", "Electronics", "Hull Work"]
  hourly_rate REAL,
  rating REAL, -- 0-5 stars
  total_jobs_completed INTEGER DEFAULT 0,
  is_certified BOOLEAN DEFAULT 0,
  certifications TEXT, -- JSON array
  insurance_verified BOOLEAN DEFAULT 0,
  license_number TEXT,
  website TEXT,
  business_hours TEXT,
  payment_terms TEXT,
  notes TEXT,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE INDEX idx_service_contact ON contact_service_provider_details(contact_id);
CREATE INDEX idx_service_rating ON contact_service_provider_details(rating);
```

### Table: `contact_marina_details`

```sql
CREATE TABLE contact_marina_details (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  marina_name TEXT NOT NULL,
  slip_number TEXT,
  monthly_rate REAL,
  amenities TEXT, -- JSON array: ["Fuel Dock", "WiFi", "Pump Out", "Showers"]
  max_boat_length_feet INTEGER,
  depth_at_dock_feet REAL,
  latitude REAL,
  longitude REAL,
  vhf_channel TEXT,
  operating_season TEXT, -- "Year-round" or "May-October"
  website TEXT,
  notes TEXT,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

CREATE INDEX idx_marina_contact ON contact_marina_details(contact_id);
```

### Table: `contact_service_history`

```sql
CREATE TABLE contact_service_history (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  service_date INTEGER NOT NULL,
  service_type TEXT NOT NULL,
  equipment_id TEXT,
  description TEXT NOT NULL,
  cost REAL,
  rating INTEGER, -- 1-5 stars
  would_recommend BOOLEAN,
  notes TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment_inventory(id) ON DELETE SET NULL
);

CREATE INDEX idx_service_history_contact ON contact_service_history(contact_id);
CREATE INDEX idx_service_history_date ON contact_service_history(service_date);
```

---

## API Endpoints

### 1. List Contacts

**GET** `/api/organizations/:orgId/contacts`

**Query Params:**
- `type` (optional) - Filter by contact_type
- `favorites` (optional) - Boolean, only favorites
- `emergency` (optional) - Boolean, only emergency contacts
- `search` (optional) - Search by name, company, role

**Response:**
```json
{
  "contacts": [
    {
      "id": "cnt_123",
      "contact_type": "service_provider",
      "first_name": "John",
      "last_name": "Smith",
      "company_name": "ABC Marine Services",
      "role_title": "Marine Mechanic",
      "primary_phone": "+1-555-0123",
      "email": "john@abcmarine.com",
      "is_favorite": true,
      "is_emergency_contact": false,
      "service_provider_details": {
        "service_categories": ["Engine Repair", "Transmission"],
        "hourly_rate": 95.00,
        "rating": 4.8,
        "total_jobs_completed": 12
      }
    }
  ],
  "stats": {
    "total": 45,
    "crew": 5,
    "service_providers": 15,
    "marinas": 8,
    "emergency": 6,
    "brokers": 3,
    "other": 8
  }
}
```

### 2. Create Contact

**POST** `/api/organizations/:orgId/contacts`

**Body:**
```json
{
  "contact_type": "service_provider",
  "first_name": "John",
  "last_name": "Smith",
  "company_name": "ABC Marine Services",
  "role_title": "Marine Mechanic",
  "primary_phone": "+1-555-0123",
  "email": "john@abcmarine.com",
  "address": "123 Harbor Rd",
  "city": "Newport",
  "state_province": "RI",
  "postal_code": "02840",
  "is_favorite": true,
  "service_provider_details": {
    "service_categories": ["Engine Repair", "Transmission"],
    "hourly_rate": 95.00,
    "is_certified": true,
    "certifications": ["ASE Certified", "Yanmar Authorized"]
  }
}
```

### 3. Get Contact Details

**GET** `/api/organizations/:orgId/contacts/:contactId`

**Response:**
```json
{
  "contact": {
    "id": "cnt_123",
    "contact_type": "service_provider",
    "first_name": "John",
    "last_name": "Smith",
    "company_name": "ABC Marine Services",
    "role_title": "Marine Mechanic",
    "primary_phone": "+1-555-0123",
    "secondary_phone": "+1-555-0124",
    "email": "john@abcmarine.com",
    "address": "123 Harbor Rd",
    "city": "Newport",
    "state_province": "RI",
    "postal_code": "02840",
    "country": "USA",
    "is_favorite": true,
    "service_provider_details": {
      "service_categories": ["Engine Repair", "Transmission"],
      "hourly_rate": 95.00,
      "rating": 4.8,
      "total_jobs_completed": 12,
      "is_certified": true,
      "certifications": ["ASE Certified", "Yanmar Authorized"]
    }
  },
  "service_history": [
    {
      "id": "sh_456",
      "service_date": 1699920000000,
      "service_type": "Engine Repair",
      "equipment_name": "Main Engine - Yanmar 4JH5E",
      "description": "Replaced fuel injector",
      "cost": 850.00,
      "rating": 5,
      "would_recommend": true
    }
  ]
}
```

### 4. Update Contact

**PUT** `/api/organizations/:orgId/contacts/:contactId`

### 5. Delete Contact

**DELETE** `/api/organizations/:orgId/contacts/:contactId`

### 6. Add Service History Entry

**POST** `/api/organizations/:orgId/contacts/:contactId/service-history`

**Body:**
```json
{
  "service_date": 1699920000000,
  "service_type": "Engine Repair",
  "equipment_id": "eq_123",
  "description": "Replaced fuel injector",
  "cost": 850.00,
  "rating": 5,
  "would_recommend": true,
  "notes": "Quick response, professional work"
}
```

### 7. Get Emergency Contacts

**GET** `/api/organizations/:orgId/contacts/emergency`

**Response:**
```json
{
  "contacts": [
    {
      "id": "cnt_789",
      "first_name": "Coast Guard",
      "primary_phone": "*16",
      "secondary_phone": "1-800-XXX-XXXX",
      "notes": "VHF Channel 16"
    }
  ]
}
```

---

## Frontend Components

### 1. Contacts Directory (`client/src/views/Contacts.vue`)

**Features:**
- Card-based layout with contact cards
- Filter by contact type (tabs or dropdown)
- Search bar
- "Add Contact" button
- Star favorite contacts
- Quick actions (Call, Email, View Details, Edit)
- Sort by: Name, Recent, Rating (for service providers)

**Contact Card Layout:**
```
┌─────────────────────────────────────┐
│ ⭐ John Smith                        │
│ ABC Marine Services                 │
│ Marine Mechanic                     │
│ ──────────────────────────────────  │
│ 📞 +1-555-0123                      │
│ ✉️  john@abcmarine.com               │
│ 💰 $95/hr | ⭐ 4.8 | 12 jobs        │
│ [Call] [Email] [View] [Edit]        │
└─────────────────────────────────────┘
```

### 2. Add Contact Modal (`client/src/components/AddContactModal.vue`)

**Step 1: Contact Type Selection**
- Radio buttons: Crew, Service Provider, Marina, Emergency, Broker, Other

**Step 2: Basic Info (All Types)**
- First Name*
- Last Name*
- Company Name
- Role/Title
- Primary Phone*
- Secondary Phone
- Email
- Address
- City, State/Province, Postal Code, Country
- Notes
- Favorite (checkbox)
- Emergency Contact (checkbox)

**Step 3: Type-Specific Details**

**If Service Provider:**
- Service Categories (multi-select)
- Hourly Rate
- Certifications
- Insurance Verified (checkbox)
- License Number
- Website
- Business Hours
- Payment Terms

**If Crew:**
- Certifications (multi-select)
- Experience Years
- Daily Rate
- Availability Status
- Preferred Roles
- Languages
- Passport Expiry Date
- Medical Cert Expiry Date

**If Marina:**
- Marina Name
- Slip Number
- Monthly Rate
- Amenities (multi-select)
- Max Boat Length
- Depth at Dock
- VHF Channel
- Operating Season
- Website

### 3. Contact Detail View (`client/src/components/ContactDetailModal.vue`)

**Tabs:**
- **Overview** - All contact info
- **Service History** - Past work (if service provider)
- **Documents** - Attached documents (contracts, invoices, certifications)
- **Edit** - Update contact info

### 4. Emergency Contacts Quick Access (`client/src/components/EmergencyContactsWidget.vue`)

**Display on dashboard:**
```
🚨 Emergency Contacts
├─ Coast Guard: *16 (VHF) / 1-800-XXX-XXXX
├─ TowBoatUS: 1-800-391-4869
├─ ABC Marine Services: +1-555-0123
└─ Newport Marina: +1-555-0200
```

### 5. Service Provider Rating Component

**After service completion:**
- Star rating (1-5)
- Would recommend? (Yes/No)
- Notes/Review

---

## Service Categories

**Predefined Categories:**
- Engine Repair & Service
- Electrical Systems
- Electronics & Navigation
- Plumbing & Pumps
- Hull & Fiberglass Work
- Rigging & Sails
- Canvas & Upholstery
- Bottom Painting
- Detailing & Cleaning
- Refrigeration & HVAC
- Diesel Mechanics
- Woodwork & Carpentry
- Welding & Fabrication
- Surveying
- Insurance
- Legal Services
- Brokerage
- Towing & Salvage

---

## Implementation Steps

### Phase 1: Database (15 min)

1. Create migration: `server/migrations/013_crew_contacts.sql`
2. Run migration
3. Verify 5 tables created

### Phase 2: Backend Service (25 min)

1. Create: `server/services/contacts-service.js`
   - CRUD for contacts
   - Handle type-specific details (crew, service provider, marina)
   - Service history tracking
   - Rating calculations

### Phase 3: Backend Routes (15 min)

1. Create: `server/routes/contacts.js`
2. Implement 7 endpoints
3. Register route

### Phase 4: Frontend (45 min)

1. Create `views/Contacts.vue` (directory view)
2. Create `components/AddContactModal.vue` (multi-step form)
3. Create `components/ContactDetailModal.vue`
4. Create `components/EmergencyContactsWidget.vue`
5. Update router: Add `/contacts` route
6. Update navigation: Add "Contacts" link

### Phase 5: Integration (10 min)

1. Add emergency contacts widget to dashboard
2. Link service providers to maintenance completions
3. Link contacts to equipment service history

### Phase 6: Demo Data (10 min)

Create 20-25 sample contacts:
- 5 crew members
- 8 service providers (various specialties)
- 4 marinas
- 4 emergency contacts
- 2 brokers
- 2-3 other contacts

---

## Demo Data

**Sample Contacts for Riviera Plaisance Demo:**

**Service Providers:**
1. ABC Marine Services - Engine Repair (Rating: 4.8, 12 jobs)
2. Newport Electronics - Electronics & Navigation (Rating: 4.9, 8 jobs)
3. Harbor Rigging - Rigging & Sails (Rating: 4.5, 5 jobs)
4. Hull Masters - Fiberglass Repair (Rating: 5.0, 3 jobs)
5. Marine Electric Pro - Electrical Systems (Rating: 4.7, 9 jobs)

**Crew:**
1. Captain Mike Johnson - 20 years experience, Captain's License
2. Sarah Williams - First Mate, STCW certified
3. Tom Anderson - Engineer, 15 years experience

**Marinas:**
1. Newport Harbor Marina - Slip #A-12, $450/month
2. Jamestown Marina - Transient docking
3. Point Judith Marina - Winter storage
4. Block Island Marina - Summer anchorage

**Emergency:**
1. Coast Guard - *16 VHF
2. TowBoatUS - 1-800-391-4869
3. ABC Marine Services - After-hours emergency
4. Newport Marina - Harbor master

---

## Success Criteria

✅ Database migration creates 5 tables
✅ All 7 API endpoints working
✅ Can add contacts with type-specific details
✅ Can filter by contact type
✅ Can search contacts
✅ Can favorite contacts
✅ Emergency contacts widget on dashboard
✅ Service providers can be rated
✅ Service history tracked per provider
✅ Integration with maintenance/equipment
✅ Demo data loads successfully

---

## Integration Points

**With Maintenance:**
- Link service providers to maintenance completions
- Auto-populate provider details when completing maintenance
- Track provider ratings based on maintenance work

**With Equipment:**
- Link service providers to equipment service history
- Show recommended providers per equipment type

**With Timeline:**
- Log contact creation events
- Log service completion events with provider info

**With Dashboard:**
- Emergency contacts widget
- Recently contacted providers
- Top-rated service providers

---

**Duration:** 60-90 minutes
**Dependencies:** None (standalone feature)
**Branch:** `feature/crew-contacts`
