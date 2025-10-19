#!/usr/bin/env node
/**
 * Test image extraction functionality
 */

import { extractImagesFromPage } from './workers/image-extractor.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testImageExtraction() {
  console.log('=== Testing Image Extraction ===\n');

  const testPdfPath = '/home/setup/navidocs/test/data/05-versions-space.pdf';
  const documentId = 'test_doc_' + Date.now();

  console.log(`Test PDF: ${testPdfPath}`);
  console.log(`Document ID: ${documentId}\n`);

  try {
    // Test extracting from page 1
    console.log('Extracting images from page 1...');
    const images = await extractImagesFromPage(testPdfPath, 1, documentId);

    console.log(`\n✅ Extraction complete!`);
    console.log(`Found ${images.length} image(s)\n`);

    if (images.length > 0) {
      console.log('Image details:');
      images.forEach((img, idx) => {
        console.log(`\n  Image ${idx + 1}:`);
        console.log(`    ID: ${img.id}`);
        console.log(`    Path: ${img.path}`);
        console.log(`    Relative Path: ${img.relativePath}`);
        console.log(`    Dimensions: ${img.width}x${img.height}`);
        console.log(`    Format: ${img.format}`);
        console.log(`    Position:`, JSON.stringify(img.position));
      });
    }

    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

testImageExtraction();
