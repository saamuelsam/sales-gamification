export const levelRules = [
  {
    nome: "elite",
    meta_contratos: 1, // Obrigatório 1 contrato/mês
    meta_kw: 0, // Sem meta de kW
    pontos_meta_avanco: 1000, // 1.000 pontos para avançar
    bonus_avanco: "R$ 300 + Kit Fortal",
    comissao_pessoal: 5,
    comissao_seguro: 5,
    comissao_rede: 0, // Não recebe comissão de rede
    beneficio_fixo: 0,
    requisitos_equipes: false,
    queda_inatividade: null,
  },
  {
    nome: "master",
    meta_contratos: 2,
    meta_pontos_pessoal: 4000, // 4 mil pontos mensais
    pontos_meta_avanco: 10000,
    bonus_avanco: "R$ 1.000 + Jantar no Sal e Brasa com acompanhante",
    comissao_pessoal: 7,
    comissao_seguro: 5,
    comissao_rede_primeira_linha: 2,
    comissao_rede_segunda_linha: 0.5,
    beneficio_fixo: 0,
    requisitos_equipes: true,
    estrutura_minima: {
      primeira_linha: 5, // Mínimo 5 pessoas ativas
      profundidade_maxima: 2 // Calcular até 2 linhas
    },
    queda_inatividade: {
      meses_sem_contratos: 3,
      rebaixar_para: "elite",
    },
  },
  {
    nome: "senior",
    meta_contratos: 4, // Obrigatório: 4 contratos/mês
    pontos_meta_avanco: 400000, // 400 mil pontos para avançar
    bonus_avanco: "R$ 1.500 + Jantar no Grand Parrilla Steak House",
    comissao_pessoal: 10, // 10% base
    comissao_seguro: 5, // 5% adicional se for seguro
    comissao_rede: 1.5, // 1.5% sobre 1ª linha APENAS
    beneficio_fixo: 1518,
    requisitos_equipes: true,
    estrutura_minima: {
      primeira_linha: 8, // Mínimo 8 pessoas na 1ª linha
      segunda_linha: 2, // Mínimo 2 pessoas na 2ª linha
      profundidade_maxima: 4, // Até 4 linhas consideradas
    },
    queda_inatividade: {
      meses_sem_contratos: 3,
      rebaixar_para: "master",
    },
  },
  {
    nome: "prime",
    meta_contratos: 5,
    meta_pontos_base: 300000, // 300k pontos para ajuda de custo base
    meta_pontos_dobrada: 600000, // 600k pontos para dobrar ajuda de custo
    faturamento_avanco: 800000, // R$ 800k para avançar de nível
    pontos_meta_avanco: 800000,
    bonus_avanco: "R$ 1.500 + Jantar no Ilamare com acompanhante",
    comissao_pessoal: 10, // 10% base
    comissao_seguro: 5, // 5% adicional específico para seguro
    comissao_rede_primeira_linha: 1.5, // 1.5% sobre diretos (1ª linha)
    comissao_rede_restante: 0.5, // 0.5% sobre restante da rede
    beneficio_fixo: 1518, // R$ 1.518 ao atingir 300k pontos
    beneficio_dobrado: 3036, // R$ 3.036 ao atingir 600k pontos
    requisitos_equipes: true,
    estrutura_minima: {
      primeira_linha: 10, // Mínimo 10 pessoas
      segunda_linha: 5, // Mínimo 5 pessoas
      terceira_linha: 3, // Mínimo 3 pessoas
    },
    queda_inatividade: {
      meses_sem_contratos: 3,
      rebaixar_para: "senior",
    },
  },
  {
    nome: "executivo",
    meta_contratos: 10,
    meta_pessoal_obrigatoria: 600000, // R$ 600.000 (piso mínimo)
    meta_avanco_ajuda_custo: 700000, // R$ 700.000 (para ajuda de custo de R$ 2.000)
    pontos_meta_avanco: 2000000, // 2 milhões de pontos
    bonus_avanco: "R$ 10.000 + Fim de semana em Balneário Camboriú",
    comissao_pessoal: 13, // 13% base
    comissao_seguro: 5, // 5% adicional específico para seguro
    comissao_rede_primeira_linha: 1, // 1% sobre 1ª linha
    comissao_rede_restante: 0.5, // 0.5% sobre restante da rede
    beneficio_fixo: 1518, // Base R$ 1.518
    beneficio_avancado: 2000, // R$ 2.000 ao atingir meta de avanço
    requisitos_equipes: true,
    queda_inatividade: {
      meses_sem_contratos: 3,
      rebaixar_para: "prime",
    },
  },
];
