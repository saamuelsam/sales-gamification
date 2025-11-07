-- 🧩 Atualização da tabela users para compatibilidade total com o backend

-- Ativar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";

-- Garantir que colunas esperadas existam
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS points NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS path LTREE DEFAULT NULL;

-- Criar índices úteis para desempenho em hierarquias e consultas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_path ON users USING gist (path);

-- ✅ Fim do patch
