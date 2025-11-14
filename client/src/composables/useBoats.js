/**
 * Boat Management Composable
 * Manages boat selection and multi-boat support
 */

import { ref, computed } from 'vue'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

// Shared state across all components
const boats = ref([])
const currentBoatId = ref(localStorage.getItem('currentBoatId') || null)
const isLoading = ref(false)
const error = ref(null)

export function useBoats() {
  const currentBoat = computed(() => {
    return boats.value.find(b => b.id === currentBoatId.value)
  })

  /**
   * Fetch all boats for the user
   */
  async function fetchBoats(accessToken) {
    if (!accessToken) return

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE}/boats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch boats')
      }

      const data = await response.json()
      boats.value = data.boats || []

      // Set current boat if not set
      if (!currentBoatId.value && boats.value.length > 0) {
        setCurrentBoat(boats.value[0].id)
      }

      return boats.value
    } catch (err) {
      error.value = err.message
      console.error('Failed to fetch boats:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Set current boat
   */
  function setCurrentBoat(boatId) {
    currentBoatId.value = boatId
    localStorage.setItem('currentBoatId', boatId)
  }

  /**
   * Add a new boat
   */
  async function addBoat(boatData, accessToken) {
    if (!accessToken) return

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE}/boats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(boatData)
      })

      if (!response.ok) {
        throw new Error('Failed to add boat')
      }

      const data = await response.json()
      boats.value.push(data.boat)

      return { success: true, boat: data.boat }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update boat details
   */
  async function updateBoat(boatId, updates, accessToken) {
    if (!accessToken) return

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE}/boats/${boatId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update boat')
      }

      const data = await response.json()
      const index = boats.value.findIndex(b => b.id === boatId)
      if (index !== -1) {
        boats.value[index] = data.boat
      }

      return { success: true, boat: data.boat }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete a boat
   */
  async function deleteBoat(boatId, accessToken) {
    if (!accessToken) return

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE}/boats/${boatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete boat')
      }

      boats.value = boats.value.filter(b => b.id !== boatId)

      // Update current boat if deleted
      if (currentBoatId.value === boatId && boats.value.length > 0) {
        setCurrentBoat(boats.value[0].id)
      } else if (boats.value.length === 0) {
        currentBoatId.value = null
        localStorage.removeItem('currentBoatId')
      }

      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    boats,
    currentBoatId,
    currentBoat,
    isLoading,
    error,

    // Methods
    fetchBoats,
    setCurrentBoat,
    addBoat,
    updateBoat,
    deleteBoat
  }
}
