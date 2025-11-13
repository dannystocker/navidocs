# Technical Decisions Summary

**Project**: Document Viewer Search Improvements
**Date**: 2025-10-21
**Status**: Approved Design

## Key Decisions Matrix

### 1. Component Architecture

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|----------|----------------|-----------|------------------------|
| **Search Results Component** | Unified `SearchResults.vue` shared by DocumentView and SearchView | DRY principle, consistent UX, easier maintenance | Separate components per view (rejected: code duplication) |
| **Result Card** | Extract to `SearchResultCard.vue` | Reusable across dropdown and full-page views | Inline template (rejected: hard to test) |
| **Dropdown Container** | Separate `SearchDropdown.vue` with Teleport | Clean separation of concerns, portal for z-index | Inline in DocumentView (rejected: messy code) |
| **Navigation Controls** | `CompactNavControls.vue` component | Encapsulates nav logic, reusable | Mix with DocumentView (rejected: poor separation) |

**Decision**: Component-based architecture with clear responsibilities

---

### 2. State Management

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|----------|----------------|-----------|------------------------|
| **Global State** | NO global store (Pinia/Vuex) | Search is ephemeral, component-scoped state sufficient | Pinia store (rejected: unnecessary complexity) |
| **Composables** | `useDocumentSearch.js`, `useSearchResults.js` | Composition API pattern, code reuse without coupling | Mixin-based (rejected: Vue 3 deprecates mixins) |
| **Search Caching** | In-memory Map with 5-min TTL | Fast repeat queries, automatic cleanup | localStorage (rejected: not sensitive data) |
| **Result Grouping** | Computed property in composable | Reactive, declarative, no manual updates | Manual state management (rejected: error-prone) |

**Decision**: Composition API with reactive composables, no global store

---

### 3. API Design

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|----------|----------------|-----------|------------------------|
| **Document Scoping** | Add `currentDocumentId` param to existing `/api/search` | Backward compatible, single endpoint | New `/api/search/scoped` endpoint (rejected: fragmentation) |
| **Grouping Metadata** | Return `grouping` object in response | Frontend can display counts without recalculation | Client-side grouping only (rejected: missed optimization) |
| **Result Prioritization** | Backend adds `_isCurrentDoc` flag | Single source of truth, less client logic | Client-only sorting (rejected: duplicates logic) |
| **Pagination** | Existing `limit`/`offset` params | Already implemented, works well | Cursor-based (rejected: overkill) |

**Decision**: Extend existing API with minimal changes, maintain backward compatibility

**API Contract**:
```json
POST /api/search
Request: {
  "q": "query",
  "currentDocumentId": "doc-123",  // NEW (optional)
  "limit": 50
}

Response: {
  "hits": [...],
  "grouping": {                     // NEW
    "currentDocument": { "hitCount": 8 },
    "otherDocuments": { "hitCount": 12, "documentCount": 3 }
  }
}
```

---

### 4. CSS/Positioning Strategy

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|----------|----------------|-----------|------------------------|
| **Navigation Bar** | `position: sticky; top: 0` | Smooth scroll behavior, no JS needed | `position: fixed` (rejected: layout jumps) |
| **Search Dropdown** | `position: fixed` + Teleport to body | Overlays content, no z-index issues | Absolute position (rejected: overflow issues) |
| **Backdrop Blur** | CSS `backdrop-filter: blur(16px)` | Native browser support, GPU accelerated | JS blur library (rejected: performance cost) |
| **Transitions** | CSS transitions only | 60fps, hardware accelerated | JS animation libraries (rejected: bundle size) |
| **Mobile Layout** | Full-screen modal (< 768px), dropdown (> 768px) | Better touch UX, more space on mobile | Same dropdown everywhere (rejected: poor mobile UX) |

**Decision**: Modern CSS features (sticky, backdrop-filter) with progressive enhancement

**Browser Support**:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All features have 95%+ browser support as of 2025

---

### 5. Search UX Pattern

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|----------|----------------|-----------|------------------------|
| **DocumentView Search** | Dropdown results | Non-intrusive, keeps context | Full-page (rejected: disrupts reading), Sidebar (rejected: screen space) |
| **Result Grouping** | "This Document" first, then "Other Documents" | Users prioritize current doc 80% of time | Flat list (rejected: poor scannability) |
| **Debounce Delay** | 300ms | Balance between responsiveness and API load | 500ms (rejected: feels slow), 100ms (rejected: too many requests) |
| **Results Per Group** | 5 current doc, 5 other docs, "Show more" button | Compact, shows variety, infinite scroll option | Show all (rejected: overwhelming), 3 per group (rejected: too few) |
| **Keyboard Navigation** | Arrow keys, Enter, Escape | Power user efficiency | Mouse-only (rejected: poor accessibility) |

**Decision**: Google-like dropdown with intelligent grouping

**UX Flow**:
```
User types → 300ms debounce → API call → Dropdown renders
  ↓
"This Document (8)"     ← Always first
  Page 12: ...
  Page 15: ...
  [5 results max]

"Other Documents (4)"   ← Collapsed by default on mobile
  Engine Manual p8: ...
  [Show 8 more]

Click result → Navigate to page → Dropdown closes
```

