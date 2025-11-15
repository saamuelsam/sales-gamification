import { pool } from '@config/database';
import { logger } from '../../utils/logger';
import { logActivity } from '../../utils/activityLogger';

export class CommissionService {
  /**
   * ✅ Processar comissão pessoal — Insere em personal_commissions
   */
  async processPersonalCommission(
    consultantId: string,
    saleValue: number,
    points: number,
    saleId?: string
  ) {
    try {
        logger.info(`🔍 Iniciando processPersonalCommission para consultant ${consultantId}, sale ${saleId}`);

      // Buscar percentual de comissão baseado no nível do usuário
      const levelResult = await pool.query(
        `SELECT personal_commission
         FROM levels
         WHERE phase_number = (
           CASE
             WHEN (SELECT role FROM users WHERE id = $1) = 'consultant' THEN 1
             WHEN (SELECT role FROM users WHERE id = $1) = 'master_consultant' THEN 2
             WHEN (SELECT role FROM users WHERE id = $1) = 'senior_consultant' THEN 3
             WHEN (SELECT role FROM users WHERE id = $1) = 'prime_consultant' THEN 4
             WHEN (SELECT role FROM users WHERE id = $1) = 'executive' THEN 5
             ELSE 1
           END
         )`,
        [consultantId]
      );

      const commissionPercentage = parseFloat(levelResult.rows[0]?.personal_commission ?? 5);
      const commissionAmount = parseFloat(((saleValue * commissionPercentage) / 100).toFixed(2));

        logger.info(`💰 Percentual: ${commissionPercentage}%, Valor: R$ ${commissionAmount}`);

      // Inserir em personal_commissions
      const result = await pool.query(
        `INSERT INTO personal_commissions
         (user_id, sale_id, commission_percentage, commission_amount, points, paid, created_at)
         VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
         ON CONFLICT (user_id, sale_id) DO NOTHING
         RETURNING id`,
        [consultantId, saleId || null, commissionPercentage, commissionAmount, points || 0]
      );

        if (result.rows.length > 0) {
          logger.info(
            `✅ Comissão pessoal criada: ID ${result.rows[0].id}, user ${consultantId}, sale ${saleId || 'N/A'}, R$ ${commissionAmount}`
          );
          
          // 📝 LOG: Comissão pessoal recebida
          await logActivity(consultantId, 'Recebeu comissão pessoal', {
            commission_id: result.rows[0].id,
            sale_id: saleId,
            percentage: commissionPercentage,
            amount: commissionAmount,
            points: points
          });
        } else {
          logger.warn(`⚠️ Comissão pessoal já existe (ON CONFLICT): user ${consultantId}, sale ${saleId}`);
        }
    } catch (error: any) {
        logger.error(`❌ Erro ao processar comissão pessoal: ${error.message}`, error);
    }
  }

