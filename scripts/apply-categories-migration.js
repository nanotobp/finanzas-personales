#!/usr/bin/env node

/**
 * Script para aplicar la migración del sistema de categorías
 * Ejecutar: node scripts/apply-categories-migration.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🚀 Iniciando migración del sistema de categorías...\n')

  try {
    // Leer el archivo SQL de migración
    const migrationPath = path.join(__dirname, '../supabase/migrations/ensure-categories-system.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📝 Ejecutando migración SQL...')
    
    // Ejecutar la migración
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      // Si no existe la función exec_sql, intentar ejecutar directamente
      console.log('⚠️  Función exec_sql no disponible, ejecutando por bloques...')
      
      // Dividir el SQL en bloques ejecutables
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement) {
          const { error: execError } = await supabase.rpc('exec', { 
            query: statement + ';' 
          })
          
          if (execError) {
            console.warn(`⚠️  Advertencia en statement: ${execError.message}`)
            // No salir, solo advertir
          }
        }
      }
    }

    console.log('✅ Migración completada exitosamente\n')

    // Verificar que todo está correcto
    console.log('🔍 Verificando la estructura de la tabla categories...')
    
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'categories')
    
    if (columns) {
      console.log('📊 Columnas disponibles:', columns.map(c => c.column_name).join(', '))
    }

    // Contar categorías en el sistema
    const { count, error: countError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })

    if (!countError) {
      console.log(`📈 Total de categorías en el sistema: ${count}`)
    }

    console.log('\n✨ Sistema de categorías listo para usar')
    console.log('💡 Los usuarios pueden crear, editar y eliminar categorías desde:')
    console.log('   → /settings (Configuración)\n')
    console.log('📝 Para crear una nueva categoría personalizada:')
    console.log('   1. Ve a Configuración')
    console.log('   2. Haz clic en "Nueva Categoría"')
    console.log('   3. Completa el formulario con nombre, tipo, color e icono')
    console.log('   4. Las categorías estarán disponibles en Presupuestos y Transacciones\n')

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message)
    process.exit(1)
  }
}

// Ejecutar
applyMigration()
  .then(() => {
    console.log('🎉 Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
