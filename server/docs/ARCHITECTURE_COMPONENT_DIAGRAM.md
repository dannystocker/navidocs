# Component Architecture Diagram

## Overview Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          NAVIDOCS APPLICATION                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
        ┌───────────▼──────┐  ┌────▼─────┐  ┌─────▼──────────┐
        │   HomeView.vue   │  │SearchView│  │DocumentView.vue│
        │                  │  │   .vue   │  │                │
        │ ┌──────────────┐ │  │          │  │ ┌────────────┐ │
        │ │ SearchInput  │ │  │          │  │ │CompactNav  │ │
        │ │   Component  │ │  │          │  │ │  Controls  │ │
        │ └──────┬───────┘ │  │          │  │ └─────┬──────┘ │
        │        │         │  │          │  │       │        │
        │        │         │  │          │  │ ┌─────▼──────┐ │
        │  Redirect to     │  │          │  │ │ Search     │ │
        │  SearchView      │  │          │  │ │ Dropdown   │ │
        └──────────────────┘  └──────────┘  │ └─────┬──────┘ │
                                             └───────┼────────┘
                                                     │
                ┌────────────────────────────────────┘
                │
                │  Both use shared components:
                │
                ├─────────────────────────┐
                │                         │
        ┌───────▼─────────┐      ┌───────▼────────┐
        │ SearchResults   │      │SearchResult    │
        │   Component     │──────▶   Card         │
        │  (Container)    │      │  (Individual)  │
        └─────────────────┘      └────────────────┘
```

## Data Flow Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                           │
└────────────────┬───────────────────────────────────────────────────┘
                 │
                 │ 1. Types search query
                 ▼
    ┌────────────────────────────┐
    │  SearchInput.vue Component │
    │  ┌──────────────────────┐  │
    │  │ v-model="searchQuery"│  │
    │  │ @input="handleSearch"│  │
    │  └──────────────────────┘  │
    └────────────┬───────────────┘
                 │
                 │ 2. Emits search event
                 ▼
    ┌─────────────────────────────────┐
    │  useDocumentSearch() Composable │
    │  ┌───────────────────────────┐  │
    │  │ searchWithScope(query)    │  │
    │  │   ↓                       │  │
    │  │ Calls useSearch().search()│  │
    │  └───────────────────────────┘  │
    └────────────┬────────────────────┘
                 │
                 │ 3. HTTP POST /api/search
                 ▼
    ┌─────────────────────────────────┐
    │  Backend: /routes/search.js     │
    │  ┌───────────────────────────┐  │
    │  │ POST /api/search          │  │
    │  │  - Add filters            │  │
    │  │  - Query Meilisearch      │  │
    │  │  - Add grouping metadata  │  │
    │  └───────────────────────────┘  │
    └────────────┬────────────────────┘
                 │
                 │ 4. Meilisearch query
                 ▼
    ┌─────────────────────────────────┐
    │       Meilisearch Engine        │
    │  ┌───────────────────────────┐  │
    │  │ Index: navidocs-pages     │  │
    │  │ Filter by:                │  │
    │  │  - userId/orgId           │  │
    │  │  - documentId (optional)  │  │
    │  │ Return highlighted hits   │  │
    │  └───────────────────────────┘  │
    └────────────┬────────────────────┘
                 │
                 │ 5. Results returned
                 ▼
    ┌─────────────────────────────────┐
    │  useSearchResults() Composable  │
    │  ┌───────────────────────────┐  │
    │  │ groupedByDocument()       │  │
    │  │  - Current doc first      │  │
    │  │  - Other docs grouped     │  │
    │  │  - Limit per group        │  │
    │  └───────────────────────────┘  │
    └────────────┬────────────────────┘
                 │
                 │ 6. Render results
                 ▼
    ┌─────────────────────────────────┐
    │   SearchResults.vue Component   │
    │  ┌───────────────────────────┐  │
    │  │ v-for="group in grouped"  │  │
    │  │   <h3>{{ group.title }}</h3>│
    │  │   <SearchResultCard />    │  │
    │  └───────────────────────────┘  │
    └────────────┬────────────────────┘
                 │
                 │ 7. User clicks result
                 ▼
    ┌─────────────────────────────────┐
    │  Navigate to DocumentView       │
    │  /document/{id}?page=12&q=bilge │
    └─────────────────────────────────┘
```

