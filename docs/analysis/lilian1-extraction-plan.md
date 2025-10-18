# lilian1 (FRANK-AI) Code Extraction Plan

**Date:** 2025-10-19
**Purpose:** Extract clean, production-ready code from lilian1 prototype; discard experimental Frank-AI features
**Target:** NaviDocs MVP with Meilisearch-inspired design

---

## Executive Summary

lilian1 is a working boat manual assistant prototype called "FRANK-AI" with:
- **Total size:** 2794 lines of JavaScript (7 files)
- **Clean code:** ~940 lines worth extracting
- **Frank-AI junk:** ~1850 lines to discard
- **Documentation:** 56+ experimental markdown files to discard

### Key Decision: What to Extract vs Discard

| Category | Extract | Discard | Reason |
|----------|---------|---------|--------|
| Manual management | ✅ | | Core upload/job polling logic is solid |
| Figure zoom | ✅ | | Excellent UX, accessibility-first, production-ready |
| Service worker | ✅ | | PWA pattern is valuable for offline boat manuals |
| Quiz system | | ❌ | Gamification - not in NaviDocs MVP scope |
| Persona system | | ❌ | AI personality - not needed |
| Gamification | | ❌ | Points/achievements - not in MVP scope |
| Debug overlay | | ❌ | Development tool - replace with proper logging |

---

## Files to Extract

### 1. app/js/manuals.js (451 lines)

**What it does:**
- Upload PDF to backend
- Poll job status with progress tracking
- Catalog loading (manuals list)
- Modal controls for upload UI
- Toast notifications

**Clean patterns to port to Vue:**
```javascript
// Job polling pattern (lines 288-322)
async function startPolling(jobId) {
  pollInterval = setInterval(async () => {
    const response = await fetch(`${apiBase}/api/manuals/jobs/${jobId}`);
    const data = await response.json();
    updateJobStatus(data);
    if (data.status === 'completed' || data.status === 'failed') {
      clearInterval(pollInterval);
    }
  }, 2000);
}
```

**Port to NaviDocs as:**
- `client/src/components/UploadModal.vue` - Upload UI
- `client/src/composables/useJobPolling.js` - Polling logic
- `client/src/composables/useManualsCatalog.js` - Catalog state

**Discard:**
- Line 184: `ingestFromUrl()` - Claude CLI integration (not in MVP)
- Line 134: `findManuals()` - Claude search (replace with Meilisearch)

---

### 2. app/js/figure-zoom.js (299 lines)

**What it does:**
- Pan/zoom for PDF page images
- Mouse wheel, drag, touch pinch controls
- Keyboard shortcuts (+, -, 0)
- Accessibility (aria-labels, prefers-reduced-motion)
- Premium UX (spring easing)

**This is EXCELLENT code - port as-is to Vue:**
- `client/src/components/FigureZoom.vue` - Wrap in Vue component
- Keep all logic: updateTransform, bindMouseEvents, bindTouchEvents
- Keep accessibility features

**Why it's good:**
- Respects `prefers-reduced-motion`
- Proper event cleanup
- Touch support for mobile
- Smooth animations with cubic-bezier easing

---

### 3. app/service-worker.js (192 lines)

**What it does:**
- PWA offline caching
- Precache critical files (index.html, CSS, JS, data files)
- Cache-first strategy for data, network-first for HTML
- Background sync hooks (future)
- Push notification hooks (future)

**Port to NaviDocs as:**
- `client/public/service-worker.js` - Adapt for Vue/Vite build
- Update PRECACHE_URLS to match Vite build output
- Keep cache-first strategy for manuals (important for boats with poor connectivity)

**Changes needed:**
```javascript
// OLD: FRANK-AI hardcoded paths
const PRECACHE_URLS = ['/index.html', '/css/app.css', ...];

// NEW: Vite build output (generated from manifest)
const PRECACHE_URLS = [
  '/',
  '/assets/index-[hash].js',
  '/assets/index-[hash].css',
  '/data/manuals.json'
];
```

---

### 4. data/glossary.json (184 lines)

**What it is:**
- Boat manual terminology index
- Maps terms to page numbers
- Examples: "Bilge", "Blackwater", "Windlass", "Galley", "Seacock"

**How to use:**
- Extract unique terms
- Add to Meilisearch synonyms config (we already have 40+, this adds more)
- Use for autocomplete suggestions in search bar

