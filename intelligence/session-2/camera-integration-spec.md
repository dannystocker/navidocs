# Camera & Remote Monitoring Integration Specification
## NaviDocs Boat Peace-of-Mind System

**Agent ID:** S2-H04
**Task:** Camera & Remote Monitoring Integration (STICKY!)
**Status:** Complete
**Date:** 2025-11-13

---

## Executive Summary

This specification describes a comprehensive camera and remote monitoring system for boat owners, enabling "is my boat OK?" peace of mind through Home Assistant integration, real-time alerts, snapshot galleries, and optional computer vision for equipment detection. The system prioritizes mobile-first UI, seamless integration with existing NaviDocs architecture, and security hardening for both webhook endpoints and snapshot storage.

---

## 1. Home Assistant Integration Architecture

### 1.1 Webhook Architecture (NaviDocs ← HA Events)

**Flow Diagram:**
```
Home Assistant Instance (on boat or cloud)
    ↓ (webhook POST)
NaviDocs Webhook Receiver (/api/webhooks/events/home-assistant)
    ↓ (validate signature + rate limit)
Event Bus (Redis pub/sub)
    ↓ (fan-out to handlers)
├─→ Snapshot Storage Service
├─→ Alert Notification Engine
├─→ Timeline Logger (IF.TTT audit trail)
└─→ WebSocket broadcast (real-time dashboard updates)
```

### 1.2 Webhook Receiver Endpoint

**Endpoint:** `POST /api/webhooks/events/home-assistant`

**Authentication:**
- HA sends webhook with X-HA-Signature header (HMAC-SHA256)
- NaviDocs validates signature against stored HA API token
- Rate limiting: 100 events/minute per boat (prevents DDoS from compromised HA instance)
- Tenant isolation: webhook must include `boat_id` + signature verification

**Request Payload Schema:**
```json
{
  "boat_id": "boat-uuid-12345",
  "event_type": "motion_detected | battery_low | bilge_pump_triggered | camera_offline | network_interrupted | manual_snapshot_requested",
  "timestamp": "2025-11-13T14:32:00Z",
  "camera_id": "hikvision-deck-cam-1",
  "camera_name": "Deck Camera (Port)",
  "event_data": {
    "severity": "info | warning | critical",
    "message": "Motion detected on deck",
    "confidence": 0.95,
    "ai_detection": {
      "object_class": "person | boat | equipment | animal | vehicle",
      "confidence": 0.87
    },
    "battery_percentage": 45,
    "signal_strength": -65,
    "location_zone": "deck | salon | galley | helm | engine_room | bilge | hull"
  },
  "snapshot_url": "https://ha-instance.local:8123/api/camera_proxy/camera.deck_camera?token=xxx",
  "video_url": "rtsp://user:pass@ha-instance.local:554/stream1",
  "metadata": {
    "ha_integration": "hikvision | reolink | generic_onvif",
    "camera_model": "Hikvision DS-2CD2043G0-I",
    "firmware_version": "V5.4.41"
  }
}
```

**Response (Success):**
```json
{
  "status": "received",
  "event_id": "if://event/navidocs/boat-123/motion-2025-11-13-14-32-00",
  "processing_status": "queued",
  "snapshot_storage_url": "https://navidocs-api.example.com/api/snapshots/{snapshot_id}",
  "alert_sent": true,
  "alert_channels": ["push_notification", "email"]
}
```

### 1.3 Supported Camera Brands & Integration

**Primary Integration:** Home Assistant Camera Platform
- Automatically supports 50+ camera brands via HA plugins
- Examples: Hikvision, Reolink, AXIS, Dahua, Netgear, Ubiquiti, Wyze

**Integration Method:**
1. User installs Home Assistant (on Raspberry Pi or NUC in boat cabin)
2. Adds camera integration in HA (simple YAML config)
3. Creates webhook automation in HA:
   ```yaml
   automation:
     - alias: "NaviDocs Motion Alert"
       trigger:
         platform: state
         entity_id: binary_sensor.deck_motion_sensor
         to: "on"
       action:
         - service: rest_command.navidocs_webhook
           data:
             event_type: "motion_detected"
             camera_id: "deck-cam-1"
   ```
4. NaviDocs webhook secret stored in HA configuration

**Marine-Specific Cameras (Optional Integrations):**
- **Cradlepoint**: Cellular backup for internet connectivity
- **StarLink**: High-latency satellite internet (HA can work over it)
- **Ubiquiti UniFi**: Professional marine-grade wireless
- **Battery monitoring**: Victron SmartShunt feeds battery % to HA

### 1.4 MQTT Broker Integration (Real-Time Events)

**Optional:** For boats already using MQTT infrastructure

**MQTT Topics:**
```
navidocs/{boat_id}/camera/{camera_id}/snapshot
navidocs/{boat_id}/alerts/{alert_type}/{severity}
navidocs/{boat_id}/status/online
navidocs/{boat_id}/telemetry/battery_voltage
```

**Message Format:**
```json
{
  "boat_id": "boat-uuid",
  "camera_id": "deck-cam-1",
  "timestamp": "2025-11-13T14:32:00Z",
  "event": "motion_detected",
  "confidence": 0.95,
  "snapshot_id": "snap-uuid-xxx",
  "processing": "queued"
}
```

**Bridge Design:**
- HA MQTT integration sends to broker
- NaviDocs MQTT subscriber processes events (same as webhook, but async)
- Fallback to webhook if MQTT unavailable (reliability)

---

## 2. Camera Snapshot Storage Schema

### 2.1 Database Table: `camera_snapshots`

**Purpose:** Store metadata + links to snapshot files, enable gallery queries with time-series retrieval

