/**
 * Meilisearch Composable
 * Handles search with tenant tokens for secure client-side search
 */

import { ref } from 'vue'
import { MeiliSearch } from 'meilisearch'

export function useSearch() {
  const searchClient = ref(null)
  const tenantToken = ref(null)
  const tokenExpiresAt = ref(null)
  const indexName = ref('navidocs-pages')
  const results = ref([])
  const loading = ref(false)
  const error = ref(null)
  const searchTime = ref(0)

  /**
   * Get or refresh tenant token from backend
   */
  async function getTenantToken() {
    // Check if existing token is still valid (with 5 min buffer)
    if (tenantToken.value && tokenExpiresAt.value) {
      const now = Date.now()
      const expiresIn = tokenExpiresAt.value - now
      if (expiresIn > 5 * 60 * 1000) { // 5 minutes buffer
        return tenantToken.value
      }
    }

    try {
      const response = await fetch('/api/search/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // TODO: Add JWT auth header when auth is implemented
          // 'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get search token')
      }

      tenantToken.value = data.token
      tokenExpiresAt.value = new Date(data.expiresAt).getTime()
      indexName.value = data.indexName

      // Initialize Meilisearch client with tenant token
      searchClient.value = new MeiliSearch({
        host: data.searchUrl || 'http://127.0.0.1:7700',
        apiKey: data.token
      })

      return data.token
    } catch (err) {
      console.error('Failed to get tenant token:', err)
      error.value = err.message
      throw err
    }
  }

  /**
   * Perform search via backend API
   */
  async function search(query, options = {}) {
    if (!query.trim()) {
      results.value = []
      return results.value
    }

    loading.value = true
    error.value = null
    const startTime = performance.now()

    try {
      // Use backend search endpoint instead of direct Meilisearch connection
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // TODO: Add JWT auth header when auth is implemented
          // 'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          q: query,
          limit: options.limit || 20,
          ...options.filters && { filter: buildFilters(options.filters) }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }

      const searchResults = await response.json()

      results.value = searchResults.hits
      searchTime.value = Math.round(performance.now() - startTime)

      return searchResults
    } catch (err) {
      console.error('Search failed:', err)
      error.value = err.message
      results.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Build Meilisearch filter string from filter object
   */
  function buildFilters(filters) {
    const conditions = []

    if (filters.documentType) {
      conditions.push(`documentType = "${filters.documentType}"`)
    }

    if (filters.boatMake) {
      conditions.push(`boatMake = "${filters.boatMake}"`)
    }

    if (filters.boatModel) {
      conditions.push(`boatModel = "${filters.boatModel}"`)
    }

    if (filters.systems && filters.systems.length > 0) {
      const systemFilters = filters.systems.map(s => `"${s}"`).join(', ')
      conditions.push(`systems IN [${systemFilters}]`)
    }

    if (filters.categories && filters.categories.length > 0) {
      const categoryFilters = filters.categories.map(c => `"${c}"`).join(', ')
      conditions.push(`categories IN [${categoryFilters}]`)
    }

    return conditions.join(' AND ')
  }

  /**
   * Get facet values for filters
   */
  async function getFacets(attributes = ['documentType', 'boatMake', 'boatModel', 'systems', 'categories']) {
    try {
      await getTenantToken()

      if (!searchClient.value) {
        throw new Error('Search client not initialized')
      }

      const index = searchClient.value.index(indexName.value)

      const searchResults = await index.search('', {
        facets: attributes,
        limit: 0
      })

      return searchResults.facetDistribution
    } catch (err) {
      console.error('Failed to get facets:', err)
      error.value = err.message
      throw err
    }
  }

  return {
    results,
    loading,
    error,
    searchTime,
    search,
    getFacets,
    getTenantToken
  }
}
