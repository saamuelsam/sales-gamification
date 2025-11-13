-- 🔹 Tabela de metas individuais de consultores (Fortal Engenharia Solar)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  period VARCHAR(20) NOT NULL CHECK (
    period IN ('weekly', 'monthly', 'quarterly', 'annual')
  ),
  goal_type VARCHAR(50) NOT NULL CHECK (
    goal_type IN ('sales', 'points', 'kilowatts', 'recruits', 'training', 'custom')
  ),

  target_value DECIMAL(12,2) NOT NULL CHECK (target_value >= 0),
  current_value DECIMAL(12,2) DEFAULT 0 CHECK (current_value >= 0),

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  status VARCHAR(20) DEFAULT 'active' CHECK (
    status IN ('active', 'completed', 'failed')
  ),
  achievement_percentage DECIMAL(5,2) DEFAULT 0 CHECK (
    achievement_percentage >= 0 AND achievement_percentage <= 100
  ),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 🔹 Constraints
  CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_goals_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT unique_goal_period UNIQUE (user_id, goal_type, period, start_date, end_date)
);

-- 🔹 Índices otimizados (com IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_period ON goals(period);
CREATE INDEX IF NOT EXISTS idx_goals_dates ON goals(start_date, end_date);

-- 🔹 Comentários explicativos
COMMENT ON TABLE goals IS
'Tabela de metas individuais e de desempenho dos consultores Fortal Engenharia Solar. 
Utilizada para controle de progresso mensal, trimestral ou anual.';

COMMENT ON COLUMN goals.period IS
'Período da meta: weekly, monthly, quarterly ou annual.';

COMMENT ON COLUMN goals.goal_type IS
'Tipo de meta: vendas, pontos, kilowatts, recrutas, treinamentos ou meta personalizada.';

COMMENT ON COLUMN goals.achievement_percentage IS
'Percentual de progresso atingido com base em current_value / target_value.';

COMMENT ON COLUMN goals.created_by IS
'Usuário (geralmente gerente) que criou ou atribuiu a meta.';
