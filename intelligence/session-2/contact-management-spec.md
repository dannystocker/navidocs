# Contact Management System for Boat Service Providers
## S2-H05 Complete Specification

**Agent:** S2-H05
**Domain:** Contact Management System
**Status:** Complete
**Date:** 2025-11-13

---

## 1. DATABASE SCHEMA

### Core Table: `boat_contacts`

```sql
CREATE TABLE boat_contacts (
  -- Primary & Foreign Keys
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  boat_id BIGINT NOT NULL,

  -- Contact Information
  name VARCHAR(255) NOT NULL,
  role ENUM(
    'marina',
    'mechanic',
    'cleaner',
    'charter_crew',
    'electrician',
    'surveyor',
    'rigger',
    'canvas_maker',
    'detailer'
  ) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  company VARCHAR(255),
  notes TEXT,

  -- Engagement Tracking
  last_used TIMESTAMP NULL DEFAULT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,

  -- Indices
  KEY idx_boat_id (boat_id),
  KEY idx_role (role),
  KEY idx_is_favorite (is_favorite),
  KEY idx_last_used (last_used DESC),
  KEY idx_deleted_at (deleted_at),
  UNIQUE KEY unique_contact (boat_id, name, phone)
);
```

### Related Tables

#### `contact_interactions` (Audit & Analytics)
```sql
CREATE TABLE contact_interactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  boat_id BIGINT NOT NULL,
  contact_id BIGINT NOT NULL,
  interaction_type ENUM('call', 'email', 'sms', 'whatsapp', 'in_person'),
  interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source_id VARCHAR(255),
  source_type ENUM('quick_action', 'maintenance_log', 'manual', 'whatsapp'),

  FOREIGN KEY (contact_id) REFERENCES boat_contacts(id) ON DELETE CASCADE,
  KEY idx_boat_id (boat_id),
  KEY idx_contact_id (contact_id),
  KEY idx_interaction_date (interaction_date DESC)
);
```

#### `contact_suggestions` (Auto-suggest Log)
```sql
CREATE TABLE contact_suggestions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  boat_id BIGINT NOT NULL,
  maintenance_log_id BIGINT,
  suggested_name VARCHAR(255) NOT NULL,
  suggested_role VARCHAR(50),
  suggested_phone VARCHAR(20),
  suggested_email VARCHAR(255),
  status ENUM('pending', 'accepted', 'rejected', 'merged') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),

  KEY idx_boat_id (boat_id),
  KEY idx_maintenance_log_id (maintenance_log_id),
  KEY idx_status (status),
  KEY idx_created_at (created_at DESC)
);
```

---

## 2. API ENDPOINTS

### Base URL
```
/api/contacts
```

### CRUD Operations

#### List All Contacts for Boat
```
GET /api/contacts
Query Parameters:
  - boat_id (required): BIGINT
  - role (optional): enum value to filter
  - is_favorite (optional): boolean
  - search (optional): string for fuzzy search on name/company
  - limit: int (default: 50)
  - offset: int (default: 0)

Response 200:
{
  "data": [
    {
      "id": 1,
      "boat_id": 123,
      "name": "John's Marine Service",
      "role": "mechanic",
      "phone": "+1-555-0100",
      "email": "john@marine.com",
      "company": "John's Marine",
      "notes": "Expert in diesel engines",
      "last_used": "2025-11-10T14:30:00Z",
      "is_favorite": true,
      "usage_count": 12,
      "created_at": "2025-10-01T10:00:00Z",
      "updated_at": "2025-11-10T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 50,
    "offset": 0
  }
}
```

#### Get Contact Details
```
GET /api/contacts/{contact_id}

Response 200:
{
  "data": { ... contact object ... },
  "interactions": [
    {
      "id": 1,
      "interaction_type": "call",
      "interaction_date": "2025-11-10T14:30:00Z",
      "source_type": "quick_action"
    }
  ],
  "last_interaction": "2025-11-10T14:30:00Z"
}
```

#### Create Contact
```
POST /api/contacts
Body:
{
  "boat_id": 123,
  "name": "Jane Electrical",
  "role": "electrician",
  "phone": "+1-555-0101",
  "email": "jane@electrical.com",
  "company": "Electrical Solutions",
  "notes": "Licensed marine electrician"
}

Response 201:
{
  "data": { ... created contact object ... }
}
```

#### Update Contact
```
PUT /api/contacts/{contact_id}
Body: (any fields to update)

Response 200:
{
  "data": { ... updated contact object ... }
}
```

