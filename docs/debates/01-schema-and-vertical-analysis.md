# Expert Panel Debates: NaviDocs Architecture & Vertical Analysis

---

## PANEL 1: TECH ARCHITECTURE & SCHEMA DESIGN
**Duration:** 47 minutes of intense debate
**Attendees:** 
- **Database Architect** (PostgreSQL partisan, hates breaking changes)
- **Search Engineer** (Meilisearch specialist, schema pragmatist)
- **Backend Lead** (Node.js, API-first thinking)
- **Data Scientist** (ML/embeddings future-gazer)
- **DevOps** (migration nightmares survivor)

---

### Round 1: Core Schema Philosophy

**Database Architect:** "We need to talk about the elephant in the room. SQLite is fine for prototyping, but you're building a multi-tenant document management system. What happens when user #500 uploads a 200-page manual and you need to query across 50,000 indexed pages? SQLite will choke. We should start with Postgres + proper normalization."

**Backend Lead:** "Hard disagree. Premature optimization. We have ZERO users. SQLite handles 100GB+ databases fine with proper indexing. The real question is: do we normalize or go document-oriented?"

**Search Engineer:** "You're both missing the point. The source of truth IS Meilisearch for this use case. Think about it - every query is a search query. 'Show me all electrical manuals for my boat' - that's a search with filters, not a SQL join. The relational DB is just a durable write log."

**Database Architect:** "That's insane. Meilisearch is a search index, not a database. What about transactions? ACID guarantees? Backups?"

**Search Engineer:** "SQLite gives us ACID. Meilisearch gives us instant search. We use both, but design the schema for search-first, not relational-first."

**Data Scientist:** "Can I throw a grenade in here? What about vector embeddings? If we're doing semantic search on boat manuals - 'how do I fix the bilge pump' should match documents that never use the word 'bilge' - we need embedding vectors. That's 1536 floats per chunk. SQLite can't index that. Postgres with pgvector can."

**DevOps:** "Let me tell you about my last migration hell: changing a column type in production with 10M rows. Took 6 hours of downtime. Whatever schema we pick, it MUST support additive changes only. No column renames, no type changes, no foreign key reshuffling."

**Backend Lead:** "Okay, consensus check: Hybrid approach. SQLite for metadata (user, boat, document). Meilisearch for search. Future: add pgvector when we need semantic search. Schema must be append-only friendly."

**Database Architect:** "Fine, but the schema has to be designed for eventual Postgres migration. That means:"
- Primary keys are UUIDs (portable)
- Timestamps are ISO8601 strings or Unix epochs (no SQLite DateTime gotchas)
- JSON columns are minimal (no nested objects we'll regret)
- Foreign keys are explicit even if not enforced

**Search Engineer:** "And Meilisearch schema must have:"
- Filterable attributes defined upfront (boatId, system, category)
- Sortable attributes (createdAt, updatedAt, pageNumber)
- Searchable attributes weighted (title: 3, text: 1, metadata: 0.5)
- Synonyms configured from day one

---

### Round 2: Schema Design - The Great Debate

**Database Architect:** "Let me propose the relational schema:"

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- UUID
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at INTEGER NOT NULL,  -- Unix timestamp
  updated_at INTEGER NOT NULL
);

-- Boats table (multi-boat support from day 1)
CREATE TABLE boats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  hull_id TEXT,  -- Official hull identification number
  metadata TEXT,  -- JSON for extensibility
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Documents table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  boat_id TEXT NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  page_count INTEGER,
  mime_type TEXT,
  uploaded_by TEXT NOT NULL,
  status TEXT DEFAULT 'processing',  -- processing, indexed, failed
  metadata TEXT,  -- JSON: {system, category, tags, etc}
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Pages table (for OCR results)
CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  text TEXT,  -- OCR extracted text
  ocr_confidence REAL,
  metadata TEXT,  -- JSON: bounding boxes, etc
  created_at INTEGER NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE(document_id, page_number)
);

