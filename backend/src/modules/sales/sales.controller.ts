import { Request, Response } from 'express';
import { SalesService } from './sales.service';
import { ApiResponse } from '../../utils/responses';

const salesService = new SalesService();

export class SalesController {
  async createSale(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const {
        client_id,
        client_name,
        value,
        kilowatts,
        insurance_value,
        template_type,
        notes,
      } = req.body;

      // Validações
      if (!client_name || !value || !kilowatts) {
        return ApiResponse.error(res, 'Nome do cliente, valor e kilowatts são obrigatórios', 400);
      }

      if (value <= 0 || kilowatts <= 0) {
        return ApiResponse.error(res, 'Valor e kilowatts devem ser maiores que zero', 400);
      }

      const result = await salesService.createSale(userId, {
        client_id,
        client_name,
        value: parseFloat(value),
        kilowatts: parseFloat(kilowatts),
        insurance_value: insurance_value ? parseFloat(insurance_value) : undefined,
        template_type,
        notes,
      });

      return ApiResponse.created(res, result, 'Venda registrada com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao registrar venda', 500);
    }
  }

  async listSales(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { status, limit } = req.query;

      const sales = await salesService.listUserSales(userId, {
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return ApiResponse.success(res, sales, 'Vendas listadas com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao listar vendas', 500);
    }
  }

  async getSale(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      const sale = await salesService.getSaleById(id, userId);
      return ApiResponse.success(res, sale, 'Venda encontrada');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar venda', 404);
    }
  }

  async getSaleWithClient(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      const sale = await salesService.getSaleWithClient(id, userId);
      return ApiResponse.success(res, sale, 'Venda com dados do cliente');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao buscar venda', 404);
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return ApiResponse.error(res, 'Status é obrigatório', 400);
      }

      const sale = await salesService.updateSale(id, userId, { status });
      return ApiResponse.success(res, sale, 'Status atualizado com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao atualizar status', 500);
    }
  }

  async updateSale(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;
      const updateData = req.body;

      const sale = await salesService.updateSale(id, userId, updateData);
      return ApiResponse.success(res, sale, 'Venda atualizada com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao atualizar venda', 500);
    }
  }

  async deleteSale(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      await salesService.deleteSale(id, userId);
      return ApiResponse.success(res, null, 'Venda excluída com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao excluir venda', 500);
    }
  }

  // ========== MÉTODOS PARA ESTATÍSTICAS E GRÁFICOS ==========

  async getStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const stats = await salesService.getSalesStats(userId);
      return ApiResponse.success(res, stats, 'Estatísticas obtidas');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao obter estatísticas', 500);
    }
  }

  async getChartData(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const data = await salesService.getSalesChartData(userId);
      return ApiResponse.success(res, data, 'Dados do gráfico obtidos');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao obter dados', 500);
    }
  }
}