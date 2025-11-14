/**
 * Search Module Tests
 * Tests for feature module indexing and search functionality
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  addToIndex,
  updateIndex,
  removeFromIndex,
  bulkIndex,
  search,
  getSearchableModules,
  reindexModule,
  reindexAll
} from '../services/search-modules.service.js';

describe('Search Service', () => {
  describe('Searchable Modules Configuration', () => {
    it('should return all searchable modules', () => {
      const modules = getSearchableModules();
      expect(modules).toBeDefined();
      expect(Object.keys(modules)).toContain('inventory_items');
      expect(Object.keys(modules)).toContain('maintenance_records');
      expect(Object.keys(modules)).toContain('camera_feeds');
      expect(Object.keys(modules)).toContain('contacts');
      expect(Object.keys(modules)).toContain('expenses');
    });

    it('should have correct searchable fields for inventory_items', () => {
      const modules = getSearchableModules();
      const inventory = modules.inventory_items;
      expect(inventory.searchableFields).toContain('name');
      expect(inventory.searchableFields).toContain('category');
      expect(inventory.searchableFields).toContain('notes');
    });

    it('should have correct searchable fields for maintenance_records', () => {
      const modules = getSearchableModules();
      const maintenance = modules.maintenance_records;
      expect(maintenance.searchableFields).toContain('service_type');
      expect(maintenance.searchableFields).toContain('provider');
      expect(maintenance.searchableFields).toContain('notes');
    });

    it('should have correct searchable fields for camera_feeds', () => {
      const modules = getSearchableModules();
      const cameras = modules.camera_feeds;
      expect(cameras.searchableFields).toContain('camera_name');
    });

    it('should have correct searchable fields for contacts', () => {
      const modules = getSearchableModules();
      const contacts = modules.contacts;
      expect(contacts.searchableFields).toContain('name');
      expect(contacts.searchableFields).toContain('email');
      expect(contacts.searchableFields).toContain('phone');
    });

    it('should have correct searchable fields for expenses', () => {
      const modules = getSearchableModules();
      const expenses = modules.expenses;
      expect(expenses.searchableFields).toContain('category');
      expect(expenses.searchableFields).toContain('notes');
      expect(expenses.searchableFields).toContain('ocr_text');
    });

    it('should have weight configuration for all modules', () => {
      const modules = getSearchableModules();
      Object.values(modules).forEach(module => {
        expect(module.weight).toBeDefined();
        // Name fields should have highest weight
        if (module.weight.name) {
          expect(module.weight.name).toBeGreaterThanOrEqual(5);
        }
      });
    });
  });

  describe('Single Record Indexing', () => {
    it('should index an inventory item', async () => {
      const record = {
        id: 1,
        name: 'Engine Oil',
        category: 'Maintenance',
        notes: 'Synthetic 5W-30',
        boat_id: 1
      };

      const result = await addToIndex('inventory_items', record);
      expect(result.success).toBe(true);
      expect(result.module).toBe('inventory_items');
      expect(result.recordId).toBe(1);
    });

    it('should index a maintenance record', async () => {
      const record = {
        id: 1,
        service_type: 'Oil Change',
        provider: 'Marina Services',
        notes: 'Engine maintenance',
        boat_id: 1
      };

      const result = await addToIndex('maintenance_records', record);
      expect(result.success).toBe(true);
      expect(result.module).toBe('maintenance_records');
    });

    it('should index a camera feed', async () => {
      const record = {
        id: 1,
        camera_name: 'Bow Camera',
        boat_id: 1
      };

      const result = await addToIndex('camera_feeds', record);
      expect(result.success).toBe(true);
      expect(result.module).toBe('camera_feeds');
    });

    it('should index a contact', async () => {
      const record = {
        id: 1,
        name: 'John Doe',
        type: 'mechanic',
        email: 'john@example.com',
        phone: '+1234567890',
        organization_id: 1
      };

      const result = await addToIndex('contacts', record);
      expect(result.success).toBe(true);
      expect(result.module).toBe('contacts');
    });

    it('should index an expense', async () => {
      const record = {
        id: 1,
        category: 'Fuel',
        notes: 'Diesel fuel',
        ocr_text: null,
        boat_id: 1
      };

      const result = await addToIndex('expenses', record);
      expect(result.success).toBe(true);
      expect(result.module).toBe('expenses');
    });

    it('should throw error for unknown module', async () => {
      const record = { id: 1, name: 'Test' };
      await expect(addToIndex('unknown_module', record)).rejects.toThrow();
    });
  });

  describe('Record Update', () => {
    it('should update an indexed record', async () => {
      const record = {
        id: 1,
        name: 'Updated Engine Oil',
        category: 'Maintenance',
        boat_id: 1
      };

      const result = await updateIndex('inventory_items', record);
      expect(result.success).toBe(true);
      expect(result.recordId).toBe(1);
    });

    it('should update a maintenance record', async () => {
      const record = {
        id: 1,
        service_type: 'Updated Oil Change',
        provider: 'New Provider',
        boat_id: 1
      };

      const result = await updateIndex('maintenance_records', record);
      expect(result.success).toBe(true);
    });
  });

  describe('Record Removal', () => {
    it('should remove an indexed record', async () => {
      const result = await removeFromIndex('inventory_items', 1);
      expect(result.success).toBe(true);
      expect(result.recordId).toBe(1);
    });

    it('should remove a maintenance record', async () => {
      const result = await removeFromIndex('maintenance_records', 1);
      expect(result.success).toBe(true);
    });

    it('should remove a contact', async () => {
      const result = await removeFromIndex('contacts', 1);
      expect(result.success).toBe(true);
    });
  });

  describe('Bulk Indexing', () => {
    it('should bulk index multiple records', async () => {
      const records = [
        { id: 1, name: 'Item 1', category: 'Category1', boat_id: 1 },
        { id: 2, name: 'Item 2', category: 'Category2', boat_id: 1 },
        { id: 3, name: 'Item 3', category: 'Category3', boat_id: 2 }
      ];

      const result = await bulkIndex('inventory_items', records);
      expect(result.success).toBe(true);
      expect(result.count).toBe(3);
      expect(result.module).toBe('inventory_items');
    });

    it('should handle empty record array', async () => {
      const result = await bulkIndex('inventory_items', []);
      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      // Index test data
      const inventory = [
        { id: 1, name: 'Engine Oil', category: 'Fluids', notes: 'Synthetic oil', boat_id: 1 },
        { id: 2, name: 'Air Filter', category: 'Maintenance', notes: 'Engine filter', boat_id: 1 }
      ];
      await bulkIndex('inventory_items', inventory);
    });

    it('should search across all modules', async () => {
      const results = await search('oil', {
        limit: 20,
        offset: 0
      });

      expect(results.query).toBe('oil');
      expect(results.modules).toBeDefined();
    });

    it('should search within specific module', async () => {
      const results = await search('oil', {
        module: 'inventory_items',
        limit: 20,
        offset: 0
      });

      expect(results.query).toBe('oil');
      expect(results.modules.inventory_items).toBeDefined();
    });

    it('should apply boat ID filter', async () => {
      const results = await search('filter', {
        filters: { boatId: 1 },
        limit: 20,
        offset: 0
      });

      expect(results.modules).toBeDefined();
    });

    it('should apply category filter for inventory', async () => {
      const results = await search('oil', {
        filters: { category: 'Fluids' },
        module: 'inventory_items',
        limit: 20,
        offset: 0
      });

      expect(results.modules.inventory_items).toBeDefined();
    });

    it('should support pagination', async () => {
      const results = await search('engine', {
        limit: 10,
        offset: 0
      });

      expect(results.modules).toBeDefined();
    });

    it('should return processing time', async () => {
      const results = await search('test', {
        limit: 20,
        offset: 0
      });

      expect(results.processingTimeMs).toBeDefined();
      expect(results.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty search results gracefully', async () => {
      const results = await search('nonexistentterm123', {
        limit: 20,
        offset: 0
      });

      expect(results.query).toBe('nonexistentterm123');
      expect(results.modules).toBeDefined();
    });

    it('should handle special characters in search', async () => {
      const results = await search("test's", {
        limit: 20,
        offset: 0
      });

      expect(results.query).toBe("test's");
      expect(results.modules).toBeDefined();
    });
  });

  describe('Module Reindexing', () => {
    it('should reindex a single module', async () => {
      const result = await reindexModule('inventory_items');
      expect(result.success).toBe(true);
      expect(result.module).toBe('inventory_items');
      expect(result.recordsReindexed).toBeGreaterThanOrEqual(0);
    });

    it('should reindex all modules', async () => {
      const result = await reindexAll();
      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.results.inventory_items).toBeDefined();
      expect(result.results.maintenance_records).toBeDefined();
      expect(result.results.camera_feeds).toBeDefined();
      expect(result.results.contacts).toBeDefined();
      expect(result.results.expenses).toBeDefined();
    });

    it('should track reindex timestamp', async () => {
      const result = await reindexAll();
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid module in addToIndex', async () => {
      const record = { id: 1, name: 'Test' };
      await expect(addToIndex('invalid', record)).rejects.toThrow('Unknown search index');
    });

    it('should handle invalid module in updateIndex', async () => {
      const record = { id: 1, name: 'Test' };
      await expect(updateIndex('invalid', record)).rejects.toThrow('Unknown search index');
    });

    it('should handle invalid module in removeFromIndex', async () => {
      await expect(removeFromIndex('invalid', 1)).rejects.toThrow('Unknown search index');
    });

    it('should handle invalid module in reindexModule', async () => {
      await expect(reindexModule('invalid')).rejects.toThrow('Unknown search index');
    });
  });

  describe('Search Result Format', () => {
    it('should return properly formatted search results', async () => {
      const results = await search('test', {
        limit: 20,
        offset: 0
      });

      expect(results).toHaveProperty('query');
      expect(results).toHaveProperty('modules');
      expect(results).toHaveProperty('totalHits');
      expect(results).toHaveProperty('processingTimeMs');
    });

    it('should return module-specific results with correct structure', async () => {
      const results = await search('test', {
        module: 'inventory_items',
        limit: 20,
        offset: 0
      });

      const moduleResults = results.modules.inventory_items;
      expect(moduleResults).toHaveProperty('module');
      expect(moduleResults).toHaveProperty('hits');
      expect(moduleResults).toHaveProperty('totalHits');
      expect(Array.isArray(moduleResults.hits)).toBe(true);
    });
  });
});
