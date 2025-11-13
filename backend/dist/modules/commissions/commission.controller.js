"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionController = void 0;
const commission_service_1 = require("./commission.service");
const responses_1 = require("../../utils/responses");
class CommissionController {
    /**
     * 🔹 Retorna resumo geral de comissões (pessoal + rede)
     */
    async getSummary(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
        const data = await commission_service_1.commissionService.getCombinedSummary(userId);
        return responses_1.ApiResponse.success(res, data, 'Resumo de comissões carregado com sucesso');
    }
    /**
     * 🔹 Retorna todas as comissões pessoais do usuário
     */
    async getPersonalCommissions(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
        const data = await commission_service_1.commissionService.getPersonalCommissions(userId);
        return responses_1.ApiResponse.success(res, data, 'Comissões pessoais carregadas');
    }
    /**
     * 🔹 Retorna todas as comissões de rede (líder)
     */
    async getNetworkCommissions(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
        const data = await commission_service_1.commissionService.getNetworkCommissions(userId);
        return responses_1.ApiResponse.success(res, data, 'Comissões de rede carregadas');
    }
    /**
     * 🔹 Retorna resumo mensal (últimos 6 meses)
     */
    async getMonthly(req, res) {
        const userId = req.user?.userId;
        if (!userId)
            return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
        const data = await commission_service_1.commissionService.getMonthlySummary(userId);
        return responses_1.ApiResponse.success(res, data, 'Resumo mensal carregado');
    }
}
exports.commissionController = new CommissionController();