**Example extraction:**
```javascript
// Terms we don't have yet in meilisearch-config.json:
"seacock": ["through-hull", "thru-hull"],  // ✅ Already have
"demister": ["defroster", "windscreen demister"],  // ➕ Add
"reboarding": ["ladder", "swim platform"],  // ➕ Add
"mooring": ["docking", "tie-up"],  // ➕ Add
```

---

## Files to Discard

### Gamification / AI Persona (Frank-AI Experiments)

| File | Lines | Reason to Discard |
|------|-------|-------------------|
| app/js/quiz.js | 209 | Quiz game - not in MVP scope |
| app/js/persona.js | 209 | AI personality system - not needed |
| app/js/gamification.js | 304 | Points/badges/achievements - not in MVP |
| app/js/debug-overlay.js | ~100 | Dev tool - replace with proper logging |

**Total discarded:** ~820 lines

---

### Documentation Files (56+ files to discard)

All files starting with:
- `CLAUDE_SUPERPROMPT_*.md` (8 files) - AI experiment prompts
- `FRANK_AI_*.md` (3 files) - Frank-AI specific docs
- `FIGURE_*.md` (6 files) - Figure implementation docs (interesting but not needed)
- `TEST_*.md` (8 files) - Test reports (good to read, but don't copy)
- `*_REPORT.md` (12 files) - Sprint reports
- `*_SUMMARY.md` (10 files) - Session summaries
- `SECURITY-*.md` (3 files) - Security audits (good insights, already captured in hardened-production-guide.md)
- `UX-*.md` (3 files) - UX reviews

**Keep for reference (read but don't copy):**
- `README.md` - Understand the project
- `CHANGES.md` - What was changed over time
- `DEMO_ACCESS.txt` - How to run lilian1

**Total:** ~1200 lines of markdown to discard

---

## Migration Strategy

### Phase 1: Bootstrap NaviDocs Structure

```bash
cd ~/navidocs

# Create directories
mkdir -p server/{routes,services,workers,db,config}
mkdir -p client/{src/{components,composables,views,stores,assets},public}

# Initialize package.json files
```

**server/package.json:**
```json
{
  "name": "navidocs-server",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^5.0.0",
    "better-sqlite3": "^11.0.0",
    "meilisearch": "^0.41.0",
    "bullmq": "^5.0.0",
    "helmet": "^7.0.0",
    "express-rate-limit": "^7.0.0",
    "tesseract.js": "^5.0.0",
    "uuid": "^10.0.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0"
  }
}
```

**client/package.json:**
```json
{
  "name": "navidocs-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.0",
    "vue-router": "^4.4.0",
    "pinia": "^2.2.0",
    "pdfjs-dist": "^4.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

### Phase 2: Port Clean Code

#### Step 1: Figure Zoom Component

**From:** lilian1/app/js/figure-zoom.js
**To:** navidocs/client/src/components/FigureZoom.vue

**Changes:**
- Wrap in Vue component
- Use Vue refs for state (`scale`, `translateX`, `translateY`)
- Use Vue lifecycle hooks (`onMounted`, `onUnmounted`)
- Keep all UX logic identical

**Implementation:**
```vue
<template>
  <div class="figure-lightbox" v-if="isOpen">
    <img
      ref="imageRef"
      :src="imageSrc"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
    />
    <div class="zoom-controls">
      <button @click="zoomIn">+</button>
      <button @click="zoomOut">−</button>
      <button @click="reset">⟲</button>
      <span>{{ Math.round(scale * 100) }}%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const imageRef = ref(null);
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);

// Copy all logic from figure-zoom.js
// ...
</script>
```

#### Step 2: Upload Modal Component

**From:** lilian1/app/js/manuals.js (lines 228-263)
**To:** navidocs/client/src/components/UploadModal.vue

**Changes:**
- Replace vanilla DOM manipulation with Vue reactivity
- Use `<script setup>` syntax
- Replace FormData upload with Meilisearch-safe approach

#### Step 3: Job Polling Composable

**From:** lilian1/app/js/manuals.js (lines 288-322)
**To:** navidocs/client/src/composables/useJobPolling.js

**Pattern:**
```javascript
import { ref, onUnmounted } from 'vue';

export function useJobPolling(apiBase) {
  const jobId = ref(null);
  const progress = ref(0);
  const status = ref('pending');
  let pollInterval = null;

  async function startPolling(id) {
    jobId.value = id;

    pollInterval = setInterval(async () => {
      const response = await fetch(`${apiBase}/api/jobs/${id}`);
      const data = await response.json();

      progress.value = data.progress;
      status.value = data.status;

      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(pollInterval);
      }
    }, 2000);
  }

  onUnmounted(() => {
    if (pollInterval) clearInterval(pollInterval);
  });

  return { jobId, progress, status, startPolling };
}
```

#### Step 4: Service Worker

**From:** lilian1/app/service-worker.js
**To:** navidocs/client/public/service-worker.js

**Changes:**
- Update CACHE_NAME to `navidocs-v1`
- Update PRECACHE_URLS to match Vite build output
- Keep cache strategy identical (cache-first for data, network-first for HTML)

---

### Phase 3: Backend API Structure

**New files (not in lilian1):**

```
server/
├── index.js              # Express app entry point
├── config/
│   └── db.js             # SQLite connection
│   └── meilisearch.js    # Meilisearch client
├── routes/
│   └── upload.js         # POST /api/upload
│   └── jobs.js           # GET /api/jobs/:id
│   └── search.js         # POST /api/search (with tenant tokens)
│   └── documents.js      # GET /api/documents/:id
├── services/
│   └── file-safety.js    # 4-layer validation pipeline
│   └── ocr.js            # Tesseract.js wrapper
│   └── search.js         # Meilisearch service
├── workers/
│   └── ocr-worker.js     # BullMQ worker for OCR jobs
└── db/
    └── schema.sql        # (Already created in docs/architecture/)
    └── migrations/       # Future schema changes
