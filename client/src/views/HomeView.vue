<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
    <!-- Header -->
    <header class="bg-white shadow-soft">
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
              <!-- Boat icon placeholder -->
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21l9-9m0 0l9 9M12 12V3m0 9l-9 9" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-dark-900">NaviDocs</h1>
              <p class="text-sm text-dark-600">Professional Boat Manual Management</p>
            </div>
          </div>
          <button @click="showUploadModal = true" class="btn btn-primary">
            Upload Manual
          </button>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <main class="max-w-7xl mx-auto px-6 py-12">
      <div class="text-center mb-12">
        <h2 class="text-5xl font-bold text-dark-900 mb-4">
          Your Boat Manuals,
          <span class="text-primary-500">Searchable & Organized</span>
        </h2>
        <p class="text-xl text-dark-600 max-w-2xl mx-auto">
          Upload PDFs, extract text with OCR, and find what you need in milliseconds.
          Built for boat owners who value their time.
        </p>
      </div>

      <!-- Search Bar -->
      <div class="search-bar mb-16">
        <div class="relative">
          <input
            type="text"
            class="search-input"
            placeholder="Search your manuals..."
            @keypress.enter="handleSearch"
          />
          <div class="absolute right-4 top-1/2 transform -translate-y-1/2">
            <svg class="w-6 h-6 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div class="card text-center">
          <div class="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-dark-900 mb-2">Upload PDFs</h3>
          <p class="text-dark-600">Drag and drop your boat manuals. We'll handle the rest.</p>
        </div>

        <div class="card text-center">
          <div class="w-16 h-16 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-dark-900 mb-2">Intelligent Search</h3>
          <p class="text-dark-600">Find "bilge pump" even when the manual says "sump".</p>
        </div>

        <div class="card text-center">
          <div class="w-16 h-16 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-dark-900 mb-2">Offline Ready</h3>
          <p class="text-dark-600">Access your manuals even when you're out on the water.</p>
        </div>
      </div>

      <!-- Recent Documents -->
      <div>
        <h3 class="text-2xl font-bold text-dark-900 mb-6">Recent Documents</h3>
        <div class="card">
          <p class="text-dark-600 text-center py-8">
            No documents yet. Upload your first boat manual to get started.
          </p>
        </div>
      </div>
    </main>

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

function handleSearch(event) {
  const query = event.target.value.trim()
  if (query) {
    router.push({ name: 'search', query: { q: query } })
  }
}
</script>
