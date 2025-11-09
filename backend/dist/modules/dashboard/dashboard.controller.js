"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = require("./dashboard.service");
const responses_1 = require("../../utils/responses");
const dashboardService = new dashboard_service_1.DashboardService();
class DashboardController {
    // Dashboard pessoal
    async getPersonal(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const data = await dashboardService.getPersonalDashboard(userId);
            return responses_1.ApiResponse.success(res, data, 'Dashboard pessoal');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar dashboard';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    // Dashboard da equipe
    async getTeam(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const data = await dashboardService.getTeamDashboard(userId);
            return responses_1.ApiResponse.success(res, data, 'Dashboard da equipe');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar dashboard da equipe';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    // Dashboard completo (combinado)
    async getComplete(req, res) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const personal = await dashboardService.getPersonalDashboard(userId);
            const team = await dashboardService.getTeamDashboard(userId);
            let admin = null;
            if (userRole === 'admin') {
                admin = await dashboardService.getAdminDashboard();
            }
            return responses_1.ApiResponse.success(res, {
                personal,
                team,
                has_team: Array.isArray(team.members) && team.members.length > 0,
                admin,
            }, 'Dashboard completo');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar dashboard';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    // Dashboard admin
    async getAdmin(req, res) {
        try {
            const userRole = req.user?.role;
            if (userRole !== 'admin') {
                return responses_1.ApiResponse.forbidden(res, 'Acesso negado');
            }
            const data = await dashboardService.getAdminDashboard();
            return responses_1.ApiResponse.success(res, data, 'Dashboard administrativo');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar dashboard admin';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
}
exports.DashboardController = DashboardController;