```

**Lilian1 had:** `api/server.js` (custom search logic)
**NaviDocs will use:** Meilisearch (< 10ms vs ~100ms, typo tolerance, synonyms)

---

### Phase 4: Frontend Structure

**New Vue 3 app (not in lilian1):**

```
client/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router.js
│   ├── components/
│   │   ├── UploadModal.vue      # ← From manuals.js
│   │   ├── FigureZoom.vue       # ← From figure-zoom.js
│   │   ├── SearchBar.vue        # ← New
│   │   ├── DocumentViewer.vue   # ← New (PDF.js)
│   │   └── JobProgress.vue      # ← From manuals.js
│   ├── composables/
│   │   ├── useJobPolling.js     # ← From manuals.js
│   │   ├── useManualsCatalog.js # ← From manuals.js
│   │   └── useSearch.js         # ← New (Meilisearch)
│   ├── views/
│   │   ├── HomeView.vue
│   │   ├── SearchView.vue
│   │   └── DocumentView.vue
│   ├── stores/
│   │   └── manuals.js           # Pinia store
│   └── assets/
│       └── icons/               # Clean SVG icons (Meilisearch-inspired)
└── public/
    └── service-worker.js         # ← From lilian1
```

---

## Design System: Meilisearch-Inspired

**User directive:** "use as much of the https://www.meilisearch.com/ look and feel as possible, grab it all, no emojis, clean svg sybold for an expensive grown up look and feel"

### Visual Analysis of Meilisearch.com

**Colors:**
- Primary: `#FF5CAA` (Pink)
- Secondary: `#6C5CE7` (Purple)
- Accent: `#00D4FF` (Cyan)
- Neutral: `#1E1E2F` (Dark), `#F5F5FA` (Light)

**Typography:**
- Headings: Bold, sans-serif (likely Inter or similar)
- Body: Medium weight, generous line-height
- Code: Monospace (Fira Code or similar)

**Icons:**
- Clean SVG line icons
- 24px base size
- 2px stroke weight
- Rounded corners (not sharp)

**Components:**
- Generous padding (24px, 32px)
- Subtle shadows: `box-shadow: 0 4px 24px rgba(0,0,0,0.08)`
- Rounded corners: `border-radius: 12px`
- Search bar: Large (56px height), prominent, centered

**NaviDocs adaptation:**
```css
/* Tailwind config */
{
  colors: {
    primary: '#0EA5E9',      // Sky blue (boat theme)
    secondary: '#6366F1',    // Indigo
    accent: '#10B981',       // Green (success)
    dark: '#1E293B',
    light: '#F8FAFC'
  },
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace']
  },
  borderRadius: {
    DEFAULT: '12px',
    lg: '16px'
  }
}
```

### Icon System

**NO emojis** - Use clean SVG icons from:
- Heroicons (MIT license) - https://heroicons.com/
- Lucide (ISC license) - https://lucide.dev/