  /**
   * ✅ Processar comissão de rede — Insere em network_commissions
   */
  async processNetworkCommission(
  memberId: string,
  saleValue: number,
  points: number,
  saleId?: string
) {
  try {
    logger.info(`🔍 Iniciando processNetworkCommission para member ${memberId}, sale ${saleId}`);

    // Buscar role do membro que fez a venda
    const memberResult = await pool.query(
      `SELECT role FROM users WHERE id = $1`,
      [memberId]
    );
    const memberRole = memberResult.rows[0]?.role || 'consultant';

    // Buscar líder direto
    const leaderResult = await pool.query(
      `SELECT u.id, u.role, u.name
       FROM user_hierarchy uh
       JOIN users u ON uh.leader_id = u.id
       WHERE uh.subordinate_id = $1 AND uh.line_level = 1
       LIMIT 1`,
      [memberId]
    );

    if (leaderResult.rows.length === 0) {
      logger.warn(`⚠️ Nenhum líder encontrado para o membro ${memberId}`);
      return;
    }

    const leader = leaderResult.rows[0];
    logger.info(`👤 Líder encontrado: ${leader.name} (${leader.role}) | Membro role: ${memberRole}`);

    // Buscar line_level da hierarquia
    const lineResult = await pool.query(
      `SELECT line_level FROM user_hierarchy WHERE leader_id = $1 AND subordinate_id = $2`,
      [leader.id, memberId]
    );
    const lineLevel = lineResult.rows[0]?.line_level || 1;

    // 🔥 REGRA PRINCIPAL: Apenas Diretor Comercial recebe de toda rede
    // Demais (Master+) recebem APENAS da 1ª linha E APENAS de consultores Elite
    if (leader.role !== 'diretor_comercial') {
      // Regra padrão: apenas 1ª linha e apenas Elite
      if (lineLevel > 1) {
        logger.info(`⚠️ ${leader.name} (${leader.role}) não recebe de linhas > 1. Ignorando.`);
        return;
      }
      if (memberRole !== 'consultant') {
        logger.info(`⚠️ ${leader.name} (${leader.role}) só recebe de Elite. Membro é ${memberRole}. Ignorando.`);
        return;
      }
    }

    const commissionRates: Record<string, number> = {
      consultant: 0,
      master_consultant: 2.0,
      senior_consultant: 1.5,
      prime_consultant: 1.5,
      executive: 1.0,
      diretor_comercial: 2.0, // 2% para 1ª linha, 0.5% para resto da rede
    };

    let commissionRate = commissionRates[leader.role] ?? 1.0;

    // 🔥 Diretor Comercial: 2% na 1ª linha, 0.5% no resto da rede
    if (leader.role === 'diretor_comercial' && lineLevel > 1) {
      commissionRate = 0.5; // Resto da rede
    }

    const commissionAmount = parseFloat(((saleValue * commissionRate) / 100).toFixed(2));

    logger.info(`💰 Taxa: ${commissionRate}%, Valor: R$ ${commissionAmount}`);

    // Inserir em network_commissions
    const result = await pool.query(
      `INSERT INTO network_commissions
       (leader_id, team_member_id, sale_id, line_level, commission_percentage, commission_amount, paid, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW())
       ON CONFLICT (leader_id, team_member_id, sale_id) DO NOTHING
       RETURNING id`,
      [leader.id, memberId, saleId || null, lineLevel, commissionRate, commissionAmount]
    );

    if (result.rows.length > 0) {
      logger.info(
        `✅ Comissão de rede criada: ID ${result.rows[0].id}, líder ${leader.name}, membro ${memberId}, R$ ${commissionAmount}`
      );
      
      // 📝 LOG: Comissão de rede gerada
      await logActivity(leader.id, 'Recebeu nova comissão da rede', {
        commission_id: result.rows[0].id,
        team_member_id: memberId,
        sale_id: saleId,
        line_level: 1,
        percentage: commissionRate,
        amount: commissionAmount,
        team_member_name: leader.name
      });
    } else {
      logger.warn(`⚠️ Comissão de rede já existe (ON CONFLICT): líder ${leader.id}, membro ${memberId}`);
    }
  } catch (error: any) {
    logger.error(`❌ Erro ao processar comissão de rede: ${error.message}`, error);
  }
}

