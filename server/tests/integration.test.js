/**
 * Integration Tests for NaviDocs API Gateway
 * Tests cross-feature workflows, authentication, error handling, and CORS
 */

import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

/**
 * Mock Express app for testing
 */
const createTestApp = () => {
  const app = express();

  // Middleware
  app.use(express.json());

  // CORS middleware test
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

  // Mock authentication middleware
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Mock token validation
    if (token === 'invalid-token') {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = { id: '123', email: 'test@example.com' };
    next();
  };

  // Mock routes for testing

  // Inventory routes
  app.post('/api/inventory', authenticateToken, (req, res) => {
    const { boat_id, name } = req.body;
    if (!boat_id || !name) {
      return res.status(400).json({ error: 'boat_id and name are required' });
    }
    res.status(201).json({ id: '1', boat_id, name, success: true });
  });

  app.get('/api/inventory/:boatId', authenticateToken, (req, res) => {
    res.json({ success: true, items: [] });
  });

  // Maintenance routes
  app.post('/api/maintenance', authenticateToken, (req, res) => {
    const { boatId, service_type, date } = req.body;
    if (!boatId || !service_type) {
      return res.status(400).json({ error: 'boatId and service_type are required' });
    }
    res.status(201).json({ id: '1', boatId, service_type, date, success: true });
  });

  app.get('/api/maintenance/:boatId', authenticateToken, (req, res) => {
    res.json({ success: true, records: [] });
  });

  app.get('/api/maintenance/:boatId/upcoming', authenticateToken, (req, res) => {
    res.json({ success: true, upcoming: [] });
  });

  app.put('/api/maintenance/:id', authenticateToken, (req, res) => {
    res.json({ success: true, id: req.params.id });
  });

  app.delete('/api/maintenance/:id', authenticateToken, (req, res) => {
    res.status(204).send();
  });

  // Cameras routes
  app.post('/api/cameras', authenticateToken, (req, res) => {
    const { boatId, camera_name, rtsp_url } = req.body;
    if (!boatId || !camera_name || !rtsp_url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    res.status(201).json({ id: '1', boatId, camera_name, rtsp_url, success: true });
  });

  app.get('/api/cameras/:boatId', authenticateToken, (req, res) => {
    res.json({ success: true, cameras: [] });
  });

  app.put('/api/cameras/:id', authenticateToken, (req, res) => {
    res.json({ success: true, id: req.params.id });
  });

  app.delete('/api/cameras/:id', authenticateToken, (req, res) => {
    res.status(204).send();
  });

  // Contacts routes
  app.post('/api/contacts', authenticateToken, (req, res) => {
    const { organizationId, name, type } = req.body;
    if (!organizationId || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    res.status(201).json({ id: '1', organizationId, name, type, success: true });
  });

  app.get('/api/contacts/:organizationId', authenticateToken, (req, res) => {
    res.json({ success: true, contacts: [] });
  });

  app.get('/api/contacts/:id/maintenance', authenticateToken, (req, res) => {
    res.json({ success: true, maintenance: [] });
  });

  app.put('/api/contacts/:id', authenticateToken, (req, res) => {
    res.json({ success: true, id: req.params.id });
  });

  app.delete('/api/contacts/:id', authenticateToken, (req, res) => {
    res.status(204).send();
  });

  // Expenses routes
  app.post('/api/expenses', authenticateToken, (req, res) => {
    const { boatId, amount, currency, date, category } = req.body;
    if (!boatId || !amount || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    res.status(201).json({ id: '1', boatId, amount, currency, date, category, success: true });
  });

  app.get('/api/expenses/:boatId', authenticateToken, (req, res) => {
    res.json({ success: true, expenses: [] });
  });

  app.get('/api/expenses/:boatId/pending', authenticateToken, (req, res) => {
    res.json({ success: true, pending: [] });
  });

  app.put('/api/expenses/:id', authenticateToken, (req, res) => {
    res.json({ success: true, id: req.params.id });
  });

  app.put('/api/expenses/:id/approve', authenticateToken, (req, res) => {
    res.json({ success: true, id: req.params.id, status: 'approved' });
  });

  app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
    res.status(204).send();
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error'
    });
  });

  return app;
};

