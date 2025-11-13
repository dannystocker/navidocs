import { ref, computed } from 'vue'

const STORAGE_KEY = 'navidocs_search_history'
const MAX_HISTORY_ITEMS = 50 // Store up to 50 items per document

// Global state for search history
const historyStore = ref(new Map())

/**
 * Composable for managing search history in localStorage
 * Stores search queries with metadata per document
 */
export function useSearchHistory() {
  // Load history from localStorage on first use
  if (historyStore.value.size === 0) {
    loadFromStorage()
  }

  /**
   * Add a search query to history
   * @param {string} documentId - Document identifier
   * @param {string} query - Search query
   * @param {number} resultsCount - Number of results found
   */
  function addToHistory(documentId, query, resultsCount = 0) {
    if (!documentId || !query || query.trim().length === 0) return

    const normalizedQuery = query.trim()

    // Get or create document history
    let docHistory = historyStore.value.get(documentId) || []

    // Remove duplicate if exists (case-insensitive)
    docHistory = docHistory.filter(
      item => item.query.toLowerCase() !== normalizedQuery.toLowerCase()
    )

    // Add new entry at the beginning
    docHistory.unshift({
      query: normalizedQuery,
      timestamp: Date.now(),
      resultsCount
    })

    // Limit history size
    if (docHistory.length > MAX_HISTORY_ITEMS) {
      docHistory = docHistory.slice(0, MAX_HISTORY_ITEMS)
    }

    // Update store
    historyStore.value.set(documentId, docHistory)

    // Persist to localStorage
    saveToStorage()
  }

  /**
   * Get search history for a document
   * @param {string} documentId - Document identifier
   * @param {number} limit - Maximum number of items to return
   * @returns {Array} Search history items
   */
  function getHistory(documentId, limit = 10) {
    if (!documentId) return []

    const docHistory = historyStore.value.get(documentId) || []
    return limit ? docHistory.slice(0, limit) : docHistory
  }

  /**
   * Clear history for a specific document
   * @param {string} documentId - Document identifier
   */
  function clearHistory(documentId) {
    if (!documentId) return

    historyStore.value.delete(documentId)
    saveToStorage()
  }

  /**
   * Clear all search history
   */
  function clearAllHistory() {
    historyStore.value.clear()
    saveToStorage()
  }

  /**
   * Load history from localStorage
   */
  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        historyStore.value = new Map(Object.entries(parsed))
      }
    } catch (error) {
      console.error('Failed to load search history from localStorage:', error)
      historyStore.value = new Map()
    }
  }

  /**
   * Save history to localStorage
   */
  function saveToStorage() {
    try {
      const data = Object.fromEntries(historyStore.value)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save search history to localStorage:', error)
    }
  }

  /**
   * Get total number of searches across all documents
   */
  const totalSearches = computed(() => {
    let total = 0
    for (const history of historyStore.value.values()) {
      total += history.length
    }
    return total
  })

  /**
   * Get most recent searches across all documents
   * @param {number} limit - Maximum number of items
   * @returns {Array} Recent searches with documentId
   */
  function getRecentSearches(limit = 10) {
    const allSearches = []

    for (const [documentId, history] of historyStore.value.entries()) {
      for (const item of history) {
        allSearches.push({
          ...item,
          documentId
        })
      }
    }

    // Sort by timestamp descending
    allSearches.sort((a, b) => b.timestamp - a.timestamp)

    return allSearches.slice(0, limit)
  }

  /**
   * Get popular searches for a document (by frequency)
   * @param {string} documentId - Document identifier
   * @param {number} limit - Maximum number of items
   * @returns {Array} Popular search terms
   */
  function getPopularSearches(documentId, limit = 5) {
    if (!documentId) return []

    const docHistory = historyStore.value.get(documentId) || []
    const frequency = new Map()

    // Count frequency (case-insensitive)
    for (const item of docHistory) {
      const lower = item.query.toLowerCase()
      const count = frequency.get(lower) || 0
      frequency.set(lower, count + 1)
    }

    // Sort by frequency
    const sorted = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)

    // Return queries with their counts
    return sorted.map(([query, count]) => ({ query, count }))
  }

  return {
    addToHistory,
    getHistory,
    clearHistory,
    clearAllHistory,
    getRecentSearches,
    getPopularSearches,
    totalSearches
  }
}
