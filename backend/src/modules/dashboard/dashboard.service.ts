import { pool } from '../../config/database';

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

    const totalPoints = parseFloat(pointsResult.rows[0].total_points);

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

    const currentLevel = levelResult.rows[0];

    // Atualizar role do usuário se necessário
    if (currentLevel) {
      const newRole = this.getRoleFromPhase(currentLevel.phase_number);
      await client.query(
        'UPDATE users SET role = $1 WHERE id = $2 AND role != $1',
        [newRole, userId]
      );
    }

    return {
      sales: salesResult.rows[0],
      points: pointsResult.rows[0],
      commissions: commissionsResult.rows[0],
      level: currentLevel,
    };
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
    5: 'admin'
  };
  return roleMap[phaseNumber] || 'consultant';
}

  // Dashboard da equipe (hierárquico)
  async getTeamDashboard(userId: string) {
    // Buscar path do usuário
    const userResult = await pool.query(
      'SELECT path FROM users WHERE id = $1',
      [userId]
    );

    if (!userResult.rows[0]) {
      throw new Error('Usuário não encontrado');
    }

    const userPath = userResult.rows[0].path;

    // Membros diretos da equipe (1 nível abaixo)
    const membersResult = await pool.query(
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
    const teamTotalsResult = await pool.query(
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

    return {
      members: membersResult.rows,
      totals: teamTotalsResult.rows[0],
    };
  }

  // Dashboard completo (admin)
  async getAdminDashboard() {
    // Estatísticas gerais
    const generalStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
        (SELECT COUNT(*) FROM sales WHERE status != 'cancelled') as total_sales,
        (SELECT COALESCE(SUM(value), 0) FROM sales WHERE status != 'cancelled') as total_revenue,
        (SELECT COALESCE(SUM(total_commission), 0) FROM commissions) as total_commissions_paid
    `);

    // Top 10 vendedores
    const topSellers = await pool.query(`
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
    const recentSales = await pool.query(`
      SELECT 
        s.*,
        u.name as seller_name
      FROM sales s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 20
    `);

    return {
      stats: generalStats.rows[0],
      top_sellers: topSellers.rows,
      recent_sales: recentSales.rows,
    };
  }
}
