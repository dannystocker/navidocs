<template>
  <div class="min-h-screen bg-gradient-to-br from-dark-800 to-dark-900">
    <!-- Header -->
    <header
      class="bg-dark-900/90 backdrop-blur-lg border-b border-dark-700 sticky top-0 z-50 relative"
      :class="[
        isHeaderCollapsed ? 'py-2' : 'py-4',
        scrollInitialized ? 'header-transitions' : ''
      ]"
    >
      <div class="max-w-7xl mx-auto px-6">
        <!-- Top row: Back button, Title, Language (hidden when collapsed) -->
        <div v-show="!isHeaderCollapsed" class="flex items-center justify-between mb-4">
          <button @click="$router.push('/')" class="text-white/70 hover:text-pink-400 flex items-center gap-2 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span class="font-medium">{{ $t('document.back') }}</span>
          </button>

          <div class="text-center flex-1 px-4">
            <h1 class="text-lg font-bold text-white mb-1">{{ documentTitle }}</h1>
            <p class="text-sm text-white/70">{{ boatInfo }}</p>
          </div>

          <div class="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>

        <!-- Collapsed header: Compact back icon + search + nav -->
        <div class="flex items-center gap-3">
          <!-- Compact back button (only visible when collapsed) -->
          <button
            v-show="isHeaderCollapsed"
            @click="$router.push('/')"
            class="text-white/70 hover:text-pink-400 transition-colors p-2 hover:bg-white/10 rounded-lg"
            title="Back to library"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <!-- Search Bar - Always Visible but changes size -->
          <div class="flex-1" :class="isHeaderCollapsed ? 'max-w-2xl' : 'max-w-3xl mx-auto'">
            <div class="relative group">
              <input
                v-model="searchInput"
                @keydown.enter="performSearch"
                @input="handleSearchInput"
                type="text"
                class="w-full px-6 pr-28 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-lg text-white placeholder-white/50 shadow-lg focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/20"
                :class="isHeaderCollapsed ? 'h-10 text-sm' : 'h-16 text-lg'"
                placeholder="Search in document..."
              />
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <button
                  v-if="searchInput"
                  @click="clearSearch"
                  class="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Clear search"
                >
                  <svg :class="isHeaderCollapsed ? 'w-4 h-4' : 'w-5 h-5'" class="text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  @click="performSearch"
                  class="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white shadow-md hover:shadow-lg hover:scale-105"
                  :class="isHeaderCollapsed ? 'w-8 h-8' : 'w-10 h-10'"
                  title="Search"
                >
                  <svg :class="isHeaderCollapsed ? 'w-4 h-4' : 'w-5 h-5'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Search navigation (always visible when there's a search query, inline when collapsed) -->
          <div v-if="searchQuery && isHeaderCollapsed" class="flex items-center gap-2 shrink-0">
            <div class="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-lg">
              <span class="text-white/70 text-xs">
                {{ totalHits === 0 ? '0' : `${currentHitIndex + 1}/${totalHits}` }}
              </span>
              <div class="flex gap-1">
                <button
                  @click="prevHit"
                  :disabled="totalHits === 0"
                  class="px-2 py-1 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded transition-colors text-xs"
                  title="Previous match"
                >
                  ↑
                </button>
                <button
                  @click="nextHit"
                  :disabled="totalHits === 0"
                  class="px-2 py-1 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded transition-colors text-xs"
                  title="Next match"
                >
                  ↓
                </button>
              </div>
            </div>
            <button
              v-if="hitList.length > 0"
              @click="jumpListOpen = !jumpListOpen"
              class="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-xs flex items-center gap-1"
            >
              <span>Jump</span>
              <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-180': jumpListOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Find Bar - Results Navigation (full version when not collapsed) -->
        <div v-if="searchQuery && !isHeaderCollapsed" class="mt-4 bg-white/5 border border-white/10 rounded-lg p-3">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 flex-1">
              <div class="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                <svg class="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span class="text-white font-medium text-sm">{{ searchQuery }}</span>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-white/70 text-sm">
                  {{ totalHits === 0 ? $t('document.findBar.noMatches') : $t('document.findBar.matchCount', { current: currentHitIndex + 1, total: totalHits }) }}
                </span>

                <div class="flex gap-1">
                  <button
                    @click="prevHit"
                    :disabled="totalHits === 0"
                    class="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded transition-colors text-sm border border-white/10"
                    :title="$t('document.findBar.previousMatch')"
                  >
                    ↑
                  </button>
                  <button
                    @click="nextHit"
                    :disabled="totalHits === 0"
                    class="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded transition-colors text-sm border border-white/10"
                    :title="$t('document.findBar.nextMatch')"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>

            <button
              v-if="hitList.length > 0"
              @click="jumpListOpen = !jumpListOpen"
              class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-sm border border-white/10 flex items-center gap-2"
            >
              <span>{{ $t('document.findBar.jumpTo') }}</span>
              <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': jumpListOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <!-- Jump List -->
          <div v-if="jumpListOpen && hitList.length > 0" class="mt-3 pt-3 border-t border-white/10">
            <div class="grid gap-2 max-h-48 overflow-y-auto">
              <button
                v-for="(hit, idx) in hitList.slice(0, 5)"
                :key="idx"
                @click="jumpToHit(idx)"
                class="text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded transition-colors border border-white/10"
                :class="{ 'ring-2 ring-pink-400': idx === currentHitIndex }"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="text-white/70 text-xs font-mono">{{ $t('document.findBar.match') }} {{ idx + 1 }}</span>
                  <span class="text-white/50 text-xs">{{ $t('document.page') }} {{ hit.page }}</span>
                </div>
                <p class="text-white text-sm mt-1 line-clamp-2">{{ hit.snippet }}</p>
              </button>
              <div v-if="hitList.length > 5" class="text-white/50 text-xs text-center py-2">
                + {{ hitList.length - 5 }} more matches
              </div>
            </div>
          </div>
        </div>

        <!-- Jump List for Collapsed Header (positioned absolutely) -->
        <div v-if="jumpListOpen && hitList.length > 0 && isHeaderCollapsed" class="absolute right-6 top-full mt-2 w-96 bg-dark-900/95 backdrop-blur-lg border border-white/10 rounded-lg p-3 shadow-2xl z-50">
          <div class="grid gap-2 max-h-64 overflow-y-auto">
            <button
              v-for="(hit, idx) in hitList.slice(0, 5)"
              :key="idx"
              @click="jumpToHit(idx)"
              class="text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded transition-colors border border-white/10"
              :class="{ 'ring-2 ring-pink-400': idx === currentHitIndex }"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-white/70 text-xs font-mono">Match {{ idx + 1 }}</span>
                <span class="text-white/50 text-xs">Page {{ hit.page }}</span>
              </div>
              <p class="text-white text-sm mt-1 line-clamp-2">{{ hit.snippet }}</p>
            </button>
            <div v-if="hitList.length > 5" class="text-white/50 text-xs text-center py-2">
              + {{ hitList.length - 5 }} more matches
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Compact Navigation - Fixed Position (adjusts based on header collapse) -->
    <div class="fixed right-6 z-40" :class="scrollInitialized ? 'transition-all duration-300' : ''" :style="{ top: isHeaderCollapsed ? '70px' : '160px' }">
      <CompactNav
        :current-page="currentPage"
        :total-pages="totalPages"
        :disabled="isRendering || loading"
        @prev="previousPage"
        @next="nextPage"
        @goto="(page) => { pageInput = page; goToPage(); }"
      />
    </div>

    <!-- PDF Viewer with TOC Sidebar -->
    <main class="viewer-wrapper relative">
      <!-- TOC Sidebar -->
      <TocSidebar
        v-if="documentId"
        :document-id="documentId"
        :current-page="currentPage"
        @navigate-to-page="handleTocJump"
      />

      <!-- PDF Pane -->
      <div class="pdf-pane py-8">
        <div class="max-w-5xl mx-auto px-6">
        <div class="relative">
          <div class="bg-white rounded-2xl shadow-2xl overflow-hidden relative min-h-[520px]">
            <div ref="canvasContainer" class="relative">
              <canvas
                ref="pdfCanvas"
                class="w-full block"
              ></canvas>

              <!-- Text Layer for selectable text -->
              <div
                ref="textLayer"
                class="textLayer"
              ></div>

              <!-- Image Overlays -->
              <ImageOverlay
                v-for="image in pageImages"
                :key="image.id"
                :image="image"
                :canvas-width="canvasWidth"
                :canvas-height="canvasHeight"
                :pdf-scale="pdfScale"
                @click="openImageModal"
              />
            </div>
          </div>

          <!-- Loading Overlay -->
          <div
            v-if="loading || isRendering"
            class="absolute inset-0 bg-dark-900/60 backdrop-blur-sm flex items-center justify-center rounded-2xl"
          >
            <div class="inline-block w-12 h-12 border-4 border-white/20 border-t-pink-400 rounded-full animate-spin"></div>
          </div>

          <!-- Error Overlay -->
          <div
            v-if="error"
            class="absolute inset-0 bg-red-900/70 backdrop-blur-sm flex flex-col items-center justify-center text-center px-10 rounded-2xl"
          >
            <svg class="w-12 h-12 text-red-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-xl font-bold text-white mb-2">Unable to Render Document</h3>
            <p class="text-red-100 mb-4">{{ error }}</p>
            <button
              @click="retryRender"
              class="px-4 py-2 bg-white/10 border border-white/30 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
      </div>
    </main>

    <!-- Full-size Image Modal -->
    <FigureZoom
      v-if="selectedImage"
      :is-open="!!selectedImage"
      :image-src="selectedImageUrl"
      :image-alt="`Image ${selectedImage.imageIndex + 1} from page ${currentPage}`"
      @close="closeImageModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as pdfjsLib from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'
