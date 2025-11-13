// backend/src/modules/users/user.service.ts
import { pool } from '../../config/database';
import bcrypt from 'bcryptjs';
import { dashboardService } from '../dashboard/dashboard.service';

interface AddMemberInput {
  name?: string;
  email: string;
  password?: string;
  role?: 'consultant' | 'manager' | 'admin';
}

export class UserService {
  // ========== DASHBOARD - CORRIGIDO COM CAST UUID E LOGS ==========
  async getDashboard(userId: string) {
    try {
      console.log('🔍 [getDashboard] userId:', userId, '| Timestamp:', Date.now());

      // 🔹 Busca vendas do usuário + data da última venda (CAST corrigido!)
      const salesResult = await pool.query(
        `SELECT 
          COALESCE(COUNT(*), 0)::INT AS total_sales,
          COALESCE(SUM(value), 0)::NUMERIC AS total_revenue,
          COALESCE(SUM(kilowatts), 0)::NUMERIC AS total_kilowatts,
          MAX(created_at) AS last_sale_date
        FROM sales
        WHERE user_id = $1::uuid
          AND status NOT IN ('cancelled', 'rejected', 'financing_denied')`,
        [userId]
      );

      const salesData = salesResult.rows[0];
      console.log('📊 Sales Data:', salesData);

      // 🔹 Calcular meses sem contratos
      let meses_sem_contratos = 0;
      if (salesData.last_sale_date) {
        const lastSaleDate = new Date(salesData.last_sale_date);
        const now = new Date();
        const diffMs = now.getTime() - lastSaleDate.getTime();
        meses_sem_contratos = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30)); // ~30 dias/mês
      }

      // 🔹 Busca pontos e cargo do usuário
      const userResult = await pool.query(
        `SELECT COALESCE(points, 0)::NUMERIC AS total_points, role
         FROM users 
         WHERE id = $1::uuid`,
        [userId]
      );

      const totalPointsRaw = parseFloat(userResult.rows[0]?.total_points || '0');
      const currentRole = userResult.rows[0]?.role || 'consultant';

      // 🔧 Corrige escala (kW → pontos)
      const totalPoints =
        totalPointsRaw < 10 ? Math.round(totalPointsRaw * 1000) : Math.round(totalPointsRaw);

      console.log('⭐ Points:', totalPoints, '| Role:', currentRole);

      // ⚙️ Calcula o nível baseado nos pontos
      const levelInfo = dashboardService['calculateLevelFromPoints'](totalPoints);

      // 💬 Mapeia nomes legíveis
      const levelDisplayMap: Record<string, string> = {
        elite: 'Consultor Elite',
        master: 'Master',
        seniorConsultant: 'Consultor Sênior',
        consultorPrime: 'Consultor Prime',
        executive: 'Executivo',
      };

      const displayLevel = levelDisplayMap[levelInfo.phaseName] || 'Nível Desconhecido';

      // 📈 Faixas de pontuação
      const levelThresholds = {
        elite: { min: 0, next: 1000 },
        master: { min: 1000, next: 10000 },
        seniorConsultant: { min: 10000, next: 800000 },
        consultorPrime: { min: 800000, next: 2000000 },
        executive: { min: 2000000, next: null },
      };

      const key = levelInfo.phaseName as keyof typeof levelThresholds;
      const { min, next } = levelThresholds[key] || { min: 0, next: null };

      // 🔢 Calcula progresso
      let progress = 0;
      if (next) {
        progress = ((totalPoints - min) / (next - min)) * 100;
        progress = Math.min(Math.max(progress, 0), 100);
      }

      // 📊 Equipe
      const teamResult = await pool.query(
        `SELECT COUNT(*)::INT AS team_members 
         FROM users 
         WHERE parent_id = $1::uuid 
           AND is_active = true`,
        [userId]
      );

      // 🔹 Status das vendas
      const statusResult = await pool.query(
        `SELECT status, COUNT(*)::INT AS count
         FROM sales
         WHERE user_id = $1::uuid
           AND status NOT IN ('cancelled', 'rejected')
         GROUP BY status`,
        [userId]
      );

