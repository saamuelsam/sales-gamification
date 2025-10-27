import { pool } from '../../config/database';

interface CreateSaleData {
  client_name: string;
  client_id?: string;
  value: number;
  kilowatts: number;
  insurance_value?: number;
  template_type?: string;
  notes?: string;
}

export class SalesService {
  // Criar nova venda (VERSÃO ATUALIZADA)
  async createSale(userId: string, data: CreateSaleData & { client_id?: string }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const saleResult = await client.query(
        `INSERT INTO sales (
           user_id, client_id, client_name, value, kilowatts, 
           insurance_value, template_type, notes, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'negotiation')
         RETURNING *`,
        [
          userId,
          data.client_id || null,
          data.client_name,
          data.value,
          data.kilowatts,
          data.insurance_value || null,
          data.template_type || null,
          data.notes || null,
        ]
      );

      const sale = saleResult.rows[0];

      // 2. Calcular pontos (1 kW = 1 ponto)
      const points = data.kilowatts;

      // 3. Buscar pontos acumulados do usuário
      const currentPointsResult = await client.query(
        'SELECT COALESCE(MAX(accumulated_points), 0) as total FROM points WHERE user_id = $1',
        [userId]
      );
      const currentPoints = parseFloat(currentPointsResult.rows[0].total);
      const newAccumulatedPoints = currentPoints + points;

      // 4. Registrar pontos
      await client.query(
        `INSERT INTO points (user_id, sale_id, points, accumulated_points, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, sale.id, points, newAccumulatedPoints, `Venda: ${data.client_name}`]
      );

      // 5. Buscar nível do usuário
      const userResult = await client.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );
      const userRole = userResult.rows[0].role;

      // 6. Buscar comissões do nível do usuário
      const levelResult = await client.query(
        `SELECT personal_commission, insurance_commission 
         FROM levels 
         WHERE phase_number = (
           CASE 
             WHEN $1 = 'consultant' THEN 1
             WHEN $1 = 'master_consultant' THEN 2
             ELSE 1
           END
         )`,
        [userRole]
      );

      const level = levelResult.rows[0];
      const personalCommission = parseFloat(level.personal_commission);
      const insuranceCommission = parseFloat(level.insurance_commission);

      // 7. Calcular comissões
      const saleCommission = (data.value * personalCommission) / 100;
      const insuranceCommissionValue = data.insurance_value
        ? (data.insurance_value * insuranceCommission) / 100
        : 0;
      const totalCommission = saleCommission + insuranceCommissionValue;

      // 8. Registrar comissão
      await client.query(
        `INSERT INTO commissions (
           user_id, sale_id, sale_commission, 
           insurance_commission, total_commission
         ) VALUES ($1, $2, $3, $4, $5)`,
        [userId, sale.id, saleCommission, insuranceCommissionValue, totalCommission]
      );

      await client.query('COMMIT');

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

  // Listar vendas do usuário
  async listUserSales(userId: string, filters?: { status?: string; limit?: number }) {
    const status = filters?.status;
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
      query += ' AND s.status = $2';
      params.push(status);
    }

    query += ' ORDER BY s.created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

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

  // Atualizar venda
  async updateSale(saleId: string, userId: string, data: {
    client_name?: string;
    value?: number;
    kilowatts?: number;
    insurance_value?: number;
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

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);

      // Se status = approved, atualizar closed_at
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

  // Deletar venda
  async deleteSale(saleId: string, userId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar se a venda pertence ao usuário
      const checkResult = await client.query(
        'SELECT id FROM sales WHERE id = $1 AND user_id = $2',
        [saleId, userId]
      );

      if (checkResult.rows.length === 0) {
        throw new Error('Venda não encontrada');
      }

      // Deletar pontos relacionados
      await client.query('DELETE FROM points WHERE sale_id = $1', [saleId]);

      // Deletar comissões relacionadas
      await client.query('DELETE FROM commissions WHERE sale_id = $1', [saleId]);

      // Deletar venda
      await client.query('DELETE FROM sales WHERE id = $1', [saleId]);

      await client.query('COMMIT');

      return { success: true, message: 'Venda excluída com sucesso' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ========== NOVOS MÉTODOS PARA ESTATÍSTICAS E GRÁFICOS ==========

  // Obter estatísticas gerais de vendas
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
        COUNT(CASE WHEN status = 'delivered' THEN 1 END)::int as delivered_sales
      FROM sales 
      WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }

  // Obter dados para gráficos
  async getSalesChartData(userId: string) {
    // Vendas por mês (últimos 6 meses)
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

    // Vendas por status
    const statusResult = await pool.query(
      `SELECT 
        status,
        COUNT(*)::int as count
      FROM sales 
      WHERE user_id = $1
      GROUP BY status`,
      [userId]
    );

    return {
      monthly: monthlyResult.rows,
      byStatus: statusResult.rows,
    };
  }
}
