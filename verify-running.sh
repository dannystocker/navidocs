#!/bin/bash

# NaviDocs Runtime Verification
# IF.TTT Citation: if://doc/navidocs/verify-running/v1.0
# Purpose: Verify all services are actually running and responding
# Created: 2025-11-13

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
MAX_WAIT=30  # seconds
BACKEND_URL="http://localhost:8001"
FRONTEND_URL="http://localhost:8080"
MEILI_URL="http://localhost:7700"

# Counters
PASS=0
FAIL=0
TOTAL_TIME=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}🔍 NaviDocs Runtime Verification${NC}"
echo -e "${CYAN}IF.TTT Citation: if://doc/navidocs/verify-running/v1.0${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Started: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "Max wait per check: ${MAX_WAIT}s"
echo ""

# Helper functions
check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    [ -n "$2" ] && echo "   Time: ${2}ms"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    echo -e "${RED}   → $2${NC}"
    ((FAIL++))
}

section_header() {
    echo ""
    echo -e "${BLUE}━━━ $1 ━━━${NC}"
}

# Time an HTTP request
time_request() {
    local url=$1
    local start=$(date +%s%3N)
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
    local end=$(date +%s%3N)
    local duration=$((end - start))
    echo "$response_code:$duration"
}

# Wait for service with retry
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=$3
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        local result=$(time_request "$url")
        local code=$(echo $result | cut -d: -f1)
        local time=$(echo $result | cut -d: -f2)

        if [ "$code" = "200" ] || [ "$code" = "304" ]; then
            check_pass "$service_name responding" "${time}"
            TOTAL_TIME=$((TOTAL_TIME + time))
            return 0
        fi

        echo -e "${YELLOW}   Attempt $attempt/$max_attempts: HTTP $code, waiting 2s...${NC}"
        sleep 2
        ((attempt++))
    done

    check_fail "$service_name not responding after ${max_attempts} attempts" "Last status: $code"
    return 1
}

# ============================================================================
# CHECK 1: Process Verification
# ============================================================================
section_header "PROCESS VERIFICATION"

# Backend
BACKEND_PID=$(pgrep -f "navidocs.*index.js" 2>/dev/null || echo "")
if [ -n "$BACKEND_PID" ]; then
    check_pass "Backend process running (PID: $BACKEND_PID)"
    echo "   IF.TTT: if://agent/1/findings/backend-pid"
else
    check_fail "Backend process not found" "Expected process: node index.js"
fi

# Frontend
FRONTEND_PID=$(pgrep -f "vite.*navidocs" 2>/dev/null || pgrep -f "node.*vite" 2>/dev/null || echo "")
if [ -n "$FRONTEND_PID" ]; then
    check_pass "Frontend process running (PID: $FRONTEND_PID)"
    echo "   IF.TTT: if://agent/2/findings/frontend-pid"
else
    check_fail "Frontend process not found" "Expected process: vite dev server"
fi

# OCR Worker
WORKER_PID=$(pgrep -f "ocr-worker.js" 2>/dev/null || echo "")
if [ -n "$WORKER_PID" ]; then
    check_pass "OCR worker running (PID: $WORKER_PID)"
else
    check_fail "OCR worker not found" "Document processing will not work"
fi

# Redis
REDIS_PID=$(pgrep redis-server 2>/dev/null || echo "")
if [ -n "$REDIS_PID" ]; then
    check_pass "Redis running (PID: $REDIS_PID)"
else
    check_fail "Redis process not found" "Required for job queue"
fi

# Meilisearch (Docker)
MEILI_CONTAINER=$(docker ps --filter "name=boat-manuals-meilisearch" --format "{{.Status}}" 2>/dev/null || echo "")
if [[ "$MEILI_CONTAINER" == *"Up"* ]]; then
    check_pass "Meilisearch container running ($MEILI_CONTAINER)"
else
    check_fail "Meilisearch container not running" "Search will not work"
fi

# ============================================================================
# CHECK 2: HTTP Endpoints
# ============================================================================
section_header "HTTP ENDPOINT VERIFICATION"

