-- =====================================================
-- MIGRACIÓN 003: FUNCIONALIDADES AVANZADAS
-- Fecha: 2026-01-05
-- Descripción: Gamificación, Hábitos, SMART Goals, 
--              ML/AI, Benchmarking, Notificaciones
-- =====================================================

-- 1. SISTEMA DE GAMIFICACIÓN
-- =====================================================

-- Tabla de logros/achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('saving', 'budgeting', 'goals', 'consistency', 'advanced')) NOT NULL,
  icon TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  requirement_type TEXT CHECK (requirement_type IN ('transaction_count', 'savings_amount', 'streak_days', 'goal_completed', 'budget_met', 'custom')) NOT NULL,
  requirement_value INTEGER NOT NULL,
  badge_color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de logros del usuario
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Tabla de puntos del usuario
CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SISTEMA DE HÁBITOS FINANCIEROS
-- =====================================================

CREATE TABLE IF NOT EXISTS financial_habits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_frequency TEXT CHECK (target_frequency IN ('daily', 'weekly', 'monthly')) NOT NULL,
  category TEXT CHECK (category IN ('saving', 'investing', 'budgeting', 'tracking', 'learning', 'reviewing')) NOT NULL,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_time TIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  habit_id UUID REFERENCES financial_habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'bad')) DEFAULT 'good'
);

-- Índices para búsquedas rápidas de hábitos
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON financial_habits(user_id, is_active);

-- 3. OBJETIVOS SMART MEJORADOS
-- =====================================================

-- Crear tabla savings_goals si no existe
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar campos SMART a savings_goals
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS specific_description TEXT;
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS measurable_criteria JSONB DEFAULT '{}';
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS achievable_plan TEXT;
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS relevant_reason TEXT;
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS time_bound_milestones JSONB DEFAULT '[]';
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS progress_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS last_contribution_date DATE;
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS expected_monthly_contribution DECIMAL(15,2);
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS priority INTEGER CHECK (priority BETWEEN 1 AND 5) DEFAULT 3;
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS is_on_track BOOLEAN DEFAULT TRUE;

-- Tabla de tracking diario de objetivos
CREATE TABLE IF NOT EXISTS goal_daily_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES savings_goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_contributed DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  mood TEXT CHECK (mood IN ('motivated', 'confident', 'neutral', 'concerned', 'frustrated')) DEFAULT 'neutral',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_id, date)
);

-- Tabla de hitos/milestones
CREATE TABLE IF NOT EXISTS goal_milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES savings_goals(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  target_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ANÁLISIS PREDICTIVO Y ML
-- =====================================================

-- Tabla para almacenar predicciones de flujo de caja
CREATE TABLE IF NOT EXISTS cashflow_predictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prediction_date DATE NOT NULL,
  predicted_income DECIMAL(15,2) NOT NULL,
  predicted_expenses DECIMAL(15,2) NOT NULL,
  predicted_balance DECIMAL(15,2) NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.75,
  model_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, prediction_date)
);

