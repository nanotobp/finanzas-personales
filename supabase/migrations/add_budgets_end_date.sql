-- Añadir campo end_date a la tabla budgets para presupuestos temporales
-- Esto permite establecer un plazo para presupuestos de deudas o gastos a corto plazo

ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS end_date TEXT;

COMMENT ON COLUMN budgets.end_date IS 'Fecha de fin opcional para presupuestos temporales (formato YYYY-MM). NULL = presupuesto indefinido';
