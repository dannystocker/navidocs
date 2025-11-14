# NaviDocs UI Strategy: Apple Ease-of-Use + Garmin Clarity + Weather Integration

**Created:** 2025-11-14
**Goal:** Unified design system across all 6 modules with weather integration

---

## Current Module Analysis

### 1. **Inventory Module** (Simple/Clean Design)
**Current Style:** Basic forms, category filters, modal overlays
**Strengths:** Simple, functional
**Weaknesses:** No visual hierarchy, plain table layouts, lacks glanceability

### 2. **Maintenance Module** (Most Polished)
**Current Style:** Glass morphism (`bg-white/5 backdrop-blur-lg`), gradient backgrounds (`from-slate-900 via-slate-800`), calendar view
**Strengths:** Modern aesthetics, dual view modes (calendar/list), visual feedback
**Weaknesses:** Still lacks Garmin-style clarity for critical information

### 3. **Camera Module** (Basic/Functional)
**Current Style:** Simple forms with RTSP inputs
**Strengths:** Clear input validation, escape key handling
**Weaknesses:** No thumbnail previews, lacks visual status indicators

### 4. **Contacts Module** (Dashboard-Style)
**Current Style:** Stats cards with color-coded types (Marina=blue, Mechanic=amber, Vendor=green), gradient backgrounds
**Strengths:** Dashboard overview, category breakdown, search functionality
**Weaknesses:** Cards could be more glanceable with larger typography

### 5. **Expense Module** (Most Complex)
**Current Style:** Glass effects, gradient headers (`from-blue-400 to-cyan-400`), multi-user approval workflow
**Strengths:** Sophisticated forms, OCR integration planned, approval states
**Weaknesses:** Complex UI could overwhelm users without progressive disclosure

### 6. **Weather Module** (NEW - To Be Built)
**Requirements:** Real-time weather data, marine-specific metrics, iframe integration from Windy/Windfinder

---

## Design Principles: Apple × Garmin Hybrid

