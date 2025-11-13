#!/bin/bash

# NaviDocs Version Verification
# IF.TTT Citation: if://doc/navidocs/version-check/v1.0
# Purpose: Verify exactly which version is running
# Created: 2025-11-13

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}🔍 NaviDocs Version Verification${NC}"
echo -e "${CYAN}IF.TTT Citation: if://doc/navidocs/version-check/v1.0${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

cd /home/setup/navidocs || exit 1

# ============================================================================
# GIT VERSION
# ============================================================================
echo -e "${BLUE}━━━ GIT REPOSITORY VERSION ━━━${NC}"
echo ""

if [ -d ".git" ]; then
    GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null)
    GIT_COMMIT_SHORT=$(git rev-parse --short HEAD 2>/dev/null)
    GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
    GIT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "No tag")
    GIT_AUTHOR=$(git log -1 --format='%an <%ae>' 2>/dev/null)
    GIT_DATE=$(git log -1 --format='%ai' 2>/dev/null)
    GIT_MESSAGE=$(git log -1 --format='%s' 2>/dev/null)

    echo -e "${GREEN}✅ Git repository detected${NC}"
    echo ""
    echo "  Commit:  $GIT_COMMIT_SHORT ($GIT_COMMIT)"
    echo "  Branch:  $GIT_BRANCH"
    echo "  Tag:     $GIT_TAG"
    echo "  Author:  $GIT_AUTHOR"
    echo "  Date:    $GIT_DATE"
    echo "  Message: $GIT_MESSAGE"
    echo ""
    echo "  IF.TTT: if://git/navidocs/commit/$GIT_COMMIT"

    # Check for uncommitted changes
    if git diff --quiet && git diff --cached --quiet; then
        echo -e "  ${GREEN}✅ Working tree clean${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Uncommitted changes detected${NC}"
        echo ""
        echo "  Modified files:"
        git status --short | sed 's/^/    /'
    fi

    # Show recent commits
    echo ""
    echo -e "${BLUE}Recent commits:${NC}"
    git log --oneline -5 | sed 's/^/  /'
else
    echo -e "${YELLOW}⚠️  Not a git repository${NC}"
fi

# ============================================================================
# NODE.JS VERSION
# ============================================================================
echo ""
echo -e "${BLUE}━━━ NODE.JS ENVIRONMENT ━━━${NC}"
echo ""

NODE_VERSION=$(node --version 2>/dev/null || echo "NOT_INSTALLED")
NPM_VERSION=$(npm --version 2>/dev/null || echo "NOT_INSTALLED")
NODE_PATH=$(which node 2>/dev/null || echo "NOT_FOUND")

echo "  Node.js: $NODE_VERSION"
echo "  npm:     $NPM_VERSION"
echo "  Path:    $NODE_PATH"
echo ""

REQUIRED_NODE="v20.19.5"
if [ "$NODE_VERSION" = "$REQUIRED_NODE" ]; then
    echo -e "  ${GREEN}✅ Node.js version matches requirement ($REQUIRED_NODE)${NC}"
elif [[ "$NODE_VERSION" == v20.* ]]; then
    echo -e "  ${YELLOW}⚠️  Node.js minor version mismatch (expected $REQUIRED_NODE, got $NODE_VERSION)${NC}"
else
    echo -e "  ${RED}❌ Node.js version incompatible (expected $REQUIRED_NODE, got $NODE_VERSION)${NC}"
fi

# ============================================================================
# PACKAGE.JSON VERSIONS
# ============================================================================
echo ""
echo -e "${BLUE}━━━ PACKAGE.JSON VERSIONS ━━━${NC}"
echo ""

# Server package.json
if [ -f "server/package.json" ]; then
    SERVER_VERSION=$(grep '"version"' server/package.json | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}Server:${NC} v$SERVER_VERSION"
    echo "  File: /home/setup/navidocs/server/package.json"

    # Key dependencies
    echo ""
    echo "  Key Dependencies:"
    grep -E '"express"|"sqlite3"|"bullmq"|"meilisearch"|"ioredis"' server/package.json | sed 's/^/    /'
else
    echo -e "${RED}❌ server/package.json not found${NC}"
fi

echo ""

# Client package.json
if [ -f "client/package.json" ]; then
    CLIENT_VERSION=$(grep '"version"' client/package.json | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}Client:${NC} v$CLIENT_VERSION"
    echo "  File: /home/setup/navidocs/client/package.json"

    # Key dependencies
    echo ""
    echo "  Key Dependencies:"
    grep -E '"vue"|"vite"|"pinia"|"vue-router"' client/package.json | sed 's/^/    /'
