# NaviDocs Search UX Specification
**Agent:** S2-H07 | **Domain:** Impeccable Search UX Design (CRITICAL) | **Date:** 2025-11-13

---

## Executive Summary

This specification defines the search UX architecture for NaviDocs, focusing on **impeccable user experience** through grid-based card layouts, faceted search, mobile-first design, and voice search integration. The design avoids long lists by using a **Pinterest-style grid layout** with infinite scroll and intelligent faceting.

### Key Principles
- **Grid-First:** Card-based layouts replace long scrolling lists
- **Mobile-Native:** Touch-friendly interface with horizontal filter scrolling
- **Smart Filtering:** Faceted search with quick filters for common queries
- **Voice-Ready:** Speech-to-text integration for hands-free search
- **Performance:** Sub-200ms search latency with real-time index updates

---

## 1. Meilisearch Index Configuration

### 1.1 Multi-Index Strategy

NaviDocs implements **5 specialized indexes** for optimal performance and faceting:

```json
{
  "indexes": [
    {
      "name": "navidocs-documents",
      "description": "Manuals, service records, inspections, certificates",
      "primaryKey": "id",
      "type": "documents"
    },
    {
      "name": "navidocs-inventory",
      "description": "Boat systems, engines, equipment, components",
      "primaryKey": "id",
      "type": "inventory"
    },
    {
      "name": "navidocs-maintenance",
      "description": "Service logs, repairs, maintenance history",
      "primaryKey": "id",
      "type": "maintenance"
    },
    {
      "name": "navidocs-expenses",
      "description": "Costs, invoices, reimbursements, budgets",
      "primaryKey": "id",
      "type": "expenses"
    },
    {
      "name": "navidocs-contacts",
      "description": "Service providers, vendors, crew, technicians",
      "primaryKey": "id",
      "type": "contacts"
    }
  ]
}
```

### 1.2 Document Index Configuration

**Index Name:** `navidocs-documents`

#### Searchable Attributes
```json
{
  "searchableAttributes": [
    "title",
    "text",
    "entityName",
    "boatName",
    "manufacturer",
    "modelNumber",
    "systems",
    "categories",
    "tags",
    "documentType",
    "componentName"
  ]
}
```

#### Filterable Attributes (Facets)
```json
{
  "filterableAttributes": [
    "vertical",
    "documentType",
    "documentCategory",
    "systems",
    "categories",
    "tags",
    "entityId",
    "entityName",
    "entityType",
    "boatMake",
    "boatModel",
    "boatYear",
    "vesselType",
    "manufacturer",
    "language",
    "priority",
    "status",
    "complianceType",
    "organizationId",
    "createdAt",
    "updatedAt",
    "ocrConfidence"
  ]
}
```

#### Sortable Attributes
```json
{
  "sortableAttributes": [
    "createdAt",
    "updatedAt",
    "pageNumber",
    "year",
    "ocrConfidence",
    "title",
    "documentType"
  ]
}
```

#### Faceting Configuration
```json
{
  "faceting": {
    "maxValuesPerFacet": 100
  },
  "facetedAttributes": {
    "documentType": {
      "values": [
        { "value": "manual", "label": "Owner's Manual", "icon": "📖" },
        { "value": "service-record", "label": "Service Record", "icon": "🔧" },
        { "value": "inspection", "label": "Inspection Report", "icon": "✅" },
        { "value": "certificate", "label": "Certificate", "icon": "📋" },
        { "value": "receipt", "label": "Receipt", "icon": "🧾" },
        { "value": "warranty", "label": "Warranty", "icon": "⭐" }
      ]
    },
    "systems": {
      "values": [
        "electrical", "plumbing", "engine", "navigation",
        "hvac", "marine-sanitation", "propulsion", "structural"
      ]
    },
    "categories": {
      "values": [
        "maintenance", "troubleshooting", "installation", "safety",
        "operation", "emergency", "compliance", "reference"
      ]
    },
    "priority": {
      "values": ["critical", "high", "normal", "reference"]
    },
    "language": {
      "values": ["en", "fr", "es", "de", "it", "pt"]
    }
  }
}
```

### 1.3 Inventory Index Configuration

**Index Name:** `navidocs-inventory`

#### Searchable Attributes
```json
{
  "searchableAttributes": [
    "componentName",
    "manufacturer",
    "modelNumber",
    "serialNumber",
    "systemName",
    "zoneName",
    "description",
    "boatName",
    "tags"
  ]
}
```

#### Filterable Attributes
```json
{
  "filterableAttributes": [
    "categoryId",
    "categoryName",
    "zoneId",
    "zoneName",
    "systemId",
    "systemName",
    "manufacturer",
    "warrantyStatus",
    "valueRange",
    "acquiredYear",
    "lastServiceDate",
    "nextServiceDate",
    "condition",
    "entityId",
    "organizationId",
    "status"
  ]
}
```

