# NaviDocs Launch Checklist System

**IF.TTT Citation:** `if://doc/navidocs/launch-checklist-system/v1.0`
**Created:** 2025-11-13
**Purpose:** Bulletproof launch verification system for zero-failure demos

---

## Overview

This system provides **four automated scripts** that ensure NaviDocs always launches correctly and catches issues before they cause demo failures. Based on comprehensive analysis of Agent reports 1-5, these scripts address all known failure modes.

### Scripts

1. **`pre-launch-checklist.sh`** - Run BEFORE starting services
2. **`verify-running.sh`** - Run AFTER starting services
3. **`debug-logs.sh`** - Aggregate all logs for rapid debugging
4. **`version-check.sh`** - Verify exact running version

---

## Quick Start

```bash
# 1. Pre-flight check (MUST RUN FIRST)
./pre-launch-checklist.sh

# 2. Start services (only if pre-check passes)
./start-all.sh

# 3. Verify everything is working (within 30 seconds)
./verify-running.sh

# 4. If issues detected, debug
./debug-logs.sh
```

---

## Script 1: Pre-Launch Checklist (`pre-launch-checklist.sh`)

### Purpose
Verify system state BEFORE starting services to catch issues early.

### What It Checks

**IF.TTT Citations:**
- `if://agent/1/findings/backend-health` - Backend API health
- `if://agent/2/findings/port-fallback` - Vite port fallback behavior
- `if://agent/3/findings/database-size` - Database integrity
- `if://agent/5/findings/meilisearch-index-missing` - Search index status

#### 1. Git Repository State
- Current commit hash and branch
- Uncommitted changes detection
- Recent commits (helps identify version)

#### 2. Port Availability
- **Port 8001** - Backend API (will be killed if occupied)
- **Port 8080** - Frontend Vite primary (will be killed if occupied)
- **Port 8081** - Frontend Vite fallback (warning only)
- **Port 7700** - Meilisearch (can be running)
- **Port 6379** - Redis (can be running)

**Critical Finding (Agent 2):** Vite automatically falls back to 8081 if 8080 is occupied. The script detects this and warns accordingly.

#### 3. Node.js Version
- **Required:** `v20.19.5`
- **Acceptable:** Any v20.x (warns on minor version mismatch)
- **Fails:** Any other major version

#### 4. Database Integrity
- File exists at `/home/setup/navidocs/server/db/navidocs.db`
- Readable and not locked
- Document count verification
- **IF.TTT:** `if://agent/3/findings/documents-count/[N]`

#### 5. Redis Connectivity
- Redis server responding to `PING`
- **Critical for:** Job queue (OCR processing)

#### 6. Meilisearch Status
- Docker container running
- HTTP health endpoint responding
- **Critical Check:** `navidocs-pages` index exists
  - **Agent 5 Finding:** Index missing causes OCR to fail silently
  - **IF.TTT:** `if://agent/5/findings/meilisearch-index-missing`

#### 7. Dependencies Installed
- Server `node_modules` exists (package count)
- Client `node_modules` exists (package count)

#### 8. Zombie Process Detection
- Existing backend processes (will be killed)
- Existing frontend processes (will be killed)
- Existing OCR worker processes (will be killed)

#### 9. Log Files Accessible
- `/tmp` directory writable
- Previous log files detected (size and age)

#### 10. Environment Configuration
- `.env` file exists (optional)
- **Agent 1 Warning:** `SETTINGS_ENCRYPTION_KEY` not set
  - **Impact:** Settings won't persist across restarts
  - **Fix:** Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - **IF.TTT:** `if://agent/1/findings/settings-encryption-key`

#### 11. Docker Status
- Docker daemon running
- Meilisearch container status (running/stopped/missing)

#### 12. Uploads Directory
- Directory exists at `/home/setup/navidocs/uploads`
- Writable by current user
- **IF.TTT:** `if://agent/5/findings/uploads-directory`

### Exit Codes
- **0** - All checks passed (safe to launch)
- **0** - Warnings only (safe to launch with degraded features)
- **1** - Critical failures (DO NOT LAUNCH)