### **Apple HIG Principles We'll Keep:**
1. **Clarity** - Text should be legible at all sizes, icons precise, adornments subtle
2. **Deference** - Content is king; UI helps people understand and interact with content
3. **Depth** - Visual layers and realistic motion convey hierarchy
4. **60×60px Touch Targets** (marine glove-friendly, larger than Apple's 44pt minimum)
5. **Bottom Tab Navigation** - Reachable with thumb while holding device
6. **SF Pro Font** (or system default) - Optimal readability

### **Garmin Clarity Features We'll Add:**
1. **High-Contrast Data Display** - Critical info readable in direct sunlight
2. **Large Typography for Key Metrics** - 32-48px for important numbers
3. **Color-Coded Status Indicators** - Green=OK, Amber=Warning, Red=Critical
4. **Minimalist Charts** - Clean lines, no unnecessary decoration
5. **Glanceable Dashboard** - See all critical info without scrolling
6. **Dark Mode by Default** - Better for night vision on water

---

## Unified Design System

### **Color Palette (Marine-Themed)**

```css
/* Primary Colors */
--navy-blue: #1E3A8A;        /* Headers, primary actions */
--ocean-teal: #0D9488;       /* Accent, success states */
--sky-blue: #0EA5E9;         /* Links, secondary actions */

/* Status Colors (Garmin-inspired) */
--status-ok: #10B981;        /* Green - systems normal */
--status-warning: #F59E0B;   /* Amber - attention needed */
--status-critical: #EF4444;  /* Red - urgent action */
--status-info: #3B82F6;      /* Blue - informational */

/* Neutral Colors (Dark Mode Base) */
--slate-950: #020617;        /* App background */
--slate-900: #0F172A;        /* Card backgrounds */
--slate-800: #1E293B;        /* Elevated surfaces */
--white-10: rgba(255,255,255,0.1);  /* Borders */
--white-60: rgba(255,255,255,0.6);  /* Secondary text */
--white-90: rgba(255,255,255,0.9);  /* Primary text */

/* Glass Effect */
--glass-bg: rgba(255,255,255,0.05);
--glass-border: rgba(255,255,255,0.1);
--glass-blur: blur(20px);
```

### **Typography Scale**

```css
/* Garmin-inspired large metrics */
--text-metric-lg: 48px;      /* Hero numbers (weather temp, total expenses) */
--text-metric-md: 32px;      /* Dashboard stats */
--text-metric-sm: 24px;      /* Card values */

/* Apple HIG text sizes */
--text-hero: 34px;           /* Page titles */
--text-title1: 28px;         /* Section headers */
--text-title2: 22px;         /* Card headers */
--text-title3: 20px;         /* List headers */
--text-body: 17px;           /* Body text (Apple's recommended base) */
--text-callout: 16px;        /* Supporting text */
--text-caption: 13px;        /* Labels, metadata */

/* Font families */
--font-display: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto;
--font-body: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto;
--font-mono: "SF Mono", Monaco, "Cascadia Code", Consolas, monospace;
```

### **Spacing System (8pt Grid)**

```css
--space-1: 4px;    /* Micro spacing */
--space-2: 8px;    /* Base unit */
--space-3: 12px;   /* Tight spacing */
--space-4: 16px;   /* Comfortable spacing */
--space-5: 20px;   /* Section spacing */
--space-6: 24px;   /* Large spacing */
--space-8: 32px;   /* XL spacing */
--space-12: 48px;  /* Hero spacing */
--space-16: 64px;  /* Page margins */
```

### **Component Library**

#### **Glass Card (Standard Module Container)**
```vue
<template>
  <div class="glass-card">
    <slot />
  </div>
</template>

<style scoped>
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: var(--space-6);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
</style>
```

#### **Metric Display (Garmin-Style Large Number)**
```vue
<template>
  <div class="metric-display" :class="statusClass">
    <p class="metric-label">{{ label }}</p>
    <p class="metric-value">{{ value }}</p>
    <p class="metric-unit">{{ unit }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  unit: String,
  status: { type: String, default: 'ok' } // ok | warning | critical | info
})

const statusClass = computed(() => `status-${props.status}`)
</script>

<style scoped>
.metric-display {
  text-align: center;
  padding: var(--space-4);
}

.metric-label {
  font-size: var(--text-caption);
  color: var(--white-60);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-1);
}

.metric-value {
  font-size: var(--text-metric-md);
  font-weight: 700;
  line-height: 1;
  margin-bottom: var(--space-1);
}

.metric-unit {
  font-size: var(--text-callout);
  color: var(--white-60);
}

/* Status-based colors */
.status-ok .metric-value { color: var(--status-ok); }
.status-warning .metric-value { color: var(--status-warning); }
.status-critical .metric-value { color: var(--status-critical); }
.status-info .metric-value { color: var(--status-info); }
</style>
```

#### **Bottom Tab Navigation (Apple HIG)**
```vue
<template>
  <nav class="bottom-tabs">
    <router-link to="/" class="tab-item">
      <HomeIcon class="tab-icon" />
      <span class="tab-label">Dashboard</span>
    </router-link>
    <router-link to="/inventory" class="tab-item">
      <ArchiveIcon class="tab-icon" />
      <span class="tab-label">Inventory</span>
    </router-link>
    <router-link to="/maintenance" class="tab-item">
      <WrenchIcon class="tab-icon" />
      <span class="tab-label">Maintenance</span>
    </router-link>
    <router-link to="/weather" class="tab-item">
      <CloudIcon class="tab-icon" />
      <span class="tab-label">Weather</span>
    </router-link>
    <router-link to="/cameras" class="tab-item">
      <CameraIcon class="tab-icon" />
      <span class="tab-label">Cameras</span>
    </router-link>
    <router-link to="/more" class="tab-item">
      <MenuIcon class="tab-icon" />
      <span class="tab-label">More</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-tabs {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: rgba(15, 23, 42, 0.95); /* slate-900 with transparency */
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--white-10);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  z-index: 50;

  /* iOS-style safe area padding */
  padding-bottom: max(var(--space-2), env(safe-area-inset-bottom));
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  min-width: 60px;
  min-height: 60px;
  border-radius: 12px;
  transition: all 0.2s ease;
  text-decoration: none;
  color: var(--white-60);
}

.tab-item:active {
  transform: scale(0.95);
}

.tab-item.router-link-active {
  color: var(--sky-blue);
  background: rgba(14, 165, 233, 0.1);
}

.tab-icon {
  width: 28px;
  height: 28px;
}

.tab-label {
  font-size: 11px;
  font-weight: 500;
}
</style>
```

---

## Module Redesign Specifications

### **1. Dashboard (NEW - Home Screen)**

**Layout:** 3×2 grid of glanceable metrics + quick actions

```vue
<template>
  <div class="dashboard-page">
    <!-- Hero Weather Widget (Top) -->
    <div class="hero-weather glass-card">
      <div class="current-conditions">
        <MetricDisplay
          label="Current Temp"
          :value="weather.temp"
          unit="°C"
          :status="weather.tempStatus"
        />
        <MetricDisplay
          label="Wind Speed"
          :value="weather.windSpeed"
          unit="kts"
          :status="weather.windStatus"
        />
        <MetricDisplay
          label="Wave Height"
          :value="weather.waveHeight"
          unit="m"
          :status="weather.waveStatus"
        />
      </div>
      <button @click="openWeatherModule" class="btn-link">
        View Detailed Forecast →
      </button>
    </div>

    <!-- Quick Stats Grid -->
    <div class="stats-grid">
      <GlassCard class="stat-card" @click="$router.push('/inventory')">
        <p class="stat-label">Total Inventory Value</p>
        <p class="stat-value">€127,450</p>
        <p class="stat-change text-status-ok">↑ €2,300 this year</p>
      </GlassCard>

      <GlassCard class="stat-card" @click="$router.push('/maintenance')">
        <p class="stat-label">Upcoming Maintenance</p>
        <p class="stat-value text-status-warning">3</p>
        <p class="stat-change">Next: Oil change (5 days)</p>
      </GlassCard>

      <GlassCard class="stat-card" @click="$router.push('/expenses')">
        <p class="stat-label">Monthly Expenses</p>
        <p class="stat-value">€4,872</p>
        <p class="stat-change text-status-critical">↑ 12% vs last month</p>
      </GlassCard>

      <GlassCard class="stat-card" @click="$router.push('/cameras')">
        <p class="stat-label">Camera Status</p>
        <p class="stat-value text-status-ok">4 Active</p>
        <p class="stat-change">Last motion: 12 min ago</p>
      </GlassCard>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <button class="action-btn action-primary">
        <PlusIcon /> Add Expense
      </button>
      <button class="action-btn action-secondary">
        <CalendarIcon /> Schedule Service
      </button>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  padding: var(--space-6);
  padding-bottom: 100px; /* Space for bottom tabs */
  max-width: 1200px;
  margin: 0 auto;
}

.hero-weather {
  margin-bottom: var(--space-6);
}

.current-conditions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-label {
  font-size: var(--text-caption);
  color: var(--white-60);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--space-2);
}

.stat-value {
  font-size: var(--text-metric-md);
  font-weight: 700;
  color: var(--white-90);
  margin-bottom: var(--space-1);
}

.stat-change {
  font-size: var(--text-callout);
  color: var(--white-60);
}

.quick-actions {
  display: flex;
  gap: var(--space-3);
}

.action-btn {
  flex: 1;
  height: 60px;
  border-radius: 12px;
  font-size: var(--text-callout);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  transition: all 0.2s ease;
}

.action-primary {
  background: linear-gradient(135deg, var(--sky-blue), var(--ocean-teal));
  color: white;
}

.action-secondary {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--white-90);
}
</style>
```

### **2. Inventory Module Redesign**

**Changes:**
- Replace table with card grid (better for touch)
- Add depreciation chart per item
- Large item photos with zoom

```vue
<template>
  <div class="inventory-module">
    <div class="module-header">
      <h1 class="module-title">Inventory</h1>
      <button class="btn-primary" @click="showAddForm = true">
        <PlusIcon /> Add Equipment
      </button>
    </div>

    <!-- Total Value Metric -->
    <GlassCard class="value-summary">
      <MetricDisplay
        label="Total Inventory Value"
        :value="totalValue.toLocaleString()"
        unit="€"
        status="info"
      />
      <MetricDisplay
        label="Depreciation This Year"
        :value="yearlyDepreciation.toLocaleString()"
        unit="€"
        status="warning"
      />
    </GlassCard>

    <!-- Category Filter -->
    <div class="filter-bar">
      <button
        v-for="cat in categories"
        :key="cat"
        @click="filterCategory = cat"
        :class="['filter-chip', { active: filterCategory === cat }]"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Item Grid (Card-Based) -->
    <div class="item-grid">
      <GlassCard
        v-for="item in filteredItems"
        :key="item.id"
        class="item-card"
        @click="selectItem(item)"
      >
        <img
          v-if="item.photo_urls[0]"
          :src="item.photo_urls[0]"
          class="item-photo"
          alt=""
        />
        <div class="item-info">
          <h3 class="item-name">{{ item.name }}</h3>
          <p class="item-category">{{ item.category }}</p>
          <div class="item-values">
            <div>
              <p class="value-label">Purchase</p>
              <p class="value-amount">€{{ item.purchase_price }}</p>
            </div>
            <div>
              <p class="value-label">Current</p>
              <p class="value-amount text-status-ok">€{{ item.current_value }}</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  </div>
</template>

<style scoped>
.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.item-card {
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.item-card:active {
  transform: scale(0.98);
}

.item-photo {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 12px 12px 0 0;
  margin: calc(var(--space-6) * -1) calc(var(--space-6) * -1) var(--space-4);
}

.item-name {
  font-size: var(--text-title3);
  color: var(--white-90);
  margin-bottom: var(--space-1);
}

.item-category {
  font-size: var(--text-caption);
  color: var(--white-60);
  text-transform: uppercase;
  margin-bottom: var(--space-3);
}

.item-values {
  display: flex;
  justify-content: space-between;
  padding-top: var(--space-3);
  border-top: 1px solid var(--white-10);
}

.value-label {
  font-size: var(--text-caption);
  color: var(--white-60);
}

.value-amount {
  font-size: var(--text-title3);
  font-weight: 600;
  color: var(--white-90);
}
</style>
```

### **3. Maintenance Module** (Keep Current Glass Style, Add Garmin Clarity)

**Changes:**
- Add large countdown timers for upcoming services
- Color-code urgency (Green=30+ days, Amber=7-30 days, Red=<7 days)
- Show service history chart

```vue
<!-- Add to existing maintenance module -->
<div class="urgency-dashboard">
  <GlassCard
    v-for="service in upcomingServices"
    :key="service.id"
    :class="['service-card', `urgency-${service.urgency}`]"
  >
    <div class="countdown">
      <p class="countdown-value">{{ service.daysUntil }}</p>
      <p class="countdown-label">days</p>
    </div>
    <div class="service-info">
      <h3>{{ service.service_type }}</h3>
      <p>{{ service.boat_name }}</p>
    </div>
  </GlassCard>
</div>

<style scoped>
.service-card.urgency-ok { border-left: 4px solid var(--status-ok); }
.service-card.urgency-warning { border-left: 4px solid var(--status-warning); }
.service-card.urgency-critical { border-left: 4px solid var(--status-critical); }

.countdown-value {
  font-size: var(--text-metric-lg);
  font-weight: 700;
  line-height: 1;
}
</style>
```

### **4. Camera Module** (Add Live Thumbnails + Garmin-Style Status Indicators)

**Changes:**
- Grid of camera thumbnails (not just list)
- Large status dots (Green=Online, Red=Offline)
- Tap to full-screen video

```vue
<template>
  <div class="camera-module">
    <div class="camera-grid">
      <GlassCard
        v-for="camera in cameras"
        :key="camera.id"
        class="camera-card"
        @click="openFullScreen(camera)"
      >
        <!-- Live Thumbnail -->
        <div class="camera-preview">
          <img
            v-if="camera.thumbnail"
            :src="camera.thumbnail"
            alt=""
            class="preview-image"
          />
          <div v-else class="preview-placeholder">
            <CameraIcon class="placeholder-icon" />
          </div>

          <!-- Status Indicator (Garmin-style) -->
          <div :class="['status-indicator', camera.online ? 'online' : 'offline']">
            <div class="status-dot"></div>
            <span class="status-text">{{ camera.online ? 'LIVE' : 'OFFLINE' }}</span>
          </div>
        </div>

        <div class="camera-info">
          <h3 class="camera-name">{{ camera.name }}</h3>
          <p class="camera-location">{{ camera.location }}</p>
        </div>
      </GlassCard>
    </div>
  </div>
</template>

<style scoped>
.camera-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-4);
}

.camera-preview {
  position: relative;
  width: 100%;
  height: 240px;
  background: var(--slate-900);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: var(--space-3);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-indicator {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: rgba(0,0,0,0.8);
  border-radius: 20px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-indicator.online .status-dot {
  background: var(--status-ok);
  box-shadow: 0 0 12px var(--status-ok);
  animation: pulse 2s infinite;
}

.status-indicator.offline .status-dot {
  background: var(--status-critical);
}

.status-text {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: white;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
```

### **5. Contacts Module** (Keep Current Design, Add Garmin Touch Targets)

**Changes:**
- Increase tap targets to 60×60px
- Add one-tap call/email/WhatsApp buttons
- Show distance to marina/vendor (if geolocation available)

### **6. Expense Module** (Simplify with Progressive Disclosure)

**Changes:**
- Hide complex multi-user approval UI behind "Advanced" toggle
- Show simple expense list by default
- Add chart showing expense breakdown by category

---

## Weather Module (NEW)

### **Primary Goal:** Marine-specific weather data with Garmin clarity

### **Data Sources:**

1. **Windy.com Embed** (Wind/Wave/Temperature layers)
2. **Windfinder.com Embed** (Wind forecast specific to location)
3. **Open-Meteo Marine API** (Free, no API key needed)

### **Implementation Strategy:**

#### **Option A: Iframe Embed (Simplest)**

```vue
<template>
  <div class="weather-module">
    <!-- Quick Stats (Garmin-style glanceable) -->
    <div class="weather-stats">
      <MetricDisplay
        label="Temperature"
        :value="currentWeather.temp"
        unit="°C"
        :status="tempStatus"
      />
      <MetricDisplay
        label="Wind Speed"
        :value="currentWeather.windSpeed"
        unit="kts"
        :status="windStatus"
      />
      <MetricDisplay
        label="Wave Height"
        :value="currentWeather.waveHeight"
        unit="m"
        :status="waveStatus"
      />
      <MetricDisplay
        label="Visibility"
        :value="currentWeather.visibility"
        unit="nm"
        status="info"
      />
    </div>

    <!-- Tabbed Interface -->
    <div class="weather-tabs">
      <button
        @click="activeTab = 'wind'"
        :class="{ active: activeTab === 'wind' }"
      >
        Wind Forecast
      </button>
      <button
        @click="activeTab = 'waves'"
        :class="{ active: activeTab === 'waves' }"
      >
        Wave Forecast
      </button>
      <button
        @click="activeTab = 'radar'"
        :class="{ active: activeTab === 'radar' }"
      >
        Radar
      </button>
    </div>

    <!-- Iframe Embeds -->
    <div class="weather-iframe-container">
      <iframe
        v-show="activeTab === 'wind'"
        :src="windyUrl"
        class="weather-iframe"
        frameborder="0"
        loading="lazy"
      ></iframe>

      <iframe
        v-show="activeTab === 'waves'"
        :src="windfinderUrl"
        class="weather-iframe"
        frameborder="0"
        loading="lazy"
      ></iframe>
    </div>

    <!-- 5-Day Forecast (Custom UI) -->
    <div class="forecast-strip">
      <div v-for="day in forecast" :key="day.date" class="forecast-day">
        <p class="day-name">{{ day.dayName }}</p>
        <WeatherIcon :condition="day.condition" />
        <p class="temp-high">{{ day.tempHigh }}°</p>
        <p class="temp-low">{{ day.tempLow }}°</p>
        <p class="wind-info">{{ day.windSpeed }} kts {{ day.windDirection }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const activeTab = ref('wind')

// User's boat location (from settings or GPS)
const boatLocation = ref({ lat: 43.5528, lon: 7.0174 }) // Monaco example

// Windy embed URL (customizable zoom, layers)
const windyUrl = computed(() => {
  const { lat, lon } = boatLocation.value
  return `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=100%&height=100%&zoom=8&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=kt&metricTemp=%C2%B0C&radarRange=-1`
})

// Windfinder embed URL
const windfinderUrl = computed(() => {
  const { lat, lon } = boatLocation.value
  return `https://www.windfinder.com/widget/forecast/embed.htm?spot=${getWindfinderSpotId(lat, lon)}&unit_wave=m&unit_rain=mm&unit_temperature=c&unit_wind=kts&days=5&show_day=1`
})

