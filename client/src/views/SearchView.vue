<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
    <!-- Header -->
    <header class="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <button @click="$router.push('/')" class="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15c3-2 6-2 9 0s6 2 9 0M3 9c3-2 6-2 9 0s6 2 9 0" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">NaviDocs</h1>
            </div>
          </button>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- Search Bar -->
      <div class="mb-8">
        <div class="relative group max-w-3xl mx-auto">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
          <div class="relative">
            <input
              v-model="searchQuery"
              @input="performSearch"
              type="text"
              class="w-full h-16 px-6 pr-14 rounded-2xl border-2 border-dark-100 bg-white shadow-lg focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all duration-200 text-lg placeholder-dark-400"
              placeholder="Search your manuals..."
              autofocus
            />
            <div class="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white shadow-md">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Meta -->
      <div v-if="!loading && results.length > 0" class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-dark-900 font-semibold text-lg">{{ results.length }} results</span>
          <span class="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
            {{ searchTime }}ms
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-20">
        <div class="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
        <p class="text-dark-600 font-medium">Searching...</p>
      </div>

      <!-- Results Grid -->
      <div v-else-if="results.length > 0" class="space-y-4">
        <div
          v-for="result in results"
          :key="result.id"
          class="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-dark-100 overflow-hidden cursor-pointer"
          @click="viewDocument(result)"
        >
          <div class="p-6">
            <div class="flex items-start gap-4">
              <!-- Document Icon -->
              <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-bold text-dark-900 mb-1 group-hover:text-primary-600 transition-colors">
                  {{ result.title }}
                </h3>
                <div class="flex items-center gap-3 text-sm text-dark-500 mb-3">
                  <span class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {{ result.boatMake }} {{ result.boatModel }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Page {{ result.pageNumber }}
                  </span>
                </div>
                <p class="text-dark-700 leading-relaxed line-clamp-2" v-html="highlightMatch(result.text)"></p>
              </div>

              <!-- Arrow Icon -->
              <div class="flex-shrink-0 text-dark-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-else-if="searchQuery" class="text-center py-20">
        <div class="w-20 h-20 bg-dark-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-dark-900 mb-2">No results found</h3>
        <p class="text-dark-600 mb-6">Try different keywords or check your spelling</p>
        <button @click="searchQuery = ''" class="text-primary-600 hover:text-primary-700 font-medium">
          Clear search
        </button>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20">
        <div class="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-dark-900 mb-2">Start searching</h3>
        <p class="text-dark-600">Enter a keyword to find what you need</p>
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
