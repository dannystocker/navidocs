/**
 * Contact Routes Tests
 *
 * Tests for:
 * - Contact CRUD operations
 * - Search functionality
 * - Type filtering
 * - Email/phone validation
 * - Organization association
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as contactsService from '../services/contacts.service.js';

describe('Contacts Service', () => {
  const mockOrganizationId = 'test-org-001';
  const mockUserId = 'test-user-001';
  const testContacts = [];

  beforeEach(() => {
    // Reset test data before each test
    testContacts.length = 0;
  });

  afterEach(() => {
    // Cleanup after each test
    testContacts.forEach(contact => {
      try {
        contactsService.deleteContact(contact.id, mockUserId);
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    testContacts.length = 0;
  });

  describe('Contact Creation', () => {
    it('should create a contact with required fields', async () => {
      const contact = await contactsService.createContact({
        organizationId: mockOrganizationId,
        name: 'Marina Bay Dock',
        type: 'marina',
        phone: '+1-555-0123',
        email: 'marina@example.com',
        createdBy: mockUserId
      });

      testContacts.push(contact);

      expect(contact).toBeDefined();
      expect(contact.id).toBeDefined();
      expect(contact.name).toBe('Marina Bay Dock');
      expect(contact.type).toBe('marina');
      expect(contact.organization_id).toBe(mockOrganizationId);
    });

    it('should create a contact without optional fields', async () => {
      const contact = await contactsService.createContact({
        organizationId: mockOrganizationId,
        name: 'Quick Service',
        type: 'mechanic',
        createdBy: mockUserId
      });

      testContacts.push(contact);

      expect(contact).toBeDefined();
      expect(contact.name).toBe('Quick Service');
      expect(contact.phone).toBeNull();
      expect(contact.email).toBeNull();
    });

    it('should throw error if name is missing', async () => {
      await expect(
        contactsService.createContact({
          organizationId: mockOrganizationId,
          type: 'vendor',
          createdBy: mockUserId
        })
      ).rejects.toThrow('Contact name is required');
    });

    it('should throw error if organization ID is missing', async () => {
      await expect(
        contactsService.createContact({
          name: 'Test Contact',
          type: 'vendor',
          createdBy: mockUserId
        })
      ).rejects.toThrow('Organization ID is required');
    });

    it('should support all contact types', async () => {
      const types = ['marina', 'mechanic', 'vendor', 'insurance', 'customs', 'other'];
      const createdContacts = [];

      for (const type of types) {
        const contact = await contactsService.createContact({
          organizationId: mockOrganizationId,
          name: `${type}-contact`,
          type,
          createdBy: mockUserId
        });
        testContacts.push(contact);
        createdContacts.push(contact);
        expect(contact.type).toBe(type);
      }

      expect(createdContacts).toHaveLength(6);
    });

    it('should throw error for invalid contact type', async () => {
      await expect(
        contactsService.createContact({
          organizationId: mockOrganizationId,
          name: 'Invalid Type',
          type: 'invalid_type',
          createdBy: mockUserId
        })
      ).rejects.toThrow('Invalid contact type');
    });
  });

  describe('Contact Validation', () => {
    it('should validate valid email addresses', async () => {
      const contact = await contactsService.createContact({
        organizationId: mockOrganizationId,
        name: 'Email Test',
        email: 'valid.email@example.com',
        createdBy: mockUserId
      });

      testContacts.push(contact);
      expect(contact.email).toBe('valid.email@example.com');
    });

    it('should throw error for invalid email', async () => {
      await expect(
        contactsService.createContact({
          organizationId: mockOrganizationId,
          name: 'Invalid Email',
          email: 'not-an-email',
          createdBy: mockUserId
        })
      ).rejects.toThrow('Invalid email format');
    });

    it('should validate valid phone numbers', async () => {
      const contact = await contactsService.createContact({
        organizationId: mockOrganizationId,
        name: 'Phone Test',
        phone: '+1 (555) 123-4567',
        createdBy: mockUserId
      });

      testContacts.push(contact);
      expect(contact.phone).toBe('+1 (555) 123-4567');
    });

    it('should throw error for invalid phone number', async () => {
      await expect(
        contactsService.createContact({
          organizationId: mockOrganizationId,
          name: 'Invalid Phone',
          phone: 'abc',
          createdBy: mockUserId
        })
      ).rejects.toThrow('Invalid phone number format');
    });

    it('should store email in lowercase', async () => {
      const contact = await contactsService.createContact({
        organizationId: mockOrganizationId,
        name: 'Case Test',
        email: 'TestEmail@EXAMPLE.COM',
        createdBy: mockUserId
      });

      testContacts.push(contact);
      expect(contact.email).toBe('testemail@example.com');
    });
  });

  describe('Contact Retrieval', () => {
    let testContact;

    beforeEach(async () => {
      testContact = await contactsService.createContact({
        organizationId: mockOrganizationId,
        name: 'Retrieval Test',
        type: 'marina',
        phone: '555-0001',
        email: 'retrieval@test.com',
        createdBy: mockUserId
      });
      testContacts.push(testContact);
    });

    it('should get contact by ID', () => {
      const contact = contactsService.getContactById(testContact.id);
      expect(contact).toBeDefined();
      expect(contact.id).toBe(testContact.id);
      expect(contact.name).toBe('Retrieval Test');
    });

    it('should return null for non-existent contact', () => {
      const contact = contactsService.getContactById('non-existent-id');
      expect(contact).toBeNull();
    });

    it('should get all contacts for organization', () => {
      const contacts = contactsService.getContactsByOrganization(mockOrganizationId);
      expect(contacts).toBeDefined();
      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts.some(c => c.id === testContact.id)).toBe(true);
    });

    it('should respect pagination limit', () => {
      const contacts = contactsService.getContactsByOrganization(mockOrganizationId, {
        limit: 1
      });
      expect(contacts.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Contact Filtering', () => {
    beforeEach(async () => {
      // Create contacts of different types
      const contacts = [
        { name: 'Bay Marina', type: 'marina' },
        { name: 'Downtown Marina', type: 'marina' },
        { name: 'Expert Mechanic', type: 'mechanic' },
        { name: 'Parts Vendor', type: 'vendor' },
        { name: 'Marine Insurance', type: 'insurance' }
      ];

      for (const contactData of contacts) {
        const contact = await contactsService.createContact({
          organizationId: mockOrganizationId,
          name: contactData.name,
          type: contactData.type,
          createdBy: mockUserId
        });
        testContacts.push(contact);
      }
    });

    it('should filter contacts by type', () => {
      const marinas = contactsService.getContactsByType(
        mockOrganizationId,
        'marina'
      );
      expect(marinas.length).toBeGreaterThan(0);
      expect(marinas.every(c => c.type === 'marina')).toBe(true);
    });

    it('should filter by mechanic type', () => {
      const mechanics = contactsService.getContactsByType(
        mockOrganizationId,
        'mechanic'
      );
      expect(mechanics.length).toBeGreaterThan(0);
      expect(mechanics[0].type).toBe('mechanic');
    });

    it('should return empty array for non-existent type', () => {
      const contacts = contactsService.getContactsByType(
        mockOrganizationId,
        'nonexistent'
      );
      expect(Array.isArray(contacts)).toBe(true);
    });
  });

  describe('Contact Search', () => {
    beforeEach(async () => {
      const contacts = [
        { name: 'Bay Marina Dock', email: 'bay@marina.com', notes: 'Popular spot' },
        { name: 'Downtown Repairs', phone: '555-1234', notes: 'Fast service' },
        { name: 'Parts Supply Co', email: 'parts@supply.com', notes: 'All boat parts' }
      ];

      for (const contactData of contacts) {
        const contact = await contactsService.createContact({
          organizationId: mockOrganizationId,
          ...contactData,
          createdBy: mockUserId
        });
        testContacts.push(contact);
      }
    });

    it('should search by name', () => {
      const results = contactsService.searchContacts(
        mockOrganizationId,
        'Marina'
      );
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Marina');
    });

    it('should search by email', () => {
      const results = contactsService.searchContacts(
        mockOrganizationId,
        'bay@marina.com'
      );
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search by phone', () => {
      const results = contactsService.searchContacts(
        mockOrganizationId,
        '555-1234'
      );
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search by notes', () => {
      const results = contactsService.searchContacts(
        mockOrganizationId,
        'Fast service'
      );
      expect(results.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const resultsLower = contactsService.searchContacts(
        mockOrganizationId,
        'marina'
      );
      const resultsUpper = contactsService.searchContacts(
        mockOrganizationId,
        'MARINA'
      );
      expect(resultsLower.length).toBe(resultsUpper.length);
    });

    it('should return empty array for no matches', () => {
      const results = contactsService.searchContacts(
        mockOrganizationId,
        'NonExistentContact12345'
      );
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Contact Update', () => {
    let testContact;

    beforeEach(async () => {
      testContact = await contactsService.createContact({
        organizationId: mockOrganizationId,
        name: 'Original Name',
        type: 'marina',
        phone: '555-0001',
        email: 'original@test.com',
        createdBy: mockUserId
      });
      testContacts.push(testContact);
    });

    it('should update contact name', async () => {
      const updated = await contactsService.updateContact({
        id: testContact.id,
        name: 'Updated Name',
        updatedBy: mockUserId
      });

      expect(updated.name).toBe('Updated Name');
    });

    it('should update contact type', async () => {
      const updated = await contactsService.updateContact({
        id: testContact.id,
        type: 'vendor',
        updatedBy: mockUserId
      });

      expect(updated.type).toBe('vendor');
    });

    it('should update contact phone', async () => {
      const updated = await contactsService.updateContact({
        id: testContact.id,
        phone: '+1-555-9999',
        updatedBy: mockUserId
      });

      expect(updated.phone).toBe('+1-555-9999');
    });

    it('should update contact email', async () => {
      const updated = await contactsService.updateContact({
        id: testContact.id,
        email: 'newemail@test.com',
        updatedBy: mockUserId
      });

      expect(updated.email).toBe('newemail@test.com');
    });

    it('should validate updated email', async () => {
      await expect(
        contactsService.updateContact({
          id: testContact.id,
          email: 'invalid-email',
          updatedBy: mockUserId
        })
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw error for non-existent contact', async () => {
      await expect(
        contactsService.updateContact({
          id: 'non-existent',
          name: 'New Name',
          updatedBy: mockUserId
        })
      ).rejects.toThrow('Contact not found');
    });
  });

  describe('Contact Deletion', () => {
    let testContact;

    beforeEach(async () => {
      testContact = await contactsService.createContact({
        organizationId: mockOrganizationId,
        name: 'To Delete',
        type: 'vendor',
        createdBy: mockUserId
      });
      testContacts.push(testContact);
    });

    it('should delete contact', async () => {
      const result = await contactsService.deleteContact(testContact.id, mockUserId);
      expect(result.success).toBe(true);

      const retrieved = contactsService.getContactById(testContact.id);
      expect(retrieved).toBeNull();
    });

    it('should throw error deleting non-existent contact', async () => {
      await expect(
        contactsService.deleteContact('non-existent', mockUserId)
      ).rejects.toThrow('Contact not found');
    });
  });

  describe('Contact Counts', () => {
    beforeEach(async () => {
      const contacts = [
        { name: 'Marina 1', type: 'marina' },
        { name: 'Marina 2', type: 'marina' },
        { name: 'Mechanic 1', type: 'mechanic' },
        { name: 'Vendor 1', type: 'vendor' }
      ];

      for (const contactData of contacts) {
        const contact = await contactsService.createContact({
          organizationId: mockOrganizationId,
          ...contactData,
          createdBy: mockUserId
        });
        testContacts.push(contact);
      }
    });

    it('should get total contact count', () => {
      const count = contactsService.getContactCount(mockOrganizationId);
      expect(count).toBeGreaterThanOrEqual(4);
    });

    it('should get count by type', () => {
      const counts = contactsService.getContactCountByType(mockOrganizationId);
      expect(counts.marina).toBeGreaterThanOrEqual(2);
      expect(counts.mechanic).toBeGreaterThanOrEqual(1);
      expect(counts.vendor).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Related Maintenance Records', () => {
    let testContact;

    beforeEach(async () => {
      testContact = await contactsService.createContact({
        organizationId: mockOrganizationId,
        name: 'Service Provider',
        type: 'mechanic',
        createdBy: mockUserId
      });
      testContacts.push(testContact);
    });

    it('should get related maintenance records', () => {
      const maintenance = contactsService.getRelatedMaintenanceRecords(
        mockOrganizationId,
        testContact.id
      );
      expect(Array.isArray(maintenance)).toBe(true);
    });

    it('should return empty array for non-existent contact', () => {
      const maintenance = contactsService.getRelatedMaintenanceRecords(
        mockOrganizationId,
        'non-existent'
      );
      expect(maintenance).toEqual([]);
    });
  });
});
