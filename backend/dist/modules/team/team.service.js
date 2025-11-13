"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamService = void 0;
// backend/src/modules/team/team.service.ts
const database_1 = require("../../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("../../utils/logger");
const activityLogger_1 = require("../../utils/activityLogger");
class TeamService {
    /**
     * ✅ Buscar membros da equipe
     */
    async getTeamMembers(leaderId) {
        try {
            const result = await database_1.pool.query(`SELECT 
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
         ORDER BY u.created_at DESC`, [leaderId]);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar membros:', error.message);
            throw new Error('Erro ao buscar membros da equipe');
        }
    }
    /**
     * ✅ Adicionar membro à equipe (com log integrado)
     */
    async addTeamMember(leaderId, data) {
        const client = await database_1.pool.connect();
        try {
            logger_1.logger.info(`🔍 [ADD_MEMBER] Leader ID recebido: ${leaderId}`);
            logger_1.logger.info(`🔍 [ADD_MEMBER] Dados: ${JSON.stringify(data)}`);
            await client.query('BEGIN');
            // Verificar se o líder existe
            const leaderCheck = await client.query('SELECT id, name, email FROM users WHERE id = $1', [leaderId]);
            if (leaderCheck.rows.length === 0) {
                logger_1.logger.error(`❌ [ADD_MEMBER] LEADER NÃO EXISTE! ID: ${leaderId}`);
                throw new Error(`Líder com ID ${leaderId} não encontrado no banco de dados`);
            }
            logger_1.logger.info(`✅ [ADD_MEMBER] Líder encontrado: ${leaderCheck.rows[0].name} (${leaderCheck.rows[0].email})`);
            // Verificar se usuário já existe
            const existingUser = await client.query('SELECT id, name FROM users WHERE email = $1', [data.email]);
            let userId;
            let isNewUser = false;
            if (existingUser.rows.length > 0) {
                userId = existingUser.rows[0].id;
                logger_1.logger.info(`✅ [ADD_MEMBER] Usuário já existe: ${userId}`);
                // Verificar se já está na equipe
                const existingRelation = await client.query('SELECT id FROM user_hierarchy WHERE leader_id = $1 AND subordinate_id = $2', [leaderId, userId]);
                if (existingRelation.rows.length > 0) {
                    throw new Error('Este usuário já está na sua equipe');
                }
            }
            else {
                // Criar novo usuário
                const tempPassword = Math.random().toString(36).slice(-8);
                const hashedPassword = await bcryptjs_1.default.hash(tempPassword, 10);
                const newUser = await client.query(`INSERT INTO users (name, email, password, role, is_active)
           VALUES ($1, $2, $3, 'consultant', true)
           RETURNING id`, [data.name, data.email, hashedPassword]);
                userId = newUser.rows[0].id;
                isNewUser = true;
                logger_1.logger.info(`✅ [ADD_MEMBER] Novo usuário criado: ${userId}`);
            }
            logger_1.logger.info(`🔗 [ADD_MEMBER] Criando hierarquia: Leader=${leaderId}, Member=${userId}`);
            // ✅ Adicionar à hierarquia
            await client.query(`INSERT INTO user_hierarchy (leader_id, subordinate_id, line_level, joined_at)
          VALUES ($1, $2, 1, NOW())`, [leaderId, userId]);
            logger_1.logger.info(`✅ [ADD_MEMBER] Hierarquia criada com sucesso!`);
            // ✅ REGISTRAR LOG DE ATIVIDADE
            await (0, activityLogger_1.logActivity)(leaderId, activityLogger_1.ActivityAction.ADD_TEAM_MEMBER, {
                memberId: userId,
                memberName: data.name,
                memberEmail: data.email,
                isNewUser,
                action: 'add_team_member',
                timestamp: new Date().toISOString()
            });
            await client.query('COMMIT');
            // Buscar dados do membro adicionado
            const member = await client.query(`SELECT id, name, email, role, created_at FROM users WHERE id = $1`, [userId]);
            return member.rows[0];
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.logger.error(`❌ [ADD_MEMBER] ERRO: ${error.message}`);
            logger_1.logger.error(`❌ [ADD_MEMBER] Stack: ${error.stack}`);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * ✅ Remover membro da equipe (CORRIGIDO com transaction e casting UUID)
     */
    async removeTeamMember(leaderId, memberId) {
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            // ✅ Debug: verificar os IDs recebidos
            logger_1.logger.info(`🔍 [REMOVE_MEMBER] Leader ID: ${leaderId}`);
            logger_1.logger.info(`🔍 [REMOVE_MEMBER] Member ID: ${memberId}`);
            // ✅ Buscar informações do membro ANTES de remover (com casting explícito)
            const memberInfo = await client.query(`SELECT u.id, u.name, u.email, uh.id as hierarchy_id
         FROM users u
         JOIN user_hierarchy uh ON uh.subordinate_id = u.id
         WHERE uh.leader_id = $1::uuid AND uh.subordinate_id = $2::uuid`, [leaderId, memberId]);
            logger_1.logger.info(`🔍 [REMOVE_MEMBER] Query result: ${JSON.stringify(memberInfo.rows)}`);
            if (memberInfo.rows.length === 0) {
                logger_1.logger.error(`❌ [REMOVE_MEMBER] Membro não encontrado! Leader: ${leaderId}, Member: ${memberId}`);
                throw new Error('Membro não encontrado na sua equipe');
            }
            const memberName = memberInfo.rows[0].name;
            const memberEmail = memberInfo.rows[0].email;
            logger_1.logger.info(`✅ [REMOVE_MEMBER] Membro encontrado: ${memberName} (${memberEmail})`);
            // ✅ Remover da hierarquia (com casting explícito)
            const result = await client.query(`DELETE FROM user_hierarchy 
         WHERE leader_id = $1::uuid AND subordinate_id = $2::uuid
         RETURNING *`, [leaderId, memberId]);
            if (result.rows.length === 0) {
                logger_1.logger.error(`❌ [REMOVE_MEMBER] DELETE falhou! Leader: ${leaderId}, Member: ${memberId}`);
                throw new Error('Erro ao remover membro da equipe');
            }
            logger_1.logger.info(`✅ [REMOVE_MEMBER] Membro ${memberId} removido com sucesso da equipe do líder ${leaderId}`);
            // ✅ REGISTRAR LOG DE ATIVIDADE
            await (0, activityLogger_1.logActivity)(leaderId, activityLogger_1.ActivityAction.REMOVE_TEAM_MEMBER, {
                memberId,
                memberName,
                memberEmail,
                action: 'remove_team_member',
                timestamp: new Date().toISOString()
            });
            await client.query('COMMIT');
            return true;
        }
        catch (error) {
            await client.query('ROLLBACK');
            logger_1.logger.error(`❌ [REMOVE_MEMBER] ERRO: ${error.message}`);
            logger_1.logger.error(`❌ [REMOVE_MEMBER] Stack: ${error.stack}`);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * ✅ Buscar estatísticas da equipe
     */
    async getTeamStats(leaderId) {
        try {
            const result = await database_1.pool.query(`SELECT 
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
         WHERE uh.leader_id = $1`, [leaderId]);
            return result.rows[0];
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar estatísticas:', error.message);
            throw new Error('Erro ao buscar estatísticas da equipe');
        }
    }
}
exports.teamService = new TeamService();
