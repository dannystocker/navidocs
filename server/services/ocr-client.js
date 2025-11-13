/**
 * OCR Client - Forward OCR requests to remote worker
 *
 * This service calls the remote OCR worker (naviocr) instead of
 * running OCR locally. This offloads CPU-intensive processing.
 */

import { readFileSync } from 'fs';
import FormData from 'form-data';
import logger from '../utils/logger.js';

const OCR_WORKER_URL = process.env.OCR_WORKER_URL || 'http://fr-antibes.duckdns.org/naviocr';
const OCR_WORKER_TIMEOUT = parseInt(process.env.OCR_WORKER_TIMEOUT || '300000'); // 5 minutes
const USE_REMOTE_OCR = process.env.USE_REMOTE_OCR === 'true';

/**
 * Extract text from PDF using remote OCR worker
 *
 * @param {string} pdfPath - Absolute path to PDF file
 * @param {Object} options - OCR options
 * @param {string} options.language - Language code (default: 'eng')
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Array<{pageNumber: number, text: string, confidence: number}>>}
 */
export async function extractTextFromPDF(pdfPath, options = {}) {
  const { language = 'eng', onProgress } = options;

  if (!USE_REMOTE_OCR) {
    throw new Error('Remote OCR is not enabled. Set USE_REMOTE_OCR=true');
  }

  try {
    logger.info(`Remote OCR: Sending ${pdfPath} to ${OCR_WORKER_URL}`);

    // Read PDF file into buffer
    const pdfBuffer = readFileSync(pdfPath);

    // Create form data with file and language
    const formData = new FormData();
    formData.append('file', pdfBuffer, {
      filename: pdfPath.split('/').pop(),
      contentType: 'application/pdf'
    });
    formData.append('language', language);

    // Send to remote OCR worker
    const response = await fetch(`${OCR_WORKER_URL}/ocr`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
      signal: AbortSignal.timeout(OCR_WORKER_TIMEOUT)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OCR worker returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'OCR processing failed');
    }

    logger.info(`Remote OCR: Completed ${result.totalPages} pages`);

    // Call progress callback with final count
    if (onProgress && result.totalPages) {
      onProgress(result.totalPages, result.totalPages);
    }

    return result.pages;

  } catch (error) {
    logger.error('Remote OCR error:', error);

    if (error.name === 'AbortError') {
      throw new Error(`OCR worker timeout after ${OCR_WORKER_TIMEOUT}ms`);
    }

    throw new Error(`Remote OCR failed: ${error.message}`);
  }
}

/**
 * Check if remote OCR worker is available
 *
 * @returns {Promise<boolean>}
 */
export async function checkRemoteOCRHealth() {
  try {
    const response = await fetch(`${OCR_WORKER_URL}/health`, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 'ok';

  } catch (error) {
    logger.warn('Remote OCR health check failed:', error.message);
    return false;
  }
}

/**
 * Get OCR worker info
 *
 * @returns {Object}
 */
export function getOCRWorkerInfo() {
  return {
    enabled: USE_REMOTE_OCR,
    url: OCR_WORKER_URL,
    timeout: OCR_WORKER_TIMEOUT
  };
}
