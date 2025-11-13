# Inventory Tracking System Design Specification
## Yacht Equipment Inventory Management System

**Agent:** S2-H02
**Domain:** Inventory Tracking System Design (CRITICAL)
**Target Value Recovery:** €15K-€50K forgotten equipment at resale
**Date:** 2025-11-13

---

## 1. Database Schema

### Primary Table: `boat_inventory`

```sql
CREATE TABLE boat_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'tender/zodiac',
    'electronics',
    'engine',
    'deck',
    'interior',
    'safety'
  )),
  zone VARCHAR(50) NOT NULL CHECK (zone IN (
    'salon',
    'galley',
    'helm',
    'engine room',
    'stern storage',
    'flybridge',
    'bow'
  )),
  purchase_date DATE,
  purchase_price DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  receipt_url VARCHAR(500),
  receipt_ocr_data JSONB,
  warranty_expiration DATE,
  warranty_status VARCHAR(20) GENERATED ALWAYS AS (
    CASE
      WHEN warranty_expiration IS NULL THEN 'unknown'
      WHEN warranty_expiration < CURRENT_DATE THEN 'expired'
      WHEN warranty_expiration < CURRENT_DATE + INTERVAL '90 days' THEN 'expiring-soon'
      ELSE 'active'
    END
  ) STORED,
  current_value DECIMAL(12, 2),
  value_depreciation_rate DECIMAL(5, 2) DEFAULT 0.05,
  last_value_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  condition VARCHAR(50) CHECK (condition IN (
    'excellent',
    'good',
    'fair',
    'poor',
    'unknown'
  )) DEFAULT 'unknown',
  notes TEXT,
  photo_urls TEXT[],
  serial_number VARCHAR(255),
  manufacturer VARCHAR(255),
  model_number VARCHAR(255),
  is_critical_safety BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by UUID,
  FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
);

CREATE INDEX idx_boat_inventory_boat_id ON boat_inventory(boat_id);
CREATE INDEX idx_boat_inventory_category ON boat_inventory(category);
CREATE INDEX idx_boat_inventory_zone ON boat_inventory(zone);
CREATE INDEX idx_boat_inventory_purchase_price ON boat_inventory(purchase_price);
CREATE INDEX idx_boat_inventory_current_value ON boat_inventory(current_value);
CREATE INDEX idx_boat_inventory_warranty_status ON boat_inventory(warranty_status);
CREATE INDEX idx_boat_inventory_purchase_date ON boat_inventory(purchase_date);
```

### Supporting Tables

#### `receipt_ocr_cache`
Stores OCR extracted data for receipts to enable searching/analytics:

```sql
CREATE TABLE receipt_ocr_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_url VARCHAR(500) NOT NULL,
  ocr_method VARCHAR(50) NOT NULL CHECK (ocr_method IN ('tesseract', 'google-vision')),
  raw_text TEXT,
  extracted_data JSONB,
  confidence_score DECIMAL(3, 2),
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(receipt_url, ocr_method)
);

CREATE INDEX idx_receipt_ocr_cache_url ON receipt_ocr_cache(receipt_url);
```

#### `inventory_audit_log`
Tracks changes to inventory for compliance and value recovery:

```sql
CREATE TABLE inventory_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_inventory_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'value_adjusted')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(255),
  FOREIGN KEY (boat_inventory_id) REFERENCES boat_inventory(id) ON DELETE CASCADE
);

CREATE INDEX idx_inventory_audit_log_boat_id ON inventory_audit_log(boat_inventory_id);
CREATE INDEX idx_inventory_audit_log_changed_at ON inventory_audit_log(changed_at);
```

#### `inventory_categories`
Master reference for categories and auto-detection rules:

```sql
CREATE TABLE inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  typical_value_range_min DECIMAL(12, 2),
  typical_value_range_max DECIMAL(12, 2),
  depreciation_rate_default DECIMAL(5, 2),
  safety_critical BOOLEAN DEFAULT FALSE,
  ocr_keywords TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_categories_name ON inventory_categories(name);
```

