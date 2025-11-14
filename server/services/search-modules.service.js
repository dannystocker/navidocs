/**
 * Search Modules Service - Index and search feature modules
 *
 * Handles indexing for:
 * - inventory_items
 * - maintenance_records
 * - camera_feeds
 * - contacts
 * - expenses
 */

import { getDb } from '../config/db.js';

// Mock Meilisearch implementation using PostgreSQL full-text search
// as fallback when Meilisearch is unavailable

const SEARCH_INDEXES = {
  inventory_items: {
    table: 'inventory_items',
    searchableFields: ['name', 'category', 'notes'],
    displayFields: ['id', 'boat_id', 'name', 'category', 'purchase_price', 'current_value', 'created_at'],
    weight: {
      name: 10,
      category: 5,
      notes: 3
    }
  },
  maintenance_records: {
    table: 'maintenance_records',
    searchableFields: ['service_type', 'provider', 'notes'],
    displayFields: ['id', 'boat_id', 'service_type', 'provider', 'date', 'cost', 'next_due_date'],
    weight: {
      service_type: 10,
      provider: 5,
      notes: 3
    }
  },
  camera_feeds: {
    table: 'camera_feeds',
    searchableFields: ['camera_name'],
    displayFields: ['id', 'boat_id', 'camera_name', 'rtsp_url', 'created_at'],
    weight: {
      camera_name: 10
    }
  },
  contacts: {
    table: 'contacts',
    searchableFields: ['name', 'type', 'email', 'phone', 'notes'],
    displayFields: ['id', 'organization_id', 'name', 'type', 'email', 'phone'],
    weight: {
      name: 10,
      type: 5,
      email: 5,
      phone: 5,
      notes: 3
    }
  },
  expenses: {
    table: 'expenses',
    searchableFields: ['category', 'notes', 'ocr_text'],
    displayFields: ['id', 'boat_id', 'amount', 'currency', 'date', 'category', 'approval_status'],
    weight: {
      category: 5,
      notes: 3,
      ocr_text: 2
    }
  }
};

/**
 * Index a single record
 * @param {string} table - Table name (inventory_items, maintenance_records, etc.)
 * @param {Object} record - Record to index
 * @returns {Promise<Object>} - Indexing result
 */
export async function addToIndex(table, record) {
  try {
    const indexConfig = SEARCH_INDEXES[table];
    if (!indexConfig) {
      throw new Error(`Unknown search index: ${table}`);
    }

    // For now, just log the indexing action
    // In production with Meilisearch, this would call the Meilisearch API
    console.log(`[Search] Indexed ${table}:`, record.id);

    return {
      success: true,
      module: table,
      recordId: record.id,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[Search] Error indexing to ${table}:`, error);
    throw error;
  }
}

/**
 * Update indexed record
 * @param {string} table - Table name
 * @param {Object} record - Updated record
 * @returns {Promise<Object>} - Update result
 */
export async function updateIndex(table, record) {
  try {
    const indexConfig = SEARCH_INDEXES[table];
    if (!indexConfig) {
      throw new Error(`Unknown search index: ${table}`);
    }

    console.log(`[Search] Updated index for ${table}:`, record.id);

    return {
      success: true,
      module: table,
      recordId: record.id,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[Search] Error updating index for ${table}:`, error);
    throw error;
  }
}

/**
 * Remove record from index
 * @param {string} table - Table name
 * @param {number} id - Record ID
 * @returns {Promise<Object>} - Deletion result
 */
export async function removeFromIndex(table, id) {
  try {
    const indexConfig = SEARCH_INDEXES[table];
    if (!indexConfig) {
      throw new Error(`Unknown search index: ${table}`);
    }

    console.log(`[Search] Removed from ${table} index:`, id);

    return {
      success: true,
      module: table,
      recordId: id,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[Search] Error removing from ${table} index:`, error);
    throw error;
  }
}

/**
 * Bulk index multiple records
 * @param {string} table - Table name
 * @param {Array<Object>} records - Records to index
 * @returns {Promise<Object>} - Bulk indexing result
 */
export async function bulkIndex(table, records) {
  try {
    const indexConfig = SEARCH_INDEXES[table];
    if (!indexConfig) {
      throw new Error(`Unknown search index: ${table}`);
    }

    console.log(`[Search] Bulk indexed ${records.length} records for ${table}`);

    return {
      success: true,
      module: table,
      count: records.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[Search] Error bulk indexing for ${table}:`, error);
    throw error;
  }
}

