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

      // 1. Inserir venda
      const saleResult = await client.query(
        `INSERT INTO sales (
          user_id, client_id, client_name, value, kilowatts,
          insurance_value, sale_type, consortium_value, consortium_term,
          consortium_monthly_payment, consortium_admin_fee,
          template_type, notes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'negotiation')
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

      // 2. Calcular pontos SEMPRE pelos kW (1 kW = 1 ponto)
      const points = data.kilowatts;

      // 3. Buscar pontos acumulados
      const currentPointsResult = await client.query(
        'SELECT COALESCE(MAX(accumulated_points), 0) as total FROM points WHERE user_id = $1',
        [userId]
      );
      const currentPoints = parseFloat(currentPointsResult.rows[0].total);
      const newAccumulatedPoints = currentPoints + points;

      // 4. Registrar pontos com descrição específica por tipo
      const description =
        data.sale_type === 'consortium' ? `Consórcio: ${data.client_name}` :
          data.sale_type === 'cash' ? `Venda à vista: ${data.client_name}` :
            data.sale_type === 'card' ? `Venda no cartão: ${data.client_name}` :
              `Venda: ${data.client_name}`;

      await client.query(
        `INSERT INTO points (user_id, sale_id, points, accumulated_points, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, sale.id, points, newAccumulatedPoints, description]
      );

      // 5. Buscar nível do usuário
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

      // 6. Calcular comissões
      let saleCommission = 0;
      let insuranceCommissionValue = 0;

      if (data.sale_type === 'consortium') {
        // CONSÓRCIO: 5% sobre consortium_value, SEM comissão de seguro
        if (data.consortium_value) {
          saleCommission = (data.consortium_value * 5.0) / 100;
        }
        insuranceCommissionValue = 0;
      } else {
        // VENDA NORMAL (direct, cash, card): usar comissão do nível do usuário
        const personalCommission = parseFloat(level.personal_commission);
        saleCommission = (data.value * personalCommission) / 100;

        // Comissão de seguro (se tiver)
        if (data.insurance_value) {
          const insuranceCommission = parseFloat(level.insurance_commission);
          insuranceCommissionValue = (data.insurance_value * insuranceCommission) / 100;
        }
      }

      const totalCommission = saleCommission + insuranceCommissionValue;

      // 7. Registrar comissão
      await client.query(
        `INSERT INTO commissions (
          user_id, sale_id, sale_commission,
          insurance_commission, total_commission
        ) VALUES ($1, $2, $3, $4, $5)`,
        [userId, sale.id, saleCommission, insuranceCommissionValue, totalCommission]
      );

      // 8. ATUALIZAR CONTADORES MENSAIS
      await monthlyTargetService.updateUserMonthlyStats(userId, data.kilowatts);

      // 9. Atualizar pontos do usuário (1 ponto por kW)
      const pointsEarned = Math.floor(data.kilowatts);
      await client.query(
        `UPDATE users SET points = points + $1 WHERE id = $2`,
        [pointsEarned, userId]
      );

      await client.query('COMMIT');

      // ✅ Verificar promoção de nível APÓS commit (evita deadlocks)
      await levelService.checkLevelUp(userId, newAccumulatedPoints, client);

      // 📝 LOG: Venda criada
      await logActivity(userId, 'Registrou nova venda', {
        sale_id: sale.id,
        client_name: data.client_name,
        value: data.value,
        kilowatts: data.kilowatts,
        sale_type: data.sale_type || 'direct',
        points_earned: points,
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
        points: {
          earned: points,
          accumulated: newAccumulatedPoints,
        },
        commission: {
          sale: saleCommission,
          insurance: insuranceCommissionValue,
          total: totalCommission,
        },
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
  }) {
    const validStatuses = ['negotiation', 'pending', 'approved', 'financing_denied', 'cancelled', 'delivered'];

    if (data.status && !validStatuses.includes(data.status)) {
      throw new Error('Status inválido');
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

    // 🟢 Se a venda foi aprovada, gerar comissões (pessoal + rede)
    if (updatedSale.status === 'approved') {
      console.log(`\n🎯 STATUS MUDOU PARA 'APPROVED' - Processando comissões para venda ${updatedSale.id}`);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // 💵 1. Comissão pessoal
        console.log(`  1️⃣ Chamando processPersonalCommission(${updatedSale.user_id}, ${updatedSale.value}, ${updatedSale.kilowatts}, ${updatedSale.id})`);
        
        await this.commissionService.processPersonalCommission(
          updatedSale.user_id,   // ID do vendedor
          updatedSale.value,     // Valor da venda
          updatedSale.kilowatts, // Pontos / kW
          updatedSale.id         // ID da venda
        );

        console.log(`  ✅ Comissão pessoal gerada para venda ${updatedSale.id}`);

        // 🌐 2. Comissão de rede
        console.log(`  2️⃣ Chamando processNetworkCommission(${updatedSale.user_id}, ${updatedSale.value}, ${updatedSale.kilowatts}, ${updatedSale.id})`);

        await this.commissionService.processNetworkCommission(
          updatedSale.user_id,   // ID do vendedor
          updatedSale.value,     // Valor da venda
          updatedSale.kilowatts, // Pontos / kW
          updatedSale.id         // ID da venda
        );

        console.log(`  ✅ Comissão de rede gerada para venda ${updatedSale.id}`);

        // 📝 LOG: Venda aprovada
        await logActivity(updatedSale.user_id, 'Venda aprovada', {
          sale_id: updatedSale.id,
          client_name: updatedSale.client_name,
          value: updatedSale.value,
          kilowatts: updatedSale.kilowatts,
        });

        // ✅ Verificar promoção automática após aprovar venda
        const userPointsResult = await client.query(
          `SELECT points FROM users WHERE id = $1`,
          [updatedSale.user_id]
        );
        const currentPoints = parseFloat(userPointsResult.rows[0]?.points || 0);
        await levelService.checkLevelUp(updatedSale.user_id, currentPoints, client);

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao gerar comissões:', error);
        console.error('STACK:', error instanceof Error ? error.stack : 'sem stack');
      } finally {
        client.release();
      }

      // ✅ Verificar promoção automática após aprovar venda
      try {
        const userPointsResult = await pool.query(
          `SELECT points FROM users WHERE id = $1`,
          [updatedSale.user_id]
        );
        const currentPoints = parseFloat(userPointsResult.rows[0]?.points || 0);
        await levelService.checkLevelUp(updatedSale.user_id, currentPoints, pool as any);
      } catch (error) {
        console.warn('⚠️ Erro ao verificar promoção após aprovação:', error instanceof Error ? error.message : error);
      }
    }

    return updatedSale;
  }

  // Deletar venda
  async deleteSale(saleId: string, userId?: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Buscar informações da venda antes de deletar
      const saleInfo = await client.query(
        'SELECT user_id, client_name, value, kilowatts FROM sales WHERE id = $1',
        [saleId]
      );

      const saleData = saleInfo.rows[0];

      // 1️⃣ Deletar pontos associados à venda
      await client.query(
        'DELETE FROM points WHERE sale_id = $1',
        [saleId]
      );

      // 2️⃣ Deletar a venda
      const result = await client.query(
        'DELETE FROM sales WHERE id = $1 RETURNING id',
        [saleId]
      );

      await client.query('COMMIT');

      // 📝 LOG: Venda deletada
      if (saleData) {
        await logActivity(userId || saleData.user_id, 'Removeu venda', {
          sale_id: saleId,
          client_name: saleData.client_name,
          value: saleData.value,
          kilowatts: saleData.kilowatts,
        });
      }

      if (result.rows.length === 0) {
        throw new Error('Venda não encontrada');
      }

      console.log('✅ Venda e pontos deletados:', saleId);
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
