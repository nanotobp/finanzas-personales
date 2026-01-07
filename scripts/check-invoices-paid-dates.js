require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkInvoices() {
  console.log('🔍 Verificando facturas pagadas...\n')
  
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('invoice_number, status, paid_date, amount, iva_amount, irp_withheld, issue_date')
    .eq('status', 'paid')
    .order('invoice_number')
  
  if (error) {
    console.error('❌ Error:', error.message)
    return
  }
  
  console.log(`📋 Total de facturas pagadas: ${invoices.length}\n`)
  
  let withDate = 0
  let withoutDate = 0
  
  invoices.forEach(inv => {
    console.log(`Factura: ${inv.invoice_number}`)
    console.log(`  Status: ${inv.status}`)
    console.log(`  Fecha emisión: ${inv.issue_date}`)
    console.log(`  Fecha pago: ${inv.paid_date || '❌ NO TIENE'}`)
    console.log(`  Monto: ₲${Number(inv.amount).toLocaleString()}`)
    console.log(`  IVA: ₲${Number(inv.iva_amount || 0).toLocaleString()}`)
    console.log(`  IRP: ₲${Number(inv.irp_withheld || 0).toLocaleString()}`)
    console.log('')
    
    if (inv.paid_date) {
      withDate++
    } else {
      withoutDate++
    }
  })
  
  console.log('📊 RESUMEN:')
  console.log(`  ✅ Con fecha de pago: ${withDate}`)
  console.log(`  ❌ Sin fecha de pago: ${withoutDate}`)
  console.log(`  📋 Total: ${invoices.length}`)
}

checkInvoices().catch(console.error)
