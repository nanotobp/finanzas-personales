-- Corregir políticas RLS para la tabla invoices

-- 1. Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;

-- 2. Crear políticas RLS corregidas
CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Crear o actualizar cliente "Varios" para cada usuario
-- Este cliente se usará para facturas de clientes eliminados
INSERT INTO clients (user_id, name, type, email, phone, notes, is_active)
SELECT 
  u.id,
  'Varios',
  'occasional',
  'varios@sistema.local',
  '',
  'Cliente por defecto para facturas sin cliente específico',
  true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM clients c 
  WHERE c.user_id = u.id 
  AND c.name = 'Varios'
);