**Schema:**
```sql
CREATE TABLE camera_snapshots (
  -- Primary Key
  id TEXT PRIMARY KEY,  -- uuid: snap-boat123-2025-11-13-14-32-00

  -- Foreign Keys & Ownership
  boat_id TEXT NOT NULL,  -- Links to boat
  camera_id TEXT NOT NULL,  -- Physical camera identifier
  FOREIGN KEY (boat_id) REFERENCES entities(id),

  -- Event Information
  event_type TEXT NOT NULL,  -- 'motion', 'alert', 'manual', 'battery_low', 'bilge', 'scheduled'
  event_severity TEXT DEFAULT 'info',  -- 'info', 'warning', 'critical'
  event_message TEXT,  -- "Motion detected on deck"
  confidence REAL,  -- 0.0-1.0 (for AI detections)

  -- Computer Vision Results (Optional)
  cv_analysis JSON,  -- {object_classes: [{class: "person", conf: 0.95}], detected_objects: [...]}
  ai_detection_enabled BOOLEAN DEFAULT FALSE,
  detected_equipment TEXT,  -- Detected tender, electronics, etc.

  -- Timestamp Information
  snapshot_timestamp DATETIME NOT NULL,  -- When photo was taken
  received_timestamp DATETIME NOT NULL,  -- When webhook received
  processed_timestamp DATETIME,  -- When CV analysis completed

  -- Storage Information
  storage_path TEXT NOT NULL,  -- s3://navidocs-snapshots/boat-123/2025-11-13/snap-uuid.jpg
  thumbnail_path TEXT,  -- s3://navidocs-snapshots/boat-123/2025-11-13/snap-uuid-thumb.jpg
  file_size_bytes INTEGER,
  image_hash TEXT,  -- SHA-256 hash for deduplication + IF.TTT compliance

  -- Metadata
  camera_name TEXT,
  camera_model TEXT,
  camera_zone TEXT,  -- 'deck', 'salon', 'galley', 'helm', 'engine_room', 'bilge', 'hull'
  battery_percentage INTEGER,  -- Camera battery %
  signal_strength INTEGER,  -- WiFi/cellular signal (dBm)

  -- Related Data
  linked_alert_id TEXT,  -- FK to alerts table
  linked_inventory_items TEXT,  -- JSON array of inventory item UUIDs detected

  -- Retention & Cleanup
  retention_days INTEGER DEFAULT 30,
  marked_for_deletion BOOLEAN DEFAULT FALSE,
  deletion_scheduled_at DATETIME,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Indexing
  UNIQUE(boat_id, camera_id, snapshot_timestamp),
  INDEX idx_boat_timestamp (boat_id, snapshot_timestamp DESC),
  INDEX idx_event_type (boat_id, event_type, snapshot_timestamp DESC),
  INDEX idx_retention (boat_id, marked_for_deletion, deletion_scheduled_at),
  FULLTEXT INDEX idx_search (event_message, detected_equipment)
);
```

### 2.2 Computer Vision Analysis Table

**Purpose:** Store ML model inference results separately for querying without loading image files

```sql
CREATE TABLE camera_cv_analysis (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL UNIQUE,
  boat_id TEXT NOT NULL,

  -- Model Information
  model_name TEXT,  -- 'YOLOv8-boat-equipment', 'YOLOv8-person-detection'
  model_version TEXT,
  inference_time_ms FLOAT,

  -- Detection Results (JSON because variable number of objects)
  detections JSON,  -- [
                    --   {class: "tender", confidence: 0.94, bbox: [x, y, w, h]},
                    --   {class: "person", confidence: 0.87, bbox: [x, y, w, h]},
                    --   {class: "electronics", confidence: 0.78, bbox: [x, y, w, h]}
                    -- ]

  -- Summary Statistics
  person_detected BOOLEAN,
  tender_detected BOOLEAN,
  equipment_detected BOOLEAN,
  anomaly_score FLOAT,  -- 0.0-1.0 (unusual vs historical average)

  -- Thresholds & Alerts
  alert_triggered BOOLEAN,
  alert_reason TEXT,  -- Why alert was triggered

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (snapshot_id) REFERENCES camera_snapshots(id),
  FOREIGN KEY (boat_id) REFERENCES entities(id),
  INDEX idx_detections (boat_id, created_at DESC)
);
```

### 2.3 Auto-Cleanup Policy

**Retention Rules:**
- Default: Keep 30 days
- Critical/Alert snapshots: Keep 90 days
- Manual snapshots (user bookmarked): Keep indefinitely
- Thumbnail index: Keep forever (small file size)

**Cleanup Implementation:**
```sql
-- Daily cleanup job (BullMQ scheduled job)
SELECT * FROM camera_snapshots
WHERE boat_id = $1
  AND marked_for_deletion = FALSE
  AND snapshot_timestamp < DATETIME('now', '-30 days')
  AND event_type NOT IN ('critical', 'alert')
  AND id NOT IN (
    SELECT snapshot_id FROM bookmarks WHERE entity_type = 'snapshot'
  );

-- Mark for deletion (soft delete, 7-day grace period)
UPDATE camera_snapshots
SET marked_for_deletion = TRUE, deletion_scheduled_at = DATETIME('now', '+7 days')
WHERE id IN (...);

-- Hard delete after grace period
DELETE FROM camera_snapshots
WHERE marked_for_deletion = TRUE
  AND deletion_scheduled_at < DATETIME('now');
```

**Storage Tier Strategy:**
- **Hot tier (7 days):** S3 Standard - frequently accessed
- **Warm tier (7-30 days):** S3 Intelligent-Tiering
- **Cold tier (30+ days):** S3 Glacier (archive critical/alert photos)

