#!/bin/bash
#
# NaviDocs StackCP Quick Command Reference
# Copy and paste commands directly into terminal
#

# ============================================================================
# DEPLOYMENT - Run these IN ORDER
# ============================================================================

# 1. FULL AUTOMATED DEPLOYMENT (Recommended)
cd /home/setup/navidocs && chmod +x deploy-stackcp.sh && ./deploy-stackcp.sh production

# 2. VERIFY DEPLOYMENT SUCCESS
ssh stackcp "curl -s http://localhost:8001/health | jq . && echo '✅ API Running'"
ssh stackcp "ls -lh ~/navidocs-data/db/navidocs.db && echo '✅ Database Ready'"
ssh stackcp "curl -s http://localhost:7700/health | jq . && echo '✅ Meilisearch Ready'"

# ============================================================================
# FRONTEND BUILD & DEPLOY
# ============================================================================

# 1. BUILD FRONTEND
cd /home/setup/navidocs/client && npm install && npm run build

# 2. DEPLOY FRONTEND TO STACKCP
scp -r /home/setup/navidocs/client/dist/* stackcp:~/public_html/digital-lab.ca/navidocs/

# 3. VERIFY FRONTEND
ssh stackcp "ls -la ~/public_html/digital-lab.ca/navidocs/ | head -5"

# ============================================================================
# LOGS & MONITORING
# ============================================================================

# Real-time application logs
ssh stackcp "tail -f ~/navidocs-data/logs/app.log"

# OCR worker logs (if processing documents)
ssh stackcp "tail -f ~/navidocs-data/logs/ocr-worker.log"

# View last 50 errors
ssh stackcp "grep ERROR ~/navidocs-data/logs/app.log | tail -50"

# Check current status
ssh stackcp "systemctl --user status navidocs.service"

# ============================================================================
# SERVICE CONTROL
# ============================================================================

# Start application
ssh stackcp "systemctl --user start navidocs.service"

# Stop application
ssh stackcp "systemctl --user stop navidocs.service"

# Restart application
ssh stackcp "systemctl --user restart navidocs.service"

# Check if running
ssh stackcp "ps aux | grep 'node /tmp/navidocs' | grep -v grep"

# View systemd journal
ssh stackcp "journalctl --user -u navidocs.service -f"

# ============================================================================
# DATABASE OPERATIONS
# ============================================================================

# Check database size
ssh stackcp "du -h ~/navidocs-data/db/navidocs.db"

# Vacuum database (reclaim space)
ssh stackcp "sqlite3 ~/navidocs-data/db/navidocs.db 'VACUUM;'"

# Count documents
ssh stackcp "sqlite3 ~/navidocs-data/db/navidocs.db 'SELECT COUNT(*) FROM documents;'"

# Backup database
ssh stackcp "cp ~/navidocs-data/db/navidocs.db ~/backups/navidocs-$(date +%Y%m%d-%H%M%S).db"

# Restore database from backup
ssh stackcp "cp ~/backups/navidocs-20251113-120000.db ~/navidocs-data/db/navidocs.db"

# ============================================================================
# FILE MANAGEMENT
# ============================================================================

# Check disk usage
ssh stackcp "du -sh ~/navidocs-data/ && echo '---' && df -h | grep home"

# List uploaded documents
ssh stackcp "ls -lah ~/navidocs-data/uploads/ | head -20"

# Count uploaded files
ssh stackcp "find ~/navidocs-data/uploads -type f | wc -l"

# Archive old uploads (older than 90 days)
ssh stackcp "find ~/navidocs-data/uploads -mtime +90 -exec tar -czf ~/backups/old-uploads-{}.tar.gz {} \\;"

# ============================================================================
# ENVIRONMENT CONFIGURATION
# ============================================================================

# View current environment
ssh stackcp "cat ~/navidocs-data/.env | grep -v SECRET | head -20"

# Update admin email
ssh stackcp "sed -i 's/admin@example.com/your-email@example.com/g' ~/navidocs-data/.env && systemctl --user restart navidocs.service"

# Regenerate JWT secret
ssh stackcp "sed -i 's/JWT_SECRET=.*/JWT_SECRET='$(openssl rand -hex 32)'/g' ~/navidocs-data/.env && systemctl --user restart navidocs.service"

