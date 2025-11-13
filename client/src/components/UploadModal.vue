<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content max-w-3xl">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-white">Upload Boat Manual</h2>
          <button
            @click="closeModal"
            class="text-white/70 hover:text-pink-400 transition-colors"
            aria-label="Close modal"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Upload Form -->
        <div v-if="!currentJobId">
          <!-- File Drop Zone -->
          <div
            @drop.prevent="handleDrop"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            :class="[
              'border-2 border-dashed rounded-lg p-12 text-center transition-all',
              isDragging ? 'border-pink-400 bg-pink-400/10' : 'border-white/20 bg-white/5'
            ]"
          >
            <div v-if="!selectedFile">
              <svg class="w-16 h-16 mx-auto text-white/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="text-lg text-white mb-2">Drag and drop your PDF here</p>
              <p class="text-sm text-white/70 mb-4">or</p>
              <label class="btn btn-outline cursor-pointer">
                Browse Files
                <input
                  ref="fileInput"
                  type="file"
                  accept="application/pdf"
                  class="hidden"
                  @change="handleFileSelect"
                />
              </label>
              <p class="text-xs text-white/70 mt-4">Maximum file size: 50MB</p>
            </div>

            <!-- Selected File Preview -->
            <div v-else class="text-left">
              <div class="flex items-center justify-between bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-4 shadow-soft">
                <div class="flex items-center space-x-3">
                  <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div class="flex-1">
                    <p class="font-medium text-white">{{ selectedFile.name }}</p>
                    <p class="text-sm text-white/70">{{ formatFileSize(selectedFile.size) }}</p>
                    <div v-if="extractingMetadata" class="text-xs text-pink-400 mt-1 flex items-center gap-1">
                      <div class="spinner border-pink-400" style="width: 12px; height: 12px; border-width: 2px;"></div>
                      Extracting metadata from first page...
                    </div>
                  </div>
                </div>
                <button
                  @click="removeFile"
                  class="text-white/70 hover:text-red-400 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Metadata Form -->
          <div v-if="selectedFile" class="mt-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-white/70 mb-2">Boat Name</label>
              <input
                v-model="metadata.boatName"
                type="text"
                class="input"
                placeholder="e.g., Sea Breeze"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-white/70 mb-2">Make</label>
                <input
                  v-model="metadata.boatMake"
                  type="text"
                  class="input"
                  placeholder="e.g., Prestige"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-white/70 mb-2">Model</label>
                <input
                  v-model="metadata.boatModel"
                  type="text"
                  class="input"
                  placeholder="e.g., F4.9"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-white/70 mb-2">Year</label>
                <input
                  v-model.number="metadata.boatYear"
                  type="number"
                  class="input"
                  placeholder="e.g., 2024"
                  min="1900"
                  :max="new Date().getFullYear()"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-white/70 mb-2">Document Type</label>
                <select v-model="metadata.documentType" class="input text-white bg-white/10">
                  <option value="owner-manual" class="bg-gray-800 text-white">Owner Manual</option>
                  <option value="component-manual" class="bg-gray-800 text-white">Component Manual</option>
                  <option value="service-record" class="bg-gray-800 text-white">Service Record</option>
                  <option value="inspection" class="bg-gray-800 text-white">Inspection Report</option>
                  <option value="certificate" class="bg-gray-800 text-white">Certificate</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-white/70 mb-2">Title</label>
              <input
                v-model="metadata.title"
                type="text"
                class="input"
                placeholder="e.g., Electrical System Manual"
              />
            </div>

            <!-- Upload Button -->
            <button
              @click="uploadFile"
              :disabled="!canUpload"
              class="btn btn-primary w-full btn-lg"
              :class="{ 'opacity-50 cursor-not-allowed': !canUpload }"
            >
              <svg v-if="!uploading" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div v-else class="spinner mr-2"></div>
              {{ uploading ? 'Uploading...' : 'Upload and Process' }}
            </button>
          </div>
        </div>

        <!-- Job Progress -->
        <div v-else class="py-8">
          <div class="text-center mb-6">
            <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-pink-400/20 flex items-center justify-center">
              <div v-if="jobStatus !== 'completed'" class="spinner border-pink-400"></div>
              <svg v-else class="w-12 h-12 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-white mb-2">{{ statusMessage }}</h3>
            <p class="text-white/70">{{ statusDescription }}</p>
          </div>

          <!-- Progress Bar -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-white/70">Processing</span>
              <span class="text-sm font-medium text-white/70">{{ jobProgress }}%</span>
            </div>
            <div class="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                class="bg-gradient-to-r from-pink-400 to-purple-500 h-3 transition-all duration-500 ease-out rounded-full"
                :style="{ width: `${jobProgress}%` }"
              ></div>
            </div>
          </div>

          <!-- Job Info -->
          <div class="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-4 text-sm">
            <div class="flex justify-between py-2">
              <span class="text-white/70">Job ID:</span>
              <span class="text-white font-mono">{{ currentJobId.slice(0, 8) }}...</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-white/70">Status:</span>
              <span class="text-white font-medium capitalize">{{ jobStatus }}</span>
            </div>
          </div>

          <!-- Success Actions -->
          <div v-if="jobStatus === 'completed'" class="mt-6 space-y-3">
            <button @click="viewDocument" class="btn btn-primary w-full">
              View Document
            </button>
            <button @click="uploadAnother" class="btn btn-outline w-full">
              Upload Another Manual
            </button>
          </div>

          <!-- Error Display -->
          <div v-if="jobStatus === 'failed'" class="mt-6">
            <div class="bg-red-500/10 border-l-4 border-red-400 p-4 rounded">
              <p class="text-red-300 font-medium">Processing Failed</p>
              <p class="text-red-300/90 text-sm mt-1">{{ errorMessage || 'An error occurred during OCR processing' }}</p>
            </div>
            <button @click="uploadAnother" class="btn btn-outline w-full mt-4">
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useJobPolling } from '../composables/useJobPolling'
import { useToast } from '../composables/useToast'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'upload-success'])

