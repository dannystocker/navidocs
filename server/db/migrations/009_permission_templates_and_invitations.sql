-- Migration 009: Permission Templates and Invitations System
-- Date: 2025-10-21
-- Description: Add support for permission templates and email invitations

-- Permission Templates Table
CREATE TABLE IF NOT EXISTS permission_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permission_level TEXT NOT NULL CHECK(permission_level IN ('viewer', 'editor', 'manager', 'admin')),
  default_duration_hours INTEGER,  -- NULL means permanent
  is_system BOOLEAN DEFAULT 0,     -- System templates cannot be deleted
  metadata TEXT,                    -- JSON: {icon, color, restrictions, etc}
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Invitations Table
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  template_id TEXT REFERENCES permission_templates(id),
  entity_id TEXT,                   -- Which property/vessel
  entity_type TEXT DEFAULT 'document',  -- document, vessel, property, etc
  invited_by TEXT REFERENCES users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at INTEGER NOT NULL,
  accepted_at INTEGER,
  metadata TEXT,                     -- JSON: {message, restrictions}
  created_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_templates_system ON permission_templates(is_system);
CREATE INDEX idx_templates_level ON permission_templates(permission_level);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_entity ON invitations(entity_id, entity_type);

-- Insert System Templates
INSERT INTO permission_templates (id, name, description, permission_level, default_duration_hours, is_system, metadata, created_by, created_at, updated_at) VALUES
('tpl-captain', 'Captain', 'Full vessel management access with emergency override', 'manager', NULL, 1, '{"icon":"⚓","color":"#1e40af","scope":"vessel"}', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
('tpl-crew-member', 'Crew Member', 'Basic viewer access for crew during shifts', 'viewer', 8, 1, '{"icon":"👷","color":"#059669","scope":"vessel"}', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
('tpl-maintenance', 'Maintenance Contractor', 'Temporary editor access for maintenance work', 'editor', 168, 1, '{"icon":"🔧","color":"#d97706","scope":"vessel"}', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
('tpl-inspector', 'Inspector/Auditor', 'Read-only access for compliance inspections', 'viewer', 24, 1, '{"icon":"📋","color":"#7c3aed","scope":"vessel"}', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
('tpl-property-manager', 'Property Manager', 'Full administrative access to organization', 'admin', NULL, 1, '{"icon":"🏢","color":"#dc2626","scope":"organization"}', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
('tpl-office-staff', 'Office Staff', 'Viewer access to all documents', 'viewer', NULL, 1, '{"icon":"💼","color":"#64748b","scope":"organization"}', NULL, strftime('%s', 'now'), strftime('%s', 'now'));