import ImageOverlay from '../components/ImageOverlay.vue'
import FigureZoom from '../components/FigureZoom.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import TocSidebar from '../components/TocSidebar.vue'
import CompactNav from '../components/CompactNav.vue'
import { useDocumentImages } from '../composables/useDocumentImages'

// Configure PDF.js worker - use local worker file instead of CDN
// This works with Vite's bundler and avoids CORS/CDN issues
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

const route = useRoute()

const documentId = ref(route.params.id)
const currentPage = ref(parseInt(route.query.page, 10) || 1)
const pageInput = ref(currentPage.value)
const searchQuery = ref(route.query.q || '')
const searchInput = ref(route.query.q || '')
const totalPages = ref(0)
const documentTitle = ref('Loading...')
const boatInfo = ref('')
const loading = ref(true)
const error = ref(null)
const pdfCanvas = ref(null)
const canvasContainer = ref(null)
const textLayer = ref(null)
const isRendering = ref(false)

// Find bar state
const currentHitIndex = ref(0)
const totalHits = ref(0)
const hitList = ref([])
const jumpListOpen = ref(false)

// TOC state for clickable entries
const tocEntries = ref([])

// PDF rendering scale
const pdfScale = ref(1.5)

// Canvas dimensions
const canvasWidth = ref(0)
const canvasHeight = ref(0)

