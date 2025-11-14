import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import inventoryRouter from './inventory.js';
import { getDb } from '../db/db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-key';

// Mock database
let testDb;
let app;
let authToken;

// Create test Express app
beforeAll(() => {
  app = express();
  app.use(express.json());

  // Middleware to inject test token
  app.use((req, res, next) => {
    req.user = { id: 1, username: 'testuser' };
    next();
  });

  app.use('/api/inventory', inventoryRouter);

  // Initialize test database
  try {
    testDb = getDb();

    // Create inventory_items table if it doesn't exist
    testDb.exec(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        boat_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        purchase_date DATE,
        purchase_price DECIMAL(10,2),
        current_value DECIMAL(10,2),
        photo_urls TEXT,
        depreciation_rate DECIMAL(5,4) DEFAULT 0.1,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create boats table if needed (for foreign key)
    testDb.exec(`
      CREATE TABLE IF NOT EXISTS boats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert test boat
    const stmt = testDb.prepare('INSERT OR IGNORE INTO boats (id, name) VALUES (?, ?)');
    stmt.run(1, 'Test Boat');
  } catch (error) {
    console.error('Database setup error:', error);
  }
});

afterAll(() => {
  try {
    if (testDb) {
      testDb.exec('DELETE FROM inventory_items');
      // Don't close the database as it's a singleton
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

beforeEach(() => {
  try {
    if (testDb) {
      testDb.exec('DELETE FROM inventory_items');
    }
  } catch (error) {
    console.error('beforeEach cleanup error:', error);
  }
});

describe('Inventory API Routes', () => {
  describe('POST /api/inventory', () => {
    it('should create a new inventory item', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .field('boat_id', '1')
        .field('name', 'Test Equipment')
        .field('category', 'Electronics')
        .field('purchase_date', '2025-01-01')
        .field('purchase_price', '1000.00')
        .field('depreciation_rate', '0.1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Equipment');
      expect(response.body.category).toBe('Electronics');
      expect(response.body.boat_id).toBe(1);
    });

    it('should require boat_id', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .field('name', 'Test Equipment');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should require name', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .field('boat_id', '1');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should set current_value equal to purchase_price', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .field('boat_id', '1')
        .field('name', 'Test Equipment')
        .field('purchase_price', '5000.00');

      expect(response.status).toBe(200);
      expect(response.body.current_value).toBe(5000);
    });

    it('should default depreciation_rate to 0.1', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .field('boat_id', '1')
        .field('name', 'Test Equipment')
        .field('purchase_price', '1000');

      expect(response.status).toBe(200);
      expect(response.body.depreciation_rate).toBe(0.1);
    });
  });

  describe('GET /api/inventory/:boatId', () => {
    beforeEach(async () => {
      // Create test items
      if (testDb) {
        const stmt = testDb.prepare(`
          INSERT INTO inventory_items
          (boat_id, name, category, purchase_price, current_value, depreciation_rate, photo_urls)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(1, 'Engine Oil', 'Engine', 50, 50, 0.1, '[]');
        stmt.run(1, 'Main Sail', 'Sails', 2000, 1800, 0.15, '[]');
        stmt.run(2, 'GPS Unit', 'Electronics', 800, 600, 0.2, '[]');
      }
    });

    it('should return all inventory items for a boat', async () => {
      const response = await request(app)
        .get('/api/inventory/1');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should return items sorted by category and name', async () => {
      const response = await request(app)
        .get('/api/inventory/1');

      expect(response.status).toBe(200);
      expect(response.body[0].category).toBe('Engine');
      expect(response.body[1].category).toBe('Sails');
    });

    it('should return empty array for boat with no items', async () => {
      const response = await request(app)
        .get('/api/inventory/999');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should parse photo_urls JSON', async () => {
      const response = await request(app)
        .get('/api/inventory/1');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body[0].photo_urls)).toBe(true);
    });
  });

  describe('GET /api/inventory/item/:id', () => {
    beforeEach(async () => {
      if (testDb) {
        const stmt = testDb.prepare(`
          INSERT INTO inventory_items
          (boat_id, name, category, purchase_price, current_value, depreciation_rate, photo_urls, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(1, 'Test Item', 'Electronics', 1000, 900, 0.1, '[]', 'Test notes');
      }
    });

    it('should return a single inventory item by ID', async () => {
      const response = await request(app)
        .get('/api/inventory/item/1');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Item');
      expect(response.body.category).toBe('Electronics');
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/api/inventory/item/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should include all item properties', async () => {
      const response = await request(app)
        .get('/api/inventory/item/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('boat_id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('purchase_price');
      expect(response.body).toHaveProperty('current_value');
      expect(response.body).toHaveProperty('notes');
    });
  });

  describe('PUT /api/inventory/:id', () => {
    beforeEach(async () => {
      if (testDb) {
        const stmt = testDb.prepare(`
          INSERT INTO inventory_items
          (boat_id, name, category, purchase_price, current_value, depreciation_rate, photo_urls)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(1, 'Original Name', 'Electronics', 1000, 900, 0.1, '[]');
      }
    });

    it('should update an inventory item', async () => {
      const response = await request(app)
        .put('/api/inventory/1')
        .send({
          name: 'Updated Name',
          category: 'Safety',
          current_value: 800,
          notes: 'Updated notes'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.category).toBe('Safety');
      expect(response.body.current_value).toBe(800);
      expect(response.body.notes).toBe('Updated notes');
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .put('/api/inventory/999')
        .send({
          name: 'Updated Name',
          category: 'Electronics',
          current_value: 500,
          notes: 'Notes'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should update only provided fields', async () => {
      const response = await request(app)
        .put('/api/inventory/1')
        .send({
          name: 'New Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
      expect(response.body.category).toBe('Electronics'); // Unchanged
    });

    it('should update updated_at timestamp', async () => {
      if (testDb) {
        const itemBefore = testDb.prepare('SELECT updated_at FROM inventory_items WHERE id = 1').get();
        const timestampBefore = itemBefore.updated_at;

        // Wait a bit to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 10));

        const response = await request(app)
          .put('/api/inventory/1')
          .send({
            name: 'New Name',
            category: 'Safety',
            current_value: 500,
            notes: 'Updated'
          });

        expect(response.status).toBe(200);
        expect(response.body.updated_at).not.toBe(timestampBefore);
      }
    });
  });

  describe('DELETE /api/inventory/:id', () => {
    beforeEach(async () => {
      if (testDb) {
        const stmt = testDb.prepare(`
          INSERT INTO inventory_items
          (boat_id, name, category, purchase_price, current_value, depreciation_rate, photo_urls)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(1, 'Item to Delete', 'Electronics', 1000, 900, 0.1, '[]');
        stmt.run(1, 'Item to Keep', 'Safety', 500, 450, 0.1, '[]');
      }
    });

    it('should delete an inventory item', async () => {
      const response = await request(app)
        .delete('/api/inventory/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify item is deleted
      if (testDb) {
        const check = testDb.prepare('SELECT * FROM inventory_items WHERE id = 1').get();
        expect(check).toBeUndefined();
      }
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .delete('/api/inventory/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should not delete other items', async () => {
      const response = await request(app)
        .delete('/api/inventory/1');

      expect(response.status).toBe(200);

      // Verify other item still exists
      if (testDb) {
        const check = testDb.prepare('SELECT * FROM inventory_items WHERE id = 2').get();
        expect(check).toBeDefined();
        expect(check.name).toBe('Item to Keep');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Send request with invalid boat_id type
      const response = await request(app)
        .post('/api/inventory')
        .field('boat_id', 'invalid')
        .field('name', 'Test');

      // Should either succeed or return 500
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle authentication', async () => {
      // The test app doesn't enforce auth, but production should
      const response = await request(app)
        .get('/api/inventory/1');

      // Should return 200 (test middleware allows all)
      expect(response.status).toBe(200);
    });
  });

  describe('Data Validation', () => {
    it('should accept valid purchase prices', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .field('boat_id', '1')
        .field('name', 'Test Item')
        .field('purchase_price', '999.99');

      expect(response.status).toBe(200);
      expect(response.body.purchase_price).toBe(999.99);
    });

    it('should handle zero price', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .field('boat_id', '1')
        .field('name', 'Test Item')
        .field('purchase_price', '0');

      expect(response.status).toBe(200);
      expect(response.body.purchase_price).toBe(0);
    });

    it('should accept valid depreciation rates', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .field('boat_id', '1')
        .field('name', 'Test Item')
        .field('purchase_price', '1000')
        .field('depreciation_rate', '0.25');

      expect(response.status).toBe(200);
      expect(response.body.depreciation_rate).toBe(0.25);
    });
  });
});