#### Sortable Attributes
```json
{
  "sortableAttributes": [
    "value",
    "acquiredYear",
    "lastServiceDate",
    "nextServiceDate",
    "createdAt",
    "updatedAt",
    "componentName"
  ]
}
```

#### Faceting for Inventory
```json
{
  "facetedAttributes": {
    "categoryName": {
      "values": [
        "Engines & Motors", "Navigation Systems", "Safety Equipment",
        "Plumbing", "Electrical", "Deck Equipment", "Interior",
        "HVAC", "Communication", "Entertainment", "Other"
      ]
    },
    "warrantyStatus": {
      "values": [
        { "value": "active", "label": "Active Warranty" },
        { "value": "expired", "label": "Warranty Expired" },
        { "value": "no-warranty", "label": "No Warranty" },
        { "value": "transferable", "label": "Transferable" }
      ]
    },
    "zoneName": {
      "dynamic": true,
      "description": "Dynamically loaded by vessel"
    },
    "valueRange": {
      "ranges": [
        { "min": 0, "max": 500, "label": "Under $500" },
        { "min": 500, "max": 2000, "label": "$500 - $2,000" },
        { "min": 2000, "max": 5000, "label": "$2,000 - $5,000" },
        { "min": 5000, "max": 10000, "label": "$5,000 - $10,000" },
        { "min": 10000, "max": null, "label": "Over $10,000" }
      ]
    }
  }
}
```

### 1.4 Maintenance Index Configuration

**Index Name:** `navidocs-maintenance`

#### Searchable Attributes
```json
{
  "searchableAttributes": [
    "serviceName",
    "description",
    "componentName",
    "providerName",
    "notes",
    "systemName",
    "location"
  ]
}
```

#### Filterable Attributes
```json
{
  "filterableAttributes": [
    "serviceType",
    "serviceCategory",
    "componentId",
    "componentName",
    "systemId",
    "systemName",
    "providerId",
    "providerName",
    "providerType",
    "status",
    "serviceDate",
    "nextDueDate",
    "costRange",
    "entityId",
    "organizationId",
    "createdAt",
    "updatedAt"
  ]
}
```

#### Sortable Attributes
```json
{
  "sortableAttributes": [
    "serviceDate",
    "nextDueDate",
    "cost",
    "createdAt",
    "updatedAt",
    "serviceName"
  ]
}
```

#### Faceting for Maintenance
```json
{
  "facetedAttributes": {
    "serviceType": {
      "values": [
        "annual-survey", "haulout", "engine-service", "seasonal-prep",
        "repair", "preventive-maintenance", "inspection", "certification"
      ]
    },
    "serviceCategory": {
      "values": [
        "Engine & Propulsion", "Hull & Structure", "Electrical",
        "Plumbing & Sanitation", "Navigation", "Safety Equipment",
        "Rigging & Sails", "Interior Systems", "Documentation"
      ]
    },
    "status": {
      "values": [
        { "value": "completed", "label": "Completed", "color": "green" },
        { "value": "in-progress", "label": "In Progress", "color": "blue" },
        { "value": "pending", "label": "Pending", "color": "yellow" },
        { "value": "overdue", "label": "Overdue", "color": "red" }
      ]
    },
    "costRange": {
      "ranges": [
        { "min": 0, "max": 100, "label": "Under $100" },
        { "min": 100, "max": 500, "label": "$100 - $500" },
        { "min": 500, "max": 1000, "label": "$500 - $1,000" },
        { "min": 1000, "max": 5000, "label": "$1,000 - $5,000" },
        { "min": 5000, "max": null, "label": "Over $5,000" }
      ]
    }
  }
}
```

### 1.5 Expenses Index Configuration

**Index Name:** `navidocs-expenses`

#### Searchable Attributes
```json
{
  "searchableAttributes": [
    "expenseName",
    "description",
    "vendorName",
    "invoiceNumber",
    "notes",
    "categoryName"
  ]
}
```

#### Filterable Attributes
```json
{
  "filterableAttributes": [
    "categoryId",
    "categoryName",
    "vendorId",
    "vendorName",
    "amountRange",
    "paymentStatus",
    "reimbursementStatus",
    "expenseDate",
    "entityId",
    "organizationId",
    "createdAt",
    "updatedAt",
    "tax",
    "billable"
  ]
}
```

#### Sortable Attributes
```json
{
  "sortableAttributes": [
    "amount",
    "expenseDate",
    "createdAt",
    "updatedAt",
    "expenseName"
  ]
}
```

