# LibraryView - Quick Reference Card

**Component:** `/home/setup/navidocs/client/src/views/LibraryView.vue`
**Route:** `/library`

---

## 5-Minute Checklist

Before committing changes to LibraryView:

```
□ Page loads without errors
□ All 3 sections visible (Essential, Categories, Activity)
□ Role switcher works (4 buttons)
□ Category clicks log to console
□ No console errors (F12)
□ Hover effects work
□ Responsive on mobile
```

**If all checked:** ✅ Ready to commit
**If any unchecked:** ❌ Fix before committing

---

## Test Commands

```bash
# Start dev server
cd /home/setup/navidocs/client && npm run dev

# Open in browser
http://localhost:5173/library

# Check console (F12 > Console)
# Should see: [LibraryView] Component mounted

# Test role switcher
# Click each role button, verify visual change

# Test category navigation
# Click any category, check console log
```

---

## Critical DOM Elements

```javascript
// Quick inspector commands (paste in browser console)

// Verify header loaded
document.querySelector('header.glass')?.textContent.includes('Document Library')

// Count essential docs (should be 3)
document.querySelectorAll('.essential-doc-card').length

// Count categories (should be 8)
document.querySelectorAll('.category-card').length

// Count activity items (should be 3)
document.querySelectorAll('.activity-item').length

// Check current role
document.querySelector('.from-primary-500.to-secondary-500')?.textContent.trim()
```

---

## Common Issues & Fixes

### Issue: Blank page
**Fix:** Check router.js for `/library` route

### Issue: Styles not loading
**Fix:** Verify Tailwind CSS is configured, check main.css import

### Issue: Role switcher doesn't update
**Fix:** Check Vue reactivity, ensure `ref()` is used

### Issue: Categories not clickable
**Fix:** Verify `@click="navigateToCategory()"` handler exists

### Issue: Console errors
**Fix:** Check component imports, Vue syntax, and undefined variables

---

## Smoke Test (2 minutes)

1. **Load:** Navigate to `/library` → ✅ Page loads
2. **Sections:** Scroll page → ✅ 3 sections visible
3. **Roles:** Click "Captain" button → ✅ Visual change
4. **Categories:** Click "Financial" card → ✅ Console logs "Navigate to category: financial"
5. **Console:** Open DevTools (F12) → ✅ No red errors

**All pass?** Ready to ship!

---

## Expected Console Output

```
[Vue Router] Navigating to: /library
[LibraryView] Component mounted
Navigate to category: legal         (on category click)
Navigate to category: financial     (on category click)
```

---

## Browser DevTools Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Open DevTools | F12 or Ctrl+Shift+I | Cmd+Opt+I |
| Console | Ctrl+Shift+J | Cmd+Opt+J |
| Elements | Ctrl+Shift+C | Cmd+Opt+C |
| Responsive Mode | Ctrl+Shift+M | Cmd+Opt+M |
| Hard Refresh | Ctrl+Shift+R | Cmd+Shift+R |

---

## File Locations

```
Component:  /home/setup/navidocs/client/src/views/LibraryView.vue
Router:     /home/setup/navidocs/client/src/router.js
Styles:     /home/setup/navidocs/client/src/assets/main.css
Tests:      /home/setup/navidocs/client/tests/LibraryView.test.md
Smoke Test: /home/setup/navidocs/SMOKE_TEST_CHECKLIST.md
Issues:     /home/setup/navidocs/client/tests/LibraryView-Issues.md
```

---

## Key Classes to Check

```css
/* Glass effect */
.glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(16px); }

/* Essential doc cards */
.essential-doc-card { border: 2px solid rgba(244,114,182,0.3); }

/* Category cards */
.category-card { cursor: pointer; transition: all 0.3s; }

/* Hover effects */
.hover\:-translate-y-1 { transform: translateY(-0.25rem); }

/* Active role button */
.from-primary-500.to-secondary-500 { /* gradient background */ }
```

---

## Data Structure

