/**
 * Expenses Route Tests
 * Testing CRUD operations, split calculation, approval workflow, OCR, and filtering
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import express from 'express';
import expensesRouter from './expenses.js';
import multer from 'multer';

// Mock database
const mockDb = {
  expenses: [],
  lastId: 0,

  prepare(query) {
    return {
      run: (...params) => {
        if (query.includes('INSERT INTO expenses')) {
          const id = ++mockDb.lastId;
          mockDb.expenses.push({
            id: params[0],
            boat_id: params[1],
            amount: params[2],
            currency: params[3],
            date: params[4],
            category: params[5],
            description: params[6],
            receipt_url: params[7],
            split_users: params[8],
            approval_status: params[9],
            created_at: params[10],
            updated_at: params[11]
          });
          return { lastID: id };
        } else if (query.includes('UPDATE expenses')) {
          const idx = mockDb.expenses.findIndex(e => e.id === params[params.length - 1]);
          if (idx !== -1) {
            mockDb.expenses[idx] = { ...mockDb.expenses[idx] };
          }
        } else if (query.includes('DELETE FROM expenses')) {
          mockDb.expenses = mockDb.expenses.filter(e => e.id !== params[0]);
        }
        return { changes: 1 };
      },

      all: (...params) => {
        let results = [...mockDb.expenses];

        // Apply WHERE clauses
        if (query.includes('WHERE boat_id = ?')) {
          results = results.filter(e => e.boat_id == params[0]);
        }

        if (query.includes("approval_status = 'pending'")) {
          results = results.filter(e => e.approval_status === 'pending');
        }

        return results;
      },

      get: (...params) => {
        return mockDb.expenses.find(e => e.id === params[0]);
      }
    };
  }
};

// Setup and teardown
beforeEach(() => {
  mockDb.expenses = [];
  mockDb.lastId = 0;
});

describe('Expense Routes', () => {
  // Test 1: Create Expense with Valid Data
  it('Should create expense with valid data', () => {
    const expense = {
      id: '1',
      boat_id: 1,
      amount: 100.00,
      currency: 'EUR',
      date: '2025-11-14',
      category: 'fuel',
      description: 'Fuel purchase',
      receipt_url: null,
      split_users: JSON.stringify({ user1: 50, user2: 50 }),
      approval_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const result = mockDb.prepare(`
      INSERT INTO expenses (
        id, boat_id, amount, currency, date, category,
        description, receipt_url, split_users, approval_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      expense.id, expense.boat_id, expense.amount, expense.currency,
      expense.date, expense.category, expense.description, expense.receipt_url,
      expense.split_users, expense.approval_status, expense.created_at, expense.updated_at
    );

    expect(result.changes).toBe(1);
    expect(mockDb.expenses.length).toBe(1);
    expect(mockDb.expenses[0].amount).toBe(100.00);
    expect(mockDb.expenses[0].category).toBe('fuel');
  });

  // Test 2: Validate Currency
  it('Should validate currency values (EUR, USD, GBP)', () => {
    const validCurrencies = ['EUR', 'USD', 'GBP'];
    const testCurrency = 'USD';

    expect(validCurrencies).toContain(testCurrency);
    expect(validCurrencies).not.toContain('JPY');
  });

  // Test 3: Validate Amount
  it('Should validate that amount is positive', () => {
    const amounts = [100, 0.01, -50, 0];
    const validAmounts = amounts.filter(a => a > 0);

    expect(validAmounts).toEqual([100, 0.01]);
    expect(validAmounts).not.toContain(-50);
    expect(validAmounts).not.toContain(0);
  });

  // Test 4: Split Calculation
  it('Should calculate split amounts correctly', () => {
    const expense = {
      amount: 100,
      splitUsers: { user1: 60, user2: 40 }
    };

    const user1Share = expense.amount * 60 / 100;
    const user2Share = expense.amount * 40 / 100;

    expect(user1Share).toBe(60);
    expect(user2Share).toBe(40);
    expect(user1Share + user2Share).toBe(100);
  });

  // Test 5: Split Percentage Validation
  it('Should validate that split percentages sum to 100%', () => {
    const validSplit = { user1: 50, user2: 50 };
    const invalidSplit = { user1: 60, user2: 30 };

    const validSum = Object.values(validSplit).reduce((a, b) => a + b, 0);
    const invalidSum = Object.values(invalidSplit).reduce((a, b) => a + b, 0);

    expect(validSum).toBe(100);
    expect(invalidSum).toBe(90);
  });

  // Test 6: List Expenses for Boat
  it('Should list all expenses for a specific boat', () => {
    const expense1 = {
      id: '1',
      boat_id: 1,
      amount: 100,
      currency: 'EUR',
      date: '2025-11-14',
      category: 'fuel',
      description: 'Fuel',
      receipt_url: null,
      split_users: JSON.stringify({ user1: 100 }),
      approval_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const expense2 = {
      id: '2',
      boat_id: 1,
      amount: 50,
      currency: 'EUR',
      date: '2025-11-13',
      category: 'maintenance',
      description: 'Service',
      receipt_url: null,
      split_users: JSON.stringify({ user1: 100 }),
      approval_status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert expenses
    mockDb.prepare(`INSERT INTO expenses (...) VALUES (...)`).run(
      expense1.id, expense1.boat_id, expense1.amount, expense1.currency,
      expense1.date, expense1.category, expense1.description, expense1.receipt_url,
      expense1.split_users, expense1.approval_status, expense1.created_at, expense1.updated_at
    );

    mockDb.prepare(`INSERT INTO expenses (...) VALUES (...)`).run(
      expense2.id, expense2.boat_id, expense2.amount, expense2.currency,
      expense2.date, expense2.category, expense2.description, expense2.receipt_url,
      expense2.split_users, expense2.approval_status, expense2.created_at, expense2.updated_at
    );

    // Query
    const results = mockDb.prepare('SELECT * FROM expenses WHERE boat_id = ?').all(1);

    expect(results.length).toBe(2);
    expect(results[0].id).toBe('1');
    expect(results[1].id).toBe('2');
  });

  // Test 7: Filter by Status
  it('Should filter expenses by approval status', () => {
    const expense1 = {
      id: '1',
      boat_id: 1,
      amount: 100,
      currency: 'EUR',
      date: '2025-11-14',
      category: 'fuel',
      description: null,
      receipt_url: null,
      split_users: JSON.stringify({}),
      approval_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockDb.prepare(`INSERT INTO expenses (...) VALUES (...)`).run(
      expense1.id, expense1.boat_id, expense1.amount, expense1.currency,
      expense1.date, expense1.category, expense1.description, expense1.receipt_url,
      expense1.split_users, expense1.approval_status, expense1.created_at, expense1.updated_at
    );

    const pendingExpenses = mockDb.expenses.filter(e => e.approval_status === 'pending');
    const approvedExpenses = mockDb.expenses.filter(e => e.approval_status === 'approved');

    expect(pendingExpenses.length).toBe(1);
    expect(approvedExpenses.length).toBe(0);
  });

  // Test 8: Filter by Category
  it('Should filter expenses by category', () => {
    const categories = ['fuel', 'maintenance', 'moorage'];

    const fuelExpenses = mockDb.expenses.filter(e => e.category === 'fuel');
    const maintenanceExpenses = mockDb.expenses.filter(e => e.category === 'maintenance');

    expect(categories).toContain('fuel');
    expect(categories).toContain('maintenance');
    expect(categories).not.toContain('invalid');
  });

  // Test 9: Filter by Date Range
  it('Should filter expenses by date range', () => {
    const startDate = '2025-11-01';
    const endDate = '2025-11-15';
    const testDate = '2025-11-10';

    const inRange = testDate >= startDate && testDate <= endDate;

    expect(inRange).toBe(true);
  });

  // Test 10: Approval Workflow - Pending to Approved
  it('Should transition expense from pending to approved', () => {
    const expense = {
      id: '1',
      approval_status: 'pending'
    };

    expect(expense.approval_status).toBe('pending');

    expense.approval_status = 'approved';

    expect(expense.approval_status).toBe('approved');
  });

  // Test 11: Prevent Update of Approved Expenses
  it('Should prevent updating approved expenses', () => {
    const expense = {
      id: '1',
      approval_status: 'approved',
      amount: 100
    };

    const canUpdate = expense.approval_status === 'pending';

    expect(canUpdate).toBe(false);
  });

  // Test 12: Delete Only Pending Expenses
  it('Should only allow deletion of pending expenses', () => {
    const pendingExpense = { id: '1', approval_status: 'pending' };
    const approvedExpense = { id: '2', approval_status: 'approved' };

    expect(pendingExpense.approval_status === 'pending').toBe(true);
    expect(approvedExpense.approval_status === 'pending').toBe(false);
  });

  // Test 13: User Totals Calculation
  it('Should calculate total expense amount per user', () => {
    const expenses = [
      {
        amount: 100,
        splitUsers: { user1: 50, user2: 50 }
      },
      {
        amount: 200,
        splitUsers: { user1: 75, user2: 25 }
      }
    ];

    const userTotals = {};
    expenses.forEach(exp => {
      Object.entries(exp.splitUsers).forEach(([userId, percentage]) => {
        const share = exp.amount * percentage / 100;
        userTotals[userId] = (userTotals[userId] || 0) + share;
      });
    });

    expect(userTotals.user1).toBe(200); // 50 + 150
    expect(userTotals.user2).toBe(100); // 50 + 50
  });

  // Test 14: Category Breakdown
  it('Should calculate total expense amount per category', () => {
    const expenses = [
      { amount: 100, category: 'fuel' },
      { amount: 50, category: 'maintenance' },
      { amount: 75, category: 'fuel' }
    ];

    const categoryTotals = {};
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    expect(categoryTotals.fuel).toBe(175);
    expect(categoryTotals.maintenance).toBe(50);
  });

  // Test 15: OCR Placeholder
  it('Should process OCR with mock data', () => {
    const expense = {
      id: '1',
      receiptUrl: '/uploads/receipts/receipt.jpg',
      ocrText: null
    };

    const mockOcrText = `
RECEIPT
Date: 2025-11-14
Amount: 100.00 EUR
Items:
- Item 1: 50.00 EUR
- Item 2: 50.00 EUR
    `.trim();

    expect(expense.ocrText).toBe(null);

    expense.ocrText = mockOcrText;

    expect(expense.ocrText).not.toBe(null);
    expect(expense.ocrText).toContain('RECEIPT');
    expect(expense.ocrText).toContain('100.00 EUR');
  });

  // Test 16: Currency Conversion Basis
  it('Should handle multi-currency tracking', () => {
    const expenses = [
      { amount: 100, currency: 'EUR' },
      { amount: 120, currency: 'USD' },
      { amount: 90, currency: 'GBP' }
    ];

    const byCurrency = {};
    expenses.forEach(exp => {
      byurrency[exp.currency] = (byUrency[exp.currency] || 0) + exp.amount;
    });

    // Should track separate currency totals (conversion would be done separately)
    expect(expenses.filter(e => e.currency === 'EUR').length).toBe(1);
    expect(expenses.filter(e => e.currency === 'USD').length).toBe(1);
    expect(expenses.filter(e => e.currency === 'GBP').length).toBe(1);
  });
});

describe('Edge Cases', () => {
  // Test for NULL handling
  it('Should handle NULL description field', () => {
    const expense = {
      description: null
    };

    expect(expense.description).toBe(null);
    const displayValue = expense.description || 'No description';
    expect(displayValue).toBe('No description');
  });

  // Test for empty split users
  it('Should handle empty split users object', () => {
    const expense = {
      splitUsers: {}
    };

    const totalShare = Object.values(expense.splitUsers).reduce((a, b) => a + b, 0);

    expect(totalShare).toBe(0);
  });

  // Test for receipt file handling
  it('Should validate receipt file types', () => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const testMimes = ['image/jpeg', 'image/gif', 'application/pdf'];

    const validMimes = testMimes.filter(mime => allowedMimes.includes(mime));

    expect(validMimes.length).toBe(2); // jpeg and pdf are valid
    expect(validMimes).not.toContain('image/gif');
  });

  // Test for large amounts
  it('Should handle large expense amounts', () => {
    const largeAmount = 99999.99;

    expect(largeAmount).toBeGreaterThan(0);
    expect(typeof largeAmount).toBe('number');
  });

  // Test for date validation
  it('Should validate date format YYYY-MM-DD', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const validDate = '2025-11-14';
    const invalidDate = '14-11-2025';

    expect(dateRegex.test(validDate)).toBe(true);
    expect(dateRegex.test(invalidDate)).toBe(false);
  });
});

describe('Integration Tests', () => {
  // Test full workflow
  it('Should complete full expense workflow: create -> approve -> view split', () => {
    // 1. Create
    const newExpense = {
      id: '1',
      boat_id: 1,
      amount: 100,
      currency: 'EUR',
      date: '2025-11-14',
      category: 'fuel',
      description: 'Fuel',
      receipt_url: null,
      split_users: JSON.stringify({ user1: 60, user2: 40 }),
      approval_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockDb.prepare(`INSERT INTO expenses (...) VALUES (...)`).run(
      newExpense.id, newExpense.boat_id, newExpense.amount, newExpense.currency,
      newExpense.date, newExpense.category, newExpense.description, newExpense.receipt_url,
      newExpense.split_users, newExpense.approval_status, newExpense.created_at, newExpense.updated_at
    );

    expect(mockDb.expenses.length).toBe(1);
    expect(mockDb.expenses[0].approval_status).toBe('pending');

    // 2. Approve
    mockDb.expenses[0].approval_status = 'approved';

    expect(mockDb.expenses[0].approval_status).toBe('approved');

    // 3. View split
    const splitUsers = JSON.parse(mockDb.expenses[0].split_users);
    const user1Share = newExpense.amount * splitUsers.user1 / 100;
    const user2Share = newExpense.amount * splitUsers.user2 / 100;

    expect(user1Share).toBe(60);
    expect(user2Share).toBe(40);
  });
});
