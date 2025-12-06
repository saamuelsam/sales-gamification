export const LEVELS_CONFIG = {
  elite: {
    name: 'Elite',
    phaseName: 'consultant',
    phaseNumber: 1,
    minPoints: 0,
    nextLevelPoints: 1000,
    minContracts: 1, // Obrigatório: mínimo 1 contrato/mês
    minKilowatts: 0, // Sem meta de kW (apenas contratos)
    commission: {
      personal: 5, // 5% sobre venda
      insurance: 5, // 5% adicional sobre seguro
      network: 0, // Não recebe comissão de rede
    },
    rewards: {
      basicBasket: 400, // Ganha cesta básica com 400 kW
    },
    advancementBonus: 300,
    advancementReward: 'Kit Fortal',
    teamStructure: {
      maxDepth: 0, // Não recebe de rede
      minFirstLine: 0,
      minSecondLine: 0,
    },
  },
  master: {
    name: 'Master',
    phaseName: 'master_consultant',
    phaseNumber: 2,
    minPoints: 1000,
    nextLevelPoints: 10000,
    minContracts: 2, // OBRIGATÓRIO: mínimo 2 contratos/mês
    minKilowatts: 4000, // Meta pessoal mensal de 4000 pontos
    demotionRule: {
      enabled: true,
      consecutiveMonthsBelowTarget: 3, // Volta para Elite após 3 meses sem bater meta
    },
    commission: {
      personal: 7, // 7% sobre venda
      insurance: 5, // 5% sobre seguro
      network: 2, // 2% sobre 1ª linha
      networkRest: 0.5, // 0.5% sobre 2ª linha
    },
    advancementBonus: 1000,
    advancementReward: 'Jantar no Sal e Brasa com direito a acompanhante',
    teamStructure: {
      maxDepth: 2, // Até 2 linhas
      minFirstLine: 5, // Precisa ter 5 pessoas ativas na 1ª linha
      minSecondLine: 0, // Não há requisito de 2ª linha
      requiredLevels: ['consultant', 'master_consultant'], // Precisa ter Elite e Master na equipe
    },
  },
  seniorConsultant: {
    name: 'Consultor Sênior',
    phaseName: 'senior_consultant',
    phaseNumber: 3,
    minPoints: 10000,
    nextLevelPoints: 400000, // 400 mil pontos para avançar
    minContracts: 4, // OBRIGATÓRIO: mínimo 4 contratos/mês
    minKilowatts: 5000, // Meta pessoal mensal de 5000 kW
    includeTeamPoints: true, // Acumula pontos da equipe para passar de fase
    commission: {
      personal: 10, // 10% sobre venda direta (base)
      insurance: 5, // 5% adicional se for seguro
      network: 1.5, // 1.5% sobre 1ª linha APENAS
    },
    benefits: {
      fixedAllowance: 1518, // Ajuda de custo fixa de R$ 1.518
    },
    advancementBonus: 1500,
    advancementReward: 'R$ 1.500 + Jantar no Grand Parrilla Steak House',
    teamStructure: {
      maxDepth: 4, // Estrutura considerada até 4 linhas de profundidade
      minFirstLine: 8, // Mínimo 8 pessoas na 1ª linha (requisito obrigatório)
      minSecondLine: 2, // Mínimo 2 pessoas na 2ª linha (requisito obrigatório)
      minRequiredLines: 2, // Precisa ter pelo menos 2 linhas ativas
      requiredLevels: ['consultant', 'master_consultant'], // Precisa ter Elite e Master na equipe
    },
  },
  consultorPrime: {
    name: 'Consultor Prime',
    phaseName: 'prime_consultant',
    phaseNumber: 4,
    minPoints: 300000, // Meta pessoal base: 300.000 pontos
    nextLevelPoints: 800000, // Meta de avanço: 800k faturamento
    minContracts: 5, // OBRIGATÓRIO: mínimo 5 contratos/mês
    minKilowatts: 10000, // Meta pessoal mensal de 10 mil kW
    minTeamSales: 800000, // Faturamento obrigatório para avanço: R$ 800.000
    includeTeamPoints: true, // Acumula pontos da equipe para passar de fase
    commission: {
      personal: 10, // 10% sobre venda (base)
      insurance: 5, // 5% adicional específico para seguro
      network: 1.5, // 1.5% sobre 1ª linha (diretos)
      networkRest: 0.5, // 0.5% sobre restante da rede (linhas 2-6)
    },
    benefits: {
      fixedAllowance: 1518, // Base R$ 1.518 (ao atingir 300k pontos)
      bonusAllowance: 3036, // Dobra para R$ 3.036 (ao atingir 600k pontos)
      bonusAllowanceTrigger: 600000, // Meta de pontos para dobrar ajuda de custo
    },
    advancementBonus: 1500,
    advancementReward: 'R$ 1.500 + Jantar no Ilamare com acompanhante',
    teamStructure: {
      maxDepth: 6, // Direito a 6 linhas de equipe
      minRequiredLines: 3, // Precisa ter no mínimo 3 linhas ativas
      minFirstLine: 10, // Mínimo 10 pessoas na 1ª linha
      minSecondLine: 5, // Mínimo 5 pessoas na 2ª linha
      minThirdLine: 3, // Mínimo 3 pessoas na 3ª linha
    },
  },
  executive: {
    name: 'Executivo',
    phaseName: 'executive',
    phaseNumber: 5,
    minPoints: 800000,
    nextLevelPoints: 2000000, // 2 milhões de pontos (acumulado com equipe)
    minContracts: 10, // OBRIGATÓRIO: mínimo 10 contratos/mês
    minKilowatts: 600000, // Meta pessoal obrigatória de R$ 600.000
    minTeamSales: 700000, // Meta de avanço de R$ 700.000 (para ajuda de custo)
    includeTeamPoints: true, // Acumula pontos da equipe para passar de fase
    includeUsinasPoints: true, // Direito a pontuação de usinas
    commission: {
      personal: 13, // 13% sobre venda (base)
      insurance: 5, // 5% adicional sobre seguro
      network: 1, // 1% sobre 1ª linha
      networkRest: 0.5, // 0.5% sobre restante da rede (linhas 2-10)
    },
    benefits: {
      fixedAllowance: 1518, // Base de R$ 1.518
      bonusAllowance: 2000, // Sobe para R$ 2.000 quando atinge meta de avanço (R$ 700k)
      bonusAllowanceTrigger: 700000, // Meta de vendas para ativar ajuda de custo maior
    },
    advancementBonus: 10000,
    advancementReward: 'R$ 10.000 + Fim de semana em Balneário Camboriú',
    teamStructure: {
      maxDepth: 10, // Direito a 10 linhas de equipe
      networkBonusLines: 9, // 0.5% sobre restante da rede (9 linhas além da 1ª)
    },
  },
  ceo: {
    name: 'CEO',
    phaseName: 'ceo',
    phaseNumber: 6,
    minPoints: 2000000,
    nextLevelPoints: null, // Nível máximo
    minContracts: 10,
    minKilowatts: 20000,
    includeTeamPoints: true,
    includeUsinasPoints: true,
    commission: {
      personal: 15,
      insurance: 5,
      network: 1,
      networkBonus: 0.5,
    },
    benefits: {
      fixedAllowance: 5000,
      bonusAllowance: 5000,
    },
    advancementBonus: 0,
    advancementReward: null,
    teamStructure: {
      maxDepth: 10,
      networkBonusLines: 9,
    },
  },
  diretorComercial: {
    name: 'Diretor Comercial',
    phaseName: 'diretor_comercial',
    phaseNumber: 7,
    minPoints: 0,
    nextLevelPoints: null, // Cargo fixo, não há progressão
    minContracts: 0, // Sem meta mínima (cargo de gestão)
    minKilowatts: 0, // Sem meta mínima (cargo de gestão)
    includeTeamPoints: false,
    includeUsinasPoints: false,
    commission: {
      personal: 10, // ⚠️ 10% comissão pessoal - VALOR CORRETO
      insurance: 5, // 5% sobre seguro
      network: 2, // 2% sobre 1ª linha, 0.5% linhas 2-10
    },
    benefits: {
      fixedAllowance: 0, // Sem ajuda de custo fixa
    },
    advancementBonus: 0,
    advancementReward: null,
    teamStructure: {
      maxDepth: 10, // Até 10 linhas na rede
      networkBonusLines: 0,
    },
  },
};

