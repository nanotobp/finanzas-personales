-- Actualizar función para incluir facturas pagadas en el estado de resultados

CREATE OR REPLACE FUNCTION generate_income_statement(
  p_user_id UUID,
  p_period_month DATE
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_statement_id UUID;
  v_total_revenue DECIMAL(15, 2);
  v_operating_expenses DECIMAL(15, 2);
  v_iva_collected DECIMAL(15, 2);
  v_iva_paid DECIMAL(15, 2);
  v_irp_withholding DECIMAL(15, 2);
  v_invoice_revenue DECIMAL(15, 2);
  v_invoice_iva DECIMAL(15, 2);
  v_invoice_irp DECIMAL(15, 2);
BEGIN
  -- Calcular ingresos de transacciones
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_revenue
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND DATE_TRUNC('month', date) = p_period_month;
  
  -- Calcular ingresos de facturas pagadas
  SELECT 
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(iva_amount), 0),
    COALESCE(SUM(irp_withheld), 0)
  INTO v_invoice_revenue, v_invoice_iva, v_invoice_irp
  FROM invoices
  WHERE user_id = p_user_id
    AND status = 'paid'
    AND paid_date IS NOT NULL
    AND DATE_TRUNC('month', paid_date::date) = p_period_month;
  
  -- Sumar ingresos de transacciones + facturas
  v_total_revenue := v_total_revenue + v_invoice_revenue;
  
  -- Calcular gastos operativos
  SELECT COALESCE(SUM(amount), 0)
  INTO v_operating_expenses
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND DATE_TRUNC('month', date) = p_period_month;
  
  -- Calcular IVA cobrado (transacciones + facturas)
  SELECT COALESCE(SUM(iva_amount), 0)
  INTO v_iva_collected
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND DATE_TRUNC('month', date) = p_period_month;
  
  v_iva_collected := v_iva_collected + v_invoice_iva;
  
  -- Calcular IVA pagado
  SELECT COALESCE(SUM(iva_amount), 0)
  INTO v_iva_paid
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND DATE_TRUNC('month', date) = p_period_month;
  
  -- Calcular IRP retenido (transacciones + facturas)
  SELECT COALESCE(SUM(irp_amount), 0)
  INTO v_irp_withholding
  FROM transactions
  WHERE user_id = p_user_id
    AND DATE_TRUNC('month', date) = p_period_month;
  
  v_irp_withholding := v_irp_withholding + v_invoice_irp;
  
  -- Insertar o actualizar estado de resultados
  INSERT INTO income_statements (
    user_id,
    period_month,
    total_revenue,
    operating_expenses,
    iva_collected,
    iva_paid,
    iva_payable,
    irp_withholding,
    gross_profit,
    operating_income,
    net_income
  ) VALUES (
    p_user_id,
    p_period_month,
    v_total_revenue,
    v_operating_expenses,
    v_iva_collected,
    v_iva_paid,
    v_iva_collected - v_iva_paid,
    v_irp_withholding,
    v_total_revenue,
    v_total_revenue - v_operating_expenses,
    v_total_revenue - v_operating_expenses - (v_iva_collected - v_iva_paid) - v_irp_withholding
  )
  ON CONFLICT (user_id, period_month)
  DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    operating_expenses = EXCLUDED.operating_expenses,
    iva_collected = EXCLUDED.iva_collected,
    iva_paid = EXCLUDED.iva_paid,
    iva_payable = EXCLUDED.iva_payable,
    irp_withholding = EXCLUDED.irp_withholding,
    gross_profit = EXCLUDED.gross_profit,
    operating_income = EXCLUDED.operating_income,
    net_income = EXCLUDED.net_income,
    generated_at = NOW()
  RETURNING id INTO v_statement_id;
  
  RETURN v_statement_id;
END;
$$;

COMMENT ON FUNCTION generate_income_statement IS 'Genera automáticamente el estado de resultados para un mes específico, incluyendo facturas pagadas';
