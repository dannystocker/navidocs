#!/bin/bash

# NaviDocs - Start All Services
# This script starts the complete NaviDocs stack

set -e

echo "🚀 Starting NaviDocs Complete Stack..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to project directory
cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"

echo -e "${BLUE}📁 Project directory: ${PROJECT_DIR}${NC}"
echo ""

# Check if services are already running
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :${port} -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  Port ${port} (${service}) is already in use${NC}"
        return 0
    else
        return 1
    fi
}

# 1. Check Redis
echo -e "${BLUE}1️⃣  Checking Redis (port 6379)...${NC}"
if check_port 6379 "Redis"; then
    echo -e "${GREEN}✅ Redis already running${NC}"
else
    echo "Starting Redis..."
    redis-server --daemonize yes
    sleep 1
    echo -e "${GREEN}✅ Redis started${NC}"
fi
echo ""

# 2. Check Meilisearch
echo -e "${BLUE}2️⃣  Checking Meilisearch (port 7700)...${NC}"
if check_port 7700 "Meilisearch"; then
    echo -e "${GREEN}✅ Meilisearch already running${NC}"
else
    echo "Starting Meilisearch (Docker)..."
    docker start boat-manuals-meilisearch 2>/dev/null || \
    docker run -d \
      --name boat-manuals-meilisearch \
      -p 7700:7700 \
      -e MEILI_MASTER_KEY='5T66jrwQ8F8cOk4dUlFY0Vp59fMnCsIfi4O6JZl9wzU=' \
      -e MEILI_ENV=development \
      -e MEILI_NO_ANALYTICS=true \
      -v meilisearch_data:/meili_data \
      getmeili/meilisearch:v1.6
    sleep 2
    echo -e "${GREEN}✅ Meilisearch started${NC}"
fi
echo ""

# 3. Start Backend API
echo -e "${BLUE}3️⃣  Checking Backend API (port 8001)...${NC}"
if check_port 8001 "Backend"; then
    echo -e "${YELLOW}⚠️  Killing existing backend...${NC}"
    pkill -f "node.*navidocs.*index.js" || true
    sleep 1
fi

echo "Starting Backend API..."
cd "${PROJECT_DIR}/server"
node index.js > /tmp/navidocs-backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend API started (PID: $BACKEND_PID)${NC}"
    echo "   Logs: /tmp/navidocs-backend.log"
else
    echo -e "${YELLOW}❌ Backend failed to start. Check logs:${NC}"
    cat /tmp/navidocs-backend.log
    exit 1
fi
echo ""

# 4. Start OCR Worker
echo -e "${BLUE}4️⃣  Starting OCR Worker...${NC}"
pkill -f "ocr-worker.js" 2>/dev/null || true
sleep 1

cd "${PROJECT_DIR}/server"
node workers/ocr-worker.js > /tmp/navidocs-ocr-worker.log 2>&1 &
WORKER_PID=$!
sleep 2

if ps -p $WORKER_PID > /dev/null; then
    echo -e "${GREEN}✅ OCR Worker started (PID: $WORKER_PID)${NC}"
    echo "   Logs: /tmp/navidocs-ocr-worker.log"
else
    echo -e "${YELLOW}⚠️  OCR Worker may have failed. Check logs:${NC}"
    cat /tmp/navidocs-ocr-worker.log
fi
echo ""

# 5. Start Frontend
echo -e "${BLUE}5️⃣  Checking Frontend (port 8080)...${NC}"
if check_port 8080 "Frontend"; then
    echo -e "${YELLOW}⚠️  Killing existing frontend...${NC}"
    pkill -f "vite.*8080" || true
    sleep 1
fi

echo "Starting Frontend (Vite dev server)..."
cd "${PROJECT_DIR}/client"
npm run dev > /tmp/navidocs-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
    echo "   Logs: /tmp/navidocs-frontend.log"
else
    echo -e "${YELLOW}❌ Frontend failed to start. Check logs:${NC}"
    cat /tmp/navidocs-frontend.log
    exit 1
fi
echo ""

# Get WSL2 IP for Windows access
WSL_IP=$(hostname -I | awk '{print $1}')

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ NaviDocs Stack Started Successfully!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
echo "   Redis:        ✅ Running on port 6379"
echo "   Meilisearch:  ✅ Running on port 7700"
echo "   Backend API:  ✅ Running on port 8001"
echo "   OCR Worker:   ✅ Running"
echo "   Frontend:     ✅ Running on port 8080"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "   WSL2 (localhost):     http://localhost:8080"
echo "   Windows 11 (from browser): http://${WSL_IP}:8080"
echo ""
echo -e "${BLUE}📝 Log Files:${NC}"
echo "   Backend:   /tmp/navidocs-backend.log"
echo "   OCR Worker: /tmp/navidocs-ocr-worker.log"
echo "   Frontend:   /tmp/navidocs-frontend.log"
echo ""
echo -e "${BLUE}🛠️  Useful Commands:${NC}"
echo "   Stop all:    ./stop-all.sh"
echo "   View logs:   tail -f /tmp/navidocs-*.log"
echo "   Backend health: curl http://localhost:8001/health"
echo ""
echo -e "${GREEN}Ready to upload documents! 🎉${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
