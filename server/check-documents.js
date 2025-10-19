import { getDb } from './db/db.js';

const db = getDb();

const docs = db.prepare(`
  SELECT id, title, created_at
  FROM documents
  ORDER BY created_at DESC
`).all();

console.log(`\nTotal documents in database: ${docs.length}\n`);

docs.forEach((doc, i) => {
  console.log(`${i + 1}. ${doc.title}`);
  console.log(`   ID: ${doc.id}`);
  console.log(`   Created: ${new Date(doc.created_at).toISOString()}\n`);
});
