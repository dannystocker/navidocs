/**
 * File Safety Validation Service
 * Validates uploaded files for security and format compliance
 */

import { fileTypeFromBuffer } from 'file-type';
import path from 'path';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default

// Documents
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.txt', '.md',
  // Images
  '.jpg', '.jpeg', '.png', '.webp'
];

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
  'image/jpeg',
  'image/png',
  'image/webp'
];

/**
 * Validate file safety and format
 * @param {Object} file - Multer file object
 * @param {Buffer} file.buffer - File buffer for MIME type detection
 * @param {string} file.originalname - Original filename
 * @param {number} file.size - File size in bytes
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateFile(file) {
  // Check file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File extension ${ext} not allowed. Accepted types: PDF, JPG, PNG, DOCX, XLSX, TXT, MD`
    };
  }

  // Check MIME type via file-type (magic number detection)
  // Note: Text files (.txt, .md) may not be detected by file-type
  try {
    const detectedType = await fileTypeFromBuffer(file.buffer);

    // Skip MIME check for text files (they don't have magic numbers)
    const textExtensions = ['.txt', '.md'];
    const isTextFile = textExtensions.includes(ext);

    // For binary files (PDF, images, Office), verify MIME type
    if (!isTextFile && detectedType && !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
      return {
        valid: false,
        error: `File type mismatch: detected ${detectedType.mime}, expected ${ext} file`
      };
    }
  } catch (error) {
    // Ignore MIME detection errors for text files
    const textExtensions = ['.txt', '.md'];
    if (!textExtensions.includes(ext)) {
      return {
        valid: false,
        error: 'Unable to verify file type'
      };
    }
  }

  // Check for null bytes (potential attack vector)
  if (file.originalname.includes('\0')) {
    return {
      valid: false,
      error: 'Invalid filename'
    };
  }

  // All checks passed
  return { valid: true };
}

/**
 * Sanitize filename for safe storage
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  // Remove path separators and null bytes
  let sanitized = filename
    .replace(/[\/\\]/g, '_')
    .replace(/\0/g, '');

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limit length
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);
  const maxNameLength = 200;

  if (name.length > maxNameLength) {
    sanitized = name.substring(0, maxNameLength) + ext;
  }

  return sanitized;
}

/**
 * Get file category based on extension
 * @param {string} filename - Filename to categorize
 * @returns {string} Category: 'pdf', 'word', 'excel', 'text', 'image', or 'unknown'
 */
export function getFileCategory(filename) {
  const ext = path.extname(filename).toLowerCase();

  if (['.pdf'].includes(ext)) return 'pdf';
  if (['.doc', '.docx'].includes(ext)) return 'word';
  if (['.xls', '.xlsx'].includes(ext)) return 'excel';
  if (['.txt', '.md'].includes(ext)) return 'text';
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'image';

  return 'unknown';
}

export default {
  validateFile,
  sanitizeFilename,
  getFileCategory
};
