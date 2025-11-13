# LibraryView Component - Issues & Recommendations

**Component:** `/home/setup/navidocs/client/src/views/LibraryView.vue`
**Analysis Date:** 2025-10-23
**Version:** 1.0

---

## Executive Summary

The LibraryView component is well-structured and follows Vue 3 best practices, but several issues were identified during test documentation creation. This document categorizes issues by severity and provides actionable recommendations.

---

## Critical Issues (Must Fix)

### 1. No API Integration

**Current State:**
- All data is hardcoded in the component template
- No API calls on component mount
- No dynamic data loading

**Impact:**
- Component shows static data only
- Cannot scale to production use
- No real-time updates

**Recommendation:**
```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(true)
const error = ref(null)
const essentialDocuments = ref([])
const categories = ref([])
const recentActivity = ref([])

const roles = [
  // ... existing roles
]

const currentRole = ref('owner')

async function fetchLibraryData() {
  try {
    loading.value = true
    const response = await fetch('/api/vessels/lilian-i/documents/essential')
    const data = await response.json()
    essentialDocuments.value = data.essentialDocuments
    // ... populate other data
  } catch (err) {
    error.value = err.message
    console.error('Failed to fetch library data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLibraryData()
})
</script>
```

---

### 2. Missing Accessibility Attributes

**Current State:**
- Category cards use `@click` but are `<div>` elements
- No ARIA labels on icon-only buttons
- No keyboard navigation support for category cards
- No screen reader announcements for role changes

**Impact:**
- Fails WCAG 2.1 Level AA compliance
- Unusable for keyboard-only users
- Poor screen reader experience

**Recommendation:**

**A. Convert category cards to semantic buttons:**
```vue
<button
  class="category-card group"
  @click="navigateToCategory('legal')"
  :aria-label="`Navigate to Legal & Compliance category, 8 documents`"
>
  <!-- card content -->
</button>
```

**B. Add ARIA to role switcher:**
```vue
<div
  class="glass rounded-xl p-1 flex items-center gap-1"
  role="group"
  aria-label="Select user role"
>
  <button
    v-for="role in roles"
    :key="role.id"
    @click="currentRole = role.id"
    :aria-pressed="currentRole === role.id"
    :aria-label="`Switch to ${role.label} role`"
    :class="[
      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
      currentRole === role.id
        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md'
        : 'text-white/70 hover:text-white hover:bg-white/10'
    ]"
  >
    <svg class="w-4 h-4 inline-block mr-1.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="role.icon" />
    </svg>
    {{ role.label }}
  </button>
</div>
```

**C. Add live region for role changes:**
```vue
<div
  class="sr-only"
  role="status"
  aria-live="polite"
>
  {{ currentRole === 'owner' ? 'Owner view selected' : '' }}
  {{ currentRole === 'captain' ? 'Captain view selected' : '' }}
  {{ currentRole === 'manager' ? 'Manager view selected' : '' }}
  {{ currentRole === 'crew' ? 'Crew view selected' : '' }}
</div>
```

**D. Add keyboard support:**
```vue
<div
  class="category-card group"
  role="button"
  tabindex="0"
  @click="navigateToCategory('legal')"
  @keydown.enter="navigateToCategory('legal')"
  @keydown.space.prevent="navigateToCategory('legal')"
>
  <!-- card content -->
</div>
```

---

### 3. Incomplete Router Integration

**Current State:**
- `navigateToCategory()` only logs to console
- No actual route navigation implemented
- Category detail pages don't exist

**Impact:**
- Users cannot drill into categories
- Click events lead nowhere
- Poor user experience

**Recommendation:**

**A. Update router configuration:**
```javascript
// /home/setup/navidocs/client/src/router.js
{
  path: '/library/category/:categoryId',
  name: 'library-category',
  component: () => import('./views/LibraryCategoryView.vue')
}
```

**B. Update navigation function:**
```vue
<script setup>
function navigateToCategory(category) {
  router.push({
    name: 'library-category',
    params: { categoryId: category }
  })
}
</script>
```

**C. Create LibraryCategoryView.vue:**
Create a new view at `/home/setup/navidocs/client/src/views/LibraryCategoryView.vue` to display filtered documents.