// Image handling
const { images: pageImages, fetchPageImages, getImageUrl, clearImages } = useDocumentImages()
const selectedImage = ref(null)

// Scroll detection for collapsing header with hysteresis
const scrollY = ref(0)
const scrollInitialized = ref(false)
const isHeaderCollapsed = ref(false)

// Use hysteresis to prevent flickering at threshold
const COLLAPSE_THRESHOLD = 120  // Collapse when scrolling down past 120px
const EXPAND_THRESHOLD = 80     // Expand when scrolling up past 80px

// Computed property for selected image URL
const selectedImageUrl = computed(() => {
  if (!selectedImage.value) return ''
  return getImageUrl(documentId.value, selectedImage.value.id)
})

let pdfDoc = null
let loadingTask = null
let currentRenderTask = null
let componentIsUnmounting = false

async function loadDocument() {
  try {
    loading.value = true
    error.value = null

    const metaResponse = await fetch(`/api/documents/${documentId.value}`)
    if (!metaResponse.ok) throw new Error('Failed to load document metadata')

    const metadata = await metaResponse.json()
    documentTitle.value = metadata.title
    boatInfo.value = `${metadata.boatMake || ''} ${metadata.boatModel || ''} ${metadata.boatYear || ''}`.trim()

    // Load TOC entries
    try {
      const tocResponse = await fetch(`/api/documents/${documentId.value}/toc?format=flat`)
      if (tocResponse.ok) {
        const tocData = await tocResponse.json()
        tocEntries.value = tocData.entries || []
      }
    } catch (tocError) {
      console.warn('Could not load TOC:', tocError)
    }

    const pdfUrl = `/api/documents/${documentId.value}/pdf`
    loadingTask = pdfjsLib.getDocument(pdfUrl)
    pdfDoc = await loadingTask.promise

    totalPages.value = pdfDoc.numPages

    await renderPage(currentPage.value)
  } catch (err) {
    console.error('Error loading document:', err)
    error.value = err.message || 'Unable to load document.'
  } finally {
    loading.value = false
  }
}

