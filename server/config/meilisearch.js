/**
 * Meilisearch client configuration
 */

import { MeiliSearch } from 'meilisearch';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';
const MEILISEARCH_MASTER_KEY = process.env.MEILISEARCH_MASTER_KEY || 'masterKey';
const INDEX_NAME = process.env.MEILISEARCH_INDEX_NAME || 'navidocs-pages';

let client = null;
let index = null;

export function getMeilisearchClient() {
  if (!client) {
    client = new MeiliSearch({
      host: MEILISEARCH_HOST,
      apiKey: MEILISEARCH_MASTER_KEY
    });
  }
  return client;
}

export async function getMeilisearchIndex() {
  if (!index) {
    const client = getMeilisearchClient();

    try {
      index = await client.getIndex(INDEX_NAME);
    } catch (error) {
      // Index doesn't exist, create it
      console.log('Creating Meilisearch index:', INDEX_NAME);
      await client.createIndex(INDEX_NAME, { primaryKey: 'id' });
      index = await client.getIndex(INDEX_NAME);

      // Configure index settings
      await configureIndex(index);
    }
  }
  return index;
}

async function configureIndex(index) {
  // Load config from docs
  const configPath = join(__dirname, '../../docs/architecture/meilisearch-config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));

  await index.updateSettings({
    searchableAttributes: config.settings.searchableAttributes,
    filterableAttributes: config.settings.filterableAttributes,
    sortableAttributes: config.settings.sortableAttributes,
    displayedAttributes: config.settings.displayedAttributes,
    synonyms: config.settings.synonyms,
    stopWords: config.settings.stopWords,
    rankingRules: config.settings.rankingRules,
    typoTolerance: config.settings.typoTolerance,
    faceting: config.settings.faceting,
    pagination: config.settings.pagination,
    separatorTokens: config.settings.separatorTokens,
    nonSeparatorTokens: config.settings.nonSeparatorTokens
  });

  console.log('Meilisearch index configured');
}

export function generateTenantToken(userId, organizationIds, expiresIn = 3600) {
  const client = getMeilisearchClient();

  const searchRules = {
    [INDEX_NAME]: {
      filter: `userId = ${userId} OR organizationId IN [${organizationIds.join(', ')}]`
    }
  };

  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  return client.generateTenantToken(searchRules, {
    apiKey: MEILISEARCH_MASTER_KEY,
    expiresAt
  });
}
