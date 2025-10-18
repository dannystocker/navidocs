/**
 * Quick test script to verify routes are properly loaded
 * Run: node test-routes.js
 */

import express from 'express';
import uploadRoutes from './routes/upload.js';
import jobsRoutes from './routes/jobs.js';
import searchRoutes from './routes/search.js';
import documentsRoutes from './routes/documents.js';

const app = express();

// Basic middleware
app.use(express.json());

// Mount routes
app.use('/api/upload', uploadRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/documents', documentsRoutes);

// Test function to list all routes
function listRoutes() {
  console.log('\n📋 NaviDocs API Routes Test\n');
  console.log('✅ Routes loaded successfully!\n');

  const routes = [];

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase()).join(', ');
      routes.push({ method: methods, path: middleware.route.path });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase()).join(', ');
          const basePath = middleware.regexp.source
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '')
            .replace(/\\\//g, '/');
          const cleanPath = basePath.replace(/[^a-zA-Z0-9\/:_-]/g, '');
          routes.push({ method: methods, path: cleanPath + handler.route.path });
        }
      });
    }
  });

  console.log('API Endpoints:\n');

  const grouped = {
    'Upload': [],
    'Jobs': [],
    'Search': [],
    'Documents': []
  };

  routes.forEach(route => {
    if (route.path.includes('/api/upload')) grouped['Upload'].push(route);
    else if (route.path.includes('/api/jobs')) grouped['Jobs'].push(route);
    else if (route.path.includes('/api/search')) grouped['Search'].push(route);
    else if (route.path.includes('/api/documents')) grouped['Documents'].push(route);
  });

  Object.keys(grouped).forEach(group => {
    if (grouped[group].length > 0) {
      console.log(`\n${group}:`);
      grouped[group].forEach(route => {
        console.log(`  ${route.method.padEnd(10)} ${route.path}`);
      });
    }
  });

  console.log('\n✨ Total routes:', routes.length);
  console.log('\n📝 Files created:');
  console.log('  - /server/routes/upload.js');
  console.log('  - /server/routes/jobs.js');
  console.log('  - /server/routes/search.js');
  console.log('  - /server/routes/documents.js');
  console.log('  - /server/services/file-safety.js');
  console.log('  - /server/services/queue.js');
  console.log('  - /server/db/db.js');
  console.log('  - /server/middleware/auth.js');
  console.log('\n🎯 All route modules loaded successfully!\n');
}

// Run test
try {
  listRoutes();
  process.exit(0);
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.error(error.stack);
  process.exit(1);
}