function highlightSearchTerms() {
  if (!textLayer.value || !searchQuery.value) {
    totalHits.value = 0
    hitList.value = []
    currentHitIndex.value = 0
    return
  }

  const spans = textLayer.value.querySelectorAll('span')
  const query = searchQuery.value.toLowerCase().trim()
  const hits = []
  let hitIndex = 0

  spans.forEach(span => {
    const text = span.textContent
    if (!text) return

    const lowerText = text.toLowerCase()
    if (lowerText.includes(query)) {
      // Create a highlighted version with data attributes
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      const highlightedText = text.replace(regex, (match) => {
        const idx = hitIndex
        hitIndex++
        return `<mark class="search-highlight" data-hit-index="${idx}">${match}</mark>`
      })

      span.innerHTML = highlightedText

      // Collect hit information for jump list
      const snippet = text.length > 100 ? text.substring(0, 100) + '...' : text
      const marks = span.querySelectorAll('mark')
      marks.forEach((mark) => {
        hits.push({
          element: mark,
          snippet: snippet,
          page: currentPage.value,
          index: parseInt(mark.getAttribute('data-hit-index'))
        })
      })
    }
  })

  totalHits.value = hits.length
  hitList.value = hits
  currentHitIndex.value = 0

  // Scroll to first match
  if (hits.length > 0) {
    scrollToHit(0)
  }
}

