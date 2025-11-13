import { Request, Response } from 'express';
import { SalesService } from './sales.service';
import { ApiResponse } from '../../utils/responses';
import { pool } from '../../config/database';
import { levelService } from '../levels/level.service';


const salesService = new SalesService();

export class SalesController {
  /**
   * ✅ Criação de nova venda
   */
  async createSale(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const {
        client_id,
        client_name,
        value,
        kilowatts,
        insurance_value,
        sale_type,
        consortium_value,
        consortium_term,
        consortium_monthly_payment,
        consortium_admin_fee,
        template_type,
        notes,
      } = req.body;

      if (!client_name || value == null || kilowatts == null)
        return ApiResponse.error(res, 'Nome do cliente, valor e kilowatts são obrigatórios', 400);

      if (sale_type && !['direct', 'consortium', 'cash', 'card'].includes(sale_type))
        return ApiResponse.error(res, 'Tipo de venda inválido. Use: direct, consortium, cash ou card', 400);

      // 🔹 Normaliza os valores numéricos
      const numericValue = Number(value);
      const numericKw = Number(kilowatts);
      const numericInsurance = insurance_value ? Number(insurance_value) : null;
      const numericConsortiumValue = consortium_value ? Number(consortium_value) : null;
      const numericConsortiumTerm = consortium_term ? Number(consortium_term) : null;
      const numericConsortiumMonthly = consortium_monthly_payment ? Number(consortium_monthly_payment) : null;
      const numericConsortiumFee = consortium_admin_fee ? Number(consortium_admin_fee) : null;

      if (!Number.isFinite(numericValue) || numericValue <= 0)
        return ApiResponse.error(res, 'Valor deve ser numérico e maior que zero', 400);

      if (!Number.isFinite(numericKw) || numericKw <= 0)
        return ApiResponse.error(res, 'Kilowatts deve ser numérico e maior que zero', 400);

      // 🔹 Validação de consórcio
      if (sale_type === 'consortium') {
        if (!numericConsortiumValue || !numericConsortiumTerm)
          return ApiResponse.error(res, 'Consórcio requer consortium_value e consortium_term', 400);
        if (numericConsortiumTerm > 120)
          return ApiResponse.error(res, 'Prazo do consórcio não pode exceder 120 meses', 400);
      }

      const result = await salesService.createSale(userId, {
        client_id,
        client_name,
        value: numericValue,
        kilowatts: numericKw,
        insurance_value: numericInsurance ?? undefined,
        sale_type: sale_type as 'direct' | 'consortium' | 'cash' | 'card' | undefined,
        consortium_value: numericConsortiumValue ?? undefined,
        consortium_term: numericConsortiumTerm ?? undefined,
        consortium_monthly_payment: numericConsortiumMonthly ?? undefined,
        consortium_admin_fee: numericConsortiumFee ?? undefined,
        template_type,
        notes,
      });

      return ApiResponse.created(res, result, 'Venda registrada com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao registrar venda', 500);
    }
  }

  /**
   * ✅ Atualiza o status da venda
   * ⚠️ Comissões são processadas automaticamente no sales.service.ts
   */
  async updateStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const { id } = req.params;
      const { status } = req.body;

      if (!id) return ApiResponse.error(res, 'ID da venda obrigatório', 400);
      if (!status) return ApiResponse.error(res, 'Status obrigatório', 400);

      // Atualiza status da venda (comissões processadas no service)
      const sale = await salesService.updateSale(id, userId, { status });

      return ApiResponse.success(res, sale, 'Status atualizado com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao atualizar status', 500);
    }
  }

  /**
   * ✅ Atualiza dados gerais da venda
   * ⚠️ Comissões são processadas automaticamente no sales.service.ts
   */
  async updateSale(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const { id } = req.params;
      if (!id) return ApiResponse.error(res, 'ID da venda obrigatório', 400);

      const {
        client_name,
        value,
        kilowatts,
        insurance_value,
        sale_type,
        consortium_value,
        consortium_term,
        consortium_monthly_payment,
        consortium_admin_fee,
        status,
        notes,
        product_delivered,
        delivery_date,
        installation_proof_url,
      } = req.body;

      if (sale_type && !['direct', 'consortium', 'cash', 'card'].includes(sale_type))
        return ApiResponse.error(res, 'Tipo de venda inválido', 400);

      const updateData: Record<string, any> = {};

      if (client_name !== undefined) updateData.client_name = client_name;
      if (value !== undefined) {
        const val = Number(value);
        if (!Number.isFinite(val) || val <= 0) return ApiResponse.error(res, 'Valor deve ser positivo', 400);
        updateData.value = val;
      }
      if (kilowatts !== undefined) {
        const kw = Number(kilowatts);
        if (!Number.isFinite(kw) || kw <= 0) return ApiResponse.error(res, 'Kilowatts deve ser positivo', 400);
        updateData.kilowatts = kw;
      }

      Object.assign(updateData, {
        insurance_value: insurance_value ? Number(insurance_value) : null,
        sale_type,
        consortium_value: consortium_value ? Number(consortium_value) : null,
        consortium_term: consortium_term ? Number(consortium_term) : null,
        consortium_monthly_payment: consortium_monthly_payment ? Number(consortium_monthly_payment) : null,
        consortium_admin_fee: consortium_admin_fee ? Number(consortium_admin_fee) : null,
        notes,
        status,
        product_delivered,
        delivery_date,
        installation_proof_url,
      });

      // Atualiza venda (comissões processadas no service)
      const updatedSale = await salesService.updateSale(id, userId, updateData);

      return ApiResponse.success(res, updatedSale, 'Venda atualizada com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao atualizar venda', 500);
    }
  }

  /**
   * ✅ Listagem, busca, gráficos e estatísticas
   */
  async listSales(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const { status, sale_type, limit } = req.query;
      const parsedLimit = limit ? Number(limit) : undefined;

      const sales = await salesService.listUserSales(userId, {
        status: status as string,
        sale_type: sale_type as string,
        limit: parsedLimit,
      });

      return ApiResponse.success(res, sales, 'Vendas listadas com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao listar vendas', 500);
    }
  }

  async getSale(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const { id } = req.params;
      const sale = await salesService.getSaleById(id, userId);

      return ApiResponse.success(res, sale, 'Venda encontrada');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar venda', 404);
    }
  }

  async getSaleWithClient(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const { id } = req.params;
      const sale = await salesService.getSaleWithClient(id, userId);

      return ApiResponse.success(res, sale, 'Venda com dados do cliente');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar venda', 404);
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const stats = await salesService.getSalesStats(userId);
      return ApiResponse.success(res, stats, 'Estatísticas obtidas');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao obter estatísticas', 500);
    }
  }

  async getChartData(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return ApiResponse.error(res, 'Usuário não autenticado', 401);

      const chartData = await salesService.getChartData(userId);
      return ApiResponse.success(res, chartData, 'Dados de gráficos carregados');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar dados de gráficos', 500);
    }
  }

  async deleteSale(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!id || !userId) return ApiResponse.error(res, 'ID e usuário são obrigatórios', 400);

    await client.query('BEGIN');

    const sale = await client.query(
      `SELECT kilowatts, client_name, value FROM sales WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (sale.rows.length === 0) {
      await client.query('ROLLBACK');
      return ApiResponse.error(res, 'Venda não encontrada', 404);
    }

    const saleData = sale.rows[0];
    const pointsToRemove = Math.floor(parseFloat(saleData.kilowatts));
    
    await client.query(`DELETE FROM personal_commissions WHERE sale_id = $1`, [id]);
    await client.query(`DELETE FROM network_commissions WHERE sale_id = $1`, [id]);
    await client.query(`DELETE FROM sales WHERE id = $1 AND user_id = $2`, [id, userId]);
    
    await client.query(
      `UPDATE users SET points = GREATEST(0, points - $1) WHERE id = $2`,
      [pointsToRemove, userId]
    );

    // ✅ ADICIONAR AQUI: Recalcular nível após remover pontos
    const userResult = await client.query(
      `SELECT points FROM users WHERE id = $1`,
      [userId]
    );
    const newPoints = parseFloat(userResult.rows[0]?.points || 0);

    // Importar no topo: import { levelService } from '../levels/level.service';
    await levelService.checkLevelUp(userId, newPoints, client);

    await client.query('COMMIT');
    console.log(`🗑️ Venda ${id} deletada! ${pointsToRemove} pontos removidos. Novo total: ${newPoints} pontos`);

    // 📝 LOG: Venda deletada
    const { logActivity } = require('../../utils/activityLogger');
    await logActivity(userId, 'Removeu venda', {
      sale_id: id,
      client_name: saleData.client_name,
      value: saleData.value,
      kilowatts: saleData.kilowatts,
      points_removed: pointsToRemove,
    });

    return ApiResponse.success(res, { id, pointsRemoved: pointsToRemove, newPoints }, 'Venda deletada com sucesso');
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Erro ao deletar venda:', error);
    return ApiResponse.error(res, error.message || 'Erro ao deletar venda', 500);
  } finally {
    client.release();
  }
}

}

export const salesController = new SalesController();