---

## Major Issues (Should Fix)

### 4. No State Persistence

**Current State:**
- Role selection resets on page refresh
- No localStorage or session storage
- User preferences lost

**Impact:**
- Poor UX - users must reselect role every visit
- No continuity between sessions

**Recommendation:**

**A. Add localStorage persistence:**
```vue
<script setup>
import { ref, watch, onMounted } from 'vue'

const currentRole = ref(localStorage.getItem('libraryRole') || 'owner')

watch(currentRole, (newRole) => {
  localStorage.setItem('libraryRole', newRole)
  console.log('Role saved to localStorage:', newRole)
})

onMounted(() => {
  const savedRole = localStorage.getItem('libraryRole')
  if (savedRole) {
    currentRole.value = savedRole
    console.log('Restored role from localStorage:', savedRole)
  }
})
</script>
```

**B. Add Pinia store (better approach):**
```javascript
// /home/setup/navidocs/client/src/stores/library.js
import { defineStore } from 'pinia'

export const useLibraryStore = defineStore('library', {
  state: () => ({
    currentRole: localStorage.getItem('libraryRole') || 'owner',
    pinnedDocuments: JSON.parse(localStorage.getItem('pinnedDocuments') || '[]')
  }),
  actions: {
    setRole(role) {
      this.currentRole = role
      localStorage.setItem('libraryRole', role)
    },
    togglePin(docId) {
      const index = this.pinnedDocuments.indexOf(docId)
      if (index > -1) {
        this.pinnedDocuments.splice(index, 1)
      } else {
        this.pinnedDocuments.push(docId)
      }
      localStorage.setItem('pinnedDocuments', JSON.stringify(this.pinnedDocuments))
    }
  }
})
```

---

### 5. Pin Functionality Not Implemented

**Current State:**
- "Pin Document" button does nothing
- Bookmark icons not interactive
- No visual feedback on click

**Impact:**
- Misleading UI - buttons appear functional but aren't
- Incomplete feature

**Recommendation:**

**A. Add pin handler:**
```vue
<script setup>
const pinnedDocs = ref(new Set(['doc_insurance_2025'])) // Default pins

function togglePin(docId) {
  if (pinnedDocs.value.has(docId)) {
    pinnedDocs.value.delete(docId)
    console.log('Unpinned:', docId)
    // TODO: Call API to unpin
  } else {
    pinnedDocs.value.add(docId)
    console.log('Pinned:', docId)
    // TODO: Call API to pin
  }
}

function isPinned(docId) {
  return pinnedDocs.value.has(docId)
}
</script>
```

**B. Update template:**
```vue
<button
  @click.stop="togglePin('doc_insurance_2025')"
  :class="[
    'p-1 rounded-lg transition-all',
    isPinned('doc_insurance_2025')
      ? 'text-pink-400'
      : 'text-white/40 hover:text-pink-300 hover:bg-white/10'
  ]"
  :aria-label="isPinned('doc_insurance_2025') ? 'Unpin document' : 'Pin document'"
>
  <svg class="w-5 h-5" :fill="isPinned('doc_insurance_2025') ? 'currentColor' : 'none'" viewBox="0 0 20 20">
    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
  </svg>
</button>
```

---

### 6. No Loading States

**Current State:**
- No loading indicators
- No skeleton screens
- Instant content or nothing

**Impact:**
- Confusing during data fetch
- Appears broken on slow connections

**Recommendation:**

**A. Add loading state:**
```vue
<template>
  <div class="min-h-screen">
    <!-- Loading skeleton -->
    <div v-if="loading" class="max-w-7xl mx-auto px-6 py-8">
      <div class="skeleton h-64 mb-8"></div>
      <div class="grid grid-cols-3 gap-4">
        <div class="skeleton h-48"></div>
        <div class="skeleton h-48"></div>
        <div class="skeleton h-48"></div>
      </div>
    </div>

    <!-- Actual content -->
    <div v-else>
      <!-- existing content -->
    </div>
  </div>
</template>
```

**B. Use existing skeleton styles:**
The `main.css` already has `.skeleton` class with shimmer animation.

---

### 7. No Error Handling

**Current State:**
- No error states
- No error messages
- No retry mechanism

