-- ==============================================
-- 026_add_financeiro_role.sql
-- Adiciona role 'financeiro' ao sistema
-- ==============================================

-- Remover constraint antiga
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Adicionar nova constraint com o role 'financeiro'
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (
  'ceo',
  'financeiro', 
  'admin',
  'director',
  'executive',
  'prime_consultant',
  'senior_consultant',
  'master_consultant',
  'consultant'
));

-- Atualizar comentário
COMMENT ON COLUMN users.role IS 'Hierarquia: ceo > financeiro > admin > director > executive > prime_consultant > senior_consultant > master_consultant > consultant';
