/**
 * OCR Service - Extract text from PDF documents using Tesseract.js
 *
 * Features:
 * - Convert PDF pages to images (requires external tools or libraries)
 * - Run Tesseract OCR on each page
 * - Return structured data with confidence scores
 * - Handle errors gracefully
 *
 * PRODUCTION SETUP REQUIRED:
 * Install one of the following for PDF to image conversion:
 * 1. GraphicsMagick/ImageMagick + pdf2pic: npm install pdf2pic
 * 2. Poppler utils (pdftoppm): apt-get install poppler-utils
 * 3. pdf-to-png-converter: npm install pdf-to-png-converter
 */

import Tesseract from 'tesseract.js';
import pdf from 'pdf-parse';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { extractNativeTextPerPage, hasNativeText } from './pdf-text-extractor.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Extract text from a PDF file using OCR
 *
 * @param {string} pdfPath - Absolute path to the PDF file
 * @param {Object} options - Configuration options
 * @param {string} options.language - Tesseract language (default: 'eng')
 * @param {Function} options.onProgress - Progress callback (pageNumber, totalPages)
 * @returns {Promise<Array<{pageNumber: number, text: string, confidence: number}>>}
 */
export async function extractTextFromPDF(pdfPath, options = {}) {
  const { language = 'eng', onProgress, forceOCR = false } = options;

  // Environment configuration
  const MIN_TEXT_THRESHOLD = parseInt(process.env.OCR_MIN_TEXT_THRESHOLD || '50', 10);
  const FORCE_OCR_ALL_PAGES = process.env.FORCE_OCR_ALL_PAGES === 'true' || forceOCR;

  try {
    // Read the PDF file
    const pdfBuffer = readFileSync(pdfPath);

    // Parse PDF to get page count and metadata
    const pdfData = await pdf(pdfBuffer);
    const pageCount = pdfData.numpages;

    console.log(`[OCR] Processing ${pageCount} pages from ${pdfPath}`);

    const results = [];

    // NEW: Try native text extraction first (unless forced to OCR)
    let pageTexts = [];
    let useNativeExtraction = false;

    if (!FORCE_OCR_ALL_PAGES) {
      try {
        console.log('[OCR Optimization] Attempting native text extraction...');
        pageTexts = await extractNativeTextPerPage(pdfPath);

        // Check if PDF has substantial native text
        const totalText = pageTexts.join('');
        if (totalText.length > 100) {
          useNativeExtraction = true;
          console.log(`[OCR Optimization] PDF has native text (${totalText.length} chars), using hybrid approach`);
        } else {
          console.log('[OCR Optimization] Minimal native text found, falling back to full OCR');
        }
      } catch (error) {
        console.log('[OCR Optimization] Native extraction failed, falling back to full OCR:', error.message);
        useNativeExtraction = false;
      }
    }

    // Process each page with hybrid approach
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        let pageText = '';
        let confidence = 0;
        let method = 'tesseract-ocr';

        // Try native text first if available
        if (useNativeExtraction && pageTexts[pageNum - 1]) {
          const nativeText = pageTexts[pageNum - 1].trim();

          // If page has substantial native text, use it
          if (nativeText.length >= MIN_TEXT_THRESHOLD) {
            pageText = nativeText;
            confidence = 0.99;
            method = 'native-extraction';
            console.log(`[OCR] Page ${pageNum}/${pageCount} native text (${nativeText.length} chars, no OCR needed)`);
          }
        }

        // Fallback to Tesseract OCR if no native text
        if (!pageText) {
          // Convert PDF page to image
          const imagePath = await convertPDFPageToImage(pdfPath, pageNum);

          // Run Tesseract OCR
          const ocrResult = await runTesseractOCR(imagePath, language);

          pageText = ocrResult.text.trim();
          confidence = ocrResult.confidence;
          method = 'tesseract-ocr';

          // Clean up temporary image file
          try {
            unlinkSync(imagePath);
          } catch (e) {
            // Ignore cleanup errors
          }

          console.log(`[OCR] Page ${pageNum}/${pageCount} OCR (confidence: ${confidence.toFixed(2)})`);
        }

        results.push({
          pageNumber: pageNum,
          text: pageText,
          confidence: confidence,
          method: method
        });

        // Report progress
        if (onProgress) {
          onProgress(pageNum, pageCount);
        }

      } catch (error) {
        console.error(`[OCR] Error processing page ${pageNum}:`, error.message);

        // Return empty result for failed page
        results.push({
          pageNumber: pageNum,
          text: '',
          confidence: 0,
          error: error.message,
          method: 'error'
        });
      }
    }

    const nativeCount = results.filter(r => r.method === 'native-extraction').length;
    const ocrCount = results.filter(r => r.method === 'tesseract-ocr').length;
    console.log(`[OCR] Complete: ${nativeCount} pages native extraction, ${ocrCount} pages OCR`);

    return results;
  } catch (error) {
    console.error('[OCR] Fatal error extracting text from PDF:', error);
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
}