const router = useRouter()
const toast = useToast()
const fileInput = ref(null)
const selectedFile = ref(null)
const isDragging = ref(false)
const uploading = ref(false)
const currentJobId = ref(null)
const currentDocumentId = ref(null)
const errorMessage = ref(null)
const extractingMetadata = ref(false)

const metadata = ref({
  boatName: '',
  boatMake: '',
  boatModel: '',
  boatYear: new Date().getFullYear(),
  documentType: 'owner-manual',
  title: ''
})

const { jobStatus, jobProgress, startPolling, stopPolling } = useJobPolling()

const canUpload = computed(() => {
  return selectedFile.value && metadata.value.title && !uploading.value
})

const statusMessage = computed(() => {
  switch (jobStatus.value) {
    case 'pending':
      return 'Queued for Processing'
    case 'processing':
      return 'Processing PDF'
    case 'completed':
      return 'Processing Complete!'
    case 'failed':
      return 'Processing Failed'
    default:
      return 'Processing'
  }
})

const statusDescription = computed(() => {
  switch (jobStatus.value) {
    case 'pending':
      return 'Your manual is queued and will be processed shortly'
    case 'processing':
      return 'Extracting text and indexing pages...'
    case 'completed':
      return 'Your manual is ready to search'
    case 'failed':
      return 'Something went wrong during processing'
    default:
      return ''
  }
})

async function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file && file.type === 'application/pdf') {
    selectedFile.value = file
    // Auto-fill title from filename (fallback)
    if (!metadata.value.title) {
      metadata.value.title = file.name.replace('.pdf', '')
    }
    // Trigger quick OCR for metadata extraction
    await extractMetadataFromFile(file)
  }
}

async function handleDrop(event) {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file && file.type === 'application/pdf') {
    selectedFile.value = file
    if (!metadata.value.title) {
      metadata.value.title = file.name.replace('.pdf', '')
    }
    // Trigger quick OCR for metadata extraction
    await extractMetadataFromFile(file)
  }
}

async function extractMetadataFromFile(file) {
  extractingMetadata.value = true

  try {
    console.log('[Upload Modal] Extracting metadata from first page...')

    const formData = new FormData()
    formData.append('file', file)

    // Add 5-second timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch('/api/upload/quick-ocr', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Metadata extraction failed')
    }

    const data = await response.json()

    if (data.success && data.metadata) {
      console.log('[Upload Modal] Extracted metadata:', data.metadata)

      // Auto-fill form fields (only if empty)
      if (data.metadata.title && !metadata.value.title) {
        metadata.value.title = data.metadata.title
      }
      if (data.metadata.boatName && !metadata.value.boatName) {
        metadata.value.boatName = data.metadata.boatName
      }
      if (data.metadata.boatMake && !metadata.value.boatMake) {
        metadata.value.boatMake = data.metadata.boatMake
      }
      if (data.metadata.boatModel && !metadata.value.boatModel) {
        metadata.value.boatModel = data.metadata.boatModel
      }
      if (data.metadata.boatYear && !metadata.value.boatYear) {
        metadata.value.boatYear = data.metadata.boatYear
      }

      console.log('[Upload Modal] Form auto-filled with extracted data')
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('[Upload Modal] Metadata extraction timed out after 5 seconds')
    } else {
      console.warn('[Upload Modal] Metadata extraction failed:', error)
    }
    // Don't show error to user - just fall back to manual input
  } finally {
    extractingMetadata.value = false
  }
}

function removeFile() {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function uploadFile() {
  if (!canUpload.value) return

  uploading.value = true
  errorMessage.value = null

  try {
    // Use boat name as organization ID (tenant), fallback to "Liliane 1"
    const organizationId = metadata.value.boatName || 'Liliane 1'

    const formData = new FormData()
    formData.append('file', selectedFile.value) // Use 'file' field name (backend expects this)
    formData.append('title', metadata.value.title)
    formData.append('documentType', metadata.value.documentType)
    formData.append('organizationId', organizationId) // Use boat name as tenant
    formData.append('boatName', metadata.value.boatName)
    formData.append('boatMake', metadata.value.boatMake)
    formData.append('boatModel', metadata.value.boatModel)
    formData.append('boatYear', metadata.value.boatYear)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      // TODO: Add JWT token header when auth is implemented
      // headers: { 'Authorization': `Bearer ${token}` }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed')
    }

    currentJobId.value = data.jobId
    currentDocumentId.value = data.documentId

    // Start polling for job status
    startPolling(data.jobId)
  } catch (error) {
    console.error('Upload error:', error)
    errorMessage.value = error.message
    toast.error(`Upload failed: ${error.message}`)
  } finally {
    uploading.value = false
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function closeModal() {
  stopPolling()
  emit('close')
}

function viewDocument() {
  router.push({
    name: 'document',
    params: { id: currentDocumentId.value }
  })
  closeModal()
}

function uploadAnother() {
  selectedFile.value = null
  currentJobId.value = null
  currentDocumentId.value = null
  errorMessage.value = null
  metadata.value = {
    boatName: '',
    boatMake: '',
    boatModel: '',
    boatYear: new Date().getFullYear(),
    documentType: 'owner-manual',
    title: ''
  }
  stopPolling()
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}
</style>
