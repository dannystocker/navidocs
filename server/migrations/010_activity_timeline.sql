-- Activity Log for Organization Timeline
-- Tracks all events: uploads, maintenance, warranty, settings changes

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  entity_id TEXT,  -- Optional: boat/yacht ID if event is entity-specific
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'document_upload', 'maintenance_log', 'warranty_claim', 'settings_change'
  event_action TEXT,  -- 'created', 'updated', 'deleted', 'viewed'
  event_title TEXT NOT NULL,
  event_description TEXT,
  metadata TEXT,  -- JSON blob for event-specific data
  reference_id TEXT,  -- ID of related resource (document_id, maintenance_id, etc.)
  reference_type TEXT,  -- 'document', 'maintenance', 'warranty', etc.
  created_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for fast timeline queries
CREATE INDEX IF NOT EXISTS idx_activity_org_created
  ON activity_log(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_entity
  ON activity_log(entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_type
  ON activity_log(event_type);

-- Test data (for demo)
INSERT INTO activity_log (id, organization_id, user_id, event_type, event_action, event_title, event_description, created_at)
VALUES
  ('evt_demo_1', '6ce0dfc7-f754-4122-afde-85154bc4d0ae', 'bef71b0c-3427-485b-b4dd-b6399f4d4c45',
   'document_upload', 'created', 'Bilge Pump Manual Uploaded',
   'Azimut 55S Bilge Pump Manual.pdf (2.3MB)',
   strftime('%s', 'now') * 1000);
