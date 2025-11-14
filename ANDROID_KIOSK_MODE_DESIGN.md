# NaviDocs Android Tablet Kiosk Mode - Wall-Mounted Boat Display

**Created:** 2025-11-14
**Use Case:** Wall-mounted Android tablet showing always-on boat status dashboard

---

## User Requirements

**Primary Goal:** Wall-mounted tablet that shows critical boat information at a glance

**Modes:**
1. **Sleep Mode** - Clock + weather + critical alerts (screen dimmed, always-on)
2. **Active Mode** - Full NaviDocs interface (tap to wake)

**Critical Data (Always Visible in Sleep Mode):**
- Current time
- Weather (temp, wind, waves)
- Important pressing alerts (maintenance due, low fuel, camera offline)

---

## Hardware Recommendations

### **Recommended Tablet:**
**Samsung Galaxy Tab A9+ (2023)**
- ✅ 11" display (readable from 3m distance)
- ✅ 1920×1200 resolution (sharp text)
- ✅ Auto-brightness (adapts to cabin lighting)
- ✅ WiFi + LTE (works at marina or at sea with cellular)
- ✅ USB-C charging (can be wired to boat's 12V system via converter)
- ✅ Android 13+ (supports always-on display, kiosk mode)
- 💰 €229 (affordable for yacht market)

**Alternative (Budget):**
- Lenovo Tab M10 Plus (3rd Gen) - €199, 10.6" display

**Alternative (Premium):**
- Samsung Galaxy Tab S9 - €799, 11" AMOLED (better sunlight visibility)

### **Mounting:**
**RAM Mounts X-Grip Universal Tablet Mount**
- ✅ Marine-grade (waterproof, corrosion-resistant)
- ✅ Adjustable arm (swivel for viewing angle)
- ✅ Vibration-dampening (boat engine vibrations)
- ✅ Quick release (remove for software updates)
- 💰 €89

**Power:**
**Victron Orion-Tr 12V to 5V USB Converter**
- ✅ Hardwired to boat's 12V system
- ✅ Continuous charging (never dies)
- ✅ Marine-grade (protected from voltage spikes)
- 💰 €34

---

## Kiosk Mode Design

### **1. Sleep Mode (Always-On Display)**

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│            14:32                        │
│          Wednesday                      │
│        November 14                      │
│                                         │
│  ☀️ 24°C      💨 12 kts      🌊 0.8m   │
│                                         │
│  ⚠️ Oil change due in 3 days           │
│                                         │
│  🔴 Aft camera offline                 │
│                                         │
│                                         │
│       (Tap anywhere to wake)            │
│                                         │
└─────────────────────────────────────────┘
```

**Visual Design:**

```vue
<template>
  <div class="kiosk-sleep-mode" @click="wakeUp">
    <!-- Clock (Large, Centered) -->
    <div class="kiosk-clock">
      <p class="time">{{ currentTime }}</p>
      <p class="date">{{ currentDate }}</p>
    </div>

    <!-- Weather Strip (Garmin-style metrics) -->
    <div class="weather-strip">
      <div class="weather-metric">
        <span class="icon">☀️</span>
        <span class="value">{{ weather.temp }}°C</span>
      </div>
      <div class="weather-metric">
        <span class="icon">💨</span>
        <span class="value">{{ weather.windSpeed }} kts</span>
        <span class="direction">{{ weather.windDirection }}</span>
      </div>
      <div class="weather-metric">
        <span class="icon">🌊</span>
        <span class="value">{{ weather.waveHeight }}m</span>
      </div>
    </div>

    <!-- Critical Alerts (Max 3) -->
    <div class="alert-list">
      <div
        v-for="alert in criticalAlerts.slice(0, 3)"
        :key="alert.id"
        :class="['alert-item', `severity-${alert.severity}`]"
      >
        <span class="alert-icon">{{ alert.icon }}</span>
        <span class="alert-text">{{ alert.message }}</span>
      </div>
    </div>

    <!-- Wake Hint -->
    <p class="wake-hint">Tap anywhere to wake</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref('')
const currentDate = ref('')
const weather = ref({
  temp: 24,
  windSpeed: 12,
  windDirection: 'NE',
  waveHeight: 0.8
})

const criticalAlerts = ref([
  { id: 1, severity: 'warning', icon: '⚠️', message: 'Oil change due in 3 days' },
  { id: 2, severity: 'critical', icon: '🔴', message: 'Aft camera offline' }
])

// Update clock every second
let clockInterval
onMounted(() => {
  updateClock()
  clockInterval = setInterval(updateClock, 1000)

  // Fetch weather every 10 minutes
  fetchWeather()
  setInterval(fetchWeather, 10 * 60 * 1000)

  // Fetch alerts every 1 minute
  fetchAlerts()
  setInterval(fetchAlerts, 60 * 1000)
})

onUnmounted(() => {
  clearInterval(clockInterval)
})

function updateClock() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  currentDate.value = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

async function fetchWeather() {
  const response = await fetch('/api/weather/current')
  const data = await response.json()
  weather.value = data
}

async function fetchAlerts() {
  const response = await fetch('/api/alerts/critical')
  const data = await response.json()
  criticalAlerts.value = data
}

function wakeUp() {
  // Transition to active mode
  window.dispatchEvent(new CustomEvent('kiosk:wake'))
}
</script>

<style scoped>
.kiosk-sleep-mode {
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;

  /* Dim screen for sleep mode */
  filter: brightness(0.4);
  transition: filter 0.3s ease;
}

.kiosk-sleep-mode:active {
  filter: brightness(1);
}

.kiosk-clock {
  text-align: center;
  margin-bottom: 64px;
}

.time {
  font-size: 96px; /* Massive clock (readable from 5m) */
  font-weight: 300;
  line-height: 1;
  margin-bottom: 16px;
  font-variant-numeric: tabular-nums; /* Monospaced digits */
}

.date {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.6);
}

