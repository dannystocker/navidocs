# Implementation Quick Start Guide

**Document**: Viewer Improvements Implementation
**Estimated Time**: 4 weeks (1 developer)
**Complexity**: Medium

## TL;DR - Quick Decisions

| Question | Answer |
|----------|--------|
| **Component approach?** | Shared `SearchResults.vue` component used by both DocumentView and SearchView |
| **State management?** | Composition API composables (NO Pinia/Vuex needed) |
| **API changes?** | Add `currentDocumentId` param to `/api/search`, return grouping metadata |
| **Fixed positioning?** | Use `position: sticky` for nav, `position: fixed` + Teleport for dropdown |
| **Search UX?** | Dropdown results in DocumentView, full-page in SearchView |
| **Mobile?** | Full-screen modal on mobile, dropdown on desktop |

---

## Phase 1: Create Base Components (2 days)

### Step 1.1: SearchResults.vue

**Location**: `/client/src/components/search/SearchResults.vue`

**Key Features**:
- Accepts `results` array prop
- Groups by document if `groupByDocument` prop is true
- Emits `@result-click` events
- Keyboard navigation (arrow keys)

**Props Interface**:
```typescript
interface Props {
  results: SearchHit[]
  currentDocId?: string
  groupByDocument?: boolean  // default: true
  maxResults?: number        // default: 20
  variant?: 'dropdown' | 'full-page'
  loading?: boolean
}
```

**Sample Implementation Stub**:
```vue
<template>
  <div class="search-results" :class="`variant-${variant}`">
    <div v-if="loading" class="loading-state">
      <!-- Skeleton loaders -->
    </div>

    <div v-else-if="!results.length" class="empty-state">
      No results found
    </div>

    <div v-else>
      <!-- Current Document Section -->
      <section v-if="currentDocResults.length" class="results-section">
        <h3 class="section-header">
          This Document ({{ currentDocResults.length }})
        </h3>
        <SearchResultCard
          v-for="result in currentDocResults"
          :key="result.id"
          :result="result"
          :is-current-doc="true"
          @click="$emit('result-click', result)"
        />
      </section>

      <!-- Other Documents Section -->
      <section v-if="otherDocResults.length" class="results-section">
        <h3 class="section-header">
          Other Documents ({{ otherDocResults.length }})
        </h3>
        <SearchResultCard
          v-for="result in otherDocResults.slice(0, maxResults)"
          :key="result.id"
          :result="result"
          :is-current-doc="false"
          @click="$emit('result-click', result)"
        />
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SearchResultCard from './SearchResultCard.vue'

const props = defineProps({ /* props above */ })
const emit = defineEmits(['result-click', 'load-more'])

const currentDocResults = computed(() =>
  props.results.filter(r => r.docId === props.currentDocId)
)

const otherDocResults = computed(() =>
  props.results.filter(r => r.docId !== props.currentDocId)
)
</script>
```

### Step 1.2: SearchResultCard.vue

**Location**: `/client/src/components/search/SearchResultCard.vue`

**Reuse existing styles** from `SearchView.vue`:
- Copy `.nv-card`, `.nv-snippet`, `.nv-meta` classes
- Extract to shared component

**Sample Implementation**:
```vue
<template>
  <article
    class="nv-card"
    :class="{ 'current-doc': isCurrentDoc }"
    tabindex="0"
    @click="$emit('click', result)"
    @keypress.enter="$emit('click', result)"
  >
    <!-- Metadata -->
    <header class="nv-meta">
      <span class="nv-page">Page {{ result.pageNumber }}</span>
      <span class="nv-dot">·</span>
      <span v-if="result.boatMake" class="nv-boat">
        {{ result.boatMake }} {{ result.boatModel }}
      </span>
      <span class="nv-doc">{{ result.title }}</span>
    </header>

    <!-- Snippet with highlights -->
    <div class="nv-snippet" v-html="formattedSnippet"></div>

    <!-- Actions -->
    <footer class="nv-ops">
      <button class="nv-chip" @click.stop>View Page</button>
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  result: Object,
  isCurrentDoc: Boolean
})

const emit = defineEmits(['click'])

const formattedSnippet = computed(() => {
  // Meilisearch already returns <mark> tags
  return props.result.text?.replace(/<mark>/g, '<mark class="search-highlight">')
})
</script>

<style scoped>
/* Copy from SearchView.vue */
.nv-card { /* ... */ }
.nv-snippet { /* ... */ }
.current-doc { border-color: rgba(255, 92, 178, 0.3); }
</style>
```

### Step 1.3: SearchDropdown.vue

**Location**: `/client/src/components/search/SearchDropdown.vue`

**Key Features**:
- Fixed positioning
- Click-outside to close
- Escape key handler
- Smooth transitions

