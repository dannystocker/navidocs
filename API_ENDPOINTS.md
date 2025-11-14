# NaviDocs API Endpoints Documentation

**Version:** 1.0.0
**Date:** 2025-11-14
**Base URL:** `https://api.example.com` (production)
**Total Endpoints:** 32
**Authentication:** JWT Bearer Token

---

## Table of Contents

1. [Authentication](#authentication)
2. [Inventory Endpoints (5)](#inventory-endpoints-5)
3. [Maintenance Endpoints (5)](#maintenance-endpoints-5)
4. [Camera Endpoints (7)](#camera-endpoints-7)
5. [Contacts Endpoints (7)](#contacts-endpoints-7)
6. [Expenses Endpoints (8)](#expenses-endpoints-8)
7. [Response Codes](#response-codes)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## Authentication

All endpoints (except health check) require JWT Bearer token authentication.

### Request Header
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Example
```bash
curl -X GET https://api.example.com/api/inventory/123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### Health Check (No Auth Required)
```
GET /health
```

---

## Inventory Endpoints (5)

Manage equipment, tools, and inventory items for boats.

### 1. Create Inventory Item

**Endpoint:** `POST /api/inventory`

**Authentication:** Required

**Description:** Create a new inventory item with optional photo uploads.

**Request Parameters:**
- `boat_id` (number, required): Boat ID
- `name` (string, required): Equipment name
- `category` (string, optional): Category (e.g., "Engine", "Safety", "Navigation")
- `purchase_date` (string, optional): Purchase date (YYYY-MM-DD format)
- `purchase_price` (number, optional): Purchase price in EUR
- `depreciation_rate` (number, optional): Annual depreciation rate (default: 0.1 for 10%)
- `notes` (string, optional): Additional notes

**Request Body Schema:**
```json
{
  "boat_id": 123,
  "name": "Marine Engine Oil 5L",
  "category": "Maintenance Supplies",
  "purchase_date": "2025-01-15",
  "purchase_price": 45.50,
  "depreciation_rate": 0.10,
  "notes": "Synthetic blend, replace annually"
}
```

**Response Schema (200 Created):**
```json
{
  "id": 1,
  "boat_id": 123,
  "name": "Marine Engine Oil 5L",
  "category": "Maintenance Supplies",
  "purchase_date": "2025-01-15",
  "purchase_price": 45.50,
  "current_value": 45.50,
  "depreciation_rate": 0.10,
  "photo_urls": ["/uploads/inventory/photo1.jpg"],
  "notes": "Synthetic blend, replace annually",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T10:30:00Z"
}
```

**Example cURL:**
```bash
curl -X POST https://api.example.com/api/inventory \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "boat_id": 123,
    "name": "Marine Engine Oil 5L",
    "category": "Maintenance Supplies",
    "purchase_date": "2025-01-15",
    "purchase_price": 45.50,
    "depreciation_rate": 0.10,
    "notes": "Synthetic blend"
  }'
```

---

### 2. List Inventory Items

**Endpoint:** `GET /api/inventory/:boatId`

**Authentication:** Required

**Description:** Get all inventory items for a specific boat.

**URL Parameters:**
- `boatId` (number, required): Boat ID

**Query Parameters:**
- `category` (string, optional): Filter by category
- `sort_by` (string, optional): Sort field (default: "category")
- `order` (string, optional): Sort order (asc/desc, default: asc)

**Response Schema (200 OK):**
```json
[
  {
    "id": 1,
    "boat_id": 123,
    "name": "Marine Engine Oil 5L",
    "category": "Maintenance Supplies",
    "purchase_date": "2025-01-15",
    "purchase_price": 45.50,
    "current_value": 40.95,
    "depreciation_rate": 0.10,
    "photo_urls": [],
    "notes": "Synthetic blend",
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z"
  }
]
```

**Example cURL:**
```bash
curl -X GET "https://api.example.com/api/inventory/123?category=Engine" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Inventory Item Details

**Endpoint:** `GET /api/inventory/:boatId/:itemId`

**Authentication:** Required

**Description:** Get details of a specific inventory item.

**URL Parameters:**
- `boatId` (number, required): Boat ID
- `itemId` (number, required): Inventory item ID

**Response Schema (200 OK):**
```json
{
  "id": 1,
  "boat_id": 123,
  "name": "Marine Engine Oil 5L",
  "category": "Maintenance Supplies",
  "purchase_date": "2025-01-15",
  "purchase_price": 45.50,
  "current_value": 40.95,
  "depreciation_rate": 0.10,
  "photo_urls": ["/uploads/inventory/photo1.jpg"],
  "notes": "Synthetic blend, replace annually",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T10:30:00Z"
}
```

**Example cURL:**
```bash
curl -X GET https://api.example.com/api/inventory/123/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Update Inventory Item

**Endpoint:** `PUT /api/inventory/:id`

**Authentication:** Required

**Description:** Update an inventory item.

**URL Parameters:**
- `id` (number, required): Inventory item ID

**Request Body Schema:**
```json
{
  "name": "Updated Equipment Name",
  "category": "Navigation",
  "purchase_price": 50.00,
  "current_value": 50.00,
  "depreciation_rate": 0.15,
  "notes": "Updated notes"
}
```

**Response Schema (200 OK):**
```json
{
  "id": 1,
  "boat_id": 123,
  "name": "Updated Equipment Name",
  "category": "Navigation",
  "purchase_date": "2025-01-15",
  "purchase_price": 50.00,
  "current_value": 50.00,
  "depreciation_rate": 0.15,
  "photo_urls": [],
  "notes": "Updated notes",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T11:45:00Z"
}
```

**Example cURL:**
```bash
curl -X PUT https://api.example.com/api/inventory/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Equipment Name",
    "category": "Navigation"
  }'
```

---

### 5. Delete Inventory Item

**Endpoint:** `DELETE /api/inventory/:id`

**Authentication:** Required

**Description:** Delete an inventory item.

**URL Parameters:**
- `id` (number, required): Inventory item ID

**Response Schema (200 OK):**
```json
{
  "success": true,
  "message": "Inventory item deleted successfully"
}
```

**Example cURL:**
```bash
curl -X DELETE https://api.example.com/api/inventory/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Maintenance Endpoints (5)

Track boat maintenance records and service history.

### 1. Create Maintenance Record

**Endpoint:** `POST /api/maintenance`

**Authentication:** Required

**Description:** Create a new maintenance record for a boat.

**Request Body Schema:**
```json
{
  "boat_id": 123,
  "service_type": "Engine Oil Change",
  "date": "2025-01-15",
  "provider": "Marina Mechanics Inc",
  "cost": 150.00,
  "next_due_date": "2025-04-15",
  "notes": "Synthetic oil, 5000 mile service"
}
```

**Response Schema (201 Created):**
```json
{
  "id": 1,
  "boat_id": 123,
  "service_type": "Engine Oil Change",
  "date": "2025-01-15",
  "provider": "Marina Mechanics Inc",
  "cost": 150.00,
  "next_due_date": "2025-04-15",
  "notes": "Synthetic oil, 5000 mile service",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T10:30:00Z"
}
```

**Example cURL:**
```bash
curl -X POST https://api.example.com/api/maintenance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "boat_id": 123,
    "service_type": "Engine Oil Change",
    "date": "2025-01-15",
    "provider": "Marina Mechanics Inc",
    "cost": 150.00,
    "next_due_date": "2025-04-15",
    "notes": "Synthetic oil, 5000 mile service"
  }'
```

---

### 2. List Maintenance Records

**Endpoint:** `GET /api/maintenance/:boatId`

**Authentication:** Required

**Description:** Get all maintenance records for a boat.

**URL Parameters:**
- `boatId` (number, required): Boat ID

**Query Parameters:**
- `status` (string, optional): Filter by status (completed/pending)
- `start_date` (string, optional): Filter from date (YYYY-MM-DD)
- `end_date` (string, optional): Filter to date (YYYY-MM-DD)

**Response Schema (200 OK):**
```json
[
  {
    "id": 1,
    "boat_id": 123,
    "service_type": "Engine Oil Change",
    "date": "2025-01-15",
    "provider": "Marina Mechanics Inc",
    "cost": 150.00,
    "next_due_date": "2025-04-15",
    "notes": "Synthetic oil, 5000 mile service",
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z"
  }
]
```

**Example cURL:**
```bash
curl -X GET "https://api.example.com/api/maintenance/123?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Upcoming Maintenance

**Endpoint:** `GET /api/maintenance/:boatId/upcoming`

**Authentication:** Required

**Description:** Get upcoming maintenance records (next_due_date in future).

**URL Parameters:**
- `boatId` (number, required): Boat ID

**Query Parameters:**
- `days_ahead` (number, optional): Look ahead days (default: 90)

**Response Schema (200 OK):**
```json
[
  {
    "id": 2,
    "boat_id": 123,
    "service_type": "Hull Inspection",
    "date": null,
    "provider": "Boat Care Specialists",
    "cost": 200.00,
    "next_due_date": "2025-04-30",
    "notes": "Annual hull inspection",
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z"
  }
]
```

**Example cURL:**
```bash
curl -X GET "https://api.example.com/api/maintenance/123/upcoming?days_ahead=180" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Update Maintenance Record

**Endpoint:** `PUT /api/maintenance/:id`

**Authentication:** Required

**Description:** Update a maintenance record.

**URL Parameters:**
- `id` (number, required): Maintenance record ID

**Request Body Schema:**
```json
{
  "service_type": "Engine Oil Change (Complete)",
  "date": "2025-01-16",
  "cost": 160.00,
  "next_due_date": "2025-04-16"
}
```

**Response Schema (200 OK):**
```json
{
  "id": 1,
  "boat_id": 123,
  "service_type": "Engine Oil Change (Complete)",
  "date": "2025-01-16",
  "provider": "Marina Mechanics Inc",
  "cost": 160.00,
  "next_due_date": "2025-04-16",
  "notes": "Synthetic oil, 5000 mile service",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T11:45:00Z"
}
```

**Example cURL:**
```bash
curl -X PUT https://api.example.com/api/maintenance/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cost": 160.00,
    "next_due_date": "2025-04-16"
  }'
```

---

### 5. Delete Maintenance Record

**Endpoint:** `DELETE /api/maintenance/:id`

**Authentication:** Required

**Description:** Delete a maintenance record.

**URL Parameters:**
- `id` (number, required): Maintenance record ID

**Response Schema (200 OK):**
```json
{
  "success": true,
  "message": "Maintenance record deleted successfully"
}
```

**Example cURL:**
```bash
curl -X DELETE https://api.example.com/api/maintenance/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Camera Endpoints (7)

Manage boat security cameras with Home Assistant RTSP/ONVIF integration.

### 1. Register Camera

**Endpoint:** `POST /api/cameras`

**Authentication:** Required

**Description:** Register a new camera feed for a boat.

**Request Body Schema:**
```json
{
  "boat_id": 123,
  "camera_name": "Front Deck Camera",
  "rtsp_url": "rtsp://user:pass@192.168.1.100:554/stream1"
}
```

**Response Schema (201 Created):**
```json
{
  "id": 1,
  "boat_id": 123,
  "camera_name": "Front Deck Camera",
  "rtsp_url": "rtsp://user:pass@192.168.1.100:554/stream1",
  "last_snapshot_url": null,
  "webhook_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T10:30:00Z"
}
```

**Example cURL:**
```bash
curl -X POST https://api.example.com/api/cameras \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "boat_id": 123,
    "camera_name": "Front Deck Camera",
    "rtsp_url": "rtsp://user:pass@192.168.1.100:554/stream1"
  }'
```

---

### 2. List Cameras by Boat

**Endpoint:** `GET /api/cameras/:boatId`

**Authentication:** Required

**Description:** Get all cameras for a boat.

**URL Parameters:**
- `boatId` (number, required): Boat ID

**Response Schema (200 OK):**
```json
[
  {
    "id": 1,
    "boat_id": 123,
    "camera_name": "Front Deck Camera",
    "rtsp_url": "rtsp://user:pass@192.168.1.100:554/stream1",
    "last_snapshot_url": "https://s3.example.com/snapshots/camera-1-latest.jpg",
    "webhook_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z"
  }
]
```

**Example cURL:**
```bash
curl -X GET https://api.example.com/api/cameras/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Camera Details

**Endpoint:** `GET /api/cameras/:id`

**Authentication:** Required

**Description:** Get details of a specific camera.

**URL Parameters:**
- `id` (number, required): Camera ID

**Response Schema (200 OK):**
```json
{
  "id": 1,
  "boat_id": 123,
  "camera_name": "Front Deck Camera",
  "rtsp_url": "rtsp://user:pass@192.168.1.100:554/stream1",
  "last_snapshot_url": "https://s3.example.com/snapshots/camera-1-latest.jpg",
  "webhook_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T10:30:00Z"
}
```

**Example cURL:**
```bash
curl -X GET https://api.example.com/api/cameras/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Update Camera

**Endpoint:** `PUT /api/cameras/:id`

**Authentication:** Required

**Description:** Update camera configuration.

**URL Parameters:**
- `id` (number, required): Camera ID

**Request Body Schema:**
```json
{
  "camera_name": "Updated Deck Camera",
  "rtsp_url": "rtsp://newuser:newpass@192.168.1.105:554/stream1"
}
```

**Response Schema (200 OK):**
```json
{
  "id": 1,
  "boat_id": 123,
  "camera_name": "Updated Deck Camera",
  "rtsp_url": "rtsp://newuser:newpass@192.168.1.105:554/stream1",
  "last_snapshot_url": "https://s3.example.com/snapshots/camera-1-latest.jpg",
  "webhook_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T11:45:00Z"
}
```

**Example cURL:**
```bash
curl -X PUT https://api.example.com/api/cameras/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "camera_name": "Updated Deck Camera"
  }'
```

---

### 5. Delete Camera

**Endpoint:** `DELETE /api/cameras/:id`

**Authentication:** Required

**Description:** Delete a camera feed.

**URL Parameters:**
- `id` (number, required): Camera ID

**Response Schema (200 OK):**
```json
{
  "success": true,
  "message": "Camera deleted successfully"
}
```

**Example cURL:**
```bash
curl -X DELETE https://api.example.com/api/cameras/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Update Camera Snapshot (Webhook)

**Endpoint:** `POST /api/cameras/:id/webhook`

**Authentication:** Optional (uses webhook token)

**Description:** Home Assistant integration - update snapshot URL via webhook. Can be authenticated with webhook_token as query parameter instead of JWT.

**URL Parameters:**
- `id` (number, required): Camera ID
- `token` (string, required, as query param): Webhook token

**Request Body Schema:**
```json
{
  "snapshot_url": "https://s3.example.com/snapshots/camera-1-2025-01-20-10-30.jpg",
  "event_type": "motion_detected"
}
```

**Response Schema (200 OK):**
```json
{
  "success": true,
  "message": "Snapshot updated successfully",
  "last_snapshot_url": "https://s3.example.com/snapshots/camera-1-2025-01-20-10-30.jpg"
}
```

**Example cURL:**
```bash
curl -X POST "https://api.example.com/api/cameras/1/webhook?token=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6" \
  -H "Content-Type: application/json" \
  -d '{
    "snapshot_url": "https://s3.example.com/snapshots/camera-1-2025-01-20-10-30.jpg",
    "event_type": "motion_detected"
  }'
```

---

### 7. List Cameras (Boat View)

**Endpoint:** `GET /api/cameras/:boatId/list`

**Authentication:** Required

**Description:** Get all cameras for a boat with full details (alias for endpoint 2).

**URL Parameters:**
- `boatId` (number, required): Boat ID

**Response Schema (200 OK):**
```json
{
  "boat_id": 123,
  "cameras": [
    {
      "id": 1,
      "camera_name": "Front Deck Camera",
      "rtsp_url": "rtsp://user:pass@192.168.1.100:554/stream1",
      "last_snapshot_url": "https://s3.example.com/snapshots/camera-1-latest.jpg",
      "webhook_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
    }
  ],
  "count": 1
}
```

**Example cURL:**
```bash
curl -X GET https://api.example.com/api/cameras/123/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Contacts Endpoints (7)

Manage marina, mechanic, and vendor contacts.

### 1. Create Contact

**Endpoint:** `POST /api/contacts`

**Authentication:** Required

**Description:** Create a new contact in an organization.

**Request Body Schema:**
```json
{
  "organization_id": 456,
  "name": "Marina Mechanics Inc",
  "type": "mechanic",
  "phone": "+34-900-123-456",
  "email": "info@marinamech.es",
  "address": "Port Avenue 42, Puerto de Sóller, Mallorca",
  "notes": "Specialized in diesel engine repairs"
}
```

**Response Schema (201 Created):**
```json
{
  "id": 1,
  "organization_id": 456,
  "name": "Marina Mechanics Inc",
  "type": "mechanic",
  "phone": "+34-900-123-456",
  "email": "info@marinamech.es",
  "address": "Port Avenue 42, Puerto de Sóller, Mallorca",
  "notes": "Specialized in diesel engine repairs",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T10:30:00Z"
}
```

**Example cURL:**
```bash
curl -X POST https://api.example.com/api/contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": 456,
    "name": "Marina Mechanics Inc",
    "type": "mechanic",
    "phone": "+34-900-123-456",
    "email": "info@marinamech.es"
  }'
```

---

### 2. List Contacts by Organization

**Endpoint:** `GET /api/contacts/:organizationId`

**Authentication:** Required

**Description:** Get all contacts for an organization.

**URL Parameters:**
- `organizationId` (number, required): Organization ID

**Query Parameters:**
- `type` (string, optional): Filter by type (marina/mechanic/vendor/other)

**Response Schema (200 OK):**
```json
[
  {
    "id": 1,
    "organization_id": 456,
    "name": "Marina Mechanics Inc",
    "type": "mechanic",
    "phone": "+34-900-123-456",
    "email": "info@marinamech.es",
    "address": "Port Avenue 42, Puerto de Sóller, Mallorca",
    "notes": "Specialized in diesel engine repairs",
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z"
  }
]
```

**Example cURL:**
```bash
curl -X GET "https://api.example.com/api/contacts/456?type=mechanic" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Contact Details

**Endpoint:** `GET /api/contacts/:id`

**Authentication:** Required

**Description:** Get details of a specific contact.

**URL Parameters:**
- `id` (number, required): Contact ID

**Response Schema (200 OK):**
```json
{
  "id": 1,
  "organization_id": 456,
  "name": "Marina Mechanics Inc",
  "type": "mechanic",
  "phone": "+34-900-123-456",
  "email": "info@marinamech.es",
  "address": "Port Avenue 42, Puerto de Sóller, Mallorca",
  "notes": "Specialized in diesel engine repairs",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T10:30:00Z"
}
```

**Example cURL:**
```bash
curl -X GET https://api.example.com/api/contacts/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Filter Contacts by Type

**Endpoint:** `GET /api/contacts/type/:type`

**Authentication:** Required

**Description:** Get contacts filtered by type.

**URL Parameters:**
- `type` (string, required): Contact type (marina/mechanic/vendor/other)

**Query Parameters:**
- `organization_id` (number, optional): Filter by organization

**Response Schema (200 OK):**
```json
[
  {
    "id": 1,
    "organization_id": 456,
    "name": "Marina Mechanics Inc",
    "type": "mechanic",
    "phone": "+34-900-123-456",
    "email": "info@marinamech.es",
    "address": "Port Avenue 42, Puerto de Sóller, Mallorca",
    "notes": "Specialized in diesel engine repairs",
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z"
  }
]
```

**Example cURL:**
```bash
curl -X GET "https://api.example.com/api/contacts/type/mechanic?organization_id=456" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Search Contacts

**Endpoint:** `GET /api/contacts/search`

**Authentication:** Required

**Description:** Search contacts by name or other fields.

**Query Parameters:**
- `q` (string, required): Search query
- `organization_id` (number, optional): Filter by organization
- `type` (string, optional): Filter by type

**Response Schema (200 OK):**
```json
[
  {
    "id": 1,
    "organization_id": 456,
    "name": "Marina Mechanics Inc",
    "type": "mechanic",
    "phone": "+34-900-123-456",
    "email": "info@marinamech.es",
    "address": "Port Avenue 42, Puerto de Sóller, Mallorca",
    "notes": "Specialized in diesel engine repairs",
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z"
  }
]
```

**Example cURL:**
```bash
curl -X GET "https://api.example.com/api/contacts/search?q=Marina&organization_id=456" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Update Contact

**Endpoint:** `PUT /api/contacts/:id`

**Authentication:** Required

**Description:** Update a contact.

**URL Parameters:**
- `id` (number, required): Contact ID

**Request Body Schema:**
```json
{
  "name": "Marina Mechanics Inc - Updated",
  "phone": "+34-900-999-999",
  "email": "support@marinamech.es"
}
```

**Response Schema (200 OK):**
```json
{
  "id": 1,
  "organization_id": 456,
  "name": "Marina Mechanics Inc - Updated",
  "type": "mechanic",
  "phone": "+34-900-999-999",
  "email": "support@marinamech.es",
  "address": "Port Avenue 42, Puerto de Sóller, Mallorca",
  "notes": "Specialized in diesel engine repairs",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T11:45:00Z"
}
```

**Example cURL:**
```bash
curl -X PUT https://api.example.com/api/contacts/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+34-900-999-999"
  }'
```

---

### 7. Delete Contact

**Endpoint:** `DELETE /api/contacts/:id`

**Authentication:** Required

**Description:** Delete a contact.

**URL Parameters:**
- `id` (number, required): Contact ID

**Response Schema (200 OK):**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

**Example cURL:**
```bash
curl -X DELETE https://api.example.com/api/contacts/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Expenses Endpoints (8)

Track boat expenses with multi-user splitting and OCR receipt processing.

### 1. Create Expense

**Endpoint:** `POST /api/expenses`

**Authentication:** Required

**Description:** Create a new expense with optional receipt upload.

**Request Body Schema:**
```json
{
  "boat_id": 123,
  "amount": 250.50,
  "currency": "EUR",
  "date": "2025-01-15",
  "category": "Fuel",
  "receipt_url": "/uploads/receipts/expense-1.pdf",
  "split_users": {
    "user1": 0.5,
    "user2": 0.5
  },
  "notes": "Diesel fuel for Mediterranean crossing"
}
```

**Response Schema (201 Created):**
```json
{
  "id": 1,
  "boat_id": 123,
  "amount": 250.50,
  "currency": "EUR",
  "date": "2025-01-15",
  "category": "Fuel",
  "receipt_url": "/uploads/receipts/expense-1.pdf",
  "ocr_text": null,
  "split_users": {
    "user1": 0.5,
    "user2": 0.5
  },
  "approval_status": "pending",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T10:30:00Z"
}
```

**Example cURL:**
```bash
curl -X POST https://api.example.com/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "boat_id": 123,
    "amount": 250.50,
    "currency": "EUR",
    "date": "2025-01-15",
    "category": "Fuel",
    "split_users": {
      "user1": 0.5,
      "user2": 0.5
    }
  }'
```

---

### 2. List Expenses by Boat

**Endpoint:** `GET /api/expenses/:boatId`

**Authentication:** Required

**Description:** Get all expenses for a boat.

**URL Parameters:**
- `boatId` (number, required): Boat ID

**Query Parameters:**
- `category` (string, optional): Filter by category
- `start_date` (string, optional): Filter from date (YYYY-MM-DD)
- `end_date` (string, optional): Filter to date (YYYY-MM-DD)

**Response Schema (200 OK):**
```json
[
  {
    "id": 1,
    "boat_id": 123,
    "amount": 250.50,
    "currency": "EUR",
    "date": "2025-01-15",
    "category": "Fuel",
    "receipt_url": "/uploads/receipts/expense-1.pdf",
    "ocr_text": "TOTAL: €250.50",
    "split_users": {
      "user1": 0.5,
      "user2": 0.5
    },
    "approval_status": "approved",
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T12:00:00Z"
  }
]
```

**Example cURL:**
```bash
curl -X GET "https://api.example.com/api/expenses/123?category=Fuel" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. List Pending Expenses

**Endpoint:** `GET /api/expenses/:boatId/pending`

**Authentication:** Required

**Description:** Get expenses awaiting approval.

**URL Parameters:**
- `boatId` (number, required): Boat ID

**Response Schema (200 OK):**
```json
[
  {
    "id": 1,
    "boat_id": 123,
    "amount": 250.50,
    "currency": "EUR",
    "date": "2025-01-15",
    "category": "Fuel",
    "receipt_url": "/uploads/receipts/expense-1.pdf",
    "ocr_text": "TOTAL: €250.50",
    "split_users": {
      "user1": 0.5,
      "user2": 0.5
    },
    "approval_status": "pending",
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z"
  }
]
```

**Example cURL:**
```bash
curl -X GET https://api.example.com/api/expenses/123/pending \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Get Split Expenses

**Endpoint:** `GET /api/expenses/:boatId/split`

**Authentication:** Required

**Description:** Get expenses with split details and calculations.

**URL Parameters:**
- `boatId` (number, required): Boat ID

**Response Schema (200 OK):**
```json
[
  {
    "id": 1,
    "boat_id": 123,
    "amount": 250.50,
    "currency": "EUR",
    "date": "2025-01-15",
    "category": "Fuel",
    "split_users": {
      "user1": {
        "share": 0.5,
        "amount_owed": 125.25
      },
      "user2": {
        "share": 0.5,
        "amount_owed": 125.25
      }
    },
    "approval_status": "pending",
    "approvals": {
      "user1": true,
      "user2": false
    },
    "created_at": "2025-01-20T10:30:00Z",
    "updated_at": "2025-01-20T10:30:00Z"
  }
]
```

**Example cURL:**
```bash
curl -X GET https://api.example.com/api/expenses/123/split \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Update Expense

**Endpoint:** `PUT /api/expenses/:id`

**Authentication:** Required

**Description:** Update an expense.

**URL Parameters:**
- `id` (number, required): Expense ID

**Request Body Schema:**
```json
{
  "amount": 260.00,
  "category": "Fuel & Marina",
  "notes": "Updated notes"
}
```

**Response Schema (200 OK):**
```json
{
  "id": 1,
  "boat_id": 123,
  "amount": 260.00,
  "currency": "EUR",
  "date": "2025-01-15",
  "category": "Fuel & Marina",
  "receipt_url": "/uploads/receipts/expense-1.pdf",
  "ocr_text": "TOTAL: €260.00",
  "split_users": {
    "user1": 0.5,
    "user2": 0.5
  },
  "approval_status": "pending",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T11:45:00Z"
}
```

**Example cURL:**
```bash
curl -X PUT https://api.example.com/api/expenses/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 260.00,
    "category": "Fuel & Marina"
  }'
