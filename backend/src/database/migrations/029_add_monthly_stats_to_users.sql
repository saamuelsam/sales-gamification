-- Migration: Adicionar colunas de estatísticas mensais na tabela users
-- Data: 2025-11-14

-- Adicionar colunas para tracking mensal
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS monthly_contracts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_kilowatts DECIMAL(12,2) DEFAULT 0;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_monthly_contracts ON users(monthly_contracts);
CREATE INDEX IF NOT EXISTS idx_users_monthly_kilowatts ON users(monthly_kilowatts);

-- Comentários
COMMENT ON COLUMN users.monthly_contracts IS 'Número de contratos do usuário no mês atual';
COMMENT ON COLUMN users.monthly_kilowatts IS 'Total de kilowatts vendidos no mês atual';