### Example Output
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 NaviDocs Pre-Launch Checklist
IF.TTT Citation: if://doc/navidocs/pre-launch-checklist/v1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ PORT AVAILABILITY ━━━
IF.TTT: if://test/navidocs/port-availability
✅ PASS: Port 8001 (Backend API) available
✅ PASS: Port 8080 (Frontend (Vite)) available
✅ PASS: Port 7700 (Meilisearch) already in use by meilisearch (PID: 12345)
✅ PASS: Port 6379 (Redis) already in use by redis-server (PID: 67890)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PRE-LAUNCH CHECKLIST SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PASSED: 28
⚠️  WARNINGS: 2
❌ FAILED: 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ READY TO LAUNCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All checks passed! Safe to run: ./start-all.sh
```

---

## Script 2: Verify Running (`verify-running.sh`)

### Purpose
Verify all services are ACTUALLY RUNNING and responding after `start-all.sh`.

### What It Checks

#### 1. Process Verification
- Backend process running (with PID)
- Frontend (Vite) process running
- OCR worker process running
- Redis process running
- Meilisearch Docker container running

#### 2. HTTP Endpoint Verification (with timing)
- `GET /health` - Backend health check (<100ms expected)
- `GET /` - Frontend main page (Vue app HTML)
- `GET /health` - Meilisearch health check

**All checks include retry logic** (up to 5 attempts with 2s delay).

#### 3. API Functionality Tests
- `GET /api/documents` - Documents list API
- `GET /api/search/health` - Search API health
- Parses response to verify JSON structure

#### 4. Redis Connectivity
- `PING` command
- OCR queue length (`bull:ocr-queue:wait`)

#### 5. Database Access
- File exists and readable
- Quick query to verify not locked
- Document count

#### 6. End-to-End Smoke Test (Optional)
If `test-manual.pdf` exists:
1. Upload document via API
2. Wait for OCR processing (max 10s)
3. Verify document retrieval
4. Confirms entire pipeline works

**IF.TTT Citations:**
- `if://agent/1/findings/backend-health`
- `if://agent/5/findings/upload-success`
- `if://agent/5/findings/ocr-complete`

#### 7. Log File Activity
- Backend log modified within last 60s
- Frontend log modified within last 60s
- OCR worker log modified within last 60s

### Exit Codes
- **0** - All systems operational (demo ready)
- **1** - Critical failures (NOT READY)

### Example Output
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 NaviDocs Runtime Verification
IF.TTT Citation: if://doc/navidocs/verify-running/v1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ HTTP ENDPOINT VERIFICATION ━━━
Testing: http://localhost:8001/health
✅ PASS: Backend /health responding
   Time: 3ms

━━━ END-TO-END SMOKE TEST ━━━
Attempting quick document creation flow...
   1. Uploading test document...
✅ PASS: Document upload successful (ID: e455cb64-0f77-4a9a-a599-0ff2826b7b8f)
   IF.TTT: if://agent/5/findings/upload-success
   2. Waiting for OCR processing (max 10s)...
      Status: indexed, waiting...
✅ PASS: OCR processing completed (status: indexed)
   IF.TTT: if://agent/5/findings/ocr-complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RUNTIME VERIFICATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PASSED: 22
❌ FAILED: 0

Total API response time: 127ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL SYSTEMS OPERATIONAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NaviDocs is ready for demo/presentation!

Access URLs:
  Frontend: http://localhost:8080
  Backend:  http://localhost:8001
  API Docs: http://localhost:8001/health
```

---

## Script 3: Debug Logs (`debug-logs.sh`)

### Purpose
Single consolidated view of ALL logs for rapid debugging when issues occur.

### What It Shows

#### 1. System Resource Usage
- Memory usage (RAM + swap)
- Disk usage (server, client, uploads directories)
- Process CPU/Memory (sorted by resource usage)

#### 2. Process Status
- Backend API (PID, uptime)
- Frontend Vite (PID, uptime)
- OCR Worker (PID, uptime)
- Redis (PID, uptime)
- Meilisearch (Docker container status)

#### 3. Port Usage
- Which ports are listening
- Which PIDs own each port
- Process name for each port

#### 4. Redis Queue Status
- **OCR Queue:**
  - Waiting jobs
  - Active jobs
  - Completed jobs
  - Failed jobs
- Connection statistics
- **IF.TTT:** `if://agent/1/findings/redis-status`

