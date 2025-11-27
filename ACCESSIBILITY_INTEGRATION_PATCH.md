# Accessibility Integration Patch Guide

This document shows the exact changes needed to integrate accessibility features into NaviDocs components.

## 1. Import Accessibility CSS in main.js

```javascript
// /client/src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import './assets/accessibility.css' // ← ADD THIS LINE

createApp(App)
  .use(router)
  .mount('#app')
```

## 2. Add Skip Links to App.vue

```vue
<!-- /client/src/App.vue -->
<template>
  <div id="app">
    <!-- ADD: Skip Links -->
    <SkipLinks />

    <!-- Existing content -->
    <router-view />
  </div>
</template>

<script setup>
import SkipLinks from './components/SkipLinks.vue' // ← ADD THIS IMPORT
</script>
```

## 3. Enhance SearchView.vue with ARIA

### Search Input Changes

**BEFORE:**
```vue
<input
  v-model="searchQuery"
  @input="performSearch"
  type="text"
  class="w-full h-12 px-5 pr-14 rounded-xl..."
  placeholder="Search..."
  autofocus
/>
```

**AFTER:**
```vue
<input
  id="search-input"
  v-model="searchQuery"
  @input="performSearch"
  type="text"
  role="searchbox"
  aria-label="Search across all documents"
  aria-describedby="search-instructions"
  :aria-expanded="results.length > 0"
  :aria-controls="results.length > 0 ? 'search-results-region' : null"
  class="w-full h-12 px-5 pr-14 rounded-xl..."
  placeholder="Search..."
  autofocus
/>

<!-- ADD: Hidden instructions for screen readers -->
<div id="search-instructions" class="sr-only">
  Type to search across all documents. Use arrow keys to navigate results.
  Press Enter to open a result.
</div>
```

### Results Section Changes

**BEFORE:**
```vue
<div v-if="results.length > 0" class="space-y-2">
  <template v-for="(result, index) in results" :key="result.id">
    <article
      class="nv-card group cursor-pointer"
      @click="viewDocument(result)"
      tabindex="0"
      @keypress.enter="viewDocument(result)"
      @keypress.space.prevent="viewDocument(result)"
    >
```

**AFTER:**
```vue
<div
  v-if="results.length > 0"
  id="search-results-region"
  role="region"
  aria-label="Search results"
  aria-live="polite"
  aria-atomic="false"
  class="space-y-2"
>
  <!-- ADD: Results count announcement for screen readers -->
  <div class="sr-only" aria-live="polite" aria-atomic="true">
    Found {{ results.length }} results for "{{ searchQuery }}"
  </div>

  <template v-for="(result, index) in results" :key="result.id">
    <article
      role="article"
      :aria-label="`Result ${index + 1}: ${result.title}, page ${result.pageNumber}`"
      :aria-posinset="index + 1"
      :aria-setsize="results.length"
      class="nv-card group cursor-pointer"
      @click="viewDocument(result)"
      tabindex="0"
      @keypress.enter="viewDocument(result)"
      @keypress.space.prevent="viewDocument(result)"
    >
```

### Action Buttons Changes

**BEFORE:**
```vue
<button
  v-if="result.imageUrl"
  class="nv-chip"
  @click.stop="togglePreview(result.id)"
>
  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    ...
  </svg>
  View Details
</button>
```

**AFTER:**
```vue
<button
  v-if="result.imageUrl"
  class="nv-chip"
  @click.stop="togglePreview(result.id)"
  aria-label="View diagram preview"
  :aria-expanded="activePreview === result.id"
>
  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    ...
  </svg>
  View Details
</button>
```

## 4. Enhance DocumentView.vue with ARIA

### Search Input in Header

**BEFORE:**
```vue
<input
  ref="searchInputRef"
  v-model="searchInput"
  @keydown.enter="performSearch"
  type="text"
  class="w-full px-6 pr-28 rounded-2xl..."
  placeholder="Search in document... (Cmd/Ctrl+F)"
/>
```

