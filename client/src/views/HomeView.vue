<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
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
              <p class="text-xs text-dark-500">Marine Document Intelligence</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button @click="$router.push('/jobs')" class="px-4 py-2 text-dark-700 hover:text-primary-600 font-medium transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg">
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
        <h2 class="text-6xl font-black text-dark-900 mb-6 leading-tight">
          Marine Documentation,
          <br />
          <span class="bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600 bg-clip-text text-transparent">
            Lightning Fast Search
          </span>
        </h2>
        <p class="text-xl text-dark-600 max-w-3xl mx-auto leading-relaxed">
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
              class="w-full h-16 px-6 pr-14 rounded-2xl border-2 border-dark-100 bg-white shadow-lg focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all duration-200 text-lg placeholder-dark-400"
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
        <p class="text-center text-sm text-dark-500 mt-4">
          <kbd class="px-2 py-1 bg-dark-100 rounded text-xs font-mono">Enter</kbd> to search
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
            <h3 class="text-xl font-bold text-dark-900 mb-3 text-center">Upload PDFs</h3>
            <p class="text-dark-600 text-center leading-relaxed">Drag and drop your boat manuals. Automatic OCR extraction handles scanned documents.</p>
          </div>
        </div>

        <div class="group relative">
          <div class="relative glass rounded-2xl p-8 hover:shadow-xl transition-all duration-300 accent-border">
            <div class="w-14 h-14 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg transform group-hover:scale-110 transition duration-300">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-dark-900 mb-3 text-center">Lightning Search</h3>
            <p class="text-dark-600 text-center leading-relaxed">Find "bilge pump" even when the manual says "sump pump". Typo-tolerant with synonyms.</p>
          </div>
        </div>

        <div class="group relative">
          <div class="relative glass rounded-2xl p-8 hover:shadow-xl transition-all duration-300 accent-border">
            <div class="w-14 h-14 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg transform group-hover:scale-110 transition duration-300">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-dark-900 mb-3 text-center">Offline Ready</h3>
            <p class="text-dark-600 text-center leading-relaxed">Access your manuals 20 miles offshore. Progressive Web App works without internet.</p>
          </div>
        </div>
      </div>

      <!-- Recent Documents -->
      <div>
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-3xl font-bold text-dark-900">Recent Documents</h3>
          <button @click="showUploadModal = true" class="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Document
          </button>
        </div>
        <div class="glass rounded-2xl p-12">
          <div class="text-center">
            <div class="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 class="text-xl font-bold text-dark-900 mb-2">No documents yet</h4>
            <p class="text-dark-600 mb-6 max-w-md mx-auto">
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
      </div>
    </main>

    <!-- Footer -->
    <footer class="glass border-t border-dark-100 mt-20">
      <div class="max-w-7xl mx-auto px-6 py-8">
        <div class="flex items-center justify-between text-sm text-dark-600">
          <p>© 2025 NaviDocs. Built for mariners.</p>
          <div class="flex items-center gap-2">
            <span>Powered by</span>
            <span class="font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Meilisearch</span>
          </div>
        </div>
      </div>
    </footer>

    <!-- Upload Modal -->
    <UploadModal :isOpen="showUploadModal" @close="showUploadModal = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import UploadModal from '../components/UploadModal.vue'

const router = useRouter()
const showUploadModal = ref(false)
const searchQuery = ref('')

function handleSearch() {
  const query = searchQuery.value.trim()
  if (query) {
    router.push({ name: 'search', query: { q: query } })
  }
}
</script>
