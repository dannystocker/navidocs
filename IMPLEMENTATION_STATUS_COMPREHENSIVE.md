# NaviDocs Implementation Status - Comprehensive Audit

**Created:** 2025-11-14
**Audit Scope:** Local WSL setup + Cloud build branch + Stakeholder requirements

---

## Quick Answers to Your Questions

### 1. **Is Home Assistant fully integrated?**
❌ **NO** - Home Assistant integration is NOT implemented

**Evidence:**
- Grep search for "home assistant|rtsp|camera" in `/server` returned 0 files
- The cloud build branch has camera module (`CameraModule.vue`, `cameras.js`) but it's a standalone RTSP integration
- No Home Assistant API integration found in codebase

**What EXISTS:**
- Basic RTSP camera management (add camera URL, store in database)
- Camera feeds table structure
- Frontend camera display component

**What's MISSING:**
- Home Assistant API connection
- Home Assistant entity integration (sensors, switches, automation)
- Home Assistant dashboard embedding
- Motion detection from Home Assistant
- No webhook integration for Home Assistant events

**To Implement:**
```javascript
// NEEDED: server/services/home-assistant.service.js
class HomeAssistantService {
  constructor(hassUrl, accessToken) {
    this.baseUrl = hassUrl
    this.headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  async getCameraEntities() {
    const response = await fetch(`${this.baseUrl}/api/states`)
    const entities = await response.json()
    return entities.filter(e => e.entity_id.startsWith('camera.'))
  }

  async getCameraSnapshot(entityId) {
    const response = await fetch(
      `${this.baseUrl}/api/camera_proxy/${entityId}`,
      { headers: this.headers }
    )
    return response.blob()
  }

  async subscribeToEvents(callback) {
    const ws = new WebSocket(`${this.baseUrl}/api/websocket`)
    ws.onmessage = (msg) => callback(JSON.parse(msg.data))
  }
}
```

---

### 2. **Do we have dashboards adapted to each stakeholder when they login?**
❌ **NO** - Multi-stakeholder dashboards are NOT implemented

**Evidence:**
- `STAKEHOLDER_DASHBOARD_STRATEGY.md` exists (45KB strategic document) BUT it's planning only
- No role-based dashboard implementation found in code
- Current auth system has basic user authentication but no role differentiation

**Stakeholder Roles Identified (from STAKEHOLDER_DASHBOARD_STRATEGY.md):**
1. **Reseller/After-Sales** - Sylvain's team managing multiple boats
2. **Owner** - Primary boat owner
3. **Management Company** - Yacht management firms overseeing fleet
4. **Captain** - Professional captain running the boat
5. **Crew** - Crew members with limited access

**What EXISTS:**
- Basic login/auth (`server/routes/auth.routes.js`)
- User table with email/password
- JWT token authentication

**What's MISSING:**
- No `role` field in users table
- No role-based access control (RBAC)
- No stakeholder-specific dashboards
- No data filtering by role (e.g., crew should only see maintenance tasks assigned to them)

**Current Dashboard (One-Size-Fits-All):**
- Timeline view shows ALL events
- No role filtering
- Same view for everyone

---

### 3. **Will all documents, reminders, and everything planned be on the timeline? (future, present, past)**
⚠️ **PARTIAL** - Timeline exists but is limited

**What's Implemented (from Timeline.vue):**
```vue
<select v-model="filters.eventType">
  <option value="">All Events</option>
  <option value="document_upload">Document Uploads</option>
  <option value="maintenance_log">Maintenance</option>
  <option value="warranty_claim">Warranty</option>
</select>
```

**Timeline Coverage:**
✅ **PAST + PRESENT:**
- Document uploads (historical + today)
- Maintenance logs (completed work)
- Warranty claims (filed claims)

❌ **MISSING FROM TIMELINE:**
- **Future reminders** (upcoming maintenance not shown on timeline)
- **Expenses** (not integrated into timeline)
- **Camera events** (motion alerts not on timeline)
- **Contact interactions** (calls, emails not logged)
- **Inventory changes** (equipment added/removed not tracked)

**Timeline Grouping:**
- Groups by date (Today, Yesterday, specific dates)
- Infinite scroll with "Load More" pagination
- Filters by event type

