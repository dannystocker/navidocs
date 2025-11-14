<template>
  <div id="app" class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <!-- Main Navigation -->
    <nav class="glass sticky top-0 z-50 border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo and Brand -->
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-md">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15c3-2 6-2 9 0s6 2 9 0M3 9c3-2 6-2 9 0s6 2 9 0" />
              </svg>
            </div>
            <router-link to="/" class="nav-brand">
              <h1 class="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                NaviDocs
              </h1>
              <p class="text-xs text-white/50">Marine Intelligence</p>
            </router-link>
          </div>

          <!-- Main Menu (Desktop) -->
          <div class="hidden md:flex items-center space-x-1">
            <nav-link v-if="isAuthenticated && currentBoat"
              to="/inventory"
              :params="{ boatId: currentBoat.id }"
              icon="📦"
              label="Inventory" />
            <nav-link v-if="isAuthenticated && currentBoat"
              to="/maintenance"
              :params="{ boatId: currentBoat.id }"
              icon="🔧"
              label="Maintenance" />
            <nav-link v-if="isAuthenticated && currentBoat"
              to="/cameras"
              :params="{ boatId: currentBoat.id }"
              icon="📷"
              label="Cameras" />
            <nav-link v-if="isAuthenticated"
              to="/contacts"
              icon="👥"
              label="Contacts" />
            <nav-link v-if="isAuthenticated && currentBoat"
              to="/expenses"
              :params="{ boatId: currentBoat.id }"
              icon="💰"
              label="Expenses" />
            <nav-link to="/search" icon="🔍" label="Search" />
          </div>

          <!-- Right Section: Boat Selector + Auth -->
          <div class="flex items-center space-x-4">
            <!-- Boat Selector (Multi-boat Support) -->
            <div v-if="isAuthenticated && boats.length > 0" class="relative boat-selector">
              <button @click="showBoatDropdown = !showBoatDropdown"
                class="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-primary-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span class="text-sm font-medium truncate max-w-xs">{{ currentBoat?.name || 'Select Boat' }}</span>
              </button>

              <!-- Boat Dropdown Menu -->
              <transition name="slide">
                <div v-if="showBoatDropdown" class="absolute right-0 mt-2 w-64 bg-slate-800 border border-white/20 rounded-lg shadow-xl z-40">
                  <div class="p-3 border-b border-white/10">
                    <p class="text-xs font-semibold text-white/60 uppercase tracking-wider">Select Boat</p>
                  </div>
                  <div class="max-h-64 overflow-y-auto">
                    <button v-for="boat in boats"
                      :key="boat.id"
                      @click="selectBoat(boat.id)"
                      :class="['w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0',
                        currentBoat?.id === boat.id ? 'bg-primary-500/20 text-primary-300' : 'text-white/80']">
                      <div class="font-medium">{{ boat.name }}</div>
                      <div class="text-xs text-white/50 mt-1">{{ boat.type || 'Boat' }} • {{ boat.year || 'N/A' }}</div>
                    </button>
                  </div>
                  <div class="p-3 border-t border-white/10">
                    <button @click="showBoatDropdown = false; $router.push('/boats/add')"
                      class="w-full text-center px-4 py-2 text-sm text-primary-400 hover:text-primary-300 transition-colors">
                      + Add Boat
                    </button>
                  </div>
                </div>
              </transition>
            </div>

            <!-- Mobile Menu Button -->
            <button @click="showMobileMenu = !showMobileMenu"
              class="md:hidden p-2 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <!-- User Menu -->
            <div v-if="isAuthenticated" class="relative user-menu">
              <button @click="showUserMenu = !showUserMenu"
                class="p-2 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-400">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              <!-- User Dropdown -->
              <transition name="slide">
                <div v-if="showUserMenu" class="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/20 rounded-lg shadow-xl z-40">
                  <div class="p-4 border-b border-white/10">
                    <p class="text-sm font-medium text-white">{{ userName || 'User' }}</p>
                    <p class="text-xs text-white/60">{{ userEmail || 'user@example.com' }}</p>
                  </div>
                  <div class="p-2 space-y-1">
                    <router-link to="/account"
                      @click="showUserMenu = false"
                      class="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white rounded transition-colors">
                      Account Settings
                    </router-link>
                    <router-link to="/stats"
                      @click="showUserMenu = false"
                      class="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white rounded transition-colors">
                      Statistics
                    </router-link>
                    <button @click="logout"
                      class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded transition-colors">
                      Logout
                    </button>
                  </div>
                </div>
              </transition>
            </div>

            <!-- Login Button -->
            <router-link v-else to="/login"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary-400">
              Login
            </router-link>
          </div>
        </div>

        <!-- Mobile Menu -->
        <transition name="slide">
          <div v-if="showMobileMenu" class="md:hidden mt-4 pt-4 border-t border-white/10 space-y-2">
            <nav-link-mobile v-if="isAuthenticated && currentBoat"
              to="/inventory"
              :params="{ boatId: currentBoat.id }"
              icon="📦"
              label="Inventory"
              @click="showMobileMenu = false" />
            <nav-link-mobile v-if="isAuthenticated && currentBoat"
              to="/maintenance"
              :params="{ boatId: currentBoat.id }"
              icon="🔧"
              label="Maintenance"
              @click="showMobileMenu = false" />
            <nav-link-mobile v-if="isAuthenticated && currentBoat"
              to="/cameras"
              :params="{ boatId: currentBoat.id }"
              icon="📷"
              label="Cameras"
              @click="showMobileMenu = false" />
            <nav-link-mobile v-if="isAuthenticated"
              to="/contacts"
              icon="👥"
              label="Contacts"
              @click="showMobileMenu = false" />
            <nav-link-mobile v-if="isAuthenticated && currentBoat"
              to="/expenses"
              :params="{ boatId: currentBoat.id }"
              icon="💰"
              label="Expenses"
              @click="showMobileMenu = false" />
            <nav-link-mobile to="/search" icon="🔍" label="Search" @click="showMobileMenu = false" />
          </div>
        </transition>
      </div>
    </nav>

    <!-- Main Content Area with Breadcrumbs -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbNav v-if="isAuthenticated" />
      <RouterView />
    </main>

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth'
import { useBoats } from './composables/useBoats'
import ToastContainer from './components/ToastContainer.vue'
import BreadcrumbNav from './components/BreadcrumbNav.vue'
import NavLink from './components/NavLink.vue'
import NavLinkMobile from './components/NavLinkMobile.vue'

