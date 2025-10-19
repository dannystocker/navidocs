-- Migration: Add support for extracted images from PDFs
-- Date: 2025-10-19
-- Purpose: Store extracted images, their OCR text, and relationships to document text

CREATE TABLE IF NOT EXISTS document_images (
  id TEXT PRIMARY KEY,
  documentId TEXT NOT NULL,
  pageNumber INTEGER NOT NULL,
  imageIndex INTEGER NOT NULL,
  imagePath TEXT NOT NULL,
  imageFormat TEXT DEFAULT 'png',
  width INTEGER,
  height INTEGER,
  position TEXT,  -- JSON: {x, y, width, height} in PDF coordinates
  extractedText TEXT,  -- OCR text from the image itself
  textConfidence REAL,  -- Average OCR confidence (0-1)
  anchorTextBefore TEXT,  -- Text snippet appearing before the image
  anchorTextAfter TEXT,  -- Text snippet appearing after the image
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE(documentId, pageNumber, imageIndex)
);

CREATE INDEX IF NOT EXISTS idx_document_images_doc ON document_images(documentId);
CREATE INDEX IF NOT EXISTS idx_document_images_page ON document_images(documentId, pageNumber);
CREATE INDEX IF NOT EXISTS idx_document_images_created ON document_images(createdAt);

-- Add column to documents table to track if images have been extracted
ALTER TABLE documents ADD COLUMN imagesExtracted INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN imageCount INTEGER DEFAULT 0;
