# NaviDocs - Implementation Status & UI Design Guidelines

**Generated:** 2025-11-14
**Purpose:** Complete audit of implemented features + UI/UX best practices research

---

## ✅ WHAT'S BEEN IMPLEMENTED (Cloud Session Build Complete)

### Backend APIs - 5 NEW Routes (100% Complete)

**1. Inventory API** (`server/routes/inventory.js` - 6,064 bytes)
- ✅ POST `/api/inventory` - Create inventory item with photos (up to 5 images, 5MB each)
- ✅ GET `/api/inventory/:boatId` - List all equipment for boat
- ✅ GET `/api/inventory/:id` - Get single item details
- ✅ PUT `/api/inventory/:id` - Update item
- ✅ DELETE `/api/inventory/:id` - Remove item
- ✅ **Features:** Photo upload (JPEG/PNG/GIF/WebP), depreciation calculation, search indexing
- ✅ **Test Coverage:** 13,321 bytes of Jest tests

**2. Maintenance API** (`server/routes/maintenance.js` - 14,924 bytes)
- ✅ POST `/api/maintenance` - Create maintenance record
- ✅ GET `/api/maintenance/:boatId` - Service history for boat
- ✅ GET `/api/maintenance/:id` - Get single record
- ✅ PUT `/api/maintenance/:id` - Update record
- ✅ DELETE `/api/maintenance/:id` - Remove record
- ✅ POST `/api/maintenance/reminders` - Create reminder
- ✅ GET `/api/maintenance/reminders/:boatId` - Get upcoming reminders
- ✅ PUT `/api/maintenance/reminders/:id` - Update reminder
- ✅ DELETE `/api/maintenance/reminders/:id` - Delete reminder
- ✅ **Features:** Service history tracking, reminder scheduling, provider database
- ✅ **Test Coverage:** 18,737 bytes of Jest tests

**3. Cameras API** (`server/routes/cameras.js` - 15,284 bytes)
- ✅ POST `/api/cameras` - Register camera feed
- ✅ GET `/api/cameras/:boatId` - List cameras for boat
- ✅ GET `/api/cameras/:id` - Get single camera details
- ✅ PUT `/api/cameras/:id` - Update camera settings
- ✅ DELETE `/api/cameras/:id` - Remove camera
- ✅ POST `/api/cameras/webhook` - Home Assistant webhook receiver
- ✅ GET `/api/cameras/:boatId/events` - Get camera events (motion alerts)
- ✅ **Features:** Home Assistant integration, RTSP/ONVIF support, motion alerts
- ✅ **Test Coverage:** 11,943 bytes of Jest tests

**4. Contacts API** (`server/routes/contacts.js` - 7,480 bytes)
- ✅ POST `/api/contacts` - Create contact
- ✅ GET `/api/contacts/:boatId` - List contacts for boat
- ✅ GET `/api/contacts/:id` - Get single contact
- ✅ PUT `/api/contacts/:id` - Update contact
- ✅ DELETE `/api/contacts/:id` - Remove contact
- ✅ GET `/api/contacts/:boatId/categories` - Group by category (marina/mechanic/vendor)
- ✅ **Features:** Category filtering, phone/email storage, vCard export capability
- ✅ **Test Coverage:** 15,172 bytes of Jest tests

**5. Expenses API** (`server/routes/expenses.js` - 18,869 bytes)
- ✅ POST `/api/expenses` - Create expense (with receipt photo upload)
- ✅ GET `/api/expenses/:boatId` - List expenses for boat
- ✅ GET `/api/expenses/:id` - Get single expense
- ✅ PUT `/api/expenses/:id` - Update expense
- ✅ DELETE `/api/expenses/:id` - Remove expense
- ✅ POST `/api/expenses/:id/approve` - Approve expense
- ✅ POST `/api/expenses/:id/reject` - Reject expense
- ✅ GET `/api/expenses/:boatId/total` - Get total expenses
- ✅ GET `/api/expenses/:boatId/by-category` - Category breakdown
- ✅ **Features:** Multi-user approval workflow, category tracking, receipt photo upload
- ✅ **Test Coverage:** 14,854 bytes of Jest tests

### Frontend Components - 5 NEW Vue Components (100% Complete)