#### Delete Contact (Soft Delete)
```
DELETE /api/contacts/{contact_id}

Response 204: No Content
```

### Smart Search & Filtering

#### Search by Role
```
GET /api/contacts/by-role/{role}
Query Parameters:
  - boat_id (required)
  - sort: 'last_used' | 'name' | 'usage_count' (default: 'last_used')

Example: GET /api/contacts/by-role/mechanic?boat_id=123&sort=last_used

Response 200:
{
  "data": [ ... contacts with role 'mechanic' ... ],
  "role": "mechanic",
  "count": 3
}
```

#### Quick Search
```
GET /api/contacts/search
Query Parameters:
  - boat_id (required)
  - q: string (search across name, company, email)

Response 200:
{
  "results": [ ... matching contacts ... ]
}
```

### Favorites Management

#### Toggle Favorite
```
POST /api/contacts/{contact_id}/favorite
Body:
{
  "is_favorite": true
}

Response 200:
{
  "data": { ... updated contact object ... }
}
```

#### Get Favorite Contacts
```
GET /api/contacts/favorites
Query Parameters:
  - boat_id (required)
  - role (optional): filter by role

Response 200:
{
  "data": [ ... favorite contacts ... ],
  "count": 5
}
```

### Smart Suggestions

#### Get Recommended Contact for Quick Action
```
GET /api/contacts/recommend
Query Parameters:
  - boat_id (required)
  - role (required): e.g., 'mechanic'
  - context (optional): 'recent' | 'favorite' | 'most_used' (default: 'recent')

Response 200:
{
  "recommended": {
    "id": 1,
    "name": "John's Marine Service",
    "role": "mechanic",
    "phone": "+1-555-0100",
    "reason": "Used 2 days ago"
  },
  "alternatives": [
    { ... other mechanics ... }
  ]
}
```

#### Accept Auto-Suggestion from Maintenance Log
```
POST /api/contacts/suggest
Body:
{
  "name": "new_mechanic_name",
  "role": "mechanic",
  "phone": "+1-555-0102",
  "email": "email@example.com",
  "company": "Company Name",
  "source": "maintenance_log_id:456",
  "maintenance_log_id": 456,
  "action": "create" | "merge"
}

Response 200 | 201:
{
  "data": { ... created or merged contact ... },
  "suggestion_id": 123,
  "status": "accepted"
}
```

#### Get Pending Suggestions
```
GET /api/contacts/suggestions/pending
Query Parameters:
  - boat_id (required)

Response 200:
{
  "data": [ ... pending suggestions ... ],
  "count": 2
}
```

### Interaction Tracking

#### Log Contact Interaction
```
POST /api/contacts/{contact_id}/interact
Body:
{
  "interaction_type": "call" | "email" | "sms" | "whatsapp" | "in_person",
  "source_type": "quick_action" | "maintenance_log" | "whatsapp" | "manual",
  "source_id": "maintenance_log:456"
}

Response 200:
{
  "interaction": { ... interaction object ... },
  "contact": { ... updated contact object with last_used and usage_count ... }
}
```

### Bulk Operations

#### Email Charter Crew (Bulk)
```
POST /api/contacts/bulk-action
Body:
{
  "action": "email",
  "role": "charter_crew",
  "boat_id": 123,
  "subject": "Upcoming charter schedule",
  "message": "Email body...",
  "recipients": [1, 2, 3]
}

Response 200:
{
  "status": "success",
  "emails_sent": 3,
  "recipients": [
    {
      "contact_id": 1,
      "email": "crew1@example.com",
      "status": "sent"
    }
  ]
}
```

---

## 3. MOBILE-FIRST UX DESIGN

### 3.1 Contact List View

```
┌─────────────────────────────────┐
│        Boat Contacts            │
├─────────────────────────────────┤
│  🔍 Search or filter by role    │
├─────────────────────────────────┤
│                                 │
│  ⭐ John's Marine (mechanic)    │
│     +1-555-0100 | john@...     │
│     Last used: 2 days ago      │
│     [call] [email] [more]      │
│                                 │
│  Jane Electrical (electrician)  │
│     +1-555-0101 | jane@...     │
│     Last used: 3 weeks ago     │
│     [call] [email] [more]      │
│                                 │
│  Bob's Cleaning Service        │
│     +1-555-0102                │
│     Last used: Never           │
│     [call] [email] [more]      │
│                                 │
├─────────────────────────────────┤
│ [+ Add New Contact] [Quick Do] │
└─────────────────────────────────┘
```

