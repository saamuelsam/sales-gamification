"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTokenMiddleware = void 0;
const jwt_1 = require("../config/jwt");
const responses_1 = require("../utils/responses");
const verifyTokenMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return responses_1.ApiResponse.unauthorized(res, 'Token não fornecido');
        }
        const token = authHeader.split(' ')[1]; // Bearer <token>
        if (!token) {
            return responses_1.ApiResponse.unauthorized(res, 'Token inválido');
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        return responses_1.ApiResponse.unauthorized(res, 'Token inválido ou expirado');
    }
};
exports.verifyTokenMiddleware = verifyTokenMiddleware;
