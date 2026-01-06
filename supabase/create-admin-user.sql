-- Script para crear usuario admin de prueba
-- IMPORTANTE: Ejecuta esto en Supabase SQL Editor

-- 1. Crear el usuario en auth.users
-- Nota: Supabase Auth no permite crear usuarios directamente via SQL de forma segura
-- La mejor forma es usar el endpoint de signup o la interfaz

-- ALTERNATIVA: Crear usuario desde Supabase Dashboard
-- Ve a Authentication → Users → Add user
-- Email: admin@finanzas.com
-- Password: admin123456 (cámbialo después)
-- Auto Confirm User: ✓ (marca esta opción)

-- Una vez creado el usuario, las categorías se crearán automáticamente
-- gracias al trigger on_profile_created
