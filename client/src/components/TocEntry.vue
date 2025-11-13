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
        <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-90': isExpanded }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
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
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  position: relative;
}

.toc-entry-content:hover {
  background: rgba(255, 255, 255, 0.1);
}

.toc-entry-content.active {
  background: rgba(236, 72, 153, 0.2);
  border-left: 3px solid rgb(236, 72, 153);
  padding-left: 8px;
}

.expand-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.entry-main {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0; /* Allow text truncation */
}

.section-key {
  font-size: 11px;
  font-weight: 600;
  color: rgb(168, 85, 247);
  flex-shrink: 0;
  min-width: 32px;
}

.entry-title {
  flex: 1;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-number {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  flex-shrink: 0;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-left: auto;
}

.toc-entry-content.active .page-number {
  background: rgba(236, 72, 153, 0.3);
  color: rgb(236, 72, 153);
  font-weight: 600;
}

/* Nested children */
.toc-children {
  list-style: none;
  padding: 0;
  margin: 0;
  padding-left: 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  margin-left: 10px;
  margin-top: 2px;
}

/* Level-based styling */
.level-1 {
  font-weight: 500;
}

.level-2 .entry-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.level-3 .entry-title {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.level-4 .entry-title {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

/* Hover effect for all entries */
.toc-entry-content:hover .entry-title {
  color: white;
}

.toc-entry-content:hover .page-number {
  background: rgba(236, 72, 153, 0.2);
  color: rgb(236, 72, 153);
}
</style>
