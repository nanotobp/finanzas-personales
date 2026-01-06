require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 DIAGNÓSTICO SIMPLE DEL ERROR 403\n')

async function test() {
  // Test con service role (admin)
  const adminClient = createClient(supabaseUrl, supabaseServiceKey)
  
  console.log('1️⃣ Test con ADMIN (service_role_key)...')
  const { data: adminRead, error: adminError } = await adminClient
    .from('invoices')
    .select('id, user_id, invoice_number')
    .limit(3)

  if (adminError) {
    console.log('❌ Error:', adminError.message)
  } else {
    console.log('✅ Admin puede leer')
    console.log('   Facturas encontradas:', adminRead.length)
    if (adminRead.length > 0) {
      console.log('   Ejemplo:', adminRead[0])
    }
  }

  // Test con usuario normal
  console.log('\n2️⃣ Test con USUARIO NORMAL (anon_key)...')
  const userClient = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data: userRead, error: userError } = await userClient
    .from('invoices')
    .select('id, user_id, invoice_number')
    .limit(3)

  if (userError) {
    console.log('❌ Error:', userError.message)
    console.log('   Código:', userError.code)
    
    if (userError.code === 'PGRST301') {
      console.log('\n🚨 PROBLEMA CONFIRMADO: RLS está bloqueando TODO')
      console.log('\n📝 SOLUCIÓN DEFINITIVA:')
      console.log('\n   Ejecuta esto en Supabase SQL Editor:')
      console.log('   https://supabase.com/dashboard/project/juygffhwqpjpmwgajcwj/sql/new')
      console.log('\n   ```sql')
      console.log('   -- DESHABILITAR RLS TEMPORALMENTE')
      console.log('   ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;')
      console.log('   ```')
      console.log('\n   Luego prueba crear una factura.')
      console.log('   Si funciona, el problema ERA las políticas RLS.')
      console.log('\n   Después, vuelve a habilitar RLS:')
      console.log('   ```sql')
      console.log('   ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;')
      console.log('   ```')
      console.log('\n   Y ejecuta ESTAS políticas (más simples):')
      console.log('   ```sql')
      console.log('   CREATE POLICY "Allow all for authenticated users" ON invoices')
      console.log('   FOR ALL TO authenticated USING (true) WITH CHECK (true);')
      console.log('   ```')
    }
  } else {
    console.log('✅ Usuario puede leer')
    console.log('   Facturas encontradas:', userRead.length)
  }

  // Verificar que user_id existe en todas las facturas
  console.log('\n3️⃣ Verificando user_id en facturas...')
  const { data: allInvoices } = await adminClient
    .from('invoices')
    .select('id, user_id')
    .is('user_id', null)

  if (allInvoices && allInvoices.length > 0) {
    console.log('⚠️  Hay', allInvoices.length, 'facturas SIN user_id')
    console.log('\n📝 SOLUCIÓN:')
    console.log('   Ejecuta esto para asignar un user_id:')
    console.log('   ```sql')
    console.log('   UPDATE invoices')
    console.log('   SET user_id = (SELECT id FROM auth.users LIMIT 1)')
    console.log('   WHERE user_id IS NULL;')
    console.log('   ```')
  } else {
    console.log('✅ Todas las facturas tienen user_id')
  }
}

test().catch(console.error)
