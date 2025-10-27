CREATE TABLE IF NOT EXISTS points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sale_id UUID DEFAULT NULL REFERENCES sales(id) ON DELETE SET NULL,
  points DECIMAL(10,2) NOT NULL,
  accumulated_points DECIMAL(10,2) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_points_user ON points(user_id);
CREATE INDEX idx_points_sale ON points(sale_id);
CREATE INDEX idx_points_created ON points(created_at DESC);

COMMENT ON TABLE points IS 'Histórico de pontuação de gamificação';
COMMENT ON COLUMN points.accumulated_points IS 'Pontos acumulados totais até aquele momento';
