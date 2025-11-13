# Feature Spec: Organization Timeline

**Priority:** P1 (Core Demo Feature)
**Estimated Time:** 2-3 hours
**User Story:** "As a boat owner, I want to see a chronological timeline of all activities (uploads, maintenance, warranty events) for my organization, with most recent at top."

---

## Requirements

### Functional Requirements
1. **Timeline View** - Dedicated page showing chronological activity feed
2. **Organization Scoped** - Only show events for current user's organization
3. **Reverse Chronological** - Most recent first (top), oldest last (bottom)
4. **Event Types:**
   - Document uploads (PDFs, images, manuals)
   - Maintenance records
   - Warranty claims/alerts
   - Service provider contacts
   - Settings changes (future)
   - User invitations (future)

### UI Requirements
- **Timeline URL:** `/timeline` or `/organization/:orgId/timeline`
- **Visual Design:** Vertical timeline with date markers
- **Grouping:** Group events by date (Today, Yesterday, Last Week, etc.)
- **Infinite Scroll:** Load more as user scrolls down
- **Filters:** Filter by event type, date range, entity (specific boat)

---

## Database Schema

### Option 1: Unified Activity Log Table (Recommended)

**New Migration:** `010_activity_timeline.sql`

```sql
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  entity_id TEXT,  -- Optional: boat/yacht ID if event is entity-specific
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'document_upload', 'maintenance_log', 'warranty_claim', 'settings_change'
  event_action TEXT,  -- 'created', 'updated', 'deleted', 'viewed'
  event_title TEXT NOT NULL,
  event_description TEXT,
  metadata TEXT,  -- JSON blob for event-specific data
  reference_id TEXT,  -- ID of related resource (document_id, maintenance_id, etc.)
  reference_type TEXT,  -- 'document', 'maintenance', 'warranty', etc.
  created_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES boats(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_activity_org_created ON activity_log(organization_id, created_at DESC);
CREATE INDEX idx_activity_entity ON activity_log(entity_id, created_at DESC);
CREATE INDEX idx_activity_type ON activity_log(event_type);
```

**Example Records:**

```json
{
  "id": "evt_abc123",
  "organization_id": "6ce0dfc7-f754-4122-afde-85154bc4d0ae",
  "entity_id": "boat_azimut55s",
  "user_id": "bef71b0c-3427-485b-b4dd-b6399f4d4c45",
  "event_type": "document_upload",
  "event_action": "created",
  "event_title": "Owner Manual - Azimut 55S",
  "event_description": "PDF uploaded: Liliane1_Prestige_Manual_EN.pdf (6.7MB, 100 pages)",
  "metadata": "{\"fileSize\": 6976158, \"pageCount\": 100, \"mimeType\": \"application/pdf\"}",
  "reference_id": "efb25a15-7d84-4bc3-b070-6bd7dec8d59a",
  "reference_type": "document",
  "created_at": 1760903255
}

{
  "id": "evt_def456",
  "organization_id": "6ce0dfc7-f754-4122-afde-85154bc4d0ae",
  "entity_id": "boat_azimut55s",
  "user_id": "bef71b0c-3427-485b-b4dd-b6399f4d4c45",
  "event_type": "maintenance_log",
  "event_action": "created",
  "event_title": "Bilge Pump Service",
  "event_description": "Replaced bilge pump filter, tested operation",
  "metadata": "{\"cost\": 245.50, \"provider\": \"Marine Services Ltd\", \"nextServiceDue\": 1776903255}",
  "reference_id": "maint_xyz789",
  "reference_type": "maintenance",
  "created_at": 1761007118
}
```

### Option 2: Event Sourcing (More Complex, Skip for MVP)
- Separate tables per event type
- Aggregate into timeline via JOIN
- Better for audit trails, overkill for MVP

---

## API Endpoints

### GET /api/organizations/:orgId/timeline

**Query Parameters:**
- `limit` (default: 50, max: 200)
- `offset` (default: 0) - For pagination
- `eventType` (optional) - Filter: document_upload, maintenance_log, warranty_claim
- `entityId` (optional) - Filter by specific boat
- `startDate` (optional) - Unix timestamp
- `endDate` (optional) - Unix timestamp