      // 🔹 Gráfico mensal
      const monthlyResult = await pool.query(
        `SELECT 
          TO_CHAR(created_at, 'Mon') AS month,
          COUNT(*)::INT AS count,
          COALESCE(SUM(value), 0)::NUMERIC AS total
         FROM sales
         WHERE user_id = $1::uuid
           AND created_at >= NOW() - INTERVAL '6 months'
           AND status NOT IN ('cancelled', 'rejected')
         GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
         ORDER BY EXTRACT(MONTH FROM created_at)`,
        [userId]
      );

      // ✅ Monta o dashboard final
      const dashboardData = {
        total_sales: parseInt(salesData?.total_sales || '0'),
        total_revenue: parseFloat(salesData?.total_revenue || '0'),
        total_kilowatts: parseFloat(salesData?.total_kilowatts || '0'),
        total_points: totalPoints,
        level: displayLevel,
        progress: parseFloat(progress.toFixed(1)),
        next_level_points: next,
        last_sale_date: salesData?.last_sale_date || null,
        meses_sem_contratos,
        team_members: parseInt(teamResult.rows[0]?.team_members || '0'),
        charts: {
          byStatus: statusResult.rows.map((row: any) => ({
            name: row.status,
            count: parseInt(row.count),
          })),
          monthly: monthlyResult.rows.map((row: any) => ({
            month: row.month,
            count: parseInt(row.count),
            total: parseFloat(row.total),
          })),
        },
      };