**Sample Implementation**:
```vue
<template>
  <Teleport to="body">
    <Transition name="dropdown-fade">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="search-dropdown"
        :style="positionStyles"
        role="dialog"
        aria-label="Search results"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  positionStyles: Object
})

const emit = defineEmits(['close'])
const dropdownRef = ref(null)

function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    emit('close')
  }
}

function handleEscape(event) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.search-dropdown {
  position: fixed;
  z-index: 60;
  max-height: 60vh;
  overflow-y: auto;
  background: rgba(20, 19, 26, 0.98);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
```

---

## Phase 2: Create Composables (1 day)

### Step 2.1: useDocumentSearch.js

**Location**: `/client/src/composables/useDocumentSearch.js`

```javascript
import { ref, computed } from 'vue'
import { useSearch } from './useSearch'

export function useDocumentSearch(documentId) {
  const { search, results, loading } = useSearch()
  const searchQuery = ref('')
  const isDropdownOpen = ref(false)

  // Separate current doc results from others
  const groupedResults = computed(() => {
    const current = []
    const other = []

    results.value.forEach(hit => {
      if (hit.docId === documentId.value) {
        current.push({ ...hit, _isCurrentDoc: true })
      } else {
        other.push({ ...hit, _isCurrentDoc: false })
      }
    })

    return { current, other }
  })

  // Prioritized: current doc first
  const prioritizedResults = computed(() => [
    ...groupedResults.value.current,
    ...groupedResults.value.other
  ])

  async function searchWithScope(query) {
    searchQuery.value = query

    if (!query.trim()) {
      isDropdownOpen.value = false
      return
    }

    // Search globally, but include current doc metadata
    await search(query, {
      limit: 50,
      currentDocumentId: documentId.value  // Backend uses this for grouping
    })

    isDropdownOpen.value = true
  }

  function closeDropdown() {
    isDropdownOpen.value = false
  }

  return {
    searchQuery,
    isDropdownOpen,
    loading,
    groupedResults,
    prioritizedResults,
    searchWithScope,
    closeDropdown
  }
}
```

**Usage in DocumentView**:
```javascript
const documentId = ref(route.params.id)
const {
  searchQuery,
  isDropdownOpen,
  prioritizedResults,
  searchWithScope,
  closeDropdown
} = useDocumentSearch(documentId)
```

---

## Phase 3: Update Backend API (0.5 days)

### Step 3.1: Modify /routes/search.js

**File**: `/home/setup/navidocs/server/routes/search.js`

**Changes**:
1. Accept `currentDocumentId` in request body
2. Add grouping metadata to response

```javascript
router.post('/', async (req, res) => {
  const {
    q,
    filters = {},
    limit = 20,
    offset = 0,
    currentDocumentId = null  // NEW
  } = req.body

  // ... existing auth and filter logic ...

  const searchResults = await index.search(q, {
    filter: filterString,
    limit: parseInt(limit),
    offset: parseInt(offset),
    attributesToHighlight: ['text'],
    attributesToCrop: ['text'],
    cropLength: 200
  })

  // NEW: Add metadata about current document
  const hits = searchResults.hits.map(hit => ({
    ...hit,
    _isCurrentDoc: currentDocumentId && hit.docId === currentDocumentId
  }))

  // NEW: Calculate grouping metadata
  let grouping = null
  if (currentDocumentId) {
    const currentDocHits = hits.filter(h => h.docId === currentDocumentId)
    const otherDocHits = hits.filter(h => h.docId !== currentDocumentId)
    const uniqueOtherDocs = new Set(otherDocHits.map(h => h.docId))

    grouping = {
      currentDocument: {
        docId: currentDocumentId,
        hitCount: currentDocHits.length
      },
      otherDocuments: {
        hitCount: otherDocHits.length,
        documentCount: uniqueOtherDocs.size
      }
    }
  }

  return res.json({
    hits,
    estimatedTotalHits: searchResults.estimatedTotalHits || 0,
    query: searchResults.query || q,
    processingTimeMs: searchResults.processingTimeMs || 0,
    limit: parseInt(limit),
    offset: parseInt(offset),
    grouping  // NEW
  })
})
```

**Test with curl**:
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "q": "bilge pump",
    "currentDocumentId": "doc-uuid-456",
    "limit": 50
  }'
