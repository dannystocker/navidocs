// ============================================
// KEYBOARD SHORTCUTS IMPLEMENTATION
// Add to DocumentView.vue
// ============================================

// ========== STEP 1: Add ref declaration ==========
// Add this after line 427 (after EXPAND_THRESHOLD):

// Search input ref for keyboard shortcuts
const searchInputRef = ref(null)


// ========== STEP 2: Add keyboard handler function ==========
// Add this function before onMounted() (around line 1180):

/**
 * Handles keyboard shortcuts for search functionality (Apple Preview-style)
 * Shortcuts:
 * - Cmd/Ctrl + F: Focus search box
 * - Enter / Cmd+G: Next result
 * - Shift+Enter / Cmd+Shift+G: Previous result
 * - Escape: Clear search
 * - Cmd/Ctrl+Alt+F: Toggle jump list
 */
function handleKeyboardShortcuts(event) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey
  const isInputFocused = document.activeElement === searchInputRef.value

  // Cmd/Ctrl + F - Focus search box
  if (cmdOrCtrl && event.key === 'f') {
    event.preventDefault()
    if (searchInputRef.value) {
      searchInputRef.value.focus()
      searchInputRef.value.select()
    }
    return
  }

  // Escape - Clear search and blur input
  if (event.key === 'Escape') {
    if (searchQuery.value || isInputFocused) {
      event.preventDefault()
      clearSearch()
      if (isInputFocused && searchInputRef.value) {
        searchInputRef.value.blur()
      }
      jumpListOpen.value = false
    }
    return
  }

  // Enter or Cmd/Ctrl + G - Next result
  if (event.key === 'Enter' && !isInputFocused) {
    if (totalHits.value > 0) {
      event.preventDefault()
      nextHit()
    }
    return
  }

  if (cmdOrCtrl && event.key === 'g' && !event.shiftKey) {
    if (totalHits.value > 0) {
      event.preventDefault()
      nextHit()
    }
    return
  }

  // Shift + Enter or Cmd/Ctrl + Shift + G - Previous result
  if (event.key === 'Enter' && event.shiftKey && !isInputFocused) {
    if (totalHits.value > 0) {
      event.preventDefault()
      prevHit()
    }
    return
  }

  if (cmdOrCtrl && event.key === 'G' && event.shiftKey) {
    if (totalHits.value > 0) {
      event.preventDefault()
      prevHit()
    }
    return
  }

  // Cmd/Ctrl + Option/Alt + F - Toggle jump list (search sidebar toggle)
  if (cmdOrCtrl && event.altKey && event.key === 'f') {
    if (hitList.value.length > 0) {
      event.preventDefault()
      jumpListOpen.value = !jumpListOpen.value
    }
    return
  }
}


// ========== STEP 3: Register listener in onMounted ==========
// Add this line inside onMounted(), right after loadDocument():

onMounted(() => {
  loadDocument()

  // Register global keyboard shortcut handler
  window.addEventListener('keydown', handleKeyboardShortcuts)

  // ... rest of existing code
})


// ========== STEP 4: Clean up listener in first onBeforeUnmount ==========
// Find the first onBeforeUnmount (around line 1246) that cleans up scroll listeners
// Add the keyboard listener cleanup there:

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
    // ADD THIS LINE:
    window.removeEventListener('keydown', handleKeyboardShortcuts)
  })
