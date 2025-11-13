/**
 * Test: Super Admin Permission Delegation Workflow
 *
 * Scenario: Marine Services Agency managing multiple boats
 * - Agency admin creates organization
 * - Creates 3 boats (entities)
 * - Grants permissions to technician, captain, and office staff
 * - Tests permission checks and revocation
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8001/api';

// Test data
const testEmail = `agency-admin-${Date.now()}@example.com`;
const techEmail = `technician-${Date.now()}@example.com`;
const captainEmail = `captain-${Date.now()}@example.com`;
const officeEmail = `office-${Date.now()}@example.com`;

let adminToken, adminUserId, techToken, techUserId, captainToken, captainUserId, officeToken, officeUserId;
let organizationId, boat1Id, boat2Id, boat3Id;

async function test(name, fn) {
  try {
    console.log(`\n🧪 Test: ${name}`);
    await fn();
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    throw error;
  }
}

async function registerAndLogin(email, password, name) {
  // Register
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  const registerData = await registerRes.json();
  if (!registerData.success) throw new Error(`Registration failed: ${registerData.error}`);

  // Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error(`Login failed: ${loginData.error}`);

  return { token: loginData.accessToken, userId: loginData.user.id };
}

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  Super Admin Permission Delegation Test Suite           ║');
console.log('║  Scenario: Marine Agency Managing Multiple Boats        ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

(async () => {
  try {
    // 1. Create users
    await test('Register Agency Admin', async () => {
      const result = await registerAndLogin(testEmail, 'SecurePass123!', 'Agency Admin');
      adminToken = result.token;
      adminUserId = result.userId;
      console.log(`   Admin User ID: ${adminUserId}`);

      // Manually promote to system admin for testing
      const Database = (await import('better-sqlite3')).default;
      const db = new Database('./db/navidocs.db');
      db.prepare('UPDATE users SET is_system_admin = 1 WHERE id = ?').run(adminUserId);
      db.close();
      console.log(`   Promoted to System Admin`);
    });

    await test('Register Technician', async () => {
      const result = await registerAndLogin(techEmail, 'TechPass123!', 'John Technician');
      techToken = result.token;
      techUserId = result.userId;
      console.log(`   Technician User ID: ${techUserId}`);
    });

    await test('Register Captain', async () => {
      const result = await registerAndLogin(captainEmail, 'CaptainPass123!', 'Sarah Captain');
      captainToken = result.token;
      captainUserId = result.userId;
      console.log(`   Captain User ID: ${captainUserId}`);
    });

    await test('Register Office Staff', async () => {
      const result = await registerAndLogin(officeEmail, 'OfficePass123!', 'Mike Office');
      officeToken = result.token;
      officeUserId = result.userId;
      console.log(`   Office User ID: ${officeUserId}`);
    });

    // 2. Create organization
    await test('Create Marine Services Organization', async () => {
      const res = await fetch(`${BASE_URL}/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Marine Services Inc',
          type: 'business',
          metadata: { industry: 'marine', location: 'Miami, FL' }
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      organizationId = data.organization.id;
      console.log(`   Organization ID: ${organizationId}`);
      console.log(`   Organization Name: ${data.organization.name}`);
    });

    // 3. Create boats (entities) - Note: Assuming entities table exists
    // This is a simplified version - in real scenario, you'd have entity creation endpoints
    boat1Id = 'boat-001-sea-spirit';
    boat2Id = 'boat-002-wave-runner';
    boat3Id = 'boat-003-ocean-pearl';
    console.log(`\n📝 Note: Using simulated boat IDs (in production, create via entity endpoints):`);
    console.log(`   Boat 1: ${boat1Id} - Sea Spirit`);
    console.log(`   Boat 2: ${boat2Id} - Wave Runner`);
    console.log(`   Boat 3: ${boat3Id} - Ocean Pearl`);

    // 4. Grant permissions
    await test('Grant Technician EDITOR access to Boat 1', async () => {
      const res = await fetch(`${BASE_URL}/permissions/entities/${boat1Id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          userId: techUserId,
          permissionLevel: 'editor',
          expiresAt: null
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      console.log(`   Permission granted: ${data.permission.permission_level}`);
    });

    await test('Grant Captain MANAGER access to Boat 2', async () => {
      const res = await fetch(`${BASE_URL}/permissions/entities/${boat2Id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          userId: captainUserId,
          permissionLevel: 'manager',
          expiresAt: null
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      console.log(`   Permission granted: ${data.permission.permission_level}`);
    });

    await test('Grant Office Staff VIEWER access to all boats', async () => {
      for (const boatId of [boat1Id, boat2Id, boat3Id]) {
        const res = await fetch(`${BASE_URL}/permissions/entities/${boatId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            userId: officeUserId,
            permissionLevel: 'viewer',
            expiresAt: null
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      }
      console.log(`   Viewer access granted to 3 boats`);
    });

    // 5. Check permissions
    await test('Verify Technician has access to Boat 1', async () => {
      const res = await fetch(`${BASE_URL}/permissions/check/entities/${boat1Id}?level=editor`, {
        headers: { 'Authorization': `Bearer ${techToken}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (!data.hasPermission) throw new Error('Permission check failed');
      console.log(`   ✓ Technician has ${data.userPermission} permission`);
    });

    await test('Verify Technician does NOT have access to Boat 2', async () => {
      const res = await fetch(`${BASE_URL}/permissions/check/entities/${boat2Id}`, {
        headers: { 'Authorization': `Bearer ${techToken}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (data.hasPermission) throw new Error('Should not have permission');
      console.log(`   ✓ Correctly denied access`);
    });

    await test('List all permissions for Boat 1', async () => {
      const res = await fetch(`${BASE_URL}/permissions/entities/${boat1Id}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      console.log(`   Found ${data.permissions.length} permissions on Boat 1`);
      data.permissions.forEach(p => {
        console.log(`     - User: ${p.user_id.substring(0, 8)}... Level: ${p.permission_level}`);
      });
    });

    await test('List technician\'s accessible entities', async () => {
      const res = await fetch(`${BASE_URL}/permissions/users/${techUserId}/entities`, {
        headers: { 'Authorization': `Bearer ${techToken}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      console.log(`   Technician has access to ${data.permissions.length} entities`);
    });

    // 6. Revoke permission
    await test('Revoke Technician access to Boat 1', async () => {
      const res = await fetch(`${BASE_URL}/permissions/entities/${boat1Id}/users/${techUserId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      console.log(`   Permission revoked successfully`);
    });

    await test('Verify Technician no longer has access to Boat 1', async () => {
      const res = await fetch(`${BASE_URL}/permissions/check/entities/${boat1Id}`, {
        headers: { 'Authorization': `Bearer ${techToken}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (data.hasPermission) throw new Error('Permission should be revoked');
      console.log(`   ✓ Access correctly revoked`);
    });

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  TEST SUMMARY                                             ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('✅ All permission delegation tests PASSED!');
    console.log('\n📊 Test Coverage:');
    console.log('   ✓ Organization creation');
    console.log('   ✓ Permission granting (viewer, editor, manager)');
    console.log('   ✓ Permission checking');
    console.log('   ✓ Permission listing');
    console.log('   ✓ Permission revocation');
    console.log('   ✓ Access denial verification');
    console.log('\n🎉 Super Admin Delegation System Working Perfectly!');

  } catch (error) {
    console.log('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
})();
