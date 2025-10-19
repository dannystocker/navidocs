#!/usr/bin/env node
/**
 * Capture comprehensive demo screenshots using Playwright
 */

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'demo-screenshots');
const BASE_URL = 'http://localhost:8083';

async function captureScreenshots() {
  console.log('🎬 Starting screenshot capture...\n');

  // Create screenshots directory
  await mkdir(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // 1. Home Page
    console.log('📸 Capturing home page...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-home-page.png'),
      fullPage: true,
    });

    // 2. Search Input Focused
    console.log('📸 Capturing search input focused...');
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.click();
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-search-focused.png'),
    });

    // 3. Search Results
    console.log('📸 Capturing search results...');
    await page.goto(`${BASE_URL}/search?q=network`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-search-results.png'),
      fullPage: true,
    });

    // 4. Document Viewer
    console.log('📸 Capturing document viewer...');
    // Go back to home and click first document
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const firstDoc = page.locator('[class*="card"]').first();
    const hasDoc = await firstDoc.count() > 0;

    if (hasDoc) {
      await firstDoc.click();
      await page.waitForURL(/.*document.*/);
      await page.waitForSelector('canvas', { timeout: 10000 });
      await page.waitForTimeout(2000); // Wait for PDF to fully render
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '04-document-viewer.png'),
        fullPage: true,
      });

      // 5. Zoomed In PDF
      console.log('📸 Capturing zoomed PDF...');
      const zoomInBtn = page.getByRole('button', { name: /zoom in|\\+/i }).first();
      if (await zoomInBtn.count() > 0) {
        await zoomInBtn.click();
        await page.waitForTimeout(500);
        await zoomInBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '05-document-zoomed.png'),
        });
      }

      // 6. Text Selection
      console.log('📸 Capturing text selection...');
      const textLayer = page.locator('.textLayer');
      if (await textLayer.count() > 0) {
        await textLayer.click({ clickCount: 3 }); // Triple-click to select line
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '06-text-selection.png'),
        });
      }
    }

    // 7. Mobile View - Home
    console.log('📸 Capturing mobile view...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '07-mobile-home.png'),
      fullPage: true,
    });

    // 8. Mobile View - Search
    await page.goto(`${BASE_URL}/search?q=network`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '08-mobile-search.png'),
      fullPage: true,
    });

    // 9. Tablet View
    console.log('📸 Capturing tablet view...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '09-tablet-view.png'),
      fullPage: true,
    });

    console.log('\n✅ Screenshot capture complete!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}\n`);

    // List all captured screenshots
    const { readdir } = await import('fs/promises');
    const files = await readdir(SCREENSHOTS_DIR);
    console.log('Captured screenshots:');
    files.forEach(file => {
      console.log(`  - ${file}`);
    });

  } catch (error) {
    console.error('\n❌ Error capturing screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  captureScreenshots()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

export { captureScreenshots };
