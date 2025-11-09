"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
// src/config/jwt.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET; // força string
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d');
// Geração do token com opções tipadas
const generateToken = (payload) => {
    const options = { expiresIn: JWT_EXPIRES_IN };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
};
exports.generateToken = generateToken;
// Verificação e cast para o payload da aplicação
const verifyToken = (token) => {
    const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    if (typeof decoded === 'string') {
        // Caso improvável (quando o token foi assinado com string pura)
        return JSON.parse(decoded);
    }
    // decoded contém iat/exp além do payload
    const { userId, email, role } = decoded;
    return { userId, email, role };
};
exports.verifyToken = verifyToken;
