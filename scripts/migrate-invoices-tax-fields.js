require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function migrateInvoices() {
  console.log('🔄 Iniciando migración de campos de impuestos en facturas...\n')

  try {
    // Obtener todas las facturas que no tienen campos de impuestos calculados
    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .or('iva_amount.is.null,subtotal.is.null')

    if (fetchError) {
      throw fetchError
    }

    if (!invoices || invoices.length === 0) {
      console.log('✅ No hay facturas para migrar. Todas tienen los campos de impuestos.')
      return
    }

    console.log(`📋 Encontradas ${invoices.length} facturas para actualizar\n`)

    let updated = 0
    let errors = 0

    for (const invoice of invoices) {
      try {
        const amount = Number(invoice.amount)
        
        // Usar los porcentajes existentes o valores por defecto
        const ivaPercentage = invoice.iva_percentage || 10
        const irpPercentage = invoice.irp_percentage || 10
        const isIvaExempt = invoice.is_iva_exempt || false

        // Calcular IVA (incluido en el monto total)
        const subtotal = isIvaExempt ? amount : amount / (1 + ivaPercentage / 100)
        const ivaAmount = isIvaExempt ? 0 : amount - subtotal
        const irpWithheld = amount * (irpPercentage / 100)

        // Actualizar factura
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            subtotal: subtotal,
            iva_amount: ivaAmount,
            iva_percentage: ivaPercentage,
            total_with_iva: amount,
            is_iva_exempt: isIvaExempt,
            irp_withheld: irpWithheld,
            irp_percentage: irpPercentage
          })
          .eq('id', invoice.id)

        if (updateError) {
          console.error(`❌ Error actualizando factura ${invoice.invoice_number}:`, updateError.message)
          errors++
        } else {
          updated++
          console.log(`✅ Factura ${invoice.invoice_number}:`)
          console.log(`   Monto: ₲${amount.toLocaleString()}`)
          console.log(`   Subtotal: ₲${subtotal.toFixed(0)}`)
          console.log(`   IVA (${ivaPercentage}%): ₲${ivaAmount.toFixed(0)}`)
          console.log(`   IRP (${irpPercentage}%): ₲${irpWithheld.toFixed(0)}`)
          console.log('')
        }
      } catch (err) {
        console.error(`❌ Error procesando factura ${invoice.invoice_number}:`, err.message)
        errors++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMEN:')
    console.log(`   ✅ Actualizadas: ${updated}`)
    console.log(`   ❌ Errores: ${errors}`)
    console.log(`   📋 Total: ${invoices.length}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Error en la migración:', error.message)
    process.exit(1)
  }
}

migrateInvoices()
  .then(() => {
    console.log('\n✅ Migración completada exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })
