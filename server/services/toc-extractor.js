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
 * Match TOC entries to their source pages in OCR text
 * Used for PDF outline entries to find which pages they appear on
 * @param {Array<Object>} entries - TOC entries to match
 * @param {string} documentId - Document ID
 * @returns {Array<Object>} Entries with tocPageNumber populated
 */
function matchEntriesToSourcePages(entries, documentId) {
  const db = getDb();

  // Get all pages with OCR text
  const pages = db.prepare(`
    SELECT page_number, ocr_text
    FROM document_pages
    WHERE document_id = ? AND ocr_text IS NOT NULL
    ORDER BY page_number ASC
  `).all(documentId);

  if (pages.length === 0) {
    console.log('[TOC] No OCR text available for source page matching');
    return entries;
  }

  let matchCount = 0;

  // For each entry, search OCR text to find source page
  for (const entry of entries) {
    if (entry.tocPageNumber !== null) continue; // Skip if already set

    const titleText = entry.title?.trim();
    if (!titleText || titleText.length < 5) continue;

    // Try to find this title in OCR text, prioritizing early pages (TOC is usually at start)
    for (const page of pages) {
      // Get significant words from title (skip common words, numbers with dots like "7.2.9" count as one word)
      const titleWords = titleText.split(/\s+/).slice(0, 8); // Use more words for better matching

      // Escape special regex characters but keep spaces for word matching
      const escapedWords = titleWords.map(word =>
        word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      );

      // Create pattern allowing for flexible spacing and line breaks
      const searchPattern = escapedWords.join('[\\s\\S]{0,5}'); // Allow up to 5 chars between words
      const regex = new RegExp(searchPattern, 'i');

      if (regex.test(page.ocr_text)) {
        entry.tocPageNumber = page.page_number;
        matchCount++;
        break; // Stop after first match
      }
    }
  }

  if (matchCount > 0) {
    console.log(`[TOC] Matched ${matchCount} PDF outline entries to source pages in OCR text`);
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
 * @param {string} pdfPath - Absolute path to PDF file
 * @returns {Promise<Array<Object>>} Array of TOC entries with {title, page, level}
 */
async function extractPdfOutline(pdfPath) {
  try {
    const loadingTask = pdfjsLib.getDocument({ url: pdfPath });
    const pdfDoc = await loadingTask.promise;
    const outline = await pdfDoc.getOutline();

    if (!outline || outline.length === 0) {
      await pdfDoc.destroy?.();
      return [];
    }

    const results = [];

    async function walk(items, level = 1, parentKey = null) {
      for (const item of items) {
        const title = (item.title || '').trim();
        let pageNum = null;

        // Try to resolve destination to page number
        if (item.dest) {
          try {
            const destArray = await pdfDoc.getDestination(item.dest);
            if (Array.isArray(destArray) && destArray.length > 0) {
              const pageRef = destArray[0];
              const pageIndex = await pdfDoc.getPageIndex(pageRef);
              pageNum = pageIndex + 1; // Convert 0-based to 1-based
            }
          } catch (err) {
            // Silently handle resolution errors
          }
        }

        // Fallback: try URL fragment like #page=5
        if (!pageNum && item.url) {
          const m = String(item.url).match(/#page=(\d+)/i);
          if (m) pageNum = parseInt(m[1], 10);
        }

        results.push({
          title: title || 'Untitled',
          page: Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : null,
          level,
          _raw: { dest: !!item.dest, url: !!item.url, action: !!item.action }
        });

        // Recurse into children
        if (item.items && item.items.length) {
          await walk(item.items, level + 1);
        }
      }
    }

    await walk(outline, 1);
    await pdfDoc.destroy?.();

    return results;
  } catch (err) {
    console.warn('extractPdfOutline failed:', err && err.message);
    return [];
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

    // PRIORITY: Try PDF outline FIRST (Adobe approach)
    console.log(`[TOC] Attempting PDF outline extraction first for document ${documentId}`);
    const doc = db.prepare('SELECT file_path FROM documents WHERE id = ?').get(documentId);

    if (doc?.file_path) {
      const outlineResults = await extractPdfOutline(doc.file_path);

      if (outlineResults && outlineResults.length > 0) {
        console.log(`[TOC] PDF outline found with ${outlineResults.length} entries, using it as primary TOC source`);

        // Convert simplified outline format to database format
        const outlineEntries = [];
        const parentStack = [];

        for (let i = 0; i < outlineResults.length; i++) {
          const result = outlineResults[i];
          const entryId = uuidv4();

          let parentId = null;
          if (result.level > 1) {
            for (let j = parentStack.length - 1; j >= 0; j--) {
              if (parentStack[j].level === result.level - 1) {
                parentId = parentStack[j].id;
                break;
              }
            }
          }

          const entry = {
            id: entryId,
            title: result.title,
            sectionKey: null,
            pageStart: result.page || 1,
            level: result.level,
            parentId: parentId,
            orderIndex: i,
            tocPageNumber: null
          };

          outlineEntries.push(entry);

          while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= result.level) {
            parentStack.pop();
          }
          parentStack.push({ id: entryId, level: result.level });
        }

        // Match PDF outline entries to their source pages in OCR text
        matchEntriesToSourcePages(outlineEntries, documentId);

        // Save to database
        db.prepare('DELETE FROM document_toc WHERE document_id = ?').run(documentId);

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
          source: 'pdf-outline',
          message: `Extracted ${outlineEntries.length} entries from PDF outline`
        };
      }
    }

    // FALLBACK: Try OCR-based TOC detection if PDF outline failed
    console.log(`[TOC] No PDF outline found, falling back to OCR-based TOC detection for document ${documentId}`);

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

    // If no TOC pages found either, give up
    if (tocPages.length === 0) {
      console.log(`[TOC] No TOC pages detected via OCR either for document ${documentId}`);
      return {
        success: false,
        error: 'TOC detection failed: No PDF outline or OCR-detectable TOC found',
        entriesCount: 0,
        pages: []
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
