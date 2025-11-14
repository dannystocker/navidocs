/**
 * Upload Route - POST /api/upload
 * Handles PDF file uploads with validation, storage, and OCR queue processing
 */

import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDb } from '../db/db.js';
import { validateFile, sanitizeFilename } from '../services/file-safety.js';
import { addOcrJob } from '../services/queue.js';
import { authenticateToken } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Configure multer for memory storage (we'll validate before saving)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800') // 50MB
  }
});

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(__dirname, '../../uploads');

// Ensure upload directory exists
await fs.mkdir(UPLOAD_DIR, { recursive: true });

/**
 * POST /api/upload
 * Upload PDF file and queue for OCR processing
 *
 * @body {File} file - PDF file to upload
 * @body {string} title - Document title
 * @body {string} documentType - Document type (owner-manual, component-manual, etc)
 * @body {string} organizationId - Organization UUID
 * @body {string} [entityId] - Optional entity UUID
 * @body {string} [componentId] - Optional component UUID
 *
 * @returns {Object} { jobId, documentId }
 */
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { title, documentType, organizationId, entityId, componentId, subEntityId } = req.body;

    const userId = req.user.userId;

    // Validate required fields
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!title || !documentType || !organizationId) {
      return res.status(400).json({
        error: 'Missing required fields: title, documentType, organizationId'
      });
    }

    // Validate file safety
    const validation = await validateFile(file);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Generate UUIDs
    const documentId = uuidv4();
    const jobId = uuidv4();

    // Calculate file hash (SHA256) for deduplication
    const fileHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(file.originalname);
    const fileExt = path.extname(sanitizedFilename);
    const storedFilename = `${documentId}${fileExt}`;
    const filePath = join(UPLOAD_DIR, storedFilename);

    // Save file to disk
    await fs.writeFile(filePath, file.buffer);

    // Get database connection
    const db = getDb();

    // Auto-create organization if it doesn't exist (for development/testing)
    const existingOrg = db.prepare('SELECT id FROM organizations WHERE id = ?').get(organizationId);
    if (!existingOrg) {
      console.log(`Creating new organization: ${organizationId}`);
      db.prepare(`
        INSERT INTO organizations (id, name, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(organizationId, organizationId, Date.now(), Date.now());
    }

    // Check for duplicate file hash (optional deduplication)
    const duplicateCheck = db.prepare(
      'SELECT id, title, file_path FROM documents WHERE file_hash = ? AND organization_id = ? AND status != ?'
    ).get(fileHash, organizationId, 'deleted');

    if (duplicateCheck) {
      // File already exists - optionally return existing document
      // For now, we'll allow duplicates but log it
      console.log(`Duplicate file detected: ${duplicateCheck.id}, proceeding with new upload`);
    }

    const timestamp = Date.now();

    // Insert document record
    const insertDocument = db.prepare(`
      INSERT INTO documents (
        id, organization_id, entity_id, sub_entity_id, component_id, uploaded_by,
        title, document_type, file_path, file_name, file_size, file_hash, mime_type,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDocument.run(
      documentId,
      organizationId,
      entityId || null,
      subEntityId || null,
      componentId || null,
      userId,
      title,
      documentType,
      filePath,
      sanitizedFilename,
      file.size,
      fileHash,
      'application/pdf',
      'processing',
      timestamp,
      timestamp
    );

    // Insert OCR job record
    const insertJob = db.prepare(`
      INSERT INTO ocr_jobs (
        id, document_id, status, progress, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `);

    insertJob.run(
      jobId,
      documentId,
      'pending',
      0,
      timestamp
    );

    // Queue OCR job
    await addOcrJob(documentId, jobId, {
      filePath,
      fileName: sanitizedFilename,
      organizationId,
      userId
    });

    // Return success response
    res.status(201).json({
      jobId,
      documentId,
      message: 'File uploaded successfully and queued for processing'
    });

  } catch (error) {
    console.error('Upload error:', error);

    // Clean up file if it was saved
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

export default router;