```

---

### 6. Approve Expense

**Endpoint:** `PUT /api/expenses/:id/approve`

**Authentication:** Required

**Description:** Approve an expense (multi-user approval workflow).

**URL Parameters:**
- `id` (number, required): Expense ID

**Request Body Schema:**
```json
{
  "user_id": "user1",
  "approval_status": "approved"
}
```

**Response Schema (200 OK):**
```json
{
  "id": 1,
  "boat_id": 123,
  "amount": 250.50,
  "currency": "EUR",
  "date": "2025-01-15",
  "category": "Fuel",
  "split_users": {
    "user1": 0.5,
    "user2": 0.5
  },
  "approval_status": "approved",
  "approvals": {
    "user1": true,
    "user2": true
  },
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T12:15:00Z"
}
```

**Example cURL:**
```bash
curl -X PUT https://api.example.com/api/expenses/1/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user1",
    "approval_status": "approved"
  }'
```

---

### 7. Delete Expense

**Endpoint:** `DELETE /api/expenses/:id`

**Authentication:** Required

**Description:** Delete an expense.

**URL Parameters:**
- `id` (number, required): Expense ID

**Response Schema (200 OK):**
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

**Example cURL:**
```bash
curl -X DELETE https://api.example.com/api/expenses/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 8. Process Receipt OCR

