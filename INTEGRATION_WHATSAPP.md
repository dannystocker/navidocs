# WhatsApp Business Integration Plan
## NaviDocs Document Sharing & Maintenance Alerts

**Document Version:** 1.0
**Created:** 2025-11-13
**Status:** Integration Plan (Ready for Implementation)
**Implementation Time:** 60-90 minutes
**Complexity:** Medium
**Dependencies:** Express.js backend, SQLite database, document storage

---

## Executive Summary

WhatsApp Business integration enables NaviDocs to:
1. **Receive document uploads** via WhatsApp (warranties, manuals, service records)
2. **Send document search results** to boat owners on-demand
3. **Push maintenance alerts** (warranty expiration, service reminders, safety recalls)
4. **Create boat-owner communication channels** (group chats with after-sales team, captain, mechanic)

This plan covers Meta's WhatsApp Business API, implementation architecture, cost structure, and required credentials.

---

## 1. WhatsApp Business API Overview

### 1.1 Official API vs Alternatives

**We recommend:** Meta's WhatsApp Business API (Official)
- **Compliance:** Full compliance with WhatsApp's Terms of Service
- **Reliability:** 99.95% uptime SLA
- **Support:** Priority developer support
- **Scalability:** Handles enterprise-level volume

**Alternative (NOT recommended):** Third-party chatbot platforms
- Risk: Account bans, poor documentation sharing, limited automation
- **We'll use official API**

### 1.2 WhatsApp Business API Capabilities

| Capability | NaviDocs Use Case | Status |
|-----------|------------------|--------|
| **Incoming Messages** | Receive document PDFs, images, warranty files | ✅ Supported |
| **Outgoing Messages** | Send search results, alerts, notifications | ✅ Supported |
| **Document Uploads** | Boat owners send warranty/maintenance photos | ✅ Supported |
| **Group Messaging** | Notify multiple team members simultaneously | ✅ Supported |
| **Message Templates** | Pre-approved maintenance alerts, notifications | ✅ Supported |
| **Webhook Events** | Trigger alerts on document upload, warranty expiration | ✅ Supported |
| **Media Downloads** | Auto-download PDFs from messages | ✅ Supported |

---

## 2. Implementation Architecture

### 2.1 System Flow Diagram

```
WhatsApp User (Boat Owner)
       ↓
Sends: "Find my engine warranty"
or: Uploads warranty PDF
       ↓
Meta WhatsApp Cloud API (Webhook)
       ↓
NaviDocs Backend (Express.js + Webhook Handler)
       ├→ Parse message / download media
       ├→ Query SQLite database (documents table)
       ├→ Search Meilisearch index
       └→ Format response
       ↓
Send Response via WhatsApp API
       ↓
WhatsApp User receives results
```

### 2.2 Database Schema Updates

Add to existing NaviDocs SQLite schema:

```sql
-- Track WhatsApp integrations per boat/owner
CREATE TABLE whatsapp_integrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  boat_id INTEGER NOT NULL,
  owner_phone TEXT NOT NULL,  -- E.164 format: +41791234567
  whatsapp_user_id TEXT NOT NULL,  -- Meta's unique ID for user
  status VARCHAR(20),  -- 'active', 'inactive', 'paused'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP,
  FOREIGN KEY (boat_id) REFERENCES boats(id)
);

-- Log all WhatsApp messages (for compliance, debugging)
CREATE TABLE whatsapp_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_id INTEGER NOT NULL,
  direction VARCHAR(10),  -- 'inbound' or 'outbound'
  message_type VARCHAR(20),  -- 'text', 'document', 'image', 'alert'
  message_content TEXT,
  media_url TEXT,
  whatsapp_message_id TEXT UNIQUE,
  processed BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (integration_id) REFERENCES whatsapp_integrations(id)
);

-- Track alerts sent via WhatsApp
CREATE TABLE warranty_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  boat_id INTEGER NOT NULL,
  alert_type VARCHAR(50),  -- 'warranty_expiring', 'service_due', 'recall', 'maintenance_reminder'
  alert_date DATE,
  sent_via_whatsapp BOOLEAN DEFAULT 0,
  sent_at TIMESTAMP,
  acknowledged BOOLEAN DEFAULT 0,
  FOREIGN KEY (boat_id) REFERENCES boats(id)
);
```

### 2.3 Backend Changes (Express.js)

