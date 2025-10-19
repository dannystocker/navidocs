/**
 * Quick OCR Route - POST /api/upload/quick-ocr
 * OCR first page of PDF and extract metadata for form auto-fill
 */

import express from 'express';
import multer from 'multer';
import { extractTextFromPDF } from '../services/ocr.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, unlinkSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') // 50MB
  }
});

/**
 * Extract metadata from OCR text
 * Looks for patterns like:
 * - Boat makes: Prestige, Ferretti, Sunseeker, etc.
 * - Model numbers: F4.9, 630, etc.
 * - Years: 2020-2025
 * - Titles from headers
 */
function extractMetadata(ocrText, filename = '') {
  const metadata = {
    title: '',
    boatName: '',
    boatMake: '',
    boatModel: '',
    boatYear: null
  };

  // Remove .pdf extension from filename
  const cleanFilename = filename.replace(/\.pdf$/i, '');

  // Common boat manufacturers
  const boatMakes = [
    'Prestige', 'Ferretti', 'Sunseeker', 'Princess', 'Azimut', 'Beneteau',
    'Jeanneau', 'Bavaria', 'Catalina', 'Hunter', 'Lagoon', 'Fountaine Pajot',
    'Sea Ray', 'Boston Whaler', 'Grady-White', 'Chris-Craft', 'Tiara',
    'Viking', 'Hatteras', 'Ocean Alexander', 'Grand Banks'
  ];

  // Extract year (look for 4-digit years 1990-2030)
  const yearMatch = ocrText.match(/\b(19[9][0-9]|20[0-2][0-9]|2030)\b/);
  if (yearMatch) {
    metadata.boatYear = parseInt(yearMatch[1]);
  }

  // Extract boat make (case-insensitive)
  for (const make of boatMakes) {
    const makeRegex = new RegExp(`\\b${make}\\b`, 'i');
    if (makeRegex.test(ocrText)) {
      metadata.boatMake = make;
      break;
    }
  }

  // Extract model (usually alphanumeric, near the make)
  if (metadata.boatMake) {
    // Look for model pattern near the make
    const makeIndex = ocrText.toLowerCase().indexOf(metadata.boatMake.toLowerCase());
    const nearMake = ocrText.substring(Math.max(0, makeIndex - 50), makeIndex + 100);

    // Common model patterns: F4.9, 630, S45, etc.
    const modelMatch = nearMake.match(/\b([A-Z]?[0-9]{2,4}(?:\.[0-9])?)\b/);
    if (modelMatch) {
      metadata.boatModel = modelMatch[1];
    }
  }

  // Extract title from first few lines
  const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  if (lines.length > 0) {
    // Use the first substantial line as title
    let titleLine = lines[0];

    // If first line is very short, try combining with second line
    if (titleLine.length < 15 && lines.length > 1) {
      titleLine = `${titleLine} ${lines[1]}`;
    }

    // Clean up title (remove excessive whitespace, special chars)
    metadata.title = titleLine
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-(),.]/g, '')
      .substring(0, 100)
      .trim();
  }

  // If no title found in OCR, use filename
  if (!metadata.title && cleanFilename) {
    metadata.title = cleanFilename
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Extract boat name from filename if not found in OCR
  // Look for pattern: BoatName_Something or BoatName-Something
  if (!metadata.boatName && cleanFilename) {
    const filenameMatch = cleanFilename.match(/^([A-Z][a-zA-Z0-9\s]+?)(?:[_-]|$)/);
    if (filenameMatch) {
      const potentialName = filenameMatch[1].trim();
      // Only use if it's not a common word like "Manual", "Owner", etc.
      const commonWords = ['Manual', 'Owner', 'Service', 'Document', 'Guide', 'Book'];
      if (!commonWords.some(word => potentialName.toLowerCase().includes(word.toLowerCase()))) {
        metadata.boatName = potentialName;
      }
    }
  }

  // Look for boat name in OCR text (usually appears early)
  if (!metadata.boatName && metadata.boatMake) {
    // Look for proper noun before or after make
    const makeIndex = ocrText.toLowerCase().indexOf(metadata.boatMake.toLowerCase());
    const beforeMake = ocrText.substring(Math.max(0, makeIndex - 100), makeIndex);
    const nameMatch = beforeMake.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/);
    if (nameMatch) {
      metadata.boatName = nameMatch[1].trim();
    }
  }

  return metadata;
}

/**
 * POST /api/upload/quick-ocr
 * OCR first page and return extracted metadata
 *
 * @body {File} file - PDF file
 * @returns {Object} { success: true, metadata: {...}, ocrText: '...' }
 */
router.post('/', upload.single('file'), async (req, res) => {
  let tempFilePath = null;

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are supported' });
    }

    // Save to temp file (OCR service needs file path)
    const tempId = uuidv4();
    tempFilePath = join(tmpdir(), `quick-ocr-${tempId}.pdf`);
    writeFileSync(tempFilePath, file.buffer);

    console.log(`[Quick OCR] Processing first page of ${file.originalname}`);

    // Extract text from first page only
    const ocrResults = await extractTextFromPDF(tempFilePath, {
      language: 'eng',
      onProgress: (page, total) => {
        // Only process first page
        if (page > 1) return;
      }
    });

    // Get first page text
    const firstPageText = ocrResults[0]?.text || '';
    const confidence = ocrResults[0]?.confidence || 0;

    console.log(`[Quick OCR] First page OCR completed (confidence: ${confidence.toFixed(2)})`);
    console.log(`[Quick OCR] Text length: ${firstPageText.length} characters`);

    // Extract metadata
    const metadata = extractMetadata(firstPageText, file.originalname);

    console.log(`[Quick OCR] Extracted metadata:`, metadata);

    // Clean up temp file
    try {
      unlinkSync(tempFilePath);
    } catch (e) {
      console.warn('[Quick OCR] Failed to clean up temp file:', e.message);
    }

    res.json({
      success: true,
      metadata,
      ocrText: firstPageText.substring(0, 500), // Return first 500 chars for debugging
      confidence
    });

  } catch (error) {
    console.error('[Quick OCR] Error:', error);

    // Clean up temp file on error
    if (tempFilePath) {
      try {
        unlinkSync(tempFilePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'Quick OCR failed',
      message: error.message
    });
  }
});

export default router;