# ============================================================================
# TESTING & VERIFICATION
# ============================================================================

# Test health endpoint
curl -s http://$(ssh stackcp 'hostname -I' | awk '{print $1}'):8001/health | jq .

# Test API accessibility from here
ssh stackcp "curl -s http://localhost:8001/health | jq ."

# Test database connectivity
ssh stackcp "sqlite3 ~/navidocs-data/db/navidocs.db '.databases'"

# Test Meilisearch connectivity
ssh stackcp "curl -s http://localhost:7700/health | jq ."

# Get API version
ssh stackcp "curl -s http://localhost:8001/api/status 2>/dev/null | jq . || echo 'Endpoint not found'"

# ============================================================================
# TROUBLESHOOTING
# ============================================================================

# Full environment diagnostic
ssh stackcp << 'EOF'
echo "=== System Info ==="
uname -a
echo ""
echo "=== Node.js ==="
/tmp/node --version
echo ""
echo "=== Database ==="
ls -lh ~/navidocs-data/db/navidocs.db || echo "Database not found"
echo ""
echo "=== Disk Space ==="
df -h | grep home
echo ""
echo "=== Process Status ==="
ps aux | grep node | grep -v grep || echo "Node process not running"
echo ""
echo "=== Recent Errors ==="
tail -20 ~/navidocs-data/logs/app.log 2>/dev/null || echo "Log file not found"
EOF

# Fix node permissions (if not executable)
ssh stackcp "chmod +x /tmp/node && /tmp/node --version"

# Fix npm issues (use NVM)
ssh stackcp "source ~/.nvm/nvm.sh && cd /tmp/navidocs && npm install --production"

# Check for zombie processes
ssh stackcp "lsof | grep navidocs.db"

# Kill zombie Node process
ssh stackcp "pkill -9 node; sleep 2; systemctl --user start navidocs.service"

# ============================================================================
# BACKUP & RESTORE
# ============================================================================

# Backup everything
ssh stackcp "tar -czf ~/backups/navidocs-full-$(date +%Y%m%d).tar.gz ~/navidocs-data/"

# Restore from backup
ssh stackcp "tar -xzf ~/backups/navidocs-full-20251113.tar.gz -C ~/"

# Backup to local machine
scp -r stackcp:~/navidocs-data ~/backups/navidocs-remote-$(date +%Y%m%d)

# ============================================================================
# DEPLOYMENT ROLLBACK
# ============================================================================

# If deployment fails, revert to last git version
ssh stackcp << 'EOF'
systemctl --user stop navidocs.service
cd /tmp
rm -rf navidocs
git clone https://github.com/dannystocker/navidocs.git
cd navidocs
source ~/.nvm/nvm.sh
npm install --production
systemctl --user start navidocs.service
systemctl --user status navidocs.service
EOF

# ============================================================================
# NGINX CONFIGURATION (if using reverse proxy)
# ============================================================================

# Test nginx config
ssh stackcp "nginx -t"

# Reload nginx
ssh stackcp "systemctl reload nginx"

# View nginx logs
ssh stackcp "tail -f /var/log/nginx/error.log"

# ============================================================================
# HELPER FUNCTIONS (add to ~/.bashrc)
# ============================================================================

# Quick SSH to StackCP
# alias stackcp="ssh digital-lab.ca@ssh.gb.stackcp.com"

# View app logs
# stackcp_logs() { ssh stackcp "tail -f ~/navidocs-data/logs/app.log"; }

# Restart app
# stackcp_restart() { ssh stackcp "systemctl --user restart navidocs.service"; }

# Check status
# stackcp_status() { ssh stackcp "systemctl --user status navidocs.service && curl -s http://localhost:8001/health | jq ."; }

# ============================================================================
# DOCUMENTATION
# ============================================================================

# Read full deployment guide
cat /home/setup/navidocs/STACKCP_DEPLOYMENT_GUIDE.md

# Read architecture analysis
cat /home/setup/navidocs/STACKCP_ARCHITECTURE_ANALYSIS.md

# Read environment report
cat /home/setup/navidocs/STACKCP_ENVIRONMENT_REPORT.md

# ============================================================================
