CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  sale_commission DECIMAL(12,2) NOT NULL DEFAULT 0,
  insurance_commission DECIMAL(12,2) DEFAULT 0,
  total_commission DECIMAL(12,2) NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commissions_user ON commissions(user_id);
CREATE INDEX idx_commissions_sale ON commissions(sale_id);
CREATE INDEX idx_commissions_paid ON commissions(paid);

COMMENT ON TABLE commissions IS 'Comissões pessoais de vendas';
