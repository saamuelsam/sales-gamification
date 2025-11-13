-- 🔹 Tabela de níveis do plano de carreira
CREATE TABLE IF NOT EXISTS levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_number INT NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  subtitle VARCHAR(255),

  points_required DECIMAL(10,2) NOT NULL CHECK (points_required >= 0),

  max_lines INT NOT NULL CHECK (max_lines > 0),

  personal_commission DECIMAL(5,2) NOT NULL CHECK (personal_commission >= 0),
  insurance_commission DECIMAL(5,2) NOT NULL DEFAULT 5.00 CHECK (insurance_commission >= 0),
  network_commission DECIMAL(5,2) DEFAULT 0.00 CHECK (network_commission >= 0),

  fixed_allowance DECIMAL(10,2) DEFAULT 0.00 CHECK (fixed_allowance >= 0),
  monthly_sales_goal DECIMAL(12,2) DEFAULT NULL CHECK (monthly_sales_goal >= 0 OR monthly_sales_goal IS NULL),
  bonus_goal DECIMAL(12,2) DEFAULT NULL CHECK (bonus_goal >= 0 OR bonus_goal IS NULL),
  bonus_allowance DECIMAL(10,2) DEFAULT 0.00 CHECK (bonus_allowance >= 0),
  advancement_bonus DECIMAL(10,2) DEFAULT 0.00 CHECK (advancement_bonus >= 0),
  advancement_reward TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 🔹 Índices
CREATE INDEX IF NOT EXISTS idx_levels_phase_number ON levels(phase_number);
CREATE INDEX IF NOT EXISTS idx_levels_points_required ON levels(points_required);

-- 🔹 Comentários explicativos
COMMENT ON TABLE levels IS 'Níveis do plano de carreira Fortal Engenharia Solar (progressão por pontos e vendas mensais).';

COMMENT ON COLUMN levels.phase_number IS 'Número da fase (1 = Consultor, 2 = Master, 3 = Senior, 4 = Prime, 5 = Executive)';
COMMENT ON COLUMN levels.points_required IS 'Pontos acumulados necessários para alcançar o nível.';
COMMENT ON COLUMN levels.personal_commission IS 'Percentual de comissão pessoal (aplicado sobre o valor da venda).';
COMMENT ON COLUMN levels.insurance_commission IS 'Percentual aplicado sobre o valor do seguro.';
COMMENT ON COLUMN levels.network_commission IS 'Comissão sobre vendas da equipe (máx 2% - compliance).';
COMMENT ON COLUMN levels.fixed_allowance IS 'Valor fixo mensal recebido pelo nível (quando aplicável).';
COMMENT ON COLUMN levels.monthly_sales_goal IS 'Meta de vendas mensal para manutenção do nível.';
COMMENT ON COLUMN levels.advancement_reward IS 'Descrição da recompensa ao avançar para o nível.';
