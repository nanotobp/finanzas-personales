-- Datos de ejemplo para testing (ejecutar después del schema.sql)

-- NOTA: Reemplaza 'USER_ID_AQUI' con el ID de tu usuario real
-- Puedes obtenerlo desde auth.users después de crear una cuenta

-- Ejemplo de cuentas adicionales
INSERT INTO accounts (user_id, name, type, balance, currency) VALUES
  ('USER_ID_AQUI', 'Billetera', 'cash', 500000, 'PYG'),
  ('USER_ID_AQUI', 'Banco Itaú - Caja de Ahorro', 'savings', 5000000, 'PYG'),
  ('USER_ID_AQUI', 'Banco Regional - Cuenta Corriente', 'checking', 2000000, 'PYG');

-- Ejemplo de tarjetas
INSERT INTO cards (user_id, name, last_four, brand, "limit", close_day, due_day) VALUES
  ('USER_ID_AQUI', 'Visa Itaú', '1234', 'Visa', 10000000, 15, 25),
  ('USER_ID_AQUI', 'Mastercard Regional', '5678', 'Mastercard', 8000000, 10, 20);

-- Ejemplo de clientes (para freelancers)
INSERT INTO clients (user_id, name, type, monthly_amount, email) VALUES
  ('USER_ID_AQUI', 'Empresa ABC', 'fixed', 3000000, 'contacto@abc.com'),
  ('USER_ID_AQUI', 'Cliente Ocasional XYZ', 'occasional', NULL, 'xyz@email.com');

-- Ejemplo de proyectos
INSERT INTO projects (user_id, name, description, color) VALUES
  ('USER_ID_AQUI', 'Cuponera', 'Proyecto de cupones digitales', '#3b82f6'),
  ('USER_ID_AQUI', 'Sitiando', 'Plataforma de sitios web', '#8b5cf6'),
  ('USER_ID_AQUI', 'Pantallas Publicitarias', 'Gestión de pantallas LED', '#10b981');

-- Ejemplo de suscripciones
INSERT INTO subscriptions (user_id, name, amount, category_id, billing_cycle, next_billing_date) VALUES
  ('USER_ID_AQUI', 'Netflix', 35000, (SELECT id FROM categories WHERE user_id = 'USER_ID_AQUI' AND name = 'Suscripciones' LIMIT 1), 'monthly', '2026-02-01'),
  ('USER_ID_AQUI', 'Spotify', 25000, (SELECT id FROM categories WHERE user_id = 'USER_ID_AQUI' AND name = 'Suscripciones' LIMIT 1), 'monthly', '2026-01-15'),
  ('USER_ID_AQUI', 'GitHub Pro', 12000, (SELECT id FROM categories WHERE user_id = 'USER_ID_AQUI' AND name = 'Servicios' LIMIT 1), 'monthly', '2026-01-20');

-- Ejemplo de transacciones del mes actual
INSERT INTO transactions (user_id, type, amount, description, date, category_id, account_id, status) VALUES
  ('USER_ID_AQUI', 'income', 4500000, 'Pago Cliente ABC - Enero', '2026-01-02', 
    (SELECT id FROM categories WHERE user_id = 'USER_ID_AQUI' AND name = 'Freelance' LIMIT 1),
    (SELECT id FROM accounts WHERE user_id = 'USER_ID_AQUI' AND name LIKE '%Ahorro%' LIMIT 1),
    'confirmed'),
  
  ('USER_ID_AQUI', 'expense', 250000, 'Supermercado Stock', '2026-01-03',
    (SELECT id FROM categories WHERE user_id = 'USER_ID_AQUI' AND name = 'Alimentación' LIMIT 1),
    (SELECT id FROM accounts WHERE user_id = 'USER_ID_AQUI' AND name = 'Billetera' LIMIT 1),
    'confirmed'),
  
  ('USER_ID_AQUI', 'expense', 80000, 'Combustible Shell', '2026-01-04',
    (SELECT id FROM categories WHERE user_id = 'USER_ID_AQUI' AND name = 'Transporte' LIMIT 1),
    (SELECT id FROM accounts WHERE user_id = 'USER_ID_AQUI' AND name = 'Billetera' LIMIT 1),
    'confirmed'),
  
  ('USER_ID_AQUI', 'expense', 150000, 'ANDE - Luz', '2026-01-05',
    (SELECT id FROM categories WHERE user_id = 'USER_ID_AQUI' AND name = 'Servicios' LIMIT 1),
    (SELECT id FROM accounts WHERE user_id = 'USER_ID_AQUI' AND name LIKE '%Corriente%' LIMIT 1),
    'confirmed');

-- Ejemplo de presupuestos para el mes actual
INSERT INTO budgets (user_id, category_id, amount, month) VALUES
  ('USER_ID_AQUI', (SELECT id FROM categories WHERE user_id = 'USER_ID_AQUI' AND name = 'Alimentación' LIMIT 1), 1000000, '2026-01'),
  ('USER_ID_AQUI', (SELECT id FROM categories WHERE user_id = 'USER_ID_AQUI' AND name = 'Transporte' LIMIT 1), 500000, '2026-01'),
  ('USER_ID_AQUI', (SELECT id FROM categories WHERE user_id = 'USER_ID_AQUI' AND name = 'Servicios' LIMIT 1), 600000, '2026-01');

-- Ejemplo de reglas automáticas
INSERT INTO rules (user_id, name, conditions, actions, priority) VALUES
  ('USER_ID_AQUI', 'Categorizar Netflix', 
    '{"merchant_contains": "NETFLIX"}', 
    '{"category_id": "' || (SELECT id FROM categories WHERE user_id = 'USER_ID_AQUI' AND name = 'Suscripciones' LIMIT 1) || '"}',
    10),
  
  ('USER_ID_AQUI', 'Categorizar Combustible',
    '{"merchant_contains": "SHELL"}',
    '{"category_id": "' || (SELECT id FROM categories WHERE user_id = 'USER_ID_AQUI' AND name = 'Transporte' LIMIT 1) || '"}',
    5);

-- Nota: Para usar este archivo:
-- 1. Crea una cuenta en la aplicación
-- 2. Ve a Supabase SQL Editor
-- 3. Ejecuta: SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com';
-- 4. Reemplaza todos los 'USER_ID_AQUI' con tu ID de usuario
-- 5. Ejecuta este archivo
