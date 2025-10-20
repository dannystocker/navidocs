<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800">
    <!-- Header -->
    <div class="container mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <button
            @click="$router.back()"
            class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 class="text-3xl font-bold text-white">System Statistics</h1>
            <p class="text-white/70 mt-1">Overview of your NaviDocs system</p>
          </div>
        </div>
        <button
          @click="fetchStats"
          class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-2"
          :disabled="loading"
        >
          <svg class="w-5 h-5" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !stats" class="text-center py-20">
        <div class="inline-block w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        <p class="text-white/70 mt-4">Loading statistics...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
        <svg class="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-white mb-2">Failed to load statistics</h3>
        <p class="text-white/70">{{ error }}</p>
      </div>

      <!-- Stats Content -->
      <div v-else-if="stats" class="space-y-6">
        <!-- Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Total Documents -->
          <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div class="flex items-center justify-between mb-3">
              <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div class="text-3xl font-bold text-white mb-1">{{ stats.overview.totalDocuments }}</div>
            <div class="text-sm text-white/70">Total Documents</div>
          </div>

          <!-- Total Pages -->
          <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div class="flex items-center justify-between mb-3">
              <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div class="text-3xl font-bold text-white mb-1">{{ stats.overview.totalPages }}</div>
            <div class="text-sm text-white/70">Total Pages</div>
          </div>

          <!-- Storage Used -->
          <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div class="flex items-center justify-between mb-3">
              <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
            </div>
            <div class="text-3xl font-bold text-white mb-1">{{ stats.overview.storageUsedFormatted }}</div>
            <div class="text-sm text-white/70">Storage Used</div>
          </div>

          <!-- Health Score -->
          <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div class="flex items-center justify-between mb-3">
              <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="text-3xl font-bold text-white mb-1">{{ stats.health.healthScore }}%</div>
            <div class="text-sm text-white/70">Health Score</div>
          </div>
        </div>

        <!-- Document Status Breakdown -->
        <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 class="text-xl font-bold text-white mb-4">Documents by Status</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div v-for="(count, status) in stats.documentsByStatus" :key="status" class="text-center">
              <div class="text-2xl font-bold text-white mb-1">{{ count }}</div>
              <div class="text-sm text-white/70 capitalize">{{ status }}</div>
            </div>
            <div v-if="stats.health.failedCount > 0" class="text-center">
              <div class="text-2xl font-bold text-red-400 mb-1">{{ stats.health.failedCount }}</div>
              <div class="text-sm text-white/70">Failed</div>
            </div>
            <div v-if="stats.health.processingCount > 0" class="text-center">
              <div class="text-2xl font-bold text-yellow-400 mb-1">{{ stats.health.processingCount }}</div>
              <div class="text-sm text-white/70">Processing</div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Uploads -->
          <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 class="text-xl font-bold text-white mb-4">Recent Uploads (Last 7 Days)</h2>
            <div v-if="stats.recentUploads.length > 0" class="space-y-3">
              <div v-for="upload in stats.recentUploads" :key="upload.date" class="flex items-center justify-between">
                <span class="text-white/70">{{ formatDate(upload.date) }}</span>
                <span class="text-white font-semibold">{{ upload.count }} uploads</span>
              </div>
            </div>
            <div v-else class="text-center py-8 text-white/50">
              No uploads in the last 7 days
            </div>
          </div>

          <!-- Recent Documents -->
          <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 class="text-xl font-bold text-white mb-4">Recent Documents</h2>
            <div v-if="stats.recentDocuments.length > 0" class="space-y-3">
              <div
                v-for="doc in stats.recentDocuments"
                :key="doc.id"
                class="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                @click="$router.push(`/document/${doc.id}`)"
              >
                <div class="flex-1 min-w-0">
                  <div class="text-white font-medium truncate">{{ doc.title }}</div>
                  <div class="text-sm text-white/70">{{ formatTimestamp(doc.createdAt) }}</div>
                </div>
                <span
                  class="ml-3 px-2 py-1 rounded text-xs font-semibold"
                  :class="statusClass(doc.status)"
                >
                  {{ doc.status }}
                </span>
              </div>
            </div>
            <div v-else class="text-center py-8 text-white/50">
              No documents yet
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const stats = ref(null)
const loading = ref(false)
const error = ref(null)

async function fetchStats() {
  loading.value = true
  error.value = null

  try {
    const response = await fetch('/api/stats')

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    stats.value = await response.json()
  } catch (err) {
    console.error('Failed to fetch stats:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

function statusClass(status) {
  const classes = {
    'indexed': 'bg-green-500/20 text-green-400',
    'processing': 'bg-yellow-500/20 text-yellow-400',
    'failed': 'bg-red-500/20 text-red-400',
    'pending': 'bg-blue-500/20 text-blue-400',
    'queued': 'bg-purple-500/20 text-purple-400'
  }
  return classes[status] || 'bg-gray-500/20 text-gray-400'
}

onMounted(() => {
  fetchStats()
})
</script>