**What's Needed for Complete Timeline:**
```javascript
// Add to timeline event types:
{
  eventType: 'maintenance_reminder',     // FUTURE: Oil change due in 5 days
  eventType: 'expense_submitted',        // PRESENT: New expense awaiting approval
  eventType: 'camera_motion',            // PRESENT: Motion detected at 14:32
  eventType: 'inventory_added',          // PAST: New GPS installed
  eventType: 'contact_called',           // PAST: Called marina manager
  eventType: 'weather_alert'             // FUTURE: Storm warning tomorrow
}
```

---

### 4. **Is the full inventory system coded and implemented?**
✅ **YES** - 100% implemented in cloud build

**Backend API:** `/server/routes/inventory.js` (6,064 bytes)
- ✅ POST `/api/inventory` - Create item with photo upload (5 photos max)
- ✅ GET `/api/inventory/:boatId` - List all items for boat
- ✅ GET `/api/inventory/item/:id` - Get single item
- ✅ PUT `/api/inventory/:id` - Update item (name, category, current_value, notes)
- ✅ DELETE `/api/inventory/:id` - Delete item

**Frontend Component:** `/client/src/components/InventoryModule.vue` (15,671 bytes)
- ✅ Add equipment form with photo upload
- ✅ Category filtering (Electronics, Safety, Engine, Sails, Navigation, Other)
- ✅ Depreciation tracking (purchase_price vs current_value)
- ✅ Photo gallery display
- ✅ Search integration (indexed via search-modules.service.js)

**Database Table:**
```sql
CREATE TABLE inventory_items (
  id INTEGER PRIMARY KEY,
  boat_id INTEGER,
  name TEXT,
  category TEXT,
  purchase_date TEXT,
  purchase_price REAL,
  current_value REAL,
  photo_urls TEXT, -- JSON array
  depreciation_rate REAL DEFAULT 0.1,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT
);
```

**Features Working:**
- Photo upload (up to 5 images, 5MB each)
- Image formats: JPEG, PNG, GIF, WebP
- Automatic depreciation calculation
- Full-text search indexing
- Category organization

---

### 5. **Is WhatsApp integrated?**
❌ **NO** - WhatsApp integration is NOT implemented

**Evidence:**
- `INTEGRATION_WHATSAPP.md` exists (34KB planning document) BUT no code implementation
- No Twilio credentials in codebase
- No WhatsApp message handlers

**What's Planned (from INTEGRATION_WHATSAPP.md):**
1. **Twilio WhatsApp Business API**
2. **Use Cases:**
   - Owner sends receipt photo → AI OCR → creates expense entry
   - Captain logs maintenance → WhatsApp message → creates maintenance record
   - AI responds to questions: "When was last service?"
3. **Architecture:**
   - Webhook receiver: `/api/whatsapp/webhook`
   - Message processor: Extract intent, query database, respond
   - OCR pipeline: Receipt → Tesseract.js → structured data

**What's MISSING:**
- No Twilio account setup
- No webhook endpoint
- No message processing logic
- No OCR integration (Tesseract.js not installed)

**To Implement:**
```javascript
// NEEDED: server/routes/whatsapp.js
import twilio from 'twilio'

router.post('/api/whatsapp/webhook', async (req, res) => {
  const { From, Body, MediaUrl0 } = req.body

  // If message has photo
  if (MediaUrl0) {
    const receiptData = await ocrService.extractReceipt(MediaUrl0)
    await expenseService.createFromWhatsApp(From, receiptData)
    await twilioClient.messages.create({
      from: 'whatsapp:+14155238886', // Twilio sandbox
      to: From,
      body: `✅ Expense created: €${receiptData.amount} for ${receiptData.description}`
    })
  }

  // If text query
  if (Body.includes('last service')) {
    const maintenance = await maintenanceService.getLatest(From)
    await twilioClient.messages.create({
      from: 'whatsapp:+14155238886',
      to: From,
      body: `Last service: ${maintenance.service_type} on ${maintenance.completed_date}`
    })
  }

  res.sendStatus(200)
})
```

---

## UI Research Results Summary

