# Cloud Session Prompt: Crew & Contact Management

**Feature:** Contact Directory for Crew, Service Providers, Marinas, Emergency Contacts
**Duration:** 60-90 minutes
**Priority:** P1 (Core Feature)
**Branch:** `feature/crew-contacts`

---

## Your Mission

Build a comprehensive contact management system for marine operations. Track crew members with certifications, service providers with ratings, marina details, and emergency contacts. This feature integrates with maintenance tasks and equipment service history.

**What you're building:**
- Contact directory with type categorization
- Crew certification tracking
- Service provider ratings and reviews
- Marina details with amenities
- Emergency contact quick access
- Service history per provider
- Integration with maintenance completions

---

## Quick Start

```bash
cd /home/setup/navidocs
git checkout navidocs-cloud-coordination
git pull origin navidocs-cloud-coordination
git checkout -b feature/crew-contacts
```

---

## Step 1: Read the Spec (5 min)

**Read this file:** `/home/setup/navidocs/FEATURE_SPEC_CREW_CONTACTS.md`

This spec contains:
- Complete database schema (5 tables)
- All 7 API endpoints with request/response examples
- Frontend component designs
- Contact types and categories
- Demo data (20-25 sample contacts)

---

## Step 2: Database Migration (15 min)

**Create:** `server/migrations/013_crew_contacts.sql`

**Tables to create:**
1. `contacts` - Main contact information
2. `contact_crew_details` - Crew-specific data (certifications, rates)
3. `contact_service_provider_details` - Service provider data (ratings, services)
4. `contact_marina_details` - Marina-specific data (slip, amenities)
5. `contact_service_history` - Service records per provider

**Copy schema from:** FEATURE_SPEC_CREW_CONTACTS.md (lines 31-150)

**Run migration:**
```bash
cd server
node run-migration.js 013_crew_contacts.sql
```

**Verify:**
```bash
sqlite3 db/navidocs.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'contact%';"
```

---

## Step 3: Backend Service (25 min)

**Create:** `server/services/contacts-service.js`

**Key functions:**

```javascript
// Contact CRUD
async function createContact(orgId, contactData) {
  // 1. Create main contact record
  // 2. Based on contact_type, create type-specific details
  //    - crew → contact_crew_details
  //    - service_provider → contact_service_provider_details
  //    - marina → contact_marina_details
}

async function getContactList(orgId, filters) {
  // Filter by: type, favorites, emergency
  // Search by: name, company, role
  // Include type-specific details in response
}

async function getContactById(contactId) {
  // Get contact + type-specific details + service history
}

async function updateContact(contactId, updates)
async function deleteContact(contactId)

// Service history
async function addServiceHistory(contactId, serviceData)
async function getServiceHistory(contactId)

// Special queries
async function getEmergencyContacts(orgId) {
  // Get contacts where is_emergency_contact = 1
}

async function getTopRatedProviders(orgId, serviceCategory) {
  // Get service providers sorted by rating
}
```

---

## Step 4: Backend Routes (15 min)

**Create:** `server/routes/contacts.js`

```javascript
const express = require('express');
const router = express.Router({ mergeParams: true });
const contactsService = require('../services/contacts-service');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/organizations/:orgId/contacts
router.get('/', async (req, res) => {
  const { orgId } = req.params;
  const { type, favorites, emergency, search } = req.query;
  // Call contactsService.getContactList()
});

// POST /api/organizations/:orgId/contacts
router.post('/', async (req, res) => {
  // Create contact with type-specific details
});

// GET /api/organizations/:orgId/contacts/:contactId
router.get('/:contactId', async (req, res) => {
  // Get contact details + service history
});

// PUT /api/organizations/:orgId/contacts/:contactId
router.put('/:contactId', async (req, res) => {
  // Update contact
});

// DELETE /api/organizations/:orgId/contacts/:contactId
router.delete('/:contactId', async (req, res) => {
  // Delete contact
});

// POST /api/organizations/:orgId/contacts/:contactId/service-history
router.post('/:contactId/service-history', async (req, res) => {
  // Add service history entry
});

// GET /api/organizations/:orgId/contacts/emergency
router.get('/emergency', async (req, res) => {
  // Get emergency contacts only
});

module.exports = router;
```

**Register route in `server/index.js`:**
```javascript
app.use('/api/organizations/:orgId/contacts', require('./routes/contacts'));
```

---

## Step 5: Frontend - Contacts Directory (30 min)