#### A. Webhook Endpoint Handler

```javascript
// routes/integrations/whatsapp.js

const express = require('express');
const router = express.Router();
const db = require('../../db');
const meilisearch = require('../../meilisearch');
const whatsappService = require('../../services/whatsapp');

// Webhook receiver (Meta WhatsApp Cloud API → NaviDocs)
router.post('/webhook', async (req, res) => {
  const { entry } = req.body;

  for (const event of entry) {
    const changes = event.changes?.[0];
    if (!changes) continue;

    const { value } = changes;
    const messages = value.messages || [];
    const statuses = value.statuses || [];

    // Handle incoming messages
    for (const msg of messages) {
      await handleIncomingMessage(msg, value);
    }

    // Handle delivery status updates
    for (const status of statuses) {
      await logMessageStatus(status);
    }
  }

  res.status(200).json({ success: true });
});

// Process incoming message
async function handleIncomingMessage(msg, metadata) {
  const { from, id: whatsapp_msg_id, type, text, image, document } = msg;

  // Find WhatsApp integration for this user
  const integration = await db.get(
    'SELECT * FROM whatsapp_integrations WHERE owner_phone = ?',
    [from]
  );

  if (!integration) {
    // New user: send welcome message
    await whatsappService.sendMessage(from, {
      type: 'template',
      template_name: 'welcome_new_user'
    });
    return;
  }

  // Log incoming message
  await db.run(
    `INSERT INTO whatsapp_messages (integration_id, direction, message_type, message_content, whatsapp_message_id)
     VALUES (?, ?, ?, ?, ?)`,
    [integration.id, 'inbound', type, JSON.stringify(msg), whatsapp_msg_id]
  );

  // Route by message type
  if (type === 'text') {
    await handleTextQuery(integration, text.body, whatsapp_msg_id);
  } else if (type === 'document') {
    await handleDocumentUpload(integration, document, whatsapp_msg_id);
  } else if (type === 'image') {
    await handleImageUpload(integration, image, whatsapp_msg_id);
  }
}

// Handle text queries ("Find my warranty", "Service reminders", etc.)
async function handleTextQuery(integration, query, whatsapp_msg_id) {
  const { boat_id } = integration;

  // Search Meilisearch index
  const results = await meilisearch.index('documents').search(query, {
    filter: [`boat_id = ${boat_id}`],
    limit: 5
  });

  if (results.hits.length === 0) {
    await whatsappService.sendMessage(integration.owner_phone, {
      type: 'text',
      text: `No documents found matching "${query}". Try:\n- "warranty"\n- "maintenance"\n- "manual"`
    });
    return;
  }

  // Format results for WhatsApp
  let responseText = `Found ${results.hits.length} document(s):\n\n`;
  for (const doc of results.hits.slice(0, 5)) {
    responseText += `📄 ${doc.document_name}\n`;
    responseText += `Type: ${doc.document_type} | Date: ${doc.upload_date}\n`;
    responseText += `Download: ${doc.download_url}\n\n`;
  }

  await whatsappService.sendMessage(integration.owner_phone, {
    type: 'text',
    text: responseText
  });

  // Log search in database
  await db.run(
    `INSERT INTO whatsapp_messages (integration_id, direction, message_type, message_content, processed)
     VALUES (?, ?, ?, ?, 1)`,
    [integration.id, 'outbound', 'search_results', responseText]
  );
}

// Handle document uploads (warranties, service records)
async function handleDocumentUpload(integration, docData, whatsapp_msg_id) {
  const { boat_id } = integration;

  try {
    // Download document from WhatsApp Media API
    const mediaBuffer = await whatsappService.downloadMedia(docData.id, docData.mime_type);

    // Store in NaviDocs document storage
    const fileName = `whatsapp_${boat_id}_${Date.now()}.${getFileExtension(docData.mime_type)}`;
    const storagePath = `/storage/documents/${boat_id}/${fileName}`;

    await fs.writeFile(storagePath, mediaBuffer);

    // Extract metadata from filename/message context
    const documentRecord = {
      boat_id,
      document_type: detectDocumentType(docData.mime_type, fileName),
      document_name: docData.filename || fileName,
      file_path: storagePath,
      upload_source: 'whatsapp',
      whatsapp_message_id,
      uploaded_at: new Date()
    };

    // Insert into database
    const result = await db.run(
      `INSERT INTO documents (boat_id, document_type, document_name, file_path, upload_source, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [documentRecord.boat_id, documentRecord.document_type, documentRecord.document_name,
       documentRecord.file_path, documentRecord.upload_source, JSON.stringify(documentRecord)]
    );

    // OCR/index the document
    await meilisearch.index('documents').addDocuments([{
      id: result.lastID,
      boat_id,
      document_name: documentRecord.document_name,
      document_type: documentRecord.document_type,
      upload_date: documentRecord.uploaded_at,
      indexed: true
    }]);

    // Confirm upload
    await whatsappService.sendMessage(integration.owner_phone, {
      type: 'text',
      text: `✅ Document received and stored:\n${documentRecord.document_name}\n\nType: ${documentRecord.document_type}`
    });

  } catch (error) {
    console.error('Document upload error:', error);
    await whatsappService.sendMessage(integration.owner_phone, {
      type: 'text',
      text: `❌ Error uploading document. Please try again.`
    });
  }
}

