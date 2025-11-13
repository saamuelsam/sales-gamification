"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const sales_routes_1 = __importDefault(require("./modules/sales/sales.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const clients_routes_1 = __importDefault(require("./modules/clients/clients.routes"));
const notifications_routes_1 = __importDefault(require("./modules/notifications/notifications.routes"));
const level_routes_1 = __importDefault(require("./modules/levels/level.routes"));
const user_routes_1 = __importDefault(require("./modules/users/user.routes"));
const team_routes_1 = __importDefault(require("./modules/team/team.routes"));
const commission_routes_1 = __importDefault(require("./modules/commissions/commission.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const benefit_routes_1 = __importDefault(require("./modules/benefits/benefit.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// ✅ CORS COMPLETO - Permitir headers customizados
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://localhost:4000',
            'https://sales-gamification-indol.vercel.app',
            'https://sales.sesfortal.com.br', // 👈 adiciona o domínio de produção
            process.env.FRONTEND_URL
        ].filter(Boolean);
        // Se não tiver origin (requests diretas, mobile, etc), liberar
        if (!origin || allowedOrigins.includes(origin) || (origin && origin.includes('.vercel.app'))) {
            callback(null, true);
        }
        else {
            console.warn(`❌ CORS bloqueado: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Cache-Control',
        'Pragma',
        'Expires',
        'X-Requested-With',
        'X-Custom-Header'
    ],
    maxAge: 86400, // 24 horas cache do preflight
    optionsSuccessStatus: 200
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ✅ Middleware de Cache Control (aplicado em todas as respostas)
app.use((req, res, next) => {
    // Para requisições GET, permitir cache apenas no navegador, não em proxies
    if (req.method === 'GET' && !req.path.includes('/api/')) {
        res.set('Cache-Control', 'private, max-age=3600'); // 1 hora
    }
    else {
        // Para API, nunca cachear
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
    // Headers de segurança
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    next();
});
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// ✅ Rotas da API
app.use('/api/team', team_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/sales', sales_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/clients', clients_routes_1.default);
app.use('/api/notifications', notifications_routes_1.default);
app.use('/api/levels', level_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/commissions', commission_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/benefits', benefit_routes_1.default);
// ✅ Middleware de erro global
app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado:', {
        message: err.message,
        status: err.status || 500,
        path: req.path,
        method: req.method
    });
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : err.message,
        timestamp: new Date().toISOString()
    });
});
// ✅ Rota 404
app.use((req, res) => {
    console.warn(`⚠️ Rota não encontrada: ${req.method} ${req.path}`);
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});
exports.default = app;
