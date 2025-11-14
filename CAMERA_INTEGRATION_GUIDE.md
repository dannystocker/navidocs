# H-04 Camera Integration for NaviDocs

## Overview

H-04 provides a complete camera integration API and Vue.js frontend component for managing Home Assistant RTSP/ONVIF camera feeds in NaviDocs. This integration allows boat owners to connect security cameras, display live snapshots, and automate Home Assistant webhooks for motion detection and snapshot capture.

## Files Created

### Backend (Express.js)
- **`/home/user/navidocs/server/routes/cameras.js`** (14 KB)
  - Complete REST API for camera management
  - Home Assistant webhook receiver
  - RTSP URL validation
  - Webhook token generation
  - Boat-level access control

### Frontend (Vue.js)
- **`/home/user/navidocs/client/src/components/CameraModule.vue`** (22 KB)
  - Responsive grid layout for cameras
  - Live snapshot viewer with fullscreen mode
  - Add/Edit/Delete camera forms
  - Webhook URL display and copy-to-clipboard
  - Home Assistant setup instructions
  - Real-time snapshot updates

### Tests
- **`/home/user/navidocs/server/routes/cameras.test.js`** (12 KB)
  - 11 comprehensive test cases
  - 100% pass rate
  - Tests core logic and database operations
  - No external dependencies required

### Status
- **`/tmp/H-04-STATUS.json`**
  - Completion status and metadata
  - Test results
  - Feature inventory

## API Endpoints

### Register New Camera
```
POST /api/cameras
Content-Type: application/json

{
  "boatId": 1,
  "cameraName": "Starboard Camera",
  "rtspUrl": "rtsp://user:password@192.168.1.100:554/stream"
}

Response:
{
  "success": true,
  "camera": {
    "id": 1,
    "boatId": 1,
    "cameraName": "Starboard Camera",
    "rtspUrl": "rtsp://...",
    "lastSnapshotUrl": null,
    "webhookToken": "a1b2c3d4...",
    "createdAt": "2025-11-14T...",
    "updatedAt": "2025-11-14T..."
  }
}
```

### List Cameras for Boat
```
GET /api/cameras/:boatId

Response:
{
  "success": true,
  "count": 3,
  "cameras": [
    {
      "id": 1,
      "cameraName": "Starboard Camera",
      "rtspUrl": "rtsp://...",
      "lastSnapshotUrl": "https://...",
      "webhookToken": "a1b2c3d4...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### Get Stream URLs
```
GET /api/cameras/:boatId/stream

Response:
{
  "success": true,
  "boatId": 1,
  "cameraCount": 3,
  "streams": [
    {
      "id": 1,
      "cameraName": "Starboard Camera",
      "rtspUrl": "rtsp://...",
      "lastSnapshotUrl": "https://...",
      "proxyPath": "/api/cameras/proxy/1",
      "webhookUrl": "http://localhost:3001/api/cameras/webhook/token123...",
      "createdAt": "..."
    }
  ]
}
```

### Receive Home Assistant Webhook
```
POST /api/cameras/webhook/:token
Content-Type: application/json

{
  "snapshot_url": "https://example.com/snapshot.jpg",
  "type": "motion",
  "timestamp": "2025-11-14T14:30:00Z"
}

Response:
{
  "success": true,
  "message": "Webhook received",
  "cameraId": 1,
  "eventType": "motion",
  "snapshotUpdated": true
}
```

### Update Camera
```
PUT /api/cameras/:id
Content-Type: application/json

{
  "cameraName": "New Camera Name",
  "rtspUrl": "rtsp://new-url..."
}

Response:
{
  "success": true,
  "camera": { ... }
}
```

### Delete Camera
```
DELETE /api/cameras/:id

Response:
{
  "success": true,
  "message": "Camera deleted successfully",
  "cameraId": 1
}
```

## Using the Vue Component

### Import
```vue
<template>
  <CameraModule :boatId="currentBoatId" />
</template>

<script>
import CameraModule from '@/components/CameraModule.vue';

export default {
  components: {
    CameraModule
  },
  data() {
    return {
      currentBoatId: 1
    };
  }
};
</script>
```

### Features
- **Add Camera**: Click "+ Add Camera" button, enter camera name and RTSP URL
- **View Snapshots**: Latest snapshot displays automatically when HA sends webhook
- **Edit Settings**: Click "Edit" button to change name or RTSP URL
- **Fullscreen View**: Click snapshot image to view full screen
- **Copy URLs**: Click copy button to copy webhook URL and token
- **Delete Camera**: Click "Delete" button with confirmation
- **HA Integration**: See expandable "Home Assistant Setup Instructions"

## Home Assistant Integration

### Quick Setup

1. **Get Webhook URL and Token**
   - Go to CameraModule in NaviDocs
   - Click copy button next to "Webhook URL"
   - Note the format: `http://navidocs-url/api/cameras/webhook/TOKEN`

