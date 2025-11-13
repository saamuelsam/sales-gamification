import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyTokenMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    // ✅ LOGS PARA DEBUG
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 [AUTH] Token decodificado:', decoded);
    console.log('🔐 [AUTH] User ID extraído:', decoded.userId || decoded.id);
    console.log('🔐 [AUTH] Email:', decoded.email);
    console.log('🔐 [AUTH] Role:', decoded.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    console.error('❌ [AUTH] Erro ao verificar token:', error);
    return res.status(401).json({ message: 'Token inválido' });
  }
};
