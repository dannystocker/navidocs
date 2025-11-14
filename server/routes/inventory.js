import express from 'express';
import { getDb } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { addToIndex, updateIndex, removeFromIndex } from '../services/search-modules.service.js';

const router = express.Router();
const UPLOAD_DIR = 'uploads/inventory/';

// Ensure upload directory exists
await mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {});

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

// POST /api/inventory - Create inventory item
router.post('/', authenticateToken, upload.array('photos', 5), async (req, res) => {
  try {
    const db = getDb();
    const { boat_id, name, category, purchase_date, purchase_price, depreciation_rate } = req.body;

    if (!boat_id || !name) {
      return res.status(400).json({ error: 'boat_id and name are required' });
    }

    // Store photo URLs as JSON string (SQLite doesn't have arrays)
    const photo_urls = req.files ? JSON.stringify(req.files.map(f => `/uploads/inventory/${f.filename}`)) : JSON.stringify([]);

    const current_value = parseFloat(purchase_price) || 0;
    const rate = parseFloat(depreciation_rate) || 0.1;

    const stmt = db.prepare(`
      INSERT INTO inventory_items
      (boat_id, name, category, purchase_date, purchase_price, current_value, photo_urls, depreciation_rate, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      RETURNING *
    `);

    const result = stmt.get(
      boat_id,
      name,
      category || null,
      purchase_date || null,
      current_value,
      current_value,
      photo_urls,
      rate
    );

    // Index in search service
    try {
      await addToIndex('inventory_items', result);
    } catch (indexError) {
      console.error('Warning: Failed to index inventory item:', indexError.message);
      // Don't fail the request if indexing fails
    }

    res.json(result);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/:boatId - List inventory for boat
router.get('/:boatId', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { boatId } = req.params;

    const stmt = db.prepare(`
      SELECT * FROM inventory_items
      WHERE boat_id = ?
      ORDER BY category, name
    `);

    const results = stmt.all(boatId);

    // Parse photo_urls JSON strings
    const items = results.map(item => ({
      ...item,
      photo_urls: item.photo_urls ? JSON.parse(item.photo_urls) : []
    }));

    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/item/:id - Get single item
router.get('/item/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const stmt = db.prepare(`
      SELECT * FROM inventory_items
      WHERE id = ?
    `);

    const result = stmt.get(id);

    if (!result) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Parse photo_urls JSON string
    result.photo_urls = result.photo_urls ? JSON.parse(result.photo_urls) : [];

    res.json(result);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/inventory/:id - Update inventory item
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, category, current_value, notes } = req.body;

    const stmt = db.prepare(`
      UPDATE inventory_items
      SET name = ?, category = ?, current_value = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    const result = stmt.run(
      name,
      category,
      parseFloat(current_value) || 0,
      notes,
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Fetch updated item
    const getStmt = db.prepare('SELECT * FROM inventory_items WHERE id = ?');
    const updated = getStmt.get(id);

    // Parse photo_urls JSON string
    updated.photo_urls = updated.photo_urls ? JSON.parse(updated.photo_urls) : [];

    // Update search index
    try {
      await updateIndex('inventory_items', updated);
    } catch (indexError) {
      console.error('Warning: Failed to update search index:', indexError.message);
      // Don't fail the request if indexing fails
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/inventory/:id - Delete inventory item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM inventory_items WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Remove from search index
    try {
      await removeFromIndex('inventory_items', parseInt(id));
    } catch (indexError) {
      console.error('Warning: Failed to remove from search index:', indexError.message);
      // Don't fail the request if indexing fails
    }

    res.json({ success: true, message: 'Inventory item deleted' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
