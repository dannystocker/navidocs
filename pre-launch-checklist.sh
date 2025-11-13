#!/bin/bash

# NaviDocs Pre-Launch Checklist
# IF.TTT Citation: if://doc/navidocs/pre-launch-checklist/v1.0
# Purpose: Bulletproof verification before starting NaviDocs stack
# Created: 2025-11-13
# Based on: Agent reports 1-5 failure analysis

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Log file
LOG_FILE="/tmp/navidocs-pre-launch-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}🔍 NaviDocs Pre-Launch Checklist${NC}"
echo -e "${CYAN}IF.TTT Citation: if://doc/navidocs/pre-launch-checklist/v1.0${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Log file: $LOG_FILE"
echo "Started: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

# Helper functions
check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    echo -e "${RED}   → $2${NC}"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    echo -e "${YELLOW}   → $2${NC}"
    ((WARN++))
}

section_header() {
    echo ""
    echo -e "${BLUE}━━━ $1 ━━━${NC}"
    echo -e "${CYAN}IF.TTT: if://test/navidocs/$(echo $1 | tr '[:upper:]' '[:lower:]' | tr ' ' '-')${NC}"
}

# ============================================================================
# CHECK 1: Git Repository State
# ============================================================================
section_header "GIT REPOSITORY STATE"

cd /home/setup/navidocs || exit 1

# Check git commit
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "UNKNOWN")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "UNKNOWN")

if [ "$GIT_COMMIT" != "UNKNOWN" ]; then
    check_pass "Git repository detected"
    echo "   Commit: $GIT_COMMIT"
    echo "   Branch: $GIT_BRANCH"
    echo "   IF.TTT: if://git/navidocs/commit/$GIT_COMMIT"
else
    check_warn "Not a git repository" "Version tracking disabled"
fi

# Check for uncommitted changes
if git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
    check_pass "Working tree clean (no uncommitted changes)"
else
    check_warn "Uncommitted changes detected" "May not match production version"
    git status --short 2>/dev/null | head -10
fi

# ============================================================================
# CHECK 2: Required Ports Available
# ============================================================================
section_header "PORT AVAILABILITY"

check_port() {
    local port=$1
    local service=$2
    local allow_occupied=$3

    if lsof -Pi :${port} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        local pid=$(lsof -Pi :${port} -sTCP:LISTEN -t)
        local process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")

        if [ "$allow_occupied" = "true" ]; then
            check_pass "Port $port ($service) already in use by $process (PID: $pid)"
        else
            check_warn "Port $port ($service) occupied by $process (PID: $pid)" "Will be killed on startup"
        fi
        return 0
    else
        check_pass "Port $port ($service) available"
        return 1
    fi
}

# Critical ports (IF.TTT: if://agent/1/findings/ports)
check_port 8001 "Backend API" "false"
check_port 8080 "Frontend (Vite)" "false"
check_port 7700 "Meilisearch" "true"
check_port 6379 "Redis" "true"

# Check for port 8081 (Vite fallback - IF.TTT: if://agent/2/findings/port-fallback)
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    check_warn "Port 8081 occupied" "Vite may use port 8082+ as fallback"
fi

# ============================================================================
# CHECK 3: Node.js Version
# ============================================================================
section_header "NODE.JS VERSION"

NODE_VERSION=$(node --version 2>/dev/null || echo "NOT_INSTALLED")
REQUIRED_NODE="v20.19.5"

if [ "$NODE_VERSION" = "$REQUIRED_NODE" ]; then
    check_pass "Node.js version matches ($NODE_VERSION)"
elif [[ "$NODE_VERSION" == v20.* ]]; then
    check_warn "Node.js version mismatch" "Expected $REQUIRED_NODE, got $NODE_VERSION (minor version difference acceptable)"
else
    check_fail "Node.js version incompatible" "Expected $REQUIRED_NODE, got $NODE_VERSION"
fi

# ============================================================================
# CHECK 4: Database Exists and Accessible
# ============================================================================
section_header "DATABASE INTEGRITY"

DB_PATH="/home/setup/navidocs/server/db/navidocs.db"

if [ -f "$DB_PATH" ]; then
    DB_SIZE=$(ls -lh "$DB_PATH" | awk '{print $5}')
    DB_MODIFIED=$(stat -c %y "$DB_PATH" | cut -d' ' -f1)
    check_pass "Database file exists ($DB_SIZE)"
    echo "   Path: $DB_PATH"
    echo "   Size: $DB_SIZE"
    echo "   Modified: $DB_MODIFIED"
    echo "   IF.TTT: if://agent/3/findings/database-size"

    # Test SQLite accessibility
    if command -v sqlite3 &> /dev/null; then
        DOCUMENT_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM documents;" 2>/dev/null || echo "ERROR")
        if [ "$DOCUMENT_COUNT" != "ERROR" ]; then
            check_pass "Database readable ($DOCUMENT_COUNT documents)"
            echo "   IF.TTT: if://agent/3/findings/documents-count/$DOCUMENT_COUNT"
        else
            check_fail "Database not readable" "SQLite query failed"
        fi
    else
        check_warn "sqlite3 not installed" "Cannot verify database contents"
    fi
