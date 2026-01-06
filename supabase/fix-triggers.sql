-- Script de corrección para el error de Database error saving new user
-- Ejecuta esto en Supabase SQL Editor

-- PASO 1: Eliminar triggers existentes si hay problemas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created ON profiles;

-- PASO 2: Eliminar funciones existentes
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_categories() CASCADE;

-- PASO 3: Recrear la función handle_new_user corregida
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, currency)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'PYG'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 4: Recrear la función create_default_categories
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Default expense categories
  INSERT INTO public.categories (user_id, name, type, color, icon) VALUES
    (NEW.id, 'Alimentación', 'expense', '#ef4444', '🍔'),
    (NEW.id, 'Transporte', 'expense', '#f97316', '🚗'),
    (NEW.id, 'Vivienda', 'expense', '#8b5cf6', '🏠'),
    (NEW.id, 'Servicios', 'expense', '#3b82f6', '💡'),
    (NEW.id, 'Entretenimiento', 'expense', '#ec4899', '🎮'),
    (NEW.id, 'Salud', 'expense', '#10b981', '🏥'),
    (NEW.id, 'Educación', 'expense', '#6366f1', '📚'),
    (NEW.id, 'Ropa', 'expense', '#a855f7', '👕'),
    (NEW.id, 'Suscripciones', 'expense', '#14b8a6', '📱'),
    (NEW.id, 'Otros gastos', 'expense', '#64748b', '💳');
  
  -- Default income categories
  INSERT INTO public.categories (user_id, name, type, color, icon) VALUES
    (NEW.id, 'Salario', 'income', '#22c55e', '💰'),
    (NEW.id, 'Freelance', 'income', '#3b82f6', '💼'),
    (NEW.id, 'Ventas', 'income', '#f59e0b', '🛒'),
    (NEW.id, 'Inversiones', 'income', '#8b5cf6', '📈'),
    (NEW.id, 'Otros ingresos', 'income', '#64748b', '💵');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_default_categories: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 5: Recrear los triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_categories();

-- PASO 6: Verificar que todo esté bien
SELECT 'Triggers recreados correctamente' as status;
