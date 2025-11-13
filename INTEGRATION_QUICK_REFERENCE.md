# NaviDocs Integration Quick Reference

**Quick lookup for developers implementing new integrations**

---

## Database Key Tables for Integrations

### 1. Metadata Storage (Extensible JSON Fields)

**entities table** - Boat/asset data
```javascript
// Example metadata
{
  "hull_cert_date": "2020-01-15",
  "survey_status": "valid",
  "survey_provider": "HagsEye",
  "mls_id": "yacht-123456",
  "listing_price": 450000,
  "condition_notes": "Excellent, fully maintained",
  "ha_entity_id": "yacht.name_docs"
}
```

**documents table** - File metadata  
```javascript
{
  "sale_list_price": 450000,
  "condition_notes": "excellent",
  "buyer_name": "John Doe",
  "notify_on_expiry": true,
  "expiry_date": "2025-01-15",
  "signature_required": true
}
```

**organizations table** - Broker/agency config
```javascript
{
  "broker_id": "broker-123",
  "region": "SE",
  "crm_provider": "zillow",
  "webhook_urls": {
    "homeassistant": "http://ha.local:8123/api/webhook/...",
    "mqtt": "mqtt://broker.local:1883"
  }
}
```

### 2. Settings Table for Integration Config
```sql
SELECT * FROM system_settings WHERE category = 'integrations';
```

**Example rows:**
- `key='ha.webhook_url', value='http://...', category='integrations'`
- `key='mqtt.broker', value='mqtt://...', category='integrations'`
- `key='crm.api_key', value='...', category='integrations', encrypted=1`

---

## API Route Templates

### Webhook Receiver Pattern
```javascript
// /server/routes/webhooks.js
import express from 'express';

const router = express.Router();

router.post('/homeassistant', async (req, res) => {
  const { event, timestamp, data } = req.body;
  
  // Validate webhook token
  if (req.headers['x-webhook-token'] !== process.env.HA_WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Log event
  db.prepare(`
    INSERT INTO integration_events (id, event_type, payload, created_at)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), 'ha.' + event, JSON.stringify(data), now);
  
  res.json({ success: true });
});

export default router;
```

### Event Publisher Pattern
```javascript
// /server/services/event-bus.js

