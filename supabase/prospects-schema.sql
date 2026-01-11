-- Schema para CRM de Prospectos

-- Tabla principal de prospectos
CREATE TABLE IF NOT EXISTS prospects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Información básica
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  position TEXT, -- cargo del contacto
  
  -- Información financiera
  potential_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  
  -- Estado y clasificación
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'contacted', 'meeting', 'proposal', 'negotiation', 'won', 'lost')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  temperature TEXT DEFAULT 'warm' CHECK (temperature IN ('cold', 'warm', 'hot')),
  source TEXT, -- web, referido, linkedin, evento, etc.
  
  -- Fechas importantes
  contact_date DATE,
  next_contact_date DATE,
  meeting_date TIMESTAMP WITH TIME ZONE,
  expected_close_date DATE,
  won_date DATE,
  lost_date DATE,
  
  -- Información adicional
  notes TEXT,
  next_action TEXT,
  lost_reason TEXT,
  tags TEXT[], -- array de etiquetas
  
  -- Conversión a cliente
  converted_to_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para historial de actividades
CREATE TABLE IF NOT EXISTS prospect_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'status_change', 'task')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_prospects_user_id ON prospects(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_next_contact_date ON prospects(next_contact_date);
CREATE INDEX IF NOT EXISTS idx_prospects_meeting_date ON prospects(meeting_date);
CREATE INDEX IF NOT EXISTS idx_prospect_activities_prospect_id ON prospect_activities(prospect_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_prospects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_prospects_updated_at();

-- RLS Policies
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_activities ENABLE ROW LEVEL SECURITY;

-- Policies para prospects
CREATE POLICY "Users can view their own prospects"
  ON prospects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prospects"
  ON prospects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prospects"
  ON prospects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prospects"
  ON prospects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies para prospect_activities
CREATE POLICY "Users can view activities of their prospects"
  ON prospect_activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prospects
      WHERE prospects.id = prospect_activities.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activities for their prospects"
  ON prospect_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM prospects
      WHERE prospects.id = prospect_activities.prospect_id
      AND prospects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own activities"
  ON prospect_activities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE prospects IS 'CRM - Gestión de prospectos y pipeline de ventas';
COMMENT ON TABLE prospect_activities IS 'Historial de actividades e interacciones con prospectos';
COMMENT ON COLUMN prospects.status IS 'Estados: lead (prospecto), contacted (contactado), meeting (reunión), proposal (propuesta), negotiation (negociación), won (ganado), lost (perdido)';
COMMENT ON COLUMN prospects.temperature IS 'Temperatura del lead: cold (frío), warm (tibio), hot (caliente)';
COMMENT ON COLUMN prospects.probability IS 'Probabilidad de cierre en porcentaje (0-100)';
