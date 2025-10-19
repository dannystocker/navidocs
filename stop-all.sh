#!/bin/bash

# NaviDocs - Stop All Services
# This script stops the complete NaviDocs stack

echo "🛑 Stopping NaviDocs Stack..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stop Frontend
echo -e "${BLUE}Stopping Frontend (Vite)...${NC}"
pkill -f "vite.*8080" && echo -e "${GREEN}✅ Frontend stopped${NC}" || echo "Frontend not running"

# Stop OCR Worker
echo -e "${BLUE}Stopping OCR Worker...${NC}"
pkill -f "ocr-worker.js" && echo -e "${GREEN}✅ OCR Worker stopped${NC}" || echo "OCR Worker not running"

# Stop Backend
echo -e "${BLUE}Stopping Backend API...${NC}"
pkill -f "navidocs.*index.js" && echo -e "${GREEN}✅ Backend API stopped${NC}" || echo "Backend not running"

# Don't stop Redis and Meilisearch as they might be used by other services
echo ""
echo -e "${BLUE}ℹ️  Note: Redis and Meilisearch left running (may be used by other services)${NC}"
echo ""
echo "To stop Redis: sudo systemctl stop redis-server"
echo "To stop Meilisearch: docker stop boat-manuals-meilisearch"
echo ""
echo -e "${GREEN}✅ NaviDocs services stopped${NC}"