### 3.2 Quick Actions Menu

```
┌─────────────────────────────────┐
│       Quick Actions             │
├─────────────────────────────────┤
│                                 │
│  📞 Call My Mechanic            │
│     → Recommends: John's Marine │
│                                 │
│  ✉️  Email Charter Crew          │
│     → 3 crew members available  │
│                                 │
│  📱 Share with WhatsApp         │
│     → Copy to group or contact  │
│                                 │
│  🔧 New Service Event           │
│     → Auto-suggest provider     │
│                                 │
│  🌟 View Favorites              │
│     → 5 starred contacts        │
│                                 │
└─────────────────────────────────┘
```

### 3.3 Contact Detail View

```
┌─────────────────────────────────┐
│  John's Marine Service      ⭐  │
├─────────────────────────────────┤
│                                 │
│  Role: Mechanic                 │
│  Company: John's Marine         │
│                                 │
│  📞 +1-555-0100 [tap to call]  │
│  ✉️ john@marine.com [tap email]│
│  💬 [WhatsApp] [SMS] [Copy]     │
│                                 │
│  Notes:                         │
│  Expert in diesel engines       │
│  ---                            │
│  Usage: 12 times                │
│  Last used: 2025-11-10 14:30    │
│                                 │
│  Interaction History:           │
│  • 2025-11-10: Call (10 min)   │
│  • 2025-11-02: Email            │
│  • 2025-10-28: Call             │
│                                 │
├─────────────────────────────────┤
│  [Edit] [Delete] [Share]        │
└─────────────────────────────────┘
```

### 3.4 Mobile One-Tap Features

**Telephone Links (HTML):**
```html
<a href="tel:+1-555-0100" class="tap-call-button">
  📞 Call John's Marine
</a>
```

**Email Links (HTML):**
```html
<a href="mailto:john@marine.com?subject=Service%20Request"
   class="tap-email-button">
  ✉️ Email John's Marine
</a>
```

**WhatsApp Share (HTML):**
```html
<a href="whatsapp://send?phone=+15550100&text=Hi%20John%2C%20I%20need%20marine%20service"
   class="tap-whatsapp-button">
  💬 WhatsApp John's Marine
</a>
```

---

## 4. INTEGRATION WITH S2-H03 (Maintenance Log)

### 4.1 Auto-Suggest Workflow

**Trigger:** When S2-H03 logs a maintenance service event

**Flow:**
```
1. Maintenance Log Entry Created (S2-H03)
   └─> Service Type: "Engine Repair"
   └─> Provider Name Extracted: "John's Marine Service"
   └─> Provider Phone (if provided): "+1-555-0100"

2. S2-H03 Sends IF.bus Message to S2-H05:
   {
     "performative": "request",
     "sender": "if://agent/session-2/haiku-03",
     "receiver": ["if://agent/session-2/haiku-05"],
     "content": {
       "action": "suggest_contact",
       "maintenance_log_id": 456,
       "extracted_provider": {
         "name": "John's Marine Service",
         "role": "mechanic",
         "phone": "+1-555-0100",
         "email": null,
         "company": "John's Marine"
       },
       "boat_id": 123
     }
   }

3. S2-H05 Processes Suggestion:
   • Check if contact already exists
   • Create suggestion record in `contact_suggestions` table
   • Return suggestion with options: "Create", "Merge", "Skip"

4. S2-H05 Responds to S2-H03:
   {
     "performative": "inform",
     "sender": "if://agent/session-2/haiku-05",
     "receiver": ["if://agent/session-2/haiku-03"],
     "content": {
       "suggestion_id": 789,
       "maintenance_log_id": 456,
       "status": "pending",
       "suggested_contact": {
         "name": "John's Marine Service",
         "role": "mechanic"
       },
       "actions": ["create", "merge_with_existing", "skip"],
       "existing_match": null
     }
   }

5. User Action:
   • User sees suggestion in Contact Management UI
   • Chooses: Create New Contact, Merge with Existing, or Skip
   • S2-H05 Updates `contact_suggestions` table status
```

### 4.2 API Endpoint for S2-H03

```
POST /api/contacts/suggest
From: S2-H03 Maintenance Log System

Body:
{
  "boat_id": 123,
  "maintenance_log_id": 456,
  "extracted_provider": {
    "name": "John's Marine Service",
    "role": "mechanic",
    "phone": "+1-555-0100",
    "email": null,
    "company": "John's Marine"
  }
}

Response 200:
{
  "suggestion_id": 789,
  "status": "pending",
  "action_url": "/contacts/suggestions/789"
}
```