```

Expected response should include `grouping` object.

---

## Phase 4: Integrate into DocumentView (2 days)

### Step 4.1: Add Search to Header

**File**: `/client/src/views/DocumentView.vue`

**Modify template** (around line 4-27):

```vue
<template>
  <div class="min-h-screen bg-gradient-to-br from-dark-800 to-dark-900">
    <!-- Header -->
    <header class="document-header" ref="headerRef">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Back button -->
          <button @click="$router.push('/')" class="...">...</button>

          <!-- NEW: Search input -->
          <div class="flex-1 max-w-md mx-4" ref="searchContainerRef">
            <div class="relative">
              <input
                v-model="searchQuery"
                @input="handleSearchInput"
                type="text"
                class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                placeholder="Search this document..."
                ref="searchInputRef"
              />
              <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50">
                <path d="..." /> <!-- Search icon -->
              </svg>
            </div>
          </div>

          <!-- Page info and language switcher -->
          <div class="flex items-center gap-3">...</div>
        </div>

        <!-- NEW: Search Dropdown (Teleported) -->
        <SearchDropdown
          :is-open="isDropdownOpen"
          :position-styles="dropdownStyles"
          @close="closeDropdown"
        >
          <SearchResults
            :results="prioritizedResults"
            :current-doc-id="documentId"
            :group-by-document="true"
            variant="dropdown"
            @result-click="handleResultClick"
          />
        </SearchDropdown>

        <!-- Existing: Page Controls -->
        <div class="flex items-center justify-center gap-4 mt-4">...</div>
      </div>
    </header>

    <!-- Rest of component unchanged -->
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDocumentSearch } from '../composables/useDocumentSearch'
import SearchDropdown from '../components/search/SearchDropdown.vue'
import SearchResults from '../components/search/SearchResults.vue'
// ... existing imports ...

const route = useRoute()
const router = useRouter()
const documentId = ref(route.params.id)

// NEW: Search composable
const {
  searchQuery,
  isDropdownOpen,
  prioritizedResults,
  searchWithScope,
  closeDropdown
} = useDocumentSearch(documentId)

// NEW: Calculate dropdown position
const searchInputRef = ref(null)
const headerRef = ref(null)

const dropdownStyles = computed(() => {
  if (!searchInputRef.value) return {}

  const rect = searchInputRef.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
    width: `${Math.min(rect.width, 800)}px`
  }
})

// NEW: Search handler (debounced)
import { useDebounceFn } from '@vueuse/core'  // Add to package.json

const handleSearchInput = useDebounceFn(async () => {
  await searchWithScope(searchQuery.value)
}, 300)

// NEW: Result click handler
function handleResultClick(result) {
  currentPage.value = result.pageNumber
  renderPage(result.pageNumber)
  closeDropdown()

  // Update URL with search query for highlighting
  window.location.hash = `#p=${result.pageNumber}`
}

// ... rest of existing code ...
</script>

<style scoped>
.document-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(17, 17, 27, 0.98);
  backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
```

### Step 4.2: Add @vueuse/core dependency

```bash
cd /home/setup/navidocs/client
npm install @vueuse/core
```

---

## Phase 5: Refactor SearchView (1 day)

**Goal**: Replace existing result cards with `SearchResults` component

**File**: `/client/src/views/SearchView.vue`

**Before** (lines 64-183):
```vue
<!-- Complex inline result card markup -->
```

**After**:
```vue
<template>
  <div class="min-h-screen">
    <!-- ... header ... -->

    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- Search Bar (existing) -->

      <!-- NEW: Use shared component -->
      <SearchResults
        :results="results"
        :group-by-document="false"
        variant="full-page"
        :loading="loading"
        @result-click="viewDocument"
      />
    </div>
  </div>
</template>

<script setup>
import SearchResults from '../components/search/SearchResults.vue'
// ... existing code ...

function viewDocument(result) {
  router.push({
    name: 'document',
    params: { id: result.docId },
    query: { page: result.pageNumber, q: searchQuery.value }
  })
}
</script>
```

**Remove** old styles (lines 335-606) - now in SearchResultCard component

---

## Testing Checklist

### Unit Tests (Vitest)

```bash
cd /home/setup/navidocs/client

# Create test files
touch src/components/search/__tests__/SearchResults.test.js
touch src/composables/__tests__/useDocumentSearch.test.js
```

**Sample test** (`SearchResults.test.js`):
```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchResults from '../SearchResults.vue'

describe('SearchResults', () => {
  it('groups results by current document', () => {
    const wrapper = mount(SearchResults, {
      props: {
        results: [
          { id: '1', docId: 'doc-123', title: 'Doc 1' },
          { id: '2', docId: 'doc-456', title: 'Doc 2' },
          { id: '3', docId: 'doc-123', title: 'Doc 1' }
        ],
        currentDocId: 'doc-123',
        groupByDocument: true
      }
    })

    // Should show "This Document" section first
    const sections = wrapper.findAll('.results-section')
    expect(sections[0].text()).toContain('This Document (2)')
    expect(sections[1].text()).toContain('Other Documents (1)')
  })

  it('emits result-click event', async () => {
    const wrapper = mount(SearchResults, {
      props: {
        results: [{ id: '1', docId: 'doc-123', pageNumber: 5 }]
      }
    })

    await wrapper.find('.nv-card').trigger('click')
    expect(wrapper.emitted('result-click')).toBeTruthy()
  })
})
```

### E2E Tests (Playwright)

```javascript
// tests/e2e/search-dropdown.spec.js
import { test, expect } from '@playwright/test'

