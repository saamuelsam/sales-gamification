// backend/src/modules/team/team.service.ts
import { pool } from '../../config/database';
import bcrypt from 'bcryptjs';
import { logger } from '../../utils/logger';
import { logActivity, ActivityAction } from '../../utils/activityLogger'; // ✅ Import

class TeamService {
  async getTeamMembers(leaderId: string) {
    try {
      const result = await pool.query(
        `SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.is_active,
          u.created_at,
          COALESCE(SUM(s.value), 0) as total_sales,
          COUNT(DISTINCT s.id) as sales_count,
          COALESCE(MAX(p.accumulated_points), 0) as total_points
         FROM user_hierarchy uh
         JOIN users u ON uh.subordinate_id = u.id
         LEFT JOIN sales s ON s.user_id = u.id
         LEFT JOIN points p ON p.user_id = u.id
         WHERE uh.leader_id = $1
         GROUP BY u.id, u.name, u.email, u.role, u.is_active, u.created_at
         ORDER BY u.created_at DESC`,
        [leaderId]
      );

      return result.rows;
    } catch (error: any) {
      logger.error('Erro ao buscar membros:', error.message);
      throw new Error('Erro ao buscar membros da equipe');
    }
  }

  /**
   * ✅ Adicionar membro à equipe (com log integrado)
   */
  async addTeamMember(leaderId: string, data: { email: string; name: string }) {
    const client = await pool.connect();

    try {
      logger.info(`🔍 [ADD_MEMBER] Leader ID recebido: ${leaderId}`);
      logger.info(`🔍 [ADD_MEMBER] Dados: ${JSON.stringify(data)}`);

      await client.query('BEGIN');

      // Verificar se o líder existe
      const leaderCheck = await client.query(
        'SELECT id, name, email FROM users WHERE id = $1',
        [leaderId]
      );

      if (leaderCheck.rows.length === 0) {
        logger.error(`❌ [ADD_MEMBER] LEADER NÃO EXISTE! ID: ${leaderId}`);
        throw new Error(`Líder com ID ${leaderId} não encontrado no banco de dados`);
      }

      logger.info(`✅ [ADD_MEMBER] Líder encontrado: ${leaderCheck.rows[0].name} (${leaderCheck.rows[0].email})`);

      // Verificar se usuário já existe
      const existingUser = await client.query(
        'SELECT id, name FROM users WHERE email = $1',
        [data.email]
      );

      let userId: string;
      let isNewUser = false;

      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
        logger.info(`✅ [ADD_MEMBER] Usuário já existe: ${userId}`);

        // Verificar se já está na equipe
        const existingRelation = await client.query(
          'SELECT id FROM user_hierarchy WHERE leader_id = $1 AND subordinate_id = $2',
          [leaderId, userId]
        );

        if (existingRelation.rows.length > 0) {
          throw new Error('Este usuário já está na sua equipe');
        }
      } else {
        // Criar novo usuário
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newUser = await client.query(
          `INSERT INTO users (name, email, password, role, is_active)
           VALUES ($1, $2, $3, 'consultant', true)
           RETURNING id`,
          [data.name, data.email, hashedPassword]
        );

        userId = newUser.rows[0].id;
        isNewUser = true;
        logger.info(`✅ [ADD_MEMBER] Novo usuário criado: ${userId}`);
      }

      logger.info(`🔗 [ADD_MEMBER] Criando hierarquia: Leader=${leaderId}, Member=${userId}`);

      // ✅ Adicionar à hierarquia
      await client.query(
        `INSERT INTO user_hierarchy (leader_id, subordinate_id, line_level)
         VALUES ($1, $2, 1)`,
        [leaderId, userId]
      );

      logger.info(`✅ [ADD_MEMBER] Hierarquia criada com sucesso!`);

      // ✅ REGISTRAR LOG DE ATIVIDADE
      await logActivity(leaderId, ActivityAction.ADD_TEAM_MEMBER, {
        memberId: userId,
        memberName: data.name,
        memberEmail: data.email,
        isNewUser,
        action: 'add_team_member',
        timestamp: new Date().toISOString()
      });

      await client.query('COMMIT');

      // Buscar dados do membro adicionado
      const member = await client.query(
        `SELECT id, name, email, role, created_at FROM users WHERE id = $1`,
        [userId]
      );

      return member.rows[0];
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error(`❌ [ADD_MEMBER] ERRO: ${error.message}`);
      logger.error(`❌ [ADD_MEMBER] Stack: ${error.stack}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * ✅ Remover membro da equipe (com log integrado)
   */
  async removeTeamMember(leaderId: string, memberId: string) {
    try {
      // ✅ Buscar informações do membro antes de remover
      const memberInfo = await pool.query(
        `SELECT u.name, u.email 
         FROM users u
         JOIN user_hierarchy uh ON uh.subordinate_id = u.id
         WHERE uh.leader_id = $1 AND uh.subordinate_id = $2`,
        [leaderId, memberId]
      );

      if (memberInfo.rows.length === 0) {
        throw new Error('Membro não encontrado na sua equipe');
      }

      const memberName = memberInfo.rows[0].name;
      const memberEmail = memberInfo.rows[0].email;

      // Remover da hierarquia
      const result = await pool.query(
        `DELETE FROM user_hierarchy 
         WHERE leader_id = $1 AND subordinate_id = $2
         RETURNING *`,
        [leaderId, memberId]
      );

      if (result.rows.length === 0) {
        throw new Error('Erro ao remover membro da equipe');
      }

      logger.info(`✅ [REMOVE_MEMBER] Membro ${memberId} removido da equipe do líder ${leaderId}`);

      // ✅ REGISTRAR LOG DE ATIVIDADE
      await logActivity(leaderId, ActivityAction.REMOVE_TEAM_MEMBER, {
        memberId,
        memberName,
        memberEmail,
        action: 'remove_team_member',
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error: any) {
      logger.error('Erro ao remover membro:', error.message);
      throw error;
    }
  }

  async getTeamStats(leaderId: string) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(DISTINCT uh.subordinate_id) as total_members,
          COALESCE(SUM(s.value), 0) as total_team_sales,
          COUNT(DISTINCT s.id) as total_team_sales_count,
          COALESCE(SUM(p_agg.total_points), 0) as total_team_points
         FROM user_hierarchy uh
         LEFT JOIN sales s ON s.user_id = uh.subordinate_id
         LEFT JOIN (
           SELECT user_id, MAX(accumulated_points) as total_points
           FROM points
           GROUP BY user_id
         ) p_agg ON p_agg.user_id = uh.subordinate_id
         WHERE uh.leader_id = $1`,
        [leaderId]
      );

      return result.rows[0];
    } catch (error: any) {
      logger.error('Erro ao buscar estatísticas:', error.message);
      throw new Error('Erro ao buscar estatísticas da equipe');
    }
  }
}

export const teamService = new TeamService();
