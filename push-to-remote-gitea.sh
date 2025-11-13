#!/bin/bash

# NaviDocs - Remote Gitea Push Script
# Pushes navidocs repository to remote Gitea at 192.168.1.39

set -e  # Exit on error

# Configuration
REMOTE_HOST="192.168.1.39"
REMOTE_USER="claude"
GITEA_PORT="${1:-3000}"  # Default to 3000, or use first argument
REPO_NAME="navidocs"
LOCAL_REPO="/home/setup/navidocs"
REMOTE_NAME="remote-gitea"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================="
echo "NaviDocs - Remote Gitea Push"
echo "=================================="
echo ""
echo "Configuration:"
echo "  Remote Host: ${REMOTE_HOST}"
echo "  Remote User: ${REMOTE_USER}"
echo "  Gitea Port:  ${GITEA_PORT}"
echo "  Repository:  ${REPO_NAME}"
echo "  Remote Name: ${REMOTE_NAME}"
echo ""

# Check if Gitea port was provided
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}⚠ No Gitea port specified, using default: 3000${NC}"
    echo ""
    echo "Usage: $0 <gitea-port>"
    echo "Example: $0 4000"
    echo ""
    read -p "Press Enter to continue with port 3000, or Ctrl+C to cancel..."
    echo ""
fi

# Remote URL
REMOTE_URL="http://${REMOTE_HOST}:${GITEA_PORT}/${REMOTE_USER}/${REPO_NAME}.git"

echo "Remote URL: ${REMOTE_URL}"
echo ""

# Navigate to repository
cd "${LOCAL_REPO}" || {
    echo -e "${RED}✗ Failed to navigate to ${LOCAL_REPO}${NC}"
    exit 1
}

echo -e "${GREEN}✓ Changed directory to ${LOCAL_REPO}${NC}"

# Check git status
echo ""
echo "Checking repository status..."
git status --short

# Check if remote exists
if git remote | grep -q "^${REMOTE_NAME}$"; then
    echo ""
    echo -e "${YELLOW}⚠ Remote '${REMOTE_NAME}' already exists${NC}"
    git remote -v | grep ${REMOTE_NAME}
    echo ""
    read -p "Remove and re-add remote? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote remove ${REMOTE_NAME}
        echo -e "${GREEN}✓ Removed existing remote${NC}"
    fi
fi

# Add remote if not exists
if ! git remote | grep -q "^${REMOTE_NAME}$"; then
    echo ""
    echo "Adding remote '${REMOTE_NAME}'..."
    git remote add ${REMOTE_NAME} "${REMOTE_URL}"
    echo -e "${GREEN}✓ Remote added${NC}"
fi

# Show all remotes
echo ""
echo "Current remotes:"
git remote -v

# Check commit count
COMMIT_COUNT=$(git rev-list --count HEAD)
BRANCH=$(git branch --show-current)

echo ""
echo "Ready to push:"
echo "  Branch: ${BRANCH}"
echo "  Commits: ${COMMIT_COUNT}"
echo ""

# Confirm push
read -p "Proceed with push to ${REMOTE_NAME}? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Push cancelled${NC}"
    exit 0
fi

echo ""
echo "Pushing to remote Gitea..."
echo -e "${YELLOW}(You'll be prompted for username and password)${NC}"
echo ""

# Push all branches
echo "Pushing all branches..."
if git push ${REMOTE_NAME} --all; then
    echo -e "${GREEN}✓ Branches pushed successfully${NC}"
else
    echo -e "${RED}✗ Failed to push branches${NC}"
    exit 1
fi

# Push all tags
echo ""
echo "Pushing all tags..."
if git push ${REMOTE_NAME} --tags; then
    echo -e "${GREEN}✓ Tags pushed successfully${NC}"
else
    echo -e "${YELLOW}⚠ No tags to push or push failed${NC}"
fi

echo ""
echo "=================================="
echo -e "${GREEN}✓ Push complete!${NC}"
echo "=================================="
echo ""
echo "Verify at:"
echo "  http://${REMOTE_HOST}:${GITEA_PORT}/${REMOTE_USER}/${REPO_NAME}"
echo ""
echo "Clone command for others:"
echo "  git clone http://${REMOTE_HOST}:${GITEA_PORT}/${REMOTE_USER}/${REPO_NAME}.git"
echo ""
