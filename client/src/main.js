/**
 * NaviDocs Frontend - Vue 3 Entry Point
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import i18n from './i18n'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)

// Global error logger (Tier 2 - send errors to backend)
function logClientError(level, msg, context) {
  console[level](msg, context);

  // Send to backend (fire-and-forget, don't block UI)
  fetch('http://localhost:8001/api/client-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, msg, context })
  }).catch(() => {
    // Silently fail if backend is down
  });
}

// Catch unhandled JavaScript errors
window.addEventListener('error', (event) => {
  logClientError('error', 'UNHANDLED_ERROR', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logClientError('error', 'UNHANDLED_REJECTION', {
    reason: event.reason?.message || String(event.reason),
    stack: event.reason?.stack
  });
});

// Catch Vue-specific errors
app.config.errorHandler = (err, instance, info) => {
  logClientError('error', 'VUE_ERROR', {
    message: err.message,
    info,
    stack: err.stack,
    component: instance?.$options.name
  });
};

app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => {
        // Service worker registered successfully
      })
      .catch(() => {
        // Service worker registration failed - silent fail
      });
  });
}
