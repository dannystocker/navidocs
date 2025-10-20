/**
 * TOC Extractor Service
 * Detects and extracts Table of Contents from OCR'd document pages
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/db.js';
import fs from 'fs/promises';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * TOC entry patterns to match:
 * - "Chapter 4 – Plumbing System ........ 72"
 * - "4.1 Water System.....................45"
 * - "Section 3: Electrical . . . . . . . 89"
 * - "Introduction                       12"
 */
const TOC_PATTERNS = [
  // Pattern 1: Title [dots/spaces] PageNum
  /^(.{3,150?}?)\s*[.\s–-]{3,}\s*(\d{1,4})\s*$/,

  // Pattern 2: SectionKey Title [dots/spaces] PageNum
  /^([\d.]+)\s+(.{3,100}?)\s*[.\s–-]{3,}\s*(\d{1,4})\s*$/,

  // Pattern 3: Title [whitespace] PageNum (simpler)
  /^(.{5,120}?)\s{3,}(\d{1,4})\s*$/,
];

/**
 * Detect if a page looks like a TOC page
 * @param {string} pageText - OCR text from page
 * @returns {boolean}
 */
function isTocPage(pageText) {
  if (!pageText || pageText.length < 100) return false;

  const lines = pageText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
  if (lines.length < 5) return false;

  // Count how many lines match TOC patterns
  let matchCount = 0;
  let pageNumbers = [];

  for (const line of lines) {
    for (const pattern of TOC_PATTERNS) {
      if (pattern.test(line)) {
        matchCount++;
        const match = line.match(pattern);
        const pageNum = parseInt(match[match.length - 1]);
        if (!isNaN(pageNum)) {
          pageNumbers.push(pageNum);
        }
        break;
      }
    }
  }

  // Heuristics for TOC detection:
  // 1. At least 5 matching lines
  // 2. At least 30% of lines match TOC patterns
  // 3. Page numbers are somewhat sequential or grouped
  const matchRatio = matchCount / lines.length;
  const hasSequentialPages = checkSequentiality(pageNumbers);

  return matchCount >= 5 && matchRatio >= 0.3 && hasSequentialPages;
}

/**
 * Check if page numbers show some sequentiality
 * @param {number[]} pageNumbers
 * @returns {boolean}
 */
function checkSequentiality(pageNumbers) {
  if (pageNumbers.length < 3) return false;

  // Sort and check for general increasing trend
  const sorted = [...pageNumbers].sort((a, b) => a - b);
  let increases = 0;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] >= sorted[i - 1]) increases++;
  }

  // At least 70% should be increasing
  return (increases / (sorted.length - 1)) >= 0.7;
}

/**
 * Parse section key and determine hierarchy level
 * @param {string} sectionKey - e.g., "4", "4.1", "4.1.2"
 * @returns {{ key: string, level: number }}
 */
function parseSectionKey(sectionKey) {
  if (!sectionKey) return { key: null, level: 1 };

  const trimmed = sectionKey.trim();
  const parts = trimmed.split('.');

  return {
    key: trimmed,
    level: parts.length
  };
}

/**
 * Extract TOC entries from a page
 * @param {string} pageText
 * @param {number} pageNumber
 * @returns {Array<Object>}
 */
function extractTocEntries(pageText, pageNumber) {
  const lines = pageText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
  const entries = [];
  let orderIndex = 0;

  for (const line of lines) {
    let match = null;
    let patternType = 0;

    // Try each pattern
    for (let i = 0; i < TOC_PATTERNS.length; i++) {
      match = line.match(TOC_PATTERNS[i]);
      if (match) {
        patternType = i;
        break;
      }
    }

    if (!match) continue;

    let title, sectionKey, targetPage;

    // Parse based on pattern type
    if (patternType === 1) {
      // Pattern with section key: "4.1 Title .... 45"
      sectionKey = match[1];
      title = match[2].trim();
      targetPage = parseInt(match[3]);
    } else {
      // Patterns without section key: "Title .... 45"
      const groups = match.slice(1).filter(g => g !== undefined);
      title = groups[0].trim();
      targetPage = parseInt(groups[groups.length - 1]);
      sectionKey = null;
    }

    // Clean up title (remove trailing dots/dashes)
    title = title.replace(/[.\-–\s]+$/, '').trim();

    // Skip if title is too short or page number invalid
    if (title.length < 3 || isNaN(targetPage) || targetPage < 1) continue;

    const { key, level } = parseSectionKey(sectionKey);

    entries.push({
      title,
      sectionKey: key,
      pageStart: targetPage,
      level,
      tocPageNumber: pageNumber,
      orderIndex: orderIndex++
    });
  }

  return entries;
}

