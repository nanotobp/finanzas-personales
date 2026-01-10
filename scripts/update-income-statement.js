require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function updateIncomeStatementFunction() {
  console.log('📊 Actualizando función generate_income_statement...\n')
  
  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../supabase/migrations/20260110_update_income_statement_function.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('❌ Error al ejecutar la migración:', error.message)
      
      // Intentar ejecutar directamente si exec_sql no existe
      console.log('\n🔄 Intentando método alternativo...\n')
      
      // Dividir por comandos y ejecutar uno por uno
      const commands = sql.split(';').filter(cmd => cmd.trim())
      
      for (const command of commands) {
        if (command.trim()) {
          const { error: cmdError } = await supabase.rpc('exec', { 
            query: command.trim() + ';' 
          })
          
          if (cmdError) {
            console.error('❌ Error en comando:', cmdError.message)
            console.log('Comando que falló:', command.substring(0, 100) + '...')
          }
        }
      }
      
      console.log('\n⚠️  La función podría no haberse actualizado correctamente.')
      console.log('💡 Por favor, ejecuta el SQL manualmente en el editor SQL de Supabase:')
      console.log('   https://supabase.com/dashboard/project/_/sql\n')
      console.log('📄 Archivo SQL:', sqlPath)
      
      return
    }
    
    console.log('✅ Función actualizada correctamente')
    console.log('\n📋 La función generate_income_statement ahora incluye:')
    console.log('   • Ingresos de transacciones')
    console.log('   • Ingresos de facturas pagadas (usando campo "amount")')
    console.log('   • IVA cobrado de facturas')
    console.log('   • IRP retenido de facturas')
    console.log('\n✨ Puedes generar estados financieros actualizados desde:')
    console.log('   https://finanzas-personales-virid-theta.vercel.app/rules')
    
  } catch (err) {
    console.error('❌ Error general:', err.message)
    console.log('\n💡 Ejecuta el SQL manualmente en Supabase Dashboard')
  }
}

updateIncomeStatementFunction()
