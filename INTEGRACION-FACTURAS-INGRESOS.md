# Integración de Facturas con Ingresos, Impuestos y Reportes

## Resumen de Cambios

Se ha completado la integración completa entre las vistas de **Facturas**, **Ingresos**, **Impuestos** y **Reportes**, de manera que todas las facturas pagadas se reflejan automáticamente en todas las vistas del sistema.

---

## 🎯 Problemas Resueltos

### 1. **Vista de Ingresos (`/income`)**
- ✅ **Antes**: Solo mostraba ingresos registrados manualmente
- ✅ **Ahora**: Incluye automáticamente todas las facturas pagadas + ingresos manuales
- ✅ Diferencia visual entre facturas pagadas (borde azul, icono 📄) e ingresos directos
- ✅ Facturas pagadas no se pueden editar/eliminar desde esta vista (solo desde `/invoices`)
- ✅ Nota informativa indicando que incluye facturas pagadas

### 2. **Vista de Impuestos (`/taxes`)**
- ✅ **Antes**: Calculaba IVA e IRP manualmente usando fórmulas estimadas
- ✅ **Ahora**: Utiliza los campos `iva_amount` e `irp_withheld` almacenados en cada factura
- ✅ Cálculo preciso del IVA e IRP según los porcentajes configurados en cada factura
- ✅ Suma correctamente IVA de facturas + IVA de transacciones
- ✅ Suma correctamente IRP de facturas + IRP de transacciones

### 3. **Vista de Reportes (`/reports`)**
- ✅ **Antes**: Ya incluía facturas pagadas en los cálculos
- ✅ **Ahora**: Documentado con nota informativa que confirma la inclusión de facturas
- ✅ Los gráficos mensuales y anuales incluyen ingresos de facturas

### 4. **Formulario de Facturas (`/invoices`)**
- ✅ Nuevos campos para configurar IVA (0%, 5%, 10%)
- ✅ Nuevo campo para configurar IRP retenido (0%, 3%, 5%, 8%)
- ✅ **Desglose automático en tiempo real** que muestra:
  - Subtotal (sin IVA)
  - IVA calculado
  - Total
  - IRP retenido (si aplica)
  - Neto a recibir (Total - IRP)
- ✅ Cálculo automático almacenado en campos de BD: `iva_amount`, `irp_withheld`, `subtotal`, `total_with_iva`

---

## 📊 Estructura de Datos

### Campos agregados a la tabla `invoices`:
```sql
-- Campos de IVA
subtotal DECIMAL(15, 2)           -- Monto sin IVA
iva_amount DECIMAL(15, 2)         -- IVA calculado
iva_percentage DECIMAL(5, 2)      -- % de IVA (0, 5, 10)
total_with_iva DECIMAL(15, 2)     -- Total con IVA (igual a amount)
is_iva_exempt BOOLEAN             -- Si está exento de IVA

-- Campos de IRP
irp_withheld DECIMAL(15, 2)       -- IRP retenido
irp_percentage DECIMAL(5, 2)      -- % de IRP (0, 3, 5, 8)
tax_receipt_number TEXT           -- Número de comprobante fiscal
```

### Cálculos utilizados:

**Para facturas con IVA incluido:**
```javascript
// Si amount = 110,000 con IVA 10%
subtotal = amount / (1 + iva_percentage/100)  // 100,000
iva_amount = amount - subtotal                 // 10,000

// IRP se calcula sobre el monto bruto
irp_withheld = amount * (irp_percentage/100)   // Si IRP es 3% = 3,300
net_receivable = amount - irp_withheld         // 106,700
```

---

## 🔄 Flujo de Integración