### 2.4 Thumbnail Generation

**Automatic Thumbnail Pipeline:**

```javascript
// server/workers/snapshot-thumbnail-worker.js
module.exports = {
  async processSnapshotThumbnail(jobData) {
    const { snapshotId, storagePath } = jobData;

    // 1. Download original from S3
    const originalImage = await s3.getObject(storagePath);

    // 2. Generate thumbnails (multiple sizes for responsive mobile)
    const thumbnails = {
      'thumb-140w': await sharp(originalImage)
        .resize(140, 105, { fit: 'cover' })
        .jpeg({ quality: 75 })
        .toBuffer(),
      'thumb-280w': await sharp(originalImage)
        .resize(280, 210, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer(),
      'thumb-560w': await sharp(originalImage)
        .resize(560, 420, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer()
    };

    // 3. Upload thumbnails to S3
    for (const [name, data] of Object.entries(thumbnails)) {
      await s3.putObject(`${storagePath.replace('.jpg', '')}-${name}.jpg`, data);
    }

    // 4. Update database with thumbnail paths
    await db.query(
      'UPDATE camera_snapshots SET thumbnail_path = ? WHERE id = ?',
      [`${storagePath.replace('.jpg', '')}-thumb-280w.jpg`, snapshotId]
    );
  }
};
```

---

## 3. API Endpoints (Webhook Receiver, Snapshot Gallery, Live Feed)

### 3.1 Webhook Receiver Endpoint

**POST /api/webhooks/events/home-assistant**

Already detailed in Section 1.2. Key security features:
- HMAC-SHA256 signature validation
- Rate limiting: 100 events/minute
- Tenant isolation via boat_id verification
- Async processing via BullMQ (non-blocking)

### 3.2 Snapshot Gallery API

**GET /api/boats/{boat_id}/snapshots**

**Query Parameters:**
```
?event_type=motion,alert,manual  -- Filter by event
?camera_id=deck-cam-1            -- Filter by camera
?severity=critical,warning         -- Filter by severity
?from=2025-11-10&to=2025-11-13   -- Date range
?skip=0&limit=20                 -- Pagination
?sort=timestamp_desc              -- Sort order
?search=tender,person             -- CV detection search
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "total_snapshots": 245,
    "page": 1,
    "limit": 20,
    "snapshots": [
      {
        "id": "snap-uuid-xxx",
        "timestamp": "2025-11-13T14:32:00Z",
        "event_type": "motion",
        "severity": "warning",
        "camera_name": "Deck Camera",
        "camera_zone": "deck",
        "thumbnail_url": "https://api.navidocs.com/snapshots/snap-xxx/thumb-280w",
        "full_image_url": "https://api.navidocs.com/snapshots/snap-xxx/full",
        "cv_detections": {
          "person_detected": true,
          "confidence": 0.94,
          "objects": [
            {"class": "person", "confidence": 0.94},
            {"class": "boat", "confidence": 0.87}
          ]
        },
        "metadata": {
          "battery_percentage": 85,
          "signal_strength": -55,
          "camera_model": "Hikvision DS-2CD2043G0-I"
        }
      },
      // ... more snapshots
    ]
  }
}
```

**Security:**
- Tenant isolation: Only return snapshots for authenticated boat_id
- Auth: JWT bearer token required
- Rate limiting: 60 requests/minute per user
- Image delivery: S3 signed URLs (10-minute expiry)

### 3.3 Individual Snapshot Retrieval

**GET /api/snapshots/{snapshot_id}**

**Response:** Redirect to S3 signed URL (no sensitive data exposed)

**GET /api/snapshots/{snapshot_id}/metadata**

**Response:**
```json
{
  "id": "snap-uuid",
  "boat_id": "boat-123",
  "camera_id": "deck-cam-1",
  "timestamp": "2025-11-13T14:32:00Z",
  "event_type": "motion_detected",
  "severity": "warning",
  "cv_analysis": {
    "model": "YOLOv8-boat-equipment",
    "detections": [
      {"class": "person", "confidence": 0.94, "bbox": [100, 50, 200, 300]},
      {"class": "tender", "confidence": 0.87, "bbox": [50, 300, 400, 450]}
    ]
  },
  "linked_inventory": [
    {"item_id": "inv-tender-001", "name": "Zodiac 310"}
  ]
}
```

### 3.4 Live Camera Feed Proxy

**GET /api/boats/{boat_id}/live-feeds**

**Purpose:** Discover available live feeds from Home Assistant instance

**Response:**
```json
{
  "status": "success",
  "data": {
    "boat_id": "boat-123",
    "ha_status": "connected",
    "ha_version": "2025.11.0",
    "feeds": [
      {
        "camera_id": "deck-cam-1",
        "camera_name": "Deck Camera",
        "model": "Hikvision DS-2CD2043G0-I",
        "stream_types": ["rtsp", "hls", "http_mjpeg"],
        "stream_urls": {
          "rtsp": "rtsp://ha-instance.local:554/stream1",
          "hls": "http://ha-instance.local:8123/api/hls/camera.deck_camera/playlist.m3u8"
        },
        "ha_entity_id": "camera.deck_camera",
        "battery_percentage": 85,
        "signal_strength": -55,
        "last_frame_timestamp": "2025-11-13T14:32:00Z",
        "recording_enabled": true
      },
      // ... more cameras
    ]
  }
}
```

**Security Notes:**
- HLS endpoint proxied through NaviDocs (HTTPS, auth required)
- RTSP streams exposed to mobile app (app handles decryption)
- Rate limiting: 10 stream requests/minute (prevent abuse)

