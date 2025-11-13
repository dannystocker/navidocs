# Document Viewer Improvements - Architecture Documentation

**Project**: NaviDocs Search Enhancement
**Version**: 1.0
**Date**: 2025-10-21
**Status**: Design Approved, Ready for Implementation

## Documentation Index

This directory contains the complete technical architecture for the document viewer search improvements.

### 📋 Documents

1. **[ARCHITECTURE_VIEWER_IMPROVEMENTS.md](./ARCHITECTURE_VIEWER_IMPROVEMENTS.md)** (Main Document)
   - Complete technical architecture (15,000 words)
   - Component breakdown and responsibilities
   - API contract specifications
   - State management approach
   - CSS/positioning strategy
   - Performance considerations
   - Migration strategy (4-week plan)
   - **Start here for full context**

2. **[ARCHITECTURE_COMPONENT_DIAGRAM.md](./ARCHITECTURE_COMPONENT_DIAGRAM.md)** (Visual Reference)
   - Component hierarchy diagrams
   - Data flow architecture
   - State management flow
   - CSS layout strategy
   - API request/response flow
   - Event flow diagrams
   - File structure tree
   - **Use for quick visual reference**

3. **[IMPLEMENTATION_QUICK_START.md](./IMPLEMENTATION_QUICK_START.md)** (Developer Guide)
   - Phase-by-phase implementation steps
   - Code samples for each component
   - Testing checklist
   - Deployment steps
   - Common issues & solutions
   - **Start here for implementation**

4. **[TECHNICAL_DECISIONS_SUMMARY.md](./TECHNICAL_DECISIONS_SUMMARY.md)** (Decision Record)
   - Decision matrix for all technical choices
   - Trade-offs acknowledged
   - Risk assessment
   - Success metrics (KPIs)
   - Technology stack
   - **Use for decision justification**

## Quick Links

### For Developers

- **Getting Started**: [IMPLEMENTATION_QUICK_START.md](./IMPLEMENTATION_QUICK_START.md) → Phase 1
- **Component API**: [ARCHITECTURE_VIEWER_IMPROVEMENTS.md](./ARCHITECTURE_VIEWER_IMPROVEMENTS.md) → Section 2
- **Code Examples**: [IMPLEMENTATION_QUICK_START.md](./IMPLEMENTATION_QUICK_START.md) → Phase 1-4
- **Testing**: [IMPLEMENTATION_QUICK_START.md](./IMPLEMENTATION_QUICK_START.md) → Testing Checklist

### For Architects

- **System Design**: [ARCHITECTURE_COMPONENT_DIAGRAM.md](./ARCHITECTURE_COMPONENT_DIAGRAM.md) → Data Flow
- **API Design**: [ARCHITECTURE_VIEWER_IMPROVEMENTS.md](./ARCHITECTURE_VIEWER_IMPROVEMENTS.md) → Section 4
- **Performance**: [ARCHITECTURE_VIEWER_IMPROVEMENTS.md](./ARCHITECTURE_VIEWER_IMPROVEMENTS.md) → Section 8
- **Security**: [TECHNICAL_DECISIONS_SUMMARY.md](./TECHNICAL_DECISIONS_SUMMARY.md) → Section 9

### For Product Managers

- **UX Decision**: [TECHNICAL_DECISIONS_SUMMARY.md](./TECHNICAL_DECISIONS_SUMMARY.md) → Section 5
- **Timeline**: [ARCHITECTURE_VIEWER_IMPROVEMENTS.md](./ARCHITECTURE_VIEWER_IMPROVEMENTS.md) → Section 9
- **Success Metrics**: [TECHNICAL_DECISIONS_SUMMARY.md](./TECHNICAL_DECISIONS_SUMMARY.md) → Success Metrics
- **Risks**: [TECHNICAL_DECISIONS_SUMMARY.md](./TECHNICAL_DECISIONS_SUMMARY.md) → Risk Assessment

### For QA Engineers

- **Test Strategy**: [TECHNICAL_DECISIONS_SUMMARY.md](./TECHNICAL_DECISIONS_SUMMARY.md) → Section 8
- **Test Cases**: [IMPLEMENTATION_QUICK_START.md](./IMPLEMENTATION_QUICK_START.md) → Testing Checklist
- **Accessibility**: [ARCHITECTURE_VIEWER_IMPROVEMENTS.md](./ARCHITECTURE_VIEWER_IMPROVEMENTS.md) → Section 10

## Executive Summary

### What We're Building

**Unified search functionality** for the NaviDocs document viewer that:
1. Shows search results in a **dropdown** (non-intrusive)
2. **Prioritizes current document** results
3. Uses a **shared component library** (DRY principle)
4. Provides **Google-like compact results** format

### Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Component Strategy | Shared `SearchResults.vue` | Reuse across DocumentView, SearchView, HomeView |
| State Management | Composition API composables | No need for Pinia/Vuex, simpler code |
| API Changes | Add `currentDocumentId` param | Backward compatible, single endpoint |
| Positioning | Sticky header + Fixed dropdown | Modern CSS, no JS layout calculations |
| Search UX | Dropdown results | Non-intrusive, keeps reading context |

### Timeline

```
Week 1: Foundation Components
├─ SearchResults.vue
├─ SearchResultCard.vue
├─ SearchDropdown.vue
└─ Composables (useDocumentSearch, useSearchResults)

Week 2: Document Viewer Integration
├─ Add search to sticky header
├─ Integrate dropdown
├─ Update API endpoint
└─ Accessibility audit

Week 3: Search View Refactor
├─ Use shared SearchResults component
├─ Remove duplicate code
└─ Performance benchmarks

Week 4: Home View & Polish
├─ Use SearchInput component
├─ Final QA
└─ Deploy to production
```

