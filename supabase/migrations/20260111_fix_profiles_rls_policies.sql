-- Agregar política INSERT para que los usuarios puedan crear su propio perfil

-- Primero eliminar la política UPDATE existente para recrearla con WITH CHECK
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Crear política INSERT para permitir a los usuarios crear su propio perfil
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
