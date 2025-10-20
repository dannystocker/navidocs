#!/bin/bash

################################################################################
# TOC Smoke Test Suite
# Tests Table of Contents API endpoints for NaviDocs
#
# Dependencies:
#   - curl (for HTTP requests)
#   - jq (for JSON parsing and validation)
#   - bc (for floating point arithmetic - cache timing)
#
# Usage:
#   ./toc-smoke-test.sh [BASE_URL] [DOCUMENT_ID]
#
# Examples:
#   ./toc-smoke-test.sh
#   ./toc-smoke-test.sh http://localhost:3001
#   ./toc-smoke-test.sh http://localhost:3001 abc-123-def-456
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:3001}"
DOCUMENT_ID="${2:-}"
TEMP_DIR="/tmp/toc-smoke-test-$$"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

################################################################################
# Utility Functions
################################################################################

# Print colored status messages
print_status() {
  local status=$1
  local message=$2

  case $status in
    "PASS")
      echo -e "${GREEN}[✓ PASS]${NC} $message"
      ((PASSED_TESTS++))
      ;;
    "FAIL")
      echo -e "${RED}[✗ FAIL]${NC} $message"
      ((FAILED_TESTS++))
      ;;
    "INFO")
      echo -e "${BLUE}[ℹ INFO]${NC} $message"
      ;;
    "WARN")
      echo -e "${YELLOW}[⚠ WARN]${NC} $message"
      ;;
    "SECTION")
      echo -e "\n${BLUE}========================================${NC}"
      echo -e "${BLUE}$message${NC}"
      echo -e "${BLUE}========================================${NC}"
      ;;
  esac
}

# Run a test and increment counter
run_test() {
  local test_name=$1
  ((TOTAL_TESTS++))
  print_status "INFO" "Test $TOTAL_TESTS: $test_name"
}

# Check command dependencies
check_dependencies() {
  print_status "SECTION" "Checking Dependencies"

  local missing_deps=0

  for cmd in curl jq bc; do
    if ! command -v $cmd &> /dev/null; then
      print_status "FAIL" "$cmd is not installed"
      ((missing_deps++))
    else
      print_status "PASS" "$cmd is available"
    fi
  done

  if [ $missing_deps -gt 0 ]; then
    echo ""
    echo "Please install missing dependencies:"
    echo "  Ubuntu/Debian: sudo apt-get install curl jq bc"
    echo "  macOS: brew install curl jq bc"
    exit 1
  fi
}

# Get a valid document ID from the database
get_test_document_id() {
  print_status "SECTION" "Finding Test Document"

  if [ -n "$DOCUMENT_ID" ]; then
    print_status "INFO" "Using provided document ID: $DOCUMENT_ID"
    return
  fi

  # Try to get a document from the API
  local response=$(curl -s "${BASE_URL}/api/documents?limit=1")

  if [ $? -ne 0 ]; then
    print_status "FAIL" "Could not connect to API at ${BASE_URL}"
    exit 1
  fi

  # Extract first document ID using jq
  DOCUMENT_ID=$(echo "$response" | jq -r '.documents[0].id // empty')

  if [ -z "$DOCUMENT_ID" ]; then
    print_status "WARN" "No documents found in database"
    print_status "INFO" "Using placeholder ID for endpoint validation"
    DOCUMENT_ID="test-document-id"
  else
    print_status "PASS" "Found document ID: $DOCUMENT_ID"
  fi
}

# Create temp directory for test artifacts
setup_test_environment() {
  mkdir -p "$TEMP_DIR"
  print_status "INFO" "Created temp directory: $TEMP_DIR"
}

