-- 🔹 Tabela de benefícios desbloqueados por nível
CREATE TABLE IF NOT EXISTS benefits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  level_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  category VARCHAR(50) CHECK (
    category IN ('kit', 'electronics', 'dinner', 'travel', 'trophy', 'vehicle', 'allowance')
    OR category IS NULL
  ),
  period VARCHAR(50) CHECK (
    period IN ('monthly', 'quarterly', 'annual', 'advancement')
    OR period IS NULL
  ),

  image_url VARCHAR(500),
  terms TEXT,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_benefits_level FOREIGN KEY (level_id)
    REFERENCES levels(id) ON DELETE CASCADE
);

-- 🔹 Índices de performance (com IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_benefits_level ON benefits(level_id);
CREATE INDEX IF NOT EXISTS idx_benefits_active ON benefits(is_active);

-- 🔹 Comentários descritivos
COMMENT ON TABLE benefits IS
'Benefícios desbloqueados conforme o nível de carreira do consultor. 
Cada benefício está vinculado a um nível e pode ser ativado/desativado conforme a política da empresa.';

COMMENT ON COLUMN benefits.category IS
'Categoria do benefício: kit, electronics, dinner, travel, trophy, vehicle, allowance.';

COMMENT ON COLUMN benefits.period IS
'Período de concessão do benefício: monthly, quarterly, annual, advancement.';

COMMENT ON COLUMN benefits.is_active IS
'Define se o benefício está ativo e visível no painel do usuário.';
