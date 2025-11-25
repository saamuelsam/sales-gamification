// backend/src/modules/financial/financial.service.ts
import { pool } from '@config/database';
import { logActivity, ActivityAction } from '../../utils/activityLogger';
import { logger } from '../../utils/logger';
import { CommissionService } from '../commissions/commission.service';

/**
 * 💰 Financial Service - Gerenciamento de Aprovações de Vendas
 * Apenas CEO e Financeiro podem aprovar/rejeitar vendas
 */
export class FinancialService {
  
  /**
   * 📋 Listar vendas pendentes de aprovação
   */
  async getPendingSales(filters?: { search?: string; userId?: string; dateFrom?: string; dateTo?: string }) {
    let query = `
      SELECT 
        s.id,
        s.value,
        s.kilowatts,
        s.status,
        s.created_at,
        s.notes,
        s.client_name,
        s.client_id,
        u.id as seller_id,
        u.name as seller_name,
        u.email as seller_email,
        u.role as seller_role,
        c.cpf as client_cpf,
        c.phone as client_phone,
        c.email as client_email,
        (SELECT COUNT(*) FROM sales WHERE user_id = u.id AND status IN ('pending', 'negotiation')) as seller_pending_count,
        (SELECT COUNT(*) FROM sales WHERE user_id = u.id AND status = 'approved') as seller_approved_count
      FROM sales s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.status IN ('pending', 'negotiation')
    `;

    const params: any[] = [];

    if (filters?.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (s.client_name ILIKE $${params.length} OR u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }

    if (filters?.userId) {
      params.push(filters.userId);
      query += ` AND u.id = $${params.length}`;
    }

    if (filters?.dateFrom) {
      params.push(filters.dateFrom);
      query += ` AND s.created_at >= $${params.length}`;
    }

    if (filters?.dateTo) {
      params.push(filters.dateTo);
      query += ` AND s.created_at <= $${params.length}`;
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * ✅ Aprovar venda (apenas financeiro/CEO)
   */
  async approveSale(
    saleId: string,
    financialUserId: string,
    data: {
      notes?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    const client = await pool.connect();
    try {
      // Validar parâmetros obrigatórios
      if (!saleId || typeof saleId !== 'string') {
        throw new Error('ID da venda inválido');
      }

      if (!financialUserId || typeof financialUserId !== 'string') {
        logger.error(`❌ financialUserId inválido: ${financialUserId} (tipo: ${typeof financialUserId})`);
        throw new Error('ID do usuário inválido. Faça login novamente.');
      }

      await client.query('BEGIN');

      logger.info(`🔍 Aprovando venda ${saleId} por usuário ${financialUserId}`);

      // Buscar venda e validar
      const saleResult = await client.query(
        'SELECT * FROM sales WHERE id = $1',
        [saleId]
      );

      if (saleResult.rows.length === 0) {
        throw new Error('Venda não encontrada');
      }

      const sale = saleResult.rows[0];

      if (sale.status === 'approved') {
        throw new Error('Esta venda já foi aprovada');
      }

      if (sale.status === 'cancelled') {
        throw new Error('Vendas canceladas não podem ser aprovadas');
      }

      // Buscar dados do aprovador
      logger.info(`🔍 Buscando usuário aprovador com ID: ${financialUserId}`);
      const userResult = await client.query(
        'SELECT id, name, email, role FROM users WHERE id = $1',
        [financialUserId]
      );

      logger.info(`📊 Query users resultado: ${userResult.rows.length} linhas encontradas`);
      
      if (userResult.rows.length === 0) {
        logger.error(`❌ Nenhum usuário encontrado com ID: ${financialUserId}`);
        throw new Error(`Usuário não encontrado. Faça login novamente.`);
      }

      const approver = userResult.rows[0];
      logger.info(`✅ Aprovador encontrado: ${approver.name} (${approver.role})`);

      // Validar permissão
      if (!['ceo', 'financeiro', 'admin'].includes(approver.role)) {
        throw new Error('Apenas CEO, Financeiro e Admin podem aprovar vendas');
      }

      // Atualizar venda para aprovada
      await client.query(
        `UPDATE sales 
         SET status = 'approved',
             approved_by = $1,
             approved_at = NOW(),
             financial_notes = $2,
             approval_ip = $3,
             value_locked = TRUE,
             updated_at = NOW()
         WHERE id = $4`,
        [financialUserId, data.notes || null, data.ipAddress || null, saleId]
      );

      // Registrar no histórico de aprovações
      await client.query(
        `INSERT INTO sale_approval_history 
         (sale_id, user_id, user_name, user_role, action, previous_status, new_status, notes, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, 'approved', $5, 'approved', $6, $7, $8)`,
        [
          saleId,
          financialUserId,
          approver.name,
          approver.role,
          sale.status,
          data.notes || null,
          data.ipAddress || null,
          data.userAgent || null,
        ]
      );

      // Criar notificação para o vendedor
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, created_at)
         VALUES ($1, 'custom', 'Venda Aprovada', $2, NOW())`,
        [
          sale.user_id,
          `Sua venda de R$ ${parseFloat(sale.value).toFixed(2)} foi aprovada pelo departamento financeiro!`
        ]
      );

      // Log de auditoria
      await logActivity(financialUserId, ActivityAction.APPROVE_SALE, {
        saleId: saleId,
        saleValue: sale.value,
        sellerId: sale.user_id,
        previousStatus: sale.status,
        notes: data.notes,
        ipAddress: data.ipAddress,
        timestamp: new Date().toISOString(),
      });

      // 🎯 PROCESSAR COMISSÕES E PONTOS ANTES DO COMMIT (dentro da transação)
      try {
        await this.processCommissionsAndPoints(sale, client);
      } catch (commError: any) {
        logger.error(`❌ Erro ao processar comissões: ${commError.message}`);
        throw commError; // Rollback se falhar
      }

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Venda aprovada com sucesso',
        sale: {
          id: saleId,
          status: 'approved',
          approved_by: financialUserId,
          approved_at: new Date(),
        }
      };
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * ❌ Rejeitar venda (apenas financeiro/CEO)
   */
  async rejectSale(
    saleId: string,
    financialUserId: string,
    data: {
      reason: string; // Obrigatório explicar por que está rejeitando
      ipAddress?: string;
      userAgent?: string;
    }
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (!data.reason || data.reason.trim().length < 10) {
        throw new Error('É obrigatório fornecer um motivo detalhado para rejeitar a venda (mínimo 10 caracteres)');
      }

      // Buscar venda
      const saleResult = await client.query(
        'SELECT * FROM sales WHERE id = $1',
        [saleId]
      );

      if (saleResult.rows.length === 0) {
        throw new Error('Venda não encontrada');
      }

      const sale = saleResult.rows[0];

      if (sale.status === 'cancelled') {
        throw new Error('Esta venda já foi cancelada');
      }

      // Buscar dados do rejeitador
      const userResult = await client.query(
        'SELECT name, email, role FROM users WHERE id = $1',
        [financialUserId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      const rejecter = userResult.rows[0];

      if (!['ceo', 'financeiro', 'admin'].includes(rejecter.role)) {
        throw new Error('Apenas CEO, Financeiro e Admin podem rejeitar vendas');
      }

      // Atualizar venda para cancelada
      await client.query(
        `UPDATE sales 
         SET status = 'cancelled',
             rejected_by = $1,
             rejected_at = NOW(),
             financial_notes = $2,
             approval_ip = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [financialUserId, data.reason, data.ipAddress || null, saleId]
      );

      // 🔴 REMOVER PONTOS se foram atribuídos anteriormente (sistema antigo)
      // Verificar se existem pontos relacionados a esta venda
      const pointsResult = await client.query(
        'SELECT id, points FROM points WHERE sale_id = $1',
        [saleId]
      );

      if (pointsResult.rows.length > 0) {
        const pointsToRemove = pointsResult.rows[0].points;
        
        // Remover registro de pontos
        await client.query(
          'DELETE FROM points WHERE sale_id = $1',
          [saleId]
        );

        // Remover pontos da coluna users.points
        await client.query(
          `UPDATE users SET points = GREATEST(points - $1, 0) WHERE id = $2`,
          [Math.floor(pointsToRemove), sale.user_id]
        );

        logger.info(`🔴 Removidos ${pointsToRemove} pontos do usuário ${sale.user_id} devido à rejeição da venda ${saleId}`);
      }

      // Registrar no histórico
      await client.query(
        `INSERT INTO sale_approval_history 
         (sale_id, user_id, user_name, user_role, action, previous_status, new_status, notes, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, 'rejected', $5, 'cancelled', $6, $7, $8)`,
        [
          saleId,
          financialUserId,
          rejecter.name,
          rejecter.role,
          sale.status,
          data.reason,
          data.ipAddress || null,
          data.userAgent || null,
        ]
      );

      // Notificar vendedor
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, created_at)
         VALUES ($1, 'custom', 'Venda Rejeitada', $2, NOW())`,
        [
          sale.user_id,
          `Sua venda de R$ ${parseFloat(sale.value).toFixed(2)} foi rejeitada. Motivo: ${data.reason}`
        ]
      );

      // Log de auditoria
      await logActivity(financialUserId, ActivityAction.REJECT_SALE, {
        saleId: saleId,
        saleValue: sale.value,
        sellerId: sale.user_id,
        previousStatus: sale.status,
        reason: data.reason,
        ipAddress: data.ipAddress,
        timestamp: new Date().toISOString(),
      });

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Venda rejeitada',
        sale: {
          id: saleId,
          status: 'cancelled',
          rejected_by: financialUserId,
          rejected_at: new Date(),
          reason: data.reason,
        }
      };
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 📊 Estatísticas de aprovação
   */
  async getApprovalStats() {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'negotiation') as negotiation_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'cancelled') as rejected_count,
        COALESCE(SUM(value) FILTER (WHERE status = 'approved'), 0) as approved_value,
        COALESCE(SUM(value) FILTER (WHERE status = 'pending'), 0) as pending_value,
        COUNT(DISTINCT approved_by) as approvers_count
      FROM sales
    `);

    return result.rows[0];
  }

  /**
   * 📜 Histórico de aprovações de uma venda
   */
  async getSaleApprovalHistory(saleId: string) {
    const result = await pool.query(
      `SELECT * FROM sale_approval_history 
       WHERE sale_id = $1 
       ORDER BY created_at DESC`,
      [saleId]
    );

    return result.rows;
  }

  /**
   * 🎯 Processar comissões e pontos após aprovação da venda
   */
  private async processCommissionsAndPoints(sale: any, client: any) {
    const commissionService = new CommissionService();
    
    logger.info(`🎯 Processando comissões para venda ${sale.id}`);
    logger.info(`📊 Dados da venda: value=${sale.value}, kilowatts=${sale.kilowatts}, type=${sale.sale_type}`);
    
    // 1. CALCULAR E REGISTRAR PONTOS (apenas se ainda não foram dados)
    // Validar kilowatts para evitar overflow
    const rawKilowatts = parseFloat(sale.kilowatts);
    if (isNaN(rawKilowatts) || rawKilowatts < 0 || rawKilowatts > 2147483647) {
      logger.error(`❌ Valor de kilowatts inválido: ${sale.kilowatts}`);
      throw new Error(`Valor de kilowatts inválido: ${sale.kilowatts}. Deve ser entre 0 e 2.147.483.647`);
    }
    const points = rawKilowatts;
    let newAccumulatedPoints = 0;
    
    // Verificar se pontos já foram atribuídos para esta venda
    const existingPointsResult = await client.query(
      'SELECT id FROM points WHERE sale_id = $1',
      [sale.id]
    );
    
    if (existingPointsResult.rows.length === 0) {
      // Pontos ainda não foram dados, atribuir agora
      const currentPointsResult = await client.query(
        'SELECT COALESCE(MAX(accumulated_points), 0) as total FROM points WHERE user_id = $1',
        [sale.user_id]
      );
      const currentPoints = parseFloat(currentPointsResult.rows[0].total);
      newAccumulatedPoints = currentPoints + points;
      
      await client.query(
        `INSERT INTO points (user_id, sale_id, points, accumulated_points, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [sale.user_id, sale.id, points, newAccumulatedPoints, `Venda aprovada: ${sale.client_name}`]
      );
      
      logger.info(`✅ Atribuídos ${points} pontos ao usuário ${sale.user_id} pela venda ${sale.id}`);
    } else {
      logger.info(`ℹ️ Pontos já foram atribuídos anteriormente para a venda ${sale.id}`);
      // Buscar pontos acumulados atuais
      const currentPointsResult = await client.query(
        'SELECT COALESCE(MAX(accumulated_points), 0) as total FROM points WHERE user_id = $1',
        [sale.user_id]
      );
      newAccumulatedPoints = parseFloat(currentPointsResult.rows[0].total);
    }
    
    // 2. BUSCAR NÍVEL DO USUÁRIO
    const userResult = await client.query('SELECT role FROM users WHERE id = $1', [sale.user_id]);
    const userRole = userResult.rows[0].role;
    
    logger.info(`👤 Usuário role: ${userRole}`);
    
    const levelResult = await client.query(
      `SELECT personal_commission, insurance_commission
       FROM levels
       WHERE phase_number = (
         CASE
           WHEN $1 = 'consultant' THEN 1
           WHEN $1 = 'master_consultant' THEN 2
           WHEN $1 = 'senior_consultant' THEN 3
           WHEN $1 = 'prime_consultant' THEN 4
           WHEN $1 = 'executive' THEN 5
           WHEN $1 = 'diretor_comercial' THEN 6
           ELSE 1
         END
       )`,
      [userRole]
    );
    
    const level = levelResult.rows[0];
    logger.info(`📊 Comissões do nível: pessoal=${level.personal_commission}%, seguro=${level.insurance_commission}%`);
    
    // 3. CALCULAR COMISSÕES
    let saleCommission = 0;
    let insuranceCommissionValue = 0;
    
    // Validar valores monetários
    const saleValue = parseFloat(sale.value) || 0;
    const consortiumValue = parseFloat(sale.consortium_value) || 0;
    const insuranceValue = parseFloat(sale.insurance_value) || 0;
    
    logger.info(`💰 Valores: sale=${saleValue}, consortium=${consortiumValue}, insurance=${insuranceValue}`);
    
    if (sale.sale_type === 'consortium') {
      // CONSÓRCIO: 5% sobre consortium_value
      if (consortiumValue > 0) {
        saleCommission = (consortiumValue * 5.0) / 100;
      }
    } else {
      // VENDA NORMAL: usar comissão do nível
      const personalCommission = parseFloat(level.personal_commission) || 0;
      saleCommission = (saleValue * personalCommission) / 100;
      
      // Comissão de seguro (se tiver)
      if (insuranceValue > 0) {
        const insuranceCommission = parseFloat(level.insurance_commission) || 0;
        insuranceCommissionValue = (insuranceValue * insuranceCommission) / 100;
      }
    }
    
    const totalCommission = saleCommission + insuranceCommissionValue;
    
    logger.info(`💵 Comissões calculadas: venda=${saleCommission.toFixed(2)}, seguro=${insuranceCommissionValue.toFixed(2)}, total=${totalCommission.toFixed(2)}`);
    
    // 4. REGISTRAR COMISSÃO PESSOAL nas tabelas (compatibilidade com sistema antigo + PIX)
    const existingCommissionResult = await client.query(
      'SELECT id FROM commissions WHERE user_id = $1 AND sale_id = $2',
      [sale.user_id, sale.id]
    );
    
    if (existingCommissionResult.rows.length === 0) {
      // Inserir na tabela antiga (commissions) para compatibilidade
      await client.query(
        `INSERT INTO commissions (
          user_id, sale_id, sale_commission,
          insurance_commission, total_commission
        ) VALUES ($1, $2, $3, $4, $5)`,
        [sale.user_id, sale.id, saleCommission, insuranceCommissionValue, totalCommission]
      );
      logger.info(`✅ Comissão registrada (tabela antiga): R$ ${totalCommission.toFixed(2)}`);
      
      // 🔥 NOVO: Inserir também em personal_commissions (usado pelo sistema PIX)
      logger.info(`🔄 [PIX] Criando comissão pessoal para pagamento PIX...`);
      await commissionService.processPersonalCommission(
        sale.user_id,
        parseFloat(sale.value),
        points,
        sale.id
      );
    } else {
      logger.info(`ℹ️ Comissão já foi registrada anteriormente para a venda ${sale.id}`);
    }
    
    // 5. ATUALIZAR PONTOS DO USUÁRIO E DO LÍDER (apenas se pontos foram atribuídos agora)
    const pointsEarned = Math.floor(sale.kilowatts);
    if (existingPointsResult.rows.length === 0) {
      // 5.1 Atribuir pontos PESSOAIS ao consultor
      await client.query(
        `UPDATE users 
         SET personal_points = personal_points + $1,
             points = points + $1 
         WHERE id = $2`,
        [pointsEarned, sale.user_id]
      );
      logger.info(`✅ Pontos pessoais atribuídos ao consultor: ${pointsEarned} pontos`);
      
      // 5.2 Registrar na tabela points (histórico pessoal)
      await client.query(
        `INSERT INTO points (user_id, points, source_type, source_id, source_info, created_at)
         VALUES ($1, $2, 'sale', $3, $4, NOW())`,
        [
          sale.user_id, 
          pointsEarned, 
          sale.id,
          JSON.stringify({ type: 'personal', sale_value: sale.value, kilowatts: sale.kilowatts })
        ]
      );
      
      // 5.3 Buscar líder imediato do consultor
      const leaderResult = await client.query(
        `SELECT parent_id FROM users WHERE id = $1 AND parent_id IS NOT NULL`,
        [sale.user_id]
      );
      
      if (leaderResult.rows.length > 0) {
        const leaderId = leaderResult.rows[0].parent_id;
        
        // 5.4 Atribuir pontos DE EQUIPE ao líder
        await client.query(
          `UPDATE users 
           SET team_points = team_points + $1,
               points = points + $1 
           WHERE id = $2`,
          [pointsEarned, leaderId]
        );
        
        // Buscar nome do consultor e líder para log
        const userNames = await client.query(
          `SELECT 
             (SELECT name FROM users WHERE id = $1) as consultant_name,
             (SELECT name FROM users WHERE id = $2) as leader_name`,
          [sale.user_id, leaderId]
        );
        
        const consultantName = userNames.rows[0]?.consultant_name || 'Consultor';
        const leaderName = userNames.rows[0]?.leader_name || 'Líder';
        
        logger.info(`✅ Pontos de equipe atribuídos ao líder ${leaderName}: ${pointsEarned} pontos (venda de ${consultantName})`);
        
        // 5.5 Registrar na tabela points (histórico do líder)
        await client.query(
          `INSERT INTO points (user_id, points, source_type, source_id, source_info, created_at)
           VALUES ($1, $2, 'team_sale', $3, $4, NOW())`,
          [
            leaderId, 
            pointsEarned, 
            sale.id,
            JSON.stringify({ 
              type: 'team', 
              consultant_id: sale.user_id,
              consultant_name: consultantName,
              sale_value: sale.value, 
              kilowatts: sale.kilowatts 
            })
          ]
        );

        // 🔥 5.6 VERIFICAR PROMOÇÃO DO LÍDER após receber team_points
        try {
          const { LevelService } = require('../levels/level.service');
          const levelService = new LevelService();
          
          // Buscar novos totais do líder
          const leaderPointsResult = await client.query(
            `SELECT 
              COALESCE(personal_points, 0)::NUMERIC AS personal_points,
              COALESCE(team_points, 0)::NUMERIC AS team_points,
              COALESCE(points, 0)::NUMERIC AS total_points
             FROM users WHERE id = $1`,
            [leaderId]
          );
          
          const leaderTotalPoints = parseFloat(leaderPointsResult.rows[0]?.total_points || 0);
          await levelService.checkLevelUp(leaderId, leaderTotalPoints, client);
          logger.info(`✅ Verificação de nível do líder ${leaderName} concluída`);
        } catch (levelError: any) {
          logger.error(`❌ Erro ao verificar promoção do líder: ${levelError.message}`);
        }
      } else {
        logger.info(`ℹ️ Consultor não tem líder (independente)`);
      }
    }
    
    // 6. VERIFICAR PROMOÇÃO DE NÍVEL DO CONSULTOR após atribuir pontos
    try {
      const { LevelService } = require('../levels/level.service');
      const levelService = new LevelService();
      await levelService.checkLevelUp(sale.user_id, newAccumulatedPoints, client);
    } catch (levelError: any) {
      logger.error(`❌ Erro ao verificar promoção de nível: ${levelError.message}`);
    }
    
    // 7. PROCESSAR COMISSÃO DE REDE (para líder) - Já insere em network_commissions
    logger.info(`🌐 [PIX] Processando comissões de rede...`);
    await commissionService.processNetworkCommission(
      sale.user_id,
      parseFloat(sale.value),
      points,
      sale.id
    );
    
    logger.info(`✅ Comissões processadas: Pessoal R$ ${totalCommission.toFixed(2)}, Pontos: ${existingPointsResult.rows.length === 0 ? pointsEarned : 0}`);
    
    // 📝 LOG: Comissões geradas
    await logActivity(sale.user_id, ActivityAction.LEVEL_UP, {
      sale_id: sale.id,
      points_earned: existingPointsResult.rows.length === 0 ? pointsEarned : 0,
      accumulated_points: newAccumulatedPoints,
      personal_commission: totalCommission,
    });
  }
}