## Component Communication Pattern

```
┌──────────────────────────────────────────────────────────────────┐
│                    PROPS DOWN / EVENTS UP                        │
└──────────────────────────────────────────────────────────────────┘

Parent: DocumentView.vue
│
├─ Props ────────┐
│                ▼
│     ┌──────────────────────┐
│     │ CompactNavControls   │
│     │                      │
│     │ Props:               │
│     │  - currentPage       │
│     │  - totalPages        │
│     │  - loading           │
│     │                      │
│     │ Emits:               │
│     │  @prev-page          │
│     │  @next-page          │
│     │  @goto-page          │
│     └──────────────────────┘
│                │
└─ Listens ◀─────┘
   @prev-page="previousPage()"
   @next-page="nextPage()"


Parent: DocumentView.vue
│
├─ Provide ──────┐
│                ▼
│     ┌──────────────────────┐
│     │ SearchDropdown       │
│     │  (Teleported)        │
│     │                      │
│     │ Props:               │
│     │  - isOpen            │
│     │  - style (dynamic)   │
│     │                      │
│     │ Children:            │
│     │  <SearchResults>     │
│     │    <SearchResultCard>│
│     └──────────────────────┘
│                │
└─ Inject ◀──────┘
   closeDropdown()
   navigateToResult()
```

## State Management Flow

```
┌────────────────────────────────────────────────────────────┐
│              COMPOSITION API STATE (No Pinia)              │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  DocumentView.vue                                       │
│                                                         │
│  const {                                                │
│    searchQuery,        ◀── Reactive state              │
│    isDropdownOpen,     ◀── Reactive state              │
│    groupedResults,     ◀── Computed from search        │
│    prioritizedResults, ◀── Computed (current doc first)│
│    searchWithScope,    ◀── Async function              │
│    closeDropdown       ◀── Action function             │
│  } = useDocumentSearch(documentId)                      │
│                                                         │
│  └──► useDocumentSearch() ────────────────┐            │
│           │                                │            │
│           │ Composes                       │            │
│           │                                │            │
│           ├──► useSearch() ◀───────────────┼───┐        │
│           │      │                         │   │        │
│           │      └─► results.value         │   │        │
│           │      └─► loading.value         │   │        │
│           │      └─► search(q, options)    │   │        │
│           │                                │   │        │
│           └──► useSearchResults() ◀────────┘   │        │
│                  │                             │        │
│                  └─► groupedByDocument()       │        │
│                  └─► formatSnippet()           │        │
│                                                │        │
│  Each view has its own instance               │        │
│  (No shared global state)                     │        │
│                                                │        │
└────────────────────────────────────────────────┼────────┘
                                                 │
                         ┌───────────────────────┘
                         │
                         │  Shared logic, isolated state
                         │
              ┌──────────▼─────────┐
              │  SearchView.vue    │
              │                    │
              │  const {           │
              │    results,        │ ◀── Different instance
              │    search          │
              │  } = useSearch()   │
              │                    │
              └────────────────────┘
```

