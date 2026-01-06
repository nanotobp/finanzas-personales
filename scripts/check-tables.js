require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('🔍 Verificando tablas en Supabase...\n')

  const tables = [
    'tax_settings',
    'income_statements',
    'balance_sheets',
    'cash_flow_statements'
  ]

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`❌ ${table}: NO EXISTE o tiene error`)
        console.log(`   Error: ${error.message}\n`)
      } else {
        console.log(`✅ ${table}: EXISTE (${data.length} registros en sample)`)
      }
    } catch (e) {
      console.log(`❌ ${table}: ERROR - ${e.message}\n`)
    }
  }

  // Verificar vista
  try {
    const { data, error } = await supabase
      .from('monthly_tax_summary')
      .select('*')
      .limit(1)

    if (error) {
      console.log(`❌ monthly_tax_summary (vista): NO EXISTE`)
      console.log(`   Error: ${error.message}`)
    } else {
      console.log(`✅ monthly_tax_summary (vista): EXISTE`)
    }
  } catch (e) {
    console.log(`❌ monthly_tax_summary: ERROR - ${e.message}`)
  }

  // Verificar si transactions tiene columnas de impuestos
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('iva_amount, irp_amount')
      .limit(1)

    if (error) {
      console.log(`\n❌ Columnas de impuestos en transactions: NO EXISTEN`)
      console.log(`   Error: ${error.message}`)
    } else {
      console.log(`\n✅ Columnas de impuestos en transactions: EXISTEN`)
    }
  } catch (e) {
    console.log(`\n❌ Columnas de impuestos: ERROR - ${e.message}`)
  }
}

checkTables().catch(console.error)
