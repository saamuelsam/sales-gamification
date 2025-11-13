-- ==============================================
-- 001_create_users.sql
-- Tabela de usuários com hierarquia MLM (PostgreSQL)
-- ==============================================

-- 🔹 Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS ltree;

-- 🔹 Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'consultant' CHECK (role IN (
    'admin', 'ceo', 'director', 'executive', 'prime_consultant',
    'senior_consultant', 'master_consultant', 'consultant'
  )),

  -- Hierarquia com ltree
  path ltree,
  parent_id UUID DEFAULT NULL,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 🔹 Índices de performance
CREATE INDEX IF NOT EXISTS idx_users_path ON users USING GIST (path);
CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 🔹 Comentários descritivos
COMMENT ON TABLE users IS 'Tabela de usuários com hierarquia MLM (Marketing de Rede)';
COMMENT ON COLUMN users.path IS 'Caminho hierárquico em formato ltree (ex: 1.2.5 representa o nível 3)';
COMMENT ON COLUMN users.role IS 'Papéis: admin, ceo, director, executive, prime_consultant, senior_consultant, master_consultant, consultant';
COMMENT ON COLUMN users.parent_id IS 'Usuário líder direto na hierarquia MLM';