**Response:**
```json
{
  "events": [
    {
      "id": "evt_abc123",
      "eventType": "document_upload",
      "eventAction": "created",
      "title": "Owner Manual - Azimut 55S",
      "description": "PDF uploaded: Liliane1_Prestige_Manual_EN.pdf",
      "createdAt": 1761007118620,
      "user": {
        "id": "bef71b0c-3427-485b-b4dd-b6399f4d4c45",
        "name": "Test User 2",
        "email": "test2@navidocs.test"
      },
      "entity": {
        "id": "boat_azimut55s",
        "name": "Liliane I",
        "type": "boat"
      },
      "metadata": {
        "fileSize": 6976158,
        "pageCount": 100
      },
      "referenceId": "efb25a15-7d84-4bc3-b070-6bd7dec8d59a",
      "referenceType": "document"
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  },
  "groupedByDate": {
    "today": 5,
    "yesterday": 12,
    "thisWeek": 23,
    "thisMonth": 45,
    "older": 71
  }
}
```

### POST /api/activity (Internal - Auto-called by services)

**Body:**
```json
{
  "organizationId": "6ce0dfc7-f754-4122-afde-85154bc4d0ae",
  "entityId": "boat_azimut55s",
  "userId": "bef71b0c-3427-485b-b4dd-b6399f4d4c45",
  "eventType": "document_upload",
  "eventAction": "created",
  "eventTitle": "Owner Manual Uploaded",
  "eventDescription": "Liliane1_Prestige_Manual_EN.pdf",
  "metadata": {},
  "referenceId": "efb25a15-7d84-4bc3-b070-6bd7dec8d59a",
  "referenceType": "document"
}
```

---

## Frontend Implementation

### Route: `/timeline`

**File:** `client/src/views/Timeline.vue`

```vue
<template>
  <div class="timeline-page">
    <header class="timeline-header">
      <h1>Activity Timeline</h1>
      <div class="filters">
        <select v-model="filters.eventType">
          <option value="">All Events</option>
          <option value="document_upload">Document Uploads</option>
          <option value="maintenance_log">Maintenance</option>
          <option value="warranty_claim">Warranty</option>
        </select>

        <select v-model="filters.entityId" v-if="entities.length > 1">
          <option value="">All Boats</option>
          <option v-for="entity in entities" :key="entity.id" :value="entity.id">
            {{ entity.name }}
          </option>
        </select>
      </div>
    </header>

    <div class="timeline-container">
      <div v-for="(group, date) in groupedEvents" :key="date" class="timeline-group">
        <div class="date-marker">{{ formatDateHeader(date) }}</div>

        <div v-for="event in group" :key="event.id" class="timeline-event">
          <div class="event-icon" :class="`icon-${event.eventType}`">
            <i :class="getEventIcon(event.eventType)"></i>
          </div>

          <div class="event-content">
            <div class="event-header">
              <h3>{{ event.title }}</h3>
              <span class="event-time">{{ formatTime(event.createdAt) }}</span>
            </div>

            <p class="event-description">{{ event.description }}</p>

            <div class="event-meta">
              <span class="event-user">{{ event.user.name }}</span>
              <span v-if="event.entity" class="event-entity">{{ event.entity.name }}</span>
            </div>

            <a v-if="event.referenceId" :href="`/${event.referenceType}/${event.referenceId}`" class="event-link">
              View {{ event.referenceType }} →
            </a>
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="load-more">
        <button @click="loadMore" :disabled="loading">Load More</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useOrganizationStore } from '@/stores/organization';
import api from '@/services/api';

const orgStore = useOrganizationStore();
const events = ref([]);
const entities = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const offset = ref(0);

const filters = ref({
  eventType: '',
  entityId: ''
});

// Group events by date
const groupedEvents = computed(() => {
  const groups = {};

  events.value.forEach(event => {
    const date = new Date(event.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey;
    if (isSameDay(date, today)) {
      groupKey = 'Today';
    } else if (isSameDay(date, yesterday)) {
      groupKey = 'Yesterday';
    } else if (isWithinDays(date, 7)) {
      groupKey = date.toLocaleDateString('en-US', { weekday: 'long' });
    } else if (isWithinDays(date, 30)) {
      groupKey = 'This Month';
    } else {
      groupKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(event);
  });

  return groups;
});

async function loadEvents() {
  loading.value = true;

  try {
    const params = {
      limit: 50,
      offset: offset.value,
      ...filters.value
    };

    const response = await api.get(`/organizations/${orgStore.currentOrgId}/timeline`, { params });

    if (offset.value === 0) {
      events.value = response.data.events;
    } else {
      events.value.push(...response.data.events);
    }

    hasMore.value = response.data.pagination.hasMore;
  } catch (error) {
    console.error('Failed to load timeline:', error);
  } finally {
    loading.value = false;
  }
}

function loadMore() {
  offset.value += 50;
  loadEvents();
}

function getEventIcon(eventType) {
  const icons = {
    document_upload: 'i-carbon-document',
    maintenance_log: 'i-carbon-tools',
    warranty_claim: 'i-carbon-warning-alt',
    settings_change: 'i-carbon-settings'
  };
  return icons[eventType] || 'i-carbon-circle-dash';
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateHeader(dateStr) {
  return dateStr;
}

function isSameDay(d1, d2) {
  return d1.toDateString() === d2.toDateString();
}

function isWithinDays(date, days) {
  const diff = Date.now() - date.getTime();
  return diff < days * 24 * 60 * 60 * 1000;
}

onMounted(async () => {
  await loadEvents();
  // Load entities for filter
  entities.value = await api.get(`/organizations/${orgStore.currentOrgId}/entities`).then(r => r.data);
});
</script>

<style scoped>
.timeline-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.timeline-event {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.event-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-document_upload { background: #0f62fe; color: white; }
.icon-maintenance_log { background: #24a148; color: white; }
.icon-warranty_claim { background: #ff832b; color: white; }

.date-marker {
  font-size: 0.875rem;
  font-weight: 600;
  color: #525252;
  margin: 2rem 0 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
```