// Fetch current conditions from Open-Meteo Marine API
const currentWeather = ref({
  temp: null,
  windSpeed: null,
  windDirection: null,
  waveHeight: null,
  visibility: null
})

const forecast = ref([])

onMounted(async () => {
  await fetchMarineWeather()
})

async function fetchMarineWeather() {
  const { lat, lon } = boatLocation.value

  // Open-Meteo Marine API (free, no auth required)
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period,wind_wave_height&hourly=wave_height,wind_wave_height,wind_wave_direction&daily=wave_height_max,wind_speed_max&timezone=auto`

  const response = await fetch(url)
  const data = await response.json()

  currentWeather.value = {
    waveHeight: data.current.wave_height?.toFixed(1),
    windSpeed: (data.daily.wind_speed_max[0] * 0.539957).toFixed(0), // m/s to knots
    // ... parse other fields
  }

  // For temperature/visibility, use standard weather API
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`

  const weatherResponse = await fetch(weatherUrl)
  const weatherData = await weatherResponse.json()

  currentWeather.value.temp = weatherData.current.temperature_2m?.toFixed(0)

  // Build 5-day forecast
  forecast.value = weatherData.daily.time.slice(0, 5).map((date, i) => ({
    date,
    dayName: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
    tempHigh: weatherData.daily.temperature_2m_max[i].toFixed(0),
    tempLow: weatherData.daily.temperature_2m_min[i].toFixed(0),
    windSpeed: (weatherData.daily.wind_speed_10m_max[i] * 0.539957).toFixed(0),
    condition: 'partly-cloudy' // Would need to interpret from data
  }))
}