**Create:** `client/src/views/Contacts.vue`

**Features:**
- Card-based layout
- Filter by contact type (tabs)
- Search bar
- Star favorites
- Quick actions (Call, Email, View, Edit)

**Template structure:**

```vue
<template>
  <div class="contacts-view">
    <div class="header">
      <h1>Contacts</h1>
      <button @click="showAddModal = true">+ Add Contact</button>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button :class="{ active: filters.type === '' }" @click="filters.type = ''">
        All ({{ stats.total }})
      </button>
      <button :class="{ active: filters.type === 'crew' }" @click="filters.type = 'crew'">
        Crew ({{ stats.crew }})
      </button>
      <button :class="{ active: filters.type === 'service_provider' }" @click="filters.type = 'service_provider'">
        Service Providers ({{ stats.service_providers }})
      </button>
      <button :class="{ active: filters.type === 'marina' }" @click="filters.type = 'marina'">
        Marinas ({{ stats.marinas }})
      </button>
      <button :class="{ active: filters.type === 'emergency' }" @click="filters.type = 'emergency'">
        Emergency ({{ stats.emergency }})
      </button>
    </div>

    <!-- Search -->
    <input v-model="searchQuery" placeholder="Search contacts..." class="search-bar">

    <!-- Contact Cards -->
    <div class="contacts-grid">
      <div v-for="contact in filteredContacts" :key="contact.id" class="contact-card">
        <div class="card-header">
          <button @click="toggleFavorite(contact)" class="favorite-btn">
            {{ contact.is_favorite ? '⭐' : '☆' }}
          </button>
          <h3>{{ contact.first_name }} {{ contact.last_name }}</h3>
        </div>

        <div class="card-body">
          <p class="company" v-if="contact.company_name">{{ contact.company_name }}</p>
          <p class="role" v-if="contact.role_title">{{ contact.role_title }}</p>

          <div class="contact-info">
            <p v-if="contact.primary_phone">📞 {{ contact.primary_phone }}</p>
            <p v-if="contact.email">✉️ {{ contact.email }}</p>
          </div>

          <!-- Service Provider Details -->
          <div v-if="contact.contact_type === 'service_provider' && contact.service_provider_details" class="provider-details">
            <span class="rating">⭐ {{ contact.service_provider_details.rating?.toFixed(1) || 'N/A' }}</span>
            <span class="rate">💰 ${{ contact.service_provider_details.hourly_rate }}/hr</span>
            <span class="jobs">{{ contact.service_provider_details.total_jobs_completed }} jobs</span>
          </div>

          <!-- Crew Details -->
          <div v-if="contact.contact_type === 'crew' && contact.crew_details" class="crew-details">
            <span class="experience">{{ contact.crew_details.experience_years }} years exp</span>
            <span class="rate">💰 ${{ contact.crew_details.daily_rate }}/day</span>
          </div>
        </div>

        <div class="card-actions">
          <button @click="callContact(contact)">Call</button>
          <button @click="emailContact(contact)">Email</button>
          <button @click="viewContact(contact)">View</button>
          <button @click="editContact(contact)">Edit</button>
        </div>
      </div>
    </div>

    <AddContactModal v-if="showAddModal" @close="showAddModal = false" @saved="loadContacts" />
    <ContactDetailModal v-if="selectedContact" :contact="selectedContact" @close="selectedContact = null" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      contacts: [],
      stats: {},
      filters: {
        type: ''
      },
      searchQuery: '',
      showAddModal: false,
      selectedContact: null
    };
  },
  computed: {
    filteredContacts() {
      let filtered = this.contacts;

      if (this.filters.type) {
        filtered = filtered.filter(c => c.contact_type === this.filters.type);
      }

      if (this.searchQuery) {
        const search = this.searchQuery.toLowerCase();
        filtered = filtered.filter(c =>
          c.first_name.toLowerCase().includes(search) ||
          c.last_name.toLowerCase().includes(search) ||
          c.company_name?.toLowerCase().includes(search) ||
          c.role_title?.toLowerCase().includes(search)
        );
      }

      return filtered;
    }
  },
  async mounted() {
    await this.loadContacts();
  },
  methods: {
    async loadContacts() {
      const response = await fetch(`/api/organizations/${this.orgId}/contacts`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await response.json();
      this.contacts = data.contacts;
      this.stats = data.stats;
    },
    callContact(contact) {
      window.location.href = `tel:${contact.primary_phone}`;
    },
    emailContact(contact) {
      window.location.href = `mailto:${contact.email}`;
    },
    // ... other methods
  }
};
</script>

<style scoped>
.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.contact-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
```

