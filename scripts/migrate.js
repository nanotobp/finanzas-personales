#!/usr/bin/env node

/**
 * Database Migration Runner
 * Applies pending SQL migrations from supabase/migrations directory
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Missing Supabase credentials')
  console.error('Required environment variables:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createMigrationsTable() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  })

  if (error) {
    console.error('Failed to create migrations table:', error)
    process.exit(1)
  }
}

async function getAppliedMigrations() {
  const { data, error } = await supabase
    .from('migrations')
    .select('name')
    .order('name')

  if (error) throw error
  return data.map(row => row.name)
}

async function runMigration(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename)
  const sql = fs.readFileSync(filePath, 'utf8')
  
  // Extract only UP migration (before DOWN comment)
  const upMigration = sql.split(/--\s*DOWN/i)[0]

  console.log(`  Applying: ${filename}`)
  
  const { error } = await supabase.rpc('exec_sql', { sql: upMigration })
  
  if (error) {
    console.error(`  ❌ Failed: ${error.message}`)
    throw error
  }

  // Record migration
  await supabase.from('migrations').insert({ name: filename })
  
  console.log(`  ✅ Success: ${filename}`)
}

async function migrate() {
  try {
    console.log('🔄 Running database migrations...\n')
    
    await createMigrationsTable()
    
    const appliedMigrations = await getAppliedMigrations()
    const allMigrations = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql') && file !== 'README.md')
      .sort()

    const pendingMigrations = allMigrations.filter(
      migration => !appliedMigrations.includes(migration)
    )

    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations')
      return
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s):\n`)

    for (const migration of pendingMigrations) {
      await runMigration(migration)
    }

    console.log('\n✅ All migrations completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  }
}

migrate()
