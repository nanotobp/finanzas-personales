const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testIncomeQuery() {
  try {
    const monthFilter = '2026-01' // Enero 2026
    const [year, month] = monthFilter.split('-')
    const startDate = `${monthFilter}-01`
    const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]

    console.log('📅 Filtrando por:')
    console.log(`   Mes: ${monthFilter}`)
    console.log(`   Desde: ${startDate}`)
    console.log(`   Hasta: ${endDate}\n`)

    // Query para facturas pagadas (igual que en el componente)
    console.log('🔍 Query de facturas pagadas...')
    const { data: paidInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*, client:clients(id, name)')
      .eq('status', 'paid')
      .not('paid_date', 'is', null)
      .gte('paid_date', startDate)
      .lte('paid_date', endDate)
      .order('paid_date', { ascending: false })

    if (invoicesError) {
      console.error('❌ Error en facturas:', invoicesError)
    } else {
      console.log(`✅ Facturas encontradas: ${paidInvoices?.length || 0}`)
      if (paidInvoices && paidInvoices.length > 0) {
        paidInvoices.forEach(inv => {
          console.log(`   📄 ${inv.invoice_number}: ₲${Number(inv.amount).toLocaleString('es-PY')} (${inv.paid_date})`)
        })
        const total = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
        console.log(`   💰 Total: ₲${total.toLocaleString('es-PY')}`)
      }
    }

    console.log('\n🔍 Query de otros ingresos...')
    const { data: otherIncome, error: otherError } = await supabase
      .from('transactions')
      .select('*, categories(name, icon, color), clients(name)')
      .eq('type', 'income')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (otherError) {
      console.error('❌ Error en otros ingresos:', otherError)
    } else {
      console.log(`✅ Otros ingresos encontrados: ${otherIncome?.length || 0}`)
      if (otherIncome && otherIncome.length > 0) {
        otherIncome.forEach(inc => {
          console.log(`   💵 ${inc.description}: ₲${Number(inc.amount).toLocaleString('es-PY')} (${inc.date})`)
        })
        const total = otherIncome.reduce((sum, inc) => sum + Number(inc.amount), 0)
        console.log(`   💰 Total: ₲${total.toLocaleString('es-PY')}`)
      }
    }

    // Total combinado
    const totalInvoices = paidInvoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0
    const totalOther = otherIncome?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0
    const grandTotal = totalInvoices + totalOther

    console.log('\n💰 TOTAL GENERAL: ₲' + grandTotal.toLocaleString('es-PY'))

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testIncomeQuery()
