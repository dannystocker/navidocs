# NaviDocs Deployment Runbook
## 4-Week Sprint Production Deployment Guide

**Document Version:** 1.0
**Last Updated:** 2025-11-13
**Status:** Phase 1 - Ready for Implementation
**Owner:** S4-H10 (Deployment Checklist Creator & Synthesis Agent)

---

## Executive Summary

This runbook provides step-by-step procedures for deploying the NaviDocs 4-week sprint (Nov 13 - Dec 10, 2025) to production. It covers:

- **Pre-deployment validation** (tests, backups, configuration)
- **Zero-downtime deployment** (rolling updates, worker coordination)
- **Post-deployment smoke tests** (critical flow validation)
- **Rollback procedures** (emergency recovery)
- **Monitoring & logging** (incident response)

**Target Deployment Window:** December 8-10, 2025 (after Week 4 completion)
**Estimated Deployment Time:** 30-45 minutes
**Expected Downtime:** <2 minutes (for database migration only)

---

## Part 1: Pre-Deployment Checklist

### A. Test Coverage Validation

**Objective:** Ensure code quality and feature completeness before deploying to production.

#### Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Expected output
# PASS  test/services/warranty.service.test.js
# PASS  test/services/event-bus.service.test.js
# PASS  test/services/webhook.service.test.js
# PASS  test/services/notification.service.test.js
# PASS  test/services/sale-workflow.service.test.js
# PASS  test/services/home-assistant.service.test.js
# PASS  test/services/yachtworld.service.test.js
# ============================================
# Test Suites: 7 passed, 7 total
# Tests: 87 passed, 87 total
# Coverage: 75% statements, 82% branches, 68% functions
```

**Pass Criteria:**
- [ ] All test suites passing
- [ ] Coverage >70% statements
- [ ] Zero critical failures

#### Integration Tests
```bash
# Run integration tests (requires test database)
npm run test:integration

# Expected output
# PASS  test/routes/warranty.routes.test.js
# PASS  test/routes/integrations.routes.test.js
# PASS  test/routes/sales.routes.test.js
# PASS  test/workers/warranty-expiration.worker.test.js
# ============================================
# Test Suites: 4 passed, 4 total
# Tests: 42 passed, 42 total
# Coverage: 68% statements, 75% branches
```

**Pass Criteria:**
- [ ] All API routes tested
- [ ] Database operations verified
- [ ] Background workers functional

#### E2E Tests
```bash
# Run end-to-end tests against staging environment
npm run test:e2e

# Expected output
# PASS  e2e/warranty-tracking.spec.js (warranty creation, alerts, claim package)
# PASS  e2e/sale-workflow.spec.js (initiate, package generation, transfer)
# PASS  e2e/home-assistant.spec.js (webhook registration, event delivery)
# PASS  e2e/critical-flows.spec.js (login, document upload, export)
# ============================================
# Test Suites: 4 passed, 4 total
# Tests: 18 passed, 18 total
# Duration: 2m 34s
```

**Pass Criteria:**
- [ ] All critical user flows pass
- [ ] No timeout failures
- [ ] Performance within acceptable ranges

#### Security Audit
```bash
# Check dependencies for vulnerabilities
npm audit

# Expected output
# 0 vulnerabilities (after fixes applied)

# If vulnerabilities found, fix them:
npm audit fix
npm audit fix --force  # Only if necessary and reviewed
```

**Pass Criteria:**
- [ ] Zero critical vulnerabilities
- [ ] Zero high severity vulnerabilities
- [ ] All audits passed

### B. Database & Environment Setup

#### Database Backup
```bash
# Create timestamped backup before any operations
BACKUP_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
cp /var/www/navidocs/navidocs.db \
   /var/www/navidocs/backups/navidocs.db.backup-${BACKUP_TIMESTAMP}

# Verify backup integrity
sqlite3 /var/www/navidocs/backups/navidocs.db.backup-${BACKUP_TIMESTAMP} ".tables"

