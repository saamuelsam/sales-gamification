"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsController = void 0;
const clients_service_1 = require("./clients.service");
const responses_1 = require("../../utils/responses");
const clientsService = new clients_service_1.ClientsService();
class ClientsController {
    async create(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const client = await clientsService.createClient(userId, req.body);
            return responses_1.ApiResponse.created(res, client, 'Cliente cadastrado com sucesso');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao cadastrar cliente';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async list(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const clients = await clientsService.listUserClients(userId);
            return responses_1.ApiResponse.success(res, clients, 'Clientes listados');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao listar clientes';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async update(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const { id } = req.params;
            if (!id) {
                return responses_1.ApiResponse.error(res, 'ID do cliente é obrigatório', 400);
            }
            const client = await clientsService.updateClient(id, userId, req.body);
            return responses_1.ApiResponse.success(res, client, 'Cliente atualizado');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao atualizar cliente';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
}
exports.ClientsController = ClientsController;