### Success Metrics

- ✅ Search response time: < 100ms (p90)
- ✅ First result visible: < 400ms
- ✅ Test coverage: 80%+
- ✅ Accessibility: 0 violations
- ✅ Bundle size increase: < 50 KB

## Architecture at a Glance

### Component Hierarchy

```
DocumentView.vue
├── CompactNavControls.vue (NEW - sticky header with search)
│   └── SearchInput.vue (NEW)
│
└── SearchDropdown.vue (NEW - teleported, fixed position)
    └── SearchResults.vue (NEW - shared component)
        └── SearchResultCard.vue (NEW - individual result)
```

### Data Flow

```
User Types → useDocumentSearch() → POST /api/search
                                         ↓
                              Meilisearch Query (8ms)
                                         ↓
                              Backend adds grouping
                                         ↓
                         prioritizedResults (computed)
                                         ↓
                         SearchResults.vue renders
                                         ↓
                         User clicks result
                                         ↓
                         Navigate to page with highlight
```

### File Structure

```
New Files (10):
├── /client/src/components/search/
│   ├── SearchResults.vue          (~250 lines)
│   ├── SearchResultCard.vue       (~150 lines)
│   ├── SearchDropdown.vue         (~100 lines)
│   └── SearchInput.vue            (~80 lines)
│
├── /client/src/components/navigation/
│   ├── CompactNavControls.vue     (~200 lines)
│   └── NavTooltip.vue             (~50 lines)
│
└── /client/src/composables/
    ├── useDocumentSearch.js       (~120 lines)
    └── useSearchResults.js        (~80 lines)

Modified Files (4):
├── /client/src/views/DocumentView.vue
├── /client/src/views/SearchView.vue
├── /client/src/views/HomeView.vue
└── /server/routes/search.js

Total: ~1,600 lines of code
```

## FAQ

### Why not use a global Pinia store for search?

**Answer**: Search state is ephemeral (doesn't need persistence). Each view can have its own search instance. This simplifies the code and prevents state pollution. HTTP caching makes repeat queries fast anyway.

### Why `position: sticky` instead of `position: fixed` for navigation?

**Answer**: Sticky provides smoother scroll behavior and avoids layout jumps. The nav bar doesn't need to overlay content when the user scrolls down—it can scroll away naturally.

### How do we handle mobile?

**Answer**: The dropdown becomes a full-screen modal on screens < 768px. This provides more space for results and a better touch UX.

### What if the API response is slow?

**Answer**: We show a loading state immediately (< 50ms). The debounced search (300ms) prevents too many requests. Client-side caching (5 min TTL) makes repeat queries instant.

### How do we ensure accessibility?

**Answer**:
- Full keyboard navigation (Tab, Arrow, Enter, Escape)
- ARIA roles (`combobox`, `listbox`, `option`)
- 7:1 color contrast (AAA level)
- Screen reader announcements for result counts
- Focus management (trap in dropdown, restore on close)

### What about offline mode?

**Answer**: Phase 2 feature. Requires IndexedDB and service worker setup. Current implementation assumes online connectivity.

### Can users customize the search UI?

**Answer**: Yes, via props. `SearchResults.vue` accepts `variant`, `groupByDocument`, `maxResults`, etc. Enough flexibility without being a renderless component.

### How do we test this?

**Answer**:
- **Unit tests** (Vitest): Component logic, composables
- **Integration tests**: Component interactions
- **E2E tests** (Playwright): Full search flow, cross-browser
- **Accessibility tests**: axe-core automated audit
- **Performance tests**: Lighthouse benchmarks

Target: 80% coverage for new code.

## Next Steps

1. **Review Architecture**
   - [ ] Technical Lead reviews [ARCHITECTURE_VIEWER_IMPROVEMENTS.md](./ARCHITECTURE_VIEWER_IMPROVEMENTS.md)
   - [ ] Backend Lead reviews API changes (Section 4)
   - [ ] Designer reviews UX decisions (Section 7)

2. **Create Issues**
   - [ ] GitHub issue for Phase 1 (Foundation Components)
   - [ ] GitHub issue for Phase 2 (DocumentView Integration)
   - [ ] GitHub issue for Phase 3 (SearchView Refactor)
   - [ ] GitHub issue for Phase 4 (HomeView & Polish)

3. **Assign Work**
   - [ ] Assign to frontend engineer
   - [ ] Set up project board
   - [ ] Schedule weekly check-ins

4. **Begin Implementation**
   - [ ] Start with [IMPLEMENTATION_QUICK_START.md](./IMPLEMENTATION_QUICK_START.md) Phase 1
   - [ ] Create feature branch: `feature/search-improvements`
   - [ ] Commit frequently with conventional commits

## Support & Contact

- **Technical Questions**: Refer to [ARCHITECTURE_VIEWER_IMPROVEMENTS.md](./ARCHITECTURE_VIEWER_IMPROVEMENTS.md)
- **Implementation Help**: Refer to [IMPLEMENTATION_QUICK_START.md](./IMPLEMENTATION_QUICK_START.md)
- **Decision Rationale**: Refer to [TECHNICAL_DECISIONS_SUMMARY.md](./TECHNICAL_DECISIONS_SUMMARY.md)

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-21  
**Status**: Ready for Implementation  
**Estimated Effort**: 4 weeks (1 full-time developer)
