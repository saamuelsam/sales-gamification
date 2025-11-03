import { Request, Response } from 'express';
import { SalesService } from './sales.service';
import { ApiResponse } from '../../utils/responses';
import { pool } from '../../config/database';

const salesService = new SalesService();

export class SalesController {
  async createSale(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

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

      if (!client_name || value == null || kilowatts == null) {
        return ApiResponse.error(res, 'Nome do cliente, valor e kilowatts são obrigatórios', 400);
      }

      if (sale_type === 'consortium') {
        if (!consortium_value || !consortium_term) {
          return ApiResponse.error(res, 'Consórcio requer consortium_value e consortium_term obrigatórios', 400);
        }
      }

      if (sale_type && !['direct', 'consortium', 'cash', 'card'].includes(sale_type)) {
        return ApiResponse.error(res, "Tipo de venda inválido. Use: direct, consortium, cash ou card", 400);
      }

      const numericValue = Number(value);
      const numericKw = Number(kilowatts);
      const numericInsurance = insurance_value != null ? Number(insurance_value) : undefined;
      const numericConsortiumValue = consortium_value != null ? Number(consortium_value) : undefined;
      const numericConsortiumTerm = consortium_term != null ? Number(consortium_term) : undefined;
      const numericConsortiumMonthly = consortium_monthly_payment != null ? Number(consortium_monthly_payment) : undefined;
      const numericConsortiumFee = consortium_admin_fee != null ? Number(consortium_admin_fee) : undefined;

      if (!Number.isFinite(numericValue) || !Number.isFinite(numericKw)) {
        return ApiResponse.error(res, 'Valor e kilowatts devem ser numéricos', 400);
      }

      if (numericValue <= 0 || numericKw <= 0) {
        return ApiResponse.error(res, 'Valor e kilowatts devem ser maiores que zero', 400);
      }

      if (sale_type === 'consortium') {
        if (!Number.isFinite(numericConsortiumValue!) || numericConsortiumValue! <= 0) {
          return ApiResponse.error(res, 'Valor do consórcio deve ser numérico e maior que zero', 400);
        }

        if (!Number.isFinite(numericConsortiumTerm!) || numericConsortiumTerm! <= 0) {
          return ApiResponse.error(res, 'Prazo do consórcio deve ser numérico e maior que zero', 400);
        }

        if (numericConsortiumTerm! > 120) {
          return ApiResponse.error(res, 'Prazo do consórcio não pode exceder 120 meses', 400);
        }
      }

      const result = await salesService.createSale(userId, {
        client_id,
        client_name,
        value: numericValue,
        kilowatts: numericKw,
        insurance_value: numericInsurance,
        sale_type: sale_type as 'direct' | 'consortium' | 'cash' | 'card' | undefined,
        consortium_value: numericConsortiumValue,
        consortium_term: numericConsortiumTerm,
        consortium_monthly_payment: numericConsortiumMonthly,
        consortium_admin_fee: numericConsortiumFee,
        template_type,
        notes,
      });

      return ApiResponse.created(res, result, 'Venda registrada com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao registrar venda';
      return ApiResponse.error(res, message, 500);
    }
  }

  async listSales(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const { status, sale_type, limit } = req.query;
      const parsedLimit = typeof limit === 'string' ? Number(limit) : undefined;

      if (parsedLimit !== undefined && (!Number.isFinite(parsedLimit) || parsedLimit <= 0)) {
        return ApiResponse.error(res, 'Parâmetro limit inválido', 400);
      }

      if (sale_type && typeof sale_type === 'string') {
        if (!['direct', 'consortium', 'cash', 'card'].includes(sale_type)) {
          return ApiResponse.error(res, 'Tipo de venda inválido', 400);
        }
      }

      const sales = await salesService.listUserSales(userId, {
        status: typeof status === 'string' ? status : undefined,
        sale_type: typeof sale_type === 'string' ? sale_type : undefined,
        limit: parsedLimit,
      });

      return ApiResponse.success(res, sales, 'Vendas listadas com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao listar vendas';
      return ApiResponse.error(res, message, 500);
    }
  }

