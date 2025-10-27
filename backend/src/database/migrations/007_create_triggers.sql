CREATE TABLE IF NOT EXISTS network_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  line_level INT NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_network_commissions_leader ON network_commissions(leader_id);
CREATE INDEX idx_network_commissions_member ON network_commissions(team_member_id);
CREATE INDEX idx_network_commissions_sale ON network_commissions(sale_id);

COMMENT ON TABLE network_commissions IS 'Comissões de rede (apenas 1ª linha - compliance)';
