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
        (SELECT COUNT(*) FROM sales WHERE user_id = u.id) as total_sales,
        (SELECT COALESCE(SUM(value), 0) FROM sales WHERE user_id = u.id) as total_revenue,
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
        (SELECT COUNT(*) FROM sales WHERE user_id = u.id) as total_sales,
        (SELECT COALESCE(SUM(value), 0) FROM sales WHERE user_id = u.id) as total_revenue,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM personal_commissions WHERE user_id = u.id) as personal_commissions,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM network_commissions WHERE leader_id = u.id) as network_commissions
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
      `SELECT s.*, c.name as client_name
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
      const newPoints = Math.max(0, (currentPoints || 0) + pointsChange);

      // Atualizar pontos
      await client.query('UPDATE users SET points = $1 WHERE id = $2', [newPoints, userId]);

      // Registrar no histórico de pontos
      await client.query(
        `INSERT INTO points (user_id, accumulated_points, reason, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, pointsChange, reason]
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
      client_id: string;
      value: number;
      kilowatts: number;
      status?: string;
      description?: string;
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

      // Criar venda
      const saleResult = await client.query(
        `INSERT INTO sales (user_id, client_id, value, kilowatts, status, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [
          userId,
          saleData.client_id,
          saleData.value,
          saleData.kilowatts,
          saleData.status || 'approved',
          saleData.description || 'Venda criada pelo CEO',
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
      await client.query(
        `INSERT INTO points (user_id, accumulated_points, reason, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, points, `Venda #${sale.id} - ${saleData.kilowatts}kW`]
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
}

export const ceoService = new CeoService();
