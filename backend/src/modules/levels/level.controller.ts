// backend/src/modules/levels/level.controller.ts
import { Request, Response } from 'express';
import { LevelService } from './level.service';
import { ApiResponse } from '@utils/responses';

const levelService = new LevelService();

export class LevelController {
  async list(req: Request, res: Response) {
    try {
      const levels = await levelService.getAllLevels();
      return ApiResponse.success(res, levels, 'Plano de carreira');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao listar níveis';
      return ApiResponse.error(res, message, 500);
    }
  }

  async find(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return ApiResponse.error(res, 'ID do nível é obrigatório', 400);
      }
      const level = await levelService.getLevelById(id);
      return ApiResponse.success(res, level);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar nível';
      return ApiResponse.error(res, message, 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const level = await levelService.createLevel(req.body);
      return ApiResponse.created(res, level, 'Nível criado com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao criar nível';
      return ApiResponse.error(res, message, 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return ApiResponse.error(res, 'ID do nível é obrigatório', 400);
      }
      const level = await levelService.updateLevel(id, req.body);
      return ApiResponse.success(res, level, 'Nível atualizado');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar nível';
      return ApiResponse.error(res, message, 500);
    }
  }
}
