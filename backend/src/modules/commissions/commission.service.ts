// backend/src/modules/commissions/commission.service.ts

import { pool } from '@config/database';

export class CommissionService {
  // Listar comissões do usuário
  async getUserCommissions(userId: string) {
    const result = await pool.query(
      `SELECT c.*, s.client_name, s.value, s.kilowatts, s.closed_at
       FROM commissions c
       INNER JOIN sales s ON s.id = c.sale_id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // Resumo de comissões do usuário
  async getUserCommissionsSummary(userId: string) {
    const result = await pool.query(
      `SELECT 
         u.id as user_id,
         u.name as user_name,
         COALESCE(SUM(c.total_commission), 0) as total_earned,
         COALESCE(SUM(CASE WHEN c.paid = true THEN c.total_commission ELSE 0 END), 0) as total_paid,
         COALESCE(SUM(CASE WHEN c.paid = false THEN c.total_commission ELSE 0 END), 0) as total_pending,
         COUNT(CASE WHEN c.paid = true THEN 1 END) as count_paid,
         COUNT(CASE WHEN c.paid = false THEN 1 END) as count_pending
       FROM users u
       LEFT JOIN commissions c ON c.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id, u.name`,
      [userId]
    );
    return result.rows[0];
  }

  // Marcar comissão como paga (admin)
  async markAsPaid(commissionId: string) {
    const result = await pool.query(
      `UPDATE commissions 
       SET paid = true, paid_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [commissionId]
    );
    return result.rows[0];
  }

  // Relatório geral de comissões (admin)
  async getCommissionsReport(filters: any = {}) {
    let query = `
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email,
        COALESCE(SUM(c.total_commission), 0) as total_earned,
        COALESCE(SUM(CASE WHEN c.paid = true THEN c.total_commission ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN c.paid = false THEN c.total_commission ELSE 0 END), 0) as total_pending,
        COUNT(c.id) as total_commissions
      FROM users u
      LEFT JOIN commissions c ON c.user_id = u.id
      WHERE u.is_active = true
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.startDate) {
      query += ` AND c.created_at >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND c.created_at <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    query += ' GROUP BY u.id, u.name, u.email ORDER BY total_earned DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }
}
