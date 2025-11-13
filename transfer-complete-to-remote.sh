#!/bin/bash

# NaviDocs - Complete Transfer to Remote Server
# Transfers ALL files including uploads, database, and git-ignored files

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REMOTE_HOST="192.168.1.41"
REMOTE_USER="ggq-admin"  # or claude, depending on your access
REMOTE_PATH="/home/${REMOTE_USER}/navidocs"
LOCAL_PATH="/home/setup/navidocs"

echo "==========================================="
echo "NaviDocs - Complete File Transfer"
echo "==========================================="
echo ""
echo "This will transfer:"
echo "  • Git repository (already done ✓)"
echo "  • uploads/ directory (~153 MB)"
echo "  • SQLite database (navidocs.db)"
echo "  • Environment files (.env.example)"
echo "  • All ignored files"
echo ""
echo "Transfer Method: rsync over SSH"
echo "From: ${LOCAL_PATH}"
echo "To:   ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
echo ""

# Check if rsync is available
if ! command -v rsync &> /dev/null; then
    echo -e "${RED}✗ rsync is not installed${NC}"
    echo "Install it with: sudo apt install rsync"
    exit 1
fi

# Test SSH connection
echo "Testing SSH connection..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes ${REMOTE_USER}@${REMOTE_HOST} "echo 'Connection successful'" 2>/dev/null; then
    echo -e "${YELLOW}⚠ SSH key authentication not set up${NC}"
    echo "You'll be prompted for password during transfer"
    echo ""
    read -p "Continue? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create remote directory
echo ""
echo "Creating remote directory..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_PATH}" || {
    echo -e "${RED}✗ Failed to create remote directory${NC}"
    exit 1
}

echo -e "${GREEN}✓ Remote directory ready${NC}"

# Transfer files with rsync
echo ""
echo "========================================="
echo "Starting file transfer..."
echo "========================================="
echo ""

# Rsync options explained:
# -a: archive mode (preserves permissions, timestamps, etc.)
# -v: verbose
# -z: compress during transfer
# -P: show progress
# --exclude: skip these patterns
# --delete: remove files on remote that don't exist locally (be careful!)

rsync -avzP \
    --exclude='node_modules' \
    --exclude='coverage' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='*.log' \
    --exclude='data.ms' \
    --exclude='meilisearch-data' \
    --exclude='.vscode' \
    --exclude='.idea' \
    --exclude='*.swp' \
    "${LOCAL_PATH}/" \
    "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

echo ""
echo "========================================="
echo -e "${GREEN}✓ Transfer complete!${NC}"
echo "========================================="
echo ""

# Verify critical files
echo "Verifying critical files on remote..."
echo ""

ssh ${REMOTE_USER}@${REMOTE_HOST} "
    cd ${REMOTE_PATH}
    echo 'Repository size:'
    du -sh .
    echo ''
    echo 'Critical directories:'
    ls -lh uploads/ server/db/ | head -5
    echo ''
    echo 'Database file:'
    ls -lh server/db/navidocs.db 2>/dev/null || echo '  No database file found'
    echo ''
    echo 'Upload files count:'
    find uploads -type f | wc -l
" || {
    echo -e "${YELLOW}⚠ Could not verify remote files${NC}"
}

echo ""
echo "========================================="
echo "Next Steps:"
echo "========================================="
echo ""
echo "1. SSH into remote server:"
echo "   ssh ${REMOTE_USER}@${REMOTE_HOST}"
echo ""
echo "2. Navigate to navidocs:"
echo "   cd ${REMOTE_PATH}"
echo ""
echo "3. Install dependencies:"
echo "   cd server && npm install"
echo "   cd ../client && npm install"
echo ""
echo "4. Copy environment file:"
echo "   cp server/.env.example server/.env"
echo "   # Edit server/.env with production values"
echo ""
echo "5. Start services:"
echo "   # Terminal 1: Redis"
echo "   redis-server"
echo "   "
echo "   # Terminal 2: Meilisearch"
echo "   meilisearch --master-key=your_key_here"
echo "   "
echo "   # Terminal 3: Backend"
echo "   cd server && node index.js"
echo "   "
echo "   # Terminal 4: Frontend (optional for production)"
echo "   cd client && npm run dev"
echo ""
echo "========================================="
echo ""
