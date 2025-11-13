# WhatsApp Group Integration Specification
## NaviDocs Boat-Specific AI Agent Architecture

**Agent Identity:** S2-H08
**Status:** SPECIFICATION DOCUMENT
**Generated:** 2025-11-13
**Related Agents:** S2-H02 (Inventory), S2-H03 (Maintenance), S2-H06 (Expenses), S2-H09 (Documents)

---

## Executive Summary

WhatsApp Business API integration enables boat owners, captains, after-sales teams, and NaviDocs AI agents to collaborate in real-time boat-specific group chats. The AI agent serves as a smart assistant that:
- Logs all conversations with IF.TTT audit trail compliance
- Answers questions by searching boat documentation
- Posts proactive maintenance & warranty reminders
- Executes commands (@NaviDocs commands) to create expense entries, inventory items, and service records
- Manages document notifications and versioning alerts

This specification provides the complete technical architecture, database schema, API design, and compliance checklist required for production deployment.

---

## 1. WhatsApp Business API Architecture

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp Cloud API                        │
│              (Meta WhatsApp Business API)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴───────────┐
                │                    │
         ┌──────▼──────┐      ┌──────▼──────┐
         │  Outbound   │      │  Inbound    │
         │  Messages   │      │  Webhook    │
         └──────┬──────┘      └──────┬──────┘
                │                    │
                │            ┌───────┴────────┐
                │            │                │
         ┌──────▼────────────▼──────┐  ┌──────▼──────────┐
         │   NaviDocs API Gateway   │  │  Message Queue  │
         │  (Express.js + Webhook)  │  │  (BullMQ/Redis) │
         └──────┬───────────────────┘  └─────────────────┘
                │
                ├──────────────────────┬──────────────────────┐
                │                      │                      │
         ┌──────▼──────┐      ┌────────▼──────┐      ┌───────▼──────┐
         │  Message    │      │   AI Agent    │      │  Tenant DB   │
         │  History DB │      │  (Claude API) │      │  (SQLite)    │
         │  (SQLite)   │      │               │      │              │
         └─────────────┘      └────────┬──────┘      └──────────────┘
                                       │
                        ┌──────────────┼──────────────┐
                        │              │              │
                   ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
                   │ S2-H03    │  │ S2-H06    │  │ S2-H02   │
                   │ Maint Log │  │ Expenses  │  │ Inventory│
                   └───────────┘  └───────────┘  └──────────┘
```

### 1.2 Webhook Architecture

#### Incoming Webhook (WhatsApp → NaviDocs)

```
POST /api/v1/tenants/{tenantId}/whatsapp/webhooks/messages
Content-Type: application/json
X-Signature: Ed25519 signature of body