function scrollToHit(index) {
  if (index < 0 || index >= hitList.value.length) return

  const hit = hitList.value[index]
  if (!hit || !hit.element) return

  // Remove active class from all marks
  hitList.value.forEach(h => {
    if (h.element) {
      h.element.classList.remove('search-highlight-active')
    }
  })

  // Add active class to current hit
  hit.element.classList.add('search-highlight-active')

  // Scroll to current hit
  setTimeout(() => {
    hit.element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 100)
}

function nextHit() {
  if (totalHits.value === 0) return

  currentHitIndex.value = (currentHitIndex.value + 1) % totalHits.value
  scrollToHit(currentHitIndex.value)
}

function prevHit() {
  if (totalHits.value === 0) return

  currentHitIndex.value = currentHitIndex.value === 0
    ? totalHits.value - 1
    : currentHitIndex.value - 1
  scrollToHit(currentHitIndex.value)
}

function jumpToHit(index) {
  if (index < 0 || index >= hitList.value.length) return

  currentHitIndex.value = index
  scrollToHit(index)
  jumpListOpen.value = false
}

function performSearch() {
  const query = searchInput.value.trim()
  if (!query) {
    clearSearch()
    return
  }

  searchQuery.value = query

  // Re-highlight search terms on current page
  if (textLayer.value) {
    highlightSearchTerms()
  }
}

function clearSearch() {
  searchInput.value = ''
  searchQuery.value = ''
  totalHits.value = 0
  hitList.value = []
  currentHitIndex.value = 0
  jumpListOpen.value = false

  // Remove highlights
  if (textLayer.value) {
    const marks = textLayer.value.querySelectorAll('mark.search-highlight')
    marks.forEach(mark => {
      const text = mark.textContent
      mark.replaceWith(text)
    })
  }
}

function handleSearchInput() {
  // Optional: Auto-search as user types (with debounce)
  // For now, require Enter key or button click
}

function makeTocEntriesClickable() {
  if (!textLayer.value || tocEntries.value.length === 0) return

  const spans = textLayer.value.querySelectorAll('span')

  // Build full text content from all spans to handle multi-span entries
  let fullText = ''
  const spanMap = []
  spans.forEach((span, idx) => {
    const text = span.textContent || ''
    spanMap.push({
      span,
      start: fullText.length,
      end: fullText.length + text.length,
      text
    })
    fullText += text
  })

  let matchCount = 0

  // Check ALL TOC entries against current page's text
  tocEntries.value.forEach(entry => {
    const titleText = entry.title?.trim()
    if (!titleText) return

    // Look for the title in the full text (case-insensitive, partial match)
    const titleWords = titleText.toLowerCase().split(/\s+/).slice(0, 5) // First 5 words
    const searchPattern = titleWords.join('.*?')
    const regex = new RegExp(searchPattern, 'i')

    if (regex.test(fullText.toLowerCase())) {
      const match = fullText.toLowerCase().match(regex)
      if (match) {
        const matchStart = match.index
        const matchEnd = matchStart + match[0].length
        matchCount++

        // Find all spans that are part of this match
        spanMap.forEach(({ span, start, end }) => {
          if ((start >= matchStart && start < matchEnd) || (end > matchStart && end <= matchEnd) || (start <= matchStart && end >= matchEnd)) {
            // This span is part of the match
            span.classList.add('toc-entry-link')
            span.style.cursor = 'pointer'
            span.setAttribute('data-target-page', entry.page_start)
            span.setAttribute('title', `Go to page ${entry.page_start}`)

            // Add click handler (only once)
            if (!span.hasAttribute('data-click-handler')) {
              span.setAttribute('data-click-handler', 'true')
              span.addEventListener('click', (e) => {
                e.preventDefault()
                e.stopPropagation()
                const targetPage = parseInt(span.getAttribute('data-target-page'))
                if (targetPage && targetPage >= 1 && targetPage <= totalPages.value) {
                  console.log(`Navigating to page ${targetPage}`)
                  pageInput.value = targetPage
                  goToPage()
                }
              })
            }
          }
        })
      }
    }
  })

  if (matchCount > 0) {
    console.log(`Made ${matchCount} TOC entries clickable on page ${currentPage.value}`)
  }
}

async function renderPage(pageNum) {
  if (!pdfDoc || componentIsUnmounting) return

  try {
    await ensureCanvasReady()

    if (currentRenderTask) {
      currentRenderTask.cancel()
      try {
        await currentRenderTask.promise
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Unexpected render cancellation error:', err)
        }
      } finally {
        currentRenderTask = null
      }
    }

    isRendering.value = true
    error.value = null

    const page = await pdfDoc.getPage(pageNum)
    const viewport = page.getViewport({ scale: pdfScale.value })
    const canvas = pdfCanvas.value
    const context = canvas.getContext('2d', { alpha: false })

    if (!context) {
      throw new Error('Failed to obtain 2D rendering context')
    }

    canvas.width = viewport.width
    canvas.height = viewport.height
    canvasWidth.value = viewport.width
    canvasHeight.value = viewport.height

    const renderTask = page.render({ canvasContext: context, viewport })
    currentRenderTask = renderTask

    try {
      await renderTask.promise
    } catch (err) {
      if (err?.name === 'RenderingCancelledException') {
        return
      }
      throw err
    } finally {
      currentRenderTask = null
    }

    // Render text layer for selectable text
    if (textLayer.value) {
      textLayer.value.innerHTML = ''
      textLayer.value.style.width = `${viewport.width}px`
      textLayer.value.style.height = `${viewport.height}px`

      try {
        const textContent = await page.getTextContent()

        // PDF.js 4.x uses TextLayer class instead of renderTextLayer function
        const textLayerRender = new pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayer.value,
          viewport: viewport
        })
        await textLayerRender.render()

        // Highlight search terms if query exists
        if (searchQuery.value) {
          await nextTick()
          highlightSearchTerms()
        }

        // Make TOC entries clickable
        await nextTick()
        makeTocEntriesClickable()
      } catch (textErr) {
        console.warn('Failed to render text layer:', textErr)
      }
    }

    clearImages()
    await fetchPageImages(documentId.value, pageNum)
  } catch (err) {
    if (err?.name === 'RenderingCancelledException') {
      return
    }

    console.error('Error rendering page:', err)
    error.value = `Failed to render PDF page ${pageNum}: ${err.message || err}`
  } finally {
    isRendering.value = false
  }
}

