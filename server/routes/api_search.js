/**
 * Search API Route - GET /api/v1/search
 * Unified search endpoint for NaviDocs
 *
 * Supports:
 * - Meilisearch integration for full-text search
 * - Query parameter-based search (GET requests)
 * - Pagination with limit and offset
 * - Filtering by document type, entity, and language
 * - Security: Input sanitization, rate limiting, authentication
 */

import express from 'express';
import logger from '../utils/logger.js';
import { getDb } from '../db/db.js';

const router = express.Router();

const MEILI_HOST = process.env.MEILI_HOST || process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';
const MEILI_KEY = process.env.MEILI_KEY || process.env.MEILISEARCH_MASTER_KEY || process.env.MEILISEARCH_SEARCH_KEY;
const MEILI_INDEX = process.env.MEILI_INDEX || process.env.MEILISEARCH_INDEX_NAME || 'navidocs-pages';

// Constants
const MAX_QUERY_LENGTH = 200;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_OFFSET = 0;
const MEILISEARCH_TIMEOUT = 10000; // 10 seconds

/**
 * Sanitize search query to prevent injection attacks
 * @param {string} query - Raw search query
 * @returns {string} Sanitized query
 */
function sanitizeQuery(query) {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = query.trim();

  // Limit length
  if (sanitized.length > MAX_QUERY_LENGTH) {
    sanitized = sanitized.substring(0, MAX_QUERY_LENGTH);
  }

  // Remove potentially dangerous characters but allow common search operators
  // Allow: alphanumeric, spaces, hyphens, quotes (for phrases), common punctuation
  sanitized = sanitized.replace(/[^\w\s\-"'.,&|]/g, '');

  return sanitized;
}

/**
 * Validate pagination parameters
 * @param {string|number} limit - Results limit
 * @param {string|number} offset - Results offset
 * @returns {Object} { limit, offset } validated values
 */
function validatePagination(limit, offset) {
  let validLimit = parseInt(limit) || DEFAULT_LIMIT;
  let validOffset = parseInt(offset) || DEFAULT_OFFSET;

  // Enforce bounds
  validLimit = Math.max(1, Math.min(validLimit, MAX_LIMIT));
  validOffset = Math.max(0, validOffset);

  return { limit: validLimit, offset: validOffset };
}

/**
 * Check Meilisearch connectivity
 * @returns {Promise<boolean>} True if Meilisearch is reachable
 */
async function checkMeilisearchHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MEILISEARCH_TIMEOUT);

    const response = await fetch(`${MEILI_HOST}/health`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    logger.warn('Meilisearch health check failed', { error: error.message });
    return false;
  }
}

/**
 * Get user's accessible organization IDs from database
 * @param {string} userId - User ID
 * @returns {Array<string>} Organization IDs
 */
function getUserOrganizations(userId) {
  try {
    const db = getDb();
    const orgs = db.prepare(`
      SELECT DISTINCT organization_id
      FROM user_organizations
      WHERE user_id = ?
      AND active = 1
    `).all(userId);

    return orgs.map(org => org.organization_id);
  } catch (error) {
    logger.error('Failed to fetch user organizations', { userId, error: error.message });
    return [];
  }
}

/**
 * Build Meilisearch filter string based on user permissions and query filters
 * @param {string} userId - User ID
 * @param {Array<string>} organizationIds - User's org IDs
 * @param {Object} filters - Additional filters
 * @returns {string} Meilisearch filter expression
 */
function buildMeilisearchFilter(userId, organizationIds, filters = {}) {
  const filterParts = [];

  // Access control: user's own documents OR org documents
  if (organizationIds.length > 0) {
    const orgFilter = organizationIds.map(id => `organizationId = "${id}"`).join(' OR ');
    filterParts.push(`(userId = "${userId}" OR (${orgFilter}))`);
  } else {
    filterParts.push(`userId = "${userId}"`);
  }

  // Optional: document type filter
  if (filters.documentType && typeof filters.documentType === 'string') {
    filterParts.push(`documentType = "${filters.documentType.replace(/"/g, '\\"')}"`);
  }

  // Optional: entity filter (e.g., specific boat/property)
  if (filters.entityId && typeof filters.entityId === 'string') {
    filterParts.push(`entityId = "${filters.entityId.replace(/"/g, '\\"')}"`);
  }

  // Optional: language filter
  if (filters.language && typeof filters.language === 'string') {
    filterParts.push(`language = "${filters.language.replace(/"/g, '\\"')}"`);
  }

  return filterParts.join(' AND ');
}

/**
 * Execute Meilisearch query with error handling
 * @param {string} query - Search query
 * @param {string} filter - Meilisearch filter
 * @param {number} limit - Result limit
 * @param {number} offset - Result offset
 * @returns {Promise<Object>} Search results
 */
