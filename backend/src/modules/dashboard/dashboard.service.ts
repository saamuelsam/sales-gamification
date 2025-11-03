// backend/src/modules/dashboard/dashboard.service.ts
import { pool } from '../../config/database';
import { logger } from '../../utils/logger';

export class DashboardService {
  // Dashboard pessoal do usuário
  async getPersonalDashboard(userId: string) {
    const client = await pool.connect();

    try {
      // Vendas pessoais
      const salesResult = await client.query(
        `SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(value), 0) as total_revenue,
          COALESCE(SUM(kilowatts), 0) as total_kilowatts,
          COALESCE(AVG(value), 0) as average_sale_value
        FROM sales
        WHERE user_id = $1 AND status != 'cancelled'`,
        [userId]
      );

      // Pontos acumulados
      const pointsResult = await client.query(
        `SELECT 
          COALESCE(MAX(accumulated_points), 0) as total_points
        FROM points
        WHERE user_id = $1`,
        [userId]
      );

      const totalPoints = parseFloat(pointsResult.rows[0]?.total_points || 0);

      // Comissões
      const commissionsResult = await client.query(
        `SELECT 
          COALESCE(SUM(total_commission), 0) as total_commissions,
          COALESCE(SUM(CASE WHEN paid = false THEN total_commission ELSE 0 END), 0) as pending_commissions,
          COALESCE(SUM(CASE WHEN paid = true THEN total_commission ELSE 0 END), 0) as paid_commissions
        FROM commissions
        WHERE user_id = $1`,
        [userId]
      );

      // Nível atual baseado nos PONTOS (não no role)
      const levelResult = await client.query(
        `SELECT * FROM levels 
         WHERE points_required <= $1
         ORDER BY points_required DESC
         LIMIT 1`,
        [totalPoints]
      );

      const currentLevel = levelResult.rows[0] || null;

      // Atualizar role do usuário se necessário
      if (currentLevel) {
        const newRole = this.getRoleFromPhase(currentLevel.phase_number);
        await client.query(
          'UPDATE users SET role = $1 WHERE id = $2 AND role != $1',
          [newRole, userId]
        );
      }

      // ✅ GARANTIR TIPOS CORRETOS
      return {
        sales: {
          total_sales: parseInt(salesResult.rows[0]?.total_sales || 0),
          total_revenue: parseFloat(salesResult.rows[0]?.total_revenue || 0),
          total_kilowatts: parseFloat(salesResult.rows[0]?.total_kilowatts || 0),
          average_sale_value: parseFloat(salesResult.rows[0]?.average_sale_value || 0),
        },
        points: {
          total_points: totalPoints,
        },
        commissions: {
          total_commissions: parseFloat(commissionsResult.rows[0]?.total_commissions || 0),
          pending_commissions: parseFloat(commissionsResult.rows[0]?.pending_commissions || 0),
          paid_commissions: parseFloat(commissionsResult.rows[0]?.paid_commissions || 0),
        },
        level: currentLevel,
      };
    } catch (error) {
      logger.error('Erro ao buscar dashboard pessoal:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Dashboard da equipe (hierárquico)
  async getTeamDashboard(userId: string) {
    const client = await pool.connect();

    try {
      // Buscar path do usuário
      const userResult = await client.query(
        'SELECT path FROM users WHERE id = $1',
        [userId]
      );

      if (!userResult.rows[0]) {
        throw new Error('Usuário não encontrado');
      }

      const userPath = userResult.rows[0].path;

      // Membros diretos da equipe (1 nível abaixo)
      const membersResult = await client.query(
        `SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          COALESCE(p.total_points, 0) as total_points,
          COALESCE(s.total_sales, 0) as total_sales,
          COALESCE(s.total_revenue, 0) as total_revenue
        FROM users u
        LEFT JOIN (
          SELECT user_id, MAX(accumulated_points) as total_points
          FROM points
          GROUP BY user_id
        ) p ON u.id = p.user_id
        LEFT JOIN (
          SELECT user_id, 
                 COUNT(*) as total_sales,
                 SUM(value) as total_revenue
          FROM sales
          WHERE status != 'cancelled'
          GROUP BY user_id
        ) s ON u.id = s.user_id
        WHERE u.path <@ $1::ltree 
          AND u.path != $1::ltree
          AND nlevel(u.path) = nlevel($1::ltree) + 1
        ORDER BY p.total_points DESC`,
        [userPath]
      );

      // Totais da equipe (todos os níveis abaixo)
      const teamTotalsResult = await client.query(
        `SELECT 
          COUNT(DISTINCT u.id) as total_members,
          COALESCE(SUM(s.total_sales), 0) as total_sales,
          COALESCE(SUM(s.total_revenue), 0) as total_revenue,
          COALESCE(SUM(p.total_points), 0) as total_points
        FROM users u
        LEFT JOIN (
          SELECT user_id, MAX(accumulated_points) as total_points
          FROM points
          GROUP BY user_id
        ) p ON u.id = p.user_id
        LEFT JOIN (
          SELECT user_id, 
                 COUNT(*) as total_sales,
                 SUM(value) as total_revenue
          FROM sales
          WHERE status != 'cancelled'
          GROUP BY user_id
        ) s ON u.id = s.user_id
        WHERE u.path <@ $1::ltree 
          AND u.path != $1::ltree`,
        [userPath]
      );

      // ✅ GARANTIR TIPOS CORRETOS
      return {
        members: membersResult.rows.map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          total_points: parseFloat(member.total_points || 0),
          total_sales: parseInt(member.total_sales || 0),
          total_revenue: parseFloat(member.total_revenue || 0),
        })),
        totals: {
          total_members: parseInt(teamTotalsResult.rows[0]?.total_members || 0),
          total_sales: parseInt(teamTotalsResult.rows[0]?.total_sales || 0),
          total_revenue: parseFloat(teamTotalsResult.rows[0]?.total_revenue || 0),
          total_points: parseFloat(teamTotalsResult.rows[0]?.total_points || 0),
        },
      };
    } catch (error) {
      logger.error('Erro ao buscar dashboard da equipe:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Dashboard completo (admin)
  async getAdminDashboard() {
    const client = await pool.connect();

    try {
      // Estatísticas gerais
      const generalStats = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
          (SELECT COUNT(*) FROM sales WHERE status != 'cancelled') as total_sales,
          (SELECT COALESCE(SUM(value), 0) FROM sales WHERE status != 'cancelled') as total_revenue,
          (SELECT COALESCE(SUM(total_commission), 0) FROM commissions WHERE paid = true) as total_commissions_paid
      `);

      // Top 10 vendedores
      const topSellers = await client.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          COALESCE(MAX(p.accumulated_points), 0) as total_points,
          COALESCE(s.total_sales, 0) as total_sales,
          COALESCE(s.total_revenue, 0) as total_revenue
        FROM users u
        LEFT JOIN points p ON u.id = p.user_id
        LEFT JOIN (
          SELECT user_id, 
                 COUNT(*) as total_sales,
                 SUM(value) as total_revenue
          FROM sales
          WHERE status != 'cancelled'
          GROUP BY user_id
        ) s ON u.id = s.user_id
        WHERE u.is_active = true
        GROUP BY u.id, u.name, u.email, s.total_sales, s.total_revenue
        ORDER BY total_points DESC
        LIMIT 10
      `);

      // Vendas recentes
      const recentSales = await client.query(`
        SELECT 
          s.id,
          s.user_id,
          s.client_id,
          s.value,
          s.kilowatts,
          s.status,
          s.created_at,
          u.name as seller_name,
          c.name as client_name
        FROM sales s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN clients c ON s.client_id = c.id
        ORDER BY s.created_at DESC
        LIMIT 20
      `);

      // ✅ GARANTIR TIPOS CORRETOS
      return {
        stats: {
          total_users: parseInt(generalStats.rows[0]?.total_users || 0),
          total_sales: parseInt(generalStats.rows[0]?.total_sales || 0),
          total_revenue: parseFloat(generalStats.rows[0]?.total_revenue || 0),
          total_commissions_paid: parseFloat(generalStats.rows[0]?.total_commissions_paid || 0),
        },
        top_sellers: topSellers.rows.map((seller: any) => ({
          id: seller.id,
          name: seller.name,
          email: seller.email,
          total_points: parseFloat(seller.total_points || 0),
          total_sales: parseInt(seller.total_sales || 0),
          total_revenue: parseFloat(seller.total_revenue || 0),
        })),
        recent_sales: recentSales.rows.map((sale: any) => ({
          id: sale.id,
          user_id: sale.user_id,
          client_id: sale.client_id,
          value: parseFloat(sale.value || 0),
          kilowatts: parseFloat(sale.kilowatts || 0),
          status: sale.status,
          created_at: sale.created_at,
          seller_name: sale.seller_name,
          client_name: sale.client_name,
        })),
      };
    } catch (error) {
      logger.error('Erro ao buscar dashboard admin:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Método auxiliar para mapear fase -> role
  private getRoleFromPhase(phaseNumber: number): string {
    const roleMap: Record<number, string> = {
      1: 'consultant',
      2: 'master_consultant',
      3: 'director',
      4: 'regional_director',
      5: 'admin',
    };
    return roleMap[phaseNumber] || 'consultant';
  }
}

export const dashboardService = new DashboardService();