**AFTER:**
```vue
<label for="doc-search-input" class="sr-only">Search in current document</label>
<input
  id="doc-search-input"
  ref="searchInputRef"
  v-model="searchInput"
  @keydown.enter="performSearch"
  type="text"
  role="searchbox"
  aria-label="Search within this document"
  aria-describedby="doc-search-instructions"
  :aria-expanded="searchQuery ? 'true' : 'false'"
  :aria-controls="searchQuery ? 'search-navigation' : null"
  class="w-full px-6 pr-28 rounded-2xl..."
  placeholder="Search in document... (Cmd/Ctrl+F)"
/>

<!-- ADD: Hidden instructions -->
<div id="doc-search-instructions" class="sr-only">
  Search within the current document. Press Enter to search.
  Use Ctrl+F or Cmd+F to focus this field.
  Navigate results with arrow keys or navigation buttons.
</div>
```

### Search Navigation Controls

**BEFORE:**
```vue
<div v-if="searchQuery && isHeaderCollapsed" class="flex items-center gap-2 shrink-0">
  <div class="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-lg">
    <span class="text-white/70 text-xs">
      {{ totalHits === 0 ? '0' : `${currentHitIndex + 1}/${totalHits}` }}
    </span>
```

**AFTER:**
```vue
<div
  v-if="searchQuery && isHeaderCollapsed"
  id="search-navigation"
  class="flex items-center gap-2 shrink-0"
  role="navigation"
  aria-label="Search result navigation"
>
  <div class="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-lg">
    <span
      class="text-white/70 text-xs"
      role="status"
      aria-live="polite"
      :aria-label="`Match ${currentHitIndex + 1} of ${totalHits}`"
    >
      {{ totalHits === 0 ? '0' : `${currentHitIndex + 1}/${totalHits}` }}
    </span>
```

### Navigation Buttons

**BEFORE:**
```vue
<button
  @click="prevHit"
  :disabled="totalHits === 0"
  class="px-2 py-1 bg-white/10..."
>
  ↑
</button>
```

**AFTER:**
```vue
<button
  @click="prevHit"
  :disabled="totalHits === 0"
  class="px-2 py-1 bg-white/10..."
  aria-label="Previous match (Shift+Enter)"
  :aria-disabled="totalHits === 0"
>
  ↑
</button>
```

## 5. Enhance CompactNav.vue with ARIA

**BEFORE:**
```vue
<div class="compact-nav">
  <button
    @click="$emit('prev')"
    :disabled="currentPage <=1 || disabled"
    class="nav-btn"
    title="Previous Page"
  >
```

**AFTER:**
```vue
<nav class="compact-nav" role="navigation" aria-label="Document page navigation">
  <button
    @click="$emit('prev')"
    :disabled="currentPage <=1 || disabled"
    class="nav-btn"
    aria-label="Go to previous page"
    :aria-disabled="currentPage <= 1 || disabled"
  >
```

### Page Input

**BEFORE:**
```vue
<input
  v-model.number="pageInput"
  @keypress.enter="goToPage"
  type="number"
  min="1"
  :max="totalPages"
  class="page-input"
  aria-label="Page number"
/>
```

**AFTER:**
```vue
<label for="page-number-input" class="sr-only">Current page number</label>
<input
  id="page-number-input"
  v-model.number="pageInput"
  @keypress.enter="goToPage"
  type="number"
  min="1"
  :max="totalPages"
  class="page-input"
  aria-label="Page number"
  :aria-valuemin="1"
  :aria-valuemax="totalPages"
  :aria-valuenow="currentPage"
  :aria-valuetext="`Page ${currentPage} of ${totalPages}`"
/>
```

## 6. Enhance SearchResultsSidebar.vue with ARIA

**BEFORE:**
```vue
<div
  class="search-sidebar"
  :class="{ 'visible': visible }"
>
  <div class="search-header">
    <div class="flex items-center gap-2">
      <h3>Search Results</h3>
```

**AFTER:**
```vue
<div
  class="search-sidebar"
  :class="{ 'visible': visible }"
  role="complementary"
  aria-label="In-document search results"
>
  <div class="search-header">
    <div class="flex items-center gap-2">
      <h3 id="sidebar-heading">Search Results</h3>
```