.weather-strip {
  display: flex;
  gap: 64px;
  margin-bottom: 64px;
}

.weather-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.weather-metric .icon {
  font-size: 48px;
}

.weather-metric .value {
  font-size: 36px;
  font-weight: 600;
  color: #0EA5E9; /* Sky blue */
}

.weather-metric .direction {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.6);
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 600px;
  margin-bottom: 64px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.05);
  border-left: 4px solid;
  border-radius: 8px;
}

.alert-item.severity-warning {
  border-color: #F59E0B; /* Amber */
}

.alert-item.severity-critical {
  border-color: #EF4444; /* Red */
}

.alert-icon {
  font-size: 32px;
}

.alert-text {
  font-size: 24px;
  font-weight: 500;
}

.wake-hint {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.4);
  animation: pulse 3s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
</style>
```

---

### **2. Active Mode (Full Interface)**

**Tap Anywhere → Transition to Full Dashboard**

```vue
<template>
  <div class="kiosk-active-mode">
    <!-- Top Status Bar (Always Visible) -->
    <div class="kiosk-status-bar">
      <div class="status-left">
        <span class="time">{{ currentTime }}</span>
        <span class="weather-compact">
          24°C · 12 kts · 0.8m
        </span>
      </div>
      <div class="status-right">
        <span class="battery">🔋 86%</span>
        <span class="wifi">📶 WiFi</span>
      </div>
    </div>

    <!-- Main Dashboard Grid -->
    <div class="dashboard-grid">
      <!-- Camera Grid (4 feeds) -->
      <div class="dashboard-card cameras">
        <h2>Cameras</h2>
        <div class="camera-grid">
          <div v-for="camera in cameras" :key="camera.id" class="camera-tile">
            <img :src="camera.thumbnail" alt="" />
            <span :class="['status-dot', camera.online ? 'online' : 'offline']"></span>
            <p class="camera-name">{{ camera.name }}</p>
          </div>
        </div>
      </div>

      <!-- Weather Detail -->
      <div class="dashboard-card weather">
        <h2>Weather</h2>
        <div class="weather-detail">
          <div class="current-temp">24°C</div>
          <div class="forecast-strip">
            <div v-for="day in forecast" :key="day.date" class="forecast-day">
              <p>{{ day.dayName }}</p>
              <p class="temp-high">{{ day.tempHigh }}°</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Maintenance Countdown -->
      <div class="dashboard-card maintenance">
        <h2>Maintenance</h2>
        <div class="countdown-list">
          <div v-for="task in upcomingMaintenance" :key="task.id" class="countdown-item">
            <div class="countdown-value">{{ task.daysUntil }}</div>
            <div class="countdown-label">days</div>
            <p class="task-name">{{ task.name }}</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions (Large Buttons) -->
      <div class="dashboard-card quick-actions">
        <button class="quick-action-btn" @click="$router.push('/inventory')">
          <span class="icon">📦</span>
          <span class="label">Inventory</span>
        </button>
        <button class="quick-action-btn" @click="$router.push('/expenses')">
          <span class="icon">💰</span>
          <span class="label">Expenses</span>
        </button>
        <button class="quick-action-btn" @click="$router.push('/contacts')">
          <span class="icon">📞</span>
          <span class="label">Contacts</span>
        </button>
        <button class="quick-action-btn" @click="enterSleepMode">
          <span class="icon">🌙</span>
          <span class="label">Sleep</span>
        </button>
      </div>
    </div>

    <!-- Auto-sleep after 5 minutes of inactivity -->
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const cameras = ref([
  { id: 1, name: 'Bow', thumbnail: '/camera-snapshots/bow.jpg', online: true },
  { id: 2, name: 'Stern', thumbnail: '/camera-snapshots/stern.jpg', online: true },
  { id: 3, name: 'Port', thumbnail: '/camera-snapshots/port.jpg', online: false },
  { id: 4, name: 'Starboard', thumbnail: '/camera-snapshots/starboard.jpg', online: true }
])

