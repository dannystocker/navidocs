<template>
  <li class="toc-entry" :class="`level-${entry.level}`" role="listitem">
    <div
      class="toc-entry-content"
      :class="{ 'active': isActive, 'has-children': hasChildren }"
      :aria-current="isActive ? 'page' : undefined"
      @click="handleClick"
      @keydown.enter="handleClick"
      @keydown.space.prevent="handleClick"
      tabindex="0"
    >
      <!-- Expand/Collapse Icon for entries with children -->
      <button
        v-if="hasChildren"
        @click.stop="toggleExpanded"
        class="expand-btn"
        :aria-label="isExpanded ? 'Collapse' : 'Expand'"
        :aria-expanded="isExpanded"
      >
        <span class="icon">{{ isExpanded ? '▼' : '▶' }}</span>
      </button>

      <!-- Entry Content -->
      <div class="entry-main">
        <!-- Section Key (if present) -->
        <span v-if="entry.section_key" class="section-key">
          {{ entry.section_key }}
        </span>

        <!-- Title -->
        <span class="entry-title">{{ entry.title }}</span>

        <!-- Page Number -->
        <span class="page-number">{{ entry.page_start }}</span>
      </div>
    </div>

    <!-- Recursive Children -->
    <ul v-if="hasChildren && isExpanded" class="toc-children" role="list">
      <TocEntry
        v-for="child in entry.children"
        :key="child.id"
        :entry="child"
        :currentPage="currentPage"
        @navigate="$emit('navigate', $event)"
      />
    </ul>
  </li>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  entry: {
    type: Object,
    required: true
  },
  currentPage: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits(['navigate']);

const isExpanded = ref(true); // Start expanded by default

const hasChildren = computed(() => {
  return props.entry.children && props.entry.children.length > 0;
});

const isActive = computed(() => {
  // Highlight if current page matches this entry's target page
  return props.currentPage === props.entry.page_start;
});

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const handleClick = () => {
  emit('navigate', props.entry.page_start);
};
</script>

<style scoped>
.toc-entry {
  margin: 0;
  padding: 0;
}

.toc-entry-content {
  display: flex;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  position: relative;
}

.toc-entry-content:hover {
  background: #f3f4f6;
}

.toc-entry-content.active {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
  padding-left: 8px;
}

.expand-btn {
  background: none;
  border: none;
  padding: 0 8px;
  cursor: pointer;
  color: #6b7280;
  font-size: 10px;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.icon {
  display: inline-block;
  transition: transform 0.2s;
}

.entry-main {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0; /* Allow text truncation */
}

.section-key {
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
  flex-shrink: 0;
  min-width: 32px;
}

.entry-title {
  flex: 1;
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-number {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  flex-shrink: 0;
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 4px;
  margin-left: auto;
}

.toc-entry-content.active .page-number {
  background: #dbeafe;
  color: #1e40af;
}

/* Nested children */
.toc-children {
  list-style: none;
  padding: 0;
  margin: 0;
  padding-left: 16px;
  border-left: 1px solid #e5e7eb;
  margin-left: 12px;
}

/* Level-based indentation */
.level-1 {
  font-weight: 500;
}

.level-2 .entry-title {
  font-size: 13px;
}

.level-3 .entry-title {
  font-size: 12px;
  color: #6b7280;
}

.level-4 .entry-title {
  font-size: 11px;
  color: #9ca3af;
}

/* Hover effect for all entries */
.toc-entry-content:hover .entry-title {
  color: #1f2937;
}

.toc-entry-content:hover .page-number {
  background: #dbeafe;
}
</style>
