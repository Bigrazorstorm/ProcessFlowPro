#!/usr/bin/env node
import { execSync } from 'child_process';

console.log('🚀 Starting ProcessFlow Pro Backend...\n');

// Run migrations
console.log('📦 Running database migrations...');
try {
  execSync('pnpm exec typeorm migration:run -d dist/database/data-source.js', { stdio: 'inherit' });
  console.log('✅ Migrations completed\n');
} catch (error) {
  console.error('❌ Migration failed:', error);
  console.log('⚠️  Continuing anyway...\n');
}

// Optionally seed demo data
if (process.env.SEED_DEMO_DATA === 'true') {
  console.log('🌱 Seeding demo data...');
  try {
    execSync('pnpm run seed:demo', { stdio: 'inherit' });
    console.log('✅ Demo data seeded\n');
  } catch (error) {
    console.warn('⚠️  Demo data seeding failed (may already exist):', error.message);
  }
}

// Start the application
console.log('🎯 Starting application...\n');
execSync('node dist/main', { stdio: 'inherit' });
