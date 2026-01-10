const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkPaidInvoices() {
  try {
    console.log('🔍 Revisando facturas pagadas...\n')
    
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, status, issue_date, paid_date, client:clients(name)')
      .eq('status', 'paid')
      .order('paid_date', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('❌ Error:', error)
      return
    }
    
    if (!invoices || invoices.length === 0) {
      console.log('❌ No hay facturas pagadas')
      return
    }
    
    console.log(`✅ Encontradas ${invoices.length} facturas pagadas:\n`)
    
    invoices.forEach(inv => {
      console.log(`📄 Factura ${inv.invoice_number || 'N/A'}`)
      console.log(`   Cliente: ${inv.client?.name || 'N/A'}`)
      console.log(`   Monto: ₲${inv.amount.toLocaleString('es-PY')}`)
      console.log(`   Fecha emisión: ${inv.issue_date || 'N/A'}`)
      console.log(`   Fecha pago: ${inv.paid_date || 'SIN FECHA'}`)
      console.log(`   Status: ${inv.status}`)
      console.log('')
    })
    
    const total = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
    console.log(`💰 Total de las últimas 10 facturas pagadas: ₲${total.toLocaleString('es-PY')}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkPaidInvoices()
