<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
    <!-- Header -->
    <header class="glass sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <button @click="$router.push('/')" class="flex items-center space-x-3 hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg">
            <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15c3-2 6-2 9 0s6 2 9 0M3 9c3-2 6-2 9 0s6 2 9 0" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">NaviDocs</h1>
            </div>
          </button>
          <button @click="refreshJobs" class="btn btn-outline btn-sm flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-primary-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-6 py-12">
      <!-- Page Title -->
      <div class="mb-8">
        <h2 class="text-4xl font-black text-dark-900 mb-2">Processing Jobs</h2>
        <p class="text-lg text-dark-600">Track OCR processing status for your documents</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-20">
        <div class="space-y-4 max-w-4xl mx-auto">
          <div class="skeleton h-32 rounded-2xl"></div>
          <div class="skeleton h-32 rounded-2xl"></div>
          <div class="skeleton h-32 rounded-2xl"></div>
        </div>
      </div>

      <!-- Jobs List -->
      <div v-else-if="jobs.length > 0" class="space-y-4">
        <div
          v-for="job in jobs"
          :key="job.id"
          class="glass accent-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
        >
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-start gap-4 flex-1">
                <!-- Status Icon -->
                <div :class="getStatusIconClass(job.status)">
                  <component :is="getStatusIcon(job.status)" />
                </div>

                <!-- Job Info -->
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-dark-900 mb-1">{{ job.documentTitle || 'Untitled Document' }}</h3>
                  <div class="flex items-center gap-3 text-sm text-dark-500 mb-2">
                    <span class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      Job ID: {{ job.id.substring(0, 8) }}
                    </span>
                    <span class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ formatDate(job.createdAt) }}
                    </span>
                  </div>

                  <!-- Progress Bar -->
                  <div v-if="job.status === 'processing'" class="mb-3">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm font-medium text-dark-700">Processing</span>
                      <span class="text-sm font-medium text-dark-700">{{ job.progress || 0 }}%</span>
                    </div>
                    <div class="w-full bg-dark-200 rounded-full h-2 overflow-hidden">
                      <div
                        class="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 transition-all duration-500 ease-out rounded-full"
                        :style="{ width: `${job.progress || 0}%` }"
                      ></div>
                    </div>
                  </div>

                  <!-- Status Badge -->
                  <span class="badge" :class="getStatusBadgeClass(job.status)">
                    {{ getStatusText(job.status) }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-col gap-2">
                <button
                  v-if="job.status === 'completed'"
                  @click="viewDocument(job.documentId)"
                  class="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  View Document
                </button>
                <button
                  v-if="job.status === 'failed'"
                  @click="retryJob(job.id)"
                  class="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors text-sm font-medium focus-visible:ring-2 focus-visible:ring-dark-500"
                >
                  Retry
                </button>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="job.status === 'failed' && job.error" class="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p class="text-red-700 text-sm font-medium">Error: {{ job.error }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20">
        <div class="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-dark-900 mb-2">No processing jobs</h3>
        <p class="text-dark-600 mb-6">Upload a document to see OCR processing status here</p>
        <button @click="$router.push('/')" class="btn btn-primary">
          Upload Document
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, h } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const jobs = ref([])
const loading = ref(true)
let refreshInterval = null

async function fetchJobs() {
  try {
    const response = await fetch('/api/jobs')
    if (!response.ok) throw new Error('Failed to fetch jobs')
    jobs.value = await response.json()
    loading.value = false
  } catch (error) {
    console.error('Error fetching jobs:', error)
    loading.value = false
  }
}

function refreshJobs() {
  loading.value = true
  fetchJobs()
}

function getStatusIcon(status) {
  const icons = {
    pending: () => h('svg', { class: 'w-6 h-6', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' })
    ]),
    processing: () => h('div', { class: 'w-6 h-6 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin' }),
    completed: () => h('svg', { class: 'w-6 h-6', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
    ]),
    failed: () => h('svg', { class: 'w-6 h-6', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
    ])
  }
  return icons[status] || icons.pending
}

function getStatusIconClass(status) {
  const classes = {
    pending: 'flex-shrink-0 w-12 h-12 bg-dark-100 rounded-xl flex items-center justify-center text-dark-500',
    processing: 'flex-shrink-0 w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600',
    completed: 'flex-shrink-0 w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center text-success-600',
    failed: 'flex-shrink-0 w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600'
  }
  return classes[status] || classes.pending
}

function getStatusBadgeClass(status) {
  const classes = {
    pending: '',
    processing: 'badge-primary',
    completed: 'badge-success',
    failed: 'bg-red-100 text-red-700'
  }
  return classes[status] || ''
}

function getStatusText(status) {
  const texts = {
    pending: 'Queued',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed'
  }
  return texts[status] || status
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

function viewDocument(documentId) {
  router.push({ name: 'document', params: { id: documentId } })
}

async function retryJob(jobId) {
  try {
    const response = await fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' })
    if (!response.ok) throw new Error('Failed to retry job')
    await fetchJobs()
  } catch (error) {
    console.error('Error retrying job:', error)
    alert('Failed to retry job')
  }
}

onMounted(() => {
  fetchJobs()
  // Auto-refresh every 5 seconds
  refreshInterval = setInterval(fetchJobs, 5000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