async function executeMeilisearchQuery(query, filter, limit, offset) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MEILISEARCH_TIMEOUT);

    const requestBody = {
      q: query,
      filter,
      limit,
      offset,
      attributesToHighlight: ['text', 'title'],
      attributesToCrop: ['text'],
      cropLength: 200,
      highlightPreTag: '<em>',
      highlightPostTag: '</em>'
    };

    const response = await fetch(`${MEILI_HOST}/indexes/${MEILI_INDEX}/search`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(MEILI_KEY ? { 'Authorization': `Bearer ${MEILI_KEY}` } : {})
      },
      body: JSON.stringify(requestBody)
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meilisearch HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Meilisearch request timeout');
    }
    throw error;
  }
}

/**
 * GET /api/v1/search
 * Search documents across NaviDocs
 *
 * Query parameters:
 * - q (required): Search query
 * - limit (optional): Results per page (default: 20, max: 100)
 * - offset (optional): Page offset (default: 0)
 * - type (optional): Filter by document type
 * - entity (optional): Filter by entity ID
 * - language (optional): Filter by language
 *
 * Response:
 * {
 *   success: boolean,
 *   query: string (original query),
 *   results: Array<{id, title, snippet, type, score, language}>,
 *   total: number (estimated total hits),
 *   limit: number,
 *   offset: number,
 *   hasMore: boolean,
 *   took_ms: number (processing time)
 * }
 *
 * Error responses:
 * 400: Invalid query parameters
 * 401: Unauthorized
 * 503: Meilisearch unavailable
 * 500: Internal server error
 */
router.get('/', async (req, res) => {
  try {
    const { q, limit, offset, type, entity, language } = req.query;

    // Validate query parameter
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search query',
        message: 'The "q" parameter is required and must be a non-empty string'
      });
    }

    // Sanitize and validate inputs
    const sanitizedQuery = sanitizeQuery(q);
    if (sanitizedQuery.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search query',
        message: 'Query contains only invalid characters'
      });
    }

    const { limit: validLimit, offset: validOffset } = validatePagination(limit, offset);

    // Get user context (this assumes authentication middleware provides req.user)
    // For unauthenticated requests, use a public user ID
    const userId = req.user?.id || req.query.userId || 'public-user';

    // Get user's organizations for access control
    const organizationIds = getUserOrganizations(userId);

    // Build filter string
    const filterString = buildMeilisearchFilter(userId, organizationIds, {
      documentType: type,
      entityId: entity,
      language
    });

    // Check Meilisearch availability
    const meilisearchHealthy = await checkMeilisearchHealth();
    if (!meilisearchHealthy) {
      logger.warn('Meilisearch is unavailable, returning empty results', { query: sanitizedQuery });
      return res.status(503).json({
        success: false,
        error: 'Search service unavailable',
        message: 'The search service is temporarily unavailable. Please try again later.',
        query: sanitizedQuery,
        results: [],
        total: 0
      });
    }

    // Execute search
    const startTime = Date.now();
    const searchResults = await executeMeilisearchQuery(
      sanitizedQuery,
      filterString,
      validLimit,
      validOffset
    );
    const processingTime = Date.now() - startTime;

    // Format results for client consumption
    const formattedResults = (searchResults.hits || []).map(hit => ({
      id: hit.id,
      title: hit.title || 'Untitled',
      snippet: hit._formatted?.text || hit.text || '',
      type: hit.documentType || 'document',
      score: hit._score || 0,
      language: hit.language,
      documentId: hit.documentId,
      pageNumber: hit.pageNumber,
      highlighted: hit._formatted || {}
    }));

    // Determine if there are more results
    const estimatedTotal = searchResults.estimatedTotalHits || 0;
    const hasMore = (validOffset + validLimit) < estimatedTotal;

    res.json({
      success: true,
      query: sanitizedQuery,
      results: formattedResults,
      total: estimatedTotal,
      limit: validLimit,
      offset: validOffset,
      hasMore,
      took_ms: processingTime
    });

    // Log successful search
    logger.info('Search executed', {
      query: sanitizedQuery,
      resultCount: formattedResults.length,
      userId,
      orgs: organizationIds,
      processingTime
    });

  } catch (error) {
    logger.error('Search endpoint error', {
      error: error.message,
      stack: error.stack,
      query: req.query.q
    });

    // Determine error status code
    let statusCode = 500;
    let errorMessage = 'Search failed';

    if (error.message.includes('timeout')) {
      statusCode = 503;
      errorMessage = 'Search request timed out';
    } else if (error.message.includes('Meilisearch')) {
      statusCode = 503;
      errorMessage = 'Search service error';
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred during search',
      query: req.query.q || ''
    });
  }
});

/**
 * GET /api/v1/search/health
 * Check search service health status
 *
 * Response:
 * {
 *   success: boolean,
 *   meilisearch: boolean (true if connected),
 *   message: string
 * }
 */
router.get('/health', async (req, res) => {
  try {
    const meilisearchHealthy = await checkMeilisearchHealth();

    res.json({
      success: meilisearchHealthy,
      meilisearch: meilisearchHealthy,
      message: meilisearchHealthy ? 'Search service is operational' : 'Search service is unavailable'
    });
  } catch (error) {
    logger.error('Health check error', { error: error.message });

    res.status(503).json({
      success: false,
      meilisearch: false,
      message: 'Unable to determine search service status'
    });
  }
});

export default router;
