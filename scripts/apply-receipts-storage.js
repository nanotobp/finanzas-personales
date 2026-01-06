#!/usr/bin/env node

/**
 * Script para aplicar la configuración de storage para receipts
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

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

async function applyReceiptsStorage() {
  try {
    console.log('🔄 Applying receipts storage configuration...\n')
    
    const sqlPath = path.join(__dirname, '../supabase/receipts-storage.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements\n`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Skip comments
      if (statement.trim().startsWith('--')) continue
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        })
        
        if (error) {
          console.error(`  ❌ Error: ${error.message}`)
          // Continue with next statement
        } else {
          console.log(`  ✅ Success`)
        }
      } catch (err) {
        console.error(`  ⚠️  Warning: ${err.message}`)
        // Continue with next statement
      }
    }
    
    console.log('\n✅ Receipts storage configuration completed!')
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

applyReceiptsStorage()
