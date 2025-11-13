<template>
  <Transition name="dropdown">
    <div
      v-if="visible && (filteredHistory.length > 0 || filteredSuggestions.length > 0)"
      class="absolute top-full left-0 right-0 mt-2 bg-dark-800 rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50 max-h-96 overflow-y-auto"
      @mousedown.prevent
    >
      <!-- Recent Searches Section -->
      <div v-if="filteredHistory.length > 0" class="border-b border-white/5">
        <div class="flex items-center justify-between px-4 py-2 bg-dark-900/50">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-xs font-medium text-white/60 uppercase tracking-wide">Recent Searches</span>
          </div>
          <button
            @click.stop="onClearHistory"
            class="text-xs text-white/40 hover:text-white/80 transition-colors flex items-center gap-1"
            title="Clear search history"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        </div>
        <div class="py-1">
          <button
            v-for="(item, index) in filteredHistory"
            :key="`history-${index}`"
            @click="onSelect(item.query)"
            :class="[
              'w-full px-4 py-2.5 text-left flex items-center justify-between gap-3 transition-colors',
              selectedIndex === index ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20' : 'hover:bg-white/5'
            ]"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <svg class="w-4 h-4 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span class="text-sm text-white truncate">{{ item.query }}</span>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="text-xs text-white/40">{{ item.resultsCount }} results</span>
              <span class="text-xs text-white/30">{{ formatTimestamp(item.timestamp) }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Suggested Terms Section -->
      <div v-if="filteredSuggestions.length > 0">
        <div class="px-4 py-2 bg-dark-900/50">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span class="text-xs font-medium text-white/60 uppercase tracking-wide">Suggested Terms</span>
          </div>
        </div>
        <div class="py-1">
          <button
            v-for="(term, index) in filteredSuggestions"
            :key="`suggestion-${index}`"
            @click="onSelect(term)"
            :class="[
              'w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors',
              selectedIndex === filteredHistory.length + index ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20' : 'hover:bg-white/5'
            ]"
          >
            <svg class="w-4 h-4 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            <span class="text-sm text-white">{{ term }}</span>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredHistory.length === 0 && filteredSuggestions.length === 0" class="px-4 py-8 text-center">
        <svg class="w-12 h-12 mx-auto text-white/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p class="text-sm text-white/40">No search suggestions available</p>
      </div>

      <!-- Keyboard Hint -->
      <div class="px-4 py-2 bg-dark-900/70 border-t border-white/5 flex items-center justify-between">
        <div class="flex items-center gap-4 text-xs text-white/30">
          <div class="flex items-center gap-1.5">
            <kbd class="px-1.5 py-0.5 bg-white/10 rounded text-white/50">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div class="flex items-center gap-1.5">
            <kbd class="px-1.5 py-0.5 bg-white/10 rounded text-white/50">Enter</kbd>
            <span>Select</span>
          </div>
          <div class="flex items-center gap-1.5">
            <kbd class="px-1.5 py-0.5 bg-white/10 rounded text-white/50">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  },
  suggestions: {
    type: Array,
    default: () => []
  },
  visible: {
    type: Boolean,
    default: false
  },
  documentId: {
    type: String,
    default: null
  },
  maxHistory: {
    type: Number,
    default: 10
  },
  maxSuggestions: {
    type: Number,
    default: 8
  }
})

const emit = defineEmits(['select', 'clear-history'])

const selectedIndex = ref(0)

// Filter and limit history and suggestions
const filteredHistory = computed(() => {
  return props.history.slice(0, props.maxHistory)
})

const filteredSuggestions = computed(() => {
  return props.suggestions.slice(0, props.maxSuggestions)
})

const totalItems = computed(() => {
  return filteredHistory.value.length + filteredSuggestions.value.length
})

// Format timestamp for display
function formatTimestamp(timestamp) {
  const now = Date.now()
  const diff = now - timestamp

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Handle selection
function onSelect(query) {
  emit('select', query)
}

// Handle clear history
function onClearHistory() {
  emit('clear-history')
}

// Keyboard navigation
function handleKeyDown(event) {
  if (!props.visible || totalItems.value === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = (selectedIndex.value + 1) % totalItems.value
      scrollToSelected()
      break

    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = selectedIndex.value === 0
        ? totalItems.value - 1
        : selectedIndex.value - 1
      scrollToSelected()
      break

    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value < filteredHistory.value.length) {
        onSelect(filteredHistory.value[selectedIndex.value].query)
      } else {
        const suggestionIndex = selectedIndex.value - filteredHistory.value.length
        onSelect(filteredSuggestions.value[suggestionIndex])
      }
      break

    case 'Escape':
      event.preventDefault()
      // Parent component should handle closing
      break
  }
}

// Scroll to selected item
function scrollToSelected() {
  // This would need a ref to the dropdown container
  // For now, browser will handle basic scrolling
}

// Reset selection when visibility changes
watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedIndex.value = 0
  }
})

// Add keyboard listener
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Custom scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Keyboard shortcut styling */
kbd {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
