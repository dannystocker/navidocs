#!/bin/bash

# NaviDocs Debug Log Aggregator
# IF.TTT Citation: if://doc/navidocs/debug-logs/v1.0
# Purpose: Single consolidated view of all logs for rapid debugging
# Created: 2025-11-13

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Default lines to show
LINES=${1:-100}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}🔍 NaviDocs Debug Log Aggregator${NC}"
echo -e "${CYAN}IF.TTT Citation: if://doc/navidocs/debug-logs/v1.0${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Showing last ${LINES} lines from each log"
echo "Generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""
echo "Usage: $0 [lines] (default: 100)"
echo ""

# Helper function to show log section
show_log() {
    local log_file=$1
    local service_name=$2
    local color=$3
    local lines=$4

    echo ""
    echo -e "${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${color}📄 $service_name${NC}"
    echo -e "${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if [ -f "$log_file" ]; then
        local size=$(ls -lh "$log_file" | awk '{print $5}')
        local modified=$(stat -c %y "$log_file" | cut -d' ' -f1,2 | cut -d'.' -f1)
        local total_lines=$(wc -l < "$log_file" 2>/dev/null || echo "0")

        echo -e "${color}File: $log_file${NC}"
        echo -e "${color}Size: $size | Lines: $total_lines | Modified: $modified${NC}"
        echo -e "${color}IF.TTT: if://log/navidocs/$(basename $log_file .log)/$(date +%Y%m%d)${NC}"
        echo ""

        # Show last N lines with syntax highlighting
        tail -${lines} "$log_file" | while IFS= read -r line; do
            # Highlight errors in red
            if echo "$line" | grep -iq "error\|fail\|exception\|critical"; then
                echo -e "${RED}$line${NC}"
            # Highlight warnings in yellow
            elif echo "$line" | grep -iq "warn\|warning"; then
                echo -e "${YELLOW}$line${NC}"
            # Highlight success in green
            elif echo "$line" | grep -iq "success\|complete\|ready\|✅\|started"; then
                echo -e "${GREEN}$line${NC}"
            # Highlight HTTP requests in cyan
            elif echo "$line" | grep -q "GET\|POST\|PUT\|DELETE\|PATCH"; then
                echo -e "${CYAN}$line${NC}"
            # Normal lines
            else
                echo "$line"
            fi
        done
    else
        echo -e "${RED}❌ Log file not found: $log_file${NC}"
        echo -e "${YELLOW}Service may not be running or hasn't created log yet${NC}"
    fi
}

# ============================================================================
# SYSTEM RESOURCE USAGE
# ============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}💻 SYSTEM RESOURCE USAGE${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Memory usage
echo -e "${BLUE}Memory Usage:${NC}"
free -h | grep -E "Mem|Swap" | while read line; do
    echo "  $line"
done
echo ""

# Disk usage
echo -e "${BLUE}Disk Usage (/home/setup/navidocs):${NC}"
du -sh /home/setup/navidocs/{server,client,uploads} 2>/dev/null | column -t | sed 's/^/  /'
echo ""

# Process CPU/Memory
echo -e "${BLUE}NaviDocs Process Resource Usage:${NC}"
ps aux | grep -E "PID|navidocs.*index.js|vite|ocr-worker|redis-server|meilisearch" | grep -v grep | awk '{printf "  %-8s %-6s %-6s %s\n", $1, $3"%", $4"%", $11}' | head -10
echo ""

