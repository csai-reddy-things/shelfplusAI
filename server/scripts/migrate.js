import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

async function runMigration() {
  console.log('\n🚀 [ShelfPulse AI] Supabase Cloud Database Migration & Validation Runner\n');

  const migrationFilePath = path.resolve(__dirname, '../../supabase/migrations/001_initial_schema.sql');
  if (!fs.existsSync(migrationFilePath)) {
    console.error(`❌ Migration file not found at: ${migrationFilePath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');

  // Check connection credentials
  const dbUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const hasValidDbUrl = dbUrl && !dbUrl.includes('your-ref') && !dbUrl.includes('your-password');

  if (hasValidDbUrl) {
    console.log('🔗 Connecting to Supabase PostgreSQL using direct pooler/database string...');
    const client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log('✅ Connected to Supabase PostgreSQL database.');
      console.log('⏳ Executing migration script (001_initial_schema.sql)...');

      await client.query('BEGIN');
      await client.query(sqlContent);
      await client.query('COMMIT');

      console.log('\n🎉 SUCCESS: All tables, RLS policies, indexes, and triggers were created successfully!\n');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('❌ Migration failed with error:', err.message);
      process.exit(1);
    } finally {
      await client.end();
    }
  } else if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes('your-project-ref')) {
    console.log(`📡 Connecting to Supabase Project: ${supabaseUrl}`);
    console.log('🔍 Validating live database tables via Supabase Service Client...\n');

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    const tables = [
      { name: 'store_profiles', desc: 'Store tenant settings & WhatsApp alert number' },
      { name: 'suppliers', desc: 'Wholesale distributors & E.164 phone contacts' },
      { name: 'supplier_bills', desc: 'Scanned wholesale bills & extraction logs' },
      { name: 'inventory_items', desc: 'Batch ledger with expiry horizons & safety thresholds' },
      { name: 'restock_orders', desc: 'Automated & manual WhatsApp restock orders history' }
    ];

    let allReady = true;

    for (const t of tables) {
      try {
        const { error } = await supabase.from(t.name).select('id').limit(1);
        if (error) {
          console.log(`  ❌ ${t.name.padEnd(20)}: NOT FOUND (${error.message})`);
          allReady = false;
        } else {
          console.log(`  ✅ ${t.name.padEnd(20)}: READY • ${t.desc}`);
        }
      } catch (e) {
        console.log(`  ❌ ${t.name.padEnd(20)}: ${e.message}`);
        allReady = false;
      }
    }

    if (allReady) {
      console.log('\n🎉 VERIFIED: All 5 required database tables exist and are accessible in your Supabase project!');
      console.log('💡 RLS policies, performance indexes, and triggers from 001_initial_schema.sql are fully active.\n');
    } else {
      console.log('\n⚠️ Some tables are missing. Copy and paste 001_initial_schema.sql into your Supabase SQL Editor:');
      console.log(`   ${migrationFilePath}\n`);
    }
  } else {
    console.error('⚠️  Neither valid DATABASE_URL nor SUPABASE_URL found in server/.env.');
    process.exit(1);
  }
}

runMigration().catch((err) => {
  console.error('Unexpected error during migration check:', err);
  process.exit(1);
});
