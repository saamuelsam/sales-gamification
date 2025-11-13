-- ===============================================
-- 🧩 Migration: Atualização da tabela users para compatibilidade total com o backend
-- 🔹 Autor: Sam / Sales Gamification
-- 🔹 Data: 2025-11-12
-- ===============================================

BEGIN;

-- 🔸 Ativar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";

-- 🔸 Garantir que colunas esperadas existam
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS points NUMERIC(15,2) DEFAULT 0 CHECK (points >= 0),
  ADD COLUMN IF NOT EXISTS parent_id UUID NULL,
  ADD COLUMN IF NOT EXISTS path LTREE DEFAULT NULL;

-- 🔸 Garantir integridade hierárquica
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_parent'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_parent
      FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 🔸 Índices úteis para desempenho em hierarquias e consultas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_path ON users USING gist (path);

-- 🔸 Comentários explicativos
COMMENT ON COLUMN users.is_active IS
'Indica se o usuário está ativo no sistema (controle de acesso e login).';

COMMENT ON COLUMN users.points IS
'Pontuação acumulada total do usuário (para ranking e progressão de carreira).';

COMMENT ON COLUMN users.parent_id IS
'Referência ao líder direto do usuário na hierarquia de rede.';

COMMENT ON COLUMN users.path IS
'Representação hierárquica do usuário usando LTREE (ex: 1.2.5 representa o nível na árvore).';

COMMIT;

-- ✅ Fim do patch
