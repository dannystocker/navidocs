/**
 * Maintenance Routes Tests
 *
 * Tests for:
 * - Creating maintenance records
 * - Retrieving maintenance by boat
 * - Updating next_due_date
 * - Filtering upcoming maintenance
 * - Reminder calculations
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { getDb } from '../db/db.js';
import maintenanceRouter from './maintenance.js';

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = { id: 1, email: 'test@example.com' };
  next();
};

describe('Maintenance Routes', () => {
  let app;
  let db;
  const testBoatId = 1;

  beforeEach(() => {
    // Setup Express app with router
    app = express();
    app.use(express.json());
    app.use(mockAuth);
    app.use('/api/maintenance', maintenanceRouter);

    // Get database connection
    db = getDb();

    // Ensure test boat exists
    db.prepare('INSERT OR IGNORE INTO boats (id, name) VALUES (?, ?)').run(testBoatId, 'Test Boat');
  });

  afterEach(() => {
    // Cleanup test data
    db.prepare('DELETE FROM maintenance_records WHERE boat_id = ?').run(testBoatId);
  });

  describe('POST /api/maintenance - Create maintenance record', () => {
    it('should create a maintenance record with required fields', async () => {
      const res = await request(app)
        .post('/api/maintenance')
        .send({
          boatId: testBoatId,
          service_type: 'Engine Oil Change',
          date: '2025-11-14',
          provider: 'Marina Services',
          cost: 150,
          next_due_date: '2026-05-14',
          notes: 'Quarterly maintenance'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.service_type).toBe('Engine Oil Change');
      expect(res.body.data.boat_id).toBe(testBoatId);
      expect(res.body.data.cost).toBe(150);
    });

    it('should create a maintenance record with minimal fields', async () => {
      const res = await request(app)
        .post('/api/maintenance')
        .send({
          boatId: testBoatId,
          service_type: 'Hull Inspection',
          date: '2025-11-14'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBeNull();
      expect(res.body.data.cost).toBeNull();
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/maintenance')
        .send({
          boatId: testBoatId,
          service_type: 'Engine Oil Change'
          // Missing date
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('required fields');
    });

    it('should reject invalid date format', async () => {
      const res = await request(app)
        .post('/api/maintenance')
        .send({
          boatId: testBoatId,
          service_type: 'Engine Oil Change',
          date: '11/14/2025' // Wrong format
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid date format');
    });

    it('should reject invalid next_due_date format', async () => {
      const res = await request(app)
        .post('/api/maintenance')
        .send({
          boatId: testBoatId,
          service_type: 'Engine Oil Change',
          date: '2025-11-14',
          next_due_date: 'invalid-date'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid next_due_date format');
    });
  });

  describe('GET /api/maintenance/:boatId - List all maintenance for boat', () => {
    beforeEach(() => {
      // Insert test data
      db.prepare(`
        INSERT INTO maintenance_records
        (boat_id, service_type, date, provider, cost, next_due_date, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        testBoatId, 'Engine Oil Change', '2025-10-15', 'Marina Services', 150, '2026-04-15',
        'Regular maintenance', new Date().toISOString(), new Date().toISOString()
      );

      db.prepare(`
        INSERT INTO maintenance_records
        (boat_id, service_type, date, provider, cost, next_due_date, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        testBoatId, 'Hull Inspection', '2025-09-20', 'Inspectors LLC', 300, '2026-09-20',
        'Annual inspection', new Date().toISOString(), new Date().toISOString()
      );
    });

    it('should retrieve all maintenance records for a boat', async () => {
      const res = await request(app)
        .get(`/api/maintenance/${testBoatId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toHaveProperty('total', 2);
    });

    it('should support pagination with limit and offset', async () => {
      const res = await request(app)
        .get(`/api/maintenance/${testBoatId}`)
        .query({ limit: 1, offset: 0 });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.limit).toBe(1);
      expect(res.body.pagination.hasMore).toBe(true);
    });

    it('should filter by service type', async () => {
      const res = await request(app)
        .get(`/api/maintenance/${testBoatId}`)
        .query({ service_type: 'Engine Oil Change' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].service_type).toBe('Engine Oil Change');
    });

    it('should sort by date in descending order', async () => {
      const res = await request(app)
        .get(`/api/maintenance/${testBoatId}`)
        .query({ sortBy: 'date', sortOrder: 'desc' });

      expect(res.status).toBe(200);
      expect(res.body.data[0].date).toBe('2025-10-15');
      expect(res.body.data[1].date).toBe('2025-09-20');
    });

    it('should sort by date in ascending order', async () => {
      const res = await request(app)
        .get(`/api/maintenance/${testBoatId}`)
        .query({ sortBy: 'date', sortOrder: 'asc' });

      expect(res.status).toBe(200);
      expect(res.body.data[0].date).toBe('2025-09-20');
      expect(res.body.data[1].date).toBe('2025-10-15');
    });

    it('should reject invalid sortBy field', async () => {
      const res = await request(app)
        .get(`/api/maintenance/${testBoatId}`)
        .query({ sortBy: 'invalid_field' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return empty array for boat with no maintenance', async () => {
      const newBoatId = 999;
      db.prepare('INSERT OR IGNORE INTO boats (id, name) VALUES (?, ?)').run(newBoatId, 'Empty Boat');

      const res = await request(app)
        .get(`/api/maintenance/${newBoatId}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });
  });

  describe('GET /api/maintenance/:boatId/upcoming - Get upcoming maintenance', () => {
    beforeEach(() => {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const inAWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const inTwoDays = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
      const inThirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      const formatDate = (date) => date.toISOString().split('T')[0];

      // Urgent (within 7 days)
      db.prepare(`
        INSERT INTO maintenance_records
        (boat_id, service_type, date, provider, next_due_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        testBoatId, 'Battery Check', formatDate(today), 'Electrical', formatDate(inTwoDays),
        new Date().toISOString(), new Date().toISOString()
      );

      // Warning (within 30 days)
      db.prepare(`
        INSERT INTO maintenance_records
        (boat_id, service_type, date, provider, next_due_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        testBoatId, 'Oil Change', formatDate(today), 'Marina', formatDate(inAWeek),
        new Date().toISOString(), new Date().toISOString()
      );

      // Future (beyond default 90 days)
      db.prepare(`
        INSERT INTO maintenance_records
        (boat_id, service_type, date, provider, next_due_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        testBoatId, 'Hull Inspection', formatDate(today), 'Inspectors', formatDate(inThirtyDays),
        new Date().toISOString(), new Date().toISOString()
      );

      // Past due
      db.prepare(`
        INSERT INTO maintenance_records
        (boat_id, service_type, date, provider, next_due_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        testBoatId, 'Propeller Cleaning', formatDate(today), 'Harbor', formatDate(new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)),
        new Date().toISOString(), new Date().toISOString()
      );
    });

    it('should retrieve upcoming maintenance within 90 days', async () => {
      const res = await request(app)
        .get(`/api/maintenance/${testBoatId}/upcoming`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('days_until_due');
      expect(res.body.data[0]).toHaveProperty('urgency');
    });

    it('should calculate urgency correctly - urgent within 7 days', async () => {
      const res = await request(app)
        .get(`/api/maintenance/${testBoatId}/upcoming`);

      expect(res.status).toBe(200);
      const urgentRecords = res.body.data.filter(r => r.urgency === 'urgent');
      expect(urgentRecords.length).toBeGreaterThan(0);
    });

    it('should calculate urgency correctly - warning within 30 days', async () => {
      const res = await request(app)
        .get(`/api/maintenance/${testBoatId}/upcoming`);

      expect(res.status).toBe(200);
      const warningRecords = res.body.data.filter(r => r.urgency === 'warning');
      expect(warningRecords.length).toBeGreaterThan(0);
    });

    it('should exclude past due dates by default', async () => {
      const res = await request(app)
        .get(`/api/maintenance/${testBoatId}/upcoming`);

      expect(res.status).toBe(200);
      const hasNegativeDays = res.body.data.some(r => r.days_until_due < 0);
      expect(hasNegativeDays).toBe(false);
    });

    it('should sort upcoming maintenance by next_due_date ascending', async () => {
      const res = await request(app)
        .get(`/api/maintenance/${testBoatId}/upcoming`);

      expect(res.status).toBe(200);
      for (let i = 0; i < res.body.data.length - 1; i++) {
        expect(res.body.data[i].days_until_due).toBeLessThanOrEqual(res.body.data[i + 1].days_until_due);
      }
    });

    it('should support custom daysAhead parameter', async () => {
      const res = await request(app)
        .get(`/api/maintenance/${testBoatId}/upcoming`)
        .query({ daysAhead: 7 });

      expect(res.status).toBe(200);
      expect(res.body.summary.daysAhead).toBe(7);
      res.body.data.forEach(record => {
        expect(record.days_until_due).toBeLessThanOrEqual(7);
      });
    });

    it('should include summary statistics', async () => {
      const res = await request(app)
        .get(`/api/maintenance/${testBoatId}/upcoming`);

      expect(res.status).toBe(200);
      expect(res.body.summary).toHaveProperty('total');
      expect(res.body.summary).toHaveProperty('urgent');
      expect(res.body.summary).toHaveProperty('warning');
      expect(res.body.summary).toHaveProperty('daysAhead');
    });
  });

  describe('PUT /api/maintenance/:id - Update maintenance record', () => {
    let recordId;

    beforeEach(() => {
      const result = db.prepare(`
        INSERT INTO maintenance_records
        (boat_id, service_type, date, provider, cost, next_due_date, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        testBoatId, 'Engine Oil Change', '2025-11-14', 'Marina Services', 150, '2026-05-14',
        'Original notes', new Date().toISOString(), new Date().toISOString()
      );
      recordId = result.lastInsertRowid;
    });

    it('should update next_due_date', async () => {
      const res = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .send({
          next_due_date: '2026-06-14'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.next_due_date).toBe('2026-06-14');
    });

    it('should update service_type', async () => {
      const res = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .send({
          service_type: 'Transmission Fluid Change'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.service_type).toBe('Transmission Fluid Change');
    });

    it('should update multiple fields', async () => {
      const res = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .send({
          service_type: 'Complete Service',
          cost: 200,
          notes: 'Updated notes',
          provider: 'New Provider'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.service_type).toBe('Complete Service');
      expect(res.body.data.cost).toBe(200);
      expect(res.body.data.notes).toBe('Updated notes');
      expect(res.body.data.provider).toBe('New Provider');
    });

    it('should reject invalid date format', async () => {
      const res = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .send({
          date: '11/14/2025'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid date format');
    });

    it('should reject update with no fields', async () => {
      const res = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('No fields to update');
    });

    it('should return 404 for non-existent record', async () => {
      const res = await request(app)
        .put(`/api/maintenance/999999`)
        .send({
          service_type: 'Updated'
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should update the updated_at timestamp', async () => {
      const beforeTime = new Date().toISOString();

      const res = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .send({
          service_type: 'Updated Service'
        });

      const afterTime = new Date().toISOString();

      expect(res.status).toBe(200);
      expect(new Date(res.body.data.updated_at).getTime())
        .toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
      expect(new Date(res.body.data.updated_at).getTime())
        .toBeLessThanOrEqual(new Date(afterTime).getTime());
    });
  });

  describe('DELETE /api/maintenance/:id - Delete maintenance record', () => {
    let recordId;

    beforeEach(() => {
      const result = db.prepare(`
        INSERT INTO maintenance_records
        (boat_id, service_type, date, provider, cost, next_due_date, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        testBoatId, 'Engine Oil Change', '2025-11-14', 'Marina Services', 150, '2026-05-14',
        'Test notes', new Date().toISOString(), new Date().toISOString()
      );
      recordId = result.lastInsertRowid;
    });

    it('should delete a maintenance record', async () => {
      const res = await request(app)
        .delete(`/api/maintenance/${recordId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted successfully');

      // Verify it's deleted
      const deletedRecord = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(recordId);
      expect(deletedRecord).toBeUndefined();
    });

    it('should return 404 for non-existent record', async () => {
      const res = await request(app)
        .delete(`/api/maintenance/999999`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication token', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      // Don't add auth middleware
      appNoAuth.use('/api/maintenance', maintenanceRouter);

      const res = await request(appNoAuth)
        .get(`/api/maintenance/${testBoatId}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Access token');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete maintenance workflow', async () => {
      // Create record
      const createRes = await request(app)
        .post('/api/maintenance')
        .send({
          boatId: testBoatId,
          service_type: 'Engine Oil Change',
          date: '2025-11-14',
          provider: 'Marina Services',
          cost: 150,
          next_due_date: '2026-05-14',
          notes: 'Quarterly maintenance'
        });

      expect(createRes.status).toBe(201);
      const recordId = createRes.body.data.id;

      // Retrieve all records
      const listRes = await request(app)
        .get(`/api/maintenance/${testBoatId}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.some(r => r.id === recordId)).toBe(true);

      // Update record
      const updateRes = await request(app)
        .put(`/api/maintenance/${recordId}`)
        .send({
          next_due_date: '2026-06-14',
          cost: 175
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.next_due_date).toBe('2026-06-14');
      expect(updateRes.body.data.cost).toBe(175);

      // Delete record
      const deleteRes = await request(app)
        .delete(`/api/maintenance/${recordId}`);

      expect(deleteRes.status).toBe(200);

      // Verify deletion
      const finalListRes = await request(app)
        .get(`/api/maintenance/${testBoatId}`);

      expect(finalListRes.body.data.some(r => r.id === recordId)).toBe(false);
    });
  });
});
