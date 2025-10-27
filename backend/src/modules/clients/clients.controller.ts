import { Request, Response } from 'express';
import { ClientsService } from './clients.service';
import { ApiResponse } from '../../utils/responses';

const clientsService = new ClientsService();

export class ClientsController {
  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const client = await clientsService.createClient(userId, req.body);
      return ApiResponse.created(res, client, 'Cliente cadastrado com sucesso');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao cadastrar cliente', 500);
    }
  }

  async list(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const clients = await clientsService.listUserClients(userId);
      return ApiResponse.success(res, clients, 'Clientes listados');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao listar clientes', 500);
    }
  }

  // --- MÉTODO ADICIONADO ---
  async update(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;
      const client = await clientsService.updateClient(id, userId, req.body);
      return ApiResponse.success(res, client, 'Cliente atualizado');
    } catch (error: any) {
      return ApiResponse.error(res, error.message || 'Erro ao atualizar cliente', 500);
    }
  }
}