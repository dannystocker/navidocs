# NaviDocs - Quick Reference

**Critical Paths & Credentials at a Glance**

---

## 🔑 Credentials (CHANGE FOR PRODUCTION!)

| Service | Key/Secret | Location |
|---------|-----------|----------|
| **Meilisearch** | `5T66jrwQ8F8cOk4dUlFY0Vp59fMnCsIfi4O6JZl9wzU=` | `/home/setup/navidocs/server/.env` |
| **JWT Secret** | `your-jwt-secret-here-change-in-production` | `/home/setup/navidocs/server/.env` |
| **Redis** | No password (local only) | N/A |

---

## 🌐 Access URLs (Windows 11)

| Service | URL |
|---------|-----|
| **Frontend** | `http://172.29.75.55:8080/` |
| **Backend API** | `http://172.29.75.55:8001/` |
| **Meilisearch** | `http://172.29.75.55:7700/` |
| **Gitea** | `http://localhost:4000/ggq-admin/navidocs` |

> ⚠️ WSL2 IP (`172.29.75.55`) can change on restart!

---

## 📁 Important Paths

```bash
# Project Root
/home/setup/navidocs/

# Database
/home/setup/navidocs/server/db/navidocs.db

# Uploads
/home/setup/navidocs/server/uploads/

# Logs
/tmp/navidocs-backend.log
/tmp/navidocs-ocr-worker.log
/tmp/navidocs-frontend.log

# Config
/home/setup/navidocs/server/.env
/home/setup/navidocs/client/vite.config.js
```

---

## 🚀 Quick Commands

```bash
# Start Everything
cd /home/setup/navidocs
./start-all.sh

# Stop Everything
./stop-all.sh

# View Logs
tail -f /tmp/navidocs-backend.log

# Check Services
ss -tlnp | grep -E ":(6379|7700|8001|8080)"

# Get WSL2 IP
hostname -I | awk '{print $1}'

# Backend Health
curl http://localhost:8001/health

# Database Backup
cp server/db/navidocs.db server/db/backup-$(date +%Y%m%d).db
```

---

## 🔌 Service Ports

| Port | Service | Status |
|------|---------|--------|
| **6379** | Redis | ✅ Running |
| **7700** | Meilisearch | ✅ Running (Docker) |
| **8001** | Backend API | ✅ Running |
| **8080** | Frontend | ✅ Running |

---

## 🗂️ Data Locations

| Data Type | Location | Size |
|-----------|----------|------|
| SQLite DB | `server/db/navidocs.db` | ~188 KB |
| Uploads | `server/uploads/` | Empty |
| Meilisearch | Docker volume `meilisearch_data` | N/A |
| Logs | `/tmp/navidocs-*.log` | <1 MB |

---

## 🔒 Security Checklist (Before Production)

- [ ] Change Meilisearch master key
- [ ] Change JWT secret (64+ chars)
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS (remove wildcard)
- [ ] Set `NODE_ENV=production`
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Audit dependencies

---

**Full Details:** `/home/setup/navidocs/docs/handover/PATHS_AND_CREDENTIALS.md`
