/**
 * Contacts Service
 *
 * Handles contact CRUD operations for marina, mechanic, and vendor contacts
 * Includes search, filtering, and validation
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/db.js';
import { logAuditEvent } from './audit.service.js';

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
function validatePhone(phone) {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function validateEmail(email) {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Create a new contact
 * @param {Object} params - Contact parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.name - Contact name
 * @param {string} params.type - Contact type (marina, mechanic, vendor, insurance, customs, other)
 * @param {string} params.phone - Contact phone
 * @param {string} params.email - Contact email
 * @param {string} params.address - Contact address
 * @param {string} params.notes - Contact notes
 * @param {string} params.createdBy - User creating the contact
 * @returns {Promise<Object>} Created contact
 */
export async function createContact({
  organizationId,
  name,
  type = 'other',
  phone,
  email,
  address,
  notes,
  createdBy
}) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  if (!name || name.trim().length === 0) {
    throw new Error('Contact name is required');
  }

  if (phone && !validatePhone(phone)) {
    throw new Error('Invalid phone number format');
  }

  if (email && !validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  const validTypes = ['marina', 'mechanic', 'vendor', 'insurance', 'customs', 'other'];
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid contact type. Must be one of: ${validTypes.join(', ')}`);
  }

  const contactId = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO contacts (
      id,
      organization_id,
      name,
      type,
      phone,
      email,
      address,
      notes,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    contactId,
    organizationId,
    name.trim(),
    type,
    phone ? phone.trim() : null,
    email ? email.trim().toLowerCase() : null,
    address ? address.trim() : null,
    notes ? notes.trim() : null,
    now,
    now
  );

  await logAuditEvent({
    userId: createdBy,
    eventType: 'contact.create',
    resourceType: 'contact',
    resourceId: contactId,
    status: 'success',
    metadata: JSON.stringify({ name, type, organizationId })
  });

  return getContactById(contactId);
}

/**
 * Get contact by ID
 * @param {string} id - Contact ID
 * @returns {Object|null} Contact or null
 */
export function getContactById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) || null;
}

/**
 * Get all contacts for an organization
 * @param {string} organizationId - Organization ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Results limit
 * @param {number} options.offset - Results offset
 * @returns {Array} Contacts list
 */
export function getContactsByOrganization(organizationId, { limit = 100, offset = 0 } = {}) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM contacts
    WHERE organization_id = ?
    ORDER BY name ASC
    LIMIT ? OFFSET ?
  `).all(organizationId, limit, offset);
}

/**
 * Get contacts by type
 * @param {string} organizationId - Organization ID
 * @param {string} type - Contact type to filter by
 * @param {Object} options - Query options
 * @returns {Array} Filtered contacts
 */