-- Sharing table (future: share manuals with crew)
CREATE TABLE shares (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  shared_by TEXT NOT NULL,
  shared_with TEXT NOT NULL,
  permission TEXT DEFAULT 'read',  -- read, write, admin
  created_at INTEGER NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_by) REFERENCES users(id),
  FOREIGN KEY (shared_with) REFERENCES users(id)
);
```

**Backend Lead:** "Wait wait wait. Why is `pages` a separate table? That's going to be millions of rows. Every search requires a join. Bad idea."

**Database Architect:** "Because we need to track per-page metadata! OCR confidence, bounding boxes for highlighting, page-level annotations later. It's normalized."

**Search Engineer:** "This is exactly why I said search-first. In Meilisearch, we don't JOIN. Each page is a document:"

```json
{
  "id": "page_doc123_p7",
  "docId": "doc123",
  "boatId": "boat_prestige_f49",
  "userId": "user_456",
  "title": "8.7 Blackwater System",
  "pageNumber": 7,
  "text": "The blackwater pump is located in the aft compartment...",
  "system": "plumbing",
  "category": "waste-management",
  "make": "Prestige",
  "model": "F4.9",
  "year": 2024,
  "tags": ["bilge", "pump", "maintenance"],
  "ocrConfidence": 0.94,
  "createdAt": 1740234567,
  "filePath": "/manuals/doc123.pdf"
}
```

**Backend Lead:** "Okay, that's actually elegant. One Meilisearch query gets everything. But we still need the relational DB for:"
- User authentication
- Boat ownership
- File metadata
- Audit logs

**Data Scientist:** "And here's where it gets interesting. When we add semantic search:"

```json
{
  "id": "page_doc123_p7",
  // ... all the above fields ...
  "embedding": [0.023, -0.154, 0.672, ...],  // 1536 floats
  "_vectors": {
    "default": [0.023, -0.154, ...]
  }
}
```

"Meilisearch doesn't support vector search natively yet. We'll need a hybrid approach: Meilisearch for keyword + filters, separate vector DB (Qdrant/Weaviate) for semantic search, merge results. But the schema MUST have an embedding field from day 1, even if it's null initially."

**DevOps:** "Migration strategy question: how do we version this? What if we realize next month that 'system' should be an array, not a string? A manual can cover electrical AND plumbing."

**Database Architect:** "That's why metadata is JSON. We can evolve it without schema changes."

**Search Engineer:** "Wrong. JSON is a cop-out. If 'system' can be multiple values, make it an array in Meilisearch from day 1:"

```json
{
  "systems": ["electrical", "plumbing"],  // filterable array
  "categories": ["maintenance", "troubleshooting"]
}
```

**Backend Lead:** "Okay, new proposal. Hybrid schema:"

**SQLite (source of truth for entities):**
```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  boat_id TEXT NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT DEFAULT 'processing',
  metadata TEXT,  -- Extensible JSON
  created_at INTEGER NOT NULL
);

CREATE TABLE document_pages (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  ocr_text TEXT,
  ocr_confidence REAL,
  search_indexed BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL
);
```

**Meilisearch (optimized for search):**
```json
{
  "id": "page_doc123_p7",
  "docId": "doc123",
  "boatId": "boat_abc",
  "userId": "user_xyz",
  "title": "Document Title",
  "pageNumber": 7,
  "text": "Full OCR text...",
  "systems": ["electrical", "plumbing"],
  "categories": ["maintenance"],
  "make": "Prestige",
  "model": "F4.9",
  "year": 2024,
  "tags": ["bilge", "pump"],
  "createdAt": 1740234567
}
```

**All:** "Agreed."

---

### Round 3: Future-Proofing - The Breaking Changes Discussion

**DevOps:** "Let's game out the disasters:"

**Scenario 1:** User wants to reorganize their manuals. Change boat assignment.

**Database Architect:** 
```sql
-- Good: Just update boat_id
UPDATE documents SET boat_id = 'new_boat_id' WHERE id = 'doc123';

-- Then re-index in Meilisearch
-- No schema change needed ✅
```

**Scenario 2:** We add "vessel type" field (sailboat vs powerboat).

**Backend Lead:**
```sql
-- SQLite: Add column (additive change)
ALTER TABLE boats ADD COLUMN vessel_type TEXT;

-- Meilisearch: Add to index settings (non-breaking)
{
  "filterableAttributes": ["boatId", "system", "vesselType"],  // Added vesselType
  // Existing docs without vesselType still searchable
}
```

**Search Engineer:** "Key point: Meilisearch handles missing fields gracefully. We can add 'vesselType' today, and old documents won't break. They just won't match `vesselType = 'sailboat'` filters."

**Scenario 3:** We realize 'system' should be hierarchical (electrical → navigation → GPS).

**Data Scientist:** "This is where most schemas fail. Don't fight it - use a path:"

```json
{
  "systemPath": "electrical.navigation.gps",
  "systemHierarchy": ["electrical", "navigation", "gps"],
  // Both: path for display, array for filtering
}
```

**Backend Lead:** "Wait, that's duplication."

**Search Engineer:** "It's not duplication, it's denormalization for query performance. Filtering on `systemHierarchy IN ['electrical']` matches all electrical subdocuments. Denormalization is correct for search indexes."

**Scenario 4:** We add multi-language support (French boat manuals).

**Database Architect:**
```sql
-- SQLite
ALTER TABLE documents ADD COLUMN language TEXT DEFAULT 'en';

-- Meilisearch
{
  "id": "page_doc123_p7_en",
  "language": "en",
  // ...
}

