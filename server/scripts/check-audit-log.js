#!/usr/bin/env node
/**
 * Check Audit Log Script
 * Verifies audit logging is working correctly
 */

import { getDb } from '../config/db.js';
import { getEventStats, getRecentAuditLogs } from '../services/audit.service.js';

const db = getDb();

console.log('\n=== Audit Log Statistics ===\n');

// Total events
const total = db.prepare('SELECT COUNT(*) as count FROM audit_log').get();
console.log(`Total audit events: ${total.count}`);

// Event breakdown
console.log('\nEvent breakdown:');
const stats = getEventStats({
  startDate: 0,
  endDate: Math.floor(Date.now() / 1000)
});

stats.forEach(stat => {
  console.log(`  ${stat.event_type} (${stat.status}): ${stat.count}`);
});

// Recent events
console.log('\nRecent audit events (last 10):');
const recent = getRecentAuditLogs({ limit: 10 });

recent.forEach((event, i) => {
  const date = new Date(event.created_at * 1000).toISOString();
  console.log(`  ${i + 1}. ${event.event_type} - ${event.status} - ${date}`);
});

console.log('\n=== Audit Log Check Complete ===\n');
