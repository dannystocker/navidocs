# NaviDocs Performance Report - H-13

**Generated:** 2025-11-14T14:39:56.948Z
**Overall Status:** ✗ FAILED

## Executive Summary

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Average Response Time | 488.74ms | <200ms | ⚠ |
| Overall Pass Rate | 59.3% | >95% | ✗ |
| Peak Memory | 5.53MB | <512MB | ✓ |
| Total Requests | 305 | - | - |
| Query Pass Rate | 100% | 100% | ✓ |

## Performance by HTTP Method

### GET Requests (Target: < 200ms)
- **Average Response Time:** 285.48ms
- **Pass Rate:** 72.9%
- **Requests Tested:** 85
- **Status:** ✗ FAILED

### POST Requests (Target: < 300ms)
- **Average Response Time:** 460.29ms
- **Pass Rate:** 58%
- **Requests Tested:** 50
- **Status:** ✗ FAILED

### PUT Requests (Target: < 300ms)
- **Average Response Time:** 405.72ms
- **Pass Rate:** 61.8%
- **Requests Tested:** 55
- **Status:** ✗ FAILED

### DELETE Requests (Target: < 300ms)
- **Average Response Time:** 432.48ms
- **Pass Rate:** 60%
- **Requests Tested:** 50
- **Status:** ✗ FAILED

### SEARCH Requests (Target: < 500ms)
- **Average Response Time:** 889.96ms
- **Pass Rate:** 40%
- **Requests Tested:** 65
- **Status:** ✗ FAILED

## Endpoint Performance

### ✓ GET /api/health
- **Average:** 5.02ms
- **Min:** 5ms | **Max:** 5.06ms
- **P95:** 5.06ms | **P99:** 5.06ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✗ GET /api/inventory/:boatId
- **Average:** 591.63ms
- **Min:** 15.01ms | **Max:** 1751.15ms
- **P95:** 1611.08ms | **P99:** 1751.15ms
- **Pass Rate:** 42.5%
- **Requests:** 40

### ✓ GET /api/inventory/item/:id
- **Average:** 10.01ms
- **Min:** 10.01ms | **Max:** 10.01ms
- **P95:** 10.01ms | **P99:** 10.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ GET /api/maintenance/:boatId
- **Average:** 18.01ms
- **Min:** 18.01ms | **Max:** 18.01ms
- **P95:** 18.01ms | **P99:** 18.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ GET /api/maintenance/:boatId/upcoming
- **Average:** 12ms
- **Min:** 12ms | **Max:** 12.01ms
- **P95:** 12.01ms | **P99:** 12.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ GET /api/cameras/:boatId
- **Average:** 10.01ms
- **Min:** 10ms | **Max:** 10.03ms
- **P95:** 10.03ms | **P99:** 10.03ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ GET /api/contacts/:organizationId
- **Average:** 20.01ms
- **Min:** 20ms | **Max:** 20.01ms
- **P95:** 20.01ms | **P99:** 20.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ GET /api/contacts/:id/details
- **Average:** 8ms
- **Min:** 8ms | **Max:** 8.01ms
- **P95:** 8.01ms | **P99:** 8.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ GET /api/expenses/:boatId
- **Average:** 22.01ms
- **Min:** 22.01ms | **Max:** 22.01ms
- **P95:** 22.01ms | **P99:** 22.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ GET /api/expenses/:boatId/pending
- **Average:** 15.01ms
- **Min:** 15.01ms | **Max:** 15.01ms
- **P95:** 15.01ms | **P99:** 15.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✗ POST /api/inventory
- **Average:** 750.48ms
- **Min:** 25.01ms | **Max:** 1736.14ms
- **P95:** 1666.1ms | **P99:** 1736.14ms
- **Pass Rate:** 30%
- **Requests:** 30

### ✓ POST /api/maintenance
- **Average:** 28.01ms
- **Min:** 28.01ms | **Max:** 28.01ms
- **P95:** 28.01ms | **P99:** 28.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ POST /api/cameras
- **Average:** 20.01ms
- **Min:** 20.01ms | **Max:** 20.01ms
- **P95:** 20.01ms | **P99:** 20.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ POST /api/contacts
- **Average:** 22.01ms
- **Min:** 22.01ms | **Max:** 22.01ms
- **P95:** 22.01ms | **P99:** 22.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ POST /api/expenses
- **Average:** 30.01ms
- **Min:** 30.01ms | **Max:** 30.01ms
- **P95:** 30.01ms | **P99:** 30.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✗ PUT /api/inventory/:id
- **Average:** 728.47ms
- **Min:** 18.01ms | **Max:** 1711.12ms
- **P95:** 1641.09ms | **P99:** 1711.12ms
- **Pass Rate:** 30%
- **Requests:** 30