else
    echo -e "${RED}❌ client/package.json not found${NC}"
fi

# ============================================================================
# DATABASE SCHEMA VERSION
# ============================================================================
echo ""
echo -e "${BLUE}━━━ DATABASE SCHEMA ━━━${NC}"
echo ""

DB_PATH="/home/setup/navidocs/server/db/navidocs.db"

if [ -f "$DB_PATH" ]; then
    DB_SIZE=$(ls -lh "$DB_PATH" | awk '{print $5}')
    DB_MODIFIED=$(stat -c %y "$DB_PATH" | cut -d' ' -f1,2 | cut -d'.' -f1)

    echo "  Path:     $DB_PATH"
    echo "  Size:     $DB_SIZE"
    echo "  Modified: $DB_MODIFIED"
    echo ""

    if command -v sqlite3 &> /dev/null; then
        # Table count
        TABLE_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "ERROR")
        echo "  Tables:   $TABLE_COUNT"

        # Schema version (if exists)
        SCHEMA_VERSION=$(sqlite3 "$DB_PATH" "SELECT value FROM system_settings WHERE key='schema_version';" 2>/dev/null || echo "Not set")
        echo "  Schema:   $SCHEMA_VERSION"

        # Recent schema changes
        echo ""
        echo "  Table List:"
        sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>/dev/null | sed 's/^/    /' || echo "    Error reading tables"
    else
        echo -e "  ${YELLOW}⚠️  sqlite3 not installed, cannot inspect schema${NC}"
    fi
else
    echo -e "${RED}❌ Database file not found: $DB_PATH${NC}"
fi

# ============================================================================
# MEILISEARCH VERSION
# ============================================================================
echo ""
echo -e "${BLUE}━━━ MEILISEARCH VERSION ━━━${NC}"
echo ""

MEILI_VERSION=$(docker exec boat-manuals-meilisearch meilisearch --version 2>/dev/null | head -1 || echo "ERROR")

