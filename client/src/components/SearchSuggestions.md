# SearchSuggestions Component

Apple Preview-style search suggestions dropdown with search history and auto-suggestions.

## Overview

The SearchSuggestions component provides an intelligent search assistance interface that displays:
- Recent search history (last 10 searches)
- Auto-generated suggested terms from document content
- Keyboard navigation support
- localStorage persistence

## Features

- **Search History**: Tracks recent searches with timestamps and result counts
- **Smart Suggestions**: Analyzes document content to suggest relevant search terms
- **Keyboard Navigation**: Arrow keys to navigate, Enter to select, Esc to close
- **localStorage Persistence**: Stores search history per document
- **Clear History**: Button to clear search history
- **Responsive Design**: Adapts to different screen sizes
- **Visual Feedback**: Highlights selected items, shows keyboard shortcuts

## Usage

### Basic Usage

```vue
<template>
  <div class="relative">
    <input
      v-model="searchQuery"
      @focus="showSuggestions = true"
      @blur="hideSuggestions"
      placeholder="Search..."
    />

    <SearchSuggestions
      :history="searchHistory"
      :suggestions="suggestedTerms"
      :visible="showSuggestions"
      :document-id="currentDocumentId"
      @select="handleSearch"
      @clear-history="clearHistory"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SearchSuggestions from './SearchSuggestions.vue'
import { useSearchHistory } from '../composables/useSearchHistory.js'
import { generateComprehensiveSuggestions } from '../utils/searchSuggestions.js'

const searchQuery = ref('')
const showSuggestions = ref(false)
const currentDocumentId = ref('doc-123')
const documentContent = ref('...')

const { getHistory, addToHistory, clearHistory } = useSearchHistory()

const searchHistory = computed(() =>
  getHistory(currentDocumentId.value, 10)
)

const suggestedTerms = computed(() =>
  generateComprehensiveSuggestions(documentContent.value)
)

function handleSearch(query) {
  searchQuery.value = query
  performSearch(query)
  showSuggestions.value = false
}

function performSearch(query) {
  // Perform search...
  const resultsCount = 42 // Example

  // Add to history
  addToHistory(currentDocumentId.value, query, resultsCount)
}
</script>
```

### With Search Box Integration

```vue
<template>
  <div class="relative">
    <div class="relative">
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        placeholder="Search document..."
        class="w-full px-4 py-3 pl-12 bg-dark-800 rounded-xl"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.enter="performSearch"
      />

      <div class="absolute left-4 top-1/2 -translate-y-1/2">
        <!-- Search icon -->
      </div>

      <button v-if="searchQuery" @click="clearSearch">
        <!-- Clear icon -->
      </button>
    </div>

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

<script setup>
const showSuggestions = ref(false)

function handleFocus() {
  showSuggestions.value = true
}

function handleBlur() {
  // Delay to allow click on suggestion
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

function handleSuggestionSelect(query) {
  searchQuery.value = query
  performSearch()
  searchInput.value?.focus()
}
</script>
```

## Props

### `history`
- **Type**: `Array`
- **Default**: `[]`
- **Required**: No
- **Description**: Array of recent search history items

**Item Structure**:
```javascript
{
  query: string,        // Search query
  timestamp: number,    // Unix timestamp
  resultsCount: number  // Number of results
}
```

### `suggestions`
- **Type**: `Array`
- **Default**: `[]`
- **Required**: No
- **Description**: Array of suggested search terms (strings)

### `visible`
- **Type**: `Boolean`
- **Default**: `false`
- **Required**: No
- **Description**: Controls dropdown visibility

### `documentId`
- **Type**: `String`
- **Default**: `null`
- **Required**: No
- **Description**: Current document identifier (for history tracking)

### `maxHistory`
- **Type**: `Number`
- **Default**: `10`
- **Required**: No
- **Description**: Maximum number of history items to display

### `maxSuggestions`
- **Type**: `Number`
- **Default**: `8`
- **Required**: No
- **Description**: Maximum number of suggestions to display

## Events

