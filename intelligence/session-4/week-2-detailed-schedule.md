# Week 2: Core Integrations - Detailed Schedule
**Period:** November 20-26, 2025
**Assigned Agent:** S4-H02
**Sprint Phase:** Foundation Build (Week 1) → Core Integrations (Week 2)

---

## Executive Summary

Week 2 focuses on building warranty tracking APIs and Home Assistant integration on top of Week 1's database foundation. This week implements the critical APIs that users will interact with for warranty management and enables integration with Home Assistant smart home platforms for automated alerts and notifications.

**Total Estimated Hours:** 48 hours (6-8 hour days)
**Dependencies:** Week 1 foundation (DB migrations, Event Bus, notification templates)
**Deliverables:** Warranty CRUD APIs, expiration alert endpoints, Home Assistant webhook integration

---

## Week 1 Dependency Validation

**REQUIRED deliverables from S4-H01 (Week 1) to unblock Week 2:**

1. ✓ **Database Migrations**
   - `warranty_tracking` table created with all columns and indexes
   - `webhooks` table created for webhook management
   - `sale_workflows` table created (needed for scope)
   - Migration scripts tested with rollback procedures

2. ✓ **Event Bus Service**
   - `server/services/event-bus.service.js` deployed
   - Redis pub/sub integration functional
   - Event publishing with topic-based routing (WARRANTY_EXPIRING, DOCUMENT_UPLOADED)
   - Error handling and retry logic implemented

3. ✓ **Webhook Service**
   - `server/services/webhook.service.js` deployed
   - HTTP POST delivery with exponential backoff (1s, 2s, 4s)
   - HMAC-SHA256 signature generation
   - Integration tests passing

4. ✓ **Notification Templates**
   - `notification_templates` table populated
   - WARRANTY_EXPIRING templates (90/30/14 day variants) seeded
   - Template rendering service ready

5. ✓ **Background Worker Infrastructure**
   - BullMQ job queue configured
   - Worker process can be started and monitored
   - Health check endpoints available

**Confirmation Protocol:** Before starting Day 1, S4-H02 MUST confirm Week 1 completion via IF.bus request to S4-H01.

---

## Day 1-2: Warranty Tracking APIs (Nov 20-21)

### Day 1: CRUD Operations & Service Layer (Nov 20)

**Goal:** Create warranty service layer and implement POST/GET/PUT/DELETE endpoints

#### Morning Session: Service Layer (4 hours)

**Task 1.1: Create Warranty Service (2.5 hours)**

- **File:** `server/services/warranty.service.js`
- **Implementation:**
  ```javascript
  // Core functions needed:
  - createWarranty(boatId, warrantyData)
      * Validates input (purchase_date is ISO string, warranty_period_months is positive integer)
      * Calculates expiration_date = purchase_date + warranty_period_months months
      * Sets status = 'active'
      * Returns warranty object with id, created_at, updated_at
      * Throw ValidationError if constraints violated

  - getWarranty(id, userId)
      * Fetches from DB
      * Verifies ownership (user owns the boat)
      * Returns warranty with calculated days_until_expiration
      * Throw NotFoundError if warranty doesn't exist

  - updateWarranty(id, updates, userId)
      * Only allows updates to: item_name, provider, coverage_amount, claim_instructions
      * Recalculates expiration_date if warranty_period_months provided
      * Does NOT allow changing boat_id
      * Returns updated warranty

  - deleteWarranty(id, userId)
      * Soft delete (set status = 'deleted')
      * Emit WARRANTY_DELETED event
      * Returns success

  - listWarrantiesForBoat(boatId, userId, filters)
      * Filters: status ('active', 'expired', 'all')
      * Returns array with calculated days_until_expiration
      * Ordered by expiration_date ascending
  ```

- **Dependencies:**
  - Week 1: `warranty_tracking` table
  - Date/time utility: `moment.js` or `date-fns`
  - Validation: `joi` schema library

- **Tests:**
  - Unit test: `calculateExpirationDate('2023-01-15', 24) === '2025-01-15'`
  - Unit test: Validation rejects negative warranty_period_months
  - Unit test: Throws NotFoundError on non-existent warranty

**Task 1.2: Create Warranty Routes (1.5 hours)**

- **File:** `server/routes/warranty.routes.js`
- **Endpoints:**
  ```
  POST /api/warranties
    - Auth: Required (Bearer token)
    - Body: { boat_id, item_name, provider, purchase_date, warranty_period_months, coverage_amount?, claim_instructions? }
    - Response: 201 { id, boat_id, item_name, ..., expiration_date, days_until_expiration, created_at }
    - Errors: 400 (validation), 401 (auth), 409 (duplicate)

  GET /api/warranties/:id
    - Auth: Required
    - Response: 200 { warranty object }
    - Errors: 401, 404

  PUT /api/warranties/:id
    - Auth: Required
    - Body: { item_name?, provider?, coverage_amount?, claim_instructions? }
    - Response: 200 { updated warranty }
    - Errors: 400, 401, 404

  DELETE /api/warranties/:id
    - Auth: Required
    - Response: 200 { success: true }
    - Errors: 401, 404
  ```

