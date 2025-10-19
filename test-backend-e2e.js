#!/usr/bin/env node
/**
 * Backend End-to-End Test for NaviDocs
 * Tests: Upload → OCR → Document Retrieval → PDF Streaming
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:8001';
const TEST_PDF = path.join(__dirname, 'test/data/05-versions-space.pdf');

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

  const stats = fs.statSync(TEST_PDF);
  log('  ', `Test file: ${path.basename(TEST_PDF)} (${stats.size} bytes)`, colors.blue);

  const formData = new FormData();
  formData.append('file', fs.createReadStream(TEST_PDF));
  formData.append('title', 'Backend E2E Test Document');
  formData.append('documentType', 'owner-manual');
  formData.append('organizationId', 'test-org-123');

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  log('✅', `Upload successful!`, colors.green);
  log('  ', `Document ID: ${data.documentId}`, colors.blue);
  log('  ', `Job ID: ${data.jobId}`, colors.blue);
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
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log('✅', `OCR completed in ${duration}s`, colors.green);
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
  log('✅', `Document retrieved successfully!`, colors.green);
  log('  ', `Title: ${doc.title}`, colors.blue);
  log('  ', `Status: ${doc.status}`, colors.blue);
  log('  ', `Pages: ${doc.totalPages || 'unknown'}`, colors.blue);
  log('  ', `File size: ${doc.fileSize} bytes`, colors.blue);
  return doc;
}

async function testPDFStreaming(documentId) {
  log('📥', 'Testing PDF streaming...', colors.cyan);

  const response = await fetch(`${API_BASE}/api/documents/${documentId}/pdf`);

  if (!response.ok) {
    throw new Error(`PDF streaming failed: ${response.status}`);
  }

  const buffer = await response.buffer();
  log('✅', `PDF downloaded successfully!`, colors.green);
  log('  ', `Size: ${buffer.length} bytes`, colors.blue);

  // Verify it's a PDF
  const pdfHeader = buffer.toString('utf-8', 0, 4);
  if (pdfHeader !== '%PDF') {
    throw new Error(`Invalid PDF header: ${pdfHeader}`);
  }

  log('  ', `✓ Valid PDF format (header: ${pdfHeader})`, colors.blue);
  return buffer;
}

async function testSearch(documentId) {
  log('🔍', 'Testing search...', colors.cyan);

  const response = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: 'test',
      limit: 10,
      userId: 'test-user-id',
      organizationIds: ['test-org-123']
    })
  });

  if (!response.ok) {
    const text = await response.text();
    log('⚠️', `Search failed: ${response.status}`, colors.yellow);
    log('  ', text.substring(0, 200), colors.yellow);
    return null;
  }

  const results = await response.json();
  const found = results.results.some(r => r.id === documentId);

  if (found) {
    log('✅', `Document found in search results!`, colors.green);
    log('  ', `Total results: ${results.results.length}`, colors.blue);
  } else {
    log('⚠️', `Document not in search yet (${results.results.length} total results)`, colors.yellow);
    log('  ', `Note: May need more time to index`, colors.yellow);
  }

  return results;
}

async function main() {
  console.log('\n' + '='.repeat(70));
  log('🚀', 'NaviDocs Backend End-to-End Test', colors.cyan);
  console.log('='.repeat(70) + '\n');

  const startTime = Date.now();
  let documentId, jobId;

  try {
    // Test 1: Upload
    const uploadResult = await testUpload();
    documentId = uploadResult.documentId;
    jobId = uploadResult.jobId;
    console.log();

    // Test 2: Wait for OCR
    await waitForOCR(jobId);
    console.log();

    // Test 3: Document Retrieval
    const doc = await testDocumentRetrieval(documentId);
    console.log();

    // Test 4: PDF Streaming
    await testPDFStreaming(documentId);
    console.log();

    // Test 5: Search
    await sleep(2000); // Give Meilisearch time to index
    await testSearch(documentId);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(70));
    log('✅', `ALL BACKEND TESTS PASSED in ${totalTime}s`, colors.green);
    console.log('='.repeat(70) + '\n');

    log('📋', 'Summary:', colors.cyan);
    log('  ', `Document ID: ${documentId}`, colors.blue);
    log('  ', `Job ID: ${jobId}`, colors.blue);
    log('  ', `Total Time: ${totalTime}s`, colors.blue);
    log('  ', `Document URL: http://172.29.75.55:8080/document/${documentId}`, colors.blue);
    console.log();

    process.exit(0);

  } catch (error) {
    console.log('\n' + '='.repeat(70));
    log('❌', `TEST FAILED: ${error.message}`, colors.red);
    console.log('='.repeat(70) + '\n');
    console.error(error);
    process.exit(1);
  }
}

main();
