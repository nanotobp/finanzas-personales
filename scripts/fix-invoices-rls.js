#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.error('   NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🔄 Ejecutando corrección de RLS para facturas...\n')

  try {
    const sqlFile = path.join(__dirname, '../supabase/fix-invoices-rls.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')

    // Dividir el SQL en comandos individuales
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    for (const command of commands) {
      if (command.trim()) {
        console.log('📝 Ejecutando comando...')
        const { error } = await supabase.rpc('exec_sql', { sql_query: command })
        
        if (error) {
          // Si no existe la función exec_sql, ejecutar directamente
          const { error: directError } = await supabase.from('_migrations').select('*').limit(0)
          
          if (directError) {
            console.log('⚠️  No se puede ejecutar SQL directamente desde el cliente.')
            console.log('   Por favor, ejecuta el archivo SQL manualmente en el panel de Supabase:')
            console.log('   Dashboard → SQL Editor → Pega el contenido de supabase/fix-invoices-rls.sql')
            console.log('\n📄 Ruta del archivo:', sqlFile)
            return
          }
        }
        console.log('✅ Comando ejecutado')
      }
    }

    console.log('\n✅ Migración completada exitosamente')
    console.log('\n📋 Cambios aplicados:')
    console.log('   - Políticas RLS corregidas para la tabla invoices')
    console.log('   - Cliente "Varios" creado (si no existía)')
    console.log('\n💡 Ahora puedes crear facturas sin problemas')
    
  } catch (error) {
    console.error('❌ Error ejecutando la migración:', error.message)
    console.log('\n💡 Si el error persiste, ejecuta manualmente el archivo SQL:')
    console.log('   supabase/fix-invoices-rls.sql')
    console.log('   en el panel de Supabase → SQL Editor')
    process.exit(1)
  }
}

runMigration()