**Endpoint:** `POST /api/expenses/:id/ocr`

**Authentication:** Required

**Description:** Extract text from receipt image using OCR.

**URL Parameters:**
- `id` (number, required): Expense ID

**Request Body Schema:**
```json
{
  "provider": "google-vision"
}
```

**Response Schema (200 OK):**
```json
{
  "id": 1,
  "boat_id": 123,
  "amount": 250.50,
  "currency": "EUR",
  "date": "2025-01-15",
  "category": "Fuel",
  "receipt_url": "/uploads/receipts/expense-1.pdf",
  "ocr_text": "TOTAL: €250.50\nFUEL TYPE: DIESEL\nQUANTITY: 500L\nPRICE/L: €0.50\nDATE: 2025-01-15",
  "split_users": {
    "user1": 0.5,
    "user2": 0.5
  },
  "approval_status": "pending",
  "created_at": "2025-01-20T10:30:00Z",
  "updated_at": "2025-01-20T11:00:00Z"
}
```

**Example cURL:**
```bash
curl -X POST https://api.example.com/api/expenses/1/ocr \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google-vision"
  }'
```

---

## Response Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no content to return |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate entry) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

---

## Error Handling

### Error Response Format

All errors follow this standard format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-20T10:30:00Z",
  "request_id": "req-12345678"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_REQUEST | 400 | Missing or invalid request parameters |
