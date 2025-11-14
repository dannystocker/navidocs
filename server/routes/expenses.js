/**
 * Expenses Routes - Multi-user expense tracking with OCR receipt upload
 *
 * POST   /api/expenses              - Create expense with receipt upload
 * GET    /api/expenses/:boatId      - List all expenses for boat
 * GET    /api/expenses/:boatId/pending - Get pending approval expenses
 * GET    /api/expenses/:boatId/split    - Get expenses with split details
 * PUT    /api/expenses/:id          - Update expense
 * PUT    /api/expenses/:id/approve  - Approve expense
 * DELETE /api/expenses/:id          - Delete expense
 * POST   /api/expenses/:id/ocr      - Process receipt OCR
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { mkdir } from 'fs/promises';
import { getDb } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { addToIndex, updateIndex, removeFromIndex } from '../services/search-modules.service.js';

const router = express.Router();

// Multer configuration for receipt uploads
const uploadDir = './uploads/receipts';
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF allowed.'));
    }
  }
});

/**
 * POST /api/expenses
 * Create a new expense with optional receipt upload
 *
 * Body:
 * {
 *   boatId: number,
 *   amount: number,
 *   currency: string (EUR, USD, GBP),
 *   date: string (YYYY-MM-DD),
 *   category: string,
 *   description: string,
 *   splitUsers: { userId: percentage } (JSONB format),
 *   receipt?: File
 * }
 */
