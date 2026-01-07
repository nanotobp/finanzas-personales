require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkAllInvoices() {
  console.log('🔍 Verificando TODAS las facturas...\n')
  
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('invoice_number, status, paid_date, amount, iva_amount, irp_withheld, issue_date')
    .order('invoice_number')
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  console.log(`📋 Total de facturas: ${invoices.length}\n`)
  
  const byStatus = {}
  
  invoices.forEach(inv => {
    if (!byStatus[inv.status]) {
      byStatus[inv.status] = []
    }
    byStatus[inv.status].push(inv)
  })
  
  Object.keys(byStatus).forEach(status => {
    console.log(`\n📊 Status: ${status.toUpperCase()} (${byStatus[status].length} facturas)`)
    console.log('─'.repeat(60))
    byStatus[status].forEach(inv => {
      console.log(`  ${inv.invoice_number} - ₲${Number(inv.amount).toLocaleString()} - Emitida: ${inv.issue_date} - Pago: ${inv.paid_date || 'N/A'}`)
    })
  })
  
  console.log('\n\n📊 RESUMEN POR STATUS:')
  Object.keys(byStatus).forEach(status => {
    console.log(`  ${status}: ${byStatus[status].length}`)
  })
}

checkAllInvoices().catch(console.error)
