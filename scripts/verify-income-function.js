#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function verifyFunction() {
  console.log('🔍 Verificando función generate_income_statement...\n')
  
  try {
    // Intentar llamar la función con parámetros de prueba
    const { data, error } = await supabase.rpc('generate_income_statement', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_period_month: '2026-01-01'
    })
    
    if (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('❌ La función generate_income_statement NO existe')
        console.log('\n📋 Debes ejecutar esta migración en Supabase:')
        console.log('   supabase/migrations/20260110_update_income_statement_function.sql')
        console.log('\n1. Abre https://app.supabase.com')
        console.log('2. Ve a SQL Editor')
        console.log('3. Pega el contenido del archivo')
        console.log('4. Ejecuta')
      } else {
        console.log('✅ La función generate_income_statement EXISTE')
        console.log('   (Error esperado con UUID de prueba)')
        console.log('\nError de prueba:', error.message)
      }
    } else {
      console.log('✅ La función generate_income_statement EXISTE y funciona correctamente')
      console.log('   ID generado:', data)
    }
  } catch (err) {
    console.error('❌ Error al verificar:', err.message)
  }
}

verifyFunction()
