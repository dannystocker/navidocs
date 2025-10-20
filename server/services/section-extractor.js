/**
 * Section Extractor Service
 *
 * Extracts section/chapter metadata from PDFs using a three-tier approach:
 * 1. PDF Outline/Bookmarks (most reliable)
 * 2. Header Detection via Regex (fallback)
 * 3. Table of Contents Parsing (last resort)
 */

import pdf from 'pdf-parse';
import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

/**
 * Slugify section title for consistent keys
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parse section number to determine order
 * Examples: "8" -> 800, "8.6" -> 806, "8-6" -> 806, "8/6" -> 806
 */
function parseSectionOrder(sectionNum) {
  if (!sectionNum) return 0;

  // Normalize separators: treat -, /, . the same
  const normalized = sectionNum.replace(/[-\/]/g, '.');
  const parts = normalized.split('.').map(p => parseInt(p) || 0);

  // Major * 100 + minor * 1
  return (parts[0] || 0) * 100 + (parts[1] || 0);
}

/**
 * Extract sections from PDF outline/bookmarks
 * This is the most reliable method when available
 */
async function extractFromOutline(pdfPath) {
  try {
    const dataBuffer = await readFile(pdfPath);
    const data = await pdf(dataBuffer, {
      max: 0 // Don't extract text, just metadata
    });

    if (!data.metadata || !data.metadata.info) {
      return null;
    }

    // pdf-parse doesn't expose outlines directly, we need pdf-lib or pdfjs-dist
    // For now, return null to fall through to other methods
    return null;
  } catch (error) {
    console.error('[SectionExtractor] Outline extraction failed:', error.message);
    return null;
  }
}

/**
 * Detect section headers using regex patterns
 * Looks for patterns like:
 * - "8. Waste Systems"
 * - "8.6 Blackwater Tank"
 * - "CHAPTER 8: WASTE SYSTEMS"
 */
function detectSectionHeaders(pages) {
  const sections = [];
  let currentSection = null;
  let currentSectionOrder = 0;

  // Patterns to match section headers (marine manual focused)
  const headerPatterns = [
    // "8.6 Blackwater Tank" or "8-6 Bilge System" or "8/6 Through-Hull"
    /^\s*(\d+(?:[.\-\/]\d+)*)\s+([A-Z][^\n]{3,60})/m,
    // "CHAPTER 8: WASTE SYSTEMS" or "SECTION 8.6: Blackwater"
    /^\s*(?:CHAPTER|SECTION|PART)\s+(\d+(?:[.\-\/]\d+)*)[:\s]+([A-Z][^\n]{3,60})/mi,
    // Marine-specific: "ELECTRICAL SYSTEM", "PLUMBING", "NAVIGATION EQUIPMENT"
    /^\s*([A-Z][A-Z\s\-]{4,59})$/m,
    // TOC style: "8.6 Blackwater" at page start
    /^(\d+(?:[.\-\/]\d+)*)\s+([A-Z][a-z][^\n]{3,50})/m,
  ];

  for (const page of pages) {
    const { pageNumber, text } = page;

    if (!text || text.length < 10) continue;

    // Try each pattern
    let matched = false;
    for (const pattern of headerPatterns) {
      const match = text.match(pattern);
      if (match) {
        let sectionNum = match[1];
        let sectionTitle = match[2] || match[1];

        // Skip if it's just the page number
        if (sectionTitle.length < 5) continue;

        // Clean up title
        sectionTitle = sectionTitle.trim();
        if (sectionTitle.endsWith(':')) {
          sectionTitle = sectionTitle.slice(0, -1);
        }

        // Calculate section order
        const order = sectionNum && /\d/.test(sectionNum)
          ? parseSectionOrder(sectionNum)
          : currentSectionOrder + 1;

        // Create section key (hierarchical path)
        const sectionKey = slugify(sectionTitle);

        currentSection = {
          section: sectionTitle,
          sectionKey: sectionKey,
          sectionOrder: order,
          startPage: pageNumber
        };

        currentSectionOrder = order;
        sections.push(currentSection);
        matched = true;
        break;
      }
    }

    // If we found a section, continue to next page
    if (matched) continue;

    // Otherwise, assign current section to this page
    if (!currentSection) {
      // No section yet, create a default one
      currentSection = {
        section: 'Introduction',
        sectionKey: 'introduction',
        sectionOrder: 0,
        startPage: pageNumber
      };
      sections.push(currentSection);
    }
  }

  return sections;
}