# ============================================================================
# PROCESS STATUS
# ============================================================================
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}⚙️  PROCESS STATUS${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

check_process() {
    local pattern=$1
    local name=$2
    local pid=$(pgrep -f "$pattern" 2>/dev/null || echo "")

    if [ -n "$pid" ]; then
        local uptime=$(ps -p $pid -o etime= 2>/dev/null | xargs)
        echo -e "${GREEN}✅ $name${NC} (PID: $pid, Uptime: $uptime)"
    else
        echo -e "${RED}❌ $name${NC} (Not running)"
    fi
}

check_process "navidocs.*index.js" "Backend API"
check_process "vite.*navidocs" "Frontend (Vite)"
check_process "ocr-worker.js" "OCR Worker"
check_process "redis-server" "Redis"

# Docker Meilisearch
MEILI_STATUS=$(docker ps --filter "name=boat-manuals-meilisearch" --format "{{.Status}}" 2>/dev/null || echo "Not running")
if [[ "$MEILI_STATUS" == *"Up"* ]]; then
    echo -e "${GREEN}✅ Meilisearch (Docker)${NC} ($MEILI_STATUS)"
else
    echo -e "${RED}❌ Meilisearch (Docker)${NC} ($MEILI_STATUS)"
fi

# ============================================================================
# PORT USAGE
# ============================================================================
echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}🔌 PORT USAGE${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

check_port() {
    local port=$1
    local service=$2

    if lsof -Pi :${port} -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -Pi :${port} -sTCP:LISTEN -t)
        local process=$(ps -p $pid -o comm= 2>/dev/null | head -1 || echo "unknown")
        echo -e "${GREEN}✅ Port $port${NC} ($service) - PID $pid ($process)"
    else
        echo -e "${RED}❌ Port $port${NC} ($service) - Not listening"
    fi
}

check_port 8001 "Backend API"
check_port 8080 "Frontend (Vite primary)"
check_port 8081 "Frontend (Vite fallback)"
check_port 7700 "Meilisearch"
check_port 6379 "Redis"

# ============================================================================
# REDIS STATUS
# ============================================================================
echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}📊 REDIS QUEUE STATUS${NC}"
echo -e "${MAGENTA}IF.TTT: if://agent/1/findings/redis-status${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if command -v redis-cli &> /dev/null; then
    REDIS_PING=$(redis-cli ping 2>/dev/null || echo "ERROR")
    if [ "$REDIS_PING" = "PONG" ]; then
        echo -e "${GREEN}✅ Redis responding to ping${NC}"
        echo ""

        # Queue statistics
        echo -e "${BLUE}OCR Queue Statistics:${NC}"
        WAITING=$(redis-cli llen "bull:ocr-queue:wait" 2>/dev/null || echo "0")
        ACTIVE=$(redis-cli llen "bull:ocr-queue:active" 2>/dev/null || echo "0")
        COMPLETED=$(redis-cli llen "bull:ocr-queue:completed" 2>/dev/null || echo "0")
        FAILED=$(redis-cli llen "bull:ocr-queue:failed" 2>/dev/null || echo "0")

        echo "  Waiting:   $WAITING jobs"
        echo "  Active:    $ACTIVE jobs"
        echo "  Completed: $COMPLETED jobs"
        echo "  Failed:    $FAILED jobs"

        # Database info
        echo ""
        echo -e "${BLUE}Redis Database Info:${NC}"
        redis-cli info stats 2>/dev/null | grep -E "total_connections_received|total_commands_processed|instantaneous_ops_per_sec" | sed 's/^/  /'
    else
        echo -e "${RED}❌ Redis not responding${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  redis-cli not installed${NC}"
fi

# ============================================================================
# MEILISEARCH STATUS
# ============================================================================
echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}🔍 MEILISEARCH STATUS${NC}"
echo -e "${MAGENTA}IF.TTT: if://agent/1/findings/meilisearch-status${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

MEILI_HEALTH=$(curl -s http://localhost:7700/health 2>/dev/null || echo "ERROR")
if [[ "$MEILI_HEALTH" == *"available"* ]]; then
    echo -e "${GREEN}✅ Meilisearch responding (status: available)${NC}"
    echo ""

    # Index statistics
    MEILI_KEY="5T66jrwQ8F8cOk4dUlFY0Vp59fMnCsIfi4O6JZl9wzU="
    echo -e "${BLUE}Index Statistics:${NC}"

    INDEX_STATS=$(curl -s -H "Authorization: Bearer $MEILI_KEY" \
        "http://localhost:7700/indexes/navidocs-pages/stats" 2>/dev/null || echo "{}")

    if echo "$INDEX_STATS" | grep -q "numberOfDocuments"; then
        DOC_COUNT=$(echo "$INDEX_STATS" | grep -o '"numberOfDocuments":[0-9]*' | cut -d: -f2 || echo "0")
        echo "  Documents indexed: $DOC_COUNT"
        echo "  Index: navidocs-pages"
    else
        echo -e "${YELLOW}  ⚠️  Index 'navidocs-pages' not found${NC}"
        echo "  IF.TTT: if://agent/5/findings/meilisearch-index-missing"
    fi
else
    echo -e "${RED}❌ Meilisearch not responding${NC}"
fi

# ============================================================================
# DATABASE STATISTICS
# ============================================================================
echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}🗄️  DATABASE STATISTICS${NC}"
echo -e "${MAGENTA}IF.TTT: if://agent/3/findings/database-size${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

