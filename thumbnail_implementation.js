// ============================================================================
// THUMBNAIL GENERATION IMPLEMENTATION FOR NAVIDOCS DOCUMENTVIEW
// Agent 7 of 10 - Apple Preview-style Search with Page Thumbnails
// ============================================================================

// Add these state variables after line 356 (after searchStats computed property):

// Thumbnail cache and state for search results
const thumbnailCache = new Map() // pageNum -> dataURL
const thumbnailLoading = ref(new Set()) // Track which thumbnails are currently loading

// ============================================================================
// Add these functions after makeTocEntriesClickable() function (around line 837):

/**
 * Generate thumbnail for a specific page
 * @param {number} pageNum - Page number to generate thumbnail for
 * @returns {Promise<string>} Data URL of the thumbnail image
 */
async function generateThumbnail(pageNum) {
  // Check cache first
  if (thumbnailCache.has(pageNum)) {
    return thumbnailCache.get(pageNum)
  }

  // Check if already loading
  if (thumbnailLoading.value.has(pageNum)) {
    // Wait for the thumbnail to be generated
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (thumbnailCache.has(pageNum)) {
          clearInterval(checkInterval)
          resolve(thumbnailCache.get(pageNum))
        }
      }, 100)
    })
  }

  // Mark as loading
  thumbnailLoading.value.add(pageNum)

  try {
    if (!pdfDoc) {
      throw new Error('PDF document not loaded')
    }

    const page = await pdfDoc.getPage(pageNum)

    // Use small scale for thumbnail (0.2 = 20% of original size)
    // This produces roughly 80x100px thumbnails for standard letter-sized pages
    const viewport = page.getViewport({ scale: 0.2 })

    // Create canvas for thumbnail rendering
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { alpha: false })

    if (!context) {
      throw new Error('Failed to get canvas context for thumbnail')
    }

    canvas.width = viewport.width
    canvas.height = viewport.height

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise

    // Convert canvas to data URL
    const dataURL = canvas.toDataURL('image/png', 0.8) // 0.8 quality for smaller file size

    // Cache the thumbnail
    thumbnailCache.set(pageNum, dataURL)

    return dataURL
  } catch (err) {
    console.error(`Failed to generate thumbnail for page ${pageNum}:`, err)
    // Return a placeholder or empty data URL
    return ''
  } finally {
    // Remove from loading set
    thumbnailLoading.value.delete(pageNum)
  }
}

/**
 * Check if a thumbnail is currently being generated
 * @param {number} pageNum - Page number to check
 * @returns {boolean} True if thumbnail is loading
 */
function isThumbnailLoading(pageNum) {
  return thumbnailLoading.value.has(pageNum)
}

/**
 * Get thumbnail for a page, generating if needed
 * @param {number} pageNum - Page number
 * @returns {Promise<string>} Data URL of thumbnail
 */
async function getThumbnail(pageNum) {
  return await generateThumbnail(pageNum)
}

/**
 * Clear thumbnail cache (useful when document changes)
 */
function clearThumbnailCache() {
  thumbnailCache.clear()
  thumbnailLoading.value.clear()
}

// ============================================================================
// TEMPLATE USAGE EXAMPLE
// ============================================================================
// Add this to your template where search results are displayed:

/*
<template>
  <!-- Jump List with Thumbnails -->
  <div v-if="jumpListOpen && hitList.length > 0" class="search-results-sidebar">
    <div class="grid gap-2 max-h-96 overflow-y-auto">
      <button
        v-for="(hit, idx) in hitList.slice(0, 10)"
        :key="idx"
        @click="jumpToHit(idx)"
        class="search-result-item flex gap-3 p-2 bg-white/5 hover:bg-white/10 rounded transition-colors border border-white/10"
        :class="{ 'ring-2 ring-pink-400': idx === currentHitIndex }"
      >
        <!-- Thumbnail -->
        <div class="thumbnail-container flex-shrink-0">
          <div
            v-if="isThumbnailLoading(hit.page)"
            class="w-20 h-25 bg-white/10 rounded flex items-center justify-center"
          >
            <div class="w-4 h-4 border-2 border-white/30 border-t-pink-400 rounded-full animate-spin"></div>
          </div>
          <img
            v-else
            :src="getThumbnail(hit.page)"
            alt="`Page ${hit.page} thumbnail`"
            class="w-20 h-auto rounded shadow-md"
            loading="lazy"
          />
        </div>

        <!-- Match Info -->
        <div class="flex-1 text-left">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-white/70 text-xs font-mono">Match {{ idx + 1 }}</span>
            <span class="text-white/50 text-xs">Page {{ hit.page }}</span>
          </div>
          <p class="text-white text-sm line-clamp-2">{{ hit.snippet }}</p>
        </div>
      </button>
    </div>
  </div>
</template>
*/

// ============================================================================
// USAGE NOTES
// ============================================================================
/*
1. Thumbnails are automatically cached after first generation
2. Multiple requests for the same page thumbnail will wait for the first to complete
3. Call clearThumbnailCache() when switching documents or on cleanup
4. Thumbnails are generated at 0.2 scale (20% of original size) for performance
5. The loading state is tracked in thumbnailLoading Set for UI feedback
6. getThumbnail() is the main function to call from templates (async)
7. isThumbnailLoading() checks if a thumbnail is currently being generated

INTEGRATION STEPS:
1. Add state variables (thumbnailCache, thumbnailLoading) around line 380
2. Add functions (generateThumbnail, isThumbnailLoading, getThumbnail, clearThumbnailCache) around line 837
3. Update template to show thumbnails in search results
4. Call clearThumbnailCache() in resetDocumentState() function
5. Make getThumbnail and isThumbnailLoading available in template (expose via return or export)

PERFORMANCE CONSIDERATIONS:
- Thumbnails are generated on-demand (lazy loading)
- Cache prevents regeneration for visited pages
- Small scale (0.2) keeps memory usage low
- PNG quality set to 0.8 for balance between size and quality
- Loading state prevents duplicate generation requests
*/
