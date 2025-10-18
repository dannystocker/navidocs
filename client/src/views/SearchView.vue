<template>
  <div class="min-h-screen bg-dark-50">
    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- Back button -->
      <button @click="$router.push('/')" class="mb-6 text-dark-600 hover:text-dark-900 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </button>

      <!-- Search Bar -->
      <div class="search-bar mb-8">
        <input
          type="text"
          class="search-input"
          placeholder="Search your manuals..."
          v-model="searchQuery"
          @input="performSearch"
        />
      </div>

      <!-- Results -->
      <div v-if="loading" class="text-center py-12">
        <div class="spinner mx-auto"></div>
        <p class="mt-4 text-dark-600">Searching...</p>
      </div>

      <div v-else-if="results.length > 0">
        <p class="text-dark-600 mb-4">
          Found {{ results.length }} results in {{ searchTime }}ms
        </p>

        <div class="space-y-4">
          <div
            v-for="result in results"
            :key="result.id"
            class="card-hover cursor-pointer"
            @click="viewDocument(result)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-dark-900 mb-1">
                  {{ result.title }}
                </h3>
                <p class="text-sm text-dark-600 mb-2">
                  {{ result.boatMake }} {{ result.boatModel }} - Page {{ result.pageNumber }}
                </p>
                <p class="text-dark-700 line-clamp-3" v-html="highlightMatch(result.text)"></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="searchQuery" class="card text-center py-12">
        <p class="text-dark-600">No results found. Try a different search term.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearch } from '../composables/useSearch'

const route = useRoute()
const router = useRouter()

const { results, loading, searchTime, search } = useSearch()
const searchQuery = ref(route.query.q || '')

async function performSearch() {
  if (!searchQuery.value.trim()) {
    results.value = []
    return
  }

  try {
    await search(searchQuery.value)
  } catch (error) {
    console.error('Search failed:', error)
  }
}

function highlightMatch(text) {
  // Meilisearch returns pre-highlighted text with <mark> tags
  return text || ''
}

function viewDocument(result) {
  router.push({
    name: 'document',
    params: { id: result.docId },
    query: { page: result.pageNumber }
  })
}

// Watch for query changes from URL
watch(() => route.query.q, (newQuery) => {
  searchQuery.value = newQuery || ''
  if (searchQuery.value) {
    performSearch()
  }
})

onMounted(() => {
  if (searchQuery.value) {
    performSearch()
  }
})
</script>
