"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = void 0;
const requireRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Acesso negado' });
        }
        next();
    };
};
exports.requireRoles = requireRoles;
