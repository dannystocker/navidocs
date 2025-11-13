# Admin UI Implementation Plan

## Overview
Based on persona analysis, implementing a progressive disclosure UI system that starts simple and reveals complexity based on user needs.

## Implementation Strategy

### Phase 1: Foundation (CURRENT)

#### 1. Permission Templates System
**Backend:** Create pre-built role templates
- `Captain` - Manager level, full vessel access
- `Crew Member` - Viewer level, shift-based
- `Maintenance Contractor` - Editor level, temporary (7 days)
- `Inspector` - Viewer level, temporary (1 day)
- `Property Manager` - Admin level, organization-wide

**Files to create:**
- `services/permission-templates.service.js`
- `routes/permission-templates.routes.js`
- Migration for templates table

#### 2. Simple Admin Dashboard
**Features:**
- Quick user invitation (email → auto-assign template)
- Active permissions list
- Recent activity feed
- Mobile-responsive cards layout

**Tech Stack:** Vanilla JS + Tailwind CSS (lightweight, no framework overhead)

#### 3. Mobile-First Permission Grant
**Captain's Quick Access:**
- Scan QR code to onboard crew
- Select template (Crew/Contractor/Inspector)
- Set duration (Shift/Day/Week/Custom)
- Send invitation

**UI Components:**
- Large touch targets (min 44px)
- High contrast mode for outdoor use
- Offline capability with service worker

---

## File Structure

```
server/
├── services/
│   ├── permission-templates.service.js  [NEW]
│   └── quick-invite.service.js           [NEW]
├── routes/
│   ├── admin.routes.js                   [NEW]
│   └── quick-invite.routes.js            [NEW]
├── db/migrations/
│   └── 009_permission_templates.sql      [NEW]
└── public/admin/                         [NEW]
    ├── index.html                        Simple admin dashboard
    ├── quick-grant.html                  Mobile permission grant
    ├── css/admin.css                     Tailwind + custom
    └── js/
        ├── admin-dashboard.js
        ├── quick-grant.js
        └── permission-visualizer.js

client/ (if separate React app exists)
├── src/
    └── pages/
        └── admin/                        [NEW]
            ├── Dashboard.jsx
            ├── PermissionGrant.jsx
            ├── BulkOperations.jsx
            └── Analytics.jsx
```

---

## API Endpoints to Implement

### Permission Templates
```
GET    /api/admin/templates              List all permission templates
POST   /api/admin/templates              Create custom template
GET    /api/admin/templates/:id          Get template details
PUT    /api/admin/templates/:id          Update template
DELETE /api/admin/templates/:id          Delete template
```

### Quick Invite
```
POST   /api/admin/quick-invite           Send invitation with template
GET    /api/admin/invitations            List pending invitations
DELETE /api/admin/invitations/:id        Cancel invitation
```

### Admin Dashboard
```
GET    /api/admin/stats                  Dashboard statistics
GET    /api/admin/activity               Recent activity feed
GET    /api/admin/users                  List users with permissions
POST   /api/admin/users/:id/revoke-all   Emergency revoke all access
```

### Bulk Operations
```
POST   /api/admin/bulk/grant             Grant permissions to multiple users
POST   /api/admin/bulk/revoke            Revoke from multiple users
POST   /api/admin/bulk/import            CSV import
GET    /api/admin/bulk/export            CSV export
```

---

## Database Schema

### permission_templates table
```sql
CREATE TABLE permission_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  permission_level TEXT NOT NULL,  -- viewer, editor, manager, admin
  default_duration_hours INTEGER,  -- NULL = permanent
  is_system BOOLEAN DEFAULT 0,     -- System templates can't be deleted
  metadata TEXT,                    -- JSON: {icon, color, restrictions}
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### invitations table
```sql
CREATE TABLE invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  template_id TEXT REFERENCES permission_templates(id),
  entity_id TEXT,
  invited_by TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending',   -- pending, accepted, expired, cancelled
  expires_at INTEGER NOT NULL,
  accepted_at INTEGER,
  created_at INTEGER NOT NULL
);
```

---

## UI Modes Implementation

### Auto-detect mode based on:
1. Number of properties/entities (< 10 = Simple, 10-50 = Standard, 50+ = Enterprise)
2. Number of users (< 20 = Simple, 20-100 = Standard, 100+ = Enterprise)
3. API usage (any API calls = show Developer mode option)

### Mode switching:
- Allow manual override
- Save preference per user
- Keyboard shortcut: `Ctrl/Cmd + Shift + M` to toggle modes

---

## Success Metrics

### Performance Targets:
- Page load: < 2s on 3G
- Time to interactive: < 3s
- Permission grant: < 500ms API response
- Bulk operation (100 users): < 5s

### UX Targets (from persona analysis):
- Captain grants access: < 30 seconds
- Single agency setup: < 5 minutes
- Bulk onboard 20 users: < 3 minutes
- Mobile permission check: < 2 taps

---

## Progressive Enhancement Strategy

1. **Core HTML** - Works without JS (forms submit via POST)
2. **+ CSS** - Mobile-responsive, accessible
3. **+ Basic JS** - AJAX forms, client-side validation
4. **+ Advanced JS** - Real-time updates, drag-drop, visualizations
5. **+ PWA** - Offline support, push notifications

---

## Security Considerations

1. **CSRF protection** on all admin endpoints
2. **Rate limiting** on invitation endpoints (max 10/hour per user)
3. **Audit logging** for all permission changes
4. **Email verification** before accepting invitations
5. **IP whitelisting** option for enterprise users
6. **2FA requirement** for bulk operations (optional)

---

## Next Steps

1. ✅ Create persona requirements analysis (DONE)
2. Create permission templates service
3. Build simple admin dashboard
4. Implement quick invite system
5. Add mobile-optimized permission grant UI
6. Create bulk operations panel
7. Build analytics/reporting
8. Add visual permission builder (Phase 4)

---

*This plan follows the progressive disclosure principle: start simple, add complexity as needed.*