#### Faceting for Expenses
```json
{
  "facetedAttributes": {
    "categoryName": {
      "values": [
        "Dockage & Marina Fees", "Fuel", "Maintenance & Repairs",
        "Insurance", "Registration & Permits", "Crew", "Provisions",
        "Mooring & Anchoring", "Miscellaneous", "Parts & Supplies"
      ]
    },
    "paymentStatus": {
      "values": [
        { "value": "paid", "label": "Paid", "color": "green" },
        { "value": "pending", "label": "Pending", "color": "yellow" },
        { "value": "overdue", "label": "Overdue", "color": "red" }
      ]
    },
    "reimbursementStatus": {
      "values": [
        { "value": "reimbursed", "label": "Reimbursed", "color": "green" },
        { "value": "pending", "label": "Pending Reimbursement", "color": "blue" },
        { "value": "not-billable", "label": "Not Billable", "color": "gray" }
      ]
    },
    "amountRange": {
      "ranges": [
        { "min": 0, "max": 100, "label": "Under $100" },
        { "min": 100, "max": 500, "label": "$100 - $500" },
        { "min": 500, "max": 1000, "label": "$500 - $1,000" },
        { "min": 1000, "max": 5000, "label": "$1,000 - $5,000" },
        { "min": 5000, "max": null, "label": "Over $5,000" }
      ]
    }
  }
}
```

### 1.6 Contacts Index Configuration

**Index Name:** `navidocs-contacts`

#### Searchable Attributes
```json
{
  "searchableAttributes": [
    "name",
    "company",
    "email",
    "phone",
    "specialties",
    "location",
    "notes"
  ]
}
```

#### Filterable Attributes
```json
{
  "filterableAttributes": [
    "contactType",
    "specialties",
    "location",
    "rating",
    "entityId",
    "organizationId",
    "createdAt",
    "updatedAt",
    "verified",
    "preferred"
  ]
}
```

#### Faceting for Contacts
```json
{
  "facetedAttributes": {
    "contactType": {
      "values": [
        "Service Provider", "Vendor", "Supplier", "Technician",
        "Captain", "Crew", "Broker", "Insurance Agent", "Other"
      ]
    },
    "specialties": {
      "dynamic": true,
      "examples": [
        "Engine Service", "Hull Repair", "Electrical", "Navigation",
        "Provisioning", "Haul Out", "Certification"
      ]
    },
    "rating": {
      "values": [
        { "value": "5", "label": "⭐⭐⭐⭐⭐ (5 Stars)" },
        { "value": "4", "label": "⭐⭐⭐⭐ (4 Stars)" },
        { "value": "3", "label": "⭐⭐⭐ (3 Stars)" },
        { "value": "2", "label": "⭐⭐ (2 Stars)" },
        { "value": "1", "label": "⭐ (1 Star)" }
      ]
    }
  }
}
```

---

## 2. Search API Design

### 2.1 REST API Endpoints

#### POST `/api/search/unified`
**Multi-index unified search across all NaviDocs data**

```javascript
Request {
  "q": "tender warranty",
  "indexes": ["navidocs-documents", "navidocs-inventory"],
  "facets": ["documentType", "systems", "warrantyStatus"],
  "filters": {
    "vertical": "boating",
    "entityId": "boat_prestige_f49_001",
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-12-31"
    }
  },
  "sort": ["-createdAt"],
  "limit": 24,
  "offset": 0,
  "showFacetCounts": true
}

Response {
  "results": [
    {
      "index": "navidocs-documents",
      "hits": [{...}, {...}],
      "estimatedTotalHits": 42,
      "facets": {
        "documentType": {
          "manual": 15,
          "warranty": 27
        },
        "systems": {
          "electrical": 8,
          "plumbing": 12
        }
      }
    },
    {
      "index": "navidocs-inventory",
      "hits": [{...}],
      "estimatedTotalHits": 8,
      "facets": {
        "warrantyStatus": {
          "active": 5,
          "expired": 3
        }
      }
    }
  ],
  "totalProcessingMs": 142,
  "userTime": "2025-11-13T10:30:00Z"
}
```

#### POST `/api/search/index/{indexName}`
**Single index search with full faceting**

```javascript
Request {
  "q": "engine service",
  "facets": "*",
  "filters": {
    "serviceStatus": "completed",
    "serviceDate": {
      "from": 1730000000,
      "to": 1735000000
    }
  },
  "limit": 24,
  "offset": 0
}

Response {
  "hits": [...],
  "estimatedTotalHits": 156,
  "processingTimeMs": 89,
  "facets": {
    "serviceType": [
      { "value": "annual-survey", "count": 42 },
      { "value": "engine-service", "count": 38 },
      { "value": "repair", "count": 28 }
    ],
    "serviceCategory": [
      { "value": "Engine & Propulsion", "count": 45 },
      { "value": "Electrical", "count": 20 }
    ],
    "status": [
      { "value": "completed", "count": 112 },
      { "value": "pending", "count": 44 }
    ],
    "costRange": [
      { "range": "$100-$500", "count": 68 },
      { "range": "$500-$1000", "count": 55 }
    ]
  }
}
```