module.exports = router;
```

#### B. WhatsApp Service Layer

```javascript
// services/whatsapp.js

const axios = require('axios');

class WhatsAppService {
  constructor(businessPhoneNumberId, accessToken) {
    this.businessPhoneNumberId = businessPhoneNumberId;
    this.accessToken = accessToken;
    this.apiVersion = 'v18.0';
    this.baseUrl = `https://graph.instagram.com/${this.apiVersion}`;
  }

  // Send message via WhatsApp API
  async sendMessage(recipientPhone, message) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.businessPhoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone,
          type: message.type,
          [message.type]: message[message.type]
        },
        {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        }
      );

      return response.data;
    } catch (error) {
      console.error('WhatsApp send error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send message template (pre-approved by WhatsApp)
  async sendTemplate(recipientPhone, templateName, parameters) {
    return this.sendMessage(recipientPhone, {
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: parameters
          }
        ]
      }
    });
  }

  // Download media from WhatsApp servers
  async downloadMedia(mediaId, mimeType) {
    try {
      // Get media URL
      const urlResponse = await axios.get(
        `${this.baseUrl}/${mediaId}`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        }
      );

      const { url } = urlResponse.data;

      // Download file
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Media download error:', error.message);
      throw error;
    }
  }

  // Send maintenance alert via template message
  async sendMaintenanceAlert(phone, boatName, alertType, alertDetails) {
    const templates = {
      warranty_expiring: {
        name: 'warranty_expiring_alert',
        params: [boatName, alertDetails.expiryDate, 'warranty']
      },
      service_due: {
        name: 'service_due_alert',
        params: [boatName, alertDetails.serviceType, alertDetails.dueDate]
      },
      recall_notice: {
        name: 'recall_notice_alert',
        params: [boatName, alertDetails.recallType, alertDetails.recallUrl]
      }
    };

    const template = templates[alertType];
    if (!template) throw new Error(`Unknown alert type: ${alertType}`);

    return this.sendTemplate(phone, template.name, [
      { type: 'text', text: param } for param in template.params
    ]);
  }

  // Link/register phone number with boat
  async linkOwnerPhone(boatId, ownerPhone) {
    // WhatsApp API doesn't identify users by phone alone; we need the WhatsApp user ID
    // This is obtained from the first inbound message webhook
    // For initial setup, ask user to send a test message
    return {
      status: 'pending',
      instruction: `Please text "Hello" to the NaviDocs WhatsApp number to confirm registration`,
      boat_id: boatId
    };
  }
}

module.exports = new WhatsAppService(
  process.env.WHATSAPP_BUSINESS_PHONE_ID,
  process.env.WHATSAPP_ACCESS_TOKEN
);
```

### 2.4 Frontend Integration (Vue 3)

```vue
<!-- components/BoatSettings/WhatsAppIntegration.vue -->