| AUTHENTICATION_FAILED | 401 | Authentication token missing or invalid |
| AUTHORIZATION_FAILED | 403 | User lacks required permissions |
| NOT_FOUND | 404 | Requested resource not found |
| DUPLICATE_ENTRY | 409 | Resource already exists |
| VALIDATION_ERROR | 422 | Validation constraint violated |
| RATE_LIMIT_EXCEEDED | 429 | Request rate limit exceeded |
| INTERNAL_ERROR | 500 | Internal server error |

### Example Error Response

```bash
curl -X GET https://api.example.com/api/inventory/999 \
  -H "Authorization: Bearer INVALID_TOKEN"

# Response:
{
  "success": false,
  "error": "Boat not found",
  "code": "NOT_FOUND",
  "timestamp": "2025-01-20T10:30:00Z",
  "request_id": "req-87654321"
}
```

---

## Rate Limiting

All API endpoints are subject to rate limiting.

### Rate Limit Headers

Response headers include:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642663800
```

### Default Limits

- **Per User:** 1000 requests per 15 minutes
- **Per IP:** 100 requests per 15 minutes (unauthenticated)
- **Per Endpoint:** 100 requests per 15 minutes

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 42,
  "timestamp": "2025-01-20T10:30:00Z"
}
```

---

## Endpoint Summary