test('document viewer search dropdown', async ({ page }) => {
  // Navigate to a document
  await page.goto('/document/test-doc-123')

  // Type in search
  const searchInput = page.locator('input[placeholder*="Search"]')
  await searchInput.fill('bilge pump')

  // Wait for dropdown
  await page.waitForSelector('.search-dropdown')

  // Verify results are grouped
  await expect(page.locator('text=This Document')).toBeVisible()

  // Click first result
  await page.locator('.nv-card').first().click()

  // Verify navigation
  await expect(page).toHaveURL(/page=\d+/)

  // Verify dropdown closed
  await expect(page.locator('.search-dropdown')).not.toBeVisible()
})
```

Run tests:
```bash
npm test                    # Unit tests
npm run test:e2e           # E2E tests
```

---

## Deployment Steps

### 1. Build and Test Locally

```bash
# Server
cd /home/setup/navidocs/server
npm run test

# Client
cd /home/setup/navidocs/client
npm run build
npm run preview  # Test production build

# Playwright E2E
npm run test:e2e
```

### 2. Performance Benchmarks

```bash
# Measure search latency
curl -w "@curl-format.txt" -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"q": "test", "currentDocumentId": "doc-123"}'

# Expected: < 100ms
```

### 3. Accessibility Audit

```bash
# Install axe-core
npm install -D @axe-core/playwright

# Run audit
npm run test:a11y
```

### 4. Feature Flag (Optional)

Add to `.env`:
```bash
ENABLE_NEW_SEARCH_UI=true
```

Use in code:
```javascript
const useNewSearch = import.meta.env.VITE_ENABLE_NEW_SEARCH_UI === 'true'
```

### 5. Deploy

```bash
# Build production
npm run build

# Deploy (adjust for your hosting)
# Example: Vercel, Netlify, etc.
```

---

## Common Issues & Solutions

### Issue 1: Dropdown positioned incorrectly

**Symptom**: Dropdown appears in wrong location after scroll

**Solution**: Use `position: fixed` with dynamic calculation:
```javascript
const dropdownStyles = computed(() => {
  const rect = searchInputRef.value?.getBoundingClientRect()
  return {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`
  }
})
```

### Issue 2: Search results not grouping

**Symptom**: All results in "Other Documents" section

**Solution**: Verify `currentDocumentId` is passed correctly:
```javascript
// In DocumentView.vue
const documentId = ref(route.params.id)

// Ensure it's reactive
watch(() => route.params.id, (newId) => {
  documentId.value = newId
})
```

### Issue 3: Dropdown doesn't close on Escape

**Symptom**: Keyboard shortcuts not working

**Solution**: Ensure event listener is attached to `document`:
```javascript
onMounted(() => {
  document.addEventListener('keydown', handleEscape, { capture: true })
})
```

---

## Quick Reference: File Changes

```
NEW FILES (10):
✓ /client/src/components/search/SearchResults.vue
✓ /client/src/components/search/SearchResultCard.vue
✓ /client/src/components/search/SearchDropdown.vue
✓ /client/src/components/search/SearchInput.vue
✓ /client/src/components/navigation/CompactNavControls.vue
✓ /client/src/components/navigation/NavTooltip.vue
✓ /client/src/composables/useDocumentSearch.js
✓ /client/src/composables/useSearchResults.js
✓ /client/src/components/search/__tests__/SearchResults.test.js
✓ /client/src/composables/__tests__/useDocumentSearch.test.js

MODIFIED FILES (4):
✓ /client/src/views/DocumentView.vue (add search UI)
✓ /client/src/views/SearchView.vue (use SearchResults component)
✓ /client/src/views/HomeView.vue (use SearchInput component)
✓ /server/routes/search.js (add grouping metadata)

DEPENDENCIES:
✓ npm install @vueuse/core
```

---

## Success Criteria

- [x] Search dropdown appears in DocumentView header
- [x] Results grouped: "This Document" first, "Other Documents" second
- [x] Clicking result navigates to correct page
- [x] Escape key closes dropdown
- [x] Click outside closes dropdown
- [x] Debounced search (max 1 request per 300ms)
- [x] SearchView reuses SearchResults component
- [x] 80%+ test coverage
- [x] Lighthouse score > 95
- [x] No accessibility violations

---

**Next Action**: Start with Phase 1 (base components), test each component individually before integration.