### Results List

**BEFORE:**
```vue
<div v-else class="results-list">
  <div
    v-for="(result, index) in results"
    :key="index"
    class="result-item"
    @click="handleResultClick(index)"
  >
```

**AFTER:**
```vue
<div v-else class="results-list" role="list" aria-labelledby="sidebar-heading">
  <div
    v-for="(result, index) in results"
    :key="index"
    role="listitem"
    :aria-label="`Result ${index + 1} of ${results.length}: Page ${result.page}`"
    :aria-current="index === currentIndex ? 'true' : 'false'"
    class="result-item"
    @click="handleResultClick(index)"
    tabindex="0"
    @keypress.enter="handleResultClick(index)"
    @keypress.space.prevent="handleResultClick(index)"
  >
```

## 7. Enhance SearchSuggestions.vue with ARIA

**BEFORE:**
```vue
<div
  v-if="visible && (filteredHistory.length > 0 || filteredSuggestions.length > 0)"
  class="absolute top-full left-0 right-0 mt-2..."
>
```

**AFTER:**
```vue
<div
  v-if="visible && (filteredHistory.length > 0 || filteredSuggestions.length > 0)"
  role="listbox"
  aria-label="Search suggestions and history"
  aria-describedby="suggestions-instructions"
  class="absolute top-full left-0 right-0 mt-2..."
>
  <!-- ADD: Hidden instructions -->
  <div id="suggestions-instructions" class="sr-only">
    Use arrow keys to navigate, Enter to select, Escape to close
  </div>
```

### Suggestion Buttons

**BEFORE:**
```vue
<button
  @click="onSelect(item.query)"
  class="w-full px-4 py-2.5..."
>
  <span>{{ item.query }}</span>
</button>
```

**AFTER:**
```vue
<button
  role="option"
  :aria-selected="selectedIndex === index"
  :aria-label="`${item.query}, ${item.resultsCount} results, ${formatTimestamp(item.timestamp)}`"
  @click="onSelect(item.query)"
  class="w-full px-4 py-2.5..."
>
  <span>{{ item.query }}</span>
</button>
```

## 8. Add Keyboard Shortcut Integration

### Example: DocumentView.vue

```vue
<script setup>
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'

// ... existing code ...

// Add keyboard shortcuts
useKeyboardShortcuts({
  focusSearch: () => {
    searchInputRef.value?.focus()
  },
  nextResult: () => {
    if (searchQuery.value) nextHit()
  },
  prevResult: () => {
    if (searchQuery.value) prevHit()
  },
  closeSearch: () => {
    clearSearch()
  },
  nextPage: () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  },
  prevPage: () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }
})
</script>
```

## Testing Checklist

After applying these changes, test:

1. **Keyboard Navigation**
   - [ ] Tab through all interactive elements
   - [ ] All focus indicators visible
   - [ ] Ctrl/Cmd+F focuses search
   - [ ] Enter/Shift+Enter navigate results
   - [ ] Escape clears/closes search

2. **Screen Reader**
   - [ ] Search input announces correctly
   - [ ] Results count announced
   - [ ] Result items have descriptive labels
   - [ ] Buttons have clear labels
   - [ ] Live regions announce updates

3. **Visual**
   - [ ] Focus indicators visible and high-contrast
   - [ ] Skip links appear on Tab
   - [ ] All text meets 4.5:1 contrast ratio
   - [ ] Touch targets ≥44×44px on mobile

4. **Reduced Motion**
   - [ ] Animations respect prefers-reduced-motion
   - [ ] Essential transitions still work

## Automated Testing

```bash
# Install axe-core
npm install --save-dev @axe-core/cli

# Run accessibility audit
npx axe http://localhost:5173 --show-origins

# Run Lighthouse
npx lighthouse http://localhost:5173 --only-categories=accessibility
```

## Deployment

1. Commit changes:
   ```bash
   git add .
   git commit -m "Add comprehensive accessibility improvements (WCAG 2.1 AA)"
   ```

2. Test on staging environment

3. Deploy to production

---

*End of Accessibility Integration Patch*
