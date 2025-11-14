// src/modules/notifications/notifications.service.ts
import { pool } from '@config/database';
import { logger } from '../../utils/logger';


export class NotificationsService {
  // ✅ CREATE - Criar notificação
  async create(userId: string, data: {
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }) {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, metadata, is_read)
         VALUES ($1, $2, $3, $4, $5, FALSE)
         RETURNING *`,
        [userId, data.type, data.title, data.message, JSON.stringify(data.metadata || {})]
      );
      
      logger.info(`✅ Notificação criada para usuário ${userId}: ${data.title}`);
      return result.rows[0];
    } catch (error: any) {
      logger.error(`❌ Erro ao criar notificação: ${error.message}`);
      throw error;
    }
  }

  // ✅ LIST - Listar notificações
  async list(userId: string, limit: number = 20, offset: number = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      return result.rows;
    } catch (error: any) {
      logger.error(`❌ Erro ao listar notificações: ${error.message}`);
      throw error;
    }
  }

  // ✅ GET UNREAD COUNT
  async getUnreadCount(userId: string) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*)::int as count
         FROM notifications
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );
      return result.rows[0].count;
    } catch (error: any) {
      logger.error(`❌ Erro ao contar notificações não lidas: ${error.message}`);
      throw error;
    }
  }

  // ✅ MARK AS READ - Corrigido para usar "is_read" ao invés de "read"
  async markAsRead(notificationId: string, userId: string) {
    try {
      const result = await pool.query(
        `UPDATE notifications 
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [notificationId, userId]
      );
      
      logger.info(`✅ Notificação ${notificationId} marcada como lida`);
      return result.rows[0];
    } catch (error: any) {
      logger.error(`❌ Erro ao marcar como lida: ${error.message}`);
      throw error;
    }
  }

  // ✅ MARK ALL AS READ
  async markAllAsRead(userId: string) {
    try {
      await pool.query(
        `UPDATE notifications 
         SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );
      
      logger.info(`✅ Todas as notificações do usuário ${userId} marcadas como lidas`);
    } catch (error: any) {
      logger.error(`❌ Erro ao marcar todas como lidas: ${error.message}`);
      throw error;
    }
  }

  // ✅ DELETE - Deletar notificação
  async delete(notificationId: string, userId: string) {
    try {
      await pool.query(
        `DELETE FROM notifications 
         WHERE id = $1 AND user_id = $2`,
        [notificationId, userId]
      );
      
      logger.info(`✅ Notificação ${notificationId} deletada`);
    } catch (error: any) {
      logger.error(`❌ Erro ao deletar notificação: ${error.message}`);
      throw error;
    }
  }
}

export const notificationsService = new NotificationsService();
