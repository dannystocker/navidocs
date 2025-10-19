/**
 * Search Route - POST /api/search
 * Generate Meilisearch tenant tokens for client-side search
 */

import express from 'express';
import { getMeilisearchClient, generateTenantToken } from '../config/meilisearch.js';
import { getDb } from '../db/db.js';

const router = express.Router();

const INDEX_NAME = process.env.MEILISEARCH_INDEX_NAME || 'navidocs-pages';

/**
 * POST /api/search/token
 * Generate Meilisearch tenant token for client-side search
 *
 * @body {number} [expiresIn] - Token expiration in seconds (default: 3600 = 1 hour)
 * @returns {Object} { token, expiresAt, indexName }
 */
router.post('/token', async (req, res) => {
  try {
    // TODO: Authentication middleware should provide req.user
    const userId = req.user?.id || 'test-user-id';
    const { expiresIn = 3600 } = req.body; // Default 1 hour

    // Validate expiresIn
    const maxExpiry = 86400; // 24 hours max
    const tokenExpiry = Math.min(parseInt(expiresIn) || 3600, maxExpiry);

    const db = getDb();

    // Get user's organizations
    const orgs = db.prepare(`
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = ?
    `).all(userId);

    const organizationIds = orgs.map(org => org.organization_id);

    if (organizationIds.length === 0) {
      return res.status(403).json({ error: 'No organizations found for user' });
    }

    const expiresAt = new Date(Date.now() + tokenExpiry * 1000);
    const searchUrl = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';

    // Preferred: tenant token
    try {
      const token = await generateTenantToken(userId, organizationIds, tokenExpiry);
      return res.json({ token, expiresAt: expiresAt.toISOString(), expiresIn: tokenExpiry, indexName: INDEX_NAME, searchUrl, mode: 'tenant' });
    } catch (err) {
      console.warn('Tenant token generation failed, falling back to search API key:', err?.message || err);
    }

    // Fallback: use default search API key
    const client = getMeilisearchClient();
    const keys = await client.getKeys();
    const searchKey = keys.results?.find(k => k.actions?.includes('search') && (k.indexes?.includes('*') || k.indexes?.includes(INDEX_NAME)));
    if (!searchKey?.key) throw new Error('No search API key available for fallback');
    return res.json({ token: searchKey.key, expiresAt: null, expiresIn: null, indexName: INDEX_NAME, searchUrl, mode: 'search-key' });

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate search token', message: error.message });
  }
});

/**
 * POST /api/search
 * Server-side search endpoint (optional, for server-rendered results)
 *
 * @body {string} q - Search query
 * @body {Object} [filters] - Filter options
 * @body {number} [limit] - Results limit (default: 20)
 * @body {number} [offset] - Results offset (default: 0)
 * @returns {Object} { hits, estimatedTotalHits, query, processingTimeMs }
 */
router.post('/', async (req, res) => {
  try {
    const { q, filters = {}, limit = 20, offset = 0 } = req.body;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // TODO: Authentication middleware should provide req.user
    const userId = req.user?.id || 'test-user-id';

    const db = getDb();

    // Get user's organizations
    const orgs = db.prepare(`
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = ?
    `).all(userId);

    const organizationIds = orgs.map(org => org.organization_id);

    if (organizationIds.length === 0) {
      return res.status(403).json({
        error: 'No organizations found for user'
      });
    }

    // Build Meilisearch filter
    const filterParts = [
      `userId = "${userId}" OR organizationId IN [${organizationIds.map(id => `"${id}"`).join(', ')}]`
    ];

    // Add additional filters
    if (filters.documentType) {
      filterParts.push(`documentType = "${filters.documentType}"`);
    }

    if (filters.entityId) {
      filterParts.push(`entityId = "${filters.entityId}"`);
    }

    if (filters.language) {
      filterParts.push(`language = "${filters.language}"`);
    }

    const filterString = filterParts.join(' AND ');

    // Use direct HTTP call with master key to avoid client cache issues
    const host = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';
    const apiKey = process.env.MEILISEARCH_MASTER_KEY;
    const resp = await fetch(`${host}/indexes/${INDEX_NAME}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({ q, filter: filterString, limit: parseInt(limit), offset: parseInt(offset), attributesToHighlight: ['text'], attributesToCrop: ['text'], cropLength: 200 })
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Meilisearch HTTP ${resp.status}: ${txt}`);
    }
    const searchResults = await resp.json();
    return res.json({
      hits: searchResults.hits || [],
      estimatedTotalHits: searchResults.estimatedTotalHits || 0,
      query: searchResults.query || q,
      processingTimeMs: searchResults.processingTimeMs || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

/**
 * GET /api/search/health
 * Check Meilisearch health status
 */
router.get('/health', async (req, res) => {
  try {
    const client = getMeilisearchClient();
    const health = await client.health();

    res.json({
      status: 'ok',
      meilisearch: health
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: 'Meilisearch unavailable',
      message: error.message
    });
  }
});

export default router;
