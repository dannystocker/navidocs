<template>
  <div class="min-h-screen bg-dark-800 text-white">
    <!-- Header -->
    <header class="bg-dark-900 border-b border-dark-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <button @click="$router.push('/')" class="text-dark-300 hover:text-white flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <div class="text-center flex-1">
          <h1 class="text-lg font-semibold">{{ documentTitle }}</h1>
          <p class="text-sm text-dark-400">Page {{ currentPage }} of {{ totalPages }}</p>
        </div>

        <div class="w-24"></div>
      </div>
    </header>

    <!-- PDF Viewer -->
    <main class="relative h-[calc(100vh-80px)]">
      <div class="flex items-center justify-center h-full">
        <p class="text-dark-400">PDF viewer will be implemented here (PDF.js)</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const documentId = ref(route.params.id)
const currentPage = ref(parseInt(route.query.page) || 1)
const totalPages = ref(0)
const documentTitle = ref('Loading...')

onMounted(async () => {
  // TODO: Fetch document metadata
  documentTitle.value = 'Sample Manual'
  totalPages.value = 100
})
</script>