### 4.3 Maintenance Log Link

When user accepts suggestion from maintenance log, create bidirectional link:
- `contact_interactions` record links contact to maintenance_log_id
- `boat_maintenance_log` (in S2-H03) has optional contact_id field

---

## 5. INTEGRATION WITH S2-H08 (WhatsApp)

### 5.1 WhatsApp Quick Actions

**Voice Command → Contact Suggestion:**
```
User: "@NaviDocs call mechanic"

Flow:
1. S2-H08 receives voice command
2. S2-H08 sends IF.bus request to S2-H05:
   {
     "performative": "request",
     "sender": "if://agent/session-2/haiku-08",
     "receiver": ["if://agent/session-2/haiku-05"],
     "content": {
       "action": "recommend_contact",
       "boat_id": 123,
       "role": "mechanic",
       "context": "whatsapp_voice_command"
     }
   }

3. S2-H05 responds with recommendation:
   {
     "performative": "inform",
     "sender": "if://agent/session-2/haiku-05",
     "receiver": ["if://agent/session-2/haiku-08"],
     "content": {
       "recommended_contact": {
         "id": 1,
         "name": "John's Marine Service",
         "phone": "+1-555-0100",
         "whatsapp_enabled": true
       },
       "action": "initiate_whatsapp_call",
       "whatsapp_number": "+1-555-0100"
     }
   }

4. S2-H08 initiates WhatsApp call with contact
5. S2-H05 logs interaction: contact_interactions record
```

### 5.2 Share Contact to WhatsApp Group

**UI Action:**
```
In Contact Detail View:
[Share] → [WhatsApp Group] → Select Group → [Send]

API Call:
POST /api/contacts/{contact_id}/share
Body:
{
  "platform": "whatsapp",
  "action": "share_to_group",
  "group_id": "s2_h08_crew_group"
}

S2-H05 sends to S2-H08:
{
  "performative": "request",
  "sender": "if://agent/session-2/haiku-05",
  "receiver": ["if://agent/session-2/haiku-08"],
  "content": {
    "action": "share_contact",
    "contact": {
      "name": "John's Marine Service",
      "phone": "+1-555-0100",
      "email": "john@marine.com",
      "role": "mechanic"
    },
    "group": "s2_h08_crew_group",
    "format": "vcard"
  }
}
```

### 5.3 WhatsApp Group Bulk Communication

**Feature: "@NaviDocs email crew" or "@NaviDocs message crew"**

```
POST /api/contacts/bulk-action
Body:
{
  "action": "whatsapp_bulk_message",
  "role": "charter_crew",
  "boat_id": 123,
  "message": "Charter schedule updated for next week",
  "platform": "whatsapp"
}

S2-H05 sends to S2-H08:
{
  "performative": "request",
  "sender": "if://agent/session-2/haiku-05",
  "receiver": ["if://agent/session-2/haiku-08"],
  "content": {
    "action": "bulk_send_whatsapp",
    "contacts": [
      { "phone": "+1-555-0200", "name": "Crew Member 1" },
      { "phone": "+1-555-0201", "name": "Crew Member 2" }
    ],
    "message": "Charter schedule updated for next week"
  }
}
```

---

## 6. SMART SUGGESTIONS ALGORITHM

### 6.1 Recommendation Logic

**Context: "Show me mechanics"**

```python
def recommend_contact(boat_id, role, context='recent'):
    """
    Recommendation priority:
    1. Favorite + Recently Used (within 30 days)
    2. Recently Used (within 60 days)
    3. Most Used (by usage_count)
    4. Alphabetical
    """

    contacts = get_contacts_by_role(boat_id, role)

    if context == 'recent':
        # Filter: last_used within 30 days
        recent = [c for c in contacts
                 if c.last_used > (now - 30 days)]
        recent_favorites = [c for c in recent if c.is_favorite]

        if recent_favorites:
            return sorted_by_last_used(recent_favorites)[0]
        elif recent:
            return sorted_by_last_used(recent)[0]

    elif context == 'favorite':
        favorites = [c for c in contacts if c.is_favorite]
        if favorites:
            return sorted_by_last_used(favorites)[0]

    elif context == 'most_used':
        return sorted_by_usage_count(contacts)[0]

    # Default: return most recently used
    return sorted_by_last_used(contacts)[0]
```

### 6.2 Quick Action Suggestion

**"Call my mechanic":**

