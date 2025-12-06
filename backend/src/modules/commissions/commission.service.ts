import { pool } from '@config/database';
import { logger } from '../../utils/logger';
import { logActivity } from '../../utils/activityLogger';
import { configService } from '../../services/config.service';
import { hierarchyCacheService } from '../../services/hierarchyCache.service';

export class CommissionService {
  /**
   * ✅ Processar comissão pessoal — Insere em personal_commissions (COM SEGURO)
   */
  async processPersonalCommission(
    consultantId: string,
    saleValue: number,
    points: number,
    saleId?: string
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      logger.info(`🔍 Iniciando processPersonalCommission para consultant ${consultantId}, sale ${saleId}`);

      // 🔒 LOCK pessimista - previne race conditions
      const userResult = await client.query(
        `SELECT role, name FROM users WHERE id = $1 FOR UPDATE`,
        [consultantId]
      );
      
      if (userResult.rows.length === 0) {
        logger.error(`❌ Usuário ${consultantId} não encontrado!`);
        return;
      }
      
      const userRole = userResult.rows[0].role;
      const userName = userResult.rows[0].name;
      
      logger.info(`👤 Processando comissão para: ${userName} | Role: ${userRole}`);

      // Buscar valor do seguro da venda (se houver)
      let insuranceValue = 0;
      if (saleId) {
        const saleResult = await client.query(
          `SELECT insurance_value FROM sales WHERE id = $1`,
          [saleId]
        );
        insuranceValue = parseFloat(saleResult.rows[0]?.insurance_value || 0);
      }

      // 🔧 Buscar percentuais de comissão do configService (cache automático)
      const commissionPercentage = await configService.getPersonalCommissionRate(userRole);
      const insurancePercentage = await configService.getInsuranceCommissionRate(userRole);
      
      // Calcular comissões separadamente
      const saleCommission = parseFloat(((saleValue * commissionPercentage) / 100).toFixed(2));
      const insuranceCommission = insuranceValue > 0 ? parseFloat(((insuranceValue * insurancePercentage) / 100).toFixed(2)) : 0;
      const totalCommission = saleCommission + insuranceCommission;
      
      logger.info(`🔢 Percentuais: venda=${commissionPercentage}%, seguro=${insurancePercentage}%`);
      logger.info(`💰 Valores: venda=R$ ${saleCommission}, seguro=R$ ${insuranceCommission}, total=R$ ${totalCommission}`);

      // Inserir em personal_commissions (agora com o total incluindo seguro)
      const result = await client.query(
        `INSERT INTO personal_commissions
         (user_id, sale_id, commission_percentage, commission_amount, points, paid, created_at)
         VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
         ON CONFLICT (user_id, sale_id) DO NOTHING
         RETURNING id`,
        [consultantId, saleId || null, commissionPercentage, totalCommission, points || 0]
      );

        if (result.rows.length > 0) {
          logger.info(
            `✅ Comissão pessoal criada: ID ${result.rows[0].id}, user ${consultantId}, sale ${saleId || 'N/A'}, R$ ${totalCommission} (venda: R$ ${saleCommission} + seguro: R$ ${insuranceCommission})`
          );
          
          // 📝 LOG: Comissão pessoal recebida
          await logActivity(consultantId, 'Recebeu comissão pessoal', {
            commission_id: result.rows[0].id,
            sale_id: saleId,
            percentage: commissionPercentage,
            insurance_percentage: insurancePercentage,
            sale_commission: saleCommission,
            insurance_commission: insuranceCommission,
            amount: totalCommission,
            points: points
          });
        } else {
          logger.warn(`⚠️ Comissão pessoal já existe (ON CONFLICT): user ${consultantId}, sale ${saleId}`);
        }

      await client.query('COMMIT');
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error(`❌ Erro ao processar comissão pessoal: ${error.message}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * ✅ Processar comissão de rede — BATCH INSERT (OTIMIZADO)
   */
  async processNetworkCommission(
  memberId: string,
  saleValue: number,
  points: number,
  saleId?: string
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    logger.info(`🔍 Iniciando processNetworkCommission para member ${memberId}, sale ${saleId}`);

    // Buscar role do membro que fez a venda
    const memberResult = await client.query(
      `SELECT role FROM users WHERE id = $1`,
      [memberId]
    );
    const memberRole = memberResult.rows[0]?.role || 'consultant';

    // 🚀 Buscar TODOS os líderes da hierarquia com CACHE (O(1) ao invés de O(N))
    const hierarchyResult = await hierarchyCacheService.getLeadersHierarchy(memberId, 10);

    if (hierarchyResult.length === 0) {
      logger.warn(`⚠️ Nenhum líder encontrado para o membro ${memberId}`);
      await client.query('COMMIT');
      return;
    }

    logger.info(`👥 Encontrados ${hierarchyResult.length} líderes na hierarquia (cached)`);

    // 🚀 OTIMIZAÇÃO: Calcular todas as comissões em memória primeiro
    const commissionsToInsert: any[] = [];
    
    // Processar comissão para cada líder na hierarquia
    for (const leader of hierarchyResult) {
      const lineLevel = leader.line_level;

      logger.info(`👤 Processando líder: ${leader.name} (${leader.role}) | Linha: ${lineLevel} | Membro role: ${memberRole}`);

      // 🔥 REGRA PRINCIPAL: Diretor Comercial, Executivo, Prime e Master recebem de múltiplas linhas
      // Sênior recebe APENAS da 1ª linha E APENAS de Consultores Elite
      if (leader.role === 'senior_consultant') {
        // Sênior: apenas 1ª linha e apenas Elite
        if (lineLevel > 1) {
          logger.info(`⚠️ ${leader.name} (Sênior) não recebe de linha ${lineLevel} > 1. Ignorando.`);
          continue;
        }
        if (memberRole !== 'consultant') {
          logger.info(`⚠️ ${leader.name} (Sênior) só recebe de Elite. Membro é ${memberRole}. Ignorando.`);
          continue;
        }
      }

      // 🔧 Buscar taxa de comissão de rede do configService
      let commissionRate = lineLevel === 1 
        ? await configService.getNetworkCommissionRateLine1(leader.role)
        : await configService.getNetworkCommissionRateRest(leader.role);

      // 🔧 Verificar profundidade máxima permitida para este role
      const maxDepth = await configService.getMaxNetworkDepth(leader.role);
      
      if (lineLevel > maxDepth) {
        logger.info(`⚠️ ${leader.name} (${leader.role}) não recebe de linha ${lineLevel} (máx: ${maxDepth}). Ignorando.`);
        continue;
      }

      // Se a taxa for 0, pular
      if (commissionRate === 0) {
        logger.info(`⚠️ ${leader.name} (${leader.role}) tem taxa 0% na linha ${lineLevel}. Ignorando.`);
        continue;
      }

      const commissionAmount = parseFloat(((saleValue * commissionRate) / 100).toFixed(2));

      logger.info(`💰 Taxa: ${commissionRate}%, Valor: R$ ${commissionAmount}, Linha: ${lineLevel}`);

      // 🚀 Acumular para batch insert
      commissionsToInsert.push({
        leaderId: leader.id,
        leaderName: leader.name,
        memberId,
        saleId: saleId || null,
        lineLevel,
        commissionRate,
        commissionAmount
      });
    }

    // 🚀 BATCH INSERT: Inserir todas as comissões de uma vez usando UNNEST
    if (commissionsToInsert.length > 0) {
      const leaderIds = commissionsToInsert.map(c => c.leaderId);
      const memberIds = commissionsToInsert.map(c => c.memberId);
      const saleIds = commissionsToInsert.map(c => c.saleId);
      const lineLevels = commissionsToInsert.map(c => c.lineLevel);
      const percentages = commissionsToInsert.map(c => c.commissionRate);
      const amounts = commissionsToInsert.map(c => c.commissionAmount);

      const result = await client.query(
        `INSERT INTO network_commissions
         (leader_id, team_member_id, sale_id, line_level, commission_percentage, commission_amount, paid, created_at)
         SELECT * FROM UNNEST(
           $1::uuid[], $2::uuid[], $3::uuid[], $4::int[], $5::numeric[], $6::numeric[]
         ) AS t(leader_id, team_member_id, sale_id, line_level, commission_percentage, commission_amount)
         WHERE NOT EXISTS (
           SELECT 1 FROM network_commissions nc 
           WHERE nc.leader_id = t.leader_id 
           AND nc.team_member_id = t.team_member_id 
           AND nc.sale_id = t.sale_id
         )
         RETURNING id, leader_id`,
        [leaderIds, memberIds, saleIds, lineLevels, percentages, amounts]
      );

      logger.info(`✅ ${result.rows.length} comissões de rede inseridas em batch`);

      // 📝 LOG: Registrar atividades em batch (otimizado)
      for (const commission of commissionsToInsert) {
        await logActivity(commission.leaderId, 'Recebeu nova comissão da rede', {
          team_member_id: commission.memberId,
          sale_id: commission.saleId,
          line_level: commission.lineLevel,
          percentage: commission.commissionRate,
          amount: commission.commissionAmount
        });
      }
    }

    await client.query('COMMIT');
  } catch (error: any) {
    await client.query('ROLLBACK');
    logger.error(`❌ Erro ao processar comissão de rede: ${error.message}`, error);
    throw error;
  } finally {
    client.release();
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
