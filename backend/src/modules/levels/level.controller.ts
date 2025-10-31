// backend/src/modules/levels/level.controller.ts

import { Request, Response } from 'express';
import { levelService } from './level.service';
import { ApiResponse } from '../../utils/responses';

export class LevelController {
  // Listar todos os níveis
  async list(req: Request, res: Response) {
    try {
      const levels = await levelService.getAllLevels();
      return ApiResponse.success(res, levels, 'Plano de carreira carregado');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao listar níveis';
      return ApiResponse.error(res, message, 500);
    }
  }

  // Buscar nível específico por ID
  async find(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return ApiResponse.error(res, 'ID do nível é obrigatório', 400);
      }

      const level = await levelService.getLevelById(id);
      if (!level) {
        return ApiResponse.error(res, 'Nível não encontrado', 404);
      }

      return ApiResponse.success(res, level, 'Nível encontrado');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar nível';
      return ApiResponse.error(res, message, 500);
    }
  }

  // Buscar nível por pontos
  async findByPoints(req: Request, res: Response) {
    try {
      const { points } = req.params;
      const pointsNumber = parseInt(points);

      if (isNaN(pointsNumber) || pointsNumber < 0) {
        return ApiResponse.error(res, 'Pontos inválidos', 400);
      }

      const level = await levelService.getLevelByPoints(pointsNumber);
      if (!level) {
        return ApiResponse.error(res, 'Nível não encontrado', 404);
      }

      return ApiResponse.success(res, level, 'Nível encontrado');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar nível por pontos';
      return ApiResponse.error(res, message, 500);
    }
  }

  // Buscar metas do usuário logado
  async getUserGoals(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const goals = await levelService.getUserGoals(userId);
      return ApiResponse.success(res, goals, 'Metas carregadas com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar metas';
      return ApiResponse.error(res, message, 500);
    }
  }

  // Buscar caminho completo de níveis (pathway)
  async getLevelPathway(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return ApiResponse.error(res, 'Usuário não autenticado', 401);
      }

      const pathway = await levelService.getLevelPathway(userId);
      return ApiResponse.success(res, pathway, 'Pathway de níveis carregado');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar pathway';
      return ApiResponse.error(res, message, 500);
    }
  }

  // Criar novo nível (admin)
  async create(req: Request, res: Response) {
    try {
      const data = req.body;

      // Validar campos obrigatórios
      if (!data.name || data.phase_number === undefined) {
        return ApiResponse.error(res, 'Nome e fase_number são obrigatórios', 400);
      }

      if (data.personal_commission === undefined) {
        return ApiResponse.error(res, 'Comissão pessoal é obrigatória', 400);
      }

      const level = await levelService.createLevel(data);
      return ApiResponse.success(res, level, 'Nível criado com sucesso', 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao criar nível';
      return ApiResponse.error(res, message, 500);
    }
  }

  // Atualizar nível (admin)
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return ApiResponse.error(res, 'ID do nível é obrigatório', 400);
      }

      // Verificar se nível existe
      const existingLevel = await levelService.getLevelById(id);
      if (!existingLevel) {
        return ApiResponse.error(res, 'Nível não encontrado', 404);
      }

      const level = await levelService.updateLevel(id, req.body);
      return ApiResponse.success(res, level, 'Nível atualizado com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar nível';
      return ApiResponse.error(res, message, 500);
    }
  }

  // Deletar nível (admin)
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return ApiResponse.error(res, 'ID do nível é obrigatório', 400);
      }

      // Verificar se nível existe
      const existingLevel = await levelService.getLevelById(id);
      if (!existingLevel) {
        return ApiResponse.error(res, 'Nível não encontrado', 404);
      }

      await levelService.deleteLevel(id);
      return ApiResponse.success(res, null, 'Nível deletado com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar nível';
      return ApiResponse.error(res, message, 500);
    }
  }
}

export const levelController = new LevelController();
