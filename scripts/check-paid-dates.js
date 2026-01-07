require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkPaidInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount, status, paid_date, created_at')
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('Facturas pagadas:')
  data.forEach(inv => {
    console.log(`- Nº ${inv.invoice_number}: Gs. ${inv.amount.toLocaleString('es-PY')}`)
    console.log(`  Fecha creación: ${inv.created_at}`)
    console.log(`  Fecha de pago: ${inv.paid_date || 'NO TIENE PAID_DATE ❌'}`)
    console.log('')
  })
  
  const withoutPaidDate = data.filter(inv => !inv.paid_date)
  if (withoutPaidDate.length > 0) {
    console.log(`⚠️  ${withoutPaidDate.length} facturas pagadas SIN paid_date`)
  }
}

checkPaidInvoices()
