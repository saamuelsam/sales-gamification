"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointsController = void 0;
const points_service_1 = require("./points.service");
const responses_1 = require("../../utils/responses");
const pointsService = new points_service_1.PointsService();
class PointsController {
    async getHistory(req, res) {
        try {
            const userId = req.params.userId || req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const history = await pointsService.getUserPointsHistory(userId);
            return responses_1.ApiResponse.success(res, history, 'Histórico de pontos');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao obter histórico de pontos';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async getTotal(req, res) {
        try {
            const userId = req.params.userId || req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const total = await pointsService.getUserTotalPoints(userId);
            return responses_1.ApiResponse.success(res, { total_points: total });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao obter total de pontos';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async getRanking(req, res) {
        try {
            const limit = Number(req.query.limit) || 10;
            const ranking = await pointsService.getPointsRanking(limit);
            return responses_1.ApiResponse.success(res, ranking, 'Ranking de pontos');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao obter ranking';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async getProgress(req, res) {
        try {
            const userId = req.params.userId || req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const progress = await pointsService.getUserProgress(userId);
            return responses_1.ApiResponse.success(res, progress, 'Progresso do usuário');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao obter progresso';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
}
exports.PointsController = PointsController;
