require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkColumns() {
  console.log('🔍 Verificando columnas de la tabla invoices...\n')
  
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .limit(1)
  
  if (error) {
    console.log('❌ Error:', error.message)
    return
  }
  
  if (data && data.length > 0) {
    console.log('📋 Columnas disponibles:')
    Object.keys(data[0]).forEach(col => console.log(`   - ${col}`))
  } else {
    console.log('⚠️  No hay facturas para verificar columnas')
    console.log('   Verificando con metadata...')
  }
}

checkColumns().catch(console.error)
