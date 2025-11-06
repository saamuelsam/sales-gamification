-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'reward', 'level_up', 'goal_achieved'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB, -- Dados extras (tipo de prêmio, pontos, etc)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Tabela de Prêmios
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL, -- 'cesta_basica', 'bonus', 'prize'
  description TEXT NOT NULL,
  points_earned NUMERIC(10,2) NOT NULL, -- kW que geraram o prêmio
  threshold_reached NUMERIC(10,2) NOT NULL, -- Meta atingida (ex: 400)
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'delivered', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

CREATE INDEX idx_rewards_user_id ON rewards(user_id);
CREATE INDEX idx_rewards_status ON rewards(status);
CREATE INDEX idx_rewards_created_at ON rewards(created_at DESC);

-- Comentários
COMMENT ON TABLE notifications IS 'Sistema de notificações para usuários';
COMMENT ON TABLE rewards IS 'Controle de prêmios e bonificações por performance';
