const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function fixPaidDates() {
  try {
    console.log('🔍 Buscando facturas pagadas sin paid_date...')
    
    // Obtener facturas con status 'paid' pero sin paid_date
    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, issue_date, status')
      .eq('status', 'paid')
      .is('paid_date', null)
    
    if (fetchError) {
      console.error('❌ Error al buscar facturas:', fetchError)
      return
    }
    
    if (!invoices || invoices.length === 0) {
      console.log('✅ No hay facturas que necesiten corrección')
      return
    }
    
    console.log(`📝 Encontradas ${invoices.length} facturas para actualizar:`)
    invoices.forEach(inv => {
      console.log(`  - Factura ${inv.invoice_number}: ${inv.amount}`)
    })
    
    // Actualizar cada factura con paid_date = issue_date
    for (const invoice of invoices) {
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ 
          paid_date: invoice.issue_date // Usar la fecha de emisión como fecha de pago
        })
        .eq('id', invoice.id)
      
      if (updateError) {
        console.error(`❌ Error al actualizar factura ${invoice.invoice_number}:`, updateError)
      } else {
        console.log(`✅ Actualizada factura ${invoice.invoice_number} con paid_date: ${invoice.issue_date}`)
      }
    }
    
    console.log('✅ Proceso completado')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixPaidDates()
