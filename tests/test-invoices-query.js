require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testQuery() {
  // Simular login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'codigocentercloud@gmail.com',
    password: process.env.TEST_PASSWORD || 'test123'
  })
  
  if (authError) {
    console.log('Error de autenticación:', authError.message)
    console.log('Intenta sin autenticación...')
  }

  const startDate = '2026-01-01'
  const endDate = '2026-01-31'

  const { data: allInvoices, error } = await supabase
    .from('invoices')
    .select('amount, paid_date, invoice_number, status')
    .eq('status', 'paid')

  console.log('Total facturas pagadas:', allInvoices?.length || 0)
  console.log('Facturas:', allInvoices)
  if (error) console.log('Error:', error)

  const filtered = allInvoices?.filter(inv => 
    inv.paid_date && inv.paid_date >= startDate && inv.paid_date <= endDate
  ) || []

  console.log('\nFacturas en enero 2026:', filtered.length)
  console.log('Facturas filtradas:', filtered)
  
  const total = filtered.reduce((sum, i) => sum + Number(i.amount), 0)
  console.log('\nTotal ingresos de facturas:', total.toLocaleString('es-PY'))
}

testQuery()