---

## 2. API Endpoints Design

### Base URL
```
/api/v1/boats/{boat_id}/inventory
```

### CRUD Operations

#### Create Inventory Item
```
POST /api/v1/boats/{boat_id}/inventory

Request Body:
{
  "item_name": "Furuno Radar",
  "category": "electronics",
  "zone": "helm",
  "purchase_date": "2022-06-15",
  "purchase_price": 8500,
  "currency": "EUR",
  "warranty_expiration": "2025-06-15",
  "condition": "excellent",
  "manufacturer": "Furuno",
  "model_number": "FR8065",
  "serial_number": "FR0012345",
  "notes": "Primary navigation radar",
  "photo_urls": ["https://storage.example.com/radar_01.jpg"]
}

Response (201 Created):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "boat_id": "550e8400-e29b-41d4-a716-446655440001",
  "item_name": "Furuno Radar",
  "category": "electronics",
  "zone": "helm",
  "purchase_price": 8500,
  "current_value": 6800,
  "warranty_status": "active",
  "created_at": "2025-11-13T10:30:00Z"
}
```

#### Read Inventory Item
```
GET /api/v1/boats/{boat_id}/inventory/{item_id}

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "boat_id": "550e8400-e29b-41d4-a716-446655440001",
  "item_name": "Furuno Radar",
  "category": "electronics",
  "zone": "helm",
  "purchase_date": "2022-06-15",
  "purchase_price": 8500,
  "current_value": 6800,
  "warranty_expiration": "2025-06-15",
  "warranty_status": "active",
  "condition": "excellent",
  "created_at": "2025-11-13T10:30:00Z",
  "updated_at": "2025-11-13T10:30:00Z"
}
```

#### Update Inventory Item
```
PATCH /api/v1/boats/{boat_id}/inventory/{item_id}

Request Body (partial update):
{
  "current_value": 6500,
  "condition": "good",
  "notes": "Minor salt spray on display"
}

Response (200 OK):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "item_name": "Furuno Radar",
  "current_value": 6500,
  "condition": "good",
  "updated_at": "2025-11-13T14:45:00Z"
}
```

#### Delete Inventory Item
```
DELETE /api/v1/boats/{boat_id}/inventory/{item_id}

Response (204 No Content)
```

#### List Inventory Items
```
GET /api/v1/boats/{boat_id}/inventory?page=1&limit=50

Query Parameters:
- page: integer (default: 1)
- limit: integer (default: 50, max: 500)
- category: string (filter by category)
- zone: string (filter by zone)
- warranty_status: string (active|expired|expiring-soon)
- value_min: number (filter by current value minimum)
- value_max: number (filter by current value maximum)
- search: string (full-text search on item_name, description)
- sort_by: string (purchase_price|current_value|warranty_expiration|item_name)
- sort_direction: string (asc|desc, default: desc)

Response (200 OK):
{
  "total": 145,
  "page": 1,
  "limit": 50,
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "item_name": "Furuno Radar",
      "category": "electronics",
      "zone": "helm",
      "purchase_price": 8500,
      "current_value": 6800,
      "warranty_status": "active"
    }
  ],
  "aggregations": {
    "by_category": {
      "electronics": 28,
      "engine": 12,
      "safety": 15,
      "deck": 35,
      "interior": 40,
      "tender/zodiac": 15
    },
    "by_zone": {
      "salon": 40,
      "galley": 25,
      "helm": 18,
      "engine room": 12,
      "stern storage": 30,
      "flybridge": 15,
      "bow": 5
    },
    "total_purchase_value": 425000,
    "total_current_value": 340000,
    "items_with_active_warranty": 72,
    "items_with_expired_warranty": 18,
    "critical_safety_items": 25
  }
}
```

### Receipt OCR Endpoint

