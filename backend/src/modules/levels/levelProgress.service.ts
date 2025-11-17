import { pool } from '@config/database';
import { levelRules } from './level.rules';

interface UserStats {
  id: string;
  role: string;
  pontos: number;
  contratos_mes: number;
  meses_sem_contratos: number;
  tem_equipe: boolean;
}

export class LevelProgressService {
  async calcularProximoNivel(user: UserStats) {
    // 🔒 PROTEÇÃO: Não alterar roles administrativos (CEO, Admin, Financeiro, Diretor Comercial)
    const protectedRoles = ['ceo', 'admin', 'financeiro', 'diretor_comercial'];
    if (protectedRoles.includes(user.role.toLowerCase())) {
      console.log(`🔒 Role protegido: ${user.id} é ${user.role} - sem auto-promoção/rebaixamento`);
      return user.role;
    }

    const nivelAtual = levelRules.find(n => n.nome === user.role);
    if (!nivelAtual) return user.role;

    const proximo = levelRules[levelRules.indexOf(nivelAtual) + 1];
    if (!proximo) return user.role; // já é o máximo

    // 🔹 Regra de rebaixamento por inatividade
    if (
      nivelAtual.queda_inatividade &&
      user.meses_sem_contratos >= nivelAtual.queda_inatividade.meses_sem_contratos
    ) {
      console.log(`⬇️ Rebaixando ${user.id} de ${user.role} para ${nivelAtual.queda_inatividade.rebaixar_para}`);
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [
        nivelAtual.queda_inatividade.rebaixar_para,
        user.id,
      ]);
      return nivelAtual.queda_inatividade.rebaixar_para;
    }

    // 🔹 Requisitos para avançar
    const atingiuContratos = user.contratos_mes >= proximo.meta_contratos;
    const atingiuPontos = user.pontos >= proximo.pontos_meta_avanco;
    const temEquipe = !proximo.requisitos_equipes || user.tem_equipe;

    if (atingiuContratos && atingiuPontos && temEquipe) {
      console.log(`🚀 Promovendo ${user.id} de ${user.role} para ${proximo.nome}`);
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [proximo.nome, user.id]);
      return proximo.nome;
    }

    return user.role;
  }
}

export const levelProgressService = new LevelProgressService();
