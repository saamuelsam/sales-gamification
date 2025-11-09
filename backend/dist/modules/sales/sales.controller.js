"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesController = exports.SalesController = void 0;
const sales_service_1 = require("./sales.service");
const responses_1 = require("../../utils/responses");
const database_1 = require("../../config/database");
const salesService = new sales_service_1.SalesService();
class SalesController {
    async createSale(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const { client_id, client_name, value, kilowatts, insurance_value, sale_type, consortium_value, consortium_term, consortium_monthly_payment, consortium_admin_fee, template_type, notes, } = req.body;
            if (!client_name || value == null || kilowatts == null) {
                return responses_1.ApiResponse.error(res, 'Nome do cliente, valor e kilowatts são obrigatórios', 400);
            }
            if (sale_type === 'consortium') {
                if (!consortium_value || !consortium_term) {
                    return responses_1.ApiResponse.error(res, 'Consórcio requer consortium_value e consortium_term obrigatórios', 400);
                }
            }
            if (sale_type && !['direct', 'consortium', 'cash', 'card'].includes(sale_type)) {
                return responses_1.ApiResponse.error(res, "Tipo de venda inválido. Use: direct, consortium, cash ou card", 400);
            }
            const numericValue = Number(value);
            const numericKw = Number(kilowatts);
            const numericInsurance = insurance_value != null ? Number(insurance_value) : undefined;
            const numericConsortiumValue = consortium_value != null ? Number(consortium_value) : undefined;
            const numericConsortiumTerm = consortium_term != null ? Number(consortium_term) : undefined;
            const numericConsortiumMonthly = consortium_monthly_payment != null ? Number(consortium_monthly_payment) : undefined;
            const numericConsortiumFee = consortium_admin_fee != null ? Number(consortium_admin_fee) : undefined;
            if (!Number.isFinite(numericValue) || !Number.isFinite(numericKw)) {
                return responses_1.ApiResponse.error(res, 'Valor e kilowatts devem ser numéricos', 400);
            }
            if (numericValue <= 0 || numericKw <= 0) {
                return responses_1.ApiResponse.error(res, 'Valor e kilowatts devem ser maiores que zero', 400);
            }
            if (sale_type === 'consortium') {
                if (!Number.isFinite(numericConsortiumValue) || numericConsortiumValue <= 0) {
                    return responses_1.ApiResponse.error(res, 'Valor do consórcio deve ser numérico e maior que zero', 400);
                }
                if (!Number.isFinite(numericConsortiumTerm) || numericConsortiumTerm <= 0) {
                    return responses_1.ApiResponse.error(res, 'Prazo do consórcio deve ser numérico e maior que zero', 400);
                }
                if (numericConsortiumTerm > 120) {
                    return responses_1.ApiResponse.error(res, 'Prazo do consórcio não pode exceder 120 meses', 400);
                }
            }
            const result = await salesService.createSale(userId, {
                client_id,
                client_name,
                value: numericValue,
                kilowatts: numericKw,
                insurance_value: numericInsurance,
                sale_type: sale_type,
                consortium_value: numericConsortiumValue,
                consortium_term: numericConsortiumTerm,
                consortium_monthly_payment: numericConsortiumMonthly,
                consortium_admin_fee: numericConsortiumFee,
                template_type,
                notes,
            });
            return responses_1.ApiResponse.created(res, result, 'Venda registrada com sucesso');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao registrar venda';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async listSales(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const { status, sale_type, limit } = req.query;
            const parsedLimit = typeof limit === 'string' ? Number(limit) : undefined;
            if (parsedLimit !== undefined && (!Number.isFinite(parsedLimit) || parsedLimit <= 0)) {
                return responses_1.ApiResponse.error(res, 'Parâmetro limit inválido', 400);
            }
            if (sale_type && typeof sale_type === 'string') {
                if (!['direct', 'consortium', 'cash', 'card'].includes(sale_type)) {
                    return responses_1.ApiResponse.error(res, 'Tipo de venda inválido', 400);
                }
            }
            const sales = await salesService.listUserSales(userId, {
                status: typeof status === 'string' ? status : undefined,
                sale_type: typeof sale_type === 'string' ? sale_type : undefined,
                limit: parsedLimit,
            });
            return responses_1.ApiResponse.success(res, sales, 'Vendas listadas com sucesso');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao listar vendas';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async getSale(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const { id } = req.params;
            if (!id) {
                return responses_1.ApiResponse.error(res, 'ID da venda obrigatório', 400);
            }
            const sale = await salesService.getSaleById(id, userId);
            return responses_1.ApiResponse.success(res, sale, 'Venda encontrada');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar venda';
            return responses_1.ApiResponse.error(res, message, 404);
        }
    }
    async getSaleWithClient(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const { id } = req.params;
            if (!id) {
                return responses_1.ApiResponse.error(res, 'ID da venda obrigatório', 400);
            }
            const sale = await salesService.getSaleWithClient(id, userId);
            return responses_1.ApiResponse.success(res, sale, 'Venda com dados do cliente');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar venda';
            return responses_1.ApiResponse.error(res, message, 404);
        }
    }
    async updateStatus(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const { id } = req.params;
            const { status } = req.body;
            if (!id) {
                return responses_1.ApiResponse.error(res, 'ID da venda obrigatório', 400);
            }
            if (!status) {
                return responses_1.ApiResponse.error(res, 'Status obrigatório', 400);
            }
            const sale = await salesService.updateSale(id, userId, { status });
            return responses_1.ApiResponse.success(res, sale, 'Status atualizado com sucesso');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao atualizar status';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async updateSale(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const { id } = req.params;
            if (!id) {
                return responses_1.ApiResponse.error(res, 'ID da venda obrigatório', 400);
            }
            const { client_name, value, kilowatts, insurance_value, sale_type, consortium_value, consortium_term, consortium_monthly_payment, consortium_admin_fee, status, notes, product_delivered, delivery_date, installation_proof_url, } = req.body;
            if (sale_type && !['direct', 'consortium', 'cash', 'card'].includes(sale_type)) {
                return responses_1.ApiResponse.error(res, "Tipo de venda inválido. Use: direct, consortium, cash ou card", 400);
            }
            if (sale_type === 'consortium') {
                if (consortium_value == null || consortium_term == null) {
                    return responses_1.ApiResponse.error(res, 'Ao mudar para consórcio, informe consortium_value e consortium_term', 400);
                }
            }
            const updateData = {};
            if (client_name !== undefined)
                updateData.client_name = client_name;
            if (value !== undefined) {
                const numValue = Number(value);
                if (!Number.isFinite(numValue) || numValue <= 0) {
                    return responses_1.ApiResponse.error(res, 'Valor deve ser numérico e maior que zero', 400);
                }
                updateData.value = numValue;
            }
            if (kilowatts !== undefined) {
                const numKw = Number(kilowatts);
                if (!Number.isFinite(numKw) || numKw <= 0) {
                    return responses_1.ApiResponse.error(res, 'Kilowatts deve ser numérico e maior que zero', 400);
                }
                updateData.kilowatts = numKw;
            }
            if (insurance_value !== undefined)
                updateData.insurance_value = insurance_value ? Number(insurance_value) : null;
            if (sale_type !== undefined)
                updateData.sale_type = sale_type;
            if (consortium_value !== undefined)
                updateData.consortium_value = consortium_value ? Number(consortium_value) : null;
            if (consortium_term !== undefined)
                updateData.consortium_term = consortium_term ? Number(consortium_term) : null;
            if (consortium_monthly_payment !== undefined)
                updateData.consortium_monthly_payment = consortium_monthly_payment ? Number(consortium_monthly_payment) : null;
            if (consortium_admin_fee !== undefined)
                updateData.consortium_admin_fee = consortium_admin_fee ? Number(consortium_admin_fee) : null;
            if (status !== undefined)
                updateData.status = status;
            if (notes !== undefined)
                updateData.notes = notes;
            if (product_delivered !== undefined)
                updateData.product_delivered = product_delivered;
            if (delivery_date !== undefined)
                updateData.delivery_date = delivery_date; // ✅ CORRIGIDO
            if (installation_proof_url !== undefined)
                updateData.installation_proof_url = installation_proof_url;
            // ✅ CORRIGIDO - Chamar o service e retornar o resultado
            const updatedSale = await salesService.updateSale(id, userId, updateData);
            return responses_1.ApiResponse.success(res, updatedSale, 'Venda atualizada com sucesso');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao atualizar venda';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async deleteSale(req, res) {
        const client = await database_1.pool.connect();
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            if (!id || !userId) {
                return responses_1.ApiResponse.error(res, 'ID e usuário são obrigatórios', 400);
            }
            await client.query('BEGIN');
            // 1️⃣ BUSCAR A VENDA
            const saleResult = await client.query(`SELECT kilowatts FROM sales WHERE id = $1 AND user_id = $2`, [id, userId]);
            const saleData = saleResult.rows[0];
            if (!saleData) {
                await client.query('ROLLBACK');
                await client.release();
                return responses_1.ApiResponse.error(res, 'Venda não encontrada', 404);
            }
            const pointsToRemove = Math.floor(parseFloat(saleData.kilowatts));
            // ✅ 2️⃣ DELETAR PONTOS DESSA VENDA
            await client.query(`DELETE FROM points WHERE sale_id = $1`, [id]);
            // ✅ 3️⃣ DELETAR COMISSÕES DESSA VENDA
            await client.query(`DELETE FROM commissions WHERE sale_id = $1`, [id]);
            // 4️⃣ DELETAR A VENDA
            await client.query(`DELETE FROM sales WHERE id = $1 AND user_id = $2`, [id, userId]);
            // 5️⃣ REMOVER PONTOS DO USUÁRIO
            await client.query(`UPDATE users 
       SET points = GREATEST(0, points - $1) 
       WHERE id = $2`, [pointsToRemove, userId]);
            console.log(`🗑️ Venda ${id} deletada! ${pointsToRemove} pontos removidos`);
            // 6️⃣ BUSCAR NOVO TOTAL DE PONTOS
            const userPointsResult = await client.query(`SELECT points FROM users WHERE id = $1`, [userId]);
            const newTotalPoints = parseFloat(userPointsResult.rows[0].points);
            // 7️⃣ VOLTAR PARA ELITE SE CAIU MUITO
            if (newTotalPoints < 1000) {
                await client.query(`UPDATE users SET role = 'consultant' WHERE id = $1`, [userId]);
                console.log(`⬇️ Usuário ${userId} voltou para Consultant (${newTotalPoints} pontos)`);
            }
            await client.query('COMMIT');
            return responses_1.ApiResponse.success(res, {
                id,
                pointsRemoved: pointsToRemove,
                newPoints: newTotalPoints
            }, 'Venda deletada com sucesso');
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao deletar venda:', error);
            return responses_1.ApiResponse.error(res, error.message || 'Erro ao deletar venda', 500);
        }
        finally {
            await client.release();
        }
    }
    async getStats(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const stats = await salesService.getSalesStats(userId);
            return responses_1.ApiResponse.success(res, stats, 'Estatísticas obtidas');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao obter estatísticas';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async getChartData(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const chartData = await salesService.getChartData(userId);
            return responses_1.ApiResponse.success(res, chartData, 'Dados de gráficos carregados');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao buscar dados de gráficos';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
    async getSalesChartData(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return responses_1.ApiResponse.error(res, 'Usuário não autenticado', 401);
            }
            const data = await salesService.getSalesChartData(userId);
            return responses_1.ApiResponse.success(res, data, 'Dados do gráfico obtidos');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao obter dados';
            return responses_1.ApiResponse.error(res, message, 500);
        }
    }
}
exports.SalesController = SalesController;
exports.salesController = new SalesController();
