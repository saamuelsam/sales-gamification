-- Migration: Adicionar campos para pontos pessoais e de equipe

-- 1. Adicionar novas colunas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS personal_points NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_points NUMERIC(15,2) DEFAULT 0;

-- 2. Migrar pontos atuais para personal_points
UPDATE users 
SET personal_points = COALESCE(points, 0)
WHERE personal_points = 0;

-- 3. Garantir que points seja a soma de ambos
UPDATE users 
SET points = COALESCE(personal_points, 0) + COALESCE(team_points, 0);

-- 4. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_personal_points ON users(personal_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_team_points ON users(team_points DESC);

-- 5. Adicionar coluna source_info na tabela points para rastrear origem
ALTER TABLE points 
ADD COLUMN IF NOT EXISTS source_info JSONB;

-- Comentário da coluna
COMMENT ON COLUMN users.personal_points IS 'Pontos das vendas pessoais do usuário';
COMMENT ON COLUMN users.team_points IS 'Pontos acumulados das vendas da equipe';
COMMENT ON COLUMN points.source_info IS 'Informações adicionais sobre a origem dos pontos (ex: consultor que gerou, tipo)';