// Premiações especiais (independentes dos níveis)
export const SPECIAL_REWARDS = {
  quarterly: {
    name: 'Premiação Trimestral',
    description: 'Troféus e premiações a cada 3 meses',
    frequency: 'trimestral',
  },
  annual: {
    top10Cruise: {
      name: 'Cruzeiro Top 10',
      description: 'Cruzeiro de final de ano para os Top 10 vendedores',
      eligibility: 'top_10_ranking',
    },
    electricBike: {
      name: 'Sorteio de Motos Elétricas',
      description: 'Sorteio de motos elétricas',
      type: 'raffle',
    },
    smartphone: {
      name: 'Entrega de Celulares',
      description: 'Premiação de celulares',
      type: 'award',
    },
    trips: {
      name: 'Viagens',
      description: 'Viagens de incentivo',
      type: 'award',
    },
  },
};

// Mapeamento de roles para configuração
export const ROLE_TO_LEVEL_MAP: Record<string, keyof typeof LEVELS_CONFIG> = {
  consultant: 'elite',
  master_consultant: 'master',
  senior_consultant: 'seniorConsultant',
  prime_consultant: 'consultorPrime',
  executive: 'executive',
  ceo: 'ceo',
  diretor_comercial: 'diretorComercial',
};

// Helper function para obter configuração por role
export function getLevelConfig(role: string) {
  const levelKey = ROLE_TO_LEVEL_MAP[role];
  return levelKey ? LEVELS_CONFIG[levelKey] : null;
}