#### GET `/api/search/suggestions/{indexName}`
**Autocomplete suggestions and recent searches**

```javascript
Request: GET /api/search/suggestions/navidocs-documents?q=tend&limit=10

Response {
  "suggestions": [
    { "text": "tender warranty", "frequency": 45, "type": "search" },
    { "text": "tender care", "frequency": 12, "type": "search" },
    { "text": "tenderness", "frequency": 3, "type": "typo_correction" }
  ],
  "recentSearches": [
    "engine service",
    "warranty documents",
    "maintenance schedule"
  ]
}
```

#### POST `/api/search/voice`
**Voice search with speech-to-text conversion**

```javascript
Request {
  "audio": "base64-encoded audio data or blob",
  "audioFormat": "wav|mp3|webm",
  "language": "en-US",
  "indexes": ["navidocs-documents", "navidocs-inventory"]
}

Response {
  "transcription": "Show me tender warranty",
  "confidence": 0.94,
  "searchResults": {
    // Same as unified search response
  }
}
```

#### GET `/api/search/facet-values/{indexName}/{facetName}`
**Dynamic facet value loading**

```javascript
Request: GET /api/search/facet-values/navidocs-inventory/zoneName?entityId=boat_123

Response {
  "facetName": "zoneName",
  "values": [
    { "value": "engine-room", "label": "Engine Room", "count": 42 },
    { "value": "galley", "label": "Galley", "count": 28 },
    { "value": "cabin", "label": "Master Cabin", "count": 15 }
  ]
}
```

### 2.2 WebSocket Connection for Real-Time Updates

```javascript
// Connect to /api/search/socket
ws.send({
  "action": "subscribe",
  "index": "navidocs-documents",
  "query": "warranty",
  "filters": { "documentType": "warranty" }
});

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "new-document") {
    // New warranty document indexed in real-time
    updateSearchResults(message.document);
  }
};
```

---

## 3. Mobile-First UI Wireframes

### 3.1 Search Page Layout (Mobile - 375px width)

```
┌─────────────────────────────────────┐
│ NaviDocs                      ≡ Menu│  Header
├─────────────────────────────────────┤
│ [🎤 Speak or type...           🔍]  │  Search Bar with Voice
├─────────────────────────────────────┤
│ ◄ Category  Warranty  Date ► [+More]│  Horizontal Facet Scroll
├─────────────────────────────────────┤
│ Quick Filters (Chips):              │
│ [⏰ Recent]  [💎 High Value]        │
│ [⚠️ Expiring]  [❌ Overdue]          │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📖 Owner's Manual               │ │
│ │ Webasto Water Heater           │ │
│ │ "Maintenance"  2024-11-10      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔧 Service Record              │ │  Card Grid
│ │ Annual Engine Service          │ │  (Infinite Scroll)
│ │ $450  Completed  2024-11-05    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⭐ Warranty Document            │ │
│ │ Tender Engine Warranty         │ │
│ │ Active  Expires 2026-01-01     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Loading more...]                   │
└─────────────────────────────────────┘
```

### 3.2 Facet Sidebar (Swipe-In Modal - Mobile)

```
┌──────────────────────────────────────┐
│ ✕ Filters              [Apply/Reset] │  Facet Header
├──────────────────────────────────────┤
│                                      │
│ Document Type                        │
│ ☐ Owner's Manual (45)               │
│ ☑ Service Record (28)               │  Facet Group
│ ☐ Warranty (12)                     │
│ ☐ Inspection (8)                    │
│                                      │
├──────────────────────────────────────┤
│                                      │
│ Date Range                           │
│ [From: 2024-01-01] [To: 2024-12-31] │
│                                      │  Date Filter
│ ☐ Last 30 Days                      │
│ ☐ Last Quarter                      │
│ ☑ This Year                         │
│                                      │
├──────────────────────────────────────┤
│                                      │
│ Status                               │
│ ☐ Completed (145)                   │
│ ☑ Pending (23)                      │  Status Filter
│ ☑ Overdue (5)                       │
│                                      │
└──────────────────────────────────────┘
```

### 3.3 Desktop Layout (1440px width)

