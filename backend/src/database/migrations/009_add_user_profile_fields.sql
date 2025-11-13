-- ==============================================
-- 009_add_user_profile_fields.sql
-- Adiciona campos de perfil do usuário
-- ==============================================

-- 🔹 Adicionar campos pessoais
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) UNIQUE,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 🔹 Adicionar campos de endereço
ALTER TABLE users
ADD COLUMN IF NOT EXISTS address_street VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_state VARCHAR(2),
ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10);

-- 🔹 Adicionar campos bancários e PIX
ALTER TABLE users
ADD COLUMN IF NOT EXISTS pix_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS pix_type VARCHAR(20) CHECK (pix_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS bank_agency VARCHAR(20),
ADD COLUMN IF NOT EXISTS bank_account VARCHAR(30),
ADD COLUMN IF NOT EXISTS bank_account_type VARCHAR(20) CHECK (bank_account_type IN ('corrente', 'poupanca'));

-- 🔹 Criar índices
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 🔹 Comentários descritivos
COMMENT ON COLUMN users.cpf IS 'CPF do usuário (formato: XXX.XXX.XXX-XX)';
COMMENT ON COLUMN users.phone IS 'Telefone com DDD (formato: (XX) XXXXX-XXXX)';
COMMENT ON COLUMN users.birth_date IS 'Data de nascimento';
COMMENT ON COLUMN users.pix_type IS 'Tipo da chave PIX: cpf, cnpj, email, phone, random';
COMMENT ON COLUMN users.bank_account_type IS 'Tipo de conta bancária: corrente ou poupanca';