-- Tabla para patrones de gasto identificados
CREATE TABLE IF NOT EXISTS spending_patterns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pattern_type TEXT CHECK (pattern_type IN ('recurring', 'seasonal', 'anomaly', 'trend')) NOT NULL,
  category_id UUID REFERENCES categories(id),
  description TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.80,
  average_amount DECIMAL(15,2),
  frequency TEXT,
  last_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Tabla para sugerencias de IA
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  suggestion_type TEXT CHECK (suggestion_type IN ('save_more', 'reduce_spending', 'optimize_budget', 'investment_opportunity', 'debt_payoff', 'goal_adjustment')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_impact DECIMAL(15,2),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- 5. SISTEMA DE BENCHMARKING
-- =====================================================

-- Tabla para datos agregados anónimos (para comparaciones)
CREATE TABLE IF NOT EXISTS user_financial_benchmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  total_income DECIMAL(15,2) DEFAULT 0,
  total_expenses DECIMAL(15,2) DEFAULT 0,
  savings_rate DECIMAL(5,2) DEFAULT 0,
  budget_adherence DECIMAL(5,2) DEFAULT 0,
  goals_progress DECIMAL(5,2) DEFAULT 0,
  category_percentages JSONB DEFAULT '{}',
  income_category TEXT CHECK (income_category IN ('low', 'medium', 'high', 'very_high')),
  age_group TEXT CHECK (age_group IN ('18-25', '26-35', '36-45', '46-55', '56+')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- 6. SISTEMA DE NOTIFICACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('alert', 'reminder', 'achievement', 'goal', 'budget', 'recommendation', 'report')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- 7. REPORTES AUTOMATIZADOS
-- =====================================================

CREATE TABLE IF NOT EXISTS automated_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_type TEXT CHECK (report_type IN ('financial_summary', 'monthly', 'quarterly', 'yearly', 'custom')) NOT NULL,
  frequency TEXT CHECK (frequency IN ('monthly', 'quarterly', 'yearly')) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  send_email BOOLEAN DEFAULT TRUE,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_id UUID REFERENCES automated_reports(id) ON DELETE CASCADE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  report_data JSONB NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CATEGORIZACIÓN INTELIGENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS transaction_patterns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description_pattern TEXT NOT NULL,
  suggested_category_id UUID REFERENCES categories(id),
  confidence DECIMAL(3,2) DEFAULT 0.80,
  times_used INTEGER DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para entrenar el modelo
CREATE TABLE IF NOT EXISTS category_training_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  user_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar streak de usuario
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar si no existe
  INSERT INTO user_points (user_id, total_points, current_level, current_streak, longest_streak, last_activity_date)
  VALUES (NEW.user_id, 0, 1, 1, 1, CURRENT_DATE)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    last_activity_date = CURRENT_DATE,
    current_streak = CASE
      WHEN user_points.last_activity_date = CURRENT_DATE - INTERVAL '1 day' 
      THEN user_points.current_streak + 1
      WHEN user_points.last_activity_date = CURRENT_DATE 
      THEN user_points.current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(user_points.longest_streak, CASE
      WHEN user_points.last_activity_date = CURRENT_DATE - INTERVAL '1 day' 
      THEN user_points.current_streak + 1
      ELSE user_points.current_streak
    END);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger si existe y recrear
DROP TRIGGER IF EXISTS update_streak_on_habit_completion ON habit_completions;
CREATE TRIGGER update_streak_on_habit_completion
  AFTER INSERT ON habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- Función para calcular progreso de objetivos
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  NEW.progress_percentage = CASE 
    WHEN NEW.target_amount > 0 
    THEN (NEW.current_amount / NEW.target_amount) * 100
    ELSE 0
  END;
  
  NEW.is_on_track = CASE
    WHEN NEW.target_date IS NULL THEN TRUE
    WHEN NEW.target_date <= CURRENT_DATE THEN (NEW.progress_percentage >= 100)
    WHEN NEW.created_at >= CURRENT_DATE THEN TRUE
    ELSE (NEW.current_amount >= (NEW.target_amount * 
      (1 - (EXTRACT(EPOCH FROM (NEW.target_date - CURRENT_DATE)) / 
            EXTRACT(EPOCH FROM (NEW.target_date - NEW.created_at))))))
  END;
  
  IF NEW.current_amount > OLD.current_amount THEN
    NEW.last_contribution_date = CURRENT_DATE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger si existe y recrear
DROP TRIGGER IF EXISTS update_goal_progress_trigger ON savings_goals;
CREATE TRIGGER update_goal_progress_trigger
  BEFORE UPDATE OF current_amount ON savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();

-- Función para crear notificación automática
CREATE OR REPLACE FUNCTION create_auto_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar cuando se completa un objetivo
  IF NEW.progress_percentage >= 100 AND OLD.progress_percentage < 100 THEN
    INSERT INTO notifications (user_id, type, title, message, priority)
    VALUES (
      NEW.user_id,
      'goal',
      '🎉 ¡Objetivo Completado!',
      'Has alcanzado tu objetivo: ' || NEW.name,
      'high'
    );
  END IF;
  
  -- Notificar cuando un objetivo está en riesgo
  IF NEW.is_on_track = FALSE AND OLD.is_on_track = TRUE THEN
    INSERT INTO notifications (user_id, type, title, message, priority)
    VALUES (
      NEW.user_id,
      'alert',
      '⚠️ Objetivo en Riesgo',
      'Tu objetivo "' || NEW.name || '" está retrasado. Revisa tu plan.',
      'medium'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger si existe y recrear
DROP TRIGGER IF EXISTS auto_notification_trigger ON savings_goals;
CREATE TRIGGER auto_notification_trigger
  AFTER UPDATE ON savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION create_auto_notification();

-- Función para generar reporte mensual
CREATE OR REPLACE FUNCTION generate_monthly_report(p_user_id UUID, p_report_id UUID)
RETURNS UUID AS $$
DECLARE
  v_report_id UUID;
  v_start_date DATE;
  v_end_date DATE;
  v_report_data JSONB;
BEGIN
  -- Calcular período (mes anterior)
  v_start_date := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE;
  v_end_date := (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::DATE;
  
  -- Construir datos del reporte
  v_report_data := jsonb_build_object(
    'period', jsonb_build_object('start', v_start_date, 'end', v_end_date),
    'summary', jsonb_build_object(
      'total_income', (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = p_user_id AND type = 'income' AND date BETWEEN v_start_date AND v_end_date),
      'total_expenses', (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = p_user_id AND type = 'expense' AND date BETWEEN v_start_date AND v_end_date),
      'transaction_count', (SELECT COUNT(*) FROM transactions WHERE user_id = p_user_id AND date BETWEEN v_start_date AND v_end_date)
    )
  );
  
  -- Insertar reporte generado
  INSERT INTO generated_reports (report_id, period_start, period_end, report_data)
  VALUES (p_report_id, v_start_date, v_end_date, v_report_data)
  RETURNING id INTO v_report_id;
  
  -- Actualizar fecha de última generación
  UPDATE automated_reports
  SET last_generated_at = NOW()
  WHERE id = p_report_id;
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS INICIALES PARA GAMIFICACIÓN
-- =====================================================

-- Insertar logros básicos (si no existen)
INSERT INTO achievements (name, description, category, icon, points, requirement_type, requirement_value, badge_color) 
SELECT * FROM (VALUES
  ('Primer Paso', 'Registra tu primera transacción', 'consistency', '🎯', 10, 'transaction_count', 1, '#10b981'),
  ('Ahorrador Novato', 'Ahorra $100,000 en total', 'saving', '💰', 25, 'savings_amount', 100000, '#3b82f6'),
  ('Semana Perfecta', 'Completa 7 días seguidos rastreando gastos', 'consistency', '🔥', 50, 'streak_days', 7, '#f59e0b'),
  ('Presupuesto Maestro', 'Cumple tu presupuesto mensual', 'budgeting', '📊', 30, 'budget_met', 1, '#8b5cf6'),
  ('Meta Alcanzada', 'Completa tu primer objetivo de ahorro', 'goals', '🏆', 100, 'goal_completed', 1, '#ec4899'),
  ('Ahorrador Experto', 'Ahorra $1,000,000 en total', 'saving', '💎', 150, 'savings_amount', 1000000, '#3b82f6'),
  ('Mes Perfecto', 'Completa 30 días seguidos rastreando', 'consistency', '⭐', 200, 'streak_days', 30, '#f59e0b'),
  ('Planificador', 'Crea 5 objetivos de ahorro', 'goals', '📋', 75, 'custom', 5, '#6366f1')
) AS v(name, description, category, icon, points, requirement_type, requirement_value, badge_color)
WHERE NOT EXISTS (
  SELECT 1 FROM achievements WHERE achievements.name = v.name
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_goal_daily_tracking_date ON goal_daily_tracking(goal_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_cashflow_predictions_date ON cashflow_predictions(user_id, prediction_date);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON ai_suggestions(user_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_benchmarks_month ON user_financial_benchmarks(user_id, month DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_user ON spending_patterns(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_achievements ON user_achievements(user_id, achievement_id);
CREATE INDEX IF NOT EXISTS idx_transaction_patterns ON transaction_patterns(user_id, description_pattern);

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_daily_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_financial_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_training_data ENABLE ROW LEVEL SECURITY;

-- Políticas para savings_goals
CREATE POLICY "Usuarios gestionan sus objetivos de ahorro" ON savings_goals FOR ALL USING (auth.uid() = user_id);

-- Políticas para achievements (todos pueden leer, solo admin puede escribir)
CREATE POLICY "Todos pueden ver logros" ON achievements FOR SELECT USING (true);

-- Políticas para user_achievements
CREATE POLICY "Usuarios ven sus propios logros" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sistema puede crear logros de usuario" ON user_achievements FOR INSERT WITH CHECK (true);

-- Políticas para user_points
CREATE POLICY "Usuarios ven sus propios puntos" ON user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios pueden actualizar sus puntos" ON user_points FOR ALL USING (auth.uid() = user_id);

-- Políticas para financial_habits
CREATE POLICY "Usuarios gestionan sus hábitos" ON financial_habits FOR ALL USING (auth.uid() = user_id);

-- Políticas para habit_completions
CREATE POLICY "Usuarios gestionan completaciones de hábitos" ON habit_completions FOR ALL USING (auth.uid() = user_id);

-- Políticas para goal_daily_tracking
CREATE POLICY "Usuarios rastrean sus objetivos" ON goal_daily_tracking FOR ALL USING (auth.uid() = user_id);

-- Políticas para goal_milestones
CREATE POLICY "Usuarios gestionan hitos de objetivos" ON goal_milestones FOR ALL USING (
  EXISTS (SELECT 1 FROM savings_goals WHERE id = goal_id AND user_id = auth.uid())
);

-- Políticas para cashflow_predictions
CREATE POLICY "Usuarios ven sus predicciones" ON cashflow_predictions FOR ALL USING (auth.uid() = user_id);

-- Políticas para spending_patterns
CREATE POLICY "Usuarios ven sus patrones" ON spending_patterns FOR ALL USING (auth.uid() = user_id);

-- Políticas para ai_suggestions
CREATE POLICY "Usuarios ven sus sugerencias" ON ai_suggestions FOR ALL USING (auth.uid() = user_id);

-- Políticas para user_financial_benchmarks
CREATE POLICY "Usuarios ven sus benchmarks" ON user_financial_benchmarks FOR ALL USING (auth.uid() = user_id);

-- Políticas para notifications
CREATE POLICY "Usuarios gestionan sus notificaciones" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Políticas para automated_reports
CREATE POLICY "Usuarios gestionan sus reportes" ON automated_reports FOR ALL USING (auth.uid() = user_id);

-- Políticas para generated_reports
CREATE POLICY "Usuarios ven reportes generados" ON generated_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM automated_reports WHERE id = report_id AND user_id = auth.uid())
);

-- Políticas para transaction_patterns
CREATE POLICY "Usuarios gestionan sus patrones de transacción" ON transaction_patterns FOR ALL USING (auth.uid() = user_id);

-- Políticas para category_training_data
CREATE POLICY "Todos pueden contribuir datos de entrenamiento" ON category_training_data FOR ALL USING (true);

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================

COMMENT ON TABLE achievements IS 'Logros disponibles en el sistema de gamificación';
COMMENT ON TABLE user_achievements IS 'Logros desbloqueados por cada usuario';
COMMENT ON TABLE user_points IS 'Puntos y niveles de cada usuario';
COMMENT ON TABLE financial_habits IS 'Hábitos financieros que los usuarios quieren desarrollar';
COMMENT ON TABLE habit_completions IS 'Registro de completación de hábitos';
COMMENT ON TABLE goal_daily_tracking IS 'Tracking diario de contribuciones a objetivos SMART';
COMMENT ON TABLE goal_milestones IS 'Hitos intermedios de objetivos de ahorro';
COMMENT ON TABLE cashflow_predictions IS 'Predicciones de flujo de caja usando ML';
COMMENT ON TABLE spending_patterns IS 'Patrones de gasto identificados automáticamente';
COMMENT ON TABLE ai_suggestions IS 'Sugerencias generadas por IA para mejorar finanzas';
COMMENT ON TABLE user_financial_benchmarks IS 'Métricas para comparación anónima entre usuarios';
COMMENT ON TABLE notifications IS 'Sistema de notificaciones proactivas';
COMMENT ON TABLE automated_reports IS 'Configuración de reportes automáticos';
COMMENT ON TABLE generated_reports IS 'Historial de reportes generados';
COMMENT ON TABLE transaction_patterns IS 'Patrones aprendidos para categorización automática';
COMMENT ON TABLE category_training_data IS 'Datos de entrenamiento para ML de categorización';
