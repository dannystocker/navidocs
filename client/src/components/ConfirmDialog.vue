<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        @click.self="onCancel"
      >
        <div class="bg-dark-800 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full overflow-hidden">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-white/10">
            <div class="flex items-center gap-3">
              <div :class="[
                'w-10 h-10 rounded-xl flex items-center justify-center',
                variantClasses[variant].bg
              ]">
                <svg v-if="variant === 'danger'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <svg v-else-if="variant === 'warning'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-white">{{ title }}</h3>
            </div>
          </div>

          <!-- Body -->
          <div class="px-6 py-4">
            <p class="text-white/80 leading-relaxed">{{ message }}</p>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-dark-900/50 flex items-center justify-end gap-3">
            <button
              @click="onCancel"
              class="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors"
              :disabled="loading"
            >
              {{ cancelText }}
            </button>
            <button
              @click="onConfirm"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-colors',
                variantClasses[variant].button,
                loading && 'opacity-50 cursor-not-allowed'
              ]"
              :disabled="loading"
            >
              <span v-if="!loading">{{ confirmText }}</span>
              <span v-else class="flex items-center gap-2">
                <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {{ loadingText }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  loadingText: {
    type: String,
    default: 'Processing...'
  },
  variant: {
    type: String,
    default: 'info', // 'info', 'warning', 'danger'
    validator: (value) => ['info', 'warning', 'danger'].includes(value)
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const loading = ref(false)

const variantClasses = {
  danger: {
    bg: 'bg-red-500/20 text-red-400',
    button: 'bg-red-500 hover:bg-red-600 text-white'
  },
  warning: {
    bg: 'bg-yellow-500/20 text-yellow-400',
    button: 'bg-yellow-500 hover:bg-yellow-600 text-white'
  },
  info: {
    bg: 'bg-blue-500/20 text-blue-400',
    button: 'bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white'
  }
}

function onCancel() {
  if (loading.value) return
  emit('cancel')
}

async function onConfirm() {
  if (loading.value) return
  loading.value = true
  try {
    await emit('confirm')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>
