// backend/src/modules/ceo/ceo.service.ts
import { pool } from '@config/database';
import { logActivity, ActivityAction } from '../../utils/activityLogger';
import bcrypt from 'bcryptjs';

/**
 * 🔐 CEO Service - Gerenciamento completo de usuários e sistema
 * Todas as operações registram logs para auditoria
 */
export class CeoService {
  
  /**
   * 📊 Buscar todos os consultores com suas métricas
   */
  async getAllConsultants(filters?: { role?: string; search?: string; active?: boolean }) {
    let query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.points,
        u.is_active,
        u.created_at,
        u.parent_id,
        parent.name as parent_name,
        (SELECT COUNT(*) FROM sales WHERE user_id = u.id AND status = 'approved') as total_sales,
        (SELECT COALESCE(SUM(value), 0) FROM sales WHERE user_id = u.id AND status = 'approved') as total_revenue,
        (SELECT COUNT(*) FROM user_hierarchy WHERE leader_id = u.id) as team_size,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM personal_commissions WHERE user_id = u.id) as total_commissions
      FROM users u
      LEFT JOIN users parent ON u.parent_id = parent.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Filtros
    if (filters?.role) {
      params.push(filters.role);
      query += ` AND u.role = $${params.length}`;
    }

    if (filters?.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }

    if (filters?.active !== undefined) {
      params.push(filters.active);
      query += ` AND u.is_active = $${params.length}`;
    }