router.post('/', authenticateToken, upload.single('receipt'), async (req, res) => {
  try {
    const { boatId, amount, currency = 'EUR', date, category, description, splitUsers } = req.body;

    // Validate required fields
    if (!boatId || !amount || !date || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: boatId, amount, date, category'
      });
    }

    // Validate amount is positive
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    // Validate currency
    const validCurrencies = ['EUR', 'USD', 'GBP'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency. Supported: EUR, USD, GBP'
      });
    }

    const db = getDb();
    const receiptUrl = req.file ? `/uploads/receipts/${req.file.filename}` : null;
    const splitUsersParsed = splitUsers ? JSON.parse(splitUsers) : {};

    const expenseId = uuidv4();
    const createdAt = new Date().toISOString();

    // Insert expense
    const result = db.prepare(`
      INSERT INTO expenses (
        id, boat_id, amount, currency, date, category,
        description, receipt_url, split_users, approval_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      expenseId,
      boatId,
      parseFloat(amount),
      currency,
      date,
      category,
      description || null,
      receiptUrl,
      JSON.stringify(splitUsersParsed),
      'pending',
      createdAt,
      createdAt
    );

    logger.info('Expense created', {
      expenseId,
      boatId,
      amount,
      currency,
      category,
      hasReceipt: !!receiptUrl
    });

    // Create expense object for indexing
    const expenseRecord = {
      id: expenseId,
      boat_id: boatId,
      amount: parseFloat(amount),
      currency,
      date,
      category,
      notes: description,
      ocr_text: null,
      approval_status: 'pending',
      created_at: createdAt
    };

    // Index in search service
    try {
      await addToIndex('expenses', expenseRecord);
    } catch (indexError) {
      logger.error('Warning: Failed to index expense:', indexError.message);
      // Don't fail the request if indexing fails
    }

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      expense: {
        id: expenseId,
        boatId,
        amount: parseFloat(amount),
        currency,
        date,
        category,
        description,
        receiptUrl,
        splitUsers: splitUsersParsed,
        approvalStatus: 'pending',
        createdAt
      }
    });

  } catch (error) {
    logger.error('Error creating expense', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create expense: ' + error.message
    });
  }
});

/**
 * GET /api/expenses/:boatId
 * List all expenses for a boat with optional filters
 *
 * Query:
 * - startDate: string (YYYY-MM-DD)
 * - endDate: string (YYYY-MM-DD)
 * - category: string
 * - status: string (pending, approved, settled)
 */
router.get('/:boatId', authenticateToken, async (req, res) => {
  try {
    const { boatId } = req.params;
    const { startDate, endDate, category, status } = req.query;

    let query = `
      SELECT
        id, boat_id as boatId, amount, currency, date, category,
        description, receipt_url as receiptUrl, ocr_text as ocrText,
        split_users as splitUsers, approval_status as approvalStatus,
        created_at as createdAt, updated_at as updatedAt
      FROM expenses
      WHERE boat_id = ?
    `;
    const params = [boatId];

    if (startDate) {
      query += ` AND date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND date <= ?`;
      params.push(endDate);
    }

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (status) {
      query += ` AND approval_status = ?`;
      params.push(status);
    }

    query += ` ORDER BY date DESC`;

    const db = getDb();
    const expenses = db.prepare(query).all(...params);

    // Parse JSONB splitUsers field
    const parsedExpenses = expenses.map(exp => ({
      ...exp,
      splitUsers: typeof exp.splitUsers === 'string' ? JSON.parse(exp.splitUsers) : exp.splitUsers || {}
    }));

    res.json({
      success: true,
      count: parsedExpenses.length,
      expenses: parsedExpenses
    });

  } catch (error) {
    logger.error('Error fetching expenses', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expenses: ' + error.message
    });
  }
});

/**
 * GET /api/expenses/:boatId/pending
 * Get pending approval expenses for a boat
 */
router.get('/:boatId/pending', authenticateToken, async (req, res) => {
  try {
    const { boatId } = req.params;

    const db = getDb();
    const expenses = db.prepare(`
      SELECT
        id, boat_id as boatId, amount, currency, date, category,
        description, receipt_url as receiptUrl, ocr_text as ocrText,
        split_users as splitUsers, approval_status as approvalStatus,
        created_at as createdAt, updated_at as updatedAt
      FROM expenses
      WHERE boat_id = ? AND approval_status = 'pending'
      ORDER BY date DESC
    `).all(boatId);

    // Parse JSONB splitUsers field
    const parsedExpenses = expenses.map(exp => ({
      ...exp,
      splitUsers: typeof exp.splitUsers === 'string' ? JSON.parse(exp.splitUsers) : exp.splitUsers || {}
    }));

    res.json({
      success: true,
      count: parsedExpenses.length,
      expenses: parsedExpenses
    });

  } catch (error) {
    logger.error('Error fetching pending expenses', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending expenses: ' + error.message
    });
  }
});

/**
 * GET /api/expenses/:boatId/split
 * Get expenses with split details and per-user breakdown
 */
router.get('/:boatId/split', authenticateToken, async (req, res) => {
  try {
    const { boatId } = req.params;

    const db = getDb();
    const expenses = db.prepare(`
      SELECT
        id, boat_id as boatId, amount, currency, date, category,
        description, receipt_url as receiptUrl, ocr_text as ocrText,
        split_users as splitUsers, approval_status as approvalStatus,
        created_at as createdAt, updated_at as updatedAt
      FROM expenses
      WHERE boat_id = ?
      ORDER BY date DESC
    `).all(boatId);

    // Parse JSONB and calculate per-user amounts
    const expensesWithSplits = expenses.map(exp => {
      const splitUsers = typeof exp.splitUsers === 'string' ? JSON.parse(exp.splitUsers) : exp.splitUsers || {};
      const userBreakdown = {};

      // Calculate amount per user
      for (const [userId, percentage] of Object.entries(splitUsers)) {
        userBreakdown[userId] = (exp.amount * percentage / 100).toFixed(2);
      }

      return {
        ...exp,
        splitUsers,
        userBreakdown
      };
    });

    // Calculate totals by user across all expenses
    const userTotals = {};
    expensesWithSplits.forEach(exp => {
      Object.entries(exp.userBreakdown).forEach(([userId, amount]) => {
        userTotals[userId] = (parseFloat(userTotals[userId] || 0) + parseFloat(amount)).toFixed(2);
      });
    });

    res.json({
      success: true,
      expenses: expensesWithSplits,
      userTotals,
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)
    });

  } catch (error) {
    logger.error('Error fetching split expenses', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch split expenses: ' + error.message
    });
  }
});

/**
 * PUT /api/expenses/:id
 * Update expense details
 */
router.put('/:id', authenticateToken, upload.single('receipt'), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, currency, date, category, description, splitUsers } = req.body;

    const db = getDb();

    // Check if expense exists
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    // Don't allow updates if approved or settled
    if (expense.approval_status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot update ${expense.approval_status} expense`
      });
    }

    const updates = {};
    const updatedAt = new Date().toISOString();

    if (amount !== undefined) {
      if (parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be greater than 0'
        });
      }
      updates.amount = parseFloat(amount);
    }

    if (currency) updates.currency = currency;
    if (date) updates.date = date;
    if (category) updates.category = category;
    if (description !== undefined) updates.description = description;

    if (splitUsers) {
      updates.split_users = JSON.stringify(JSON.parse(splitUsers));
    }

    if (req.file) {
      updates.receipt_url = `/uploads/receipts/${req.file.filename}`;
    }

    updates.updated_at = updatedAt;

    // Build update query
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);

    db.prepare(`UPDATE expenses SET ${setClause} WHERE id = ?`).run(...values);

    logger.info('Expense updated', { expenseId: id });

    const updated = db.prepare(`
      SELECT
        id, boat_id as boatId, amount, currency, date, category,
        description, receipt_url as receiptUrl, ocr_text as ocrText,
        split_users as splitUsers, approval_status as approvalStatus,
        created_at as createdAt, updated_at as updatedAt
      FROM expenses WHERE id = ?
    `).get(id);

    updated.splitUsers = JSON.parse(updated.splitUsers || '{}');

    // Update search index
    const expenseRecord = {
      id: updated.id,
      boat_id: updated.boatId,
      amount: updated.amount,
      category: updated.category,
      notes: updated.description,
      ocr_text: updated.ocrText,
      approval_status: updated.approvalStatus
    };
    try {
      await updateIndex('expenses', expenseRecord);
    } catch (indexError) {
      logger.error('Warning: Failed to update search index:', indexError.message);
      // Don't fail the request if indexing fails
    }

    res.json({
      success: true,
      message: 'Expense updated successfully',
      expense: updated
    });

  } catch (error) {
    logger.error('Error updating expense', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update expense: ' + error.message
    });
  }
});