#### 5. Meilisearch Status
- Health check response
- Index statistics (document count)
- **Detects:** Missing `navidocs-pages` index
- **IF.TTT:** `if://agent/5/findings/meilisearch-index-missing`

#### 6. Database Statistics
- File size and modification time
- Record counts:
  - Documents
  - Document pages
  - Organizations
  - Users
  - OCR jobs
- **IF.TTT:** `if://agent/3/findings/database-size`

#### 7. Service Logs (last N lines, default 100)
- **Backend API Log** (`/tmp/navidocs-backend.log`)
  - Color-coded: Errors (red), Warnings (yellow), Success (green), HTTP (cyan)
- **Frontend Vite Log** (`/tmp/navidocs-frontend.log`)
- **OCR Worker Log** (`/tmp/navidocs-ocr-worker.log`)

#### 8. Error Summary
- Aggregated errors from all logs (last 20)
- Tagged by source: `[BACKEND]`, `[FRONTEND]`, `[WORKER]`

### Usage
```bash
# Default: Last 100 lines from each log
./debug-logs.sh

# Custom: Last 500 lines from each log
./debug-logs.sh 500
```

### Example Output
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💻 SYSTEM RESOURCE USAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Memory Usage:
  Mem:           15Gi        8.2Gi       1.4Gi       345Mi       5.6Gi       6.5Gi
  Swap:          4.0Gi          0B       4.0Gi

Disk Usage (/home/setup/navidocs):
  218M  /home/setup/navidocs/server
  145M  /home/setup/navidocs/client
  89M   /home/setup/navidocs/uploads

NaviDocs Process Resource Usage:
  setup     2.3%   1.2%   node /home/setup/navidocs/server/index.js
  setup     1.8%   0.9%   /home/setup/navidocs/client/node_modules/.bin/vite
  setup     0.5%   0.3%   node workers/ocr-worker.js

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 REDIS QUEUE STATUS
IF.TTT: if://agent/1/findings/redis-status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Redis responding to ping

OCR Queue Statistics:
  Waiting:   0 jobs
  Active:    0 jobs
  Completed: 5 jobs
  Failed:    0 jobs
```

---

## Script 4: Version Check (`version-check.sh`)

### Purpose
Verify EXACTLY which version is running (git commit, packages, dependencies).

### What It Shows

#### 1. Git Repository Version
- Full commit hash + short hash
- Current branch
- Git tag (if any)
- Commit author and date
- Commit message
- Working tree status (clean vs uncommitted changes)
- Recent commits (last 5)
- **IF.TTT:** `if://git/navidocs/commit/[HASH]`

#### 2. Node.js Environment
- Node.js version
- npm version
- Installation path
- Compatibility check vs required version (v20.19.5)

#### 3. Package.json Versions
- **Server:** Version + key dependencies (Express, SQLite, BullMQ, Meilisearch, ioredis)
- **Client:** Version + key dependencies (Vue, Vite, Pinia, Vue Router)

#### 4. Database Schema
- File size and modification time
- Table count
- Schema version (from `system_settings` table)
- Full table list

#### 5. Meilisearch Version
- Docker container version
- API version (via `/version` endpoint)
- Compatibility check (expects v1.6.x)

#### 6. Redis Version
- CLI version
- Server version (via `INFO server`)

#### 7. Running Services
- Backend API (PID, start time, uptime, command)
- Frontend Vite (PID, start time, uptime, listening port)
- API health check response

#### 8. Build Artifacts
- Server `node_modules` (package count, size)
- Client `node_modules` (package count, size)

#### 9. Version Fingerprint
Creates unique fingerprint combining:
- Git commit hash
- Server package version
- Client package version

**IF.TTT:** `if://version/navidocs/fingerprint/[MD5]`

### Example Output
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 NaviDocs Version Verification
IF.TTT Citation: if://doc/navidocs/version-check/v1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ GIT REPOSITORY VERSION ━━━

