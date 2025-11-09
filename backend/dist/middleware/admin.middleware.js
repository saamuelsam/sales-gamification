"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdminMiddleware = void 0;
const verifyAdminMiddleware = (req, res, next) => {
    const role = req.user?.role;
    if (role === 'admin' || role === 'ceo' || role === 'director') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Acesso negado: somente administradores' });
};
exports.verifyAdminMiddleware = verifyAdminMiddleware;