<template>
  <div class="whatsapp-integration">
    <h3>WhatsApp Integration</h3>

    <div v-if="!isLinked" class="setup-section">
      <p>Enable WhatsApp notifications for {{ boatName }}</p>

      <div class="setup-steps">
        <ol>
          <li>
            <strong>Open WhatsApp</strong>
            <button @click="copyPhoneNumber" class="btn-secondary">
              Copy NaviDocs WhatsApp Number
            </button>
            <code>{{ navidocsPhone }}</code>
          </li>

          <li>
            <strong>Send Message</strong>
            <p>Text "Link {{boatId}}" to the NaviDocs WhatsApp number</p>
            <a :href="`https://wa.me/${navidocsPhoneE164}?text=Link%20${boatId}`"
               target="_blank" class="btn-primary">
              Open WhatsApp Chat
            </a>
          </li>

          <li>
            <strong>Confirm</strong>
            <p>We'll send you a verification code</p>
            <input v-model="verificationCode"
                   placeholder="Enter verification code"
                   @keyup.enter="confirmLink" />
            <button @click="confirmLink" :disabled="!verificationCode">
              Confirm Link
            </button>
          </li>
        </ol>
      </div>
    </div>

    <div v-else class="linked-section">
      <h4>✅ WhatsApp Connected</h4>
      <p>Phone: {{ maskedPhone }}</p>

      <div class="notification-settings">
        <h5>Alert Preferences</h5>

        <label>
          <input v-model="alerts.warranty_expiring" type="checkbox" />
          Warranty expiration alerts (30 days before)
        </label>

        <label>
          <input v-model="alerts.service_due" type="checkbox" />
          Scheduled maintenance reminders
        </label>

        <label>
          <input v-model="alerts.recalls" type="checkbox" />
          Safety recalls & important notices
        </label>

        <label>
          <input v-model="alerts.expense_summary" type="checkbox" />
          Monthly expense summary
        </label>

        <button @click="saveAlertPreferences" class="btn-primary">
          Save Preferences
        </button>
      </div>

      <button @click="unlinkWhatsApp" class="btn-danger">
        Unlink WhatsApp
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { api } from '@/services/api';

const props = defineProps({
  boatId: Number,
  boatName: String
});

const isLinked = ref(false);
const verificationCode = ref('');
const navidocsPhone = ref('+41 79 123 4567');
const navidocsPhoneE164 = computed(() => navidocsPhone.value.replace(/\s/g, ''));
const maskedPhone = ref('');

const alerts = ref({
  warranty_expiring: true,
  service_due: true,
  recalls: true,
  expense_summary: false
});

const copyPhoneNumber = () => {
  navigator.clipboard.writeText(navidocsPhoneE164.value);
};

const confirmLink = async () => {
  try {
    const response = await api.post('/integrations/whatsapp/verify', {
      boat_id: props.boatId,
      verification_code: verificationCode.value
    });

    isLinked.value = true;
    maskedPhone.value = response.data.phone.replace(/(.{2})(.*)(.{2})/, '$1****$3');
  } catch (error) {
    alert('Invalid verification code');
  }
};

const saveAlertPreferences = async () => {
  await api.post(`/boats/${props.boatId}/whatsapp-preferences`, alerts.value);
  alert('Preferences saved');
};

const unlinkWhatsApp = async () => {
  if (confirm('Remove WhatsApp integration?')) {
    await api.delete(`/boats/${props.boatId}/whatsapp`);
    isLinked.value = false;
  }
};
</script>
```

---

## 3. Features: Receiving Document Uploads

### 3.1 Supported Document Types

| Document Type | Use Case | Processing |
|--------------|----------|-----------|
| **Warranty Cards** | PDF/Image | Extract expiration date, coverage details |
| **Service Records** | PDF/Image | Track maintenance history |
| **Manuals** | PDF | OCR + full-text indexing |
| **Photos** | JPG/PNG | Store in boat gallery, searchable by tags |
| **Insurance Docs** | PDF | Extract policy numbers, coverage amounts |
| **Registration** | PDF/Image | Extract boat registration, builder info |

### 3.2 Workflow: Uploading Via WhatsApp

```
User: "I got my engine service done, here's the receipt"
       ↓ [Sends PDF via WhatsApp]
       ↓
NaviDocs Backend:
  1. Webhook receives document
  2. Download media from Meta servers
  3. Run OCR (Tesseract)
  4. Extract text & metadata
  5. Store in /storage/documents/{boat_id}/
  6. Index in Meilisearch
  7. Send confirmation to user
       ↓
NaviDocs App:
  Documents tab shows: "Engine Service - Nov 13, 2025"
  Search finds it: "Find my last engine service"
