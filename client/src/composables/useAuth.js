/**
 * Authentication Composable
 * Manages user authentication state and API calls
 */

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

// Shared state across all components
const user = ref(null)
const accessToken = ref(localStorage.getItem('accessToken'))
const refreshToken = ref(localStorage.getItem('refreshToken'))
const isLoading = ref(false)
const error = ref(null)

export function useAuth() {
  const router = useRouter()

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)

  /**
   * Login with email and password
   */
  async function login(email, password) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Login failed')
      }

      // Store tokens
      accessToken.value = data.accessToken
      refreshToken.value = data.refreshToken
      user.value = data.user

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))

      return { success: true, user: data.user }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Register new user
   */
  async function register(email, password, name) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Registration failed')
      }

      // Auto-login after registration
      return await login(email, password)
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Logout user
   */
  async function logout() {
    isLoading.value = true

    try {
      if (accessToken.value) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken.value}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (err) {
      console.error('Logout API call failed:', err)
    } finally {
      // Clear state regardless of API success
      accessToken.value = null
      refreshToken.value = null
      user.value = null

      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')

      isLoading.value = false
      router.push('/login')
    }
  }

  /**
   * Restore session from localStorage
   */
  function restoreSession() {
    const storedUser = localStorage.getItem('user')
    const storedAccessToken = localStorage.getItem('accessToken')
    const storedRefreshToken = localStorage.getItem('refreshToken')

    if (storedUser && storedAccessToken) {
      try {
        user.value = JSON.parse(storedUser)
        accessToken.value = storedAccessToken
        refreshToken.value = storedRefreshToken
      } catch (err) {
        console.error('Failed to restore session:', err)
        clearSession()
      }
    }
  }

  /**
   * Clear session data
   */
  function clearSession() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  /**
   * Get current user info from API
   */
  async function fetchCurrentUser() {
    if (!accessToken.value) return

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken.value}`
        }
      })

      const data = await response.json()

      if (data.success) {
        user.value = data.user
        localStorage.setItem('user', JSON.stringify(data.user))
      } else {
        clearSession()
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err)
      clearSession()
    }
  }

  /**
   * Update user profile
   */
  async function updateProfile(updates) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken.value}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Profile update failed')
      }

      user.value = { ...user.value, ...data.user }
      localStorage.setItem('user', JSON.stringify(user.value))

      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // Restore session on composable creation
  if (!user.value && typeof window !== 'undefined') {
    restoreSession()
  }

  return {
    // State
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    error,

    // Methods
    login,
    register,
    logout,
    restoreSession,
    fetchCurrentUser,
    updateProfile,
    clearSession
  }
}