      console.log('✅ Dashboard retornado:', dashboardData);
      return dashboardData;
    } catch (error: any) {
      console.error('❌ Erro no getDashboard:', error.message, error.stack);
      return {
        total_sales: 0,
        total_revenue: 0,
        total_kilowatts: 0,
        total_points: 0,
        level: 'Consultor Elite',
        progress: 0,
        next_level_points: 1000,
        last_sale_date: null,
        meses_sem_contratos: 0,
        team_members: 0,
        charts: {
          byStatus: [],
          monthly: [],
        },
      };
    }
  }

  // ========== MÉTODOS DE EQUIPE ==========

  /**
   * 🔥 Buscar perfil completo do usuário
   */
  async getProfile(userId: string) {
    const result = await pool.query(
      `SELECT 
        id, name, email, role, points, is_active, created_at,
        cpf, phone, birth_date, avatar_url,
        address_street, address_number, address_complement, 
        address_neighborhood, address_city, address_state, address_zip,
        pix_key, pix_type, bank_name, bank_code, bank_agency, 
        bank_account, bank_account_type
      FROM users 
      WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    const user = result.rows[0];
    
    // Remove senha do retorno
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      points: parseFloat(user.points || '0'),
      is_active: user.is_active,
      created_at: user.created_at,
      personal_data: {
        cpf: user.cpf,
        phone: user.phone,
        birth_date: user.birth_date,
        avatar_url: user.avatar_url
      },
      address: {
        street: user.address_street,
        number: user.address_number,
        complement: user.address_complement,
        neighborhood: user.address_neighborhood,
        city: user.address_city,
        state: user.address_state,
        zip: user.address_zip
      },
      banking: {
        pix_key: user.pix_key,
        pix_type: user.pix_type,
        bank_name: user.bank_name,
        bank_code: user.bank_code,
        bank_agency: user.bank_agency,
        bank_account: user.bank_account,
        bank_account_type: user.bank_account_type
      }
    };
  }

  /**
   * 🔥 Atualizar perfil do usuário
   */
  async updateProfile(userId: string, data: any) {
    const {
      name,
      cpf,
      phone,
      birth_date,
      avatar_url,
      address_street,
      address_number,
      address_complement,
      address_neighborhood,
      address_city,
      address_state,
      address_zip,
      pix_key,
      pix_type,
      bank_name,
      bank_code,
      bank_agency,
      bank_account,
      bank_account_type
    } = data;

    // Validação de CPF único
    if (cpf) {
      const existingCpf = await pool.query(
        'SELECT id FROM users WHERE cpf = $1 AND id != $2',
        [cpf, userId]
      );
      if (existingCpf.rows.length > 0) {
        throw new Error('CPF já cadastrado para outro usuário');
      }
    }

    const result = await pool.query(
      `UPDATE users 
       SET 
         name = COALESCE($1, name),
         cpf = COALESCE($2, cpf),
         phone = COALESCE($3, phone),
         birth_date = COALESCE($4, birth_date),
         avatar_url = COALESCE($5, avatar_url),
         address_street = COALESCE($6, address_street),
         address_number = COALESCE($7, address_number),
         address_complement = COALESCE($8, address_complement),
         address_neighborhood = COALESCE($9, address_neighborhood),
         address_city = COALESCE($10, address_city),
         address_state = COALESCE($11, address_state),
         address_zip = COALESCE($12, address_zip),
         pix_key = COALESCE($13, pix_key),
         pix_type = COALESCE($14, pix_type),
         bank_name = COALESCE($15, bank_name),
         bank_code = COALESCE($16, bank_code),
         bank_agency = COALESCE($17, bank_agency),
         bank_account = COALESCE($18, bank_account),
         bank_account_type = COALESCE($19, bank_account_type),
         updated_at = NOW()
       WHERE id = $20
       RETURNING *`,
      [
        name, cpf, phone, birth_date, avatar_url,
        address_street, address_number, address_complement,
        address_neighborhood, address_city, address_state, address_zip,
        pix_key, pix_type, bank_name, bank_code,
        bank_agency, bank_account, bank_account_type,
        userId
      ]
    );

    return this.getProfile(userId);
  }

  // ========== MÉTODOS DE EQUIPE ==========

  /**
   * 🔥 NOVO MÉTODO: Vincula um consultor existente a um líder
   * Retorna objeto padronizado { success, message, data, statusCode }
   */
  async addTeamMember(parentId: string, memberData: AddMemberInput) {
  try {
    const { email, name } = memberData;

    if (!parentId) {
      return { success: false, message: 'Líder não informado', statusCode: 401 };
    }

    if (!email || !email.trim()) {
      return { success: false, message: 'Email é obrigatório', statusCode: 400 };
    }

    // 🔹 Verifica se o líder existe
    const parentExists = await pool.query('SELECT id FROM users WHERE id = $1', [parentId]);
    if (parentExists.rows.length === 0) {
      return { success: false, message: 'Líder não encontrado', statusCode: 404 };
    }

    // 🔹 Busca o membro pelo e-mail
    const userResult = await pool.query(
      'SELECT id, name, parent_id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return {
        success: false,
        message: 'Usuário não encontrado na base de dados',
        statusCode: 404,
      };
    }

    const user = userResult.rows[0];

    // 🔹 Verifica se já está em uma equipe
    if (user.parent_id) {
      return {
        success: false,
        message: 'Consultor já está em uma equipe',
        statusCode: 400,
      };
    }

    // 🔹 Atualiza o parent_id do membro
    await pool.query(
      `UPDATE users 
       SET parent_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [parentId, user.id]
    );

    // 🔹 Cria ou mantém o vínculo hierárquico
    await pool.query(
      `INSERT INTO user_hierarchy (leader_id, subordinate_id, line_level)
       VALUES ($1, $2, 1)
       ON CONFLICT (leader_id, subordinate_id) DO NOTHING`,
      [parentId, user.id]
    );

    // 🔹 Retorna o membro atualizado
    const updated = await pool.query(
      `SELECT id, name, email, role, parent_id, created_at 
       FROM users 
       WHERE id = $1`,
      [user.id]
    );

    return {
      success: true,
      message: `${name || updated.rows[0].name} adicionado à equipe com sucesso!`,
      data: updated.rows[0],
    };
  } catch (error: any) {
    console.error('❌ Erro no addTeamMember:', error);
    return {
      success: false,
      message: 'Erro interno ao adicionar membro à equipe',
      statusCode: 500,
      errors: error.message,
    };
  }
}
  async getDirectTeamMembers(userId: string) {
    const result = await pool.query(
      `SELECT
        u.id, u.name, u.email, u.role, u.created_at,
        COALESCE(u.points, 0) as total_points,
        COUNT(DISTINCT s.id)::INT as total_sales,
        COALESCE(SUM(s.value), 0)::NUMERIC as total_revenue
      FROM users u
      LEFT JOIN sales s ON s.user_id = u.id AND s.status NOT IN ('cancelled', 'rejected')
      WHERE u.parent_id = $1 AND u.is_active = true
      GROUP BY u.id, u.name, u.email, u.role, u.created_at, u.points
      ORDER BY u.points DESC`,
      [userId]
    );

    return result.rows;
  }

  async hasTeam(userId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT COUNT(*)::INT as count FROM users WHERE parent_id = $1 AND is_active = true',
      [userId]
    );
    return result.rows[0].count > 0;
  }

  async getFullNetwork(userId: string) {
    const result = await pool.query(
      `SELECT
        u.id, u.name, u.email, u.role, u.parent_id,
        COALESCE(u.points, 0) as total_points
      FROM users u
      WHERE u.parent_id = $1 OR u.id = $1
      ORDER BY u.name`,
      [userId]
    );

    return result.rows;
  }

  async getTeamStats(userId: string) {
    const directMembers = await pool.query(
      'SELECT COUNT(*)::INT as count FROM users WHERE parent_id = $1 AND is_active = true',
      [userId]
    );

    const teamSales = await pool.query(
      `SELECT
        COUNT(DISTINCT s.id)::INT as total_sales,
        COALESCE(SUM(s.value), 0)::NUMERIC as total_revenue,
        COALESCE(SUM(s.kilowatts), 0)::NUMERIC as total_kw
      FROM sales s
      INNER JOIN users u ON u.id = s.user_id
      WHERE u.parent_id = $1 AND s.status NOT IN ('cancelled', 'rejected')`,
      [userId]
    );

    const teamPoints = await pool.query(
      `SELECT COALESCE(SUM(u.points), 0)::NUMERIC as total_team_points
       FROM users u
       WHERE u.parent_id = $1`,
      [userId]
    );

    return {
      direct_members: directMembers.rows[0].count,
      team_sales: teamSales.rows[0],
      team_points: parseFloat(teamPoints.rows[0].total_team_points || '0'),
    };
  }

  async list() {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at, is_active 
       FROM users 
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async findById(id: string) {
    const result = await pool.query(
      `SELECT id, name, email, role, points, parent_id, is_active, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async update(id: string, data: any) {
    const { name, email, role } = data;
    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email), 
           role = COALESCE($3, role),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name, email, role, id]
    );
    return result.rows[0];
  }

  /**
   * 🔥 Remove membro da equipe
   * - Verifica se o membro pertence ao líder
   * - Remove da hierarquia e zera o parent_id
   */
  async removeTeamMember(leaderId: string, memberId: string) {
    try {
      // 🔹 Verifica se o membro pertence à equipe do líder
      const check = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND parent_id = $2`,
        [memberId, leaderId]
      );

      if (check.rows.length === 0) {
        // Verifica se há vínculo na tabela hierárquica
        const hierarchyCheck = await pool.query(
          `SELECT id FROM user_hierarchy WHERE subordinate_id = $1 AND leader_id = $2`,
          [memberId, leaderId]
        );

        if (hierarchyCheck.rows.length === 0) {
          return {
            success: false,
            message: 'Membro não encontrado na sua equipe',
            statusCode: 404,
          };
        }
      }

      // 🔹 Remove o vínculo na hierarquia
      await pool.query(
        `DELETE FROM user_hierarchy WHERE subordinate_id = $1 AND leader_id = $2`,
        [memberId, leaderId]
      );

      // 🔹 Remove o vínculo direto
      await pool.query(
        `UPDATE users SET parent_id = NULL, updated_at = NOW() WHERE id = $1`,
        [memberId]
      );

      return {
        success: true,
        message: 'Membro removido da equipe com sucesso',
      };
    } catch (error: any) {
      console.error('❌ Erro ao remover membro:', error);
      return {
        success: false,
        message: 'Erro interno ao remover membro da equipe',
        statusCode: 500,
      };
    }
  }

  async remove(id: string) {
    await pool.query(
      `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [id]
    );
    return true;
  }
}

export const userService = new UserService();
