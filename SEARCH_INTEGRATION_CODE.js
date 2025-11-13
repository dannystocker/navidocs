/**
 * NaviDocs Search Integration - Complete Code Snippets
 * Agent 10 Final Delivery
 *
 * This file contains all code snippets needed to complete the
 * Apple Preview-style search integration in DocumentView.vue
 */

// ============================================================================
// SECTION 1: IMPORTS (Add to line ~315-320)
// ============================================================================

import SearchResultsSidebar from '../components/SearchResultsSidebar.vue'
import SearchSuggestions from '../components/SearchSuggestions.vue'

// ============================================================================
// SECTION 2: STATE VARIABLES (Add to line ~350-355)
// ============================================================================

// Search suggestions state
const showSearchSuggestions = ref(false)
const searchHistory = ref([])
const searchSuggestions = ref([
  'engine', 'electrical', 'plumbing', 'safety', 'maintenance',
  'fuel', 'navigation', 'bilge', 'hull', 'propeller'
])
const searchInputRef = ref(null) // Reference to search input element

// ============================================================================
// SECTION 3: EVENT HANDLERS (Add to line ~760, after clearSearch())
// ============================================================================

// Handle search suggestion selection
function handleSuggestionSelect(query) {
  searchInput.value = query
  showSearchSuggestions.value = false
  performSearch()

  // Add to search history
  addToSearchHistory(query)
}

// Hide search suggestions with delay to allow click events
function hideSearchSuggestions() {
  setTimeout(() => {
    showSearchSuggestions.value = false
  }, 200)
}

// Add search to history
function addToSearchHistory(query) {
  const historyItem = {
    query: query,
    timestamp: Date.now(),
    resultsCount: totalHits.value
  }

  // Remove duplicates
  searchHistory.value = searchHistory.value.filter(item => item.query !== query)

  // Add to beginning
  searchHistory.value.unshift(historyItem)

  // Limit to 10 items
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10)
  }

  // Save to localStorage
  try {
    localStorage.setItem(`navidocs-search-history-${documentId.value}`, JSON.stringify(searchHistory.value))
  } catch (e) {
    console.warn('Failed to save search history:', e)
  }
}

// Clear search history
function clearSearchHistory() {
  searchHistory.value = []
  try {
    localStorage.removeItem(`navidocs-search-history-${documentId.value}`)
  } catch (e) {
    console.warn('Failed to clear search history:', e)
  }
}

// Load search history from localStorage
function loadSearchHistory() {
  try {
    const stored = localStorage.getItem(`navidocs-search-history-${documentId.value}`)
    if (stored) {
      searchHistory.value = JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load search history:', e)
  }
}

// ============================================================================
// SECTION 4: KEYBOARD SHORTCUTS (Add inside onMounted(), around line 878)
// ============================================================================

// Global keyboard shortcuts for search
const handleKeyboardShortcuts = (event) => {
  // Cmd/Ctrl + F: Focus search input
  if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
    event.preventDefault()
    searchInputRef.value?.focus()
  }

  // Cmd/Ctrl + G: Next result
  if ((event.metaKey || event.ctrlKey) && event.key === 'g' && !event.shiftKey) {
    event.preventDefault()
    if (totalHits.value > 0) {
      nextHit()
    }
  }

  // Cmd/Ctrl + Shift + G: Previous result
  if ((event.metaKey || event.ctrlKey) && event.key === 'g' && event.shiftKey) {
    event.preventDefault()
    if (totalHits.value > 0) {
      prevHit()
    }
  }

  // Escape: Clear search
  if (event.key === 'Escape' && searchQuery.value) {
    clearSearch()
  }
}

window.addEventListener('keydown', handleKeyboardShortcuts)

// Load search history on mount
loadSearchHistory()

// ============================================================================
// SECTION 5: CLEANUP (Add inside onBeforeUnmount(), around line 961)
// ============================================================================

window.removeEventListener('keydown', handleKeyboardShortcuts)

// ============================================================================
// SECTION 6: TEMPLATE CHANGES
// ============================================================================

/*
 * TEMPLATE CHANGE 1: Update search input (around line 46-80)
 *
 * Replace the search input div with:
 */

/*
<div class="flex-1" :class="isHeaderCollapsed ? 'max-w-2xl' : 'max-w-3xl mx-auto'">
  <div class="relative group">
    <input
      ref="searchInputRef"
      v-model="searchInput"
      @keydown.enter="performSearch"
      @input="handleSearchInput"
      @focus="showSearchSuggestions = true"
      @blur="hideSearchSuggestions"
      type="text"
      class="w-full px-6 pr-28 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-lg text-white placeholder-white/50 shadow-lg focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/20"
      :class="isHeaderCollapsed ? 'h-10 text-sm' : 'h-16 text-lg'"
      placeholder="Search in document... (Cmd/Ctrl+F)"
    />

    <!-- Search Suggestions Component -->
    <SearchSuggestions
      :visible="showSearchSuggestions && searchInput.length > 0"
      :history="searchHistory"
      :suggestions="searchSuggestions"
      :document-id="documentId"
      @select="handleSuggestionSelect"
      @clear-history="clearSearchHistory"
    />

    <div class="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
      <button
        v-if="searchInput"
        @click="clearSearch"
        class="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title="Clear search"
      >
        <svg :class="isHeaderCollapsed ? 'w-4 h-4' : 'w-5 h-5'" class="text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <button
        @click="performSearch"
        class="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white shadow-md hover:shadow-lg hover:scale-105"
        :class="isHeaderCollapsed ? 'w-8 h-8' : 'w-10 h-10'"
        title="Search"
      >
        <svg :class="isHeaderCollapsed ? 'w-4 h-4' : 'w-5 h-5'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>
  </div>
</div>
*/

