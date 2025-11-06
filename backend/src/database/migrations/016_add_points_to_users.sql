-- Adicionar coluna points tabela users para acumular pontos da carreira
ALTER TABLE users ADD COLUMN IF NOT EXISTS points NUMERIC(15,2) DEFAULT 0;

-- Criar índice para performance nas buscas por ranking
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);

COMMENT ON COLUMN users.points IS 'Pontos acumulados do usuário para progresso na carreira';
