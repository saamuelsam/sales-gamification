import { Request, Response, NextFunction } from 'express';

// CEO e Diretor Comercial têm acesso total a tudo
export const verifyCEOMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;

  if (role === 'ceo' || role === 'diretor_comercial') {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Acesso negado: somente CEO ou Diretor Comercial' });
};

// Financeiro, CEO e Diretor Comercial têm acesso à área financeira
export const verifyFinanceiroMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;

  if (role === 'ceo' || role === 'financeiro' || role === 'diretor_comercial') {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Acesso negado: somente área financeira' });
};

// Admin, CEO e Diretor Comercial têm acesso à área admin
export const verifyAdminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;

  if (role === 'ceo' || role === 'admin' || role === 'diretor_comercial') {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Acesso negado: somente administradores' });
};

// Acesso amplo para visualizações (CEO, Admin, Director, Diretor Comercial)
export const verifyAdminViewMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;

  if (role === 'ceo' || role === 'admin' || role === 'director' || role === 'diretor_comercial') {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Acesso negado: somente administradores' });
};
