<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="glass sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-md">
              <!-- Boat/Wave icon -->
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15c3-2 6-2 9 0s6 2 9 0M3 9c3-2 6-2 9 0s6 2 9 0" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">NaviDocs</h1>
              <p class="text-xs text-white/70">Marine Document Intelligence</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button @click="$router.push('/jobs')" class="px-4 py-2 text-white/80 hover:text-pink-400 font-medium transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-pink-400 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Jobs
            </button>
            <button @click="showUploadModal = true" class="btn btn-primary flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-primary-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Document
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <main class="max-w-7xl mx-auto px-6 py-16">
      <div class="text-center mb-16">
        <div class="inline-block mb-4">
          <span class="badge badge-primary inline-flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
            </svg>
            Powered by Meilisearch
          </span>
        </div>
        <h2 class="text-6xl font-black text-white mb-6 leading-tight">
          Marine Documentation,
          <br />
          <span class="bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
            Lightning Fast Search
          </span>
        </h2>
        <p class="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
          Upload boat manuals, extract text with OCR, and find what you need in <strong>milliseconds</strong>.
          Built for mariners who value their time on the water.
        </p>
      </div>

      <!-- Search Bar -->
      <div class="max-w-3xl mx-auto mb-20">
        <div class="relative group accent-border">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              class="w-full h-16 px-6 pr-14 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-lg text-white placeholder-white/50 shadow-lg focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/20 transition-all duration-200 text-lg"
              placeholder="Search your manuals... Try 'bilge pump' or 'electrical'"
              @keypress.enter="handleSearch"
            />
            <button
              @click="handleSearch"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
        <p class="text-center text-sm text-white/50 mt-4">
          <kbd class="px-2 py-1 bg-white/10 rounded text-xs font-mono text-white border border-white/20">Enter</kbd> to search
        </p>
      </div>

      <!-- Features -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 bg-grid">
        <div class="group relative">
          <div class="relative glass rounded-2xl p-8 hover:shadow-xl transition-all duration-300 accent-border">
            <div class="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg transform group-hover:scale-110 transition duration-300">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-3 text-center">Upload PDFs</h3>
            <p class="text-white/70 text-center leading-relaxed">Drag and drop your boat manuals. Automatic OCR extraction handles scanned documents.</p>
          </div>
        </div>

        <div class="group relative">
          <div class="relative glass rounded-2xl p-8 hover:shadow-xl transition-all duration-300 accent-border">
            <div class="w-14 h-14 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg transform group-hover:scale-110 transition duration-300">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-3 text-center">Lightning Search</h3>
            <p class="text-white/70 text-center leading-relaxed">Find "bilge pump" even when the manual says "sump pump". Typo-tolerant with synonyms.</p>
          </div>
        </div>

        <div class="group relative">
          <div class="relative glass rounded-2xl p-8 hover:shadow-xl transition-all duration-300 accent-border">
            <div class="w-14 h-14 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg transform group-hover:scale-110 transition duration-300">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-3 text-center">Offline Ready</h3>
            <p class="text-white/70 text-center leading-relaxed">Access your manuals 20 miles offshore. Progressive Web App works without internet.</p>
          </div>
        </div>
      </div>

      <!-- Document Status Dashboard -->
      <div>
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-3xl font-bold text-white">Document Status</h3>
          <button @click="loadDocuments" class="text-pink-400 hover:text-pink-300 font-medium flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-pink-400 rounded-lg">
            <svg class="w-5 h-5" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="glass rounded-2xl p-12 text-center">
          <div class="inline-block w-12 h-12 border-4 border-white/20 border-t-pink-400 rounded-full animate-spin mb-4"></div>
          <p class="text-white/70">Loading documents...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!loading && totalDocuments === 0" class="glass rounded-2xl p-12">
          <div class="text-center">
            <div class="w-20 h-20 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-10 h-10 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 class="text-xl font-bold text-white mb-2">No documents yet</h4>
            <p class="text-white/70 mb-6 max-w-md mx-auto">
              Upload your first boat manual to get started. We'll extract the text and make it searchable.
            </p>
            <button @click="showUploadModal = true" class="btn btn-primary inline-flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-primary-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Your First Manual
            </button>
          </div>
        </div>

        <!-- Status Cards -->
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <!-- Processing -->
          <div class="glass rounded-2xl p-6 border border-pink-400/30">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-pink-400/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-pink-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-white/70 font-medium">Processing</p>
                  <p class="text-2xl font-bold text-white">{{ documentsByStatus.processing.length }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Indexed -->
          <div class="glass rounded-2xl p-6 border border-success-400/30">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-success-500/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-white/70 font-medium">Ready</p>
                  <p class="text-2xl font-bold text-white">{{ documentsByStatus.indexed.length }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Failed -->
          <div class="glass rounded-2xl p-6 border border-red-400/30">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-white/70 font-medium">Failed</p>
                  <p class="text-2xl font-bold text-white">{{ documentsByStatus.failed.length }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Document Lists by Status -->
        <div v-if="totalDocuments > 0" class="space-y-6">
          <!-- Processing Documents -->
          <div v-if="documentsByStatus.processing.length > 0" class="glass rounded-2xl p-6">
            <h4 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <div class="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
              Processing ({{ documentsByStatus.processing.length }})
            </h4>
            <div class="space-y-3">
              <div v-for="doc in documentsByStatus.processing" :key="doc.id"
                   class="bg-white/10 backdrop-blur-lg rounded-lg p-4 hover:bg-white/15 transition-all cursor-pointer border border-white/10"
                   @click="$router.push(`/document/${doc.id}`)">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <h5 class="font-semibold text-white">{{ doc.title }}</h5>
                    <p class="text-sm text-white/70 mt-1">{{ formatDate(doc.createdAt) }}</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="badge badge-primary">Processing</span>
                    <svg class="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Indexed Documents -->
          <div v-if="documentsByStatus.indexed.length > 0" class="glass rounded-2xl p-6">
            <h4 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <div class="w-2 h-2 bg-success-400 rounded-full"></div>
              Ready to Search ({{ documentsByStatus.indexed.length }})
            </h4>
            <div class="space-y-3">
              <div v-for="doc in documentsByStatus.indexed" :key="doc.id"
                   class="bg-white/10 backdrop-blur-lg rounded-lg p-4 hover:bg-white/15 transition-all cursor-pointer border border-white/10"
                   @click="$router.push(`/document/${doc.id}`)">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <h5 class="font-semibold text-white">{{ doc.title }}</h5>
                    <p class="text-sm text-white/70 mt-1">{{ doc.pageCount || 0 }} pages • {{ formatDate(doc.createdAt) }}</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="badge badge-success">Ready</span>
                    <svg class="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Failed Documents -->
          <div v-if="documentsByStatus.failed.length > 0" class="glass rounded-2xl p-6 border border-red-400/30">
            <h4 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <div class="w-2 h-2 bg-red-400 rounded-full"></div>
              Failed ({{ documentsByStatus.failed.length }})
            </h4>
            <div class="space-y-3">
              <div v-for="doc in documentsByStatus.failed" :key="doc.id"
                   class="bg-red-500/10 rounded-lg p-4 border border-red-400/30">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <h5 class="font-semibold text-white">{{ doc.title }}</h5>
                    <p class="text-sm text-red-300 mt-1">Failed to process • {{ formatDate(doc.createdAt) }}</p>
                  </div>
                  <span class="badge bg-red-500/20 text-red-300 border-red-400/30">Failed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="glass border-t border-white/10 mt-20">
      <div class="max-w-7xl mx-auto px-6 py-8">
        <div class="flex items-center justify-between text-sm text-white/70">
          <p>© 2025 NaviDocs. Built for mariners.</p>
          <div class="flex items-center gap-2">
            <span>Powered by</span>
            <span class="font-semibold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">Meilisearch</span>
          </div>
        </div>
      </div>
    </footer>

    <!-- Upload Modal -->
    <UploadModal :isOpen="showUploadModal" @close="showUploadModal = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UploadModal from '../components/UploadModal.vue'

const router = useRouter()
const showUploadModal = ref(false)
const searchQuery = ref('')
const loading = ref(false)
const documents = ref([])

// Group documents by status
const documentsByStatus = computed(() => {
  return {
    processing: documents.value.filter(d => d.status === 'processing' || d.status === 'queued' || d.status === 'pending'),
    indexed: documents.value.filter(d => d.status === 'indexed' || d.status === 'completed'),
    failed: documents.value.filter(d => d.status === 'failed')
  }
})

const totalDocuments = computed(() => documents.value.length)

async function loadDocuments() {
  loading.value = true
  try {
    const response = await fetch('/api/documents?organizationId=test-org-123&limit=100')
    if (!response.ok) {
      throw new Error('Failed to load documents')
    }
    const data = await response.json()
    documents.value = data.documents || []
  } catch (error) {
    console.error('Error loading documents:', error)
    documents.value = []
  } finally {
    loading.value = false
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

function handleSearch() {
  const query = searchQuery.value.trim()
  if (query) {
    router.push({ name: 'search', query: { q: query } })
  }
}

// Load documents on mount
onMounted(() => {
  loadDocuments()

  // Auto-refresh every 10 seconds if there are processing documents
  setInterval(() => {
    if (documentsByStatus.value.processing.length > 0) {
      loadDocuments()
    }
  }, 10000)
})
</script>
