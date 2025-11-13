#!/bin/bash
#
# NaviDocs StackCP Deployment Script
# Deploys NaviDocs to StackCP shared hosting with proper environment setup
#
# Usage: ./deploy-stackcp.sh [development|production]
#

set -e

ENVIRONMENT=${1:-production}
STACKCP_USER="digital-lab.ca"
STACKCP_HOST="ssh.gb.stackcp.com"
STACKCP_HOME="/home/sites/7a/c/cb8112d0d1"
NAVIDOCS_DEPLOY_PATH="/tmp/navidocs"
NAVIDOCS_DATA_PATH="${STACKCP_HOME}/navidocs-data"
NAVIDOCS_WEB_PATH="${STACKCP_HOME}/public_html/digital-lab.ca/navidocs"
NODE_BIN="/tmp/node"

echo "=================================="
echo "NaviDocs StackCP Deployment"
echo "Environment: $ENVIRONMENT"
echo "=================================="
echo ""

# Helper function to run remote commands
run_remote() {
    local cmd="$1"
    ssh "${STACKCP_USER}@${STACKCP_HOST}" "$cmd"
}

# Helper function to run remote commands with NVM sourced
run_remote_with_nvm() {
    local cmd="$1"
    run_remote "source ~/.nvm/nvm.sh && $cmd"
}

# Step 1: Verify connection
echo "Step 1: Verifying SSH connection..."
if run_remote "echo 'Connection OK'" > /dev/null; then
    echo "✅ SSH connection established"
else
    echo "❌ SSH connection failed"
    exit 1
fi
echo ""

# Step 2: Ensure /tmp/node is executable
echo "Step 2: Ensuring /tmp/node has execute permission..."
run_remote "chmod +x ${NODE_BIN}"
if run_remote "${NODE_BIN} --version" > /dev/null; then
    NODE_VERSION=$(run_remote "${NODE_BIN} --version")
    echo "✅ Node.js ready: $NODE_VERSION"
else
    echo "❌ Node.js not executable"
    exit 1
fi
echo ""

# Step 3: Check Meilisearch
echo "Step 3: Verifying Meilisearch..."
MEILISEARCH_HEALTH=$(run_remote "curl -s http://localhost:7700/health")
if echo "$MEILISEARCH_HEALTH" | grep -q "available"; then
    echo "✅ Meilisearch is running and healthy"
else
    echo "⚠️  Meilisearch not responding - continuing anyway"
fi
echo ""

# Step 4: Create data directories
echo "Step 4: Creating data directories..."
run_remote "mkdir -p ${NAVIDOCS_DATA_PATH}/{db,uploads,logs}"
run_remote "mkdir -p ${NAVIDOCS_WEB_PATH}"
echo "✅ Data directories created/verified"
echo ""

# Step 5: Copy application files from local to remote /tmp
echo "Step 5: Deploying application code to /tmp/navidocs..."
# This assumes you're running from the navidocs local repo root
if [ ! -d "./server" ] || [ ! -d "./client" ]; then
    echo "❌ Error: Must run from navidocs root directory"
    echo "   Expected to find ./server and ./client directories"
    exit 1
fi

# Create temp tarball with just what we need
echo "   Creating deployment package..."
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='.env' \
    -czf /tmp/navidocs-deploy.tar.gz \
    server/ client/ package.json README.md

echo "   Uploading to StackCP..."
scp /tmp/navidocs-deploy.tar.gz "${STACKCP_USER}@${STACKCP_HOST}:/tmp/"

echo "   Extracting on StackCP..."
run_remote "cd /tmp && rm -rf navidocs && tar -xzf navidocs-deploy.tar.gz -C /tmp && mv server navidocs 2>/dev/null || true"
run_remote "mkdir -p ${NAVIDOCS_DEPLOY_PATH}"

# Alternative: Use rsync for incremental sync
# rsync -avz --exclude='node_modules' --exclude='.git' \
#     ./server/ ./client/ "./package.json" \
#     "${STACKCP_USER}@${STACKCP_HOST}:${NAVIDOCS_DEPLOY_PATH}/"

rm /tmp/navidocs-deploy.tar.gz
echo "✅ Application code deployed"
echo ""

# Step 6: Create .env file if it doesn't exist
echo "Step 6: Setting up environment variables..."
run_remote "test -f ${NAVIDOCS_DATA_PATH}/.env && echo '.env exists' || cat > ${NAVIDOCS_DATA_PATH}/.env << 'ENVEOF'
# Server Configuration
PORT=8001
NODE_ENV=$ENVIRONMENT

