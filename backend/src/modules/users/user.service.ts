// backend/src/modules/users/user.service.ts
import { logger } from '@utils/logger';
import { pool } from '@config/database';
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

      // 🔹 Busca pontos pessoais, de equipe e cargo do usuário
      const userResult = await pool.query(
        `SELECT 
           COALESCE(personal_points, 0)::NUMERIC AS personal_points,
           COALESCE(team_points, 0)::NUMERIC AS team_points,
           COALESCE(points, 0)::NUMERIC AS total_points,
           role
         FROM users 
         WHERE id = $1::uuid`,
        [userId]
      );

      const personalPoints = parseFloat(userResult.rows[0]?.personal_points || '0');
      const teamPoints = parseFloat(userResult.rows[0]?.team_points || '0');
      const totalPoints = parseFloat(userResult.rows[0]?.total_points || '0');
      const currentRole = userResult.rows[0]?.role || 'consultant';

      console.log('⭐ Personal Points:', personalPoints, '| Team Points:', teamPoints, '| Total:', totalPoints, '| Role:', currentRole);

      // 🔥 CORREÇÃO: Para roles administrativos, calcular progresso como consultant
      const protectedRoles = ['ceo', 'admin', 'financeiro'];
      const roleForProgress = protectedRoles.includes(currentRole.toLowerCase()) ? 'consultant' : currentRole;

      // ⚙️ Buscar nível atual baseado em pontos (não em role para admins)
      let currentLevelResult;
      if (protectedRoles.includes(currentRole.toLowerCase())) {
        // Para admins: buscar nível baseado nos pontos totais
        currentLevelResult = await pool.query(
          `SELECT * FROM levels 
           WHERE points_required <= $1 
             AND role NOT IN ('ceo', 'admin', 'financeiro', 'diretor_comercial')
           ORDER BY points_required DESC 
           LIMIT 1`,
          [totalPoints]
        );
      } else {
        // Para consultores normais: buscar por role
        currentLevelResult = await pool.query(
          `SELECT * FROM levels WHERE role = $1`,
          [currentRole]
        );
      }
      
      const currentLevel = currentLevelResult.rows[0];
      if (!currentLevel) {
        throw new Error(`Nível não encontrado para role: ${currentRole}`);
      }

      // Exibir role real do usuário (CEO, Admin) mas calcular progresso correto
      const displayLevel = protectedRoles.includes(currentRole.toLowerCase()) 
        ? `${currentRole.toUpperCase()} (${currentLevel.name})`
        : currentLevel.name;

      // 📈 Buscar próximo nível
      const nextLevelResult = await pool.query(
        `SELECT * FROM levels 
         WHERE phase_number > $1 
         AND role NOT IN ('ceo', 'admin', 'financeiro', 'diretor_comercial')
         ORDER BY phase_number ASC 
         LIMIT 1`,
        [currentLevel.phase_number]
      );
      const nextLevel = nextLevelResult.rows[0];

      // 🔢 Calcula progresso
      let progress = 0;
      const currentRequired = parseFloat(currentLevel.points_required || 0);
      
      if (nextLevel) {
        const nextRequired = parseFloat(nextLevel.points_required || 0);
        const delta = nextRequired - currentRequired;
        const gained = totalPoints - currentRequired;
        
        if (delta > 0) {
          progress = ((gained / delta) * 100);
          progress = Math.min(Math.max(progress, 0), 100);
        }
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

      // 💰 Buscar comissões do usuário
      const commissionsResult = await pool.query(
        `SELECT 
          COALESCE(SUM(total_commission), 0)::NUMERIC as total_personal_commissions,
          COUNT(*)::INT as total_commission_count
         FROM commissions
         WHERE user_id = $1::uuid`,
        [userId]
      );

      // 🔗 Buscar comissões de rede (para Diretor Comercial e líderes)
      const networkCommissionsResult = await pool.query(
        `SELECT 
          COALESCE(SUM(commission_amount), 0)::NUMERIC as total_network_commissions,
          COUNT(*)::INT as network_commission_count
         FROM network_commissions
         WHERE leader_id = $1::uuid`,
        [userId]
      );

      const totalPersonalCommissions = parseFloat(commissionsResult.rows[0]?.total_personal_commissions || '0');
      const totalNetworkCommissions = parseFloat(networkCommissionsResult.rows[0]?.total_network_commissions || '0');
      const totalCommissions = totalPersonalCommissions + totalNetworkCommissions;

      console.log('💰 Comissões:', {
        personal: totalPersonalCommissions,
        network: totalNetworkCommissions,
        total: totalCommissions
      });

      // 🔥 VERIFICAR SE PODE SUBIR DE NÍVEL (contratos mínimos)
      const settingsService = require('../settings/settings.service').default;
      const contractsEnabled = await settingsService.isContractsPerMonthEnabled();
      
      let canLevelUp = true;
      let levelUpBlockReason = null;
      let requiredContracts = 0;
      let currentMonthContracts = 0;

      if (contractsEnabled && nextLevel && !protectedRoles.includes(currentRole.toLowerCase())) {
        const nextRole = nextLevel.role;
        const minContractsMap: Record<string, number> = {
          'master_consultant': 2,
          'senior_consultant': 4,
          'prime_consultant': 5,
          'executive': 10
        };
        
        requiredContracts = minContractsMap[nextRole] || 0;
        
        if (requiredContracts > 0 && totalPoints >= parseFloat(nextLevel.points_required)) {
          // Usuário tem pontos suficientes, verificar contratos
          const firstDayOfMonth = new Date();
          firstDayOfMonth.setDate(1);
          firstDayOfMonth.setHours(0, 0, 0, 0);
          
          const monthlyContractsResult = await pool.query(
            `SELECT COUNT(*)::int as total_contracts
             FROM sales
             WHERE user_id = $1::uuid
               AND created_at >= $2
               AND status IN ('approved', 'delivered')`,
            [userId, firstDayOfMonth]
          );
          
          currentMonthContracts = monthlyContractsResult.rows[0]?.total_contracts || 0;
          
          if (currentMonthContracts < requiredContracts) {
            canLevelUp = false;
            levelUpBlockReason = 'min_contracts_not_met';
            console.log(`⚠️ Usuário tem ${totalPoints} pontos mas faltam ${requiredContracts - currentMonthContracts} contratos para ${nextLevel.name}`);
          }
        }
      }

      // ✅ Monta o dashboard final
      const dashboardData = {
        total_sales: parseInt(salesData?.total_sales || '0'),
        total_revenue: parseFloat(salesData?.total_revenue || '0'),
        total_kilowatts: parseFloat(salesData?.total_kilowatts || '0'),
        // 🎯 Pontos separados
        personal_points: personalPoints,
        team_points: teamPoints,
        total_points: totalPoints,
        level: displayLevel,
        progress: parseFloat(progress.toFixed(1)),
        // 🔥 CORREÇÃO: Pontos faltantes = meta - pontos atuais
        next_level_points: nextLevel ? Math.max(0, parseFloat(nextLevel.points_required) - totalPoints) : 0,
        next_level_total: nextLevel ? parseFloat(nextLevel.points_required) : currentRequired,
        next_level_name: nextLevel ? nextLevel.name : currentLevel.name,
        current_level_points: currentRequired,
        // 🔥 Informações sobre bloqueio de nível
        can_level_up: canLevelUp,
        level_up_block_reason: levelUpBlockReason,
        required_contracts: requiredContracts,
        current_month_contracts: currentMonthContracts,
        contracts_missing: requiredContracts > 0 ? Math.max(0, requiredContracts - currentMonthContracts) : 0,
        last_sale_date: salesData?.last_sale_date || null,
        meses_sem_contratos,
        team_members: parseInt(teamResult.rows[0]?.team_members || '0'),
        // 💰 Adicionar comissões ao dashboard
        total_commissions: totalCommissions,
        personal_commissions: totalPersonalCommissions,
        network_commissions: totalNetworkCommissions,
        commission_count: parseInt(commissionsResult.rows[0]?.total_commission_count || '0'),
        network_commission_count: parseInt(networkCommissionsResult.rows[0]?.network_commission_count || '0'),
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
   * 🎯 Buscar histórico detalhado de pontos
   */
  async getPointsHistory(userId: string, limit: number = 50) {
    const result = await pool.query(
      `SELECT 
        p.id,
        p.points,
        p.sale_id,
        p.source_info,
        p.description,
        p.created_at,
        CASE 
          WHEN p.source_info->>'type' = 'team' THEN 'Venda da Equipe'
          WHEN p.source_info->>'type' = 'personal' THEN 'Venda Pessoal'
          WHEN p.description ILIKE '%bônus%' THEN 'Bônus'
          WHEN p.description ILIKE '%ajuste%' THEN 'Ajuste'
          WHEN p.sale_id IS NOT NULL THEN 'Venda'
          ELSE 'Outros'
        END as source_label
      FROM points p
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      points: parseFloat(row.points),
      source_type: row.sale_id ? 'sale' : 'other',
      source_label: row.source_label,
      details: row.source_info || {},
      description: row.description,
      created_at: row.created_at
    }));
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

  /**
   * 🔥 Atualizar apenas o avatar do usuário
   */
  async updateAvatar(userId: string, avatarUrl: string) {
    // Buscar avatar antigo para deletar
    const oldProfile = await pool.query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [userId]
    );

    // Deletar arquivo antigo se existir
    if (oldProfile.rows[0]?.avatar_url) {
      const { deleteOldAvatar } = require('../../config/multer');
      deleteOldAvatar(oldProfile.rows[0].avatar_url);
    }

    // Atualizar com novo avatar
    await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
      [avatarUrl, userId]
    );

    return this.getProfile(userId);
  }

  /**
   * 🔥 Remover avatar do usuário
   */
  async deleteAvatar(userId: string) {
    // Buscar avatar atual para deletar arquivo
    const profile = await pool.query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [userId]
    );

    if (profile.rows[0]?.avatar_url) {
      const { deleteOldAvatar } = require('../../config/multer');
      deleteOldAvatar(profile.rows[0].avatar_url);
    }

    // Remover do banco
    await pool.query(
      'UPDATE users SET avatar_url = NULL, updated_at = NOW() WHERE id = $1',
      [userId]
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
        COALESCE(u.personal_points, 0) as personal_points,
        COALESCE(u.team_points, 0) as team_points,
        COUNT(DISTINCT s.id)::INT as sales_count,
        COALESCE(SUM(s.value), 0)::NUMERIC as total_revenue,
        COALESCE(SUM(s.kilowatts), 0)::NUMERIC as total_kilowatts,
        -- Comissões pessoais do membro
        COALESCE(SUM(pc.commission_amount), 0)::NUMERIC as personal_commissions,
        -- Comissões de rede que este membro gera para o líder
        COALESCE(SUM(nc.commission_amount), 0)::NUMERIC as network_commissions
      FROM users u
      LEFT JOIN sales s ON s.user_id = u.id AND s.status IN ('approved', 'delivered')
      LEFT JOIN personal_commissions pc ON pc.user_id = u.id AND pc.sale_id = s.id
      LEFT JOIN network_commissions nc ON nc.team_member_id = u.id AND nc.leader_id = $1 AND nc.sale_id = s.id
      WHERE u.parent_id = $1 AND u.is_active = true
      GROUP BY u.id, u.name, u.email, u.role, u.created_at, u.points, u.personal_points, u.team_points
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
      WHERE u.parent_id = $1 AND s.status IN ('approved', 'delivered')`,
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

  async getUserLevelProgress(userId: string) {
    try {
      // Buscar pontos do usuário e nível atual
      const userResult = await pool.query(
        `SELECT u.points, u.role, l.id as level_id, l.name as level_name, 
                l.min_points, l.max_points, l.commission_personal, 
                l.commission_network, l.benefits, l.color
         FROM users u
         LEFT JOIN levels l ON u.role = l.role
         WHERE u.id = $1::uuid`,
        [userId]
      );

      if (userResult.rowCount === 0) {
        throw new Error('Usuário não encontrado');
      }

      const user = userResult.rows[0];
      let currentPoints = parseFloat(user.points || '0');

      // 🔥 A partir do Master, incluir pontos da equipe
      const rolesComEquipe = ['master', 'seniorConsultant', 'consultorPrime', 'executive', 'diretor_comercial'];
      
      if (rolesComEquipe.includes(user.role)) {
        const teamPointsResult = await pool.query(
          `SELECT COALESCE(SUM(points), 0)::NUMERIC as team_total
           FROM users
           WHERE parent_id = $1::uuid AND is_active = true`,
          [userId]
        );
        const teamPoints = parseFloat(teamPointsResult.rows[0]?.team_total || '0');
        currentPoints += teamPoints;
      }

      // Buscar próximo nível
      const nextLevelResult = await pool.query(
        `SELECT id, name, min_points, max_points, commission_personal,
                commission_network, benefits, color, role
         FROM levels
         WHERE min_points > $1
         ORDER BY min_points ASC
         LIMIT 1`,
        [currentPoints]
      );

      const nextLevel = nextLevelResult.rows[0] || null;

      // Calcular progresso
      let progressPercentage = 0;
      let pointsToNext = 0;

      if (nextLevel) {
        const rangeSize = nextLevel.min_points - user.min_points;
        const currentProgress = currentPoints - user.min_points;
        progressPercentage = (currentProgress / rangeSize) * 100;
        pointsToNext = nextLevel.min_points - currentPoints;
      }

      return {
        currentLevel: {
          id: user.level_id,
          name: user.level_name,
          min_points: parseFloat(user.min_points),
          max_points: user.max_points ? parseFloat(user.max_points) : null,
          commission_personal: parseFloat(user.commission_personal),
          commission_network: parseFloat(user.commission_network),
          benefits: user.benefits,
          color: user.color,
        },
        nextLevel: nextLevel ? {
          id: nextLevel.id,
          name: nextLevel.name,
          min_points: parseFloat(nextLevel.min_points),
          max_points: nextLevel.max_points ? parseFloat(nextLevel.max_points) : null,
          commission_personal: parseFloat(nextLevel.commission_personal),
          commission_network: parseFloat(nextLevel.commission_network),
          benefits: nextLevel.benefits,
          color: nextLevel.color,
        } : null,
        currentPoints,
        pointsToNext: Math.max(0, pointsToNext),
        progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
      };
    } catch (error: any) {
      console.error('❌ Erro ao buscar progresso de nível:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
