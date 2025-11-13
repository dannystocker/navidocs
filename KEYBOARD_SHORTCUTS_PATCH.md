# Keyboard Shortcuts Implementation for DocumentView.vue

## Changes Required

### 1. Add ref to search input (line ~49)
```vue
<!-- BEFORE -->
<input
  v-model="searchInput"
  @keydown.enter="performSearch"

<!-- AFTER -->
<input
  ref="searchInputRef"
  v-model="searchInput"
  @keydown.enter="performSearch"
```

### 2. Update placeholder text (line ~56)
```vue
<!-- BEFORE -->
placeholder="Search in document..."

<!-- AFTER -->
placeholder="Search in document... (Cmd/Ctrl+F)"
```

### 3. Add searchInputRef declaration (after line ~406)
```javascript
// Use hysteresis to prevent flickering at threshold
const COLLAPSE_THRESHOLD = 120  // Collapse when scrolling down past 120px
const EXPAND_THRESHOLD = 80     // Expand when scrolling up past 80px

// ADD THIS:
// Search input ref for keyboard shortcuts
const searchInputRef = ref(null)

// Computed property for selected image URL
const selectedImageUrl = computed(() => {
```

### 4. Add keyboard shortcut handler function (before onMounted, around line 1083)
```javascript
// Keyboard shortcut handlers (Apple Preview-style)
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
```

### 5. Register keyboard listener in onMounted (line ~1084)
```javascript
onMounted(() => {
  loadDocument()

  // ADD THIS LINE:
  // Register global keyboard shortcut handler
  window.addEventListener('keydown', handleKeyboardShortcuts)

  // Handle deep links (#p=12)
  const hash = window.location.hash
```

### 6. Clean up keyboard listener in onBeforeUnmount (find existing onBeforeUnmount cleanup at line ~949)
```javascript
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
```

## Keyboard Shortcuts Summary

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + F` | Focus search box and select all text |
| `Enter` or `Cmd/Ctrl + G` | Go to next search result |
| `Shift + Enter` or `Cmd/Ctrl + Shift + G` | Go to previous search result |
| `Escape` | Clear search and close jump list |
| `Cmd/Ctrl + Option/Alt + F` | Toggle jump list (search sidebar) |

## Features

- **Cross-platform**: Automatically detects Mac (Cmd) vs Windows/Linux (Ctrl)
- **Prevents default browser find**: Cmd/Ctrl+F won't open browser's find dialog
- **Context-aware**: Enter key performs search when input is focused, navigates results otherwise
- **Global shortcuts**: Work anywhere in the document view
- **Apple Preview-style**: Matches familiar keyboard navigation patterns

## Testing

1. Open a document
2. Press Cmd/Ctrl+F - search box should focus
3. Type search query and press Enter
4. Press Cmd/Ctrl+G or Enter to cycle through results
5. Press Cmd/Ctrl+Shift+G or Shift+Enter to go backwards
6. Press Escape to clear search
7. With results visible, press Cmd/Ctrl+Option/Alt+F to toggle jump list
