<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center max-w-md mx-auto px-4">
      <!-- 404 Icon -->
      <div class="mb-8">
        <div class="text-6xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Page Not Found</h1>
        <p class="text-white/60">The page you're looking for doesn't exist or has been moved.</p>
      </div>

      <!-- Helpful Links -->
      <div class="space-y-3 mb-8">
        <router-link to="/"
          class="block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">
          Back to Home
        </router-link>
        <router-link to="/search"
          class="block px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors">
          Search Documents
        </router-link>
      </div>

      <!-- Suggested Pages -->
      <div class="border-t border-white/10 pt-8">
        <p class="text-sm text-white/50 mb-4">Quick Links</p>
        <div class="grid grid-cols-2 gap-3">
          <router-link to="/jobs"
            class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm transition-colors">
            Jobs
          </router-link>
          <router-link to="/stats"
            class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm transition-colors">
            Statistics
          </router-link>
          <router-link to="/library"
            class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm transition-colors">
            Library
          </router-link>
          <router-link to="/account"
            class="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm transition-colors">
            Account
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// This view is rendered when a route is not found
</script>

<style scoped>
/* View-specific styles can be added here */
</style>
