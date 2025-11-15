/**
 * useKeyboardShortcuts.js
 * Global keyboard shortcut manager for NaviDocs
 * Provides accessible keyboard navigation across the application
 */

import { onMounted, onUnmounted } from 'vue'

/**
 * @param {Object} handlers - Object containing handler functions
 * @param {Function} handlers.focusSearch - Focus the search input (Ctrl/Cmd+F)
 * @param {Function} handlers.nextResult - Navigate to next search result (Enter)
 * @param {Function} handlers.prevResult - Navigate to previous result (Shift+Enter)
 * @param {Function} handlers.closeSearch - Close/clear search (Escape)
 * @param {Function} handlers.nextPage - Navigate to next page (ArrowRight/PageDown)
 * @param {Function} handlers.prevPage - Navigate to previous page (ArrowLeft/PageUp)
 * @param {Function} handlers.firstPage - Jump to first page (Home)
 * @param {Function} handlers.lastPage - Jump to last page (End)
 */
export function useKeyboardShortcuts(handlers = {}) {
  const handleKeyDown = (event) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event
    const modifier = ctrlKey || metaKey
    const activeElement = document.activeElement
    const tagName = activeElement?.tagName
    const isTyping = tagName === 'INPUT' || tagName === 'TEXTAREA'
    const isSearchBox = activeElement?.getAttribute('role') === 'searchbox'

    // Search focus: Ctrl/Cmd + F
    if (modifier && key === 'f' && handlers.focusSearch) {
      event.preventDefault()
      handlers.focusSearch()
      return
    }

    // Next result: Enter (when search active, not in input)
    if (key === 'Enter' && !shiftKey && handlers.nextResult) {
      if (!isSearchBox && !isTyping) {
        event.preventDefault()
        handlers.nextResult()
      }
      return
    }

    // Previous result: Shift + Enter
    if (key === 'Enter' && shiftKey && handlers.prevResult) {
      event.preventDefault()
      handlers.prevResult()
      return
    }

    // Close search: Escape
    if (key === 'Escape' && handlers.closeSearch) {
      event.preventDefault()
      handlers.closeSearch()
      return
    }

    // Don't interfere with typing in inputs
    if (isTyping && !isSearchBox) {
      return
    }

    // Next page: ArrowRight or PageDown
    if ((key === 'ArrowRight' || key === 'PageDown') && handlers.nextPage) {
      if (!isTyping) {
        event.preventDefault()
        handlers.nextPage()
      }
      return
    }

    // Previous page: ArrowLeft or PageUp
    if ((key === 'ArrowLeft' || key === 'PageUp') && handlers.prevPage) {
      if (!isTyping) {
        event.preventDefault()
        handlers.prevPage()
      }
      return
    }

    // Home: Go to first page
    if (key === 'Home' && handlers.firstPage) {
      if (!isTyping) {
        event.preventDefault()
        handlers.firstPage()
      }
      return
    }

    // End: Go to last page
    if (key === 'End' && handlers.lastPage) {
      if (!isTyping) {
        event.preventDefault()
        handlers.lastPage()
      }
      return
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  return { handleKeyDown }
}

/**
 * Get human-readable description of keyboard shortcut
 * @param {string} key - Shortcut key
 * @returns {string} Formatted shortcut description
 */
export function getShortcutDescription(key) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const modKey = isMac ? '⌘' : 'Ctrl'

  const shortcuts = {
    focusSearch: `${modKey}+F`,
    nextResult: 'Enter',
    prevResult: 'Shift+Enter',
    closeSearch: 'Esc',
    nextPage: 'ArrowRight / PageDown',
    prevPage: 'ArrowLeft / PageUp',
    firstPage: 'Home',
    lastPage: 'End'
  }

  return shortcuts[key] || ''
}
