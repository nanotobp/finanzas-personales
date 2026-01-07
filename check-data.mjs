import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://juygffhwqpjpmwgajcwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1eWdmZmh3cXBqcG13Z2FqY3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTA3OTAsImV4cCI6MjA4MzE4Njc5MH0.M23NcVLory-EjYGF4LoL3qT7sUNbVLqasJfAF9DATBk'
);

// Cuentas
const { data: accounts } = await supabase
  .from('accounts')
  .select('*')
  .eq('is_active', true);

console.log('=== CUENTAS ACTIVAS ===');
console.log('Total:', accounts?.length || 0);
let totalBalance = 0;
accounts?.forEach(a => {
  console.log(`- ${a.name}: Gs. ${a.balance}`);
  totalBalance += Number(a.balance);
});
console.log('Balance total: Gs.', totalBalance);

// Facturas enero 2026
const { data: invoices } = await supabase
  .from('invoices')
  .select('*')
  .gte('issue_date', '2026-01-01')
  .lte('issue_date', '2026-01-31')
  .order('issue_date', { ascending: false });

console.log('\n=== FACTURAS ENERO 2026 ===');
console.log('Total:', invoices?.length || 0);
invoices?.forEach((i, idx) => {
  console.log(`${idx+1}. #${i.invoice_number} - Gs. ${i.amount} - ${i.status} - Emitida: ${i.issue_date} - Pagada: ${i.paid_date || 'N/A'}`);
});

// Facturas pagadas en enero
const paidInJan = invoices?.filter(i => 
  i.status === 'paid' && 
  i.paid_date >= '2026-01-01' && 
  i.paid_date <= '2026-01-31'
);
console.log('\nFacturas PAGADAS en enero:', paidInJan?.length || 0);

// Transacciones de ingreso
const { data: incomeTransactions } = await supabase
  .from('transactions')
  .select('*')
  .eq('type', 'income')
  .order('date', { ascending: false })
  .limit(10);

console.log('\n=== TRANSACCIONES DE INGRESO (últimas 10) ===');
console.log('Total:', incomeTransactions?.length || 0);
incomeTransactions?.forEach((t, idx) => {
  console.log(`${idx+1}. ${t.description} - Gs. ${t.amount} - ${t.date}`);
});
