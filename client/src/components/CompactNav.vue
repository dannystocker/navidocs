<template>
  <div class="compact-nav">
    <!-- Previous Button -->
    <button
      @click="$emit('prev')"
      :disabled="currentPage <=1 || disabled"
      class="nav-btn"
      :title="'Previous Page'"
      aria-label="Previous page"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <!-- Page Input -->
    <div class="flex items-center gap-1.5">
      <input
        v-model.number="pageInput"
        @keypress.enter="goToPage"
        @blur="resetPageInput"
        type="number"
        min="1"
        :max="totalPages"
        :disabled="disabled"
        class="page-input"
        aria-label="Page number"
      />
      <span class="text-white/70 text-sm">/</span>
      <span class="text-white text-sm font-medium">{{ totalPages }}</span>
    </div>

    <!-- Go Button -->
    <button
      @click="goToPage"
      :disabled="disabled"
      class="go-btn"
      :title="'Go to page'"
      aria-label="Go to page"
    >
      Go
    </button>

    <!-- Next Button -->
    <button
      @click="$emit('next')"
      :disabled="currentPage >= totalPages || disabled"
      class="nav-btn"
      :title="'Next Page'"
      aria-label="Next page"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['prev', 'next', 'goto'])

const pageInput = ref(props.currentPage)

// Update input when currentPage changes
watch(() => props.currentPage, (newPage) => {
  pageInput.value = newPage
})

function goToPage() {
  const page = parseInt(pageInput.value)
  if (page >= 1 && page <= props.totalPages) {
    emit('goto', page)
  } else {
    // Reset to current page if invalid
    pageInput.value = props.currentPage
  }
}

function resetPageInput() {
  // Reset to current page if user leaves input empty or invalid
  if (!pageInput.value || pageInput.value < 1 || pageInput.value > props.totalPages) {
    pageInput.value = props.currentPage
  }
}
</script>

<style scoped>
.compact-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

.nav-btn {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: white;
  transition: all 0.2s;
  cursor: pointer;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(236, 72, 153, 0.5);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-input {
  width: 3rem;
  padding: 0.375rem 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: white;
  text-align: center;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.page-input:focus {
  outline: none;
  ring: 2px;
  ring-color: rgba(236, 72, 153, 0.5);
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(236, 72, 153, 0.5);
}

.page-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Remove number input spinners */
.page-input::-webkit-inner-spin-button,
.page-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.page-input[type=number] {
  -moz-appearance: textfield;
}

.go-btn {
  padding: 0.375rem 0.75rem;
  background: linear-gradient(to right, rgb(236, 72, 153), rgb(168, 85, 247));
  border: none;
  border-radius: 0.375rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
}

.go-btn:hover:not(:disabled) {
  background: linear-gradient(to right, rgb(219, 39, 119), rgb(147, 51, 234));
}

.go-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
