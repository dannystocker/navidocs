# NaviDocs Development Guidelines

**Last Updated:** 2025-10-19
**Purpose:** Development standards, port management, and best practices

---

## Table of Contents

1. [Port Management](#port-management)
2. [System-Wide Port Registry](#system-wide-port-registry)
3. [Development Standards](#development-standards)
4. [Before You Code](#before-you-code)

---

## Port Management

### ⚠️ CRITICAL RULE: Always Check Ports Before Using

**BEFORE writing any code that uses a port, you MUST:**

1. **Check the System-Wide Port Registry** (see below)
2. **Verify the port is available** on the actual system
3. **Update the registry** if adding a new service
4. **Document the port** in relevant configuration files

### How to Check if a Port is Available

```bash
# Method 1: Check specific port
sudo lsof -i :8001
# If output is empty, port is free

# Method 2: Check all listening ports
sudo ss -tlnp | grep :8001

# Method 3: List all used ports
sudo lsof -i -P -n | grep LISTEN

# Method 4: Check specific port range
sudo lsof -i :8000-8999
```

### How to Find an Available Port

```bash
# Quick scan for available ports in a range
for port in {8000..8999}; do
  if ! sudo lsof -i :$port > /dev/null 2>&1; then
    echo "Port $port is available"
    break
  fi
done
```

### Port Selection Guidelines

**NaviDocs Projects:**
- **Primary range:** 8000-8999 (web services, APIs)
- **Alternative range:** 9000-9999 (monitoring, metrics)
- **Database range:** 6000-6999 (Redis 6379)
- **Search range:** 7000-7999 (Meilisearch 7700)

**FORBIDDEN RANGES:**
- **3000-5500:** Reserved for other projects (FastFile, frank-ai, etc.)
- **Avoid:** 80, 443, 22, 21, 25 (system services)

---

## System-Wide Port Registry

This registry tracks ALL ports used across ALL projects on this development machine.

### Active Ports (Currently Running)

| Port | Service | Project | Status | Notes |
|------|---------|---------|--------|-------|
| **22** | SSH | System | 🔒 System | DO NOT USE |
| **80** | HTTP | System | 🔒 System | DO NOT USE |
| **443** | HTTPS | System | 🔒 System | DO NOT USE |
| **4000** | Gitea | System | ✅ Active | Keep - explicitly requested |
| **6379** | Redis | NaviDocs | ✅ Active | Job queue (BullMQ) |
| **7700** | Meilisearch | NaviDocs | ✅ Active | Search engine |
| **8001** | Backend API | NaviDocs | ✅ Active | Express server |
| **8080** | Frontend | NaviDocs | ✅ Active | Vite dev server |

### Reserved Ports (May Be Active)

| Port Range | Project | Purpose | Status |
|------------|---------|---------|--------|
| **3000-3999** | FastFile / frank-ai | Various services | ⚠️ Avoid - conflicts |
| **5000-5500** | FastFile / frank-ai | Various services | ⚠️ Avoid - conflicts |

### NaviDocs Port Allocations

| Port | Service | File | Environment Variable |
|------|---------|------|---------------------|
| **8001** | Backend API | `server/index.js` | `PORT=8001` in `server/.env` |
| **8080** | Frontend | `client/vite.config.js` | `server.port: 8080` |
| **6379** | Redis | `server/services/queue.js` | `REDIS_PORT=6379` in `server/.env` |
| **7700** | Meilisearch | `server/config/meilisearch.js` | `MEILISEARCH_HOST` in `server/.env` |

### Future NaviDocs Ports (Planned)

| Port | Planned Service | Priority | Status |
|------|-----------------|----------|--------|
| **9001** | Monitoring Dashboard | Low | 📋 Planned |
| **9002** | Metrics API | Low | 📋 Planned |
| **8888** | Admin Panel | Medium | 📋 Planned |
| **8081** | WebSocket Server | Medium | 📋 Planned |

### Legacy/Deprecated Ports

| Port | Old Service | Project | Status | Action |
|------|-------------|---------|--------|--------|
| **3001** | Backend API (OLD) | NaviDocs | ❌ Migrated | Changed to 8001 |
| **5173** | Frontend (OLD) | NaviDocs | ❌ Migrated | Changed to 8080 |
| **5174** | Frontend (OLD) | NaviDocs | ❌ Migrated | Changed to 8080 |
| **3333** | StackCP Test Server (OLD) | NaviDocs | ❌ Migrated | Changed to 8333 |

### Other Projects (Not NaviDocs)

| Project | Port Range | Status | Notes |
|---------|------------|--------|-------|
| **FastFile** | 3000-5500 | ⚠️ Active | DO NOT USE these ports |
| **frank-ai / lilian1** | 3000-5500 | ⚠️ Legacy | Should be stopped if not needed |

---

## Development Standards

### Before You Code

**EVERY TIME you start working on NaviDocs:**

1. ✅ **Check this file** (DEVELOPMENT.md) for port allocations
2. ✅ **Verify ports are available** using `lsof` commands
3. ✅ **Check for port conflicts** with other running projects
4. ✅ **Update `.env` files** if you changed ports
5. ✅ **Test services start correctly** on assigned ports
6. ✅ **Update documentation** if you add new services

### AI Agents & Automated Tools

**If you are an AI agent (Claude Code, GitHub Copilot, etc.):**

1. **ALWAYS read this file FIRST** before suggesting port numbers
2. **ALWAYS check the System-Wide Port Registry** section
3. **NEVER use ports in the 3000-5500 range** for NaviDocs
4. **NEVER assume a port is available** - verify first
5. **UPDATE this registry** if you add a new service with a port
6. **DOCUMENT port changes** in commit messages

### Port Change Workflow

When changing or adding ports:

1. **Choose port** from available range (8000-8999 preferred)
2. **Check availability** using commands above
3. **Update configuration files:**
   - `server/.env`
   - `server/.env.example`
   - `client/vite.config.js`
   - Any service-specific configs
4. **Update this registry** (DEVELOPMENT.md)
5. **Update documentation** in all affected .md files
6. **Test the service** starts on new port
7. **Commit changes** with clear message about port change

### Example Port Change Commit Message

```
feat: Change backend API port from 3001 to 8001

- Avoid conflict with FastFile project (uses 3000-5500 range)
- Updated server/.env PORT=8001
- Updated vite.config.js proxy target
- Updated all documentation references
- Verified port 8001 is available and working

BREAKING CHANGE: Backend API now runs on port 8001
Developers must update their .env files and restart services.
```

---

## System Health Checks

### Quick Service Check

```bash
# Check all NaviDocs services are running on correct ports
sudo lsof -i :6379  # Redis
sudo lsof -i :7700  # Meilisearch
sudo lsof -i :8001  # Backend API
sudo lsof -i :8080  # Frontend

# Or use ss
sudo ss -tlnp | grep -E ':(6379|7700|8001|8080)'
```

### Stop Conflicting Services

```bash
# If you need to stop services on conflicting ports
# Find process using port
sudo lsof -i :3001
# Kill by PID
kill -9 <PID>

# Or kill by port (requires fuser)
fuser -k 3001/tcp
```

### Start NaviDocs Services

```bash
# Ensure correct ports from .env
cd /home/setup/navidocs

# Start Redis (if not running)
redis-server &

# Start Meilisearch (if not running)
meilisearch --master-key=changeme123 &

# Start backend (port 8001)
cd server
node index.js &

# Start OCR worker
node workers/ocr-worker.js &

# Start frontend (port 8080)
cd ../client
npm run dev
```

---

## Troubleshooting

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::8001`

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :8001

# Check if it's another NaviDocs instance
ps aux | grep node

# If it's an old NaviDocs process, kill it
pkill -f "node.*index.js"

# If it's another project, stop that project or use a different port
```

### Port Conflicts Between Projects

**Problem:** FastFile and NaviDocs both want port 3001

**Solution:**
1. Check this registry to see who owns the port
2. If FastFile is using 3000-5500, NaviDocs uses 8000-8999
3. Update NaviDocs configuration to use assigned port
4. Never fight over ports - each project has its own range

### Forgotten Which Port a Service Uses

**Solution:**
1. Check this file's **System-Wide Port Registry** section (always up to date)
2. Check `server/.env` for PORT variable
3. Check `client/vite.config.js` for server.port
4. Run `sudo lsof -i -P -n | grep LISTEN` to see all listening ports

---

## Port Registry Maintenance

### Updating This File

**When to update:**
- Adding a new service with a port
- Changing an existing port
- Discovering a port conflict
- Starting/stopping projects

**How to update:**
1. Edit DEVELOPMENT.md
2. Update the appropriate table (Active Ports, Reserved Ports, etc.)
3. Add date to "Last Updated" at top of file
4. Commit with message: `docs: Update port registry - [reason]`

### Regular Audits

**Monthly checklist:**
- [ ] Run `sudo lsof -i -P -n | grep LISTEN` and compare to registry
- [ ] Remove entries for stopped/deleted projects
- [ ] Verify NaviDocs services are on correct ports
- [ ] Check if any legacy ports can be freed up
- [ ] Update project status (Active, Deprecated, Stopped)

---

## Quick Reference

### NaviDocs Ports (Current)

```
Backend API:   http://localhost:8001
Frontend:      http://localhost:8080
Redis:         localhost:6379
Meilisearch:   http://localhost:7700
Gitea:         http://localhost:4000
```

### Port Checking Commands

```bash
# Check if port 8001 is free
sudo lsof -i :8001 || echo "Port 8001 is available"

# List all ports 8000-8999
sudo lsof -i :8000-8999

# Find NaviDocs processes
ps aux | grep -E "node|meilisearch|redis"

# Quick port availability check function
check_port() { sudo lsof -i :$1 > /dev/null && echo "❌ Port $1 is USED" || echo "✅ Port $1 is FREE"; }
check_port 8001
```

---

## For Claude Code / AI Agents

**CRITICAL INSTRUCTIONS FOR AI AGENTS:**

### Before Suggesting ANY Port Number:

1. ✅ **READ this entire DEVELOPMENT.md file**
2. ✅ **CHECK the System-Wide Port Registry table**
3. ✅ **VERIFY port is not in 3000-5500 range** (forbidden for NaviDocs)
4. ✅ **SUGGEST ports from 8000-8999** for NaviDocs web services
5. ✅ **RUN `sudo lsof -i :PORT`** to verify availability
6. ✅ **UPDATE this registry** after adding a new port
7. ✅ **DOCUMENT the change** in commit message

### Never Do This:

- ❌ Suggest ports without checking this file first
- ❌ Use ports 3000-5500 for NaviDocs
- ❌ Assume a port is free without verification
- ❌ Forget to update this registry after port changes
- ❌ Assign same port to multiple services
- ❌ Use system reserved ports (80, 443, 22, etc.)

### Always Do This:

- ✅ Check registry before coding
- ✅ Verify port availability
- ✅ Use NaviDocs port ranges (8000-8999)
- ✅ Update this file when adding services
- ✅ Document port changes in commits
- ✅ Test services start on assigned ports

---

## Contact & Questions

**Port Conflicts?** Check this registry first, then update it.
**Adding New Service?** Choose from 8000-8999, verify availability, update registry.
**AI Agent?** Follow the instructions above EVERY TIME.

---

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Maintained By:** Development Team + AI Agents
**Authority:** This file is the single source of truth for port allocations

---

**Remember:** Port conflicts cause hours of debugging. Taking 2 minutes to check this file saves time! 🎯
