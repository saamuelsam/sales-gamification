-- 🔹 Criar tabela de vendas de sistemas solares
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  client_name VARCHAR(255) NOT NULL,
  value DECIMAL(12,2) NOT NULL CHECK (value >= 0),
  kilowatts DECIMAL(10,2) NOT NULL CHECK (kilowatts >= 0),
  insurance_value DECIMAL(12,2) DEFAULT NULL CHECK (insurance_value >= 0 OR insurance_value IS NULL),

  status VARCHAR(50) NOT NULL DEFAULT 'negotiation' CHECK (
    status IN ('negotiation', 'pending', 'approved', 'financing_denied', 'cancelled', 'delivered')
  ),
  template_type VARCHAR(50) DEFAULT NULL,
  notes TEXT,

  -- Compliance: verificar entrega do produto
  product_delivered BOOLEAN DEFAULT FALSE,
  delivery_date TIMESTAMP NULL,
  installation_proof_url VARCHAR(500) DEFAULT NULL,

  -- Campos de auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL
);

-- 🔹 Adicionar colunas de consórcio, se não existirem
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_type VARCHAR(20) DEFAULT 'direct' 
  CHECK (sale_type IN ('direct', 'consortium', 'cash', 'card'));
ALTER TABLE sales ADD COLUMN IF NOT EXISTS consortium_value DECIMAL(12,2) CHECK (consortium_value >= 0 OR consortium_value IS NULL);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS consortium_term INTEGER CHECK (consortium_term >= 0 OR consortium_term IS NULL);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS consortium_monthly_payment DECIMAL(10,2) CHECK (consortium_monthly_payment >= 0 OR consortium_monthly_payment IS NULL);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS consortium_admin_fee DECIMAL(5,2) CHECK (consortium_admin_fee >= 0 OR consortium_admin_fee IS NULL);

-- 🔹 Índices otimizados
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at DESC);

-- 🔹 Comentários explicativos
COMMENT ON TABLE sales IS 'Vendas de sistemas de energia solar e consórcios (Fortal Engenharia Solar)';
COMMENT ON COLUMN sales.kilowatts IS 'Quantidade de kW vendida (1 kW = 1 ponto no plano de carreira)';
COMMENT ON COLUMN sales.status IS 'Estados possíveis: negotiation, pending, approved, financing_denied, cancelled, delivered';
COMMENT ON COLUMN sales.product_delivered IS 'Controle de entrega (compliance anti-pirâmide)';
COMMENT ON COLUMN sales.sale_type IS 'Tipo de venda: direct (financiamento direto), consortium (consórcio), cash (à vista), card (cartão)';
COMMENT ON COLUMN sales.consortium_value IS 'Valor total do consórcio (se aplicável)';
COMMENT ON COLUMN sales.consortium_term IS 'Prazo do consórcio em meses';
COMMENT ON COLUMN sales.consortium_monthly_payment IS 'Valor da parcela mensal do consórcio';
COMMENT ON COLUMN sales.consortium_admin_fee IS 'Taxa administrativa do consórcio (%)';
