<template>
  <div class="contacts-module bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6 shadow-xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-3xl font-bold text-white mb-2">Contact Directory</h2>
        <p class="text-white/70">Manage marina, mechanic, and vendor contacts</p>
      </div>
      <button
        @click="openAddContactModal"
        class="btn btn-primary flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Contact
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white/5 border border-white/10 rounded-lg p-4">
        <p class="text-white/70 text-sm mb-1">Total Contacts</p>
        <p class="text-2xl font-bold text-white">{{ totalContacts }}</p>
      </div>
      <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p class="text-white/70 text-sm mb-1">Marinas</p>
        <p class="text-2xl font-bold text-blue-400">{{ countByType.marina || 0 }}</p>
      </div>
      <div class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
        <p class="text-white/70 text-sm mb-1">Mechanics</p>
        <p class="text-2xl font-bold text-amber-400">{{ countByType.mechanic || 0 }}</p>
      </div>
      <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <p class="text-white/70 text-sm mb-1">Vendors</p>
        <p class="text-2xl font-bold text-green-400">{{ countByType.vendor || 0 }}</p>
      </div>
    </div>

    <!-- Search and Filter Bar -->
    <div class="flex flex-col md:flex-row gap-4 mb-6">
      <div class="flex-1">
        <input
          v-model="searchQuery"
          @input="handleSearch"
          type="text"
          placeholder="Search by name, email, phone..."
          class="input w-full"
        />
      </div>
      <select
        v-model="selectedType"
        @change="handleFilterChange"
        class="input"
      >
        <option value="">All Types</option>
        <option value="marina">Marina</option>
        <option value="mechanic">Mechanic</option>
        <option value="vendor">Vendor</option>
        <option value="insurance">Insurance</option>
        <option value="customs">Customs</option>
        <option value="other">Other</option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block">
        <div class="spinner border-pink-400" style="width: 40px; height: 40px; border-width: 3px;"></div>
      </div>
      <p class="text-white/70 mt-4">Loading contacts...</p>
    </div>

    <!-- No Results -->
    <div v-else-if="displayedContacts.length === 0" class="text-center py-12">
      <svg class="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM16 16a5 5 0 010 10H4a5 5 0 010-10h12z" />
      </svg>
      <p class="text-white/70">No contacts found. Create one to get started!</p>
    </div>

    <!-- Contacts List - Categorized by Type -->
    <div v-else class="space-y-6">
      <!-- Marina Contacts -->
      <div v-if="contactsByType.marina && contactsByType.marina.length > 0">
        <h3 class="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948-.684l1.498-4.493a1 1 0 011.502 0l1.498 4.493a1 1 0 00.948.684H19a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
          </svg>
          Marina Contacts
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ContactCard
            v-for="contact in contactsByType.marina"
            :key="contact.id"
            :contact="contact"
            @edit="editContact"
            @delete="deleteContact"
          />
        </div>
      </div>

      <!-- Mechanic Contacts -->
      <div v-if="contactsByType.mechanic && contactsByType.mechanic.length > 0">
        <h3 class="text-lg font-semibold text-amber-400 mb-3 flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          Mechanic Contacts
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ContactCard
            v-for="contact in contactsByType.mechanic"
            :key="contact.id"
            :contact="contact"
            @edit="editContact"
            @delete="deleteContact"
          />
        </div>
      </div>

      <!-- Vendor Contacts -->
      <div v-if="contactsByType.vendor && contactsByType.vendor.length > 0">
        <h3 class="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Vendor Contacts
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ContactCard
            v-for="contact in contactsByType.vendor"
            :key="contact.id"
            :contact="contact"
            @edit="editContact"
            @delete="deleteContact"
          />
        </div>
      </div>

      <!-- Other Contacts -->
      <div v-if="otherContacts.length > 0">
        <h3 class="text-lg font-semibold text-white/80 mb-3">Other Contacts</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ContactCard
            v-for="contact in otherContacts"
            :key="contact.id"
            :contact="contact"
            @edit="editContact"
            @delete="deleteContact"
          />
        </div>
      </div>
    </div>

    <!-- Contact Detail Modal -->
    <ContactDetailModal
      v-if="selectedContact"
      :contact="selectedContact"
      :is-open="showDetailModal"
      @close="showDetailModal = false"
      @edit="editContact"
      @delete="deleteContact"
    />

    <!-- Add/Edit Contact Modal -->
    <ContactFormModal
      :is-open="showFormModal"
      :contact="editingContact"
      :organization-id="organizationId"
      @close="closeFormModal"
      @save="saveContact"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import ContactCard from './ContactCard.vue'