/**
 * Parse Table of Contents to extract section structure
 * Looks for pages with dense "8.6 Title ........ 73" style entries
 */
function parseTableOfContents(pages) {
  const sections = [];

  // Pattern to match TOC entries: "8.6 Blackwater Tank ........ 73"
  const tocPattern = /^\s*(\d+(?:\.\d+)*)\s+([^.\d][^\n]{3,50}?)[\s.]+(\d+)\s*$/gm;

  for (const page of pages) {
    const { text } = page;
    if (!text) continue;

    // Look for pages with multiple TOC-style entries
    const matches = [...text.matchAll(tocPattern)];

    if (matches.length >= 3) { // Likely a TOC page if 3+ entries
      console.log(`[SectionExtractor] Found TOC page with ${matches.length} entries`);

      for (const match of matches) {
        const sectionNum = match[1];
        const sectionTitle = match[2].trim();
        const pageNum = parseInt(match[3]);

        if (pageNum > 0 && sectionTitle.length >= 5) {
          sections.push({
            section: sectionTitle,
            sectionKey: slugify(sectionTitle),
            sectionOrder: parseSectionOrder(sectionNum),
            startPage: pageNum
          });
        }
      }

      // If we found a TOC, we're done
      if (sections.length > 0) {
        return sections;
      }
    }
  }

  return sections.length > 0 ? sections : null;
}

/**
 * Main extraction function - tries all methods in order
 */
export async function extractSections(pdfPath, pages) {
  console.log('[SectionExtractor] Starting section extraction');

  // Method 1: Try PDF outline/bookmarks
  let sections = await extractFromOutline(pdfPath);
  if (sections && sections.length > 0) {
    console.log(`[SectionExtractor] Extracted ${sections.length} sections from PDF outline`);
    return sections;
  }

  // Method 2: Try Table of Contents parsing
  sections = parseTableOfContents(pages);
  if (sections && sections.length > 0) {
    console.log(`[SectionExtractor] Extracted ${sections.length} sections from TOC`);
    return sections;
  }

  // Method 3: Try header detection
  sections = detectSectionHeaders(pages);
  if (sections && sections.length > 0) {
    console.log(`[SectionExtractor] Detected ${sections.length} sections from headers`);
    return sections;
  }

  console.log('[SectionExtractor] No sections found, using single section');

  // Fallback: Single section for entire document
  return [{
    section: 'Complete Manual',
    sectionKey: 'complete-manual',
    sectionOrder: 0,
    startPage: 1
  }];
}

/**
 * Map pages to their sections
 * Given extracted sections and pages, assigns each page to a section
 */
export function mapPagesToSections(sections, totalPages) {
  const pageMap = new Map();

  // Sort sections by start page
  const sortedSections = [...sections].sort((a, b) => a.startPage - b.startPage);

  // For each section, determine its page range
  for (let i = 0; i < sortedSections.length; i++) {
    const section = sortedSections[i];
    const nextSection = sortedSections[i + 1];

    const startPage = section.startPage;
    const endPage = nextSection ? nextSection.startPage - 1 : totalPages;

    // Assign all pages in this range to this section
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      pageMap.set(pageNum, {
        section: section.section,
        sectionKey: section.sectionKey,
        sectionOrder: section.sectionOrder
      });
    }
  }

  return pageMap;
}