### 3.5 Alert Creation API

**POST /api/boats/{boat_id}/alerts**

**Request:**
```json
{
  "snapshot_id": "snap-uuid",
  "alert_type": "motion | intruder_detected | equipment_detected | battery_critical",
  "severity": "info | warning | critical",
  "message": "Motion detected on deck at 14:32",
  "notify_channels": ["push", "email", "sms"],
  "auto_notify_users": true
}
```

**Response:**
```json
{
  "alert_id": "alert-uuid",
  "status": "created",
  "notifications_sent": {
    "push": {
      "status": "queued",
      "target_devices": ["user-device-1", "user-device-2"]
    },
    "email": {
      "status": "queued",
      "recipients": ["owner@email.com"]
    },
    "sms": {
      "status": "queued",
      "recipients": ["+33612345678"]
    }
  }
}
```

### 3.6 Statistics & Dashboard API

**GET /api/boats/{boat_id}/camera-stats**

**Response:**
```json
{
  "boat_id": "boat-123",
  "period": "7d",
  "statistics": {
    "total_snapshots": 245,
    "snapshots_by_type": {
      "motion": 142,
      "alert": 58,
      "manual": 32,
      "scheduled": 13
    },
    "camera_uptime": {
      "deck-cam-1": 0.98,
      "salon-cam-1": 0.95
    },
    "top_detection_types": [
      {"class": "person", "count": 12},
      {"class": "boat", "count": 5}
    ],
    "storage_used_gb": 2.3,
    "storage_quota_gb": 10,
    "retention_days": 30
  }
}
```

---

## 4. Mobile-First UI Wireframes

### 4.1 Main Camera Dashboard (Home Screen)

**Screen 1: Quick Check ("Is my boat OK?")**

```
┌──────────────────────────┐
│ 📍 BOAT: "Riviera Plaisance" │
│      Docked: Port Grimaud  │
├──────────────────────────┤
│  🔴 LATEST SNAPSHOT       │
│  ┌──────────────────────┐ │
│  │   [DECK CAM IMAGE]   │ │
│  │   2 min ago          │ │
│  └──────────────────────┘ │
│  • Motion detected        │
│  • Person detected (94%)  │
│  • Battery: 85%           │
│  • Signal: Strong         │
├──────────────────────────┤
│ [REFRESH] [GALLERY] [LIVE]│
├──────────────────────────┤
│  ⚠️ 3 ALERTS (last 7d)   │
│  • Motion (Deck) - 11/13  │
│  • Battery Low (Port) - 11/13 │
│  • Manual Check - 11/13   │
├──────────────────────────┤
│ [🎥 CAMERAS] [⚙️ SETTINGS]│
└──────────────────────────┘
```

**UI Components:**
- Large snapshot thumbnail (280px width, 16:9 aspect)
- Timestamp relative ("2 min ago")
- Quick stats overlay: motion, people, battery
- 1-tap refresh for latest snapshot
- Tap image → full screen viewer
- Tap alert → details + linked snapshot

### 4.2 Camera Gallery (Chronological Feed)

**Screen 2: Snapshot Gallery (Infinite Scroll)**

```
┌──────────────────────────┐
│ 🎥 CAMERA GALLERY        │
│ [Filter ▼] [Sort ▼]     │
├──────────────────────────┤
│📅 Nov 13, 2025          │
│ ┌─────────┬─────────┐   │
│ │[THUMB]  │[THUMB]  │   │
│ │14:32    │14:15    │   │ 2x2 grid layout
│ │Motion   │Manual   │   │
│ └─────────┴─────────┘   │
│ ┌─────────┬─────────┐   │
│ │[THUMB]  │[THUMB]  │   │
│ │13:47    │13:22    │   │
│ │Alert    │Motion   │   │
│ └─────────┴─────────┘   │
│                          │
│📅 Nov 12, 2025          │
│ ┌─────────┬─────────┐   │
│ │[THUMB]  │[THUMB]  │   │
│ │22:15    │20:03    │   │
│ │Battery  │Manual   │   │
│ │Low      │         │   │
│ └─────────┴─────────┘   │
│                          │
│ [Load More...]           │
└──────────────────────────┘

FILTER PANEL (Slide-up):
├─ Event Type: ☑️ All ☑️ Motion ☐ Alert ☐ Manual
├─ Camera: ☑️ All ☑️ Deck ☑️ Salon ☐ Helm
├─ Severity: ☑️ All ☑️ Warning ☐ Critical
├─ Date Range: [Picker]
└─ [APPLY FILTERS]
```

**UI Features:**
- Infinite scroll (lazy load)
- Date-grouped sections (collapsible)
- 2x2 thumbnail grid (140px × 105px each)
- Filter panel slide-up (bottom sheet)
- Tap thumbnail → full screen + details

### 4.3 Snapshot Details & Viewer

**Screen 3: Full Screen Image Viewer**

```
┌──────────────────────────┐
│ ← [Gallery]    [More ⋯]  │ Header
├──────────────────────────┤
│                          │
│    ┌──────────────────┐  │
│    │                  │  │
│    │  [FULL IMAGE]    │  │ Swipeable
│    │                  │  │ full screen
│    └──────────────────┘  │
│                          │
├──────────────────────────┤
│ Deck Camera              │
│ 2025-11-13 14:32:00     │ Timestamp
│ Motion Detected          │ Event type
├──────────────────────────┤
│ ANALYSIS:                │
│ 🟢 Person detected (94%) │
│ 🟡 Boat detected (87%)   │
│ 🔵 Equipment detected    │
│ • Tender (Zodiac 310)    │
├──────────────────────────┤
│ METADATA:                │
│ 🔋 Battery: 85%          │
│ 📶 Signal: -55dBm        │
│ 🎥 Model: Hikvision...   │
├──────────────────────────┤
│ [Share] [Save] [Delete]  │
└──────────────────────────┘

MORE MENU (Dropdown):
├─ Link to Inventory Item
├─ Link to Alert
├─ Set as Boat Profile Pic
├─ Download Original
├─ Delete Snapshot
└─ Report Issue
```