// Status color logic (Garmin-style)
const tempStatus = computed(() => {
  const temp = parseFloat(currentWeather.value.temp)
  if (temp < 10) return 'warning'
  if (temp > 30) return 'warning'
  return 'ok'
})

const windStatus = computed(() => {
  const wind = parseFloat(currentWeather.value.windSpeed)
  if (wind > 25) return 'critical' // Gale force
  if (wind > 16) return 'warning'  // Strong breeze
  return 'ok'
})

const waveStatus = computed(() => {
  const waves = parseFloat(currentWeather.value.waveHeight)
  if (waves > 3) return 'critical'
  if (waves > 1.5) return 'warning'
  return 'ok'
})

function getWindfinderSpotId(lat, lon) {
  // Would need to geocode to nearest Windfinder spot
  // For now, return Monaco spot ID as example
  return '158029' // Monaco spot
}
</script>

<style scoped>
.weather-module {
  padding: var(--space-6);
  padding-bottom: 100px;
}

.weather-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.weather-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--white-10);
}

.weather-tabs button {
  flex: 1;
  height: 48px;
  background: none;
  border: none;
  color: var(--white-60);
  font-size: var(--text-callout);
  font-weight: 600;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
}

.weather-tabs button.active {
  color: var(--sky-blue);
}

