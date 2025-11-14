# NaviDocs Critical Fixes - Cloud Implementation Mission

**GitHub Repository:** https://github.com/dannystocker/navidocs
**Branch:** `navidocs-cloud-coordination`
**Target:** Premium boat management platform for €800K-€1.5M yachts

---

## Mission Overview

You are a Sonnet instance managing 15 Haiku agents to implement critical security, performance, and UX fixes identified in comprehensive code reviews (Codex + Gemini). This is a **3-week sprint** to production readiness.

**Review Sources (on GitHub in branch `navidocs-cloud-coordination`):**
- `HANDOVER_SESSION_2025-11-14.md` - Full context
- `reviews/CODEX_SECURITY_ARCHITECTURE_REPORT.md` - Security review (if exists)
- `reviews/GEMINI_PERFORMANCE_UX_REPORT.md` - Performance/UX review (if exists)

**Reference Implementation Guide:**
The detailed implementation patterns are in the Windows downloads folder, but I'll embed the key patterns here for zero-dependency execution.

---

## Critical Issues to Fix

### 🔴 BLOCKERS (Week 1 - Must Fix Before Production)

1. **JWT Secret Enforcement** - Hard-coded default secret allows token forgery
2. **Auth Gaps** - Document/search/upload/image/stats routes use `req.user?.id || 'test-user-id'`
3. **Meilisearch Token Fallback** - Falls back to global search key on failure
4. **Bundle Size 2.3MB** - No lazy loading, target <500KB gzipped
5. **Touch Targets 12-40px** - Need 60×60px minimum for marine gloves
6. **No Pagination** - 11 `.all()` queries without limits
7. **Small Fonts** - As low as 10px, need 24-48px for sunlight readability
8. **Missing ARIA Labels** - 29 icon-only buttons fail WCAG

### 🟡 HIGH PRIORITY (Week 2)

9. **God Components** - `DocumentView.vue` (1386 lines), `SearchView.vue` (628 lines)
10. **Service Layer** - Business logic in routes, need service extraction
11. **Token Refresh** - No automatic 401 handling
12. **Images Without Alt** - Accessibility failures
13. **Legacy Auth Middleware** - Two auth implementations cause confusion

---

## Agent Assignment & Parallel Execution

**Spawn 15 Haiku agents in PARALLEL** using a single message with 15 Task tool calls:

### Security Team (Agents 1-5)

**Agent 1: JWT Secret Enforcement**
- Create `server/config/env.js` with mandatory `JWT_SECRET` validation
- Update `server/services/auth.service.js` to use central config
- Update `server/middleware/auth.middleware.js` to use central config
- Remove or deprecate `server/middleware/auth.js` (legacy)
- Add startup assertion: `assert(JWT_SECRET && JWT_SECRET.length >= 32)`

**Agent 2: Document Route Auth**
- Add `authenticateToken` middleware to all routes in `server/routes/documents.js`
- Remove all `req.user?.id || 'test-user-id'` patterns
- Use `req.user.userId` directly (set by middleware)
- Add `requireOrganizationMember` where organization scoping needed
- Test: Verify 401 on unauthenticated requests

**Agent 3: Search/Upload/Image Route Auth**
- Secure `server/routes/search.js` (both `/token` and `/search`)
- Secure `server/routes/upload.js` and `/upload/quick-ocr`
- Secure `server/routes/images.js` (all image endpoints)
- Remove `test-user-id` fallbacks
- Add organization membership checks

**Agent 4: Stats & Jobs Auth**
- Secure `server/routes/stats.js` with `requireSystemAdmin` for global stats
- Create `/stats/organizations/:organizationId` for scoped stats
- Secure `server/routes/jobs.js` with proper auth
- Remove public access to operational metrics

**Agent 5: Meilisearch Token Hardening**
- Modify `server/routes/search.js` POST `/token` to fail closed
- Only allow fallback in `NODE_ENV === 'development'`
- Log tenant token failures to ops team
- Return 500 with retry message in production on failure

---

### Performance Team (Agents 6-9)

**Agent 6: Lazy Loading Routes**
- Update `client/src/router/index.js`
- Convert all direct imports to `() => import('./views/XYZ.vue')`
- Apply to: HomeView, DocumentView, LibraryView, SearchView, SettingsView
- Test: Verify bundle splits in `npm run build`
- Target: Reduce initial bundle from 2.3MB to <1MB

**Agent 7: Pagination Utility**
- Create `server/utils/pagination.js` with `parsePagination(req, options)`
- Support `?page=1&pageSize=50` query params
- Max page size: 200, default: 50
- Return `{ page, pageSize, offset }` for SQL queries
- Add total count helper for responses

