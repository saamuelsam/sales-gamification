"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
// backend/src/modules/users/user.service.ts
const database_1 = require("../../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dashboard_service_1 = require("../dashboard/dashboard.service"); // ⚡ Importa o serviço de níveis
class UserService {
    // ========== DASHBOARD - CORRIGIDO COM CÁLCULO DE NÍVEL E PROGRESSO ==========
    async getDashboard(userId) {
        try {
            console.log('🔍 [getDashboard] userId:', userId, '| Timestamp:', Date.now());
            // 🔹 Busca vendas do usuário
            const salesResult = await database_1.pool.query(`SELECT 
          COALESCE(COUNT(*), 0)::INT as total_sales,
          COALESCE(SUM(value), 0)::NUMERIC as total_revenue,
          COALESCE(SUM(kilowatts), 0)::NUMERIC as total_kilowatts
        FROM sales
        WHERE user_id = $1 
          AND status NOT IN ('cancelled', 'rejected', 'financing_denied')`, [userId]);
            const salesData = salesResult.rows[0];
            console.log('📊 Sales Data:', salesData);
            // 🔹 Busca pontos do usuário
            const userResult = await database_1.pool.query(`SELECT COALESCE(points, 0)::NUMERIC as total_points, role
         FROM users WHERE id = $1`, [userId]);
            const totalPointsRaw = parseFloat(userResult.rows[0]?.total_points || '0');
            const currentRole = userResult.rows[0]?.role || 'consultant';
            // 🔧 Corrige escala (kW → pontos)
            const totalPoints = totalPointsRaw < 10 ? Math.round(totalPointsRaw * 1000) : Math.round(totalPointsRaw);
            console.log('⭐ Points:', totalPoints, '| Role:', currentRole);
            // ⚙️ Calcula o nível baseado nos pontos
            const levelInfo = dashboard_service_1.dashboardService['calculateLevelFromPoints'](totalPoints);
            // 💬 Mapeia nomes legíveis
            const levelDisplayMap = {
                elite: 'Consultor Elite',
                master: 'Master',
                seniorConsultant: 'Consultor Sênior',
                consultorPrime: 'Consultor Prime',
                executive: 'Executive',
            };
            const displayLevel = levelDisplayMap[levelInfo.phaseName] || 'Nível Desconhecido';
            // 📈 Definição das faixas de pontos
            const levelThresholds = {
                elite: { min: 0, next: 1000 },
                master: { min: 1000, next: 10000 },
                seniorConsultant: { min: 10000, next: 800000 },
                consultorPrime: { min: 800000, next: 2000000 },
                executive: { min: 2000000, next: null }, // nível máximo
            };
            const key = levelInfo.phaseName;
            const { min, next } = levelThresholds[key] || { min: 0, next: null };
            // 🔢 Calcula progresso para a barra
            let progress = 0;
            if (next) {
                progress = ((totalPoints - min) / (next - min)) * 100;
                if (progress < 0)
                    progress = 0;
                if (progress > 100)
                    progress = 100;
            }
            // 📊 Equipe
            const teamResult = await database_1.pool.query(`SELECT COUNT(*)::INT as team_members 
         FROM users 
         WHERE parent_id = $1 AND is_active = true`, [userId]);
            // 🔹 Status das vendas
            const statusResult = await database_1.pool.query(`SELECT status, COUNT(*)::INT as count
         FROM sales
         WHERE user_id = $1 AND status NOT IN ('cancelled', 'rejected')
         GROUP BY status`, [userId]);
            // 🔹 Gráfico mensal
            const monthlyResult = await database_1.pool.query(`SELECT 
          TO_CHAR(created_at, 'Mon') as month,
          COUNT(*)::INT as count,
          COALESCE(SUM(value), 0)::NUMERIC as total
         FROM sales
         WHERE user_id = $1 
           AND created_at >= NOW() - INTERVAL '6 months'
           AND status NOT IN ('cancelled', 'rejected')
         GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
         ORDER BY EXTRACT(MONTH FROM created_at)`, [userId]);
            // ✅ Monta o dashboard completo
            const dashboardData = {
                total_sales: parseInt(salesData?.total_sales || '0'),
                total_revenue: parseFloat(salesData?.total_revenue || '0'),
                total_kilowatts: parseFloat(salesData?.total_kilowatts || '0'),
                total_points: totalPoints,
                level: displayLevel, // nome do nível
                progress: parseFloat(progress.toFixed(1)), // progresso da barra em %
                next_level_points: next, // pontos necessários para o próximo nível
                team_members: parseInt(teamResult.rows[0]?.team_members || '0'),
                charts: {
                    byStatus: statusResult.rows.map((row) => ({
                        name: row.status,
                        count: parseInt(row.count),
                    })),
                    monthly: monthlyResult.rows.map((row) => ({
                        month: row.month,
                        count: parseInt(row.count),
                        total: parseFloat(row.total),
                    })),
                },
            };
            console.log('✅ Dashboard retornado:', dashboardData);
            return dashboardData;
        }
        catch (error) {
            console.error('❌ Erro no getDashboard:', error.message, error.stack);
            return {
                total_sales: 0,
                total_revenue: 0,
                total_kilowatts: 0,
                total_points: 0,
                level: 'Consultor Elite',
                progress: 0,
                next_level_points: 1000,
                team_members: 0,
                charts: {
                    byStatus: [],
                    monthly: [],
                },
            };
        }
    }
    // ========== MÉTODOS DE EQUIPE - SEM ALTERAÇÕES ==========
    async addTeamMember(parentId, memberData) {
        const { name, email, password, role = 'consultant' } = memberData;
        if (!parentId)
            throw new Error('Líder não informado');
        if (!name || !email || !password)
            throw new Error('Nome, email e senha são obrigatórios');
        if (password.length < 8)
            throw new Error('Senha deve ter no mínimo 8 caracteres');
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const parentExists = await database_1.pool.query('SELECT id FROM users WHERE id = $1', [parentId]);
        if (parentExists.rows.length === 0)
            throw new Error('Líder não encontrado');
        const emailExists = await database_1.pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
        if (emailExists.rows.length > 0)
            throw new Error('Email já está em uso');
        const result = await database_1.pool.query(`INSERT INTO users (name, email, password, role, parent_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING id, name, email, role, parent_id`, [name, email, hashedPassword, role, parentId]);
        return result.rows[0];
    }
    async getDirectTeamMembers(userId) {
        const result = await database_1.pool.query(`SELECT
        u.id, u.name, u.email, u.role, u.created_at,
        COALESCE(u.points, 0) as total_points,
        COUNT(DISTINCT s.id)::INT as total_sales,
        COALESCE(SUM(s.value), 0)::NUMERIC as total_revenue
      FROM users u
      LEFT JOIN sales s ON s.user_id = u.id AND s.status NOT IN ('cancelled', 'rejected')
      WHERE u.parent_id = $1 AND u.is_active = true
      GROUP BY u.id, u.name, u.email, u.role, u.created_at, u.points
      ORDER BY u.points DESC`, [userId]);
        return result.rows;
    }
    async hasTeam(userId) {
        const result = await database_1.pool.query('SELECT COUNT(*)::INT as count FROM users WHERE parent_id = $1 AND is_active = true', [userId]);
        return result.rows[0].count > 0;
    }
    async getFullNetwork(userId) {
        const result = await database_1.pool.query(`SELECT
        u.id, u.name, u.email, u.role, u.parent_id,
        COALESCE(u.points, 0) as total_points
      FROM users u
      WHERE u.parent_id = $1 OR u.id = $1
      ORDER BY u.name`, [userId]);
        return result.rows;
    }
    async getTeamStats(userId) {
        const directMembers = await database_1.pool.query('SELECT COUNT(*)::INT as count FROM users WHERE parent_id = $1 AND is_active = true', [userId]);
        const teamSales = await database_1.pool.query(`SELECT
        COUNT(DISTINCT s.id)::INT as total_sales,
        COALESCE(SUM(s.value), 0)::NUMERIC as total_revenue,
        COALESCE(SUM(s.kilowatts), 0)::NUMERIC as total_kw
      FROM sales s
      INNER JOIN users u ON u.id = s.user_id
      WHERE u.parent_id = $1 AND s.status NOT IN ('cancelled', 'rejected')`, [userId]);
        const teamPoints = await database_1.pool.query(`SELECT COALESCE(SUM(u.points), 0)::NUMERIC as total_team_points
       FROM users u
       WHERE u.parent_id = $1`, [userId]);
        return {
            direct_members: directMembers.rows[0].count,
            team_sales: teamSales.rows[0],
            team_points: parseFloat(teamPoints.rows[0].total_team_points || '0'),
        };
    }
    async list() {
        const result = await database_1.pool.query(`SELECT id, name, email, role, created_at, is_active 
       FROM users 
       ORDER BY created_at DESC`);
        return result.rows;
    }
    async findById(id) {
        const result = await database_1.pool.query(`SELECT id, name, email, role, points, parent_id, is_active, created_at
       FROM users WHERE id = $1`, [id]);
        return result.rows[0] || null;
    }
    async update(id, data) {
        const { name, email, role } = data;
        const result = await database_1.pool.query(`UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email), 
           role = COALESCE($3, role),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`, [name, email, role, id]);
        return result.rows[0];
    }
    async remove(id) {
        await database_1.pool.query(`UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1`, [id]);
        return true;
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