  async getSale(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const { id } = req.params;

      if (!id) {
        return ApiResponse.error(res, 'ID da venda obrigatório', 400);
      }

      const sale = await salesService.getSaleById(id, userId);
      return ApiResponse.success(res, sale, 'Venda encontrada');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar venda';
      return ApiResponse.error(res, message, 404);
    }
  }

  async getSaleWithClient(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const { id } = req.params;

      if (!id) {
        return ApiResponse.error(res, 'ID da venda obrigatório', 400);
      }

      const sale = await salesService.getSaleWithClient(id, userId);
      return ApiResponse.success(res, sale, 'Venda com dados do cliente');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar venda';
      return ApiResponse.error(res, message, 404);
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
        return ApiResponse.error(res, 'ID da venda obrigatório', 400);
      }

      if (!status) {
        return ApiResponse.error(res, 'Status obrigatório', 400);
      }

      const sale = await salesService.updateSale(id, userId, { status });
      return ApiResponse.success(res, sale, 'Status atualizado com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar status';
      return ApiResponse.error(res, message, 500);
    }
  }

  async updateSale(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const { id } = req.params;

      if (!id) {
        return ApiResponse.error(res, 'ID da venda obrigatório', 400);
      }

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

      if (sale_type && !['direct', 'consortium', 'cash', 'card'].includes(sale_type)) {
        return ApiResponse.error(res, "Tipo de venda inválido. Use: direct, consortium, cash ou card", 400);
      }

      if (sale_type === 'consortium') {
        if (consortium_value == null || consortium_term == null) {
          return ApiResponse.error(res, 'Ao mudar para consórcio, informe consortium_value e consortium_term', 400);
        }
      }

      const updateData: any = {};

      if (client_name !== undefined) updateData.client_name = client_name;

      if (value !== undefined) {
        const numValue = Number(value);
        if (!Number.isFinite(numValue) || numValue <= 0) {
          return ApiResponse.error(res, 'Valor deve ser numérico e maior que zero', 400);
        }
        updateData.value = numValue;
      }

      if (kilowatts !== undefined) {
        const numKw = Number(kilowatts);
        if (!Number.isFinite(numKw) || numKw <= 0) {
          return ApiResponse.error(res, 'Kilowatts deve ser numérico e maior que zero', 400);
        }
        updateData.kilowatts = numKw;
      }

      if (insurance_value !== undefined) updateData.insurance_value = insurance_value ? Number(insurance_value) : null;
      if (sale_type !== undefined) updateData.sale_type = sale_type;
      if (consortium_value !== undefined) updateData.consortium_value = consortium_value ? Number(consortium_value) : null;
      if (consortium_term !== undefined) updateData.consortium_term = consortium_term ? Number(consortium_term) : null;
      if (consortium_monthly_payment !== undefined) updateData.consortium_monthly_payment = consortium_monthly_payment ? Number(consortium_monthly_payment) : null;
      if (consortium_admin_fee !== undefined) updateData.consortium_admin_fee = consortium_admin_fee ? Number(consortium_admin_fee) : null;
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (product_delivered !== undefined) updateData.product_delivered = product_delivered;
      if (delivery_date !== undefined) (updateData.delivery_date);
      return ApiResponse.success(res, sale, 'Venda atualizada com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar venda';
      return ApiResponse.error(res, message, 500);
    }
  }

  async deleteSale(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!id || !userId) {
        return ApiResponse.error(res, 'ID e usuário são obrigatórios', 400);
      }

      await client.query('BEGIN');

      const saleResult = await client.query(
        `SELECT kilowatts FROM sales WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      const sale = saleResult.rows[0];
      if (!sale) {
        await client.query('ROLLBACK');
        await client.release();
        return ApiResponse.error(res, 'Venda não encontrada', 404);
      }

      const pointsToRemove = Math.floor(parseFloat(sale.kilowatts));

      await client.query(
        `DELETE FROM sales WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      await client.query(
        `UPDATE users 
         SET points = GREATEST(0, points - $1) 
         WHERE id = $2`,
        [pointsToRemove, userId]
      );

      console.log(`🗑️ Venda ${id} deletada! ${pointsToRemove} pontos removidos`);

      const userPointsResult = await client.query(
        `SELECT points FROM users WHERE id = $1`,
        [userId]
      );

      const newTotalPoints = parseFloat(userPointsResult.rows[0].points);

      if (newTotalPoints < 1000) {
        await client.query(
          `UPDATE users SET role = 'consultant' WHERE id = $1`,
          [userId]
        );
        console.log(`⬇️ Usuário ${userId} voltou para Consultant (${newTotalPoints} pontos)`);
      }

      await client.query('COMMIT');

      return ApiResponse.success(res, { 
        id, 
        pointsRemoved: pointsToRemove,
        newPoints: newTotalPoints 
      }, 'Venda deletada com sucesso');
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Erro ao deletar venda:', error);
      return ApiResponse.error(res, error.message || 'Erro ao deletar venda', 500);
    } finally {
      await client.release();
    }
  }

  // ✅ MÉTODOS PARA ESTATÍSTICAS E GRÁFICOS

  async getStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const stats = await salesService.getSalesStats(userId);
      return ApiResponse.success(res, stats, 'Estatísticas obtidas');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao obter estatísticas';
      return ApiResponse.error(res, message, 500);
    }
  }

  // ✅ NOVO MÉTODO - Dados de gráficos
  async getChartData(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const chartData = await salesService.getChartData(userId);
      return ApiResponse.success(res, chartData, 'Dados de gráficos carregados');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar dados de gráficos';
      return ApiResponse.error(res, message, 500);
    }
  }

  // Método legado mantido para compatibilidade
  async getSalesChartData(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const data = await salesService.getSalesChartData(userId);
      return ApiResponse.success(res, data, 'Dados do gráfico obtidos');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao obter dados';
      return ApiResponse.error(res, message, 500);
    }
  }
}

export const salesController = new SalesController();
