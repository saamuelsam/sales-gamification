import { Request, Response, NextFunction } from 'express';

export const verifyAdminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;

  if (role === 'admin' || role === 'ceo' || role === 'director') {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Acesso negado: somente administradores' });
};