const router = useRouter()
const { user, isAuthenticated, logout: authLogout } = useAuth()
const { boats, currentBoat, currentBoatId, fetchBoats, setCurrentBoat } = useBoats()

// UI State
const showBoatDropdown = ref(false)
const showUserMenu = ref(false)
const showMobileMenu = ref(false)

// User info
const userName = computed(() => user.value?.name || 'User')
const userEmail = computed(() => user.value?.email || '')

/**
 * Select a boat and navigate accordingly
 */
function selectBoat(boatId) {
  setCurrentBoat(boatId)
  showBoatDropdown.value = false

  // Navigate to the current module with the new boat, or to inventory if on contacts
  const currentModule = router.currentRoute.value.meta?.module
  if (currentModule && ['inventory', 'maintenance', 'cameras', 'expenses'].includes(currentModule)) {
    router.push({
      name: currentModule,
      params: { boatId }
    })
  } else if (currentModule === 'contacts') {
    // Contacts doesn't have boatId, so navigate to inventory of new boat
    router.push({
      name: 'inventory',
      params: { boatId }
    })
  }
}

/**
 * Logout handler
 */
async function logout() {
  await authLogout()
  showUserMenu.value = false
  await router.push('/login')
}

/**
 * Initialize boats on mount
 */
onMounted(async () => {
  if (isAuthenticated.value) {
    const { accessToken } = useAuth()
    await fetchBoats(accessToken.value)
  }
})
</script>

<style scoped>
.nav-brand {
  @apply text-decoration-none;
}

.boat-selector {
  @apply relative;
}

.user-menu {
  @apply relative;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  @apply transition-all duration-200;
}

.slide-enter-from {
  @apply opacity-0 translate-y-2;
}

.slide-leave-to {
  @apply opacity-0 translate-y-2;
}

/* Active Link State */
:deep(.router-link-active) {
  @apply text-primary-400;
}
</style>