export function getContactsByType(organizationId, type, { limit = 100, offset = 0 } = {}) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM contacts
    WHERE organization_id = ? AND type = ?
    ORDER BY name ASC
    LIMIT ? OFFSET ?
  `).all(organizationId, type, limit, offset);
}

/**
 * Search contacts by name, type, phone, email, or notes
 * @param {string} organizationId - Organization ID
 * @param {string} query - Search query
 * @param {Object} options - Query options
 * @returns {Array} Search results
 */
export function searchContacts(organizationId, query, { limit = 50, offset = 0 } = {}) {
  const db = getDb();
  const searchTerm = `%${query.toLowerCase()}%`;

  return db.prepare(`
    SELECT * FROM contacts
    WHERE organization_id = ?
      AND (
        LOWER(name) LIKE ?
        OR LOWER(type) LIKE ?
        OR LOWER(phone) LIKE ?
        OR LOWER(email) LIKE ?
        OR LOWER(notes) LIKE ?
      )
    ORDER BY
      CASE
        WHEN LOWER(name) LIKE ? THEN 0
        WHEN LOWER(email) LIKE ? THEN 1
        WHEN LOWER(phone) LIKE ? THEN 2
        ELSE 3
      END,
      name ASC
    LIMIT ? OFFSET ?
  `).all(
    organizationId,
    searchTerm,
    searchTerm,
    searchTerm,
    searchTerm,
    searchTerm,
    searchTerm,
    searchTerm,
    searchTerm,
    limit,
    offset
  );
}

/**
 * Update contact
 * @param {Object} params - Update parameters
 * @param {string} params.id - Contact ID
 * @param {string} params.name - Updated name
 * @param {string} params.type - Updated type
 * @param {string} params.phone - Updated phone
 * @param {string} params.email - Updated email
 * @param {string} params.address - Updated address
 * @param {string} params.notes - Updated notes
 * @param {string} params.updatedBy - User updating contact
 * @returns {Promise<Object>} Updated contact
 */
export async function updateContact({
  id,
  name,
  type,
  phone,
  email,
  address,
  notes,
  updatedBy
}) {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  const contact = getContactById(id);
  if (!contact) {
    throw new Error('Contact not found');
  }

  if (phone && !validatePhone(phone)) {
    throw new Error('Invalid phone number format');
  }

  if (email && !validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  if (type) {
    const validTypes = ['marina', 'mechanic', 'vendor', 'insurance', 'customs', 'other'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid contact type. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name.trim());
  }
  if (type !== undefined) {
    updates.push('type = ?');
    values.push(type);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    values.push(phone ? phone.trim() : null);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email ? email.trim().toLowerCase() : null);
  }
  if (address !== undefined) {
    updates.push('address = ?');
    values.push(address ? address.trim() : null);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    values.push(notes ? notes.trim() : null);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  const sql = `UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...values);

  await logAuditEvent({
    userId: updatedBy,
    eventType: 'contact.update',
    resourceType: 'contact',
    resourceId: id,
    status: 'success',
    metadata: JSON.stringify({ updates })
  });

  return getContactById(id);
}

/**
 * Delete contact
 * @param {string} id - Contact ID
 * @param {string} deletedBy - User deleting contact
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteContact(id, deletedBy) {
  const db = getDb();

  const contact = getContactById(id);
  if (!contact) {
    throw new Error('Contact not found');
  }

  db.prepare('DELETE FROM contacts WHERE id = ?').run(id);

  await logAuditEvent({
    userId: deletedBy,
    eventType: 'contact.delete',
    resourceType: 'contact',
    resourceId: id,
    status: 'success',
    metadata: JSON.stringify({ name: contact.name, type: contact.type })
  });

  return {
    success: true,
    message: 'Contact deleted successfully'
  };
}

/**
 * Get contact count for organization
 * @param {string} organizationId - Organization ID
 * @returns {number} Contact count
 */
export function getContactCount(organizationId) {
  const db = getDb();
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM contacts WHERE organization_id = ?
  `).get(organizationId);
  return result?.count || 0;
}

/**
 * Get contacts by type with count
 * @param {string} organizationId - Organization ID
 * @returns {Object} Count by type
 */
export function getContactCountByType(organizationId) {
  const db = getDb();
  const results = db.prepare(`
    SELECT type, COUNT(*) as count FROM contacts
    WHERE organization_id = ?
    GROUP BY type
  `).all(organizationId);

  const counts = {};
  results.forEach(row => {
    counts[row.type] = row.count;
  });
  return counts;
}

/**
 * Get related maintenance records for a contact
 * @param {string} organizationId - Organization ID
 * @param {string} contactId - Contact ID
 * @returns {Array} Related maintenance records
 */
export function getRelatedMaintenanceRecords(organizationId, contactId) {
  const db = getDb();
  const contact = getContactById(contactId);
  if (!contact) return [];

  // Search for maintenance records that mention this contact
  return db.prepare(`
    SELECT * FROM maintenance_records
    WHERE notes LIKE ?
    LIMIT 10
  `).all(`%${contact.name}%`);
}
