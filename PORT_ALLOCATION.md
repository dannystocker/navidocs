# NaviDocs Port Allocation Strategy

**Date:** 2025-10-19
**Purpose:** Avoid port conflicts with other projects (FastFile, frank-ai, etc.)
**Constraint:** **DO NOT use ports 3000-5500** (reserved for other projects)

---

## Port Allocation

### NaviDocs Ports (NEW)

| Service | Old Port | New Port | Reason |
|---------|----------|----------|--------|
| **Backend API** | 3001 | **8001** | Outside 3000-5500 range, common for APIs |
| **Frontend Dev** | 5173 | **8080** | Outside 3000-5500 range, standard web port |

### External Services (UNCHANGED)

| Service | Port | Status | Notes |
|---------|------|--------|-------|
| **Meilisearch** | 7700 | ✅ Keep | Already outside restricted range |
| **Redis** | 6379 | ✅ Keep | Already outside restricted range |
| **Gitea** | 4000 | ✅ Keep | Explicitly requested to keep |

### StackCP Test Ports

| Service | Old Port | New Port | Reason |
|---------|----------|----------|--------|
| **Test Server** | 3333 | **8333** | Outside 3000-5500 range |

---

## Port Range Strategy

### Avoided Ranges
- **3000-5500**: Reserved for other projects (FastFile, frank-ai, etc.)

### Safe Ranges for NaviDocs
- **8000-8999**: Web services and APIs (chosen for NaviDocs)
- **9000-9999**: Alternative if 8000s conflict
- **6000-6999**: Database and cache services (Redis already uses 6379)
- **7000-7999**: Search and indexing services (Meilisearch already uses 7700)

---

## Changes Required

### Configuration Files

1. **`server/.env`**
   - `PORT=3001` → `PORT=8001`

2. **`client/vite.config.js`**
   - `port: 5173` → `port: 8080`
   - `target: 'http://localhost:3001'` → `target: 'http://localhost:8001'`

### Documentation Files (24 files)

Files containing port references that need updating:

**Root Documentation:**
1. `README.md` - Frontend port 5173 → 8080
2. `QUICKSTART.md` - Backend port references
3. `TEST_RESULTS.md` - Backend 3001 → 8001
4. `BUILD_COMPLETE.md` - Frontend 5173 → 8080
5. `SERVICES_STATUS.md` - Both ports
6. `SESSION_STATUS.md` - Both ports
7. `NAVIDOCS_HANDOVER.md` - Both ports
8. `IMPLEMENTATION_COMPLETE.md` - Backend 3001 → 8001
9. `GOOGLE_DRIVE_OCR_QUICKSTART.md` - Backend 3001 → 8001
10. `OCR_PIPELINE_SETUP.md` - Redis port (keep 6379)

**StackCP Documentation:**
11. `STACKCP_EVALUATION_REPORT.md` - Backend 3001 → 8001, test 3333 → 8333
12. `STACKCP_VERIFICATION_SUMMARY.md` - Test 3333 → 8333
13. `STACKCP_ARCHITECTURE_ANALYSIS.md` - Backend 3001 → 8001
14. `docs/DEPLOYMENT_STACKCP.md` - Backend 3001 → 8001
15. `docs/STACKCP_QUICKSTART.md` - Backend 3001 → 8001

**Server Documentation:**
16. `server/API_SUMMARY.md` - Backend 3001 → 8001
17. `server/routes/README.md` - Backend 3001 → 8001
18. `server/services/README.md` - Redis port (keep 6379)
19. `server/workers/README.md` - Redis port (keep 6379)

**Config Examples:**
20. `server/.env.example` - Backend 3001 → 8001

---

## URL Changes Summary

### Development URLs

**OLD:**
- Backend API: `http://localhost:3001`
- Frontend: `http://localhost:5173` or `http://localhost:5174`
- Health Check: `http://localhost:3001/health`

