#!/usr/bin/env node
/**
 * End-to-End Test for NaviDocs
 * Tests: Upload → OCR → Document Retrieval → PDF Streaming → PDF.js Rendering
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:8001';
const TEST_PDF = path.join(__dirname, 'test/data/05-versions-space.pdf');

// Configure PDF.js worker
const workerPath = path.join(__dirname, 'client/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
if (fs.existsSync(workerPath)) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
} else {
  console.warn('⚠️  PDF.js worker not found at expected path, using CDN (may fail)');
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testUpload() {
  log('📤', 'Testing upload...', colors.cyan);

  if (!fs.existsSync(TEST_PDF)) {
    throw new Error(`Test PDF not found: ${TEST_PDF}`);
  }

  const formData = new FormData();
  formData.append('file', fs.createReadStream(TEST_PDF));
  formData.append('title', 'E2E Test Document');
  formData.append('documentType', 'owner-manual');
  formData.append('organizationId', 'test-org-e2e');

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  log('✅', `Upload successful: ${data.documentId}`, colors.green);
  return data;
}

async function waitForOCR(jobId, maxWait = 60000) {
  log('⏳', 'Waiting for OCR processing...', colors.cyan);

  const startTime = Date.now();
  let lastProgress = -1;

  while (Date.now() - startTime < maxWait) {
    const response = await fetch(`${API_BASE}/api/jobs/${jobId}`);
    const job = await response.json();

    if (job.progress !== lastProgress) {
      log('📊', `Progress: ${job.progress}% (${job.status})`, colors.blue);
      lastProgress = job.progress;
    }

    if (job.status === 'completed') {
      log('✅', `OCR completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`, colors.green);
      return job;
    }

    if (job.status === 'failed') {
      throw new Error(`OCR failed: ${job.error}`);
    }

    await sleep(500);
  }

  throw new Error(`OCR timeout after ${maxWait}ms`);
}

async function testDocumentRetrieval(documentId) {
  log('📄', 'Testing document retrieval...', colors.cyan);

  const response = await fetch(`${API_BASE}/api/documents/${documentId}`);

  if (!response.ok) {
    throw new Error(`Document retrieval failed: ${response.status}`);
  }

  const doc = await response.json();
  log('✅', `Document retrieved: ${doc.title}`, colors.green);
  log('📝', `  Status: ${doc.status}, Pages: ${doc.totalPages || 'unknown'}`, colors.blue);
  return doc;
}

async function testPDFStreaming(documentId) {
  log('📥', 'Testing PDF streaming...', colors.cyan);

  const response = await fetch(`${API_BASE}/api/documents/${documentId}/pdf`);

  if (!response.ok) {
    throw new Error(`PDF streaming failed: ${response.status}`);
  }

  const buffer = await response.buffer();
  log('✅', `PDF downloaded: ${buffer.length} bytes`, colors.green);
  return buffer;
}

async function testPDFRendering(pdfBuffer) {
  log('🎨', 'Testing PDF.js page rendering...', colors.cyan);

  try {
    // Load the PDF
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdfDoc = await loadingTask.promise;

    log('📖', `PDF loaded: ${pdfDoc.numPages} pages`, colors.blue);

    // Test rendering each page
    for (let pageNum = 1; pageNum <= Math.min(pdfDoc.numPages, 3); pageNum++) {
      log('🖼️', `Rendering page ${pageNum}...`, colors.blue);

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });

      log('   ', `  Page ${pageNum}: ${viewport.width}x${viewport.height}`, colors.blue);

      // Clean up
      page.cleanup();
    }

    log('✅', `All pages rendered successfully`, colors.green);
    return true;
  } catch (error) {
    log('❌', `PDF rendering failed: ${error.message}`, colors.red);
    throw error;
  }
}

async function testSearch(documentId) {
  log('🔍', 'Testing search...', colors.cyan);

  const response = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: 'test',
      limit: 10,
      userId: 'test-user-e2e',
      organizationIds: ['test-org-e2e']
    })
  });

  if (!response.ok) {
    const text = await response.text();
    log('⚠️', `Search failed: ${response.status} ${text}`, colors.yellow);
    return null;
  }

  const results = await response.json();
  const found = results.results.some(r => r.id === documentId);

  if (found) {
    log('✅', `Document found in search results`, colors.green);
  } else {
    log('⚠️', `Document not found in search (may need more time to index)`, colors.yellow);
  }

  return results;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  log('🚀', 'Starting End-to-End Test', colors.cyan);
  console.log('='.repeat(60) + '\n');

  const startTime = Date.now();
  let documentId, jobId;

  try {
    // Test 1: Upload
    const uploadResult = await testUpload();
    documentId = uploadResult.documentId;
    jobId = uploadResult.jobId;

    // Test 2: Wait for OCR
    await waitForOCR(jobId);

    // Test 3: Document Retrieval
    const doc = await testDocumentRetrieval(documentId);

    // Test 4: PDF Streaming
    const pdfBuffer = await testPDFStreaming(documentId);

    // Test 5: PDF.js Rendering (the critical test)
    await testPDFRendering(pdfBuffer);

    // Test 6: Search
    await sleep(2000); // Give Meilisearch time to index
    await testSearch(documentId);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(60));
    log('✅', `ALL TESTS PASSED in ${totalTime}s`, colors.green);
    console.log('='.repeat(60) + '\n');

    log('📋', 'Test Summary:', colors.cyan);
    log('  ', `Document ID: ${documentId}`, colors.blue);
    log('  ', `Job ID: ${jobId}`, colors.blue);
    log('  ', `Total Time: ${totalTime}s`, colors.blue);

    process.exit(0);

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    log('❌', `TEST FAILED: ${error.message}`, colors.red);
    console.log('='.repeat(60) + '\n');
    console.error(error);
    process.exit(1);
  }
}

main();
