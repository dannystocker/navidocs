<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="glass sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <button @click="$router.push('/')" class="flex items-center space-x-3 hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg">
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
              class="w-full h-12 px-5 pr-14 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-lg text-white placeholder-white/50 shadow-lg focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all duration-200"
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
          <span class="text-white font-semibold text-lg">{{ results.length }} results</span>
          <span class="badge badge-primary">
            {{ searchTime }}ms
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-20">
        <div class="space-y-4 max-w-3xl mx-auto">
          <div class="skeleton h-24 rounded-2xl"></div>
          <div class="skeleton h-24 rounded-2xl"></div>
          <div class="skeleton h-24 rounded-2xl"></div>
        </div>
      </div>

      <!-- Results Grid -->
      <div v-else-if="results.length > 0" class="space-y-2">
        <article
          v-for="result in results"
          :key="result.id"
          class="nv-card group cursor-pointer focus-visible:ring-2 focus-visible:ring-pink-400 focus:outline-none relative"
          @click="viewDocument(result)"
          tabindex="0"
          @keypress.enter="viewDocument(result)"
          @keypress.space.prevent="viewDocument(result)"
        >
          <!-- Metadata Row -->
          <header class="nv-meta">
            <span class="nv-page">Page {{ result.pageNumber }}</span>
            <span class="nv-dot">·</span>
            <span v-if="result.boatMake || result.boatModel" class="nv-boat">
              {{ result.boatMake }} {{ result.boatModel }}
            </span>
            <span class="nv-doc" :title="result.title">{{ result.title }}</span>
          </header>

          <!-- Snippet with Highlights -->
          <p class="nv-snippet" v-html="formatSnippet(result.text)"></p>

          <!-- Footer Operations -->
          <footer class="nv-ops">
            <button
              v-if="result.imagePath"
              class="nv-chip"
              @click.stop="togglePreview(result.id)"
              @mouseenter="showPreview(result.id)"
              @mouseleave="hidePreview(result.id)"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Diagram
            </button>
            <span class="nv-link">Open page →</span>
          </footer>

          <!-- Diagram Preview Popover -->
          <div
            v-if="result.imagePath && activePreview === result.id"
            class="nv-popover"
            role="dialog"
            aria-label="Diagram preview"
            @click.stop
          >
            <img
              :src="`/api${result.imagePath}`"
              :alt="`Diagram from ${result.title} page ${result.pageNumber}`"
              loading="lazy"
              @error="handleImageError"
            />
          </div>
        </article>
      </div>

      <!-- No Results -->
      <div v-else-if="searchQuery" class="text-center py-20">
        <div class="w-20 h-20 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">No results found</h3>
        <p class="text-white/70 mb-6">Try different keywords or check your spelling</p>
        <button @click="searchQuery = ''" class="text-pink-400 hover:text-pink-300 font-medium">
          Clear search
        </button>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20">
        <div class="w-20 h-20 bg-pink-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Start searching</h3>
        <p class="text-white/70">Enter a keyword to find what you need</p>
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
const activePreview = ref(null)
let previewTimer = null

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

function formatSnippet(text) {
  if (!text) return ''

  // Meilisearch returns <mark> tags, enhance them with bold
  return text
    .replace(/<mark>/g, '<mark class="nv-hi"><strong>')
    .replace(/<\/mark>/g, '</strong></mark>')
}

function showPreview(id) {
  clearTimeout(previewTimer)
  previewTimer = setTimeout(() => {
    activePreview.value = id
  }, 300)
}

function hidePreview(id) {
  clearTimeout(previewTimer)
  previewTimer = setTimeout(() => {
    if (activePreview.value === id) {
      activePreview.value = null
    }
  }, 300)
}

function togglePreview(id) {
  activePreview.value = activePreview.value === id ? null : id
}

function viewDocument(result) {
  router.push({
    name: 'document',
    params: { id: result.docId },
    query: {
      page: result.pageNumber,
      q: searchQuery.value // Pass search query for highlighting
    }
  })
}

function handleImageError(event) {
  event.target.closest('.nv-popover')?.remove()
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

<style scoped>
/* Dense, information-first search results */
.nv-card {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 10px 12px;
  position: relative;
  transition: background 0.15s ease;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.nv-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 92, 178, 0.2);
}

/* Metadata row - small, condensed */
.nv-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 12px;
  margin-bottom: 6px;
  line-height: 1.3;
}

.nv-page {
  font-weight: 600;
  color: #f4f4f6;
}

.nv-boat {
  color: #a8acb3;
}

.nv-dot {
  color: #6b6b7a;
}

.nv-doc {
  margin-left: auto;
  color: #9aa0a6;
  border: 1px solid #3b3b4a;
  padding: 2px 8px;
  border-radius: 10px;
  max-width: 50%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
}

/* Snippet - the star of the show */
.nv-snippet {
  font-size: 15px;
  line-height: 1.5;
  color: #e6e6ea;
  margin: 4px 0 8px;
}

/* Highlight styling - high contrast */
.nv-snippet :deep(.nv-hi) {
  background: #FFE666;
  color: #1d1d1f;
  border-radius: 3px;
  padding: 1px 3px;
  font-weight: inherit;
}

.nv-snippet :deep(.nv-hi strong) {
  font-weight: 700;
}

/* Operations footer */
.nv-ops {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 12px;
}

.nv-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 8px;
  background: rgba(255, 230, 102, 0.12);
  color: #FFE666;
  border: 1px solid rgba(255, 230, 102, 0.35);
  cursor: pointer;
  transition: all 0.15s ease;
}

.nv-chip:hover {
  background: rgba(255, 230, 102, 0.2);
  border-color: rgba(255, 230, 102, 0.5);
}

.nv-link {
  color: #cfa7ff;
  font-weight: 500;
}

/* Diagram preview popover */
.nv-popover {
  position: absolute;
  z-index: 50;
  top: 100%;
  left: 0;
  margin-top: 8px;
  padding: 8px;
  background: #14131a;
  border: 1px solid #2b2a34;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  max-width: 90vw;
}

.nv-popover img {
  max-height: 320px;
  max-width: 600px;
  display: block;
  border-radius: 6px;
}

/* Reduce search bar height */
.search-input {
  height: 48px !important;
}

@media (max-width: 768px) {
  .nv-doc {
    display: none;
  }

  .nv-popover img {
    max-width: calc(100vw - 40px);
    max-height: 240px;
  }
}
</style>
