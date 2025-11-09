"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEVELS_CONFIG = void 0;
exports.LEVELS_CONFIG = {
    elite: {
        name: 'Elite',
        minPoints: 0, // Começa como Elite
        nextLevelPoints: 1000, // Avança com 1000 pontos
        minContracts: 1,
        minKilowattsReward: 400, // APENAS para recompensa mensal de Cesta
        commission: {
            personal: 5,
            insurance: 5,
            network: 0,
        },
        monthlyReward: 'Cesta Básica', // Se atingir 400 kW + 1 contrato no mês
        bonus: null, // Sem bônus de avanço
    },
    master: {
        name: 'Master',
        nextLevelPoints: 10000,
        minContracts: 2,
        commission: {
            personal: 7,
            insurance: 5,
            network: 2,
        },
        monthlyReward: null,
        bonus: {
            amount: 1000,
            description: 'R$ 1.000,00 + Jantar com acompanhante',
        },
    },
    seniorConsultant: {
        name: 'Consultor Sênior',
        nextLevelPoints: 500000, // Pontos da equipe
        minContracts: 4,
        minTeamPoints: 500000,
        minSalesValue: 500000,
        commission: {
            personal: 10,
            insurance: 5,
            network: 1.5,
        },
        monthlyReward: null,
        bonus: {
            amount: 1500,
            description: 'R$ 1.500,00 + Jantar Ilamare com acompanhante',
        },
        benefits: {
            helpCost: 1518,
        },
    },
    consultorPrime: {
        name: 'Consultor Prime',
        nextLevelPoints: 800000, // Pontos da equipe
        minContracts: 5,
        minTeamPoints: 800000,
        minSalesValue: 800000,
        commission: {
            personal: 12,
            insurance: 5,
            network: 1.5,
        },
        monthlyReward: null,
        bonus: {
            amount: 1500,
            description: 'R$ 1.500,00 + Jantar Ilamare com acompanhante',
        },
        benefits: {
            helpCost: 1518,
        },
    },
    executive: {
        name: 'Executivo',
        nextLevelPoints: 2000000, // Pontos da equipe
        minContracts: 10,
        minTeamPoints: 2000000,
        minSalesValue: 400000,
        commission: {
            personal: 15,
            insurance: 5,
            network: 1,
        },
        monthlyReward: null,
        bonus: {
            amount: 10000,
            description: 'R$ 10.000,00 + Fim de semana em Balneário Camboriú',
        },
        benefits: {
            helpCost: 5000,
        },
    },
};