.weather-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--sky-blue);
}

.weather-iframe-container {
  position: relative;
  width: 100%;
  height: 500px;
  background: var(--slate-900);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: var(--space-6);
}

.weather-iframe {
  width: 100%;
  height: 100%;
}

.forecast-strip {
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
  padding: var(--space-4);
  background: var(--glass-bg);
  border-radius: 16px;
  border: 1px solid var(--glass-border);
}

.forecast-day {
  flex: 0 0 120px;
  text-align: center;
  padding: var(--space-3);
  background: var(--slate-900);
  border-radius: 12px;
}

.day-name {
  font-size: var(--text-callout);
  font-weight: 600;
  color: var(--white-90);
  margin-bottom: var(--space-2);
}

.temp-high {
  font-size: var(--text-title3);
  font-weight: 700;
  color: var(--white-90);
}

.temp-low {
  font-size: var(--text-callout);
  color: var(--white-60);
  margin-bottom: var(--space-2);
}

.wind-info {
  font-size: var(--text-caption);
  color: var(--ocean-teal);
  font-weight: 600;
}
</style>
```

#### **Option B: Scraping/API Integration (More Complex)**

If iframe restrictions are an issue, we can:

1. **Use Open-Meteo Marine API** (free, returns JSON)
2. **Use Windy API** (requires API key, $199/year for commercial)
3. **Scrape Windfinder** (not recommended, violates TOS)

**Recommended:** Use iframe embeds (Option A) for map visualizations, fetch Open-Meteo API for numerical data to display in Garmin-style metrics.

### **Marine-Specific Weather Alerts**

```vue
<template>
  <div v-if="hasAlerts" class="weather-alerts">
    <GlassCard
      v-for="alert in alerts"
      :key="alert.id"
      :class="['alert-card', `alert-${alert.severity}`]"
    >
      <div class="alert-icon">
        <AlertTriangleIcon v-if="alert.severity === 'critical'" />
        <AlertCircleIcon v-else />
      </div>
      <div class="alert-content">
        <h3 class="alert-title">{{ alert.title }}</h3>
        <p class="alert-description">{{ alert.description }}</p>
        <p class="alert-time">Effective: {{ alert.effective }} - {{ alert.expires }}</p>
      </div>
    </GlassCard>
  </div>