if [ "$MEILI_VERSION" != "ERROR" ]; then
    echo "  Version: $MEILI_VERSION"
    echo "  Container: boat-manuals-meilisearch"
    echo ""

    # Meilisearch stats
    MEILI_HEALTH=$(curl -s http://localhost:7700/health 2>/dev/null || echo "ERROR")
    if [[ "$MEILI_HEALTH" == *"available"* ]]; then
        echo -e "  ${GREEN}✅ Meilisearch responding${NC}"

        # Get version via API
        MEILI_API_VERSION=$(curl -s http://localhost:7700/version 2>/dev/null | grep -o '"pkgVersion":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
        echo "  API Version: $MEILI_API_VERSION"
        echo "  Expected: v1.6.x"

        if [[ "$MEILI_API_VERSION" == 1.6.* ]]; then
            echo -e "  ${GREEN}✅ Version compatible${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Version may be incompatible${NC}"
        fi
    else
        echo -e "  ${RED}❌ Meilisearch not responding${NC}"
    fi
else
    echo -e "${RED}❌ Meilisearch container not found or not running${NC}"
fi

# ============================================================================
# REDIS VERSION
# ============================================================================
echo ""
echo -e "${BLUE}━━━ REDIS VERSION ━━━${NC}"
echo ""

if command -v redis-cli &> /dev/null; then
    REDIS_VERSION=$(redis-cli --version 2>/dev/null | cut -d' ' -f2 || echo "unknown")
    echo "  CLI Version: $REDIS_VERSION"

    REDIS_PING=$(redis-cli ping 2>/dev/null || echo "ERROR")
    if [ "$REDIS_PING" = "PONG" ]; then
        echo -e "  ${GREEN}✅ Redis responding${NC}"

        # Get server version
        REDIS_SERVER_VERSION=$(redis-cli info server 2>/dev/null | grep "redis_version:" | cut -d: -f2 | tr -d '\r' || echo "unknown")
        echo "  Server Version: $REDIS_SERVER_VERSION"
    else
        echo -e "  ${RED}❌ Redis not responding${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  redis-cli not installed${NC}"
fi

# ============================================================================
# RUNNING SERVICES VERSION CHECK
# ============================================================================
echo ""
echo -e "${BLUE}━━━ RUNNING SERVICES ━━━${NC}"
echo ""

# Backend process
BACKEND_PID=$(pgrep -f "navidocs.*index.js" 2>/dev/null || echo "")
if [ -n "$BACKEND_PID" ]; then
    BACKEND_START=$(ps -p $BACKEND_PID -o lstart= 2>/dev/null || echo "unknown")
    BACKEND_UPTIME=$(ps -p $BACKEND_PID -o etime= 2>/dev/null | xargs || echo "unknown")

    echo -e "${GREEN}✅ Backend API${NC}"
    echo "  PID:     $BACKEND_PID"
    echo "  Started: $BACKEND_START"
    echo "  Uptime:  $BACKEND_UPTIME"
    echo "  Command: $(ps -p $BACKEND_PID -o cmd= | head -c 80)"
    echo ""

    # Check backend version via API
    BACKEND_HEALTH=$(curl -s http://localhost:8001/health 2>/dev/null || echo "ERROR")
    if [[ "$BACKEND_HEALTH" == *"ok"* ]]; then
        API_UPTIME=$(echo "$BACKEND_HEALTH" | grep -o '"uptime":[0-9.]*' | cut -d: -f2 || echo "unknown")
        echo "  API Health: OK (uptime: ${API_UPTIME}s)"
    else
        echo -e "  ${RED}API Health: ERROR${NC}"
    fi
else
    echo -e "${RED}❌ Backend API not running${NC}"
fi

echo ""

# Frontend process
FRONTEND_PID=$(pgrep -f "vite.*navidocs" 2>/dev/null || pgrep -f "node.*vite" 2>/dev/null || echo "")
if [ -n "$FRONTEND_PID" ]; then
    FRONTEND_START=$(ps -p $FRONTEND_PID -o lstart= 2>/dev/null || echo "unknown")
    FRONTEND_UPTIME=$(ps -p $FRONTEND_PID -o etime= 2>/dev/null | xargs || echo "unknown")

    echo -e "${GREEN}✅ Frontend (Vite)${NC}"
    echo "  PID:     $FRONTEND_PID"
    echo "  Started: $FRONTEND_START"
    echo "  Uptime:  $FRONTEND_UPTIME"
    echo ""

    # Check which port Vite is using
    VITE_PORT=$(lsof -Pan -p $FRONTEND_PID -iTCP -sTCP:LISTEN 2>/dev/null | grep -o ':[0-9]*' | head -1 | tr -d ':' || echo "unknown")
    echo "  Listening: http://localhost:$VITE_PORT"
else
    echo -e "${RED}❌ Frontend (Vite) not running${NC}"
fi

# ============================================================================
# BUILD ARTIFACTS
# ============================================================================
echo ""
echo -e "${BLUE}━━━ BUILD ARTIFACTS ━━━${NC}"
echo ""

# Check for node_modules
SERVER_MODULES=$([ -d "server/node_modules" ] && echo "✅ Installed" || echo "❌ Missing")
CLIENT_MODULES=$([ -d "client/node_modules" ] && echo "✅ Installed" || echo "❌ Missing")

echo "  Server node_modules: $SERVER_MODULES"
if [ -d "server/node_modules" ]; then
    MODULE_COUNT=$(ls -1 server/node_modules 2>/dev/null | wc -l)
    MODULE_SIZE=$(du -sh server/node_modules 2>/dev/null | cut -f1)
    echo "    Packages: $MODULE_COUNT"
    echo "    Size:     $MODULE_SIZE"
fi

echo ""
echo "  Client node_modules: $CLIENT_MODULES"
if [ -d "client/node_modules" ]; then
    MODULE_COUNT=$(ls -1 client/node_modules 2>/dev/null | wc -l)
    MODULE_SIZE=$(du -sh client/node_modules 2>/dev/null | cut -f1)
    echo "    Packages: $MODULE_COUNT"
    echo "    Size:     $MODULE_SIZE"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}📊 VERSION CHECK SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create version fingerprint
FINGERPRINT="NaviDocs"
[ -n "$GIT_COMMIT_SHORT" ] && FINGERPRINT="$FINGERPRINT@$GIT_COMMIT_SHORT"
[ -n "$SERVER_VERSION" ] && FINGERPRINT="$FINGERPRINT (server:$SERVER_VERSION"
[ -n "$CLIENT_VERSION" ] && FINGERPRINT="$FINGERPRINT, client:$CLIENT_VERSION)"

echo "Version Fingerprint: $FINGERPRINT"
echo "Node.js:             $NODE_VERSION"
echo "Database:            $DB_SIZE ($TABLE_COUNT tables)"
echo "Meilisearch:         $MEILI_API_VERSION"
echo "Redis:               $REDIS_SERVER_VERSION"
echo ""
echo "IF.TTT: if://version/navidocs/fingerprint/$(echo $FINGERPRINT | md5sum | cut -d' ' -f1)"
echo ""
echo "Report generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
