# NaviDocs Single-Tenant Feature Roadmap

**Version:** 1.0 → 2.0
**Target:** Complete single-tenant boat manual management system
**Approach:** Incremental implementation with backward compatibility

---

## 🎯 Vision

Transform NaviDocs from a demo into a production-ready single-tenant system with complete document lifecycle management, advanced search, and user preferences.

---

## 📋 Feature Categories

### 1. Document Management ⭐ (Priority 1)
- [x] Upload with OCR
- [x] View with text selection
- [x] Auto-fill metadata
- [ ] **Delete documents** (with confirmation)
- [ ] **Edit metadata** (inline or modal)
- [ ] **Bulk operations** (select multiple, bulk delete)
- [ ] **Document versions** (track changes)
- [ ] **Download original PDF**

### 2. Advanced Search 🔍 (Priority 1)
- [x] Full-text search
- [x] Diagram thumbnails
- [ ] **Filter by boat** (dropdown)
- [ ] **Filter by document type** (manual, service, warranty)
- [ ] **Filter by date range** (uploaded date)
- [ ] **Sort options** (relevance, date, title)
- [ ] **Search within document**
- [ ] **Recent searches** (last 10)
- [ ] **Search suggestions** (autocomplete)
- [ ] **Export search results** (PDF/CSV)

### 3. User Experience 🎨 (Priority 2)
- [x] Toast notifications
- [x] Responsive design
- [x] Dark theme
- [ ] **Keyboard shortcuts** (/, Ctrl+K for search, etc.)
- [ ] **Bookmarks** (save specific pages)
- [ ] **Reading progress** (remember last page)
- [ ] **Print-friendly view**
- [ ] **Fullscreen mode**
- [ ] **Night mode toggle** (darker theme)

### 4. Dashboard & Analytics 📊 (Priority 2)
- [ ] **Statistics dashboard**
  - Total documents
  - Total pages
  - Storage used
  - Most searched terms
  - Recent activity
- [ ] **Document health**
  - OCR status
  - Missing metadata
  - Indexing status
- [ ] **Usage charts**
  - Searches over time
  - Documents added over time

### 5. Settings & Preferences ⚙️ (Priority 1)
- [ ] **Organization settings**
  - Organization name
  - Default boat name
  - Logo upload
- [ ] **User preferences**
  - Theme (dark/light)
  - Default search filters
  - Items per page
  - Language
- [ ] **Storage management**
  - View storage usage
  - Cleanup old files
  - Export all data

### 6. Help & Onboarding 💡 (Priority 3)
- [ ] **Interactive tour** (first visit)
- [ ] **Keyboard shortcuts guide**
- [ ] **Search tips**
- [ ] **Feature highlights**
- [ ] **FAQ section**

### 7. Data Management 💾 (Priority 2)
- [ ] **Export all documents** (ZIP)
- [ ] **Import from backup**
- [ ] **Activity log** (audit trail)
- [ ] **Database maintenance** (vacuum, optimize)

### 8. Polish & Performance ⚡ (Priority 3)
- [x] Comprehensive logging
- [x] Error handling
- [ ] **Image lazy loading**
- [ ] **PDF page caching**
- [ ] **Search result caching**
- [ ] **Compression for images**
- [ ] **Background job queue**

---

## 🗓️ Implementation Plan

### Phase 1: Core Management (Day 1)
**Goal:** Complete document lifecycle management

1. **Document Deletion**
   - Add delete button to document cards
   - Confirmation modal
   - Backend endpoint
   - Cleanup files, DB, and search index
   - Toast notification on success

2. **Metadata Editing**
   - Edit modal/form
   - Update boat info, title, type
   - Re-index search after update
   - Optimistic UI updates

3. **Download Original PDF**
   - Download button in document viewer
   - Proper filename

### Phase 2: Advanced Search (Day 1-2)
**Goal:** Make search powerful and flexible

1. **Search Filters**
   - Boat filter (dropdown with all boats)
   - Document type filter
   - Date range filter
   - Apply filters to search query

2. **Search Enhancements**
   - Sort by relevance/date/title
   - Recent searches (localStorage)
   - Search within current document

3. **Search Export**
   - Export results as PDF
   - Export as CSV

### Phase 3: Dashboard (Day 2)
**Goal:** Provide system overview and insights

1. **Statistics Dashboard**
   - Total documents, pages, storage
   - Recent uploads
   - Popular searches
   - Quick actions

2. **Document Health**
   - Show processing status
   - Identify issues
   - Quick fixes

### Phase 4: Settings & Preferences (Day 2-3)
**Goal:** Customizable experience

