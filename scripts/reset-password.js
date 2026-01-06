const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function resetPassword() {
  try {
    console.log('🔍 Buscando usuario codigocentercloud@gmail.com...')
    
    // Buscar el usuario
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'codigocentercloud@gmail.com')

    if (profilesError) throw profilesError

    if (!profiles || profiles.length === 0) {
      console.log('❌ No se encontró el usuario')
      return
    }

    const userId = profiles[0].id
    console.log('✅ Usuario encontrado:', profiles[0].email)
    console.log('🆔 ID:', userId)

    // Actualizar la contraseña
    console.log('\n🔑 Actualizando contraseña...')
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: 'kUm2018$%' }
    )

    if (error) {
      console.error('❌ Error al actualizar contraseña:', error.message)
      throw error
    }

    console.log('✅ Contraseña actualizada exitosamente')
    console.log('\n📧 Email: codigocentercloud@gmail.com')
    console.log('🔐 Nueva contraseña: kUm2018$%')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

resetPassword()