```python
def get_quick_action_contact(boat_id, role):
    """
    Smart priority:
    1. Used in last 7 days + favorite
    2. Used in last 14 days
    3. Most frequently used
    4. First available
    """

    contacts = get_contacts_by_role(boat_id, role)

    # Check for recent + favorite
    recent_favorite = [c for c in contacts
                       if c.is_favorite and
                       c.last_used > (now - 7 days)]
    if recent_favorite:
        return recent_favorite[0]

    # Check for recent
    recent = [c for c in contacts
              if c.last_used > (now - 14 days)]
    if recent:
        return sorted_by_last_used(recent)[0]

    # Check for frequently used
    if contacts:
        return sorted_by_usage_count(contacts)[0]

    return None
```

### 6.3 Maintenance Log Auto-Suggest

```python
def auto_suggest_from_maintenance_log(maintenance_log_entry):
    """
    Extract provider info from maintenance log
    Score potential matches
    """

    provider_name = extract_provider_name(maintenance_log_entry)
    service_type = maintenance_log_entry.service_type
    boat_id = maintenance_log_entry.boat_id

    # Map service_type to contact role
    role_mapping = {
        'engine_repair': 'mechanic',
        'hull_inspection': 'surveyor',
        'electrical': 'electrician',
        'canvas_repair': 'canvas_maker',
        'cleaning': 'cleaner',
        'rigging': 'rigger',
        'detailing': 'detailer'
    }

    expected_role = role_mapping.get(service_type)

    # Search for existing contact
    existing = fuzzy_match_contact(boat_id, provider_name, expected_role)

    if existing:
        return {
            'status': 'match_found',
            'contact_id': existing.id,
            'action': 'merge'
        }
    else:
        return {
            'status': 'no_match',
            'suggestion': {
                'name': provider_name,
                'role': expected_role,
                'source': f'maintenance_log:{maintenance_log_entry.id}'
            },
            'action': 'create'
        }
```

---

## 7. DATA STRUCTURES & RESPONSE MODELS

### Contact Object
```json
{
  "id": 1,
  "boat_id": 123,
  "name": "John's Marine Service",
  "role": "mechanic",
  "phone": "+1-555-0100",
  "email": "john@marine.com",
  "company": "John's Marine",
  "notes": "Expert in diesel engines",
  "last_used": "2025-11-10T14:30:00Z",
  "is_favorite": true,
  "usage_count": 12,
  "created_at": "2025-10-01T10:00:00Z",
  "updated_at": "2025-11-10T14:30:00Z"
}
```

### Suggestion Object
```json
{
  "id": 789,
  "boat_id": 123,
  "maintenance_log_id": 456,
  "suggested_name": "John's Marine Service",
  "suggested_role": "mechanic",
  "suggested_phone": "+1-555-0100",
  "suggested_email": null,
  "status": "pending",
  "created_at": "2025-11-13T10:00:00Z",
  "created_by": "maintenance_log_service"
}
```

### Interaction Object
```json
{
  "id": 1,
  "boat_id": 123,
  "contact_id": 1,
  "interaction_type": "call",
  "interaction_date": "2025-11-10T14:30:00Z",
  "source_type": "quick_action",
  "source_id": null
}
```

---

## 8. IMPLEMENTATION CHECKLIST

### Database & Backend
- [ ] Create `boat_contacts` table
- [ ] Create `contact_interactions` table
- [ ] Create `contact_suggestions` table
- [ ] Create database indices
- [ ] Implement CRUD endpoints
- [ ] Implement search/filter endpoints
- [ ] Implement recommendation algorithm
- [ ] Implement soft-delete functionality
- [ ] Add audit logging for interactions
- [ ] Implement fuzzy matching for auto-suggest

### Mobile Frontend
- [ ] Create contact list view (with infinite scroll)
- [ ] Create contact detail view
- [ ] Create quick actions menu
- [ ] Implement tel: links for calling
- [ ] Implement mailto: links for email
- [ ] Implement favorite toggle
- [ ] Create add/edit contact form
- [ ] Implement search interface
- [ ] Add role filtering UI
- [ ] Implement WhatsApp share button

### Integrations
- [ ] S2-H03 Maintenance Log Integration
  - [ ] Receive IF.bus messages from S2-H03
  - [ ] Display auto-suggestions in UI
  - [ ] Send confirmation back to S2-H03
  - [ ] Link contacts to maintenance events
