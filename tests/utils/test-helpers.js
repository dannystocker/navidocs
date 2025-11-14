/**
 * Test Helper Functions
 * Common utilities for E2E tests
 */

/**
 * Login to the application
 * @param {Page} page - Playwright page object
 * @param {string} email - User email
 * @param {string} password - User password
 */
export async function login(page, email, password) {
  // Navigate to login page
  await page.goto('/login');

  // Fill in credentials
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL(/\/dashboard/);
  await page.waitForSelector('[data-testid="navbar"]', { timeout: 10000 });
}

/**
 * Logout from the application
 * @param {Page} page - Playwright page object
 */
export async function logout(page) {
  // Click user menu
  await page.click('[data-testid="user-menu"]');

  // Click logout button
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to login page
  await page.waitForURL(/\/login/);
}

/**
 * Select a boat from the boat selector
 * @param {Page} page - Playwright page object
 * @param {string} boatName - Name of the boat to select
 */
export async function selectBoat(page, boatName) {
  // Click boat selector
  await page.click('[data-testid="boat-selector"]');

  // Wait for dropdown to appear
  await page.waitForSelector('[data-testid="boat-dropdown"]');

  // Click the desired boat
  await page.click(`[data-testid="boat-option-${boatName}"]`);

  // Wait for boat to be selected
  await page.waitForSelector(`[data-testid="boat-selector"][data-selected="${boatName}"]`);
}

/**
 * Wait for API response
 * @param {Page} page - Playwright page object
 * @param {string} endpoint - API endpoint to wait for (e.g., '/api/boats')
 * @param {number} timeout - Timeout in milliseconds
 */
export async function waitForApiResponse(page, endpoint, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const listener = (response) => {
      if (response.url().includes(endpoint)) {
        page.off('response', listener);
        resolve(response);
      }
    };

    const timeoutId = setTimeout(() => {
      page.off('response', listener);
      reject(new Error(`Timeout waiting for API response: ${endpoint}`));
    }, timeout);

    page.on('response', listener);
  });
}

/**
 * Upload file to a file input
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector for file input
 * @param {string} filePath - Path to file to upload
 */
export async function uploadFile(page, selector, filePath) {
  const fileInput = await page.$(selector);
  if (!fileInput) {
    throw new Error(`File input not found: ${selector}`);
  }

  await fileInput.setInputFiles(filePath);
}

/**
 * Take screenshot and save to results directory
 * @param {Page} page - Playwright page object
 * @param {string} name - Name for the screenshot
 */
export async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const path = `playwright-report/screenshots/${filename}`;

  await page.screenshot({ path });
  return path;
}

/**
 * Mock geolocation for the page
 * @param {Page} page - Playwright page object
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 */
export async function mockGeolocation(page, latitude, longitude) {
  // Grant location permission
  const context = page.context();
  await context.grantPermissions(['geolocation']);

  // Set location
  await context.setGeolocation({ latitude, longitude });
}

/**
 * Wait for element to be visible
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 */
export async function waitForVisible(page, selector, timeout = 5000) {
  await page.waitForSelector(selector, { visible: true, timeout });
}

/**
 * Wait for element to be hidden
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 */
export async function waitForHidden(page, selector, timeout = 5000) {
  await page.waitForSelector(selector, { hidden: true, timeout });
}

/**
 * Get all text from an element
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector
 */
export async function getText(page, selector) {
  const element = await page.$(selector);
  if (!element) {
    return null;
  }
  return await element.textContent();
}

/**
 * Fill form and submit
 * @param {Page} page - Playwright page object
 * @param {Object} formData - Object with field names as keys and values
 */
export async function fillAndSubmit(page, formData) {
  for (const [name, value] of Object.entries(formData)) {
    const selector = `input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`;
    await page.fill(selector, value);
  }

  // Click submit button (adjust selector as needed)
  await page.click('button[type="submit"]');
}

/**
 * Check if element exists
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector
 */
export async function elementExists(page, selector) {
  return (await page.$(selector)) !== null;
}

/**
 * Get element attribute
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {string} attribute - Attribute name
 */
export async function getAttribute(page, selector, attribute) {
  const element = await page.$(selector);
  if (!element) {
    return null;
  }
  return await element.getAttribute(attribute);
}

/**
 * Click element if it exists
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector
 */
export async function clickIfExists(page, selector) {
  if (await elementExists(page, selector)) {
    await page.click(selector);
    return true;
  }
  return false;
}

/**
 * Get all text content from elements matching selector
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector
 */
export async function getAllTexts(page, selector) {
  return await page.$$eval(selector, (elements) =>
    elements.map((element) => element.textContent)
  );
}

/**
 * Wait for table to load with specific number of rows
 * @param {Page} page - Playwright page object
 * @param {string} tableSelector - CSS selector for table
 * @param {number} minRows - Minimum number of rows expected
 */
export async function waitForTableRows(page, tableSelector, minRows = 1) {
  await page.waitForFunction(
    ({ tableSelector, minRows }) => {
      const table = document.querySelector(tableSelector);
      if (!table) return false;
      const rows = table.querySelectorAll('tbody tr');
      return rows.length >= minRows;
    },
    { tableSelector, minRows },
    { timeout: 10000 }
  );
}