#### Upload Receipt & Extract Data
```
POST /api/v1/boats/{boat_id}/inventory/receipt-upload

Request (multipart/form-data):
- file: image/jpeg or image/pdf (max 10MB)
- ocr_method: "tesseract" | "google-vision" (default: "google-vision")
- auto_create_item: boolean (default: false)

Response (200 OK):
{
  "receipt_url": "https://storage.example.com/receipts/receipt_2025_11_13.jpg",
  "ocr_method": "google-vision",
  "extracted_data": {
    "vendor": "Marine Electronics Store",
    "date": "2023-05-12",
    "items": [
      {
        "description": "Furuno Radar Model FR8065",
        "quantity": 1,
        "unit_price": 8500,
        "total_price": 8500
      }
    ],
    "subtotal": 8500,
    "tax": 1700,
    "total": 10200,
    "confidence_score": 0.94
  },
  "suggested_inventory_items": [
    {
      "item_name": "Furuno Radar",
      "category": "electronics",
      "purchase_price": 8500,
      "purchase_date": "2023-05-12",
      "confidence": 0.92
    }
  ]
}
```

### Summary & Analytics Endpoints

#### Get Inventory Summary
```
GET /api/v1/boats/{boat_id}/inventory/summary

Response (200 OK):
{
  "total_items": 145,
  "total_purchase_value": 425000,
  "total_current_value": 340000,
  "total_depreciation": 85000,
  "estimated_resale_value": 340000,
  "by_category": {
    "electronics": {
      "count": 28,
      "purchase_value": 125000,
      "current_value": 87500
    },
    "engine": {
      "count": 12,
      "purchase_value": 95000,
      "current_value": 76000
    }
  },
  "warranty_status_breakdown": {
    "active": 72,
    "expired": 18,
    "expiring_soon": 12,
    "unknown": 43
  },
  "critical_safety_items": 25,
  "items_needing_value_update": 8
}
```

#### Get Value Projection
```
GET /api/v1/boats/{boat_id}/inventory/{item_id}/value-projection

Query Parameters:
- months_ahead: integer (1-120, default: 12)

Response (200 OK):
{
  "item_id": "550e8400-e29b-41d4-a716-446655440000",
  "item_name": "Furuno Radar",
  "current_value": 6800,
  "depreciation_rate": 0.05,
  "projections": [
    {
      "month": 0,
      "projected_value": 6800
    },
    {
      "month": 3,
      "projected_value": 6700
    },
    {
      "month": 12,
      "projected_value": 6460
    }
  ]
}
```

---

## 3. OCR Integration Workflow

### Architecture Overview
Hybrid OCR approach using:
1. **Tesseract** (local, offline, fast) - Primary for simple receipts
2. **Google Vision API** (cloud, high accuracy) - Fallback and complex documents

### Processing Pipeline

#### Phase 1: Receipt Upload & Validation
```
User uploads receipt image
  ↓
Validate file type & size (JPEG/PDF, <10MB)
  ↓
Store in cloud storage (e.g., AWS S3, GCS)
  ↓
Generate unique receipt_url
  ↓
Queue for OCR processing
```

#### Phase 2: Tesseract Local Processing
```
Download image from storage
  ↓
Pre-processing (deskew, denoise, contrast enhancement)
  ↓
Run Tesseract OCR with merchant/receipt config
  ↓
Extract text with confidence scores
  ↓
IF confidence >= 0.85:
  - Continue to Phase 3 (Parsing)
  - Store in receipt_ocr_cache
ELSE:
  - Queue for Google Vision API
  - Log low-confidence result
```

#### Phase 3: Data Parsing & Extraction
```
Raw OCR text
  ↓
Apply regex patterns to extract:
  - Vendor name
  - Date/timestamp
  - Line items (description, quantity, price)
  - Total amount
  - Currency
  ↓
Validate extracted structure
  ↓
Store in receipt_ocr_cache.extracted_data as JSON
  ↓
Generate suggestions for inventory items
```

