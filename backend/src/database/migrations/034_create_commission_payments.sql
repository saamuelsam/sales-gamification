-- ===============================================
-- 🧩 Migration: Criar tabela de pagamentos de comissões
-- 🔹 Registra pagamentos via PIX
-- 🔹 Data: 2025-11-18
-- ===============================================

BEGIN;

-- Criar tabela de pagamentos de comissões
CREATE TABLE IF NOT EXISTS commission_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_type VARCHAR(20) NOT NULL DEFAULT 'pix',
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  commission_ids UUID[] NOT NULL,
  
  -- Dados do pagamento PIX
  pix_key_type VARCHAR(20),
  pix_key VARCHAR(255),
  pix_qr_code TEXT,
  pix_transaction_id VARCHAR(255),
  
  -- Dados bancários (fallback)
  bank_name VARCHAR(100),
  bank_agency VARCHAR(20),
  bank_account VARCHAR(50),
  bank_account_type VARCHAR(20),
  
  -- Status e auditoria
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  paid_by UUID REFERENCES users(id),
  paid_at TIMESTAMP,
  payment_proof_url VARCHAR(500),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT commission_payments_payment_type_check CHECK (payment_type IN ('pix', 'ted', 'doc', 'dinheiro')),
  CONSTRAINT commission_payments_status_check CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled'))
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_commission_payments_user ON commission_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_status ON commission_payments(status);
CREATE INDEX IF NOT EXISTS idx_commission_payments_created ON commission_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commission_payments_paid_by ON commission_payments(paid_by);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_commission_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER commission_payments_updated_at
  BEFORE UPDATE ON commission_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_payments_updated_at();

COMMIT;
