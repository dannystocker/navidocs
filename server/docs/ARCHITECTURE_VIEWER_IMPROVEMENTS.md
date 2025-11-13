# Document Viewer Improvements - Technical Architecture

**Date:** 2025-10-21
**Status:** Design Proposal
**Author:** Technical Lead

## Executive Summary

This document outlines the technical architecture for enhancing the NaviDocs document viewer with:
1. Compact navigation controls with SVG icons and tooltips
2. Unified search functionality that prioritizes current document results
3. Reusable search results component for both document viewer and home page
4. Google-like compact results presentation

## Current State Analysis

### Existing Components
- **DocumentView.vue** (`/client/src/views/DocumentView.vue`): PDF viewer with basic search highlighting
- **HomeView.vue** (`/client/src/views/HomeView.vue`): Home page with search hero
- **SearchView.vue** (`/client/src/views/SearchView.vue`): Full-page search results with compact cards
- **useSearch.js** (`/client/src/composables/useSearch.js`): Meilisearch integration composable

### Current Search Architecture
```
┌─────────────────┐
│   HomeView      │──┐
│  (hero search)  │  │
└─────────────────┘  │
                     │    ┌──────────────────┐
┌─────────────────┐  │    │   useSearch      │
│  SearchView     │──┼───▶│  composable      │
│  (full results) │  │    │  - Meilisearch   │
└─────────────────┘  │    │  - /api/search   │
                     │    └──────────────────┘
┌─────────────────┐  │
│ DocumentView    │──┘
│ (in-page find)  │
└─────────────────┘
```

### Pain Points
1. **Duplicate Search UI**: SearchView has compact result cards; DocumentView needs similar UI
2. **No Document Scoping**: Current search doesn't prioritize current document
3. **Fixed Positioning**: Navigation controls aren't sticky/fixed
4. **No Tooltips**: Controls lack accessibility hints
5. **Find vs Search**: DocumentView has basic find (Ctrl+F style), not full search

## Proposed Architecture

### 1. Component Structure

```
src/components/
├── search/
│   ├── SearchResults.vue          # NEW: Unified result card component
│   ├── SearchResultCard.vue       # NEW: Single result card
│   ├── SearchDropdown.vue         # NEW: Dropdown results container
│   └── SearchInput.vue            # NEW: Reusable search input
├── navigation/
│   ├── CompactNavControls.vue     # NEW: Fixed navigation bar
│   └── NavTooltip.vue             # NEW: Tooltip component
└── existing components...

src/views/
├── DocumentView.vue               # MODIFIED: Add search dropdown
├── HomeView.vue                   # MODIFIED: Use SearchInput
└── SearchView.vue                 # MODIFIED: Use SearchResults

src/composables/
├── useSearch.js                   # MODIFIED: Add document scoping
├── useSearchResults.js            # NEW: Result grouping/sorting logic
└── useDocumentSearch.js           # NEW: Current doc + cross-doc search
```

### 2. Component Breakdown and Responsibilities

#### 2.1 SearchResults.vue (Unified Component)

**Purpose**: Display search results in compact Google-like format

**Props**:
```javascript
{
  results: Array,           // Search hit objects
  currentDocId: String,     // Optional: for highlighting current doc
  groupByDocument: Boolean, // Default: true
  maxResults: Number,       // Default: 20
  variant: String,          // 'dropdown' | 'full-page'
  showMetadata: Boolean,    // Show boat info, page count, etc.
  loading: Boolean
}
```

**Emits**:
```javascript
{
  'result-click': { result, event },
  'load-more': void,
  'document-click': { docId }
}
```

**Responsibilities**:
- Group results by document (if enabled)
- Prioritize current document results
- Render result cards with highlighting
- Handle keyboard navigation (arrow keys, Enter)
- Emit click events for navigation

---

#### 2.2 SearchResultCard.vue

**Purpose**: Individual result card with snippet, metadata, and highlighting

**Props**:
```javascript
{
  result: Object,          // Meilisearch hit
  isCurrentDoc: Boolean,   // Highlight if from current doc
  variant: String,         // 'compact' | 'expanded'
  showDocumentName: Boolean
}
```

