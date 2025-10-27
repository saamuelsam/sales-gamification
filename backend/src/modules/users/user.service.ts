// backend/src/modules/users/user.service.ts

import { pool } from '@config/database';

export class UserService {
  // Adicionar membro à equipe (qualquer consultor pode fazer)
  async addTeamMember(parentId: string, memberData: any) {
    const { name, email, password, role = 'consultant' } = memberData;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar se parent existe
    const parentExists = await pool.query(
      'SELECT id, path FROM users WHERE id = $1',
      [parentId]
    );

    if (parentExists.rows.length === 0) {
      throw new Error('Líder não encontrado');
    }

    // Inserir novo membro com parent_id definido
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, parent_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, parent_id`,
      [name, email, hashedPassword, role, parentId]
    );

    return result.rows[0];
  }

  // Buscar membros diretos da equipe (1ª linha)
  async getDirectTeamMembers(userId: string) {
    const result = await pool.query(
      `SELECT 
         u.id, u.name, u.email, u.role, u.created_at,
         COALESCE(MAX(p.accumulated_points), 0) as total_points,
         COUNT(DISTINCT s.id) as total_sales,
         COALESCE(SUM(s.value), 0) as total_revenue
       FROM users u
       LEFT JOIN points p ON p.user_id = u.id
       LEFT JOIN sales s ON s.user_id = u.id AND s.status = 'closed'
       WHERE u.parent_id = $1 AND u.is_active = true
       GROUP BY u.id, u.name, u.email, u.role, u.created_at
       ORDER BY total_points DESC`,
      [userId]
    );

    return result.rows;
  }

  // Verificar se usuário tem equipe
  async hasTeam(userId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE parent_id = $1 AND is_active = true',
      [userId]
    );
    return result.rows[0].count > 0;
  }

  // Buscar toda a rede (incluindo sub-níveis) usando path
  async getFullNetwork(userId: string) {
    const result = await pool.query(
      `SELECT 
         u.id, u.name, u.email, u.role, u.parent_id,
         nlevel(u.path) as level,
         COALESCE(MAX(p.accumulated_points), 0) as total_points
       FROM users u
       LEFT JOIN points p ON p.user_id = u.id
       WHERE u.path <@ (SELECT path FROM users WHERE id = $1)
       AND u.id != $1
       GROUP BY u.id, u.name, u.email, u.role, u.parent_id, u.path
       ORDER BY u.path`,
      [userId]
    );

    return result.rows;
  }

  // Estatísticas da equipe
  async getTeamStats(userId: string) {
    const directMembers = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE parent_id = $1 AND is_active = true',
      [userId]
    );

    const teamSales = await pool.query(
      `SELECT 
         COUNT(DISTINCT s.id) as total_sales,
         COALESCE(SUM(s.value), 0) as total_revenue,
         COALESCE(SUM(s.kilowatts), 0) as total_kw
       FROM sales s
       INNER JOIN users u ON u.id = s.user_id
       WHERE u.parent_id = $1 AND s.status = 'closed'`,
      [userId]
    );

    const teamPoints = await pool.query(
      `SELECT COALESCE(SUM(p.points), 0) as total_team_points
       FROM points p
       INNER JOIN users u ON u.id = p.user_id
       WHERE u.parent_id = $1`,
      [userId]
    );

    return {
      direct_members: directMembers.rows[0].count,
      team_sales: teamSales.rows[0],
      team_points: teamPoints.rows[0].total_team_points,
    };
  }
}
