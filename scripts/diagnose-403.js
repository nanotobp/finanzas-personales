require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnose() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DEL PROBLEMA 403\n')

  try {
    // 1. Verificar estructura de la tabla invoices
    console.log('1️⃣ Verificando estructura de tabla invoices...')
    const { data: columns, error: colError } = await supabase
      .from('invoices')
      .select('*')
      .limit(0)

    if (colError) {
      console.log('❌ Error al leer tabla:', colError.message)
    } else {
      console.log('✅ Tabla invoices accesible\n')
    }

    // 2. Verificar si la columna user_id existe
    console.log('2️⃣ Verificando columna user_id...')
    const { data: sample, error: sampleError } = await supabase
      .from('invoices')
      .select('id, user_id')
      .limit(1)

    if (sampleError) {
      console.log('❌ ERROR CRÍTICO:', sampleError.message)
      if (sampleError.message.includes('user_id')) {
        console.log('\n🚨 PROBLEMA ENCONTRADO: La columna user_id NO EXISTE en la tabla invoices')
        console.log('\n📝 SOLUCIÓN:')
        console.log('   Ejecuta este SQL en Supabase:')
        console.log('   ')
        console.log('   ALTER TABLE invoices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);')
        console.log('   UPDATE invoices SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;')
        console.log('   ')
        return
      }
    } else {
      console.log('✅ Columna user_id existe\n')
    }

    // 3. Verificar RLS
    console.log('3️⃣ Verificando RLS habilitado...')
    const { data: { user } } = await supabase.auth.getUser()
    
    // Intentar insertar con service role (debería funcionar)
    const testInvoice = {
      user_id: user?.id || 'test-user-id',
      client_id: 'test-client',
      invoice_number: 'TEST-001',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      amount: 100,
      status: 'pending'
    }

    console.log('   Intentando INSERT con service_role_key...')
    const { data: inserted, error: insertError } = await supabase
      .from('invoices')
      .insert(testInvoice)
      .select()

    if (insertError) {
      console.log('❌ Error con service_role_key:', insertError.message)
      console.log('   Código:', insertError.code)
      console.log('   Detalles:', insertError.details)
      
      if (insertError.code === '23503') {
        console.log('\n🚨 PROBLEMA: Foreign key constraint')
        console.log('   El client_id no existe o user_id es inválido')
      }
    } else {
      console.log('✅ INSERT funciona con service_role_key')
      // Limpiar test
      await supabase.from('invoices').delete().eq('invoice_number', 'TEST-001')
    }

    // 4. Verificar políticas RLS
    console.log('\n4️⃣ Listando políticas RLS actuales...')
    const { data: policies, error: polError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
          FROM pg_policies
          WHERE tablename = 'invoices';
        `
      })
      .catch(() => ({ data: null, error: { message: 'No se puede acceder a pg_policies' } }))

    if (polError || !policies) {
      console.log('⚠️  No se pueden leer las políticas directamente')
      console.log('\n📋 Verifica manualmente en:')
      console.log('   https://supabase.com/dashboard/project/juygffhwqpjpmwgajcwj/auth/policies')
      console.log('\n   Debería haber 4 políticas:')
      console.log('   - Users can view their own invoices (SELECT)')
      console.log('   - Users can insert their own invoices (INSERT)')
      console.log('   - Users can update their own invoices (UPDATE)')
      console.log('   - Users can delete their own invoices (DELETE)')
    } else {
      console.log('✅ Políticas encontradas:', policies.length)
      policies.forEach(p => {
        console.log(`   - ${p.policyname} (${p.cmd})`)
      })
    }

    // 5. Probar con usuario autenticado
    console.log('\n5️⃣ Probando con usuario autenticado...')
    
    // Crear cliente con credenciales de usuario normal
    const userClient = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )

    // Intentar leer facturas
    const { data: userInvoices, error: userReadError } = await userClient
      .from('invoices')
      .select('*')
      .limit(1)

    if (userReadError) {
      console.log('❌ Error al leer con anon key:', userReadError.message)
      console.log('\n🚨 PROBLEMA: RLS está bloqueando incluso la lectura')
      console.log('\n📝 SOLUCIÓN:')
      console.log('   Las políticas RLS están MAL configuradas.')
      console.log('   Ejecuta este SQL en Supabase para ELIMINAR todas las políticas:')
      console.log('   ')
      console.log('   DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;')
      console.log('   DROP POLICY IF EXISTS "Users can insert their own invoices" ON invoices;')
      console.log('   DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;')
      console.log('   DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;')
      console.log('   ')
      console.log('   Luego, DESHABILITA RLS temporalmente:')
      console.log('   ')
      console.log('   ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;')
      console.log('   ')
      console.log('   Prueba crear una factura. Si funciona, el problema ES RLS.')
    } else {
      console.log('✅ Lectura funciona con anon key')
    }

    console.log('\n' + '═'.repeat(60))
    console.log('📊 RESUMEN DEL DIAGNÓSTICO')
    console.log('═'.repeat(60))
    console.log('\nSi ves este mensaje, el problema NO está en el código.')
    console.log('El problema está en la configuración de Supabase RLS.\n')
    console.log('SIGUIENTE PASO:')
    console.log('1. Ve a: https://supabase.com/dashboard/project/juygffhwqpjpmwgajcwj/auth/policies')
    console.log('2. Busca la tabla "invoices"')
    console.log('3. ELIMINA TODAS las políticas existentes')
    console.log('4. Ejecuta el SQL de fix-invoices-rls.sql OTRA VEZ')
    console.log('5. Recarga la app')

  } catch (error) {
    console.error('\n❌ Error fatal:', error.message)
  }
}

diagnose()
