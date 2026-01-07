-- Add end_date column to budgets table for temporary budgets (e.g., short-term debts)
-- This allows users to set budgets with a specific end date

ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS end_date TEXT; -- Format: YYYY-MM (same as month field)

COMMENT ON COLUMN budgets.end_date IS 'Optional end month for temporary budgets (e.g., short-term debts). Format: YYYY-MM. If NULL, budget continues indefinitely.';
