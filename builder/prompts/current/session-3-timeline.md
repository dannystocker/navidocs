# Cloud Session 3: Organization Timeline Feature

**Session ID:** session-3
**Role:** Full-Stack Feature Engineer
**Priority:** P1 (Core demo feature)
**Estimated Time:** 2 hours (backend + frontend)
**Dependencies:** None (can run parallel with Sessions 1 & 2)

---

## Your Mission

Build an organization activity timeline showing chronological history of all events (uploads, maintenance, warranty claims) with most recent at top.

**Current Gap:**
- No way to see "what happened when" across the organization
- Document uploads have no activity trail
- Users can't track maintenance history chronologically

**Expected Outcome:**
- Timeline page at `/timeline` route
- Reverse chronological feed (newest first)
- Grouped by date (Today, Yesterday, This Week, etc.)
- Event type filtering (uploads, maintenance, etc.)
- Infinite scroll for history

---

## Implementation Steps

### Phase 1: Database Layer (30 min)

#### Step 1.1: Create Migration (10 min)

**File:** `server/migrations/010_activity_timeline.sql` (NEW)

```sql
-- Activity Log for Organization Timeline
-- Tracks all events: uploads, maintenance, warranty, settings changes

CREATE TABLE IF NOT EXISTS activity_log (
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for fast timeline queries
CREATE INDEX IF NOT EXISTS idx_activity_org_created
  ON activity_log(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_entity
  ON activity_log(entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_type
  ON activity_log(event_type);

-- Test data (for demo)
INSERT INTO activity_log (id, organization_id, user_id, event_type, event_action, event_title, event_description, created_at)
VALUES
  ('evt_demo_1', '6ce0dfc7-f754-4122-afde-85154bc4d0ae', 'bef71b0c-3427-485b-b4dd-b6399f4d4c45',
   'document_upload', 'created', 'Bilge Pump Manual Uploaded',
   'Azimut 55S Bilge Pump Manual.pdf (2.3MB)',
   strftime('%s', 'now') * 1000);
```

#### Step 1.2: Run Migration (5 min)

```bash
cd /home/setup/navidocs/server
node scripts/run-migration.js 010
# Verify: sqlite3 navidocs.db "SELECT * FROM activity_log;"
```

