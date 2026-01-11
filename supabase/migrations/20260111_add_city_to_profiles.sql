-- Agregar campo city a la tabla profiles y corregir políticas RLS

-- 1. Agregar campo city
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS city TEXT;

-- 2. Hacer que el campo email no sea obligatorio (puede venir de auth.users)
ALTER TABLE profiles 
ALTER COLUMN email DROP NOT NULL;

COMMENT ON COLUMN profiles.city IS 'Ciudad del usuario';

-- 3. Corregir políticas RLS para permitir INSERT y UPDATE
-- Eliminar política UPDATE existente
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Crear política INSERT
CREATE POLICY "Users can insert own profile" 
ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Recrear política UPDATE con WITH CHECK
CREATE POLICY "Users can update own profile" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "Users can insert own profile" ON profiles IS 'Permite a los usuarios crear su propio perfil';
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Permite a los usuarios actualizar solo su propio perfil';
