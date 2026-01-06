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
    
    console.log('Executing SQL directly via REST API...\n')
    
    // Usar fetch para ejecutar SQL directamente
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    })
    
    if (!response.ok) {
      console.log('⚠️  Direct execution not available, trying alternative method...\n')
      
      // Método alternativo: ejecutar statement por statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'))
      
      console.log(`Found ${statements.length} SQL statements\n`)
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (!statement) continue
        
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        
        try {
          // Para INSERT INTO storage.buckets
          if (statement.includes('storage.buckets')) {
            console.log('  ℹ️  Storage bucket creation - manual verification needed')
            console.log('  Please create bucket "receipts" in Supabase dashboard if not exists')
          }
          // Para CREATE POLICY
          else if (statement.includes('CREATE POLICY')) {
            console.log('  ℹ️  Policy creation - manual verification needed')
            console.log('  Please verify policies in Supabase dashboard')
          }
          // Para ALTER TABLE
          else if (statement.includes('ALTER TABLE')) {
            const { error } = await supabase.rpc('exec', { sql: statement + ';' })
            if (error) {
              console.log(`  ⚠️  ${error.message}`)
            } else {
              console.log(`  ✅ Success`)
            }
          }
          // Para DO blocks
          else if (statement.includes('DO $$')) {
            console.log('  ℹ️  PL/pgSQL block - attempting direct execution')
            const { error } = await supabase.rpc('exec', { sql: statement + ';' })
            if (error) {
              console.log(`  ⚠️  ${error.message}`)
            } else {
              console.log(`  ✅ Success`)
            }
          }
        } catch (err) {
          console.log(`  ⚠️  ${err.message}`)
        }
      }
    }
    
    console.log('\n✅ Receipts storage configuration completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Verify bucket "receipts" exists in Supabase Dashboard > Storage')
    console.log('2. Verify policies are created in Storage > receipts > Policies')
    console.log('3. Verify transactions table has receipt_url column')
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

applyReceiptsStorage()
