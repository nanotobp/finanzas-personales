const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkClients() {
  try {
    console.log('🔍 Verificando clientes en la base de datos...')
    console.log('📍 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    
    // Obtener todos los usuarios
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')

    if (profilesError) throw profilesError

    console.log('\n👥 Usuarios encontrados:', profiles?.length || 0)
    
    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        console.log(`\n--- Usuario: ${profile.email || profile.id} ---`)
        
        // Verificar clientes de este usuario
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })

        if (clientsError) {
          console.error('❌ Error al obtener clientes:', clientsError.message)
          continue
        }

        console.log(`📊 Total de clientes: ${clients?.length || 0}`)
        
        if (clients && clients.length > 0) {
          console.log('\n📋 Lista de clientes:')
          clients.forEach((client, index) => {
            console.log(`  ${index + 1}. ${client.name} (${client.type}) - Creado: ${new Date(client.created_at).toLocaleString()}`)
          })
        } else {
          console.log('⚠️  No hay clientes para este usuario')
        }
      }
    } else {
      console.log('❌ No se encontraron usuarios')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkClients()
