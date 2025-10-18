/**
 * Search Service - Meilisearch indexing and search operations
 *
 * Features:
 * - Index document pages in Meilisearch
 * - Build proper document structure from schema
 * - Handle metadata enrichment
 * - Support multi-vertical indexing (boat, marina, property)
 */

import { getMeilisearchIndex } from '../config/meilisearch.js';
import { getDb } from '../config/db.js';

/**
 * Index a document page in Meilisearch
 *
 * @param {Object} pageData - Page data to index
 * @param {string} pageData.pageId - Document page ID
 * @param {string} pageData.documentId - Document ID
 * @param {number} pageData.pageNumber - Page number (1-based)
 * @param {string} pageData.text - OCR extracted text
 * @param {number} pageData.confidence - OCR confidence (0-1)
 * @returns {Promise<Object>} - Indexing result
 */
export async function indexDocumentPage(pageData) {
  try {
    const db = getDb();

    // Fetch full document and entity metadata
    const document = db.prepare(`
      SELECT
        d.*,
        e.name as entity_name,
        e.entity_type,
        e.make as boat_make,
        e.model as boat_model,
        e.year as boat_year,
        e.vessel_type,
        e.property_type,
        se.name as sub_entity_name,
        c.name as component_name,
        c.manufacturer,
        c.model_number,
        c.serial_number,
        o.name as organization_name
      FROM documents d
      LEFT JOIN entities e ON d.entity_id = e.id
      LEFT JOIN sub_entities se ON d.sub_entity_id = se.id
      LEFT JOIN components c ON d.component_id = c.id
      LEFT JOIN organizations o ON d.organization_id = o.id
      WHERE d.id = ?
    `).get(pageData.documentId);

    if (!document) {
      throw new Error(`Document not found: ${pageData.documentId}`);
    }

    // Parse metadata JSON fields
    const documentMetadata = document.metadata ? JSON.parse(document.metadata) : {};

    // Build Meilisearch document according to schema
    const searchDocument = buildSearchDocument(pageData, document, documentMetadata);

    // Get Meilisearch index
    const index = await getMeilisearchIndex();

    // Add document to index
    const result = await index.addDocuments([searchDocument]);

    console.log(`Indexed page ${pageData.pageNumber} of document ${pageData.documentId}`);

    // Update document_pages table with search metadata
    db.prepare(`
      UPDATE document_pages
      SET search_indexed_at = ?,
          meilisearch_id = ?
      WHERE id = ?
    `).run(
      Math.floor(Date.now() / 1000),
      searchDocument.id,
      pageData.pageId
    );

    return {
      success: true,
      documentId: searchDocument.id,
      taskUid: result.taskUid
    };
  } catch (error) {
    console.error('Error indexing document page:', error);
    throw new Error(`Failed to index page: ${error.message}`);
  }
}

/**
 * Build Meilisearch document structure from page data and metadata
 *
 * Follows schema defined in docs/architecture/meilisearch-config.json
 *
 * @param {Object} pageData - Page OCR data
 * @param {Object} document - Document database record
 * @param {Object} metadata - Parsed document metadata
 * @returns {Object} - Meilisearch document
 */
function buildSearchDocument(pageData, document, metadata) {
  const now = Math.floor(Date.now() / 1000);

  // Determine vertical based on entity type
  const vertical = getVerticalFromEntityType(document.entity_type);

  // Base document structure
  const searchDoc = {
    // Required fields
    id: `page_${document.id}_p${pageData.pageNumber}`,
    vertical: vertical,

    organizationId: document.organization_id,
    organizationName: document.organization_name || 'Unknown Organization',

    entityId: document.entity_id || 'unknown',
    entityName: document.entity_name || 'Unknown Entity',
    entityType: document.entity_type || 'unknown',

    docId: document.id,
    userId: document.uploaded_by,

    documentType: document.document_type || 'manual',
    title: metadata.title || document.title || `Page ${pageData.pageNumber}`,
    pageNumber: pageData.pageNumber,
    text: pageData.text,

    language: document.language || 'en',
    ocrConfidence: pageData.confidence,

    createdAt: document.created_at,
    updatedAt: now
  };

  // Optional: Sub-entity (system, dock, unit)
  if (document.sub_entity_id) {
    searchDoc.subEntityId = document.sub_entity_id;
    searchDoc.subEntityName = document.sub_entity_name;
  }

  // Optional: Component
  if (document.component_id) {
    searchDoc.componentId = document.component_id;
    searchDoc.componentName = document.component_name;
    searchDoc.manufacturer = document.manufacturer;
    searchDoc.modelNumber = document.model_number;
    searchDoc.serialNumber = document.serial_number;
  }

  // Optional: Categorization
  if (metadata.systems) {
    searchDoc.systems = Array.isArray(metadata.systems) ? metadata.systems : [metadata.systems];
  }
  if (metadata.categories) {
    searchDoc.categories = Array.isArray(metadata.categories) ? metadata.categories : [metadata.categories];
  }
  if (metadata.tags) {
    searchDoc.tags = Array.isArray(metadata.tags) ? metadata.tags : [metadata.tags];
  }

  // Boating vertical fields
  if (vertical === 'boating') {
    searchDoc.boatName = document.entity_name;
    if (document.boat_make) searchDoc.boatMake = document.boat_make;
    if (document.boat_model) searchDoc.boatModel = document.boat_model;
    if (document.boat_year) searchDoc.boatYear = document.boat_year;
    if (document.vessel_type) searchDoc.vesselType = document.vessel_type;
  }

  // Property/Marina vertical fields
  if (vertical === 'property' || vertical === 'marina') {
    if (document.property_type) searchDoc.propertyType = document.property_type;
    if (document.facility_type) searchDoc.facilityType = document.facility_type;
  }

  // Optional: Priority and offline caching
  if (metadata.priority) {
    searchDoc.priority = metadata.priority;
  }
  if (metadata.offlineCache !== undefined) {
    searchDoc.offlineCache = metadata.offlineCache;
  }

  // Optional: Compliance/Inspection data
  if (metadata.complianceType) searchDoc.complianceType = metadata.complianceType;
  if (metadata.inspectionDate) searchDoc.inspectionDate = metadata.inspectionDate;
  if (metadata.nextDue) searchDoc.nextDue = metadata.nextDue;
  if (metadata.status) searchDoc.status = metadata.status;

  // Optional: Location data
  if (metadata.location) {
    searchDoc.location = metadata.location;
  }

  return searchDoc;
}

