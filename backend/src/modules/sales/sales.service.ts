import { pool } from '@config/database';
import { rewardsService } from '../rewards/rewards.service';
import { LevelService, levelService } from '../levels/level.service';
import { CommissionService } from '../commissions/commission.service';
import { logActivity } from '../../utils/activityLogger';
import { monthlyTargetService } from '../../services/monthlyTarget.service';
import { rewardsService as advancementRewardsService } from '../../services/rewards.service';

interface CreateSaleData {
  client_id?: string;
  client_name: string;
  value: number;
  kilowatts: number;
  insurance_value?: number;
  sale_type?: 'direct' | 'consortium' | 'cash' | 'card';
  consortium_value?: number;
  consortium_term?: number;
  consortium_monthly_payment?: number;
  consortium_admin_fee?: number;
  template_type?: string;
  notes?: string;
}

export class SalesService {
  private levelService = new LevelService();
  private commissionService = new CommissionService();

  async createSale(userId: string, data: CreateSaleData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Validações específicas para consórcio
      if (data.sale_type === 'consortium') {
        if (!data.consortium_value || !data.consortium_term) {
          throw new Error('Consórcio requer valor e prazo');
        }
      }

      // 1. Inserir venda - SEMPRE começa como 'pending' para aprovação do financeiro
      const saleResult = await client.query(
        `INSERT INTO sales (
          user_id, client_id, client_name, value, kilowatts,
          insurance_value, sale_type, consortium_value, consortium_term,
          consortium_monthly_payment, consortium_admin_fee,
          template_type, notes, status, value_locked
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', TRUE)
        RETURNING *`,
        [
          userId,
          data.client_id || null,
          data.client_name,
          data.value,
          data.kilowatts,
          data.insurance_value || null,
          data.sale_type || 'direct',
          data.consortium_value || null,
          data.consortium_term || null,
          data.consortium_monthly_payment || null,
          data.consortium_admin_fee || null,
          data.template_type || null,
          data.notes || null,
        ]
      );

      const sale = saleResult.rows[0];

      // ⏳ PONTOS SERÃO ATRIBUÍDOS APENAS APÓS APROVAÇÃO FINANCEIRA
      // Essa mudança garante que pontos só sejam dados para vendas aprovadas
      // e não para vendas pendentes ou rejeitadas

      // 2. Buscar nível do usuário
      const userResult = await client.query('SELECT role FROM users WHERE id = $1', [userId]);
      const userRole = userResult.rows[0].role;

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
             ELSE 1
           END
         )`,
        [userRole]
      );

      const level = levelResult.rows[0];

      // ⏳ COMISSÕES NÃO SÃO MAIS CALCULADAS OU REGISTRADAS NA CRIAÇÃO
      // Comissões (pessoal + rede) serão calculadas e registradas APENAS quando
      // o financeiro aprovar a venda através do endpoint /financial/approve/:saleId
      // Isso garante que:
      // - Comissões só existem para vendas aprovadas
      // - Não há duplicação de comissões
      // - Vendas rejeitadas não geram comissões

      // ATUALIZAR CONTADORES MENSAIS
      await monthlyTargetService.updateUserMonthlyStats(userId, data.kilowatts);

      // ⏳ PONTOS NÃO SÃO MAIS ATUALIZADOS AQUI
      // Serão atualizados apenas quando o financeiro aprovar a venda

      await client.query('COMMIT');

      // ⏳ Promoção de nível será verificada apenas após aprovação financeira

      // 📝 LOG: Venda criada (aguardando aprovação financeira)
      await logActivity(userId, 'Registrou nova venda', {
        sale_id: sale.id,
        client_name: data.client_name,
        value: data.value,
        kilowatts: data.kilowatts,
        sale_type: data.sale_type || 'direct',
        status: 'pending_approval',
      });

      // ✅ Verificar premiações APÓS commit (evita deadlocks)
      try {
        await this.checkRewardEligibility(userId, client);
        await advancementRewardsService.checkAndAwardBasicBasket(userId);
      } catch (rewardError) {
        console.error('Erro ao verificar premiações (não crítico):', rewardError);
      }

      return {
        sale,
        message: 'Venda criada com sucesso. Aguardando aprovação financeira para liberar pontos e comissões.',
        status: 'pending_approval',
        note: 'Pontos e comissões serão calculados após aprovação do setor financeiro.',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Método novo para verificar e registrar premiação
  private async checkRewardEligibility(userId: string, client: any) {
    // Buscar total de kW do mês atual
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    const monthlyKwResult = await client.query(
      `SELECT
         COALESCE(SUM(kilowatts), 0) as total_kw,
         COUNT(*) as total_sales
       FROM sales
       WHERE user_id = $1
         AND created_at >= $2
         AND status NOT IN ('cancelled', 'financing_denied')`,
      [userId, firstDayOfMonth]
    );

    const totalKw = parseFloat(monthlyKwResult.rows[0].total_kw);
    const totalSales = parseInt(monthlyKwResult.rows[0].total_sales);

    // Verificar se já ganhou prêmio este mês
    const existingRewardResult = await client.query(
      `SELECT id FROM rewards
       WHERE user_id = $1
         AND reward_type = 'cesta_basica'
         AND created_at >= $2`,
      [userId, firstDayOfMonth]
    );

    const hasRewardThisMonth = existingRewardResult.rows.length > 0;

    // REGRA: 400 kW + pelo menos 1 venda no mês = Cesta Básica
    if (totalKw >= 400 && totalSales >= 1 && !hasRewardThisMonth) {
      // Registrar prêmio
      await client.query(
        `INSERT INTO rewards (user_id, reward_type, description, points_earned, threshold_reached, status)
         VALUES ($1, 'cesta_basica', 'Cesta Básica - 400 kW atingidos', $2, 400, 'pending')`,
        [userId, totalKw]
      );

      // Criar notificação
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, metadata)
         VALUES ($1, 'reward', '🎁 Parabéns! Você ganhou uma Cesta Básica!',
                 'Você atingiu 400 kW este mês e conquistou uma Cesta Básica! Entre em contato com a administração para retirar seu prêmio.',
                 $2)`,
        [userId, JSON.stringify({ reward_type: 'cesta_basica', kw_total: totalKw })]
      );
    }
  }

  // Listar vendas do usuário com filtros
  async listUserSales(userId: string, filters?: {
    status?: string;
    sale_type?: string;
    limit?: number
  }) {
    const status = filters?.status;
    const saleType = filters?.sale_type;
    const limit = filters?.limit || 50;

    let query = `
      SELECT
        s.*,
        p.points,
        p.accumulated_points,
        c.total_commission
      FROM sales s
      LEFT JOIN points p ON s.id = p.sale_id
      LEFT JOIN commissions c ON s.id = c.sale_id
      WHERE s.user_id = $1
    `;

    const params: any[] = [userId];

    if (status) {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }

    if (saleType) {
      params.push(saleType);
      query += ` AND s.sale_type = $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY s.created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Buscar venda por ID
  async getSaleById(saleId: string, userId: string) {
    const result = await pool.query(
      `SELECT
        s.*,
        p.points,
        p.accumulated_points,
        c.sale_commission,
        c.insurance_commission,
        c.total_commission
      FROM sales s
      LEFT JOIN points p ON s.id = p.sale_id
      LEFT JOIN commissions c ON s.id = c.sale_id
      WHERE s.id = $1 AND s.user_id = $2`,
      [saleId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Venda não encontrada');
    }

    return result.rows[0];
  }

  // Buscar venda com dados do cliente
  async getSaleWithClient(saleId: string, userId: string) {
    const result = await pool.query(
      `SELECT
        s.*,
        c.id as client_id,
        c.name as client_full_name,
        c.cpf,
        c.phone,
        c.email,
        c.cep,
        c.street,
        c.number,
        c.complement,
        c.neighborhood,
        c.city,
        c.state,
        p.points,
        p.accumulated_points,
        co.sale_commission,
        co.insurance_commission,
        co.total_commission
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN points p ON s.id = p.sale_id
      LEFT JOIN commissions co ON s.id = co.sale_id
      WHERE s.id = $1 AND s.user_id = $2`,
      [saleId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Venda não encontrada');
    }

    return result.rows[0];
  }

  // Atualizar venda
  async updateSale(saleId: string, userId: string, data: {
    client_name?: string;
    value?: number;
    kilowatts?: number;
    insurance_value?: number;
    sale_type?: 'direct' | 'consortium' | 'cash' | 'card';
    consortium_value?: number;
    consortium_term?: number;
    consortium_monthly_payment?: number;
    consortium_admin_fee?: number;
    status?: string;
    notes?: string;
    product_delivered?: boolean;
    delivery_date?: string;
    installation_proof_url?: string;
  }, userRole?: string) {
    const validStatuses = ['negotiation', 'pending', 'approved', 'financing_denied', 'cancelled', 'delivered'];

    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error('Status inválido');
    }

    // 🔒 SEGURANÇA: Apenas Financeiro, CEO e Admin podem aprovar vendas
    if (data.status === 'approved') {
      // Se userRole não foi fornecido ou não está na lista de permitidos, bloquear
      if (!userRole || !['ceo', 'financeiro', 'admin'].includes(userRole)) {
        throw new Error('❌ Apenas o departamento financeiro, CEO e Admin podem aprovar vendas.');
      }
    }

    // Verificar se a venda pertence ao usuário
    const existingSale = await pool.query(
      'SELECT * FROM sales WHERE id = $1 AND user_id = $2',
      [saleId, userId]
    );

    if (existingSale.rows.length === 0) {
      throw new Error('Venda não encontrada');
    }

    // Montar query dinâmica
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.client_name !== undefined) {
      updates.push(`client_name = $${paramIndex++}`);
      values.push(data.client_name);
    }

    if (data.value !== undefined) {
      updates.push(`value = $${paramIndex++}`);
      values.push(data.value);
    }

    if (data.kilowatts !== undefined) {
      updates.push(`kilowatts = $${paramIndex++}`);
      values.push(data.kilowatts);
    }

    if (data.insurance_value !== undefined) {
      updates.push(`insurance_value = $${paramIndex++}`);
      values.push(data.insurance_value);
    }

    if (data.sale_type !== undefined) {
      updates.push(`sale_type = $${paramIndex++}`);
      values.push(data.sale_type);
    }

    if (data.consortium_value !== undefined) {
      updates.push(`consortium_value = $${paramIndex++}`);
      values.push(data.consortium_value);
    }

    if (data.consortium_term !== undefined) {
      updates.push(`consortium_term = $${paramIndex++}`);
      values.push(data.consortium_term);
    }

    if (data.consortium_monthly_payment !== undefined) {
      updates.push(`consortium_monthly_payment = $${paramIndex++}`);
      values.push(data.consortium_monthly_payment);
    }

    if (data.consortium_admin_fee !== undefined) {
      updates.push(`consortium_admin_fee = $${paramIndex++}`);
      values.push(data.consortium_admin_fee);
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);

      if (data.status === 'approved') {
        updates.push(`closed_at = NOW()`);
      }
    }

    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }

    if (data.product_delivered !== undefined) {
      updates.push(`product_delivered = $${paramIndex++}`);
      values.push(data.product_delivered);
    }

    if (data.delivery_date !== undefined) {
      updates.push(`delivery_date = $${paramIndex++}`);
      values.push(data.delivery_date);
    }

    if (data.installation_proof_url !== undefined) {
      updates.push(`installation_proof_url = $${paramIndex++}`);
      values.push(data.installation_proof_url);
    }

    updates.push(`updated_at = NOW()`);
    values.push(saleId, userId);

    const query = `
      UPDATE sales
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const updatedSale = result.rows[0];

    // 📝 LOG: Venda atualizada
    await logActivity(userId, 'Atualizou venda', {
      sale_id: saleId,
      client_name: updatedSale.client_name,
      updated_fields: Object.keys(data),
      new_status: updatedSale.status,
    });

    // ⚠️ IMPORTANTE: Comissões e pontos são processados EXCLUSIVAMENTE pelo FinancialService
    // A aprovação/rejeição deve ser feita através dos endpoints:
    // - POST /financial/approve/:saleId (para aprovar)
    // - POST /financial/reject/:saleId (para rejeitar)
    // Não processar comissões aqui para evitar duplicação e garantir controle financeiro

    return updatedSale;
  }

  // Deletar venda
  async deleteSale(saleId: string, userId?: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Buscar informações da venda antes de deletar
      const saleInfo = await client.query(
        `SELECT s.id, s.user_id, s.client_name, s.value, s.kilowatts, s.status,
                u.parent_id, u.name as consultant_name
         FROM sales s
         JOIN users u ON u.id = s.user_id
         WHERE s.id = $1`,
        [saleId]
      );

      if (saleInfo.rows.length === 0) {
        throw new Error('Venda não encontrada');
      }

      const saleData = saleInfo.rows[0];
      const pointsToRemove = Math.floor(parseFloat(saleData.kilowatts));

      // Se a venda foi aprovada/delivered, remover pontos
      if (saleData.status === 'approved' || saleData.status === 'delivered') {
        console.log(`🗑️ Removendo pontos da venda ${saleId}: ${pointsToRemove} pontos`);
        
        // 1️⃣ Remover pontos PESSOAIS do consultor
        await client.query(
          `UPDATE users 
           SET personal_points = GREATEST(0, personal_points - $1),
               points = GREATEST(0, points - $1)
           WHERE id = $2`,
          [pointsToRemove, saleData.user_id]
        );
        console.log(`✅ Removidos ${pointsToRemove} pontos pessoais de ${saleData.consultant_name}`);
        
        // 2️⃣ Se tinha líder, remover pontos DE EQUIPE do líder
        if (saleData.parent_id) {
          await client.query(
            `UPDATE users 
             SET team_points = GREATEST(0, team_points - $1),
                 points = GREATEST(0, points - $1)
             WHERE id = $2`,
            [pointsToRemove, saleData.parent_id]
          );
          
          const leaderName = await client.query(
            'SELECT name FROM users WHERE id = $1',
            [saleData.parent_id]
          );
          console.log(`✅ Removidos ${pointsToRemove} pontos de equipe do líder ${leaderName.rows[0]?.name}`);
        }
        
        // 3️⃣ Recalcular níveis do consultor
        const consultantPoints = await client.query(
          'SELECT points FROM users WHERE id = $1',
          [saleData.user_id]
        );
        const newConsultantPoints = parseFloat(consultantPoints.rows[0]?.points || 0);
        
        try {
          const { LevelService } = require('../levels/level.service');
          const levelService = new LevelService();
          await levelService.checkLevelUp(saleData.user_id, newConsultantPoints, client);
        } catch (levelError: any) {
          console.error(`❌ Erro ao recalcular nível do consultor: ${levelError.message}`);
        }
        
        // 4️⃣ Recalcular níveis do líder (se houver)
        if (saleData.parent_id) {
          const leaderPoints = await client.query(
            'SELECT points FROM users WHERE id = $1',
            [saleData.parent_id]
          );
          const newLeaderPoints = parseFloat(leaderPoints.rows[0]?.points || 0);
          
          try {
            const { LevelService } = require('../levels/level.service');
            const levelService = new LevelService();
            await levelService.checkLevelUp(saleData.parent_id, newLeaderPoints, client);
          } catch (levelError: any) {
            console.error(`❌ Erro ao recalcular nível do líder: ${levelError.message}`);
          }
        }
      }

      // 5️⃣ Deletar registros da tabela points
      await client.query(
        'DELETE FROM points WHERE sale_id = $1 OR source_id = $1::text',
        [saleId]
      );

      // 6️⃣ Deletar comissões
      await client.query('DELETE FROM personal_commissions WHERE sale_id = $1', [saleId]);
      await client.query('DELETE FROM network_commissions WHERE sale_id = $1', [saleId]);

      // 7️⃣ Deletar a venda
      await client.query('DELETE FROM sales WHERE id = $1', [saleId]);

      await client.query('COMMIT');

      // 📝 LOG: Venda deletada
      await logActivity(userId || saleData.user_id, 'Removeu venda', {
        sale_id: saleId,
        client_name: saleData.client_name,
        value: saleData.value,
        kilowatts: saleData.kilowatts,
        points_removed: pointsToRemove,
      });

      console.log(`✅ Venda ${saleId} deletada com sucesso! Total de pontos removidos: ${pointsToRemove}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao deletar venda:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Estatísticas de vendas
  async getSalesStats(userId: string) {
    const result = await pool.query(
      `SELECT
        COUNT(*)::int as total_sales,
        COALESCE(SUM(value), 0) as total_value,
        COALESCE(SUM(kilowatts), 0) as total_kilowatts,
        COUNT(CASE WHEN status = 'approved' THEN 1 END)::int as approved_sales,
        COUNT(CASE WHEN status = 'negotiation' THEN 1 END)::int as negotiation_sales,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending_sales,
        COUNT(CASE WHEN status = 'financing_denied' THEN 1 END)::int as denied_sales,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END)::int as delivered_sales,
        COUNT(CASE WHEN sale_type = 'consortium' THEN 1 END)::int as consortium_sales,
        COUNT(CASE WHEN sale_type = 'direct' THEN 1 END)::int as direct_sales,
        COUNT(CASE WHEN sale_type = 'cash' THEN 1 END)::int as cash_sales,
        COUNT(CASE WHEN sale_type = 'card' THEN 1 END)::int as card_sales,
        COALESCE(SUM(CASE WHEN sale_type = 'consortium' THEN consortium_value END), 0) as total_consortium_value
      FROM sales
      WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }

  // ✅ NOVO MÉTODO - Dados para gráficos
  async getChartData(userId: string) {
    const client = await pool.connect();

    try {
      // Vendas por mês (últimos 12 meses)
      const monthlyResult = await client.query(
        `SELECT
          DATE_TRUNC('month', created_at)::date as month,
          COUNT(*) as count
        FROM sales
        WHERE user_id = $1
          AND created_at >= NOW() - INTERVAL '12 months'
          AND status != 'cancelled'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC`,
        [userId]
      );

      // Vendas por status
      const statusResult = await client.query(
        `SELECT
          status as name,
          COUNT(*) as count
        FROM sales
        WHERE user_id = $1
        GROUP BY status`,
        [userId]
      );

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      // Formatar dados mensais
      const monthlyData = monthlyResult.rows.map((row: any) => {
        const date = new Date(row.month);
        const monthIndex = date.getMonth();

        return {
          month: monthNames[monthIndex],
          count: parseInt(row.count),
        };
      });

      // Formatar dados de status
      const statusData = statusResult.rows.map((row: any) => ({
        name: this.formatStatusName(row.name),
        count: parseInt(row.count),
      }));

      return {
        monthly: monthlyData,
        byStatus: statusData,
      };
    } finally {
      client.release();
    }
  }

  // ✅ NOVO MÉTODO - Formatar nomes de status em Português
  private formatStatusName(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendente',
      'completed': 'Concluída',
      'cancelled': 'Cancelada',
      'negotiation': 'Negociação',
      'financing_denied': 'Financiamento Negado',
      'approved': 'Aprovada',
      'delivered': 'Entregue',
    };

    return statusMap[status] || status;
  }

  // Dados para gráficos (mantido para compatibilidade)
  async getSalesChartData(userId: string) {
    const monthlyResult = await pool.query(
      `SELECT
        TO_CHAR(created_at, 'Mon') as month,
        COUNT(*)::int as count,
        COALESCE(SUM(value), 0) as total
      FROM sales
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
      ORDER BY EXTRACT(MONTH FROM created_at)`,
      [userId]
    );

    const statusResult = await pool.query(
      `SELECT
        status,
        COUNT(*)::int as count
      FROM sales
      WHERE user_id = $1
      GROUP BY status`,
      [userId]
    );

    const typeResult = await pool.query(
      `SELECT
        sale_type,
        COUNT(*)::int as count,
        COALESCE(SUM(value), 0) as total_value
      FROM sales
      WHERE user_id = $1
      GROUP BY sale_type`,
      [userId]
    );

    return {
      monthly: monthlyResult.rows,
      byStatus: statusResult.rows,
      byType: typeResult.rows,
    };
  }
}

export const salesService = new SalesService();
