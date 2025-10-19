#!/usr/bin/env node
/**
 * End-to-End Test for Complete Image Extraction System
 * Tests: Upload → OCR → Image Extraction → API → Frontend Integration
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:8001';
const DB_PATH = path.join(__dirname, 'db/navidocs.db');

console.log('\n🧪 Starting Complete System E2E Test\n');
console.log('=' .repeat(60));

// Test configuration
const TEST_ORG_ID = 'test-org-123';
const TEST_PDF = path.join(__dirname, '../test/data/05-versions-space.pdf');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHealthCheck() {
  console.log('\n1️⃣  Testing Backend Health...');

  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();

    if (response.ok && data.status === 'ok') {
      console.log('   ✅ Backend is healthy');
      console.log(`   📊 Uptime: ${(data.uptime / 1000).toFixed(2)}s`);
      return true;
    } else {
      console.log('   ❌ Backend health check failed');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Backend not reachable: ${error.message}`);
    return false;
  }
}

async function testUpload() {
  console.log('\n2️⃣  Testing PDF Upload...');

  // Check if test PDF exists
  if (!fs.existsSync(TEST_PDF)) {
    console.log(`   ⚠️  Sample PDF not found at ${TEST_PDF}`);
    console.log('   📝 Creating a simple 2-page test PDF...');

    // Use a different test PDF if sample doesn't exist
    const alternativePdf = path.join(__dirname, 'test-docs/sample.pdf');
    if (fs.existsSync(alternativePdf)) {
      console.log(`   ✅ Using alternative PDF: ${alternativePdf}`);
      return testUploadFile(alternativePdf);
    }

    console.log('   ❌ No test PDF available. Please create one.');
    return null;
  }

  return testUploadFile(TEST_PDF);
}

async function testUploadFile(pdfPath) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(pdfPath));
    form.append('organizationId', TEST_ORG_ID);
    form.append('title', 'E2E Test Document');
    form.append('documentType', 'owner-manual');
    form.append('description', 'Testing image extraction system');

    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`   ❌ Upload failed: ${response.status} ${error}`);
      return null;
    }

    const data = await response.json();
    console.log('   ✅ PDF uploaded successfully');
    console.log(`   📄 Document ID: ${data.documentId}`);
    console.log(`   📋 Job ID: ${data.jobId}`);

    return data.documentId;
  } catch (error) {
    console.log(`   ❌ Upload error: ${error.message}`);
    return null;
  }
}

async function waitForOCRCompletion(documentId, maxWaitSeconds = 60) {
  console.log('\n3️⃣  Waiting for OCR Processing (including image extraction)...');

  const db = new Database(DB_PATH);
  const startTime = Date.now();

  while ((Date.now() - startTime) / 1000 < maxWaitSeconds) {
    const doc = db.prepare('SELECT status FROM documents WHERE id = ?').get(documentId);

    if (!doc) {
      console.log('   ❌ Document not found in database');
      db.close();
      return false;
    }

    console.log(`   ⏳ Status: ${doc.status}`);

    if (doc.status === 'indexed') {
      console.log('   ✅ OCR processing complete!');
      db.close();
      return true;
    }

    if (doc.status === 'failed') {
      console.log('   ❌ OCR processing failed');
      db.close();
      return false;
    }

    await sleep(2000); // Check every 2 seconds
  }

  console.log('   ⏱️  Timeout waiting for OCR completion');
  db.close();
  return false;
}

async function testImageExtraction(documentId) {
  console.log('\n4️⃣  Testing Image Extraction Results...');

  const db = new Database(DB_PATH);

  try {
    // Check document status
    const doc = db.prepare(`
      SELECT id, status, imagesExtracted, imageCount
      FROM documents
      WHERE id = ?
    `).get(documentId);

    console.log(`   📊 Document Status: ${doc.status}`);
    console.log(`   🖼️  Images Extracted: ${doc.imagesExtracted ? 'Yes' : 'No'}`);
    console.log(`   📈 Image Count: ${doc.imageCount || 0}`);

    // Check extracted images
    const images = db.prepare(`
      SELECT id, pageNumber, imageIndex, extractedText, textConfidence,
             imagePath, width, height
      FROM document_images
      WHERE documentId = ?
      ORDER BY pageNumber, imageIndex
    `).all(documentId);

    if (images.length === 0) {
      console.log('   ⚠️  No images extracted (PDF may not contain images)');
      db.close();
      return { success: true, imageCount: 0 };
    }

    console.log(`   ✅ Found ${images.length} extracted images`);

    images.forEach((img, index) => {
      console.log(`\n   Image ${index + 1}:`);
      console.log(`      Page: ${img.pageNumber}, Index: ${img.imageIndex}`);
      console.log(`      Size: ${img.width}x${img.height}px`);
      console.log(`      Path: ${img.imagePath}`);

      if (img.extractedText) {
        const textPreview = img.extractedText.substring(0, 80);
        console.log(`      OCR Text: "${textPreview}..."`);
        console.log(`      Confidence: ${(img.textConfidence * 100).toFixed(1)}%`);
      } else {
        console.log(`      OCR Text: (empty)`);
      }

      // Check if image file exists
      const imagePath = path.join(__dirname, '../', img.imagePath);
      if (fs.existsSync(imagePath)) {
        const stats = fs.statSync(imagePath);
        console.log(`      File Size: ${(stats.size / 1024).toFixed(1)} KB`);
      } else {
        console.log(`      ⚠️  Image file not found: ${imagePath}`);
      }
    });

    db.close();
    return { success: true, imageCount: images.length, images };
  } catch (error) {
    console.log(`   ❌ Error checking images: ${error.message}`);
    db.close();
    return { success: false, imageCount: 0 };
  }
}

async function testImageAPI(documentId) {
  console.log('\n5️⃣  Testing Image API Endpoints...');

  try {
    // Test: Get all images for document
    console.log('   📡 GET /api/documents/:id/images');
    const response = await fetch(`${API_URL}/api/documents/${documentId}/images`);

    if (!response.ok) {
      console.log(`   ❌ API request failed: ${response.status}`);
      return false;
    }

    const data = await response.json();
    console.log(`   ✅ API returned ${data.images.length} images`);

    if (data.images.length === 0) {
      console.log('   ⚠️  No images in API response');
      return true; // Not an error, PDF just doesn't have images
    }

    // Test: Get specific image file
    const firstImage = data.images[0];
    console.log(`\n   📡 GET /api/images/${firstImage.id}`);
    const imageResponse = await fetch(`${API_URL}/api/images/${firstImage.id}`);

    if (!imageResponse.ok) {
      console.log(`   ❌ Image file request failed: ${imageResponse.status}`);
      return false;
    }

    const contentType = imageResponse.headers.get('content-type');
    const buffer = await imageResponse.buffer();

    console.log(`   ✅ Image file retrieved`);
    console.log(`      Content-Type: ${contentType}`);
    console.log(`      Size: ${(buffer.length / 1024).toFixed(1)} KB`);

    return true;
  } catch (error) {
    console.log(`   ❌ API test error: ${error.message}`);
    return false;
  }
}

async function testMeilisearchIndexing(documentId) {
  console.log('\n6️⃣  Testing Meilisearch Image Indexing...');

  const db = new Database(DB_PATH);

  try {
    const images = db.prepare(`
      SELECT id, extractedText
      FROM document_images
      WHERE documentId = ? AND extractedText IS NOT NULL AND extractedText != ''
    `).all(documentId);

    db.close();

    if (images.length === 0) {
      console.log('   ⚠️  No images with OCR text to search');
      return true;
    }

    console.log(`   🔍 Testing search for image text...`);

    // Pick a word from first image's text
    const searchText = images[0].extractedText.split(' ').slice(0, 2).join(' ');
    console.log(`   🔎 Searching for: "${searchText}"`);

    const response = await fetch(`${API_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: searchText,
        organizationId: TEST_ORG_ID
      })
    });

    if (!response.ok) {
      console.log(`   ⚠️  Search request failed: ${response.status}`);
      return false;
    }

    const results = await response.json();

    const imageResults = results.hits?.filter(h => h.documentType === 'image') || [];
    console.log(`   ✅ Found ${imageResults.length} image results`);

    if (imageResults.length > 0) {
      console.log(`   🎯 Image search is working!`);
      imageResults.forEach((result, idx) => {
        console.log(`      Result ${idx + 1}: Page ${result.pageNumber}`);
      });
    }

    return true;
  } catch (error) {
    console.log(`   ❌ Search test error: ${error.message}`);
    db.close();
    return false;
  }
}

async function testCleanup(documentId) {
  console.log('\n7️⃣  Cleaning up test data...');

  const db = new Database(DB_PATH);

  try {
    // Delete document (cascade will delete images)
    const result = db.prepare('DELETE FROM documents WHERE id = ?').run(documentId);

    console.log(`   🗑️  Deleted ${result.changes} document(s)`);

    // Delete uploaded files
    const uploadsDir = path.join(__dirname, '../uploads', documentId);
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true });
      console.log('   🗑️  Deleted uploaded files');
    }

    db.close();
    console.log('   ✅ Cleanup complete');
    return true;
  } catch (error) {
    console.log(`   ❌ Cleanup error: ${error.message}`);
    db.close();
    return false;
  }
}

async function runFullTest() {
  try {
    // Test 1: Health Check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
      console.log('\n❌ Backend is not healthy. Aborting tests.');
      return;
    }

    // Test 2: Upload
    const documentId = await testUpload();
    if (!documentId) {
      console.log('\n❌ Upload failed. Aborting tests.');
      return;
    }

    // Test 3: Wait for OCR
    const ocrComplete = await waitForOCRCompletion(documentId, 90);
    if (!ocrComplete) {
      console.log('\n⚠️  OCR did not complete in time. Continuing anyway...');
    }

    // Test 4: Check Image Extraction
    const imageResult = await testImageExtraction(documentId);

    // Test 5: Test API Endpoints
    if (imageResult.imageCount > 0) {
      await testImageAPI(documentId);
    }

    // Test 6: Test Meilisearch
    if (imageResult.imageCount > 0) {
      await testMeilisearchIndexing(documentId);
    }

    // Test 7: Cleanup
    console.log('\n❓ Keep test data? (will auto-delete in 10s)');
    await sleep(10000);
    await testCleanup(documentId);

    console.log('\n' + '='.repeat(60));
    console.log('✅ E2E Test Complete!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n💥 Test suite error:', error);
  }
}

runFullTest();