```

### 3.3 Database Triggers for Auto-Processing

```sql
-- Trigger: Auto-detect warranty expiration from uploaded documents
CREATE TRIGGER on_document_upload_detect_warranty
AFTER INSERT ON documents
FOR EACH ROW
WHEN (NEW.document_type = 'warranty' OR NEW.document_name LIKE '%warrant%')
BEGIN
  INSERT INTO warranty_alerts (boat_id, alert_type, alert_date)
  SELECT NEW.boat_id, 'warranty_detected', DATE('now', '+30 days');
END;

-- Trigger: Auto-send confirmation when document is uploaded via WhatsApp
CREATE TRIGGER on_whatsapp_document_confirm
AFTER INSERT ON documents
FOR EACH ROW
WHEN (NEW.upload_source = 'whatsapp')
BEGIN
  -- Queue WhatsApp message to integration table
  INSERT INTO notifications (type, boat_id, message)
  VALUES ('whatsapp_confirm', NEW.boat_id,
    'Document received: ' || NEW.document_name);
END;
```

---

## 4. Features: Sending Document Search Results

### 4.1 Natural Language Queries

Users can ask natural questions:

```
Q: "Find my engine warranty"
A: [Returns warranty card + expiration date]

Q: "What's my service history?"
A: [Returns last 5 service records in chronological order]

Q: "I need the manual for my anchor winch"
A: [Returns manual PDF + quick link to download]

Q: "When does my insurance expire?"
A: [Shows policy dates + alert if <90 days]
```

### 4.2 Faceted Search Results

Instead of long text lists, send structured responses:

```
Search: "warranty"

Results:
📄 Engine Warranty (Yanmar)
   Expires: Dec 15, 2027
   Coverage: Parts + Labor
   Provider: Yanmar Europe

📄 Hull Warranty (Jeanneau)
   Expires: Sep 2, 2029
   Coverage: Manufacturing defects
   Provider: Jeanneau

📄 Extended Protection (SeaCare)
   Expires: Nov 13, 2026
   Coverage: Electronics + Upholstery
   Provider: SeaCare Global

[Reply with number to download: "1", "2", or "3"]
```

---

## 5. Features: Maintenance & Warranty Alerts

### 5.1 Alert Types & Triggers

```javascript
const alertConfig = {
  // Warranty alerts
  warranty_expiring_30d: {
    trigger: 'warranty_expiration_date - 30 days',
    message: 'Warranty expiring in 30 days for {item}',
    template: 'warranty_expiring_alert'
  },

  warranty_expiring_7d: {
    trigger: 'warranty_expiration_date - 7 days',
    message: 'URGENT: Warranty expires in 7 days for {item}',
    template: 'warranty_urgent_alert'
  },

  // Maintenance alerts
  service_reminder_due: {
    trigger: 'service_due_date',
    message: 'Scheduled maintenance due: {service_type} on {due_date}',
    template: 'service_due_alert'
  },

  service_reminder_overdue: {
    trigger: 'service_due_date + 7 days',
    message: 'OVERDUE: {service_type} service was due on {due_date}',
    template: 'service_overdue_alert'
  },

  // Safety alerts
  recall_notice: {
    trigger: 'new recall posted for boat model',
    message: 'Safety recall for {recall_type}. Details: {recall_url}',
    template: 'recall_notice_alert'
  },

  // Financial alerts
  expense_monthly_summary: {
    trigger: 'first of each month',
    message: 'Monthly maintenance cost: €{total}. Top expense: {top_item}',
    template: 'expense_summary_alert'
  }
};
```

### 5.2 Scheduled Alert Jobs (BullMQ)

```javascript
// background/jobs/warranty-alerts.js

const Queue = require('bull');
const db = require('../../db');
const whatsappService = require('../../services/whatsapp');

const warrantyAlertQueue = new Queue('warranty-alerts', {
  redis: { host: 'localhost', port: 6379 }
});

// Daily job to check warranty expiration dates
warrantyAlertQueue.process(async (job) => {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Find all warranties expiring in next 30 days
  const expiringWarranties = await db.all(
    `SELECT wa.*, bi.owner_phone, b.boat_name
     FROM warranty_alerts wa
     JOIN whatsapp_integrations bi ON wa.boat_id = bi.boat_id
     JOIN boats b ON wa.boat_id = b.id
     WHERE wa.alert_date BETWEEN ? AND ?
       AND wa.sent_via_whatsapp = 0`,
    [today.toISOString().split('T')[0], thirtyDaysFromNow.toISOString().split('T')[0]]
  );

  for (const warranty of expiringWarranties) {
    try {
      await whatsappService.sendTemplate(
        warranty.owner_phone,
        'warranty_expiring_alert',
        [
          { type: 'text', text: warranty.boat_name },
          { type: 'text', text: warranty.alert_date },
          { type: 'text', text: warranty.alert_type }
        ]
      );

      // Mark as sent
      await db.run(
        'UPDATE warranty_alerts SET sent_via_whatsapp = 1, sent_at = ? WHERE id = ?',
        [new Date().toISOString(), warranty.id]
      );
    } catch (error) {
      console.error(`Failed to send alert for warranty ${warranty.id}:`, error);
    }
  }
});