✅ Git repository detected

  Commit:  6ebb688 (6ebb688f3c2a1b4d5e6f7a8b9c0d1e2f3a4b5c6d)
  Branch:  main
  Tag:     No tag
  Author:  Danny Stocker <danny@example.com>
  Date:    2025-11-13 10:15:30 -0500
  Message: [CLOUD SESSIONS] Complete guide for launching 5 cloud sessions

  IF.TTT: if://git/navidocs/commit/6ebb688f3c2a1b4d5e6f7a8b9c0d1e2f3a4b5c6d

  ✅ Working tree clean

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 VERSION CHECK SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Version Fingerprint: NaviDocs@6ebb688 (server:1.0.0, client:1.0.0)
Node.js:             v20.19.5
Database:            2.0M (21 tables)
Meilisearch:         1.6.0
Redis:               7.0.12

IF.TTT: if://version/navidocs/fingerprint/a1b2c3d4e5f6...

Report generated: 2025-11-13 15:30:45 UTC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Common Failure Modes & Recovery

Based on Agent reports 1-5, here are the most common issues and how the scripts detect/fix them:

### 1. Meilisearch Index Missing
**Agent 5 Finding:** `if://agent/5/findings/meilisearch-index-missing`

**Symptom:** OCR completes but search doesn't work
**Detected by:** `pre-launch-checklist.sh` (warns), `verify-running.sh` (checks index stats)
**Fix:**
```bash
curl -X POST http://localhost:7700/indexes \
  -H 'Authorization: Bearer 5T66jrwQ8F8cOk4dUlFY0Vp59fMnCsIfi4O6JZl9wzU=' \
  -d '{"uid":"navidocs-pages"}'
```

### 2. Port 8080 Occupied (Vite Fallback)
**Agent 2 Finding:** `if://agent/2/findings/port-fallback`

**Symptom:** Frontend runs on port 8081 instead of 8080
**Detected by:** `pre-launch-checklist.sh` (warns about both 8080 and 8081)
**Fix:** Kill process on port 8080 before running `start-all.sh`

### 3. Settings Encryption Key Missing
**Agent 1 Finding:** `if://agent/1/findings/settings-encryption-key`

**Symptom:** Settings don't persist across restarts
**Detected by:** `pre-launch-checklist.sh` (warns)
**Fix:**
```bash
# Generate key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to server/.env
echo "SETTINGS_ENCRYPTION_KEY=<generated-key>" >> server/.env
```

### 4. Zombie Backend Processes
**Symptom:** Backend fails to start (port already in use)
**Detected by:** `pre-launch-checklist.sh` (warns, shows PIDs)
**Fix:** `start-all.sh` kills existing processes automatically

### 5. Database Locked
**Symptom:** API returns 500 errors on database queries
**Detected by:** `pre-launch-checklist.sh` (tries test query), `verify-running.sh` (database access check)
**Fix:** Stop all services, ensure no SQLite processes, restart

### 6. OCR Worker Not Processing
**Symptom:** Documents stuck in "processing" status
**Detected by:** `verify-running.sh` (checks worker process + E2E test), `debug-logs.sh` (OCR queue stats)
**Fix:** Check OCR worker logs, ensure Redis queue accessible

### 7. Frontend Returns 404
**Symptom:** Blank page or "Cannot GET /"
**Detected by:** `verify-running.sh` (checks for Vue app div in HTML)
**Fix:** Check frontend logs for Vite compilation errors

---

## IF.TTT Compliance

All scripts generate IF.TTT citations for traceability:

### Citation Format
```
if://[resource-type]/[component]/[identifier]/[version]
```

### Examples from Scripts

**Document Citations:**
- `if://doc/navidocs/pre-launch-checklist/v1.0`
- `if://doc/navidocs/verify-running/v1.0`
- `if://doc/navidocs/debug-logs/v1.0`
- `if://doc/navidocs/version-check/v1.0`

**Test Run Citations:**
- `if://test-run/navidocs/pre-launch/20251113-143055`
- `if://test-run/navidocs/verify-running/20251113-143120`
- `if://test-run/navidocs/debug-logs/20251113-143145`