---

## Step 6: Add Contact Modal (20 min)

**Create:** `client/src/components/AddContactModal.vue`

**Multi-step form:**

**Step 1: Contact Type**
- Radio buttons: Crew, Service Provider, Marina, Emergency, Broker, Other

**Step 2: Basic Info**
- First Name*, Last Name*, Company, Role/Title
- Primary Phone*, Secondary Phone, Email
- Address, City, State, Postal Code, Country
- Notes
- Favorite (checkbox), Emergency Contact (checkbox)

**Step 3: Type-Specific Details**

Show different fields based on selected type:

```vue
<div v-if="formData.contact_type === 'service_provider'">
  <multiselect v-model="formData.service_categories" :options="serviceCategories" multiple />
  <input v-model="formData.hourly_rate" type="number" placeholder="Hourly Rate">
  <input v-model="formData.certifications" placeholder="Certifications (comma-separated)">
</div>

<div v-if="formData.contact_type === 'crew'">
  <input v-model="formData.experience_years" type="number" placeholder="Years of Experience">
  <input v-model="formData.daily_rate" type="number" placeholder="Daily Rate">
  <select v-model="formData.availability_status">
    <option>Available</option>
    <option>Busy</option>
    <option>Seasonal</option>
  </select>
</div>

<div v-if="formData.contact_type === 'marina'">
  <input v-model="formData.marina_name" placeholder="Marina Name">
  <input v-model="formData.slip_number" placeholder="Slip Number">
  <input v-model="formData.monthly_rate" type="number" placeholder="Monthly Rate">
</div>
```

---

## Step 7: Emergency Contacts Widget (10 min)

**Create:** `client/src/components/EmergencyContactsWidget.vue`

**Display on dashboard:**

```vue
<template>
  <div class="emergency-widget">
    <h3>🚨 Emergency Contacts</h3>
    <div v-for="contact in emergencyContacts" :key="contact.id" class="emergency-contact">
      <strong>{{ contact.first_name }} {{ contact.last_name }}</strong>
      <a :href="`tel:${contact.primary_phone}`">{{ contact.primary_phone }}</a>
      <span v-if="contact.notes" class="note">{{ contact.notes }}</span>
    </div>
  </div>
</template>
```

Add to HomeView.vue

---

## Step 8: Navigation & Router (10 min)

**Update:** `client/src/router.js`

```javascript
{
  path: '/contacts',
  component: () => import('./views/Contacts.vue'),
  meta: { requiresAuth: true }
}
```

**Update navigation:** Add "Contacts" link

---

## Step 9: Demo Data (10 min)

**Create:** `server/seed-contacts-demo-data.js`

**Sample contacts:**
- 5 crew members (with certifications)
- 8 service providers (various specialties, ratings 4.5-5.0)
- 4 marinas (with slip details)
- 4 emergency contacts
- 2 brokers
- 2-3 other contacts

**Run:**
```bash
node server/seed-contacts-demo-data.js
```

---

## Step 10: Testing (10 min)

**Test checklist:**
- [ ] Can add contacts with all types
- [ ] Type-specific fields save correctly
- [ ] Can filter by contact type
- [ ] Can search contacts
- [ ] Can favorite contacts
- [ ] Emergency contacts widget shows correctly
- [ ] Service provider ratings display
- [ ] Can call/email from contact card

---

## Step 11: Completion (5 min)

```bash
git add .
git commit -m "[SESSION-8] Add crew & contact management

Features:
- Contact directory with type categorization
- Crew certification and availability tracking
- Service provider ratings and service history
- Marina details with amenities
- Emergency contact quick access
- Contact search and filtering
- Integration with maintenance tasks

Database: 5 new tables
API: 7 new endpoints
Frontend: Contacts view + modals + emergency widget"

git push origin feature/crew-contacts
```

**Create:** `SESSION-8-COMPLETE.md`

---

## Success Criteria

✅ Database migration creates 5 tables
✅ All 7 API endpoints working
✅ Can add contacts with type-specific details
✅ Can filter by contact type
✅ Can search contacts
✅ Can favorite contacts
✅ Emergency contacts widget on dashboard
✅ Service providers can be rated
✅ Demo data loads successfully

---

**Go build! 🚀**
