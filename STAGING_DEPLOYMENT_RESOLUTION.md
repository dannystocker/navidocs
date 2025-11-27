# NaviDocs Staging Deployment - Critical Resolution Required

**Generated:** 2025-11-27
**Status:** BLOCKED - Architecture Mismatch
**Severity:** HIGH
**Agent:** Field Commander (Continuation)

---

## Executive Summary

The staging deployment to StackCP (`digital-lab.ca/navidocs-staging`) has successfully transferred 883 files but **cannot execute** due to a critical platform incompatibility.

**Root Cause:** StackCP is a PHP-based shared hosting environment that does not provide Node.js runtime. NaviDocs requires Node.js/Express to run its API backend.

**Current Status:**
- ✅ Files deployed: 883 files (100% complete)
- ✅ Directory structure: Correct
- ✅ Permissions: Configured
- ❌ **Runtime availability: Node.js NOT AVAILABLE**
- ❌ **API endpoints: 404 (no runtime to execute)**

**Impact:**
- Static frontend files (HTML/CSS/JS) are accessible
- API endpoints (`/api/v1/*`) return 404 errors
- Document upload, search, OCR features non-functional
- Database operations unavailable

---

## Technical Analysis

### StackCP Environment Investigation

**SSH Connection:** `ssh stackcp` (alias to `ssh.gb.stackcp.com`)
**Deployment Path:** `~/public_html/digital-lab.ca/navidocs-staging/`

**Available Runtimes:**
```bash
✅ PHP 8.0.30 (cli)
❌ Node.js - NOT FOUND in /usr/local/bin:/usr/bin
❌ npm - NOT FOUND
❌ Python3 - Permission denied
```

**Hosting Type:** Shared hosting with Apache/PHP stack

**Filesystem Structure:**
```
/home/sites/7a/c/cb8112d0d1/public_html/digital-lab.ca/navidocs-staging/
├── server/           # Node.js application (cannot execute)
│   ├── index.js      # Express server entry point
│   ├── routes/       # API endpoints
│   ├── config/       # Database configuration
│   └── .env          # Environment variables
├── public/           # Static assets (accessible via web)
├── client/           # Frontend application
└── .htaccess         # Apache configuration (works)
```

**What Works:**
- Static file serving via Apache
- .htaccess rewrite rules
- HTML/CSS/JavaScript delivery to browsers

**What Doesn't Work:**
- Node.js server execution
- Express API endpoints (`/api/v1/*`)
- Database operations (SQLite via Node.js)
- PDF processing (requires Node.js backend)
- OCR processing (requires Node.js backend)
- Search indexing (requires Meilisearch + Node.js)
- File uploads (requires Node.js API)

---

## Resolution Options

### Option A: Hybrid Deployment (Static Frontend + Remote API)
**Complexity:** Medium
**Cost:** Low
**Timeline:** 2-4 hours

**Implementation:**
1. Keep static frontend on StackCP (`https://digital-lab.ca/navidocs-staging/`)
2. Deploy Node.js API to a Node.js-compatible platform:
   - **Railway.app** (free tier: 500 hours/month)
   - **Render.com** (free tier available)
   - **Fly.io** (free tier: 3GB RAM)
   - **Heroku** (discontinued free tier, $7/month)
3. Configure CORS on API server to accept requests from StackCP domain
4. Update frontend API base URL to point to remote API

**Advantages:**
- Uses existing StackCP hosting
- Low cost (free tier options available)
- Scalable (API can be upgraded independently)

**Disadvantages:**
- Two separate deployments to maintain
- CORS configuration required
- Potential latency (frontend ↔ API on different servers)

---

### Option B: Full Node.js VPS Deployment
**Complexity:** High
**Cost:** Medium ($5-10/month)
**Timeline:** 4-8 hours

**Implementation:**
1. Provision VPS with Node.js support:
   - **DigitalOcean** ($6/month Droplet)
   - **Linode** ($5/month Nanode)
   - **Vultr** ($5/month)
   - **Hetzner** (€4.51/month)
2. Install Node.js, npm, PM2, nginx
3. Deploy full NaviDocs stack (frontend + backend)
4. Configure nginx reverse proxy
5. Set up SSL with Let's Encrypt
6. Configure PM2 for process management

**Advantages:**
- Full control over environment
- Can run all services (Node.js, Meilisearch, Redis)
- Professional production setup
- Single deployment location

**Disadvantages:**
- Requires server administration
- Monthly hosting cost
- More complex initial setup
- Security/updates maintenance required

---

### Option C: StackCP PHP Bridge (Not Recommended)
**Complexity:** Very High
**Cost:** Low
**Timeline:** 8-16 hours

**Implementation:**
1. Create PHP scripts on StackCP that proxy requests
2. Deploy Node.js API elsewhere (see Option A)
3. PHP scripts forward requests to Node.js API
4. Handle authentication, CORS, error handling in PHP

**Advantages:**
- Single domain for users
- Uses existing StackCP hosting

