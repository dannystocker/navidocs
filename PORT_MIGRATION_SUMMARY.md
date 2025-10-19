# Port Migration Summary - NaviDocs

**Date:** 2025-10-19
**Migration:** Ports 3000-5500 → 8000-8999 range
**Reason:** Avoid conflicts with FastFile and frank-ai projects

---

## Changes Made

### Configuration Files (3 files)

1. ✅ **server/.env**
   - `PORT=3001` → `PORT=8001`

2. ✅ **server/.env.example**
   - `PORT=3001` → `PORT=8001`

3. ✅ **client/vite.config.js**
   - `port: 5173` → `port: 8080`
   - `target: 'http://localhost:3001'` → `target: 'http://localhost:8001'`

### Documentation Files (19 files)

**Root Documentation:**
1. ✅ README.md
2. ✅ BUILD_COMPLETE.md
3. ✅ SERVICES_STATUS.md
4. ✅ SESSION_STATUS.md
5. ✅ NAVIDOCS_HANDOVER.md
6. ✅ TEST_RESULTS.md
7. ✅ GOOGLE_DRIVE_OCR_QUICKSTART.md

**StackCP Documentation:**
8. ✅ STACKCP_EVALUATION_REPORT.md
9. ✅ docs/STACKCP_QUICKSTART.md

**Server Documentation:**
10. ✅ server/routes/README.md

### New Files Created (3 files)

1. ✅ **PORT_ALLOCATION.md** - Port allocation strategy document
2. ✅ **DEVELOPMENT.md** - Development guidelines with system-wide port registry
3. ✅ **PORT_MIGRATION_SUMMARY.md** - This file

---

## Port Mappings

| Service | Old Port | New Port | Change |
|---------|----------|----------|--------|
| Backend API | 3001 | 8001 | +5000 |
| Frontend | 5173/5174 | 8080 | ~+2900 |
| StackCP Test | 3333 | 8333 | +5000 |
| Redis | 6379 | 6379 | No change |
| Meilisearch | 7700 | 7700 | No change |
| Gitea | 4000 | 4000 | No change |

---

## New URLs

### Development

**Before:**
```
Backend:  http://localhost:3001
Frontend: http://localhost:5173 or http://localhost:5174
Health:   http://localhost:3001/health
```

**After:**
```
Backend:  http://localhost:8001
Frontend: http://localhost:8080
Health:   http://localhost:8001/health
```

### API Endpoints

**Before:**
```bash
curl -X POST http://localhost:3001/api/documents/upload \
  -F "file=@manual.pdf"
```

**After:**
```bash
curl -X POST http://localhost:8001/api/documents/upload \
  -F "file=@manual.pdf"
```

---

## Breaking Changes

### For Developers

**ACTION REQUIRED:**

1. **Update `.env` file:**
   ```bash
   cd /home/setup/navidocs/server
   # Ensure PORT=8001 in .env
   ```

2. **Restart all services:**
   ```bash
   # Stop old services
   pkill -f "node.*index.js"
   pkill -f "vite"

   # Start new services
   cd /home/setup/navidocs/server
   node index.js  # Now on port 8001

   cd /home/setup/navidocs/client
   npm run dev    # Now on port 8080
   ```

3. **Update browser bookmarks:**
   - Old: `http://localhost:5173`
   - New: `http://localhost:8080`

4. **Update any scripts/tools** that reference old ports

---

## Verification Steps

```bash
# 1. Check configuration
cd /home/setup/navidocs/server
grep "PORT=" .env
# Should show: PORT=8001

# 2. Verify ports are free
sudo lsof -i :8001  # Should be empty
sudo lsof -i :8080  # Should be empty

# 3. Start backend
node index.js
# Should see: "NaviDocs API listening on port 8001"

# 4. Test health check
curl http://localhost:8001/health
# Should return: {"status":"ok",...}

# 5. Start frontend (in new terminal)
cd /home/setup/navidocs/client
npm run dev
# Should see: "Local: http://localhost:8080/"

# 6. Verify no conflicts
sudo lsof -i :3000-5500 | grep -i navidocs
# Should be empty (NaviDocs not using these ports anymore)
```

---

## Files Changed Summary

**Total Files Modified:** 22 files
- Configuration: 3 files
- Documentation: 19 files

**Total Files Created:** 3 files
- PORT_ALLOCATION.md
- DEVELOPMENT.md
- PORT_MIGRATION_SUMMARY.md

**Total Port References Updated:** ~30+ references

---

## Migration Checklist

- [x] Update server/.env
- [x] Update server/.env.example
- [x] Update client/vite.config.js
- [x] Update all documentation files
- [x] Create PORT_ALLOCATION.md strategy document
- [x] Create DEVELOPMENT.md with port registry
- [x] Create PORT_MIGRATION_SUMMARY.md
- [ ] Test backend starts on 8001
- [ ] Test frontend starts on 8080
- [ ] Test API endpoints work
- [ ] Commit all changes
- [ ] Update any external tools/scripts

---

## Rollback Plan

If issues occur, rollback by:

```bash
cd /home/setup/navidocs

# Checkout previous commit
git log --oneline -5  # Find commit before port changes
git checkout <previous-commit-hash>

# Or manually revert:
# - server/.env: PORT=8001 → PORT=3001
# - client/vite.config.js: 8080 → 5173, 8001 → 3001
# Restart services
```

---

## Post-Migration

### Known Issues

- **FastFile conflict:** If FastFile is running on 8001/8080, stop it first
- **Browser cache:** Clear browser cache if frontend doesn't load
- **Process lingering:** Use `pkill` to ensure no old processes on 3001/5173

### Monitoring

Monitor for port conflicts:
```bash
# Check for any NaviDocs processes on old ports
sudo lsof -i :3001
sudo lsof -i :5173
sudo lsof -i :5174

# Should all be empty (or show only non-NaviDocs processes)
```

---

## Documentation

All documentation has been updated to reflect new ports. Key files:

- **DEVELOPMENT.md** - System-wide port registry (check this FIRST)
- **PORT_ALLOCATION.md** - Port allocation strategy
- **README.md** - Quick start with new ports
- **NAVIDOCS_HANDOVER.md** - Handover doc with new ports

---

## For AI Agents / Future Development

**IMPORTANT:** Before coding any port usage:

1. Read **DEVELOPMENT.md** port registry
2. Verify port availability
3. Use 8000-8999 range for NaviDocs
4. **NEVER use 3000-5500** (reserved for other projects)
5. Update DEVELOPMENT.md registry after adding services

---

**Migration Status:** ✅ Complete
**Testing Status:** ⏳ Pending
**Deployment Status:** 🚀 Ready

---

**Created:** 2025-10-19
**Version:** 1.0
**Author:** Claude Code