const forecast = ref([
  { date: '2025-11-14', dayName: 'Thu', tempHigh: 24 },
  { date: '2025-11-15', dayName: 'Fri', tempHigh: 26 },
  { date: '2025-11-16', dayName: 'Sat', tempHigh: 23 }
])

const upcomingMaintenance = ref([
  { id: 1, name: 'Oil change', daysUntil: 3 },
  { id: 2, name: 'Hull cleaning', daysUntil: 12 }
])

// Auto-sleep after 5 minutes of inactivity
let sleepTimeout
function resetSleepTimer() {
  clearTimeout(sleepTimeout)
  sleepTimeout = setTimeout(enterSleepMode, 5 * 60 * 1000) // 5 minutes
}

onMounted(() => {
  // Reset sleep timer on any interaction
  window.addEventListener('click', resetSleepTimer)
  window.addEventListener('touchstart', resetSleepTimer)
  resetSleepTimer()
})

onBeforeUnmount(() => {
  clearTimeout(sleepTimeout)
  window.removeEventListener('click', resetSleepTimer)
  window.removeEventListener('touchstart', resetSleepTimer)
})

function enterSleepMode() {
  window.dispatchEvent(new CustomEvent('kiosk:sleep'))
}
</script>

<style scoped>
.kiosk-active-mode {
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  min-height: 100vh;
  color: rgba(255, 255, 255, 0.9);
}

.kiosk-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 18px;
}

.status-left,
.status-right {
  display: flex;
  gap: 24px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 24px;
  padding: 24px;
  height: calc(100vh - 64px); /* Subtract status bar height */
}

.dashboard-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  overflow: hidden;
}

.dashboard-card h2 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #0EA5E9; /* Sky blue */
}

/* Camera Grid */
.cameras {
  grid-column: 1 / 2;
  grid-row: 1 / 3; /* Span 2 rows */
}