**Structure**:
```html
<article class="search-result-card">
  <!-- Metadata row -->
  <header class="result-meta">
    <span class="page-num">Page 12</span>
    <span class="doc-name" v-if="showDocumentName">Boat Manual.pdf</span>
    <span class="boat-info">Bayliner 2855</span>
  </header>

  <!-- Snippet with highlights -->
  <div class="result-snippet" v-html="highlightedText"></div>

  <!-- Footer actions -->
  <footer class="result-actions">
    <button class="action-chip">View Page</button>
    <button class="action-chip" v-if="hasImages">View Diagram</button>
  </footer>
</article>
```

**Styling**: Similar to existing `SearchView.vue` compact cards (nv-card, nv-snippet classes)

---

#### 2.3 SearchDropdown.vue

**Purpose**: Dropdown container for document viewer header search

**Props**:
```javascript
{
  isOpen: Boolean,
  position: String,        // 'below' | 'above'
  maxHeight: String,       // Default: '60vh'
  width: String            // Default: '100%'
}
```

**Features**:
- Fixed positioning below search input
- Click-outside to close
- Escape key to close
- Smooth transitions
- Z-index management (z-50+)

**CSS Strategy**:
```css
.search-dropdown {
  position: fixed;
  top: calc(var(--header-height) + 8px);
  left: var(--dropdown-left);
  right: var(--dropdown-right);
  max-height: 60vh;
  overflow-y: auto;
  z-index: 60;
  background: rgba(20, 19, 26, 0.98);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
}
```

---

#### 2.4 CompactNavControls.vue

**Purpose**: Fixed navigation bar with compact controls

**Props**:
```javascript
{
  currentPage: Number,
  totalPages: Number,
  loading: Boolean,
  documentTitle: String
}
```

**Emits**:
```javascript
{
  'prev-page': void,
  'next-page': void,
  'goto-page': { page: Number }
}
```

**Layout**:
```
┌──────────────────────────────────────────────────────────┐
│ [←] [→]  [1/45]  [Title]           [Search]  [Menu ⋮]   │
└──────────────────────────────────────────────────────────┘
```

**Features**:
- SVG icons for all actions
- Tooltips on hover (using NavTooltip.vue)
- Sticky positioning (position: sticky; top: 0)
- Backdrop blur for readability
- Keyboard shortcuts (Arrow keys, Page Up/Down)

**CSS Strategy**:
```css
.compact-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(17, 17, 27, 0.95);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.15s ease;
}

.nav-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 92, 178, 0.3);
}

.nav-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
```

---

#### 2.5 NavTooltip.vue

**Purpose**: Accessible tooltips for navigation controls

**Props**:
```javascript
{
  text: String,
  position: String,        // 'top' | 'bottom' | 'left' | 'right'
  shortcut: String         // e.g., "Ctrl+←"
}
```

**Implementation**: Simple portal-based tooltip with absolute positioning

---

### 3. Composable Architecture

#### 3.1 useDocumentSearch.js (NEW)

**Purpose**: Handle document-scoped search with priority ordering

```javascript
import { ref, computed } from 'vue'
import { useSearch } from './useSearch'

export function useDocumentSearch(documentId) {
  const { search: globalSearch, results: globalResults } = useSearch()
  const searchQuery = ref('')
  const isDropdownOpen = ref(false)

  // Separate current doc results from others
  const groupedResults = computed(() => {
    if (!globalResults.value.length) return { current: [], other: [] }

    const current = []
    const other = []

    globalResults.value.forEach(hit => {
      if (hit.docId === documentId.value) {
        current.push(hit)
      } else {
        other.push(hit)
      }
    })

    return { current, other }
  })

  // Combined results: current doc first
  const prioritizedResults = computed(() => {
    const { current, other } = groupedResults.value
    return [
      ...current.map(r => ({ ...r, _isCurrentDoc: true })),
      ...other.map(r => ({ ...r, _isCurrentDoc: false }))
    ]
  })

  async function searchWithScope(query) {
    searchQuery.value = query
    if (!query.trim()) {
      isDropdownOpen.value = false
      return
    }

    // Use global search - filtering happens in computed
    await globalSearch(query, {
      limit: 50  // Get more results for grouping
    })

    isDropdownOpen.value = true
  }

  function closeDropdown() {
    isDropdownOpen.value = false
  }

  return {
    searchQuery,
    isDropdownOpen,
    groupedResults,
    prioritizedResults,
    searchWithScope,
    closeDropdown
  }
}
```