/**
 * Build parent-child relationships for hierarchical TOC
 * @param {Array<Object>} entries
 * @returns {Array<Object>} Entries with parentId set
 */
function buildHierarchy(entries) {
  const enhanced = entries.map(e => ({ ...e, id: uuidv4(), parentId: null }));

  for (let i = 0; i < enhanced.length; i++) {
    const entry = enhanced[i];

    if (!entry.sectionKey || entry.level === 1) continue;

    // Find parent: look backwards for entry with section key that is prefix
    // e.g., "4.1.2" parent is "4.1"
    const parentKeyParts = entry.sectionKey.split('.');
    parentKeyParts.pop(); // Remove last part
    const parentKey = parentKeyParts.join('.');

    for (let j = i - 1; j >= 0; j--) {
      if (enhanced[j].sectionKey === parentKey) {
        entry.parentId = enhanced[j].id;
        break;
      }
    }
  }

  return enhanced;
}

/**
 * Extract PDF outline/bookmarks as fallback TOC
 * Uses pdfjs-dist to read the PDF's built-in outline/bookmarks
 *
 * @param {string} filePath - Absolute path to PDF file
 * @param {string} documentId - Document ID for reference
 * @returns {Promise<Array<Object>|null>} Array of TOC entries or null if no outline exists
 */
async function extractPdfOutline(filePath, documentId) {
  try {
    console.log(`[TOC] Attempting to extract PDF outline from: ${filePath}`);

    // Read PDF file
    const dataBuffer = await fs.readFile(filePath);

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(dataBuffer),
      useSystemFonts: true,
      standardFontDataUrl: null // Disable font loading for performance
    });

    const pdfDocument = await loadingTask.promise;
    const outline = await pdfDocument.getOutline();

    if (!outline || outline.length === 0) {
      console.log(`[TOC] No PDF outline found in document ${documentId}`);
      await pdfDocument.destroy();
      return null;
    }

    console.log(`[TOC] Found PDF outline with ${outline.length} top-level items`);

    // Convert outline to TOC entries
    const entries = [];
    let orderIndex = 0;

    /**
     * Recursively process outline items and convert to TOC entries
     */
    async function processOutlineItem(item, level = 1, parentId = null) {
      if (!item || !item.title) return;

      // Resolve destination to page number
      let pageStart = 1;
      if (item.dest) {
        try {
          // Get the destination (can be a string reference or direct array)
          const dest = typeof item.dest === 'string'
            ? await pdfDocument.getDestination(item.dest)
            : item.dest;

          // Extract page reference from destination array
          // Format is typically: [pageRef, fitType, ...params]
          if (dest && Array.isArray(dest) && dest[0]) {
            const pageIndex = await pdfDocument.getPageIndex(dest[0]);
            pageStart = pageIndex + 1; // Convert 0-based to 1-based
          }
        } catch (e) {
          console.log(`[TOC] Could not resolve page for outline item "${item.title}": ${e.message}`);
          // Keep default pageStart = 1
        }
      }

      const entry = {
        id: uuidv4(),
        title: item.title.trim(),
        sectionKey: null, // PDF outlines don't have section keys
        pageStart: pageStart,
        level: level,
        parentId: parentId,
        orderIndex: orderIndex++,
        tocPageNumber: null // Not from a TOC page, from PDF outline
      };

      entries.push(entry);

      // Process children recursively
      if (item.items && Array.isArray(item.items) && item.items.length > 0) {
        for (const child of item.items) {
          await processOutlineItem(child, level + 1, entry.id);
        }
      }
    }

    // Process all top-level outline items
    for (const item of outline) {
      await processOutlineItem(item);
    }

    // Clean up
    await pdfDocument.destroy();

    if (entries.length === 0) {
      console.log(`[TOC] PDF outline exists but contains no valid entries for document ${documentId}`);
      return null;
    }

    console.log(`[TOC] Successfully extracted ${entries.length} entries from PDF outline for document ${documentId}`);
    return entries;

  } catch (error) {
    console.error(`[TOC] Error extracting PDF outline for document ${documentId}:`, error);
    return null;
  }
}

