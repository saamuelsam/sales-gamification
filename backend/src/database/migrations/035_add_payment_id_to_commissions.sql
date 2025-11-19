-- ===============================================
-- 🧩 Migration: Adicionar campo paid_via_payment_id às comissões
-- 🔹 Relaciona comissões com pagamentos
-- 🔹 Data: 2025-11-18
-- ===============================================

BEGIN;

-- Adicionar referência ao pagamento nas tabelas de comissões
ALTER TABLE personal_commissions ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES commission_payments(id) ON DELETE SET NULL;
ALTER TABLE network_commissions ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES commission_payments(id) ON DELETE SET NULL;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_personal_commissions_payment ON personal_commissions(payment_id);
CREATE INDEX IF NOT EXISTS idx_network_commissions_payment ON network_commissions(payment_id);

-- Adicionar índice composto para buscar comissões não pagas de um usuário
CREATE INDEX IF NOT EXISTS idx_personal_commissions_unpaid_user ON personal_commissions(user_id, paid) WHERE paid = FALSE;
CREATE INDEX IF NOT EXISTS idx_network_commissions_unpaid_leader ON network_commissions(leader_id, paid) WHERE paid = FALSE;

COMMIT;