**Impact:**
- Silent failures confuse users
- No way to recover from errors

**Recommendation:**

```vue
<template>
  <div v-if="error" class="max-w-7xl mx-auto px-6 py-8">
    <div class="glass rounded-2xl p-8 text-center">
      <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="text-2xl font-bold text-white mb-2">Failed to Load Library</h2>
      <p class="text-white/70 mb-6">{{ error }}</p>
      <button @click="fetchLibraryData" class="btn btn-primary">
        Try Again
      </button>
    </div>
  </div>
</template>

<script setup>
const error = ref(null)

async function fetchLibraryData() {
  try {
    error.value = null
    loading.value = true
    // ... fetch logic
  } catch (err) {
    error.value = err.message || 'An unexpected error occurred'
    console.error('Library fetch error:', err)
  } finally {
    loading.value = false
  }
}
</script>
```

---

## Minor Issues (Nice to Have)

### 8. Role Switcher Doesn't Filter Content

**Current State:**
- Changing role updates state but shows same content
- No role-based filtering

**Impact:**
- Feature appears broken
- No value to switching roles

**Recommendation:**

```vue
<script setup>
import { computed } from 'vue'

const visibleDocuments = computed(() => {
  if (currentRole.value === 'crew') {
    // Crew sees limited documents
    return essentialDocuments.value.filter(doc =>
      ['safety', 'operations'].includes(doc.category)
    )
  }
  if (currentRole.value === 'captain') {
    // Captain sees all essential docs
    return essentialDocuments.value
  }
  // Owner and Manager see everything
  return allDocuments.value
})
</script>

<template>
  <div v-for="doc in visibleDocuments" :key="doc.id">
    <!-- document card -->
  </div>
</template>
```

---

### 9. Static Document Counts

**Current State:**
- "29 documents" is hardcoded
- Category counts are static

**Impact:**
- Inaccurate as data changes
- Requires code updates for new docs

**Recommendation:**

```vue
<script setup>
const totalDocuments = computed(() => {
  return categories.value.reduce((sum, cat) => sum + cat.documentCount, 0)
})

const vesselName = ref('LILIAN I')
</script>

<template>
<p class="text-xs text-white/70">{{ vesselName }} - {{ totalDocuments }} documents</p>
</template>
```

---

### 10. Missing Document Click Handlers

**Current State:**
- Essential document cards not clickable
- No way to open/view documents

**Impact:**
- Users can't access documents
- Cards look interactive but aren't

**Recommendation:**

```vue
<div
  class="essential-doc-card group cursor-pointer"
  @click="openDocument('doc_insurance_2025')"
>
  <!-- card content -->
</div>

<script setup>
function openDocument(docId) {
  router.push({
    name: 'document',
    params: { id: docId }
  })
}
</script>
```

---

### 11. No Search Functionality

**Current State:**
- No search bar in library view
- Users must scroll to find documents

**Impact:**
- Poor UX for large libraries
- Difficult to find specific docs

**Recommendation:**

Add search bar to header:
```vue
<div class="flex items-center justify-between mb-8">
  <div>
    <h2 class="text-2xl font-bold text-white">Essential Documents</h2>
  </div>
  <div class="search-bar w-64">
    <input
      type="text"
      v-model="searchQuery"
      placeholder="Search documents..."
      class="search-input"
    />
  </div>
</div>
```

---

### 12. No Pagination or Virtual Scrolling

**Current State:**
- Renders all items at once
- No pagination

**Impact:**
- Performance issues with large datasets (>100 documents)
- Long scroll on large libraries

**Recommendation:**

For now, acceptable since only 29 documents. Consider adding pagination when document count exceeds 50.

---

## Code Quality Issues

### 13. Missing Props Validation

**Recommendation:**
If component accepts props in the future, add PropTypes:
```vue
<script setup>
defineProps({
  vesselId: {
    type: String,
    required: true
  },
  initialRole: {
    type: String,
    default: 'owner',
    validator: (value) => ['owner', 'captain', 'manager', 'crew'].includes(value)
  }
})
</script>
```

---

### 14. No TypeScript Support

