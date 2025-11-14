<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content max-w-2xl">
        <!-- Header -->
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-3xl font-bold text-white">{{ contact.name }}</h2>
            <p class="text-white/70 mt-1 capitalize">{{ contact.type }} Contact</p>
          </div>
          <button
            @click="closeModal"
            class="text-white/70 hover:text-pink-400 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Contact Details -->
        <div class="space-y-6 mb-6">
          <!-- Basic Info -->
          <div class="bg-white/5 border border-white/10 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-white mb-4">Contact Information</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-white/70 text-sm mb-1">Type</p>
                <p class="text-white font-medium capitalize">{{ contact.type }}</p>
              </div>
              <div v-if="contact.phone">
                <p class="text-white/70 text-sm mb-1">Phone</p>
                <a :href="`tel:${contact.phone}`" class="text-blue-400 hover:underline font-medium">
                  {{ contact.phone }}
                </a>
              </div>
              <div v-if="contact.email">
                <p class="text-white/70 text-sm mb-1">Email</p>
                <a :href="`mailto:${contact.email}`" class="text-green-400 hover:underline font-medium">
                  {{ contact.email }}
                </a>
              </div>
              <div v-if="contact.address">
                <p class="text-white/70 text-sm mb-1">Address</p>
                <p class="text-white font-medium">{{ contact.address }}</p>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="contact.notes" class="bg-white/5 border border-white/10 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-white mb-3">Notes</h3>
            <p class="text-white/80 leading-relaxed">{{ contact.notes }}</p>
          </div>

          <!-- Metadata -->
          <div class="bg-white/5 border border-white/10 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-white mb-3">Metadata</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <p class="text-white/70">Created</p>
                <p class="text-white/80">{{ formatDate(contact.created_at) }}</p>
              </div>
              <div class="flex justify-between">
                <p class="text-white/70">Last Updated</p>
                <p class="text-white/80">{{ formatDate(contact.updated_at) }}</p>
              </div>
              <div class="flex justify-between">
                <p class="text-white/70">ID</p>
                <p class="text-white/80 font-mono text-sm">{{ contact.id }}</p>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-500/30 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-white mb-3">Quick Actions</h3>
            <div class="grid grid-cols-2 gap-3">
              <a
                v-if="contact.phone"
                :href="`tel:${contact.phone}`"
                class="py-2 px-4 bg-blue-500/30 hover:bg-blue-500/40 text-blue-400 rounded font-medium transition-colors text-center flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call
              </a>
              <a
                v-if="contact.email"
                :href="`mailto:${contact.email}`"
                class="py-2 px-4 bg-green-500/30 hover:bg-green-500/40 text-green-400 rounded font-medium transition-colors text-center flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </a>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-6 border-t border-white/10">
          <button
            @click="editClick"
            class="flex-1 py-2 px-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            @click="deleteClick"
            class="flex-1 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
          <button
            @click="closeModal"
            class="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
const props = defineProps({
  contact: {
    type: Object,
    required: true
  },
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'edit', 'delete'])

function closeModal() {
  emit('close')
}

function editClick() {
  emit('edit', props.contact)
  closeModal()
}

function deleteClick() {
  emit('delete', props.contact)
  closeModal()
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown'
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 41, 59) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 2rem;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