---

### 6. Performance Optimizations

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|----------|----------------|-----------|------------------------|
| **Search Debouncing** | `useDebounceFn` from @vueuse/core | Battle-tested, TypeScript support | Custom debounce (rejected: reinventing wheel) |
| **Result Caching** | 5-minute in-memory cache | Repeat searches instant | IndexedDB (rejected: overkill), No cache (rejected: poor UX) |
| **Virtual Scrolling** | Only if > 100 results | Most searches return < 50 results | Always virtual scroll (rejected: complexity), Never (rejected: performance) |
| **Image Lazy Loading** | `IntersectionObserver` API | Native, no library needed | Eager loading (rejected: slow), Library (rejected: bundle size) |
| **Bundle Splitting** | Code split search components | Faster initial load | Single bundle (rejected: larger initial load) |

**Decision**: Pragmatic optimizations based on real-world usage

**Performance Targets**:
- Search input → API response: < 100ms (p90)
- API response → Dropdown render: < 50ms
- Dropdown open/close: 60fps (16ms per frame)
- Total (type to see results): < 400ms

---

### 7. Accessibility

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|----------|----------------|-----------|------------------------|
| **ARIA Roles** | `role="combobox"`, `role="listbox"`, `role="option"` | WCAG 2.1 AA compliance | No ARIA (rejected: fails screen readers) |
| **Keyboard Navigation** | Full keyboard support (Tab, Arrow, Enter, Escape) | Power users, accessibility requirement | Mouse-only (rejected: excludes users) |
| **Focus Management** | Trap focus in dropdown, restore on close | Prevents keyboard users getting lost | No focus trap (rejected: poor UX) |
| **Color Contrast** | 7:1 for text, 4.5:1 for highlights (AAA) | Readable for low vision users | 4.5:1 everywhere (rejected: not AAA) |
| **Screen Reader** | Live regions for result count announcements | Blind users know search completed | Silent (rejected: no feedback) |

**Decision**: WCAG 2.1 AAA where feasible, AA minimum

**ARIA Structure**:
```html
<div role="combobox" aria-expanded="true" aria-owns="results-listbox">
  <input role="searchbox" aria-label="Search documents" />
</div>
<ul id="results-listbox" role="listbox" aria-label="Search results">
  <li role="option" aria-selected="false">...</li>
</ul>
<div aria-live="polite">8 results found</div>
```

---

### 8. Testing Strategy

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|----------|----------------|-----------|------------------------|
| **Unit Tests** | Vitest | Fast, Vue-native, Vite integration | Jest (rejected: slower setup) |
| **Component Tests** | @vue/test-utils | Official Vue testing library | Testing Library (rejected: different philosophy) |
| **E2E Tests** | Playwright | Modern, reliable, cross-browser | Cypress (rejected: fewer browsers), Selenium (rejected: slow) |
| **Coverage Target** | 80% for new code | Pragmatic balance | 100% (rejected: diminishing returns), None (rejected: risky) |
| **CI Integration** | GitHub Actions on PR | Automated, free for OSS | Manual testing (rejected: error-prone) |

**Decision**: Comprehensive testing with pragmatic coverage goals

**Test Pyramid**:
```
     /\
    /  \     E2E (10 tests)
   /____\    - Search flow
  /      \   - Navigation
 /________\  - Mobile UX

/          \ Integration (30 tests)
/__________\ - Component interactions
             - Composable logic

/            \ Unit (60 tests)
/______________\ - SearchResults.vue
                 - useDocumentSearch.js
                 - Result grouping logic
```

---

### 9. Security

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|----------|----------------|-----------|------------------------|
| **XSS Prevention** | Vue auto-escaping + `v-html` only for Meilisearch responses | Meilisearch sanitizes HTML | DOMPurify library (rejected: Meilisearch already safe) |
| **Query Sanitization** | 200 char limit, strip `<>` characters | Prevent injection attacks | No sanitization (rejected: vulnerable) |
| **Row-Level Security** | Existing tenant tokens + org filtering | Already implemented | Client-side filtering only (rejected: data leak) |
| **Rate Limiting** | Debounce (300ms) + server-side rate limit | Prevent abuse | No limit (rejected: DoS vulnerable) |

**Decision**: Leverage existing security model, minimal additional code

---

### 10. Migration & Rollout

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|----------|----------------|-----------|------------------------|
| **Rollout Strategy** | Phased: DocumentView → SearchView → HomeView | Test each integration point | Big bang (rejected: risky), Feature flag (rejected: complexity) |
| **Backward Compatibility** | Keep old components until full rollout | Safe rollback | Delete old code immediately (rejected: no rollback) |
| **Database Migrations** | None needed | No schema changes | Add search history table (rejected: Phase 2 feature) |
| **Deployment** | Standard CI/CD pipeline | No special process | Blue-green deployment (rejected: overkill for this change) |

**Decision**: Low-risk phased rollout with rollback capability

**Timeline**:
```
Week 1: Foundation components (can test in isolation)
Week 2: DocumentView integration (feature works end-to-end)
Week 3: SearchView refactor (remove duplication)
Week 4: HomeView polish + final QA
```

