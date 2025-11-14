export const LEVELS_CONFIG = {
  elite: {
    name: 'Elite',
    phaseName: 'consultant',
    phaseNumber: 1,
    minPoints: 0,
    nextLevelPoints: 1000,
    minContracts: 1, // Mínimo 1 contrato/mês
    minKilowatts: 400, // Meta mensal de kW
    commission: {
      personal: 5, // 5% sobre venda
      insurance: 5, // 5% sobre seguro
      network: 0,
    },
    rewards: {
      basicBasket: 400, // Ganha cesta básica com 400 kW
    },
    advancementBonus: 300,
    advancementReward: 'R$ 300 + Kit Fortal',
    teamStructure: {
      maxDepth: 1, // Apenas 1 linha
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
    minKilowatts: 2000, // Meta pessoal mensal de 2000 kW
    demotionRule: {
      enabled: true,
      consecutiveMonthsBelowTarget: 3, // Volta para Elite após 3 meses sem bater meta
    },
    commission: {
      personal: 7, // 7% sobre venda
      insurance: 5, // 5% sobre seguro
      network: 2, // 2% sobre 1ª linha
    },
    advancementBonus: 1000,
    advancementReward: 'R$ 1.000 + Jantar com direito a acompanhante',
    teamStructure: {
      maxDepth: 2, // Até 2 linhas
      minFirstLine: 5, // Precisa ter 5 pessoas na 1ª linha
      minSecondLine: 2, // Precisa ter 2 pessoas na 2ª linha
      requiredLevels: ['consultant', 'master_consultant'], // Precisa ter Elite e Master na equipe
    },
  },
  seniorConsultant: {
    name: 'Consultor Sênior',
    phaseName: 'senior_consultant',
    phaseNumber: 3,
    minPoints: 10000,
    nextLevelPoints: 500000, // 500 mil pontos (acumulado com equipe)
    minContracts: 4, // OBRIGATÓRIO: mínimo 4 contratos/mês
    minKilowatts: 5000, // Meta pessoal mensal de 5000 kW
    minTeamSales: 500000, // Meta mensal obrigatória de R$ 500.000 (equipe geral)
    includeTeamPoints: true, // Acumula pontos da equipe para passar de fase
    commission: {
      personal: 10, // 10% sobre venda
      insurance: 5, // 5% sobre seguro
      network: 1.5, // 1.5% sobre 1ª linha
    },
    benefits: {
      fixedAllowance: 1518, // Ajuda de custo fixa de R$ 1.518
    },
    advancementBonus: 1500,
    advancementReward: 'R$ 1.500 + Jantar no Ilamare com acompanhante',
    teamStructure: {
      maxDepth: 4, // Direito a 4 linhas de equipe
      minFirstLine: 5, // Precisa ter 5 pessoas na 1ª linha
      minSecondLine: 2, // Precisa ter 2 pessoas na 2ª linha
      minRequiredLines: 2, // Precisa ter pelo menos 2 linhas completas
      requiredLevels: ['consultant', 'master_consultant'], // Precisa ter Elite e Master na equipe
    },
  },
  consultorPrime: {
    name: 'Consultor Prime',
    phaseName: 'prime_consultant',
    phaseNumber: 4,
    minPoints: 500000,
    nextLevelPoints: 800000, // 800 mil pontos (acumulado com equipe)
    minContracts: 5, // OBRIGATÓRIO: mínimo 5 contratos/mês
    minKilowatts: 10000, // Meta pessoal mensal de 10 mil kW
    includeTeamPoints: true, // Acumula pontos da equipe para passar de fase
    commission: {
      personal: 12, // 12% sobre venda
      insurance: 5, // 5% sobre seguro
      network: 1.5, // 1.5% sobre 1ª linha
    },
    benefits: {
      fixedAllowance: 1518, // Ajuda de custo fixa de R$ 1.518
    },
    advancementBonus: 1500,
    advancementReward: 'R$ 1.500 + Jantar no Ilamare com acompanhante',
    teamStructure: {
      maxDepth: 6, // Direito a 6 linhas de equipe
      minRequiredLines: 4, // Precisa ter no mínimo 4 linhas ativas na equipe
    },
  },
  executive: {
    name: 'Executivo',
    phaseName: 'executive',
    phaseNumber: 5,
    minPoints: 800000,
    nextLevelPoints: 2000000, // 2 milhões de pontos (acumulado com equipe)
    minContracts: 10, // OBRIGATÓRIO: mínimo 10 contratos/mês
    minKilowatts: 20000, // Meta pessoal mensal de 20 mil kW
    includeTeamPoints: true, // Acumula pontos da equipe para passar de fase
    includeUsinasPoints: true, // Direito a pontuação de usinas
    commission: {
      personal: 15, // 15% sobre venda
      insurance: 5, // 5% sobre seguro
      network: 1, // 1% sobre 1ª linha
      networkBonus: 0.5, // +0.5% sobre cada meta batida nas outras 9 linhas
    },
    benefits: {
      fixedAllowance: 1518, // Base de R$ 1.518
      bonusAllowance: 5000, // Sobe para R$ 5.000 quando faz 10 vendas
      bonusAllowanceTrigger: 10, // Número de vendas para ativar bônus
    },
    advancementBonus: 10000,
    advancementReward: 'R$ 10.000 + Fim de semana em Balneário Camboriú',
    teamStructure: {
      maxDepth: 10, // Direito a 10 linhas de equipe
      networkBonusLines: 9, // 0.5% sobre cada meta batida nas 9 linhas (além da 1ª)
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
};

// Helper function para obter configuração por role
export function getLevelConfig(role: string) {
  const levelKey = ROLE_TO_LEVEL_MAP[role];
  return levelKey ? LEVELS_CONFIG[levelKey] : null;
}
