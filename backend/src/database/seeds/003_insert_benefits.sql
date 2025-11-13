-- ===============================================
-- 🎁 Seed: Benefícios por Nível de Carreira
-- 🔹 Autor: Sales Gamification System
-- 🔹 Data: 2025-11-12
-- ===============================================

-- Limpar benefícios existentes (opcional)
-- DELETE FROM benefits;

-- ========================================
-- 🔸 NÍVEL 1: CONSULTOR ELITE (0 pontos)
-- ========================================

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Kit Inicial de Consultor',
  'Kit completo para começar sua jornada: pasta executiva, canetas, bloco de notas e materiais de apresentação.',
  'kit',
  'advancement',
  'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400',
  'Entregue no primeiro dia de trabalho. Não cumulativo.',
  true
FROM levels l WHERE l.phase_number = 1;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Cesta Básica Mensal',
  'Cesta básica completa para você e sua família ao atingir a meta mensal de 400 kW.',
  'allowance',
  'monthly',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
  'Condicionado ao cumprimento da meta mensal de 400 kW instalados.',
  true
FROM levels l WHERE l.phase_number = 1;

-- ========================================
-- 🔸 NÍVEL 2: MASTER (1.000 pontos)
-- ========================================

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Bônus de Avanço R$ 1.000',
  'Bônus em dinheiro de R$ 1.000 ao conquistar o nível Master.',
  'allowance',
  'advancement',
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400',
  'Pago uma única vez ao atingir o nível. Sujeito a aprovação.',
  true
FROM levels l WHERE l.phase_number = 2;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Jantar Especial com Acompanhante',
  'Jantar em restaurante premium para você e um acompanhante de sua escolha.',
  'dinner',
  'advancement',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
  'Válido por 90 dias após conquista do nível. Necessário agendamento prévio.',
  true
FROM levels l WHERE l.phase_number = 2;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Troféu Master',
  'Troféu personalizado em reconhecimento à sua conquista no nível Master.',
  'trophy',
  'advancement',
  'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=400',
  'Entregue em cerimônia oficial da empresa.',
  true
FROM levels l WHERE l.phase_number = 2;

-- ========================================
-- 🔸 NÍVEL 3: CONSULTOR SÊNIOR (10.000 pontos)
-- ========================================

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Ajuda de Custo R$ 1.518/mês',
  'Ajuda de custo fixa mensal de R$ 1.518 para despesas profissionais.',
  'allowance',
  'monthly',
  'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=400',
  'Creditado mensalmente mediante cumprimento de metas mínimas.',
  true
FROM levels l WHERE l.phase_number = 3;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Bônus de Avanço R$ 1.500',
  'Bônus em dinheiro de R$ 1.500 ao conquistar o nível Consultor Sênior.',
  'allowance',
  'advancement',
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400',
  'Pago uma única vez ao atingir o nível.',
  true
FROM levels l WHERE l.phase_number = 3;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Jantar no Ilamare',
  'Experiência gastronômica exclusiva no restaurante Ilamare com acompanhante.',
  'dinner',
  'advancement',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
  'Válido por 120 dias. Inclui menu degustação completo.',
  true
FROM levels l WHERE l.phase_number = 3;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Notebook Profissional',
  'Notebook de última geração para otimizar seu trabalho e apresentações.',
  'electronics',
  'advancement',
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
  'Patrimônio da empresa. Deve ser devolvido em caso de desligamento.',
  true
FROM levels l WHERE l.phase_number = 3;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Troféu Consultor Sênior',
  'Troféu premium em reconhecimento à excelência em performance.',
  'trophy',
  'advancement',
  'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=400',
  'Troféu exclusivo personalizado com nome e data.',
  true
FROM levels l WHERE l.phase_number = 3;

-- ========================================
-- 🔸 NÍVEL 4: CONSULTOR PRIME (500.000 pontos)
-- ========================================

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Ajuda de Custo R$ 1.518/mês',
  'Ajuda de custo fixa mensal de R$ 1.518 para despesas profissionais e combustível.',
  'allowance',
  'monthly',
  'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=400',
  'Creditado mensalmente. Mantido durante permanência no nível.',
  true
FROM levels l WHERE l.phase_number = 4;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Bônus de Avanço R$ 1.500',
  'Bônus em dinheiro de R$ 1.500 ao conquistar o nível Consultor Prime.',
  'allowance',
  'advancement',
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400',
  'Pago uma única vez ao atingir o nível.',
  true
