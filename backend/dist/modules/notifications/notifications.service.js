"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsService = exports.NotificationsService = void 0;
// src/modules/notifications/notifications.service.ts
const database_1 = require("../../config/database");
const logger_1 = require("../../utils/logger");
class NotificationsService {
    // ✅ CREATE - Criar notificação
    async create(userId, data) {
        try {
            const result = await database_1.pool.query(`INSERT INTO notifications (user_id, type, title, message, metadata, is_read)
         VALUES ($1, $2, $3, $4, $5, FALSE)
         RETURNING *`, [userId, data.type, data.title, data.message, JSON.stringify(data.metadata || {})]);
            logger_1.logger.info(`✅ Notificação criada para usuário ${userId}: ${data.title}`);
            return result.rows[0];
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro ao criar notificação: ${error.message}`);
            throw error;
        }
    }
    // ✅ LIST - Listar notificações
    async list(userId, limit = 20, offset = 0) {
        try {
            const result = await database_1.pool.query(`SELECT * FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`, [userId, limit, offset]);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro ao listar notificações: ${error.message}`);
            throw error;
        }
    }
    // ✅ GET UNREAD COUNT
    async getUnreadCount(userId) {
        try {
            const result = await database_1.pool.query(`SELECT COUNT(*)::int as count
         FROM notifications
         WHERE user_id = $1 AND is_read = FALSE`, [userId]);
            return result.rows[0].count;
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro ao contar notificações não lidas: ${error.message}`);
            throw error;
        }
    }
    // ✅ MARK AS READ - Corrigido para usar "is_read" ao invés de "read"
    async markAsRead(notificationId, userId) {
        try {
            const result = await database_1.pool.query(`UPDATE notifications 
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2
         RETURNING *`, [notificationId, userId]);
            logger_1.logger.info(`✅ Notificação ${notificationId} marcada como lida`);
            return result.rows[0];
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro ao marcar como lida: ${error.message}`);
            throw error;
        }
    }
    // ✅ MARK ALL AS READ
    async markAllAsRead(userId) {
        try {
            await database_1.pool.query(`UPDATE notifications 
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND is_read = FALSE`, [userId]);
            logger_1.logger.info(`✅ Todas as notificações do usuário ${userId} marcadas como lidas`);
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro ao marcar todas como lidas: ${error.message}`);
            throw error;
        }
    }
    // ✅ DELETE - Deletar notificação
    async delete(notificationId, userId) {
        try {
            await database_1.pool.query(`DELETE FROM notifications 
         WHERE id = $1 AND user_id = $2`, [notificationId, userId]);
            logger_1.logger.info(`✅ Notificação ${notificationId} deletada`);
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro ao deletar notificação: ${error.message}`);
            throw error;
        }
    }
}
exports.NotificationsService = NotificationsService;
exports.notificationsService = new NotificationsService();
