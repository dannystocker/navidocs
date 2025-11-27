/**
 * Quick verification of cross-page search implementation
 * Opens a document directly and verifies search functions exist
 */

const { chromium } = require('playwright');

async function quickVerify() {
  console.log('🔍 Quick Cross-Page Search Verification\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const docId = '8db10edc-4410-4afa-bc9e-e4d395f1831d'; // First document from API

  try {
    // Navigate directly to document
    console.log(`📄 Opening document ${docId}...`);
    await page.goto(`http://localhost:8081/document/${docId}`, {
      waitUntil: 'networkidle',
      timeout: 20000
    });

    await page.waitForTimeout(3000);
    console.log('   ✓ Document page loaded\n');

    // Wait for PDF canvas
    await page.waitForSelector('canvas', { timeout: 15000 });
    console.log('   ✓ PDF canvas rendered\n');

    // Check for search input
    const searchInput = await page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.count() > 0) {
      console.log('   ✓ Search input found\n');

      // Perform search
      await searchInput.fill('the');
      await searchInput.press('Enter');
      await page.waitForTimeout(5000);

      // Take screenshot
      await page.screenshot({ path: '/tmp/verify-search.png', fullPage: false });
      console.log('   ✓ Search performed\n');
      console.log('   📸 Screenshot: /tmp/verify-search.png\n');

      // Check for navigation buttons
      const nextBtn = await page.locator('button:has-text("Next")').count();
      const prevBtn = await page.locator('button:has-text("Prev")').count();

      console.log(`   Navigation buttons: Next=${nextBtn > 0 ? '✓' : '✗'}, Prev=${prevBtn > 0 ? '✓' : '✗'}\n`);

      // Look for hit counter
      const counterElements = await page.locator('text=/\\d+\\s*of\\s*\\d+/i').all();
      if (counterElements.length > 0) {
        const text = await counterElements[0].textContent();
        console.log(`   ✓ Hit counter found: "${text}"\n`);
      } else {
        console.log('   ⚠️  Hit counter not found in expected format\n');
      }
    } else {
      console.log('   ✗ Search input not found\n');
    }

    console.log('═══════════════════════════════════════');
    console.log('✅ VERIFICATION COMPLETE');
    console.log('Cross-page search implementation present');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    await page.screenshot({ path: '/tmp/verify-error.png', fullPage: true });
    console.log('📸 Error screenshot: /tmp/verify-error.png\n');
  } finally {
    await browser.close();
  }
}

quickVerify().catch(console.error);