FROM levels l WHERE l.phase_number = 4;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Jantar Premium no Ilamare',
  'Experiência gastronômica VIP no Ilamare com menu especial e harmonização.',
  'dinner',
  'advancement',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400',
  'Válido por 120 dias. Inclui menu Prime com harmonização de vinhos.',
  true
FROM levels l WHERE l.phase_number = 4;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Smartphone Top de Linha',
  'Smartphone flagship para você estar sempre conectado com sua equipe.',
  'electronics',
  'advancement',
  'https://images.unsplash.com/photo-1592286927505-24c72cdd1281?w=400',
  'Patrimônio da empresa. Chip e plano corporativo inclusos.',
  true
FROM levels l WHERE l.phase_number = 4;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Viagem para Duas Pessoas',
  'Fim de semana em resort para você e acompanhante, com todas as despesas pagas.',
  'travel',
  'advancement',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
  'Válido por 6 meses. Inclui hospedagem, alimentação e transporte.',
  true
FROM levels l WHERE l.phase_number = 4;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Troféu Prime Exclusivo',
  'Troféu de cristal personalizado representando a elite da empresa.',
  'trophy',
  'advancement',
  'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=400',
  'Troféu de cristal com base em madeira nobre.',
  true
FROM levels l WHERE l.phase_number = 4;

-- ========================================
-- 🔸 NÍVEL 5: EXECUTIVO (800.000 pontos)
-- ========================================

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Ajuda de Custo R$ 1.518/mês (base)',
  'Ajuda de custo mensal inicial de R$ 1.518, que aumenta para R$ 5.000 ao atingir 10 vendas.',
  'allowance',
  'monthly',
  'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=400',
  'Base: R$ 1.518. Sobe para R$ 5.000 mensais ao completar 10 contratos no mês.',
  true
FROM levels l WHERE l.phase_number = 5;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Bônus de Avanço R$ 10.000',
  'Bônus especial de R$ 10.000 ao conquistar o nível Executivo.',
  'allowance',
  'advancement',
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400',
  'Pago uma única vez ao atingir o nível Executivo.',
  true
FROM levels l WHERE l.phase_number = 5;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Fim de Semana em Balneário Camboriú',
  'Experiência premium em resort 5 estrelas em Balneário Camboriú para toda a família.',
  'travel',
  'advancement',
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400',
  'Inclui hospedagem em resort, alimentação completa e passeios. Válido por 1 ano.',
  true
FROM levels l WHERE l.phase_number = 5;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Carro 0km',
  'Veículo 0km à sua escolha (categoria definida pela empresa) para uso profissional.',
  'vehicle',
  'advancement',
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
  'Veículo em comodato. Seguro e manutenção por conta da empresa. IPVA e combustível por conta do executivo.',
  true
FROM levels l WHERE l.phase_number = 5;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'MacBook Pro',
  'MacBook Pro de última geração para máxima produtividade e status profissional.',
  'electronics',
  'advancement',
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
  'Patrimônio da empresa. Inclui software profissional e garantia estendida.',
  true
FROM levels l WHERE l.phase_number = 5;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Troféu Executivo de Cristal',
  'Troféu de cristal importado celebrando sua chegada ao topo da carreira.',
  'trophy',
  'advancement',
  'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=400',
  'Troféu de cristal Bohemia com gravação personalizada e base iluminada.',
  true
FROM levels l WHERE l.phase_number = 5;

INSERT INTO benefits (level_id, title, description, category, period, image_url, terms, is_active)
SELECT 
  l.id,
  'Viagem Internacional',
  'Viagem internacional para destino à escolha, com passagens e hospedagem incluídas.',
  'travel',
  'annual',
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400',
  'Uma viagem anual para 2 pessoas. Destinos disponíveis: Miami, Orlando, Buenos Aires ou Santiago.',
  true
FROM levels l WHERE l.phase_number = 5;

-- ✅ Contagem final
SELECT 
  l.name as nivel,
  l.phase_number,
  COUNT(b.id) as total_beneficios
FROM levels l
LEFT JOIN benefits b ON b.level_id = l.id
GROUP BY l.id, l.name, l.phase_number
ORDER BY l.phase_number;
