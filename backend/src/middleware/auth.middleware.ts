import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyTokenMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    // ✅ Logs minimalistas (sem expor dados sensíveis)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 [AUTH] User ID:', decoded.userId || decoded.id, '| Role:', decoded.role);
    }
    
    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ [AUTH] Token inválido:', error);
    }
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};