/**
 * Determine vertical from entity type
 *
 * @param {string} entityType - Entity type from database
 * @returns {string} - Vertical: 'boating', 'marina', 'property'
 */
function getVerticalFromEntityType(entityType) {
  if (!entityType) return 'boating'; // Default

  const type = entityType.toLowerCase();

  if (type === 'boat' || type === 'vessel') {
    return 'boating';
  }

  if (type === 'marina' || type === 'yacht-club') {
    return 'marina';
  }

  if (type === 'condo' || type === 'property' || type === 'building') {
    return 'property';
  }

  return 'boating'; // Default fallback
}

/**
 * Bulk index multiple document pages
 *
 * @param {Array<Object>} pages - Array of page data objects
 * @returns {Promise<Object>} - Bulk indexing result
 */
export async function bulkIndexPages(pages) {
  try {
    const searchDocuments = [];

    const db = getDb();

    for (const pageData of pages) {
      // Fetch document metadata for each page
      const document = db.prepare(`
        SELECT
          d.*,
          e.name as entity_name,
          e.entity_type,
          e.make as boat_make,
          e.model as boat_model,
          e.year as boat_year,
          e.vessel_type,
          e.property_type,
          se.name as sub_entity_name,
          c.name as component_name,
          c.manufacturer,
          c.model_number,
          c.serial_number,
          o.name as organization_name
        FROM documents d
        LEFT JOIN entities e ON d.entity_id = e.id
        LEFT JOIN sub_entities se ON d.sub_entity_id = se.id
        LEFT JOIN components c ON d.component_id = c.id
        LEFT JOIN organizations o ON d.organization_id = o.id
        WHERE d.id = ?
      `).get(pageData.documentId);

      if (document) {
        const documentMetadata = document.metadata ? JSON.parse(document.metadata) : {};
        const searchDoc = buildSearchDocument(pageData, document, documentMetadata);
        searchDocuments.push(searchDoc);
      }
    }

    // Bulk add to Meilisearch
    const index = await getMeilisearchIndex();
    const result = await index.addDocuments(searchDocuments);

    console.log(`Bulk indexed ${searchDocuments.length} pages`);

    return {
      success: true,
      count: searchDocuments.length,
      taskUid: result.taskUid
    };
  } catch (error) {
    console.error('Error bulk indexing pages:', error);
    throw new Error(`Bulk indexing failed: ${error.message}`);
  }
}

/**
 * Remove a document page from search index
 *
 * @param {string} documentId - Document ID
 * @param {number} pageNumber - Page number
 * @returns {Promise<Object>} - Deletion result
 */
export async function removePageFromIndex(documentId, pageNumber) {
  try {
    const meilisearchId = `page_${documentId}_p${pageNumber}`;

    const index = await getMeilisearchIndex();
    const result = await index.deleteDocument(meilisearchId);

    console.log(`Removed page ${pageNumber} of document ${documentId} from index`);

    return {
      success: true,
      taskUid: result.taskUid
    };
  } catch (error) {
    console.error('Error removing page from index:', error);
    throw new Error(`Failed to remove page: ${error.message}`);
  }
}

/**
 * Remove all pages of a document from search index
 *
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} - Deletion result
 */
export async function removeDocumentFromIndex(documentId) {
  try {
    const index = await getMeilisearchIndex();

    // Delete all pages matching the document ID
    const result = await index.deleteDocuments({
      filter: `docId = "${documentId}"`
    });

    console.log(`Removed all pages of document ${documentId} from index`);

    return {
      success: true,
      taskUid: result.taskUid
    };
  } catch (error) {
    console.error('Error removing document from index:', error);
    throw new Error(`Failed to remove document: ${error.message}`);
  }
}

/**
 * Search for pages
 *
 * @param {string} query - Search query
 * @param {Object} options - Search options (filters, limit, offset)
 * @returns {Promise<Object>} - Search results
 */
export async function searchPages(query, options = {}) {
  try {
    const index = await getMeilisearchIndex();

    const searchOptions = {
      limit: options.limit || 20,
      offset: options.offset || 0
    };

    // Add filters if provided
    if (options.filter) {
      searchOptions.filter = options.filter;
    }

    // Add sort if provided
    if (options.sort) {
      searchOptions.sort = options.sort;
    }

    const results = await index.search(query, searchOptions);

    return results;
  } catch (error) {
    console.error('Error searching pages:', error);
    throw new Error(`Search failed: ${error.message}`);
  }
}
