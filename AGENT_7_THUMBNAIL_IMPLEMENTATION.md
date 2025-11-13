# Agent 7 - Page Thumbnail Generation for Search Results

## Mission
Generate small page thumbnails (80x100px) for search results sidebar in Apple Preview style.

## Implementation Overview

### 1. State Variables
Added to `/home/setup/navidocs/client/src/views/DocumentView.vue` around line 380:

```javascript
// Thumbnail cache and state for search results
const thumbnailCache = new Map() // pageNum -> dataURL
const thumbnailLoading = ref(new Set()) // Track which thumbnails are currently loading
```

### 2. Core Functions

#### `generateThumbnail(pageNum)`
Main thumbnail generation function with caching and loading state management.

**Features:**
- Checks cache first (avoids regeneration)
- Prevents duplicate requests (waits if already loading)
- Uses PDF.js to render page at 0.2 scale (20% of original)
- Returns PNG data URL with 0.8 quality for optimal size
- Error handling with fallback to empty string

**Implementation:**
```javascript
async function generateThumbnail(pageNum) {
  // Check cache first
  if (thumbnailCache.has(pageNum)) {
    return thumbnailCache.get(pageNum)
  }

  // Check if already loading
  if (thumbnailLoading.value.has(pageNum)) {
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
    const viewport = page.getViewport({ scale: 0.2 })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { alpha: false })

    if (!context) {
      throw new Error('Failed to get canvas context for thumbnail')
    }

    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise

    const dataURL = canvas.toDataURL('image/png', 0.8)

    thumbnailCache.set(pageNum, dataURL)
    return dataURL
  } catch (err) {
    console.error(`Failed to generate thumbnail for page ${pageNum}:`, err)
    return ''
  } finally {
    thumbnailLoading.value.delete(pageNum)
  }
}
```

#### `isThumbnailLoading(pageNum)`
Check if a thumbnail is currently being generated.

```javascript
function isThumbnailLoading(pageNum) {
  return thumbnailLoading.value.has(pageNum)
}
```

#### `getThumbnail(pageNum)`
Convenience wrapper for template usage.

```javascript
async function getThumbnail(pageNum) {
  return await generateThumbnail(pageNum)
}
```

#### `clearThumbnailCache()`
Clear all cached thumbnails and loading states.

```javascript
function clearThumbnailCache() {
  thumbnailCache.clear()
  thumbnailLoading.value.clear()
}
```

### 3. Template Integration

Example usage in search results sidebar:

```vue
<template>
  <!-- Jump List with Thumbnails -->
  <div v-if="jumpListOpen && hitList.length > 0" class="search-results-sidebar">
    <div class="grid gap-2 max-h-96 overflow-y-auto">
      <button
        v-for="(hit, idx) in hitList.slice(0, 10)"
        :key="idx"
        @click="jumpToHit(idx)"
        class="search-result-item flex gap-3 p-2 bg-white/5 hover:bg-white/10 rounded"
        :class="{ 'ring-2 ring-pink-400': idx === currentHitIndex }"
      >
        <!-- Thumbnail -->
        <div class="thumbnail-container flex-shrink-0">
          <!-- Loading Placeholder -->
          <div
            v-if="isThumbnailLoading(hit.page)"
            class="w-20 h-25 bg-white/10 rounded flex items-center justify-center"
          >
            <div class="w-4 h-4 border-2 border-white/30 border-t-pink-400 rounded-full animate-spin"></div>
          </div>

          <!-- Thumbnail Image -->
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
```

### 4. Cleanup Integration

Add to `resetDocumentState()` function:

```javascript
async function resetDocumentState() {
  clearImages()
  clearThumbnailCache() // Add this line

  // ... rest of cleanup code
}
```

## Technical Specifications

### Thumbnail Size
- **Scale:** 0.2 (20% of original page size)
- **Expected dimensions:** ~80x100px for letter-sized pages
- **Format:** PNG with 0.8 quality
- **Output:** Base64-encoded data URL

### Performance Optimizations
1. **Caching:** Once generated, thumbnails are stored in Map
2. **Lazy loading:** Generated only when needed
3. **Duplicate prevention:** Multiple requests wait for first to complete
4. **Memory efficient:** Small scale keeps data size minimal
5. **Loading states:** UI feedback prevents user confusion

### Cache Management
- **Cache key:** Page number (integer)
- **Cache value:** Data URL string
- **Cache lifetime:** Until document change or manual clear
- **Memory usage:** ~5-10KB per thumbnail

## Integration Checklist

- [x] State variables added (thumbnailCache, thumbnailLoading)
- [x] Core functions implemented (generateThumbnail, isThumbnailLoading, getThumbnail, clearThumbnailCache)
- [ ] Template updated to show thumbnails in search results
- [ ] Functions exposed to template (via return or export)
- [ ] clearThumbnailCache() called in resetDocumentState()
- [ ] Loading placeholder styled and tested
- [ ] Error handling tested

## Dependencies
- **PDF.js:** `pdfDoc.getPage()`, `page.getViewport()`, `page.render()`
- **Vue 3:** `ref()` for reactive state
- **Canvas API:** For thumbnail rendering

## File Location
`/home/setup/navidocs/client/src/views/DocumentView.vue`

## Notes
- Thumbnails are generated asynchronously
- Loading state prevents duplicate generation
- Cache persists until document change
- Scale factor (0.2) can be adjusted for different sizes
- PNG quality (0.8) balances size vs quality

## Next Steps (Agent 8-10)
- Agent 8: Integrate thumbnails into search results UI
- Agent 9: Add search result sidebar with thumbnails
- Agent 10: Final testing and polish
