"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewardsService = exports.RewardsService = void 0;
const database_1 = require("../../config/database");
const activityLogger_1 = require("../../utils/activityLogger");
class RewardsService {
    async checkMonthlyReward(userId, client) {
        const currentMonth = new Date();
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        // Buscar total de kW e vendas do mês
        const monthlyKwResult = await client.query(`SELECT 
         COALESCE(SUM(kilowatts), 0) as total_kw,
         COUNT(*)::int as total_sales
       FROM sales 
       WHERE user_id = $1 
         AND created_at >= $2
         AND status NOT IN ('cancelled', 'financing_denied')`, [userId, firstDayOfMonth]);
        const totalKw = parseFloat(monthlyKwResult.rows[0].total_kw);
        const totalSales = parseInt(monthlyKwResult.rows[0].total_sales);
        // Verificar se já ganhou prêmio este mês
        const existingRewardResult = await client.query(`SELECT id FROM rewards 
       WHERE user_id = $1 
         AND reward_type = 'cesta_basica'
         AND created_at >= $2`, [userId, firstDayOfMonth]);
        const hasRewardThisMonth = existingRewardResult.rows.length > 0;
        // REGRA: 400 kW + pelo menos 1 venda = Cesta Básica
        if (totalKw >= 400 && totalSales >= 1 && !hasRewardThisMonth) {
            // Registrar prêmio
            await client.query(`INSERT INTO rewards (user_id, reward_type, description, points_earned, threshold_reached, status)
         VALUES ($1, 'cesta_basica', 'Cesta Básica - 400 kW atingidos no mês', $2, 400, 'pending')`, [userId, totalKw]);
            // Criar notificação
            await client.query(`INSERT INTO notifications (user_id, type, title, message, metadata)
         VALUES ($1, 'reward', '🎁 Parabéns! Você ganhou uma Cesta Básica!', 
                 'Você atingiu 400 kW este mês e conquistou uma Cesta Básica! Entre em contato com a administração para retirar seu prêmio.', 
                 $2)`, [userId, JSON.stringify({ reward_type: 'cesta_basica', kw_total: totalKw, threshold: 400 })]);
            // 📝 LOG: Recompensa conquistada
            await (0, activityLogger_1.logActivity)(userId, 'Conquistou recompensa', {
                reward_type: 'cesta_basica',
                kw_total: totalKw,
                threshold: 400,
                description: 'Cesta Básica por atingir 400 kW no mês'
            });
            return true;
        }
        return false;
    }
    async list(userId) {
        const result = await database_1.pool.query(`SELECT * FROM rewards 
       WHERE user_id = $1 
       ORDER BY created_at DESC`, [userId]);
        return result.rows;
    }
}
exports.RewardsService = RewardsService;
exports.rewardsService = new RewardsService();