#### Phase 4: Inventory Item Suggestion
```
For each line item in receipt:
  ↓
Match against inventory_categories.ocr_keywords
  ↓
Determine category (electronics, engine, safety, etc.)
  ↓
Estimate zone (if possible from context)
  ↓
Create suggestion with confidence score
  ↓
Present to user for review/confirmation
```

### API Implementation

#### Tesseract Integration
```python
# Pseudocode
import pytesseract
from PIL import Image
import cv2

def extract_with_tesseract(image_path):
    # Pre-processing
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray)
    thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    # OCR
    config = r'--oem 3 --psm 6 -l eng'
    text = pytesseract.image_to_string(thresh, config=config)
    data = pytesseract.image_to_data(thresh, output_type='dict')

    # Calculate confidence
    confidences = [int(x) for x in data['conf'] if int(x) > 0]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0

    return {
        'raw_text': text,
        'confidence_score': avg_confidence / 100,
        'method': 'tesseract'
    }
```

#### Google Vision Integration
```python
# Pseudocode
from google.cloud import vision
import base64

def extract_with_google_vision(image_path):
    client = vision.ImageAnnotatorClient()

    with open(image_path, 'rb') as image_file:
        content = image_file.read()

    image = vision.Image(content=content)

    # Perform OCR
    response = client.document_text_detection(image=image)
    full_text = response.full_text_annotation.text

    # Extract confidence and detailed results
    results = []
    for page in response.full_text_annotation.pages:
        for block in page.blocks:
            for paragraph in block.paragraphs:
                for word in paragraph.words:
                    confidence = sum([s.confidence for s in word.symbols]) / len(word.symbols)
                    results.append({
                        'text': ''.join([s.text for s in word.symbols]),
                        'confidence': confidence
                    })

    avg_confidence = sum([r['confidence'] for r in results]) / len(results) if results else 0

    return {
        'raw_text': full_text,
        'confidence_score': avg_confidence,
        'method': 'google-vision'
    }
```

#### Extraction Parsing
```python
# Pseudocode
import re
from datetime import datetime

def parse_receipt_data(raw_text, extracted_data):
    result = {
        'vendor': None,
        'date': None,
        'items': [],
        'total': None,
        'currency': 'EUR'
    }

    lines = raw_text.split('\n')

    # Extract vendor (usually first meaningful line)
    for line in lines[:5]:
        if len(line.strip()) > 5:
            result['vendor'] = line.strip()
            break

    # Extract date patterns
    date_patterns = [
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(\d{4}-\d{2}-\d{2})',
        r'(\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{2,4})'
    ]

    for pattern in date_patterns:
        match = re.search(pattern, raw_text)
        if match:
            try:
                result['date'] = parse_date(match.group(1))
                break
            except:
                pass

    # Extract price items (description + amount)
    price_pattern = r'(.{10,100})\s+(\d+[.,]\d{2})'
    for match in re.finditer(price_pattern, raw_text):
        items.append({
            'description': match.group(1).strip(),
            'price': float(match.group(2).replace(',', '.')),
            'quantity': 1
        })

    # Extract total (last significant number on page)
    total_pattern = r'(?:Total|Subtotal|Grand Total)\s*[€$£]?\s*(\d+[.,]\d{2})'
    total_match = re.search(total_pattern, raw_text, re.IGNORECASE)
    if total_match:
        result['total'] = float(total_match.group(1).replace(',', '.'))

    return result
```

