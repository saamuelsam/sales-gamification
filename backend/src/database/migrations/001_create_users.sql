-- Habilitar extensão ltree para hierarquia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS ltree;

-- Tabela de usuários com hierarquia
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'consultant',
  
  -- Hierarquia usando ltree (mais eficiente que adjacency list)
  path ltree,
  parent_id UUID DEFAULT NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX idx_users_path ON users USING GIST (path);
CREATE INDEX idx_users_parent ON users(parent_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Comentários
COMMENT ON TABLE users IS 'Tabela de usuários com hierarquia MLM';
COMMENT ON COLUMN users.path IS 'Caminho hierárquico usando ltree (ex: 1.2.5 representa nível 3)';
COMMENT ON COLUMN users.role IS 'Papéis: admin, director, master_consultant, consultant';