# Expected output: Should list all existing tables
# boats documents organization_settings organizations users warranty_tracking webhooks
```

**Backup Verification Checklist:**
- [ ] Backup file created successfully
- [ ] Backup file size > 100KB (contains data)
- [ ] Backup file readable (sqlite3 can open it)
- [ ] Backup location: `/var/www/navidocs/backups/`

#### Environment Variables Configuration

**File:** `.env.production`

```bash
# Required for production deployment
cat > .env.production << 'EOF'
# Application
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.navidocs.app
APP_BASE_URL=https://app.navidocs.app

# Database
DATABASE_URL=/var/www/navidocs/navidocs.db
DATABASE_BACKUP_DIR=/var/www/navidocs/backups

# Authentication
JWT_SECRET=<use_strong_secret_from_vault>
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=7d

# Email Configuration
SMTP_HOST=<email_provider_host>
SMTP_PORT=587
SMTP_USER=<email_service_account>
SMTP_PASSWORD=<use_password_from_vault>
SMTP_FROM=notifications@navidocs.app
SMTP_FROM_NAME=NaviDocs Notifications

# Webhook Configuration
WEBHOOK_SIGNATURE_SECRET=<use_strong_secret_from_vault>
WEBHOOK_TIMEOUT_MS=30000
WEBHOOK_MAX_RETRIES=3

# Home Assistant Integration
HOME_ASSISTANT_WEBHOOK_TIMEOUT=5000

# Redis/Queue Configuration
REDIS_URL=redis://<redis_host>:6379/0
QUEUE_PREFIX=navidocs:queue:

# MLS Integrations
YACHTWORLD_API_KEY=<get_from_partner>
YACHTWORLD_API_BASE=https://api.yachtworld.com
BOAT_TRADER_API_KEY=<get_from_partner>
BOAT_TRADER_API_BASE=https://api.boattrader.com

# Logging & Monitoring
LOG_LEVEL=info
SENTRY_DSN=<get_from_sentry>
NEW_RELIC_LICENSE_KEY=<get_from_new_relic>

# Security
CORS_ORIGIN=https://app.navidocs.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Deployment
DEPLOYMENT_VERSION=$(git rev-parse --short HEAD)
DEPLOYMENT_TIMESTAMP=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
EOF
```

**Environment Validation Checklist:**
- [ ] All required variables defined
- [ ] No hardcoded secrets in code
- [ ] Secrets sourced from vault/secret manager
- [ ] SSL certificate path configured
- [ ] CORS origins correct

#### SSL Certificate Verification
```bash
# Check certificate expiration date
openssl x509 -in /etc/ssl/certs/navidocs.crt -noout -dates

# Expected output similar to:
# notBefore=Nov 13 00:00:00 2024 GMT
# notAfter=Nov 13 23:59:59 2025 GMT

# If certificate expires within 30 days, renew immediately
# Renew using Let's Encrypt (automated)
certbot renew
```

**SSL Checklist:**
- [ ] Certificate valid (not expired)
- [ ] Certificate expires >30 days in future
- [ ] Private key exists and is readable
- [ ] Certificate matches domain

### C. Code Review & Quality Gates

#### Code Review Checklist
- [ ] All pull requests reviewed (minimum 2 reviewers)
- [ ] All review comments resolved
- [ ] No blocking feedback remaining
- [ ] Approval from tech lead obtained

#### Linting & Format Check
```bash
# Check code style
npm run lint

# Expected: 0 errors, 0 warnings

# Auto-format code if needed
npm run format
```

**Linting Checklist:**
- [ ] No ESLint errors
- [ ] No Prettier formatting issues
- [ ] No TypeScript type errors (if using TS)

#### Dependency Check
```bash
# Review dependency updates
npm outdated

# Update minor/patch versions if safe
npm update

# Document major version updates for next sprint
npm ls | grep -E "UNMET|peer"
```

**Dependency Checklist:**
- [ ] No unmet peer dependencies
- [ ] Critical security patches applied
- [ ] Major version updates documented for future

---

## Part 2: Deployment Procedure (Zero-Downtime)

### Pre-Deployment Verification (5 minutes)

```bash
# 1. Confirm current production state
pm2 list
# Should show both navidocs-api and navidocs-worker running

# 2. Check production database size (to estimate backup/migration time)
du -sh /var/www/navidocs/navidocs.db

