"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityAction = void 0;
exports.logActivity = logActivity;
exports.logActivitiesBatch = logActivitiesBatch;
exports.getUserActivityLogs = getUserActivityLogs;
exports.getActivityLogsByAction = getActivityLogsByAction;
exports.cleanupOldLogs = cleanupOldLogs;
exports.getActivityStats = getActivityStats;
// backend/src/utils/activityLogger.ts
const database_1 = require("../config/database");
const logger_1 = require("./logger");
/**
 * Tipos de ações permitidas (para melhor organização)
 */
var ActivityAction;
(function (ActivityAction) {
    // Ações de Equipe
    ActivityAction["ADD_TEAM_MEMBER"] = "Adicionou novo membro \u00E0 equipe";
    ActivityAction["REMOVE_TEAM_MEMBER"] = "Removeu membro da equipe";
    // Ações de Comissões
    ActivityAction["NEW_COMMISSION"] = "Recebeu nova comiss\u00E3o da rede";
    ActivityAction["PERSONAL_COMMISSION"] = "Recebeu comiss\u00E3o pessoal";
    ActivityAction["NETWORK_COMMISSION"] = "Recebeu comiss\u00E3o de rede";
    ActivityAction["MARK_COMMISSION_PAID"] = "Marcou comiss\u00E3o como paga";
    ActivityAction["ADMIN_MARK_COMMISSION_PAID"] = "Marcou comiss\u00E3o como paga (admin)";
    // Ações de Vendas
    ActivityAction["CREATE_SALE"] = "Registrou nova venda";
    ActivityAction["UPDATE_SALE"] = "Atualizou venda";
    ActivityAction["DELETE_SALE"] = "Removeu venda";
    ActivityAction["APPROVE_SALE"] = "Venda aprovada";
    ActivityAction["REJECT_SALE"] = "Venda rejeitada";
    // Ações de Níveis
    ActivityAction["LEVEL_UP"] = "Subiu de n\u00EDvel";
    ActivityAction["LEVEL_DOWN"] = "Rebaixado de n\u00EDvel";
    // Ações de Recompensas
    ActivityAction["REWARD_EARNED"] = "Conquistou recompensa";
    ActivityAction["REWARD_CLAIMED"] = "Resgatou recompensa";
    // Ações Administrativas
    ActivityAction["UPDATE_USER_STATUS"] = "Atualizou status de usu\u00E1rio";
    ActivityAction["UPDATE_USER_ROLE"] = "Alterou fun\u00E7\u00E3o de usu\u00E1rio";
    ActivityAction["UPDATE_SYSTEM_CONFIG"] = "Alterou configura\u00E7\u00F5es globais";
    ActivityAction["SEND_GLOBAL_NOTIFICATION"] = "Enviou notifica\u00E7\u00E3o global";
    ActivityAction["DELETE_NOTIFICATION"] = "Deletou notifica\u00E7\u00E3o";
    // Ações de Autenticação
    ActivityAction["USER_LOGIN"] = "Realizou login";
    ActivityAction["USER_LOGOUT"] = "Realizou logout";
    ActivityAction["FAILED_LOGIN"] = "Tentativa de login falhou";
    ActivityAction["PASSWORD_RESET"] = "Redefiniu senha";
    ActivityAction["REGISTER"] = "Registrou novo usu\u00E1rio";
    // Erros
    ActivityAction["SYSTEM_ERROR"] = "Erro cr\u00EDtico do sistema";
    ActivityAction["USER_ERROR"] = "Erro na opera\u00E7\u00E3o do usu\u00E1rio";
})(ActivityAction || (exports.ActivityAction = ActivityAction = {}));
/**
 * ✅ Registrar atividade do usuário no sistema
 *
 * @param userId - ID do usuário (null para ações do sistema)
 * @param action - Descrição da ação realizada
 * @param metadata - Dados adicionais sobre a ação
 */
async function logActivity(userId, action, metadata) {
    try {
        // Validar se a tabela existe antes de inserir
        const tableExists = await checkTableExists();
        if (!tableExists) {
            logger_1.logger.warn('⚠️ Tabela activity_logs não existe. Pulando log.');
            return;
        }
        // Preparar metadata
        const preparedMetadata = {
            ...metadata,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
        };
        // Inserir no banco
        await database_1.pool.query(`INSERT INTO activity_logs (user_id, action, metadata, created_at)
       VALUES ($1, $2, $3, NOW())`, [userId, action, JSON.stringify(preparedMetadata)]);
        // Log informativo (apenas em desenvolvimento)
        if (process.env.NODE_ENV !== 'production') {
            logger_1.logger.info(`📝 [ACTIVITY_LOG] ${action} - User: ${userId || 'SYSTEM'}`);
        }
    }
    catch (error) {
        // Não quebrar a aplicação se o log falhar
        logger_1.logger.error(`❌ [ACTIVITY_LOG] Erro ao registrar: ${error.message}`);
        // Em produção, pode enviar para serviço de monitoramento (Sentry, etc)
        if (process.env.NODE_ENV === 'production') {
            // Exemplo: Sentry.captureException(error);
        }
    }
}
/**
 * ✅ Registrar múltiplas atividades em lote
 * Útil para operações em massa
 */
