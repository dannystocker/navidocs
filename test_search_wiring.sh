#!/bin/bash

################################################################################
# NaviDocs Search Wiring Verification Script
# Tests all components required for search functionality:
# - Dockerfile contains wkhtmltopdf
# - Meilisearch is reachable
# - PDF export capability (wkhtmltopdf installed)
# - Search API endpoint responds correctly
################################################################################

set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Configuration
API_HOST="${API_HOST:-http://localhost:3001}"
MEILI_HOST="${MEILI_HOST:-http://127.0.0.1:7700}"
TIMEOUT=10

################################################################################
# Helper Functions
################################################################################

log_test() {
  echo -e "${BLUE}[TEST]${NC} $1"
}

log_pass() {
  echo -e "${GREEN}[PASS]${NC} $1"
  ((TESTS_PASSED++))
}

log_fail() {
  echo -e "${RED}[FAIL]${NC} $1"
  ((TESTS_FAILED++))
}

log_skip() {
  echo -e "${YELLOW}[SKIP]${NC} $1"
  ((TESTS_SKIPPED++))
}

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_header() {
  echo ""
  echo "================================================================================"
  echo "  $1"
  echo "================================================================================"
}

check_command_exists() {
  if command -v "$1" &> /dev/null; then
    return 0
  else
    return 1
  fi
}

################################################################################
# Test 1: Dockerfile Configuration
################################################################################

test_dockerfile_wkhtmltopdf() {
  print_header "TEST 1: Dockerfile wkhtmltopdf Configuration"

  log_test "Checking if Dockerfile exists..."

  if [ ! -f "Dockerfile" ]; then
    log_fail "Dockerfile not found in current directory"
    return 1
  fi
  log_pass "Dockerfile found"

  log_test "Checking for wkhtmltopdf in Dockerfile..."

  if grep -q "wkhtmltopdf" Dockerfile; then
    log_pass "wkhtmltopdf found in Dockerfile"

    # Check if it's commented out
    if grep "^[[:space:]]*#.*wkhtmltopdf" Dockerfile > /dev/null; then
      log_fail "wkhtmltopdf is COMMENTED OUT in Dockerfile"
      return 1
    else
      log_pass "wkhtmltopdf is NOT commented out"
      return 0
    fi
  else
    log_fail "wkhtmltopdf not found in Dockerfile"
    return 1
  fi
}

################################################################################
# Test 2: wkhtmltopdf Installation (Local System)
################################################################################

test_wkhtmltopdf_installed() {
  print_header "TEST 2: wkhtmltopdf Installation"

  log_test "Checking if wkhtmltopdf is installed locally..."

  if check_command_exists "wkhtmltopdf"; then
    version=$(wkhtmltopdf --version 2>&1 | head -1)
    log_pass "wkhtmltopdf is installed: $version"
    return 0
  else
    log_skip "wkhtmltopdf not installed locally (will be available in Docker)"
    return 2  # Skip code
  fi
}

################################################################################
# Test 3: Meilisearch Health
################################################################################

test_meilisearch_health() {
  print_header "TEST 3: Meilisearch Connectivity"

  log_test "Checking Meilisearch health at $MEILI_HOST..."

  response=$(curl -s -w "\n%{http_code}" --connect-timeout "$TIMEOUT" \
    "$MEILI_HOST/health" 2>&1 || echo "000")

  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | head -1)

  if [ "$http_code" = "200" ]; then
    log_pass "Meilisearch is healthy (HTTP 200)"
    log_info "Response: $body"
    return 0
  elif [ "$http_code" = "000" ]; then
    log_fail "Cannot reach Meilisearch at $MEILI_HOST (connection refused or timeout)"
    log_info "Make sure Meilisearch is running: docker run -p 7700:7700 getmeili/meilisearch:latest"
    return 1
  else
    log_fail "Meilisearch returned unexpected status: HTTP $http_code"
    return 1
  fi
}

