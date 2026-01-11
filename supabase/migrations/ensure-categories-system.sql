-- Migration: Asegurar que el sistema de categorías está completo
-- Fecha: 2026-01-11
-- Descripción: Verifica y actualiza el sistema de categorías para presupuestos

-- 1. Asegurar que la tabla de categorías tiene todos los campos necesarios
DO $$ 
BEGIN
  -- Verificar si existe la columna 'icon' (si no existe, agregarla)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'icon'
  ) THEN
    ALTER TABLE categories ADD COLUMN icon TEXT;
  END IF;

  -- Verificar si existe la columna 'color' (si no existe, agregarla)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'color'
  ) THEN
    ALTER TABLE categories ADD COLUMN color TEXT DEFAULT '#3b82f6';
  END IF;
END $$;

-- 2. Asegurar que las políticas RLS existen
DO $$
BEGIN
  -- Habilitar RLS si no está habilitado
  ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

  -- Política para SELECT (verificar si existe antes de crear)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can view own categories'
  ) THEN
    CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Política para INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can insert own categories'
  ) THEN
    CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Política para UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can update own categories'
  ) THEN
    CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Política para DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can delete own categories'
  ) THEN
    CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Actualizar categorías existentes sin icono o color
UPDATE categories 
SET icon = CASE name
  WHEN 'Alimentación' THEN '🍔'
  WHEN 'Transporte' THEN '🚗'
  WHEN 'Vivienda' THEN '🏠'
  WHEN 'Servicios' THEN '💡'
  WHEN 'Entretenimiento' THEN '🎮'
  WHEN 'Salud' THEN '🏥'
  WHEN 'Educación' THEN '📚'
  WHEN 'Ropa' THEN '👕'
  WHEN 'Suscripciones' THEN '📱'
  WHEN 'Salario' THEN '💰'
  WHEN 'Freelance' THEN '💼'
  WHEN 'Ventas' THEN '🛒'
  WHEN 'Inversiones' THEN '📈'
  ELSE '📁'
END
WHERE icon IS NULL OR icon = '';

UPDATE categories 
SET color = CASE type
  WHEN 'expense' THEN '#ef4444'
  WHEN 'income' THEN '#22c55e'
  ELSE '#3b82f6'
END
WHERE color IS NULL OR color = '';

-- 4. Verificar índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(user_id, type);

-- 5. Comentario informativo
COMMENT ON TABLE categories IS 'Categorías personalizables para ingresos y gastos. Los usuarios pueden crear, editar y eliminar sus propias categorías.';
COMMENT ON COLUMN categories.icon IS 'Emoji o icono visual para la categoría';
COMMENT ON COLUMN categories.color IS 'Color hexadecimal para identificación visual de la categoría';
