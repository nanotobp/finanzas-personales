require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const adminClient = createClient(supabaseUrl, serviceRoleKey)
const userClient = createClient(supabaseUrl, anonKey)

async function testInserts() {
  console.log('\n🔍 DIAGNÓSTICO COMPLETO DE INSERT EN INVOICES\n')
  console.log('='.repeat(60))

  // 1. Verificar estructura de la tabla
  console.log('\n1️⃣ Verificando estructura de tabla invoices...')
  const { data: columns, error: colError } = await adminClient
    .from('invoices')
    .select('*')
    .limit(0)
  
  if (colError) {
    console.log('❌ Error al obtener estructura:', colError.message)
  } else {
    console.log('✅ Tabla invoices existe')
  }

  // 2. Ver las políticas RLS actuales
  console.log('\n2️⃣ Verificando políticas RLS...')
  try {
    const { data: policies } = await adminClient.rpc('get_policies', {
      table_name: 'invoices'
    })
    if (policies) {
      console.log('Políticas encontradas:', policies)
    }
  } catch (e) {
    console.log('⚠️ No se pudieron obtener políticas (puede ser normal)')
  }

  // 3. Test INSERT con ADMIN (service_role_key)
  console.log('\n3️⃣ Test INSERT con ADMIN (service_role_key)...')
  const testInvoiceAdmin = {
    invoice_number: `TEST-ADMIN-${Date.now()}`,
    client_id: 1, // Asumiendo que existe cliente con id 1
    amount: 100.50,
    status: 'pending',
    issue_date: new Date().toISOString().split('T')[0],
    user_id: '00000000-0000-0000-0000-000000000001' // UUID de prueba
  }

  const { data: adminInsert, error: adminError } = await adminClient
    .from('invoices')
    .insert([testInvoiceAdmin])
    .select()

  if (adminError) {
    console.log('❌ Admin NO puede insertar:', adminError.message)
    console.log('   Código:', adminError.code)
    console.log('   Detalles:', adminError.details)
    console.log('   Hint:', adminError.hint)
  } else {
    console.log('✅ Admin puede insertar')
    console.log('   ID creado:', adminInsert[0]?.id)
    
    // Limpiar
    await adminClient.from('invoices').delete().eq('id', adminInsert[0].id)
  }

  // 4. Test INSERT con USER (anon_key) - sin autenticar
  console.log('\n4️⃣ Test INSERT con USER no autenticado (anon_key)...')
  const testInvoiceUser = {
    invoice_number: `TEST-USER-${Date.now()}`,
    client_id: 1,
    amount: 200.75,
    status: 'pending',
    issue_date: new Date().toISOString().split('T')[0],
    user_id: '00000000-0000-0000-0000-000000000001'
  }

  const { data: userInsert, error: userError } = await userClient
    .from('invoices')
    .insert([testInvoiceUser])
    .select()

  if (userError) {
    console.log('❌ Usuario NO puede insertar:', userError.message)
    console.log('   Código:', userError.code)
    console.log('   Detalles:', userError.details)
  } else {
    console.log('✅ Usuario puede insertar')
    await adminClient.from('invoices').delete().eq('id', userInsert[0].id)
  }

  // 5. Verificar si RLS está habilitado
  console.log('\n5️⃣ Verificando estado de RLS...')
  try {
    const { data: rlsStatus } = await adminClient
      .rpc('check_rls_status', { table_name: 'invoices' })
    if (rlsStatus !== null) {
      console.log('RLS habilitado:', rlsStatus)
    }
  } catch (e) {
    console.log('⚠️ No se pudo verificar RLS')
  }

  // 6. Intentar ver constraints de la tabla
  console.log('\n6️⃣ Verificando constraints...')
  try {
    const { data: constraints } = await adminClient
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'invoices')
    if (constraints) {
      console.log('Constraints:', constraints)
    }
  } catch (e) {
    console.log('⚠️ No se pudieron obtener constraints')
  }

  console.log('\n' + '='.repeat(60))
  console.log('\n💡 RESULTADO:')
  
  if (adminError && userError) {
    console.log('🚨 AMBOS FALLAN - Problema en la tabla o constraints')
    console.log('   Revisa foreign keys, check constraints, o columnas NOT NULL')
  } else if (!adminError && userError) {
    console.log('🔒 Solo ADMIN puede insertar - Problema de RLS')
    console.log('   Necesitas ejecutar fix-invoices-rls.sql')
  } else if (!adminError && !userError) {
    console.log('✅ AMBOS PUEDEN INSERTAR - RLS configurado correctamente')
    console.log('   El problema puede ser en el frontend (auth, payload)')
  }
  
  console.log('\n')
}

testInserts().catch(console.error)
