export const LEVELS_CONFIG = {
  elite: {
    name: 'Elite',
    minPoints: 0,
    commission: {
      personal: 5,
      insurance: 5,
      network: 0,
    },
    benefits: {
      bonus: 0,
      helpValue: 0,
    },
    requirements: {
      minContracts: 1,
      minSalesValue: 0,
    },
    reward: 'Iniciar jornada de vendas',
  },
  master: {
    name: 'Master',
    minPoints: 1000,
    commission: {
      personal: 7,
      insurance: 5,
      network: 2,
    },
    benefits: {
      bonus: 1000,
      helpValue: 0,
      reward: 'Jantar com acompanhante',
    },
    requirements: {
      minContracts: 2,
      minSalesValue: 0,
    },
    nextGoal: 10000,
  },
  seniorConsultant: {
    name: 'Consultor Sênior',
    minPoints: 10000,
    commission: {
      personal: 10,
      insurance: 5,
      network: 1.5,
    },
    benefits: {
      bonus: 1500,
      helpValue: 1518,
      reward: 'Jantar com acompanhante',
    },
    requirements: {
      minContracts: 4,
      minSalesValue: 0,
      includeTeamPoints: true,
    },
    nextGoal: 500000,
  },
  consultorPrime: {
    name: 'Consultor Prime',
    minPoints: 500000,
    commission: {
      personal: 12,
      insurance: 5,
      network: 1.5,
    },
    benefits: {
      bonus: 1500,
      helpValue: 1518,
      reward: 'Jantar no Ilamare com acompanhante',
    },
    requirements: {
      minContracts: 5,
      minSalesValue: 800000,
      includeTeamPoints: true,
    },
    nextGoal: 500000,
  },
  executive: {
    name: 'Executivo',
    minPoints: 2000000,
    commission: {
      personal: 15,
      insurance: 5,
      network: 1,
    },
    benefits: {
      bonus: 10000,
      helpValue: 5000,
      reward: 'Fim de semana em Balneário Camboriú',
    },
    requirements: {
      minContracts: 0,
      minSalesValue: 400000,
      includeTeamPoints: true,
    },
    nextGoal: null,
  },
};

export const getLevelByPoints = (points: number) => {
  const levels = Object.values(LEVELS_CONFIG).sort((a, b) => b.minPoints - a.minPoints);
  return levels.find(level => points >= level.minPoints) || LEVELS_CONFIG.elite;
};

export const getNextLevel = (currentLevel: string) => {
  const order = ['elite', 'master', 'seniorConsultant', 'consultorPrime', 'executive'];
  const currentIndex = order.indexOf(currentLevel);
  return currentIndex < order.length - 1 ? LEVELS_CONFIG[order[currentIndex + 1] as keyof typeof LEVELS_CONFIG] : null;
};
