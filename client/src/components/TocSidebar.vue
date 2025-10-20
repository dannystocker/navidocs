<template>
  <div class="toc-sidebar" :class="{ 'collapsed': !isOpen }">
    <!-- Toggle Button -->
    <button
      @click="toggleSidebar"
      class="toc-toggle"
      :title="isOpen ? $t('toc.collapse') : $t('toc.expand')"
    >
      <span v-if="isOpen">☰ {{ $t('toc.tableOfContents') }}</span>
      <span v-else>☰</span>
    </button>

    <!-- Sidebar Content -->
    <div v-if="isOpen" class="toc-content">
      <!-- Loading State -->
      <div v-if="loading" class="toc-loading" aria-live="polite">
        <div class="spinner"></div>
        <p>{{ $t('toc.loading') }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading && entries.length === 0" class="toc-empty">
        <p>{{ $t('toc.noTocFound') }}</p>
        <button @click="extractToc" class="btn-extract">
          {{ $t('toc.extract') }}
        </button>
      </div>

      <!-- TOC Entries -->
      <nav v-else class="toc-nav" role="navigation" aria-label="Table of Contents">
        <div class="toc-header">
          <h3>{{ $t('toc.tableOfContents') }}</h3>
          <span class="toc-count">{{ entries.length }} {{ $t('toc.entries') }}</span>
        </div>

        <ul class="toc-list" role="list">
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

const isOpen = ref(true);
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

// Toggle sidebar
const toggleSidebar = () => {
  isOpen.value = !isOpen.value;
  // Save preference to localStorage
  localStorage.setItem('navidocs_toc_open', isOpen.value ? '1' : '0');
};

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

// Restore sidebar state from localStorage
onMounted(() => {
  const savedState = localStorage.getItem('navidocs_toc_open');
  if (savedState !== null) {
    isOpen.value = savedState === '1';
  }
});
</script>

<style scoped>
.toc-sidebar {
  position: fixed;
  left: 0;
  top: 64px; /* Below header */
  bottom: 0;
  width: 320px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  z-index: 40;
  overflow: hidden;
}

.toc-sidebar.collapsed {
  transform: translateX(-280px);
}

.toc-toggle {
  position: absolute;
  right: -40px;
  top: 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-left: none;
  border-radius: 0 8px 8px 0;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
  white-space: nowrap;
}

.toc-toggle:hover {
  background: #f9fafb;
  color: #1f2937;
}

.toc-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.toc-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6b7280;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.toc-empty {
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
}

.toc-empty p {
  margin-bottom: 16px;
}

.btn-extract {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-extract:hover {
  background: #2563eb;
}

.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.toc-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.toc-count {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 12px;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .toc-sidebar {
    width: 280px;
  }

  .toc-sidebar.collapsed {
    transform: translateX(-240px);
  }
}
</style>
