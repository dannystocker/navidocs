# Git Worktree Setup for NaviDocs Testing

## Overview

Git worktrees allow you to have multiple working directories from the same repository, enabling parallel development and testing without affecting the main branch.

## Current Worktree Configuration

### Active Worktrees

```bash
/home/setup/navidocs          ff3c306 [master]
/home/setup/navidocs-ui-test  ff3c306 [ui-smoketest-20251019]
```

### Worktree Details

| Property | Value |
|----------|-------|
| **Main Repository** | `/home/setup/navidocs` |
| **Test Worktree** | `/home/setup/navidocs-ui-test` |
| **Test Branch** | `ui-smoketest-20251019` |
| **Base Commit** | `ff3c306` (master) |
| **Created** | 2025-10-19 |

---

## Setup Process

### Step 1: Create Testing Worktree

```bash
# Navigate to main repository
cd /home/setup/navidocs

# Create worktree with new branch
git worktree add -b ui-smoketest-20251019 /home/setup/navidocs-ui-test master
```

**Output:**
```
Preparing worktree (new branch 'ui-smoketest-20251019')
HEAD is now at ff3c306 chore(env): add MEILISEARCH_SEARCH_KEY for dev
```

### Step 2: Verify Worktree

```bash
# List all worktrees
git worktree list
```

**Expected Output:**
```
/home/setup/navidocs          ff3c306 [master]
/home/setup/navidocs-ui-test  ff3c306 [ui-smoketest-20251019]
```

### Step 3: Navigate to Test Worktree

```bash
cd /home/setup/navidocs-ui-test
```

### Step 4: Verify Branch

```bash
git status
```

**Output:**
```
On branch ui-smoketest-20251019
nothing to commit, working tree clean
```

---

## Use Cases

### 1. Isolated UI Testing

Test UI changes without affecting the master branch:

```bash
cd /home/setup/navidocs-ui-test/client
npm run dev  # Runs on separate port if 5174 is occupied
```

### 2. Parallel Development

Work on features in the test worktree while keeping master stable:

```bash
# In test worktree
cd /home/setup/navidocs-ui-test
# Make changes, commit, test

# In main repository (master remains unchanged)
cd /home/setup/navidocs
git status  # Still on master, clean working tree
```

### 3. A/B Testing

Compare implementations side-by-side:

```bash
# Terminal 1: Master branch
cd /home/setup/navidocs/client
npm run dev  # Port 5174

# Terminal 2: Test branch
cd /home/setup/navidocs-ui-test/client
npm run dev -- --port 5175  # Different port
```

### 4. Smoke Testing

Run comprehensive tests in isolation:

```bash
cd /home/setup/navidocs-ui-test
./start-all.sh  # Start all services in test environment
# Run tests, verify functionality
./stop-all.sh
```

---

## Working with the Test Worktree

### Making Changes

```bash
cd /home/setup/navidocs-ui-test

# Make changes to files
vim client/src/components/SearchBar.jsx

# Stage and commit
git add client/src/components/SearchBar.jsx
git commit -m "feat(ui): improve search bar accessibility"
```

### Syncing with Master

```bash
cd /home/setup/navidocs-ui-test

# Fetch latest changes
git fetch origin

# Merge master into test branch
git merge origin/master

# Or rebase onto master
git rebase origin/master
```

### Viewing Differences

```bash
# Compare test branch with master
git diff master..ui-smoketest-20251019

# See commit differences
git log master..ui-smoketest-20251019
```

---

## Merging Test Changes Back to Master

### Option 1: Merge from Test Worktree

```bash
cd /home/setup/navidocs-ui-test

# Ensure all changes are committed
git status

# Switch to main repository
cd /home/setup/navidocs

# Merge test branch
git merge ui-smoketest-20251019
```

### Option 2: Create Pull Request

```bash
cd /home/setup/navidocs-ui-test

# Push test branch to remote
git push origin ui-smoketest-20251019

# Create PR via GitHub/GitLab/Bitbucket UI
# Or use gh CLI
gh pr create --base master --head ui-smoketest-20251019 \
  --title "UI Smoketest: Accessibility improvements" \
  --body "Testing results and UI enhancements from ui-smoketest-20251019"
```

---

## Cleanup

### Remove Test Worktree (Temporary)

