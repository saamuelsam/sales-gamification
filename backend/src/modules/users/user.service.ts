// backend/src/modules/users/user.service.ts
import { pool } from '../../config/database';
import bcrypt from 'bcryptjs';

interface AddMemberInput {
  name: string;
  email: string;
  password: string;
  role?: 'consultant' | 'manager' | 'admin';
}

export class UserService {
  // ========== DASHBOARD - SEM client.connect() ==========
  async getDashboard(userId: string) {
    try {
      console.log('🔍 userId recebido:', userId);

      // ✅ USAR POOL DIRETO - SEM client.connect()
      const salesResult = await pool.query(
        `SELECT 
          COALESCE(COUNT(*), 0)::INT as total_sales,
          COALESCE(SUM(value), 0)::NUMERIC as total_revenue,
          COALESCE(SUM(kilowatts), 0)::NUMERIC as total_kilowatts
        FROM sales
        WHERE user_id = $1 AND status IN ('approved', 'negotiation')`,
        [userId]
      );

      console.log('📊 Sales Result:', salesResult.rows[0]);

      // ✅ PONTOS
      const pointsResult = await pool.query(
        `SELECT COALESCE(MAX(accumulated_points), 0)::NUMERIC as total_points
         FROM points WHERE user_id = $1`,
        [userId]
      );

      const totalPoints = parseFloat(pointsResult.rows[0]?.total_points || '0');
      console.log('⭐ Points:', totalPoints);

      // ✅ NÍVEL
      const levelResult = await pool.query(
        `SELECT name FROM levels WHERE points_required <= $1 
         ORDER BY points_required DESC LIMIT 1`,
        [totalPoints]
      );

      // ✅ EQUIPE
      const teamResult = await pool.query(
        `SELECT COUNT(*)::INT as team_members FROM users 
         WHERE parent_id = $1 AND is_active = true`,
        [userId]
      );

      // ✅ GRÁFICOS - Vendas por Status
      const statusResult = await pool.query(
        `SELECT status, COUNT(*) as count
         FROM sales
         WHERE user_id = $1 AND status IN ('approved', 'negotiation')
         GROUP BY status`,
        [userId]
      );

      // ✅ GRÁFICOS - Vendas Mensais
      const monthlyResult = await pool.query(
        `SELECT 
          TO_CHAR(created_at, 'Mon') as month,
          COUNT(*) as count
         FROM sales
         WHERE user_id = $1 AND status IN ('approved', 'negotiation')
         GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
         ORDER BY EXTRACT(MONTH FROM created_at)`,
        [userId]
      );

      return {
        total_sales: parseInt(salesResult.rows[0]?.total_sales || '0'),
        total_revenue: parseFloat(salesResult.rows[0]?.total_revenue || '0'),
        total_kilowatts: parseFloat(salesResult.rows[0]?.total_kilowatts || '0'),
        total_points: totalPoints,
        level: levelResult.rows[0]?.name || 'Consultor Elite',
        team_members: parseInt(teamResult.rows[0]?.team_members || '0'),
        charts: {
          byStatus: statusResult.rows.map((row: any) => ({
            name: row.status,
            count: parseInt(row.count),
          })),
          monthly: monthlyResult.rows.map((row: any) => ({
            month: row.month,
            count: parseInt(row.count),
          })),
        },
      };
    } catch (error) {
      console.error('❌ Erro no getDashboard:', error);
      
      // ✅ RETORNAR DADOS ZERADOS EM CASO DE ERRO
      return {
        total_sales: 0,
        total_revenue: 0,
        total_kilowatts: 0,
        total_points: 0,
        level: 'Consultor Elite',
        team_members: 0,
        charts: {
          byStatus: [],
          monthly: [],
        },
      };
    }
  }

  // ========== MÉTODOS DE EQUIPE ==========
  async addTeamMember(parentId: string, memberData: AddMemberInput) {
    const { name, email, password, role = 'consultant' } = memberData;

    if (!parentId) throw new Error('Líder não informado');
    if (!name || !email || !password) throw new Error('Nome, email e senha são obrigatórios');
    if (password.length < 8) throw new Error('Senha deve ter no mínimo 8 caracteres');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar se parent existe
    const parentExists = await pool.query('SELECT id, path FROM users WHERE id = $1', [parentId]);
    if (parentExists.rows.length === 0) {
      throw new Error('Líder não encontrado');
    }

    // Checar se e-mail já existe
    const emailExists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (emailExists.rows.length > 0) {
      throw new Error('Email já está em uso');
    }

    // Inserir novo membro
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, parent_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, parent_id`,
      [name, email, hashedPassword, role, parentId]
    );

    return result.rows[0];
  }

  async getDirectTeamMembers(userId: string) {
    const result = await pool.query(
      `SELECT
        u.id, u.name, u.email, u.role, u.created_at,
        COALESCE(MAX(p.accumulated_points), 0) as total_points,
        COUNT(DISTINCT s.id) as total_sales,
        COALESCE(SUM(s.value), 0) as total_revenue
      FROM users u
      LEFT JOIN points p ON p.user_id = u.id
      LEFT JOIN sales s ON s.user_id = u.id AND s.status = 'approved'
      WHERE u.parent_id = $1 AND u.is_active = true
      GROUP BY u.id, u.name, u.email, u.role, u.created_at
      ORDER BY total_points DESC`,
      [userId]
    );

    return result.rows;
  }

  async hasTeam(userId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT COUNT(*)::int as count FROM users WHERE parent_id = $1 AND is_active = true',
      [userId]
    );

    return result.rows[0].count > 0;
  }

  async getFullNetwork(userId: string) {
    const result = await pool.query(
      `SELECT
        u.id, u.name, u.email, u.role, u.parent_id,
        COALESCE(MAX(p.accumulated_points), 0) as total_points
      FROM users u
      LEFT JOIN points p ON p.user_id = u.id
      WHERE u.parent_id = $1 OR u.id = $1
      GROUP BY u.id, u.name, u.email, u.role, u.parent_id
      ORDER BY u.name`,
      [userId]
    );

    return result.rows;
  }

  async getTeamStats(userId: string) {
    const directMembers = await pool.query(
      'SELECT COUNT(*)::int as count FROM users WHERE parent_id = $1 AND is_active = true',
      [userId]
    );

    const teamSales = await pool.query(
      `SELECT
        COUNT(DISTINCT s.id)::int as total_sales,
        COALESCE(SUM(s.value), 0) as total_revenue,
        COALESCE(SUM(s.kilowatts), 0) as total_kw
      FROM sales s
      INNER JOIN users u ON u.id = s.user_id
      WHERE u.parent_id = $1 AND s.status != 'cancelled'`,
      [userId]
    );

    const teamPoints = await pool.query(
      `SELECT COALESCE(SUM(p.accumulated_points), 0) as total_team_points
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

  async list() {
    return [];
  }

  async findById(id: string) {
    return { id };
  }

  async update(id: string, data: any) {
    return { id, ...data };
  }

  async remove(id: string) {
    return true;
  }
}

export const userService = new UserService();