**CV Detection Visualization:**
- Bounding boxes overlaid on image (toggleable)
- Confidence score displayed
- Tap detection → auto-populate inventory if equipment detected

### 4.4 Live Camera Feed

**Screen 4: Live View (If HLS Available)**

```
┌──────────────────────────┐
│ ← [Back]   Deck Camera   │
├──────────────────────────┤
│  ┌──────────────────────┐│
│  │  [LIVE STREAM]       ││
│  │  Connected           ││
│  │  720p 30fps          ││
│  │  Bitrate: 2.5Mbps    ││
│  │                      ││
│  │  [PLAY] [PAUSE]      ││
│  │                      ││
│  └──────────────────────┘│
├──────────────────────────┤
│ Connection Status:       │
│ ✅ Home Assistant        │
│ ✅ Camera Online         │
│ ✅ Streaming             │
│ ✅ Battery: 92%          │
├──────────────────────────┤
│ [📸 SNAPSHOT] [⚙️ Settings]│
│ [💾 RECORD]  [🔊 Audio]  │
└──────────────────────────┘
```

**Technical Implementation:**
- HLS stream via video.js
- Fallback to MJPEG if HLS unavailable
- Reconnect on network interruption
- Tap to fullscreen (potrait + landscape)

### 4.5 Alerts & Notifications Panel

**Screen 5: Alert Details**

```
┌──────────────────────────┐
│ 🔔 ALERTS                │
│ [Filter ▼]               │
├──────────────────────────┤
│ TODAY                    │
│ ┌──────────────────────┐ │
│ │🔴 CRITICAL           │ │
│ │Motion + Intruder      │ │
│ │Deck Camera, 14:32    │ │
│ │[VIEW SNAPSHOT]       │ │
│ │[CALL MARINA] [EMAIL] │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │🟠 WARNING            │ │
│ │Battery Low (43%)     │ │
│ │Salon Camera, 12:15   │ │
│ │[ACKNOWLEDGED]        │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ℹ️ INFO               │ │
│ │Manual Snapshot       │ │
│ │Deck Camera, 10:45    │ │
│ │User: John Owner      │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

**Features:**
- Color-coded severity (red, orange, blue)
- Context menu for each alert
- Quick actions: "Acknowledge", "Call Marina", "Email Mechanic"
- Filter by severity, date, camera

### 4.6 Camera Configuration

**Screen 6: Camera Settings**

```
┌──────────────────────────┐
│ ⚙️ CAMERA SETTINGS       │
│                          │
│ DECK CAMERA              │
│ Hikvision DS-2CD2043G0-I │
│ ✅ Online, Connected     │
├──────────────────────────┤
│ ⚙️ GENERAL               │
│ • Camera Name            │
│   [Deck Camera (Port)]   │
│ • Location Zone          │
│   [Deck ▼]              │
│ • Recording Enabled      │
│   [Toggle ✓]             │
│                          │
│ 🔔 ALERTS                │
│ • Motion Detection       │
│   [Toggle ✓]             │
│ • Battery Low Alert      │
│   [Toggle ✓]             │
│ • Offline Alert          │
│   [Toggle ✓]             │
│                          │
│ 🤖 AI DETECTION          │
│ • Enable Object Detection│
│   [Toggle ✓]             │
│ • Detection Models       │
│   [YOLOv8-Equipment ▼]   │
│ • Confidence Threshold   │
│   [0.85 ──────●──────1.0]│
│                          │
│ 📊 STATISTICS            │
│ • Uptime: 98%            │
│ • Avg Resolution: 1080p  │
│ • Snapshots (7d): 142    │
│ • Storage Used: 1.2 GB   │
│                          │
│ [🔄 RECONNECT] [🗑️ FORGET]│
└──────────────────────────┘
```

**Configuration Options:**
- Enable/disable per-camera
- Adjust alert thresholds
- Select CV models to run
- View statistics + troubleshooting

---

## 5. Computer Vision Integration Proposal

### 5.1 Responding to S2-H02 Inventory Detection Request

**Integration Approach: Hybrid Manual + Camera-Assisted Detection**

The camera system can significantly enhance inventory tracking through computer vision. Rather than replacing manual entry, cameras provide:

1. **Auto-Detection of High-Value Items:**
   - Tender/Zodiac boats (theft detection)
   - Marine electronics (radar, chartplotter, VHF)
   - Safety equipment (life rafts, flotation devices)
   - Expensive deck equipment (anchors, winches)

2. **Confidence-Based Workflow:**
   - High confidence (>90%): Auto-populate inventory suggestion
   - Medium confidence (75-90%): Show to user for verification
   - Low confidence (<75%): Flag for manual review

3. **Snapshot-to-Inventory Pipeline:**
   ```
   Camera snapshot received
     ↓ (CV analysis)
   Equipment detected (tender: 94% conf)
     ↓ (exceeds threshold)
   Create inventory suggestion
     ↓ (show to user)
   User reviews + confirms
     ↓ (links to inventory item)
   Snapshot tagged with inventory ID
   ```

### 5.2 CV Model Selection

**Recommended Model Stack:**

**Primary: YOLOv8 Custom Fine-Tuning**
- Pre-train on COCO dataset (general objects)
- Fine-tune on marine equipment photos
- Target classes:
  - `tender` (Zodiac, Rib, Dinghy)
  - `person` (intruder detection)
  - `radar_antenna`
  - `chartplotter`
  - `solar_panels`
  - `outboard_motor`
  - `anchor`
  - `life_raft`
  - `vhf_antenna`
  - `instrument_cluster`

**Fallback: YOLO-Marine (Open Source)**
- Pre-trained specifically for boat equipment
- Ready-to-use, no fine-tuning needed
- Covers basic marine object classes

**Optional: Seasonal Anomaly Detection**
- Track equipment presence over time
- Alert if tender suddenly missing (theft detection)
- Alert if solar panels covered (weather damage)
- Alert if hatch left open (security/weather risk)

### 5.3 CV Processing Architecture

**Inference Location Options:**

**Option A: Edge Computing (Recommended for Boats)**
```
Home Assistant Instance
  → YOLOv8 inference (on-device)
  → Send results + snapshot to NaviDocs
  → Benefit: No internet needed for detection
  → Cost: Requires HA instance with GPU (NUC + RTX 4060 ~€500)