async function ensureCanvasReady(maxAttempts = 20) {
  if (pdfCanvas.value) return pdfCanvas.value

  await nextTick()

  let attempts = 0
  while (!pdfCanvas.value && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 25))
    attempts += 1
  }

  if (!pdfCanvas.value) {
    throw new Error('Canvas element not mounted')
  }

  return pdfCanvas.value
}

async function nextPage() {
  if (isRendering.value || currentPage.value >= totalPages.value) return
  currentPage.value += 1
  pageInput.value = currentPage.value
  await renderPage(currentPage.value)

  // Update URL hash and dispatch event
  window.location.hash = `#p=${currentPage.value}`
  window.dispatchEvent(new CustomEvent('navidocs:pagechange', {
    detail: { page: currentPage.value }
  }))
}

async function previousPage() {
  if (isRendering.value || currentPage.value <= 1) return
  currentPage.value -= 1
  pageInput.value = currentPage.value
  await renderPage(currentPage.value)

  // Update URL hash and dispatch event
  window.location.hash = `#p=${currentPage.value}`
  window.dispatchEvent(new CustomEvent('navidocs:pagechange', {
    detail: { page: currentPage.value }
  }))
}

async function goToPage() {
  const page = parseInt(pageInput.value, 10)
  if (Number.isNaN(page)) {
    pageInput.value = currentPage.value
    return
  }

  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    await renderPage(currentPage.value)

    // Update URL hash for deep linking
    window.location.hash = `#p=${currentPage.value}`

    // Dispatch custom event for page change
    window.dispatchEvent(new CustomEvent('navidocs:pagechange', {
      detail: { page: currentPage.value }
    }))
  } else {
    pageInput.value = currentPage.value
  }
}

// Handle TOC navigation jumps
function handleTocJump(pageNumber) {
  const clamped = Math.max(1, Math.min(pageNumber, totalPages.value))
  pageInput.value = clamped
  goToPage()
}

watch(
  () => route.query.page,
  async (newPage) => {
    if (!newPage || !pdfDoc) return
    const parsed = parseInt(newPage, 10)
    if (Number.isNaN(parsed) || parsed === currentPage.value) return
    currentPage.value = parsed
    pageInput.value = currentPage.value
    await renderPage(currentPage.value)
  }
)

watch(
  () => route.params.id,
  async (newId) => {
    if (!newId || newId === documentId.value) return

    documentId.value = newId
    currentPage.value = parseInt(route.query.page, 10) || 1
    pageInput.value = currentPage.value

    await resetDocumentState()
    await loadDocument()
  }
)

function openImageModal(image) {
  selectedImage.value = image
}

function closeImageModal() {
  selectedImage.value = null
}

async function retryRender() {
  if (!pdfDoc || componentIsUnmounting) return
  error.value = null
  await renderPage(currentPage.value)
}

async function resetDocumentState() {
  clearImages()

  if (currentRenderTask) {
    currentRenderTask.cancel()
    try {
      await currentRenderTask.promise
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Unexpected render cancellation error:', err)
      }
    } finally {
      currentRenderTask = null
    }
  }

  if (loadingTask) {
    try {
      await loadingTask.destroy()
    } catch (err) {
      console.warn('Failed to destroy loading task:', err)
    } finally {
      loadingTask = null
    }
  }

  if (pdfDoc) {
    try {
      await pdfDoc.destroy()
    } catch (err) {
      console.warn('Failed to destroy PDF document:', err)
    } finally {
      pdfDoc = null
    }
  }
}