import ContactDetailModal from './ContactDetailModal.vue'
import ContactFormModal from './ContactFormModal.vue'

// Props
const props = defineProps({
  organizationId: {
    type: String,
    required: true
  }
})

// State
const contacts = ref([])
const loading = ref(false)
const searchQuery = ref('')
const selectedType = ref('')
const editingContact = ref(null)
const selectedContact = ref(null)
const showFormModal = ref(false)
const showDetailModal = ref(false)
const countByType = ref({})
const totalContacts = ref(0)

// Computed
const contactsByType = computed(() => {
  return {
    marina: displayedContacts.value.filter(c => c.type === 'marina'),
    mechanic: displayedContacts.value.filter(c => c.type === 'mechanic'),
    vendor: displayedContacts.value.filter(c => c.type === 'vendor'),
    insurance: displayedContacts.value.filter(c => c.type === 'insurance'),
    customs: displayedContacts.value.filter(c => c.type === 'customs')
  }
})

const otherContacts = computed(() => {
  return displayedContacts.value.filter(c => !['marina', 'mechanic', 'vendor', 'insurance', 'customs'].includes(c.type))
})

const displayedContacts = computed(() => {
  let filtered = contacts.value

  if (selectedType.value) {
    filtered = filtered.filter(c => c.type === selectedType.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(c =>
      c.name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.toLowerCase().includes(query) ||
      c.notes?.toLowerCase().includes(query)
    )
  }

  return filtered.sort((a, b) => a.name?.localeCompare(b.name))
})

// Methods
async function loadContacts() {
  loading.value = true
  try {
    const response = await fetch(`/api/contacts/${props.organizationId}`)
    if (response.ok) {
      const data = await response.json()
      contacts.value = data.contacts || []
      countByType.value = data.countByType || {}
      totalContacts.value = data.count || 0
    }
  } catch (error) {
    console.error('Failed to load contacts:', error)
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    await loadContacts()
    return
  }

  loading.value = true
  try {
    const response = await fetch(
      `/api/contacts/search/query?q=${encodeURIComponent(searchQuery.value)}&organizationId=${props.organizationId}`
    )
    if (response.ok) {
      const data = await response.json()
      contacts.value = data.contacts || []
    }
  } catch (error) {
    console.error('Search failed:', error)
  } finally {
    loading.value = false
  }
}

async function handleFilterChange() {
  if (!selectedType.value) {
    await loadContacts()
    return
  }

  loading.value = true
  try {
    const response = await fetch(
      `/api/contacts/type/${selectedType.value}?organizationId=${props.organizationId}`
    )
    if (response.ok) {
      const data = await response.json()
      contacts.value = data.contacts || []
    }
  } catch (error) {
    console.error('Filter failed:', error)
  } finally {
    loading.value = false
  }
}

function openAddContactModal() {
  editingContact.value = null
  showFormModal.value = true
}

function editContact(contact) {
  editingContact.value = contact
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  editingContact.value = null
}

async function saveContact(contactData) {
  try {
    const method = editingContact.value ? 'PUT' : 'POST'
    const url = editingContact.value
      ? `/api/contacts/${editingContact.value.id}`
      : '/api/contacts'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...contactData,
        organizationId: props.organizationId
      })
    })

    if (response.ok) {
      closeFormModal()
      await loadContacts()
    }
  } catch (error) {
    console.error('Failed to save contact:', error)
  }
}

async function deleteContact(contact) {
  if (!confirm(`Are you sure you want to delete ${contact.name}?`)) {
    return
  }

  try {
    const response = await fetch(`/api/contacts/${contact.id}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      showDetailModal.value = false
      await loadContacts()
    }
  } catch (error) {
    console.error('Failed to delete contact:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadContacts()
})

// Watch for organization change
watch(() => props.organizationId, () => {
  loadContacts()
})
</script>

<style scoped>
.spinner {
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: currentColor;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
}

.btn-primary {
  @apply bg-gradient-to-r from-pink-500 to-red-500 text-white hover:shadow-lg hover:shadow-pink-500/50;
}

.input {
  @apply bg-white/5 border border-white/10 text-white placeholder-white/50 rounded-lg px-4 py-2 focus:outline-none focus:border-pink-400/50 focus:ring-1 focus:ring-pink-400/30;
}
</style>