---

## Decision Ownership

| Area | Owner | Reviewer | Status |
|------|-------|----------|--------|
| Component Architecture | Tech Lead | Senior Engineer | ✅ Approved |
| API Design | Backend Lead | Tech Lead | ✅ Approved |
| UX Design | Product Designer | UX Lead | ✅ Approved |
| Performance | Tech Lead | DevOps | ✅ Approved |
| Accessibility | Frontend Lead | Accessibility Specialist | ✅ Approved |
| Testing | QA Lead | Tech Lead | ✅ Approved |

---

## Trade-offs Acknowledged

### 1. No Pinia/Vuex Store
**Trade-off**: Each view has its own search instance
**Benefit**: Simpler code, no global state pollution
**Cost**: Can't share search results between views
**Mitigation**: HTTP cache makes repeat queries fast anyway

### 2. Component-based vs. Renderless
**Trade-off**: `SearchResults.vue` has markup (not renderless)
**Benefit**: Easier to understand, faster to implement
**Cost**: Less flexible for advanced customization
**Mitigation**: Props allow sufficient customization for our needs

### 3. CSS Sticky vs. Fixed
**Trade-off**: Sticky doesn't overlay content
**Benefit**: Smoother scroll behavior, no layout shift
**Cost**: Scrolls out of view on long documents
**Mitigation**: Users rarely scroll far with search open

### 4. Dropdown vs. Modal
**Trade-off**: Dropdown has limited space
**Benefit**: Non-intrusive, keeps context
**Cost**: May truncate results on small screens
**Mitigation**: Full-screen modal on mobile (< 768px)

---

## Success Metrics (KPIs)

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Search response time | 150ms (p90) | < 100ms (p90) | Server logs |
| Time to first result | N/A (no search) | < 400ms | Lighthouse |
| Search success rate | 60% (estimate) | 80% | Analytics |
| Keyboard navigation usage | 0% | 15% | Event tracking |
| Accessibility violations | Unknown | 0 (axe-core) | CI pipeline |
| Bundle size increase | 0 KB | < 50 KB (gzipped) | Webpack stats |
| Test coverage | 0% (new code) | 80% | Vitest report |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Performance degradation** | Low | High | Benchmarks before/after, load testing |
| **Accessibility issues** | Medium | High | Automated testing (axe-core), manual audit |
| **Cross-browser bugs** | Medium | Medium | Playwright tests on Chrome, Firefox, Safari |
| **Mobile UX problems** | Low | Medium | Responsive design from day 1, mobile testing |
| **API breaking changes** | Low | High | Backward compatible API, versioning |
| **Code duplication** | Medium | Low | Shared component library, code review |

**Overall Risk**: **LOW** (well-defined scope, incremental rollout)

---

## Open Questions (Deferred to Phase 2)

1. **Search History**: Store recent searches in localStorage?
   - Decision: Phase 2 feature
   - Reasoning: Nice-to-have, not critical for MVP

2. **Search Suggestions**: Auto-complete while typing?
   - Decision: Phase 2 feature
   - Reasoning: Requires additional Meilisearch config

3. **Advanced Filters**: Filter by document type, date, etc.?
   - Decision: Phase 2 feature
   - Reasoning: SearchView already has basic filters

4. **Search Analytics**: Track queries for insights?
   - Decision: Phase 2 feature
   - Reasoning: Privacy considerations, analytics setup

5. **Offline Search**: IndexedDB for offline mode?
   - Decision: Phase 2 feature (PWA enhancement)
   - Reasoning: Requires service worker, complex sync

---

## Final Recommendation

**APPROVED** for implementation with the following conditions:

1. ✅ **Phased rollout**: Start with DocumentView, validate before continuing
2. ✅ **Test coverage**: 80% minimum for new code
3. ✅ **Performance**: Maintain < 100ms search latency (p90)
4. ✅ **Accessibility**: Zero violations in axe-core audit
5. ✅ **Rollback plan**: Keep old components until full deployment

**Next Steps**:
1. Create GitHub issues for each phase
2. Assign to frontend engineer
3. Schedule design review after Phase 1
4. Schedule QA after Phase 3
5. Deploy to production after Phase 4

---

**Document Version**: 1.0
**Last Updated**: 2025-10-21
**Status**: Ready for Implementation

---

## Appendix: Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | Vue 3 | 3.5.0 | UI components |
| **Composition API** | @vueuse/core | Latest | Utilities (debounce, etc.) |
| **Search Engine** | Meilisearch | 0.41.0 | Full-text search |
| **HTTP Client** | Fetch API | Native | API calls |
| **Router** | Vue Router | 4.4.0 | Navigation |
| **Build Tool** | Vite | 5.0.0 | Bundler |
| **CSS Framework** | Tailwind CSS | 3.4.0 | Styling |
| **PDF Rendering** | PDF.js | 4.0.0 | Document viewer |
| **Testing** | Vitest + Playwright | Latest | Unit + E2E tests |
| **Backend** | Express.js | Latest | API server |
| **Database** | SQLite | Latest | Metadata storage |
