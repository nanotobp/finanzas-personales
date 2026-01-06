-- Migration: 002 - Add Savings Goals
-- Created: 2026-01-05
-- Description: Add savings_goals table for tracking financial goals

-- Create savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(15, 2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(15, 2) DEFAULT 0 CHECK (current_amount >= 0),
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_amounts CHECK (current_amount <= target_amount)
);

-- Enable RLS
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own savings goals" 
  ON savings_goals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings goals" 
  ON savings_goals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals" 
  ON savings_goals FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals" 
  ON savings_goals FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_deadline ON savings_goals(deadline) WHERE deadline IS NOT NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Rollback instructions (commented):
-- DROP TRIGGER IF EXISTS update_savings_goals_updated_at ON savings_goals;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP INDEX IF EXISTS idx_savings_goals_deadline;
-- DROP INDEX IF EXISTS idx_savings_goals_user_id;
-- DROP TABLE IF EXISTS savings_goals CASCADE;