/**
 * Convert a single PDF page to image using external tools
 *
 * PRIORITY ORDER:
 * 1. Try pdftoppm (poppler-utils) - fastest, best quality
 * 2. Try ImageMagick convert - widely available
 * 3. Fallback: Use pdf-parse text extraction (no OCR needed)
 *
 * @param {string} pdfPath - Path to PDF file
 * @param {number} pageNumber - Page number (1-based)
 * @returns {Promise<string>} - Path to generated image file
 */
async function convertPDFPageToImage(pdfPath, pageNumber) {
  const tempDir = join(tmpdir(), 'navidocs-ocr');

  // Ensure temp directory exists
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }

  const outputPath = join(tempDir, `page-${Date.now()}-${pageNumber}.png`);

  try {
    // Method 1: Try pdftoppm (Poppler utils)
    try {
      execSync(
        `pdftoppm -f ${pageNumber} -l ${pageNumber} -png -singlefile -r 300 "${pdfPath}" "${outputPath.replace('.png', '')}"`,
        { stdio: 'pipe' }
      );
      if (existsSync(outputPath)) {
        console.log(`Converted page ${pageNumber} using pdftoppm`);
        return outputPath;
      }
    } catch (e) {
      console.warn('pdftoppm not available or failed:', e.message);
    }

    // Method 2: Try ImageMagick convert
    try {
      execSync(
        `convert -density 300 "${pdfPath}[${pageNumber - 1}]" -quality 90 "${outputPath}"`,
        { stdio: 'pipe' }
      );
      if (existsSync(outputPath)) {
        console.log(`Converted page ${pageNumber} using ImageMagick`);
        return outputPath;
      }
    } catch (e) {
      console.warn('ImageMagick not available or failed:', e.message);
    }

    // Method 3: Fallback - Create a text-based image
    // This is a workaround when no image conversion tools are available
    console.warn('No PDF conversion tools available. Using text extraction fallback.');

    // For fallback, we'll create a simple PNG with text content
    // This requires canvas, so we'll just throw an error instead
    throw new Error(
      'PDF to image conversion requires pdftoppm (poppler-utils) or ImageMagick. ' +
      'Install with: apt-get install poppler-utils imagemagick'
    );
  } catch (error) {
    console.error('Error converting PDF page to image:', error);
    throw error;
  }
}

/**
 * Run Tesseract OCR on an image file
 *
 * @param {string} imagePath - Path to image file
 * @param {string} language - Tesseract language code
 * @returns {Promise<{text: string, confidence: number}>}
 */
async function runTesseractOCR(imagePath, language = 'eng') {
  try {
    // Ensure language code is 'eng' not 'en' for tesseract
    const tessLang = language === 'en' ? 'eng' : language;

    // Use local system tesseract command (faster and more reliable)
    const result = execSync(
      `TESSDATA_PREFIX=/usr/share/tesseract-ocr/5/tessdata tesseract "${imagePath}" stdout -l ${tessLang} --psm 1`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
    );

    // Tesseract doesn't provide confidence via stdout, so we'll estimate based on output
    const text = result.trim();
    const confidence = text.length > 0 ? 0.85 : 0.0; // Rough estimate

    return {
      text,
      confidence
    };
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw new Error(`OCR failed: ${error.message}`);
  }
}

/**
 * Extract text from a single image file
 *
 * @param {string} imagePath - Path to image file
 * @param {string} language - Tesseract language code
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function extractTextFromImage(imagePath, language = 'eng') {
  try {
    return await runTesseractOCR(imagePath, language);
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error(`Image OCR failed: ${error.message}`);
  }
}

/**
 * Validate OCR confidence score
 *
 * @param {number} confidence - Confidence score (0-1)
 * @returns {string} - Quality rating: 'high', 'medium', 'low'
 */
export function getConfidenceRating(confidence) {
  if (confidence >= 0.9) return 'high';
  if (confidence >= 0.7) return 'medium';
  return 'low';
}

/**
 * Clean and normalize OCR text
 *
 * @param {string} text - Raw OCR text
 * @returns {string} - Cleaned text
 */
export function cleanOCRText(text) {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
    .trim();
}

/**
 * Check if PDF conversion tools are available
 *
 * @returns {Object} - Status of available tools
 */
export function checkPDFTools() {
  const tools = {
    pdftoppm: false,
    imagemagick: false
  };

  try {
    execSync('which pdftoppm', { stdio: 'pipe' });
    tools.pdftoppm = true;
  } catch (e) {
    // Not available
  }

  try {
    execSync('which convert', { stdio: 'pipe' });
    tools.imagemagick = true;
  } catch (e) {
    // Not available
  }

  return tools;
}