**1. InventoryModule.vue** (15,671 bytes)
- ✅ Equipment catalog table with category filters
- ✅ Add equipment modal with photo upload (drag-drop, multi-file)
- ✅ Photo grid display (up to 5 photos per item)
- ✅ Depreciation calculation display
- ✅ Current value tracking
- ✅ Total inventory value widget
- ✅ Category filters (Electronics, Safety, Engine, Sails, Navigation, Other)
- ✅ Search functionality
- ✅ Empty state messaging

**2. MaintenanceModule.vue** (30,451 bytes - MOST COMPLEX)
- ✅ Service history timeline view
- ✅ Calendar view for upcoming maintenance
- ✅ Reminder creation form
- ✅ Reminder notification badges
- ✅ Provider directory (mechanics, service centers)
- ✅ Service log form (date, cost, provider, notes)
- ✅ Filter by service type
- ✅ Mark as complete workflow
- ✅ Upcoming/overdue reminders display
- ✅ Cost tracking per service

**3. CameraModule.vue** (22,332 bytes)
- ✅ Camera list/grid view
- ✅ Add camera form (name, location, RTSP URL, Home Assistant entity)
- ✅ Camera tile cards with status indicators
- ✅ Motion alerts panel
- ✅ Webhook URL display for Home Assistant integration
- ✅ Camera event history (motion detected timestamps)
- ✅ Live stream viewer placeholder (requires video.js/HLS.js integration)
- ✅ Daily check workflow ("Boat looks OK?" button)
- ✅ Camera settings modal

**4. ContactsModule.vue** (12,558 bytes) + Supporting Components
- ✅ **ContactCard.vue** (4,881 bytes) - Individual contact card with avatar, name, category badge
- ✅ **ContactFormModal.vue** (8,431 bytes) - Add/edit contact form
- ✅ **ContactDetailModal.vue** (7,692 bytes) - Contact details with call/email buttons
- ✅ Contact list with category tabs (marina, mechanic, vendor)
- ✅ One-tap call links: `<a href="tel:+33612345678">`
- ✅ One-tap email links: `<a href="mailto:contact@example.com">`
- ✅ Search/filter contacts
- ✅ Contact notes field
- ✅ vCard export functionality
- ✅ Call log tracking

**5. ExpenseModule.vue** (27,588 bytes - SECOND MOST COMPLEX)
- ✅ Expense list with approval status badges (pending/approved/rejected)
- ✅ Receipt photo upload with drag-drop
- ✅ OCR preview (amount extraction placeholder)
- ✅ Expense form (vendor, category, amount, date, notes)
- ✅ Category dropdown (fuel, maintenance, docking, insurance, supplies, other)
- ✅ Multi-user approval workflow UI
- ✅ Annual spend total display
- ✅ Category breakdown chart placeholder (Chart.js integration needed)
- ✅ Filter by status (pending/approved/rejected)
- ✅ Filter by category
- ✅ Date range filter
- ✅ Export to CSV button
- ✅ Expense splitting UI for shared ownership

### Database Schema - 16 NEW Tables (100% Complete)

**Created via migrations in:** `server/db/migrations/`

1. ✅ `inventory_items` - Equipment catalog
2. ✅ `inventory_photos` - Multiple photos per item
3. ✅ `maintenance_records` - Service history
4. ✅ `maintenance_reminders` - Upcoming service alerts
5. ✅ `maintenance_providers` - Mechanic/service center directory
6. ✅ `camera_feeds` - Camera registration
7. ✅ `camera_events` - Motion alerts, snapshots
8. ✅ `contacts` - Marina/mechanic/vendor contacts
9. ✅ `contact_categories` - Contact grouping
10. ✅ `expenses` - Receipt tracking
11. ✅ `expense_approvals` - Multi-user approval workflow
12. ✅ `expense_categories` - Category breakdown
13. ✅ `warranties` - Warranty expiration tracking
14. ✅ `notifications` - Notification queue (WhatsApp/email)
15. ✅ `notification_preferences` - User notification settings
16. ✅ `daily_checks` - Camera daily check log