## CSS Layout Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    STICKY HEADER LAYOUT                         │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│  .document-header (position: sticky; top: 0)  │ ◀── Always visible
│  ┌─────────────────────────────────────────┐  │
│  │ [←] [→] [1/45]  Boat Manual    [Search]│  │
│  └─────────────────────────────────────────┘  │
│  z-index: 50                                  │
│  backdrop-filter: blur(16px)                  │
└─────────────────┬─────────────────────────────┘
                  │
                  │ Teleport to body
                  │
    ┌─────────────▼──────────────────┐
    │  .search-dropdown              │
    │  (position: fixed)             │
    │  ┌──────────────────────────┐  │
    │  │ This Document (8)        │  │
    │  │  - Page 12: bilge pump..│  │
    │  │  - Page 15: maintenance.│  │
    │  │                          │  │
    │  │ Other Documents (4)      │  │
    │  │  - Engine Manual p8...  │  │
    │  └──────────────────────────┘  │
    │  z-index: 60                   │
    │  top: calc(header + 8px)       │
    └────────────────────────────────┘
                  │
┌─────────────────▼─────────────────────────────┐
│  .pdf-viewer-content                          │
│  scroll-margin-top: 80px                      │
│  ┌─────────────────────────────────────────┐  │
│  │                                         │  │
│  │         PDF Canvas                      │  │
│  │         + Text Layer                    │  │
│  │         + Image Overlays                │  │
│  │                                         │  │
│  │                                         │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

## API Request/Response Flow

```
CLIENT                    SERVER                MEILISEARCH
  │                         │                         │
  │  POST /api/search       │                         │
  ├────────────────────────▶│                         │
  │  {                      │                         │
  │    q: "bilge pump",     │                         │
  │    currentDocumentId:   │                         │
  │      "doc-456",         │                         │
  │    limit: 50            │                         │
  │  }                      │                         │
  │                         │  POST /indexes/search   │
  │                         ├────────────────────────▶│
  │                         │  {                      │
  │                         │    q: "bilge pump",     │
  │                         │    filter: "userId=...  │
  │                         │      OR orgId IN [...]",│
  │                         │    limit: 50,           │
  │                         │    attributesToHighlight│
  │                         │  }                      │
  │                         │                         │
  │                         │  ◀ Search Results       │
  │                         │◀────────────────────────┤
  │                         │  {                      │
  │                         │    hits: [...],         │
  │                         │    processingTimeMs: 8  │
  │                         │  }                      │
  │                         │                         │
  │                         │  Add grouping metadata  │
  │                         │  ┌──────────────────┐   │
  │                         │  │ Group by docId   │   │
  │                         │  │ Mark current doc │   │
  │                         │  │ Calculate counts │   │
  │                         │  └──────────────────┘   │
  │                         │                         │
  │  ◀ Enhanced Response    │                         │
  │◀────────────────────────┤                         │
  │  {                      │                         │
  │    hits: [              │                         │
  │      { ...,             │                         │
  │        _isCurrentDoc:   │                         │
  │          true }         │                         │
  │    ],                   │                         │
  │    grouping: {          │                         │
  │      currentDocument: { │                         │
  │        docId: "...",    │                         │
  │        hitCount: 8      │                         │
  │      },                 │                         │
  │      otherDocuments: {  │                         │
  │        hitCount: 12,    │                         │
  │        documentCount: 3 │                         │
  │      }                  │                         │
  │    }                    │                         │
  │  }                      │                         │
  │                         │                         │
  │  Render grouped results │                         │
  │  in SearchDropdown      │                         │
  │                         │                         │
```

## Event Flow: Search Interaction

```
TIME: t0 ───────────────────────────────────────────────────────▶

USER ACTION: Types "bilge"
    │
    ├─ @input event
    │     │
    │     └─▶ searchQuery.value = "bilge"
    │         (Vue reactivity)
    │
TIME: t+300ms (debounce)
    │
    ├─ searchWithScope("bilge")
    │     │
    │     ├─▶ isDropdownOpen.value = true
    │     │
    │     └─▶ search("bilge", { limit: 50 })
    │           │
    │           └─▶ POST /api/search
    │                 │
TIME: t+308ms (8ms server)
    │                 │
    │                 └─▶ results.value = [...]
    │                       │
    │                       └─▶ groupedResults (computed)
    │                             │
    │                             └─▶ Dropdown re-renders
    │
TIME: t+350ms (42ms render)
    │
    └─ User sees results
         │
         │ USER ACTION: Clicks result
         │     │
         │     ├─▶ @result-click emitted
         │     │     │
         │     │     └─▶ router.push({
         │     │           name: 'document',
         │     │           params: { id: 'doc-456' },
         │     │           query: { page: 12, q: 'bilge' }
         │     │         })
         │     │
         │     └─▶ isDropdownOpen.value = false
         │
TIME: t+400ms
         │
         └─ DocumentView loads page 12 with highlights
```