{
  "id": "page_doc123_p7_fr",
  "language": "fr",
  "text": "La pompe des eaux noires est située...",
  // ...
}
```

**Search Engineer:** "Meilisearch has language-specific stemmers. We'd create separate indexes per language for optimal search."

**Data Scientist:** "Or, use language-agnostic embeddings. One index, multilingual semantic search."

**Scenario 5:** User uploads a new version of a manual (manufacturer releases updated manual).

**DevOps:** "This is the BIG ONE. Do we version documents?"

**Database Architect:**
```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  boat_id TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  parent_version_id TEXT,  -- Points to previous version
  is_current BOOLEAN DEFAULT 1,
  // ...
);
```

**Backend Lead:** "That's complicated. Simpler: treat new upload as new document, mark old one as 'archived':"

```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  boat_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',  -- active, archived, deleted
  replaced_by TEXT,  -- Points to newer version
  // ...
);
```

**All:** "Simpler approach wins."

---

### Round 4: Synonyms & Search Intelligence

**Search Engineer:** "Let's talk synonyms. Boating has specific terminology:"

```json
{
  "bilge pump": ["bilge", "sump pump", "drain pump"],
  "head": ["toilet", "marine toilet", "WC"],
  "galley": ["kitchen"],
  "helm": ["steering", "wheel", "cockpit controls"],
  "bow": ["front", "forward"],
  "stern": ["aft", "back", "rear"],
  "port": ["left"],
  "starboard": ["right"],
  "VHF": ["radio", "marine radio"],
  "GPS": ["chartplotter", "navigation system"],
  "autopilot": ["auto helm"],
  "windlass": ["anchor winch"],
  "thruster": ["bow thruster", "stern thruster"]
}
```

**Data Scientist:** "This is where embeddings shine. 'My head is clogged' should match toilet troubleshooting WITHOUT explicit synonyms. But for V1, synonyms are good enough."

**Search Engineer:** "Key config:"

```javascript
// Meilisearch settings
{
  "searchableAttributes": [
    "title",
    "text",
    "systems",
    "categories",
    "tags"
  ],
  "filterableAttributes": [
    "boatId",
    "userId",
    "docId",
    "systems",
    "categories",
    "make",
    "model",
    "year",
    "language"
  ],
  "sortableAttributes": [
    "createdAt",
    "pageNumber",
    "year"
  ],
  "synonyms": {
    "bilge": ["sump", "drain"],
    "head": ["toilet", "marine toilet"],
    // ... all synonyms
  },
  "stopWords": ["the", "a", "an", "and", "or"],
  "rankingRules": [
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness"
  ],
  "typoTolerance": {
    "enabled": true,
    "minWordSizeForTypos": {
      "oneTypo": 4,
      "twoTypos": 8
    }
  }
}
```

**Backend Lead:** "Question: how do we update synonyms without breaking existing searches?"

**Search Engineer:** "Synonyms are index settings, not data. We can update them anytime without re-indexing. Just restart Meilisearch with new config."

---

### CONSENSUS: Final Tech Schema

**Database Architect:** "Okay, here's what we agreed on:"

**SQLite Schema (v1.0):**
```sql
-- Core entities
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE boats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  hull_id TEXT,
  vessel_type TEXT,  -- sailboat, powerboat, catamaran, etc
  length_feet INTEGER,
  metadata TEXT,  -- JSON for extensibility
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  boat_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash TEXT NOT NULL,  -- SHA256 for deduplication
  page_count INTEGER,
  mime_type TEXT DEFAULT 'application/pdf',
  language TEXT DEFAULT 'en',
  status TEXT DEFAULT 'processing',  -- processing, indexed, failed, archived
  replaced_by TEXT,  -- Document ID that supersedes this
  metadata TEXT,  -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE document_pages (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  ocr_text TEXT,
  ocr_confidence REAL,
  ocr_completed_at INTEGER,
  search_indexed_at INTEGER,
  created_at INTEGER NOT NULL,
  UNIQUE(document_id, page_number)
);

