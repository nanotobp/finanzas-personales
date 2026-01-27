-- Indices adicionales para acelerar queries por usuario y fechas

-- Accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_name
ON accounts(user_id, name);

-- Cards
CREATE INDEX IF NOT EXISTS idx_cards_user_name
ON cards(user_id, name);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_user_name
ON clients(user_id, name);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_user_name
ON projects(user_id, name);

-- Savings goals
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_created
ON savings_goals(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_savings_goals_user_priority
ON savings_goals(user_id, priority DESC);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_next_billing
ON subscriptions(user_id, next_billing_date);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
ON notifications(user_id, created_at DESC);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_due_date
ON invoices(user_id, due_date DESC);

-- Transactions by project/category/card
CREATE INDEX IF NOT EXISTS idx_transactions_user_project_date
ON transactions(user_id, project_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_category_date
ON transactions(user_id, category_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_card_date
ON transactions(user_id, card_id, date DESC);