else
    check_fail "Database file missing" "Expected at $DB_PATH"
fi

# ============================================================================
# CHECK 5: Redis Connection
# ============================================================================
section_header "REDIS CONNECTIVITY"

if command -v redis-cli &> /dev/null; then
    REDIS_PING=$(redis-cli ping 2>/dev/null || echo "ERROR")
    if [ "$REDIS_PING" = "PONG" ]; then
        check_pass "Redis responding to ping"
        echo "   IF.TTT: if://agent/1/findings/redis-status"
    else
        check_fail "Redis not responding" "Start with: redis-server --daemonize yes"
    fi
else
    check_warn "redis-cli not installed" "Cannot verify Redis status"
fi

# ============================================================================
# CHECK 6: Meilisearch Status
# ============================================================================
section_header "MEILISEARCH CONNECTIVITY"

MEILI_HEALTH=$(curl -s http://localhost:7700/health 2>/dev/null || echo "ERROR")

if [[ "$MEILI_HEALTH" == *"available"* ]]; then
    check_pass "Meilisearch responding (status: available)"
    echo "   IF.TTT: if://agent/1/findings/meilisearch-status"

    # Check for index existence (IF.TTT: if://agent/5/findings/meilisearch-index-missing)
    MEILI_KEY="5T66jrwQ8F8cOk4dUlFY0Vp59fMnCsIfi4O6JZl9wzU="
    INDEX_CHECK=$(curl -s -H "Authorization: Bearer $MEILI_KEY" \
        "http://localhost:7700/indexes/navidocs-pages" 2>/dev/null | grep -o '"uid":"navidocs-pages"' || echo "")

    if [ -n "$INDEX_CHECK" ]; then
        check_pass "Meilisearch index 'navidocs-pages' exists"
    else
        check_warn "Meilisearch index 'navidocs-pages' missing" "Search functionality will fail until created"
        echo "   Create with: curl -X POST http://localhost:7700/indexes -H 'Authorization: Bearer $MEILI_KEY' -d '{\"uid\":\"navidocs-pages\"}'"
        echo "   IF.TTT: if://agent/5/findings/meilisearch-index-missing"
    fi
else
    check_fail "Meilisearch not responding" "Start with: docker start boat-manuals-meilisearch"
fi

# ============================================================================
# CHECK 7: Critical Dependencies
# ============================================================================
section_header "DEPENDENCIES CHECK"

cd /home/setup/navidocs/server || exit 1

# Check server node_modules
if [ -d "node_modules" ]; then
    MODULE_COUNT=$(ls -1 node_modules 2>/dev/null | wc -l)
    check_pass "Server dependencies installed ($MODULE_COUNT packages)"
else
    check_fail "Server node_modules missing" "Run: cd server && npm install"
fi

# Check client node_modules
cd /home/setup/navidocs/client || exit 1
if [ -d "node_modules" ]; then
    MODULE_COUNT=$(ls -1 node_modules 2>/dev/null | wc -l)
    check_pass "Client dependencies installed ($MODULE_COUNT packages)"
else
    check_fail "Client node_modules missing" "Run: cd client && npm install"
fi

# ============================================================================
# CHECK 8: Zombie Process Detection
# ============================================================================
section_header "ZOMBIE PROCESS CHECK"

cd /home/setup/navidocs || exit 1

# Check for existing NaviDocs processes
BACKEND_PROCS=$(pgrep -f "navidocs.*index.js" 2>/dev/null | wc -l)
FRONTEND_PROCS=$(pgrep -f "vite.*navidocs" 2>/dev/null | wc -l)
WORKER_PROCS=$(pgrep -f "ocr-worker.js" 2>/dev/null | wc -l)

if [ "$BACKEND_PROCS" -gt 0 ]; then
    check_warn "Backend process already running ($BACKEND_PROCS instances)" "Will be killed on startup"
    pgrep -af "navidocs.*index.js" | sed 's/^/   /'
fi

if [ "$FRONTEND_PROCS" -gt 0 ]; then
    check_warn "Frontend process already running ($FRONTEND_PROCS instances)" "Will be killed on startup"
    pgrep -af "vite.*navidocs" | sed 's/^/   /'
fi

if [ "$WORKER_PROCS" -gt 0 ]; then
    check_warn "OCR worker running ($WORKER_PROCS instances)" "Will be killed on startup"
fi

if [ "$BACKEND_PROCS" -eq 0 ] && [ "$FRONTEND_PROCS" -eq 0 ] && [ "$WORKER_PROCS" -eq 0 ]; then
    check_pass "No zombie NaviDocs processes detected"
fi

# ============================================================================
# CHECK 9: Log Files Accessible
# ============================================================================
section_header "LOG FILE ACCESSIBILITY"

# Ensure /tmp is writable
if [ -w /tmp ]; then
    check_pass "/tmp directory writable"
else
    check_fail "/tmp not writable" "Log files cannot be created"
fi

# Check for previous log files
BACKEND_LOG="/tmp/navidocs-backend.log"
FRONTEND_LOG="/tmp/navidocs-frontend.log"
WORKER_LOG="/tmp/navidocs-ocr-worker.log"

for log in "$BACKEND_LOG" "$FRONTEND_LOG" "$WORKER_LOG"; do
    if [ -f "$log" ]; then
        LOG_SIZE=$(ls -lh "$log" | awk '{print $5}')
        LOG_MODIFIED=$(stat -c %y "$log" | cut -d' ' -f1,2 | cut -d'.' -f1)
        check_pass "Previous log exists: $(basename $log) ($LOG_SIZE, modified $LOG_MODIFIED)"
    fi
done

# ============================================================================
# CHECK 10: Environment Variables
# ============================================================================
section_header "ENVIRONMENT CONFIGURATION"

cd /home/setup/navidocs/server || exit 1

# Check for .env file
if [ -f ".env" ]; then
    check_pass ".env file exists"

    # Check for critical settings (IF.TTT: if://agent/1/findings/settings-encryption-key)
    if grep -q "SETTINGS_ENCRYPTION_KEY=" .env 2>/dev/null; then
        KEY_VALUE=$(grep "SETTINGS_ENCRYPTION_KEY=" .env | cut -d'=' -f2 | tr -d ' "')
        if [ -n "$KEY_VALUE" ] && [ "$KEY_VALUE" != "your-32-byte-hex-key-here" ]; then
            check_pass "SETTINGS_ENCRYPTION_KEY configured"
        else
            check_warn "SETTINGS_ENCRYPTION_KEY not set" "Settings won't persist across restarts"
            echo "   Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
            echo "   IF.TTT: if://agent/1/findings/settings-encryption-key"
        fi
    else
        check_warn "SETTINGS_ENCRYPTION_KEY missing from .env" "Settings won't persist"
    fi
else
    check_warn ".env file missing" "Using default configuration"
fi

# ============================================================================
# CHECK 11: Docker Status (for Meilisearch)
# ============================================================================
section_header "DOCKER STATUS"

if command -v docker &> /dev/null; then
    check_pass "Docker installed"

    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        check_pass "Docker daemon running"

        # Check for Meilisearch container
        MEILI_CONTAINER=$(docker ps -a --filter "name=boat-manuals-meilisearch" --format "{{.Status}}" 2>/dev/null || echo "NOT_FOUND")
        if [[ "$MEILI_CONTAINER" == *"Up"* ]]; then
            check_pass "Meilisearch container running"
        elif [ "$MEILI_CONTAINER" != "NOT_FOUND" ]; then
            check_warn "Meilisearch container exists but stopped" "Will be started automatically"
            echo "   Status: $MEILI_CONTAINER"
        else
            check_warn "Meilisearch container not found" "Will be created on first start"
        fi
    else
        check_fail "Docker daemon not running" "Start Docker or run: sudo systemctl start docker"
    fi
else
    check_fail "Docker not installed" "Required for Meilisearch"
fi

# ============================================================================
# CHECK 12: Uploads Directory
# ============================================================================
section_header "UPLOADS DIRECTORY"

UPLOADS_DIR="/home/setup/navidocs/uploads"

if [ -d "$UPLOADS_DIR" ]; then
    UPLOADS_SIZE=$(du -sh "$UPLOADS_DIR" 2>/dev/null | cut -f1)
    UPLOADS_COUNT=$(find "$UPLOADS_DIR" -type f 2>/dev/null | wc -l)
    check_pass "Uploads directory exists ($UPLOADS_SIZE, $UPLOADS_COUNT files)"
    echo "   Path: $UPLOADS_DIR"
    echo "   IF.TTT: if://agent/5/findings/uploads-directory"
else
    check_warn "Uploads directory missing" "Will be created automatically"
fi

# Ensure uploads directory is writable
if [ -w "$UPLOADS_DIR" ] || [ -w "/home/setup/navidocs" ]; then
    check_pass "Uploads directory writable"
else
    check_fail "Uploads directory not writable" "Document upload will fail"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}📊 PRE-LAUNCH CHECKLIST SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ PASSED: $PASS${NC}"
echo -e "${YELLOW}⚠️  WARNINGS: $WARN${NC}"
echo -e "${RED}❌ FAILED: $FAIL${NC}"
echo ""
echo "Log file: $LOG_FILE"
echo "IF.TTT: if://test-run/navidocs/pre-launch/$(date +%Y%m%d-%H%M%S)"
echo ""

# Overall recommendation
if [ $FAIL -eq 0 ] && [ $WARN -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ READY TO LAUNCH${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "All checks passed! Safe to run: ./start-all.sh"
    exit 0
elif [ $FAIL -eq 0 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  READY WITH WARNINGS${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "System will work but some features may be degraded."
    echo "Review warnings above. Safe to run: ./start-all.sh"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ NOT READY - FIX FAILURES BEFORE LAUNCH${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Critical failures detected. DO NOT start services until resolved."
    echo "Review failures above and fix before running: ./start-all.sh"
    exit 1
fi
