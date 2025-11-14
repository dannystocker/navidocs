/**
 * Vue Router configuration
 * Handles routing for NaviDocs modules including inventory, maintenance, cameras, contacts, and expenses
 */

import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Home' }
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('./views/SearchView.vue'),
      meta: { title: 'Search' }
    },
    {
      path: '/document/:id',
      name: 'document',
      component: () => import('./views/DocumentView.vue'),
      meta: { title: 'Document' }
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: () => import('./views/JobsView.vue'),
      meta: { title: 'Jobs', requiresAuth: true }
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('./views/StatsView.vue'),
      meta: { title: 'Statistics', requiresAuth: true }
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('./views/LibraryView.vue'),
      meta: { title: 'Library', requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('./views/AuthView.vue'),
      meta: { title: 'Login', requiresGuest: true }
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('./views/AccountView.vue'),
      meta: { title: 'Account', requiresAuth: true }
    },

    // --- Feature Modules (H-08 Frontend Navigation) ---
    {
      path: '/inventory/:boatId',
      name: 'inventory',
      component: () => import('./components/InventoryModule.vue'),
      meta: {
        title: 'Inventory Tracking',
        requiresAuth: true,
        module: 'inventory'
      },
      props: route => ({ boatId: route.params.boatId })
    },
    {
      path: '/maintenance/:boatId',
      name: 'maintenance',
      component: () => import('./components/MaintenanceModule.vue'),
      meta: {
        title: 'Maintenance Management',
        requiresAuth: true,
        module: 'maintenance'
      },
      props: route => ({ boatId: route.params.boatId })
    },
    {
      path: '/cameras/:boatId',
      name: 'cameras',
      component: () => import('./components/CameraModule.vue'),
      meta: {
        title: 'Camera Management',
        requiresAuth: true,
        module: 'cameras'
      },
      props: route => ({ boatId: route.params.boatId })
    },
    {
      path: '/contacts',
      name: 'contacts',
      component: () => import('./components/ContactsModule.vue'),
      meta: {
        title: 'Contacts',
        requiresAuth: true,
        module: 'contacts'
      }
    },
    {
      path: '/expenses/:boatId',
      name: 'expenses',
      component: () => import('./components/ExpenseModule.vue'),
      meta: {
        title: 'Expense Management',
        requiresAuth: true,
        module: 'expenses'
      },
      props: route => ({ boatId: route.params.boatId })
    },

    // Catch-all for 404
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('./views/NotFoundView.vue'),
      meta: { title: 'Page Not Found' }
    }
  ]
})

/**
 * Navigation Guards
 * Enforces authentication requirements and logging
 */
router.beforeEach((to, from, next) => {
  const accessToken = localStorage.getItem('accessToken')
  const isAuthenticated = !!accessToken

  // Update document title
  document.title = to.meta.title ? `${to.meta.title} - NaviDocs` : 'NaviDocs'

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

/**
 * After each route change
 * Used for logging and analytics
 */
router.afterEach((to, from) => {
  // Log navigation for debugging
  console.log(`Navigation: ${from.path} → ${to.path}`)
})

export default router