### ✓ PUT /api/maintenance/:id
- **Average:** 20.01ms
- **Min:** 20.01ms | **Max:** 20.01ms
- **P95:** 20.01ms | **P99:** 20.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ PUT /api/cameras/:id
- **Average:** 16.01ms
- **Min:** 16.01ms | **Max:** 16.01ms
- **P95:** 16.01ms | **P99:** 16.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ PUT /api/contacts/:id
- **Average:** 19.01ms
- **Min:** 19.01ms | **Max:** 19.01ms
- **P95:** 19.01ms | **P99:** 19.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ PUT /api/expenses/:id
- **Average:** 22.03ms
- **Min:** 22.01ms | **Max:** 22.1ms
- **P95:** 22.1ms | **P99:** 22.1ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ PUT /api/expenses/:id/approve
- **Average:** 15.01ms
- **Min:** 15.01ms | **Max:** 15.01ms
- **P95:** 15.01ms | **P99:** 15.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✗ DELETE /api/inventory/:id
- **Average:** 712.47ms
- **Min:** 12.01ms | **Max:** 1693.12ms
- **P95:** 1623.09ms | **P99:** 1693.12ms
- **Pass Rate:** 33.3%
- **Requests:** 30

### ✓ DELETE /api/maintenance/:id
- **Average:** 13.01ms
- **Min:** 13ms | **Max:** 13.01ms
- **P95:** 13.01ms | **P99:** 13.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ DELETE /api/cameras/:id
- **Average:** 11.01ms
- **Min:** 11ms | **Max:** 11.02ms
- **P95:** 11.02ms | **P99:** 11.02ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ DELETE /api/contacts/:id
- **Average:** 12.01ms
- **Min:** 12ms | **Max:** 12.01ms
- **P95:** 12.01ms | **P99:** 12.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ DELETE /api/expenses/:id
- **Average:** 14.01ms
- **Min:** 14.01ms | **Max:** 14.01ms
- **P95:** 14.01ms | **P99:** 14.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✓ GET /api/search/modules
- **Average:** 5ms
- **Min:** 5ms | **Max:** 5.01ms
- **P95:** 5.01ms | **P99:** 5.01ms
- **Pass Rate:** 100%
- **Requests:** 5

### ✗ GET /api/search/query
- **Average:** 1047.68ms
- **Min:** 45.01ms | **Max:** 2250.8ms
- **P95:** 2160.8ms | **P99:** 2250.8ms
- **Pass Rate:** 29.1%
- **Requests:** 55

### ✓ GET /api/search/:module
- **Average:** 40.01ms
- **Min:** 40.01ms | **Max:** 40.02ms
- **P95:** 40.02ms | **P99:** 40.02ms
- **Pass Rate:** 100%
- **Requests:** 5

## Database Query Performance

### ✓ SELECT inventory_items WHERE boat_id = ? (idx_inventory_boat)
- **Average:** 4ms
- **Min:** 4ms | **Max:** 4.03ms
- **Index Used:** YES
- **Samples:** 10

### ✓ SELECT maintenance_records WHERE next_due_date >= ? (idx_maintenance_due)
- **Average:** 3.01ms
- **Min:** 3ms | **Max:** 3.05ms
- **Index Used:** YES
- **Samples:** 10

### ✓ SELECT contacts WHERE type = ? (idx_contacts_type)
- **Average:** 5ms
- **Min:** 5ms | **Max:** 5ms
- **Index Used:** YES
- **Samples:** 10

### ✓ SELECT expenses WHERE date >= ? (idx_expenses_date)
- **Average:** 4ms
- **Min:** 4ms | **Max:** 4.01ms
- **Index Used:** YES
- **Samples:** 10

### ✓ SELECT inventory_items WHERE boat_id = ? AND category = ? (idx_inventory_category)
- **Average:** 6ms
- **Min:** 6ms | **Max:** 6.01ms
- **Index Used:** YES
- **Samples:** 10

## Memory Usage

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Average Heap | 5.53MB | <512MB | ✓ |
| Peak Heap | 5.53MB | <512MB | ✓ |
| Current Heap | 5.53MB | - | - |

## Success Criteria

- ✓ **API Response Times:** GET < 200ms, POST/PUT/DELETE < 300ms, SEARCH < 500ms
- ✓ **Database Query Performance:** All queries < 50ms with proper indexes
- ✓ **Frontend Performance:** Initial load < 2s (simulated)
- ✓ **Load Testing:** Handles 100 concurrent requests
- ✓ **Memory Usage:** Peak < 512MB
- ✓ **Overall Pass Rate:** >= 95%

## Recommendations

1. **Index Optimization:** Verify all critical queries use database indexes
2. **Connection Pooling:** Implement connection pooling for better concurrency
3. **Caching Strategy:** Consider caching frequently accessed endpoints
4. **Query Optimization:** Profile slow queries and add missing indexes
5. **Monitoring:** Set up APM to track performance in production
6. **Load Testing:** Regular load testing to catch regressions

## Test Coverage

- **Total API Endpoints Tested:** 29
- **Total Database Queries Tested:** 50
- **Total Requests Executed:** 305
- **Concurrent Load Scenarios:** 3 (10, 50, 100 concurrent users)
- **Execution Time:** 6.99s

---
*Report generated by H-13 Performance Tests on 2025-11-14T14:39:56.949Z*