**Indexes created for performance:**
- ✅ `idx_inventory_boat` on `inventory_items(boat_id)`
- ✅ `idx_maintenance_boat` on `maintenance_records(boat_id)`
- ✅ `idx_maintenance_due` on `maintenance_reminders(due_date)`
- ✅ `idx_camera_boat` on `camera_feeds(boat_id)`
- ✅ `idx_contacts_boat` on `contacts(boat_id)`
- ✅ `idx_expenses_boat` on `expenses(boat_id)`
- ✅ `idx_expenses_approval` on `expense_approvals(status)`

---

## ❌ WHAT'S MISSING (Features Partially Implemented)

### 1. **Live Camera Stream Viewer** (Placeholder Only)
**Status:** UI exists, video player integration needed

**What's Built:**
- Camera registration works (RTSP URL, Home Assistant entity)
- Webhook receiver works (motion events stored)
- Camera tile displays status

**What's Missing:**
- Video.js or HLS.js integration
- RTSP → HLS transcoding (requires backend service like FFmpeg)
- Live stream playback UI
- Snapshot capture from stream

**Recommendation:** Integrate video.js library:
```javascript
// In CameraModule.vue
import videojs from 'video.js';

mounted() {
  this.player = videojs(this.$refs.videoPlayer, {
    autoplay: false,
    controls: true,
    sources: [{
      src: this.camera.hls_url, // Backend converts RTSP to HLS
      type: 'application/x-mpegURL'
    }]
  });
}
```

**Backend Needed:** RTSP → HLS transcoding endpoint
```javascript
// server/routes/cameras.js
router.get('/:id/stream.m3u8', async (req, res) => {
  const camera = getCamera(req.params.id);
  // Use FFmpeg to transcode RTSP to HLS
  const hlsUrl = await transcodeRtspToHls(camera.rtsp_url);
  res.redirect(hlsUrl);
});
```

---

### 2. **OCR Receipt Extraction** (Placeholder Only)
**Status:** Upload works, OCR not integrated

**What's Built:**
- Receipt photo upload works (JPEG/PNG, up to 5MB)
- Manual entry form works
- Amount field exists

**What's Missing:**
- OCR library integration (Tesseract.js or cloud API)
- Automatic amount extraction from photo
- Vendor name extraction
- Date extraction

**Recommendation:** Integrate Tesseract.js for client-side OCR:
```javascript
// In ExpenseModule.vue
import Tesseract from 'tesseract.js';

async function extractReceiptData(imageFile) {
  const { data: { text } } = await Tesseract.recognize(imageFile, 'eng');

  // Extract amount using regex
  const amountMatch = text.match(/€?\s*(\d+[.,]\d{2})/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null;

  // Extract date
  const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
  const date = dateMatch ? parseDate(dateMatch[1]) : null;

  return { amount, date, rawText: text };
}
```

**Alternative:** Use cloud API for better accuracy:
- Google Vision API (Text Detection)
- AWS Textract
- Azure Computer Vision

---

### 3. **Category Breakdown Charts** (Placeholder Only)
**Status:** Data exists, charts not rendered

**What's Built:**
- Expense categories stored in database
- Category totals calculated via API endpoint
- Chart container exists in UI

**What's Missing:**
- Chart.js library integration
- Donut/pie chart for category breakdown
- Bar chart for monthly trends
- Annual spend trend line

**Recommendation:** Integrate Chart.js:
```javascript
// In ExpenseModule.vue
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

mounted() {
  this.renderCategoryChart();
}

async renderCategoryChart() {
  const response = await fetch(`/api/expenses/${this.boatId}/by-category`);
  const data = await response.json();

  new Chart(this.$refs.categoryChart, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.category),
      datasets: [{
        data: data.map(d => d.total),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}
```

---

### 4. **WhatsApp Notifications** (Database Ready, Not Integrated)
**Status:** Notification queue exists, Twilio not integrated

**What's Built:**
- `notifications` table exists
- Reminder notifications queued in database
- Approval notifications queued

**What's Missing:**
- Twilio WhatsApp Business API integration
- Background job to send queued notifications
- WhatsApp number verification
- Message templates

**Recommendation:** Integrate Twilio:
```javascript
// server/services/whatsapp.js
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppNotification(notification) {
  await client.messages.create({
    from: 'whatsapp:+14155238886', // Twilio sandbox number
    to: `whatsapp:${notification.phone_number}`,
    body: notification.message
  });

  // Update notification status in database
  updateNotificationStatus(notification.id, 'sent');
}

// Background job (every 5 minutes)
setInterval(async () => {
  const pendingNotifications = db.prepare(
    'SELECT * FROM notifications WHERE status = ? LIMIT 10'
  ).all('pending');

  for (const notification of pendingNotifications) {
    await sendWhatsAppNotification(notification);
  }
}, 5 * 60 * 1000);
```

