"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdminViewMiddleware = exports.verifyAdminMiddleware = exports.verifyFinanceiroMiddleware = exports.verifyCEOMiddleware = void 0;
// CEO tem acesso total a tudo
const verifyCEOMiddleware = (req, res, next) => {
    const role = req.user?.role;
    if (role === 'ceo') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Acesso negado: somente CEO' });
};
exports.verifyCEOMiddleware = verifyCEOMiddleware;
// Financeiro tem acesso apenas à área financeira (sem admin)
const verifyFinanceiroMiddleware = (req, res, next) => {
    const role = req.user?.role;
    if (role === 'ceo' || role === 'financeiro') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Acesso negado: somente área financeira' });
};
exports.verifyFinanceiroMiddleware = verifyFinanceiroMiddleware;
// Admin tem acesso à área admin com limitações (sem financeiro)
const verifyAdminMiddleware = (req, res, next) => {
    const role = req.user?.role;
    if (role === 'ceo' || role === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Acesso negado: somente administradores' });
};
exports.verifyAdminMiddleware = verifyAdminMiddleware;
// Acesso amplo para visualizações (CEO, Admin, Director)
const verifyAdminViewMiddleware = (req, res, next) => {
    const role = req.user?.role;
    if (role === 'ceo' || role === 'admin' || role === 'director') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Acesso negado: somente administradores' });
};
exports.verifyAdminViewMiddleware = verifyAdminViewMiddleware;
