// backend/src/modules/network/network.service.ts
import { pool } from '../../config/database';
import { logger } from '../../utils/logger';

export class NetworkService {
  async getTeamSalesWithStatus(leaderId: string) {
    try {
      const result = await pool.query(
        `SELECT
          s.id,
          s.client_name,
          s.value,
          s.kilowatts,
          s.status,
          s.created_at,
          u.id as member_id,
          u.name as member_name,
          u.email as member_email,
          nc.commission_amount,
          nc.paid as commission_paid
        FROM user_hierarchy uh
        JOIN users u ON uh.subordinate_id = u.id
        JOIN sales s ON s.user_id = u.id
        LEFT JOIN network_commissions nc ON nc.sale_id = s.id AND nc.leader_id = $1
        WHERE uh.leader_id = $1
        ORDER BY s.created_at DESC`,
        [leaderId]
      );

      logger.info(`✅ Vendas da equipe encontradas: ${result.rows.length}`);
      return result.rows;
    } catch (error: any) {
      logger.error(`❌ Erro ao buscar vendas da equipe: ${error.message}`);
      throw error;
    }
  }

  // Novo método: Buscar resumo de comissões de rede
  async getNetworkCommissionsSummary(leaderId: string) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*)::int as total_commissions,
          COUNT(CASE WHEN nc.paid = FALSE THEN 1 END)::int as unpaid_commissions,
          COUNT(CASE WHEN nc.paid = TRUE THEN 1 END)::int as paid_commissions,
          COALESCE(SUM(CASE WHEN nc.paid = FALSE THEN nc.commission_amount ELSE 0 END), 0)::numeric as total_unpaid,
          COALESCE(SUM(CASE WHEN nc.paid = TRUE THEN nc.commission_amount ELSE 0 END), 0)::numeric as total_paid,
          COALESCE(SUM(nc.commission_amount), 0)::numeric as total_earned
        FROM network_commissions nc
        WHERE nc.leader_id = $1`,
        [leaderId]
      );

      const row = result.rows[0];
      const summary = {
        total_commissions: row.total_commissions || 0,
        unpaid_commissions: row.unpaid_commissions || 0,
        paid_commissions: row.paid_commissions || 0,
        total_unpaid: parseFloat(row.total_unpaid || 0),
        total_paid: parseFloat(row.total_paid || 0),
        total_earned: parseFloat(row.total_earned || 0),
      };

      logger.info(`💰 Resumo: Total=R$ ${summary.total_earned.toFixed(2)}`);
      return summary;
    } catch (error: any) {
      logger.error(`❌ Erro ao buscar resumo: ${error.message}`);
      throw error;
    }
  }
}

export const networkService = new NetworkService();
