const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function deleteAdminUser() {
  try {
    console.log('🔍 Buscando usuario admin@finanzas.com...')
    
    // Buscar el usuario admin
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'admin@finanzas.com')

    if (profilesError) throw profilesError

    if (!profiles || profiles.length === 0) {
      console.log('ℹ️  No se encontró el usuario admin@finanzas.com')
      return
    }

    const adminUserId = profiles[0].id
    console.log('✅ Usuario encontrado:', profiles[0].email)
    console.log('🆔 ID:', adminUserId)

    // Eliminar el perfil
    console.log('\n🗑️  Eliminando perfil...')
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', adminUserId)

    if (deleteProfileError) {
      console.error('❌ Error al eliminar perfil:', deleteProfileError.message)
    } else {
      console.log('✅ Perfil eliminado')
    }

    // Eliminar el usuario de auth (requiere service_role_key)
    console.log('🗑️  Eliminando usuario de autenticación...')
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(adminUserId)

    if (deleteAuthError) {
      console.error('❌ Error al eliminar usuario de auth:', deleteAuthError.message)
    } else {
      console.log('✅ Usuario de autenticación eliminado')
    }

    console.log('\n✅ Usuario admin@finanzas.com eliminado completamente')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

deleteAdminUser()
