/**
 * Script para ejecutar la migración de funcionalidades avanzadas
 * Uso: node scripts/execute-migration.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Leer variables de entorno desde .env.local
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Si no están en process.env, intentar leer de .env.local
if (!supabaseUrl || !supabaseKey) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8')
    const envVars = {}
    envFile.split('\n').forEach(line => {
      const [key, ...values] = line.split('=')
      if (key && values.length) {
        envVars[key.trim()] = values.join('=').trim()
      }
    })
    supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
    supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
  } catch (err) {
    console.error('⚠️  No se pudo leer .env.local')
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno')
  console.error('Asegúrate de que .env.local contenga:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeMigration() {
  console.log('🚀 Iniciando migración de funcionalidades avanzadas...\n')
  
  const migrationFile = path.join(__dirname, '../supabase/migrations/003_advanced_features.sql')
  
  if (!fs.existsSync(migrationFile)) {
    console.error('❌ Error: No se encontró el archivo de migración')
    process.exit(1)
  }
  
  console.log('📄 Leyendo archivo de migración...')
  const sql = fs.readFileSync(migrationFile, 'utf8')
  
  console.log('📊 Ejecutando SQL en Supabase...\n')
  console.log('⚠️  NOTA: Este script requiere permisos de administrador')
  console.log('    Si falla, ejecuta manualmente en el SQL Editor de Supabase Dashboard\n')
  
  // Dividir el SQL en statements individuales
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  console.log(`📝 Total de statements a ejecutar: ${statements.length}\n`)
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'
    
    // Extraer el nombre de la tabla o función del statement
    const match = statement.match(/CREATE TABLE.*?(\w+)\s*\(/i) ||
                 statement.match(/CREATE.*?FUNCTION\s+(\w+)/i) ||
                 statement.match(/CREATE INDEX.*?ON\s+(\w+)/i) ||
                 statement.match(/ALTER TABLE\s+(\w+)/i)
    
    const entityName = match ? match[1] : `statement ${i + 1}`
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
      
      if (error) {
        // Intentar ejecutar directamente si rpc falla
        console.log(`⚠️  RPC no disponible, intenta ejecutar manualmente: ${entityName}`)
        errorCount++
      } else {
        console.log(`✅ ${entityName}`)
        successCount++
      }
    } catch (err) {
      console.log(`⚠️  ${entityName}: ${err.message}`)
      errorCount++
    }
  }
  
  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ Completados: ${successCount}`)
  console.log(`⚠️  Con advertencias: ${errorCount}`)
  console.log(`${'='.repeat(50)}\n`)
  
  if (errorCount > 0) {
    console.log('⚠️  Algunas queries no se pudieron ejecutar automáticamente')
    console.log('\n📖 INSTRUCCIONES MANUALES:\n')
    console.log('1. Abre Supabase Dashboard: https://app.supabase.com')
    console.log('2. Selecciona tu proyecto')
    console.log('3. Ve a "SQL Editor" en el menú lateral')
    console.log('4. Crea un nuevo query')
    console.log('5. Copia y pega el contenido de:')
    console.log(`   ${migrationFile}`)
    console.log('6. Ejecuta el query\n')
  } else {
    console.log('🎉 ¡Migración completada exitosamente!\n')
    console.log('✨ Nuevas funcionalidades disponibles:')
    console.log('   - Sistema de Gamificación (logros, niveles, puntos)')
    console.log('   - Hábitos Financieros')
    console.log('   - Objetivos SMART con tracking diario')
    console.log('   - Análisis Predictivo de Flujo de Caja')
    console.log('   - Categorización Inteligente con ML')
    console.log('   - Sistema de Benchmarking')
    console.log('   - Notificaciones Proactivas')
    console.log('   - Reportes Automatizados\n')
  }
  
  // Verificar que las tablas se crearon
  console.log('🔍 Verificando tablas creadas...\n')
  
  const tablesToCheck = [
    'achievements',
    'user_achievements',
    'user_points',
    'financial_habits',
    'habit_completions',
    'goal_daily_tracking',
    'goal_milestones',
    'notifications',
    'automated_reports',
    'generated_reports'
  ]
  
  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select('count')
      .limit(1)
    
    if (error) {
      console.log(`❌ ${table}: No encontrada o sin permisos`)
    } else {
      console.log(`✅ ${table}: OK`)
    }
  }
  
  console.log('\n✨ Migración finalizada')
}

executeMigration().catch(err => {
  console.error('\n❌ Error durante la migración:', err)
  process.exit(1)
})
