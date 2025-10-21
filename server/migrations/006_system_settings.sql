-- Migration: System Settings for Admin Configuration
-- Date: 2025-10-21
-- Purpose: Store system-wide configuration (email, services, etc.)

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT 0,
  category TEXT NOT NULL,
  description TEXT,
  updated_by TEXT,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_settings_category ON system_settings(category);

-- Insert default settings
INSERT OR IGNORE INTO system_settings (key, value, encrypted, category, description, updated_at) VALUES
  ('email.smtp.host', '', 0, 'email', 'SMTP server hostname', strftime('%s', 'now')),
  ('email.smtp.port', '587', 0, 'email', 'SMTP server port', strftime('%s', 'now')),
  ('email.smtp.secure', 'true', 0, 'email', 'Use TLS/SSL', strftime('%s', 'now')),
  ('email.smtp.user', '', 0, 'email', 'SMTP username', strftime('%s', 'now')),
  ('email.smtp.password', '', 1, 'email', 'SMTP password (encrypted)', strftime('%s', 'now')),
  ('email.from.address', 'noreply@navidocs.com', 0, 'email', 'From email address', strftime('%s', 'now')),
  ('email.from.name', 'NaviDocs', 0, 'email', 'From name', strftime('%s', 'now')),
  ('security.require_email_verification', 'true', 0, 'security', 'Require email verification for new users', strftime('%s', 'now')),
  ('security.password_min_length', '8', 0, 'security', 'Minimum password length', strftime('%s', 'now')),
  ('security.max_login_attempts', '5', 0, 'security', 'Max failed login attempts before lockout', strftime('%s', 'now')),
  ('security.lockout_duration', '900', 0, 'security', 'Account lockout duration (seconds)', strftime('%s', 'now')),
  ('app.name', 'NaviDocs', 0, 'general', 'Application name', strftime('%s', 'now')),
  ('app.support_email', 'support@navidocs.com', 0, 'general', 'Support contact email', strftime('%s', 'now')),
  ('app.max_file_size', '52428800', 0, 'general', 'Maximum file upload size (bytes)', strftime('%s', 'now'));