```

**Option B: Cloud Processing (Simpler)**
```
Snapshot → NaviDocs
  → Queue to CV worker
  → Run YOLOv8 on backend (GPU instance)
  → Store results in cv_analysis table
  → Benefit: No hardware cost, scalable
  → Cost: Latency (30-60s), internet bandwidth
```

**Option C: Hybrid (Best Balance)**
```
Boat with Home Assistant + GPU NUC:
  → Run YOLOv8 locally (instant results)
  → Send results + snapshot to NaviDocs
  → NaviDocs validates results (optional re-inference)

Boat with Home Assistant only (no GPU):
  → Send snapshot to NaviDocs
  → NaviDocs runs YOLOv8 on backend
  → Return results to app
```

**Recommended Implementation:** Hybrid approach
- HA runs YOLOv8 if available (instant)
- NaviDocs re-runs on backend for verification (audit trail)
- Mobile app gets both local + server results

### 5.4 Inventory Detection Integration

**Database Schema Update** (extends camera_snapshots):

```sql
ALTER TABLE camera_snapshots ADD COLUMN (
  ai_detection_enabled BOOLEAN DEFAULT FALSE,
  detected_equipment TEXT,  -- JSON array of detected items
  equipment_suggestions JSON  -- [{item_class: "tender", confidence: 0.94, inventory_match: "inv-tender-001"}]
);

CREATE TABLE camera_equipment_detections (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL,
  boat_id TEXT NOT NULL,

  -- Detection metadata
  equipment_class TEXT,  -- 'tender', 'radar', 'chartplotter', etc.
  confidence REAL,
  bounding_box JSON,  -- {x, y, width, height} normalized coords

  -- Inventory linking
  suggested_inventory_id TEXT,  -- FK to boat_inventory
  user_confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at DATETIME,
  confirmed_by_user_id TEXT,

  -- Historical tracking
  first_detected DATETIME,
  last_detected DATETIME,
  detection_count INTEGER,  -- How many times seen in photos

  -- Anomaly detection
  is_missing BOOLEAN DEFAULT FALSE,  -- Not seen in last N days
  days_since_last_seen INTEGER,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (snapshot_id) REFERENCES camera_snapshots(id),
  FOREIGN KEY (boat_id) REFERENCES entities(id),
  FOREIGN KEY (suggested_inventory_id) REFERENCES boat_inventory(id),
  INDEX idx_boat_class (boat_id, equipment_class, last_detected DESC),
  INDEX idx_missing (boat_id, is_missing)
);
```

**Inventory Suggestion Workflow:**

```javascript
// server/services/cv-analysis.service.js

async function analyzeSnapshotForInventory(snapshotId, boatId) {
  // 1. Run CV inference
  const detections = await runYOLOv8(snapshotId);

  // 2. Filter high-confidence equipment
  const equipmentDetections = detections.filter(
    d => BOAT_EQUIPMENT_CLASSES.includes(d.class) && d.confidence > 0.75
  );

  // 3. Match against existing inventory
  const suggestions = [];
  for (const detection of equipmentDetections) {
    // Find similar items in inventory
    const existingItems = await db.query(
      'SELECT * FROM boat_inventory WHERE boat_id = ? AND category = ?',
      [boatId, detection.class]
    );

    // If no match, create suggestion
    if (existingItems.length === 0) {
      suggestions.push({
        equipment_class: detection.class,
        confidence: detection.confidence,
        bounding_box: detection.bbox,
        action: 'CREATE_NEW_INVENTORY_ITEM'
      });
    } else if (existingItems.length === 1) {
      // Single match - auto-link
      suggestions.push({
        equipment_class: detection.class,
        confidence: detection.confidence,
        suggested_inventory_id: existingItems[0].id,
        action: 'LINK_EXISTING_ITEM'
      });
    } else {
      // Multiple possible matches - ask user
      suggestions.push({
        equipment_class: detection.class,
        confidence: detection.confidence,
        possible_matches: existingItems.map(i => ({id: i.id, name: i.item_name})),
        action: 'USER_CONFIRM_MATCH'
      });
    }
  }

  // 4. Store suggestions
  await db.query(
    'UPDATE camera_snapshots SET equipment_suggestions = ? WHERE id = ?',
    [JSON.stringify(suggestions), snapshotId]
  );

  // 5. Push notification to user (if high confidence)
  const highConfidenceSuggestions = suggestions.filter(s => s.confidence > 0.90);
  if (highConfidenceSuggestions.length > 0) {
    await notificationService.sendPush(boatId, {
      title: 'Equipment Detected',
      body: `Found ${highConfidenceSuggestions.length} item(s) in latest photo`,
      action: 'REVIEW_SUGGESTIONS'
    });
  }
}
```

**Mobile UI for Equipment Suggestions:**

```
┌──────────────────────────┐
│ 🤖 EQUIPMENT DETECTED    │
│                          │
│ We found these items in  │
│ your latest photos:      │
│                          │
│ ☑️ Tender: Zodiac 310    │
│    (94% confident)       │
│    [Link to Existing]    │
│                          │
│ ☑️ Radar Antenna         │
│    (87% confident)       │
│    [Add as New Item]     │
│                          │
│ ☑️ Life Raft (red)       │
│    (78% confident)       │
│    [Confirm] [Skip]      │
│                          │
│ [CONFIRM ALL]            │
└──────────────────────────┘
```

### 5.5 Theft & Anomaly Detection

**Missing Equipment Alert:**
```sql
-- Daily job: Check if equipment not detected in past 7 days
SELECT equipment_class, COUNT(*) as detection_count
FROM camera_equipment_detections
WHERE boat_id = 'boat-123'
  AND is_missing = FALSE
  AND last_detected < DATE('now', '-7 days')
