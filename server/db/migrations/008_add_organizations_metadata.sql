-- Migration: Add metadata column to organizations table
-- Date: 2025-10-21
-- Description: Support custom metadata for organizations

ALTER TABLE organizations ADD COLUMN metadata TEXT;
