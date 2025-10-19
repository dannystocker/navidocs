/**
 * Hybrid OCR Service
 *
 * Intelligently chooses between multiple OCR engines:
 * 1. Google Cloud Vision API (RECOMMENDED) - Best quality, fastest, real OCR API
 * 2. Google Drive OCR (ALTERNATIVE) - Good quality, uses Docs conversion
 * 3. Tesseract (FALLBACK) - Local, free, always available
 *
 * Configuration via .env:
 * - PREFERRED_OCR_ENGINE=google-vision|google-drive|tesseract|auto
 * - GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
 *
 * RECOMMENDATION: Use google-vision for production!
 */

import { extractTextFromPDF as extractWithTesseract } from './ocr.js';
import {
  extractTextFromPDFGoogleDrive,
  isGoogleDriveConfigured
} from './ocr-google-drive.js';
import {
  extractTextFromPDFVision,
  isVisionConfigured
} from './ocr-google-vision.js';

const PREFERRED_ENGINE = process.env.PREFERRED_OCR_ENGINE || 'auto';

/**
 * Extract text from PDF using the best available OCR engine
 *
 * @param {string} pdfPath - Path to PDF file
 * @param {Object} options - Configuration options
 * @param {string} options.language - Language code (eng, spa, fra, etc.)
 * @param {Function} options.onProgress - Progress callback
 * @param {string} options.forceEngine - Force specific engine (google-drive, tesseract)
 * @returns {Promise<Array<{pageNumber: number, text: string, confidence: number}>>}
 */
export async function extractTextFromPDF(pdfPath, options = {}) {
  const { forceEngine } = options;
  const engine = forceEngine || PREFERRED_ENGINE;

  // Determine which engine to use
  let selectedEngine = 'tesseract'; // Default fallback

  if (engine === 'auto') {
    // Auto-select best available engine
    // Priority: Vision API > Drive API > Tesseract
    if (isVisionConfigured()) {
      selectedEngine = 'google-vision';
    } else if (isGoogleDriveConfigured()) {
      selectedEngine = 'google-drive';
    }
  } else if (engine === 'google-vision' && !isVisionConfigured()) {
    console.warn('[OCR Hybrid] Google Vision requested but not configured, falling back');
    selectedEngine = isGoogleDriveConfigured() ? 'google-drive' : 'tesseract';
  } else if (engine === 'google-drive' && !isGoogleDriveConfigured()) {
    console.warn('[OCR Hybrid] Google Drive requested but not configured, falling back to Tesseract');
  } else {
    selectedEngine = engine;
  }

  console.log(`[OCR Hybrid] Using ${selectedEngine} engine for ${pdfPath}`);

  // Execute OCR with selected engine
  try {
    switch (selectedEngine) {
      case 'google-vision':
        return await extractWithVision(pdfPath, options);

      case 'google-drive':
        return await extractWithGoogleDrive(pdfPath, options);

      case 'tesseract':
      default:
        return await extractWithTesseract(pdfPath, options);
    }
  } catch (error) {
    // If preferred engine fails, fallback to Tesseract
    if (selectedEngine !== 'tesseract') {
      console.warn(`[OCR Hybrid] ${selectedEngine} failed, falling back to Tesseract:`, error.message);
      return await extractWithTesseract(pdfPath, options);
    }
    throw error;
  }
}

/**
 * Wrapper for Google Cloud Vision OCR with error handling
 */
async function extractWithVision(pdfPath, options) {
  try {
    const results = await extractTextFromPDFVision(pdfPath, options);

    // Log quality metrics
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    console.log(`[Google Vision OCR] Completed with avg confidence: ${avgConfidence.toFixed(2)}`);

    return results;
  } catch (error) {
    console.error('[Google Vision OCR] Error:', error.message);
    throw error;
  }
}

/**
 * Wrapper for Google Drive OCR with error handling
 */
async function extractWithGoogleDrive(pdfPath, options) {
  try {
    const results = await extractTextFromPDFGoogleDrive(pdfPath, options);

    // Log quality metrics
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    console.log(`[Google Drive OCR] Completed with avg confidence: ${avgConfidence.toFixed(2)}`);

    return results;
  } catch (error) {
    console.error('[Google Drive OCR] Error:', error.message);
    throw error;
  }
}

/**
 * Get information about available OCR engines
 *
 * @returns {Object} - Status of each engine
 */
export function getAvailableEngines() {
  return {
    'google-vision': {
      available: isVisionConfigured(),
      quality: 'excellent',
      speed: 'fast',
      cost: '$1.50/1000 pages (1000/month free)',
      notes: 'RECOMMENDED: Real OCR API, fastest, most accurate',
      handwriting: true,
      pageByPage: true,
      boundingBoxes: true
    },
    'google-drive': {
      available: isGoogleDriveConfigured(),
      quality: 'excellent',
      speed: 'slow',
      cost: 'free (unlimited)',
      notes: 'Workaround using Docs conversion, slower',
      handwriting: true,
      pageByPage: false,
      boundingBoxes: false
    },
    tesseract: {
      available: true,
      quality: 'good',
      speed: 'fast',
      cost: 'free',
      notes: 'Local, private, no handwriting support',
      handwriting: false,
      pageByPage: true,
      boundingBoxes: false
    }
  };
}

/**
 * Recommend best OCR engine for a given document
 *
 * @param {Object} documentInfo - Document metadata
 * @param {number} documentInfo.pageCount - Number of pages
 * @param {number} documentInfo.fileSize - File size in bytes
 * @returns {string} - Recommended engine name
 */
export function recommendEngine(documentInfo) {
  const { pageCount = 1, fileSize = 0 } = documentInfo;

  // For large documents, use Tesseract to save on Vision API costs
  if (pageCount > 100 || fileSize > 20 * 1024 * 1024) {
    return 'tesseract';
  }

  // For medium documents (where cost is acceptable), prefer Vision API
  if (isVisionConfigured()) {
    return 'google-vision';
  }

  // For small documents, Drive API is free and good enough
  if (isGoogleDriveConfigured()) {
    return 'google-drive';
  }

  return 'tesseract';
}