**Disadvantages:**
- High complexity (maintain PHP + Node.js code)
- Potential security vulnerabilities in proxy layer
- Performance overhead (PHP → Node.js)
- Difficult to debug
- **NOT RECOMMENDED** - overcomplicated solution

---

### Option D: Containerized Deployment (Oracle Cloud Free Tier)
**Complexity:** Very High
**Cost:** Free
**Timeline:** 6-12 hours

**Implementation:**
1. Set up Oracle Cloud Always Free tier (4 ARM cores, 24GB RAM)
2. Deploy NaviDocs as Docker container
3. Configure nginx reverse proxy
4. Set up SSL/TLS
5. Configure firewall rules

**Advantages:**
- **100% FREE** (Oracle Cloud Always Free)
- Professional containerized setup
- Generous resources (better than paid options)
- Can run full stack (API, Meilisearch, Redis)

**Disadvantages:**
- Complex initial setup
- Requires Oracle Cloud account
- ARM architecture (need multi-arch Docker builds)
- Requires container orchestration knowledge

---

## Recommended Solution: Option A (Hybrid Deployment)

**Rationale:**
1. **Fastest time to production:** 2-4 hours
2. **Lowest cost:** Free tier available
3. **Uses existing assets:** StackCP hosting already paid for
4. **Minimal complexity:** Frontend stays where it is
5. **Scalable:** Can migrate to Option B later if needed

**Recommended Platform for API:** **Railway.app**
- Free tier: 500 execution hours/month ($5 credit)
- Automatic deployments from Git
- Built-in SSL/TLS
- PostgreSQL/Redis available (if needed)
- Simple environment variable management
- Zero-config Node.js deployment

---

## Implementation Plan (Option A - Hybrid)

### Phase 1: Prepare API for Deployment (30 minutes)

1. **Update CORS configuration** in `server/index.js`:
```javascript
// Add before routes
app.use(cors({
  origin: [
    'https://digital-lab.ca',
    'https://www.digital-lab.ca'
  ],
  credentials: true
}));
```