**Agent Finding Citations:**
- `if://agent/1/findings/backend-health` (Agent 1: Backend health check)
- `if://agent/2/findings/port-fallback` (Agent 2: Vite port fallback)
- `if://agent/3/findings/database-size` (Agent 3: Database inspection)
- `if://agent/5/findings/meilisearch-index-missing` (Agent 5: Search index)
- `if://agent/5/findings/upload-success` (Agent 5: Document upload)

**Git Citations:**
- `if://git/navidocs/commit/[hash]`

**Version Citations:**
- `if://version/navidocs/fingerprint/[md5]`

**Log Citations:**
- `if://log/navidocs/backend/20251113`
- `if://log/navidocs/frontend/20251113`

---

## Integration with Existing Scripts

### Before Demo Workflow
```bash
# 1. Stop any running services
./stop-all.sh

# 2. Pre-flight check
./pre-launch-checklist.sh
# Exit code 0 = safe to launch
# Exit code 1 = fix failures first

# 3. Start services
./start-all.sh

# 4. Verify everything works
./verify-running.sh
# Exit code 0 = demo ready
# Exit code 1 = check debug logs

# 5. Optional: Check logs if issues
./debug-logs.sh
```

### Version Documentation Workflow
```bash
# Before demo, document exact version
./version-check.sh > /tmp/navidocs-version-$(date +%Y%m%d).txt

# Save fingerprint for reproducibility
grep "Version Fingerprint" /tmp/navidocs-version-*.txt
```

---

## Troubleshooting

### Script Won't Run
```bash
# Make executable
chmod +x pre-launch-checklist.sh verify-running.sh debug-logs.sh version-check.sh

# Check for DOS line endings (if copied from Windows)
dos2unix *.sh
```

### False Positives
Some warnings are expected in development:
- `SETTINGS_ENCRYPTION_KEY not set` - Non-critical for local dev
- `Port 8081 occupied` - Informational (Vite will use 8082)
- `Uncommitted changes detected` - Normal during development

### Script Hangs
If a script appears to hang:
- **Check:** Network timeouts (Meilisearch, Redis)
- **Fix:** Increase timeout in script (default: 3-5s)
- **Kill:** `Ctrl+C` (scripts use `set -e`, safe to interrupt)

---

## Maintenance

### When to Update Scripts

1. **New service added** - Add to pre-launch and verify-running checks
2. **Port changes** - Update port numbers in all scripts
3. **New critical dependency** - Add to pre-launch dependencies check
4. **New failure mode discovered** - Add detection logic and IF.TTT citation

### Testing Scripts

After modifications, test with:
```bash
# Test pre-launch with services stopped
./stop-all.sh
./pre-launch-checklist.sh
# Should show warnings for stopped services

# Test verify-running with services running
./start-all.sh
./verify-running.sh
# Should pass all checks

# Test debug-logs
./debug-logs.sh 50  # Show last 50 lines
```

---

## Performance

### Script Execution Times
- `pre-launch-checklist.sh`: 5-10 seconds (comprehensive)
- `verify-running.sh`: 20-30 seconds (includes E2E test)
- `debug-logs.sh`: 2-5 seconds (depends on log size)
- `version-check.sh`: 3-5 seconds

### Optimization Tips
- Run `pre-launch-checklist.sh` only once before startup
- Run `verify-running.sh` after startup and before demos
- Use `debug-logs.sh 100` (default) for quick checks, `500+` for deep debugging

---

## Related Documentation

- **Agent Reports:** `/tmp/agent1-backend-health.md` through `/tmp/agent5-document-upload.md`
- **Start/Stop Scripts:** `start-all.sh`, `stop-all.sh`
- **Session Documentation:** `/home/setup/infrafabric/NAVIDOCS_SESSION_SUMMARY.md`
- **IF.TTT Spec:** `/home/setup/infrafabric/docs/IF-URI-SCHEME.md`

---

**Last Updated:** 2025-11-13
**IF.TTT:** `if://doc/navidocs/launch-checklist-system/v1.0`
**Author:** Agent 9 (Launch Checklist System)
