<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="glass border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Account Settings</h1>
          <router-link to="/" class="text-pink-400 hover:text-pink-300 font-medium transition-colors">
            ← Back to Home
          </router-link>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Sidebar Navigation -->
        <div class="md:col-span-1">
          <nav class="glass rounded-lg shadow-xl border border-white/10">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'w-full text-left px-4 py-3 flex items-center gap-3 transition-colors',
                activeTab === tab.id
                  ? 'bg-pink-500/20 text-pink-400 border-l-4 border-pink-400'
                  : 'text-white/70 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
              ]"
            >
              <component :is="tab.icon" class="w-5 h-5" />
              <span class="font-medium">{{ tab.label }}</span>
            </button>
          </nav>
        </div>

        <!-- Main Content -->
        <div class="md:col-span-2">
          <!-- Profile Tab -->
          <div v-if="activeTab === 'profile'" class="glass rounded-lg shadow-xl border border-white/10 p-6">
            <h2 class="text-xl font-bold text-white mb-6">Profile Information</h2>

            <!-- Success Message -->
            <div v-if="successMessage" class="mb-4 p-4 bg-green-500/20 border border-green-400/30 rounded-lg text-green-300 text-sm">
              {{ successMessage }}
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="mb-4 p-4 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
              {{ errorMessage }}
            </div>

            <!-- User Info -->
            <div v-if="user" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-white/80 mb-1">Full Name</label>
                <input
                  v-model="profileForm.name"
                  type="text"
                  class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:bg-white/15 transition-all"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-1">Email</label>
                <input
                  v-model="profileForm.email"
                  type="email"
                  class="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white/50"
                  disabled
                />
                <p class="text-xs text-white/50 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-1">Member Since</label>
                <p class="text-white/70">{{ formatDate(user.created_at || user.createdAt) }}</p>
              </div>

              <div class="pt-4">
                <button
                  @click="updateProfile"
                  :disabled="isLoading"
                  class="px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="!isLoading">Save Changes</span>
                  <span v-else>Saving...</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Security Tab -->
          <div v-if="activeTab === 'security'" class="glass rounded-lg shadow-xl border border-white/10 p-6">
            <h2 class="text-xl font-bold text-white mb-6">Security Settings</h2>

            <!-- Success Message -->
            <div v-if="successMessage" class="mb-4 p-4 bg-green-500/20 border border-green-400/30 rounded-lg text-green-300 text-sm">
              {{ successMessage }}
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="mb-4 p-4 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
              {{ errorMessage }}
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-white/80 mb-1">Current Password</label>
                <input
                  v-model="passwordForm.currentPassword"
                  type="password"
                  class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:bg-white/15 transition-all"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-1">New Password</label>
                <input
                  v-model="passwordForm.newPassword"
                  type="password"
                  class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:bg-white/15 transition-all"
                  placeholder="Enter new password (min. 8 characters)"
                  minlength="8"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-1">Confirm New Password</label>
                <input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:bg-white/15 transition-all"
                  placeholder="Confirm new password"
                />
              </div>

              <div class="pt-4">
                <button
                  @click="changePassword"
                  :disabled="isLoading"
                  class="px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="!isLoading">Change Password</span>
                  <span v-else>Updating...</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Permissions Tab -->
          <div v-if="activeTab === 'permissions'" class="glass rounded-lg shadow-xl border border-white/10 p-6">
            <h2 class="text-xl font-bold text-white mb-6">My Permissions</h2>

            <div v-if="user" class="space-y-4">
              <div class="bg-white/5 rounded-lg p-4 border border-white/10">
                <div class="flex items-center gap-3 mb-2">
                  <svg class="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 class="font-semibold text-white">System Role</h3>
                </div>
                <p class="text-white/70">
                  <span v-if="user.is_system_admin" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    System Administrator
                  </span>
                  <span v-else class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Standard User
                  </span>
                </p>
              </div>

              <div class="border-t border-white/10 pt-4">
                <h3 class="font-semibold text-white mb-3">What you can do:</h3>
                <ul class="space-y-2">
                  <li v-if="user.is_system_admin" class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-white/80">Manage all users and organizations</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-white/80">Upload and manage documents</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-white/80">Search across all accessible documents</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-white/80">View processing status and statistics</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- System Settings Tab (Admin Only) -->
          <div v-if="activeTab === 'system'" class="glass rounded-lg shadow-xl border border-white/10 p-6">
            <h2 class="text-xl font-bold text-white mb-6">System Settings</h2>

            <!-- Success Message -->
            <div v-if="successMessage" class="mb-4 p-4 bg-green-500/20 border border-green-400/30 rounded-lg text-green-300 text-sm">
              {{ successMessage }}
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="mb-4 p-4 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
              {{ errorMessage }}
            </div>

            <div class="bg-white/5 rounded-lg p-6 border border-white/10">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-white">Application Settings</h3>
                  <p class="text-sm text-white/60">Configure system-wide settings</p>
                </div>
              </div>

              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-white/80 mb-2">Application Name</label>
                  <input
                    v-model="appNameForm"
                    type="text"
                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-purple-400 focus:border-transparent focus:bg-white/15 transition-all"
                    placeholder="NaviDocs"
                  />
                  <p class="text-xs text-white/50 mt-2">This name will appear in the header, home page, and browser tab</p>
                </div>

                <div class="pt-4 border-t border-white/10">
                  <button
                    @click="updateAppName"
                    :disabled="isLoadingAppName"
                    class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105"
                  >
                    <span v-if="!isLoadingAppName">Save Settings</span>
                    <span v-else>Saving...</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Logout Tab -->
          <div v-if="activeTab === 'logout'" class="glass rounded-lg shadow-xl border border-white/10 p-6">
            <h2 class="text-xl font-bold text-white mb-6">Sign Out</h2>

            <div class="bg-white/5 rounded-lg p-6 text-center border border-white/10">
              <svg class="w-16 h-16 text-pink-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <p class="text-white/70 mb-6">Are you sure you want to sign out?</p>
              <button
                @click="handleLogout"
                class="px-6 py-2 bg-red-500/80 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useAppSettings } from '../composables/useAppSettings'

