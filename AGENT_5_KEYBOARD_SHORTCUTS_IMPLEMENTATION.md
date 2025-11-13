# Agent 5: Keyboard Shortcuts Implementation

## Overview
Implementation of Apple Preview-style keyboard shortcuts for search functionality in DocumentView.vue.

## Files Modified
- `/home/setup/navidocs/client/src/views/DocumentView.vue`

## Implementation Summary

### Keyboard Shortcuts Implemented

| Shortcut | Action | Platform |
|----------|--------|----------|
| `Cmd + F` (Mac) / `Ctrl + F` (Win/Linux) | Focus search box and select text | Cross-platform |
| `Enter` | Navigate to next search result (when not in input) | All |
| `Cmd/Ctrl + G` | Navigate to next search result | Cross-platform |
| `Shift + Enter` | Navigate to previous search result | All |
| `Cmd/Ctrl + Shift + G` | Navigate to previous search result | Cross-platform |
| `Escape` | Clear search and close jump list | All |
| `Cmd/Ctrl + Alt + F` | Toggle search jump list (sidebar) | Cross-platform |

### Key Features

1. **Cross-Platform Detection**: Automatically uses Cmd on Mac, Ctrl on Windows/Linux
2. **Prevents Default Browser Find**: Cmd/Ctrl+F won't open browser's native find dialog
3. **Context-Aware**: Enter key performs search when input is focused, navigates results otherwise
4. **Global Shortcuts**: Work anywhere when the document is in focus
5. **Apple Preview-Style**: Matches familiar keyboard navigation patterns from macOS Preview app

### Changes Required

#### 1. Template Changes (Line ~49)

**Add `ref="searchInputRef"` to the search input:**

```vue
<input
  ref="searchInputRef"
  v-model="searchInput"
  @keydown.enter="performSearch"
  @input="handleSearchInput"
  type="text"
  class="w-full px-6 pr-28 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-lg text-white placeholder-white/50 shadow-lg focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/20"
  :class="isHeaderCollapsed ? 'h-10 text-sm' : 'h-16 text-lg'"
  placeholder="Search in document... (Cmd/Ctrl+F)"
/>
```

#### 2. Script Setup - Add Ref Declaration (After line ~427)

```javascript
// Use hysteresis to prevent flickering at threshold
const COLLAPSE_THRESHOLD = 120  // Collapse when scrolling down past 120px
const EXPAND_THRESHOLD = 80     // Expand when scrolling up past 80px

// Search input ref for keyboard shortcuts
const searchInputRef = ref(null)

// Computed property for selected image URL
const selectedImageUrl = computed(() => {
  if (!selectedImage.value) return ''
  return getImageUrl(documentId.value, selectedImage.value.id)
})
```

#### 3. Add Keyboard Handler Function (Before onMounted, around line 1180)

```javascript
/**
 * Handles keyboard shortcuts for search functionality (Apple Preview-style)
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

  // Cmd/Ctrl + Option/Alt + F - Toggle jump list
  if (cmdOrCtrl && event.altKey && event.key === 'f') {
    if (hitList.value.length > 0) {
      event.preventDefault()
      jumpListOpen.value = !jumpListOpen.value
    }
    return
  }
}
```

#### 4. Register Listener in onMounted (Around line 1180)

```javascript
onMounted(() => {
  loadDocument()

  // Register global keyboard shortcut handler
  window.addEventListener('keydown', handleKeyboardShortcuts)

  // Handle deep links (#p=12)
  const hash = window.location.hash
  // ... rest of existing code
})
```

#### 5. Clean Up Listener in onBeforeUnmount (Around line 1246)

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
    window.removeEventListener('keydown', handleKeyboardShortcuts)  // ADD THIS LINE
  })
```

## Testing Checklist

1. **Focus Search Box**
   - [ ] Press `Cmd+F` (Mac) or `Ctrl+F` (Windows/Linux)
   - [ ] Search input should receive focus
   - [ ] Existing text should be selected
   - [ ] Browser's native find dialog should NOT open

2. **Navigate Results**
   - [ ] Type a search query and press Enter
   - [ ] Press `Enter` or `Cmd/Ctrl+G` → Should go to next result
   - [ ] Press `Shift+Enter` or `Cmd/Ctrl+Shift+G` → Should go to previous result
   - [ ] Current result should be highlighted with pink background
   - [ ] Page should scroll to show current result

3. **Clear Search**
   - [ ] With search active, press `Escape`
   - [ ] Search should clear
   - [ ] Highlights should be removed
   - [ ] If search input was focused, it should blur

4. **Toggle Jump List**
   - [ ] Perform a search with multiple results
   - [ ] Press `Cmd/Ctrl+Alt+F`
   - [ ] Jump list (search sidebar) should toggle open/closed

5. **Context Awareness**
   - [ ] With search input focused, `Enter` should execute search
   - [ ] With search input NOT focused, `Enter` should navigate to next result
   - [ ] Shortcuts should not interfere with other inputs or modals

## Implementation Notes

### Cross-Platform Detection
The implementation uses `navigator.platform` to detect macOS and automatically maps shortcuts:
- Mac: Uses `event.metaKey` (Cmd key)
- Windows/Linux: Uses `event.ctrlKey` (Ctrl key)

### Event Prevention
All shortcuts call `event.preventDefault()` to prevent default browser behavior, particularly important for `Cmd/Ctrl+F` which would normally open the browser's find dialog.

### Context-Aware Enter Key
The Enter key behavior changes based on whether the search input is focused:
- **Input focused**: Executes search (existing behavior)
- **Input not focused**: Navigates to next result (new behavior)

### Memory Management
Keyboard event listener is properly cleaned up in `onBeforeUnmount` to prevent memory leaks when the component is destroyed.

## Code Structure

The implementation follows Vue 3 Composition API patterns:
1. **Reactive ref**: `searchInputRef` for accessing the DOM element
2. **Event handler function**: `handleKeyboardShortcuts` for centralized shortcut logic
3. **Lifecycle hooks**: `onMounted` to register, `onBeforeUnmount` to clean up
4. **Existing functions**: Reuses `nextHit()`, `prevHit()`, `clearSearch()`, `performSearch()`

## UI Improvements

The search input placeholder now includes a hint:
```
"Search in document... (Cmd/Ctrl+F)"
```

This provides visual feedback to users that keyboard shortcuts are available.

## Future Enhancements

Potential improvements for future iterations:
1. Add keyboard shortcut help modal (press `?` to show all shortcuts)
2. Implement `Cmd/Ctrl + A` to select all results
3. Add `Cmd/Ctrl + C` to copy current result context
4. Support arrow keys for result navigation
5. Add visual indicator when keyboard shortcuts are active
6. Persist user's keyboard shortcut preferences

## Related Files

- **Implementation Reference**: `/home/setup/navidocs/KEYBOARD_SHORTCUTS_CODE.js`
- **Detailed Patch Guide**: `/home/setup/navidocs/KEYBOARD_SHORTCUTS_PATCH.md`
- **Target File**: `/home/setup/navidocs/client/src/views/DocumentView.vue`

## Agent Handoff

**Status**: Implementation code ready
**Next Agent**: Can proceed with integration testing and UI polish
**Blockers**: None - all existing search functionality preserved
**Dependencies**: Existing search functions (`nextHit`, `prevHit`, `clearSearch`, `performSearch`)

---

*Implementation completed by Agent 5 of 10*
*Date: 2025-11-13*
*Task: Implement keyboard shortcuts for Apple Preview-style search*