# 3. Check system resources
free -h  # RAM available
df -h    # Disk space available (minimum 1GB for backup)
uptime   # System load
```

**Pre-Deployment Criteria:**
- [ ] Both services running
- [ ] >1GB disk space available
- [ ] System load <80%
- [ ] No active user sessions (off-peak deployment recommended)

### Step 1: Notify Stakeholders & Prepare (2 minutes)

```bash
# Send deployment notification to monitoring/alerting
# Notify users of upcoming maintenance window (if necessary)

# Example notification:
cat > /tmp/deployment_notice.txt << 'EOF'
DEPLOYMENT IN PROGRESS
Time: 2025-12-08 02:00 UTC
Duration: ~30 minutes
Services: Will be briefly unavailable (~2 minutes for DB migration)
Impact: All users affected during migration window
Status Page: https://status.navidocs.app
EOF

# Post to Slack/Teams if integrated
# curl -X POST -H 'Content-type: application/json' \
#   --data @/tmp/deployment_notice.txt \
#   https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Step 2: Stop Background Workers (3 minutes)

```bash
# CRITICAL: Stop workers first to prevent job processing during migration
pm2 stop navidocs-worker

# Verify workers are stopped
pm2 list | grep navidocs-worker
# Should show: stopped

# Wait for any in-flight jobs to complete (max 2 minutes)
sleep 120

# Check for any stuck jobs
redis-cli LLEN navidocs:queue:default

# If queue length > 0, wait additional 30 seconds
# redis-cli LLEN navidocs:queue:default
```

**Worker Stop Checklist:**
- [ ] navidocs-worker process stopped
- [ ] No new jobs being queued
- [ ] In-flight jobs completed or timed out
- [ ] Queue is empty or nearly empty

### Step 3: Create Production Backup (5 minutes)

```bash
# Create timestamped backup with full verification
BACKUP_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR=/var/www/navidocs/backups
BACKUP_FILE="${BACKUP_DIR}/navidocs.db.backup-${BACKUP_TIMESTAMP}"

# Backup with file locking (SQLite safe copy)
sqlite3 /var/www/navidocs/navidocs.db ".backup '${BACKUP_FILE}'"

# Verify backup size
BACKUP_SIZE=$(du -s "${BACKUP_FILE}" | cut -f1)
ORIGINAL_SIZE=$(du -s /var/www/navidocs/navidocs.db | cut -f1)

echo "Original DB: ${ORIGINAL_SIZE}KB"
echo "Backup File: ${BACKUP_SIZE}KB"

# Verify backup integrity (attempt to query)
BACKUP_TABLES=$(sqlite3 "${BACKUP_FILE}" ".tables" 2>/dev/null | wc -w)
ORIGINAL_TABLES=$(sqlite3 /var/www/navidocs/navidocs.db ".tables" 2>/dev/null | wc -w)

echo "Original tables: ${ORIGINAL_TABLES}"
echo "Backup tables: ${BACKUP_TABLES}"

if [ "${BACKUP_TABLES}" -ne "${ORIGINAL_TABLES}" ]; then
  echo "ERROR: Backup verification failed!"
  exit 1
fi

# Keep only last 5 backups (clean up old ones)
cd "${BACKUP_DIR}"
ls -t navidocs.db.backup-* | tail -n +6 | xargs rm -f

echo "Backup created successfully: ${BACKUP_FILE}"
```

**Backup Verification Checklist:**
- [ ] Backup file created
- [ ] Backup size reasonable (within 90-110% of original)
- [ ] Backup integrity verified (same table count)
- [ ] Old backups cleaned up (keeping last 5)
- [ ] Backup timestamp recorded for rollback

### Step 4: Deploy Code (8 minutes)

```bash
# Navigate to production directory
cd /var/www/navidocs

# Fetch latest code from repository
git fetch origin main
git status
# Should show "Your branch is behind 'origin/main'"

# Review changes before merging
git diff HEAD origin/main --stat
# Shows files changed

# Checkout main and pull (assuming CI/CD passed)
git checkout main
git pull origin main

# Expected: "Fast-forward" message

# Verify deployment branch
git log -1 --oneline
# Should match the release commit hash
```

