<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <div class="inline-block mb-4">
          <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg mx-auto">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15c3-2 6-2 9 0s6 2 9 0M3 9c3-2 6-2 9 0s6 2 9 0" />
            </svg>
          </div>
        </div>
        <h1 class="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">NaviDocs</h1>
        <p class="text-white/70">Marine Document Intelligence</p>
      </div>

      <!-- Card -->
      <div class="glass rounded-2xl shadow-xl p-8 border border-white/10">
        <!-- Tabs -->
        <div class="flex border-b border-white/20 mb-6">
          <button
            @click="mode = 'login'"
            :class="[
              'flex-1 py-3 font-semibold border-b-2 transition-colors',
              mode === 'login'
                ? 'border-pink-400 text-pink-400'
                : 'border-transparent text-white/50 hover:text-white/70'
            ]"
          >
            Login
          </button>
          <button
            @click="mode = 'register'"
            :class="[
              'flex-1 py-3 font-semibold border-b-2 transition-colors',
              mode === 'register'
                ? 'border-pink-400 text-pink-400'
                : 'border-transparent text-white/50 hover:text-white/70'
            ]"
          >
            Register
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mb-4 p-4 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">
          {{ error }}
        </div>

        <!-- Success Message -->
        <div v-if="success" class="mb-4 p-4 bg-green-500/20 border border-green-400/30 rounded-lg text-green-300 text-sm">
          {{ success }}
        </div>

        <!-- Login Form -->
        <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white/80 mb-1">
              Email
            </label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:bg-white/15 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-1">
              Password
            </label>
            <input
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:bg-white/15 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">Sign In</span>
            <span v-else>Signing in...</span>
          </button>
        </form>

        <!-- Register Form -->
        <form v-if="mode === 'register'" @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white/80 mb-1">
              Full Name
            </label>
            <input
              v-model="name"
              type="text"
              required
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:bg-white/15 transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-1">
              Email
            </label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:bg-white/15 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-1">
              Password
            </label>
            <input
              v-model="password"
              type="password"
              required
              minlength="8"
              class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:ring-2 focus:ring-pink-400 focus:border-transparent focus:bg-white/15 transition-all"
              placeholder="Min. 8 characters"
            />
            <p class="text-xs text-white/50 mt-1">
              At least 8 characters with letters and numbers
            </p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">Create Account</span>
            <span v-else>Creating account...</span>
          </button>
        </form>

        <!-- Footer Links -->
        <div class="mt-6 text-center text-sm text-white/60">
          <router-link to="/" class="text-pink-400 hover:text-pink-300 font-medium transition-colors">
            ← Back to Home
          </router-link>
        </div>
      </div>

      <!-- Info -->
      <div class="mt-6 text-center text-xs text-white/40">
        <p>Secure connection. Your data is encrypted.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const route = useRoute()
const { login, register, isLoading, error: authError } = useAuth()

const mode = ref('login')
const email = ref('')
const password = ref('')
const name = ref('')
const error = ref(null)
const success = ref(null)

async function handleLogin() {
  error.value = null
  success.value = null

  const result = await login(email.value, password.value)

  if (result.success) {
    success.value = 'Login successful! Redirecting...'
    setTimeout(() => {
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    }, 500)
  } else {
    error.value = result.error || 'Login failed. Please check your credentials.'
  }
}

async function handleRegister() {
  error.value = null
  success.value = null

  const result = await register(email.value, password.value, name.value)

  if (result.success) {
    success.value = 'Account created successfully! Redirecting...'
    setTimeout(() => {
      router.push('/')
    }, 500)
  } else {
    error.value = result.error || 'Registration failed. Please try again.'
  }
}
</script>
