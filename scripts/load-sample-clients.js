const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function loadSampleClients() {
  try {
    console.log('🔍 Obteniendo usuarios...')
    
    // Obtener el primer usuario admin (o el usuario actual)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (usersError) throw usersError
    
    if (!users || users.length === 0) {
      console.log('❌ No se encontraron usuarios. Por favor crea una cuenta primero.')
      return
    }

    const userId = users[0].id
    console.log('✅ Usuario encontrado:', userId)

    // Verificar si ya existen clientes
    const { data: existingClients, error: checkError } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)

    if (checkError) throw checkError

    if (existingClients && existingClients.length > 0) {
      console.log('ℹ️  Ya existen', existingClients.length, 'clientes para este usuario')
      console.log('¿Desea recargar los datos de ejemplo? (Esto no eliminará los existentes)')
    }

    // Datos de clientes de ejemplo
    const sampleClients = [
      {
        user_id: userId,
        name: 'Empresa ABC',
        type: 'fixed',
        monthly_amount: 3000000,
        email: 'contacto@abc.com',
        phone: '+595 981 234567',
        is_active: true
      },
      {
        user_id: userId,
        name: 'Tech Solutions SAE',
        type: 'fixed',
        monthly_amount: 2500000,
        email: 'info@techsolutions.com.py',
        phone: '+595 971 987654',
        is_active: true
      },
      {
        user_id: userId,
        name: 'Cliente Ocasional XYZ',
        type: 'occasional',
        monthly_amount: null,
        email: 'xyz@email.com',
        phone: '+595 961 111222',
        is_active: true
      },
      {
        user_id: userId,
        name: 'Comercial Del Este',
        type: 'fixed',
        monthly_amount: 1500000,
        email: 'ventas@deleste.com.py',
        is_active: true
      },
      {
        user_id: userId,
        name: 'Desarrollo Web Pro',
        type: 'occasional',
        monthly_amount: null,
        email: 'hola@webpro.com',
        is_active: true
      }
    ]

    console.log('📝 Insertando clientes de ejemplo...')

    const { data, error } = await supabase
      .from('clients')
      .insert(sampleClients)
      .select()

    if (error) {
      console.error('❌ Error al insertar clientes:', error)
      throw error
    }

    console.log('✅ Clientes cargados exitosamente!')
    console.log('📊 Total de clientes insertados:', data.length)
    data.forEach(client => {
      console.log(`   - ${client.name} (${client.type === 'fixed' ? 'Fijo' : 'Ocasional'})`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

loadSampleClients()