**Code Deployment Checklist:**
- [ ] git fetch successful
- [ ] Changes reviewed (diff --stat)
- [ ] No merge conflicts
- [ ] Correct branch deployed (main)
- [ ] Deployment commit hash recorded

### Step 5: Install/Update Dependencies (4 minutes)

```bash
# Install production dependencies only
npm install --production

# Verify installation
npm list --depth=0
# Should show all required packages

# Check for any installation errors
npm ls --all 2>&1 | grep -i "error\|unmet"

# If errors found, investigate before proceeding
```

**Dependency Installation Checklist:**
- [ ] npm install completes without errors
- [ ] No peer dependency warnings
- [ ] node_modules directory created
- [ ] package-lock.json consistent

### Step 6: Build Application (3 minutes)

```bash
# Build frontend/backend assets if applicable
npm run build

# Verify build output
ls -la dist/
# Should contain compiled assets

# Check build size (ensure no unexpected bloat)
du -sh dist/
# Should be <50MB for typical Node.js app

# If build fails, abort deployment
if [ $? -ne 0 ]; then
  echo "Build failed! Rolling back..."
  git revert HEAD
  npm install --production
  exit 1
fi
```

**Build Verification Checklist:**
- [ ] Build completes successfully
- [ ] Dist directory created with assets
- [ ] Build size reasonable (<50MB)
- [ ] No build warnings (or documented)

### Step 7: Run Database Migrations (5 minutes) - CRITICAL

```bash
# List pending migrations
npm run migrate:status

# Expected output showing 5 new migrations:
# Pending migrations:
# 1. migrations/20251113_add_warranty_tracking.sql
# 2. migrations/20251113_add_webhooks.sql
# 3. migrations/20251113_add_sale_workflows.sql
# 4. migrations/20251113_add_notification_templates.sql
# 5. migrations/20251120_add_home_assistant_config.sql

# Apply migrations (this is the brief downtime window ~2 minutes)
echo "=== MIGRATION START TIME: $(date) ==="
npm run migrate:up

# Expected output:
# Running migration: 20251113_add_warranty_tracking.sql
# Running migration: 20251113_add_webhooks.sql
# Running migration: 20251113_add_sale_workflows.sql
# Running migration: 20251113_add_notification_templates.sql
# Running migration: 20251120_add_home_assistant_config.sql
# ✓ All migrations completed successfully
echo "=== MIGRATION END TIME: $(date) ==="

# Verify migration success
sqlite3 /var/www/navidocs/navidocs.db ".schema warranty_tracking"
# Should output warranty_tracking schema

# If migration fails, rollback:
if [ $? -ne 0 ]; then
  echo "ERROR: Migration failed! Rolling back..."
  npm run migrate:down
  exit 1
fi
```

**Migration Verification Checklist:**
- [ ] All migrations listed (npm run migrate:status)
- [ ] Migration execution successful
- [ ] New tables created (verify with sqlite3 .schema)
- [ ] New indexes created
- [ ] Data integrity maintained (row counts match)

### Step 8: Restart API Server (2 minutes)

```bash
# Clear Node.js module cache (optional but recommended)
# Restart the API with graceful shutdown
pm2 restart navidocs-api --wait-ready --listen-timeout 5000

# Verify API is running
pm2 list | grep navidocs-api
# Should show: "online"

# Wait for server to be ready (health check)
RETRY_COUNT=0
MAX_RETRIES=30  # 30 * 2 seconds = 60 seconds max wait

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -sf http://localhost:3000/api/health > /dev/null; then
    echo "✓ API server is responding to health checks"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT+1))
  echo "Waiting for API server... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "ERROR: API server failed to start!"
  exit 1
fi
```

**API Server Startup Checklist:**
- [ ] Process restarted (pm2 restart)
- [ ] Process shows "online" status
- [ ] Health check endpoint returns 200
- [ ] No errors in logs (pm2 logs)

### Step 9: Restart Background Workers (2 minutes)