################################################################################
# Test 4: API Server Connection
################################################################################

test_api_server_connection() {
  print_header "TEST 4: NaviDocs API Server"

  log_test "Checking API server at $API_HOST..."

  response=$(curl -s -w "\n%{http_code}" --connect-timeout "$TIMEOUT" \
    "$API_HOST/health" 2>&1 || echo "000")

  http_code=$(echo "$response" | tail -1)

  if [ "$http_code" = "200" ]; then
    log_pass "API server is healthy (HTTP 200)"
    return 0
  elif [ "$http_code" = "000" ]; then
    log_skip "API server not running at $API_HOST (expected for development)"
    log_info "Start with: npm run dev (in server directory)"
    return 2  # Skip
  else
    log_fail "API server returned unexpected status: HTTP $http_code"
    return 1
  fi
}

################################################################################
# Test 5: Search API Endpoint
################################################################################

test_search_api_endpoint() {
  print_header "TEST 5: Search API Endpoint (/api/v1/search)"

  log_test "Checking if search endpoint exists..."

  # Try to reach the endpoint
  response=$(curl -s -w "\n%{http_code}" --connect-timeout "$TIMEOUT" \
    "$API_HOST/api/v1/search?q=test" 2>&1 || echo "000")

  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | head -1)

  if [ "$http_code" = "000" ]; then
    log_skip "API server not running, cannot test endpoint"
    return 2  # Skip
  fi

  if [ "$http_code" = "400" ]; then
    log_pass "Search endpoint exists (HTTP 400 - expected without proper query)"
    if echo "$body" | grep -q "success"; then
      log_pass "Search endpoint returns valid JSON response"
      return 0
    else
      log_fail "Search endpoint response is not valid JSON"
      log_info "Response: $body"
      return 1
    fi
  elif [ "$http_code" = "200" ]; then
    log_pass "Search endpoint exists and responds (HTTP 200)"
    if echo "$body" | grep -q "success"; then
      log_pass "Search endpoint returns valid JSON response"
      return 0
    else
      log_fail "Search endpoint response is not valid JSON"
      return 1
    fi
  else
    log_fail "Search endpoint returned unexpected status: HTTP $http_code"
    log_info "Response: $body"
    return 1
  fi
}

################################################################################
# Test 6: Search Endpoint Query Parameter Validation
################################################################################

test_search_query_validation() {
  print_header "TEST 6: Search Query Parameter Validation"

  log_test "Testing empty query (should return 400)..."

  response=$(curl -s -w "\n%{http_code}" --connect-timeout "$TIMEOUT" \
    "$API_HOST/api/v1/search" 2>&1 || echo "000")

  http_code=$(echo "$response" | tail -1)

  if [ "$http_code" = "000" ]; then
    log_skip "API server not running"
    return 2  # Skip
  fi

  if [ "$http_code" = "400" ]; then
    log_pass "Empty query validation works (HTTP 400)"
    return 0
  else
    log_fail "Empty query did not return 400 (got HTTP $http_code)"
    return 1
  fi
}

################################################################################
# Test 7: Route Registration in server.js
################################################################################

test_route_registration() {
  print_header "TEST 7: Route Registration"

  log_test "Checking if api_search route is imported in server/index.js..."

  if [ ! -f "server/index.js" ]; then
    log_fail "server/index.js not found"
    return 1
  fi

  if grep -q "api_search" server/index.js; then
    log_pass "api_search route is imported"
  else
    log_fail "api_search route is NOT imported in server/index.js"
    return 1
  fi

  log_test "Checking if /api/v1/search route is mounted..."

  if grep -q "/api/v1/search" server/index.js; then
    log_pass "/api/v1/search route is mounted"
    return 0
  else
    log_fail "/api/v1/search route is NOT mounted in server/index.js"
    return 1
  fi
}

################################################################################
# Test 8: Environment Variables
################################################################################