**Recommendation:**
Consider migrating to TypeScript for better type safety:
```typescript
// types.ts
export interface Document {
  id: string
  title: string
  description: string
  type: string
  status: 'active' | 'expired' | 'pending'
  fileType: string
  expiryDate?: string
  isPinned: boolean
}

export interface Category {
  id: string
  name: string
  description: string
  documentCount: number
  color: string
  icon: string
}
```

---

### 15. Large Component File

**Current State:**
- 533 lines in single file
- Could be split into smaller components

**Recommendation:**

Extract subcomponents:
- `EssentialDocumentCard.vue`
- `CategoryCard.vue`
- `ActivityItem.vue`
- `RoleSwitcher.vue`

Example:
```vue
<!-- components/EssentialDocumentCard.vue -->
<template>
  <div class="essential-doc-card group" @click="handleClick">
    <div class="flex items-start gap-3">
      <div :class="['w-12 h-12 rounded-xl flex items-center justify-center', iconColorClass]">
        <slot name="icon"></slot>
      </div>
      <div class="flex-1">
        <h3 class="font-bold text-white mb-1">{{ title }}</h3>
        <p class="text-xs text-white/70 mb-2">{{ description }}</p>
      </div>
    </div>
    <slot name="badge"></slot>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String,
  iconColorClass: String
})

defineEmits(['click'])
</script>
```

---

## Security Issues

### 16. No Input Sanitization

**Current State:**
- If API returns HTML in titles/descriptions, could lead to XSS

**Recommendation:**
Vue 3 automatically escapes text content, so this is mostly safe. However, if using `v-html` in future:
```vue
<!-- Bad -->
<div v-html="userContent"></div>

<!-- Good -->
<div>{{ sanitize(userContent) }}</div>

<script setup>
import DOMPurify from 'dompurify'

function sanitize(html) {
  return DOMPurify.sanitize(html)
}
</script>
```

---

### 17. No Authentication Check

**Current State:**
- No auth guard on route
- Anyone can access library view

**Recommendation:**

Add route meta:
```javascript
// router.js
{
  path: '/library',
  name: 'library',
  component: () => import('./views/LibraryView.vue'),
  meta: { requiresAuth: true }
}
```

Component-level check:
```vue
<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  const token = localStorage.getItem('accessToken')
  if (!token) {
    router.push({ name: 'login', query: { redirect: '/library' } })
  }
})
</script>
```

---

## Performance Issues

### 18. No Memoization

**Current State:**
- Role filtering logic would run on every render

**Recommendation:**
```vue
<script setup>
import { computed } from 'vue'

// Instead of filtering in template
const filteredDocuments = computed(() => {
  return documents.value.filter(doc =>
    doc.roles.includes(currentRole.value)
  )
})
</script>
```

---

### 19. No Image Optimization

**Current State:**
- Using inline SVGs (good)
- No image lazy loading if photos are added

**Recommendation:**
If adding raster images:
```vue
<img
  :src="doc.thumbnail"
  loading="lazy"
  :alt="doc.title"
  class="w-full h-48 object-cover"
/>
```

---

## Testing Gaps

### 20. No Unit Tests

**Recommendation:**

Create unit tests with Vitest:
```javascript
// LibraryView.test.js
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import LibraryView from '@/views/LibraryView.vue'

describe('LibraryView', () => {
  it('renders with default role', () => {
    const wrapper = mount(LibraryView)
    expect(wrapper.find('.text-xl').text()).toBe('Document Library')
  })

  it('changes role on button click', async () => {
    const wrapper = mount(LibraryView)
    await wrapper.findAll('button')[1].trigger('click') // Click Captain
    expect(wrapper.vm.currentRole).toBe('captain')
  })

  it('navigates on category click', async () => {
    const wrapper = mount(LibraryView)
    const spy = vi.spyOn(wrapper.vm.router, 'push')
    await wrapper.find('.category-card').trigger('click')
    expect(spy).toHaveBeenCalled()
  })
})
```

---

### 21. No E2E Tests

**Recommendation:**