export async function publishEvent(event, data) {
  // 1. Log to database
  db.prepare(`
    INSERT INTO events (id, type, payload, created_at)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), event, JSON.stringify(data), now);
  
  // 2. Publish to registered webhooks
  const integrations = db.prepare(`
    SELECT * FROM integrations 
    WHERE active = 1 AND type = 'webhook'
  `).all();
  
  for (const webhook of integrations) {
    // Queue webhook delivery
    await queueWebhookDelivery(webhook.id, event, data);
  }
  
  // 3. Publish to MQTT if configured
  if (config.mqtt.enabled) {
    await mqttClient.publish(`navidocs/events/${event}`, JSON.stringify(data));
  }
}
```

---

## Service Layer Extension Points

### 1. Add to Search Service (search.js)
```javascript
// Add new filterable attribute
export function addSearchAttribute(attributeName, type = 'string') {
  // Update Meilisearch index config
  // type: 'string', 'number', 'date', 'array'
}

// Index document with new fields
export async function indexDocument(doc) {
  const searchDoc = {
    id: doc.id,
    title: doc.title,
    text: doc.ocr_text,
    documentType: doc.document_type,
    // Add custom fields from metadata
    ...JSON.parse(doc.metadata || '{}')
  };
  await meiliIndex.addDocuments([searchDoc]);
}
```

### 2. Add to Queue Service (queue.js)
```javascript
// Create new job type
export async function addWebhookJob(integrationId, event, payload) {
  return await queue.add('webhook-delivery', {
    integrationId,
    event,
    payload,
    timestamp: Date.now()
  });
}

// Create worker processor
export function registerJobProcessor(jobType, handler) {
  queue.process(jobType, handler);
}
```

### 3. Add to Authorization (authorization.service.js)
```javascript
// Check if organization has integration enabled
export function canUseIntegration(userId, orgId, integrationType) {
  const org = db.prepare(`
    SELECT * FROM organizations WHERE id = ?
  `).get(orgId);
  
  const config = JSON.parse(org.metadata || '{}');
  return config.integrations?.[integrationType]?.enabled === true;
}
```

---

## Common Integration Patterns

### Pattern 1: Document Upload Trigger
```javascript
// When document upload completes:
// 1. Save to database
// 2. Trigger OCR job
// 3. Publish event
// 4. Notify integrations

import { publishEvent } from '../services/event-bus.js';

await publishEvent('document.uploaded', {
  documentId: doc.id,
  title: doc.title,
  entityId: doc.entity_id,
  organizationId: doc.organization_id,
  uploadedBy: doc.uploaded_by,
  timestamp: Date.now()
});
```

### Pattern 2: OCR Completion Notification
```javascript
// In ocr-worker.js, after indexing:
await publishEvent('document.indexed', {
  documentId: doc.id,
  pageCount: doc.page_count,
  ocrLanguage: doc.language,
  processingTimeMs: Date.now() - startTime,
  confidence: avgConfidence
});
```

### Pattern 3: Permission Change Audit
```javascript
// In permission routes:
await publishEvent('permission.granted', {
  resourceType: permission.resource_type,
  resourceId: permission.resource_id,
  userId: permission.user_id,
  permission: permission.permission,
  grantedBy: req.user.userId,
  timestamp: Date.now()
});
```

---

## File References

### Database
- **Schema:** `/home/setup/navidocs/server/db/schema.sql`
- **Migrations:** `/home/setup/navidocs/server/db/migrations/*.sql`

### API Routes
- **Auth:** `/home/setup/navidocs/server/routes/auth.routes.js`
- **Documents:** `/home/setup/navidocs/server/routes/documents.js`
- **Upload:** `/home/setup/navidocs/server/routes/upload.js`
- **Search:** `/home/setup/navidocs/server/routes/search.js`
- **Settings:** `/home/setup/navidocs/server/routes/settings.routes.js`

### Services
- **Auth:** `/home/setup/navidocs/server/services/auth.service.js`
- **Authorization:** `/home/setup/navidocs/server/services/authorization.service.js`
- **Queue:** `/home/setup/navidocs/server/services/queue.js`
- **Search:** `/home/setup/navidocs/server/services/search.js`
- **Settings:** `/home/setup/navidocs/server/services/settings.service.js`
- **Audit:** `/home/setup/navidocs/server/services/audit.service.js`

### Workers
- **OCR:** `/home/setup/navidocs/server/workers/ocr-worker.js`
- **Image Extraction:** `/home/setup/navidocs/server/workers/image-extractor.js`

---

## Environment Variables for Integrations

```bash
# Home Assistant Webhook
HA_WEBHOOK_URL=http://homeassistant.local:8123/api/webhook/navidocs
HA_WEBHOOK_TOKEN=your-secure-token

# MQTT Broker
MQTT_BROKER=mqtt://broker.local:1883
MQTT_USERNAME=navidocs
MQTT_PASSWORD=secure-password

# Cloud Storage (S3)
AWS_S3_BUCKET=navidocs-documents
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# External APIs
CRM_API_KEY=...
SURVEY_PROVIDER_API_KEY=...

# Webhook Delivery
WEBHOOK_RETRY_MAX_ATTEMPTS=3
WEBHOOK_TIMEOUT_MS=30000
```

---

## Testing Webhook Integration

### 1. Test Webhook Receiver
```bash
curl -X POST http://localhost:3001/api/webhooks/homeassistant \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: your-token" \
  -d '{
    "event": "document.indexed",
    "timestamp": 1699868400,
    "data": { "documentId": "...", "pageCount": 42 }
  }'
```

### 2. Monitor Integration Events
```sql
SELECT * FROM integration_events 
ORDER BY created_at DESC 
LIMIT 20;
```

### 3. Check Integration Status
```bash
curl http://localhost:3001/api/admin/settings/category/integrations
```

---

## Yacht Sales Specific Integrations

### Broker CRM Sync
**Data Flow:** MLS → NaviDocs
```javascript
// entities.metadata fields to sync
{
  "mls_id": "Y-12345",
  "listing_agent": "Jane Smith",
  "listing_office": "Broker LLC",
  "list_date": "2024-11-01",
  "sale_price": 450000,
  "status": "pending" // listed, pending, sold, withdrawn
}

// Trigger update on document upload
publishEvent('boat.documentation_added', {
  entityId, mls_id, documentType
});
```

### Expiration Warnings
```javascript
// documents.metadata
{
  "expires_at": 1735689600,  // Unix timestamp
  "reminder_days": [7, 1],   // Send reminder 7 days before, 1 day before
  "type": "survey",          // survey, haul_out, inspection
  "renewal_required": true
}

// Worker job to check expiration
async function checkDocumentExpiry() {
  const expiring = db.prepare(`
    SELECT * FROM documents 
    WHERE JSON_EXTRACT(metadata, '$.expires_at') < ?
  `).all(Date.now() + 7*24*3600*1000);
  
  for (const doc of expiring) {
    publishEvent('document.expiring_soon', { documentId: doc.id });
  }
}
```

### As-Built Package Generator
```javascript
// On sale completion, collect all documents
export async function generateAsBuiltPackage(boatId) {
  const docs = db.prepare(`
    SELECT * FROM documents 
    WHERE entity_id = ? AND status = 'indexed'
  `).all(boatId);
  
  // Create PDF with index
  // Upload to Google Drive
  // Share with buyer
  publishEvent('as_built_package.generated', { boatId });
}
```

---

## Security Considerations

1. **Encrypt Integration Credentials**
   - Store API keys, tokens in encrypted columns
   - Use `sodium_crypto_secretbox` for encryption
   - Decrypt only when needed

2. **Validate Webhook Payloads**
   - HMAC-SHA256 signature verification
   - Check timestamp (prevent replay attacks)
   - Rate limit by source IP

3. **Audit All Integration Events**
   - Log who configured integrations
   - Log all data flows
   - Keep audit trail for compliance

4. **Scope Integration Permissions**
   - Each integration tied to organization
   - Can't access other orgs' data
   - Minimal required permissions

---

## Performance Tips

1. **Webhook Delivery**
   - Queue webhooks, don't send synchronously
   - Implement exponential backoff for retries
   - Batch events if possible

2. **Search Indexing**
   - Index in background worker, not in upload route
   - Use batch indexing for large datasets
   - Delete old pages before reindexing

3. **Large File Handling**
   - Stream uploads, don't load into memory
   - Process OCR page-by-page
   - Cache frequently accessed PDFs

---

**Last Updated:** 2025-11-13  
**For full details:** See ARCHITECTURE_INTEGRATION_ANALYSIS.md
