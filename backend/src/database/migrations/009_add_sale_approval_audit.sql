-- Migration: Adicionar campos de auditoria e segurança para aprovação de vendas
-- Data: 2025-11-17
-- Descrição: Adiciona campos para rastrear quem aprovou/rejeitou vendas e quando

-- Adicionar colunas de auditoria na tabela sales
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS financial_notes TEXT,
  ADD COLUMN IF NOT EXISTS approval_ip VARCHAR(45),
  ADD COLUMN IF NOT EXISTS value_locked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMP DEFAULT NOW();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_approved_by ON sales(approved_by);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);

-- Adicionar trigger para rastrear mudanças de status
CREATE OR REPLACE FUNCTION update_last_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.last_status_change = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sales_status_change ON sales;
CREATE TRIGGER sales_status_change
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_last_status_change();

-- Criar tabela de histórico de aprovações para auditoria completa
CREATE TABLE IF NOT EXISTS sale_approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'pending', 'negotiation'
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  notes TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_history_sale ON sale_approval_history(sale_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_user ON sale_approval_history(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_created ON sale_approval_history(created_at DESC);

-- Comentários para documentação
COMMENT ON COLUMN sales.approved_by IS 'Usuário (financeiro/CEO) que aprovou a venda';
COMMENT ON COLUMN sales.rejected_by IS 'Usuário (financeiro/CEO) que rejeitou a venda';
COMMENT ON COLUMN sales.financial_notes IS 'Observações do financeiro sobre a aprovação/rejeição';
COMMENT ON COLUMN sales.approval_ip IS 'IP do usuário que aprovou/rejeitou para auditoria';
COMMENT ON COLUMN sales.value_locked IS 'Se TRUE, valor não pode mais ser editado';
COMMENT ON TABLE sale_approval_history IS 'Histórico completo de todas as mudanças de status para auditoria';
