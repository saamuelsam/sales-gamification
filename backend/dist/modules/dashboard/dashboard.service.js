"use strict";
// backend/src/modules/dashboard/dashboard.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = exports.DashboardService = void 0;
const database_1 = require("../../config/database");
const logger_1 = require("../../utils/logger");
const levelProgress_service_1 = require("../levels/levelProgress.service");
class DashboardService {
    /**
     * Calcula o nível baseado na quantidade de pontos
     */
    calculateLevelFromPoints(points) {
        if (points >= 2000000)
            return { levelId: 5, levelName: 'Executive', phaseName: 'executive' };
        if (points >= 800000)
            return { levelId: 4, levelName: 'Consultor Prime', phaseName: 'consultorPrime' };
        if (points >= 10000)
            return { levelId: 3, levelName: 'Consultor Sênior', phaseName: 'seniorConsultant' };
        if (points >= 1000)
            return { levelId: 2, levelName: 'Master', phaseName: 'master' };
        return { levelId: 1, levelName: 'Consultor Elite', phaseName: 'elite' };
    }
    // ========== DASHBOARD PESSOAL DO USUÁRIO ==========
    async getPersonalDashboard(userId) {
        const client = await database_1.pool.connect();
        try {
            // Vendas pessoais
            const salesResult = await client.query(`SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(value), 0) as total_revenue,
          COALESCE(SUM(kilowatts), 0) as total_kilowatts,
          COALESCE(AVG(value), 0) as average_sale_value
        FROM sales
        WHERE user_id = $1 AND status != 'cancelled'`, [userId]);
            // 🕒 Calcula meses sem contratos (inatividade)
            const lastSaleResult = await client.query(`SELECT MAX(created_at) AS last_sale_date
         FROM sales
         WHERE user_id = $1
           AND status NOT IN ('cancelled', 'rejected')`, [userId]);
            let mesesSemContratos = 0;
            if (lastSaleResult.rows[0]?.last_sale_date) {
                const ultimaVenda = new Date(lastSaleResult.rows[0].last_sale_date);
                const hoje = new Date();
                const diffMeses = (hoje.getFullYear() - ultimaVenda.getFullYear()) * 12 +
                    (hoje.getMonth() - ultimaVenda.getMonth());
                mesesSemContratos = Math.max(0, diffMeses);
            }
            else {
                // Nunca vendeu → conta como inatividade total
                mesesSemContratos = 3;
            }
            console.log('[DEBUG] Última venda:', lastSaleResult.rows[0]?.last_sale_date);
            console.log('[DEBUG] Meses sem contratos:', mesesSemContratos);
            // Pontos acumulados
            const pointsResult = await client.query(`SELECT 
          COALESCE(MAX(accumulated_points), 0) as total_points
        FROM points
        WHERE user_id = $1`, [userId]);
            // 🔧 Normaliza pontos (corrige escala se vier em kW)
            const totalPointsRaw = parseFloat(pointsResult.rows[0]?.total_points || 0);
            const totalPoints = totalPointsRaw < 10 ? Math.round(totalPointsRaw * 1000) : Math.round(totalPointsRaw);
            console.log('[DEBUG] totalPointsRaw:', totalPointsRaw, '→ ajustado:', totalPoints);
            // ⚙️ Calcula o nível baseado nos pontos ajustados
            const levelInfo = this.calculateLevelFromPoints(totalPoints);
            // ⚡ Atualiza o nível do usuário no banco de dados
            await client.query('UPDATE users SET level = $1 WHERE id = $2', [
                levelInfo.phaseName,
                userId,
            ]);
            // ✅ Busca quantidade de membros diretos (para regra de equipe)
            const teamResult = await client.query(`SELECT COUNT(*)::INT as team_members 
         FROM users 
         WHERE parent_id = $1 AND is_active = true`, [userId]);
            // 🔹 Verifica e atualiza automaticamente o nível do consultor
            const userStats = {
                id: userId,
                role: levelInfo.phaseName,
                pontos: totalPoints,
                contratos_mes: parseInt(salesResult.rows[0]?.total_sales || '0'),
                meses_sem_contratos: mesesSemContratos,
                tem_equipe: parseInt(teamResult.rows[0]?.team_members || 0) > 0,
            };
            await levelProgress_service_1.levelProgressService.calcularProximoNivel(userStats);
            // 💬 Mapeia nomes amigáveis pro front
            const levelDisplayMap = {
                elite: 'Consultor Elite',
                master: 'Master',
                seniorConsultant: 'Consultor Sênior',
                consultorPrime: 'Consultor Prime',
                executive: 'Executive',
            };
            const displayLevel = levelDisplayMap[levelInfo.phaseName] || 'Nível Desconhecido';
            // 🧠 Log de depuração
            console.log('⭐ Points:', totalPoints, '| Level calculado:', levelInfo.phaseName);
            console.log('📊 User Stats:', userStats);
            // Retorna o dashboard formatado
            return {
                total_sales: parseInt(salesResult.rows[0]?.total_sales || 0),
                total_revenue: parseFloat(salesResult.rows[0]?.total_revenue || 0),
                total_kilowatts: parseFloat(salesResult.rows[0]?.total_kilowatts || 0),
                total_points: totalPoints,
                level: displayLevel,
                team_members: parseInt(teamResult.rows[0]?.team_members || 0),
                last_sale_date: lastSaleResult.rows[0]?.last_sale_date || null, // 🆕 data da última venda
                meses_sem_contratos: mesesSemContratos, // 🆕 meses desde a última venda
                charts: {
                    byStatus: [],
                    monthly: [],
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar dashboard pessoal:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    // ========== DASHBOARD DA EQUIPE (HIERÁRQUICO) ==========
    async getTeamDashboard(userId) {
        const client = await database_1.pool.connect();
        try {
            const userResult = await client.query('SELECT path FROM users WHERE id = $1', [userId]);
            if (!userResult.rows[0]) {
                throw new Error('Usuário não encontrado');
            }
            const userPath = userResult.rows[0].path;
            // Membros diretos da equipe (1 nível abaixo)
            const membersResult = await client.query(`SELECT 
          u.id,
          u.name,
          u.email,
          u.level,
          COALESCE(p.total_points, 0) as total_points,
          COALESCE(s.total_sales, 0) as total_sales,
          COALESCE(s.total_revenue, 0) as total_revenue
        FROM users u
        LEFT JOIN (
          SELECT user_id, MAX(accumulated_points) as total_points
          FROM points
          GROUP BY user_id
        ) p ON u.id = p.user_id
        LEFT JOIN (
          SELECT user_id, 
                 COUNT(*) as total_sales,
                 SUM(value) as total_revenue
          FROM sales
          WHERE status != 'cancelled'
          GROUP BY user_id
        ) s ON u.id = s.user_id
        WHERE u.path <@ $1::ltree 
          AND u.path != $1::ltree
          AND nlevel(u.path) = nlevel($1::ltree) + 1
        ORDER BY p.total_points DESC`, [userPath]);
            // Totais da equipe
            const teamTotalsResult = await client.query(`SELECT 
          COUNT(DISTINCT u.id) as total_members,
          COALESCE(SUM(s.total_sales), 0) as total_sales,
          COALESCE(SUM(s.total_revenue), 0) as total_revenue,
          COALESCE(SUM(p.total_points), 0) as total_points
        FROM users u
        LEFT JOIN (
          SELECT user_id, MAX(accumulated_points) as total_points
          FROM points
          GROUP BY user_id
        ) p ON u.id = p.user_id
        LEFT JOIN (
          SELECT user_id, 
                 COUNT(*) as total_sales,
                 SUM(value) as total_revenue
          FROM sales
          WHERE status != 'cancelled'
          GROUP BY user_id
        ) s ON u.id = s.user_id
        WHERE u.path <@ $1::ltree 
          AND u.path != $1::ltree`, [userPath]);
            return {
                members: membersResult.rows.map((member) => ({
                    id: member.id,
                    name: member.name,
                    email: member.email,
                    level: member.level,
                    total_points: parseFloat(member.total_points || 0),
                    total_sales: parseInt(member.total_sales || 0),
                    total_revenue: parseFloat(member.total_revenue || 0),
                })),
                totals: {
                    total_members: parseInt(teamTotalsResult.rows[0]?.total_members || 0),
                    total_sales: parseInt(teamTotalsResult.rows[0]?.total_sales || 0),
                    total_revenue: parseFloat(teamTotalsResult.rows[0]?.total_revenue || 0),
                    total_points: parseFloat(teamTotalsResult.rows[0]?.total_points || 0),
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar dashboard da equipe:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    // ========== DASHBOARD COMPLETO (ADMIN) ==========
    async getAdminDashboard() {
        const client = await database_1.pool.connect();
        try {
            const generalStats = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
          (SELECT COUNT(*) FROM sales WHERE status != 'cancelled') as total_sales,
          (SELECT COALESCE(SUM(value), 0) FROM sales WHERE status != 'cancelled') as total_revenue,
          (SELECT COALESCE(SUM(total_commission), 0) FROM commissions WHERE paid = true) as total_commissions_paid
      `);
            const topSellers = await client.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.level,
          COALESCE(MAX(p.accumulated_points), 0) as total_points,
          COALESCE(s.total_sales, 0) as total_sales,
          COALESCE(s.total_revenue, 0) as total_revenue
        FROM users u
        LEFT JOIN points p ON u.id = p.user_id
        LEFT JOIN (
          SELECT user_id, 
                 COUNT(*) as total_sales,
                 SUM(value) as total_revenue
          FROM sales
          WHERE status != 'cancelled'
          GROUP BY user_id
        ) s ON u.id = s.user_id
        WHERE u.is_active = true
        GROUP BY u.id, u.name, u.email, u.level, s.total_sales, s.total_revenue
        ORDER BY total_points DESC
        LIMIT 10
      `);
            const recentSales = await client.query(`
        SELECT 
          s.id,
          s.user_id,
          s.client_id,
          s.value,
          s.kilowatts,
          s.status,
          s.created_at,
          u.name as seller_name,
          c.name as client_name
        FROM sales s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN clients c ON s.client_id = c.id
        ORDER BY s.created_at DESC
        LIMIT 20
      `);
            return {
                stats: {
                    total_users: parseInt(generalStats.rows[0]?.total_users || 0),
                    total_sales: parseInt(generalStats.rows[0]?.total_sales || 0),
                    total_revenue: parseFloat(generalStats.rows[0]?.total_revenue || 0),
                    total_commissions_paid: parseFloat(generalStats.rows[0]?.total_commissions_paid || 0),
                },
                top_sellers: topSellers.rows.map((seller) => ({
                    id: seller.id,
                    name: seller.name,
                    email: seller.email,
                    level: seller.level,
                    total_points: parseFloat(seller.total_points || 0),
                    total_sales: parseInt(seller.total_sales || 0),
                    total_revenue: parseFloat(seller.total_revenue || 0),
                })),
                recent_sales: recentSales.rows.map((sale) => ({
                    id: sale.id,
                    user_id: sale.user_id,
                    client_id: sale.client_id,
                    value: parseFloat(sale.value || 0),
                    kilowatts: parseFloat(sale.kilowatts || 0),
                    status: sale.status,
                    created_at: sale.created_at,
                    seller_name: sale.seller_name,
                    client_name: sale.client_name,
                })),
            };
        }
        catch (error) {
            logger_1.logger.error('Erro ao buscar dashboard admin:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.DashboardService = DashboardService;
exports.dashboardService = new DashboardService();
