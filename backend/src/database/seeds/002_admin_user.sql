-- ===============================================
-- 🧩 Seed: Criação do usuário administrador inicial
-- 🔹 Autor: Sam / Sales Gamification
-- 🔹 Data: 2025-11-12
-- ===============================================

BEGIN;

-- 🔸 Hash bcrypt da senha padrão "admin123"
-- (Gerado via bcrypt com 10 rounds)
-- $2a$10$rY8qQWKvJZ5kXhKvYqXrHe0OZxZ5qX9pKL1pQHvFG8ZqV9qWkJYXK

INSERT INTO users (
  email,
  password,
  name,
  role,
  is_active,
  points,
  parent_id,
  path,
  created_at
) VALUES (
  'admin@fortal.com',
  '$2a$10$rY8qQWKvJZ5kXhKvYqXrHe0OZxZ5qX9pKL1pQHvFG8ZqV9qWkJYXK',
  'Administrador Fortal',
  'admin',
  TRUE,
  0,
  NULL,
  '1'::ltree,
  NOW()
)
ON CONFLICT (email)
DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = TRUE,
  password = EXCLUDED.password;

COMMIT;

-- 🔹 Comentários
COMMENT ON COLUMN users.email IS 'E-mail único do usuário, usado para autenticação.';
COMMENT ON COLUMN users.password IS 'Senha criptografada com bcrypt (10 rounds).';
COMMENT ON COLUMN users.path IS 'Nó raiz da hierarquia, representado como "1" (nível CEO/admin).';
