# Corrección de Facturas y Clientes

Este documento explica las correcciones aplicadas para resolver dos problemas:

## 🐛 Problemas Resueltos

### 1. Error al crear facturas (RLS Policy)
**Problema:** `Error: new row violates row-level security policy for table "invocies"`

**Causa:** Las políticas RLS (Row Level Security) no incluían el rol `authenticated` en la política de INSERT.

**Solución:** Se actualizaron las políticas RLS para permitir inserts a usuarios autenticados.

### 2. Eliminación de clientes sin confirmación
**Problema:** Los clientes se eliminaban directamente sin confirmación, y se perdían las facturas asociadas.

**Solución:** 
- Se agregó un modal de confirmación antes de eliminar
- Las facturas del cliente eliminado se transfieren automáticamente al cliente "Varios"
- Se creó un cliente especial "Varios" para mantener integridad de datos

## 🚀 Cómo Aplicar las Correcciones

### Opción 1: Ejecutar en el Panel de Supabase (Recomendado)

1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard/project/juygffhwqpjpmwgajcwj/sql/new

2. Copia y pega el contenido del archivo `supabase/fix-invoices-rls.sql`

3. Haz clic en "Run" o presiona `Ctrl/Cmd + Enter`

4. Deberías ver el mensaje "Success. No rows returned"

### Opción 2: Usar el Script Helper

```bash
cd /Users/gio/Documents/proyectos/finanzas-personales
./scripts/apply-invoices-fix.sh
```

Este script te mostrará el contenido del SQL y te dará la URL directa para ejecutarlo.

## ✅ Verificar que Funcionó

### 1. Verificar Políticas RLS

En Supabase SQL Editor:

```sql
-- Ver las políticas de la tabla invoices
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'invoices';
```

Deberías ver 4 políticas con el rol `authenticated`.

### 2. Verificar Cliente "Varios"

```sql
-- Ver si existe el cliente "Varios" para tu usuario
SELECT id, name, type, email, notes
FROM clients
WHERE name = 'Varios';
```

### 3. Probar Creación de Factura

1. Ve a la sección de Facturas en tu aplicación
2. Haz clic en "Nueva Factura"
3. Llena el formulario y guarda
4. Debería crearse sin errores

### 4. Probar Eliminación de Cliente

1. Ve a la sección de Clientes
2. Intenta eliminar un cliente
3. Debería aparecer un modal de confirmación
4. Al confirmar, las facturas se mueven a "Varios"

## 📋 Archivos Modificados

### SQL
- `supabase/fix-invoices-rls.sql` - Corrección de políticas RLS y creación de cliente "Varios"

### Componentes
- `components/clients/clients-list.tsx` - Modal de confirmación y transferencia de facturas
- `components/ui/alert-dialog.tsx` - Componente de diálogo de alerta (nuevo)

### Scripts
- `scripts/fix-invoices-rls.js` - Script Node.js para aplicar la migración
- `scripts/apply-invoices-fix.sh` - Script bash helper

## 🔍 Detalles Técnicos

### Políticas RLS Actualizadas

```sql
-- Antes
CREATE POLICY "Users can insert their own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Después
CREATE POLICY "Users can insert their own invoices"
  ON invoices FOR INSERT
  TO authenticated  -- 👈 Este rol es clave
  WITH CHECK (auth.uid() = user_id);
```

### Cliente "Varios"

El cliente "Varios" se crea automáticamente con:
- **Nombre:** "Varios"
- **Tipo:** occasional (ocasional)
- **Email:** varios@sistema.local
- **Notas:** "Cliente por defecto para facturas sin cliente específico"
- **Estado:** Activo

Este cliente:
- No se puede eliminar (el botón de eliminar está deshabilitado)
- Recibe automáticamente las facturas de clientes eliminados
- Permite mantener el historial de facturación

## 🆘 Solución de Problemas

### "No se puede crear factura"
1. Verifica que ejecutaste el SQL de corrección
2. Revisa que el user_id se está pasando correctamente en el INSERT
3. Comprueba en la consola del navegador si hay errores

### "No aparece el modal de confirmación"
1. Verifica que el componente `alert-dialog.tsx` existe en `components/ui/`
2. Revisa que no hay errores en la consola del navegador
3. Asegúrate de tener instalado `@radix-ui/react-alert-dialog`

### "Error al transferir facturas"
1. Verifica que el cliente "Varios" existe en la base de datos
2. Revisa los permisos RLS de la tabla invoices
3. Comprueba que tienes permiso para actualizar facturas

## 📦 Dependencias Necesarias

Si el AlertDialog no funciona, instala:

```bash
npm install @radix-ui/react-alert-dialog
```

## 🎯 Próximos Pasos

Ya puedes:
- ✅ Crear facturas sin problemas de RLS
- ✅ Eliminar clientes con confirmación
- ✅ Mantener integridad de datos con el cliente "Varios"

---

**Última actualización:** 6 de enero de 2026