---

## Backend Service Layer

**File:** `server/services/activity-logger.js` (NEW)

```javascript
/**
 * Activity Logger Service
 * Automatically logs events to organization timeline
 */
import { getDb } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export async function logActivity({
  organizationId,
  entityId = null,
  userId,
  eventType,
  eventAction,
  eventTitle,
  eventDescription = '',
  metadata = {},
  referenceId = null,
  referenceType = null
}) {
  const db = getDb();

  const activity = {
    id: `evt_${uuidv4()}`,
    organization_id: organizationId,
    entity_id: entityId,
    user_id: userId,
    event_type: eventType,
    event_action: eventAction,
    event_title: eventTitle,
    event_description: eventDescription,
    metadata: JSON.stringify(metadata),
    reference_id: referenceId,
    reference_type: referenceType,
    created_at: Date.now()
  };

  db.prepare(`
    INSERT INTO activity_log (
      id, organization_id, entity_id, user_id, event_type, event_action,
      event_title, event_description, metadata, reference_id, reference_type, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    activity.id,
    activity.organization_id,
    activity.entity_id,
    activity.user_id,
    activity.event_type,
    activity.event_action,
    activity.event_title,
    activity.event_description,
    activity.metadata,
    activity.reference_id,
    activity.reference_type,
    activity.created_at
  );

  return activity;
}
```

**Usage Example (in upload route):**

```javascript
// server/routes/upload.js (after successful upload)

import { logActivity } from '../services/activity-logger.js';

// ... after document saved to DB ...

await logActivity({
  organizationId: organizationId,
  entityId: entityId,
  userId: req.user.id,
  eventType: 'document_upload',
  eventAction: 'created',
  eventTitle: title,
  eventDescription: `Uploaded ${sanitizedFilename} (${(file.size / 1024).toFixed(1)}KB)`,
  metadata: {
    fileSize: file.size,
    fileName: sanitizedFilename,
    documentType: documentType
  },
  referenceId: documentId,
  referenceType: 'document'
});
```

---

## Implementation Checklist

### Phase 1: Database & Backend (1 hour)
- [ ] Create migration: `010_activity_timeline.sql`
- [ ] Run migration: `node scripts/run-migration.js 010`
- [ ] Create `services/activity-logger.js`
- [ ] Create route: `routes/timeline.js` with GET endpoint
- [ ] Add activity logging to upload route
- [ ] Test API: `curl /api/organizations/:id/timeline`

### Phase 2: Frontend (1.5 hours)
- [ ] Create `views/Timeline.vue`
- [ ] Add route to `router.js`: `/timeline`
- [ ] Add navigation link in header
- [ ] Implement infinite scroll
- [ ] Add event type filters
- [ ] Style timeline with date grouping

### Phase 3: Backfill (30 min)
- [ ] Write script to backfill existing documents into activity_log
- [ ] Run: `node scripts/backfill-timeline.js`
- [ ] Verify timeline shows historical data

---

## Demo Talking Points

**"Here's the organization timeline - it shows everything that's happened with your boat:"**

- "Today: You uploaded the bilge pump manual (6.7MB, fully searchable)"
- "Last week: Maintenance service logged for engine oil change"
- "This month: 12 documents uploaded, 3 maintenance records"
- "Scroll down to see older activity - everything is tracked automatically"

**Value Proposition:**
- Never lose track of what's been done
- See maintenance history at a glance
- Useful for warranty claims ("when did we service that?")
- Audit trail for multi-user organizations

---

**Ready to implement?** This can be built in parallel with OCR optimization. Timeline doesn't block demo, but adds significant perceived value.