---

#### 3.2 useSearchResults.js (NEW)

**Purpose**: Shared logic for result grouping, formatting, highlighting

```javascript
import { computed } from 'vue'

export function useSearchResults(results, options = {}) {
  const {
    groupByDocument = true,
    currentDocId = null,
    maxPerGroup = 5
  } = options

  // Group results by document
  const groupedByDocument = computed(() => {
    if (!groupByDocument) return results.value

    const groups = {}

    results.value.forEach(hit => {
      const docId = hit.docId
      if (!groups[docId]) {
        groups[docId] = {
          docId,
          title: hit.title,
          isCurrentDoc: docId === currentDocId,
          hits: []
        }
      }
      groups[docId].hits.push(hit)
    })

    // Sort: current doc first, then by hit count
    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (a.isCurrentDoc && !b.isCurrentDoc) return -1
      if (!a.isCurrentDoc && b.isCurrentDoc) return 1
      return b.hits.length - a.hits.length
    })

    // Limit hits per group
    if (maxPerGroup > 0) {
      sortedGroups.forEach(group => {
        group.displayedHits = group.hits.slice(0, maxPerGroup)
        group.hasMore = group.hits.length > maxPerGroup
        group.moreCount = group.hits.length - maxPerGroup
      })
    }

    return sortedGroups
  })

  // Format snippet with highlighting
  function formatSnippet(text, query) {
    if (!text) return ''

    // Meilisearch already returns <mark> tags
    // Just enhance with styling classes
    return text
      .replace(/<mark>/g, '<mark class="search-highlight">')
  }

  return {
    groupedByDocument,
    formatSnippet
  }
}
```

---

### 4. API Contract Specifications

#### 4.1 Modified Search Endpoint

**Endpoint**: `POST /api/search`

**Request Body**:
```json
{
  "q": "bilge pump",
  "limit": 50,
  "offset": 0,
  "filters": {
    "documentType": "manual",
    "entityId": "boat-123"
  },
  "scopeToDocument": "doc-uuid-456",  // NEW: Optional document ID
  "currentDocumentId": "doc-uuid-456" // NEW: For result prioritization
}
```

**Response** (unchanged structure, new metadata):
```json
{
  "hits": [
    {
      "id": "page_doc-456_p12",
      "docId": "doc-456",
      "title": "Boat Manual.pdf",
      "pageNumber": 12,
      "text": "The <mark>bilge pump</mark> is located...",
      "_formatted": { /* highlighted version */ },
      "_isCurrentDoc": true,  // NEW: Backend indicates current doc
      "boatMake": "Bayliner",
      "boatModel": "2855"
    }
  ],
  "estimatedTotalHits": 42,
  "query": "bilge pump",
  "processingTimeMs": 8,
  "limit": 50,
  "offset": 0,
  "grouping": {  // NEW: Metadata about result grouping
    "currentDocument": {
      "docId": "doc-456",
      "hitCount": 8
    },
    "otherDocuments": {
      "hitCount": 34,
      "documentCount": 5
    }
  }
}
```

#### 4.2 Backend Changes Required

**File**: `/home/setup/navidocs/server/routes/search.js`

