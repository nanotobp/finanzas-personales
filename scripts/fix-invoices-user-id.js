require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAndFixInvoices() {
  // Obtener todas las facturas pagadas
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, user_id, status, paid_date')
    .eq('status', 'paid')
  
  console.log('Facturas pagadas:', invoices?.length || 0)
  
  if (!invoices || invoices.length === 0) {
    console.log('No hay facturas pagadas')
    return
  }
  
  // Agrupar por user_id
  const byUser = invoices.reduce((acc, inv) => {
    if (!acc[inv.user_id]) acc[inv.user_id] = []
    acc[inv.user_id].push(inv.invoice_number)
    return acc
  }, {})
  
  console.log('\nFacturas por usuario:')
  Object.entries(byUser).forEach(([userId, numbers]) => {
    console.log(`User ${userId}: ${numbers.length} facturas - ${numbers.join(', ')}`)
  })
  
  // Obtener todos los usuarios
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
  
  console.log('\nUsuarios en el sistema:')
  profiles?.forEach(p => {
    console.log(`- ${p.id}: ${p.email}`)
  })
}

checkAndFixInvoices()
