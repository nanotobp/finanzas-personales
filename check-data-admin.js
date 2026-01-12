require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAllData() {
  console.log('🔍 Verificando TODOS los datos (modo admin)...\n')
  
  // Ver todos los usuarios
  const { data: users } = await supabase.auth.admin.listUsers()
  console.log('👥 USUARIOS:')
  if (users?.users) {
    users.users.forEach(u => {
      console.log(`   - ${u.email} (${u.id})`)
    })
  }
  console.log('')
  
  // Ver todas las transacciones
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, user_id, type, amount, description, date')
    .order('created_at', { ascending: false })
    .limit(20)
  
  console.log('📊 TRANSACCIONES (últimas 20):')
  if (!transactions || transactions.length === 0) {
    console.log('   ⚠️  No hay transacciones')
  } else {
    console.log(`   Total: ${transactions.length}`)
    const byUser = {}
    transactions.forEach(t => {
      if (!byUser[t.user_id]) byUser[t.user_id] = { income: 0, expense: 0 }
      if (t.type === 'income') byUser[t.user_id].income++
      else if (t.type === 'expense') byUser[t.user_id].expense++
      console.log(`   - [${t.type}] ${t.description} = ${t.amount} Gs (user: ${t.user_id.substring(0, 8)}...) ${t.date}`)
    })
    console.log('\n   📈 Resumen por usuario:')
    Object.entries(byUser).forEach(([userId, counts]) => {
      console.log(`   User ${userId.substring(0, 8)}...: ${counts.income} ingresos, ${counts.expense} gastos`)
    })
  }
  console.log('')
  
  // Ver todas las cuentas
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
  
  console.log('💰 CUENTAS:')
  if (!accounts || accounts.length === 0) {
    console.log('   ⚠️  No hay cuentas')
  } else {
    console.log(`   Total: ${accounts.length}`)
    accounts.forEach(a => {
      console.log(`   - ${a.name}: ${a.balance} Gs (user: ${a.user_id.substring(0, 8)}...)`)
    })
  }
  console.log('')
  
  // Ver categorías
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'expense')
  
  console.log('🏷️  CATEGORÍAS DE GASTOS:')
  if (!categories || categories.length === 0) {
    console.log('   ⚠️  No hay categorías')
  } else {
    const byUser = {}
    categories.forEach(c => {
      if (!byUser[c.user_id]) byUser[c.user_id] = []
      byUser[c.user_id].push(c.name)
    })
    Object.entries(byUser).forEach(([userId, cats]) => {
      console.log(`   User ${userId.substring(0, 8)}...: ${cats.join(', ')}`)
    })
  }
}

checkAllData().catch(console.error)
