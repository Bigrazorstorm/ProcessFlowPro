#!/usr/bin/env node
import { execSync } from 'child_process';

console.log('🚀 Starting ProcessFlow Pro Backend (Development)...\n');

// Wait for database to be ready
console.log('⏳ Waiting for database connection...');
let retries = 30;
while (retries > 0) {
  try {
    execSync('node -e "const {Client}=require(\'pg\');const c=new Client({host:process.env.DATABASE_HOST,port:process.env.DATABASE_PORT,user:process.env.DATABASE_USER,password:process.env.DATABASE_PASSWORD,database:\'postgres\'});c.connect().then(()=>{c.end();process.exit(0)}).catch(()=>process.exit(1))"', { stdio: 'pipe' });
    console.log('✅ Database connected\n');
    break;
  } catch (error) {
    retries--;
    if (retries === 0) {
      console.error('❌ Could not connect to database after 30 attempts');
      process.exit(1);
    }
    console.log(`   Retrying... (${30 - retries}/30)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run migrations
console.log('📦 Running database migrations...');
try {
  execSync('pnpm exec typeorm migration:run -d dist/database/data-source.js', { stdio: 'inherit' });
  console.log('✅ Migrations completed\n');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  // Don't exit - migrations might already be applied
  console.log('⚠️  Continuing anyway...\n');
}

// Optionally seed demo data
if (process.env.SEED_DEMO_DATA === 'true') {
  console.log('🌱 Seeding demo data...');
  try {
    execSync('pnpm run seed:demo', { stdio: 'inherit' });
    console.log('✅ Demo data seeded\n');
  } catch (error) {
    console.warn('⚠️  Demo data seeding failed (may already exist)');
    console.log('   Continuing anyway...\n');
  }
}

// Start the development server
console.log('🎯 Starting development server...\n');
execSync('pnpm run dev', { stdio: 'inherit' });