```
┌─────────────────┐
│   /invoices     │
│  (Crear factura)│
└────────┬────────┘
         │
         ▼
  ┌─────────────────┐
  │ Calcular IVA/IRP│
  │   automático    │
  └────────┬────────┘
           │
           ▼
    ┌──────────────────┐
    │  Guardar factura │
    │  status: pending │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Marcar como PAID │
    │ (paid_date)      │
    └────────┬─────────┘
             │
             ├─────────────────────┐
             │                     │
             ▼                     ▼
    ┌────────────────┐    ┌───────────────┐
    │   /income      │    │    /taxes     │
    │ (Ver ingreso)  │    │ (Sumar IVA/   │
    │                │    │  IRP al total)│
    └────────────────┘    └───────────────┘
             │
             ▼
    ┌────────────────┐
    │   /reports     │
    │ (Gráficos con  │
    │  facturas)     │
    └────────────────┘
```

---

## 📝 Componentes Modificados

### 1. `/components/invoices/invoice-form-dialog.tsx`
- ✅ Agregado schema con campos `iva_percentage`, `is_iva_exempt`, `irp_percentage`
- ✅ Agregados campos del formulario para IVA e IRP
- ✅ Agregado desglose visual en tiempo real (componente con `useMemo`)
- ✅ Actualizada mutación para calcular y guardar IVA/IRP automáticamente

### 2. `/components/taxes/tax-summary.tsx`
- ✅ Modificado query para obtener solo los campos necesarios de facturas
- ✅ Cambiado cálculo manual por uso directo de `iva_amount` e `irp_withheld`
- ✅ Actualizada nota informativa

### 3. `/components/income/income-list.tsx`
- ✅ Query ya incluía facturas (sin cambios en query)
- ✅ Mejorada visualización para diferenciar facturas de ingresos
- ✅ Agregada nota informativa
- ✅ Facturas no editables/eliminables desde esta vista

### 4. `/components/reports/reports-view.tsx`
- ✅ Query ya incluía facturas (sin cambios en query)
- ✅ Agregada nota informativa

---

## ✅ Verificación de Funcionamiento

Para verificar que todo funciona correctamente:

1. **Crear una factura nueva** en `/invoices`:
   - Configurar monto total (ej: ₲ 110,000)
   - Seleccionar IVA 10%
   - Ver desglose automático: Subtotal ₲100,000, IVA ₲10,000
   - Opcional: Configurar IRP retenido 3%
   - Guardar factura

2. **Marcar la factura como pagada**:
   - Cambiar estado a "Pagado"
   - Seleccionar fecha de pago
   - Guardar

3. **Verificar en `/income`**:
   - La factura aparece con borde azul e ícono 📄
   - Muestra el monto total (₲ 110,000)
   - Indica "Factura Pagada"
   - No se puede editar/eliminar

4. **Verificar en `/taxes`**:
   - El IVA de la factura (₲ 10,000) se suma a "IVA Ventas"
   - Si hay IRP, se suma al total de IRP

5. **Verificar en `/reports`**:
   - Los gráficos mensuales incluyen el ingreso de la factura
   - El total anual incluye todas las facturas pagadas

---

## 🎨 Mejoras Visuales

- **Ingresos**: Facturas tienen borde azul a la izquierda y badge "Factura Pagada"
- **Formulario de Facturas**: Card con desglose de impuestos en tiempo real
- **Notas informativas**: En todas las vistas con fondo azul claro

---

## 🔮 Próximos Pasos Sugeridos

1. Agregar filtros en `/income` para separar facturas de otros ingresos
2. Exportar reportes con desglose de IVA/IRP por factura
3. Dashboard con resumen de facturas pendientes vs pagadas
4. Alertas de facturas próximas a vencer

---

## 📚 Documentos Relacionados

- `supabase/add-tax-fields.sql` - Migración de campos de impuestos
- `supabase/migration-invoices.sql` - Migración original de facturas
- `DIFERENCIAS-OBJETIVOS.md` - Objetivos originales del proyecto

---

**Fecha de implementación**: 7 de enero de 2026
**Estado**: ✅ Completado y funcional
