#!/bin/bash
# NaviDocs StackCP Deployment Script

set -e  # Exit on error

echo "🚀 NaviDocs Deployment Starting..."

# Configuration
STACKCP_HOST="your-stackcp-host.com"
STACKCP_USER="your-username"
DEPLOY_PATH="/path/to/navidocs"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Color

# Step 1: Build Frontend
echo "${YELLOW}📦 Building frontend...${NC}"
cd client
npm run build
cd ..

# Step 2: Create deployment package
echo "${YELLOW}📦 Creating deployment package...${NC}"
tar -czf navidocs-deploy.tar.gz \
  server/ \
  client/dist/ \
  server/.env.production \
  package.json \
  start-all.sh \
  --exclude=node_modules \
  --exclude=*.log

# Step 3: Upload to StackCP
echo "${YELLOW}📤 Uploading to StackCP...${NC}"
scp navidocs-deploy.tar.gz ${STACKCP_USER}@${STACKCP_HOST}:${DEPLOY_PATH}/

# Step 4: Deploy on StackCP
echo "${YELLOW}🔧 Deploying on server...${NC}"
ssh ${STACKCP_USER}@${STACKCP_HOST} << 'ENDSSH'
cd /path/to/navidocs

# Backup current version
if [ -d "server" ]; then
  echo "Creating backup..."
  tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz server/ client/ uploads/ navidocs.db
fi

# Extract new version
tar -xzf navidocs-deploy.tar.gz

# Install dependencies
cd server
npm install --production

# Run migrations
npm run migrate

# Restart services
pm2 restart navidocs-api || pm2 start server/index.js --name navidocs-api
pm2 restart meilisearch || pm2 start meilisearch --name meilisearch -- --db-path ./meili_data

pm2 save

echo "✅ Deployment complete!"
ENDSSH

echo "${GREEN}✅ NaviDocs deployed successfully!${NC}"
echo "Visit: https://navidocs.yourdomain.com"

# Cleanup
rm navidocs-deploy.tar.gz
