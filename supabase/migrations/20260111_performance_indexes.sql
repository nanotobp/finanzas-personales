-- Indices de optimización para mejorar performance de queries

-- 1. Optimizar queries de transactions por fecha y usuario
CREATE INDEX IF NOT EXISTS idx_transactions_date_user 
ON transactions(user_id, date DESC);

-- 2. Optimizar queries de transactions por tipo
CREATE INDEX IF NOT EXISTS idx_transactions_type_user_date 
ON transactions(user_id, type, date DESC);

-- 3. Optimizar queries de invoices pagadas
CREATE INDEX IF NOT EXISTS idx_invoices_paid_date_user 
ON invoices(user_id, paid_date DESC) 
WHERE status = 'paid';

-- 4. Optimizar queries de invoices por estado
CREATE INDEX IF NOT EXISTS idx_invoices_status_user 
ON invoices(user_id, status, due_date);

-- 5. Optimizar budgets por mes
CREATE INDEX IF NOT EXISTS idx_budgets_month_user 
ON budgets(user_id, month);

-- 6. Optimizar accounts activas
CREATE INDEX IF NOT EXISTS idx_accounts_active_user 
ON accounts(user_id, is_active) 
WHERE is_active = true;

-- 7. Optimizar prospects por estado
CREATE INDEX IF NOT EXISTS idx_prospects_status_user 
ON prospects(user_id, status);

-- 8. Optimizar prospects por fechas
CREATE INDEX IF NOT EXISTS idx_prospects_dates_user 
ON prospects(user_id, next_contact_date, meeting_date)
WHERE status NOT IN ('won', 'lost');

-- 9. Optimizar categories por tipo
CREATE INDEX IF NOT EXISTS idx_categories_type_user 
ON categories(user_id, type);

-- 10. Optimizar subscriptions activas
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_user 
ON subscriptions(user_id, is_active, next_billing_date)
WHERE is_active = true;

COMMENT ON INDEX idx_transactions_date_user IS 'Optimiza queries de transacciones por fecha descendente';
COMMENT ON INDEX idx_invoices_paid_date_user IS 'Optimiza queries de facturas pagadas por fecha';
COMMENT ON INDEX idx_budgets_month_user IS 'Optimiza queries de presupuestos mensuales';
COMMENT ON INDEX idx_prospects_dates_user IS 'Optimiza queries de prospectos con fechas próximas';
