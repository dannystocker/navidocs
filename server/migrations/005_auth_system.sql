-- Migration: Multi-Tenancy Authentication and Authorization System
-- Date: 2025-10-21
-- Purpose: Add comprehensive auth system with JWT tokens, permissions, and audit logging

-- ==========================================
-- Entity-level permissions (granular access control)
-- ==========================================
CREATE TABLE IF NOT EXISTS entity_permissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  permission_level TEXT NOT NULL CHECK(permission_level IN ('viewer', 'editor', 'manager', 'admin')),
  granted_by TEXT NOT NULL,
  granted_at INTEGER NOT NULL,
  expires_at INTEGER,
  UNIQUE(user_id, entity_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_entity_perms_user ON entity_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_perms_entity ON entity_permissions(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_perms_expires ON entity_permissions(expires_at);

-- ==========================================
-- Refresh tokens for secure session management
-- ==========================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  device_info TEXT,
  ip_address TEXT,
  expires_at INTEGER NOT NULL,
  revoked BOOLEAN DEFAULT 0,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked ON refresh_tokens(revoked);

-- ==========================================
-- Password reset tokens
-- ==========================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used BOOLEAN DEFAULT 0,
  used_at INTEGER,
  ip_address TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_used ON password_reset_tokens(used);

-- ==========================================
-- Audit log for security events
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL CHECK(status IN ('success', 'failure', 'denied')),
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_log(status);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource_type, resource_id);

-- ==========================================
-- Enhance users table with email verification and account status
-- ==========================================
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verification_token TEXT;
ALTER TABLE users ADD COLUMN email_verification_expires INTEGER;
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'deleted'));
ALTER TABLE users ADD COLUMN suspended_at INTEGER;
ALTER TABLE users ADD COLUMN suspended_reason TEXT;
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until INTEGER;

-- ==========================================
-- Add organization-level roles to user_organizations
-- ==========================================
-- Note: The 'role' column already exists with default 'member'
-- We'll update the CHECK constraint via application logic to support:
-- 'viewer', 'member', 'manager', 'admin'