```bash
# Restart workers with the new code
pm2 restart navidocs-worker --wait-ready --listen-timeout 5000

# Verify worker is running
pm2 list | grep navidocs-worker
# Should show: "online"

# Check worker logs for startup messages
pm2 logs navidocs-worker --lines 10 --nostream
# Should show "Worker started" messages

# Monitor queue for 30 seconds (verify jobs are being processed)
for i in {1..15}; do
  QUEUE_SIZE=$(redis-cli LLEN navidocs:queue:default 2>/dev/null || echo "0")
  echo "Queue size: $QUEUE_SIZE (check $i/15)"
  sleep 2
done
```

**Worker Startup Checklist:**
- [ ] Process restarted (pm2 restart)
- [ ] Process shows "online" status
- [ ] No errors in logs
- [ ] Jobs being processed from queue

---

## Part 3: Post-Deployment Validation (10 minutes)

### A. Health Check (2 minutes)

```bash
# 1. Health endpoint
curl -v http://localhost:3000/api/health

# Expected response:
# HTTP/1.1 200 OK
# Content-Type: application/json
# {
#   "status": "ok",
#   "timestamp": "2025-12-08T02:35:00Z",
#   "database": "connected",
#   "redis": "connected",
#   "workers": "running"
# }
```

**Health Check Criteria:**
- [ ] HTTP 200 response
- [ ] All services showing as "connected" or "running"
- [ ] No error messages in response

### B. Critical Endpoint Tests (3 minutes)

```bash
# Test authentication endpoints
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@navidocs.app","password":"test"}' \
  | jq '.'

# Expected: { "token": "...", "user": {...} }
# HTTP 200-401 (depending on demo account)

# Test boat listing endpoint
curl -H "Authorization: Bearer ${AUTH_TOKEN}" \
  http://localhost:3000/api/boats \
  | jq '.length'

# Expected: Numeric count (could be 0 if no boats)

# Test warranty endpoint
curl -H "Authorization: Bearer ${AUTH_TOKEN}" \
  http://localhost:3000/api/warranties/expiring \
  | jq '.'

# Expected: Array of warranties (could be empty [])

# Test warranty creation
curl -X POST -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "boat_id":"test-boat",
    "item_name":"Engine",
    "purchase_date":"2023-01-15",
    "warranty_period_months":24
  }' \
  http://localhost:3000/api/warranties

# Expected: { "id": "...", "expiration_date": "2025-01-15" }
```

**Endpoint Test Checklist:**
- [ ] /api/health returns 200
- [ ] /api/auth/login responds (200 or 401)
- [ ] /api/boats returns data or empty array
- [ ] /api/warranties/expiring returns array
- [ ] POST /api/warranties creates warranty successfully

### C. Database Verification (2 minutes)

```bash
# Verify all new tables exist
sqlite3 /var/www/navidocs/navidocs.db << 'EOF'
.mode column
.headers on

-- Check warranty_tracking table
SELECT COUNT(*) as warranty_count FROM warranty_tracking;

-- Check webhooks table
SELECT COUNT(*) as webhook_count FROM webhooks;

-- Check sale_workflows table
SELECT COUNT(*) as sale_count FROM sale_workflows;

-- Check notification_templates table
SELECT COUNT(*) as template_count FROM notification_templates;

-- Verify indexes created
SELECT COUNT(*) as index_count FROM sqlite_master
WHERE type='index' AND tbl_name IN (
  'warranty_tracking', 'webhooks', 'sale_workflows'
);
EOF

# Expected output:
# warranty_count: 0 (or >0 if test data inserted)
# webhook_count: 0
# sale_count: 0
# template_count: >0 (seed templates inserted)
# index_count: >5 (all required indexes)
```

**Database Verification Checklist:**
- [ ] warranty_tracking table exists
- [ ] webhooks table exists
- [ ] sale_workflows table exists
- [ ] notification_templates table exists
- [ ] All indexes created successfully

### D. Smoke Tests (3 minutes)

```bash
# Run critical smoke tests
npm run test:smoke

# Expected output:
# PASS  smoke-tests/warranty-creation.spec.js
# PASS  smoke-tests/webhook-delivery.spec.js
# PASS  smoke-tests/notification-sending.spec.js
# PASS  smoke-tests/database-operations.spec.js
# ============================================
# Smoke Tests: 4 passed, 4 total
# Duration: 1m 30s

# If smoke tests fail, check logs:
pm2 logs navidocs-api --lines 50
```

