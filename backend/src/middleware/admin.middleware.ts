import { Request, Response, NextFunction } from 'express';

// CEO tem acesso total a tudo
export const verifyCEOMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;

  if (role === 'ceo') {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Acesso negado: somente CEO' });
};

// Financeiro tem acesso apenas à área financeira (sem admin)
export const verifyFinanceiroMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;

  if (role === 'ceo' || role === 'financeiro') {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Acesso negado: somente área financeira' });
};

// Admin tem acesso à área admin com limitações (sem financeiro)
export const verifyAdminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;

  if (role === 'ceo' || role === 'admin') {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Acesso negado: somente administradores' });
};

// Acesso amplo para visualizações (CEO, Admin, Director)
export const verifyAdminViewMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;

  if (role === 'ceo' || role === 'admin' || role === 'director') {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Acesso negado: somente administradores' });
};
