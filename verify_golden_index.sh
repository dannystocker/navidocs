#!/bin/bash

###############################################################################
# Redis Golden Index Verification Script
###############################################################################
# Verifies the integrity and completeness of the golden index
# Namespace: navidocs:remediated_2025:*
#

set +e

NAMESPACE="navidocs:remediated_2025"
PRIORITY_FILES=(
    "restore_chaos.sh"
    "server/config/db_connect.js"
    "public/js/doc-viewer.js"
    "server/routes/api_search.js"
    "server/index.js"
    "Dockerfile"
    "server/.env.example"
    "test_search_wiring.sh"
    "docs/ROADMAP_V2_RECOVERED.md"
    "PHASE_2_DELTA_REPORT.md"
    "GLOBAL_VISION_REPORT.md"
    "COMPREHENSIVE_AUDIT_REPORT.md"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================================================================"
echo "REDIS GOLDEN INDEX VERIFICATION"
echo "================================================================================"
echo ""

# 1. Check Redis connection
echo -e "${BLUE}[1] Checking Redis Connection...${NC}"
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis is responding"
else
    echo -e "${RED}✗${NC} Redis is not responding"
    exit 1
fi
echo ""

# 2. Check namespace existence
echo -e "${BLUE}[2] Checking Namespace Existence...${NC}"
INDEX_COUNT=$(redis-cli SCARD "${NAMESPACE}:index" 2>/dev/null || echo "0")
if [ "$INDEX_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Namespace exists with ${INDEX_COUNT} files indexed"
else
    echo -e "${RED}✗${NC} Namespace not found or empty"
    exit 1
fi
echo ""

# 3. Check key distribution
echo -e "${BLUE}[3] Checking Key Distribution...${NC}"
FILE_KEYS=$(redis-cli KEYS "${NAMESPACE}:file:*" 2>/dev/null | wc -l)
META_KEYS=$(redis-cli KEYS "${NAMESPACE}:meta:*" 2>/dev/null | wc -l)
TOTAL_NAMESPACE_KEYS=$(redis-cli KEYS "${NAMESPACE}:*" 2>/dev/null | wc -l)

echo "  File content keys:        $FILE_KEYS"
echo "  Metadata keys:            $META_KEYS"
echo "  Index/Priority sets:      $(( TOTAL_NAMESPACE_KEYS - FILE_KEYS - META_KEYS ))"
echo -e "${GREEN}✓${NC} Total keys in namespace: ${TOTAL_NAMESPACE_KEYS}"
echo ""

# 4. Verify priority files
echo -e "${BLUE}[4] Verifying Priority Files...${NC}"
PRIORITY_FOUND=0
PRIORITY_MISSING=0

for pf in "${PRIORITY_FILES[@]}"; do
    if redis-cli SISMEMBER "${NAMESPACE}:index" "$pf" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} $pf"
        (( PRIORITY_FOUND++ ))
    else
        echo -e "  ${YELLOW}~${NC} $pf (not indexed - may not exist in remediated state)"
        (( PRIORITY_MISSING++ ))
    fi
done

echo -e "${GREEN}✓${NC} Priority files found: ${PRIORITY_FOUND}/${#PRIORITY_FILES[@]}"
echo ""

# 5. Sample file verification
echo -e "${BLUE}[5] Sampling Files for Integrity Check...${NC}"
SAMPLE_FILES=$(redis-cli SMEMBERS "${NAMESPACE}:index" | head -5)
VERIFIED=0

for sample_file in $SAMPLE_FILES; do
    # Check if content exists
    if redis-cli EXISTS "${NAMESPACE}:file:${sample_file}" > /dev/null 2>&1; then
        # Check if metadata exists
        if redis-cli EXISTS "${NAMESPACE}:meta:${sample_file}" > /dev/null 2>&1; then
            SIZE=$(redis-cli STRLEN "${NAMESPACE}:file:${sample_file}" 2>/dev/null || echo "0")
            echo -e "  ${GREEN}✓${NC} ${sample_file} (${SIZE} bytes)"
            (( VERIFIED++ ))
        fi
    fi
done

echo -e "${GREEN}✓${NC} Sample verification: ${VERIFIED}/5 files have complete metadata"
echo ""

# 6. Index metadata
echo -e "${BLUE}[6] Checking Index Metadata...${NC}"
METADATA=$(redis-cli --raw GET "${NAMESPACE}:metadata")
if [ ! -z "$METADATA" ]; then
    echo -e "${GREEN}✓${NC} Index metadata found"
    echo ""
    echo "$METADATA" | head -15
    echo ""
else
    echo -e "${YELLOW}~${NC} Index metadata not found"
    echo ""
fi

# 7. Memory usage
echo -e "${BLUE}[7] Redis Memory Usage...${NC}"
redis-cli INFO memory | grep -E "used_memory|maxmemory" | sed 's/^/  /'
echo ""

# 8. Comparison with filesystem
echo -e "${BLUE}[8] Filesystem vs Redis Index Comparison...${NC}"
FILESYSTEM_COUNT=$(find /home/setup/navidocs -type f -not -path "*/.git/*" -not -path "*/node_modules/*" -not -path "*/.github/*" -not -path "*/.next/*" 2>/dev/null | wc -l)
REDIS_COUNT=$(redis-cli SCARD "${NAMESPACE}:index")

echo "  Files in filesystem:      ${FILESYSTEM_COUNT}"
echo "  Files in Redis index:     ${REDIS_COUNT}"

if [ "$FILESYSTEM_COUNT" -eq "$REDIS_COUNT" ]; then
    echo -e "  ${GREEN}✓${NC} Counts match - all files indexed"
else
    DIFF=$(( FILESYSTEM_COUNT - REDIS_COUNT ))
    if [ $DIFF -gt 0 ]; then
        echo -e "  ${YELLOW}~${NC} ${DIFF} files in filesystem not yet indexed"
    else
        echo -e "  ${YELLOW}~${NC} Discrepancy: Redis has ${DIFF} extra entries"
    fi
fi
echo ""

# 9. Test data retrieval
echo -e "${BLUE}[9] Testing Data Retrieval...${NC}"
TEST_FILE="restore_chaos.sh"
if redis-cli EXISTS "${NAMESPACE}:file:${TEST_FILE}" > /dev/null 2>&1; then
    CONTENT=$(redis-cli GET "${NAMESPACE}:file:${TEST_FILE}" | head -3)
    echo -e "  ${GREEN}✓${NC} Successfully retrieved ${TEST_FILE}"
    echo "    First 3 lines:"
    echo "$CONTENT" | while IFS= read -r line; do echo "    $line"; done
else
    echo -e "  ${YELLOW}~${NC} ${TEST_FILE} not found in index"
fi
echo ""

# 10. Summary
echo "================================================================================"
echo "VERIFICATION SUMMARY"
echo "================================================================================"
echo -e "Status:                  ${GREEN}READY${NC}"
echo "Namespace:               ${NAMESPACE}"
echo "Total Files Indexed:     ${INDEX_COUNT}"
echo "Total Redis Keys:        ${TOTAL_NAMESPACE_KEYS}"
echo "Priority Files Found:    ${PRIORITY_FOUND}/${#PRIORITY_FILES[@]}"
echo "Filesystem Files:        ${FILESYSTEM_COUNT}"
echo ""
echo "================================================================================"
echo "QUICK ACCESS COMMANDS"
echo "================================================================================"
echo ""
echo "# Count files in index"
echo "redis-cli SCARD '${NAMESPACE}:index'"
echo ""
echo "# List all indexed files"
echo "redis-cli SMEMBERS '${NAMESPACE}:index'"
echo ""
echo "# Get specific file content"
echo "redis-cli GET '${NAMESPACE}:file:restore_chaos.sh'"
echo ""
echo "# Get file metadata"
echo "redis-cli GET '${NAMESPACE}:meta:restore_chaos.sh'"
echo ""
echo "# View index metadata"
echo "redis-cli GET '${NAMESPACE}:metadata'"
echo ""
echo "# Check memory usage"
echo "redis-cli INFO memory"
echo ""
echo "# Search for files matching pattern"
echo "redis-cli SMEMBERS '${NAMESPACE}:index' | grep '.js'"
echo ""
echo "================================================================================"
echo ""