.camera-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.camera-tile {
  position: relative;
  aspect-ratio: 4/3;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.camera-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-dot {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.status-dot.online {
  background: #10B981; /* Green */
  box-shadow: 0 0 16px #10B981;
  animation: pulse-dot 2s infinite;
}

.status-dot.offline {
  background: #EF4444; /* Red */
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.camera-name {
  position: absolute;
  bottom: 8px;
  left: 8px;
  font-size: 14px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.7);
  padding: 4px 12px;
  border-radius: 4px;
}

/* Weather */
.weather {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
}

.current-temp {
  font-size: 72px;
  font-weight: 300;
  color: #0EA5E9;
  text-align: center;
  margin-bottom: 24px;
}

.forecast-strip {
  display: flex;
  justify-content: space-around;
}

.forecast-day {
  text-align: center;
}

.temp-high {
  font-size: 28px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

/* Maintenance */
.maintenance {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
}

.countdown-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.countdown-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border-left: 4px solid #F59E0B; /* Amber */
}

.countdown-value {
  font-size: 48px;
  font-weight: 700;
  color: #F59E0B;
  min-width: 80px;
  text-align: center;
}

.countdown-label {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
}

.task-name {
  font-size: 20px;
  font-weight: 500;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(13, 148, 136, 0.2));
  border: 1px solid rgba(14, 165, 233, 0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-action-btn:active {
  transform: scale(0.95);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.4), rgba(13, 148, 136, 0.4));
}

.quick-action-btn .icon {
  font-size: 48px;
}

.quick-action-btn .label {
  font-size: 20px;
  font-weight: 600;
}
</style>
```

---

## Android Kiosk Mode Configuration

### **Step 1: Enable Developer Options**
1. Go to **Settings → About tablet**
2. Tap **Build number** 7 times
3. Developer options enabled

### **Step 2: Configure Always-On Display**
1. **Settings → Display → Screen timeout** → **Never** (keep screen always on)
2. **Settings → Display → Brightness** → **Adaptive brightness** ON
3. **Settings → Developer options → Stay awake** → ON (screen never sleeps when charging)

### **Step 3: Enable Kiosk Mode (Single App Lock)**

**Option A: Using Android Enterprise (Free)**
```bash
# Install Google Play Kiosk app
adb install -r kiosk-mode.apk

# Lock to NaviDocs app
adb shell dpm set-device-owner com.navidocs.kiosk/.KioskDeviceAdminReceiver

# This prevents:
# - Home button (can't exit app)
# - Recent apps (can't switch apps)
# - Notifications (won't interrupt)
```

**Option B: Using 3rd-Party Kiosk App**
- **Fully Kiosk Browser** (€15/year) - Recommended
  - Motion detection (wake on approach)
  - Remote management (update URL from cloud)
  - Scheduled reboots (prevent memory leaks)
  - Screenshot API (remote monitoring)

### **Step 4: Prevent Screen Burn-In**
```javascript
// Rotate content every 10 minutes to prevent OLED burn-in
setInterval(() => {
  // Shift clock position slightly
  const clockEl = document.querySelector('.kiosk-clock')
  const randomX = Math.random() * 20 - 10 // -10px to +10px
  const randomY = Math.random() * 20 - 10
  clockEl.style.transform = `translate(${randomX}px, ${randomY}px)`
}, 10 * 60 * 1000)
```

---

## Auto-Wake on Approach (Motion Detection)

**Using Tablet's Front Camera + TensorFlow.js**

```javascript
// Detect person approaching tablet
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'

let model
let video

async function initMotionDetection() {
  model = await cocoSsd.load()

  video = document.createElement('video')
  video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true })
  video.play()

  // Check for person every 2 seconds
  setInterval(detectPerson, 2000)
}