    query += ' ORDER BY u.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 👤 Buscar detalhes completos de um consultor
   */
  async getConsultantDetails(userId: string) {
    const userQuery = await pool.query(
      `SELECT 
        u.*,
        parent.name as parent_name,
        parent.email as parent_email,
        (SELECT COUNT(*) FROM sales WHERE user_id = u.id AND status = 'approved') as total_sales,
        (SELECT COALESCE(SUM(value), 0) FROM sales WHERE user_id = u.id AND status = 'approved') as total_revenue,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM personal_commissions WHERE user_id = u.id) as personal_commissions,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM network_commissions WHERE leader_id = u.id) as network_commissions,
        (SELECT COUNT(*) FROM users WHERE parent_id = u.id) as team_size
      FROM users u
      LEFT JOIN users parent ON u.parent_id = parent.id
      WHERE u.id = $1`,
      [userId]
    );

    if (userQuery.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    const user = userQuery.rows[0];

    // Buscar equipe
    const teamQuery = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.points, u.is_active
       FROM user_hierarchy uh
       JOIN users u ON uh.subordinate_id = u.id
       WHERE uh.leader_id = $1`,
      [userId]
    );

    // Buscar vendas recentes
    const salesQuery = await pool.query(
      `SELECT 
        s.id,
        s.value,
        s.kilowatts,
        s.status,
        s.created_at,
        COALESCE(c.name, s.client_name) as client_name,
        s.client_id
       FROM sales s
       LEFT JOIN clients c ON s.client_id = c.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT 10`,
      [userId]
    );

    return {
      user,
      team: teamQuery.rows,
      recent_sales: salesQuery.rows,
    };
  }

  /**
   * ✏️ Editar dados do consultor
   */
  async updateConsultant(
    userId: string,
    data: {
      name?: string;
      email?: string;
      role?: string;
      points?: number;
      is_active?: boolean;
      parent_id?: string;
    },
    ceoId: string
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Buscar dados atuais
      const currentData = await client.query(
        'SELECT name, email, role, points, is_active, parent_id FROM users WHERE id = $1',
        [userId]
      );

      if (currentData.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      const oldData = currentData.rows[0];

      // Construir query de atualização dinâmica
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(data.email);
      }
      if (data.role !== undefined) {
        updates.push(`role = $${paramIndex++}`);
        values.push(data.role);
      }
      if (data.points !== undefined) {
        updates.push(`points = $${paramIndex++}`);
        values.push(data.points);
      }
      if (data.is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(data.is_active);
      }
      if (data.parent_id !== undefined) {
        updates.push(`parent_id = $${paramIndex++}`);
        values.push(data.parent_id);
      }

      if (updates.length === 0) {
        throw new Error('Nenhum dado para atualizar');
      }

      values.push(userId);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

      const result = await client.query(query, values);

      // Log de auditoria
      await logActivity(ceoId, ActivityAction.CEO_UPDATE_USER, {
        targetUserId: userId,
        targetUserName: oldData.name,
        oldData: {
          name: oldData.name,
          email: oldData.email,
          role: oldData.role,
          points: oldData.points,
          is_active: oldData.is_active,
        },
        newData: data,
        timestamp: new Date().toISOString(),
      });

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 🔄 Mudar cargo do consultor
   */
  async changeConsultantRole(userId: string, newRole: string, ceoId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Buscar dados atuais
      const userData = await client.query(
        'SELECT name, email, role FROM users WHERE id = $1',
        [userId]
      );

      if (userData.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      const { name, email, role: oldRole } = userData.rows[0];

      // Atualizar role
      await client.query('UPDATE users SET role = $1 WHERE id = $2', [newRole, userId]);

      // Log de auditoria
      await logActivity(ceoId, ActivityAction.CEO_CHANGE_ROLE, {
        targetUserId: userId,
        targetUserName: name,
        targetUserEmail: email,
        oldRole,
        newRole,
        timestamp: new Date().toISOString(),
      });

      await client.query('COMMIT');
      return { success: true, message: `Cargo alterado de ${oldRole} para ${newRole}` };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 📉 Ajustar pontos do consultor
   */
  async adjustPoints(
    userId: string,
    pointsChange: number,
    reason: string,
    ceoId: string
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Buscar pontos atuais
      const userData = await client.query(
        'SELECT name, email, points FROM users WHERE id = $1',
        [userId]
      );

      if (userData.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      const { name, email, points: currentPoints } = userData.rows[0];
      const currentPointsNum = parseFloat(currentPoints) || 0;
      const newPoints = Math.max(0, currentPointsNum + pointsChange);

      console.log('🔹 Ajustando pontos:', {
        userId,
        currentPoints: currentPointsNum,
        pointsChange,
        newPoints
      });

      // Atualizar pontos
      const updateResult = await client.query('UPDATE users SET points = $1 WHERE id = $2 RETURNING points', [newPoints, userId]);
      console.log('✅ Pontos atualizados:', updateResult.rows[0]);

      // Registrar no histórico de pontos
      // A coluna 'points' sempre deve ser positiva (valor absoluto)
      // O sinal de adição/remoção é indicado pela descrição
      const pointsToRecord = Math.abs(pointsChange);
      await client.query(
        `INSERT INTO points (user_id, points, accumulated_points, description, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [userId, pointsToRecord, newPoints, `${pointsChange > 0 ? '+' : '-'}${pointsToRecord} - ${reason}`]
      );

      // Log de auditoria
      await logActivity(ceoId, ActivityAction.CEO_ADJUST_POINTS, {
        targetUserId: userId,
        targetUserName: name,
        targetUserEmail: email,
        oldPoints: currentPoints || 0,
        pointsChange,
        newPoints,
        reason,
        timestamp: new Date().toISOString(),
      });

      await client.query('COMMIT');
      return {
        success: true,
        oldPoints: currentPoints || 0,
        newPoints,
        message: `Pontos ajustados: ${pointsChange > 0 ? '+' : ''}${pointsChange}`,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 💼 Criar venda para um consultor
   */
  async createSaleForConsultant(
    userId: string,
    saleData: {
      client_name: string;
      client_cpf?: string;
      client_phone?: string;
      client_email?: string;
      value: number;
      kilowatts: number;
      status?: string;
      notes?: string;
      sale_type?: string;
      insurance_value?: number;
      consortium_value?: number;
      consortium_term?: number;
      consortium_monthly_payment?: number;
      consortium_admin_fee?: number;
    },
    ceoId: string
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validar usuário
      const userData = await client.query(
        'SELECT name, email FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (userData.rows.length === 0) {
        throw new Error('Usuário não encontrado ou inativo');
      }

      // Sempre criar ou atualizar cliente
      let clientId = null;
      
      if (saleData.client_cpf) {
        // Se tem CPF, usar ON CONFLICT para atualizar caso já exista
        const clientResult = await client.query(
          `INSERT INTO clients (user_id, name, cpf, phone, email, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (cpf) DO UPDATE SET
             name = EXCLUDED.name,
             phone = EXCLUDED.phone,
             email = EXCLUDED.email,
             updated_at = NOW()
           RETURNING id`,
          [
            userId,
            saleData.client_name,
            saleData.client_cpf,
            saleData.client_phone || null,
            saleData.client_email || null,
          ]
        );
        clientId = clientResult.rows[0].id;
      } else {
        // Se não tem CPF, criar cliente sem CPF (permitindo duplicatas)
        const clientResult = await client.query(
          `INSERT INTO clients (user_id, name, phone, email, created_at)
           VALUES ($1, $2, $3, $4, NOW())
           RETURNING id`,
          [
            userId,
            saleData.client_name,
            saleData.client_phone || null,
            saleData.client_email || null,
          ]
        );
        clientId = clientResult.rows[0].id;
      }

      // ✅ Criar venda com todos os campos (incluindo consortium e insurance)
      const saleResult = await client.query(
        `INSERT INTO sales (
          user_id, client_id, client_name, value, kilowatts, status, notes, 
          sale_type, insurance_value, 
          consortium_value, consortium_term, consortium_monthly_payment, consortium_admin_fee,
          created_at
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
         RETURNING *`,
        [
          userId,
          clientId,
          saleData.client_name,
          saleData.value,
          saleData.kilowatts,
          saleData.status || 'pending', // ⚠️ CEO cria venda como 'pending' (precisa aprovação do financeiro)
          saleData.notes || 'Venda criada pelo CEO',
          saleData.sale_type || 'direct',
          saleData.insurance_value || null,
          saleData.consortium_value || null,
          saleData.consortium_term || null,
          saleData.consortium_monthly_payment || null,
          saleData.consortium_admin_fee || null,
        ]
      );

      const sale = saleResult.rows[0];

      // Calcular e adicionar pontos
      const points = Math.floor(saleData.kilowatts * 100); // 100 pontos por kW
      await client.query(
        'UPDATE users SET points = COALESCE(points, 0) + $1 WHERE id = $2',
        [points, userId]
      );

      // Registrar pontos
      const newAccumulatedPoints = await client.query(
        'SELECT COALESCE(points, 0) as points FROM users WHERE id = $1',
        [userId]
      );
      await client.query(
        `INSERT INTO points (user_id, points, accumulated_points, description, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [userId, points, newAccumulatedPoints.rows[0].points, `Venda #${sale.id} - ${saleData.kilowatts}kW`]
      );

      // Log de auditoria
      await logActivity(ceoId, ActivityAction.CEO_CREATE_SALE, {
        targetUserId: userId,
        targetUserName: userData.rows[0].name,
        saleId: sale.id,
        saleValue: saleData.value,
        kilowatts: saleData.kilowatts,
        pointsAwarded: points,
        timestamp: new Date().toISOString(),
      });

      await client.query('COMMIT');
      return sale;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 🗑️ Desativar/Reativar consultor
   */
  async toggleConsultantStatus(userId: string, ceoId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Buscar status atual
      const userData = await client.query(
        'SELECT name, email, is_active FROM users WHERE id = $1',
        [userId]
      );

      if (userData.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      const { name, email, is_active } = userData.rows[0];
      const newStatus = !is_active;

      // Atualizar status
      await client.query('UPDATE users SET is_active = $1 WHERE id = $2', [newStatus, userId]);

      // Log de auditoria
      await logActivity(ceoId, ActivityAction.CEO_TOGGLE_USER_STATUS, {
        targetUserId: userId,
        targetUserName: name,
        targetUserEmail: email,
        oldStatus: is_active ? 'ativo' : 'inativo',
        newStatus: newStatus ? 'ativo' : 'inativo',
        timestamp: new Date().toISOString(),
      });

      await client.query('COMMIT');
      return {
        success: true,
        newStatus,
        message: `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso`,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 🔄 Transferir consultor para outro patrocinador
   */
  async transferConsultant(userId: string, newParentId: string, ceoId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validar usuário
      const userData = await client.query(
        'SELECT name, email, parent_id FROM users WHERE id = $1',
        [userId]
      );

      if (userData.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      // Validar novo patrocinador
      const newParentData = await client.query(
        'SELECT name, email FROM users WHERE id = $1 AND is_active = true',
        [newParentId]
      );

      if (newParentData.rows.length === 0) {
        throw new Error('Novo patrocinador não encontrado ou inativo');
      }

      const oldParentId = userData.rows[0].parent_id;

      // Atualizar parent_id
      await client.query('UPDATE users SET parent_id = $1 WHERE id = $2', [newParentId, userId]);

      // Atualizar hierarquia
      await client.query(
        'UPDATE user_hierarchy SET leader_id = $1 WHERE subordinate_id = $2',
        [newParentId, userId]
      );

      // Log de auditoria
      await logActivity(ceoId, ActivityAction.CEO_TRANSFER_USER, {
        targetUserId: userId,
        targetUserName: userData.rows[0].name,
        oldParentId,
        newParentId,
        newParentName: newParentData.rows[0].name,
        timestamp: new Date().toISOString(),
      });

      await client.query('COMMIT');
      return {
        success: true,
        message: `Consultor transferido para ${newParentData.rows[0].name}`,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 🔍 Buscar histórico de ações do CEO
   */
  async getCeoActivityLogs(filters?: { startDate?: string; endDate?: string; action?: string }) {
    let query = `
      SELECT 
        al.*,
        u.name as ceo_name,
        u.email as ceo_email
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE u.role = 'ceo'
    `;

    const params: any[] = [];

    if (filters?.startDate) {
      params.push(filters.startDate);
      query += ` AND al.created_at >= $${params.length}`;
    }

    if (filters?.endDate) {
      params.push(filters.endDate);
      query += ` AND al.created_at <= $${params.length}`;
    }

    if (filters?.action) {
      params.push(filters.action);
      query += ` AND al.action = $${params.length}`;
    }

    query += ' ORDER BY al.created_at DESC LIMIT 500';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 🔐 Resetar senha de um consultor
   */
  async resetConsultantPassword(userId: string, newPassword: string, ceoId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validar usuário
      const userData = await client.query(
        'SELECT name, email FROM users WHERE id = $1',
        [userId]
      );

      if (userData.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar senha
      await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

      // Log de auditoria
      await logActivity(ceoId, ActivityAction.CEO_RESET_PASSWORD, {
        targetUserId: userId,
        targetUserName: userData.rows[0].name,
        targetUserEmail: userData.rows[0].email,
        timestamp: new Date().toISOString(),
      });

      await client.query('COMMIT');
      return {
        success: true,
        message: 'Senha resetada com sucesso',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 📋 Buscar todos os clientes do sistema
   */
  async getAllClients(filters?: { search?: string; userId?: string }) {
    let query = `
      SELECT 
        c.*,
        u.name as consultant_name,
        u.email as consultant_email,
        (SELECT COUNT(*) FROM sales WHERE client_id = c.id AND status = 'approved') as total_sales,
        (SELECT COALESCE(SUM(value), 0) FROM sales WHERE client_id = c.id AND status = 'approved') as total_value
      FROM clients c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters?.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (c.name ILIKE $${params.length} OR c.cpf ILIKE $${params.length} OR c.email ILIKE $${params.length} OR c.phone ILIKE $${params.length})`;
    }

    if (filters?.userId) {
      params.push(filters.userId);
      query += ` AND c.user_id = $${params.length}`;
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 👤 Buscar detalhes de um cliente
   */
  async getClientDetails(clientId: string) {
    const clientQuery = await pool.query(
      `SELECT 
        c.*,
        u.name as consultant_name,
        u.email as consultant_email,
        u.role as consultant_role
      FROM clients c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1`,
      [clientId]
    );

    if (clientQuery.rows.length === 0) {
      throw new Error('Cliente não encontrado');
    }

    const client = clientQuery.rows[0];

    // Buscar vendas do cliente
    const salesQuery = await pool.query(
      `SELECT s.*, u.name as consultant_name
       FROM sales s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.client_id = $1
       ORDER BY s.created_at DESC`,
      [clientId]
    );

    return {
      client,
      sales: salesQuery.rows,
    };
  }

  /**
   * ✏️ Atualizar dados do cliente
   */
  async updateClient(
    clientId: string,
    data: {
      name?: string;
      cpf?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
    },
    ceoId: string
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Buscar dados atuais
      const currentData = await client.query(
        'SELECT * FROM clients WHERE id = $1',
        [clientId]
      );

      if (currentData.rows.length === 0) {
        throw new Error('Cliente não encontrado');
      }

      // Construir query de atualização
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.cpf !== undefined) {
        updates.push(`cpf = $${paramIndex++}`);
        values.push(data.cpf);
      }
      if (data.email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(data.email);
      }
      if (data.phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(data.phone);
      }
      if (data.address !== undefined) {
        updates.push(`address = $${paramIndex++}`);
        values.push(data.address);
      }
      if (data.city !== undefined) {
        updates.push(`city = $${paramIndex++}`);
        values.push(data.city);
      }
      if (data.state !== undefined) {
        updates.push(`state = $${paramIndex++}`);
        values.push(data.state);
      }

      if (updates.length === 0) {
        throw new Error('Nenhum dado para atualizar');
      }

      values.push(clientId);
      const query = `UPDATE clients SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;

      const result = await client.query(query, values);

      // Se o nome foi atualizado, atualizar também o client_name nas vendas
      if (data.name) {
        await client.query(
          'UPDATE sales SET client_name = $1 WHERE client_id = $2',
          [data.name, clientId]
        );
      }

      // Log de auditoria
      await logActivity(ceoId, 'CEO atualizou dados do cliente', {
        clientId,
        clientName: currentData.rows[0].name,
        oldData: currentData.rows[0],
        newData: data,
        timestamp: new Date().toISOString(),
      });

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 🗑️ Deletar cliente
   */
  async deleteClient(clientId: string, ceoId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const clientData = await client.query(
        'SELECT name FROM clients WHERE id = $1',
        [clientId]
      );

      if (clientData.rows.length === 0) {
        throw new Error('Cliente não encontrado');
      }

      await client.query('DELETE FROM clients WHERE id = $1', [clientId]);

      await logActivity(ceoId, 'CEO deletou cliente', {
        clientId,
        clientName: clientData.rows[0].name,
        timestamp: new Date().toISOString(),
      });

      await client.query('COMMIT');
      return { success: true, message: 'Cliente deletado com sucesso' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 👥 Buscar todos os membros da equipe com hierarquia completa
   */
  async getAllTeamMembers() {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.cpf,
        u.phone,
        u.is_active,
        u.created_at,
        u.points as accumulated_points,
        parent.name as manager_name,
        parent.id as manager_id,
        parent.role as manager_role,
        (SELECT COUNT(*) FROM users WHERE parent_id = u.id) as direct_reports,
        (SELECT COUNT(*) FROM clients WHERE user_id = u.id) as clients_count,
        (SELECT COALESCE(SUM(value), 0) FROM sales WHERE user_id = u.id AND status = 'approved') as total_sales_value,
        (SELECT COUNT(*) FROM sales WHERE user_id = u.id AND status = 'approved') as sales_count
      FROM users u
      LEFT JOIN users parent ON u.parent_id = parent.id
      WHERE u.is_active = true
      ORDER BY 
        CASE u.role
          WHEN 'ceo' THEN 1
          WHEN 'diretor_comercial' THEN 2
          WHEN 'director' THEN 3
          WHEN 'executive' THEN 4
          WHEN 'prime_consultant' THEN 5
          WHEN 'senior_consultant' THEN 6
          WHEN 'master_consultant' THEN 7
          WHEN 'consultant' THEN 8
          ELSE 9
        END,
        u.name
    `;

    const result = await pool.query(query);
    return result.rows;
  }
}

export const ceoService = new CeoService();