// Schedule job to run every day at 9:00 AM
warrantyAlertQueue.add({}, {
  repeat: {
    cron: '0 9 * * *'  // 9:00 AM daily
  }
});

module.exports = warrantyAlertQueue;
```

### 5.3 SMS Fallback for Opt-Out Users

For users who don't want WhatsApp but want alerts, use SMS as fallback:

```javascript
async function sendAlert(boatId, alertType, details) {
  const integration = await db.get(
    'SELECT * FROM whatsapp_integrations WHERE boat_id = ?',
    [boatId]
  );

  const prefs = await db.get(
    'SELECT * FROM user_alert_preferences WHERE boat_id = ?',
    [boatId]
  );

  if (prefs?.use_whatsapp) {
    // Send via WhatsApp
    await whatsappService.sendTemplate(integration.owner_phone, alertType, details);
  } else if (prefs?.use_sms) {
    // Send via SMS (Twilio)
    await twilioService.sendSMS(integration.owner_phone, formatMessage(alertType, details));
  } else {
    // Send via email only
    await emailService.send(integration.owner_email, alertType, details);
  }
}
```

---

## 6. WhatsApp Business API Setup

### 6.1 Pre-requisites

1. **Meta Business Account** (free)
   - Go to: https://business.facebook.com/
   - Create new business account
   - Verify identity

2. **WhatsApp Business App** (within Meta Business Suite)
   - Add WhatsApp app to business account
   - Verify phone number (your business number)
   - Choose: Accept messages or Send messages

3. **Webhook Configuration** (required for inbound messages)
   - NaviDocs webhook URL: `https://navidocs.boat/api/integrations/whatsapp/webhook`
   - Webhook token: Generate secure random token
   - Subscribe to: `messages`, `message_status`

### 6.2 Environment Variables

```bash
# .env file
WHATSAPP_BUSINESS_ACCOUNT_ID=<your_business_account_id>
WHATSAPP_BUSINESS_PHONE_ID=<your_phone_number_id>
WHATSAPP_ACCESS_TOKEN=<long_lived_access_token>
WHATSAPP_WEBHOOK_TOKEN=<secure_random_token>
WHATSAPP_API_VERSION=v18.0

# Optional: for SMS fallback
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_PHONE_NUMBER=<+1234567890>
```

### 6.3 Step-by-Step Setup

#### Step 1: Create Meta Business Account

```bash
1. Go to https://business.facebook.com/
2. Click "Create account"
3. Fill in business name, email, business type
4. Verify via email
```

#### Step 2: Register Phone Number

```bash
1. In Business Settings → WhatsApp → Phone Numbers
2. Click "Add phone number"
3. Enter your business phone number
4. WhatsApp sends verification code via SMS to that number
5. Enter code in dashboard to verify
```

#### Step 3: Create API Token

```bash
1. Settings → Users and permissions → System users
2. Create new system user (role: admin)
3. Assign to App Roles: WhatsApp Business Management API
4. Generate Access Token (select expiration: 60 days or never expire)
5. Copy token to .env file
```

#### Step 4: Configure Webhook

```bash
# Get webhook settings from Meta Dashboard
1. Settings → Configuration → Webhooks
2. Edit "messages" webhook
3. Set URL: https://navidocs.boat/api/integrations/whatsapp/webhook
4. Generate webhook token (random string, 32+ chars)
5. Subscribe to fields: messages, message_status, message_template_status
6. Save
```

#### Step 5: Test Integration