- [ ] S2-H08 WhatsApp Integration
  - [ ] Receive IF.bus requests for recommendations
  - [ ] Send contact recommendations to S2-H08
  - [ ] Handle WhatsApp call initiation
  - [ ] Support contact sharing to groups
  - [ ] Support bulk messaging via WhatsApp

### Analytics & Monitoring
- [ ] Track contact interactions
- [ ] Monitor usage statistics
- [ ] Log suggestion acceptance rates
- [ ] Monitor API performance
- [ ] Set up alerts for integration failures

---

## 9. SECURITY & PRIVACY

### Data Protection
- Encrypt phone numbers and emails at rest
- Require boat_id authorization for all queries
- Implement role-based access control (RBAC)
- Audit all contact data modifications
- Soft-delete for data retention

### API Security
- Require authentication for all endpoints
- Rate limit contact suggestions (prevent spam)
- Validate phone/email formats
- Sanitize notes field (prevent XSS)
- HTTPS-only for all communications

### Compliance
- GDPR: Allow contact deletion (hard delete on request)
- CCPA: Provide contact data export
- Comply with whatsapp Terms of Service
- Honor user phone/email preferences

---

## 10. PERFORMANCE OPTIMIZATION

### Database
- Index on (boat_id, role) for quick filtering
- Index on last_used for recommendation queries
- Partition by boat_id for large datasets
- Archive old interactions quarterly

### API
- Implement caching for frequently accessed contacts
- Use database pagination (limit 50 by default)
- Async processing for bulk operations
- Connection pooling for database

### Frontend
- Lazy load contact details
- Cache API responses in local storage
- Preload favorite contacts on load
- Virtual scrolling for large contact lists

---

## 11. FUTURE ENHANCEMENTS

### Phase 2
- Contact groups (e.g., "Engine Specialists")
- Ratings/reviews of service providers
- Price tracking for services
- Contract documents storage
- Appointment scheduling
- Invoice/payment tracking

### Phase 3
- Integration with boat registry for provider recommendations
- Geographic location for preferred providers
- Seasonal service reminders
- Provider certifications tracking
- Insurance provider integration

---

## IF.BUS COMMUNICATION PROTOCOL

### Integration with S2-H03 (Maintenance Log)

**S2-H05 Capability Advertisement:**
```json
{
  "performative": "confirm",
  "sender": "if://agent/session-2/haiku-05",
  "receiver": ["if://agent/session-2/haiku-03"],
  "content": {
    "capability": "contact_management",
    "status": "ready",
    "integration": "auto-suggest from maintenance log",
    "endpoint": "POST /api/contacts/suggest",
    "expected_payload": {
      "boat_id": "number",
      "maintenance_log_id": "number",
      "extracted_provider": {
        "name": "string",
        "role": "enum",
        "phone": "string",
        "email": "string",
        "company": "string"
      }
    },
    "response": {
      "suggestion_id": "number",
      "status": "pending|accepted|rejected|merged"
    }
  }
}
```

### Integration with S2-H08 (WhatsApp)

**S2-H05 Capability Advertisement:**
```json
{
  "performative": "confirm",
  "sender": "if://agent/session-2/haiku-05",
  "receiver": ["if://agent/session-2/haiku-08"],
  "content": {
    "capability": "contact_management",
    "status": "ready",
    "integrations": [
      {
        "name": "recommend_contact",
        "endpoint": "GET /api/contacts/recommend",
        "trigger": "voice_command",
        "example": "@NaviDocs call mechanic"
      },
      {
        "name": "share_contact",
        "endpoint": "POST /api/contacts/{id}/share",
        "trigger": "user_action",
        "platforms": ["whatsapp"]
      },
      {
        "name": "bulk_messaging",
        "endpoint": "POST /api/contacts/bulk-action",
        "trigger": "voice_command",
        "example": "@NaviDocs email crew"
      }
    ]
  }
}
```

---

## DEPLOYMENT NOTES

### Environment Setup
```bash
# Create database
mysql -u root -p < contact-management-schema.sql

# Deploy API server
docker build -t contact-management-api .
docker run -d -p 3000:3000 contact-management-api

# Deploy mobile client
npm install && npm run build
# Deploy to app store / PWA
```

### Configuration
```env
DATABASE_URL=mysql://user:pass@localhost:3306/navidocs
WHATSAPP_API_KEY=xxx
MAX_CONTACTS_PER_BOAT=200
SUGGESTION_AUTO_CLEANUP_DAYS=90
```

---

**END OF SPECIFICATION**

Created by: S2-H05 (Contact Management System Agent)
Status: Complete
Integration Ready: S2-H03, S2-H08