1. **Settings Page**
   - Organization info
   - User preferences
   - Storage management
   - Database maintenance

2. **Theme Toggle**
   - Dark/light mode
   - Persistent preference

### Phase 5: UX Enhancements (Day 3)
**Goal:** Make it delightful to use

1. **Keyboard Shortcuts**
   - / or Ctrl+K for search
   - Arrow keys for navigation
   - Escape to close modals
   - Shortcuts help modal

2. **Bookmarks**
   - Save favorite pages
   - Quick access
   - Manage bookmarks

3. **Reading Progress**
   - Remember last page per document
   - Resume reading

### Phase 6: Polish & Testing (Day 3)
**Goal:** Production-ready quality

1. **Performance Optimization**
   - Image lazy loading
   - Caching strategies
   - Compression

2. **Testing**
   - E2E tests for new features
   - Load testing
   - Edge case handling

3. **Documentation**
   - Update guides
   - Feature screenshots
   - API documentation

---

## 🎨 UI/UX Considerations

### Design Principles
1. **Consistent:** Follow existing pink/purple dark theme
2. **Intuitive:** Common patterns (3-dot menus, icon buttons)
3. **Responsive:** All features work on mobile
4. **Accessible:** Keyboard navigation, ARIA labels
5. **Fast:** Optimistic updates, caching

### Component Additions
- `ConfirmDialog.vue` - Reusable confirmation modal
- `EditDocumentModal.vue` - Edit document metadata
- `SearchFilters.vue` - Advanced search filter panel
- `StatsCard.vue` - Dashboard statistics cards
- `SettingsPanel.vue` - Settings sections
- `KeyboardShortcuts.vue` - Shortcuts help modal
- `BookmarksList.vue` - Bookmarks sidebar

### New Routes
```javascript
/                    # Home (existing)
/search              # Search (existing)
/document/:id        # Document viewer (existing)
/dashboard           # New: Statistics dashboard
/settings            # New: Settings page
/bookmarks           # New: Bookmarks list
```

---

## 🔧 Backend Changes

### New Endpoints
```javascript
DELETE /api/documents/:id           # Delete document
PATCH  /api/documents/:id           # Update metadata
GET    /api/documents/:id/download  # Download PDF
GET    /api/stats                   # Get statistics
GET    /api/search/history          # Recent searches
POST   /api/bookmarks               # Add bookmark
GET    /api/bookmarks               # List bookmarks
DELETE /api/bookmarks/:id           # Remove bookmark
GET    /api/settings                # Get settings
PATCH  /api/settings                # Update settings
POST   /api/export                  # Export all data
```

### Database Schema Additions
```sql
-- Bookmarks
CREATE TABLE bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  documentId TEXT NOT NULL,
  pageNumber INTEGER NOT NULL,
  note TEXT,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY(documentId) REFERENCES documents(id) ON DELETE CASCADE
);

-- Settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- Activity Log
CREATE TABLE activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  entity TEXT,
  entityId TEXT,
  details TEXT,
  createdAt INTEGER NOT NULL
);
```

---

## ⚠️ Breaking Changes Prevention

### Backward Compatibility Strategy
1. **Add, don't replace:** New endpoints alongside existing
2. **Optional features:** All new features are additive
3. **Database migrations:** Careful schema updates
4. **API versioning:** Consider /api/v1 prefix for future
5. **Feature flags:** Toggle new features on/off

### Testing Strategy
1. **Existing tests must pass:** All 8 E2E tests
2. **New tests for new features:** Add to test suite
3. **Regression testing:** Verify old features still work
4. **Manual testing:** Complete user flow tests

---

## 📊 Success Metrics

### Completion Criteria
- [ ] All priority 1 features implemented
- [ ] 15+ E2E tests passing
- [ ] < 100ms response time for all endpoints
- [ ] Zero console errors
- [ ] Mobile responsive verified
- [ ] Complete documentation updated
- [ ] Demo-ready with showcase

### Quality Gates
1. **Code Quality:** ESLint passing, no warnings
2. **Performance:** Lighthouse score >90
3. **Tests:** >80% feature coverage
4. **Documentation:** All new features documented
5. **UX:** User testing with 3+ scenarios

---

## 🚀 Deployment Checklist

- [ ] Run all tests
- [ ] Update environment variables
- [ ] Database migrations applied
- [ ] Backup existing data
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation updated
- [ ] Stakeholder demo

---

**Next Steps:** Begin Phase 1 implementation
**Timeline:** 3-day sprint for complete feature set
**Goal:** Production-ready single-tenant system with all features

Let's build something amazing! 🚢✨