```
┌────────────────────────────────────────────────────────────────────┐
│ NaviDocs                                                      Menu ≡ │
├────────────────────────────────────────────────────────────────────┤
│ [🎤 Search or speak...                              🔍]          │ Search
├────────────────────────────────────────────────────────────────────┤
│  Category ▼  Warranty ▼  Date ▼  Status ▼  [+Advanced Filters]    │ Filters
├────────────┬────────────────────────────────────────────────────────┤
│            │                                                        │
│ FACETS     │ Quick Filters:                                         │
│            │ [⏰ Recent] [💎 High Value] [⚠️ Expiring] [❌ Overdue] │
│ • Document │                                                        │
│   Type     │ ┌──────────────────────┬──────────────────────┐       │
│   - Manual │ │ 📖 Owner's Manual    │ 🔧 Service Record   │       │
│   - Service│ │ Webasto Water        │ Annual Engine       │       │
│   - Warr..│ │ Heater Maintenance   │ Service             │       │
│            │ │ Sys: Plumbing        │ $450  Nov 5, 2024   │       │
│ • Status   │ │ 2024-11-10           │ Completed           │       │
│   - Compl. │ └──────────────────────┴──────────────────────┘       │
│   - Pend.  │                                                        │  Grid Layout
│   - Overdu│ ┌──────────────────────┬──────────────────────┐       │
│            │ │ ⭐ Warranty         │ 💰 Expense Record   │       │
│ • Cost     │ │ Tender Engine       │ Dockage Fee         │       │
│   - <$100  │ │ Warranty Active     │ $150.00             │       │
│   - $100-50│ │ Expires 2026-01-01  │ Pending Payment     │       │
│   - $500+  │ │                     │ 2024-11-12          │       │
│            │ └──────────────────────┴──────────────────────┘       │
│ • Systems  │                                                        │
│   - Engine │ [Load More...] or [Infinite Scroll enabled]           │
│   - Elec.  │                                                        │
│   - Plumb. │                                                        │
└────────────┴────────────────────────────────────────────────────────┘
```

### 3.4 Search Result Card Templates

#### Document Card
```
┌────────────────────────────┐
│ 📖 [Document Type Icon]    │
│                            │
│ Title: "Engine Service"    │  Thumbnail/Icon
│ Date: Nov 5, 2024          │  (12% of width)
│                            │
│ Entity: Sea Breeze         │
│ System: Propulsion         │
│ Pages: 1-5 of 42           │
│                            │
│ Priority: 🔴 Critical      │  Metadata
│ Languages: EN, FR          │
│                            │
│ [View] [Download] [Share]  │  Actions
└────────────────────────────┘
```

#### Inventory Card
```
┌────────────────────────────┐
│ ⚙️ Component                │
│                            │
│ Webasto FCF Platinum       │
│ Model: WB-2024-12345       │  Name & Model
│                            │
│ Category: Engines & Motors │
│ Zone: Engine Room          │
│                            │
│ Value: $3,500              │
│ Warranty: Active (exp. 26) │  Key Metadata
│ Installed: 2024            │
│                            │
│ [View Details] [Service]   │  Actions
└────────────────────────────┘
```

#### Maintenance Card
```
┌────────────────────────────┐
│ 🔧 Service Record          │
│                            │
│ Annual Engine Service      │
│ Component: Yanmar Engine   │
│ Date: Nov 5, 2024          │
│                            │
│ Provider: Marina Mechanics │
│ Cost: $450.00              │  Service Details
│ Status: ✅ Completed       │
│                            │
│ Next Due: Nov 5, 2025      │
│ Hours: 1,250               │
│                            │
│ [View] [Receipt] [Schedule]│  Actions
└────────────────────────────┘
```

#### Expense Card
```
┌────────────────────────────┐
│ 💰 Expense                 │
│                            │
│ Dockage & Mooring          │
│ Amount: $250.00            │
│ Date: Nov 10, 2024         │
│                            │
│ Vendor: Marina Services    │
│ Category: Dockage Fees     │  Expense Info
│ Payment: 🟡 Pending        │
│ Reimbursable: Yes          │
│                            │
│ Invoice: #MS-2024-11-0234  │
│                            │
│ [View] [Pay] [Reimburse]   │  Actions
└────────────────────────────┘
```

#### Contact Card
```
┌────────────────────────────┐
│ 👤 Contact                 │
│                            │
│ John Smith                 │
│ Marina Mechanics           │
│ Engine Service Specialist  │
│                            │
│ ⭐⭐⭐⭐⭐ (4.8 / 5)         │
│ Phone: (555) 123-4567      │  Contact Info
│ Email: john@marina.com     │
│ Location: San Diego, CA    │
│                            │
│ [Call] [Email] [Details]   │  Actions
└────────────────────────────┘
```

---

## 4. Voice Search Integration

### 4.1 Speech-to-Text Engine

**Technology Stack:**
- **Web Audio API** for audio capture
- **Web Speech API** for browser-based transcription (fallback)
- **Cloud Provider:** Aggregate Deepgram or Google Cloud Speech-to-Text for accuracy

### 4.2 Voice Search Flow