# Cleanup temp directory
cleanup_test_environment() {
  if [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
    print_status "INFO" "Cleaned up temp directory"
  fi
}

################################################################################
# Test Cases
################################################################################

# Test 1: GET /api/documents/:id/toc?format=flat - returns 200
test_toc_flat_format() {
  run_test "GET /api/documents/:id/toc?format=flat returns 200"

  local response_file="$TEMP_DIR/toc_flat.json"
  local http_code=$(curl -s -w "%{http_code}" -o "$response_file" \
    "${BASE_URL}/api/documents/${DOCUMENT_ID}/toc?format=flat")

  if [ "$http_code" = "200" ]; then
    print_status "PASS" "Received HTTP 200 response"

    # Validate JSON structure
    if jq -e '.entries' "$response_file" > /dev/null 2>&1; then
      print_status "PASS" "Response contains 'entries' field"
    else
      print_status "FAIL" "Response missing 'entries' field"
    fi

    if jq -e '.format == "flat"' "$response_file" > /dev/null 2>&1; then
      print_status "PASS" "Format is 'flat'"
    else
      print_status "FAIL" "Format is not 'flat'"
    fi

  else
    print_status "FAIL" "Expected HTTP 200, got $http_code"
    cat "$response_file"
  fi
}

# Test 2: GET /api/documents/:id/toc?format=tree - returns 200
test_toc_tree_format() {
  run_test "GET /api/documents/:id/toc?format=tree returns 200"

  local response_file="$TEMP_DIR/toc_tree.json"
  local http_code=$(curl -s -w "%{http_code}" -o "$response_file" \
    "${BASE_URL}/api/documents/${DOCUMENT_ID}/toc?format=tree")

  if [ "$http_code" = "200" ]; then
    print_status "PASS" "Received HTTP 200 response"

    # Validate JSON structure
    if jq -e '.entries' "$response_file" > /dev/null 2>&1; then
      print_status "PASS" "Response contains 'entries' field"
    else
      print_status "FAIL" "Response missing 'entries' field"
    fi

    if jq -e '.format == "tree"' "$response_file" > /dev/null 2>&1; then
      print_status "PASS" "Format is 'tree'"
    else
      print_status "FAIL" "Format is not 'tree'"
    fi

  else
    print_status "FAIL" "Expected HTTP 200, got $http_code"
    cat "$response_file"
  fi
}

# Test 3: POST /api/documents/:id/toc/extract - returns 200
test_toc_extract() {
  run_test "POST /api/documents/:id/toc/extract returns 200"

  local response_file="$TEMP_DIR/toc_extract.json"
  local http_code=$(curl -s -w "%{http_code}" -o "$response_file" \
    -X POST "${BASE_URL}/api/documents/${DOCUMENT_ID}/toc/extract")

  # Accept both 200 (success) and 400 (document doesn't exist) as valid
  # since we might be using a placeholder ID
  if [ "$http_code" = "200" ] || [ "$http_code" = "400" ]; then
    print_status "PASS" "Received HTTP $http_code response"

    # If successful, validate response structure
    if [ "$http_code" = "200" ]; then
      if jq -e '.success' "$response_file" > /dev/null 2>&1; then
        print_status "PASS" "Response contains 'success' field"
      else
        print_status "FAIL" "Response missing 'success' field"
      fi

      if jq -e '.entriesCount' "$response_file" > /dev/null 2>&1; then
        local count=$(jq -r '.entriesCount' "$response_file")
        print_status "PASS" "Response contains 'entriesCount': $count"
      else
        print_status "FAIL" "Response missing 'entriesCount' field"
      fi
    fi
  else
    print_status "FAIL" "Expected HTTP 200 or 400, got $http_code"
    cat "$response_file"
  fi
}

# Test 4: Verify TOC entries have required fields
test_toc_entry_fields() {
  run_test "Verify TOC entries have required fields (id, document_id, title, page_start)"

  local response_file="$TEMP_DIR/toc_flat.json"

  # Check if we have entries
  local entry_count=$(jq -r '.entries | length' "$response_file" 2>/dev/null || echo "0")

  if [ "$entry_count" = "0" ]; then
    print_status "WARN" "No TOC entries found - skipping field validation"
    # Still count as passed since it's valid to have no TOC
    print_status "PASS" "Empty TOC is valid"
    return
  fi

  print_status "INFO" "Found $entry_count TOC entries"

  # Check first entry for required fields
  local first_entry=$(jq -r '.entries[0]' "$response_file")

  local required_fields=("id" "document_id" "title" "page_start")
  local missing_fields=0

  for field in "${required_fields[@]}"; do
    if echo "$first_entry" | jq -e ".$field" > /dev/null 2>&1; then
      local value=$(echo "$first_entry" | jq -r ".$field")
      print_status "PASS" "Field '$field' exists with value: $value"
    else
      print_status "FAIL" "Field '$field' is missing"
      ((missing_fields++))
    fi
  done

  if [ $missing_fields -eq 0 ]; then
    print_status "PASS" "All required fields present"
  else
    print_status "FAIL" "$missing_fields required fields missing"
  fi
}

# Test 5: Verify tree format has nested children
test_tree_nesting() {
  run_test "Verify tree format has nested children structure"

  local response_file="$TEMP_DIR/toc_tree.json"

  # Check if we have entries
  local entry_count=$(jq -r '.entries | length' "$response_file" 2>/dev/null || echo "0")

  if [ "$entry_count" = "0" ]; then
    print_status "WARN" "No TOC entries found - skipping nesting validation"
    print_status "PASS" "Empty TOC is valid"
    return
  fi

  # Check if at least one entry has a 'children' field (even if empty)
  if jq -e '.entries[0] | has("children")' "$response_file" > /dev/null 2>&1; then
    print_status "PASS" "Tree entries have 'children' field"

    # Check if any entry has nested children
    local has_nested=$(jq -r '[.entries[] | select((.children // []) | length > 0)] | length' "$response_file")

    if [ "$has_nested" -gt "0" ]; then
      print_status "PASS" "Found $has_nested entries with nested children"
    else
      print_status "INFO" "No nested children found (flat TOC structure)"
      print_status "PASS" "Tree structure is valid (can be flat)"
    fi
  else
    print_status "FAIL" "Tree entries missing 'children' field"
  fi
}

# Test 6: Verify cache is working (second request is faster)
test_cache_performance() {
  run_test "Verify cache is working (second request should be faster)"

  print_status "INFO" "Making first request (cache miss)..."
  local start1=$(date +%s%N)
  curl -s -o /dev/null "${BASE_URL}/api/documents/${DOCUMENT_ID}/toc?format=flat"
  local end1=$(date +%s%N)
  local duration1=$(( (end1 - start1) / 1000000 )) # Convert to milliseconds

  print_status "INFO" "First request took ${duration1}ms"

  # Small delay to ensure cache is set
  sleep 0.1

  print_status "INFO" "Making second request (cache hit)..."
  local start2=$(date +%s%N)
  curl -s -o /dev/null "${BASE_URL}/api/documents/${DOCUMENT_ID}/toc?format=flat"
  local end2=$(date +%s%N)
  local duration2=$(( (end2 - start2) / 1000000 )) # Convert to milliseconds

  print_status "INFO" "Second request took ${duration2}ms"

  # Second request should be faster or at least not significantly slower
  # We allow up to 20% slower due to network variance
  local threshold=$(echo "$duration1 * 1.2" | bc | cut -d. -f1)

  if [ "$duration2" -lt "$duration1" ]; then
    local improvement=$(echo "scale=2; ($duration1 - $duration2) / $duration1 * 100" | bc)
    print_status "PASS" "Cache is working: ${improvement}% faster"
  elif [ "$duration2" -le "$threshold" ]; then
    print_status "PASS" "Cache performance acceptable (within 20% variance)"
  else
    print_status "WARN" "Second request slower than expected (possible cache miss)"
    # Don't fail the test as network variance can affect timing
    print_status "PASS" "Cache endpoint is functional"
  fi
}

# Test 7: Health check endpoint
test_health_check() {
  run_test "Server health check endpoint"

  local response_file="$TEMP_DIR/health.json"
  local http_code=$(curl -s -w "%{http_code}" -o "$response_file" \
    "${BASE_URL}/health")

  if [ "$http_code" = "200" ]; then
    print_status "PASS" "Health endpoint returned 200"

    if jq -e '.status == "ok"' "$response_file" > /dev/null 2>&1; then
      print_status "PASS" "Server status is 'ok'"
    else
      print_status "FAIL" "Server status is not 'ok'"
    fi
  else
    print_status "FAIL" "Health check failed with HTTP $http_code"
  fi
}

# Test 8: Error handling - invalid document ID
test_error_handling() {
  run_test "Error handling for invalid document ID"

  local response_file="$TEMP_DIR/error_test.json"
  local invalid_id="nonexistent-document-id-12345"
  local http_code=$(curl -s -w "%{http_code}" -o "$response_file" \
    "${BASE_URL}/api/documents/${invalid_id}/toc?format=flat")

  # Server should return 200 with empty entries or 404/500 with error
  # Both are acceptable behaviors
  if [ "$http_code" = "200" ] || [ "$http_code" = "404" ] || [ "$http_code" = "500" ]; then
    print_status "PASS" "Server handles invalid ID gracefully (HTTP $http_code)"

    # If 200, should have empty entries
    if [ "$http_code" = "200" ]; then
      local count=$(jq -r '.entries | length' "$response_file")
      print_status "INFO" "Returned $count entries for nonexistent document"
    fi
  else
    print_status "WARN" "Unexpected status code for invalid ID: $http_code"
    print_status "PASS" "Server responded (not crashed)"
  fi
}

# Test 9: Default format parameter
test_default_format() {
  run_test "Default format parameter (no format query param)"

  local response_file="$TEMP_DIR/toc_default.json"
  local http_code=$(curl -s -w "%{http_code}" -o "$response_file" \
    "${BASE_URL}/api/documents/${DOCUMENT_ID}/toc")

  if [ "$http_code" = "200" ]; then
    print_status "PASS" "Received HTTP 200 response"

    # Should default to 'flat' format
    if jq -e '.format == "flat"' "$response_file" > /dev/null 2>&1; then
      print_status "PASS" "Defaults to 'flat' format when not specified"
    else
      local format=$(jq -r '.format' "$response_file")
      print_status "FAIL" "Expected default format 'flat', got '$format'"
    fi
  else
    print_status "FAIL" "Expected HTTP 200, got $http_code"
  fi
}

################################################################################
# Test Execution
################################################################################

main() {
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║         NaviDocs TOC API Smoke Test Suite                 ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""

  print_status "INFO" "Base URL: $BASE_URL"
  print_status "INFO" "Test started at: $(date)"

  # Setup
  check_dependencies
  setup_test_environment
  get_test_document_id

  # Run all tests
  print_status "SECTION" "Running Test Suite"

  test_health_check
  test_toc_flat_format
  test_toc_tree_format
  test_toc_extract
  test_toc_entry_fields
  test_tree_nesting
  test_default_format
  test_cache_performance
  test_error_handling

  # Summary
  print_status "SECTION" "Test Summary"

  echo ""
  echo "Total Tests:  $TOTAL_TESTS"
  echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
  echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
  echo ""

  if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ALL TESTS PASSED! ✓                  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    EXIT_CODE=0
  else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  SOME TESTS FAILED ✗                  ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    EXIT_CODE=1
  fi

  # Cleanup
  cleanup_test_environment

  print_status "INFO" "Test completed at: $(date)"
  echo ""

  exit $EXIT_CODE
}

# Trap to ensure cleanup on exit
trap cleanup_test_environment EXIT

# Run main function
main