async function detectPerson() {
  const predictions = await model.detect(video)

  const personDetected = predictions.some(p => p.class === 'person' && p.score > 0.6)

  if (personDetected && isInSleepMode) {
    wakeUp()
  }
}
```

**Alternative: PIR Motion Sensor (Hardware)**
- **HC-SR501 PIR Sensor** (€3)
- Connect to tablet via USB OTG + Arduino
- Triggers wake event when motion detected within 5m

---

## Progressive Web App (PWA) Configuration

**Make NaviDocs installable on Android home screen**

```javascript
// public/manifest.json
{
  "name": "NaviDocs Kiosk",
  "short_name": "NaviDocs",
  "description": "Boat management dashboard",
  "start_url": "/kiosk",
  "display": "fullscreen", // Hide status bar and nav bar
  "orientation": "landscape", // Force landscape for wall mount
  "theme_color": "#0F172A",
  "background_color": "#0F172A",
  "icons": [
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Install prompt:**
1. User visits NaviDocs in Chrome
2. Chrome shows "Add to Home Screen" banner
3. Tap → App installs as standalone app
4. Launch from home screen → Full-screen kiosk mode

---

## Offline Mode (For At-Sea Use)

**Service Worker for offline functionality:**

```javascript
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('navidocs-kiosk-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/kiosk',
        '/styles/kiosk.css',
        '/scripts/kiosk.js',
        '/api/weather/last-known', // Cached weather data
        '/camera-snapshots/bow.jpg',
        '/camera-snapshots/stern.jpg'
      ])
    })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if offline
      return response || fetch(event.request)
    })
  )
})
```

---

## Power Management

### **Continuous Charging Setup:**

1. **Mount near 12V power outlet**
2. **Use Victron Orion-Tr converter** (12V → 5V USB-C)
3. **Enable battery saver:**
   - Settings → Battery → Battery Saver → ON when charging
   - Limits background apps to extend battery lifespan

### **Prevent Overheating:**
- Mount in shaded area (not direct sunlight)
- Leave 5cm air gap behind tablet (ventilation)
- Use Samsung's "Adaptive Battery" feature (learns usage patterns, throttles when idle)

---

## Security Considerations

**Prevent Unauthorized Access:**

1. **Disable lock screen in kiosk mode** (no PIN prompt, always shows dashboard)
2. **Admin settings behind hidden gesture** (e.g., 5-finger tap on logo)
3. **Remote wipe capability** (if tablet stolen)

```javascript
// Hidden admin panel access
let tapCount = 0
let tapTimer

function handleLogoTap() {
  tapCount++

  clearTimeout(tapTimer)
  tapTimer = setTimeout(() => { tapCount = 0 }, 2000) // Reset after 2s

  if (tapCount === 5) {
    // Show admin login
    showAdminPanel()
  }
}
```

---

## Implementation Roadmap

### **Phase 1: Core Kiosk Mode (3 days)**
- [ ] Build sleep mode view (clock + weather + alerts)
- [ ] Build active mode view (dashboard grid)
- [ ] Implement tap-to-wake transition
- [ ] Implement auto-sleep after 5 min inactivity
- [ ] Test on Samsung Galaxy Tab A9+

### **Phase 2: Android Configuration (1 day)**
- [ ] Configure always-on display
- [ ] Set up kiosk mode (single app lock)
- [ ] Install Fully Kiosk Browser
- [ ] Configure auto-start on boot

### **Phase 3: Hardware Setup (1 day)**
- [ ] Mount RAM Mounts X-Grip
- [ ] Wire Victron 12V→5V converter
- [ ] Test vibration dampening
- [ ] Test sunlight readability

### **Phase 4: Advanced Features (2 days)**
- [ ] Implement motion detection (auto-wake on approach)
- [ ] Configure PWA (installable app)
- [ ] Set up offline mode (service worker)
- [ ] Implement screen burn-in prevention

**Total Estimate:** 7 days (€5,600 at €80/hr senior dev rate)

**Hardware Costs:**
- Samsung Galaxy Tab A9+ (11"): €229
- RAM Mounts X-Grip: €89
- Victron 12V→5V converter: €34
- USB-C cable (2m): €15
- **Total Hardware:** €367

**Grand Total (Software + Hardware):** €5,967

---

## Testing Checklist

- [ ] Clock updates every second (no lag)
- [ ] Weather updates every 10 minutes
- [ ] Alerts fetch every 1 minute
- [ ] Tap-to-wake works on first tap
- [ ] Auto-sleep activates after exactly 5 minutes
- [ ] Screen brightness adapts to cabin lighting
- [ ] Readable from 3m distance in daylight
- [ ] Readable from 3m distance in darkness (not too bright)
- [ ] Camera thumbnails update every 30 seconds
- [ ] Works offline (shows last-known weather)
- [ ] Battery stays at 100% when charging
- [ ] Tablet doesn't overheat after 24 hours
- [ ] RAM mount withstands engine vibration
- [ ] Motion detection wakes tablet within 2 seconds

---

## Future Enhancements

**Voice Control (Alexa/Google Assistant Integration):**
- "Alexa, show bow camera" → Full-screen camera view
- "Alexa, what's the weather tomorrow?" → Speaks forecast
- "Alexa, when is next maintenance?" → Speaks countdown

**Face Recognition (Multi-User):**
- Owner approaches → Shows owner dashboard
- Captain approaches → Shows captain dashboard
- Crew approaches → Shows crew tasks

**Gestures:**
- Swipe up → Show full timeline
- Swipe left → Cycle through cameras
- Swipe right → Show weather details
- Pinch zoom → Enlarge camera feed

**Ambient Mode (Screensaver):**
- Rotate through camera snapshots (slideshow)
- Show tide chart (for tidal areas)
- Show sunrise/sunset times