{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1234567890",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "+34619999999",
              "phone_number_id": "1234567890123",
              "business_account_id": "1234567890123"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Captain José"
                },
                "wa_id": "34619999999"
              }
            ],
            "messages": [
              {
                "from": "34619999999",
                "id": "wamid.ABC123=",
                "timestamp": "1671020025",
                "type": "text",
                "text": {
                  "body": "@NaviDocs where's the tender warranty?"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

#### Outbound Message Send (NaviDocs → WhatsApp)

```
POST https://graph.instagram.com/v18.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "34619999999",
  "type": "text",
  "text": {
    "body": "Tender warranty expires 2025-06-15. Document: if://doc/navidocs/boat-123/tender-warranty-v1"
  }
}
```

### 1.3 Group Chat Setup

**WhatsApp Group Structure:**

```
Group Name: "Riviera 50 - Boat Coordination"
Members:
  - Owner (Pasquale Rossi)
  - Captain (José García)
  - After-Sales Manager (Francesca Moretti)
  - NaviDocs AI Agent (navidocs-bot@riviera.boat)

Group Type: RESTRICTED (owner creates/manages)
Webhook Role: AI Agent listens to all messages, can post to group
```

**Group Metadata (NaviDocs DB):**

```sql
-- WhatsApp group configuration
INSERT INTO whatsapp_groups (
  group_id,
  boat_id,
  whatsapp_group_id,
  group_name,
  display_phone,
  tenant_id,
  created_at,
  status
) VALUES (
  'group-riviera-50-001',
  'boat-123',
  '120363999999999@g.us',
  'Riviera 50 - Boat Coordination',
  '+34619999999',
  'tenant-riviera',
  '2025-11-13T10:00:00Z',
  'active'
);

-- Group members
INSERT INTO whatsapp_group_members (
  group_id,
  member_phone,
  member_name,
  member_role,
  whatsapp_id
) VALUES
  ('group-riviera-50-001', '+34619999999', 'Pasquale Rossi', 'owner', '34619999999'),
  ('group-riviera-50-001', '+34658888888', 'José García', 'captain', '34658888888'),
  ('group-riviera-50-001', '+39333333333', 'Francesca Moretti', 'after-sales', '39333333333'),
  ('group-riviera-50-001', '+34619999999', 'NaviDocs Bot', 'ai-agent', 'navidocs-bot@riviera.boat');
```

---

## 2. AI Agent Design & Capabilities

### 2.1 AI Agent Architecture

**Technology Stack:**
- **AI Model:** Claude 3.5 Haiku via Anthropic API
- **Message Processing:** Queue-based (BullMQ/Redis)
- **Response Generation:** Prompt templates + RAG (Retrieval-Augmented Generation)
- **Context:** Boat profile, maintenance history, document library

### 2.2 Command Parsing & Execution

**Recognized Commands:**

```
@NaviDocs where is [document_type]?
  → Searches S2-H09 document library by type, returns link(s)

@NaviDocs log maintenance [service_type]
  → Creates maintenance entry via S2-H03 API, confirms in chat

@NaviDocs log expense [amount] [category]
  → Creates expense entry via S2-H06 API, requests photo if needed

@NaviDocs add inventory [item_name] [category] [price]
  → Creates inventory entry via S2-H02 API, confirms in chat

@NaviDocs when's [item_name] warranty?
  → Searches inventory by name, returns warranty expiration date

@NaviDocs upload document [doc_type] [description]
  → Instructs user to upload via NaviDocs app, creates versioned entry

@NaviDocs list [category] [filters]
  → Returns faceted search results from Meilisearch
  → Example: "@NaviDocs list inventory category:electronics value:>5000"

@NaviDocs remind me [event] [date]
  → Creates calendar event, triggers reminder alerts
```

### 2.3 Prompt Template Architecture

**System Prompt:**

```
You are NaviDocs, an AI assistant for boat owners. Your role is to:

1. **Answer boat-related questions** by searching boat documentation
   - If user asks "Where's tender warranty?", search documents for warranty info
   - Respond with exact document links (if://doc/... citations)
   - If info not found, say "Not found. Suggest uploading warranty doc"

2. **Execute bot commands** (@NaviDocs <action>)
   - Log maintenance services
   - Log expenses (with optional receipt photo)
   - Create inventory entries
   - Set reminders/calendar events

3. **Post proactive updates**
   - "Maintenance due in 14 days: Engine service (scheduled 2025-12-15)"
   - "Warranty expires in 30 days: Electronics package"
   - "New manual uploaded: Autopilot System v2.1"

4. **Maintain professional tone**
   - Be concise (WhatsApp UX)
   - Use boat-specific terminology
   - Always include document citations (if applicable)

5. **IF.TTT Compliance**
   - Log all responses with audit trail
   - Include message_id, timestamp, sender
   - Sign with Ed25519 (tenant private key)

6. **Multi-language support**
   - Detect language from incoming message
   - Respond in same language (English, Italian, French, Spanish)

Boat Context:
- Boat ID: {boat_id}
- Boat Type: {boat_type}
- Owner: {owner_name}
- Primary Language: {language}
- Tenant: {tenant_id}
```

**Response Template Examples:**

```
# Question Response
"Tender warranty expires 2025-06-15 ✅
Document: if://doc/navidocs/boat-123/tender-warranty-v1
Need more details? Check the full warranty document in NaviDocs app"

# Maintenance Log
"Logged engine service ✅
Date: 2025-11-13
Cost: €450
Provider: Marina Service SRL
Next due: 2026-05-13 (6 months)"

# Expense Log
"Logged fuel expense ✅
Amount: €120
Category: Fuel & Provisioning
Status: Pending owner approval (tap to approve/reject)"

# Proactive Alert
"🔔 Maintenance Alert
Engine service due in 14 days (2025-11-27)
Captain: Please schedule with Marina Service SRL
Tap to reschedule →"

# Document Notification
"📄 New Document Uploaded
Autopilot System Manual v2.1 (8 pages)
Replace: Autopilot System Manual v2.0
Updated by: Francesca Moretti (Riviera After-Sales)
Tap to view →"
```

### 2.4 Claude API Integration

**Synchronous Request Pattern:**

```javascript
// Handler for incoming WhatsApp message
async function handleWhatsAppMessage(messageData) {
  const { boatId, senderId, senderName, messageText, timestamp, messageId } = messageData;

  // 1. Store raw message in DB
  const storedMsg = await storeRawMessage({
    message_id: messageId,
    boat_id: boatId,
    sender: senderName,
    sender_phone: senderId,
    content: messageText,
    timestamp: timestamp,
    type: 'incoming'
  });

  // 2. Check if message is a command
  if (messageText.includes('@NaviDocs')) {
    const command = parseCommand(messageText);
    const response = await executeCommand(command, boatId);
    await sendWhatsAppMessage(senderId, response.text);
    await storeResponse(messageId, response, 'command-executed');
  } else {
    // 3. Use Claude API for natural language understanding
    const context = await getBoatContext(boatId);
    const systemPrompt = buildSystemPrompt(context);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 256,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: messageText
        }
      ]
    });

    const aiResponse = response.content[0].text;

    // 4. Send response to WhatsApp
    await sendWhatsAppMessage(senderId, aiResponse);

    // 5. Store response with IF.TTT signature
    const signedMsg = await signMessage(aiResponse, tenantPrivateKey);
    await storeResponse(messageId, {
      text: aiResponse,
      signature: signedMsg.ed25519_sig,
      hash: signedMsg.sha256_hash,
      citation_id: `if://chat/navidocs/boat-${boatId}/msg-${messageId}`
    }, 'ai-generated');
  }
}

// Command execution handler
async function executeCommand(command, boatId) {
  switch (command.action) {
    case 'log-maintenance':
      return await s2h03_logMaintenance(boatId, command.params);

    case 'log-expense':
      return await s2h06_logExpense(boatId, command.params);

    case 'add-inventory':
      return await s2h02_addInventory(boatId, command.params);

    case 'search-documents':
      return await s2h09_searchDocuments(boatId, command.params);

    default:
      return { text: "Unknown command. Try: @NaviDocs help" };
  }
}
```

**Asynchronous Reminder Pattern:**

```javascript
// Scheduled job: Post maintenance reminders
async function postMaintenanceReminders() {
  // Run every day at 9 AM
  const upcomingServices = await db.query(`
    SELECT m.*, g.whatsapp_group_id, g.boat_id
    FROM maintenance_log m
    JOIN whatsapp_groups g ON m.boat_id = g.boat_id
    WHERE m.next_due_date BETWEEN CURDATE() AND CURDATE() + 14 DAYS
      AND m.status = 'scheduled'
      AND g.status = 'active'
  `);

  for (const service of upcomingServices) {
    const daysUntil = dateDiff(service.next_due_date);
    const message = `🔔 Maintenance Alert
Service: ${service.service_type}
Due: ${formatDate(service.next_due_date)} (${daysUntil} days)
Estimated Cost: €${service.estimated_cost || 'TBD'}
Provider: ${service.provider}

Captain: Please schedule → [reschedule link]`;

    await sendWhatsAppMessage(service.whatsapp_group_id, message);

    // Log alert as system message
    await storeSystemMessage({
      boat_id: service.boat_id,
      message_type: 'maintenance-reminder',
      content: message,
      trigger_event: `maintenance-due:${service.id}`
    });
  }
}

