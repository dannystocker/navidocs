<template>
  <div class="min-h-screen bg-gradient-to-br from-dark-800 to-dark-900">
    <!-- Header -->
    <header class="bg-dark-900/90 backdrop-blur-lg border-b border-dark-700 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <button @click="$router.push('/')" class="text-dark-300 hover:text-white flex items-center gap-2 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span class="font-medium">Back</span>
          </button>

          <div class="text-center flex-1 px-4">
            <h1 class="text-lg font-bold text-white mb-1">{{ documentTitle }}</h1>
            <p class="text-sm text-dark-400">{{ boatInfo }}</p>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-dark-300 text-sm">Page {{ currentPage }} / {{ totalPages }}</span>
          </div>
        </div>

        <!-- Page Controls -->
        <div class="flex items-center justify-center gap-4 mt-4">
          <button
            @click="previousPage"
            :disabled="currentPage <= 1"
            class="px-4 py-2 bg-dark-700 hover:bg-dark-600 disabled:bg-dark-800 disabled:text-dark-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div class="flex items-center gap-2">
            <input
              v-model.number="pageInput"
              @keypress.enter="goToPage"
              type="number"
              min="1"
              :max="totalPages"
              class="w-16 px-3 py-2 bg-dark-700 text-white rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button @click="goToPage" class="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
              Go
            </button>
          </div>

          <button
            @click="nextPage"
            :disabled="currentPage >= totalPages"
            class="px-4 py-2 bg-dark-700 hover:bg-dark-600 disabled:bg-dark-800 disabled:text-dark-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            Next
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- PDF Viewer -->
    <main class="relative py-8">
      <div class="max-w-5xl mx-auto px-6">
        <div v-if="loading" class="flex items-center justify-center py-20">
          <div class="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>

        <div v-else-if="error" class="bg-red-900/20 border border-red-500/50 rounded-2xl p-8 text-center">
          <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="text-xl font-bold text-white mb-2">Error Loading Document</h3>
          <p class="text-red-300">{{ error }}</p>
        </div>

        <div v-else class="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <canvas
            ref="pdfCanvas"
            class="w-full"
          ></canvas>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker - use local worker file instead of CDN
// This works with Vite's bundler and avoids CORS/CDN issues
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

const route = useRoute()

const documentId = ref(route.params.id)
const currentPage = ref(parseInt(route.query.page) || 1)
const pageInput = ref(currentPage.value)
const totalPages = ref(0)
const documentTitle = ref('Loading...')
const boatInfo = ref('')
const loading = ref(true)
const error = ref(null)
const pdfCanvas = ref(null)
const pdfDoc = ref(null)
const isRendering = ref(false)

async function loadDocument() {
  try {
    loading.value = true
    error.value = null

    // Fetch document metadata
    const metaResponse = await fetch(`/api/documents/${documentId.value}`)
    if (!metaResponse.ok) throw new Error('Failed to load document metadata')

    const metadata = await metaResponse.json()
    documentTitle.value = metadata.title
    boatInfo.value = `${metadata.boatMake || ''} ${metadata.boatModel || ''} ${metadata.boatYear || ''}`.trim()

    // Load PDF
    const pdfUrl = `/api/documents/${documentId.value}/pdf`
    const loadingTask = pdfjsLib.getDocument(pdfUrl)
    pdfDoc.value = await loadingTask.promise

    totalPages.value = pdfDoc.value.numPages

    await renderPage(currentPage.value)
    loading.value = false
  } catch (err) {
    console.error('Error loading document:', err)
    error.value = err.message
    loading.value = false
  }
}

async function renderPage(pageNum) {
  if (!pdfDoc.value || !pdfCanvas.value) return

  // Prevent concurrent renders - wait for current one to finish
  if (isRendering.value) {
    console.log('Already rendering, skipping...')
    return
  }

  isRendering.value = true
  error.value = null

  try {
    const page = await pdfDoc.value.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1.5 })

    const canvas = pdfCanvas.value
    const context = canvas.getContext('2d')

    canvas.height = viewport.height
    canvas.width = viewport.width

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }

    await page.render(renderContext).promise
  } catch (err) {
    console.error('Error rendering page:', err)
    error.value = `Failed to render PDF page ${pageNum}: ${err.message}`
  } finally {
    isRendering.value = false
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    pageInput.value = currentPage.value
    renderPage(currentPage.value)
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    pageInput.value = currentPage.value
    renderPage(currentPage.value)
  }
}

function goToPage() {
  const page = parseInt(pageInput.value)
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    renderPage(currentPage.value)
  } else {
    pageInput.value = currentPage.value
  }
}

watch(() => route.query.page, (newPage) => {
  if (newPage) {
    currentPage.value = parseInt(newPage)
    pageInput.value = currentPage.value
    renderPage(currentPage.value)
  }
})

onMounted(() => {
  loadDocument()
})
</script>