CREATE TABLE ocr_jobs (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
  progress INTEGER DEFAULT 0,  -- 0-100
  error TEXT,
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_boats_user ON boats(user_id);
CREATE INDEX idx_documents_boat ON documents(boat_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_pages_document ON document_pages(document_id);
CREATE INDEX idx_jobs_status ON ocr_jobs(status);
```

**Meilisearch Schema (v1.0):**
```javascript
// Index: boat-manuals-pages
{
  // Primary fields
  "id": "page_{docId}_p{pageNum}",
  "docId": "doc_abc123",
  "boatId": "boat_xyz789",
  "userId": "user_456",
  
  // Display fields
  "title": "Owner's Manual - Section 8.7",
  "pageNumber": 7,
  "text": "Full OCR extracted text...",
  
  // Classification (arrays for multi-tagging)
  "systems": ["electrical", "navigation"],
  "categories": ["maintenance", "troubleshooting"],
  "tags": ["bilge", "pump", "replacement"],
  
  // Boat metadata (denormalized for filtering)
  "boatName": "Sea Breeze",
  "make": "Prestige",
  "model": "F4.9",
  "year": 2024,
  "vesselType": "powerboat",
  
  // Document metadata
  "language": "en",
  "ocrConfidence": 0.94,
  
  // Timestamps (Unix)
  "createdAt": 1740234567,
  "updatedAt": 1740234567,
  
  // Future: embeddings
  "embedding": null  // Will be array of 1536 floats
}

// Meilisearch Settings
{
  "searchableAttributes": [
    "title",
    "text",
    "systems",
    "categories",
    "tags",
    "boatName"
  ],
  "filterableAttributes": [
    "boatId",
    "userId",
    "docId",
    "systems",
    "categories",
    "make",
    "model",
    "year",
    "vesselType",
    "language"
  ],
  "sortableAttributes": [
    "createdAt",
    "updatedAt",
    "pageNumber",
    "year",
    "ocrConfidence"
  ],
  "synonyms": { /* boat terminology */ },
  "stopWords": ["the", "a", "an"],
  "typoTolerance": { "enabled": true }
}
```

**All:** "Schema approved. Next panel."

---

## PANEL 2: BOATING VERTICAL - DOMAIN EXPERTS
**Duration:** 38 minutes
**Attendees:**
- **Marine Surveyor** (30 years inspecting boats)
- **Boat Manufacturer Rep** (knows what docs matter)
- **Marina Manager** (handles 200+ boats)
- **Sailing Instructor** (teaches boat systems)
- **Yacht Broker** (deals with documentation nightmares)

---

### Round 1: What Documents Actually Matter?

**Marina Manager:** "Let me tell you what I deal with daily. Boat owners show up and say 'where's the manual for the water heater?' They have NO IDEA. Is it in the owner's manual? Service manual? A separate brochure? It's chaos."

**Marine Surveyor:** "Here's the taxonomy that actually matters in real life:"

```
1. VESSEL DOCUMENTATION
   - Builder's certificate
   - Registration papers
   - Insurance documents
   - Survey reports
   - Coast Guard documentation

2. OWNER'S MANUAL (the big book)
   - Hull & construction
   - Systems overview
   - Safety equipment
   - Specifications

3. SYSTEMS MANUALS (the critical ones)
   PROPULSION:
   - Engine manual (Volvo, Yanmar, Caterpillar)
   - Transmission/drive
   - Propeller specs
   
   ELECTRICAL:
   - Generator manual
   - Shore power system
   - Battery systems
   - Solar/wind if equipped
   
   PLUMBING:
   - Fresh water system
   - Waste water (grey/black)
   - Bilge pumps
   - Water heater
   - Desalination (if equipped)
   
   NAVIGATION:
   - Chartplotter
   - Radar
   - AIS
   - VHF radio
   - Autopilot
   
   HVAC:
   - Air conditioning
   - Heating system
   
   SAFETY:
   - Life raft service manual
   - EPIRB
   - Fire suppression
   
4. COMPONENT MANUALS
   - Every. Single. Thing.
   - Refrigerator, stove, microwave
   - Windlass, davit, watermaker
   - Entertainment systems

5. SERVICE RECORDS
   - Maintenance logs
   - Repair invoices
   - Part receipts
```

**Boat Manufacturer Rep:** "The problem is we give owners a 400-page PDF. They never find what they need. When they call us: 'How do I winterize the water system?' - it's on page 287, section 12.4.6. They'll never find it."

**Sailing Instructor:** "What boat owners ACTUALLY search for:"
```
- "How do I start the engine?" (page 45)
- "Bilge pump not working" (page 198)
- "Water heater troubleshooting" (page 215)
- "Generator won't start" (page 167)
- "How to use the autopilot" (page 312)
- "Winterization procedure" (page 287)
- "Battery charging system" (page 134)
```

**Yacht Broker:** "Here's the nightmare: I'm selling a 2019 Prestige F4.9. Buyer asks: 'Does it have the original manuals?' Owner says: 'Yeah, somewhere...' They can't find them. I lose the sale. OR worse, they find photocopies from 3 different boats mixed together."

**Marine Surveyor:** "This is why the schema MUST support:"

```javascript
{
  "documentType": "component-manual",  // vs owner-manual, service-record, etc
  "component": "water-heater",
  "manufacturer": "Webasto",
  "modelNumber": "FCF Platinum Series",
  "serialNumber": "WB-2024-12345",  // Critical for warranty claims
  "installDate": "2024-03-15",
  "warrantyExpires": "2026-03-15"
}
```

**Marina Manager:** "And here's the killer feature nobody thinks of: SHARED MANUALS. Ten boats have the same Volvo D4 engine. I should upload the Volvo D4 manual ONCE, and all ten boats reference it. Not ten copies."

**All:** "That's brilliant. Shared component library."

---

### Round 2: Boat-Specific Classification

**Marine Surveyor:** "The 'systems' classification we discussed is good, but it needs to match how boat owners think:"

```javascript
// WRONG (too technical)
{
  "systems": ["hvac", "thermal-management"]
}

// RIGHT (how owners talk)
{
  "systems": ["air-conditioning", "heating"],
  "synonyms": ["AC", "climate control", "heat pump"]
}
```

**Sailing Instructor:** "Also, sailboats vs powerboats have different priorities:"

```javascript
// Sailboat-specific
{
  "systems": [
    "rigging",
    "sail-handling",
    "keel",
    "rudder",
    "winches"
  ]
}

// Powerboat-specific
{
  "systems": [
    "trim-tabs",
    "joystick-control",
    "stabilizers",
    "bow-thruster",
    "stern-thruster"
  ]
}
```

**Boat Manufacturer Rep:** "And size matters. A 30-foot boat owner doesn't care about 'tender garage' or 'crew quarters'. A 70-foot yacht owner does:"

```javascript
{
  "vesselSize": "70ft",
  "luxuryFeatures": [
    "tender-garage",
    "crew-quarters",
    "wine-cooler",
    "washer-dryer"
  ]
}
```

**Yacht Broker:** "For resale value, we MUST track:"
```javascript
{
  "maintenanceHistory": [
    {
      "date": "2024-08-15",
      "type": "service",
      "system": "engine",
      "description": "500-hour service - Volvo D4",
      "serviceProvider": "ABC Marine",
      "cost": 2400,
      "documentId": "receipt_abc123"
    }
  ]
}
```

---

### Round 3: Emergency Scenarios

**Marine Surveyor:** "The app must work OFFLINE. You're 20 miles offshore. Engine warning light comes on. You need the manual NOW. No cell signal."

**All:** "PWA with offline cache. Critical manuals pre-cached."

**Marina Manager:** "And the search needs to understand urgency:"

```javascript
// User searches: "bilge alarm"
// System should prioritize:
{
  "results": [
    {
      "title": "Emergency: Bilge Alarm Troubleshooting",
      "priority": "critical",
      "quickFix": "Check bilge pump circuit breaker (panel C, position 12)"
    },
    // Then detailed manual sections
  ]
}
```

**Sailing Instructor:** "Context-aware search. If I search 'anchor' while moving at 6 knots, show me 'deploying anchor'. If I'm stationary, show me 'anchor windlass troubleshooting'."

**Boat Manufacturer Rep:** "That's too complex for V1. But bookmarks are essential:"

```javascript
{
  "bookmarks": [
    {
      "pageId": "page_doc123_p45",
      "label": "How to start engine",
      "quickAccess": true
    }
  ]
}
```

---

### CONSENSUS: Boating Schema Additions

```javascript
// Extended Meilisearch document
{
  // ... base fields ...
  
  // Boating-specific
  "documentType": "owner-manual" | "component-manual" | "service-record" | "safety-certificate",
  "component": "engine" | "generator" | "watermaker" | etc,
  "manufacturer": "Volvo Penta",
  "modelNumber": "D4-300",
  "serialNumber": "VP-2024-12345",
  
  // Vessel classification
  "vesselType": "powerboat" | "sailboat" | "catamaran" | "trawler",
  "vesselSize": 49,  // feet
  
  // Emergency priority
  "priority": "critical" | "normal" | "reference",
  
  // Offline support
  "offlineCache": true,  // Should be cached for offline
  
  // Shared components
  "sharedComponentId": "comp_volvo_d4_300",  // Multiple boats reference same manual
  
  // Maintenance tracking
  "lastServiceDate": 1740234567,
  "nextServiceDue": 1750234567,
  "serviceIntervalHours": 500
}
```

---

## PANEL 3: PROPERTY/MARINA VERTICAL
**Duration:** 29 minutes
**Attendees:**
- **Commercial Real Estate Broker** (marinas, boat storage)
- **Marina Operations Manager** (infrastructure docs)
- **Marine Construction Engineer** (dock/pier systems)
- **Property Manager** (waterfront properties)

---

### Round 1: The Marina Documentation Problem

**Marina Operations Manager:** "We have 200 boat slips. Each slip has:"
```
- Electrical hookup (30A or 50A)
- Water connection
- Dock box
- Slip number sign
- WiFi repeater
```

"Every single one has manuals. Electrical panel? Manual. WiFi system? Manual. Dock construction specs? Manual. Fire suppression? Manual. It's the same problem as boat owners, but 100x scale."

**Marine Construction Engineer:** "And here's the thing: marinas have INFRASTRUCTURE documentation:"

```
MARINA INFRASTRUCTURE DOCS:
1. Dock Construction
   - Pile installation specs
   - Decking materials
   - Load capacity per slip
   - Seismic/storm ratings

2. Utilities
   - Electrical distribution (main panels, pedestals)
   - Water supply (pressure, filtration)
   - Sewage pump-out system
   - Fuel dock system (storage, pumps, leak detection)

3. Safety Systems
   - Fire suppression
   - Security cameras
   - Lighting
   - Emergency call boxes

4. Buildings
   - Clubhouse HVAC
   - Restroom/shower facilities
   - Ship store
   - Restaurant/bar equipment

5. Compliance
   - Environmental permits
   - Coast Guard inspections
   - ADA compliance docs
   - Insurance certificates
```

**Commercial Real Estate Broker:** "When I'm listing a marina for sale, buyers want to see ALL of this. Organized. Current. Not 'somewhere in the harbormaster's office filing cabinet'."

**Property Manager:** "Same with waterfront condos. Each unit might have a boat slip. HOA needs to track:"
```javascript
{
  "propertyType": "waterfront-condo",
  "unit": "Building A, Unit 305",
  "assignedSlip": "A-42",
  "slipDocuments": [
    "electrical-inspection-2024.pdf",
    "slip-assignment-agreement.pdf",
    "dock-insurance-policy.pdf"
  ],
  "buildingDocuments": [
    "hvac-system-manual.pdf",
    "elevator-maintenance-log.pdf",
    "fire-system-inspection.pdf"
  ]
}
```

---

### Round 2: Multi-Entity Hierarchy

**Marina Operations Manager:** "Here's where it gets complex. Our marina is owned by XYZ Corp. XYZ Corp owns 5 marinas. Each marina has different systems:"

```
XYZ Corporation
├── Marina A (San Diego)
│   ├── Dock 1 (slips 1-40)
│   ├── Dock 2 (slips 41-80)
│   ├── Fuel Dock
│   ├── Clubhouse
│   └── Boatyard (repairs)
├── Marina B (Newport Beach)
│   └── ...
└── Marina C (Long Beach)
    └── ...
```

**Commercial Real Estate Broker:** "And when they sell Marina A, the new owner needs ALL documentation for ONLY Marina A. Not the whole corporation."

**Property Manager:** "This is a permission nightmare. Who can see what?"

```javascript
// User roles
{
  "userId": "john_marina_manager",
  "role": "marina-manager",
  "scope": {
    "organization": "xyz-corp",
    "marinas": ["marina-a"],  // Can only see Marina A docs
    "permissions": ["read", "write", "share"]
  }
}

{
  "userId": "corporate_admin",
  "role": "org-admin",
  "scope": {
    "organization": "xyz-corp",
    "marinas": ["marina-a", "marina-b", "marina-c"],  // All marinas
    "permissions": ["read", "write", "share", "delete", "admin"]
  }
}
```

---

### Round 3: Property Schema

**Marine Construction Engineer:** "The schema needs to support hierarchy:"

```javascript
// Meilisearch document for property/marina
{
  "id": "doc_marina_a_dock1_electrical",
  
  // Hierarchy
  "organizationId": "xyz-corp",
  "propertyId": "marina-a",
  "facilityId": "dock-1",
  "componentId": "electrical-panel-3",
  
  // Document details
  "documentType": "infrastructure-manual",
  "title": "Dock 1 Electrical Panel #3 - Installation Manual",
  "system": "electrical",
  "category": "infrastructure",
  
  // Access control (filterable)
  "visibility": "marina-a",  // Only visible to marina-a users
  
  // Compliance tracking
  "complianceType": "electrical-inspection",
  "inspectionDate": 1740234567,
  "nextInspectionDue": 1771770567,
  "inspector": "ABC Electrical Services",
  "status": "compliant",
  
  // Physical location
  "location": {
    "building": "Dock 1",
    "floor": null,
    "room": null,
    "gps": {
      "lat": 32.7157,
      "lon": -117.1611
    }
  }
}
```

**Property Manager:** "And search needs geo-filtering:"

```javascript
// Search: "fire extinguisher inspection reports near slip B-23"
{
  "q": "fire extinguisher inspection",
  "filter": "propertyId = 'marina-b' AND location.building = 'Dock B'",
  "sort": ["location.gps:asc(32.7157,-117.1611)"]  // Nearest first
}
```

---

### CONSENSUS: Property/Marina Schema

```javascript
// Extended for property management
{
  // ... base fields ...
  
  // Multi-entity hierarchy
  "organizationId": "xyz-corp",
  "propertyId": "marina-a",
  "facilityId": "dock-1",
  "unitId": "slip-42",  // For condo units or boat slips
  
  // Property-specific
  "propertyType": "marina" | "waterfront-condo" | "yacht-club" | "boat-storage",
  "facilityType": "dock" | "building" | "parking" | "storage",
  
  // Compliance
  "complianceType": "electrical-inspection" | "fire-safety" | "ada-compliance",
  "inspectionDate": 1740234567,
  "nextInspectionDue": 1771770567,
  "inspectorName": "ABC Services",
  "certificateNumber": "CERT-2024-12345",
  "status": "compliant" | "pending" | "failed",
  
  // Location
  "location": {
    "building": "Dock 1",
    "floor": 2,
    "room": "Electrical Room",
    "gps": { "lat": 32.7157, "lon": -117.1611 }
  },
  
  // Access control
  "visibility": ["marina-a", "org-admin"],  // Who can see this doc
  
  // Asset tracking
  "assetTag": "ELEC-PANEL-D1-03",
  "purchaseDate": 1640234567,
  "warrantyExpires": 1771770567,
  "vendor": "Siemens"
}
```

---

## PANEL 4: CROSS-VERTICAL PATTERN ANALYSIS
**Duration:** 22 minutes
**Attendees:** All previous panelists

---

### The Pattern Emerges

**Database Architect:** "Looking at all three verticals - boat owners, marinas, and property management - there's a clear pattern:"

```
HIERARCHY PATTERN:
- Organization (company, HOA, family)
  └── Properties (boats, marinas, condos)
      └── Facilities (systems, docks, units)
          └── Components (engine, electrical panel, appliances)
              └── Documents (manuals, service records, inspections)
```

**Search Engineer:** "And every vertical needs the SAME core features:"
- Full-text search with synonyms
- Filterable by hierarchy
- Sortable by date/priority
- Offline capability
- Multi-tenant permissions
- Compliance tracking

**Backend Lead:** "So we build ONE platform with vertical-specific views:"

```javascript
// Core schema (all verticals)
{
  "id": "doc_unique_id",
  
  // Hierarchy (flexible for all verticals)
  "organizationId": "org_123",
  "entityId": "entity_456",  // boat, marina, condo
  "subEntityId": "sub_789",  // system, dock, unit
  "componentId": "comp_012",  // engine, panel, appliance
  
  // Document metadata
  "documentType": "manual" | "service-record" | "inspection" | "certificate",
  "title": "...",
  "text": "...",
  
  // Classification
  "categories": ["maintenance", "safety", "compliance"],
  "systems": ["electrical", "plumbing", "hvac"],
  "tags": ["bilge", "pump", "troubleshooting"],
  
  // Vertical-specific (optional fields)
  "vertical": "boating" | "marina" | "property",
  "boatingMetadata": { /* boat-specific */ },
  "marinaMetadata": { /* marina-specific */ },
  "propertyMetadata": { /* property-specific */ },
  
  // Access control
  "visibility": ["user_123", "org_admin"],
  "permissions": {
    "read": ["user_123", "user_456"],
    "write": ["user_123"],
    "share": ["user_123"]
  },
  
  // Compliance (universal)
  "complianceType": "...",
  "inspectionDate": 1740234567,
  "nextDue": 1771770567,
  "status": "compliant",
  
  // Timestamps
  "createdAt": 1740234567,
  "updatedAt": 1740234567
}
```

**Marina Operations Manager:** "Wait, this is genius. I could manage my marina docs AND my personal boat in the same app?"

**All:** "Yes."

---

### FINAL UNIFIED SCHEMA (All Verticals)

**Database Architect:** "SQLite schema - final version:"

```sql
-- Organizations (companies, families, HOAs)
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,  -- personal, commercial, hoa
  created_at INTEGER NOT NULL
);

-- Entities (boats, marinas, condos)
CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- boat, marina, condo, storage-facility
  metadata TEXT,  -- JSON: boat specs, marina details, condo info
  created_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Sub-entities (systems, docks, units)
CREATE TABLE sub_entities (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,  -- system, dock, unit, facility
  metadata TEXT,  -- JSON
  created_at INTEGER NOT NULL,
  FOREIGN KEY (entity_id) REFERENCES entities(id)
);

-- Components (engines, panels, appliances)
CREATE TABLE components (
  id TEXT PRIMARY KEY,
  sub_entity_id TEXT,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model_number TEXT,
  serial_number TEXT,
  metadata TEXT,  -- JSON
  created_at INTEGER NOT NULL,
  FOREIGN KEY (sub_entity_id) REFERENCES sub_entities(id)
);

-- Documents (universal)
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  entity_id TEXT,
  sub_entity_id TEXT,
  component_id TEXT,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  metadata TEXT,  -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (entity_id) REFERENCES entities(id),
  FOREIGN KEY (sub_entity_id) REFERENCES sub_entities(id),
  FOREIGN KEY (component_id) REFERENCES components(id)
);

