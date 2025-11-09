"use strict";
// backend/src/modules/levels/level.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.levelService = exports.LevelService = void 0;
const database_1 = require("../../config/database");
const notifications_service_1 = require("../notifications/notifications.service");
class LevelService {
    // Listar todos os níveis
    async getAllLevels() {
        try {
            const result = await database_1.pool.query('SELECT * FROM levels ORDER BY phase_number ASC');
            return result.rows;
        }
        catch (error) {
            console.error('Erro ao listar níveis:', error);
            throw error;
        }
    }
    // Buscar nível específico
    async getLevelById(id) {
        try {
            const result = await database_1.pool.query('SELECT * FROM levels WHERE id = $1', [id]);
            return result.rows[0];
        }
        catch (error) {
            console.error('Erro ao buscar nível:', error);
            throw error;
        }
    }
    // Buscar nível por pontos
    async getLevelByPoints(points) {
        try {
            const result = await database_1.pool.query(`SELECT * FROM levels 
         WHERE points_required <= $1 
         ORDER BY points_required DESC 
         LIMIT 1`, [points]);
            return result.rows[0];
        }
        catch (error) {
            console.error('Erro ao buscar nível por pontos:', error);
            throw error;
        }
    }
    // Verificar avanço de nível
    async checkLevelUp(userId, currentPoints, client) {
        try {
            // Buscar nível atual do usuário
            const userResult = await client.query(`SELECT level FROM users WHERE id = $1`, [userId]);
            const currentLevel = userResult.rows[0]?.level || 'Consultor Elite';
            // Buscar novo nível baseado em pontos
            const newLevelResult = await client.query(`SELECT * FROM levels 
         WHERE points_required <= $1 
         ORDER BY points_required DESC 
         LIMIT 1`, [currentPoints]);
            const newLevel = newLevelResult.rows[0];
            const nextLevelResult = await client.query(`SELECT * FROM levels 
         WHERE points_required > $1 
         ORDER BY points_required ASC 
         LIMIT 1`, [newLevel.points_required]);
            const nextLevel = nextLevelResult.rows[0];
            // Se mudou de nível
            if (newLevel.name !== currentLevel) {
                // Atualizar nível do usuário
                await client.query(`UPDATE users SET level = $1 WHERE id = $2`, [newLevel.name, userId]);
                // Registrar prêmio de avanço
                await client.query(`INSERT INTO rewards (user_id, reward_type, description, points_earned, threshold_reached, status)
           VALUES ($1, 'level_up', $2, $3, $4, 'pending')`, [
                    userId,
                    `Parabéns! Você subiu para ${newLevel.name}!`,
                    currentPoints,
                    newLevel.points_required,
                ]);
                // Criar notificação
                const bonusText = newLevel.advancement_bonus > 0
                    ? `💰 Bônus: R$ ${newLevel.advancement_bonus.toLocaleString('pt-BR')}\n`
                    : '';
                const helpText = newLevel.fixed_allowance
                    ? `🎁 Ajuda de Custo: R$ ${newLevel.fixed_allowance.toLocaleString('pt-BR')}/mês\n`
                    : '';
                const rewardText = newLevel.advancement_reward
                    ? `🏆 ${newLevel.advancement_reward}`
                    : '';
                const message = `🆙 Você atingiu o nível **${newLevel.name}**!\n\n${bonusText}${helpText}${rewardText}\n\n💼 Comissão Pessoal: ${newLevel.personal_commission}%`;
                await notifications_service_1.notificationsService.create(userId, {
                    type: 'level_up',
                    title: `🆙 Parabéns! Você é ${newLevel.name}!`,
                    message: message,
                    metadata: {
                        newLevel: newLevel.name,
                        previousLevel: currentLevel,
                        bonus: newLevel.advancement_bonus,
                        helpValue: newLevel.fixed_allowance,
                        reward: newLevel.advancement_reward,
                        commission: newLevel.personal_commission,
                    },
                });
                return {
                    leveledUp: true,
                    previousLevel: currentLevel,
                    newLevel: newLevel.name,
                    bonus: newLevel.advancement_bonus,
                    helpValue: newLevel.fixed_allowance,
                    reward: newLevel.advancement_reward,
                };
            }
            return { leveledUp: false };
        }
        catch (error) {
            console.error('Erro ao verificar avanço de nível:', error);
            return { leveledUp: false };
        }
    }
    // Buscar metas do usuário
    async getUserGoals(userId) {
        try {
            // Buscar dados do usuário
            const userResult = await database_1.pool.query(`SELECT id, level, points FROM users WHERE id = $1`, [userId]);
            const user = userResult.rows[0];
            if (!user)
                throw new Error('Usuário não encontrado');
            // Buscar nível atual
            const currentLevelResult = await database_1.pool.query(`SELECT * FROM levels WHERE name = $1`, [user.level]);
            const currentLevel = currentLevelResult.rows[0];
            if (!currentLevel)
                throw new Error('Nível atual não encontrado');
            // Buscar próximo nível
            const nextLevelResult = await database_1.pool.query(`SELECT * FROM levels 
       WHERE points_required > $1 
       ORDER BY points_required ASC 
       LIMIT 1`, [currentLevel.points_required]);
            const nextLevel = nextLevelResult.rows[0] || null;
            // Calcular progresso
            let progressPercentage = 0;
            let pointsToNextLevel = 0;
            if (nextLevel) {
                // Pontos necessários para passar do nível atual para o próximo
                const pointsNeededForNextLevel = parseFloat(nextLevel.points_required) - parseFloat(currentLevel.points_required);
                // Pontos que o usuário já tem além do mínimo do nível atual
                const userPointsAboveCurrentLevel = parseFloat(user.points) - parseFloat(currentLevel.points_required);
                // Calcular porcentagem (0-100%)
                progressPercentage = Math.max(0, Math.min(100, (userPointsAboveCurrentLevel / pointsNeededForNextLevel) * 100));
                // Quantos pontos faltam
                pointsToNextLevel = Math.max(0, parseFloat(nextLevel.points_required) - parseFloat(user.points));
                console.log('📊 Cálculo de Progresso:');
                console.log('  Pontos necessários para próximo nível:', pointsNeededForNextLevel);
                console.log('  Pontos do usuário acima do nível atual:', userPointsAboveCurrentLevel);
                console.log('  Porcentagem:', progressPercentage);
                console.log('  Pontos que faltam:', pointsToNextLevel);
            }
            const requirements = {
                minContracts: parseFloat(currentLevel.max_lines) || 0,
                minSalesValue: parseFloat(currentLevel.monthly_sales_goal) || 0,
                bonusGoal: parseFloat(currentLevel.bonus_goal) || 0,
            };
            return {
                currentLevel: currentLevel,
                currentPoints: parseFloat(user.points) || 0,
                nextLevel: nextLevel,
                progressPercentage: Math.round(progressPercentage),
                pointsToNextLevel: pointsToNextLevel,
                requirements: requirements,
            };
        }
        catch (error) {
            console.error('❌ Erro ao buscar metas:', error);
            throw error;
        }
    }
    // Criar novo nível (admin)
    async createLevel(data) {
        try {
            const { phase_number, name, subtitle, points_required, max_lines, personal_commission, insurance_commission, network_commission, fixed_allowance, monthly_sales_goal, bonus_goal, bonus_allowance, advancement_bonus, advancement_reward, } = data;
            const result = await database_1.pool.query(`INSERT INTO levels (
          phase_number, name, subtitle, points_required, max_lines,
          personal_commission, insurance_commission, network_commission,
          fixed_allowance, monthly_sales_goal, bonus_goal, bonus_allowance,
          advancement_bonus, advancement_reward
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`, [
                phase_number,
                name,
                subtitle,
                points_required,
                max_lines,
                personal_commission,
                insurance_commission,
                network_commission,
                fixed_allowance,
                monthly_sales_goal,
                bonus_goal,
                bonus_allowance,
                advancement_bonus,
                advancement_reward,
            ]);
            return result.rows[0];
        }
        catch (error) {
            console.error('Erro ao criar nível:', error);
            throw error;
        }
    }
    // Atualizar nível (admin)
    async updateLevel(id, data) {
        try {
            const entries = Object.entries(data);
            const fields = entries
                .map(([key], index) => `${key} = $${index + 1}`)
                .join(', ');
            const values = [...entries.map(([, value]) => value), id];
            const result = await database_1.pool.query(`UPDATE levels SET ${fields} WHERE id = $${values.length} RETURNING *`, values);
            return result.rows[0];
        }
        catch (error) {
            console.error('Erro ao atualizar nível:', error);
            throw error;
        }
    }
    // Deletar nível (admin)
    async deleteLevel(id) {
        try {
            await database_1.pool.query('DELETE FROM levels WHERE id = $1', [id]);
            return { success: true };
        }
        catch (error) {
            console.error('Erro ao deletar nível:', error);
            throw error;
        }
    }
    // Listar níveis com progresso do usuário (dashboard)
    async getLevelPathway(userId) {
        try {
            const userResult = await database_1.pool.query(`SELECT level, points FROM users WHERE id = $1`, [userId]);
            const user = userResult.rows[0];
            const levelsResult = await database_1.pool.query('SELECT * FROM levels ORDER BY phase_number ASC');
            const levels = levelsResult.rows.map((level) => ({
                ...level,
                achieved: user.points >= level.points_required,
                isCurrent: level.name === user.level,
            }));
            return levels;
        }
        catch (error) {
            console.error('Erro ao buscar pathway de níveis:', error);
            throw error;
        }
    }
}
exports.LevelService = LevelService;
exports.levelService = new LevelService();