/*
 * TEMPLATE CHANGE 2: Add SearchResultsSidebar (around line 229-237)
 *
 * Add this after TocSidebar:
 */

/*
<!-- PDF Viewer with Sidebars -->
<main class="viewer-wrapper relative">
  <!-- TOC Sidebar -->
  <TocSidebar
    v-if="documentId"
    :document-id="documentId"
    :current-page="currentPage"
    @navigate-to-page="handleTocJump"
  />

  <!-- Search Results Sidebar -->
  <SearchResultsSidebar
    :visible="searchQuery && totalHits > 0"
    :results="allPagesHitList.length > 0 ? allPagesHitList : hitList"
    :current-index="currentHitIndex"
    :search-term="searchQuery"
    @result-click="jumpToHit"
    @close="clearSearch"
  />

  <!-- PDF Pane -->
  <div class="pdf-pane py-8">
    <!-- ... existing PDF viewer ... -->
  </div>
</main>
*/

// ============================================================================
// SECTION 7: INTEGRATION NOTES
// ============================================================================

/*
 * Integration Summary:
 *
 * 1. Both SearchResultsSidebar and SearchSuggestions components exist and are complete
 *
 * 2. DocumentView.vue already has comprehensive search functionality:
 *    - Cross-page search (searchAllPages)
 *    - Apple Preview-style highlighting
 *    - Hit navigation with page jumping
 *    - Search statistics and state management
 *
 * 3. What's needed to complete:
 *    - Import the two components
 *    - Add state for suggestions and history
 *    - Add event handlers for suggestions
 *    - Add keyboard shortcuts
 *    - Update template to include components
 *
 * 4. The integration is relatively simple because:
 *    - Search logic already exists
 *    - Components are self-contained
 *    - Event emissions match existing handlers
 *
 * 5. Key features after integration:
 *    - Cmd/Ctrl+F to focus search
 *    - Suggestions dropdown with history
 *    - Sidebar with all results across all pages
 *    - Click to jump to any result
 *    - Keyboard navigation (Cmd/Ctrl+G for next, Cmd/Ctrl+Shift+G for prev)
 *    - LocalStorage persistence for search history
 *
 * 6. Potential conflicts:
 *    - Both TocSidebar and SearchResultsSidebar slide from left
 *    - May need to adjust positioning or add toggle between them
 *    - SearchResultsSidebar is positioned at left: 0, TocSidebar also from left
 *    - Consider z-index layering or exclusive visibility
 */

// ============================================================================
// SECTION 8: KEYBOARD SHORTCUTS REFERENCE
// ============================================================================

const KEYBOARD_SHORTCUTS = {
  'Cmd/Ctrl + F': 'Focus search input',
  'Enter': 'Perform search',
  'Cmd/Ctrl + G': 'Next match',
  'Cmd/Ctrl + Shift + G': 'Previous match',
  'Escape': 'Clear search / Close suggestions',
  '↑ / ↓ (in suggestions)': 'Navigate suggestions',
  'Enter (in suggestions)': 'Select suggestion',
}

// ============================================================================
// SECTION 9: COMPONENT PROPS REFERENCE
// ============================================================================

/*
 * SearchSuggestions Props:
 *
 * @prop {Array} history - Array of { query, timestamp, resultsCount }
 * @prop {Array} suggestions - Array of suggested search terms (strings)
 * @prop {Boolean} visible - Whether to show the dropdown
 * @prop {String} documentId - Current document ID
 * @prop {Number} maxHistory - Max history items to show (default: 10)
 * @prop {Number} maxSuggestions - Max suggestions to show (default: 8)
 *
 * @emit select(query) - User selected a query
 * @emit clear-history - User wants to clear history
 */

/*
 * SearchResultsSidebar Props:
 *
 * @prop {Array} results - Array of hit objects with { page, snippet, ... }
 * @prop {Number} currentIndex - Currently active result index
 * @prop {Boolean} visible - Whether sidebar is visible
 * @prop {String} searchTerm - The search query for highlighting
 *
 * @emit result-click(index) - User clicked a result
 * @emit close - User wants to close sidebar
 */

// ============================================================================
// SECTION 10: TESTING COMMANDS
// ============================================================================

/*
 * Manual Testing Steps:
 *
 * 1. Open any document in NaviDocs
 * 2. Press Cmd/Ctrl+F → Search input should focus
 * 3. Type "engine" → Suggestions dropdown should appear
 * 4. Click a suggestion → Search should execute
 * 5. Results sidebar should slide in from left showing all matches
 * 6. Click a result in sidebar → Should jump to that page
 * 7. Press Cmd/Ctrl+G → Should go to next match
 * 8. Press Cmd/Ctrl+Shift+G → Should go to previous match
 * 9. Press Escape → Search should clear
 * 10. Search again for same term → Should appear in history
 * 11. Click "Clear" in suggestions → History should be cleared
 * 12. Refresh page → History should persist (localStorage)
 *
 * Edge Cases:
 * - Search with no results
 * - Search at end of document (next wraps to beginning)
 * - Search at beginning of document (prev wraps to end)
 * - Multiple words search
 * - Special characters in search
 * - Very long search query
 * - Document with 100+ pages (performance test)
 */

// ============================================================================
// END OF INTEGRATION CODE
// ============================================================================
