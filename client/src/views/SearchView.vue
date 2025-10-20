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
          <LanguageSwitcher />
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
              :placeholder="$t('search.placeholder')"
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
          <span class="text-white font-semibold text-lg">{{ $t('search.resultsCount', { count: results.length }) }}</span>
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
        <template v-for="(result, index) in results" :key="result.id">
          <!-- Section Header (show when section changes) -->
          <div
            v-if="shouldShowSectionHeader(result, index)"
            class="nv-section-header"
          >
            <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{{ result.section || $t('search.section') }}</span>
          </div>

          <article
            class="nv-card group cursor-pointer focus-visible:ring-2 focus-visible:ring-pink-400 focus:outline-none relative"
            @click="viewDocument(result)"
            tabindex="0"
            @keypress.enter="viewDocument(result)"
            @keypress.space.prevent="viewDocument(result)"
          >
          <!-- Metadata Row -->
          <header class="nv-meta">
            <span class="nv-page">{{ $t('search.page') }} {{ result.pageNumber }}</span>
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
              v-if="result.imageUrl"
              class="nv-chip"
              @click.stop="togglePreview(result.id)"
              @mouseenter="showPreview(result.id)"
              @mouseleave="hidePreview(result.id)"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ $t('common.viewDetails') }}
            </button>
            <button class="nv-chip-text" @click.stop="toggleExpand(result)">
              {{ expandedId === result.id ? $t('search.collapse') : $t('search.expand') }}
            </button>
            <span class="nv-link" @click="viewDocument(result)">{{ $t('search.viewDocument') }}</span>
            <button
              v-if="result.section"
              class="nv-chip-text"
              @click.stop="jumpToSection(result)"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              {{ $t('toc.jumpToSection') }}
            </button>
          </footer>

          <!-- Inline Expansion Panel -->
          <div v-if="expandedId === result.id" class="nv-expand" @click.stop>
            <div v-if="contextCache[result.id]" class="nv-context">
              <!-- Neighbor page thumbnails -->
              <div class="nv-context-pages">
                <figure
                  v-for="pageKey in ['prev', 'current', 'next']"
                  :key="pageKey"
                  class="nv-context-page"
                  :class="{ active: pageKey === 'current' }"
                >
                  <div v-if="contextCache[result.id][pageKey]" class="nv-context-image">
                    <img
                      v-if="contextCache[result.id][pageKey].imageUrl"
                      :src="contextCache[result.id][pageKey].imageUrl"
                      loading="lazy"
                      decoding="async"
                      :alt="`Page ${contextCache[result.id][pageKey].page}`"
                    />
                    <div v-else class="nv-context-noimage">{{ $t('search.noDiagram') }}</div>
                  </div>
                  <figcaption v-if="contextCache[result.id][pageKey]">
                    {{ $t('search.page') }} {{ contextCache[result.id][pageKey].page }}
                  </figcaption>
                </figure>
              </div>

              <!-- Longer snippet from current page -->
              <div class="nv-expand-text">
                <p class="nv-snippet" v-html="formatSnippet(contextCache[result.id].current?.text || '')"></p>
              </div>
            </div>

            <div v-else class="nv-expand-loading">
              <div class="spinner"></div>
              {{ $t('common.loading') }}
            </div>
          </div>

          <!-- Diagram Preview Popover -->
          <div
            v-if="result.imageUrl && activePreview === result.id"
            class="nv-popover"
            role="dialog"
            aria-label="Diagram preview"
            @click.stop
          >
            <img
              :src="result.imageUrl"
              :alt="`Diagram from ${result.title} page ${result.pageNumber}`"
              loading="lazy"
              @error="handleImageError"
            />
          </div>
          </article>
        </template>
      </div>

      <!-- No Results -->
      <div v-else-if="searchQuery" class="text-center py-20">
        <div class="w-20 h-20 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">{{ $t('search.noResults') }}</h3>
        <p class="text-white/70 mb-6">{{ $t('search.noResultsHint') }}</p>
        <button @click="searchQuery = ''" class="text-pink-400 hover:text-pink-300 font-medium">
          {{ $t('common.cancel') }}
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
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const route = useRoute()
const router = useRouter()

const { results, loading, searchTime, search } = useSearch()
const searchQuery = ref(route.query.q || '')
const activePreview = ref(null)
const expandedId = ref(null)
const contextCache = ref({})
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

function jumpToSection(result) {
  router.push(`/document/${result.docId}?page=${result.pageNumber}#p=${result.pageNumber}`)
}

function handleImageError(event) {
  event.target.closest('.nv-popover')?.remove()
}

function shouldShowSectionHeader(result, index) {
  if (index === 0) return true // Always show for first result
  const prevResult = results.value[index - 1]
  return result.sectionKey !== prevResult?.sectionKey
}

async function toggleExpand(result) {
  const resultId = result.id

  if (expandedId.value === resultId) {
    expandedId.value = null
    return
  }

  expandedId.value = resultId

  // Fetch context if not cached
  if (!contextCache.value[resultId]) {
    try {
      const response = await fetch(`/api/context?docId=${result.docId}&page=${result.pageNumber}`)
      if (response.ok) {
        contextCache.value[resultId] = await response.json()
      }
    } catch (error) {
      console.error('Failed to fetch context:', error)
    }
  }
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

.nv-chip-text {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 8px;
  background: rgba(207, 167, 255, 0.12);
  color: #cfa7ff;
  border: 1px solid rgba(207, 167, 255, 0.35);
  cursor: pointer;
  transition: all 0.15s ease;
}

.nv-chip-text:hover {
  background: rgba(207, 167, 255, 0.2);
  border-color: rgba(207, 167, 255, 0.5);
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

/* Section header grouping */
.nv-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0 8px 0;
  margin-top: 16px;
  font-size: 13px;
  font-weight: 600;
  color: #cfa7ff;
  letter-spacing: 0.02em;
}

.nv-section-header:first-child {
  margin-top: 0;
}

/* Inline expansion panel */
.nv-expand {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.nv-expand-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #9aa0a6;
  padding: 12px 0;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(207, 167, 255, 0.3);
  border-top-color: #cfa7ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.nv-context-pages {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  overflow-x: auto;
}

.nv-context-page {
  flex-shrink: 0;
  text-align: center;
}

.nv-context-image {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nv-context-page.active .nv-context-image {
  border-color: rgba(207, 167, 255, 0.5);
  box-shadow: 0 0 0 2px rgba(207, 167, 255, 0.2);
}

.nv-context-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nv-context-noimage {
  font-size: 10px;
  color: #6b6b7a;
  text-align: center;
  padding: 8px;
}

.nv-context-page figcaption {
  margin-top: 4px;
  font-size: 10px;
  color: #9aa0a6;
}

.nv-context-page.active figcaption {
  color: #cfa7ff;
  font-weight: 600;
}

.nv-expand-text {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.nv-expand-text .nv-snippet {
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
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