### `@select`
- **Payload**: `string` - Selected search query
- **Description**: Emitted when user selects a suggestion or history item

```vue
<SearchSuggestions @select="handleSelect" />

function handleSelect(query) {
  console.log('Selected:', query)
  performSearch(query)
}
```

### `@clear-history`
- **Payload**: None
- **Description**: Emitted when user clicks "Clear" button for search history

```vue
<SearchSuggestions @clear-history="handleClearHistory" />

function handleClearHistory() {
  clearHistory(currentDocumentId.value)
}
```

## Keyboard Navigation

The component automatically handles keyboard navigation:

- **Arrow Down**: Move selection down
- **Arrow Up**: Move selection up
- **Enter**: Select current item
- **Escape**: Close dropdown (handled by parent)

Navigation wraps around (pressing down on last item goes to first).

## localStorage Schema

Search history is stored per document in localStorage:

```javascript
// Key: 'navidocs_search_history'
{
  "doc-123": [
    {
      "query": "navigation",
      "timestamp": 1699564800000,
      "resultsCount": 15
    },
    {
      "query": "engine maintenance",
      "timestamp": 1699564700000,
      "resultsCount": 8
    }
  ],
  "doc-456": [...]
}
```

## Composable: useSearchHistory

Manages search history in localStorage.

### Methods

#### `addToHistory(documentId, query, resultsCount)`
Add a search query to history.

```javascript
addToHistory('doc-123', 'navigation', 15)
```

#### `getHistory(documentId, limit)`
Get search history for a document.

```javascript
const history = getHistory('doc-123', 10)
```

#### `clearHistory(documentId)`
Clear history for a specific document.

```javascript
clearHistory('doc-123')
```

#### `clearAllHistory()`
Clear all search history.

```javascript
clearAllHistory()
```

#### `getRecentSearches(limit)`
Get recent searches across all documents.

```javascript
const recent = getRecentSearches(20)
```

#### `getPopularSearches(documentId, limit)`
Get popular searches by frequency.

```javascript
const popular = getPopularSearches('doc-123', 5)
// Returns: [{ query: 'navigation', count: 5 }, ...]
```

### Computed Properties

#### `totalSearches`
Total number of searches across all documents.

```javascript
const { totalSearches } = useSearchHistory()
console.log(totalSearches.value) // 127
```

## Utility: searchSuggestions

Analyzes document text to generate intelligent search suggestions.

### Functions

#### `generateSearchSuggestions(text, limit)`
Generate single-term suggestions from document text.

```javascript
import { generateSearchSuggestions } from '../utils/searchSuggestions.js'

const suggestions = generateSearchSuggestions(documentText, 20)
// Returns: ['navigation', 'engine', 'maintenance', 'safety', ...]
```

**Algorithm**:
- Extracts words from text
- Filters stop words and short words
- Calculates frequency
- Scores based on:
  - Frequency
  - Technical terms (contains numbers/hyphens)
  - Proper nouns (capitalized)
  - Word length (longer = more specific)
- Returns top-scored terms

#### `generatePhraseSuggestions(text, limit)`
Generate 2-3 word phrase suggestions.

```javascript
const phrases = generatePhraseSuggestions(documentText, 10)
// Returns: ['engine maintenance', 'safety procedures', 'navigation system', ...]
```

#### `generateComprehensiveSuggestions(text, termLimit, phraseLimit)`
Combine terms and phrases for comprehensive suggestions.

```javascript
const suggestions = generateComprehensiveSuggestions(documentText, 15, 5)
// Returns mix of phrases and terms
```

#### `filterSuggestions(suggestions, query)`
Filter suggestions based on current query.

```javascript
const filtered = filterSuggestions(allSuggestions, 'nav')
// Returns suggestions containing 'nav'
```

## Styling

The component uses Tailwind CSS with a dark theme matching NaviDocs design:

- **Background**: Dark gray with transparency
- **Borders**: Subtle white borders with low opacity
- **Hover States**: Gradient backgrounds for selection
- **Typography**: Clean, readable fonts with proper hierarchy
- **Icons**: Heroicons outline style
- **Transitions**: Smooth animations for dropdown and hover

