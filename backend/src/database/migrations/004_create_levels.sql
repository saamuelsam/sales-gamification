CREATE TABLE IF NOT EXISTS levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_number INT NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  subtitle VARCHAR(255),
  points_required DECIMAL(10,2) NOT NULL CHECK (points_required >= 0),
  max_lines INT NOT NULL,
  personal_commission DECIMAL(5,2) NOT NULL,
  insurance_commission DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  network_commission DECIMAL(5,2) DEFAULT NULL,
  fixed_allowance DECIMAL(10,2) DEFAULT NULL,
  monthly_sales_goal DECIMAL(12,2) DEFAULT NULL,
  bonus_goal DECIMAL(12,2) DEFAULT NULL,
  bonus_allowance DECIMAL(10,2) DEFAULT NULL,
  advancement_bonus DECIMAL(10,2) DEFAULT NULL,
  advancement_reward TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_levels_phase ON levels(phase_number);
CREATE INDEX idx_levels_points ON levels(points_required);

COMMENT ON TABLE levels IS 'Níveis do plano de carreira Fortal Energia Solar';
COMMENT ON COLUMN levels.network_commission IS 'Comissão sobre vendas da equipe (máx 2% - compliance)';