#### Step 1.3: Create Activity Logger Service (15 min)

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

  console.log(`[Activity Log] ${eventType}: ${eventTitle}`);
  return activity;
}
```

---

### Phase 2: API Layer (30 min)

#### Step 2.1: Create Timeline Route (20 min)

**File:** `server/routes/timeline.js` (NEW)

```javascript
import express from 'express';
import { getDb } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/organizations/:orgId/timeline', authenticateToken, async (req, res) => {
  const { orgId } = req.params;
  const { limit = 50, offset = 0, eventType, entityId, startDate, endDate } = req.query;

  // Verify user belongs to organization
  if (req.user.organizationId !== orgId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const db = getDb();

  // Build query with filters
  let query = `
    SELECT
      a.*,
      u.name as user_name,
      u.email as user_email
    FROM activity_log a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.organization_id = ?
  `;

  const params = [orgId];

  if (eventType) {
    query += ` AND a.event_type = ?`;
    params.push(eventType);
  }

  if (entityId) {
    query += ` AND a.entity_id = ?`;
    params.push(entityId);
  }

  if (startDate) {
    query += ` AND a.created_at >= ?`;
    params.push(parseInt(startDate));
  }

  if (endDate) {
    query += ` AND a.created_at <= ?`;
    params.push(parseInt(endDate));
  }

  query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  try {
    const events = db.prepare(query).all(...params);

    // Get total count
    const countQuery = query.split('ORDER BY')[0].replace('SELECT a.*, u.name as user_name, u.email as user_email', 'SELECT COUNT(*) as total');
    const { total } = db.prepare(countQuery).get(...params.slice(0, -2));

    // Parse metadata
    const parsedEvents = events.map(event => ({
      ...event,
      metadata: event.metadata ? JSON.parse(event.metadata) : {},
      user: {
        id: event.user_id,
        name: event.user_name,
        email: event.user_email
      }
    }));

    res.json({
      events: parsedEvents,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + events.length < total
      }
    });
  } catch (error) {
    console.error('[Timeline] Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

export default router;
```

#### Step 2.2: Register Route (5 min)

**File:** `server/index.js` (MODIFY)

```javascript
// Add import
import timelineRouter from './routes/timeline.js';

// Register route (around line 40, with other routes)
app.use('/api', timelineRouter);
```

#### Step 2.3: Integrate into Upload Route (5 min)

**File:** `server/routes/upload.js` (MODIFY - around line 150, after document saved)

```javascript
import { logActivity } from '../services/activity-logger.js';

// ... after document successfully saved to database ...

await logActivity({
  organizationId: organizationId,
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

### Phase 3: Frontend (60 min)

#### Step 3.1: Create Timeline Component (40 min)

**File:** `client/src/views/Timeline.vue` (NEW)

```vue
<template>
  <div class="timeline-page">
    <header class="timeline-header">
      <h1>Activity Timeline</h1>
      <div class="filters">
        <select v-model="filters.eventType" @change="loadEvents">
          <option value="">All Events</option>
          <option value="document_upload">Document Uploads</option>
          <option value="maintenance_log">Maintenance</option>
          <option value="warranty_claim">Warranty</option>
        </select>
      </div>
    </header>

    <div v-if="loading && events.length === 0" class="loading">
      Loading timeline...
    </div>

    <div v-else class="timeline-container">
      <div v-for="(group, date) in groupedEvents" :key="date" class="timeline-group">
        <div class="date-marker">{{ date }}</div>

        <div v-for="event in group" :key="event.id" class="timeline-event">
          <div class="event-icon" :class="`icon-${event.event_type}`">
            <i :class="getEventIcon(event.event_type)"></i>
          </div>

          <div class="event-content">
            <div class="event-header">
              <h3>{{ event.event_title }}</h3>
              <span class="event-time">{{ formatTime(event.created_at) }}</span>
            </div>

            <p class="event-description">{{ event.event_description }}</p>

            <div class="event-meta">
              <span class="event-user">{{ event.user.name }}</span>
            </div>

            <a
              v-if="event.reference_id"
              :href="`/${event.reference_type}/${event.reference_id}`"
              class="event-link"
            >
              View {{ event.reference_type }} →
            </a>
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="load-more">
        <button @click="loadMore" :disabled="loading">
          {{ loading ? 'Loading...' : 'Load More' }}
        </button>
      </div>

      <div v-if="events.length === 0 && !loading" class="empty-state">
        <p>No activity yet. Upload a document to get started!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const events = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const offset = ref(0);

const filters = ref({
  eventType: ''
});

// Group events by date
const groupedEvents = computed(() => {
  const groups = {};

  events.value.forEach(event => {
    const date = new Date(event.created_at);
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
    const token = localStorage.getItem('token');
    const orgId = localStorage.getItem('organizationId');

    const params = {
      limit: 50,
      offset: offset.value,
      ...filters.value
    };

    const response = await axios.get(
      `http://localhost:8001/api/organizations/${orgId}/timeline`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params
      }
    );

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
    document_upload: '📄',
    maintenance_log: '🔧',
    warranty_claim: '⚠️',
    settings_change: '⚙️'
  };
  return icons[eventType] || '📋';
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function isSameDay(d1, d2) {
  return d1.toDateString() === d2.toDateString();
}

function isWithinDays(date, days) {
  const diff = Date.now() - date.getTime();
  return diff < days * 24 * 60 * 60 * 1000;
}

onMounted(() => {
  loadEvents();
});
</script>

<style scoped>
.timeline-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.timeline-header h1 {
  font-size: 2rem;
  font-weight: 600;
}

.filters select {
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.875rem;
}

.timeline-container {
  max-width: 800px;
  margin: 0 auto;
}

.date-marker {
  font-size: 0.875rem;
  font-weight: 600;
  color: #525252;
  margin: 2rem 0 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timeline-event {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: box-shadow 0.2s;
}

.timeline-event:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.event-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.25rem;
  background: #f5f5f5;
}

.icon-document_upload { background: #e3f2fd; }
.icon-maintenance_log { background: #e8f5e9; }
.icon-warranty_claim { background: #fff3e0; }

.event-content {
  flex: 1;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.event-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.event-time {
  font-size: 0.875rem;
  color: #757575;
}

.event-description {
  color: #424242;
  margin-bottom: 0.75rem;
}

.event-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #757575;
}

.event-link {
  display: inline-block;
  margin-top: 0.5rem;
  color: #1976d2;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
}

.event-link:hover {
  text-decoration: underline;
}

.load-more {
  text-align: center;
  margin-top: 2rem;
}

.load-more button {
  padding: 0.75rem 2rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
}

.load-more button:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #757575;
}

.loading {
  text-align: center;
  padding: 4rem 2rem;
  color: #757575;
}
</style>
```

#### Step 3.2: Add Route (10 min)

**File:** `client/src/router/index.js` (MODIFY)

```javascript
import Timeline from '../views/Timeline.vue';

// Add route
{
  path: '/timeline',
  name: 'Timeline',
  component: Timeline,
  meta: { requiresAuth: true }
}
```

#### Step 3.3: Add Navigation Link (10 min)

**File:** `client/src/components/AppHeader.vue` (MODIFY - add link in nav)

```vue
<router-link to="/timeline" class="nav-link">
  Timeline
</router-link>
```

---

## Testing Strategy (10 min)

### Test 1: API Endpoint
```bash
# Get timeline
curl http://localhost:8001/api/organizations/6ce0dfc7-f754-4122-afde-85154bc4d0ae/timeline \
  -H "Authorization: Bearer $TOKEN"

# Should return JSON with events array
```

### Test 2: Upload Triggers Activity Log
```bash
# Upload a document
# Check that activity_log table has new entry
sqlite3 server/navidocs.db "SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 1;"
```

### Test 3: Frontend Timeline
```bash
# Visit http://localhost:8081/timeline
# Should see:
# - Date grouping (Today, Yesterday, etc.)
# - Event cards with icons
# - Load more button if > 50 events
```

---

## Success Criteria

- [ ] Migration 010 created and run successfully
- [ ] activity_log table exists with correct schema
- [ ] activity-logger.js service created
- [ ] Timeline route `/api/organizations/:orgId/timeline` working
- [ ] Upload route logs activity after successful upload
- [ ] Timeline.vue component renders events
- [ ] Route `/timeline` accessible and loads data
- [ ] Navigation link added to header
- [ ] Events grouped by date (Today, Yesterday, etc.)
- [ ] Event filtering by type works
- [ ] Infinite scroll loads more events
- [ ] No console errors
- [ ] Code committed to `feature/timeline` branch

---

## Completion Report Template

```markdown
# Session 3: Timeline Feature - COMPLETE ✅

**Branch:** feature/timeline
**Commit:** [hash]
**Duration:** [actual time]

## Changes Made:

### Backend:
- ✅ Migration 010_activity_timeline.sql created
- ✅ activity_log table with indexes
- ✅ activity-logger.js service
- ✅ Timeline API route (GET /api/organizations/:orgId/timeline)
- ✅ Upload route integration

### Frontend:
- ✅ Timeline.vue component (360 lines)
- ✅ Router integration (/timeline)
- ✅ Navigation link in AppHeader
- ✅ Date grouping (Today, Yesterday, etc.)
- ✅ Event filtering by type
- ✅ Infinite scroll

## Test Results:

- API endpoint: ✅ Returns events with pagination
- Upload logging: ✅ Activity logged after document upload
- Timeline page: ✅ Renders with date grouping
- Filtering: ✅ Works for document_upload type
- Load more: ✅ Fetches next 50 events

## Demo Ready:

Timeline shows:
- Document uploads (with file size, type)
- Date grouping (Today, Yesterday, This Week, This Month, [Month Year])
- User attribution
- Links to source documents
- Clean, modern UI

**Status:** Ready for integration with Sessions 1 & 2
**Next:** Merge to navidocs-cloud-coordination after testing
```

---

## Communication

**When complete:**
```bash
git add .
git commit -m "[SESSION-3] Add organization timeline feature

- Database: activity_log table with indexes
- Backend: Activity logger service + timeline API
- Frontend: Timeline.vue with date grouping and filtering
- Integration: Upload route logs activity
- UI: Modern timeline with infinite scroll

Resolves: Timeline feature spec"

git push origin feature/timeline
```

**Create:** `SESSION-3-COMPLETE.md` with the template above

---

## If Blocked

**Common Issues:**

1. **Migration fails:** Check if 010_activity_timeline.sql already exists, verify SQL syntax
2. **API returns 403:** Verify authentication middleware, check organizationId match
3. **Timeline empty:** Check activity_log table has data, verify API query
4. **Frontend errors:** Check axios import, verify API_URL, check Vue devtools

**Resources:**
- Full spec: `FEATURE_SPEC_TIMELINE.md`
- Database: `server/navidocs.db`
- Existing routes: `server/routes/` for examples

---

**Ready to build the timeline? Start with Phase 1 (Database Layer)! 🚀**

**Estimated Completion:** 2 hours from start
**Status:** Independent - no dependencies on Sessions 1 or 2
