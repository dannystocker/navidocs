# LibraryView Testing Documentation

This directory contains comprehensive test documentation for the LibraryView component.

---

## Quick Links

| Document | Purpose | Size |
|----------|---------|------|
| [LibraryView.test.md](./LibraryView.test.md) | Comprehensive test documentation (1,351 lines) | 36 KB |
| [LibraryView-Issues.md](./LibraryView-Issues.md) | Known issues and recommendations | 15 KB |
| [/SMOKE_TEST_CHECKLIST.md](../../SMOKE_TEST_CHECKLIST.md) | Quick smoke test checklist (628 lines) | 17 KB |

---

## Documentation Overview

### 1. LibraryView.test.md

**Full test specification including:**
- Manual test scenarios (7 scenarios)
- API integration tests (5 endpoints)
- DOM element verification
- Styling & design system tests
- Accessibility tests (WCAG 2.1 AA)
- Console output verification

**Use this for:**
- Comprehensive testing before release
- QA reference documentation
- Developer implementation guide
- Regression testing

**Time to complete:** 2-3 hours

---

### 2. SMOKE_TEST_CHECKLIST.md

**Quick validation checklist including:**
- 10 critical test scenarios
- Pass/fail criteria
- Test results template
- Issue triage guide

**Use this for:**
- Quick verification after changes
- Pre-deployment checks
- Daily development testing
- CI/CD pipeline checks

**Time to complete:** 10-15 minutes

---

### 3. LibraryView-Issues.md

**Comprehensive issue tracking including:**
- 22 documented issues
- Severity classifications (Critical, Major, Minor)
- Code examples and fixes
- Priority matrix
- Implementation roadmap

**Use this for:**
- Bug tracking and prioritization
- Sprint planning
- Code review reference
- Technical debt documentation

---

## Quick Start

### For Developers

**After making changes to LibraryView:**

1. **Run smoke tests** (10 min)
   ```bash
   cd /home/setup/navidocs/client
   npm run dev
   # Follow SMOKE_TEST_CHECKLIST.md
   ```

2. **Check for new issues**
   - Review LibraryView-Issues.md
   - Add any new issues found
   - Update priority matrix

3. **Before PR submission**
   - Complete all critical smoke tests
   - Document any skipped tests
   - Update test documentation if behavior changed

---

### For QA Testers

**Full test cycle:**

1. **Initial smoke test** (10 min)
   - Use SMOKE_TEST_CHECKLIST.md
   - Mark pass/fail for each test
   - Document any failures

2. **Comprehensive testing** (2-3 hours)
   - Follow LibraryView.test.md
   - Test all scenarios
   - Cross-browser testing
   - Accessibility audit

3. **Issue reporting**
   - Check if issue exists in LibraryView-Issues.md
   - If new, add to issues document
   - Assign severity level
   - Include reproduction steps

---

### For Product Owners

**Quality gates:**

| Gate | Document | Criteria |
|------|----------|----------|
| Pre-demo | SMOKE_TEST_CHECKLIST.md | All critical tests pass |
| Pre-staging | LibraryView.test.md | 80% tests pass, no P0 issues |
| Pre-production | All documents | 100% critical tests pass, all P0 issues resolved |

**Issue tracking:**
- Review LibraryView-Issues.md priority matrix monthly
- Prioritize P0/P1 issues for upcoming sprints
- Track progress in project management tool

---

## Test Scenarios Summary

### Critical Tests (Must Pass)

From SMOKE_TEST_CHECKLIST.md:

1. ✅ Initial page load
2. ✅ Console error check
3. ✅ All sections render
4. ✅ Role switcher functionality
5. ✅ Category card clicks

**If any of these fail, component is not shippable.**

---

### Important Tests (Should Pass)

From LibraryView.test.md:

6. ✅ Essential documents display
7. ✅ Category navigation
8. ✅ Recent activity section
9. ✅ Header interactions
10. ✅ Hover effects
11. ✅ Responsive behavior
12. ✅ Visual styling

**Failures should be fixed before production.**

---

### Nice to Have Tests (Can Defer)

From LibraryView.test.md:

13. ✅ Browser compatibility
14. ✅ Performance benchmarks
15. ✅ Advanced accessibility
16. ✅ Search integration (future)

**Failures can be tracked as tech debt.**

---

## Known Issues Summary

From LibraryView-Issues.md:

### Critical (P0) - 3 issues
- No API integration
- Missing accessibility attributes
- Incomplete router integration

### Major (P1) - 4 issues
- No state persistence
- Pin functionality not implemented
- No loading states
- No error handling

### Minor (P2) - 6 issues
- Role switcher doesn't filter content
- Missing document click handlers
- No unit tests
- No E2E tests
- Static document counts
- No search functionality

### Total: 22 issues documented

See LibraryView-Issues.md for details and fixes.

---

## File Structure

```
/home/setup/navidocs/
├── client/
│   ├── src/
│   │   └── views/
│   │       └── LibraryView.vue          # Component under test
│   └── tests/
│       ├── README.md                     # This file
│       ├── LibraryView.test.md          # Comprehensive tests
│       └── LibraryView-Issues.md        # Issues & recommendations
└── SMOKE_TEST_CHECKLIST.md             # Quick smoke tests
```

---

## Testing Workflow

### Development Phase

```
┌─────────────────┐
│ Code Changes    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Smoke Test      │ ← Use SMOKE_TEST_CHECKLIST.md
└────────┬────────┘
         │
    Pass │ Fail
         ├─────────► Fix issues
         │
         ▼
┌─────────────────┐
│ Create PR       │
└─────────────────┘
```