const router = useRouter()
const { user, logout, updateProfile: updateUserProfile, isLoading } = useAuth()
const { appName, fetchAppName, updateAppName: updateAppNameAPI, isLoading: isLoadingAppName } = useAppSettings()

const activeTab = ref('profile')
const successMessage = ref(null)
const errorMessage = ref(null)

const profileForm = ref({
  name: '',
  email: ''
})

const appNameForm = ref('NaviDocs')

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const tabs = computed(() => {
  const baseTabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: 'UserIcon'
    },
    {
      id: 'security',
      label: 'Security',
      icon: 'LockIcon'
    },
    {
      id: 'permissions',
      label: 'Permissions',
      icon: 'ShieldIcon'
    }
  ]

  // Add System Settings tab for admins
  if (user.value?.is_system_admin) {
    baseTabs.push({
      id: 'system',
      label: 'System Settings',
      icon: 'SettingsIcon'
    })
  }

  baseTabs.push({
    id: 'logout',
    label: 'Sign Out',
    icon: 'LogoutIcon'
  })

  return baseTabs
})

// Icon components (inline SVG)
const UserIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  `
}

const LockIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  `
}

const ShieldIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  `
}

const LogoutIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  `
}

const SettingsIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  `
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A'

  // Handle Unix timestamp in seconds (convert to milliseconds)
  const numTimestamp = Number(timestamp)
  if (numTimestamp && numTimestamp < 10000000000) {
    timestamp = numTimestamp * 1000
  }

  const date = new Date(timestamp)

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

async function updateProfile() {
  successMessage.value = null
  errorMessage.value = null

  if (!profileForm.value.name.trim()) {
    errorMessage.value = 'Name is required'
    return
  }

  const result = await updateUserProfile({ name: profileForm.value.name })

  if (result.success) {
    successMessage.value = 'Profile updated successfully!'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } else {
    errorMessage.value = result.error || 'Failed to update profile'
  }
}

async function changePassword() {
  successMessage.value = null
  errorMessage.value = null

  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
    errorMessage.value = 'All password fields are required'
    return
  }

  if (passwordForm.value.newPassword.length < 8) {
    errorMessage.value = 'New password must be at least 8 characters'
    return
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    errorMessage.value = 'New passwords do not match'
    return
  }

  // TODO: Implement password change API endpoint
  errorMessage.value = 'Password change feature is not yet implemented'
}

async function updateAppName() {
  // Clear previous messages
  successMessage.value = null
  errorMessage.value = null

  // Switch to system tab to show the result
  activeTab.value = 'system'

  if (!appNameForm.value || !appNameForm.value.trim()) {
    errorMessage.value = 'App name cannot be empty'
    return
  }

  const result = await updateAppNameAPI(appNameForm.value.trim())

  if (result.success) {
    successMessage.value = 'App name updated successfully! Refresh the page to see changes.'
    setTimeout(() => {
      successMessage.value = null
    }, 5000)
  } else {
    errorMessage.value = result.error || 'Failed to update app name'
  }
}

async function handleLogout() {
  await logout()
}

onMounted(async () => {
  if (user.value) {
    profileForm.value.name = user.value.name || ''
    profileForm.value.email = user.value.email || ''

    // Load app name for admin users
    if (user.value.is_system_admin) {
      await fetchAppName()
      appNameForm.value = appName.value
    }
  }
})
</script>
