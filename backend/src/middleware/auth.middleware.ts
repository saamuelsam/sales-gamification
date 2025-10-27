import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { ApiResponse } from '../utils/responses';

export const verifyTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return ApiResponse.unauthorized(res, 'Token não fornecido');
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return ApiResponse.unauthorized(res, 'Token inválido');
    }

    const decoded = verifyToken(token);
    (req as any).user = decoded;

    next();
  } catch (error) {
    return ApiResponse.unauthorized(res, 'Token inválido ou expirado');
  }
};