**Smoke Test Criteria:**
- [ ] All smoke tests pass
- [ ] No timeout errors
- [ ] No database connectivity errors
- [ ] No authentication errors

### E. Error Rate & Logs Monitoring (Continuous for 30 minutes)

```bash
# Monitor application logs for errors
pm2 logs navidocs-api --lines 20

# Monitor worker logs for failed jobs
pm2 logs navidocs-worker --lines 20

# Check error rate in monitoring system
# Example query (if using Sentry/New Relic):
# SELECT COUNT(*) FROM errors WHERE timestamp > now() - 30 minutes

# Alert if:
# - Error rate > 1% of requests
# - Any critical errors in logs
# - Worker jobs consistently failing

# If issues detected:
#   1. Check logs for root cause
#   2. If severe, proceed to ROLLBACK
#   3. If minor, create incident ticket for next sprint
```

**Log Monitoring Checklist:**
- [ ] No critical errors in logs
- [ ] Error rate <1% of requests
- [ ] Worker processing jobs successfully
- [ ] No database connection errors
- [ ] No memory leaks (consistent RAM usage)

---

## Part 4: Rollback Procedure (Emergency Recovery)

### When to Rollback

Initiate rollback immediately if:
- API server won't start (after 5 minutes)
- Database migrations fail
- Health check endpoints fail
- Critical business logic broken
- Error rate >5% of requests
- Database corrupted or locked

**Do NOT rollback for:**
- Minor UI bugs
- Non-critical feature failures
- Cosmetic issues
- Warnings in logs (errors must be critical)

### Rollback Steps (Automated Script)

```bash
#!/bin/bash
# File: /var/www/navidocs/scripts/rollback.sh
# Emergency rollback script

set -e  # Exit on any error

ROLLBACK_TIME=$(date +%Y-%m-%dT%H:%M:%SZ)
CURRENT_VERSION=$(git rev-parse --short HEAD)
BACKUP_DIR=/var/www/navidocs/backups

echo "============================================"
echo "EMERGENCY ROLLBACK INITIATED"
echo "Time: $ROLLBACK_TIME"
echo "Current Version: $CURRENT_VERSION"
echo "============================================"

# Step 1: Stop all services
echo "Step 1: Stopping services..."
pm2 stop navidocs-api navidocs-worker
sleep 3

# Step 2: Find most recent backup
echo "Step 2: Finding latest backup..."
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/navidocs.db.backup-* 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "ERROR: No backup found! Manual recovery required."
  exit 1
fi

echo "Using backup: $LATEST_BACKUP"

# Step 3: Verify backup before restore
echo "Step 3: Verifying backup integrity..."
BACKUP_TABLES=$(sqlite3 "$LATEST_BACKUP" ".tables" 2>/dev/null | wc -w)
if [ "$BACKUP_TABLES" -lt 10 ]; then
  echo "ERROR: Backup appears corrupted (only $BACKUP_TABLES tables)"
  exit 1
fi

# Step 4: Restore database
echo "Step 4: Restoring database from backup..."
cp "$LATEST_BACKUP" /var/www/navidocs/navidocs.db

# Verify restore
RESTORED_TABLES=$(sqlite3 /var/www/navidocs/navidocs.db ".tables" 2>/dev/null | wc -w)
echo "Restored database has $RESTORED_TABLES tables"

# Step 5: Revert code to previous version
echo "Step 5: Reverting code..."
cd /var/www/navidocs
PREVIOUS_VERSION=$(git rev-parse HEAD~1)
git reset --hard $PREVIOUS_VERSION

# Step 6: Reinstall dependencies
echo "Step 6: Reinstalling dependencies..."
npm install --production

# Step 7: Restart services
echo "Step 7: Restarting services..."
pm2 start navidocs-api navidocs-worker

# Step 8: Health check
echo "Step 8: Verifying services..."
sleep 5
pm2 list

# Step 9: Final verification
echo "Step 9: Running health checks..."
RETRY_COUNT=0
while [ $RETRY_COUNT -lt 30 ]; do
  if curl -sf http://localhost:3000/api/health > /dev/null; then
    echo "✓ Rollback successful - API is responding"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT+1))
  sleep 2
done

if [ $RETRY_COUNT -eq 30 ]; then
  echo "ERROR: Rollback failed - API not responding"
  exit 1
fi

echo "============================================"
echo "ROLLBACK COMPLETE"
echo "Previous Version: $CURRENT_VERSION"
echo "Rolled Back To: $PREVIOUS_VERSION"
echo "Database Restored From: $LATEST_BACKUP"
echo "Time: $(date +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================"

# Send notification to Slack/email
# curl -X POST ... # notification code
```