#### Category & Zone Suggestion
```python
# Pseudocode

CATEGORY_KEYWORDS = {
    'electronics': ['radar', 'gps', 'chartplotter', 'autopilot', 'anemometer', 'depth', 'fish finder'],
    'engine': ['engine', 'propeller', 'transmission', 'exhaust', 'fuel pump', 'alternator'],
    'safety': ['life raft', 'life jacket', 'flare', 'fire extinguisher', 'epirb', 'beacon'],
    'deck': ['winch', 'pulley', 'anchor', 'chain', 'fender', 'rope', 'rigging'],
    'tender/zodiac': ['dinghy', 'zodiac', 'tender', 'outboard', 'inflatable'],
    'interior': ['galley', 'stove', 'refrigerator', 'sink', 'bed', 'cushion', 'upholstery']
}

def suggest_category_and_zone(item_description):
    description_lower = item_description.lower()

    suggestions = []
    for category, keywords in CATEGORY_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in description_lower)
        if matches > 0:
            confidence = min(matches / len(keywords), 1.0)
            suggestions.append({
                'category': category,
                'confidence': confidence
            })

    best = sorted(suggestions, key=lambda x: x['confidence'], reverse=True)[0] if suggestions else None

    return {
        'category': best['category'] if best else 'interior',
        'confidence': best['confidence'] if best else 0.3,
        'zone': infer_zone_from_category(best['category'] if best else 'interior')
    }

def infer_zone_from_category(category):
    zone_map = {
        'electronics': 'helm',
        'engine': 'engine room',
        'safety': 'salon',
        'deck': 'bow',
        'tender/zodiac': 'stern storage',
        'interior': 'salon'
    }
    return zone_map.get(category, 'salon')
```

---

## 4. Search Implementation (Meilisearch)

### Index Configuration

#### Boat Inventory Index
```json
{
  "indexName": "boat-inventory",
  "primaryKey": "id",
  "searchableAttributes": [
    "item_name",
    "description",
    "manufacturer",
    "model_number",
    "serial_number",
    "category",
    "zone"
  ],
  "displayedAttributes": [
    "id",
    "boat_id",
    "item_name",
    "category",
    "zone",
    "purchase_price",
    "current_value",
    "warranty_status",
    "condition"
  ],
  "filterableAttributes": [
    "boat_id",
    "category",
    "zone",
    "warranty_status",
    "condition",
    "purchase_price",
    "current_value",
    "purchase_date",
    "warranty_expiration",
    "is_critical_safety"
  ],
  "sortableAttributes": [
    "purchase_price",
    "current_value",
    "purchase_date",
    "warranty_expiration",
    "item_name",
    "created_at"
  ],
  "pagination": {
    "maxTotalHits": 10000
  }
}
```

### Search Query Examples

#### Example 1: Filter by Category & Value Range
```json
{
  "q": "radar",
  "filter": [
    ["category = electronics", "current_value >= 5000"]
  ],
  "sort": ["current_value:desc"],
  "limit": 20
}
```

#### Example 2: Warranty Expiration Alert
```json
{
  "q": "",
  "filter": [
    ["warranty_status = expiring-soon", "boat_id = 550e8400-e29b-41d4-a716-446655440001"]
  ],
  "sort": ["warranty_expiration:asc"],
  "limit": 50
}
```

#### Example 3: Faceted Search by Zone & Value
```json
{
  "q": "engine",
  "facets": [
    "zone",
    "warranty_status",
    "category"
  ],
  "filter": [
    ["current_value >= 15000"]
  ]
}
```

Response:
```json
{
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "item_name": "Cummins QSM11 Engine",
      "category": "engine",
      "zone": "engine room",
      "current_value": 45000
    }
  ],
  "facetDistribution": {
    "zone": {
      "engine room": 8,
      "salon": 2,
      "stern storage": 1
    },
    "warranty_status": {
      "active": 5,
      "expired": 3,
      "unknown": 3
    },
    "category": {
      "engine": 11
    }
  }
}
```

### Implementation Code