**Source:** Previous Claude session (documented in NAVIDOCS_UI_STRATEGY_AND_WEATHER.md)

### **Design System Chosen: Apple HIG + Garmin Clarity**

**1. Apple Human Interface Guidelines (HIG):**
- **Bottom Tab Navigation** - 6 tabs max, thumb-reachable
- **44×44pt Touch Targets** (NaviDocs uses 60×60px for glove operation)
- **SF Pro Font** - System font for optimal readability
- **8pt Grid System** - Consistent spacing
- **Glass Morphism** - `backdrop-filter: blur(20px)` for modern aesthetics

**2. Garmin Marine Clarity:**
- **High Contrast** - Readable in direct sunlight
- **Large Metrics** - 32-48px font size for critical numbers (speed, depth, fuel)
- **Color-Coded Status** - Green (OK), Amber (Warning), Red (Critical)
- **Minimalist Charts** - Clean lines, no decoration
- **Dark Mode Default** - Better for night vision

**3. Marine App Best Practices:**
- **Orca** (rated "number one for UI")
  - Dashboard-first approach (all key info on home screen)
  - Large touch targets (60×60px minimum for wet gloves)
  - Marine color palette: Navy Blue #1E3A8A, Ocean Teal #0D9488

- **Savvy Navvy** (rated "simple & accessible")
  - Progressive disclosure (hide complexity until needed)
  - One-tap actions (call marina, view camera)
  - Offline-first architecture

- **Navionics** (industry standard)
  - Map-centric interface for navigation
  - Real-time weather overlays
  - Route planning with waypoints

### **Recommended Design Tokens:**

```css
/* Typography */
--text-metric-lg: 48px;      /* Hero numbers (weather, expenses) */
--text-metric-md: 32px;      /* Dashboard stats */
--text-hero: 34px;           /* Page titles */
--text-body: 17px;           /* Body text (Apple's base size) */

/* Colors */
--navy-blue: #1E3A8A;        /* Primary brand color */
--ocean-teal: #0D9488;       /* Accent/success */
--status-ok: #10B981;        /* Green indicators */
--status-warning: #F59E0B;   /* Amber alerts */
--status-critical: #EF4444;  /* Red warnings */

/* Spacing (8pt grid) */
--space-2: 8px;              /* Base unit */
--space-4: 16px;             /* Comfortable spacing */
--space-6: 24px;             /* Large spacing */
--space-8: 32px;             /* XL spacing */

/* Touch Targets */
--touch-min: 60px;           /* Minimum tap area (glove-friendly) */
```

### **Navigation Pattern:**
Bottom tab bar with 6 core modules:
1. **Dashboard** (home icon) - Glanceable metrics
2. **Inventory** (archive icon) - Equipment tracking
3. **Maintenance** (wrench icon) - Service logs
4. **Weather** (cloud icon) - **NEW MODULE**
5. **Cameras** (camera icon) - Live feeds
6. **More** (menu icon) - Contacts, Expenses, Settings

---

## Weather Module Implementation Plan

**User Request:** Integrate weather data from Windy.com and Windfinder.com

### **Option A: Iframe Embed (Recommended)**

**Pros:**
- ✅ No API costs (Windy API is $199/year commercial license)
- ✅ Always up-to-date maps (Windy maintains layers)
- ✅ Interactive (user can zoom, change layers)

**Cons:**
- ❌ Requires internet connection
- ❌ Less customizable UI
- ❌ Iframe performance overhead

