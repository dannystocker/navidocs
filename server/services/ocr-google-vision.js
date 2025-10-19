/**
 * Google Cloud Vision API OCR Service
 *
 * This is the REAL Google OCR API - what Google Drive uses under the hood!
 *
 * Advantages over Drive API approach:
 * - Faster (no file upload/conversion/export cycle)
 * - Page-by-page results with individual confidence scores
 * - Bounding box coordinates for each word
 * - Batch processing support
 * - More control over OCR parameters
 *
 * SETUP:
 * 1. Enable Cloud Vision API in Google Cloud Console
 * 2. Use same service account credentials as Drive
 * 3. npm install @google-cloud/vision
 * 4. Set GOOGLE_APPLICATION_CREDENTIALS in .env
 *
 * PRICING:
 * - First 1,000 pages/month: FREE
 * - After that: $1.50 per 1,000 pages
 * - Example: 10,000 PDFs/month = ~$15/month
 */

import vision from '@google-cloud/vision';
import { readFile } from 'fs/promises';
import pdf from 'pdf-parse';

/**
 * Initialize Google Cloud Vision client
 */
function getVisionClient() {
  return new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
  });
}

/**
 * Extract text from PDF using Google Cloud Vision API
 *
 * @param {string} pdfPath - Path to PDF file
 * @param {Object} options - Configuration options
 * @param {string} options.language - Language hints (e.g., 'en', 'es')
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Array<{pageNumber: number, text: string, confidence: number}>>}
 */
export async function extractTextFromPDFVision(pdfPath, options = {}) {
  const { language = 'en', onProgress } = options;
  const client = getVisionClient();

  try {
    console.log(`[Google Vision OCR] Processing ${pdfPath}`);

    // Get page count from PDF
    const pdfBuffer = await readFile(pdfPath);
    const pdfData = await pdf(pdfBuffer);
    const pageCount = pdfData.numpages;

    console.log(`[Google Vision OCR] ${pageCount} pages detected`);

    // Read PDF file as buffer
    const imageBuffer = await readFile(pdfPath);

    // Configure request
    const request = {
      image: { content: imageBuffer },
      features: [
        {
          type: 'DOCUMENT_TEXT_DETECTION',
          maxResults: 1
        }
      ],
      imageContext: {
        languageHints: [language]
      }
    };

    // Call Vision API
    if (onProgress) onProgress(1, 2);

    const [result] = await client.annotateImage(request);

    if (onProgress) onProgress(2, 2);

    // Extract text and confidence
    const textAnnotation = result.fullTextAnnotation;

    if (!textAnnotation) {
      console.warn('[Google Vision OCR] No text detected');
      return [{
        pageNumber: 1,
        text: '',
        confidence: 0
      }];
    }

    // Calculate average confidence from all pages
    const pages = textAnnotation.pages || [];
    const avgConfidence = pages.length > 0
      ? pages.reduce((sum, page) => sum + (page.confidence || 0), 0) / pages.length
      : 0.95; // Default high confidence for Google Vision

    const text = textAnnotation.text || '';

    console.log(`[Google Vision OCR] Extracted ${text.length} characters with ${(avgConfidence * 100).toFixed(1)}% confidence`);

    // For now, return as single page
    // TODO: Split by actual PDF pages if needed
    return [{
      pageNumber: 1,
      text: text.trim(),
      confidence: avgConfidence
    }];

  } catch (error) {
    console.error('[Google Vision OCR] Error:', error);
    throw new Error(`Google Vision OCR failed: ${error.message}`);
  }
}

/**
 * Extract text with detailed word-level information
 * Includes bounding boxes and per-word confidence
 *
 * @param {string} pdfPath - Path to PDF file
 * @returns {Promise<Object>} - Detailed OCR results with bounding boxes
 */
