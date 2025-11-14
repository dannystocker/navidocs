<template>
  <router-link
    v-if="params"
    :to="{ name: resolveName(to), params }"
    :class="['nav-link', { 'active': isActive }]">
    <span class="icon">{{ icon }}</span>
    <span class="label">{{ label }}</span>
  </router-link>
  <router-link
    v-else
    :to="to"
    :class="['nav-link', { 'active': isActive }]">
    <span class="icon">{{ icon }}</span>
    <span class="label">{{ label }}</span>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  to: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  params: {
    type: Object,
    default: null
  }
})

const route = useRoute()

/**
 * Resolve route name from path
 */
function resolveName(path) {
  const nameMap = {
    '/inventory': 'inventory',
    '/maintenance': 'maintenance',
    '/cameras': 'cameras',
    '/contacts': 'contacts',
    '/expenses': 'expenses',
    '/search': 'search',
    '/jobs': 'jobs',
    '/stats': 'stats',
    '/library': 'library',
    '/account': 'account'
  }
  return nameMap[path] || path
}

/**
 * Check if link is active
 */
const isActive = computed(() => {
  if (props.params) {
    // For parameterized routes, check if the module matches
    return route.meta?.module === resolveName(props.to)
  }
  return route.path === props.to
})
</script>

<style scoped>
.nav-link {
  @apply px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary-400;
  text-decoration: none;
}

.nav-link.active {
  @apply text-primary-300 bg-primary-500/20;
}

.icon {
  @apply text-base;
}

.label {
  @apply hidden sm:inline;
}
</style>