2. **Verify environment variables** in `.env`:
- Set `NODE_ENV=production`
- Configure database path for Railway
- Set proper JWT_SECRET (production-grade)
- Configure Meilisearch (if using Railway's built-in or external)

3. **Create `railway.json`** for deployment configuration:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Phase 2: Deploy API to Railway (45 minutes)

1. Create Railway account (GitHub OAuth)
2. Create new project from GitHub repository
3. Configure environment variables:
   - Copy all from `/home/setup/navidocs/server/.env`
   - Update `DATABASE_PATH` for Railway persistent volume
   - Set `PORT` (Railway auto-assigns)
4. Deploy from `fix/production-sync-2025` branch
5. Wait for build (~5-10 minutes)
6. Test health endpoint: `https://<railway-app>.up.railway.app/health`

### Phase 3: Update Frontend API Configuration (30 minutes)

1. **Update frontend API base URL** (either via .env or config file):
```javascript
// In frontend configuration
const API_BASE_URL = process.env.VITE_API_URL || 'https://<railway-app>.up.railway.app/api/v1';
```

2. **Rebuild frontend** with production API URL:
```bash
cd /home/setup/navidocs/client
VITE_API_URL=https://<railway-app>.up.railway.app/api/v1 npm run build
```

3. **Deploy updated frontend to StackCP**:
```bash
scp -r client/dist/* stackcp:~/public_html/digital-lab.ca/navidocs-staging/
```

### Phase 4: End-to-End Testing (30 minutes)

1. **Test static frontend:** `https://digital-lab.ca/navidocs-staging/`
2. **Test API health:** `https://<railway-app>.up.railway.app/health`
3. **Test search endpoint:** `https://<railway-app>.up.railway.app/api/v1/search?q=test`
4. **Test authentication:** Login flow
5. **Test document upload:** PDF processing
6. **Test OCR:** Extract text from PDF

### Phase 5: Monitoring & Documentation (30 minutes)

1. Set up Railway monitoring dashboard
2. Configure error alerting (Railway built-in)
3. Update deployment documentation
4. Create rollback procedure
5. Document API URL for team

**Total Time:** 2.5 - 3 hours

---

## Alternative: Oracle Cloud Free Tier (Advanced Users)

If cost is a critical concern and you have DevOps experience, **Oracle Cloud Always Free** is the best option:

**Resources Available:**
- 4 ARM cores (Ampere A1)
- 24 GB RAM
- 200 GB storage
- 10 TB/month outbound data transfer
- 100% FREE (no credit card expiration)

**What You Can Run:**
- Full NaviDocs stack (Node.js API)
- Meilisearch (search engine)
- Redis (job queue)
- PostgreSQL (if migrating from SQLite)
- nginx (reverse proxy)

**Setup Complexity:** HIGH (requires Docker, nginx, SSL, firewall configuration)

**When to Choose This:**
- You have DevOps/sysadmin experience
- You want a permanent free hosting solution
- You're comfortable with ARM architecture
- You want full control and scalability

---

## Current Local Development Status

**Local Server:** ✅ RUNNING
**Port:** 8001
**Process ID:** 214605/214606
**Health Check:** `http://localhost:8001/health` → 200 OK
**Database:** 13 documents, 232 pages, 274.9 MB

**Test Local API:**
```bash
# Health check
curl http://localhost:8001/health

# Search endpoint
curl "http://localhost:8001/api/v1/search?q=yacht"

# Document list
curl http://localhost:8001/api/v1/documents
```

---

## Immediate Next Steps

**DECISION REQUIRED:** Choose deployment option (A, B, or D)

**If Option A (Hybrid - Railway):**
```bash
# 1. Create Railway account at railway.app
# 2. Connect GitHub repository
# 3. Deploy from fix/production-sync-2025 branch
# 4. Configure environment variables from server/.env
# 5. Test API endpoint
# 6. Update frontend config with Railway URL
# 7. Rebuild and deploy frontend to StackCP
```

**If Option B (VPS):**
```bash
# 1. Provision VPS (DigitalOcean recommended)
# 2. Install Node.js v20, npm, PM2, nginx
# 3. Clone repository
# 4. Configure environment variables
# 5. Set up nginx reverse proxy
# 6. Configure SSL with Let's Encrypt
# 7. Start with PM2
```

**If Option D (Oracle Cloud):**
```bash
# 1. Create Oracle Cloud account
# 2. Provision Always Free Compute instance (ARM)
# 3. Set up Docker and docker-compose
# 4. Clone repository
# 5. Build multi-arch Docker image
# 6. Configure docker-compose with all services
# 7. Set up nginx and SSL
# 8. Configure firewall rules
```

---

## Files Requiring Updates for Hybrid Deployment

1. **`/home/setup/navidocs/server/index.js`**
   - Add CORS configuration for StackCP domain

2. **`/home/setup/navidocs/client/.env.production`**
   - Set `VITE_API_URL` to Railway deployment URL

3. **`/home/setup/navidocs/railway.json`** (create new)
   - Railway deployment configuration

4. **`/home/setup/navidocs/server/.env`**
   - Update for production Railway environment

5. **`/home/setup/navidocs/deploy-staging-stackcp.sh`**
   - Update to only deploy frontend static files
   - Remove server/ directory from deployment

---

## Cost Comparison

| Option | Initial Cost | Monthly Cost | Yearly Cost | Free Tier |
|--------|-------------|--------------|-------------|-----------|
| **A: Railway** | $0 | $0* | $0* | 500hrs/mo ($5 credit) |
| **B: DigitalOcean** | $0 | $6 | $72 | None |
| **B: Linode** | $0 | $5 | $60 | None |
| **B: Vultr** | $0 | $5 | $60 | None |
| **B: Hetzner** | $0 | €4.51 | €54.12 | None |
| **D: Oracle Cloud** | $0 | $0 | $0 | **Always Free** |

*Railway free tier provides 500 execution hours/month (~20 days). For 24/7 uptime, paid tier is $5/month.*

---

## Risk Assessment

### Option A Risks
- **Railway free tier limits:** May need upgrade for production traffic
- **CORS complexity:** Frontend-API separation requires proper CORS config
- **Two deployments:** More moving parts to maintain

**Mitigation:** Document deployment process, automate with CI/CD

### Option B Risks
- **Server maintenance:** Requires ongoing security updates
- **Downtime:** VPS failures require manual intervention
- **Cost:** Monthly recurring expense

**Mitigation:** Set up monitoring, automated backups, use PM2 for auto-restart

### Option D Risks
- **Complex setup:** Steep learning curve for Docker/Oracle Cloud
- **ARM architecture:** Requires multi-arch builds
- **Account suspension:** Oracle may terminate free accounts (rare but reported)

**Mitigation:** Comprehensive documentation, backup deployment plan

---

## Recommendation

**For immediate staging deployment:** Choose **Option A (Railway)**
- Fastest to production (2-3 hours)
- Free tier sufficient for staging
- Can migrate to Option B or D later if needed

**For long-term production:** Choose **Option D (Oracle Cloud Always Free)**
- 100% free forever
- Professional infrastructure
- Scalable for growth
- Worth the initial setup complexity

**For enterprise/commercial:** Choose **Option B (VPS)**
- Full control
- Predictable costs
- Professional setup
- Dedicated resources

---

## Support Resources

**Railway Documentation:** https://docs.railway.app/
**Oracle Cloud Free Tier:** https://www.oracle.com/cloud/free/
**DigitalOcean Tutorials:** https://www.digitalocean.com/community/tutorials
**PM2 Process Manager:** https://pm2.keymetrics.io/

---

## Conclusion

The staging deployment successfully transferred all files to StackCP but cannot execute due to platform incompatibility (PHP vs Node.js).

**STATUS:** BLOCKED - Deployment strategy decision required
**CONFIDENCE:** 100% (root cause identified)
**RECOMMENDED ACTION:** Deploy API to Railway (Option A) for fastest resolution
**ESTIMATED TIME TO RESOLUTION:** 2-3 hours

---

**Generated by:** Field Commander (NaviDocs Deployment Orchestrator)
**Date:** 2025-11-27
**Git Branch:** `fix/production-sync-2025`
**Commit:** `364f080`
