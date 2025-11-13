/**
 * Vue Router configuration
 */

import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('./views/SearchView.vue')
    },
    {
      path: '/document/:id',
      name: 'document',
      component: () => import('./views/DocumentView.vue')
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: () => import('./views/JobsView.vue')
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('./views/StatsView.vue')
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('./views/LibraryView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('./views/AuthView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('./views/AccountView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const accessToken = localStorage.getItem('accessToken')
  const isAuthenticated = !!accessToken

  // Check if route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirect to login page with return URL
    next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
  }
  // Check if route requires guest (not authenticated)
  else if (to.meta.requiresGuest && isAuthenticated) {
    // Redirect to home if already logged in
    next({ name: 'home' })
  }
  // Allow navigation
  else {
    next()
  }
})

export default router