# Backend health check
echo "Testing: $BACKEND_URL/health"
if wait_for_service "$BACKEND_URL/health" "Backend /health" 5; then
    # Get health response
    HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health" 2>/dev/null)
    if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
        check_pass "Backend health check returns valid JSON"
        UPTIME=$(echo "$HEALTH_RESPONSE" | grep -o '"uptime":[0-9.]*' | cut -d: -f2 || echo "unknown")
        echo "   Uptime: ${UPTIME}s"
        echo "   IF.TTT: if://agent/1/findings/backend-health"
    else
        check_fail "Backend health check invalid response" "Got: $HEALTH_RESPONSE"
    fi
fi

# Frontend (main page)
echo ""
echo "Testing: $FRONTEND_URL/"
if wait_for_service "$FRONTEND_URL/" "Frontend main page" 5; then
    # Check for Vue app div
    if curl -s "$FRONTEND_URL/" 2>/dev/null | grep -q '<div id="app">'; then
        check_pass "Frontend returns valid Vue app HTML"
        echo "   IF.TTT: if://agent/2/findings/frontend-html"
    else
        check_fail "Frontend HTML missing Vue app mount point" "Expected: <div id=\"app\">"
    fi
fi

# Meilisearch
echo ""
echo "Testing: $MEILI_URL/health"
if wait_for_service "$MEILI_URL/health" "Meilisearch /health" 3; then
    MEILI_RESPONSE=$(curl -s "$MEILI_URL/health" 2>/dev/null)
    if echo "$MEILI_RESPONSE" | grep -q '"status":"available"'; then
        check_pass "Meilisearch reports available status"
        echo "   IF.TTT: if://agent/1/findings/meilisearch-health"
    fi
fi

# ============================================================================
# CHECK 3: API Functionality
# ============================================================================
section_header "API FUNCTIONALITY TESTS"

# Test documents endpoint
echo "Testing: $BACKEND_URL/api/documents"
result=$(time_request "$BACKEND_URL/api/documents")
code=$(echo $result | cut -d: -f1)
time=$(echo $result | cut -d: -f2)

if [ "$code" = "200" ]; then
    check_pass "Documents API responding" "${time}"

    # Parse document count
    DOC_COUNT=$(curl -s "$BACKEND_URL/api/documents" 2>/dev/null | grep -o '"total":[0-9]*' | cut -d: -f2 || echo "unknown")
    echo "   Documents: $DOC_COUNT"
    echo "   IF.TTT: if://agent/1/findings/documents-api"
    TOTAL_TIME=$((TOTAL_TIME + time))
else
    check_fail "Documents API not responding" "HTTP $code"
fi

# Test search health
echo ""
echo "Testing: $BACKEND_URL/api/search/health"
result=$(time_request "$BACKEND_URL/api/search/health")
code=$(echo $result | cut -d: -f1)
time=$(echo $result | cut -d: -f2)

if [ "$code" = "200" ]; then
    check_pass "Search API responding" "${time}"
    echo "   IF.TTT: if://agent/1/findings/search-api"
    TOTAL_TIME=$((TOTAL_TIME + time))
else
    check_fail "Search API not responding" "HTTP $code"
fi

# ============================================================================
# CHECK 4: Redis Connectivity
# ============================================================================
section_header "REDIS CONNECTIVITY"

if command -v redis-cli &> /dev/null; then
    REDIS_PING=$(timeout 3 redis-cli ping 2>/dev/null || echo "ERROR")
    if [ "$REDIS_PING" = "PONG" ]; then
        check_pass "Redis responding to ping"

        # Check queue length
        QUEUE_LENGTH=$(redis-cli llen "bull:ocr-queue:wait" 2>/dev/null || echo "unknown")
        echo "   OCR queue length: $QUEUE_LENGTH jobs"
        echo "   IF.TTT: if://agent/1/findings/redis-ping"
    else
        check_fail "Redis not responding" "Cannot reach Redis server"
    fi
else
    check_fail "redis-cli not installed" "Cannot verify Redis connectivity"
fi

# ============================================================================
# CHECK 5: Database Access
# ============================================================================
section_header "DATABASE ACCESSIBILITY"

DB_PATH="/home/setup/navidocs/server/db/navidocs.db"

