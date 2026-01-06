require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const adminClient = createClient(supabaseUrl, serviceRoleKey)
const userClient = createClient(supabaseUrl, anonKey)

async function testRealInsert() {
  console.log('\n🧪 TEST DE INSERT REAL EN INVOICES\n')
  
  // Obtener un cliente real
  const { data: clients } = await adminClient
    .from('clients')
    .select('id, name')
    .limit(1)
  
  if (!clients || clients.length === 0) {
    console.log('❌ No hay clientes para probar')
    return
  }
  
  const testClient = clients[0]
  console.log(`✅ Usando cliente: ${testClient.name} (${testClient.id})`)
  
  // Obtener un user_id real
  const { data: users } = await adminClient.auth.admin.listUsers()
  if (!users || users.users.length === 0) {
    console.log('❌ No hay usuarios para probar')
    return
  }
  
  const testUser = users.users[0]
  console.log(`✅ Usando usuario: ${testUser.email} (${testUser.id})`)
  
  // Test 1: INSERT con ADMIN
  console.log('\n1️⃣ Test INSERT con ADMIN (service_role_key)...')
  const invoiceAdmin = {
    invoice_number: `TEST-ADMIN-${Date.now()}`,
    client_id: testClient.id,
    user_id: testUser.id,
    amount: 100.50,
    status: 'pending',
    payment_method: 'bank_transfer',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }
  
  const { data: adminResult, error: adminError } = await adminClient
    .from('invoices')
    .insert([invoiceAdmin])
    .select()
  
  if (adminError) {
    console.log('❌ ADMIN FALLÓ:', adminError.message)
    console.log('   Código:', adminError.code)
    console.log('   Detalles:', adminError.details)
    console.log('   Hint:', adminError.hint)
  } else {
    console.log('✅ ADMIN puede insertar!')
    console.log('   ID creado:', adminResult[0].id)
    
    // Limpiar
    await adminClient.from('invoices').delete().eq('id', adminResult[0].id)
    console.log('   ✅ Factura de prueba eliminada')
  }
  
  // Test 2: INSERT con USER (anon_key, sin autenticar)
  console.log('\n2️⃣ Test INSERT con USER no autenticado (anon_key)...')
  const invoiceUser = {
    invoice_number: `TEST-USER-${Date.now()}`,
    client_id: testClient.id,
    user_id: testUser.id,
    amount: 200.75,
    status: 'pending',
    payment_method: 'bank_transfer',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }
  
  const { data: userResult, error: userError } = await userClient
    .from('invoices')
    .insert([invoiceUser])
    .select()
  
  if (userError) {
    console.log('❌ USER NO AUTENTICADO FALLÓ:', userError.message)
    console.log('   Código:', userError.code)
    console.log('   Esto es ESPERADO si RLS está habilitado')
  } else {
    console.log('⚠️ USER puede insertar sin autenticar (RLS deshabilitado?)')
    await adminClient.from('invoices').delete().eq('id', userResult[0].id)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('\n💡 CONCLUSIÓN:')
  
  if (!adminError && userError) {
    console.log('🔒 RLS está funcionando correctamente')
    console.log('   ✅ Admin puede insertar')
    console.log('   ❌ Usuario no autenticado NO puede insertar')
    console.log('\n📝 SIGUIENTE PASO:')
    console.log('   El problema está en el FRONTEND')
    console.log('   Necesitas autenticarte antes de crear facturas')
    console.log('   Verifica que el usuario esté logueado')
  } else if (!adminError && !userError) {
    console.log('⚠️ RLS está DESHABILITADO')
    console.log('   Ambos pueden insertar sin restricciones')
    console.log('\n📝 EJECUTA: npm run fix:invoices')
  } else if (adminError) {
    console.log('🚨 HAY UN PROBLEMA EN LA TABLA')
    console.log('   Ni siquiera el admin puede insertar')
    console.log('   Revisa constraints, triggers o columnas requeridas')
  }
  
  console.log('\n')
}

testRealInsert().catch(console.error)
