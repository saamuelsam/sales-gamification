"use strict";
// backend/src/modules/levels/level.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.levelController = exports.LevelController = void 0;
const level_service_1 = require("./level.service");
const responses_1 = require("../../utils/responses");
class LevelController {
    // Listar todos os níveis
    async list(req, res) {
        try {
            const levels = await level_service_1.levelService.getAllLevels();
            return responses_1.ApiResponse.success(res, levels, 'Plano de carreira carregado');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao listar níveis';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    // Buscar nível específico por ID
    async find(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return responses_1.ApiResponse.error(res, 'ID do nível é obrigatório', 400);
            }
            const level = await level_service_1.levelService.getLevelById(id);
            if (!level) {
                return responses_1.ApiResponse.error(res, 'Nível não encontrado', 404);
            }
            return responses_1.ApiResponse.success(res, level, 'Nível encontrado');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar nível';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    // Buscar nível por pontos
    async findByPoints(req, res) {
        try {
            const { points } = req.params;
            const pointsNumber = parseInt(points);
            if (isNaN(pointsNumber) || pointsNumber < 0) {
                return responses_1.ApiResponse.error(res, 'Pontos inválidos', 400);
            }
            const level = await level_service_1.levelService.getLevelByPoints(pointsNumber);
            if (!level) {
                return responses_1.ApiResponse.error(res, 'Nível não encontrado', 404);
            }
            return responses_1.ApiResponse.success(res, level, 'Nível encontrado');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar nível por pontos';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    // Buscar metas do usuário logado
    async getUserGoals(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const goals = await level_service_1.levelService.getUserGoals(userId);
            return responses_1.ApiResponse.success(res, goals, 'Metas carregadas com sucesso');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar metas';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    // Buscar caminho completo de níveis (pathway)
    async getLevelPathway(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const pathway = await level_service_1.levelService.getLevelPathway(userId);
            return responses_1.ApiResponse.success(res, pathway, 'Pathway de níveis carregado');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar pathway';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    // Criar novo nível (admin)
    async create(req, res) {
        try {
            const data = req.body;
            // Validar campos obrigatórios
            if (!data.name || data.phase_number === undefined) {
                return responses_1.ApiResponse.error(res, 'Nome e fase_number são obrigatórios', 400);
            }
            if (data.personal_commission === undefined) {
                return responses_1.ApiResponse.error(res, 'Comissão pessoal é obrigatória', 400);
            }
            const level = await level_service_1.levelService.createLevel(data);
            return responses_1.ApiResponse.success(res, level, 'Nível criado com sucesso', 201);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao criar nível';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    // Atualizar nível (admin)
    async update(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return responses_1.ApiResponse.error(res, 'ID do nível é obrigatório', 400);
            }
            // Verificar se nível existe
            const existingLevel = await level_service_1.levelService.getLevelById(id);
            if (!existingLevel) {
                return responses_1.ApiResponse.error(res, 'Nível não encontrado', 404);
            }
            const level = await level_service_1.levelService.updateLevel(id, req.body);
            return responses_1.ApiResponse.success(res, level, 'Nível atualizado com sucesso');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao atualizar nível';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    // Deletar nível (admin)
    async delete(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return responses_1.ApiResponse.error(res, 'ID do nível é obrigatório', 400);
            }
            // Verificar se nível existe
            const existingLevel = await level_service_1.levelService.getLevelById(id);
            if (!existingLevel) {
                return responses_1.ApiResponse.error(res, 'Nível não encontrado', 404);
            }
            await level_service_1.levelService.deleteLevel(id);
            return responses_1.ApiResponse.success(res, null, 'Nível deletado com sucesso');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao deletar nível';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
}
exports.LevelController = LevelController;
exports.levelController = new LevelController();
