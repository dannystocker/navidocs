-- Migration: Add document_toc table for interactive table of contents
-- Date: 2025-10-20
-- Description: Store extracted TOC entries from PDF documents for navigation

CREATE TABLE IF NOT EXISTS document_toc (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,

  -- TOC entry details
  title TEXT NOT NULL,              -- "Chapter 4 - Plumbing System"
  section_key TEXT,                 -- "4" or "4.1.2" for hierarchical entries
  page_start INTEGER NOT NULL,      -- Target page number

  -- Hierarchy support
  level INTEGER DEFAULT 1,          -- 1 for "4", 2 for "4.1", 3 for "4.1.2"
  parent_id TEXT,                   -- Reference to parent entry for nesting

  -- Ordering
  order_index INTEGER NOT NULL,     -- Sequential order in TOC

  -- Source tracking
  toc_page_number INTEGER,          -- Which page the TOC entry was found on

  -- Metadata
  created_at INTEGER NOT NULL,

  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES document_toc(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_toc_document ON document_toc(document_id);
CREATE INDEX IF NOT EXISTS idx_toc_order ON document_toc(document_id, order_index);
CREATE INDEX IF NOT EXISTS idx_toc_parent ON document_toc(parent_id);
CREATE INDEX IF NOT EXISTS idx_toc_section ON document_toc(document_id, section_key);
