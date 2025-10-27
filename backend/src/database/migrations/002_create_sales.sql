DROP TABLE IF EXISTS sales CASCADE;

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name VARCHAR(255) NOT NULL,
  value DECIMAL(12,2) NOT NULL CHECK (value >= 0),
  kilowatts DECIMAL(10,2) NOT NULL CHECK (kilowatts >= 0),
  insurance_value DECIMAL(12,2) DEFAULT NULL CHECK (insurance_value >= 0 OR insurance_value IS NULL),
  status VARCHAR(50) NOT NULL DEFAULT 'negotiation',
  template_type VARCHAR(50) DEFAULT NULL,
  notes TEXT,
  
  -- Compliance: verificar entrega do produto
  product_delivered BOOLEAN DEFAULT FALSE,
  delivery_date TIMESTAMP NULL,
  installation_proof_url VARCHAR(500) DEFAULT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  
  CONSTRAINT check_status CHECK (status IN ('negotiation', 'pending', 'approved', 'financing_denied', 'cancelled', 'delivered'))
);

CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_created ON sales(created_at DESC);

COMMENT ON TABLE sales IS 'Vendas de sistemas de energia solar';
COMMENT ON COLUMN sales.kilowatts IS 'Quantidade de kW vendida (1 kW = 1 ponto)';
COMMENT ON COLUMN sales.status IS 'negotiation, pending, approved, financing_denied, cancelled, delivered';
COMMENT ON COLUMN sales.product_delivered IS 'Verificação de entrega (compliance anti-pirâmide)';