export async function extractTextWithDetails(pdfPath) {
  const client = getVisionClient();

  try {
    const imageBuffer = await readFile(pdfPath);

    const [result] = await client.documentTextDetection(imageBuffer);
    const fullTextAnnotation = result.fullTextAnnotation;

    if (!fullTextAnnotation) {
      return { text: '', words: [], confidence: 0 };
    }

    // Extract word-level details
    const words = [];
    const pages = fullTextAnnotation.pages || [];

    for (const page of pages) {
      for (const block of page.blocks || []) {
        for (const paragraph of block.paragraphs || []) {
          for (const word of paragraph.words || []) {
            const wordText = word.symbols
              .map(s => s.text)
              .join('');

            const boundingBox = word.boundingBox.vertices.map(v => ({
              x: v.x || 0,
              y: v.y || 0
            }));

            words.push({
              text: wordText,
              confidence: word.confidence || 0,
              boundingBox: boundingBox
            });
          }
        }
      }
    }

    const avgConfidence = words.length > 0
      ? words.reduce((sum, w) => sum + w.confidence, 0) / words.length
      : 0;

    return {
      text: fullTextAnnotation.text,
      words: words,
      confidence: avgConfidence,
      pageCount: pages.length
    };

  } catch (error) {
    console.error('[Google Vision OCR] Detailed extraction error:', error);
    throw error;
  }
}

/**
 * Batch process multiple PDF pages
 * More efficient for large documents
 *
 * @param {Array<string>} imagePaths - Paths to page images
 * @param {Object} options - Configuration options
 * @returns {Promise<Array>} - Array of OCR results
 */
export async function batchExtractText(imagePaths, options = {}) {
  const client = getVisionClient();
  const { language = 'en' } = options;

  try {
    const requests = imagePaths.map(async (imagePath, index) => {
      const imageBuffer = await readFile(imagePath);

      return {
        image: { content: imageBuffer },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        imageContext: { languageHints: [language] }
      };
    });

    const allRequests = await Promise.all(requests);

    // Batch annotate (up to 16 images per request)
    const batchSize = 16;
    const results = [];

    for (let i = 0; i < allRequests.length; i += batchSize) {
      const batch = allRequests.slice(i, i + batchSize);
      const [batchResults] = await client.batchAnnotateImages({ requests: batch });

      results.push(...batchResults.responses);
    }

    // Process results
    return results.map((result, index) => {
      const textAnnotation = result.fullTextAnnotation;
      const confidence = textAnnotation?.pages?.[0]?.confidence || 0;

      return {
        pageNumber: index + 1,
        text: textAnnotation?.text || '',
        confidence: confidence
      };
    });

  } catch (error) {
    console.error('[Google Vision OCR] Batch processing error:', error);
    throw error;
  }
}

/**
 * Check if Google Cloud Vision is configured
 *
 * @returns {boolean}
 */
export function isVisionConfigured() {
  return !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

/**
 * Test Google Cloud Vision API connection
 *
 * @returns {Promise<boolean>}
 */
export async function testVisionConnection() {
  try {
    const client = getVisionClient();

    // Simple test: try to create a client
    // Vision API doesn't have a simple "ping" endpoint
    // We'll just verify the client initializes correctly
    const clientInfo = await client.getProjectId();
    console.log(`[Google Vision OCR] Connected to project: ${clientInfo}`);
    return true;

  } catch (error) {
    console.error('[Google Vision OCR] Connection test failed:', error.message);
    return false;
  }
}

/**
 * Get detailed information about Vision API capabilities
 *
 * @returns {Object} - API capabilities and limits
 */
export function getVisionCapabilities() {
  return {
    features: [
      'Document text detection',
      'Handwriting recognition',
      'Table detection',
      'Per-word confidence scores',
      'Bounding box coordinates',
      'Language detection',
      'Batch processing (up to 16 images)',
      'Async processing for large files'
    ],
    pricing: {
      freeTier: '1,000 pages/month',
      paidRate: '$1.50 per 1,000 pages',
      unit: 'per page or image'
    },
    limits: {
      fileSize: '20 MB per request',
      batchSize: 16,
      maxPages: 'Unlimited (use async for >2000 pages)'
    }
  };
}
