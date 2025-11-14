<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content max-w-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-white">
            {{ contact ? 'Edit Contact' : 'Add New Contact' }}
          </h2>
          <button
            @click="closeModal"
            class="text-white/70 hover:text-pink-400 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="submitForm" class="space-y-4 mb-6">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-white/70 mb-2">
              Contact Name *
            </label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="e.g., Marina Bay Dock"
              class="input w-full"
              required
            />
          </div>

          <!-- Type -->
          <div>
            <label class="block text-sm font-medium text-white/70 mb-2">
              Contact Type *
            </label>
            <select v-model="formData.type" class="input w-full" required>
              <option value="marina">Marina</option>
              <option value="mechanic">Mechanic</option>
              <option value="vendor">Vendor</option>
              <option value="insurance">Insurance</option>
              <option value="customs">Customs</option>
              <option value="other">Other</option>
            </select>
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-sm font-medium text-white/70 mb-2">
              Phone Number
            </label>
            <input
              v-model="formData.phone"
              type="tel"
              placeholder="e.g., +1 (555) 123-4567"
              class="input w-full"
            />
            <p v-if="errors.phone" class="text-red-400 text-sm mt-1">{{ errors.phone }}</p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-white/70 mb-2">
              Email Address
            </label>
            <input
              v-model="formData.email"
              type="email"
              placeholder="e.g., contact@example.com"
              class="input w-full"
            />
            <p v-if="errors.email" class="text-red-400 text-sm mt-1">{{ errors.email }}</p>
          </div>

          <!-- Address -->
          <div>
            <label class="block text-sm font-medium text-white/70 mb-2">
              Address
            </label>
            <textarea
              v-model="formData.address"
              placeholder="e.g., 123 Marina Drive, Port City, CA 90210"
              class="input w-full resize-none"
              rows="3"
            ></textarea>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-white/70 mb-2">
              Notes
            </label>
            <textarea
              v-model="formData.notes"
              placeholder="Any additional notes or information about this contact..."
              class="input w-full resize-none"
              rows="3"
            ></textarea>
          </div>

          <!-- Error Message -->
          <div v-if="errors.submit" class="p-3 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
            {{ errors.submit }}
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="submit"
              :disabled="submitting"
              class="flex-1 py-2 px-4 bg-gradient-to-r from-pink-500 to-red-500 hover:shadow-lg hover:shadow-pink-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition-all flex items-center justify-center gap-2"
            >
              <svg v-if="!submitting" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" />
              </svg>
              <div v-else class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
              {{ submitting ? 'Saving...' : 'Save Contact' }}
            </button>
            <button
              type="button"
              @click="closeModal"
              class="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  contact: {
    type: Object,
    default: null
  },
  organizationId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

// State
const formData = reactive({
  name: '',
  type: 'other',
  phone: '',
  email: '',
  address: '',
  notes: ''
})

const errors = reactive({
  name: '',
  email: '',
  phone: '',
  submit: ''
})

const submitting = ref(false)

// Watch for contact changes
watch(() => props.contact, (newContact) => {
  if (newContact) {
    formData.name = newContact.name || ''
    formData.type = newContact.type || 'other'
    formData.phone = newContact.phone || ''
    formData.email = newContact.email || ''
    formData.address = newContact.address || ''
    formData.notes = newContact.notes || ''
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  formData.name = ''
  formData.type = 'other'
  formData.phone = ''
  formData.email = ''
  formData.address = ''
  formData.notes = ''
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

function validateEmail(email) {
  if (!email) return true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhone(phone) {
  if (!phone) return true
  const phoneRegex = /^[\d\s\-\+\(\)\.]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7
}

async function submitForm() {
  // Clear previous errors
  errors.submit = ''
  errors.email = ''
  errors.phone = ''

  // Validate form
  if (!formData.name.trim()) {
    errors.submit = 'Contact name is required'
    return
  }

  if (formData.email && !validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address'
    return
  }

  if (formData.phone && !validatePhone(formData.phone)) {
    errors.phone = 'Please enter a valid phone number with at least 7 digits'
    return
  }

  submitting.value = true

  try {
    emit('save', {
      name: formData.name,
      type: formData.type,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      notes: formData.notes || null
    })
  } catch (error) {
    errors.submit = error.message || 'Failed to save contact'
  } finally {
    submitting.value = false
  }
}

function closeModal() {
  resetForm()
  emit('close')
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
  max-width: 100%;
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

.input {
  @apply bg-white/5 border border-white/10 text-white placeholder-white/50 rounded px-3 py-2 focus:outline-none focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/30;
}

.spinner {
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
