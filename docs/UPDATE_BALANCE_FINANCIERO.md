# Actualización de Balance Financiero

## Problema
La función `generate_income_statement` no estaba incluyendo las facturas pagadas en el cálculo de ingresos.

## Solución
Actualizar la función SQL para que incluya:
- ✅ Ingresos de transacciones
- ✅ Ingresos de facturas pagadas (campo `amount`)
- ✅ IVA e IRP de facturas

## Pasos para aplicar la actualización

### Opción 1: Desde Supabase Dashboard (RECOMENDADO)

1. Ve a [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
2. Crea una nueva query
3. Copia y pega el contenido de:
   ```
   supabase/migrations/20260110_update_income_statement_function.sql
   ```
4. Ejecuta la query (RUN)
5. Verifica que aparezca "Success"

### Opción 2: Desde terminal (requiere configuración)

```bash
node scripts/update-income-statement.js
```

## Verificación

Después de aplicar la actualización:

1. Ve a https://finanzas-personales-virid-theta.vercel.app/rules
2. Selecciona el mes que tiene facturas pagadas (diciembre 2025)
3. Haz clic en "Generar Estado"
4. Verifica que los ingresos incluyan tus ₲740,000 de las facturas

## Archivos creados

- `supabase/migrations/20260110_update_income_statement_function.sql` - La nueva función SQL
- `scripts/update-income-statement.js` - Script para aplicar la migración
- `docs/UPDATE_BALANCE_FINANCIERO.md` - Este archivo de documentación

## Nota técnica

La función ahora suma:
```sql
v_total_revenue = ingresos_transacciones + ingresos_facturas_pagadas
v_iva_collected = iva_transacciones + iva_facturas
v_irp_withholding = irp_transacciones + irp_facturas
```