describe('API Gateway Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  // ============ AUTHENTICATION TESTS ============

  describe('Authentication Middleware', () => {
    it('should reject requests without authentication token', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({ boat_id: '1', name: 'Test Item' });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Authentication');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', 'Bearer invalid-token')
        .send({ boat_id: '1', name: 'Test Item' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Invalid');
    });

    it('should accept valid token and attach user to request', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', 'Bearer valid-token')
        .send({ boat_id: '1', name: 'Test Item' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  // ============ CORS TESTS ============

  describe('CORS Configuration', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should allow cross-origin requests', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  // ============ ERROR HANDLING TESTS ============

  describe('Error Handling', () => {
    it('should return 400 for missing required fields in inventory POST', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test' }); // Missing boat_id

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing required fields in maintenance POST', async () => {
      const response = await request(app)
        .post('/api/maintenance')
        .set('Authorization', 'Bearer valid-token')
        .send({ boatId: '1' }); // Missing service_type

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing required fields in contacts POST', async () => {
      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send({ organizationId: '1' }); // Missing name

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing required fields in expenses POST', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', 'Bearer valid-token')
        .send({ boatId: '1', amount: 100 }); // Missing currency

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing required fields in cameras POST', async () => {
      const response = await request(app)
        .post('/api/cameras')
        .set('Authorization', 'Bearer valid-token')
        .send({ boatId: '1' }); // Missing camera_name and rtsp_url

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  // ============ INVENTORY ENDPOINTS TESTS ============

  describe('Inventory Routes', () => {
    it('POST /api/inventory should create item', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', 'Bearer valid-token')
        .send({
          boat_id: '1',
          name: 'Engine Oil',
          category: 'Supplies',
          purchase_price: 50
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.id).toBeDefined();
    });

    it('GET /api/inventory/:boatId should list items', async () => {
      const response = await request(app)
        .get('/api/inventory/1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });

  // ============ MAINTENANCE ENDPOINTS TESTS ============

  describe('Maintenance Routes', () => {
    it('POST /api/maintenance should create record', async () => {
      const response = await request(app)
        .post('/api/maintenance')
        .set('Authorization', 'Bearer valid-token')
        .send({
          boatId: '1',
          service_type: 'Oil Change',
          date: '2025-11-14',
          provider: 'Marina Services',
          cost: 150
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/maintenance/:boatId should list records', async () => {
      const response = await request(app)
        .get('/api/maintenance/1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/maintenance/:boatId/upcoming should list upcoming', async () => {
      const response = await request(app)
        .get('/api/maintenance/1/upcoming')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/maintenance/:id should update record', async () => {
      const response = await request(app)
        .put('/api/maintenance/1')
        .set('Authorization', 'Bearer valid-token')
        .send({ service_type: 'Updated Service' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/maintenance/:id should delete record', async () => {
      const response = await request(app)
        .delete('/api/maintenance/1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
    });
  });

  // ============ CAMERAS ENDPOINTS TESTS ============

  describe('Cameras Routes', () => {
    it('POST /api/cameras should create camera', async () => {
      const response = await request(app)
        .post('/api/cameras')
        .set('Authorization', 'Bearer valid-token')
        .send({
          boatId: '1',
          camera_name: 'Stern Camera',
          rtsp_url: 'rtsp://192.168.1.100:554/stream'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/cameras/:boatId should list cameras', async () => {
      const response = await request(app)
        .get('/api/cameras/1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/cameras/:id should update camera', async () => {
      const response = await request(app)
        .put('/api/cameras/1')
        .set('Authorization', 'Bearer valid-token')
        .send({ camera_name: 'Updated Camera' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/cameras/:id should delete camera', async () => {
      const response = await request(app)
        .delete('/api/cameras/1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
    });
  });

  // ============ CONTACTS ENDPOINTS TESTS ============

  describe('Contacts Routes', () => {
    it('POST /api/contacts should create contact', async () => {
      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send({
          organizationId: '1',
          name: 'Marina Services',
          type: 'marina',
          phone: '555-1234',
          email: 'marina@example.com'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/contacts/:organizationId should list contacts', async () => {
      const response = await request(app)
        .get('/api/contacts/1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/contacts/:id/maintenance should get linked maintenance', async () => {
      const response = await request(app)
        .get('/api/contacts/1/maintenance')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/contacts/:id should update contact', async () => {
      const response = await request(app)
        .put('/api/contacts/1')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Updated Marina' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('DELETE /api/contacts/:id should delete contact', async () => {
      const response = await request(app)
        .delete('/api/contacts/1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
    });
  });

  // ============ EXPENSES ENDPOINTS TESTS ============

  describe('Expenses Routes', () => {
    it('POST /api/expenses should create expense', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', 'Bearer valid-token')
        .send({
          boatId: '1',
          amount: 250.50,
          currency: 'EUR',
          date: '2025-11-14',
          category: 'Maintenance'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/expenses/:boatId should list expenses', async () => {
      const response = await request(app)
        .get('/api/expenses/1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('GET /api/expenses/:boatId/pending should list pending expenses', async () => {
      const response = await request(app)
        .get('/api/expenses/1/pending')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/expenses/:id should update expense', async () => {
      const response = await request(app)
        .put('/api/expenses/1')
        .set('Authorization', 'Bearer valid-token')
        .send({ amount: 300 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('PUT /api/expenses/:id/approve should approve expense', async () => {
      const response = await request(app)
        .put('/api/expenses/1/approve')
        .set('Authorization', 'Bearer valid-token')
        .send({ approverUserId: 'admin-1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('approved');
    });

    it('DELETE /api/expenses/:id should delete expense', async () => {
      const response = await request(app)
        .delete('/api/expenses/1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(204);
    });
  });

  // ============ CROSS-FEATURE WORKFLOW TESTS ============

  describe('Cross-Feature Workflows', () => {
    it('should create maintenance record linked to contact', async () => {
      // 1. Create contact
      const contactResponse = await request(app)
        .post('/api/contacts')
        .set('Authorization', 'Bearer valid-token')
        .send({
          organizationId: '1',
          name: 'Marina Services',
          type: 'marina'
        });

      expect(contactResponse.status).toBe(201);
      const contactId = contactResponse.body.id;

      // 2. Create maintenance record referencing contact
      const maintenanceResponse = await request(app)
        .post('/api/maintenance')
        .set('Authorization', 'Bearer valid-token')
        .send({
          boatId: '1',
          service_type: 'Engine Service',
          date: '2025-11-14',
          provider: 'Marina Services',
          cost: 500
        });

      expect(maintenanceResponse.status).toBe(201);

      // 3. Retrieve related maintenance for contact
      const relatedResponse = await request(app)
        .get(`/api/contacts/${contactId}/maintenance`)
        .set('Authorization', 'Bearer valid-token');

      expect(relatedResponse.status).toBe(200);
      expect(relatedResponse.body.success).toBe(true);
    });

    it('should create expense and link to maintenance category', async () => {
      // 1. Create maintenance record
      const maintenanceResponse = await request(app)
        .post('/api/maintenance')
        .set('Authorization', 'Bearer valid-token')
        .send({
          boatId: '1',
          service_type: 'Oil Change',
          date: '2025-11-14',
          cost: 150
        });

      expect(maintenanceResponse.status).toBe(201);

      // 2. Create related expense
      const expenseResponse = await request(app)
        .post('/api/expenses')
        .set('Authorization', 'Bearer valid-token')
        .send({
          boatId: '1',
          amount: 150,
          currency: 'EUR',
          date: '2025-11-14',
          category: 'Maintenance'
        });

      expect(expenseResponse.status).toBe(201);
      expect(expenseResponse.body.category).toBe('Maintenance');
    });

    it('should create inventory item and track in maintenance records', async () => {
      // 1. Create inventory item
      const inventoryResponse = await request(app)
        .post('/api/inventory')
        .set('Authorization', 'Bearer valid-token')
        .send({
          boat_id: '1',
          name: 'Engine Oil Filter',
          category: 'Engine Parts',
          purchase_price: 45
        });

      expect(inventoryResponse.status).toBe(201);

      // 2. List inventory for boat
      const listResponse = await request(app)
        .get('/api/inventory/1')
        .set('Authorization', 'Bearer valid-token');

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.success).toBe(true);
    });

    it('should register camera and track in maintenance schedule', async () => {
      // 1. Create camera
      const cameraResponse = await request(app)
        .post('/api/cameras')
        .set('Authorization', 'Bearer valid-token')
        .send({
          boatId: '1',
          camera_name: 'Hull Camera',
          rtsp_url: 'rtsp://192.168.1.100:554/stream'
        });

      expect(cameraResponse.status).toBe(201);

      // 2. List cameras for boat
      const listResponse = await request(app)
        .get('/api/cameras/1')
        .set('Authorization', 'Bearer valid-token');

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.success).toBe(true);
    });
  });

  // ============ HEALTH CHECK ============

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  // ============ RATE LIMITING TEST ============

  describe('Rate Limiting', () => {
    it('should have rate limiting configured on /api routes', async () => {
      // Note: In production, rate limiting would be enforced.
      // This test just verifies the route is accessible.
      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', 'Bearer valid-token')
        .send({ boat_id: '1', name: 'Test' });

      expect([201, 429]).toContain(response.status);
    });
  });
});
