<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="glass sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button aria-label="Go to home page" @click="$router.push('/')" class="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-md hover:scale-105 transition-transform">
              <svg aria-hidden="true" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15c3-2 6-2 9 0s6 2 9 0M3 9c3-2 6-2 9 0s6 2 9 0" />
              </svg>
            </button>
            <div>
              <h1 class="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Document Library</h1>
              <p class="text-xs text-white/70">LILIAN I - 29 documents</p>
            </div>
          </div>

          <!-- Role Switcher -->
          <div class="flex items-center gap-3">
            <div class="glass rounded-xl p-1 flex items-center gap-1">
              <button
                v-for="role in roles"
                :key="role.id"
                @click="currentRole = role.id"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  currentRole === role.id
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                ]"
              >
                <svg class="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="role.icon" />
                </svg>
                {{ role.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8">
      <!-- Essential Documents Section -->
      <section class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-white">Essential Documents</h2>
              <p class="text-sm text-white/70">Critical documents requiring quick access</p>
            </div>
          </div>
          <button aria-label="Pin important document" class="text-pink-400 hover:text-pink-300 text-sm font-medium flex items-center gap-2 transition-colors">
            <svg aria-hidden="true" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Pin Document
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Insurance -->
          <div class="essential-doc-card group">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-start gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-white mb-1">Insurance Policy 2025</h3>
                  <p class="text-xs text-white/70 mb-2">Coverage: Full hull & liability</p>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="badge badge-success text-xs">Active</span>
                    <span class="text-xs text-white/60">PDF</span>
                  </div>
                </div>
              </div>
              <button aria-label="Bookmark Insurance Policy" class="text-pink-400 hover:text-pink-300 p-1 rounded-lg hover:bg-white/10 transition-all">
                <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              </button>
            </div>
            <div class="expiry-alert">
              <svg aria-hidden="true" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Expires in 68 days (Dec 31, 2025)</span>
            </div>
          </div>

          <!-- Registration -->
          <div class="essential-doc-card group">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-start gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <svg aria-hidden="true" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-white mb-1">LILIAN I Registration</h3>
                  <p class="text-xs text-white/70 mb-2">LLC • Monaco Registry</p>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="badge badge-success text-xs">Valid</span>
                    <span class="text-xs text-white/60">PDF</span>
                  </div>
                </div>
              </div>
              <button aria-label="Bookmark LILIAN I Registration" class="text-pink-400 hover:text-pink-300 p-1 rounded-lg hover:bg-white/10 transition-all">
                <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              </button>
            </div>
            <div class="compliance-badge">
              <svg aria-hidden="true" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Legally required aboard vessel</span>
            </div>
          </div>

          <!-- Owner's Manual -->
          <div class="essential-doc-card group">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-start gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <svg aria-hidden="true" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-white mb-1">Owner's Manual</h3>
                  <p class="text-xs text-white/70 mb-2">Complete vessel documentation</p>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="badge badge-primary text-xs">17 pages</span>
                    <span class="text-xs text-white/60">PDF</span>
                  </div>
                </div>
              </div>
              <button aria-label="Bookmark Owner's Manual" class="text-pink-400 hover:text-pink-300 p-1 rounded-lg hover:bg-white/10 transition-all">
                <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              </button>
            </div>
            <div class="info-badge">
              <svg aria-hidden="true" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Emergency reference • 6.7 MB</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Browse by Category -->
      <section class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-white">Browse by Category</h2>
              <p class="text-sm text-white/70">Organized document collections</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <!-- Legal & Compliance -->
          <div class="category-card group" @click="navigateToCategory('legal')">
            <div class="relative">
              <div class="category-icon-wrapper bg-gradient-to-br from-green-500 to-green-600">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div class="mt-4">
                <h3 class="font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">Legal & Compliance</h3>
                <p class="text-sm text-white/70 mb-3">Registration, licensing, customs</p>
                <div class="flex items-center justify-between">
                  <span class="badge badge-success text-xs">8 documents</span>
                  <svg class="w-5 h-5 text-white/30 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Financial -->
          <div class="category-card group" @click="navigateToCategory('financial')">
            <div class="relative">
              <div class="category-icon-wrapper bg-gradient-to-br from-yellow-500 to-yellow-600">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="mt-4">
                <h3 class="font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">Financial</h3>
                <p class="text-sm text-white/70 mb-3">Invoices, expenses, payments</p>
                <div class="flex items-center justify-between">
                  <span class="badge badge-primary text-xs">11 documents</span>
                  <svg class="w-5 h-5 text-white/30 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Operations -->
          <div class="category-card group" @click="navigateToCategory('operations')">
            <div class="relative">
              <div class="category-icon-wrapper bg-gradient-to-br from-blue-500 to-blue-600">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div class="mt-4">
                <h3 class="font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">Operations</h3>
                <p class="text-sm text-white/70 mb-3">Delivery logs, crew schedules</p>
                <div class="flex items-center justify-between">
                  <span class="badge badge-primary text-xs">2 documents</span>
                  <svg class="w-5 h-5 text-white/30 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Manuals & Technical -->
          <div class="category-card group" @click="navigateToCategory('manuals')">
            <div class="relative">
              <div class="category-icon-wrapper bg-gradient-to-br from-purple-500 to-purple-600">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div class="mt-4">
                <h3 class="font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">Manuals</h3>
                <p class="text-sm text-white/70 mb-3">Equipment, technical docs</p>
                <div class="flex items-center justify-between">
                  <span class="badge badge-primary text-xs">1 document</span>
                  <svg class="w-5 h-5 text-white/30 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Insurance -->
          <div class="category-card group" @click="navigateToCategory('insurance')">
            <div class="relative">
              <div class="category-icon-wrapper bg-gradient-to-br from-indigo-500 to-indigo-600">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div class="mt-4">
                <h3 class="font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">Insurance</h3>
                <p class="text-sm text-white/70 mb-3">Policies, claims, coverage</p>
                <div class="flex items-center justify-between">
                  <span class="badge badge-success text-xs">1 document</span>
                  <svg class="w-5 h-5 text-white/30 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Photos -->
          <div class="category-card group" @click="navigateToCategory('photos')">
            <div class="relative">
              <div class="category-icon-wrapper bg-gradient-to-br from-pink-500 to-pink-600">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="mt-4">
                <h3 class="font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">Photos</h3>
                <p class="text-sm text-white/70 mb-3">Vessel, equipment photos</p>
                <div class="flex items-center justify-between">
                  <span class="badge badge-primary text-xs">3 images</span>
                  <svg class="w-5 h-5 text-white/30 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Service Records -->
          <div class="category-card group" @click="navigateToCategory('service')">
            <div class="relative">
              <div class="category-icon-wrapper bg-gradient-to-br from-orange-500 to-orange-600">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div class="mt-4">
                <h3 class="font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">Service Records</h3>
                <p class="text-sm text-white/70 mb-3">Maintenance, repairs</p>
                <div class="flex items-center justify-between">
                  <span class="badge text-xs bg-white/10 text-white/70">Coming soon</span>
                  <svg class="w-5 h-5 text-white/30 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Warranties -->
          <div class="category-card group" @click="navigateToCategory('warranties')">
            <div class="relative">
              <div class="category-icon-wrapper bg-gradient-to-br from-teal-500 to-teal-600">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div class="mt-4">
                <h3 class="font-bold text-white mb-1 group-hover:text-pink-400 transition-colors">Warranties</h3>
                <p class="text-sm text-white/70 mb-3">Equipment warranties</p>
                <div class="flex items-center justify-between">
                  <span class="badge text-xs bg-white/10 text-white/70">Coming soon</span>
                  <svg class="w-5 h-5 text-white/30 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Activity -->
      <section>
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-xl flex items-center justify-center shadow-md">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-white">Recent Activity</h2>
              <p class="text-sm text-white/70">Latest uploads and views</p>
            </div>
          </div>
        </div>

        <div class="glass rounded-2xl p-6">
          <div class="space-y-3">
            <!-- Recent Item 1 -->
            <div class="activity-item group">
              <div class="flex items-center gap-3">
                <div class="file-type-badge badge-pdf">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>PDF</span>
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-white group-hover:text-pink-400 transition-colors">Facture n° F1820008157</h4>
                  <p class="text-xs text-white/70">Uploaded today at 2:30 PM</p>
                </div>
                <span class="badge badge-success text-xs">Indexed</span>
              </div>
            </div>

            <!-- Recent Item 2 -->
            <div class="activity-item group">
              <div class="flex items-center gap-3">
                <div class="file-type-badge badge-excel">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>XLSX</span>
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-white group-hover:text-pink-400 transition-colors">Lilian delivery Olbia Cannes</h4>
                  <p class="text-xs text-white/70">Viewed yesterday at 11:45 AM</p>
                </div>
                <span class="badge text-xs bg-white/10 text-white/70">Opened</span>
              </div>
            </div>

            <!-- Recent Item 3 -->
            <div class="activity-item group">
              <div class="flex items-center gap-3">
                <div class="file-type-badge badge-image">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>JPG</span>
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-white group-hover:text-pink-400 transition-colors">Vessel exterior photo</h4>
                  <p class="text-xs text-white/70">Shared 2 days ago</p>
                </div>
                <span class="badge badge-primary text-xs">Shared</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const roles = [
  { id: 'owner', label: 'Owner', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'captain', label: 'Captain', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { id: 'manager', label: 'Manager', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { id: 'crew', label: 'Crew', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
]

const currentRole = ref('owner')

function navigateToCategory(category) {
  // TODO: Navigate to category view
  console.log('Navigate to category:', category)
}
</script>

<style scoped>
/* Essential Document Cards */
.essential-doc-card {
  @apply relative glass rounded-2xl p-6 border-2 border-pink-400/30 hover:border-pink-400/50 transition-all duration-300 cursor-pointer;
  @apply hover:shadow-soft-lg hover:-translate-y-1;
}

.expiry-alert {
  @apply flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 text-xs font-medium;
}

.compliance-badge {
  @apply flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-medium;
}

.info-badge {
  @apply flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-medium;
}

/* Category Cards */
.category-card {
  @apply glass rounded-2xl p-6 cursor-pointer transition-all duration-300;
  @apply hover:shadow-soft-lg hover:-translate-y-1 hover:border-pink-400/30 border border-white/10;
}

.category-icon-wrapper {
  @apply w-14 h-14 rounded-xl flex items-center justify-center shadow-md;
  @apply transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300;
}

/* Activity Items */
.activity-item {
  @apply bg-white/10 backdrop-blur-lg rounded-lg p-4 hover:bg-white/15 transition-all cursor-pointer border border-white/10;
  @apply hover:-translate-y-0.5 duration-200;
}

/* File Type Badges */
.file-type-badge {
  @apply flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0;
}

.badge-pdf {
  @apply bg-red-500/20 border border-red-400/30 text-red-300;
}

.badge-excel {
  @apply bg-green-500/20 border border-green-400/30 text-green-300;
}

.badge-image {
  @apply bg-purple-500/20 border border-purple-400/30 text-purple-300;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.essential-doc-card,
.category-card {
  animation: fadeIn 0.4s ease-out backwards;
}

.essential-doc-card:nth-child(1) { animation-delay: 0.1s; }
.essential-doc-card:nth-child(2) { animation-delay: 0.2s; }
.essential-doc-card:nth-child(3) { animation-delay: 0.3s; }

.category-card:nth-child(1) { animation-delay: 0.1s; }
.category-card:nth-child(2) { animation-delay: 0.15s; }
.category-card:nth-child(3) { animation-delay: 0.2s; }
.category-card:nth-child(4) { animation-delay: 0.25s; }
.category-card:nth-child(5) { animation-delay: 0.3s; }
.category-card:nth-child(6) { animation-delay: 0.35s; }
.category-card:nth-child(7) { animation-delay: 0.4s; }
.category-card:nth-child(8) { animation-delay: 0.45s; }
</style>