```python
# Pseudocode
from meilisearch import Client

class InventorySearch:
    def __init__(self, meili_url, meili_key):
        self.client = Client(meili_url, meili_key)
        self.index = self.client.index('boat-inventory')

    def index_item(self, item: dict):
        """Index a single inventory item"""
        self.index.add_documents([item])

    def search(self, boat_id: str, query: str, filters: dict = None):
        """
        Search inventory with filters

        filters = {
            'category': 'electronics',
            'zone': 'helm',
            'warranty_status': 'active',
            'value_min': 5000,
            'value_max': 15000
        }
        """
        filter_array = [f"boat_id = {boat_id}"]

        if filters:
            if filters.get('category'):
                filter_array.append(f"category = {filters['category']}")
            if filters.get('zone'):
                filter_array.append(f"zone = {filters['zone']}")
            if filters.get('warranty_status'):
                filter_array.append(f"warranty_status = {filters['warranty_status']}")
            if filters.get('value_min'):
                filter_array.append(f"current_value >= {filters['value_min']}")
            if filters.get('value_max'):
                filter_array.append(f"current_value <= {filters['value_max']}")

        return self.index.search(query, {
            'filter': [filter_array],
            'limit': filters.get('limit', 50) if filters else 50
        })

    def faceted_search(self, boat_id: str, query: str = "", facets: list = None):
        """Perform faceted search"""
        default_facets = ["category", "zone", "warranty_status"]
        facets_to_use = facets or default_facets

        return self.index.search(query, {
            'filter': [f"boat_id = {boat_id}"],
            'facets': facets_to_use,
            'limit': 100
        })

    def update_item_value(self, item_id: str, new_value: float):
        """Update item value and re-index"""
        self.index.update_documents([{
            'id': item_id,
            'current_value': new_value
        }])
```

---

## 5. Mobile-First UX Wireframe

### User Flow: Photo Upload → OCR → Review → Save

#### Screen 1: Dashboard Home
```
┌─────────────────────────┐
│  🏖️  Boat Inventory     │ (Header)
├─────────────────────────┤
│                         │
│  Total Inventory Value  │
│  €340,000              │ (Large, prominent)
│                         │
│  145 Items Tracked      │
│                         │
├─────────────────────────┤
│  + ADD NEW ITEM        │ (Primary CTA button)
│  📸 UPLOAD RECEIPT     │ (Secondary CTA button)
├─────────────────────────┤
│                         │
│  Quick Filters:        │
│  • Warranty Expiring   │ (12 items)
│  • Critical Safety     │ (25 items)
│  • Recent Additions    │ (8 items)
│                         │
├─────────────────────────┤
│  Recent Items:         │
│  ┌──────────────────┐  │
│  │ Furuno Radar     │  │
│  │ €6,800  Active   │  │
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │ Cummins Engine   │  │
│  │ €45,000  Active  │  │
│  └──────────────────┘  │
│                         │
└─────────────────────────┘
```

#### Screen 2: Upload Receipt (Photo Capture)
```
┌─────────────────────────┐
│  ← Back  Add from Receipt  │ (Header)
├─────────────────────────┤
│                         │
│   ┌─────────────────┐   │
│   │                 │   │
│   │   📷 CAMERA    │   │
│   │                 │   │
│   │  OR UPLOAD FILE │   │
│   └─────────────────┘   │
│                         │
│                         │
│  Tips:                  │
│  • Good lighting        │
│  • All text visible     │
│  • Straight angle       │
│                         │
│  ┌──────────────────┐   │
│  │ 📁 CHOOSE FILE   │   │
│  └──────────────────┘   │
│                         │
└─────────────────────────┘
```

#### Screen 3: OCR Processing
```
┌─────────────────────────┐
│  Extracting Data...    │ (Header)
├─────────────────────────┤
│                         │
│        ⏳ Processing    │
│        (Loading spinner)│
│                         │
│  Receipt from:         │
│  Marine Electronics    │
│  Store                 │
│                         │
│  Date: May 12, 2023    │
│  Total: €10,200        │
│                         │
│  Detected Items:       │
│  ✓ Furuno Radar        │
│    €8,500 (94% match)  │
│                         │
└─────────────────────────┘
```