GROUP BY equipment_class;

-- For each missing item:
-- 1. Update is_missing = TRUE
-- 2. Send alert: "Tender not detected in 7 days - check boat"
-- 3. Suggest marina inspection
```

**Anomaly Scoring:**
```python
# Historical baseline: avg objects detected per snapshot
baseline_objects = 45  # Historical average

# Current snapshot
current_objects = 12

# Anomaly score
anomaly_score = 1 - (current_objects / baseline_objects)  # 0.73 (unusual!)

# Alert if anomaly_score > 0.6 (60% fewer objects than baseline)
if anomaly_score > 0.6:
  send_alert("Unusual activity: boat looks different", severity="warning")
```

---

## 6. Security & Rate Limiting

### 6.1 Webhook Authentication & Validation

**HMAC-SHA256 Signature Validation:**

```javascript
// server/routes/webhooks.js

async function validateHomeAssistantWebhook(req, res, next) {
  const signature = req.headers['x-ha-signature'];
  const boatId = req.body.boat_id;

  if (!signature || !boatId) {
    return res.status(401).json({ error: 'Missing signature or boat_id' });
  }

  // 1. Retrieve HA API token from database
  const boat = await db.query('SELECT ha_api_token FROM entities WHERE id = ?', [boatId]);
  if (!boat) {
    return res.status(403).json({ error: 'Boat not found' });
  }

  // 2. Calculate expected signature
  const bodyString = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', boat.ha_api_token)
    .update(bodyString)
    .digest('hex');

  // 3. Constant-time comparison (prevent timing attacks)
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 4. Verify timestamp (prevent replay attacks)
  const eventAge = Date.now() - new Date(req.body.timestamp).getTime();
  const MAX_AGE_MS = 5 * 60 * 1000;  // 5 minutes
  if (eventAge > MAX_AGE_MS) {
    return res.status(400).json({ error: 'Event too old (replay attack?)' });
  }

  next();
}
```

### 6.2 Rate Limiting

**Per-Endpoint Rate Limits:**

```javascript
// server/config/rate-limits.js

const rateLimits = {
  // Webhook: 100 events/minute per boat (normal HA automation)
  'POST /api/webhooks/events/home-assistant': {
    windowMs: 60 * 1000,
    max: 100,
    keyGenerator: (req) => req.body.boat_id,
    message: 'Too many camera events from this boat'
  },

  // Snapshot gallery: 60 requests/minute per user
  'GET /api/boats/:boat_id/snapshots': {
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => req.user.id,
    message: 'Too many gallery requests'
  },

  // Live feed: 10 stream connections/minute per user
  'GET /api/boats/:boat_id/live-feeds': {
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user.id,
    message: 'Too many live stream requests'
  },

  // Storage upload: 50 uploads/hour per boat
  'POST /api/boats/:boat_id/snapshots/upload': {
    windowMs: 60 * 60 * 1000,
    max: 50,
    keyGenerator: (req) => req.body.boat_id,
    message: 'Snapshot upload quota exceeded'
  }
};
```

### 6.3 Image Delivery Security

**S3 Signed URLs (Time-Limited Access):**

```javascript
// server/services/snapshot.service.js

async function getSnapshotUrl(snapshotId, boat_id, expiryMinutes = 10) {
  const snapshot = await db.query(
    'SELECT storage_path FROM camera_snapshots WHERE id = ? AND boat_id = ?',
    [snapshotId, boat_id]
  );

  if (!snapshot) {
    throw new Error('Snapshot not found');
  }

  // Generate signed URL (expires in 10 minutes)
  const url = await s3.getSignedUrl('getObject', {
    Bucket: 'navidocs-snapshots',
    Key: snapshot.storage_path,
    Expires: expiryMinutes * 60
  });

  return url;
}
```

**Benefits:**
- S3 validates URL signature before serving
- App never receives permanent URL (can't be shared)
- Expires automatically (default 10 min)
- No token stored in browser history

### 6.4 Tenant Isolation

**Verify boat_id Ownership:**

```javascript
// server/middleware/authorize-boat.js

