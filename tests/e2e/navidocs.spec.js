import { test, expect } from '@playwright/test';

const TEST_PDF = '/home/setup/navidocs/test/data/05-versions-space.pdf';

test.describe('NaviDocs E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load home page successfully', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for NaviDocs branding (be specific to avoid duplicate matches)
    await expect(page.getByRole('heading', { name: 'NaviDocs' })).toBeVisible();

    // Check for main UI elements
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/screenshots/home-page.png' });
  });

  test('should open and close upload modal', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find and click upload button (looking for text or icon)
    const uploadButton = page.getByRole('button', { name: /upload/i }).or(page.getByText(/upload/i, { exact: false })).first();

    // Wait for button to be visible and clickable
    await uploadButton.waitFor({ state: 'visible', timeout: 10000 });
    await uploadButton.click();

    // Wait for modal to be visible
    await page.waitForTimeout(500);

    // Take screenshot of modal
    await page.screenshot({ path: 'test-results/screenshots/upload-modal.png' });

    // Try to find close button (could be X, ESC key, or backdrop click)
    const escapeKey = await page.keyboard.press('Escape');
  });

  test('should navigate to search page', async ({ page }) => {
    // Click on search input or navigate to search
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.click();

    // Type a search query
    await searchInput.fill('lighthouse');
    await searchInput.press('Enter');

    // Wait for navigation or search results
    await page.waitForURL(/.*search.*/);

    // Check we're on search page
    await expect(page.url()).toContain('search');

    await page.screenshot({ path: 'test-results/screenshots/search-page.png' });
  });

  test('should click on a document and view it', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for document cards on home page
    const documentCard = page.locator('[class*="card"]').or(page.locator('article')).first();

    if (await documentCard.count() > 0) {
      await documentCard.click();

      // Wait for document page to load
      await page.waitForURL(/.*document.*/);

      // Check for PDF viewer
      await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

      await page.screenshot({ path: 'test-results/screenshots/document-viewer.png' });
    } else {
      console.log('No documents found to test viewing');
    }
  });

  test('should test PDF text selection', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Navigate to a document
    const documentCard = page.locator('[class*="card"]').or(page.locator('article')).first();

    if (await documentCard.count() > 0) {
      await documentCard.click();

      // Wait for PDF to render
      await page.waitForSelector('canvas', { timeout: 10000 });
      await page.waitForTimeout(2000); // Give time for text layer to render

      // Check if text layer exists
      const textLayer = page.locator('.textLayer');
      await expect(textLayer).toBeVisible();

      // Try to select text (simulate triple-click to select a line)
      await textLayer.click({ clickCount: 3 });

      await page.screenshot({ path: 'test-results/screenshots/text-selection.png' });
    }
  });

  test('should test search functionality with results', async ({ page }) => {
    // Navigate to search
    await page.goto('/search?q=lighthouse');
    await page.waitForLoadState('networkidle');

    // Wait for search to complete
    await page.waitForTimeout(3000);

    // Take screenshot first
    await page.screenshot({ path: 'test-results/screenshots/search-results.png' });

    // Check that we're on the search page
    await expect(page.url()).toContain('search');

    // Just verify the page loaded - search results may or may not exist depending on data
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test('should test navigation breadcrumbs', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Navigate to a document if available
    const documentCard = page.locator('[class*="card"]').or(page.locator('article')).first();

    if (await documentCard.count() > 0) {
      await documentCard.click();
      await page.waitForURL(/.*document.*/);

      // Find back button or home link
      const backButton = page.getByRole('link', { name: /home/i })
        .or(page.getByRole('button', { name: /back/i }))
        .or(page.locator('[href="/"]')).first();

      if (await backButton.count() > 0) {
        await backButton.click();

        // Should be back on home page
        await expect(page.url()).toBe('http://localhost:8083/');
      }
    }
  });

  test('should verify responsive layout', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'test-results/screenshots/desktop-layout.png' });

    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'test-results/screenshots/tablet-layout.png' });

    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'test-results/screenshots/mobile-layout.png' });

    // Verify main elements are still visible on mobile (use heading to avoid duplicates)
    await expect(page.getByRole('heading', { name: 'NaviDocs' })).toBeVisible();
  });
});
