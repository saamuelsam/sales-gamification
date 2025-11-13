-- 🔹 Migration: Criar tabelas de Notificações e Recompensas
-- 🔹 Versão: 2025-10-28
-- 🔹 Contexto: Sistema de gamificação e feedback Fortal Engenharia Solar

BEGIN;

-- 🔸 Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('reward', 'level_up', 'goal_achieved', 'custom')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- 🔸 Índices otimizados
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 🔸 Comentários detalhados
COMMENT ON TABLE notifications IS
'Sistema de notificações internas da plataforma Fortal Engenharia Solar.
Usado para alertar usuários sobre metas atingidas, prêmios e avanços.';

COMMENT ON COLUMN notifications.type IS
'Tipo de notificação: reward, level_up, goal_achieved, custom.';

COMMENT ON COLUMN notifications.metadata IS
'Dados adicionais em JSON (ex: tipo de prêmio, pontos, detalhes da meta).';


-- 🔸 Tabela de Recompensas / Prêmios
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID NOT NULL,
  reward_type VARCHAR(50) NOT NULL CHECK (
    reward_type IN ('cesta_basica', 'bonus', 'prize', 'trip', 'level_up', 'custom')
  ),
  description TEXT NOT NULL,

  points_earned NUMERIC(10,2) NOT NULL CHECK (points_earned >= 0),
  threshold_reached NUMERIC(10,2) NOT NULL CHECK (threshold_reached >= 0),

  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'delivered', 'cancelled')
  ),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,

  CONSTRAINT fk_rewards_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- 🔸 Índices otimizados
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON rewards(created_at DESC);

-- 🔸 Comentários explicativos
COMMENT ON TABLE rewards IS
'Tabela de controle de prêmios e recompensas obtidas por performance (gamificação).';

COMMENT ON COLUMN rewards.reward_type IS
'Tipo de prêmio: cesta_basica, bônus, prêmio, viagem ou outro (custom).';

COMMENT ON COLUMN rewards.status IS
'Situação do prêmio: pending (aguardando entrega), delivered (entregue), cancelled (cancelado).';

COMMENT ON COLUMN rewards.points_earned IS
'Quantidade de pontos (ou kW) que originaram o prêmio.';

COMMENT ON COLUMN rewards.threshold_reached IS
'Meta ou marco atingido que gerou a recompensa (ex: 400 kW).';

COMMIT;
