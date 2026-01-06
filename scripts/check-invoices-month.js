// scripts/check-invoices-month.js
// Diagnóstico: listar facturas del mes actual

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const startDate = `${year}-${month}-01`
  const endDate = `${year}-${month}-31`

  console.log(`🔍 Facturas del mes actual (${startDate} a ${endDate})`)

  const { data, error } = await supabase
    .from('invoices')
    .select('id, user_id, client_id, invoice_number, issue_date, amount, status')
    .gte('issue_date', startDate)
    .lte('issue_date', endDate)

  if (error) {
    console.error('❌ Error al consultar facturas:', error.message)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.log('No hay facturas en el mes actual.')
    return
  }

  for (const inv of data) {
    console.log(`ID: ${inv.id} | Fecha: ${inv.issue_date} | Monto: ${inv.amount} | Estado: ${inv.status} | User: ${inv.user_id} | Cliente: ${inv.client_id} | Nº: ${inv.invoice_number}`)
  }
}

main()
