import { pool } from '../../config/database';

export class NotificationsService {
  async create(userId: string, data: {
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }) {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, data.type, data.title, data.message, JSON.stringify(data.metadata || {})]
    );
    return result.rows[0];
  }

  async list(userId: string, limit: number = 20, offset: number = 0) {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  async getUnreadCount(userId: string) {
    const result = await pool.query(
      `SELECT COUNT(*)::int as count 
       FROM notifications 
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return result.rows[0].count;
  }

  async markAsRead(notificationId: string, userId: string) {
    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = NOW() 
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
  }

  async markAllAsRead(userId: string) {
    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = NOW() 
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
  }

  async delete(notificationId: string, userId: string) {
    await pool.query(
      `DELETE FROM notifications 
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
  }
}

export const notificationsService = new NotificationsService();
