-- Criar tabela de hierarquia de usuários
CREATE TABLE IF NOT EXISTS user_hierarchy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subordinate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  line_level INT NOT NULL DEFAULT 1,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(subordinate_id, leader_id),
  CHECK (subordinate_id != leader_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_hierarchy_subordinate ON user_hierarchy(subordinate_id);
CREATE INDEX IF NOT EXISTS idx_user_hierarchy_leader ON user_hierarchy(leader_id);
CREATE INDEX IF NOT EXISTS idx_user_hierarchy_level ON user_hierarchy(line_level);

-- Comentários
COMMENT ON TABLE user_hierarchy IS 'Tabela de hierarquia entre usuários (líder <-> subordinado)';
COMMENT ON COLUMN user_hierarchy.line_level IS 'Nível da linha: 1=direto, 2=segundo nível, etc';
