"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.levelProgressService = exports.LevelProgressService = void 0;
const database_1 = require("../../config/database");
const level_rules_1 = require("./level.rules");
class LevelProgressService {
    async calcularProximoNivel(user) {
        const nivelAtual = level_rules_1.levelRules.find(n => n.nome === user.role);
        if (!nivelAtual)
            return user.role;
        const proximo = level_rules_1.levelRules[level_rules_1.levelRules.indexOf(nivelAtual) + 1];
        if (!proximo)
            return user.role; // já é o máximo
        // 🔹 Regra de rebaixamento por inatividade
        if (nivelAtual.queda_inatividade &&
            user.meses_sem_contratos >= nivelAtual.queda_inatividade.meses_sem_contratos) {
            console.log(`⬇️ Rebaixando ${user.id} de ${user.role} para ${nivelAtual.queda_inatividade.rebaixar_para}`);
            await database_1.pool.query('UPDATE users SET role = $1 WHERE id = $2', [
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
            await database_1.pool.query('UPDATE users SET role = $1 WHERE id = $2', [proximo.nome, user.id]);
            return proximo.nome;
        }
        return user.role;
    }
}
exports.LevelProgressService = LevelProgressService;
exports.levelProgressService = new LevelProgressService();