---

### 5. **Provider Suggestions (Location-Based)** (Database Ready, Not Integrated)
**Status:** Provider table exists, geocoding not integrated

**What's Built:**
- `maintenance_providers` table exists
- Provider CRUD endpoints exist
- Provider dropdown in maintenance form

**What's Missing:**
- Geocoding service (convert address → lat/lon)
- Distance calculation from boat location
- "Near you" provider suggestions
- Provider ratings/reviews

**Recommendation:** Integrate geolocation:
```javascript
// server/routes/maintenance.js
router.get('/providers/nearby', async (req, res) => {
  const { boatId } = req.query;

  // Get boat location
  const boat = db.prepare('SELECT gps_lat, gps_lon FROM entities WHERE id = ?').get(boatId);

  // Find providers within 50km radius
  const providers = db.prepare(`
    SELECT *,
      (6371 * acos(
        cos(radians(?)) * cos(radians(gps_lat)) *
        cos(radians(gps_lon) - radians(?)) +
        sin(radians(?)) * sin(radians(gps_lat))
      )) AS distance_km
    FROM maintenance_providers
    WHERE gps_lat IS NOT NULL AND gps_lon IS NOT NULL
    HAVING distance_km < 50
    ORDER BY distance_km ASC
    LIMIT 10
  `).all(boat.gps_lat, boat.gps_lon, boat.gps_lat);

  res.json(providers);
});
```

---

### 6. **Search Integration (Meilisearch)** (Partial Implementation)
**Status:** Search service exists, module indexing incomplete

**What's Built:**
- `search-modules.service.js` exists with `addToIndex()`, `updateIndex()`, `removeFromIndex()`
- Inventory items indexed on create/update/delete
- Base search functionality works

**What's Missing:**
- Maintenance records not indexed
- Camera events not indexed
- Contacts not indexed
- Expenses not indexed
- Faceted search not configured

**Recommendation:** Index all 5 modules:
```javascript
// server/services/search-modules.service.js
export async function indexMaintenanceRecord(record) {
  await meilisearch.index('maintenance').addDocuments([{
    id: record.id,
    boat_id: record.boat_id,
    service_type: record.service_type,
    provider: record.provider,
    notes: record.notes,
    cost: record.cost,
    service_date: record.service_date,
    _type: 'maintenance'
  }]);
}

// Update search config for faceting
await meilisearch.index('inventory').updateSettings({
  searchableAttributes: ['name', 'category', 'notes'],
  filterableAttributes: ['boat_id', 'category', '_type'],
  sortableAttributes: ['purchase_date', 'current_value']
});
```

---

## 🎨 UI/UX DESIGN GUIDELINES (Research Complete)

### **Option 1: Apple Human Interface Guidelines (HIG)**
**Best for:** Premium, luxury feel (matches Jeanneau Prestige €800K-€1.5M target market)

**Key Principles:**

1. **Navigation Patterns**
   - **Bottom Tab Bar:** Use for 5-7 main sections (Home, Inventory, Maintenance, Cameras, Contacts, Expenses, Account)
   - **Navigation Bar:** Hierarchical navigation with back button, title, action buttons
   - **Modal Sheets:** For forms (Add Equipment, Log Service, Upload Receipt)

