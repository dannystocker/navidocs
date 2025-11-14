<template>
  <div
    class="toc-floating-panel"
    :class="{ 'expanded': isHovered || isPinned }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Collapsed Tab -->
    <div class="toc-tab">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <span class="toc-tab-text">TOC</span>
    </div>

    <!-- Expanded Content -->
    <div class="toc-expanded-content">
      <!-- Header -->
      <div class="toc-header">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <h3>Table of Contents</h3>
        </div>
        <button
          aria-label="Pin table of contents"
          @click="isPinned = !isPinned"
          class="pin-btn"
          :class="{ 'pinned': isPinned }"
          :title="isPinned ? 'Unpin' : 'Pin open'"
        >
          <svg aria-hidden="true" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="toc-loading">
        <div class="spinner"></div>
        <p>Loading TOC...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading && entries.length === 0" class="toc-empty">
        <p>No table of contents found</p>
        <button @click="extractToc" class="btn-extract">
          Extract TOC
        </button>
      </div>

      <!-- TOC Entries -->
      <nav v-else class="toc-nav">
        <div class="toc-count">{{ entries.length }} entries</div>
        <ul class="toc-list">
          <TocEntry
            v-for="entry in treeEntries"
            :key="entry.id"
            :entry="entry"
            :currentPage="currentPage"
            @navigate="handleNavigate"
          />
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import TocEntry from './TocEntry.vue';

const props = defineProps({
  documentId: {
    type: String,
    required: true
  },
  currentPage: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits(['navigate-to-page']);

const isHovered = ref(false);
const isPinned = ref(false);
const loading = ref(false);
const entries = ref([]);

// Build tree structure from flat entries
const treeEntries = computed(() => {
  if (entries.value.length === 0) return [];

  const idMap = {};
  const roots = [];

  // Create ID map
  entries.value.forEach(entry => {
    idMap[entry.id] = { ...entry, children: [] };
  });

  // Build tree
  entries.value.forEach(entry => {
    const node = idMap[entry.id];
    if (entry.parent_id && idMap[entry.parent_id]) {
      idMap[entry.parent_id].children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
});

// Fetch TOC from API
const fetchToc = async () => {
  if (!props.documentId) return;

  loading.value = true;
  try {
    const response = await fetch(`http://localhost:8001/api/documents/${props.documentId}/toc?format=flat`);
    if (!response.ok) throw new Error('Failed to fetch TOC');

    const data = await response.json();
    entries.value = data.entries || [];
  } catch (error) {
    console.error('Error fetching TOC:', error);
    entries.value = [];
  } finally {
    loading.value = false;
  }
};

// Extract TOC (trigger extraction on server)
const extractToc = async () => {
  if (!props.documentId) return;

  loading.value = true;
  try {
    const response = await fetch(
      `http://localhost:8001/api/documents/${props.documentId}/toc/extract`,
      { method: 'POST' }
    );

    if (!response.ok) throw new Error('TOC extraction failed');

    const data = await response.json();
    console.log(`TOC extraction: ${data.message}`);

    // Refresh TOC
    await fetchToc();
  } catch (error) {
    console.error('Error extracting TOC:', error);
    alert(`Failed to extract TOC: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

// Handle navigation
const handleNavigate = (pageNumber) => {
  emit('navigate-to-page', pageNumber);
};

// Watch for document changes
watch(() => props.documentId, () => {
  if (props.documentId) {
    fetchToc();
  }
}, { immediate: true });

// Restore pin state from localStorage
onMounted(() => {
  const savedPinState = localStorage.getItem('navidocs_toc_pinned');
  if (savedPinState !== null) {
    isPinned.value = savedPinState === '1';
  }
});

// Save pin state
watch(isPinned, (newVal) => {
  localStorage.setItem('navidocs_toc_pinned', newVal ? '1' : '0');
});
</script>

<style scoped>
.toc-floating-panel {
  position: fixed;
  right: 0;
  top: 220px; /* Below header and compact nav */
  width: 40px;
  max-height: calc(100vh - 240px);
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-right: none;
  border-radius: 0.75rem 0 0 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 30;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.toc-floating-panel.expanded {
  width: 320px;
}

/* Collapsed Tab */
.toc-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 0;
  color: white;
  cursor: pointer;
  min-width: 60px;
  min-height: 60px;
  flex-shrink: 0;
}

.toc-tab-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.8);
}

.toc-floating-panel.expanded .toc-tab {
  display: none;
}

/* Expanded Content */
.toc-expanded-content {
  display: none;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 16px;
}

.toc-floating-panel.expanded .toc-expanded-content {
  display: flex;
}

/* Header */
.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.toc-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.pin-btn {
  min-width: 60px;
  min-height: 60px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pin-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.pin-btn.pinned {
  background: rgba(236, 72, 153, 0.2);
  border-color: rgba(236, 72, 153, 0.5);
  color: rgb(236, 72, 153);
}

/* Loading */
.toc-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgb(236, 72, 153);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.toc-empty {
  padding: 40px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
}

.toc-empty p {
  margin-bottom: 16px;
  font-size: 16px;
}

.btn-extract {
  background: linear-gradient(to right, rgb(236, 72, 153), rgb(168, 85, 247));
  color: white;
  border: none;
  border-radius: 6px;
  min-width: 60px;
  min-height: 60px;
  padding: 10px 16px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-extract:hover {
  background: linear-gradient(to right, rgb(219, 39, 119), rgb(147, 51, 234));
  transform: scale(1.05);
}

/* TOC Navigation */
.toc-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.toc-count {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  text-align: center;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

/* Custom scrollbar */
.toc-list::-webkit-scrollbar {
  width: 6px;
}

.toc-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.toc-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.toc-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .toc-floating-panel.expanded {
    width: 280px;
  }
}
</style>