```javascript
// Roles
roles = [
  { id: 'owner', label: 'Owner', icon: '...' },
  { id: 'captain', label: 'Captain', icon: '...' },
  { id: 'manager', label: 'Manager', icon: '...' },
  { id: 'crew', label: 'Crew', icon: '...' }
]

// Current role (reactive)
currentRole = ref('owner')

// Categories (hardcoded in template)
- Legal & Compliance (8 docs)
- Financial (11 docs)
- Operations (2 docs)
- Manuals (1 doc)
- Insurance (1 doc)
- Photos (3 images)
- Service Records (coming soon)
- Warranties (coming soon)
```

---

## Breakpoints

```css
/* Mobile first, then: */
md:  768px   /* Tablet */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large desktop */
2xl: 1536px  /* Extra large */

/* Grid columns */
Mobile:  1 column
Tablet:  3 columns (essential), 3 columns (categories)
Desktop: 3 columns (essential), 4 columns (categories)
```

---

## Known Limitations

1. ⚠️ No API integration (static data)
2. ⚠️ Pin functionality not implemented
3. ⚠️ Category navigation logs only (no actual navigation)
4. ⚠️ Role switcher updates state but doesn't filter content
5. ⚠️ No loading/error states

See `/home/setup/navidocs/client/tests/LibraryView-Issues.md` for full list.

---

## Quick Fixes

### Add loading state
```vue
<script setup>
const loading = ref(false)
</script>

<template>
  <div v-if="loading" class="skeleton h-64"></div>
  <div v-else><!-- content --></div>
</template>
```

### Add error handling
```vue
<script setup>
const error = ref(null)
</script>

<template>
  <div v-if="error" class="text-red-400">{{ error }}</div>
</template>
```

### Save role to localStorage
```vue
<script setup>
import { watch } from 'vue'

watch(currentRole, (newRole) => {
  localStorage.setItem('libraryRole', newRole)
})
</script>
```

### Make categories navigate
```vue
<script setup>
function navigateToCategory(category) {
  router.push(`/library/category/${category}`)
}
</script>
```

---

## Accessibility Quick Checks

```
□ All buttons are <button> elements (not <div>)
□ Active role has aria-pressed="true"
□ Icons have aria-hidden="true"
□ Category cards have role="button" and tabindex="0"
□ Keyboard navigation works (Tab, Enter, Space)
□ Focus indicators visible
□ Color contrast meets WCAG AA (4.5:1)
```

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Initial load | < 3s | ~200ms ✅ |
| Role switch | < 50ms | <50ms ✅ |
| Category click | < 10ms | <10ms ✅ |
| FPS (animations) | 60fps | 60fps ✅ |

---

## Git Commit Template

```
feat(library): [brief description]

Changes:
- [what changed]
- [what changed]

Testing:
✅ Smoke test passed
✅ No console errors
✅ Responsive on mobile
✅ Accessibility verified

Closes #[issue number]
```

---

## Pre-Commit Checklist

```bash
# 1. Lint
npm run lint

# 2. Build
npm run build

# 3. Quick smoke test (2 min)
npm run dev
# Open http://localhost:5173/library
# Verify: loads, no errors, interactions work

# 4. Commit
git add .
git commit -m "feat(library): your message"
```

---

## Emergency Rollback

If production issues occur:

```bash
# 1. Identify last good commit
git log --oneline

# 2. Revert to last good version
git revert <commit-hash>

# 3. Force push (if necessary)
git push origin main --force

# 4. Verify on staging
# Navigate to staging URL
# Run smoke test

# 5. Deploy to production
```

---

## Support Contacts

**Component Owner:** [Developer name]
**QA Lead:** [QA name]
**Documentation:** `/home/setup/navidocs/client/tests/README.md`

---

## Version Info

**Component Version:** 1.0
**Last Updated:** 2025-10-23
**Vue Version:** 3.5.0
**Tailwind Version:** 3.4.0

---

## Useful Links

- [Full Test Docs](./LibraryView.test.md)
- [Smoke Test](../../SMOKE_TEST_CHECKLIST.md)
- [Known Issues](./LibraryView-Issues.md)
- [Vue 3 Docs](https://vuejs.org/)
- [Tailwind Docs](https://tailwindcss.com/)

---

**Print this page and keep it at your desk!**
