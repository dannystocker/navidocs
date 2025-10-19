/**
 * Job Polling Composable
 * Polls job status every 2 seconds until completion or failure
 */

import { ref, onUnmounted } from 'vue'
import { useToast } from './useToast'

export function useJobPolling() {
  const toast = useToast()
  const jobId = ref(null)
  const jobStatus = ref('pending')
  const jobProgress = ref(0)
  const jobError = ref(null)
  let pollInterval = null

  async function startPolling(id) {
    jobId.value = id
    jobStatus.value = 'pending'
    jobProgress.value = 0
    jobError.value = null

    // Clear any existing interval
    if (pollInterval) {
      clearInterval(pollInterval)
    }

    // Poll immediately
    await pollStatus()

    // Then poll every 2 seconds
    pollInterval = setInterval(async () => {
      await pollStatus()

      // Stop polling if job is complete or failed
      if (jobStatus.value === 'completed' || jobStatus.value === 'failed') {
        stopPolling()
      }
    }, 2000)
  }

  async function pollStatus() {
    if (!jobId.value) return

    try {
      const response = await fetch(`/api/jobs/${jobId.value}`)
      const data = await response.json()

      if (response.ok) {
        const previousStatus = jobStatus.value
        jobStatus.value = data.status
        jobProgress.value = data.progress || 0
        jobError.value = data.error || null

        // Show success toast when job completes
        if (previousStatus !== 'completed' && data.status === 'completed') {
          toast.success('Document processed successfully! OCR complete.')
        }

        // Show error toast when job fails
        if (previousStatus !== 'failed' && data.status === 'failed') {
          toast.error(`Processing failed: ${data.error || 'Unknown error'}`)
        }
      } else {
        console.error('Poll error:', data.error)
        // Don't stop polling on transient errors
      }
    } catch (error) {
      console.error('Poll request failed:', error)
      // Don't stop polling on network errors
    }
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopPolling()
  })

  return {
    jobId,
    jobStatus,
    jobProgress,
    jobError,
    startPolling,
    stopPolling
  }
}