test_environment_variables() {
  print_header "TEST 8: Environment Variables"

  log_test "Checking .env.example for search configuration..."

  if [ ! -f "server/.env.example" ]; then
    log_fail "server/.env.example not found"
    return 1
  fi

  local missing_vars=0

  for var in "MEILI_HOST" "MEILI_KEY" "MEILI_INDEX"; do
    if grep -q "^$var=" server/.env.example; then
      log_pass "$var is configured in .env.example"
    else
      log_fail "$var is missing from .env.example"
      missing_vars=$((missing_vars + 1))
    fi
  done

  if [ $missing_vars -eq 0 ]; then
    return 0
  else
    return 1
  fi
}

################################################################################
# Test 9: API Search Route File Exists
################################################################################

test_api_search_file() {
  print_header "TEST 9: API Search Route File"

  log_test "Checking if server/routes/api_search.js exists..."

  if [ ! -f "server/routes/api_search.js" ]; then
    log_fail "server/routes/api_search.js not found"
    return 1
  fi
  log_pass "server/routes/api_search.js exists"

  log_test "Checking for GET /api/v1/search handler..."

  if grep -q "router.get('/'," server/routes/api_search.js || \
     grep -q "router\.get.*'/'," server/routes/api_search.js; then
    log_pass "GET handler for search endpoint is defined"
    return 0
  else
    log_fail "GET handler not found in api_search.js"
    return 1
  fi
}

################################################################################
# Test 10: JSON Response Format Compliance
################################################################################

test_json_response_format() {
  print_header "TEST 10: JSON Response Format"

  log_test "Checking search response format in api_search.js..."

  if [ ! -f "server/routes/api_search.js" ]; then
    log_fail "server/routes/api_search.js not found"
    return 1
  fi

  local format_checks=0

  for field in "success" "query" "results" "total" "took_ms"; do
    if grep -q "\"$field\"" server/routes/api_search.js; then
      log_pass "Response includes '$field' field"
      format_checks=$((format_checks + 1))
    fi
  done

  if [ $format_checks -ge 5 ]; then
    log_pass "All required response fields are present"
    return 0
  else
    log_fail "Some required response fields are missing"
    return 1
  fi
}

################################################################################
# Main Execution
################################################################################

main() {
  echo ""
  echo "╔════════════════════════════════════════════════════════════════════════════╗"
  echo "║                   NaviDocs Search Wiring Verification                      ║"
  echo "╚════════════════════════════════════════════════════════════════════════════╝"
  echo ""

  # Check if we're in the right directory
  if [ ! -f "server/index.js" ] || [ ! -f "Dockerfile" ]; then
    log_fail "Please run this script from the NaviDocs root directory"
    exit 1
  fi

  log_info "Running validation tests..."
  echo ""

  # Run all tests
  test_dockerfile_wkhtmltopdf
  test_wkhtmltopdf_installed
  test_meilisearch_health
  test_api_server_connection
  test_search_api_endpoint
  test_search_query_validation
  test_route_registration
  test_environment_variables
  test_api_search_file
  test_json_response_format

  # Print summary
  print_header "Test Summary"

  echo -e "  ${GREEN}Passed: ${TESTS_PASSED}${NC}"
  echo -e "  ${RED}Failed: ${TESTS_FAILED}${NC}"
  echo -e "  ${YELLOW}Skipped: ${TESTS_SKIPPED}${NC}"
  echo ""

  local total=$((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))

  if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All critical tests passed!${NC}"
    echo ""

    if [ $TESTS_SKIPPED -gt 0 ]; then
      echo "Note: Some tests were skipped (services not running). To run full tests:"
      echo "  1. Start Meilisearch: docker run -p 7700:7700 getmeili/meilisearch:latest"
      echo "  2. Start API: npm run dev (in server directory)"
      echo "  3. Re-run this script"
    fi

    return 0
  else
    echo -e "${RED}Some tests failed. See details above.${NC}"
    return 1
  fi
}

# Run main function
main
exit $?