### Custom Scrollbar

```css
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
```

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Proper focus handling for dropdown
- **ARIA Labels**: Could be enhanced with aria-* attributes
- **Screen Readers**: Visual hints also described in text

## Performance Considerations

1. **Debouncing**: Consider debouncing input for real-time suggestions
2. **Memoization**: Suggestions are computed properties (cached)
3. **localStorage**: Limits history to 50 items per document
4. **Rendering**: TransitionGroup for smooth animations

## Integration Examples

### With Real-Time Filtering

```vue
<script setup>
import { filterSuggestions } from '../utils/searchSuggestions.js'

const filteredSuggestions = computed(() => {
  return filterSuggestions(allSuggestions.value, searchQuery.value)
})
</script>

<SearchSuggestions
  :suggestions="filteredSuggestions"
  :visible="showSuggestions"
/>
```

### With Popular Searches

```vue
<script setup>
const { getPopularSearches } = useSearchHistory()

const popularTerms = computed(() => {
  const popular = getPopularSearches(currentDocumentId.value, 5)
  return popular.map(p => p.query)
})
</script>

<SearchSuggestions
  :suggestions="popularTerms"
  :history="searchHistory"
/>
```

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest)
- **localStorage**: Required (fallback to memory if unavailable)
- **CSS**: Supports CSS Grid, Flexbox, Transitions
- **JavaScript**: ES6+ features (Vue 3 Composition API)

## Testing

### Unit Tests

```javascript
import { describe, it, expect } from 'vitest'
import { generateSearchSuggestions } from '../utils/searchSuggestions.js'

describe('searchSuggestions', () => {
  it('generates suggestions from text', () => {
    const text = 'navigation system engine maintenance safety'
    const suggestions = generateSearchSuggestions(text, 3)

    expect(suggestions.length).toBeLessThanOrEqual(3)
    expect(suggestions).toContain('navigation')
  })

  it('filters stop words', () => {
    const text = 'the engine and the navigation'
    const suggestions = generateSearchSuggestions(text, 10)

    expect(suggestions).not.toContain('the')
    expect(suggestions).not.toContain('and')
  })
})
```

### Integration Tests

```javascript
import { mount } from '@vue/test-utils'
import SearchSuggestions from './SearchSuggestions.vue'

describe('SearchSuggestions', () => {
  it('renders history items', () => {
    const wrapper = mount(SearchSuggestions, {
      props: {
        history: [
          { query: 'test', timestamp: Date.now(), resultsCount: 5 }
        ],
        visible: true
      }
    })

    expect(wrapper.text()).toContain('test')
    expect(wrapper.text()).toContain('5 results')
  })

  it('emits select event', async () => {
    const wrapper = mount(SearchSuggestions, {
      props: {
        suggestions: ['navigation'],
        visible: true
      }
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0]).toEqual(['navigation'])
  })
})
```

## Future Enhancements

1. **Fuzzy Matching**: Typo-tolerant search suggestions
2. **Contextual Suggestions**: Suggest based on current page/section
3. **Search Analytics**: Track popular searches across users
4. **Auto-complete**: Real-time completion as user types
5. **Categories**: Group suggestions by type (technical, safety, etc.)
6. **Synonyms**: Suggest related terms
7. **ARIA Support**: Enhanced accessibility attributes
8. **Search Shortcuts**: Quick actions for common searches

## Related Components

- **SearchBox**: Main search input component
- **SearchResults**: Display search results
- **ToastContainer**: Show search notifications
- **ConfirmDialog**: Confirm clearing history

## File Locations

- **Component**: `/home/setup/navidocs/client/src/components/SearchSuggestions.vue`
- **Composable**: `/home/setup/navidocs/client/src/composables/useSearchHistory.js`
- **Utility**: `/home/setup/navidocs/client/src/utils/searchSuggestions.js`
- **Example**: `/home/setup/navidocs/client/src/examples/SearchSuggestionsExample.vue`
- **Documentation**: `/home/setup/navidocs/client/src/components/SearchSuggestions.md`
