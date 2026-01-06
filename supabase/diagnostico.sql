-- Script de diagnóstico para verificar el estado de la base de datos
-- Ejecuta esto en Supabase SQL Editor para ver qué está pasando

-- 1. Verificar si las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'categories', 'accounts', 'transactions')
ORDER BY table_name;

-- 2. Verificar si los triggers existen
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- 3. Verificar si las funciones existen
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('handle_new_user', 'create_default_categories')
ORDER BY routine_name;

-- 4. Ver usuarios existentes en auth
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 5. Ver perfiles existentes
SELECT id, email, full_name, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;