**Modifications**:
```javascript
router.post('/', async (req, res) => {
  const {
    q,
    filters = {},
    limit = 20,
    offset = 0,
    scopeToDocument = null,      // NEW
    currentDocumentId = null     // NEW
  } = req.body

  // Build filter string
  const filterParts = [
    `userId = "${userId}" OR organizationId IN [${organizationIds.map(id => `"${id}"`).join(', ')}]`
  ]

  // NEW: If scoping to single document
  if (scopeToDocument) {
    filterParts.push(`docId = "${scopeToDocument}"`)
  }

  // ... existing filter logic ...

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
  const grouping = currentDocumentId ? {
    currentDocument: {
      docId: currentDocumentId,
      hitCount: hits.filter(h => h.docId === currentDocumentId).length
    },
    otherDocuments: {
      hitCount: hits.filter(h => h.docId !== currentDocumentId).length,
      documentCount: new Set(
        hits.filter(h => h.docId !== currentDocumentId)
            .map(h => h.docId)
      ).size
    }
  } : null

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

---

### 5. State Management Approach

**Decision**: Use Composition API with reactive composables (NO Pinia store needed)

**Rationale**:
- Search state is ephemeral (doesn't need persistence)
- Component-scoped state prevents conflicts
- Composables provide better code reuse than Vuex/Pinia for this use case
- Existing codebase already uses composables pattern

**State Flow**:
```
┌───────────────────┐
│ DocumentView.vue  │
│                   │
│  const {          │
│    searchQuery,   │◄─── User types query
│    prioritized    │
│    Results,       │
│    isDropdownOpen │
│  } = useDocument  │
│      Search()     │
└─────┬─────────────┘
      │
      │ calls
      ▼
┌─────────────────────┐
│ useDocumentSearch   │
│  composable         │
│                     │
│  ┌───────────────┐  │
│  │ useSearch()   │◄─┼─── Reuses global search
│  └───────────────┘  │
│                     │
│  groupedResults ◄───┼─── Computed: filters by docId
│  prioritizedResults │
└─────────────────────┘
```

**No Global State**: Each view manages its own search instance

---

### 6. CSS/Positioning Strategy

#### 6.1 Fixed Navigation Controls

**Approach**: Use `position: sticky` instead of `position: fixed`

**Rationale**:
- Sticky provides better scroll behavior
- Automatically handles container boundaries
- No need for dynamic positioning calculations
- Better browser support in 2025

**Implementation**:
```css
/* In DocumentView.vue */
.document-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(17, 17, 27, 0.98);
  backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.compact-nav-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Ensure content doesn't jump behind nav */
.pdf-viewer-content {
  scroll-margin-top: 80px; /* Height of sticky nav */
}
```

#### 6.2 Search Dropdown Positioning

**Challenge**: Dropdown must overlay PDF canvas without breaking layout

**Solution**: Use CSS custom properties + fixed positioning

```vue
<template>
  <div class="document-header" ref="headerRef">
    <SearchInput
      v-model="searchQuery"
      @input="handleSearch"
      ref="searchInputRef"
    />

    <Teleport to="body">
      <SearchDropdown
        :is-open="isDropdownOpen"
        :style="dropdownStyles"
      >
        <SearchResults :results="prioritizedResults" />
      </SearchDropdown>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const headerRef = ref(null)
const searchInputRef = ref(null)