async function logActivitiesBatch(activities) {
    try {
        const tableExists = await checkTableExists();
        if (!tableExists)
            return;
        // Preparar valores para insert em lote
        const values = [];
        const placeholders = [];
        activities.forEach((activity, index) => {
            const offset = index * 3;
            placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
            values.push(activity.userId, activity.action, JSON.stringify({
                ...activity.metadata,
                timestamp: new Date().toISOString(),
            }));
        });
        // Insert em lote
        await database_1.pool.query(`INSERT INTO activity_logs (user_id, action, metadata)
       VALUES ${placeholders.join(', ')}`, values);
        logger_1.logger.info(`📝 [ACTIVITY_LOG] ${activities.length} logs registrados em lote`);
    }
    catch (error) {
        logger_1.logger.error(`❌ [ACTIVITY_LOG] Erro ao registrar lote: ${error.message}`);
    }
}
/**
 * ✅ Buscar logs de atividade de um usuário específico
 */
async function getUserActivityLogs(userId, limit = 50) {
    try {
        const result = await database_1.pool.query(`SELECT id, action, metadata, created_at
       FROM activity_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`, [userId, limit]);
        return result.rows;
    }
    catch (error) {
        logger_1.logger.error(`❌ [ACTIVITY_LOG] Erro ao buscar logs do usuário: ${error.message}`);
        return [];
    }
}
/**
 * ✅ Buscar logs de atividade por ação
 */
async function getActivityLogsByAction(action, limit = 50) {
    try {
        const result = await database_1.pool.query(`SELECT al.*, u.name as user_name, u.email as user_email
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.action = $1
       ORDER BY al.created_at DESC
       LIMIT $2`, [action, limit]);
        return result.rows;
    }
    catch (error) {
        logger_1.logger.error(`❌ [ACTIVITY_LOG] Erro ao buscar logs por ação: ${error.message}`);
        return [];
    }
}
/**
 * ✅ Limpar logs antigos (manutenção)
 * Remove logs com mais de X dias
 */
async function cleanupOldLogs(daysToKeep = 90) {
    try {
        const result = await database_1.pool.query(`DELETE FROM activity_logs
       WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
       RETURNING id`);
        const deletedCount = result.rowCount || 0;
        logger_1.logger.info(`🧹 [ACTIVITY_LOG] ${deletedCount} logs antigos removidos`);
        return deletedCount;
    }
    catch (error) {
        logger_1.logger.error(`❌ [ACTIVITY_LOG] Erro ao limpar logs antigos: ${error.message}`);
        return 0;
    }
}
/**
 * ✅ Verificar se a tabela activity_logs existe
 */
async function checkTableExists() {
    try {
        const result = await database_1.pool.query(`SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'activity_logs'
       )`);
        return result.rows[0]?.exists || false;
    }
    catch (error) {
        return false;
    }
}
/**
 * ✅ Estatísticas de logs de atividade
 */
async function getActivityStats(days = 7) {
    try {
        // Total de logs
        const totalResult = await database_1.pool.query(`SELECT COUNT(*)::int as total
       FROM activity_logs
       WHERE created_at >= NOW() - INTERVAL '${days} days'`);
        // Logs por ação
        const actionResult = await database_1.pool.query(`SELECT action, COUNT(*)::int as count
       FROM activity_logs
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY action
       ORDER BY count DESC
       LIMIT 10`);
        // Top usuários
        const usersResult = await database_1.pool.query(`SELECT al.user_id as "userId", u.name as "userName", COUNT(*)::int as count
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.created_at >= NOW() - INTERVAL '${days} days'
         AND al.user_id IS NOT NULL
       GROUP BY al.user_id, u.name
       ORDER BY count DESC
       LIMIT 10`);
        return {
            totalLogs: totalResult.rows[0]?.total || 0,
            logsByAction: actionResult.rows,
            topUsers: usersResult.rows,
        };
    }
    catch (error) {
        logger_1.logger.error(`❌ [ACTIVITY_LOG] Erro ao buscar estatísticas: ${error.message}`);
        return {
            totalLogs: 0,
            logsByAction: [],
            topUsers: [],
        };
    }
}