### Manual Rollback (If Automated Fails)

```bash
# 1. Stop services
pm2 stop navidocs-api navidocs-worker

# 2. Restore database (replace TIMESTAMP with actual backup timestamp)
TIMESTAMP="20251208-020000"  # Example from backup
cp /var/www/navidocs/backups/navidocs.db.backup-${TIMESTAMP} \
   /var/www/navidocs/navidocs.db

# 3. Verify database integrity
sqlite3 /var/www/navidocs/navidocs.db ".tables"

# 4. Revert code
cd /var/www/navidocs
git log --oneline -5  # Find previous good commit
git reset --hard <previous-commit-hash>

# 5. Reinstall dependencies
npm install --production

# 6. Restart services
pm2 start navidocs-api navidocs-worker

# 7. Monitor logs
pm2 logs navidocs-api --lines 50
pm2 logs navidocs-worker --lines 50

# 8. Verify health
curl http://localhost:3000/api/health
```

**Rollback Verification Checklist:**
- [ ] Services stopped cleanly
- [ ] Database restored from backup
- [ ] Database integrity verified
- [ ] Code reverted to previous version
- [ ] Dependencies reinstalled
- [ ] Services restarted successfully
- [ ] Health check passes
- [ ] No errors in logs

### Post-Rollback Actions

```bash
# After rollback is complete and verified:

# 1. Document the incident
cat > /tmp/rollback_incident.log << 'EOF'
ROLLBACK INCIDENT REPORT
Date: 2025-12-08
Time: 02:35 UTC
Duration: 25 minutes
Reason: [Root cause analysis]
Version Rolled Back From: [commit hash]
Version Restored To: [commit hash]
Data Loss: None (database restored from backup)
Actions Taken: [List all steps]
Root Cause: [Analysis]
Prevention: [How to avoid in future]
EOF

# 2. Notify team
# Email incident report to team
# Post to incident channel in Slack

# 3. Create post-mortem ticket
# Add to sprint backlog: "Post-mortem: Deployment failure on 2025-12-08"

# 4. Review deployment process
# Schedule review meeting for next day
# Document lessons learned
```

---

## Part 5: Monitoring & Support

### Real-Time Monitoring Dashboard

**Tools to Monitor:**
1. **Error Tracking:** Sentry/New Relic
   - Alert if error rate >1% within 5 minutes
   - Critical errors require immediate investigation

2. **Performance Monitoring:** New Relic/DataDog
   - API response time <200ms (p95)
   - Database query time <100ms (p95)
   - Worker job processing time <5s (p95)

3. **Infrastructure Monitoring:** CloudWatch/Datadog
   - CPU usage <80%
   - Memory usage <85%
   - Disk usage <90%
   - Network throughput normal

4. **Application Logs:** PM2/ELK Stack
   - Check for "ERROR" and "CRITICAL" messages
   - Monitor for "OutOfMemory" warnings
   - Check for "Database locked" errors

### Incident Response

**If Issues Detected During First 30 Minutes:**

```bash
# Immediate steps:
# 1. Check if issue is configuration (env var, network) or code
pm2 logs navidocs-api --lines 100
pm2 logs navidocs-worker --lines 100

# 2. If quick fix available (< 5 minutes):
#    - Apply fix
#    - Restart services
#    - Monitor for 10 minutes

# 3. If issue is critical or fix takes >5 minutes:
#    - Execute rollback (see Part 4)
#    - Create incident ticket
#    - Plan hotfix for next deployment

# 4. If issue is intermittent:
#    - Monitor for 15 additional minutes
#    - Check system resources (memory, disk, CPU)
#    - If issue persists, rollback
```

