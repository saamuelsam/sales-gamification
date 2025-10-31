import { Request, Response } from 'express';
import { notificationsService } from './notifications.service';
import { ApiResponse } from '../../utils/responses';

export class NotificationsController {
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
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Não autenticado', 401);
      }

      const count = await notificationsService.getUnreadCount(userId);
      return ApiResponse.success(res, { count });
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

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
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Não autenticado', 401);
      }

      await notificationsService.markAllAsRead(userId);
      return ApiResponse.success(res, null, 'Todas notificações marcadas como lidas');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

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
      return ApiResponse.error(res, error.message, 500);
    }
  }
}

export const notificationsController = new NotificationsController();
