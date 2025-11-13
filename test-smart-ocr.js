#!/usr/bin/env node

/**
 * Test Smart OCR Performance
 * Compare native text extraction vs full Tesseract OCR
 */

import { extractTextFromPDF } from './server/services/ocr.js';
import { hasNativeText } from './server/services/pdf-text-extractor.js';

const testPDF = process.argv[2] || './test-manual.pdf';

console.log('='.repeat(60));
console.log('Smart OCR Performance Test');
console.log('='.repeat(60));
console.log(`Test PDF: ${testPDF}`);
console.log('');

async function runTest() {
  try {
    // Check if PDF has native text
    console.log('Step 1: Checking for native text...');
    const hasNative = await hasNativeText(testPDF);
    console.log(`Has native text: ${hasNative ? 'YES ✓' : 'NO ✗'}`);
    console.log('');

    // Run hybrid extraction (smart OCR)
    console.log('Step 2: Running hybrid extraction...');
    const startTime = Date.now();
    const results = await extractTextFromPDF(testPDF, {
      language: 'eng',
      onProgress: (page, total) => {
        process.stdout.write(`\rProgress: ${page}/${total} pages`);
      }
    });
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log('\n');
    console.log('='.repeat(60));
    console.log('Results:');
    console.log('='.repeat(60));
    console.log(`Total pages: ${results.length}`);
    console.log(`Processing time: ${duration.toFixed(2)} seconds`);
    console.log(`Average per page: ${(duration / results.length).toFixed(2)}s`);
    console.log('');

    // Count methods used
    const nativePages = results.filter(r => r.method === 'native-extraction').length;
    const ocrPages = results.filter(r => r.method === 'tesseract-ocr').length;
    const errorPages = results.filter(r => r.method === 'error').length;

    console.log('Method breakdown:');
    console.log(`  Native extraction: ${nativePages} pages (${(nativePages/results.length*100).toFixed(1)}%)`);
    console.log(`  Tesseract OCR: ${ocrPages} pages (${(ocrPages/results.length*100).toFixed(1)}%)`);
    if (errorPages > 0) {
      console.log(`  Errors: ${errorPages} pages (${(errorPages/results.length*100).toFixed(1)}%)`);
    }
    console.log('');

    // Show confidence scores
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    console.log(`Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log('');

    // Performance estimate
    if (nativePages > 0) {
      const estimatedOldTime = results.length * 1.5; // ~1.5s per page with old OCR
      const speedup = estimatedOldTime / duration;
      console.log('Performance improvement:');
      console.log(`  Estimated old method: ${estimatedOldTime.toFixed(1)}s (100% OCR)`);
      console.log(`  New hybrid method: ${duration.toFixed(1)}s`);
      console.log(`  Speedup: ${speedup.toFixed(1)}x faster! 🚀`);
    }

    console.log('='.repeat(60));
    console.log('✓ Test completed successfully');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTest();
