import { Request, Response } from 'express';
import { ClientsService } from './clients.service';
import { ApiResponse } from '../../utils/responses';

const clientsService = new ClientsService();

export class ClientsController {
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }
      const client = await clientsService.createClient(userId, req.body);
      return ApiResponse.created(res, client, 'Cliente cadastrado com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao cadastrar cliente';
      return ApiResponse.error(res, message, 500);
    }
  }

  async list(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }
      const clients = await clientsService.listUserClients(userId);
      return ApiResponse.success(res, clients, 'Clientes listados');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao listar clientes';
      return ApiResponse.error(res, message, 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }
      const { id } = req.params;
      if (!id) {
        return ApiResponse.error(res, 'ID do cliente é obrigatório', 400);
      }
      const client = await clientsService.updateClient(id, userId, req.body);
      return ApiResponse.success(res, client, 'Cliente atualizado');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar cliente';
      return ApiResponse.error(res, message, 500);
    }
  }
}