</template>

<style scoped>
.alert-card.alert-critical {
  border-left: 4px solid var(--status-critical);
  background: rgba(239, 68, 68, 0.1);
}

.alert-card.alert-warning {
  border-left: 4px solid var(--status-warning);
  background: rgba(245, 158, 11, 0.1);
}
</style>
```

---

## Implementation Roadmap

### **Phase 1: Core Design System (1 week)**
- [ ] Create CSS custom properties file (`design-tokens.css`)
- [ ] Build component library:
  - [ ] GlassCard.vue
  - [ ] MetricDisplay.vue
  - [ ] BottomTabNavigation.vue
  - [ ] StatusIndicator.vue
- [ ] Test dark mode on actual device in sunlight

### **Phase 2: Module Redesigns (2 weeks)**
- [ ] Dashboard (new home screen)
- [ ] Inventory (card grid)
- [ ] Maintenance (urgency indicators)
- [ ] Camera (live thumbnails)
- [ ] Contacts (60px touch targets)
- [ ] Expense (progressive disclosure)

### **Phase 3: Weather Module (1 week)**
- [ ] Integrate Open-Meteo Marine API
- [ ] Embed Windy iframe
- [ ] Embed Windfinder iframe
- [ ] Build 5-day forecast strip
- [ ] Add weather alerts

### **Phase 4: Polish & Testing (1 week)**
- [ ] Test on iPad in bright sunlight (verify Garmin clarity)
- [ ] Test with sailing gloves (verify 60px touch targets)
- [ ] Performance audit (target: 60fps scrolling)
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## Budget Estimate

| Phase | Description | Time | Cost |
|-------|-------------|------|------|
| Phase 1 | Design system + components | 40 hours | €3,200 |
| Phase 2 | Module redesigns | 80 hours | €6,400 |
| Phase 3 | Weather module | 40 hours | €3,200 |
| Phase 4 | Polish + testing | 40 hours | €3,200 |
| **Total** | | **200 hours** | **€16,000** |

*Assumes €80/hour senior frontend developer rate*

---

## Key Decisions Summary

1. **Design System:** Apple HIG + Garmin clarity hybrid
2. **Navigation:** Bottom tab bar (6 tabs max, iOS-style)
3. **Color Palette:** Dark mode by default, marine blue/teal accent
4. **Touch Targets:** 60×60px minimum (glove-friendly)
5. **Typography:** Large metrics (32-48px) for critical data
6. **Weather Data:** Open-Meteo Marine API (free) + Windy/Windfinder iframes
7. **Dashboard:** Glanceable 3×2 grid of key metrics
8. **Status Indicators:** Color-coded (Green/Amber/Red) Garmin-style dots

---

**Next Steps:** Review this strategy document, approve design direction, then launch Phase 1 agents to build component library.
