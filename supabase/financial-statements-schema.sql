-- Tablas para almacenar balances financieros mensuales

-- 1. Tabla para almacenar balances generales mensuales
CREATE TABLE IF NOT EXISTS balance_sheets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_month DATE NOT NULL, -- Primer día del mes
  
  -- Activos
  cash DECIMAL(15, 2) DEFAULT 0,
  accounts_receivable DECIMAL(15, 2) DEFAULT 0,
  total_current_assets DECIMAL(15, 2) DEFAULT 0,
  total_assets DECIMAL(15, 2) DEFAULT 0,
  
  -- Pasivos
  accounts_payable DECIMAL(15, 2) DEFAULT 0,
  total_current_liabilities DECIMAL(15, 2) DEFAULT 0,
  total_liabilities DECIMAL(15, 2) DEFAULT 0,
  
  -- Patrimonio
  equity DECIMAL(15, 2) DEFAULT 0,
  retained_earnings DECIMAL(15, 2) DEFAULT 0,
  total_equity DECIMAL(15, 2) DEFAULT 0,
  
  -- Metadatos
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  
  UNIQUE(user_id, period_month)
);

-- 2. Tabla para almacenar estados de resultados mensuales
CREATE TABLE IF NOT EXISTS income_statements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_month DATE NOT NULL,
  
  -- Ingresos
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  revenue_detail JSONB, -- { "categoria": monto }
  
  -- Costos y Gastos
  cost_of_goods_sold DECIMAL(15, 2) DEFAULT 0,
  operating_expenses DECIMAL(15, 2) DEFAULT 0,
  expenses_detail JSONB, -- { "categoria": monto }
  
  -- Impuestos
  iva_collected DECIMAL(15, 2) DEFAULT 0,
  iva_paid DECIMAL(15, 2) DEFAULT 0,
  iva_payable DECIMAL(15, 2) DEFAULT 0,
  irp_withholding DECIMAL(15, 2) DEFAULT 0,
  
  -- Resultados
  gross_profit DECIMAL(15, 2) DEFAULT 0,
  operating_income DECIMAL(15, 2) DEFAULT 0,
  net_income DECIMAL(15, 2) DEFAULT 0,
  
  -- Metadatos
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  
  UNIQUE(user_id, period_month)
);

-- 3. Tabla para almacenar flujos de caja mensuales
CREATE TABLE IF NOT EXISTS cash_flow_statements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  period_month DATE NOT NULL,
  
  -- Flujo de efectivo de operaciones
  cash_from_operations DECIMAL(15, 2) DEFAULT 0,
  operations_detail JSONB,
  
  -- Flujo de efectivo de inversión
  cash_from_investing DECIMAL(15, 2) DEFAULT 0,
  investing_detail JSONB,
  
  -- Flujo de efectivo de financiamiento
  cash_from_financing DECIMAL(15, 2) DEFAULT 0,
  financing_detail JSONB,
  
  -- Resultado
  net_cash_flow DECIMAL(15, 2) DEFAULT 0,
  beginning_cash DECIMAL(15, 2) DEFAULT 0,
  ending_cash DECIMAL(15, 2) DEFAULT 0,
  
  -- Metadatos
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  
  UNIQUE(user_id, period_month)
);

-- 4. Habilitar RLS
ALTER TABLE balance_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_statements ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para balance_sheets
CREATE POLICY "Users can view their own balance sheets"
  ON balance_sheets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance sheets"
  ON balance_sheets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own balance sheets"
  ON balance_sheets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own balance sheets"
  ON balance_sheets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Políticas RLS para income_statements
CREATE POLICY "Users can view their own income statements"
  ON income_statements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own income statements"
  ON income_statements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income statements"
  ON income_statements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income statements"
  ON income_statements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 7. Políticas RLS para cash_flow_statements
CREATE POLICY "Users can view their own cash flow statements"
  ON cash_flow_statements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cash flow statements"
  ON cash_flow_statements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash flow statements"
  ON cash_flow_statements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cash flow statements"
  ON cash_flow_statements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 8. Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_balance_sheets_user_month ON balance_sheets(user_id, period_month DESC);
CREATE INDEX IF NOT EXISTS idx_income_statements_user_month ON income_statements(user_id, period_month DESC);
CREATE INDEX IF NOT EXISTS idx_cash_flow_statements_user_month ON cash_flow_statements(user_id, period_month DESC);

-- 9. Función para generar estado de resultados automáticamente
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
BEGIN
  -- Calcular ingresos totales
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_revenue
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND DATE_TRUNC('month', date) = p_period_month;
  
  -- Calcular gastos operativos
  SELECT COALESCE(SUM(amount), 0)
  INTO v_operating_expenses
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND DATE_TRUNC('month', date) = p_period_month;
  
  -- Calcular IVA cobrado
  SELECT COALESCE(SUM(iva_amount), 0)
  INTO v_iva_collected
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND DATE_TRUNC('month', date) = p_period_month;
  
  -- Calcular IVA pagado
  SELECT COALESCE(SUM(iva_amount), 0)
  INTO v_iva_paid
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND DATE_TRUNC('month', date) = p_period_month;
  
  -- Calcular IRP retenido
  SELECT COALESCE(SUM(irp_amount), 0)
  INTO v_irp_withholding
  FROM transactions
  WHERE user_id = p_user_id
    AND DATE_TRUNC('month', date) = p_period_month;
  
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

-- 10. Comentarios
COMMENT ON TABLE balance_sheets IS 'Balance general mensual por usuario';
COMMENT ON TABLE income_statements IS 'Estado de resultados mensual por usuario';
COMMENT ON TABLE cash_flow_statements IS 'Estado de flujo de caja mensual por usuario';
COMMENT ON FUNCTION generate_income_statement IS 'Genera automáticamente el estado de resultados para un mes específico';
