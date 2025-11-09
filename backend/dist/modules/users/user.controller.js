"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("./user.service");
const responses_1 = require("../../utils/responses");
const userService = new user_service_1.UserService();
class UserController {
    // ========== MÉTODOS DE DASHBOARD ==========
    async getDashboard(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            // ✅ CONVERTER PARA STRING
            const dashboard = await userService.getDashboard(String(userId));
            return responses_1.ApiResponse.success(res, dashboard, 'Dashboard');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar dashboard';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    // ========== MÉTODOS DE EQUIPE ==========
    async addMember(req, res) {
        try {
            const parentId = req.user?.userId;
            if (!parentId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            // ✅ CONVERTER PARA STRING
            const member = await userService.addTeamMember(String(parentId), req.body);
            return responses_1.ApiResponse.created(res, member, 'Membro adicionado à equipe');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao adicionar membro';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async getMyTeam(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            // ✅ CONVERTER PARA STRING
            const team = await userService.getDirectTeamMembers(String(userId));
            return responses_1.ApiResponse.success(res, team, 'Membros da equipe');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar membros da equipe';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async getFullNetwork(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            // ✅ CONVERTER PARA STRING
            const network = await userService.getFullNetwork(String(userId));
            return responses_1.ApiResponse.success(res, network, 'Rede completa');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar rede completa';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async getTeamStats(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            // ✅ CONVERTER PARA STRING
            const stats = await userService.getTeamStats(String(userId));
            return responses_1.ApiResponse.success(res, stats, 'Estatísticas da equipe');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar estatísticas';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async checkHasTeam(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            // ✅ CONVERTER PARA STRING
            const hasTeam = await userService.hasTeam(String(userId));
            return responses_1.ApiResponse.success(res, { has_team: hasTeam });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao verificar equipe';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    // ========== MÉTODOS GERAIS ==========
    async list(req, res) {
        try {
            const users = await userService.list();
            return responses_1.ApiResponse.success(res, users, 'Usuários listados');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao listar usuários';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async find(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return responses_1.ApiResponse.error(res, 'ID é obrigatório', 400);
            }
            const user = await userService.findById(id);
            return responses_1.ApiResponse.success(res, user, 'Usuário encontrado');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar usuário';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return responses_1.ApiResponse.error(res, 'ID é obrigatório', 400);
            }
            const user = await userService.update(id, req.body);
            return responses_1.ApiResponse.success(res, user, 'Usuário atualizado');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao atualizar usuário';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async remove(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return responses_1.ApiResponse.error(res, 'ID é obrigatório', 400);
            }
            await userService.remove(id);
            return responses_1.ApiResponse.success(res, null, 'Usuário removido');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao remover usuário';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
