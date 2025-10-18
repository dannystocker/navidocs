# BoatVault Launch: 2-Week Execution Plan

**Goal:** Hardened MVP ready for beta users

---

## Week 1: Infrastructure & Security

### Monday - Queue & Worker Infrastructure
- [ ] **Morning:** Choose queue system (Redis available? → BullMQ, else → SQLite queue)
- [ ] **Afternoon:** Implement queue wrapper + basic worker
- [ ] **EOD:** Test: Upload dummy PDF → job queued → worker processes → completes
  - Acceptance: Job status endpoint returns progress

**Deliverable:** Working background processing

---

### Tuesday - File Safety Pipeline
- [ ] **Morning:** Install/verify `qpdf` and `ClamAV` on StackCP
  ```bash
  ssh stackcp "which qpdf || echo 'Need to install qpdf'"
  ssh stackcp "which clamscan || echo 'Need to install clamav'"
  ```
- [ ] **Afternoon:** Implement `file-safety.js` middleware
  - Extension validation
  - Magic byte check
  - qpdf sanitization
  - ClamAV scan (warn if missing, don't fail)
- [ ] **EOD:** Test: Upload malformed PDF → rejected. Upload valid PDF → sanitized

**Deliverable:** Upload endpoint refuses bad files

---

### Wednesday - Gitea Upgrade
- [ ] **Morning:** Backup current Gitea (local)
  ```bash
  tar -czf ~/backups/gitea-pre-1.24-$(date +%Y%m%d).tar.gz ~/gitea/
  ```
- [ ] **Afternoon:** Test upgrade on StackCP
  - Download 1.24.0
  - Stop service → upgrade → start → verify
- [ ] **EOD:** Confirm version 1.24.0 running, all repos accessible

**Deliverable:** Gitea upgraded, CVE-2024-45337 fixed

---

### Thursday - Meilisearch Security
- [ ] **Morning:** Rotate Meilisearch master key
  ```bash
  # Generate new key
  openssl rand -hex 32
  # Update .env on StackCP
  # Restart Meilisearch
  ```
- [ ] **Afternoon:** Implement tenant token generation
  - Backend endpoint: `/api/search/token`
  - Returns scoped, time-limited token (1 hour TTL)
- [ ] **EOD:** Test: Frontend gets token → searches work → token expires → re-fetch

**Deliverable:** Meilisearch master key never exposed to client

---

### Friday - Health Checks & Monitoring
- [ ] **Morning:** Add `/health` endpoint to boat-docs API
  - Check database, Meilisearch, queue
- [ ] **Afternoon:** Set up systemd health check timer
  ```bash
  systemctl --user enable boat-docs-healthcheck.timer
  systemctl --user start boat-docs-healthcheck.timer
  ```
- [ ] **EOD:** Add external uptime monitor (UptimeRobot free tier)

**Deliverable:** Automated health checks every 5 minutes

---

## Week 2: MVP Features & Launch Prep

### Monday - MVP Backend API
- [ ] **Morning:** Upload endpoint with safety pipeline + queue
  ```
  POST /api/upload
    → validate file
    → sanitize
    → queue OCR job
    → return jobId
  ```
- [ ] **Afternoon:** Job status endpoint
  ```
  GET /api/jobs/:jobId
    → return progress, state, result
  ```
- [ ] **EOD:** OCR worker extracts text + indexes in Meilisearch

**Deliverable:** End-to-end: Upload PDF → OCR → Searchable

---

### Tuesday - Search & Retrieval
- [ ] **Morning:** Search endpoint with tenant tokens
  ```
  POST /api/search
    → verify auth
    → generate tenant token
    → forward to Meilisearch
  ```
- [ ] **Afternoon:** Document retrieval
  ```
  GET /api/documents/:docId
    → verify ownership
    → return metadata + PDF URL
  ```
- [ ] **EOD:** Test: Search "electrical" → find relevant manual pages

**Deliverable:** Working search with proper auth

---

### Wednesday - Frontend MVP
- [ ] **Morning:** Upload UI (Vue.js component)
  - File picker
  - Progress bar (polls job status)
  - Success/error handling
- [ ] **Afternoon:** Search UI
  - Search bar
  - Results list
  - Highlight matches
- [ ] **EOD:** PDF viewer (pdf.js or simple `<embed>`)

**Deliverable:** Working UI for upload → search → view

---

### Thursday - Security Hardening
- [ ] **Morning:** Add helmet + security headers
  ```javascript
  app.use(helmet({ /* CSP config */ }));
  ```
- [ ] **Afternoon:** Implement rate limiting
  - Upload: 10/hour
  - Search: 30/minute
  - API: 100/15min
- [ ] **EOD:** Test rate limits trigger correctly

**Deliverable:** Production-grade security headers

---

### Friday - Backups & Documentation
- [ ] **Morning:** Set up backup validation script
  ```bash
  ~/bin/validate-backups
  # Add to cron: 0 3 1 * *
  ```
- [ ] **Afternoon:** Run restore drill
  - Restore from last night's backup
  - Verify SQLite integrity
  - Verify Meilisearch index
  - Document time-to-restore
- [ ] **EOD:** Write deployment runbook
  - How to deploy updates
  - How to rollback
  - Emergency contacts

**Deliverable:** Proven backup/restore process

---

## Weekend - Soft Launch

### Saturday - Beta Testing
- [ ] Deploy to production
- [ ] Invite 3-5 beta users (boat owners you know)
- [ ] Give them test manuals to upload
- [ ] Watch logs for errors

### Sunday - Bug Fixes & Iteration
- [ ] Fix critical bugs found Saturday
- [ ] Gather feedback
- [ ] Plan v1.1 features based on usage

---

## Success Criteria (Must-Have)

- [x] Upload PDF → queued → OCR'd → searchable (< 5 min for 100-page manual)
- [x] Search returns relevant results in < 100ms
- [x] No master keys in client code
- [x] All uploads pass safety pipeline
- [x] Health checks report 200 OK
- [x] Backups restore successfully
- [x] Uptime monitor shows green
- [x] 3+ beta users successfully uploaded manuals

---

## Nice-to-Have (v1.1+)

- [ ] Multi-boat organization (user owns multiple boats)
- [ ] Share manual with crew
- [ ] OCR confidence scoring (highlight low-confidence text)
- [ ] Mobile-optimized UI
- [ ] Offline PWA mode
- [ ] Annotations on PDF pages
- [ ] Version history (updated manuals)

---

## Daily Standup Questions

Each morning ask yourself:

1. **What did I ship yesterday?** (working code, not just "made progress")
2. **What am I shipping today?** (one specific deliverable)
3. **What's blocking me?** (missing tools, unclear requirements, bugs)

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| StackCP CPU throttling during OCR | High | High | Queue throttles to 1 job at a time, add delays |
| qpdf/ClamAV not available | Medium | Medium | Install via SSH or skip with warning logs |
| Beta users find critical bug | Medium | High | Have rollback plan ready, feature flags |
| Meilisearch index corruption | Low | High | Daily dumps, test restores monthly |
| Shared hosting 502s under load | Low | Medium | Cloudflare CDN, rate limiting prevents abuse |

---

## Post-Launch Monitoring (Week 3+)

### Metrics to Track (Matomo)
- Uploads per day
- Search queries per day
- Average OCR processing time
- Failed uploads (% and reasons)
- Most searched terms (what manuals are missing?)

### Alerts to Set Up
- Health check fails 3 times in a row → email
- Upload queue > 10 jobs → investigate slow processing
- Disk usage > 80% → cleanup old temp files
- Error rate > 5% of requests → investigate

---

## Deployment Checklist (Before Each Deploy)

- [ ] Run tests locally (when you write them)
- [ ] Backup current production state
- [ ] Deploy to staging (use subdomain: staging.digital-lab.ca)
- [ ] Smoke test on staging
- [ ] Deploy to production
- [ ] Verify health endpoint
- [ ] Test one upload end-to-end
- [ ] Monitor logs for 15 minutes
- [ ] Announce deploy in changelog (if user-facing changes)

---

## When to Declare v1.0 "Done"

- ✅ 10+ real boat manuals uploaded by beta users
- ✅ 100+ successful searches performed
- ✅ Zero critical bugs in last 3 days
- ✅ Backup restore tested and documented
- ✅ Uptime > 99.5% over 7 days
- ✅ Beta users say "I'd pay for this"

**Then:** Open registration, announce on boating forums, iterate based on feedback.

---

## Budget Reality Check

**Time Investment:**
- Week 1: 30-40 hours (infrastructure)
- Week 2: 30-40 hours (features)
- Ongoing: 5-10 hours/week (support, bug fixes, features)

**Cost:**
- StackCP: $existing (no added cost)
- Domain: ~$12/year (navidocs.com or boatvault.com)
- ClamAV/qpdf: Free (open source)
- Redis: Free (if needed, small instance)
- Monitoring: Free (UptimeRobot free tier)

**Total new cost: ~$12-15/year**

---

## The "Oh Shit" Scenarios

### Scenario 1: StackCP Bans OCR Workers
**Symptom:** Account suspended for CPU abuse  
**Solution:** Move worker to $5/mo VPS, keep API on StackCP, communicate via queue

### Scenario 2: Meilisearch Index Corrupted
**Symptom:** Search returns errors  
**Solution:** 
```bash
# Stop Meilisearch
systemctl --user stop meilisearch
# Restore from last dump
meilisearch --import-dump ~/backups/latest.dump
# Restart
systemctl --user start meilisearch
```

### Scenario 3: User Uploads 50GB of Manuals
**Symptom:** Disk space alert  
**Solution:** 
- Implement per-user quota (5GB default)
- Add disk usage endpoint
- Offer paid tiers for more storage

### Scenario 4: Beta User Finds Their Manual Public
**Symptom:** Privacy breach report  
**Solution:**
- Verify tenant tokens are working
- Check Meilisearch filters are applied
- Audit access logs
- If breach confirmed: 
  1. Immediately delete document
  2. Rotate all tokens
  3. Email affected user
  4. Root cause analysis

---

**Ship it. Learn from users. Iterate.**

