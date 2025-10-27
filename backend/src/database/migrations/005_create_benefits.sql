CREATE TABLE IF NOT EXISTS benefits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_id UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50),
  period VARCHAR(50),
  image_url VARCHAR(500),
  terms TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_benefits_level ON benefits(level_id);
CREATE INDEX idx_benefits_active ON benefits(is_active);

COMMENT ON TABLE benefits IS 'Benefícios desbloqueados por nível';
COMMENT ON COLUMN benefits.category IS 'kit, electronics, dinner, travel, trophy, vehicle, allowance';
COMMENT ON COLUMN benefits.period IS 'monthly, quarterly, annual, advancement';
