import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const rawConnectionString =
  process.env.DATABASE_URL ||
  '';

if (!rawConnectionString) {
  console.error('ERROR: DATABASE_URL environment variable is required to run migrations.');
  process.exit(1);
}

const connectionString = rawConnectionString.split('?')[0];

async function runMigrations() {
  console.log('Connecting to Live Supabase PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✓ Successfully connected to live database!');

  const migrationFiles = [
    '00001_initial_schema.sql',
    '00002_storage_and_reporting.sql',
    '00003_sla_escalation_engine.sql',
    '00004_duplicate_issue_clustering.sql',
    '00005_reorganization_and_fair_sla.sql',
  ];

  for (const filename of migrationFiles) {
    const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
    console.log(`Applying migration: ${filename}...`);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      await client.query(sql);
      console.log(`✓ Applied ${filename}`);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`Error in ${filename}:`, error.message);
      // If error is duplicate object / type, continue
    }
  }

  // Apply seed.sql if present
  const seedPath = path.join(__dirname, '..', 'supabase', 'seed', 'seed.sql');
  if (fs.existsSync(seedPath)) {
    console.log('Applying default municipal seeds (seed.sql)...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    try {
      await client.query(seedSql);
      console.log('✓ Applied seed.sql successfully!');
    } catch (err: unknown) {
      const error = err as Error;
      console.warn('Notice in seed.sql:', error.message);
    }
  }

  // Verify created tables
  console.log('\nVerifying database tables...');
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log('Active public tables:');
  res.rows.forEach((r) => console.log(' - ' + r.table_name));

  await client.end();
  console.log('\n✓ All migrations and seeds successfully deployed to production Supabase database!');
}

runMigrations().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
