-- ===============================================
-- 🧩 Migration: Adicionar dados PIX aos usuários
-- 🔹 Adiciona campos para pagamento via PIX
-- 🔹 Data: 2025-11-18
-- ===============================================

BEGIN;

-- Adicionar campos PIX ao perfil do usuário
ALTER TABLE users ADD COLUMN IF NOT EXISTS pix_key_type VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pix_key VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_type VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_agency VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_users_pix_key ON users(pix_key) WHERE pix_key IS NOT NULL;

-- Adicionar constraint para tipos válidos de chave PIX
ALTER TABLE users ADD CONSTRAINT users_pix_key_type_check 
  CHECK (pix_key_type IS NULL OR pix_key_type IN ('cpf', 'cnpj', 'email', 'telefone', 'chave_aleatoria'));

-- Adicionar constraint para tipos válidos de conta bancária
ALTER TABLE users ADD CONSTRAINT users_bank_account_type_check 
  CHECK (bank_account_type IS NULL OR bank_account_type IN ('corrente', 'poupanca', 'salario'));

COMMIT;