```
┌─────────────────────────────────────────┐
│  1. User taps 🎤 Voice Search Icon     │
├─────────────────────────────────────────┤
│  2. Browser requests microphone access  │
│     [Allow] [Block]                     │
├─────────────────────────────────────────┤
│  3. Recording state:                    │
│     🎤 Recording... [Press & Hold]      │
│     Waveform visualization              │
├─────────────────────────────────────────┤
│  4. User speaks: "Show me tender        │
│     warranty documents"                 │
├─────────────────────────────────────────┤
│  5. Transcription (client-side):        │
│     "Show me tender warranty documents" │
│     Confidence: 94%                     │
├─────────────────────────────────────────┤
│  6. Auto-execute search query OR        │
│     Show: "Is this correct?"            │
│     [Yes] [Edit] [Try Again]            │
├─────────────────────────────────────────┤
│  7. Display results (same grid layout)  │
└─────────────────────────────────────────┘
```

### 4.3 Voice Search Query Interpretation

**Natural Language → Search Structure**

```javascript
// Examples of voice input → structured search

"Show me tender warranty" →
{
  "indexes": ["navidocs-documents"],
  "q": "tender warranty",
  "filters": { "documentType": "warranty" },
  "sort": ["-createdAt"]
}

"What did I spend on engine maintenance last year" →
{
  "indexes": ["navidocs-expenses", "navidocs-maintenance"],
  "q": "engine",
  "filters": {
    "expenseDate": { "from": "2024-01-01", "to": "2024-12-31" },
    "categoryName": "Engine & Propulsion"
  },
  "facets": ["categoryName", "amountRange"],
  "sort": ["-amount"]
}

"List all pending services in the engine room" →
{
  "indexes": ["navidocs-maintenance"],
  "q": "engine",
  "filters": {
    "status": "pending",
    "serviceCategory": "Engine & Propulsion"
  },
  "facets": ["status", "serviceType"],
  "sort": ["nextDueDate"]
}

"High value items expiring soon" →
{
  "indexes": ["navidocs-inventory"],
  "q": "",
  "filters": {
    "valueRange": { "min": 5000 },
    "warrantyStatus": "active"
  },
  "facets": ["valueRange", "warrantyStatus"],
  "sort": ["nextServiceDate"]
}
```

### 4.4 Voice Commands

**Reserved Voice Commands (Quick Actions)**

```javascript
{
  "commands": [
    {
      "trigger": "recent",
      "action": "search",
      "query": "",
      "filters": { "createdAt": { "from": "30d-ago" } }
    },
    {
      "trigger": "expensive",
      "action": "search",
      "filters": { "valueRange": { "min": 5000 } }
    },
    {
      "trigger": "expiring",
      "action": "search",
      "filters": { "nextDueDate": { "to": "30d-from-now" } }
    },
    {
      "trigger": "urgent",
      "action": "search",
      "filters": { "status": ["pending", "overdue"] }
    },
    {
      "trigger": "all maintenance",
      "action": "switch-index",
      "index": "navidocs-maintenance"
    }
  ]
}
```

---

## 5. Search Facets Specification

### 5.1 Facet Types

#### **Type 1: Categorical Facets** (Fixed value sets)
```javascript
{
  "type": "categorical",
  "name": "documentType",
  "displayName": "Document Type",
  "icon": "📄",
  "multiSelect": true,
  "collapsible": true,
  "values": [
    { "value": "manual", "label": "Owner's Manual", "icon": "📖", "count": 145 },
    { "value": "service-record", "label": "Service Record", "icon": "🔧", "count": 89 },
    { "value": "warranty", "label": "Warranty", "icon": "⭐", "count": 42 }
  ]
}
```

#### **Type 2: Hierarchical Facets** (Parent-child relationships)
```javascript
{
  "type": "hierarchical",
  "name": "systems",
  "displayName": "Systems & Components",
  "icon": "⚙️",
  "multiSelect": true,
  "values": [
    {
      "value": "electrical",
      "label": "Electrical System",
      "count": 234,
      "children": [
        { "value": "generator", "label": "Generator", "count": 45 },
        { "value": "batteries", "label": "Batteries", "count": 67 },
        { "value": "inverter", "label": "Inverter", "count": 23 }
      ]
    },
    {
      "value": "plumbing",
      "label": "Plumbing System",
      "count": 156,
      "children": [
        { "value": "freshwater", "label": "Fresh Water", "count": 78 },
        { "value": "greywater", "label": "Grey Water", "count": 45 }
      ]
    }
  ]
}
```

