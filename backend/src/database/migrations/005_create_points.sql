-- 🔹 Tabela de histórico de pontuação de gamificação
CREATE TABLE IF NOT EXISTS points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sale_id UUID DEFAULT NULL REFERENCES sales(id) ON DELETE SET NULL,

  points DECIMAL(10,2) NOT NULL CHECK (points >= 0),
  accumulated_points DECIMAL(10,2) NOT NULL CHECK (accumulated_points >= 0),

  description VARCHAR(255),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_points_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_points_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
);

-- 🔹 Índices otimizados (com IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_points_user ON points(user_id);
CREATE INDEX IF NOT EXISTS idx_points_sale ON points(sale_id);
CREATE INDEX IF NOT EXISTS idx_points_created ON points(created_at DESC);

-- 🔹 Comentários explicativos
COMMENT ON TABLE points IS
'Histórico de pontuação de gamificação do sistema Fortal Engenharia Solar. 
Registra os pontos ganhos em vendas, consórcios e metas de desempenho.';

COMMENT ON COLUMN points.points IS
'Pontos obtidos pela venda (1 kW = 1 ponto).';

COMMENT ON COLUMN points.accumulated_points IS
'Total de pontos acumulados pelo usuário até o momento do registro.';

COMMENT ON COLUMN points.description IS
'Descrição contextual do ganho de pontos (ex: Venda de João Silva - 400kW).';
