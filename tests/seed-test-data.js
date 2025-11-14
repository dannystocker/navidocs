#!/usr/bin/env node

/**
 * Test Data Seed Script
 * Populates test database with sample data for E2E testing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection utilities
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'navidocs_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// Mock database functions (would connect to actual DB in production)
async function initDatabase() {
  console.log('Connecting to test database...');
  console.log(`Database: ${dbConfig.database}`);
  // In production, this would establish actual connection
  return {
    connected: true,
  };
}

async function createOrganization(db) {
  console.log('Creating test organization: Test Marine Co.');
  return {
    id: 'org-test-001',
    name: 'Test Marine Co.',
    slug: 'test-marine-co',
  };
}

async function createUsers(db, orgId) {
  console.log('Creating test users...');
  const users = [
    {
      id: 'user-admin-001',
      email: 'admin@test.com',
      password: 'test123', // In production, use bcrypt
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      organizationId: orgId,
    },
    {
      id: 'user-crew-001',
      email: 'user1@test.com',
      password: 'test123',
      firstName: 'John',
      lastName: 'Sailor',
      role: 'crew_member',
      organizationId: orgId,
    },
    {
      id: 'user-guest-001',
      email: 'user2@test.com',
      password: 'test123',
      firstName: 'Guest',
      lastName: 'User',
      role: 'guest',
      organizationId: orgId,
    },
  ];

  console.log(`  - admin@test.com (admin)`);
  console.log(`  - user1@test.com (crew member)`);
  console.log(`  - user2@test.com (guest)`);

  return users;
}

async function createBoat(db, orgId, adminUserId) {
  console.log('Creating test boat: S/Y Testing Vessel');
  return {
    id: 'test-boat-123',
    name: 'S/Y Testing Vessel',
    type: 'Sailboat',
    length: '45',
    lengthUnit: 'ft',
    beam: '14',
    draft: '7',
    displacement: '45000',
    hullType: 'Monohull',
    material: 'Fiberglass',
    yearBuilt: '2015',
    manufacturer: 'Beneteau',
    model: 'Oceanis 450',
    registrationNumber: 'TEST-VESSEL-001',
    flagState: 'Italy',
    portOfRegistry: 'Genoa',
    organizationId: orgId,
    ownerId: adminUserId,
    homePort: 'Porto Antico, Genoa',
    insuranceProvider: 'Marine Insurance Co.',
    insurancePolicyNumber: 'POL-2024-TEST-001',
  };
}

async function createInventoryItems(db, boatId) {
  console.log('Creating sample inventory items...');
  const items = [
    {
      id: 'inv-001',
      boatId: boatId,
      category: 'Engine',
      name: 'Volvo Penta D3-110 Diesel Engine',
      description: 'Main engine',
      location: 'Engine Room',
      quantity: 1,
      unit: 'piece',
      purchaseDate: '2015-06-15',
      purchasePrice: 8500,
      manufacturer: 'Volvo Penta',
      model: 'D3-110',
      serialNumber: 'VP-2015-D3-001',
      warrantyExpiry: '2023-06-15',
      lastServiceDate: '2024-10-01',
      nextServiceDue: '2024-12-01',
      condition: 'Good',
      notes: 'Recently serviced',
    },
    {
      id: 'inv-002',
      boatId: boatId,
      category: 'Electronics',
      name: 'Garmin GPS 7610xsv',
      description: 'Chart plotter and navigation system',
      location: 'Wheelhouse',
      quantity: 1,
      unit: 'piece',
      purchaseDate: '2020-03-20',
      purchasePrice: 4200,
      manufacturer: 'Garmin',
      model: 'GPSMap 7610xsv',
      serialNumber: 'GM-2020-GPS-001',
      warrantyExpiry: '2022-03-20',
      condition: 'Excellent',
      notes: 'Primary navigation system',
    },
    {
      id: 'inv-003',
      boatId: boatId,
      category: 'Safety Equipment',
      name: 'EPIRB - Emergency Position Indicating Radio Beacon',
      description: 'Emergency beacon',
      location: 'Wheelhouse',
      quantity: 1,
      unit: 'piece',
      purchaseDate: '2022-05-10',
      purchasePrice: 1800,
      manufacturer: 'ACR Electronics',
      model: 'GlobalFix V4',
      serialNumber: 'ACR-2022-EPIRB-001',
      lastServiceDate: '2024-09-15',
      nextServiceDue: '2025-09-15',
      condition: 'Good',
      notes: 'Registered with maritime authorities',
    },
  ];

  console.log(`  - Volvo Penta D3-110 Diesel Engine`);
  console.log(`  - Garmin GPS 7610xsv`);
  console.log(`  - EPIRB Emergency Beacon`);

  return items;
}

async function createMaintenanceRecords(db, boatId, inventoryId) {
  console.log('Creating sample maintenance records...');
  const records = [
    {
      id: 'maint-001',
      boatId: boatId,
      equipmentId: inventoryId,
      type: 'Routine Service',
      description: 'Oil change, filter replacement, and system check',
      date: '2024-10-01',
      technician: 'Marco Rossi',
      company: 'Marco\'s Marine Services',
      cost: 350,
      currency: 'EUR',
      hoursWorked: 2,
      parts: 'Engine oil 5L, oil filter, fuel filter',
      nextServiceDue: '2024-12-01',
      notes: 'Engine running smoothly. All systems nominal.',
      status: 'completed',
    },
    {
      id: 'maint-002',
      boatId: boatId,
      equipmentId: inventoryId,
      type: 'Annual Inspection',
      description: 'Full engine and auxiliary system inspection',
      date: '2024-11-10',
      technician: 'Marco Rossi',
      company: 'Marco\'s Marine Services',
      cost: 750,
      currency: 'EUR',
      hoursWorked: 5,
      parts: 'Various gaskets and seals',
      nextServiceDue: '2025-11-10',
      notes: 'Engine in excellent condition. No issues found.',
      status: 'completed',
    },
  ];

  console.log(`  - Oil change and filter replacement (2024-10-01)`);
  console.log(`  - Annual inspection (2024-11-10)`);

  return records;
}

async function createContacts(db, orgId) {
  console.log('Creating sample contacts...');
  const contacts = [
    {
      id: 'contact-001',
      organizationId: orgId,
      type: 'mechanic',
      name: 'Marco\'s Marine Services',
      firstName: 'Marco',
      lastName: 'Rossi',
      phone: '+39 010 555 1234',
      email: 'marco@marineservices.it',
      company: 'Marco\'s Marine Services',
      address: 'Via Garibaldi 15, 16123 Genoa, Italy',
      specialization: 'Engine maintenance and repairs',
      rating: 5,
      notes: 'Highly recommended for diesel engines',
    },
    {
      id: 'contact-002',
      organizationId: orgId,
      type: 'supplier',
      name: 'Marina Porto Antico',
      phone: '+39 010 555 0100',
      email: 'info@portoantic.it',
      company: 'Marina Porto Antico',
      address: 'Porto Antico, Genoa, Italy',
      specialization: 'Fuel, provisions, and supplies',
      rating: 4,
      notes: 'Reliable fuel supplier. Good prices.',
    },
  ];

  console.log(`  - Marco's Marine Services (Mechanic)`);
  console.log(`  - Marina Porto Antico (Supplier)`);

  return contacts;
}

async function createExpenses(db, boatId) {
  console.log('Creating sample expenses...');
  const expenses = [
    {
      id: 'exp-001',
      boatId: boatId,
      date: '2024-11-10',
      category: 'Fuel',
      description: 'Diesel fuel 150L',
      amount: 350.00,
      currency: 'EUR',
      vendor: 'Marina Porto Antico',
      paymentMethod: 'Card',
      receipt: 'FUL-2024-11-10-001',
      notes: 'Refueled at Genoa marina',
      status: 'recorded',
    },
    {
      id: 'exp-002',
      boatId: boatId,
      date: '2024-10-01',
      category: 'Maintenance',
      description: 'Engine oil change and service',
      amount: 350.00,
      currency: 'EUR',
      vendor: 'Marco\'s Marine Services',
      paymentMethod: 'Card',
      receipt: 'MAINT-2024-10-001',
      notes: 'Routine engine maintenance',
      status: 'recorded',
    },
  ];

  console.log(`  - Fuel: 350.00 EUR (2024-11-10)`);
  console.log(`  - Maintenance: 350.00 EUR (2024-10-01)`);

  return expenses;
}

async function seedDatabase() {
  try {
    console.log('\n========================================');
    console.log('NaviDocs Test Database Seed Script');
    console.log('========================================\n');

    const db = await initDatabase();

    // Create organization
    const org = await createOrganization(db);

    // Create users
    const users = await createUsers(db, org.id);
    const adminUser = users.find(u => u.role === 'admin');

    // Create boat
    const boat = await createBoat(db, org.id, adminUser.id);

    // Create inventory items
    const inventoryItems = await createInventoryItems(db, boat.id);

    // Create maintenance records
    const maintenanceRecords = await createMaintenanceRecords(db, boat.id, inventoryItems[0].id);

    // Create contacts
    const contacts = await createContacts(db, org.id);

    // Create expenses
    const expenses = await createExpenses(db, boat.id);

    // Summary
    console.log('\n========================================');
    console.log('Seed Data Summary');
    console.log('========================================');
    console.log(`Organization: ${org.name}`);
    console.log(`Test Users: ${users.length}`);
    console.log(`Test Boat: ${boat.name}`);
    console.log(`Inventory Items: ${inventoryItems.length}`);
    console.log(`Maintenance Records: ${maintenanceRecords.length}`);
    console.log(`Contacts: ${contacts.length}`);
    console.log(`Expenses: ${expenses.length}`);
    console.log('\nTest data structure created successfully!');
    console.log('Note: In production, connect to actual database and insert records.');
    console.log('========================================\n');

    return {
      success: true,
      organization: org,
      users: users,
      boat: boat,
      inventoryItems: inventoryItems,
      maintenanceRecords: maintenanceRecords,
      contacts: contacts,
      expenses: expenses,
    };

  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
}

// Run seed script
seedDatabase().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