## File Structure Tree

```
/home/setup/navidocs/
├── client/
│   └── src/
│       ├── components/
│       │   ├── search/              ◀── NEW DIRECTORY
│       │   │   ├── SearchResults.vue
│       │   │   ├── SearchResultCard.vue
│       │   │   ├── SearchDropdown.vue
│       │   │   └── SearchInput.vue
│       │   │
│       │   ├── navigation/          ◀── NEW DIRECTORY
│       │   │   ├── CompactNavControls.vue
│       │   │   └── NavTooltip.vue
│       │   │
│       │   └── [existing]/
│       │       ├── ConfirmDialog.vue
│       │       ├── FigureZoom.vue
│       │       ├── TocSidebar.vue
│       │       └── ...
│       │
│       ├── composables/
│       │   ├── useSearch.js         ◀── MODIFIED
│       │   ├── useDocumentSearch.js ◀── NEW
│       │   ├── useSearchResults.js  ◀── NEW
│       │   ├── useAuth.js
│       │   ├── useToast.js
│       │   └── useDocumentImages.js
│       │
│       ├── views/
│       │   ├── DocumentView.vue     ◀── MODIFIED
│       │   ├── SearchView.vue       ◀── MODIFIED
│       │   ├── HomeView.vue         ◀── MODIFIED
│       │   └── ...
│       │
│       └── assets/
│           └── icons/               ◀── NEW (optional)
│               └── nav-icons.svg
│
└── server/
    ├── routes/
    │   └── search.js                ◀── MODIFIED
    │
    ├── services/
    │   └── search.js                (no changes)
    │
    └── docs/
        ├── ARCHITECTURE_VIEWER_IMPROVEMENTS.md
        └── ARCHITECTURE_COMPONENT_DIAGRAM.md  ◀── THIS FILE
```

## Deployment Checklist

```
┌────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION PHASES                   │
└────────────────────────────────────────────────────────────┘

PHASE 1: Foundation Components (Week 1)
├─ [ ] Create /components/search/ directory
├─ [ ] Build SearchResults.vue (with tests)
├─ [ ] Build SearchResultCard.vue (with tests)
├─ [ ] Build SearchInput.vue (with tests)
├─ [ ] Build SearchDropdown.vue (with tests)
├─ [ ] Create useDocumentSearch.js composable
├─ [ ] Create useSearchResults.js composable
└─ [ ] Write unit tests (Vitest)

PHASE 2: Document Viewer Integration (Week 2)
├─ [ ] Create CompactNavControls.vue
├─ [ ] Create NavTooltip.vue
├─ [ ] Modify DocumentView.vue
│     ├─ [ ] Add sticky header
│     ├─ [ ] Integrate search dropdown
│     └─ [ ] Add keyboard shortcuts
├─ [ ] Update /routes/search.js API
│     ├─ [ ] Add currentDocumentId support
│     └─ [ ] Add grouping metadata
├─ [ ] Accessibility audit
└─ [ ] Cross-browser testing

PHASE 3: Search View Refactor (Week 3)
├─ [ ] Refactor SearchView.vue
│     ├─ [ ] Use SearchResults component
│     └─ [ ] Remove duplicate code
├─ [ ] Ensure feature parity
│     ├─ [ ] Expand/collapse
│     ├─ [ ] Image previews
│     └─ [ ] Context loading
└─ [ ] Performance benchmarks

PHASE 4: Home View & Polish (Week 4)
├─ [ ] Update HomeView.vue
│     └─ [ ] Use SearchInput component
├─ [ ] Add search suggestions
├─ [ ] Polish animations
├─ [ ] Final QA
├─ [ ] Update documentation
└─ [ ] Deploy to production
```