### Deployment Success Criteria

**Deployment is SUCCESSFUL if:**
- [ ] All tests pass (unit, integration, E2E)
- [ ] Deployment completes without errors
- [ ] All health checks pass
- [ ] All smoke tests pass
- [ ] Error rate <0.1% during first 24 hours
- [ ] No critical issues in logs
- [ ] Database integrity verified
- [ ] All new features working as expected

**Deployment is FAILED if:**
- [ ] Tests fail before deployment
- [ ] Deployment process errors
- [ ] Health checks fail after deployment
- [ ] Smoke tests fail
- [ ] Error rate >1% during first hour
- [ ] Critical errors in logs
- [ ] Database corruption detected
- [ ] Rollback required

---

## Appendix A: Quick Reference

### Deployment Timeline
```
Pre-Deployment Checks:    5 min (tests, backups)
Stakeholder Notification: 2 min
Stop Workers:             3 min
Database Backup:          5 min
Code Deploy:              8 min
Dependencies:             4 min
Build:                    3 min
Migrations:               5 min
API Restart:              2 min
Worker Restart:           2 min
─────────────────────────────
TOTAL DOWNTIME:           ~2 min (migration window)
TOTAL TIME:              ~39 min (with all steps)

Post-Deployment Validation: 10 min
Monitoring Period:         30 min (continuous)
```

### Critical Commands

```bash
# Health check
curl http://localhost:3000/api/health

# View logs
pm2 logs navidocs-api
pm2 logs navidocs-worker

# View process status
pm2 list

# Restart services
pm2 restart navidocs-api navidocs-worker

# Emergency rollback
/var/www/navidocs/scripts/rollback.sh

# Database backup
sqlite3 /var/www/navidocs/navidocs.db ".backup '/var/www/navidocs/backups/backup.db'"

# Check queue size
redis-cli LLEN navidocs:queue:default
```

### Emergency Contacts

```
Tech Lead: [Name/Email]
DevOps: [Name/Email]
On-Call: [Phone/Email]
Incident Channel: #incident-response (Slack)
```

---

## Appendix B: Testing Checklist Template

Use this template for deployment day:

```bash
#!/bin/bash
# Pre-Deployment Checklist - Copy and use on deployment day

DEPLOYMENT_DATE=$(date +%Y-%m-%d)
DEPLOYMENT_TIME=$(date +%H:%M:%S)

echo "NaviDocs Deployment Checklist"
echo "Date: $DEPLOYMENT_DATE"
echo "Time: $DEPLOYMENT_TIME"
echo "========================================"

# Tests
echo "[  ] Unit tests passing"
echo "[  ] Integration tests passing"
echo "[  ] E2E tests passing"
echo "[  ] Security audit passed"

# Backups
echo "[  ] Database backup created"
echo "[  ] Backup verified"

# Environment
echo "[  ] .env.production configured"
echo "[  ] SSL certificate valid"
echo "[  ] Secrets in vault, not in code"

# Deployment
echo "[  ] Code reviewed and approved"
echo "[  ] Dependencies check passed"
echo "[  ] Build successful"
echo "[  ] Migrations ready"

# Deployment Steps
echo "[  ] Pre-deployment checks complete"
echo "[  ] Workers stopped"
echo "[  ] Database backed up"
echo "[  ] Code deployed"
echo "[  ] Dependencies installed"
echo "[  ] Build completed"
echo "[  ] Migrations applied"
echo "[  ] API restarted"
echo "[  ] Workers restarted"

# Post-Deployment
echo "[  ] Health checks pass"
echo "[  ] Smoke tests pass"
echo "[  ] Critical endpoints responding"
echo "[  ] Database verified"
echo "[  ] No errors in logs"

# Sign-Off
echo "========================================"
echo "Deployed by: [Your Name]"
echo "Approved by: [Tech Lead Name]"
echo "Timestamp: $DEPLOYMENT_DATE $DEPLOYMENT_TIME UTC"
```

---

**Document Status:** Ready for Phase 2 Synthesis
**Next Steps:** Await completion of agents S4-H01 through S4-H09, then synthesize all outputs in `session-4-handoff.md`
