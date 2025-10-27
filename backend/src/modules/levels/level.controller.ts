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
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async find(req: Request, res: Response) {
    try {
      const level = await levelService.getLevelById(req.params.id);
      return ApiResponse.success(res, level);
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const level = await levelService.createLevel(req.body);
      return ApiResponse.created(res, level, 'Nível criado com sucesso');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const level = await levelService.updateLevel(req.params.id, req.body);
      return ApiResponse.success(res, level, 'Nível atualizado');
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}