-- Users and permissions
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE user_organizations (
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',  -- admin, manager, member, viewer
  PRIMARY KEY (user_id, organization_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL,  -- document, entity, organization
  resource_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL,  -- read, write, share, delete
  granted_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Search Engineer:** "Meilisearch schema - final version:"

```javascript
// Index: documents-unified
{
  // Core identity
  "id": "doc_unique_id",
  "vertical": "boating" | "marina" | "property",
  
  // Hierarchy
  "organizationId": "org_123",
  "organizationName": "XYZ Corp",
  "entityId": "entity_456",
  "entityName": "Sea Breeze / Marina A / Condo Building 3",
  "entityType": "boat" | "marina" | "condo",
  "subEntityId": "sub_789",
  "subEntityName": "Engine / Dock 1 / Unit 305",
  "componentId": "comp_012",
  "componentName": "Volvo D4 / Electrical Panel 3 / Water Heater",
  
  // Document details
  "documentType": "manual" | "service-record" | "inspection" | "certificate",
  "title": "...",
  "pageNumber": 7,
  "text": "Full OCR text...",
  
  // Classification (arrays)
  "systems": ["electrical", "navigation"],
  "categories": ["maintenance", "safety"],
  "tags": ["bilge", "pump", "troubleshooting"],
  
  // Vertical-specific metadata (denormalized for filters)
  // BOATING
  "boatMake": "Prestige",
  "boatModel": "F4.9",
  "boatYear": 2024,
  "vesselType": "powerboat",
  
  // MARINA
  "facilityType": "dock",
  "slipNumber": "A-42",
  
  // PROPERTY
  "buildingName": "Building A",
  "unitNumber": "305",
  
  // Component details
  "manufacturer": "Volvo Penta",
  "modelNumber": "D4-300",
  "serialNumber": "VP-2024-12345",
  
  // Compliance
  "complianceType": "electrical-inspection",
  "inspectionDate": 1740234567,
  "nextDue": 1771770567,
  "status": "compliant",
  
  // Access control (filterable)
  "userId": "user_123",  // Owner/creator
  "visibilityUsers": ["user_123", "user_456"],  // Who can see this
  "organizationVisibility": true,  // All org members can see
  
  // Priority
  "priority": "critical" | "normal" | "reference",
  "offlineCache": true,
  
  // Location (for marinas/properties)
  "location": {
    "building": "Dock 1",
    "gps": { "lat": 32.7157, "lon": -117.1611 }
  },
  
  // Timestamps
  "createdAt": 1740234567,
  "updatedAt": 1740234567,
  
  // Future: embeddings
  "embedding": null
}

// Meilisearch Settings
{
  "searchableAttributes": [
    "title",
    "text",
    "systems",
    "categories",
    "tags",
    "entityName",
    "componentName",
    "manufacturer",
    "modelNumber"
  ],
  "filterableAttributes": [
    "vertical",
    "organizationId",
    "entityId",
    "entityType",
    "userId",
    "visibilityUsers",
    "documentType",
    "systems",
    "categories",
    "boatMake",
    "boatModel",
    "boatYear",
    "vesselType",
    "status",
    "priority",
    "complianceType"
  ],
  "sortableAttributes": [
    "createdAt",
    "updatedAt",
    "pageNumber",
    "inspectionDate",
    "nextDue"
  ],
  "synonyms": {
    // Boating terms
    "bilge": ["sump", "drain", "bilge pump"],
    "head": ["toilet", "marine toilet", "WC"],
    // More...
  },
  "rankingRules": [
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness"
  ]
}
```

---

## FINAL RECOMMENDATIONS

**All Panelists Agree:**

1. **Start with Boating Vertical** - Simpler, fewer compliance requirements
2. **Design for Multi-Vertical** - Schema supports expansion to marinas/properties later
3. **Offline-First** - PWA with service worker, cache critical manuals
4. **Search-First Architecture** - Meilisearch is primary query interface, SQLite is durable storage
5. **Permissions from Day 1** - User-level access control, org-level coming in v1.1
6. **Synonyms Matter** - Boat terminology is non-obvious, configure synonyms upfront
7. **Component Library** - Shared manuals for common components (Volvo engines, Webasto heaters)
8. **Migration Path** - Schema supports SQLite → Postgres, keyword → semantic search, single-tenant → multi-tenant

**Success Metrics:**
- Search latency < 100ms
- Offline mode works without internet
- Synonyms return relevant results ("bilge" finds "sump pump")
- Multi-boat support (one user, multiple boats)
- Manual upload → searchable in < 5 minutes

---

**Next:** Extract lilian1 clean code, build NaviDocs with this schema.