- **Middleware Chain:**
  - `authenticateToken` (verify JWT)
  - `validateTenant` (user belongs to boat's organization)
  - `validateInput` (Joi schema)
  - `errorHandler` (catch and format errors)

#### Afternoon Session: API Testing & Documentation (3 hours)

**Task 1.3: Integration Tests for CRUD (2 hours)**

- **File:** `test/routes/warranty.routes.test.js`
- **Test Suite:**
  ```javascript
  describe('POST /api/warranties', () => {
    test('creates warranty with valid data', async () => {
      const response = await request(app)
        .post('/api/warranties')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          boat_id: 'boat-123',
          item_name: 'Engine',
          provider: 'Caterpillar',
          purchase_date: '2023-01-15',
          warranty_period_months: 24,
          coverage_amount: 50000
        });

      expect(response.status).toBe(201);
      expect(response.body.expiration_date).toBe('2025-01-15');
      expect(response.body.days_until_expiration).toBeGreaterThan(0);
    });

    test('rejects without authentication', async () => {
      const response = await request(app)
        .post('/api/warranties')
        .send({ ... });
      expect(response.status).toBe(401);
    });

    test('rejects invalid warranty period', async () => {
      const response = await request(app)
        .post('/api/warranties')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ..., warranty_period_months: -5 });
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/warranties/:id', () => {
    test('returns warranty for owner', async () => { ... });
    test('forbids non-owner access (tenant isolation)', async () => { ... });
  });

  describe('PUT /api/warranties/:id', () => {
    test('updates warranty fields', async () => { ... });
    test('prevents boat_id change', async () => { ... });
  });

  describe('DELETE /api/warranties/:id', () => {
    test('soft deletes warranty', async () => { ... });
    test('emits WARRANTY_DELETED event', async () => { ... });
  });
  ```

- **Coverage Target:** 80% (all code paths)
- **Test Data:** Use fixtures in `test/fixtures/warranty.fixtures.js`

**Task 1.4: API Documentation (1 hour)**

- **File:** Update `intelligence/session-4/api-spec.yaml` (Week 8 deliverable, add to this week's work)
- **Document:**
  - Request/response schemas for all endpoints
  - Error codes (400, 401, 403, 404, 409)
  - Example curl commands
  - Auth header format

**Acceptance Criteria for Day 1:**
- [ ] All 4 CRUD endpoints created and functional
- [ ] Service layer has unit test coverage ≥ 80%
- [ ] Integration tests pass for CRUD operations
- [ ] Tenant isolation verified (user A cannot see user B's warranties)
- [ ] Error handling for invalid input (400), missing auth (401), not found (404)
- [ ] Expiration date calculation verified for various warranty periods
- [ ] No production credentials in code (all use env vars)

---

### Day 2: Expiring Warranties & Boat Warranties Endpoints (Nov 21)

**Goal:** Implement specialized GET endpoints for warranty insights

#### Morning Session: Expiring Warranties Endpoint (4 hours)

**Task 2.1: Expiring Warranties Endpoint (3 hours)**

- **File:** Add to `server/routes/warranty.routes.js`
- **New Endpoint:**
  ```
  GET /api/warranties/expiring
    - Auth: Required
    - Query Params:
        days: integer (90|30|14) - default: 30
        boat_id: string (optional) - filter by single boat
        include_overdue: boolean (default: false) - include already expired

    - Response: 200 {
        warranties: [
          {
            id, boat_id, item_name, provider,
            purchase_date, warranty_period_months,
            expiration_date,
            days_until_expiration,  // negative if expired
            status ('active'|'expired'|'claimed'),
            coverage_amount,
            urgency_level ('critical'|'warning'|'info')  // calculated from days
          }
        ],
        summary: {
          total_count: number,
          critical_count: number,  // expires < 14 days
          warning_count: number,    // expires 14-30 days
          info_count: number        // expires 30-90 days
        }
      }

    - Errors: 401 (auth), 400 (invalid days param)
  ```

- **Implementation Details:**
  ```javascript
  // Logic flow:
  1. Validate days parameter (only 14, 30, 90 allowed)
  2. Get current date in user's timezone (configurable)
  3. Calculate date range: today to today + N days
  4. Query warranty_tracking table:
     SELECT * FROM warranty_tracking
     WHERE status = 'active'
     AND expiration_date <= today + N days
     AND expiration_date > today (to exclude already expired by default)
     AND boat_id = user's boats (tenant isolation)
     AND IF boat_id filter provided, filter further
  5. Calculate days_until_expiration for each
  6. Assign urgency_level based on days_until_expiration
  7. Sort by expiration_date ascending (most urgent first)
  8. Return with summary counts
  ```

- **Edge Cases to Handle:**
  - Warranty already expired (days_until_expiration is negative)
  - Warranty expiring today (days_until_expiration = 0)
  - No warranties found (return empty array with summary zeros)
  - Multiple boats owned by user (tenant isolation must filter)

**Task 2.2: Boat Warranties Endpoint (1 hour)**

- **File:** Add to `server/routes/boat.routes.js` (or `warranty.routes.js`)
- **New Endpoint:**
  ```
  GET /api/boats/:id/warranties
    - Auth: Required
    - Response: 200 {
        boat_id: string,
        boat_name: string,
        warranties: [
          { id, item_name, provider, expiration_date, days_until_expiration, status, coverage_amount }
        ],
        summary: {
          total_count: number,
          active_count: number,
          expired_count: number,
          total_coverage_amount: number,  // sum of coverage_amount
          next_expiration_date: date    // soonest expiration
        }
      }

    - Errors: 401, 404 (boat not found)
  ```

- **Implementation:**
  ```javascript
  // Logic:
  1. Validate boat exists and user owns it
  2. Query all warranties for boat_id (no date filter)
  3. Calculate days_until_expiration for each
  4. Mark status: 'active' (days > 0), 'expired' (days <= 0), 'claimed'
  5. Calculate summary:
     - total_coverage_amount = SUM(coverage_amount)
     - next_expiration_date = MIN(expiration_date WHERE status != 'claimed')
  6. Return with warranty flag ('⚠️ Warning' badge if any expire < 30 days)
  ```

#### Afternoon Session: Testing & Integration (3 hours)

**Task 2.3: Integration Tests for Expiring & Boat Endpoints (2 hours)**

- **File:** Add to `test/routes/warranty.routes.test.js`
- **Test Cases:**
  ```javascript
  describe('GET /api/warranties/expiring', () => {
    test('returns warranties expiring in 30 days by default', async () => {
      // Create warranty expiring in 15 days
      // Call endpoint without days param
      // Verify warranty returned
    });

    test('supports 14, 30, 90 day filters', async () => {
      // Create warranties at 10, 20, 40, 100 days
      // Query with days=14 → returns 10 days warranty
      // Query with days=90 → returns 10, 20, 40 day warranties
    });

    test('excludes already expired warranties by default', async () => {
      // Create warranty expiring yesterday
      // Call without include_overdue param
      // Verify not returned
    });

    test('includes overdue with include_overdue=true', async () => {
      // Create warranty expiring yesterday
      // Call with include_overdue=true
      // Verify returned with days_until_expiration = -1
    });

    test('filters by boat_id if provided', async () => {
      // Create warranties for boat A and boat B
      // Call with boat_id filter for boat A
      // Verify only boat A warranties returned
    });

    test('returns summary counts', async () => {
      // Create warranties: 5 days, 15 days, 40 days
      // Verify summary: critical_count=1, warning_count=1, info_count=1
    });

    test('enforces tenant isolation', async () => {
      // Create warranties for user A's boats and user B's boats
      // Login as user A
      // Verify only user A's warranties returned
    });
  });

  describe('GET /api/boats/:id/warranties', () => {
    test('returns all warranties for a boat', async () => {
      // Create 3 warranties for boat A
      // Call endpoint
      // Verify all 3 returned with flags
    });

    test('calculates total_coverage_amount', async () => {
      // Create warranties with coverage: 10k, 20k, 30k
      // Verify summary.total_coverage_amount = 60k
    });

    test('identifies next_expiration_date', async () => {
      // Create warranties expiring: 2025-06-01, 2025-03-01, 2025-09-01
      // Verify next_expiration_date = 2025-03-01
    });
  });
  ```

- **Coverage Target:** 100% (both endpoints fully tested)

**Task 2.4: Performance Testing (1 hour)**

- **Scenario:** User with 500+ warranties across 20+ boats
- **Requirement:** `GET /api/warranties/expiring` returns < 200ms
- **Method:**
  - Create test dataset with 500 warranties
  - Measure query execution time
  - Verify indexes on expiration_date, boat_id used
  - Optimize if needed (add composite index on (boat_id, expiration_date, status))

**Acceptance Criteria for Day 2:**
- [ ] GET /api/warranties/expiring returns correct warranties for 14/30/90 day filters
- [ ] Query excludes already-expired warranties by default
- [ ] Summary counts accurate (critical/warning/info)
- [ ] GET /api/boats/:id/warranties returns all warranties with total_coverage_amount
- [ ] Tenant isolation verified for both endpoints
- [ ] All tests passing (100% coverage for new endpoints)
- [ ] Performance: expiring warranties query < 200ms for 500 warranties
- [ ] Error handling: invalid days param returns 400 with clear message

---

## Day 3-5: Home Assistant Integration (Nov 22-24)

### Day 3: Webhook Registration & Validation (Nov 22)

**Goal:** Enable users to register Home Assistant webhooks and validate reachability

#### Morning Session: Webhook Registration Endpoint (4 hours)

**Task 3.1: Home Assistant Integration Routes (2.5 hours)**

- **File:** `server/routes/integrations.routes.js` (new file)
- **Endpoints:**
  ```
  POST /api/integrations/home-assistant
    - Auth: Required
    - Body: {
        url: string,        // e.g., https://ha.example.com/api/webhook/navidocs-12345
        topics: string[],   // e.g., ["WARRANTY_EXPIRING", "DOCUMENT_UPLOADED"]
        name?: string       // Display name for the integration
      }

    - Validation:
      * URL must be HTTPS (or http://localhost for testing)
      * URL must be reachable (HEAD request succeeds)
      * topics must be valid (check against event-bus topics)

    - Response: 201 {
        id: string,
        url: string,
        topics: string[],
        name: string,
        status: 'active',
        last_test_at: datetime,
        last_test_status: 'success',
        created_at: datetime
      }

    - Errors:
      * 400: Invalid URL format
      * 400: URL not reachable (timeout, DNS failure)
      * 400: Invalid topic (not in allowed list)
      * 401: Auth required
      * 409: Integration already exists for this URL
  ```

  ```
  GET /api/integrations/home-assistant
    - Auth: Required
    - Response: 200 {
        integrations: [
          {
            id, url, topics, name, status,
            last_test_at, last_test_status,
            created_at
          }
        ]
      }
    - Errors: 401
  ```

  ```
  GET /api/integrations/home-assistant/:id
    - Auth: Required
    - Response: 200 { integration object }
    - Errors: 401, 404
  ```

  ```
  DELETE /api/integrations/home-assistant/:id
    - Auth: Required
    - Response: 200 { success: true }
    - Errors: 401, 404
  ```

  ```
  POST /api/integrations/home-assistant/:id/test
    - Auth: Required
    - Purpose: Test webhook reachability
    - Response: 200 {
        status: 'success' | 'failure',
        http_status: number,
        response_time_ms: number,
        error_message?: string,
        tested_at: datetime
      }
    - Errors: 401, 404
  ```

- **Implementation Notes:**
  - Store in `webhooks` table from Week 1 migrations
  - Use `organization_id` to isolate integrations per customer
  - Generate `secret` for HMAC signature validation (stored hashed)
  - Topics stored as JSON array in database

**Task 3.2: Home Assistant Service Layer (1.5 hours)**

- **File:** `server/services/home-assistant.service.js`
- **Functions Needed:**
  ```javascript
  - registerWebhook(organizationId, url, topics, name)
      * Validate URL format and reachability
      * Check topics are valid event types
      * Store in webhooks table
      * Return integration object

  - validateWebhookUrl(url)
      * Send HEAD request to URL (5s timeout)
      * Return true if 2xx or 3xx response
      * Return false if timeout, 4xx, 5xx
      * Throw error with details if network error

  - getWebhooksForEvent(organizationId, eventType)
      * Query webhooks table
      * Filter by organization_id and topics contains eventType
      * Return array of webhook objects

  - testWebhookDelivery(webhookId, eventType)
      * Get webhook URL
      * Create sample event payload
      * Send POST with signature header
      * Measure response time
      * Return { status, http_status, response_time_ms, tested_at }

  - forwardEventToWebhooks(event)
      * Get webhooks subscribed to event.type
      * For each webhook:
        - Generate HMAC-SHA256 signature of payload
        - Send POST request (async, with retry logic from Week 1)
        - Log delivery status
        - Update webhooks.last_delivery_at and last_delivery_status
  ```

#### Afternoon Session: URL Validation & Testing (3 hours)

**Task 3.3: Webhook URL Validation & Reachability (2 hours)**

- **Implementation:**
  ```javascript
  // Validation logic:
  1. Parse URL with URL.parse() (check for malformed URLs)
  2. Verify protocol is https or http://localhost
  3. Verify hostname resolves (DNS check)
  4. Send HEAD request to URL:
     - Timeout: 5 seconds
     - Follow redirects: max 1
     - Expect 2xx/3xx response
  5. If all checks pass, webhook can be registered
  6. If reachability fails, return specific error:
     - "URL not reachable: Timeout (5000ms)"
     - "URL not reachable: HTTP 403 Forbidden"
     - "URL not reachable: DNS lookup failed"
  ```

- **Dependencies:**
  - Node.js `https` module for validation
  - `axios` for HTTP requests (already in project)
  - Error logging to audit trail

**Task 3.4: Integration Tests for Registration (1 hour)**

- **File:** `test/routes/integrations.routes.test.js`
- **Test Suite:**
  ```javascript
  describe('POST /api/integrations/home-assistant', () => {
    test('registers webhook with valid URL and topics', async () => {
      const response = await request(app)
        .post('/api/integrations/home-assistant')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          url: 'https://ha.example.com/api/webhook/navidocs-abc123',
          topics: ['WARRANTY_EXPIRING', 'DOCUMENT_UPLOADED'],
          name: 'Home Lab HA'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('active');
      expect(response.body.topics).toEqual(['WARRANTY_EXPIRING', 'DOCUMENT_UPLOADED']);
    });

    test('rejects unreachable URL', async () => {
      const response = await request(app)
        .post('/api/integrations/home-assistant')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          url: 'https://unreachable.example.com/webhook',
          topics: ['WARRANTY_EXPIRING']
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not reachable');
    });

    test('rejects invalid topic', async () => {
      const response = await request(app)
        .post('/api/integrations/home-assistant')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          url: 'https://ha.example.com/webhook',
          topics: ['INVALID_TOPIC']
        });

      expect(response.status).toBe(400);
    });

    test('prevents duplicate webhooks for same URL', async () => {
      // Register first time - success
      // Register second time with same URL - fail with 409
    });
  });

  describe('GET /api/integrations/home-assistant/:id/test', () => {
    test('tests webhook reachability', async () => {
      const response = await request(app)
        .post(`/api/integrations/home-assistant/${webhookId}/test`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toMatch(/success|failure/);
      expect(response.body.response_time_ms).toBeGreaterThan(0);
    });
  });
  ```

**Acceptance Criteria for Day 3:**
- [ ] POST /api/integrations/home-assistant accepts webhook URL and topics
- [ ] URL validation rejects non-HTTPS URLs (except localhost)
- [ ] Reachability check prevents registration of unreachable URLs
- [ ] Topics validated against allowed event types from event-bus
- [ ] Integration stored in webhooks table with organization_id
- [ ] GET endpoints return registered integrations
- [ ] DELETE endpoint soft-deletes integration
- [ ] Test endpoint verifies webhook reachability
- [ ] All tests passing with 100% coverage
- [ ] No authorization bypass (tenant isolation verified)

---

### Day 4: Event Forwarding & Home Assistant Documentation (Nov 23)

**Goal:** Implement event forwarding to Home Assistant and provide integration examples

#### Morning Session: Event-to-Webhook Forwarding (4 hours)

**Task 4.1: Event Publishing to Webhooks (2.5 hours)**

- **File:** Extend `server/services/home-assistant.service.js`
- **Integration with Event Bus:**
  ```javascript
  // In event-bus.service.js (from Week 1), add webhook forwarding:

  eventBus.on('WARRANTY_EXPIRING', async (event) => {
    // Forward to Home Assistant webhooks
    const organization_id = event.organization_id;

    const haService = require('./home-assistant.service');
    await haService.forwardEventToWebhooks(organization_id, event);
  });

  eventBus.on('DOCUMENT_UPLOADED', async (event) => {
    const organization_id = event.organization_id;
    await haService.forwardEventToWebhooks(organization_id, event);
  });
  ```

- **Webhook Payload Format:**
  ```json
  {
    "event_type": "WARRANTY_EXPIRING",
    "organization_id": "org-123",
    "timestamp": "2025-11-20T14:30:00Z",
    "data": {
      "warranty_id": "warranty-456",
      "boat_id": "boat-789",
      "item_name": "Engine",
      "expiration_date": "2025-12-13",
      "days_until_expiration": 30,
      "coverage_amount": 50000
    }
  }
  ```

- **Webhook Delivery Logic:**
  ```javascript
  async forwardEventToWebhooks(organizationId, event) {
    // Get webhooks subscribed to this event
    const webhooks = await db.query(
      `SELECT * FROM webhooks
       WHERE organization_id = ?
       AND json_array_contains(topics, ?)
       AND status = 'active'`,
      [organizationId, event.event_type]
    );

    for (const webhook of webhooks) {
      // Generate signature
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(event))
        .digest('hex');

      try {
        // Send POST with retry (exponential backoff from Week 1)
        const response = await this.sendWithRetry(
          webhook.url,
          event,
          { 'X-NaviDocs-Signature': signature },
          3  // max retries
        );

        // Log success
        await db.query(
          `UPDATE webhooks
           SET last_delivery_at = NOW(), last_delivery_status = 'success'
           WHERE id = ?`,
          [webhook.id]
        );

        logger.info(`Webhook delivered`, {
          webhook_id: webhook.id,
          event_type: event.event_type,
          status: response.status
        });
      } catch (error) {
        // Log failure
        await db.query(
          `UPDATE webhooks
           SET last_delivery_status = 'failed'
           WHERE id = ?`,
          [webhook.id]
        );

        logger.error(`Webhook delivery failed`, {
          webhook_id: webhook.id,
          event_type: event.event_type,
          error: error.message
        });
      }
    }
  }
  ```

**Task 4.2: Integration Tests for Event Forwarding (1.5 hours)**

- **File:** `test/services/home-assistant.service.test.js`
- **Test Cases:**
  ```javascript
  describe('HomeAssistantService.forwardEventToWebhooks', () => {
    test('sends event to subscribed webhooks', async () => {
      // Create webhook registered for WARRANTY_EXPIRING
      // Publish WARRANTY_EXPIRING event
      // Verify POST sent to webhook URL
      // Verify signature header included
    });

    test('includes event data in POST body', async () => {
      // Create webhook
      // Publish event
      // Capture request body
      // Verify contains warranty_id, expiration_date, etc.
    });

    test('retries failed deliveries with backoff', async () => {
      // Mock webhook to fail 2x, then succeed
      // Publish event
      // Verify retry logic called 3 times
      // Verify exponential backoff (1s, 2s, 4s) applied
    });

    test('logs delivery status', async () => {
      // Publish event
      // Verify webhooks.last_delivery_at updated
      // Verify webhooks.last_delivery_status = 'success'
    });

    test('skips inactive webhooks', async () => {
      // Create inactive webhook
      // Publish event
      // Verify webhook NOT called
    });

    test('only sends to subscribed topics', async () => {
      // Create webhook subscribed only to DOCUMENT_UPLOADED
      // Publish WARRANTY_EXPIRING event
      // Verify webhook NOT called
      // Publish DOCUMENT_UPLOADED event
      // Verify webhook IS called
    });
  });
  ```

#### Afternoon Session: Home Assistant Documentation & Examples (3 hours)

**Task 4.3: Home Assistant Integration Documentation (3 hours)**

- **File:** `docs/home-assistant-integration.md` (create in project root)
- **Content Structure:**
  ```markdown
  # Home Assistant Integration Guide

  ## Overview
  NaviDocs integrates with Home Assistant to send yacht warranty and document events.
  Enables automation: warranty expiration → notification, document upload → logging, etc.

  ## Prerequisites
  - Home Assistant instance running (any version)
  - NaviDocs account with boat data
  - Internet connection (Home Assistant must be reachable from NaviDocs cloud)

  ## Setup Steps

  ### Step 1: Create Webhook URL in Home Assistant
  ```yaml
  # In Home Assistant configuration.yaml, add automation trigger:
  automation:
    - id: "navidocs_warranty_expiring"
      alias: "NaviDocs Warranty Expiring Alert"
      trigger:
        webhook_id: "navidocs-webhook-12345"  # Generate random ID
      action:
        - service: notify.mobile_app_phone
          data:
            title: "Boat Warranty Expiring"
            message: "{{ trigger.data.data.item_name }} expires in {{ trigger.data.data.days_until_expiration }} days"
  ```

  ### Step 2: Get Webhook URL
  ```
  Home Assistant URL: https://home.example.com
  Webhook ID: navidocs-webhook-12345
  Full Webhook URL: https://home.example.com/api/webhook/navidocs-webhook-12345
  ```

  ### Step 3: Register in NaviDocs
  - Login to NaviDocs app
  - Go to Settings → Integrations
  - Click "Add Home Assistant Integration"
  - Paste webhook URL: https://home.example.com/api/webhook/navidocs-webhook-12345
  - Select topics: WARRANTY_EXPIRING, DOCUMENT_UPLOADED
  - Click "Test Connection" to verify
  - Save

  ## Event Examples

  ### WARRANTY_EXPIRING Event
  ```json
  {
    "event_type": "WARRANTY_EXPIRING",
    "timestamp": "2025-11-20T14:30:00Z",
    "data": {
      "warranty_id": "warranty-456",
      "boat_id": "boat-789",
      "boat_name": "Azimut 55S",
      "item_name": "Engine",
      "provider": "Caterpillar",
      "expiration_date": "2025-12-13",
      "days_until_expiration": 30,
      "coverage_amount": 50000
    }
  }
  ```

  ### DOCUMENT_UPLOADED Event
  ```json
  {
    "event_type": "DOCUMENT_UPLOADED",
    "timestamp": "2025-11-20T14:30:00Z",
    "data": {
      "document_id": "doc-111",
      "boat_id": "boat-789",
      "boat_name": "Azimut 55S",
      "file_name": "Engine_Manual.pdf",
      "file_size": 2048000,
      "uploaded_by": "John Doe"
    }
  }
  ```

  ## Example Automations

  ### Notification on Warranty Expiring (30 days)
  ```yaml
  automation:
    - id: "navidocs_warranty_alert"
      alias: "NaviDocs Warranty Alert"
      trigger:
        webhook_id: "navidocs-webhook-abc"
      condition:
        - condition: template
          value_template: "{{ trigger.data.data.days_until_expiration == 30 }}"
      action:
        - service: notify.mobile_app_phone
          data:
            title: "Engine Warranty Expiring"
            message: "30 days remaining on {{ trigger.data.data.item_name }} warranty"
  ```

  ### Log Document Uploads
  ```yaml
  automation:
    - id: "navidocs_doc_log"
      alias: "Log NaviDocs Document Upload"
      trigger:
        webhook_id: "navidocs-webhook-xyz"
      action:
        - service: logbook.log
          data:
            name: "Document Upload"
            message: "{{ trigger.data.data.file_name }} uploaded to {{ trigger.data.data.boat_name }}"
  ```

  ### Create Calendar Events for Expirations
  ```yaml
  automation:
    - id: "navidocs_warranty_calendar"
      alias: "Add Warranty to Calendar"
      trigger:
        webhook_id: "navidocs-webhook-def"
      action:
        - service: calendar.create_event
          target:
            entity_id: calendar.maintenance
          data:
            summary: "{{ trigger.data.data.item_name }} warranty expires"
            description: "Coverage: ${{ trigger.data.data.coverage_amount }}"
            start_date_time: "{{ trigger.data.data.expiration_date }}T09:00:00"
  ```

  ## Troubleshooting

  ### Webhook Not Receiving Events
  - Verify webhook URL is correct in NaviDocs Settings
  - Check Home Assistant logs for webhook errors
  - Click "Test Connection" in NaviDocs to verify reachability
  - Ensure Home Assistant is accessible from internet (if using cloud)

  ### Events Not Triggering Automations
  - Verify automation trigger.webhook_id matches NaviDocs webhook ID
  - Check automation is enabled in Home Assistant UI
  - Review Home Assistant automation logs

  ### Signature Verification (Advanced)
  All webhook requests include X-NaviDocs-Signature header:
  ```
  X-NaviDocs-Signature: sha256=<hmac-sha256-hash-of-body>
  ```
  Use to verify requests are authentic (optional but recommended)

  ## FAQ
  Q: Can I use multiple Home Assistant instances?
  A: Yes, register each with separate webhook URLs in NaviDocs

  Q: How often are warranty events sent?
  A: WARRANTY_EXPIRING sent once per day (for warranties expiring < 90 days)

  Q: Can I trigger NaviDocs actions from Home Assistant?
  A: Not yet. Future roadmap: Home Assistant service calls to NaviDocs API

  ## Support
  Email: support@navidocs.app
  ```

**Acceptance Criteria for Day 4:**
- [ ] Event forwarding implemented from event-bus to webhooks
- [ ] Warranty events sent with correct data payload
- [ ] Document upload events sent to registered webhooks
- [ ] Signature header (HMAC-SHA256) included in all requests
- [ ] Delivery retry logic applied (exponential backoff)
- [ ] Delivery status logged in webhooks table
- [ ] Integration tests verify event → webhook delivery
- [ ] Home Assistant documentation complete with examples
- [ ] 3+ automation examples provided (notifications, calendar, logging)
- [ ] All tests passing (100% coverage)

---

### Day 5: MQTT Integration & Camera Stretch Goals (Nov 24)

**Goal:** Optional stretch goals for advanced Home Assistant integrations

#### All-Day Session: Stretch Goals (7 hours)

**Task 5.1: MQTT Integration (Optional, 3.5 hours)**

- **Purpose:** Enable NaviDocs to publish events to MQTT broker (Home Assistant uses MQTT)
- **Scope:** Research + prototype only (not required for MVP)

- **File:** `server/services/mqtt.service.js` (if implemented)
- **Implementation:**
  ```javascript
  // Design (not full implementation):
  class MQTTService {
    constructor(brokerUrl) {
      // Connect to MQTT broker (mosquitto or similar)
      this.client = mqtt.connect(brokerUrl);
    }

    publishEvent(event) {
      const topic = this.getTopic(event.event_type, event.boat_id);
      const payload = JSON.stringify(event.data);
      this.client.publish(topic, payload, { qos: 1, retain: false });
    }

    getTopic(eventType, boatId) {
      // Topic structure: navidocs/boats/{boat_id}/events/{event_type}
      // Example: navidocs/boats/boat-789/events/warranty_expiring
      return `navidocs/boats/${boatId}/events/${eventType.toLowerCase()}`;
    }
  }
  ```

- **Testing:** Mock MQTT broker + unit tests
- **Status:** If time permits, complete. Otherwise, defer to Week 3.

**Task 5.2: Camera Integration (Optional, 3.5 hours)**

- **Purpose:** Link Home Assistant cameras to yacht documentation
- **Scope:** Research + design only (not required for MVP)

- **Potential Implementation:**
  ```
  - Home Assistant has camera platform (snapshot capability)
  - NaviDocs could:
    1. Register camera snapshots as boat documents
    2. Store snapshots in document gallery
    3. Allow users to attach camera feeds to warranty records

  - Implementation approach:
    1. Create /api/integrations/home-assistant/cameras endpoint
    2. List available cameras from HA instance
    3. Poll camera snapshots (daily cron job)
    4. Store as documents with timestamp metadata
  ```

- **Status:** If time permits, research and design. Defer implementation to Week 3+.

**Task 5.3: Day 5 Contingency (If Stretch Goals Not Completed)**

- **Fallback Tasks:**
  1. Performance optimization: Verify warranty query performance with 1000+ records
  2. Additional testing: E2E tests for warranty + Home Assistant flow
  3. Documentation: Add API examples (curl commands) to spec
  4. Code review: Ensure all code follows project standards
  5. Security audit: Review authentication/authorization for all new endpoints

**Acceptance Criteria for Day 5:**
- [ ] (If MQTT completed) MQTT integration tested and functional
- [ ] (If camera completed) Camera integration documented and prototyped
- [ ] OR all contingency tasks completed
- [ ] Code quality review passed
- [ ] All Week 2 tests still passing
- [ ] Performance verified with large datasets

---

## Cross-Cutting Concerns

### Authentication & Authorization

**All endpoints MUST enforce:**
1. Bearer token validation (JWT)
2. User belongs to organization
3. User owns the boat (for warranty operations)
4. No cross-organization data leaks

**Test Cases per Endpoint:**
- Unauthorized (missing token) → 401
- Invalid token → 401
- Expired token → 401
- Different organization → 403
- User doesn't own boat → 403

### Error Handling

**Standard Error Response Format:**
```json
{
  "error": "Warranty not found",
  "status": 404,
  "timestamp": "2025-11-20T10:00:00Z",
  "request_id": "req-abc123"
}
```

**Error Codes:**
- 400: Bad Request (validation failed)
- 401: Unauthorized (auth failed)
- 403: Forbidden (permission denied)
- 404: Not Found
- 409: Conflict (duplicate resource)
- 500: Internal Server Error (log details)

### Logging & Monitoring

**Events to Log:**
- Warranty CRUD operations (action, user, boat_id)
- Home Assistant webhook registration/deletion
- Event forwarding attempts (success/failure)
- Failed webhook deliveries (URL, error)

**Log Format:**
```json
{
  "timestamp": "2025-11-20T10:00:00Z",
  "level": "INFO",
  "service": "warranty-service",
  "action": "warranty_created",
  "user_id": "user-123",
  "boat_id": "boat-456",
  "details": { }
}
```

### Database Considerations

**Indexes Required:**
```sql
-- Already defined in Week 1 migrations:
CREATE INDEX idx_warranty_boat_id ON warranty_tracking(boat_id);
CREATE INDEX idx_warranty_expiration ON warranty_tracking(expiration_date);
CREATE INDEX idx_warranty_status ON warranty_tracking(status);

-- May need to add:
CREATE INDEX idx_warranty_org_boat ON warranty_tracking(organization_id, boat_id);
CREATE INDEX idx_webhook_org ON webhooks(organization_id);
```

**Query Performance Targets:**
- Single warranty lookup: < 10ms
- List all warranties for boat: < 50ms
- Expiring warranties query (all boats): < 200ms (with proper index)

---

## Dependencies & Blockers

### Hard Dependencies (Must Complete Week 1)
1. ✓ `warranty_tracking` table created and tested
2. ✓ `webhooks` table created and tested
3. ✓ Event bus service operational
4. ✓ Webhook service with retry logic
5. ✓ Notification templates seeded

### Soft Dependencies (Can Work In Parallel)
- Week 2 Home Assistant integration does NOT block Week 3 sale workflow
- Home Assistant is optional feature (non-blocking)

### Known Risks
1. **Home Assistant Reachability:** If user's HA instance is not reachable, webhook registration will fail. Plan for fallback (email notifications instead).
2. **Event Bus Load:** Large number of warranties expiring could spike event bus traffic. Monitor Redis memory/CPU.
3. **Database Locking:** SQLite has limited concurrent write support. If warranty creation traffic is high, may need to queue jobs.

---

## Integration Test Requirements

### Test Environment Setup
```bash
# Database: Use in-memory SQLite for tests
TEST_DATABASE=:memory:

# Event Bus: Use in-process emitter (not real Redis) for unit tests
USE_MOCK_REDIS=true

# Home Assistant: Mock HTTP server for webhook tests
MOCK_HA_SERVER=http://localhost:3001
```

### Test Data Requirements
```javascript
// Create fixtures for reuse across tests:
const testBoat = {
  id: 'boat-test-123',
  name: 'Azimut 55S',
  organization_id: 'org-test-456'
};

const testUser = {
  id: 'user-test-789',
  email: 'test@example.com',
  organization_id: 'org-test-456'
};

const testWarranty = {
  boat_id: 'boat-test-123',
  item_name: 'Engine',
  purchase_date: '2023-01-15',
  warranty_period_months: 24
};
```

### Test Coverage Report
```
POST /api/warranties:           100% (6 test cases)
GET /api/warranties/:id:        100% (5 test cases)
PUT /api/warranties/:id:        100% (6 test cases)
DELETE /api/warranties/:id:     100% (4 test cases)
GET /api/warranties/expiring:   100% (8 test cases)
GET /api/boats/:id/warranties:  100% (5 test cases)
POST /api/integrations/...:     100% (8 test cases)
GET /api/integrations/...:      100% (4 test cases)
Event → Webhook forwarding:     100% (6 test cases)

Total Test Cases: 52
Target Coverage: > 90% line coverage
```

---

## Week 2 Schedule Summary

| Day | Phase | Hours | Key Deliverables |
|-----|-------|-------|------------------|
| Nov 20 | CRUD APIs | 7 | Service layer + 4 endpoints + integration tests |
| Nov 21 | Query APIs | 7 | Expiring/Boat endpoints + performance tests |
| Nov 22 | Webhook Registration | 7 | HA webhook registration + validation + tests |
| Nov 23 | Event Forwarding | 7 | Event → webhook delivery + documentation |
| Nov 24 | Stretch Goals | 7 | MQTT/camera (optional) + final testing |
| **Total** | **All Phases** | **35 hours** | **5 API endpoints + full test coverage** |

---

## Success Criteria

**Week 2 is COMPLETE when:**

1. ✓ All warranty CRUD endpoints functional (POST, GET, PUT, DELETE)
2. ✓ Expiring warranties endpoint returns correct filtered results
3. ✓ Boat warranties endpoint shows summary + total coverage
4. ✓ Home Assistant webhook registration accepts and validates URLs
5. ✓ Event forwarding sends warranty/document events to webhooks
6. ✓ All 52 integration tests passing with > 90% code coverage
7. ✓ Home Assistant documentation complete with 3+ automation examples
8. ✓ Tenant isolation verified (no cross-org data leaks)
9. ✓ Performance verified (expiring queries < 200ms)
10. ✓ All code committed with clear commit messages

**Handoff to Week 3 (S4-H03):**
- Week 2 deliverables inform Week 3 implementation
- Home Assistant integration proves Event Bus reliability
- Warranty APIs ready for sale workflow integration
- Ready for sale workflow + notification system

---

## IF.bus Communication Protocol

**S4-H02 must send these messages:**

### Message 1: Dependency Check-In (Start of Day 1)
```json
{
  "performative": "request",
  "sender": "if://agent/session-4/haiku-02",
  "receiver": ["if://agent/session-4/haiku-01"],
  "conversation_id": "if://conversation/navidocs-session-4-2025-11-13",
  "content": {
    "claim": "Requesting Week 1 completion status for dependency validation",
    "evidence": [
      "Week 2 depends on: DB migrations, Event Bus, Security fixes",
      "Timeline: Week 2 starts Nov 20, requires Week 1 to be deployment-ready"
    ],
    "confidence": 0.95,
    "cost_tokens": 0
  }
}
```

### Message 2: Completion Notification (End of Week 2)
```json
{
  "performative": "inform",
  "sender": "if://agent/session-4/haiku-02",
  "receiver": ["if://agent/session-4/haiku-03", "if://agent/session-4/haiku-10"],
  "conversation_id": "if://conversation/navidocs-session-4-2025-11-13",
  "content": {
    "claim": "Week 2 detailed schedule complete + all deliverables ready",
    "evidence": [
      "intelligence/session-4/week-2-detailed-schedule.md created",
      "5 API endpoints implemented: POST/GET/PUT/DELETE /warranties + GET /expiring + GET /boats/:id/warranties",
      "Home Assistant integration: webhook registration + event forwarding",
      "52 integration tests passing (90%+ coverage)",
      "All code committed to branch"
    ],
    "confidence": 0.90,
    "cost_tokens": [YOUR_TOKEN_COUNT],
    "ready_for_week_3": true,
    "blockers": []
  }
}
```

---

## Appendix: API Endpoint Checklist

### Warranty Endpoints
- [ ] `POST /api/warranties` - Create warranty
- [ ] `GET /api/warranties/:id` - Get single warranty
- [ ] `PUT /api/warranties/:id` - Update warranty
- [ ] `DELETE /api/warranties/:id` - Delete warranty
- [ ] `GET /api/warranties/expiring` - Get expiring warranties
- [ ] `GET /api/boats/:id/warranties` - Get boat's warranties

### Integration Endpoints
- [ ] `POST /api/integrations/home-assistant` - Register webhook
- [ ] `GET /api/integrations/home-assistant` - List webhooks
- [ ] `GET /api/integrations/home-assistant/:id` - Get webhook
- [ ] `DELETE /api/integrations/home-assistant/:id` - Delete webhook
- [ ] `POST /api/integrations/home-assistant/:id/test` - Test webhook

### Stretch Goals
- [ ] `POST /api/integrations/mqtt` - Register MQTT broker (optional)
- [ ] `POST /api/integrations/cameras` - Link HA cameras (optional)

---

**Document Version:** 1.0
**Created:** 2025-11-13
**Last Updated:** 2025-11-13
**Agent:** S4-H02 (NaviDocs Implementation - Week 2 Breakdown)
**Status:** Complete & Ready for Implementation
