require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('🔍 Verificando datos en la base de datos...\n')
  
  // Obtener user_id desde env para evitar auth.getUser()
  const userId = process.env.CHECK_USER_ID
  const userEmail = process.env.CHECK_USER_EMAIL || '(email no provisto)'

  if (!userId) {
    console.log('❌ Falta CHECK_USER_ID en el entorno')
    console.log('Ejecuta: CHECK_USER_ID="tu-user-id" node check-accounts.js\n')
    return
  }
  
  console.log('✅ Usuario:', userEmail)
  console.log('🆔 User ID:', userId)
  console.log('')
  
  // Verificar cuentas
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
  
  console.log('📊 CUENTAS (accounts):')
  if (accountsError) {
    console.log('❌ Error:', accountsError.message)
  } else if (!accounts || accounts.length === 0) {
    console.log('⚠️  No tienes cuentas registradas')
    console.log('💡 Debes crear al menos una cuenta desde /accounts')
  } else {
    console.log(`✅ ${accounts.length} cuenta(s) encontrada(s):`)
    accounts.forEach(acc => {
      console.log(`   - ${acc.name}: ${acc.balance} Gs (${acc.type}) ${acc.is_active ? '✓' : '✗ inactiva'}`)
    })
    const totalBalance = accounts
      .filter(a => a.is_active)
      .reduce((sum, a) => sum + Number(a.balance), 0)
    console.log(`   TOTAL BALANCE: ${totalBalance.toLocaleString('es-PY')} Gs`)
  }
  console.log('')
  
  // Verificar transacciones del mes
  const currentMonth = new Date().toISOString().slice(0, 7)
  const startDate = `${currentMonth}-01`
  const year = parseInt(currentMonth.split('-')[0])
  const month = parseInt(currentMonth.split('-')[1])
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${currentMonth}-${String(lastDay).padStart(2, '0')}`
  
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
  
  console.log(`📊 TRANSACCIONES (${currentMonth}):`)
  if (!transactions || transactions.length === 0) {
    console.log('⚠️  No hay transacciones este mes')
  } else {
    const income = transactions.filter(t => t.type === 'income')
    const expenses = transactions.filter(t => t.type === 'expense')
    const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0)
    
    console.log(`   Ingresos: ${income.length} transacciones = ${totalIncome.toLocaleString('es-PY')} Gs`)
    console.log(`   Gastos: ${expenses.length} transacciones = ${totalExpenses.toLocaleString('es-PY')} Gs`)
  }
  console.log('')
  
  // Verificar facturas pagadas
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .not('paid_date', 'is', null)
    .gte('paid_date', startDate)
    .lte('paid_date', endDate)
  
  console.log(`📊 FACTURAS PAGADAS (${currentMonth}):`)
  if (!invoices || invoices.length === 0) {
    console.log('⚠️  No hay facturas pagadas este mes')
  } else {
    const totalInvoices = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
    console.log(`   ${invoices.length} factura(s) = ${totalInvoices.toLocaleString('es-PY')} Gs`)
    invoices.forEach(inv => {
      console.log(`   - Factura ${inv.invoice_number}: ${Number(inv.amount).toLocaleString('es-PY')} Gs (pagada: ${inv.paid_date})`)
    })
  }
  console.log('')
  
  console.log('💡 RESUMEN:')
  console.log('   - Si el balance sale en 0Gs, crea cuentas en /accounts')
  console.log('   - Las cuentas representan tus cuentas bancarias, efectivo, etc.')
  console.log('   - Los ingresos/gastos son transacciones del mes actual')
}

checkData().catch(console.error)