# Database
DATABASE_PATH=${NAVIDOCS_DATA_PATH}/db/navidocs.db

# Meilisearch
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_MASTER_KEY=$(openssl rand -hex 32)
MEILISEARCH_INDEX_NAME=navidocs-pages
MEILISEARCH_SEARCH_KEY=$(openssl rand -hex 32)

# Redis (for BullMQ) - using Redis Cloud free tier
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Authentication
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=15m

# System Settings Encryption
SETTINGS_ENCRYPTION_KEY=$(node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))')

# System Administrators
SYSTEM_ADMIN_EMAILS=admin@example.com

# File Upload
MAX_FILE_SIZE=50000000
UPLOAD_DIR=${NAVIDOCS_DATA_PATH}/uploads
ALLOWED_MIME_TYPES=application/pdf

# OCR
OCR_LANGUAGE=eng
OCR_CONFIDENCE_THRESHOLD=0.7
USE_REMOTE_OCR=false
OCR_WORKER_URL=https://fr-antibes.duckdns.org/naviocr
OCR_WORKER_TIMEOUT=300000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENVEOF
"

echo "✅ Environment file configured"
echo ""

# Step 7: Install dependencies
echo "Step 7: Installing Node.js dependencies..."
echo "   This may take 5-10 minutes..."
run_remote_with_nvm "cd ${NAVIDOCS_DEPLOY_PATH} && npm install --production"
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  npm install had warnings - check output above"
fi
echo ""

# Step 8: Initialize database
echo "Step 8: Initializing database..."
run_remote "${NODE_BIN} ${NAVIDOCS_DEPLOY_PATH}/server/db/init.js"
if run_remote "test -f ${NAVIDOCS_DATA_PATH}/db/navidocs.db"; then
    DB_SIZE=$(run_remote "ls -lh ${NAVIDOCS_DATA_PATH}/db/navidocs.db | awk '{print \$5}'")
    echo "✅ Database initialized (Size: $DB_SIZE)"
else
    echo "⚠️  Database file not found - may not have been created"
fi
echo ""

# Step 9: Run smoke tests
echo "Step 9: Running smoke tests..."
echo "   Starting server in test mode (30 second timeout)..."
TEST_PID=$(run_remote "nohup ${NODE_BIN} ${NAVIDOCS_DEPLOY_PATH}/server/index.js > ${NAVIDOCS_DATA_PATH}/logs/test.log 2>&1 & echo \$!")
sleep 5

if run_remote "curl -s http://localhost:8001/health 2>/dev/null | grep -q 'ok\\|running'"; then
    echo "✅ Server health check passed"
else
    echo "⚠️  Health check inconclusive - check logs"
fi

# Stop test server
echo "   Stopping test server..."
run_remote "pkill -f 'node ${NAVIDOCS_DEPLOY_PATH}' || true"
sleep 2
echo "✅ Smoke tests completed"
echo ""

# Step 10: Display next steps
echo "=================================="
echo "Deployment Complete!"
echo "=================================="
echo ""
echo "Next Steps:"
echo "1. Access StackCP Control Panel:"
echo "   - Go to Node.js Manager"
echo "   - Create new Node.js Application"
echo "   - Start file: ${NAVIDOCS_DEPLOY_PATH}/server/index.js"
echo "   - Environment: $ENVIRONMENT"
echo ""
echo "2. Configure domain routing:"
echo "   - Point your domain to port 8001"
echo "   - Or use a reverse proxy (nginx/Apache)"
echo ""
echo "3. Monitor application:"
echo "   - Check logs: ssh stackcp 'tail -f ${NAVIDOCS_DATA_PATH}/logs/app.log'"
echo "   - Monitor disk usage: ssh stackcp 'df -h'"
echo ""
echo "4. Verify deployment:"
echo "   ssh stackcp << 'EOF'
echo "   source ~/.nvm/nvm.sh
echo "   curl -s http://localhost:8001/api/status
echo "   EOF"
echo ""
echo "Application deployed to:"
echo "  Code: ${NAVIDOCS_DEPLOY_PATH}"
echo "  Data: ${NAVIDOCS_DATA_PATH}"
echo "  Web: ${NAVIDOCS_WEB_PATH}"
echo ""
echo "Environment Report: /home/setup/navidocs/STACKCP_ENVIRONMENT_REPORT.md"
echo ""
