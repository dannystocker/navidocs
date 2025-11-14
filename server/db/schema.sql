-- NaviDocs Database Schema v1.0
-- SQLite3 (designed for future PostgreSQL migration)
-- Author: Expert Panel Consensus
-- Date: 2025-01-19

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- UUID
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,            -- bcrypt hash
  created_at INTEGER NOT NULL,            -- Unix timestamp
  updated_at INTEGER NOT NULL,
  last_login_at INTEGER
);

-- Organizations (for multi-entity support)
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'personal',           -- personal, commercial, hoa
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- User-Organization membership
CREATE TABLE user_organizations (
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',             -- admin, manager, member, viewer
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, organization_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- ============================================================================
-- BOAT/ENTITY MANAGEMENT
-- ============================================================================

-- Boats/Entities (multi-vertical support)
CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,                  -- Primary owner
  entity_type TEXT NOT NULL,              -- boat, marina, condo, etc
  name TEXT NOT NULL,
  
  -- Boat-specific fields (nullable for other entity types)
  make TEXT,
  model TEXT,
  year INTEGER,
  hull_id TEXT,                           -- Hull Identification Number
  vessel_type TEXT,                       -- powerboat, sailboat, catamaran, trawler
  length_feet INTEGER,
  
  -- Property-specific fields (nullable for boats)
  property_type TEXT,                     -- marina, waterfront-condo, yacht-club
  address TEXT,
  gps_lat REAL,
  gps_lon REAL,
  
  -- Extensible metadata (JSON)
  metadata TEXT,
  
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sub-entities (systems, docks, units, facilities)
CREATE TABLE sub_entities (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,                              -- system, dock, unit, facility
  metadata TEXT,                          -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- Components (engines, panels, appliances)
CREATE TABLE components (
  id TEXT PRIMARY KEY,
  sub_entity_id TEXT,
  entity_id TEXT,                         -- Direct link for non-hierarchical components
  name TEXT NOT NULL,
  manufacturer TEXT,
  model_number TEXT,
  serial_number TEXT,
  install_date INTEGER,
  warranty_expires INTEGER,
  metadata TEXT,                          -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (sub_entity_id) REFERENCES sub_entities(id) ON DELETE SET NULL,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- ============================================================================
-- DOCUMENT MANAGEMENT
-- ============================================================================

-- Documents
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  entity_id TEXT,                         -- Boat, marina, condo
  sub_entity_id TEXT,                     -- System, dock, unit
  component_id TEXT,                      -- Engine, panel, appliance
  uploaded_by TEXT NOT NULL,
  
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,            -- owner-manual, component-manual, service-record, etc
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash TEXT NOT NULL,                -- SHA256 for deduplication
  mime_type TEXT DEFAULT 'application/pdf',
  
  page_count INTEGER,
  language TEXT DEFAULT 'en',
  
  status TEXT DEFAULT 'processing',       -- processing, indexed, failed, archived, deleted
  replaced_by TEXT,                       -- Document ID that supersedes this one
  
  -- Shared component library support
  is_shared BOOLEAN DEFAULT 0,
  shared_component_id TEXT,               -- Reference to shared manual
  
  -- Metadata (JSON)
  metadata TEXT,
  
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE SET NULL,
  FOREIGN KEY (sub_entity_id) REFERENCES sub_entities(id) ON DELETE SET NULL,
  FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Document pages (OCR results)
CREATE TABLE document_pages (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  
  -- OCR data
  ocr_text TEXT,
  ocr_confidence REAL,
  ocr_language TEXT DEFAULT 'en',
  ocr_completed_at INTEGER,
  
  -- Search indexing
  search_indexed_at INTEGER,
  meilisearch_id TEXT,                    -- ID in Meilisearch index
  
  -- Metadata (JSON: bounding boxes, etc)
  metadata TEXT,
  
  created_at INTEGER NOT NULL,
  
  UNIQUE(document_id, page_number),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- ============================================================================
-- BACKGROUND JOB QUEUE
-- ============================================================================

-- OCR Jobs (queue)
CREATE TABLE ocr_jobs (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  
  status TEXT DEFAULT 'pending',          -- pending, processing, completed, failed
  progress INTEGER DEFAULT 0,             -- 0-100
  
  error TEXT,
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- ============================================================================
-- PERMISSIONS & SHARING
-- ============================================================================

-- Document permissions (granular access control)
CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL,            -- document, entity, organization
  resource_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL,               -- read, write, share, delete, admin
  granted_by TEXT NOT NULL,
  granted_at INTEGER NOT NULL,
  expires_at INTEGER,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Document shares (simplified sharing)
CREATE TABLE document_shares (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  shared_by TEXT NOT NULL,
  shared_with TEXT NOT NULL,
  permission TEXT DEFAULT 'read',         -- read, write
  created_at INTEGER NOT NULL,
  
  UNIQUE(document_id, shared_with),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- BOOKMARKS & USER PREFERENCES
-- ============================================================================

-- Bookmarks (quick access to important pages)
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  page_id TEXT,                           -- Optional: specific page
  label TEXT NOT NULL,
  quick_access BOOLEAN DEFAULT 0,         -- Pin to homepage
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (page_id) REFERENCES document_pages(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_entities_org ON entities(organization_id);
CREATE INDEX idx_entities_user ON entities(user_id);
CREATE INDEX idx_entities_type ON entities(entity_type);

CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_entity ON documents(entity_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_hash ON documents(file_hash);
CREATE INDEX idx_documents_shared ON documents(is_shared, shared_component_id);

CREATE INDEX idx_pages_document ON document_pages(document_id);
CREATE INDEX idx_pages_indexed ON document_pages(search_indexed_at);

CREATE INDEX idx_jobs_status ON ocr_jobs(status);
CREATE INDEX idx_jobs_document ON ocr_jobs(document_id);

CREATE INDEX idx_permissions_user ON permissions(user_id);
CREATE INDEX idx_permissions_resource ON permissions(resource_type, resource_id);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

-- ============================================================================
-- CONTACTS (Marina, Mechanic, Vendor Management)
-- ============================================================================

CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'other',              -- marina, mechanic, vendor, insurance, customs, other
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_email ON contacts(email);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create default personal organization for each user (handled in application)
-- Seed data will be added via migrations

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- To migrate to PostgreSQL in the future:
-- 1. Replace TEXT PRIMARY KEY with UUID type
-- 2. Replace INTEGER timestamps with TIMESTAMP
-- 3. Replace TEXT metadata columns with JSONB
-- 4. Add proper CHECK constraints
-- 5. Consider partitioning for large tables (document_pages)
-- 6. Add pgvector extension for embedding support

