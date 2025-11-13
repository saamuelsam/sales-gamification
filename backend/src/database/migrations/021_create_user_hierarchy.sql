-- ===============================================
-- 🧩 Migration: Criar tabela user_hierarchy
-- 🔹 Gerencia hierarquia de equipes (líder → subordinados)
-- 🔹 Data: 2025-11-12
-- ===============================================

BEGIN;

-- 🔸 Tabela de Hierarquia de Usuários
CREATE TABLE IF NOT EXISTS user_hierarchy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  leader_id UUID NOT NULL,
  subordinate_id UUID NOT NULL,
  line_level INTEGER NOT NULL DEFAULT 1,
  
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_hierarchy_leader FOREIGN KEY (leader_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_hierarchy_subordinate FOREIGN KEY (subordinate_id) 
    REFERENCES users(id) ON DELETE CASCADE,
  
  -- Garantir que não haja duplicações
  CONSTRAINT unique_hierarchy_pair UNIQUE (leader_id, subordinate_id)
);

-- 🔸 Índices para performance
CREATE INDEX IF NOT EXISTS idx_hierarchy_leader ON user_hierarchy(leader_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_subordinate ON user_hierarchy(subordinate_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_line_level ON user_hierarchy(line_level);

-- 🔸 Comentários explicativos
COMMENT ON TABLE user_hierarchy IS
'Tabela de hierarquia de usuários (líder → subordinados) para gestão de equipes e comissões de rede.';

COMMENT ON COLUMN user_hierarchy.leader_id IS
'ID do líder (gerente/upline) na hierarquia.';

COMMENT ON COLUMN user_hierarchy.subordinate_id IS
'ID do subordinado (membro da equipe/downline).';

COMMENT ON COLUMN user_hierarchy.line_level IS
'Nível de linha na hierarquia (1 = direto, 2 = segundo nível, etc).';

COMMIT;