```bash
# In your backend, test sending a message
curl -X POST \
  "https://graph.instagram.com/v18.0/${WHATSAPP_BUSINESS_PHONE_ID}/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${WHATSAPP_ACCESS_TOKEN}" \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "+41791234567",
    "type": "text",
    "text": { "body": "Hello from NaviDocs!" }
  }'

# Expected response:
# {
#   "messaging_product": "whatsapp",
#   "contacts": [{"input":"41791234567","wa_id":"41791234567"}],
#   "messages": [{"id":"wamid.xxx","message_status":"accepted"}]
# }
```

---

## 7. Cost Estimate

### 7.1 WhatsApp Business API Pricing

| Cost Component | Price | Notes |
|--------|-------|-------|
| **Inbound Messages** | Free | Unlimited (unlimited quality) |
| **Outbound Template Messages** | $0.0080 per message | Pre-approved templates (warranty alerts, etc.) |
| **Outbound Dialog Messages** | $0.0127 per message | Response within 24-hour window |
| **Outbound Session Messages** | $0.0170 per message | New conversation (pay per conversation start) |

### 7.2 Projected Monthly Costs

**Small Fleet Operator** (10 boats, owner + mechanic):
- Inbound: 100 messages/month = $0
- Outbound alerts: 50 template messages/month = $0.40
- Outbound support: 200 dialog messages/month = $2.54
- **Total: ~$3/month**

**Medium Dealer** (50 boats, 3 support staff):
- Inbound: 500 messages/month = $0
- Outbound alerts: 500 template messages/month = $4.00
- Outbound support: 1000 dialog messages/month = $12.70
- **Total: ~$17/month**

**Large Dealer** (200+ boats, enterprise):
- Inbound: 2000 messages/month = $0
- Outbound alerts: 3000 template messages/month = $24.00
- Outbound support: 5000 dialog messages/month = $63.50
- **Total: ~$88/month**

### 7.3 Total Implementation Costs

| Cost | Amount | Notes |
|------|--------|-------|
| **WhatsApp Business Account** | Free | One-time setup |
| **Phone Number Registration** | Free | One-time |
| **API Access Token** | Free | Included with Business Account |
| **Backend Development** | (included) | Express.js webhook + database schema |
| **Frontend Components** | (included) | Vue 3 integration component |
| **Monthly API Usage** | $3-88 | Depends on message volume |
| **Storage (PDFs, images)** | $0-20/mo | If using S3 (NaviDocs can use local storage) |
| **Support** | Free | Facebook/Meta developer support |

**Total First Year:** $36-1,056 (depending on scale)

---

## 8. Implementation Timeline

### Phase 1: Setup (15-20 minutes)
- [ ] Create Meta Business Account
- [ ] Verify phone number
- [ ] Generate API credentials
- [ ] Create `.env` variables

### Phase 2: Backend Integration (40-50 minutes)
- [ ] Add database schema (whatsapp_integrations, whatsapp_messages, warranty_alerts tables)
- [ ] Create webhook handler (`/routes/integrations/whatsapp.js`)
- [ ] Implement WhatsApp service (`services/whatsapp.js`)
- [ ] Test webhook with sample messages

### Phase 3: Frontend Integration (15-25 minutes)
- [ ] Create WhatsApp setup component (`WhatsAppIntegration.vue`)
- [ ] Add settings to boat detail page
- [ ] Implement verification flow

### Phase 4: Alert System (20-30 minutes)
- [ ] Create BullMQ job for warranty alerts
- [ ] Implement alert scheduling logic
- [ ] Test end-to-end alert flow

### Phase 5: Testing & Documentation (10-15 minutes)
- [ ] Test with real WhatsApp account
- [ ] Document message templates
- [ ] Create user guide

**Total Implementation Time: 60-90 minutes**

---

## 9. Required Credentials from User

Ask the boat owner/dealer for:

| Credential | Format | Why Needed |
|-----------|--------|-----------|
| **WhatsApp Business Phone Number** | E.164 format: +41791234567 | To link to their boat in NaviDocs |
| **Phone Number Verification** | SMS code received | To confirm they own the phone |
| **Alert Preferences** | Checkboxes | Which alerts to enable |
| **Time Zone** | IANA format: Europe/Zurich | To schedule alerts correctly |

**Initial Onboarding Flow:**

```
Step 1: User opens NaviDocs app
Step 2: Goes to Boat Settings → WhatsApp
Step 3: Clicks "Enable WhatsApp Integration"
Step 4: Enters phone number
Step 5: Receives SMS verification code
Step 6: Enters code to confirm
Step 7: Sets alert preferences (warranty, maintenance, recalls)
Step 8: Done!
```

