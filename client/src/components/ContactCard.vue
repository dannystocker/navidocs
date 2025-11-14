<template>
  <div class="contact-card bg-white/5 border border-white/10 rounded-lg p-4 hover:border-pink-400/50 transition-all">
    <!-- Header -->
    <div class="flex items-start justify-between mb-3">
      <div>
        <h4 class="font-semibold text-white text-lg">{{ contact.name }}</h4>
        <span class="inline-block mt-1 px-2 py-1 bg-white/10 rounded text-xs text-white/70 capitalize">
          {{ contact.type }}
        </span>
      </div>
      <div class="flex gap-2">
        <button
          @click="editClick"
          class="p-2 hover:bg-blue-500/20 rounded transition-colors"
          title="Edit contact"
        >
          <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          @click="deleteClick"
          class="p-2 hover:bg-red-500/20 rounded transition-colors"
          title="Delete contact"
        >
          <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Contact Info -->
    <div class="space-y-2 mb-4">
      <!-- Phone -->
      <div v-if="contact.phone" class="flex items-center gap-3">
        <svg class="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <a :href="`tel:${contact.phone}`" class="text-blue-400 hover:underline">
          {{ contact.phone }}
        </a>
      </div>

      <!-- Email -->
      <div v-if="contact.email" class="flex items-center gap-3">
        <svg class="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <a :href="`mailto:${contact.email}`" class="text-green-400 hover:underline">
          {{ contact.email }}
        </a>
      </div>

      <!-- Address -->
      <div v-if="contact.address" class="flex items-start gap-3">
        <svg class="w-4 h-4 text-white/50 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 11-4 0 2 2 0 014 0z" clip-rule="evenodd" />
        </svg>
        <span class="text-white/70 text-sm">{{ contact.address }}</span>
      </div>
    </div>

    <!-- Notes -->
    <div v-if="contact.notes" class="mb-4 p-3 bg-white/5 rounded border-l-2 border-pink-400/50">
      <p class="text-white/70 text-sm">{{ contact.notes }}</p>
    </div>

    <!-- Quick Actions -->
    <div class="flex gap-2 pt-3 border-t border-white/10">
      <a
        v-if="contact.phone"
        :href="`tel:${contact.phone}`"
        class="flex-1 py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-center text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        Call
      </a>
      <a
        v-if="contact.email"
        :href="`mailto:${contact.email}`"
        class="flex-1 py-2 px-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-center text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Email
      </a>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  contact: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete'])

function editClick() {
  emit('edit', props.contact)
}

function deleteClick() {
  emit('delete', props.contact)
}
</script>

<style scoped>
.contact-card {
  transition: all 0.2s ease;
}

.contact-card:hover {
  box-shadow: 0 10px 25px rgba(236, 72, 153, 0.1);
}
</style>
