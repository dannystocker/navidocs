/**
 * App Settings Composable
 * Manages application-wide settings like app name
 */
import { ref, onMounted } from 'vue'

const appName = ref('NaviDocs')  // Default value
const isLoading = ref(false)

export function useAppSettings() {
  /**
   * Fetch app name from server
   */
  async function fetchAppName() {
    try {
      isLoading.value = true
      const response = await fetch('/api/settings/public/app')
      const data = await response.json()

      if (data.success && data.appName) {
        appName.value = data.appName
      }
    } catch (error) {
      console.warn('Failed to fetch app name, using default:', error)
      appName.value = 'NaviDocs'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update app name (admin only)
   */
  async function updateAppName(newName) {
    try {
      isLoading.value = true

      const token = localStorage.getItem('accessToken')
      if (!token) {
        throw new Error('No access token found. Please log in again.')
      }

      const response = await fetch('/api/admin/settings/app.name', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          value: newName
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update app name')
      }

      appName.value = newName
      return { success: true }
    } catch (error) {
      console.error('Error updating app name:', error)
      return {
        success: false,
        error: error.message
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    appName,
    isLoading,
    fetchAppName,
    updateAppName
  }
}
