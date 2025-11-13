<template>
  <div class="p-8 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold text-white mb-6">Search with Suggestions Example</h1>

    <!-- Search Container -->
    <div class="relative">
      <!-- Search Input -->
      <div class="relative">
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Search document..."
          class="w-full px-4 py-3 pl-12 pr-12 bg-dark-800 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          @focus="showSuggestions = true"
          @blur="handleBlur"
          @input="handleInput"
          @keydown.enter="performSearch"
        />
        <!-- Search Icon -->
        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <!-- Clear Button -->
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Search Suggestions Dropdown -->
      <SearchSuggestions
        :history="searchHistory"
        :suggestions="searchSuggestions"
        :visible="showSuggestions && searchQuery.length === 0"
        :document-id="currentDocumentId"
        @select="handleSuggestionSelect"
        @clear-history="handleClearHistory"
      />
    </div>

    <!-- Search Results -->
    <div v-if="searchResults.length > 0" class="mt-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-white">
          Search Results ({{ searchResults.length }})
        </h2>
        <button
          @click="clearSearch"
          class="text-sm text-white/60 hover:text-white/90 transition-colors"
        >
          Clear search
        </button>
      </div>
      <div class="space-y-3">
        <div
          v-for="(result, index) in searchResults"
          :key="index"
          class="p-4 bg-dark-800/50 border border-white/10 rounded-lg"
        >
          <p class="text-white" v-html="highlightMatches(result, searchQuery)"></p>
        </div>
      </div>
    </div>

    <!-- Sample Document Preview -->
    <div class="mt-8 p-6 bg-dark-800/30 border border-white/10 rounded-xl">
      <h3 class="text-lg font-semibold text-white mb-4">Sample Document Content</h3>
      <div class="text-white/70 space-y-3 text-sm leading-relaxed">
        <p>This is a sample boat manual document. It contains important information about marine navigation systems, engine maintenance, and safety procedures.</p>
        <p>The vessel is equipped with advanced radar systems, GPS navigation, and autopilot functionality. Regular maintenance of the hydraulic steering system is essential for safe operation.</p>
        <p>Emergency procedures include checking the bilge pump, activating the emergency position indicating radio beacon (EPIRB), and deploying life rafts when necessary.</p>
      </div>
    </div>

    <!-- Debug Info -->
    <div class="mt-8 p-4 bg-dark-900/50 border border-white/10 rounded-lg">
      <h3 class="text-sm font-semibold text-white/60 mb-2">Debug Info</h3>
      <div class="text-xs text-white/40 space-y-1 font-mono">
        <div>Document ID: {{ currentDocumentId }}</div>
        <div>Search History: {{ searchHistory.length }} items</div>
        <div>Suggestions: {{ searchSuggestions.length }} terms</div>
        <div>Total Searches: {{ totalSearches }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SearchSuggestions from '../components/SearchSuggestions.vue'
import { useSearchHistory } from '../composables/useSearchHistory.js'
import { generateComprehensiveSuggestions } from '../utils/searchSuggestions.js'

// Current document
const currentDocumentId = ref('sample-boat-manual-123')

// Search state
const searchQuery = ref('')
const searchInput = ref(null)
const showSuggestions = ref(false)
const searchResults = ref([])

// Search history composable
const {
  addToHistory,
  getHistory,
  clearHistory,
  totalSearches
} = useSearchHistory()

// Sample document content for generating suggestions
const documentContent = `
This is a sample boat manual document. It contains important information about marine navigation systems, engine maintenance, and safety procedures.

The vessel is equipped with advanced radar systems, GPS navigation, and autopilot functionality. Regular maintenance of the hydraulic steering system is essential for safe operation.

Emergency procedures include checking the bilge pump, activating the emergency position indicating radio beacon (EPIRB), and deploying life rafts when necessary.

Navigation equipment includes VHF radio, chartplotter, depth sounder, and wind instruments. The autopilot system can maintain course automatically.

Engine maintenance requires checking oil levels, fuel filters, coolant, and transmission fluid. Inspect belts and hoses regularly for wear.

Safety equipment must include life jackets, flares, fire extinguishers, and first aid kit. Check expiration dates annually.
`

// Get search history for current document
const searchHistory = computed(() => {
  return getHistory(currentDocumentId.value, 10)
})

// Generate search suggestions from document
const searchSuggestions = computed(() => {
  return generateComprehensiveSuggestions(documentContent, 12, 5)
})

// Handle search input
function handleInput() {
  if (searchQuery.value.length > 0) {
    showSuggestions.value = false
  }
}

// Handle search input blur (with delay for click handling)
function handleBlur() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

// Perform search
function performSearch() {
  if (!searchQuery.value.trim()) return

  const query = searchQuery.value.trim()

  // Simple mock search - find matches in document content
  const results = documentContent
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.toLowerCase().includes(query.toLowerCase()))

  searchResults.value = results

  // Add to search history
  addToHistory(
    currentDocumentId.value,
    query,
    results.length
  )

  showSuggestions.value = false
}

// Handle suggestion selection
function handleSuggestionSelect(query) {
  searchQuery.value = query
  performSearch()
}

// Clear search
function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  searchInput.value?.focus()
}

// Handle clear history
function handleClearHistory() {
  clearHistory(currentDocumentId.value)
}

// Highlight search matches in results
function highlightMatches(text, query) {
  if (!query) return text

  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-500/30 text-yellow-200">$1</mark>')
}

// Initialize suggestions on mount
onMounted(() => {
  // Suggestions are generated automatically via computed property
})
</script>

<style scoped>
mark {
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}
</style>