**NEW:**
- Backend API: `http://localhost:8001`
- Frontend: `http://localhost:8080`
- Health Check: `http://localhost:8001/health`

### Production/StackCP URLs

**OLD:**
- Backend: `http://127.0.0.1:3001`

**NEW:**
- Backend: `http://127.0.0.1:8001`

---

## Verification Checklist

After applying changes, verify:

- [ ] Server starts on port 8001: `cd server && node index.js`
- [ ] Frontend starts on port 8080: `cd client && npm run dev`
- [ ] Vite proxy works: Visit `http://localhost:8080` and test API calls
- [ ] No port conflicts: `sudo lsof -i :8001` and `sudo lsof -i :8080` show only NaviDocs
- [ ] Health check works: `curl http://localhost:8001/health`
- [ ] Upload works: `curl -X POST http://localhost:8001/api/upload -F "file=@test.pdf"`

---

## Migration Notes

### For Developers

1. **Update environment variables:**
   ```bash
   cd /home/setup/navidocs/server
   # Edit .env file
   # Change PORT=3001 to PORT=8001
   ```

2. **No code changes needed** - ports are configured via environment variables

3. **Restart services:**
   ```bash
   # Stop old services if running
   pkill -f "node.*index.js"
   pkill -f "vite"

   # Start with new ports
   cd /home/setup/navidocs/server
   node index.js  # Will use port 8001

   cd /home/setup/navidocs/client
   npm run dev  # Will use port 8080
   ```

### For Documentation Updates

Use find-and-replace:
- `localhost:3001` → `localhost:8001`
- `127.0.0.1:3001` → `127.0.0.1:8001`
- `localhost:5173` → `localhost:8080`
- `localhost:5174` → `localhost:8080`
- `:3333` → `:8333` (StackCP test server)

**DO NOT replace:**
- `:6379` (Redis)
- `:7700` (Meilisearch)
- `:4000` (Gitea)

---

## Rationale

### Why 8001 for Backend?

- **Outside restricted range** (3000-5500)
- **Common for APIs** (8000-8999 range)
- **Memorable** (8001 = "eight thousand one")
- **No conflicts** with standard services

### Why 8080 for Frontend?

- **Outside restricted range** (3000-5500)
- **Standard alternative HTTP port** (commonly used for web apps)
- **Well-known** (8080 is universally recognized)
- **No conflicts** with common services

---

## Future Port Assignments

If NaviDocs needs additional services:

| Service | Suggested Port | Range |
|---------|----------------|-------|
| **Monitoring** | 9001 | 9000-9999 |
| **Metrics** | 9002 | 9000-9999 |
| **Admin Panel** | 8888 | 8000-8999 |
| **WebSocket** | 8081 | 8000-8999 |

---

## Related Projects

### Port Allocations (Assumed)

| Project | Port Range | Status |
|---------|-----------|--------|
| **FastFile** | 3000-5500 | Active (avoid) |
| **frank-ai/lilian1** | 3000-5500 | Legacy (should be stopped) |
| **NaviDocs** | 8000-8999 | Active (this project) |
| **System Services** | Various | Keep (Gitea 4000, Redis 6379, Meilisearch 7700) |

---

## Emergency Rollback

If the new ports cause issues:

1. **Revert `.env`:**
   ```bash
   cd /home/setup/navidocs/server
   # Change PORT=8001 back to PORT=3001
   ```

2. **Revert `vite.config.js`:**
   ```bash
   cd /home/setup/navidocs/client
   # Change port: 8080 back to port: 5173
   # Change target: 'http://localhost:8001' back to 'http://localhost:3001'
   ```

3. **Restart services**

4. **File an issue** documenting the conflict

---

**Status:** Ready for implementation
**Impact:** Low (environment variable changes only)
**Risk:** Minimal (easy rollback)
**Timeline:** 15-30 minutes for full migration

---

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Author:** Claude Code