Create Playwright tests:
```javascript
// tests/e2e/library.spec.js
import { test, expect } from '@playwright/test'

test.describe('LibraryView', () => {
  test('loads and displays all sections', async ({ page }) => {
    await page.goto('http://localhost:5173/library')

    await expect(page.locator('h1')).toContainText('Document Library')
    await expect(page.locator('text=Essential Documents')).toBeVisible()
    await expect(page.locator('text=Browse by Category')).toBeVisible()
    await expect(page.locator('.essential-doc-card')).toHaveCount(3)
    await expect(page.locator('.category-card')).toHaveCount(8)
  })

  test('role switcher works', async ({ page }) => {
    await page.goto('http://localhost:5173/library')

    await page.click('text=Captain')
    await expect(page.locator('button:has-text("Captain")')).toHaveCSS(
      'background-image',
      /linear-gradient/
    )
  })

  test('category navigation works', async ({ page }) => {
    await page.goto('http://localhost:5173/library')

    await page.click('text=Legal & Compliance')
    // Verify navigation or console log
  })
})
```

---

## Documentation Gaps

### 22. Missing Component Documentation

**Recommendation:**

Add JSDoc comments:
```vue
<script setup>
/**
 * LibraryView Component
 *
 * Displays the document library for a vessel, including:
 * - Essential documents (insurance, registration, manuals)
 * - Category browser for organized document access
 * - Role-based filtering (owner, captain, manager, crew)
 * - Recent activity timeline
 *
 * @component
 * @example
 * <LibraryView />
 */

/**
 * Available user roles for filtering documents
 * @type {Array<{id: string, label: string, icon: string}>}
 */
const roles = [
  // ...
]

/**
 * Currently selected role
 * @type {Ref<string>}
 */
const currentRole = ref('owner')

/**
 * Navigate to a specific document category
 * @param {string} category - The category ID to navigate to
 */
function navigateToCategory(category) {
  console.log('Navigate to category:', category)
}
</script>
```

---

## Priority Matrix

| Priority | Issue # | Issue Name | Effort | Impact |
|----------|---------|------------|--------|--------|
| 🔴 P0 | 1 | No API Integration | High | Critical |
| 🔴 P0 | 2 | Missing Accessibility | Medium | Critical |
| 🔴 P0 | 3 | Incomplete Router Integration | Medium | Critical |
| 🟡 P1 | 4 | No State Persistence | Low | High |
| 🟡 P1 | 5 | Pin Functionality Not Implemented | Medium | High |
| 🟡 P1 | 6 | No Loading States | Low | High |
| 🟡 P1 | 7 | No Error Handling | Low | High |
| 🟢 P2 | 8 | Role Switcher Doesn't Filter | Medium | Medium |
| 🟢 P2 | 10 | Missing Document Click Handlers | Low | Medium |
| 🟢 P2 | 20 | No Unit Tests | High | Medium |
| 🟢 P2 | 21 | No E2E Tests | Medium | Medium |
| 🔵 P3 | 9 | Static Document Counts | Low | Low |
| 🔵 P3 | 11 | No Search Functionality | High | Low |
| 🔵 P3 | 15 | Large Component File | Medium | Low |

---

## Next Actions

### Immediate (Week 1)
1. Implement API integration (#1)
2. Add accessibility attributes (#2)
3. Complete router navigation (#3)
4. Add loading and error states (#6, #7)

### Short-term (Week 2-3)
5. Implement pin functionality (#5)
6. Add state persistence (#4)
7. Add role-based filtering (#8)
8. Make document cards clickable (#10)

### Medium-term (Month 1)
9. Write unit tests (#20)
10. Write E2E tests (#21)
11. Extract subcomponents (#15)
12. Add search functionality (#11)

### Long-term (Quarter 1)
13. Add TypeScript support (#14)
14. Performance optimizations (#18, #19)
15. Complete documentation (#22)
16. Security audit (#16, #17)

---

## Conclusion

The LibraryView component has a solid foundation with excellent styling and user interface design. However, it currently functions as a static prototype and requires significant work to become production-ready.

**Critical blockers for production:**
- API integration
- Accessibility compliance
- Router navigation
- Error handling

**Estimated effort to production-ready:**
- Development: 2-3 weeks
- Testing: 1 week
- Total: 3-4 weeks

---

**Document Version:** 1.0
**Last Updated:** 2025-10-23
**Next Review:** 2025-11-06
