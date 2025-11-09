"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logErrorWithUser = logErrorWithUser;
const winston_1 = __importDefault(require("winston"));
const database_1 = require("../config/database");
/**
 * ✅ Criação do logger Winston
 */
exports.logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
    ],
});
// ✅ Adicionar saída no console em modo dev
if (process.env.NODE_ENV !== 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
    }));
}
/**
 * ✅ Método auxiliar — verifica se a tabela activity_logs existe
 */
async function checkTableExists() {
    try {
        const result = await database_1.pool.query(`SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'activity_logs'
       )`);
        return result.rows[0]?.exists || false;
    }
    catch {
        return false;
    }
}
/**
 * ✅ Salva erros críticos no banco
 */
async function saveErrorToDatabase(message, meta) {
    try {
        const metadata = {
            message,
            meta: meta.length > 0 ? meta : null,
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
        };
        const tableExists = await checkTableExists();
        if (!tableExists)
            return;
        await database_1.pool.query(`INSERT INTO activity_logs (user_id, action, metadata, created_at)
       VALUES ($1, $2, $3, NOW())`, [null, 'Erro crítico do sistema', JSON.stringify(metadata)]);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`📝 [ERROR_LOG] Erro salvo no banco: ${message}`);
        }
    }
    catch (err) {
        console.error('⚠️ Falha ao salvar erro no banco:', err.message);
    }
}
/**
 * ✅ Sobrescreve logger.error com compatibilidade total de tipos
 */
const originalError = exports.logger.error.bind(exports.logger);
exports.logger.error = ((message, ...meta) => {
    const msg = message instanceof Error ? message.message : String(message);
    // log original do Winston
    originalError(msg, ...meta);
    // grava no banco de forma assíncrona
    saveErrorToDatabase(msg, meta).catch((err) => console.error('⚠️ Erro ao persistir log no banco:', err.message));
});
/**
 * ✅ Log de erros com contexto de usuário
 */
async function logErrorWithUser(userId, error, context) {
    const msg = error.message || 'Erro desconhecido';
    exports.logger.error(msg, { userId, context, stack: error.stack });
    try {
        const tableExists = await checkTableExists();
        if (!tableExists)
            return;
        await database_1.pool.query(`INSERT INTO activity_logs (user_id, action, metadata, created_at)
       VALUES ($1, $2, $3, NOW())`, [
            userId,
            'Erro na operação do usuário',
            JSON.stringify({
                message: msg,
                stack: error.stack,
                context,
                userId,
                timestamp: new Date().toISOString(),
            }),
        ]);
    }
    catch (dbError) {
        console.error('⚠️ Erro ao salvar log de erro no banco:', dbError.message);
    }
}
