import { Request, Response } from 'express';
import { notificationsService } from './notifications.service';
import { ApiResponse } from '../../utils/responses';

export class NotificationsController {
  // ✅ CREATE - Criar notificação
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Não autenticado', 401);
      }

      const { type, title, message, metadata } = req.body;

      if (!type || !title || !message) {
        return ApiResponse.error(res, 'type, title e message são obrigatórios', 400);
      }

      const notification = await notificationsService.create(userId, {
        type,
        title,
        message,
        metadata,
      });

      return ApiResponse.created(res, notification, 'Notificação criada com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao criar notificação:', error);
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ✅ LIST - Listar notificações
  async list(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Não autenticado', 401);
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const notifications = await notificationsService.list(userId, limit, offset);

      return ApiResponse.success(res, notifications, 'Notificações carregadas');
    } catch (error: any) {
      console.error('❌ Erro no list:', error);
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ✅ GET UNREAD COUNT
  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Não autenticado', 401);
      }

      const count = await notificationsService.getUnreadCount(userId);
      return ApiResponse.success(res, { count });
    } catch (error: any) {
      console.error('❌ Erro no getUnreadCount:', error);
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ✅ MARK AS READ
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        return ApiResponse.error(res, 'Não autenticado', 401);
      }

      await notificationsService.markAsRead(id, userId);
      return ApiResponse.success(res, null, 'Notificação marcada como lida');
    } catch (error: any) {
      console.error('❌ Erro no markAsRead:', error);
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ✅ MARK ALL AS READ
  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Não autenticado', 401);
      }

      await notificationsService.markAllAsRead(userId);
      return ApiResponse.success(res, null, 'Todas notificações marcadas como lidas');
    } catch (error: any) {
      console.error('❌ Erro no markAllAsRead:', error);
      return ApiResponse.error(res, error.message, 500);
    }
  }

  // ✅ DELETE
  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        return ApiResponse.error(res, 'Não autenticado', 401);
      }

      await notificationsService.delete(id, userId);
      return ApiResponse.success(res, null, 'Notificação excluída');
    } catch (error: any) {
      console.error('❌ Erro no delete:', error);
      return ApiResponse.error(res, error.message, 500);
    }
  }
}

export const notificationsController = new NotificationsController();