async function authorizeBoot(req, res, next) {
  const boatId = req.params.boat_id;
  const userId = req.user.id;

  // Check user has permission to this boat
  const permission = await db.query(
    `SELECT * FROM boat_permissions
     WHERE boat_id = ? AND user_id = ? AND permission_level IN ('owner', 'captain', 'viewer')`,
    [boatId, userId]
  );

  if (!permission) {
    return res.status(403).json({ error: 'Access denied to this boat' });
  }

  // Store in context for downstream middleware
  req.boatId = boatId;
  req.boatPermission = permission.permission_level;

  next();
}
```

**Permission Levels:**
- `owner`: Full access (view, configure, delete snapshots)
- `captain`: View access (gallery, live feeds, alerts)
- `viewer`: Read-only (gallery, no configuration)

### 6.5 If.TTT Audit Trail

**Every snapshot linked to audit entry:**

```sql
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  boat_id TEXT NOT NULL,
  entity_type TEXT,  -- 'camera_snapshot', 'alert', 'inventory_suggestion'
  entity_id TEXT,
  action TEXT,  -- 'created', 'viewed', 'linked', 'deleted'
  performed_by TEXT,  -- user_id or 'home-assistant'
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  signature TEXT,  -- Ed25519 signature for tamper detection
  hash TEXT,  -- SHA-256 hash of full event
  FOREIGN KEY (boat_id) REFERENCES entities(id),
  INDEX idx_boat_timestamp (boat_id, timestamp DESC)
);
```

**Signature Generation:**
```javascript
const crypto = require('crypto');
const ed25519 = require('ed25519');

async function signAuditEvent(event, privateKey) {
  const eventString = JSON.stringify(event);
  const hash = crypto.createHash('sha256').update(eventString).digest('hex');
  const signature = ed25519.sign(Buffer.from(eventString), privateKey);

  return {
    ...event,
    hash,
    signature: signature.toString('hex'),
    signature_public_key: privateKey.publicKey
  };
}
```

---

## 7. Implementation Roadmap

### Week 1: Foundation (Priority)
- [ ] Webhook receiver endpoint (`POST /api/webhooks/events/home-assistant`)
- [ ] Snapshot storage schema (database table creation)
- [ ] HMAC-SHA256 signature validation
- [ ] Rate limiting middleware
- [ ] S3 integration for snapshot storage

### Week 2: Gallery & UI
- [ ] Snapshot gallery API (`GET /api/boats/{boat_id}/snapshots`)
- [ ] Mobile UI screens (gallery, details, viewer)
- [ ] Thumbnail generation pipeline
- [ ] Filter/sort functionality

### Week 3: Live Feeds & Alerts
- [ ] Live feed discovery API
- [ ] HLS/RTSP proxy implementation
- [ ] Alert creation & notification API
- [ ] Computer vision integration (YOLOv8)

### Week 4: Polish & Optimization
- [ ] Auto-cleanup job (30-day retention)
- [ ] Anomaly detection (missing equipment alerts)
- [ ] Statistics dashboard
- [ ] Integration testing with Home Assistant

### Post-Launch: Enhancement
- [ ] Mobile app offline mode (snapshot caching)
- [ ] Custom CV models fine-tuning
- [ ] Seasonal anomaly detection
- [ ] Encrypted cloud backup

---

## 8. Dependencies & Integration Points

**Depends On:**
- S2-H01: Codebase architecture analysis (API patterns)
- S2-H02: Inventory tracking schema (equipment detection linking)
- S2-H10: Architecture synthesis (webhook event bus)

**Feeds Into:**
- S2-H02: Camera equipment detection suggestions
- S2-H05: Quick actions ("Call Marina" from alert)
- S2-H07: Search integration (snapshots by equipment detected)
- S2-H08: WhatsApp integration ("Show me latest photo")

**External Integrations:**
- Home Assistant instance (webhook sender)
- S3/cloud storage (snapshot files)
- Mobile app (UI implementation)

---

## 9. Success Criteria

**MVP Launch:**
- [ ] Webhook receives Home Assistant events (motion, battery, alerts)
- [ ] Snapshots stored in S3 with 30-day retention
- [ ] Gallery loads 20 snapshots in <2 seconds
- [ ] Thumbnail generation completes in <10 seconds
- [ ] CV detection identifies tender with >90% confidence
- [ ] Rate limiting prevents abuse (100 events/min)
- [ ] Signature validation prevents replay attacks
- [ ] IF.TTT audit trail logged for every snapshot

**User Experience:**
- [ ] "Is my boat OK?" quick check shows latest snapshot
- [ ] Gallery filters work intuitively
- [ ] CV suggestions linked to inventory with 1 tap
- [ ] Alerts reach user in <30 seconds
- [ ] Live feed available for main cabin camera

**Security:**
- [ ] Zero unencrypted snapshots in storage
- [ ] All APIs require authentication
- [ ] Tenant isolation tested + documented
- [ ] Rate limits prevent resource exhaustion
- [ ] Signed URLs prevent URL sharing

---

## Conclusion

This camera integration system provides boat owners with the peace-of-mind monitoring they need for a critical use case: "Is my boat OK when I'm not there?" By combining Home Assistant's flexibility, real-time webhook events, intelligent computer vision analysis, and mobile-first UI design, NaviDocs becomes indispensable to daily boat ownership.

The hybrid manual + camera-assisted inventory detection approach responds to S2-H02's needs while maintaining simplicity and high confidence levels. The security hardening prevents common webhook attack vectors (replay, signature forgery, rate-based DDoS).

**Next: S2-H10 synthesizes all 11 agent specs into a unified technical architecture document.**

---

**Document Generated:** 2025-11-13
**Agent:** S2-H04 (Haiku)
**Confidence:** 0.92
**Token Cost:** ~3,500 tokens
