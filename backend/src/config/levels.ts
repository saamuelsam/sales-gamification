export const LEVELS_CONFIG = {
  elite: {
    name: 'Elite',
    phaseName: 'elite',
    phaseNumber: 1,
    minPoints: 0,
    nextLevelPoints: 1000,
    minContracts: 1, // Mínimo 1 contrato
    minKilowattsReward: 400, // Para recompensa de Cesta Básica
    commission: {
      personal: 5,
      insurance: 5,
      network: 0,
    },
    monthlyReward: 'Cesta Básica',
    advancementBonus: 0,
    advancementReward: 'Cesta Básica',
  },
  master: {
    name: 'Master',
    phaseName: 'master',
    phaseNumber: 2,
    minPoints: 1000,
    nextLevelPoints: 10000,
    minContracts: 2, // OBRIGATÓRIO: 2 contratos/mês
    commission: {
      personal: 7,
      insurance: 5,
      network: 2, // 2% sobre 1ª linha
    },
    monthlyReward: null,
    advancementBonus: 1000,
    advancementReward: 'R$ 1.000 + Jantar com acompanhante',
  },
  seniorConsultant: {
    name: 'Consultor Sênior',
    phaseName: 'seniorConsultant',
    phaseNumber: 3,
    minPoints: 10000,
    nextLevelPoints: 500000, // 500 mil pontos (equipe acumulada)
    minContracts: 4, // OBRIGATÓRIO: 4 contratos/mês
    minTeamPoints: 500000, // Incluir pontos da equipe
    monthlySalesGoal: 500000, // Meta mensal obrigatória
    commission: {
      personal: 10,
      insurance: 5,
      network: 1.5, // 1,5% sobre 1ª linha
    },
    monthlyReward: null,
    advancementBonus: 1500,
    advancementReward: 'R$ 1.500 + Jantar Ilamare com acompanhante',
    benefits: {
      fixedAllowance: 1518, // Ajuda de custo fixa
    },
  },
  consultorPrime: {
    name: 'Consultor Prime',
    phaseName: 'consultorPrime',
    phaseNumber: 4,
    minPoints: 500000,
    nextLevelPoints: 800000, // 800 mil pontos (equipe acumulada)
    minContracts: 5, // OBRIGATÓRIO: 5 contratos/mês
    minTeamPoints: 800000, // Incluir pontos da equipe
    commission: {
      personal: 12,
      insurance: 5,
      network: 1.5, // 1,5% sobre 1ª linha
    },
    monthlyReward: null,
    advancementBonus: 1500,
    advancementReward: 'R$ 1.500 + Jantar Ilamare com acompanhante',
    benefits: {
      fixedAllowance: 1518, // Ajuda de custo fixa
    },
  },
  executive: {
    name: 'Executivo',
    phaseName: 'executive',
    phaseNumber: 5,
    minPoints: 800000,
    nextLevelPoints: 2000000, // 2 milhões pontos (equipe)
    minContracts: 10, // OBRIGATÓRIO: 10 contratos/mês
    minTeamPoints: 2000000, // Incluir pontos da equipe
    commission: {
      personal: 15,
      insurance: 5,
      network: 1, // 1% sobre 1ª linha
    },
    monthlyReward: null,
    advancementBonus: 10000,
    advancementReward: 'R$ 10.000 + Fim de semana em Balneário Camboriú',
    benefits: {
      fixedAllowance: 1518, // Base
      bonusAllowance: 5000, // Sobe para R$ 5.000 ao atingir 10 vendas
    },
  },
};
