/**
 * System Settings Service
 * Manages application configuration with encryption support for sensitive values
 */

import crypto from 'crypto';
import { getDb } from '../config/db.js';
import { logAuditEvent } from './audit.service.js';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

if (!process.env.SETTINGS_ENCRYPTION_KEY) {
  console.warn('⚠️  SETTINGS_ENCRYPTION_KEY not set in .env - using random key (settings will not persist across restarts)');
  console.warn('⚠️  Generate a key with: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"');
}

/**
 * Encrypt a value using AES-256-GCM
 */
function encrypt(text) {
  if (!text) return '';

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a value using AES-256-GCM
 */
function decrypt(encryptedData) {
  if (!encryptedData) return '';

  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt setting value');
  }
}

/**
 * Get a single setting by key
 */
export function getSetting(key) {
  const db = getDb();

  const setting = db.prepare(`
    SELECT key, value, encrypted, category, description, updated_by, updated_at
    FROM system_settings
    WHERE key = ?
  `).get(key);

  if (!setting) {
    return null;
  }

  // Decrypt if necessary
  if (setting.encrypted) {
    try {
      setting.value = decrypt(setting.value);
    } catch (error) {
      console.error(`Failed to decrypt setting ${key}:`, error);
      setting.value = null;
    }
  }

  return setting;
}

/**
 * Get all settings in a category
 */
export function getSettingsByCategory(category, options = {}) {
  const db = getDb();
  const { includeEncrypted = false } = options;

  const settings = db.prepare(`
    SELECT key, value, encrypted, category, description, updated_by, updated_at
    FROM system_settings
    WHERE category = ?
    ORDER BY key
  `).all(category);

  return settings.map(setting => {
    // Decrypt if necessary and allowed
    if (setting.encrypted) {
      if (includeEncrypted) {
        try {
          setting.value = decrypt(setting.value);
        } catch (error) {
          console.error(`Failed to decrypt setting ${setting.key}:`, error);
          setting.value = null;
        }
      } else {
        // Hide encrypted values by default
        setting.value = '***ENCRYPTED***';
      }
    }

    return setting;
  });
}

/**
 * Get all settings
 */
export function getAllSettings(options = {}) {
  const db = getDb();
  const { includeEncrypted = false } = options;

  const settings = db.prepare(`
    SELECT key, value, encrypted, category, description, updated_by, updated_at
    FROM system_settings
    ORDER BY category, key
  `).all();

  return settings.map(setting => {
    // Decrypt if necessary and allowed
    if (setting.encrypted) {
      if (includeEncrypted) {
        try {
          setting.value = decrypt(setting.value);
        } catch (error) {
          console.error(`Failed to decrypt setting ${setting.key}:`, error);
          setting.value = null;
        }
      } else {
        // Hide encrypted values by default
        setting.value = '***ENCRYPTED***';
      }
    }

    return setting;
  });
}

/**
 * Set/update a setting
 */
export async function setSetting({ key, value, encrypted = false, category, description, updatedBy }) {
  const db = getDb();

  // Validate inputs
  if (!key) {
    throw new Error('Setting key is required');
  }

  if (value === undefined || value === null) {
    throw new Error('Setting value is required');
  }

  // Check if setting exists
  const existingSetting = db.prepare('SELECT key, encrypted FROM system_settings WHERE key = ?').get(key);

  // If setting exists and was encrypted, new value must be encrypted too
  if (existingSetting && existingSetting.encrypted && !encrypted) {
    throw new Error(`Setting ${key} is encrypted and cannot be updated as unencrypted`);
  }

  // Encrypt if necessary
  let finalValue = String(value);
  if (encrypted) {
    finalValue = encrypt(finalValue);
  }

  const now = Math.floor(Date.now() / 1000);

  if (existingSetting) {
    // Update existing setting
    db.prepare(`
      UPDATE system_settings
      SET value = ?, updated_by = ?, updated_at = ?
      WHERE key = ?
    `).run(finalValue, updatedBy || null, now, key);

    await logAuditEvent({
      userId: updatedBy,
      eventType: 'settings.update',
      resourceType: 'setting',
      resourceId: key,
      status: 'success',
      metadata: { category: existingSetting.category || category }
    });
  } else {
    // Insert new setting
    if (!category) {
      throw new Error('Category is required for new settings');
    }

    db.prepare(`
      INSERT INTO system_settings (key, value, encrypted, category, description, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(key, finalValue, encrypted ? 1 : 0, category, description || null, updatedBy || null, now);

    await logAuditEvent({
      userId: updatedBy,
      eventType: 'settings.create',
      resourceType: 'setting',
      resourceId: key,
      status: 'success',
      metadata: { category }
    });
  }

  return getSetting(key);
}

/**
 * Delete a setting
 */
export async function deleteSetting(key, deletedBy) {
  const db = getDb();

  const setting = getSetting(key);
  if (!setting) {
    throw new Error('Setting not found');
  }

  db.prepare('DELETE FROM system_settings WHERE key = ?').run(key);

  await logAuditEvent({
    userId: deletedBy,
    eventType: 'settings.delete',
    resourceType: 'setting',
    resourceId: key,
    status: 'success',
    metadata: { category: setting.category }
  });

  return { deleted: true, key };
}

/**
 * Get all categories
 */
export function getCategories() {
  const db = getDb();

  const categories = db.prepare(`
    SELECT DISTINCT category
    FROM system_settings
    ORDER BY category
  `).all();

  return categories.map(c => c.category);
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration() {
  const host = getSetting('email.smtp.host')?.value;
  const port = getSetting('email.smtp.port')?.value;
  const user = getSetting('email.smtp.user')?.value;
  const password = getSetting('email.smtp.password')?.value;

  if (!host || !port) {
    throw new Error('Email configuration incomplete: missing host or port');
  }

  // Return configuration status
  return {
    configured: true,
    host,
    port,
    user,
    hasPassword: !!password,
    status: 'Configuration valid (actual email sending not implemented yet)'
  };
}

/**
 * Initialize default settings if not present
 */
export function initializeDefaultSettings() {
  const db = getDb();

  const count = db.prepare('SELECT COUNT(*) as count FROM system_settings').get();

  if (count.count === 0) {
    console.log('📝 Initializing default system settings...');
    // Default settings are inserted by migration
  }

  return { initialized: true, settingsCount: count.count };
}
