# SearchSuggestions Integration Guide

Quick guide to integrate SearchSuggestions into NaviDocs search functionality.

## Step 1: Import Dependencies

```vue
<script setup>
import SearchSuggestions from './components/SearchSuggestions.vue'
import { useSearchHistory } from './composables/useSearchHistory.js'
import { generateComprehensiveSuggestions } from './utils/searchSuggestions.js'
import { ref, computed } from 'vue'
</script>
```

## Step 2: Setup State

```javascript
// Search state
const searchQuery = ref('')
const searchInput = ref(null)
const showSuggestions = ref(false)

// Document info
const currentDocumentId = ref('doc-123') // Your document ID
const documentContent = ref('...') // Full document text

// Initialize search history
const {
  addToHistory,
  getHistory,
  clearHistory
} = useSearchHistory()
```

## Step 3: Create Computed Properties

```javascript
// Get search history for current document
const searchHistory = computed(() => {
  return getHistory(currentDocumentId.value, 10)
})

// Generate suggestions from document content
const searchSuggestions = computed(() => {
  return generateComprehensiveSuggestions(
    documentContent.value,
    15, // max single terms
    5   // max phrases
  )
})
```

## Step 4: Add Template

```vue
<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        placeholder="Search document..."
        class="w-full px-4 py-3 pl-12 bg-dark-800 rounded-xl"
        @focus="showSuggestions = true"
        @blur="handleBlur"
        @keydown.enter="performSearch"
      />

      <!-- Search icon -->
      <div class="absolute left-4 top-1/2 -translate-y-1/2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <!-- Clear button -->
      <button
        v-if="searchQuery"
        @click="clearSearch"
        class="absolute right-4 top-1/2 -translate-y-1/2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Suggestions Dropdown -->
    <SearchSuggestions
      :history="searchHistory"
      :suggestions="searchSuggestions"
      :visible="showSuggestions && searchQuery.length === 0"
      :document-id="currentDocumentId"
      @select="handleSuggestionSelect"
      @clear-history="handleClearHistory"
    />
  </div>
</template>
```

## Step 5: Implement Handlers

```javascript
// Handle blur with delay for click handling
function handleBlur() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

// Handle suggestion selection
function handleSuggestionSelect(query) {
  searchQuery.value = query
  performSearch()
  searchInput.value?.focus()
}

// Perform search
function performSearch() {
  if (!searchQuery.value.trim()) return

  const query = searchQuery.value.trim()

  // Your search logic here...
  const results = yourSearchFunction(query)

  // Add to history
  addToHistory(
    currentDocumentId.value,
    query,
    results.length
  )

  showSuggestions.value = false
}

// Clear search
function clearSearch() {
  searchQuery.value = ''
  searchInput.value?.focus()
}

// Clear history
function handleClearHistory() {
  clearHistory(currentDocumentId.value)
}
```

## Step 6: Style Integration

The component uses Tailwind CSS with dark theme. Ensure your project has:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        dark: {
          800: '#1a1a2e',
          900: '#16161e',
        }
      }
    }
  }
}
```

## Advanced Features

### Real-Time Filtering

Filter suggestions as user types:

```javascript
import { filterSuggestions } from './utils/searchSuggestions.js'

const filteredSuggestions = computed(() => {
  if (!searchQuery.value) {
    return searchSuggestions.value
  }
  return filterSuggestions(searchSuggestions.value, searchQuery.value)
})

// Use filteredSuggestions instead
<SearchSuggestions :suggestions="filteredSuggestions" />
```

### Show Popular Searches

Display most frequent searches:

```javascript
const { getPopularSearches } = useSearchHistory()

const popularSearches = computed(() => {
  const popular = getPopularSearches(currentDocumentId.value, 5)
  return popular.map(p => `${p.query} (${p.count})`)
})
```

### Regenerate Suggestions

Update suggestions when document changes:

```javascript
import { watch } from 'vue'

watch(documentContent, (newContent) => {
  // Suggestions are automatically recomputed
  console.log('Suggestions updated')
})
```

## Complete Example

See `/home/setup/navidocs/client/src/examples/SearchSuggestionsExample.vue` for a full working example.

## Troubleshooting

### Suggestions not showing
- Check `visible` prop is true
- Ensure `searchQuery.length === 0` condition
- Verify document content is loaded

### History not persisting
- Check localStorage is available
- Verify `documentId` is provided
- Check browser console for errors

### Keyboard navigation not working
- Component must be visible
- Check no other keydown handlers interfering
- Verify event listeners are attached

## Testing Locally

```bash
cd /home/setup/navidocs/client
npm run dev
```

Navigate to the example page to test the component in isolation.

## Files Created

1. `/home/setup/navidocs/client/src/components/SearchSuggestions.vue` (9.2KB)
2. `/home/setup/navidocs/client/src/composables/useSearchHistory.js` (4.9KB)
3. `/home/setup/navidocs/client/src/utils/searchSuggestions.js` (7.1KB)
4. `/home/setup/navidocs/client/src/examples/SearchSuggestionsExample.vue` (7.4KB)
5. `/home/setup/navidocs/client/src/components/SearchSuggestions.md` (Documentation)

## Next Steps

1. Import SearchSuggestions into your main search component
2. Wire up document content and ID
3. Test with real document data
4. Customize styling if needed
5. Add analytics tracking (optional)

## Support

For questions or issues, refer to:
- Component documentation: `SearchSuggestions.md`
- Example implementation: `SearchSuggestionsExample.vue`
- Utility documentation in code comments