/**
 * Universal search across all modules
 * @param {string} query - Search query
 * @param {Object} options - Search options (filters, limit, offset, module)
 * @returns {Promise<Object>} - Search results
 */
export async function search(query, options = {}) {
  try {
    const db = getDb();
    const { filters = {}, limit = 20, offset = 0, module = null } = options;

    const results = {
      query,
      modules: {},
      totalHits: 0,
      processingTimeMs: Date.now()
    };

    // Determine which modules to search
    const modulesToSearch = module ? [module] : Object.keys(SEARCH_INDEXES);

    // Search each module
    for (const mod of modulesToSearch) {
      const indexConfig = SEARCH_INDEXES[mod];
      if (!indexConfig) continue;

      const searchResults = await searchModule(db, mod, indexConfig, query, filters, limit, offset);
      results.modules[mod] = searchResults;
      results.totalHits += searchResults.hits.length;
    }

    results.processingTimeMs = Date.now() - results.processingTimeMs;
    return results;
  } catch (error) {
    console.error('[Search] Error searching modules:', error);
    throw error;
  }
}

/**
 * Search within a single module using PostgreSQL full-text search
 * @param {Object} db - Database connection
 * @param {string} module - Module name
 * @param {Object} indexConfig - Index configuration
 * @param {string} query - Search query
 * @param {Object} filters - Search filters
 * @param {number} limit - Result limit
 * @param {number} offset - Result offset
 * @returns {Promise<Object>} - Search results
 */
async function searchModule(db, module, indexConfig, query, filters, limit, offset) {
  try {
    const { table, searchableFields, displayFields, weight } = indexConfig;

    // Escape single quotes in query
    const escapedQuery = query.replace(/'/g, "''");

    // Build WHERE clause for searchable fields
    const searchConditions = searchableFields
      .map((field) => `${field}::text ILIKE '%${escapedQuery}%'`)
      .join(' OR ');

    // Build additional filters
    let filterConditions = '1=1';
    if (filters.boatId) {
      filterConditions += ` AND boat_id = ${filters.boatId}`;
    }
    if (filters.organizationId) {
      filterConditions += ` AND organization_id = ${filters.organizationId}`;
    }
    if (filters.category && (module === 'inventory_items' || module === 'expenses')) {
      filterConditions += ` AND category = '${filters.category.replace(/'/g, "''")}'`;
    }

    // Build SELECT clause with display fields
    const selectClause = displayFields.join(', ');

    // Execute search query
    const sql = `
      SELECT ${selectClause}
      FROM ${table}
      WHERE (${searchConditions})
      AND (${filterConditions})
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;

    const hits = db.prepare(sql).all();

    // Get total count
    const countSql = `
      SELECT COUNT(*) as count
      FROM ${table}
      WHERE (${searchConditions})
      AND (${filterConditions})
    `;
    const countResult = db.prepare(countSql).get();
    const totalHits = countResult?.count || 0;

    return {
      module,
      hits: hits || [],
      totalHits,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
  } catch (error) {
    console.error(`[Search] Error searching module ${module}:`, error);
    return {
      module,
      hits: [],
      totalHits: 0,
      error: error.message
    };
  }
}

/**
 * Get all searchable modules
 * @returns {Object} - Module configurations
 */
export function getSearchableModules() {
  return SEARCH_INDEXES;
}

/**
 * Reindex all records for a module
 * @param {string} table - Table name
 * @returns {Promise<Object>} - Reindex result
 */
export async function reindexModule(table) {
  try {
    const db = getDb();
    const indexConfig = SEARCH_INDEXES[table];
    if (!indexConfig) {
      throw new Error(`Unknown search index: ${table}`);
    }

    // Fetch all records
    const records = db.prepare(`SELECT * FROM ${table}`).all();

    // Bulk index them
    const result = await bulkIndex(table, records);

    return {
      ...result,
      recordsReindexed: records.length
    };
  } catch (error) {
    console.error(`[Search] Error reindexing ${table}:`, error);
    throw error;
  }
}

/**
 * Reindex all modules
 * @returns {Promise<Object>} - Reindex result
 */
export async function reindexAll() {
  try {
    const results = {};
    const db = getDb();

    for (const [module, config] of Object.entries(SEARCH_INDEXES)) {
      const records = db.prepare(`SELECT * FROM ${config.table}`).all();
      await bulkIndex(module, records);
      results[module] = {
        recordsReindexed: records.length
      };
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      results
    };
  } catch (error) {
    console.error('[Search] Error reindexing all modules:', error);
    throw error;
  }
}
