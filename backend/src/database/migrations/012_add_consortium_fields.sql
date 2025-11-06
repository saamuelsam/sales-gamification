-- Migration: Adicionar campos de consórcio
-- Data: 2025-10-28

BEGIN;

-- Adicionar coluna de tipo de venda
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS sale_type VARCHAR(20) DEFAULT 'direct' CHECK (sale_type IN ('direct', 'consortium', 'cash', 'card'));

-- Adicionar campos específicos de consórcio
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS consortium_value DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS consortium_term INTEGER CHECK (consortium_term > 0 AND consortium_term <= 240),
  ADD COLUMN IF NOT EXISTS consortium_monthly_payment DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS consortium_admin_fee DECIMAL(5,2) CHECK (consortium_admin_fee >= 0 AND consortium_admin_fee <= 100);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_sales_sale_type ON sales(sale_type);
CREATE INDEX IF NOT EXISTS idx_sales_consortium ON sales(sale_type) WHERE sale_type = 'consortium';

-- Comentários
COMMENT ON COLUMN sales.sale_type IS 'Tipo de venda: direct (financiamento), consortium (consórcio), cash (à vista)';
COMMENT ON COLUMN sales.consortium_value IS 'Valor total do consórcio contratado';
COMMENT ON COLUMN sales.consortium_term IS 'Prazo do consórcio em meses (ex: 60, 84, 120)';
COMMENT ON COLUMN sales.consortium_monthly_payment IS 'Valor estimado da parcela mensal';
COMMENT ON COLUMN sales.consortium_admin_fee IS 'Taxa de administração do consórcio (%)';

COMMIT;
