-- Migration: Add system admin flag to users
-- Date: 2025-10-21
-- Purpose: Allow marking users as system administrators

-- Add is_system_admin column (defaults to 0 / false)
ALTER TABLE users ADD COLUMN is_system_admin BOOLEAN DEFAULT 0;

-- Create index for faster system admin lookups
CREATE INDEX IF NOT EXISTS idx_users_system_admin ON users(is_system_admin);
