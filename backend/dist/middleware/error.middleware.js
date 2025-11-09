"use strict";
// backend/src/middleware/role.middleware.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const responses_1 = require("@utils/responses");
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        if (!userRole || !allowedRoles.includes(userRole)) {
            return responses_1.ApiResponse.forbidden(res, 'Acesso negado. Permissão insuficiente.');
        }
        next();
    };
};
exports.requireRole = requireRole;
