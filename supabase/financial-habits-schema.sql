-- Tabla para tracking de hábitos financieros
CREATE TABLE financial_habits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_frequency TEXT CHECK (target_frequency IN ('daily', 'weekly', 'monthly')) NOT NULL,
  category TEXT CHECK (category IN ('saving', 'investing', 'budgeting', 'tracking', 'learning')) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para registrar el cumplimiento de hábitos
CREATE TABLE habit_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  habit_id UUID REFERENCES financial_habits(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Vista para calcular streak de hábitos
CREATE VIEW habit_streaks AS
SELECT 
  h.id,
  h.name,
  h.user_id,
  COUNT(CASE 
    WHEN hc.completed_at >= CURRENT_DATE - INTERVAL '30 days' 
    THEN 1 
  END) as completions_last_30_days,
  CASE h.target_frequency
    WHEN 'daily' THEN COUNT(CASE WHEN hc.completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)
    WHEN 'weekly' THEN COUNT(CASE WHEN hc.completed_at >= CURRENT_DATE - INTERVAL '8 weeks' THEN 1 END)
    WHEN 'monthly' THEN COUNT(CASE WHEN hc.completed_at >= CURRENT_DATE - INTERVAL '12 months' THEN 1 END)
  END as current_streak
FROM financial_habits h
LEFT JOIN habit_completions hc ON h.id = hc.habit_id
WHERE h.is_active = true
GROUP BY h.id, h.name, h.user_id, h.target_frequency;