#### Screen 4: Review & Edit Extracted Data
```
┌─────────────────────────┐
│  ← Back  Review Items   │ (Header)
├─────────────────────────┤
│                         │
│  ☑️ Furuno Radar       │ (Checkbox for selection)
│     Category:          │
│     [Electronics ▼]    │ (Dropdown, pre-filled)
│     Zone:              │
│     [Helm ▼]          │ (Dropdown, pre-filled)
│     Purchase Date:     │
│     [May 12, 2023]    │ (Editable date)
│     Purchase Price:    │
│     [€8,500]          │ (Editable currency)
│     Warranty Exp:      │
│     [May 12, 2026]    │ (Editable date)
│                         │
│  ☐ Add to Boat        │ (Optional new item flag)
│    Attach Receipt:     │
│    [receipt_url.jpg]   │
│                         │
│  [← EDIT] [SAVE ✓]    │ (Action buttons)
│                         │
└─────────────────────────┘
```

#### Screen 5: Inventory List with Faceted Search
```
┌─────────────────────────┐
│  🔍 Search Inventory   │ (Header)
├─────────────────────────┤
│  [Search...] 🔎        │ (Search input)
├─────────────────────────┤
│  FILTERS:               │
│  ▼ Category             │
│    □ Electronics  (28)  │
│    □ Engine      (12)   │
│    □ Safety      (15)   │
│    □ Deck        (35)   │
│    □ Interior    (40)   │
│    □ Tender      (15)   │
│                         │
│  ▼ Zone                 │
│    □ Helm        (18)   │
│    □ Salon       (40)   │
│    □ Engine rm   (12)   │
│    [View more...]       │
│                         │
│  ▼ Warranty             │
│    □ Active      (72)   │
│    □ Expiring    (12)   │
│    □ Expired     (18)   │
│                         │
│  ▼ Value Range          │
│    □ €0-5K       (34)   │
│    □ €5K-15K     (47)   │
│    □ €15K+       (64)   │
│                         │
├─────────────────────────┤
│  RESULTS (145 items)    │
│  ┌──────────────────┐   │
│  │ Furuno Radar     │   │
│  │ Electronics Helm │   │
│  │ €8,500 → €6,800  │   │
│  │ ✓ Warranty       │   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │ Cummins Engine   │   │
│  │ Engine room      │   │
│  │ €95,000 → €76K   │   │
│  │ ✓ Warranty       │   │
│  └──────────────────┘   │
│                         │
│  [Show More...]         │
│                         │
└─────────────────────────┘
```

#### Screen 6: Item Detail View
```
┌─────────────────────────┐
│  ← Inventory  Radar     │ (Header)
├─────────────────────────┤
│  [📷] [📷] [+]         │ (Photo carousel)
├─────────────────────────┤
│                         │
│  Furuno Radar          │ (Title)
│  Model: FR8065         │
│  Serial: FR0012345     │
│                         │
│  💰 PRICING             │
│  Purchase: €8,500      │
│  Current:  €6,800      │
│  Deprecation: 20%      │
│                         │
│  📍 LOCATION            │
│  Zone: Helm            │
│  Category: Electronics │
│                         │
│  📋 STATUS              │
│  Warranty: ✓ Active    │
│  Exp: Jun 15, 2025     │
│  Condition: Excellent  │
│                         │
│  📄 DETAILS             │
│  Purchased: Jun 15, 22 │
│  Added: Nov 13, 2025   │
│  Receipt: [receipt]    │
│                         │
│  [✏️ EDIT] [🗑️ DELETE]│ (Action buttons)
│                         │
└─────────────────────────┘
```

### Key UX Principles

1. **Minimal Steps**: Photo → OCR → Review → Save (4 steps max)
2. **Pre-filled Dropdowns**: Category/zone auto-suggested from receipt
3. **Confidence Indicators**: Show OCR accuracy percentages
4. **Large Touch Targets**: 44px+ for buttons/inputs
5. **Offline Support**: Cache recent inventory locally
6. **Dark Mode**: Reduce eye strain during boat use
7. **Swipe Navigation**: Horizontal for photo carousel
8. **Voice Input**: Optional for hands-free item description

---

