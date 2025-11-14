<template>
  <nav class="breadcrumb-nav mb-4">
    <div class="flex items-center space-x-2 text-sm">
      <router-link to="/" class="breadcrumb-item">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z" />
        </svg>
        Home
      </router-link>

      <span v-if="breadcrumbs.length > 0" class="breadcrumb-separator">/</span>

      <template v-for="(crumb, index) in breadcrumbs" :key="index">
        <template v-if="index < breadcrumbs.length - 1">
          <router-link :to="crumb.path" class="breadcrumb-item">
            {{ crumb.label }}
          </router-link>
          <span v-if="index < breadcrumbs.length - 2" class="breadcrumb-separator">/</span>
        </template>
        <template v-else>
          <span class="breadcrumb-current">{{ crumb.label }}</span>
        </template>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => {
  const crumbs = []
  const pathSegments = route.path.split('/').filter(p => p)

  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Map route names to breadcrumb labels
    let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')

    // Custom labels for known routes
    const labelMap = {
      'inventory': 'Inventory',
      'maintenance': 'Maintenance',
      'cameras': 'Cameras',
      'contacts': 'Contacts',
      'expenses': 'Expenses',
      'search': 'Search',
      'document': 'Document',
      'jobs': 'Jobs',
      'stats': 'Statistics',
      'library': 'Library',
      'account': 'Account'
    }

    if (labelMap[segment]) {
      label = labelMap[segment]
    }

    // Add boat ID display if present
    if (segment.match(/^[0-9a-f-]+$/) && index > 0) {
      label = `Boat: ${segment.substring(0, 8)}...`
    }

    crumbs.push({
      label,
      path: currentPath
    })
  })

  return crumbs
})
</script>

<style scoped>
.breadcrumb-nav {
  padding: 0.5rem 0;
}

.breadcrumb-item {
  @apply text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1;
  text-decoration: none;
}

.breadcrumb-item:focus-visible {
  @apply ring-2 ring-primary-400 rounded px-1;
}

.breadcrumb-separator {
  @apply text-gray-400 mx-1;
}

.breadcrumb-current {
  @apply text-white/70 font-medium;
}
</style>