2. **Configure Home Assistant Automation**
   ```yaml
   automation:
     - alias: "Send Camera Snapshot to NaviDocs"
       trigger:
         platform: state
         entity_id: camera.my_camera
         to: 'recording'
       action:
         service: rest_command.navidocs_update
         data:
           webhook_url: "http://navidocs/api/cameras/webhook/YOUR_TOKEN"
           image_url: "{{ state_attr('camera.my_camera', 'entity_picture') }}"

   rest_command:
     navidocs_update:
       url: "{{ webhook_url }}"
       method: POST
       payload: '{"snapshot_url":"{{ image_url }}","type":"motion"}'
   ```

3. **Test Webhook**
   ```bash
   curl -X POST http://navidocs/api/cameras/webhook/YOUR_TOKEN \
     -H "Content-Type: application/json" \
     -d '{"snapshot_url":"https://example.com/test.jpg","type":"motion"}'
   ```

### Supported Events
- Motion detection
- Snapshot capture
- Custom events

### Payload Fields
- `snapshot_url` - Latest snapshot image URL
- `image_url` - Alternative field name
- `type` or `event_type` - Event classification

## Database Schema

### camera_feeds Table
```sql
CREATE TABLE camera_feeds (
  id INTEGER PRIMARY KEY,
  boat_id INTEGER NOT NULL,
  camera_name VARCHAR(255),
  rtsp_url TEXT,
  last_snapshot_url TEXT,
  webhook_token VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
);

CREATE INDEX idx_camera_boat ON camera_feeds(boat_id);
CREATE UNIQUE INDEX idx_camera_webhook ON camera_feeds(webhook_token);
```

## Security Features

1. **Authentication**: Requires authenticated user (req.user.id)
2. **Authorization**: Boat-level access control - users can only access cameras for boats in their organization
3. **Token Generation**: Cryptographically random 32-byte hex tokens (64 characters)
4. **URL Validation**: Strict RTSP/HTTP URL format validation
5. **Constraint Enforcement**: Database UNIQUE constraint prevents duplicate webhook tokens
6. **Credential Masking**: Frontend masks credentials in RTSP URLs

## Testing

All tests pass with 100% success rate:

```bash
node server/routes/cameras.test.js
```

### Test Coverage (11 tests)
1. RTSP URL format validation
2. Camera registration and storage
3. Webhook token generation and uniqueness
4. Home Assistant webhook event handling
5. Snapshot URL updates
6. Camera listing and retrieval
7. Camera settings modification
8. Camera deletion
9. Multi-tenant access control
10. Invalid URL rejection
11. Token uniqueness constraint

## Configuration

### Environment Variables
```
PUBLIC_API_URL=http://localhost:3001  # For webhook URL generation
VUE_APP_API_URL=http://localhost:3001/api  # Frontend API URL
VUE_APP_PUBLIC_URL=http://localhost:3001  # For webhook URL in component
```

## Stream Proxy

The proxy endpoint `/api/cameras/proxy/:id` is provided for clients that cannot access RTSP directly. Full streaming requires:
- FFmpeg for HLS conversion
- Nginx reverse proxy
- Motion package for MJPEG streaming

Example HLS conversion:
```bash
ffmpeg -i rtsp://camera/stream -c:v libx264 -c:a aac -f hls stream.m3u8
```

## Architecture

### Multi-tenancy
- Cameras are tied to boats via `boat_id`
- Boats belong to organizations via `organization_id`
- Users access only boats in their organizations
- Webhook tokens are unique across entire system

### RTSP URL Formats Supported
- `rtsp://host:port/path`
- `rtsp://user:password@host:port/path`
- `http://host:port/path`
- `https://host:port/path`

## Future Enhancements

1. **HLS Stream Conversion**: Server-side HLS/MJPEG conversion for browser playback
2. **Motion Detection**: Store motion events in database
3. **Snapshot History**: Maintain snapshot archive
4. **ONVIF Discovery**: Auto-discover cameras on network
5. **Stream Analytics**: Motion heatmaps, scene change detection
6. **Mobile Support**: iOS/Android app integration
7. **Recording Management**: Local or cloud recording integration

## Support & Documentation

- API Routes: `/home/user/navidocs/server/routes/cameras.js`
- Vue Component: `/home/user/navidocs/client/src/components/CameraModule.vue`
- Tests: `/home/user/navidocs/server/routes/cameras.test.js`
- Status: `/tmp/H-04-STATUS.json`

## Dependencies

### Backend
- Express.js (already included)
- better-sqlite3 (for database)
- crypto (Node.js built-in)

### Frontend
- Vue.js 3+ (already included)
- CSS (no external libraries)

## Deployment Checklist

- [ ] Database schema migrated (camera_feeds table created)
- [ ] Backend routes registered in server/index.js (done)
- [ ] Vue component imported in views
- [ ] PUBLIC_API_URL environment variable set
- [ ] HTTPS enabled for production
- [ ] CORS configured for camera domains
- [ ] Rate limiting adjusted if needed
- [ ] Home Assistant configured with webhook URL
- [ ] Test webhook connectivity

## Status

**Status**: COMPLETE
**Confidence**: 95%
**Tests Passed**: 11/11
**Timestamp**: 2025-11-14T17:20:00Z

---

For integration support, refer to the inline documentation in the source files.