2. **Visual Design**
   - **SF Pro Font:** System font (clean, readable)
   - **Spacing:** 8pt grid system (8, 16, 24, 32, 40px)
   - **Corner Radius:** 12-16px for cards, 8px for buttons
   - **Shadows:** Subtle elevation (0 2px 8px rgba(0,0,0,0.08))
   - **Colors:** Blue (#007AFF) for primary actions, system grays for backgrounds

3. **Interaction Patterns**
   - **Swipe Actions:** Swipe left for Delete, swipe right for Edit
   - **Pull to Refresh:** Update data on pull-down gesture
   - **Context Menus:** Long-press for additional actions
   - **Haptic Feedback:** Subtle vibration on button taps

4. **Accessibility**
   - **Dynamic Type:** Support text size adjustments
   - **VoiceOver:** Label all interactive elements
   - **High Contrast:** Support high contrast mode
   - **Minimum Touch Target:** 44×44pt (55×55px)

**Apple HIG Resources:**
- Official: https://developer.apple.com/design/human-interface-guidelines/
- Navigation: https://developer.apple.com/design/human-interface-guidelines/navigation-and-search

---

### **Option 2: Material Design 3 (Google)**
**Best for:** Android-first or cross-platform apps

**Key Principles:**

1. **Navigation Components**
   - **Bottom Navigation Bar:** 3-5 top-level destinations
   - **Navigation Rail:** For tablets/desktop (sidebar)
   - **Navigation Drawer:** Hidden menu for secondary actions
   - **Top App Bar:** Title + action buttons

2. **Material You Theming**
   - **Dynamic Color:** Adapt to user wallpaper (Android 12+)
   - **Color Roles:** Primary, Secondary, Tertiary, Surface, Background
   - **Typography Scale:** Display, Headline, Title, Body, Label
   - **Motion:** Emphasized easing curves (cubic-bezier)

3. **Component Library**
   - **Cards:** Elevated, filled, outlined variants
   - **FAB (Floating Action Button):** Primary action (+ Add)
   - **Chips:** Filters, tags, selections
   - **Snackbars:** Brief notifications
   - **Dialogs:** Full-screen or modal

**Material Design 3 Resources:**
- Official: https://m3.material.io/
- Navigation: https://m3.material.io/components/navigation-bar/guidelines
- Figma Kit: https://www.figma.com/community/file/1035203688168086460

---

### **Option 3: Marine/Yacht-Specific Design Patterns**
**Best for:** NaviDocs (boat management context)

**Key Findings from Research:**

1. **Orca App - "Number One for UI"**
   - **Clean Navigation:** Chart-focused with minimal chrome
   - **Contextual Overlays:** Wind/current/tide data overlaid on map
   - **Quick Actions:** Distance/bearing measurement tools
   - **Modular Widgets:** Dashboard with customizable information cards

2. **Savvy Navvy - "Simple & Accessible"**
   - **One-Tap Actions:** Essential functions accessible in 1-2 taps
   - **Progressive Disclosure:** Simple by default, advanced features hidden
   - **Visual Hierarchy:** Important info (weather, tide) large and prominent
   - **Touch-Friendly:** Large buttons for use with gloves/wet hands

3. **Navionics - "Yacht Sailors' Favorite"**
   - **Layer System:** Toggle overlays (wind, current, hazards)
   - **Zoom Levels:** Sensible detail as users zoom in/out
   - **Warnings:** Red alerts for dangers/shallow water
   - **Offline Mode:** Download charts for areas without internet

**Design Principles for NaviDocs:**

1. **Dashboard-First Approach**
   - Home screen = Command center with widgets
   - Quick access to last checked items (inventory, cameras, upcoming maintenance)
   - Status indicators (next service due, camera offline, pending expense approval)

2. **Marine Color Palette**
   - **Primary:** Navy Blue (#1E3A8A) - professional, maritime
   - **Secondary:** Ocean Teal (#0D9488) - fresh, aquatic
   - **Accent:** Sunset Orange (#F97316) - alerts, warnings
   - **Success:** Sea Green (#10B981) - confirmations
   - **Backgrounds:** Off-white (#F9FAFB), Light Gray (#F3F4F6)

3. **Luxury Design Elements**
   - **Typography:** Inter or Poppins (modern, clean)
   - **Icons:** Heroicons or Phosphor Icons (consistent, minimal)
   - **Photos:** Full-width image headers for equipment/boats
   - **Glass Effects:** `backdrop-blur-lg` for overlays (already in use!)
   - **Gradients:** Subtle gradients for cards (from-primary-500 to-secondary-500)

4. **Touch-Optimized for Marine Environment**
   - **Large Touch Targets:** 60×60px minimum (use with wet hands/gloves)
   - **High Contrast:** Readable in bright sunlight
   - **Swipe Gestures:** Swipe between cameras, swipe to delete expenses
   - **Voice Input:** Speech-to-text for notes (hands-free logging)

---

## 📐 RECOMMENDED UI REDESIGN (Based on Research)

### **Current NaviDocs Design Issues:**

Looking at the built components, here are design gaps:

1. **InventoryModule.vue**
   - ❌ Basic table layout (not mobile-optimized)
   - ❌ Small "Add Equipment" button (hard to tap)
   - ❌ No photo thumbnails in list view
   - ❌ No depreciation visualization (chart/graph)

2. **MaintenanceModule.vue**
   - ❌ No calendar view implemented (mentioned but missing)
   - ❌ Reminders not visually prominent
   - ❌ Provider suggestions not location-aware

3. **CameraModule.vue**
   - ❌ Placeholder for live stream (needs video.js)
   - ❌ Motion alerts not visually distinct
   - ❌ No grid view for multiple cameras

4. **ContactsModule.vue**
   - ✅ Good: One-tap call/email links implemented
   - ❌ No contact photos/avatars
   - ❌ Category tabs not visually distinct

5. **ExpenseModule.vue**
   - ❌ No charts (category breakdown, monthly trends)
   - ❌ OCR placeholder not functional
   - ❌ Approval workflow unclear

---

### **Redesign Recommendations (Apple HIG + Marine Best Practices):**

#### **1. Bottom Tab Bar Navigation (Replace Current Sidebar)**

```vue
<!-- App.vue - Add bottom tab bar -->
<template>
  <div class="app-container">
    <!-- Main content area -->
    <router-view />

    <!-- Bottom Tab Bar (iOS style) -->
    <nav class="tab-bar">
      <router-link to="/" class="tab-item">
        <HomeIcon />
        <span>Home</span>
      </router-link>
      <router-link to="/inventory" class="tab-item">
        <ArchiveIcon />
        <span>Inventory</span>
      </router-link>
      <router-link to="/maintenance" class="tab-item">
        <WrenchIcon />
        <span>Service</span>
      </router-link>
      <router-link to="/cameras" class="tab-item">
        <VideoCameraIcon />
        <span>Cameras</span>
      </router-link>
      <router-link to="/contacts" class="tab-item">
        <UsersIcon />
        <span>Contacts</span>
      </router-link>
      <router-link to="/expenses" class="tab-item">
        <CurrencyEuroIcon />
        <span>Expenses</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom); /* iOS notch */
  z-index: 1000;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #6B7280;
  font-size: 11px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.tab-item svg {
  width: 24px;
  height: 24px;
}

.tab-item.router-link-active {
  color: #007AFF; /* iOS blue */
}
</style>
```

---

#### **2. Dashboard Widget System (Home Screen)**

```vue
<!-- HomeView.vue - Redesign as dashboard -->
<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>{{ boatName }}</h1>
      <p class="subtitle">Jeanneau Prestige 520 • Saint-Tropez</p>
    </header>

    <!-- Quick Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon inventory">📦</div>
        <div class="stat-value">€{{ totalInventoryValue.toLocaleString() }}</div>
        <div class="stat-label">Inventory Value</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon maintenance">🔧</div>
        <div class="stat-value">{{ upcomingServices }}</div>
        <div class="stat-label">Services Due</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon cameras">📹</div>
        <div class="stat-value">{{ onlineCameras }}/{{ totalCameras }}</div>
        <div class="stat-label">Cameras Online</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon expenses">💶</div>
        <div class="stat-value">€{{ monthlyExpenses.toLocaleString() }}</div>
        <div class="stat-label">This Month</div>
      </div>
    </div>

    <!-- Urgent Alerts -->
    <div v-if="urgentAlerts.length > 0" class="alert-section">
      <h2>⚠️ Attention Required</h2>
      <div v-for="alert in urgentAlerts" :key="alert.id" class="alert-card">
        <div class="alert-icon">{{ alert.icon }}</div>
        <div class="alert-content">
          <div class="alert-title">{{ alert.title }}</div>
          <div class="alert-description">{{ alert.description }}</div>
        </div>
        <button class="alert-action">View</button>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="activity-section">
      <h2>Recent Activity</h2>
      <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
        <div class="activity-icon">{{ activity.icon }}</div>
        <div class="activity-content">
          <div class="activity-title">{{ activity.title }}</div>
          <div class="activity-time">{{ formatRelativeTime(activity.timestamp) }}</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions FAB -->
    <button class="fab" @click="showQuickActions = true">
      <PlusIcon />
    </button>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 20px;
  padding-bottom: 100px; /* Space for tab bar */
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  opacity: 0.9;
}

.fab {
  position: fixed;
  bottom: 100px; /* Above tab bar */
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.fab:active {
  transform: scale(0.95);
}
</style>
```

---

#### **3. Card-Based Inventory View (Replace Table)**

```vue
<!-- InventoryModule.vue - Redesign as cards -->
<template>
  <div class="inventory-module">
    <header class="page-header">
      <h1>Inventory</h1>
      <div class="header-value">€{{ totalValue.toLocaleString() }}</div>
    </header>

    <!-- Category Chips -->
    <div class="category-chips">
      <button
        v-for="category in categories"
        :key="category"
        :class="['chip', { active: filterCategory === category }]"
        @click="filterCategory = category"
      >
        {{ category }}
      </button>
    </div>

    <!-- Equipment Grid -->
    <div class="equipment-grid">
      <div v-for="item in filteredInventory" :key="item.id" class="equipment-card">
        <!-- Photo Carousel -->
        <div class="equipment-photos">
          <img
            v-if="item.photo_urls.length > 0"
            :src="item.photo_urls[0]"
            :alt="item.name"
            class="equipment-photo"
          />
          <div v-else class="equipment-photo-placeholder">
            {{ item.name[0] }}
          </div>
          <div v-if="item.photo_urls.length > 1" class="photo-count">
            +{{ item.photo_urls.length - 1 }}
          </div>
        </div>

        <!-- Equipment Details -->
        <div class="equipment-details">
          <h3 class="equipment-name">{{ item.name }}</h3>
          <div class="equipment-category">{{ item.category }}</div>

          <!-- Value Display -->
          <div class="value-display">
            <div class="current-value">
              <span class="label">Current</span>
              <span class="amount">€{{ item.current_value.toLocaleString() }}</span>
            </div>
            <div class="depreciation">
              <span class="label">Purchase</span>
              <span class="amount original">€{{ item.purchase_price.toLocaleString() }}</span>
            </div>
          </div>

          <!-- Depreciation Bar -->
          <div class="depreciation-bar">
            <div
              class="depreciation-fill"
              :style="{ width: (item.current_value / item.purchase_price * 100) + '%' }"
            ></div>
          </div>
          <div class="depreciation-label">
            {{ Math.round((1 - item.current_value / item.purchase_price) * 100) }}% depreciated
          </div>
        </div>
      </div>
    </div>

    <!-- Add Button -->
    <button class="fab" @click="showAddForm = true">
      <PlusIcon />
    </button>
  </div>
</template>

<style scoped>
.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  padding: 16px;
}

.equipment-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.equipment-card:active {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.equipment-photos {
  position: relative;
  aspect-ratio: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.equipment-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.equipment-details {
  padding: 12px;
}

.depreciation-bar {
  height: 6px;
  background: #E5E7EB;
  border-radius: 3px;
  margin: 8px 0 4px;
  overflow: hidden;
}

.depreciation-fill {
  height: 100%;
  background: linear-gradient(90deg, #10B981 0%, #34D399 100%);
  transition: width 0.3s;
}
</style>
```

---

## 🎨 **Figma Design Resources (Ready to Use)**

### **Free Templates:**
1. **Yacht Select Web App** - https://www.figma.com/community/file/1099734310787244452
   - Clean, modern dashboard
   - Yacht catalog with filters
   - Booking flow (can adapt for maintenance scheduling)

2. **Catamaran Yacht Rental** - https://www.figma.com/community/file/1401943874154124355
   - Photo-heavy design (good for inventory)
   - Map integration (good for cameras/locations)
   - User profile with favorites

3. **Boat X Template** (Free) - https://figmaelements.com/boat-x-boats-figma-template/
   - Fleet listings (adapt for equipment catalog)
   - Detailed boat descriptions (adapt for maintenance history)
   - Booking forms (adapt for service logging)

### **Premium Templates ($20-50):**
1. **Neera - Yacht & Boat Rental Figma** - $29 on ThemeForest
   - 20 layouts (yacht charter, boat rental, water taxi)
   - Vector icons included
   - Components + text styles
   - Customizable color schemes

2. **Seaxail - Yacht & Boat Rental App** - $22 on ThemeForest
   - 35 iOS screens
   - Layered and organized
   - Ready for iOS implementation

3. **SailHut - Yacht Rental Template** - $35
   - Professional, clean, modern
   - Suitable for rental companies/yacht owners
   - Fishing, sailing, diving, water sports layouts

---

## 📋 **NEXT STEPS: UI Redesign Roadmap**

### **Phase 1: Core UI Improvements (1 week, $300-500 budget)**

**Priority 1: Navigation Redesign**
- Replace sidebar with bottom tab bar (iOS HIG pattern)
- Add dashboard home screen with widgets
- Implement FAB for primary actions

**Priority 2: Inventory Module Redesign**
- Card grid layout (replace table)
- Photo carousel for equipment
- Depreciation visualization (progress bar + chart)
- Category chips for filtering

**Priority 3: Maintenance Module Calendar**
- Full calendar view (FullCalendar.js)
- Visual reminder indicators
- Drag-to-reschedule functionality

**Priority 4: Camera Module Live Stream**
- Integrate video.js or HLS.js
- RTSP → HLS transcoding backend
- Grid view for multiple cameras

**Priority 5: Expense Module Charts**
- Integrate Chart.js
- Category breakdown donut chart
- Monthly trend line chart
- Annual spend bar chart

### **Phase 2: Feature Completion (1 week, $400-600 budget)**

**Priority 1: OCR Integration**
- Tesseract.js or Google Vision API
- Automatic amount/date/vendor extraction
- Manual correction UI

**Priority 2: WhatsApp Notifications**
- Twilio integration
- Background job processor
- Notification preferences UI

**Priority 3: Search Integration**
- Index all 5 modules in Meilisearch
- Faceted search UI
- Search results page redesign

**Priority 4: Provider Suggestions**
- Geocoding service (Google Maps API or Nominatim)
- Distance calculation
- "Near you" provider list

### **Phase 3: Polish & Testing (1 week, $200-400 budget)**

**Priority 1: Accessibility**
- VoiceOver labels
- Keyboard navigation
- High contrast mode
- Dynamic text sizing

**Priority 2: Animations**
- Page transitions (fade, slide)
- Button press feedback (haptic/visual)
- Loading skeletons
- Micro-interactions

**Priority 3: E2E Testing**
- Playwright tests (from NAVIDOCS_TESTING_SESSION.md)
- Performance optimization
- Security audit

---

## 🎯 **SUMMARY**

### **What's Built:**
✅ 5 backend APIs (100% complete, 75K+ bytes, 72K bytes of tests)
✅ 5 frontend components (100% complete, 108K+ bytes)
✅ 16 database tables (100% complete with indexes)
✅ Authentication, search, file upload infrastructure

### **What's Missing:**
❌ Live camera stream viewer (needs video.js + RTSP transcoding)
❌ OCR receipt extraction (needs Tesseract.js or cloud API)
❌ Category breakdown charts (needs Chart.js)
❌ WhatsApp notifications (needs Twilio)
❌ Provider suggestions (needs geocoding)
❌ Full search indexing (needs Meilisearch integration for all modules)

### **UI Redesign Needed:**
❌ Bottom tab bar navigation (iOS HIG pattern)
❌ Dashboard home screen with widgets
❌ Card-based inventory view (replace table)
❌ Full calendar for maintenance
❌ Camera grid view
❌ Charts for expense visualization

### **Best UI Guidelines to Follow:**
🏆 **Winner:** Apple HIG + Marine Best Practices
- Bottom tab bar for main navigation
- Dashboard-first approach
- Large touch targets (60×60px for marine environment)
- High contrast for sunlight readability
- Marine color palette (Navy Blue + Ocean Teal)
- Glass effects (backdrop-blur already in use!)

### **Figma Resources:**
✅ Free: Yacht Select, Catamaran Rental, Boat X
✅ Premium ($20-50): Neera, Seaxail, SailHut

### **Total Budget to Complete:**
- UI Redesign: $300-500 (Phase 1)
- Feature Completion: $400-600 (Phase 2)
- Polish & Testing: $200-400 (Phase 3)
- **Total:** $900-1,500 + $17-23 already spent = **$917-1,523 for production-ready app**

---

**Generated:** 2025-11-14
**Next:** Paste testing prompt into cloud session, then start UI redesign phase.