// Scheduled job: Post warranty alerts
async function postWarrantyAlerts() {
  const expiringWarranties = await db.query(`
    SELECT i.*, g.whatsapp_group_id, g.boat_id
    FROM boat_inventory i
    JOIN whatsapp_groups g ON i.boat_id = g.boat_id
    WHERE i.warranty_expiration BETWEEN CURDATE() AND CURDATE() + 30 DAYS
      AND g.status = 'active'
  `);

  for (const item of expiringWarranties) {
    const daysUntil = dateDiff(item.warranty_expiration);
    const message = `⚠️ Warranty Alert
Item: ${item.item_name}
Category: ${item.category}
Warranty Expires: ${formatDate(item.warranty_expiration)} (${daysUntil} days)
Purchase Price: €${item.purchase_price}

Owner: Save warranty documents for insurance claims`;

    await sendWhatsAppMessage(item.whatsapp_group_id, message);
  }
}
```

---

## 3. Database Schema (SQLite)

### 3.1 Message Storage Tables

```sql
-- WhatsApp group configuration
CREATE TABLE whatsapp_groups (
  group_id TEXT PRIMARY KEY,
  boat_id TEXT NOT NULL,
  whatsapp_group_id TEXT UNIQUE NOT NULL,
  group_name TEXT NOT NULL,
  display_phone TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT CHECK(status IN ('active', 'inactive', 'archived')),

  FOREIGN KEY (boat_id) REFERENCES boats(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Group members with roles
CREATE TABLE whatsapp_group_members (
  member_id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  member_phone TEXT NOT NULL,
  member_name TEXT NOT NULL,
  member_role TEXT CHECK(member_role IN ('owner', 'captain', 'after-sales', 'crew', 'mechanic', 'surveyor', 'ai-agent')),
  whatsapp_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (group_id) REFERENCES whatsapp_groups(group_id),
  UNIQUE(group_id, member_phone)
);

-- Core message table with IF.TTT compliance
CREATE TABLE whatsapp_messages (
  message_id TEXT PRIMARY KEY,
  boat_id TEXT NOT NULL,
  group_id TEXT NOT NULL,

  -- Message content
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_role TEXT,
  content TEXT NOT NULL,
  message_type TEXT CHECK(message_type IN ('text', 'image', 'document', 'command', 'system')) DEFAULT 'text',

  -- Timestamp & lifecycle
  timestamp TIMESTAMP NOT NULL,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  status TEXT CHECK(status IN ('received', 'processed', 'failed', 'archived')),

  -- IF.TTT Compliance: Audit Trail
  ed25519_signature TEXT,        -- Ed25519 signature of message
  sha256_hash TEXT NOT NULL,     -- SHA-256 hash for tamper detection
  signature_timestamp TIMESTAMP,  -- When message was signed
  signed_by_tenant_id TEXT,      -- Which tenant signed it

  -- Citations & traceability
  citation_id TEXT UNIQUE,       -- if://chat/navidocs/boat-{id}/msg-{id}
  parent_message_id TEXT,        -- For threaded replies

  -- Metadata
  metadata TEXT,                 -- JSON: attachments, location, etc.
  tenant_id TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (boat_id) REFERENCES boats(id),
  FOREIGN KEY (group_id) REFERENCES whatsapp_groups(group_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_boat_timestamp (boat_id, timestamp DESC),
  INDEX idx_group_id (group_id),
  INDEX idx_sender_phone (sender_phone)
);

-- AI-generated responses with traceability
CREATE TABLE whatsapp_ai_responses (
  response_id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  bot_instruction TEXT,

  -- AI response details
  response_text TEXT NOT NULL,
  response_tokens INTEGER,
  model_id TEXT DEFAULT 'claude-3-5-haiku-20241022',

  -- IF.TTT Compliance
  ed25519_signature TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  citation_id TEXT UNIQUE,       -- if://chat/navidocs/boat-{id}/response-{id}

  -- Command execution
  command_executed BOOLEAN DEFAULT false,
  command_action TEXT,           -- log-maintenance, log-expense, etc.
  command_target_agent TEXT,     -- S2-H03, S2-H06, etc.
  command_result TEXT,           -- JSON result from target agent

  -- Metadata
  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (message_id) REFERENCES whatsapp_messages(message_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_message_id (message_id)
);

-- System messages (alerts, reminders, notifications)
CREATE TABLE whatsapp_system_messages (
  system_message_id TEXT PRIMARY KEY,
  boat_id TEXT NOT NULL,
  group_id TEXT NOT NULL,

  -- Message details
  message_type TEXT NOT NULL,  -- maintenance-reminder, warranty-alert, document-notification
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Trigger information
  trigger_event TEXT,          -- maintenance-due:id, warranty-expiring:id, etc.
  trigger_source_agent TEXT,   -- S2-H03, S2-H02, S2-H09, etc.

  -- Delivery tracking
  status TEXT CHECK(status IN ('scheduled', 'sent', 'failed', 'archived')),
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,

  -- IF.TTT compliance
  ed25519_signature TEXT,
  sha256_hash TEXT,
  citation_id TEXT UNIQUE,

  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (boat_id) REFERENCES boats(id),
  FOREIGN KEY (group_id) REFERENCES whatsapp_groups(group_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_boat_scheduled (boat_id, scheduled_for),
  INDEX idx_trigger_event (trigger_event)
);

-- Message attachments (photos, documents)
CREATE TABLE whatsapp_attachments (
  attachment_id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,

  attachment_type TEXT CHECK(attachment_type IN ('image', 'document', 'audio', 'video')),
  media_url TEXT NOT NULL,
  media_id TEXT,                -- WhatsApp media ID
  media_mime_type TEXT,
  local_path TEXT,              -- Where we store it locally

  -- OCR processing (for documents/receipts)
  ocr_text TEXT,               -- Extracted text content
  ocr_processed BOOLEAN DEFAULT false,

  -- IF.TTT compliance
  sha256_hash TEXT NOT NULL,
  storage_location TEXT,       -- S3 bucket, local path, etc.

  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (message_id) REFERENCES whatsapp_messages(message_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_message_id (message_id)
);

-- Message search index (for Meilisearch)
CREATE TABLE whatsapp_search_index (
  index_id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,

  content_text TEXT,
  sender_name TEXT,
  indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (message_id) REFERENCES whatsapp_messages(message_id)
);
```

### 3.2 Compliance & Audit Tables

```sql
-- IF.TTT Audit Trail
CREATE TABLE if_ttt_audit_trail (
  audit_id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,

  -- Triple T: Traced, Timestamped, Tamper-evident
  action TEXT NOT NULL,                    -- created, updated, deleted, accessed
  actor_id TEXT NOT NULL,                  -- User, agent, or system
  actor_type TEXT CHECK(actor_type IN ('user', 'ai-agent', 'system')),

  -- Evidence
  original_content TEXT,
  modified_content TEXT,
  ed25519_signature TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,

  -- Timeline
  action_timestamp TIMESTAMP NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Context
  context_data TEXT,                       -- JSON with metadata
  tenant_id TEXT NOT NULL,

  FOREIGN KEY (message_id) REFERENCES whatsapp_messages(message_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_message_audit (message_id),
  INDEX idx_actor_audit (actor_id, action_timestamp DESC)
);

-- Message signatures (for IF.TTT verification)
CREATE TABLE message_signatures (
  sig_id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,

  -- Signature details
  signature_algorithm TEXT DEFAULT 'ed25519',
  public_key_id TEXT,
  signature_bytes TEXT,        -- Base64 encoded signature
  signed_content_hash TEXT,    -- Hash of what was signed

  signed_at TIMESTAMP NOT NULL,
  signed_by_tenant_id TEXT NOT NULL,

  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  verification_error TEXT,

  tenant_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (message_id) REFERENCES whatsapp_messages(message_id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_message_sig (message_id),
  INDEX idx_verified (verified)
);
```

---

## 4. Integration Points with Other Agents

### 4.1 S2-H03: Maintenance Log Integration

**WhatsApp → Maintenance:**

```
User: "@NaviDocs log maintenance engine service cost:450 provider:Marina"

↓

POST /api/v1/tenants/{tenantId}/maintenance/create
{
  "boat_id": "boat-123",
  "service_type": "engine",
  "date": "2025-11-13",
  "cost": 450,
  "cost_currency": "EUR",
  "provider": "Marina Service SRL",
  "estimated_next_due": "2026-05-13",
  "created_via": "whatsapp",
  "whatsapp_message_id": "msg-123",
  "source_agent": "S2-H08"
}

↓

Response:
✅ Logged engine service
Cost: €450 | Provider: Marina Service SRL
Next due: 2025-05-13 (6 months)
Maintenance entry: if://maintenance/navidocs/boat-123/service-001
```

**Maintenance → WhatsApp (Reminder Alert):**

```
S2-H03 scheduled reminder: 14 days before next maintenance due

↓

POST /api/v1/tenants/{tenantId}/whatsapp/send-message
{
  "boat_id": "boat-123",
  "group_id": "group-riviera-50-001",
  "message_type": "maintenance-reminder",
  "title": "Engine Service Due",
  "content": "Engine service due in 14 days (2025-12-15)",
  "trigger_event": "maintenance-due:service-001",
  "trigger_source_agent": "S2-H03"
}

↓

Group message:
🔔 Maintenance Alert
Service: Engine
Due: 2025-12-15 (14 days)
Provider: Marina Service SRL
Captain: Please schedule → [reschedule link]
```

### 4.2 S2-H06: Expense Tracking Integration

**WhatsApp → Expenses:**

```
User: "📸 [fuel receipt photo] @NaviDocs log this expense fuel"

↓

1. Extract attachment, run OCR
2. Parse text: amount, vendor, category
3. POST /api/v1/tenants/{tenantId}/expenses/create
{
  "boat_id": "boat-123",
  "amount": 120,
  "currency": "EUR",
  "category": "fuel",
  "vendor": "Marina Port Authority",
  "date": "2025-11-13",
  "receipt_image_url": "s3://navidocs/receipts/boat-123/receipt-001.jpg",
  "receipt_ocr_text": "...",
  "requester_phone": "34658888888",
  "requester_name": "Captain José",
  "created_via": "whatsapp",
  "whatsapp_message_id": "msg-123",
  "status": "pending-approval",
  "source_agent": "S2-H08"
}

↓

Group message:
✅ Logged fuel expense
Amount: €120
Vendor: Marina Port Authority
Status: Pending owner approval
[Approve] [Reject]
```

**Expense Reimbursement Workflow:**

```
User: Captain taps [Approve]

↓

POST /api/v1/tenants/{tenantId}/expenses/approve
{ "expense_id": "exp-123", "approved_by": "owner", "approved_at": "2025-11-13T10:05:00Z" }

↓

Group message:
✅ Expense Approved
Captain José gets reimbursed €120
Marked as: Reimbursement Pending
Next payment: 2025-11-30 (monthly)
```

### 4.3 S2-H02: Inventory Integration

**WhatsApp → Inventory:**

```
User: "@NaviDocs add inventory Tender Zodiac purchase:35000 warranty:2027-06-15"

↓

POST /api/v1/tenants/{tenantId}/inventory/create
{
  "boat_id": "boat-123",
  "item_name": "Tender Zodiac",
  "category": "tender",
  "zone": "stern storage",
  "purchase_date": "2025-06-15",
  "purchase_price": 35000,
  "purchase_currency": "EUR",
  "warranty_expiration": "2027-06-15",
  "created_via": "whatsapp",
  "whatsapp_message_id": "msg-123",
  "source_agent": "S2-H08"
}

↓

Group message:
✅ Added to inventory
Item: Tender Zodiac
Purchase Price: €35,000
Warranty: 2027-06-15
Value Tracking: ✅
Search: if://inventory/navidocs/boat-123/tender-zodiac
```

### 4.4 S2-H09: Document Versioning Integration

**Document Uploaded → WhatsApp Notification:**

```
User uploads new Tender Warranty document in NaviDocs app

↓

S2-H09 triggers webhook: POST /api/v1/tenants/{tenantId}/whatsapp/document-notification
{
  "boat_id": "boat-123",
  "document_type": "warranty",
  "document_name": "Tender Warranty v2",
  "replaced_document": "Tender Warranty v1",
  "uploaded_by": "Francesca Moretti",
  "uploaded_at": "2025-11-13T10:15:00Z",
  "doc_version": "v2",
  "doc_citation_id": "if://doc/navidocs/boat-123/tender-warranty-v2",
  "source_agent": "S2-H09"
}

↓

Group message:
📄 New Document Uploaded
Tender Warranty v2 (8 pages)
Replaces: Tender Warranty v1
Uploaded by: Francesca Moretti (Riviera After-Sales)
Document: if://doc/navidocs/boat-123/tender-warranty-v2
[View in App]
```

**WhatsApp Search → Document:**

```
User: "@NaviDocs where's the tender warranty?"

↓

S2-H08 AI Agent calls S2-H09 API:
POST /api/v1/tenants/{tenantId}/documents/search
{ "boat_id": "boat-123", "query": "tender warranty" }

↓

S2-H09 Response:
{
  "documents": [
    {
      "id": "doc-456",
      "name": "Tender Warranty v2",
      "type": "warranty",
      "version": "v2",
      "created_date": "2025-06-15",
      "expires_date": "2027-06-15",
      "citation_id": "if://doc/navidocs/boat-123/tender-warranty-v2",
      "url": "https://app.navidocs.com/boats/boat-123/documents/doc-456"
    }
  ]
}

↓

Group message:
✅ Found: Tender Warranty v2
Expires: 2027-06-15 (20 months)
Document: if://doc/navidocs/boat-123/tender-warranty-v2
[View Warranty]
```

---

## 5. IF.TTT Compliance (Traced, Timestamped, Tamper-evident)

### 5.1 Signature Mechanism

**Ed25519 Signature Process:**

```javascript
// At tenant setup, generate Ed25519 keypair
const keyPair = nacl.sign.keyPair();
tenant.ed25519_private_key = base64(keyPair.secretKey);
tenant.ed25519_public_key = base64(keyPair.publicKey);

// When signing a message
function signMessage(message, tenantPrivateKey) {
  const messageBytes = new TextEncoder().encode(message);
  const secretKey = nacl.util.decodeBase64(tenantPrivateKey);

  const signature = nacl.sign.detached(messageBytes, secretKey);
  const signatureBase64 = nacl.util.encodeBase64(signature);

  return {
    ed25519_signature: signatureBase64,
    sha256_hash: crypto.createHash('sha256').update(message).digest('hex')
  };
}

// When verifying a message
function verifyMessage(message, signature, tenantPublicKey) {
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = nacl.util.decodeBase64(signature);
  const publicKeyBytes = nacl.util.decodeBase64(tenantPublicKey);

  try {
    nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    return true;
  } catch {
    return false;
  }
}
```

### 5.2 Citation ID Format

**Standard Citation ID Structure:**

```
if://chat/navidocs/boat-{boatId}/msg-{messageId}
if://chat/navidocs/boat-123/msg-wamid.ABC123=

Components:
- Scheme: "if://" (InfraFabric protocol)
- Domain: "chat" (message domain)
- Service: "navidocs"
- Resource: "boat-{id}/msg-{id}"

Examples:
- if://chat/navidocs/boat-123/msg-wamid.ABC123=
- if://chat/navidocs/boat-123/response-resp-001
- if://chat/navidocs/boat-123/attachment-attach-001
```

### 5.3 Audit Trail Entry

**Complete Audit Record:**

```sql
INSERT INTO whatsapp_messages (
  message_id,
  boat_id,
  group_id,
  sender_name,
  sender_phone,
  content,
  timestamp,
  ed25519_signature,
  sha256_hash,
  citation_id,
  tenant_id
) VALUES (
  'wamid.ABC123=',
  'boat-123',
  'group-riviera-50-001',
  'Captain José',
  '+34658888888',
  '@NaviDocs where''s the tender warranty?',
  '2025-11-13T10:00:00Z',
  'Hy3r5hR8kL9m0n1o2p3q4r5s6t7u8v9w0x1y2z3=',  -- Ed25519 sig
  'abc123def456...',                             -- SHA-256 hash
  'if://chat/navidocs/boat-123/msg-wamid.ABC123=',
  'tenant-riviera'
);

-- Corresponding audit trail
INSERT INTO if_ttt_audit_trail (
  audit_id,
  message_id,
  action,
  actor_id,
  actor_type,
  original_content,
  ed25519_signature,
  sha256_hash,
  action_timestamp,
  tenant_id
) VALUES (
  'audit-001',
  'wamid.ABC123=',
  'created',
  '34658888888',  -- Captain José's phone
  'user',
  '@NaviDocs where''s the tender warranty?',
  'Hy3r5hR8kL9m0n1o2p3q4r5s6t7u8v9w0x1y2z3=',
  'abc123def456...',
  '2025-11-13T10:00:00Z',
  'tenant-riviera'
);
```

### 5.4 Tamper Detection

**SHA-256 Verification:**

```javascript
// Detect if message has been modified
function detectTamper(storedMessage, storedHash) {
  const currentHash = crypto.createHash('sha256').update(storedMessage.content).digest('hex');

  if (currentHash !== storedHash) {
    // Message has been modified!
    return {
      tampered: true,
      stored_hash: storedHash,
      current_hash: currentHash,
      status: 'CRITICAL - Message integrity compromised'
    };
  }

  return {
    tampered: false,
    status: 'Message integrity verified'
  };
}

// Signature verification
function verifyMessageIntegrity(message, signature, publicKey) {
  return {
    signature_valid: verifyEd25519(message, signature, publicKey),
    hash_matches: detectTamper(message, message.sha256_hash),
    overall_status: 'authentic'  // Both must pass
  };
}
```

---

## 6. Multi-Tenant Security Architecture

### 6.1 Boat Isolation

**Tenant → Boat → Chat Isolation:**

```javascript
// Webhook handler enforces tenant boundaries
POST /api/v1/tenants/{tenantId}/whatsapp/webhooks/messages

// 1. Verify tenant authorization
const tenant = await db.query('SELECT * FROM tenants WHERE id = ?', [tenantId]);
if (!tenant) return 403 Forbidden;

// 2. Extract boatId from message metadata
const phoneNumberId = messageData.metadata.phone_number_id;
const boatAssignment = await db.query(
  'SELECT boat_id FROM whatsapp_groups WHERE phone_number_id = ? AND tenant_id = ?',
  [phoneNumberId, tenantId]
);
if (!boatAssignment) return 403 Forbidden;

// 3. Verify sender is in group
const senderPhone = messageData.messages[0].from;
const groupMember = await db.query(
  `SELECT * FROM whatsapp_group_members
   WHERE group_id = ? AND member_phone = ? AND is_active = true`,
  [boatAssignment.group_id, senderPhone]
);
if (!groupMember) return 403 Forbidden;

// 4. All subsequent queries scoped to this boat & tenant
// - Messages queries: WHERE boat_id = ? AND tenant_id = ?
// - Maintenance queries: WHERE boat_id = ? AND tenant_id = ?
// - Expense queries: WHERE boat_id = ? AND tenant_id = ?
// - Inventory queries: WHERE boat_id = ? AND tenant_id = ?
```

### 6.2 Authentication & API Key Rotation

**Tenant API Keys:**

```sql
CREATE TABLE tenant_api_keys (
  key_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,

  api_key_hash TEXT NOT NULL,        -- SHA-256 hash of actual key
  key_name TEXT,                      -- "whatsapp-webhook", "s2h03-integration"

  -- Rotation policy
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,               -- 90-day rotation
  last_used_at TIMESTAMP,

  -- Permissions
  scopes TEXT,                        -- JSON array: ["whatsapp:receive", "maintenance:read", "expense:write"]
  rate_limit_per_minute INTEGER DEFAULT 60,

  status TEXT CHECK(status IN ('active', 'rotated', 'revoked')),

  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_tenant_keys (tenant_id)
);

-- Webhook verification header
X-Hub-Signature-256: sha256=<HASH>
-- Where HASH = HMAC-SHA256(webhook_payload, tenant_app_secret)
```

### 6.3 Role-Based Access Control (RBAC)

**WhatsApp Group Member Roles:**

```
Owner:
- Can approve/reject expenses
- Can view all chats
- Can reschedule maintenance
- Can upload documents
- Can manage group membership

Captain:
- Can log maintenance (read-only)
- Can log expenses (with owner approval)
- Can see maintenance reminders
- Can see document updates
- Cannot approve own expenses
- Cannot remove other members

After-Sales Manager:
- Can upload documents
- Can post announcements
- Can view all chats
- Cannot approve expenses
- Cannot log maintenance
- Cannot manage members

NaviDocs AI Agent (System):
- Can post reminders (scheduled jobs)
- Can respond to questions
- Can execute commands (if sender has permission)
- Can log system messages
- Cannot post arbitrary messages
```

**Command Permission Matrix:**

```
Command                  Owner  Captain  After-Sales  AI-Agent
@NaviDocs log expense      ✓      ✓         ✗          ✓
@NaviDocs approve expense  ✓      ✗         ✗          ✗
@NaviDocs log maintenance  ✓      ✓         ✗          ✓
@NaviDocs add inventory    ✓      ✗         ✗          ✓
@NaviDocs upload document  ✓      ✓         ✓          ✗
@NaviDocs search documents ✓      ✓         ✓          ✓
@NaviDocs list inventory   ✓      ✓         ✓          ✓
```

---

## 7. API Specification

### 7.1 Webhook Receiver Endpoint

```
POST /api/v1/tenants/{tenantId}/whatsapp/webhooks/messages

Request Headers:
- Content-Type: application/json
- X-Hub-Signature-256: sha256=<HMAC-SHA256>
- Authorization: Bearer {WEBHOOK_VERIFY_TOKEN}

Request Body: WhatsApp Cloud API webhook payload

Response: 200 OK
{
  "status": "received",
  "message_id": "wamid.ABC123=",
  "boat_id": "boat-123",
  "processing_status": "queued"
}

Error Responses:
- 400: Invalid payload format
- 403: Tenant not authorized, signature invalid
- 409: Message already processed (idempotency check)
```

### 7.2 Message Send Endpoint

```
POST /api/v1/tenants/{tenantId}/whatsapp/send-message

Request Body:
{
  "boat_id": "boat-123",
  "recipient_phone": "+34619999999",
  "recipient_group_id": "group-riviera-50-001",
  "message_type": "text|command-response|alert|reminder",
  "content": {
    "body": "Your message here"
  },
  "metadata": {
    "source_agent": "S2-H08",
    "related_message_id": "wamid.ABC123=",
    "action": "answer-question"
  }
}

Response: 200 OK
{
  "status": "sent",
  "message_id": "wamid.NEW123=",
  "timestamp": "2025-11-13T10:05:00Z",
  "boat_id": "boat-123"
}
```

### 7.3 Message History Endpoint

```
GET /api/v1/tenants/{tenantId}/boats/{boatId}/whatsapp/messages

Query Parameters:
- group_id: "group-riviera-50-001" (optional, default: all groups for boat)
- from_date: "2025-11-01" (optional)
- to_date: "2025-11-13" (optional)
- sender: "captain@..." (optional)
- page: 1 (default)
- limit: 50 (default, max 100)
- sort: "timestamp desc" (default)

Response: 200 OK
{
  "messages": [
    {
      "message_id": "wamid.ABC123=",
      "sender_name": "Captain José",
      "sender_role": "captain",
      "content": "@NaviDocs where's the tender warranty?",
      "timestamp": "2025-11-13T10:00:00Z",
      "message_type": "text",
      "status": "processed",
      "citation_id": "if://chat/navidocs/boat-123/msg-wamid.ABC123="
    },
    {
      "message_id": "resp-001",
      "sender_name": "NaviDocs Bot",
      "sender_role": "ai-agent",
      "content": "Tender warranty expires 2025-06-15...",
      "timestamp": "2025-11-13T10:00:15Z",
      "message_type": "text",
      "status": "processed",
      "citation_id": "if://chat/navidocs/boat-123/response-resp-001",
      "in_reply_to": "wamid.ABC123="
    }
  ],
  "pagination": {
    "page": 1,
    "total_messages": 127,
    "pages": 3
  }
}
```

### 7.4 Command Execution Endpoint

```
POST /api/v1/tenants/{tenantId}/whatsapp/execute-command

Request Body:
{
  "boat_id": "boat-123",
  "sender_phone": "+34658888888",
  "sender_name": "Captain José",
  "sender_role": "captain",
  "command_text": "@NaviDocs log maintenance engine service cost:450",
  "source_message_id": "wamid.ABC123=",
  "timestamp": "2025-11-13T10:00:00Z"
}

Response: 200 OK
{
  "status": "executed",
  "command_action": "log-maintenance",
  "result": {
    "success": true,
    "maintenance_id": "maint-001",
    "response_message": "✅ Logged engine service cost: €450"
  },
  "timestamp": "2025-11-13T10:00:01Z"
}
```

---

## 8. Example Conversations

### Example 1: Owner Queries Maintenance

```
Owner (Pasquale): When was the last engine service?

NaviDocs Bot: ✅ Last engine service: 2025-10-15 (29 days ago)
Cost: €450
Provider: Marina Service SRL
Next due: 2026-04-15 (scheduled in 153 days)
Document: if://maintenance/navidocs/boat-123/service-engine-2025-10-15

[Log Another Service] [Schedule Next]

---

Owner: Schedule engine service for December 15

NaviDocs Bot: ✅ Engine service scheduled for 2025-12-15
Captain José will receive notification
Estimated cost: €450 (based on last service)
Status: Captain to confirm with Marina Service SRL

Captain: Marina confirmed! Service scheduled 2025-12-15 at 10:00 AM

NaviDocs Bot: ✅ Confirmation recorded
Service: Engine maintenance
Date: 2025-12-15 10:00 AM
Location: Marina Service SRL, Porto Vecchio
Document: if://maintenance/navidocs/boat-123/service-engine-2025-12-15
```

### Example 2: Captain Logs Expense

```
Captain (José): 📸 [fuel receipt image] @NaviDocs log this fuel

[NaviDocs processes receipt OCR]

NaviDocs Bot: 📋 Receipt Recognized:
Vendor: Porto Vecchio Marina
Amount: €115.50
Date: 2025-11-13
Category: Fuel & Provisioning
Status: Pending owner approval

[Confirm] [Edit] [Cancel]

---

Captain: Confirm

NaviDocs Bot: ✅ Logged fuel expense
Amount: €115.50
Receipt: if://receipt/navidocs/boat-123/receipt-001
Status: Pending Owner Approval

Owner approves after 2 hours:

NaviDocs Bot: ✅ Expense Approved
Captain José receives €115.50 reimbursement
Payment scheduled: 2025-11-30
Receipt archived: if://receipt/navidocs/boat-123/receipt-001

---

November 30 (Auto-generated):

NaviDocs Bot: 💳 Monthly Reimbursement Summary
Captain José:
  - Fuel (€115.50)
  - Provisions (€87.23)
  - Minor repairs (€45.00)
  Total: €247.73

Payment status: Marked as paid
Payment method: Bank transfer to [Captain account]
Document: if://expense/navidocs/boat-123/reimbursement-nov-2025
```

### Example 3: After-Sales Posts Document

```
After-Sales (Francesca): @NaviDocs upload warranty documents

NaviDocs Bot: 📄 Ready to accept documents
Expected: Tender warranty, Electronics warranty, Engine warranty

Francesca: 📸 [uploads 3 PDF images]

NaviDocs Bot: Processing documents...
[Wait 2 seconds]

NaviDocs Bot: ✅ 3 documents processed
1. Tender Warranty
   - Uploaded: 2025-11-13
   - Expires: 2027-06-15
   - Document: if://doc/navidocs/boat-123/tender-warranty-v1

2. Electronics Warranty
   - Uploaded: 2025-11-13
   - Expires: 2026-11-13
   - Document: if://doc/navidocs/boat-123/electronics-warranty-v1

3. Engine Warranty
   - Uploaded: 2025-11-13
   - Expires: 2026-11-13
   - Document: if://doc/navidocs/boat-123/engine-warranty-v1

---

All stakeholders notified:

Owner: 📄 New Warranty Documents Uploaded
2 documents uploaded by Riviera After-Sales
Action: Check warranty expiration dates in Calendar

Captain: 📄 New Warranty Documents Uploaded
3 documents available for reference
Use: "@NaviDocs where's the tender warranty?" to find docs

Francesca: ✅ Upload Complete
3 documents archived in NaviDocs
Boat team notified
```

### Example 4: Inventory Management

```
After-Sales (Francesca): @NaviDocs add inventory Garmin GPSMAP 8600 category:electronics
purchase:3500 warranty:2026-11-13

NaviDocs Bot: ✅ Added to inventory
Item: Garmin GPSMAP 8600
Category: Electronics
Zone: [Auto-detect: Helm]
Purchase Price: €3,500
Warranty: 2026-11-13 (365 days)
Current Value Est.: €2,800 (80% retention)

Document: if://inventory/navidocs/boat-123/garmin-gpsmap-8600

---

Owner: @NaviDocs list inventory category:electronics

NaviDocs Bot: 📱 Electronics Inventory
Total items: 6
Total value: €28,500

1. Garmin GPSMAP 8600 - €3,500 (Warranty: 2026-11-13)
2. Autopilot System - €8,200 (Warranty: 2025-08-20 - EXPIRED)
3. VHF Radio - €2,100 (Warranty: 2026-03-15)
4. Depth Sounder - €1,800 (Warranty: 2025-12-10 - 27 days left)
5. Sea Breeze Air Conditioning - €12,900 (Warranty: 2027-06-15)

[Sort by: Warranty | Value | Category]
[Export Inventory]
```

---

## 9. IF.TTT Compliance Checklist

Use this checklist to verify all messages meet Traced, Timestamped, Tamper-evident standards:

### Checklist Items

- [ ] **Message Traceability:**
  - [ ] Every message has unique `message_id`
  - [ ] Every message has `sender_name` and `sender_phone`
  - [ ] Sender role is recorded (`owner`, `captain`, `after-sales`, `ai-agent`)
  - [ ] Citation ID is generated (if://chat/navidocs/boat-{boatId}/msg-{messageId})
  - [ ] Message stored in `whatsapp_messages` table

- [ ] **Timestamp Verification:**
  - [ ] `timestamp` field set to exact WhatsApp timestamp
  - [ ] `received_at` set to server receipt time
  - [ ] `processed_at` set when AI response sent
  - [ ] All times in ISO 8601 format (UTC)
  - [ ] Time synchronization checked (NTP)

- [ ] **Signature & Hash:**
  - [ ] Ed25519 signature generated using tenant private key
  - [ ] Signature covers exact message content (no modifications)
  - [ ] SHA-256 hash calculated for message content
  - [ ] Signature stored in `ed25519_signature` field
  - [ ] Hash stored in `sha256_hash` field

- [ ] **Tamper Detection:**
  - [ ] Signature verification passes on all stored messages
  - [ ] Hash verification passes on all stored messages
  - [ ] Audit trail entry created for all changes
  - [ ] Update operations create new audit records (don't overwrite)

- [ ] **AI Responses:**
  - [ ] Response has unique `response_id`
  - [ ] Response has `citation_id` (if://chat/.../response-{id})
  - [ ] Response signed with same tenant key as original message
  - [ ] Response hash matches stored content
  - [ ] AI model ID recorded (`claude-3-5-haiku-20241022`)

- [ ] **Command Execution:**
  - [ ] Command parser validates @NaviDocs syntax
  - [ ] Command forwarded to target agent (S2-H03, S2-H06, etc.)
  - [ ] Target agent response recorded with its own signature
  - [ ] Command execution logged in `whatsapp_ai_responses`
  - [ ] Command result stored with timestamp

- [ ] **Audit Trail:**
  - [ ] Entry created for message creation
  - [ ] Entry created for each update/modification
  - [ ] Entry created for command execution
  - [ ] Entry created for approval/rejection
  - [ ] Each audit entry signed and hashed

- [ ] **Multi-Tenant Isolation:**
  - [ ] All queries filtered by `tenant_id` AND `boat_id`
  - [ ] Tenant cannot access other tenant's messages
  - [ ] Boat cannot access other boat's chats within same tenant
  - [ ] API authorization verified before processing

- [ ] **Attachment Handling:**
  - [ ] Receipt photos stored with SHA-256 hash
  - [ ] Attachment `media_id` recorded from WhatsApp
  - [ ] OCR text stored separately (for searchability)
  - [ ] Original image preserved (for legal/tax purposes)

- [ ] **System Messages:**
  - [ ] Reminders, alerts, notifications tracked as system messages
  - [ ] System messages marked with `message_type`: `system`
  - [ ] System messages signed (not user-generated)
  - [ ] Trigger event recorded (e.g., `maintenance-due:service-001`)

- [ ] **Compliance Testing:**
  - [ ] Run `verify_message_signatures.sql` monthly
  - [ ] Run `detect_tampered_messages.sql` monthly
  - [ ] Check `if_ttt_audit_trail` for completeness
  - [ ] Verify no messages modified after creation

---

## 10. Deployment Checklist

### Pre-Deployment

- [ ] WhatsApp Business Account created (contact Meta)
- [ ] WhatsApp Business API app configured
- [ ] Webhook URL registered with Meta
- [ ] Webhook verify token generated (random 32+ character string)
- [ ] Ed25519 keypair generated for tenant signing
- [ ] SSL certificate deployed on webhook endpoint
- [ ] Rate limiting configured (60 req/min per tenant)
- [ ] Database migrations run (all tables above created)
- [ ] Meilisearch configured with whatsapp_search_index
- [ ] Redis/BullMQ job queues configured
- [ ] Claude API key configured (read from env)
- [ ] S3 bucket created for receipt/attachment storage

### Post-Deployment

- [ ] Test webhook with Meta's test notification
- [ ] Send test message: "@NaviDocs test"
- [ ] Verify message logged in database
- [ ] Verify signature and hash correct
- [ ] Test command: "@NaviDocs help"
- [ ] Test integration with S2-H03 (log maintenance)
- [ ] Test integration with S2-H06 (log expense)
- [ ] Test integration with S2-H02 (add inventory)
- [ ] Test integration with S2-H09 (search documents)
- [ ] Verify IF.TTT audit trail created
- [ ] Test multi-tenant isolation (attempt cross-tenant access)
- [ ] Monitor for webhook delivery failures
- [ ] Monitor API response times
- [ ] Configure alerts for errors/failures

---

## 11. Glossary & References

**IF.TTT (Traced, Timestamped, Tamper-evident):**
- Traced: Every message has attribution (who, what, when)
- Timestamped: Precise UTC timestamps on all events
- Tamper-evident: Cryptographic signatures detect modifications

**Citation ID:**
- Globally unique identifier for each message/response
- Format: `if://chat/navidocs/boat-{id}/msg-{id}`
- Used for cross-referencing in audit trails

**Ed25519:**
- Modern public-key signature algorithm
- Used to sign all messages (tenant private key)
- Verified using tenant public key

**SHA-256:**
- Cryptographic hash function
- Detects any modification to message content
- Stored for tamper detection verification

**S2-H03, S2-H06, S2-H02, S2-H09:**
- Agent IDs for related NaviDocs systems
- S2-H03: Maintenance Log Management
- S2-H06: Expense Tracking & Accounting
- S2-H02: Inventory Management
- S2-H09: Document Versioning

**WhatsApp Business API:**
- Cloud API for programmatic message sending/receiving
- Webhook-based event delivery
- Rate limiting: 60 messages/sec per phone number

**Claude API:**
- Anthropic's AI language model API
- Model: claude-3-5-haiku-20241022 (lightweight, fast)
- Used for natural language understanding & response generation

---

## Document Status

**Created:** 2025-11-13 by S2-H08
**Citation ID:** if://doc/navidocs/session-2/whatsapp-integration-spec
**Version:** 1.0
**Status:** FINAL SPECIFICATION
**Next Review:** Post-MVP deployment feedback integration
