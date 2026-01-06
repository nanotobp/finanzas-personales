-- =====================================================
-- SCHEMAS AVANZADOS PARA PLATAFORMA FINANCIERA COMPLETA
-- =====================================================

-- 1. SISTEMA DE GAMIFICACIÓN
-- =====================================================

-- Tabla de logros/achievements
CREATE TABLE achievements (
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
CREATE TABLE user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Tabla de puntos del usuario
CREATE TABLE user_points (
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

CREATE TABLE financial_habits (
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

CREATE TABLE habit_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  habit_id UUID REFERENCES financial_habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'bad')) DEFAULT 'good'
);

-- Índice para búsquedas rápidas de hábitos
CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, completed_at);
CREATE INDEX idx_habits_user_active ON financial_habits(user_id, is_active);

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
CREATE TABLE goal_daily_tracking (
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
CREATE TABLE goal_milestones (
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
CREATE TABLE cashflow_predictions (
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
CREATE TABLE spending_patterns (
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
CREATE TABLE ai_suggestions (
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
CREATE TABLE user_financial_benchmarks (
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

CREATE TABLE notifications (
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

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- 7. REPORTES AUTOMATIZADOS
-- =====================================================

CREATE TABLE automated_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_type TEXT CHECK (report_type IN ('monthly', 'quarterly', 'yearly', 'custom')) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB NOT NULL,
  pdf_url TEXT,
  status TEXT CHECK (status IN ('pending', 'generated', 'sent', 'failed')) DEFAULT 'pending',
  generated_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CATEGORIZACIÓN INTELIGENTE
-- =====================================================

CREATE TABLE transaction_patterns (
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
CREATE TABLE category_training_data (
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
  UPDATE user_points
  SET 
    last_activity_date = CURRENT_DATE,
    current_streak = CASE
      WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' 
      THEN current_streak + 1
      WHEN last_activity_date = CURRENT_DATE 
      THEN current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(longest_streak, CASE
      WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' 
      THEN current_streak + 1
      ELSE current_streak
    END)
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar streak cuando se completa un hábito
CREATE TRIGGER update_streak_on_habit_completion
  AFTER INSERT ON habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- Función para calcular progreso de objetivos
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE savings_goals
  SET 
    progress_percentage = CASE 
      WHEN target_amount > 0 
      THEN (current_amount / target_amount) * 100
      ELSE 0
    END,
    is_on_track = CASE
      WHEN target_date IS NULL THEN TRUE
      WHEN current_amount >= (target_amount * 
        (1 - (EXTRACT(EPOCH FROM (target_date - CURRENT_DATE)) / 
              EXTRACT(EPOCH FROM (target_date - created_at)))))
      THEN TRUE
      ELSE FALSE
    END,
    last_contribution_date = CASE
      WHEN NEW.current_amount > OLD.current_amount 
      THEN CURRENT_DATE
      ELSE last_contribution_date
    END
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar progreso automáticamente
CREATE TRIGGER update_goal_progress_trigger
  AFTER UPDATE OF current_amount ON savings_goals
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

-- Trigger para notificaciones automáticas
CREATE TRIGGER auto_notification_trigger
  AFTER UPDATE ON savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION create_auto_notification();

-- =====================================================
-- DATOS INICIALES PARA GAMIFICACIÓN
-- =====================================================

-- Logros básicos
INSERT INTO achievements (name, description, category, icon, points, requirement_type, requirement_value, badge_color) VALUES
('Primer Paso', 'Registra tu primera transacción', 'consistency', '🎯', 10, 'transaction_count', 1, '#10b981'),
('Ahorrador Novato', 'Ahorra $100,000 en total', 'saving', '💰', 25, 'savings_amount', 100000, '#3b82f6'),
('Semana Perfecta', 'Completa 7 días seguidos rastreando gastos', 'consistency', '🔥', 50, 'streak_days', 7, '#f59e0b'),
('Presupuesto Maestro', 'Cumple tu presupuesto mensual', 'budgeting', '📊', 30, 'budget_met', 1, '#8b5cf6'),
('Meta Alcanzada', 'Completa tu primer objetivo de ahorro', 'goals', '🏆', 100, 'goal_completed', 1, '#ec4899'),
('Ahorrador Experto', 'Ahorra $1,000,000 en total', 'saving', '💎', 150, 'savings_amount', 1000000, '#3b82f6'),
('Mes Perfecto', 'Completa 30 días seguidos rastreando', 'consistency', '⭐', 200, 'streak_days', 30, '#f59e0b'),
('Planificador', 'Crea 5 objetivos de ahorro', 'goals', '📋', 75, 'custom', 5, '#6366f1');

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para estadísticas de usuario
CREATE VIEW user_financial_stats AS
SELECT 
  u.id as user_id,
  u.email,
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses,
  COALESCE(SUM(a.balance), 0) as total_balance,
  COUNT(DISTINCT sg.id) as active_goals,
  COALESCE(AVG(sg.progress_percentage), 0) as avg_goal_progress,
  up.total_points,
  up.current_level,
  up.current_streak
FROM auth.users u
LEFT JOIN transactions t ON u.id = t.user_id 
  AND t.date >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN accounts a ON u.id = a.user_id AND a.is_active = TRUE
LEFT JOIN savings_goals sg ON u.id = sg.user_id
LEFT JOIN user_points up ON u.id = up.user_id
GROUP BY u.id, u.email, up.total_points, up.current_level, up.current_streak;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_goal_daily_tracking_date ON goal_daily_tracking(goal_id, date DESC);
CREATE INDEX idx_cashflow_predictions_date ON cashflow_predictions(user_id, prediction_date);
CREATE INDEX idx_ai_suggestions_status ON ai_suggestions(user_id, status, priority);
CREATE INDEX idx_benchmarks_month ON user_financial_benchmarks(user_id, month DESC);
CREATE INDEX idx_patterns_user ON spending_patterns(user_id, is_active);