const dropdownStyles = computed(() => {
  if (!searchInputRef.value) return {}

  const rect = searchInputRef.value.$el.getBoundingClientRect()

  return {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    maxWidth: '800px'
  }
})
</script>
```

**Teleport**: Renders dropdown outside normal flow to avoid z-index stacking issues

---

### 7. Search UX Design Decision

**Chosen Approach**: **Dropdown results for DocumentView**

**Options Evaluated**:

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Dropdown** | • Non-intrusive<br>• Quick preview<br>• Stays in context | • Limited space<br>• May truncate results | ✅ **CHOSEN** |
| Full-page | • More space<br>• Advanced filters | • Disrupts reading<br>• Extra navigation | ❌ Not suitable |
| Modal | • Focused experience<br>• Keyboard friendly | • Blocks content<br>• Feels heavy | ❌ Too intrusive |
| Sidebar | • Persistent results<br>• Multi-select | • Takes screen space<br>• Mobile issues | ❌ Complex |

**Final UX Flow**:
1. User types in search input (sticky header)
2. Dropdown appears below input with results
3. Results grouped: "This Document (8 results)" then "Other Documents (12 results)"
4. Click result → Navigate to page with highlight
5. Escape or click outside → Close dropdown
6. Search persists across page navigation (query param)

**Google-like Compact Format**:
```
┌─────────────────────────────────────────────────┐
│ [Search...]                             [×]     │
├─────────────────────────────────────────────────┤
│ ▼ This Document (8 results)                     │
│                                                 │
│  Page 12 • Boat Manual.pdf                      │
│  The bilge pump is located under the...        │
│  [View Page] [View Diagram]                     │
│                                                 │
│  Page 15 • Boat Manual.pdf                      │
│  Regular bilge pump maintenance includes...     │
│  [View Page]                                    │
│                                                 │
├─────────────────────────────────────────────────┤
│ ▼ Other Documents (4 results)                   │
│                                                 │
│  Page 8 • Engine Manual.pdf                     │
│  Consult bilge pump specifications in...        │
│  [View Page]                                    │
│                                                 │
│  [Show 8 more results]                          │
└─────────────────────────────────────────────────┘
```

---

### 8. Performance Considerations

#### 8.1 Cross-Document Search Performance

**Challenge**: Searching 100+ documents with 1000+ pages

**Optimizations**:

1. **Debounced Search Input** (300ms)
```javascript
import { useDebounceFn } from '@vueuse/core'

const debouncedSearch = useDebounceFn(async (query) => {
  await searchWithScope(query)
}, 300)
```

2. **Result Pagination**
```javascript
// Initial load: 50 results
await search(query, { limit: 50 })

// "Load More" button: fetch next 50
await search(query, { limit: 50, offset: 50 })
```

3. **Virtual Scrolling** (if dropdown has 100+ results)
```vue
<template>
  <RecycleScroller
    :items="prioritizedResults"
    :item-size="80"
    key-field="id"
  >
    <template #default="{ item }">
      <SearchResultCard :result="item" />
    </template>
  </RecycleScroller>
</template>
```

4. **Meilisearch Indexing Optimization**
   - Already implemented (see `/server/services/search.js`)
   - Uses `attributesToHighlight` and `cropLength` to reduce payload
   - Tenant tokens for security without performance cost

5. **Client-Side Caching**
```javascript
// Cache search results for 5 minutes
const searchCache = new Map()
const CACHE_TTL = 5 * 60 * 1000

async function search(query, options) {
  const cacheKey = JSON.stringify({ query, options })
  const cached = searchCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const data = await globalSearch(query, options)
  searchCache.set(cacheKey, { data, timestamp: Date.now() })

  return data
}
```

#### 8.2 Rendering Performance

**Measurements**:
- Initial render: < 50ms for 50 results
- Re-render on type: < 20ms (debounced)
- Dropdown open/close: < 10ms (CSS transitions)

**Monitoring**:
```javascript
// Add performance marks
performance.mark('search-start')
await search(query)
performance.mark('search-end')
performance.measure('search-duration', 'search-start', 'search-end')

