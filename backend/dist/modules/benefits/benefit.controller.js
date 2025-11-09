"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BenefitController = void 0;
const benefit_service_1 = require("./benefit.service");
const responses_1 = require("../../utils/responses");
const benefitService = new benefit_service_1.BenefitService();
class BenefitController {
    async list(req, res) {
        try {
            const benefits = await benefitService.getAllBenefits();
            return responses_1.ApiResponse.success(res, benefits, 'Lista de benefícios');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro interno';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async getByLevel(req, res) {
        try {
            const benefits = await benefitService.getBenefitsByLevel(req.params.levelId);
            return responses_1.ApiResponse.success(res, benefits);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro interno';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async getUserBenefits(req, res) {
        try {
            const userId = req.params.userId || req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const benefits = await benefitService.getUserUnlockedBenefits(userId);
            return responses_1.ApiResponse.success(res, benefits, 'Benefícios desbloqueados');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro interno';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async create(req, res) {
        try {
            const benefit = await benefitService.createBenefit(req.body);
            return responses_1.ApiResponse.created(res, benefit, 'Benefício criado');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro interno';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async update(req, res) {
        try {
            const benefit = await benefitService.updateBenefit(req.params.id, req.body);
            return responses_1.ApiResponse.success(res, benefit, 'Benefício atualizado');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro interno';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async remove(req, res) {
        try {
            const message = await benefitService.deleteBenefit(req.params.id);
            return responses_1.ApiResponse.success(res, message);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro interno';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
}
exports.BenefitController = BenefitController;
