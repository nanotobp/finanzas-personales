require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const adminClient = createClient(supabaseUrl, serviceRoleKey)

async function showSchema() {
  console.log('\n📋 ESTRUCTURA DE LA TABLA INVOICES\n')
  
  // Obtener un cliente para ver su estructura
  const { data: clients } = await adminClient
    .from('clients')
    .select('*')
    .limit(3)
  
  console.log('🧑‍💼 Clientes disponibles:')
  if (clients && clients.length > 0) {
    clients.forEach(c => {
      console.log(`   ID: ${c.id} (${typeof c.id}) - ${c.name}`)
    })
  } else {
    console.log('   ⚠️ No hay clientes')
  }
  
  // Obtener una factura de ejemplo si existe
  const { data: invoices } = await adminClient
    .from('invoices')
    .select('*')
    .limit(1)
  
  console.log('\n📄 Factura de ejemplo:')
  if (invoices && invoices.length > 0) {
    console.log(JSON.stringify(invoices[0], null, 2))
  } else {
    console.log('   ⚠️ No hay facturas')
  }
  
  console.log('\n')
}

showSchema().catch(console.error)
