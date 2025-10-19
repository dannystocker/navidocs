/**
 * Google Drive OCR Service
 *
 * Leverages Google Drive's exceptional OCR by:
 * 1. Uploading PDF to Google Drive
 * 2. Converting to Google Docs format (triggers OCR)
 * 3. Exporting as plain text
 * 4. Cleaning up temporary files
 *
 * SETUP REQUIRED:
 * 1. Create Google Cloud Project: https://console.cloud.google.com/
 * 2. Enable Google Drive API
 * 3. Create Service Account credentials
 * 4. Download JSON key file to server/config/google-credentials.json
 * 5. Set GOOGLE_APPLICATION_CREDENTIALS in .env
 *
 * Free tier: 1 billion requests/day (more than enough!)
 */

import { google } from 'googleapis';
import { createReadStream, unlinkSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Initialize Google Drive API client
 */
function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });

  return google.drive({ version: 'v3', auth });
}

/**
 * Extract text from PDF using Google Drive OCR
 *
 * @param {string} pdfPath - Path to PDF file
 * @param {Object} options - Configuration options
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Array<{pageNumber: number, text: string, confidence: number}>>}
 */
export async function extractTextFromPDFGoogleDrive(pdfPath, options = {}) {
  const { onProgress } = options;
  const drive = getDriveClient();

  try {
    console.log(`[Google Drive OCR] Processing ${pdfPath}`);

    // Step 1: Upload PDF to Google Drive
    if (onProgress) onProgress(1, 4);

    const fileMetadata = {
      name: path.basename(pdfPath),
      mimeType: 'application/vnd.google-apps.document' // Convert to Google Docs
    };

    const media = {
      mimeType: 'application/pdf',
      body: createReadStream(pdfPath)
    };

    const uploadResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name'
    });

    const fileId = uploadResponse.data.id;
    console.log(`[Google Drive OCR] Uploaded file: ${fileId}`);

    // Step 2: Wait a moment for OCR to complete
    if (onProgress) onProgress(2, 4);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Export as plain text
    if (onProgress) onProgress(3, 4);

    const exportResponse = await drive.files.export({
      fileId: fileId,
      mimeType: 'text/plain'
    });

    const text = exportResponse.data;

    // Step 4: Delete temporary file
    await drive.files.delete({ fileId });
    console.log(`[Google Drive OCR] Cleaned up temporary file`);

    if (onProgress) onProgress(4, 4);

    // Google Drive doesn't provide page-by-page breakdown or confidence scores
    // We'll estimate based on text quality
    return [{
      pageNumber: 1,
      text: text.trim(),
      confidence: estimateConfidence(text)
    }];

  } catch (error) {
    console.error('[Google Drive OCR] Error:', error);
    throw new Error(`Google Drive OCR failed: ${error.message}`);
  }
}

/**
 * Extract text from PDF with page-by-page breakdown
 * Google Drive OCR doesn't natively support this, so we'd need to:
 * 1. Split PDF into individual pages
 * 2. OCR each page separately
 * 3. Combine results
 *
 * @param {string} pdfPath - Path to PDF file
 * @param {Object} options - Configuration options
 * @returns {Promise<Array<{pageNumber: number, text: string, confidence: number}>>}
 */
export async function extractTextFromPDFByPage(pdfPath, options = {}) {
  // TODO: Implement PDF splitting using pdf-lib or similar
  // For now, use single-page extraction
  return extractTextFromPDFGoogleDrive(pdfPath, options);
}

/**
 * Estimate confidence based on text quality
 * Google Drive doesn't provide confidence scores, so we heuristically estimate
 *
 * @param {string} text - Extracted text
 * @returns {number} - Confidence score (0-1)
 */
function estimateConfidence(text) {
  if (!text || text.length === 0) return 0;

  let score = 0.95; // Start high - Google's OCR is excellent

  // Check for common OCR errors
  const weirdCharRatio = (text.match(/[^a-zA-Z0-9\s.,!?'"()-]/g) || []).length / text.length;
  if (weirdCharRatio > 0.1) score -= 0.15;

  // Check for reasonable word structure
  const words = text.split(/\s+/);
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  if (avgWordLength < 2 || avgWordLength > 20) score -= 0.1;

  return Math.max(0.6, Math.min(1.0, score));
}

/**
 * Check if Google Drive credentials are configured
 *
 * @returns {boolean}
 */
export function isGoogleDriveConfigured() {
  return !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

/**
 * Test Google Drive API connection
 *
 * @returns {Promise<boolean>}
 */
export async function testGoogleDriveConnection() {
  try {
    const drive = getDriveClient();
    await drive.files.list({ pageSize: 1 });
    return true;
  } catch (error) {
    console.error('[Google Drive OCR] Connection test failed:', error.message);
    return false;
  }
}
