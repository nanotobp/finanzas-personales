-- Agregar campos de impuestos (IVA e IRP) para Paraguay

-- 1. Agregar campos de IVA e IRP a la tabla de transacciones
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS iva_amount DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iva_percentage DECIMAL(5, 2) DEFAULT 10.0,
  ADD COLUMN IF NOT EXISTS is_iva_included BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS irp_amount DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS irp_percentage DECIMAL(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_number TEXT; -- RUC o número de factura

-- 2. Agregar campos de IVA e IRP a la tabla de facturas (invoices)
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS iva_amount DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iva_percentage DECIMAL(5, 2) DEFAULT 10.0,
  ADD COLUMN IF NOT EXISTS total_with_iva DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS is_iva_exempt BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS irp_withheld DECIMAL(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS irp_percentage DECIMAL(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_receipt_number TEXT;

-- 3. Crear tabla de configuración de impuestos por usuario
CREATE TABLE IF NOT EXISTS tax_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  default_iva_percentage DECIMAL(5, 2) DEFAULT 10.0,
  default_irp_percentage DECIMAL(5, 2) DEFAULT 8.0,
  ruc TEXT, -- RUC del usuario/empresa
  business_name TEXT,
  tax_regime TEXT CHECK (tax_regime IN ('simple', 'general', 'professional')) DEFAULT 'simple',
  iva_responsible BOOLEAN DEFAULT false, -- Si es responsable de IVA
  irp_responsible BOOLEAN DEFAULT false, -- Si debe pagar IRP
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. Habilitar RLS en tax_settings
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas RLS para tax_settings
CREATE POLICY "Users can view their own tax settings"
  ON tax_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax settings"
  ON tax_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax settings"
  ON tax_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax settings"
  ON tax_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Crear vista para resumen de impuestos mensual
CREATE OR REPLACE VIEW monthly_tax_summary AS
SELECT 
  t.user_id,
  DATE_TRUNC('month', t.date) as month,
  
  -- IVA Ventas (facturas emitidas)
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.iva_amount ELSE 0 END), 0) as iva_ventas,
  
  -- IVA Compras (gastos)
  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.iva_amount ELSE 0 END), 0) as iva_compras,
  
  -- IVA a pagar (diferencia)
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.iva_amount ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.iva_amount ELSE 0 END), 0) as iva_a_pagar,
  
  -- IRP retenido
  COALESCE(SUM(t.irp_amount), 0) as irp_total,
  
  -- Totales
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as ingresos_totales,
  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as gastos_totales
FROM transactions t
WHERE t.date >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY t.user_id, DATE_TRUNC('month', t.date);

-- 7. Crear índices para mejorar performance de consultas de impuestos
CREATE INDEX IF NOT EXISTS idx_transactions_date_type ON transactions(user_id, date, type);
CREATE INDEX IF NOT EXISTS idx_transactions_iva ON transactions(user_id, iva_amount) WHERE iva_amount > 0;
CREATE INDEX IF NOT EXISTS idx_transactions_irp ON transactions(user_id, irp_amount) WHERE irp_amount > 0;

-- 8. Función para calcular IVA automáticamente
CREATE OR REPLACE FUNCTION calculate_iva(
  p_amount DECIMAL,
  p_iva_percentage DECIMAL DEFAULT 10.0,
  p_is_included BOOLEAN DEFAULT true
)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_is_included THEN
    -- IVA incluido en el monto
    RETURN ROUND(p_amount * p_iva_percentage / (100 + p_iva_percentage), 2);
  ELSE
    -- IVA no incluido
    RETURN ROUND(p_amount * p_iva_percentage / 100, 2);
  END IF;
END;
$$;

-- 9. Comentarios para documentación
COMMENT ON COLUMN transactions.iva_amount IS 'Monto de IVA de la transacción';
COMMENT ON COLUMN transactions.iva_percentage IS 'Porcentaje de IVA aplicado (10% es estándar en Paraguay)';
COMMENT ON COLUMN transactions.is_iva_included IS 'Si el IVA está incluido en el monto o es adicional';
COMMENT ON COLUMN transactions.irp_amount IS 'Monto de IRP retenido o a pagar';
COMMENT ON COLUMN transactions.irp_percentage IS 'Porcentaje de IRP aplicado';
COMMENT ON COLUMN transactions.tax_number IS 'Número de factura o RUC para fines fiscales';

COMMENT ON TABLE tax_settings IS 'Configuración de impuestos por usuario/empresa';
COMMENT ON VIEW monthly_tax_summary IS 'Resumen mensual de impuestos (IVA e IRP)';