  /**
   * ✅ COMISSÕES PESSOAIS — Detalhadas
   */
  async getPersonalCommissions(userId: string) {
    const result = await pool.query(
      `SELECT 
        pc.id, pc.sale_id, pc.commission_percentage, pc.commission_amount, pc.points,
        pc.paid, pc.paid_at, pc.created_at,
        s.value AS sale_value,
        c.name AS client_name
       FROM personal_commissions pc
       LEFT JOIN sales s ON pc.sale_id = s.id
       LEFT JOIN clients c ON s.client_id = c.id
       WHERE pc.user_id = $1
       ORDER BY pc.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * ✅ COMISSÕES DE REDE — Detalhadas
   */
  async getNetworkCommissions(leaderId: string) {
    const result = await pool.query(
      `SELECT 
        nc.id, nc.sale_id, nc.commission_percentage, nc.commission_amount,
        nc.line_level, nc.paid, nc.paid_at, nc.created_at,
        u.name AS team_member_name, u.email AS team_member_email,
        s.value AS sale_value,
        c.name AS client_name
       FROM network_commissions nc
       JOIN users u ON nc.team_member_id = u.id
       LEFT JOIN sales s ON nc.sale_id = s.id
       LEFT JOIN clients c ON s.client_id = c.id
       WHERE nc.leader_id = $1
       ORDER BY nc.created_at DESC`,
      [leaderId]
    );

    return result.rows;
  }

  /**
   * ✅ RESUMO PESSOAL
   */
  async getPersonalSummary(userId: string) {
    const result = await pool.query(
      `SELECT 
         COUNT(*)::int AS total_commissions,
         COUNT(CASE WHEN paid = FALSE THEN 1 END)::int AS unpaid_commissions,
         COUNT(CASE WHEN paid = TRUE THEN 1 END)::int AS paid_commissions,
         COALESCE(SUM(CASE WHEN paid = FALSE THEN commission_amount ELSE 0 END), 0)::float AS total_unpaid,
         COALESCE(SUM(CASE WHEN paid = TRUE THEN commission_amount ELSE 0 END), 0)::float AS total_paid,
         COALESCE(SUM(commission_amount), 0)::float AS total_earned
       FROM personal_commissions
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }

  /**
   * ✅ RESUMO DE REDE (corrigido)
   */
  async getNetworkSummary(userId: string) {
    try {
      // Verifica se o usuário é líder de alguém
      const checkLeader = await pool.query(
        `SELECT COUNT(*)::int AS total_team
         FROM user_hierarchy
         WHERE leader_id = $1`,
        [userId]
      );

      if (checkLeader.rows[0].total_team === 0) {
        // Usuário sem equipe → nada de comissões de rede
        return {
          total_commissions: 0,
          unpaid_commissions: 0,
          paid_commissions: 0,
          total_unpaid: 0,
          total_paid: 0,
          total_earned: 0,
        };
      }

      const result = await pool.query(
        `SELECT 
           COUNT(*)::int AS total_commissions,
           COUNT(CASE WHEN paid = FALSE THEN 1 END)::int AS unpaid_commissions,
           COUNT(CASE WHEN paid = TRUE THEN 1 END)::int AS paid_commissions,
           COALESCE(SUM(CASE WHEN paid = FALSE THEN commission_amount ELSE 0 END), 0)::float AS total_unpaid,
           COALESCE(SUM(CASE WHEN paid = TRUE THEN commission_amount ELSE 0 END), 0)::float AS total_paid,
           COALESCE(SUM(commission_amount), 0)::float AS total_earned
         FROM network_commissions
         WHERE leader_id = $1`,
        [userId]
      );

      return result.rows[0];
    } catch (error: any) {
      logger.error(`❌ Erro ao buscar resumo de rede: ${error.message}`);
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
   * ✅ RESUMO COMPLETO (Pessoal + Rede)
   */
  async getCombinedSummary(userId: string) {
    try {
      const [personal, network] = await Promise.all([
        this.getPersonalSummary(userId),
        this.getNetworkSummary(userId)
      ]);

      const safePersonal = personal || {
        total_earned: 0,
        total_paid: 0,
        total_unpaid: 0,
      };
      const safeNetwork = network || {
        total_earned: 0,
        total_paid: 0,
        total_unpaid: 0,
      };

      return {
        personal: safePersonal,
        network: safeNetwork,
        total_earned:
          parseFloat(safePersonal.total_earned) +
          parseFloat(safeNetwork.total_earned),
        total_paid:
          parseFloat(safePersonal.total_paid) +
          parseFloat(safeNetwork.total_paid),
        total_pending:
          parseFloat(safePersonal.total_unpaid) +
          parseFloat(safeNetwork.total_unpaid),
      };
    } catch (error: any) {
      logger.error('❌ Erro ao buscar resumo de comissões:', error.message);
      return {
        personal: null,
        network: null,
        total_earned: 0,
        total_paid: 0,
        total_pending: 0,
      };
    }
  }

  /**
   * ✅ RESUMO MENSAL (últimos 6 meses)
   */
  async getMonthlySummary(userId: string) {
    try {
      const [personal, network] = await Promise.all([
        pool.query(
          `SELECT 
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            COALESCE(SUM(commission_amount), 0)::float AS amount
           FROM personal_commissions
           WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
           GROUP BY DATE_TRUNC('month', created_at)
           ORDER BY month ASC`,
          [userId]
        ),
        pool.query(
          `SELECT 
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
            COALESCE(SUM(commission_amount), 0)::float AS amount
           FROM network_commissions
           WHERE leader_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
           GROUP BY DATE_TRUNC('month', created_at)
           ORDER BY month ASC`,
          [userId]
        )
      ]);

      // Junta resultados
      const monthlyMap = new Map<string, number>();
      personal.rows.forEach(r =>
        monthlyMap.set(r.month, (monthlyMap.get(r.month) || 0) + r.amount)
      );
      network.rows.forEach(r =>
        monthlyMap.set(r.month, (monthlyMap.get(r.month) || 0) + r.amount)
      );

      return Array.from(monthlyMap.entries()).map(([month, amount]) => ({
        month,
        amount,
      }));
    } catch (error: any) {
      logger.error(`❌ Erro ao buscar resumo mensal: ${error.message}`);
      return [];
    }
  }
}

export const commissionService = new CommissionService();