/**
 * PUT /api/expenses/:id/approve
 * Approve an expense (changes status from pending to approved)
 *
 * Body:
 * {
 *   approverUserId: string,
 *   notes: string (optional)
 * }
 */
router.put('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { approverUserId, notes } = req.body;

    if (!approverUserId) {
      return res.status(400).json({
        success: false,
        error: 'approverUserId is required'
      });
    }

    const db = getDb();

    // Check if expense exists
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    // Can only approve pending expenses
    if (expense.approval_status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot approve ${expense.approval_status} expense`
      });
    }

    const updatedAt = new Date().toISOString();

    // Update expense status
    db.prepare(`
      UPDATE expenses
      SET approval_status = 'approved', updated_at = ?
      WHERE id = ?
    `).run(updatedAt, id);

    logger.info('Expense approved', {
      expenseId: id,
      approverUserId,
      notes
    });

    const approved = db.prepare(`
      SELECT
        id, boat_id as boatId, amount, currency, date, category,
        description, receipt_url as receiptUrl, ocr_text as ocrText,
        split_users as splitUsers, approval_status as approvalStatus,
        created_at as createdAt, updated_at as updatedAt
      FROM expenses WHERE id = ?
    `).get(id);

    approved.splitUsers = JSON.parse(approved.splitUsers || '{}');

    res.json({
      success: true,
      message: 'Expense approved successfully',
      expense: approved
    });

  } catch (error) {
    logger.error('Error approving expense', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to approve expense: ' + error.message
    });
  }
});

/**
 * DELETE /api/expenses/:id
 * Delete an expense (only pending expenses can be deleted)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDb();

    // Check if expense exists
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    // Only pending expenses can be deleted
    if (expense.approval_status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot delete ${expense.approval_status} expense`
      });
    }

    // Delete receipt file if exists
    if (expense.receipt_url) {
      const filePath = `.${expense.receipt_url}`;
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        logger.warn('Could not delete receipt file', { filePath, error: err.message });
      }
    }

    // Delete from database
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);

    logger.info('Expense deleted', { expenseId: id });

    // Remove from search index
    try {
      await removeFromIndex('expenses', id);
    } catch (indexError) {
      logger.error('Warning: Failed to remove from search index:', indexError.message);
      // Don't fail the request if indexing fails
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting expense', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete expense: ' + error.message
    });
  }
});

/**
 * POST /api/expenses/:id/ocr
 * Process receipt OCR (mock implementation for now)
 * In production, integrate with Google Vision API, AWS Textract, or similar
 */
router.post('/:id/ocr', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDb();

    // Check if expense exists
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    if (!expense.receipt_url) {
      return res.status(400).json({
        success: false,
        error: 'No receipt attached to this expense'
      });
    }

    // Mock OCR response (in production, call actual OCR service)
    const mockOcrText = `
RECEIPT
Date: ${expense.date}
Category: ${expense.category}
Amount: ${expense.amount} ${expense.currency}

Items:
- Item 1: 50.00 EUR
- Item 2: 30.00 EUR

Subtotal: 80.00 EUR
Tax: 20.00 EUR
Total: 100.00 EUR

Vendor: Sample Vendor
Address: 123 Main Street
Phone: +1-234-567-8900
    `.trim();

    // Update expense with OCR text
    const updatedAt = new Date().toISOString();
    db.prepare(`
      UPDATE expenses
      SET ocr_text = ?, updated_at = ?
      WHERE id = ?
    `).run(mockOcrText, updatedAt, id);

    logger.info('OCR processed for expense', { expenseId: id });

    res.json({
      success: true,
      message: 'Receipt OCR processed successfully',
      ocrText: mockOcrText,
      confidence: 0.95,
      detectedItems: [
        { description: 'Item 1', amount: 50.00 },
        { description: 'Item 2', amount: 30.00 }
      ]
    });

  } catch (error) {
    logger.error('Error processing OCR', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to process OCR: ' + error.message
    });
  }
});

export default router;
