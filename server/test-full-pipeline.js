#!/usr/bin/env node
/**
 * Test full image extraction and OCR pipeline
 */

import { extractImagesFromPage } from './workers/image-extractor.js';
import { extractTextFromImage } from './services/ocr.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testFullPipeline() {
  console.log('=== Testing Full Image Extraction + OCR Pipeline ===\n');

  const testPdfPath = '/home/setup/navidocs/test/data/05-versions-space.pdf';
  const documentId = 'test_doc_' + Date.now();

  console.log(`Test PDF: ${testPdfPath}`);
  console.log(`Document ID: ${documentId}\n`);

  try {
    // Step 1: Extract images from page 1
    console.log('Step 1: Extracting images from page 1...');
    const images = await extractImagesFromPage(testPdfPath, 1, documentId);

    console.log(`✅ Extracted ${images.length} image(s)\n`);

    if (images.length === 0) {
      console.log('No images to process. Test complete.');
      return;
    }

    // Step 2: Run OCR on each extracted image
    console.log('Step 2: Running OCR on extracted images...\n');

    for (const image of images) {
      console.log(`Processing image: ${image.relativePath}`);
      console.log(`  Dimensions: ${image.width}x${image.height}`);

      try {
        const ocrResult = await extractTextFromImage(image.path, 'eng');

        console.log(`  OCR Confidence: ${ocrResult.confidence.toFixed(2)}`);
        console.log(`  Text Length: ${ocrResult.text.length} characters`);
        console.log(`  Text Preview (first 200 chars):`);
        console.log(`    ${ocrResult.text.substring(0, 200).replace(/\n/g, ' ')}...`);
        console.log();
      } catch (ocrError) {
        console.error(`  ❌ OCR Error: ${ocrError.message}\n`);
      }
    }

    console.log('=== Full Pipeline Test Complete ===');
  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

testFullPipeline();