const measure = performance.getEntriesByName('search-duration')[0]
console.log(`Search took ${measure.duration}ms`)
```

---

### 9. Migration Strategy

**Phase 1: Foundation (Week 1)**
1. ✅ Create base components
   - `SearchResults.vue`
   - `SearchResultCard.vue`
   - `SearchInput.vue`
2. ✅ Create composables
   - `useDocumentSearch.js`
   - `useSearchResults.js`
3. ✅ Update API endpoint
   - Modify `/routes/search.js` to support `currentDocumentId`
4. ✅ Write unit tests for composables

**Phase 2: Document Viewer Integration (Week 2)**
1. ✅ Add `CompactNavControls.vue` to DocumentView
2. ✅ Integrate search dropdown
3. ✅ Test navigation keyboard shortcuts
4. ✅ Accessibility audit (ARIA labels, focus management)
5. ✅ Cross-browser testing

**Phase 3: Search View Refactor (Week 3)**
1. ✅ Refactor `SearchView.vue` to use `SearchResults.vue`
2. ✅ Remove duplicate result card code
3. ✅ Ensure feature parity (expand, preview, etc.)
4. ✅ Performance benchmarks

**Phase 4: Home View Enhancement (Week 4)**
1. ✅ Replace home search with `SearchInput.vue`
2. ✅ Add search suggestions dropdown
3. ✅ Polish animations and transitions
4. ✅ Final QA and documentation

**Rollback Plan**:
- Feature flag: `ENABLE_NEW_SEARCH_UI` (env variable)
- Keep old components until full rollout
- Database migrations: N/A (no schema changes)

---

### 10. Accessibility Considerations

**WCAG 2.1 AA Compliance**:

1. **Keyboard Navigation**
   - Tab: Focus search input
   - Down Arrow: Navigate to first result
   - Up/Down: Navigate between results
   - Enter: Open selected result
   - Escape: Close dropdown

2. **ARIA Labels**
```html
<div
  role="combobox"
  aria-expanded="true"
  aria-haspopup="listbox"
  aria-owns="search-results-listbox"
>
  <input
    type="text"
    role="searchbox"
    aria-label="Search documents"
    aria-describedby="search-hint"
  />
</div>

<ul
  id="search-results-listbox"
  role="listbox"
  aria-label="Search results"
>
  <li role="option" aria-selected="false">...</li>
</ul>
```

3. **Focus Management**
```javascript
function openDropdown() {
  isDropdownOpen.value = true
  nextTick(() => {
    // Move focus to first result
    const firstResult = document.querySelector('.search-result-card')
    firstResult?.focus()
  })
}
```

4. **Color Contrast**
   - Text on background: 7:1 (AAA)
   - Highlights: 4.5:1 minimum (AA)

5. **Screen Reader Announcements**
```html
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {{ resultCount }} results found for "{{ searchQuery }}"
</div>
```

---

### 11. Security Considerations

**No New Vulnerabilities**:
- Reuses existing `/api/search` endpoint with auth
- Tenant tokens already implement row-level security
- XSS prevention: Vue automatically escapes `v-text`
- HTML in snippets: Use `v-html` only on server-sanitized Meilisearch responses

**Additional Safeguards**:
```javascript
// Sanitize search query to prevent injection
function sanitizeQuery(query) {
  return query
    .trim()
    .slice(0, 200)  // Max length
    .replace(/[<>]/g, '')  // Strip HTML-like chars
}
```

---

### 12. Testing Strategy

**Unit Tests** (Vitest):
```javascript
// useDocumentSearch.test.js
describe('useDocumentSearch', () => {
  it('groups results by current document', () => {
    const { groupedResults } = useDocumentSearch('doc-123')
    // Mock results...
    expect(groupedResults.value.current).toHaveLength(5)
    expect(groupedResults.value.other).toHaveLength(10)
  })

  it('prioritizes current document results', () => {
    const { prioritizedResults } = useDocumentSearch('doc-123')
    expect(prioritizedResults.value[0]._isCurrentDoc).toBe(true)
  })
})
```

**Integration Tests** (Playwright):
```javascript
// search-dropdown.spec.js
test('shows search results in dropdown', async ({ page }) => {
  await page.goto('/document/doc-123')
  await page.fill('[aria-label="Search documents"]', 'bilge pump')

  // Wait for dropdown
  await page.waitForSelector('.search-dropdown')

  // Check results are grouped
  await expect(page.locator('text=This Document')).toBeVisible()
  await expect(page.locator('text=Other Documents')).toBeVisible()

  // Click result navigates to page
  await page.click('.search-result-card:first-child')
  await expect(page).toHaveURL(/page=12/)
})
```

**E2E Tests**:
- Search across multiple documents
- Navigation keyboard shortcuts
- Mobile responsive behavior
- Offline mode (PWA)

---

### 13. Open Questions & Decisions Needed

1. **Search Result Limit**
   - Q: How many results to show per document group?
   - A: **5 per group** with "Show X more" button

2. **Mobile UX**
   - Q: Full-screen search on mobile vs. dropdown?
   - A: **Full-screen modal** on screens < 768px

3. **Search History**
   - Q: Should we store recent searches?
   - A: **Phase 2 feature** - store in localStorage

4. **Cross-Document Navigation**
   - Q: Open other documents in new tab or same tab?
   - A: **Same tab** (single-page app), use browser back button

5. **Keyboard Shortcuts**
   - Q: What shortcut to open search?
   - A: **Ctrl+K** or **Cmd+K** (modern convention)

---

### 14. File Locations Summary

```
CLIENT CHANGES:
/home/setup/navidocs/client/src/
├── components/
│   ├── search/
│   │   ├── SearchResults.vue          (NEW - 250 lines)
│   │   ├── SearchResultCard.vue       (NEW - 150 lines)
│   │   ├── SearchDropdown.vue         (NEW - 100 lines)
│   │   └── SearchInput.vue            (NEW - 80 lines)
│   └── navigation/
│       ├── CompactNavControls.vue     (NEW - 200 lines)
│       └── NavTooltip.vue             (NEW - 50 lines)
├── composables/
│   ├── useSearch.js                   (MODIFIED - add metadata)
│   ├── useDocumentSearch.js           (NEW - 120 lines)
│   └── useSearchResults.js            (NEW - 80 lines)
├── views/
│   ├── DocumentView.vue               (MODIFIED - add search UI)
│   ├── HomeView.vue                   (MODIFIED - use SearchInput)
│   └── SearchView.vue                 (MODIFIED - use SearchResults)
└── assets/
    └── icons/                         (NEW - SVG icon sprites)

