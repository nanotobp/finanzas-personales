-- Migración: Agregar campos adicionales a clientes y crear tabla de facturas

-- 1. Agregar campos a la tabla de clientes
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS ruc TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Crear tabla de facturas (invoices)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'cash', 'card', 'check', 'other')) DEFAULT 'bank_transfer',
  status TEXT CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
  paid_date DATE,
  destination_category_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- Para qué se usará ese dinero
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, invoice_number)
);

-- 3. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- 4. Habilitar RLS en invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas RLS para invoices
CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Crear función para actualizar estado de facturas vencidas
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$;

-- 7. Comentarios para documentación
COMMENT ON TABLE invoices IS 'Tabla de facturas para seguimiento de cobros a clientes';
COMMENT ON COLUMN invoices.destination_category_id IS 'Categoría de gasto donde se destinará este ingreso';
COMMENT ON FUNCTION update_overdue_invoices() IS 'Actualiza automáticamente el estado de facturas vencidas';