**Implementation:**
```vue
<template>
  <div class="weather-module">
    <!-- Garmin-style metrics -->
    <div class="weather-stats">
      <MetricDisplay label="Temperature" :value="24" unit="°C" status="ok" />
      <MetricDisplay label="Wind Speed" :value="12" unit="kts" status="ok" />
      <MetricDisplay label="Wave Height" :value="0.8" unit="m" status="ok" />
      <MetricDisplay label="Visibility" :value="10" unit="nm" status="info" />
    </div>

    <!-- Tabbed iframes -->
    <div class="weather-tabs">
      <button @click="activeTab = 'wind'">Wind Forecast</button>
      <button @click="activeTab = 'waves'">Wave Forecast</button>
      <button @click="activeTab = 'radar'">Radar</button>
    </div>

    <iframe
      v-show="activeTab === 'wind'"
      :src="windyEmbedUrl"
      width="100%"
      height="500px"
      frameborder="0"
    ></iframe>

    <iframe
      v-show="activeTab === 'waves'"
      :src="windfinderEmbedUrl"
      width="100%"
      height="500px"
      frameborder="0"
    ></iframe>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const activeTab = ref('wind')
const boatLocation = ref({ lat: 43.5528, lon: 7.0174 }) // Monaco

const windyEmbedUrl = computed(() => {
  const { lat, lon } = boatLocation.value
  return `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=100%&height=100%&zoom=8&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=kt&metricTemp=%C2%B0C&radarRange=-1`
})

const windfinderEmbedUrl = computed(() => {
  const { lat, lon } = boatLocation.value
  // Windfinder requires spot ID (not lat/lon), would need geocoding
  return `https://www.windfinder.com/widget/forecast/embed.htm?spot=158029&unit_wave=m&unit_wind=kts&days=5`
})
</script>
```

### **Option B: Open-Meteo Marine API (Free)**

**Pros:**
- ✅ Completely free (no API key needed)
- ✅ Returns JSON (full control over UI)
- ✅ Marine-specific data (wave height, swell period, wave direction)

**Cons:**
- ❌ No visual map layers
- ❌ Must build UI from scratch

**API Example:**
```javascript
async function fetchMarineWeather(lat, lon) {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period&hourly=wave_height,wind_wave_height&daily=wave_height_max,wind_speed_max&timezone=auto`

  const response = await fetch(url)
  const data = await response.json()

  return {
    currentWaveHeight: data.current.wave_height,
    waveDirection: data.current.wave_direction,
    wavePeriod: data.current.wave_period,
    forecast: data.hourly.wave_height.slice(0, 24) // Next 24 hours
  }
}
```

### **Recommended: Hybrid Approach**
1. Use **Open-Meteo API** for numerical metrics (display in Garmin-style large numbers)
2. Use **Windy iframe** for visual wind/wave map
3. Use **Windfinder iframe** for detailed wind forecast table

---

## Local Setup Status Check

**What's in `/home/setup/navidocs`:**
- ✅ Frontend: Vue 3 + Vite setup
- ✅ Backend: Express + SQLite
- ✅ Views: 9 view files found (HomeView, DocumentView, Timeline, Stats, etc.)
- ✅ Build scripts: `start-all.sh`, `stop-all.sh`
- ✅ Demo data: `/demo-data` directory exists
- ⚠️ **EMPTY DATABASE** - User confirmed "features implemented but no data, so empty"

**To Test Locally:**
```bash
# 1. Start all services
cd /home/setup/navidocs
./start-all.sh

# 2. Check if running
./verify-running.sh

# 3. Seed demo data
node demo-data/seed.js  # IF exists, otherwise need to create

# 4. Access app
# Frontend: http://localhost:3200
# Backend API: http://localhost:3201
```

---

## Multi-Stakeholder Dashboard Requirements

**Based on stakeholder roles identified:**

### **1. Reseller/After-Sales Dashboard (Sylvain's Team)**
**Role:** Oversees 50-150 boats, manages after-sales for all owners

**Dashboard Needs:**
- **Fleet Overview Card:**
  - Total boats: 127
  - Active users (logged in last 7 days): 95 (75%)
  - At-risk boats (no activity 30+ days): 8 (5%)
- **Churn Prevention Alerts:**
  - 🔴 Boat #42: No login for 45 days (owner may be frustrated)
  - 🟡 Boat #17: Maintenance overdue by 30 days
  - 🟢 Boat #88: High engagement (logged in daily)
- **Satisfaction Heatmap:**
  - Grid of boats color-coded by engagement score
  - Click boat → drill down to owner activity
- **KPI Metrics:**
  - Avg response time to owner questions: 4.2 hours
  - Issue resolution rate: 87%
  - Owner satisfaction score (survey): 8.3/10

**Access Control:**
- ✅ Can view ALL boats sold by dealership
- ✅ Can view ALL owner data
- ❌ Cannot edit boat details (read-only)

### **2. Owner Dashboard**
**Role:** Owns 1 boat, manages documentation, expenses, crew

**Dashboard Needs:**
- **Boat Overview Card:**
  - Current location (if GPS tracking)
  - Weather at location (temp, wind, waves)
  - Camera snapshots (4 thumbnail grid)
- **Upcoming Maintenance:**
  - Oil change due in 5 days
  - Hull cleaning due in 12 days
- **Recent Activity Timeline:**
  - Yesterday: €127 fuel expense added
  - 2 days ago: Maintenance log (replaced impeller)
  - 1 week ago: New inventory item (life raft)
- **Quick Actions:**
  - 📷 View Cameras
  - 💰 Add Expense
  - 🔧 Log Maintenance
  - 📄 Upload Document

**Access Control:**
- ✅ Full access to their boat's data
- ✅ Can invite crew/captain (manage users)
- ❌ Cannot see other boats

### **3. Management Company Dashboard**
**Role:** Manages 5-20 boats for different owners

**Dashboard Needs:**
- **Fleet Grid View:**
  - Boat cards showing:
    - Boat name
    - Owner name
    - Next maintenance due date
    - Expense total (this month)
- **Budget Overview:**
  - Total expenses across all boats: €24,572
  - Budget remaining: €5,428 (18%)
- **Maintenance Calendar:**
  - Weekly view showing all upcoming maintenance across fleet
- **Owner Communication Log:**
  - Last contact with each owner
  - Pending approvals (expense approvals)

**Access Control:**
- ✅ View all boats they manage
- ✅ Edit maintenance/expenses for managed boats
- ✅ Invite crew for managed boats
- ❌ Cannot see boats outside their management

### **4. Captain Dashboard**
**Role:** Operates the boat, logs maintenance, monitors systems

**Dashboard Needs:**
- **Systems Status:**
  - Engine hours: 1,247 hrs
  - Fuel level: 72%
  - Water level: 45%
  - Battery: 13.2V (all systems normal)
- **Today's Tasks:**
  - Pre-departure checklist (13/15 items done)
  - Weather check (safe to depart)
  - Camera check (all 4 online)
- **Maintenance Reminders:**
  - Engine service due in 53 hours
  - Tender service overdue by 12 days
- **Quick Log:**
  - One-tap maintenance log ("Replaced fuel filter")
  - One-tap expense log (fuel receipt photo)

**Access Control:**
- ✅ Full access to boat operational data
- ✅ Can log maintenance/expenses
- ✅ Can view cameras
- ❌ Cannot delete documents
- ❌ Cannot manage users

### **5. Crew Dashboard**
**Role:** Limited access, mainly maintenance tasks assigned to them

**Dashboard Needs:**
- **Assigned Tasks:**
  - Clean deck (due today)
  - Check mooring lines (due tomorrow)
- **Checklist Access:**
  - Pre-departure checklist (view only)
  - Safety equipment check (can edit)
- **Document Access:**
  - Safety manuals (read-only)
  - Emergency procedures (read-only)

**Access Control:**
- ✅ View assigned tasks
- ✅ Complete checklists
- ✅ View safety documents
- ❌ Cannot view expenses
- ❌ Cannot view owner documents
- ❌ Cannot manage inventory

---

## Implementation Roadmap: Multi-Stakeholder Dashboards

### **Phase 1: Database Schema (1 day)**
```sql
-- Add role to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'owner';
-- Roles: 'reseller', 'owner', 'management_company', 'captain', 'crew'

-- Add user-boat association (many-to-many)
CREATE TABLE user_boats (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  boat_id INTEGER,
  role TEXT, -- 'owner', 'captain', 'crew', 'viewer'
  permissions TEXT, -- JSON: {"can_edit_maintenance": true, "can_delete_docs": false}
  created_at TEXT
);

-- Add boat ownership tracking
ALTER TABLE boats ADD COLUMN dealer_id INTEGER; -- Which reseller sold this boat
ALTER TABLE boats ADD COLUMN management_company_id INTEGER; -- Which company manages it
```

### **Phase 2: Role-Based Access Control (3 days)**
```javascript
// server/middleware/rbac.js
export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    const user = req.user // From authenticateToken middleware

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    next()
  }
}

export function requireBoatAccess(requiredPermission) {
  return async (req, res, next) => {
    const { boatId } = req.params
    const user = req.user

    const access = await db.prepare(`
      SELECT permissions FROM user_boats
      WHERE user_id = ? AND boat_id = ?
    `).get(user.id, boatId)

    if (!access) {
      return res.status(403).json({ error: 'No access to this boat' })
    }

    const permissions = JSON.parse(access.permissions)
    if (!permissions[requiredPermission]) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

// Usage in routes:
router.get('/api/inventory/:boatId',
  authenticateToken,
  requireBoatAccess('can_view_inventory'),
  async (req, res) => { /* ... */ }
)

router.delete('/api/inventory/:id',
  authenticateToken,
  requireRole('owner', 'captain'),
  requireBoatAccess('can_delete_inventory'),
  async (req, res) => { /* ... */ }
)
```

### **Phase 3: Dashboard Views (5 days)**
```vue
<!-- client/src/views/DashboardView.vue -->
<template>
  <div class="dashboard">
    <!-- Reseller View -->
    <ResellerDashboard v-if="user.role === 'reseller'" :user="user" />

    <!-- Owner View -->
    <OwnerDashboard v-else-if="user.role === 'owner'" :user="user" />

    <!-- Management Company View -->
    <ManagementDashboard v-else-if="user.role === 'management_company'" :user="user" />

    <!-- Captain View -->
    <CaptainDashboard v-else-if="user.role === 'captain'" :user="user" />

    <!-- Crew View -->
    <CrewDashboard v-else-if="user.role === 'crew'" :user="user" />
  </div>
</template>
```

### **Phase 4: Testing (2 days)**
- Create test users for each role
- Test RBAC enforcement (ensure crew can't access expenses)
- Test dashboard switching (user changes role)
- Test multi-boat access (management company managing 10 boats)

**Total Estimate:** 11 days (€8,800 at €80/hr senior dev rate)

---

## Critical Missing Features Summary

| Feature | Status | Priority | Effort | Blocker? |
|---------|--------|----------|--------|----------|
| **Home Assistant Integration** | ❌ Not implemented | HIGH | 5 days | YES (for automation) |
| **Multi-Stakeholder Dashboards** | ❌ Not implemented | CRITICAL | 11 days | YES (core UX) |
| **WhatsApp Integration** | ❌ Not implemented | HIGH | 8 days | NO (nice-to-have) |
| **Timeline - Future Events** | ⚠️ Partial | MEDIUM | 2 days | NO |
| **Weather Module** | ❌ Not implemented | MEDIUM | 3 days | NO |
| **OCR Receipt Extraction** | ❌ Not implemented | MEDIUM | 5 days | NO (manual entry works) |
| **Live Camera Streaming** | ❌ Not implemented | LOW | 7 days | NO (snapshots work) |
| **Charts/Analytics** | ❌ Not implemented | LOW | 4 days | NO |

**CRITICAL PATH (Must-Have for MVP):**
1. Multi-Stakeholder Dashboards (11 days) - **BLOCKER**
2. Home Assistant Integration (5 days) - **BLOCKER**
3. Weather Module (3 days)
4. Timeline Future Events (2 days)

**Total MVP Completion Time:** 21 days (~€16,800)

---

## Next Steps

1. **Immediate (Today):**
   - Review this comprehensive status document
   - Decide on MVP scope: Are stakeholder dashboards required for launch?
   - Approve UI design system (Apple HIG + Garmin clarity)

2. **This Week:**
   - Implement multi-stakeholder dashboards (Phase 1-2: database + RBAC)
   - Integrate Home Assistant API connection
   - Build weather module (Option: Hybrid with Windy iframes + Open-Meteo API)

3. **Next Week:**
   - Complete stakeholder dashboard views
   - Add future events to timeline
   - Testing with real users (one user per role)

4. **Future Enhancements (Post-MVP):**
   - WhatsApp AI chatbot integration
   - OCR receipt extraction
   - Live camera streaming (WebRTC)
   - Advanced analytics/charts
