<template>
  <div
    class="search-sidebar"
    :class="{ 'visible': visible }"
  >
    <!-- Header -->
    <div class="search-header">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3>Search Results</h3>
        <span v-if="results.length > 0" class="result-count">{{ results.length }}</span>
      </div>
      <button
        @click="handleClose"
        class="close-btn"
        title="Close search"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="results.length === 0" class="search-empty">
      <svg class="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <p>No search results</p>
      <p class="text-xs mt-2">Try a different search term</p>
    </div>

    <!-- Results List -->
    <div v-else class="results-list">
      <div
        v-for="(result, index) in results"
        :key="index"
        class="result-item"
        :class="{ 'current': index === currentIndex }"
        @click="handleResultClick(index)"
      >
        <!-- Page Thumbnail Placeholder -->
        <div class="result-thumbnail">
          <div class="thumbnail-placeholder">
            <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div class="page-number">{{ result.page }}</div>
        </div>

        <!-- Result Details -->
        <div class="result-details">
          <div class="result-snippet" v-html="formatSnippet(result)"></div>
          <div class="result-meta">
            <span class="result-page-label">Page {{ result.page }}</span>
            <span v-if="index === currentIndex" class="current-indicator">Current</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Footer -->
    <div v-if="results.length > 0" class="search-footer">
      <span class="result-position">
        {{ currentIndex + 1 }} of {{ results.length }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: 0
  },
  visible: {
    type: Boolean,
    default: false
  },
  searchTerm: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['result-click', 'close']);

// Handle result click
const handleResultClick = (index) => {
  emit('result-click', index);
};

// Handle close button
const handleClose = () => {
  emit('close');
};

// Format snippet with highlighted search term
const formatSnippet = (result) => {
  if (!result.snippet) return '';

  // Escape HTML in snippet
  const escaped = result.snippet
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Highlight search term if available
  if (props.searchTerm) {
    const regex = new RegExp(`(${escapeRegex(props.searchTerm)})`, 'gi');
    return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  return escaped;
};

// Escape regex special characters
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
</script>

<style scoped>
.search-sidebar {
  position: fixed;
  left: -300px;
  top: 220px; /* Below header and compact nav */
  width: 300px;
  max-height: calc(100vh - 240px);
  background: rgba(17, 24, 39, 0.95); /* dark-900 with opacity */
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: none;
  border-radius: 0 0.75rem 0.75rem 0;
  box-shadow: 4px 4px 6px -1px rgba(0, 0, 0, 0.3), 2px 2px 4px -1px rgba(0, 0, 0, 0.2);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 30;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-sidebar.visible {
  left: 0;
}

/* Header */
.search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(31, 41, 55, 0.8); /* dark-800 */
  flex-shrink: 0;
}

.search-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.result-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: rgba(255, 92, 178, 0.2); /* pink with transparency */
  border: 1px solid rgba(255, 92, 178, 0.4);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #ff5cb2;
}

.close-btn {
  padding: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* Empty State */
.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.search-empty p {
  margin: 0;
  font-size: 14px;
}

.search-empty .text-xs {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* Results List */
.results-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* Custom scrollbar */
.results-list::-webkit-scrollbar {
  width: 6px;
}

.results-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.results-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.results-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Result Item */
.result-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(31, 41, 55, 0.6); /* dark-800 */
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.result-item:hover {
  background: rgba(31, 41, 55, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateX(4px);
}

.result-item.current {
  background: rgba(255, 92, 178, 0.15); /* pink tint */
  border-color: #ff5cb2;
  box-shadow: 0 0 0 1px rgba(255, 92, 178, 0.3);
}

.result-item.current:hover {
  background: rgba(255, 92, 178, 0.2);
}

/* Thumbnail */
.result-thumbnail {
  position: relative;
  flex-shrink: 0;
  width: 48px;
  height: 60px;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-item.current .thumbnail-placeholder {
  border-color: #ff5cb2;
}

.page-number {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(31, 41, 55, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
}

.result-item.current .page-number {
  background: #ff5cb2;
  border-color: #ff5cb2;
  color: white;
}

/* Result Details */
.result-details {
  flex: 1;
  min-width: 0; /* Allow text truncation */
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-snippet {
  font-size: 12px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-snippet :deep(mark.search-highlight) {
  background: rgba(255, 92, 178, 0.3);
  color: #ff5cb2;
  font-weight: 600;
  border-radius: 2px;
  padding: 0 2px;
}

.result-item.current .result-snippet :deep(mark.search-highlight) {
  background: rgba(255, 92, 178, 0.5);
  color: #fff;
}

.result-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.result-page-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.current-indicator {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background: rgba(255, 92, 178, 0.2);
  border: 1px solid rgba(255, 92, 178, 0.4);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #ff5cb2;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Footer */
.search-footer {
  flex-shrink: 0;
  padding: 12px 16px;
  background: rgba(31, 41, 55, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.result-position {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
}

/* Utility classes */
.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 0.5rem;
}

.w-4 {
  width: 1rem;
}

.h-4 {
  height: 1rem;
}

.w-6 {
  width: 1.5rem;
}

.h-6 {
  height: 1.5rem;
}

.w-12 {
  width: 3rem;
}

.h-12 {
  height: 3rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.text-xs {
  font-size: 0.75rem;
}

.text-pink-400 {
  color: rgb(244, 114, 182);
}

.text-gray-500 {
  color: rgb(107, 114, 128);
}

.text-gray-600 {
  color: rgb(75, 85, 99);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .search-sidebar {
    width: 280px;
    left: -280px;
  }

  .result-thumbnail {
    width: 40px;
    height: 50px;
  }
}

/* Animations */
@keyframes slideIn {
  from {
    left: -300px;
  }
  to {
    left: 0;
  }
}
</style>