---

## 10. Security Considerations

### 10.1 Data Privacy

- **Message Logs:** Store WhatsApp messages in encrypted field (`message_content` column)
- **Phone Numbers:** Hash phone numbers in non-critical queries, store hashed version in cache
- **Media Downloads:** Use HTTPS only, verify SSL certificates
- **Webhooks:** Sign all incoming webhooks with SHA-256 (Meta provides signature)

### 10.2 Webhook Verification

```javascript
// Verify webhook signature from Meta
function verifyWebhookSignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  const body = req.rawBody;  // Must be raw body, not parsed JSON

  const hash = crypto
    .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
    .update(body)
    .digest('hex');

  const expectedSignature = `sha256=${hash}`;
  return signature === expectedSignature;
}

// Apply middleware
app.post('/api/integrations/whatsapp/webhook', (req, res, next) => {
  if (!verifyWebhookSignature(req)) {
    return res.status(403).json({ error: 'Invalid signature' });
  }
  next();
});
```

### 10.3 Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const whatsappLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,              // 100 requests per minute
  message: 'Too many WhatsApp messages, please try again later'
});

app.use('/api/integrations/whatsapp', whatsappLimiter);
```

### 10.4 Compliance

- **GDPR:** Delete message logs after 90 days unless user opts for longer retention
- **WhatsApp Terms:** Only send approved template messages (warranties, maintenance, recalls)
- **Opt-Out:** Respect user preferences; never spam unsolicited messages

---

## 11. Error Handling & Fallbacks

### 11.1 Common Error Scenarios

```javascript
const errorHandlers = {
  // Webhook receiver down → Queue messages in Redis
  webhook_unreachable: {
    action: 'Queue message in Redis',
    retry: 'Exponential backoff: 1s, 10s, 100s, then daily',
    fallback: 'Send SMS alert instead'
  },

  // User phone not recognized → Send welcome message
  unknown_user: {
    action: 'Send welcome template',
    retry: 'Ask user to "Register" via phone',
    fallback: 'Manual registration in NaviDocs web app'
  },

  // Document too large → Ask user to send via web app
  file_too_large: {
    action: 'Send error message',
    limit: '100 MB per file',
    fallback: 'Direct upload to NaviDocs app'
  },

  // OCR fails (image quality) → Store raw image, mark for manual review
  ocr_failure: {
    action: 'Store image as-is',
    retry: 'Queue for manual transcription by support',
    fallback: 'User can manually add metadata in app'
  }
};
```

---

## 12. Integration Checklist

- [ ] Meta Business Account created & verified
- [ ] WhatsApp Business API credentials obtained
- [ ] `.env` file configured with WHATSAPP_* variables
- [ ] Database schema updated (3 new tables)
- [ ] Express.js webhook handler implemented & tested
- [ ] WhatsApp service layer created
- [ ] Frontend Vue 3 component for setup
- [ ] Warranty alert job created & scheduled
- [ ] Webhook signature verification implemented
- [ ] Rate limiting configured
- [ ] Error logging in place
- [ ] User onboarding flow tested
- [ ] Document upload tested (PDF, image, text)
- [ ] Search results formatting tested
- [ ] Alert templates created in Meta dashboard
- [ ] Message templates created: warranty_expiring_alert, service_due_alert, recall_notice_alert
- [ ] SMS fallback configured (optional)
- [ ] GDPR compliance: message retention policy set
- [ ] Load testing: 100+ concurrent messages
- [ ] User documentation written

---

## Next Steps

1. **Request credentials** from user:
   - Meta Business Account ID
   - WhatsApp Business Phone Number
   - Business address (for verification)

2. **Set up API credentials** (15 min):
   - Create system user in Meta
   - Generate access token
   - Configure webhook

3. **Deploy backend** (40 min):
   - Add database schema
   - Implement webhook handler
   - Test with cURL

4. **Deploy frontend** (15 min):
   - Add WhatsApp setup component
   - Test linking flow

5. **Create message templates** (5 min):
   - Warranty expiring
   - Service due
   - Recall notice

6. **Go live**:
   - Invite pilot users
   - Monitor message volume
   - Collect feedback

---

**Document Version:** 1.0
**Last Updated:** 2025-11-13
**Author:** NaviDocs Integration Team
**Status:** Ready for Development