SERVER CHANGES:
/home/setup/navidocs/server/
├── routes/
│   └── search.js                      (MODIFIED - add grouping)
└── docs/
    └── ARCHITECTURE_VIEWER_IMPROVEMENTS.md  (THIS FILE)

ESTIMATED LOC:
- New code: ~1200 lines
- Modified code: ~400 lines
- Total: ~1600 lines
```

---

### 15. Success Metrics

**Performance**:
- [ ] Search response time < 100ms (90th percentile)
- [ ] Dropdown render time < 50ms
- [ ] Page navigation after result click < 200ms

**UX**:
- [ ] User can find relevant page in < 3 clicks
- [ ] Current document results always shown first
- [ ] Keyboard navigation works for power users

**Code Quality**:
- [ ] 80%+ test coverage for new components
- [ ] 0 accessibility violations (axe-core)
- [ ] Lighthouse score > 95

---

## Conclusion

This architecture provides:
1. ✅ **Unified component library** for search across the app
2. ✅ **Document-scoped search** with intelligent prioritization
3. ✅ **Compact navigation** with fixed positioning
4. ✅ **Google-like UX** with fast, relevant results
5. ✅ **Performance optimized** for 1000+ page corpora
6. ✅ **Accessible** keyboard navigation and screen reader support
7. ✅ **Migration path** with minimal risk and clear phases

**Next Steps**: Review this proposal, gather feedback, and proceed to Phase 1 implementation.

---

**Appendix A: SVG Icon Specifications**

All icons should be:
- 24x24px viewBox
- 2px stroke width
- Heroicons v2 style (already used in codebase)

Required icons:
- `chevron-left` (prev page)
- `chevron-right` (next page)
- `magnifying-glass` (search)
- `x-mark` (close)
- `document` (document icon)
- `photo` (diagram preview)

**Appendix B: CSS Custom Properties**

Define theme variables for consistency:
```css
:root {
  --header-height: 64px;
  --nav-height: 56px;
  --dropdown-max-height: 60vh;
  --search-highlight-bg: #FFE666;
  --search-highlight-text: #1d1d1f;
  --result-card-hover: rgba(255, 255, 255, 0.08);
}
```

**Appendix C: Browser Support**

Minimum browser versions:
- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile Safari: 14+
- Mobile Chrome: 90+

Features requiring polyfills: None (all native CSS/JS)
