// backend/src/modules/commissions/commission.service.ts
import { pool } from '../../config/database';
import { logger } from '../../utils/logger';
import { logActivity, ActivityAction } from '../../utils/activityLogger'; // ✅ Import

export class CommissionService {
  private readonly commissionRates: any = {
    'consultant': 0,
    'master_consultant': 2.0,
    'senior_consultant': 1.5,
    'prime_consultant': 1.5,
    'executive': 1.0,
  };

  /**
   * ✅ Processar comissão de rede (com log integrado)
   */
  async processNetworkCommission(memberId: string, saleValue: number, points: number, saleId?: string) {
    try {
      logger.info(`📝 [COMISSÃO] Iniciando para membro: ${memberId}`);

      // 1. Buscar o líder direto
      const leaderResult = await pool.query(
        `SELECT u.id, u.role, u.name FROM user_hierarchy uh
         JOIN users u ON uh.leader_id = u.id
         WHERE uh.subordinate_id = $1 AND uh.line_level = 1
         LIMIT 1`,
        [memberId]
      );

      if (leaderResult.rows.length === 0) {
        logger.info(`⚠️ [COMISSÃO] Membro SEM líder`);
        return;
      }

      const leaderId = leaderResult.rows[0].id;
      const leaderRole = leaderResult.rows[0].role;
      const leaderName = leaderResult.rows[0].name;
      const commissionRate = this.commissionRates[leaderRole] || 0;

      if (commissionRate === 0) {
        logger.info(`⚠️ [COMISSÃO] Líder tem taxa 0%`);
        return;
      }

      // 2. Calcular comissão
      const commissionAmount = (saleValue * commissionRate) / 100;
      logger.info(`💰 [COMISSÃO] Valor: R$${commissionAmount.toFixed(2)}`);

      // 3. Buscar informações do membro
      const memberInfo = await pool.query(
        'SELECT name, email FROM users WHERE id = $1',
        [memberId]
      );

      const memberName = memberInfo.rows[0]?.name || 'Desconhecido';
      const memberEmail = memberInfo.rows[0]?.email || 'Desconhecido';

      // 4. Inserir comissão no banco
      logger.info(`💾 [COMISSÃO] Inserindo no banco...`);
      const insertResult = await pool.query(
        `INSERT INTO network_commissions 
         (leader_id, team_member_id, sale_id, line_level, commission_percentage, commission_amount, paid)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE)
         RETURNING id, commission_amount`,
        [
          leaderId,
          memberId,
          saleId || null,
          1,
          commissionRate,
          parseFloat(commissionAmount.toFixed(2)),
        ]
      );

      const commissionId = insertResult.rows[0].id;

      logger.info(`✅ [COMISSÃO] Inserida com sucesso!`);
      logger.info(`✅ [COMISSÃO] ID: ${commissionId}`);
      logger.info(`✅ [COMISSÃO] Valor: R$${insertResult.rows[0].commission_amount}`);

      // ✅ REGISTRAR LOG DE ATIVIDADE - NOVA COMISSÃO
      await logActivity(leaderId, ActivityAction.NEW_COMMISSION, {
        commissionId,
        memberId,
        memberName,
        memberEmail,
        commissionAmount: parseFloat(commissionAmount.toFixed(2)),
        commissionRate,
        percentage: commissionRate,
        saleId: saleId || null,
        saleValue,
        action: 'new_commission',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error(`❌ [COMISSÃO] ERRO: ${error.message}`);
      logger.error(`❌ [COMISSÃO] Stack: ${error.stack}`);
    }
  }

  /**
   * ✅ Listar comissões de rede
   */
  async getNetworkCommissions(leaderId: string) {
    try {
      logger.info(`📋 Buscando comissões para: ${leaderId}`);

      const result = await pool.query(
        `SELECT 
          nc.id,
          nc.leader_id,
          nc.team_member_id,
          nc.commission_percentage,
          nc.commission_amount,
          nc.paid,
          nc.paid_at,
          nc.created_at,
          u.name as team_member_name,
          u.email as team_member_email
         FROM network_commissions nc
         JOIN users u ON nc.team_member_id = u.id
         WHERE nc.leader_id = $1
         ORDER BY nc.created_at DESC
         LIMIT 100`,
        [leaderId]
      );

      logger.info(`✅ Encontradas ${result.rows.length} comissões`);
      return result.rows;
    } catch (error: any) {
      logger.error(`❌ Erro ao buscar: ${error.message}`);
      return [];
    }
  }

  /**
   * ✅ Resumo de comissões
   */
  async getNetworkCommissionsSummary(leaderId: string) {
    try {
      const result = await pool.query(
        `SELECT 
           COUNT(*)::int as total_commissions,
           COUNT(CASE WHEN paid = FALSE THEN 1 END)::int as unpaid_commissions,
           COUNT(CASE WHEN paid = TRUE THEN 1 END)::int as paid_commissions,
           COALESCE(SUM(CASE WHEN paid = FALSE THEN commission_amount ELSE 0 END), 0) as total_unpaid,
           COALESCE(SUM(CASE WHEN paid = TRUE THEN commission_amount ELSE 0 END), 0) as total_paid,
           COALESCE(SUM(commission_amount), 0) as total_earned
         FROM network_commissions 
         WHERE leader_id = $1`,
        [leaderId]
      );

      const row = result.rows[0] || {};
      return {
        total_commissions: row.total_commissions || 0,
        unpaid_commissions: row.unpaid_commissions || 0,
        paid_commissions: row.paid_commissions || 0,
        total_unpaid: parseFloat(row.total_unpaid || 0),
        total_paid: parseFloat(row.total_paid || 0),
        total_earned: parseFloat(row.total_earned || 0),
      };
    } catch (error: any) {
      logger.error(`❌ Erro ao buscar resumo: ${error.message}`);
      return {
        total_commissions: 0,
        unpaid_commissions: 0,
        paid_commissions: 0,
        total_unpaid: 0,
        total_paid: 0,
        total_earned: 0,
      };
    }
  }

  /**
   * ✅ Comissões agrupadas por mês para o gráfico
   */
  async getMonthlyNetworkCommissions(leaderId: string) {
    try {
      logger.info(`📊 Buscando comissões mensais para líder: ${leaderId}`);

      const result = await pool.query(
        `
        SELECT 
          TO_CHAR(DATE_TRUNC('month', nc.created_at), 'Mon') AS month,
          DATE_TRUNC('month', nc.created_at) AS month_date,
          COALESCE(SUM(nc.commission_amount), 0) AS amount
        FROM network_commissions nc
        WHERE nc.leader_id = $1
          AND nc.created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', nc.created_at)
        ORDER BY month_date ASC
        `,
        [leaderId]
      );

      const formattedData = result.rows.map((r) => ({
        month: this.formatMonthName(r.month),
        amount: parseFloat(r.amount),
      }));

      logger.info(`✅ Encontrados ${formattedData.length} meses de comissões`);
      return formattedData;
    } catch (error: any) {
      logger.error(`❌ Erro ao buscar comissões mensais: ${error.message}`);
      throw new Error('Erro ao buscar comissões mensais');
    }
  }

  /**
   * Formatar nome do mês para português
   */
  private formatMonthName(monthAbbr: string): string {
    const monthMap: Record<string, string> = {
      'Jan': 'Jan',
      'Feb': 'Fev',
      'Mar': 'Mar',
      'Apr': 'Abr',
      'May': 'Mai',
      'Jun': 'Jun',
      'Jul': 'Jul',
      'Aug': 'Ago',
      'Sep': 'Set',
      'Oct': 'Out',
      'Nov': 'Nov',
      'Dec': 'Dez',
    };

    const capitalized = monthAbbr.charAt(0).toUpperCase() + monthAbbr.slice(1).toLowerCase();
    return monthMap[capitalized] || capitalized;
  }

  /**
   * ✅ Resumo completo
   */
  async getCompleteCommissionsSummary(userId: string) {
    try {
      const networkSummary = await this.getNetworkCommissionsSummary(userId);
      return {
        network: networkSummary,
        total_earned: networkSummary.total_earned || 0,
        total_paid: networkSummary.total_paid || 0,
        total_pending: networkSummary.total_unpaid || 0,
      };
    } catch (error: any) {
      logger.error(`❌ Erro: ${error.message}`);
      return {
        network: null,
        total_earned: 0,
        total_paid: 0,
        total_pending: 0,
      };
    }
  }

  /**
   * ✅ Marcar como paga (com log integrado)
   */
  async markNetworkCommissionAsPaid(commissionId: string, leaderId: string) {
    try {
      // Buscar informações da comissão antes de atualizar
      const commissionInfo = await pool.query(
        `SELECT nc.commission_amount, u.name as member_name
         FROM network_commissions nc
         JOIN users u ON nc.team_member_id = u.id
         WHERE nc.id = $1 AND nc.leader_id = $2`,
        [commissionId, leaderId]
      );

      if (commissionInfo.rows.length === 0) {
        throw new Error('Comissão não encontrada');
      }

      const commissionAmount = commissionInfo.rows[0].commission_amount;
      const memberName = commissionInfo.rows[0].member_name;

      // Atualizar comissão
      const result = await pool.query(
        `UPDATE network_commissions 
         SET paid = TRUE, paid_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND leader_id = $2
         RETURNING *`,
        [commissionId, leaderId]
      );

      if (result.rows.length === 0) {
        throw new Error('Erro ao atualizar comissão');
      }

      logger.info(`✅ Comissão ${commissionId} marcada como paga`);

      // ✅ REGISTRAR LOG DE ATIVIDADE - COMISSÃO PAGA
      await logActivity(leaderId, ActivityAction.MARK_COMMISSION_PAID, {
        commissionId,
        commissionAmount: parseFloat(commissionAmount),
        amount: parseFloat(commissionAmount),
        memberName,
        paidAt: new Date().toISOString(),
        action: 'mark_commission_paid',
        timestamp: new Date().toISOString()
      });

      return result.rows[0];
    } catch (error: any) {
      logger.error(`❌ Erro ao marcar como paga: ${error.message}`);
      throw error;
    }
  }

  /**
   * ✅ Relatório consolidado
   */
  async getConsolidatedCommissionsReport() {
    try {
      const result = await pool.query(
        `SELECT 
          u.id as user_id,
          u.name as user_name,
          u.email,
          u.role,
          COALESCE(SUM(nc.commission_amount), 0) as network_total,
          COALESCE(SUM(CASE WHEN nc.paid THEN nc.commission_amount ELSE 0 END), 0) as network_paid,
          COALESCE(SUM(CASE WHEN NOT nc.paid THEN nc.commission_amount ELSE 0 END), 0) as network_pending,
          COUNT(nc.id)::int as commission_count
        FROM users u
        LEFT JOIN network_commissions nc ON nc.leader_id = u.id
        WHERE u.is_active = true
        GROUP BY u.id, u.name, u.email, u.role
        HAVING COUNT(nc.id) > 0
        ORDER BY network_total DESC`
      );

      logger.info(`📈 Relatório: ${result.rows.length} usuários com comissões`);
      return result.rows;
    } catch (error: any) {
      logger.error(`❌ Erro ao gerar relatório: ${error.message}`);
      return [];
    }
  }

  /**
   * ✅ Exportar CSV
   */
  async exportCommissionsCSV() {
    try {
      const report = await this.getConsolidatedCommissionsReport();
      const headers = ['ID', 'Nome', 'Email', 'Cargo', 'Total', 'Pagas', 'Pendentes', 'Quantidade'];
      const rows = report.map((r: any) => [
        r.user_id,
        r.user_name,
        r.email,
        r.role,
        parseFloat(r.network_total).toFixed(2),
        parseFloat(r.network_paid).toFixed(2),
        parseFloat(r.network_pending).toFixed(2),
        r.commission_count,
      ]);

      logger.info(`📥 CSV exportado: ${rows.length} linhas`);
      return { headers, rows };
    } catch (error: any) {
      logger.error(`❌ Erro ao exportar: ${error.message}`);
      throw error;
    }
  }

  /**
   * ✅ Estatísticas gerais do sistema de comissões
   */
  async getCommissionsStats() {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*)::int as total_commissions,
          COUNT(DISTINCT leader_id)::int as total_leaders,
          COALESCE(SUM(commission_amount), 0) as total_amount,
          COALESCE(SUM(CASE WHEN paid THEN commission_amount ELSE 0 END), 0) as total_paid,
          COALESCE(AVG(commission_amount), 0) as avg_commission
         FROM network_commissions`
      );

      const stats = result.rows[0];
      return {
        total_commissions: stats.total_commissions || 0,
        total_leaders: stats.total_leaders || 0,
        total_amount: parseFloat(stats.total_amount || 0),
        total_paid: parseFloat(stats.total_paid || 0),
        avg_commission: parseFloat(stats.avg_commission || 0),
      };
    } catch (error: any) {
      logger.error(`❌ Erro ao buscar estatísticas: ${error.message}`);
      throw error;
    }
  }
}

export const commissionService = new CommissionService();
