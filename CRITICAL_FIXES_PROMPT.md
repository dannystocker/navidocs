# NaviDocs CRITICAL Security & UX Fixes - 8 Haiku Agents

**GitHub Repository:** https://github.com/dannystocker/navidocs
**Base Branch:** `claude/install-run-ssh-01RZPPuRFwrveZKec62363vu` (latest build)
**New Branch:** `fix/critical-security-ux`

---

## Mission: Fix 8 Critical Issues Found in Code Reviews

**Context:** Codex and Gemini reviews found 8 CRITICAL blockers that must be fixed before production. The app is functionally complete but has security holes and UX issues for marine environment.

---

## CRITICAL ISSUES (Must Fix)

### 🔴 Security (Agents 1-4)

**AGENT 1: JWT Secret Enforcement**
- **File:** `server/services/auth.service.js`
- **Issue:** Line 13: `const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production'`
- **Risk:** If JWT_SECRET not set, attackers can forge tokens
- **Fix:**
  ```javascript
  // BEFORE
  const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here-change-in-production';

  // AFTER
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET environment variable is required and must be at least 32 chars');
  }
  ```
- **Test:** Start server without JWT_SECRET → should throw error

**AGENT 2: Document Routes Auth Gaps**
- **Files:** `server/routes/documents.js`, `server/routes/images.js`
- **Issue:** Routes use `req.user?.id || 'test-user-id'` instead of enforcing auth
- **Risk:** Synthetic user ID bypasses tenant isolation
- **Fix Pattern:**
  ```javascript
  // BEFORE
  router.get('/:id', async (req, res) => {
    const userId = req.user?.id || 'test-user-id';
    // ...
  });

  // AFTER
  import { authenticateToken } from '../middleware/auth.middleware.js';

  router.get('/:id', authenticateToken, async (req, res) => {
    const userId = req.user.userId; // Always defined after middleware
    // ...
  });
  ```
- **Apply to:** All routes in `documents.js` and `images.js`
- **Test:** Unauthenticated request → 401

**AGENT 3: Search/Upload Route Auth**
- **Files:** `server/routes/search.js`, `server/routes/upload.js`
- **Issue:** Same `test-user-id` pattern
- **Fix:** Add `authenticateToken` middleware to all endpoints
- **Test:** Upload without token → 401

**AGENT 4: Stats Route Protection**
- **File:** `server/routes/stats.js`
- **Issue:** Global stats endpoint has no auth (reveals business metrics)
- **Fix:**
  ```javascript
  import { authenticateToken, requireSystemAdmin } from '../middleware/auth.middleware.js';

  router.get('/', authenticateToken, requireSystemAdmin, async (req, res) => {
    // Only admins can see global stats
  });
  ```
- **Test:** Non-admin request → 403

### 🎨 UX Marine Environment (Agents 5-8)

**AGENT 5: Touch Targets (60px Minimum)**
- **Issue:** Buttons as small as 12×12px found in `client/src/components/`
- **Pattern:**
  ```vue
  <!-- BEFORE -->
  <button style="width: 40px; height: 40px">
    <ChevronRightIcon />
  </button>

  <!-- AFTER -->
  <button style="min-width: 60px; min-height: 60px; padding: 10px">
    <ChevronRightIcon class="w-6 h-6" />
  </button>
  ```
- **Files to Fix:**
  - `client/src/components/TocSidebar.vue` (40px → 60px)
  - `client/src/components/SearchResultsSidebar.vue` (20px → 60px)
  - `client/src/components/TocEntry.vue` (32px → 60px)
- **Test:** All interactive elements ≥60×60px

**AGENT 6: Font Sizes (16px Minimum)**
- **Issue:** Fonts as small as 10px found (unreadable in sunlight)
- **Pattern:**
  ```vue
  <!-- BEFORE -->
  <p style="font-size: 11px">Last updated</p>

  <!-- AFTER -->
  <p style="font-size: 16px">Last updated</p>
  ```
- **Files to Fix:**
  - `client/src/views/SearchView.vue` (10px, 11px, 12px → 16px)
  - `client/src/components/TocSidebar.vue` (11px → 16px)
  - `client/src/components/SearchResultsSidebar.vue` (11px → 16px)