## Performance Optimization Map

```
┌────────────────────────────────────────────────────────────┐
│              PERFORMANCE CRITICAL PATHS                    │
└────────────────────────────────────────────────────────────┘

1. Search Input Handling
   ┌─────────────────────────────────────┐
   │ User types → Debounce (300ms)       │
   │           → Single API call         │
   │           → Cache results (5 min)   │
   └─────────────────────────────────────┘
   Target: < 400ms total (input to render)

2. Result Rendering
   ┌─────────────────────────────────────┐
   │ Limit initial: 50 results           │
   │ Virtual scroll: if > 100 results    │
   │ Lazy load images: IntersectionObserver│
   └─────────────────────────────────────┘
   Target: < 50ms first paint

3. Navigation Click
   ┌─────────────────────────────────────┐
   │ Click result → router.push()        │
   │             → Prefetch page data    │
   │             → Scroll to highlight   │
   └─────────────────────────────────────┘
   Target: < 200ms to visible page

4. Dropdown Open/Close
   ┌─────────────────────────────────────┐
   │ CSS transitions only (no JS anim)   │
   │ GPU-accelerated transforms          │
   │ will-change: transform, opacity     │
   └─────────────────────────────────────┘
   Target: 60fps (16ms per frame)
```

## Security & Auth Flow

```
┌────────────────────────────────────────────────────────────┐
│                 AUTHENTICATION FLOW                        │
└────────────────────────────────────────────────────────────┘

CLIENT                    SERVER                MEILISEARCH
  │                         │                         │
  │  1. Get tenant token    │                         │
  ├────────────────────────▶│                         │
  │  POST /api/search/token │                         │
  │  Authorization: Bearer  │                         │
  │    <JWT>                │                         │
  │                         │                         │
  │                         │  Verify JWT             │
  │                         │  Get user orgs          │
  │                         │  ┌──────────────┐       │
  │                         │  │ SQLite query │       │
  │                         │  │ user_orgs    │       │
  │                         │  └──────────────┘       │
  │                         │                         │
  │                         │  Generate tenant token  │
  │                         ├────────────────────────▶│
  │                         │  {                      │
  │                         │    searchRules: {       │
  │                         │      filter: "orgId..." │
  │                         │    },                   │
  │                         │    expiresAt: ...       │
  │                         │  }                      │
  │                         │                         │
  │  ◀ Tenant token         │                         │
  │◀────────────────────────┤                         │
  │  {                      │                         │
  │    token: "...",        │                         │
  │    expiresAt: "...",    │                         │
  │    indexName: "..."     │                         │
  │  }                      │                         │
  │                         │                         │
  │  2. Search with token   │                         │
  │  POST /api/search       │                         │
  │  (token auto-included)  │                         │
  ├────────────────────────▶│                         │
  │                         │                         │
  │                         │  Verify org access      │
  │                         │  Query Meilisearch      │
  │                         ├────────────────────────▶│
  │                         │  Authorization: Bearer  │
  │                         │    <tenant-token>       │
  │                         │                         │
  │                         │  ◀ Filtered results     │
  │                         │◀────────────────────────┤
  │                         │  (only user's orgs)     │
  │  ◀ Search results       │                         │
  │◀────────────────────────┤                         │
  │                         │                         │

Row-level security: Each hit filtered by userId/orgId
No data leakage: Users only see their own documents
```

---

**Legend**:
- `◀──` Data/event flow
- `┌──┐` Component/module boundary
- `[ ]` Task checkbox
- `◀── NEW` New file to create
- `◀── MODIFIED` Existing file to modify
