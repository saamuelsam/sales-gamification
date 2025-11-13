-- 🔹 Migration: Adicionar campos de consórcio à tabela de vendas
-- 🔹 Versão: 2025-10-28 (Fortal Engenharia Solar)
-- 🔹 Propósito: incluir suporte a consórcios e diferentes tipos de venda

BEGIN;

-- 🔸 Adicionar coluna de tipo de venda
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS sale_type VARCHAR(20) DEFAULT 'direct'
  CONSTRAINT chk_sales_sale_type CHECK (sale_type IN ('direct', 'consortium', 'cash', 'card'));

-- 🔸 Adicionar campos específicos de consórcio
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS consortium_value DECIMAL(12,2) CHECK (consortium_value >= 0 OR consortium_value IS NULL),
  ADD COLUMN IF NOT EXISTS consortium_term INTEGER CHECK (consortium_term > 0 AND consortium_term <= 240),
  ADD COLUMN IF NOT EXISTS consortium_monthly_payment DECIMAL(10,2) CHECK (consortium_monthly_payment >= 0 OR consortium_monthly_payment IS NULL),
  ADD COLUMN IF NOT EXISTS consortium_admin_fee DECIMAL(5,2) CHECK (consortium_admin_fee >= 0 AND consortium_admin_fee <= 100);

-- 🔸 Índices otimizados
CREATE INDEX IF NOT EXISTS idx_sales_sale_type ON sales(sale_type);
CREATE INDEX IF NOT EXISTS idx_sales_consortium ON sales(sale_type) WHERE sale_type = 'consortium';

-- 🔸 Comentários explicativos
COMMENT ON COLUMN sales.sale_type IS
'Tipo de venda: direct (financiamento direto), consortium (consórcio), cash (à vista), card (cartão).';

COMMENT ON COLUMN sales.consortium_value IS
'Valor total contratado no consórcio (somatório das parcelas).';

COMMENT ON COLUMN sales.consortium_term IS
'Prazo total do consórcio em meses (ex: 60, 84, 120).';

COMMENT ON COLUMN sales.consortium_monthly_payment IS
'Valor estimado da parcela mensal do consórcio.';

COMMENT ON COLUMN sales.consortium_admin_fee IS
'Taxa administrativa do consórcio (%) — normalmente entre 10% e 20%.';

COMMIT;