### QA Phase

```
┌─────────────────┐
│ Receive PR      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Smoke Test      │ ← Use SMOKE_TEST_CHECKLIST.md
└────────┬────────┘
         │
    Pass │ Fail
         ├─────────► Reject PR
         │
         ▼
┌─────────────────┐
│ Full Test Suite │ ← Use LibraryView.test.md
└────────┬────────┘
         │
    Pass │ Fail
         ├─────────► Document in LibraryView-Issues.md
         │
         ▼
┌─────────────────┐
│ Approve PR      │
└─────────────────┘
```

### Production Release

```
┌─────────────────┐
│ Staging Deploy  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Smoke Test      │ ← Use SMOKE_TEST_CHECKLIST.md
└────────┬────────┘
         │
    Pass │ Fail
         ├─────────► Rollback & fix
         │
         ▼
┌─────────────────┐
│ Full Test Suite │ ← Use LibraryView.test.md
└────────┬────────┘
         │
    Pass │ Fail
         ├─────────► Rollback & fix
         │
         ▼
┌─────────────────┐
│ Prod Deploy     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Smoke Test      │ ← Final verification
└─────────────────┘
```

---

## Automation Roadmap

### Phase 1: Unit Tests (Week 1-2)
- Set up Vitest
- Write component unit tests
- Achieve 80% code coverage
- Integrate with CI/CD

### Phase 2: E2E Tests (Week 3-4)
- Set up Playwright
- Automate smoke test scenarios
- Add visual regression tests
- Run nightly on staging

### Phase 3: Integration Tests (Week 5-6)
- Mock API responses
- Test API integration
- Test error scenarios
- Test loading states

### Phase 4: Performance Tests (Week 7-8)
- Lighthouse CI integration
- Bundle size monitoring
- Render performance benchmarks
- Memory leak detection

---

## Contributing

### Adding New Tests

1. **For manual tests:**
   - Add scenario to LibraryView.test.md
   - Follow existing format
   - Include expected results
   - Add verification points

2. **For smoke tests:**
   - Add to SMOKE_TEST_CHECKLIST.md
   - Keep tests quick (<5 min)
   - Focus on critical functionality
   - Update pass/fail criteria

3. **For issues:**
   - Add to LibraryView-Issues.md
   - Assign severity level
   - Include code examples
   - Update priority matrix

---

### Updating Documentation

**When to update:**
- Component behavior changes
- New features added
- Issues resolved
- New issues discovered
- Test scenarios modified

**How to update:**
1. Edit relevant markdown file
2. Update version number
3. Update "Last Updated" date
4. Add entry to change log
5. Commit with descriptive message

---

## Test Coverage

### Current Coverage

| Area | Coverage | Status |
|------|----------|--------|
| Manual tests | 100% | ✅ Complete |
| Smoke tests | 100% | ✅ Complete |
| API tests | 0% (mock only) | ⏳ Pending |
| Unit tests | 0% | ⏳ Pending |
| E2E tests | 0% | ⏳ Pending |
| Accessibility | 90% | ✅ Documented |
| Performance | 0% | ⏳ Pending |

### Target Coverage

| Area | Target | Timeline |
|------|--------|----------|
| Unit tests | 80% | Week 1-2 |
| E2E tests | 60% | Week 3-4 |
| API tests | 100% | Week 5-6 |
| Performance | 80% | Week 7-8 |

---

## Tools & Resources

### Testing Tools

- **Manual Testing:** Browser DevTools
- **Smoke Testing:** SMOKE_TEST_CHECKLIST.md
- **Unit Testing:** Vitest (planned)
- **E2E Testing:** Playwright (available)
- **Accessibility:** Lighthouse, axe DevTools
- **Performance:** Lighthouse, Chrome DevTools

### Documentation

- **Vue 3:** https://vuejs.org/
- **Vue Router:** https://router.vuejs.org/
- **Tailwind CSS:** https://tailwindcss.com/
- **Playwright:** https://playwright.dev/
- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/

### Commands

```bash
# Start dev server
cd /home/setup/navidocs/client
npm run dev

# Run linter
npm run lint

# Run i18n checks
npm run i18n:lint

# Build for production
npm run build

# Preview production build
npm run preview

# Run Playwright tests (when implemented)
npx playwright test

# Generate test report
npx playwright show-report
```

---

## Support & Contact

**Questions about testing?**
- Review this README
- Check relevant test documentation
- Review component source code
- Consult issue documentation

**Found a bug?**
- Check LibraryView-Issues.md first
- If new, document in issues file
- Include reproduction steps
- Assign severity level

**Need help?**
- Component path: `/home/setup/navidocs/client/src/views/LibraryView.vue`
- Router config: `/home/setup/navidocs/client/src/router.js`
- Styles: `/home/setup/navidocs/client/src/assets/main.css`

---

## Changelog

### Version 1.0 (2025-10-23)
- Initial test documentation created
- Comprehensive test scenarios written (1,351 lines)
- Smoke test checklist created (628 lines)
- Issues documented (22 issues tracked)
- Priority matrix established
- Testing workflow defined

### Upcoming (TBD)
- Unit test implementation
- E2E test automation
- CI/CD integration
- Performance benchmarks

---

**Last Updated:** 2025-10-23
**Version:** 1.0
**Maintainer:** Development Team