| Module | Method | Endpoint | Auth | Purpose |
|--------|--------|----------|------|---------|
| **Inventory** | POST | /api/inventory | ✓ | Create item |
| | GET | /api/inventory/:boatId | ✓ | List items |
| | GET | /api/inventory/:boatId/:itemId | ✓ | Get details |
| | PUT | /api/inventory/:id | ✓ | Update item |
| | DELETE | /api/inventory/:id | ✓ | Delete item |
| **Maintenance** | POST | /api/maintenance | ✓ | Create record |
| | GET | /api/maintenance/:boatId | ✓ | List records |
| | GET | /api/maintenance/:boatId/upcoming | ✓ | Get upcoming |
| | PUT | /api/maintenance/:id | ✓ | Update record |
| | DELETE | /api/maintenance/:id | ✓ | Delete record |
| **Cameras** | POST | /api/cameras | ✓ | Register camera |
| | GET | /api/cameras/:boatId | ✓ | List cameras |
| | GET | /api/cameras/:id | ✓ | Get details |
| | PUT | /api/cameras/:id | ✓ | Update camera |
| | DELETE | /api/cameras/:id | ✓ | Delete camera |
| | POST | /api/cameras/:id/webhook | △ | Webhook update |
| | GET | /api/cameras/:boatId/list | ✓ | List cameras |
| **Contacts** | POST | /api/contacts | ✓ | Create contact |
| | GET | /api/contacts/:organizationId | ✓ | List contacts |
| | GET | /api/contacts/:id | ✓ | Get details |
| | GET | /api/contacts/type/:type | ✓ | Filter by type |
| | GET | /api/contacts/search | ✓ | Search contacts |
| | PUT | /api/contacts/:id | ✓ | Update contact |
| | DELETE | /api/contacts/:id | ✓ | Delete contact |
| **Expenses** | POST | /api/expenses | ✓ | Create expense |
| | GET | /api/expenses/:boatId | ✓ | List expenses |
| | GET | /api/expenses/:boatId/pending | ✓ | Get pending |
| | GET | /api/expenses/:boatId/split | ✓ | Get splits |
| | PUT | /api/expenses/:id | ✓ | Update expense |
| | PUT | /api/expenses/:id/approve | ✓ | Approve expense |
| | DELETE | /api/expenses/:id | ✓ | Delete expense |
| | POST | /api/expenses/:id/ocr | ✓ | Process OCR |

*Auth: ✓ = JWT required, △ = Webhook token or JWT*

---

## Support & Version History

**API Version:** 1.0.0
**Last Updated:** 2025-11-14
**Status:** Production Ready

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-14 | Initial release with 32 endpoints |

### Support

For API support, issues, or questions:
- GitHub Issues: https://github.com/navidocs/api/issues
- Email: api-support@example.com
- Documentation: https://docs.example.com/api

---

**End of API Documentation**