## 6. Integration with S2-H04 Cameras (Optional Enhancement)

### Camera-Assisted Inventory Detection Proposal

#### Vision
Enhance manual inventory tracking by automatically detecting equipment in boat camera feeds using computer vision.

#### Proposed Integration Points

1. **Equipment Detection**
   - Analyze camera feed frames for known boat equipment
   - Generate confidence scores for detected items
   - Auto-suggest zone location based on camera placement

2. **Change Detection**
   - Flag new items appearing in camera feeds
   - Alert when equipment is removed/relocated
   - Track condition changes over time (damage, wear)

3. **Inventory Reconciliation**
   - Compare manual inventory list with detected items
   - Identify missing items (potential theft/loss)
   - Generate inventory audit reports

4. **Photo Library Integration**
   - Auto-capture high-quality photos of detected items
   - Cross-reference with existing inventory photos
   - Build visual asset library for resale documentation

#### Technical Requirements

- Real-time or periodic frame analysis (configurable)
- ML model training data: yacht equipment database
- Integration with S2-H02 OCR system for label detection
- Storage for detection results and confidence metrics
- UI to accept/reject auto-suggested items

#### Expected Impact
- Reduce manual data entry time by 30-40%
- Improve inventory completeness by detecting forgotten items
- Enable automated condition monitoring
- Support insurance/warranty claim documentation

---

## Implementation Roadmap

### Phase 1 (Weeks 1-2): Foundation
- [ ] Implement database schema
- [ ] Build API endpoints (CRUD)
- [ ] Deploy Meilisearch instance
- [ ] Create receipt upload endpoint

### Phase 2 (Weeks 3-4): OCR Integration
- [ ] Integrate Tesseract locally
- [ ] Add Google Vision API fallback
- [ ] Implement receipt parsing logic
- [ ] Build OCR test suite

### Phase 3 (Weeks 5-6): Mobile UI
- [ ] Design & implement mobile screens
- [ ] Build photo upload flow
- [ ] Implement search/filter UI
- [ ] Mobile testing & optimization

### Phase 4 (Week 7): S2-H04 Integration
- [ ] Coordinate with S2-H04 on camera CV
- [ ] Design API for equipment detection
- [ ] Implement item suggestion workflow
- [ ] Build reconciliation UI

### Phase 5 (Week 8): Launch & Optimization
- [ ] Performance optimization
- [ ] Security audit
- [ ] Beta testing with yacht owners
- [ ] Production deployment

---

## Technical Stack Recommendations

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Backend | Node.js/Python | Fast development, OCR library support |
| Database | PostgreSQL | JSONB support, strong typing, audit trails |
| Search | Meilisearch | Fast faceted search, low operational overhead |
| OCR (Local) | Tesseract | Open-source, offline capability |
| OCR (Cloud) | Google Vision API | High accuracy, handles complex documents |
| Image Storage | AWS S3/GCS | Durability, CDN integration |
| Mobile | React Native/Flutter | Cross-platform, offline support |
| Deployment | Docker/Kubernetes | Scalability, OCR resource management |

---

## Success Metrics

1. **Inventory Capture Rate**: >85% of valuable equipment tracked within 90 days
2. **OCR Accuracy**: >90% for standard receipts (confidence >= 0.85)
3. **User Adoption**: >60% of yacht owners complete initial inventory within 30 days
4. **Resale Value Recovery**: €15K-€50K additional value identified per boat
5. **Mobile Engagement**: >40% of updates via mobile app
6. **Search Performance**: <200ms for faceted queries (up to 1000 items)

---

## Compliance & Security

- GDPR compliance for receipt storage (encrypted, retention policy)
- PCI-DSS consideration if payment information captured from receipts
- Data encryption in transit and at rest
- Role-based access control (owner, crew, insurance agent)
- Audit logging for all inventory changes
- Secure image storage with access controls

---

**Specification Version:** 1.0
**Last Updated:** 2025-11-13
**Status:** Ready for Implementation
