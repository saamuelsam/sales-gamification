-- Migration: Atualizar configuração completa de níveis
-- Adicionar novos campos para metas mensais, rebaixamento e estrutura de equipe

-- 1. Adicionar campos de metas mensais à tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS monthly_contracts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_kilowatts DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS months_below_target INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_target_check DATE;

-- 2. Adicionar campos de benefícios fixos
ALTER TABLE users
ADD COLUMN IF NOT EXISTS fixed_allowance DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_allowance DECIMAL(10,2) DEFAULT 0;

-- 3. Criar tabela de histórico de rebaixamento
CREATE TABLE IF NOT EXISTS user_level_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  previous_level VARCHAR(50) NOT NULL,
  new_level VARCHAR(50) NOT NULL,
  reason VARCHAR(255),
  changed_at TIMESTAMP DEFAULT NOW(),
  changed_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_user_level_history_user ON user_level_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_level_history_date ON user_level_history(changed_at);

-- 4. Criar tabela de requisitos de estrutura de equipe
CREATE TABLE IF NOT EXISTS team_structure_requirements (
  id SERIAL PRIMARY KEY,
  level VARCHAR(50) NOT NULL UNIQUE,
  min_first_line INTEGER DEFAULT 0,
  min_second_line INTEGER DEFAULT 0,
  max_depth INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Inserir requisitos de estrutura por nível
INSERT INTO team_structure_requirements (level, min_first_line, min_second_line, max_depth)
VALUES 
  ('consultant', 0, 0, 1),
  ('master_consultant', 5, 2, 2),
  ('senior_consultant', 5, 2, 4),
  ('prime_consultant', 0, 0, 6),
  ('executive', 0, 0, 10)
ON CONFLICT (level) DO UPDATE SET
  min_first_line = EXCLUDED.min_first_line,
  min_second_line = EXCLUDED.min_second_line,
  max_depth = EXCLUDED.max_depth,
  updated_at = NOW();

-- 6. Criar tabela de bônus de avanço
CREATE TABLE IF NOT EXISTS advancement_bonuses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_level VARCHAR(50) NOT NULL,
  to_level VARCHAR(50) NOT NULL,
  bonus_amount DECIMAL(10,2) NOT NULL,
  bonus_description TEXT,
  awarded_at TIMESTAMP DEFAULT NOW(),
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_advancement_bonuses_user ON advancement_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_advancement_bonuses_paid ON advancement_bonuses(paid);

-- 7. Criar tabela de premiações especiais
CREATE TABLE IF NOT EXISTS special_rewards (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type VARCHAR(100) NOT NULL, -- 'cesta_basica', 'trofeu', 'cruzeiro', 'moto', 'celular', 'viagem'
  reward_description TEXT,
  kilowatts_achieved DECIMAL(12,2),
  ranking_position INTEGER,
  period_start DATE,
  period_end DATE,
  awarded_at TIMESTAMP DEFAULT NOW(),
  delivered BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_special_rewards_user ON special_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_special_rewards_type ON special_rewards(reward_type);
CREATE INDEX IF NOT EXISTS idx_special_rewards_period ON special_rewards(period_start, period_end);

-- 8. Criar tabela de metas mensais obrigatórias
CREATE TABLE IF NOT EXISTS monthly_targets (
  id SERIAL PRIMARY KEY,
  level VARCHAR(50) NOT NULL UNIQUE,
  min_contracts INTEGER NOT NULL,
  min_kilowatts DECIMAL(12,2) NOT NULL,
  min_personal_kilowatts DECIMAL(12,2) DEFAULT 0,
  min_team_sales DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Inserir metas mensais por nível
INSERT INTO monthly_targets (level, min_contracts, min_kilowatts, min_personal_kilowatts, min_team_sales)
VALUES 
  ('consultant', 1, 400, 400, 0),
  ('master_consultant', 2, 2000, 2000, 0),
  ('senior_consultant', 4, 5000, 5000, 500000),
  ('prime_consultant', 5, 10000, 10000, 0),
  ('executive', 10, 20000, 20000, 0)
ON CONFLICT (level) DO UPDATE SET
  min_contracts = EXCLUDED.min_contracts,
  min_kilowatts = EXCLUDED.min_kilowatts,
  min_personal_kilowatts = EXCLUDED.min_personal_kilowatts,
  min_team_sales = EXCLUDED.min_team_sales,
  updated_at = NOW();

-- 10. Atualizar tabela de levels com novas configurações
UPDATE levels SET
  points_required = 1000,
  personal_commission = 5.0,
  network_commission = 0.0
WHERE role = 'consultant';

UPDATE levels SET
  points_required = 10000,
  personal_commission = 7.0,
  network_commission = 2.0
WHERE role = 'master_consultant';

UPDATE levels SET
  points_required = 500000,
  personal_commission = 10.0,
  network_commission = 1.5
WHERE role = 'senior_consultant';

UPDATE levels SET
  points_required = 800000,
  personal_commission = 12.0,
  network_commission = 1.5
WHERE role = 'prime_consultant';

UPDATE levels SET
  points_required = 2000000,
  personal_commission = 15.0,
  network_commission = 1.0
WHERE role = 'executive';

-- 11. Criar função para resetar contadores mensais
CREATE OR REPLACE FUNCTION reset_monthly_counters()
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET 
    monthly_contracts = 0,
    monthly_kilowatts = 0,
    last_target_check = CURRENT_DATE
  WHERE last_target_check < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- 12. Criar função para verificar rebaixamento
CREATE OR REPLACE FUNCTION check_user_demotion()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  target_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email, u.role, u.monthly_contracts, u.monthly_kilowatts, u.months_below_target
    FROM users u
    WHERE u.role IN ('master_consultant', 'senior_consultant', 'prime_consultant', 'executive')
    AND u.is_active = true
  LOOP
    -- Buscar meta do nível
    SELECT * INTO target_record 
    FROM monthly_targets 
    WHERE level = user_record.role;
    
    -- Verificar se não bateu meta
    IF target_record IS NOT NULL AND (
      user_record.monthly_contracts < target_record.min_contracts OR 
      user_record.monthly_kilowatts < target_record.min_kilowatts
    ) THEN
      -- Incrementar contador de meses abaixo da meta
      UPDATE users 
      SET months_below_target = COALESCE(months_below_target, 0) + 1
      WHERE id = user_record.id;
      
      -- Se passou 3 meses, rebaixar
      IF COALESCE(user_record.months_below_target, 0) >= 2 THEN
        -- Rebaixar um nível
        UPDATE users 
        SET 
          role = CASE 
            WHEN role = 'executive' THEN 'prime_consultant'
            WHEN role = 'prime_consultant' THEN 'senior_consultant'
            WHEN role = 'senior_consultant' THEN 'master_consultant'
            WHEN role = 'master_consultant' THEN 'consultant'
            ELSE role
          END,
          months_below_target = 0
        WHERE id = user_record.id;
        
        -- Registrar histórico
        INSERT INTO user_level_history (user_id, previous_level, new_level, reason, changed_by)
        VALUES (
          user_record.id, 
          user_record.role,
          CASE 
            WHEN user_record.role = 'executive' THEN 'prime_consultant'
            WHEN user_record.role = 'prime_consultant' THEN 'senior_consultant'
            WHEN user_record.role = 'senior_consultant' THEN 'master_consultant'
            WHEN user_record.role = 'master_consultant' THEN 'consultant'
            ELSE user_record.role
          END,
          'Não bateu meta por 3 meses consecutivos',
          'SYSTEM'
        );
      END IF;
    ELSE
      -- Resetar contador se bateu meta
      UPDATE users 
      SET months_below_target = 0
      WHERE id = user_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 13. Comentários nas tabelas
COMMENT ON TABLE user_level_history IS 'Histórico de mudanças de nível dos usuários';
COMMENT ON TABLE team_structure_requirements IS 'Requisitos de estrutura de equipe por nível';
COMMENT ON TABLE advancement_bonuses IS 'Bônus de avanço de nível pagos aos usuários';
COMMENT ON TABLE special_rewards IS 'Premiações especiais (cestas, troféus, cruzeiros, etc)';
COMMENT ON TABLE monthly_targets IS 'Metas mensais obrigatórias por nível';

COMMENT ON COLUMN users.monthly_contracts IS 'Contador de contratos no mês atual';
COMMENT ON COLUMN users.monthly_kilowatts IS 'Contador de kW vendidos no mês atual';
COMMENT ON COLUMN users.months_below_target IS 'Meses consecutivos abaixo da meta';
COMMENT ON COLUMN users.last_target_check IS 'Data da última verificação de meta';