#### **Type 3: Range Facets** (Numeric or date ranges)
```javascript
{
  "type": "range",
  "name": "valueRange",
  "displayName": "Item Value",
  "icon": "💰",
  "dataType": "currency",
  "currency": "USD",
  "ranges": [
    { "min": 0, "max": 500, "label": "Under $500", "count": 156 },
    { "min": 500, "max": 2000, "label": "$500 - $2,000", "count": 234 },
    { "min": 2000, "max": 5000, "label": "$2,000 - $5,000", "count": 145 },
    { "min": 5000, "max": 10000, "label": "$5,000 - $10,000", "count": 89 },
    { "min": 10000, "label": "Over $10,000", "count": 42 }
  ],
  "customRangeEnabled": true
}
```

#### **Type 4: Dynamic Facets** (Loaded based on context)
```javascript
{
  "type": "dynamic",
  "name": "zoneName",
  "displayName": "Boat Zone / Area",
  "icon": "🗺️",
  "dependsOn": "entityId",
  "multiSelect": true,
  "loadCallback": "GET /api/search/facet-values/navidocs-inventory/zoneName?entityId={entityId}"
}
```

### 5.2 Quick Filter Chips

**Pre-defined smart filters for common use cases**

```javascript
{
  "quickFilters": [
    {
      "id": "recent",
      "label": "⏰ Recent",
      "description": "Last 7 days",
      "filters": {
        "createdAt": {
          "from": Date.now() - (7 * 24 * 60 * 60 * 1000)
        }
      },
      "applies_to": ["all"]
    },
    {
      "id": "high-value",
      "label": "💎 High Value",
      "description": "Items over $5,000",
      "filters": {
        "valueRange": { "min": 5000 }
      },
      "applies_to": ["navidocs-inventory", "navidocs-expenses"]
    },
    {
      "id": "expiring-warranty",
      "label": "⚠️ Expiring Warranty",
      "description": "Within 90 days",
      "filters": {
        "nextDueDate": {
          "to": Date.now() + (90 * 24 * 60 * 60 * 1000)
        },
        "warrantyStatus": "active"
      },
      "applies_to": ["navidocs-inventory"]
    },
    {
      "id": "overdue",
      "label": "❌ Overdue",
      "description": "Past due date",
      "filters": {
        "status": "overdue",
        "nextDueDate": { "to": Date.now() }
      },
      "applies_to": ["navidocs-maintenance"]
    },
    {
      "id": "pending-reimbursement",
      "label": "💸 Pending Reimbursement",
      "description": "Awaiting reimbursement",
      "filters": {
        "reimbursementStatus": "pending",
        "billable": true
      },
      "applies_to": ["navidocs-expenses"]
    }
  ]
}
```

---

## 6. Performance Specifications

### 6.1 Latency Targets

| Operation | Target | Maximum |
|-----------|--------|---------|
| Search Query Execution | 50ms | 200ms |
| Facet Count Generation | 30ms | 100ms |
| Autocomplete Suggestions | 20ms | 75ms |
| Voice Transcription | 500ms | 2000ms |
| Index Document Update | Real-time | 5s |
| Grid Rendering (24 cards) | 60fps | 100ms |
| Infinite Scroll Load | 100ms | 300ms |

### 6.2 Index Performance

```javascript
{
  "indexing": {
    "batchSize": 1000,
    "updateFrequency": "real-time",
    "compression": "enabled",
    "caching": {
      "queryCache": "enabled",
      "ttl": 3600,
      "maxSize": "100MB"
    }
  },
  "monitoring": {
    "queryLatencyP95": "< 150ms",
    "queryLatencyP99": "< 200ms",
    "indexSizeLimit": "500MB per index",
    "storageEfficiency": "> 70%"
  }
}
```

### 6.3 Mobile-Specific Optimizations

```javascript
{
  "mobile": {
    "virtualScrolling": {
      "enabled": true,
      "buffer": 3,
      "description": "Only render visible cards + buffer"
    },
    "lazyLoading": {
      "thumbnails": "enabled",
      "placeholders": "blur-up gradient",
      "format": "webp with jpg fallback"
    },
    "networkOptimization": {
      "compressionFormat": "brotli",
      "requestBatching": "enabled",
      "cacheStrategy": "stale-while-revalidate"
    },
    "memoryManagement": {
      "poolSize": 500,
      "gcInterval": 30000
    }
  }
}
```

---

## 7. Implementation Checklist

### Phase 1: Core Search Infrastructure (Week 1-2)
- [ ] Expand Meilisearch config with 5 specialized indexes
- [ ] Implement unified search API endpoint
- [ ] Create facet configuration system
- [ ] Set up WebSocket for real-time updates
- [ ] Performance testing (target <200ms)

### Phase 2: Frontend UI Components (Week 3-4)
- [ ] Build search bar with voice button
- [ ] Implement card grid layout with infinite scroll
- [ ] Create facet sidebar with horizontal scroll on mobile
- [ ] Design quick filter chips
- [ ] Build autocomplete suggestions