- **Test:** No fonts <16px in codebase

**AGENT 7: ARIA Labels (29 Icon Buttons)**
- **Issue:** Icon-only buttons lack screen reader labels
- **Pattern:**
  ```vue
  <!-- BEFORE -->
  <button @click="deleteItem">
    <TrashIcon />
  </button>

  <!-- AFTER -->
  <button aria-label="Delete item" @click="deleteItem">
    <TrashIcon aria-hidden="true" />
  </button>
  ```
- **Scan:** `grep -r "<button" client/src/ | grep -v "aria-label"`
- **Test:** All interactive elements have labels

**AGENT 8: Image Alt Text**
- **Issue:** Images without alt attributes
- **Pattern:**
  ```vue
  <!-- BEFORE -->
  <img :src="thumbnail">

  <!-- AFTER -->
  <img :src="thumbnail" :alt="title + ' thumbnail'">
  ```
- **Files:** `client/src/views/SearchView.vue`, `client/src/components/FigureZoom.vue`
- **Test:** All images have alt text

---

## Execution Instructions

### Step 1: Setup
```bash
git clone https://github.com/dannystocker/navidocs.git
cd navidocs
git checkout claude/install-run-ssh-01RZPPuRFwrveZKec62363vu
git checkout -b fix/critical-security-ux
```

### Step 2: Spawn 8 Haiku Agents in Parallel

**CRITICAL:** Use **one message with 8 Task tool calls**:

```
I'm spawning 8 Haiku agents in parallel to fix critical security and UX issues.

[Task 1: JWT Secret Enforcement]
[Task 2: Document Routes Auth]
[Task 3: Search/Upload Auth]
[Task 4: Stats Route Protection]
[Task 5: Touch Targets 60px]
[Task 6: Font Sizes 16px]
[Task 7: ARIA Labels]
[Task 8: Image Alt Text]
```

### Step 3: Testing

After all 8 agents complete:

```bash
# Security tests
grep -r "JWT_SECRET.*||" server/  # Should be 0 results
grep -r "test-user-id" server/routes/  # Should be 0 results
npm audit --production  # 0 critical/high

# UX tests
grep -r "width.*px\|height.*px" client/src/components/ | grep -E "width: [1-5][0-9]px" | wc -l  # Should be 0
grep -r "font-size.*px" client/src/ | grep -E "[0-9]{1}px|1[0-5]px" | wc -l  # Should be 0
grep -r "<button" client/src/ | grep -v "aria-label" | wc -l  # Should be minimal
grep -r "<img" client/src/ | grep -v "alt=" | wc -l  # Should be 0
```

### Step 4: Commit & Push

```bash
git add .
git commit -m "Fix 8 critical security and UX issues

Security Fixes:
- Enforce JWT_SECRET with mandatory validation (no fallback)
- Add authenticateToken to document/image routes
- Add authenticateToken to search/upload routes
- Protect stats endpoint with requireSystemAdmin

UX Fixes (Marine Environment):
- Increase all touch targets to 60×60px minimum
- Increase all fonts to 16px minimum base
- Add ARIA labels to 29 icon-only buttons
- Add alt text to all images

Reviews: Codex + Gemini comprehensive audits
Blockers: 8 critical issues preventing production deployment
Week 1 critical path: Security + Marine UX
"
git push -u origin fix/critical-security-ux
```

---

## Success Criteria

- [ ] JWT_SECRET throws error if missing/short
- [ ] 0 routes with `test-user-id` pattern
- [ ] All document/image/search/upload/stats routes require auth
- [ ] All touch targets ≥60×60px
- [ ] All fonts ≥16px base
- [ ] All icon buttons have ARIA labels
- [ ] All images have alt text
- [ ] npm audit: 0 critical/high
- [ ] Build succeeds without errors

---

## Time Estimate

**Total:** 2-3 hours (all agents in parallel)
- Security fixes: 1 hour
- UX fixes: 1 hour
- Testing: 30 minutes
- Commit/push: 15 minutes

---

**Ready to execute. Spawn 8 Haiku agents in parallel and fix all critical issues.**