/**
 * Extract TOC from entire document
 * @param {string} documentId
 * @returns {Promise<{ success: boolean, entriesCount: number, pages: number[] }>}
 */
export async function extractTocFromDocument(documentId) {
  const db = getDb();

  try {
    // Validate document exists
    const document = db.prepare(`
      SELECT id FROM documents WHERE id = ?
    `).get(documentId);

    if (!document) {
      console.error(`[TOC] Document not found: ${documentId}`);
      return {
        success: false,
        error: 'Document not found',
        entriesCount: 0,
        pages: []
      };
    }

    // Get total page count for the document
    const pageCountResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM document_pages
      WHERE document_id = ?
    `).get(documentId);

    if (pageCountResult.count === 0) {
      console.error(`[TOC] No pages available for TOC extraction in document: ${documentId}`);
      return {
        success: false,
        error: 'No pages available for TOC extraction',
        entriesCount: 0,
        pages: []
      };
    }

    // Get all pages with OCR text
    const pages = db.prepare(`
      SELECT page_number, ocr_text
      FROM document_pages
      WHERE document_id = ? AND ocr_text IS NOT NULL
      ORDER BY page_number ASC
    `).all(documentId);

    if (pages.length === 0) {
      console.error(`[TOC] No OCR text found for document: ${documentId}`);
      return {
        success: false,
        error: 'No OCR text found',
        entriesCount: 0,
        pages: []
      };
    }

    // Find TOC pages
    const tocPages = [];
    for (const page of pages) {
      if (isTocPage(page.ocr_text)) {
        tocPages.push(page);
      }
    }

    // If no TOC pages found, try PDF outline as fallback
    if (tocPages.length === 0) {
      console.log(`[TOC] No TOC pages detected in document ${documentId}, attempting PDF outline fallback`);

      // Get document file path
      const doc = db.prepare('SELECT file_path FROM documents WHERE id = ?').get(documentId);

      if (!doc || !doc.file_path) {
        console.log(`[TOC] Cannot attempt PDF outline fallback: file path not found for document ${documentId}`);
        return {
          success: false,
          error: 'TOC detection failed: No patterns matched',
          entriesCount: 0,
          pages: []
        };
      }

      // Try extracting PDF outline
      const outlineEntries = await extractPdfOutline(doc.file_path, documentId);

      if (!outlineEntries || outlineEntries.length === 0) {
        console.log(`[TOC] PDF outline fallback failed for document ${documentId}`);
        return {
          success: false,
          error: 'TOC detection failed: No patterns matched and no PDF outline found',
          entriesCount: 0,
          pages: []
        };
      }

      // Save outline entries to database
      console.log(`[TOC] Using PDF outline as TOC for document ${documentId} (${outlineEntries.length} entries)`);

      // Delete existing TOC entries for this document
      db.prepare('DELETE FROM document_toc WHERE document_id = ?').run(documentId);

      // Insert outline entries
      const insertStmt = db.prepare(`
        INSERT INTO document_toc (
          id, document_id, title, section_key, page_start,
          level, parent_id, order_index, toc_page_number, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const timestamp = Date.now();
      for (const entry of outlineEntries) {
        insertStmt.run(
          entry.id,
          documentId,
          entry.title,
          entry.sectionKey,
          entry.pageStart,
          entry.level,
          entry.parentId,
          entry.orderIndex,
          entry.tocPageNumber,
          timestamp
        );
      }

      return {
        success: true,
        entriesCount: outlineEntries.length,
        pages: [],
        source: 'pdf-outline'
      };
    }

    console.log(`[TOC] Found ${tocPages.length} TOC pages in document ${documentId}`);

    // Extract entries from all TOC pages
    let allEntries = [];
    for (const page of tocPages) {
      const entries = extractTocEntries(page.ocr_text, page.page_number);
      allEntries = allEntries.concat(entries);
    }

    if (allEntries.length === 0) {
      console.error(`[TOC] TOC parsing failed: No valid entries extracted from detected TOC pages in document ${documentId}`);
      return {
        success: false,
        error: 'TOC parsing failed: No valid entries extracted from detected TOC pages',
        entriesCount: 0,
        pages: tocPages.map(p => p.page_number)
      };
    }

    // Build hierarchy
    let hierarchicalEntries;
    try {
      hierarchicalEntries = buildHierarchy(allEntries);
    } catch (hierarchyError) {
      console.error(`[TOC] TOC parsing failed: Hierarchy building error in document ${documentId}:`, hierarchyError);
      return {
        success: false,
        error: `TOC parsing failed: Hierarchy building error - ${hierarchyError.message}`,
        entriesCount: 0,
        pages: tocPages.map(p => p.page_number)
      };
    }

    // Delete existing TOC entries for this document
    try {
      db.prepare('DELETE FROM document_toc WHERE document_id = ?').run(documentId);
    } catch (deleteError) {
      console.error(`[TOC] TOC parsing failed: Database cleanup error in document ${documentId}:`, deleteError);
      return {
        success: false,
        error: `TOC parsing failed: Database cleanup error - ${deleteError.message}`,
        entriesCount: 0,
        pages: tocPages.map(p => p.page_number)
      };
    }

    // Insert new TOC entries
    const insertStmt = db.prepare(`
      INSERT INTO document_toc (
        id, document_id, title, section_key, page_start,
        level, parent_id, order_index, toc_page_number, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const timestamp = Date.now();
    try {
      for (const entry of hierarchicalEntries) {
        insertStmt.run(
          entry.id,
          documentId,
          entry.title,
          entry.sectionKey,
          entry.pageStart,
          entry.level,
          entry.parentId,
          entry.orderIndex,
          entry.tocPageNumber,
          timestamp
        );
      }
    } catch (insertError) {
      console.error(`[TOC] TOC parsing failed: Database insertion error in document ${documentId}:`, insertError);
      return {
        success: false,
        error: `TOC parsing failed: Database insertion error - ${insertError.message}`,
        entriesCount: 0,
        pages: tocPages.map(p => p.page_number)
      };
    }

    console.log(`[TOC] Extracted ${hierarchicalEntries.length} TOC entries for document ${documentId}`);

    return {
      success: true,
      entriesCount: hierarchicalEntries.length,
      pages: tocPages.map(p => p.page_number),
      source: 'ocr-extraction'
    };

  } catch (error) {
    console.error(`[TOC] Unexpected extraction error for document ${documentId}:`, error);
    return {
      success: false,
      error: `Unexpected error during TOC extraction: ${error.message}`,
      entriesCount: 0,
      pages: []
    };
  }
}

/**
 * Get TOC for a document
 * @param {string} documentId
 * @returns {Array<Object>} TOC entries with hierarchy
 */
export function getDocumentToc(documentId) {
  const db = getDb();

  const entries = db.prepare(`
    SELECT
      id, document_id, title, section_key, page_start,
      level, parent_id, order_index, toc_page_number
    FROM document_toc
    WHERE document_id = ?
    ORDER BY order_index ASC
  `).all(documentId);

  return entries;
}

/**
 * Build tree structure from flat TOC entries
 * @param {Array<Object>} entries
 * @returns {Array<Object>} Tree with children arrays
 */
export function buildTocTree(entries) {
  const idMap = {};
  const roots = [];

  // First pass: create map
  for (const entry of entries) {
    idMap[entry.id] = { ...entry, children: [] };
  }

  // Second pass: build tree
  for (const entry of entries) {
    const node = idMap[entry.id];
    if (entry.parent_id && idMap[entry.parent_id]) {
      idMap[entry.parent_id].children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export default {
  extractTocFromDocument,
  getDocumentToc,
  buildTocTree
};
