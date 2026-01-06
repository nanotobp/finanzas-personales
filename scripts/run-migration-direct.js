#!/usr/bin/env node

/**
 * Script para ejecutar la migración 003 directamente en Supabase
 */

const fs = require('fs');
const path = require('path');

// Leer variables de entorno desde .env.local manualmente
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no encontrados en .env.local');
  process.exit(1);
}

// Leer el archivo de migración
const migrationPath = path.join(__dirname, '../supabase/migrations/003_advanced_features.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('🚀 Ejecutando migración de funcionalidades avanzadas...');
console.log(`📄 Archivo: ${migrationPath}`);
console.log(`🌐 Supabase URL: ${supabaseUrl}`);

// Ejecutar la migración usando la REST API de Supabase
async function runMigration() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error ejecutando migración:', error);
      
      // Intentar método alternativo: ejecutar en bloques
      console.log('\n⚠️  Intentando ejecutar en bloques...');
      await runMigrationInChunks();
      return;
    }

    const result = await response.json();
    console.log('✅ Migración ejecutada exitosamente!');
    console.log('📊 Resultado:', result);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Para ejecutar manualmente:');
    console.log('1. Ve a: https://supabase.com/dashboard/project/[tu-proyecto]/sql');
    console.log('2. Copia el contenido de: supabase/migrations/003_advanced_features.sql');
    console.log('3. Pégalo en el editor SQL y ejecuta');
    process.exit(1);
  }
}

async function runMigrationInChunks() {
  // Dividir el SQL en bloques ejecutables
  const blocks = migrationSQL
    .split(';')
    .map(block => block.trim())
    .filter(block => block.length > 0 && !block.startsWith('--'));

  console.log(`📦 Ejecutando ${blocks.length} bloques de SQL...`);

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] + ';';
    console.log(`\n[${i + 1}/${blocks.length}] Ejecutando bloque...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: block });
      if (error) {
        console.warn(`⚠️  Advertencia en bloque ${i + 1}:`, error.message);
        // Continuar con el siguiente bloque
      } else {
        console.log(`✅ Bloque ${i + 1} ejecutado`);
      }
    } catch (error) {
      console.warn(`⚠️  Error en bloque ${i + 1}:`, error.message);
      // Continuar con el siguiente bloque
    }
  }

  console.log('\n✨ Proceso completado. Verifica los resultados en Supabase Dashboard.');
}

// Ejecutar
runMigration().catch(console.error);