**Icons needed:**
- Upload (cloud-arrow-up)
- Search (magnifying-glass)
- Document (document-text)
- Boat (custom or use sailboat icon)
- Settings (cog)
- User (user-circle)
- Close (x-mark)
- Zoom in/out (magnifying-glass-plus/minus)

---

## Data Structure Insights

### lilian1 data/pages.json structure:

```json
{
  "manual": "boat",
  "slug": "boat",
  "vendor": "Prestige",
  "model": "F4.9",
  "pages": [
    {
      "p": 1,
      "headings": ["Owner Manual", "Technical Information"],
      "text": "Full OCR text here...",
      "figures": ["f1-p42-electrical-overview"]
    }
  ]
}
```

### NaviDocs Meilisearch document structure:

```json
{
  "id": "page_doc_abc123_p7",
  "vertical": "boating",

  "organizationId": "org_xyz789",
  "entityId": "boat_prestige_f49_001",
  "entityName": "Sea Breeze",

  "docId": "doc_abc123",
  "userId": "user_456",

  "documentType": "owner-manual",
  "title": "Owner Manual - Page 7",
  "pageNumber": 7,
  "text": "Full OCR text here...",

  "boatMake": "Prestige",
  "boatModel": "F4.9",
  "boatYear": 2024,

  "language": "en",
  "ocrConfidence": 0.94,

  "createdAt": 1740234567,
  "updatedAt": 1740234567
}
```

**Key difference:** NaviDocs uses **per-page documents** in Meilisearch (same as lilian1), but with richer metadata for multi-vertical support.

---

## Testing Strategy

### lilian1 had:
- Playwright E2E tests (tests/e2e/app.spec.js)
- Multi-manual ingestion tests
- Engagement pack tests

### NaviDocs will have:

**Playwright tests:**
```
tests/
├── upload.spec.js        # Upload PDF → job completes → searchable
├── search.spec.js        # Search with synonyms
├── document.spec.js      # View PDF, zoom figures
└── offline.spec.js       # PWA offline mode
```

**Test cases:**
1. Upload PDF → OCR completes in < 5min → search finds text
2. Search "bilge" → finds "sump pump" (synonym test)
3. Search "electrical" → highlights matches in results
4. Open document → zoom in/out → pan around
5. Go offline → app still loads → cached manuals work

---

## Success Criteria

**Before declaring NaviDocs MVP ready:**

- [ ] All clean code extracted from lilian1
- [ ] No Frank-AI junk (quiz, persona, gamification) in codebase
- [ ] Meilisearch-inspired design applied (no emojis, clean SVG icons)
- [ ] Upload PDF → OCR → searchable in < 5min
- [ ] Search latency < 100ms
- [ ] Synonym search works ("bilge" finds "sump pump")
- [ ] Figure zoom component works (pan, zoom, keyboard shortcuts)
- [ ] PWA offline mode caches manuals
- [ ] Playwright tests pass (4+ E2E scenarios)
- [ ] All fields display correctly in UI
- [ ] No console errors in production build
- [ ] Proof of working system (screenshots, demo video)

---

## Timeline Estimate

| Phase | Tasks | Time |
|-------|-------|------|
| Bootstrap | Create directory structure, package.json files | 1 hour |
| Backend API | SQLite schema, Meilisearch setup, upload endpoint | 4 hours |
| OCR Pipeline | Tesseract.js integration, BullMQ queue | 3 hours |
| Frontend Core | Vue 3 + Vite + Tailwind setup, routing | 2 hours |
| Components | Upload modal, search bar, document viewer | 4 hours |
| Figure Zoom | Port from lilian1, adapt to Vue | 2 hours |
| Service Worker | Port PWA offline support | 1 hour |
| Testing | Playwright E2E tests | 3 hours |
| Polish | Debug, validate fields, UI refinement | 4 hours |
| **Total** | | **24 hours** |

**With multi-agent approach:** Can parallelize backend + frontend work → ~12-16 hours

---

## Next Steps

1. ✅ Complete this extraction plan document
2. ⏭️ Bootstrap NaviDocs directory structure
3. ⏭️ Set up Vue 3 + Vite + Tailwind
4. ⏭️ Implement backend API (Express, SQLite, Meilisearch)
5. ⏭️ Port figure-zoom component
6. ⏭️ Implement upload & OCR pipeline
7. ⏭️ Add Playwright tests
8. ⏭️ Debug and validate
9. ⏭️ Proof of working system

**User directive:** "develop, debug, deploy and repeat; multi agent the max out of this"

Let's ship it.
