/**
 * Test script for OCR pipeline
 *
 * Usage: node scripts/test-ocr.js
 */

import { checkPDFTools } from '../services/ocr.js';
import { getMeilisearchIndex } from '../config/meilisearch.js';
import { getDb } from '../config/db.js';

async function testOCRPipeline() {
  console.log('NaviDocs OCR Pipeline Test\n');

  // 1. Check PDF conversion tools
  console.log('1. Checking PDF conversion tools...');
  const tools = checkPDFTools();
  console.log('   - pdftoppm:', tools.pdftoppm ? '✓ Available' : '✗ Not found');
  console.log('   - ImageMagick:', tools.imagemagick ? '✓ Available' : '✗ Not found');

  if (!tools.pdftoppm && !tools.imagemagick) {
    console.log('\n⚠️  Warning: No PDF conversion tools found!');
    console.log('   Install with: apt-get install poppler-utils imagemagick\n');
  }

  // 2. Check Meilisearch connection
  console.log('\n2. Checking Meilisearch connection...');
  try {
    const index = await getMeilisearchIndex();
    const stats = await index.getStats();
    console.log(`   ✓ Connected to index: ${stats.numberOfDocuments} documents indexed`);
  } catch (error) {
    console.log(`   ✗ Meilisearch error: ${error.message}`);
    console.log('   Make sure Meilisearch is running on port 7700');
  }

  // 3. Check database connection
  console.log('\n3. Checking database connection...');
  try {
    const db = getDb();
    const result = db.prepare('SELECT COUNT(*) as count FROM documents').get();
    console.log(`   ✓ Database connected: ${result.count} documents found`);
  } catch (error) {
    console.log(`   ✗ Database error: ${error.message}`);
  }

  // 4. Check Redis connection (for BullMQ)
  console.log('\n4. Checking Redis connection...');
  try {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379
    });

    await redis.ping();
    console.log('   ✓ Redis connected');
    await redis.quit();
  } catch (error) {
    console.log(`   ✗ Redis error: ${error.message}`);
    console.log('   Start Redis with: docker run -d -p 6379:6379 redis:alpine');
  }

  // 5. Check Tesseract
  console.log('\n5. Checking Tesseract OCR...');
  try {
    const { execSync } = await import('child_process');
    const version = execSync('tesseract --version', { encoding: 'utf8' });
    console.log('   ✓ Tesseract installed');
    console.log('   ' + version.split('\n')[0]);
  } catch (error) {
    console.log('   ✗ Tesseract not found');
    console.log('   Install with: apt-get install tesseract-ocr');
  }

  console.log('\n✅ OCR Pipeline Test Complete\n');
}

// Run test
testOCRPipeline().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