if [ -f "$DB_PATH" ]; then
    check_pass "Database file exists"

    if command -v sqlite3 &> /dev/null; then
        # Quick query to verify database is not locked
        DOC_COUNT=$(timeout 3 sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM documents;" 2>/dev/null || echo "ERROR")
        if [ "$DOC_COUNT" != "ERROR" ]; then
            check_pass "Database readable ($DOC_COUNT documents)"
            echo "   IF.TTT: if://agent/3/findings/database-query"
        else
            check_fail "Database locked or corrupted" "Cannot query documents table"
        fi
    fi
else
    check_fail "Database file missing" "Expected: $DB_PATH"
fi

# ============================================================================
# CHECK 6: E2E Smoke Test
# ============================================================================
section_header "END-TO-END SMOKE TEST"

echo "Attempting quick document creation flow..."

# Step 1: Create test document via API
TEST_DOC_ID=""
if [ -f "/home/setup/navidocs/test-manual.pdf" ]; then
    echo "   1. Uploading test document..."
    UPLOAD_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/upload" \
        -F "file=@/home/setup/navidocs/test-manual.pdf" \
        -F "title=Verify-Running Test Doc" \
        -F "documentType=owner-manual" \
        -F "organizationId=test-org-id" 2>/dev/null || echo "ERROR")

    if echo "$UPLOAD_RESPONSE" | grep -q '"documentId"'; then
        TEST_DOC_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"documentId":"[^"]*"' | cut -d'"' -f4)
        check_pass "Document upload successful (ID: $TEST_DOC_ID)"
        echo "   IF.TTT: if://agent/5/findings/upload-success"

        # Step 2: Wait for OCR processing (max 10s)
        echo "   2. Waiting for OCR processing (max 10s)..."
        sleep 3

        for i in {1..7}; do
            DOC_STATUS=$(curl -s "$BACKEND_URL/api/documents/$TEST_DOC_ID" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
            if [ "$DOC_STATUS" = "indexed" ]; then
                check_pass "OCR processing completed (status: indexed)"
                echo "   IF.TTT: if://agent/5/findings/ocr-complete"
                break
            else
                echo "      Status: $DOC_STATUS, waiting..."
                sleep 1
            fi
        done

        # Step 3: Verify document is retrievable
        echo "   3. Verifying document retrieval..."
        result=$(time_request "$BACKEND_URL/api/documents/$TEST_DOC_ID")
        code=$(echo $result | cut -d: -f1)
        if [ "$code" = "200" ]; then
            check_pass "Document retrieval working"
        else
            check_fail "Document retrieval failed" "HTTP $code"
        fi
    else
        check_fail "Document upload failed" "Response: $UPLOAD_RESPONSE"
    fi
else
    echo "   Skipping: test-manual.pdf not found"
fi

# ============================================================================
# CHECK 7: Log File Activity
# ============================================================================
section_header "LOG FILE MONITORING"

check_log() {
    local log_file=$1
    local service_name=$2

    if [ -f "$log_file" ]; then
        local size=$(ls -lh "$log_file" | awk '{print $5}')
        local last_modified=$(stat -c %Y "$log_file")
        local now=$(date +%s)
        local age=$((now - last_modified))

        if [ $age -lt 60 ]; then
            check_pass "$service_name log active ($size, ${age}s old)"
        else
            check_fail "$service_name log stale" "Last modified ${age}s ago (may be frozen)"
        fi
    else
        check_fail "$service_name log missing" "Expected: $log_file"
    fi
}

check_log "/tmp/navidocs-backend.log" "Backend"
check_log "/tmp/navidocs-frontend.log" "Frontend"
check_log "/tmp/navidocs-ocr-worker.log" "OCR Worker"

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}📊 RUNTIME VERIFICATION SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ PASSED: $PASS${NC}"
echo -e "${RED}❌ FAILED: $FAIL${NC}"
echo ""
echo "Total API response time: ${TOTAL_TIME}ms"
echo "IF.TTT: if://test-run/navidocs/verify-running/$(date +%Y%m%d-%H%M%S)"
echo ""

# Overall result
if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ ALL SYSTEMS OPERATIONAL${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "NaviDocs is ready for demo/presentation!"
    echo ""
    echo "Access URLs:"
    echo "  Frontend: $FRONTEND_URL"
    echo "  Backend:  $BACKEND_URL"
    echo "  API Docs: $BACKEND_URL/health"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ SYSTEM NOT READY${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Critical failures detected. Review errors above."
    echo "Check logs:"
    echo "  tail -100 /tmp/navidocs-backend.log"
    echo "  tail -100 /tmp/navidocs-frontend.log"
    echo "  tail -100 /tmp/navidocs-ocr-worker.log"
    exit 1
fi
