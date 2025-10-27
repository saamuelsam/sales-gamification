import { Request, Response } from 'express';
import { SalesService } from './sales.service';
import { ApiResponse } from '../../utils/responses';

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
        template_type,
        notes,
      } = req.body;

      if (!client_name || value == null || kilowatts == null) {
        return ApiResponse.error(res, 'Nome do cliente, valor e kilowatts são obrigatórios', 400);
      }

      const numericValue = Number(value);
      const numericKw = Number(kilowatts);
      const numericInsurance = insurance_value != null ? Number(insurance_value) : undefined;

      if (!Number.isFinite(numericValue) || !Number.isFinite(numericKw)) {
        return ApiResponse.error(res, 'Valor e kilowatts devem ser numéricos', 400);
      }

      if (numericValue <= 0 || numericKw <= 0) {
        return ApiResponse.error(res, 'Valor e kilowatts devem ser maiores que zero', 400);
      }

      const result = await salesService.createSale(userId, {
        client_id,
        client_name,
        value: numericValue,
        kilowatts: numericKw,
        insurance_value: numericInsurance,
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

      const { status, limit } = req.query;

      const parsedLimit = typeof limit === 'string' ? Number(limit) : undefined;
      if (parsedLimit !== undefined && (!Number.isFinite(parsedLimit) || parsedLimit <= 0)) {
        return ApiResponse.error(res, 'Parâmetro "limit" inválido', 400);
      }

      const sales = await salesService.listUserSales(userId, {
        status: typeof status === 'string' ? status : undefined,
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
        return ApiResponse.error(res, 'ID da venda é obrigatório', 400);
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
        return ApiResponse.error(res, 'ID da venda é obrigatório', 400);
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
        return ApiResponse.error(res, 'ID da venda é obrigatório', 400);
      }

      if (!status) {
        return ApiResponse.error(res, 'Status é obrigatório', 400);
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
        return ApiResponse.error(res, 'ID da venda é obrigatório', 400);
      }

      const sale = await salesService.updateSale(id, userId, req.body);
      return ApiResponse.success(res, sale, 'Venda atualizada com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar venda';
      return ApiResponse.error(res, message, 500);
    }
  }

  async deleteSale(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const { id } = req.params;
      if (!id) {
        return ApiResponse.error(res, 'ID da venda é obrigatório', 400);
      }

      await salesService.deleteSale(id, userId);
      return ApiResponse.success(res, null, 'Venda excluída com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir venda';
      return ApiResponse.error(res, message, 500);
    }
  }

  // ========== MÉTODOS PARA ESTATÍSTICAS E GRÁFICOS ==========

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

  async getChartData(req: Request, res: Response) {
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