```bash
cd /home/setup/navidocs

# Remove worktree (keeps branch)
git worktree remove /home/setup/navidocs-ui-test
```

### Delete Test Branch (After Merging)

```bash
cd /home/setup/navidocs

# Delete local branch
git branch -d ui-smoketest-20251019

# Delete remote branch (if pushed)
git push origin --delete ui-smoketest-20251019
```

### Complete Cleanup

```bash
cd /home/setup/navidocs

# Remove worktree and delete branch
git worktree remove /home/setup/navidocs-ui-test
git branch -D ui-smoketest-20251019  # Force delete
```

---

## Troubleshooting

### Worktree Already Exists

**Error:**
```
fatal: '/home/setup/navidocs-ui-test' already exists
```

**Solution:**
```bash
# Remove existing worktree first
git worktree remove /home/setup/navidocs-ui-test
# Or manually delete directory
rm -rf /home/setup/navidocs-ui-test
# Then recreate
git worktree add -b ui-smoketest-20251019 /home/setup/navidocs-ui-test master
```

### Branch Already Exists

**Error:**
```
fatal: invalid reference: ui-smoketest-20251019
```

**Solution:**
```bash
# Use existing branch
git worktree add /home/setup/navidocs-ui-test ui-smoketest-20251019

# Or delete existing branch first
git branch -D ui-smoketest-20251019
git worktree add -b ui-smoketest-20251019 /home/setup/navidocs-ui-test master
```

### Locked Worktree

**Error:**
```
fatal: 'remove' cannot be used with reason 'locked'
```

**Solution:**
```bash
# Unlock worktree
git worktree unlock /home/setup/navidocs-ui-test
# Then remove
git worktree remove /home/setup/navidocs-ui-test
```

---

## Best Practices

### 1. Descriptive Branch Names

Use date-stamped or feature-based names:
```bash
git worktree add -b ui-smoketest-20251019 /path/to/worktree master
git worktree add -b feature-search-v2 /path/to/worktree master
git worktree add -b bugfix-pdf-streaming /path/to/worktree master
```

### 2. Keep Worktrees Short-Lived

Remove worktrees after testing/development is complete:
```bash
# Merge changes
git merge ui-smoketest-20251019

# Clean up
git worktree remove /home/setup/navidocs-ui-test
git branch -d ui-smoketest-20251019
```

### 3. Sync Regularly

Keep test worktree in sync with master:
```bash
cd /home/setup/navidocs-ui-test
git fetch origin
git merge origin/master
```

### 4. Isolate Services

When running services in test worktree, use different ports:
```bash
# In test worktree's .env
PORT=8002  # Instead of 8001
CLIENT_PORT=5175  # Instead of 5174
```

### 5. Document Test Results

Always document findings in the worktree:
```bash
cd /home/setup/navidocs-ui-test
vim docs/testing/SMOKETEST_REPORT_20251019.md
git add docs/testing/SMOKETEST_REPORT_20251019.md
git commit -m "docs: add smoketest report for 2025-10-19"
```

---

## Advanced Usage

### Create Multiple Test Worktrees

```bash
# UI testing
git worktree add -b ui-test /home/setup/navidocs-ui-test master

# API testing
git worktree add -b api-test /home/setup/navidocs-api-test master

# Performance testing
git worktree add -b perf-test /home/setup/navidocs-perf-test master
```

### List All Worktrees with Details

```bash
git worktree list --porcelain
```

**Output:**
```
worktree /home/setup/navidocs
HEAD ff3c30687f0a6e8d9c2b1e4f5a6c7d8e9f0a1b2c
branch refs/heads/master

worktree /home/setup/navidocs-ui-test
HEAD ff3c30687f0a6e8d9c2b1e4f5a6c7d8e9f0a1b2c
branch refs/heads/ui-smoketest-20251019
```

### Prune Stale Worktrees

```bash
# Remove worktrees that no longer exist on disk
git worktree prune
```

---

## References

- **Git Worktree Documentation:** https://git-scm.com/docs/git-worktree
- **NaviDocs Testing Guide:** `/home/setup/navidocs/docs/testing/`
- **Smoketest Report:** `/home/setup/navidocs/docs/testing/SMOKETEST_REPORT_20251019.md`

---

**Document Version:** 1.0
**Created:** 2025-10-19
**Last Updated:** 2025-10-19
**Maintainer:** NaviDocs Development Team
