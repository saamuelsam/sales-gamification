"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTokenMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyTokenMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        // ✅ LOGS PARA DEBUG
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔐 [AUTH] Token decodificado:', decoded);
        console.log('🔐 [AUTH] User ID extraído:', decoded.userId || decoded.id);
        console.log('🔐 [AUTH] Email:', decoded.email);
        console.log('🔐 [AUTH] Role:', decoded.role);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        req.user = {
            userId: decoded.userId || decoded.id,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        console.error('❌ [AUTH] Erro ao verificar token:', error);
        return res.status(401).json({ message: 'Token inválido' });
    }
};
exports.verifyTokenMiddleware = verifyTokenMiddleware;
