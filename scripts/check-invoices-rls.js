#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRLS() {
  console.log('🔍 Verificando políticas RLS de la tabla invoices...\n')

  try {
    // Verificar políticas usando SQL directo
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'invoices')

    if (error) {
      console.log('⚠️  No se pueden leer las políticas directamente.')
      console.log('   Intentando método alternativo...\n')
      
      // Intentar crear una factura de prueba para ver el error
      const { data: user } = await supabase.auth.admin.listUsers()
      console.log('📋 Usuarios en el sistema:', user?.users?.length || 0)
      
      // Verificar si la tabla existe
      const { data: tables, error: tablesError } = await supabase
        .from('invoices')
        .select('id')
        .limit(1)
      
      if (tablesError) {
        console.error('❌ Error al acceder a la tabla invoices:', tablesError.message)
        console.log('\n📝 Posibles causas:')
        console.log('   1. La tabla invoices no existe')
        console.log('   2. Las políticas RLS están bloqueando el acceso')
        console.log('   3. No has ejecutado el SQL de migración\n')
      } else {
        console.log('✅ La tabla invoices existe')
        console.log('⚠️  Pero las políticas RLS pueden estar incorrectas\n')
      }
    } else {
      console.log('✅ Políticas encontradas:', policies?.length || 0)
      
      if (policies && policies.length > 0) {
        policies.forEach(p => {
          console.log(`\n📌 ${p.policyname}`)
          console.log(`   Comando: ${p.cmd}`)
          console.log(`   Roles: ${p.roles}`)
        })
      }
    }

    // Verificar cliente "Varios"
    console.log('\n🔍 Verificando cliente "Varios"...')
    const { data: varios, error: variosError } = await supabase
      .from('clients')
      .select('id, name, user_id')
      .eq('name', 'Varios')
    
    if (variosError) {
      console.error('❌ Error al verificar cliente "Varios":', variosError.message)
    } else if (!varios || varios.length === 0) {
      console.log('⚠️  No se encontró el cliente "Varios"')
      console.log('   Esto se creará cuando ejecutes el SQL de corrección')
    } else {
      console.log('✅ Cliente "Varios" existe para', varios.length, 'usuario(s)')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n🔧 SOLUCIÓN:')
  console.log('\n1. Abre el SQL Editor de Supabase:')
  console.log('   https://supabase.com/dashboard/project/juygffhwqpjpmwgajcwj/sql/new')
  console.log('\n2. Copia y pega el contenido de:')
  console.log('   supabase/fix-invoices-rls.sql')
  console.log('\n3. Haz clic en "Run" (o Ctrl/Cmd + Enter)')
  console.log('\n4. Deberías ver: "Success. No rows returned"')
  console.log('\n5. Vuelve a cargar tu aplicación')
  console.log('\n' + '='.repeat(60))
}

checkRLS()