DB_PATH="/home/setup/navidocs/server/db/navidocs.db"

if [ -f "$DB_PATH" ]; then
    DB_SIZE=$(ls -lh "$DB_PATH" | awk '{print $5}')
    DB_MODIFIED=$(stat -c %y "$DB_PATH" | cut -d' ' -f1,2 | cut -d'.' -f1)

    echo -e "${GREEN}✅ Database file exists${NC}"
    echo "  Path: $DB_PATH"
    echo "  Size: $DB_SIZE"
    echo "  Modified: $DB_MODIFIED"
    echo ""

    if command -v sqlite3 &> /dev/null; then
        echo -e "${BLUE}Record Counts:${NC}"
        sqlite3 "$DB_PATH" <<EOF 2>/dev/null | sed 's/^/  /' || echo "  Error querying database"
SELECT 'Documents:     ' || COUNT(*) FROM documents;
SELECT 'Document Pages:' || COUNT(*) FROM document_pages;
SELECT 'Organizations: ' || COUNT(*) FROM organizations;
SELECT 'Users:         ' || COUNT(*) FROM users;
SELECT 'OCR Jobs:      ' || COUNT(*) FROM ocr_jobs;
EOF
    fi
else
    echo -e "${RED}❌ Database file not found${NC}"
fi

# ============================================================================
# SERVICE LOGS
# ============================================================================

show_log "/tmp/navidocs-backend.log" "BACKEND API LOG" "${BLUE}" "$LINES"
show_log "/tmp/navidocs-frontend.log" "FRONTEND (VITE) LOG" "${CYAN}" "$LINES"
show_log "/tmp/navidocs-ocr-worker.log" "OCR WORKER LOG" "${GREEN}" "$LINES"

# ============================================================================
# ERROR SUMMARY
# ============================================================================
echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}🚨 ERROR SUMMARY (Last 20)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Aggregate all errors from all logs
{
    [ -f /tmp/navidocs-backend.log ] && grep -i "error\|exception\|fail" /tmp/navidocs-backend.log | tail -20 | sed 's/^/[BACKEND] /'
    [ -f /tmp/navidocs-frontend.log ] && grep -i "error\|exception\|fail" /tmp/navidocs-frontend.log | tail -20 | sed 's/^/[FRONTEND] /'
    [ -f /tmp/navidocs-ocr-worker.log ] && grep -i "error\|exception\|fail" /tmp/navidocs-ocr-worker.log | tail -20 | sed 's/^/[WORKER] /'
} 2>/dev/null | tail -20 | while IFS= read -r line; do
    echo -e "${RED}$line${NC}"
done || echo "No errors found in logs"

# ============================================================================
# FOOTER
# ============================================================================
echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📝 Log aggregation complete${NC}"
echo -e "${CYAN}Generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')${NC}"
echo -e "${CYAN}IF.TTT: if://test-run/navidocs/debug-logs/$(date +%Y%m%d-%H%M%S)${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Useful commands:"
echo "  Follow backend:  tail -f /tmp/navidocs-backend.log"
echo "  Follow frontend: tail -f /tmp/navidocs-frontend.log"
echo "  Follow worker:   tail -f /tmp/navidocs-ocr-worker.log"
echo "  View all:        tail -f /tmp/navidocs-*.log"
echo ""
