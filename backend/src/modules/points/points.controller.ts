// backend/src/modules/points/points.controller.ts
import { Request, Response } from 'express';
import { PointsService } from './points.service';
import { ApiResponse } from '@utils/responses';

const pointsService = new PointsService();

export class PointsController {
  async getHistory(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }
      const history = await pointsService.getUserPointsHistory(userId);
      return ApiResponse.success(res, history, 'Histórico de pontos');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao obter histórico de pontos';
      return ApiResponse.error(res, message, 500);
    }
  }

  async getTotal(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }
      const total = await pointsService.getUserTotalPoints(userId);
      return ApiResponse.success(res, { total_points: total });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao obter total de pontos';
      return ApiResponse.error(res, message, 500);
    }
  }

  async getRanking(req: Request, res: Response) {
    try {
      const limit = Number(req.query.limit) || 10;
      const ranking = await pointsService.getPointsRanking(limit);
      return ApiResponse.success(res, ranking, 'Ranking de pontos');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao obter ranking';
      return ApiResponse.error(res, message, 500);
    }
  }

  async getProgress(req: Request, res: Response) {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }
      const progress = await pointsService.getUserProgress(userId);
      return ApiResponse.success(res, progress, 'Progresso do usuário');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao obter progresso';
      return ApiResponse.error(res, message, 500);
    }
  }
}