onMounted(() => {
  loadDocument()

  // Handle deep links (#p=12)
  const hash = window.location.hash
  if (hash.startsWith('#p=')) {
    const pageNum = parseInt(hash.substring(3), 10)
    if (!Number.isNaN(pageNum) && pageNum >= 1) {
      currentPage.value = pageNum
      pageInput.value = pageNum
    }
  }

  // Scroll detection for collapsing header with debouncing and RAF
  let rafId = null
  let scrollTimeout = null
  let lastScrollY = 0

  const handleScroll = () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
    }

    rafId = requestAnimationFrame(() => {
      const currentScrollY = window.scrollY
      scrollY.value = currentScrollY

      // Apply hysteresis to prevent flickering at threshold
      if (!isHeaderCollapsed.value && currentScrollY > COLLAPSE_THRESHOLD) {
        // Scrolling down past collapse threshold
        isHeaderCollapsed.value = true
      } else if (isHeaderCollapsed.value && currentScrollY < EXPAND_THRESHOLD) {
        // Scrolling up past expand threshold
        isHeaderCollapsed.value = false
      }

      lastScrollY = currentScrollY
      rafId = null
    })
  }

  // Delay initialization to prevent flickering on load
  setTimeout(() => {
    scrollInitialized.value = true
    const initialScrollY = window.scrollY
    scrollY.value = initialScrollY
    lastScrollY = initialScrollY

    // Set initial collapsed state based on scroll position
    if (initialScrollY > COLLAPSE_THRESHOLD) {
      isHeaderCollapsed.value = true
    }
  }, 300)

  window.addEventListener('scroll', handleScroll, { passive: true })

  // Listen for hash changes
  const handleHashChange = () => {
    const newHash = window.location.hash
    if (newHash.startsWith('#p=')) {
      const pageNum = parseInt(newHash.substring(3), 10)
      if (!Number.isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages.value) {
        pageInput.value = pageNum
        goToPage()
      }
    }
  }

  window.addEventListener('hashchange', handleHashChange)

  // Clean up listeners
  onBeforeUnmount(() => {
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('hashchange', handleHashChange)
  })
})

onBeforeUnmount(() => {
  componentIsUnmounting = true

  const cleanup = async () => {
    await resetDocumentState()
  }

  cleanup()
})
</script>

<style>
/* PDF.js text layer styles for selectable text */
.textLayer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 1;
  line-height: 1.0;
  pointer-events: auto;
  user-select: text;
  z-index: 2;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}

.textLayer > span {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  pointer-events: auto;
}

.textLayer ::selection {
  background: rgba(255, 92, 178, 0.3);
}

.textLayer ::-moz-selection {
  background: rgba(255, 92, 178, 0.3);
}

/* Search highlighting */
.search-highlight {
  background-color: rgba(255, 215, 0, 0.6);
  color: #000 !important;  /* Force text visible */
  padding: 2px 0;
  border-radius: 2px;
  font-weight: 600;
  transition: background-color 0.2s ease;
  opacity: 1 !important;  /* Ensure mark is visible */
}

.search-highlight-active {
  background-color: rgba(255, 92, 178, 0.8) !important;
  color: #fff !important;  /* Force white text visible */
  box-shadow: 0 0 0 2px rgba(255, 92, 178, 0.4);
  animation: active-pulse 1.5s ease-in-out;
  opacity: 1 !important;  /* Ensure active mark is visible */
}

@keyframes active-pulse {
  0%, 100% {
    background-color: rgba(255, 92, 178, 0.8);
  }
  50% {
    background-color: rgba(255, 92, 178, 1);
  }
}

.viewer-wrapper {
  min-height: calc(100vh - 64px); /* Account for header */
}

.pdf-pane {
  overflow-x: auto;
}

/* Clickable TOC entries in PDF */
.textLayer span.toc-entry-link {
  cursor: pointer !important;
  transition: all 0.15s ease;
}

.textLayer span.toc-entry-link:hover {
  background-color: rgba(236, 72, 153, 0.1);
  box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.2);
}

/* Header transitions - only applied after initialization to prevent flickering */
.header-transitions {
  transition: padding 0.3s ease, height 0.3s ease;
  will-change: padding, height;
}

.header-transitions * {
  transition: all 0.3s ease;
}
</style>
