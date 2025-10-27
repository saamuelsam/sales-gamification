-- Criar usuário admin inicial (senha: admin123)
-- Hash bcrypt da senha 'admin123'
INSERT INTO users (email, password, name, role, is_active, path)
VALUES (
  'admin@fortal.com',
  '$2a$10$rY8qQWKvJZ5kXhKvYqXrHe0OZxZ5qX9pKL1pQHvFG8ZqV9qWkJYXK',
  'Administrador Fortal',
  'admin',
  true,
  '1'::ltree
)
ON CONFLICT (email) DO NOTHING;