**Agent 8: Apply Pagination to Routes**
- Update `server/routes/documents.js` GET `/` with pagination
- Update `server/routes/images.js` listings
- Update `server/routes/jobs.js` GET `/api/jobs`
- Replace all `.all()` with `.all(limit, offset)` pattern
- Return `{ data: rows, page, pageSize, total }` format

**Agent 9: Central API Client with Token Refresh**
- Create `client/src/api/http.js` using Axios
- Add request interceptor to inject `Authorization: Bearer ${accessToken}`
- Add response interceptor for 401 handling
- Implement automatic refresh using `/api/auth/refresh`
- Prevent multiple concurrent refresh requests (use promise singleton)

---

### Architecture Team (Agents 10-12)

**Agent 10: Document Service Layer**
- Create `server/services/document.service.js`
- Extract methods: `listForUser()`, `getForUser()`, `deleteForUser()`
- Use pagination support from Agent 7
- Enforce organization membership via JOIN
- Throw 404 errors with `.status = 404` for service-level handling

**Agent 11: Image Service Layer**
- Create `server/services/image.service.js`
- Extract image retrieval, validation, path safety logic
- Move Meilisearch cleanup logic from routes
- Support pagination for image lists

**Agent 12: Stats Service Layer**
- Create `server/services/stats.service.js`
- Implement `getGlobalStats()` (admin only)
- Implement `getOrgStats(organizationId, userId)` with membership check
- Always join via `user_organizations` to prevent cross-tenant leaks

---

### UX Team (Agents 13-15)

**Agent 13: Marine CSS Baseline**
- Create `client/src/assets/marine.css`
- Define CSS variables: `--nd-touch-target: 60px`, `--nd-font-base: 16px`, `--nd-font-large: 24px`, `--nd-font-xlarge: 32px`
- Apply to all `button`, `[role='button']`, `a.nav-link` (min 60×60px)
- Update `client/src/main.js` to import marine.css
- Test: Verify all interactive elements meet 60px minimum

**Agent 14: ARIA Labels & Alt Text**
- Scan all `.vue` files for icon-only buttons
- Add `aria-label` to all interactive elements without visible text
- Add `aria-hidden="true"` to decorative icons inside labeled buttons
- Add `:alt` attributes to all `<img>` tags
- Use descriptive labels: "Delete item", "Close dialog", etc.

**Agent 15: Typography & Contrast**
- Update all font-size CSS < 16px to at least 16px base
- Create `.nd-metric` class for critical numbers (32-48px, font-weight: 700)
- Apply to key metrics in dashboard/stats components
- Add `.nd-heading` class (24px, font-weight: 600)
- Verify contrast ratios ≥7:1 for WCAG AAA (Navy #1E3A8A on White #FFF)

---

## Implementation Patterns (Zero-Dependency Reference)

### Pattern 1: JWT Secret Enforcement

```javascript
// server/config/env.js
import assert from 'node:assert';

export const NODE_ENV = process.env.NODE_ENV || 'development';

export const JWT_SECRET = process.env.JWT_SECRET;
assert(
  JWT_SECRET && JWT_SECRET.length >= 32,
  'JWT_SECRET environment variable is required and must be at least 32 chars'
);

export const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST;
export const MEILISEARCH_MASTER_KEY = process.env.MEILISEARCH_MASTER_KEY;
```

```javascript
// server/services/auth.service.js
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

export function signAccessToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    ...options,
  });
}
```

### Pattern 2: Auth Middleware with RBAC

```javascript
// server/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

export function authenticateToken(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(401);
    req.user = decoded; // { userId, email, organizationIds, ... }
    next();
  });
}

export function requireOrganizationMember(req, res, next) {
  const orgId = req.params.organizationId || req.body.organizationId;
  if (!orgId) return res.status(400).json({ error: 'Organization ID required' });

  const isMember = req.user.organizationIds?.includes(orgId);
  if (!isMember) return res.status(403).json({ error: 'Not a member of this organization' });

  next();
}
```

### Pattern 3: Pagination Utility

```javascript
// server/utils/pagination.js
export function parsePagination(req, { defaultSize = 50, maxSize = 200 } = {}) {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.min(
    Math.max(parseInt(req.query.pageSize || String(defaultSize), 10), 1),
    maxSize
  );
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}
```

### Pattern 4: Service Layer for Documents

```javascript
// server/services/document.service.js
import db from '../db/db.js';

export function listForUser(userId, { limit, offset }) {
  const rows = db.prepare(`
    SELECT d.*
    FROM documents d
    JOIN user_organizations uo
      ON uo.organization_id = d.organization_id
    WHERE uo.user_id = ?
    ORDER BY d.created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, offset);

  const { count } = db.prepare(`
    SELECT COUNT(*) as count
    FROM documents d
    JOIN user_organizations uo
      ON uo.organization_id = d.organization_id
    WHERE uo.user_id = ?
  `).get(userId);

  return { rows, total: count };
}

