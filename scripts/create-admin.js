#!/usr/bin/env node

/**
 * Script para crear usuario admin en Supabase
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminUser() {
  console.log('🔄 Creating admin user...\n')
  
  const adminEmail = 'admin@finanzas.com'
  const adminPassword = 'Admin123456!'
  
  try {
    // Crear usuario usando Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Administrador'
      }
    })
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('ℹ️  Usuario admin ya existe')
        console.log('\n📋 Credenciales de acceso:')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('Email:    admin@finanzas.com')
        console.log('Password: Admin123456!')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('\n🌐 URL de la aplicación:')
        console.log('https://finanzas-personales-virid-theta.vercel.app')
        return
      }
      throw error
    }
    
    console.log('✅ Usuario admin creado exitosamente!')
    console.log(`   User ID: ${data.user.id}`)
    console.log('\n📋 Credenciales de acceso:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Email:    admin@finanzas.com')
    console.log('Password: Admin123456!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n🌐 URL de la aplicación:')
    console.log('https://finanzas-personales-virid-theta.vercel.app')
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createAdminUser()