### Phase 3: Voice & Mobile (Week 5)
- [ ] Integrate Web Speech API
- [ ] Implement natural language query parsing
- [ ] Optimize mobile UX (swipeable filters, touch targets)
- [ ] Virtual scroll implementation
- [ ] Mobile performance testing

### Phase 4: Smart Features (Week 6)
- [ ] Build recent search history
- [ ] Implement "Did you mean?" typo correction
- [ ] Add related items suggestions
- [ ] Create saved searches feature
- [ ] User search analytics

### Phase 5: Polish & Optimization (Week 7)
- [ ] A/B test facet ordering
- [ ] Optimize card rendering performance
- [ ] Add search analytics dashboard
- [ ] Create user documentation
- [ ] Performance benchmarking

---

## 8. API Security & Rate Limiting

### 8.1 Tenant Token Security

```javascript
{
  "tenantToken": {
    "maxExpiresIn": 86400,
    "refreshThreshold": 300,
    "filter": "userId = {{userId}} OR organizationId IN {{organizationIds}}",
    "searchRules": {
      "navidocs-documents": {
        "filter": "organizationId IN [{{orgIds}}] AND status != hidden"
      },
      "navidocs-inventory": {
        "filter": "organizationId IN [{{orgIds}}] AND archived = false"
      }
    }
  }
}
```

### 8.2 Rate Limiting

```javascript
{
  "rateLimits": {
    "search_queries": {
      "authenticated": "100 req/min",
      "anonymous": "10 req/min"
    },
    "voice_search": {
      "authenticated": "50 req/hour",
      "anonymous": "5 req/hour"
    },
    "facet_requests": {
      "authenticated": "200 req/min",
      "anonymous": "20 req/min"
    }
  }
}
```

---

## 9. Monitoring & Analytics

### 9.1 Key Metrics

```javascript
{
  "metrics": {
    "search": {
      "queriesPerDay": "count",
      "avgQueryLatency": "ms",
      "p95Latency": "ms",
      "p99Latency": "ms",
      "zeroResults": "count",
      "clickThroughRate": "percent"
    },
    "voice": {
      "voiceQueries": "count",
      "transcriptionAccuracy": "percent",
      "avgTranscriptionTime": "ms"
    },
    "index": {
      "documentsIndexed": "count",
      "indexUpdateLatency": "ms",
      "indexSize": "MB",
      "storageEfficiency": "percent"
    }
  }
}
```

### 9.2 User Analytics

- Track which facets are most-used
- Monitor search query patterns
- Measure time-to-result
- Analyze conversion from search to action
- Track voice search adoption and accuracy

---

## 10. Future Enhancements

### 10.1 AI-Powered Search
- Semantic search using embedding vectors
- Machine learning relevance ranking
- Predictive query suggestions

### 10.2 Advanced Features
- Saved searches with alerts
- Collaborative search history across team
- Search result sharing
- Custom facet creation by users
- Search performance dashboards

### 10.3 Integration Opportunities
- Email digest: "Weekly search insights"
- Calendar integration for service dates
- Slack notifications for new documents
- Mobile app native voice integration
- Wearable device search (Apple Watch, etc.)

---

## Appendix A: Meilisearch Configuration JSON

Complete configuration for copy/paste into `/docs/architecture/meilisearch-config.json`:

```json
{
  "indexes": [
    {
      "name": "navidocs-documents",
      "settings": {
        "searchableAttributes": [
          "title", "text", "entityName", "boatName", "manufacturer",
          "modelNumber", "systems", "categories", "tags", "documentType",
          "componentName"
        ],
        "filterableAttributes": [
          "vertical", "documentType", "documentCategory", "systems",
          "categories", "tags", "entityId", "entityName", "entityType",
          "boatMake", "boatModel", "boatYear", "vesselType", "manufacturer",
          "language", "priority", "status", "complianceType",
          "organizationId", "createdAt", "updatedAt", "ocrConfidence"
        ],
        "sortableAttributes": [
          "createdAt", "updatedAt", "pageNumber", "year", "ocrConfidence",
          "title", "documentType"
        ],
        "faceting": { "maxValuesPerFacet": 100 }
      }
    }
  ]
}
```

---

## Document Control

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Status** | FINAL |
| **Agent** | S2-H07 |
| **Date** | 2025-11-13 |
| **Review Cycle** | Quarterly |
| **Last Updated** | 2025-11-13 |

---

## Sign-Off

**S2-H07 Impeccable Search UX Design Specification COMPLETE**

This specification provides:
- ✅ Grid-based card layout (no long lists)
- ✅ Meilisearch faceted search architecture
- ✅ Mobile-first responsive design
- ✅ Voice search integration
- ✅ Search API design
- ✅ Performance targets (<200ms)
- ✅ Complete faceting system
- ✅ Real-time index updates
- ✅ Security and rate limiting
- ✅ Analytics and monitoring
