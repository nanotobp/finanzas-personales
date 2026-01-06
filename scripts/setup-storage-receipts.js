#!/usr/bin/env node

/**
 * Script para aplicar manualmente la configuración de storage para receipts
 * usando SQL directo a través del cliente de Supabase
 */

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

async function setupReceiptsStorage() {
  console.log('🔄 Setting up receipts storage...\n')
  
  try {
    // 1. Crear el bucket
    console.log('1. Creating receipts bucket...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('  ❌ Error listing buckets:', listError.message)
    } else {
      const existingBucket = buckets.find(b => b.name === 'receipts')
      if (existingBucket) {
        console.log('  ℹ️  Bucket "receipts" already exists')
      } else {
        const { data, error } = await supabase.storage.createBucket('receipts', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        })
        
        if (error) {
          console.error('  ❌ Error creating bucket:', error.message)
        } else {
          console.log('  ✅ Bucket "receipts" created successfully')
        }
      }
    }
    
    // 2. Agregar columna receipt_url a transactions
    console.log('\n2. Adding receipt_url column to transactions...')
    const { error: alterError } = await supabase.rpc('exec', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'transactions' 
            AND column_name = 'receipt_url'
          ) THEN
            ALTER TABLE transactions ADD COLUMN receipt_url TEXT;
          END IF;
        END $$;
      `
    })
    
    if (alterError) {
      console.log('  ⚠️  Could not add column via RPC, try manual SQL execution')
      console.log('  SQL to run in Supabase Dashboard > SQL Editor:')
      console.log(`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;
      COMMENT ON COLUMN transactions.receipt_url IS 'URL pública de la factura/recibo almacenada en Supabase Storage';
      `)
    } else {
      console.log('  ✅ Column added successfully')
    }
    
    console.log('\n✅ Storage setup completed!')
    console.log('\n📋 Manual steps required:')
    console.log('1. Go to Supabase Dashboard > Storage > receipts > Policies')
    console.log('2. Add the following policies:')
    console.log('\n   Policy: "Users can upload their own receipts"')
    console.log('   - Operation: INSERT')
    console.log('   - Policy definition: auth.uid()::text = (storage.foldername(name))[1]')
    console.log('\n   Policy: "Users can view their own receipts"')
    console.log('   - Operation: SELECT')
    console.log('   - Policy definition: auth.uid()::text = (storage.foldername(name))[1]')
    console.log('\n   Policy: "Users can update their own receipts"')
    console.log('   - Operation: UPDATE')
    console.log('   - Policy definition: auth.uid()::text = (storage.foldername(name))[1]')
    console.log('\n   Policy: "Users can delete their own receipts"')
    console.log('   - Operation: DELETE')
    console.log('   - Policy definition: auth.uid()::text = (storage.foldername(name))[1]')
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

setupReceiptsStorage()
