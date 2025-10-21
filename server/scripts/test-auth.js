#!/usr/bin/env node
/**
 * Authentication System Test Script
 *
 * Tests all authentication endpoints and flows:
 * - User registration
 * - User login
 * - Token refresh
 * - Protected endpoint access
 * - Password reset
 * - Email verification
 * - Logout
 */

import dotenv from 'dotenv';
dotenv.config();

const API_BASE = `http://localhost:${process.env.PORT || 3001}/api`;

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function section(message) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(`  ${message}`, colors.blue);
  log('='.repeat(60), colors.blue);
}

// Test data
const testUser = {
  email: `test-${Date.now()}@navidocs.test`,
  password: 'Test1234!@#$',
  name: 'Test User'
};

let accessToken = null;
let refreshToken = null;
let userId = null;
let verificationToken = null;
let resetToken = null;

/**
 * Make HTTP request
 */
async function request(method, path, body = null, headers = {}) {
  const url = `${API_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

/**
 * Test 1: User Registration
 */
async function testRegistration() {
  section('Test 1: User Registration');

  try {
    const res = await request('POST', '/auth/register', {
      email: testUser.email,
      password: testUser.password,
      name: testUser.name
    });

    if (res.ok && res.data.success) {
      userId = res.data.userId;
      success('User registered successfully');
      info(`  User ID: ${userId}`);
      info(`  Email: ${res.data.email}`);
      return true;
    } else {
      error('Registration failed');
      info(`  Error: ${res.data.error}`);
      return false;
    }
  } catch (err) {
    error(`Registration error: ${err.message}`);
    return false;
  }
}

/**
 * Test 2: User Login
 */
async function testLogin() {
  section('Test 2: User Login');

  try {
    const res = await request('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    });

    if (res.ok && res.data.success) {
      accessToken = res.data.accessToken;
      refreshToken = res.data.refreshToken;
      success('Login successful');
      info(`  Access Token: ${accessToken.substring(0, 40)}...`);
      info(`  Refresh Token: ${refreshToken.substring(0, 40)}...`);
      info(`  User: ${res.data.user.email}`);
      return true;
    } else {
      error('Login failed');
      info(`  Error: ${res.data.error}`);
      return false;
    }
  } catch (err) {
    error(`Login error: ${err.message}`);
    return false;
  }
}

/**
 * Test 3: Access Protected Endpoint (GET /auth/me)
 */
async function testProtectedEndpoint() {
  section('Test 3: Access Protected Endpoint');

  try {
    const res = await request('GET', '/auth/me', null, {
      'Authorization': `Bearer ${accessToken}`
    });

    if (res.ok && res.data.success) {
      success('Protected endpoint access successful');
      info(`  User ID: ${res.data.user.id}`);
      info(`  Email: ${res.data.user.email}`);
      info(`  Name: ${res.data.user.name}`);
      return true;
    } else {
      error('Protected endpoint access failed');
      info(`  Error: ${res.data.error}`);
      return false;
    }
  } catch (err) {
    error(`Protected endpoint error: ${err.message}`);
    return false;
  }
}

/**
 * Test 4: Access Protected Endpoint Without Token
 */
async function testUnauthorizedAccess() {
  section('Test 4: Access Protected Endpoint Without Token');

  try {
    const res = await request('GET', '/auth/me');

    if (!res.ok && res.status === 401) {
      success('Unauthorized access correctly denied');
      info(`  Error: ${res.data.error}`);
      return true;
    } else {
      error('Unauthorized access was not denied!');
      return false;
    }
  } catch (err) {
    error(`Unauthorized access test error: ${err.message}`);
    return false;
  }
}

/**
 * Test 5: Token Refresh
 */
async function testTokenRefresh() {
  section('Test 5: Token Refresh');

  try {
    const res = await request('POST', '/auth/refresh', {
      refreshToken
    });

    if (res.ok && res.data.success) {
      const newAccessToken = res.data.accessToken;
      success('Token refresh successful');
      info(`  New Access Token: ${newAccessToken.substring(0, 40)}...`);
      info(`  Token changed: ${newAccessToken !== accessToken ? 'Yes' : 'No'}`);
      accessToken = newAccessToken;
      return true;
    } else {
      error('Token refresh failed');
      info(`  Error: ${res.data.error}`);
      return false;
    }
  } catch (err) {
    error(`Token refresh error: ${err.message}`);
    return false;
  }
}

/**
 * Test 6: Password Reset Request
 */
async function testPasswordResetRequest() {
  section('Test 6: Password Reset Request');

  try {
    const res = await request('POST', '/auth/password/reset-request', {
      email: testUser.email
    });

    if (res.ok && res.data.success) {
      success('Password reset request successful');
      info('  Check console logs for reset token (in production, would be sent via email)');
      return true;
    } else {
      error('Password reset request failed');
      info(`  Error: ${res.data.error}`);
      return false;
    }
  } catch (err) {
    error(`Password reset request error: ${err.message}`);
    return false;
  }
}

/**
 * Test 7: Logout
 */
async function testLogout() {
  section('Test 7: Logout');

  try {
    const res = await request('POST', '/auth/logout', {
      refreshToken
    });

    if (res.ok && res.data.success) {
      success('Logout successful');
      info(`  Message: ${res.data.message}`);
      return true;
    } else {
      error('Logout failed');
      info(`  Error: ${res.data.error}`);
      return false;
    }
  } catch (err) {
    error(`Logout error: ${err.message}`);
    return false;
  }
}

/**
 * Test 8: Use Refresh Token After Logout (should fail)
 */
async function testRevokedRefreshToken() {
  section('Test 8: Use Refresh Token After Logout');

  try {
    const res = await request('POST', '/auth/refresh', {
      refreshToken
    });

    if (!res.ok && res.status === 401) {
      success('Revoked refresh token correctly rejected');
      info(`  Error: ${res.data.error}`);
      return true;
    } else {
      error('Revoked refresh token was NOT rejected!');
      return false;
    }
  } catch (err) {
    error(`Revoked token test error: ${err.message}`);
    return false;
  }
}

/**
 * Test 9: Invalid Login Attempts
 */
async function testInvalidLogin() {
  section('Test 9: Invalid Login Attempts');

  try {
    const res = await request('POST', '/auth/login', {
      email: testUser.email,
      password: 'wrong-password'
    });

    if (!res.ok && res.status === 401) {
      success('Invalid login correctly rejected');
      info(`  Error: ${res.data.error}`);
      return true;
    } else {
      error('Invalid login was NOT rejected!');
      return false;
    }
  } catch (err) {
    error(`Invalid login test error: ${err.message}`);
    return false;
  }
}

/**
 * Test 10: Duplicate Registration
 */
async function testDuplicateRegistration() {
  section('Test 10: Duplicate Registration');

  try {
    const res = await request('POST', '/auth/register', {
      email: testUser.email,
      password: testUser.password,
      name: testUser.name
    });

    if (!res.ok && res.status === 400) {
      success('Duplicate registration correctly rejected');
      info(`  Error: ${res.data.error}`);
      return true;
    } else {
      error('Duplicate registration was NOT rejected!');
      return false;
    }
  } catch (err) {
    error(`Duplicate registration test error: ${err.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.blue);
  log('║         NaviDocs Authentication System Test Suite         ║', colors.blue);
  log('╚════════════════════════════════════════════════════════════╝', colors.blue);

  const results = [];

  // Run tests sequentially
  results.push(await testRegistration());
  results.push(await testLogin());
  results.push(await testProtectedEndpoint());
  results.push(await testUnauthorizedAccess());
  results.push(await testTokenRefresh());
  results.push(await testPasswordResetRequest());
  results.push(await testLogout());
  results.push(await testRevokedRefreshToken());
  results.push(await testInvalidLogin());
  results.push(await testDuplicateRegistration());

  // Summary
  section('Test Summary');
  const passed = results.filter(r => r).length;
  const failed = results.length - passed;

  log(`\nTotal Tests: ${results.length}`, colors.cyan);
  log(`Passed: ${passed}`, colors.green);
  log(`Failed: ${failed}`, failed > 0 ? colors.red : colors.green);

  if (failed === 0) {
    log('\n🎉 All tests passed!', colors.green);
    process.exit(0);
  } else {
    log('\n❌ Some tests failed', colors.red);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const res = await fetch(`http://localhost:${process.env.PORT || 3001}/health`);
    if (res.ok) {
      return true;
    }
  } catch (err) {
    error(`Server is not running at http://localhost:${process.env.PORT || 3001}`);
    error('Please start the server with: npm start');
    process.exit(1);
  }
}

// Main
(async () => {
  await checkServer();
  await runAllTests();
})();