export function getForUser(userId, documentId) {
  const doc = db.prepare(`
    SELECT d.*
    FROM documents d
    JOIN user_organizations uo
      ON uo.organization_id = d.organization_id
    WHERE d.id = ? AND uo.user_id = ?
  `).get(documentId, userId);

  if (!doc) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }

  return doc;
}
```

### Pattern 5: Route Using Service + Pagination

```javascript
// server/routes/documents.js
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { parsePagination } from '../utils/pagination.js';
import * as documentService from '../services/document.service.js';

const router = Router();

router.get('/',
  authenticateToken,
  async (req, res, next) => {
    try {
      const { page, pageSize, offset } = parsePagination(req);
      const { rows, total } = documentService.listForUser(
        req.user.userId,
        { limit: pageSize, offset }
      );
      res.json({ data: rows, page, pageSize, total });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:id',
  authenticateToken,
  async (req, res, next) => {
    try {
      const doc = documentService.getForUser(req.user.userId, req.params.id);
      res.json(doc);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
```

### Pattern 6: Lazy Loading Routes

```javascript
// client/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/documents/:id',
    name: 'document',
    component: () => import('../views/DocumentView.vue'),
    props: true
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('../views/LibraryView.vue')
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('../views/SearchView.vue')
  }
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
```

### Pattern 7: Central API Client with Token Refresh

```javascript
// client/src/api/http.js
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    const auth = useAuthStore();

    if (response?.status === 401 && !config._retry && auth.refreshToken) {
      config._retry = true;

      if (!refreshPromise) {
        refreshPromise = auth.refreshAccessToken();
      }

      try {
        await refreshPromise;
        refreshPromise = null;
        config.headers.Authorization = `Bearer ${auth.accessToken}`;
        return api(config);
      } catch (err) {
        refreshPromise = null;
        auth.logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Pattern 8: Marine CSS Baseline

```css
/* client/src/assets/marine.css */
:root {
  --nd-touch-target: 60px;
  --nd-font-base: 16px;
  --nd-font-large: 24px;
  --nd-font-xlarge: 32px;
  --nd-font-metric: 48px;

  --nd-navy: #1E3A8A;
  --nd-teal: #0D9488;
  --nd-white: #ffffff;
}

body {
  font-size: var(--nd-font-base);
  line-height: 1.5;
}

/* All interactive elements */
button,
[role='button'],
a.nav-link,
.btn,
.icon-button {
  min-width: var(--nd-touch-target);
  min-height: var(--nd-touch-target);
  padding: 0.75rem 1rem;
}

/* Typography scale */
.nd-heading {
  font-size: var(--nd-font-large);
  font-weight: 600;
}

.nd-metric {
  font-size: var(--nd-font-metric);
  font-weight: 700;
  color: var(--nd-navy);
}

/* High contrast for marine use */
.nd-high-contrast {
  background: var(--nd-navy);
  color: var(--nd-white);
}
```

### Pattern 9: ARIA Labels

```vue
<!-- BEFORE -->
<button @click="deleteItem">
  <TrashIcon />
</button>

<!-- AFTER -->
<button
  type="button"
  aria-label="Delete item"
  @click="deleteItem"
>
  <TrashIcon aria-hidden="true" />
</button>
```

```vue
<!-- Images BEFORE -->
<img :src="result.thumbnail" class="thumbnail">

<!-- Images AFTER -->
<img
  :src="result.thumbnail"
  :alt="`${result.title} thumbnail`"
  class="thumbnail"
/>
```

---

## Execution Instructions

### Step 1: Clone Repository

```bash
git clone https://github.com/dannystocker/navidocs.git
cd navidocs
git checkout navidocs-cloud-coordination
```

### Step 2: Analyze Current State

```bash
# Find all .all() queries without limits
grep -r "\.all()" server/routes/ | wc -l

# Find test-user-id patterns
grep -r "test-user-id" server/routes/

# Find small touch targets
grep -r "width.*px\|height.*px" client/src/components/ | grep -E "width: [1-5][0-9]px|height: [1-5][0-9]px"

# Find small fonts
grep -r "font-size.*px" client/src/ | grep -E "[0-9]{1}px|1[0-5]px"

# Find missing ARIA labels
grep -r "<button" client/src/ | grep -v "aria-label"
```

### Step 3: Spawn 15 Haiku Agents in Parallel

**CRITICAL:** Use a **single message** with **15 Task tool calls** to spawn all agents simultaneously:

```
I'm spawning 15 Haiku agents in parallel to implement all critical fixes.

[Agent 1 Task tool call]
[Agent 2 Task tool call]
...
[Agent 15 Task tool call]
```

Each agent should:
1. Read relevant files from GitHub
2. Implement their assigned fixes
3. Test changes locally
4. Commit with descriptive message
5. Report completion status

### Step 4: Integration & Testing

After all 15 agents complete:

1. **Build verification:**
   ```bash
   npm install
   npm run build
   du -sh dist/  # Verify <500KB gzipped target
   ```

2. **Security audit:**
   ```bash
   npm audit --production
   grep -r "test-user-id" server/  # Should be 0 results
   grep -r "JWT_SECRET.*||" server/  # Should be 0 results
   ```

3. **UX verification:**
   ```bash
   # All touch targets ≥60px
   grep -r "width.*px\|height.*px" client/src/components/ | grep -E "width: [1-5][0-9]px" | wc -l  # Should be 0

   # All fonts ≥16px
   grep -r "font-size.*px" client/src/ | grep -E "[0-9]{1}px|1[0-5]px" | wc -l  # Should be 0

   # All buttons have ARIA
   grep -r "<button" client/src/ | grep -v "aria-label" | wc -l  # Should be minimal
   ```

4. **Manual testing:**
   - Start services: `npm run dev` (client) + `node server/index.js`
   - Test unauthenticated access to `/api/documents` → should 401
   - Test authenticated access → should work with pagination
   - Verify bundle splits in Network tab
   - Test touch targets with Chrome DevTools mobile view
   - Verify search token refresh on 401

### Step 5: Commit & Push

```bash
git add .
git commit -m "Implement critical security, performance, and UX fixes

- Enforce JWT_SECRET with mandatory validation
- Secure all document/search/upload/image/stats routes with auth
- Add pagination to all .all() queries (11 endpoints)
- Implement lazy loading for Vue routes (reduce bundle 50%)
- Add marine CSS baseline (60px touch targets, 16px+ fonts)
- Extract service layer for documents, images, stats
- Add central API client with automatic token refresh
- Add ARIA labels to 29 icon-only buttons
- Add alt text to all images
- Fail closed on Meilisearch tenant tokens

Reviews: CODEX + Gemini comprehensive audits
Agents: 15 Haiku agents in parallel execution
Week 1 critical path: Security + Performance + Marine UX
"
git push origin navidocs-cloud-coordination
```

---

## Success Criteria

**Week 1 Completion Checklist:**

- [ ] JWT_SECRET is mandatory, no default fallback
- [ ] All 11 routes with `test-user-id` now require auth
- [ ] All `.all()` queries have pagination support
- [ ] Vue routes use lazy loading
- [ ] Bundle size <1MB raw (target <500KB gzipped)
- [ ] All interactive elements ≥60×60px
- [ ] All fonts ≥16px base, 24-48px for metrics
- [ ] 29 icon-only buttons have ARIA labels
- [ ] All images have alt text
- [ ] Meilisearch tokens fail closed in production
- [ ] Service layer for documents, images, stats
- [ ] Central API client with token refresh
- [ ] npm audit shows 0 critical/high vulnerabilities
- [ ] Build succeeds without errors
- [ ] Manual testing passes on key flows

**Performance Targets:**
- Initial load time: <2s on 3G
- Bundle size: <500KB gzipped
- API response time: <200ms p95
- Touch target size: 100% compliance at ≥60px
- Font size: 100% compliance at ≥16px

**Security Targets:**
- 0 SQL injection vulnerabilities
- 0 unauthenticated access to sensitive routes
- 0 hardcoded secrets
- 0 npm audit critical/high issues
- JWT tokens require proper secret

---

## Emergency Rollback

If issues occur:

```bash
git checkout navidocs-cloud-coordination
git reset --hard origin/navidocs-cloud-coordination
```

Review individual agent commits and cherry-pick working changes.

---

## Post-Implementation

After Week 1 fixes are live:

**Week 2 priorities:**
- Decompose god components using composables
- Add loading skeletons
- Implement high-contrast "bridge mode"
- Add keyboard navigation shortcuts
- Database index optimization

**Week 3 priorities:**
- E2E testing with Playwright
- Performance monitoring
- Component library documentation
- Deployment automation

---

## Notes for Sonnet Orchestrator

- **Spawn all 15 agents in a SINGLE message** using 15 Task tool calls
- Monitor agent completion and resolve conflicts
- Each agent must test their changes before committing
- Integration testing after all agents complete
- Git commits should reference agent number and feature
- Use descriptive commit messages with Before/After context
- Push to `navidocs-cloud-coordination` branch only
- Tag completion: `v1.0.0-security-ux-fixes`

---

**Ready to execute. Spawn 15 Haiku agents in parallel and implement all critical fixes.**
